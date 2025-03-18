
/**
 * Type definitions for solar energy calculations
 */

export interface SolarParams {
  // Location parameters
  latitude: number;
  longitude: number;
  timezone: string;
  
  // PV system parameters
  surface_tilt: number;
  surface_azimuth: number;
  module_efficiency: number;
  performance_ratio: number;
  plant_capacity_kw: number;
  module_area: number;
  module_watt_peak: number;
  
  // Optional inverter configuration
  inverterParams?: InverterParams;
}

export interface InverterParams {
  configuration: {
    num_inverters: number;
    dc_ac_ratio: number;
  };
  specifications: {
    nominal_ac_power: number;
    max_efficiency: number;
  };
}

export interface SolarCalculationResult {
  irradiation: {
    daily: { Date: Date; 'Daily Solar Irradiation (kWh/m²)': number }[];
    monthly: { Month: string; 'Monthly Solar Irradiation (kWh/m²)': number }[];
    metrics: {
      max_daily: number;
      min_daily: number;
      total_yearly: number;
    };
  };
  energy: {
    daily: { Date: Date; 'Daily Energy Production (kWh)': number }[];
    monthly: { Month: string; 'Monthly Energy Production (kWh)': number }[];
    metrics: {
      max_daily: number;
      min_daily: number;
      total_yearly: number;
    };
  };
  system: {
    total_modules: number;
    total_area: number;
    calculated_capacity: number;
    inverter_configuration: InverterParams | null;
    effective_dc_ac_ratio: number;
    number_of_inverters: number;
    inverter_efficiency: number;
  };
  yearlyProduction: number[];
}
