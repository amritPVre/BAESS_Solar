
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
    const hasGeometryLib = window.google && 
                          window.google.maps && 
                          window.google.maps.geometry && 
                          window.google.maps.geometry.spherical;

    if (!hasGeometryLib) {
      console.error("Google Maps geometry library not available");
      return;
    }

    polygons.forEach((polyInfo, idx) => {
      // Get panel dimensions correctly using appropriate type handling
      // Default values in case dimensions are not available
      const defaultLength = 1700; // mm
      const defaultWidth = 1000;  // mm
      
      // Safely extract dimensions with proper type checking
      let panelLength = defaultLength;
      let panelWidth = defaultWidth;
      
      // Check if the panel has length/width as direct properties
      if (selectedPanel.length && typeof selectedPanel.length === 'number') {
        panelLength = selectedPanel.length;
      } else if (selectedPanel.dimensions && typeof selectedPanel.dimensions?.height === 'number') {
        panelLength = selectedPanel.dimensions.height;
      }
      
      if (selectedPanel.width && typeof selectedPanel.width === 'number') {
        panelWidth = selectedPanel.width;
      } else if (selectedPanel.dimensions && typeof selectedPanel.dimensions?.width === 'number') {
        panelWidth = selectedPanel.dimensions.width;
      }
      
      // Convert to meters and calculate module area
      const panelLengthM = panelLength / 1000;
      const panelWidthM = panelWidth / 1000;
      const moduleArea = (panelLength * panelWidth) / 1000000; // m²
      const adjacentGapM = layoutParams.adjacentGap / 1000;
      
      // Get module dimensions based on orientation
      const moduleDim = layoutParams.orientation === 'landscape'
        ? { width: panelLengthM, height: panelWidthM }
        : { width: panelWidthM, height: panelLengthM };
      
      // Calculate important spacing parameters
      const moduleWidthWithGap = moduleDim.width + adjacentGapM;
      let effectiveRowSpacing = moduleDim.height + layoutParams.interRowSpacing;
      
      // Get the ground coverage ratio for this structure type
      const gcr = structureType.groundCoverageRatio;
      
      // Calculate estimated modules for this polygon based on area and structure type
      const polygonArea = polyInfo.area;
      const estimatedModules = Math.floor((polygonArea * gcr) / moduleArea);
      
      // For advanced placement calculations, get the polygon shape details
      const polygon = polyInfo.polygon;
      const azimuth = polyInfo.azimuth || 180; // Default to 180 if not set
      
      // Specialized handling for different structure types
      let placedModules = 0;
      
      // Get the path of the polygon
      const path = polygon.getPath();
      
      if (path && path.getLength() > 0) {
        // Calculate the bounds of the polygon for visualization
        const bounds = new google.maps.LatLngBounds();
        path.forEach(point => bounds.extend(point));
        
        // Different placement logic based on structure type
        if (structureType.id === 'ground_mount_tables' && layoutParams.tableConfig) {
          // For ground mount tables, place tables instead of individual modules
          const tableConfig = layoutParams.tableConfig;
          const modulesPerTable = tableConfig.rowsPerTable * tableConfig.modulesPerRow;
          
          // Estimate how many tables can fit in this area
          const tableArea = (moduleArea * modulesPerTable) / gcr;
          const estimatedTables = Math.floor(polygonArea / tableArea);
          placedModules = Math.min(estimatedModules, estimatedTables * modulesPerTable);
          
          // Place visual representations of tables if we have a map
          if (map && estimatedTables > 0) {
            // Visual representation code would go here
            // This would include creating rectangles on the map for each table
            // For simplicity, we'll just update the count
          }
          
        } else if (structureType.id === 'carport' && layoutParams.carportConfig) {
          // For carport structures, use carport configuration
          const carportConfig = layoutParams.carportConfig;
          const modulesPerCarport = carportConfig.rows * carportConfig.modulesPerRow;
          
          // Estimate how many carports can fit in this area
          const carportArea = (moduleArea * modulesPerCarport) / gcr;
          const estimatedCarports = Math.floor(polygonArea / carportArea);
          placedModules = Math.min(estimatedModules, estimatedCarports * modulesPerCarport);
          
          // Place visual representations of carports if we have a map
          if (map && estimatedCarports > 0) {
            // Visual representation code would go here
            // This would include creating rectangles on the map for each carport
          }
          
        } else {
          // For other structure types (ballasted, fixed_tilt), place individual modules
          // Use the estimated module count directly
          placedModules = estimatedModules;
          
          // Place visual representations of modules if we have a map
          if (map && placedModules > 0) {
            // Visual representation code would go here
            // This would include creating rectangles on the map for each module
          }
        }
      }
      
      // Ensure we don't exceed the maximum module count
      placedModules = Math.min(placedModules, moduleCount - calculatedModuleCount);
      
      // Store the count for this polygon
      modulesPerPolygon[idx] = placedModules;
      calculatedModuleCount += placedModules;
      
      // Calculate capacity for this polygon
      const polygonCapacity = (placedModules * selectedPanel.power_rating) / 1000;
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
