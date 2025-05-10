import { useCallback, useRef } from 'react';
import { PolygonInfo } from '../types';
import { toast } from 'sonner';

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
  
  // Calculate polygon area safely
  const calculatePolygonArea = useCallback((polygon: google.maps.Polygon): number => {
    try {
      const path = polygon.getPath();
      // Ensure geometry library is loaded
      if (window.google && window.google.maps.geometry && window.google.maps.geometry.spherical) {
        return window.google.maps.geometry.spherical.computeArea(path);
      }
      console.warn("Google Maps geometry library not loaded for area calculation");
      return 0;
    } catch (error) {
      console.error("Error calculating area:", error);
      return 0;
    }
  }, []);

  const setupPolygonListeners = useCallback((polygon: google.maps.Polygon, index: number) => {
    try {
      polygon.setOptions(polygonDrawOptions);
      const path = polygon.getPath();
      
      const updatePolygon = () => {
        const updatedArea = calculatePolygonArea(polygon);
        polygon.setOptions(polygonDrawOptions);
        
        // Update the specific polygon's area and trigger re-render
        setPolygons(prevPolygons => 
          prevPolygons.map(poly => 
            poly.polygon === polygon ? { ...poly, area: updatedArea } : poly
          )
        );
        
        // Trigger module calculation after polygon update
        setTimeout(triggerModuleCalculation, 100);
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

  // Initialize drawing manager with the loaded map
  const initializeDrawingManager = useCallback((map: google.maps.Map) => {
    if (!map || !window.google) {
      console.warn("Map or Google Maps API not available for drawing manager initialization");
      return;
    }
    
    try {
      console.log("Initializing drawing manager");
      
      // Clean up existing drawing manager if it exists
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setMap(null);
        drawingManagerRef.current = null;
      }
      
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
        rectangleOptions: { ...polygonDrawOptions }
      });
      
      drawingManager.setMap(map);
      drawingManagerRef.current = drawingManager;
      
      // Handle rectangle drawing completion
      window.google.maps.event.addListener(drawingManager, 'rectanglecomplete', (rectangle: google.maps.Rectangle) => {
        console.log("Rectangle drawing completed!");
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
          
          // Create a polygon instead of using the rectangle
          const polygon = new window.google.maps.Polygon({
            paths: path,
            ...polygonDrawOptions
          });
          
          // Remove original rectangle
          rectangle.setMap(null);
          
          // Add the polygon to the map
          polygon.setMap(map);
          
          // Calculate area and set up the polygon
          const area = calculatePolygonArea(polygon);
          const newIndex = polygons.length;
          
          // Setup listeners before updating state
          setupPolygonListeners(polygon, newIndex);
          
          // Add the polygon to state
          setPolygons(prevPolygons => [...prevPolygons, { polygon, area, azimuth: 180 }]);
          setSelectedPolygonIndex(newIndex);
          
          toast.success(`Rectangle area drawn: ${area.toFixed(1)} m²`);
          
          // Trigger module calculation after polygon creation
          setTimeout(triggerModuleCalculation, 100);
          
        } catch (error) {
          console.error("Error processing rectangle completion:", error);
          toast.error("Error creating rectangle area");
        }
      });
      
      // Handle polygon drawing completion
      window.google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
        console.log("Polygon completed!");
        try {
          const area = calculatePolygonArea(polygon);
          const newIndex = polygons.length;
          
          // Setup listeners before updating state
          setupPolygonListeners(polygon, newIndex);
          
          // Add the polygon to state
          setPolygons(prevPolygons => [...prevPolygons, { polygon, area, azimuth: 180 }]);
          setSelectedPolygonIndex(newIndex);
          
          toast.success(`Polygon area drawn: ${area.toFixed(1)} m²`);
          
          // Trigger module calculation after polygon creation
          setTimeout(triggerModuleCalculation, 100);
          
        } catch (error) {
          console.error("Error processing polygon completion:", error);
          toast.error("Error creating polygon area");
        }
      });
      
      // Keep drawing mode enabled after completing a shape
      google.maps.event.addListener(drawingManager, 'overlaycomplete', () => {
        // Keep the current drawing mode after shape completion
        drawingManager.setDrawingMode(drawingManager.getDrawingMode());
      });
      
    } catch (error) {
      console.error("Error initializing drawing manager:", error);
      toast.error("Error initializing drawing tools");
    }
  }, [calculatePolygonArea, polygonDrawOptions, polygons.length, setPolygons, setSelectedPolygonIndex, setupPolygonListeners, triggerModuleCalculation]);

  // Function to start drawing a polygon
  const startDrawingPolygon = useCallback(() => {
    if (drawingManagerRef.current && window.google) {
      drawingManagerRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
      toast.info("Polygon drawing mode activated");
    }
  }, []);

  // Function to start drawing a rectangle
  const startDrawingRectangle = useCallback(() => {
    if (drawingManagerRef.current && window.google) {
      drawingManagerRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.RECTANGLE);
      toast.info("Rectangle drawing mode activated");
    }
  }, []);

  return {
    drawingManagerRef,
    initializeDrawingManager,
    startDrawingPolygon,
    startDrawingRectangle
  };
};
