import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { PolygonInfo } from '../types';

interface UseMapDrawingProps {
  polygonDrawOptions: google.maps.PolygonOptions;
  polygons: PolygonInfo[];
  setPolygons: React.Dispatch<React.SetStateAction<PolygonInfo[]>>;
  setSelectedPolygonIndex: React.Dispatch<React.SetStateAction<number | null>>;
  triggerModuleCalculation: () => void;
}

/**
 * Hook to manage map drawing functionality
 */
export const useMapDrawing = ({
  polygonDrawOptions,
  polygons,
  setPolygons,
  setSelectedPolygonIndex,
  triggerModuleCalculation
}: UseMapDrawingProps) => {
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const polygonCompleteHandlerRef = useRef<google.maps.MapsEventListener | null>(null);
  const rectangleCompleteHandlerRef = useRef<google.maps.MapsEventListener | null>(null);
  const overlayCompleteHandlerRef = useRef<google.maps.MapsEventListener | null>(null);

  // Calculate polygon area
  const calculatePolygonArea = useCallback((polygon: google.maps.Polygon): number => {
    try {
      const path = polygon.getPath();
      // Ensure geometry library is loaded
      if (window.google && window.google.maps.geometry && window.google.maps.geometry.spherical) {
        return window.google.maps.geometry.spherical.computeArea(path);
      }
      console.warn("Google Maps geometry library not available for area calculation");
      return 0;
    } catch (error) {
      console.error("Error calculating area:", error);
      return 0;
    }
  }, []);

  // Setup polygon listeners
  const setupPolygonListeners = useCallback((polygon: google.maps.Polygon, index: number) => {
    try {
      polygon.setOptions(polygonDrawOptions);
      const path = polygon.getPath();
      
      const updatePolygon = () => {
        try {
          const updatedArea = calculatePolygonArea(polygon);
          polygon.setOptions(polygonDrawOptions);
          
          // Use a function update to properly set new state based on previous state
          setPolygons(prevPolygons => 
            prevPolygons.map(poly => 
              poly.polygon === polygon ? { ...poly, area: updatedArea } : poly
            )
          );
          
          // Trigger calculation after a significant delay to avoid rapid consecutive calls
          setTimeout(() => {
            triggerModuleCalculation();
          }, 500);
        } catch (err) {
          console.error("Error in updatePolygon:", err);
        }
      };
      
      // Add click handler to select this polygon
      google.maps.event.addListener(polygon, 'click', () => {
        try {
          console.log(`Polygon ${index} selected`);
          setSelectedPolygonIndex(index);
          
          // Update styling of polygons to highlight the selected one
          polygons.forEach((poly, idx) => {
            try {
              const options = {...polygonDrawOptions};
              if (idx === index) {
                options.fillColor = "#FF6600";
                options.strokeColor = "#FF6600";
                options.strokeWeight = 2;
              }
              poly.polygon.setOptions(options);
            } catch (err) {
              console.error(`Error updating polygon ${idx} style:`, err);
            }
          });
        } catch (err) {
          console.error("Error in polygon click handler:", err);
        }
      });
      
      // Use a small number of critical event listeners
      google.maps.event.addListener(polygon, 'mouseup', updatePolygon);
      google.maps.event.addListener(polygon, 'dragend', updatePolygon);
      google.maps.event.addListener(path, 'set_at', updatePolygon);
      google.maps.event.addListener(path, 'insert_at', updatePolygon);
      google.maps.event.addListener(path, 'remove_at', updatePolygon);
    } catch (error) {
      console.error("Error setting up polygon listeners:", error);
    }
  }, [calculatePolygonArea, polygonDrawOptions, polygons, setPolygons, setSelectedPolygonIndex, triggerModuleCalculation]);

  // Clean up event listeners
  const cleanupEventListeners = useCallback(() => {
    if (polygonCompleteHandlerRef.current) {
      google.maps.event.removeListener(polygonCompleteHandlerRef.current);
      polygonCompleteHandlerRef.current = null;
    }
    
    if (rectangleCompleteHandlerRef.current) {
      google.maps.event.removeListener(rectangleCompleteHandlerRef.current);
      rectangleCompleteHandlerRef.current = null;
    }
    
    if (overlayCompleteHandlerRef.current) {
      google.maps.event.removeListener(overlayCompleteHandlerRef.current);
      overlayCompleteHandlerRef.current = null;
    }
  }, []);

  // Initialize drawing manager
  const initializeDrawingManager = useCallback((map: google.maps.Map) => {
    if (!map || !window.google) {
      console.error("Google Maps not loaded yet");
      return;
    }
    
    try {
      // Clean up any existing drawing manager and event listeners
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setMap(null);
        cleanupEventListeners();
        drawingManagerRef.current = null;
      }
      
      // Create new drawing manager
      const drawingManager = new window.google.maps.drawing.DrawingManager({
        drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {
          position: window.google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [
            window.google.maps.drawing.OverlayType.POLYGON,
            window.google.maps.drawing.OverlayType.RECTANGLE
          ],
        },
        polygonOptions: polygonDrawOptions,
        rectangleOptions: {...polygonDrawOptions}
      });
      
      drawingManager.setMap(map);
      drawingManagerRef.current = drawingManager;
      
      // Add rectangle handler
      rectangleCompleteHandlerRef.current = google.maps.event.addListener(
        drawingManager, 
        'rectanglecomplete', 
        (rectangle: google.maps.Rectangle) => {
          try {
            console.log("Rectangle drawing completed!");
            const bounds = rectangle.getBounds();
            if (!bounds) {
              console.error("Rectangle bounds are undefined");
              rectangle.setMap(null);
              return;
            }
            
            // Create a polygon from the rectangle bounds
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            const nw = new google.maps.LatLng(ne.lat(), sw.lng());
            const se = new google.maps.LatLng(sw.lat(), ne.lng());
            
            // Create polygon path in clockwise order
            const path = [ne, se, sw, nw];
            
            // Create a polygon instead of using the rectangle directly
            const polygon = new window.google.maps.Polygon({
              paths: path,
              ...polygonDrawOptions
            });
            
            // Remove the original rectangle from the map
            rectangle.setMap(null);
            
            // Add the polygon to the map
            polygon.setMap(map);
            
            // Calculate area and set up the polygon
            const area = calculatePolygonArea(polygon);
            const newIndex = polygons.length;
            setupPolygonListeners(polygon, newIndex);
            
            // Batch updates using requestAnimationFrame for smoother performance
            requestAnimationFrame(() => {
              // Add the new polygon to state with a default azimuth of 180°
              setPolygons(prevPolygons => [...prevPolygons, { polygon, area, azimuth: 180 }]);
              setSelectedPolygonIndex(newIndex);
              
              // Trigger module calculation after a short delay
              setTimeout(() => {
                triggerModuleCalculation();
              }, 300);
            });
            
            toast.success(`Rectangle area added (${area.toFixed(1)} m²)`);
          } catch (error) {
            console.error("Error creating polygon from rectangle:", error);
            toast.error("Failed to create area from rectangle");
          }
        }
      );
      
      // Add polygon handler
      polygonCompleteHandlerRef.current = google.maps.event.addListener(
        drawingManager, 
        'polygoncomplete', 
        (polygon: google.maps.Polygon) => {
          try {
            console.log("Polygon completed!");
            const area = calculatePolygonArea(polygon);
            
            // Use batch updates to avoid multiple renders
            const newIndex = polygons.length;
            setupPolygonListeners(polygon, newIndex);
            
            // Use requestAnimationFrame for smoother state updates
            requestAnimationFrame(() => {
              // Add the new polygon to state
              setPolygons(prevPolygons => [...prevPolygons, { polygon, area, azimuth: 180 }]);
              setSelectedPolygonIndex(newIndex);
              
              // Trigger module calculation after a short delay
              setTimeout(() => {
                triggerModuleCalculation();
              }, 300);
            });
            
            toast.success(`Polygon area added (${area.toFixed(1)} m²)`);
          } catch (error) {
            console.error("Error handling polygon completion:", error);
            toast.error("Failed to create polygon area");
          }
        }
      );
      
      // Keep drawing mode enabled after completing a shape
      overlayCompleteHandlerRef.current = google.maps.event.addListener(
        drawingManager, 
        'overlaycomplete', 
        () => {
          // Keep the current drawing mode
          drawingManager.setDrawingMode(drawingManager.getDrawingMode());
        }
      );
      
      console.log("Drawing manager initialized successfully");
    } catch (error) {
      console.error("Error initializing drawing manager:", error);
      toast.error("Failed to initialize drawing tools");
    }
  }, [calculatePolygonArea, cleanupEventListeners, polygonDrawOptions, polygons, setPolygons, setSelectedPolygonIndex, setupPolygonListeners, triggerModuleCalculation]);
  
  // Function to start drawing a polygon
  const startDrawingPolygon = useCallback(() => {
    if (drawingManagerRef.current && window.google) {
      try {
        drawingManagerRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
        toast.info("Drawing polygon mode activated");
      } catch (error) {
        console.error("Error setting drawing mode:", error);
        toast.error("Failed to activate polygon drawing mode");
      }
    } else {
      console.warn("Drawing manager not initialized");
      toast.error("Drawing tools not ready yet");
    }
  }, []);
  
  // Function to start drawing a rectangle
  const startDrawingRectangle = useCallback(() => {
    if (drawingManagerRef.current && window.google) {
      try {
        drawingManagerRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.RECTANGLE);
        toast.info("Drawing rectangle mode activated");
      } catch (error) {
        console.error("Error setting drawing mode:", error);
        toast.error("Failed to activate rectangle drawing mode");
      }
    } else {
      console.warn("Drawing manager not initialized");
      toast.error("Drawing tools not ready yet");
    }
  }, []);

  return {
    drawingManagerRef,
    initializeDrawingManager,
    startDrawingPolygon,
    startDrawingRectangle
  };
};
