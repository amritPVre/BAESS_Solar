import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronRight, ChevronLeft, RotateCw, Check, Sun, Zap } from "lucide-react";
import { toast } from "sonner";
import { SolarPanel, SolarInverter } from "@/services/solarComponentsService";
import { PVWattsResponse } from "@/types/pvwatts";
import { calculatePVWatts } from "@/services/pvwattsService";
import { motion } from "framer-motion";

import ComponentSelector from "./ComponentSelector";
import SystemSizingCalculator from "./SystemSizingCalculator";
import EfficiencyAdjustmentComponent from "./EfficiencyAdjustment";
import SystemConfiguration from "./SystemConfiguration";
import ProductionResults from "./ProductionResults";

// Animation variants for the step transitions
const stepVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.3 } }
};

// Step interface for type safety
interface Step {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const AdvancedSolarCalculator: React.FC = () => {
  // All the existing state variables
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

  // New state variables for the wizard interface
  const [currentStep, setCurrentStep] = useState(0);
  const [calculationCompleted, setCalculationCompleted] = useState(false);

  // Define the steps for the wizard
  const steps: Step[] = [
    {
      id: "components",
      title: "Component Selection",
      icon: <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center"><Sun className="h-6 w-6 text-white" /></div>,
      description: "Select solar panels and inverters from our database."
    },
    {
      id: "sizing",
      title: "System Sizing",
      icon: <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center"><Zap className="h-6 w-6 text-white" /></div>,
      description: "Configure your system capacity and DC/AC ratio."
    },
    {
      id: "configuration",
      title: "System Configuration",
      icon: <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center"><RotateCw className="h-6 w-6 text-white" /></div>,
      description: "Set up location, tilt, azimuth and losses for accurate calculations."
    },
    {
      id: "results",
      title: "Energy Production Results",
      icon: <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center"><Check className="h-6 w-6 text-white" /></div>,
      description: "Review your solar energy production estimates."
    },
  ];

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

  // Handle next step logic
  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      // Scroll to top on mobile for better experience
      if (window.innerWidth < 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Handle previous step logic
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      // Scroll to top on mobile for better experience
      if (window.innerWidth < 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Handle calculation logic
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
      } else if (response.warnings && response.warnings.length > 0) {
        setError(`API Warning: ${response.warnings.join(', ')}`);
        console.warn('PVWatts API Warnings:', response.warnings);
      }
      setResults(response);
      processHourlyData(response);
      setCalculationCompleted(true);
      toast.success("Energy calculation completed successfully");
      
      // Navigate to results step
      setCurrentStep(3); // Index of the results step
    } catch (err) {
      console.error('Error calculating energy production:', err);
      setError('Failed to calculate energy production. Please check your inputs and try again.');
      toast.error("Failed to calculate energy production");
    } finally {
      setLoading(false);
    }
  };

  // Progress percentage for the progress bar
  const progressPercentage = (currentStep / (steps.length - 1)) * 100;

  // Render the current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            key="components"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <ComponentSelector 
              onPanelSelect={setSelectedPanel}
              onInverterSelect={setSelectedInverter}
              selectedPanel={selectedPanel}
              selectedInverter={selectedInverter}
            />
          </motion.div>
        );
      case 1:
        return (
          <motion.div
            key="sizing"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            <SystemSizingCalculator
              selectedPanel={selectedPanel}
              selectedInverter={selectedInverter}
              systemCapacity={systemCapacity}
              dcAcRatio={dcAcRatio}
              onSystemCapacityChange={setSystemCapacity}
              onDcAcRatioChange={setDcAcRatio}
            />
            {selectedPanel && (
              <EfficiencyAdjustmentComponent 
                selectedPanel={selectedPanel}
                systemCapacity={systemCapacity}
              />
            )}
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            key="configuration"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
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
            {selectedPanel && (
              <EfficiencyAdjustmentComponent 
                selectedPanel={selectedPanel}
                systemCapacity={systemCapacity}
              />
            )}
            <div className="flex justify-center pt-4">
              <Button 
                onClick={handleCalculate}
                disabled={loading || !selectedPanel || !selectedInverter}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-6 rounded-xl shadow-lg transform transition-all hover:-translate-y-1 font-medium text-lg"
              >
                {loading ? (
                  <>
                    <RotateCw className="h-5 w-5 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    Calculate Energy Production
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            key="results"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            {(results || loading) && (
              <ProductionResults
                results={results}
                selectedPanel={selectedPanel}
                selectedInverter={selectedInverter}
                systemCapacity={systemCapacity}
                loading={loading}
                hourlyAverages={hourlyAverages}
                showFullSummary={true}
              />
            )}
            
            {/* Project Summary Section */}
            {results && !loading && (
              <div className="mt-8 bg-gradient-to-br from-sky-50 to-indigo-50 p-6 rounded-xl shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Complete System Summary</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Component Selection Summary */}
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-blue-600 mb-2 flex items-center">
                      <Sun className="h-4 w-4 mr-2" />
                      Components
                    </h3>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Panel:</span> {selectedPanel?.manufacturer} {selectedPanel?.model}</p>
                      <p><span className="font-medium">Power Rating:</span> {selectedPanel?.nominal_power_w}W</p>
                      <p><span className="font-medium">Efficiency:</span> {selectedPanel?.efficiency_percent}%</p>
                      <p><span className="font-medium">Inverter:</span> {selectedInverter?.manufacturer} {selectedInverter?.model}</p>
                      <p><span className="font-medium">Inverter Rating:</span> {selectedInverter?.nominal_ac_power_kw}kW</p>
                    </div>
                  </div>
                  
                  {/* System Configuration Summary */}
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-green-600 mb-2 flex items-center">
                      <RotateCw className="h-4 w-4 mr-2" />
                      Configuration
                    </h3>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">System Size:</span> {systemCapacity} kW</p>
                      <p><span className="font-medium">DC/AC Ratio:</span> {dcAcRatio}%</p>
                      <p><span className="font-medium">Tilt:</span> {tilt}°</p>
                      <p><span className="font-medium">Azimuth:</span> {azimuth}°</p>
                      <p><span className="font-medium">Location:</span> {results.station_info.city || "Custom"}, {results.station_info.state || "Location"}</p>
                    </div>
                  </div>
                  
                  {/* Production Summary */}
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-amber-600 mb-2 flex items-center">
                      <Zap className="h-4 w-4 mr-2" />
                      Energy Production
                    </h3>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Annual Production:</span> {Math.round(results.outputs.ac_annual).toLocaleString()} kWh</p>
                      <p><span className="font-medium">Specific Yield:</span> {(results.outputs.ac_annual / systemCapacity).toFixed(0)} kWh/kWp</p>
                      <p><span className="font-medium">Capacity Factor:</span> {(results.outputs.capacity_factor * 100).toFixed(1)}%</p>
                      <p><span className="font-medium">Daily Average:</span> {(results.outputs.ac_annual / 365).toFixed(1)} kWh</p>
                      <p><span className="font-medium">Top Month:</span> {(() => {
                        const maxIndex = results.outputs.ac_monthly.indexOf(Math.max(...results.outputs.ac_monthly));
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return `${months[maxIndex]} (${Math.round(results.outputs.ac_monthly[maxIndex])} kWh)`;
                      })()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* Sticky Progress Bar and Steps Navigation */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-4 mb-8 border-b shadow-sm">
        {/* Progress Bar with Step Labels */}
        <div className="relative mb-2">
          <div className="h-3 bg-gray-200 rounded-full">
            <div 
              className="h-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500 ease-in-out" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          {/* Step Labels on Progress Bar - Fixed positioning to stay within container */}
          <div className="flex justify-between w-full px-1 mt-2">
            {steps.map((step, index) => {
              // Calculate position for label based on index
              const position = index / (steps.length - 1) * 100;
              
              // For first and last labels, add special positioning
              let textAlignment = "text-center";
              let extraStyles = {};
              
              if (index === 0) {
                textAlignment = "text-left";
                extraStyles = { left: "0", transform: "none" };
              } else if (index === steps.length - 1) {
                textAlignment = "text-right";
                extraStyles = { right: "0", left: "auto", transform: "none" };
              } else {
                extraStyles = { 
                  left: `${position}%`, 
                  transform: 'translateX(-50%)'
                };
              }
              
              return (
                <div 
                  key={step.id}
                  className={`text-xs font-medium transition-all absolute ${
                    index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                  } ${textAlignment}`}
                  style={extraStyles}
                >
                  {step.title}
                </div>
              );
            })}
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-between absolute -bottom-4 w-full">
            {steps.map((step, index) => {
              const position = index / (steps.length - 1) * 100;
              
              // Similar positioning logic for indicators as for labels
              let extraStyles = {};
              
              if (index === 0) {
                extraStyles = { left: "0", transform: "none" };
              } else if (index === steps.length - 1) {
                extraStyles = { right: "0", left: "auto", transform: "none" };
              } else {
                extraStyles = { 
                  left: `${position}%`, 
                  transform: 'translateX(-50%)'
                };
              }
              
              return (
                <div 
                  key={step.id}
                  className={`flex flex-col items-center cursor-pointer transition-all absolute ${
                    index <= currentStep ? 'opacity-100' : 'opacity-50'
                  }`}
                  onClick={() => {
                    // Allow going to previous steps or to results if calculation is completed
                    if (index <= currentStep || (index === 3 && calculationCompleted)) {
                      setCurrentStep(index);
                    }
                  }}
                  style={extraStyles}
                >
                  <div 
                    className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                      index < currentStep ? 'bg-green-500 text-white' : 
                      index === currentStep ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                    } shadow-md`}
                  >
                    {index < currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      index === currentStep ? step.icon : null
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Current Step Title and Description */}
        <div className="mt-8 mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {steps[currentStep].title}
          </h2>
          <p className="text-gray-600">{steps[currentStep].description}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px] mb-8">
        {renderStepContent()}
      </div>
      
      {/* Error Messages */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Navigation Buttons */}
      {currentStep !== 2 && (
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={handlePrevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          {currentStep < 2 && (
            <Button 
              onClick={handleNextStep}
              disabled={
                (currentStep === 0 && (!selectedPanel || !selectedInverter)) ||
                (currentStep === 1 && systemCapacity <= 0)
              }
              className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          
          {currentStep === 3 && (
            <Button 
              onClick={() => {
                // Reset form and go back to first step
                setCurrentStep(0);
                setResults(null);
                setCalculationCompleted(false);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2"
            >
              Start New Calculation
              <RotateCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSolarCalculator;
