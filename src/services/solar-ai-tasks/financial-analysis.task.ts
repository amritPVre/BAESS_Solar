// Financial Analysis Task Handler
// Comprehensive financial analysis including NPV, IRR, payback period, and ROI calculations

import { BaseTaskHandler } from './base-task-handler';
import { TaskHandlerConfig, ParsedInputs, TaskCalculationResult } from './types';

const FINANCIAL_ANALYSIS_CONFIG: TaskHandlerConfig = {
  id: 'financial_analysis',
  name: 'Financial Analysis',
  description: 'Comprehensive financial analysis including NPV, IRR, payback period, and ROI calculations',
  category: 'financial',

  inputs: [
    {
      name: 'systemCost',
      label: 'Total System Cost',
      type: 'number',
      unit: '$',
      required: true,
      min: 0,
      description: 'Total installed cost including equipment, labor, permits',
    },
    {
      name: 'annualProduction',
      label: 'Annual Energy Production',
      type: 'number',
      unit: 'kWh',
      required: true,
      min: 0,
      description: 'Expected first-year energy production',
    },
    {
      name: 'energyRate',
      label: 'Electricity Rate',
      type: 'number',
      unit: '$/kWh',
      required: true,
      min: 0,
      description: 'Current electricity price per kWh',
    },
    {
      name: 'projectLifetime',
      label: 'Project Lifetime',
      type: 'number',
      unit: 'years',
      required: false,
      defaultValue: 25,
      min: 1,
      max: 40,
      description: 'Expected system operating lifetime',
    },
    {
      name: 'discountRate',
      label: 'Discount Rate',
      type: 'number',
      unit: '%',
      required: false,
      defaultValue: 8,
      min: 0,
      max: 30,
      description: 'Discount rate for NPV calculation (opportunity cost)',
    },
    {
      name: 'annualDegradation',
      label: 'Annual Degradation',
      type: 'number',
      unit: '%',
      required: false,
      defaultValue: 0.5,
      min: 0,
      max: 2,
      description: 'Panel performance degradation per year',
    },
    {
      name: 'electricityEscalation',
      label: 'Electricity Price Escalation',
      type: 'number',
      unit: '%/year',
      required: false,
      defaultValue: 3,
      min: 0,
      max: 15,
      description: 'Expected annual increase in electricity prices',
    },
    {
      name: 'annualOMCost',
      label: 'Annual O&M Cost',
      type: 'number',
      unit: '$',
      required: false,
      defaultValue: 0,
      min: 0,
      description: 'Annual operation and maintenance costs',
    },
    {
      name: 'incentives',
      label: 'Incentives/Rebates',
      type: 'number',
      unit: '$',
      required: false,
      defaultValue: 0,
      min: 0,
      description: 'Government incentives, tax credits, rebates',
    },
  ],

  formulas: [
    {
      name: 'Net Present Value (NPV)',
      expression: 'NPV = Σ(CFₜ ÷ (1 + r)ᵗ) - Initial Investment',
      description: 'Sum of discounted cash flows minus initial investment',
      variables: {
        'CFₜ': 'Cash flow in year t (savings - O&M)',
        'r': 'Discount rate (decimal)',
        't': 'Year number (1 to n)',
      },
      example: 'NPV = (5000/1.08¹ + 5000/1.08² + ...) - 50000',
    },
    {
      name: 'Internal Rate of Return (IRR)',
      expression: 'IRR = Rate (r) where NPV = 0',
      description: 'Discount rate that makes NPV equal to zero',
      variables: {
        'IRR': 'Return rate that balances investment with returns',
      },
      example: 'If NPV=0 at r=12%, then IRR=12%',
    },
    {
      name: 'Simple Payback Period',
      expression: 'Payback = Initial Investment ÷ Annual Savings',
      description: 'Years to recover investment without discounting',
      variables: {
        'Annual Savings': 'Year 1 electricity savings',
      },
      example: 'Payback = $50,000 ÷ $6,000 = 8.3 years',
    },
    {
      name: 'Discounted Payback Period',
      expression: 'Year when Cumulative Discounted CF ≥ Initial Investment',
      description: 'Years to recover investment considering time value of money',
      variables: {
        'Discounted CF': 'Cash flow ÷ (1+r)ᵗ',
      },
    },
    {
      name: 'Return on Investment (ROI)',
      expression: 'ROI = (Total Benefits - Total Cost) ÷ Total Cost × 100',
      description: 'Percentage return over project lifetime',
      variables: {
        'Total Benefits': 'Lifetime savings',
        'Total Cost': 'System cost + O&M - Incentives',
      },
      example: 'ROI = (150000 - 50000) ÷ 50000 × 100 = 200%',
    },
    {
      name: 'Levelized Cost of Energy (LCOE)',
      expression: 'LCOE = (Total Lifetime Cost) ÷ (Total Lifetime Energy)',
      description: 'Cost per kWh of solar energy over system lifetime',
      variables: {
        'Total Lifetime Cost': 'System cost + NPV of O&M',
        'Total Lifetime Energy': 'Sum of degraded annual production',
      },
      example: 'LCOE = $55,000 ÷ 250,000 kWh = $0.22/kWh',
    },
  ],

  standardValues: [
    {
      name: 'System Lifetime',
      value: 25,
      unit: 'years',
      source: 'Industry Standard',
      description: 'Typical warranted lifetime for solar panels',
    },
    {
      name: 'Discount Rate',
      value: 8,
      unit: '%',
      source: 'Financial Standard',
      description: 'Common discount rate for solar investments',
    },
    {
      name: 'Panel Degradation',
      value: 0.5,
      unit: '%/year',
      source: 'NREL',
      description: 'Typical annual degradation for crystalline silicon',
    },
    {
      name: 'Electricity Escalation',
      value: 3,
      unit: '%/year',
      source: 'Historical Average',
      description: 'Long-term electricity price increase rate',
    },
  ],

  validationRules: [
    { field: 'systemCost', rule: 'required', message: 'System cost is required' },
    { field: 'systemCost', rule: 'positive', message: 'System cost must be positive' },
    { field: 'annualProduction', rule: 'required', message: 'Annual production is required' },
    { field: 'annualProduction', rule: 'positive', message: 'Annual production must be positive' },
    { field: 'energyRate', rule: 'required', message: 'Electricity rate is required' },
    { field: 'energyRate', rule: 'positive', message: 'Electricity rate must be positive' },
    { field: 'discountRate', rule: 'range', value: [0, 30], message: 'Discount rate should be 0-30%' },
  ],

  databaseRefs: [
    {
      table: 'electricity_rates',
      operation: 'read',
      description: 'Historical and current electricity rates by region',
      fields: ['region', 'rate_kwh', 'peak_rate', 'off_peak_rate', 'effective_date'],
    },
    {
      table: 'financial_results',
      operation: 'write',
      description: 'Store financial analysis results for projects',
      fields: ['project_id', 'npv', 'irr', 'payback', 'roi', 'lcoe', 'created_at'],
    },
    {
      table: 'incentive_programs',
      operation: 'read',
      description: 'Available solar incentives and tax credits by location',
      fields: ['program_name', 'region', 'amount', 'type', 'expiry_date', 'requirements'],
    },
  ],

  apiRefs: [
    {
      name: 'EIA Electricity Data',
      endpoint: 'https://api.eia.gov/v2/electricity/',
      purpose: 'US electricity prices and rate trends',
      dataProvided: ['Average retail prices', 'Historical rates', 'Regional data'],
    },
  ],

  systemPrompt: `You are a professional Solar Financial Analyst.

TASK: Perform comprehensive financial analysis for solar PV investments.

STRICT RULES:
1. Calculate ALL key metrics: NPV, IRR, Payback, ROI, LCOE
2. Account for panel degradation in energy production
3. Account for electricity price escalation in savings
4. Apply discount rate consistently
5. Show year-by-year cash flow table
6. Present clear comparison with alternative investments

CALCULATION NOTES:
- Year 1 production = stated annual production
- Year N production = Year 1 × (1 - degradation)^(N-1)
- Year N electricity rate = Year 1 rate × (1 + escalation)^(N-1)
- Year N savings = Year N production × Year N rate
- IRR found iteratively (NPV = 0)

FINANCIAL THRESHOLDS:
- Good NPV: Positive
- Good IRR: > Discount Rate
- Good Payback: < 10 years
- Good LCOE: < Grid Rate`,

  outputTemplate: `## Input Summary
| Parameter | Value | Unit |
|-----------|-------|------|
| System Cost | $[VALUE] | - |
| Annual Production | [VALUE] | kWh |
| Electricity Rate | $[VALUE] | /kWh |
| Project Lifetime | [VALUE] | years |
| Discount Rate | [VALUE] | % |

## Cash Flow Analysis (First 10 Years)
| Year | Production | Rate | Savings | O&M | Net CF | Discounted CF | Cumulative |
|------|------------|------|---------|-----|--------|---------------|------------|
| 0 | - | - | - | - | -$[COST] | -$[COST] | -$[COST] |
| 1 | [kWh] | $[rate] | $[save] | $[om] | $[net] | $[disc] | $[cum] |
| ... | ... | ... | ... | ... | ... | ... | ... |

## Financial Metrics
| Metric | Value | Assessment |
|--------|-------|------------|
| Net Present Value (NPV) | $[VALUE] | ✓ Positive / ✗ Negative |
| Internal Rate of Return (IRR) | [VALUE]% | ✓ > Discount Rate / ✗ < Discount Rate |
| Simple Payback | [VALUE] years | ✓ < 10 years / ✗ > 10 years |
| Discounted Payback | [VALUE] years | - |
| Return on Investment (ROI) | [VALUE]% | - |
| LCOE | $[VALUE]/kWh | ✓ < Grid / ✗ > Grid |

## Lifetime Summary
| Item | Value |
|------|-------|
| Total Energy Generated | [VALUE] kWh |
| Total Savings | $[VALUE] |
| Total O&M Costs | $[VALUE] |
| Net Lifetime Value | $[VALUE] |

## Key Insights
1. [Investment quality assessment]
2. [Comparison to other investments]
3. [Recommendation]

## Assumptions
- Degradation: [VALUE]%/year
- Escalation: [VALUE]%/year
- O&M: $[VALUE]/year`,
};

export class FinancialAnalysisTaskHandler extends BaseTaskHandler {
  constructor() {
    super(FINANCIAL_ANALYSIS_CONFIG);
  }

  /**
   * Calculate IRR using Newton-Raphson method
   */
  private calculateIRR(cashFlows: number[], maxIterations = 100, tolerance = 0.0001): number {
    let rate = 0.1; // Initial guess

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let derivative = 0;

      for (let t = 0; t < cashFlows.length; t++) {
        npv += cashFlows[t] / Math.pow(1 + rate, t);
        if (t > 0) {
          derivative -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
        }
      }

      if (Math.abs(npv) < tolerance) break;
      if (derivative === 0) break;

      rate = rate - npv / derivative;
    }

    return rate * 100; // Return as percentage
  }

  /**
   * Calculate financial analysis
   */
  calculate(inputs: ParsedInputs): TaskCalculationResult {
    const systemCost = inputs.systemCost as number;
    const annualProduction = inputs.annualProduction as number;
    const energyRate = inputs.energyRate as number;
    const projectLifetime = (inputs.projectLifetime as number) || 25;
    const discountRate = ((inputs.discountRate as number) || 8) / 100;
    const degradation = ((inputs.annualDegradation as number) || 0.5) / 100;
    const escalation = ((inputs.electricityEscalation as number) || 3) / 100;
    const annualOM = (inputs.annualOMCost as number) || 0;
    const incentives = (inputs.incentives as number) || 0;

    const netInitialCost = systemCost - incentives;

    // Build cash flow array
    const cashFlows: number[] = [-netInitialCost];
    const yearlyData: Array<{
      year: number;
      production: number;
      rate: number;
      savings: number;
      om: number;
      netCF: number;
      discountedCF: number;
      cumulative: number;
    }> = [];

    let totalProduction = 0;
    let totalSavings = 0;
    let cumulativeDiscounted = -netInitialCost;
    let simplePayback = 0;
    let discountedPayback = 0;
    let cumulativeNominal = -netInitialCost;

    for (let year = 1; year <= projectLifetime; year++) {
      const production = annualProduction * Math.pow(1 - degradation, year - 1);
      const rate = energyRate * Math.pow(1 + escalation, year - 1);
      const savings = production * rate;
      const netCF = savings - annualOM;
      const discountedCF = netCF / Math.pow(1 + discountRate, year);

      cumulativeDiscounted += discountedCF;
      cumulativeNominal += netCF;

      cashFlows.push(netCF);
      totalProduction += production;
      totalSavings += savings;

      // Find payback periods
      if (simplePayback === 0 && cumulativeNominal >= 0) {
        simplePayback = year - (cumulativeNominal / netCF);
      }
      if (discountedPayback === 0 && cumulativeDiscounted >= 0) {
        discountedPayback = year - (cumulativeDiscounted / discountedCF);
      }

      yearlyData.push({
        year,
        production,
        rate,
        savings,
        om: annualOM,
        netCF,
        discountedCF,
        cumulative: cumulativeDiscounted,
      });
    }

    // Calculate metrics
    const npv = cumulativeDiscounted;
    const irr = this.calculateIRR(cashFlows);
    const totalOMCosts = annualOM * projectLifetime;
    const roi = ((totalSavings - totalOMCosts - netInitialCost) / netInitialCost) * 100;
    const lcoe = (netInitialCost + totalOMCosts / (1 + discountRate)) / totalProduction;

    const calculations = [
      `Net Initial Cost = $${systemCost.toLocaleString()} - $${incentives.toLocaleString()} = $${netInitialCost.toLocaleString()}`,
      `Year 1 Savings = ${annualProduction.toLocaleString()} kWh × $${energyRate}/kWh = $${(annualProduction * energyRate).toLocaleString()}`,
      `NPV = Sum of discounted cash flows = $${npv.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      `IRR = ${irr.toFixed(2)}% (rate where NPV = 0)`,
      `Simple Payback = ${simplePayback.toFixed(1)} years`,
      `Discounted Payback = ${discountedPayback.toFixed(1)} years`,
      `Total ${projectLifetime}-year production = ${totalProduction.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh`,
      `Total ${projectLifetime}-year savings = $${totalSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      `ROI = ($${totalSavings.toLocaleString()} - $${totalOMCosts.toLocaleString()} - $${netInitialCost.toLocaleString()}) / $${netInitialCost.toLocaleString()} × 100 = ${roi.toFixed(1)}%`,
      `LCOE = ($${netInitialCost.toLocaleString()} + NPV of O&M) / ${totalProduction.toLocaleString()} kWh = $${lcoe.toFixed(4)}/kWh`,
    ];

    const assumptions = [
      `Project Lifetime: ${projectLifetime} years`,
      `Discount Rate: ${(discountRate * 100).toFixed(1)}%`,
      `Annual Degradation: ${(degradation * 100).toFixed(2)}%`,
      `Electricity Escalation: ${(escalation * 100).toFixed(1)}%/year`,
      `Annual O&M: $${annualOM.toLocaleString()}`,
    ];

    const npvAssessment = npv > 0 ? 'Positive (Good)' : 'Negative (Poor)';
    const irrAssessment = irr > discountRate * 100 ? 'Exceeds discount rate (Good)' : 'Below discount rate (Poor)';
    const paybackAssessment = simplePayback < 10 ? 'Under 10 years (Good)' : 'Over 10 years (Long)';
    const lcoeAssessment = lcoe < energyRate ? 'Below grid rate (Competitive)' : 'Above grid rate (Higher)';

    const insights = [
      `This investment has an NPV of $${npv.toLocaleString(undefined, { maximumFractionDigits: 0 })} - ${npvAssessment}`,
      `IRR of ${irr.toFixed(1)}% ${irrAssessment}`,
      `System pays back in ${simplePayback.toFixed(1)} years - ${paybackAssessment}`,
      `LCOE of $${lcoe.toFixed(3)}/kWh ${lcoeAssessment}`,
    ];

    const warnings = [];
    if (npv < 0) warnings.push('Negative NPV indicates this may not be a financially viable investment at the given discount rate');
    if (simplePayback > projectLifetime) warnings.push('Payback period exceeds project lifetime');

    return {
      success: true,
      inputs,
      outputs: {
        npv,
        irr,
        simplePayback,
        discountedPayback,
        roi,
        lcoe,
        totalProduction,
        totalSavings,
        totalOMCosts,
        netInitialCost,
      },
      calculations,
      assumptions,
      insights,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

// Export singleton instance
export const financialAnalysisTask = new FinancialAnalysisTaskHandler();

