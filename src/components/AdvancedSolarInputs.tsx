
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
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">Advanced Solar Energy Calculator</h2>
      <p className="text-muted-foreground mb-6">
        Calculate your solar energy production based on location and system parameters
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Location Parameters</CardTitle>
            <CardDescription>
              Enter the geographic coordinates of the installation site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude (°)</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                  placeholder="e.g., 40.7128"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude (°)</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                  placeholder="e.g., -74.0060"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g., America/New_York"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={country}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Installation Parameters</CardTitle>
            <CardDescription>
              Specify the orientation and tilt of the solar panels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tilt">Panel Tilt (°)</Label>
                <Input
                  id="tilt"
                  type="number"
                  min="0"
                  max="90"
                  value={tilt}
                  onChange={(e) => setTilt(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  0° = horizontal, 90° = vertical
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="azimuth">Azimuth (°)</Label>
                <Input
                  id="azimuth"
                  type="number"
                  min="0"
                  max="360"
                  value={azimuth}
                  onChange={(e) => setAzimuth(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  0° = North, 90° = East, 180° = South, 270° = West
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>System Specifications</CardTitle>
            <CardDescription>
              Enter the technical details of your solar PV system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">System Capacity (kW)</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moduleEfficiency">Module Efficiency</Label>
                <Input
                  id="moduleEfficiency"
                  type="number"
                  min="0.1"
                  max="1"
                  step="0.01"
                  value={moduleEfficiency}
                  onChange={(e) => setModuleEfficiency(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Typical range: 0.15-0.23 (15-23%)
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="performanceRatio">Performance Ratio</Label>
                <Input
                  id="performanceRatio"
                  type="number"
                  min="0.1"
                  max="1"
                  step="0.01"
                  value={performanceRatio}
                  onChange={(e) => setPerformanceRatio(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Typical range: 0.7-0.85 (70-85%)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="moduleWattPeak">Module Watt Peak (Wp)</Label>
                <Input
                  id="moduleWattPeak"
                  type="number"
                  min="1"
                  value={moduleWattPeak}
                  onChange={(e) => setModuleWattPeak(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="moduleArea">Module Area (m²)</Label>
              <Input
                id="moduleArea"
                type="number"
                min="0.1"
                step="0.1"
                value={moduleArea}
                onChange={(e) => setModuleArea(Number(e.target.value))}
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
          className="bg-solar hover:bg-solar-dark text-white"
          disabled={calculating}
        >
          {calculating ? "Calculating..." : "Calculate Solar Energy"}
        </Button>
      </div>
    </div>
  );
};

export default AdvancedSolarInputs;
