
// Simplified energy production calculation utility

interface EnergyMonthData {
  Month: string;
  "Monthly Energy Production (kWh)": number;
}

interface EnergyMetrics {
  max_daily: number;
  min_daily: number;
  total_yearly: number;
}

interface EnergyResult {
  monthly: EnergyMonthData[];
  metrics: EnergyMetrics;
}

interface IrradiationMonthData {
  Month: string;
  "Monthly Solar Irradiation (kWh/m²)": number;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function calculateEnergyProduction(
  irradiationData: IrradiationMonthData[],
  plant_capacity_kw: number,
  performance_ratio: number,
  module_efficiency: number,
  inverter_efficiency: number,
  pvWattsParams?: {
    arrayType: number;
    losses: number;
  }
): EnergyResult {
  // Simplification: Energy = Irradiation * Area * Module Efficiency * Performance Ratio * Inverter Efficiency
  // For a more accurate calculation, we'd use the PVWatts API or similar
  
  // Additional loss from PVWatts params
  const additionalLossFactor = pvWattsParams ? (1 - pvWattsParams.losses / 100) : 1;
  
  // Array type factor (simplified)
  let arrayTypeFactor = 1.0;
  if (pvWattsParams) {
    // 0 = Fixed (open rack), 1 = Fixed (roof mount), 2 = 1-Axis Tracking, 3 = 2-Axis Tracking
    switch (pvWattsParams.arrayType) {
      case 0: arrayTypeFactor = 1.0; break;    // Fixed (open rack)
      case 1: arrayTypeFactor = 0.95; break;   // Fixed (roof mount)
      case 2: arrayTypeFactor = 1.2; break;    // 1-Axis Tracking
      case 3: arrayTypeFactor = 1.3; break;    // 2-Axis Tracking
      default: arrayTypeFactor = 1.0;
    }
  }
  
  // Calculate monthly energy production
  const monthly = irradiationData.map(month => {
    const irradiation = month["Monthly Solar Irradiation (kWh/m²)"];
    const energy = irradiation * plant_capacity_kw * performance_ratio * inverter_efficiency * arrayTypeFactor * additionalLossFactor;
    
    return {
      Month: month.Month,
      "Monthly Energy Production (kWh)": energy
    };
  });
  
  // Extract daily values (simplified)
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const dailyValues = monthly.map((month, index) => {
    return month["Monthly Energy Production (kWh)"] / daysInMonth[index];
  });
  
  // Calculate metrics
  const max_daily = Math.max(...dailyValues);
  const min_daily = Math.min(...dailyValues);
  const total_yearly = monthly.reduce((sum, month) => sum + month["Monthly Energy Production (kWh)"], 0);
  
  return {
    monthly,
    metrics: {
      max_daily,
      min_daily,
      total_yearly
    }
  };
}
