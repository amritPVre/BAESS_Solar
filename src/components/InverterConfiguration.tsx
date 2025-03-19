
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { InverterParams } from '@/types/solarCalculations';
import { Battery, Settings, Info } from 'lucide-react';

interface InverterConfigurationProps {
  onConfigChange: (config: InverterParams | null) => void;
  initialConfig?: InverterParams | null;
}

// Common inverter models for solar PV systems
const COMMON_INVERTERS = [
  { name: "SolarEdge SE10000H", ac_power: 10.0, max_efficiency: 0.985 },
  { name: "Fronius Primo 8.2-1", ac_power: 8.2, max_efficiency: 0.976 },
  { name: "SMA Sunny Boy 7.7-US", ac_power: 7.7, max_efficiency: 0.975 },
  { name: "Enphase IQ7+", ac_power: 0.295, max_efficiency: 0.97 },
  { name: "ABB UNO-DM-5.0-TL-PLUS", ac_power: 5.0, max_efficiency: 0.971 },
  { name: "Delta M8A", ac_power: 8.0, max_efficiency: 0.982 },
  { name: "Sungrow SG10RT", ac_power: 10.0, max_efficiency: 0.983 },
  { name: "Huawei SUN2000-10KTL", ac_power: 10.0, max_efficiency: 0.984 },
  { name: "Custom", ac_power: 10.0, max_efficiency: 0.97 }
];

const InverterConfiguration: React.FC<InverterConfigurationProps> = ({ onConfigChange, initialConfig }) => {
  const [useInverter, setUseInverter] = useState(!!initialConfig);
  const [selectedInverter, setSelectedInverter] = useState(initialConfig ? "Custom" : COMMON_INVERTERS[0].name);
  const [acPower, setAcPower] = useState(initialConfig?.specifications?.nominal_ac_power || COMMON_INVERTERS[0].ac_power);
  const [efficiency, setEfficiency] = useState(initialConfig?.specifications?.max_efficiency || COMMON_INVERTERS[0].max_efficiency);
  const [numInverters, setNumInverters] = useState(initialConfig?.configuration?.num_inverters || 1);
  const [dcAcRatio, setDcAcRatio] = useState(initialConfig?.configuration?.dc_ac_ratio || 1.2);

  const handleInverterChange = (value: string) => {
    setSelectedInverter(value);
    
    if (value !== "Custom") {
      const inverter = COMMON_INVERTERS.find(inv => inv.name === value);
      if (inverter) {
        setAcPower(inverter.ac_power);
        setEfficiency(inverter.max_efficiency);
      }
    }
  };

  const handleToggleChange = (checked: boolean) => {
    setUseInverter(checked);
    
    if (!checked) {
      onConfigChange(null);
    } else {
      updateInverterConfig();
    }
  };

  const updateInverterConfig = () => {
    if (!useInverter) return;
    
    const config: InverterParams = {
      model: selectedInverter,
      power: acPower,
      efficiency: efficiency,
      count: numInverters,
      dcRatio: dcAcRatio,
      specifications: {
        nominal_ac_power: acPower,
        max_efficiency: efficiency
      },
      configuration: {
        num_inverters: numInverters,
        dc_ac_ratio: dcAcRatio
      }
    };
    
    onConfigChange(config);
  };

  useEffect(() => {
    if (useInverter) {
      updateInverterConfig();
    }
  }, [acPower, efficiency, numInverters, dcAcRatio, useInverter]);

  return (
    <Card className="bg-gradient-to-b from-white to-purple-50 shadow-sm hover:shadow-md transition-all duration-300 w-full animate-fade-in" style={{animationDelay: "150ms"}}>
      <CardHeader className="pb-3">
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Battery className="h-5 w-5 text-purple-600" />
            <span>Inverter Configuration</span>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="use-inverter" className="cursor-pointer">Include inverter details</Label>
            <Switch
              id="use-inverter"
              checked={useInverter}
              onCheckedChange={handleToggleChange}
            />
          </div>
        </CardTitle>
        <CardDescription>
          Specify the inverter details for more accurate solar production estimates
        </CardDescription>
      </CardHeader>
      
      {useInverter && (
        <CardContent className="space-y-5 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inverter-model" className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-purple-600" />
                Inverter Model
              </Label>
              <Select
                value={selectedInverter}
                onValueChange={handleInverterChange}
              >
                <SelectTrigger id="inverter-model" className="border-purple-300/50 focus-visible:ring-purple-500">
                  <SelectValue placeholder="Select an inverter" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_INVERTERS.map((inverter) => (
                    <SelectItem key={inverter.name} value={inverter.name}>
                      {inverter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="num-inverters" className="flex items-center gap-2">
                <Battery className="h-4 w-4 text-purple-600" />
                Number of Inverters
              </Label>
              <Input 
                id="num-inverters"
                type="number"
                min="1"
                value={numInverters}
                onChange={(e) => setNumInverters(Number(e.target.value))}
                className="border-purple-300/50 focus-visible:ring-purple-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ac-power" className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-purple-600" />
                Nominal AC Power (kW)
              </Label>
              <Input 
                id="ac-power"
                type="number"
                step="0.1"
                min="0.1"
                value={acPower}
                onChange={(e) => setAcPower(Number(e.target.value))}
                disabled={selectedInverter !== "Custom"}
                className="border-purple-300/50 focus-visible:ring-purple-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="efficiency" className="flex items-center gap-2">
                <Battery className="h-4 w-4 text-purple-600" />
                Max Efficiency (0-1)
              </Label>
              <Input 
                id="efficiency"
                type="number"
                step="0.001"
                min="0.8"
                max="1"
                value={efficiency}
                onChange={(e) => setEfficiency(Number(e.target.value))}
                disabled={selectedInverter !== "Custom"}
                className="border-purple-300/50 focus-visible:ring-purple-500"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dc-ac-ratio" className="flex items-center gap-2">
              <Info className="h-4 w-4 text-purple-600" />
              DC/AC Ratio
            </Label>
            <div className="flex items-center gap-2">
              <Input 
                id="dc-ac-ratio"
                type="number"
                step="0.1"
                min="1"
                max="2"
                value={dcAcRatio}
                onChange={(e) => setDcAcRatio(Number(e.target.value))}
                className="border-purple-300/50 focus-visible:ring-purple-500"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                (Typical: 1.1-1.3)
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              The DC/AC ratio is the ratio of DC array power to inverter AC rated power
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default InverterConfiguration;
