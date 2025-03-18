
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Calculator, 
  Sun, 
  BarChart3, 
  LineChart, 
  Download 
} from "lucide-react";
import { calculateSolarEnergy } from "@/utils/solarEnergyCalculation";
import { InverterParams, SolarCalculationResult, SolarParams } from "@/types/solarCalculations";
import InverterConfiguration from "./InverterConfiguration";
import SolarChart from "./ui/SolarChart";
import { formatNumber } from "@/utils/calculations";

const AdvancedSolarCalculator: React.FC = () => {
  // Location parameters
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.0060);
  const [timezone, setTimezone] = useState("America/New_York");
  
  // PV system parameters
  const [tilt, setTilt] = useState(30);
  const [azimuth, setAzimuth] = useState(180); // 180 = south
  const [moduleEfficiency, setModuleEfficiency] = useState(0.2); // 20%
  const [performanceRatio, setPerformanceRatio] = useState(0.8); // 80%
  const [capacity, setCapacity] = useState(10); // 10 kW
  const [moduleArea, setModuleArea] = useState(1.7); // m²
  const [moduleWattPeak, setModuleWattPeak] = useState(400); // Wp
  
  // Inverter configuration
  const [inverterParams, setInverterParams] = useState<InverterParams | null>(null);
  
  // Results state
  const [results, setResults] = useState<SolarCalculationResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState("parameters");

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
      setResults(calculationResults);
      setActiveTab("results");
      
      toast.success("Solar energy calculations completed!");
    } catch (error) {
      console.error("Calculation error:", error);
      toast.error(error instanceof Error ? error.message : "Error in solar calculations");
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Advanced Solar Energy Calculator</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="parameters">
            <Calculator className="h-4 w-4 mr-2" />
            Parameters
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!results}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="parameters">
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
              className="bg-solar hover:bg-solar-dark text-white w-full sm:w-auto"
              disabled={calculating}
            >
              {calculating ? "Calculating..." : "Calculate Solar Energy"}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="results">
          {results && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">System Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Total Modules:</dt>
                        <dd className="text-sm font-semibold">{results.system.total_modules}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Total Area:</dt>
                        <dd className="text-sm font-semibold">{formatNumber(results.system.total_area)} m²</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">System Capacity:</dt>
                        <dd className="text-sm font-semibold">{formatNumber(results.system.calculated_capacity)} kW</dd>
                      </div>
                      {results.system.inverter_configuration && (
                        <>
                          <Separator className="my-2" />
                          <div className="flex justify-between">
                            <dt className="text-sm font-medium text-muted-foreground">Inverters:</dt>
                            <dd className="text-sm font-semibold">{results.system.number_of_inverters}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm font-medium text-muted-foreground">DC/AC Ratio:</dt>
                            <dd className="text-sm font-semibold">{formatNumber(results.system.effective_dc_ac_ratio)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm font-medium text-muted-foreground">Inverter Efficiency:</dt>
                            <dd className="text-sm font-semibold">{(results.system.inverter_efficiency * 100).toFixed(1)}%</dd>
                          </div>
                        </>
                      )}
                    </dl>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Irradiation Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Max Daily:</dt>
                        <dd className="text-sm font-semibold">{formatNumber(results.irradiation.metrics.max_daily)} kWh/m²</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Min Daily:</dt>
                        <dd className="text-sm font-semibold">{formatNumber(results.irradiation.metrics.min_daily)} kWh/m²</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Yearly Total:</dt>
                        <dd className="text-sm font-semibold">{formatNumber(results.irradiation.metrics.total_yearly)} kWh/m²</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Energy Production</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Max Daily:</dt>
                        <dd className="text-sm font-semibold">{formatNumber(results.energy.metrics.max_daily)} kWh</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Min Daily:</dt>
                        <dd className="text-sm font-semibold">{formatNumber(results.energy.metrics.min_daily)} kWh</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Yearly Production:</dt>
                        <dd className="text-sm font-semibold">{formatNumber(results.energy.metrics.total_yearly)} kWh</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">25-Year Production:</dt>
                        <dd className="text-sm font-semibold">{formatNumber(results.yearlyProduction.reduce((sum, val) => sum + val, 0))} kWh</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Sun className="h-5 w-5 mr-2 text-solar" />
                      Monthly Solar Irradiation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SolarChart
                      data={results.irradiation.monthly}
                      xKey="Month"
                      yKey="Monthly Solar Irradiation (kWh/m²)"
                      title=""
                      type="bar"
                      color="#fc8c29"
                      xLabel="Month"
                      yLabel="kWh/m²"
                      height={300}
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <LineChart className="h-5 w-5 mr-2 text-solar" />
                      Monthly Energy Production
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SolarChart
                      data={results.energy.monthly}
                      xKey="Month"
                      yKey="Monthly Energy Production (kWh)"
                      title=""
                      type="bar"
                      color="#4CB571"
                      xLabel="Month"
                      yLabel="kWh"
                      height={300}
                    />
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-solar" />
                    25-Year Production Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SolarChart
                    data={results.yearlyProduction.map((value, index) => ({ 
                      year: index + 1, 
                      production: value 
                    }))}
                    xKey="year"
                    yKey="production"
                    title=""
                    type="line"
                    color="#0496FF"
                    xLabel="Year"
                    yLabel="kWh"
                    height={300}
                    yTickFormatter={(value) => `${formatNumber(value)} kWh`}
                  />
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("parameters")}>
                  Back to Parameters
                </Button>
                <Button onClick={() => window.print()} className="bg-solar hover:bg-solar-dark text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Export Results
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedSolarCalculator;
