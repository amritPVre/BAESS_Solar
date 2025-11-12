export interface SolarPanel {
  id: string;
  manufacturer: string;
  model: string;
  power: number;
  power_rating?: number;
  nominal_power_w?: number;
  efficiency: number;
  efficiency_percent?: number;
  technology: string;
  warranty: number;
  length?: number; // mm
  width?: number;  // mm
  module_length?: number; // mm
  module_width?: number;  // mm
  panel_area_m2?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  weight: number;
  degradationRate: number;
  temperatureCoefficient: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Inverter {
  id: string;
  manufacturer: string;
  model: string;
  power: number;
  power_rating?: number;
  efficiency: number;
  acVoltage: number;
  dcVoltage: number;
  warrantyYears: number;
  weight?: number;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  type: string;
  mpptChannels?: number;
  createdAt?: string;
  updatedAt?: string;
}
