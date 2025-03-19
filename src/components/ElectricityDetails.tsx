
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ElectricityData } from "@/types/solarCalculations";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Check, DollarSign, Zap } from "lucide-react";

interface ElectricityDetailsProps {
  currency: string;
  currencySymbol: string;
  defaultTariff: number;
  onSave: (data: ElectricityData) => void;
  yearlyGeneration: number;
}

const ElectricityDetails: React.FC<ElectricityDetailsProps> = ({
  currency,
  currencySymbol,
  defaultTariff,
  onSave,
  yearlyGeneration
}) => {
  // System type
  const [systemType, setSystemType] = useState<string>("Captive Consumption");
  
  // Consumption data
  const [consumptionEnabled, setConsumptionEnabled] = useState<boolean>(true);
  const [consumptionMethod, setConsumptionMethod] = useState<string>("Monthly Average");
  const [monthlyConsumption, setMonthlyConsumption] = useState<number>(1000);
  
  // Monthly detailed consumption
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [monthlyData, setMonthlyData] = useState<Record<string, number>>(
    months.reduce((acc, month) => ({ ...acc, [month]: 1000 }), {})
  );
  
  // Tariff structure
  const [tariffType, setTariffType] = useState<string>("Flat Rate");
  const [flatRate, setFlatRate] = useState<number>(defaultTariff);
  
  // Slab-based tariff
  const [slabs, setSlabs] = useState<{ units: number; rate: number }[]>([
    { units: 100, rate: defaultTariff }
  ]);
  
  const handleMonthlyDataChange = (month: string, value: number) => {
    setMonthlyData(prev => ({
      ...prev,
      [month]: value
    }));
  };
  
  const addSlab = () => {
    const lastSlab = slabs[slabs.length - 1];
    setSlabs([...slabs, { units: lastSlab.units + 100, rate: lastSlab.rate }]);
  };
  
  const updateSlab = (index: number, field: keyof typeof slabs[0], value: number) => {
    const newSlabs = [...slabs];
    newSlabs[index] = { ...newSlabs[index], [field]: value };
    setSlabs(newSlabs);
  };
  
  const calculateYearlyAmount = (): number => {
    if (systemType === "Grid Export Only") {
      if (tariffType === "Flat Rate") {
        return yearlyGeneration * flatRate;
      } else {
        // For slab-based tariff with grid export - rough estimation
        const monthlyGeneration = yearlyGeneration / 12;
        return calculateSlabCost(monthlyGeneration) * 12;
      }
    } else if (consumptionEnabled) {
      if (tariffType === "Flat Rate") {
        if (consumptionMethod === "Monthly Average") {
          return monthlyConsumption * 12 * flatRate;
        } else {
          return Object.values(monthlyData).reduce((sum, val) => sum + val, 0) * flatRate;
        }
      } else {
        if (consumptionMethod === "Monthly Average") {
          return calculateSlabCost(monthlyConsumption) * 12;
        } else {
          return Object.values(monthlyData).reduce((sum, val) => sum + calculateSlabCost(val), 0);
        }
      }
    }
    
    return 0;
  };
  
  const calculateSlabCost = (consumption: number): number => {
    let totalCost = 0;
    let remainingUnits = consumption;
    
    for (let i = 0; i < slabs.length; i++) {
      const currentSlab = slabs[i];
      const previousLimit = i > 0 ? slabs[i-1].units : 0;
      const slabSize = currentSlab.units - previousLimit;
      
      const unitsInThisSlab = Math.min(remainingUnits, slabSize);
      totalCost += unitsInThisSlab * currentSlab.rate;
      remainingUnits -= unitsInThisSlab;
      
      if (remainingUnits <= 0) break;
      
      // If this is the last slab and there are still remaining units
      if (i === slabs.length - 1 && remainingUnits > 0) {
        totalCost += remainingUnits * currentSlab.rate;
      }
    }
    
    return totalCost;
  };
  
  const handleSave = () => {
    // Prepare consumption data
    let consumption = null;
    if (systemType === "Captive Consumption" && consumptionEnabled) {
      if (consumptionMethod === "Monthly Average") {
        consumption = { type: "average", value: monthlyConsumption };
      } else {
        consumption = { type: "detailed", values: monthlyData };
      }
    }
    
    // Prepare tariff data
    const tariff = tariffType === "Flat Rate"
      ? { type: "flat", rate: flatRate }
      : { type: "slab", slabs };
    
    // Calculate yearly amount
    const yearlyAmount = calculateYearlyAmount();
    
    // Prepare the complete electricity data
    const electricityData: ElectricityData = {
      system_type: systemType,
      consumption,
      tariff,
      yearly_amount: yearlyAmount
    };
    
    onSave(electricityData);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-solar" />
            <span>Electricity Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">System Type</h3>
            <RadioGroup 
              defaultValue="Captive Consumption"
              value={systemType}
              onValueChange={setSystemType}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Captive Consumption" id="captive" />
                <Label htmlFor="captive">Captive Consumption (Self-Use)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Grid Export Only" id="grid" />
                <Label htmlFor="grid">Grid Export Only (Feed-in Tariff)</Label>
              </div>
            </RadioGroup>
            
            {systemType === "Grid Export Only" && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                <p className="text-sm text-amber-800">
                  System configured for direct grid export. Only tariff information will be used for financial calculations.
                </p>
              </div>
            )}
          </div>
          
          {systemType === "Captive Consumption" && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Label htmlFor="consumption-enabled" className="text-lg font-medium">
                  Consumption Data
                </Label>
                <div className="flex-1"></div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="consumption-enabled"
                    checked={consumptionEnabled}
                    onChange={e => setConsumptionEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-solar focus:ring-solar"
                  />
                  <Label htmlFor="consumption-enabled">Include consumption data</Label>
                </div>
              </div>
              
              {consumptionEnabled && (
                <div className="space-y-4">
                  <RadioGroup 
                    defaultValue="Monthly Average"
                    value={consumptionMethod}
                    onValueChange={setConsumptionMethod}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Monthly Average" id="monthly-avg" />
                      <Label htmlFor="monthly-avg">Monthly Average</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Month-wise Details" id="monthly-detail" />
                      <Label htmlFor="monthly-detail">Month-wise Details</Label>
                    </div>
                  </RadioGroup>
                  
                  {consumptionMethod === "Monthly Average" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="monthly-consumption">Average monthly consumption (kWh)</Label>
                        <Input
                          id="monthly-consumption"
                          type="number"
                          min="0"
                          step="100"
                          value={monthlyConsumption}
                          onChange={e => setMonthlyConsumption(Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Yearly Consumption</Label>
                        <div className="h-10 bg-gray-100 rounded-md flex items-center px-3 font-medium">
                          {(monthlyConsumption * 12).toLocaleString()} kWh
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-medium mb-2">Enter month-wise consumption:</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {months.map(month => (
                          <div key={month} className="space-y-1">
                            <Label htmlFor={`month-${month}`}>{month} (kWh)</Label>
                            <Input
                              id={`month-${month}`}
                              type="number"
                              min="0"
                              step="100"
                              value={monthlyData[month]}
                              onChange={e => handleMonthlyDataChange(month, Number(e.target.value))}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 text-right">
                        <span className="font-medium">Total yearly consumption: </span>
                        {Object.values(monthlyData).reduce((sum, val) => sum + val, 0).toLocaleString()} kWh
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-medium mb-4">Electricity Tariff Structure</h3>
            <RadioGroup 
              defaultValue="Flat Rate"
              value={tariffType}
              onValueChange={setTariffType}
              className="flex flex-col space-y-2 mb-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Flat Rate" id="flat-rate" />
                <Label htmlFor="flat-rate">Flat Rate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Slab-based" id="slab-rate" />
                <Label htmlFor="slab-rate">Slab-based</Label>
              </div>
            </RadioGroup>
            
            {tariffType === "Flat Rate" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="flat-rate-value">Electricity rate ({currencySymbol}/kWh)</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                    </div>
                    <Input
                      id="flat-rate-value"
                      type="number"
                      min="0"
                      step="0.01"
                      value={flatRate}
                      onChange={e => setFlatRate(Number(e.target.value))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Estimated Yearly {systemType === "Grid Export Only" ? "Revenue" : "Cost"}</Label>
                  <div className="h-10 bg-gray-100 rounded-md flex items-center px-3 font-medium">
                    {currencySymbol}{calculateYearlyAmount().toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h4 className="font-medium">Enter slab-wise rates:</h4>
                {slabs.map((slab, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-gray-200 rounded-md">
                    <div className="space-y-2">
                      <Label htmlFor={`slab-${index}-units`}>
                        {index === 0 ? "First slab up to:" : `From ${index > 0 ? slabs[index-1].units : 0} to:`}
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id={`slab-${index}-units`}
                          type="number"
                          min={index > 0 ? slabs[index-1].units + 1 : 0}
                          value={slab.units}
                          onChange={e => updateSlab(index, 'units', Number(e.target.value))}
                        />
                        <span className="text-gray-500">kWh</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`slab-${index}-rate`}>Rate ({currencySymbol}/kWh)</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                        </div>
                        <Input
                          id={`slab-${index}-rate`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={slab.rate}
                          onChange={e => updateSlab(index, 'rate', Number(e.target.value))}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addSlab}
                  className="mt-2"
                >
                  Add Another Slab
                </Button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Monthly Consumption</Label>
                    <div className="h-10 bg-gray-100 rounded-md flex items-center px-3 font-medium">
                      {systemType === "Grid Export Only" 
                        ? (yearlyGeneration / 12).toLocaleString(undefined, { maximumFractionDigits: 0 }) 
                        : (consumptionMethod === "Monthly Average" 
                            ? monthlyConsumption 
                            : (Object.values(monthlyData).reduce((sum, val) => sum + val, 0) / 12)
                          ).toLocaleString(undefined, { maximumFractionDigits: 0 })
                      } kWh
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Estimated Yearly {systemType === "Grid Export Only" ? "Revenue" : "Cost"}</Label>
                    <div className="h-10 bg-gray-100 rounded-md flex items-center px-3 font-medium">
                      {currencySymbol}{calculateYearlyAmount().toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="pt-4">
            <Button 
              onClick={handleSave}
              className="bg-solar hover:bg-solar-dark text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              Save Electricity Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ElectricityDetails;
