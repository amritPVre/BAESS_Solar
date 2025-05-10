
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import type { SolarPanel } from '@/types/components';
import { PolygonInfo, StructureType, LayoutParameters, PolygonConfig } from '../types';

interface UseModulePlacementProps {
  map: google.maps.Map | null;
  polygons: PolygonInfo[];
  selectedPanel: SolarPanel | null;
  moduleCount: number;
  structureType: StructureType;
  layoutParams: LayoutParameters;
  totalArea: number;
  onCapacityCalculated: (capacityKw: number, areaM2: number, moduleCount: number, configs?: PolygonConfig[]) => void;
}

export const useModulePlacement = ({
  map,
  polygons,
  selectedPanel,
  moduleCount,
  structureType,
  layoutParams,
  totalArea,
  onCapacityCalculated
}: UseModulePlacementProps) => {
  const [placedModuleCount, setPlacedModuleCount] = useState(0);
  const [placedModulesPerPolygon, setPlacedModulesPerPolygon] = useState<Record<number, number>>({});
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [polygonConfigs, setPolygonConfigs] = useState<PolygonConfig[]>([]);
  
  // Use refs to track calculation state and prevent infinite loops
  const calculationInProgressRef = useRef(false);
  const calculationQueuedRef = useRef(false);
  const moduleRectanglesRef = useRef<google.maps.Rectangle[]>([]);
  const prevPropsRef = useRef({
    polygonsLength: 0,
    moduleCount: 0,
    structureTypeId: '',
    layoutParamsHash: ''
  });
  const calculateTimeoutRef = useRef<number | null>(null);
  const skipNextCalculationRef = useRef(false);
  const moduleCalculationPerformedRef = useRef(true);
  
  // Helper to clear existing module rectangles
  const clearModuleRectangles = useCallback(() => {
    if (moduleRectanglesRef.current.length === 0) return;
    
    console.log(`Clearing ${moduleRectanglesRef.current.length} module rectangles`);
    
    moduleRectanglesRef.current.forEach(rect => {
      if (rect) {
        try {
          rect.setMap(null);
        } catch (e) {
          console.error("Error clearing rectangle:", e);
        }
      }
    });
    moduleRectanglesRef.current = [];
  }, []);

  // Function to calculate layout parameters hash for comparison
  const getLayoutParamsHash = useCallback((params: LayoutParameters): string => {
    return JSON.stringify({
      tiltAngle: params.tiltAngle,
      orientation: params.orientation,
      interRowSpacing: params.interRowSpacing, 
      adjacentGap: params.adjacentGap,
      tableConfig: params.tableConfig,
      carportConfig: params.carportConfig
    });
  }, []);

  // Reset the calculation flag when dependencies change
  useEffect(() => {
    moduleCalculationPerformedRef.current = true;
  }, [polygons, selectedPanel, layoutParams, moduleCount, structureType.id]);

  // Helper function to calculate polygon centroid safely
  const calculatePolygonCentroid = useCallback((polygon: google.maps.Polygon): google.maps.LatLng => {
    try {
      const path = polygon.getPath();
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
      
      return new google.maps.LatLng(centerLat, centerLng);
    } catch (e) {
      console.error("Error calculating centroid:", e);
      // Fallback to the first vertex if calculation fails
      return polygon.getPath().getAt(0)!;
    }
  }, []);

  // Calculate module corners based on center point, dimensions and rotation
  const calculateModuleCorners = useCallback((
    center: google.maps.LatLng,
    width: number,
    height: number,
    azimuth: number,
    spherical: typeof google.maps.geometry.spherical
  ): google.maps.LatLng[] => {
    // Helper to normalize angle to 0-360 range
    const normalizeAngle = (angle: number): number => ((angle % 360) + 360) % 360;
    
    // Calculate distance from center to corner
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const centerToCornerDist = Math.sqrt(halfWidth**2 + halfHeight**2);
    const angleOffset = Math.atan2(halfWidth, halfHeight) * (180 / Math.PI);
    
    // Calculate corner headings based on azimuth
    const neHeading = normalizeAngle(azimuth - angleOffset);
    const seHeading = normalizeAngle(azimuth + angleOffset);
    const nwHeading = normalizeAngle(azimuth - angleOffset + 180);
    const swHeading = normalizeAngle(azimuth + angleOffset + 180);
    
    // Calculate corners using spherical geometry
    const moduleNE = spherical.computeOffset(center, centerToCornerDist, neHeading);
    const moduleSE = spherical.computeOffset(center, centerToCornerDist, seHeading);
    const moduleNW = spherical.computeOffset(center, centerToCornerDist, nwHeading);
    const moduleSW = spherical.computeOffset(center, centerToCornerDist, swHeading);
    
    return [moduleNE, moduleSE, moduleSW, moduleNW]; // Return corners in clockwise order
  }, []);

  // Memoized calculation trigger that can be called from parent
  const triggerModuleCalculation = useCallback(() => {
    // Skip if we've explicitly marked to skip the next calculation
    if (skipNextCalculationRef.current) {
      skipNextCalculationRef.current = false;
      return;
    }
    
    // If a calculation is already in progress, queue another one
    if (calculationInProgressRef.current) {
      calculationQueuedRef.current = true;
      return;
    }
    
    // Clear any pending calculation
    if (calculateTimeoutRef.current !== null) {
      window.clearTimeout(calculateTimeoutRef.current);
    }
    
    // Skip duplicate calculations if nothing changed
    if (!moduleCalculationPerformedRef.current) {
      console.log("--- Skipping duplicate module placement ---");
      return;
    }
    
    // Use timeout to debounce rapid changes
    calculateTimeoutRef.current = window.setTimeout(() => {
      console.log("Triggering module calculation");
      calculationInProgressRef.current = true;
      
      const currentProps = {
        polygonsLength: polygons.length,
        moduleCount,
        structureTypeId: structureType.id,
        layoutParamsHash: getLayoutParamsHash(layoutParams)
      };
      
      // Skip calculation if nothing relevant has changed
      const propsChanged = 
        currentProps.polygonsLength !== prevPropsRef.current.polygonsLength ||
        currentProps.moduleCount !== prevPropsRef.current.moduleCount ||
        currentProps.structureTypeId !== prevPropsRef.current.structureTypeId ||
        currentProps.layoutParamsHash !== prevPropsRef.current.layoutParamsHash;
        
      if (!propsChanged && moduleRectanglesRef.current.length > 0) {
        console.log("Skipping module calculation - no changes");
        calculationInProgressRef.current = false;
        return;
      }
      
      prevPropsRef.current = currentProps;
      
      try {
        clearModuleRectangles();
        
        // Reset state
        setPlacedModuleCount(0);
        setPlacedModulesPerPolygon({});
        
        if (!selectedPanel || polygons.length === 0 || !map) {
          onCapacityCalculated(0, 0, 0, []);
          calculationInProgressRef.current = false;
          return;
        }
        
        console.log("--- Starting Module Placement ---");
        
        // Check if Google Maps geometry library is available
        if (!window.google || !window.google.maps.geometry || 
            !window.google.maps.geometry.spherical || 
            !window.google.maps.geometry.poly) {
          console.error("Google Maps geometry library not loaded");
          toast.error("Map geometry library not loaded. Please refresh the page.");
          calculationInProgressRef.current = false;
          return;
        }
        
        // Module dimensions (meters)
        const panelLengthM = (selectedPanel.length || 1700) / 1000;
        const panelWidthM = (selectedPanel.width || 1000) / 1000;
        const adjacentGapM = layoutParams.adjacentGap / 1000;
        const moduleDim = layoutParams.orientation === 'landscape'
          ? { width: panelLengthM, height: panelWidthM }
          : { width: panelWidthM, height: panelLengthM };
        
        console.log("Module Dimensions:", moduleDim);
        
        // Process each polygon and place modules
        const modulesPerPolygon: Record<number, number> = {};
        let totalPlacedCount = 0;
        const configs: PolygonConfig[] = [];
        const spherical = window.google.maps.geometry.spherical;
        const polyUtil = window.google.maps.geometry.poly;
        
        for (const [polyIndex, polyInfo] of polygons.entries()) {
          modulesPerPolygon[polyIndex] = 0;
          
          try {
            const polygon = polyInfo.polygon;
            const path = polygon.getPath();
            
            if (path.getLength() < 3) {
              console.log(`Polygon ${polyIndex} has less than 3 points, skipping`);
              continue;
            }
            
            // Calculate area (m²)
            const area = polyInfo.area;
            const azimuth = polyInfo.azimuth || 180;
            
            // Calculate theoretical module count based on area and GCR
            const moduleArea = moduleDim.width * moduleDim.height; // m²
            const gcr = structureType.groundCoverageRatio;
            const maxModulesForArea = Math.floor((area * gcr) / moduleArea);
            
            // Limit modules to place for this polygon
            const modulesToPlace = Math.min(maxModulesForArea, moduleCount - totalPlacedCount);
            
            if (modulesToPlace <= 0) {
              continue;
            }
            
            console.log(`Polygon ${polyIndex}: Area=${area.toFixed(1)}m², Max modules=${maxModulesForArea}, To place=${modulesToPlace}`);
            
            // Get centroid for starting point
            const centroid = calculatePolygonCentroid(polygon);
            console.log(`Polygon ${polyIndex} centroid: ${centroid.toUrlValue()}`);
            
            // Check if centroid is inside polygon for validation
            const centroidInside = polyUtil.containsLocation(centroid, polygon);
            
            // Find a valid starting point if centroid is not inside
            let startPoint = centroid;
            if (!centroidInside) {
              console.log(`Centroid not inside polygon ${polyIndex}, looking for valid starting point...`);
              
              // Try to find a point inside by interpolating 
              for (let i = 0; i < path.getLength(); i++) {
                const p1 = path.getAt(i);
                const p2 = path.getAt((i + 1) % path.getLength());
                // Try 10%, 20%, etc. along each edge
                for (let t = 0.1; t < 0.9; t += 0.1) {
                  const testPoint = new google.maps.LatLng(
                    p1.lat() + t * (p2.lat() - p1.lat()),
                    p1.lng() + t * (p2.lng() - p1.lng())
                  );
                  if (polyUtil.containsLocation(testPoint, polygon)) {
                    startPoint = testPoint;
                    console.log(`Found valid start point at ${startPoint.toUrlValue()}`);
                    break;
                  }
                }
                if (startPoint !== centroid) break;
              }
              
              // If still no valid point, use first vertex with small offset
              if (startPoint === centroid) {
                const firstVertex = path.getAt(0);
                const secondVertex = path.getAt(1);
                startPoint = spherical.interpolate(firstVertex, secondVertex, 0.1);
                console.log(`Using fallback start point at ${startPoint.toUrlValue()}`);
              }
            }
            
            // Place modules based on structure type
            let placedCount = 0;
            const isGroundMountTable = structureType.id === 'ground_mount_tables';
            const isCarport = structureType.id === 'carport';
            
            if (isGroundMountTable && layoutParams.tableConfig) {
              // Place ground mount tables
              placedCount = placeGroundMountTables({
                startPoint,
                polygon,
                modulesToPlace,
                moduleDim,
                layoutParams,
                tableConfig: layoutParams.tableConfig,
                azimuth,
                polyIndex,
                map,
                polyUtil,
                spherical
              });
            } else if (isCarport && layoutParams.carportConfig) {
              // Place carport structures
              placedCount = placeCarportStructures({
                startPoint,
                polygon,
                modulesToPlace,
                moduleDim,
                layoutParams,
                carportConfig: layoutParams.carportConfig,
                azimuth,
                polyIndex,
                map,
                polyUtil,
                spherical
              });
            } else {
              // Place individual modules (for ballasted, fixed tilt, etc.)
              placedCount = placeIndividualModules({
                startPoint,
                polygon,
                modulesToPlace,
                moduleDim,
                layoutParams,
                azimuth,
                polyIndex,
                map,
                polyUtil,
                spherical
              });
            }
            
            // Update module counts
            modulesPerPolygon[polyIndex] = placedCount;
            totalPlacedCount += placedCount;
            console.log(`Placed ${placedCount} modules in polygon ${polyIndex}`);
            
            // Add this polygon's data to configs
            const capacityKw = (placedCount * selectedPanel.power_rating) / 1000;
            configs.push({
              id: polyIndex,
              area,
              azimuth,
              capacityKw,
              moduleCount: placedCount,
              structureType: structureType.id,
              tiltAngle: layoutParams.tiltAngle
            });
          } catch (error) {
            console.error(`Error processing polygon ${polyIndex}:`, error);
          }
        }
        
        // Update state with calculation results
        setPlacedModuleCount(totalPlacedCount);
        setPlacedModulesPerPolygon(modulesPerPolygon);
        setPolygonConfigs(configs);
        
        // Calculate total capacity
        const totalCapacity = configs.reduce((sum, config) => sum + config.capacityKw, 0);
        setTotalCapacity(totalCapacity);
        
        // Notify parent component
        onCapacityCalculated(totalCapacity, totalArea, totalPlacedCount, configs);
        
        if (totalPlacedCount > 0) {
          toast.success(`Placed ${totalPlacedCount} modules with ${totalCapacity.toFixed(2)} kWp capacity`);
        } else if (polygons.length > 0) {
          toast.warning("No modules could be placed in the drawn areas");
        }
        
        // Mark the calculation as complete
        moduleCalculationPerformedRef.current = false;
        console.log("--- Module Placement Complete ---");
      } catch (error) {
        console.error("Error during module placement calculation:", error);
        toast.error("Error calculating module placement");
      } finally {
        calculationInProgressRef.current = false;
        
        // If another calculation was requested while this one was running, trigger it
        if (calculationQueuedRef.current) {
          calculationQueuedRef.current = false;
          
          // Set a small delay before the next calculation
          setTimeout(() => {
            triggerModuleCalculation();
          }, 300);
        }
      }
    }, 300); // Debounce for 300ms
  }, [
    map, 
    polygons, 
    selectedPanel, 
    moduleCount, 
    structureType, 
    layoutParams, 
    totalArea, 
    clearModuleRectangles, 
    getLayoutParamsHash, 
    onCapacityCalculated,
    calculatePolygonCentroid,
    calculateModuleCorners
  ]);

  // Function to place individual modules (for regular structures)
  const placeIndividualModules = useCallback(({
    startPoint,
    polygon,
    modulesToPlace,
    moduleDim,
    layoutParams,
    azimuth,
    polyIndex,
    map,
    polyUtil,
    spherical
  }: {
    startPoint: google.maps.LatLng;
    polygon: google.maps.Polygon;
    modulesToPlace: number;
    moduleDim: { width: number; height: number };
    layoutParams: LayoutParameters;
    azimuth: number;
    polyIndex: number;
    map: google.maps.Map;
    polyUtil: typeof google.maps.geometry.poly;
    spherical: typeof google.maps.geometry.spherical;
  }): number => {
    let placedCount = 0;
    const moduleWidth = moduleDim.width;
    const moduleHeight = moduleDim.height;
    const moduleWidthWithGap = moduleWidth + (layoutParams.adjacentGap / 1000);
    const rowSpacing = moduleHeight + layoutParams.interRowSpacing;
    
    // Set up spiral grid search around startPoint
    const rowHeading = azimuth; 
    const colHeading = (azimuth + 90) % 360;
    const rowDirections = [rowHeading, (rowHeading + 180) % 360];
    const colDirections = [colHeading, (colHeading + 180) % 360];
    const maxDistance = 300; // Max distance to search in meters
    const placedPoints: google.maps.LatLng[] = []; // Track placed modules to avoid overlaps
    
    console.log(`Individual modules: width=${moduleWidth}m, height=${moduleHeight}m, row spacing=${rowSpacing}m`);
    console.log(`Azimuth: ${azimuth}°, Row heading: ${rowHeading}°, Col heading: ${colHeading}°`);
    
    // For each quadrant of the spiral
    for (const rowDirection of rowDirections) {
      if (placedCount >= modulesToPlace) break;
      
      let rowStart = startPoint;
      let rowDistance = 0;
      let rowNum = 0;
      
      // Spiral out row by row
      while (rowDistance < maxDistance && placedCount < modulesToPlace) {
        for (const colDirection of colDirections) {
          if (placedCount >= modulesToPlace) break;
          
          let currentPoint = rowStart;
          let colDistance = 0;
          let colNum = 0;
          
          // Move along column in current direction
          while (colDistance < maxDistance && placedCount < modulesToPlace) {
            // Check if point is not too close to already placed modules
            let isTooClose = placedPoints.some(point => 
              spherical.computeDistanceBetween(point, currentPoint) < Math.min(moduleWidth, moduleHeight) * 0.9
            );
            
            if (!isTooClose && polyUtil.containsLocation(currentPoint, polygon)) {
              // Calculate module corners
              const corners = calculateModuleCorners(currentPoint, moduleWidth, moduleHeight, azimuth, spherical);
              
              // Check if all corners are inside the polygon
              const allCornersInside = corners.every(corner => polyUtil.containsLocation(corner, polygon));
              
              if (allCornersInside) {
                // Create bounds for the rectangle
                const bounds = new google.maps.LatLngBounds();
                corners.forEach(corner => bounds.extend(corner));
                
                // Draw rectangle for this module
                const rectangle = new google.maps.Rectangle({
                  bounds: bounds,
                  strokeColor: '#003366',
                  strokeOpacity: 0.8,
                  strokeWeight: 1,
                  fillColor: '#3399FF',
                  fillOpacity: 0.6,
                  map,
                  zIndex: 2
                });
                
                moduleRectanglesRef.current.push(rectangle);
                placedPoints.push(currentPoint);
                placedCount++;
                
                if ((placedCount % 10) === 0) {
                  console.log(`Placed ${placedCount} modules...`);
                }
              }
            }
            
            // Move to next position in column
            colNum++;
            colDistance += moduleWidthWithGap;
            currentPoint = spherical.computeOffset(currentPoint, moduleWidthWithGap, colDirection);
          }
        }
        
        // Move to next row
        rowNum++;
        rowDistance += rowSpacing;
        rowStart = spherical.computeOffset(rowStart, rowSpacing, rowDirection);
      }
    }
    
    return placedCount;
  }, [calculateModuleCorners]);

  // Function to place ground mount tables
  const placeGroundMountTables = useCallback(({
    startPoint,
    polygon,
    modulesToPlace,
    moduleDim,
    layoutParams,
    tableConfig,
    azimuth,
    polyIndex,
    map,
    polyUtil,
    spherical
  }: {
    startPoint: google.maps.LatLng;
    polygon: google.maps.Polygon;
    modulesToPlace: number;
    moduleDim: { width: number; height: number };
    layoutParams: LayoutParameters;
    tableConfig: {
      rowsPerTable: number;
      modulesPerRow: number;
      interTableSpacingX: number;
      interTableSpacingY: number;
    };
    azimuth: number;
    polyIndex: number;
    map: google.maps.Map;
    polyUtil: typeof google.maps.geometry.poly;
    spherical: typeof google.maps.geometry.spherical;
  }): number => {
    let placedModuleCount = 0;
    const moduleWidth = moduleDim.width;
    const moduleHeight = moduleDim.height;
    const adjacentGapM = layoutParams.adjacentGap / 1000;
    const moduleWidthWithGap = moduleWidth + adjacentGapM;
    const intraRowSpacing = layoutParams.interRowSpacing; // Spacing between rows within a table
    
    // Table dimensions
    const rowsPerTable = tableConfig.rowsPerTable;
    const modulesPerRow = tableConfig.modulesPerRow;
    const tableWidth = modulesPerRow * moduleWidthWithGap;
    const tableHeight = (rowsPerTable * moduleHeight) + ((rowsPerTable - 1) * intraRowSpacing);
    const modulesPerTable = rowsPerTable * modulesPerRow;
    
    // Spacing between tables
    const interTableSpacingX = tableConfig.interTableSpacingX;
    const interTableSpacingY = tableConfig.interTableSpacingY;
    const tableSpacingX = tableWidth + interTableSpacingX;
    const tableSpacingY = tableHeight + interTableSpacingY;
    
    console.log(`Ground mount table: ${rowsPerTable} rows × ${modulesPerRow} modules per row`);
    console.log(`Table dimensions: ${tableWidth.toFixed(2)}m × ${tableHeight.toFixed(2)}m with ${modulesPerTable} modules`);
    console.log(`Table spacing: X=${interTableSpacingX}m, Y=${interTableSpacingY}m`);
    
    // Set up spiral grid search for tables
    const rowHeading = azimuth; 
    const colHeading = (azimuth + 90) % 360;
    const rowDirections = [rowHeading, (rowHeading + 180) % 360];
    const colDirections = [colHeading, (colHeading + 180) % 360];
    const maxDistance = 300; // Max distance to search in meters
    const placedTables: google.maps.LatLng[] = []; // Track placed tables to avoid overlaps
    
    // For each quadrant of the spiral
    for (const rowDirection of rowDirections) {
      if (placedModuleCount >= modulesToPlace) break;
      
      let rowStart = startPoint;
      let rowDistance = 0;
      let rowNum = 0;
      
      // Spiral out row by row (tables)
      while (rowDistance < maxDistance && placedModuleCount < modulesToPlace) {
        for (const colDirection of colDirections) {
          if (placedModuleCount >= modulesToPlace) break;
          
          let currentPoint = rowStart;
          let colDistance = 0;
          let colNum = 0;
          
          // Move along column in current direction (tables)
          while (colDistance < maxDistance && placedModuleCount < modulesToPlace) {
            // Check if table center is inside polygon
            if (polyUtil.containsLocation(currentPoint, polygon)) {
              // Check if table is too close to other tables
              let isTooClose = placedTables.some(point => 
                spherical.computeDistanceBetween(point, currentPoint) < Math.min(tableWidth, tableHeight) * 0.9
              );
              
              if (!isTooClose) {
                // Calculate table corners
                const halfTableWidth = tableWidth / 2;
                const halfTableHeight = tableHeight / 2;
                const tableCornerDist = Math.sqrt(halfTableWidth**2 + halfTableHeight**2);
                const tableAngleOffset = Math.atan2(halfTableWidth, halfTableHeight) * (180 / Math.PI);
                
                // Calculate corner headings
                const normalizeAngle = (angle: number): number => ((angle % 360) + 360) % 360;
                const tableNEHeading = normalizeAngle(azimuth - tableAngleOffset);
                const tableSEHeading = normalizeAngle(azimuth + tableAngleOffset);
                const tableNWHeading = normalizeAngle(azimuth - tableAngleOffset + 180);
                const tableSWHeading = normalizeAngle(azimuth + tableAngleOffset + 180);
                
                // Calculate table corners
                const tableNE = spherical.computeOffset(currentPoint, tableCornerDist, tableNEHeading);
                const tableSE = spherical.computeOffset(currentPoint, tableCornerDist, tableSEHeading);
                const tableSW = spherical.computeOffset(currentPoint, tableCornerDist, tableSWHeading);
                const tableNW = spherical.computeOffset(currentPoint, tableCornerDist, tableNWHeading);
                const tableCorners = [tableNE, tableSE, tableSW, tableNW];
                
                // Check if all corners are inside the polygon
                const tableInsidePolygon = tableCorners.every(corner => 
                  polyUtil.containsLocation(corner, polygon)
                );
                
                if (tableInsidePolygon) {
                  // Calculate module positions within the table
                  const modulePositions: google.maps.LatLng[] = [];
                  let allModuleCornersInside = true;
                  
                  // For each row within the table
                  for (let row = 0; row < rowsPerTable; row++) {
                    // Calculate row offset from table center
                    const rowPosition = row - (rowsPerTable - 1) / 2;
                    const rowOffset = rowPosition * (moduleHeight + intraRowSpacing);
                    
                    // Calculate row center
                    const rowCenter = spherical.computeOffset(
                      currentPoint,
                      Math.abs(rowOffset),
                      rowOffset < 0 ? (azimuth + 180) % 360 : azimuth
                    );
                    
                    // Place modules in this row
                    for (let col = 0; col < modulesPerRow; col++) {
                      // Calculate column offset
                      const colPosition = col - (modulesPerRow - 1) / 2;
                      const colOffset = colPosition * moduleWidthWithGap;
                      
                      // Calculate module center
                      const moduleCenter = spherical.computeOffset(
                        rowCenter,
                        Math.abs(colOffset),
                        colOffset < 0 ? (azimuth + 270) % 360 : (azimuth + 90) % 360
                      );
                      
                      // Add to list of module positions
                      modulePositions.push(moduleCenter);
                      
                      // Check if module is inside polygon
                      const moduleCorners = calculateModuleCorners(moduleCenter, moduleWidth, moduleHeight, azimuth, spherical);
                      const moduleInside = moduleCorners.every(corner => polyUtil.containsLocation(corner, polygon));
                      
                      if (!moduleInside) {
                        allModuleCornersInside = false;
                        break;
                      }
                    }
                    
                    if (!allModuleCornersInside) break;
                  }
                  
                  // If all modules fit inside, place the table
                  if (allModuleCornersInside) {
                    // Draw table outline
                    const tablePolygon = new google.maps.Polygon({
                      paths: tableCorners,
                      strokeColor: '#FF0000',
                      strokeOpacity: 0.8,
                      strokeWeight: 2,
                      fillColor: '#FF0000',
                      fillOpacity: 0.05,
                      map,
                    });
                    
                    moduleRectanglesRef.current.push(tablePolygon as unknown as google.maps.Rectangle);
                    placedTables.push(currentPoint);
                    
                    // Place all modules in this table
                    for (const moduleCenter of modulePositions) {
                      // Calculate module corners
                      const moduleCorners = calculateModuleCorners(moduleCenter, moduleWidth, moduleHeight, azimuth, spherical);
                      
                      // Create bounds for the rectangle
                      const bounds = new google.maps.LatLngBounds();
                      moduleCorners.forEach(corner => bounds.extend(corner));
                      
                      // Draw rectangle for this module
                      const rectangle = new google.maps.Rectangle({
                        bounds: bounds,
                        strokeColor: '#003366',
                        strokeOpacity: 0.8,
                        strokeWeight: 1,
                        fillColor: '#3399FF',
                        fillOpacity: 0.6,
                        map,
                        zIndex: 2
                      });
                      
                      moduleRectanglesRef.current.push(rectangle);
                      placedModuleCount++;
                      
                      if (placedModuleCount >= modulesToPlace) break;
                    }
                    
                    // Add row divider lines
                    if (rowsPerTable > 1) {
                      for (let r = 1; r < rowsPerTable; r++) {
                        const dividerPosition = -halfTableHeight + (r * (tableHeight / rowsPerTable));
                        const dividerCenter = spherical.computeOffset(
                          currentPoint,
                          Math.abs(dividerPosition),
                          dividerPosition < 0 ? (azimuth + 180) % 360 : azimuth
                        );
                        
                        // Calculate line endpoints
                        const dividerStartHeading = (azimuth + 270) % 360;
                        const dividerEndHeading = (azimuth + 90) % 360;
                        const lineStart = spherical.computeOffset(dividerCenter, halfTableWidth, dividerStartHeading);
                        const lineEnd = spherical.computeOffset(dividerCenter, halfTableWidth, dividerEndHeading);
                        
                        // Draw divider line
                        const rowDivider = new google.maps.Polyline({
                          path: [lineStart, lineEnd],
                          geodesic: true,
                          strokeColor: '#3399FF',
                          strokeOpacity: 0.3,
                          strokeWeight: 1,
                          map
                        });
                        
                        moduleRectanglesRef.current.push(rowDivider as unknown as google.maps.Rectangle);
                      }
                    }
                    
                    console.log(`Placed table with ${modulesPerTable} modules at ${currentPoint.toUrlValue()}`);
                  }
                }
              }
            }
            
            // Move to next table position
            colNum++;
            colDistance += tableSpacingX;
            currentPoint = spherical.computeOffset(currentPoint, tableSpacingX, colDirection);
          }
        }
        
        // Move to next row of tables
        rowNum++;
        rowDistance += tableSpacingY;
        rowStart = spherical.computeOffset(rowStart, tableSpacingY, rowDirection);
      }
    }
    
    return placedModuleCount;
  }, [calculateModuleCorners]);

  // Function to place carport structures
  const placeCarportStructures = useCallback(({
    startPoint,
    polygon,
    modulesToPlace,
    moduleDim,
    layoutParams,
    carportConfig,
    azimuth,
    polyIndex,
    map,
    polyUtil,
    spherical
  }: {
    startPoint: google.maps.LatLng;
    polygon: google.maps.Polygon;
    modulesToPlace: number;
    moduleDim: { width: number; height: number };
    layoutParams: LayoutParameters;
    carportConfig: {
      rows: number;
      modulesPerRow: number;
      forceRectangle: boolean;
    };
    azimuth: number;
    polyIndex: number;
    map: google.maps.Map;
    polyUtil: typeof google.maps.geometry.poly;
    spherical: typeof google.maps.geometry.spherical;
  }): number => {
    let placedModuleCount = 0;
    const moduleWidth = moduleDim.width;
    const moduleHeight = moduleDim.height;
    const adjacentGapM = layoutParams.adjacentGap / 1000;
    const moduleWidthWithGap = moduleWidth + adjacentGapM;
    
    // Carport dimensions
    const rows = carportConfig.rows;
    const modulesPerRow = carportConfig.modulesPerRow;
    const carportWidth = modulesPerRow * moduleWidthWithGap;
    const carportHeight = rows * moduleHeight; // No spacing between rows for carports
    const modulesPerCarport = rows * modulesPerRow;
    
    // Spacing between carports (20% buffer)
    const carportSpacingX = carportWidth * 1.2;
    const carportSpacingY = carportHeight * 1.2;
    
    console.log(`Carport: ${rows} rows × ${modulesPerRow} modules per row`);
    console.log(`Carport dimensions: ${carportWidth.toFixed(2)}m × ${carportHeight.toFixed(2)}m with ${modulesPerCarport} modules`);
    
    // Set up spiral grid search for carports
    const rowHeading = azimuth; 
    const colHeading = (azimuth + 90) % 360;
    const rowDirections = [rowHeading, (rowHeading + 180) % 360];
    const colDirections = [colHeading, (colHeading + 180) % 360];
    const maxDistance = 300; // Max distance to search in meters
    const placedCarports: google.maps.LatLng[] = []; // Track placed carports to avoid overlaps
    
    // For each quadrant of the spiral
    for (const rowDirection of rowDirections) {
      if (placedModuleCount >= modulesToPlace) break;
      
      let rowStart = startPoint;
      let rowDistance = 0;
      let rowNum = 0;
      
      // Spiral out row by row (carports)
      while (rowDistance < maxDistance && placedModuleCount < modulesToPlace) {
        for (const colDirection of colDirections) {
          if (placedModuleCount >= modulesToPlace) break;
          
          let currentPoint = rowStart;
          let colDistance = 0;
          let colNum = 0;
          
          // Move along column in current direction (carports)
          while (colDistance < maxDistance && placedModuleCount < modulesToPlace) {
            // Check if carport center is inside polygon
            if (polyUtil.containsLocation(currentPoint, polygon)) {
              // Check if carport is too close to other carports
              let isTooClose = placedCarports.some(point => 
                spherical.computeDistanceBetween(point, currentPoint) < Math.min(carportWidth, carportHeight) * 0.9
              );
              
              if (!isTooClose) {
                // Calculate carport corners
                const halfCarportWidth = carportWidth / 2;
                const halfCarportHeight = carportHeight / 2;
                const carportCornerDist = Math.sqrt(halfCarportWidth**2 + halfCarportHeight**2);
                const carportAngleOffset = Math.atan2(halfCarportWidth, halfCarportHeight) * (180 / Math.PI);
                
                // Calculate corner headings
                const normalizeAngle = (angle: number): number => ((angle % 360) + 360) % 360;
                const carportNEHeading = normalizeAngle(azimuth - carportAngleOffset);
                const carportSEHeading = normalizeAngle(azimuth + carportAngleOffset);
                const carportNWHeading = normalizeAngle(azimuth - carportAngleOffset + 180);
                const carportSWHeading = normalizeAngle(azimuth + carportAngleOffset + 180);
                
                // Calculate carport corners
                const carportNE = spherical.computeOffset(currentPoint, carportCornerDist, carportNEHeading);
                const carportSE = spherical.computeOffset(currentPoint, carportCornerDist, carportSEHeading);
                const carportSW = spherical.computeOffset(currentPoint, carportCornerDist, carportSWHeading);
                const carportNW = spherical.computeOffset(currentPoint, carportCornerDist, carportNWHeading);
                const carportCorners = [carportNE, carportSE, carportSW, carportNW];
                
                // Check if all corners are inside the polygon
                const carportInsidePolygon = carportCorners.every(corner => 
                  polyUtil.containsLocation(corner, polygon)
                );
                
                if (carportInsidePolygon) {
                  // Calculate module positions within the carport
                  const modulePositions: google.maps.LatLng[] = [];
                  let allModuleCornersInside = true;
                  
                  // For each row within the carport
                  for (let row = 0; row < rows; row++) {
                    // Calculate row offset from carport center
                    const rowPosition = row - (rows - 1) / 2;
                    const rowOffset = rowPosition * moduleHeight; // No spacing between rows for carports
                    
                    // Calculate row center
                    const rowCenter = spherical.computeOffset(
                      currentPoint,
                      Math.abs(rowOffset),
                      rowOffset < 0 ? (azimuth + 180) % 360 : azimuth
                    );
                    
                    // Place modules in this row
                    for (let col = 0; col < modulesPerRow; col++) {
                      // Calculate column offset
                      const colPosition = col - (modulesPerRow - 1) / 2;
                      const colOffset = colPosition * moduleWidthWithGap;
                      
                      // Calculate module center
                      const moduleCenter = spherical.computeOffset(
                        rowCenter,
                        Math.abs(colOffset),
                        colOffset < 0 ? (azimuth + 270) % 360 : (azimuth + 90) % 360
                      );
                      
                      // Add to list of module positions
                      modulePositions.push(moduleCenter);
                      
                      // Check if module is inside polygon
                      const moduleCorners = calculateModuleCorners(moduleCenter, moduleWidth, moduleHeight, azimuth, spherical);
                      const moduleInside = moduleCorners.every(corner => polyUtil.containsLocation(corner, polygon));
                      
                      if (!moduleInside && carportConfig.forceRectangle) {
                        allModuleCornersInside = false;
                        break;
                      }
                    }
                    
                    if (!allModuleCornersInside && carportConfig.forceRectangle) break;
                  }
                  
                  // If all modules fit inside or we're not forcing a rectangle
                  if (allModuleCornersInside || !carportConfig.forceRectangle) {
                    // Draw carport outline
                    const carportPolygon = new google.maps.Polygon({
                      paths: carportCorners,
                      strokeColor: '#4B0082', // Indigo for carport
                      strokeOpacity: 0.8,
                      strokeWeight: 2,
                      fillColor: '#4B0082',
                      fillOpacity: 0.1,
                      map,
                    });
                    
                    moduleRectanglesRef.current.push(carportPolygon as unknown as google.maps.Rectangle);
                    placedCarports.push(currentPoint);
                    
                    // Place all modules in this carport
                    for (const moduleCenter of modulePositions) {
                      // Check if module is inside polygon (for non-forced rectangles)
                      const moduleCorners = calculateModuleCorners(moduleCenter, moduleWidth, moduleHeight, azimuth, spherical);
                      const moduleInside = moduleCorners.every(corner => polyUtil.containsLocation(corner, polygon));
                      
                      if (moduleInside || carportConfig.forceRectangle) {
                        // Create bounds for the rectangle
                        const bounds = new google.maps.LatLngBounds();
                        moduleCorners.forEach(corner => bounds.extend(corner));
                        
                        // Draw rectangle for this module
                        const rectangle = new google.maps.Rectangle({
                          bounds: bounds,
                          strokeColor: '#003366',
                          strokeOpacity: 0.8,
                          strokeWeight: 1,
                          fillColor: '#3399FF',
                          fillOpacity: 0.7, // More opaque for carport modules
                          map: moduleInside ? map : null, // Only show if inside polygon
                          zIndex: 2
                        });
                        
                        if (moduleInside) {
                          moduleRectanglesRef.current.push(rectangle);
                          placedModuleCount++;
                        }
                      }
                      
                      if (placedModuleCount >= modulesToPlace) break;
                    }
                    
                    // Add row divider lines
                    if (rows > 1) {
                      for (let r = 1; r < rows; r++) {
                        const dividerPosition = -halfCarportHeight + (r * (carportHeight / rows));
                        const dividerCenter = spherical.computeOffset(
                          currentPoint,
                          Math.abs(dividerPosition),
                          dividerPosition < 0 ? (azimuth + 180) % 360 : azimuth
                        );
                        
                        // Calculate line endpoints
                        const dividerStartHeading = (azimuth + 270) % 360;
                        const dividerEndHeading = (azimuth + 90) % 360;
                        const lineStart = spherical.computeOffset(dividerCenter, halfCarportWidth, dividerStartHeading);
                        const lineEnd = spherical.computeOffset(dividerCenter, halfCarportWidth, dividerEndHeading);
                        
                        // Draw divider line
                        const rowDivider = new google.maps.Polyline({
                          path: [lineStart, lineEnd],
                          geodesic: true,
                          strokeColor: '#3399FF',
                          strokeOpacity: 0.3,
                          strokeWeight: 0.5,
                          map
                        });
                        
                        moduleRectanglesRef.current.push(rowDivider as unknown as google.maps.Rectangle);
                      }
                    }
                    
                    console.log(`Placed carport with ${placedModuleCount % 10 === 0 ? placedModuleCount : ''} modules at ${currentPoint.toUrlValue()}`);
                  }
                }
              }
            }
            
            // Move to next carport position
            colNum++;
            colDistance += carportSpacingX;
            currentPoint = spherical.computeOffset(currentPoint, carportSpacingX, colDirection);
          }
        }
        
        // Move to next row of carports
        rowNum++;
        rowDistance += carportSpacingY;
        rowStart = spherical.computeOffset(rowStart, carportSpacingY, rowDirection);
      }
    }
    
    return placedModuleCount;
  }, [calculateModuleCorners]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearModuleRectangles();
      if (calculateTimeoutRef.current !== null) {
        window.clearTimeout(calculateTimeoutRef.current);
      }
    };
  }, [clearModuleRectangles]);

  // Mark to skip the next calculation when polygons change
  useEffect(() => {
    if (polygons.length === 0) {
      skipNextCalculationRef.current = true;
    }
  }, [polygons.length]);

  return {
    placedModuleCount,
    placedModulesPerPolygon,
    totalCapacity,
    polygonConfigs,
    triggerModuleCalculation
  };
};
