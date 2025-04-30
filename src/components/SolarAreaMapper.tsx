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
import { SolarAreaMapperProps } from "@/types/components";

// Import required Leaflet Draw CSS
import "@/styles/leaflet-draw-fix.css";

const SolarAreaMapper: React.FC<SolarAreaMapperProps> = ({
  onComplete,
  defaultLocation = "New York",
  initialCapacity,
  latitude,
  longitude,
  timezone,
  country,
  city
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    latitude && longitude ? [latitude, longitude] : [40.7128, -74.0060]
  ); // Use provided coordinates or default to NYC
  const [searchAddress, setSearchAddress] = useState("");
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawControlRef = useRef<any>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const mapId = useRef<string>(`solar-area-mapper-${Math.random().toString(36).substring(2, 9)}`);
  
  const [projectCategory, setProjectCategory] = useState(gcrCategories[0]);
  const [installationType, setInstallationType] = useState(installationTypes[gcrCategories[0]][0]);
  
  const [drawnArea, setDrawnArea] = useState<number | null>(null);
  const [areaAnalysis, setAreaAnalysis] = useState<any>(null);
  const [customGcr, setCustomGcr] = useState<number | null>(null);
  
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    
    // Set a unique ID for the map container
    if (mapRef.current) {
      mapRef.current.id = mapId.current;
      console.log(`Setting map container ID: ${mapId.current}`);
    }
    
    if (latitude && longitude) {
      // Use provided coordinates
      initializeMap([latitude, longitude]);
    } else if (defaultLocation) {
      searchLocation(defaultLocation)
        .then(location => {
          if (location) {
            setMapCenter([location.lat, location.lng]);
            initializeMap([location.lat, location.lng]);
          } else {
            initializeMap(mapCenter);
          }
        })
        .catch(() => {
          initializeMap(mapCenter);
        });
    } else {
      initializeMap(mapCenter);
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);
  
  const initializeMap = (center: [number, number]) => {
    if (!mapRef.current || mapInstanceRef.current) return;
    
    const currentMapId = mapId.current;
    const mapElement = document.getElementById(currentMapId);
    
    if (!mapElement) {
      console.error(`Map element with ID ${currentMapId} not found in DOM`);
      
      // Double check that our ref is in the DOM
      if (!mapRef.current) {
        console.error("mapRef.current is null");
        return;
      }
      
      if (!document.body.contains(mapRef.current)) {
        console.error("mapRef.current is not in the DOM");
        return;
      }
      
      console.log("Setting ID directly on the ref element again");
      mapRef.current.id = currentMapId;
    }
    
    try {
      console.log(`Initializing map with ID: ${currentMapId}`);
      const map = L.map(currentMapId, {
        center: center,
        zoom: 18,
        maxZoom: 22
      });
      
      mapInstanceRef.current = map;
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
      }).addTo(map);
      
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;
      
      // Use setTimeout to ensure DOM is fully rendered before attempting to initialize leaflet-draw
      setTimeout(() => {
        import('leaflet-draw').then(() => {
          // Type assertion for Draw control options
          const drawOptions: any = {
            draw: {
              polyline: false,
              circle: {
                shapeOptions: {
                  color: '#3388ff',
                  weight: 2
                }
              },
              rectangle: {
                shapeOptions: {
                  color: '#3388ff',
                  weight: 2
                }
              },
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
          };
          
          // Use any type assertion for L.Control.Draw
          const drawControl = new (L.Control as any).Draw(drawOptions);
          
          map.addControl(drawControl);
          drawControlRef.current = drawControl;
          
          map.on('draw:created', (e: any) => {
            const layer = e.layer;
            drawnItems.addLayer(layer);
            
            calculateArea(layer);
          });
          
          map.on('draw:edited', (e: any) => {
            const layers = e.layers;
            layers.eachLayer((layer: any) => {
              calculateArea(layer);
            });
          });
          
          map.on('draw:deleted', () => {
            if (drawnItems.getLayers().length === 0) {
              setDrawnArea(null);
              setAreaAnalysis(null);
              setCustomGcr(null);
            }
          });
          
          // Force a resize to ensure the map renders correctly
          setTimeout(() => {
            map.invalidateSize(true);
            console.log("Map initialized successfully");
            setMapLoaded(true);
          }, 300);
        }).catch(err => {
          console.error("Error loading leaflet-draw:", err);
          toast.error("Could not load drawing tools. Please try refreshing the page.");
        });
      }, 500);
    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error("Error initializing map. Please try refreshing the page.");
    }
  };
  
  const calculateArea = (layer: any) => {
    let coordinates: number[][] = [];
    
    if (layer instanceof L.Polygon) {
      const latLngs = layer.getLatLngs()[0];
      if (Array.isArray(latLngs)) {
        coordinates = (latLngs as any).map((point: any) => [point.lat, point.lng]);
      }
    } else if (layer instanceof L.Rectangle) {
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
      const center = layer.getLatLng();
      const radius = layer.getRadius();
      const points = 32;
      
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const dx = Math.cos(angle) * radius;
        const dy = Math.sin(angle) * radius;
        
        const point = L.latLng(
          center.lat + (dy / 111320),
          center.lng + (dx / (111320 * Math.cos(center.lat * (Math.PI / 180))))
        );
        
        coordinates.push([point.lat, point.lng]);
      }
    }
    
    if (coordinates.length > 0) {
      const areaInSquareMeters = calculatePolygonArea(coordinates);
      setDrawnArea(areaInSquareMeters);
      
      const gcrValue = getGcrValue(projectCategory, installationType);
      const analysis = calculateInstallationPotential(areaInSquareMeters, customGcr || gcrValue);
      setAreaAnalysis(analysis);
    }
  };
  
  const handleSearchAddress = async () => {
    if (!searchAddress.trim()) {
      toast.error("Please enter a location to search");
      return;
    }
    
    setSearchingAddress(true);
    
    try {
      const location = await searchLocation(searchAddress);
      
      if (location) {
        setMapCenter([location.lat, location.lng]);
        
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
  
  useEffect(() => {
    setInstallationType(installationTypes[projectCategory][0]);
  }, [projectCategory]);
  
  useEffect(() => {
    if (drawnArea === null) return;
    
    const gcrValue = getGcrValue(projectCategory, installationType);
    const analysis = calculateInstallationPotential(drawnArea, customGcr || gcrValue);
    setAreaAnalysis(analysis);
  }, [projectCategory, installationType, customGcr, drawnArea]);
  
  useEffect(() => {
    if (customGcr === null && projectCategory && installationType) {
      const defaultGcr = getGcrValue(projectCategory, installationType);
      setCustomGcr(defaultGcr);
    }
  }, [projectCategory, installationType]);
  
  const handleGcrChange = (value: number[]) => {
    setCustomGcr(value[0]);
  };
  
  const handleComplete = () => {
    if (areaAnalysis && onComplete) {
      onComplete({
        ...areaAnalysis,
        projectCategory,
        installationType,
        mapCenter,
        location: { lat: mapCenter[0], lng: mapCenter[1] },
        timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        country: country || '',
        city: city || ''
      });
    }
  };
  
  const handleSkip = () => {
    if (onComplete && initialCapacity) {
      onComplete({
        skipped: true,
        potentialCapacity: initialCapacity
      });
    }
  };
  
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
              id={mapId.current}
              className="h-[500px] rounded-md border border-gray-200 shadow-inner bg-gray-50"
            />
            
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-solar" />
                  <p>Loading map...</p>
                </div>
              </div>
            )}
            
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
