
import {
  getClimateZone,
  tiltEfficiencyByLatitude,
  getSeasonalAdjustments,
  calculateTemperatureDerating,
  getSolarRadiationData,
  getOrientationKey,
  getOrientationFactor
} from './solarIrradianceCalculation';
import { InverterParams, SolarCalculationResult, SolarParams } from '@/types/solarCalculations';

/**
 * Calculate solar energy production based on provided parameters
 * This is a port of the Python-based solar calculation engine
 */
export const calculateSolarEnergy = (params: SolarParams): SolarCalculationResult => {
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
    inverterParams
  } = params;

  // Input validation
  if (
    latitude === undefined || 
    longitude === undefined || 
    surface_tilt === undefined || 
    surface_azimuth === undefined ||
    module_efficiency === undefined ||
    performance_ratio === undefined ||
    plant_capacity_kw === undefined ||
    module_area === undefined ||
    module_watt_peak === undefined
  ) {
    throw new Error("Required parameters cannot be None");
  }

  // Validate parameter ranges
  if (latitude < -90 || latitude > 90) {
    throw new Error("Latitude must be between -90 and 90 degrees");
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error("Longitude must be between -180 and 180 degrees");
  }
  if (surface_tilt < 0 || surface_tilt > 90) {
    throw new Error("Surface tilt must be between 0 and 90 degrees");
  }
  if (surface_azimuth < -180 || surface_azimuth > 180) {
    throw new Error("Surface azimuth must be between -180 and 180 degrees");
  }
  if (module_efficiency <= 0 || module_efficiency > 1) {
    throw new Error("Module efficiency must be between 0 and 1");
  }
  if (performance_ratio <= 0 || performance_ratio > 1) {
    throw new Error("Performance ratio must be between 0 and 1");
  }
  if (plant_capacity_kw <= 0) {
    throw new Error("Plant capacity must be greater than 0");
  }

  // Get inverter configuration if available
  let inverter_dc_ac_ratio = 1.0;  // Default value
  let number_of_inverters = 1;     // Default value
  let inverter_efficiency = 0.98;  // Default inverter efficiency
  
  // Apply inverter parameters if available
  let effective_capacity = plant_capacity_kw;
  let effective_performance_ratio = performance_ratio; // Create a new variable instead of modifying the constant
  
  if (inverterParams) {
    number_of_inverters = inverterParams.configuration.num_inverters;
    inverter_dc_ac_ratio = inverterParams.configuration.dc_ac_ratio;
    inverter_efficiency = inverterParams.specifications.max_efficiency;
    
    // Calculate effective capacity considering inverter limitations
    const total_ac_capacity = number_of_inverters * inverterParams.specifications.nominal_ac_power;
    effective_capacity = Math.min(plant_capacity_kw, total_ac_capacity);
    
    // Update performance ratio to include inverter efficiency
    effective_performance_ratio = performance_ratio * inverter_efficiency;
  }

  // Calculate system parameters
  const total_modules = Math.round(plant_capacity_kw * 1000 / module_watt_peak);
  const calculated_capacity = (total_modules * module_watt_peak) / 1000;
  const total_area = module_area * total_modules;

  // Get climate zone and base solar radiation data
  const climateZone = getClimateZone(latitude);
  const baseRadiation = getSolarRadiationData(latitude);
  const seasonalAdjustments = getSeasonalAdjustments(latitude);
  const temperatureDeratingFactors = calculateTemperatureDerating(climateZone, 'monocrystalline'); // Default to mono
  
  // Get orientation and tilt factors
  const orientationKey = getOrientationKey(surface_azimuth);
  const orientationFactor = getOrientationFactor(orientationKey);
  const tiltFactor = tiltEfficiencyByLatitude(latitude, surface_tilt);

  // Calculate monthly irradiation and production
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  let daily_gii: number[] = [];
  let monthly_gii: number[] = [];
  let monthly_gii_with_names: {Month: string, 'Monthly Solar Irradiation (kWh/m²)': number}[] = [];
  
  // Calculate daily and monthly irradiation
  for (let i = 0; i < 12; i++) {
    const dailyIrradiation = baseRadiation[i] * 
                           orientationFactor * 
                           tiltFactor * 
                           seasonalAdjustments[i] * 
                           temperatureDeratingFactors[i];
                           
    daily_gii.push(dailyIrradiation);
    const monthlyIrrad = dailyIrradiation * daysInMonth[i];
    monthly_gii.push(monthlyIrrad);
    monthly_gii_with_names.push({
      'Month': months[i],
      'Monthly Solar Irradiation (kWh/m²)': monthlyIrrad
    });
  }

  // Calculate daily energy production
  let daily_energy: number[] = daily_gii.map(irrad => 
    irrad * module_efficiency * effective_performance_ratio // Use the new variable here
  );

  // Apply inverter clipping if configuration is available
  if (inverterParams) {
    const max_ac_power_per_inverter = inverterParams.specifications.nominal_ac_power;
    const max_total_ac_power = max_ac_power_per_inverter * number_of_inverters;
    
    // More sophisticated clipping model
    const clipping_threshold = max_total_ac_power * 0.99;  // 99% of AC rating is a typical threshold
    const hourly_energy_clipped = [...daily_energy];
    const clipped_energy = daily_energy.filter(energy => energy > clipping_threshold);
    const clipping_losses = clipped_energy.map(energy => energy - clipping_threshold).reduce((sum, val) => sum + val, 0);
    
    // Clip daily energy to inverter AC capacity
    daily_energy = daily_energy.map(energy => Math.min(energy, max_total_ac_power));
  }

  // Calculate monthly energy production
  const monthly_energy = daily_energy.map((daily, index) => daily * daysInMonth[index] * total_area);
  const monthly_energy_with_names = monthly_energy.map((energy, index) => ({
    'Month': months[index],
    'Monthly Energy Production (kWh)': energy
  }));

  // Calculate yearly metrics
  const yearly_irradiation = monthly_gii.reduce((sum, val) => sum + val, 0);
  const yearly_energy_production = monthly_energy.reduce((sum, val) => sum + val, 0);

  // Calculate 25-year production with degradation (default 0.5% per year)
  const degradation_rate = 0.005; // 0.5% annual degradation
  const yearly_production = [yearly_energy_production];
  
  for (let year = 1; year < 25; year++) {
    const degraded_production = yearly_energy_production * Math.pow(1 - degradation_rate, year);
    yearly_production.push(degraded_production);
  }

  // Create result object
  return {
    irradiation: {
      daily: daily_gii.map((value, index) => ({ Date: new Date(2023, index, 15), 'Daily Solar Irradiation (kWh/m²)': value })),
      monthly: monthly_gii_with_names,
      metrics: {
        max_daily: Math.max(...daily_gii),
        min_daily: Math.min(...daily_gii),
        total_yearly: yearly_irradiation
      }
    },
    energy: {
      daily: daily_energy.map((value, index) => ({ Date: new Date(2023, index, 15), 'Daily Energy Production (kWh)': value * total_area })),
      monthly: monthly_energy_with_names,
      metrics: {
        max_daily: Math.max(...daily_energy) * total_area,
        min_daily: Math.min(...daily_energy) * total_area,
        total_yearly: yearly_energy_production
      }
    },
    system: {
      total_modules: total_modules,
      total_area: total_area,
      calculated_capacity: calculated_capacity,
      inverter_configuration: inverterParams || null,
      effective_dc_ac_ratio: inverter_dc_ac_ratio,
      number_of_inverters: number_of_inverters,
      inverter_efficiency: inverter_efficiency
    },
    yearlyProduction: yearly_production
  };
};
