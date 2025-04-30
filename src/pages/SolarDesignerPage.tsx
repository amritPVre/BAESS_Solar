
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SolarAreaMapper from "@/components/SolarAreaMapper";
import SolarCalculator from "@/components/SolarCalculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calculator } from "lucide-react";
import { SolarProject } from "@/types/solarProject";
import { SolarAreaMapperProps, SolarCalculatorProps } from "@/types/components";

export function SolarDesignerPage() {
  const [activeTab, setActiveTab] = useState("mapper");
  const [mappingResults, setMappingResults] = useState<any>(null);
  
  // Store location details as they're updated
  const [locationDetails, setLocationDetails] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    timezone: "America/New_York",
    country: "United States",
    city: "New York"
  });
  
  const handleMappingComplete = (results: any) => {
    // Update location details if they were provided
    if (results.location) {
      setLocationDetails(prevDetails => ({
        ...prevDetails,
        latitude: results.location.lat || prevDetails.latitude,
        longitude: results.location.lng || prevDetails.longitude,
        timezone: results.timezone || prevDetails.timezone,
        country: results.country || prevDetails.country,
        city: results.city || prevDetails.city
      }));
    }
    
    setMappingResults(results);
    setActiveTab("calculator");
  };
  
  // Generate a project with proper SolarProject type
  const generateProjectData = (): SolarProject => {
    const uniqueId = Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    
    const potentialCapacity = mappingResults?.potentialCapacity || 10;
    const annualEnergy = potentialCapacity * 1600;
    
    const project: SolarProject = {
      id: `temp-${uniqueId}`,
      userId: "temp-user",
      name: "Solar Project",
      createdAt: now,
      updatedAt: now,
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
      annualEnergy: annualEnergy,
      systemSize: potentialCapacity,
      panelType: "monocrystalline",
      panelEfficiency: 20,
      inverterType: "string", 
      inverterEfficiency: 97,
      roofType: "asphalt", 
      roofAngle: 30,
      orientation: "south",
      solarIrradiance: 5,
      shadingFactor: 5,
      location: { 
        lat: locationDetails.latitude, 
        lng: locationDetails.longitude 
      },
      timezone: locationDetails.timezone,
      country: locationDetails.country,
      city: locationDetails.city,
      systemCost: potentialCapacity * 2500,
      electricityRate: 0.15,
      electricityEscalationRate: 3,
      incentives: potentialCapacity * 750,
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
    
    return project;
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
            latitude={locationDetails.latitude}
            longitude={locationDetails.longitude}
            timezone={locationDetails.timezone}
            country={locationDetails.country}
            city={locationDetails.city}
          />
        </TabsContent>
        
        <TabsContent value="calculator">
          <SolarCalculator 
            projectData={mappingResults ? generateProjectData() : undefined}
            initialLocation={locationDetails}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SolarDesignerPage;
