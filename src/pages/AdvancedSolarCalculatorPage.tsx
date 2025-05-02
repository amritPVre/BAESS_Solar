
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import AdvancedSolarCalculator from "@/components/advanced-solar-calculator";
import { SolarProject } from "@/types/solarProject";

export function AdvancedSolarCalculatorPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Advanced Solar Energy Calculator</h1>
      
      <Card>
        <CardContent className="p-6">
          <AdvancedSolarCalculator />
        </CardContent>
      </Card>
    </div>
  );
}

export default AdvancedSolarCalculatorPage;
