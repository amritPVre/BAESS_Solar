
export interface SolarProject {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  
  // Client details
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  
  // Company details
  companyName: string;
  companyContact: string;
  companyEmail: string;
  companyPhone: string;
  
  // Energy details
  knowsAnnualEnergy: boolean;
  manualAnnualEnergy: number;
  annualEnergy: number;
  
  // Solar PV System details
  systemSize: number;
  panelType: string;
  panelEfficiency: number;
  inverterType: string;
  inverterEfficiency: number;
  roofType: string;
  roofAngle: number;
  orientation: string;
  solarIrradiance: number;
  shadingFactor: number;
  location: {
    lat: number;
    lng: number;
  };
  timezone: string;
  country: string;
  city: string;
  
  // Financial details
  systemCost: number;
  electricityRate: number;
  electricityEscalationRate: number;
  incentives: number;
  financingOption: string;
  loanTerm: number;
  interestRate: number;
  maintenanceCost: number;
  maintenanceEscalationRate: number;
  degradationRate: number;
  discountRate: number;
  
  // Results
  lcoe: number;
  annualRevenue: number;
  annualCost: number;
  netPresentValue: number;
  irr: number;
  paybackPeriod: {
    years: number;
    months: number;
  };
  co2Reduction: number;
  treesEquivalent: number;
  vehicleMilesOffset: number;
  yearlyProduction: number[];
  yearlyCashFlow: number[];
  cumulativeCashFlow: number[];
}
