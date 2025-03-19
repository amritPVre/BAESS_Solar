
import React from "react";
import { Button } from "@/components/ui/button";
import { Square, Laptop, MousePointer, PanelTop, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DesignToolbarProps {
  activeTool: "select" | "building" | "panel" | "delete";
  onToolChange: (tool: "select" | "building" | "panel" | "delete") => void;
}

export const DesignToolbar: React.FC<DesignToolbarProps> = ({ activeTool, onToolChange }) => {
  const tools = [
    {
      id: "select",
      name: "Select",
      icon: <MousePointer />,
      description: "Select and modify objects"
    },
    {
      id: "building",
      name: "Building",
      icon: <Square />,
      description: "Draw building outline"
    },
    {
      id: "panel",
      name: "Solar Panel",
      icon: <PanelTop />,
      description: "Place solar panels"
    },
    {
      id: "delete",
      name: "Delete",
      icon: <Trash2 />,
      description: "Remove objects"
    }
  ] as const;

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg mb-2">Design Tools</h3>
      
      <div className="flex flex-col gap-2">
        {tools.map((tool) => {
          const isDrawingTool = tool.id === "building" || tool.id === "panel";
          const isActive = activeTool === tool.id;
          
          return (
            <Button
              key={tool.id}
              variant={isActive ? "default" : "outline"} 
              className={cn(
                "justify-start px-3 py-6 h-auto relative",
                isActive && isDrawingTool ? "bg-red-500 text-white" : 
                isActive ? "bg-solar text-white" : 
                "hover:bg-solar/10"
              )}
              onClick={() => onToolChange(tool.id)}
            >
              {tool.icon}
              <div className="ml-2 text-left">
                <div className="font-medium">{tool.name}</div>
                <div className="text-xs opacity-80">{tool.description}</div>
              </div>
              
              {isActive && isDrawingTool && (
                <div className="absolute -right-1 -top-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  ✏️
                </div>
              )}
            </Button>
          );
        })}
      </div>
      
      {(activeTool === "building" || activeTool === "panel") && (
        <div className="mt-4 p-2 border border-red-200 bg-red-50 rounded-md">
          <p className="text-sm text-red-700 font-medium">Drawing Mode Active</p>
          <p className="text-xs text-red-600 mt-1">
            Click and drag on the map to create a {activeTool === "building" ? "building outline" : "solar panel"}.
            Map panning is disabled while drawing.
          </p>
        </div>
      )}
    </div>
  );
};
