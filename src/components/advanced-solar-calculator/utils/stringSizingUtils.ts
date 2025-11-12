// Utility functions for string sizing calculations
// Used by both traditional string inverters and central inverters

export interface BasicStringCalculationParams {
  selectedPanel: any;
  selectedInverter: any;
  polygonConfigs: any[];
  lowestTemperature: number;
  highestTemperature: number;
  capacity: number;
}

export interface BasicStringResult {
  totalStringCount: number;
  averageStringVoltage: number;
  averageStringCurrent: number;
  moduleParams: {
    voc: number;
    vmp: number;
    isc: number;
    imp: number;
    power: number;
    tempCoeffVoc: number;
    tempCoeffPmax: number;
  } | null;
}

/**
 * Calculate basic string count and electrical parameters
 * This is the core logic that both string and central inverters need
 */
export function calculateBasicStringParameters(params: BasicStringCalculationParams): BasicStringResult {
  const { selectedPanel, selectedInverter, polygonConfigs, lowestTemperature, highestTemperature, capacity } = params;

  // Extract module parameters with fallbacks
  const moduleParams = selectedPanel ? {
    voc: selectedPanel.voc_v || selectedPanel.voc || selectedPanel.open_circuit_voltage || 45,
    vmp: selectedPanel.vmp_v || selectedPanel.vmp || selectedPanel.max_power_voltage || 37,
    isc: selectedPanel.isc_a || selectedPanel.isc || selectedPanel.short_circuit_current || 11,
    imp: selectedPanel.imp_a || selectedPanel.imp || selectedPanel.max_power_current || 10,
    power: selectedPanel.pmax_w || selectedPanel.power || selectedPanel.max_power || 400,
    tempCoeffVoc: selectedPanel.temp_coeff_voc_percent_c || selectedPanel.temperature_coefficient_voc || -0.25,
    tempCoeffPmax: selectedPanel.temp_coeff_pmax_percent_c || selectedPanel.temperature_coefficient_pmax || -0.35
  } : null;

  if (!moduleParams || !selectedInverter) {
    return {
      totalStringCount: 0,
      averageStringVoltage: 0,
      averageStringCurrent: 0,
      moduleParams: null
    };
  }

  // Extract inverter MPPT parameters
  const mpptVoltageMin = selectedInverter.min_mpp_voltage_v || 
                        selectedInverter.mppt_min_voltage || 
                        selectedInverter.min_mppt_voltage || 125;
  
  const mpptVoltageMax = selectedInverter.max_mpp_voltage_v || 
                        selectedInverter.max_dc_voltage_v || 
                        selectedInverter.mppt_max_voltage || 850;

  // Calculate temperature corrected voltages
  const tempDifferenceMin = lowestTemperature - 25;
  const tempDifferenceMax = highestTemperature - 25;

  const vocColdest = moduleParams.voc * (1 + (moduleParams.tempCoeffVoc / 100) * tempDifferenceMin);
  const vmpHottest = moduleParams.vmp * (1 + (moduleParams.tempCoeffVoc / 100) * tempDifferenceMax);

  // Calculate optimal modules per string
  const maxModulesVoc = Math.floor(1000 / vocColdest); // 1000V safety limit
  const maxModulesMppt = Math.floor(mpptVoltageMax / vmpHottest);
  const minModulesMppt = Math.ceil(mpptVoltageMin / vmpHottest);

  const optimalModulesPerString = Math.min(maxModulesVoc, maxModulesMppt);
  const modulesPerString = Math.max(minModulesMppt, Math.min(optimalModulesPerString, 24)); // Practical limit

  // Calculate total strings needed
  const totalModules = Math.round(capacity * 1000 / moduleParams.power);
  const totalStringCount = Math.ceil(totalModules / modulesPerString);

  // Debug logging (only for string inverters now)
  console.log('String Inverter Basic Calculation Debug:', {
    capacity,
    modulePower: moduleParams.power,
    totalModules,
    modulesPerString,
    totalStringCount,
    lowestTemperature,
    highestTemperature,
    vocColdest,
    vmpHottest,
    maxModulesVoc,
    maxModulesMppt,
    minModulesMppt,
    optimalModulesPerString
  });

  // Calculate average electrical parameters
  const averageStringVoltage = modulesPerString * moduleParams.vmp;
  const averageStringCurrent = moduleParams.imp;

  return {
    totalStringCount,
    averageStringVoltage,
    averageStringCurrent,
    moduleParams
  };
}

/**
 * Calculate DCDB requirements for central inverters
 */
export interface DCDBCalculationParams extends BasicStringCalculationParams {
  totalInverters: number;
  dcdbPerInverter?: number;
  dcdbStringInputs?: number;
}

export interface DCDBCalculationResult {
  totalDCDBPerInverter: number;
  actualPVStringsPerDCDB: number;
  actualPVStringsPerMPPT: number;
  dcdbStringInputsPerDCDB: number;
  totalDCDBInSystem: number;
  isValidConfiguration: boolean;
  utilizationPercent: number;
}

export function calculateDCDBRequirements(
  basicStringResult: BasicStringResult,
  totalInverters: number,
  selectedInverter: any,
  dcdbPerInverter?: number,
  dcdbStringInputs?: number
): DCDBCalculationResult {
  
  const inverterTotalStrings = selectedInverter?.total_string_inputs || 
                              selectedInverter?.total_strings || 
                              selectedInverter?.max_string_inputs || 20;

  const inverterMPPTs = selectedInverter?.total_mppt || 
                       selectedInverter?.mppt_inputs || 
                       selectedInverter?.number_of_mppt_inputs || 2;

  // For central inverters: totalStrings in inverter params = number of DCDB connections per inverter
  const totalDCDBPerInverter = dcdbPerInverter || inverterTotalStrings;
  const dcdbStringInputsPerDCDB = dcdbStringInputs || 16; // Standard DCDB size

  // Calculate strings per DCDB (with ceiling rounding as specified)
  const totalDCDBInSystem = totalInverters * totalDCDBPerInverter;
  const actualPVStringsPerDCDB = Math.ceil(basicStringResult.totalStringCount / totalDCDBInSystem);

  // Calculate strings per MPPT for central inverters
  const actualPVStringsPerMPPT = Math.ceil(
    (totalDCDBPerInverter * actualPVStringsPerDCDB) / inverterMPPTs
  );

  // Validation
  const isValidConfiguration = actualPVStringsPerDCDB <= dcdbStringInputsPerDCDB;
  const maxPossibleStringsPerMPPT = Math.floor((totalDCDBPerInverter * dcdbStringInputsPerDCDB) / inverterMPPTs);
  const utilizationPercent = (actualPVStringsPerMPPT / maxPossibleStringsPerMPPT) * 100;

  return {
    totalDCDBPerInverter,
    actualPVStringsPerDCDB,
    actualPVStringsPerMPPT,
    dcdbStringInputsPerDCDB,
    totalDCDBInSystem,
    isValidConfiguration,
    utilizationPercent
  };
}