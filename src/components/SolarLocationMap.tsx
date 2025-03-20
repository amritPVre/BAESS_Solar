
import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface SolarLocationMapProps {
  location: { lat: number; lng: number };
}

const SolarLocationMap: React.FC<SolarLocationMapProps> = ({ location }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapId = useRef(`solar-location-map-${Math.random().toString(36).substring(2, 9)}`);
  
  useEffect(() => {
    if (!mapContainerRef.current) {
      console.error("Map container ref is null");
      return;
    }
    
    // Ensure the map container has a unique ID
    const uniqueMapId = mapId.current;
    mapContainerRef.current.id = uniqueMapId;
    console.log(`Initializing location map with ID: ${uniqueMapId}`);
    
    // Check if there's already a Leaflet instance on this container
    if (mapContainerRef.current._leaflet_id) {
      console.log(`Container already has Leaflet instance (ID: ${mapContainerRef.current._leaflet_id}), cleaning up...`);
      delete mapContainerRef.current._leaflet_id;
    }
    
    // Clean up any existing map instance
    if (mapRef.current) {
      try {
        mapRef.current.remove();
        mapRef.current = null;
      } catch (e) {
        console.warn("Error removing existing map:", e);
      }
    }
    
    // Wait for DOM to stabilize before initializing
    const initTimeout = setTimeout(() => {
      try {
        // Check if the element exists in the DOM
        const mapElement = document.getElementById(uniqueMapId);
        if (!mapElement) {
          console.error("Map container element not found in DOM");
          return;
        }
        
        // Double check for any leftover _leaflet_id
        if (mapElement._leaflet_id) {
          console.warn(`Element still has _leaflet_id (${mapElement._leaflet_id}) before initialization, cleaning up again`);
          delete mapElement._leaflet_id;
        }
        
        console.log("Creating new location map instance");
        
        // Create new map instance
        const map = L.map(uniqueMapId, {
          center: { lat: location.lat, lng: location.lng },
          zoom: 15,
          zoomControl: true,
          attributionControl: true,
        });
        
        mapRef.current = map;
        
        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map);
        
        // Add a marker at the location
        L.marker({ lat: location.lat, lng: location.lng })
          .addTo(map)
          .bindPopup('Solar Installation Location')
          .openPopup();
        
        // Force a resize to ensure the map renders correctly
        setTimeout(() => {
          map.invalidateSize(true);
          console.log("Location map initialized successfully");
        }, 300);
      } catch (error) {
        console.error("Error initializing location map:", error);
      }
    }, 500);
    
    // Cleanup function
    return () => {
      clearTimeout(initTimeout);
      if (mapRef.current) {
        try {
          mapRef.current.remove();
          mapRef.current = null;
        } catch (e) {
          console.warn("Error removing map during cleanup:", e);
        }
      }
    };
  }, [location]);
  
  return (
    <div className="w-full h-full min-h-[300px] rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <div 
        ref={mapContainerRef}
        className="w-full h-full min-h-[300px]"
      />
    </div>
  );
};

export default SolarLocationMap;
