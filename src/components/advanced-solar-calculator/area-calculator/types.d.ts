
// If this file already exists, add or update these types
export interface StructureType {
  id: string;
  name: string;
  groundCoverageRatio: number;
}

export interface EdgeMidpoint {
  polygonIndex: number;
  edgeIndex: number;
  position: google.maps.LatLngLiteral;
  heading: number; // Azimuth of the edge (0-360, clockwise from North)
}

export interface LayoutParameters {
  tiltAngle: number;
  orientation: 'portrait' | 'landscape';
  interRowSpacing: number; // in meters
  adjacentGap: number; // in mm
  // Ground Mount Table specific parameters
  tableConfig?: {
    rowsPerTable: number;
    modulesPerRow: number;
    interTableSpacingY: number; // distance between tables in Y axis (m)
    interTableSpacingX: number; // distance between tables in X axis (m)
  };
  // Carport specific parameters
  carportConfig?: {
    rows: number;           // Number of rows
    modulesPerRow: number;  // Modules per row
    forceRectangle: boolean; // Force rectangular shape
  };
}

export interface PolygonInfo {
  polygon: google.maps.Polygon;
  area: number;
  azimuth?: number;
}

export interface PolygonConfig {
  id: number;
  area: number;
  azimuth: number;
  capacityKw: number;
  moduleCount: number;
  structureType: string;
  tiltAngle: number;
}
