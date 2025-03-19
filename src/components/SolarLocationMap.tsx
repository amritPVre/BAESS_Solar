
import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface SolarLocationMapProps {
  location: { lat: number; lng: number };
}

const SolarLocationMap: React.FC<SolarLocationMapProps> = ({ location }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapId = "solar-location-map";
  
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Ensure the map container has an ID
    mapContainerRef.current.id = mapId;
    
    // Check if there's already a Leaflet instance on this container
    const mapContainer = document.getElementById(mapId);
    if (mapContainer && mapContainer._leaflet_id) {
      console.log("Container already has Leaflet instance, cleaning up...");
      delete mapContainer._leaflet_id;
    }
    
    // Clean up any existing map instance
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    
    // Initialize the map
    const map = L.map(mapId, {
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
    }, 100);
    
    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [location]);
  
  return (
    <div className="w-full h-full min-h-[300px] rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <div 
        ref={mapContainerRef}
        id={mapId}
        className="w-full h-full min-h-[300px]"
      />
    </div>
  );
};

export default SolarLocationMap;
