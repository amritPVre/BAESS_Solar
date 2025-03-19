
// Helper functions for solar energy calculations

/**
 * Get climate zone based on latitude
 */
export const getClimateZone = (latitude: number): string => {
  const absLat = Math.abs(latitude);
  
  if (absLat < 23.5) {
    return 'tropical';
  } else if (absLat < 35) {
    return 'subtropical';
  } else if (absLat < 55) {
    return 'temperate';
  } else {
    return 'polar';
  }
};

/**
 * Get solar orientation factors for different orientations
 */
export const getOrientationKey = (azimuth: number): string => {
  // Convert azimuth to 0-360 range if needed
  const normalizedAzimuth = ((azimuth % 360) + 360) % 360;
  
  // Define orientation ranges
  if (normalizedAzimuth >= 315 || normalizedAzimuth < 45) {
    return 'north';
  } else if (normalizedAzimuth >= 45 && normalizedAzimuth < 135) {
    return 'east';
  } else if (normalizedAzimuth >= 135 && normalizedAzimuth < 225) {
    return 'south';
  } else {
    return 'west';
  }
};

// Define orientation factors
const orientationFactorsMap: {[key: string]: number} = {
  'north': 0.7,  // Northern Hemisphere: north-facing gets less sun
  'east': 0.85,
  'south': 1.0,  // Northern Hemisphere: south-facing optimal
  'west': 0.85,
  'northeast': 0.75,
  'northwest': 0.75,
  'southeast': 0.95,
  'southwest': 0.95
};

export const getOrientationFactor = (orientation: string): number => {
  return orientationFactorsMap[orientation] || 0.8; // Default if orientation not found
};

/**
 * Calculate tilt efficiency factor based on latitude
 */
export const tiltEfficiencyByLatitude = (latitude: number, tilt: number): number => {
  const absLat = Math.abs(latitude);
  const optimalTilt = absLat * 0.76; // Approximate optimal tilt
  
  const tiltDiff = Math.abs(tilt - optimalTilt);
  
  if (tiltDiff < 5) {
    return 1.0; // Optimal tilt
  } else if (tiltDiff < 15) {
    return 0.95; // Near optimal
  } else if (tiltDiff < 30) {
    return 0.9; // Reasonable
  } else {
    return 0.85; // Far from optimal
  }
};

/**
 * Get seasonal adjustment factors based on latitude
 */
export const getSeasonalAdjustments = (latitude: number): number[] => {
  const absLat = Math.abs(latitude);
  
  if (absLat < 15) {
    // Near equator - minimal seasonal variation
    return [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
  } else if (absLat < 30) {
    // Subtropical
    return [0.95, 0.98, 1.0, 1.03, 1.05, 1.06, 1.05, 1.03, 1.0, 0.98, 0.95, 0.93];
  } else if (absLat < 45) {
    // Temperate
    return [0.8, 0.9, 1.0, 1.1, 1.2, 1.25, 1.2, 1.1, 1.0, 0.9, 0.8, 0.75];
  } else {
    // Northern/Southern
    return [0.6, 0.75, 0.9, 1.1, 1.3, 1.4, 1.3, 1.1, 0.9, 0.75, 0.6, 0.5];
  }
};

/**
 * Calculate temperature derating based on climate zone and panel type
 */
export const calculateTemperatureDerating = (
  climateZone: string, 
  panelType: string
): number[] => {
  // Base derating factors for different months
  let baseDerating: number[] = [];
  
  switch (climateZone) {
    case 'tropical':
      baseDerating = [0.92, 0.92, 0.91, 0.90, 0.90, 0.90, 0.90, 0.90, 0.91, 0.91, 0.92, 0.92];
      break;
    case 'subtropical':
      baseDerating = [0.94, 0.94, 0.93, 0.92, 0.91, 0.90, 0.90, 0.91, 0.92, 0.93, 0.94, 0.94];
      break;
    case 'temperate':
      baseDerating = [0.97, 0.96, 0.95, 0.94, 0.93, 0.92, 0.92, 0.93, 0.94, 0.95, 0.96, 0.97];
      break;
    case 'polar':
      baseDerating = [0.99, 0.98, 0.97, 0.96, 0.95, 0.94, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99];
      break;
    default:
      baseDerating = [0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95];
  }
  
  // Adjust for panel type
  let panelFactor = 1.0;
  
  switch (panelType.toLowerCase()) {
    case 'monocrystalline':
      panelFactor = 1.0; // Reference
      break;
    case 'polycrystalline':
      panelFactor = 0.98; // Slightly less efficient
      break;
    case 'thin-film':
      panelFactor = 0.97; // Less efficient, but better temperature coefficient
      break;
    case 'bifacial':
      panelFactor = 1.02; // More efficient due to rear side production
      break;
    default:
      panelFactor = 1.0;
  }
  
  // Apply panel factor
  return baseDerating.map(factor => factor * panelFactor);
};

/**
 * Get monthly average solar radiation data based on latitude
 */
export const getSolarRadiationData = (latitude: number): number[] => {
  const absLat = Math.abs(latitude);
  
  // Base daily solar radiation values (kWh/m²/day) for different latitude bands
  if (absLat < 15) {
    // Equatorial
    return [5.8, 6.0, 6.0, 5.9, 5.7, 5.5, 5.5, 5.6, 5.8, 5.9, 5.9, 5.8];
  } else if (absLat < 30) {
    // Tropical/Subtropical
    return [5.0, 5.4, 5.8, 6.0, 6.1, 6.2, 6.1, 6.0, 5.8, 5.4, 5.0, 4.8];
  } else if (absLat < 45) {
    // Temperate
    return [3.0, 3.8, 4.5, 5.2, 5.8, 6.0, 5.8, 5.2, 4.5, 3.8, 3.0, 2.7];
  } else if (absLat < 60) {
    // Northern/Southern
    return [2.0, 2.8, 3.5, 4.5, 5.5, 6.0, 5.5, 4.5, 3.5, 2.8, 2.0, 1.7];
  } else {
    // Polar
    return [0.5, 1.5, 2.5, 4.0, 5.5, 6.0, 5.5, 4.0, 2.5, 1.5, 0.5, 0.2];
  }
};
