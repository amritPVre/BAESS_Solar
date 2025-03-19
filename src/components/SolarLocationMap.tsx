
import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface SolarLocationMapProps {
  location: { lat: number; lng: number };
}

const SolarLocationMap: React.FC<SolarLocationMapProps> = ({ location }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Initialize the map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current.id, {
        center: { lat: location.lat, lng: location.lng },
        zoom: 15,
        zoomControl: true,
        attributionControl: true,
      });
      
      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(mapRef.current);
      
      // Add a marker at the location
      L.marker({ lat: location.lat, lng: location.lng })
        .addTo(mapRef.current)
        .bindPopup('Solar Installation Location')
        .openPopup();
    } else {
      // Update the map view and marker if it already exists
      mapRef.current.setView({ lat: location.lat, lng: location.lng }, 15);
      
      // Clear existing markers and add a new one
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapRef.current?.removeLayer(layer);
        }
      });
      
      L.marker({ lat: location.lat, lng: location.lng })
        .addTo(mapRef.current)
        .bindPopup('Solar Installation Location')
        .openPopup();
    }
    
    // Ensure the map container has an ID
    if (!mapContainerRef.current.id) {
      mapContainerRef.current.id = 'solar-location-map';
    }
    
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
        id="solar-location-map"
        className="w-full h-full min-h-[300px]"
      />
    </div>
  );
};

export default SolarLocationMap;
