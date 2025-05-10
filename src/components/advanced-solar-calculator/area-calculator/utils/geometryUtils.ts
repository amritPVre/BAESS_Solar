
// Helper functions for geometry calculations

/**
 * Calculate area of a polygon
 */
export const calculatePolygonArea = (polygon: google.maps.Polygon): number => {
  try {
    const path = polygon.getPath();
    // Ensure geometry library is loaded
    if (window.google && window.google.maps.geometry && window.google.maps.geometry.spherical) {
      return window.google.maps.geometry.spherical.computeArea(path);
    }
    return 0;
  } catch (error) {
    console.error("Error calculating area:", error);
    return 0;
  }
};

/**
 * Calculate distance between two points
 */
export const calculateDistance = (
  point1: google.maps.LatLng, 
  point2: google.maps.LatLng
): number => {
  try {
    if (window.google && window.google.maps.geometry && window.google.maps.geometry.spherical) {
      return window.google.maps.geometry.spherical.computeDistanceBetween(point1, point2);
    }
    return 0;
  } catch (error) {
    console.error("Error calculating distance:", error);
    return 0;
  }
};

/**
 * Calculate heading between two points (0-360 degrees, clockwise from north)
 */
export const calculateHeading = (
  point1: google.maps.LatLng, 
  point2: google.maps.LatLng
): number => {
  try {
    if (window.google && window.google.maps.geometry && window.google.maps.geometry.spherical) {
      const heading = window.google.maps.geometry.spherical.computeHeading(point1, point2);
      return (heading < 0) ? heading + 360 : heading;
    }
    return 0;
  } catch (error) {
    console.error("Error calculating heading:", error);
    return 0;
  }
};

/**
 * Normalize angle to 0-360 range
 */
export const normalizeAngle = (angle: number): number => {
  return ((angle % 360) + 360) % 360;
};

/**
 * Convert degrees to radians
 */
export const toRadians = (degrees: number): number => {
  return degrees * Math.PI / 180;
};

/**
 * Convert radians to degrees
 */
export const toDegrees = (radians: number): number => {
  return radians * 180 / Math.PI;
};
