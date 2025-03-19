
export interface InverterParams {
  model: string;
  power: number;
  efficiency: number;
  count: number;
  dcRatio: number;
}

export interface SystemDetails {
  total_modules: number;
  total_area: number;
  calculated_capacity: number;
  inverter_configuration?: {
    model: string;
    power: number;
    efficiency: number;
    count: number;
  };
  number_of_inverters?: number;
  effective_dc_ac_ratio?: number;
  inverter_efficiency?: number;
}

export interface IrradiationData {
  monthly: { Month: string; "Monthly Solar Irradiation (kWh/m²)": number }[];
  metrics: {
    max_daily: number;
    min_daily: number;
    total_yearly: number;
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

export interface SolarParams {
  latitude: number;
  longitude: number;
  timezone: string;
  surface_tilt: number;
  surface_azimuth: number;
  module_efficiency: number;
  performance_ratio: number;
  plant_capacity_kw: number;
  module_area: number;
  module_watt_peak: number;
  inverterParams: InverterParams | null;
}

export interface SolarCalculationResult {
  system: SystemDetails;
  irradiation: IrradiationData;
  energy: EnergyData;
  yearlyProduction: number[];
  location?: { lat: number; lng: number };
  timezone?: string;
}
