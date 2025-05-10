
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
  // Use refs to prevent infinite loops
  const mapRef = useRef<google.maps.Map | null>(null);
  const [structureType, setStructureType] = useState<StructureType>(STRUCTURE_TYPES[0]);
  const [instructionsVisible, setInstructionsVisible] = useState(true);
  const [layoutParams, setLayoutParams] = useState<LayoutParameters>(DEFAULT_LAYOUT_PARAMS.ballasted);
  const [moduleCount, setModuleCount] = useState(0);
  const [layoutAzimuth, setLayoutAzimuth] = useState<number>(180);
  const [userMapBounds, setUserMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: latitude || 40.7128, lng: longitude || -74.0060 });
  
  // Track initialization state
  const moduleCalculationRef = useRef<{ triggerCalculation: () => void }>({ triggerCalculation: () => {} });
  const structureTypeRef = useRef(structureType);
  const layoutParamsRef = useRef(layoutParams);
  const mapInitializedRef = useRef(false);

  // Update refs when state changes
  useEffect(() => {
    structureTypeRef.current = structureType;
  }, [structureType]);

  useEffect(() => {
    layoutParamsRef.current = layoutParams;
  }, [layoutParams]);

  // Update center when coordinates change
  useEffect(() => {
    if (latitude && longitude) {
      setMapCenter({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

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

  // The updateMapCenter function that's debounced
  const updateMapCenter = useCallback(() => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      if (center) {
        setMapCenter({ lat: center.lat(), lng: center.lng() });
      }
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
    if (moduleCalculationRef.current.triggerCalculation) {
      setTimeout(() => moduleCalculationRef.current.triggerCalculation(), 0);
    }
  }, [setPolygons, setSelectedPolygonIndex]);

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

  // Handle missing API key warning
  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      toast.error('Google Maps API key is missing. Please add it to your environment variables as VITE_GOOGLE_MAPS_API_KEY.');
    }
  }, []);

  // Update layout parameters when structure type changes - using refs to prevent loops
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
  }, [structureType.id]);

  // Calculate theoretical module count using refs
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
        const gcr = structureTypeRef.current.groundCoverageRatio;
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

  // The bounds change listener with debouncing
  useEffect(() => {
    if (!mapRef.current) return;
    
    let isInternalBoundsChange = false;
    let boundsChangedTimeoutId: number | null = null;
    
    const boundsChangedListener = mapRef.current.addListener('bounds_changed', () => {
      if (
        mapRef.current && 
        !mapRef.current.getStreetView().getVisible() && 
        !isInternalBoundsChange
      ) {
        // Debounce bounds updates to prevent rapid state changes
        if (boundsChangedTimeoutId) {
          window.clearTimeout(boundsChangedTimeoutId);
        }
        
        boundsChangedTimeoutId = window.setTimeout(() => {
          setUserMapBounds(mapRef.current!.getBounds() || null);
          updateMapCenter();
          boundsChangedTimeoutId = null;
        }, 300); // Debounce for 300ms
      }
    });
    
    // Override the fitBounds method to set our flag
    const originalFitBounds = mapRef.current.fitBounds;
    mapRef.current.fitBounds = function(...args) {
      isInternalBoundsChange = true;
      const result = originalFitBounds.apply(this, args);
      
      window.setTimeout(() => {
        isInternalBoundsChange = false;
        updateMapCenter();
      }, 500);
      
      return result;
    };
    
    // Clean up the listener
    return () => {
      if (boundsChangedListener) {
        google.maps.event.removeListener(boundsChangedListener);
      }
      if (boundsChangedTimeoutId) {
        window.clearTimeout(boundsChangedTimeoutId);
      }
      if (mapRef.current) {
        mapRef.current.fitBounds = originalFitBounds;
      }
    };
  }, [updateMapCenter]);

  // Store reference to trigger calculation function - wrapped in useEffect to prevent loops
  useEffect(() => {
    moduleCalculationRef.current = {
      triggerCalculation: triggerModuleCalculation
    };
  }, [triggerModuleCalculation]);

  // Handle map loading
  const onMapLoaded = useCallback((loadedMap: google.maps.Map) => {
    console.log("Map loaded callback");
    
    // Prevent duplicate initializations
    if (mapInitializedRef.current && mapRef.current === loadedMap) {
      console.log("Map already initialized, skipping");
      return;
    }
    
    mapRef.current = loadedMap;
    mapInitializedRef.current = true;
    
    // Initialize drawing manager on the loaded map
    initializeDrawingManager(loadedMap);
  }, [initializeDrawingManager]);

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
    structureTypes: STRUCTURE_TYPES,
    startDrawingPolygon,
    startDrawingRectangle,
    clearAllPolygons,
    onMapLoaded
  };
};
