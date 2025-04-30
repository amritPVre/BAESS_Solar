
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { MapPin, Search } from "lucide-react";
import { SolarAreaMapperProps } from "@/types/components";

// Import for map components
import { MapContainer, TileLayer, FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

// Fix for Leaflet icons
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";

// Import required Leaflet Draw CSS
import "@/styles/leaflet-draw-fix.css";

const SolarAreaMapper: React.FC<SolarAreaMapperProps> = ({
  onComplete,
  initialCapacity = 10,
  latitude = 18.9384791,
  longitude = 72.8252102,
  timezone = "Asia/Kolkata",
  country = "India",
  city = "Mumbai",
  defaultLocation
}) => {
  // State for map
  const [mapCenter, setMapCenter] = useState<[number, number]>([latitude, longitude]);
  const [drawnItems, setDrawnItems] = useState(null);
  const [lastDrawnArea, setLastDrawnArea] = useState<any>(null);
  const [totalArea, setTotalArea] = useState<number | null>(null);
  const [initialUsableArea, setInitialUsableArea] = useState<number | null>(null);
  const [finalUsableArea, setFinalUsableArea] = useState<number | null>(null);
  const [modulesEstimate, setModulesEstimate] = useState<number | null>(null);
  const [potentialCapacity, setPotentialCapacity] = useState<number | null>(null);
  const [potentialCapacityRange, setPotentialCapacityRange] = useState<{low: number, high: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // State for GCR (Ground Coverage Ratio)
  const [projectCategory, setProjectCategory] = useState<string>("commercial");
  const [installationType, setInstallationType] = useState<string>("roof-mounted");
  const [gcr, setGcr] = useState<number>(0.7);
  const [gcrRange, setGcrRange] = useState<[number, number]>([0.5, 0.9]);
  
  // Fix Leaflet icon issues for webpack
  useEffect(() => {
    // Fix for Leaflet icons
    let DefaultIcon = L.icon({
      iconUrl: icon,
      shadowUrl: iconShadow,
      iconRetinaUrl: iconRetinaUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    
    L.Marker.prototype.options.icon = DefaultIcon;
    
    // If defaultLocation is provided, geocode it
    if (defaultLocation) {
      handleSearchLocation();
    }
  }, []);

  // GCR category options
  const gcrCategories = [
    "residential",
    "commercial",
    "industrial",
    "utility-scale"
  ];
  
  // Installation types based on category
  const getInstallationTypes = (category: string) => {
    switch (category) {
      case "residential":
        return ["roof-mounted", "ground-mounted"];
      case "commercial":
        return ["roof-mounted", "carport", "ground-mounted"];
      case "industrial":
        return ["roof-mounted", "ground-mounted", "floating"];
      case "utility-scale":
        return ["fixed-tilt", "single-axis-tracking", "dual-axis-tracking"];
      default:
        return ["roof-mounted"];
    }
  };
  
  // Get GCR value based on category and installation type
  const getGcrValue = (category: string, type: string): number => {
    // These are simplified values - in a real app you might have more precise values
    const gcrValues: {[key: string]: {[key: string]: number}} = {
      "residential": {
        "roof-mounted": 0.75,
        "ground-mounted": 0.65
      },
      "commercial": {
        "roof-mounted": 0.7,
        "carport": 0.6,
        "ground-mounted": 0.6
      },
      "industrial": {
        "roof-mounted": 0.65,
        "ground-mounted": 0.55,
        "floating": 0.5
      },
      "utility-scale": {
        "fixed-tilt": 0.45,
        "single-axis-tracking": 0.35,
        "dual-axis-tracking": 0.3
      }
    };
    
    return gcrValues[category]?.[type] || 0.6; // Default to 0.6 if not found
  };
  
  // Get GCR range based on category and installation type
  const getGcrRange = (category: string, type: string): [number, number] => {
    // Simplified ranges
    const gcrRanges: {[key: string]: {[key: string]: [number, number]}} = {
      "residential": {
        "roof-mounted": [0.65, 0.85],
        "ground-mounted": [0.55, 0.75]
      },
      "commercial": {
        "roof-mounted": [0.6, 0.8],
        "carport": [0.5, 0.7],
        "ground-mounted": [0.5, 0.7]
      },
      "industrial": {
        "roof-mounted": [0.55, 0.75],
        "ground-mounted": [0.45, 0.65],
        "floating": [0.4, 0.6]
      },
      "utility-scale": {
        "fixed-tilt": [0.35, 0.55],
        "single-axis-tracking": [0.25, 0.45],
        "dual-axis-tracking": [0.2, 0.4]
      }
    };
    
    return gcrRanges[category]?.[type] || [0.5, 0.7]; // Default range
  };
  
  // Get installation description
  const getInstallationDescription = (category: string, type: string): string => {
    const descriptions: {[key: string]: {[key: string]: string}} = {
      "residential": {
        "roof-mounted": "Typical residential rooftop installation",
        "ground-mounted": "Small-scale ground installation for homes"
      },
      "commercial": {
        "roof-mounted": "Flat or pitched roof installation for commercial buildings",
        "carport": "Solar panels mounted on carport structures",
        "ground-mounted": "Ground installation for commercial properties"
      },
      "industrial": {
        "roof-mounted": "Large-scale rooftop installation for factories or warehouses",
        "ground-mounted": "Large ground installation for industrial use",
        "floating": "Solar panels mounted on floating structures (e.g., water bodies)"
      },
      "utility-scale": {
        "fixed-tilt": "Large solar farm with fixed-tilt arrays",
        "single-axis-tracking": "Solar farm with panels that track the sun on one axis",
        "dual-axis-tracking": "Solar farm with panels that track the sun on two axes"
      }
    };
    
    return descriptions[category]?.[type] || "Standard solar PV installation";
  };
  
  // Handle installation type change based on project category
  useEffect(() => {
    const types = getInstallationTypes(projectCategory);
    setInstallationType(types[0]);
    
    // Update GCR value and range when category changes
    const newGcrValue = getGcrValue(projectCategory, types[0]);
    const newGcrRange = getGcrRange(projectCategory, types[0]);
    
    setGcr(newGcrValue);
    setGcrRange(newGcrRange);
  }, [projectCategory]);
  
  // Handle installation type change
  useEffect(() => {
    if (installationType) {
      const newGcrValue = getGcrValue(projectCategory, installationType);
      const newGcrRange = getGcrRange(projectCategory, installationType);
      
      setGcr(newGcrValue);
      setGcrRange(newGcrRange);
    }
  }, [installationType]);
  
  // Handle location search
  const handleSearchLocation = async () => {
    if (!defaultLocation && (!city || !country)) {
      toast.error("Please enter a location to search");
      return;
    }
    
    setIsLoading(true);
    try {
      const searchQuery = defaultLocation || `${city}, ${country}`;
      
      // Using Nominatim geocoding service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch location");
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const location = data[0];
        const newLat = parseFloat(location.lat);
        const newLng = parseFloat(location.lon);
        
        setMapCenter([newLat, newLng]);
        
        // For demonstration, we'd also update city and country here
        // In a real app, you might do a reverse geocode to get accurate city/country
        
        toast.success("Location found");
      } else {
        toast.error("Location not found");
      }
    } catch (error) {
      console.error("Error searching location:", error);
      toast.error("Error searching location");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate area from coordinates
  const calculateAreaFromCoords = (coords: any[]): number => {
    try {
      if (!coords || coords.length < 3) {
        return 0;
      }
      
      // Earth radius in meters
      const R = 6371000;
      
      let area = 0;
      for (let i = 0; i < coords.length; i++) {
        const j = (i + 1) % coords.length;
        
        const lat1 = coords[i].lat * Math.PI / 180;
        const lon1 = coords[i].lng * Math.PI / 180;
        const lat2 = coords[j].lat * Math.PI / 180;
        const lon2 = coords[j].lng * Math.PI / 180;
        
        area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
      }
      
      area = Math.abs(area * R * R / 2);
      return area;
    } catch (error) {
      console.error("Error calculating area:", error);
      return 0;
    }
  };
  
  // Handle creation of new drawn items
  const handleCreated = (e: any) => {
    const layer = e.layer;
    
    // Get the coordinates of the drawn shape
    if (layer && layer.getLatLngs) {
      const coords = layer.getLatLngs()[0];
      
      // Calculate area
      const areaInSquareMeters = calculateAreaFromCoords(coords);
      
      setTotalArea(areaInSquareMeters);
      setLastDrawnArea({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [coords.map((coord: any) => [coord.lng, coord.lat])]
        }
      });
      
      // Calculate initial usable area (85% of total)
      const initialUsable = areaInSquareMeters * 0.85;
      setInitialUsableArea(initialUsable);
      
      // Calculate final usable area with GCR
      const finalUsable = initialUsable * gcr;
      setFinalUsableArea(finalUsable);
      
      // Estimate modules and capacity
      const modules = Math.floor(finalUsable / 2.16);  // typical module size
      setModulesEstimate(modules);
      
      const capacityLow = modules * 450 / 1000;  // Low-power modules (~450W)
      const capacityHigh = modules * 620 / 1000; // High-power modules (~620W)
      setPotentialCapacityRange({ low: capacityLow, high: capacityHigh });
      setPotentialCapacity((capacityLow + capacityHigh) / 2);
      
      toast.success("Area calculation completed");
    }
  };
  
  // Handle GCR change
  useEffect(() => {
    if (initialUsableArea !== null) {
      const newFinalArea = initialUsableArea * gcr;
      setFinalUsableArea(newFinalArea);
      
      // Update modules and capacity estimates
      const newModules = Math.floor(newFinalArea / 2.16);
      setModulesEstimate(newModules);
      
      const newCapacityLow = newModules * 450 / 1000;
      const newCapacityHigh = newModules * 620 / 1000;
      setPotentialCapacityRange({ low: newCapacityLow, high: newCapacityHigh });
      setPotentialCapacity((newCapacityLow + newCapacityHigh) / 2);
    }
  }, [gcr, initialUsableArea]);
  
  // Handle completion
  const handleComplete = () => {
    if (finalUsableArea && potentialCapacity && potentialCapacityRange) {
      const results = {
        totalArea,
        initialUsableArea,
        finalUsableArea,
        modulesEstimate,
        potentialCapacity,
        potentialCapacityLow: potentialCapacityRange.low,
        potentialCapacityHigh: potentialCapacityRange.high,
        gcr,
        projectCategory,
        installationType,
        latitude: mapCenter[0],
        longitude: mapCenter[1],
        country,
        city,
        timezone
      };
      
      onComplete(results);
      toast.success("Area mapping completed");
    } else {
      toast.error("Please draw an area on the map first");
    }
  };
  
  // Handle using initial capacity instead of mapped area
  const handleUseInitialCapacity = () => {
    if (initialCapacity) {
      const results = {
        useInitialCapacity: true,
        initialCapacity,
        latitude: mapCenter[0],
        longitude: mapCenter[1],
        country,
        city,
        timezone
      };
      
      onComplete(results);
      toast.success("Using initial capacity");
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6 shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">🗺️ Solar Installation Area Mapping</h2>
        
        {initialCapacity && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <p className="text-blue-800">
              💡 Initial capacity provided: {initialCapacity.toFixed(1)} kW
            </p>
          </div>
        )}
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Project Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="projectCategory">Select Project Category</Label>
              <Select 
                value={projectCategory} 
                onValueChange={setProjectCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose project category" />
                </SelectTrigger>
                <SelectContent>
                  {gcrCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="installationType">Select Installation Type</Label>
              <Select 
                value={installationType} 
                onValueChange={setInstallationType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose installation type" />
                </SelectTrigger>
                <SelectContent>
                  {getInstallationTypes(projectCategory).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Card className="bg-amber-50 border-amber-200 mb-6">
            <CardContent className="p-4">
              <h4 className="text-lg font-medium mb-2">📊 Installation Configuration</h4>
              <ul className="space-y-1 text-sm">
                <li><span className="font-medium">Ground Coverage Ratio (GCR):</span> {(gcr * 100).toFixed(1)}%</li>
                <li><span className="font-medium">GCR Range:</span> {(gcrRange[0] * 100).toFixed(1)}% - {(gcrRange[1] * 100).toFixed(1)}%</li>
                <li><span className="font-medium">Description:</span> {getInstallationDescription(projectCategory, installationType)}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Location Selection</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2 space-y-2">
              <Label>Search location</Label>
              <div className="flex space-x-2">
                <Input 
                  placeholder="Enter city, country or address" 
                  defaultValue={defaultLocation || ""}
                  onChange={(e) => setCity(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleSearchLocation}
                  disabled={isLoading}
                  className="min-w-20"
                >
                  {isLoading ? "Searching..." : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Current Location</Label>
              <div className="flex">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          const { latitude, longitude } = position.coords;
                          setMapCenter([latitude, longitude]);
                          toast.success("Current location detected");
                        },
                        (error) => {
                          toast.error("Error getting location: " + error.message);
                        }
                      );
                    } else {
                      toast.error("Geolocation is not supported by your browser");
                    }
                  }}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Detect My Location
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="h-[500px] w-full border border-gray-300 rounded-md overflow-hidden">
            <MapContainer 
              center={mapCenter} 
              zoom={18} 
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='Tiles &copy; Esri'
              />
              <FeatureGroup>
                <EditControl
                  position="topright"
                  onCreated={handleCreated}
                  draw={{
                    rectangle: true,
                    polygon: {
                      allowIntersection: false,
                      drawError: {
                        color: '#e1e100',
                        message: 'Polygon cannot intersect!'
                      },
                      shapeOptions: {
                        color: '#97009c',
                        fillOpacity: 0.3
                      }
                    },
                    polyline: false,
                    circle: true,
                    circlemarker: false,
                    marker: true
                  }}
                />
              </FeatureGroup>
            </MapContainer>
          </div>
        </div>
        
        {totalArea !== null && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Installation Area Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-gray-50 rounded-md text-center">
                <div className="text-lg font-semibold">{totalArea.toFixed(1)} m²</div>
                <div className="text-sm text-gray-600">Total Area</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-md text-center">
                <div className="text-lg font-semibold">{initialUsableArea?.toFixed(1)} m²</div>
                <div className="text-sm text-gray-600">Initial Usable Area</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-md text-center">
                <div className="text-lg font-semibold">{finalUsableArea?.toFixed(1)} m²</div>
                <div className="text-sm text-gray-600">Final Usable Area</div>
              </div>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="gcr" className="flex justify-between">
                <span>Ground Coverage Ratio (GCR)</span>
                <span>{(gcr * 100).toFixed(1)}%</span>
              </Label>
              <Slider
                id="gcr"
                min={gcrRange[0]}
                max={gcrRange[1]}
                step={0.01}
                value={[gcr]}
                onValueChange={(values) => setGcr(values[0])}
                className="py-4"
              />
              <div className="text-xs text-gray-500 flex justify-between">
                <span>Min: {(gcrRange[0] * 100).toFixed(1)}%</span>
                <span>Max: {(gcrRange[1] * 100).toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <h4 className="text-lg font-medium mb-2">📊 Installation Analysis</h4>
                  <ul className="space-y-1">
                    <li><span className="font-medium">Total Area:</span> {totalArea.toFixed(1)} m²</li>
                    <li><span className="font-medium">GCR Applied:</span> {(gcr * 100).toFixed(1)}%</li>
                    <li><span className="font-medium">Final Usable Area:</span> {finalUsableArea?.toFixed(1)} m²</li>
                    <li><span className="font-medium">Estimated Modules:</span> {modulesEstimate}</li>
                    <li><span className="font-medium">Potential Capacity:</span> {potentialCapacityRange?.low.toFixed(1)} - {potentialCapacityRange?.high.toFixed(1)} kW</li>
                  </ul>
                </CardContent>
              </Card>
              
              {initialCapacity && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="text-lg font-medium mb-2">🔄 Capacity Comparison</h4>
                    <div className="mb-2">
                      <div className="flex justify-between mb-1">
                        <span>Initial Capacity:</span>
                        <span>{initialCapacity.toFixed(1)} kW</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mapped Capacity:</span>
                        <span>{potentialCapacity?.toFixed(1)} kW</span>
                      </div>
                    </div>
                    
                    {potentialCapacity && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm">
                          <span>Difference:</span>
                          <span className={potentialCapacity > initialCapacity ? 'text-green-600' : 'text-red-600'}>
                            {potentialCapacity > initialCapacity ? '+' : ''}
                            {(((potentialCapacity - initialCapacity) / initialCapacity) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
        
        <div>
          <h3 className="text-xl font-semibold mb-3">Navigation Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {totalArea !== null && (
              <Button 
                onClick={handleComplete}
                className="bg-solar hover:bg-solar-dark text-white"
              >
                Use Mapped Area
              </Button>
            )}
            
            {initialCapacity && (
              <Button 
                variant="outline" 
                onClick={handleUseInitialCapacity}
              >
                Use Initial Capacity
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleUseInitialCapacity}
            >
              Skip Area Mapping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarAreaMapper;
