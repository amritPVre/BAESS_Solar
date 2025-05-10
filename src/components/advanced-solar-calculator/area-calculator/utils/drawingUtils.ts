
/**
 * Utility functions for the area calculator drawing operations
 */

/**
 * Normalizes an angle to be between 0 and 360 degrees
 */
export const normalizeAngle = (angle: number): number => {
  return ((angle % 360) + 360) % 360;
};

/**
 * Converts radians to degrees
 */
export const radToDeg = (rad: number): number => {
  return rad * (180 / Math.PI);
};

/**
 * Converts degrees to radians
 */
export const degToRad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

/**
 * Gets the cardinal/intercardinal direction name from an azimuth value
 */
export const getAzimuthDirectionName = (azimuth: number): string => {
  if (azimuth >= 337.5 || azimuth < 22.5) return 'North';
  if (azimuth >= 22.5 && azimuth < 67.5) return 'Northeast';
  if (azimuth >= 67.5 && azimuth < 112.5) return 'East';
  if (azimuth >= 112.5 && azimuth < 157.5) return 'Southeast';
  if (azimuth >= 157.5 && azimuth < 202.5) return 'South';
  if (azimuth >= 202.5 && azimuth < 247.5) return 'Southwest';
  if (azimuth >= 247.5 && azimuth < 292.5) return 'West';
  if (azimuth >= 292.5 && azimuth < 337.5) return 'Northwest';
  return '';
};

/**
 * Helper function to map structure type to PVWatts array type
 * 0 = Fixed (open rack), 1 = Fixed (roof mount), 2 = 1-Axis Tracking, 3 = 2-Axis Tracking
 */
export const getArrayTypeForStructure = (structureId: string): number => {
  switch (structureId) {
    case 'ballasted':
      return 1; // Fixed (roof mount) for ballasted flat roof
    case 'fixed_tilt':
    case 'ground_mount_tables':
    case 'carport':
      return 0; // Fixed (open rack) for fixed tilt, ground mount tables, and carport
    case 'tracker':
      return 2; // 1-Axis Tracking for tracker
    default:
      return 0; // Default to Fixed (open rack)
  }
};

/**
 * Safely get a module dimension with fallback
 */
export const getModuleDimension = (
  panel: any, 
  dimension: 'length' | 'width', 
  defaultValue: number
): number => {
  if (dimension in panel && typeof panel[dimension] === 'number') {
    return panel[dimension];
  } 
  
  // Try to get from dimensions object
  if (panel.dimensions) {
    const dimensionKey = dimension === 'length' ? 'height' : 'width';
    if (dimensionKey in panel.dimensions && typeof panel.dimensions[dimensionKey] === 'number') {
      return panel.dimensions[dimensionKey];
    }
  }
  
  return defaultValue;
};

/**
 * Debounce function for throttling events
 */
export function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
}
