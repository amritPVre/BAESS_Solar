
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { 
  calculatePolygonArea, 
  calculateInstallationPotential,
  gcrCategories,
  installationTypes,
  getGcrValue,
  getGcrRange,
  getInstallationDescription,
  searchLocation
} from "@/utils/areaMapper";
import { Loader2, Search, MapPin, Info, ChevronsRight, Trash2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

// Import required Leaflet Draw CSS
import "@/styles/leaflet-draw-fix.css";

interface SolarAreaMapperProps {
  onComplete?: (data: any) => void;
  defaultLocation?: string;
  initialCapacity?: number;
}

const SolarAreaMapper: React.FC<SolarAreaMapperProps> = ({
  onComplete,
  defaultLocation = "New York",
  initialCapacity
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // NYC default
  const [searchAddress, setSearchAddress] = useState("");
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawControlRef = useRef<any>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  
  // Installation configuration
  const [projectCategory, setProjectCategory] = useState(gcrCategories[0]);
  const [installationType, setInstallationType] = useState(installationTypes[gcrCategories[0]][0]);
  
  // Area analysis
  const [drawnArea, setDrawnArea] = useState<number | null>(null);
  const [areaAnalysis, setAreaAnalysis] = useState<any>(null);
  const [customGcr, setCustomGcr] = useState<number | null>(null);
  
  // Initialize map when component mounts
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    
    // Try to load the default location
    if (defaultLocation) {
      searchLocation(defaultLocation)
        .then(location => {
          if (location) {
            setMapCenter([location.lat, location.lng]);
            initializeMap([location.lat, location.lng]);
          } else {
            // Fall back to default coordinates
            initializeMap(mapCenter);
          }
        })
        .catch(() => {
          // Fall back to default coordinates on error
          initializeMap(mapCenter);
        });
    } else {
      initializeMap(mapCenter);
    }
    
    // Cleanup map on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);
  
  // Initialize the map with Leaflet
  const initializeMap = (center: [number, number]) => {
    if (!mapRef.current || mapInstanceRef.current) return;
    
    // Create map instance
    const map = L.map(mapRef.current, {
      center: center,
      zoom: 18,
      maxZoom: 22
    });
    
    mapInstanceRef.current = map;
    
    // Add tile layers
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    
    // Add satellite layer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19
    }).addTo(map);
    
    // Initialize the FeatureGroup to store editable layers
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;
    
    // Import Leaflet Draw dynamically (will only work on client side)
    import('leaflet-draw').then(() => {
      // Initialize the draw control and pass it the FeatureGroup of editable layers
      const drawControl = new L.Control.Draw({
        draw: {
          polyline: false,
          circle: true,
          rectangle: true,
          marker: false,
          circlemarker: false,
          polygon: {
            allowIntersection: false,
            showArea: true,
            drawError: {
              color: '#e1e100',
              message: '<strong>Polygon error:</strong> Polygon cannot self-intersect!'
            },
            shapeOptions: {
              color: '#3388ff',
              weight: 2
            }
          }
        },
        edit: {
          featureGroup: drawnItems,
          remove: true
        }
      });
      
      map.addControl(drawControl);
      drawControlRef.current = drawControl;
      
      // Handle the created shape
      map.on(L.Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;
        drawnItems.addLayer(layer);
        
        // Calculate area
        calculateArea(layer);
      });
      
      // Update area on edit
      map.on(L.Draw.Event.EDITED, (e: any) => {
        const layers = e.layers;
        layers.eachLayer((layer: any) => {
          calculateArea(layer);
        });
      });
      
      // Clear area on delete
      map.on(L.Draw.Event.DELETED, () => {
        if (drawnItems.getLayers().length === 0) {
          setDrawnArea(null);
          setAreaAnalysis(null);
          setCustomGcr(null);
        }
      });
      
      setMapLoaded(true);
    });
  };
  
  // Calculate area for the drawn shape
  const calculateArea = (layer: any) => {
    let coordinates: number[][] = [];
    
    if (layer instanceof L.Polygon) {
      // Extract coordinates from polygon
      const latLngs = layer.getLatLngs()[0];
      coordinates = latLngs.map((point: L.LatLng) => [point.lat, point.lng]);
    } else if (layer instanceof L.Rectangle) {
      // Extract coordinates from rectangle
      const bounds = layer.getBounds();
      const ne = bounds.getNorthEast();
      const nw = bounds.getNorthWest();
      const sw = bounds.getSouthWest();
      const se = bounds.getSouthEast();
      coordinates = [
        [ne.lat, ne.lng],
        [nw.lat, nw.lng],
        [sw.lat, sw.lng],
        [se.lat, se.lng]
      ];
    } else if (layer instanceof L.Circle) {
      // For circles, create an approximation with points around the circle
      const center = layer.getLatLng();
      const radius = layer.getRadius();
      const points = 32; // Number of points to approximate the circle
      
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const dx = Math.cos(angle) * radius;
        const dy = Math.sin(angle) * radius;
        
        // Calculate the latitude and longitude at this point
        const point = L.latLng(
          center.lat + (dy / 111320), // 1 degree latitude is approximately 111,320 meters
          center.lng + (dx / (111320 * Math.cos(center.lat * (Math.PI / 180)))) // Adjust for longitude based on latitude
        );
        
        coordinates.push([point.lat, point.lng]);
      }
    }
    
    if (coordinates.length > 0) {
      const areaInSquareMeters = calculatePolygonArea(coordinates);
      setDrawnArea(areaInSquareMeters);
      
      // Calculate installation potential with current GCR
      const gcrValue = getGcrValue(projectCategory, installationType);
      const analysis = calculateInstallationPotential(areaInSquareMeters, customGcr || gcrValue);
      setAreaAnalysis(analysis);
    }
  };
  
  // Handle search address
  const handleSearchAddress = async () => {
    if (!searchAddress.trim()) {
      toast.error("Please enter a location to search");
      return;
    }
    
    setSearchingAddress(true);
    
    try {
      const location = await searchLocation(searchAddress);
      
      if (location) {
        // Update map center
        setMapCenter([location.lat, location.lng]);
        
        // Update map view
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([location.lat, location.lng], 18);
          toast.success(`Location found: ${location.displayName}`);
        }
      } else {
        toast.error("Could not find location. Please try a different search term.");
      }
    } catch (error) {
      toast.error(`Error searching for location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSearchingAddress(false);
    }
  };
  
  // Update installation type when project category changes
  useEffect(() => {
    setInstallationType(installationTypes[projectCategory][0]);
  }, [projectCategory]);
  
  // Update area analysis when category, type, or GCR changes
  useEffect(() => {
    if (drawnArea === null) return;
    
    const gcrValue = getGcrValue(projectCategory, installationType);
    const analysis = calculateInstallationPotential(drawnArea, customGcr || gcrValue);
    setAreaAnalysis(analysis);
  }, [projectCategory, installationType, customGcr, drawnArea]);
  
  // Update custom GCR when default changes
  useEffect(() => {
    if (customGcr === null && projectCategory && installationType) {
      const defaultGcr = getGcrValue(projectCategory, installationType);
      setCustomGcr(defaultGcr);
    }
  }, [projectCategory, installationType]);
  
  // Handle GCR slider change
  const handleGcrChange = (value: number[]) => {
    setCustomGcr(value[0]);
  };
  
  // Handle completion of mapping
  const handleComplete = () => {
    if (areaAnalysis && onComplete) {
      onComplete({
        ...areaAnalysis,
        projectCategory,
        installationType,
        mapCenter
      });
    }
  };
  
  // Handle skip
  const handleSkip = () => {
    if (onComplete && initialCapacity) {
      onComplete({
        skipped: true,
        potentialCapacity: initialCapacity
      });
    }
  };
  
  // Handle clear drawn items
  const handleClearDrawing = () => {
    if (drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers();
      setDrawnArea(null);
      setAreaAnalysis(null);
    }
  };
  
  return (
    <div className="w-full">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <MapPin className="h-6 w-6 text-solar" /> 
            Solar Installation Area Mapping
          </CardTitle>
          <CardDescription>
            Draw polygons or shapes on the map to calculate potential solar installation area
          </CardDescription>
        </CardHeader>
        <CardContent>
          {initialCapacity && (
            <Alert className="mb-4 bg-solar/10">
              <AlertDescription className="flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Initial capacity provided: {initialCapacity.toFixed(1)} kW
              </AlertDescription>
            </Alert>
          )}
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Project Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectCategory">Project Category:</Label>
                <Select
                  value={projectCategory}
                  onValueChange={setProjectCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project category" />
                  </SelectTrigger>
                  <SelectContent>
                    {gcrCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="installationType">Installation Type:</Label>
                <Select
                  value={installationType}
                  onValueChange={setInstallationType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select installation type" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectCategory && installationTypes[projectCategory]?.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {projectCategory && installationType && (
              <Alert className="mt-4 bg-blue-50">
                <AlertDescription>
                  <div className="space-y-1">
                    <div><strong>Ground Coverage Ratio (GCR):</strong> {customGcr !== null ? (customGcr * 100).toFixed(1) : (getGcrValue(projectCategory, installationType) * 100).toFixed(1)}%</div>
                    <div><strong>GCR Range:</strong> {(getGcrRange(projectCategory, installationType)[0] * 100).toFixed(1)}% - {(getGcrRange(projectCategory, installationType)[1] * 100).toFixed(1)}%</div>
                    <div><strong>Description:</strong> {getInstallationDescription(projectCategory, installationType)}</div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Location Selection</h3>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="flex-grow">
                <Input 
                  placeholder="Enter location or address"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress()}
                />
              </div>
              <Button 
                onClick={handleSearchAddress}
                disabled={searchingAddress}
              >
                {searchingAddress ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search
              </Button>
            </div>
          </div>
          
          <div className="mb-4 relative">
            <div 
              ref={mapRef} 
              className="h-[500px] rounded-md border border-gray-200 shadow-inner bg-gray-50"
            />
            
            {mapLoaded && (
              <div className="absolute bottom-4 right-4 z-[1000]">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearDrawing}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Drawing
                </Button>
              </div>
            )}
          </div>
          
          {areaAnalysis && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Installation Area Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Total Area</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-2xl font-semibold">{areaAnalysis.totalArea.toFixed(1)} m²</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Initial Usable Area</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-2xl font-semibold">{areaAnalysis.initialUsableArea.toFixed(1)} m²</p>
                    <p className="text-xs text-muted-foreground">After 85% usability factor</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Final Usable Area</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-2xl font-semibold">{areaAnalysis.finalUsableArea.toFixed(1)} m²</p>
                    <p className="text-xs text-muted-foreground">After GCR application</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-green-50">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Installation Area Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <ul className="space-y-1">
                      <li><strong>Total Area:</strong> {areaAnalysis.totalArea.toFixed(1)} m²</li>
                      <li><strong>GCR Applied:</strong> {(areaAnalysis.gcr * 100).toFixed(1)}%</li>
                      <li><strong>Final Usable Area:</strong> {areaAnalysis.finalUsableArea.toFixed(1)} m²</li>
                      <li><strong>Estimated Modules:</strong> {areaAnalysis.modulesEstimate}</li>
                      <li><strong>Potential Capacity:</strong> {areaAnalysis.potentialCapacityLow.toFixed(1)} - {areaAnalysis.potentialCapacityHigh.toFixed(1)} kW</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Ground Coverage Ratio (GCR):</Label>
                      <span className="font-semibold">{customGcr !== null ? (customGcr * 100).toFixed(1) : 0}%</span>
                    </div>
                    
                    <Slider
                      value={[customGcr || 0.4]}
                      min={getGcrRange(projectCategory, installationType)[0]}
                      max={getGcrRange(projectCategory, installationType)[1]}
                      step={0.01}
                      onValueChange={handleGcrChange}
                    />
                    
                    <p className="text-xs text-muted-foreground">
                      Recommended range: {(getGcrRange(projectCategory, installationType)[0] * 100).toFixed(1)}% - {(getGcrRange(projectCategory, installationType)[1] * 100).toFixed(1)}%
                    </p>
                  </div>
                  
                  {initialCapacity && (
                    <Card className="bg-blue-50">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">Capacity Difference</p>
                            <p className="text-base">
                              {((areaAnalysis.potentialCapacity - initialCapacity) / initialCapacity * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Difference between mapped and initially provided capacity
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6 flex flex-wrap gap-4 justify-end">
            {areaAnalysis && (
              <Button 
                variant="default" 
                className="bg-solar hover:bg-solar-dark"
                onClick={handleComplete}
              >
                Use Mapped Area
                <ChevronsRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            
            {initialCapacity && (
              <Button 
                variant="outline"
                onClick={handleSkip}
              >
                Use Initial Capacity
              </Button>
            )}
            
            <Button 
              variant="ghost"
              onClick={handleSkip}
            >
              Skip Area Mapping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SolarAreaMapper;
