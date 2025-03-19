
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
      
      // First check if a map already exists and remove it
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      
      // Also check global reference and clear it
      if (window.solarDesignerMap) {
        window.solarDesignerMap.remove();
        window.solarDesignerMap = undefined;
      }
      
      // Check if there's already a Leaflet instance on this container
      const mapContainer = document.getElementById(mapId);
      if (mapContainer && mapContainer._leaflet_id) {
        // If the container has a _leaflet_id, it means Leaflet is already initialized on it
        console.log("Container already has Leaflet instance, cleaning up...");
        delete mapContainer._leaflet_id;
      }
      
      // Wait for DOM to be fully ready
      setTimeout(() => {
        // Double-check the element still exists
        const mapElement = document.getElementById(mapId);
        if (!mapElement) {
          throw new Error("Map container element not found");
        }
        
        // Create map instance
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
      }, 500); // Slightly increased timeout for stability
      
    } catch (error) {
      console.error("Error initializing map:", error);
      onMapError(error instanceof Error ? error.message : "Failed to initialize map");
    }
    
    return () => {
      // Clean up
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      
      if (window.solarDesignerMap) {
        window.solarDesignerMap.remove();
        window.solarDesignerMap = undefined;
      }
    };
  }, [mapRef, onMapLoaded, onMapError]);
  
  return null; // No visible component, just functionality
};
