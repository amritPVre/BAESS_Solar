
import React, { useState, useRef, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { GoogleMap } from '@react-google-maps/api';
import { useGoogleMapsScript } from './hooks/useGoogleMapsScript';

interface AreaMapContainerProps {
  drawingManagerRef: React.MutableRefObject<google.maps.drawing.DrawingManager | null>;
  latitude: number;
  longitude: number;
  onMapLoaded: (map: google.maps.Map) => void;
}

// Define libraries array for Google Maps
const libraries = ["drawing", "geometry", "marker"] as ("drawing" | "geometry" | "places" | "visualization" | "marker")[];

export const AreaMapContainer: React.FC<AreaMapContainerProps> = ({
  drawingManagerRef,
  latitude,
  longitude,
  onMapLoaded
}) => {
  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
  
  // Track map initialization to prevent duplicate rendering
  const mapInitializedRef = useRef(false);
  
  // Load Google Maps script
  const scriptStatus = useGoogleMapsScript(apiKey);
  
  const mapContainerStyle = useMemo(() => ({
    height: "500px",
    width: "100%",
    borderRadius: "0.5rem"
  }), []);

  // Create default center object
  const defaultCenter = useMemo(() => ({
    lat: latitude || 40.7128,
    lng: longitude || -74.0060
  }), [latitude, longitude]);

  // Map options with mapId properly included
  const mapOptions = useMemo(() => {
    if (!window.google) return {};
    
    return {
      streetViewControl: false,
      fullscreenControl: true,
      mapTypeControl: true,
      mapTypeId: window.google?.maps?.MapTypeId?.SATELLITE || 'satellite',
      mapTypeControlOptions: {
        position: window.google?.maps?.ControlPosition?.TOP_LEFT || 1,
        style: window.google?.maps?.MapTypeControlStyle?.HORIZONTAL_BAR || 1
      },
      mapId: "142c120910df35ea",  // Restored mapId
      zoomControl: true,
      gestureHandling: "greedy" as const
    };
  }, []);

  // Map load handler with initialization check
  const handleMapLoad = (map: google.maps.Map) => {
    // Prevent duplicate initializations
    if (mapInitializedRef.current) {
      console.log("Map already initialized, skipping duplicate onLoad");
      return;
    }
    
    console.log("Map loaded successfully");
    mapInitializedRef.current = true;
    
    // Call onMapLoaded after a short delay to ensure map is fully loaded
    setTimeout(() => {
      onMapLoaded(map);
    }, 100);
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

  // Only render the map when the script is ready
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
