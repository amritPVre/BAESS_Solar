
import React, { useEffect, useRef, useCallback } from 'react';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import { Map, StopCircle } from 'lucide-react';

// Get the Google Maps API key and Map ID from environment variables
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const GOOGLE_MAPS_ID = import.meta.env.VITE_GOOGLE_MAPS_ID || '';

// Add TypeScript interface for window to include our custom properties
declare global {
  interface Window {
    _mapInitialized?: boolean;
    gm_authFailure?: () => void;
  }
}

// Define the libraries type correctly
type Libraries = ("drawing" | "geometry" | "places" | "visualization" | "marker")[];
const libraries: Libraries = ["drawing", "geometry", "places", "marker"];

interface AreaMapContainerProps {
  latitude: number;
  longitude: number;
  onMapLoaded: (map: google.maps.Map) => void;
  drawingManagerRef: React.MutableRefObject<google.maps.drawing.DrawingManager | null>;
}

export const AreaMapContainer: React.FC<AreaMapContainerProps> = ({ 
  latitude, 
  longitude,
  onMapLoaded,
  drawingManagerRef
}) => {
  const mapContainerStyle = {
    width: '100%',
    height: '500px',
    borderRadius: '8px'
  };
  
  // Use references to prevent re-renders
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapInitializationAttempts = useRef(0);
  const mapFullyLoadedRef = useRef(false);

  // Use the provided coordinates or fallback to New York
  const defaultCenter = { 
    lat: 40.7128, 
    lng: -74.0060 
  };
  
  // Memoize center to prevent unnecessary re-renders
  const center = useRef({ 
    lat: latitude || defaultCenter.lat, 
    lng: longitude || defaultCenter.lng 
  });
  
  const zoom = 18; // Higher zoom level for better detail
  
  // Handle map load with useCallback to prevent recreating the function
  const handleMapLoad = useCallback((googleMap: google.maps.Map) => {
    // Only proceed if this is the first load or if the map reference has changed
    if (mapFullyLoadedRef.current && mapRef.current === googleMap) {
      return;
    }
    
    console.log("Map loaded successfully");
    mapRef.current = googleMap;
    mapFullyLoadedRef.current = true;
    mapInitializationAttempts.current = 0;
    
    // Add a slight delay to ensure all map components are loaded
    setTimeout(() => {
      // Pass the loaded map to the parent component
      onMapLoaded(googleMap);
    }, 200);
  }, [onMapLoaded]);

  // Handle load error
  const handleLoadError = useCallback((error: Error) => {
    console.error("Error loading Google Maps:", error);
    
    if (mapInitializationAttempts.current < 3) {
      mapInitializationAttempts.current++;
      console.log(`Retrying map initialization (attempt ${mapInitializationAttempts.current})`);
      
      // Clear the initialization flag to allow another attempt
      window._mapInitialized = false;
      
      // Force a re-render after a delay
      setTimeout(() => {
        // This will trigger a re-render of the component
        const mapContainer = document.getElementById('area-map-container');
        if (mapContainer) {
          mapContainer.innerHTML = '';
        }
      }, 1000);
    }
  }, []);

  // Update center ref when props change, but don't trigger re-render
  useEffect(() => {
    center.current = { 
      lat: latitude || defaultCenter.lat, 
      lng: longitude || defaultCenter.lng 
    };
    
    // If map already exists, update its center
    if (mapRef.current) {
      mapRef.current.setCenter(center.current);
    }
  }, [latitude, longitude]);

  // Options memoized to prevent re-renders
  const mapOptions = useRef({
    streetViewControl: false,
    mapTypeId: "satellite",
    gestureHandling: "greedy",
    mapTypeControl: true,
    fullscreenControl: true,
    zoomControl: true,
    // Add the map ID back to the options
    mapId: GOOGLE_MAPS_ID
  });

  // Ensure the Google Maps script loads only once
  useEffect(() => {
    // Mark the component as initialized to prevent double initialization
    if (window._mapInitialized) {
      return;
    }
    window._mapInitialized = true;
    
    // Ensure Google Maps API is loaded
    if (!window.google && GOOGLE_MAPS_API_KEY) {
      console.log("Setting up Google Maps API loader");
      
      // Add global error handler for Google Maps
      window.gm_authFailure = () => {
        console.error("Google Maps authentication failed");
        // You can show an error message to the user here
      };
    }
  }, []);

  return (
    <div className="relative h-[500px] border rounded-md overflow-hidden" id="area-map-container">
      {!GOOGLE_MAPS_API_KEY && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center p-4">
            <StopCircle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-900">Google Maps API Key Missing</h3>
            <p className="text-sm text-gray-600 max-w-md">
              Please add your Google Maps API key to the environment variables as VITE_GOOGLE_MAPS_API_KEY.
            </p>
          </div>
        </div>
      )}
      {!GOOGLE_MAPS_ID && GOOGLE_MAPS_API_KEY && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center p-4">
            <StopCircle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-900">Google Maps ID Missing</h3>
            <p className="text-sm text-gray-600 max-w-md">
              Please add your Google Maps ID to the environment variables as VITE_GOOGLE_MAPS_ID.
            </p>
          </div>
        </div>
      )}
      <LoadScript 
        googleMapsApiKey={GOOGLE_MAPS_API_KEY} 
        libraries={libraries}
        onError={handleLoadError}
        loadingElement={
          <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <Map className="h-8 w-8 text-blue-500 mx-auto animate-pulse" />
              <p className="mt-2 text-sm text-gray-600">Loading Google Maps...</p>
            </div>
          </div>
        }
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center.current}
          zoom={zoom}
          onLoad={handleMapLoad}
          options={mapOptions.current}
        >
          {/* Drawing handled by the DrawingManager in the hook */}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};
