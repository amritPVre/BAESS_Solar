
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
      mapRef.current = L.map(mapContainerRef.current, {
        center: [location.lat, location.lng],
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
      L.marker([location.lat, location.lng])
        .addTo(mapRef.current)
        .bindPopup('Solar Installation Location')
        .openPopup();
    } else {
      // Update the map view and marker if it already exists
      mapRef.current.setView([location.lat, location.lng], 15);
      
      // Clear existing markers and add a new one
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapRef.current?.removeLayer(layer);
        }
      });
      
      L.marker([location.lat, location.lng])
        .addTo(mapRef.current)
        .bindPopup('Solar Installation Location')
        .openPopup();
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
        className="w-full h-full min-h-[300px]"
      />
    </div>
  );
};

export default SolarLocationMap;
