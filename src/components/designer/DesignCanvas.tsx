
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
  const [canvasInitialized, setCanvasInitialized] = useState(false);
  
  // Generate a unique ID for the map div to be used by Leaflet
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.id = "solar-designer-map";
      
      // Clean up any existing leaflet instances on this element
      if (mapRef.current._leaflet_id) {
        delete mapRef.current._leaflet_id;
      }
    }
  }, []);
  
  const handleMapLoaded = () => {
    console.log("Map loaded callback triggered");
    
    // Give the map a moment to fully render
    setTimeout(() => {
      if (window.solarDesignerMap) {
        window.solarDesignerMap.invalidateSize(true);
        setMapLoaded(true);
      }
    }, 200);
  };
  
  // Make sure to properly clean up when component unmounts
  useEffect(() => {
    return () => {
      // Clean up global references
      if (window.solarDesignerMap) {
        window.solarDesignerMap.remove();
        window.solarDesignerMap = undefined;
      }
      window.designCanvas = null;
      window.isDrawingMode = false;
    };
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
        id="solar-designer-map"
        className="w-full h-full"
      />
      
      {/* Map initialization functionality */}
      <MapContainer 
        mapRef={mapRef} 
        onMapLoaded={handleMapLoaded} 
        onMapError={setMapError} 
      />
      
      {/* Canvas overlay - only render when map is confirmed loaded */}
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
