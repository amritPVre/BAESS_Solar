export const MODULE_STYLE = {
  strokeColor: '#ffffff',
  strokeOpacity: 0.6,
  strokeWeight: 1,
  fillColor: '#7c3aed',
  fillOpacity: 0.8,
  zIndex: 1000
};

export const PLACEMENT_STRATEGIES = {
  SIMPLE_GRID: 'simple-grid',
  TABLE_GRID: 'table-grid',
  CARPORT_GRID: 'carport-grid'
} as const;

export const STRUCTURE_TYPE_MAPPING = {
  ballasted: PLACEMENT_STRATEGIES.SIMPLE_GRID,
  ground_mount_tables: PLACEMENT_STRATEGIES.TABLE_GRID,
  fixed_tilt: PLACEMENT_STRATEGIES.TABLE_GRID,
  single_axis_tracker: PLACEMENT_STRATEGIES.SIMPLE_GRID,
  dual_axis_tracker: PLACEMENT_STRATEGIES.SIMPLE_GRID,
  carport: PLACEMENT_STRATEGIES.CARPORT_GRID,
  pv_table_free_form: PLACEMENT_STRATEGIES.SIMPLE_GRID
} as const;

export const DEFAULT_MODULE_DIMENSIONS = {
  WIDTH: 2.16, // meters
  HEIGHT: 2.76 // meters
};

export const COORDINATE_CONVERSION = {
  METERS_TO_LAT: 0.0000089,
  METERS_TO_LNG_BASE: 0.0000089
}; 