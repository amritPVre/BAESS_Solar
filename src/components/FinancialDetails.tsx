
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import SectionHeader from "@/components/ui/SectionHeader";
import { BadgePercent, DollarSign, Building, Clock, Gauge, LineChart, TrendingDown, BatteryCharging } from "lucide-react";

interface FinancialDetailsProps {
  systemCost: number;
  setSystemCost: (value: number) => void;
  electricityRate: number;
  setElectricityRate: (value: number) => void;
  electricityEscalationRate: number;
  setElectricityEscalationRate: (value: number) => void;
  incentives: number;
  setIncentives: (value: number) => void;
  financingOption: string;
  setFinancingOption: (value: string) => void;
  loanTerm: number;
  setLoanTerm: (value: number) => void;
  interestRate: number;
  setInterestRate: (value: number) => void;
  maintenanceCost: number;
  setMaintenanceCost: (value: number) => void;
  maintenanceEscalationRate: number;
  setMaintenanceEscalationRate: (value: number) => void;
  degradationRate: number;
  setDegradationRate: (value: number) => void;
  discountRate: number;
  setDiscountRate: (value: number) => void;
}

const FinancialDetails: React.FC<FinancialDetailsProps> = ({
  systemCost,
  setSystemCost,
  electricityRate,
  setElectricityRate,
  electricityEscalationRate,
  setElectricityEscalationRate,
  incentives,
  setIncentives,
  financingOption,
  setFinancingOption,
  loanTerm,
  setLoanTerm,
  interestRate,
  setInterestRate,
  maintenanceCost,
  setMaintenanceCost,
  maintenanceEscalationRate,
  setMaintenanceEscalationRate,
  degradationRate,
  setDegradationRate,
  discountRate,
  setDiscountRate
}) => {
  // Calculate net cost after incentives
  const netCost = systemCost - incentives;
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  return (
    <div className="animate-fade-in">
      <SectionHeader 
        title="Financial Details" 
        description="Configure the financial parameters for your solar investment analysis"
        icon={<DollarSign className="h-6 w-6" />}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-white to-green-50 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-6 space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building className="h-5 w-5 text-solar-dark" />
              System Costs & Financing
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="systemCost" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-solar-dark" />
                  System Cost ($)
                </Label>
                <Input
                  id="systemCost"
                  type="number"
                  min={0}
                  value={systemCost}
                  onChange={(e) => setSystemCost(Number(e.target.value))}
                  className="border-solar-dark/20 focus-visible:ring-solar-dark"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="incentives" className="flex items-center gap-2">
                  <BadgePercent className="h-4 w-4 text-solar-dark" />
                  Incentives/Rebates ($)
                </Label>
                <Input
                  id="incentives"
                  type="number"
                  min={0}
                  max={systemCost}
                  value={incentives}
                  onChange={(e) => setIncentives(Number(e.target.value))}
                  className="border-solar-dark/20 focus-visible:ring-solar-dark"
                />
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-800">Net System Cost:</span>
                  <span className="text-lg font-bold text-green-800">{formatCurrency(netCost)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="financingOption" className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-solar-dark" />
                  Financing Option
                </Label>
                <Select value={financingOption} onValueChange={setFinancingOption}>
                  <SelectTrigger id="financingOption" className="border-solar-dark/20 focus-visible:ring-solar-dark">
                    <SelectValue placeholder="Select financing option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="loan">Loan</SelectItem>
                    <SelectItem value="lease">Lease</SelectItem>
                    <SelectItem value="ppa">PPA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className={`space-y-2 ${financingOption !== 'loan' ? 'opacity-50' : ''}`}>
                <div className="flex justify-between">
                  <Label htmlFor="loanTerm" className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-solar-dark" />
                    Loan Term (years)
                  </Label>
                  <span className="text-sm font-medium">{loanTerm} years</span>
                </div>
                <Slider
                  id="loanTerm"
                  min={5}
                  max={30}
                  step={1}
                  value={[loanTerm]}
                  onValueChange={(value) => setLoanTerm(value[0])}
                  disabled={financingOption !== 'loan'}
                  className="py-2"
                />
              </div>
              
              <div className={`space-y-2 ${financingOption !== 'loan' ? 'opacity-50' : ''}`}>
                <div className="flex justify-between">
                  <Label htmlFor="interestRate" className="flex items-center gap-2">
                    <BadgePercent className="h-4 w-4 text-solar-dark" />
                    Interest Rate (%)
                  </Label>
                  <span className="text-sm font-medium">{interestRate}%</span>
                </div>
                <Slider
                  id="interestRate"
                  min={0}
                  max={10}
                  step={0.1}
                  value={[interestRate]}
                  onValueChange={(value) => setInterestRate(value[0])}
                  disabled={financingOption !== 'loan'}
                  className="py-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-white to-blue-50 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-6 space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <LineChart className="h-5 w-5 text-solar-blue" />
              Performance Parameters
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="electricityRate" className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-solar-blue" />
                  Electricity Rate ($/kWh)
                </Label>
                <Input
                  id="electricityRate"
                  type="number"
                  min={0}
                  step={0.01}
                  value={electricityRate}
                  onChange={(e) => setElectricityRate(Number(e.target.value))}
                  className="border-solar-blue/20 focus-visible:ring-solar-blue"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="electricityEscalationRate" className="flex items-center gap-2">
                    <LineChart className="h-4 w-4 text-solar-blue" />
                    Electricity Escalation Rate (%/year)
                  </Label>
                  <span className="text-sm font-medium">{electricityEscalationRate}%</span>
                </div>
                <Slider
                  id="electricityEscalationRate"
                  min={0}
                  max={10}
                  step={0.1}
                  value={[electricityEscalationRate]}
                  onValueChange={(value) => setElectricityEscalationRate(value[0])}
                  className="py-2"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maintenanceCost" className="flex items-center gap-2">
                  <BatteryCharging className="h-4 w-4 text-solar-blue" />
                  Annual Maintenance Cost ($)
                </Label>
                <Input
                  id="maintenanceCost"
                  type="number"
                  min={0}
                  value={maintenanceCost}
                  onChange={(e) => setMaintenanceCost(Number(e.target.value))}
                  className="border-solar-blue/20 focus-visible:ring-solar-blue"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="maintenanceEscalationRate" className="flex items-center gap-2">
                    <LineChart className="h-4 w-4 text-solar-blue" />
                    Maintenance Escalation Rate (%/year)
                  </Label>
                  <span className="text-sm font-medium">{maintenanceEscalationRate}%</span>
                </div>
                <Slider
                  id="maintenanceEscalationRate"
                  min={0}
                  max={5}
                  step={0.1}
                  value={[maintenanceEscalationRate]}
                  onValueChange={(value) => setMaintenanceEscalationRate(value[0])}
                  className="py-2"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="degradationRate" className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-solar-blue" />
                    Panel Degradation Rate (%/year)
                  </Label>
                  <span className="text-sm font-medium">{degradationRate}%</span>
                </div>
                <Slider
                  id="degradationRate"
                  min={0}
                  max={2}
                  step={0.05}
                  value={[degradationRate]}
                  onValueChange={(value) => setDegradationRate(value[0])}
                  className="py-2"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="discountRate" className="flex items-center gap-2">
                    <BadgePercent className="h-4 w-4 text-solar-blue" />
                    Discount Rate (%)
                  </Label>
                  <span className="text-sm font-medium">{discountRate}%</span>
                </div>
                <Slider
                  id="discountRate"
                  min={0}
                  max={10}
                  step={0.1}
                  value={[discountRate]}
                  onValueChange={(value) => setDiscountRate(value[0])}
                  className="py-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialDetails;
