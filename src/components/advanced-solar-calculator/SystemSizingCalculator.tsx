import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [inverterCount, setInverterCount] = useState(1);
  const [acCapacity, setAcCapacity] = useState(0);
  const dcAcRatio = 120; // Fixed value, no longer user input

  // Calculate system sizing whenever inputs change
  useEffect(() => {
    if (selectedPanel && selectedInverter) {
      // Calculate panel capacity in kW
      const panelPowerKw = (selectedPanel.power_rating || selectedPanel.power) / 1000;
      
      // If we have an area-based layout, use its values
      if (areaBasedLayout && areaBasedLayout.moduleCount > 0) {
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
      const inverterPowerKw = selectedInverter.power_rating || selectedInverter.nominal_ac_power_kw || 1;
      const calculatedAcCapacity = inverterCount * inverterPowerKw;
      setAcCapacity(calculatedAcCapacity);

      // Create inverter configuration
      const calculatedDcAcRatio = capacity / calculatedAcCapacity;
      
      onInverterParamsChange({
        inverter_model: selectedInverter.model || selectedInverter.id,
        quantity: inverterCount,
        dc_ac_ratio: dcAcRatio,
        power: inverterPowerKw,
        efficiency: selectedInverter.efficiency || 0.96
      });
    }
  }, [selectedPanel, selectedInverter, moduleCount, inverterCount, areaBasedLayout, onCapacityChange, onInverterParamsChange, capacity, dcAcRatio]);

  // Update inverter count when inverter selection changes
  useEffect(() => {
    if (selectedInverter && capacity > 0) {
      const inverterPowerKw = selectedInverter.power_rating || selectedInverter.nominal_ac_power_kw || 1;
      const suggestedInverterCount = Math.max(1, Math.ceil(capacity / inverterPowerKw / (dcAcRatio / 100)));
      
      setInverterCount(suggestedInverterCount);
    }
  }, [selectedInverter, capacity, dcAcRatio]);

  // Calculate system sizing values for display
  const panelPowerW = selectedPanel ? (selectedPanel.power_rating || selectedPanel.nominal_power_w || 0) : 0;
  const inverterPowerKw = selectedInverter ? (selectedInverter.power_rating || selectedInverter.nominal_ac_power_kw || 0) : 0;
  
  // Check if area calculation has been performed
  const hasAreaBasedLayout = areaBasedLayout && areaBasedLayout.moduleCount > 0;
  
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
                  <span className="font-bold text-right">{moduleCount || 0}</span>
                </div>
                
                {hasAreaBasedLayout && (
                  <p className="text-xs text-orange-500 mt-1 mb-2">
                    Module count determined by area calculation
                  </p>
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
                  <span className="text-sm font-medium">{panelPowerW || 0} W</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total DC Capacity</span>
                  <span className="text-sm font-medium">{capacity ? capacity.toFixed(2) : "0.00"} kWp</span>
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
                  <span className="text-sm font-medium">{inverterPowerKw > 0 ? `${inverterPowerKw} kW` : '0 kW'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total AC Capacity</span>
                  <span className="text-sm font-medium">{acCapacity > 0 ? `${acCapacity.toFixed(2)} kW` : '0.00 kW'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">DC/AC Ratio</span>
                  <span className={`text-sm font-medium ${
                    acCapacity === 0 ? '' :
                    capacity / acCapacity < 1.1 ? 'text-amber-600' : 
                    capacity / acCapacity > 1.3 ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {acCapacity > 0 ? `${(capacity / acCapacity * 100).toFixed(1)}%` : '0.0%'}
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
              <p className="font-medium">
                {selectedPanel ? `${selectedPanel.manufacturer} ${selectedPanel.model}` : 'Not selected'}
              </p>
              <p className="text-sm">
                {selectedPanel 
                  ? `${panelPowerW} W, ${selectedPanel.efficiency_percent || selectedPanel.efficiency || ''}%` 
                  : '-'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Inverter</p>
              <p className="font-medium">
                {selectedInverter ? `${selectedInverter.manufacturer} ${selectedInverter.model}` : 'Not selected'}
              </p>
              <p className="text-sm">
                {selectedInverter 
                  ? `${inverterPowerKw} kW, ${selectedInverter.efficiency_percent || selectedInverter.efficiency || ''}%` 
                  : '-'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">System Size</p>
              <p className="font-medium">{capacity > 0 ? `${capacity.toFixed(2)} kWp` : '0.00 kWp'}</p>
              <p className="text-sm">
                {moduleCount > 0 
                  ? `${moduleCount} modules${hasAreaBasedLayout ? ` in ${areaBasedLayout.areaM2 ? areaBasedLayout.areaM2.toFixed(1) : '0.0'} m²` : ''}` 
                  : '0 modules'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-4">
        <Button variant="outline">Back</Button>
        <Button>Continue to PV Areas</Button>
      </div>
    </div>
  );
};

export default SystemSizingCalculator;
