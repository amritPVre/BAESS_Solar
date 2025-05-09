
export interface SolarCalculationResult {
  energy: EnergyData;
  irradiation: IrradiationData;
  yearlyProduction: number[];
  system: SystemDetails;
  location: {
    latitude: number;
    longitude: number;
  };
  timezone?: string; // Added to fix errors
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
  power?: number;
  efficiency?: number;
  // These properties are used in some components but not in the main calculation
  specifications?: any;
  configuration?: any;
  model?: string;
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

// Add missing types for financial calculator 
export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface ElectricityData {
  price: number;
  annualConsumption: number;
  annualExport: number;
  exportPrice: number;
  annualPriceIncrease: number;
}

export interface OMParams {
  annualOMCost: number;
  inverterReplacementYear: number;
  inverterReplacementCost: number;
}

export interface ProjectCost {
  totalCost: number;
  costPerWatt: number;
  additionalCosts: number;
  subsidyAmount: number;
  depreciation: number;
}

export interface RegionalData {
  sunshineHours: number;
  carbonIntensity: number;
  electricityTax: number;
}

export interface FinancialSettings {
  interestRate: number;
  inflationRate: number;
  discountRate: number;
  loanTerm: number;
  loanAmount: number;
  downPayment: number;
}

export interface FinancialMetrics {
  paybackPeriod: number;
  roi: number;
  npv: number;
  irr: number;
  lcoe: number;
  savingsLifetime: number;
  firstYearSavings: number;
  carbonOffsetTons: number;
}

// Interface for PVWatts API response
export interface PVWattsResponse {
  inputs: any;
  outputs: {
    ac_monthly: number[];
    dc_monthly: number[];
    poa_monthly: number[];
    ac_annual: number;
    solrad_annual: number;
    capacity_factor: number;
    ac: number[];
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
