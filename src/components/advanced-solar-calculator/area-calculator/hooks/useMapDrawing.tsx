
import { useRef, useCallback, useState } from 'react';
import { toast } from "sonner";
import { PolygonInfo } from '../types';
import { convertRectangleToPolygon, calculatePolygonArea, setupPolygonListeners, initializeDrawingManager } from '../utils/drawingUtils';

interface UseMapDrawingProps {
  polygonDrawOptions: google.maps.PolygonOptions;
  polygons: PolygonInfo[];
  setPolygons: React.Dispatch<React.SetStateAction<PolygonInfo[]>>;
  setSelectedPolygonIndex: React.Dispatch<React.SetStateAction<number | null>>;
  triggerModuleCalculation: () => void;
}

export const useMapDrawing = ({
  polygonDrawOptions,
  polygons,
  setPolygons,
  setSelectedPolygonIndex,
  triggerModuleCalculation
}: UseMapDrawingProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);

  // Handle polygon complete event from DrawingManager
  const handlePolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    // Calculate the area for this polygon
    const area = calculatePolygonArea(polygon);
    
    // Add the polygon to our state with default azimuth of 180°
    setPolygons(prev => [...prev, { polygon, area, azimuth: 180 }]);
    
    // Set up listeners for polygon changes
    setupPolygonListeners(
      polygon, 
      polygons.length, 
      calculatePolygonArea,
      polygonDrawOptions,
      polygons,
      setPolygons,
      setSelectedPolygonIndex,
      triggerModuleCalculation
    );
    
    // Switch drawing manager back to non-drawing mode
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
    
    toast.success("Polygon created successfully");
  }, [polygons, polygonDrawOptions, setPolygons, setSelectedPolygonIndex, triggerModuleCalculation]);
  
  // Handle rectangle complete event from DrawingManager
  const handleRectangleComplete = useCallback((rectangle: google.maps.Rectangle) => {
    if (!map) {
      console.error("Map is not initialized");
      return;
    }
    
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
      triggerModuleCalculation
    );
    
    // Switch drawing manager back to non-drawing mode
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
    
    toast.success("Rectangle created successfully");
  }, [map, polygons, polygonDrawOptions, setPolygons, setSelectedPolygonIndex, triggerModuleCalculation]);

  // Initialize Google Maps DrawingManager
  const initializeDrawingManagerWrapper = useCallback((googleMap: google.maps.Map) => {
    setMap(googleMap);
    console.log("Map loaded successfully");
    
    // Check if drawing manager is already initialized
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setMap(null);
      drawingManagerRef.current = null;
    }
    
    // Wait a moment to ensure Google Maps API is fully loaded
    setTimeout(() => {
      const manager = initializeDrawingManager(
        googleMap, 
        polygonDrawOptions,
        handlePolygonComplete,
        handleRectangleComplete
      );
      
      drawingManagerRef.current = manager;
      
      // Register event listeners for polygon and rectangle complete
      if (window.google && window.google.maps && manager) {
        google.maps.event.addListener(manager, 'polygoncomplete', handlePolygonComplete);
        google.maps.event.addListener(manager, 'rectanglecomplete', handleRectangleComplete);
        console.log("Drawing event listeners registered");
      }
    }, 500);
    
    return googleMap;
  }, [handlePolygonComplete, handleRectangleComplete, polygonDrawOptions]);

  // Start drawing mode with the drawing manager
  const startDrawingPolygon = useCallback(() => {
    if (!drawingManagerRef.current || !window.google || !window.google.maps) {
      console.error("Drawing manager not initialized");
      toast.error("Drawing tool not ready. Please try again.");
      return;
    }
    
    console.log("Starting polygon drawing mode");
    drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    toast.info("Click on the map to start drawing a polygon");
  }, []);
  
  // Start drawing rectangle with the drawing manager
  const startDrawingRectangle = useCallback(() => {
    if (!drawingManagerRef.current || !window.google || !window.google.maps) {
      console.error("Drawing manager not initialized");
      toast.error("Drawing tool not ready. Please try again.");
      return;
    }
    
    console.log("Starting rectangle drawing mode");
    drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
    toast.info("Click and drag on the map to draw a rectangle");
  }, []);

  return {
    map,
    drawingManagerRef,
    initializeDrawingManager: initializeDrawingManagerWrapper,
    startDrawingPolygon,
    startDrawingRectangle
  };
};
