// Load Profile Analysis Task Handler
// Analyze load patterns and peak demand to optimize system design

import { BaseTaskHandler } from './base-task-handler';
import { TaskHandlerConfig, ParsedInputs, TaskCalculationResult } from './types';

const LOAD_ANALYSIS_CONFIG: TaskHandlerConfig = {
  id: 'load_analysis',
  name: 'Load Profile Analysis',
  description: 'Analyze load patterns and peak demand to optimize system design',
  category: 'technical',

  inputs: [
    {
      name: 'dailyConsumption',
      label: 'Daily Energy Consumption',
      type: 'number',
      unit: 'kWh',
      required: true,
      min: 0,
      description: 'Total daily electricity usage',
    },
    {
      name: 'peakDemand',
      label: 'Peak Demand',
      type: 'number',
      unit: 'kW',
      required: true,
      min: 0,
      description: 'Maximum instantaneous power draw',
    },
    {
      name: 'operatingHours',
      label: 'Operating Hours',
      type: 'number',
      unit: 'hours',
      required: false,
      defaultValue: 24,
      min: 1,
      max: 24,
      description: 'Hours per day the facility operates',
    },
    {
      name: 'loadType',
      label: 'Load Type',
      type: 'select',
      required: false,
      defaultValue: 'mixed',
      options: ['residential', 'commercial', 'industrial', 'agricultural', 'mixed'],
      description: 'Type of electrical load profile',
    },
    {
      name: 'monthlyBill',
      label: 'Monthly Electricity Bill',
      type: 'number',
      unit: '$',
      required: false,
      description: 'Average monthly electricity cost',
    },
    {
      name: 'electricityRate',
      label: 'Electricity Rate',
      type: 'number',
      unit: '$/kWh',
      required: false,
      description: 'Cost per kWh (calculated from bill if not provided)',
    },
  ],

  formulas: [
    {
      name: 'Average Load',
      expression: 'Average Load (kW) = Daily Consumption (kWh) ÷ Operating Hours',
      description: 'Average power draw during operation',
      variables: {
        'Daily Consumption': 'Total kWh per day',
        'Operating Hours': 'Hours of operation per day',
      },
      example: '100 kWh ÷ 10 hours = 10 kW average',
    },
    {
      name: 'Load Factor',
      expression: 'Load Factor = Average Load ÷ Peak Load × 100',
      description: 'Ratio of average to peak demand (efficiency indicator)',
      variables: {
        'Higher LF': 'More efficient, consistent load (industrial)',
        'Lower LF': 'Spiky demand, residential typical',
      },
      example: '10 kW ÷ 25 kW × 100 = 40% load factor',
    },
    {
      name: 'Demand Factor',
      expression: 'Demand Factor = Peak Demand ÷ Connected Load × 100',
      description: 'Ratio of peak demand to total connected load',
      variables: {
        'Connected Load': 'Sum of all equipment ratings',
      },
    },
    {
      name: 'Monthly Consumption',
      expression: 'Monthly (kWh) = Daily Consumption × 30',
      description: 'Estimated monthly energy usage',
      variables: {},
      example: '100 kWh/day × 30 = 3,000 kWh/month',
    },
    {
      name: 'Annual Consumption',
      expression: 'Annual (kWh) = Daily Consumption × 365',
      description: 'Estimated annual energy usage',
      variables: {},
      example: '100 kWh/day × 365 = 36,500 kWh/year',
    },
    {
      name: 'Recommended PV Size',
      expression: 'PV Size (kWp) = Annual Consumption ÷ (PSH × 365 × PR)',
      description: 'Suggested solar system size to offset consumption',
      variables: {
        'PSH': 'Peak Sun Hours (location dependent)',
        'PR': 'Performance Ratio (typically 0.80)',
      },
    },
  ],

  standardValues: [
    {
      name: 'Residential Load Factor',
      value: '20-40',
      unit: '%',
      source: 'Industry Average',
      description: 'Typical residential LF due to evening peaks',
    },
    {
      name: 'Commercial Load Factor',
      value: '40-60',
      unit: '%',
      source: 'Industry Average',
      description: 'Commercial with regular business hours',
    },
    {
      name: 'Industrial Load Factor',
      value: '60-80',
      unit: '%',
      source: 'Industry Average',
      description: 'Continuous industrial operations',
    },
    {
      name: 'Performance Ratio',
      value: 0.80,
      unit: '',
      source: 'IEC 61724',
      description: 'Typical PV system performance ratio',
    },
  ],

  validationRules: [
    { field: 'dailyConsumption', rule: 'required', message: 'Daily consumption is required' },
    { field: 'dailyConsumption', rule: 'positive', message: 'Daily consumption must be positive' },
    { field: 'peakDemand', rule: 'required', message: 'Peak demand is required' },
    { field: 'peakDemand', rule: 'positive', message: 'Peak demand must be positive' },
  ],

  databaseRefs: [
    {
      table: 'load_profiles',
      operation: 'read',
      description: 'Standard load profile templates by type',
      fields: ['profile_type', 'hourly_factors', 'peak_hours', 'base_load_percent'],
    },
    {
      table: 'electricity_rates',
      operation: 'read',
      description: 'Regional electricity pricing',
      fields: ['region', 'residential_rate', 'commercial_rate', 'peak_rate', 'off_peak_rate'],
    },
  ],

  apiRefs: [],

  systemPrompt: `You are a professional Load Profile Analyzer for solar PV system design.

TASK: Analyze electrical load patterns to optimize solar system sizing.

STRICT RULES:
1. Calculate load factor as key efficiency metric
2. Identify peak demand periods
3. Recommend appropriate PV system size
4. Assess solar-load matching potential

LOAD FACTOR INTERPRETATION:
- <30%: High peak, low base - residential evening peaks
- 30-50%: Moderate variation - small commercial
- 50-70%: Consistent load - large commercial
- >70%: Very consistent - industrial 24/7 operations

SOLAR MATCHING:
- Daytime loads (commercial): Excellent solar match
- Evening peaks (residential): Consider battery storage
- 24/7 operations: Size for base load, grid for peaks

TYPICAL LOAD PATTERNS:
- Residential: Low morning, evening peak (6-9 PM)
- Commercial: 9 AM - 6 PM peak, matches solar well
- Industrial: Consistent, may have shift patterns`,

  outputTemplate: `## Input Summary
| Parameter | Value | Unit |
|-----------|-------|------|
| Daily Consumption | [VALUE] | kWh |
| Peak Demand | [VALUE] | kW |
| Operating Hours | [VALUE] | hours |
| Load Type | [VALUE] | - |

## Load Analysis Results

### Power Metrics
| Metric | Value | Unit |
|--------|-------|------|
| Average Load | [VALUE] | kW |
| Peak Demand | [VALUE] | kW |
| Load Factor | [VALUE] | % |
| Base Load (est.) | [VALUE] | kW |

### Energy Consumption
| Period | Consumption | Cost |
|--------|-------------|------|
| Daily | [VALUE] kWh | $[VALUE] |
| Monthly | [VALUE] kWh | $[VALUE] |
| Annual | [VALUE] kWh | $[VALUE] |

### Solar System Recommendation
| Parameter | Value | Unit |
|-----------|-------|------|
| Recommended PV Size | [VALUE] | kWp |
| Est. Annual Production | [VALUE] | kWh |
| Solar Offset | [VALUE] | % |

## Load Profile Assessment
- Load Factor: [VALUE]% - [INTERPRETATION]
- Solar Matching: [GOOD/MODERATE/CHALLENGING]
- Storage Recommendation: [YES/NO - REASON]

## Key Insights
1. [Load pattern characteristic]
2. [Solar sizing recommendation]
3. [Optimization opportunity]

## Assumptions
- Average PSH: [VALUE] hours
- Performance Ratio: 80%
- Electricity Rate: $[VALUE]/kWh`,
};

// Load profile patterns by type
const LOAD_PROFILES: Record<string, { baseFactor: number; peakHours: string; solarMatch: string }> = {
  residential: { baseFactor: 0.3, peakHours: '6-9 PM', solarMatch: 'Moderate (evening peak)' },
  commercial: { baseFactor: 0.5, peakHours: '9 AM-6 PM', solarMatch: 'Excellent (daytime operation)' },
  industrial: { baseFactor: 0.7, peakHours: 'Shift-dependent', solarMatch: 'Good (consistent load)' },
  agricultural: { baseFactor: 0.4, peakHours: 'Seasonal/Daytime', solarMatch: 'Good (irrigation pumping)' },
  mixed: { baseFactor: 0.45, peakHours: 'Variable', solarMatch: 'Moderate' },
};

export class LoadAnalysisTaskHandler extends BaseTaskHandler {
  constructor() {
    super(LOAD_ANALYSIS_CONFIG);
  }

  /**
   * Calculate load analysis
   */
  calculate(inputs: ParsedInputs): TaskCalculationResult {
    const dailyConsumption = inputs.dailyConsumption as number;
    const peakDemand = inputs.peakDemand as number;
    const operatingHours = (inputs.operatingHours as number) || 24;
    const loadType = (inputs.loadType as string) || 'mixed';
    const monthlyBill = inputs.monthlyBill as number;
    const electricityRate = inputs.electricityRate as number;

    // Calculate average load
    const averageLoad = dailyConsumption / operatingHours;

    // Calculate load factor
    const loadFactor = (averageLoad / peakDemand) * 100;

    // Estimate base load
    const profile = LOAD_PROFILES[loadType] || LOAD_PROFILES.mixed;
    const baseLoad = peakDemand * profile.baseFactor;

    // Energy calculations
    const monthlyConsumption = dailyConsumption * 30;
    const annualConsumption = dailyConsumption * 365;

    // Calculate/estimate electricity rate
    let effectiveRate = electricityRate;
    if (!effectiveRate && monthlyBill) {
      effectiveRate = monthlyBill / monthlyConsumption;
    }
    effectiveRate = effectiveRate || 0.12; // Default if not provided

    // Cost calculations
    const dailyCost = dailyConsumption * effectiveRate;
    const monthlyCost = monthlyConsumption * effectiveRate;
    const annualCost = annualConsumption * effectiveRate;

    // Solar sizing recommendation
    const assumedPSH = 5.0; // Average assumption
    const performanceRatio = 0.80;
    const recommendedPVSize = annualConsumption / (assumedPSH * 365 * performanceRatio);
    const estAnnualProduction = recommendedPVSize * assumedPSH * 365 * performanceRatio;
    const solarOffset = (estAnnualProduction / annualConsumption) * 100;

    // Load factor interpretation
    let lfInterpretation: string;
    if (loadFactor < 30) {
      lfInterpretation = 'Low - high peak relative to average (typical residential)';
    } else if (loadFactor < 50) {
      lfInterpretation = 'Moderate - some variation (small commercial)';
    } else if (loadFactor < 70) {
      lfInterpretation = 'Good - relatively consistent (large commercial)';
    } else {
      lfInterpretation = 'Excellent - very consistent load (industrial)';
    }

    // Storage recommendation
    const needsStorage = loadType === 'residential' || loadFactor < 40;

    const calculations = [
      `Average Load = ${dailyConsumption} kWh ÷ ${operatingHours} hours = ${averageLoad.toFixed(2)} kW`,
      `Load Factor = ${averageLoad.toFixed(2)} kW ÷ ${peakDemand} kW × 100 = ${loadFactor.toFixed(1)}%`,
      `Estimated Base Load = ${peakDemand} kW × ${profile.baseFactor} = ${baseLoad.toFixed(2)} kW`,
      `Monthly Consumption = ${dailyConsumption} × 30 = ${monthlyConsumption.toFixed(0)} kWh`,
      `Annual Consumption = ${dailyConsumption} × 365 = ${annualConsumption.toFixed(0)} kWh`,
      `Annual Cost = ${annualConsumption.toFixed(0)} kWh × $${effectiveRate.toFixed(3)}/kWh = $${annualCost.toFixed(2)}`,
      `Recommended PV = ${annualConsumption.toFixed(0)} ÷ (${assumedPSH} × 365 × ${performanceRatio}) = ${recommendedPVSize.toFixed(1)} kWp`,
    ];

    const assumptions = [
      `Load Type: ${loadType.charAt(0).toUpperCase() + loadType.slice(1)}`,
      `Operating Hours: ${operatingHours} hours/day`,
      `Electricity Rate: $${effectiveRate.toFixed(3)}/kWh`,
      `Average PSH: ${assumedPSH} hours (adjust for location)`,
      `Performance Ratio: ${performanceRatio * 100}%`,
    ];

    const insights = [
      `Load Factor of ${loadFactor.toFixed(1)}% indicates ${lfInterpretation.toLowerCase()}`,
      `A ${recommendedPVSize.toFixed(1)} kWp solar system can offset ~${solarOffset.toFixed(0)}% of your consumption`,
      `Solar-load matching: ${profile.solarMatch} - Peak hours: ${profile.peakHours}`,
      needsStorage 
        ? `Battery storage recommended to capture solar during day for evening use`
        : `Direct solar consumption possible during operating hours`,
    ];

    return {
      success: true,
      inputs,
      outputs: {
        averageLoad,
        peakDemand,
        loadFactor,
        baseLoad,
        dailyConsumption,
        monthlyConsumption,
        annualConsumption,
        dailyCost,
        monthlyCost,
        annualCost,
        effectiveRate,
        recommendedPVSize,
        estAnnualProduction,
        solarOffset,
        needsStorage,
      },
      calculations,
      assumptions,
      insights,
    };
  }
}

// Export singleton instance
export const loadAnalysisTask = new LoadAnalysisTaskHandler();

