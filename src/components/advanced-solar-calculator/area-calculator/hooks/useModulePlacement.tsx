
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
        
        if (!selectedPanel || polygons.length === 0) {
          onCapacityCalculated(0, 0, 0, []);
          calculationInProgressRef.current = false;
          return;
        }
        
        // Perform actual module placement calculation here
        // This would be a complex calculation based on polygon shapes, azimuths, etc.
        // For now, we'll use a simplified calculation
        
        const modulesPerPolygon: Record<number, number> = {};
        let totalPlacedCount = 0;
        
        // Create polygon configs
        const configs: PolygonConfig[] = polygons.map((poly, index) => {
          // Simple calculation of modules that could fit in this polygon
          const panelLength = (selectedPanel?.length || 1700) / 1000; // m
          const panelWidth = (selectedPanel?.width || 1000) / 1000; // m
          const moduleArea = panelLength * panelWidth; // m²
          const gcr = structureType.groundCoverageRatio;
          const calculatedModuleCount = Math.floor((poly.area * gcr) / moduleArea);
          
          modulesPerPolygon[index] = calculatedModuleCount;
          totalPlacedCount += calculatedModuleCount;
          
          const capacityKw = (calculatedModuleCount * (selectedPanel?.power_rating || 400)) / 1000;
          
          return {
            id: index,
            area: poly.area,
            azimuth: poly.azimuth || 180,
            capacityKw,
            moduleCount: calculatedModuleCount,
            structureType: structureType.id,
            tiltAngle: layoutParams.tiltAngle
          };
        });
        
        // Update state with calculation results
        setPlacedModuleCount(totalPlacedCount);
        setPlacedModulesPerPolygon(modulesPerPolygon);
        setPolygonConfigs(configs);
        
        // Calculate total capacity
        const totalCapacity = configs.reduce((sum, config) => sum + config.capacityKw, 0);
        setTotalCapacity(totalCapacity);
        
        // Notify parent component
        onCapacityCalculated(totalCapacity, totalArea, totalPlacedCount, configs);
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
    
    return () => {
      if (calculateTimeoutRef.current !== null) {
        window.clearTimeout(calculateTimeoutRef.current);
      }
    };
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
    onCapacityCalculated
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
