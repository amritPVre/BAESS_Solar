
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SliderRange, SliderOutput } from "@/components/ui/SliderRange";
import { InverterParams } from '@/types/solarCalculations';
import { Settings, Battery } from 'lucide-react';

export interface SystemSizingCalculatorProps {
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
  const [moduleCount, setModuleCount] = useState(25);
  const [dcAcRatio, setDcAcRatio] = useState(120); // 1.2 default ratio
  const [inverterCount, setInverterCount] = useState(1);
  const [acCapacity, setAcCapacity] = useState(0);

  // Calculate system sizing whenever inputs change
  useEffect(() => {
    if (selectedPanel && selectedInverter) {
      // Calculate panel capacity in kW
      const panelPowerKw = (selectedPanel.power_rating || selectedPanel.power) / 1000;
      
      // If we have an area-based layout, use its values
      if (areaBasedLayout) {
        const calculatedModules = areaBasedLayout.moduleCount;
        setModuleCount(calculatedModules);
        const calculatedCapacity = areaBasedLayout.capacityKw;
        onCapacityChange(calculatedCapacity);
      } else {
        // Otherwise calculate based on module count
        const calculatedCapacity = moduleCount * panelPowerKw;
        onCapacityChange(calculatedCapacity);
      }

      // Calculate inverter requirements
      const inverterPowerKw = selectedInverter.power_rating || selectedInverter.power / 1000;
      const calculatedAcCapacity = inverterCount * inverterPowerKw;
      setAcCapacity(calculatedAcCapacity);

      // Create inverter configuration
      const calculatedDcAcRatio = capacity / calculatedAcCapacity;
      
      onInverterParamsChange({
        inverter_model: selectedInverter.model || selectedInverter.id,
        quantity: inverterCount,
        dc_ac_ratio: calculatedDcAcRatio * 100,
        power: inverterPowerKw,
        efficiency: selectedInverter.efficiency || 0.96
      });
    }
  }, [selectedPanel, selectedInverter, moduleCount, inverterCount, areaBasedLayout, onCapacityChange, onInverterParamsChange, capacity]);

  // Update module count when panel selection changes
  useEffect(() => {
    if (!areaBasedLayout && selectedPanel) {
      // Default to a reasonable system size based on panel power
      const panelPowerKw = (selectedPanel.power_rating || selectedPanel.power) / 1000;
      const defaultCapacityKw = 10; // Target 10 kW system as default
      const suggestedModuleCount = Math.ceil(defaultCapacityKw / panelPowerKw);
      
      setModuleCount(suggestedModuleCount);
    }
  }, [selectedPanel, areaBasedLayout]);

  // Update inverter count when inverter selection changes
  useEffect(() => {
    if (selectedInverter && capacity > 0) {
      const inverterPowerKw = selectedInverter.power_rating || selectedInverter.power / 1000;
      const suggestedInverterCount = Math.max(1, Math.ceil(capacity / inverterPowerKw / (dcAcRatio / 100)));
      
      setInverterCount(suggestedInverterCount);
    }
  }, [selectedInverter, capacity, dcAcRatio]);

  // Calculate system sizing values for display
  const panelPowerW = selectedPanel ? (selectedPanel.power_rating || selectedPanel.power) : 0;
  const inverterPowerKw = selectedInverter ? (selectedInverter.power_rating || selectedInverter.power / 1000) : 0;
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">System Sizing Calculator</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Solar Module Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Number of Panels</span>
                  <span className="font-bold text-right">{moduleCount}</span>
                </div>
                {areaBasedLayout ? (
                  <>
                    <div className="h-2 w-full bg-gray-100 rounded-full">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    <p className="text-xs text-orange-500 mt-1">
                      Module count determined by area calculation
                    </p>
                  </>
                ) : (
                  <>
                    <SliderRange 
                      value={moduleCount}
                      onChange={setModuleCount}
                      min={1}
                      max={200}
                      step={1}
                      disabled={!!areaBasedLayout}
                    />
                  </>
                )}
              </div>
              
              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Panel Model</span>
                  <span className="text-sm font-medium">
                    {selectedPanel ? `${selectedPanel.manufacturer} ${selectedPanel.model}` : 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Panel Power</span>
                  <span className="text-sm font-medium">{panelPowerW} W</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total DC Capacity</span>
                  <span className="text-sm font-medium">{capacity.toFixed(2)} kWp</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Battery className="h-5 w-5" />
              Inverter Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Number of Inverters</span>
                  <span className="font-bold text-right">{inverterCount}</span>
                </div>
                <SliderRange 
                  value={inverterCount}
                  onChange={setInverterCount}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">DC/AC Ratio (%)</span>
                  <span className="font-bold text-right">{dcAcRatio}</span>
                </div>
                <SliderRange 
                  value={dcAcRatio}
                  onChange={setDcAcRatio}
                  min={100}
                  max={150}
                  step={1}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended range: 110-130%
                </p>
              </div>
              
              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Inverter Model</span>
                  <span className="text-sm font-medium">
                    {selectedInverter ? `${selectedInverter.manufacturer} ${selectedInverter.model}` : 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Inverter Power</span>
                  <span className="text-sm font-medium">{inverterPowerKw} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total AC Capacity</span>
                  <span className="text-sm font-medium">{acCapacity.toFixed(2)} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Actual DC/AC Ratio</span>
                  <span className={`text-sm font-medium ${
                    capacity / acCapacity < 1.1 ? 'text-amber-600' : 
                    capacity / acCapacity > 1.3 ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {(capacity / acCapacity * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-8">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Design Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Panel</p>
              <p className="font-medium">{selectedPanel?.manufacturer} {selectedPanel?.model}</p>
              <p className="text-sm">{panelPowerW} W, {selectedPanel?.efficiency}% efficiency</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Inverter</p>
              <p className="font-medium">{selectedInverter?.manufacturer} {selectedInverter?.model}</p>
              <p className="text-sm">{inverterPowerKw} kW, {selectedInverter?.efficiency}% efficiency</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">System Size</p>
              <p className="font-medium">{capacity.toFixed(2)} kWp</p>
              <p className="text-sm">{moduleCount} modules{areaBasedLayout ? ` in ${areaBasedLayout.areaM2.toFixed(1)} m²` : ''}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSizingCalculator;
