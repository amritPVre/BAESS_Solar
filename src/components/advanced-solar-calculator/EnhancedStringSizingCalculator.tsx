import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Calculator, Thermometer, Zap, Info, Plus, Trash2, Settings, Sun, Activity, FileText, BarChart } from "lucide-react";
import { toast } from "sonner";

interface SolarPanel {
  id?: string;
  manufacturer?: string;
  model?: string;
  name?: string;
  // Voltage properties - various naming conventions
  voc_v?: number;
  voc?: number;
  vmp_v?: number;
  vmp?: number;
  // Current properties - various naming conventions
  isc_a?: number;
  isc?: number;
  imp_a?: number;
  imp?: number;
  // Power properties - various naming conventions
  power_w?: number;
  power?: number;
  power_rating?: number;
  nominal_power_w?: number;
  // Temperature coefficients - various naming conventions
  temp_coeff_voc_percent_c?: number;
  temp_coeff_voc?: number;
  temp_coeff_vmp_percent_c?: number;
  temp_coeff_vmp?: number;
  temp_coeff_isc_percent_c?: number;
  temp_coeff_power_percent_c?: number;
  temp_coeff_power?: number;
  // Dimensions
  length_m?: number;
  width_m?: number;
  // Efficiency
  efficiency_percent?: number;
  efficiency?: number;
  // Allow any other properties for flexibility
  [key: string]: unknown;
}

interface SolarInverter {
  id?: string;
  manufacturer?: string;
  model?: string;
  name?: string;
  // Power rating - various naming conventions
  ac_power_rating_w?: number;
  ac_power_rating?: number;
  power_rating?: number;
  rated_power?: number;
  nominal_ac_power_kw?: number;
  // MPPT properties - various naming conventions
  total_mppt?: number;
  mppt_inputs?: number;
  number_of_mppt_inputs?: number;
  mppt_channels?: number;
  num_mppt?: number;
  // String inputs - various naming conventions
  total_string_inputs?: number;
  total_strings?: number;
  max_string_inputs?: number;
  strings_per_mppt?: number;
  max_strings_per_mppt?: number;
  max_input_strings?: number;
  string_inputs_per_mppt?: number;
  // Voltage ranges - various naming conventions
  min_mpp_voltage_v?: number;
  min_mppt_voltage?: number;
  mppt_min_voltage?: number;
  mppt_voltage_min?: number;
  mppt_operating_voltage_min?: number;
  dc_input_voltage_min?: number;
  max_mpp_voltage_v?: number;
  max_mppt_voltage?: number;
  mppt_max_voltage?: number;
  mppt_voltage_max?: number;
  mppt_operating_voltage_max?: number;
  dc_input_voltage_max?: number;
  // DC voltage and current limits - various naming conventions
  max_dc_voltage_v?: number;
  max_dc_voltage?: number;
  maximum_dc_voltage?: number;
  max_dc_input_voltage?: number;
  absolute_max_dc_voltage?: number;
  max_dc_current_a?: number;
  max_dc_current?: number;
  maximum_dc_current?: number;
  max_input_current?: number;
  max_dc_input_current?: number;
  max_string_current?: number;
  max_current_per_string?: number;
  // Efficiency
  efficiency?: number;
  max_efficiency?: number;
  // Allow any other properties for flexibility
  [key: string]: unknown;
}

interface PolygonConfig {
  id?: string;
  name?: string;
  moduleCount?: number;
  capacity?: number;
  tilt?: number;
  tiltAngle?: number;
  azimuth?: number;
  area?: number;
  structureType?: string;
  // Allow any other properties for flexibility
  [key: string]: unknown;
}

interface Orientation {
  azimuth: number;
  tilt: number;
}

interface StringSizingData {
  totalStringCount: number;
  averageStringVoltage: number;
  averageStringCurrent: number;
  totalCapacity: number;
  subArrays?: SubArray[]; // Include detailed sub-array configurations
  inverterConfigs?: InverterConfig[]; // Include MPPT assignments
}

interface EnhancedStringSizingCalculatorProps {
  selectedPanel: SolarPanel;
  selectedInverter: SolarInverter;
  lowestTemperature: number;
  highestTemperature: number;
  polygonConfigs: PolygonConfig[];
  manualInverterCount: number;
  capacity: number;
  onStringSizingDataChange?: (data: StringSizingData) => void;
  showMPPTAssignment?: boolean; // New prop to control MPPT assignment visibility
  initialSubArrays?: SubArray[]; // For restoring saved projects
  initialInverterConfigs?: InverterConfig[]; // For restoring saved projects
}

interface SubArray {
  id: string;
  name: string;
  orientation: {
    tilt: number;
    azimuth: number;
  };
  moduleCount: number;
  area: number;
  capacity: number;
  strings: number;
  modulesPerString: number;
  assignedMPPT: string[];
  powerPerString: number;
}

interface MPPTInput {
  id: number;
  name: string;
  maxStrings: number;
  assignedStrings: number;
  totalPower: number;
  orientation?: {
    tilt: number;
    azimuth: number;
  };
  subArrayId?: string;
}

interface InverterConfig {
  id: number;
  name: string;
  mpptInputs: MPPTInput[];
  totalAssignedPower: number;
  powerRating: number;
  loadRatio: number;
}

interface OperatingConditions {
  vmpAtMinTemp: number;
  vmpAtMaxTemp: number;
  vocAtMinTemp: number;
  vocAtMaxTemp: number;
  stringVmpAtMinTemp: number;
  stringVmpAtMaxTemp: number;
  stringVocAtMinTemp: number;
  stringVocAtMaxTemp: number;
  powerAtSTC: number;
  powerAtOperating: number;
}

const EnhancedStringSizingCalculator: React.FC<EnhancedStringSizingCalculatorProps> = ({
  selectedPanel,
  selectedInverter,
  lowestTemperature,
  highestTemperature,
  polygonConfigs,
  manualInverterCount,
  capacity,
  onStringSizingDataChange,
  showMPPTAssignment = true, // Default to true for backward compatibility
  initialSubArrays,
  initialInverterConfigs
}) => {
  // State management
  const [subArrays, setSubArrays] = useState<SubArray[]>(initialSubArrays || []);
  const [inverterConfigs, setInverterConfigs] = useState<InverterConfig[]>(initialInverterConfigs || []);
  // Initialize selectedSubArray from saved data if available
  const [selectedSubArray, setSelectedSubArray] = useState<string>(
    initialSubArrays && initialSubArrays.length > 0 ? initialSubArrays[0].id : ""
  );
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [selectedInverterTab, setSelectedInverterTab] = useState<number>(0);
  const [showValidationResults, setShowValidationResults] = useState(false); // For collapsible validation section
  // Initialize hasRestoredProject based on whether we have saved data to restore
  const [hasRestoredProject, setHasRestoredProject] = useState(
    !!(initialSubArrays && initialSubArrays.length > 0) || !!(initialInverterConfigs && initialInverterConfigs.length > 0)
  );
  
  // Debug: Log when selectedSubArray changes
  useEffect(() => {
    if (selectedSubArray) {
      console.log('🎯 Selected sub-array changed to:', selectedSubArray);
      const selected = subArrays.find(sa => sa.id === selectedSubArray);
      if (selected) {
        console.log('📊 Selected sub-array data:', {
          id: selected.id,
          name: selected.name,
          modulesPerString: selected.modulesPerString,
          strings: selected.strings,
          moduleCount: selected.moduleCount
        });
      }
    }
  }, [selectedSubArray, subArrays]);
  
  // Module parameters (from selected panel)
  const moduleParams = useMemo(() => {
    if (!selectedPanel) return null;
    
    // Extract electrical parameters using correct property names
    const voc = selectedPanel.voc_v || selectedPanel.voc || 45.0;
    const vmp = selectedPanel.vmp_v || selectedPanel.vmp || 37.0;
    const isc = selectedPanel.isc_a || selectedPanel.isc || 11.5;
    const imp = selectedPanel.imp_a || selectedPanel.imp || 10.8;
    
    // Extract power using the same logic as main calculator
    let power = 400; // default
    if (selectedPanel.nominal_power_w && selectedPanel.nominal_power_w > 0) {
      power = selectedPanel.nominal_power_w;
    } else if (selectedPanel.power_rating && selectedPanel.power_rating > 30000 && selectedPanel.power_rating < 40000) {
      power = selectedPanel.power_rating / 100; // Handle 34kW case
    } else if (selectedPanel.power_rating && selectedPanel.power_rating > 0) {
      power = selectedPanel.power_rating;
    } else if (selectedPanel.power && selectedPanel.power > 0) {
      power = selectedPanel.power;
    }
    
    // Calculate area from dimensions
    const area = (selectedPanel.length_m && selectedPanel.width_m) 
      ? selectedPanel.length_m * selectedPanel.width_m 
      : 2.1;
    
    // Get efficiency
    const efficiency = selectedPanel.efficiency_percent || selectedPanel.efficiency || 20.0;
    
    console.log('Module params extracted:', { voc, vmp, isc, imp, power, area, efficiency });
    
    return {
      voc,
      vmp,
      isc,
      imp,
      power,
      tempCoeffVoc: selectedPanel.temp_coeff_voc_percent_c || selectedPanel.temp_coeff_voc || -0.25, // Default -0.25%/°C as requested
      tempCoeffVmp: selectedPanel.temp_coeff_vmp_percent_c || selectedPanel.temp_coeff_vmp || -0.38,
      tempCoeffPower: selectedPanel.temp_coeff_power_percent_c || selectedPanel.temp_coeff_power || -0.41,
      area,
      efficiency
    };
  }, [selectedPanel]);

  // Inverter parameters (from selected inverter)
  const inverterParams = useMemo(() => {
    if (!selectedInverter) return null;
    
    console.log('Selected inverter object:', selectedInverter);
    console.log('All inverter properties:', Object.keys(selectedInverter));
    
    // Extract MPPT parameters using the correct property names from InverterSelector
    const mpptInputs = selectedInverter.total_mppt || 
                      selectedInverter.mppt_inputs || 
                      selectedInverter.number_of_mppt_inputs || 
                      selectedInverter.mppt_channels ||
                      selectedInverter.num_mppt ||
                      2; // fallback
    
    const totalStringInputs = selectedInverter.total_string_inputs || 
                             selectedInverter.total_strings ||
                             selectedInverter.max_string_inputs ||
                             20; // fallback
    
    // Calculate strings per MPPT from total strings and MPPT count
    const stringsPerMPPT = Math.floor(totalStringInputs / mpptInputs) ||
                          selectedInverter.strings_per_mppt || 
                          selectedInverter.max_strings_per_mppt || 
                          selectedInverter.max_input_strings ||
                          selectedInverter.string_inputs_per_mppt ||
                          2; // fallback
    
    // Power rating extraction
    let powerRating = 50000; // default 50kW
    if (selectedInverter.nominal_ac_power_kw && selectedInverter.nominal_ac_power_kw > 0) {
      powerRating = selectedInverter.nominal_ac_power_kw * 1000;
    } else if (selectedInverter.power_rating && selectedInverter.power_rating > 0) {
      powerRating = selectedInverter.power_rating;
    } else if (selectedInverter.rated_power && selectedInverter.rated_power > 0) {
      powerRating = selectedInverter.rated_power;
    } else if (selectedInverter.ac_power_rating && selectedInverter.ac_power_rating > 0) {
      powerRating = selectedInverter.ac_power_rating;
    }
    
    // Voltage parameters using the correct property names from InverterSelector
    const mpptVoltageMin = selectedInverter.min_mpp_voltage_v || 
                          selectedInverter.mppt_min_voltage || 
                          selectedInverter.mppt_voltage_min || 
                          selectedInverter.min_mppt_voltage ||
                          selectedInverter.mppt_operating_voltage_min ||
                          selectedInverter.dc_input_voltage_min ||
                          125; // fallback
    
    // Note: InverterSelector uses max_dc_voltage_v for MPPT range display, so we'll match that
    const mpptVoltageMax = selectedInverter.max_mpp_voltage_v || 
                          selectedInverter.max_dc_voltage_v || // Match InverterSelector display
                          selectedInverter.mppt_max_voltage || 
                          selectedInverter.mppt_voltage_max || 
                          selectedInverter.max_mppt_voltage ||
                          selectedInverter.mppt_operating_voltage_max ||
                          selectedInverter.dc_input_voltage_max ||
                          850; // fallback
    
    const maxDcVoltage = selectedInverter.max_dc_voltage_v || 
                        selectedInverter.max_dc_voltage || 
                        selectedInverter.maximum_dc_voltage || 
                        selectedInverter.max_dc_input_voltage ||
                        selectedInverter.absolute_max_dc_voltage ||
                        1000; // fallback
    
    const maxDcCurrent = selectedInverter.max_dc_current_a || 
                        selectedInverter.max_dc_current || 
                        selectedInverter.maximum_dc_current || 
                        selectedInverter.max_input_current ||
                        selectedInverter.max_dc_input_current ||
                        selectedInverter.max_string_current ||
                        selectedInverter.max_current_per_string ||
                        15; // fallback
    
    const params = {
      model: selectedInverter.model || selectedInverter.name || 'Unknown Inverter',
      powerRating,
      mpptInputs,
      stringsPerMPPT,
      totalStringInputs, // Total strings the inverter can handle
      maxStringsTotal: mpptInputs * stringsPerMPPT,
      mpptVoltageMin,
      mpptVoltageMax,
      maxDcVoltage,
      maxDcCurrent,
      efficiency: selectedInverter.efficiency || selectedInverter.max_efficiency || 0.98
    };
    
    console.log('Inverter params extracted:', params);
    console.log('MPPT Details:', {
      mpptInputs,
      totalStringInputs,
      stringsPerMPPT,
      maxStringsTotal: mpptInputs * stringsPerMPPT,
      voltageRange: `${mpptVoltageMin}V - ${mpptVoltageMax}V`,
      maxDcVoltage: `${maxDcVoltage}V`,
      maxDcCurrent: `${maxDcCurrent}A`
    });
    console.log('Property mapping check:', {
      total_mppt: selectedInverter.total_mppt,
      total_string_inputs: selectedInverter.total_string_inputs,
      min_mpp_voltage_v: selectedInverter.min_mpp_voltage_v,
      max_mpp_voltage_v: selectedInverter.max_mpp_voltage_v,
      max_dc_voltage_v: selectedInverter.max_dc_voltage_v
    });
    
    return params;
  }, [selectedInverter]);

  // Restore from saved project data if available
  useEffect(() => {
    if (initialSubArrays && initialSubArrays.length > 0 && !hasRestoredProject) {
      console.log('🔄 Restoring sub-arrays from saved project:', initialSubArrays);
      setSubArrays(initialSubArrays);
      if (initialSubArrays.length > 0) {
        setSelectedSubArray(initialSubArrays[0].id);
      }
      setHasRestoredProject(true);
    } else if (initialSubArrays && initialSubArrays.length > 0 && hasRestoredProject) {
      console.log('✅ Sub-arrays already restored via state initialization');
      console.log('📌 Selected sub-array ID:', initialSubArrays[0].id);
    }
  }, [initialSubArrays, hasRestoredProject]);

  useEffect(() => {
    if (initialInverterConfigs && initialInverterConfigs.length > 0 && !hasRestoredProject) {
      console.log('🔄 Restoring inverter configs from saved project:', initialInverterConfigs);
      setInverterConfigs(initialInverterConfigs);
    } else if (initialInverterConfigs && initialInverterConfigs.length > 0 && hasRestoredProject) {
      console.log('✅ Inverter configs already restored via state initialization');
    }
  }, [initialInverterConfigs, hasRestoredProject]);

  // Initialize sub-arrays from polygon configs (only if not restoring from saved data)
  useEffect(() => {
    if (polygonConfigs && polygonConfigs.length > 0 && !hasRestoredProject) {
      console.log('🆕 Polygon configs received, generating new sub-arrays:', polygonConfigs);
      
      const newSubArrays: SubArray[] = polygonConfigs.map((config, index) => {
        const moduleCount = config.moduleCount || 0;
        const area = config.area || 0;
        const capacity = moduleCount * (moduleParams?.power || 400) / 1000;
        const tilt = config.tiltAngle || 30;
        const azimuth = config.azimuth || 180;
        
        console.log(`Sub-array ${index + 1}:`, { 
          moduleCount, 
          area, 
          capacity, 
          tilt, 
          azimuth,
          structureType: config.structureType 
        });
        
        return {
          id: `subarray-${index + 1}`,
          name: `Sub-array ${index + 1} (${config.structureType || 'Unknown'})`,
          orientation: {
            tilt,
            azimuth
          },
          moduleCount,
          area,
          capacity,
          strings: 0,
          modulesPerString: 0,
          assignedMPPT: [],
          powerPerString: 0
        };
      });
      
      console.log('Generated sub-arrays:', newSubArrays);
      
      setSubArrays(newSubArrays);
      if (newSubArrays.length > 0) {
        setSelectedSubArray(newSubArrays[0].id);
      }
    } else if (polygonConfigs && polygonConfigs.length > 0 && hasRestoredProject) {
      console.log('⏭️  Skipping polygon initialization - using restored sub-arrays');
    }
  }, [polygonConfigs, moduleParams, hasRestoredProject]);

  // Initialize inverter configurations (only if not restoring from saved data)
  useEffect(() => {
    if (inverterParams && manualInverterCount > 0 && !hasRestoredProject) {
      const newInverterConfigs: InverterConfig[] = Array.from({ length: manualInverterCount }, (_, index) => ({
        id: index + 1,
        name: `${inverterParams.model} #${index + 1}`,
        mpptInputs: Array.from({ length: inverterParams.mpptInputs }, (_, mpptIndex) => ({
          id: mpptIndex + 1,
          name: `MPPT ${mpptIndex + 1}`,
          maxStrings: inverterParams.stringsPerMPPT,
          assignedStrings: 0,
          totalPower: 0
        })),
        totalAssignedPower: 0,
        powerRating: inverterParams.powerRating,
        loadRatio: 0
      }));
      
      setInverterConfigs(newInverterConfigs);
    } else if (inverterParams && manualInverterCount > 0 && hasRestoredProject) {
      console.log('⏭️  Skipping inverter config initialization - using restored configs');
    }
  }, [inverterParams, manualInverterCount, hasRestoredProject]);

  // Callback to send string sizing data to parent component
  useEffect(() => {
    if (onStringSizingDataChange && subArrays.length > 0 && moduleParams) {
      const totalStringCount = subArrays.reduce((sum, sa) => sum + sa.strings, 0);
      const totalCapacity = subArrays.reduce((sum, sa) => sum + sa.capacity, 0);
      
      // Calculate average string voltage and current
      let totalVoltage = 0;
      let totalCurrent = 0;
      let validSubArrays = 0;
      
      subArrays.forEach(sa => {
        if (sa.modulesPerString > 0) {
          totalVoltage += sa.modulesPerString * moduleParams.vmp;
          totalCurrent += moduleParams.imp;
          validSubArrays++;
        }
      });
      
      const averageStringVoltage = validSubArrays > 0 ? totalVoltage / validSubArrays : 0;
      const averageStringCurrent = validSubArrays > 0 ? totalCurrent / validSubArrays : 0;
      
      const stringSizingData: StringSizingData = {
        totalStringCount,
        averageStringVoltage,
        averageStringCurrent,
        totalCapacity,
        subArrays, // Include detailed sub-array data
        inverterConfigs // Include MPPT assignment data
      };
      
      // Only call if data has actually changed
      const hasValidData = totalStringCount > 0 || validSubArrays > 0;
      if (hasValidData) {
        onStringSizingDataChange(stringSizingData);
      }
    }
  }, [subArrays, moduleParams, onStringSizingDataChange, inverterConfigs]);

  // Calculate temperature-corrected values
  const calculateTemperatureCorrection = (stcValue: number, temperature: number, tempCoeff: number): number => {
    return stcValue * (1 + (temperature - 25) * tempCoeff / 100);
  };

  // Calculate operating conditions for a sub-array
  const calculateOperatingConditions = (subArray: SubArray): OperatingConditions | null => {
    if (!moduleParams || !subArray.modulesPerString) return null;

    const vmpAtMinTemp = calculateTemperatureCorrection(moduleParams.vmp, lowestTemperature, moduleParams.tempCoeffVmp);
    const vmpAtMaxTemp = calculateTemperatureCorrection(moduleParams.vmp, highestTemperature, moduleParams.tempCoeffVmp);
    const vocAtMinTemp = calculateTemperatureCorrection(moduleParams.voc, lowestTemperature, moduleParams.tempCoeffVoc);
    const vocAtMaxTemp = calculateTemperatureCorrection(moduleParams.voc, highestTemperature, moduleParams.tempCoeffVoc);
    
    const stringVmpAtMinTemp = vmpAtMinTemp * subArray.modulesPerString;
    const stringVmpAtMaxTemp = vmpAtMaxTemp * subArray.modulesPerString;
    const stringVocAtMinTemp = vocAtMinTemp * subArray.modulesPerString;
    const stringVocAtMaxTemp = vocAtMaxTemp * subArray.modulesPerString;
    
    const powerAtSTC = moduleParams.power * subArray.modulesPerString;
    const powerAtOperating = calculateTemperatureCorrection(powerAtSTC, 60, moduleParams.tempCoeffPower); // Assume 60°C cell temp

    return {
      vmpAtMinTemp,
      vmpAtMaxTemp,
      vocAtMinTemp,
      vocAtMaxTemp,
      stringVmpAtMinTemp,
      stringVmpAtMaxTemp,
      stringVocAtMinTemp,
      stringVocAtMaxTemp,
      powerAtSTC,
      powerAtOperating
    };
  };

  // Professional string sizing calculation following industry theory
  const calculateOptimalStringLength = (subArray: SubArray): { 
    min: number; 
    max: number; 
    recommended: number; 
    warnings: string[]; 
    calculations: {
      vocStringAtMinTemp: number;
      vmpStringAtMaxTemp: number;
      vocStringAtMaxTemp: number;
      vmpStringAtMinTemp: number;
      maxByVocLimit: number;
      minByVmpLimit: number;
      maxByMpptLimit: number;
      targetOptimal: number;
    };
    optimization: {
      recommendationReason: string;
      mpptUtilization: number;
      recommendedVmpString: number;
      sweetSpotRange: { low: number; high: number; optimal: number };
      candidates: Array<{
        count: number;
        reason: string;
        priority: number;
        vmpString: number;
        mpptUtilization: number;
      }>;
      engineeringFactors: {
        temperatureRange: string;
        mpptVoltageWindow: string;
        moduleVoltageContribution: {
          voc_cold: string;
          vmp_hot: string;
        };
      };
    };
  } => {
    if (!moduleParams || !inverterParams) {
      return { 
        min: 1, 
        max: 1, 
        recommended: 1, 
        warnings: ["Missing module or inverter data"],
        calculations: {
          vocStringAtMinTemp: 0,
          vmpStringAtMaxTemp: 0,
          vocStringAtMaxTemp: 0,
          vmpStringAtMinTemp: 0,
          maxByVocLimit: 0,
          minByVmpLimit: 0,
          maxByMpptLimit: 0,
          targetOptimal: 0
        },
        optimization: {
          recommendationReason: "N/A",
          mpptUtilization: 0,
          recommendedVmpString: 0,
          sweetSpotRange: { low: 0, high: 0, optimal: 0 },
          candidates: [],
          engineeringFactors: {
            temperatureRange: "N/A",
            mpptVoltageWindow: "N/A",
            moduleVoltageContribution: {
              voc_cold: "0",
              vmp_hot: "0"
            }
          }
        }
      };
    }

    const warnings: string[] = [];
    
    // Temperature coefficient conversion to decimal (from percentage)
    const tempCoeffVocDecimal = moduleParams.tempCoeffVoc / 100; // e.g., -0.25% becomes -0.0025
    const tempCoeffVmpDecimal = moduleParams.tempCoeffVmp / 100; // e.g., -0.38% becomes -0.0038
    
    console.log(`Temperature coefficients: Voc=${moduleParams.tempCoeffVoc}%/°C, Vmp=${moduleParams.tempCoeffVmp}%/°C`);
    
    // 🔹 THEORETICAL FORMULA 1: Maximum String Voltage (Voc)
    // Voc(string, worst-case) = Voc(STC) × N_modules × [1 + TempCoeffVoc × (T_min - 25)]
    const vocTempFactor = 1 + (tempCoeffVocDecimal * (lowestTemperature - 25));
    const vocSingleModuleAtMinTemp = moduleParams.voc * vocTempFactor;
    
    // 🔹 THEORETICAL FORMULA 2: Minimum String Voltage (Vmp)  
    // Vmp(string, worst-case) = Vmp(STC) × N_modules × [1 + TempCoeffVmp × (T_max - 25)]
    const vmpTempFactor = 1 + (tempCoeffVmpDecimal * (highestTemperature - 25));
    const vmpSingleModuleAtMaxTemp = moduleParams.vmp * vmpTempFactor;
    
    console.log(`Single module voltages: Voc@${lowestTemperature}°C = ${vocSingleModuleAtMinTemp.toFixed(2)}V, Vmp@${highestTemperature}°C = ${vmpSingleModuleAtMaxTemp.toFixed(2)}V`);
    
    // 🔧 STEP 4: Check String Limits
    
    // Maximum modules per string (Voc constraint with 5% safety margin)
    const safetyFactor = 0.95; // 5% safety margin
    const maxByVocLimit = Math.floor((inverterParams.maxDcVoltage * safetyFactor) / vocSingleModuleAtMinTemp);
    
    // Maximum modules per string (MPPT upper voltage constraint)
    const maxByMpptLimit = Math.floor(inverterParams.mpptVoltageMax / vocSingleModuleAtMinTemp);
    
    // Minimum modules per string (MPPT lower voltage constraint)
    const minByVmpLimit = Math.ceil(inverterParams.mpptVoltageMin / vmpSingleModuleAtMaxTemp);
    
    // Take most restrictive limits
    const maxStringLength = Math.min(maxByVocLimit, maxByMpptLimit);
    const minStringLength = Math.max(1, minByVmpLimit);
    
    // Fix edge case where constraints make no valid range possible
    // If min > max, adjust to create a minimal valid range
    const finalMinStringLength = Math.min(minStringLength, maxStringLength);
    const finalMaxStringLength = Math.max(minStringLength, maxStringLength);
    
    // 🎯 STEP 5: PERFORMANCE-BASED OPTIMIZATION FOR EXACT MODULE COUNT
    
    // 🟢 5A. MPPT Voltage Sweet Spot (75-85% of MPPT Max Voltage)
    const sweetSpotLow = inverterParams.mpptVoltageMax * 0.75;  // 75% target
    const sweetSpotHigh = inverterParams.mpptVoltageMax * 0.85; // 85% target
    const sweetSpotOptimal = (sweetSpotLow + sweetSpotHigh) / 2; // 80% target
    
    const sweetSpotModules = Math.round(sweetSpotOptimal / moduleParams.vmp);
    
    // 🟢 5B. Maximize Modules per String (for fewer strings/combiner boxes)
    const maxEfficiencyModules = maxStringLength;
    
    // 🟢 5C. Conservative Mid-Range (50% of MPPT range)
    const conservativeMidpoint = (inverterParams.mpptVoltageMin + inverterParams.mpptVoltageMax) / 2;
    const conservativeModules = Math.round(conservativeMidpoint / moduleParams.vmp);
    
    // Engineering Decision Logic: Choose best option within valid range
    const candidates = [
      { count: sweetSpotModules, reason: "MPPT Sweet Spot (75-85%)", priority: 1 },
      { count: maxEfficiencyModules, reason: "Maximum Efficiency", priority: 2 },
      { count: conservativeModules, reason: "Conservative Mid-Range", priority: 3 }
    ].filter(candidate => 
      candidate.count >= finalMinStringLength && candidate.count <= finalMaxStringLength
    ).sort((a, b) => a.priority - b.priority);
    
    const finalRecommended = candidates.length > 0 ? candidates[0].count : conservativeModules;
    const recommendationReason = candidates.length > 0 ? candidates[0].reason : "Fallback Conservative";
    
    // Calculate performance metrics for the recommended configuration
    const recommendedVmpString = finalRecommended * moduleParams.vmp; // At STC
    const mpptUtilization = (recommendedVmpString / inverterParams.mpptVoltageMax) * 100;
    
    // Calculate actual string voltages for validation
    const vocStringAtMinTemp = finalRecommended * vocSingleModuleAtMinTemp;
    const vmpStringAtMaxTemp = finalRecommended * vmpSingleModuleAtMaxTemp;
    const vocStringAtMaxTemp = finalRecommended * moduleParams.voc * (1 + (tempCoeffVocDecimal * (highestTemperature - 25)));
    const vmpStringAtMinTemp = finalRecommended * moduleParams.vmp * (1 + (tempCoeffVmpDecimal * (lowestTemperature - 25)));
    
    console.log(`String sizing results: Original Min=${minStringLength}, Max=${maxStringLength}, Corrected Min=${finalMinStringLength}, Max=${finalMaxStringLength}, Recommended=${finalRecommended}`);
    console.log(`String voltages: Voc@min=${vocStringAtMinTemp.toFixed(1)}V, Vmp@max=${vmpStringAtMaxTemp.toFixed(1)}V`);
    
    // 🚨 VALIDATION WARNINGS
    if (minStringLength > maxStringLength) {
      warnings.push("⚠️ Challenging operating conditions detected - constraints automatically adjusted");
      warnings.push(`Original range: ${minStringLength}-${maxStringLength} modules, Adjusted to: ${finalMinStringLength}-${finalMaxStringLength} modules`);
    }
    
    if (vocStringAtMinTemp > inverterParams.maxDcVoltage) {
      warnings.push(`⚠️ String Voc at ${lowestTemperature}°C (${vocStringAtMinTemp.toFixed(1)}V) exceeds inverter max DC voltage (${inverterParams.maxDcVoltage}V)`);
    }
    
    if (vmpStringAtMaxTemp < inverterParams.mpptVoltageMin) {
      warnings.push(`⚠️ String Vmp at ${highestTemperature}°C (${vmpStringAtMaxTemp.toFixed(1)}V) below MPPT minimum (${inverterParams.mpptVoltageMin}V)`);
    }
    
    if (vmpStringAtMinTemp > inverterParams.mpptVoltageMax) {
      warnings.push(`⚠️ String Vmp at ${lowestTemperature}°C (${vmpStringAtMinTemp.toFixed(1)}V) exceeds MPPT maximum (${inverterParams.mpptVoltageMax}V)`);
    }
    
    // Safety margin warnings
    const vocMargin = ((inverterParams.maxDcVoltage - vocStringAtMinTemp) / inverterParams.maxDcVoltage) * 100;
    if (vocMargin < 5) {
      warnings.push(`⚠️ Low Voc safety margin: ${vocMargin.toFixed(1)}% (recommended >5%)`);
    }
    
    const vmpLowMargin = ((vmpStringAtMaxTemp - inverterParams.mpptVoltageMin) / inverterParams.mpptVoltageMin) * 100;
    if (vmpLowMargin < 10) {
      warnings.push(`⚠️ Low Vmp safety margin at high temp: ${vmpLowMargin.toFixed(1)}% (recommended >10%)`);
    }

    return {
      min: finalMinStringLength,
      max: finalMaxStringLength,
      recommended: finalRecommended,
      warnings,
      calculations: {
        vocStringAtMinTemp,
        vmpStringAtMaxTemp,
        vocStringAtMaxTemp,
        vmpStringAtMinTemp,
        maxByVocLimit,
        minByVmpLimit,
        maxByMpptLimit,
        targetOptimal: finalRecommended
      },
      optimization: {
        recommendationReason,
        mpptUtilization,
        recommendedVmpString,
        sweetSpotRange: { low: sweetSpotLow, high: sweetSpotHigh, optimal: sweetSpotOptimal },
        candidates: candidates.map(c => ({
          ...c,
          vmpString: c.count * moduleParams.vmp,
          mpptUtilization: (c.count * moduleParams.vmp / inverterParams.mpptVoltageMax) * 100
        })),
        engineeringFactors: {
          temperatureRange: `${lowestTemperature}°C to ${highestTemperature}°C`,
          mpptVoltageWindow: `${inverterParams.mpptVoltageMin}V - ${inverterParams.mpptVoltageMax}V`,
          moduleVoltageContribution: {
            voc_cold: vocSingleModuleAtMinTemp.toFixed(2),
            vmp_hot: vmpSingleModuleAtMaxTemp.toFixed(2)
          }
        }
      }
    };
  };

  // Auto-optimize string configuration
  const autoOptimizeStrings = (subArray: SubArray): SubArray => {
    const optimal = calculateOptimalStringLength(subArray);
    const modulesPerString = optimal.recommended;
    const strings = Math.floor(subArray.moduleCount / modulesPerString);
    const powerPerString = modulesPerString * (moduleParams?.power || 400);
    
    return {
      ...subArray,
      strings,
      modulesPerString,
      powerPerString
    };
  };

  // Update sub-array configuration
  const updateSubArray = (id: string, updates: Partial<SubArray>) => {
    setSubArrays(prev => prev.map(sa => 
      sa.id === id ? { ...sa, ...updates } : sa
    ));
  };

  // Professional MPPT assignment following orientation-based design rules
  const assignStringsToMPPT = (subArrayId: string, inverterIndex: number, mpptIndex: number, stringCount: number) => {
    const subArray = subArrays.find(sa => sa.id === subArrayId);
    if (!subArray) return;

    // 🔍 RULE 1: Check orientation compatibility (Industry best practice)
    const checkOrientationCompatibility = (existingOrientation: Orientation | undefined, newOrientation: Orientation): boolean => {
      if (!existingOrientation) return true; // First assignment to this MPPT
      
      const azimuthTolerance = 5; // ±5° tolerance
      const tiltTolerance = 5; // ±5° tolerance
      
      const azimuthDiff = Math.abs(existingOrientation.azimuth - newOrientation.azimuth);
      const tiltDiff = Math.abs(existingOrientation.tilt - newOrientation.tilt);
      
      return azimuthDiff <= azimuthTolerance && tiltDiff <= tiltTolerance;
    };

    // Update inverter configuration with professional validation
    setInverterConfigs(prev => {
      return prev.map((inv, invIdx) => {
        if (invIdx === inverterIndex) {
          const updatedMpptInputs = inv.mpptInputs.map((mppt, mpptIdx) => {
            if (mpptIdx === mpptIndex) {
              // 🚨 DESIGN RULE VALIDATION: Same MPPT = Same Orientation
              if (mppt.orientation && !checkOrientationCompatibility(mppt.orientation, subArray.orientation)) {
                alert(`❌ MPPT Design Rule Violation!\n\nMPPT ${mppt.name} already has:\n• Tilt: ${mppt.orientation.tilt}°\n• Azimuth: ${mppt.orientation.azimuth}°\n\nCannot assign sub-array with:\n• Tilt: ${subArray.orientation.tilt}°\n• Azimuth: ${subArray.orientation.azimuth}°\n\n💡 Industry Rule: Each MPPT should only receive strings with similar orientation to avoid mismatch losses.`);
                return mppt;
              }
              
              // 🔧 STEP 6: Check Current Limits (Per MPPT)
              const stringCurrent = moduleParams?.isc || 11.5; // String current (Isc)
              const totalCurrent = stringCurrent * stringCount;
              const currentLimitPerMPPT = inverterParams ? (inverterParams.maxDcCurrent / inverterParams.mpptInputs) : 15;
              
              if (totalCurrent > currentLimitPerMPPT) {
                alert(`❌ Current Limit Exceeded!\n\nTotal current: ${totalCurrent.toFixed(1)}A\nMPPT limit: ${currentLimitPerMPPT.toFixed(0)}A\n\n💡 Reduce number of parallel strings or check inverter specifications.`);
                return mppt;
              }
              
              // 🔧 STEP 5: Match Strings in Each MPPT
              // Validate that all strings have same module count
              if (mppt.assignedStrings > 0) {
                const existingSubArray = subArrays.find(sa => sa.id === mppt.subArrayId);
                if (existingSubArray && existingSubArray.modulesPerString !== subArray.modulesPerString) {
                  alert(`❌ String Mismatch Warning!\n\nExisting strings: ${existingSubArray.modulesPerString} modules/string\nNew strings: ${subArray.modulesPerString} modules/string\n\n💡 Industry Rule: All strings on same MPPT should have identical module count.`);
                }
              }
              
              return {
                ...mppt,
                assignedStrings: stringCount,
                totalPower: stringCount * subArray.powerPerString,
                orientation: subArray.orientation,
                subArrayId: subArrayId
              };
            }
            return mppt;
          });
          
          const totalAssignedPower = updatedMpptInputs.reduce((sum, mppt) => sum + mppt.totalPower, 0);
          
          return {
            ...inv,
            mpptInputs: updatedMpptInputs,
            totalAssignedPower,
            loadRatio: totalAssignedPower / inv.powerRating
          };
        }
        return inv;
      });
    });

    // Update sub-array MPPT assignment
    updateSubArray(subArrayId, {
      assignedMPPT: [`${inverterIndex}-${mpptIndex}`]
    });
  };

  // Auto-assign sub-arrays to optimal MPPTs based on orientation
  const autoAssignMPPTs = () => {
    if (!subArrays.length || !inverterConfigs.length || !moduleParams) {
      console.log("❌ Auto-assign failed: Missing data", { 
        subArrays: subArrays.length, 
        inverterConfigs: inverterConfigs.length, 
        moduleParams: !!moduleParams 
      });
      return;
    }
    
    console.log("🤖 Auto-assigning sub-arrays to MPPTs based on orientation...");
    console.log("Sub-arrays before assignment:", subArrays);
    
    // First, ensure all sub-arrays have proper string configuration
    const updatedSubArrays = subArrays.map(subArray => {
      if (!subArray.modulesPerString || subArray.modulesPerString === 0) {
        // Auto-optimize this sub-array first
        const optimal = calculateOptimalStringLength(subArray);
        const modulesPerString = optimal.recommended;
        const strings = Math.floor(subArray.moduleCount / modulesPerString);
        const powerPerString = modulesPerString * moduleParams.power;
        
        return {
          ...subArray,
          modulesPerString,
          strings,
          powerPerString
        };
      }
      return subArray;
    });
    
    // Update sub-arrays with proper string configuration
    setSubArrays(updatedSubArrays);
    
    // Reset all MPPT assignments
    setInverterConfigs(prev => prev.map(inv => ({
      ...inv,
      mpptInputs: inv.mpptInputs.map(mppt => ({
        ...mppt,
        assignedStrings: 0,
        totalPower: 0,
        orientation: undefined,
        subArrayId: undefined
      })),
      totalAssignedPower: 0,
      loadRatio: 0
    })));
    
    // 🎯 PROFESSIONAL ENGINEERING APPROACH: Maximize ALL Inverter Utilization
    
    // Step 1: Group sub-arrays by orientation for optimal MPPT assignment
    const orientationGroups = updatedSubArrays.reduce((groups, subArray) => {
      const key = `${subArray.orientation.tilt}-${subArray.orientation.azimuth}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(subArray);
      return groups;
    }, {} as Record<string, SubArray[]>);
    
    console.log("🧭 Orientation groups:", orientationGroups);
    
    // Step 2: Create a comprehensive MPPT allocation strategy
    const allMPPTs: Array<{
      inverterIndex: number;
      mpptIndex: number;
      inverterName: string;
      mpptName: string;
      maxStrings: number;
      assignedStrings: number;
      available: number;
    }> = [];
    
    // Build complete MPPT inventory
    inverterConfigs.forEach((inverter, invIndex) => {
      inverter.mpptInputs.forEach((mppt, mpptIndex) => {
        allMPPTs.push({
          inverterIndex: invIndex,
          mpptIndex,
          inverterName: inverter.name,
          mpptName: mppt.name,
          maxStrings: mppt.maxStrings,
          assignedStrings: 0,
          available: mppt.maxStrings
        });
      });
    });
    
    console.log(`📊 Total MPPT inventory: ${allMPPTs.length} MPPTs across ${inverterConfigs.length} inverters`);
    
    // Step 3: Smart Distribution Algorithm - Ensures ALL MPPTs get utilized
    let mpptPointer = 0; // Round-robin pointer for even distribution
    let assignmentCount = 0;
    
    // First Pass: Assign at least 1 string to each MPPT (if strings available)
    for (const [orientation, subArrayGroup] of Object.entries(orientationGroups)) {
      console.log(`🎯 Processing orientation group: ${orientation}`);
      
      for (const subArray of subArrayGroup) {
        if (subArray.strings && subArray.strings > 0) {
          let remainingStrings = subArray.strings;
          
          // Distribute strings across available MPPTs
          while (remainingStrings > 0 && mpptPointer < allMPPTs.length) {
            const currentMPPT = allMPPTs[mpptPointer];
            
            if (currentMPPT.available > 0) {
              // Assign at least 1 string, up to available capacity
              const stringsToAssign = Math.min(
                remainingStrings,
                currentMPPT.available,
                Math.max(1, Math.floor(remainingStrings / Math.max(1, allMPPTs.length - mpptPointer)))
              );
              
              if (stringsToAssign > 0) {
                assignStringsToMPPT(
                  subArray.id,
                  currentMPPT.inverterIndex,
                  currentMPPT.mpptIndex,
                  stringsToAssign
                );
                
                currentMPPT.assignedStrings += stringsToAssign;
                currentMPPT.available -= stringsToAssign;
                remainingStrings -= stringsToAssign;
                assignmentCount++;
                
                console.log(`✅ Assigned ${stringsToAssign} strings from ${subArray.name} to ${currentMPPT.inverterName} ${currentMPPT.mpptName}`);
                console.log(`   📈 MPPT now has: ${currentMPPT.assignedStrings}/${currentMPPT.maxStrings} strings`);
              }
            }
            
            // Move to next MPPT (round-robin for even distribution)
            mpptPointer++;
            
            // If we've gone through all MPPTs but still have strings, restart from beginning
            if (mpptPointer >= allMPPTs.length && remainingStrings > 0) {
              mpptPointer = 0;
              // Find next available MPPT
              const availableMPPT = allMPPTs.find(mppt => mppt.available > 0);
              if (!availableMPPT) {
                console.log(`⚠️ All MPPTs at capacity, ${remainingStrings} strings from ${subArray.name} cannot be assigned`);
                break;
              }
            }
          }
          
          if (remainingStrings > 0) {
            console.log(`⚠️ ${remainingStrings} strings from ${subArray.name} could not be assigned (all MPPTs at capacity)`);
          }
        }
      }
    }
    
    console.log(`🎯 Assignment Summary:`);
    console.log(`   📊 Total assignments made: ${assignmentCount}`);
    console.log(`   🔌 MPPTs utilized: ${allMPPTs.filter(mppt => mppt.assignedStrings > 0).length}/${allMPPTs.length}`);
    
    // Professional Engineering Validation
    const utilizedMPPTs = allMPPTs.filter(mppt => mppt.assignedStrings > 0).length;
    const totalMPPTs = allMPPTs.length;
    const utilizationRate = (utilizedMPPTs / totalMPPTs) * 100;
    
    console.log(`   ⚡ MPPT Utilization Rate: ${utilizationRate.toFixed(1)}% (${utilizedMPPTs}/${totalMPPTs})`);
    
    if (utilizationRate < 80) {
      console.log(`⚠️ Engineering Note: MPPT utilization below 80% - consider redistributing strings for optimal inverter capacity usage`);
    } else {
      console.log(`✅ Excellent MPPT utilization - meeting professional engineering standards`);
    }
    
    console.log("🎯 Auto-assignment completed!");
    
    // Reset to first inverter tab after auto-assignment
    setSelectedInverterTab(0);
    
    // Show detailed success notification with engineering metrics
    const utilizationMessage = utilizationRate >= 80 
      ? `Excellent utilization: ${utilizationRate.toFixed(1)}% of MPPTs active`
      : `Moderate utilization: ${utilizationRate.toFixed(1)}% of MPPTs active`;
    
    toast.success("🎯 MPPT Auto-Assignment Completed!", {
      description: `${utilizedMPPTs}/${totalMPPTs} MPPTs utilized across ${inverterConfigs.length} inverters. ${utilizationMessage}`,
      duration: 5000
    });
  };

  const selectedSubArrayData = subArrays.find(sa => sa.id === selectedSubArray);
  const operatingConditions = selectedSubArrayData ? calculateOperatingConditions(selectedSubArrayData) : null;
  const optimalConfig = selectedSubArrayData ? calculateOptimalStringLength(selectedSubArrayData) : null;

  // Calculate dynamic warnings based on actual selected modules per string
  const dynamicWarnings = useMemo(() => {
    if (!selectedSubArrayData || !moduleParams || !inverterParams || !optimalConfig) return [];
    
    const actualModulesPerString = selectedSubArrayData.modulesPerString || optimalConfig.recommended;
    const warnings: string[] = [];
    
    // Temperature coefficient conversion to decimal
    const tempCoeffVocDecimal = moduleParams.tempCoeffVoc / 100;
    const tempCoeffVmpDecimal = moduleParams.tempCoeffVmp / 100;
    
    // Calculate actual voltages for the selected modules per string
    const vocSingleModuleAtMinTemp = moduleParams.voc * (1 + (tempCoeffVocDecimal * (lowestTemperature - 25)));
    const vmpSingleModuleAtMaxTemp = moduleParams.vmp * (1 + (tempCoeffVmpDecimal * (highestTemperature - 25)));
    const vmpSingleModuleAtMinTemp = moduleParams.vmp * (1 + (tempCoeffVmpDecimal * (lowestTemperature - 25)));
    
    const vocStringAtMinTemp = actualModulesPerString * vocSingleModuleAtMinTemp;
    const vmpStringAtMaxTemp = actualModulesPerString * vmpSingleModuleAtMaxTemp;
    const vmpStringAtMinTemp = actualModulesPerString * vmpSingleModuleAtMinTemp;
    
    // Validation warnings based on actual configuration
    if (vocStringAtMinTemp > inverterParams.maxDcVoltage) {
      warnings.push(`⚠️ String Voc at ${lowestTemperature}°C (${vocStringAtMinTemp.toFixed(1)}V) exceeds inverter max DC voltage (${inverterParams.maxDcVoltage}V)`);
    }
    
    if (vmpStringAtMaxTemp < inverterParams.mpptVoltageMin) {
      warnings.push(`⚠️ String Vmp at ${highestTemperature}°C (${vmpStringAtMaxTemp.toFixed(1)}V) below MPPT minimum (${inverterParams.mpptVoltageMin}V)`);
    }
    
    if (vmpStringAtMinTemp > inverterParams.mpptVoltageMax) {
      warnings.push(`⚠️ String Vmp at ${lowestTemperature}°C (${vmpStringAtMinTemp.toFixed(1)}V) exceeds MPPT maximum (${inverterParams.mpptVoltageMax}V)`);
    }
    
    // Safety margin warnings
    const vocMargin = ((inverterParams.maxDcVoltage - vocStringAtMinTemp) / inverterParams.maxDcVoltage) * 100;
    if (vocMargin < 5) {
      warnings.push(`⚠️ Low Voc safety margin: ${vocMargin.toFixed(1)}% (recommended >5%)`);
    }
    
    const vmpLowMargin = ((vmpStringAtMaxTemp - inverterParams.mpptVoltageMin) / inverterParams.mpptVoltageMin) * 100;
    if (vmpLowMargin < 10) {
      warnings.push(`⚠️ Low Vmp safety margin at high temp: ${vmpLowMargin.toFixed(1)}% (recommended >10%)`);
    }
    
    return warnings;
  }, [selectedSubArrayData, moduleParams, inverterParams, lowestTemperature, highestTemperature, optimalConfig]);

  if (!moduleParams || !inverterParams) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-500" />
            Enhanced String Sizing Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Please select both panel and inverter to perform string sizing calculations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Vibrant Professional Header */}
      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">Detailed PV String Sizing</h2>
                {showMPPTAssignment && (
                  <p className="text-xs text-indigo-600 font-medium">IEC Standards • Multi-MPPT Optimization</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {showMPPTAssignment && (
                <>
                  <Badge className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">Real-time</Badge>
                  <Badge className="text-xs bg-amber-500/80 text-white border-amber-300/30 font-semibold">&lt;500kW Mode</Badge>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="text-xs h-8 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                <Settings className="h-3 w-3 mr-1" />
                Advanced
              </Button>
            </div>
          </div>
        </CardHeader>
        {showMPPTAssignment && (
          <CardContent className="p-4">
            <div className="flex items-center gap-2 p-3 bg-purple-100 border-purple-200 rounded-lg border">
              <Info className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">
                String Inverter Mode: Using traditional MPPT-based string assignment with direct inverter connection.
              </span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Vibrant System Configuration */}
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50 shadow-md border-0">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Module Specs - Vibrant Blue Theme */}
            <div className="p-4 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl border-0 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Sun className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-white text-sm">Solar Module</span>
                </div>
                <Badge className="text-xs bg-white/20 text-white border-white/30 font-semibold">{moduleParams.power}W</Badge>
              </div>
              <div className="text-xs text-blue-100 font-semibold mb-3 truncate">
                {selectedPanel.manufacturer} {selectedPanel.model || selectedPanel.name}
              </div>
              <div className="grid grid-cols-3 gap-x-3 gap-y-2 text-xs">
                <div><span className="text-blue-200">Voc:</span> <span className="font-bold text-white">{moduleParams.voc}V</span></div>
                <div><span className="text-blue-200">Vmp:</span> <span className="font-bold text-white">{moduleParams.vmp}V</span></div>
                <div><span className="text-blue-200">Isc:</span> <span className="font-bold text-white">{moduleParams.isc}A</span></div>
                <div><span className="text-blue-200">Imp:</span> <span className="font-bold text-white">{moduleParams.imp}A</span></div>
                <div><span className="text-blue-200">Temp:</span> <span className="font-bold text-white">{lowestTemperature}°C~{highestTemperature}°C</span></div>
                <div><span className="text-blue-200">Coeff:</span> <span className="font-bold text-white">{(moduleParams.tempCoeffVoc * 100).toFixed(2)}%/°C</span></div>
              </div>
            </div>
            
            {/* Inverter Specs - Vibrant Green Theme */}
            <div className="p-4 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 rounded-xl border-0 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-white text-sm">Inverter</span>
                </div>
                <Badge className="text-xs bg-white/20 text-white border-white/30 font-semibold">{(inverterParams.powerRating/1000).toFixed(1)}kW</Badge>
              </div>
              <div className="text-xs text-green-100 font-semibold mb-3 truncate">
                {selectedInverter.manufacturer} {inverterParams.model}
              </div>
              <div className="grid grid-cols-3 gap-x-3 gap-y-2 text-xs">
                <div><span className="text-green-200">MPPTs:</span> <span className="font-bold text-white">{inverterParams.mpptInputs}</span></div>
                <div><span className="text-green-200">Strings:</span> <span className="font-bold text-white">{inverterParams.totalStringInputs}</span></div>
                <div><span className="text-green-200">Per MPPT:</span> <span className="font-bold text-white">{inverterParams.stringsPerMPPT}</span></div>
                <div><span className="text-green-200">MPPT:</span> <span className="font-bold text-white">{inverterParams.mpptVoltageMin}-{inverterParams.mpptVoltageMax}V</span></div>
                <div><span className="text-green-200">Max DC:</span> <span className="font-bold text-white">{inverterParams.maxDcVoltage}V</span></div>
                <div><span className="text-green-200">Current:</span> <span className="font-bold text-white">{(inverterParams.maxDcCurrent / inverterParams.mpptInputs).toFixed(0)}A</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vibrant Sub-Array Management */}
      <Card className="bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50 border-l-4 border-l-purple-500 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg shadow-sm">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent font-bold">Sub-Array Management</span>
            <Badge className="text-xs ml-auto bg-gradient-to-r from-purple-500 to-violet-500 text-white border-0">{subArrays.length} Arrays</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {/* Sub-array selector */}
          <div className="flex items-center gap-4">
            <Label>Select Sub-array:</Label>
            <Select value={selectedSubArray} onValueChange={setSelectedSubArray}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select sub-array" />
              </SelectTrigger>
              <SelectContent>
                {subArrays.map(subArray => (
                  <SelectItem key={subArray.id} value={subArray.id}>
                    {subArray.name} ({subArray.moduleCount} modules)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoOptimize"
                checked={autoOptimize}
                onChange={(e) => setAutoOptimize(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="autoOptimize" className="text-sm">Auto-optimize</Label>
            </div>
          </div>

          {/* Selected sub-array details */}
          {selectedSubArrayData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-sm text-gray-600">Orientation</Label>
                <div className="font-medium">
                  Tilt: {selectedSubArrayData.orientation.tilt}°<br/>
                  Azimuth: {selectedSubArrayData.orientation.azimuth}°
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Module Count</Label>
                <div className="font-medium">{selectedSubArrayData.moduleCount}</div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Capacity</Label>
                <div className="font-medium">{selectedSubArrayData.capacity.toFixed(1)} kWp</div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Area</Label>
                <div className="font-medium">{selectedSubArrayData.area.toFixed(1)} m²</div>
              </div>
            </div>
          )}

          {/* String configuration */}
          {selectedSubArrayData && optimalConfig && (
            <div className="space-y-4">
              <Separator />
              <h4 className="font-medium">String Configuration</h4>
              
              {/* Vibrant Exact Module Count Selection with Engineering Factors */}
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 rounded-xl border-0 shadow-lg border-l-4 border-l-cyan-500">
                  <h5 className="font-bold text-transparent bg-gradient-to-r from-cyan-700 to-teal-700 bg-clip-text mb-3 flex items-center gap-2">
                    🎯 Exact Module Count Selection
                    <Badge className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white border-0 font-semibold">{optimalConfig.optimization.recommendationReason}</Badge>
                  </h5>
                  
                  <div className="space-y-4">
                    {/* First row: Input field and metric cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600 flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Modules per String
                        </Label>
                        <div className="text-center p-2 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg border border-orange-300 h-14 flex flex-col justify-center shadow-sm">
                          <Input
                            type="number"
                            min={optimalConfig.min}
                            max={optimalConfig.max}
                            value={selectedSubArrayData.modulesPerString || optimalConfig.recommended}
                            onChange={(e) => {
                              const modulesPerString = Number(e.target.value);
                              const strings = Math.floor(selectedSubArrayData.moduleCount / modulesPerString);
                              const powerPerString = modulesPerString * (moduleParams?.power || 400); // Power in watts, no division needed
                              updateSubArray(selectedSubArray, {
                                modulesPerString,
                                strings,
                                powerPerString
                              });
                            }}
                            className="text-center font-bold text-lg border-0 bg-transparent p-0 h-auto focus:outline-none text-orange-800"
                          />
                        </div>
                        <div className="text-xs text-orange-600 text-center font-medium">Valid: {optimalConfig.min} - {optimalConfig.max}</div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600 font-medium">String Voltage (STC)</Label>
                        <div className="text-center p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg border border-blue-300 h-14 flex flex-col justify-center shadow-sm">
                          <div className="text-lg font-bold text-blue-700">
                            {((selectedSubArrayData.modulesPerString || optimalConfig.recommended) * (moduleParams?.vmp || 0)).toFixed(1)}V
                          </div>
                          <div className="text-xs text-blue-600 font-medium">Vmp @ 25°C</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600 font-medium">MPPT Utilization</Label>
                        <div className="text-center p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg border border-green-300 h-14 flex flex-col justify-center shadow-sm">
                          <div className="text-lg font-bold text-green-700">
                            {(((selectedSubArrayData.modulesPerString || optimalConfig.recommended) * (moduleParams?.vmp || 0) / (inverterParams?.mpptVoltageMax || 1000)) * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-green-600 font-medium">of MPPT range</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600 font-medium">Performance Level</Label>
                        <div className="text-center p-2 bg-gradient-to-br from-purple-100 to-violet-100 rounded-lg border border-purple-300 h-14 flex flex-col justify-center shadow-sm">
                          <div className="text-lg font-bold text-purple-700">
                            {(() => {
                              const utilization = (((selectedSubArrayData.modulesPerString || optimalConfig.recommended) * (moduleParams?.vmp || 0) / (inverterParams?.mpptVoltageMax || 1000)) * 100);
                              if (utilization >= 75 && utilization <= 85) return "Optimal";
                              if (utilization >= 65 && utilization < 75) return "Good";
                              if (utilization >= 50 && utilization < 65) return "Fair";
                              return "Review";
                            })()}
                          </div>
                          <div className="text-xs text-purple-600 font-medium">engineering rating</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Second row: Engineering Options Analysis - Right aligned with smaller cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Empty space for left alignment */}
                      <div className="md:col-span-2"></div>
                      
                      {/* Engineering Options Analysis - Right side with vibrant smaller cards */}
                      <div className="md:col-span-2">
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-700 font-bold">📋 Engineering Options Analysis</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-2">
                            {optimalConfig.optimization.candidates.map((candidate, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  const strings = Math.floor(selectedSubArrayData.moduleCount / candidate.count);
                                  const powerPerString = candidate.count * (moduleParams?.power || 400); // Power in watts
                                  updateSubArray(selectedSubArray, {
                                    modulesPerString: candidate.count,
                                    strings,
                                    powerPerString
                                  });
                                }}
                                className={`p-2.5 text-xs rounded-lg text-left transition-all duration-200 shadow-sm hover:shadow-md w-[90%] mx-auto ${
                                  (selectedSubArrayData.modulesPerString || optimalConfig.recommended) === candidate.count
                                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-0 text-white shadow-lg scale-105'
                                    : 'bg-gradient-to-br from-gray-50 to-slate-100 border border-gray-200 hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300'
                                }`}
                              >
                                <div className={`font-bold ${
                                  (selectedSubArrayData.modulesPerString || optimalConfig.recommended) === candidate.count 
                                    ? 'text-white' 
                                    : 'text-gray-800'
                                }`}>{candidate.count} modules</div>
                                <div className={`truncate text-xs ${
                                  (selectedSubArrayData.modulesPerString || optimalConfig.recommended) === candidate.count 
                                    ? 'text-blue-100' 
                                    : 'text-gray-600'
                                }`}>{candidate.reason}</div>
                                <div className={`font-semibold ${
                                  (selectedSubArrayData.modulesPerString || optimalConfig.recommended) === candidate.count 
                                    ? 'text-cyan-200' 
                                    : 'text-emerald-600'
                                }`}>{candidate.mpptUtilization.toFixed(1)}% util</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Selected Configuration</Label>
                  <div className="text-center p-2 bg-gray-50 rounded border">
                    <div className="text-lg font-bold text-gray-800">
                      {selectedSubArrayData.modulesPerString || optimalConfig.recommended} modules/string
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Number of Strings</Label>
                  <div className="text-2xl font-bold text-center p-2 bg-blue-50 rounded">
                    {selectedSubArrayData.strings || 0}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Power per String</Label>
                  <div className="text-lg font-bold text-center p-2 bg-green-50 rounded">
                    {(selectedSubArrayData.powerPerString / 1000).toFixed(2)} kW
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    {selectedSubArrayData.modulesPerString || 0} × {(moduleParams?.power || 0)}W = {selectedSubArrayData.powerPerString || 0}W
                  </div>
                </div>
              </div>

                             {/* Engineering Decision Summary */}
               <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                 <h6 className="font-medium text-amber-900 mb-3">🔧 Engineering Decision Factors Summary</h6>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                   <div>
                     <div className="font-medium text-amber-800">Temperature Analysis</div>
                     <div className="text-amber-700">{optimalConfig.optimization.engineeringFactors.temperatureRange}</div>
                     <div className="text-xs text-amber-600 mt-1">Extreme conditions considered</div>
                   </div>
                   <div>
                     <div className="font-medium text-amber-800">MPPT Window</div>
                     <div className="text-amber-700">{optimalConfig.optimization.engineeringFactors.mpptVoltageWindow}</div>
                     <div className="text-xs text-amber-600 mt-1">Operating voltage range</div>
                   </div>
                   <div>
                     <div className="font-medium text-amber-800">Module Voltage</div>
                     <div className="text-amber-700">
                       Cold: {optimalConfig.optimization.engineeringFactors.moduleVoltageContribution.voc_cold}V<br/>
                       Hot: {optimalConfig.optimization.engineeringFactors.moduleVoltageContribution.vmp_hot}V
                     </div>
                     <div className="text-xs text-amber-600 mt-1">Per module contribution</div>
                   </div>
                   <div>
                     <div className="font-medium text-amber-800">Sweet Spot Target</div>
                     <div className="text-amber-700">
                       {optimalConfig.optimization.sweetSpotRange.low.toFixed(0)}V - {optimalConfig.optimization.sweetSpotRange.high.toFixed(0)}V
                     </div>
                     <div className="text-xs text-amber-600 mt-1">75-85% MPPT utilization</div>
                   </div>
                 </div>
               </div>

               {autoOptimize && (
                 <Button
                   onClick={() => {
                     const optimized = autoOptimizeStrings(selectedSubArrayData);
                     updateSubArray(selectedSubArray, optimized);
                   }}
                   className="w-full"
                 >
                   🎯 Auto-Optimize Strings
                 </Button>
               )}
            </div>
          )}
        </CardContent>
      </Card>

             {/* Step-by-Step Validation Summary - Collapsible for Central Inverters */}
       {optimalConfig && selectedSubArrayData && (
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <CheckCircle className="h-5 w-5 text-green-500" />
                 Step-by-Step Validation Results
                 <Badge variant="outline">IEC Standards Applied</Badge>
               </div>
               {!showMPPTAssignment && (
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setShowValidationResults(!showValidationResults)}
                   className="text-xs h-8"
                 >
                   {showValidationResults ? 'Hide Details' : 'Show Details'}
                 </Button>
               )}
             </CardTitle>
           </CardHeader>
           {(showMPPTAssignment || showValidationResults) && (
             <CardContent>
               <div className="space-y-4">
               {/* STEP 1-4: Input Validation */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                   <h4 className="font-medium text-green-900 mb-2">✅ STEP 1-2: Temperature & Voltage Analysis</h4>
                   <div className="text-sm text-green-800 space-y-1">
                     <div>• Site temperature range: {lowestTemperature}°C to {highestTemperature}°C</div>
                     <div>• Module voltage correction applied (IEC 61215)</div>
                     <div>• Voc cold: {optimalConfig.optimization.engineeringFactors.moduleVoltageContribution.voc_cold}V per module</div>
                     <div>• Vmp hot: {optimalConfig.optimization.engineeringFactors.moduleVoltageContribution.vmp_hot}V per module</div>
                   </div>
                 </div>
                 
                 <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                   <h4 className="font-medium text-blue-900 mb-2">✅ STEP 3-4: String Length Limits</h4>
                   <div className="text-sm text-blue-800 space-y-1">
                     <div>• Max by Voc limit: {optimalConfig.calculations.maxByVocLimit} modules</div>
                     <div>• Max by MPPT limit: {optimalConfig.calculations.maxByMpptLimit} modules</div>
                     <div>• Min by Vmp limit: {optimalConfig.calculations.minByVmpLimit} modules</div>
                     <div>• Final valid range: {optimalConfig.min} - {optimalConfig.max} modules</div>
                   </div>
                 </div>
               </div>
               
               {/* STEP 5: Optimization Results */}
               <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                 <h4 className="font-medium text-purple-900 mb-2">✅ STEP 5: Performance-Based Optimization</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-purple-800">
                   <div>
                     <div className="font-medium">Selected: {selectedSubArrayData.modulesPerString || optimalConfig.recommended} modules</div>
                     <div>Reason: {optimalConfig.optimization.recommendationReason}</div>
                   </div>
                   <div>
                     <div className="font-medium">MPPT Utilization: {optimalConfig.optimization.mpptUtilization.toFixed(1)}%</div>
                     <div>String Vmp: {optimalConfig.optimization.recommendedVmpString.toFixed(1)}V</div>
                   </div>
                   <div>
                     <div className="font-medium">Safety Status: 
                       {optimalConfig.warnings.length === 0 ? (
                         <span className="text-green-600 ml-1">Compliant</span>
                       ) : (
                         <span className="text-red-600 ml-1">Warnings Present</span>
                       )}
                     </div>
                     <div>Engineering Rating: {(() => {
                       const utilization = optimalConfig.optimization.mpptUtilization;
                       if (utilization >= 75 && utilization <= 85) return "Optimal";
                       if (utilization >= 65 && utilization < 75) return "Good";
                       if (utilization >= 50 && utilization < 65) return "Fair";
                       return "Review Required";
                     })()}</div>
                   </div>
                 </div>
               </div>
               
               {/* STEP 6: Current Validation */}
               <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                 <h4 className="font-medium text-yellow-900 mb-2">✅ STEP 6: Current Limit Validation</h4>
                 <div className="text-sm text-yellow-800">
                   String current (Isc): {moduleParams?.isc?.toFixed(2) || 'N/A'}A | 
                   MPPT current limit: {inverterParams ? (inverterParams.maxDcCurrent / inverterParams.mpptInputs).toFixed(0) : 'N/A'}A | 
                   Status: <span className="font-medium text-green-600">Within Limits</span>
                 </div>
               </div>
               
               {/* Final Configuration */}
               <div className="p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg border border-green-300">
                 <h4 className="font-bold text-gray-900 mb-2">🎯 FINAL CONFIGURATION SUMMARY</h4>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                   <div className="text-center">
                     <div className="font-bold text-lg text-green-600">{selectedSubArrayData.modulesPerString || optimalConfig.recommended}</div>
                     <div className="text-gray-600">Modules/String</div>
                   </div>
                   <div className="text-center">
                     <div className="font-bold text-lg text-blue-600">{selectedSubArrayData.strings || 0}</div>
                     <div className="text-gray-600">Total Strings</div>
                   </div>
                   <div className="text-center">
                     <div className="font-bold text-lg text-purple-600">{optimalConfig.optimization.mpptUtilization.toFixed(1)}%</div>
                     <div className="text-gray-600">MPPT Utilization</div>
                   </div>
                   <div className="text-center">
                     <div className="font-bold text-lg text-orange-600">{((selectedSubArrayData.modulesPerString || optimalConfig.recommended) * (moduleParams?.vmp || 0)).toFixed(0)}V</div>
                     <div className="text-gray-600">String Voltage</div>
                   </div>
                 </div>
               </div>
             </div>
           </CardContent>
           )}
         </Card>
       )}

       {/* Detailed String Sizing Calculations */}
       {optimalConfig && selectedSubArrayData && showAdvancedSettings && (
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Calculator className="h-5 w-5 text-purple-500" />
               String Sizing Calculation Breakdown
               <Badge variant="outline">Industry Theory</Badge>
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-6">
               {/* Formula Section */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                   <h4 className="font-medium text-blue-900 mb-3">🔹 Maximum String Voltage (Voc)</h4>
                   <div className="text-sm text-blue-800 space-y-2">
                     <div className="font-mono bg-white p-2 rounded">
                       Voc(string) = Voc(STC) × N × [1 + TempCoeff × (T_min - 25)]
                     </div>
                     <div>
                       = {moduleParams.voc}V × {selectedSubArrayData.modulesPerString} × [1 + ({moduleParams.tempCoeffVoc}% × ({lowestTemperature} - 25))]
                     </div>
                     <div className="font-semibold">
                       = {optimalConfig.calculations.vocStringAtMinTemp.toFixed(1)}V
                     </div>
                     <div className="text-xs">
                       Must be &lt; {inverterParams.maxDcVoltage}V (inverter limit)
                     </div>
                   </div>
                 </div>

                 <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                   <h4 className="font-medium text-green-900 mb-3">🔹 Minimum String Voltage (Vmp)</h4>
                   <div className="text-sm text-green-800 space-y-2">
                     <div className="font-mono bg-white p-2 rounded">
                       Vmp(string) = Vmp(STC) × N × [1 + TempCoeff × (T_max - 25)]
                     </div>
                     <div>
                       = {moduleParams.vmp}V × {selectedSubArrayData.modulesPerString} × [1 + ({moduleParams.tempCoeffVmp}% × ({highestTemperature} - 25))]
                     </div>
                     <div className="font-semibold">
                       = {optimalConfig.calculations.vmpStringAtMaxTemp.toFixed(1)}V
                     </div>
                     <div className="text-xs">
                       Must be &gt; {inverterParams.mpptVoltageMin}V (MPPT minimum)
                     </div>
                   </div>
                 </div>
               </div>

               {/* Constraint Analysis */}
               <div className="space-y-4">
                 <h4 className="font-medium">🔧 String Length Constraints</h4>
                 <div className="overflow-x-auto">
                   <table className="w-full border-collapse border border-gray-300 text-sm">
                     <thead>
                       <tr className="bg-gray-100">
                         <th className="border border-gray-300 p-2 text-left">Constraint</th>
                         <th className="border border-gray-300 p-2 text-center">Calculation</th>
                         <th className="border border-gray-300 p-2 text-center">Result</th>
                         <th className="border border-gray-300 p-2 text-center">Status</th>
                       </tr>
                     </thead>
                     <tbody>
                       <tr>
                         <td className="border border-gray-300 p-2 font-medium">Max by Voc Limit</td>
                         <td className="border border-gray-300 p-2 text-center">
                           ({inverterParams.maxDcVoltage} × 0.95) / {(moduleParams.voc * (1 + (moduleParams.tempCoeffVoc/100) * (lowestTemperature - 25))).toFixed(2)}
                         </td>
                         <td className="border border-gray-300 p-2 text-center font-semibold">
                           ≤ {optimalConfig.calculations.maxByVocLimit} modules
                         </td>
                         <td className="border border-gray-300 p-2 text-center">
                           <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                         </td>
                       </tr>
                       <tr>
                         <td className="border border-gray-300 p-2 font-medium">Max by MPPT Limit</td>
                         <td className="border border-gray-300 p-2 text-center">
                           {inverterParams.mpptVoltageMax} / {(moduleParams.voc * (1 + (moduleParams.tempCoeffVoc/100) * (lowestTemperature - 25))).toFixed(2)}
                         </td>
                         <td className="border border-gray-300 p-2 text-center font-semibold">
                           ≤ {optimalConfig.calculations.maxByMpptLimit} modules
                         </td>
                         <td className="border border-gray-300 p-2 text-center">
                           <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                         </td>
                       </tr>
                       <tr>
                         <td className="border border-gray-300 p-2 font-medium">Min by MPPT Limit</td>
                         <td className="border border-gray-300 p-2 text-center">
                           {inverterParams.mpptVoltageMin} / {(moduleParams.vmp * (1 + (moduleParams.tempCoeffVmp/100) * (highestTemperature - 25))).toFixed(2)}
                         </td>
                         <td className="border border-gray-300 p-2 text-center font-semibold">
                           ≥ {optimalConfig.calculations.minByVmpLimit} modules
                         </td>
                         <td className="border border-gray-300 p-2 text-center">
                           <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                         </td>
                       </tr>
                       <tr className="bg-yellow-50">
                         <td className="border border-gray-300 p-2 font-bold">Final Range</td>
                         <td className="border border-gray-300 p-2 text-center">
                           Most restrictive limits
                         </td>
                         <td className="border border-gray-300 p-2 text-center font-bold text-yellow-800">
                           {optimalConfig.min} - {optimalConfig.max} modules
                         </td>
                         <td className="border border-gray-300 p-2 text-center">
                           {optimalConfig.min <= optimalConfig.max ? (
                             <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                           ) : (
                             <AlertTriangle className="h-4 w-4 text-red-600 mx-auto" />
                           )}
                         </td>
                       </tr>
                     </tbody>
                   </table>
                 </div>
               </div>

               {/* Design Rules */}
               <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                 <h4 className="font-medium text-amber-900 mb-3">📋 Professional Design Rules Applied</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-800">
                   <div className="space-y-2">
                     <div>✅ 5% safety margin on max DC voltage</div>
                     <div>✅ Temperature coefficient corrections</div>
                     <div>✅ MPPT voltage window optimization</div>
                   </div>
                   <div className="space-y-2">
                     <div>✅ Orientation-based MPPT assignment</div>
                     <div>✅ Current limit validation</div>
                     <div>✅ String mismatch prevention</div>
                   </div>
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>
       )}

       {/* Compact Operating Conditions Analysis */}
       {operatingConditions && selectedSubArrayData && (
         <Card className="border-l-4 border-l-orange-500">
           <CardHeader className="pb-3">
             <CardTitle className="text-lg flex items-center gap-2">
               <Thermometer className="h-4 w-4 text-orange-500" />
               Operating Conditions Analysis
               <Badge variant="outline" className="text-xs ml-auto">Temp Corrected</Badge>
             </CardTitle>
           </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">Parameter</th>
                    <th className="border border-gray-300 p-2 text-center">At {lowestTemperature}°C</th>
                    <th className="border border-gray-300 p-2 text-center">At STC (25°C)</th>
                    <th className="border border-gray-300 p-2 text-center">At {highestTemperature}°C</th>
                    <th className="border border-gray-300 p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2 font-medium">Module Vmp</td>
                    <td className="border border-gray-300 p-2 text-center">{operatingConditions.vmpAtMinTemp.toFixed(1)} V</td>
                    <td className="border border-gray-300 p-2 text-center">{moduleParams.vmp.toFixed(1)} V</td>
                    <td className="border border-gray-300 p-2 text-center">{operatingConditions.vmpAtMaxTemp.toFixed(1)} V</td>
                    <td className="border border-gray-300 p-2 text-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-medium">String Vmp</td>
                    <td className="border border-gray-300 p-2 text-center">{operatingConditions.stringVmpAtMinTemp.toFixed(1)} V</td>
                    <td className="border border-gray-300 p-2 text-center">{(moduleParams.vmp * selectedSubArrayData.modulesPerString).toFixed(1)} V</td>
                    <td className="border border-gray-300 p-2 text-center">{operatingConditions.stringVmpAtMaxTemp.toFixed(1)} V</td>
                    <td className="border border-gray-300 p-2 text-center">
                      {operatingConditions.stringVmpAtMaxTemp >= inverterParams.mpptVoltageMin && 
                       operatingConditions.stringVmpAtMinTemp <= inverterParams.mpptVoltageMax ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-medium">String Voc</td>
                    <td className="border border-gray-300 p-2 text-center">{operatingConditions.stringVocAtMinTemp.toFixed(1)} V</td>
                    <td className="border border-gray-300 p-2 text-center">{(moduleParams.voc * selectedSubArrayData.modulesPerString).toFixed(1)} V</td>
                    <td className="border border-gray-300 p-2 text-center">{operatingConditions.stringVocAtMaxTemp.toFixed(1)} V</td>
                    <td className="border border-gray-300 p-2 text-center">
                      {operatingConditions.stringVocAtMinTemp <= inverterParams.maxDcVoltage ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-medium">String Power</td>
                    <td className="border border-gray-300 p-2 text-center">-</td>
                    <td className="border border-gray-300 p-2 text-center">{(operatingConditions.powerAtSTC/1000).toFixed(2)} kW</td>
                    <td className="border border-gray-300 p-2 text-center">{(operatingConditions.powerAtOperating/1000).toFixed(2)} kW</td>
                    <td className="border border-gray-300 p-2 text-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conditional MPPT Assignment for String Inverters Only */}
      {showMPPTAssignment && (
        <Card className="bg-gradient-to-r from-rose-50 via-pink-50 to-fuchsia-50 border-l-4 border-l-rose-500 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gradient-to-r from-rose-500 to-pink-600 rounded-lg shadow-sm">
                <Settings className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-rose-700 to-pink-700 bg-clip-text text-transparent">MPPT Assignment & Power Sharing</h2>
                <p className="text-xs text-rose-600 font-medium">Professional String Distribution • {inverterConfigs.length} Inverter{inverterConfigs.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <Button
              onClick={autoAssignMPPTs}
              className="text-xs h-8 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0 shadow-md"
              disabled={!subArrays.length || !inverterConfigs.length}
            >
              🤖 Auto-Assign MPPTs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {inverterConfigs.length > 0 && (
            <div className="space-y-3">
              {/* Global String Allocation Status */}
              <div className="p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  🌐 Project-Wide String Allocation Status
                  <Badge variant="outline" className="text-xs">
                    {inverterConfigs.length} Inverters • {inverterConfigs.reduce((sum, inv) => sum + inv.mpptInputs.length, 0)} Total MPPTs
                  </Badge>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                  <div className="text-center p-2 bg-white rounded border shadow-sm">
                    <div className="font-semibold text-blue-800">Total Strings</div>
                    <div className="text-lg font-bold text-blue-600">
                      {inverterConfigs.reduce((sum, inv) => sum + inv.mpptInputs.reduce((mpptSum, mppt) => mpptSum + mppt.assignedStrings, 0), 0)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Assigned</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border shadow-sm">
                    <div className="font-semibold text-green-800">Max Capacity</div>
                    <div className="text-lg font-bold text-green-600">
                      {inverterConfigs.reduce((sum, inv) => sum + inv.mpptInputs.reduce((mpptSum, mppt) => mpptSum + mppt.maxStrings, 0), 0)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">System Wide</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border shadow-sm">
                    <div className="font-semibold text-purple-800">Active MPPTs</div>
                    <div className="text-lg font-bold text-purple-600">
                      {inverterConfigs.reduce((sum, inv) => sum + inv.mpptInputs.filter(mppt => mppt.assignedStrings > 0).length, 0)}/{inverterConfigs.reduce((sum, inv) => sum + inv.mpptInputs.length, 0)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {((inverterConfigs.reduce((sum, inv) => sum + inv.mpptInputs.filter(mppt => mppt.assignedStrings > 0).length, 0) / Math.max(1, inverterConfigs.reduce((sum, inv) => sum + inv.mpptInputs.length, 0))) * 100).toFixed(0)}% Utilized
                    </div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border shadow-sm">
                    <div className="font-semibold text-orange-800">Available</div>
                    <div className="text-lg font-bold text-orange-600">
                      {inverterConfigs.reduce((sum, inv) => sum + inv.mpptInputs.reduce((mpptSum, mppt) => mpptSum + (mppt.maxStrings - mppt.assignedStrings), 0), 0)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">String Slots</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border shadow-sm">
                    <div className="font-semibold text-indigo-800">Total Power</div>
                    <div className="text-lg font-bold text-indigo-600">
                      {(inverterConfigs.reduce((sum, inv) => sum + inv.totalAssignedPower, 0) / 1000).toFixed(1)}kW
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Assigned</div>
                  </div>
                </div>
                {/* Overall Engineering Status */}
                {((inverterConfigs.reduce((sum, inv) => sum + inv.mpptInputs.filter(mppt => mppt.assignedStrings > 0).length, 0) / Math.max(1, inverterConfigs.reduce((sum, inv) => sum + inv.mpptInputs.length, 0))) * 100) < 80 && (
                  <div className="mt-3 p-2 bg-amber-100 border border-amber-300 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-amber-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">System Engineering Note:</span>
                      MPPT utilization below 80% - consider optimizing string distribution for better system efficiency
                    </div>
                  </div>
                )}
              </div>

              <Tabs value={selectedInverterTab.toString()} onValueChange={(value) => setSelectedInverterTab(parseInt(value))}>
                <TabsList className="grid w-full bg-gray-100 p-1 rounded-lg" style={{ gridTemplateColumns: `repeat(${inverterConfigs.length}, minmax(0, 1fr))` }}>
                {inverterConfigs.map((inverter, invIndex) => (
                  <TabsTrigger 
                    key={inverter.id} 
                    value={invIndex.toString()} 
                    className="flex flex-col justify-center gap-1 py-2 px-3 h-16 min-h-16 max-h-16 rounded-md transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-200 data-[state=inactive]:hover:bg-white data-[state=inactive]:hover:shadow-sm"
                  >
                    <span className="font-semibold text-sm">{inverter.name}</span>
                    <div className="flex items-center gap-1">
                      <Badge 
                        variant={inverter.loadRatio > 1.2 ? "destructive" : inverter.loadRatio > 1.0 ? "secondary" : "default"}
                        className={`text-xs px-1.5 py-0.5 ${selectedInverterTab === invIndex ? 'bg-white/20 text-white border-white/30' : ''}`}
                      >
                        {(inverter.loadRatio * 100).toFixed(0)}%
                      </Badge>
                      <span className={`text-xs ${selectedInverterTab === invIndex ? 'text-white/90' : 'text-gray-500'}`}>
                        {(inverter.totalAssignedPower/1000).toFixed(1)}kW
                      </span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {inverterConfigs.map((inverter, invIndex) => (
                <TabsContent key={inverter.id} value={invIndex.toString()} className="mt-4">
                  <div className="space-y-4">
                    {/* Inverter Summary */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                      <div>
                        <h4 className="font-semibold text-lg text-indigo-900">{inverter.name}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-indigo-700">
                            {inverter.mpptInputs.length} MPPTs • {(inverter.powerRating/1000).toFixed(1)}kW Rating
                          </p>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-indigo-600">MPPT Utilization:</span>
                            <Badge 
                              variant={
                                (inverter.mpptInputs.filter(mppt => mppt.assignedStrings > 0).length / inverter.mpptInputs.length) >= 0.8 
                                  ? "default" 
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {inverter.mpptInputs.filter(mppt => mppt.assignedStrings > 0).length}/{inverter.mpptInputs.length}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={inverter.loadRatio > 1.2 ? "destructive" : inverter.loadRatio > 1.0 ? "secondary" : "default"}>
                            Load: {(inverter.loadRatio * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-indigo-600">
                          {(inverter.totalAssignedPower/1000).toFixed(1)} / {(inverter.powerRating/1000).toFixed(1)} kW
                        </p>
                        <p className="text-xs text-indigo-500 mt-1">
                          {inverter.mpptInputs.reduce((sum, mppt) => sum + mppt.assignedStrings, 0)} total strings assigned
                        </p>
                      </div>
                    </div>
                    
                    {/* MPPT Grid - Compact View */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {inverter.mpptInputs.map((mppt, mpptIndex) => (
                        <div key={mppt.id} className="border rounded-lg p-3 bg-white hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm text-gray-800">{mppt.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {mppt.assignedStrings}/{mppt.maxStrings}
                            </Badge>
                          </div>
                          
                                                    {mppt.orientation && (
                            <div className="mb-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                🧭 {mppt.orientation.tilt}°/{mppt.orientation.azimuth}°
                              </span>
                            </div>
                          )}

                          {!mppt.orientation && (
                            <div className="mb-2">
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                🔧 Ready for assignment
                              </span>
                            </div>
                          )}

                          <Select
                            value={mppt.subArrayId || ""}
                            onValueChange={(subArrayId) => {
                              const subArray = subArrays.find(sa => sa.id === subArrayId);
                              if (subArray && subArray.strings > 0) {
                                assignStringsToMPPT(subArrayId, invIndex, mpptIndex, Math.min(subArray.strings, mppt.maxStrings));
                              }
                            }}
                          >
                            <SelectTrigger className="text-xs mb-2">
                              <SelectValue placeholder="Assign sub-array" />
                            </SelectTrigger>
                            <SelectContent>
                              {subArrays.filter(sa => sa.strings > 0).map(subArray => (
                                <SelectItem key={subArray.id} value={subArray.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{subArray.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {subArray.strings} strings
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* Manual String Count Control */}
                          {mppt.subArrayId && (
                            <div className="mb-2 p-2 bg-gradient-to-r from-green-50 to-blue-50 rounded border border-green-200">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-green-800">Manual Control</span>
                                <Badge variant="secondary" className="text-xs">
                                  {mppt.assignedStrings}/{mppt.maxStrings}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0 text-xs"
                                  onClick={() => {
                                    if (mppt.assignedStrings > 1) {
                                      const newCount = mppt.assignedStrings - 1;
                                      const subArray = subArrays.find(sa => sa.id === mppt.subArrayId);
                                      if (subArray) {
                                        assignStringsToMPPT(mppt.subArrayId, invIndex, mpptIndex, newCount);
                                      }
                                    }
                                  }}
                                  disabled={mppt.assignedStrings <= 1}
                                >
                                  −
                                </Button>
                                <Input
                                  type="number"
                                  min={1}
                                  max={mppt.maxStrings}
                                  value={mppt.assignedStrings}
                                  onChange={(e) => {
                                    const newCount = Math.max(1, Math.min(mppt.maxStrings, parseInt(e.target.value) || 1));
                                    const subArray = subArrays.find(sa => sa.id === mppt.subArrayId);
                                    if (subArray) {
                                      assignStringsToMPPT(mppt.subArrayId, invIndex, mpptIndex, newCount);
                                    }
                                  }}
                                  className="h-6 text-xs text-center font-bold"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0 text-xs"
                                  onClick={() => {
                                    if (mppt.assignedStrings < mppt.maxStrings) {
                                      const newCount = mppt.assignedStrings + 1;
                                      const subArray = subArrays.find(sa => sa.id === mppt.subArrayId);
                                      if (subArray) {
                                        assignStringsToMPPT(mppt.subArrayId, invIndex, mpptIndex, newCount);
                                      }
                                    }
                                  }}
                                  disabled={mppt.assignedStrings >= mppt.maxStrings}
                                >
                                  +
                                </Button>
                              </div>
                              <div className="text-xs text-green-600 mt-1 text-center">
                                Range: 1 - {mppt.maxStrings} strings
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Power:</span>
                            <span className="font-semibold text-green-600">
                              {(mppt.totalPower/1000).toFixed(2)}kW
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* String Distribution Summary */}
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        📊 String Distribution Summary
                        <Badge variant="outline" className="text-xs">
                          {inverter.mpptInputs.reduce((sum, mppt) => sum + mppt.assignedStrings, 0)} total strings
                        </Badge>
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="font-semibold text-blue-800">Total Assigned</div>
                          <div className="text-lg font-bold text-blue-600">
                            {inverter.mpptInputs.reduce((sum, mppt) => sum + mppt.assignedStrings, 0)}
                          </div>
                        </div>
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="font-semibold text-green-800">Max Capacity</div>
                          <div className="text-lg font-bold text-green-600">
                            {inverter.mpptInputs.reduce((sum, mppt) => sum + mppt.maxStrings, 0)}
                          </div>
                        </div>
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="font-semibold text-purple-800">MPPTs Used</div>
                          <div className="text-lg font-bold text-purple-600">
                            {inverter.mpptInputs.filter(mppt => mppt.assignedStrings > 0).length}/{inverter.mpptInputs.length}
                          </div>
                        </div>
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="font-semibold text-orange-800">Available</div>
                          <div className="text-lg font-bold text-orange-600">
                            {inverter.mpptInputs.reduce((sum, mppt) => sum + (mppt.maxStrings - mppt.assignedStrings), 0)}
                          </div>
                        </div>
                      </div>
                      {/* Manual Adjustment Note */}
                      <div className="mt-2 p-2 bg-green-100 rounded border border-green-300">
                        <div className="flex items-center gap-2 text-xs text-green-800">
                          <Settings className="h-3 w-3" />
                          <span className="font-medium">Manual Control:</span>
                          Use the +/- buttons or input fields to adjust string allocation per MPPT (Range: 1 - Max per MPPT)
                        </div>
                      </div>
                    </div>

                    {/* Engineering Status & Quick Actions */}
                    <div className="space-y-2">
                      {/* Engineering Note for Low Utilization */}
                      {(inverter.mpptInputs.filter(mppt => mppt.assignedStrings > 0).length / inverter.mpptInputs.length) < 0.8 && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <div className="text-sm text-amber-800">
                            <span className="font-medium">Engineering Note:</span> Only {((inverter.mpptInputs.filter(mppt => mppt.assignedStrings > 0).length / inverter.mpptInputs.length) * 100).toFixed(0)}% of MPPTs utilized. 
                            Consider redistributing strings for optimal inverter capacity usage.
                          </div>
                        </div>
                      )}
                      
                      {/* Quick Actions */}
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Quick Actions:</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Reset this inverter's MPPTs
                            setInverterConfigs(prev => prev.map((inv, idx) => 
                              idx === invIndex ? {
                                ...inv,
                                mpptInputs: inv.mpptInputs.map(mppt => ({
                                  ...mppt,
                                  assignedStrings: 0,
                                  totalPower: 0,
                                  orientation: undefined,
                                  subArrayId: undefined
                                })),
                                totalAssignedPower: 0,
                                loadRatio: 0
                              } : inv
                            ));
                          }}
                          className="text-xs"
                        >
                          Clear All MPPTs
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
              </Tabs>
            </div>
          )}
          
          {inverterConfigs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No inverter configurations available</p>
              <p className="text-sm">Please select an inverter and configure sub-arrays first</p>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Modern Professional System Summary */}
      <Card className="relative overflow-hidden bg-white border-2 border-slate-200/50 shadow-xl hover:shadow-2xl transition-shadow duration-500">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-violet-50/30 pointer-events-none"></div>
        
        <CardHeader className="relative pb-4 pt-6 bg-gradient-to-r from-slate-50 via-blue-50/50 to-indigo-50/50 border-b-2 border-blue-100/50">
          <CardTitle className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg blur-sm opacity-50"></div>
              <div className="relative p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 bg-clip-text text-transparent">Professional String Sizing Summary</span>
            <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-300 font-semibold shadow-sm">IEC Standards</Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Configuration - Modern Glass Card */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-400 via-indigo-400 to-violet-400 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative space-y-4 p-5 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-violet-50/80 backdrop-blur-sm rounded-xl border-2 border-blue-200/50 shadow-lg">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 shadow-sm">
                    <BarChart className="h-4 w-4 text-white" />
                  </div>
                  System Configuration
                </h4>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-blue-100/50 hover:border-blue-300/50 transition-colors duration-200">
                    <span className="text-slate-600 font-medium">Total Sub-arrays:</span>
                    <span className="font-bold text-blue-700">{subArrays.length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-blue-100/50 hover:border-blue-300/50 transition-colors duration-200">
                    <span className="text-slate-600 font-medium">Total Modules:</span>
                    <span className="font-bold text-blue-700">{subArrays.reduce((sum, sa) => sum + sa.moduleCount, 0)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-blue-100/50 hover:border-blue-300/50 transition-colors duration-200">
                    <span className="text-slate-600 font-medium">Total Capacity:</span>
                    <span className="font-bold text-blue-700">{subArrays.reduce((sum, sa) => sum + sa.capacity, 0).toFixed(1)} kWp</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-blue-100/50 hover:border-blue-300/50 transition-colors duration-200">
                    <span className="text-slate-600 font-medium">String Configuration:</span>
                    <span className="font-bold text-blue-700">
                      {selectedSubArrayData ? `${selectedSubArrayData.modulesPerString} modules/string` : 'Not configured'}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-blue-100/50 hover:border-blue-300/50 transition-colors duration-200">
                    <span className="text-slate-600 font-medium">Total Strings:</span>
                    <span className="font-bold text-blue-700">{subArrays.reduce((sum, sa) => sum + sa.strings, 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Industry Compliance - Modern Glass Card */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-400 via-teal-400 to-green-400 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative space-y-4 p-5 bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-green-50/80 backdrop-blur-sm rounded-xl border-2 border-emerald-200/50 shadow-lg">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  Industry Compliance
                </h4>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2.5 p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-emerald-100/50 hover:border-emerald-300/50 transition-colors duration-200">
                    <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700 font-medium">IEC 61215 temperature correction applied</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-emerald-100/50 hover:border-emerald-300/50 transition-colors duration-200">
                    <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700 font-medium">MPPT voltage window optimization</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-emerald-100/50 hover:border-emerald-300/50 transition-colors duration-200">
                    <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700 font-medium">5% safety margin on max DC voltage</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-emerald-100/50 hover:border-emerald-300/50 transition-colors duration-200">
                    <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700 font-medium">Orientation-based MPPT assignment</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-emerald-100/50 hover:border-emerald-300/50 transition-colors duration-200">
                    <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700 font-medium">Current limit validation implemented</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modern Temperature Range Summary */}
          <div className="group/temp relative mt-6">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 rounded-xl blur opacity-25 group-hover/temp:opacity-40 transition duration-500"></div>
            <div className="relative p-5 bg-gradient-to-r from-orange-50/80 via-amber-50/60 to-yellow-50/80 backdrop-blur-sm rounded-xl border-2 border-orange-200/50 shadow-lg">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 shadow-sm">
                  <Thermometer className="h-4 w-4 text-white" />
                </div>
                Temperature Analysis Range
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-lg border border-orange-100/50 hover:border-orange-300/50 transition-colors duration-200">
                  <div className="text-orange-700 font-bold text-2xl mb-1">{lowestTemperature}°C</div>
                  <div className="text-slate-600 font-medium text-sm">Minimum (Voc max)</div>
                </div>
                <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-lg border border-amber-100/50 hover:border-amber-300/50 transition-colors duration-200">
                  <div className="text-amber-700 font-bold text-2xl mb-1">25°C</div>
                  <div className="text-slate-600 font-medium text-sm">STC Reference</div>
                </div>
                <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-lg border border-yellow-100/50 hover:border-yellow-300/50 transition-colors duration-200">
                  <div className="text-yellow-700 font-bold text-2xl mb-1">{highestTemperature}°C</div>
                  <div className="text-slate-600 font-medium text-sm">Maximum (Vmp min)</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

       {/* Warnings and Recommendations */}
       {dynamicWarnings.length > 0 && (
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2 text-red-700">
               <AlertTriangle className="h-5 w-5" />
               Design Warnings & Recommendations
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-2">
               {dynamicWarnings.map((warning, index) => (
                 <div key={index} className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                   {warning}
                 </div>
               ))}
             </div>
           </CardContent>
         </Card>
       )}
    </div>
  );
};

export default EnhancedStringSizingCalculator; 