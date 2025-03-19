
import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  const mapLoadedRef = useRef(false);

  useEffect(() => {
    if (!apiKey || !mapRef.current || mapLoadedRef.current) return;
    
    // Load Google Maps API
    const loadGoogleMaps = () => {
      if (window.google?.maps) {
        // If Google Maps is already loaded
        initializeMap();
        return;
      }
      
      // Remove any existing Google Maps scripts to avoid conflicts
      const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      existingScripts.forEach(script => script.remove());
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        onMapError("Failed to load Google Maps API. Please check your API key.");
        toast.error("Failed to load Google Maps API. Please check your API key.");
      };
      
      window.initMap = initializeMap;
      document.head.appendChild(script);
    };

    // Initialize map
    const initializeMap = () => {
      if (!mapRef.current) return;
      
      try {
        const defaultLocation = { lat: 37.773972, lng: -122.431297 }; // San Francisco
        
        const map = new window.google.maps.Map(mapRef.current, {
          center: defaultLocation,
          zoom: 20,
          mapTypeId: 'satellite',
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: true,
          gestureHandling: 'cooperative', // This helps with preventing gesture conflicts
          draggable: true // We control this dynamically
        });
        
        // Store map in window for access
        window.solarDesignerMap = map;
        
        // Add search box for locations
        const searchBox = new window.google.maps.places.SearchBox(
          document.getElementById('map-search-input') as HTMLInputElement
        );
        
        // Bias search box to current map bounds
        map.addListener('bounds_changed', () => {
          searchBox.setBounds(map.getBounds() as google.maps.LatLngBounds);
        });
        
        // Listen for search box events
        searchBox.addListener('places_changed', () => {
          const places = searchBox.getPlaces();
          if (!places || places.length === 0) return;
          
          const bounds = new window.google.maps.LatLngBounds();
          places.forEach(place => {
            if (!place.geometry || !place.geometry.location) return;
            
            if (place.geometry.viewport) {
              bounds.union(place.geometry.viewport);
            } else {
              bounds.extend(place.geometry.location);
            }
          });
          
          map.fitBounds(bounds);
          // Zoom in more for better satellite detail
          setTimeout(() => {
            map.setZoom(20);
          }, 500);
        });
        
        // Disable map controls when drawing
        map.addListener('dragstart', () => {
          if (window.isDrawingMode && window.designCanvas) {
            map.setOptions({ draggable: false });
          }
        });
        
        mapLoadedRef.current = true;
        onMapLoaded();
        toast.success("Map loaded successfully");
        
        // Log successful map creation
        console.log("Map created successfully");
      } catch (error) {
        console.error("Map initialization error:", error);
        onMapError("Failed to initialize Google Maps. Please check your API key.");
        toast.error("Failed to initialize Google Maps. Please check your API key.");
      }
    };
    
    loadGoogleMaps();
  }, [apiKey, mapRef, onMapLoaded, onMapError]);

  return null; // This is just a container for the map functionality
};
