
import React, { useEffect, useRef } from 'react';

interface SolarLocationMapProps {
  location: { lat: number; lng: number };
}

const SolarLocationMap: React.FC<SolarLocationMapProps> = ({ location }) => {
  const mapRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    // When location changes, we update the map
    // This would be more interactive with a proper mapping library like Mapbox or Leaflet
  }, [location]);
  
  // Build the Google Maps embed URL with the marker at the specified coordinates
  const mapUrl = `https://maps.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`;
  
  return (
    <div className="w-full h-full min-h-[300px] rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <iframe 
        ref={mapRef}
        src={mapUrl}
        width="100%" 
        height="100%" 
        style={{ border: 0, minHeight: '300px' }} 
        loading="lazy"
        title="Solar Installation Location"
        className="w-full h-full"
      />
    </div>
  );
};

export default SolarLocationMap;
