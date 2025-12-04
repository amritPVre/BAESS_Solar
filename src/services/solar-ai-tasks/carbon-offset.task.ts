// Carbon Offset Analysis Task Handler
// Calculate CO2 emissions avoided and environmental impact

import { BaseTaskHandler } from './base-task-handler';
import { TaskHandlerConfig, ParsedInputs, TaskCalculationResult } from './types';

const CARBON_OFFSET_CONFIG: TaskHandlerConfig = {
  id: 'carbon_offset',
  name: 'Carbon Offset Analysis',
  description: 'Calculate CO2 emissions avoided and environmental impact',
  category: 'environmental',

  inputs: [
    {
      name: 'annualProduction',
      label: 'Annual Energy Production',
      type: 'number',
      unit: 'kWh',
      required: true,
      min: 0,
      description: 'Expected annual solar energy generation',
    },
    {
      name: 'gridEmissionFactor',
      label: 'Grid Emission Factor',
      type: 'number',
      unit: 'kg CO2/kWh',
      required: false,
      defaultValue: 0.45,
      min: 0,
      max: 2,
      description: 'CO2 emissions per kWh from local grid (varies by region)',
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
      description: 'Expected operating lifetime of the system',
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
      description: 'Annual panel performance degradation',
    },
    {
      name: 'systemCapacity',
      label: 'System Capacity',
      type: 'number',
      unit: 'kWp',
      required: false,
      description: 'For calculating embodied carbon (manufacturing)',
    },
  ],

  formulas: [
    {
      name: 'Annual CO2 Avoided',
      expression: 'CO2 (kg/year) = Annual Production (kWh) × Emission Factor (kg CO2/kWh)',
      description: 'CO2 emissions avoided by displacing grid electricity',
      variables: {
        'Emission Factor': 'Grid-specific CO2 intensity (kg CO2/kWh)',
      },
      example: '10,000 kWh × 0.45 kg/kWh = 4,500 kg CO2/year',
    },
    {
      name: 'Lifetime CO2 Avoided',
      expression: 'Total CO2 (tonnes) = Σ(Annual Production × (1-degradation)^year × Emission Factor) ÷ 1000',
      description: 'Cumulative CO2 avoided over system lifetime',
      variables: {
        'degradation': 'Annual production decline (%)',
      },
      example: '25 years × ~4,400 kg avg = ~110 tonnes CO2',
    },
    {
      name: 'Equivalent Trees',
      expression: 'Trees = CO2 Avoided (kg) ÷ 22',
      description: 'Number of mature trees equivalent to annual carbon absorption',
      variables: {
        '22 kg': 'Average CO2 absorbed by one mature tree per year',
      },
      example: '4,500 kg ÷ 22 = 205 trees',
    },
    {
      name: 'Equivalent Driving Distance',
      expression: 'km = CO2 Avoided (kg) ÷ 0.12',
      description: 'Car driving distance equivalent',
      variables: {
        '0.12 kg/km': 'Average car CO2 emissions per km',
      },
      example: '4,500 kg ÷ 0.12 = 37,500 km',
    },
    {
      name: 'Carbon Payback Period',
      expression: 'Payback = Embodied Carbon ÷ Annual CO2 Avoided',
      description: 'Years to offset manufacturing emissions',
      variables: {
        'Embodied Carbon': '~40 kg CO2/kWp for panels (manufacturing)',
      },
      example: '400 kg ÷ 4,500 kg/year = 0.09 years (~1 month)',
    },
  ],

  standardValues: [
    {
      name: 'World Average Grid Factor',
      value: 0.45,
      unit: 'kg CO2/kWh',
      source: 'IEA 2023',
      description: 'Global average grid emission intensity',
    },
    {
      name: 'Coal-Heavy Grid',
      value: 0.9,
      unit: 'kg CO2/kWh',
      source: 'IEA',
      description: 'Grids dominated by coal power',
    },
    {
      name: 'Gas-Dominated Grid',
      value: 0.4,
      unit: 'kg CO2/kWh',
      source: 'IEA',
      description: 'Grids primarily using natural gas',
    },
    {
      name: 'Clean Grid (Hydro/Nuclear)',
      value: 0.1,
      unit: 'kg CO2/kWh',
      source: 'IEA',
      description: 'Grids with high renewable/nuclear share',
    },
    {
      name: 'Tree CO2 Absorption',
      value: 22,
      unit: 'kg CO2/year',
      source: 'EPA',
      description: 'Average CO2 absorbed by one mature tree annually',
    },
    {
      name: 'Car Emissions',
      value: 0.12,
      unit: 'kg CO2/km',
      source: 'EPA',
      description: 'Average passenger car CO2 emissions',
    },
    {
      name: 'Panel Embodied Carbon',
      value: 40,
      unit: 'kg CO2/kWp',
      source: 'NREL',
      description: 'CO2 from manufacturing crystalline silicon panels',
    },
  ],

  validationRules: [
    { field: 'annualProduction', rule: 'required', message: 'Annual production is required' },
    { field: 'annualProduction', rule: 'positive', message: 'Annual production must be positive' },
    { field: 'gridEmissionFactor', rule: 'range', value: [0, 2], message: 'Emission factor should be 0-2 kg CO2/kWh' },
  ],

  databaseRefs: [
    {
      table: 'grid_emission_factors',
      operation: 'read',
      description: 'Regional grid emission factors by country/region',
      fields: ['region', 'country', 'emission_factor', 'year', 'source'],
    },
    {
      table: 'carbon_calculations',
      operation: 'write',
      description: 'Store carbon offset calculation results',
      fields: ['project_id', 'annual_co2', 'lifetime_co2', 'trees_equivalent', 'created_at'],
    },
  ],

  apiRefs: [
    {
      name: 'Electricity Maps API',
      endpoint: 'https://api.electricitymap.org/',
      purpose: 'Real-time grid carbon intensity by region',
      dataProvided: ['Carbon Intensity', 'Power Breakdown', 'Historical Data'],
    },
  ],

  systemPrompt: `You are a professional Carbon Offset Calculator for solar PV systems.

TASK: Calculate environmental impact and CO2 emissions avoided.

STRICT RULES:
1. Use provided emission factor or appropriate regional default
2. Account for annual degradation in lifetime calculations
3. Provide multiple equivalents (trees, driving, flights)
4. Calculate carbon payback period if system size provided
5. Be precise with units (kg vs tonnes)

REGIONAL EMISSION FACTORS (kg CO2/kWh):
- World Average: 0.45
- USA Average: 0.40
- EU Average: 0.30
- China: 0.55
- India: 0.70
- Australia: 0.65
- Middle East: 0.50

EQUIVALENTS:
- 1 tree absorbs ~22 kg CO2/year
- 1 km driving emits ~0.12 kg CO2
- 1 economy flight km emits ~0.255 kg CO2
- 1 household uses ~8,000 kg CO2/year (varies)`,

  outputTemplate: `## Input Summary
| Parameter | Value | Unit |
|-----------|-------|------|
| Annual Production | [VALUE] | kWh |
| Grid Emission Factor | [VALUE] | kg CO2/kWh |
| Project Lifetime | [VALUE] | years |

## Annual Environmental Impact
| Metric | Value | Unit |
|--------|-------|------|
| CO2 Avoided | [VALUE] | kg/year |
| CO2 Avoided | [VALUE] | tonnes/year |
| Equivalent Trees | [VALUE] | trees |
| Equivalent Driving | [VALUE] | km |

## Lifetime Environmental Impact
| Metric | Value | Unit |
|--------|-------|------|
| Total CO2 Avoided | [VALUE] | tonnes |
| Equivalent Trees | [VALUE] | tree-years |
| Equivalent Driving | [VALUE] | km |
| Homes Powered (equiv.) | [VALUE] | homes |

## Carbon Payback Analysis
| Item | Value |
|------|-------|
| Embodied Carbon (est.) | [VALUE] kg |
| Carbon Payback Period | [VALUE] months |

## Environmental Equivalents
🌳 Trees planted: [VALUE] trees for 25 years
🚗 Driving avoided: [VALUE] km
✈️ Flights avoided: [VALUE] economy flights (LHR-NYC)
🏠 Homes' annual emissions: [VALUE] households

## Key Insights
1. [Insight about environmental impact]
2. [Comparison to everyday activities]
3. [Long-term benefit]

## Assumptions
- Grid emission factor: [VALUE] kg CO2/kWh
- Degradation: [VALUE]%/year
- Panel embodied carbon: 40 kg CO2/kWp`,
};

export class CarbonOffsetTaskHandler extends BaseTaskHandler {
  constructor() {
    super(CARBON_OFFSET_CONFIG);
  }

  /**
   * Calculate carbon offset
   */
  calculate(inputs: ParsedInputs): TaskCalculationResult {
    const annualProduction = inputs.annualProduction as number;
    const emissionFactor = (inputs.gridEmissionFactor as number) || 0.45;
    const projectLifetime = (inputs.projectLifetime as number) || 25;
    const degradation = ((inputs.degradation as number) || 0.5) / 100;
    const systemCapacity = inputs.systemCapacity as number;

    // Annual calculations
    const annualCO2kg = annualProduction * emissionFactor;
    const annualCO2tonnes = annualCO2kg / 1000;
    const annualTreeEquiv = annualCO2kg / 22;
    const annualDrivingKm = annualCO2kg / 0.12;

    // Lifetime calculations with degradation
    let lifetimeCO2kg = 0;
    let lifetimeProduction = 0;
    for (let year = 1; year <= projectLifetime; year++) {
      const yearProduction = annualProduction * Math.pow(1 - degradation, year - 1);
      lifetimeProduction += yearProduction;
      lifetimeCO2kg += yearProduction * emissionFactor;
    }
    const lifetimeCO2tonnes = lifetimeCO2kg / 1000;
    const lifetimeTreeYears = lifetimeCO2kg / 22;
    const lifetimeDrivingKm = lifetimeCO2kg / 0.12;

    // Equivalents
    const treesPlanted = Math.round(lifetimeCO2kg / 22 / projectLifetime); // Trees for 25 years
    const flightsAvoided = Math.round(lifetimeCO2kg / (0.255 * 5600)); // LHR-NYC economy
    const homesEquivalent = Math.round(lifetimeCO2kg / (8000 * projectLifetime));

    // Carbon payback (if system size provided)
    let embodiedCarbon = 0;
    let carbonPaybackMonths = 0;
    if (systemCapacity) {
      embodiedCarbon = systemCapacity * 40; // 40 kg CO2/kWp
      carbonPaybackMonths = (embodiedCarbon / annualCO2kg) * 12;
    }

    const calculations = [
      `Annual CO2 avoided = ${annualProduction.toLocaleString()} kWh × ${emissionFactor} kg/kWh = ${annualCO2kg.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg`,
      `Annual tree equivalent = ${annualCO2kg.toLocaleString()} kg ÷ 22 kg/tree = ${annualTreeEquiv.toFixed(0)} trees`,
      `Annual driving equivalent = ${annualCO2kg.toLocaleString()} kg ÷ 0.12 kg/km = ${annualDrivingKm.toLocaleString(undefined, { maximumFractionDigits: 0 })} km`,
      `Lifetime production (with ${(degradation * 100).toFixed(1)}% degradation) = ${lifetimeProduction.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh`,
      `Lifetime CO2 avoided = ${lifetimeCO2tonnes.toFixed(1)} tonnes`,
    ];

    if (systemCapacity) {
      calculations.push(`Embodied carbon = ${systemCapacity} kWp × 40 kg/kWp = ${embodiedCarbon} kg`);
      calculations.push(`Carbon payback = ${embodiedCarbon} kg ÷ ${annualCO2kg.toFixed(0)} kg/year × 12 = ${carbonPaybackMonths.toFixed(1)} months`);
    }

    const assumptions = [
      `Grid emission factor: ${emissionFactor} kg CO2/kWh`,
      `Annual degradation: ${(degradation * 100).toFixed(1)}%`,
      `Tree absorption: 22 kg CO2/year (mature tree)`,
      `Car emissions: 0.12 kg CO2/km`,
      `Panel embodied carbon: 40 kg CO2/kWp`,
    ];

    const insights = [
      `Your solar system will avoid ${lifetimeCO2tonnes.toFixed(1)} tonnes of CO2 over ${projectLifetime} years`,
      `This is equivalent to planting ${treesPlanted} trees and letting them grow for ${projectLifetime} years`,
      `Or avoiding ${lifetimeDrivingKm.toLocaleString(undefined, { maximumFractionDigits: 0 })} km of car travel`,
      carbonPaybackMonths > 0 ? `The system's manufacturing emissions are offset in just ${carbonPaybackMonths.toFixed(1)} months` : null,
    ].filter(Boolean) as string[];

    return {
      success: true,
      inputs,
      outputs: {
        annualCO2kg,
        annualCO2tonnes,
        annualTreeEquiv,
        annualDrivingKm,
        lifetimeCO2tonnes,
        lifetimeTreeYears,
        lifetimeDrivingKm,
        lifetimeProduction,
        treesPlanted,
        flightsAvoided,
        homesEquivalent,
        embodiedCarbon,
        carbonPaybackMonths,
      },
      calculations,
      assumptions,
      insights,
    };
  }
}

// Export singleton instance
export const carbonOffsetTask = new CarbonOffsetTaskHandler();

