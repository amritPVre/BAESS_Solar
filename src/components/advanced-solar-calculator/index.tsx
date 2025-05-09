
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart3, Calculator, Download, LayersThree, LineChart, Settings, Sun } from "lucide-react";
import { calculateSolarEnergy } from "@/utils/solarEnergyCalculation";
import { InverterParams, SolarCalculationResult, SolarParams } from "@/types/solarCalculations";
import SystemConfiguration from "../advanced-solar-calculator/SystemConfiguration";
import ComponentSelector from "./ComponentSelector";
import EfficiencyAdjustment from "./EfficiencyAdjustment";
import ProductionResults from "./ProductionResults";
import SystemSizingCalculator from "./SystemSizingCalculator";
import AreaCalculator from "./AreaCalculator";

const AdvancedSolarCalculator: React.FC = () => {
  // Location parameters
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.0060);
  const [timezone, setTimezone] = useState("America/New_York");
  
  // PV system parameters
  const [tilt, setTilt] = useState(30);
  const [azimuth, setAzimuth] = useState(180); // 180 = south
  const [arrayType, setArrayType] = useState(0); // 0 = Fixed (open rack)
  const [losses, setLosses] = useState(14.08); // Default value
  const [moduleEfficiency, setModuleEfficiency] = useState(0.2); // 20%
  const [performanceRatio, setPerformanceRatio] = useState(0.8); // 80%
  const [capacity, setCapacity] = useState(10); // 10 kW
  const [moduleArea, setModuleArea] = useState(1.7); // m²
  const [moduleWattPeak, setModuleWattPeak] = useState(400); // Wp
  
  // Component selection
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [selectedInverter, setSelectedInverter] = useState(null);
  
  // Area calculation results
  const [areaBasedLayout, setAreaBasedLayout] = useState(null);
  const [polygonConfigs, setPolygonConfigs] = useState([]);
  
  // Inverter configuration
  const [inverterParams, setInverterParams] = useState<InverterParams | null>(null);
  
  // Results state
  const [results, setResults] = useState<SolarCalculationResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState("components");
  
  // Step tracking
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  // Handle area calculator results
  const handleAreaCalculation = (capacityKw: number, areaM2: number, moduleCount: number, configs?: any[]) => {
    setAreaBasedLayout({
      capacityKw,
      areaM2,
      moduleCount
    });
    
    // Update the PV capacity based on actual placed modules
    if (capacityKw > 0) {
      setCapacity(capacityKw);
    }
    
    // Store polygon configurations for PVWatts
    if (configs && configs.length > 0) {
      setPolygonConfigs(configs);
      
      // Update tilt and azimuth based on first polygon
      setTilt(configs[0].tiltAngle);
      setAzimuth(configs[0].azimuth);
      
      // Update array type based on first polygon's structure type
      if (configs[0].structureType === 'ballasted') {
        setArrayType(1); // Fixed (roof mount)
      } else if (configs[0].structureType === 'fixed_tilt' || 
                configs[0].structureType === 'ground_mount_tables' || 
                configs[0].structureType === 'carport') {
        setArrayType(0); // Fixed (open rack)
      }
      
      // Mark the area definition step as completed
      setCompletedSteps(prev => ({...prev, 3: true}));
    } else {
      setPolygonConfigs([]);
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
        inverterParams,
        array_type: arrayType,
        losses: losses
      };
      
      // Calculate solar energy
      const calculationResults = calculateSolarEnergy(params);
      setResults(calculationResults);
      setActiveTab("results");
      
      toast.success("Solar energy calculations completed!");
      
      // Mark all steps as completed when calculations are done
      setCompletedSteps({1: true, 2: true, 3: true, 4: true});
    } catch (error) {
      console.error("Calculation error:", error);
      toast.error(error instanceof Error ? error.message : "Error in solar calculations");
    } finally {
      setCalculating(false);
    }
  };
  
  // Update step completion status
  useEffect(() => {
    const newCompletedSteps = { ...completedSteps };
    
    // Step 1: Components selected
    if (selectedPanel && selectedInverter) {
      newCompletedSteps[1] = true;
    } else {
      newCompletedSteps[1] = false;
    }
    
    // Step 2: System sizing parameters defined
    if (capacity > 0) {
      newCompletedSteps[2] = true;
    } else {
      newCompletedSteps[2] = false;
    }
    
    // Step 4: Configuration parameters set
    // We'll consider this done if the user has visited the tab
    if (activeTab === 'configuration') {
      newCompletedSteps[4] = true;
    }
    
    setCompletedSteps(newCompletedSteps);
  }, [selectedPanel, selectedInverter, capacity, activeTab, completedSteps]);
  
  // Update current step based on active tab
  useEffect(() => {
    switch(activeTab) {
      case 'components':
        setCurrentStep(1);
        break;
      case 'sizing':
        setCurrentStep(2);
        break;
      case 'areas':
        setCurrentStep(3);
        break;
      case 'configuration':
        setCurrentStep(4);
        break;
      case 'results':
        setCurrentStep(5);
        break;
      default:
        setCurrentStep(1);
    }
  }, [activeTab]);

  return (
    <div className="w-full max-w-6xl mx-auto pb-8">
      {/* Progress Bar */}
      <div className="sticky top-0 pt-4 pb-2 bg-white z-10 border-b mb-6">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold">Advanced Solar Energy Calculator</h1>
            {results && (
              <Button onClick={() => window.print()} variant="outline" size="sm" className="hidden md:flex">
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
            )}
          </div>
          
          <div className="relative mb-1">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all" 
                style={{ width: `${(currentStep - 1) * 25}%` }} 
              />
            </div>
            <div className="absolute top-0 left-0 w-full flex justify-between transform translate-y-[-10px]">
              <div className="text-center">
                <div className={`w-4 h-4 mb-1 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold ${completedSteps[1] ? 'bg-primary text-primary-foreground' : 'bg-muted border border-input'}`}>
                  {completedSteps[1] ? '✓' : '1'}
                </div>
                <span className="text-xs hidden md:inline-block absolute left-0 transform translate-x(-50%)">Components</span>
              </div>
              <div className="text-center">
                <div className={`w-4 h-4 mb-1 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold ${completedSteps[2] ? 'bg-primary text-primary-foreground' : 'bg-muted border border-input'}`}>
                  {completedSteps[2] ? '✓' : '2'}
                </div>
                <span className="text-xs hidden md:inline-block">System Sizing</span>
              </div>
              <div className="text-center">
                <div className={`w-4 h-4 mb-1 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold ${completedSteps[3] ? 'bg-primary text-primary-foreground' : 'bg-muted border border-input'}`}>
                  {completedSteps[3] ? '✓' : '3'}
                </div>
                <span className="text-xs hidden md:inline-block">PV Areas</span>
              </div>
              <div className="text-center">
                <div className={`w-4 h-4 mb-1 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold ${completedSteps[4] ? 'bg-primary text-primary-foreground' : 'bg-muted border border-input'}`}>
                  {completedSteps[4] ? '✓' : '4'}
                </div>
                <span className="text-xs hidden md:inline-block">Configuration</span>
              </div>
              <div className="text-center">
                <div className={`w-4 h-4 mb-1 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold ${results ? 'bg-primary text-primary-foreground' : 'bg-muted border border-input'}`}>
                  {results ? '✓' : '5'}
                </div>
                <span className="text-xs hidden md:inline-block absolute right-0 transform translate-x(50%)">Results</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="components">
            <Calculator className="h-4 w-4 mr-2" />
            Components
          </TabsTrigger>
          <TabsTrigger value="sizing">
            <Sun className="h-4 w-4 mr-2" />
            System Sizing
          </TabsTrigger>
          <TabsTrigger value="areas">
            <LayersThree className="h-4 w-4 mr-2" />
            PV Areas
          </TabsTrigger>
          <TabsTrigger value="configuration">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!results}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="components">
          <ComponentSelector 
            onPanelSelect={setSelectedPanel}
            onInverterSelect={setSelectedInverter}
            selectedPanel={selectedPanel}
            selectedInverter={selectedInverter}
          />
          
          <div className="flex justify-between mt-6">
            <div></div>
            <Button
              onClick={() => setActiveTab("sizing")}
              className="bg-primary"
              disabled={!selectedPanel || !selectedInverter}
            >
              Continue to System Sizing
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="sizing">
          <SystemSizingCalculator
            selectedPanel={selectedPanel}
            selectedInverter={selectedInverter}
            capacity={capacity}
            onCapacityChange={setCapacity}
            onInverterParamsChange={setInverterParams}
            areaBasedLayout={areaBasedLayout}
          />
          
          {selectedPanel && (
            <div className="mt-6 bg-muted/20 p-4 rounded-md border">
              <h3 className="text-lg font-semibold mb-2">Design Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Panel</p>
                  <p className="font-medium">{selectedPanel.manufacturer} {selectedPanel.model}</p>
                  <p className="text-sm">{selectedPanel.power}W, {selectedPanel.efficiency}% efficiency</p>
                </div>
                
                {selectedInverter && (
                  <div>
                    <p className="text-sm text-muted-foreground">Inverter</p>
                    <p className="font-medium">{selectedInverter.manufacturer} {selectedInverter.model}</p>
                    <p className="text-sm">{selectedInverter.power}W, {selectedInverter.efficiency}% efficiency</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-muted-foreground">System Size</p>
                  <p className="font-medium">{capacity.toFixed(2)} kWp</p>
                  {areaBasedLayout && (
                    <p className="text-sm">{areaBasedLayout.moduleCount} modules in {areaBasedLayout.areaM2.toFixed(1)} m²</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            <Button
              onClick={() => setActiveTab("components")}
              variant="outline"
            >
              Back
            </Button>
            <Button
              onClick={() => setActiveTab("areas")}
              className="bg-primary"
              disabled={!capacity || capacity <= 0}
            >
              Continue to PV Areas
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="areas">
          {selectedPanel ? (
            <AreaCalculator 
              selectedPanel={selectedPanel} 
              onCapacityCalculated={handleAreaCalculation} 
            />
          ) : (
            <div className="p-8 text-center">
              <p>Please select a panel before defining array areas.</p>
              <Button
                onClick={() => setActiveTab("components")}
                className="mt-4"
              >
                Go to Component Selection
              </Button>
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            <Button
              onClick={() => setActiveTab("sizing")}
              variant="outline"
            >
              Back
            </Button>
            <Button
              onClick={() => setActiveTab("configuration")}
              className="bg-primary"
              disabled={!(polygonConfigs && polygonConfigs.length > 0)}
            >
              Continue to Configuration
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="configuration">
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
          
          {polygonConfigs.length > 0 && (
            <div className="mt-6 bg-muted/20 p-4 rounded-md border">
              <h3 className="text-lg font-semibold mb-2">Multiple Installation Areas</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-sm">Area</th>
                      <th className="px-3 py-2 text-left text-sm">Structure</th>
                      <th className="px-3 py-2 text-right text-sm">Size (m²)</th>
                      <th className="px-3 py-2 text-center text-sm">Azimuth</th>
                      <th className="px-3 py-2 text-right text-sm">Modules</th>
                      <th className="px-3 py-2 text-right text-sm">Capacity (kWp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {polygonConfigs.map((config, index) => (
                      <tr key={`poly-${index}`} className="border-t border-muted">
                        <td className="px-3 py-2 text-sm font-medium">Area {index + 1}</td>
                        <td className="px-3 py-2 text-sm">
                          {config.structureType === 'ballasted' && 'Ballasted Roof'}
                          {config.structureType === 'fixed_tilt' && 'Fixed Ground Mount'}
                          {config.structureType === 'ground_mount_tables' && 'Ground Mount Tables'}
                          {config.structureType === 'carport' && 'Carport'}
                        </td>
                        <td className="px-3 py-2 text-sm text-right">{config.area.toFixed(1)}</td>
                        <td className="px-3 py-2 text-sm text-center">
                          {config.azimuth.toFixed(0)}°
                        </td>
                        <td className="px-3 py-2 text-sm text-right">{config.moduleCount}</td>
                        <td className="px-3 py-2 text-sm text-right">{config.capacityKw.toFixed(1)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-muted bg-muted/20 font-medium">
                      <td className="px-3 py-2 text-sm">Total</td>
                      <td className="px-3 py-2 text-sm">-</td>
                      <td className="px-3 py-2 text-sm text-right">
                        {polygonConfigs.reduce((sum, config) => sum + config.area, 0).toFixed(1)}
                      </td>
                      <td className="px-3 py-2 text-sm text-center">-</td>
                      <td className="px-3 py-2 text-sm text-right">
                        {polygonConfigs.reduce((sum, config) => sum + config.moduleCount, 0)}
                      </td>
                      <td className="px-3 py-2 text-sm text-right">
                        {polygonConfigs.reduce((sum, config) => sum + config.capacityKw, 0).toFixed(1)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 text-sm bg-muted/30 p-2 rounded">
                <p><strong>Note:</strong> The system-wide settings above will be used for the overall calculation, but individual area parameters are preserved for reference.</p>
              </div>
            </div>
          )}
          
          <div className="mt-6 flex justify-between">
            <Button
              onClick={() => setActiveTab("areas")}
              variant="outline"
            >
              Back
            </Button>
            <Button
              onClick={handleCalculate}
              className="bg-primary"
              disabled={calculating || !latitude || !longitude || !capacity}
            >
              {calculating ? (
                <>Calculating...</>
              ) : (
                <>Calculate Solar Energy Production</>
              )}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="results">
          {results && (
            <ProductionResults 
              results={results} 
              systemParams={{
                capacity,
                tilt,
                azimuth,
                moduleEfficiency,
                losses,
                arrayType,
                latitude,
                longitude,
                timezone
              }}
              selectedPanel={selectedPanel}
              selectedInverter={selectedInverter}
              polygonConfigs={polygonConfigs}
              onNewCalculation={() => setActiveTab("configuration")}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedSolarCalculator;
