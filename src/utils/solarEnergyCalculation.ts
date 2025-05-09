import * as pvwatts from 'pvwatts';
import { SolarCalculationResult, SolarParams } from "@/types/solarCalculations";
import { calculateSystemDetails } from './systemDetailsCalculation';
import { calculateIrradiation } from './irradiationCalculation';
import { calculateEnergyProduction } from './energyProductionCalculation';
import { calculateYearlyProduction } from './yearlyProductionCalculation';

export interface InverterParams {
  power: number;
  efficiency: number;
  cost: number;
  name: string;
  manufacturer: string;
  model: string;
}

export interface SolarParams {
  latitude: number;
  longitude: number;
  timezone: string;
  surface_tilt: number;
  surface_azimuth: number; // -180 to 180 range
  module_efficiency: number;
  performance_ratio: number;
  plant_capacity_kw: number;
  module_area: number;
  module_watt_peak: number;
  inverterParams?: InverterParams | null;
  array_type?: number; // Added for PVWatts integration
  losses?: number;     // Added for PVWatts integration
  polygonConfigs?: any[]; // Added for multi-area support
}

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
  if (!latitude || !longitude || !timezone || !surface_tilt || !surface_azimuth) {
    throw new Error("Missing location parameters");
  }
  if (!module_efficiency || !performance_ratio || !plant_capacity_kw || !module_area || !module_watt_peak) {
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
    systemDetails.effective_inverter_efficiency,
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
    yearlyProductionByMonth: energyProductionData.monthly,
  };
}
