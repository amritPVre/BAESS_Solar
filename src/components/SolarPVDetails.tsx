
import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

interface SolarPVDetailsProps {
  systemSize: number;
  setSystemSize: (value: number) => void;
  panelType: string;
  setPanelType: (value: string) => void;
  panelEfficiency: number;
  setPanelEfficiency: (value: number) => void;
  inverterType: string;
  setInverterType: (value: string) => void;
  inverterEfficiency: number;
  setInverterEfficiency: (value: number) => void;
  roofType: string;
  setRoofType: (value: string) => void;
  roofAngle: number;
  setRoofAngle: (value: number) => void;
  orientation: string;
  setOrientation: (value: string) => void;
  solarIrradiance: number;
  setSolarIrradiance: (value: number) => void;
  shadingFactor: number;
  setShadingFactor: (value: number) => void;
  location: { lat: number; lng: number };
  setLocation: (value: { lat: number; lng: number }) => void;
  timezone: string;
  setTimezone: (value: string) => void;
  country: string;
  setCountry: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
}

const SolarPVDetails: React.FC<SolarPVDetailsProps> = ({
  systemSize,
  setSystemSize,
  panelType,
  setPanelType,
  panelEfficiency,
  setPanelEfficiency,
  inverterType,
  setInverterType,
  inverterEfficiency,
  setInverterEfficiency,
  roofType,
  setRoofType,
  roofAngle,
  setRoofAngle,
  orientation,
  setOrientation,
  solarIrradiance,
  setSolarIrradiance,
  shadingFactor,
  setShadingFactor,
  location,
  setLocation,
  timezone,
  setTimezone,
  country,
  setCountry,
  city,
  setCity
}) => {
  const handleLocationDetection = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          
          // Fetch location details using reverse geocoding
          fetchLocationDetails(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };
  
  const fetchLocationDetails = async (lat: number, lng: number) => {
    try {
      // This is a simple implementation. In a production app, you would use a proper geocoding service
      // like Google's Geocoding API or Mapbox's Geocoding API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.address) {
          setCountry(data.address.country || country);
          setCity(data.address.city || data.address.town || data.address.village || city);
          
          // For timezone, we're using a simple approach here
          // In a real app, you'd use a timezone API
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setTimezone(timezone);
          
          // Update solar irradiance based on location (simplified)
          updateSolarIrradianceEstimate(lat);
        }
      }
    } catch (error) {
      console.error("Error fetching location details:", error);
    }
  };
  
  const updateSolarIrradianceEstimate = (latitude: number) => {
    // This is a very simplified estimation
    // In a real app, you would use actual solar radiation data from NASA or other sources
    const absLat = Math.abs(latitude);
    
    if (absLat < 20) {
      // Equatorial regions
      setSolarIrradiance(6.0);
    } else if (absLat < 35) {
      // Subtropical regions
      setSolarIrradiance(5.5);
    } else if (absLat < 50) {
      // Temperate regions
      setSolarIrradiance(4.5);
    } else {
      // Polar regions
      setSolarIrradiance(3.5);
    }
  };
  
  return (
    <div className="glass-card rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <h2 className="section-title">Solar PV System Details</h2>
      
      {/* Location Section */}
      <div className="mb-6 bg-solar-gray/20 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <MapPin className="h-5 w-5 mr-2" /> Location Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="0.000001"
              value={location.lat}
              onChange={(e) => setLocation({ ...location, lat: Number(e.target.value) })}
              className="input-field"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="0.000001"
              value={location.lng}
              onChange={(e) => setLocation({ ...location, lng: Number(e.target.value) })}
              className="input-field"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="input-field"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLocationDetection}
          className="mb-2"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Detect My Location
        </Button>
        
        <div className="text-sm text-muted-foreground mt-2">
          <p>Your location helps us accurately calculate solar irradiance and system performance.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="systemSize">System Size (kW)</Label>
              <span className="text-sm font-medium">{systemSize} kW</span>
            </div>
            <Slider
              id="systemSize"
              min={1}
              max={30}
              step={0.1}
              value={[systemSize]}
              onValueChange={(value) => setSystemSize(value[0])}
              className="py-2"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="panelType">Panel Type</Label>
            <Select value={panelType} onValueChange={setPanelType}>
              <SelectTrigger id="panelType" className="input-field">
                <SelectValue placeholder="Select panel type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monocrystalline">Monocrystalline</SelectItem>
                <SelectItem value="polycrystalline">Polycrystalline</SelectItem>
                <SelectItem value="thinfilm">Thin Film</SelectItem>
                <SelectItem value="bifacial">Bifacial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="panelEfficiency">Panel Efficiency (%)</Label>
              <span className="text-sm font-medium">{panelEfficiency}%</span>
            </div>
            <Slider
              id="panelEfficiency"
              min={10}
              max={25}
              step={0.1}
              value={[panelEfficiency]}
              onValueChange={(value) => setPanelEfficiency(value[0])}
              className="py-2"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="inverterType">Inverter Type</Label>
            <Select value={inverterType} onValueChange={setInverterType}>
              <SelectTrigger id="inverterType" className="input-field">
                <SelectValue placeholder="Select inverter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String Inverter</SelectItem>
                <SelectItem value="microinverter">Microinverter</SelectItem>
                <SelectItem value="hybrid">Hybrid Inverter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="inverterEfficiency">Inverter Efficiency (%)</Label>
              <span className="text-sm font-medium">{inverterEfficiency}%</span>
            </div>
            <Slider
              id="inverterEfficiency"
              min={90}
              max={99}
              step={0.1}
              value={[inverterEfficiency]}
              onValueChange={(value) => setInverterEfficiency(value[0])}
              className="py-2"
            />
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="roofType">Roof Type</Label>
            <Select value={roofType} onValueChange={setRoofType}>
              <SelectTrigger id="roofType" className="input-field">
                <SelectValue placeholder="Select roof type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asphalt">Asphalt Shingle</SelectItem>
                <SelectItem value="metal">Metal</SelectItem>
                <SelectItem value="tile">Tile</SelectItem>
                <SelectItem value="flat">Flat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="roofAngle">Roof Angle (degrees)</Label>
              <span className="text-sm font-medium">{roofAngle}°</span>
            </div>
            <Slider
              id="roofAngle"
              min={0}
              max={45}
              step={1}
              value={[roofAngle]}
              onValueChange={(value) => setRoofAngle(value[0])}
              className="py-2"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="orientation">Orientation</Label>
            <Select value={orientation} onValueChange={setOrientation}>
              <SelectTrigger id="orientation" className="input-field">
                <SelectValue placeholder="Select orientation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="south">South</SelectItem>
                <SelectItem value="southwest">Southwest</SelectItem>
                <SelectItem value="southeast">Southeast</SelectItem>
                <SelectItem value="east">East</SelectItem>
                <SelectItem value="west">West</SelectItem>
                <SelectItem value="north">North</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="solarIrradiance">Solar Irradiance (kWh/m²/day)</Label>
              <span className="text-sm font-medium">{solarIrradiance}</span>
            </div>
            <Slider
              id="solarIrradiance"
              min={2}
              max={7}
              step={0.1}
              value={[solarIrradiance]}
              onValueChange={(value) => setSolarIrradiance(value[0])}
              className="py-2"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="shadingFactor">Shading Factor (%)</Label>
              <span className="text-sm font-medium">{shadingFactor}%</span>
            </div>
            <Slider
              id="shadingFactor"
              min={0}
              max={50}
              step={1}
              value={[shadingFactor]}
              onValueChange={(value) => setShadingFactor(value[0])}
              className="py-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarPVDetails;
