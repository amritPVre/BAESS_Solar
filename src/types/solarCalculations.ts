
export interface InverterParams {
  model: string;
  power: number;
  efficiency: number;
  count: number;
  dcRatio: number;
  configuration?: {
    num_inverters: number;
    dc_ac_ratio: number;
  };
  specifications?: {
    nominal_ac_power: number;
    max_efficiency: number;
  };
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
  daily?: { Date: Date; "Daily Solar Irradiation (kWh/m²)": number }[];
}

export interface EnergyData {
  monthly: { Month: string; "Monthly Energy Production (kWh)": number }[];
  metrics: {
    max_daily: number;
    min_daily: number;
    total_yearly: number;
  };
  daily?: { Date: Date; "Daily Energy Production (kWh)": number }[];
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
  country?: string;
  city?: string;
}

// Financial calculation types
export interface Currency {
  symbol: string;
  name: string;
  country: string;
}

export interface RegionalData {
  countries: string[];
  cost_per_kw: number;
  default_tariff: number;
  om_cost_percent: number;
  default_escalation: number;
}

export interface ProjectCost {
  base_cost_usd: number;
  base_cost_local: number;
  cost_per_kw_usd: number;
  cost_per_kw_local: number;
  cost_local?: number;
  cost_per_kw_actual?: number;
  currency: string;
  currency_symbol: string;
}

export interface OMParams {
  yearly_om_cost: number;
  om_escalation: number;
  tariff_escalation: number;
}

export interface ElectricityTariff {
  type: string;
  rate?: number;
  slabs?: { units: number; rate: number }[];
}

export interface ElectricityData {
  system_type: string;
  consumption?: {
    type: string;
    value?: number;
    values?: Record<string, number>;
  };
  tariff: ElectricityTariff;
  yearly_amount: number;
  yearly_cost?: number;
}

export interface FinancialSettings {
  region: string;
  country: string;
  currency: string;
  currency_symbol: string;
  exchange_rate: number;
  regional_data: RegionalData;
}

export interface YearlyDetail {
  year: number;
  degradation_factor: number;
  energy_output: number;
  revenue?: number;
  savings?: number;
  om_cost: number;
  net_cash_flow: number;
}

export interface FinancialMetrics {
  npv: number;
  irr: number;
  roi: number;
  payback_period: number;
  yearly_details: YearlyDetail[];
  cash_flows: number[];
  system_type: string;
  summary: {
    total_energy_25yr: number;
    total_revenue_25yr: number;
    total_om_cost_25yr: number;
    net_revenue_25yr: number;
    revenue_type: string;
  };
}
