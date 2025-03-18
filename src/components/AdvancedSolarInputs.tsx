
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { InverterParams, SolarCalculationResult, SolarParams } from "@/types/solarCalculations";
import { calculateSolarEnergy } from "@/utils/solarEnergyCalculation";
import InverterConfiguration from "./InverterConfiguration";
import { toast } from "sonner";
import { Calculator, Sun } from "lucide-react";

interface AdvancedSolarInputsProps {
  latitude: number;
  longitude: number;
  setLatitude: (value: number) => void;
  setLongitude: (value: number) => void;
  timezone: string;
  setTimezone: (value: string) => void;
  capacity: number;
  setCapacity: (value: number) => void;
  onCalculationComplete: (results: SolarCalculationResult) => void;
  country: string;
  city: string;
}

const AdvancedSolarInputs: React.FC<AdvancedSolarInputsProps> = ({
  latitude,
  longitude,
  setLatitude,
  setLongitude,
  timezone,
  setTimezone,
  capacity,
  setCapacity,
  onCalculationComplete,
  country,
  city
}) => {
  // PV system parameters
  const [tilt, setTilt] = useState(30);
  const [azimuth, setAzimuth] = useState(180); // 180 = south
  const [moduleEfficiency, setModuleEfficiency] = useState(0.2); // 20%
  const [performanceRatio, setPerformanceRatio] = useState(0.8); // 80%
  const [moduleArea, setModuleArea] = useState(1.7); // m²
  const [moduleWattPeak, setModuleWattPeak] = useState(400); // Wp
  
  // Inverter configuration
  const [inverterParams, setInverterParams] = useState<InverterParams | null>(null);
  
  // Calculate state
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
    <div className="glass-card rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <h2 className="section-title flex items-center">
        <Sun className="w-6 h-6 mr-2 text-solar" />
        Advanced Solar System Details
      </h2>
      <p className="text-muted-foreground mb-6">
        Configure the detailed parameters of your solar PV system for precise energy production estimates
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Location Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input 
                id="location" 
                value={`${city}, ${country}`} 
                readOnly 
                disabled
                className="bg-muted"
              />
            </div>
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
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Installation Parameters</CardTitle>
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
          className="bg-solar hover:bg-solar-dark text-white w-full sm:w-auto"
          disabled={calculating}
        >
          <Calculator className="w-4 h-4 mr-2" />
          {calculating ? "Calculating..." : "Calculate Solar Energy"}
        </Button>
      </div>
    </div>
  );
};

export default AdvancedSolarInputs;
