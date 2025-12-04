// Types for Solar AI Chat Application

export type CalculationType = 
  | 'pv_sizing'
  | 'financial_analysis'
  | 'irradiance_calculation'
  | 'cable_sizing'
  | 'inverter_sizing'
  | 'battery_sizing'
  | 'load_analysis'
  | 'payback_analysis'
  | 'roi_calculation'
  | 'carbon_offset'
  | 'energy_production'
  | 'dc_cable_sizing'
  | 'string_configuration'
  | 'earthing_sizing'
  | 'tilt_optimization';

export interface CalculationTask {
  id: CalculationType;
  name: string;
  description: string;
  category: 'sizing' | 'financial' | 'technical' | 'environmental';
  icon: string;
  requiredInputs: string[];
  outputFormat: 'table' | 'chart' | 'report' | 'mixed';
  conversationalFlow?: boolean;  // If true, AI asks questions one at a time
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  calculationType?: CalculationType;
  artifactData?: ArtifactData;
}

export interface ArtifactData {
  type: 'calculation' | 'chart' | 'table' | 'report';
  title: string;
  data: any;
  calculationType: CalculationType;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  calculationType?: CalculationType;
  projectName?: string;
}

export interface CalculationInput {
  [key: string]: number | string | boolean;
}

export interface CalculationResult {
  success: boolean;
  data?: any;
  error?: string;
  insights?: string[];
  recommendations?: string[];
}

export interface ExportOptions {
  format: 'pdf' | 'excel';
  includeCharts: boolean;
  includeInsights: boolean;
  includeRecommendations: boolean;
}

// ===== PV SIZING SPECIFIC TYPES =====

// Installation type codes for PVWatts API
export type InstallationType = 0 | 1 | 2 | 3 | 4;
export const INSTALLATION_TYPE_LABELS: Record<InstallationType, string> = {
  0: 'Open Rack (Ground Mounted)',
  1: 'Fixed - Roof Mounted',
  2: '1-Axis Tracker',
  3: '1-Axis Backtracking',
  4: '2-Axis Tracker',
};

// Shading condition
export type ShadingCondition = 'partial' | 'shade_free';
export interface ShadingConfig {
  label: string;
  shadingLoss: number;    // % shading loss
  systemLoss: number;     // % total system loss
}
export const SHADING_CONFIG: Record<ShadingCondition, ShadingConfig> = {
  partial: { label: 'Partially Shaded (up to 10%)', shadingLoss: 3.0, systemLoss: 14.5 },
  shade_free: { label: 'Fully Shade Free (0%)', shadingLoss: 0.5, systemLoss: 12.0 },
};

// AC Voltage options
export type SystemACVoltage = 380 | 400 | 415 | 480;

// Hourly consumption entry (6AM to 6PM)
export interface HourlyConsumptionEntry {
  hour: string;           // "6:00 AM", "7:00 AM", etc.
  consumption: number;    // kWh
}

// PV Sizing input structure
export interface PVSizingInputs {
  // Step 1: Consumption
  dailyDaytimeConsumption: number;  // kWh/day (6AM-6PM)
  hourlyConsumption?: HourlyConsumptionEntry[];  // Optional detailed data
  
  // Step 2: Location
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  
  // Step 3: Space
  availableSpace: number;  // m²
  
  // Step 4: Shading
  shadingCondition: ShadingCondition;
  
  // Step 5: Installation
  installationType: InstallationType;
  
  // Step 6: Panel
  panelManufacturer: string;
  
  // Step 7: Inverter
  inverterManufacturer: string;
  
  // Step 8: Voltage
  systemACVoltage: SystemACVoltage;
}

// Inverter configuration result
export interface InverterConfig {
  model: string;
  quantity: number;
  acCapacityEach: number;
  totalAcCapacity: number;
  dcAcRatio: number;
}

// Monthly PVWatts data
export interface MonthlyPVData {
  month: string;
  solrad: number;     // kWh/m²/day
  poa: number;        // kWh/m² (plane of array)
  dcOutput: number;   // kWh
  acOutput: number;   // kWh
  pr: number;         // % (performance ratio)
}

// PV Sizing result structure
export interface PVSizingResult {
  // Location
  latitude: number;
  longitude: number;
  timezone: string;
  tilt: number;
  azimuth: number;
  
  // Capacity calculations
  pvCapacity1: number;        // Consumption-based (kWp)
  pvCapacity2: number;        // Space-based (kWp)
  finalCapacity: number;      // Final selected (kWp)
  isSpaceConstrained: boolean;
  numModules: number;
  moduleWattage: number;
  
  // Inverter
  inverterConfig: InverterConfig | null;
  dcAcRatio: number;
  
  // System parameters
  systemLoss: number;
  installationType: InstallationType;
  systemACVoltage: SystemACVoltage;
  panelManufacturer: string;
  inverterManufacturer: string;
  
  // Monthly data
  monthlyData: MonthlyPVData[];
  
  // Annual summary
  annualProduction: number;   // kWh
  specificYield: number;      // kWh/kWp
  capacityFactor: number;     // %
  averagePR: number;          // %
  
  // Area
  requiredArea: number;       // m²
  availableSpace: number;     // m²
}

// Installation item for BOM
export interface InstallationItem {
  sno: number;
  item: string;
  specification: string;
  quantity: number;
  unit: string;
}

