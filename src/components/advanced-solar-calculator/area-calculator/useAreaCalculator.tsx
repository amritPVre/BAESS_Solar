
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { SolarPanel } from '@/types/components';
import { DEFAULT_LAYOUT_PARAMS, STRUCTURE_TYPES } from './constants';
import { PolygonConfig, StructureType, LayoutParameters, EdgeMidpoint } from './types';
import { useModulePlacement } from './hooks/useModulePlacement';
import { useMidpointMarkers } from './hooks/useMidpointMarkers';
import { usePolygonManager } from './hooks/usePolygonManager';
import { useMapDrawing } from './hooks/useMapDrawing';

interface UseAreaCalculatorProps {
  selectedPanel: SolarPanel;
  onCapacityCalculated: (capacityKw: number, areaM2: number, moduleCount: number, configs?: PolygonConfig[]) => void;
  latitude: number;
  longitude: number;
}

export const useAreaCalculator = ({ 
  selectedPanel, 
  onCapacityCalculated, 
  latitude, 
  longitude 
}: UseAreaCalculatorProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [structureType, setStructureType] = useState<StructureType>(STRUCTURE_TYPES[0]);
  const [instructionsVisible, setInstructionsVisible] = useState(true);
  const [layoutParams, setLayoutParams] = useState<LayoutParameters>(DEFAULT_LAYOUT_PARAMS.ballasted);
  const [moduleCount, setModuleCount] = useState(0);
  const [layoutAzimuth, setLayoutAzimuth] = useState<number>(180);
  const moduleCalculationRef = useRef<{ triggerCalculation: () => void }>({ triggerCalculation: () => {} });

  // Use the polygon manager hook
  const { 
    polygons, 
    setPolygons, 
    totalArea,
    selectedPolygonIndex,
    setSelectedPolygonIndex,
    polygonDrawOptions,
    clearAllPolygons
  } = usePolygonManager({
    onPolygonChange: () => moduleCalculationRef.current.triggerCalculation()
  });

  // Handle midpoint marker clicks (for setting azimuth)
  const handleMidpointClick = useCallback((midpoint: EdgeMidpoint, markerIndex: number) => {
    console.log(`Midpoint clicked: Polygon ${midpoint.polygonIndex}, Edge ${midpoint.edgeIndex}, Heading: ${midpoint.heading.toFixed(1)}`);
    
    // Update the azimuth for the specific polygon instead of the global azimuth
    setPolygons(prevPolygons => prevPolygons.map((poly, idx) => 
      idx === midpoint.polygonIndex 
        ? { ...poly, azimuth: midpoint.heading }
        : poly
    ));
    
    // Also update the global azimuth state for display purposes
    setLayoutAzimuth(midpoint.heading);
    
    // Update the selected polygon index
    setSelectedPolygonIndex(midpoint.polygonIndex);
    
    // Trigger module calculation after azimuth changes
    moduleCalculationRef.current.triggerCalculation();
  }, [setPolygons, setSelectedPolygonIndex]);

  // Use the midpoint markers hook
  const { midpointMarkersRef } = useMidpointMarkers({
    map,
    polygons,
    selectedPolygonIndex,
    layoutAzimuth,
    onMidpointClick: handleMidpointClick
  });

  // Use the map drawing hook
  const {
    drawingManagerRef,
    initializeDrawingManager,
    startDrawingPolygon,
    startDrawingRectangle
  } = useMapDrawing({
    polygonDrawOptions,
    polygons,
    setPolygons,
    setSelectedPolygonIndex,
    triggerModuleCalculation: () => moduleCalculationRef.current.triggerCalculation()
  });

  // Handle missing API key warning
  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      toast.error('Google Maps API key is missing. Please add it to your environment variables as VITE_GOOGLE_MAPS_API_KEY.');
    }
  }, []);

  // Update layout parameters when structure type changes
  useEffect(() => {
    const defaultParams = DEFAULT_LAYOUT_PARAMS[structureType.id] || DEFAULT_LAYOUT_PARAMS.ballasted;
    
    // Preserve tableConfig if we're switching to ground_mount_tables and already have settings
    if (structureType.id === 'ground_mount_tables' && layoutParams.tableConfig) {
      setLayoutParams({
        ...defaultParams,
        tableConfig: layoutParams.tableConfig
      });
    } else {
      setLayoutParams(defaultParams);
    }
    
    // Signal that module calculation should be performed
    moduleCalculationRef.current.triggerCalculation();
  }, [structureType.id]);

  // Calculate theoretical module count
  useEffect(() => {
    if (polygons.length === 0) {
      setModuleCount(0);
      return;
    }
    
    // Calculate theoretical module counts just for display
    if (totalArea > 0 && selectedPanel) {
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
      const calculatedModuleCount = Math.floor((totalArea * gcr) / moduleArea);
      
      setModuleCount(calculatedModuleCount);
    }
  }, [polygons, selectedPanel, structureType.groundCoverageRatio, totalArea]);

  // Use the module placement hook
  const {
    placedModuleCount,
    placedModulesPerPolygon,
    totalCapacity,
    polygonConfigs,
    triggerModuleCalculation
  } = useModulePlacement({
    map,
    polygons,
    selectedPanel,
    moduleCount,
    structureType,
    layoutParams,
    totalArea,
    onCapacityCalculated
  });

  // Store reference to trigger calculation function
  useEffect(() => {
    moduleCalculationRef.current = {
      triggerCalculation: triggerModuleCalculation
    };
  }, [triggerModuleCalculation]);

  return {
    map,
    setMap: initializeDrawingManager,
    polygons,
    totalArea,
    totalCapacity,
    moduleCount,
    placedModuleCount,
    placedModulesPerPolygon,
    polygonConfigs,
    structureType,
    setStructureType,
    drawingManagerRef,
    instructionsVisible,
    setInstructionsVisible,
    layoutParams,
    setLayoutParams,
    structureTypes: STRUCTURE_TYPES,
    startDrawingPolygon,
    startDrawingRectangle,
    clearAllPolygons,
  };
};
