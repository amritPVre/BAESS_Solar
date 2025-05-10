
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
            
            // Even with a simplified approach, verify the logic works
            // Just place a single module at the centroid for testing
            if (centroidInside) {
              const moduleWidth = moduleDim.width;
              const moduleHeight = moduleDim.height;
              
              // Calculate module corners, accounting for azimuth
              const spherical = window.google.maps.geometry.spherical;
              
              // Place module at centroid
              const halfWidth = moduleWidth / 2;
              const halfHeight = moduleHeight / 2;
              
              // Calculate the distance from center to corner
              const centerToCornerDist = Math.sqrt(halfWidth**2 + halfHeight**2);
              
              // Calculate angle offset from center to corner
              const angleOffset = Math.atan2(halfWidth, halfHeight) * (180 / Math.PI);
              
              // Normalize angles for calculations (0-360 degrees)
              const normalizeAngle = (angle: number): number => ((angle % 360) + 360) % 360;
              
              // Calculate corner headings based on azimuth
              const northEastHeading = normalizeAngle(azimuth - angleOffset);
              const southEastHeading = normalizeAngle(azimuth + angleOffset);
              const southWestHeading = normalizeAngle(azimuth + angleOffset + 180);
              const northWestHeading = normalizeAngle(azimuth - angleOffset + 180);
              
              // Calculate corners with proper angles
              const moduleNE = spherical.computeOffset(centroid, centerToCornerDist, northEastHeading);
              const moduleSE = spherical.computeOffset(centroid, centerToCornerDist, southEastHeading);
              const moduleSW = spherical.computeOffset(centroid, centerToCornerDist, southWestHeading);
              const moduleNW = spherical.computeOffset(centroid, centerToCornerDist, northWestHeading);
              
              // Check if all corners are inside the polygon
              const allCornersInside = 
                polyUtil.containsLocation(moduleNE, polygon) &&
                polyUtil.containsLocation(moduleSE, polygon) &&
                polyUtil.containsLocation(moduleSW, polygon) &&
                polyUtil.containsLocation(moduleNW, polygon);
              
              console.log(`All corners inside polygon: ${allCornersInside}`);
              
              // If all corners are inside, place the module
              if (allCornersInside) {
                // Create a LatLngBounds for the rectangle
                const moduleBounds = new google.maps.LatLngBounds();
                moduleBounds.extend(moduleNE);
                moduleBounds.extend(moduleSE);
                moduleBounds.extend(moduleSW);
                moduleBounds.extend(moduleNW);
                
                // Create a rectangle representing the module
                const rectangle = new google.maps.Rectangle({
                  strokeColor: '#003366',
                  strokeOpacity: 0.8,
                  strokeWeight: 1,
                  fillColor: '#3399FF',
                  fillOpacity: 0.6,
                  map: map,
                  bounds: moduleBounds,
                  zIndex: 2
                });
                
                moduleRectanglesRef.current.push(rectangle);
                
                // Update counters
                modulesPerPolygon[polyIndex]++;
                totalPlacedCount++;
              }
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
        
        toast.success(`Placed ${totalPlacedCount} modules with ${totalCapacity.toFixed(2)} kWp capacity`);
        
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
