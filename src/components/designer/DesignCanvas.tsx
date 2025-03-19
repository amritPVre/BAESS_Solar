
import React, { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { MapSearchControls } from "./MapSearchControls";
import { MapContainer } from "./MapContainer";
import { CanvasOverlay } from "./CanvasOverlay";
import { DesignCanvasUI } from "./DesignCanvasUI";

interface DesignCanvasProps {
  activeTool: "select" | "building" | "panel" | "delete";
  onStatsUpdate?: (stats: {
    totalPanelArea: number;
    estimatedCapacity: number;
    buildingCount: number;
    panelCount: number;
  }) => void;
}

export const DesignCanvas: React.FC<DesignCanvasProps> = ({ 
  activeTool,
  onStatsUpdate 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  useEffect(() => {
    // Generate a unique ID for the map div to be used by Leaflet
    if (mapRef.current) {
      mapRef.current.id = "solar-designer-map";
    }
  }, []);
  
  return (
    <div className="design-canvas-container relative w-full h-[600px] overflow-hidden rounded-md border-2 border-gray-200 shadow-sm">
      {/* Map search controls */}
      {mapLoaded && (
        <MapSearchControls mapLoaded={mapLoaded} />
      )}
      
      {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full h-full"
      />
      
      {/* Map initialization functionality */}
      <MapContainer 
        mapRef={mapRef} 
        onMapLoaded={() => setMapLoaded(true)} 
        onMapError={setMapError} 
      />
      
      {/* Canvas overlay */}
      {mapLoaded && (
        <CanvasOverlay 
          mapRef={mapRef} 
          mapLoaded={mapLoaded} 
          activeTool={activeTool} 
          onStatsUpdate={onStatsUpdate} 
        />
      )}
      
      {/* UI Elements */}
      <DesignCanvasUI 
        mapLoaded={mapLoaded} 
        mapError={mapError} 
        activeTool={activeTool} 
        apiKeyEntered={true} 
      />
    </div>
  );
};

// Add Window interface extension for Leaflet Map and Canvas
declare global {
  interface Window {
    solarDesignerMap: any; // Will hold our Leaflet map instance
    designCanvas: fabric.Canvas | null;
    isDrawingMode: boolean;
  }
}
