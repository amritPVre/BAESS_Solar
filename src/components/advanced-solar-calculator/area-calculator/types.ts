
// Define the structure types
export interface StructureType {
  id: string;
  name: string;
  groundCoverageRatio: number;
}

// Define the layout parameters for different structure types
export interface LayoutParameters {
  tiltAngle: number;
  orientation: 'portrait' | 'landscape';
  interRowSpacing: number;
  adjacentGap: number;
  tableConfig?: {
    rowsPerTable: number;
    modulesPerRow: number;
    interTableSpacingY: number;
    interTableSpacingX: number;
  };
  carportConfig?: {
    rows: number;
    modulesPerRow: number;
    forceRectangle: boolean;
  };
}

// Define polygon information
export interface PolygonInfo {
  polygon: google.maps.Polygon;
  area: number;
  azimuth?: number;
}

// Define polygon configuration for exporting to other components
export interface PolygonConfig {
  id: number;
  area: number;
  azimuth: number;
  capacityKw: number;
  moduleCount: number;
  structureType: string;
  tiltAngle: number;
}

// Define midpoint marker information
export interface EdgeMidpoint {
  polygonIndex: number;
  edgeIndex: number;
  position: google.maps.LatLngLiteral;
  heading: number;
}
