import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { SolarPanel } from '@/types/components';
import { PolygonConfig, LayoutParameters } from './types';
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
  initialPolygonConfigs?: PolygonConfig[];
}

export const useAreaCalculator = ({ 
  selectedPanel, 
  onCapacityCalculated, 
  latitude, 
  longitude,
  initialPolygonConfigs 
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

  // Only use this for structure type management
  const {
    structureType,
    setStructureType,
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
  } = useUIState({ showInstructionsDefault: false });

  // Track initialization state
  const moduleCalculationRef = useRef<{ triggerCalculation: () => void }>({ triggerCalculation: () => {} });
  const [moduleCount, setModuleCount] = useState(0);
  
  // Create a ref for the calculation timer
  const calculationTimerRef = useRef<number | null>(null);
  
  // Use the polygon manager hook
  const { 
    polygons, 
    setPolygons, 
    totalArea,
    selectedPolygonIndex,
    setSelectedPolygonIndex,
    polygonDrawOptions,
    clearAllPolygons: clearPolygonManagerAreas
  } = usePolygonManager({
    onPolygonChange: () => {
      // Use debounced calculation to prevent rapid consecutive calls
      if (moduleCalculationRef.current.triggerCalculation) {
        moduleCalculationRef.current.triggerCalculation();
      }
    }
  });
  
  // Handle midpoint marker clicks (for setting azimuth)
  const handleMidpointClick = useCallback((midpoint: {
    polygonIndex: number;
    edgeIndex: number;
    heading: number;
  }, markerIndex: number) => {
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

  // The useModulePlacement hook will get layout parameters passed from the parent component 
  // State for module placement results
  const [placedModuleCount, setPlacedModuleCount] = useState(0);
  const [placedModulesPerPolygon, setPlacedModulesPerPolygon] = useState<Record<number, number>>({});
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [polygonConfigs, setPolygonConfigs] = useState<PolygonConfig[]>([]);

  // Simple module calculation function - will be connected to external triggers
  const triggerModuleCalculation = useCallback(() => {
    console.log("triggerModuleCalculation called");
    // This is now handled by the parent component
  }, []);

  // Initialize map when loaded
  const handleMapLoaded = useCallback((map: google.maps.Map) => {
    onMapLoaded(map);
    initializeDrawingManager(map);
  }, [onMapLoaded, initializeDrawingManager]);

  // Create a new comprehensive clear all function
  const handleClearAll = useCallback(() => {
    console.log("Clearing all polygons and modules");
    clearPolygonManagerAreas(); // Clears drawn polygons and updates totalArea via its own effects
    
    // Reset module counts
    setPlacedModuleCount(0);
    setPlacedModulesPerPolygon({});
    setTotalCapacity(0);
    setPolygonConfigs([]);
    
    // Notify parent component that capacity is now zero
    onCapacityCalculated(0, 0, 0, []);
    
  }, [clearPolygonManagerAreas, onCapacityCalculated]);

  // Store reference to trigger calculation function
  useEffect(() => {
    moduleCalculationRef.current = {
      triggerCalculation: () => {
        console.log("Trigger calculation wrapper called");
        triggerModuleCalculation();
      }
    };
  }, [triggerModuleCalculation]);

  // Restore polygons from saved project data
  useEffect(() => {
    if (!mapRef.current || !initialPolygonConfigs || initialPolygonConfigs.length === 0) {
      return;
    }

    // Only restore if there are no polygons currently (to avoid duplicates)
    if (polygons.length > 0) {
      return;
    }

    console.log('🔄 Restoring polygons from saved project data:', initialPolygonConfigs.length);

    const restoredPolygons: {polygon: google.maps.Polygon, area: number, azimuth: number}[] = [];

    initialPolygonConfigs.forEach((config) => {
      if (!config.path || config.path.length === 0) {
        console.warn('⚠️ Polygon config has no path data, skipping:', config);
        return;
      }

      // Create a new polygon from saved path
      const polygon = new google.maps.Polygon({
        paths: config.path.map(coord => ({ lat: coord.lat, lng: coord.lng })),
        strokeColor: '#2563eb',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 0.0,
        editable: true,
        draggable: true,
        map: mapRef.current
      });

      // Calculate area using Google Maps geometry library
      const area = google.maps.geometry.spherical.computeArea(polygon.getPath());

      restoredPolygons.push({
        polygon,
        area,
        azimuth: config.azimuth || 180
      });

      console.log(`✅ Restored polygon ${config.id} with ${config.moduleCount} modules`);
    });

    // Set the restored polygons
    if (restoredPolygons.length > 0) {
      setPolygons(restoredPolygons);
      console.log(`🎉 Successfully restored ${restoredPolygons.length} polygons`);
      
      // Trigger module calculation after a short delay to ensure everything is ready
      setTimeout(() => {
        if (moduleCalculationRef.current && moduleCalculationRef.current.triggerCalculation) {
          moduleCalculationRef.current.triggerCalculation();
        }
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRef.current, initialPolygonConfigs, polygons.length, setPolygons]);

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
    structureTypes,
    startDrawingPolygon,
    startDrawingRectangle,
    clearAllPolygons: handleClearAll,
    onMapLoaded: handleMapLoaded,
    moduleCalculationRef,
    mapRef
  };
};
