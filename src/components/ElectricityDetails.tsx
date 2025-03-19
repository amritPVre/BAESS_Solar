
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ElectricityData } from "@/utils/financialCalculator";
import { toast } from "sonner";

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
  const [systemType, setSystemType] = useState<string>("Captive Consumption");
  const [consumptionEnabled, setConsumptionEnabled] = useState<boolean>(true);
  const [consumptionMethod, setConsumptionMethod] = useState<string>("Monthly Average");
  const [monthlyConsumption, setMonthlyConsumption] = useState<number>(1000);
  const [monthlyData, setMonthlyData] = useState<{[key: string]: number}>({
    Jan: 1000, Feb: 1000, Mar: 1000, Apr: 1000, May: 1000, Jun: 1000,
    Jul: 1000, Aug: 1000, Sep: 1000, Oct: 1000, Nov: 1000, Dec: 1000
  });
  const [tariffType, setTariffType] = useState<string>("Flat Rate");
  const [flatRate, setFlatRate] = useState<number>(defaultTariff);
  const [slabs, setSlabs] = useState<{units: number; rate: number}[]>([{units: 100, rate: defaultTariff}]);
  const [addMoreSlabs, setAddMoreSlabs] = useState<boolean>(false);

  const handleMonthlyDataChange = (month: string, value: number) => {
    setMonthlyData(prev => ({
      ...prev,
      [month]: value
    }));
  };

  const handleAddSlab = () => {
    if (slabs.length > 0) {
      const lastSlab = slabs[slabs.length - 1];
      setSlabs([...slabs, {units: lastSlab.units + 100, rate: lastSlab.rate}]);
    }
  };

  const handleRemoveSlab = (index: number) => {
    if (slabs.length > 1) {
      setSlabs(slabs.filter((_, i) => i !== index));
    }
  };

  const handleSlabChange = (index: number, field: 'units' | 'rate', value: number) => {
    const newSlabs = [...slabs];
    newSlabs[index][field] = value;
    setSlabs(newSlabs);
  };

  const calculateYearlyAmount = (): number => {
    // Calculate based on system type and tariff
    const yearlyAmount = systemType === "Grid Export Only" 
      ? calculateGridExportRevenue()
      : calculateConsumptionCost();
    
    return yearlyAmount;
  };

  const calculateGridExportRevenue = (): number => {
    if (tariffType === "Flat Rate") {
      return yearlyGeneration * flatRate;
    } else {
      // For slab-based, calculate monthly then multiply by 12
      const monthlyGeneration = yearlyGeneration / 12;
      let total = 0;
      let remaining = monthlyGeneration;
      
      for (let i = 0; i < slabs.length; i++) {
        const slab = slabs[i];
        const prevLimit = i > 0 ? slabs[i-1].units : 0;
        const slabSize = slab.units - prevLimit;
        
        const unitsInSlab = Math.min(remaining, slabSize);
        total += unitsInSlab * slab.rate;
        remaining -= unitsInSlab;
        
        if (remaining <= 0) break;
      }
      
      return total * 12;
    }
  };

  const calculateConsumptionCost = (): number => {
    if (!consumptionEnabled) return 0;
    
    if (tariffType === "Flat Rate") {
      if (consumptionMethod === "Monthly Average") {
        return monthlyConsumption * 12 * flatRate;
      } else {
        const yearlyConsumption = Object.values(monthlyData).reduce((sum, val) => sum + val, 0);
        return yearlyConsumption * flatRate;
      }
    } else {
      // For slab-based tariffs
      if (consumptionMethod === "Monthly Average") {
        let total = 0;
        let remaining = monthlyConsumption;
        
        for (let i = 0; i < slabs.length; i++) {
          const slab = slabs[i];
          const prevLimit = i > 0 ? slabs[i-1].units : 0;
          const slabSize = slab.units - prevLimit;
          
          const unitsInSlab = Math.min(remaining, slabSize);
          total += unitsInSlab * slab.rate;
          remaining -= unitsInSlab;
          
          if (remaining <= 0) break;
        }
        
        return total * 12;
      } else {
        let totalAnnual = 0;
        
        // Calculate for each month
        Object.values(monthlyData).forEach(monthlyValue => {
          let monthlyTotal = 0;
          let remaining = monthlyValue;
          
          for (let i = 0; i < slabs.length; i++) {
            const slab = slabs[i];
            const prevLimit = i > 0 ? slabs[i-1].units : 0;
            const slabSize = slab.units - prevLimit;
            
            const unitsInSlab = Math.min(remaining, slabSize);
            monthlyTotal += unitsInSlab * slab.rate;
            remaining -= unitsInSlab;
            
            if (remaining <= 0) break;
          }
          
          totalAnnual += monthlyTotal;
        });
        
        return totalAnnual;
      }
    }
  };

  const handleSave = () => {
    // Validate inputs
    if (tariffType === "Flat Rate" && (flatRate <= 0 || isNaN(flatRate))) {
      toast.error("Please enter a valid rate");
      return;
    }
    
    if (tariffType === "Slab-based" && slabs.length === 0) {
      toast.error("Please add at least one slab");
      return;
    }
    
    const yearlyAmount = calculateYearlyAmount();
    
    // Prepare electricity data
    const electricityData: ElectricityData = {
      system_type: systemType,
      consumption: systemType === "Captive Consumption" && consumptionEnabled ? {
        type: consumptionMethod === "Monthly Average" ? "average" : "detailed",
        value: consumptionMethod === "Monthly Average" ? monthlyConsumption : undefined,
        values: consumptionMethod === "Monthly Average" ? undefined : monthlyData
      } : null,
      tariff: {
        type: tariffType === "Flat Rate" ? "flat" : "slab",
        rate: tariffType === "Flat Rate" ? flatRate : undefined,
        slabs: tariffType === "Slab-based" ? slabs : undefined
      },
      yearly_amount: yearlyAmount
    };
    
    onSave(electricityData);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Electricity Consumption & Tariff</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System type selection */}
        <div className="space-y-3">
          <Label>Select system type:</Label>
          <RadioGroup 
            value={systemType} 
            onValueChange={setSystemType}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Captive Consumption" id="captive" />
              <Label htmlFor="captive" className="cursor-pointer">Captive Consumption</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Grid Export Only" id="export" />
              <Label htmlFor="export" className="cursor-pointer">Grid Export Only</Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Consumption data - only show for Captive Consumption */}
        {systemType === "Captive Consumption" && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id="consumptionEnabled"
                checked={consumptionEnabled}
                onChange={(e) => setConsumptionEnabled(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="consumptionEnabled">Include consumption data</Label>
            </div>
            
            {consumptionEnabled && (
              <div className="space-y-4 pl-6">
                <RadioGroup 
                  value={consumptionMethod} 
                  onValueChange={setConsumptionMethod}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Monthly Average" id="monthly-avg" />
                    <Label htmlFor="monthly-avg" className="cursor-pointer">Monthly Average</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Month-wise Details" id="monthly-detail" />
                    <Label htmlFor="monthly-detail" className="cursor-pointer">Month-wise Details</Label>
                  </div>
                </RadioGroup>
                
                {consumptionMethod === "Monthly Average" ? (
                  <div className="space-y-2">
                    <Label htmlFor="monthlyConsumption">Average monthly consumption (kWh):</Label>
                    <Input
                      id="monthlyConsumption"
                      type="number"
                      min={0}
                      value={monthlyConsumption}
                      onChange={(e) => setMonthlyConsumption(Number(e.target.value))}
                    />
                    <div className="text-sm text-muted-foreground">
                      Yearly Consumption: {monthlyConsumption * 12} kWh
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Enter month-wise consumption:</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {Object.entries(monthlyData).map(([month, value]) => (
                        <div key={month} className="space-y-1">
                          <Label htmlFor={`month-${month}`}>{month} (kWh)</Label>
                          <Input
                            id={`month-${month}`}
                            type="number"
                            min={0}
                            value={value}
                            onChange={(e) => handleMonthlyDataChange(month, Number(e.target.value))}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Yearly Consumption: {Object.values(monthlyData).reduce((sum, val) => sum + val, 0)} kWh
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Tariff structure */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-medium">Electricity Tariff Structure</h3>
          
          <RadioGroup 
            value={tariffType} 
            onValueChange={setTariffType}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Flat Rate" id="flat-rate" />
              <Label htmlFor="flat-rate" className="cursor-pointer">Flat Rate</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Slab-based" id="slab-based" />
              <Label htmlFor="slab-based" className="cursor-pointer">Slab-based</Label>
            </div>
          </RadioGroup>
          
          {tariffType === "Flat Rate" ? (
            <div className="space-y-2">
              <Label htmlFor="flatRate">Electricity rate ({currencySymbol}/kWh):</Label>
              <Input
                id="flatRate"
                type="number"
                min={0}
                step={0.01}
                value={flatRate}
                onChange={(e) => setFlatRate(Number(e.target.value))}
              />
              
              {/* Yearly amount calculation */}
              <div className="mt-4 p-3 bg-muted rounded-md">
                <h4 className="font-medium">
                  {systemType === "Grid Export Only" ? "Estimated Yearly Revenue" : "Estimated Yearly Electricity Cost"}
                </h4>
                <div className="text-xl font-bold">
                  {currencySymbol}{(flatRate * (systemType === "Grid Export Only" ? yearlyGeneration : 
                    (consumptionEnabled ? (consumptionMethod === "Monthly Average" ? monthlyConsumption * 12 : 
                      Object.values(monthlyData).reduce((sum, val) => sum + val, 0)) : 0))).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Enter slab-wise rates:</h4>
                {slabs.map((slab, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 items-end border p-3 rounded-md">
                    <div className="space-y-1 col-span-1">
                      <Label>Units up to:</Label>
                      <Input
                        type="number"
                        min={index > 0 ? slabs[index-1].units + 1 : 1}
                        value={slab.units}
                        onChange={(e) => handleSlabChange(index, 'units', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1 col-span-1">
                      <Label>Rate ({currencySymbol}/kWh):</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={slab.rate}
                        onChange={(e) => handleSlabChange(index, 'rate', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      {slabs.length > 1 && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleRemoveSlab(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddSlab}
                  className="mt-2"
                >
                  Add Another Slab
                </Button>
              </div>
              
              {/* Yearly amount calculation for slab-based tariff */}
              <div className="mt-4 p-3 bg-muted rounded-md">
                <h4 className="font-medium">
                  {systemType === "Grid Export Only" ? "Estimated Yearly Revenue" : "Estimated Yearly Electricity Cost"}
                </h4>
                <div className="text-xl font-bold">
                  {currencySymbol}{calculateYearlyAmount().toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-solar hover:bg-solar-dark text-white">
            Save Electricity Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ElectricityDetails;
