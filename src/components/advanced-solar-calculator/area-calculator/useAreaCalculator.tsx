
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import type { SolarPanel } from '@/types/components';
import { DEFAULT_LAYOUT_PARAMS, DEFAULT_POLYGON_OPTIONS, STRUCTURE_TYPES } from './constants';
import { PolygonInfo, PolygonConfig, EdgeMidpoint, LayoutParameters, StructureType } from './types';
import { calculatePolygonArea, initializeDrawingManager, convertRectangleToPolygon, setupPolygonListeners } from './utils/drawingUtils';
import { useModulePlacement } from './hooks/useModulePlacement';
import { useMidpointMarkers } from './hooks/useMidpointMarkers';

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
  const [polygons, setPolygons] = useState<PolygonInfo[]>([]);
  const [totalArea, setTotalArea] = useState(0);
  const [structureType, setStructureType] = useState<StructureType>(STRUCTURE_TYPES[0]);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const [instructionsVisible, setInstructionsVisible] = useState(true);
  const [layoutParams, setLayoutParams] = useState<LayoutParameters>(DEFAULT_LAYOUT_PARAMS.ballasted);
  const [moduleCount, setModuleCount] = useState(0);
  const [selectedPolygonIndex, setSelectedPolygonIndex] = useState<number | null>(0);
  const [layoutAzimuth, setLayoutAzimuth] = useState<number>(180);
  const moduleCalculationRef = useRef<{ triggerCalculation: () => void }>({ triggerCalculation: () => {} });

  const structureTypes = useMemo(() => STRUCTURE_TYPES, []);

  // Define polygon draw options (memoized)
  const polygonDrawOptions = useMemo(() => DEFAULT_POLYGON_OPTIONS, []);

  // Handle missing API key warning
  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      toast.error('Google Maps API key is missing. Please add it to your environment variables as VITE_GOOGLE_MAPS_API_KEY.');
    }
  }, []);

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
  }, []);

  // Use the midpoint markers hook
  const { midpointMarkersRef } = useMidpointMarkers({
    map,
    polygons,
    selectedPolygonIndex,
    layoutAzimuth,
    onMidpointClick: handleMidpointClick
  });

  // Handle polygon complete event from DrawingManager
  const handlePolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    // Calculate the area for this polygon
    const area = calculatePolygonArea(polygon);
    
    // Add the polygon to our state with default azimuth of 180°
    setPolygons(prev => [...prev, { polygon, area, azimuth: 180 }]);
    
    // Set up listeners for polygon changes
    setupPolygonListeners(
      polygon, 
      prev => prev.length, 
      calculatePolygonArea,
      polygonDrawOptions,
      polygons,
      setPolygons,
      setSelectedPolygonIndex,
      () => moduleCalculationRef.current.triggerCalculation()
    );
    
    // Switch drawing manager back to non-drawing mode
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
  }, [calculatePolygonArea, polygonDrawOptions, polygons]);
  
  // Handle rectangle complete event from DrawingManager
  const handleRectangleComplete = useCallback((rectangle: google.maps.Rectangle) => {
    const polygon = convertRectangleToPolygon(rectangle, map, polygonDrawOptions);
    
    if (!polygon) {
      console.error("Failed to convert rectangle to polygon");
      return;
    }
    
    // Calculate the area
    const area = calculatePolygonArea(polygon);
    
    // Add the polygon to our state with default azimuth of 180°
    const newIndex = polygons.length;
    setPolygons(prev => [...prev, { polygon, area, azimuth: 180 }]);
    
    // Set up listeners for polygon changes
    setupPolygonListeners(
      polygon, 
      newIndex, 
      calculatePolygonArea,
      polygonDrawOptions,
      polygons,
      setPolygons,
      setSelectedPolygonIndex,
      () => moduleCalculationRef.current.triggerCalculation()
    );
    
    // Switch drawing manager back to non-drawing mode
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
  }, [map, polygonDrawOptions, polygons.length]);

  // Initialize Google Maps DrawingManager
  const initializeDrawingManagerWrapper = useCallback((googleMap: google.maps.Map) => {
    setMap(googleMap);
    console.log("Map loaded successfully");
    
    const manager = initializeDrawingManager(
      googleMap, 
      polygonDrawOptions,
      handlePolygonComplete,
      handleRectangleComplete
    );
    
    drawingManagerRef.current = manager;
  }, [handlePolygonComplete, handleRectangleComplete, polygonDrawOptions]);

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

  // Calculate total area and theoretical module count
  useEffect(() => {
    if (polygons.length === 0) {
      setTotalArea(0);
      setModuleCount(0);
      return;
    }

    const calculatedTotalArea = polygons.reduce((sum, poly) => sum + poly.area, 0);
    setTotalArea(calculatedTotalArea);
    
    // Calculate theoretical module counts just for display
    if (calculatedTotalArea > 0 && selectedPanel) {
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
      const calculatedModuleCount = Math.floor((calculatedTotalArea * gcr) / moduleArea);
      
      setModuleCount(calculatedModuleCount);
    }
    
    // Signal that module calculation should be performed
    moduleCalculationRef.current.triggerCalculation();
  }, [polygons, selectedPanel, structureType.groundCoverageRatio]);

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

  // Start drawing mode with the drawing manager
  const startDrawingPolygon = useCallback(() => {
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    }
  }, []);
  
  // Start drawing rectangle with the drawing manager
  const startDrawingRectangle = useCallback(() => {
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
    }
  }, []);

  // Clear all polygons
  const clearAllPolygons = useCallback(() => {
    polygons.forEach(({ polygon }) => {
      polygon.setMap(null);
    });
    
    // Clear midpoint markers
    midpointMarkersRef.current.forEach(marker => {
      marker.map = null; // Clear markers by setting map to null
    }); 
    
    setPolygons([]);
    setTotalArea(0);
    setModuleCount(0);
    
    onCapacityCalculated(0, 0, 0, []);
    
    // Reset drawing mode
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
  }, [polygons, onCapacityCalculated, midpointMarkersRef]);

  return {
    map,
    setMap: initializeDrawingManagerWrapper,
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
    structureTypes,
    startDrawingPolygon,
    startDrawingRectangle,
    clearAllPolygons,
  };
};
