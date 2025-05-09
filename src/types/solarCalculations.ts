export interface SolarCalculationResult {
  energy: EnergyData;
  irradiation: IrradiationData;
  yearlyProduction: number[];
  system: SystemDetails;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface EnergyData {
  monthly: { Month: string; "Monthly Energy Production (kWh)": number }[];
  metrics: {
    max_daily: number;
    min_daily: number;
    total_yearly: number;
  };
}

export interface IrradiationData {
  monthly: { Month: string; "Monthly Solar Irradiation (kWh/m²)": number }[];
  metrics: {
    max_daily: number;
    min_daily: number;
    total_yearly: number;
  };
}

export interface SystemDetails {
  total_modules: number;
  total_area: number;
  calculated_capacity: number;
  inverter_configuration?: InverterConfigurationDetails;
  number_of_inverters?: number;
  effective_dc_ac_ratio?: number;
  inverter_efficiency: number;
  pvWattsParams?: {
    array_type: number;
    losses: number;
  };
}

export interface InverterConfigurationDetails {
  inverter_model: string;
  quantity: number;
  dc_ac_ratio: number;
}

export interface InverterParams {
  inverter_model: string;
  quantity: number;
  dc_ac_ratio: number;
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

export interface SolarPanel {
  id: string;
  manufacturer: string;
  model: string;
  power: number;
  efficiency: number;
  technology: string;
  warranty: number;
  dimensions: {
    width: number;
    height: number;
  };
  length?: number; // mm
  width?: number;  // mm
  weight: number;
  degradationRate: number;
  temperatureCoefficient: number;
  createdAt: string;
  updatedAt: string;
}
