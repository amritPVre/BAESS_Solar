
import React from "react";
import { Card } from "@/components/ui/card";
import AdvancedSolarCalculator from "@/components/advanced-solar-calculator";
import ReturnToDashboardButton from "@/components/ui/ReturnToDashboardButton";
import { SunIcon } from "lucide-react";

export function AdvancedSolarCalculatorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50">
      <div className="container mx-auto py-8 px-4 sm:px-6 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-400 flex items-center justify-center shadow-lg">
              <SunIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-center md:text-left bg-gradient-to-r from-amber-600 to-orange-600 text-transparent bg-clip-text">
              Advanced Solar Energy Calculator
            </h1>
          </div>
          <ReturnToDashboardButton className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-none" />
        </div>
        
        <Card className="border-none shadow-xl bg-white/90 backdrop-blur-sm">
          <AdvancedSolarCalculator />
        </Card>
      </div>
    </div>
  );
}

export default AdvancedSolarCalculatorPage;
