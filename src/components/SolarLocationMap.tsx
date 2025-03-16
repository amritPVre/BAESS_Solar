
import React, { useEffect, useRef } from 'react';

interface SolarLocationMapProps {
  location: { lat: number; lng: number };
}

const SolarLocationMap: React.FC<SolarLocationMapProps> = ({ location }) => {
  const mapRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    // This is a simple implementation using Google Maps embed
    // For a more interactive map, you would use a proper mapping library like Mapbox or Leaflet
  }, [location]);
  
  const mapUrl = `https://maps.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`;
  
  return (
    <iframe 
      ref={mapRef}
      src={mapUrl}
      width="100%" 
      height="100%" 
      style={{ border: 0 }} 
      loading="lazy"
      title="Solar Installation Location"
    />
  );
};

export default SolarLocationMap;
