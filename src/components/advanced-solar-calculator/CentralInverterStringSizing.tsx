import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Factory, Calculator, Zap, Database, 
  ArrowRight, Settings, Info, CheckCircle,
  BarChart, TrendingUp
} from "lucide-react";
import { toast } from "sonner";
// Note: No longer need calculateBasicStringParameters as we use passed values

interface CentralInverterStringSizingProps {
  selectedInverter: unknown;
  selectedPanel: unknown;
  polygonConfigs: unknown[];
  lowestTemperature: number;
  highestTemperature: number;
  capacity: number;
  totalInverters: number;
  totalEstimatedPVStrings: number; // Use the already calculated string count
  averageStringVoltage: number;
  averageStringCurrent: number;
  onCentralStringSizingData?: (data: CentralStringSizingData) => void;
  initialConfiguration?: CentralStringSizingData | null; // For restoring saved data
}

interface CentralStringSizingData {
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

const CentralInverterStringSizing: React.FC<CentralInverterStringSizingProps> = ({
  selectedInverter,
  selectedPanel,
  polygonConfigs,
  lowestTemperature,
  highestTemperature,
  capacity,
  totalInverters,
  totalEstimatedPVStrings,
  averageStringVoltage,
  averageStringCurrent,
  onCentralStringSizingData,
  initialConfiguration
}) => {
  // State for manual adjustments - Initialize from saved configuration
  const [manualDCDBPerInverter, setManualDCDBPerInverter] = useState<number | null>(
    initialConfiguration?.totalDCDBPerInverter || null
  );
  const [manualDCDBStringInputs, setManualDCDBStringInputs] = useState<number | null>(
    initialConfiguration?.dcdbStringInputsPerDCDB || null
  );

  // Log when initial configuration is restored
  useEffect(() => {
    if (initialConfiguration) {
      console.log('🔄 CentralInverterStringSizing: Restoring configuration:', {
        dcdbPerInverter: initialConfiguration.totalDCDBPerInverter,
        stringsPerDCDB: initialConfiguration.dcdbStringInputsPerDCDB,
        actualStringsPerDCDB: initialConfiguration.actualPVStringsPerDCDB
      });
    }
  }, [initialConfiguration]);

  // Use the passed string calculation results instead of recalculating
  const basicStringResult = useMemo(() => {
    if (totalEstimatedPVStrings === 0) return null;

    return {
      totalStringCount: totalEstimatedPVStrings,
      averageStringVoltage,
      averageStringCurrent,
      moduleParams: null // We don't need module params for DCDB calculations
    };
  }, [totalEstimatedPVStrings, averageStringVoltage, averageStringCurrent]);

  // Extract inverter parameters
  const inverterParams = useMemo(() => {
    if (!selectedInverter) return null;

    const inverter = selectedInverter as Record<string, unknown>;

    const totalStrings = (inverter.total_string_inputs as number) || 
                        (inverter.total_strings as number) || 
                        (inverter.max_string_inputs as number) || 
                        20; // Default

    const mpptInputs = (inverter.total_mppt as number) || 
                      (inverter.mppt_inputs as number) || 
                      (inverter.number_of_mppt_inputs as number) || 
                      2; // Default

    const powerRating = (inverter.nominal_ac_power_kw as number) || 
                       ((inverter.ac_power_rating_w as number) || 0) / 1000 || 
                       ((inverter.power_rating as number) || 0) / 1000 || 
                       1000; // Default 1MW

    return {
      totalStrings,
      mpptInputs,
      powerRating,
      model: (inverter.model as string) || 'Central Inverter'
    };
  }, [selectedInverter]);

  // Calculate central inverter string assignment
  const centralStringSizing = useMemo(() => {
    if (!inverterParams || !basicStringResult || basicStringResult.totalStringCount === 0 || totalInverters === 0) {
      return null;
    }

    const totalEstimatedPVStrings = basicStringResult.totalStringCount;

    // Debug logging
    console.log('Central Inverter Calculation Debug (Using Passed Values):', {
      totalEstimatedPVStrings: totalEstimatedPVStrings,
      totalInverters,
      inverterParams,
      manualDCDBPerInverter,
      manualDCDBStringInputs,
      passedStringData: {
        totalStringCount: totalEstimatedPVStrings,
        averageStringVoltage,
        averageStringCurrent
      }
    });

    // For central inverters: totalStrings in inverter params = number of DCDB connections per inverter
    // Apply reasonable limits to prevent unrealistic calculations
    const rawTotalDCDBPerInverter = manualDCDBPerInverter || inverterParams.totalStrings;
    const totalDCDBPerInverter = Math.min(Math.max(rawTotalDCDBPerInverter, 1), 50); // Limit between 1-50 DCDB per inverter

    // Standard DCDB string inputs (can be overridden manually)
    const dcdbStringInputsPerDCDB = manualDCDBStringInputs || 16; // Typical DCDB has 16 string inputs

    // Calculate actual PV strings per DCDB
    const totalDCDBInSystem = totalInverters * totalDCDBPerInverter;
    const actualPVStringsPerDCDB = Math.ceil(totalEstimatedPVStrings / totalDCDBInSystem);

    // Calculate actual PV strings per MPPT
    // Each MPPT should handle: (strings per DCDB * DCDB per MPPT)
    // DCDB per MPPT = totalDCDBPerInverter / mpptInputs
    const dcdbPerMPPT = totalDCDBPerInverter / inverterParams.mpptInputs;
    const actualPVStringsPerMPPT = Math.ceil(actualPVStringsPerDCDB * dcdbPerMPPT);

    console.log('Calculation Details:', {
      totalDCDBPerInverter,
      dcdbStringInputsPerDCDB,
      totalDCDBInSystem,
      actualPVStringsPerDCDB,
      dcdbPerMPPT,
      actualPVStringsPerMPPT
    });

    // Add warnings for unrealistic values
    const warnings = [];
    if (actualPVStringsPerMPPT > 50) {
      warnings.push('Very high strings per MPPT (>50) - check system parameters');
    }
    if (totalEstimatedPVStrings > 2000) {
      warnings.push('Very high total string count (>2000) - verify system capacity and module specifications');
    }
    if (actualPVStringsPerDCDB > 32) {
      warnings.push('Strings per DCDB exceeds typical capacity (>32) - consider increasing DCDB count');
    }
    
    if (warnings.length > 0) {
      console.warn('Central Inverter Calculation Warnings:', warnings);
    }

    // MPPT utilization calculation
    const maxPossibleStringsPerMPPT = Math.floor(
      (totalDCDBPerInverter * dcdbStringInputsPerDCDB) / inverterParams.mpptInputs
    );
    const mpptUtilization = (actualPVStringsPerMPPT / maxPossibleStringsPerMPPT) * 100;

    // Validation checks
    const isValidConfiguration = actualPVStringsPerDCDB <= dcdbStringInputsPerDCDB;
    const utilizationWarning = mpptUtilization > 90;

    return {
      totalDCDBPerInverter,
      actualPVStringsPerDCDB,
      actualPVStringsPerMPPT,
      dcdbStringInputsPerDCDB,
      totalDCDBInSystem,
      maxPossibleStringsPerMPPT,
      mpptUtilization,
      isValidConfiguration,
      utilizationWarning,
      dcdbConfiguration: {
        dcdbPerInverter: totalDCDBPerInverter,
        stringsPerDCDB: actualPVStringsPerDCDB,
        totalDCDBCount: totalDCDBInSystem,
        mpptUtilization
      }
    };
  }, [inverterParams, basicStringResult, totalInverters, manualDCDBPerInverter, manualDCDBStringInputs, averageStringVoltage, averageStringCurrent]);

  // Send data to parent component
  useEffect(() => {
    if (onCentralStringSizingData && centralStringSizing && centralStringSizing.isValidConfiguration) {
      const data: CentralStringSizingData = {
        totalDCDBPerInverter: centralStringSizing.totalDCDBPerInverter,
        actualPVStringsPerDCDB: centralStringSizing.actualPVStringsPerDCDB,
        actualPVStringsPerMPPT: centralStringSizing.actualPVStringsPerMPPT,
        dcdbStringInputsPerDCDB: centralStringSizing.dcdbStringInputsPerDCDB,
        totalDCDBInSystem: centralStringSizing.totalDCDBInSystem,
        dcdbConfiguration: centralStringSizing.dcdbConfiguration
      };
      onCentralStringSizingData(data);
    }
  }, [centralStringSizing, onCentralStringSizingData]);

  const generateOptimizedConfiguration = () => {
    if (!centralStringSizing || !inverterParams) return;

    // Keep DCDB per inverter fixed as per inverter specifications
    const fixedDCDBPerInverter = inverterParams.totalStrings; // Use inverter's total string inputs as DCDB count
    const totalDCDBCount = fixedDCDBPerInverter * totalInverters;

    // Calculate optimal strings per DCDB to accommodate all PV strings
    const optimalStringsPerDCDB = Math.ceil(totalEstimatedPVStrings / totalDCDBCount);

    // Ensure we don't exceed standard DCDB sizes (8, 12, 16, 20, 24, 32 string inputs)
    const standardDCDBSizes = [8, 12, 16, 20, 24, 32];
    const optimizedStringsPerDCDB = standardDCDBSizes.find(size => size >= optimalStringsPerDCDB) || 32;

    setManualDCDBPerInverter(fixedDCDBPerInverter);
    setManualDCDBStringInputs(optimizedStringsPerDCDB);

    toast.success(`Optimized configuration: ${fixedDCDBPerInverter} DCDB/inverter, ${optimizedStringsPerDCDB} strings/DCDB`);
  };

  if (!inverterParams || !centralStringSizing) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Factory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Central Inverter Configuration</h3>
          <p className="text-gray-500">
            Complete string sizing configuration to enable central inverter DCDB assignment.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 border-l-4 border-l-indigo-500 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Factory className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold">Central Inverter String Assignment</span>
            <Badge className="text-xs bg-white/20 text-white border-white/30 font-semibold">DCDB Configuration</Badge>
            <Badge className="text-xs bg-green-500/80 text-white border-green-300/30 font-semibold ml-2">&ge;500kW Mode</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 p-3 bg-indigo-100 rounded-lg border border-indigo-200">
            <Info className="h-4 w-4 text-indigo-600" />
            <span className="text-sm text-indigo-800 font-medium">
              Central Inverter Mode Active: Using DCDB-based string distribution logic instead of traditional MPPT assignment.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* System Overview */}
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <BarChart className="h-5 w-5" />
            Central Inverter System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm border-l-4 border-l-blue-500">
              <div className="text-2xl font-bold text-blue-600">{totalEstimatedPVStrings}</div>
              <div className="text-sm text-gray-600">Total PV Strings</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm border-l-4 border-l-green-500">
              <div className="text-2xl font-bold text-green-600">{totalInverters}</div>
              <div className="text-sm text-gray-600">Central Inverters</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm border-l-4 border-l-purple-500">
              <div className="text-2xl font-bold text-purple-600">{inverterParams.mpptInputs}</div>
              <div className="text-sm text-gray-600">MPPTs per Inverter</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm border-l-4 border-l-orange-500">
              <div className="text-2xl font-bold text-orange-600">{inverterParams.powerRating.toFixed(0)}kW</div>
              <div className="text-sm text-gray-600">Inverter Power</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DCDB Assignment Logic */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            DCDB Assignment Calculations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-blue-800">Configuration Parameters</h4>
              
              <div>
                <Label htmlFor="dcdbPerInverter">DCDB Units per Inverter</Label>
                <Input
                  id="dcdbPerInverter"
                  type="number"
                  min="1"
                  max="20"
                  value={manualDCDBPerInverter || centralStringSizing.totalDCDBPerInverter}
                  onChange={(e) => setManualDCDBPerInverter(Number(e.target.value))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default from inverter specs: {inverterParams.totalStrings} DCDB connections
                </p>
              </div>

              <div>
                <Label htmlFor="stringInputs">String Inputs per DCDB</Label>
                <Input
                  id="stringInputs"
                  type="number"
                  min="8"
                  max="32"
                  step="2"
                  value={manualDCDBStringInputs || centralStringSizing.dcdbStringInputsPerDCDB}
                  onChange={(e) => setManualDCDBStringInputs(Number(e.target.value))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Standard DCDB sizes: 8, 12, 16, 20, 24, 32 string inputs
                </p>
              </div>

              <Button 
                onClick={generateOptimizedConfiguration}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Auto-Optimize Configuration
              </Button>
              <p className="text-xs text-indigo-600 mt-2 text-center">
                Keeps DCDB count fixed per inverter specs, optimizes strings per DCDB
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-green-800">Calculated Results</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm text-gray-700">Total DCDB in System:</span>
                  <span className="font-semibold text-blue-600">{centralStringSizing.totalDCDBInSystem} units</span>
                </div>
                
                <div className="flex justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm text-gray-700">PV Strings per DCDB:</span>
                  <span className="font-semibold text-green-600">{centralStringSizing.actualPVStringsPerDCDB} strings</span>
                </div>
                
                <div className="flex justify-between p-2 bg-purple-50 rounded">
                  <span className="text-sm text-gray-700">PV Strings per MPPT:</span>
                  <span className="font-semibold text-purple-600">{centralStringSizing.actualPVStringsPerMPPT} strings</span>
                </div>
                
                <div className="flex justify-between p-2 bg-orange-50 rounded">
                  <span className="text-sm text-gray-700">MPPT Utilization:</span>
                  <span className={`font-semibold ${centralStringSizing.utilizationWarning ? 'text-red-600' : 'text-orange-600'}`}>
                    {centralStringSizing.mpptUtilization.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Flow Diagram */}
          <Separator />
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Central Inverter Connection Flow</h4>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{totalEstimatedPVStrings}</div>
                <div className="text-xs text-gray-600">Total PV Strings</div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{centralStringSizing.totalDCDBInSystem}</div>
                <div className="text-xs text-gray-600">DCDB Units</div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{totalInverters}</div>
                <div className="text-xs text-gray-600">Central Inverters</div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{totalInverters * inverterParams.mpptInputs}</div>
                <div className="text-xs text-gray-600">Total MPPTs</div>
              </div>
            </div>
          </div>

          {/* Validation Messages */}
          <div className="space-y-3">
            {centralStringSizing.isValidConfiguration ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  Configuration is valid: {centralStringSizing.actualPVStringsPerDCDB} strings &le; {centralStringSizing.dcdbStringInputsPerDCDB} DCDB capacity
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <Info className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-800">
                  Configuration exceeds DCDB capacity: {centralStringSizing.actualPVStringsPerDCDB} strings &gt; {centralStringSizing.dcdbStringInputsPerDCDB} max inputs
                </span>
              </div>
            )}

            {centralStringSizing.utilizationWarning && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <Info className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  High MPPT utilization ({centralStringSizing.mpptUtilization.toFixed(1)}%) - consider adding more DCDB units
                </span>
              </div>
            )}
          </div>


        </CardContent>
      </Card>
    </div>
  );
};

export default CentralInverterStringSizing;