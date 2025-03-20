
import React, { useRef, useEffect, useState, useCallback } from "react";
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
  const [statsInitialized, setStatsInitialized] = useState(false);
  const canvasId = useRef(`design-canvas-${Math.random().toString(36).substring(2, 9)}`);
  
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const tempRectRef = useRef<fabric.Rect | null>(null);

  // Function to create/initialize the canvas
  const setupCanvas = useCallback(() => {
    if (!mapRef.current || !canvasRef.current) return;
    
    console.log("Initializing canvas overlay");
    
    // Get the dimensions of the map container
    const width = mapRef.current.clientWidth;
    const height = mapRef.current.clientHeight;
    
    // Clean up any existing canvas instance
    if (fabricCanvasRef.current) {
      try {
        fabricCanvasRef.current.dispose();
      } catch (e) {
        console.warn("Error disposing existing fabric canvas:", e);
      }
      fabricCanvasRef.current = null;
      window.designCanvas = null;
    }
    
    // Set canvas dimensions and ID
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    canvasRef.current.id = canvasId.current;
    
    console.log(`Setting canvas size to: ${width}x${height}`);
    
    try {
      // Create new fabric canvas
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
      
      // Prevent propagation of mouse events to map in drawing mode
      canvasRef.current.style.pointerEvents = 'auto';
      canvasRef.current.style.position = 'absolute';
      canvasRef.current.style.top = '0';
      canvasRef.current.style.left = '0';
      canvasRef.current.style.zIndex = '10';
      
      console.log("Canvas created successfully", canvasInstance);
      
      return canvasInstance;
    } catch (error) {
      console.error("Error creating fabric canvas:", error);
      return null;
    }
  }, [mapRef]);
  
  // Initialize canvas after map is loaded
  useEffect(() => {
    if (!mapLoaded || !canvasRef.current || !mapRef.current) return;
    
    // Wait a bit for the map to fully initialize
    const initTimeout = setTimeout(() => {
      const canvas = setupCanvas();
      if (canvas) {
        // Set up resize listener
        const handleResize = () => {
          if (!fabricCanvasRef.current || !mapRef.current) return;
          
          const width = mapRef.current.clientWidth;
          const height = mapRef.current.clientHeight;
          
          fabricCanvasRef.current.setWidth(width);
          fabricCanvasRef.current.setHeight(height);
          fabricCanvasRef.current.renderAll();
          
          console.log(`Canvas resized to: ${width}x${height}`);
        };
        
        window.addEventListener('resize', handleResize);
        
        // Return cleanup function
        return () => {
          window.removeEventListener('resize', handleResize);
          if (fabricCanvasRef.current) {
            try {
              fabricCanvasRef.current.dispose();
            } catch (e) {
              console.warn("Error disposing canvas during cleanup:", e);
            }
            fabricCanvasRef.current = null;
            window.designCanvas = null;
          }
        };
      }
    }, 500);
    
    return () => {
      clearTimeout(initTimeout);
    };
  }, [mapLoaded, mapRef, setupCanvas]);
  
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
      // Disable map dragging when in drawing mode
      if (window.solarDesignerMap) {
        try {
          // For Leaflet maps
          window.solarDesignerMap.dragging.disable();
          window.solarDesignerMap.doubleClickZoom.disable();
          window.solarDesignerMap.scrollWheelZoom.disable();
          console.log("Map dragging disabled for drawing mode");
        } catch (error) {
          console.error("Error disabling map interactions:", error);
        }
      }
      
      // Attach canvas event listeners
      canvas.on("mouse:down", (event) => {
        if (event.e) event.e.stopPropagation();
        startDrawing(event);
      });
      
      canvas.on("mouse:move", (event) => {
        if (event.e) event.e.stopPropagation();
        drawObject(event);
      });
      
      canvas.on("mouse:up", (event) => {
        if (event.e) event.e.stopPropagation();
        finishDrawing(event);
      });
      
      // Ensure canvas catches all events
      if (canvasRef.current) {
        canvasRef.current.style.pointerEvents = 'auto';
      }
      
      console.log("Drawing event listeners added for", activeTool);
    } else {
      // Re-enable map dragging when not in drawing mode
      if (window.solarDesignerMap) {
        try {
          // For Leaflet maps
          window.solarDesignerMap.dragging.enable();
          window.solarDesignerMap.doubleClickZoom.enable();
          window.solarDesignerMap.scrollWheelZoom.enable();
          console.log("Map dragging re-enabled");
        } catch (error) {
          console.error("Error enabling map interactions:", error);
        }
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
    
    // Only update stats when there are actual changes, not on every render
    if (!statsInitialized) {
      setStatsInitialized(true);
      
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
        
        // Update stats
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
    }
  }, [onStatsUpdate, statsInitialized]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full pointer-events-auto z-10"
    />
  );
};
