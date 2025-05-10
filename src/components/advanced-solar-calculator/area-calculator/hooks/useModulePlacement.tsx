
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

  // Implement the actual module placement logic
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

    const newPolygonConfigs: PolygonConfig[] = [];
    let calculatedModuleCount = 0;
    let calculatedCapacity = 0;
    const modulesPerPolygon: Record<number, number> = {};

    // Determine if we have access to Google Maps geometry utilities
    if (!window.google || !window.google.maps || !window.google.maps.geometry) {
      console.error("Google Maps geometry library not available");
      return;
    }

    const panelPowerRating = selectedPanel?.power_rating || 0;

    polygons.forEach((polyInfo, idx) => {
      // Get panel dimensions safely, with proper fallbacks
      const panelLength = selectedPanel?.length || 
                        (selectedPanel?.dimensions?.height) || 1700; // mm
      const panelWidth = selectedPanel?.width || 
                        (selectedPanel?.dimensions?.width) || 1000; // mm
      
      // Convert to meters and calculate module area
      const panelLengthM = panelLength / 1000;
      const panelWidthM = panelWidth / 1000;
      const moduleArea = (panelLength * panelWidth) / 1000000; // m²
      
      // Get the ground coverage ratio for this structure type
      const gcr = structureType.groundCoverageRatio;
      
      // Calculate estimated modules for this polygon based on area and structure type
      const polygonArea = polyInfo.area;
      const estimatedModules = Math.floor((polygonArea * gcr) / moduleArea);
      
      // Specialized handling for different structure types
      let placedModules = 0;
      
      if (structureType.id === 'ground_mount_tables' && layoutParams.tableConfig) {
        // For ground mount tables, we calculate based on tables
        const tableConfig = layoutParams.tableConfig;
        const modulesPerTable = tableConfig.rowsPerTable * tableConfig.modulesPerRow;
        
        // Simple table placement calculation without rendering
        const tableArea = (moduleArea * modulesPerTable) / gcr;
        const estimatedTables = Math.floor(polygonArea / tableArea);
        placedModules = Math.min(estimatedModules, estimatedTables * modulesPerTable);
      } 
      else if (structureType.id === 'carport' && layoutParams.carportConfig) {
        // For carport structures, use carport configuration
        const carportConfig = layoutParams.carportConfig;
        const modulesPerCarport = carportConfig.rows * carportConfig.modulesPerRow;
        
        const carportArea = (moduleArea * modulesPerCarport) / gcr;
        const estimatedCarports = Math.floor(polygonArea / carportArea);
        placedModules = Math.min(estimatedModules, estimatedCarports * modulesPerCarport);
      } 
      else {
        // For other structure types, use simple area-based calculation
        placedModules = estimatedModules;
      }
      
      // Ensure we don't exceed the maximum module count
      placedModules = Math.min(placedModules, moduleCount - calculatedModuleCount);
      
      // Store the count for this polygon
      modulesPerPolygon[idx] = placedModules;
      calculatedModuleCount += placedModules;
      
      // Calculate capacity for this polygon
      const polygonCapacity = (placedModules * panelPowerRating) / 1000;
      calculatedCapacity += polygonCapacity;
      
      // Add to polygon configs
      newPolygonConfigs.push({
        id: idx,
        area: polyInfo.area,
        azimuth: polyInfo.azimuth || 180,
        capacityKw: polygonCapacity,
        moduleCount: placedModules,
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

  // Function to trigger a new module calculation
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
