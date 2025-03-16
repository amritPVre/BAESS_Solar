
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AnnualEnergyCheckProps {
  knowsAnnualEnergy: boolean | null;
  setKnowsAnnualEnergy: (value: boolean) => void;
  manualAnnualEnergy: number;
  setManualAnnualEnergy: (value: number) => void;
}

const AnnualEnergyCheck: React.FC<AnnualEnergyCheckProps> = ({
  knowsAnnualEnergy,
  setKnowsAnnualEnergy,
  manualAnnualEnergy,
  setManualAnnualEnergy
}) => {
  return (
    <div className="glass-card rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <h2 className="section-title">Annual Energy Generation</h2>
      
      <div className="space-y-6">
        <div className="space-y-3">
          <Label>Do you know the estimated annual energy generation for your solar system?</Label>
          <RadioGroup value={knowsAnnualEnergy === null ? undefined : knowsAnnualEnergy ? "yes" : "no"} onValueChange={(value) => setKnowsAnnualEnergy(value === "yes")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="yes" />
              <Label htmlFor="yes" className="cursor-pointer">Yes, I know the estimated annual energy generation</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="no" />
              <Label htmlFor="no" className="cursor-pointer">No, I need help estimating it</Label>
            </div>
          </RadioGroup>
        </div>
        
        {knowsAnnualEnergy && (
          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="manualAnnualEnergy">Annual Energy Generation (kWh/year)</Label>
            <Input
              id="manualAnnualEnergy"
              type="number"
              min={0}
              value={manualAnnualEnergy}
              onChange={(e) => setManualAnnualEnergy(Number(e.target.value))}
              className="input-field"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Enter your estimated annual energy generation in kilowatt-hours per year.
            </p>
          </div>
        )}
        
        {knowsAnnualEnergy === false && (
          <div className="bg-muted/40 p-4 rounded-lg animate-fade-in">
            <p className="text-sm">
              We'll help you estimate your solar system's energy production based on the system details and location information you provide in the next step.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnualEnergyCheck;
