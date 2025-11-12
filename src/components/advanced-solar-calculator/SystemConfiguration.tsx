import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sliders, Info, RotateCcw, ChevronDown, ChevronUp, Settings, Sun, Cloud, Zap, Factory, BarChart } from "lucide-react";
import { SolarPanel, SolarInverter } from "@/services/solarComponentsService";
import InverterSelector from "./InverterSelector";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ACSideConfiguration, ACConfiguration } from "./ACSideConfiguration";

interface SystemConfigurationProps {
  arrayType: number;
  losses: number;
  polygonConfigs?: Array<{
    structureType: string;
    area: number;
    moduleCount: number;
    capacityKw: number;
    azimuth: number;
    tiltAngle: number;
  }>;
  onArrayTypeChange: (value: number) => void;
  onLossesChange: (value: number) => void;
  selectedInverter?: SolarInverter | null;
  onInverterSelect?: (inverter: SolarInverter | null) => void;
  selectedPanel?: SolarPanel | null;
  totalSystemCapacity?: number;
  onACConfigurationChange?: (config: ACConfiguration) => void;
  onDcAcRatioChange?: (ratio: number) => void;
  onInverterCountChange?: (count: number) => void;
}

// Default values based on PVWatts typical values
const DEFAULT_LOSSES = {
  soiling: 2,
  shading: 3,
  snow: 0,
  mismatch: 2,
  wiring: 2,
  connections: 0.5,
  lightInducedDegradation: 1.5,
  nameplateRating: 1,
  age: 0,
  availability: 3
};

const SystemConfiguration: React.FC<SystemConfigurationProps> = ({
  arrayType,
  losses,
  polygonConfigs = [],
  onArrayTypeChange,
  onLossesChange,
  selectedInverter,
  onInverterSelect,
  selectedPanel,
  totalSystemCapacity = 0,
  onACConfigurationChange,
  onDcAcRatioChange,
  onInverterCountChange
}) => {
  const [detailedLosses, setDetailedLosses] = useState({...DEFAULT_LOSSES});
  const [accordionOpen, setAccordionOpen] = useState<string | undefined>(undefined);
  const [manualInverterCount, setManualInverterCount] = useState<number>(1);
  const [dcAcRatio, setDcAcRatio] = useState<number>(1.2);

  // Initialize detailed losses based on total losses
  useEffect(() => {
    if (losses !== 14.08) {
      // Scale all components proportionally
      const scaleFactor = losses / calculateTotal(DEFAULT_LOSSES);
      const scaledLosses = Object.entries(DEFAULT_LOSSES).reduce((acc, [key, value]) => {
        acc[key as keyof typeof DEFAULT_LOSSES] = parseFloat((value * scaleFactor).toFixed(1));
        return acc;
      }, {...DEFAULT_LOSSES});
      setDetailedLosses(scaledLosses);
    } else {
      setDetailedLosses({...DEFAULT_LOSSES});
    }
  }, []);

  const calculateTotal = (lossValues: typeof DEFAULT_LOSSES): number => {
    return parseFloat(Object.values(lossValues).reduce((sum, value) => sum + value, 0).toFixed(2));
  };

  const handleDetailedLossChange = (key: keyof typeof detailedLosses, value: number | string) => {
    const numericValue = typeof value === 'number' ? value : (parseFloat(value) || 0);
    const newLosses = { ...detailedLosses, [key]: numericValue };
    setDetailedLosses(newLosses);
    onLossesChange(calculateTotal(newLosses));
  };

  const handleReset = () => {
    setDetailedLosses({...DEFAULT_LOSSES});
    onLossesChange(calculateTotal(DEFAULT_LOSSES));
  };

  const handleManualInverterCountChange = (count: number, ratio: number) => {
    setManualInverterCount(count);
    setDcAcRatio(ratio);
    
    // Notify parent components about the changes
    if (onInverterCountChange) {
      onInverterCountChange(count);
    }
    if (onDcAcRatioChange) {
      onDcAcRatioChange(ratio);
    }
  };

  const totalLosses = calculateTotal(detailedLosses);

  // Helper function to get color based on loss value
  const getLossColor = (value: number) => {
    if (value <= 2) return "text-green-600";
    if (value <= 5) return "text-amber-500";
    if (value <= 10) return "text-orange-500";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Inverter Selection */}
      {onInverterSelect && (
        <InverterSelector
          selectedInverter={selectedInverter || null}
          onInverterSelect={onInverterSelect}
          selectedPanel={selectedPanel}
          totalSystemCapacity={totalSystemCapacity}
          onManualInverterCountChange={handleManualInverterCountChange}
        />
      )}
      
      {/* AC Side Configuration */}
      {selectedInverter && onACConfigurationChange && (
        <ACSideConfiguration
          systemSize={totalSystemCapacity}
          inverterPower={selectedInverter.nominal_ac_power_kw}
          inverterCount={manualInverterCount}
                      inverterOutputVoltage={selectedInverter.nominal_ac_voltage_v || (selectedInverter.phase === '1' ? 230 : 400)}
          inverterOutputCurrent={selectedInverter.nominal_ac_power_kw * 1000 / (selectedInverter.phase === '1' ? (selectedInverter.nominal_ac_voltage_v || 230) : Math.sqrt(3) * (selectedInverter.nominal_ac_voltage_v || 400))}
          onConfigurationChange={onACConfigurationChange}
        />
      )}
      
      {/* System Losses Configuration */}
      <Card className="overflow-hidden border-slate-200">
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-slate-50">
        <CardTitle className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-primary" />
            Detailed System Losses
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-6">
          {/* Hidden Array Type - kept for API but not visible to user */}
          <input type="hidden" value={arrayType} />
          
          {/* System Losses Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium">System Losses Breakdown</h3>
                <p className="text-sm text-muted-foreground">
                  Modify the parameters below to change the overall System Losses percentage for your system.
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={handleReset}
                className="flex items-center gap-1"
                size="sm" 
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
            
            {/* Total System Losses Display */}
            <div className={`p-6 mb-4 text-center rounded-lg shadow-sm border ${
                totalLosses < 10 ? "bg-gradient-to-r from-green-50 to-emerald-100/50 border-green-200" : 
                totalLosses < 15 ? "bg-gradient-to-r from-amber-50 to-yellow-100/50 border-amber-200" : 
                "bg-gradient-to-r from-orange-50 to-red-100/50 border-red-200"
              }`}>
              <h3 className="text-lg font-medium mb-2">Total System Losses</h3>
              <div className={`text-5xl font-bold mb-2 ${
                totalLosses < 10 ? "text-green-600" : 
                totalLosses < 15 ? "text-amber-600" : 
                "text-red-600"
              }`}>{totalLosses}%</div>
              <div className={`text-sm font-medium ${
                totalLosses < 10 ? "text-green-700" : 
                totalLosses < 15 ? "text-amber-700" : 
                "text-red-700"
              }`}>
                {totalLosses < 10 ? "Low losses - excellent efficiency" : 
                 totalLosses < 15 ? "Average losses - good efficiency" : 
                 "High losses - consider optimizing"}
          </div>
        </div>

            <Accordion 
              type="single" 
              collapsible 
              className="w-full border rounded-lg overflow-hidden shadow-sm"
              value={accordionOpen}
              onValueChange={setAccordionOpen}
            >
              <AccordionItem value="losses-details" className="border-0">
                <AccordionTrigger className="py-4 px-4 bg-gradient-to-r from-blue-50 to-slate-50 hover:no-underline hover:bg-blue-100 transition-all">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Detailed Loss Parameters</span>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-sm text-blue-600">
                    {accordionOpen ? "Hide Details" : "Configure"} 
                    {accordionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </AccordionTrigger>
                                <AccordionContent className="bg-white">
                  <div className="p-4">
                    <Tabs defaultValue="environmental" className="w-full">
                      <TabsList className="w-full grid grid-cols-4 mb-4 bg-gradient-to-r from-slate-100 to-blue-50 p-1 rounded-lg">
                        <TabsTrigger value="environmental" className="flex items-center gap-1 data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-50 data-[state=active]:to-green-100 data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-green-500">
                          <Sun className="h-4 w-4 text-green-600" /> Environmental
                        </TabsTrigger>
                        <TabsTrigger value="electrical" className="flex items-center gap-1 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-50 data-[state=active]:to-blue-100 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-500">
                          <Zap className="h-4 w-4 text-blue-600" /> Electrical
                        </TabsTrigger>
                        <TabsTrigger value="module" className="flex items-center gap-1 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-50 data-[state=active]:to-purple-100 data-[state=active]:text-purple-700 data-[state=active]:border-b-2 data-[state=active]:border-purple-500">
                          <Factory className="h-4 w-4 text-purple-600" /> Module
                        </TabsTrigger>
                        <TabsTrigger value="system" className="flex items-center gap-1 data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-50 data-[state=active]:to-amber-100 data-[state=active]:text-amber-700 data-[state=active]:border-b-2 data-[state=active]:border-amber-500">
                          <BarChart className="h-4 w-4 text-amber-600" /> System
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="environmental" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200">
                          <LossField 
                            label="Soiling" 
                            value={detailedLosses.soiling} 
                            onChange={(v) => handleDetailedLossChange('soiling', v)}
                            tooltip="Losses due to dust, dirt, and other foreign matter on the panel surface."
                            color={getLossColor(detailedLosses.soiling)}
                          />
                          <LossField 
                            label="Shading" 
                            value={detailedLosses.shading} 
                            onChange={(v) => handleDetailedLossChange('shading', v)}
                            tooltip="Power reduction due to partial or complete shading of the array."
                            color={getLossColor(detailedLosses.shading)}
                          />
                          <LossField 
                            label="Snow" 
                            value={detailedLosses.snow} 
                            onChange={(v) => handleDetailedLossChange('snow', v)}
                            tooltip="System losses due to snow covering the array."
                            color={getLossColor(detailedLosses.snow)}
                          />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="electrical" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
                          <LossField 
                            label="Wiring" 
                            value={detailedLosses.wiring} 
                            onChange={(v) => handleDetailedLossChange('wiring', v)}
                            tooltip="Resistive losses in the DC and AC wiring."
                            color={getLossColor(detailedLosses.wiring)}
                          />
                          <LossField 
                            label="Connections" 
                            value={detailedLosses.connections} 
                            onChange={(v) => handleDetailedLossChange('connections', v)}
                            tooltip="Resistive losses in electrical connections."
                            color={getLossColor(detailedLosses.connections)}
                          />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="module" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200">
                          <LossField 
                            label="Mismatch" 
                            value={detailedLosses.mismatch} 
                            onChange={(v) => handleDetailedLossChange('mismatch', v)}
                            tooltip="Manufacturing tolerance induced losses when connecting panels in series."
                            color={getLossColor(detailedLosses.mismatch)}
                          />
                          <LossField 
                            label="Light-Induced Degradation" 
                            value={detailedLosses.lightInducedDegradation} 
                            onChange={(v) => handleDetailedLossChange('lightInducedDegradation', v)}
                            tooltip="First-year degradation of panel performance."
                            color={getLossColor(detailedLosses.lightInducedDegradation)}
                          />
                          <LossField 
                            label="Nameplate Rating" 
                            value={detailedLosses.nameplateRating} 
                            onChange={(v) => handleDetailedLossChange('nameplateRating', v)}
                            tooltip="Difference between manufacturer nameplate rating and actual production."
                            color={getLossColor(detailedLosses.nameplateRating)}
              />
            </div>
                      </TabsContent>
                      
                      <TabsContent value="system" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200">
                          <LossField 
                            label="Age" 
                            value={detailedLosses.age} 
                            onChange={(v) => handleDetailedLossChange('age', v)}
                            tooltip="Efficiency loss due to panel age (year-one degradation should be included here)."
                            color={getLossColor(detailedLosses.age)}
                          />
                          <LossField 
                            label="Availability" 
                            value={detailedLosses.availability} 
                            onChange={(v) => handleDetailedLossChange('availability', v)}
                            tooltip="Losses due to system downtime from grid outages, maintenance, etc."
                            color={getLossColor(detailedLosses.availability)}
              />
            </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface LossFieldProps {
  label: string;
  value: number;
  onChange: (value: number | string) => void;
  tooltip?: string;
  color?: string;
}

const LossField: React.FC<LossFieldProps> = ({ label, value, onChange, tooltip, color = "text-slate-700" }) => {
  // Extract color base from the color prop (e.g., "text-red-500" -> "red")
  const colorBase = color.match(/text-([a-z]+)-/)?.[1] || "slate";
  
  return (
    <div className={`rounded-lg p-3 bg-white shadow-sm border border-${colorBase}-100 hover:shadow-md transition-all`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1">
          <label className={`text-sm font-medium ${color.replace('text-', 'text-')}`}>
            {label}
          </label>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className={`h-3.5 w-3.5 text-${colorBase}-400 cursor-help`} />
                </TooltipTrigger>
                <TooltipContent className={`max-w-xs bg-${colorBase}-800 text-white`}>
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className={`font-semibold ${color} px-2 py-0.5 rounded-full bg-${colorBase}-50`}>
          {value}%
          </div>
        </div>
        
      <div className="space-y-2">
        <Slider 
          value={[value]} 
          min={0} 
          max={20} 
          step={0.1}
          onValueChange={(vals) => onChange(vals[0])}
          className={`my-2 [&>[data-orientation=horizontal]>.bg-primary]:bg-${colorBase}-500`}
        />
        
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min="0"
            max="20"
            step="0.1"
            className={`w-full h-8 text-sm focus-visible:ring-${colorBase}-500`}
          />
          <span className={`text-xs font-medium text-${colorBase}-500`}>%</span>
        </div>
      </div>
    </div>
  );
};

export default SystemConfiguration;