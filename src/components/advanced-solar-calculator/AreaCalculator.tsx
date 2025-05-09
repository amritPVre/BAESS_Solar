import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, LoadScript, Polygon } from '@react-google-maps/api';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Building, 
  Layers,
  MapPin, 
  Square,
  Trash
} from 'lucide-react';
import { SolarPanel } from "@/types/solarCalculations";

// Google Maps API key
const GOOGLE_MAPS_API_KEY = "AIzaSyAlv46zmX698xVwp3kng6P3hpD9goZBYYY"; // This should be replaced with your API key

// Define libraries array for Google Maps
const libraries = ["drawing", "geometry", "places"] as ("drawing" | "geometry" | "places")[];

interface AreaCalculatorProps {
  selectedPanel: SolarPanel | null;
  onCapacityCalculated: (capacityKw: number, areaM2: number, moduleCount: number, polygonConfigs?: PolygonConfig[]) => void;
}

// New interface for polygon configuration data
interface PolygonConfig {
  id: number;
  area: number;
  azimuth: number;
  capacityKw: number;
  moduleCount: number;
  structureType: string;
  tiltAngle: number;
}

// Structure types definition
const structureTypes = [
  { id: 'ballasted', name: 'Ballasted Flat Roof', groundCoverageRatio: 0.5 },
  { id: 'fixed_tilt', name: 'Fixed Tilt Ground Mount', groundCoverageRatio: 0.4 },
  { id: 'ground_mount_tables', name: 'Ground Mount Tables', groundCoverageRatio: 0.45 },
  { id: 'carport', name: 'Carport Structure', groundCoverageRatio: 0.7 },
];

// Default layout parameters for different structure types
const DEFAULT_LAYOUT_PARAMS: Record<string, any> = {
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

interface PolygonInfo {
  polygon: google.maps.Polygon;
  area: number;
  azimuth?: number;
}

const AreaCalculator: React.FC<AreaCalculatorProps> = ({ selectedPanel, onCapacityCalculated }) => {
  const [polygons, setPolygons] = useState<PolygonInfo[]>([]);
  const [totalArea, setTotalArea] = useState<number>(0);
  const [structureType, setStructureType] = useState(structureTypes[0]);
  const [moduleCount, setModuleCount] = useState(0);
  const [layoutAzimuth, setLayoutAzimuth] = useState<number>(180);
  const [selectedPolygonIndex, setSelectedPolygonIndex] = useState<number | null>(0);
  const [instructionsVisible, setInstructionsVisible] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  
  // Layout parameters state
  const [layoutParams, setLayoutParams] = useState<any>(
    DEFAULT_LAYOUT_PARAMS[structureType.id] || DEFAULT_LAYOUT_PARAMS.ballasted
  );
  
  // Define polygon draw options
  const polygonDrawOptions = useMemo((): google.maps.PolygonOptions => ({ 
    fillColor: "#FF0000",
    fillOpacity: 0.30,
    strokeWeight: 1,
    strokeColor: "#FF0000",
    clickable: true, 
    editable: true,
    draggable: true,
    zIndex: 1
  }), []);

  // Calculate total area and estimated module count
  useEffect(() => {
    const calculatedTotalArea = polygons.reduce((sum, poly) => sum + poly.area, 0);
    setTotalArea(calculatedTotalArea);
    
    // Calculate theoretical module counts for display
    if (calculatedTotalArea > 0 && selectedPanel) {
      const panelLength = selectedPanel.length || 1700; // mm
      const panelWidth = selectedPanel.width || 1000; // mm
      const moduleArea = (panelLength * panelWidth) / 1000000; // m²
      const gcr = structureType.groundCoverageRatio;
      const calculatedModuleCount = Math.floor((calculatedTotalArea * gcr) / moduleArea);
      
      setModuleCount(calculatedModuleCount);
      
      // Call onCapacityCalculated with updated values
      if (calculatedModuleCount > 0) {
        const capacityKw = (calculatedModuleCount * selectedPanel.power) / 1000;
        
        // Generate polygon configurations
        const polygonConfigs: PolygonConfig[] = polygons.map((poly, index) => {
          // Calculate per-polygon module count based on area proportion
          const polygonAreaRatio = poly.area / calculatedTotalArea;
          const polygonModuleCount = Math.floor(calculatedModuleCount * polygonAreaRatio);
          const polygonCapacityKw = (polygonModuleCount * selectedPanel.power) / 1000;
          
          return {
            id: index,
            area: poly.area,
            azimuth: poly.azimuth || layoutAzimuth,
            moduleCount: polygonModuleCount,
            capacityKw: polygonCapacityKw,
            structureType: structureType.id,
            tiltAngle: layoutParams.tiltAngle
          };
        });
        
        onCapacityCalculated(capacityKw, calculatedTotalArea, calculatedModuleCount, polygonConfigs);
      } else {
        onCapacityCalculated(0, calculatedTotalArea, 0, []);
      }
    } else {
      setModuleCount(0);
      onCapacityCalculated(0, 0, 0, []);
    }
  }, [polygons, selectedPanel, structureType.groundCoverageRatio, structureType.id, layoutParams.tiltAngle, layoutAzimuth, onCapacityCalculated]);

  // Calculate area of a polygon
  const calculatePolygonArea = useCallback((polygon: google.maps.Polygon): number => {
    try {
      const path = polygon.getPath();
      // Ensure geometry library is loaded
      if (window.google && window.google.maps.geometry && window.google.maps.geometry.spherical) {
        return window.google.maps.geometry.spherical.computeArea(path);
      }
      return 0;
    } catch (error) {
      console.error("Error calculating area:", error);
      return 0;
    }
  }, []);

  // Calculate azimuth from polygon edge
  const calculateAzimuth = useCallback((path: google.maps.MVCArray<google.maps.LatLng>): number => {
    if (path.getLength() >= 2) {
      try {
        // Use the first edge of the polygon to determine azimuth
        const pt1 = path.getAt(0)!;
        const pt2 = path.getAt(1)!;
        
        if (window.google && window.google.maps.geometry && window.google.maps.geometry.spherical) {
          const heading = window.google.maps.geometry.spherical.computeHeading(pt1, pt2);
          // Convert heading to azimuth (azimuth is measured clockwise from north)
          const azimuth = (heading + 450) % 360; // +450 to ensure positive values after modulo
          return azimuth;
        }
      } catch (error) {
        console.error("Error calculating azimuth:", error);
      }
    }
    return 180; // Default to south
  }, []);

  // Setup polygon event listeners
  const setupPolygonListeners = useCallback((polygon: google.maps.Polygon, index: number) => {
    polygon.setOptions(polygonDrawOptions);
    const path = polygon.getPath();
    
    const updatePolygon = () => {
      const updatedArea = calculatePolygonArea(polygon);
      const updatedAzimuth = calculateAzimuth(path);
      
      // Update the specific polygon's area and azimuth
      setPolygons(prevPolygons => 
        prevPolygons.map((poly, idx) => 
          idx === index ? { ...poly, area: updatedArea, azimuth: updatedAzimuth } : poly
        )
      );
      
      // If this is the selected polygon, update the global azimuth
      if (selectedPolygonIndex === index) {
        setLayoutAzimuth(updatedAzimuth);
      }
    };
    
    // Add click handler to select this polygon
    google.maps.event.addListener(polygon, 'click', () => {
      setSelectedPolygonIndex(index);
      
      // Update the global azimuth to match this polygon
      const poly = polygons[index];
      if (poly && poly.azimuth) {
        setLayoutAzimuth(poly.azimuth);
      }
      
      // Highlight the selected polygon
      polygons.forEach((p, i) => {
        const options = {...polygonDrawOptions};
        if (i === index) {
          options.fillColor = "#FF6600";
          options.strokeColor = "#FF6600";
          options.strokeWeight = 2;
        }
        p.polygon.setOptions(options);
      });
    });
    
    google.maps.event.addListener(polygon, 'mouseup', updatePolygon);
    google.maps.event.addListener(polygon, 'dragend', updatePolygon);
    google.maps.event.addListener(path, 'set_at', updatePolygon);
    google.maps.event.addListener(path, 'insert_at', updatePolygon);
    google.maps.event.addListener(path, 'remove_at', updatePolygon);
    
  }, [calculatePolygonArea, calculateAzimuth, polygonDrawOptions, selectedPolygonIndex, polygons]);

  // Delete all polygons
  const deleteAllPolygons = useCallback(() => {
    polygons.forEach(poly => poly.polygon.setMap(null));
    setPolygons([]);
    setTotalArea(0);
    setModuleCount(0);
    
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    }
  }, [polygons]);

  // Initialize drawing manager
  const initializeDrawingManager = useCallback((map: google.maps.Map) => {
    // For carport structures, we'll default to rectangle drawing mode
    const isCarport = structureType.id === 'carport';
    const drawingMode = isCarport 
      ? google.maps.drawing.OverlayType.RECTANGLE 
      : google.maps.drawing.OverlayType.POLYGON;
    
    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: drawingMode,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          google.maps.drawing.OverlayType.POLYGON,
          google.maps.drawing.OverlayType.RECTANGLE
        ],
      },
      polygonOptions: polygonDrawOptions,
      rectangleOptions: { ...polygonDrawOptions }
    });
    
    drawingManager.setMap(map);
    drawingManagerRef.current = drawingManager;
    
    // Handle polygon completion
    google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
      console.log("Polygon completed!");
      const area = calculatePolygonArea(polygon);
      const azimuth = calculateAzimuth(polygon.getPath());
      
      // Set up event listeners
      const newIndex = polygons.length;
      setupPolygonListeners(polygon, newIndex);
      
      // Add the new polygon to state
      setPolygons(prevPolygons => [...prevPolygons, { polygon, area, azimuth }]);
      
      // Auto-select the newly drawn polygon
      setSelectedPolygonIndex(newIndex);
      setLayoutAzimuth(azimuth);
    });
    
    // Handle rectangle completion
    google.maps.event.addListener(drawingManager, 'rectanglecomplete', (rectangle: google.maps.Rectangle) => {
      console.log("Rectangle completed!");
      const bounds = rectangle.getBounds();
      if (!bounds) return;
      
      // Convert rectangle to polygon for consistent handling
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const nw = new google.maps.LatLng(ne.lat(), sw.lng());
      const se = new google.maps.LatLng(sw.lat(), ne.lng());
      
      // Create polygon path
      const path = [ne, se, sw, nw];
      
      // Create polygon
      const polygon = new google.maps.Polygon({
        paths: path,
        ...polygonDrawOptions
      });
      
      // Remove the original rectangle
      rectangle.setMap(null);
      
      // Add the polygon to the map
      polygon.setMap(map);
      
      // Calculate area and azimuth
      const area = calculatePolygonArea(polygon);
      const azimuth = calculateAzimuth(polygon.getPath());
      
      // Set up event listeners
      const newIndex = polygons.length;
      setupPolygonListeners(polygon, newIndex);
      
      // Add to state
      setPolygons(prevPolygons => [...prevPolygons, { polygon, area, azimuth }]);
      
      // Auto-select it
      setSelectedPolygonIndex(newIndex);
      setLayoutAzimuth(azimuth);
    });
    
    // Keep drawing mode enabled after completing a shape
    google.maps.event.addListener(drawingManager, 'overlaycomplete', () => {
      drawingManager.setDrawingMode(drawingManager.getDrawingMode());
    });
    
  }, [calculatePolygonArea, calculateAzimuth, setupPolygonListeners, polygonDrawOptions, structureType.id, polygons.length]);

  // Handle map load
  const onMapLoad = useCallback((map: google.maps.Map) => {
    console.log("Map loaded");
    mapRef.current = map;
    initializeDrawingManager(map);
  }, [initializeDrawingManager]);

  // Update layout parameters when structure type changes
  useEffect(() => {
    setLayoutParams(DEFAULT_LAYOUT_PARAMS[structureType.id] || DEFAULT_LAYOUT_PARAMS.ballasted);
  }, [structureType.id]);

  const containerStyle = {
    width: '100%',
    height: '400px'
  };

  const center = {
    lat: 37.7749,
    lng: -122.4194
  };

  return (
    <Card className="w-full mt-6">
      <CardContent className="p-6">
        <div className="mb-6 flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center">
              <Layers className="h-5 w-5 mr-2 text-primary" />
              Define PV Array Areas
            </h2>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setInstructionsVisible(!instructionsVisible)}
              >
                {instructionsVisible ? 'Hide Instructions' : 'Show Instructions'}
              </Button>
              
              {polygons.length > 0 && (
                <Button
                  onClick={deleteAllPolygons}
                  variant="destructive"
                  size="sm"
                  className="text-xs"
                >
                  <Trash className="h-3 w-3 mr-1" />
                  Clear All Areas
                </Button>
              )}
            </div>
          </div>
          
          {instructionsVisible && (
            <div className="bg-muted/50 p-3 rounded-md text-sm border">
              <h3 className="font-medium mb-1">How to Use the Drawing Tool</h3>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Select the polygon or rectangle tool from the map toolbar</li>
                <li>Click on the map to create vertices (for polygon) or click and drag (for rectangle)</li>
                <li>Complete the shape by clicking on the first point again (for polygon)</li>
                <li>You can draw multiple areas with different structure types</li>
                <li>Click on an area to select it and modify its properties</li>
                <li>Drag the vertices to resize or reshape an area</li>
              </ol>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-3">
            <div className="h-[400px] w-full relative border rounded-lg overflow-hidden">
              <LoadScript
                googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                libraries={libraries}
              >
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={center}
                  zoom={18}
                  onLoad={onMapLoad}
                  options={{
                    mapTypeId: "satellite",
                    mapTypeControl: true,
                    streetViewControl: false
                  }}
                >
                  {/* The map itself handles the drawing */}
                </GoogleMap>
              </LoadScript>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Structure Type</label>
              <select
                value={structureType.id}
                onChange={(e) => {
                  const selected = structureTypes.find(type => type.id === e.target.value);
                  if (selected) setStructureType(selected);
                }}
                className="w-full p-2 border rounded"
              >
                {structureTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Different structure types have specific tilt and layout settings
              </p>
            </div>
            
            {layoutParams && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Tilt Angle (°)</label>
                <input
                  type="number"
                  value={layoutParams.tiltAngle}
                  onChange={(e) => setLayoutParams({ ...layoutParams, tiltAngle: Number(e.target.value) })}
                  min="0"
                  max="45"
                  className="w-full p-2 border rounded"
                />
                <p className="text-xs text-muted-foreground">
                  Default tilt for {structureType.name}: {DEFAULT_LAYOUT_PARAMS[structureType.id].tiltAngle}°
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Azimuth (°)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={layoutAzimuth}
                  onChange={(e) => setLayoutAzimuth(Number(e.target.value))}
                  min="0"
                  max="360"
                  className="w-full p-2 border rounded"
                />
                <Badge className="whitespace-nowrap">
                  {(() => {
                    if (layoutAzimuth >= 337.5 || layoutAzimuth < 22.5) return 'North';
                    if (layoutAzimuth >= 22.5 && layoutAzimuth < 67.5) return 'Northeast';
                    if (layoutAzimuth >= 67.5 && layoutAzimuth < 112.5) return 'East';
                    if (layoutAzimuth >= 112.5 && layoutAzimuth < 157.5) return 'Southeast';
                    if (layoutAzimuth >= 157.5 && layoutAzimuth < 202.5) return 'South';
                    if (layoutAzimuth >= 202.5 && layoutAzimuth < 247.5) return 'Southwest';
                    if (layoutAzimuth >= 247.5 && layoutAzimuth < 292.5) return 'West';
                    if (layoutAzimuth >= 292.5 && layoutAzimuth < 337.5) return 'Northwest';
                    return '';
                  })()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically calculated from drawn area orientation
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 bg-muted/30 p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">System Size Estimate</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium">Total Area:</p>
              <p className="text-xl font-semibold">
                {totalArea.toFixed(1)} m²
              </p>
              <p className="text-xs text-muted-foreground">
                {polygons.length} area{polygons.length !== 1 ? 's' : ''} drawn
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Structure Type:</p>
              <p className="text-xl font-semibold">
                {structureType.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Coverage ratio: {(structureType.groundCoverageRatio * 100).toFixed(0)}%
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Module Count:</p>
              <p className="text-xl font-semibold">
                {moduleCount} modules
              </p>
              <p className="text-xs text-muted-foreground">
                Based on selected panel dimensions
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium">System Capacity:</p>
              <p className="text-xl font-semibold">
                {selectedPanel ? ((moduleCount * selectedPanel.power) / 1000).toFixed(1) : "0"} kWp
              </p>
              <p className="text-xs text-muted-foreground">
                Based on {selectedPanel?.power || 0}W modules
              </p>
            </div>
          </div>
          
          {polygons.length > 1 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium mb-2">Area Details</h4>
              <div className="flex flex-wrap gap-2">
                {polygons.map((poly, index) => (
                  <div
                    key={`area-${index}`}
                    className={`p-2 rounded-md cursor-pointer ${
                      selectedPolygonIndex === index 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => setSelectedPolygonIndex(index)}
                  >
                    <p className="text-sm font-medium flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      Area {index + 1}
                    </p>
                    <p className="text-xs">
                      {poly.area.toFixed(1)} m² 
                      {poly.azimuth && 
                        <span className="ml-1">
                          • {poly.azimuth.toFixed(0)}°
                        </span>
                      }
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AreaCalculator;
