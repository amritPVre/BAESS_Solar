import { LocalPoint } from './types';

/**
 * Convert lat/lng coordinates to local XY system aligned with azimuth
 */
export function latLngToLocalXY(
  latLng: google.maps.LatLng, 
  center: google.maps.LatLng, 
  rotationRad: number
): LocalPoint {
  // Convert to meters relative to center
  const deltaLat = latLng.lat() - center.lat();
  const deltaLng = latLng.lng() - center.lng();
  const x = deltaLng * 111320 * Math.cos(center.lat() * Math.PI / 180);
  const y = deltaLat * 110540;
  
  // Apply rotation
  const rotatedX = x * Math.cos(rotationRad) - y * Math.sin(rotationRad);
  const rotatedY = x * Math.sin(rotationRad) + y * Math.cos(rotationRad);
  
  return { x: rotatedX, y: rotatedY };
}

/**
 * Convert local XY coordinates back to lat/lng
 */
export function localXYToLatLng(
  x: number, 
  y: number, 
  center: google.maps.LatLng, 
  rotationRad: number
): google.maps.LatLng {
  // Apply inverse rotation
  const originalX = x * Math.cos(-rotationRad) - y * Math.sin(-rotationRad);
  const originalY = x * Math.sin(-rotationRad) + y * Math.cos(-rotationRad);
  
  // Convert back to lat/lng
  const deltaLat = originalY / 110540;
  const deltaLng = originalX / (111320 * Math.cos(center.lat() * Math.PI / 180));
  
  return new google.maps.LatLng(
    center.lat() + deltaLat,
    center.lng() + deltaLng
  );
}

/**
 * Calculate bounding box in local XY coordinate system
 */
export function calculateLocalBoundingBox(
  polygon: google.maps.Polygon,
  center: google.maps.LatLng,
  rotationRad: number
): { minX: number; maxX: number; minY: number; maxY: number } {
  const path = polygon.getPath();
  const localPoints: LocalPoint[] = [];
  
  for (let i = 0; i < path.getLength(); i++) {
    localPoints.push(latLngToLocalXY(path.getAt(i), center, rotationRad));
  }
  
  return {
    minX: Math.min(...localPoints.map(p => p.x)),
    maxX: Math.max(...localPoints.map(p => p.x)),
    minY: Math.min(...localPoints.map(p => p.y)),
    maxY: Math.max(...localPoints.map(p => p.y))
  };
}

/**
 * Check if a point is inside a polygon
 */
export function isPointInPolygon(
  point: google.maps.LatLng,
  polygon: google.maps.Polygon
): boolean {
  return google.maps.geometry.poly.containsLocation(point, polygon);
}

/**
 * Calculate rotation angle in radians from azimuth
 */
export function getRotationFromAzimuth(azimuth: number): number {
  return ((azimuth - 180) * Math.PI) / 180;
} 