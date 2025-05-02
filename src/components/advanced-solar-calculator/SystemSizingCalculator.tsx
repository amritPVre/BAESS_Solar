
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SolarPanel, SolarInverter } from "@/services/solarComponentsService";
import { Badge } from "@/components/ui/badge";
import { Calculator, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SystemSizingCalculatorProps {
  selectedPanel: SolarPanel | null;
  selectedInverter: SolarInverter | null;
  systemCapacity: number;
  dcAcRatio: number;
  onSystemCapacityChange: (value: number) => void;
  onDcAcRatioChange: (value: number) => void;
}

interface SystemSizingResult {
  requiredPanelCount: number;
  requiredInverterCount: number;
  totalInverterCapacity: number;
  actualDcAcRatio: number;
}

const SystemSizingCalculator: React.FC<SystemSizingCalculatorProps> = ({
  selectedPanel,
  selectedInverter,
  systemCapacity,
  dcAcRatio,
  onSystemCapacityChange,
  onDcAcRatioChange
}) => {
  const [systemSizing, setSystemSizing] = useState<SystemSizingResult | null>(null);
  
  useEffect(() => {
    if (selectedPanel && selectedInverter && systemCapacity > 0 && dcAcRatio > 0) {
      calculateSystemSizing();
    } else {
      setSystemSizing(null);
    }
  }, [selectedPanel, selectedInverter, systemCapacity, dcAcRatio]);

  const calculateSystemSizing = () => {
    if (!selectedPanel || !selectedInverter) return;

    const panelPowerKw = selectedPanel.nominal_power_w / 1000;
    const inverterPowerKw = selectedInverter.nominal_ac_power_kw;
    
    const totalPvCapacityKw = systemCapacity;
    
    const targetAcCapacityKw = totalPvCapacityKw / (dcAcRatio / 100);
    
    const requiredInverterCount = Math.ceil(targetAcCapacityKw / inverterPowerKw);
    
    const totalInverterCapacity = requiredInverterCount * inverterPowerKw;
    
    const requiredPanelCount = Math.ceil(totalPvCapacityKw / panelPowerKw);
    
    const actualDcAcRatio = (totalPvCapacityKw / totalInverterCapacity) * 100;

    setSystemSizing({
      requiredPanelCount,
      requiredInverterCount,
      totalInverterCapacity,
      actualDcAcRatio
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          System Sizing Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="systemCapacity">System Capacity (kW)</Label>
              <span className="text-sm font-medium">{systemCapacity.toFixed(1)} kW</span>
            </div>
            <Slider 
              id="systemCapacity"
              min={1} 
              max={500} 
              step={0.1} 
              value={[systemCapacity]} 
              onValueChange={(value) => onSystemCapacityChange(value[0])}
            />
            <Input 
              id="systemCapacity" 
              type="number" 
              min={1} 
              max={500} 
              step={0.1}
              value={systemCapacity}
              onChange={(e) => onSystemCapacityChange(Number(e.target.value))}
              className="mt-2"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="dcAcRatio">DC/AC Ratio (%)</Label>
              <span className="text-sm font-medium">{dcAcRatio.toFixed(1)}%</span>
            </div>
            <Slider 
              id="dcAcRatio"
              min={80} 
              max={150} 
              step={1} 
              value={[dcAcRatio]} 
              onValueChange={(value) => onDcAcRatioChange(value[0])}
            />
            <Input 
              id="dcAcRatio" 
              type="number" 
              min={80} 
              max={150} 
              step={1}
              value={dcAcRatio}
              onChange={(e) => onDcAcRatioChange(Number(e.target.value))}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Recommended range: 110-130% (1.1-1.3)
            </p>
          </div>
        </div>

        {systemSizing ? (
          <div className="mt-4 bg-muted p-4 rounded-md border">
            <h3 className="font-medium text-lg mb-2">System Sizing Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-medium">Solar Panels</p>
                <p>{systemSizing.requiredPanelCount} x {selectedPanel?.manufacturer} {selectedPanel?.model}</p>
                <p>({(selectedPanel?.nominal_power_w || 0) / 1000} kW each)</p>
                <p>Total: {systemCapacity} kWp</p>
              </div>
              <div>
                <p className="font-medium">Inverters</p>
                <p>{systemSizing.requiredInverterCount} x {selectedInverter?.manufacturer} {selectedInverter?.model}</p>
                <p>({selectedInverter?.nominal_ac_power_kw} kW each)</p>
                <p>Total AC capacity: {systemSizing.totalInverterCapacity.toFixed(1)} kW</p>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center gap-2">
                  <p className="font-medium">Actual DC/AC Ratio:</p>
                  <Badge>{systemSizing.actualDcAcRatio.toFixed(1)}%</Badge>
                </div>
                {systemSizing.actualDcAcRatio < 110 ? (
                  <Alert variant="warning" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      DC/AC ratio is lower than recommended (110-130%). Consider reducing inverter size or increasing panel capacity.
                    </AlertDescription>
                  </Alert>
                ) : systemSizing.actualDcAcRatio > 130 ? (
                  <Alert variant="warning" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      DC/AC ratio is higher than recommended (110-130%). Consider increasing inverter size or reducing panel capacity.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="default" className="bg-green-50 mt-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                      DC/AC ratio is within the recommended range (110-130%).
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 bg-muted/50 p-6 rounded-md flex justify-center items-center border border-dashed">
            <p className="text-muted-foreground">
              {!selectedPanel || !selectedInverter ? 
                "Select both a panel and inverter to view system sizing" : 
                "Adjust system parameters to calculate sizing"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemSizingCalculator;
