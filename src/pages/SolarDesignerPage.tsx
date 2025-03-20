
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SolarAreaMapper from "@/components/SolarAreaMapper";
import SolarCalculator from "@/components/SolarCalculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calculator } from "lucide-react";
import { SolarProject } from "@/types/solarProject";

export function SolarDesignerPage() {
  const [activeTab, setActiveTab] = useState("mapper");
  const [mappingResults, setMappingResults] = useState<any>(null);
  
  const handleMappingComplete = (results: any) => {
    setMappingResults(results);
    setActiveTab("calculator");
  };
  
  // Generate a mock project with proper SolarProject type
  const generateMockProject = (): SolarProject => {
    const uniqueId = Math.random().toString(36).substring(2, 9);
    const defaultProject: SolarProject = {
      id: `temp-${uniqueId}`,
      userId: "temp-user",
      name: "Solar Project",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientName: "Client Name",
      clientEmail: "client@example.com",
      clientPhone: "(123) 456-7890",
      clientAddress: "123 Solar Street",
      companyName: "Solar Company",
      companyContact: "Contact Person",
      companyEmail: "company@example.com",
      companyPhone: "(987) 654-3210",
      knowsAnnualEnergy: false,
      manualAnnualEnergy: 0,
      annualEnergy: mappingResults ? mappingResults.potentialCapacity * 1600 : 16000,
      systemSize: mappingResults ? mappingResults.potentialCapacity || 10 : 10,
      panelType: "monocrystalline",
      panelEfficiency: 20,
      inverterType: "string", 
      inverterEfficiency: 97,
      roofType: "asphalt", 
      roofAngle: 30,
      orientation: "south",
      solarIrradiance: 5,
      shadingFactor: 5,
      location: { lat: 40.7128, lng: -74.0060 },
      timezone: "America/New_York",
      country: "United States",
      city: "New York",
      systemCost: mappingResults?.potentialCapacity ? mappingResults.potentialCapacity * 2500 : 25000,
      electricityRate: 0.15,
      electricityEscalationRate: 3,
      incentives: mappingResults?.potentialCapacity ? mappingResults.potentialCapacity * 750 : 7500,
      financingOption: "cash",
      loanTerm: 15,
      interestRate: 4.5,
      maintenanceCost: 200,
      maintenanceEscalationRate: 2,
      degradationRate: 0.5,
      discountRate: 5,
      lcoe: 0,
      annualRevenue: 0,
      annualCost: 0,
      netPresentValue: 0,
      irr: 0,
      paybackPeriod: { years: 0, months: 0 },
      co2Reduction: 0,
      treesEquivalent: 0,
      vehicleMilesOffset: 0,
      yearlyProduction: [],
      yearlyCashFlow: [],
      cumulativeCashFlow: []
    };
    
    return defaultProject;
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Solar PV System Designer</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="mapper" className="flex-1">
            <MapPin className="w-4 h-4 mr-2" />
            Area Mapper
          </TabsTrigger>
          <TabsTrigger value="calculator" className="flex-1">
            <Calculator className="w-4 h-4 mr-2" />
            Financial Calculator
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="mapper">
          <SolarAreaMapper 
            onComplete={handleMappingComplete}
            initialCapacity={10}
          />
        </TabsContent>
        
        <TabsContent value="calculator">
          <SolarCalculator 
            projectData={mappingResults ? generateMockProject() : undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SolarDesignerPage;
