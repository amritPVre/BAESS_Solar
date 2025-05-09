
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
}

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
          polygonOptions: {
            fillColor: '#FF0000',
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: '#FF0000',
            clickable: true, 
            editable: true,
            draggable: true,
            zIndex: 1
          },
          rectangleOptions: {
            fillColor: '#FF0000',
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: '#FF0000',
            clickable: true,
            editable: true,
            draggable: true
          }
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
      } catch (error) {
        console.error("Error initializing drawing manager:", error);
        toast.error("Failed to initialize drawing tools. Please refresh the page.");
      }
    }
  }, []);

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

  const handlePolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    // Calculate the area for this polygon
    const area = calculatePolygonArea(polygon);
    
    // Add the polygon to our state
    setPolygons(prev => [...prev, { polygon, area }]);
    
    // Set up listeners for polygon changes
    setupPolygonListeners(polygon);
    
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
        fillColor: '#FF0000',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#FF0000',
        clickable: true, 
        editable: true,
        draggable: true,
        map: map
      });
      
      // Remove the rectangle
      rectangle.setMap(null);
      
      // Calculate the area
      const area = calculatePolygonArea(polygon);
      
      // Add the polygon to our state
      setPolygons(prev => [...prev, { polygon, area }]);
      
      // Set up listeners for polygon changes
      setupPolygonListeners(polygon);
      
      // Switch drawing manager back to non-drawing mode
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setDrawingMode(null);
      }
    } catch (error) {
      console.error("Error converting rectangle to polygon:", error);
    }
  }, [map, calculatePolygonArea]);
  
  const setupPolygonListeners = useCallback((polygon: google.maps.Polygon) => {
    const handlePolygonChange = () => {
      // Debounce calculations
      if (calculationPendingRef.current) return;
      calculationPendingRef.current = true;
      
      setTimeout(() => {
        // Update the area for this specific polygon
        setPolygons(prevPolygons => {
          return prevPolygons.map(p => {
            if (p.polygon === polygon) {
              const newArea = calculatePolygonArea(polygon);
              return { polygon, area: newArea };
            }
            return p;
          });
        });
        
        // Allow new calculations
        calculationPendingRef.current = false;
      }, 100);
    };
    
    // Setup event listeners for polygon changes (with debounce)
    google.maps.event.addListener(polygon, 'mouseup', handlePolygonChange);
    
    const path = polygon.getPath();
    google.maps.event.addListener(path, 'set_at', handlePolygonChange);
    google.maps.event.addListener(path, 'insert_at', handlePolygonChange);
    google.maps.event.addListener(path, 'remove_at', handlePolygonChange);
  }, [calculatePolygonArea]);

  // Recalculate area and capacity when polygons change
  useEffect(() => {
    if (!selectedPanel) return;
    
    // Calculate total area
    let area = 0;
    polygons.forEach(poly => {
      area += poly.area;
    });
    
    setTotalArea(area);
    
    // Generate polygon configs
    const configs: PolygonConfig[] = [];
    let totalModuleCount = 0;
    let totalCapacityKw = 0;
    
    polygons.forEach((poly, index) => {
      // Default values for this polygon
      const tiltAngle = structureType.id === 'ballasted' ? 10 : 
                        structureType.id === 'fixed_tilt' ? 25 : 
                        structureType.id === 'ground_mount_tables' ? 20 : 
                        structureType.id === 'carport' ? 5 : 30;
                        
      const azimuth = 180; // Default to south-facing
      
      // Calculate module count based on area and ground coverage ratio
      const polygonAreaM2 = poly.area;
      const moduleArea = (selectedPanel.length / 1000) * (selectedPanel.width / 1000); // Convert to m²
      const modulesPerArea = Math.floor(polygonAreaM2 * structureType.groundCoverageRatio / moduleArea);
      
      totalModuleCount += modulesPerArea;

      const capacityForPolygon = (modulesPerArea * (selectedPanel.power_rating || selectedPanel.power)) / 1000;
      totalCapacityKw += capacityForPolygon;

      configs.push({
        id: index,
        area: polygonAreaM2,
        tiltAngle,
        azimuth,
        structureType: structureType.id,
        moduleCount: modulesPerArea,
        capacityKw: capacityForPolygon
      });
    });

    setTotalModules(totalModuleCount);
    setTotalCapacity(totalCapacityKw);
    setPolygonConfigs(configs);
    
    // Update parent component
    onCapacityCalculated(totalCapacityKw, area, totalModuleCount, configs);
    
  }, [polygons, selectedPanel, structureType, onCapacityCalculated]);

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
    setPolygons([]);
    setTotalArea(0);
    setTotalCapacity(0);
    setTotalModules(0);
    setPolygonConfigs([]);
    onCapacityCalculated(0, 0, 0, []);
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
                  // Remove mapId if causing issues with custom styles
                  // mapId: GOOGLE_MAPS_ID,
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
                  <p className="text-sm text-gray-500">Total Modules</p>
                  <p className="font-medium">{totalModules}</p>
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
        </div>
      </div>
    </div>
  );
};

export default AreaCalculator;
