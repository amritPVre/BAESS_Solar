import React, { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Rect, util, fabric } from "fabric";
import { toast } from "sonner";

interface DesignCanvasProps {
  activeTool: "select" | "building" | "panel" | "delete";
}

export const DesignCanvas: React.FC<DesignCanvasProps> = ({ activeTool }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const tempRectRef = useRef<any>(null);
  
  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvasInstance = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#f8f9fa",
      selection: true,
      fireRightClick: true,
    });
    
    // Add grid pattern
    createGrid(canvasInstance);
    
    setCanvas(canvasInstance);
    
    return () => {
      canvasInstance.dispose();
    };
  }, []);
  
  // Handle tool changes
  useEffect(() => {
    if (!canvas) return;
    
    // Clear any ongoing operations
    isDrawingRef.current = false;
    startPointRef.current = null;
    
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
    
    // Set up delete tool
    if (activeTool === "delete") {
      canvas.on("mouse:down", deleteObject);
    } else {
      canvas.off("mouse:down", deleteObject);
    }
    
    // Set up drawing tools
    if (activeTool === "building" || activeTool === "panel") {
      canvas.on("mouse:down", startDrawing);
      canvas.on("mouse:move", drawObject);
      canvas.on("mouse:up", finishDrawing);
    } else {
      canvas.off("mouse:down", startDrawing);
      canvas.off("mouse:move", drawObject);
      canvas.off("mouse:up", finishDrawing);
    }
    
    return () => {
      if (canvas) {
        canvas.off("mouse:down", startDrawing);
        canvas.off("mouse:move", drawObject);
        canvas.off("mouse:up", finishDrawing);
        canvas.off("mouse:down", deleteObject);
      }
    };
  }, [activeTool, canvas]);
  
  // Create grid
  const createGrid = (canvas: FabricCanvas) => {
    const gridSize = 20;
    const width = canvas.width || 800;
    const height = canvas.height || 600;
    
    // Create gridlines
    for (let i = 0; i < width / gridSize; i++) {
      const lineX = new fabric.Line([i * gridSize, 0, i * gridSize, height], {
        stroke: "#e0e0e0",
        selectable: false,
        evented: false,
      });
      canvas.add(lineX);
    }
    
    for (let i = 0; i < height / gridSize; i++) {
      const lineY = new fabric.Line([0, i * gridSize, width, i * gridSize], {
        stroke: "#e0e0e0",
        selectable: false,
        evented: false,
      });
      canvas.add(lineY);
    }
    
    canvas.renderAll();
  };
  
  // Snap point to grid
  const snapToGrid = (point: { x: number; y: number }, gridSize = 20) => {
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    };
  };
  
  // Start drawing
  const startDrawing = (options: any) => {
    if (!canvas || !options.pointer) return;
    
    const pointer = options.pointer;
    const snappedPoint = snapToGrid(pointer);
    
    isDrawingRef.current = true;
    startPointRef.current = snappedPoint;
    
    if (tempRectRef.current) {
      canvas.remove(tempRectRef.current);
    }
    
    const rectOptions = {
      left: snappedPoint.x,
      top: snappedPoint.y,
      width: 0,
      height: 0,
      fill: activeTool === "building" ? 'rgba(200, 200, 200, 0.5)' : 'rgba(65, 105, 225, 0.7)',
      stroke: activeTool === "building" ? '#888888' : '#2762c5',
      strokeWidth: 2,
      selectable: false,
      evented: false,
    };
    
    tempRectRef.current = new Rect(rectOptions);
    canvas.add(tempRectRef.current);
  };
  
  // Draw object while mouse moves
  const drawObject = (options: any) => {
    if (!canvas || !isDrawingRef.current || !startPointRef.current || !tempRectRef.current || !options.pointer) {
      return;
    }
    
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
  
  // Finish drawing
  const finishDrawing = () => {
    if (!canvas || !isDrawingRef.current || !tempRectRef.current) {
      return;
    }
    
    if (tempRectRef.current.width > 0 && tempRectRef.current.height > 0) {
      // Create the actual object
      const objectOptions = {
        left: tempRectRef.current.left,
        top: tempRectRef.current.top,
        width: tempRectRef.current.width,
        height: tempRectRef.current.height,
        fill: activeTool === "building" ? 'rgba(200, 200, 200, 0.5)' : 'rgba(65, 105, 225, 0.7)',
        stroke: activeTool === "building" ? '#888888' : '#2762c5',
        strokeWidth: 2,
        selectable: activeTool === "select",
        objectType: activeTool === "building" ? "building" : "panel",
        metadata: {
          type: activeTool === "building" ? "building" : "panel",
          createdAt: new Date().toISOString(),
        }
      };
      
      const finalObject = new Rect(objectOptions);
      canvas.add(finalObject);
      
      // Show toast based on what was created
      if (activeTool === "building") {
        toast.success("Building created");
      } else if (activeTool === "panel") {
        toast.success("Solar panel placed");
      }
    }
    
    // Clean up temporary rectangle
    canvas.remove(tempRectRef.current);
    tempRectRef.current = null;
    
    isDrawingRef.current = false;
    startPointRef.current = null;
    
    canvas.renderAll();
  };
  
  // Delete object
  const deleteObject = (options: any) => {
    if (!canvas || activeTool !== "delete") return;
    
    const target = options.target;
    if (target) {
      canvas.remove(target);
      toast.success(`${target.objectType || "Object"} deleted`);
      canvas.renderAll();
    }
  };
  
  return (
    <div className="canvas-container h-[600px] w-full relative overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="border-2 border-gray-200 rounded-md shadow-sm bg-white"
      />
    </div>
  );
};
