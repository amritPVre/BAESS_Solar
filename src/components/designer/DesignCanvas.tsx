
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
  const mapInstanceId = useRef(`solar-designer-map-${Math.random().toString(36).substring(2, 9)}`);
  
  // Generate a unique ID for the map div to be used by Leaflet
  useEffect(() => {
    if (mapRef.current) {
      // Use the unique ID generated for this component instance
      mapRef.current.id = mapInstanceId.current;
      
      // Clean up any existing leaflet instances on this element
      if (mapRef.current._leaflet_id) {
        console.log("Cleaning up existing Leaflet instance on mount");
        delete mapRef.current._leaflet_id;
      }
    }
    
    return () => {
      // Clean up global references on unmount
      if (window.solarDesignerMap) {
        try {
          window.solarDesignerMap.remove();
        } catch (e) {
          console.warn("Error removing map on unmount:", e);
        }
        window.solarDesignerMap = undefined;
      }
      window.designCanvas = null;
      window.isDrawingMode = false;
    };
  }, []);
  
  const handleMapLoaded = () => {
    console.log("Map loaded callback triggered");
    
    // Reset any errors
    setMapError(null);
    
    // Give the map a moment to fully render
    setTimeout(() => {
      if (window.solarDesignerMap) {
        try {
          window.solarDesignerMap.invalidateSize(true);
          setMapLoaded(true);
        } catch (e) {
          console.error("Error in map loaded callback:", e);
          setMapError("Error initializing map interface");
        }
      }
    }, 500);
  };
  
  // Clear state when component unmounts
  useEffect(() => {
    return () => {
      setMapLoaded(false);
      setMapError(null);
      setCanvasInitialized(false);
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
