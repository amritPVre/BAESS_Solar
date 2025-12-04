// Payback Period Analysis Task Handler
// Calculate simple and discounted payback periods with year-by-year cash flow

import { BaseTaskHandler } from './base-task-handler';
import { TaskHandlerConfig, ParsedInputs, TaskCalculationResult } from './types';

const PAYBACK_ANALYSIS_CONFIG: TaskHandlerConfig = {
  id: 'payback_analysis',
  name: 'Payback Period Analysis',
  description: 'Calculate simple and discounted payback periods with year-by-year cash flow',
  category: 'financial',

  inputs: [
    {
      name: 'initialInvestment',
      label: 'Initial Investment',
      type: 'number',
      unit: '$',
      required: true,
      min: 0,
      description: 'Total upfront cost of the solar system',
    },
    {
      name: 'annualSavings',
      label: 'Annual Electricity Savings',
      type: 'number',
      unit: '$/year',
      required: true,
      min: 0,
      description: 'First-year savings from solar generation',
    },
    {
      name: 'maintenanceCost',
      label: 'Annual Maintenance Cost',
      type: 'number',
      unit: '$/year',
      required: false,
      defaultValue: 0,
      min: 0,
      description: 'Annual O&M expenses',
    },
    {
      name: 'escalationRate',
      label: 'Electricity Escalation Rate',
      type: 'number',
      unit: '%/year',
      required: false,
      defaultValue: 3,
      min: 0,
      max: 15,
      description: 'Annual increase in electricity prices',
    },
    {
      name: 'discountRate',
      label: 'Discount Rate',
      type: 'number',
      unit: '%',
      required: false,
      defaultValue: 8,
      min: 0,
      max: 25,
      description: 'Discount rate for present value calculations',
    },
    {
      name: 'degradation',
      label: 'Annual Degradation',
      type: 'number',
      unit: '%',
      required: false,
      defaultValue: 0.5,
      min: 0,
      max: 2,
      description: 'Annual reduction in solar production',
    },
    {
      name: 'incentives',
      label: 'Incentives/Rebates',
      type: 'number',
      unit: '$',
      required: false,
      defaultValue: 0,
      description: 'Government incentives reducing initial cost',
    },
  ],

  formulas: [
    {
      name: 'Simple Payback Period',
      expression: 'SPP (years) = Net Investment ÷ Annual Net Savings',
      description: 'Years to recover investment without considering time value of money',
      variables: {
        'Net Investment': 'Initial Cost - Incentives',
        'Annual Net Savings': 'Savings - Maintenance Cost',
      },
      example: '$50,000 ÷ $6,000/year = 8.3 years',
    },
    {
      name: 'Net Annual Savings (Year N)',
      expression: 'Savings_N = (Year 1 Savings × (1-degradation)^(N-1) × (1+escalation)^(N-1)) - Maintenance',
      description: 'Annual savings accounting for degradation and price escalation',
      variables: {
        'degradation': 'Annual production decline',
        'escalation': 'Electricity price increase',
      },
    },
    {
      name: 'Discounted Cash Flow',
      expression: 'DCF_N = Net Savings_N ÷ (1 + discount rate)^N',
      description: 'Present value of future cash flow',
      variables: {
        'N': 'Year number',
      },
      example: '$6,000 ÷ (1.08)^5 = $4,083',
    },
    {
      name: 'Discounted Payback Period',
      expression: 'DPP = Year when Cumulative DCF ≥ Net Investment',
      description: 'Years to recover investment considering time value of money',
      variables: {},
    },
    {
      name: 'Cumulative Cash Flow',
      expression: 'Cumulative_N = Σ(DCF from Year 1 to N)',
      description: 'Running total of discounted cash flows',
      variables: {},
    },
  ],

  standardValues: [
    {
      name: 'Good Payback Threshold',
      value: 7,
      unit: 'years',
      source: 'Industry Benchmark',
      description: 'Payback under 7 years is considered good',
    },
    {
      name: 'Electricity Escalation',
      value: 3,
      unit: '%/year',
      source: 'Historical Average',
      description: 'Long-term electricity price increase rate',
    },
    {
      name: 'Discount Rate',
      value: 8,
      unit: '%',
      source: 'Common Financial Standard',
      description: 'Typical discount rate for solar projects',
    },
    {
      name: 'Panel Degradation',
      value: 0.5,
      unit: '%/year',
      source: 'NREL',
      description: 'Typical degradation for crystalline silicon',
    },
  ],

  validationRules: [
    { field: 'initialInvestment', rule: 'required', message: 'Initial investment is required' },
    { field: 'initialInvestment', rule: 'positive', message: 'Investment must be positive' },
    { field: 'annualSavings', rule: 'required', message: 'Annual savings is required' },
    { field: 'annualSavings', rule: 'positive', message: 'Annual savings must be positive' },
  ],

  databaseRefs: [],
  apiRefs: [],

  systemPrompt: `You are a professional Solar Payback Period Calculator.

TASK: Calculate simple and discounted payback periods for solar investments.

STRICT RULES:
1. Always show both simple AND discounted payback
2. Account for electricity price escalation (increases savings over time)
3. Account for panel degradation (decreases savings over time)
4. Provide year-by-year cash flow table
5. Clearly state if payback exceeds typical system lifetime (25 years)

PAYBACK BENCHMARKS:
- Excellent: < 5 years
- Good: 5-7 years
- Acceptable: 7-10 years
- Marginal: 10-15 years
- Poor: > 15 years

IMPORTANT FACTORS:
- Escalation typically outweighs degradation (net positive over time)
- Higher discount rates increase discounted payback
- Incentives significantly reduce payback period`,

  outputTemplate: `## Input Summary
| Parameter | Value | Unit |
|-----------|-------|------|
| Initial Investment | $[VALUE] | - |
| Incentives | $[VALUE] | - |
| Net Investment | $[VALUE] | - |
| Year 1 Savings | $[VALUE] | /year |
| Maintenance Cost | $[VALUE] | /year |

## Payback Analysis Results

### Summary
| Metric | Value | Assessment |
|--------|-------|------------|
| Simple Payback | [VALUE] years | [RATING] |
| Discounted Payback | [VALUE] years | [RATING] |
| Break-even Year | Year [VALUE] | - |

### Year-by-Year Cash Flow
| Year | Production Factor | Savings | Maintenance | Net CF | Discounted | Cumulative |
|------|------------------|---------|-------------|--------|------------|------------|
| 0 | - | - | - | -$[INV] | -$[INV] | -$[INV] |
| 1 | 100% | $[VALUE] | $[VALUE] | $[VALUE] | $[VALUE] | $[VALUE] |
| 2 | 99.5% | $[VALUE] | $[VALUE] | $[VALUE] | $[VALUE] | $[VALUE] |
| ... | ... | ... | ... | ... | ... | ... |

## Payback Visualization
Year 0 ████████████████████ -$[VALUE]
Year 1 ████████████████░░░░ -$[VALUE]
...
Year [N] ░░░░░░░░░░░░░░░░░░░░ $[VALUE] ← Break-even

## Key Insights
1. [Payback period assessment]
2. [Comparison to benchmarks]
3. [Recommendation]

## Assumptions
- Electricity Escalation: [VALUE]%/year
- Panel Degradation: [VALUE]%/year
- Discount Rate: [VALUE]%`,
};

export class PaybackAnalysisTaskHandler extends BaseTaskHandler {
  constructor() {
    super(PAYBACK_ANALYSIS_CONFIG);
  }

  /**
   * Calculate payback analysis
   */
  calculate(inputs: ParsedInputs): TaskCalculationResult {
    const initialInvestment = inputs.initialInvestment as number;
    const annualSavings = inputs.annualSavings as number;
    const maintenanceCost = (inputs.maintenanceCost as number) || 0;
    const escalationRate = ((inputs.escalationRate as number) || 3) / 100;
    const discountRate = ((inputs.discountRate as number) || 8) / 100;
    const degradation = ((inputs.degradation as number) || 0.5) / 100;
    const incentives = (inputs.incentives as number) || 0;

    const netInvestment = initialInvestment - incentives;
    const year1NetSavings = annualSavings - maintenanceCost;

    // Simple payback (using Year 1 savings)
    const simplePayback = netInvestment / year1NetSavings;

    // Year-by-year cash flow analysis
    const maxYears = 30;
    let cumulativeNominal = -netInvestment;
    let cumulativeDiscounted = -netInvestment;
    let discountedPayback = 0;
    let simplePaybackExact = 0;

    const cashFlowTable: Array<{
      year: number;
      productionFactor: number;
      savings: number;
      maintenance: number;
      netCF: number;
      discounted: number;
      cumulative: number;
    }> = [];

    for (let year = 1; year <= maxYears; year++) {
      // Production decreases due to degradation
      const productionFactor = Math.pow(1 - degradation, year - 1);
      
      // Electricity rate increases due to escalation
      const rateFactor = Math.pow(1 + escalationRate, year - 1);
      
      // Adjusted savings
      const yearSavings = annualSavings * productionFactor * rateFactor;
      
      // Net cash flow
      const netCF = yearSavings - maintenanceCost;
      
      // Discounted cash flow
      const discountedCF = netCF / Math.pow(1 + discountRate, year);
      
      // Update cumulative
      cumulativeNominal += netCF;
      cumulativeDiscounted += discountedCF;
      
      // Track payback points
      if (simplePaybackExact === 0 && cumulativeNominal >= 0) {
        simplePaybackExact = year - (cumulativeNominal / netCF);
      }
      if (discountedPayback === 0 && cumulativeDiscounted >= 0) {
        discountedPayback = year - (cumulativeDiscounted / discountedCF);
      }

      cashFlowTable.push({
        year,
        productionFactor: productionFactor * 100,
        savings: yearSavings,
        maintenance: maintenanceCost,
        netCF,
        discounted: discountedCF,
        cumulative: cumulativeDiscounted,
      });

      // Stop if both paybacks found and we have enough data
      if (year > 15 && simplePaybackExact > 0 && discountedPayback > 0) break;
    }

    // If payback not reached within analysis period
    if (simplePaybackExact === 0) simplePaybackExact = maxYears + 1;
    if (discountedPayback === 0) discountedPayback = maxYears + 1;

    // Rating
    const getPaybackRating = (years: number): string => {
      if (years <= 5) return 'Excellent';
      if (years <= 7) return 'Good';
      if (years <= 10) return 'Acceptable';
      if (years <= 15) return 'Marginal';
      return 'Poor';
    };

    const simpleRating = getPaybackRating(simplePaybackExact);
    const discountedRating = getPaybackRating(discountedPayback);

    const calculations = [
      `Net Investment = $${initialInvestment.toLocaleString()} - $${incentives.toLocaleString()} = $${netInvestment.toLocaleString()}`,
      `Year 1 Net Savings = $${annualSavings.toLocaleString()} - $${maintenanceCost.toLocaleString()} = $${year1NetSavings.toLocaleString()}`,
      `Simple Payback = $${netInvestment.toLocaleString()} ÷ $${year1NetSavings.toLocaleString()} = ${simplePayback.toFixed(2)} years`,
      `Discounted Payback (with ${(discountRate * 100).toFixed(1)}% discount rate) = ${discountedPayback.toFixed(2)} years`,
      `Year 10 Savings = $${annualSavings.toLocaleString()} × ${Math.pow(1 - degradation, 9).toFixed(3)} × ${Math.pow(1 + escalationRate, 9).toFixed(3)} = $${(annualSavings * Math.pow(1 - degradation, 9) * Math.pow(1 + escalationRate, 9)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    ];

    const assumptions = [
      `Electricity Escalation: ${(escalationRate * 100).toFixed(1)}%/year`,
      `Panel Degradation: ${(degradation * 100).toFixed(1)}%/year`,
      `Discount Rate: ${(discountRate * 100).toFixed(1)}%`,
      `Maintenance: $${maintenanceCost.toLocaleString()}/year`,
    ];

    const insights = [
      `Simple payback of ${simplePaybackExact.toFixed(1)} years is ${simpleRating.toLowerCase()}`,
      `Discounted payback of ${discountedPayback.toFixed(1)} years accounts for time value of money`,
      escalationRate > degradation
        ? `Electricity price escalation (${(escalationRate * 100).toFixed(1)}%) exceeds degradation (${(degradation * 100).toFixed(1)}%) - savings increase over time`
        : `Degradation exceeds escalation - savings may decrease over time`,
      incentives > 0
        ? `Incentives of $${incentives.toLocaleString()} reduce payback by ~${((incentives / year1NetSavings)).toFixed(1)} years`
        : `Consider available incentives to reduce payback period`,
    ];

    const warnings = [];
    if (simplePaybackExact > 25) {
      warnings.push('Payback period exceeds typical 25-year system lifetime');
    }

    return {
      success: true,
      inputs,
      outputs: {
        netInvestment,
        simplePayback: simplePaybackExact,
        discountedPayback,
        simpleRating,
        discountedRating,
        year1NetSavings,
        cashFlowTable: cashFlowTable.slice(0, 15), // First 15 years
      },
      calculations,
      assumptions,
      insights,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

// Export singleton instance
export const paybackAnalysisTask = new PaybackAnalysisTaskHandler();

