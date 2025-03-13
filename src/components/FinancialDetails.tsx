
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

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
  return (
    <div className="glass-card rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <h2 className="section-title">Financial Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="systemCost">System Cost ($)</Label>
            <Input
              id="systemCost"
              type="number"
              min={0}
              value={systemCost}
              onChange={(e) => setSystemCost(Number(e.target.value))}
              className="input-field"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="electricityRate">Electricity Rate ($/kWh)</Label>
            <Input
              id="electricityRate"
              type="number"
              min={0}
              step={0.01}
              value={electricityRate}
              onChange={(e) => setElectricityRate(Number(e.target.value))}
              className="input-field"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="electricityEscalationRate">Electricity Escalation Rate (%/year)</Label>
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
            <Label htmlFor="incentives">Incentives/Rebates ($)</Label>
            <Input
              id="incentives"
              type="number"
              min={0}
              value={incentives}
              onChange={(e) => setIncentives(Number(e.target.value))}
              className="input-field"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="financingOption">Financing Option</Label>
            <Select value={financingOption} onValueChange={setFinancingOption}>
              <SelectTrigger id="financingOption" className="input-field">
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
              <Label htmlFor="loanTerm">Loan Term (years)</Label>
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
        </div>
        
        <div className="space-y-6">
          <div className={`space-y-2 ${financingOption !== 'loan' ? 'opacity-50' : ''}`}>
            <div className="flex justify-between">
              <Label htmlFor="interestRate">Interest Rate (%)</Label>
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
          
          <div className="space-y-2">
            <Label htmlFor="maintenanceCost">Annual Maintenance Cost ($)</Label>
            <Input
              id="maintenanceCost"
              type="number"
              min={0}
              value={maintenanceCost}
              onChange={(e) => setMaintenanceCost(Number(e.target.value))}
              className="input-field"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="maintenanceEscalationRate">Maintenance Escalation Rate (%/year)</Label>
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
              <Label htmlFor="degradationRate">Panel Degradation Rate (%/year)</Label>
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
              <Label htmlFor="discountRate">Discount Rate (%)</Label>
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
      </div>
    </div>
  );
};

export default FinancialDetails;
