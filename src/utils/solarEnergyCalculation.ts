
import { SolarCalculationResult, SolarParams } from "@/types/solarCalculations";
import { calculateSystemDetails } from './systemDetailsCalculation';
import { calculateIrradiation } from './irradiationCalculation';
import { calculateEnergyProduction } from './energyProductionCalculation';
import { calculateYearlyProduction } from './yearlyProductionCalculation';

export interface InverterParams {
  inverter_model: string;
  quantity: number;
  dc_ac_ratio: number;
  power?: number;
  efficiency?: number;
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
