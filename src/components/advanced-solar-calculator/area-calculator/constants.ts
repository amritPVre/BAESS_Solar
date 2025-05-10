
// Constants for the area calculator

// Libraries for Google Maps API
export const GOOGLE_MAPS_LIBRARIES = ["drawing", "geometry", "places"] as ["drawing", "geometry", "places"];

// Default options for polygons
export const DEFAULT_POLYGON_OPTIONS: google.maps.PolygonOptions = { 
  fillColor: "#FF0000",
  fillOpacity: 0.30,
  strokeWeight: 1,
  strokeColor: "#FF0000",
  clickable: true, 
  editable: true,
  draggable: true,
  zIndex: 1
};

// Structure types
export const STRUCTURE_TYPES = [
  { id: 'ballasted', name: 'Ballasted Flat Roof', groundCoverageRatio: 0.5 },
  { id: 'fixed_tilt', name: 'Fixed Tilt Ground Mount', groundCoverageRatio: 0.4 },
  { id: 'ground_mount_tables', name: 'Ground Mount Tables', groundCoverageRatio: 0.45 },
  { id: 'tracker', name: '1-Axis Tracker', groundCoverageRatio: 0.33 },
  { id: 'carport', name: 'Carport Structure', groundCoverageRatio: 0.7 },
];

// Default layout parameters for different structure types
export const DEFAULT_LAYOUT_PARAMS: Record<string, any> = {
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
    interRowSpacing: 0.05, // small gap between rows within the same table
    adjacentGap: 20,       // small gap between modules in the same row
    tableConfig: {
      rowsPerTable: 3,         // default 3 rows per table
      modulesPerRow: 5,        // default 5 modules per row
      interTableSpacingY: 4.0, // 4 meters between tables in Y direction
      interTableSpacingX: 0.5, // 0.5 meters between tables in X direction
    }
  },
  tracker: {
    tiltAngle: 0, // Variable for trackers
    orientation: 'landscape',
    interRowSpacing: 4.0,
    adjacentGap: 25,
  },
  carport: {
    tiltAngle: 5,
    orientation: 'landscape',
    interRowSpacing: 0,
    adjacentGap: 20,
    // Add carport-specific configuration
    carportConfig: {
      rows: 6,              // Default number of rows
      modulesPerRow: 10,    // Default modules per row
      forceRectangle: true, // Force rectangular shape
    }
  },
};
