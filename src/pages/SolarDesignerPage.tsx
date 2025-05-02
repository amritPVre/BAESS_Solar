
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import SolarCalculator from "@/components/SolarCalculator";
import { SolarProject } from "@/types/solarProject";
import ReturnToDashboardButton from "@/components/ui/ReturnToDashboardButton";

export function SolarDesignerPage() {
  // Store location details as they're updated
  const [locationDetails, setLocationDetails] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    timezone: "America/New_York",
    country: "United States",
    city: "New York"
  });
  
  // Generate a project with proper SolarProject type
  const generateProjectData = (): SolarProject => {
    const uniqueId = Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    
    const potentialCapacity = 10;
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Solar Financial Tool</h1>
        <ReturnToDashboardButton />
      </div>
      
      <Card>
        <CardContent className="p-6">
          <SolarCalculator 
            projectData={generateProjectData()}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default SolarDesignerPage;
