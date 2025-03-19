
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { GoogleMapsKeyInput } from "./GoogleMapsKeyInput";
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
  const [apiKey, setApiKey] = useState<string>(() => {
    // Try to get API key from sessionStorage
    return sessionStorage.getItem("gmapsApiKey") || "";
  });
  const [apiKeyEntered, setApiKeyEntered] = useState(() => {
    // Check if API key exists in sessionStorage
    return !!sessionStorage.getItem("gmapsApiKey");
  });
  
  // Handle API key submission
  const handleApiKeySubmit = (newApiKey: string) => {
    setApiKey(newApiKey);
    setApiKeyEntered(true);
  };
  
  return (
    <div className="design-canvas-container relative w-full h-[600px] overflow-hidden rounded-md border-2 border-gray-200 shadow-sm">
      {!apiKeyEntered ? (
        <GoogleMapsKeyInput onApiKeySubmit={handleApiKeySubmit} />
      ) : null}
      
      {/* Map search controls */}
      {apiKeyEntered && (
        <MapSearchControls mapLoaded={mapLoaded} />
      )}
      
      {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full h-full"
      />
      
      {/* Map initialization functionality */}
      {apiKeyEntered && (
        <MapContainer 
          apiKey={apiKey} 
          mapRef={mapRef} 
          onMapLoaded={() => setMapLoaded(true)} 
          onMapError={setMapError} 
        />
      )}
      
      {/* Canvas overlay */}
      {apiKeyEntered && mapLoaded && (
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
        apiKeyEntered={apiKeyEntered} 
      />
    </div>
  );
};

// Add Window interface extension for Google Maps and Canvas
declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
    solarDesignerMap: google.maps.Map;
    designCanvas: fabric.Canvas;
    isDrawingMode: boolean;
  }
}
