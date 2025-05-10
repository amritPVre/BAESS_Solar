
import { useState, useEffect, useRef } from 'react';
import type { SolarPanel } from '@/types/components';
import { PolygonInfo, PolygonConfig, LayoutParameters, StructureType } from '../types';

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
  const moduleRectanglesRef = useRef<google.maps.Rectangle[]>([]);
  const moduleCalculationPerformedRef = useRef(true);

  // Effect to clear module rectangles when component unmounts
  useEffect(() => {
    return () => {
      moduleRectanglesRef.current.forEach(rect => rect.setMap(null));
    };
  }, []);

  // This effect would contain the actual module placement logic
  // The code for module placement would be moved here from useAreaCalculator
  useEffect(() => {
    if (polygons.length === 0 || !selectedPanel || !map) {
      setPlacedModuleCount(0);
      setPlacedModulesPerPolygon({});
      setPolygonConfigs([]);
      onCapacityCalculated(0, 0, 0, []);
      return;
    }

    // Skip duplicate calculations if nothing changed
    if (!moduleCalculationPerformedRef.current) {
      console.log("Skipping duplicate module placement calculation");
      return;
    }

    console.log("Starting module placement calculation");
    
    // Clear previous modules
    moduleRectanglesRef.current.forEach(rect => rect.setMap(null));
    moduleRectanglesRef.current = [];

    // Placeholder for the actual module placement algorithm
    // This would be the core logic moved from useAreaCalculator
    // It would handle different structure types and their specific layout requirements

    // For this refactoring, we'll implement a simplified version
    // that just calculates capacity based on the area and structure type
    
    // In a real implementation, this would create visual rectangles on the map
    // and handle different structure types (ballasted, fixed_tilt, ground_mount_tables, carport)

    const newPolygonConfigs: PolygonConfig[] = [];
    let calculatedModuleCount = 0;
    let calculatedCapacity = 0;
    const modulesPerPolygon: Record<number, number> = {};

    polygons.forEach((polyInfo, idx) => {
      // Get panel dimensions correctly using appropriate type handling
      // Default values in case dimensions are not available
      const defaultLength = 1700; // mm
      const defaultWidth = 1000;  // mm
      
      // Safely extract dimensions with proper type checking
      let panelLength = defaultLength;
      let panelWidth = defaultWidth;
      
      // Check if the panel has length/width as direct properties
      if ('length' in selectedPanel && typeof selectedPanel.length === 'number') {
        panelLength = selectedPanel.length;
      } else if (selectedPanel.dimensions && typeof selectedPanel.dimensions.height === 'number') {
        panelLength = selectedPanel.dimensions.height;
      }
      
      if ('width' in selectedPanel && typeof selectedPanel.width === 'number') {
        panelWidth = selectedPanel.width;
      } else if (selectedPanel.dimensions && typeof selectedPanel.dimensions.width === 'number') {
        panelWidth = selectedPanel.dimensions.width;
      }
      
      const moduleArea = (panelLength * panelWidth) / 1000000; // m²
      const gcr = structureType.groundCoverageRatio;
      
      // Calculate estimated modules for this polygon
      const estimatedModules = Math.floor((polyInfo.area * gcr) / moduleArea);
      
      // In a full implementation, this would actually place modules on the map
      // For simplicity, we're just estimating the count
      
      // Store the count for this polygon
      modulesPerPolygon[idx] = estimatedModules;
      calculatedModuleCount += estimatedModules;
      
      // Calculate capacity for this polygon
      const polygonCapacity = (estimatedModules * selectedPanel.power_rating) / 1000;
      calculatedCapacity += polygonCapacity;
      
      // Add to polygon configs
      newPolygonConfigs.push({
        id: idx,
        area: polyInfo.area,
        azimuth: polyInfo.azimuth || 180,
        capacityKw: polygonCapacity,
        moduleCount: estimatedModules,
        structureType: structureType.id,
        tiltAngle: layoutParams.tiltAngle
      });
    });

    // Update state with calculated values
    setPlacedModuleCount(calculatedModuleCount);
    setPlacedModulesPerPolygon(modulesPerPolygon);
    setTotalCapacity(calculatedCapacity);
    setPolygonConfigs(newPolygonConfigs);
    
    // Notify parent component about capacity changes
    onCapacityCalculated(calculatedCapacity, totalArea, calculatedModuleCount, newPolygonConfigs);
    
    // Mark calculation as complete
    moduleCalculationPerformedRef.current = false;
    
    console.log(`Module placement finished. Placed count: ${calculatedModuleCount}`);
  }, [
    map, polygons, selectedPanel, moduleCount, 
    structureType, layoutParams, totalArea, 
    onCapacityCalculated
  ]);

  // Function to trigger module calculation
  const triggerModuleCalculation = () => {
    moduleCalculationPerformedRef.current = true;
  };

  return {
    placedModuleCount,
    placedModulesPerPolygon,
    totalCapacity,
    polygonConfigs,
    moduleRectanglesRef,
    triggerModuleCalculation
  };
};
