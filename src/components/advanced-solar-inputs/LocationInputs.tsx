
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, RotateCw, Search, Settings, Loader2, Database, Building, Home, Thermometer, Zap, Globe, Wind } from "lucide-react";
import { toast } from "sonner";
import AlbedoSelector from "@/components/AlbedoSelector";
import { useGoogleMapsScript } from "../advanced-solar-calculator/area-calculator/hooks/useGoogleMapsScript";

type SoilType = "saturated_clay" | "clay" | "loam" | "moist_sand" | "dry_sand" | "rock";

interface LocationInputsProps {
  projectName: string;
  setProjectName: (name: string) => void;
  latitude: number;
  longitude: number;
  timezone: string;
  country: string;
  city: string;
  albedo?: number;
  surfaceType?: string;
  soilType?: SoilType;
  meteoDataSource?: string;
  projectApplication?: string;
  projectInstallation?: string;
  lowestTemperature?: number;
  highestTemperature?: number;
  setLatitude: (lat: number) => void;
  setLongitude: (lng: number) => void;
  setTimezone: (timezone: string) => void;
  setCountry: (country: string) => void;
  setCity: (city: string) => void;
  setAlbedo?: (albedo: number, surfaceType?: string) => void;
  setSoilType?: (soilType: SoilType) => void;
  setMeteoDataSource?: (source: string) => void;
  setProjectApplication?: (application: string) => void;
  setProjectInstallation?: (installation: string) => void;
  setLowestTemperature?: (temp: number) => void;
  setHighestTemperature?: (temp: number) => void;
}

const LocationInputs: React.FC<LocationInputsProps> = ({
  projectName,
  setProjectName,
  latitude,
  longitude,
  timezone,
  country,
  city,
  albedo = 0.2,
  surfaceType,
  soilType = "loam",
  meteoDataSource = "nsrdb",
  projectApplication = "Residential",
  projectInstallation = "ground-mount",
  lowestTemperature = -10,
  highestTemperature = 70,
  setLatitude,
  setLongitude,
  setTimezone,
  setCountry,
  setCity,
  setAlbedo,
  setSoilType,
  setMeteoDataSource,
  setProjectApplication,
  setProjectInstallation,
  setLowestTemperature,
  setHighestTemperature,
}) => {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Get Google Maps API key and script status
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
  const scriptStatus = useGoogleMapsScript(apiKey);

  // Initialize location details on component mount
  useEffect(() => {
    if (latitude && longitude) {
      // Auto-fetch location details for initial coordinates
      fetchLocationDetailsForCoords(latitude, longitude);
    }
  }, []); // Empty dependency array - only run on mount

  // Initialize the map when script is ready
  useEffect(() => {
    if (!mapRef.current || map || scriptStatus !== 'ready') return;

    const initMap = () => {
      try {
        const googleMap = new google.maps.Map(mapRef.current!, {
          center: { lat: latitude, lng: longitude },
          zoom: 18,
          mapTypeId: google.maps.MapTypeId.SATELLITE,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_CENTER,
          },
          zoomControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });

        // Create marker
        const mapMarker = new google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map: googleMap,
          title: "Selected Location",
          draggable: true,
        });

        // Add click listener to map
        googleMap.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            updateLocation(lat, lng);
          }
        });

        // Add drag listener to marker
        mapMarker.addListener("dragend", (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            updateLocation(lat, lng);
          }
        });

        setMap(googleMap);
        setMarker(mapMarker);
        
        console.log("Location overview map initialized successfully");
      } catch (error) {
        console.error("Error initializing location overview map:", error);
        toast.error("Failed to initialize map. Please check your Google Maps API key.");
      }
    };

    // Initialize map with a small delay to ensure DOM is ready
    setTimeout(initMap, 100);
  }, [latitude, longitude, scriptStatus]); // Include script status in dependencies

  // Update map center and marker when coordinates change externally
  useEffect(() => {
    if (map && marker) {
      const newPosition = { lat: latitude, lng: longitude };
      map.setCenter(newPosition);
      marker.setPosition(newPosition);
    }
  }, [latitude, longitude, map, marker]);

  // Function to update location and fetch details
  const updateLocation = useCallback((lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    
    // Auto-fetch location details
    fetchLocationDetailsForCoords(lat, lng);
  }, [setLatitude, setLongitude]);

  // Function to fetch timezone using Google Maps Timezone API
  const fetchTimezone = async (lat: number, lng: number): Promise<string | null> => {
    try {
      // Get Google Maps API key from environment variables
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.warn('Google Maps API key not found in environment variables');
        return null;
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${apiKey}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK' && data.timeZoneId) {
          console.log(`Timezone fetched successfully: ${data.timeZoneId}`);
          return data.timeZoneId;
        } else {
          console.warn('Google Timezone API returned error:', data.status, data.errorMessage);
        }
      } else {
        console.warn('Failed to fetch timezone:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching timezone from Google:', error);
    }
    
    return null;
  };

  // Function to fetch location details from coordinates
  const fetchLocationDetailsForCoords = async (lat: number, lng: number) => {
    setIsLoadingLocation(true);
    try {
      // Fetch timezone first using Google's API
      const googleTimezone = await fetchTimezone(lat, lng);
      if (googleTimezone) {
        setTimezone(googleTimezone);
      } else {
        // Fallback 1: Use browser timezone detection
        try {
          const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          console.log(`Using browser timezone as fallback: ${browserTimezone}`);
          setTimezone(browserTimezone);
        } catch (browserError) {
          // Fallback 2: Estimate timezone based on longitude
          console.log('Browser timezone detection failed, using longitude estimation');
          estimateTimezone(lng);
        }
      }

      // Using Nominatim reverse geocoding API (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
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

  // Function to fetch location details from current coordinates
  const fetchLocationDetails = async () => {
    if (!latitude || !longitude) {
      toast.error("Please enter valid latitude and longitude values");
      return;
    }
    
    await fetchLocationDetailsForCoords(latitude, longitude);
  };
  
  // Improved timezone estimation based on longitude with common timezone mappings
  const estimateTimezone = (longitude: number) => {
    // More accurate timezone estimation based on longitude ranges
    // This is still a rough approximation but better than pure GMT offsets
    
    if (longitude >= -180 && longitude < -165) {
      setTimezone("Pacific/Honolulu"); // UTC-10
    } else if (longitude >= -165 && longitude < -135) {
      setTimezone("America/Anchorage"); // UTC-9
    } else if (longitude >= -135 && longitude < -120) {
      setTimezone("America/Los_Angeles"); // UTC-8
    } else if (longitude >= -120 && longitude < -105) {
      setTimezone("America/Denver"); // UTC-7
    } else if (longitude >= -105 && longitude < -90) {
      setTimezone("America/Chicago"); // UTC-6
    } else if (longitude >= -90 && longitude < -75) {
      setTimezone("America/New_York"); // UTC-5 (covers NYC area)
    } else if (longitude >= -75 && longitude < -60) {
      setTimezone("America/Halifax"); // UTC-4
    } else if (longitude >= -60 && longitude < -45) {
      setTimezone("America/Sao_Paulo"); // UTC-3
    } else if (longitude >= -45 && longitude < -15) {
      setTimezone("Atlantic/Azores"); // UTC-1
    } else if (longitude >= -15 && longitude < 15) {
      setTimezone("Europe/London"); // UTC+0
    } else if (longitude >= 15 && longitude < 30) {
      setTimezone("Europe/Berlin"); // UTC+1
    } else if (longitude >= 30 && longitude < 45) {
      setTimezone("Europe/Athens"); // UTC+2
    } else if (longitude >= 45 && longitude < 60) {
      setTimezone("Europe/Moscow"); // UTC+3
    } else if (longitude >= 60 && longitude < 75) {
      setTimezone("Asia/Dubai"); // UTC+4
    } else if (longitude >= 75 && longitude < 90) {
      setTimezone("Asia/Karachi"); // UTC+5
    } else if (longitude >= 90 && longitude < 105) {
      setTimezone("Asia/Dhaka"); // UTC+6
    } else if (longitude >= 105 && longitude < 120) {
      setTimezone("Asia/Bangkok"); // UTC+7
    } else if (longitude >= 120 && longitude < 135) {
      setTimezone("Asia/Shanghai"); // UTC+8
    } else if (longitude >= 135 && longitude < 150) {
      setTimezone("Asia/Tokyo"); // UTC+9
    } else if (longitude >= 150 && longitude < 165) {
      setTimezone("Australia/Sydney"); // UTC+10
    } else {
      setTimezone("Pacific/Auckland"); // UTC+12
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Name Section - Modern Card */}
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
        <div className="relative bg-white/90 backdrop-blur-xl p-6 rounded-lg border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg blur-md opacity-50"></div>
              <div className="relative p-3 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg shadow-lg">
                <Building className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-rose-700 bg-clip-text text-transparent">
                Project Information
              </h3>
              <p className="text-sm text-slate-600">Name your solar project</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
              Project Name *
            </Label>
            <div className="relative group/input">
              <Input
                id="project-name"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Solar Project 2025, Main Street Installation"
                className="h-11 border-2 border-slate-200/70 bg-white/70 backdrop-blur-sm hover:border-purple-400 focus:ring-2 focus:ring-purple-500/20 rounded-lg transition-all duration-300 hover:shadow-lg font-medium"
                required
              />
              {!projectName && (
                <p className="text-xs text-red-500 mt-1">Project name is required to continue</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Coordinates Section - Modern Card */}
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
        <div className="relative bg-white/90 backdrop-blur-xl p-6 rounded-lg border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg blur-md opacity-50"></div>
              <div className="relative p-3 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg shadow-lg">
                <MapPin className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
                Geographic Coordinates
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">Pinpoint your installation location</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude" className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                Latitude (°)
              </Label>
              <div className="relative group/input">
                <Input
                  id="latitude"
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                  placeholder="e.g., 40.7128"
                  className="border-2 border-blue-200/50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 bg-white/70 backdrop-blur-sm rounded-lg transition-all duration-300 hover:border-blue-300 hover:shadow-lg group-hover/input:bg-white font-medium"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/input:opacity-100 transition-opacity">
                  <MapPin className="h-4 w-4 text-blue-500" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude" className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500"></div>
                Longitude (°)
              </Label>
              <div className="relative group/input">
                <Input
                  id="longitude"
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                  placeholder="e.g., -74.0060"
                  className="border-2 border-cyan-200/50 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:border-cyan-500 bg-white/70 backdrop-blur-sm rounded-lg transition-all duration-300 hover:border-cyan-300 hover:shadow-lg group-hover/input:bg-white font-medium"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/input:opacity-100 transition-opacity">
                  <Globe className="h-4 w-4 text-cyan-500" />
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={fetchLocationDetails} 
            disabled={isLoadingLocation}
            className="w-full mt-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group/btn h-11 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
            {isLoadingLocation ? (
              <div className="flex items-center gap-2">
                <RotateCw className="h-4 w-4 animate-spin" />
                <span>Fetching location data...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span>Get Location Details</span>
                <Zap className="h-4 w-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Google Maps Overview - Futuristic Design */}
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-600 via-gray-500 to-slate-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <div className="relative bg-white/90 backdrop-blur-xl p-6 rounded-lg border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-700 to-gray-600 rounded-lg blur-md opacity-50"></div>
              <div className="relative p-3 bg-gradient-to-br from-slate-700 to-gray-600 rounded-lg shadow-lg">
                <Globe className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 via-gray-700 to-slate-700 bg-clip-text text-transparent">
                Location Overview
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">Interactive satellite view</p>
            </div>
          </div>
          
          <div className="border-2 border-slate-200/50 rounded-lg overflow-hidden shadow-2xl bg-gradient-to-br from-slate-50 to-gray-100 relative">
            {/* Show loading state while script is loading */}
            {scriptStatus === 'loading' && (
              <div className="w-full h-96 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                  <div className="relative p-6 bg-white rounded-full shadow-2xl">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                  </div>
                </div>
                <p className="text-slate-700 font-bold mt-6 text-lg">Loading Google Maps...</p>
                <p className="text-slate-400 text-sm mt-2">Initializing satellite view</p>
              </div>
            )}
            
            {/* Show error state if script failed to load */}
            {scriptStatus === 'error' && (
              <div className="w-full h-96 flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full blur-xl opacity-20"></div>
                  <div className="relative p-6 bg-white rounded-full shadow-2xl">
                    <MapPin className="h-10 w-10 text-red-600" />
                  </div>
                </div>
                <p className="text-red-700 font-bold text-lg mt-6">Failed to load Google Maps</p>
                <p className="text-red-500 text-sm mt-2">Please check your API key configuration</p>
              </div>
            )}
            
            {/* Show missing API key error */}
            {!apiKey && (
              <div className="w-full h-96 flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur-xl opacity-20"></div>
                  <div className="relative p-6 bg-white rounded-full shadow-2xl">
                    <Settings className="h-10 w-10 text-amber-600" />
                  </div>
                </div>
                <p className="text-amber-800 font-bold text-lg mt-6">Google Maps API Key Missing</p>
                <p className="text-amber-600 text-sm mt-2">Add VITE_GOOGLE_MAPS_API_KEY to your .env file</p>
              </div>
            )}
            
            {/* Render map when script is ready */}
            {scriptStatus === 'ready' && apiKey && (
              <div 
                ref={mapRef} 
                className="w-full h-96"
              />
            )}
          </div>
          
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 via-cyan-50 to-teal-50 rounded-lg border border-blue-200/50 shadow-inner">
            <p className="text-sm text-slate-700 font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse"></div>
              {scriptStatus === 'ready' ? 
                "Click on the map or drag the marker to select a new location" :
                "Map will be available once Google Maps API loads successfully"
              }
            </p>
          </div>
        </div>
      </div>
      
      {/* Location Details Section - Modern Glass Card */}
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
        <div className="relative bg-white/90 backdrop-blur-xl p-6 rounded-lg border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-lg blur-md opacity-50"></div>
              <div className="relative p-3 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-lg shadow-lg">
                <Globe className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-700 via-teal-600 to-green-600 bg-clip-text text-transparent">
                Location Details
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">Timezone and address information</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone" className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                Timezone
              </Label>
              <div className="relative group/input">
                <Input
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="e.g., America/New_York"
                  className="border-2 border-emerald-200/50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 bg-white/70 backdrop-blur-sm rounded-lg transition-all duration-300 hover:border-emerald-300 hover:shadow-lg group-hover/input:bg-white font-medium"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/input:opacity-100 transition-opacity">
                  <Settings className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country" className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-teal-500 to-green-500"></div>
                  Country
                </Label>
                <div className="relative group/input">
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="border-2 border-teal-200/50 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-500 bg-white/70 backdrop-blur-sm rounded-lg transition-all duration-300 hover:border-teal-300 hover:shadow-lg group-hover/input:bg-white font-medium"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/input:opacity-100 transition-opacity">
                    <Globe className="h-4 w-4 text-teal-500" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                  City
                </Label>
                <div className="relative group/input">
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="border-2 border-green-200/50 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500 bg-white/70 backdrop-blur-sm rounded-lg transition-all duration-300 hover:border-green-300 hover:shadow-lg group-hover/input:bg-white font-medium"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/input:opacity-100 transition-opacity">
                    <MapPin className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meteo Data Source Selection - Futuristic Card */}
      {setMeteoDataSource && (
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
          <div className="relative bg-white/90 backdrop-blur-xl p-6 rounded-lg border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg blur-md opacity-50"></div>
                <div className="relative p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-lg">
                  <Database className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-violet-700 bg-clip-text text-transparent">
                  Meteorological Data Source
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">Solar radiation and weather data</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="meteoDataSource" className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                Data Source Selection
              </Label>
              <Select value={meteoDataSource} onValueChange={setMeteoDataSource}>
                <SelectTrigger className="border-2 border-indigo-200/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/70 backdrop-blur-sm rounded-lg transition-all duration-300 hover:border-indigo-300 hover:shadow-lg h-12 font-medium">
                  <SelectValue placeholder="Select meteo data source" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-2">
                  <SelectItem value="nsrdb" className="rounded-lg">NSRDB - Gridded TMY data from NREL National Solar Radiation Database</SelectItem>
                  <SelectItem value="tmy2" className="rounded-lg">TMY2 - TMY2 station data (1961-1990 Archive)</SelectItem>
                  <SelectItem value="tmy3" className="rounded-lg">TMY3 - TMY3 station data (1991-2005 Archive)</SelectItem>
                  <SelectItem value="intl" className="rounded-lg">International - PVWatts International station data</SelectItem>
                </SelectContent>
              </Select>
              <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-violet-50 rounded-lg border border-indigo-200/50 shadow-inner">
                <p className="text-xs text-slate-700 font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse"></div>
                  Select the meteorological dataset for solar radiation and weather data
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Type Details - Modern Design */}
      {setProjectApplication && setProjectInstallation && (
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
          <div className="relative bg-white/90 backdrop-blur-xl p-6 rounded-lg border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-500 rounded-lg blur-md opacity-50"></div>
                <div className="relative p-3 bg-gradient-to-br from-orange-600 to-amber-500 rounded-lg shadow-lg">
                  <Building className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-orange-700 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                  Project Details
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">Application and installation type</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project Application */}
              <div className="space-y-2">
                <Label htmlFor="projectApplication" className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"></div>
                  Project Application
                </Label>
                <Select value={projectApplication} onValueChange={setProjectApplication}>
                  <SelectTrigger className="border-2 border-orange-200/50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/70 backdrop-blur-sm rounded-lg transition-all duration-300 hover:border-orange-300 hover:shadow-lg h-12 font-medium">
                    <SelectValue placeholder="Select application type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-2">
                    <SelectItem value="Residential" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        <span>Residential</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Commercial" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>Commercial</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Industrial" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span>Industrial</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Utility Scale" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        <span>Utility Scale</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Project Installation */}
              <div className="space-y-2">
                <Label htmlFor="projectInstallation" className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500"></div>
                  Installation Type
                </Label>
                <Select value={projectInstallation} onValueChange={setProjectInstallation}>
                  <SelectTrigger className="border-2 border-amber-200/50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white/70 backdrop-blur-sm rounded-lg transition-all duration-300 hover:border-amber-300 hover:shadow-lg h-12 font-medium">
                    <SelectValue placeholder="Select installation type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-2">
                    <SelectItem value="Flat roof" className="rounded-lg">Flat roof</SelectItem>
                    <SelectItem value="Shed roof" className="rounded-lg">Shed roof</SelectItem>
                    <SelectItem value="ground-mount" className="rounded-lg">Ground-mount</SelectItem>
                    <SelectItem value="carport" className="rounded-lg">Carport</SelectItem>
                    <SelectItem value="canopy" className="rounded-lg">Canopy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Temperature Parameters - Ultra Modern Card */}
      {setLowestTemperature && setHighestTemperature && (
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
          <div className="relative bg-white/90 backdrop-blur-xl p-6 rounded-lg border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-pink-600 rounded-lg blur-md opacity-50"></div>
                <div className="relative p-3 bg-gradient-to-br from-rose-600 to-pink-600 rounded-lg shadow-lg">
                  <Thermometer className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-rose-700 via-pink-700 to-fuchsia-700 bg-clip-text text-transparent">
                  Temperature Parameters
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">Ambient temperature for string sizing</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lowest Temperature */}
              <div className="space-y-2">
                <Label htmlFor="lowestTemperature" className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                  Lowest Temperature (°C)
                </Label>
                <div className="relative group/input">
                  <Input
                    id="lowestTemperature"
                    type="number"
                    value={lowestTemperature}
                    onChange={(e) => setLowestTemperature(Number(e.target.value))}
                    placeholder="e.g., -10"
                    className="border-2 border-blue-200/50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 bg-white/70 backdrop-blur-sm rounded-lg transition-all duration-300 hover:border-blue-300 hover:shadow-lg group-hover/input:bg-white font-medium"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/input:opacity-100 transition-opacity">
                    <Wind className="h-4 w-4 text-blue-500" />
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200/50 shadow-inner">
                  <p className="text-xs text-slate-700 font-medium flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    Minimum ambient temperature for calculations
                  </p>
                </div>
              </div>

              {/* Highest Temperature */}
              <div className="space-y-2">
                <Label htmlFor="highestTemperature" className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500"></div>
                  Highest Temperature (°C)
                </Label>
                <div className="relative group/input">
                  <Input
                    id="highestTemperature"
                    type="number"
                    value={highestTemperature}
                    onChange={(e) => setHighestTemperature(Number(e.target.value))}
                    placeholder="e.g., 60"
                    className="border-2 border-red-200/50 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:border-red-500 bg-white/70 backdrop-blur-sm rounded-lg transition-all duration-300 hover:border-red-300 hover:shadow-lg group-hover/input:bg-white font-medium"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/input:opacity-100 transition-opacity">
                    <Thermometer className="h-4 w-4 text-red-500" />
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200/50 shadow-inner">
                  <p className="text-xs text-slate-700 font-medium flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    Maximum ambient temperature for calculations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Surface & Soil Parameters Section - Side by Side Modern Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Albedo Selection Section */}
        {setAlbedo && (
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-lg blur opacity-25 group-hover:opacity-45 transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-xl p-6 rounded-lg border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 h-full">
              <AlbedoSelector
                selectedAlbedo={albedo}
                onAlbedoChange={setAlbedo}
              />
            </div>
          </div>
        )}

        {/* Soil Type Selection Section */}
        {setSoilType && (
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 rounded-lg blur opacity-25 group-hover:opacity-45 transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-xl p-6 rounded-lg border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-500 rounded-lg blur-md opacity-50"></div>
                  <div className="relative p-3 bg-gradient-to-br from-amber-600 to-orange-500 rounded-lg shadow-lg">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-amber-700 via-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    Soil Type Selection
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">For earthing resistance calculations</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="soilType" className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
                  Soil Type for Earthing Calculations
                </Label>
                <Select value={soilType} onValueChange={setSoilType}>
                  <SelectTrigger className="border-2 border-amber-200/50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white/70 backdrop-blur-sm rounded-lg transition-all duration-300 hover:border-amber-300 hover:shadow-lg h-12 font-medium">
                    <SelectValue placeholder="Select soil type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-2">
                    <SelectItem value="saturated_clay" className="rounded-lg">Saturated Clay</SelectItem>
                    <SelectItem value="clay" className="rounded-lg">Clay</SelectItem>
                    <SelectItem value="loam" className="rounded-lg">Loam (Default)</SelectItem>
                    <SelectItem value="moist_sand" className="rounded-lg">Moist Sand</SelectItem>
                    <SelectItem value="dry_sand" className="rounded-lg">Dry Sand</SelectItem>
                    <SelectItem value="rock" className="rounded-lg">Rock</SelectItem>
                  </SelectContent>
                </Select>
                <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200/50 shadow-inner">
                  <p className="text-xs text-slate-700 font-medium flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                    Soil type affects earthing resistance for electrical safety
                  </p>
                </div>

                {/* Soil Resistance Values Table - Modern Compact Design */}
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Soil Resistivity Reference
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { type: "Saturated Clay", range: "20-50 Ω⋅m", color: "from-blue-500 to-cyan-500", textColor: "text-blue-700", selected: soilType === "saturated_clay" },
                      { type: "Clay", range: "50-200 Ω⋅m", color: "from-cyan-500 to-teal-500", textColor: "text-cyan-700", selected: soilType === "clay" },
                      { type: "Loam", range: "100-300 Ω⋅m", color: "from-green-500 to-emerald-500", textColor: "text-green-700", selected: soilType === "loam" },
                      { type: "Moist Sand", range: "200-1K Ω⋅m", color: "from-yellow-500 to-amber-500", textColor: "text-yellow-700", selected: soilType === "moist_sand" },
                      { type: "Dry Sand", range: "1-5K Ω⋅m", color: "from-orange-500 to-red-500", textColor: "text-orange-700", selected: soilType === "dry_sand" },
                      { type: "Rock", range: "5-50K Ω⋅m", color: "from-red-500 to-rose-500", textColor: "text-red-700", selected: soilType === "rock" }
                    ].map((soil) => (
                      <div
                        key={soil.type}
                        className={`
                          relative p-3 rounded-lg border-2 transition-all duration-300 overflow-hidden group/soil
                          ${soil.selected 
                            ? 'border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-lg scale-105' 
                            : 'border-slate-200/50 bg-white/60 hover:border-slate-300 hover:shadow-md hover:scale-[1.02]'
                          }
                        `}
                      >
                        {soil.selected && (
                          <div className={`absolute inset-0 bg-gradient-to-r ${soil.color} opacity-5`}></div>
                        )}
                        <div className="relative flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${soil.color} ${soil.selected ? 'shadow-lg' : 'opacity-60'} transition-all duration-300`}></div>
                            <span className={`text-xs font-bold ${soil.selected ? 'text-amber-900' : 'text-slate-600'}`}>{soil.type}</span>
                          </div>
                          <div className={`text-xs font-mono font-bold px-2 py-1 rounded-lg ${soil.selected ? 'bg-white/90 text-amber-700 shadow-sm' : 'bg-slate-100/80 text-slate-500'}`}>
                            {soil.range}
                          </div>
                        </div>
                        {soil.selected && (
                          <div className="mt-2 text-[10px] font-semibold text-amber-700 bg-amber-100/80 p-2 rounded-lg border border-amber-300/50">
                            ✓ Selected for earthing calculations
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationInputs;
