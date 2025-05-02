
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import AdvancedSolarCalculator from "@/components/advanced-solar-calculator";
import ReturnToDashboardButton from "@/components/ui/ReturnToDashboardButton";

export function AdvancedSolarCalculatorPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-center">Advanced Solar Energy Calculator</h1>
        <ReturnToDashboardButton />
      </div>
      
      <Card>
        <CardContent className="p-6">
          <AdvancedSolarCalculator />
        </CardContent>
      </Card>
    </div>
  );
}

export default AdvancedSolarCalculatorPage;
