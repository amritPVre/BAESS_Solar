
import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import { toast } from "sonner";

interface DesignCanvasProps {
  activeTool: "select" | "building" | "panel" | "delete";
}

export const DesignCanvas: React.FC<DesignCanvasProps> = ({ activeTool }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const isDrawing = useRef(false);
  const rect = useRef<fabric.Rect | null>(null);
  const origX = useRef<number>(0);
  const origY = useRef<number>(0);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#f8f9fa",
      preserveObjectStacking: true,
    });

    setCanvas(fabricCanvas);

    // Add grid for better visual reference
    const gridSize = 20;
    for (let i = 0; i < fabricCanvas.width! / gridSize; i++) {
      fabricCanvas.add(new fabric.Line([i * gridSize, 0, i * gridSize, fabricCanvas.height!], {
        stroke: '#e5e7eb',
        selectable: false,
        evented: false,
      }));
    }
    for (let i = 0; i < fabricCanvas.height! / gridSize; i++) {
      fabricCanvas.add(new fabric.Line([0, i * gridSize, fabricCanvas.width!, i * gridSize], {
        stroke: '#e5e7eb',
        selectable: false,
        evented: false,
      }));
    }

    fabricCanvas.renderAll();
    toast.success("Design canvas initialized");

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // Handle tool changes
  useEffect(() => {
    if (!canvas) return;

    // Reset canvas mode
    canvas.isDrawingMode = false;
    canvas.selection = activeTool === "select";
    canvas.forEachObject((obj) => {
      obj.selectable = activeTool === "select";
      obj.evented = activeTool !== "delete";
    });

    // Update cursor based on active tool
    switch (activeTool) {
      case "select":
        canvas.defaultCursor = "default";
        break;
      case "building":
        canvas.defaultCursor = "crosshair";
        break;
      case "panel":
        canvas.defaultCursor = "cell";
        break;
      case "delete":
        canvas.defaultCursor = "not-allowed";
        break;
    }

    // Add event listeners based on tool
    if (activeTool === "building") {
      canvas.on("mouse:down", startDrawingBuilding);
      canvas.on("mouse:move", drawBuilding);
      canvas.on("mouse:up", finishDrawingBuilding);
    } else {
      canvas.off("mouse:down", startDrawingBuilding);
      canvas.off("mouse:move", drawBuilding);
      canvas.off("mouse:up", finishDrawingBuilding);
    }

    if (activeTool === "panel") {
      canvas.on("mouse:down", addSolarPanel);
    } else {
      canvas.off("mouse:down", addSolarPanel);
    }

    if (activeTool === "delete") {
      canvas.on("mouse:down", deleteObject);
    } else {
      canvas.off("mouse:down", deleteObject);
    }

    return () => {
      canvas.off("mouse:down", startDrawingBuilding);
      canvas.off("mouse:move", drawBuilding);
      canvas.off("mouse:up", finishDrawingBuilding);
      canvas.off("mouse:down", addSolarPanel);
      canvas.off("mouse:down", deleteObject);
    };
  }, [activeTool, canvas]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvas) return;
      
      // Get the parent container width
      const parent = canvasRef.current?.parentElement;
      if (!parent) return;
      
      const containerWidth = parent.clientWidth;
      canvas.setWidth(containerWidth - 16); // Account for padding
      canvas.renderAll();
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial resize

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [canvas]);

  // Drawing functions
  const startDrawingBuilding = (options: fabric.IEvent<MouseEvent>) => {
    if (!canvas || !options.pointer) return;
    isDrawing.current = true;
    origX.current = options.pointer.x;
    origY.current = options.pointer.y;
    
    rect.current = new fabric.Rect({
      left: origX.current,
      top: origY.current,
      width: 0,
      height: 0,
      fill: "rgba(170, 170, 170, 0.3)",
      stroke: "#666",
      strokeWidth: 2,
      selectable: false,
      evented: false,
      strokeUniform: true,
    });
    
    canvas.add(rect.current);
    canvas.renderAll();
  };

  const drawBuilding = (options: fabric.IEvent<MouseEvent>) => {
    if (!isDrawing.current || !canvas || !rect.current || !options.pointer) return;
    
    const pointer = options.pointer;
    let width = Math.abs(pointer.x - origX.current);
    let height = Math.abs(pointer.y - origY.current);
    
    if (width + height > 10) {
      // Snap to grid (20px)
      width = Math.round(width / 20) * 20;
      height = Math.round(height / 20) * 20;
      
      if (pointer.x > origX.current) {
        rect.current.set("width", width);
      } else {
        rect.current.set({ left: origX.current - width, width });
      }
      
      if (pointer.y > origY.current) {
        rect.current.set("height", height);
      } else {
        rect.current.set({ top: origY.current - height, height });
      }
      
      canvas.renderAll();
    }
  };

  const finishDrawingBuilding = () => {
    if (!isDrawing.current || !canvas || !rect.current) return;
    
    rect.current.set({
      selectable: true,
      evented: true,
    });

    // Add label to identify as building
    rect.current.data = { type: "building" };
    
    canvas.setActiveObject(rect.current);
    canvas.renderAll();
    
    isDrawing.current = false;
    rect.current = null;
    
    toast.success("Building added to design");
  };

  const addSolarPanel = (options: fabric.IEvent<MouseEvent>) => {
    if (!canvas || !options.pointer) return;
    
    // Check if clicking on a building
    const target = canvas.findTarget(options.e as Event, false);
    
    if (target && target.data?.type === "building") {
      // Create a solar panel
      const panel = new fabric.Rect({
        left: options.pointer.x - 30,
        top: options.pointer.y - 15,
        width: 60,
        height: 30,
        fill: "#2563eb", // Solar blue color
        stroke: "#1e40af",
        strokeWidth: 1,
        selectable: true,
        data: { type: "panel" },
      });
      
      canvas.add(panel);
      canvas.setActiveObject(panel);
      canvas.renderAll();
      
      toast.success("Solar panel added");
    } else {
      toast.error("Solar panels must be placed on buildings");
    }
  };

  const deleteObject = (options: fabric.IEvent<MouseEvent>) => {
    if (!canvas) return;
    
    const target = canvas.findTarget(options.e as Event, false);
    if (target) {
      canvas.remove(target);
      canvas.renderAll();
      toast.success("Object removed from design");
    }
  };

  return (
    <div className="w-full h-full flex justify-center">
      <canvas 
        ref={canvasRef} 
        id="design-canvas"
        className="border border-gray-200 shadow-inner"
      />
    </div>
  );
};
