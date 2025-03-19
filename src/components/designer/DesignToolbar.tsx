
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
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "default" : "outline"} 
            className={cn(
              "justify-start px-3 py-6 h-auto",
              activeTool === tool.id ? "bg-solar text-white" : "hover:bg-solar/10"
            )}
            onClick={() => onToolChange(tool.id)}
          >
            {tool.icon}
            <div className="ml-2 text-left">
              <div className="font-medium">{tool.name}</div>
              <div className="text-xs opacity-80">{tool.description}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};
