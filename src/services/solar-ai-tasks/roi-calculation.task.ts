// Return on Investment Calculation Task Handler
// Calculate ROI and benefit-cost ratio for solar investment

import { BaseTaskHandler } from './base-task-handler';
import { TaskHandlerConfig, ParsedInputs, TaskCalculationResult } from './types';

const ROI_CALCULATION_CONFIG: TaskHandlerConfig = {
  id: 'roi_calculation',
  name: 'Return on Investment',
  description: 'Calculate ROI and benefit-cost ratio for solar investment',
  category: 'financial',

  inputs: [
    {
      name: 'totalInvestment',
      label: 'Total Investment',
      type: 'number',
      unit: '$',
      required: true,
      min: 0,
      description: 'Total upfront cost including equipment, installation, permits',
    },
    {
      name: 'annualSavings',
      label: 'Annual Savings',
      type: 'number',
      unit: '$/year',
      required: true,
      min: 0,
      description: 'Annual electricity cost savings',
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
      name: 'annualOMCost',
      label: 'Annual O&M Cost',
      type: 'number',
      unit: '$/year',
      required: false,
      defaultValue: 0,
      description: 'Annual operation and maintenance costs',
    },
    {
      name: 'escalationRate',
      label: 'Savings Escalation Rate',
      type: 'number',
      unit: '%/year',
      required: false,
      defaultValue: 3,
      description: 'Annual increase in savings due to electricity price rise',
    },
    {
      name: 'degradation',
      label: 'Annual Degradation',
      type: 'number',
      unit: '%/year',
      required: false,
      defaultValue: 0.5,
      description: 'Annual reduction in energy production',
    },
    {
      name: 'incentives',
      label: 'Incentives/Rebates',
      type: 'number',
      unit: '$',
      required: false,
      defaultValue: 0,
      description: 'Government incentives and tax credits',
    },
    {
      name: 'residualValue',
      label: 'Residual/Salvage Value',
      type: 'number',
      unit: '$',
      required: false,
      defaultValue: 0,
      description: 'Expected value at end of project life',
    },
  ],

  formulas: [
    {
      name: 'Simple ROI',
      expression: 'ROI (%) = (Total Benefits - Total Costs) ÷ Total Costs × 100',
      description: 'Basic return on investment over project lifetime',
      variables: {
        'Total Benefits': 'Sum of all savings over lifetime',
        'Total Costs': 'Investment + O&M - Incentives',
      },
      example: 'ROI = ($150,000 - $60,000) ÷ $60,000 × 100 = 150%',
    },
    {
      name: 'Annualized ROI',
      expression: 'Annual ROI (%) = ROI ÷ Project Lifetime',
      description: 'Average annual return',
      variables: {},
      example: '150% ÷ 25 years = 6% per year',
    },
    {
      name: 'Benefit-Cost Ratio (BCR)',
      expression: 'BCR = Total Benefits ÷ Total Costs',
      description: 'Ratio of benefits to costs (>1 is profitable)',
      variables: {},
      example: 'BCR = $150,000 ÷ $60,000 = 2.5',
    },
    {
      name: 'Net Benefit',
      expression: 'Net Benefit ($) = Total Benefits - Total Costs',
      description: 'Absolute profit over project lifetime',
      variables: {},
      example: 'Net Benefit = $150,000 - $60,000 = $90,000',
    },
    {
      name: 'Lifetime Benefits with Escalation',
      expression: 'Total Benefits = Σ(Annual Savings × (1-deg)^(n-1) × (1+esc)^(n-1))',
      description: 'Sum of adjusted annual savings over lifetime',
      variables: {
        'deg': 'Degradation rate',
        'esc': 'Escalation rate',
      },
    },
  ],

  standardValues: [
    {
      name: 'Good ROI Threshold',
      value: 100,
      unit: '%',
      source: 'Financial Standard',
      description: 'Double your money over project lifetime',
    },
    {
      name: 'Good BCR Threshold',
      value: 1.5,
      unit: '',
      source: 'Financial Standard',
      description: 'Benefits should be 1.5x costs or more',
    },
    {
      name: 'System Lifetime',
      value: 25,
      unit: 'years',
      source: 'Industry Standard',
      description: 'Typical warranted lifetime for solar panels',
    },
  ],

  validationRules: [
    { field: 'totalInvestment', rule: 'required', message: 'Total investment is required' },
    { field: 'totalInvestment', rule: 'positive', message: 'Investment must be positive' },
    { field: 'annualSavings', rule: 'required', message: 'Annual savings is required' },
    { field: 'annualSavings', rule: 'positive', message: 'Annual savings must be positive' },
  ],

  databaseRefs: [],
  apiRefs: [],

  systemPrompt: `You are a professional Solar ROI Calculator.

TASK: Calculate return on investment and benefit-cost ratio for solar investments.

STRICT RULES:
1. Account for degradation and escalation in lifetime benefits
2. Include O&M costs in total costs
3. Apply incentives to reduce net investment
4. Provide both percentage ROI and absolute net benefit
5. Calculate BCR (benefit-cost ratio)

ROI BENCHMARKS:
- Excellent: >200% (3x return)
- Good: 100-200% (2-3x return)
- Acceptable: 50-100% (1.5-2x return)
- Marginal: 0-50%
- Poor: <0% (loss)

BCR INTERPRETATION:
- BCR > 2.0: Excellent investment
- BCR 1.5-2.0: Good investment
- BCR 1.0-1.5: Marginal investment
- BCR < 1.0: Loss-making

ANNUALIZED ROI:
- Should exceed discount rate (typically 8%)
- Compare to alternative investments`,

  outputTemplate: `## Input Summary
| Parameter | Value | Unit |
|-----------|-------|------|
| Total Investment | $[VALUE] | - |
| Incentives | $[VALUE] | - |
| Net Investment | $[VALUE] | - |
| Annual Savings (Year 1) | $[VALUE] | /year |
| Annual O&M | $[VALUE] | /year |
| Project Lifetime | [VALUE] | years |

## ROI Analysis Results

### Summary Metrics
| Metric | Value | Assessment |
|--------|-------|------------|
| Total Lifetime Benefits | $[VALUE] | - |
| Total Lifetime Costs | $[VALUE] | - |
| Net Benefit | $[VALUE] | - |
| ROI | [VALUE]% | [RATING] |
| Annualized ROI | [VALUE]% | - |
| Benefit-Cost Ratio | [VALUE] | [RATING] |

### Year-by-Year Value
| Year | Cum. Benefits | Cum. Costs | Net Value |
|------|---------------|------------|-----------|
| 5 | $[VALUE] | $[VALUE] | $[VALUE] |
| 10 | $[VALUE] | $[VALUE] | $[VALUE] |
| 15 | $[VALUE] | $[VALUE] | $[VALUE] |
| 20 | $[VALUE] | $[VALUE] | $[VALUE] |
| 25 | $[VALUE] | $[VALUE] | $[VALUE] |

## Investment Comparison
| Investment Type | Expected Return |
|-----------------|-----------------|
| This Solar Project | [VALUE]% annual |
| Bank Savings | ~3-5% annual |
| Stock Market (avg) | ~7-10% annual |
| Bonds | ~4-6% annual |

## Key Insights
1. [ROI assessment]
2. [BCR interpretation]
3. [Comparison to alternatives]

## Assumptions
- Escalation: [VALUE]%/year
- Degradation: [VALUE]%/year
- O&M: $[VALUE]/year`,
};

export class ROICalculationTaskHandler extends BaseTaskHandler {
  constructor() {
    super(ROI_CALCULATION_CONFIG);
  }

  /**
   * Calculate ROI
   */
  calculate(inputs: ParsedInputs): TaskCalculationResult {
    const totalInvestment = inputs.totalInvestment as number;
    const annualSavings = inputs.annualSavings as number;
    const projectLifetime = (inputs.projectLifetime as number) || 25;
    const annualOMCost = (inputs.annualOMCost as number) || 0;
    const escalationRate = ((inputs.escalationRate as number) || 3) / 100;
    const degradation = ((inputs.degradation as number) || 0.5) / 100;
    const incentives = (inputs.incentives as number) || 0;
    const residualValue = (inputs.residualValue as number) || 0;

    // Net investment
    const netInvestment = totalInvestment - incentives;

    // Calculate lifetime benefits with degradation and escalation
    let totalBenefits = 0;
    const yearlyBenefits: number[] = [];
    
    for (let year = 1; year <= projectLifetime; year++) {
      const productionFactor = Math.pow(1 - degradation, year - 1);
      const rateFactor = Math.pow(1 + escalationRate, year - 1);
      const yearBenefit = annualSavings * productionFactor * rateFactor;
      totalBenefits += yearBenefit;
      yearlyBenefits.push(yearBenefit);
    }

    // Add residual value to benefits
    totalBenefits += residualValue;

    // Calculate total costs
    const totalOMCosts = annualOMCost * projectLifetime;
    const totalCosts = netInvestment + totalOMCosts;

    // Calculate ROI metrics
    const netBenefit = totalBenefits - totalCosts;
    const roi = (netBenefit / totalCosts) * 100;
    const annualizedROI = roi / projectLifetime;
    const bcr = totalBenefits / totalCosts;

    // Milestone values
    const getMilestoneValue = (years: number): { benefits: number; costs: number; net: number } => {
      let benefits = 0;
      for (let y = 0; y < years && y < yearlyBenefits.length; y++) {
        benefits += yearlyBenefits[y];
      }
      const costs = netInvestment + (annualOMCost * years);
      return { benefits, costs, net: benefits - costs };
    };

    const milestones = [5, 10, 15, 20, 25].map(y => ({
      year: y,
      ...getMilestoneValue(y),
    }));

    // Ratings
    const getROIRating = (roiVal: number): string => {
      if (roiVal > 200) return 'Excellent';
      if (roiVal > 100) return 'Good';
      if (roiVal > 50) return 'Acceptable';
      if (roiVal > 0) return 'Marginal';
      return 'Poor';
    };

    const getBCRRating = (bcrVal: number): string => {
      if (bcrVal > 2.0) return 'Excellent';
      if (bcrVal > 1.5) return 'Good';
      if (bcrVal > 1.0) return 'Acceptable';
      return 'Loss-making';
    };

    const roiRating = getROIRating(roi);
    const bcrRating = getBCRRating(bcr);

    const calculations = [
      `Net Investment = $${totalInvestment.toLocaleString()} - $${incentives.toLocaleString()} = $${netInvestment.toLocaleString()}`,
      `Lifetime Benefits = Σ(Annual Savings adjusted for degradation and escalation) = $${totalBenefits.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      `Total Costs = $${netInvestment.toLocaleString()} + ($${annualOMCost.toLocaleString()} × ${projectLifetime}) = $${totalCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      `Net Benefit = $${totalBenefits.toLocaleString(undefined, { maximumFractionDigits: 0 })} - $${totalCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })} = $${netBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      `ROI = $${netBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })} ÷ $${totalCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })} × 100 = ${roi.toFixed(1)}%`,
      `Annualized ROI = ${roi.toFixed(1)}% ÷ ${projectLifetime} = ${annualizedROI.toFixed(2)}%`,
      `BCR = $${totalBenefits.toLocaleString(undefined, { maximumFractionDigits: 0 })} ÷ $${totalCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })} = ${bcr.toFixed(2)}`,
    ];

    const assumptions = [
      `Project Lifetime: ${projectLifetime} years`,
      `Savings Escalation: ${(escalationRate * 100).toFixed(1)}%/year`,
      `Degradation: ${(degradation * 100).toFixed(1)}%/year`,
      `Annual O&M: $${annualOMCost.toLocaleString()}`,
      `Residual Value: $${residualValue.toLocaleString()}`,
    ];

    const insights = [
      `ROI of ${roi.toFixed(1)}% over ${projectLifetime} years is ${roiRating.toLowerCase()} - ${roi > 100 ? 'more than doubling' : roi > 0 ? 'positive return on' : 'loss on'} your investment`,
      `BCR of ${bcr.toFixed(2)} means every $1 invested returns $${bcr.toFixed(2)} in benefits - ${bcrRating.toLowerCase()}`,
      `Annualized return of ${annualizedROI.toFixed(2)}% ${annualizedROI > 8 ? 'exceeds' : 'is below'} typical 8% discount rate`,
      `Net benefit of $${netBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })} over system lifetime`,
    ];

    const warnings = [];
    if (roi < 0) {
      warnings.push('Negative ROI indicates the project costs more than it saves');
    }
    if (annualizedROI < 5) {
      warnings.push('Low annualized return - compare to alternative investments');
    }

    return {
      success: true,
      inputs,
      outputs: {
        netInvestment,
        totalBenefits,
        totalCosts,
        netBenefit,
        roi,
        annualizedROI,
        bcr,
        roiRating,
        bcrRating,
        milestones,
        totalOMCosts,
      },
      calculations,
      assumptions,
      insights,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

// Export singleton instance
export const roiCalculationTask = new ROICalculationTaskHandler();

