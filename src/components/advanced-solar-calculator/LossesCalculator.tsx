
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon, RotateCcw } from "lucide-react";

interface LossesCalculatorProps {
  initialLosses?: number;
  onLossesChange: (total: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Default values based on PVWatts typical values
const DEFAULT_LOSSES = {
  soiling: 2,
  shading: 3,
  snow: 0,
  mismatch: 2,
  wiring: 2,
  connections: 0.5,
  lightInducedDegradation: 1.5,
  nameplateRating: 1,
  age: 0,
  availability: 3
};

const LossesCalculator: React.FC<LossesCalculatorProps> = ({
  initialLosses = 14,
  onLossesChange,
  open,
  onOpenChange
}) => {
  const [losses, setLosses] = useState({...DEFAULT_LOSSES});

  useEffect(() => {
    if (initialLosses !== 14 && open) {
      // If a custom total was provided but not the breakdown,
      // scale all components proportionally
      const scaleFactor = initialLosses / calculateTotal(DEFAULT_LOSSES);
      const scaledLosses = Object.entries(DEFAULT_LOSSES).reduce((acc, [key, value]) => {
        acc[key as keyof typeof DEFAULT_LOSSES] = parseFloat((value * scaleFactor).toFixed(1));
        return acc;
      }, {...DEFAULT_LOSSES});
      setLosses(scaledLosses);
    } else if (open) {
      setLosses({...DEFAULT_LOSSES});
    }
  }, [initialLosses, open]);

  const calculateTotal = (lossValues: typeof DEFAULT_LOSSES): number => {
    return parseFloat(Object.values(lossValues).reduce((sum, value) => sum + value, 0).toFixed(2));
  };

  const handleLossChange = (key: keyof typeof losses, value: string) => {
    const numericValue = parseFloat(value) || 0;
    const newLosses = { ...losses, [key]: numericValue };
    setLosses(newLosses);
    onLossesChange(calculateTotal(newLosses));
  };

  const handleReset = () => {
    setLosses({...DEFAULT_LOSSES});
    onLossesChange(calculateTotal(DEFAULT_LOSSES));
  };

  const totalLosses = calculateTotal(losses);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">System Losses Breakdown</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground mb-4">
          Modify the parameters below to change the overall System Losses percentage for your system.
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-4">
            <LossField 
              label="Soiling" 
              value={losses.soiling} 
              onChange={(v) => handleLossChange('soiling', v)}
              tooltip="Losses due to dust, dirt, and other foreign matter on the panel surface."
            />
            <LossField 
              label="Shading" 
              value={losses.shading} 
              onChange={(v) => handleLossChange('shading', v)}
              tooltip="Power reduction due to partial or complete shading of the array."
            />
            <LossField 
              label="Snow" 
              value={losses.snow} 
              onChange={(v) => handleLossChange('snow', v)}
              tooltip="System losses due to snow covering the array."
            />
            <LossField 
              label="Mismatch" 
              value={losses.mismatch} 
              onChange={(v) => handleLossChange('mismatch', v)}
              tooltip="Manufacturing tolerance induced losses when connecting panels in series."
            />
            <LossField 
              label="Wiring" 
              value={losses.wiring} 
              onChange={(v) => handleLossChange('wiring', v)}
              tooltip="Resistive losses in the DC and AC wiring."
            />
          </div>
          <div className="space-y-4">
            <LossField 
              label="Connections" 
              value={losses.connections} 
              onChange={(v) => handleLossChange('connections', v)}
              tooltip="Resistive losses in electrical connections."
            />
            <LossField 
              label="Light-Induced Degradation" 
              value={losses.lightInducedDegradation} 
              onChange={(v) => handleLossChange('lightInducedDegradation', v)}
              tooltip="First-year degradation of panel performance."
            />
            <LossField 
              label="Nameplate Rating" 
              value={losses.nameplateRating} 
              onChange={(v) => handleLossChange('nameplateRating', v)}
              tooltip="Difference between manufacturer nameplate rating and actual production."
            />
            <LossField 
              label="Age" 
              value={losses.age} 
              onChange={(v) => handleLossChange('age', v)}
              tooltip="Efficiency loss due to panel age (year-one degradation should be included here)."
            />
            <LossField 
              label="Availability" 
              value={losses.availability} 
              onChange={(v) => handleLossChange('availability', v)}
              tooltip="Losses due to system downtime from grid outages, maintenance, etc."
            />
          </div>
        </div>

        <div className="bg-muted p-4 my-4 text-center rounded-lg">
          <h3 className="text-lg font-medium mb-1">Estimated System Losses:</h3>
          <div className="text-4xl font-bold text-primary">{totalLosses}%</div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-1"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface LossFieldProps {
  label: string;
  value: number;
  onChange: (value: string) => void;
  tooltip?: string;
}

const LossField: React.FC<LossFieldProps> = ({ label, value, onChange, tooltip }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-medium text-muted-foreground">
          {label} (%)
        </label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min="0"
        max="100"
        step="0.1"
        className="w-full"
      />
    </div>
  );
};

export default LossesCalculator;
