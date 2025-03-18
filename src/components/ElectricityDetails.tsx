
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Zap } from "lucide-react";
import { ElectricityData } from "@/utils/financialCalculator";

interface ElectricityDetailsProps {
  currency: string;
  currencySymbol: string;
  defaultTariff: number;
  onSave: (electricityData: ElectricityData) => void;
  yearlyGeneration?: number;
}

const ElectricityDetails: React.FC<ElectricityDetailsProps> = ({
  currency,
  currencySymbol,
  defaultTariff,
  onSave,
  yearlyGeneration
}) => {
  const [systemType, setSystemType] = useState<"Captive Consumption" | "Grid Export Only">("Captive Consumption");
  const [consumptionEnabled, setConsumptionEnabled] = useState(true);
  const [consumptionMethod, setConsumptionMethod] = useState<"average" | "detailed">("average");
  const [monthlyConsumption, setMonthlyConsumption] = useState(1000);
  const [monthlyData, setMonthlyData] = useState<Record<string, number>>({
    Jan: 1000, Feb: 1000, Mar: 1000, Apr: 1000, May: 1000, Jun: 1000,
    Jul: 1000, Aug: 1000, Sep: 1000, Oct: 1000, Nov: 1000, Dec: 1000
  });
  
  const [tariffType, setTariffType] = useState<"flat" | "slab">("flat");
  const [flatRate, setFlatRate] = useState(defaultTariff);
  const [slabs, setSlabs] = useState<Array<{ units: number; rate: number }>>([
    { units: 100, rate: defaultTariff }
  ]);
  
  const [yearlyAmount, setYearlyAmount] = useState(0);

  // Calculate yearly consumption
  const yearlyConsumption = consumptionMethod === "average" 
    ? monthlyConsumption * 12 
    : Object.values(monthlyData).reduce((sum, val) => sum + val, 0);

  // Update monthly data handler
  const handleMonthlyDataChange = (month: string, value: number) => {
    setMonthlyData(prev => ({
      ...prev,
      [month]: value
    }));
  };

  // Add a new slab
  const addSlab = () => {
    const lastSlab = slabs[slabs.length - 1];
    setSlabs([...slabs, { units: lastSlab.units + 100, rate: lastSlab.rate }]);
  };

  // Update slab data
  const updateSlab = (index: number, field: 'units' | 'rate', value: number) => {
    const newSlabs = [...slabs];
    newSlabs[index][field] = value;
    setSlabs(newSlabs);
  };

  // Calculate yearly amount based on tariff type and consumption
  const calculateYearlyAmount = () => {
    // For Grid Export, use yearly generation instead of consumption
    const energyToCalculate = systemType === "Grid Export Only" 
      ? (yearlyGeneration || 0) 
      : yearlyConsumption;
    
    let calculatedAmount = 0;
    
    if (tariffType === "flat") {
      calculatedAmount = energyToCalculate * flatRate;
    } else {
      // For slab-based tariff, approximate monthly amount and multiply by 12
      const monthlyEnergy = energyToCalculate / 12;
      let monthlyCost = calculateSlabCost(monthlyEnergy, slabs);
      calculatedAmount = monthlyCost * 12;
    }
    
    setYearlyAmount(calculatedAmount);
    return calculatedAmount;
  };

  // Calculate cost for slab-based tariff
  const calculateSlabCost = (consumption: number, slabsData: Array<{ units: number; rate: number }>): number => {
    let total = 0;
    let remaining = consumption;
    
    for (let i = 0; i < slabsData.length; i++) {
      if (i === 0) {
        // First slab
        const units = Math.min(remaining, slabsData[i].units);
        total += units * slabsData[i].rate;
        remaining -= units;
      } else {
        // Higher slabs
        const prevUnits = slabsData[i-1].units;
        const units = Math.min(remaining, slabsData[i].units - prevUnits);
        total += units * slabsData[i].rate;
        remaining -= units;
      }
      
      if (remaining <= 0) break;
      
      // If this is the last slab and there are remaining units
      if (i === slabsData.length - 1 && remaining > 0) {
        total += remaining * slabsData[i].rate;
      }
    }
    
    return total;
  };

  // Handle save button click
  const handleSave = () => {
    const finalAmount = calculateYearlyAmount();
    
    // Create consumption data based on method
    let consumptionData = null;
    if (systemType === "Captive Consumption" && consumptionEnabled) {
      if (consumptionMethod === "average") {
        consumptionData = { type: "average", value: monthlyConsumption };
      } else {
        consumptionData = { type: "detailed", values: monthlyData };
      }
    }
    
    // Create tariff data based on type
    let tariffData;
    if (tariffType === "flat") {
      tariffData = { type: "flat", rate: flatRate };
    } else {
      tariffData = { type: "slab", slabs: slabs };
    }
    
    // Combine data
    const electricityData: ElectricityData = {
      system_type: systemType,
      consumption: consumptionData,
      tariff: tariffData,
      yearly_amount: finalAmount
    };
    
    onSave(electricityData);
  };

  return (
    <div className="glass-card rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <h2 className="section-title flex items-center">
        <Zap className="w-6 h-6 mr-2 text-solar" />
        Electricity Consumption & Tariff
      </h2>
      
      <div className="space-y-6 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={systemType} 
              onValueChange={(value) => setSystemType(value as "Captive Consumption" | "Grid Export Only")}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Captive Consumption" id="captive" />
                <Label htmlFor="captive" className="cursor-pointer">
                  Captive Consumption (Self-use of solar power)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Grid Export Only" id="export" />
                <Label htmlFor="export" className="cursor-pointer">
                  Grid Export Only (Sell all power to grid)
                </Label>
              </div>
            </RadioGroup>
            
            {systemType === "Grid Export Only" && yearlyGeneration && (
              <div className="mt-4 p-3 bg-muted/30 rounded-md">
                <p className="text-sm text-muted-foreground">
                  Your system will export approximately <span className="font-medium">{yearlyGeneration.toLocaleString()} kWh</span> of 
                  electricity to the grid annually.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {systemType === "Captive Consumption" && (
          <Card>
            <CardHeader>
              <CardTitle>Consumption Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <input 
                  type="checkbox" 
                  id="consumptionEnabled" 
                  checked={consumptionEnabled}
                  onChange={(e) => setConsumptionEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-solar focus:ring-solar"
                />
                <Label htmlFor="consumptionEnabled" className="cursor-pointer">
                  Include consumption data in financial analysis
                </Label>
              </div>
              
              {consumptionEnabled && (
                <div className="animate-in fade-in duration-500">
                  <div className="mb-4">
                    <Label>How would you like to input electricity consumption?</Label>
                    <RadioGroup 
                      value={consumptionMethod} 
                      onValueChange={(value) => setConsumptionMethod(value as "average" | "detailed")}
                      className="flex space-x-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="average" id="average" />
                        <Label htmlFor="average" className="cursor-pointer">Monthly Average</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="detailed" id="detailed" />
                        <Label htmlFor="detailed" className="cursor-pointer">Month-wise Details</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {consumptionMethod === "average" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="monthlyConsumption">Average monthly consumption (kWh)</Label>
                        <Input
                          id="monthlyConsumption"
                          type="number"
                          min={0}
                          value={monthlyConsumption}
                          onChange={(e) => setMonthlyConsumption(Number(e.target.value))}
                        />
                      </div>
                      <div className="flex items-center justify-center bg-muted/20 rounded-md p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Yearly Consumption</p>
                          <p className="text-2xl font-bold">{(monthlyConsumption * 12).toLocaleString()} kWh</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Label>Enter month-wise consumption:</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.keys(monthlyData).map((month) => (
                          <div key={month} className="space-y-1">
                            <Label htmlFor={`month_${month}`}>{month} (kWh)</Label>
                            <Input
                              id={`month_${month}`}
                              type="number"
                              min={0}
                              value={monthlyData[month]}
                              onChange={(e) => handleMonthlyDataChange(month, Number(e.target.value))}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-muted/20 rounded-md p-3">
                          <p className="text-sm text-muted-foreground">Total Yearly Consumption</p>
                          <p className="text-xl font-bold">
                            {Object.values(monthlyData).reduce((sum, val) => sum + val, 0).toLocaleString()} kWh
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Electricity Tariff Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tariffType} onValueChange={(value) => setTariffType(value as "flat" | "slab")}>
              <TabsList className="mb-4">
                <TabsTrigger value="flat">Flat Rate</TabsTrigger>
                <TabsTrigger value="slab">Slab-based</TabsTrigger>
              </TabsList>
              
              <TabsContent value="flat">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="flatRate">Electricity rate ({currencySymbol}/kWh)</Label>
                      <Input
                        id="flatRate"
                        type="number"
                        min={0}
                        step={0.01}
                        value={flatRate}
                        onChange={(e) => setFlatRate(Number(e.target.value))}
                      />
                    </div>
                    <div className="flex items-center justify-center bg-muted/20 rounded-md p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Estimated Yearly {systemType === "Grid Export Only" ? "Revenue" : "Electricity Cost"}
                        </p>
                        <p className="text-2xl font-bold">
                          {currencySymbol}{(
                            (systemType === "Grid Export Only" 
                              ? (yearlyGeneration || 0) 
                              : yearlyConsumption) 
                            * flatRate
                          ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="slab">
                <div className="space-y-4">
                  <Label>Enter slab-wise rates:</Label>
                  
                  {slabs.map((slab, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 p-3 border rounded-md bg-muted/10">
                      <div className="space-y-1">
                        <Label htmlFor={`slab_${index}_units`}>
                          {index === 0 ? "Units up to:" : `Units from ${slabs[index-1].units} to:`}
                        </Label>
                        <Input
                          id={`slab_${index}_units`}
                          type="number"
                          min={index === 0 ? 0 : slabs[index-1].units + 1}
                          value={slab.units}
                          onChange={(e) => updateSlab(index, "units", Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`slab_${index}_rate`}>Rate ({currencySymbol}/kWh)</Label>
                        <Input
                          id={`slab_${index}_rate`}
                          type="number"
                          min={0}
                          step={0.01}
                          value={slab.rate}
                          onChange={(e) => updateSlab(index, "rate", Number(e.target.value))}
                        />
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addSlab}
                    className="flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Another Slab
                  </Button>
                  
                  <div className="flex justify-end mt-4">
                    <div className="bg-muted/20 rounded-md p-3">
                      <p className="text-sm text-muted-foreground">
                        Estimated Yearly {systemType === "Grid Export Only" ? "Revenue" : "Electricity Cost"}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => calculateYearlyAmount()}
                        className="mt-1 text-sm"
                      >
                        Click to calculate
                      </Button>
                      {yearlyAmount > 0 && (
                        <p className="text-xl font-bold mt-1">
                          {currencySymbol}{yearlyAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} className="bg-solar hover:bg-solar-dark text-white">
          Save Electricity Data
        </Button>
      </div>
    </div>
  );
};

export default ElectricityDetails;
