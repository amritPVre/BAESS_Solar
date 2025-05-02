
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sliders } from "lucide-react";
import LossesCalculator from "./LossesCalculator";
import InstallationParameters from "@/components/advanced-solar-inputs/InstallationParameters";

interface SystemConfigurationProps {
  tilt: number;
  azimuth: number;
  arrayType: number;
  losses: number;
  latitude: number;
  longitude: number;
  onTiltChange: (value: number) => void;
  onAzimuthChange: (value: number) => void;
  onArrayTypeChange: (value: number) => void;
  onLossesChange: (value: number) => void;
  onLatitudeChange: (value: number) => void;
  onLongitudeChange: (value: number) => void;
}

const SystemConfiguration: React.FC<SystemConfigurationProps> = ({
  tilt,
  azimuth,
  arrayType,
  losses,
  latitude,
  longitude,
  onTiltChange,
  onAzimuthChange,
  onArrayTypeChange,
  onLossesChange,
  onLatitudeChange,
  onLongitudeChange
}) => {
  const [lossesDialogOpen, setLossesDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-primary" />
          System Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-6">
        {/* Installation Parameters */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Installation Parameters</h3>
          <InstallationParameters 
            tilt={tilt}
            azimuth={azimuth}
            setTilt={onTiltChange}
            setAzimuth={onAzimuthChange}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Array Type */}
          <div className="space-y-2">
            <Label htmlFor="arrayType">Array Type</Label>
            <Select 
              value={arrayType.toString()} 
              onValueChange={(value) => onArrayTypeChange(Number(value))}
            >
              <SelectTrigger id="arrayType">
                <SelectValue placeholder="Select array type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Fixed (open rack)</SelectItem>
                <SelectItem value="1">Fixed (roof mount)</SelectItem>
                <SelectItem value="2">1-Axis Tracking</SelectItem>
                <SelectItem value="3">2-Axis Tracking</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* System Losses */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="losses">System Losses (%)</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLossesDialogOpen(true)}
                className="h-8 text-xs"
              >
                Calculate Detailed Losses
              </Button>
            </div>
            <Input
              id="losses"
              type="number"
              value={losses}
              onChange={(e) => onLossesChange(Number(e.target.value))}
              min="0"
              max="100"
              step="0.1"
            />
          </div>
        </div>

        {/* Location Parameters */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Location Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                value={latitude}
                onChange={(e) => onLatitudeChange(Number(e.target.value))}
                min="-90"
                max="90"
                step="0.0001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                value={longitude}
                onChange={(e) => onLongitudeChange(Number(e.target.value))}
                min="-180"
                max="180"
                step="0.0001"
              />
            </div>
          </div>
        </div>
        
        {/* Losses Calculator Dialog */}
        <LossesCalculator 
          initialLosses={losses}
          onLossesChange={onLossesChange}
          open={lossesDialogOpen}
          onOpenChange={setLossesDialogOpen}
        />
      </CardContent>
    </Card>
  );
};

export default SystemConfiguration;
