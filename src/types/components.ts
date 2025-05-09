
export interface SolarPanel {
  id: string;
  manufacturer: string;
  model: string;
  power: number;
  power_rating?: number;
  efficiency: number;
  technology: string;
  warranty: number;
  length?: number; // mm
  width?: number;  // mm
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
