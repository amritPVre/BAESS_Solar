import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, Zap, AlertTriangle, CheckCircle, Settings, 
  Database, Calculator, BarChart, Factory, Cable,
  ThermometerSun, Wind, Info
} from "lucide-react";
import { toast } from "sonner";

interface CentralInverterData {
  totalDCDBPerInverter: number;
  actualPVStringsPerDCDB: number;
  actualPVStringsPerMPPT: number;
  dcdbStringInputsPerDCDB: number;
  totalDCDBInSystem: number;
  dcdbConfiguration: {
    dcdbPerInverter: number;
    stringsPerDCDB: number;
    totalDCDBCount: number;
    mpptUtilization: number;
  };
}

interface DCDBSizingCalculatorProps {
  selectedInverter: any;
  selectedPanel: any;
  polygonConfigs: any[];
  totalStringCount: number;
  totalSystemCapacity: number;
  averageStringVoltage: number;
  averageStringCurrent: number;
  lowestTemperature: number;
  highestTemperature: number;
  centralInverterData?: CentralInverterData;
}

interface DCCBSpecs {
  rating: number; // Ampere rating
  breakingCapacity: number; // kA
  poles: number;
  voltageRating: number; // V
  type: 'MCB' | 'MCCB' | 'Fuse';
  manufacturer?: string;
  model?: string;
}

interface DCDBConfiguration {
  inputStrings: number;
  outputCombinerUnits: number;
  stringsPerCombiner: number;
  totalDCCurrent: number;
  dcdbInputCurrent: number;
  dcdbOutputCurrent: number;
  stringFuseRating: number;
  combinerBreakerRating: number;
  mainDCBreakerRating: number;
  busbarSize: string;
  enclosureRating: string;
  coolingRequirement: string;
  installationEnvironment: 'Indoor' | 'Outdoor';
  ambientTemperature: number;
  derateFactor: number;
}

interface EnvironmentalFactors {
  ambientTemp: number;
  altitude: number;
  humidity: number;
  uvExposure: 'High' | 'Medium' | 'Low';
  installationType: 'Wall Mount' | 'Floor Mount' | 'Pole Mount';
}

const DCDBSizingCalculator: React.FC<DCDBSizingCalculatorProps> = ({
  selectedInverter,
  selectedPanel,
  polygonConfigs,
  totalStringCount,
  totalSystemCapacity,
  averageStringVoltage,
  averageStringCurrent,
  lowestTemperature,
  highestTemperature,
  centralInverterData
}) => {
  // State management - Initialize based on central inverter data if available
  const [dcdbConfig, setDCDBConfig] = useState<DCDBConfiguration>({
    inputStrings: centralInverterData ? centralInverterData.actualPVStringsPerDCDB : totalStringCount,
    outputCombinerUnits: centralInverterData ? centralInverterData.totalDCDBInSystem : 1,
    stringsPerCombiner: centralInverterData ? centralInverterData.actualPVStringsPerDCDB : totalStringCount,
    totalDCCurrent: 0,
    dcdbInputCurrent: 0,
    dcdbOutputCurrent: 0,
    stringFuseRating: 0,
    combinerBreakerRating: 0,
    mainDCBreakerRating: 0,
    busbarSize: '',
    enclosureRating: 'IP65',
    coolingRequirement: 'Natural',
    installationEnvironment: 'Outdoor',
    ambientTemperature: (lowestTemperature + highestTemperature) / 2,
    derateFactor: 1.0
  });

  const [environmentalFactors, setEnvironmentalFactors] = useState<EnvironmentalFactors>({
    ambientTemp: (lowestTemperature + highestTemperature) / 2,
    altitude: 1000,
    humidity: 60,
    uvExposure: 'High',
    installationType: 'Wall Mount'
  });

  const [selectedComponents, setSelectedComponents] = useState({
    stringFuses: null as DCCBSpecs | null,
    combinerBreakers: null as DCCBSpecs | null,
    mainBreaker: null as DCCBSpecs | null
  });

  // Available component options
  const dcFuseOptions: DCCBSpecs[] = [
    { rating: 10, breakingCapacity: 20, poles: 1, voltageRating: 1000, type: 'Fuse' },
    { rating: 15, breakingCapacity: 20, poles: 1, voltageRating: 1000, type: 'Fuse' },
    { rating: 20, breakingCapacity: 20, poles: 1, voltageRating: 1000, type: 'Fuse' },
    { rating: 25, breakingCapacity: 20, poles: 1, voltageRating: 1000, type: 'Fuse' },
    { rating: 30, breakingCapacity: 20, poles: 1, voltageRating: 1000, type: 'Fuse' }
  ];

  const dcBreakerOptions: DCCBSpecs[] = [
    { rating: 16, breakingCapacity: 10, poles: 2, voltageRating: 1000, type: 'MCB' },
    { rating: 20, breakingCapacity: 10, poles: 2, voltageRating: 1000, type: 'MCB' },
    { rating: 25, breakingCapacity: 10, poles: 2, voltageRating: 1000, type: 'MCB' },
    { rating: 32, breakingCapacity: 10, poles: 2, voltageRating: 1000, type: 'MCB' },
    { rating: 40, breakingCapacity: 10, poles: 2, voltageRating: 1000, type: 'MCB' },
    { rating: 50, breakingCapacity: 10, poles: 2, voltageRating: 1000, type: 'MCB' },
    { rating: 63, breakingCapacity: 25, poles: 2, voltageRating: 1000, type: 'MCCB' },
    { rating: 80, breakingCapacity: 25, poles: 2, voltageRating: 1000, type: 'MCCB' },
    { rating: 100, breakingCapacity: 25, poles: 2, voltageRating: 1000, type: 'MCCB' },
    { rating: 125, breakingCapacity: 25, poles: 2, voltageRating: 1000, type: 'MCCB' },
    { rating: 160, breakingCapacity: 25, poles: 2, voltageRating: 1000, type: 'MCCB' },
    { rating: 200, breakingCapacity: 25, poles: 2, voltageRating: 1000, type: 'MCCB' },
    { rating: 250, breakingCapacity: 35, poles: 2, voltageRating: 1000, type: 'MCCB' },
    { rating: 315, breakingCapacity: 35, poles: 2, voltageRating: 1000, type: 'MCCB' },
    { rating: 400, breakingCapacity: 35, poles: 2, voltageRating: 1000, type: 'MCCB' },
    { rating: 500, breakingCapacity: 50, poles: 2, voltageRating: 1000, type: 'MCCB' },
    { rating: 630, breakingCapacity: 50, poles: 2, voltageRating: 1000, type: 'MCCB' },
    { rating: 800, breakingCapacity: 65, poles: 2, voltageRating: 1000, type: 'MCCB' },
    { rating: 1000, breakingCapacity: 65, poles: 2, voltageRating: 1000, type: 'MCCB' }
  ];

  // Calculate derived parameters
  const moduleParams = useMemo(() => {
    if (!selectedPanel) return null;

    const isc = selectedPanel.isc_a || selectedPanel.isc || 14.0;
    const imp = selectedPanel.imp_a || selectedPanel.imp || 13.0;
    const voc = selectedPanel.voc_v || selectedPanel.voc || 50.0;
    const vmp = selectedPanel.vmp_v || selectedPanel.vmp || 42.0;

    return { isc, imp, voc, vmp };
  }, [selectedPanel]);

  // Calculate environmental derating factors
  const derateFactor = useMemo(() => {
    let factor = 1.0;
    
    // Temperature derating
    if (environmentalFactors.ambientTemp > 40) {
      factor *= 0.9; // 10% derating above 40°C
    } else if (environmentalFactors.ambientTemp > 50) {
      factor *= 0.8; // 20% derating above 50°C
    }
    
    // Altitude derating
    if (environmentalFactors.altitude > 2000) {
      factor *= 0.95; // 5% derating above 2000m
    }
    
    // UV exposure factor for outdoor installations
    if (environmentalFactors.uvExposure === 'High' && dcdbConfig.installationEnvironment === 'Outdoor') {
      factor *= 0.95; // 5% derating for high UV
    }

    return factor;
  }, [environmentalFactors, dcdbConfig.installationEnvironment]);

  // Calculate DCDB sizing parameters
  const dcdbCalculations = useMemo(() => {
    if (!moduleParams || !totalStringCount) {
      return null;
    }

    // String current calculations with temperature correction
    const stringCurrentSTC = moduleParams.imp;
    const stringCurrentMax = moduleParams.isc * 1.25; // 125% of Isc as per IEC 61215
    
    // Temperature corrected string current
    const tempCorrectionFactor = 1 + (0.05 / 100) * (highestTemperature - 25); // Assume 0.05%/°C
    const stringCurrentHot = stringCurrentMax * tempCorrectionFactor;

    // Total currents
    const totalDCCurrent = stringCurrentHot * totalStringCount * derateFactor;
    
    // Combiner calculations - Use central inverter data if available
    const recommendedCombinerUnits = centralInverterData 
      ? centralInverterData.totalDCDBInSystem 
      : Math.ceil(totalStringCount / 16); // Max 16 strings per combiner
    const stringsPerCombiner = centralInverterData 
      ? centralInverterData.actualPVStringsPerDCDB 
      : Math.ceil(totalStringCount / recommendedCombinerUnits);
    const combinerOutputCurrent = stringCurrentHot * stringsPerCombiner;

    // Protection device sizing (125% of calculated current as per NEC/IEC)
    const stringFuseRating = Math.ceil(stringCurrentHot * 1.25);
    const combinerBreakerRating = Math.ceil(combinerOutputCurrent * 1.25);
    const mainBreakerRating = Math.ceil(totalDCCurrent * 1.25);

    // Busbar sizing (based on total current)
    let busbarSize = '';
    if (totalDCCurrent <= 100) busbarSize = '25x5mm';
    else if (totalDCCurrent <= 200) busbarSize = '40x5mm';
    else if (totalDCCurrent <= 400) busbarSize = '50x8mm';
    else if (totalDCCurrent <= 600) busbarSize = '60x10mm';
    else if (totalDCCurrent <= 800) busbarSize = '80x10mm';
    else busbarSize = '100x10mm';

    // Cooling requirement
    let coolingRequirement = 'Natural';
    if (totalDCCurrent > 400) coolingRequirement = 'Forced Air';
    if (totalDCCurrent > 800) coolingRequirement = 'Climate Control';

    return {
      stringCurrentSTC,
      stringCurrentMax,
      stringCurrentHot,
      totalDCCurrent,
      recommendedCombinerUnits,
      stringsPerCombiner,
      combinerOutputCurrent,
      stringFuseRating,
      combinerBreakerRating,
      mainBreakerRating,
      busbarSize,
      coolingRequirement,
      tempCorrectionFactor
    };
  }, [moduleParams, totalStringCount, highestTemperature, derateFactor]);

  // Update configuration when calculations change
  useEffect(() => {
    if (dcdbCalculations) {
      setDCDBConfig(prev => ({
        ...prev,
        inputStrings: totalStringCount,
        outputCombinerUnits: dcdbCalculations.recommendedCombinerUnits,
        stringsPerCombiner: dcdbCalculations.stringsPerCombiner,
        totalDCCurrent: dcdbCalculations.totalDCCurrent,
        dcdbInputCurrent: dcdbCalculations.stringCurrentHot,
        dcdbOutputCurrent: dcdbCalculations.combinerOutputCurrent,
        stringFuseRating: dcdbCalculations.stringFuseRating,
        combinerBreakerRating: dcdbCalculations.combinerBreakerRating,
        mainDCBreakerRating: dcdbCalculations.mainBreakerRating,
        busbarSize: dcdbCalculations.busbarSize,
        coolingRequirement: dcdbCalculations.coolingRequirement,
        derateFactor: derateFactor
      }));
    }
  }, [dcdbCalculations, totalStringCount, derateFactor]);

  // Auto-select appropriate components
  useEffect(() => {
    if (dcdbCalculations) {
      // Select string fuses
      const appropriateFuse = dcFuseOptions.find(fuse => 
        fuse.rating >= dcdbCalculations.stringFuseRating && 
        fuse.rating <= dcdbCalculations.stringFuseRating * 1.5
      );

      // Select combiner breakers
      const appropriateCombinerBreaker = dcBreakerOptions.find(breaker => 
        breaker.rating >= dcdbCalculations.combinerBreakerRating &&
        breaker.rating <= dcdbCalculations.combinerBreakerRating * 1.5
      );

      // Select main breaker
      const appropriateMainBreaker = dcBreakerOptions.find(breaker => 
        breaker.rating >= dcdbCalculations.mainBreakerRating &&
        breaker.rating <= dcdbCalculations.mainBreakerRating * 1.5
      );

      setSelectedComponents({
        stringFuses: appropriateFuse || null,
        combinerBreakers: appropriateCombinerBreaker || null,
        mainBreaker: appropriateMainBreaker || null
      });
    }
  }, [dcdbCalculations]);

  const generateDCDBReport = () => {
    if (!dcdbCalculations) return;

    const report = {
      systemOverview: {
        totalCapacity: totalSystemCapacity,
        totalStrings: totalStringCount,
        averageStringVoltage,
        averageStringCurrent
      },
      dcdbConfiguration: dcdbConfig,
      environmentalFactors,
      selectedComponents,
      calculations: dcdbCalculations,
      recommendations: [
        `Use ${dcdbConfig.outputCombinerUnits} combiner units with ${dcdbConfig.stringsPerCombiner} strings each`,
        `Install ${dcdbConfig.enclosureRating} rated enclosure for ${dcdbConfig.installationEnvironment.toLowerCase()} installation`,
        `Implement ${dcdbConfig.coolingRequirement.toLowerCase()} cooling for optimal performance`,
        `Use ${dcdbConfig.busbarSize} copper busbar for main DC distribution`
      ]
    };

    console.log('DCDB Design Report:', report);
    toast.success('DCDB design report generated successfully!');
  };

  if (!selectedInverter || !selectedPanel || totalStringCount === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">DCDB Sizing Not Available</h3>
          <p className="text-gray-500">
            Please complete the string sizing configuration to enable DCDB design.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-slate-50 via-gray-50 to-zinc-50 border-l-4 border-l-orange-500 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Database className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold">DC Distribution Board (DCDB) Sizing</span>
            <Badge className="text-xs bg-white/20 text-white border-white/30 font-semibold">Central Inverter</Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* System Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <BarChart className="h-5 w-5" />
            {centralInverterData ? 'Central Inverter DCDB System Overview' : 'System Overview'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {centralInverterData ? (
            /* Central Inverter Overview */
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg shadow-sm border-l-4 border-l-blue-500">
                  <div className="text-2xl font-bold text-blue-600">{totalSystemCapacity.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">System Capacity (kWp)</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm border-l-4 border-l-green-500">
                  <div className="text-2xl font-bold text-green-600">{centralInverterData.totalDCDBInSystem}</div>
                  <div className="text-sm text-gray-600">Total DCDB Units</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm border-l-4 border-l-purple-500">
                  <div className="text-2xl font-bold text-purple-600">{centralInverterData.actualPVStringsPerDCDB}</div>
                  <div className="text-sm text-gray-600">Strings per DCDB</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm border-l-4 border-l-orange-500">
                  <div className="text-2xl font-bold text-orange-600">{centralInverterData.dcdbStringInputsPerDCDB}</div>
                  <div className="text-sm text-gray-600">DCDB Capacity</div>
                </div>
              </div>
              
              <div className="p-3 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-lg">
                <h4 className="font-semibold text-indigo-800 mb-2">Central Inverter Configuration</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total PV Strings:</span>
                    <span className="font-semibold text-indigo-700 ml-2">{totalStringCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">DCDB per Inverter:</span>
                    <span className="font-semibold text-indigo-700 ml-2">{centralInverterData.totalDCDBPerInverter}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Strings per MPPT:</span>
                    <span className="font-semibold text-indigo-700 ml-2">{centralInverterData.actualPVStringsPerMPPT}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Standard Overview */
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{totalSystemCapacity.toFixed(1)}</div>
                <div className="text-sm text-gray-600">System Capacity (kWp)</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-green-600">{totalStringCount}</div>
                <div className="text-sm text-gray-600">Total Strings</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-purple-600">{averageStringVoltage.toFixed(0)}V</div>
                <div className="text-sm text-gray-600">String Voltage</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-orange-600">{averageStringCurrent.toFixed(1)}A</div>
                <div className="text-sm text-gray-600">String Current</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Configuration Tabs */}
      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="environmental">Environmental</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          <Card className="relative overflow-hidden bg-white border-2 border-slate-200/50 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4 pt-5 bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-yellow-50/50">
              <CardTitle className="flex items-center gap-2.5 text-xl font-bold text-slate-800">
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md">
                  <Settings className="h-5 w-5" />
                </div>
                DCDB Configuration Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="combinerUnits" className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"></div>
                      Number of Combiner Units
                    </Label>
                    <Input
                      id="combinerUnits"
                      type="number"
                      min="1"
                      max="20"
                      value={dcdbConfig.outputCombinerUnits}
                      onChange={(e) => {
                        const units = Number(e.target.value);
                        setDCDBConfig(prev => ({
                          ...prev,
                          outputCombinerUnits: units,
                          stringsPerCombiner: Math.ceil(totalStringCount / units)
                        }));
                      }}
                      className="h-11 border-2 border-slate-200/70 bg-white hover:border-orange-400 focus:ring-2 focus:ring-orange-500/20 rounded-lg transition-all duration-300 hover:shadow-md font-medium"
                    />
                    <p className="text-xs text-slate-600 font-medium mt-2 flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-orange-500" />
                      Recommended: {dcdbCalculations?.recommendedCombinerUnits} units
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="enclosureRating" className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500"></div>
                      Enclosure Protection Rating
                    </Label>
                    <Select value={dcdbConfig.enclosureRating} onValueChange={(value) => 
                      setDCDBConfig(prev => ({ ...prev, enclosureRating: value }))
                    }>
                      <SelectTrigger className="h-11 border-2 border-slate-200/70 bg-white hover:border-amber-400 focus:ring-2 focus:ring-amber-500/20 rounded-lg transition-all duration-300 hover:shadow-md font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-lg border-2">
                        <SelectItem value="IP54" className="hover:bg-orange-50 focus:bg-orange-50">IP54 - Basic Protection</SelectItem>
                        <SelectItem value="IP65" className="hover:bg-orange-50 focus:bg-orange-50">IP65 - Dust/Water Resistant</SelectItem>
                        <SelectItem value="IP66" className="hover:bg-orange-50 focus:bg-orange-50">IP66 - Enhanced Protection</SelectItem>
                        <SelectItem value="IP67" className="hover:bg-orange-50 focus:bg-orange-50">IP67 - Waterproof</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="installation" className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"></div>
                      Installation Environment
                    </Label>
                    <Select value={dcdbConfig.installationEnvironment} onValueChange={(value: 'Indoor' | 'Outdoor') => 
                      setDCDBConfig(prev => ({ ...prev, installationEnvironment: value }))
                    }>
                      <SelectTrigger className="h-11 border-2 border-slate-200/70 bg-white hover:border-yellow-400 focus:ring-2 focus:ring-yellow-500/20 rounded-lg transition-all duration-300 hover:shadow-md font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-lg border-2">
                        <SelectItem value="Indoor" className="hover:bg-yellow-50 focus:bg-yellow-50">Indoor Installation</SelectItem>
                        <SelectItem value="Outdoor" className="hover:bg-yellow-50 focus:bg-yellow-50">Outdoor Installation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ambientTemp" className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500"></div>
                      Design Ambient Temperature (°C)
                    </Label>
                    <Input
                      id="ambientTemp"
                      type="number"
                      min="-20"
                      max="60"
                      value={dcdbConfig.ambientTemperature}
                      onChange={(e) => setDCDBConfig(prev => ({ 
                        ...prev, 
                        ambientTemperature: Number(e.target.value) 
                      }))}
                      className="h-11 border-2 border-slate-200/70 bg-white hover:border-orange-400 focus:ring-2 focus:ring-orange-500/20 rounded-lg transition-all duration-300 hover:shadow-md font-medium"
                    />
                    <p className="text-xs text-slate-600 font-medium mt-2 flex items-center gap-1.5">
                      <ThermometerSun className="h-3.5 w-3.5 text-orange-500" />
                      Site range: {lowestTemperature}°C to {highestTemperature}°C
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Protection Devices Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {dcdbCalculations && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* String Fuses */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      String Fuses
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>Required: ≥{dcdbCalculations.stringFuseRating}A</div>
                      <div className="font-medium text-green-600">
                        Selected: {selectedComponents.stringFuses?.rating}A {selectedComponents.stringFuses?.type}
                      </div>
                      <div>Quantity: {totalStringCount} pcs</div>
                      <div>Voltage: {selectedComponents.stringFuses?.voltageRating}V DC</div>
                    </div>
                  </div>

                  {/* Combiner Breakers */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Combiner Breakers
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>Required: ≥{dcdbCalculations.combinerBreakerRating}A</div>
                      <div className="font-medium text-green-600">
                        Selected: {selectedComponents.combinerBreakers?.rating}A {selectedComponents.combinerBreakers?.type}
                      </div>
                      <div>Quantity: {dcdbConfig.outputCombinerUnits} pcs</div>
                      <div>Poles: {selectedComponents.combinerBreakers?.poles}P</div>
                    </div>
                  </div>


                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Environmental Tab */}
        <TabsContent value="environmental" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThermometerSun className="h-5 w-5" />
                Environmental Considerations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Altitude (meters)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="5000"
                      value={environmentalFactors.altitude}
                      onChange={(e) => setEnvironmentalFactors(prev => ({ 
                        ...prev, 
                        altitude: Number(e.target.value) 
                      }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Relative Humidity (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={environmentalFactors.humidity}
                      onChange={(e) => setEnvironmentalFactors(prev => ({ 
                        ...prev, 
                        humidity: Number(e.target.value) 
                      }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>UV Exposure Level</Label>
                    <Select value={environmentalFactors.uvExposure} onValueChange={(value: 'High' | 'Medium' | 'Low') => 
                      setEnvironmentalFactors(prev => ({ ...prev, uvExposure: value }))
                    }>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low (Indoor/Covered)</SelectItem>
                        <SelectItem value="Medium">Medium (Partial Shade)</SelectItem>
                        <SelectItem value="High">High (Direct Sunlight)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Installation Type</Label>
                    <Select value={environmentalFactors.installationType} onValueChange={(value: any) => 
                      setEnvironmentalFactors(prev => ({ ...prev, installationType: value }))
                    }>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Wall Mount">Wall Mount</SelectItem>
                        <SelectItem value="Floor Mount">Floor Mount</SelectItem>
                        <SelectItem value="Pole Mount">Pole Mount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-800 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Derating Factor Applied</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Current derating factor: {(derateFactor * 100).toFixed(1)}% 
                  (based on temperature, altitude, and environmental conditions)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {dcdbCalculations && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Design Calculations Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-blue-800">Current Calculations</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>String Current (STC):</span>
                          <span className="font-medium">{dcdbCalculations.stringCurrentSTC.toFixed(2)}A</span>
                        </div>
                        <div className="flex justify-between">
                          <span>String Current (Max):</span>
                          <span className="font-medium">{dcdbCalculations.stringCurrentMax.toFixed(2)}A</span>
                        </div>
                        <div className="flex justify-between">
                          <span>String Current (Hot):</span>
                          <span className="font-medium">{dcdbCalculations.stringCurrentHot.toFixed(2)}A</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total DC Current:</span>
                          <span className="font-medium text-blue-600">{dcdbCalculations.totalDCCurrent.toFixed(1)}A</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-green-800">Protection Sizing</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>String Fuse Rating:</span>
                          <span className="font-medium">{dcdbCalculations.stringFuseRating}A</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Combiner Breaker:</span>
                          <span className="font-medium">{dcdbCalculations.combinerBreakerRating}A</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Busbar Size:</span>
                          <span className="font-medium">{dcdbCalculations.busbarSize}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Design Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Use {dcdbConfig.outputCombinerUnits} combiner units with {dcdbConfig.stringsPerCombiner} strings each for optimal load distribution</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Install {dcdbConfig.enclosureRating} rated enclosure suitable for {dcdbConfig.installationEnvironment.toLowerCase()} installation</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Implement {dcdbConfig.coolingRequirement.toLowerCase()} cooling to maintain optimal operating temperature</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Use {dcdbCalculations.busbarSize} copper busbar for main DC distribution to handle {dcdbCalculations.totalDCCurrent.toFixed(0)}A total current</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">Temperature correction factor of {(dcdbCalculations.tempCorrectionFactor * 100).toFixed(1)}% applied for {highestTemperature}°C design temperature</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={generateDCDBReport} className="bg-orange-600 hover:bg-orange-700">
                  <Database className="h-4 w-4 mr-2" />
                  Generate DCDB Report
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DCDBSizingCalculator;