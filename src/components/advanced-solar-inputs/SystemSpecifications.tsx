
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ruler, Settings, Sun } from "lucide-react";

interface SystemSpecificationsProps {
  capacity: number;
  moduleEfficiency: number;
  performanceRatio: number;
  moduleWattPeak: number;
  moduleArea: number;
  setCapacity: (capacity: number) => void;
  setModuleEfficiency: (efficiency: number) => void;
  setPerformanceRatio: (ratio: number) => void;
  setModuleWattPeak: (wattPeak: number) => void;
  setModuleArea: (area: number) => void;
}

const SystemSpecifications: React.FC<SystemSpecificationsProps> = ({
  capacity,
  moduleEfficiency,
  performanceRatio,
  moduleWattPeak,
  moduleArea,
  setCapacity,
  setModuleEfficiency,
  setPerformanceRatio,
  setModuleWattPeak,
  setModuleArea,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="capacity" className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-green-600" />
            System Capacity (kW)
          </Label>
          <Input
            id="capacity"
            type="number"
            min="0.1"
            step="0.1"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="border-green-200 focus-visible:ring-green-500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="moduleEfficiency" className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-green-600" />
            Module Efficiency
          </Label>
          <Input
            id="moduleEfficiency"
            type="number"
            min="0.1"
            max="1"
            step="0.01"
            value={moduleEfficiency}
            onChange={(e) => setModuleEfficiency(Number(e.target.value))}
            className="border-green-200 focus-visible:ring-green-500"
          />
          <p className="text-xs text-muted-foreground">
            Typical range: 0.15-0.23 (15-23%)
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="performanceRatio" className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-green-600" />
            Performance Ratio
          </Label>
          <Input
            id="performanceRatio"
            type="number"
            min="0.1"
            max="1"
            step="0.01"
            value={performanceRatio}
            onChange={(e) => setPerformanceRatio(Number(e.target.value))}
            className="border-green-200 focus-visible:ring-green-500"
          />
          <p className="text-xs text-muted-foreground">
            Typical range: 0.7-0.85 (70-85%)
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="moduleWattPeak" className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-green-600" />
            Module Watt Peak (Wp)
          </Label>
          <Input
            id="moduleWattPeak"
            type="number"
            min="1"
            value={moduleWattPeak}
            onChange={(e) => setModuleWattPeak(Number(e.target.value))}
            className="border-green-200 focus-visible:ring-green-500"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="moduleArea" className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-green-600" />
          Module Area (m²)
        </Label>
        <Input
          id="moduleArea"
          type="number"
          min="0.1"
          step="0.1"
          value={moduleArea}
          onChange={(e) => setModuleArea(Number(e.target.value))}
          className="border-green-200 focus-visible:ring-green-500"
        />
      </div>
    </div>
  );
};

export default SystemSpecifications;
