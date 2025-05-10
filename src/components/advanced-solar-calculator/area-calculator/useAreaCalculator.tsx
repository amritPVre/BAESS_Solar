
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { SolarPanel } from '@/types/components';
import { PolygonConfig } from './types';
import { useModulePlacement } from './hooks/useModulePlacement';
import { useMidpointMarkers } from './hooks/useMidpointMarkers';
import { usePolygonManager } from './hooks/usePolygonManager';
import { useMapDrawing } from './hooks/useMapDrawing';
import { useMapState } from './hooks/useMapState';
import { useStructureParameters } from './hooks/useStructureParameters';
import { useUIState } from './hooks/useUIState';

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
  // Use the new hooks to manage different concerns
  const {
    mapRef,
    mapCenter,
    onMapLoaded
  } = useMapState({ 
    initialLatitude: latitude, 
    initialLongitude: longitude 
  });

  const {
    structureType,
    setStructureType,
    layoutParams,
    setLayoutParams,
    structureTypes
  } = useStructureParameters({
    onStructureChange: () => {
      // Trigger module calculation when structure parameters change
      if (moduleCalculationRef.current.triggerCalculation) {
        moduleCalculationRef.current.triggerCalculation();
      }
    }
  });

  const {
    instructionsVisible,
    setInstructionsVisible,
    layoutAzimuth,
    setLayoutAzimuth
  } = useUIState({ showInstructionsDefault: true });

  // Track initialization state
  const moduleCalculationRef = useRef<{ triggerCalculation: () => void }>({ triggerCalculation: () => {} });
  const [moduleCount, setModuleCount] = useState(0);
  
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
    onPolygonChange: () => {
      // Use debounced calculation to prevent rapid consecutive calls
      if (moduleCalculationRef.current.triggerCalculation) {
        moduleCalculationRef.current.triggerCalculation();
      }
    }
  });
  
  // Handle midpoint marker clicks (for setting azimuth)
  const handleMidpointClick = useCallback((midpoint: any, markerIndex: number) => {
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
    if (moduleCalculationRef.current.triggerCalculation) {
      setTimeout(() => moduleCalculationRef.current.triggerCalculation(), 0);
    }
  }, [setPolygons, setSelectedPolygonIndex, setLayoutAzimuth]);

  // Use the midpoint markers hook with memoized dependencies
  const { midpointMarkersRef } = useMidpointMarkers({
    map: mapRef.current,
    polygons,
    selectedPolygonIndex,
    layoutAzimuth,
    onMidpointClick: handleMidpointClick
  });

  // Use the map drawing hook with proper dependency injection
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
    triggerModuleCalculation: () => {
      if (moduleCalculationRef.current && moduleCalculationRef.current.triggerCalculation) {
        moduleCalculationRef.current.triggerCalculation();
      }
    }
  });

  // Calculate theoretical module count
  useEffect(() => {
    // Only recalculate when relevant dependencies change
    const calculateModuleCount = () => {
      if (polygons.length === 0) {
        setModuleCount(0);
        return;
      }
      
      if (totalArea > 0 && selectedPanel) {
        // Get panel dimensions correctly using appropriate type handling
        const defaultLength = 1700; // mm
        const defaultWidth = 1000;  // mm
        
        // Safely extract dimensions with proper type checking
        let panelLength = defaultLength;
        let panelWidth = defaultWidth;
        
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
    };
    
    calculateModuleCount();
  }, [polygons.length, totalArea, selectedPanel, structureType.groundCoverageRatio]);

  // Use the module placement hook
  const {
    placedModuleCount,
    placedModulesPerPolygon,
    totalCapacity,
    polygonConfigs,
    triggerModuleCalculation
  } = useModulePlacement({
    map: mapRef.current,
    polygons,
    selectedPanel,
    moduleCount,
    structureType,
    layoutParams,
    totalArea,
    onCapacityCalculated
  });

  // Initialize map when loaded
  const handleMapLoaded = useCallback((map: google.maps.Map) => {
    onMapLoaded(map);
    initializeDrawingManager(map);
  }, [onMapLoaded, initializeDrawingManager]);

  // Store reference to trigger calculation function - wrapped in useEffect to prevent loops
  useEffect(() => {
    moduleCalculationRef.current = {
      triggerCalculation: triggerModuleCalculation
    };
  }, [triggerModuleCalculation]);

  return {
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
    structureTypes,
    startDrawingPolygon,
    startDrawingRectangle,
    clearAllPolygons,
    onMapLoaded: handleMapLoaded
  };
};
