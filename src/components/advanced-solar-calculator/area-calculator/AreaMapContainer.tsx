
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { toast } from "sonner";
import { GoogleMap, LoadScript } from '@react-google-maps/api';

interface AreaMapContainerProps {
  drawingManagerRef: React.MutableRefObject<google.maps.drawing.DrawingManager | null>;
  latitude: number;
  longitude: number;
  onMapLoaded: (map: google.maps.Map) => void;
}

const libraries = ["drawing", "geometry", "marker"] as ("drawing" | "geometry" | "places" | "visualization" | "marker")[];

export const AreaMapContainer: React.FC<AreaMapContainerProps> = ({
  drawingManagerRef,
  latitude,
  longitude,
  onMapLoaded
}) => {
  const [mapApiKey, setMapApiKey] = useState<string | null>(null);
  const [mapId, setMapId] = useState<string | null>(null);
  
  // Get API key from environment variable
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const mapIdValue = import.meta.env.VITE_GOOGLE_MAPS_ID;
    
    if (!apiKey) {
      toast.error("Google Maps API key is missing. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.");
    } else {
      setMapApiKey(apiKey);
    }
    
    if (mapIdValue) {
      setMapId(mapIdValue);
    } else {
      console.warn("Google Maps ID is missing. Map styling may be limited. Add VITE_GOOGLE_MAPS_ID to your .env file for enhanced styling.");
    }
  }, []);

  const mapContainerStyle = {
    height: "500px",
    width: "100%",
    borderRadius: "0.5rem"
  };

  const defaultCenter = {
    lat: latitude || 40.7128,
    lng: longitude || -74.0060
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    console.log("Map loaded successfully");
    onMapLoaded(map);
  }, [onMapLoaded]);

  const mapOptions: google.maps.MapOptions = {
    mapTypeId: "satellite",
    streetViewControl: false,
    fullscreenControl: true,
    mapTypeControl: true,
    mapTypeControlOptions: {
      position: google.maps.ControlPosition.TOP_LEFT,
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
    },
    zoomControl: true,
    gestureHandling: "greedy",
    mapId: mapId || undefined // Use mapId if available
  };

  if (!mapApiKey) {
    return (
      <div className="border rounded-md bg-gray-100 h-[500px] flex items-center justify-center">
        <p className="text-red-500">Google Maps API key is missing. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.</p>
      </div>
    );
  }

  return (
    <div className="h-[500px] w-full relative">
      <LoadScript
        googleMapsApiKey={mapApiKey}
        libraries={libraries}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={18}
          onLoad={onLoad}
          options={mapOptions}
        >
          {/* Drawing manager and polygons are handled by parent component */}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};
