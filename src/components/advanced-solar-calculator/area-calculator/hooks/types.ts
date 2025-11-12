import { PolygonConfig } from '../types';

export interface PolygonInfo {
  polygon: google.maps.Polygon;
  azimuth?: number;
  area?: number;
}

export interface SolarPanel {
  id: string;
  manufacturer: string;
  model: string;
  panel_area_m2?: number;
  efficiency_percent?: number;
  nominal_power_w?: number;
  power?: number;
  power_rating?: number;
}

export interface StructureType {
  id: string;
  name: string;
}

export interface TableConfig {
  rowsPerTable: number;
  modulesPerRow: number;
  interTableSpacingX: number;
  interTableSpacingY: number;
}

export interface LayoutParameters {
  tiltAngle: number;
  orientation: 'landscape' | 'portrait';
  interRowSpacing: number;
  adjacentGap: number;
  azimuth?: number;
  tableConfig?: TableConfig;
  carportConfig?: {
    rows: number;
    modulesPerRow: number;
    forceRectangle: boolean;
  };
}

export enum TableLayoutAlignment {
  Left = 'left',
  Center = 'center',
  Right = 'right',
  Justify = 'justify',
  Optimum = 'optimum'
}

export interface UseModulePlacementProps {
  polygons: PolygonInfo[];
  selectedPanel: SolarPanel;
  map: google.maps.Map | null;
  moduleCount: number;
  structureType: StructureType;
  layoutParams: LayoutParameters;
  onCapacityCalculated: (capacityKw: number, areaM2: number, moduleCount: number, configs?: PolygonConfig[]) => void;
  totalArea: number;
  tableAlignment?: TableLayoutAlignment;
}

export interface ModuleLayout {
  maxX: number;
  maxY: number;
  moduleWidthWithSpacing: number;
  moduleHeightWithSpacing: number;
}

export interface LocalPoint {
  x: number;
  y: number;
}

export interface PlacementResult {
  moduleRectangles: google.maps.Rectangle[];
  moduleCount: number;
  configs: PolygonConfig[];
} 