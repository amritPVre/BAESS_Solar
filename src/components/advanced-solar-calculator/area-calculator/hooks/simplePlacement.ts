import { 
  PolygonInfo, 
  SolarPanel, 
  LayoutParameters, 
  TableLayoutAlignment
} from './types';
import { PolygonConfig, StructureType } from '../types';
import { 
  latLngToLocalXY, 
  localXYToLatLng, 
  calculateLocalBoundingBox,
  getRotationFromAzimuth 
} from './coordinateUtils';
import { 
  createModuleRectangle, 
  createModulePolygon,
  checkModuleContainment 
} from './moduleRenderer';

/**
 * Place modules using simple grid strategy for ballasted and similar structures
 * This uses azimuth-aligned grid placement for maximum area utilization
 */
export function placeModulesSimpleGrid(
  polygon: PolygonInfo,
  polygonIndex: number,
  selectedPanel: SolarPanel,
  map: google.maps.Map,
  moduleCount: number,
  layoutParams: LayoutParameters,
  tableAlignment: TableLayoutAlignment,
  center: google.maps.LatLng,
  structureType: StructureType
): {
  moduleRectangles: google.maps.Rectangle[];
  placedCount: number;
  config: PolygonConfig;
} {
  console.log(`🔧 Simple grid placement for polygon ${polygonIndex} with azimuth ${polygon.azimuth || 180}°`);
  
  const moduleRectangles: google.maps.Rectangle[] = [];
  let placedCount = 0;
  
  // Get module dimensions
  const panelArea = selectedPanel.panel_area_m2 || 2.701;
  const aspectRatio = layoutParams.orientation === 'landscape' ? 2.16 / 2.76 : 2.76 / 2.16;
  const moduleWidth = Math.sqrt(panelArea * aspectRatio);
  const moduleHeight = panelArea / moduleWidth;
  
  // Calculate spacing
  const adjacentGapM = layoutParams.adjacentGap / 1000;
  const moduleWidthWithSpacing = moduleWidth + adjacentGapM;
  const moduleHeightWithSpacing = moduleHeight + layoutParams.interRowSpacing;
  
  // Get azimuth and rotation
  const azimuth = polygon.azimuth || 180;
  const rotationRad = getRotationFromAzimuth(azimuth);
  
  console.log(`📐 Module dimensions: ${moduleWidth.toFixed(2)}m x ${moduleHeight.toFixed(2)}m`);
  console.log(`📏 Spacing: ${moduleWidthWithSpacing.toFixed(2)}m x ${moduleHeightWithSpacing.toFixed(2)}m`);
  console.log(`🔄 Rotation: ${(rotationRad * 180 / Math.PI).toFixed(1)}°`);
  
  // Calculate bounding box in local coordinate system
  const bounds = calculateLocalBoundingBox(polygon.polygon, center, rotationRad);
  console.log(`📦 Local bounds: X[${bounds.minX.toFixed(2)}, ${bounds.maxX.toFixed(2)}], Y[${bounds.minY.toFixed(2)}, ${bounds.maxY.toFixed(2)}]`);
  
  // Scan grid positions in local coordinate system
  const scanStep = Math.min(moduleWidthWithSpacing, moduleHeightWithSpacing) * 0.25; // Fine granularity
  const scanMargin = Math.max(moduleWidthWithSpacing, moduleHeightWithSpacing); // Extended scan range
  
  console.log(`🔍 Scanning with step: ${scanStep.toFixed(2)}m, margin: ${scanMargin.toFixed(2)}m`);
  
  for (let localY = bounds.minY - scanMargin; localY <= bounds.maxY + scanMargin && placedCount < moduleCount; localY += scanStep) {
    for (let localX = bounds.minX - scanMargin; localX <= bounds.maxX + scanMargin && placedCount < moduleCount; localX += scanStep) {
      
      // Convert module center to lat/lng
      const moduleCenter = localXYToLatLng(localX, localY, center, rotationRad);
      
      // Calculate module corners in local coordinate system
      const halfWidth = moduleWidth / 2;
      const halfHeight = moduleHeight / 2;
      const moduleCornersLocal = [
        { x: localX - halfWidth, y: localY - halfHeight },
        { x: localX + halfWidth, y: localY - halfHeight },
        { x: localX + halfWidth, y: localY + halfHeight },
        { x: localX - halfWidth, y: localY + halfHeight }
      ];
      
      // Convert corners to lat/lng
      const moduleCornersLatLng = moduleCornersLocal.map(p => 
        localXYToLatLng(p.x, p.y, center, rotationRad)
      );
      
      // Check containment (relaxed for better area utilization)
      const requireAllCorners = tableAlignment === TableLayoutAlignment.Justify;
      const canPlace = checkModuleContainment(
        moduleCornersLatLng, 
        moduleCenter, 
        polygon.polygon, 
        requireAllCorners
      );
      
      if (canPlace) {
        // Create module visual
        if (Math.abs(rotationRad) > 0.01) {
          // Use polygon for rotated modules
          const modulePolygon = createModulePolygon(moduleCornersLatLng, map);
          moduleRectangles.push(modulePolygon as unknown as google.maps.Rectangle);
        } else {
          // Use rectangle for non-rotated modules
          const lats = moduleCornersLatLng.map(p => p.lat());
          const lngs = moduleCornersLatLng.map(p => p.lng());
          const bounds = {
            north: Math.max(...lats),
            south: Math.min(...lats),
            east: Math.max(...lngs),
            west: Math.min(...lngs)
          };
          const moduleRect = createModuleRectangle(bounds, map);
          moduleRectangles.push(moduleRect);
        }
        
        placedCount++;
        
        // Log every 50th module for debugging
        if (placedCount % 50 === 0) {
          console.log(`✅ Placed ${placedCount} modules so far`);
        }
      }
    }
  }
  
  console.log(`🎯 Simple grid placement complete: ${placedCount} modules placed`);
  
  // Calculate area and capacity
  const polygonArea = google.maps.geometry.spherical.computeArea(polygon.polygon.getPath());
  const moduleArea = placedCount * panelArea;
  const panelPower = selectedPanel.nominal_power_w || 615;
  const capacity = (placedCount * panelPower) / 1000; // kW
  
  // Calculate table count based on structure type
  let tableCount = 0;
  switch (structureType.id) {
    case 'ground_mount_tables': {
      // Use actual layout parameters if available
      if (layoutParams.tableConfig) {
        const modulesPerTable = layoutParams.tableConfig.rowsPerTable * layoutParams.tableConfig.modulesPerRow;
        tableCount = Math.ceil(placedCount / modulesPerTable);
      } else {
        // Default: 3 rows × 5 modules = 15 modules per table
        tableCount = Math.ceil(placedCount / 15);
      }
      break;
    }
    case 'fixed_tilt': {
      // Use actual layout parameters if available
      if (layoutParams.tableConfig) {
        const modulesPerTable = layoutParams.tableConfig.rowsPerTable * layoutParams.tableConfig.modulesPerRow;
        tableCount = Math.ceil(placedCount / modulesPerTable);
      } else {
        // Default: 1 row × 8 modules = 8 modules per table
        tableCount = Math.ceil(placedCount / 8);
      }
      break;
    }
    case 'carport': {
      // Use actual carport configuration if available
      if (layoutParams.carportConfig) {
        const modulesPerCarport = layoutParams.carportConfig.rows * layoutParams.carportConfig.modulesPerRow;
        tableCount = Math.ceil(placedCount / modulesPerCarport);
      } else {
        // Default: 6 rows × 10 modules = 60 modules per carport
        tableCount = Math.ceil(placedCount / 60);
      }
      break;
    }
    case 'ballasted': {
      // For ballasted systems, calculate based on typical ballasted table structure
      // Typical ballasted table: 2 rows × 10 modules = 20 modules per table
      // This helps quantify purlins, rafters, ballast blocks, clamps, etc.
      const modulesPerBallastTable = 20;
      tableCount = Math.ceil(placedCount / modulesPerBallastTable);
      break;
    }
    case 'pv_table_free_form': {
      // For free-form PV tables, estimate based on typical table configuration  
      // Typical PV table: 2 rows × 8 modules = 16 modules per table
      const modulesPerTable = 16;
      tableCount = Math.ceil(placedCount / modulesPerTable);
      break;
    }
    default: {
      // For unknown structure types, use a conservative estimate
      tableCount = Math.ceil(placedCount / 16);
      break;
    }
  }
  
  const config: PolygonConfig = {
    id: polygonIndex,
    area: polygonArea,
    azimuth: azimuth,
    capacityKw: capacity,
    moduleCount: placedCount,
    structureType: structureType.id,
    tiltAngle: layoutParams.tiltAngle,
    tableCount: tableCount
  };
  
  return {
    moduleRectangles,
    placedCount,
    config
  };
} 