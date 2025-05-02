
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { SolarPanel, SolarInverter } from "@/services/solarComponentsService";
import { PVWattsResponse } from "@/types/pvwatts";
import { calculatePVWatts } from "@/services/pvwattsService";

import ComponentSelector from "./ComponentSelector";
import SystemSizingCalculator from "./SystemSizingCalculator";
import EfficiencyAdjustmentComponent from "./EfficiencyAdjustment";
import SystemConfiguration from "./SystemConfiguration";
import ProductionResults from "./ProductionResults";

const AdvancedSolarCalculator: React.FC = () => {
  const [selectedPanel, setSelectedPanel] = useState<SolarPanel | null>(null);
  const [selectedInverter, setSelectedInverter] = useState<SolarInverter | null>(null);
  
  const [systemCapacity, setSystemCapacity] = useState(10);
  const [dcAcRatio, setDcAcRatio] = useState(120);
  
  const [tilt, setTilt] = useState(20);
  const [azimuth, setAzimuth] = useState(180);
  const [arrayType, setArrayType] = useState(1); // Fixed roof mount by default
  const [losses, setLosses] = useState(14.08);
  
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.0060);
  
  const [results, setResults] = useState<PVWattsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [hourlyAverages, setHourlyAverages] = useState<number[] | null>(null);

  // Calculate PVWatts module type based on panel efficiency
  const getModuleType = (): number => {
    if (!selectedPanel || !selectedPanel.efficiency_percent) return 0; // Default to standard
    
    const efficiency = selectedPanel.efficiency_percent;
    if (efficiency >= 17.5) return 1; // Premium
    if (efficiency <= 12) return 2; // Thin film
    return 0; // Standard
  };
  
  // Calculate efficiency adjustment factor
  const getEfficiencyAdjustment = (): number => {
    if (!selectedPanel || !selectedPanel.efficiency_percent) return 1;
    
    const panelEfficiency = selectedPanel.efficiency_percent;
    let refEfficiency = 15; // Standard
    
    if (getModuleType() === 1) refEfficiency = 19; // Premium
    if (getModuleType() === 2) refEfficiency = 10; // Thin film
    
    return panelEfficiency / refEfficiency;
  };

  // Process hourly data to get average hourly outputs
  const processHourlyData = (results: PVWattsResponse) => {
    if (!results.outputs.ac || results.outputs.ac.length !== 8760) {
      setHourlyAverages(null);
      return;
    }
    
    const hourlySum = Array(24).fill(0);
    for (let i = 0; i < 8760; i++) {
      const hourOfDay = i % 24;
      hourlySum[hourOfDay] += results.outputs.ac[i];
    }
    
    // Calculate average for each hour (total kWh for the hour / 365 days)
    const hourlyAverage = hourlySum.map(sum => (sum / 365) / 1000); // Convert Wh to kWh
    setHourlyAverages(hourlyAverage);
  };

  const handleCalculate = async () => {
    if (!selectedPanel || !selectedInverter) {
      toast.error("Please select both a panel and an inverter");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setHourlyAverages(null);

    try {
      // Calculate the efficiency-adjusted capacity
      const adjustedCapacity = systemCapacity * getEfficiencyAdjustment();
      
      // Prepare parameters for the PVWatts API
      const apiParams = {
        system_capacity: adjustedCapacity,
        module_type: getModuleType(),
        losses: losses,
        array_type: arrayType,
        tilt: tilt,
        azimuth: azimuth,
        lat: latitude,
        lon: longitude,
        timeframe: 'hourly' as 'hourly', // Force hourly for detailed results
        dc_ac_ratio: dcAcRatio / 100,
      };

      const response = await calculatePVWatts(apiParams);
      
      // Check for API errors
      if (response.errors && response.errors.length > 0) {
        setError(`API Error: ${response.errors.join(', ')}`);
        console.error('PVWatts API Errors:', response.errors);
        toast.error(`API Error: ${response.errors[0]}`);
      } else {
        setResults(response);
        processHourlyData(response);
        toast.success("Energy calculation completed successfully");
      }
    } catch (err) {
      console.error('Error calculating energy production:', err);
      setError('Failed to calculate energy production. Please check your inputs and try again.');
      toast.error("Failed to calculate energy production");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ComponentSelector 
            onPanelSelect={setSelectedPanel}
            onInverterSelect={setSelectedInverter}
            selectedPanel={selectedPanel}
            selectedInverter={selectedInverter}
          />
        </div>
        <div>
          <SystemSizingCalculator
            selectedPanel={selectedPanel}
            selectedInverter={selectedInverter}
            systemCapacity={systemCapacity}
            dcAcRatio={dcAcRatio}
            onSystemCapacityChange={setSystemCapacity}
            onDcAcRatioChange={setDcAcRatio}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {selectedPanel && (
            <EfficiencyAdjustmentComponent 
              selectedPanel={selectedPanel}
              systemCapacity={systemCapacity}
            />
          )}
        </div>
        <div>
          <SystemConfiguration
            tilt={tilt}
            azimuth={azimuth}
            arrayType={arrayType}
            losses={losses}
            latitude={latitude}
            longitude={longitude}
            onTiltChange={setTilt}
            onAzimuthChange={setAzimuth}
            onArrayTypeChange={setArrayType}
            onLossesChange={setLosses}
            onLatitudeChange={setLatitude}
            onLongitudeChange={setLongitude}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center">
        <Button 
          size="lg" 
          onClick={handleCalculate}
          disabled={loading || !selectedPanel || !selectedInverter}
        >
          {loading ? "Calculating..." : "Calculate Energy Production"}
        </Button>
      </div>

      {(results || loading) && (
        <ProductionResults
          results={results}
          selectedPanel={selectedPanel}
          selectedInverter={selectedInverter}
          systemCapacity={systemCapacity}
          loading={loading}
          hourlyAverages={hourlyAverages}
        />
      )}
    </div>
  );
};

export default AdvancedSolarCalculator;
