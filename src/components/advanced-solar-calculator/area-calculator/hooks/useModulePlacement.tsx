
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SolarPanel } from '@/types/components';
import { PolygonInfo, PolygonConfig, LayoutParameters, StructureType } from '../types';
import { calculatePolygonArea } from '../utils/geometryUtils';

interface UseModulePlacementProps {
  polygons: PolygonInfo[];
  selectedPanel: SolarPanel;
  map: google.maps.Map | null;
  moduleCount: number;
  structureType: StructureType;
  layoutParams: LayoutParameters;
  onCapacityCalculated: (capacityKw: number, areaM2: number, moduleCount: number, configs?: PolygonConfig[]) => void;
  totalArea: number;
}

interface PlacedModule {
  rectangle: google.maps.Rectangle;
  polygon: google.maps.Polygon;
  center: google.maps.LatLng;
  polygonIndex: number;
}

export const useModulePlacement = ({
  polygons,
  selectedPanel,
  map,
  moduleCount,
  structureType,
  layoutParams,
  onCapacityCalculated,
  totalArea
}: UseModulePlacementProps) => {
  const [placedModuleCount, setPlacedModuleCount] = useState(0);
  const [placedModulesPerPolygon, setPlacedModulesPerPolygon] = useState<Record<number, number>>({});
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [polygonConfigs, setPolygonConfigs] = useState<PolygonConfig[]>([]);
  const moduleRectanglesRef = useRef<google.maps.Rectangle[]>([]);
  const moduleCalculationPerformedRef = useRef(true);
  const [isCalculating, setIsCalculating] = useState(false);

  // Clear existing module rectangles
  const clearModuleRectangles = useCallback(() => {
    moduleRectanglesRef.current.forEach(rect => {
      if (rect) rect.setMap(null);
    });
    moduleRectanglesRef.current = [];
  }, []);

  // Calculate module placement
  const calculateModulePlacement = useCallback(() => {
    if (!map || polygons.length === 0 || !selectedPanel || moduleCount === 0 || isCalculating) {
      return;
    }

    setIsCalculating(true);
    clearModuleRectangles();

    // Initialize counters and storage
    let currentPlacedCount = 0;
    const modulesPerPolygon: Record<number, number> = {};
    const placedModules: PlacedModule[] = [];
    const updatedPolygonConfigs: PolygonConfig[] = [];

    // Get panel dimensions
    const defaultLength = 1700; // mm
    const defaultWidth = 1000; // mm
    
    // Safely extract dimensions with proper type checking
    let panelLength = defaultLength;
    let panelWidth = defaultWidth;
    
    if ('length' in selectedPanel && typeof selectedPanel.length === 'number') {
      panelLength = selectedPanel.length;
    } else if (selectedPanel.dimensions?.height) {
      panelLength = selectedPanel.dimensions.height;
    }
    
    if ('width' in selectedPanel && typeof selectedPanel.width === 'number') {
      panelWidth = selectedPanel.width;
    } else if (selectedPanel.dimensions?.width) {
      panelWidth = selectedPanel.dimensions.width;
    }

    // Module dimensions (meters)
    const panelLengthM = panelLength / 1000;
    const panelWidthM = panelWidth / 1000;
    const adjacentGapM = layoutParams.adjacentGap / 1000;

    // Set module dimensions based on orientation
    const moduleDim = layoutParams.orientation === 'landscape'
      ? { width: panelLengthM, height: panelWidthM }
      : { width: panelWidthM, height: panelLengthM };
    
    const moduleWidthWithGap = moduleDim.width + adjacentGapM;

    // Process each polygon
    for (const [polyIndex, polyInfo] of polygons.entries()) {
      if (currentPlacedCount >= moduleCount) break;
      
      // Initialize counter for this polygon
      modulesPerPolygon[polyIndex] = 0;
      
      const polygon = polyInfo.polygon;
      const polygonAzimuth = polyInfo.azimuth || 180; // Default to south if not set
      
      // Calculate polygon centroid
      const path = polygon.getPath();
      if (!path || path.getLength() < 3) continue;
      
      // Calculate the polygon centroid
      let centerLat = 0;
      let centerLng = 0;
      const vertexCount = path.getLength();
      
      for (let i = 0; i < vertexCount; i++) {
        const vertex = path.getAt(i)!;
        centerLat += vertex.lat();
        centerLng += vertex.lng();
      }
      
      centerLat /= vertexCount;
      centerLng /= vertexCount;
      const centroid = new google.maps.LatLng(centerLat, centerLng);

      // Check if the centroid is inside the polygon
      let startPoint = centroid;
      if (!google.maps.geometry.poly.containsLocation(centroid, polygon)) {
        // Fallback to the first vertex if centroid is outside
        const firstVertex = path.getAt(0)!;
        startPoint = firstVertex;
      }

      // Different placement strategies based on structure type
      switch (structureType.id) {
        case 'ballasted': 
          placeBallasted(
            polygon, 
            polyIndex, 
            startPoint, 
            moduleDim, 
            moduleWidthWithGap, 
            layoutParams.interRowSpacing,
            polygonAzimuth,
            modulesPerPolygon,
            placedModules,
            currentPlacedCount,
            moduleCount
          );
          break;

        case 'fixed_tilt':
          placeFixedTilt(
            polygon, 
            polyIndex, 
            startPoint, 
            moduleDim, 
            moduleWidthWithGap, 
            layoutParams.interRowSpacing,
            polygonAzimuth,
            modulesPerPolygon,
            placedModules,
            currentPlacedCount,
            moduleCount
          );
          break;

        case 'ground_mount_tables':
          // Use ground mount tables specific layout if table config is available
          if (layoutParams.tableConfig) {
            placeGroundMountTables(
              polygon,
              polyIndex,
              startPoint,
              moduleDim,
              moduleWidthWithGap,
              layoutParams.interRowSpacing,
              layoutParams.tableConfig,
              polygonAzimuth,
              modulesPerPolygon,
              placedModules,
              currentPlacedCount,
              moduleCount
            );
          } else {
            // Fallback to fixed tilt if no table config
            placeFixedTilt(
              polygon, 
              polyIndex, 
              startPoint, 
              moduleDim, 
              moduleWidthWithGap, 
              layoutParams.interRowSpacing,
              polygonAzimuth,
              modulesPerPolygon,
              placedModules,
              currentPlacedCount,
              moduleCount
            );
          }
          break;

        case 'carport':
          // Use carport specific layout if carport config is available
          if (layoutParams.carportConfig) {
            placeCarport(
              polygon,
              polyIndex,
              startPoint,
              moduleDim,
              moduleWidthWithGap,
              layoutParams.interRowSpacing,
              layoutParams.carportConfig,
              polygonAzimuth,
              modulesPerPolygon,
              placedModules,
              currentPlacedCount,
              moduleCount
            );
          } else {
            // Fallback to standard layout if no carport config
            placeBallasted(
              polygon, 
              polyIndex, 
              startPoint, 
              moduleDim, 
              moduleWidthWithGap, 
              layoutParams.interRowSpacing,
              polygonAzimuth,
              modulesPerPolygon,
              placedModules,
              currentPlacedCount,
              moduleCount
            );
          }
          break;

        default:
          // Default to ballasted for unknown types
          placeBallasted(
            polygon, 
            polyIndex, 
            startPoint, 
            moduleDim, 
            moduleWidthWithGap, 
            layoutParams.interRowSpacing,
            polygonAzimuth,
            modulesPerPolygon,
            placedModules,
            currentPlacedCount,
            moduleCount
          );
      }

      // Create polygon configuration
      const placedModulesCount = modulesPerPolygon[polyIndex] || 0;
      const capacity = (placedModulesCount * (selectedPanel.power_rating || 400)) / 1000; // kW
      
      updatedPolygonConfigs.push({
        id: polyIndex,
        area: polyInfo.area,
        azimuth: polygonAzimuth,
        capacityKw: capacity,
        moduleCount: placedModulesCount,
        structureType: structureType.id,
        tiltAngle: layoutParams.tiltAngle
      });

      // Update total placed count
      currentPlacedCount += placedModulesCount;
    }

    // Draw all modules
    placedModules.forEach(module => {
      if (map) module.rectangle.setMap(map);
      moduleRectanglesRef.current.push(module.rectangle);
    });

    // Calculate total capacity
    const totalCapacity = updatedPolygonConfigs.reduce((sum, config) => sum + config.capacityKw, 0);

    // Update state
    setPlacedModuleCount(currentPlacedCount);
    setPlacedModulesPerPolygon(modulesPerPolygon);
    setTotalCapacity(totalCapacity);
    setPolygonConfigs(updatedPolygonConfigs);

    // Notify parent component
    if (onCapacityCalculated) {
      onCapacityCalculated(totalCapacity, totalArea, currentPlacedCount, updatedPolygonConfigs);
    }

    setIsCalculating(false);
  }, [map, polygons, selectedPanel, moduleCount, structureType, layoutParams, totalArea, onCapacityCalculated, clearModuleRectangles, isCalculating]);

  // Define the placement functions before they are used
  
  // Ballasted module placement strategy (rows with consistent orientation)
  function placeBallasted(
    polygon: google.maps.Polygon,
    polyIndex: number,
    startPoint: google.maps.LatLng,
    moduleDim: { width: number; height: number },
    moduleWidthWithGap: number,
    interRowSpacing: number,
    azimuth: number,
    modulesPerPolygon: Record<number, number>,
    placedModules: PlacedModule[],
    currentPlacedCount: number,
    moduleCount: number
  ) {
    if (!google.maps.geometry || !google.maps.geometry.spherical) return;
    
    const { spherical } = google.maps.geometry;
    const { poly } = google.maps.geometry;
    
    // Row spacing includes the module height
    const effectiveRowSpacing = moduleDim.height + interRowSpacing;
    
    // Calculate headings for grid layout
    const rowHeading = azimuth;
    const colHeading = (azimuth + 90) % 360;
    
    // Grid search parameters
    const maxSearchDistance = 500; // meters
    const rowDirections = [rowHeading, (rowHeading + 180) % 360]; // North/South
    const colDirections = [colHeading, (colHeading + 180) % 360]; // East/West
    
    // Track placed module centers to avoid overlap
    const placedModuleCenters: google.maps.LatLng[] = [];
    
    // Search in a grid pattern from the start point
    for (const rowDirection of rowDirections) {
      let rowStart = startPoint;
      let rowDistance = 0;
      
      // Expand rows outward
      while (currentPlacedCount + modulesPerPolygon[polyIndex] < moduleCount && rowDistance < maxSearchDistance) {
        for (const colDirection of colDirections) {
          let colCenter = rowStart;
          let colDistance = 0;
          
          // Place modules along row
          while (currentPlacedCount + modulesPerPolygon[polyIndex] < moduleCount && colDistance < maxSearchDistance) {
            // Check if center is inside polygon
            if (poly.containsLocation(colCenter, polygon)) {
              // Calculate module corners
              const corners = calculateModuleCorners(colCenter, moduleDim.width, moduleDim.height, azimuth);
              
              // Check if all corners are inside the polygon
              const allCornersInside = corners.every(corner => poly.containsLocation(corner, polygon));
              
              if (allCornersInside) {
                // Create module rectangle with correct rotation
                const rectangle = createModuleRectangle(corners, '#3399FF');
                
                // Create the module
                placedModules.push({
                  rectangle,
                  polygon: new google.maps.Polygon({
                    paths: corners,
                    strokeColor: '#003366',
                    strokeOpacity: 0.8,
                    strokeWeight: 1,
                    fillColor: '#3399FF',
                    fillOpacity: 0.6,
                  }),
                  center: colCenter,
                  polygonIndex: polyIndex
                });
                
                // Track placed module
                placedModuleCenters.push(colCenter);
                
                // Update module count
                modulesPerPolygon[polyIndex] = (modulesPerPolygon[polyIndex] || 0) + 1;
                
                // Break if we've reached the module count
                if (currentPlacedCount + modulesPerPolygon[polyIndex] >= moduleCount) {
                  break;
                }
              }
            }
            
            // Move to next position in column
            colCenter = spherical.computeOffset(colCenter, moduleWidthWithGap, colDirection);
            colDistance += moduleWidthWithGap;
          }
        }
        
        // Move to next row
        rowStart = spherical.computeOffset(rowStart, effectiveRowSpacing, rowDirection);
        rowDistance += effectiveRowSpacing;
      }
    }
  }

  // Fixed tilt module placement strategy (similar to ballasted but with different row spacing)
  function placeFixedTilt(
    polygon: google.maps.Polygon,
    polyIndex: number,
    startPoint: google.maps.LatLng,
    moduleDim: { width: number; height: number },
    moduleWidthWithGap: number,
    interRowSpacing: number,
    azimuth: number,
    modulesPerPolygon: Record<number, number>,
    placedModules: PlacedModule[],
    currentPlacedCount: number,
    moduleCount: number
  ) {
    // Fixed tilt uses same algorithm as ballasted but with different row spacing
    // This could be extended to include tilt-specific optimizations
    placeBallasted(
      polygon, 
      polyIndex, 
      startPoint, 
      moduleDim, 
      moduleWidthWithGap, 
      interRowSpacing, 
      azimuth,
      modulesPerPolygon,
      placedModules,
      currentPlacedCount,
      moduleCount
    );
  }

  // Ground mount tables placement strategy (groups of modules in tables)
  function placeGroundMountTables(
    polygon: google.maps.Polygon,
    polyIndex: number,
    startPoint: google.maps.LatLng,
    moduleDim: { width: number; height: number },
    moduleWidthWithGap: number,
    intraTableRowSpacing: number,
    tableConfig: {
      rowsPerTable: number;
      modulesPerRow: number;
      interTableSpacingY: number;
      interTableSpacingX: number;
    },
    azimuth: number,
    modulesPerPolygon: Record<number, number>,
    placedModules: PlacedModule[],
    currentPlacedCount: number,
    moduleCount: number
  ) {
    if (!google.maps.geometry || !google.maps.geometry.spherical) return;
    
    const { spherical } = google.maps.geometry;
    const { poly } = google.maps.geometry;
    
    // Calculate table dimensions
    const rowsPerTable = tableConfig.rowsPerTable;
    const modulesPerRow = tableConfig.modulesPerRow;
    
    // Table width and height
    const tableWidth = modulesPerRow * moduleWidthWithGap;
    const tableHeight = (rowsPerTable * moduleDim.height) + ((rowsPerTable - 1) * intraTableRowSpacing);
    const modulesPerTable = rowsPerTable * modulesPerRow;
    
    // Table spacing includes the table height
    const effectiveRowSpacing = tableHeight + tableConfig.interTableSpacingY;
    
    // Calculate headings for grid layout
    const rowHeading = azimuth;
    const colHeading = (azimuth + 90) % 360;
    
    // Grid search parameters
    const maxSearchDistance = 500; // meters
    const rowDirections = [rowHeading, (rowHeading + 180) % 360];
    const colDirections = [colHeading, (colHeading + 180) % 360];
    
    // Track placed table centers to avoid overlap
    const placedTableCenters: google.maps.LatLng[] = [];
    
    // Search in a grid pattern from the start point
    for (const rowDirection of rowDirections) {
      let rowStart = startPoint;
      let rowDistance = 0;
      
      // Expand rows outward
      while (currentPlacedCount + modulesPerPolygon[polyIndex] < moduleCount && rowDistance < maxSearchDistance) {
        for (const colDirection of colDirections) {
          let tableCenter = rowStart;
          let colDistance = 0;
          
          // Place tables along row
          while (currentPlacedCount + modulesPerPolygon[polyIndex] < moduleCount && colDistance < maxSearchDistance) {
            // Check if table center is inside polygon
            if (poly.containsLocation(tableCenter, polygon)) {
              // Calculate table corners
              const tableCorners = calculateTableCorners(tableCenter, tableWidth, tableHeight, azimuth);
              
              // Check if all table corners are inside the polygon
              const tableInsidePolygon = tableCorners.every(corner => poly.containsLocation(corner, polygon));
              
              if (tableInsidePolygon) {
                // Create table outline
                const tablePolygon = new google.maps.Polygon({
                  paths: tableCorners,
                  strokeColor: '#FF0000',
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  fillColor: '#FF0000',
                  fillOpacity: 0.05,
                });
                
                // Place modules within the table
                const allModuleCenters: google.maps.LatLng[] = [];
                
                // Create modules within the table
                for (let row = 0; row < rowsPerTable; row++) {
                  // Calculate row position relative to table center
                  const rowPosition = row - (rowsPerTable - 1) / 2;
                  const rowOffset = rowPosition * (moduleDim.height + intraTableRowSpacing);
                  
                  // Calculate row center
                  const rowCenter = spherical.computeOffset(
                    tableCenter,
                    Math.abs(rowOffset),
                    rowOffset < 0 ? (rowHeading + 180) % 360 : rowHeading
                  );
                  
                  // Place modules in this row
                  for (let col = 0; col < modulesPerRow; col++) {
                    // Stop if we've reached the module count
                    if (currentPlacedCount + modulesPerPolygon[polyIndex] >= moduleCount) {
                      break;
                    }
                    
                    // Calculate module position within row
                    const colPosition = col - (modulesPerRow - 1) / 2;
                    const colOffset = colPosition * moduleWidthWithGap;
                    
                    // Calculate module center
                    const moduleCenter = spherical.computeOffset(
                      rowCenter,
                      Math.abs(colOffset),
                      colOffset < 0 ? (colHeading + 180) % 360 : colHeading
                    );
                    
                    // Calculate module corners
                    const corners = calculateModuleCorners(moduleCenter, moduleDim.width, moduleDim.height, azimuth);
                    
                    // Create the module rectangle
                    const rectangle = createModuleRectangle(corners, '#3399FF');
                    
                    // Add to placed modules
                    placedModules.push({
                      rectangle,
                      polygon: tablePolygon,
                      center: moduleCenter,
                      polygonIndex: polyIndex
                    });
                    
                    // Track module center
                    allModuleCenters.push(moduleCenter);
                    
                    // Update module count
                    modulesPerPolygon[polyIndex] = (modulesPerPolygon[polyIndex] || 0) + 1;
                  }
                }
                
                // Track placed table center
                placedTableCenters.push(tableCenter);
              }
            }
            
            // Move to next table position
            tableCenter = spherical.computeOffset(
              tableCenter, 
              tableWidth + tableConfig.interTableSpacingX, 
              colDirection
            );
            colDistance += tableWidth + tableConfig.interTableSpacingX;
          }
        }
        
        // Move to next row
        rowStart = spherical.computeOffset(rowStart, effectiveRowSpacing, rowDirection);
        rowDistance += effectiveRowSpacing;
      }
    }
  }

  // Carport module placement strategy
  function placeCarport(
    polygon: google.maps.Polygon,
    polyIndex: number,
    startPoint: google.maps.LatLng,
    moduleDim: { width: number; height: number },
    moduleWidthWithGap: number,
    interRowSpacing: number,
    carportConfig: {
      rows: number;
      modulesPerRow: number;
      forceRectangle: boolean;
    },
    azimuth: number,
    modulesPerPolygon: Record<number, number>,
    placedModules: PlacedModule[],
    currentPlacedCount: number,
    moduleCount: number
  ) {
    if (!google.maps.geometry || !google.maps.geometry.spherical) return;
    
    const { spherical } = google.maps.geometry;
    const { poly } = google.maps.geometry;
    
    // Calculate carport dimensions
    const rows = carportConfig.rows;
    const modulesPerRow = carportConfig.modulesPerRow;
    
    // Carport width and height
    const carportWidth = modulesPerRow * moduleWidthWithGap;
    const carportHeight = rows * moduleDim.height; // No spacing between rows in a carport
    const modulesPerCarport = rows * modulesPerRow;
    
    // Carport spacing (between separate carports)
    const effectiveRowSpacing = carportHeight * 1.2; // 20% buffer between carports
    
    // Calculate headings for grid layout
    const rowHeading = azimuth;
    const colHeading = (azimuth + 90) % 360;
    
    // Grid search parameters
    const maxSearchDistance = 500; // meters
    const rowDirections = [rowHeading, (rowHeading + 180) % 360];
    const colDirections = [colHeading, (colHeading + 180) % 360];
    
    // Track placed carport centers to avoid overlap
    const placedCarportCenters: google.maps.LatLng[] = [];
    
    // Search in a grid pattern from the start point
    for (const rowDirection of rowDirections) {
      let rowStart = startPoint;
      let rowDistance = 0;
      
      // Expand rows outward
      while (currentPlacedCount + modulesPerPolygon[polyIndex] < moduleCount && rowDistance < maxSearchDistance) {
        for (const colDirection of colDirections) {
          let carportCenter = rowStart;
          let colDistance = 0;
          
          // Place carports along row
          while (currentPlacedCount + modulesPerPolygon[polyIndex] < moduleCount && colDistance < maxSearchDistance) {
            // Check if carport center is inside polygon
            if (poly.containsLocation(carportCenter, polygon)) {
              // Calculate carport corners
              const carportCorners = calculateTableCorners(carportCenter, carportWidth, carportHeight, azimuth);
              
              // Check if all carport corners are inside the polygon
              const carportInsidePolygon = carportCorners.every(corner => poly.containsLocation(corner, polygon));
              
              if (carportInsidePolygon) {
                // Create carport outline
                const carportPolygon = new google.maps.Polygon({
                  paths: carportCorners,
                  strokeColor: '#4B0082', // Indigo for carport
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  fillColor: '#4B0082',
                  fillOpacity: 0.1,
                });
                
                // Place modules within the carport
                const allModuleCenters: google.maps.LatLng[] = [];
                
                // Create modules within the carport
                for (let row = 0; row < rows; row++) {
                  // Calculate row position relative to carport center
                  const rowPosition = row - (rows - 1) / 2;
                  const rowOffset = rowPosition * moduleDim.height; // No spacing between rows
                  
                  // Calculate row center
                  const rowCenter = spherical.computeOffset(
                    carportCenter,
                    Math.abs(rowOffset),
                    rowOffset < 0 ? (rowHeading + 180) % 360 : rowHeading
                  );
                  
                  // Place modules in this row
                  for (let col = 0; col < modulesPerRow; col++) {
                    // Stop if we've reached the module count
                    if (currentPlacedCount + modulesPerPolygon[polyIndex] >= moduleCount) {
                      break;
                    }
                    
                    // Calculate module position within row
                    const colPosition = col - (modulesPerRow - 1) / 2;
                    const colOffset = colPosition * moduleWidthWithGap;
                    
                    // Calculate module center
                    const moduleCenter = spherical.computeOffset(
                      rowCenter,
                      Math.abs(colOffset),
                      colOffset < 0 ? (colHeading + 180) % 360 : colHeading
                    );
                    
                    // Calculate module corners
                    const corners = calculateModuleCorners(moduleCenter, moduleDim.width, moduleDim.height, azimuth);
                    
                    // Create the module rectangle
                    const rectangle = createModuleRectangle(corners, '#3399FF');
                    
                    // Add to placed modules
                    placedModules.push({
                      rectangle,
                      polygon: carportPolygon,
                      center: moduleCenter,
                      polygonIndex: polyIndex
                    });
                    
                    // Track module center
                    allModuleCenters.push(moduleCenter);
                    
                    // Update module count
                    modulesPerPolygon[polyIndex] = (modulesPerPolygon[polyIndex] || 0) + 1;
                  }
                }
                
                // Track placed carport center
                placedCarportCenters.push(carportCenter);
              }
            }
            
            // Move to next carport position
            carportCenter = spherical.computeOffset(
              carportCenter, 
              carportWidth * 1.05, // 5% spacing between adjacent carports
              colDirection
            );
            colDistance += carportWidth * 1.05;
          }
        }
        
        // Move to next row
        rowStart = spherical.computeOffset(rowStart, effectiveRowSpacing, rowDirection);
        rowDistance += effectiveRowSpacing;
      }
    }
  }

  // Helper function to calculate module corners
  function calculateModuleCorners(
    center: google.maps.LatLng,
    width: number,
    height: number,
    azimuth: number
  ): google.maps.LatLng[] {
    const { spherical } = google.maps.geometry;
    const azimuthRad = (azimuth * Math.PI) / 180;
    
    // Calculate half dimensions
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    // Calculate the distance from center to corner
    const cornerDist = Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight);
    
    // Calculate the angle offset from the azimuth direction to the corner
    const angleOffset = Math.atan2(halfWidth, halfHeight);
    
    // Calculate the heading to each corner (in degrees)
    const neHeading = azimuth - (angleOffset * 180 / Math.PI);
    const nwHeading = azimuth - (angleOffset * 180 / Math.PI) + 180;
    const seHeading = azimuth + (angleOffset * 180 / Math.PI);
    const swHeading = azimuth + (angleOffset * 180 / Math.PI) + 180;
    
    // Calculate the coordinates of each corner
    const ne = spherical.computeOffset(center, cornerDist, neHeading);
    const nw = spherical.computeOffset(center, cornerDist, nwHeading);
    const se = spherical.computeOffset(center, cornerDist, seHeading);
    const sw = spherical.computeOffset(center, cornerDist, swHeading);
    
    // Return corners in clockwise order
    return [ne, se, sw, nw];
  }

  // Helper function to calculate table corners
  function calculateTableCorners(
    center: google.maps.LatLng,
    width: number,
    height: number,
    azimuth: number
  ): google.maps.LatLng[] {
    // Same logic as module corners, just different dimensions
    return calculateModuleCorners(center, width, height, azimuth);
  }

  // Helper function to create a module rectangle
  function createModuleRectangle(
    corners: google.maps.LatLng[],
    fillColor: string
  ): google.maps.Rectangle {
    // Create a bounds object from the corners
    const bounds = new google.maps.LatLngBounds();
    corners.forEach(corner => bounds.extend(corner));
    
    // Create the rectangle
    return new google.maps.Rectangle({
      strokeColor: '#003366',
      strokeOpacity: 0.8,
      strokeWeight: 1,
      fillColor: fillColor,
      fillOpacity: 0.6,
      clickable: false,
      bounds: bounds,
    });
  }

  // Memoized function to trigger calculation
  const triggerModuleCalculation = useCallback(() => {
    if (moduleCalculationPerformedRef.current) {
      calculateModulePlacement();
      moduleCalculationPerformedRef.current = false;
    }
  }, [calculateModulePlacement]);

  // Reset calculation flag when dependencies change
  useEffect(() => {
    moduleCalculationPerformedRef.current = true;
  }, [selectedPanel, moduleCount, layoutParams, structureType, polygons]);

  // Clear modules when component unmounts
  useEffect(() => {
    return () => {
      clearModuleRectangles();
    };
  }, [clearModuleRectangles]);

  return {
    placedModuleCount,
    placedModulesPerPolygon,
    totalCapacity,
    polygonConfigs,
    moduleRectanglesRef,
    moduleCalculationPerformedRef,
    triggerModuleCalculation
  };
};
