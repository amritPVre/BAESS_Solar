
import React, { useRef, useEffect, useState } from 'react';
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import { useGoogleMapsScript } from './hooks/useGoogleMapsScript';

interface AreaMapContainerProps {
  drawingManagerRef: React.MutableRefObject<google.maps.drawing.DrawingManager | null>;
  latitude: number;
  longitude: number;
  onMapLoaded: (map: google.maps.Map) => void;
}

// Libraries needed for Google Maps
const libraries = ["drawing", "geometry", "marker"] as ("drawing" | "geometry" | "places" | "visualization" | "marker")[];

export const AreaMapContainer: React.FC<AreaMapContainerProps> = ({
  drawingManagerRef,
  latitude,
  longitude,
  onMapLoaded
}) => {
  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_ID as string;
  
  // Load Google Maps script
  const scriptStatus = useGoogleMapsScript(apiKey);
  
  const mapContainerStyle = {
    height: "500px",
    width: "100%",
    borderRadius: "0.5rem"
  };

  const defaultCenter = {
    lat: latitude || 40.7128,
    lng: longitude || -74.0060
  };

  // Map load handler
  const handleMapLoad = (map: google.maps.Map) => {
    console.log("Map loaded successfully");
    onMapLoaded(map);
  };

  // Map options
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

  // Show error if API key is missing
  if (!apiKey) {
    return (
      <div className="border rounded-md bg-gray-100 h-[500px] flex items-center justify-center">
        <p className="text-red-500">Google Maps API key is missing. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.</p>
      </div>
    );
  }

  // Show loading state while script is loading
  if (scriptStatus === 'loading') {
    return (
      <div className="border rounded-md bg-gray-100 h-[500px] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
        <p className="text-gray-600">Loading Google Maps...</p>
      </div>
    );
  }

  // Show error if script failed to load
  if (scriptStatus === 'error') {
    return (
      <div className="border rounded-md bg-red-50 h-[500px] flex items-center justify-center">
        <p className="text-red-500">Failed to load Google Maps. Please check your API key and try again.</p>
      </div>
    );
  }

  // Show map when script is ready
  return (
    <div className="h-[500px] w-full relative">
      {scriptStatus === 'ready' && (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={18}
          onLoad={handleMapLoad}
          options={mapOptions}
        >
          {/* Drawing manager and polygons are handled by parent component */}
        </GoogleMap>
      )}
    </div>
  );
};
