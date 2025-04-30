
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Compass, RotateCw } from "lucide-react";

interface InstallationParametersProps {
  tilt: number;
  azimuth: number;
  setTilt: (tilt: number) => void;
  setAzimuth: (azimuth: number) => void;
}

const InstallationParameters: React.FC<InstallationParametersProps> = ({
  tilt,
  azimuth,
  setTilt,
  setAzimuth,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="tilt" className="flex items-center gap-2">
          <RotateCw className="h-4 w-4 text-blue-600" />
          Panel Tilt (°)
        </Label>
        <Input
          id="tilt"
          type="number"
          min="0"
          max="90"
          value={tilt}
          onChange={(e) => setTilt(Number(e.target.value))}
          className="border-blue-200 focus-visible:ring-blue-500"
        />
        <p className="text-xs text-muted-foreground">
          0° = horizontal, 90° = vertical
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="azimuth" className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-blue-600" />
          Azimuth (°)
        </Label>
        <Input
          id="azimuth"
          type="number"
          min="0"
          max="360"
          value={azimuth}
          onChange={(e) => setAzimuth(Number(e.target.value))}
          className="border-blue-200 focus-visible:ring-blue-500"
        />
        <p className="text-xs text-muted-foreground">
          0° = North, 90° = East, 180° = South, 270° = West
        </p>
      </div>
    </div>
  );
};

export default InstallationParameters;
