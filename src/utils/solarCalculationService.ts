
/**
 * This service simulates what would typically be a backend API call to a FastAPI/PVlib service.
 * In a production environment, this would be replaced by actual API calls to a robust
 * calculation engine built with Python (PVlib, SAM, etc.).
 */

// Solar radiation data by latitude zone (approximated data that would come from NASA TMY)
const solarRadiationByLatitude: Record<string, number[]> = {
  // Monthly average radiation data (kWh/m²/day) from equatorial to polar regions
  equatorial: [6.1, 6.3, 6.2, 6.0, 5.8, 5.7, 5.8, 5.9, 6.0, 6.1, 6.2, 6.1], // 0-15° latitude
  tropical: [5.9, 6.1, 6.0, 5.8, 5.4, 5.2, 5.3, 5.5, 5.7, 5.8, 5.9, 5.8],   // 15-30° latitude
  subtropical: [5.0, 5.3, 5.5, 5.8, 5.7, 5.9, 6.0, 5.8, 5.5, 5.1, 4.9, 4.8], // 30-45° latitude
  temperate: [2.5, 3.5, 4.5, 5.3, 5.8, 6.0, 5.8, 5.3, 4.5, 3.5, 2.5, 2.0],   // 45-60° latitude
  polar: [1.0, 2.0, 3.5, 5.0, 5.5, 6.0, 5.5, 5.0, 3.5, 2.0, 1.0, 0.8],      // 60-90° latitude
};

// Temperature coefficients for different panel types
const temperatureCoefficients: Record<string, number> = {
  monocrystalline: -0.38, // %/°C
  polycrystalline: -0.40, // %/°C
  thinfilm: -0.25,       // %/°C
  bifacial: -0.35,       // %/°C
};

// Roof orientation factors (simplified)
const orientationFactors: Record<string, number> = {
  south: 1.00,
  southeast: 0.95,
  southwest: 0.95,
  east: 0.85,
  west: 0.85,
  north: 0.60,
};

// Roof angle (tilt) efficiency factors by latitude zone
const tiltEfficiencyByLatitude = (latitude: number, tiltAngle: number): number => {
  // Optimal tilt is roughly equal to latitude
  const optimalTilt = Math.abs(latitude);
  const deviation = Math.abs(optimalTilt - tiltAngle);
  
  // Penalize for deviation from optimal tilt (simplified)
  if (deviation <= 5) return 1.0;
  if (deviation <= 15) return 0.97;
  if (deviation <= 30) return 0.93;
  return 0.88;
};

// Get climate region based on latitude
const getClimateZone = (latitude: number): keyof typeof solarRadiationByLatitude => {
  const absLat = Math.abs(latitude);
  if (absLat < 15) return 'equatorial';
  if (absLat < 30) return 'tropical';
  if (absLat < 45) return 'subtropical';
  if (absLat < 60) return 'temperate';
  return 'polar';
};

// Seasonal adjustments based on hemisphere
const getSeasonalAdjustments = (latitude: number): number[] => {
  // Southern hemisphere seasons are reversed
  if (latitude < 0) {
    return [1.1, 1.05, 0.95, 0.9, 0.85, 0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1];
  }
  // Northern hemisphere
  return [0.8, 0.85, 0.9, 0.95, 1.0, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85, 0.8];
};

// Temperature derating based on climate zone and panel type
const calculateTemperatureDerating = (
  climateZone: keyof typeof solarRadiationByLatitude,
  panelType: string
): number[] => {
  const coefficient = temperatureCoefficients[panelType] || -0.4;
  
  // Average monthly temperature deviation from 25°C (standard test conditions)
  // This would come from actual weather data in a real implementation
  const tempDeviation: Record<keyof typeof solarRadiationByLatitude, number[]> = {
    equatorial: [5, 5, 6, 7, 7, 6, 6, 6, 7, 7, 6, 5],
    tropical: [3, 4, 6, 7, 9, 10, 10, 9, 8, 6, 4, 3],
    subtropical: [0, 2, 5, 8, 12, 15, 18, 17, 14, 9, 4, 1],
    temperate: [-8, -5, 0, 5, 10, 15, 18, 17, 12, 6, 0, -6],
    polar: [-15, -12, -8, -2, 5, 10, 12, 10, 5, 0, -8, -13],
  };
  
  // Calculate monthly derating factors
  return tempDeviation[climateZone].map(temp => {
    return 1 + (coefficient / 100) * temp;
  });
};

// Calculate yearly production with hourly granularity (simplified to monthly in this mock)
export const calculateDetailedYearlyProduction = (
  systemSize: number,
  location: { lat: number; lng: number },
  panelType: string,
  panelEfficiency: number,
  inverterEfficiency: number,
  roofAngle: number,
  orientation: string,
  shadingFactor: number,
  degradationRate: number,
  years: number = 25
): { 
  yearlyProduction: number[]; 
  monthlyProduction: number[][];
  hourlyProduction?: number[][][] // Would be populated in a real implementation
} => {
  const { lat } = location;
  const climateZone = getClimateZone(lat);
  const baseRadiation = solarRadiationByLatitude[climateZone];
  const seasonalAdjustments = getSeasonalAdjustments(lat);
  const temperatureDeratingFactors = calculateTemperatureDerating(climateZone, panelType);
  const orientationFactor = orientationFactors[orientation] || 0.9;
  const tiltFactor = tiltEfficiencyByLatitude(lat, roofAngle);
  const shadingDerating = 1 - (shadingFactor / 100);
  
  // System efficiency
  const systemEfficiency = (panelEfficiency / 100) * (inverterEfficiency / 100) * 0.85; // 0.85 accounts for DC/AC losses, wiring losses, etc.
  
  // Calculate monthly production for the first year (kWh)
  const monthlyProduction: number[][] = [];
  let firstYearTotal = 0;
  
  // First year's monthly production
  const firstYearMonthly = baseRadiation.map((radiation, monthIndex) => {
    const dailyProduction = 
      radiation * 
      systemSize * 
      systemEfficiency * 
      orientationFactor * 
      tiltFactor * 
      seasonalAdjustments[monthIndex] * 
      temperatureDeratingFactors[monthIndex] * 
      shadingDerating;
    
    // Days in month (approximate)
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][monthIndex];
    const monthlyOutput = dailyProduction * daysInMonth;
    firstYearTotal += monthlyOutput;
    return parseFloat(monthlyOutput.toFixed(2));
  });
  
  monthlyProduction.push(firstYearMonthly);
  
  // Calculate yearly production with degradation
  const yearlyProduction = [firstYearTotal];
  
  // Project for future years
  for (let year = 1; year < years; year++) {
    const degradationFactor = Math.pow(1 - degradationRate / 100, year);
    const yearTotal = firstYearTotal * degradationFactor;
    yearlyProduction.push(parseFloat(yearTotal.toFixed(2)));
    
    // Calculate monthly breakdown for this year
    const yearMonthly = firstYearMonthly.map(monthValue => 
      parseFloat((monthValue * degradationFactor).toFixed(2))
    );
    monthlyProduction.push(yearMonthly);
  }
  
  return {
    yearlyProduction,
    monthlyProduction,
    // Hourly production would be added in a real implementation
  };
};

// Simulate API call to solar calculation service
export const fetchSolarProductionEstimate = async (
  systemParams: {
    systemSize: number;
    location: { lat: number; lng: number };
    panelType: string;
    panelEfficiency: number;
    inverterEfficiency: number;
    roofAngle: number;
    orientation: string;
    shadingFactor: number;
    degradationRate: number;
  }
): Promise<{
  yearlyProduction: number[];
  monthlyProduction: number[][];
  estimatedAnnualProduction: number;
}> => {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const { 
    systemSize, 
    location, 
    panelType, 
    panelEfficiency, 
    inverterEfficiency, 
    roofAngle, 
    orientation, 
    shadingFactor, 
    degradationRate 
  } = systemParams;
  
  // Calculate production details
  const productionData = calculateDetailedYearlyProduction(
    systemSize,
    location,
    panelType,
    panelEfficiency,
    inverterEfficiency,
    roofAngle,
    orientation,
    shadingFactor,
    degradationRate
  );
  
  return {
    ...productionData,
    estimatedAnnualProduction: productionData.yearlyProduction[0]
  };
};
