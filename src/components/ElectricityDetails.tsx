
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ElectricityData } from "@/utils/financialCalculator";
import SectionHeader from "@/components/ui/SectionHeader";
import { Zap, Gauge, Plus, Minus, Battery, PanelRight, ArrowUpRight } from "lucide-react";

interface ElectricityDetailsProps {
  onSave: (electricityData: ElectricityData) => void;
  currency: string;
  currencySymbol: string;
  defaultTariff: number;
  yearlyGeneration: number;
}

const ElectricityDetails: React.FC<ElectricityDetailsProps> = ({
  onSave,
  currency,
  currencySymbol,
  defaultTariff,
  yearlyGeneration,
}) => {
  const [systemType, setSystemType] = useState<"Captive Consumption" | "Grid Export Only">("Captive Consumption");
  const [consumption, setConsumption] = useState<"average" | "detailed">("average");
  const [monthlyConsumption, setMonthlyConsumption] = useState(1000);
  const [tariffType, setTariffType] = useState<"flat" | "slab">("flat");
  const [tariffRate, setTariffRate] = useState(defaultTariff);
  
  // State for detailed consumption
  const [monthlyData, setMonthlyData] = useState({
    Jan: 1000, Feb: 1000, Mar: 1000, Apr: 1000, May: 1000, Jun: 1000,
    Jul: 1000, Aug: 1000, Sep: 1000, Oct: 1000, Nov: 1000, Dec: 1000
  });
  
  // State for slabs
  const [slabs, setSlabs] = useState([{ units: 500, rate: defaultTariff }]);
  
  const handleMonthlyDataChange = (month: keyof typeof monthlyData, value: number) => {
    setMonthlyData(prev => ({ ...prev, [month]: value }));
  };
  
  const addSlab = () => {
    setSlabs(prev => [...prev, { units: prev[prev.length - 1].units + 500, rate: prev[prev.length - 1].rate }]);
  };
  
  const removeSlab = (index: number) => {
    if (slabs.length > 1) {
      setSlabs(prev => prev.filter((_, i) => i !== index));
    }
  };
  
  const updateSlab = (index: number, field: "units" | "rate", value: number) => {
    setSlabs(prev => prev.map((slab, i) => 
      i === index ? { ...slab, [field]: value } : slab
    ));
  };
  
  const handleSave = () => {
    // Calculate yearly amount
    let yearlyAmount = 0;
    
    if (systemType === "Grid Export Only") {
      if (tariffType === "flat") {
        yearlyAmount = yearlyGeneration * tariffRate;
      } else {
        // Calculate slab-based for grid export
        const monthlyGeneration = yearlyGeneration / 12;
        let monthlyRevenue = 0;
        let remainingUnits = monthlyGeneration;
        
        for (let i = 0; i < slabs.length; i++) {
          const currentSlab = slabs[i];
          const prevUnits = i > 0 ? slabs[i - 1].units : 0;
          const slabSize = currentSlab.units - prevUnits;
          
          const unitsInSlab = Math.min(remainingUnits, slabSize);
          monthlyRevenue += unitsInSlab * currentSlab.rate;
          remainingUnits -= unitsInSlab;
          
          if (remainingUnits <= 0) break;
        }
        
        // If there are units remaining after all slabs, use the last slab rate
        if (remainingUnits > 0) {
          monthlyRevenue += remainingUnits * slabs[slabs.length - 1].rate;
        }
        
        yearlyAmount = monthlyRevenue * 12;
      }
    } else { // Captive Consumption
      if (tariffType === "flat") {
        // For average consumption
        if (consumption === "average") {
          yearlyAmount = monthlyConsumption * 12 * tariffRate;
        } else {
          // For detailed consumption
          yearlyAmount = Object.values(monthlyData).reduce((sum, val) => sum + val, 0) * tariffRate;
        }
      } else {
        // Calculate slab-based for captive consumption
        if (consumption === "average") {
          let monthlyCost = 0;
          let remainingUnits = monthlyConsumption;
          
          for (let i = 0; i < slabs.length; i++) {
            const currentSlab = slabs[i];
            const prevUnits = i > 0 ? slabs[i - 1].units : 0;
            const slabSize = currentSlab.units - prevUnits;
            
            const unitsInSlab = Math.min(remainingUnits, slabSize);
            monthlyCost += unitsInSlab * currentSlab.rate;
            remainingUnits -= unitsInSlab;
            
            if (remainingUnits <= 0) break;
          }
          
          // If there are units remaining after all slabs, use the last slab rate
          if (remainingUnits > 0) {
            monthlyCost += remainingUnits * slabs[slabs.length - 1].rate;
          }
          
          yearlyAmount = monthlyCost * 12;
        } else {
          // For detailed consumption
          let yearlyCost = 0;
          
          Object.values(monthlyData).forEach(monthConsumption => {
            let monthlyCost = 0;
            let remainingUnits = monthConsumption;
            
            for (let i = 0; i < slabs.length; i++) {
              const currentSlab = slabs[i];
              const prevUnits = i > 0 ? slabs[i - 1].units : 0;
              const slabSize = currentSlab.units - prevUnits;
              
              const unitsInSlab = Math.min(remainingUnits, slabSize);
              monthlyCost += unitsInSlab * currentSlab.rate;
              remainingUnits -= unitsInSlab;
              
              if (remainingUnits <= 0) break;
            }
            
            // If there are units remaining after all slabs, use the last slab rate
            if (remainingUnits > 0) {
              monthlyCost += remainingUnits * slabs[slabs.length - 1].rate;
            }
            
            yearlyCost += monthlyCost;
          });
          
          yearlyAmount = yearlyCost;
        }
      }
    }
    
    const electricityData: ElectricityData = {
      system_type: systemType,
      consumption: consumption === "average" 
        ? { type: "average", value: monthlyConsumption }
        : { type: "detailed", values: monthlyData },
      tariff: tariffType === "flat" 
        ? { type: "flat", rate: tariffRate }
        : { type: "slab", slabs: slabs },
      yearly_amount: yearlyAmount
    };
    
    onSave(electricityData);
  };
  
  return (
    <div className="animate-fade-in">
      <SectionHeader 
        title="Electricity Details" 
        description="Configure electricity consumption and tariff settings"
        icon={<Zap className="h-6 w-6" />}
      />
      
      <Card className="bg-gradient-to-br from-white to-amber-50 shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="p-6">
          {/* System Type Selection */}
          <div className="mb-6">
            <Label className="text-lg font-medium mb-3 block">System Configuration</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`flex items-start p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  systemType === "Captive Consumption"
                    ? "border-solar bg-solar/5"
                    : "border-muted hover:border-muted-foreground"
                }`}
                onClick={() => setSystemType("Captive Consumption")}
              >
                <Battery className="h-6 w-6 mr-3 mt-1 text-solar" />
                <div>
                  <h3 className="font-medium">Captive Consumption</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    The system is primarily for self-consumption
                  </p>
                </div>
              </div>
              
              <div
                className={`flex items-start p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  systemType === "Grid Export Only"
                    ? "border-solar-blue bg-solar-blue/5"
                    : "border-muted hover:border-muted-foreground"
                }`}
                onClick={() => setSystemType("Grid Export Only")}
              >
                <PanelRight className="h-6 w-6 mr-3 mt-1 text-solar-blue" />
                <div>
                  <h3 className="font-medium">Grid Export Only</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    All generated power is exported to the grid
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Consumption Data (Only for Captive Consumption) */}
          {systemType === "Captive Consumption" && (
            <div className="mb-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-medium">Electricity Consumption</Label>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="consumption-data" className="cursor-pointer">Include consumption data</Label>
                  <Switch id="consumption-data" checked={true} disabled />
                </div>
              </div>
              
              <Tabs value={consumption} onValueChange={(v) => setConsumption(v as any)} className="mb-6">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="average">Monthly Average</TabsTrigger>
                  <TabsTrigger value="detailed">Month-by-Month</TabsTrigger>
                </TabsList>
                
                <TabsContent value="average" className="mt-0">
                  <div className="flex flex-col space-y-2 bg-white p-5 rounded-lg border">
                    <Label htmlFor="monthly-consumption" className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-solar" />
                      Average Monthly Consumption (kWh)
                    </Label>
                    <Input
                      id="monthly-consumption"
                      type="number"
                      min={0}
                      step={100}
                      value={monthlyConsumption}
                      onChange={(e) => setMonthlyConsumption(Number(e.target.value))}
                      className="border-solar/20 focus-visible:ring-solar"
                    />
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className="text-muted-foreground">Your typical monthly electricity usage</span>
                      <span className="font-medium text-solar">Yearly: {monthlyConsumption * 12} kWh</span>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="detailed" className="mt-0">
                  <div className="bg-white p-5 rounded-lg border">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-solar" />
                      Monthly Consumption (kWh)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {Object.entries(monthlyData).map(([month, value]) => (
                        <div key={month} className="space-y-1">
                          <Label htmlFor={`month-${month}`} className="text-sm font-medium">
                            {month}
                          </Label>
                          <Input
                            id={`month-${month}`}
                            type="number"
                            min={0}
                            step={100}
                            value={value}
                            onChange={(e) => handleMonthlyDataChange(month as keyof typeof monthlyData, Number(e.target.value))}
                            className="border-solar/20 focus-visible:ring-solar"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                        <span className="text-sm text-green-800">
                          Yearly Total: {Object.values(monthlyData).reduce((sum, val) => sum + val, 0)} kWh
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          {/* Tariff Structure */}
          <div className="animate-fade-in" style={{animationDelay: "150ms"}}>
            <div className="border-t pt-6 mb-4">
              <Label className="text-lg font-medium mb-3 block">Electricity Tariff Structure</Label>
            </div>
            
            <Tabs value={tariffType} onValueChange={(v) => setTariffType(v as any)} className="mb-6">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="flat">Flat Rate</TabsTrigger>
                <TabsTrigger value="slab">Slab-based</TabsTrigger>
              </TabsList>
              
              <TabsContent value="flat" className="mt-0">
                <div className="flex flex-col space-y-2 bg-white p-5 rounded-lg border">
                  <Label htmlFor="flat-rate" className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-solar" />
                    Electricity Rate ({currencySymbol}/kWh)
                  </Label>
                  <Input
                    id="flat-rate"
                    type="number"
                    min={0}
                    step={0.01}
                    value={tariffRate}
                    onChange={(e) => setTariffRate(Number(e.target.value))}
                    className="border-solar/20 focus-visible:ring-solar"
                  />
                  
                  {/* Revenue or Savings Preview */}
                  <div className="flex items-center justify-between mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="text-sm text-blue-800">
                      Estimated Yearly {systemType === "Grid Export Only" ? "Revenue" : "Savings"}:
                    </span>
                    <span className="font-medium text-blue-800">
                      {currencySymbol}{(
                        systemType === "Grid Export Only" 
                          ? yearlyGeneration * tariffRate
                          : (consumption === "average"
                              ? monthlyConsumption * 12 * tariffRate
                              : Object.values(monthlyData).reduce((sum, val) => sum + val, 0) * tariffRate
                            )
                      ).toLocaleString(undefined, {maximumFractionDigits: 2})}
                    </span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="slab" className="mt-0">
                <div className="bg-white p-5 rounded-lg border">
                  <h3 className="font-medium mb-4">Slab-wise Rates</h3>
                  
                  {slabs.map((slab, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 mb-4 items-end">
                      <div className="col-span-5 space-y-1">
                        <Label htmlFor={`slab-${index}-units`} className="text-sm">
                          {index === 0 ? "Units up to" : `From ${slabs[index-1].units} to`}
                        </Label>
                        <Input
                          id={`slab-${index}-units`}
                          type="number"
                          min={index === 0 ? 0 : slabs[index-1].units + 1}
                          value={slab.units}
                          onChange={(e) => updateSlab(index, "units", Number(e.target.value))}
                          className="border-solar/20 focus-visible:ring-solar"
                        />
                      </div>
                      
                      <div className="col-span-5 space-y-1">
                        <Label htmlFor={`slab-${index}-rate`} className="text-sm">
                          Rate ({currencySymbol}/kWh)
                        </Label>
                        <Input
                          id={`slab-${index}-rate`}
                          type="number"
                          min={0}
                          step={0.01}
                          value={slab.rate}
                          onChange={(e) => updateSlab(index, "rate", Number(e.target.value))}
                          className="border-solar/20 focus-visible:ring-solar"
                        />
                      </div>
                      
                      <div className="col-span-2 flex space-x-1">
                        {index === slabs.length - 1 && (
                          <Button 
                            type="button" 
                            size="icon" 
                            variant="ghost"
                            onClick={addSlab}
                            className="h-10 w-10 rounded-full hover:bg-green-100 hover:text-green-600"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {slabs.length > 1 && (
                          <Button 
                            type="button" 
                            size="icon" 
                            variant="ghost"
                            onClick={() => removeSlab(index)}
                            className="h-10 w-10 rounded-full hover:bg-red-100 hover:text-red-600"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-4 flex justify-end">
                    <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                      <span className="text-sm text-blue-800">
                        Note: For consumption beyond the highest slab, the last slab rate will be used
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <Button 
              onClick={handleSave}
              className="bg-solar hover:bg-solar-dark text-white"
            >
              Save Electricity Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ElectricityDetails;
