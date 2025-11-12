import { SolarCalculationResult, SolarParams } from "@/types/solarCalculations";
import { calculateSystemDetails } from './systemDetailsCalculation';
import { calculateIrradiation } from './irradiationCalculation';
import { calculateEnergyProduction } from './energyProductionCalculation';
import { calculateYearlyProduction } from './yearlyProductionCalculation';
import { getArrayTypeForStructure } from '@/components/advanced-solar-calculator/area-calculator/utils/drawingUtils';
import { calculatePVWatts } from '../services/pvwattsService';
import { PVWattsRequest, PVWattsResponse } from '../types/pvwatts';

export interface InverterParams {
  inverter_model: string;
  quantity: number;
  dc_ac_ratio: number;
  power?: number;
  efficiency?: number;
}

export interface PVSystemConfig {
  structureType: string;
  area: number;
  moduleCount: number;
  capacityKw: number;
  azimuth: number;
  tiltAngle: number;
}

export interface MultiplePVSystemsParams {
  latitude: number;
  longitude: number;
  timezone: string;
  module_efficiency: number;
  performance_ratio: number;
  module_area: number;
  module_watt_peak: number;
  inverterParams: InverterParams;
  losses: number;
  pvSystems: PVSystemConfig[];
  bifaciality?: number; // Added for PVWatts bifaciality parameter (0-1 range)
  albedo?: number; // Surface albedo value (0-1 range)
  gcr?: number; // Ground coverage ratio (0.01-0.99 range)
}

// PVWatts V8 Module Types and their efficiency standards
export const PVWATTS_MODULE_TYPES = {
  STANDARD: { type: 0, efficiency: 16.0, name: 'Standard' },    // 16% efficiency (typical crystalline silicon)
  PREMIUM: { type: 1, efficiency: 20.5, name: 'Premium' },     // 20.5% efficiency (high-efficiency crystalline silicon, mono PERC)  
  THIN_FILM: { type: 2, efficiency: 10.0, name: 'Thin Film' }  // 10% efficiency (amorphous silicon, CdTe)
} as const;

// Main calculation function
export function calculateSolarEnergy(params: SolarParams): SolarCalculationResult {
  // Extract parameters
  const {
    latitude,
    longitude,
    timezone,
    surface_tilt,
    surface_azimuth,
    module_efficiency,
    performance_ratio,
    plant_capacity_kw,
    module_area,
    module_watt_peak,
    inverterParams,
    array_type = 0,  // Default to Fixed (open rack)
    losses = 14.08   // Default losses
  } = params;

  // Validate parameters
  if (latitude === undefined || longitude === undefined || !timezone || surface_tilt === undefined || surface_azimuth === undefined) {
    throw new Error("Missing location parameters");
  }
  if (!module_efficiency || !performance_ratio || plant_capacity_kw === undefined || plant_capacity_kw <= 0 || !module_area || !module_watt_peak) {
    throw new Error("Missing PV system parameters");
  }

  // Calculate system details
  const systemDetails = calculateSystemDetails(
    plant_capacity_kw,
    module_area,
    module_watt_peak,
    inverterParams
  );

  // Calculate irradiation
  const irradiationData = calculateIrradiation(
    latitude,
    longitude,
    timezone,
    surface_tilt,
    surface_azimuth
  );

  // Additional PVWatts parameters
  const pvWattsParams = {
    arrayType: array_type,
    losses: losses
  };

  // Calculate energy production
  const energyProductionData = calculateEnergyProduction(
    irradiationData.monthly,
    plant_capacity_kw,
    performance_ratio,
    module_efficiency,
    systemDetails.inverter_efficiency,
    pvWattsParams
  );

  // Calculate yearly production
  const yearlyProduction = calculateYearlyProduction(energyProductionData.monthly);

  return {
    irradiation: {
      monthly: irradiationData.monthly,
      metrics: irradiationData.metrics
    },
    energy: {
      monthly: energyProductionData.monthly,
      metrics: energyProductionData.metrics
    },
    yearlyProduction: yearlyProduction,
    system: {
      ...systemDetails,
      pvWattsParams: {
        array_type,
        losses
      }
    },
    location: {
      latitude,
      longitude,
      lat: latitude,  // Add both formats for compatibility
      lng: longitude
    },
    timezone,  // Add timezone to the result
    country: "United States",  // Default values for compatibility
    city: "New York"
  };
}

// Calculate solar energy for multiple PV systems and combine results
export async function calculateMultiplePVSystems(params: MultiplePVSystemsParams): Promise<SolarCalculationResult> {
  console.log("🔧 INSIDE calculateMultiplePVSystems - RECEIVED PARAMS:");
  console.log("Raw params:", JSON.stringify(params, null, 2));
  
  const {
    latitude,
    longitude,
    timezone,
    module_efficiency,
    performance_ratio,
    module_area,
    module_watt_peak,
    inverterParams,
    losses,
    pvSystems,
    bifaciality,
    albedo,
    gcr
  } = params;
  
  console.log("🔍 EXTRACTED PARAMETERS:");
  console.log({
    latitude,
    longitude,
    timezone,
    module_efficiency,
    performance_ratio,
    module_area,
    module_watt_peak,
    inverterParams,
    losses,
    bifaciality,
    albedo,
    gcr,
    pvSystemsCount: pvSystems.length
  });

  // Filter out systems with 0 capacity
  const validPvSystems = pvSystems.filter(system => system.capacityKw > 0);
  
  if (validPvSystems.length === 0) {
    throw new Error("No valid PV systems with capacity > 0 found");
  }

  console.log(`🏗️ Processing ${validPvSystems.length} valid PV systems out of ${pvSystems.length} total systems`);

  // Calculate each PV system separately using PVWatts API
  const systemResults: SolarCalculationResult[] = await Promise.all(
    validPvSystems.map(async (pvSystem, index) => {
      console.log(`🔋 Calculating PV System ${index + 1}:`, {
        capacity: pvSystem.capacityKw,
        tilt: pvSystem.tiltAngle,
        azimuth: pvSystem.azimuth,
        structureType: pvSystem.structureType,
        area: pvSystem.area,
        moduleCount: pvSystem.moduleCount
      });

      // Get array type based on structure type
      const arrayType = getArrayTypeForStructure(pvSystem.structureType);
      
      console.log(`📊 Array type for ${pvSystem.structureType}: ${arrayType}`);

      // Create parameters for individual system using new PVWatts function
      const systemParams: SolarParams = {
        latitude,
        longitude,
        timezone,
        surface_tilt: pvSystem.tiltAngle,
        surface_azimuth: pvSystem.azimuth - 180, // Convert from 0-360 to -180 to 180
        module_efficiency,
        performance_ratio,
        plant_capacity_kw: pvSystem.capacityKw,
        module_area,
        module_watt_peak,
        inverterParams: {
          ...inverterParams,
          // Scale inverter quantity based on system capacity ratio
          quantity: Math.ceil((pvSystem.capacityKw / validPvSystems.reduce((sum, sys) => sum + sys.capacityKw, 0)) * inverterParams.quantity)
        },
        array_type: arrayType,
        losses,
        bifaciality,
        albedo,
        gcr
      };
      
      console.log(`⚡ System ${index + 1} final params for calculateSolarEnergyWithPVWatts:`, {
        plant_capacity_kw: systemParams.plant_capacity_kw,
        surface_tilt: systemParams.surface_tilt,
        surface_azimuth: systemParams.surface_azimuth,
        array_type: systemParams.array_type,
        losses: systemParams.losses,
        module_efficiency: systemParams.module_efficiency,
        performance_ratio: systemParams.performance_ratio,
        module_area: systemParams.module_area,
        module_watt_peak: systemParams.module_watt_peak,
        inverterParams: systemParams.inverterParams
      });

      // Use the new PVWatts-based calculation function
      const result = await calculateSolarEnergyWithPVWatts(systemParams);
      
      console.log(`📈 System ${index + 1} PVWatts calculation result:`, {
        totalYearlyEnergy: result.energy.metrics.total_yearly,
        totalModules: result.system.total_modules,
        calculatedCapacity: result.system.calculated_capacity,
        pvwattsInfo: result.system.pvwattsInfo
      });
      
      return result;
    })
  );

  // Combine results from all systems
  const totalCapacity = validPvSystems.reduce((sum, sys) => sum + sys.capacityKw, 0);
  
  // Combine monthly energy production
  const combinedMonthlyEnergy = systemResults[0].energy.monthly.map((monthData, monthIndex) => {
    const totalEnergyForMonth = systemResults.reduce((sum, result) => {
      return sum + result.energy.monthly[monthIndex]["Monthly Energy Production (kWh)"];
    }, 0);
    
    return {
      Month: monthData.Month,
      "Monthly Energy Production (kWh)": totalEnergyForMonth
    };
  });

  // Combine monthly irradiation (weighted average by capacity)
  const combinedMonthlyIrradiation = systemResults[0].irradiation.monthly.map((monthData, monthIndex) => {
    const weightedSum = systemResults.reduce((sum, result, systemIndex) => {
      const weight = validPvSystems[systemIndex].capacityKw / totalCapacity;
      return sum + (result.irradiation.monthly[monthIndex]["Monthly Solar Irradiation (kWh/m²)"] * weight);
    }, 0);
    
    return {
      Month: monthData.Month,
      "Monthly Solar Irradiation (kWh/m²)": weightedSum
    };
  });

  // Calculate combined metrics
  const totalAnnualEnergy = combinedMonthlyEnergy.reduce((sum, monthly) => sum + monthly["Monthly Energy Production (kWh)"], 0);
  const totalAnnualIrradiation = combinedMonthlyIrradiation.reduce((sum, monthly) => sum + monthly["Monthly Solar Irradiation (kWh/m²)"], 0);

  // Calculate yearly production
  const yearlyProduction = calculateYearlyProduction(combinedMonthlyEnergy);

  // Combine system details
  const totalModuleCount = validPvSystems.reduce((sum, sys) => sum + sys.moduleCount, 0);
  const totalArea = validPvSystems.reduce((sum, sys) => sum + sys.area, 0);

  // Calculate average adjustment factor weighted by capacity
  const averageAdjustmentFactor = systemResults.reduce((sum, result, index) => {
    const weight = validPvSystems[index].capacityKw / totalCapacity;
    return sum + ((result.system.pvwattsInfo?.adjustmentFactor || 1) * weight);
  }, 0);

  // Calculate average capacity factor weighted by capacity
  const averageCapacityFactor = systemResults.reduce((sum, result, index) => {
    const weight = validPvSystems[index].capacityKw / totalCapacity;
    return sum + ((result.system.pvwattsInfo?.capacityFactor || 0) * weight);
  }, 0);

  // Debug individual system results
  console.log(`🔍 INDIVIDUAL SYSTEM RESULTS DEBUG:`, {
    systemCount: systemResults.length,
    firstSystemHasEnergyHourly: !!(systemResults[0]?.energy?.hourly),
    firstSystemEnergyHourlyLength: systemResults[0]?.energy?.hourly?.length || 0,
    firstSystemHasIrradiationHourly: !!(systemResults[0]?.irradiation?.hourly),
    firstSystemIrradiationHourlyKeys: systemResults[0]?.irradiation?.hourly ? Object.keys(systemResults[0].irradiation.hourly) : [],
    firstSystemPOALength: systemResults[0]?.irradiation?.hourly?.poa?.length || 0,
    firstSystemGHLength: systemResults[0]?.irradiation?.hourly?.gh?.length || 0
  });

  // Combine hourly data from all systems if available
  const combinedHourlyEnergy = systemResults.length > 0 && systemResults[0]?.energy?.hourly ? 
    systemResults[0].energy.hourly.map((_, hourIndex) => 
      systemResults.reduce((sum, result) => 
        sum + (result.energy.hourly?.[hourIndex] || 0), 0
      )
    ) : undefined;

  const combinedHourlyDCEnergy = systemResults.length > 0 && systemResults[0]?.energy?.hourlyDC ? 
    systemResults[0].energy.hourlyDC.map((_, hourIndex) => 
      systemResults.reduce((sum, result) => 
        sum + (result.energy.hourlyDC?.[hourIndex] || 0), 0
      )
    ) : undefined;

  const combinedHourlyIrradiation = systemResults.length > 0 && systemResults[0]?.irradiation?.hourly ? {
    poa: systemResults[0].irradiation.hourly.poa?.map((_, hourIndex) => 
      systemResults.reduce((sum, result) => 
        sum + (result.irradiation.hourly?.poa?.[hourIndex] || 0), 0
      ) / systemResults.length // Average for irradiation
    ) || [],
    dn: systemResults[0].irradiation.hourly.dn?.map((_, hourIndex) => 
      systemResults.reduce((sum, result) => 
        sum + (result.irradiation.hourly?.dn?.[hourIndex] || 0), 0
      ) / systemResults.length
    ) || [],
    df: systemResults[0].irradiation.hourly.df?.map((_, hourIndex) => 
      systemResults.reduce((sum, result) => 
        sum + (result.irradiation.hourly?.df?.[hourIndex] || 0), 0
      ) / systemResults.length
    ) || [],
    gh: systemResults[0].irradiation.hourly.gh?.map((_, hourIndex) => 
      systemResults.reduce((sum, result) => 
        sum + (result.irradiation.hourly?.gh?.[hourIndex] || 0), 0
      ) / systemResults.length
    ) || [],
    tamb: systemResults[0].irradiation.hourly.tamb?.map((_, hourIndex) => 
      systemResults.reduce((sum, result) => 
        sum + (result.irradiation.hourly?.tamb?.[hourIndex] || 0), 0
      ) / systemResults.length
    ) || [],
    tcell: systemResults[0].irradiation.hourly.tcell?.map((_, hourIndex) => 
      systemResults.reduce((sum, result) => 
        sum + (result.irradiation.hourly?.tcell?.[hourIndex] || 0), 0
      ) / systemResults.length
    ) || [],
    wspd: systemResults[0].irradiation.hourly.wspd?.map((_, hourIndex) => 
      systemResults.reduce((sum, result) => 
        sum + (result.irradiation.hourly?.wspd?.[hourIndex] || 0), 0
      ) / systemResults.length
    ) || []
  } : undefined;

  // Calculate hourly metrics
  const hourlyEnergyMetrics = combinedHourlyEnergy ? {
    max_hourly: Math.max(...combinedHourlyEnergy),
    min_hourly: Math.min(...combinedHourlyEnergy)
  } : {};

  const hourlyIrradiationMetrics = combinedHourlyIrradiation?.poa ? {
    max_hourly: Math.max(...combinedHourlyIrradiation.poa),
    min_hourly: Math.min(...combinedHourlyIrradiation.poa)
  } : {};

  console.log(`🔥 COMBINED PVWATTS RESULTS:`, {
    totalAnnualEnergy: `${totalAnnualEnergy.toFixed(0)} kWh`,
    totalCapacity: `${totalCapacity} kW`,
    averageCapacityFactor: `${averageCapacityFactor.toFixed(1)}%`,
    averageAdjustmentFactor: averageAdjustmentFactor.toFixed(4),
    systemCount: validPvSystems.length,
    hasHourlyEnergy: !!combinedHourlyEnergy,
    hourlyEnergyPoints: combinedHourlyEnergy?.length || 0,
    hasHourlyIrradiation: !!combinedHourlyIrradiation,
    hourlyIrradiationPoints: combinedHourlyIrradiation?.poa?.length || 0
  });

  return {
    irradiation: {
      monthly: combinedMonthlyIrradiation,
      ...(combinedHourlyIrradiation && { hourly: combinedHourlyIrradiation }),
      metrics: {
        max_daily: Math.max(...systemResults.map(r => r.irradiation.metrics.max_daily)),
        min_daily: Math.min(...systemResults.map(r => r.irradiation.metrics.min_daily)),
        total_yearly: totalAnnualIrradiation,
        ...hourlyIrradiationMetrics
      }
    },
    energy: {
      monthly: combinedMonthlyEnergy,
      ...(combinedHourlyEnergy && { hourly: combinedHourlyEnergy }),
      ...(combinedHourlyDCEnergy && { hourlyDC: combinedHourlyDCEnergy }),
      metrics: {
        max_daily: Math.max(...systemResults.map(r => r.energy.metrics.max_daily)),
        min_daily: Math.min(...systemResults.map(r => r.energy.metrics.min_daily)),
        total_yearly: totalAnnualEnergy,
        ...hourlyEnergyMetrics
      }
    },
    yearlyProduction: yearlyProduction,
    system: {
      total_modules: totalModuleCount,
      total_area: totalArea,
      calculated_capacity: totalCapacity,
      inverter_efficiency: systemResults[0].system.inverter_efficiency,
      pvWattsParams: {
        array_type: (() => {
          // Get array types from all systems
          const arrayTypes = systemResults.map(r => r.system.pvWattsParams?.array_type).filter(t => t !== undefined);
          // If only one system or all systems have the same array type, use that
          if (arrayTypes.length === 1 || arrayTypes.every(t => t === arrayTypes[0])) {
            return arrayTypes[0];
          }
          // Mixed systems, default to open rack
          return 0;
        })(),
        losses
      },
      pvwattsInfo: {
        moduleType: systemResults[0].system.pvwattsInfo?.moduleType || 'Mixed',
        adjustmentFactor: averageAdjustmentFactor,
        adjustedCapacity: totalCapacity * averageAdjustmentFactor,
        capacityFactor: averageCapacityFactor
      }
    },
    location: {
      latitude,
      longitude,
      lat: latitude,
      lng: longitude
    },
    timezone,
    country: systemResults[0].country || "United States",
    city: systemResults[0].city || "Unknown"
  };
}

// Step 1: Efficiency Matching - Find closest PVWatts module type
export function matchPVWattsModuleType(actualEfficiency: number): { moduleType: number; pvwattsEfficiency: number; adjustmentFactor: number; typeName: string } {
  // Convert decimal efficiency to percentage if needed (e.g. 0.215 -> 21.5)
  const efficiencyPercent = actualEfficiency < 1 ? actualEfficiency * 100 : actualEfficiency;
  
  const efficiencies = [
    { ...PVWATTS_MODULE_TYPES.STANDARD, diff: Math.abs(efficiencyPercent - PVWATTS_MODULE_TYPES.STANDARD.efficiency) },
    { ...PVWATTS_MODULE_TYPES.PREMIUM, diff: Math.abs(efficiencyPercent - PVWATTS_MODULE_TYPES.PREMIUM.efficiency) },
    { ...PVWATTS_MODULE_TYPES.THIN_FILM, diff: Math.abs(efficiencyPercent - PVWATTS_MODULE_TYPES.THIN_FILM.efficiency) }
  ];
  
  // Find closest match
  const closestMatch = efficiencies.reduce((prev, curr) => prev.diff < curr.diff ? prev : curr);
  
  // Step 2: Calculate adjustment factor (using percentage values)
  const adjustmentFactor = efficiencyPercent / closestMatch.efficiency;
  
  console.log(`🔍 EFFICIENCY MATCHING:`, {
    actualEfficiency: `${efficiencyPercent.toFixed(1)}%`,
    closestPVWattsType: closestMatch.name,
    pvwattsEfficiency: `${closestMatch.efficiency}%`,
    adjustmentFactor: adjustmentFactor.toFixed(4)
  });
  
  return {
    moduleType: closestMatch.type,
    pvwattsEfficiency: closestMatch.efficiency,
    adjustmentFactor,
    typeName: closestMatch.name
  };
}

// Step 3: Capacity Adjustment
export function adjustCapacityForPVWatts(originalCapacity: number, adjustmentFactor: number): number {
  const adjustedCapacity = originalCapacity * adjustmentFactor;
  
  console.log(`⚖️ CAPACITY ADJUSTMENT:`, {
    originalCapacity: `${originalCapacity} kW`,
    adjustmentFactor: adjustmentFactor.toFixed(4),
    adjustedCapacity: `${adjustedCapacity.toFixed(2)} kW`
  });
  
  return adjustedCapacity;
}

// Step 4: Module Count Correction (keeping actual placed modules)
export function validateModuleCount(theoreticalCount: number, actualPlacedCount: number, panelPowerRating: number): { finalCapacity: number; moduleCountCorrection: boolean } {
  const finalCapacity = (actualPlacedCount * panelPowerRating) / 1000; // Convert W to kW
  const moduleCountCorrection = actualPlacedCount !== theoreticalCount;
  
  console.log(`🔢 MODULE COUNT VALIDATION:`, {
    theoreticalCount,
    actualPlacedCount,
    panelPowerRating: `${panelPowerRating}W`,
    finalCapacity: `${finalCapacity.toFixed(2)} kW`,
    moduleCountCorrection
  });
  
  return { finalCapacity, moduleCountCorrection };
}

// Step 5: PVWatts API Call with proper parameters
export async function callPVWattsAPI(params: {
  latitude: number;
  longitude: number;
  systemCapacity: number;
  moduleType: number;
  losses: number;
  arrayType: number;
  tilt: number;
  azimuth: number;
  dcAcRatio?: number;
  invEff?: number;
  bifaciality?: number;
  albedo?: number;
  gcr?: number;
}): Promise<PVWattsResponse> {
  const pvwattsParams: Omit<PVWattsRequest, 'api_key'> = {
    system_capacity: params.systemCapacity,
    module_type: params.moduleType,
    losses: params.losses,
    array_type: params.arrayType,
    tilt: params.tilt,
    azimuth: params.azimuth, // No conversion needed for PVWatts V8
    lat: params.latitude,
    lon: params.longitude,
    timeframe: 'hourly',
    dc_ac_ratio: params.dcAcRatio || 1.2,
    ...(params.bifaciality !== undefined && params.bifaciality > 0 && { bifaciality: params.bifaciality }),
    ...(params.albedo !== undefined && { albedo: params.albedo }),
    ...(params.gcr !== undefined && { gcr: params.gcr })
  };
  
  console.log(`🚀 CALLING PVWATTS V8 API:`, {
    url: 'https://developer.nrel.gov/api/pvwatts/v8.json',
    parameters: pvwattsParams,
    hasBifaciality: pvwattsParams.bifaciality !== undefined,
    hasAlbedo: pvwattsParams.albedo !== undefined,
    albedoValue: pvwattsParams.albedo,
    hasGcr: pvwattsParams.gcr !== undefined,
    gcrValue: pvwattsParams.gcr
  });
  
  try {
    const response = await calculatePVWatts(pvwattsParams);
    
      console.log(`✅ PVWATTS API RESPONSE:`, {
    version: response.version,
    acAnnual: response.outputs.ac_annual,
    capacityFactor: response.outputs.capacity_factor,
    location: response.station_info,
    hourlyDataPoints: response.outputs.ac?.length || 0,
    monthlyDataPoints: response.outputs.ac_monthly?.length || 0
  });
    
    return response;
  } catch (error) {
    console.error(`❌ PVWATTS API ERROR:`, error);
    throw error;
  }
}

// Back-correct PVWatts results to actual panel performance
export function backCorrectPVWattsResults(pvwattsResponse: PVWattsResponse, adjustmentFactor: number): PVWattsResponse {
  const correctedResponse = { ...pvwattsResponse };
  
  // Apply inverse adjustment to get actual panel performance
  const inverseAdjustment = 1 / adjustmentFactor;
  
  // Correct annual AC output
  correctedResponse.outputs.ac_annual = pvwattsResponse.outputs.ac_annual * inverseAdjustment;
  
  // Correct monthly AC output
  correctedResponse.outputs.ac_monthly = pvwattsResponse.outputs.ac_monthly.map(
    (monthly: number) => monthly * inverseAdjustment
  );
  
  // Correct monthly DC output
  correctedResponse.outputs.dc_monthly = pvwattsResponse.outputs.dc_monthly.map(
    (monthly: number) => monthly * inverseAdjustment
  );
  
  // Correct hourly AC output if available
  if (pvwattsResponse.outputs.ac) {
    correctedResponse.outputs.ac = pvwattsResponse.outputs.ac.map(
      (hourly: number) => hourly * inverseAdjustment
    );
  }

  // Correct hourly DC output if available
  if (pvwattsResponse.outputs.dc) {
    correctedResponse.outputs.dc = pvwattsResponse.outputs.dc.map(
      (hourly: number) => hourly * inverseAdjustment
    );
  }

  // Copy hourly irradiation data (no correction needed for irradiation)
  if (pvwattsResponse.outputs.poa) {
    correctedResponse.outputs.poa = [...pvwattsResponse.outputs.poa];
  }
  if (pvwattsResponse.outputs.dn) {
    correctedResponse.outputs.dn = [...pvwattsResponse.outputs.dn];
  }
  if (pvwattsResponse.outputs.df) {
    correctedResponse.outputs.df = [...pvwattsResponse.outputs.df];
  }
  if (pvwattsResponse.outputs.gh) {
    correctedResponse.outputs.gh = [...pvwattsResponse.outputs.gh];
  }
  if (pvwattsResponse.outputs.tamb) {
    correctedResponse.outputs.tamb = [...pvwattsResponse.outputs.tamb];
  }
  if (pvwattsResponse.outputs.tcell) {
    correctedResponse.outputs.tcell = [...pvwattsResponse.outputs.tcell];
  }
  if (pvwattsResponse.outputs.wspd) {
    correctedResponse.outputs.wspd = [...pvwattsResponse.outputs.wspd];
  }
  
  console.log(`🔄 BACK-CORRECTION APPLIED:`, {
    adjustmentFactor: adjustmentFactor.toFixed(4),
    inverseAdjustment: inverseAdjustment.toFixed(4),
    originalAcAnnual: pvwattsResponse.outputs.ac_annual,
    correctedAcAnnual: correctedResponse.outputs.ac_annual,
    hourlyDataCorrected: !!correctedResponse.outputs.ac
  });
  
  return correctedResponse;
}

// New PVWatts-based calculation function
export async function calculateSolarEnergyWithPVWatts(params: SolarParams): Promise<SolarCalculationResult> {
  const {
    latitude,
    longitude,
    surface_tilt,
    surface_azimuth,
    module_efficiency,
    plant_capacity_kw,
    module_area,
    module_watt_peak,
    inverterParams,
    array_type = 0,
    losses = 14.08,
    bifaciality,
    albedo,
    gcr
  } = params;

  console.log(`🔬 STARTING PVWATTS-BASED CALCULATION with albedo: ${albedo}`);
  
  // Step 1: Match actual panel efficiency to PVWatts module type
  const efficiencyMatch = matchPVWattsModuleType(module_efficiency);
  
  // Step 2 & 3: Calculate adjustment factor and adjust capacity
  const adjustedCapacity = adjustCapacityForPVWatts(plant_capacity_kw, efficiencyMatch.adjustmentFactor);
  
  // Step 5: Call PVWatts API with adjusted parameters
  const pvwattsResponse = await callPVWattsAPI({
    latitude,
    longitude,
    systemCapacity: adjustedCapacity,
    moduleType: efficiencyMatch.moduleType,
    losses,
    arrayType: array_type,
    tilt: surface_tilt,
    azimuth: surface_azimuth + 180, // Convert from -180:180 to 0:360 for PVWatts
    dcAcRatio: inverterParams?.dc_ac_ratio || 1.2,
    invEff: inverterParams?.efficiency ? inverterParams.efficiency * 100 : 96,
    bifaciality,
    albedo,
    gcr
  });
  
  // Back-correct results to actual panel performance
  const correctedResults = backCorrectPVWattsResults(pvwattsResponse, efficiencyMatch.adjustmentFactor);
  
  // Convert PVWatts response to our standard format
  const monthlyEnergyData = correctedResults.outputs.ac_monthly.map((energy: number, index: number) => ({
    Month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index],
    "Monthly Energy Production (kWh)": energy
  }));
  
  const monthlyIrradiationData = correctedResults.outputs.poa_monthly.map((irradiation: number, index: number) => ({
    Month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index],
    "Monthly Solar Irradiation (kWh/m²)": irradiation
  }));
  
  // Calculate yearly production with degradation
  const yearlyProduction = calculateYearlyProduction(monthlyEnergyData);
  
  // Calculate system details
  const systemDetails = calculateSystemDetails(
    plant_capacity_kw, // Use original capacity for module counts
    module_area,
    module_watt_peak,
    inverterParams
  );

  // Process hourly data if available
  const hourlyEnergyData = correctedResults.outputs.ac;
  const hourlyDCEnergyData = correctedResults.outputs.dc;
  const hourlyIrradiationData = correctedResults.outputs.poa ? {
    poa: correctedResults.outputs.poa,
    dn: correctedResults.outputs.dn || [],
    df: correctedResults.outputs.df || [],
    gh: correctedResults.outputs.gh || [],
    tamb: correctedResults.outputs.tamb || [],
    tcell: correctedResults.outputs.tcell || [],
    wspd: correctedResults.outputs.wspd || []
  } : undefined;

  // Calculate hourly metrics if hourly data is available
  const hourlyEnergyMetrics = hourlyEnergyData ? {
    max_hourly: Math.max(...hourlyEnergyData),
    min_hourly: Math.min(...hourlyEnergyData)
  } : {};

  const hourlyIrradiationMetrics = hourlyIrradiationData?.poa ? {
    max_hourly: Math.max(...hourlyIrradiationData.poa),
    min_hourly: Math.min(...hourlyIrradiationData.poa)
  } : {};

  console.log(`📊 HOURLY DATA PROCESSING:`, {
    hourlyEnergyPoints: hourlyEnergyData?.length || 0,
    hourlyPOAPoints: hourlyIrradiationData?.poa?.length || 0,
    hasTemperatureData: !!(hourlyIrradiationData?.tamb?.length),
    hasWindData: !!(hourlyIrradiationData?.wspd?.length),
    maxHourlyEnergy: hourlyEnergyMetrics.max_hourly || 'N/A',
    minHourlyEnergy: hourlyEnergyMetrics.min_hourly || 'N/A'
  });
  
  return {
    irradiation: {
      monthly: monthlyIrradiationData,
      ...(hourlyIrradiationData && { hourly: hourlyIrradiationData }),
      metrics: {
        max_daily: Math.max(...correctedResults.outputs.poa_monthly) / 30, // Approximate daily
        min_daily: Math.min(...correctedResults.outputs.poa_monthly) / 30,
        total_yearly: correctedResults.outputs.poa_monthly.reduce((sum: number, val: number) => sum + val, 0),
        ...hourlyIrradiationMetrics
      }
    },
    energy: {
      monthly: monthlyEnergyData,
      ...(hourlyEnergyData && { hourly: hourlyEnergyData }),
      ...(hourlyDCEnergyData && { hourlyDC: hourlyDCEnergyData }),
      metrics: {
        max_daily: Math.max(...correctedResults.outputs.ac_monthly) / 30,
        min_daily: Math.min(...correctedResults.outputs.ac_monthly) / 30,
        total_yearly: correctedResults.outputs.ac_annual,
        ...hourlyEnergyMetrics
      }
    },
    yearlyProduction,
    system: {
      ...systemDetails,
      pvWattsParams: {
        array_type,
        losses
      },
      pvwattsInfo: {
        moduleType: efficiencyMatch.typeName,
        adjustmentFactor: efficiencyMatch.adjustmentFactor,
        adjustedCapacity,
        capacityFactor: correctedResults.outputs.capacity_factor
      }
    },
    location: {
      latitude,
      longitude,
      lat: latitude,
      lng: longitude
    },
    timezone: params.timezone || "America/New_York",
    country: correctedResults.station_info.state || "United States",
    city: correctedResults.station_info.city || "Unknown"
  };
}
