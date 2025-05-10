import { toast } from 'sonner';
import { PolygonInfo } from '../types';

/**
 * Utility functions for handling drawing operations on Google Maps
 */

/**
 * Calculate the area of a polygon using Google Maps geometry library
 */
export const calculatePolygonArea = (polygon: google.maps.Polygon): number => {
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
};

/**
 * Initialize Google Maps DrawingManager
 */
export const initializeDrawingManager = (
  map: google.maps.Map,
  polygonDrawOptions: google.maps.PolygonOptions,
  onPolygonComplete: (polygon: google.maps.Polygon) => void,
  onRectangleComplete: (rectangle: google.maps.Rectangle) => void
): google.maps.drawing.DrawingManager | null => {
  console.log("Initializing drawing manager");
  
  if (!window.google || !window.google.maps || !window.google.maps.drawing) {
    toast.error("Failed to initialize drawing tools. Google Maps API not loaded.");
    return null;
  }
  
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
    
    drawingManager.setMap(map);
    
    // Add polygon complete listener
    window.google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
      console.log("Polygon completed");
      onPolygonComplete(polygon);
    });
    
    // Add rectangle complete listener
    window.google.maps.event.addListener(drawingManager, 'rectanglecomplete', (rectangle: google.maps.Rectangle) => {
      console.log("Rectangle completed");
      onRectangleComplete(rectangle);
    });

    // Keep drawing mode enabled after completing a shape
    google.maps.event.addListener(drawingManager, 'overlaycomplete', () => {
      drawingManager.setDrawingMode(null);
    });
    
    return drawingManager;
  } catch (error) {
    console.error("Error initializing drawing manager:", error);
    toast.error("Failed to initialize drawing tools. Please refresh the page.");
    return null;
  }
};

/**
 * Convert rectangle to polygon
 */
export const convertRectangleToPolygon = (
  rectangle: google.maps.Rectangle, 
  map: google.maps.Map | null,
  polygonDrawOptions: google.maps.PolygonOptions
): google.maps.Polygon | null => {
  const bounds = rectangle.getBounds();
  if (!bounds || !map) {
    console.error("Rectangle bounds are undefined or map is null");
    return null;
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
    
    return polygon;
  } catch (error) {
    console.error("Error converting rectangle to polygon:", error);
    return null;
  }
};

/**
 * Setup polygon event listeners
 */
export const setupPolygonListeners = (
  polygon: google.maps.Polygon, 
  index: number | ((prev: number) => number),
  calculatePolygonArea: (polygon: google.maps.Polygon) => number,
  polygonDrawOptions: google.maps.PolygonOptions,
  polygons: PolygonInfo[],
  setPolygons: React.Dispatch<React.SetStateAction<PolygonInfo[]>>,
  setSelectedPolygonIndex: React.Dispatch<React.SetStateAction<number | null>>,
  triggerModuleCalculation: () => void
): void => {
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
      triggerModuleCalculation();
      
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
};
