
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

interface MapSearchControlsProps {
  mapLoaded: boolean;
}

export const MapSearchControls: React.FC<MapSearchControlsProps> = ({ mapLoaded }) => {
  const [address, setAddress] = useState("");
  const [searchingAddress, setSearchingAddress] = useState(false);

  const handleSearchAddress = () => {
    if (!address.trim() || !window.solarDesignerMap) {
      toast.error("Please enter a location and ensure the map is loaded");
      return;
    }
    
    setSearchingAddress(true);
    
    // Using Nominatim search API (OpenStreetMap's free geocoding service)
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
      .then(response => response.json())
      .then(data => {
        setSearchingAddress(false);
        
        if (data && data.length > 0) {
          const location = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          };
          
          // Ensure the map is fully initialized
          if (window.solarDesignerMap) {
            // Force map update before setting view
            window.solarDesignerMap.invalidateSize();
            window.solarDesignerMap.setView(location, 19);
            toast.success(`Location found: ${data[0].display_name}`);
          } else {
            toast.error("Map not fully initialized yet");
          }
        } else {
          toast.error("Could not find location");
        }
      })
      .catch(error => {
        console.error("Location search error:", error);
        setSearchingAddress(false);
        toast.error(`Error searching for location: ${error.message}`);
      });
  };

  if (!mapLoaded) return null;

  return (
    <div className="absolute top-2 left-2 z-20 bg-white p-2 rounded-md shadow-sm flex gap-2 items-center">
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
        ) : (
          <Search className="h-4 w-4 mr-1" />
        )}
        Search
      </Button>
    </div>
  );
};
