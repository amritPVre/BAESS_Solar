
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MapSearchControlsProps {
  mapLoaded: boolean;
}

export const MapSearchControls: React.FC<MapSearchControlsProps> = ({ mapLoaded }) => {
  const [address, setAddress] = useState("");
  const [searchingAddress, setSearchingAddress] = useState(false);

  const handleSearchAddress = () => {
    if (!address.trim() || !window.solarDesignerMap) return;
    
    setSearchingAddress(true);
    
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      setSearchingAddress(false);
      
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        window.solarDesignerMap.setCenter(location);
        window.solarDesignerMap.setZoom(20); // Zoom in for better detail
        toast.success(`Location found: ${results[0].formatted_address}`);
      } else {
        toast.error(`Could not find location: ${status}`);
      }
    });
  };

  if (!mapLoaded) return null;

  return (
    <div className="absolute top-2 left-2 z-10 bg-white p-2 rounded-md shadow-sm flex gap-2 items-center">
      <input
        id="map-search-input"
        type="text"
        placeholder="Enter location or address"
        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm w-60"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress()}
      />
      <Button 
        size="sm" 
        onClick={handleSearchAddress}
        disabled={searchingAddress}
      >
        {searchingAddress ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : null}
        Search
      </Button>
    </div>
  );
};
