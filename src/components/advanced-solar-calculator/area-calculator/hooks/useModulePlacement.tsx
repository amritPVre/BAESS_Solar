
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SolarPanel } from '@/types/components';
import { PolygonInfo, PolygonConfig, LayoutParameters, StructureType } from '../types';
import { toast } from 'sonner';

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
  const calculationTimerRef = useRef<number | null>(null);

  // Clean up module rectangles
  const clearModuleRectangles = useCallback(() => {
    moduleRectanglesRef.current.forEach(rect => {
      if (rect) {
        try {
          rect.setMap(null);
        } catch (e) {
          console.warn("Error clearing module rectangle:", e);
        }
      }
    });
    moduleRectanglesRef.current = [];
  }, []);

  // Function to trigger module calculation with debounce
  const triggerModuleCalculation = useCallback(() => {
    // Cancel any pending calculation
    if (calculationTimerRef.current !== null) {
      window.clearTimeout(calculationTimerRef.current);
    }
    
    // Set flag to indicate calculation needed
    moduleCalculationPerformedRef.current = true;
    
    // Schedule calculation with debounce
    calculationTimerRef.current = window.setTimeout(() => {
      // Reset timer ref
      calculationTimerRef.current = null;
      
      // Call the calculation function directly
      calculateModules();
    }, 500); // Debounce for 500ms
  }, []);

  // Calculate modules based on polygons and layout parameters
  const calculateModules = useCallback(() => {
    // Skip if already performed or conditions not met
    if (!moduleCalculationPerformedRef.current || !map || !selectedPanel || polygons.length === 0) {
      return;
    }

    console.log("Calculating module placement...");
    
    // Clear existing module rectangles
    clearModuleRectangles();
    
    try {
      // Basic simplified implementation for now
      // This would be replaced with actual module placement logic
      const modulesPerPolygon: Record<number, number> = {};
      let totalPlacedCount = 0;
      
      // Create polygon configs
      const updatedPolygonConfigs: PolygonConfig[] = [];
      
      // Calculate placed modules for each polygon
      polygons.forEach((poly, index) => {
        const area = poly.area;
        const azimuth = poly.azimuth || 180;
        
        // Basic module count estimation based on area and structure
        const panelLengthM = (selectedPanel.length || 1700) / 1000;
        const panelWidthM = (selectedPanel.width || 1000) / 1000;
        const moduleArea = (panelLengthM * panelWidthM);
        const gcr = structureType.groundCoverageRatio;
        
        // Simplified module count calculation
        const estimatedModuleCount = Math.floor((area * gcr) / moduleArea);
        const placedModules = Math.min(estimatedModuleCount, moduleCount - totalPlacedCount);
        
        modulesPerPolygon[index] = placedModules;
        totalPlacedCount += placedModules;
        
        // Create polygon config
        const capacityKw = (placedModules * selectedPanel.power_rating) / 1000;
        
        updatedPolygonConfigs.push({
          id: index,
          area: area,
          azimuth: azimuth,
          moduleCount: placedModules,
          capacityKw: capacityKw,
          structureType: structureType.id,
          tiltAngle: layoutParams.tiltAngle
        });
      });
      
      // Update state with calculated values
      setPlacedModuleCount(totalPlacedCount);
      setPlacedModulesPerPolygon(modulesPerPolygon);
      setPolygonConfigs(updatedPolygonConfigs);
      
      // Calculate total capacity
      const totalCapacityKw = updatedPolygonConfigs.reduce((sum, config) => sum + config.capacityKw, 0);
      setTotalCapacity(totalCapacityKw);
      
      // Notify parent component
      onCapacityCalculated(totalCapacityKw, totalArea, totalPlacedCount, updatedPolygonConfigs);
      
      // Mark calculation as complete
      moduleCalculationPerformedRef.current = false;
      
      console.log(`Module calculation complete: ${totalPlacedCount} modules placed`);
      
    } catch (error) {
      console.error("Error calculating module placement:", error);
      toast.error("Error calculating module placement");
      moduleCalculationPerformedRef.current = false;
    }
  }, [clearModuleRectangles, layoutParams, map, moduleCount, onCapacityCalculated, polygons, selectedPanel, structureType.groundCoverageRatio, structureType.id, totalArea]);
  
  // Reset calculation flag when dependencies change
  useEffect(() => {
    moduleCalculationPerformedRef.current = true;
    
    // Schedule calculation
    if (calculationTimerRef.current !== null) {
      window.clearTimeout(calculationTimerRef.current);
    }
    
    calculationTimerRef.current = window.setTimeout(() => {
      calculationTimerRef.current = null;
      calculateModules();
    }, 200);
    
    // Clean up on unmount
    return () => {
      if (calculationTimerRef.current !== null) {
        window.clearTimeout(calculationTimerRef.current);
      }
      clearModuleRectangles();
    };
  }, [polygons, selectedPanel, moduleCount, structureType.id, layoutParams, calculateModules, clearModuleRectangles]);

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
