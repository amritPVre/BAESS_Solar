
/**
 * Solar irradiance calculation utilities based on the Python implementation
 */

import { SolarParams, SolarCalculationResult } from "@/types/solarCalculations";

// Types of solar irradiance data by latitude
const solarRadiationByLatitude: Record<string, number[]> = {
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

// Roof orientation factors (azimuth impact)
const orientationFactors: Record<string, number> = {
  south: 1.00,
  southeast: 0.95,
  southwest: 0.95,
  east: 0.85,
  west: 0.85,
  north: 0.60,
};

// Get climate region based on latitude
export const getClimateZone = (latitude: number): keyof typeof solarRadiationByLatitude => {
  const absLat = Math.abs(latitude);
  if (absLat < 15) return 'equatorial';
  if (absLat < 30) return 'tropical';
  if (absLat < 45) return 'subtropical';
  if (absLat < 60) return 'temperate';
  return 'polar';
};

// Calculate tilt efficiency by latitude
export const tiltEfficiencyByLatitude = (latitude: number, tiltAngle: number): number => {
  // Optimal tilt is roughly equal to latitude
  const optimalTilt = Math.abs(latitude);
  const deviation = Math.abs(optimalTilt - tiltAngle);
  
  // Penalize for deviation from optimal tilt
  if (deviation <= 5) return 1.0;
  if (deviation <= 15) return 0.97;
  if (deviation <= 30) return 0.93;
  return 0.88;
};

// Seasonal adjustments based on hemisphere
export const getSeasonalAdjustments = (latitude: number): number[] => {
  // Southern hemisphere seasons are reversed
  if (latitude < 0) {
    return [1.1, 1.05, 0.95, 0.9, 0.85, 0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1];
  }
  // Northern hemisphere
  return [0.8, 0.85, 0.9, 0.95, 1.0, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85, 0.8];
};

// Temperature derating based on climate zone and panel type
export const calculateTemperatureDerating = (
  climateZone: keyof typeof solarRadiationByLatitude,
  panelType: string
): number[] => {
  const coefficient = temperatureCoefficients[panelType as keyof typeof temperatureCoefficients] || -0.4;
  
  // Average monthly temperature deviation from 25°C (standard test conditions)
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

// Get radiation data for a specific location
export const getSolarRadiationData = (latitude: number): number[] => {
  const climateZone = getClimateZone(latitude);
  return solarRadiationByLatitude[climateZone];
};
