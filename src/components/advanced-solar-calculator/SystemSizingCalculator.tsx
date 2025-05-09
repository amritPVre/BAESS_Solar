
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { InverterParams } from '@/utils/solarEnergyCalculation';
import { SliderRange, SliderOutput } from '@/components/ui/SliderRange';

interface SystemSizingCalculatorProps {
  selectedPanel: any;
  selectedInverter: any;
  capacity: number;
  onCapacityChange: (capacity: number) => void;
  onInverterParamsChange: (params: InverterParams) => void;
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
  const [dcAcRatio, setDcAcRatio] = React.useState(1.2); // Default 1.2 (120%)
  const [inverterCount, setInverterCount] = React.useState(1);
  
  // Calculate number of panels based on capacity
  const calculatePanels = () => {
    if (!selectedPanel) return 0;
    const panelPowerKw = (selectedPanel.power_rating || selectedPanel.power) / 1000;
    return Math.ceil(capacity / panelPowerKw);
  };
  
  // Calculate system details
  React.useEffect(() => {
    if (selectedInverter) {
      const inverterPower = selectedInverter.power || selectedInverter.power_rating || 0;
      const totalInverterPower = inverterPower * inverterCount / 1000; // kW
      
      // Update inverter params
      onInverterParamsChange({
        inverter_model: selectedInverter.model,
        quantity: inverterCount,
        dc_ac_ratio: dcAcRatio,
        power: inverterPower,
        efficiency: selectedInverter.efficiency
      });
    }
  }, [selectedInverter, inverterCount, dcAcRatio, onInverterParamsChange]);
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">System Size</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block mb-2">System Capacity (kW)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => onCapacityChange(parseFloat(e.target.value) || 0)}
                    min="0.1"
                    step="0.1" 
                    className="w-24 p-2 border rounded"
                  />
                  <div className="flex-grow">
                    <SliderRange 
                      value={capacity}
                      onChange={onCapacityChange}
                      min={0.5}
                      max={100}
                      step={0.5}
                    />
                  </div>
                </div>
                
                {areaBasedLayout && (
                  <p className="text-sm text-green-600 mt-1">
                    Based on area calculation: {areaBasedLayout.moduleCount} modules, {areaBasedLayout.capacityKw.toFixed(2)} kW
                  </p>
                )}
              </div>
              
              <div>
                <label className="block mb-2">Module Count</label>
                <div className="p-2 border rounded bg-gray-50">
                  <p className="font-semibold">{calculatePanels()} modules</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Inverter Configuration</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block mb-2">Number of Inverters</label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={inverterCount}
                    onChange={(e) => setInverterCount(parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-24 p-2 border rounded"
                  />
                  <div className="flex-grow">
                    <SliderRange
                      value={inverterCount}
                      onChange={setInverterCount}
                      min={1}
                      max={20}
                      step={1}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block mb-2">DC/AC Ratio</label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={dcAcRatio.toFixed(2)}
                    onChange={(e) => setDcAcRatio(parseFloat(e.target.value) || 1.2)}
                    min="0.8"
                    max="1.5"
                    step="0.01"
                    className="w-24 p-2 border rounded"
                  />
                  <div className="flex-grow">
                    <SliderRange
                      value={dcAcRatio * 100}
                      onChange={(value) => setDcAcRatio(value / 100)}
                      min={80}
                      max={150}
                      step={1}
                    />
                  </div>
                  <div className="w-12 text-center font-medium">{(dcAcRatio * 100).toFixed(0)}%</div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Recommended range: 110-130% (1.1-1.3)
                </p>
              </div>
              
              {selectedInverter && (
                <div>
                  <label className="block mb-2">Inverter AC Capacity</label>
                  <div className="p-2 border rounded bg-gray-50">
                    <p className="font-semibold">
                      {((selectedInverter.power || selectedInverter.power_rating || 0) * inverterCount / 1000).toFixed(2)} kW
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemSizingCalculator;
