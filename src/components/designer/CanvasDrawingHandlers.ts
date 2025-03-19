
import { fabric } from "fabric";
import { toast } from "sonner";

// Helper function to calculate solar panel area (approximate)
export const calculatePanelArea = (widthPixels: number, heightPixels: number): number => {
  // Assuming 1 pixel = 0.05 meters at zoom level 20 (approximate)
  const scaleFactor = 0.05;
  return widthPixels * heightPixels * scaleFactor * scaleFactor;
};

// Estimate kW capacity based on area
export const estimateKwCapacity = (areaInSquareMeters: number): number => {
  // Rough estimate: 1 kW requires about 7 m² of space
  return areaInSquareMeters / 7;
};

// Snap point to grid
export const snapToGrid = (point: { x: number; y: number }, gridSize = 20) => {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  };
};

// Create drawing handlers
export const createDrawingHandlers = (
  canvas: fabric.Canvas,
  activeTool: "select" | "building" | "panel" | "delete",
  isDrawingRef: React.MutableRefObject<boolean>,
  startPointRef: React.MutableRefObject<{ x: number; y: number } | null>,
  tempRectRef: React.MutableRefObject<fabric.Rect | null>
) => {
  const startDrawing = (options: fabric.IEvent<MouseEvent>) => {
    if (!canvas || !options.pointer) {
      console.error("Cannot start drawing: Canvas or pointer is null");
      return;
    }
    
    // Only start drawing if we're in building or panel mode
    if (activeTool !== "building" && activeTool !== "panel") {
      return;
    }
    
    console.log("Starting to draw", activeTool, options.pointer);
    
    // Prevent event propagation to Google Maps
    if (options.e) {
      options.e.preventDefault();
      options.e.stopPropagation();
    }
    
    const pointer = options.pointer;
    const snappedPoint = snapToGrid(pointer);
    
    isDrawingRef.current = true;
    startPointRef.current = snappedPoint;
    
    if (tempRectRef.current) {
      canvas.remove(tempRectRef.current);
    }
    
    // Use more visible colors for buildings and panels
    const fillColor = activeTool === "building" ? 'rgba(149, 165, 166, 0.7)' : 'rgba(52, 152, 219, 0.7)';
    const strokeColor = activeTool === "building" ? '#7f8c8d' : '#2980b9';
    
    const rectOptions = {
      left: snappedPoint.x,
      top: snappedPoint.y,
      width: 0,
      height: 0,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: 2,
      selectable: false,
      evented: false,
    };
    
    tempRectRef.current = new fabric.Rect(rectOptions);
    canvas.add(tempRectRef.current);
    canvas.renderAll();
    
    // Show toast to provide feedback on what tool is being used
    toast.info(`Drawing ${activeTool === "building" ? "building" : "solar panel"}...`);
  };

  const drawObject = (options: fabric.IEvent<MouseEvent>) => {
    if (!canvas || !isDrawingRef.current || !startPointRef.current || !tempRectRef.current || !options.pointer) {
      return;
    }
    
    // Prevent event propagation to Google Maps
    if (options.e) {
      options.e.preventDefault();
      options.e.stopPropagation();
    }
    
    console.log("Drawing in progress", options.pointer);
    
    const pointer = options.pointer;
    const snappedPoint = snapToGrid(pointer);
    
    const width = Math.abs(snappedPoint.x - startPointRef.current.x);
    const height = Math.abs(snappedPoint.y - startPointRef.current.y);
    
    // Update rectangle size, keeping the starting corner fixed
    tempRectRef.current.set({
      width: width,
      height: height,
      left: Math.min(startPointRef.current.x, snappedPoint.x),
      top: Math.min(startPointRef.current.y, snappedPoint.y),
    });
    
    canvas.renderAll();
  };

  const finishDrawing = (options: fabric.IEvent<MouseEvent>) => {
    if (!canvas || !isDrawingRef.current || !tempRectRef.current) {
      console.error("Cannot finish drawing: Missing canvas, drawing state, or temp rectangle");
      return;
    }
    
    // Prevent event propagation to Google Maps
    if (options.e) {
      options.e.preventDefault();
      options.e.stopPropagation();
    }
    
    console.log("Finishing drawing", tempRectRef.current);
    
    if (tempRectRef.current.width && tempRectRef.current.height && 
        tempRectRef.current.width > 10 && tempRectRef.current.height > 10) {
      // Use more visible colors for buildings and panels
      const fillColor = activeTool === "building" ? 'rgba(149, 165, 166, 0.7)' : 'rgba(52, 152, 219, 0.7)';
      const strokeColor = activeTool === "building" ? '#7f8c8d' : '#2980b9';
      
      // Create the actual object
      const objectOptions = {
        left: tempRectRef.current.left,
        top: tempRectRef.current.top,
        width: tempRectRef.current.width,
        height: tempRectRef.current.height,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: 2,
        selectable: activeTool === "select",
        objectType: activeTool === "building" ? "building" : "panel"
      };
      
      const finalRect = new fabric.Rect(objectOptions);
      canvas.add(finalRect);
      
      // Add a label to identify the object type
      const label = new fabric.Text(activeTool === "building" ? "Building" : "Solar Panel", {
        left: tempRectRef.current.left + 5,
        top: tempRectRef.current.top + 5,
        fontSize: 12,
        fill: activeTool === "building" ? '#333333' : '#ffffff',
        selectable: false,
        evented: false,
      });
      canvas.add(label);
      
      // Calculate area if it's a solar panel
      if (activeTool === "panel") {
        const areaInSquareMeters = calculatePanelArea(finalRect.width || 0, finalRect.height || 0);
        toast.success(`Solar panel placed: ${areaInSquareMeters.toFixed(1)} m² (${estimateKwCapacity(areaInSquareMeters).toFixed(2)} kW)`);
      } else {
        toast.success("Building created");
      }
    } else {
      toast.error("Drawing too small. Please create a larger shape.");
    }
    
    // Clean up temporary rectangle
    if (tempRectRef.current) {
      canvas.remove(tempRectRef.current);
      tempRectRef.current = null;
    }
    
    isDrawingRef.current = false;
    startPointRef.current = null;
    
    canvas.renderAll();
  };

  const deleteObject = (options: fabric.IEvent<MouseEvent>) => {
    if (!canvas || activeTool !== "delete") return;
    
    const target = options.target;
    if (target) {
      const objectType = target.get('objectType') || "Object";
      canvas.remove(target);
      toast.success(`${objectType} deleted`);
      canvas.renderAll();
    }
  };

  return { startDrawing, drawObject, finishDrawing, deleteObject };
};
