import { LayoutParameters, StructureType } from './types';

// Define structure types
export const STRUCTURE_TYPES: StructureType[] = [
  { id: 'ballasted', name: 'Ballasted Flat Roof', groundCoverageRatio: 0.5 },
  { id: 'fixed_tilt', name: 'Fixed Tilt Elevated', groundCoverageRatio: 0.4 },
  { id: 'ground_mount_tables', name: 'Ground Mount Tables', groundCoverageRatio: 0.45 },
  { id: 'carport', name: 'Carport Structure', groundCoverageRatio: 0.7 },
  { id: 'pv_table_free_form', name: 'PV Table - Free Form', groundCoverageRatio: 0.9 },
];

// Define polygon drawing options
export const DEFAULT_POLYGON_OPTIONS: google.maps.PolygonOptions = {
  fillColor: "#F5B942",   // Amber/gold color (kept for potential future use)
  fillOpacity: 0.0,       // Made completely transparent - no background fill
  strokeWeight: 2,        // Slightly thicker border
  strokeColor: "#F5B942", // Matching stroke color for boundary outline
  clickable: true, 
  editable: true,
  draggable: true,
  zIndex: 0               // Lower z-index so polygons appear behind modules
};

// Define default layout parameters for each structure type
export const DEFAULT_LAYOUT_PARAMS: Record<string, LayoutParameters> = {
  ballasted: {
    tiltAngle: 10,
    orientation: 'landscape',
    interRowSpacing: 1.5,
    adjacentGap: 20,
  },
  fixed_tilt: {
    tiltAngle: 25,
    orientation: 'portrait',
    interRowSpacing: 0.05, // small gap between rows within the same table
    adjacentGap: 20,       // small gap between modules in the same row
    tableConfig: {
      rowsPerTable: 1,         // default 1 row per table (can be 1-4)
      modulesPerRow: 8,        // default 8 modules per row (max 12)
      interTableSpacingY: 4.0, // 4 meters between tables in Y direction
      interTableSpacingX: 0.5, // 0.5 meters between tables in X direction
    }
  },
  ground_mount_tables: {
    tiltAngle: 20,
    orientation: 'landscape',
    interRowSpacing: 0.05, // small gap between rows within the same table
    adjacentGap: 20,       // small gap between modules in the same row
    tableConfig: {
      rowsPerTable: 3,         // default 3 rows per table
      modulesPerRow: 5,        // default 5 modules per row
      interTableSpacingY: 4.0, // 4 meters between tables in Y direction
      interTableSpacingX: 0.5, // 0.5 meters between tables in X direction
    }
  },
  carport: {
    tiltAngle: 5,
    orientation: 'landscape',
    interRowSpacing: 0,
    adjacentGap: 20,
    carportConfig: {
      rows: 6,              // Default number of rows
      modulesPerRow: 10,    // Default modules per row
      forceRectangle: true, // Force rectangular shape
    }
  },
  pv_table_free_form: {
    tiltAngle: 15,
    orientation: 'landscape',
    interRowSpacing: 0, // No inter-row spacing - only module to module gap
    adjacentGap: 20, // 20mm default module gap (user can change)
  },
};
