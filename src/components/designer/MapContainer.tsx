
import React, { useEffect } from "react";
import { Loader } from "lucide-react";

interface MapContainerProps {
  apiKey: string;
  mapRef: React.RefObject<HTMLDivElement>;
  onMapLoaded: () => void;
  onMapError: (error: string) => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  apiKey,
  mapRef,
  onMapLoaded,
  onMapError
}) => {
  // Load Google Maps API and initialize map
  useEffect(() => {
    if (!apiKey || !mapRef.current) return;
    
    // Define init function in global scope for Google Maps callback
    window.initMap = () => {
      try {
        if (!mapRef.current) {
          throw new Error("Map container not found");
        }
        
        // Create map instance
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
          zoom: 19, // Higher zoom level for better detail
          mapTypeId: window.google.maps.MapTypeId.HYBRID, // Satellite with labels
          tilt: 0, // No 3D tilt for better drawing surface
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          scaleControl: true,
          rotateControl: false,
          fullscreenControl: true,
          streetViewControl: false,
          clickableIcons: false,
          gestureHandling: "greedy", // Allow one-finger pan on mobile
          draggable: true, // Will be disabled during drawing mode
        });
        
        // Make map instance available globally
        window.solarDesignerMap = map;
        
        // Add event listener for when the map is fully loaded
        window.google.maps.event.addListenerOnce(map, "idle", () => {
          console.log("Google Maps fully loaded");
          onMapLoaded();
        });
        
      } catch (error) {
        console.error("Error initializing map:", error);
        onMapError(error.message || "Failed to initialize map");
      }
    };
    
    // Load Google Maps API
    try {
      if (!window.google || !window.google.maps) {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onerror = () => onMapError("Failed to load Google Maps API");
        document.head.appendChild(script);
      } else {
        // API already loaded, initialize map directly
        window.initMap();
      }
    } catch (error) {
      console.error("Error loading Google Maps API:", error);
      onMapError(error.message || "Failed to load Google Maps API");
    }
    
    return () => {
      // Clean up
      delete window.initMap;
      delete window.solarDesignerMap;
    };
  }, [apiKey, mapRef, onMapLoaded, onMapError]);
  
  return null; // No visible component, just functionality
};
