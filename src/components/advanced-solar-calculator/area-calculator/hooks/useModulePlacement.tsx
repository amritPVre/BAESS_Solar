import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { 
  PolygonInfo, 
  SolarPanel, 
  StructureType, 
  TableLayoutAlignment, 
  UseModulePlacementProps
} from './types';
import { PolygonConfig, LayoutParameters } from '../types';
import { STRUCTURE_TYPE_MAPPING, PLACEMENT_STRATEGIES, MODULE_STYLE } from './constants';
import { placeModulesSimpleGrid } from './simplePlacement';
import { toast } from 'sonner';
import isEqual from 'lodash/isEqual';

// Helper function to normalize angles to 0-360 range
function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

// Helper function to rotate a point around another point by an angle in degrees
function rotatePointAroundCenter(
  point: google.maps.LatLng, 
  center: google.maps.LatLng, 
  angleDegrees: number
): google.maps.LatLng {
  if (angleDegrees === 0 || angleDegrees === 360) {
    return point; // No rotation needed
  }
  
  // Convert angle to radians
  const angleRad = (angleDegrees * Math.PI) / 180;
  
  // Convert lat/lng to cartesian coordinates for rotation
  // This is a simplification that works for small distances
  const latScale = 111320; // meters per degree latitude (approximate)
  const lngScale = 111320 * Math.cos(center.lat() * Math.PI / 180); // meters per degree longitude at this latitude
  
  // Calculate x/y distances from center
  const dx = (point.lng() - center.lng()) * lngScale;
  const dy = (point.lat() - center.lat()) * latScale;
  
  // Rotate the point
  const rotatedDx = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
  const rotatedDy = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
  
  // Convert back to lat/lng
  const newLng = center.lng() + (rotatedDx / lngScale);
  const newLat = center.lat() + (rotatedDy / latScale);
  
  return new google.maps.LatLng(newLat, newLng);
}

// Helper function to calculate module corners using spherical geometry
function calculateModuleCorners(
  moduleCenter: google.maps.LatLng,
  moduleWidth: number,
  moduleHeight: number,
  azimuth: number
): {
  moduleNE: google.maps.LatLng;
  moduleSE: google.maps.LatLng;
  moduleSW: google.maps.LatLng;
  moduleNW: google.maps.LatLng;
} {
  const halfWidth = moduleWidth / 2;
  const halfHeight = moduleHeight / 2;
  
  // For solar panels, the height dimension should align with the azimuth direction
  const alongAzimuthHalfLength = halfHeight; // height dimension along azimuth
  const perpendicularHalfLength = halfWidth; // width dimension perpendicular to azimuth
  
  // Calculate distance from center to corner
  const centerToCornerDist = Math.sqrt(perpendicularHalfLength**2 + alongAzimuthHalfLength**2);
  const angleOffset = Math.atan2(perpendicularHalfLength, alongAzimuthHalfLength) * (180 / Math.PI);
  
  // Calculate corner headings using normalized angles
  const moduleNEHeading = normalizeAngle(azimuth - angleOffset);
  const moduleSEHeading = normalizeAngle(azimuth + angleOffset);
  const moduleNWHeading = normalizeAngle(azimuth - angleOffset + 180);
  const moduleSWHeading = normalizeAngle(azimuth + angleOffset + 180);
  
  // Calculate corners using spherical geometry
  const moduleNE = google.maps.geometry.spherical.computeOffset(moduleCenter, centerToCornerDist, moduleNEHeading);
  const moduleSE = google.maps.geometry.spherical.computeOffset(moduleCenter, centerToCornerDist, moduleSEHeading);
  const moduleNW = google.maps.geometry.spherical.computeOffset(moduleCenter, centerToCornerDist, moduleNWHeading);
  const moduleSW = google.maps.geometry.spherical.computeOffset(moduleCenter, centerToCornerDist, moduleSWHeading);
  
  return { moduleNE, moduleSE, moduleSW, moduleNW };
}

// Function to create proper rectangular polygon based on azimuth geometry
function createModulePolygonPath(
  moduleCenter: google.maps.LatLng,
  moduleWidth: number,
  moduleHeight: number,
  azimuth: number
): google.maps.LatLng[] {
  // For solar panels, azimuth represents the direction the panel face points
  // Height dimension aligns with azimuth direction, width is perpendicular
  
  const halfWidth = moduleWidth / 2;
  const halfHeight = moduleHeight / 2;
  
  // Define dimensions: height along azimuth, width perpendicular to azimuth
  const alongAzimuthHalfLength = halfHeight; // height dimension along azimuth
  const perpendicularHalfLength = halfWidth; // width dimension perpendicular to azimuth
  
  // Define corner offsets in panel coordinate system
  // Y-axis points along azimuth, X-axis perpendicular to azimuth
  const cornerOffsets = [
    { x: -perpendicularHalfLength, y: -alongAzimuthHalfLength }, // Bottom-left
    { x: +perpendicularHalfLength, y: -alongAzimuthHalfLength }, // Bottom-right
    { x: +perpendicularHalfLength, y: +alongAzimuthHalfLength }, // Top-right
    { x: -perpendicularHalfLength, y: +alongAzimuthHalfLength }  // Top-left
  ];
  
  const corners: google.maps.LatLng[] = [];
  
  // Calculate each corner position using direct bearing calculation
  cornerOffsets.forEach(offset => {
    let corner: google.maps.LatLng;
    
    if (Math.abs(offset.x) < 0.001 && Math.abs(offset.y) < 0.001) {
      // Center point
      corner = moduleCenter;
    } else {
      // Calculate distance from center to corner
      const distance = Math.sqrt(offset.x * offset.x + offset.y * offset.y);
      
      // Calculate bearing: azimuth + angle from azimuth direction
      let bearing: number;
      if (Math.abs(offset.y) < 0.001) {
        // Point is directly perpendicular to azimuth
        bearing = offset.x > 0 ? normalizeAngle(azimuth + 90) : normalizeAngle(azimuth - 90);
      } else if (Math.abs(offset.x) < 0.001) {
        // Point is directly along azimuth
        bearing = offset.y > 0 ? azimuth : normalizeAngle(azimuth + 180);
      } else {
        // General case: calculate angle relative to azimuth direction
        const angleFromAzimuth = Math.atan2(offset.x, offset.y) * (180 / Math.PI);
        bearing = normalizeAngle(azimuth + angleFromAzimuth);
      }
      
      // Calculate the corner position
      corner = google.maps.geometry.spherical.computeOffset(moduleCenter, distance, bearing);
    }
    
    corners.push(corner);
  });
  
  return corners;
}

export const useModulePlacement = ({
  polygons,
  selectedPanel,
  map,
  moduleCount,
  structureType,
  layoutParams,
  onCapacityCalculated,
  totalArea,
  tableAlignment = TableLayoutAlignment.Center // Default to center alignment
}: UseModulePlacementProps) => {
  const [moduleRectangles, setModuleRectangles] = useState<(google.maps.Rectangle | google.maps.Polygon)[]>([]);
  const [capacityKw, setCapacityKw] = useState<number>(0);
  const [placedModules, setPlacedModules] = useState<number>(0);
  const [usedAreaM2, setUsedAreaM2] = useState<number>(0);
  const [polygonConfigs, setPolygonConfigs] = useState<PolygonConfig[]>([]);

  // Add a state variable for azimuth angle (default south = 180°)
  const [rotationAngleDegrees, setRotationAngleDegrees] = useState<number>(0);
  
  // Various refs for calculation control
  const calculationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTriggerTimeRef = useRef<number>(0);
  const breakChainRef = useRef<boolean>(false);
  const consecutiveCalculationsRef = useRef<number>(0);
  const chainBreakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const calculationInProgressRef = useRef<boolean>(false);
  const calculationLockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedPolygonsRef = useRef<string>("");
  const calculateModulesRef = useRef<(() => void) | null>(null);
  const moduleCalculationPerformedRef = useRef<boolean>(true);

  // Store previous dependency state to avoid redundant calculations
  const prevDependencyKeyRef = useRef("");

  // Add a ref to track layout params for comparison
  const layoutParamsRef = useRef<LayoutParameters>(layoutParams);

  // Forward declaration of functions to resolve circular reference
  const forceRedrawModulesRef = useRef<() => void>(() => {
    console.warn("forceRedrawAllModules called before initialization");
  });

  // Add a result caching mechanism at the top with other refs
  const calculationResultCacheRef = useRef<{
    key: string;
    timestamp: number;
    moduleCount: number;
    capacityKw: number;
  }>({
    key: '',
    timestamp: 0,
    moduleCount: 0,
    capacityKw: 0
  });

  // Track alignment changes - STORE THE ACTUAL CURRENT ALIGNMENT IN A REF
  const currentAlignmentRef = useRef<TableLayoutAlignment>(tableAlignment);
  const prevAlignmentRef = useRef<TableLayoutAlignment>(tableAlignment);

  // Add a mechanism to break calculation chains
  const polyIdListRef = useRef<string[]>([]);
  
  // Add a debounce counter to track consecutive calculations
  const alignmentChangeRef = useRef<boolean>(false);

  // Clean up module rectangles - moved UP in the file
  const clearModuleRectangles = useCallback(() => {
    console.log(`Clearing ${moduleRectangles.length} module rectangles`);
    
    // First remove all rectangles from the map
    moduleRectangles.forEach(rect => {
      if (rect) {
        try {
          if ('setMap' in rect) {
            const mapObj = rect as unknown as google.maps.Rectangle | google.maps.Polygon;
            mapObj.setMap(null);
          }
        } catch (e) {
          console.warn("Error clearing module rectangle:", e);
        }
      }
    });
    
    // Force sync, then clear the state array - important to use setState to trigger re-render
    setModuleRectangles([]);
    
    // Also reset the placed counts, capacity, and configs
    setPlacedModules(0);
    setCapacityKw(0);
    setUsedAreaM2(0);
    setPolygonConfigs([]);
    
    // Make sure we reset any cached calculation results
    calculationResultCacheRef.current = {
      key: '',
      timestamp: 0,
      moduleCount: 0,
      capacityKw: 0
    };
    
    // Ensure the calculation will be performed when triggered
    moduleCalculationPerformedRef.current = true;
    
    // Notify parent component that capacity is now zero
    // Pass 0 for totalArea as well when clearing everything
    onCapacityCalculated(0, 0, 0, []);
  }, [moduleRectangles, onCapacityCalculated]);
  
  // Modify calculation chain break logic to always allow azimuth changes
  const calculateWithDebounce = useCallback(() => {
    // Check if this was triggered by an alignment change or azimuth change
    const isAlignmentChange = alignmentChangeRef.current;
    
    // Increment the counter for consecutive calculations (but not for azimuth)
    if (!isAlignmentChange) {
      consecutiveCalculationsRef.current += 1;
    }
    
    console.log(`Calculation request #${consecutiveCalculationsRef.current}, isAlignmentChange: ${isAlignmentChange}`);
    
    // Always allow alignment changes to go through
    if (isAlignmentChange) {
      console.log("Allowing calculation to proceed despite chain break (alignment change)");
      // Reset counter to prevent excessive throttling
      consecutiveCalculationsRef.current = 0;
      // Reset the alignment change flag
      alignmentChangeRef.current = false;
      // Always proceed with calculation for alignment changes
      breakChainRef.current = false;
      calculateModulesRef.current();
      return;
    }
    
    // For other types of changes, use the normal throttling mechanism
    // If we're getting too many consecutive calculations, we need to break the chain
    if (consecutiveCalculationsRef.current > 5) {
      console.log("⚠️ Too many consecutive calculations detected - breaking the chain");
      
      // Set the break chain flag
      breakChainRef.current = true;
      
      // Clear existing timeouts
      if (calculationTimerRef.current !== null) {
        clearTimeout(calculationTimerRef.current);
        calculationTimerRef.current = null;
      }
      
      if (chainBreakTimeoutRef.current !== null) {
        clearTimeout(chainBreakTimeoutRef.current);
      }
      
      // Reset the counter and break chain flag after a longer timeout
      chainBreakTimeoutRef.current = setTimeout(() => {
        console.log("Resetting calculation chain break");
        consecutiveCalculationsRef.current = 0;
        breakChainRef.current = false;
        chainBreakTimeoutRef.current = null;
      }, 10000); // Increased from 5000ms to 10000ms (10 seconds)
      
      return;
    }
    
    // Proceed with normal calculation if we're not breaking the chain
    if (!breakChainRef.current) {
      calculateModulesRef.current();
    } else {
      console.log("Calculation skipped due to chain break being active");
    }
  }, []);

  // Modify the triggerModuleCalculation function - moved after clearModuleRectangles
  const triggerModuleCalculation = useCallback(() => {
    // Check if chain break is active
    if (breakChainRef.current) {
      console.log("Calculation chain break is active - skipping trigger");
      return;
    }
    
    // Check if a calculation has been recently requested
    const now = Date.now();
    if (now - lastTriggerTimeRef.current < 1000) { // Increase from 800ms to 1000ms
      console.log("Trigger throttled - too frequent and a calculation is already scheduled");
      return;
    }
    
    // Check if a calculation is already in progress
    if (calculationTimerRef.current !== null) {
      console.log("Cancelled previously scheduled calculation for immediate recalculation.");
      clearTimeout(calculationTimerRef.current);
      calculationTimerRef.current = null;
    }
    
    // If a calculation is in progress, don't schedule another one
    if (calculationInProgressRef.current) {
      console.log("Calculation already in progress - skipping new request");
      return;
    }
    
    lastTriggerTimeRef.current = now;
    console.log("Module calculation explicitly triggered - will execute once after delay.");
    
    // Force calculation flag to true to ensure calculation runs
    moduleCalculationPerformedRef.current = true;
    console.log("Set moduleCalculationPerformedRef to TRUE");
    
    // Invalidate cache to force recalculation
    calculationResultCacheRef.current.key = "";
    
    // Schedule calculation with a delay for better throttling
    calculationTimerRef.current = setTimeout(() => {
      calculationTimerRef.current = null;
      
      // Double-check that we're not already calculating before proceeding
      if (calculationInProgressRef.current) {
        console.log("Calculation already in progress when timeout fired - skipping");
        return;
      }
      
      console.log("Executing triggered calculation via setTimeout");
      console.log(`Flag before calculation: ${moduleCalculationPerformedRef.current}`);
      
      // Use debounced calculation function instead of direct call
      calculateWithDebounce();
    }, 1500); // Increased for better throttling
  }, [calculateWithDebounce]);
  
  // Update rotation angle when azimuth changes - MOVED AFTER triggerModuleCalculation is defined
  useEffect(() => {
    if (layoutParams.azimuth !== undefined) {
      // Calculate rotation angle: subtract from 180° (south) to get relative rotation
      // South (180°) is our "forward" direction (0° rotation)
      const newRotationAngle = layoutParams.azimuth - 180;
      console.log(`Azimuth: ${layoutParams.azimuth}°, calculated rotation angle: ${newRotationAngle}°`);
      
      // Reset all throttling mechanisms to ensure this calculation proceeds
      consecutiveCalculationsRef.current = 0;
      breakChainRef.current = false;
      
      // Clear any pending calculations
      if (calculationTimerRef.current !== null) {
        clearTimeout(calculationTimerRef.current);
        calculationTimerRef.current = null;
      }
      
      // Clear existing modules before updating rotation angle
      clearModuleRectangles();
      
      // Update the rotation angle state
      setRotationAngleDegrees(newRotationAngle);
      
      // Force recalculation flag to true to ensure the next calculation happens
      moduleCalculationPerformedRef.current = true;
      
      // Invalidate any cache to force a fresh calculation
      calculationResultCacheRef.current.key = "";
      
      // Schedule a recalculation after rotation is updated
      if (map && polygons.length > 0) {
        // Set a flag to indicate this is an azimuth change (high priority)
        alignmentChangeRef.current = true;
        
        // Use a longer delay to ensure state updates have completed
        setTimeout(() => {
          console.log("Executing azimuth-triggered recalculation");
          // Skip normal throttling for azimuth changes
          calculationInProgressRef.current = false;
          calculateModulesRef.current();
        }, 300);
      }
    } else {
      // Default to south (no rotation)
      setRotationAngleDegrees(0);
    }
  }, [layoutParams.azimuth, clearModuleRectangles, map, polygons]);
  
  // Implement the forceRedrawAllModules function
  const forceRedrawAllModules = useCallback(() => {
    console.log("Force redrawing all modules");
    
    // First clear existing modules
    clearModuleRectangles();
    
    // Reset calculation flags
    moduleCalculationPerformedRef.current = true;
    
    // Invalidate cache to force recalculation
    calculationResultCacheRef.current.key = "";
    
    // Trigger a new calculation
    triggerModuleCalculation();
  }, [clearModuleRectangles, triggerModuleCalculation]);

  // Assign the implemented function to the ref
  forceRedrawModulesRef.current = forceRedrawAllModules;

  // Implement the calculation function
  const calculateModules = useCallback(() => {
    console.log("🔄 Running calculateModules");
    
    const activeAlignment = currentAlignmentRef.current;
    console.log(`Using active alignment: ${activeAlignment} (prop value: ${tableAlignment})`);
    
    if (!map || polygons.length === 0) {
      console.log("No map or polygons available - skipping module calculation");
      return;
    }

    if (calculationInProgressRef.current) {
      console.warn("Calculation already in progress - cannot start another");
      return;
    }

    const cacheKey = JSON.stringify({
      polyCount: polygons.length,
      moduleCount,
      panel: selectedPanel.id,
      structure: structureType.id,
      layout: layoutParams,
      alignment: activeAlignment,
      rotationDegrees: rotationAngleDegrees // Include rotation angle in cache key
    });
    
    if (cacheKey === calculationResultCacheRef.current.key &&
        Date.now() - calculationResultCacheRef.current.timestamp < 10000) {
      console.log("Using cached calculation result - same input parameters");
      return;
    }

    calculationInProgressRef.current = true;
    
    if (calculationLockTimeoutRef.current !== null) {
      clearTimeout(calculationLockTimeoutRef.current);
    }
    calculationLockTimeoutRef.current = setTimeout(() => {
      console.warn("Clearing stuck calculation lock after timeout");
      calculationInProgressRef.current = false;
      calculationLockTimeoutRef.current = null;
    }, 10000);
    
    try {
      // Make sure we clear any existing modules before calculating new ones
      clearModuleRectangles();
      
      // Create a local array of module rectangles to be added to the map
      const newModuleRectangles: (google.maps.Rectangle | google.maps.Polygon)[] = [];
      
      let remainingModules = moduleCount;
      const newConfigs: PolygonConfig[] = [];
      const newPlacedModulesPerPolygon: Record<number, number> = {};
      let totalPlacedModules = 0;
      
      console.log(`Starting calculation for ${polygons.length} polygons and ${moduleCount} modules`);
      console.log(`Using panel: ${selectedPanel.manufacturer} ${selectedPanel.model}`);
      console.log(`Layout params: ${JSON.stringify(layoutParams)}`);
      console.log(`Table alignment: ${activeAlignment}`);
      
      const panelArea = selectedPanel.panel_area_m2 || 2.0;
      const aspectRatio = 1.7;
      
      let panelWidth = Math.sqrt(panelArea / aspectRatio);
      let panelHeight = Math.sqrt(panelArea * aspectRatio);
      
      const unknownPanel = selectedPanel as unknown;
      const panelObj = unknownPanel as { 
        width_mm?: number; 
        width?: number; 
        height_mm?: number; 
        height?: number;
        module_width?: number;    // Add the correct database field
        module_length?: number;   // Add the correct database field
      };
      
      if (panelObj.module_width && typeof panelObj.module_width === 'number') {
        panelWidth = panelObj.module_width / 1000;  // Convert mm to meters
      } else if (panelObj.width_mm && typeof panelObj.width_mm === 'number') {
        panelWidth = panelObj.width_mm / 1000;
      } else if (panelObj.width && typeof panelObj.width === 'number') {
        panelWidth = panelObj.width / 1000;
      }
      
      if (panelObj.module_length && typeof panelObj.module_length === 'number') {
        panelHeight = panelObj.module_length / 1000;  // Convert mm to meters
      } else if (panelObj.height_mm && typeof panelObj.height_mm === 'number') {
        panelHeight = panelObj.height_mm / 1000;
      } else if (panelObj.height && typeof panelObj.height === 'number') {
        panelHeight = panelObj.height / 1000;
      }
      
      // Debug: Log the actual dimensions being used
      console.log(`🔍 Panel dimensions used: width=${panelWidth.toFixed(3)}m, height=${panelHeight.toFixed(3)}m (from DB: module_width=${panelObj.module_width}mm, module_length=${panelObj.module_length}mm)`);
      
      // Handle orientation swap at the beginning (like working reference)
      // Assume panelWidth is shorter dimension, panelHeight is longer dimension
      const panelLengthM = Math.max(panelWidth, panelHeight);  // longer dimension
      const panelWidthM = Math.min(panelWidth, panelHeight);   // shorter dimension
      
      // Apply orientation logic to determine final module dimensions
      const moduleDim = layoutParams.orientation === 'landscape'
        ? { width: panelLengthM, height: panelWidthM }    // landscape: longer x shorter
        : { width: panelWidthM, height: panelLengthM };   // portrait: shorter x longer
      
      const finalModuleWidth = moduleDim.width;
      const finalModuleHeight = moduleDim.height;
      
      console.log(`📐 Orientation: ${layoutParams.orientation}, Final dimensions: ${finalModuleWidth.toFixed(3)}m x ${finalModuleHeight.toFixed(3)}m`);

      polygons.forEach((polygon, polygonIndex) => {
        // Move these declarations to the top of the polygon loop
        let placedInThisPolygon = 0;
        let modulesToPlace = 0;
        let calculatedTablesX = 0; // Actual table grid columns from placement algorithm
        let calculatedTablesY = 0; // Actual table grid rows from placement algorithm
        
        const path = polygon.polygon.getPath();
        const vertexCount = path ? path.getLength() : 0;
        
        if (vertexCount < 3) {
          console.warn(`Polygon ${polygonIndex} has insufficient vertices (${vertexCount}), skipping`);
          return;
        }
        
        const bounds = new google.maps.LatLngBounds();
        for (let i = 0; i < path.getLength(); i++) {
          bounds.extend(path.getAt(i));
        }
        
        const center = bounds.getCenter();
        
        // Get azimuth for this polygon, default to 180 (south) if not specified
        const azimuth = polygon.azimuth || 180;
        // Calculate rotation angle needed to adjust from default south (180°) to desired azimuth
        const rotationAngleDegrees = 180 - azimuth;
        console.log(`Polygon ${polygonIndex} using azimuth ${azimuth}° (rotation ${rotationAngleDegrees}°)`);
        
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        
        // Define half-module dimensions in degrees for center calculation, once per polygon
        const polyCenterLat = center.lat();
        const polyCosLat = Math.cos(polyCenterLat * Math.PI / 180);
        const halfModuleHeight_deg_for_center_calc = (finalModuleHeight / 2) * 0.0000089;
        const halfModuleWidth_deg_for_center_calc = (finalModuleWidth / 2) * 0.0000089 / polyCosLat;
        
        const eastWestDistance = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(ne.lat(), sw.lng()),
          new google.maps.LatLng(ne.lat(), ne.lng())
        );
        
        const northSouthDistance = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(ne.lat(), sw.lng()),
          new google.maps.LatLng(sw.lat(), sw.lng())
        );

        let boundaryMarginFactor = 1.0; // Default to using full polygon dimensions for calculation
        
        if (activeAlignment === TableLayoutAlignment.Justify) {
          boundaryMarginFactor = 0.99; // Justify mode uses a 0.5% margin from edges
          // Additional aggressive spacing for tables might be handled here if needed.
          if (layoutParams.tableConfig) {
            const tableConfig = {...layoutParams.tableConfig};
            if (tableConfig.interTableSpacingX && tableConfig.interTableSpacingX > 0.2) {
              tableConfig.interTableSpacingX = Math.max(0.2, tableConfig.interTableSpacingX * 0.85);
            }
            if (tableConfig.interTableSpacingY && tableConfig.interTableSpacingY > 0.3) {
              tableConfig.interTableSpacingY = Math.max(0.3, tableConfig.interTableSpacingY * 0.85);
            }
            // Note: This local tableConfig modification is not currently used further down for Justify table spacing.
            // The actual aggressive spacing for Justify tables is handled in the table-grid placement logic.
          }
          console.log("Using aggressive margin factor for maximize coverage (Justify):", boundaryMarginFactor);
        }

        const adjustedEastWestDistance = eastWestDistance * boundaryMarginFactor;
        const adjustedNorthSouthDistance = northSouthDistance * boundaryMarginFactor;

        // Determine effective polygon dimensions for grid layout based on global rotation
        let effectivePolygonWidthForGrid = adjustedEastWestDistance;
        let effectivePolygonHeightForGrid = adjustedNorthSouthDistance;

        const globalAngle = Math.abs(rotationAngleDegrees % 360); // rotationAngleDegrees is from state
        
        // More precise detection of sideways rotation - consider both nominal angles (90/270) and small variations
        const isGlobalRotationSideways = (
            (globalAngle >= 45 && globalAngle <= 135) || 
            (globalAngle >= 225 && globalAngle <= 315)
        );

        // Calculate effective grid dimensions considering rotation
        if (isGlobalRotationSideways) {
            // For sideways rotations, we swap width and height
            effectivePolygonWidthForGrid = adjustedNorthSouthDistance;
            effectivePolygonHeightForGrid = adjustedEastWestDistance;
            console.log(`Polygon ${polygonIndex}: Global rotation (${rotationAngleDegrees}°) is sideways. Effective W for grid: ${effectivePolygonWidthForGrid.toFixed(2)}m (from N-S dist), Effective H for grid: ${effectivePolygonHeightForGrid.toFixed(2)}m (from E-W dist)`);
        } else {
            console.log(`Polygon ${polygonIndex}: Global rotation (${rotationAngleDegrees}°) is normal. Effective W for grid: ${effectivePolygonWidthForGrid.toFixed(2)}m (from E-W dist), Effective H for grid: ${effectivePolygonHeightForGrid.toFixed(2)}m (from N-S dist)`);
        }

        // Define generic small edge margins in degrees for calculateOptimalStartPoint for non-table grids
        const genericEdgeMarginMeters = 0.1; // Small 10cm margin
        const genericLatEdgeMarginDegrees = genericEdgeMarginMeters * 0.0000089;
        const genericLngEdgeMarginDegrees = genericEdgeMarginMeters * 0.0000089 / Math.cos(center.lat() * Math.PI / 180);

        // Calculate the aligned starting point for all grid types
        const { startLat: alignedStartLat, startLng: alignedStartLng } = calculateOptimalStartPoint(
            bounds,
            activeAlignment,
            genericLatEdgeMarginDegrees, // Using generic top margin
            genericLngEdgeMarginDegrees  // Using generic width margin
        );
        console.log(`Polygon ${polygonIndex} aligned start point: Lat ${alignedStartLat}, Lng ${alignedStartLng} for alignment ${activeAlignment}`);

        // ROTATION ADJUSTMENT: For 90° and 270° rotations, adjust starting position 
        // to ensure rotated modules stay within polygon bounds
        let adjustedStartLat = alignedStartLat;
        let adjustedStartLng = alignedStartLng;

        // For 90° rotations, we'll handle the positioning in the placement logic itself
        // by using more permissive containment criteria rather than adjusting start position

        // CRITICAL FIX: Adjust starting position for 90°/270° rotations
        if (azimuth === 90 || azimuth === 270) {
          console.log(`🔧 Applying critical starting position fix for ${azimuth}° azimuth`);
          
          // For rotated modules, we need to adjust the starting position by half the dimensional difference
          const dimensionalDiff = (eastWestDistance - northSouthDistance) / 2;
          
          // Convert to degrees
          const latAdjustmentMeters = azimuth === 270 ? dimensionalDiff * 0.8 : -dimensionalDiff * 0.8;
          const lngAdjustmentMeters = azimuth === 270 ? -dimensionalDiff * 0.8 : dimensionalDiff * 0.8;
          
          const latAdjustment = latAdjustmentMeters / 111320;
          const lngAdjustment = lngAdjustmentMeters / (111320 * Math.cos(bounds.getCenter().lat() * Math.PI / 180));
          
          adjustedStartLat = alignedStartLat + latAdjustment;
          adjustedStartLng = alignedStartLng + lngAdjustment;
          
          console.log(`📍 Start position fixed: Lat ${alignedStartLat.toFixed(8)} → ${adjustedStartLat.toFixed(8)}, Lng ${alignedStartLng.toFixed(8)} → ${adjustedStartLng.toFixed(8)}`);
        }

        let moduleLayout: {maxX: number, maxY: number, moduleWidthWithSpacing: number, moduleHeightWithSpacing: number};
        let placementStrategy = STRUCTURE_TYPE_MAPPING[structureType.id as keyof typeof STRUCTURE_TYPE_MAPPING] || PLACEMENT_STRATEGIES.SIMPLE_GRID;
        
        // Modify reduction factors: Justify reduces by 30% for non-tables, others have no reduction.
        const adjacentGapReduction = activeAlignment === TableLayoutAlignment.Justify ? 0.7 : 1.0; 
        const reducedAdjacentGap = layoutParams.adjacentGap > 0 
          ? layoutParams.adjacentGap * adjacentGapReduction 
          : layoutParams.adjacentGap;
        const baseModuleWidthWithSpacing = finalModuleWidth + (reducedAdjacentGap / 1000); // General base width for non-tables
        
        const interRowReduction = activeAlignment === TableLayoutAlignment.Justify ? 0.7 : 1.0;
        const reducedInterRowSpacing = layoutParams.interRowSpacing > 0 
          ? layoutParams.interRowSpacing * interRowReduction 
          : layoutParams.interRowSpacing;
        const baseModuleHeightWithSpacing = finalModuleHeight + reducedInterRowSpacing; // General base height for non-tables
        
        // For 90° and 270° rotations specifically, use adjusted algorithm to maximize space usage
        if (globalAngle >= 85 && globalAngle <= 95 || globalAngle >= 265 && globalAngle <= 275) {
            // For true 90° and 270° rotations, adjust dimensions to maximize space usage
            
            // Calculate the maximum number of modules that could fit in either orientation
            const modulesOnWidth = Math.floor(effectivePolygonWidthForGrid / baseModuleWidthWithSpacing);
            const modulesOnHeight = Math.floor(effectivePolygonHeightForGrid / baseModuleHeightWithSpacing);
            
            // For exact 90/270 degree rotations, make more aggressive use of space
            // Add extra modules if we're close to fitting another row/column
            const remainingWidthSpace = effectivePolygonWidthForGrid - (modulesOnWidth * baseModuleWidthWithSpacing);
            const remainingHeightSpace = effectivePolygonHeightForGrid - (modulesOnHeight * baseModuleHeightWithSpacing);
            
            // If we're close to fitting another module (>65% of required space), be more aggressive
            if (remainingWidthSpace > baseModuleWidthWithSpacing * 0.65) {
                console.log(`90/270° optimization: Adding extra column. Remaining width: ${remainingWidthSpace.toFixed(2)}m, Required: ${baseModuleWidthWithSpacing.toFixed(2)}m`);
                // Will be applied in the grid calculation below
            }
            
            if (remainingHeightSpace > baseModuleHeightWithSpacing * 0.65) {
                console.log(`90/270° optimization: Adding extra row. Remaining height: ${remainingHeightSpace.toFixed(2)}m, Required: ${baseModuleHeightWithSpacing.toFixed(2)}m`);
                // Will be applied in the grid calculation below
            }
        }
        
        // --- Placement strategy selection ---
        // In Justify mode, use per-module grid logic for structures that benefit from it.
        // Table-based structures (ground_mount_tables, fixed_tilt) will use their own enhanced
        // table placement logic for Justify mode to maintain table integrity.
        let usePerModuleGrid = false;
        if (activeAlignment === TableLayoutAlignment.Justify) {
          usePerModuleGrid = (structureType.id !== 'carport' &&
                             structureType.id !== 'ground_mount_tables' &&
                             structureType.id !== 'fixed_tilt');
        }

        if (usePerModuleGrid) {
          // Per-module grid logic using spherical geometry (like working reference)
          // --- SPHERICAL GEOMETRY APPROACH FOR AZIMUTH-ALIGNED MODULE PLACEMENT ---
          const azimuth = polygon.azimuth || 180;
          console.log(`Processing Polygon ${polygonIndex} using Spherical Grid... Azimuth: ${azimuth}°`);
          
          // Calculate polygon centroid
          const path = polygon.polygon.getPath();
          let centerLat = 0;
          let centerLng = 0;
          const vertexCount = path.getLength();
          
          for (let i = 0; i < vertexCount; i++) {
            const vertex = path.getAt(i)!;
            centerLat += vertex.lat();
            centerLng += vertex.lng();
          }
          
          centerLat /= vertexCount;
          centerLng /= vertexCount;
          const startPoint = new google.maps.LatLng(centerLat, centerLng);
          
          // Check if centroid is inside polygon
          const centroidInside = google.maps.geometry.poly.containsLocation(startPoint, polygon.polygon);
          
                     let finalStartPoint = startPoint;
           if (!centroidInside) {
             console.warn(`Centroid is NOT inside polygon! Using fallback point...`);
             // Try using bounds center instead
             const boundsCenter = bounds.getCenter();
             if (google.maps.geometry.poly.containsLocation(boundsCenter, polygon.polygon)) {
               // Use bounds center if it's inside
               finalStartPoint = boundsCenter;
             }
           }
          
          // Determine grid iteration parameters using azimuth
          const rowHeading = azimuth;
          const colHeading = normalizeAngle(azimuth + 90);
          
                     console.log(`Grid Start Point: ${finalStartPoint.toUrlValue()}`);
          console.log(`Headings - Row: ${rowHeading.toFixed(1)}°, Col: ${colHeading.toFixed(1)}°`);
          
          // Maximum search distance (diagonal of bounding box × 1.2 for safety)
          const maxSearchDistance = google.maps.geometry.spherical.computeDistanceBetween(sw, ne) * 1.2;
          const rowDirections = [rowHeading, normalizeAngle(rowHeading + 180)]; // Forward and backward
          const colDirections = [colHeading, normalizeAngle(colHeading + 180)]; // Forward and backward
          
          const MAX_ITERATIONS = 20000;
          let iterations = 0;
          let totalTestPoints = 0;
          
          // Track placed module centers to prevent overlap
          const placedModuleCenters: google.maps.LatLng[] = [];
          const placedModuleDistance = Math.min(baseModuleWidthWithSpacing, baseModuleHeightWithSpacing) * 0.85;
          
          // Utility function to check for overlap
          const isTooCloseToExistingModule = (point: google.maps.LatLng): boolean => {
            for (const existingCenter of placedModuleCenters) {
              if (google.maps.geometry.spherical.computeDistanceBetween(point, existingCenter) < placedModuleDistance) {
                return true;
              }
            }
            return false;
          };
          
          // Spiral outward from center point
          for (const rowDirection of rowDirections) {
            if (placedInThisPolygon >= modulesToPlace) break;
            
                         let rowStart = finalStartPoint;
            let rowNum = 0;
            let rowDistance = 0;
            
            // Spiral out row by row
            while (iterations < MAX_ITERATIONS && 
                   placedInThisPolygon < modulesToPlace && 
                   rowDistance < maxSearchDistance) {
              
              for (const colDirection of colDirections) {
                if (placedInThisPolygon >= modulesToPlace) break;
                
                let currentCenter = rowStart;
                let colNum = 0;
                let colDistance = 0;
                
                // Move along column in current direction
                while (iterations < MAX_ITERATIONS && 
                       placedInThisPolygon < modulesToPlace && 
                       colDistance < maxSearchDistance) {
                  
                  iterations++;
                  totalTestPoints++;
                  
                  // Check if module center is inside polygon
                  const isInside = google.maps.geometry.poly.containsLocation(currentCenter, polygon.polygon);
                  
                  if (isInside && !isTooCloseToExistingModule(currentCenter)) {
                    // Calculate module corners using spherical geometry
                    const corners = calculateModuleCorners(currentCenter, finalModuleWidth, finalModuleHeight, azimuth);
                    
                    // Apply structure-specific containment logic for modules
                    let shouldPlaceModule = false;
                    
                    if (structureType.id === 'ballasted' || structureType.id === 'pv_table_free_form') {
                      // For Ballasted Flat Roof and PV Table - Free Form:
                      // Allow modules that are touching edges but not crossing boundaries
                      // Check if any corner is outside (crossing boundary)
                      const anyCornersOutside = 
                        !google.maps.geometry.poly.containsLocation(corners.moduleNE, polygon.polygon) ||
                        !google.maps.geometry.poly.containsLocation(corners.moduleSE, polygon.polygon) ||
                        !google.maps.geometry.poly.containsLocation(corners.moduleSW, polygon.polygon) ||
                        !google.maps.geometry.poly.containsLocation(corners.moduleNW, polygon.polygon);
                      
                      // Place module only if no corners are crossing boundaries
                      shouldPlaceModule = !anyCornersOutside;
                    } else {
                      // For Ground Mount Tables, Fixed Tilt Elevated, and others:
                      // Require strict containment (all corners inside)
                      const allCornersInside = 
                        google.maps.geometry.poly.containsLocation(corners.moduleNE, polygon.polygon) &&
                        google.maps.geometry.poly.containsLocation(corners.moduleSE, polygon.polygon) &&
                        google.maps.geometry.poly.containsLocation(corners.moduleSW, polygon.polygon) &&
                        google.maps.geometry.poly.containsLocation(corners.moduleNW, polygon.polygon);
                      
                      shouldPlaceModule = allCornersInside;
                    }
                    
                    if (shouldPlaceModule) {
                      // For non-standard azimuth angles OR portrait orientation, create a rotated polygon instead of rectangle
                      // Portrait orientation needs polygons to display correctly even at standard angles
                      if (Math.abs(azimuth % 90) > 1 || layoutParams.orientation === 'portrait') {
                        // Create module as polygon using proper azimuth-based geometry
                        const polygonPath = createModulePolygonPath(
                          currentCenter, 
                          finalModuleWidth, 
                          finalModuleHeight, 
                          azimuth
                        );
                        
                        const modulePolygon = new google.maps.Polygon({
                          paths: polygonPath,
                          strokeColor: MODULE_STYLE.strokeColor,
                          strokeOpacity: MODULE_STYLE.strokeOpacity,
                          strokeWeight: MODULE_STYLE.strokeWeight,
                          fillColor: MODULE_STYLE.fillColor,
                          fillOpacity: MODULE_STYLE.fillOpacity,
                          clickable: false,
                          draggable: false,
                          editable: false,
                          zIndex: MODULE_STYLE.zIndex,
                          map: map,
                        });
                        
                        newModuleRectangles.push(modulePolygon);
                      } else {
                        // For standard angles, use rectangle bounds as before
                        const boundsLiteral = new google.maps.LatLngBounds();
                        boundsLiteral.extend(corners.moduleNE);
                        boundsLiteral.extend(corners.moduleSE);
                        boundsLiteral.extend(corners.moduleSW);
                        boundsLiteral.extend(corners.moduleNW);
                        
                        // Create rectangle for this module
                        const rectangle = new google.maps.Rectangle({
                          strokeColor: MODULE_STYLE.strokeColor,
                          strokeOpacity: MODULE_STYLE.strokeOpacity,
                          strokeWeight: MODULE_STYLE.strokeWeight,
                          fillColor: MODULE_STYLE.fillColor,
                          fillOpacity: MODULE_STYLE.fillOpacity,
                          clickable: false,
                          draggable: false,
                          editable: false,
                          zIndex: MODULE_STYLE.zIndex,
                          bounds: boundsLiteral,
                          map: map,
                        });
                        
                        newModuleRectangles.push(rectangle);
                      }
                      placedModuleCenters.push(currentCenter);
                      placedInThisPolygon++;
                      
                      if (placedInThisPolygon >= modulesToPlace) break;
                    }
                  }
                  
                  // Move to next position in column
                  const nextCenter = google.maps.geometry.spherical.computeOffset(currentCenter, baseModuleWidthWithSpacing, colDirection);
                  if (!nextCenter) break;
                  
                  currentCenter = nextCenter;
                  colNum++;
                  colDistance += baseModuleWidthWithSpacing;
                }
              }
              
              // Move to next row
              const nextRowStart = google.maps.geometry.spherical.computeOffset(rowStart, baseModuleHeightWithSpacing, rowDirection);
              if (!nextRowStart) break;
              
              rowStart = nextRowStart;
              rowNum++;
              rowDistance += baseModuleHeightWithSpacing;
            }
          }
          
          console.log(`Polygon ${polygonIndex} spherical placement stats: ${placedInThisPolygon} modules placed out of ${totalTestPoints} tested points`);
        } else {
          switch(structureType.id) {
            case 'carport': {
              if (layoutParams.carportConfig) {
                console.log(`Using carport configuration: ${layoutParams.carportConfig.rows} rows, ${layoutParams.carportConfig.modulesPerRow} modules per row`);
                placementStrategy = 'carport-grid';
                const carportWidth = baseModuleWidthWithSpacing * layoutParams.carportConfig.modulesPerRow;
                const carportHeight = baseModuleHeightWithSpacing * layoutParams.carportConfig.rows;
                const carportSpacingX = 0.7;
                const carportSpacingY = 1.5;
                const availableWidth = effectivePolygonWidthForGrid * 0.98;
                const availableHeight = effectivePolygonHeightForGrid * 0.98;
                const carportsX = layoutParams.carportConfig.forceRectangle ? 1 : 
                                 Math.floor(availableWidth / (carportWidth + carportSpacingX));
                const carportsY = layoutParams.carportConfig.forceRectangle ? 1 : 
                                 Math.floor(availableHeight / (carportHeight + carportSpacingY));
                moduleLayout = {
                  maxX: layoutParams.carportConfig.modulesPerRow * carportsX,
                  maxY: layoutParams.carportConfig.rows * carportsY,
                  moduleWidthWithSpacing: baseModuleWidthWithSpacing,
                  moduleHeightWithSpacing: baseModuleHeightWithSpacing
                };
                console.log(`Carport grid: ${carportsX}x${carportsY} carports, ${moduleLayout.maxX}x${moduleLayout.maxY} total modules`);
              } else {
                const availableWidth = effectivePolygonWidthForGrid * 0.98;
                const availableHeight = effectivePolygonHeightForGrid * 0.98;
                moduleLayout = {
                  maxX: Math.floor(availableWidth / baseModuleWidthWithSpacing),
                  maxY: Math.floor(availableHeight / baseModuleHeightWithSpacing),
                  moduleWidthWithSpacing: baseModuleWidthWithSpacing,
                  moduleHeightWithSpacing: baseModuleHeightWithSpacing
                };
              }
              break;
            }
            
            case 'fixed_tilt':
            case 'ground_mount_tables': {
              if (layoutParams.tableConfig) {
                console.log(`Using table configuration: ${layoutParams.tableConfig.rowsPerTable} rows per table, ${layoutParams.tableConfig.modulesPerRow} modules per row`);
                placementStrategy = 'table-grid';
                const tableWidthMeters = baseModuleWidthWithSpacing * layoutParams.tableConfig.modulesPerRow;
                const tableHeightMeters = baseModuleHeightWithSpacing * layoutParams.tableConfig.rowsPerTable;
                
                // Apply more aggressive table spacing reduction for Justify mode
                const tableSpacingX = layoutParams.tableConfig.interTableSpacingX || 0.5;
                const tableSpacingY = layoutParams.tableConfig.interTableSpacingY || 4.0;
                
                // In Justify mode (maximum coverage), reduce spacing between tables much more
                // This aggressive reduction is now correctly handled inside the placementStrategy === 'table-grid' block
                // if (activeAlignment === TableLayoutAlignment.Justify) {
                //   tableSpacingX = Math.max(0.1, (layoutParams.tableConfig.interTableSpacingX || 0.5) * 0.3);
                //   tableSpacingY = Math.max(0.2, (layoutParams.tableConfig.interTableSpacingY || 4.0) * 0.5);
                //   console.log(`Justify mode: Using aggressive table spacing: X=${tableSpacingX.toFixed(2)}m, Y=${tableSpacingY.toFixed(2)}m`);
                // }
                
                // Restore the block for calculating overall table grid dimensions and moduleLayout
                const finalAvailableWidthForTables = effectivePolygonWidthForGrid; 
                let finalAvailableHeightForTables = effectivePolygonHeightForGrid; 

                if (activeAlignment === TableLayoutAlignment.Justify) {
                  const topPushDownByJustifyMarginMeters = tableHeightMeters * 0.05;
                  finalAvailableHeightForTables = Math.max(0, finalAvailableHeightForTables - topPushDownByJustifyMarginMeters);
                  console.log(`Switch-case table config: Justify effective height for tablesY reduced by ${topPushDownByJustifyMarginMeters.toFixed(2)}m to ${finalAvailableHeightForTables.toFixed(2)}m`);
                }

                let localTablesX = 0;
                if (finalAvailableWidthForTables >= tableWidthMeters) {
                    localTablesX = Math.floor((finalAvailableWidthForTables + tableSpacingX) / (tableWidthMeters + tableSpacingX));
                }

                let localTablesY = 0;
                if (finalAvailableHeightForTables >= tableHeightMeters) {
                    localTablesY = Math.floor((finalAvailableHeightForTables + tableSpacingY) / (tableHeightMeters + tableSpacingY));
                }
                
                // Store the calculated grid dimensions for use in spatial layout calculation
                calculatedTablesX = localTablesX;
                calculatedTablesY = localTablesY;

                console.log(`Switch-case table config: availableW=${finalAvailableWidthForTables.toFixed(2)}, tableW=${tableWidthMeters.toFixed(2)}, spaceX=${tableSpacingX.toFixed(2)} => calculatedTablesX=${localTablesX}`);
                console.log(`Switch-case table config: availableH=${finalAvailableHeightForTables.toFixed(2)}, tableH=${tableHeightMeters.toFixed(2)}, spaceY=${tableSpacingY.toFixed(2)} => calculatedTablesY=${localTablesY}`);

                if (localTablesX === 0 || localTablesY === 0) {
                  console.warn(`Polygon ${polygonIndex} cannot fit any complete tables (switch-case pre-check).`);
                  moduleLayout = { 
                    maxX: 0, 
                    maxY: 0, 
                    moduleWidthWithSpacing: baseModuleWidthWithSpacing, // Default to base
                    moduleHeightWithSpacing: baseModuleHeightWithSpacing // Default to base
                  };
                } else {
                  moduleLayout = {
                    maxX: layoutParams.tableConfig.modulesPerRow * localTablesX,
                    maxY: layoutParams.tableConfig.rowsPerTable * localTablesY,
                    moduleWidthWithSpacing: baseModuleWidthWithSpacing,      // Use base for overall module count context
                    moduleHeightWithSpacing: baseModuleHeightWithSpacing     // Use base for overall module count context
                  };
                }
                // The following console log is helpful for debugging this stage
                console.log(`Switch-case table config: ${localTablesX}x${localTablesY} tables planned, resulting in moduleLayout.maxX=${moduleLayout.maxX}, moduleLayout.maxY=${moduleLayout.maxY}`);
                
                // Fall through to the placementStrategy === 'table-grid' which has the definitive drawing logic

              } else { // No tableConfig for ground_mount_tables or fixed_tilt
                const availableWidth = effectivePolygonWidthForGrid * 0.98;
                const availableHeight = effectivePolygonHeightForGrid * 0.98;
                moduleLayout = {
                  maxX: Math.floor(availableWidth / baseModuleWidthWithSpacing),
                  maxY: Math.floor(availableHeight / baseModuleHeightWithSpacing),
                  moduleWidthWithSpacing: baseModuleWidthWithSpacing,
                  moduleHeightWithSpacing: baseModuleHeightWithSpacing
                };
              }
              break;
            }
            
            default: { // Handles ballasted, tracker etc. (simple-grid)
              if (activeAlignment === TableLayoutAlignment.Justify) {
                // Justify specific logic for simple-grid
                const availableWidth = effectivePolygonWidthForGrid * 0.98; // Use effective width
                const availableHeight = effectivePolygonHeightForGrid * 0.98; // Use effective height

                // Spacing reductions for Justify - effectively 0.7 (general Justify reduction) * 0.6 (simple-grid Justify specific aggression)
                const interRowReductionForJustify = 0.7 * 0.6;
                const adjacentGapReductionForJustify = 0.7 * 0.6;

                const currentModuleHeightWithSpacing = finalModuleHeight + (layoutParams.interRowSpacing > 0 ? layoutParams.interRowSpacing * interRowReductionForJustify : 0);
                const currentModuleWidthWithSpacing = finalModuleWidth + (layoutParams.adjacentGap > 0 ? (layoutParams.adjacentGap / 1000) * adjacentGapReductionForJustify : 0);
                
                let calculatedMaxY = Math.floor(availableHeight / currentModuleHeightWithSpacing);
                let calculatedMaxX = Math.floor(availableWidth / currentModuleWidthWithSpacing);
                
                // Check if there's enough space for one more row vertically
                const remainingVerticalSpace = availableHeight - (calculatedMaxY * currentModuleHeightWithSpacing);
                if (remainingVerticalSpace > (currentModuleHeightWithSpacing * 0.65)) { 
                  console.log(`Justify (simple-grid): Adding an extra row. Remaining space: ${remainingVerticalSpace.toFixed(2)}m, Reduced module height: ${currentModuleHeightWithSpacing.toFixed(2)}m`);
                  calculatedMaxY += 1;
                }
                
                // Check if there's enough space for one more column horizontally
                const remainingHorizontalSpace = availableWidth - (calculatedMaxX * currentModuleWidthWithSpacing);
                if (remainingHorizontalSpace > (currentModuleWidthWithSpacing * 0.65)) { 
                  console.log(`Justify (simple-grid): Adding an extra column. Remaining space: ${remainingHorizontalSpace.toFixed(2)}m, Reduced module width: ${currentModuleWidthWithSpacing.toFixed(2)}m`);
                  calculatedMaxX += 1;
                }
                
                moduleLayout = {
                  maxX: calculatedMaxX,
                  maxY: calculatedMaxY,
                  moduleWidthWithSpacing: currentModuleWidthWithSpacing,
                  moduleHeightWithSpacing: currentModuleHeightWithSpacing
                };
                console.log(`Justify (simple-grid): Using aggressive layout with ${calculatedMaxX}x${calculatedMaxY} modules (${calculatedMaxX*calculatedMaxY} total)`);
              } else {
                // Non-Justify simple-grid: Use effective dimensions
                const availableWidth = effectivePolygonWidthForGrid; 
                const availableHeight = effectivePolygonHeightForGrid; 
                
                // For non-Justify, baseModuleWidthWithSpacing and baseModuleHeightWithSpacing 
                // use the standard (non-reduced) layoutParams.interRowSpacing and layoutParams.adjacentGap.
                let calculatedMaxY = Math.floor(availableHeight / baseModuleHeightWithSpacing);
                let calculatedMaxX = Math.floor(availableWidth / baseModuleWidthWithSpacing);

                // Determine threshold for adding extra rows/columns based on rotation angle
                // Use more aggressive thresholds for 90/270 degree rotations to maximize panel placement
                let extraRowThreshold = 0.60; // Default 60% threshold
                let extraColThreshold = 0.60; // Default 60% threshold

                // For 90 and 270 degree rotations specifically, be more aggressive
                if ((globalAngle >= 85 && globalAngle <= 95) || (globalAngle >= 265 && globalAngle <= 275)) {
                    // For exact 90/270 rotations, lower the threshold to 50% to be more aggressive
                    extraRowThreshold = 0.50;
                    extraColThreshold = 0.50;
                    console.log(`90/270° rotation optimization: Using more aggressive thresholds for row/column addition (${extraRowThreshold.toFixed(2)})`);
                }

                // Check for an extra row in non-Justify simple-grid
                const remainingVerticalSpaceNonJustify = availableHeight - (calculatedMaxY * baseModuleHeightWithSpacing);
                if (remainingVerticalSpaceNonJustify > (baseModuleHeightWithSpacing * extraRowThreshold)) {
                  console.log(`${activeAlignment} (simple-grid): Adding an extra row. Remaining: ${remainingVerticalSpaceNonJustify.toFixed(2)}m, ModuleH: ${baseModuleHeightWithSpacing.toFixed(2)}m`);
                  calculatedMaxY += 1;
                }

                // Check for an extra column in non-Justify simple-grid
                const remainingHorizontalSpaceNonJustify = availableWidth - (calculatedMaxX * baseModuleWidthWithSpacing);
                if (remainingHorizontalSpaceNonJustify > (baseModuleWidthWithSpacing * extraColThreshold)) {
                  console.log(`${activeAlignment} (simple-grid): Adding an extra column. Remaining: ${remainingHorizontalSpaceNonJustify.toFixed(2)}m, ModuleW: ${baseModuleWidthWithSpacing.toFixed(2)}m`);
                  calculatedMaxX += 1;
                }

                // For 90/270 rotations, make a second pass to check if we can fit more modules
                // with a slight reduction in spacing (for ballasted systems)
                if ((globalAngle >= 85 && globalAngle <= 95) || (globalAngle >= 265 && globalAngle <= 275)) {
                    // If we're still not filling the space efficiently, try again with minor spacing adjustments
                    const newRemainingVerticalSpace = availableHeight - (calculatedMaxY * baseModuleHeightWithSpacing);
                    const newRemainingHorizontalSpace = availableWidth - (calculatedMaxX * baseModuleWidthWithSpacing);
                    
                    // If we have over 40% of space left in both dimensions, consider more aggressive spacing
                    if (newRemainingVerticalSpace > availableHeight * 0.40 || 
                        newRemainingHorizontalSpace > availableWidth * 0.40) {
                        
                        // Add an additional module if we have at least 40% of the module size available
                        if (newRemainingVerticalSpace > baseModuleHeightWithSpacing * 0.40) {
                            calculatedMaxY += 1;
                            console.log(`90/270° special case: Adding extra row with aggressive spacing. Now ${calculatedMaxY} rows`);
                        }
                        
                        if (newRemainingHorizontalSpace > baseModuleWidthWithSpacing * 0.40) {
                            calculatedMaxX += 1;
                            console.log(`90/270° special case: Adding extra column with aggressive spacing. Now ${calculatedMaxX} columns`);
                        }
                    }
                }

                moduleLayout = {
                  maxX: calculatedMaxX,
                  maxY: calculatedMaxY,
                  moduleWidthWithSpacing: baseModuleWidthWithSpacing, 
                  moduleHeightWithSpacing: baseModuleHeightWithSpacing
                };
              }
              break;
            }
          }
        }
        
        const maxModulesInPolygon = moduleLayout.maxX * moduleLayout.maxY;
        modulesToPlace = Math.min(maxModulesInPolygon, remainingModules);
        remainingModules -= modulesToPlace;
        
        const latOffsetPerModule = moduleLayout.moduleHeightWithSpacing * 0.0000089;
        const lngOffsetPerModule = moduleLayout.moduleWidthWithSpacing * 0.0000089 / Math.cos(center.lat() * Math.PI / 180);

        console.log(`Module placement in polygon ${polygonIndex}:`, {
          eastWestDistance: eastWestDistance.toFixed(2) + 'm',
          northSouthDistance: northSouthDistance.toFixed(2) + 'm',
          moduleWidth: moduleLayout.moduleWidthWithSpacing.toFixed(2) + 'm',
          moduleHeight: moduleLayout.moduleHeightWithSpacing.toFixed(2) + 'm',
          maxModulesX: moduleLayout.maxX,
          maxY: moduleLayout.maxY
        });

        if (placementStrategy === 'carport-grid' && layoutParams.carportConfig) {
          const { rows, modulesPerRow, forceRectangle } = layoutParams.carportConfig;
          
          if (forceRectangle) {
            // Calculate the total dimensions of the single carport block
            const carportBlockWidthMeters = moduleLayout.moduleWidthWithSpacing * modulesPerRow;
            const carportBlockHeightMeters = moduleLayout.moduleHeightWithSpacing * rows;

            let carportBlockMarginXDegrees: number;
            let carportBlockMarginYDegrees: number;

            const smallOffsetMeters = 0.1; // Small offset (e.g., 0.1m) for edge alignments
            const smallOffsetXDegrees = smallOffsetMeters * 0.0000089 / Math.cos(center.lat() * Math.PI / 180);
            const smallOffsetYDegrees = smallOffsetMeters * 0.0000089;

            switch (activeAlignment) {
              case TableLayoutAlignment.Left:
                carportBlockMarginXDegrees = smallOffsetXDegrees; 
                carportBlockMarginYDegrees = (northSouthDistance - carportBlockHeightMeters) / 2 * 0.0000089; // Center vertically by default
                break;
              case TableLayoutAlignment.Right:
                // For Right, calculateOptimalStartPoint expects margin from the left, so we give it the full remaining width minus a small offset
                carportBlockMarginXDegrees = (eastWestDistance - carportBlockWidthMeters - smallOffsetMeters) * 0.0000089 / Math.cos(center.lat() * Math.PI / 180);
                carportBlockMarginYDegrees = (northSouthDistance - carportBlockHeightMeters) / 2 * 0.0000089; // Center vertically
                break;
              case TableLayoutAlignment.Justify:
                carportBlockMarginXDegrees = smallOffsetXDegrees; // Minimal X margin for Justify
                carportBlockMarginYDegrees = smallOffsetYDegrees; // Minimal Y margin for Justify
                break;
              case TableLayoutAlignment.Center:
              default:
                // Default Center alignment for the carport block
                carportBlockMarginXDegrees = (eastWestDistance - carportBlockWidthMeters) / 2 * 0.0000089 / Math.cos(center.lat() * Math.PI / 180);
                carportBlockMarginYDegrees = (northSouthDistance - carportBlockHeightMeters) / 2 * 0.0000089;
                break;
            }
            
            console.log(`Carport (forceRectangle) Alignment: ${activeAlignment}, MarginX: ${carportBlockMarginXDegrees.toFixed(8)}, MarginY: ${carportBlockMarginYDegrees.toFixed(8)}`);

            // Use calculateOptimalStartPoint to get the starting position for the carport block
            const { startLat: carportAlignedStartLat, startLng: carportAlignedStartLng } = calculateOptimalStartPoint(
              bounds,
              activeAlignment, // Pass the current alignment
              carportBlockMarginYDegrees,
              carportBlockMarginXDegrees
            );

            // For forced rectangle carport, use default top-left start, as alignment might be complex
            const carportRows = Math.min(rows, moduleLayout.maxY);
            const modulesPerCarportRow = Math.min(modulesPerRow, moduleLayout.maxX);
            
            for (let row = 0; row < carportRows && placedInThisPolygon < modulesToPlace; row++) {
              for (let col = 0; col < modulesPerCarportRow && placedInThisPolygon < modulesToPlace; col++) {
                const moduleTopEdgeLat = carportAlignedStartLat - (row * latOffsetPerModule); 
                const moduleLeftEdgeLng = carportAlignedStartLng + (col * lngOffsetPerModule);

                // Calculate center of the module from its top-left corner
                const moduleLat = moduleTopEdgeLat - halfModuleHeight_deg_for_center_calc;
                const moduleLng = moduleLeftEdgeLng + halfModuleWidth_deg_for_center_calc;
                
                const moduleCenter = new google.maps.LatLng(moduleLat, moduleLng);
                const halfModuleHeight = (finalModuleHeight / 2) * 0.0000089;
                const halfModuleWidth = (finalModuleWidth / 2) * 0.0000089 / Math.cos(moduleLat * Math.PI / 180);
                const insetFactor = 0.98;
                const adjustedHalfHeight = halfModuleHeight * insetFactor;
                const adjustedHalfWidth = halfModuleWidth * insetFactor;
                const moduleCorners = [
                  new google.maps.LatLng(moduleLat + adjustedHalfHeight, moduleLng - adjustedHalfWidth),
                  new google.maps.LatLng(moduleLat + adjustedHalfHeight, moduleLng + adjustedHalfWidth),
                  new google.maps.LatLng(moduleLat - adjustedHalfHeight, moduleLng + adjustedHalfWidth),
                  new google.maps.LatLng(moduleLat - adjustedHalfHeight, moduleLng - adjustedHalfWidth)
                ];
                const centerInside = google.maps.geometry.poly.containsLocation(moduleCenter, polygon.polygon);
                const cornerCount = moduleCorners.filter(corner => 
                  google.maps.geometry.poly.containsLocation(corner, polygon.polygon)
                ).length;
                
                // Determine if we can place this module
                let canPlace = false;
                
                if (activeAlignment === TableLayoutAlignment.Justify) {
                  // For Justify mode, use strict containment - all 4 corners must be inside
                  canPlace = (cornerCount === 4);
                } else if (activeAlignment === TableLayoutAlignment.Right || activeAlignment === TableLayoutAlignment.Left) {
                  // For Left/Right alignments, center and at least 2 corners
                  canPlace = (centerInside && cornerCount >= 2);
                } else {
                  // For other alignments, center and at least 3 corners
                  canPlace = (centerInside && cornerCount >= 3);
                }
                
                if (canPlace) {
                  const moduleBounds = {
                    north: moduleLat + halfModuleHeight, south: moduleLat - halfModuleHeight,
                    east: moduleLng + halfModuleWidth, west: moduleLng - halfModuleWidth
                  };
                  const moduleRect = new google.maps.Rectangle({
                    bounds: moduleBounds, map: map, ...MODULE_STYLE
                  });
                  newModuleRectangles.push(moduleRect);
                  placedInThisPolygon++;
                }
              }
            }
          } else { // Carport grid, not forceRectangle - use aligned start
            for (let y = 0; y < moduleLayout.maxY && placedInThisPolygon < modulesToPlace; y++) {
              for (let x = 0; x < moduleLayout.maxX && placedInThisPolygon < modulesToPlace; x++) {
                const moduleLat = alignedStartLat - (y * latOffsetPerModule); // Using alignedStartLat
                const moduleLng = alignedStartLng + (x * lngOffsetPerModule); // Using alignedStartLng
                
                const moduleCenter = new google.maps.LatLng(moduleLat, moduleLng);
                const halfModuleHeight = (finalModuleHeight / 2) * 0.0000089;
                const halfModuleWidth = (finalModuleWidth / 2) * 0.0000089 / Math.cos(moduleLat * Math.PI / 180);
                const insetFactor = 0.98;
                const adjustedHalfHeight = halfModuleHeight * insetFactor;
                const adjustedHalfWidth = halfModuleWidth * insetFactor;
                const moduleCorners = [
                  new google.maps.LatLng(moduleLat + adjustedHalfHeight, moduleLng - adjustedHalfWidth),
                  new google.maps.LatLng(moduleLat + adjustedHalfHeight, moduleLng + adjustedHalfWidth),
                  new google.maps.LatLng(moduleLat - adjustedHalfHeight, moduleLng + adjustedHalfWidth),
                  new google.maps.LatLng(moduleLat - adjustedHalfHeight, moduleLng - adjustedHalfWidth)
                ];
                const centerInside = google.maps.geometry.poly.containsLocation(moduleCenter, polygon.polygon);
                const requiredCorners = activeAlignment === TableLayoutAlignment.Justify ? 1 : 3;
                const cornerCount = moduleCorners.filter(corner => 
                  google.maps.geometry.poly.containsLocation(corner, polygon.polygon)
                ).length;
                const useRelaxedCheck = activeAlignment === TableLayoutAlignment.Justify && centerInside && cornerCount < requiredCorners && cornerCount > 0;
                                    
                if ((centerInside && cornerCount >= requiredCorners) || useRelaxedCheck) {
                  const moduleBounds = {
                    north: moduleLat + halfModuleHeight, south: moduleLat - halfModuleHeight,
                    east: moduleLng + halfModuleWidth, west: moduleLng - halfModuleWidth
                  };
                  const moduleRect = new google.maps.Rectangle({
                    bounds: moduleBounds, map: map, ...MODULE_STYLE
                  });
                  newModuleRectangles.push(moduleRect);
                  placedInThisPolygon++;
                }
              }
            }
          }
        }
        else if (placementStrategy === 'table-grid' && layoutParams.tableConfig) {
          // --- ENHANCED PLACEMENT FOR GROUND MOUNT TABLES ---
          const { rowsPerTable, modulesPerRow } = layoutParams.tableConfig;
          let { interTableSpacingX, interTableSpacingY } = layoutParams.tableConfig;
          const actualModuleWidthForTableInternal = finalModuleWidth + (layoutParams.adjacentGap / 1000);
          const actualModuleHeightForTableInternal = finalModuleHeight + layoutParams.interRowSpacing;
          const tableWidth = actualModuleWidthForTableInternal * modulesPerRow;
          const tableHeight = actualModuleHeightForTableInternal * rowsPerTable;
          interTableSpacingX = interTableSpacingX || 0.5;
          interTableSpacingY = interTableSpacingY || 4.0;
          
          // Grid-based placement strategy for ground-mount tables (similar to ballasted approach)
          if (structureType.id === 'ground_mount_tables') {
            console.log(`🏗️ Using Grid-Based Ground Mount Table Placement...`);
            const azimuth = polygon.azimuth || 180;
            
            // Calculate table dimensions including spacing
            const tableSpacingX = tableWidth + interTableSpacingX;
            const tableSpacingY = tableHeight + interTableSpacingY;
            
            // Calculate polygon centroid (same as ballasted logic)
            const path = polygon.polygon.getPath();
            let centerLat = 0;
            let centerLng = 0;
            const vertexCount = path.getLength();
            
            for (let i = 0; i < vertexCount; i++) {
              const vertex = path.getAt(i)!;
              centerLat += vertex.lat();
              centerLng += vertex.lng();
            }
            
            centerLat /= vertexCount;
            centerLng /= vertexCount;
            const centroid = new google.maps.LatLng(centerLat, centerLng);
            
            // Determine grid starting point based on alignment (same logic as ballasted)
            let gridOrigin: google.maps.LatLng;
            
            if (activeAlignment === TableLayoutAlignment.Left) {
              const leftDirection = normalizeAngle(azimuth + 270);
              gridOrigin = centroid;
              const maxSearchDistance = google.maps.geometry.spherical.computeDistanceBetween(sw, ne) * 0.4;
              
              for (let distance = 10; distance <= maxSearchDistance; distance += 10) {
                const testPoint = google.maps.geometry.spherical.computeOffset(centroid, distance, leftDirection);
                if (google.maps.geometry.poly.containsLocation(testPoint, polygon.polygon)) {
                  gridOrigin = testPoint;
                } else {
                  break;
                }
              }
            } else if (activeAlignment === TableLayoutAlignment.Right) {
              const rightDirection = normalizeAngle(azimuth + 90);
              gridOrigin = centroid;
              const maxSearchDistance = google.maps.geometry.spherical.computeDistanceBetween(sw, ne) * 0.4;
              
              for (let distance = 10; distance <= maxSearchDistance; distance += 10) {
                const testPoint = google.maps.geometry.spherical.computeOffset(centroid, distance, rightDirection);
                if (google.maps.geometry.poly.containsLocation(testPoint, polygon.polygon)) {
                  gridOrigin = testPoint;
                } else {
                  break;
                }
              }
            } else if (activeAlignment === TableLayoutAlignment.Center) {
              // Start from edge opposite to azimuth (same as ballasted logic)
              const oppositeDirection = normalizeAngle(azimuth + 180);
              gridOrigin = centroid;
              const maxSearchDistance = google.maps.geometry.spherical.computeDistanceBetween(sw, ne) * 0.4;
              
              for (let distance = 10; distance <= maxSearchDistance; distance += 10) {
                const testPoint = google.maps.geometry.spherical.computeOffset(centroid, distance, oppositeDirection);
                if (google.maps.geometry.poly.containsLocation(testPoint, polygon.polygon)) {
                  gridOrigin = testPoint;
                } else {
                  break;
                }
              }
            } else {
              gridOrigin = centroid; // Default for non-optimum and justify mode
            }
            
            // Calculate grid dimensions first (needed for all alignment types)
            const polygonWidth = google.maps.geometry.spherical.computeDistanceBetween(sw, ne);
            const maxRows = Math.ceil(polygonWidth / tableSpacingY) + 3; // Buffer for table dimensions
            const maxCols = Math.ceil(polygonWidth / tableSpacingX) + 3; // Buffer for table dimensions
            
            // Define grid directions based on azimuth
            const rowHeading = azimuth; // Along azimuth direction (Y)
            const colHeading = normalizeAngle(azimuth + 90); // Perpendicular to azimuth (X)
            
                         // Helper function to calculate optimal starting point for a given alignment
             // Following user's suggestion: start from edge opposite to selected azimuth
             function calculateStartPoint(alignment: TableLayoutAlignment): google.maps.LatLng {
               let startPoint = centroid;
               
               // Base principle: Start from edge opposite to azimuth for all alignments
               // This follows the user's suggestion of starting placement logic from the edge
               // opposite to the selected azimuth direction
               
               if (alignment === TableLayoutAlignment.Left) {
                 // For left alignment: Move towards left direction (perpendicular to azimuth - 90°)
                 // But also consider the opposite edge for maximum coverage
                 const leftDirection = normalizeAngle(azimuth + 270);
                 const oppositeDirection = normalizeAngle(azimuth + 180);
                 const maxSearchDistance = google.maps.geometry.spherical.computeDistanceBetween(sw, ne) * 0.5;
                 
                 // First try to move towards opposite edge (primary strategy)
                 for (let distance = 10; distance <= maxSearchDistance; distance += 15) {
                   const testPoint = google.maps.geometry.spherical.computeOffset(centroid, distance, oppositeDirection);
                   if (google.maps.geometry.poly.containsLocation(testPoint, polygon.polygon)) {
                     startPoint = testPoint;
                   } else {
                     break;
                   }
                 }
                 
                 // Then adjust towards left from that point
                 for (let distance = 10; distance <= maxSearchDistance * 0.3; distance += 10) {
                   const testPoint = google.maps.geometry.spherical.computeOffset(startPoint, distance, leftDirection);
                   if (google.maps.geometry.poly.containsLocation(testPoint, polygon.polygon)) {
                     startPoint = testPoint;
                   } else {
                     break;
                   }
                 }
               } else if (alignment === TableLayoutAlignment.Right) {
                 // For right alignment: Move towards right direction (perpendicular to azimuth + 90°)
                 // But also consider the opposite edge for maximum coverage
                 const rightDirection = normalizeAngle(azimuth + 90);
                 const oppositeDirection = normalizeAngle(azimuth + 180);
                 const maxSearchDistance = google.maps.geometry.spherical.computeDistanceBetween(sw, ne) * 0.5;
                 
                 // First try to move towards opposite edge (primary strategy)
                 for (let distance = 10; distance <= maxSearchDistance; distance += 15) {
                   const testPoint = google.maps.geometry.spherical.computeOffset(centroid, distance, oppositeDirection);
                   if (google.maps.geometry.poly.containsLocation(testPoint, polygon.polygon)) {
                     startPoint = testPoint;
                   } else {
                     break;
                   }
                 }
                 
                 // Then adjust towards right from that point
                 for (let distance = 10; distance <= maxSearchDistance * 0.3; distance += 10) {
                   const testPoint = google.maps.geometry.spherical.computeOffset(startPoint, distance, rightDirection);
                   if (google.maps.geometry.poly.containsLocation(testPoint, polygon.polygon)) {
                     startPoint = testPoint;
                   } else {
                     break;
                   }
                 }
               } else if (alignment === TableLayoutAlignment.Center) {
                 // For center alignment: Move directly towards the edge opposite to azimuth
                 // This is the core implementation of user's suggestion
                 const oppositeDirection = normalizeAngle(azimuth + 180);
                 const maxSearchDistance = google.maps.geometry.spherical.computeDistanceBetween(sw, ne) * 0.6;
                 
                 console.log(`🎯 Center alignment: Moving towards edge opposite to azimuth (${oppositeDirection}°)`);
                 
                 for (let distance = 10; distance <= maxSearchDistance; distance += 15) {
                   const testPoint = google.maps.geometry.spherical.computeOffset(centroid, distance, oppositeDirection);
                   if (google.maps.geometry.poly.containsLocation(testPoint, polygon.polygon)) {
                     startPoint = testPoint;
                     console.log(`✓ Found valid start point at distance ${distance}m: ${startPoint.toUrlValue()}`);
                   } else {
                     console.log(`✗ Point at distance ${distance}m is outside polygon, stopping search`);
                     break;
                   }
                 }
               } else if (alignment === TableLayoutAlignment.Justify) {
                 // For justify alignment: Also start from opposite edge but use a more central approach
                 const oppositeDirection = normalizeAngle(azimuth + 180);
                 const maxSearchDistance = google.maps.geometry.spherical.computeDistanceBetween(sw, ne) * 0.4;
                 
                 for (let distance = 10; distance <= maxSearchDistance; distance += 20) {
                   const testPoint = google.maps.geometry.spherical.computeOffset(centroid, distance, oppositeDirection);
                   if (google.maps.geometry.poly.containsLocation(testPoint, polygon.polygon)) {
                     startPoint = testPoint;
                   } else {
                     break;
                   }
                 }
               }
               
               // Ensure start point is inside polygon
               if (!google.maps.geometry.poly.containsLocation(startPoint, polygon.polygon)) {
                 console.warn('⚠️ Calculated start point is outside polygon, using fallback');
                 const boundsCenter = bounds.getCenter();
                 startPoint = google.maps.geometry.poly.containsLocation(boundsCenter, polygon.polygon) ? boundsCenter : centroid;
               }
               
               console.log(`📍 Final start point for ${alignment}: ${startPoint.toUrlValue()}`);
               return startPoint;
             }
            
            // Helper function to test table placement count for a specific alignment
            function testTablePlacement(testAlignment: TableLayoutAlignment, testStartPoint: google.maps.LatLng): number {
              let testCount = 0;
              const testPlacedPositions: Set<string> = new Set();
              
              // Calculate polygon diameter for test bounds
              const testPolygonDiameter = google.maps.geometry.spherical.computeDistanceBetween(sw, ne);
              
              // Helper function to check if table can be placed at grid position for testing (RELAXED)
              function canPlaceTableAtTestGrid(rowIndex: number, colIndex: number, usedPositions: Set<string>): boolean {
                const positionKey = `${rowIndex},${colIndex}`;
                if (usedPositions.has(positionKey)) {
                  return false;
                }
                
                // Calculate table center using grid coordinates
                let tableCenter = testStartPoint;
                
                // Apply row offset (Y direction - along azimuth)
                if (rowIndex !== 0) {
                  tableCenter = google.maps.geometry.spherical.computeOffset(
                    tableCenter,
                    Math.abs(rowIndex) * tableSpacingY,
                    rowIndex > 0 ? rowHeading : normalizeAngle(rowHeading + 180)
                  );
                }
                
                // Apply column offset (X direction - perpendicular to azimuth)
                if (colIndex !== 0) {
                  tableCenter = google.maps.geometry.spherical.computeOffset(
                    tableCenter,
                    Math.abs(colIndex) * tableSpacingX,
                    colIndex > 0 ? colHeading : normalizeAngle(colHeading + 180)
                  );
                }
                
                // RELAXED: Only require table center to be inside polygon
                if (!google.maps.geometry.poly.containsLocation(tableCenter, polygon.polygon)) {
                  return false;
                }
                
                // RELAXED: Check corner containment (allow 75% containment)
                const tableCorners = calculateModuleCorners(tableCenter, tableWidth, tableHeight, azimuth);
                const cornersInside = [
                  google.maps.geometry.poly.containsLocation(tableCorners.moduleNE, polygon.polygon),
                  google.maps.geometry.poly.containsLocation(tableCorners.moduleSE, polygon.polygon),
                  google.maps.geometry.poly.containsLocation(tableCorners.moduleSW, polygon.polygon),
                  google.maps.geometry.poly.containsLocation(tableCorners.moduleNW, polygon.polygon)
                ];
                
                const cornersInsideCount = cornersInside.filter(Boolean).length;
                return cornersInsideCount >= 3; // Allow table if at least 3 corners are inside
              }
              
              // Use the same systematic row-by-row approach as main placement algorithm
              const testMaxRowsSearch = Math.ceil(testPolygonDiameter / tableSpacingY) + 5;
              const testMaxColsSearch = Math.ceil(testPolygonDiameter / tableSpacingX) + 5;
              
              // 1. Test origin table
              if (canPlaceTableAtTestGrid(0, 0, testPlacedPositions)) {
                testCount++;
                testPlacedPositions.add('0,0');
              }
              
              // 2. Test central row completely in both directions
              for (let col = 1; col <= testMaxColsSearch; col++) {
                let placedInThisColumn = 0;
                if (canPlaceTableAtTestGrid(0, col, testPlacedPositions)) {
                  testCount++;
                  testPlacedPositions.add(`0,${col}`);
                  placedInThisColumn++;
                }
                if (canPlaceTableAtTestGrid(0, -col, testPlacedPositions)) {
                  testCount++;
                  testPlacedPositions.add(`0,${-col}`);
                  placedInThisColumn++;
                }
                
                // If no tables placed in this column pair, stop expanding horizontally
                if (placedInThisColumn === 0) {
                  break;
                }
              }
              
              // 3. Test rows systematically
              for (let rowOffset = 1; rowOffset <= testMaxRowsSearch; rowOffset++) {
                let tablesPlacedInRowPair = 0;
                
                // Test negative row (towards edge opposite to azimuth)
                for (let col = -testMaxColsSearch; col <= testMaxColsSearch; col++) {
                  if (canPlaceTableAtTestGrid(-rowOffset, col, testPlacedPositions)) {
                    testCount++;
                    testPlacedPositions.add(`${-rowOffset},${col}`);
                    tablesPlacedInRowPair++;
                  }
                }
                
                // Test positive row (towards azimuth direction)
                for (let col = -testMaxColsSearch; col <= testMaxColsSearch; col++) {
                  if (canPlaceTableAtTestGrid(rowOffset, col, testPlacedPositions)) {
                    testCount++;
                    testPlacedPositions.add(`${rowOffset},${col}`);
                    tablesPlacedInRowPair++;
                  }
                }
                
                // If no tables were placed in either row of this pair, stop expanding
                if (tablesPlacedInRowPair === 0) {
                  break;
                }
              }
              
              // 4. Final gap-filling sweep for test
              for (let distance = 1; distance <= Math.max(testMaxRowsSearch, testMaxColsSearch); distance++) {
                let gapsFilledAtDistance = 0;
                
                for (let row = -distance; row <= distance; row++) {
                  for (let col = -distance; col <= distance; col++) {
                    const positionKey = `${row},${col}`;
                    if (!testPlacedPositions.has(positionKey)) {
                      if (canPlaceTableAtTestGrid(row, col, testPlacedPositions)) {
                        testCount++;
                        testPlacedPositions.add(positionKey);
                        gapsFilledAtDistance++;
                      }
                    }
                  }
                }
                
                if (gapsFilledAtDistance === 0 && distance > 3) {
                  break;
                }
              }
              
              return testCount;
            }
            
            // Handle optimum alignment with SYSTEMATIC ORIGIN TESTING
            if (activeAlignment === TableLayoutAlignment.Optimum) {
              console.log('🔄 Optimum alignment selected - testing all strategies with multiple origins...');
              
              const strategies = [
                TableLayoutAlignment.Left,
                TableLayoutAlignment.Center, 
                TableLayoutAlignment.Right,
                TableLayoutAlignment.Justify
              ];
              
              let bestTableCount = 0;
              let bestAlignment = TableLayoutAlignment.Center;
              let bestStartPoint = centroid;
              
              // For each strategy, test multiple candidate origins systematically
              for (const testAlignment of strategies) {
                console.log(`Testing ${testAlignment} alignment with multiple origins...`);
                
                // Generate multiple candidate origins for this alignment
                const candidateOrigins: google.maps.LatLng[] = [];
                
                // Base origin from alignment strategy
                candidateOrigins.push(calculateStartPoint(testAlignment));
                
                // Add systematic candidates across polygon for this alignment
                const searchStep = Math.min(tableSpacingX, tableSpacingY) * 0.3; // Aggressive step size
                const maxSearchDistance = google.maps.geometry.spherical.computeDistanceBetween(sw, ne) * 0.8; // Wider search
                
                // Generate candidates in radial pattern
                for (let distance = searchStep; distance <= maxSearchDistance; distance += searchStep) {
                  for (let bearing = 0; bearing < 360; bearing += 45) { // Every 45 degrees for speed
                    const candidatePoint = google.maps.geometry.spherical.computeOffset(
                      centroid, distance, bearing
                    );
                    
                    if (google.maps.geometry.poly.containsLocation(candidatePoint, polygon.polygon)) {
                      candidateOrigins.push(candidatePoint);
                    }
                  }
                }
                
                let alignmentBestCount = 0;
                let alignmentBestOrigin = candidateOrigins[0];
                
                // Test each candidate origin for this alignment
                for (const candidateOrigin of candidateOrigins) {
                  const testTableCount = testTablePlacement(testAlignment, candidateOrigin);
                  
                  if (testTableCount > alignmentBestCount) {
                    alignmentBestCount = testTableCount;
                    alignmentBestOrigin = candidateOrigin;
                  }
                }
                
                console.log(`${testAlignment} alignment: ${alignmentBestCount} tables (tested ${candidateOrigins.length} origins)`);
                
                if (alignmentBestCount > bestTableCount) {
                  bestTableCount = alignmentBestCount;
                  bestAlignment = testAlignment;
                  bestStartPoint = alignmentBestOrigin;
                }
              }
              
              console.log(`🏆 Best strategy: ${bestAlignment} with ${bestTableCount} tables`);
              
              // Use the best grid origin
              gridOrigin = bestStartPoint;
            } else {
              // For non-optimum alignments, respect the alignment choice and only do minimal local optimization
              console.log(`🎯 Using alignment-specific start point for ${activeAlignment} alignment...`);
              
              const alignmentStartPoint = calculateStartPoint(activeAlignment);
              const candidateOrigins: google.maps.LatLng[] = [];
              candidateOrigins.push(alignmentStartPoint);
              
              // Add only a few local candidates near the alignment-specific start point
              // This preserves the user's alignment choice while allowing slight optimization
              const localSearchStep = Math.min(tableSpacingX, tableSpacingY) * 0.3;
              const maxLocalDistance = Math.min(tableSpacingX, tableSpacingY) * 1.5; // Much smaller search radius
              
              for (let distance = localSearchStep; distance <= maxLocalDistance; distance += localSearchStep) {
                for (let bearing = 0; bearing < 360; bearing += 45) { // Every 45 degrees around the alignment point
                  const candidatePoint = google.maps.geometry.spherical.computeOffset(
                    alignmentStartPoint, distance, bearing
                  );
                  
                  if (google.maps.geometry.poly.containsLocation(candidatePoint, polygon.polygon)) {
                    candidateOrigins.push(candidatePoint);
                  }
                }
              }
              
              let bestCount = 0;
              let bestOrigin = alignmentStartPoint; // Default to alignment-specific point
              
              for (const candidateOrigin of candidateOrigins) {
                const testCount = testTablePlacement(activeAlignment, candidateOrigin);
                if (testCount > bestCount) {
                  bestCount = testCount;
                  bestOrigin = candidateOrigin;
                }
              }
              
              console.log(`${activeAlignment} alignment: ${bestCount} tables (tested ${candidateOrigins.length} local origins around alignment point)`);
              gridOrigin = bestOrigin;
            }
            
            // Ensure grid origin is inside polygon
            if (!google.maps.geometry.poly.containsLocation(gridOrigin, polygon.polygon)) {
              const boundsCenter = bounds.getCenter();
              gridOrigin = google.maps.geometry.poly.containsLocation(boundsCenter, polygon.polygon) ? boundsCenter : centroid;
            }
            
            console.log(`Grid origin: ${gridOrigin.toUrlValue()}`);
            
            // Track placed tables to prevent overlaps
            const placedTablePositions: Set<string> = new Set();
            
            // Helper function to check if table can be placed at grid position (RELAXED BOUNDARY CHECKING)
            function canPlaceTableAtGrid(rowIndex: number, colIndex: number, usedPositions: Set<string>): boolean {
              const positionKey = `${rowIndex},${colIndex}`;
              if (usedPositions.has(positionKey)) {
                return false;
              }
              
              // Calculate table center using grid coordinates
              let tableCenter = gridOrigin;
              
              // Apply row offset (Y direction - along azimuth)
              if (rowIndex !== 0) {
                tableCenter = google.maps.geometry.spherical.computeOffset(
                  tableCenter,
                  Math.abs(rowIndex) * tableSpacingY,
                  rowIndex > 0 ? rowHeading : normalizeAngle(rowHeading + 180)
                );
              }
              
              // Apply column offset (X direction - perpendicular to azimuth)
              if (colIndex !== 0) {
                tableCenter = google.maps.geometry.spherical.computeOffset(
                  tableCenter,
                  Math.abs(colIndex) * tableSpacingX,
                  colIndex > 0 ? colHeading : normalizeAngle(colHeading + 180)
                );
              }
              
              // RELAXED BOUNDARY CHECKING: Only require table center to be inside polygon
              // This is less conservative and allows more table placement opportunities
              if (!google.maps.geometry.poly.containsLocation(tableCenter, polygon.polygon)) {
                return false;
              }
              
              // OPTIONAL: Additional check for corner containment (less strict)
              // Only require at least 75% of corners to be inside for better utilization
              const tableCorners = calculateModuleCorners(tableCenter, tableWidth, tableHeight, azimuth);
              const cornersInside = [
                google.maps.geometry.poly.containsLocation(tableCorners.moduleNE, polygon.polygon),
                google.maps.geometry.poly.containsLocation(tableCorners.moduleSE, polygon.polygon),
                google.maps.geometry.poly.containsLocation(tableCorners.moduleSW, polygon.polygon),
                google.maps.geometry.poly.containsLocation(tableCorners.moduleNW, polygon.polygon)
              ];
              
              const cornersInsideCount = cornersInside.filter(Boolean).length;
              
              // RELAXED: Allow table if at least 3 out of 4 corners are inside (75% containment)
              // This is much more aggressive than requiring all corners
              return cornersInsideCount >= 3;
            }
            
            // Function to place a table at specific grid position and create visuals
            const placeTableAt = (rowIndex: number, colIndex: number): boolean => {
              const positionKey = `${rowIndex},${colIndex}`;
              if (placedTablePositions.has(positionKey)) {
                return false; // Already placed
              }
              
              // Calculate table center using grid coordinates (same as canPlaceTableAtGrid)
              let tableCenter = gridOrigin;
              
              // Apply row offset (Y direction - along azimuth)
              if (rowIndex !== 0) {
                tableCenter = google.maps.geometry.spherical.computeOffset(
                  tableCenter,
                  Math.abs(rowIndex) * tableSpacingY,
                  rowIndex > 0 ? rowHeading : normalizeAngle(rowHeading + 180)
                );
              }
              
              // Apply column offset (X direction - perpendicular to azimuth)
              if (colIndex !== 0) {
                tableCenter = google.maps.geometry.spherical.computeOffset(
                  tableCenter,
                  Math.abs(colIndex) * tableSpacingX,
                  colIndex > 0 ? colHeading : normalizeAngle(colHeading + 180)
                );
              }
              
              // Check if table can be placed here
              if (!canPlaceTableAtGrid(rowIndex, colIndex, placedTablePositions)) {
                return false;
              }
              
              // Place modules on this table
              const tableXHeading = normalizeAngle(azimuth + 90);
              const tableYHeading = azimuth;
              
              for (let row = 0; row < rowsPerTable && placedInThisPolygon < modulesToPlace; row++) {
                for (let col = 0; col < modulesPerRow && placedInThisPolygon < modulesToPlace; col++) {
                  const localX = (col - (modulesPerRow - 1) / 2) * actualModuleWidthForTableInternal;
                  const localY = (row - (rowsPerTable - 1) / 2) * actualModuleHeightForTableInternal;
                  
                  let moduleCenter = tableCenter;
                  
                  if (Math.abs(localX) > 0.001) {
                    moduleCenter = google.maps.geometry.spherical.computeOffset(
                      moduleCenter,
                      Math.abs(localX),
                      localX > 0 ? tableXHeading : normalizeAngle(tableXHeading + 180)
                    );
                  }
                  
                  if (Math.abs(localY) > 0.001) {
                    moduleCenter = google.maps.geometry.spherical.computeOffset(
                      moduleCenter,
                      Math.abs(localY),
                      localY > 0 ? tableYHeading : normalizeAngle(tableYHeading + 180)
                    );
                  }
                  
                  // Create module visual (same as ballasted logic)
                  if (Math.abs(azimuth % 90) > 1 || layoutParams.orientation === 'portrait') {
                    // Create module as polygon for non-standard angles or portrait
                    const polygonPath = createModulePolygonPath(
                      moduleCenter, 
                      finalModuleWidth, 
                      finalModuleHeight, 
                      azimuth
                    );
                    
                    const modulePolygon = new google.maps.Polygon({
                      paths: polygonPath,
                      strokeColor: MODULE_STYLE.strokeColor,
                      strokeOpacity: MODULE_STYLE.strokeOpacity,
                      strokeWeight: MODULE_STYLE.strokeWeight,
                      fillColor: MODULE_STYLE.fillColor,
                      fillOpacity: MODULE_STYLE.fillOpacity,
                      clickable: false,
                      draggable: false,
                      editable: false,
                      zIndex: MODULE_STYLE.zIndex,
                      map: map,
                    });
                    
                    newModuleRectangles.push(modulePolygon);
                  } else {
                    // Create module as rectangle for standard angles
                    const corners = calculateModuleCorners(moduleCenter, finalModuleWidth, finalModuleHeight, azimuth);
                    const boundsLiteral = new google.maps.LatLngBounds();
                    boundsLiteral.extend(corners.moduleNE);
                    boundsLiteral.extend(corners.moduleSE);
                    boundsLiteral.extend(corners.moduleSW);
                    boundsLiteral.extend(corners.moduleNW);
                    
                    const rectangle = new google.maps.Rectangle({
                      strokeColor: MODULE_STYLE.strokeColor,
                      strokeOpacity: MODULE_STYLE.strokeOpacity,
                      strokeWeight: MODULE_STYLE.strokeWeight,
                      fillColor: MODULE_STYLE.fillColor,
                      fillOpacity: MODULE_STYLE.fillOpacity,
                      clickable: false,
                      draggable: false,
                      editable: false,
                      zIndex: MODULE_STYLE.zIndex,
                      bounds: boundsLiteral,
                      map: map,
                    });
                    
                    newModuleRectangles.push(rectangle);
                  }
                  
                  placedInThisPolygon++;
                }
              }
              
              placedTablePositions.add(positionKey);
              return true;
            };
            
            // SYSTEMATIC ROW-BY-ROW TABLE PLACEMENT
            // Following user's approach: Start from edge opposite to azimuth and place systematically
            console.log('🚀 Starting systematic row-by-row table placement...');
            
            // AGGRESSIVE SEARCH BOUNDS for Maximum Utilization
            const polygonDiameter = google.maps.geometry.spherical.computeDistanceBetween(sw, ne);
            const maxRowsSearch = Math.ceil(polygonDiameter / tableSpacingY) + 10; // More aggressive buffer
            const maxColsSearch = Math.ceil(polygonDiameter / tableSpacingX) + 10; // More aggressive buffer
            
            console.log(`Aggressive search bounds: ${maxRowsSearch} rows × ${maxColsSearch} cols`);
            
            let totalTablesPlaced = 0;
            
            // NEW SYSTEMATIC PLACEMENT APPROACH
            // Place tables row by row, starting from edge opposite to azimuth
            // This ensures maximum area utilization
            
            // 1. Start with the central row (row 0) and place the origin table
            if (placeTableAt(0, 0)) {
              totalTablesPlaced++;
              console.log('✓ Origin table placed at (0,0)');
            }
            
            // 2. Fill the central row completely in both directions
            let centralRowFilled = 1; // Count origin table
            for (let col = 1; col <= maxColsSearch; col++) {
              if (placedInThisPolygon >= modulesToPlace) break;
              
              let placedInThisColumn = 0;
              if (placeTableAt(0, col)) {
                placedInThisColumn++;
                centralRowFilled++;
              }
              if (placeTableAt(0, -col)) {
                placedInThisColumn++;
                centralRowFilled++;
              }
              
              // If no tables placed in this column pair, stop expanding horizontally
              if (placedInThisColumn === 0) {
                console.log(`Central row: Stopped at column ±${col}, ${centralRowFilled} tables placed`);
                break;
              }
            }
            
            totalTablesPlaced = centralRowFilled;
            
            // 3. Fill rows systematically - first towards edge opposite to azimuth (negative rows)
            // Then towards azimuth direction (positive rows)
            console.log('🔄 Filling rows systematically...');
            
            for (let rowOffset = 1; rowOffset <= maxRowsSearch; rowOffset++) {
              if (placedInThisPolygon >= modulesToPlace) break;
              
              let tablesPlacedInRowPair = 0;
              
              // Fill the negative row (towards edge opposite to azimuth)
              let negativeRowFilled = 0;
              for (let col = -maxColsSearch; col <= maxColsSearch; col++) {
                if (placedInThisPolygon >= modulesToPlace) break;
                
                if (placeTableAt(-rowOffset, col)) {
                  negativeRowFilled++;
                  tablesPlacedInRowPair++;
                }
              }
              
              // Fill the positive row (towards azimuth direction)  
              let positiveRowFilled = 0;
              for (let col = -maxColsSearch; col <= maxColsSearch; col++) {
                if (placedInThisPolygon >= modulesToPlace) break;
                
                if (placeTableAt(rowOffset, col)) {
                  positiveRowFilled++;
                  tablesPlacedInRowPair++;
                }
              }
              
              console.log(`Row pair ±${rowOffset}: ${negativeRowFilled} + ${positiveRowFilled} = ${tablesPlacedInRowPair} tables placed`);
              
              totalTablesPlaced += tablesPlacedInRowPair;
              
              // If no tables were placed in either row of this pair, stop expanding
              if (tablesPlacedInRowPair === 0) {
                console.log(`No more space found beyond row ±${rowOffset}`);
                break;
              }
            }
            
            // 4. AGGRESSIVE gap-filling sweep - multiple passes to catch all opportunities
            console.log('🔍 Performing aggressive multi-pass gap-filling sweep...');
            let gapsFilled = 0;
            
            // Multiple aggressive passes to ensure no space is wasted
            for (let pass = 1; pass <= 3; pass++) {
              console.log(`Gap-filling pass ${pass}...`);
              let gapsFilledThisPass = 0;
              
              // Comprehensive grid sweep - check every possible position
              for (let row = -maxRowsSearch; row <= maxRowsSearch; row++) {
                for (let col = -maxColsSearch; col <= maxColsSearch; col++) {
                  if (placedInThisPolygon >= modulesToPlace) break;
                  
                  const positionKey = `${row},${col}`;
                  if (!placedTablePositions.has(positionKey)) {
                    if (placeTableAt(row, col)) {
                      gapsFilledThisPass++;
                      gapsFilled++;
                    }
                  }
                }
                if (placedInThisPolygon >= modulesToPlace) break;
              }
              
              console.log(`Pass ${pass}: Found ${gapsFilledThisPass} additional tables`);
              
              // If no new tables found in this pass, no point in continuing
              if (gapsFilledThisPass === 0) {
                console.log(`No new opportunities found in pass ${pass}, stopping gap-filling`);
                break;
              }
            }
            
            if (gapsFilled > 0) {
              console.log(`Gap-filling found ${gapsFilled} additional placement opportunities`);
              totalTablesPlaced += gapsFilled;
            }
            
            const tablesPlaced = placedTablePositions.size;
            console.log(`🏗️ Systematic placement completed: ${placedInThisPolygon} modules in ${tablesPlaced} tables`);

          } else {
            // --- STANDARD SPHERICAL GEOMETRY TABLE PLACEMENT (for fixed_tilt and others) ---
          
          // Apply more aggressive table spacing reduction for Justify mode
          if (activeAlignment === TableLayoutAlignment.Justify) {
            interTableSpacingX = Math.max(0.1, (layoutParams.tableConfig.interTableSpacingX || 0.5) * 0.3);
            interTableSpacingY = Math.max(0.2, (layoutParams.tableConfig.interTableSpacingY || 4.0) * 0.5);
            console.log(`Justify mode: Using aggressive table spacing: X=${interTableSpacingX.toFixed(2)}m, Y=${interTableSpacingY.toFixed(2)}m`);
          }

          const azimuth = polygon.azimuth || 180;
          console.log(`Processing Table Placement for Polygon ${polygonIndex} using Spherical Geometry... Azimuth: ${azimuth}°`);
          
          // Calculate polygon centroid
          const path = polygon.polygon.getPath();
          let centerLat = 0;
          let centerLng = 0;
          const vertexCount = path.getLength();
          
          for (let i = 0; i < vertexCount; i++) {
            const vertex = path.getAt(i)!;
            centerLat += vertex.lat();
            centerLng += vertex.lng();
          }
          
          centerLat /= vertexCount;
          centerLng /= vertexCount;
          const centroid = new google.maps.LatLng(centerLat, centerLng);
          
          // Check if centroid is inside polygon
          const centroidInside = google.maps.geometry.poly.containsLocation(centroid, polygon.polygon);
          let finalStartPoint = centroid;
          
          if (!centroidInside) {
            console.warn(`Table placement: Centroid is NOT inside polygon! Using bounds center...`);
            const boundsCenter = bounds.getCenter();
            if (google.maps.geometry.poly.containsLocation(boundsCenter, polygon.polygon)) {
              finalStartPoint = boundsCenter;
            }
          }
          
          // Optimize starting point based on alignment for better coverage
          if (activeAlignment === TableLayoutAlignment.Left) {
            // For left alignment, move towards the left edge
            const leftDirection = normalizeAngle(azimuth + 270);
            const maxSearchDistance = google.maps.geometry.spherical.computeDistanceBetween(sw, ne) * 0.4;
            
            for (let distance = 10; distance <= maxSearchDistance; distance += 10) {
              const testPoint = google.maps.geometry.spherical.computeOffset(finalStartPoint, distance, leftDirection);
              if (google.maps.geometry.poly.containsLocation(testPoint, polygon.polygon)) {
                finalStartPoint = testPoint;
              } else {
                break;
              }
            }
            console.log(`Table Left alignment: Starting from optimized point ${finalStartPoint.toUrlValue()}`);
          } else if (activeAlignment === TableLayoutAlignment.Right) {
            // For right alignment, move towards the right edge
            const rightDirection = normalizeAngle(azimuth + 90);
            const maxSearchDistance = google.maps.geometry.spherical.computeDistanceBetween(sw, ne) * 0.4;
            
            for (let distance = 10; distance <= maxSearchDistance; distance += 10) {
              const testPoint = google.maps.geometry.spherical.computeOffset(finalStartPoint, distance, rightDirection);
              if (google.maps.geometry.poly.containsLocation(testPoint, polygon.polygon)) {
                finalStartPoint = testPoint;
              } else {
                break;
              }
            }
            console.log(`Table Right alignment: Starting from optimized point ${finalStartPoint.toUrlValue()}`);
          } else if (activeAlignment === TableLayoutAlignment.Center) {
            // For center alignment, move towards the edge opposite to azimuth
            const oppositeDirection = normalizeAngle(azimuth + 180);
            const maxSearchDistance = google.maps.geometry.spherical.computeDistanceBetween(sw, ne) * 0.4;
            
            for (let distance = 10; distance <= maxSearchDistance; distance += 10) {
              const testPoint = google.maps.geometry.spherical.computeOffset(finalStartPoint, distance, oppositeDirection);
              if (google.maps.geometry.poly.containsLocation(testPoint, polygon.polygon)) {
                finalStartPoint = testPoint;
              } else {
                break;
              }
            }
            console.log(`Table Center alignment: Starting from optimized point ${finalStartPoint.toUrlValue()}, moved towards opposite edge`);
          }
          
          // Use spherical geometry spiral approach (like working reference)
          const maxSearchDistance = google.maps.geometry.spherical.computeDistanceBetween(sw, ne) * 1.2;
          const rowHeading = azimuth;
          const colHeading = normalizeAngle(azimuth + 90);
          const tableSpacingX = tableWidth + interTableSpacingX;
          const tableSpacingY = tableHeight + interTableSpacingY;
          
          console.log(`Table Grid: Start Point: ${finalStartPoint.toUrlValue()}`);
          console.log(`Table Headings - Row: ${rowHeading.toFixed(1)}°, Col: ${colHeading.toFixed(1)}°`);
          
          const rowDirections = [rowHeading, normalizeAngle(rowHeading + 180)]; // Forward and backward
          const colDirections = [colHeading, normalizeAngle(colHeading + 180)]; // Forward and backward
          
          const MAX_ITERATIONS = 20000;
          let iterations = 0;
          let totalTestPoints = 0;
          
          // Track placed table centers to prevent overlap
          const placedTableCenters: google.maps.LatLng[] = [];
          const placedTableDistance = Math.min(tableSpacingX, tableSpacingY) * 0.85;
          
          // Utility function to check for table overlap
          const isTooCloseToExistingTable = (point: google.maps.LatLng): boolean => {
            for (const existingCenter of placedTableCenters) {
              if (google.maps.geometry.spherical.computeDistanceBetween(point, existingCenter) < placedTableDistance) {
                return true;
              }
            }
            return false;
          };
          
          // Spiral outward from center point
          for (const rowDirection of rowDirections) {
            if (placedInThisPolygon >= modulesToPlace) break;
            
            let rowStart = finalStartPoint;
            let rowNum = 0;
            let rowDistance = 0;
            
            // Spiral out row by row
            while (iterations < MAX_ITERATIONS && 
                   placedInThisPolygon < modulesToPlace && 
                   rowDistance < maxSearchDistance) {
              
              for (const colDirection of colDirections) {
                if (placedInThisPolygon >= modulesToPlace) break;
                
                let currentCenter = rowStart;
                let colNum = 0;
                let colDistance = 0;
                
                // Move along column in current direction
                while (iterations < MAX_ITERATIONS && 
                       placedInThisPolygon < modulesToPlace && 
                       colDistance < maxSearchDistance) {
                  
                  iterations++;
                  totalTestPoints++;
                  
                  // Check if table center is inside polygon
                  const isInside = google.maps.geometry.poly.containsLocation(currentCenter, polygon.polygon);
                  
                  if (isInside && !isTooCloseToExistingTable(currentCenter)) {
                    // Calculate table corners using spherical geometry
                    const halfTableWidth = tableWidth / 2;
                    const halfTableHeight = tableHeight / 2;
                    
                    // Calculate table corner coordinates
                    const tableCornerDist = Math.sqrt(halfTableWidth**2 + halfTableHeight**2);
                    const tableAngleOffset = Math.atan2(halfTableWidth, halfTableHeight) * (180 / Math.PI);
                    
                    // Calculate corner headings for the table (same as working reference)
                    const tableNEHeading = normalizeAngle(azimuth - tableAngleOffset);
                    const tableSEHeading = normalizeAngle(azimuth + tableAngleOffset);
                    const tableNWHeading = normalizeAngle(azimuth - tableAngleOffset + 180);
                    const tableSWHeading = normalizeAngle(azimuth + tableAngleOffset + 180);
                    
                    // Calculate table corners using spherical offset from center
                    const tableNE = google.maps.geometry.spherical.computeOffset(currentCenter, tableCornerDist, tableNEHeading);
                    const tableSE = google.maps.geometry.spherical.computeOffset(currentCenter, tableCornerDist, tableSEHeading);
                    const tableNW = google.maps.geometry.spherical.computeOffset(currentCenter, tableCornerDist, tableNWHeading);
                    const tableSW = google.maps.geometry.spherical.computeOffset(currentCenter, tableCornerDist, tableSWHeading);
                    
                    const tableCorners = [tableNE, tableSE, tableSW, tableNW];
                    
                    // Apply structure-specific containment logic for tables
                    let shouldPlaceTable = false;
                    
                    if (structureType.id === 'ground_mount_tables' || structureType.id === 'fixed_tilt') {
                      // For Ground Mount Tables and Fixed Tilt Elevated:
                      // Check if entire table (including all modules) will fit completely inside polygon
                      // This ensures if any module would cross boundaries, the entire table is rejected
                      
                      // First check if table structure itself is inside
                      const tableInsidePolygon = tableCorners.every(corner => 
                        google.maps.geometry.poly.containsLocation(corner, polygon.polygon)
                      );
                      
                      if (tableInsidePolygon) {
                        // Calculate table's local coordinate system vectors for validation
                        const tableXHeading = normalizeAngle(azimuth + 90);
                        const tableYHeading = azimuth;
                        
                        // Additionally check that all modules within this table will be inside
                        let allModulesWouldBeInside = true;
                        
                        for (let row = 0; row < rowsPerTable && allModulesWouldBeInside; row++) {
                          for (let col = 0; col < modulesPerRow && allModulesWouldBeInside; col++) {
                            // Calculate local coordinates within table (relative to table center)
                            const localX = (col - (modulesPerRow - 1) / 2) * actualModuleWidthForTableInternal;
                            const localY = (row - (rowsPerTable - 1) / 2) * actualModuleHeightForTableInternal;
                            
                            // Convert local coordinates to global position using table's coordinate system
                            let moduleCenter = currentCenter;
                            
                            // Apply X offset (perpendicular to azimuth)
                            if (Math.abs(localX) > 0.001) {
                              moduleCenter = google.maps.geometry.spherical.computeOffset(
                                moduleCenter,
                                Math.abs(localX),
                                localX > 0 ? tableXHeading : normalizeAngle(tableXHeading + 180)
                              );
                            }
                            
                            // Apply Y offset (along azimuth direction)
                            if (Math.abs(localY) > 0.001) {
                              moduleCenter = google.maps.geometry.spherical.computeOffset(
                                moduleCenter,
                                Math.abs(localY),
                                localY > 0 ? tableYHeading : normalizeAngle(tableYHeading + 180)
                              );
                            }
                            
                            // Calculate module corners
                            const moduleCorners = calculateModuleCorners(moduleCenter, finalModuleWidth, finalModuleHeight, azimuth);
                            
                            // Check if all module corners are inside polygon
                            const moduleInsidePolygon = 
                              google.maps.geometry.poly.containsLocation(moduleCorners.moduleNE, polygon.polygon) &&
                              google.maps.geometry.poly.containsLocation(moduleCorners.moduleSE, polygon.polygon) &&
                              google.maps.geometry.poly.containsLocation(moduleCorners.moduleSW, polygon.polygon) &&
                              google.maps.geometry.poly.containsLocation(moduleCorners.moduleNW, polygon.polygon);
                            
                            if (!moduleInsidePolygon) {
                              allModulesWouldBeInside = false;
                            }
                          }
                        }
                        
                        shouldPlaceTable = allModulesWouldBeInside;
                      }
                    } else {
                      // For other structure types (shouldn't reach here in table-grid mode, but safety fallback)
                      shouldPlaceTable = tableCorners.every(corner => 
                        google.maps.geometry.poly.containsLocation(corner, polygon.polygon)
                      );
                    }
                    
                    if (shouldPlaceTable) {
                      // Calculate table's coordinate system for precise module placement
                      const halfTableWidth = tableWidth / 2;
                      const halfTableHeight = tableHeight / 2;
                      
                      // Calculate table's local coordinate system vectors
                      // X-axis (along azimuth + 90°) and Y-axis (along azimuth)
                      const tableXHeading = normalizeAngle(azimuth + 90);
                      const tableYHeading = azimuth;
                      
                      // Place all modules within this table using table-relative coordinates
                      for (let row = 0; row < rowsPerTable && placedInThisPolygon < modulesToPlace; row++) {
                        for (let col = 0; col < modulesPerRow && placedInThisPolygon < modulesToPlace; col++) {
                          // Calculate local coordinates within table (relative to table center)
                          const localX = (col - (modulesPerRow - 1) / 2) * actualModuleWidthForTableInternal;
                          const localY = (row - (rowsPerTable - 1) / 2) * actualModuleHeightForTableInternal;
                          
                          // Convert local coordinates to global position using table's coordinate system
                          let moduleCenter = currentCenter;
                          
                          // Apply X offset (perpendicular to azimuth)
                          if (Math.abs(localX) > 0.001) {
                            moduleCenter = google.maps.geometry.spherical.computeOffset(
                              moduleCenter,
                              Math.abs(localX),
                              localX > 0 ? tableXHeading : normalizeAngle(tableXHeading + 180)
                            );
                          }
                          
                          // Apply Y offset (along azimuth direction)
                          if (Math.abs(localY) > 0.001) {
                            moduleCenter = google.maps.geometry.spherical.computeOffset(
                              moduleCenter,
                              Math.abs(localY),
                              localY > 0 ? tableYHeading : normalizeAngle(tableYHeading + 180)
                            );
                          }
                          
                          // Calculate module corners using the same azimuth as the table
                          const corners = calculateModuleCorners(moduleCenter, finalModuleWidth, finalModuleHeight, azimuth);
                          
                          // For non-standard azimuth angles OR portrait orientation, create a rotated polygon instead of rectangle
                          // Portrait orientation needs polygons to display correctly even at standard angles
                          if (Math.abs(azimuth % 90) > 1 || layoutParams.orientation === 'portrait') {
                            // Create module as polygon using proper azimuth-based geometry
                            const polygonPath = createModulePolygonPath(
                              moduleCenter, 
                              finalModuleWidth, 
                              finalModuleHeight, 
                              azimuth
                            );
                            
                            const modulePolygon = new google.maps.Polygon({
                              paths: polygonPath,
                              strokeColor: MODULE_STYLE.strokeColor,
                              strokeOpacity: MODULE_STYLE.strokeOpacity,
                              strokeWeight: MODULE_STYLE.strokeWeight,
                              fillColor: MODULE_STYLE.fillColor,
                              fillOpacity: MODULE_STYLE.fillOpacity,
                              clickable: false,
                              draggable: false,
                              editable: false,
                              zIndex: MODULE_STYLE.zIndex,
                              map: map,
                            });
                            
                            newModuleRectangles.push(modulePolygon);
                          } else {
                            // For standard angles, use rectangle bounds as before
                            const boundsLiteral = new google.maps.LatLngBounds();
                            boundsLiteral.extend(corners.moduleNE);
                            boundsLiteral.extend(corners.moduleSE);
                            boundsLiteral.extend(corners.moduleSW);
                            boundsLiteral.extend(corners.moduleNW);
                            
                            // Create rectangle for this module
                            const rectangle = new google.maps.Rectangle({
                              strokeColor: MODULE_STYLE.strokeColor,
                              strokeOpacity: MODULE_STYLE.strokeOpacity,
                              strokeWeight: MODULE_STYLE.strokeWeight,
                              fillColor: MODULE_STYLE.fillColor,
                              fillOpacity: MODULE_STYLE.fillOpacity,
                              clickable: false,
                              draggable: false,
                              editable: false,
                              zIndex: MODULE_STYLE.zIndex,
                              bounds: boundsLiteral,
                              map: map,
                            });
                            
                            newModuleRectangles.push(rectangle);
                          }
                          placedInThisPolygon++;
                        }
                      }
                      
                      // Track this table center
                      placedTableCenters.push(currentCenter);
                    }
                  }
                  
                  // Move to next position in column
                  const nextCenter = google.maps.geometry.spherical.computeOffset(currentCenter, tableSpacingX, colDirection);
                  if (!nextCenter) break;
                  
                  currentCenter = nextCenter;
                  colNum++;
                  colDistance += tableSpacingX;
                }
              }
              
              // Move to next row
              const nextRowStart = google.maps.geometry.spherical.computeOffset(rowStart, tableSpacingY, rowDirection);
              if (!nextRowStart) break;
              
              rowStart = nextRowStart;
              rowNum++;
              rowDistance += tableSpacingY;
            }
          }
          
          console.log(`Table placement stats: ${placedInThisPolygon} modules placed in ${placedTableCenters.length} tables out of ${totalTestPoints} tested positions`);
          
          moduleLayout = {
            maxX: modulesPerRow * placedTableCenters.length,
            maxY: rowsPerTable,
            moduleWidthWithSpacing: baseModuleWidthWithSpacing,
            moduleHeightWithSpacing: baseModuleHeightWithSpacing
          };
          }
        }
                else { // Grid-based placement for simple grid structures (ballasted, free form)
          const azimuth = polygon.azimuth || 180;
          console.log(`Processing Polygon ${polygonIndex} using Grid-Based Placement... Azimuth: ${azimuth}°`);
          
          // Calculate polygon centroid
          const path = polygon.polygon.getPath();
          let centerLat = 0;
          let centerLng = 0;
          const vertexCount = path.getLength();
          
          for (let i = 0; i < vertexCount; i++) {
            const vertex = path.getAt(i)!;
            centerLat += vertex.lat();
            centerLng += vertex.lng();
          }
          
          centerLat /= vertexCount;
          centerLng /= vertexCount;
          const centroid = new google.maps.LatLng(centerLat, centerLng);
          
          // Determine grid starting point based on alignment
          let gridOrigin: google.maps.LatLng;
          
          if (activeAlignment === TableLayoutAlignment.Left) {
            const leftDirection = normalizeAngle(azimuth + 270);
            gridOrigin = centroid;
            const maxSearchDistance = google.maps.geometry.spherical.computeDistanceBetween(sw, ne) * 0.4;
            
            for (let distance = 10; distance <= maxSearchDistance; distance += 10) {
              const testPoint = google.maps.geometry.spherical.computeOffset(centroid, distance, leftDirection);
              if (google.maps.geometry.poly.containsLocation(testPoint, polygon.polygon)) {
                gridOrigin = testPoint;
              } else {
                break;
              }
            }
          } else if (activeAlignment === TableLayoutAlignment.Right) {
            const rightDirection = normalizeAngle(azimuth + 90);
            gridOrigin = centroid;
            const maxSearchDistance = google.maps.geometry.spherical.computeDistanceBetween(sw, ne) * 0.4;
            
            for (let distance = 10; distance <= maxSearchDistance; distance += 10) {
              const testPoint = google.maps.geometry.spherical.computeOffset(centroid, distance, rightDirection);
              if (google.maps.geometry.poly.containsLocation(testPoint, polygon.polygon)) {
                gridOrigin = testPoint;
              } else {
                break;
              }
            }
          } else if (activeAlignment === TableLayoutAlignment.Center) {
            const oppositeDirection = normalizeAngle(azimuth + 180);
            gridOrigin = centroid;
            const maxSearchDistance = google.maps.geometry.spherical.computeDistanceBetween(sw, ne) * 0.4;
            
            for (let distance = 10; distance <= maxSearchDistance; distance += 10) {
              const testPoint = google.maps.geometry.spherical.computeOffset(centroid, distance, oppositeDirection);
              if (google.maps.geometry.poly.containsLocation(testPoint, polygon.polygon)) {
                gridOrigin = testPoint;
              } else {
                break;
              }
            }
          } else {
            gridOrigin = centroid; // Justify mode starts from centroid
          }
          
          // Ensure grid origin is inside polygon
          if (!google.maps.geometry.poly.containsLocation(gridOrigin, polygon.polygon)) {
            const boundsCenter = bounds.getCenter();
            gridOrigin = google.maps.geometry.poly.containsLocation(boundsCenter, polygon.polygon) ? boundsCenter : centroid;
          }
          
          console.log(`Grid origin: ${gridOrigin.toUrlValue()}`);
          
          // Calculate grid dimensions based on polygon bounds
          const polygonWidth = google.maps.geometry.spherical.computeDistanceBetween(sw, ne);
          const maxRows = Math.ceil(polygonWidth / baseModuleHeightWithSpacing) + 5; // Extra buffer
          const maxCols = Math.ceil(polygonWidth / baseModuleWidthWithSpacing) + 5; // Extra buffer
          
          // Define grid directions based on azimuth
          const rowHeading = azimuth; // Along azimuth direction
          const colHeading = normalizeAngle(azimuth + 90); // Perpendicular to azimuth
          
          // Track placed modules to prevent overlaps
          const placedModuleCenters: Set<string> = new Set();
          
          // Generate precise grid using coordinate system approach
          const placeModuleAt = (rowIndex: number, colIndex: number): boolean => {
            // Calculate module position using consistent coordinate system
            let moduleCenter = gridOrigin;
            
            // Apply row offset (Y direction - along azimuth)
            if (rowIndex !== 0) {
              moduleCenter = google.maps.geometry.spherical.computeOffset(
                moduleCenter,
                Math.abs(rowIndex) * baseModuleHeightWithSpacing,
                rowIndex > 0 ? rowHeading : normalizeAngle(rowHeading + 180)
              );
            }
            
            // Apply column offset (X direction - perpendicular to azimuth)
            if (colIndex !== 0) {
              moduleCenter = google.maps.geometry.spherical.computeOffset(
                moduleCenter,
                Math.abs(colIndex) * baseModuleWidthWithSpacing,
                colIndex > 0 ? colHeading : normalizeAngle(colHeading + 180)
              );
            }
            
            // Create unique key for this grid position
            const positionKey = `${rowIndex},${colIndex}`;
            if (placedModuleCenters.has(positionKey)) {
              return false; // Already placed
            }
            
            // Check if module center is inside polygon
            if (!google.maps.geometry.poly.containsLocation(moduleCenter, polygon.polygon)) {
              return false;
            }
            
            // Calculate module corners for containment check
            const corners = calculateModuleCorners(moduleCenter, finalModuleWidth, finalModuleHeight, azimuth);
            
            // Apply structure-specific containment logic for grid placement
            let canPlace = false;
            
            if (structureType.id === 'ballasted' || structureType.id === 'pv_table_free_form') {
              // For Ballasted Flat Roof and PV Table - Free Form:
              // Allow modules that are touching edges but not crossing boundaries
              // Check if any corner is outside (crossing boundary)
              const anyCornersOutside = 
                !google.maps.geometry.poly.containsLocation(corners.moduleNE, polygon.polygon) ||
                !google.maps.geometry.poly.containsLocation(corners.moduleSE, polygon.polygon) ||
                !google.maps.geometry.poly.containsLocation(corners.moduleSW, polygon.polygon) ||
                !google.maps.geometry.poly.containsLocation(corners.moduleNW, polygon.polygon);
              
              // Place module only if no corners are crossing boundaries
              canPlace = !anyCornersOutside;
            } else if (structureType.id === 'carport') {
              // For Carport: No optimization needed (as per user request)
              // Use standard containment check
              const cornerCount = [corners.moduleNE, corners.moduleSE, corners.moduleSW, corners.moduleNW]
                .filter(corner => google.maps.geometry.poly.containsLocation(corner, polygon.polygon)).length;
              
              if (activeAlignment === TableLayoutAlignment.Justify) {
                canPlace = (cornerCount === 4); // All corners must be inside
              } else {
                canPlace = (cornerCount >= 3); // At least 3 corners inside
              }
            } else {
              // For other structure types (should not reach here in grid mode, but safety fallback)
              // Require strict containment (all corners inside)
              const allCornersInside = 
                google.maps.geometry.poly.containsLocation(corners.moduleNE, polygon.polygon) &&
                google.maps.geometry.poly.containsLocation(corners.moduleSE, polygon.polygon) &&
                google.maps.geometry.poly.containsLocation(corners.moduleSW, polygon.polygon) &&
                google.maps.geometry.poly.containsLocation(corners.moduleNW, polygon.polygon);
              
              canPlace = allCornersInside;
            }
            
            if (canPlace) {
              // For non-standard azimuth angles OR portrait orientation, create a rotated polygon instead of rectangle
              // Portrait orientation needs polygons to display correctly even at standard angles
              if (Math.abs(azimuth % 90) > 1 || layoutParams.orientation === 'portrait') {
                // Create module as polygon using proper azimuth-based geometry
                const polygonPath = createModulePolygonPath(
                  moduleCenter, 
                  finalModuleWidth, 
                  finalModuleHeight, 
                  azimuth
                );
                
                const modulePolygon = new google.maps.Polygon({
                  paths: polygonPath,
                  strokeColor: MODULE_STYLE.strokeColor,
                  strokeOpacity: MODULE_STYLE.strokeOpacity,
                  strokeWeight: MODULE_STYLE.strokeWeight,
                  fillColor: MODULE_STYLE.fillColor,
                  fillOpacity: MODULE_STYLE.fillOpacity,
                  clickable: false,
                  draggable: false,
                  editable: false,
                  zIndex: MODULE_STYLE.zIndex,
                  map: map,
                });
                
                newModuleRectangles.push(modulePolygon);
              } else {
                // For standard angles, use rectangle bounds as before
                const boundsLiteral = new google.maps.LatLngBounds();
                boundsLiteral.extend(corners.moduleNE);
                boundsLiteral.extend(corners.moduleSE);
                boundsLiteral.extend(corners.moduleSW);
                boundsLiteral.extend(corners.moduleNW);
                
                const rectangle = new google.maps.Rectangle({
                  strokeColor: MODULE_STYLE.strokeColor,
                  strokeOpacity: MODULE_STYLE.strokeOpacity,
                  strokeWeight: MODULE_STYLE.strokeWeight,
                  fillColor: MODULE_STYLE.fillColor,
                  fillOpacity: MODULE_STYLE.fillOpacity,
                  clickable: false,
                  draggable: false,
                  editable: false,
                  zIndex: MODULE_STYLE.zIndex,
                  bounds: boundsLiteral,
                  map: map,
                });
                
                newModuleRectangles.push(rectangle);
              }
              
              placedModuleCenters.add(positionKey);
              placedInThisPolygon++;
              return true;
            }
            
            return false;
          };
          
          // Place modules in grid pattern with spiral expansion from origin
          for (let radius = 0; radius <= Math.max(maxRows, maxCols) && placedInThisPolygon < modulesToPlace; radius++) {
            // For radius 0, just place at origin
            if (radius === 0) {
              placeModuleAt(0, 0);
              continue;
            }
            
            // For radius > 0, place modules in expanding square pattern
            const positions: Array<[number, number]> = [];
            
            // Top and bottom rows of the square
            for (let col = -radius; col <= radius; col++) {
              positions.push([-radius, col]); // Top row
              positions.push([radius, col]);  // Bottom row
            }
            
            // Left and right columns (excluding corners already covered)
            for (let row = -radius + 1; row < radius; row++) {
              positions.push([row, -radius]); // Left column
              positions.push([row, radius]);  // Right column
            }
            
            // Place modules at all positions in this radius
            for (const [row, col] of positions) {
              if (placedInThisPolygon >= modulesToPlace) break;
              placeModuleAt(row, col);
            }
          }
          
          console.log(`Grid placement: ${placedInThisPolygon} modules placed in grid pattern`);
        }
        
        // Store the modules placed in this polygon
        newPlacedModulesPerPolygon[polygonIndex] = placedInThisPolygon;
        totalPlacedModules += placedInThisPolygon;
        
        // Calculate table count for this polygon based on structure type and actual grid layout
        let tableCountForPolygon = 0;
        
        // For ballasted systems, use actual grid dimensions to get correct table count
        let actualModulesPerRow = 0;
        let actualRows = 0;
        
        if (structureType.id === 'ballasted' && moduleLayout && placedInThisPolygon > 0) {
          // Use actual grid dimensions from module placement
          const gridMaxX = moduleLayout.maxX || 0;
          const gridMaxY = moduleLayout.maxY || 0;
          const expectedModules = gridMaxX * gridMaxY;
          
          // Calculate the actual layout from placed modules
          // Try different reasonable row counts to find the best fit
          let bestFit = null;
          let bestDifference = Infinity;
          
          // Test row counts from 80% to 120% of theoretical grid
          const minRows = Math.max(1, Math.floor(gridMaxY * 0.6));
          const maxRows = Math.ceil(gridMaxY * 1.2);
          
          for (let testRows = minRows; testRows <= maxRows; testRows++) {
            const modulesPerRow = Math.round(placedInThisPolygon / testRows);
            const totalModules = testRows * modulesPerRow;
            const difference = Math.abs(totalModules - placedInThisPolygon);
            
            // Calculate distance from original grid dimensions for tie-breaking
            const gridDistanceY = Math.abs(testRows - gridMaxY);
            const gridDistanceX = Math.abs(modulesPerRow - gridMaxX);
            const gridDistance = gridDistanceY + gridDistanceX;
            
            // Prefer solutions with smaller difference, then prefer closer to original grid
            const isBetter = difference < bestDifference || 
                           (difference === bestDifference && 
                            bestFit && 
                            gridDistance < (Math.abs(bestFit.rows - gridMaxY) + Math.abs(bestFit.modulesPerRow - gridMaxX)));
            
            if (isBetter) {
              bestDifference = difference;
              bestFit = {
                rows: testRows,
                modulesPerRow: modulesPerRow,
                totalModules: totalModules,
                difference: difference,
                gridDistance: gridDistance
              };
            }
          }
          
          // Use the best fit if it's reasonable (within 5% of actual modules)
          if (bestFit && bestFit.difference <= Math.max(5, placedInThisPolygon * 0.05)) {
            actualModulesPerRow = bestFit.modulesPerRow;
            actualRows = bestFit.rows;
            tableCountForPolygon = actualRows;
            console.log(`Ballasted layout optimized: ${actualModulesPerRow} modules/row × ${actualRows} rows = ${placedInThisPolygon} modules (${actualRows} tables), grid was ${gridMaxX}×${gridMaxY}, distance: ${bestFit.gridDistance}`);
          } else if (Math.abs(expectedModules - placedInThisPolygon) <= Math.max(10, placedInThisPolygon * 0.1)) {
            // If within 10% of expected, use grid dimensions but adjust for actual placement
            actualModulesPerRow = Math.round(placedInThisPolygon / gridMaxY);
            actualRows = gridMaxY;
            tableCountForPolygon = actualRows;
            console.log(`Ballasted layout from adjusted grid: ${actualModulesPerRow} modules/row × ${actualRows} rows = ${placedInThisPolygon} modules (${actualRows} tables)`);
          } else {
            // Fallback to estimation if grid doesn't match
            console.log(`Grid mismatch: expected ${expectedModules}, actual ${placedInThisPolygon}, best fit: ${bestFit?.rows}×${bestFit?.modulesPerRow} (diff: ${bestFit?.difference}), falling back to estimation`);
          }
        }
        switch (structureType.id) {
          case 'ground_mount_tables': {
            if (layoutParams.tableConfig) {
              const modulesPerTable = layoutParams.tableConfig.rowsPerTable * layoutParams.tableConfig.modulesPerRow;
              tableCountForPolygon = Math.ceil(placedInThisPolygon / modulesPerTable);
            } else {
              // Default: 3 rows × 5 modules = 15 modules per table
              tableCountForPolygon = Math.ceil(placedInThisPolygon / 15);
            }
            break;
          }
          case 'fixed_tilt': {
            if (layoutParams.tableConfig) {
              const modulesPerTable = layoutParams.tableConfig.rowsPerTable * layoutParams.tableConfig.modulesPerRow;
              tableCountForPolygon = Math.ceil(placedInThisPolygon / modulesPerTable);
            } else {
              // Default: 1 row × 8 modules = 8 modules per table
              tableCountForPolygon = Math.ceil(placedInThisPolygon / 8);
            }
            break;
          }
          case 'carport': {
            if (layoutParams.carportConfig) {
              const modulesPerCarport = layoutParams.carportConfig.rows * layoutParams.carportConfig.modulesPerRow;
              tableCountForPolygon = Math.ceil(placedInThisPolygon / modulesPerCarport);
            } else {
              // Default: 6 rows × 10 modules = 60 modules per carport
              tableCountForPolygon = Math.ceil(placedInThisPolygon / 60);
            }
            break;
          }
          case 'ballasted': {
            // Check if we already calculated table count using actual grid dimensions
            if (tableCountForPolygon > 0) {
              // Already calculated using actual grid dimensions - use that value
              break;
            }
            
            // Fallback: For ballasted systems, calculate table count based on actual placement pattern
            // Each row in a ballasted system typically represents one table
            
            if (placedInThisPolygon > 0) {
              // Try different common ballasted layouts to find the best fit
              const commonLayouts = [
                {modulesPerRow: 9, rows: 5},   // 45 modules: 9×5
                {modulesPerRow: 10, rows: 4},  // 40 modules: 10×4  
                {modulesPerRow: 12, rows: 4},  // 48 modules: 12×4
                {modulesPerRow: 15, rows: 3},  // 45 modules: 15×3
                {modulesPerRow: 17, rows: 14}, // 238 modules: 17×14
                {modulesPerRow: 18, rows: 15}, // 270 modules: 18×15
                {modulesPerRow: 19, rows: 14}, // 266 modules: 19×14
                {modulesPerRow: 20, rows: 2},  // 40 modules: 20×2
                {modulesPerRow: 25, rows: 2},  // 50 modules: 25×2
                {modulesPerRow: 33, rows: 24}, // 792 modules: 33×24
                {modulesPerRow: 44, rows: 18}, // 792 modules: 44×18 (alternative)
              ];
              
              let bestLayout = null;
              let smallestDifference = Infinity;
              
              // Find the layout that best matches the placed module count
              for (const layout of commonLayouts) {
                const totalModules = layout.modulesPerRow * layout.rows;
                const difference = Math.abs(totalModules - placedInThisPolygon);
                
                // Calculate distance from original grid for tie-breaking
                const originalGridX = moduleLayout?.maxX || 0;
                const originalGridY = moduleLayout?.maxY || 0;
                const gridDistanceY = originalGridY ? Math.abs(layout.rows - originalGridY) : 0;
                const gridDistanceX = originalGridX ? Math.abs(layout.modulesPerRow - originalGridX) : 0;
                const gridDistance = gridDistanceY + gridDistanceX;
                
                // Prefer solutions with smaller difference, then prefer closer to original grid
                const isBetter = difference < smallestDifference || 
                               (difference === smallestDifference && 
                                bestLayout && 
                                gridDistance < (Math.abs(bestLayout.rows - originalGridY) + Math.abs(bestLayout.modulesPerRow - originalGridX)));
                
                if (isBetter) {
                  smallestDifference = difference;
                  bestLayout = layout;
                }
              }
              
              if (bestLayout && smallestDifference <= 5) {
                // Use the best matching layout
                tableCountForPolygon = bestLayout.rows;
                console.log(`Ballasted layout detected: ${bestLayout.modulesPerRow} modules/row × ${bestLayout.rows} rows = ${placedInThisPolygon} modules (${bestLayout.rows} tables)`);
              } else {
                // Fallback: estimate based on typical ballasted row lengths
                const estimatedModulesPerRow = Math.round(Math.sqrt(placedInThisPolygon * 1.8)); // Favor wider rows
                tableCountForPolygon = Math.max(1, Math.round(placedInThisPolygon / estimatedModulesPerRow));
                console.log(`Ballasted layout estimated: ${estimatedModulesPerRow} modules/row × ${tableCountForPolygon} rows = ${placedInThisPolygon} modules`);
              }
            } else {
              tableCountForPolygon = 0;
            }
            break;
          }
          case 'pv_table_free_form': {
            // For free-form PV tables, estimate based on typical table configuration
            // Typical PV table: 2 rows × 8 modules = 16 modules per table
            // This helps estimate structural components needed
            const modulesPerTable = 16;
            tableCountForPolygon = Math.ceil(placedInThisPolygon / modulesPerTable);
            break;
          }
          default: {
            // For unknown structure types, use a conservative estimate
            tableCountForPolygon = Math.ceil(placedInThisPolygon / 16); // 16 modules per table
            break;
          }
        }
        
        // Calculate spatial table layout arrangement for elevated and ground-mount structures
        let tableLayoutRows = undefined;
        let tableLayoutCols = undefined;
        
        if ((structureType.id === 'fixed_tilt' || structureType.id === 'ground_mount_tables') && tableCountForPolygon > 0) {
          // Use actual calculated grid dimensions from the table placement algorithm
          // This ensures the spatial layout matches the visual placement
          if (typeof calculatedTablesX !== 'undefined' && typeof calculatedTablesY !== 'undefined') {
            // Use the actual calculated grid dimensions
            tableLayoutRows = calculatedTablesY; // Rows down (Y direction)
            tableLayoutCols = calculatedTablesX; // Columns across (X direction)
            console.log(`🏗️ Spatial Layout - ${structureType.id}: ${tableLayoutRows} rows × ${tableLayoutCols} cols = ${tableCountForPolygon} tables (Using ACTUAL placement grid)`);
          } else {
            // Fallback to estimation only if calculated values are not available
            const isGroundMount = structureType.id === 'ground_mount_tables';
            let tablesPerRow = 3;
            if (tableCountForPolygon <= 6) tablesPerRow = 2;
            else if (tableCountForPolygon <= 12) tablesPerRow = 3;
            else tablesPerRow = 3;
            
            tableLayoutRows = Math.ceil(tableCountForPolygon / tablesPerRow);
            tableLayoutCols = Math.min(tablesPerRow, tableCountForPolygon);
            console.log(`🏗️ Spatial Layout - ${structureType.id}: ${tableLayoutRows} rows × ${tableLayoutCols} cols = ${tableCountForPolygon} tables (Using fallback estimation)`);
          }
        }
        
        // Extract polygon path coordinates for saving/restoring
        const polygonPath = polygon.polygon.getPath();
        const pathCoordinates = polygonPath.getArray().map((latLng: google.maps.LatLng) => ({
          lat: latLng.lat(),
          lng: latLng.lng()
        }));
        
        // Create polygon config for the results with all required properties
        newConfigs.push({
          id: polygonIndex,
          moduleCount: placedInThisPolygon,
          capacityKw: 0, // Will be calculated later
          area: polygon.area || 0,
          azimuth: polygon.azimuth || 180, // Default to south-facing if not specified
          structureType: structureType.id,
          tiltAngle: layoutParams.tiltAngle,
          tableCount: tableCountForPolygon,
          tableLayoutRows: tableLayoutRows, // Spatial arrangement: rows of tables
          tableLayoutCols: tableLayoutCols, // Spatial arrangement: columns of tables
          orientation: layoutParams.orientation, // Pass the actual user-selected orientation
          tableConfig: layoutParams.tableConfig, // Pass the actual table configuration (rows per table, modules per row)
          carportConfig: layoutParams.carportConfig, // Pass the actual carport configuration if applicable
          path: pathCoordinates // Save polygon coordinates for restoring later
        });
        
        console.log(`Placed ${placedInThisPolygon} modules in polygon ${polygonIndex}`);
      });
      
      // Update state with the results
      setPlacedModules(totalPlacedModules);
      setPolygonConfigs(newConfigs);
      
      console.log(`Total modules placed: ${totalPlacedModules}`);
      
      // Mark calculation as done
      moduleCalculationPerformedRef.current = true;
      
      // Calculate total capacity based on module power
      let modulePowerWatts = 0;
      
      // First check the nominal_power_w field directly
      if (selectedPanel.nominal_power_w && typeof selectedPanel.nominal_power_w === 'number' && selectedPanel.nominal_power_w > 0) {
        modulePowerWatts = selectedPanel.nominal_power_w;
      }
      // Handle other power fields as fallbacks
      else if (selectedPanel.power && typeof selectedPanel.power === 'number') {
        if (selectedPanel.power > 1000) {
          // It's probably in watts
          modulePowerWatts = selectedPanel.power;
        } else {
          // It's probably in kW
          modulePowerWatts = selectedPanel.power * 1000;
        }
      }
      else if (selectedPanel.power_rating && typeof selectedPanel.power_rating === 'number') {
        if (selectedPanel.power_rating > 1000) {
          // It's probably in watts
          modulePowerWatts = selectedPanel.power_rating;
        } else {
          // It's probably in kW
          modulePowerWatts = selectedPanel.power_rating * 1000;
        }
      }
      else {
        // Last resort fallback - guess based on module area
        const panelArea = selectedPanel.panel_area_m2 || 1.7;
        const panelEfficiency = selectedPanel.efficiency_percent / 100 || 0.2;
        modulePowerWatts = Math.round(panelArea * 1000 * panelEfficiency);
      }
      
      // Calculate capacity
      const calculatedCapacity = (totalPlacedModules * modulePowerWatts) / 1000;
      console.log(`Calculated capacity: ${calculatedCapacity.toFixed(2)}kW`);
      
      // Set capacity state
      setCapacityKw(calculatedCapacity);
      
      // Prepare polygon configs with capacity
      const updatedPolygonConfigs = newConfigs.map(config => ({
        ...config,
        capacityKw: (config.moduleCount * modulePowerWatts) / 1000
      }));
      
      // Notify parent component with updated values
      onCapacityCalculated(calculatedCapacity, totalArea, totalPlacedModules, updatedPolygonConfigs);

      // Store successful calculation result in cache
      calculationResultCacheRef.current = {
        key: cacheKey,
        timestamp: Date.now(),
        moduleCount: totalPlacedModules,
        capacityKw: calculatedCapacity
      };

      // At the end of calculation, update the moduleRectangles state with all the new rectangles
      setModuleRectangles(newModuleRectangles);
    } catch (error) {
      console.error("Error in calculateModules:", error);
      clearModuleRectangles(); // Make sure to clean up if there's an error
    } finally {
      calculationInProgressRef.current = false;
      if (calculationLockTimeoutRef.current !== null) {
        clearTimeout(calculationLockTimeoutRef.current);
        calculationLockTimeoutRef.current = null;
      }
    }
  }, [map, polygons, moduleCount, selectedPanel, layoutParams, structureType, clearModuleRectangles, totalArea, onCapacityCalculated, tableAlignment, rotationAngleDegrees]);
  
  // Assign the calculation function to the ref
  calculateModulesRef.current = calculateModules;

  // Now, modify the layout parameter change effect to add better caching and prevent redundant calculations
  const layoutChangeEffect = useCallback(() => {
    console.log("Layout parameter change effect running");
    
    // Skip if this is first render
    if (!layoutParamsRef.current) {
      console.log("Initial layout params set:", layoutParams.orientation);
      layoutParamsRef.current = { ...layoutParams };
      return;
    }

    // Prioritize azimuth changes - don't throttle them
    const azimuthChanged = layoutParams.azimuth !== layoutParamsRef.current.azimuth;
    if (azimuthChanged) {
      console.log(`⚠️ AZIMUTH CHANGED from ${layoutParamsRef.current.azimuth}° to ${layoutParams.azimuth}° - FORCING IMMEDIATE RECALCULATION`);
      // Don't throttle azimuth changes, let the azimuth-specific effect handle it
      layoutParamsRef.current = { ...layoutParams };
      return;
    }

    // Add a simple rate limit directly in this effect
    const now = Date.now();
    if (now - lastLayoutChangeTimeRef.current < 2000) { // 2 second cooldown
      console.log("Layout change effect throttled - too soon since last change");
      return;
    }
    lastLayoutChangeTimeRef.current = now;

    // Generate a stable cache key for detecting actual changes
    const currentParamsKey = JSON.stringify({
      tilt: layoutParams.tiltAngle,
      orientation: layoutParams.orientation,
      spacing: layoutParams.interRowSpacing,
      gap: layoutParams.adjacentGap,
      azimuth: layoutParams.azimuth, // Include azimuth in the cache key
      tableConfig: layoutParams.tableConfig ? JSON.stringify(layoutParams.tableConfig) : null,
      carportConfig: layoutParams.carportConfig ? JSON.stringify(layoutParams.carportConfig) : null
    });
    
    // Store this for reference
    const prevParamsKey = JSON.stringify({
      tilt: layoutParamsRef.current.tiltAngle,
      orientation: layoutParamsRef.current.orientation,
      spacing: layoutParamsRef.current.interRowSpacing,
      gap: layoutParamsRef.current.adjacentGap,
      azimuth: layoutParamsRef.current.azimuth, // Include azimuth in the cache key
      tableConfig: layoutParamsRef.current.tableConfig ? JSON.stringify(layoutParamsRef.current.tableConfig) : null,
      carportConfig: layoutParamsRef.current.carportConfig ? JSON.stringify(layoutParamsRef.current.carportConfig) : null
    });
    
    // If no actual change, exit early to prevent infinite loops
    if (currentParamsKey === prevParamsKey) {
      console.log("No actual layout parameter changes detected - skipping recalculation");
      return;
    }
    
    // Compare current layout params with previous ones
    const prevParams = layoutParamsRef.current;
    const orientationChanged = prevParams.orientation !== layoutParams.orientation;
    const tiltChanged = prevParams.tiltAngle !== layoutParams.tiltAngle;
    const spacingChanged = prevParams.interRowSpacing !== layoutParams.interRowSpacing;
    const gapChanged = prevParams.adjacentGap !== layoutParams.adjacentGap;
    
    // Deep compare table and carport configs
    const tableConfigChanged = JSON.stringify(prevParams.tableConfig) !== JSON.stringify(layoutParams.tableConfig);
    const carportConfigChanged = JSON.stringify(prevParams.carportConfig) !== JSON.stringify(layoutParams.carportConfig);
    
    // Log major changes
    if (orientationChanged) {
      console.log(`⚠️ ORIENTATION CHANGED from ${prevParams.orientation} to ${layoutParams.orientation} - FORCING RECALCULATION`);
    }
    
    // If any significant parameter changed
    if (orientationChanged || tiltChanged || spacingChanged || gapChanged || tableConfigChanged || carportConfigChanged) {
      console.log("Layout parameters changed significantly - forcing recalculation");
      
      // Check if a calculation is already scheduled or in progress
      if (calculationTimerRef.current !== null || calculationInProgressRef.current) {
        console.log("Calculation already in progress or scheduled - will let that one handle the new parameters");
        
        // Update the reference but don't trigger another calculation
        layoutParamsRef.current = { ...layoutParams };
        return;
      }
      
      // Update the reference first
      layoutParamsRef.current = { ...layoutParams };
      
      // Only trigger recalculation if modules are already placed
      if (moduleRectangles.length > 0) {
        // Force the calculation flag to true
        moduleCalculationPerformedRef.current = true;
        
        // Clear all existing module rectangles
        clearModuleRectangles();
        
        // Invalidate cache
        calculationResultCacheRef.current.key = "";
        
        // Trigger recalculation after a brief delay to allow state updates
        setTimeout(() => {
          console.log("Executing forced recalculation due to layout parameter change");
          triggerModuleCalculation();
        }, 500);
      }
    } else {
      // No significant changes, just update the reference
      layoutParamsRef.current = { ...layoutParams };
    }
  }, [layoutParams, clearModuleRectangles, triggerModuleCalculation]);

  // Use this effect with the callback
  useEffect(() => {
    layoutChangeEffect();
  }, [layoutChangeEffect]);

  // Finally, modify the original layout parameters effect to prevent redundant calculations
  useEffect(() => {
    // Add circuit breaker to prevent recalculation loops
    if (breakChainRef.current) {
      console.log("Dependency effect skipped due to chain break being active");
      return;
    }
    
    // Add immediate cooldown check to prevent excessive recalculations
    const now = Date.now();
    if (now - lastTriggerTimeRef.current < 2000) { // Increased from 800ms to 2000ms
      console.log("Throttling calculation requests - too frequent");
      return;
    }
    
    // Create a stable dependency key that includes detailed layout parameters
    // But be careful about deep object comparison - use simple values where possible
    const layoutConfigKey = JSON.stringify({
      tilt: layoutParams.tiltAngle,
      orient: layoutParams.orientation,
      rowSpace: layoutParams.interRowSpacing,
      gap: layoutParams.adjacentGap,
      table: layoutParams.tableConfig ? {
        rows: layoutParams.tableConfig.rowsPerTable,
        cols: layoutParams.tableConfig.modulesPerRow,
        sx: layoutParams.tableConfig.interTableSpacingX,
        sy: layoutParams.tableConfig.interTableSpacingY
      } : null,
      carport: layoutParams.carportConfig ? {
        rows: layoutParams.carportConfig.rows,
        cols: layoutParams.carportConfig.modulesPerRow,
        rect: layoutParams.carportConfig.forceRectangle ? 1 : 0
      } : null
    });
    
    const polyKey = polygons.length > 0 ? 
      polygons.map(p => {
        const path = p.polygon.getPath();
        return path ? path.getLength() : 0;
      }).join(',') : 'empty';
      
    const dependencyKey = JSON.stringify({
      polyCount: polygons.length,
      polyKey,
      panelId: selectedPanel?.id,
      modCount: moduleCount,
      structType: structureType.id,
      layout: layoutConfigKey
    });
    
    // Important: Only proceed if there's actually a change
    if (dependencyKey === prevDependencyKeyRef.current) {
      console.log("No meaningful change detected - skipping calculation");
      return;
    }
    
    // Store current state immediately to prevent repeated triggers
    prevDependencyKeyRef.current = dependencyKey;
    
    // Only check layout config once we know overall dependencies changed
    const layoutChanged = prevLayoutConfigRef.current !== layoutConfigKey;
    if (layoutChanged) {
      prevLayoutConfigRef.current = layoutConfigKey;
      console.log("Layout parameters changed - scheduling once");
      
      // Important: If any layout parameter changes, force the recalculation flag
      // But only if no calculation is already in progress
      if (!calculationInProgressRef.current && !calculationTimerRef.current) {
    moduleCalculationPerformedRef.current = true;
    
        // Schedule the calculation with significantly longer delay
    if (calculationTimerRef.current !== null) {
          clearTimeout(calculationTimerRef.current);
          calculationTimerRef.current = null;
    }
    
        console.log("Scheduling a single calculation, will occur in 1500ms if still needed");
    calculationTimerRef.current = setTimeout(() => {
      calculationTimerRef.current = null;
          
          // Only calculate if we have a map and polygons
          if (map && polygons.length > 0) {
            console.log("Executing scheduled calculation");
            calculateModulesRef.current();
          } else {
            console.log("Skipping calculation - conditions not met");
            // Clear modules if we have no polygons
            if (polygons.length === 0 && moduleRectangles.length > 0) {
              clearModuleRectangles();
            }
          }
        }, 1500);
      }
    } else if (polygons.length > 0 && map && moduleRectangles.length === 0) {
      // This is the case where polygons changed but layout didn't
      // Only schedule a calculation if we have polygons but no modules yet
      console.log("No layout change but polygons updated - scheduling calculation");
      
      // Schedule the calculation
    if (calculationTimerRef.current !== null) {
      clearTimeout(calculationTimerRef.current);
        calculationTimerRef.current = null;
    }
    
      // Use longer delay here too
    calculationTimerRef.current = setTimeout(() => {
      calculationTimerRef.current = null;
          
        // Only calculate if we have a map and polygons
        if (map && polygons.length > 0) {
          console.log("Executing polygon-triggered calculation");
          calculateModulesRef.current();
        }
      }, 1500); // Increased from 800ms to 1500ms
    }
    
    // Clean up on unmount
    return () => {
      if (calculationTimerRef.current !== null) {
        clearTimeout(calculationTimerRef.current);
      }
    };
  }, [map, moduleCount, polygons, selectedPanel?.id, structureType.id, layoutParams, clearModuleRectangles, calculateWithDebounce, rotationAngleDegrees]);

  // Add this ref at the top with the other refs:
  const prevLayoutConfigRef = useRef<string>("");
  const prevOrientationRef = useRef<string>("landscape");

  // Create a new useEffect for initial polygon rendering
  useEffect(() => {  
    // Only run when we have polygons but no modules yet
    if (polygons.length > 0 && map instanceof google.maps.Map) {
      
      // Generate polygon key that uniquely identifies the polygons
      const polygonKey = polygons.map((p, index) => {
        const path = p.polygon.getPath();
        // Use first point coordinates + index instead of id
        const firstPoint = path.getAt(0);
        return firstPoint ? `${index}:${firstPoint.lat().toFixed(6)},${firstPoint.lng().toFixed(6)}:${path.getLength()}` : `${index}:empty`;
      }).join(',');
      
      // Log the polygons we're working with
      console.log(`Polygon Key: ${polygonKey}`);
      console.log(`Polygon Count: ${polygons.length}`);
      
      // Check polygon validity in more detail
      let validPolygons = 0;
      polygons.forEach((poly, idx) => {
        const path = poly.polygon.getPath();
        const vertexCount = path.getLength();
        console.log(`Polygon ${idx} path length: ${vertexCount}`);
        
        if (vertexCount >= 3) {
          validPolygons++;
          // Log the first vertex to help with debugging
          const firstVertex = path.getAt(0);
          if (firstVertex) {
            console.log(`Polygon ${idx} first vertex: ${firstVertex.lat().toFixed(6)},${firstVertex.lng().toFixed(6)}`);
          }
        } else {
          console.warn(`Polygon ${idx} is invalid - needs at least 3 vertices`);
        }
      });
      
      console.log(`Valid polygons (with 3+ vertices): ${validPolygons} out of ${polygons.length}`);
      
      // If we detect the polygon collection has changed or no calculation has been done
      if (initializedPolygonsRef.current !== polygonKey || moduleRectangles.length === 0) {
        initializedPolygonsRef.current = polygonKey;
        
        console.log("New polygons detected or no modules placed - scheduling calculation");
        
        // Force reset any existing calculation lock
        calculationInProgressRef.current = false;
        
        // Clear any existing safety timeout
        if (calculationLockTimeoutRef.current !== null) {
          clearTimeout(calculationLockTimeoutRef.current);
          calculationLockTimeoutRef.current = null;
        }
        
        // Add extra delay to ensure map is fully loaded
        setTimeout(() => {
          console.log("Executing initial polygon calculation");
          // Force flag to true for initial calculation
          moduleCalculationPerformedRef.current = true;
          triggerModuleCalculation();
        }, 1000);
      }
    }
  }, [map, polygons, triggerModuleCalculation]);

  // Add these refs at the top near other refs
  const lastCalculationTimeRef = useRef<number>(0);
  const lastLayoutChangeTimeRef = useRef<number>(0);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (calculationTimerRef.current !== null) {
        clearTimeout(calculationTimerRef.current);
      }
      if (calculationLockTimeoutRef.current !== null) {
        clearTimeout(calculationLockTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to calculate optimal start point based on alignment
  const calculateOptimalStartPoint = useCallback((
    bounds: google.maps.LatLngBounds,
    alignment: TableLayoutAlignment,
    topMarginDegrees: number,
    widthMarginDegrees: number
  ) => {
    // Make sure we're using the current alignment
    const activeAlignment = currentAlignmentRef.current;
    console.log(`Using active alignment for optimal start point: ${activeAlignment}`);
    
    // Calculate the corner points
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    // Get the width and height of the bounds in degrees
    const width = ne.lng() - sw.lng();
    const height = ne.lat() - sw.lat();
    
    // Calculate center points
    const center = bounds.getCenter();
    
    // Calculate edges with standard margins
    const topEdge = ne.lat() - topMarginDegrees;
    const leftEdge = sw.lng() + widthMarginDegrees;
    const rightEdge = ne.lng() - widthMarginDegrees;
    
    // Set vertical position to top for all alignments
    // (modules will always be placed from top to bottom)
    const startLat = topEdge;
    
    // Determine horizontal starting position based on alignment
    let startLng: number;
    
    console.log(`📐 Applying ${activeAlignment} alignment`);
    
    switch (activeAlignment) {
      case TableLayoutAlignment.Left:
        // Start from left edge (left aligned)
        startLng = leftEdge;
        console.log(`✓ Left alignment: Starting from left edge: ${startLng}`);
        break;
        
      case TableLayoutAlignment.Right:
        // Start from right edge (right aligned)
        startLng = rightEdge;
        console.log(`✓ Right alignment: Starting from right edge: ${startLng}`);
        break;
        
      case TableLayoutAlignment.Center:
        // Start from center
        startLng = center.lng();
        console.log(`✓ Center alignment: Starting from center: ${startLng}`);
        break;
        
      case TableLayoutAlignment.Justify:
        // For justify, use minimal margin to maximize coverage 
        // and start from the furthest left possible
        startLng = sw.lng() + (widthMarginDegrees * 0.25); // Use 75% less margin
        console.log(`✓ Justify alignment: Starting with minimal margin: ${startLng}`);
        break;
        
      default:
        // Default to center
        startLng = center.lng();
        console.log(`✓ Default (Center) alignment: ${startLng}`);
    }
    
    console.log(`Selected start point: ${startLat.toFixed(6)}, ${startLng.toFixed(6)}`);
    return { startLat, startLng };
  }, []);

  // Add a special force calculation function just for alignment changes - Moved after dependencies are defined
  const forceCalculationForAlignment = useCallback((newAlignment: TableLayoutAlignment) => {
    console.log(`🔄 FORCE calculation for alignment change to: ${newAlignment}`);
    
    // Update the current alignment ref
    currentAlignmentRef.current = newAlignment;
    prevAlignmentRef.current = newAlignment;
    
    // Clear any existing calculation timers
    if (calculationTimerRef.current !== null) {
      clearTimeout(calculationTimerRef.current);
      calculationTimerRef.current = null;
    }
    
    // Clear any chain break
    breakChainRef.current = false;
    consecutiveCalculationsRef.current = 0;
    
    // Always force calculation flag to true
    moduleCalculationPerformedRef.current = true;
    
    // Reset cache
    calculationResultCacheRef.current.key = "";
    
    // Force immediate calculation
      clearModuleRectangles();
    
    // Directly calculate modules without going through the throttling mechanism
    setTimeout(() => {
      console.log(`⚡ Executing forced calculation for alignment change to ${newAlignment}`);
      try {
        if (map && polygons.length > 0) {
          calculateModulesRef.current();
        }
      } catch (e) {
        console.error("Error in forced alignment calculation:", e);
      }
    }, 100); // Small delay to ensure state is updated
  }, [clearModuleRectangles, map, polygons]);

  // Improved alignment change detection - completely reworked
  useEffect(() => {
    console.log(`Current tableAlignment (prop): ${tableAlignment}, active alignment (ref): ${currentAlignmentRef.current}, previous: ${prevAlignmentRef.current}`);
    
    if (prevAlignmentRef.current !== currentAlignmentRef.current) {
      console.log(`⚠️ Alignment CHANGED from ${prevAlignmentRef.current} to ${currentAlignmentRef.current} - forcing recalculation`);
      
      // Store new value immediately
      prevAlignmentRef.current = currentAlignmentRef.current;
      
      // Set the flag for other code paths to detect
      alignmentChangeRef.current = true;
      
      // Force a direct calculation bypassing all throttling mechanisms
      if (polygons.length > 0) {
        forceCalculationForAlignment(currentAlignmentRef.current);
      }
    }
  }, [tableAlignment, forceCalculationForAlignment, polygons]);

  // Add a direct event listener for force recalculation events
  useEffect(() => {
    const handleForceRecalculation = (event: Event) => {
      const customEvent = event as CustomEvent;
      const alignment = customEvent.detail?.alignment;
      const isVerification = customEvent.detail?.isVerification;
      
      console.log(`🚨 Received force-module-recalculation event with alignment: ${alignment}${isVerification ? " (VERIFICATION)" : ""}`);
      
      if (alignment) {
        // Update the current alignment ref directly
        currentAlignmentRef.current = alignment;
        prevAlignmentRef.current = alignment;
        
        // Set the alignment change flag
        alignmentChangeRef.current = true;
      
        // Directly force a recalculation
        if (map && polygons.length > 0) {
          forceCalculationForAlignment(alignment);
        }
      }
    };
    
    // Add the event listener
    document.addEventListener('force-module-recalculation', handleForceRecalculation);
    
    // Clean up
    return () => {
      document.removeEventListener('force-module-recalculation', handleForceRecalculation);
    };
  }, [map, polygons, forceCalculationForAlignment]);

  // Ensure this function is defined BEFORE any useEffect uses it
  // Add direct azimuth handling as a dedicated priority function
  const handleAzimuthChangeImmediate = useCallback((newAzimuth: number) => {
    console.log(`🧭 DIRECT Azimuth change to ${newAzimuth}° - FORCED IMMEDIATE EXECUTION`);
    
    // Reset ALL throttling mechanisms to ensure this takes priority
    consecutiveCalculationsRef.current = 0;
    breakChainRef.current = false;
    alignmentChangeRef.current = true;
    lastTriggerTimeRef.current = 0;
    calculationInProgressRef.current = false;
    
    // Cancel any pending calculations
    if (calculationTimerRef.current) {
      clearTimeout(calculationTimerRef.current);
      calculationTimerRef.current = null;
    }
    
    if (chainBreakTimeoutRef.current) {
      clearTimeout(chainBreakTimeoutRef.current);
      chainBreakTimeoutRef.current = null;
    }
    
    if (calculationLockTimeoutRef.current) {
      clearTimeout(calculationLockTimeoutRef.current);
      calculationLockTimeoutRef.current = null;
    }
    
    // Calculate rotation angle (180° is south, our reference direction)
    const newRotationAngle = newAzimuth - 180;
    
    // Clear ALL existing modules immediately to ensure a fresh start
    clearModuleRectangles();
    
    // Force map refresh
    if (map) {
      google.maps.event.trigger(map, 'resize');
    }
    
    // Update angle state
    setRotationAngleDegrees(newRotationAngle);
    
    // Reset calculation flags
    moduleCalculationPerformedRef.current = true;
    calculationResultCacheRef.current.key = "";
    
    // Use direct execution - CRITICAL for responsiveness
    console.log("🔄 IMMEDIATE FORCE CALCULATION after azimuth change");
    if (calculateModulesRef.current) {
      try {
        calculateModulesRef.current();
      } catch (e) {
        console.error("Error in forced azimuth calculation:", e);
        calculationInProgressRef.current = false;
      }
    }
  }, [map, clearModuleRectangles]);

  // Modify the useEffect for polygon changes to use handleAzimuthChangeImmediate
  useEffect(() => {
    if (!map) return;

    // Get a unique key for the current set of polygons, including azimuth
    const polyIdList = polygons.map((p, index) => {
      const path = p.polygon.getPath();
      const vertices = path ? path.getLength() : 0;
      // Include azimuth in the polygon key to detect azimuth changes
      return `poly${index}:${path && vertices > 0 ? path.getAt(0).toUrlValue() : 'empty'}:${vertices}:${p.azimuth || 180}`;
    });
    
    console.log("Polygon Key:", polyIdList[0] || "no polygons");
    console.log("Polygon Count:", polygons.length);
    
    // Check if polygons have changed since last time
    if (polyIdListRef.current.toString() !== polyIdList.toString()) {
      // Check for azimuth changes and handle them with higher priority
      const azimuthChanged = polyIdListRef.current.length > 0 && 
                             polygons.length > 0 && 
                             polyIdListRef.current.some((oldId, index) => {
                               if (index >= polyIdList.length) return false;
                               const newId = polyIdList[index];
                               const oldAzimuth = parseInt(oldId.split(':')[3] || '180', 10);
                               const newAzimuth = parseInt(newId.split(':')[3] || '180', 10);
                               return oldAzimuth !== newAzimuth;
                             });
      
      if (azimuthChanged) {
        console.log("🧭 Polygon azimuth has changed in useEffect - treating as high priority");
        
        // Reset throttling mechanisms for azimuth changes
        consecutiveCalculationsRef.current = 0;
        breakChainRef.current = false;
        
        // Update the polygon ID list reference immediately
        polyIdListRef.current = [...polyIdList];
        
        // Find the new azimuth value (first changed polygon)
        for (let i = 0; i < Math.min(polyIdListRef.current.length, polyIdList.length); i++) {
          const oldId = polyIdListRef.current[i];
          const newId = polyIdList[i];
          const oldAzimuth = parseInt(oldId.split(':')[3] || '180', 10);
          const newAzimuth = parseInt(newId.split(':')[3] || '180', 10);
          
          if (oldAzimuth !== newAzimuth) {
            // Handle the azimuth change with the immediate handler to bypass throttling
            handleAzimuthChangeImmediate(newAzimuth);
            return; // Exit early after handling azimuth change
          }
        }
      }
      
      // Handle non-azimuth polygon changes normally
      // Update the ref with the new polygon ID list
      polyIdListRef.current = [...polyIdList];
      
      // Count valid polygons (with 3+ vertices)
      const validPolygonCount = polygons.filter(p => {
        const path = p.polygon.getPath();
        return path && path.getLength() >= 3;
      }).length;
      
      // Only trigger calculations if there are valid polygons and modules aren't placed yet
      if (validPolygonCount > 0 && placedModules === 0) {
        console.log("New polygons detected or no modules placed - scheduling calculation");
        
        // Trigger recalculation with standard timing
        setTimeout(() => {
          console.log("Executing initial polygon calculation");
          triggerModuleCalculation();
        }, 300);
      }
    }
    
    // Log the current tableAlignment for debugging
    console.log(`Current tableAlignment (prop): ${tableAlignment}, active alignment (ref): ${currentAlignmentRef.current}, previous: ${prevAlignmentRef.current}`);
  }, [map, polygons, placedModules, tableAlignment, clearModuleRectangles, triggerModuleCalculation, handleAzimuthChangeImmediate]);
  
  // Use azimuth directly from layoutParams
  useEffect(() => {
    if (layoutParams.azimuth !== undefined) {
      // Use our direct bypassing handler with immediate execution
      handleAzimuthChangeImmediate(layoutParams.azimuth);
    } else {
      // Default to south (no rotation)
      setRotationAngleDegrees(0);
    }
  }, [layoutParams.azimuth, handleAzimuthChangeImmediate]);

  return {
    moduleRectangles,
    capacityKw,
    placedModules,
    usedAreaM2,
    polygonConfigs,
    calculationTimerRef,
    triggerModuleCalculation,
    forceRedrawAllModules: clearModuleRectangles
  };
};

// --- Universal Azimuth Table Placement Helpers ---
// Project lat/lng to local XY (meters) aligned with azimuth
function latLngToLocalXY(latLng: google.maps.LatLng, center: google.maps.LatLng, rotationRad: number) {
  const latScale = 111320;
  const lngScale = 111320 * Math.cos(center.lat() * Math.PI / 180);
  const dx = (latLng.lng() - center.lng()) * lngScale;
  const dy = (latLng.lat() - center.lat()) * latScale;
  // Rotate by -rotationRad (so X axis is along azimuth)
  const x = dx * Math.cos(-rotationRad) - dy * Math.sin(-rotationRad);
  const y = dx * Math.sin(-rotationRad) + dy * Math.cos(-rotationRad);
  return { x, y };
}
// Project local XY (meters) back to lat/lng
function localXYToLatLng(x: number, y: number, center: google.maps.LatLng, rotationRad: number) {
  const dx = x * Math.cos(rotationRad) - y * Math.sin(rotationRad);
  const dy = x * Math.sin(rotationRad) + y * Math.cos(rotationRad);
  const latScale = 111320;
  const lngScale = 111320 * Math.cos(center.lat() * Math.PI / 180);
  const lat = center.lat() + (dy / latScale);
  const lng = center.lng() + (dx / lngScale);
  return new google.maps.LatLng(lat, lng);
}
