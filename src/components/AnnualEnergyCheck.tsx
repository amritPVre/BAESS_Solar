
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SectionHeader from "@/components/ui/SectionHeader";
import { Zap, Calculator, Lightbulb } from "lucide-react";

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
  setManualAnnualEnergy,
}) => {
  return (
    <div className="animate-fade-in">
      <SectionHeader 
        title="Energy Production Check" 
        description="Do you already know your expected annual energy production?"
        icon={<Zap className="h-6 w-6" />}
      />
      
      <Card className="bg-gradient-to-br from-white to-sky-50 shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="p-6">
          <RadioGroup
            value={knowsAnnualEnergy === null ? undefined : knowsAnnualEnergy ? "yes" : "no"}
            onValueChange={(value) => setKnowsAnnualEnergy(value === "yes")}
            className="space-y-6"
          >
            <div className="flex items-center space-x-2 rounded-lg border p-4 transition-all hover:bg-muted/50">
              <RadioGroupItem value="yes" id="knows-yes" />
              <Label
                htmlFor="knows-yes"
                className="flex-1 cursor-pointer flex items-center gap-2"
              >
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <div>
                  <span className="text-base font-medium">Yes, I know the annual energy production</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    I already have an estimated value for my solar system's yearly output
                  </p>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 rounded-lg border p-4 transition-all hover:bg-muted/50">
              <RadioGroupItem value="no" id="knows-no" />
              <Label
                htmlFor="knows-no"
                className="flex-1 cursor-pointer flex items-center gap-2"
              >
                <Calculator className="h-5 w-5 text-blue-500" />
                <div>
                  <span className="text-base font-medium">No, help me calculate it</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    I need the calculator to estimate my solar system's yearly output
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>
          
          {knowsAnnualEnergy && (
            <div className="mt-6 space-y-2 bg-white p-5 rounded-lg border border-solar/20 animate-fade-in">
              <Label htmlFor="annualEnergy" className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-solar" />
                Annual Energy Production (kWh)
              </Label>
              <Input
                id="annualEnergy"
                type="number"
                min={1}
                value={manualAnnualEnergy}
                onChange={(e) => setManualAnnualEnergy(Number(e.target.value))}
                className="border-solar/20 focus-visible:ring-solar"
              />
              <p className="text-sm text-muted-foreground">
                Enter your expected annual energy production in kilowatt-hours (kWh)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnnualEnergyCheck;
