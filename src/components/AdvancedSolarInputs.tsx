
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SolarCalculationResult, SolarParams } from "@/types/solarCalculations";
import { calculateSolarEnergy } from "@/utils/solarEnergyCalculation";
import InverterConfiguration from "./InverterConfiguration";
import { InverterParams } from "@/types/solarCalculations";
import SectionHeader from "@/components/ui/SectionHeader";
import { MapPin, Sun, Compass, Ruler, Settings, RotateCw, Search } from "lucide-react";

interface AdvancedSolarInputsProps {
  onCalculationComplete: (results: SolarCalculationResult) => void;
  latitude?: number;
  longitude?: number;
  setLatitude?: (lat: number) => void;
  setLongitude?: (lng: number) => void;
  timezone?: string;
  setTimezone?: (tz: string) => void;
  capacity?: number;
  setCapacity?: (capacity: number) => void;
  country?: string;
  city?: string;
}

const AdvancedSolarInputs: React.FC<AdvancedSolarInputsProps> = ({
  onCalculationComplete,
  latitude: propLatitude,
  longitude: propLongitude,
  setLatitude: propSetLatitude,
  setLongitude: propSetLongitude,
  timezone: propTimezone,
  setTimezone: propSetTimezone,
  capacity: propCapacity,
  setCapacity: propSetCapacity,
  country = "United States",
  city = "New York"
}) => {
  // Use props if provided, otherwise use local state
  const [localLatitude, setLocalLatitude] = useState(40.7128); // New York default
  const [localLongitude, setLocalLongitude] = useState(-74.0060); // New York default
  const [localTimezone, setLocalTimezone] = useState("America/New_York");
  const [localCapacity, setLocalCapacity] = useState(10);
  const [localCountry, setLocalCountry] = useState(country);
  const [localCity, setLocalCity] = useState(city);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  // Use either the props or local state getters
  const latitude = propLatitude !== undefined ? propLatitude : localLatitude;
  const longitude = propLongitude !== undefined ? propLongitude : localLongitude;
  const timezone = propTimezone !== undefined ? propTimezone : localTimezone;
  const capacity = propCapacity !== undefined ? propCapacity : localCapacity;
  
  // Use either the props or local state setters
  const setLatitude = propSetLatitude || setLocalLatitude;
  const setLongitude = propSetLongitude || setLocalLongitude;
  const setTimezone = propSetTimezone || setLocalTimezone;
  const setCapacity = propSetCapacity || setLocalCapacity;
  
  // System parameters
  const [tilt, setTilt] = useState(30);
  const [azimuth, setAzimuth] = useState(180); // 180 = south
  const [moduleEfficiency, setModuleEfficiency] = useState(0.2); // 20%
  const [performanceRatio, setPerformanceRatio] = useState(0.8); // 80%
  const [moduleArea, setModuleArea] = useState(1.7); // m²
  const [moduleWattPeak, setModuleWattPeak] = useState(400); // Wp
  
  // Inverter configuration
  const [inverterParams, setInverterParams] = useState<InverterParams | null>(null);
  
  // Calculation state
  const [calculating, setCalculating] = useState(false);

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
          setLocalCountry(countryName);
        }
        
        // Extract city/town/village name (whichever is available)
        const cityName = data.address.city || data.address.town || data.address.village || data.address.county;
        if (cityName) {
          setLocalCity(cityName);
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

  const handleCalculate = () => {
    setCalculating(true);
    
    try {
      // Prepare parameters
      const params: SolarParams = {
        latitude,
        longitude,
        timezone,
        surface_tilt: tilt,
        surface_azimuth: azimuth - 180, // Convert from 0-360 to -180 to 180
        module_efficiency: moduleEfficiency,
        performance_ratio: performanceRatio,
        plant_capacity_kw: capacity,
        module_area: moduleArea,
        module_watt_peak: moduleWattPeak,
        inverterParams
      };
      
      // Calculate solar energy
      const calculationResults = calculateSolarEnergy(params);
      
      // Add location and timezone to results for use in other components
      calculationResults.location = { lat: latitude, lng: longitude };
      calculationResults.timezone = timezone;
      calculationResults.country = localCountry;
      calculationResults.city = localCity;
      
      // Update capacity to match calculated capacity
      setCapacity(calculationResults.system.calculated_capacity);
      
      // Pass results to parent
      onCalculationComplete(calculationResults);
      
      toast.success("Solar energy calculations completed!");
    } catch (error) {
      console.error("Calculation error:", error);
      toast.error(error instanceof Error ? error.message : "Error in solar calculations");
    } finally {
      setCalculating(false);
    }
  };
  
  return (
    <div className="w-full animate-fade-in">
      <SectionHeader 
        title="Advanced Solar Energy Calculator" 
        description="Calculate your solar energy production based on location and system parameters"
        icon={<Sun className="h-6 w-6" />}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-white to-amber-50 shadow-sm hover:shadow-md transition-all duration-300 border-t-4 border-t-amber-400">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-amber-600" />
              Location Parameters
            </CardTitle>
            <CardDescription>
              Enter the geographic coordinates of the installation site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
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
                  value={localCountry}
                  onChange={(e) => setLocalCountry(e.target.value)}
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
                  value={localCity}
                  onChange={(e) => setLocalCity(e.target.value)}
                  className="border-amber-200 focus-visible:ring-amber-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-white to-blue-50 shadow-sm hover:shadow-md transition-all duration-300 border-t-4 border-t-blue-400">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-blue-600" />
              Installation Parameters
            </CardTitle>
            <CardDescription>
              Specify the orientation and tilt of the solar panels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tilt" className="flex items-center gap-2">
                  <RotateCw className="h-4 w-4 text-blue-600" />
                  Panel Tilt (°)
                </Label>
                <Input
                  id="tilt"
                  type="number"
                  min="0"
                  max="90"
                  value={tilt}
                  onChange={(e) => setTilt(Number(e.target.value))}
                  className="border-blue-200 focus-visible:ring-blue-500"
                />
                <p className="text-xs text-muted-foreground">
                  0° = horizontal, 90° = vertical
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="azimuth" className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-blue-600" />
                  Azimuth (°)
                </Label>
                <Input
                  id="azimuth"
                  type="number"
                  min="0"
                  max="360"
                  value={azimuth}
                  onChange={(e) => setAzimuth(Number(e.target.value))}
                  className="border-blue-200 focus-visible:ring-blue-500"
                />
                <p className="text-xs text-muted-foreground">
                  0° = North, 90° = East, 180° = South, 270° = West
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-white to-green-50 shadow-sm hover:shadow-md transition-all duration-300 border-t-4 border-t-green-400">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-600" />
              System Specifications
            </CardTitle>
            <CardDescription>
              Enter the technical details of your solar PV system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity" className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-green-600" />
                  System Capacity (kW)
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="border-green-200 focus-visible:ring-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moduleEfficiency" className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-green-600" />
                  Module Efficiency
                </Label>
                <Input
                  id="moduleEfficiency"
                  type="number"
                  min="0.1"
                  max="1"
                  step="0.01"
                  value={moduleEfficiency}
                  onChange={(e) => setModuleEfficiency(Number(e.target.value))}
                  className="border-green-200 focus-visible:ring-green-500"
                />
                <p className="text-xs text-muted-foreground">
                  Typical range: 0.15-0.23 (15-23%)
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="performanceRatio" className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-green-600" />
                  Performance Ratio
                </Label>
                <Input
                  id="performanceRatio"
                  type="number"
                  min="0.1"
                  max="1"
                  step="0.01"
                  value={performanceRatio}
                  onChange={(e) => setPerformanceRatio(Number(e.target.value))}
                  className="border-green-200 focus-visible:ring-green-500"
                />
                <p className="text-xs text-muted-foreground">
                  Typical range: 0.7-0.85 (70-85%)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="moduleWattPeak" className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-green-600" />
                  Module Watt Peak (Wp)
                </Label>
                <Input
                  id="moduleWattPeak"
                  type="number"
                  min="1"
                  value={moduleWattPeak}
                  onChange={(e) => setModuleWattPeak(Number(e.target.value))}
                  className="border-green-200 focus-visible:ring-green-500"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="moduleArea" className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-green-600" />
                Module Area (m²)
              </Label>
              <Input
                id="moduleArea"
                type="number"
                min="0.1"
                step="0.1"
                value={moduleArea}
                onChange={(e) => setModuleArea(Number(e.target.value))}
                className="border-green-200 focus-visible:ring-green-500"
              />
            </div>
          </CardContent>
        </Card>
        
        <InverterConfiguration 
          onConfigChange={setInverterParams}
          initialConfig={inverterParams}
        />
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleCalculate}
          className="bg-gradient-to-r from-solar to-solar-dark text-white hover:from-solar-dark hover:to-solar-dark transition-all shadow-md hover:shadow-lg"
          disabled={calculating}
        >
          {calculating ? (
            <>
              <RotateCw className="h-4 w-4 mr-2 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Sun className="h-4 w-4 mr-2" />
              Calculate Solar Energy
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AdvancedSolarInputs;
