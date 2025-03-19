
import React, { useRef, useEffect } from "react";
import { fabric } from "fabric";
import { calculatePanelArea, estimateKwCapacity, createDrawingHandlers } from "./CanvasDrawingHandlers";

interface CanvasOverlayProps {
  mapRef: React.RefObject<HTMLDivElement>;
  mapLoaded: boolean;
  activeTool: "select" | "building" | "panel" | "delete";
  onStatsUpdate?: (stats: {
    totalPanelArea: number;
    estimatedCapacity: number;
    buildingCount: number;
    panelCount: number;
  }) => void;
}

export const CanvasOverlay: React.FC<CanvasOverlayProps> = ({
  mapRef,
  mapLoaded,
  activeTool,
  onStatsUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const tempRectRef = useRef<fabric.Rect | null>(null);

  // Initialize canvas after map is loaded
  useEffect(() => {
    if (!mapLoaded || !canvasRef.current || !mapRef.current) return;
    
    console.log("Initializing canvas overlay");
    
    // Make sure the canvas is properly sized and positioned
    const width = mapRef.current.clientWidth;
    const height = mapRef.current.clientHeight;
    
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    
    console.log(`Setting canvas size to: ${width}x${height}`);
    
    const canvasInstance = new fabric.Canvas(canvasRef.current, {
      width: width,
      height: height,
      backgroundColor: 'rgba(0,0,0,0)',
      selection: true,
      fireRightClick: true,
      renderOnAddRemove: true,
      stopContextMenu: true // Prevent context menu from opening
    });
    
    // Make canvas accessible globally for map interaction
    window.designCanvas = canvasInstance;
    fabricCanvasRef.current = canvasInstance;
    
    // Ensure canvas matches map dimensions
    const resizeCanvas = () => {
      if (!canvasInstance || !mapRef.current) return;
      
      const width = mapRef.current.clientWidth;
      const height = mapRef.current.clientHeight;
      
      canvasInstance.setWidth(width);
      canvasInstance.setHeight(height);
      canvasInstance.renderAll();
      
      console.log(`Canvas resized to: ${width}x${height}`);
    };
    
    // Set initial size and add resize listener
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    console.log("Canvas created successfully", canvasInstance);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvasInstance.dispose();
      fabricCanvasRef.current = null;
      window.designCanvas = null;
    };
  }, [mapLoaded, mapRef]);
  
  // Handle tool changes and set up drawing events
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    console.log("Tool changed to:", activeTool);
    
    // Clear any ongoing operations
    isDrawingRef.current = false;
    startPointRef.current = null;
    
    // Global flag for map interaction
    window.isDrawingMode = activeTool === 'building' || activeTool === 'panel';
    
    // Remove existing event listeners to avoid duplicates
    canvas.off("mouse:down");
    canvas.off("mouse:move");
    canvas.off("mouse:up");
    
    // Set selection mode based on active tool
    canvas.selection = activeTool === "select";
    
    // Set object selection mode
    canvas.getObjects().forEach(obj => {
      obj.selectable = activeTool === "select" || activeTool === "delete";
      obj.evented = activeTool === "select" || activeTool === "delete";
    });
    
    // Update cursor based on tool
    const cursorMap = {
      select: "default",
      building: "crosshair",
      panel: "cell",
      delete: "not-allowed"
    };
    canvas.defaultCursor = cursorMap[activeTool];
    canvas.hoverCursor = activeTool === "select" ? "move" : cursorMap[activeTool];
    
    // Create handlers
    const { startDrawing, drawObject, finishDrawing, deleteObject } = createDrawingHandlers(
      canvas, 
      activeTool, 
      isDrawingRef, 
      startPointRef, 
      tempRectRef
    );
    
    // Set up delete tool
    if (activeTool === "delete") {
      canvas.on("mouse:down", deleteObject);
    }
    
    // Set up drawing tools
    if (activeTool === "building" || activeTool === "panel") {
      // Disable Google Maps dragging when in drawing mode
      if (window.solarDesignerMap) {
        window.solarDesignerMap.setOptions({ draggable: false });
        console.log("Map dragging disabled for drawing mode");
      }
      
      canvas.on("mouse:down", startDrawing);
      canvas.on("mouse:move", drawObject);
      canvas.on("mouse:up", finishDrawing);
      
      console.log("Drawing event listeners added for", activeTool);
    } else {
      // Re-enable Google Maps dragging when not in drawing mode
      if (window.solarDesignerMap) {
        window.solarDesignerMap.setOptions({ draggable: true });
        console.log("Map dragging re-enabled");
      }
    }
    
    canvas.renderAll();
    
    return () => {
      if (canvas) {
        canvas.off("mouse:down");
        canvas.off("mouse:move");
        canvas.off("mouse:up");
      }
    };
  }, [activeTool]);
  
  // Update stats when objects change
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !onStatsUpdate) return;
    
    const updateStats = () => {
      const objects = canvas.getObjects();
      
      // Count buildings and panels
      let buildingCount = 0;
      let panelCount = 0;
      let totalPanelArea = 0;
      
      objects.forEach(obj => {
        // Skip text objects
        if (obj instanceof fabric.Text) return;
        
        const objectType = obj.get('objectType');
        if (objectType === 'building') {
          buildingCount++;
        } else if (objectType === 'panel') {
          panelCount++;
          
          // Calculate panel area if it has width and height
          if (obj.width && obj.height) {
            const area = calculatePanelArea(obj.width, obj.height);
            totalPanelArea += area;
          }
        }
      });
      
      // Calculate estimated capacity
      const estimatedCapacity = estimateKwCapacity(totalPanelArea);
      
      onStatsUpdate({
        totalPanelArea,
        estimatedCapacity,
        buildingCount,
        panelCount
      });
    };
    
    // Add event listeners for object modifications
    canvas.on('object:added', updateStats);
    canvas.on('object:removed', updateStats);
    canvas.on('object:modified', updateStats);
    
    // Initial update
    updateStats();
    
    return () => {
      canvas.off('object:added', updateStats);
      canvas.off('object:removed', updateStats);
      canvas.off('object:modified', updateStats);
    };
  }, [onStatsUpdate]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full pointer-events-auto z-10"
    />
  );
};
