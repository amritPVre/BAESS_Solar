
import React from "react";
import { Card } from "@/components/ui/card";
import AdvancedSolarCalculator from "@/components/advanced-solar-calculator";
import ReturnToDashboardButton from "@/components/ui/ReturnToDashboardButton";
import { SunIcon } from "lucide-react";

export function AdvancedSolarCalculatorPage() {
      return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50">
        <div className="container mx-auto py-8 px-4 sm:px-6 max-w-[1900px]">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex flex-col items-center md:items-start">
            <img src="/baess-logo.PNG" alt="BAESS Labs" className="h-16 w-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
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
