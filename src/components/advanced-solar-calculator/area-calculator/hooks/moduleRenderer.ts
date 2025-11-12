import { MODULE_STYLE } from './constants';

/**
 * Create a rectangular module (for non-rotated placements)
 */
export function createModuleRectangle(
  bounds: google.maps.LatLngBounds | { north: number; south: number; east: number; west: number },
  map: google.maps.Map
): google.maps.Rectangle {
  return new google.maps.Rectangle({
    bounds: bounds,
    map: map,
    ...MODULE_STYLE
  });
}

/**
 * Create a polygonal module (for rotated placements)
 */
export function createModulePolygon(
  corners: google.maps.LatLng[],
  map: google.maps.Map
): google.maps.Polygon {
  return new google.maps.Polygon({
    paths: corners,
    map: map,
    strokeColor: MODULE_STYLE.strokeColor,
    strokeOpacity: MODULE_STYLE.strokeOpacity,
    strokeWeight: MODULE_STYLE.strokeWeight,
    fillColor: MODULE_STYLE.fillColor,
    fillOpacity: MODULE_STYLE.fillOpacity,
    zIndex: MODULE_STYLE.zIndex
  });
}

/**
 * Calculate module corners in lat/lng from center and dimensions
 */
export function calculateModuleCorners(
  centerLatLng: google.maps.LatLng,
  moduleWidth: number,
  moduleHeight: number,
  rotationRad: number = 0
): google.maps.LatLng[] {
  const halfWidth = moduleWidth / 2;
  const halfHeight = moduleHeight / 2;
  
  // Base corners (unrotated)
  const corners = [
    { x: -halfWidth, y: -halfHeight }, // Top-left
    { x: halfWidth, y: -halfHeight },  // Top-right
    { x: halfWidth, y: halfHeight },   // Bottom-right
    { x: -halfWidth, y: halfHeight }   // Bottom-left
  ];
  
  // Apply rotation and convert to lat/lng
  return corners.map(corner => {
    // Rotate around center
    const rotatedX = corner.x * Math.cos(rotationRad) - corner.y * Math.sin(rotationRad);
    const rotatedY = corner.x * Math.sin(rotationRad) + corner.y * Math.cos(rotationRad);
    
    // Convert to lat/lng offset
    const latOffset = rotatedY * 0.0000089; // meters to degrees lat
    const lngOffset = rotatedX * 0.0000089 / Math.cos(centerLatLng.lat() * Math.PI / 180); // meters to degrees lng
    
    return new google.maps.LatLng(
      centerLatLng.lat() + latOffset,
      centerLatLng.lng() + lngOffset
    );
  });
}

/**
 * Check if module corners satisfy containment requirements
 */
export function checkModuleContainment(
  corners: google.maps.LatLng[],
  centerLatLng: google.maps.LatLng,
  polygon: google.maps.Polygon,
  requireAllCorners: boolean = false
): boolean {
  const centerInside = google.maps.geometry.poly.containsLocation(centerLatLng, polygon);
  const cornersInside = corners.filter(corner => 
    google.maps.geometry.poly.containsLocation(corner, polygon)
  ).length;
  
  if (requireAllCorners) {
    return centerInside && cornersInside === corners.length;
  } else {
    // Relaxed containment: center + at least 3 corners
    return centerInside && cornersInside >= 3;
  }
} 