
import React, { useEffect, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapContainerProps {
  mapRef: React.RefObject<HTMLDivElement>;
  onMapLoaded: () => void;
  onMapError: (error: string) => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  mapRef,
  onMapLoaded,
  onMapError
}) => {
  const leafletMapRef = useRef<L.Map | null>(null);

  // Load OpenStreetMap and initialize map
  useEffect(() => {
    if (!mapRef.current) return;
    
    try {
      // Ensure the element has an ID
      const mapId = "solar-designer-map";
      mapRef.current.id = mapId;
      
      // First check if a map already exists on this container and clean it up
      if (mapRef.current._leaflet_id) {
        console.log("Container already has Leaflet ID, cleaning up...");
        delete mapRef.current._leaflet_id;
      }
      
      // Clean up any global reference
      if (window.solarDesignerMap) {
        try {
          window.solarDesignerMap.remove();
        } catch (e) {
          console.warn("Error removing existing map:", e);
        }
        window.solarDesignerMap = undefined;
      }
      
      // Also check and clean up existing map instance
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
        } catch (e) {
          console.warn("Error removing existing leaflet map reference:", e);
        }
        leafletMapRef.current = null;
      }
      
      // Wait for DOM to be fully ready
      const initMapTimeout = setTimeout(() => {
        // Double-check the element still exists and has no _leaflet_id
        const mapElement = document.getElementById(mapId);
        if (!mapElement) {
          throw new Error("Map container element not found");
        }
        
        if (mapElement._leaflet_id) {
          console.warn("Element still has _leaflet_id before initialization, cleaning up again");
          delete mapElement._leaflet_id;
        }
        
        try {
          // Create map instance with a clean container
          const map = L.map(mapId, {
            center: [37.7749, -122.4194], // Default to San Francisco
            zoom: 13, // Start with a lower zoom level for stability
            zoomControl: true,
            attributionControl: true,
          });
          
          // Add OpenStreetMap tile layer
          const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
          });
          
          streetLayer.addTo(map);
          
          // Add satellite view option
          const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 19
          });
          
          // Add layer control
          const baseMaps = {
            "Street": streetLayer,
            "Satellite": satelliteLayer
          };
          
          L.control.layers(baseMaps).addTo(map);
          
          // Make map instance available globally
          window.solarDesignerMap = map;
          leafletMapRef.current = map;
          
          // Force a map size update after it's fully loaded
          map.invalidateSize(true);
          
          // Let the parent component know the map is ready
          console.log("Map initialized successfully");
          onMapLoaded();
        } catch (mapError) {
          console.error("Error creating map:", mapError);
          onMapError(mapError instanceof Error ? mapError.message : "Failed to create map");
        }
      }, 1000); // Increased timeout for stability
      
      // Cleanup function for this effect
      return () => {
        clearTimeout(initMapTimeout);
        
        // Clean up map instances
        if (leafletMapRef.current) {
          try {
            leafletMapRef.current.remove();
          } catch (e) {
            console.warn("Error removing map during cleanup:", e);
          }
          leafletMapRef.current = null;
        }
        
        if (window.solarDesignerMap) {
          try {
            window.solarDesignerMap.remove();
          } catch (e) {
            console.warn("Error removing global map during cleanup:", e);
          }
          window.solarDesignerMap = undefined;
        }
      };
      
    } catch (error) {
      console.error("Error initializing map:", error);
      onMapError(error instanceof Error ? error.message : "Failed to initialize map");
    }
  }, [mapRef, onMapLoaded, onMapError]);
  
  return null; // No visible component, just functionality
};
