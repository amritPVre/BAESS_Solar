// Define the structure types
export interface StructureType {
  id: string;
  name: string;
  groundCoverageRatio: number;
}

// Define the layout parameters for different structure types
export interface LayoutParameters {
  tiltAngle: number;
  orientation: 'landscape' | 'portrait';
  interRowSpacing: number;
  adjacentGap: number;
  azimuth?: number;
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
  orientation?: 'landscape' | 'portrait'; // Module orientation from user configuration
  // Polygon path coordinates for restoring drawn areas
  path?: Array<{ lat: number; lng: number }>;
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
  /**
   * Number of PV tables/structures in this area.
   * 
   * Calculation method by structure type:
   * - Ground Mount Tables: Uses actual tableConfig (rowsPerTable × modulesPerRow)
   * - Fixed Tilt: Uses actual tableConfig (rowsPerTable × modulesPerRow)  
   * - Carport: Uses actual carportConfig (rows × modulesPerRow)
   * - Ballasted: Estimated at 20 modules per table (2 rows × 10 modules)
   * - PV Table Free Form: Estimated at 16 modules per table (2 rows × 8 modules)
   * 
   * This value is essential for BOQ/BOM generation to calculate:
   * - Purlins and rafters needed
   * - Column posts and foundations
   * - Ballast blocks requirement
   * - Clamps and fasteners
   * - Structural steel quantities
   */
  tableCount?: number;
  
  /**
   * Spatial arrangement of tables in the drawn area.
   * 
   * tableLayoutRows: Number of horizontal rows of tables in the layout
   * tableLayoutCols: Number of vertical columns of tables in the layout
   * 
   * Example: For a 5×4 table arrangement:
   * - tableLayoutRows = 5 (5 horizontal rows of tables)
   * - tableLayoutCols = 4 (4 vertical columns of tables)
   * - tableCount = 20 (total 5×4 = 20 tables)
   */
  tableLayoutRows?: number;
  tableLayoutCols?: number;
}

// Define midpoint marker information
export interface EdgeMidpoint {
  polygonIndex: number;
  edgeIndex: number;
  position: google.maps.LatLngLiteral;
  heading: number;
}

// Define edge dimension label information
export interface EdgeDimensionLabel {
  id: string;
  polygonIndex: number;
  edgeIndex: number;
  label: google.maps.InfoWindow;
  distance: number;
}
