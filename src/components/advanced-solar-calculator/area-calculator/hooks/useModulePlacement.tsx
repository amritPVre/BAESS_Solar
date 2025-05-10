
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
            
            // Calculate module count based on area and GCR
            const moduleArea = panelLengthM * panelWidthM; // m²
            const gcr = structureType.groundCoverageRatio;
            const maxModulesForArea = Math.floor((area * gcr) / moduleArea);
            
            // Limit modules to place for this polygon
            const modulesToPlace = Math.min(maxModulesForArea, moduleCount - totalPlacedCount);
            
            if (modulesToPlace <= 0) {
              continue;
            }
            
            console.log(`Polygon ${polyIndex}: Area=${area.toFixed(1)}m², Max modules=${maxModulesForArea}, To place=${modulesToPlace}`);
            
            // Get bounds for visualization
            const bounds = new google.maps.LatLngBounds();
            for (let i = 0; i < path.getLength(); i++) {
              bounds.extend(path.getAt(i));
            }
            
            const centroid = calculatePolygonCentroid(polygon);
            console.log(`Polygon ${polyIndex} centroid: ${centroid.toUrlValue()}`);
            
            // Check if centroid is inside polygon for validation
            const polyUtil = window.google.maps.geometry.poly;
            const centroidInside = polyUtil.containsLocation(centroid, polygon);
            console.log(`Centroid inside polygon: ${centroidInside}`);
            
            // Start placing modules from centroid
            if (centroidInside) {
              const spherical = window.google.maps.geometry.spherical;
              const placedCount = placeModulesInPolygon({
                moduleCount: modulesToPlace,
                polygon,
                startPoint: centroid,
                moduleDim,
                polyUtil,
                spherical,
                map,
                azimuth,
                polyIndex
              });
              
              modulesPerPolygon[polyIndex] = placedCount;
              totalPlacedCount += placedCount;
              
              console.log(`Placed ${placedCount} modules in polygon ${polyIndex}`);
            }
            
            // Add this polygon's data to configs
            const placedModuleCount = modulesPerPolygon[polyIndex];
            const capacityKw = (placedModuleCount * selectedPanel.power_rating) / 1000;
            
            configs.push({
              id: polyIndex,
              area,
              azimuth,
              capacityKw,
              moduleCount: placedModuleCount,
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
        } else {
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
    calculatePolygonCentroid
  ]);

  // Helper function to place modules within a polygon
  const placeModulesInPolygon = useCallback(({
    moduleCount,
    polygon,
    startPoint,
    moduleDim,
    polyUtil,
    spherical,
    map,
    azimuth,
    polyIndex
  }: {
    moduleCount: number;
    polygon: google.maps.Polygon;
    startPoint: google.maps.LatLng;
    moduleDim: { width: number; height: number };
    polyUtil: typeof google.maps.geometry.poly;
    spherical: typeof google.maps.geometry.spherical;
    map: google.maps.Map;
    azimuth: number;
    polyIndex: number;
  }): number => {
    let placedCount = 0;
    
    try {
      // Spiral grid parameters
      const rowHeading = azimuth; 
      const colHeading = (azimuth + 90) % 360;
      const rowDirections = [rowHeading, (rowHeading + 180) % 360];
      const colDirections = [colHeading, (colHeading + 180) % 360];
      const moduleWidth = moduleDim.width;
      const moduleHeight = moduleDim.height;
      
      // For each quadrant of the spiral
      for (const rowDirection of rowDirections) {
        if (placedCount >= moduleCount) break;
        
        let rowStart = startPoint;
        let rowDistance = 0;
        const rowSpacing = moduleHeight * 1.5; // Use 1.5x height as row spacing
        const maxDistance = 200; // Max distance to search in meters
        
        // Spiral out row by row
        while (rowDistance < maxDistance && placedCount < moduleCount) {
          for (const colDirection of colDirections) {
            if (placedCount >= moduleCount) break;
            
            let currentPoint = rowStart;
            let colDistance = 0;
            const colSpacing = moduleWidth * 1.2; // Use 1.2x width as column spacing
            
            // Move along column in current direction
            while (colDistance < maxDistance && placedCount < moduleCount) {
              // Check if point is inside polygon
              if (polyUtil.containsLocation(currentPoint, polygon)) {
                // Calculate module corners
                const halfWidth = moduleWidth / 2;
                const halfHeight = moduleHeight / 2;
                const centerToCornerDist = Math.sqrt(halfWidth**2 + halfHeight**2);
                const angleOffset = Math.atan2(halfWidth, halfHeight) * (180 / Math.PI);
                
                // Calculate corner headings
                const normalizeAngle = (angle: number): number => ((angle % 360) + 360) % 360;
                const neHeading = normalizeAngle(azimuth - angleOffset);
                const seHeading = normalizeAngle(azimuth + angleOffset);
                const swHeading = normalizeAngle(azimuth + angleOffset + 180);
                const nwHeading = normalizeAngle(azimuth - angleOffset + 180);
                
                // Calculate corners
                const moduleNE = spherical.computeOffset(currentPoint, centerToCornerDist, neHeading);
                const moduleSE = spherical.computeOffset(currentPoint, centerToCornerDist, seHeading);
                const moduleSW = spherical.computeOffset(currentPoint, centerToCornerDist, swHeading);
                const moduleNW = spherical.computeOffset(currentPoint, centerToCornerDist, nwHeading);
                
                // Check if all corners are inside the polygon
                const allCornersInside = 
                  polyUtil.containsLocation(moduleNE, polygon) &&
                  polyUtil.containsLocation(moduleSE, polygon) &&
                  polyUtil.containsLocation(moduleSW, polygon) &&
                  polyUtil.containsLocation(moduleNW, polygon);
                
                if (allCornersInside) {
                  // Draw rectangle for this module
                  const moduleBounds = new google.maps.LatLngBounds();
                  moduleBounds.extend(moduleNE);
                  moduleBounds.extend(moduleSE);
                  moduleBounds.extend(moduleSW);
                  moduleBounds.extend(moduleNW);
                  
                  const rectangle = new google.maps.Rectangle({
                    bounds: moduleBounds,
                    strokeColor: '#003366',
                    strokeOpacity: 0.8,
                    strokeWeight: 1,
                    fillColor: '#3399FF',
                    fillOpacity: 0.6,
                    map,
                    zIndex: 2
                  });
                  
                  moduleRectanglesRef.current.push(rectangle);
                  placedCount++;
                }
              }
              
              // Move to next position in column
              colDistance += colSpacing;
              currentPoint = spherical.computeOffset(currentPoint, colSpacing, colDirection);
            }
          }
          
          // Move to next row
          rowDistance += rowSpacing;
          rowStart = spherical.computeOffset(rowStart, rowSpacing, rowDirection);
        }
      }
    } catch (error) {
      console.error("Error placing modules in polygon:", error);
    }
    
    return placedCount;
  }, []);

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
