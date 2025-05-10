
import { useRef, useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { PolygonInfo } from '../types';

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
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const drawListenersRef = useRef<google.maps.MapsEventListener[]>([]);
  const initAttemptCounterRef = useRef(0);
  const mapInitializedRef = useRef(false);

  // Helper to calculate area of polygon
  const calculatePolygonArea = useCallback((polygon: google.maps.Polygon): number => {
    try {
      const path = polygon.getPath();
      if (window.google && window.google.maps.geometry && window.google.maps.geometry.spherical) {
        return window.google.maps.geometry.spherical.computeArea(path);
      }
      return 0;
    } catch (error) {
      console.error("Error calculating area:", error);
      return 0;
    }
  }, []);

  // Add event listeners to a polygon
  const setupPolygonListeners = useCallback((polygon: google.maps.Polygon, index: number) => {
    try {
      polygon.setOptions(polygonDrawOptions);
      const path = polygon.getPath();
      
      const updatePolygon = () => {
        const updatedArea = calculatePolygonArea(polygon);
        polygon.setOptions(polygonDrawOptions);
        
        setPolygons(prevPolygons => 
          prevPolygons.map(poly => 
            poly.polygon === polygon ? { ...poly, area: updatedArea } : poly
          )
        );
        
        // Trigger module calculation with a slight delay
        setTimeout(() => {
          triggerModuleCalculation();
        }, 100);
      };
      
      // Add click handler to select this polygon
      google.maps.event.addListener(polygon, 'click', () => {
        console.log(`Polygon ${index} selected`);
        setSelectedPolygonIndex(index);
        
        // Update styling of polygons to highlight the selected one
        polygons.forEach((poly, idx) => {
          const options = {...polygonDrawOptions};
          if (idx === index) {
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
    } catch (error) {
      console.error("Error setting up polygon listeners:", error);
    }
  }, [calculatePolygonArea, polygonDrawOptions, polygons, setPolygons, setSelectedPolygonIndex, triggerModuleCalculation]);
  
  // Initialize drawing manager
  const initializeDrawingManager = useCallback((map: google.maps.Map) => {
    if (!map || mapInitializedRef.current) {
      return;
    }
    
    // Limit initialization attempts
    initAttemptCounterRef.current += 1;
    if (initAttemptCounterRef.current > 3) {
      console.warn("Too many initialization attempts, skipping");
      return;
    }
    
    console.log("Initializing drawing manager");
    mapRef.current = map;
    mapInitializedRef.current = true;
    
    try {
      // Cleanup any existing drawing manager
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setMap(null);
        drawingManagerRef.current = null;
      }
      
      // Create new drawing manager
      const drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: null, // Start with no active drawing mode
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [
            google.maps.drawing.OverlayType.POLYGON,
            google.maps.drawing.OverlayType.RECTANGLE
          ]
        },
        polygonOptions: polygonDrawOptions,
        rectangleOptions: { ...polygonDrawOptions }
      });
      
      drawingManagerRef.current = drawingManager;
      drawingManager.setMap(map);
      
      // Clean up old listeners
      if (drawListenersRef.current.length > 0) {
        drawListenersRef.current.forEach(listener => {
          google.maps.event.removeListener(listener);
        });
        drawListenersRef.current = [];
      }
      
      // Setup event listeners for drawing completion
      const polygonCompleteListener = google.maps.event.addListener(
        drawingManager, 
        'polygoncomplete', 
        (polygon: google.maps.Polygon) => {
          setIsDrawing(false);
          console.log("Polygon complete!");
          
          try {
            const area = calculatePolygonArea(polygon);
            if (area < 1) {
              // Too small, probably a misclick
              polygon.setMap(null);
              toast.error("Drawn area too small, please try again");
              return;
            }
            
            const newIndex = polygons.length;
            setupPolygonListeners(polygon, newIndex);
            
            setTimeout(() => {
              setPolygons(prev => [...prev, { polygon, area, azimuth: 180 }]);
              setSelectedPolygonIndex(newIndex);
              toast.success(`Polygon area drawn: ${area.toFixed(0)} m²`);
              
              // Reset drawing mode to null after completion
              if (drawingManagerRef.current) {
                drawingManagerRef.current.setDrawingMode(null);
              }
              
              // Trigger module calculation
              triggerModuleCalculation();
            }, 100);
          } catch (error) {
            console.error("Error processing completed polygon:", error);
            toast.error("Error creating polygon");
          }
        }
      );
      
      const rectangleCompleteListener = google.maps.event.addListener(
        drawingManager, 
        'rectanglecomplete', 
        (rectangle: google.maps.Rectangle) => {
          setIsDrawing(false);
          console.log("Rectangle complete!");
          
          try {
            const bounds = rectangle.getBounds();
            if (!bounds) {
              console.error("Rectangle bounds are undefined");
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
            const polygon = new google.maps.Polygon({
              paths: path,
              ...polygonDrawOptions
            });
            
            // Remove the original rectangle from the map
            rectangle.setMap(null);
            
            // Add the polygon to the map
            polygon.setMap(mapRef.current);
            
            // Calculate area and set up the polygon
            const area = calculatePolygonArea(polygon);
            if (area < 1) {
              // Too small, probably a misclick
              polygon.setMap(null);
              toast.error("Drawn area too small, please try again");
              return;
            }
            
            const newIndex = polygons.length;
            setupPolygonListeners(polygon, newIndex);
            
            setTimeout(() => {
              setPolygons(prev => [...prev, { polygon, area, azimuth: 180 }]);
              setSelectedPolygonIndex(newIndex);
              toast.success(`Rectangle area drawn: ${area.toFixed(0)} m²`);
              
              // Reset drawing mode to null after completion
              if (drawingManagerRef.current) {
                drawingManagerRef.current.setDrawingMode(null);
              }
              
              // Trigger module calculation
              triggerModuleCalculation();
            }, 100);
          } catch (error) {
            console.error("Error processing completed rectangle:", error);
            toast.error("Error creating rectangle");
          }
        }
      );
      
      // Store listeners for cleanup
      drawListenersRef.current = [polygonCompleteListener, rectangleCompleteListener];
      
    } catch (error) {
      console.error("Failed to initialize drawing manager:", error);
      toast.error("Failed to initialize drawing tools");
      mapInitializedRef.current = false;
    }
  }, [polygonDrawOptions, polygons, setPolygons, setSelectedPolygonIndex, calculatePolygonArea, setupPolygonListeners, triggerModuleCalculation]);

  // Reset initialization state when map ref changes
  useEffect(() => {
    return () => {
      mapInitializedRef.current = false;
      initAttemptCounterRef.current = 0;
    };
  }, []);

  // Start drawing polygon
  const startDrawingPolygon = useCallback(() => {
    if (drawingManagerRef.current && mapRef.current) {
      try {
        drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
        setIsDrawing(true);
        toast.info("Now drawing: Polygon. Click on the map to place points.");
      } catch (error) {
        console.error("Error starting polygon drawing:", error);
        toast.error("Failed to start drawing");
      }
    } else {
      toast.error("Drawing tools not initialized");
    }
  }, []);

  // Start drawing rectangle
  const startDrawingRectangle = useCallback(() => {
    if (drawingManagerRef.current && mapRef.current) {
      try {
        drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
        setIsDrawing(true);
        toast.info("Now drawing: Rectangle. Click and drag on the map.");
      } catch (error) {
        console.error("Error starting rectangle drawing:", error);
        toast.error("Failed to start drawing");
      }
    } else {
      toast.error("Drawing tools not initialized");
    }
  }, []);

  return {
    drawingManagerRef,
    initializeDrawingManager,
    startDrawingPolygon,
    startDrawingRectangle,
    isDrawing
  };
};
