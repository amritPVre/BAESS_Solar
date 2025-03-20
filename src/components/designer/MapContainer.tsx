
import React, { useEffect, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";

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
  const initAttemptsRef = useRef(0);
  const maxInitAttempts = 3;

  // Load OpenStreetMap and initialize map
  useEffect(() => {
    if (!mapRef.current) {
      console.error("Map container ref is null");
      return;
    }
    
    // Assign a unique ID to the map element if it doesn't have one
    const mapId = mapRef.current.id || "solar-designer-map";
    mapRef.current.id = mapId;
    
    console.log(`Preparing to initialize map with ID: ${mapId}`);
    
    // Clean up function
    const cleanupMap = () => {
      console.log("Cleaning up map instance");
      
      // Clean up any global reference
      if (window.solarDesignerMap) {
        try {
          window.solarDesignerMap.remove();
          window.solarDesignerMap = undefined;
        } catch (e) {
          console.warn("Error removing global map:", e);
        }
      }
      
      // Clean up local reference
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
        } catch (e) {
          console.warn("Error removing local map reference:", e);
        }
      }
      
      // Clean up element's leaflet ID if it exists
      if (mapRef.current && mapRef.current._leaflet_id) {
        console.log("Cleaning up element's Leaflet ID");
        delete mapRef.current._leaflet_id;
      }
    };
    
    // Always clean up first
    cleanupMap();
    
    // Initialize map with retry logic
    const initializeMap = () => {
      initAttemptsRef.current += 1;
      console.log(`Attempt ${initAttemptsRef.current} to initialize map`);
      
      if (initAttemptsRef.current > maxInitAttempts) {
        const errorMsg = `Failed to initialize map after ${maxInitAttempts} attempts`;
        console.error(errorMsg);
        onMapError(errorMsg);
        return;
      }
      
      try {
        // Check that the element exists in the DOM by ID
        const mapElement = document.getElementById(mapId);
        if (!mapElement) {
          console.error(`Map element with ID ${mapId} not found in DOM`);
          
          // Retry after a delay
          setTimeout(initializeMap, 1000);
          return;
        }
        
        // Double-check for existing Leaflet instance
        if (mapElement._leaflet_id) {
          console.warn(`Element already has _leaflet_id: ${mapElement._leaflet_id}, cleaning up`);
          delete mapElement._leaflet_id;
        }
        
        console.log("Creating new Leaflet map instance");
        
        // Create map instance
        const map = L.map(mapId, {
          center: [37.7749, -122.4194], // Default to San Francisco
          zoom: 13,
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
        
        // Force a map size update
        setTimeout(() => {
          map.invalidateSize(true);
          console.log("Map initialized successfully");
          onMapLoaded();
        }, 500);
        
      } catch (mapError) {
        console.error("Error creating map:", mapError);
        
        // Retry initialization after delay if it's not the last attempt
        if (initAttemptsRef.current < maxInitAttempts) {
          setTimeout(initializeMap, 1000);
        } else {
          onMapError(mapError instanceof Error ? mapError.message : "Failed to create map");
        }
      }
    };
    
    // Start initialization with a small delay to ensure DOM is ready
    const initTimeout = setTimeout(initializeMap, 500);
    
    // Cleanup function for this effect
    return () => {
      clearTimeout(initTimeout);
      cleanupMap();
    };
    
  }, [mapRef, onMapLoaded, onMapError]);
  
  return null; // No visible component, just functionality
};
