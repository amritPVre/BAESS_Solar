
// Simplified irradiation calculation utility
// This would normally use a proper solar library or API

interface IrradiationMonthData {
  Month: string;
  "Monthly Solar Irradiation (kWh/m²)": number;
}

interface IrradiationMetrics {
  max_daily: number;
  min_daily: number;
  total_yearly: number;
}

interface IrradiationResult {
  monthly: IrradiationMonthData[];
  metrics: IrradiationMetrics;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function calculateIrradiation(
  latitude: number,
  longitude: number,
  timezone: string,
  surface_tilt: number,
  surface_azimuth: number
): IrradiationResult {
  // This is a simplified model that approximates irradiation based on latitude
  // A real implementation would use proper solar geometry and weather data
  
  // Base values for irradiation (Northern Hemisphere pattern)
  const baseValues = [2.8, 3.5, 4.5, 5.5, 6.2, 6.5, 6.3, 5.8, 5.0, 4.0, 3.0, 2.5];
  
  // Adjust based on latitude (simplified model)
  const latitudeAdjustedValues = baseValues.map(value => {
    // Reduce solar irradiation for higher latitudes
    const latAdjustment = 1 - (Math.abs(latitude) / 90) * 0.5;
    return value * latAdjustment;
  });
  
  // Adjust for tilt (simplified model)
  // Optimal tilt is roughly equal to latitude for fixed systems
  const tiltFactor = 1 + (1 - Math.abs(surface_tilt - Math.abs(latitude)) / 90) * 0.2;
  
  // Adjust for azimuth (simplified model)
  // 180° (south in northern hemisphere, north in southern hemisphere) is optimal
  const hemisphereOptimalAzimuth = latitude >= 0 ? 180 : 0;
  const azimuthError = Math.abs(hemisphereOptimalAzimuth - surface_azimuth);
  const azimuthFactor = 1 - (azimuthError / 180) * 0.3;
  
  // Combine all factors
  const irradiationValues = latitudeAdjustedValues.map(value => 
    value * tiltFactor * azimuthFactor
  );
  
  // Convert to daily and multiply by days in month to get monthly
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const monthlyValues = irradiationValues.map((daily, index) => daily * daysInMonth[index]);
  
  // Create monthly data array
  const monthly = MONTHS.map((month, index) => ({
    Month: month,
    "Monthly Solar Irradiation (kWh/m²)": monthlyValues[index]
  }));
  
  // Calculate metrics
  const max_daily = Math.max(...irradiationValues);
  const min_daily = Math.min(...irradiationValues);
  const total_yearly = monthlyValues.reduce((sum, val) => sum + val, 0);
  
  return {
    monthly,
    metrics: {
      max_daily,
      min_daily,
      total_yearly
    }
  };
}
