
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SliderRange, SliderOutput } from '../ui/SliderRange';
import { InverterParams } from '@/types/solarCalculations';

interface SystemSizingCalculatorProps {
  selectedPanel: any;
  selectedInverter: any;
  systemSize: number; // Changed from capacity to systemSize
  onSystemSizeChange: (systemSize: number) => void; // Changed from onCapacityChange
  onInverterParamsChange: (params: InverterParams | null) => void;
  areaBasedLayout: any;
}

const SystemSizingCalculator: React.FC<SystemSizingCalculatorProps> = ({
  selectedPanel,
  selectedInverter,
  systemSize, // Changed from capacity
  onSystemSizeChange, // Changed from onCapacityChange
  onInverterParamsChange,
  areaBasedLayout
}) => {
  // State for panel count and inverter count
  const [panelCount, setPanelCount] = useState(0);
  const [inverterCount, setInverterCount] = useState(1);
  const [dcAcRatio, setDcAcRatio] = useState(1.2);

  // Update panel count and inverter count when system size changes
  useEffect(() => {
    if (selectedPanel && selectedPanel.power_rating) {
      const estimatedPanels = Math.ceil((systemSize * 1000) / selectedPanel.power_rating);
      setPanelCount(estimatedPanels);
    }

    if (selectedInverter && selectedInverter.power) {
      const estimatedInverters = Math.ceil(systemSize / selectedInverter.power);
      setInverterCount(estimatedInverters);
      
      // Update DC/AC ratio
      if (selectedPanel && selectedPanel.power_rating) {
        const panelCapacity = (panelCount * selectedPanel.power_rating) / 1000;
        const inverterCapacity = inverterCount * selectedInverter.power;
        
        if (inverterCapacity > 0) {
          setDcAcRatio(panelCapacity / inverterCapacity);
        }
      }
    }
  }, [systemSize, selectedPanel, selectedInverter, panelCount, inverterCount]);
  
  // Update inverter parameters
  useEffect(() => {
    if (selectedInverter && inverterCount > 0) {
      const inverterParams: InverterParams = {
        inverter_model: `${selectedInverter.manufacturer} ${selectedInverter.model}`,
        quantity: inverterCount,
        dc_ac_ratio: dcAcRatio,
        power: selectedInverter.power,
        efficiency: selectedInverter.efficiency || 0.97
      };
      
      onInverterParamsChange(inverterParams);
    } else {
      onInverterParamsChange(null);
    }
  }, [selectedInverter, inverterCount, dcAcRatio, onInverterParamsChange]);

  // Handle change in panel count
  const handlePanelCountChange = (newPanelCount: number) => {
    setPanelCount(newPanelCount);
    
    if (selectedPanel && selectedPanel.power_rating) {
      const newSystemSize = (newPanelCount * selectedPanel.power_rating) / 1000;
      onSystemSizeChange(newSystemSize);
    }
  };
  
  // Handle change in inverter count
  const handleInverterCountChange = (newInverterCount: number) => {
    setInverterCount(newInverterCount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Sizing Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedPanel && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="panelCount">Number of Panels</Label>
              <div className="flex items-center space-x-4">
                <Input
                  id="panelCount"
                  type="number"
                  min={1}
                  value={panelCount}
                  onChange={(e) => handlePanelCountChange(parseInt(e.target.value) || 0)}
                  className="w-24"
                />
                <SliderRange
                  min={1}
                  max={1000}
                  step={1}
                  value={panelCount}
                  onChange={handlePanelCountChange}
                />
                <SliderOutput value={panelCount} />
              </div>
              {selectedPanel && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedPanel.manufacturer} {selectedPanel.model} ({selectedPanel.power_rating || 0}W)
                </p>
              )}
            </div>
            
            {selectedInverter && (
              <div>
                <Label htmlFor="inverterCount">Number of Inverters</Label>
                <div className="flex items-center space-x-4">
                  <Input
                    id="inverterCount"
                    type="number"
                    min={1}
                    value={inverterCount}
                    onChange={(e) => handleInverterCountChange(parseInt(e.target.value) || 1)}
                    className="w-24"
                  />
                  <SliderRange
                    min={1}
                    max={50}
                    step={1}
                    value={inverterCount}
                    onChange={handleInverterCountChange}
                  />
                  <SliderOutput value={inverterCount} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedInverter.manufacturer} {selectedInverter.model} ({selectedInverter.power || 0}kW)
                </p>
              </div>
            )}
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-medium mb-2">System Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">System Size</p>
                  <p className="text-xl font-bold">{systemSize.toFixed(2)} kW</p>
                </div>
                {selectedInverter && (
                  <div>
                    <p className="text-sm text-gray-600">DC/AC Ratio</p>
                    <p className="text-xl font-bold">{dcAcRatio.toFixed(2)}</p>
                  </div>
                )}
                {areaBasedLayout && (
                  <div>
                    <p className="text-sm text-gray-600">Area Coverage</p>
                    <p className="text-xl font-bold">{areaBasedLayout.areaM2.toFixed(1)} m²</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {!selectedPanel && (
          <div className="p-8 text-center">
            <p className="text-gray-400">Please select a panel first</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemSizingCalculator;
