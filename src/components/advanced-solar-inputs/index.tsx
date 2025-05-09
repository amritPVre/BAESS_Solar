import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { SolarCalculationResult, SolarParams, InverterParams } from "@/types/solarCalculations";
import { calculateSolarEnergy } from "@/utils/solarEnergyCalculation";
import InverterConfiguration from "../InverterConfiguration";
import SectionHeader from "@/components/ui/SectionHeader";
import { Sun, MapPin, Compass, Settings, RotateCw } from "lucide-react";
import LocationInputs from "./LocationInputs";
import InstallationParameters from "./InstallationParameters";
import SystemSpecifications from "./SystemSpecifications";

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
  const [results, setResult] = useState<SolarCalculationResult | null>(null);

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
      handleCalculationComplete(calculationResults);
      
      toast.success("Solar energy calculations completed!");
    } catch (error) {
      console.error("Calculation error:", error);
      toast.error(error instanceof Error ? error.message : "Error in solar calculations");
    } finally {
      setCalculating(false);
    }
  };
  
  const handleCalculationComplete = (results: SolarCalculationResult) => {
    if (results) {
      // Store the results
      setResult({
        ...results,
        location: {
          latitude: results.location?.lat || latitude,
          longitude: results.location?.lng || longitude
        },
        // Add these optional properties to avoid errors
        timezone: results.timezone || timezone,
        country: results.country || "United States",
        city: results.city || "New York"
      });
      
      // Pass the results to the parent component
      onCalculationComplete({
        ...results,
        location: {
          latitude: results.location.latitude,
          longitude: results.location.longitude,
          lat: results.location.latitude, // Add lat/lng for compatibility
          lng: results.location.longitude
        },
        timezone,
        country: "United States", // Default values for now
        city: "New York"          // Default values for now
      });
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
            <LocationInputs
              latitude={latitude}
              longitude={longitude}
              timezone={timezone}
              country={localCountry}
              city={localCity}
              setLatitude={setLatitude}
              setLongitude={setLongitude}
              setTimezone={setTimezone}
              setCountry={setLocalCountry}
              setCity={setLocalCity}
            />
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
            <InstallationParameters
              tilt={tilt}
              azimuth={azimuth}
              setTilt={setTilt}
              setAzimuth={setAzimuth}
            />
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
            <SystemSpecifications
              capacity={capacity}
              moduleEfficiency={moduleEfficiency}
              performanceRatio={performanceRatio}
              moduleWattPeak={moduleWattPeak}
              moduleArea={moduleArea}
              setCapacity={setCapacity}
              setModuleEfficiency={setModuleEfficiency}
              setPerformanceRatio={setPerformanceRatio}
              setModuleWattPeak={setModuleWattPeak}
              setModuleArea={setModuleArea}
            />
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
