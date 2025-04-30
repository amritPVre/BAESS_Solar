
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, RotateCw, Search, Settings } from "lucide-react";
import { toast } from "sonner";

interface LocationInputsProps {
  latitude: number;
  longitude: number;
  timezone: string;
  country: string;
  city: string;
  setLatitude: (lat: number) => void;
  setLongitude: (lng: number) => void;
  setTimezone: (timezone: string) => void;
  setCountry: (country: string) => void;
  setCity: (city: string) => void;
}

const LocationInputs: React.FC<LocationInputsProps> = ({
  latitude,
  longitude,
  timezone,
  country,
  city,
  setLatitude,
  setLongitude,
  setTimezone,
  setCountry,
  setCity,
}) => {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Function to fetch location details from coordinates
  const fetchLocationDetails = async () => {
    if (!latitude || !longitude) {
      toast.error("Please enter valid latitude and longitude values");
      return;
    }
    
    setIsLoadingLocation(true);
    try {
      // Using Nominatim reverse geocoding API (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch location data");
      }
      
      const data = await response.json();
      
      if (data && data.address) {
        // Extract country name
        const countryName = data.address.country;
        if (countryName) {
          setCountry(countryName);
        }
        
        // Extract city/town/village name (whichever is available)
        const cityName = data.address.city || data.address.town || data.address.village || data.address.county;
        if (cityName) {
          setCity(cityName);
        }
        
        // Try to get the timezone based on coordinates
        try {
          const tzResponse = await fetch(
            `https://api.timezonedb.com/v2.1/get-time-zone?key=OG2CGVC047PB&format=json&by=position&lat=${latitude}&lng=${longitude}`
          );
          
          if (tzResponse.ok) {
            const tzData = await tzResponse.json();
            if (tzData.status === "OK" && tzData.zoneName) {
              setTimezone(tzData.zoneName);
            } else {
              // Fallback: Use browser timezone detection
              const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              setTimezone(detectedTimezone);
            }
          } else {
            // Fallback: Estimate timezone based on longitude
            estimateTimezone(longitude);
          }
        } catch (error) {
          console.error("Error fetching timezone:", error);
          // Fallback: Estimate timezone based on longitude
          estimateTimezone(longitude);
        }
        
        toast.success("Location details fetched successfully");
      } else {
        toast.error("No location data found for these coordinates");
      }
    } catch (error) {
      console.error("Error fetching location details:", error);
      toast.error("Failed to fetch location details");
    } finally {
      setIsLoadingLocation(false);
    }
  };
  
  // Rough timezone estimation based on longitude
  const estimateTimezone = (longitude: number) => {
    // Each timezone is roughly 15 degrees wide
    const utcOffset = Math.round(longitude / 15);
    
    // Set a generic timezone string (this is a simplification)
    if (utcOffset === 0) {
      setTimezone("Etc/GMT");
    } else if (utcOffset > 0) {
      setTimezone(`Etc/GMT-${utcOffset}`);
    } else {
      setTimezone(`Etc/GMT+${Math.abs(utcOffset)}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="latitude" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-amber-600" />
            Latitude (°)
          </Label>
          <Input
            id="latitude"
            type="number"
            step="0.0001"
            value={latitude}
            onChange={(e) => setLatitude(Number(e.target.value))}
            placeholder="e.g., 40.7128"
            className="border-amber-200 focus-visible:ring-amber-500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="longitude" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-amber-600" />
            Longitude (°)
          </Label>
          <Input
            id="longitude"
            type="number"
            step="0.0001"
            value={longitude}
            onChange={(e) => setLongitude(Number(e.target.value))}
            placeholder="e.g., -74.0060"
            className="border-amber-200 focus-visible:ring-amber-500"
          />
        </div>
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={fetchLocationDetails} 
        disabled={isLoadingLocation}
        className="w-full border-amber-300 text-amber-700 hover:text-amber-800 hover:bg-amber-100"
      >
        {isLoadingLocation ? (
          <>
            <RotateCw className="h-4 w-4 mr-2 animate-spin" />
            Fetching location data...
          </>
        ) : (
          <>
            <Search className="h-4 w-4 mr-2" />
            Get Location Details
          </>
        )}
      </Button>
      
      <div className="space-y-2">
        <Label htmlFor="timezone" className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-amber-600" />
          Timezone
        </Label>
        <Input
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          placeholder="e.g., America/New_York"
          className="border-amber-200 focus-visible:ring-amber-500"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-amber-600" />
            Country
          </Label>
          <Input
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="border-amber-200 focus-visible:ring-amber-500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-amber-600" />
            City
          </Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="border-amber-200 focus-visible:ring-amber-500"
          />
        </div>
      </div>
    </div>
  );
};

export default LocationInputs;
