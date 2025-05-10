
import React, { useEffect, useRef } from 'react';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import { Map, StopCircle } from 'lucide-react';
import { GOOGLE_MAPS_LIBRARIES } from './constants';

// Get the Google Maps API key and Map ID from environment variables
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const GOOGLE_MAPS_ID = import.meta.env.VITE_GOOGLE_MAPS_ID || '';

interface AreaMapContainerProps {
  latitude: number;
  longitude: number;
  map: google.maps.Map | null;
  drawingManagerRef: React.MutableRefObject<google.maps.drawing.DrawingManager | null>;
}

export const AreaMapContainer: React.FC<AreaMapContainerProps> = ({ 
  latitude, 
  longitude,
  map,
  drawingManagerRef
}) => {
  const mapContainerStyle = {
    width: '100%',
    height: '500px',
    borderRadius: '8px'
  };
  
  // Use references to prevent re-renders
  const mapRef = useRef<google.maps.Map | null>(null);
  const loadScriptLoaded = useRef(false);

  // Use the provided coordinates or fallback to New York
  const center = { 
    lat: latitude || 40.7128, 
    lng: longitude || -74.0060 
  };
  
  const zoom = 18; // Higher zoom level for better detail
  
  const onLoad = (googleMap: google.maps.Map) => {
    console.log("Map loaded successfully");
    
    // Store map reference to parent props and local ref
    mapRef.current = googleMap;
    
    // Initialize the drawing manager when the map loads
    if (typeof window.google !== 'undefined' && drawingManagerRef.current === null) {
      try {
        const drawingManager = new window.google.maps.drawing.DrawingManager({
          drawingMode: null,
          drawingControl: true,
          drawingControlOptions: {
            position: window.google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [
              window.google.maps.drawing.OverlayType.POLYGON,
              window.google.maps.drawing.OverlayType.RECTANGLE
            ]
          },
          polygonOptions: {
            fillColor: "#FF0000",
            fillOpacity: 0.30,
            strokeWeight: 1,
            strokeColor: "#FF0000",
            clickable: true, 
            editable: true,
            draggable: true,
            zIndex: 1
          },
          rectangleOptions: {
            fillColor: "#FF0000",
            fillOpacity: 0.30,
            strokeWeight: 1,
            strokeColor: "#FF0000",
            clickable: true, 
            editable: true,
            draggable: true,
            zIndex: 1
          }
        });
        drawingManager.setMap(googleMap);
        drawingManagerRef.current = drawingManager;
      } catch (error) {
        console.error("Failed to initialize drawing manager:", error);
      }
    }
  };

  // Pass map reference to parent with useEffect to prevent render loops
  useEffect(() => {
    if (mapRef.current) {
      // This is how we update the parent's map reference without causing re-renders
      (map as any) = mapRef.current;
    }
  }, [mapRef.current]);

  return (
    <div className="relative h-[500px] border rounded-md overflow-hidden">
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
      <LoadScript 
        googleMapsApiKey={GOOGLE_MAPS_API_KEY} 
        libraries={GOOGLE_MAPS_LIBRARIES}
        loadingElement={
          <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <Map className="h-8 w-8 text-blue-500 mx-auto animate-pulse" />
              <p className="mt-2 text-sm text-gray-600">Loading Google Maps...</p>
            </div>
          </div>
        }
        onLoad={() => { loadScriptLoaded.current = true; }}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={zoom}
          onLoad={onLoad}
          options={{
            streetViewControl: false,
            mapTypeId: "satellite",
            gestureHandling: "greedy",
            mapTypeControl: true,
            fullscreenControl: true,
            zoomControl: true
          }}
        >
          {/* Drawing handled by the DrawingManager in the hook */}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};
