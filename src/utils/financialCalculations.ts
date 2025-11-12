/**
 * Financial Calculations Utility
 * Big-4 Consulting Standard Formulas for Solar PV Financial Analysis
 * Based on PWC, Deloitte, EY, BCG, KPMG methodologies
 */

export interface FinancialParams {
  // Initial Investment
  totalProjectCost: number; // Total CAPEX ($)
  governmentSubsidy: number; // Lump sum subsidy ($)
  
  // Energy Generation
  annualEnergyYear1: number; // kWh
  annualDegradation: number; // % per year
  
  // Revenue Parameters
  electricityRate: number; // $/kWh
  tariffEscalationRate: number; // %
  tariffEscalationFrequency: number; // years
  
  // Operating Costs
  omExpensesPercent: number; // % of total project cost
  omEscalationRate: number; // %
  omEscalationFrequency: number; // years
  
  // Financial Parameters
  discountRate: number; // % (WACC)
  incomeTaxRate: number; // %
  projectLifetime: number; // years (default 25)
}

export interface CashFlowYear {
  year: number;
  energyGenerated: number; // kWh
  energyDegradationFactor: number; // multiplicative factor
  electricityTariff: number; // $/kWh
  revenue: number; // $
  omCost: number; // $
  grossProfit: number; // $ (Revenue - O&M)
  taxableIncome: number; // $
  tax: number; // $
  netProfit: number; // $ (Gross Profit - Tax)
  cumulativeProfit: number; // $
  discountFactor: number; // for NPV calculation
  discountedCashFlow: number; // $
  cumulativeNPV: number; // $
}

export interface FinancialResults {
  // Key Metrics
  irr: number; // %
  npv: number; // $
  lcoe: number; // $/kWh
  simplePaybackPeriod: number; // years
  discountedPaybackPeriod: number; // years
  averageROI: number; // %
  
  // Detailed Data
  cashFlowTable: CashFlowYear[];
  
  // Summary
  totalRevenue25Years: number; // $
  totalOMCosts25Years: number; // $
  totalTaxPaid25Years: number; // $
  totalNetProfit25Years: number; // $
  netInvestment: number; // $ (CAPEX - Subsidy)
}

/**
 * Calculate IRR using Newton-Raphson method
 * Industry standard for internal rate of return calculation
 */
function calculateIRR(cashFlows: number[], initialGuess: number = 0.1): number {
  const maxIterations = 100;
  const tolerance = 0.00001;
  let rate = initialGuess;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0; // derivative of NPV
    
    for (let t = 0; t < cashFlows.length; t++) {
      const discountFactor = Math.pow(1 + rate, t);
      npv += cashFlows[t] / discountFactor;
      dnpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
    }
    
    const newRate = rate - npv / dnpv;
    
    if (Math.abs(newRate - rate) < tolerance) {
      return newRate * 100; // Return as percentage
    }
    
    rate = newRate;
  }
  
  // If convergence fails, return NaN
  return NaN;
}

/**
 * Calculate NPV (Net Present Value)
 * DCF methodology as per Big-4 standards
 */
function calculateNPV(cashFlows: number[], discountRate: number): number {
  let npv = 0;
  const rate = discountRate / 100;
  
  for (let t = 0; t < cashFlows.length; t++) {
    npv += cashFlows[t] / Math.pow(1 + rate, t);
  }
  
  return npv;
}

/**
 * Calculate LCOE (Levelized Cost of Energy)
 * NREL standard methodology
 */
function calculateLCOE(
  totalCosts: number, // Sum of all costs (CAPEX + O&M) discounted
  totalEnergy: number, // Sum of all energy production discounted
  discountRate: number
): number {
  return totalCosts / totalEnergy;
}

/**
 * Calculate Payback Periods
 */
function calculatePaybackPeriods(
  cumulativeCashFlow: number[],
  discountedCumulativeCashFlow: number[]
): { simple: number; discounted: number } {
  let simplePayback = -1;
  let discountedPayback = -1;
  
  // Simple payback
  for (let i = 0; i < cumulativeCashFlow.length; i++) {
    if (cumulativeCashFlow[i] >= 0) {
      // Linear interpolation for more accurate payback
      if (i > 0) {
        const prevYear = i - 1;
        const fraction = -cumulativeCashFlow[prevYear] / 
          (cumulativeCashFlow[i] - cumulativeCashFlow[prevYear]);
        simplePayback = prevYear + fraction;
      } else {
        simplePayback = 0;
      }
      break;
    }
  }
  
  // Discounted payback
  for (let i = 0; i < discountedCumulativeCashFlow.length; i++) {
    if (discountedCumulativeCashFlow[i] >= 0) {
      if (i > 0) {
        const prevYear = i - 1;
        const fraction = -discountedCumulativeCashFlow[prevYear] / 
          (discountedCumulativeCashFlow[i] - discountedCumulativeCashFlow[prevYear]);
        discountedPayback = prevYear + fraction;
      } else {
        discountedPayback = 0;
      }
      break;
    }
  }
  
  return {
    simple: simplePayback > 0 ? simplePayback : -1,
    discounted: discountedPayback > 0 ? discountedPayback : -1
  };
}

/**
 * Main Financial Analysis Function
 * Performs comprehensive 25-year analysis with all calculations
 */
export function calculateFinancialMetrics(params: FinancialParams): FinancialResults {
  const {
    totalProjectCost,
    governmentSubsidy,
    annualEnergyYear1,
    annualDegradation,
    electricityRate,
    tariffEscalationRate,
    tariffEscalationFrequency,
    omExpensesPercent,
    omEscalationRate,
    omEscalationFrequency,
    discountRate,
    incomeTaxRate,
    projectLifetime = 25
  } = params;
  
  // Net investment (CAPEX - Subsidy)
  const netInvestment = totalProjectCost - governmentSubsidy;
  
  // Initialize arrays
  const cashFlowTable: CashFlowYear[] = [];
  const netCashFlows: number[] = [-netInvestment]; // Year 0
  const cumulativeCashFlow: number[] = [-netInvestment];
  const discountedCashFlows: number[] = [-netInvestment];
  const discountedCumulativeNPV: number[] = [-netInvestment];
  
  let totalRevenue = 0;
  let totalOMCosts = 0;
  let totalTaxPaid = 0;
  let totalNetProfit = 0;
  let totalEnergyDiscounted = 0;
  let totalCostsDiscounted = netInvestment; // Include initial investment
  
  // Generate 25-year cash flow
  for (let year = 1; year <= projectLifetime; year++) {
    // Energy generation with degradation
    const degradationFactor = Math.pow(1 - annualDegradation / 100, year - 1);
    const energyGenerated = annualEnergyYear1 * degradationFactor;
    
    // Electricity tariff with escalation
    const yearsElapsed = year - 1;
    const escalationPeriods = Math.floor(yearsElapsed / tariffEscalationFrequency);
    const tariff = electricityRate * Math.pow(1 + tariffEscalationRate / 100, escalationPeriods);
    
    // Revenue
    const revenue = energyGenerated * tariff;
    totalRevenue += revenue;
    
    // O&M costs with escalation
    const omEscalationPeriods = Math.floor(yearsElapsed / omEscalationFrequency);
    const annualOMCost = (totalProjectCost * omExpensesPercent / 100) * 
      Math.pow(1 + omEscalationRate / 100, omEscalationPeriods);
    totalOMCosts += annualOMCost;
    
    // Gross profit (before tax)
    const grossProfit = revenue - annualOMCost;
    
    // Taxable income (assuming no depreciation in this simplified model)
    // In real Big-4 analysis, depreciation would be included
    const taxableIncome = Math.max(0, grossProfit);
    const tax = taxableIncome * (incomeTaxRate / 100);
    totalTaxPaid += tax;
    
    // Net profit (after tax)
    const netProfit = grossProfit - tax;
    totalNetProfit += netProfit;
    
    // Cumulative profit
    const cumulativeProfit = (cumulativeCashFlow[year - 1] || 0) + netProfit;
    
    // Discount factor for NPV
    const discountFactor = 1 / Math.pow(1 + discountRate / 100, year);
    
    // Discounted cash flow
    const discountedCashFlow = netProfit * discountFactor;
    
    // Cumulative NPV
    const cumulativeNPV = (discountedCumulativeNPV[year - 1] || -netInvestment) + discountedCashFlow;
    
    // For LCOE calculation
    totalEnergyDiscounted += energyGenerated * discountFactor;
    totalCostsDiscounted += annualOMCost * discountFactor;
    
    // Store in table
    cashFlowTable.push({
      year,
      energyGenerated,
      energyDegradationFactor: degradationFactor,
      electricityTariff: tariff,
      revenue,
      omCost: annualOMCost,
      grossProfit,
      taxableIncome,
      tax,
      netProfit,
      cumulativeProfit,
      discountFactor,
      discountedCashFlow,
      cumulativeNPV
    });
    
    // Store for IRR and payback calculations
    netCashFlows.push(netProfit);
    cumulativeCashFlow.push(cumulativeProfit);
    discountedCashFlows.push(discountedCashFlow);
    discountedCumulativeNPV.push(cumulativeNPV);
  }
  
  // Calculate IRR using Newton-Raphson
  const irr = calculateIRR(netCashFlows);
  
  // Calculate NPV
  const npv = calculateNPV(netCashFlows, discountRate);
  
  // Calculate LCOE (NREL methodology)
  const lcoe = totalCostsDiscounted / totalEnergyDiscounted;
  
  // Calculate payback periods
  const { simple: simplePaybackPeriod, discounted: discountedPaybackPeriod } = 
    calculatePaybackPeriods(cumulativeCashFlow, discountedCumulativeNPV);
  
  // Calculate average ROI
  const averageROI = (totalNetProfit / netInvestment / projectLifetime) * 100;
  
  return {
    irr,
    npv,
    lcoe,
    simplePaybackPeriod,
    discountedPaybackPeriod,
    averageROI,
    cashFlowTable,
    totalRevenue25Years: totalRevenue,
    totalOMCosts25Years: totalOMCosts,
    totalTaxPaid25Years: totalTaxPaid,
    totalNetProfit25Years: totalNetProfit,
    netInvestment
  };
}

/**
 * Export cash flow table to CSV format
 */
export function exportCashFlowToCSV(cashFlowTable: CashFlowYear[], filename: string = 'cash_flow_25_years.csv'): void {
  const headers = [
    'Year',
    'Energy Generated (kWh)',
    'Degradation Factor',
    'Electricity Tariff ($/kWh)',
    'Revenue ($)',
    'O&M Cost ($)',
    'Gross Profit ($)',
    'Taxable Income ($)',
    'Tax ($)',
    'Net Profit ($)',
    'Cumulative Profit ($)',
    'Discount Factor',
    'Discounted Cash Flow ($)',
    'Cumulative NPV ($)'
  ];
  
  const rows = cashFlowTable.map(row => [
    row.year,
    row.energyGenerated.toFixed(0),
    row.energyDegradationFactor.toFixed(4),
    row.electricityTariff.toFixed(4),
    row.revenue.toFixed(2),
    row.omCost.toFixed(2),
    row.grossProfit.toFixed(2),
    row.taxableIncome.toFixed(2),
    row.tax.toFixed(2),
    row.netProfit.toFixed(2),
    row.cumulativeProfit.toFixed(2),
    row.discountFactor.toFixed(4),
    row.discountedCashFlow.toFixed(2),
    row.cumulativeNPV.toFixed(2)
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

