
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ElectricityData } from "@/utils/financialCalculator";
import { Info, AlertTriangle } from "lucide-react";

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
  const [systemType, setSystemType] = useState("Captive Consumption");
  const [consumptionEnabled, setConsumptionEnabled] = useState(true);
  const [consumptionMethod, setConsumptionMethod] = useState("Monthly Average");
  const [monthlyConsumption, setMonthlyConsumption] = useState(1000);
  const [monthlyValues, setMonthlyValues] = useState<{ [month: string]: number }>({
    'Jan': 1000, 'Feb': 1000, 'Mar': 1000, 'Apr': 1000, 'May': 1000, 'Jun': 1000,
    'Jul': 1000, 'Aug': 1000, 'Sep': 1000, 'Oct': 1000, 'Nov': 1000, 'Dec': 1000
  });
  
  const [tariffType, setTariffType] = useState("Flat Rate");
  const [flatRate, setFlatRate] = useState(defaultTariff);
  
  const [slabs, setSlabs] = useState<{ units: number; rate: number }[]>([
    { units: 100, rate: defaultTariff * 0.8 }
  ]);
  
  const [yearlyAmount, setYearlyAmount] = useState(0);

  // Calculate slab cost
  const calculateSlabCost = (consumption: number, slabsData: { units: number; rate: number }[]): number => {
    let total = 0;
    let remaining = consumption;
    
    for (let i = 0; i < slabsData.length; i++) {
      const slab = slabsData[i];
      let units;
      
      if (i === 0) {
        units = Math.min(remaining, slab.units);
      } else {
        const prevUnits = slabsData[i-1].units;
        units = Math.min(remaining, slab.units - prevUnits);
      }
      
      total += units * slab.rate;
      remaining -= units;
      
      if (remaining <= 0) break;
      
      // If this is the last slab and there are remaining units
      if (i === slabsData.length - 1 && remaining > 0) {
        total += remaining * slab.rate;
      }
    }
    
    return total;
  };

  // Update yearly amount when inputs change
  React.useEffect(() => {
    let amount = 0;
    
    if (systemType === "Grid Export Only") {
      if (tariffType === "Flat Rate") {
        amount = yearlyGeneration * flatRate;
      } else {
        // For slab-based tariff
        const monthlyGeneration = yearlyGeneration / 12;
        const monthlyRevenue = calculateSlabCost(monthlyGeneration, slabs);
        amount = monthlyRevenue * 12;
      }
    } else if (consumptionEnabled) {
      if (tariffType === "Flat Rate") {
        if (consumptionMethod === "Monthly Average") {
          amount = monthlyConsumption * 12 * flatRate;
        } else {
          amount = Object.values(monthlyValues).reduce((sum, val) => sum + val, 0) * flatRate;
        }
      } else {
        // For slab-based tariff
        if (consumptionMethod === "Monthly Average") {
          const monthlyCost = calculateSlabCost(monthlyConsumption, slabs);
          amount = monthlyCost * 12;
        } else {
          amount = Object.values(monthlyValues).reduce((sum, val) => {
            return sum + calculateSlabCost(val, slabs);
          }, 0);
        }
      }
    }
    
    setYearlyAmount(amount);
  }, [systemType, consumptionEnabled, consumptionMethod, monthlyConsumption, 
      monthlyValues, tariffType, flatRate, slabs, yearlyGeneration]);

  // Handle adding a new slab
  const addSlab = () => {
    if (slabs.length > 0) {
      const lastSlab = slabs[slabs.length - 1];
      setSlabs([...slabs, { units: lastSlab.units + 100, rate: lastSlab.rate * 1.2 }]);
    } else {
      setSlabs([{ units: 100, rate: defaultTariff }]);
    }
  };

  // Handle removing a slab
  const removeSlab = (index: number) => {
    if (slabs.length > 1) {
      const newSlabs = [...slabs];
      newSlabs.splice(index, 1);
      setSlabs(newSlabs);
    }
  };

  // Handle updating a slab
  const updateSlab = (index: number, field: 'units' | 'rate', value: number) => {
    const newSlabs = [...slabs];
    newSlabs[index][field] = value;
    setSlabs(newSlabs);
  };

  // Handle monthly value change
  const handleMonthlyValueChange = (month: string, value: number) => {
    setMonthlyValues(prev => ({
      ...prev,
      [month]: value
    }));
  };

  // Handle save
  const handleSave = () => {
    const consumptionData = consumptionEnabled
      ? {
          type: consumptionMethod === "Monthly Average" ? "average" : "detailed",
          ...(consumptionMethod === "Monthly Average" 
              ? { value: monthlyConsumption } 
              : { values: monthlyValues })
        }
      : null;
    
    const tariffData = tariffType === "Flat Rate"
      ? { type: "flat", rate: flatRate }
      : { type: "slab", slabs };
    
    const electricityData: ElectricityData = {
      system_type: systemType,
      consumption: consumptionData,
      tariff: tariffData,
      yearly_cost: yearlyAmount
    };
    
    onSave(electricityData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Electricity Consumption & Tariff Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">System Type</Label>
            <RadioGroup 
              value={systemType} 
              onValueChange={setSystemType}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Captive Consumption" id="captive" />
                <Label htmlFor="captive">Captive Consumption (self-use)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Grid Export Only" id="export" />
                <Label htmlFor="export">Grid Export Only (sell to grid)</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Consumption Section - Only for Captive Consumption */}
          {systemType === "Captive Consumption" && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <Label htmlFor="consumption-enabled" className="flex-grow">Include consumption data</Label>
                <input
                  type="checkbox"
                  id="consumption-enabled"
                  checked={consumptionEnabled}
                  onChange={(e) => setConsumptionEnabled(e.target.checked)}
                  className="h-5 w-5"
                />
              </div>
              
              {consumptionEnabled && (
                <div className="space-y-4 pt-2">
                  <RadioGroup 
                    value={consumptionMethod} 
                    onValueChange={setConsumptionMethod}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Monthly Average" id="avg" />
                      <Label htmlFor="avg">Monthly Average</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Month-wise Details" id="detailed" />
                      <Label htmlFor="detailed">Month-wise Details</Label>
                    </div>
                  </RadioGroup>
                  
                  {consumptionMethod === "Monthly Average" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="monthly-consumption">Average Monthly Consumption (kWh)</Label>
                        <Input
                          id="monthly-consumption"
                          type="number"
                          min={0}
                          value={monthlyConsumption}
                          onChange={(e) => setMonthlyConsumption(Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Yearly Consumption</Label>
                        <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                          {(monthlyConsumption * 12).toLocaleString()} kWh
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Enter Month-wise Consumption</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Object.keys(monthlyValues).map((month) => (
                          <div key={month} className="space-y-1">
                            <Label htmlFor={`month-${month}`}>{month} (kWh)</Label>
                            <Input
                              id={`month-${month}`}
                              type="number"
                              min={0}
                              value={monthlyValues[month]}
                              onChange={(e) => handleMonthlyValueChange(month, Number(e.target.value))}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-2 bg-muted/50 rounded-lg flex justify-between items-center">
                        <span className="font-medium">Total Yearly Consumption:</span>
                        <span className="font-semibold">
                          {Object.values(monthlyValues).reduce((sum, val) => sum + val, 0).toLocaleString()} kWh
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <Separator />
          
          {/* Tariff Structure */}
          <div className="space-y-4">
            <div className="flex items-center">
              <h3 className="text-base font-medium">Electricity Tariff Structure</h3>
              {systemType === "Grid Export Only" && (
                <Alert className="ml-2 px-3 py-1 h-auto">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    For grid export, this represents the sell rate
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <RadioGroup 
              value={tariffType} 
              onValueChange={setTariffType}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Flat Rate" id="flat" />
                <Label htmlFor="flat">Flat Rate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Slab-based" id="slab" />
                <Label htmlFor="slab">Slab-based Tariff</Label>
              </div>
            </RadioGroup>
            
            {tariffType === "Flat Rate" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flat-rate">Electricity Rate ({currencySymbol}/kWh)</Label>
                  <Input
                    id="flat-rate"
                    type="number"
                    min={0}
                    step={0.01}
                    value={flatRate}
                    onChange={(e) => setFlatRate(Number(e.target.value))}
                  />
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg flex flex-col justify-center">
                  <div className="text-sm text-muted-foreground mb-1">Estimated Yearly {systemType === "Grid Export Only" ? "Revenue" : "Cost"}</div>
                  <div className="text-xl font-semibold">{currencySymbol}{yearlyAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Slab-wise Rates</Label>
                  <Alert variant="warning" className="mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Enter slabs in ascending order. Each slab represents consumption up to that amount.
                    </AlertDescription>
                  </Alert>
                  
                  {slabs.map((slab, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <Label htmlFor={`slab-${index}-units`} className="sr-only">Units up to</Label>
                        <Input
                          id={`slab-${index}-units`}
                          type="number"
                          min={index > 0 ? slabs[index-1].units + 1 : 1}
                          value={slab.units}
                          onChange={(e) => updateSlab(index, 'units', Number(e.target.value))}
                          placeholder="Units up to"
                        />
                      </div>
                      <div className="col-span-5">
                        <Label htmlFor={`slab-${index}-rate`} className="sr-only">Rate</Label>
                        <Input
                          id={`slab-${index}-rate`}
                          type="number"
                          min={0}
                          step={0.01}
                          value={slab.rate}
                          onChange={(e) => updateSlab(index, 'rate', Number(e.target.value))}
                          placeholder={`Rate (${currencySymbol}/kWh)`}
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => removeSlab(index)}
                          disabled={slabs.length <= 1}
                        >
                          ✕
                        </Button>
                      </div>
                      {index === 0 && (
                        <div className="col-span-12 text-sm text-muted-foreground">
                          First slab (0 to {slab.units} units) @ {currencySymbol}{slab.rate}/kWh
                        </div>
                      )}
                      {index > 0 && (
                        <div className="col-span-12 text-sm text-muted-foreground">
                          From {slabs[index-1].units} to {slab.units} units @ {currencySymbol}{slab.rate}/kWh
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={addSlab}
                  >
                    Add Slab
                  </Button>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg flex flex-col">
                  <div className="text-sm text-muted-foreground mb-1">Estimated Yearly {systemType === "Grid Export Only" ? "Revenue" : "Cost"}</div>
                  <div className="text-xl font-semibold">{currencySymbol}{yearlyAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleSave} className="bg-solar hover:bg-solar-dark text-white">
              Save & Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ElectricityDetails;
