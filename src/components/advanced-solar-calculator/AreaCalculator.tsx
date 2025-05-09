import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import type { SolarPanel } from '@/types/components';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Map, Trash2, Square, Hexagon, StopCircle } from 'lucide-react'; 
import { toast } from 'sonner';

// Get the Google Maps API key and Map ID from environment variables
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const GOOGLE_MAPS_ID = import.meta.env.VITE_GOOGLE_MAPS_ID || '';

// Define libraries array for Google Maps
const libraries = ["geometry", "drawing"] as ("geometry" | "drawing" | "places" | "visualization")[];

interface AreaCalculatorProps {
  selectedPanel: SolarPanel;
  onCapacityCalculated: (capacityKw: number, areaM2: number, moduleCount: number, configs?: any[]) => void;
  latitude: number;
  longitude: number;
}

// PolygonConfig interface for the subsystems
interface PolygonConfig {
  id: number;
  area: number;
  azimuth: number;
  capacityKw: number;
  moduleCount: number;
  structureType: string;
  tiltAngle: number;
}

interface PolygonInfo {
  polygon: google.maps.Polygon;
  area: number;
  azimuth?: number; // Add azimuth property
}

interface EdgeMidpoint {
  polygonIndex: number;
  edgeIndex: number;
  position: google.maps.LatLngLiteral;
  heading: number; // Azimuth of the edge
}

// Layout parameters for different structure types
interface LayoutParameters {
  tiltAngle: number;
  orientation: 'portrait' | 'landscape';
  interRowSpacing: number; // in meters
  adjacentGap: number; // in mm
  // Ground Mount Table specific parameters
  tableConfig?: {
    rowsPerTable: number;
    modulesPerRow: number;
    interTableSpacingY: number; // distance between tables in Y axis (m)
    interTableSpacingX: number; // distance between tables in X axis (m)
  };
  // Carport specific parameters
  carportConfig?: {
    rows: number;           // Number of rows
    modulesPerRow: number;  // Modules per row
    forceRectangle: boolean; // Force rectangular shape
  };
}

// Default layout parameters
const DEFAULT_LAYOUT_PARAMS: Record<string, Omit<LayoutParameters, 'modulePerFrame'>> = {
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

const structureTypes = [
  { id: 'ballasted', name: 'Ballasted Flat Roof', groundCoverageRatio: 0.5 },
  { id: 'fixed_tilt', name: 'Fixed Tilt Ground Mount', groundCoverageRatio: 0.4 },
  { id: 'ground_mount_tables', name: 'Ground Mount Tables', groundCoverageRatio: 0.45 },
  { id: 'carport', name: 'Carport Structure', groundCoverageRatio: 0.7 },
];

const AreaCalculator: React.FC<AreaCalculatorProps> = ({ 
  selectedPanel, 
  onCapacityCalculated, 
  latitude, 
  longitude 
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [polygons, setPolygons] = useState<PolygonInfo[]>([]);
  const [totalArea, setTotalArea] = useState(0);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [totalModules, setTotalModules] = useState(0);
  const [polygonConfigs, setPolygonConfigs] = useState<PolygonConfig[]>([]);
  const [structureType, setStructureType] = useState(structureTypes[0]);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const [instructionsVisible, setInstructionsVisible] = useState(true);
  const calculationPendingRef = useRef(false);
  const [layoutParams, setLayoutParams] = useState<LayoutParameters>(DEFAULT_LAYOUT_PARAMS.ballasted);
  const [moduleCount, setModuleCount] = useState(0);
  const [placedModuleCount, setPlacedModuleCount] = useState(0);
  const moduleRectanglesRef = useRef<google.maps.Rectangle[]>([]);
  const midpointMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]); 
  const [selectedPolygonIndex, setSelectedPolygonIndex] = useState<number | null>(0);
  const [layoutAzimuth, setLayoutAzimuth] = useState<number>(180);
  const moduleCalculationPerformedRef = useRef(true);
  const [selectedMidpointIdx, setSelectedMidpointIdx] = useState<number | null>(null);
  const [placedModulesPerPolygon, setPlacedModulesPerPolygon] = useState<Record<number, number>>({});

  const mapRef = useRef<HTMLDivElement>(null);
  const mapContainerStyle = {
    width: '100%',
    height: '500px',
    borderRadius: '8px'
  };

  // Use the provided coordinates or fallback to New York
  const center = useMemo(() => ({ 
    lat: latitude || 40.7128, 
    lng: longitude || -74.0060 
  }), [latitude, longitude]);
  
  const zoom = 18; // Higher zoom level for better detail

  useEffect(() => {
    // Show a toast if API key is missing
    if (!GOOGLE_MAPS_API_KEY) {
      toast.error('Google Maps API key is missing. Please add it to your environment variables as VITE_GOOGLE_MAPS_API_KEY.');
    }
  }, []);

  // Define polygon draw options (memoized)
  const polygonDrawOptions = useMemo((): google.maps.PolygonOptions => ({ 
    fillColor: "#FF0000",
    fillOpacity: 0.30,
    strokeWeight: 1,
    strokeColor: "#FF0000",
    clickable: true, 
    editable: true,
    draggable: true,
    zIndex: 1
  }), []); // Empty dependency array means it's created once

  const onLoad = useCallback((googleMap: google.maps.Map) => {
    setMap(googleMap);
    console.log("Map loaded successfully");
    
    // Initialize drawing manager
    if (window.google && window.google.maps && window.google.maps.drawing) {
      try {
        const drawingManager = new window.google.maps.drawing.DrawingManager({
          drawingMode: null,
          drawingControl: true,
          drawingControlOptions: {
            position: window.google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [
              window.google.maps.drawing.OverlayType.POLYGON,
              window.google.maps.drawing.OverlayType.RECTANGLE
            ],
          },
          polygonOptions: polygonDrawOptions,
          rectangleOptions: { ...polygonDrawOptions }
        });
        
        drawingManager.setMap(googleMap);
        drawingManagerRef.current = drawingManager;
        
        // Add polygon complete listener
        window.google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
          console.log("Polygon completed");
          handlePolygonComplete(polygon);
        });
        
        // Add rectangle complete listener
        window.google.maps.event.addListener(drawingManager, 'rectanglecomplete', (rectangle: google.maps.Rectangle) => {
          console.log("Rectangle completed");
          handleRectangleComplete(rectangle);
        });

        // Keep drawing mode enabled after completing a shape
        google.maps.event.addListener(drawingManager, 'overlaycomplete', () => {
          // Keep the current drawing mode after shape completion
          drawingManager.setDrawingMode(null);
        });
      } catch (error) {
        console.error("Error initializing drawing manager:", error);
        toast.error("Failed to initialize drawing tools. Please refresh the page.");
      }
    }
  }, [polygonDrawOptions]);

  // Calculate area of a polygon
  const calculatePolygonArea = useCallback((polygon: google.maps.Polygon): number => {
    try {
      if (!window.google || !window.google.maps || !window.google.maps.geometry || !window.google.maps.geometry.spherical) {
        console.error("Google Maps geometry library not loaded");
        return 0;
      }
      
      const path = polygon.getPath();
      return window.google.maps.geometry.spherical.computeArea(path);
    } catch (error) {
      console.error("Error calculating area:", error);
      return 0;
    }
  }, []);

  // Handle clicking markers to set azimuth
  const handleMidpointClick = useCallback((midpoint: EdgeMidpoint, markerIndex: number) => {
    console.log(`Midpoint clicked: Polygon ${midpoint.polygonIndex}, Edge ${midpoint.edgeIndex}, Heading: ${midpoint.heading.toFixed(1)}`);
    
    // Update the azimuth for the specific polygon instead of the global azimuth
    setPolygons(prevPolygons => prevPolygons.map((poly, idx) => 
      idx === midpoint.polygonIndex 
        ? { ...poly, azimuth: midpoint.heading }
        : poly
    ));
    
    // Also update the global azimuth state for display purposes
    setLayoutAzimuth(midpoint.heading);
    
    // Update the selected polygon index
    setSelectedPolygonIndex(midpoint.polygonIndex);
    
    // Update the selected marker index for visual feedback
    setSelectedMidpointIdx(markerIndex);
    
    // Update the marker appearances to highlight the selected one
    if (window.google && window.google.maps && window.google.maps.marker) {
      midpointMarkersRef.current.forEach((marker, idx) => {
        if (idx === markerIndex) {
          // Selected marker - create a larger, highlighted pin
          const selectedPin = new google.maps.marker.PinElement({
            scale: 1.0,          // Larger scale
            background: '#FFCC00', // Brighter yellow
            borderColor: '#FF0000', // Red border
            glyphColor: '#000000'
          });
          marker.content = selectedPin.element;
        } else {
          // Regular markers - return to normal appearance
          const regularPin = new google.maps.marker.PinElement({
            scale: 0.7,
            background: '#FFFF00', // Yellow background
            borderColor: '#000000', // Black border
            glyphColor: '#000000'
          });
          marker.content = regularPin.element;
        }
      });
    }
    
    // Trigger module calculation after azimuth changes
    moduleCalculationPerformedRef.current = true;
  }, []);

  const handlePolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    // Calculate the area for this polygon
    const area = calculatePolygonArea(polygon);
    
    // Add the polygon to our state with default azimuth of 180°
    setPolygons(prev => [...prev, { polygon, area, azimuth: 180 }]);
    
    // Set up listeners for polygon changes
    setupPolygonListeners(polygon, prev => prev.length);
    
    // Switch drawing manager back to non-drawing mode
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
  }, [calculatePolygonArea]);
  
  const handleRectangleComplete = useCallback((rectangle: google.maps.Rectangle) => {
    const bounds = rectangle.getBounds();
    if (!bounds) {
      console.error("Rectangle bounds are undefined");
      return;
    }
    
    try {
      // Convert rectangle to polygon
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const nw = new google.maps.LatLng(ne.lat(), sw.lng());
      const se = new google.maps.LatLng(sw.lat(), ne.lng());
      
      // Create polygon path in clockwise order
      const path = [ne, se, sw, nw];
      
      // Create a polygon instead of using the rectangle directly
      const polygon = new window.google.maps.Polygon({
        paths: path,
        ...polygonDrawOptions,
        map: map
      });
      
      // Remove the rectangle
      rectangle.setMap(null);
      
      // Calculate the area
      const area = calculatePolygonArea(polygon);
      
      // Add the polygon to our state with default azimuth of 180°
      const newIndex = polygons.length;
      setPolygons(prev => [...prev, { polygon, area, azimuth: 180 }]);
      
      // Set up listeners for polygon changes
      setupPolygonListeners(polygon, newIndex);
      
      // Switch drawing manager back to non-drawing mode
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setDrawingMode(null);
      }
    } catch (error) {
      console.error("Error converting rectangle to polygon:", error);
    }
  }, [map, calculatePolygonArea, polygonDrawOptions, polygons.length]);
  
  const setupPolygonListeners = useCallback((polygon: google.maps.Polygon, index: number | ((prev: number) => number)) => {
    polygon.setOptions(polygonDrawOptions);
    const path = polygon.getPath();
    let updateTimeout: number | undefined;
    
    const updatePolygon = () => {
      // Use debounce to avoid excessive updates during drag/resize
      if (updateTimeout) {
        window.clearTimeout(updateTimeout);
      }
      
      updateTimeout = window.setTimeout(() => {
        const updatedArea = calculatePolygonArea(polygon);
        polygon.setOptions(polygonDrawOptions);
        
        // Update the specific polygon's area and trigger re-render which recalculates midpoints
        setPolygons(prevPolygons => 
          prevPolygons.map(poly => 
            poly.polygon === polygon ? { ...poly, area: updatedArea } : poly
          )
        );
        
        // Signal that module calculation should be performed
        moduleCalculationPerformedRef.current = true;
        
        updateTimeout = undefined;
      }, 200); // Debounce for 200ms
    };
    
    // Add click handler to select this polygon
    google.maps.event.addListener(polygon, 'click', () => {
      const polyIndex = typeof index === 'function' ? index(polygons.length) : index;
      console.log(`Polygon ${polyIndex} selected`);
      setSelectedPolygonIndex(polyIndex);
      
      // Update styling of polygons to highlight the selected one
      polygons.forEach((poly, idx) => {
        const options = {...polygonDrawOptions};
        if (idx === polyIndex) {
          options.fillColor = "#FF6600";
          options.strokeColor = "#FF6600";
          options.strokeWeight = 2;
        }
        poly.polygon.setOptions(options);
      });
    });
    
    google.maps.event.addListener(polygon, 'mouseup', updatePolygon);
    google.maps.event.addListener(polygon, 'dragend', updatePolygon);
    google.maps.event.addListener(path, 'set_at', updatePolygon);
    google.maps.event.addListener(path, 'insert_at', updatePolygon);
    google.maps.event.addListener(path, 'remove_at', updatePolygon);
    
  }, [calculatePolygonArea, polygonDrawOptions, polygons]);

  // Update layout parameters when structure type changes
  useEffect(() => {
    const defaultParams = DEFAULT_LAYOUT_PARAMS[structureType.id] || DEFAULT_LAYOUT_PARAMS.ballasted;
    
    // Preserve tableConfig if we're switching to ground_mount_tables and already have settings
    if (structureType.id === 'ground_mount_tables' && layoutParams.tableConfig) {
      setLayoutParams({
        ...defaultParams,
        tableConfig: layoutParams.tableConfig
      });
    } else {
      setLayoutParams(defaultParams);
    }
    
    // Signal that module calculation should be performed
    moduleCalculationPerformedRef.current = true;
  }, [structureType.id]);

  // Calculate total area, estimated module count, AND manage midpoint markers
  useEffect(() => {
    if (polygons.length === 0) {
      setTotalArea(0);
      setModuleCount(0);
      setPlacedModuleCount(0);
      setPolygonConfigs([]);
      onCapacityCalculated(0, 0, 0, []);
      return;
    }

    const calculatedTotalArea = polygons.reduce((sum, poly) => sum + poly.area, 0);
    setTotalArea(calculatedTotalArea);
    
    // Clear existing midpoint markers
    midpointMarkersRef.current.forEach(marker => {
      // AdvancedMarkerElement doesn't have setMap(null), set map property to null
      marker.map = null; 
    });
    midpointMarkersRef.current = [];
    
    // Only create new markers if we have map and valid polygons
    if (map && window.google && window.google.maps.geometry && window.google.maps.geometry.spherical && window.google.maps.marker) {
      const { spherical } = window.google.maps.geometry;
      const { PinElement } = window.google.maps.marker;
      const newMidpointMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
      
      // Process each polygon to create edge midpoint markers
      polygons.forEach((polyInfo, polygonIndex) => {
        const path = polyInfo.polygon.getPath();
        const pathLength = path.getLength();
        if (pathLength >= 2) {
          for (let i = 0; i < pathLength; i++) {
            const startPoint = path.getAt(i)!;
            const endPoint = path.getAt((i + 1) % pathLength)!;
            
            const midpointLatLng = new google.maps.LatLng(
              (startPoint.lat() + endPoint.lat()) / 2,
              (startPoint.lng() + endPoint.lng()) / 2
            );
            
            const heading = spherical.computeHeading(startPoint, endPoint);
            const normalizedHeading = (heading < 0) ? heading + 360 : heading;
            
            const solarAzimuth = (normalizedHeading + 90) % 360;
            const markerTooltip = `Set Azimuth (${solarAzimuth.toFixed(1)}°)`;
            
            const midpointData: EdgeMidpoint = {
              polygonIndex,
              edgeIndex: i,
              position: { lat: midpointLatLng.lat(), lng: midpointLatLng.lng() },
              heading: solarAzimuth
            };

            const polygonAzimuth = polyInfo.azimuth || 180;
            const isSelected = solarAzimuth === polygonAzimuth;
            const pin = new PinElement({
              scale: isSelected ? 1.2 : 0.7,  
              background: isSelected ? '#FFCC00' : '#FFFF00',
              borderColor: isSelected ? '#FF0000' : '#000000',
              glyphColor: '#000000'
            });

            const marker = new google.maps.marker.AdvancedMarkerElement({
              position: midpointData.position,
              map: map,
              content: pin.element,
              title: markerTooltip,
              zIndex: 3
            });

            const currentMarkerIndex = newMidpointMarkers.length;
            marker.addListener('gmp-click', () => handleMidpointClick(midpointData, currentMarkerIndex));
            
            newMidpointMarkers.push(marker);
            
            if (isSelected) {
              setSelectedMidpointIdx(currentMarkerIndex);
            }
          }
        }
      });
      
      midpointMarkersRef.current = newMidpointMarkers;
    }

    // Clear existing module rectangles from map and ref
    moduleRectanglesRef.current.forEach(rect => rect.setMap(null));
    moduleRectanglesRef.current = [];
    setPlacedModuleCount(0);
    
    // Calculate theoretical module counts just for display
    if (calculatedTotalArea > 0 && selectedPanel) {
      // Fix: Check if length and width are numbers or undefined, and provide fallbacks
      const panelLength = typeof selectedPanel.length === 'number' ? selectedPanel.length : 1700;
      const panelWidth = typeof selectedPanel.width === 'number' ? selectedPanel.width : 1000;
      
      const moduleArea = (panelLength * panelWidth) / 1000000; // m²
      const gcr = structureType.groundCoverageRatio;
      const calculatedModuleCount = Math.floor((calculatedTotalArea * gcr) / moduleArea);
      
      setModuleCount(calculatedModuleCount);
      // We'll let the module placement effect handle calling onCapacityCalculated
    }
    
    // Signal that module calculation should be performed
    moduleCalculationPerformedRef.current = true;
  }, [polygons, map, selectedPanel, structureType.groundCoverageRatio, handleMidpointClick, onCapacityCalculated]);

  // Calculate and draw module layout effect (real azimuth-aware logic)
  useEffect(() => {
    if (!moduleCalculationPerformedRef.current) {
      return;
    }
    
    // Clear previous modules
    moduleRectanglesRef.current.forEach(rect => rect.setMap(null));
    moduleRectanglesRef.current = [];
    let currentPlacedCount = 0;
    
    // Initialize placed modules per polygon
    const modulesPerPolygon: Record<number, number> = {};

    if (
      polygons.length === 0 ||
      !selectedPanel ||
      moduleCount === 0 ||
      !map ||
      !window.google ||
      !window.google.maps.geometry ||
      !window.google.maps.geometry.spherical ||
      !window.google.maps.geometry.poly
    ) {
      setPlacedModuleCount(0);
      setPlacedModulesPerPolygon({});
      moduleCalculationPerformedRef.current = false;
      return;
    }

    const { spherical } = window.google.maps.geometry;
    const polyUtil = window.google.maps.geometry.poly;

    // Module dimensions (meters)
    // Fix: Check if length and width are numbers or undefined, and provide fallbacks
    const panelLength = typeof selectedPanel.length === 'number' ? selectedPanel.length : 1700;
    const panelWidth = typeof selectedPanel.width === 'number' ? selectedPanel.width : 1000;
    
    const panelLengthM = panelLength / 1000;
    const panelWidthM = panelWidth / 1000;
    
    const adjacentGapM = layoutParams.adjacentGap / 1000;
    const moduleDim = layoutParams.orientation === 'landscape'
      ? { width: panelLengthM, height: panelWidthM }
      : { width: panelWidthM, height: panelLengthM };
    const moduleWidthWithGap = moduleDim.width + adjacentGapM;
    
    // Row spacing depends on the structure type
    let effectiveRowSpacing = moduleDim.height + layoutParams.interRowSpacing;
    
    // For ground mount tables
    const isGroundMountTable = structureType.id === 'ground_mount_tables';
    const tableConfig = layoutParams.tableConfig || DEFAULT_LAYOUT_PARAMS.ground_mount_tables.tableConfig;
    
    // For carport structures
    const isCarport = structureType.id === 'carport';
    const carportConfig = layoutParams.carportConfig || DEFAULT_LAYOUT_PARAMS.carport.carportConfig;
    
    // Table dimensions for ground mount
    let tableWidth = 0;
    let tableHeight = 0;
    let modulesPerTable = 0;
    
    // Carport dimensions
    let carportWidth = 0;
    let carportHeight = 0;
    let modulesPerCarport = 0;
    
    if (isGroundMountTable && tableConfig) {
      const rowsPerTable = tableConfig.rowsPerTable;
      const modulesPerRow = tableConfig.modulesPerRow;
      const intraTableRowSpacing = layoutParams.interRowSpacing; // spacing between rows within a table
      
      // Calculate table dimensions - ensure correct formula
      tableWidth = modulesPerRow * moduleWidthWithGap;
      
      // For a 3-row table, we need 2 spaces between rows
      tableHeight = (rowsPerTable * moduleDim.height) + ((rowsPerTable - 1) * intraTableRowSpacing);
      
      modulesPerTable = rowsPerTable * modulesPerRow;
      
      // For ground mount tables, the effective row spacing is the distance between tables
      effectiveRowSpacing = tableHeight + (tableConfig.interTableSpacingY || 0);
    } else if (isCarport && carportConfig) {
      const rows = carportConfig.rows;
      const modulesPerRow = carportConfig.modulesPerRow;
      const intraRowSpacing = 0; // Force zero spacing between rows for carports
      
      // Calculate carport dimensions with zero spacing between rows
      carportWidth = modulesPerRow * moduleWidthWithGap;
      carportHeight = rows * moduleDim.height; // No spacing between rows for carports
      
      modulesPerCarport = rows * modulesPerRow;
      
      // Carport uses a specific row spacing
      effectiveRowSpacing = carportHeight * 1.2; // Add 20% buffer between carports
    }

    // --- Process each polygon --- 
    for (const [polyIndex, polyInfo] of polygons.entries()) {
      if (currentPlacedCount >= moduleCount) break;
      
      // Initialize counter for this polygon
      modulesPerPolygon[polyIndex] = 0;
      
      // Use polygon-specific azimuth instead of global azimuth
      const polygonAzimuth = polyInfo.azimuth || 180; // Default to 180 if not set
      
      const polygon = polyInfo.polygon;
      const path = polygon.getPath();
      if (path.getLength() < 3) continue;

      // --- Calculate polygon centroid --- 
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
      
      // Check if centroid is actually inside the polygon
      let startPoint = centroid;
      
      if (!polyUtil.containsLocation(centroid, polygon)) {
        // Fall back to first vertex - adjust slightly inward
        const firstVertex = path.getAt(0)!;
        const secondVertex = path.getAt(1)!;
        // Move ~10% inward from first vertex toward second
        const fallbackPoint = spherical.interpolate(firstVertex, secondVertex, 0.1);
        
        if (polyUtil.containsLocation(fallbackPoint, polygon)) {
          startPoint = fallbackPoint;
        } else {
          continue; // Skip this polygon if we can't find a valid starting point
        }
      }

      // 2. Determine Grid Iteration Parameters
      const rowHeading = polygonAzimuth;
      const colHeading = ((polygonAzimuth + 90) % 360);

      // Calculate bounding box to determine search distance
      const bounds = new google.maps.LatLngBounds();
      path.forEach(latLng => bounds.extend(latLng));
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      
      // Maximum distance to search (diagonal of bounding box × 1.2 for safety)
      const maxSearchDistance = spherical.computeDistanceBetween(sw, ne) * 1.2;
      const rowDirections = [rowHeading, (rowHeading + 180) % 360]; // Forward and backward along rowHeading
      const colDirections = [colHeading, (colHeading + 180) % 360]; // Forward and backward along colHeading
      
      const MAX_ITERATIONS = 5000; // Safety limit
      let iterations = 0;
      
      // Keep track of placed modules to prevent overlap
      const placedModuleCenters: google.maps.LatLng[] = [];
      const placedModuleDistance = Math.min(moduleWidthWithGap, effectiveRowSpacing) * 0.85;
      
      // Utility function to check if a new point is too close to any existing placed module
      const isTooCloseToExistingModule = (point: google.maps.LatLng): boolean => {
        for (const existingCenter of placedModuleCenters) {
          if (spherical.computeDistanceBetween(point, existingCenter) < placedModuleDistance) {
            return true;
          }
        }
        return false;
      };
      
      // For each "quadrant" of the spiral
      for (const rowDirection of rowDirections) {
        if (currentPlacedCount >= moduleCount) break;
        
        let rowStart = startPoint;
        let rowNum = 0;
        let rowDistance = 0;
        
        // Spiral out row by row
        while (iterations < MAX_ITERATIONS && 
               currentPlacedCount < moduleCount && 
               rowDistance < maxSearchDistance) {
          
          for (const colDirection of colDirections) {
            if (currentPlacedCount >= moduleCount) break;
            
            let currentCenter = rowStart;
            let colNum = 0;
            let colDistance = 0;
            
            // Move along column in current direction
            while (iterations < MAX_ITERATIONS && 
                   currentPlacedCount < moduleCount && 
                   colDistance < maxSearchDistance) {
              
              iterations++;
              
              // For ground mount table mode, we place entire tables instead of individual modules
              if (isGroundMountTable && tableConfig) {
                // Check if table center is inside polygon
                const isInside = polyUtil.containsLocation(currentCenter, polygon);
                
                if (isInside && !isTooCloseToExistingModule(currentCenter)) {
                  // Check if the entire table fits inside the polygon
                  const rowsPerTable = tableConfig.rowsPerTable;
                  const modulesPerRow = tableConfig.modulesPerRow;
                  const intraRowSpacing = layoutParams.interRowSpacing;
                  
                  // Collect all module positions for this table
                  const allCorners: google.maps.LatLng[] = [];
                  const allModuleCenters: google.maps.LatLng[] = [];
                  let tableCorners: google.maps.LatLng[] = [];
                  
                  // First, calculate the table corners to check if it fits
                  const halfTableWidth = tableWidth / 2;
                  const halfTableHeight = tableHeight / 2;
                  
                  // Calculate the 4 corners of the table
                  const tableBearing = rowHeading;
                  
                  // Calculate table corner coordinates
                  const tableCornerDist = Math.sqrt(halfTableWidth**2 + halfTableHeight**2);
                  const tableAngleOffset = Math.atan2(halfTableWidth, halfTableHeight) * (180 / Math.PI);
                  
                  // Use precise trig functions for all angle calculations, normalize to 0-360 range
                  const normalizeAngle = (angle: number): number => ((angle % 360) + 360) % 360;
                  
                  // Calculate corner headings for the table
                  const tableNEHeading = normalizeAngle(tableBearing - tableAngleOffset);
                  const tableSEHeading = normalizeAngle(tableBearing + tableAngleOffset);
                  const tableNWHeading = normalizeAngle(tableBearing - tableAngleOffset + 180);
                  const tableSWHeading = normalizeAngle(tableBearing + tableAngleOffset + 180);
                  
                  // Calculate table corners using spherical offset from center
                  const tableNE = spherical.computeOffset(currentCenter, tableCornerDist, tableNEHeading);
                  const tableSE = spherical.computeOffset(currentCenter, tableCornerDist, tableSEHeading);
                  const tableNW = spherical.computeOffset(currentCenter, tableCornerDist, tableNWHeading);
                  const tableSW = spherical.computeOffset(currentCenter, tableCornerDist, tableSWHeading);
                  
                  // Store corners in clockwise order for proper polygon drawing
                  tableCorners = [tableNE, tableSE, tableSW, tableNW];
                  
                  // Check if all table corners are inside the polygon
                  const tableInsidePolygon = tableCorners.every(corner => 
                    polyUtil.containsLocation(corner, polygon)
                  );
                  
                  if (tableInsidePolygon) {
                    // Now place all modules within the table
                    for (let row = 0; row < rowsPerTable; row++) {
                      // Calculate the normalized position of this row within the table
                      // This gives: -1 for first row, 0 for middle row, 1 for last row (in a 3-row table)
                      const rowPosition = row - (rowsPerTable - 1) / 2;
                      
                      // Calculate the offset from the table center to this row
                      // For middle row, offset should be 0
                      const rowOffset = rowPosition * (moduleDim.height + intraRowSpacing);
                      
                      // Calculate the center of this row
                      const rowCenter = spherical.computeOffset(
                        currentCenter,
                        Math.abs(rowOffset),
                        rowOffset < 0 ? (tableBearing + 180) % 360 : tableBearing
                      );

                      // Place modules in this row
                      for (let col = 0; col < modulesPerRow; col++) {
                        // Calculate horizontal offset from row center for this module
                        const colPosition = col - (modulesPerRow - 1) / 2;
                        const colOffset = colPosition * moduleWidthWithGap;
                        
                        // Calculate module center position
                        const moduleCenter = spherical.computeOffset(
                          rowCenter,
                          Math.abs(colOffset), // Distance is always positive
                          // Direction depends on sign of offset
                          colOffset < 0 ? (tableBearing + 270) % 360 : (tableBearing + 90) % 360
                        );
                        
                        // Calculate the 4 corners of the module
                        const halfWidth = moduleDim.width / 2;
                        const halfHeight = moduleDim.height / 2;
                        
                        // Use proper angle-based approach to calculate module corners at any azimuth
                        const centerToCornerDist = Math.sqrt(halfWidth**2 + halfHeight**2);
                        const angleOffset = Math.atan2(halfWidth, halfHeight) * (180 / Math.PI);

                        // Use the same normalization function as with tables
                        // Calculate corner headings using normalized angles
                        const moduleNEHeading = normalizeAngle(tableBearing - angleOffset);
                        const moduleSEHeading = normalizeAngle(tableBearing + angleOffset);
                        const moduleNWHeading = normalizeAngle(tableBearing - angleOffset + 180);
                        const moduleSWHeading = normalizeAngle(tableBearing + angleOffset + 180);

                        // Calculate corners with proper angles to avoid distortion
                        const moduleNE = spherical.computeOffset(moduleCenter, centerToCornerDist, moduleNEHeading);
                        const moduleSE = spherical.computeOffset(moduleCenter, centerToCornerDist, moduleSEHeading);
                        const moduleNW = spherical.computeOffset(moduleCenter, centerToCornerDist, moduleNWHeading);
                        const moduleSW = spherical.computeOffset(moduleCenter, centerToCornerDist, moduleSWHeading);
                        
                        // Store all corners for this module in clockwise order (same as tables)
                        allCorners.push(moduleNE, moduleSE, moduleSW, moduleNW);
                        allModuleCenters.push(moduleCenter);
                      }
                    }
                    
                    // Verify that all module corners are also inside the polygon
                    const allCornersInside = allCorners.every(corner => 
                      polyUtil.containsLocation(corner, polygon)
                    );
                    
                    if (allCornersInside) {
                      // Place all modules in the table
                      allModuleCenters.forEach((moduleCenter) => {
                        // Calculate the 4 corners of this module
                        const halfWidth = moduleDim.width / 2;
                        const halfHeight = moduleDim.height / 2;
                        
                        // Use proper angle-based approach to calculate module corners at any azimuth
                        const centerToCornerDist = Math.sqrt(halfWidth**2 + halfHeight**2);
                        const angleOffset = Math.atan2(halfWidth, halfHeight) * (180 / Math.PI);

                        // Use the same normalization function as with tables
                        // Calculate corner headings using normalized angles
                        const moduleNEHeading = normalizeAngle(tableBearing - angleOffset);
                        const moduleSEHeading = normalizeAngle(tableBearing + angleOffset);
                        const moduleNWHeading = normalizeAngle(tableBearing - angleOffset + 180);
                        const moduleSWHeading = normalizeAngle(tableBearing + angleOffset + 180);

                        // Calculate corners with proper angles to avoid distortion
                        const moduleNE = spherical.computeOffset(moduleCenter, centerToCornerDist, moduleNEHeading);
                        const moduleSE = spherical.computeOffset(moduleCenter, centerToCornerDist, moduleSEHeading);
                        const moduleNW = spherical.computeOffset(moduleCenter, centerToCornerDist, moduleNWHeading);
                        const moduleSW = spherical.computeOffset(moduleCenter, centerToCornerDist, moduleSWHeading);
                        
                        // Create bounds for this module with correct corner ordering
                        const boundsLiteral = new google.maps.LatLngBounds();
                        // Add all corners to create a proper bounding box
                        boundsLiteral.extend(moduleNE);
                        boundsLiteral.extend(moduleSE);
                        boundsLiteral.extend(moduleSW);
                        boundsLiteral.extend(moduleNW);
                        
                        // Create rectangle for this module
                        const rectangle = new window.google.maps.Rectangle({
                          strokeColor: '#003366',
                          strokeOpacity: 0.8,
                          strokeWeight: 1,
                          fillColor: '#3399FF',
                          fillOpacity: 0.6,
                          clickable: false,
                          draggable: false,
                          editable: false,
                          zIndex: 2,
                          bounds: boundsLiteral,
                          map: map,
                        });
                        
                        moduleRectanglesRef.current.push(rectangle);
                        
                        // Add module center to placed modules
                        placedModuleCenters.push(moduleCenter);
                        
                        // Increment counters
                        currentPlacedCount++;
                        modulesPerPolygon[polyIndex]++;
                        
                        if (currentPlacedCount >= moduleCount) return;
                      });
                      
                      // Draw table outline
                      const tablePolygon = new window.google.maps.Polygon({
                        paths: tableCorners,
                        strokeColor: '#FF0000',
                        strokeOpacity: 0.8,  // Increased from 0.5
                        strokeWeight: 2,     // Increased from 1
                        fillColor: '#FF0000',
                        fillOpacity: 0.05,
                        clickable: false,
                        map: map,
                      });
                      
                      // Store the table outline polygon as a rectangle (for cleanup purposes)
                      moduleRectanglesRef.current.push(tablePolygon as unknown as google.maps.Rectangle);
                    }
                  }
                }
                
                // Calculate distance to next table center
                const tableSpacingX = tableWidth + (tableConfig.interTableSpacingX || 0.5);
                const nextCenter = spherical.computeOffset(currentCenter, tableSpacingX, colDirection);
                if (!nextCenter) break;
                
                currentCenter = nextCenter;
                colNum++;
                colDistance += tableSpacingX;
              }
              // For carport structures, we place modules in a rectangular grid arrangement
              else if (isCarport && carportConfig) {
                // Check if carport center is inside polygon
                const isInside = polyUtil.containsLocation(currentCenter, polygon);
                
                if (isInside && !isTooCloseToExistingModule(currentCenter)) {
                  // Check if the entire carport fits inside the polygon
                  const rows = carportConfig.rows;
                  const modulesPerRow = carportConfig.modulesPerRow;
                  
                  // Collect all module positions for this carport
                  const allCorners: google.maps.LatLng[] = [];
                  const allModuleCenters: google.maps.LatLng[] = [];
                  let carportCorners: google.maps.LatLng[] = [];
                  
                  // First, calculate the carport corners to check if it fits
                  const halfCarportWidth = carportWidth / 2;
                  const halfCarportHeight = carportHeight / 2;
                  
                  // Calculate the 4 corners of the carport
                  const carportBearing = rowHeading;
                  
                  // Calculate carport corner coordinates
                  const carportCornerDist = Math.sqrt(halfCarportWidth**2 + halfCarportHeight**2);
                  const carportAngleOffset = Math.atan2(halfCarportWidth, halfCarportHeight) * (180 / Math.PI);
                  
                  // Use precise trig functions for all angle calculations, normalize to 0-360 range
                  const normalizeAngle = (angle: number): number => ((angle % 360) + 360) % 360;
                  
                  // Calculate corner headings for the carport
                  const carportNEHeading = normalizeAngle(carportBearing - carportAngleOffset);
                  const carportSEHeading = normalizeAngle(carportBearing + carportAngleOffset);
                  const carportNWHeading = normalizeAngle(carportBearing - carportAngleOffset + 180);
                  const carportSWHeading = normalizeAngle(carportBearing + carportAngleOffset + 180);
                  
                  // Calculate carport corners using spherical offset from center
                  const carportNE = spherical.computeOffset(currentCenter, carportCornerDist, carportNEHeading);
                  const carportSE = spherical.computeOffset(currentCenter, carportCornerDist, carportSEHeading);
                  const carportNW = spherical.computeOffset(currentCenter, carportCornerDist, carportNWHeading);
                  const carportSW = spherical.computeOffset(currentCenter, carportCornerDist, carportSWHeading);
                  
                  // Store corners in clockwise order for proper polygon drawing
                  carportCorners = [carportNE, carportSE, carportSW, carportNW];
                  
                  // Check if all carport corners are inside the polygon
                  const carportInsidePolygon = carportCorners.every(corner => 
                    polyUtil.containsLocation(corner, polygon)
                  );
                  
                  if (carportInsidePolygon) {
                    // Now place all modules within the carport
                    for (let row = 0; row < rows; row++) {
                      // Calculate the normalized position of this row within the carport
                      const rowPosition = row - (rows - 1) / 2;
                      
                      // Calculate the offset from the carport center to this row
                      const rowOffset = rowPosition * moduleDim.height;
                      
                      // Calculate the center of this row
                      const rowCenter = spherical.computeOffset(
                        currentCenter,
                        Math.abs(rowOffset),
                        rowOffset < 0 ? (carportBearing + 180) % 360 : carportBearing
                      );

                      // Place modules in this row
                      for (let col = 0; col < modulesPerRow; col++) {
                        // Calculate horizontal offset from row center for this module
                        const colPosition = col - (modulesPerRow - 1) / 2;
                        const colOffset = colPosition * moduleWidthWithGap;
                        
                        // Calculate module center position
                        const moduleCenter = spherical.computeOffset(
                          rowCenter,
                          Math.abs(colOffset), // Distance is always positive
                          // Direction depends on sign of offset
                          colOffset < 0 ? (carportBearing + 270) % 360 : (carportBearing + 90) % 360
                        );
                        
                        // Calculate the 4 corners of the module
                        const halfWidth = moduleDim.width / 2;
                        const halfHeight = moduleDim.height / 2;
                        
                        // Use proper angle-based approach to calculate module corners at any azimuth
                        const centerToCornerDist = Math.sqrt(halfWidth**2 + halfHeight**2);
                        const angleOffset = Math.atan2(halfWidth, halfHeight) * (180 / Math.PI);

                        // Calculate corner headings using normalized angles
                        const moduleNEHeading = normalizeAngle(carportBearing - angleOffset);
                        const moduleSEHeading = normalizeAngle(carportBearing + angleOffset);
                        const moduleNWHeading = normalizeAngle(carportBearing - angleOffset + 180);
                        const moduleSWHeading = normalizeAngle(carportBearing + angleOffset + 180);

                        // Calculate corners with proper angles to avoid distortion
                        const moduleNE = spherical.computeOffset(moduleCenter, centerToCornerDist, moduleNEHeading);
                        const moduleSE = spherical.computeOffset(moduleCenter, centerToCornerDist, moduleSEHeading);
                        const moduleNW = spherical.computeOffset(moduleCenter, centerToCornerDist, moduleNWHeading);
                        const moduleSW = spherical.computeOffset(moduleCenter, centerToCornerDist, moduleSWHeading);
                        
                        // Store all corners for this module in clockwise order
                        allCorners.push(moduleNE, moduleSE, moduleSW, moduleNW);
                        allModuleCenters.push(moduleCenter);
                      }
                    }
                    
                    // Verify that all module corners are also inside the polygon
                    const allCornersInside = allCorners.every(corner => 
                      polyUtil.containsLocation(corner, polygon)
                    );
                    
                    if (allCornersInside) {
                      // Place all modules in the carport
                      allModuleCenters.forEach((moduleCenter) => {
                        // Calculate the 4 corners of this module
                        const halfWidth = moduleDim.width / 2;
                        const halfHeight = moduleDim.height / 2;
                        
                        // Use proper angle-based approach to calculate module corners at any azimuth
                        const centerToCornerDist = Math.sqrt(halfWidth**2 + halfHeight**2);
                        const angleOffset = Math.atan2(halfWidth, halfHeight) * (180 / Math.PI);

                        // Calculate corner headings using normalized angles
                        const moduleNEHeading = normalizeAngle(carportBearing - angleOffset);
                        const moduleSEHeading = normalizeAngle(carportBearing + angleOffset);
                        const moduleNWHeading = normalizeAngle(carportBearing - angleOffset + 180);
                        const moduleSWHeading = normalizeAngle(carportBearing + angleOffset + 180);

                        // Calculate corners with proper angles to avoid distortion
                        const moduleNE = spherical.computeOffset(moduleCenter, centerToCornerDist, moduleNEHeading);
                        const moduleSE = spherical.computeOffset(moduleCenter, centerToCornerDist, moduleSEHeading);
                        const moduleNW = spherical.computeOffset(moduleCenter, centerToCornerDist, moduleNWHeading);
                        const moduleSW = spherical.computeOffset(moduleCenter, centerToCornerDist, moduleSWHeading);
                        
                        // Create bounds for this module with correct corner ordering
                        const boundsLiteral = new google.maps.LatLngBounds();
                        // Add all corners to create a proper bounding box
                        boundsLiteral.extend(moduleNE);
                        boundsLiteral.extend(moduleSE);
                        boundsLiteral.extend(moduleSW);
                        boundsLiteral.extend(moduleNW);
                        
                        // Create rectangle for this module
                        const rectangle = new window.google.maps.Rectangle({
                          strokeColor: '#003366',
                          strokeOpacity: 0.8,
                          strokeWeight: 1,
                          fillColor: '#3399FF',
                          fillOpacity: 0.7, // Slightly more opaque for carport modules
                          clickable: false,
                          draggable: false,
                          editable: false,
                          zIndex: 2,
                          bounds: boundsLiteral,
                          map: map,
                        });
                        
                        moduleRectanglesRef.current.push(rectangle);
                        
                        // Add module center to placed modules
                        placedModuleCenters.push(moduleCenter);
                        
                        // Increment counters
                        currentPlacedCount++;
                        modulesPerPolygon[polyIndex]++;
                        
                        if (currentPlacedCount >= moduleCount) return;
                      });
                      
                      // Draw carport outline
                      const carportPolygon = new window.google.maps.Polygon({
                        paths: carportCorners,
                        strokeColor: '#4B0082', // Indigo for carport
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: '#4B0082',
                        fillOpacity: 0.1,
                        clickable: false,
                        map: map,
                      });
                      
                      // Store the carport outline polygon for cleanup
                      moduleRectanglesRef.current.push(carportPolygon as unknown as google.maps.Rectangle);
                    }
                  }
                }
                
                // Calculate distance to next carport center
                const carportSpacingX = carportWidth * 1.05; // Add 5% spacing between carports
                const nextCenter = spherical.computeOffset(currentCenter, carportSpacingX, colDirection);
                if (!nextCenter) break;
                
                currentCenter = nextCenter;
                colNum++;
                colDistance += carportSpacingX;
              }
              // Regular module placement for other structure types
              else {
                // Check if center is inside polygon
                const isInside = polyUtil.containsLocation(currentCenter, polygon);
                
                if (isInside && !isTooCloseToExistingModule(currentCenter)) {
                  // Calculate module corners based on the specific polygon's azimuth
                  const halfWidth = moduleDim.width / 2;
                  const halfHeight = moduleDim.height / 2;
                  const centerToCornerDist = Math.sqrt(halfWidth**2 + halfHeight**2);
                  const angleOffset = Math.atan2(halfWidth, halfHeight) * (180 / Math.PI);

                  // Use polygon-specific azimuth for corner calculations
                  const normalizeAngle = (angle: number): number => ((angle % 360) + 360) % 360;
                  const northEastHeading = normalizeAngle(rowHeading - angleOffset);
                  const southEastHeading = normalizeAngle(rowHeading + angleOffset);
                  const northWestHeading = normalizeAngle(rowHeading - angleOffset + 180);
                  const southWestHeading = normalizeAngle(rowHeading + angleOffset + 180);

                  const moduleNE = spherical.computeOffset(currentCenter, centerToCornerDist, northEastHeading);
                  const moduleSE = spherical.computeOffset(currentCenter, centerToCornerDist, southEastHeading);
                  const moduleNW = spherical.computeOffset(currentCenter, centerToCornerDist, northWestHeading);
                  const moduleSW = spherical.computeOffset(currentCenter, centerToCornerDist, southWestHeading);

                  // Verify all 4 corners are inside the polygon - strict containment check
                  const allCornersInside = moduleNE && moduleSE && moduleNW && moduleSW &&
                     polyUtil.containsLocation(moduleNE, polygon) &&
                     polyUtil.containsLocation(moduleSE, polygon) &&
                     polyUtil.containsLocation(moduleNW, polygon) &&
                     polyUtil.containsLocation(moduleSW, polygon);
                  
                  if (allCornersInside) {
                    // Place module centered at currentCenter
                    const boundsLiteral = new google.maps.LatLngBounds();
                    boundsLiteral.extend(moduleNE);
                    boundsLiteral.extend(moduleSE);
                    boundsLiteral.extend(moduleNW);
                    boundsLiteral.extend(moduleSW);

                    const rectangle = new google.maps.Rectangle({
                      strokeColor: '#003366',
                      strokeOpacity: 0.8,
                      strokeWeight: 1,
                      fillColor: '#3399FF',
                      fillOpacity: 0.6,
                      clickable: false,
                      draggable: false,
                      editable: false,
                      zIndex: 2,
                      bounds: boundsLiteral,
                      map: map,
                    });
                    moduleRectanglesRef.current.push(rectangle);
                    currentPlacedCount++;
                    
                    // Increment modules for this polygon
                    modulesPerPolygon[polyIndex]++;
                    
                    // Add this module center to the placed modules list
                    placedModuleCenters.push(currentCenter);
                    
                    if (currentPlacedCount >= moduleCount) break;
                  }
                }
                
                // Move to next position in column
                const nextCenter = spherical.computeOffset(currentCenter, moduleWidthWithGap, colDirection);
                if (!nextCenter) break;
                
                currentCenter = nextCenter;
                colNum++;
                colDistance += moduleWidthWithGap;
              }
            } // End column loop
          } // End column directions loop
          
          // Move to next row
          const nextRowStart = spherical.computeOffset(rowStart, effectiveRowSpacing, rowDirection);
          if (!nextRowStart) break;
          
          rowStart = nextRowStart;
          rowNum++;
          rowDistance += effectiveRowSpacing;
        } // End row loop
      } // End row directions loop
    } // End polygon loop

    // Mark the calculation as complete
    moduleCalculationPerformedRef.current = false;
    
    // After calculation is done, update state with results
    setPlacedModuleCount(currentPlacedCount);
    setPlacedModulesPerPolygon(modulesPerPolygon);
    
    // Generate updated polygon configs based on actual placed modules
    if (currentPlacedCount > 0 && selectedPanel) {
      const updatedPolygonConfigs: PolygonConfig[] = [];
      
      polygons.forEach((poly, index) => {
        const placedModules = modulesPerPolygon[index] || 0;
        const capacityKw = (placedModules * selectedPanel.power_rating) / 1000;
        
        updatedPolygonConfigs.push({
          id: index,
          area: poly.area,
          azimuth: poly.azimuth || 180,
          moduleCount: placedModules,
          capacityKw: capacityKw,
          structureType: structureType.id,
          tiltAngle: layoutParams.tiltAngle
        });
      });
      
      // Calculate total capacity from actual placed modules
      const totalCapacityKw = updatedPolygonConfigs.reduce((sum, config) => sum + config.capacityKw, 0);
      
      setTotalCapacity(totalCapacityKw);
      setPolygonConfigs(updatedPolygonConfigs);
      
      // Update parent component with actual placed module count and capacity
      onCapacityCalculated(totalCapacityKw, totalArea, currentPlacedCount, updatedPolygonConfigs);
    }
  }, [polygons, selectedPanel, layoutParams, moduleCount, totalArea, structureType.id, map, onCapacityCalculated]);

  // Start drawing mode with the drawing manager
  const startDrawingPolygon = () => {
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    }
  };
  
  // Start drawing rectangle with the drawing manager
  const startDrawingRectangle = () => {
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
    }
  };

  // Clear all polygons
  const clearAllPolygons = useCallback(() => {
    polygons.forEach(({ polygon }) => {
      polygon.setMap(null);
    });
    
    // Clear module rectangles
    moduleRectanglesRef.current.forEach(rect => rect.setMap(null));
    moduleRectanglesRef.current = [];
    
    // Clear midpoint markers
    midpointMarkersRef.current.forEach(marker => {
      marker.map = null; // Clear markers by setting map to null
    }); 
    midpointMarkersRef.current = [];
    
    setPolygons([]);
    setTotalArea(0);
    setTotalCapacity(0);
    setTotalModules(0);
    setModuleCount(0);
    setPlacedModuleCount(0);
    setPlacedModulesPerPolygon({});
    setPolygonConfigs([]);
    
    onCapacityCalculated(0, 0, 0, []);
    
    // Reset drawing mode
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
  }, [polygons, onCapacityCalculated]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Define PV Installation Areas
        </h2>
        
        <div className="flex gap-2">
          {instructionsVisible ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setInstructionsVisible(false)}
              className="text-xs"
            >
              Hide Instructions
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setInstructionsVisible(true)}
              className="text-xs"
            >
              Show Instructions
            </Button>
          )}
        </div>
      </div>
      
      {instructionsVisible && (
        <Card className="bg-blue-50 border-blue-200 mb-4">
          <CardContent className="p-4">
            <h3 className="text-blue-800 font-medium mb-2">Drawing Instructions:</h3>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>Select a structure type from the dropdown below</li>
              <li>Click a drawing tool button (polygon or rectangle)</li>
              <li>Draw on the map to define your installation area</li>
              <li>You can draw multiple areas with different structure types</li>
              <li>Areas are editable - drag the points to reshape them</li>
              <li>Click on the edge markers to set the array azimuth</li>
            </ol>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <div className="lg:col-span-3">
          <div className="flex flex-wrap gap-2 mb-4">
            <select
              value={structureType.id}
              onChange={(e) => {
                const selected = structureTypes.find(type => type.id === e.target.value);
                if (selected) setStructureType(selected);
              }}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              {structureTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            
            <Button 
              onClick={startDrawingPolygon} 
              variant="outline" 
              size="sm" 
              className="gap-1"
            >
              <Hexagon className="h-4 w-4" />
              Draw Polygon
            </Button>
            
            <Button 
              onClick={startDrawingRectangle} 
              variant="outline" 
              size="sm" 
              className="gap-1"
            >
              <Square className="h-4 w-4" />
              Draw Rectangle
            </Button>
            
            <Button 
              onClick={clearAllPolygons} 
              variant="outline" 
              size="sm" 
              className="gap-1 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </div>
          
          <div className="relative h-[500px] border rounded-md overflow-hidden">
            {!GOOGLE_MAPS_API_KEY && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                <div className="text-center p-4">
                  <StopCircle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-gray-900">Google Maps API Key Missing</h3>
                  <p className="text-sm text-gray-600 max-w-md">
                    Please add your Google Maps API key to the environment variables as VITE_GOOGLE_MAPS_API_KEY.
                  </p>
                </div>
              </div>
            )}
            <LoadScript 
              googleMapsApiKey={GOOGLE_MAPS_API_KEY} 
              libraries={libraries}
              loadingElement={
                <div className="h-full w-full flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <Map className="h-8 w-8 text-blue-500 mx-auto animate-pulse" />
                    <p className="mt-2 text-sm text-gray-600">Loading Google Maps...</p>
                  </div>
                </div>
              }
            >
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={zoom}
                onLoad={onLoad}
                options={{
                  streetViewControl: false,
                  mapTypeId: "satellite",
                  gestureHandling: "greedy",
                  // mapId: GOOGLE_MAPS_ID, // Comment out mapId if causing issues with custom styles
                  mapTypeControl: true,
                  fullscreenControl: true,
                  zoomControl: true
                }}
              >
                {/* Drawing handled by the DrawingManager */}
              </GoogleMap>
            </LoadScript>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-lg mb-2">Calculation Results</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Total Area</p>
                  <p className="font-medium">{totalArea.toFixed(1)} m²</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Placed Modules</p>
                  <p className="font-medium">{placedModuleCount} <span className="text-xs text-gray-500">({moduleCount} max possible)</span></p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Capacity</p>
                  <p className="font-medium">{totalCapacity.toFixed(2)} kWp</p>
                </div>
                
                {polygonConfigs.length > 0 && (
                  <div className="pt-3 border-t mt-3">
                    <p className="text-sm font-medium mb-2">Areas Breakdown:</p>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {polygonConfigs.map((config, idx) => (
                        <div key={`area-${idx}`} className="text-xs p-2 bg-gray-50 rounded">
                          <div className="flex justify-between">
                            <span className="font-medium">Area {idx+1}:</span>
                            <span>{config.area.toFixed(1)} m²</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Modules:</span>
                            <span>{config.moduleCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Azimuth:</span>
                            <span>{config.azimuth}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Type:</span>
                            <span>{config.structureType}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Layout parameters display */}
          {polygons.length > 0 && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <h3 className="font-medium text-sm mb-2">Structure Parameters</h3>
                <div className="space-y-2 text-xs">
                  <p>
                    <span className="font-medium">Tilt:</span> {layoutParams.tiltAngle}°
                  </p>
                  <p>
                    <span className="font-medium">Orientation:</span> {layoutParams.orientation}
                  </p>
                  {structureType.id === 'ground_mount_tables' && layoutParams.tableConfig && (
                    <div className="mt-1">
                      <p><span className="font-medium">Table Config:</span></p>
                      <p className="pl-2">{layoutParams.tableConfig.rowsPerTable} rows × {layoutParams.tableConfig.modulesPerRow} modules</p>
                    </div>
                  )}
                  {structureType.id === 'carport' && layoutParams.carportConfig && (
                    <div className="mt-1">
                      <p><span className="font-medium">Carport Config:</span></p>
                      <p className="pl-2">{layoutParams.carportConfig.rows} rows × {layoutParams.carportConfig.modulesPerRow} modules</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AreaCalculator;
