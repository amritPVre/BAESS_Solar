
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
      // Create map instance
      const map = L.map(mapRef.current.id, {
        center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
        zoom: 19, // Higher zoom level for better detail
        zoomControl: true,
        attributionControl: true,
      });
      
      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);
      
      // Add satellite view option
      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
      });
      
      // Add layer control
      const baseMaps = {
        "Street": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }),
        "Satellite": satelliteLayer
      };
      
      // Add the street layer by default
      baseMaps["Street"].addTo(map);
      
      // Add layer control using the correct namespace syntax
      L.control.layers(baseMaps).addTo(map);
      
      // Make map instance available globally
      window.solarDesignerMap = map as any;
      leafletMapRef.current = map;
      
      // Trigger loaded event
      map.on("load", () => {
        console.log("Leaflet map fully loaded");
        onMapLoaded();
      });
      
      // Fire the load event manually as Leaflet doesn't have a dedicated load event
      setTimeout(() => {
        onMapLoaded();
      }, 500);
      
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
      delete window.solarDesignerMap;
    };
  }, [mapRef, onMapLoaded, onMapError]);
  
  return null; // No visible component, just functionality
};
