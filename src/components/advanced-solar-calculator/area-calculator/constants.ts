
import { LayoutParameters } from './types';

// Default layout parameters for different structure types
export const DEFAULT_LAYOUT_PARAMS: Record<string, Omit<LayoutParameters, 'modulePerFrame'>> = {
  ballasted: {
    tiltAngle: 10,
    orientation: 'landscape',
    interRowSpacing: 1.5,
    adjacentGap: 20,
  },
  fixed_tilt: {
    tiltAngle: 25,
    orientation: 'portrait',
    interRowSpacing: 2.0, 
    adjacentGap: 20,
  },
  ground_mount_tables: {
    tiltAngle: 20,
    orientation: 'landscape',
    interRowSpacing: 0.05,
    adjacentGap: 20,
    tableConfig: {
      rowsPerTable: 3,
      modulesPerRow: 5,
      interTableSpacingY: 4.0,
      interTableSpacingX: 0.5,
    }
  },
  carport: {
    tiltAngle: 5,
    orientation: 'landscape',
    interRowSpacing: 0,
    adjacentGap: 20,
    carportConfig: {
      rows: 6,
      modulesPerRow: 10,
      forceRectangle: true,
    }
  },
};

export const STRUCTURE_TYPES = [
  { id: 'ballasted', name: 'Ballasted Flat Roof', groundCoverageRatio: 0.5 },
  { id: 'fixed_tilt', name: 'Fixed Tilt Ground Mount', groundCoverageRatio: 0.4 },
  { id: 'ground_mount_tables', name: 'Ground Mount Tables', groundCoverageRatio: 0.45 },
  { id: 'carport', name: 'Carport Structure', groundCoverageRatio: 0.7 },
];

// Define libraries array for Google Maps
export const GOOGLE_MAPS_LIBRARIES = [
  "geometry", 
  "drawing"
] as ("geometry" | "drawing" | "places" | "visualization")[];

// Default polygon drawing options
export const DEFAULT_POLYGON_OPTIONS = {
  fillColor: "#FF0000",
  fillOpacity: 0.30,
  strokeWeight: 1,
  strokeColor: "#FF0000",
  clickable: true, 
  editable: true,
  draggable: true,
  zIndex: 1
};
