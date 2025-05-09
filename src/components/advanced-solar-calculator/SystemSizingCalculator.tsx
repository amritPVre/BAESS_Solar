
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InverterParams } from "@/types/solarCalculations";

interface SystemSizingCalculatorProps {
  selectedPanel: any;
  selectedInverter: any;
  capacity: number;
  onCapacityChange: React.Dispatch<React.SetStateAction<number>>;
  onInverterParamsChange: React.Dispatch<React.SetStateAction<InverterParams | null>>;
  areaBasedLayout: any;
}

const SystemSizingCalculator: React.FC<SystemSizingCalculatorProps> = ({
  selectedPanel,
  selectedInverter,
  capacity,
  onCapacityChange,
  onInverterParamsChange,
  areaBasedLayout
}) => {
  const [dcAcRatio, setDcAcRatio] = useState<number>(120);
  const [moduleCount, setModuleCount] = useState<number>(0);
  const [inverterCount, setInverterCount] = useState<number>(1);

  // Calculate system sizing when dependencies change
  useEffect(() => {
    if (!selectedPanel || !selectedInverter || capacity <= 0) return;

    const panelPowerKw = selectedPanel.power / 1000;
    const inverterPowerKw = selectedInverter.power / 1000;
    
    // Calculate number of panels needed
    const requiredPanelCount = Math.ceil(capacity / panelPowerKw);
    setModuleCount(requiredPanelCount);
    
    // Calculate inverter configuration based on DC/AC ratio
    const requiredAcCapacity = capacity / (dcAcRatio / 100);
    const requiredInverterCount = Math.ceil(requiredAcCapacity / inverterPowerKw);
    setInverterCount(requiredInverterCount);
    
    // Update inverter parameters
    onInverterParamsChange({
      inverter_model: `${selectedInverter.manufacturer} ${selectedInverter.model}`,
      quantity: requiredInverterCount,
      dc_ac_ratio: dcAcRatio / 100,
      power: selectedInverter.power,
      efficiency: selectedInverter.efficiency / 100
    });
    
  }, [selectedPanel, selectedInverter, capacity, dcAcRatio, onInverterParamsChange]);

  // If area-based layout changes, update the capacity
  useEffect(() => {
    if (areaBasedLayout && areaBasedLayout.capacityKw > 0) {
      // Don't update if already equal (avoid infinite loop)
      if (capacity !== areaBasedLayout.capacityKw) {
        onCapacityChange(areaBasedLayout.capacityKw);
      }
    }
  }, [areaBasedLayout, capacity, onCapacityChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Sizing</CardTitle>
        <CardDescription>Configure your solar system capacity and DC/AC ratio</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">System Capacity (kWp)</Label>
              <Input
                id="capacity"
                type="number"
                min="0.1"
                step="0.1"
                value={capacity}
                onChange={(e) => onCapacityChange(Number(e.target.value))}
              />
              {areaBasedLayout && (
                <p className="text-xs text-muted-foreground">
                  Based on area calculation: {areaBasedLayout.moduleCount} modules in {areaBasedLayout.areaM2?.toFixed(1)} m²
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dcAcRatio">DC/AC Ratio (%)</Label>
              <Input
                id="dcAcRatio"
                type="number"
                min="100"
                max="150"
                step="1"
                value={dcAcRatio}
                onChange={(e) => setDcAcRatio(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Recommended range: 110-130% (1.1-1.3)
              </p>
            </div>
          </div>
          
          {selectedPanel && selectedInverter && (
            <>
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">System Configuration</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Panels:</p>
                    <p className="font-medium">
                      {moduleCount} × {selectedPanel.manufacturer} {selectedPanel.model}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPanel.power}W each = {(moduleCount * selectedPanel.power / 1000).toFixed(2)} kWp
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Inverters:</p>
                    <p className="font-medium">
                      {inverterCount} × {selectedInverter.manufacturer} {selectedInverter.model}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedInverter.power}W each = {(inverterCount * selectedInverter.power / 1000).toFixed(2)} kW AC
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemSizingCalculator;
