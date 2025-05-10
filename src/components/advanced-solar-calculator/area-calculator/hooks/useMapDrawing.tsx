
import { useRef, useCallback, useState } from 'react';
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
      () => polygons.length, 
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
  }, [polygons, polygonDrawOptions, setPolygons, setSelectedPolygonIndex, triggerModuleCalculation]);
  
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
      triggerModuleCalculation
    );
    
    // Switch drawing manager back to non-drawing mode
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
  }, [map, polygons, polygonDrawOptions, setPolygons, setSelectedPolygonIndex, triggerModuleCalculation]);

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
    
    return googleMap;
  }, [handlePolygonComplete, handleRectangleComplete, polygonDrawOptions]);

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

  return {
    map,
    drawingManagerRef,
    initializeDrawingManager: initializeDrawingManagerWrapper,
    startDrawingPolygon,
    startDrawingRectangle
  };
};
