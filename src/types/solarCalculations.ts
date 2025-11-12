export interface SolarCalculationResult {
  energy: EnergyData;
  irradiation: IrradiationData;
  yearlyProduction: number[];
  system: SystemDetails;
  location: {
    latitude: number;
    longitude: number;
    lat?: number;  // Added for compatibility
    lng?: number;  // Added for compatibility
  };
  timezone?: string;
  country?: string;  // Added for compatibility
  city?: string;     // Added for compatibility
}

export interface EnergyData {
  monthly: { Month: string; "Monthly Energy Production (kWh)": number }[];
  hourly?: number[]; // 8760 hourly AC energy production values (kWh)
  hourlyDC?: number[]; // 8760 hourly DC energy production values (kWh)
  metrics: {
    max_daily: number;
    min_daily: number;
    total_yearly: number;
    max_hourly?: number;
    min_hourly?: number;
  };
}

export interface IrradiationData {
  monthly: { Month: string; "Monthly Solar Irradiation (kWh/m²)": number }[];
  hourly?: {
    poa: number[];    // 8760 hourly plane-of-array irradiance (W/m²)
    dn: number[];     // 8760 hourly direct normal irradiance (W/m²)
    df: number[];     // 8760 hourly diffuse horizontal irradiance (W/m²)
    gh: number[];     // 8760 hourly global horizontal irradiance (W/m²)
    tamb: number[];   // 8760 hourly ambient temperature (°C)
    tcell: number[];  // 8760 hourly cell temperature (°C)
    wspd: number[];   // 8760 hourly wind speed (m/s)
  };
  metrics: {
    max_daily: number;
    min_daily: number;
    total_yearly: number;
    max_hourly?: number;
    min_hourly?: number;
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
  pvwattsInfo?: {
    moduleType: string;
    adjustmentFactor: number;
    adjustedCapacity: number;
    capacityFactor: number;
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
  power?: number;
  efficiency?: number;
  count?: number;        // Added for compatibility
  dcRatio?: number;      // Added for compatibility
  model?: string;        // Added for compatibility
  specifications?: Record<string, unknown>;  // Added for compatibility
  configuration?: Record<string, unknown>;   // Added for compatibility
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
  polygonConfigs?: Record<string, unknown>[]; // Added for multi-area support
  bifaciality?: number; // Added for PVWatts bifaciality parameter (0-1 range)
  albedo?: number; // Surface albedo value (0-1 range)
  gcr?: number; // Ground coverage ratio (0.01-0.99 range)
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
  power_rating?: number; // Added for compatibility
}

// Enhanced types for financial calculator 
export interface Currency {
  code?: string;
  symbol: string;
  name: string;
  country?: string;  // Added for compatibility
}

export interface ElectricityData {
  price?: number;
  annualConsumption?: number;
  annualExport?: number;
  exportPrice?: number;
  annualPriceIncrease?: number;
  
  // Added for compatibility with financialCalculator.ts
  system_type?: string;
  consumption?: number | Record<string, unknown>;
  tariff?: {
    type: string;
    rate?: number;
    slabs?: Array<{ units: number; rate: number }>;
  };
  yearly_amount?: number;
}

export interface OMParams {
  annualOMCost?: number;
  inverterReplacementYear?: number;
  inverterReplacementCost?: number;
  
  // Added for compatibility with financialCalculator.ts
  yearly_om_cost?: number;
  om_escalation?: number;
  tariff_escalation?: number;
}

export interface ProjectCost {
  totalCost?: number;
  costPerWatt?: number;
  additionalCosts?: number;
  subsidyAmount?: number;
  depreciation?: number;
  
  // Added for compatibility with financialCalculator.ts
  base_cost_usd?: number;
  base_cost_local?: number;
  cost_per_kw_usd?: number;
  cost_per_kw_local?: number;
  cost_local?: number;
  currency?: string;
  currency_symbol?: string;
}

export interface RegionalData {
  sunshineHours?: number;
  carbonIntensity?: number;
  electricityTax?: number;
  
  // Added for compatibility with financialCalculator.ts
  countries?: string[];
  cost_per_kw?: number;
  default_tariff?: number;
  om_cost_percent?: number;
  default_escalation?: number;
}

export interface FinancialSettings {
  interestRate?: number;
  inflationRate?: number;
  discountRate?: number;
  loanTerm?: number;
  loanAmount?: number;
  downPayment?: number;
  
  // Added for compatibility with financialCalculator.ts
  region?: string;
  country?: string;
  currency?: string;
  currency_symbol?: string;
  exchange_rate?: number;
  regional_data?: RegionalData;
}

export interface FinancialMetrics {
  paybackPeriod?: number;
  roi?: number;
  npv?: number;
  irr?: number;
  lcoe?: number;
  savingsLifetime?: number;
  firstYearSavings?: number;
  carbonOffsetTons?: number;
  
  // Added for compatibility with financialCalculator.ts
  payback_period?: number;
  yearly_details?: YearlyDetail[];
  cash_flows?: number[];
  system_type?: string;
  summary?: {
    total_energy_25yr: number;
    total_revenue_25yr: number;
    total_om_cost_25yr: number;
    net_revenue_25yr: number;
    revenue_type: string;
  };
}

// Interface for PVWatts API response
export interface PVWattsResponse {
  inputs: Record<string, unknown>;
  outputs: {
    ac_monthly: number[];
    dc_monthly: number[];
    poa_monthly: number[];
    ac_annual: number;
    solrad_annual: number;
    capacity_factor: number;
    ac?: number[];
  };
  station_info: {
    lat: number;
    lon: number;
    elev: number;
    tz: number;
    location: string;
    city: string;
    state: string;
    solar_resource_file: string;
    distance: number;
  };
  version: string;
  errors: string[];
  warnings: string[];
}

// Add missing Year interfaces
export interface YearData {
  year: number;
  energy_production: number;
  energy_value: number;
  loan_payment: number;
  om_cost: number;
  net_savings: number;
  cumulative_savings: number;
}

export interface YearlyFinancialData {
  years: YearData[];
  metrics: FinancialMetrics;
}

// Add YearlyDetail interface for FinancialMetrics
export interface YearlyDetail {
  year: number;
  degradation_factor?: number;
  energy_output?: number;
  om_cost: number;
  net_cash_flow: number;
  revenue?: number;
  savings?: number;
}
