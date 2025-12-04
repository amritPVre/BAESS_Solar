// Energy Production Estimate Task Handler
// Estimate monthly and annual energy production with performance ratio

import { BaseTaskHandler } from './base-task-handler';
import { TaskHandlerConfig, ParsedInputs, TaskCalculationResult } from './types';

const ENERGY_PRODUCTION_CONFIG: TaskHandlerConfig = {
  id: 'energy_production',
  name: 'Energy Production Estimate',
  description: 'Estimate monthly and annual energy production with performance ratio',
  category: 'technical',

  inputs: [
    {
      name: 'systemCapacity',
      label: 'System Capacity',
      type: 'number',
      unit: 'kWp',
      required: true,
      min: 0,
      description: 'Total installed DC capacity of the PV system',
    },
    {
      name: 'location',
      label: 'Location',
      type: 'string',
      required: false,
      description: 'City/Country for irradiance estimation',
    },
    {
      name: 'latitude',
      label: 'Latitude',
      type: 'number',
      unit: '°',
      required: false,
      min: -90,
      max: 90,
      description: 'Location latitude for solar resource estimation',
    },
    {
      name: 'peakSunHours',
      label: 'Peak Sun Hours',
      type: 'number',
      unit: 'hours',
      required: false,
      defaultValue: 5.0,
      min: 1,
      max: 8,
      description: 'Average daily peak sun hours',
    },
    {
      name: 'performanceRatio',
      label: 'Performance Ratio',
      type: 'number',
      unit: '%',
      required: false,
      defaultValue: 80,
      min: 50,
      max: 95,
      description: 'System performance ratio (accounts for all losses)',
    },
    {
      name: 'tilt',
      label: 'Panel Tilt',
      type: 'number',
      unit: '°',
      required: false,
      defaultValue: 0,
      min: 0,
      max: 90,
      description: 'Panel tilt angle from horizontal',
    },
    {
      name: 'degradation',
      label: 'Annual Degradation',
      type: 'number',
      unit: '%/year',
      required: false,
      defaultValue: 0.5,
      description: 'Annual performance decline rate',
    },
  ],

  formulas: [
    {
      name: 'Daily Energy Production',
      expression: 'E_day (kWh) = Capacity (kWp) × PSH × PR',
      description: 'Expected daily energy generation',
      variables: {
        'Capacity': 'System DC capacity in kWp',
        'PSH': 'Peak Sun Hours',
        'PR': 'Performance Ratio (0.75-0.85)',
      },
      example: '10 kWp × 5.0 × 0.80 = 40 kWh/day',
    },
    {
      name: 'Monthly Energy Production',
      expression: 'E_month (kWh) = E_day × Days in Month',
      description: 'Monthly energy output',
      variables: {},
      example: '40 kWh × 30 = 1,200 kWh/month',
    },
    {
      name: 'Annual Energy Production',
      expression: 'E_year (kWh) = Capacity × PSH × 365 × PR',
      description: 'Expected annual energy generation',
      variables: {},
      example: '10 kWp × 5.0 × 365 × 0.80 = 14,600 kWh/year',
    },
    {
      name: 'Specific Yield',
      expression: 'SY (kWh/kWp) = Annual Production ÷ System Capacity',
      description: 'Energy produced per kWp installed',
      variables: {},
      example: '14,600 kWh ÷ 10 kWp = 1,460 kWh/kWp',
    },
    {
      name: 'Capacity Factor',
      expression: 'CF (%) = Annual Production ÷ (Capacity × 8760) × 100',
      description: 'Ratio of actual to theoretical maximum production',
      variables: {
        '8760': 'Hours in a year',
      },
      example: '14,600 ÷ (10 × 8760) × 100 = 16.7%',
    },
    {
      name: 'Year N Production',
      expression: 'E_N = E_year × (1 - degradation)^(N-1)',
      description: 'Production in year N accounting for degradation',
      variables: {},
      example: 'Year 25 = 14,600 × (0.995)^24 = 12,935 kWh',
    },
  ],

  standardValues: [
    {
      name: 'Performance Ratio',
      value: '75-85',
      unit: '%',
      source: 'IEC 61724',
      description: 'Typical range for well-designed systems',
    },
    {
      name: 'Specific Yield (Tropical)',
      value: '1500-1800',
      unit: 'kWh/kWp',
      source: 'Industry Data',
      description: 'Expected in high-irradiance regions',
    },
    {
      name: 'Specific Yield (Temperate)',
      value: '1000-1400',
      unit: 'kWh/kWp',
      source: 'Industry Data',
      description: 'Expected in moderate-irradiance regions',
    },
    {
      name: 'Degradation Rate',
      value: 0.5,
      unit: '%/year',
      source: 'NREL',
      description: 'Typical crystalline silicon degradation',
    },
  ],

  validationRules: [
    { field: 'systemCapacity', rule: 'required', message: 'System capacity is required' },
    { field: 'systemCapacity', rule: 'positive', message: 'System capacity must be positive' },
    { field: 'performanceRatio', rule: 'range', value: [50, 95], message: 'PR should be 50-95%' },
  ],

  databaseRefs: [
    {
      table: 'solar_irradiance_data',
      operation: 'read',
      description: 'Monthly irradiance data by location',
      fields: ['location', 'monthly_psh', 'annual_psh'],
    },
  ],

  apiRefs: [
    {
      name: 'PVGIS',
      endpoint: 'https://re.jrc.ec.europa.eu/api/',
      purpose: 'Accurate production estimates',
      dataProvided: ['Monthly Production', 'Optimal Angles', 'Performance Data'],
    },
  ],

  systemPrompt: `You are a professional Solar Energy Production Calculator.

TASK: Estimate monthly and annual energy production for a PV system.

STRICT RULES:
1. Use location/latitude to estimate PSH if not provided
2. Account for seasonal variation in monthly estimates
3. Calculate specific yield and capacity factor
4. Show degradation impact over system lifetime

PSH BY REGION:
- Desert/Tropical: 5.5-7.0 hours
- Mediterranean: 4.5-5.5 hours
- Temperate: 3.5-4.5 hours
- Northern: 2.5-3.5 hours

PERFORMANCE RATIO FACTORS:
- Temperature losses: 5-15%
- Wiring losses: 2-3%
- Inverter losses: 2-4%
- Soiling: 2-5%
- Mismatch: 1-2%
- Shading: Variable

TYPICAL SPECIFIC YIELDS:
- >1700 kWh/kWp: Excellent
- 1400-1700 kWh/kWp: Good
- 1100-1400 kWh/kWp: Moderate
- <1100 kWh/kWp: Low`,

  outputTemplate: `## Input Summary
| Parameter | Value | Unit |
|-----------|-------|------|
| System Capacity | [VALUE] | kWp |
| Peak Sun Hours | [VALUE] | hours |
| Performance Ratio | [VALUE] | % |

## Production Estimates

### Annual Summary
| Metric | Value | Unit |
|--------|-------|------|
| Daily Production | [VALUE] | kWh |
| Monthly Average | [VALUE] | kWh |
| Annual Production | [VALUE] | kWh |
| Specific Yield | [VALUE] | kWh/kWp |
| Capacity Factor | [VALUE] | % |

### Monthly Breakdown
| Month | Days | PSH | Production |
|-------|------|-----|------------|
| Jan | 31 | [VALUE] | [VALUE] kWh |
| Feb | 28 | [VALUE] | [VALUE] kWh |
| ... | ... | ... | ... |
| Dec | 31 | [VALUE] | [VALUE] kWh |

### Lifetime Production (25 years)
| Year | Production | Cumulative |
|------|------------|------------|
| 1 | [VALUE] kWh | [VALUE] kWh |
| 5 | [VALUE] kWh | [VALUE] kWh |
| 10 | [VALUE] kWh | [VALUE] kWh |
| 25 | [VALUE] kWh | [VALUE] kWh |

## Key Insights
1. [Production assessment]
2. [Specific yield comparison]
3. [Optimization recommendation]

## Assumptions
- Peak Sun Hours: [VALUE] hours
- Performance Ratio: [VALUE]%
- Degradation: [VALUE]%/year`,
};

// Monthly days and seasonal factors (Northern Hemisphere base)
const MONTHS = [
  { name: 'Jan', days: 31, factor: 0.60 },
  { name: 'Feb', days: 28, factor: 0.70 },
  { name: 'Mar', days: 31, factor: 0.90 },
  { name: 'Apr', days: 30, factor: 1.00 },
  { name: 'May', days: 31, factor: 1.10 },
  { name: 'Jun', days: 30, factor: 1.15 },
  { name: 'Jul', days: 31, factor: 1.15 },
  { name: 'Aug', days: 31, factor: 1.10 },
  { name: 'Sep', days: 30, factor: 1.00 },
  { name: 'Oct', days: 31, factor: 0.85 },
  { name: 'Nov', days: 30, factor: 0.70 },
  { name: 'Dec', days: 31, factor: 0.55 },
];

export class EnergyProductionTaskHandler extends BaseTaskHandler {
  constructor() {
    super(ENERGY_PRODUCTION_CONFIG);
  }

  /**
   * Estimate PSH from latitude
   */
  private estimatePSH(latitude: number | null): number {
    if (!latitude) return 5.0; // Default
    const absLat = Math.abs(latitude);
    if (absLat < 15) return 6.0;
    if (absLat < 25) return 5.5;
    if (absLat < 35) return 5.0;
    if (absLat < 45) return 4.5;
    if (absLat < 55) return 3.8;
    return 3.0;
  }

  /**
   * Calculate energy production
   */
  calculate(inputs: ParsedInputs): TaskCalculationResult {
    const systemCapacity = inputs.systemCapacity as number;
    const latitude = inputs.latitude as number;
    const performanceRatio = ((inputs.performanceRatio as number) || 80) / 100;
    const degradation = ((inputs.degradation as number) || 0.5) / 100;
    
    // Estimate or use provided PSH
    let peakSunHours = inputs.peakSunHours as number;
    if (!peakSunHours) {
      peakSunHours = this.estimatePSH(latitude);
    }

    // Calculate base daily/annual production
    const dailyProduction = systemCapacity * peakSunHours * performanceRatio;
    const annualProduction = systemCapacity * peakSunHours * 365 * performanceRatio;
    const monthlyAverage = annualProduction / 12;

    // Specific yield and capacity factor
    const specificYield = annualProduction / systemCapacity;
    const capacityFactor = (annualProduction / (systemCapacity * 8760)) * 100;

    // Monthly breakdown (adjust for hemisphere)
    const isNorthern = (latitude || 0) >= 0;
    const monthlyProduction = MONTHS.map((month, i) => {
      const factor = isNorthern ? month.factor : MONTHS[(i + 6) % 12].factor;
      const monthPSH = peakSunHours * factor;
      const production = systemCapacity * monthPSH * month.days * performanceRatio;
      return {
        name: month.name,
        days: month.days,
        psh: monthPSH,
        production,
      };
    });

    // Lifetime production with degradation
    const lifetimeYears = [1, 5, 10, 15, 20, 25];
    let cumulativeProduction = 0;
    const lifetimeProduction = lifetimeYears.map(year => {
      for (let y = (lifetimeYears.indexOf(year) === 0 ? 1 : lifetimeYears[lifetimeYears.indexOf(year) - 1] + 1); y <= year; y++) {
        const yearProd = annualProduction * Math.pow(1 - degradation, y - 1);
        cumulativeProduction += yearProd;
      }
      const yearProd = annualProduction * Math.pow(1 - degradation, year - 1);
      return { year, production: yearProd, cumulative: cumulativeProduction };
    });

    // Total 25-year production
    let total25Year = 0;
    for (let y = 1; y <= 25; y++) {
      total25Year += annualProduction * Math.pow(1 - degradation, y - 1);
    }

    // Quality assessment
    let yieldQuality: string;
    if (specificYield > 1700) yieldQuality = 'Excellent';
    else if (specificYield > 1400) yieldQuality = 'Good';
    else if (specificYield > 1100) yieldQuality = 'Moderate';
    else yieldQuality = 'Low';

    const calculations = [
      `Daily Production = ${systemCapacity} kWp × ${peakSunHours.toFixed(1)} PSH × ${performanceRatio.toFixed(2)} = ${dailyProduction.toFixed(1)} kWh`,
      `Annual Production = ${systemCapacity} kWp × ${peakSunHours.toFixed(1)} × 365 × ${performanceRatio.toFixed(2)} = ${annualProduction.toFixed(0)} kWh`,
      `Specific Yield = ${annualProduction.toFixed(0)} ÷ ${systemCapacity} = ${specificYield.toFixed(0)} kWh/kWp`,
      `Capacity Factor = ${annualProduction.toFixed(0)} ÷ (${systemCapacity} × 8760) × 100 = ${capacityFactor.toFixed(1)}%`,
      `Year 25 Production = ${annualProduction.toFixed(0)} × (1 - ${(degradation * 100).toFixed(1)}%)^24 = ${(annualProduction * Math.pow(1 - degradation, 24)).toFixed(0)} kWh`,
      `25-Year Total = ${total25Year.toFixed(0)} kWh`,
    ];

    const assumptions = [
      `System Capacity: ${systemCapacity} kWp`,
      `Peak Sun Hours: ${peakSunHours.toFixed(1)} hours/day`,
      `Performance Ratio: ${(performanceRatio * 100).toFixed(0)}%`,
      `Annual Degradation: ${(degradation * 100).toFixed(1)}%`,
      latitude ? `Latitude: ${latitude}°` : 'Latitude: Not specified',
    ];

    const insights = [
      `Expected annual production: ${annualProduction.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh`,
      `Specific yield of ${specificYield.toFixed(0)} kWh/kWp is ${yieldQuality.toLowerCase()}`,
      `Over 25 years, total production will be ~${(total25Year / 1000).toFixed(0)} MWh`,
      `Year 25 production will be ~${((annualProduction * Math.pow(1 - degradation, 24)) / annualProduction * 100).toFixed(0)}% of Year 1`,
    ];

    return {
      success: true,
      inputs,
      outputs: {
        dailyProduction,
        monthlyAverage,
        annualProduction,
        specificYield,
        capacityFactor,
        monthlyProduction,
        lifetimeProduction,
        total25Year,
        yieldQuality,
        peakSunHours,
      },
      calculations,
      assumptions,
      insights,
    };
  }
}

// Export singleton instance
export const energyProductionTask = new EnergyProductionTaskHandler();

