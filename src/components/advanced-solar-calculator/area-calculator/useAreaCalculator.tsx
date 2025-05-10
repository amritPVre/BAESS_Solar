
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import type { SolarPanel } from '@/types/components';
import { DEFAULT_LAYOUT_PARAMS, DEFAULT_POLYGON_OPTIONS, STRUCTURE_TYPES } from './constants';
import { PolygonInfo, PolygonConfig, EdgeMidpoint, LayoutParameters, StructureType } from './types';

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
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [totalModules, setTotalModules] = useState(0);
  const [polygonConfigs, setPolygonConfigs] = useState<PolygonConfig[]>([]);
  const [structureType, setStructureType] = useState<StructureType>(STRUCTURE_TYPES[0]);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const [instructionsVisible, setInstructionsVisible] = useState(true);
  const calculationPendingRef = useRef(false);
  const [layoutParams, setLayoutParams] = useState<LayoutParameters>(DEFAULT_LAYOUT_PARAMS.ballasted);
  const [moduleCount, setModuleCount] = useState(0);
  const [placedModuleCount, setPlacedModuleCount] = useState(0);
  const moduleRectanglesRef = useRef<google.maps.Rectangle[]>([]);
  const midpointMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]); 
  const [selectedPolygonIndex, setSelectedPolygonIndex] = useState<number | null>(0);
  const [layoutAzimuth, setLayoutAzimuth] = useState<number>(180);
  const moduleCalculationPerformedRef = useRef(true);
  const [selectedMidpointIdx, setSelectedMidpointIdx] = useState<number | null>(null);
  const [placedModulesPerPolygon, setPlacedModulesPerPolygon] = useState<Record<number, number>>({});

  const structureTypes = useMemo(() => STRUCTURE_TYPES, []);

  // Define polygon draw options (memoized)
  const polygonDrawOptions = useMemo(() => DEFAULT_POLYGON_OPTIONS, []);

  useEffect(() => {
    // Show a toast if API key is missing
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      toast.error('Google Maps API key is missing. Please add it to your environment variables as VITE_GOOGLE_MAPS_API_KEY.');
    }
  }, []);

  // Calculate area of a polygon
  const calculatePolygonArea = useCallback((polygon: google.maps.Polygon): number => {
    try {
      if (!window.google || !window.google.maps || !window.google.maps.geometry || !window.google.maps.geometry.spherical) {
        console.error("Google Maps geometry library not loaded");
        return 0;
      }
      
      const path = polygon.getPath();
      return window.google.maps.geometry.spherical.computeArea(path);
    } catch (error) {
      console.error("Error calculating area:", error);
      return 0;
    }
  }, []);

  // Handle clicking markers to set azimuth
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
    
    // Update the selected marker index for visual feedback
    setSelectedMidpointIdx(markerIndex);
    
    // Update the marker appearances to highlight the selected one
    if (window.google && window.google.maps && window.google.maps.marker) {
      midpointMarkersRef.current.forEach((marker, idx) => {
        if (idx === markerIndex) {
          // Selected marker - create a larger, highlighted pin
          const selectedPin = new google.maps.marker.PinElement({
            scale: 1.0,          // Larger scale
            background: '#FFCC00', // Brighter yellow
            borderColor: '#FF0000', // Red border
            glyphColor: '#000000'
          });
          marker.content = selectedPin.element;
        } else {
          // Regular markers - return to normal appearance
          const regularPin = new google.maps.marker.PinElement({
            scale: 0.7,
            background: '#FFFF00', // Yellow background
            borderColor: '#000000', // Black border
            glyphColor: '#000000'
          });
          marker.content = regularPin.element;
        }
      });
    }
    
    // Trigger module calculation after azimuth changes
    moduleCalculationPerformedRef.current = true;
  }, []);

  // Handle polygon complete event from DrawingManager
  const handlePolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    // Calculate the area for this polygon
    const area = calculatePolygonArea(polygon);
    
    // Add the polygon to our state with default azimuth of 180°
    setPolygons(prev => [...prev, { polygon, area, azimuth: 180 }]);
    
    // Set up listeners for polygon changes
    setupPolygonListeners(polygon, prev => prev.length);
    
    // Switch drawing manager back to non-drawing mode
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
  }, [calculatePolygonArea]);
  
  // Handle rectangle complete event from DrawingManager
  const handleRectangleComplete = useCallback((rectangle: google.maps.Rectangle) => {
    const bounds = rectangle.getBounds();
    if (!bounds) {
      console.error("Rectangle bounds are undefined");
      return;
    }
    
    try {
      // Convert rectangle to polygon
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const nw = new google.maps.LatLng(ne.lat(), sw.lng());
      const se = new google.maps.LatLng(sw.lat(), ne.lng());
      
      // Create polygon path in clockwise order
      const path = [ne, se, sw, nw];
      
      // Create a polygon instead of using the rectangle directly
      const polygon = new window.google.maps.Polygon({
        paths: path,
        ...polygonDrawOptions,
        map: map
      });
      
      // Remove the rectangle
      rectangle.setMap(null);
      
      // Calculate the area
      const area = calculatePolygonArea(polygon);
      
      // Add the polygon to our state with default azimuth of 180°
      const newIndex = polygons.length;
      setPolygons(prev => [...prev, { polygon, area, azimuth: 180 }]);
      
      // Set up listeners for polygon changes
      setupPolygonListeners(polygon, newIndex);
      
      // Switch drawing manager back to non-drawing mode
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setDrawingMode(null);
      }
    } catch (error) {
      console.error("Error converting rectangle to polygon:", error);
    }
  }, [map, calculatePolygonArea, polygonDrawOptions, polygons.length]);
  
  // Set up event listeners for polygon
  const setupPolygonListeners = useCallback((polygon: google.maps.Polygon, index: number | ((prev: number) => number)) => {
    polygon.setOptions(polygonDrawOptions);
    const path = polygon.getPath();
    let updateTimeout: number | undefined;
    
    const updatePolygon = () => {
      // Use debounce to avoid excessive updates during drag/resize
      if (updateTimeout) {
        window.clearTimeout(updateTimeout);
      }
      
      updateTimeout = window.setTimeout(() => {
        const updatedArea = calculatePolygonArea(polygon);
        polygon.setOptions(polygonDrawOptions);
        
        // Update the specific polygon's area and trigger re-render which recalculates midpoints
        setPolygons(prevPolygons => 
          prevPolygons.map(poly => 
            poly.polygon === polygon ? { ...poly, area: updatedArea } : poly
          )
        );
        
        // Signal that module calculation should be performed
        moduleCalculationPerformedRef.current = true;
        
        updateTimeout = undefined;
      }, 200); // Debounce for 200ms
    };
    
    // Add click handler to select this polygon
    google.maps.event.addListener(polygon, 'click', () => {
      const polyIndex = typeof index === 'function' ? index(polygons.length) : index;
      console.log(`Polygon ${polyIndex} selected`);
      setSelectedPolygonIndex(polyIndex);
      
      // Update styling of polygons to highlight the selected one
      polygons.forEach((poly, idx) => {
        const options = {...polygonDrawOptions};
        if (idx === polyIndex) {
          options.fillColor = "#FF6600";
          options.strokeColor = "#FF6600";
          options.strokeWeight = 2;
        }
        poly.polygon.setOptions(options);
      });
    });
    
    google.maps.event.addListener(polygon, 'mouseup', updatePolygon);
    google.maps.event.addListener(polygon, 'dragend', updatePolygon);
    google.maps.event.addListener(path, 'set_at', updatePolygon);
    google.maps.event.addListener(path, 'insert_at', updatePolygon);
    google.maps.event.addListener(path, 'remove_at', updatePolygon);
    
  }, [calculatePolygonArea, polygonDrawOptions, polygons]);

  // Initialize Google Maps DrawingManager
  const initializeDrawingManager = useCallback((googleMap: google.maps.Map) => {
    setMap(googleMap);
    console.log("Map loaded successfully");
    
    // Initialize drawing manager
    if (window.google && window.google.maps && window.google.maps.drawing) {
      try {
        const drawingManager = new window.google.maps.drawing.DrawingManager({
          drawingMode: null,
          drawingControl: true,
          drawingControlOptions: {
            position: window.google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [
              window.google.maps.drawing.OverlayType.POLYGON,
              window.google.maps.drawing.OverlayType.RECTANGLE
            ],
          },
          polygonOptions: polygonDrawOptions,
          rectangleOptions: { ...polygonDrawOptions }
        });
        
        drawingManager.setMap(googleMap);
        drawingManagerRef.current = drawingManager;
        
        // Add polygon complete listener
        window.google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
          console.log("Polygon completed");
          handlePolygonComplete(polygon);
        });
        
        // Add rectangle complete listener
        window.google.maps.event.addListener(drawingManager, 'rectanglecomplete', (rectangle: google.maps.Rectangle) => {
          console.log("Rectangle completed");
          handleRectangleComplete(rectangle);
        });

        // Keep drawing mode enabled after completing a shape
        google.maps.event.addListener(drawingManager, 'overlaycomplete', () => {
          // Keep the current drawing mode after shape completion
          drawingManager.setDrawingMode(null);
        });
      } catch (error) {
        console.error("Error initializing drawing manager:", error);
        toast.error("Failed to initialize drawing tools. Please refresh the page.");
      }
    }
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
    moduleCalculationPerformedRef.current = true;
  }, [structureType.id]);

  // Calculate total area, estimated module count, AND manage midpoint markers
  useEffect(() => {
    if (polygons.length === 0) {
      setTotalArea(0);
      setModuleCount(0);
      setPlacedModuleCount(0);
      setPolygonConfigs([]);
      onCapacityCalculated(0, 0, 0, []);
      return;
    }

    const calculatedTotalArea = polygons.reduce((sum, poly) => sum + poly.area, 0);
    setTotalArea(calculatedTotalArea);
    
    // Clear existing midpoint markers
    midpointMarkersRef.current.forEach(marker => {
      // AdvancedMarkerElement doesn't have setMap(null), set map property to null
      marker.map = null; 
    });
    midpointMarkersRef.current = [];
    
    // Only create new markers if we have map and valid polygons
    if (map && window.google && window.google.maps.geometry && window.google.maps.geometry.spherical && window.google.maps.marker) {
      const { spherical } = window.google.maps.geometry;
      const { PinElement } = window.google.maps.marker;
      const newMidpointMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
      
      // Process each polygon to create edge midpoint markers
      polygons.forEach((polyInfo, polygonIndex) => {
        const path = polyInfo.polygon.getPath();
        const pathLength = path.getLength();
        if (pathLength >= 2) {
          for (let i = 0; i < pathLength; i++) {
            const startPoint = path.getAt(i)!;
            const endPoint = path.getAt((i + 1) % pathLength)!;
            
            const midpointLatLng = new google.maps.LatLng(
              (startPoint.lat() + endPoint.lat()) / 2,
              (startPoint.lng() + endPoint.lng()) / 2
            );
            
            const heading = spherical.computeHeading(startPoint, endPoint);
            const normalizedHeading = (heading < 0) ? heading + 360 : heading;
            
            const solarAzimuth = (normalizedHeading + 90) % 360;
            const markerTooltip = `Set Azimuth (${solarAzimuth.toFixed(1)}°)`;
            
            const midpointData: EdgeMidpoint = {
              polygonIndex,
              edgeIndex: i,
              position: { lat: midpointLatLng.lat(), lng: midpointLatLng.lng() },
              heading: solarAzimuth
            };

            const polygonAzimuth = polyInfo.azimuth || 180;
            const isSelected = solarAzimuth === polygonAzimuth;
            const pin = new PinElement({
              scale: isSelected ? 1.2 : 0.7,  
              background: isSelected ? '#FFCC00' : '#FFFF00',
              borderColor: isSelected ? '#FF0000' : '#000000',
              glyphColor: '#000000'
            });

            const marker = new google.maps.marker.AdvancedMarkerElement({
              position: midpointData.position,
              map: map,
              content: pin.element,
              title: markerTooltip,
              zIndex: 3
            });

            const currentMarkerIndex = newMidpointMarkers.length;
            marker.addListener('gmp-click', () => handleMidpointClick(midpointData, currentMarkerIndex));
            
            newMidpointMarkers.push(marker);
            
            if (isSelected) {
              setSelectedMidpointIdx(currentMarkerIndex);
            }
          }
        }
      });
      
      midpointMarkersRef.current = newMidpointMarkers;
    }

    // Clear existing module rectangles from map and ref
    moduleRectanglesRef.current.forEach(rect => rect.setMap(null));
    moduleRectanglesRef.current = [];
    setPlacedModuleCount(0);
    
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
      // We'll let the module placement effect handle calling onCapacityCalculated
    }
    
    // Signal that module calculation should be performed
    moduleCalculationPerformedRef.current = true;
  }, [polygons, map, selectedPanel, structureType.groundCoverageRatio, handleMidpointClick, onCapacityCalculated]);

  // Implementation of module placement logic omitted for brevity
  // You would import this logic from a separate module like useModulePlacement
  // However, the current implementation is very long (1000+ lines)

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
    
    // Clear module rectangles
    moduleRectanglesRef.current.forEach(rect => rect.setMap(null));
    moduleRectanglesRef.current = [];
    
    // Clear midpoint markers
    midpointMarkersRef.current.forEach(marker => {
      marker.map = null; // Clear markers by setting map to null
    }); 
    midpointMarkersRef.current = [];
    
    setPolygons([]);
    setTotalArea(0);
    setTotalCapacity(0);
    setTotalModules(0);
    setModuleCount(0);
    setPlacedModuleCount(0);
    setPlacedModulesPerPolygon({});
    setPolygonConfigs([]);
    
    onCapacityCalculated(0, 0, 0, []);
    
    // Reset drawing mode
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
  }, [polygons, onCapacityCalculated]);

  return {
    map,
    setMap: initializeDrawingManager,
    polygons,
    totalArea,
    totalCapacity,
    totalModules,
    polygonConfigs,
    structureType,
    setStructureType,
    drawingManagerRef,
    instructionsVisible,
    setInstructionsVisible,
    layoutParams,
    moduleCount,
    placedModuleCount,
    placedModulesPerPolygon,
    structureTypes,
    startDrawingPolygon,
    startDrawingRectangle,
    clearAllPolygons,
  };
};
