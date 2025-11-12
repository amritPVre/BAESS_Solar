import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sliders, Info, RotateCcw, ChevronDown, ChevronUp, Settings, Sun, Zap, Factory, BarChart } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ACConfiguration } from "./ACSideConfiguration";

interface DCCableData {
  voltageDropResults?: {
    voltageDropPercentage: number;
    isAcceptable: boolean;
  };
  length?: number | string;
  cable?: {
    cross_section_mm2: number | string;
  };
  material?: string;
  numberOfRuns?: number | string;
}

interface InverterData {
  efficiency?: number;
  model?: string;
  manufacturer?: string;
  nominal_ac_power_kw?: number;
  power_rating?: number;
}

interface DetailedLossesConfigurationProps {
  losses: number;
  onLossesChange: (value: number) => void;
  onDetailedLossesChange?: (detailedLosses: Record<string, number>) => void; // Callback for individual losses
  acConfiguration?: ACConfiguration; // AC configuration for extracting actual losses
  systemSize?: number; // System size in kW for calculating percentages
  dcStringCableData?: DCCableData; // DC string cable data for DC wiring losses
  dcdbCableData?: DCCableData; // DCDB cable data for DC wiring losses
  selectedInverter?: InverterData; // Selected inverter for inverter losses calculation
}

// Default values set to 1% for all parameters as requested
const DEFAULT_LOSSES = {
  soiling: 1,
  shading: 1,
  snow: 1,
  mismatch: 1,
  dcWiringLosses: 1, // DC wiring losses from cable loss calculations
  acCableLosses: 1, // AC cable losses from AC configuration
  inverterLosses: 2, // Inverter losses calculated from efficiency (1 - efficiency)
  transformerLosses: 1, // New parameter for HV transformer losses (IDTs + PT)
  lightInducedDegradation: 1,
  nameplateRating: 1,
  age: 1,
  availability: 1
};

const DetailedLossesConfiguration: React.FC<DetailedLossesConfigurationProps> = ({
  losses,
  onLossesChange,
  onDetailedLossesChange,
  acConfiguration,
  systemSize = 1000,
  dcStringCableData,
  dcdbCableData,
  selectedInverter
}) => {
  const [detailedLosses, setDetailedLosses] = useState({...DEFAULT_LOSSES});
  const [accordionOpen, setAccordionOpen] = useState<string | undefined>("losses-details");

  // Initialize detailed losses with default 1% values - no scaling
  useEffect(() => {
    const initialLosses = {...DEFAULT_LOSSES};
    
    // Calculate DC Wiring Losses from DC cable data
    if (dcStringCableData?.voltageDropResults?.voltageDropPercentage || dcdbCableData?.voltageDropResults?.voltageDropPercentage) {
      let totalDCLoss = 0;
      
      // Add DC string cable losses
      if (dcStringCableData?.voltageDropResults?.voltageDropPercentage) {
        totalDCLoss += dcStringCableData.voltageDropResults.voltageDropPercentage;
      }
      
      // Add DCDB cable losses (for central inverters)
      if (dcdbCableData?.voltageDropResults?.voltageDropPercentage) {
        totalDCLoss += dcdbCableData.voltageDropResults.voltageDropPercentage;
      }
      
      initialLosses.dcWiringLosses = Math.max(0.1, Math.min(20, totalDCLoss));
      console.log(`Using actual DC wiring losses: ${totalDCLoss.toFixed(2)}%`);
    }
    
    // Calculate Inverter Losses from inverter efficiency
    if (selectedInverter?.efficiency) {
      const inverterEfficiency = selectedInverter.efficiency;
      const inverterLossPercent = (1 - inverterEfficiency) * 100;
      initialLosses.inverterLosses = Math.max(0.1, Math.min(20, inverterLossPercent));
      console.log(`Using inverter losses: ${inverterLossPercent.toFixed(2)}% (efficiency: ${(inverterEfficiency * 100).toFixed(1)}%)`);
    }
    
    // Use actual AC cable losses from configuration
    if (acConfiguration && systemSize) {
      // Use actual cable losses if available
      if (acConfiguration.actualCableLosses && acConfiguration.actualCableLosses.kW > 0) {
        const actualCableLossesPercent = acConfiguration.actualCableLosses.percentage;
        initialLosses.acCableLosses = Math.max(0.1, Math.min(20, actualCableLossesPercent));
        console.log(`Using actual AC cable losses: ${actualCableLossesPercent.toFixed(2)}% (${acConfiguration.actualCableLosses.kW.toFixed(2)} kW)`);
      } else {
        // Fallback to estimated cable losses if actual losses not available
        const estimatedCableLossesKW = (acConfiguration.inputCables ? systemSize * 0.01 : 0) + 
                                     (acConfiguration.outputCables ? systemSize * 0.015 : 0);
        const estimatedCableLossesPercent = (estimatedCableLossesKW / systemSize) * 100;
        initialLosses.acCableLosses = Math.max(0.1, Math.min(20, estimatedCableLossesPercent));
        console.log(`Using estimated AC cable losses: ${estimatedCableLossesPercent.toFixed(2)}% (${estimatedCableLossesKW.toFixed(2)} kW)`);
      }
      
      // Calculate transformer losses for HV connections - match Design Summary logic
      if (acConfiguration.connectionType === 'HV') {
        let transformerLossesKW = 0;
        
        // Use only the appropriate configuration based on connection type and inverter type
        if (acConfiguration.inverterType === 'STRING' && acConfiguration.hvStringConfig?.idts) {
          // HV String configuration IDT losses
          acConfiguration.hvStringConfig.idts.configurations.forEach(idt => {
            transformerLossesKW += idt.copperLoss + idt.ironLoss;
          });
          
          // Power transformer losses for HV String
          if (acConfiguration.hvStringConfig.powerTransformer) {
            transformerLossesKW += acConfiguration.hvStringConfig.powerTransformer.copperLoss + 
                                 acConfiguration.hvStringConfig.powerTransformer.ironLoss;
          }
        } else if (acConfiguration.inverterType === 'CENTRAL' && acConfiguration.hvCentralConfig?.idts) {
          // HV Central configuration IDT losses
          acConfiguration.hvCentralConfig.idts.configurations.forEach(idt => {
            transformerLossesKW += idt.copperLoss + idt.ironLoss;
          });
          
          // Power transformer losses for HV Central
          if (acConfiguration.hvCentralConfig.powerTransformer) {
            transformerLossesKW += acConfiguration.hvCentralConfig.powerTransformer.copperLoss + 
                                 acConfiguration.hvCentralConfig.powerTransformer.ironLoss;
          }
        }
        
        const transformerLossesPercent = (transformerLossesKW / systemSize) * 100;
        initialLosses.transformerLosses = Math.max(0.1, Math.min(20, transformerLossesPercent));
      } else if (acConfiguration.connectionType === 'LV') {
        // Legacy LV configuration
        let transformerLossesKW = 0;
        
        if (acConfiguration.idtConfig) {
          transformerLossesKW += (acConfiguration.idtConfig.copperLoss + acConfiguration.idtConfig.ironLoss) * acConfiguration.idtConfig.count;
        }
        
        if (acConfiguration.powerTransformerConfig) {
          transformerLossesKW += acConfiguration.powerTransformerConfig.copperLoss + acConfiguration.powerTransformerConfig.ironLoss;
        }
        
        const transformerLossesPercent = (transformerLossesKW / systemSize) * 100;
        initialLosses.transformerLosses = Math.max(0.1, Math.min(20, transformerLossesPercent));
      } else {
        // For other connection types, set transformer losses to 0
        initialLosses.transformerLosses = 0;
      }
    }
    
    setDetailedLosses(initialLosses);
    onLossesChange(calculateTotal(initialLosses));
    onDetailedLossesChange?.(initialLosses);
  }, [acConfiguration, systemSize, acConfiguration?.actualCableLosses, dcStringCableData, dcdbCableData, selectedInverter]); // eslint-disable-line react-hooks/exhaustive-deps

  const calculateTotal = (lossValues: typeof DEFAULT_LOSSES): number => {
    return parseFloat(Object.values(lossValues).reduce((sum, value) => sum + value, 0).toFixed(2));
  };

  const handleDetailedLossChange = (key: keyof typeof detailedLosses, value: number | string) => {
    const numericValue = typeof value === 'number' ? value : (parseFloat(value) || 0);
    const newLosses = { ...detailedLosses, [key]: numericValue };
    setDetailedLosses(newLosses);
    onLossesChange(calculateTotal(newLosses));
    onDetailedLossesChange?.(newLosses);
  };

  const handleReset = () => {
    setDetailedLosses({...DEFAULT_LOSSES});
    onLossesChange(calculateTotal(DEFAULT_LOSSES));
    onDetailedLossesChange?.({...DEFAULT_LOSSES});
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
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-slate-50">
        <CardTitle className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-primary" />
          Detailed System Losses
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-6">
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
          
          {/* Move Detailed Parameters to Top */}
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
                        <LossField 
                          label="DC Wiring Losses" 
                          value={detailedLosses.dcWiringLosses} 
                          onChange={(v) => handleDetailedLossChange('dcWiringLosses', v)}
                          tooltip="Resistive losses in DC string cables and DCDB to inverter cables, calculated from voltage drop analysis."
                          color={getLossColor(detailedLosses.dcWiringLosses)}
                        />
                        <LossField 
                          label="AC Cable Losses" 
                          value={detailedLosses.acCableLosses} 
                          onChange={(v) => handleDetailedLossChange('acCableLosses', v)}
                          tooltip="AC cable losses calculated from your cable sizing configuration (LV and HV cables)."
                          color={getLossColor(detailedLosses.acCableLosses)}
                        />
                        <LossField 
                          label="Inverter Losses" 
                          value={detailedLosses.inverterLosses} 
                          onChange={(v) => handleDetailedLossChange('inverterLosses', v)}
                          tooltip="Power conversion losses calculated from inverter efficiency (1 - efficiency)."
                          color={getLossColor(detailedLosses.inverterLosses)}
                        />
                        {acConfiguration?.connectionType === 'HV' && (
                          <LossField 
                            label="Transformer Losses" 
                            value={detailedLosses.transformerLosses} 
                            onChange={(v) => handleDetailedLossChange('transformerLosses', v)}
                            tooltip="Combined losses from IDTs and Power Transformers (HV connections only)."
                            color={getLossColor(detailedLosses.transformerLosses)}
                        />
                        )}
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
          
          {/* Total System Losses Display moved to bottom */}
          <div className={`p-6 mt-6 text-center rounded-lg shadow-sm border ${
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
        </div>
      </CardContent>
    </Card>
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
          {typeof value === 'number' ? value.toFixed(2) : value}%
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
            value={typeof value === 'number' ? Number(value.toFixed(2)) : value}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onChange(isNaN(val) ? 0 : Math.round(val * 100) / 100);
            }}
            min="0"
            max="20"
            step="0.01"
            className={`w-full h-8 text-sm focus-visible:ring-${colorBase}-500`}
          />
          <span className={`text-xs font-medium text-${colorBase}-500`}>%</span>
        </div>
      </div>
    </div>
  );
};

export default DetailedLossesConfiguration; 