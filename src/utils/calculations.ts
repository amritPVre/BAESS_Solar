
// Financial calculation utility functions

export const calculateLevelizedCostOfEnergy = (
  systemCost: number,
  totalEnergyProduced: number,
  operationalCost: number,
  lifetimeYears: number
): number => {
  // LCOE = (Total Lifetime Cost) / (Total Lifetime Energy Production)
  const totalLifetimeCost = systemCost + (operationalCost * lifetimeYears);
  const totalLifetimeEnergy = totalEnergyProduced * lifetimeYears;
  
  return totalLifetimeCost / totalLifetimeEnergy;
};

export const calculateAnnualRevenue = (
  annualProduction: number,
  electricityRate: number
): number => {
  return annualProduction * electricityRate;
};

export const calculateAnnualCost = (
  operationalCost: number,
  maintenanceCost: number
): number => {
  return operationalCost + maintenanceCost;
};

export const calculateNetPresentValue = (
  initialInvestment: number,
  annualCashFlow: number,
  discountRate: number,
  years: number
): number => {
  let npv = -initialInvestment;
  
  for (let year = 1; year <= years; year++) {
    npv += annualCashFlow / Math.pow(1 + discountRate / 100, year);
  }
  
  return npv;
};

export const calculateInternalRateOfReturn = (
  initialInvestment: number,
  annualCashFlow: number,
  years: number
): number => {
  // Simple approximation for demo
  // In a real app, would use a more complex IRR calculation
  const totalReturn = (annualCashFlow * years) - initialInvestment;
  return (totalReturn / initialInvestment) * 100 / years;
};

export const calculatePaybackPeriod = (
  initialInvestment: number,
  annualCashFlow: number
): { years: number; months: number } => {
  const totalYears = initialInvestment / annualCashFlow;
  const years = Math.floor(totalYears);
  const months = Math.round((totalYears - years) * 12);
  
  return { years, months };
};

export const calculateCO2Reduction = (
  annualEnergyProduction: number,
  carbonIntensity: number = 0.5 // Default: 0.5 kg CO2 per kWh
): number => {
  return annualEnergyProduction * carbonIntensity;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatNumber = (num: number, digits: number = 2): string => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
};

export const calculateYearlyProduction = (
  systemSize: number,
  solarIrradiance: number,
  performanceRatio: number,
  annualDegradation: number
): number[] => {
  const yearlyProduction: number[] = [];
  const baseProduction = systemSize * solarIrradiance * 365 * performanceRatio;
  
  for (let year = 0; year < 25; year++) {
    const degradationFactor = Math.pow(1 - annualDegradation / 100, year);
    yearlyProduction.push(baseProduction * degradationFactor);
  }
  
  return yearlyProduction;
};

export const calculateYearlyCashFlow = (
  initialInvestment: number,
  yearlyRevenue: number[],
  yearlyOperationalCost: number[],
  incentives: number = 0
): number[] => {
  const cashFlows: number[] = [-initialInvestment + incentives];
  
  for (let i = 0; i < yearlyRevenue.length; i++) {
    cashFlows.push(yearlyRevenue[i] - yearlyOperationalCost[i]);
  }
  
  return cashFlows;
};

export const calculateCumulativeCashFlow = (cashFlows: number[]): number[] => {
  const cumulativeCashFlow: number[] = [];
  let runningTotal = 0;
  
  for (const cashFlow of cashFlows) {
    runningTotal += cashFlow;
    cumulativeCashFlow.push(runningTotal);
  }
  
  return cumulativeCashFlow;
};
