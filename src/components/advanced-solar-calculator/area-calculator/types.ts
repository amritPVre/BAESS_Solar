
import type { SolarPanel } from '@/types/components';

export interface PolygonConfig {
  id: number;
  area: number;
  azimuth: number;
  capacityKw: number;
  moduleCount: number;
  structureType: string;
  tiltAngle: number;
}

export interface PolygonInfo {
  polygon: google.maps.Polygon;
  area: number;
  azimuth?: number;
}

export interface EdgeMidpoint {
  polygonIndex: number;
  edgeIndex: number;
  position: google.maps.LatLngLiteral;
  heading: number;
}

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

export interface StructureType {
  id: string;
  name: string;
  groundCoverageRatio: number;
}
