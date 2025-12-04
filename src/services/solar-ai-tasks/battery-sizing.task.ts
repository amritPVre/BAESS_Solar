// Battery Storage Sizing Task Handler
// Size battery energy storage system based on load profile and backup requirements

import { BaseTaskHandler } from './base-task-handler';
import { TaskHandlerConfig, ParsedInputs, TaskCalculationResult } from './types';

const BATTERY_SIZING_CONFIG: TaskHandlerConfig = {
  id: 'battery_sizing',
  name: 'Battery Storage Sizing',
  description: 'Size battery energy storage system based on load profile and backup requirements',
  category: 'sizing',

  inputs: [
    {
      name: 'dailyConsumption',
      label: 'Daily Energy Consumption',
      type: 'number',
      unit: 'kWh',
      required: true,
      min: 0,
      description: 'Average daily energy usage to be covered by battery',
    },
    {
      name: 'backupHours',
      label: 'Backup Hours Required',
      type: 'number',
      unit: 'hours',
      required: true,
      min: 1,
      description: 'Hours of autonomy required (hours of backup without solar)',
    },
    {
      name: 'systemVoltage',
      label: 'System Voltage',
      type: 'select',
      unit: 'V',
      required: false,
      defaultValue: 48,
      options: ['12', '24', '48', '96', '400'],
      description: 'Battery bank nominal voltage',
    },
    {
      name: 'depthOfDischarge',
      label: 'Depth of Discharge (DoD)',
      type: 'number',
      unit: '%',
      required: false,
      defaultValue: 80,
      min: 20,
      max: 100,
      description: 'Maximum discharge level (Lithium: 80-95%, Lead-Acid: 50%)',
    },
    {
      name: 'batteryType',
      label: 'Battery Technology',
      type: 'select',
      required: false,
      defaultValue: 'lithium_lfp',
      options: ['lithium_lfp', 'lithium_nmc', 'lead_acid_agm', 'lead_acid_gel', 'lead_acid_flooded'],
      description: 'Battery chemistry/technology',
    },
    {
      name: 'peakLoad',
      label: 'Peak Load',
      type: 'number',
      unit: 'kW',
      required: false,
      description: 'Maximum instantaneous power draw',
    },
    {
      name: 'batteryCapacity',
      label: 'Individual Battery Capacity',
      type: 'number',
      unit: 'kWh',
      required: false,
      description: 'Capacity of single battery unit (for calculating quantity)',
    },
    {
      name: 'roundTripEfficiency',
      label: 'Round-Trip Efficiency',
      type: 'number',
      unit: '%',
      required: false,
      defaultValue: 90,
      min: 70,
      max: 98,
      description: 'Battery charge/discharge efficiency',
    },
  ],

  formulas: [
    {
      name: 'Required Energy Storage',
      expression: 'Energy (kWh) = (Daily Consumption × Backup Days) ÷ DoD ÷ Efficiency',
      description: 'Total usable battery capacity needed',
      variables: {
        'Daily Consumption': 'kWh per day to be supplied',
        'Backup Days': 'Days of autonomy (or hours/24)',
        'DoD': 'Depth of discharge (decimal)',
        'Efficiency': 'Round-trip efficiency (decimal)',
      },
      example: 'Energy = (30 kWh × 1) ÷ 0.80 ÷ 0.90 = 41.7 kWh',
    },
    {
      name: 'Battery Capacity in Ah',
      expression: 'Capacity (Ah) = Energy (Wh) ÷ Voltage (V)',
      description: 'Convert kWh to Amp-hours at system voltage',
      variables: {
        'Energy (Wh)': 'kWh × 1000',
        'Voltage': 'Nominal system voltage',
      },
      example: 'Capacity = 41,700 Wh ÷ 48V = 869 Ah',
    },
    {
      name: 'Number of Batteries (Series)',
      expression: 'Series Batteries = System Voltage ÷ Battery Voltage',
      description: 'Batteries needed in series to achieve system voltage',
      variables: {
        'Battery Voltage': 'Nominal voltage of single battery',
      },
      example: 'Series = 48V ÷ 12V = 4 batteries',
    },
    {
      name: 'Number of Batteries (Parallel)',
      expression: 'Parallel Strings = Required Ah ÷ Battery Ah',
      description: 'Parallel strings needed to achieve required capacity',
      variables: {
        'Battery Ah': 'Capacity of single battery',
      },
      example: 'Parallel = 869 Ah ÷ 200 Ah = 5 strings (round up)',
    },
    {
      name: 'Total Batteries',
      expression: 'Total = Series × Parallel',
      description: 'Total number of battery units required',
      variables: {},
      example: 'Total = 4 × 5 = 20 batteries',
    },
    {
      name: 'C-Rate Check',
      expression: 'C-Rate = Peak Power (kW) ÷ Capacity (kWh)',
      description: 'Verify battery can handle peak discharge rate',
      variables: {
        'C-Rate': 'Discharge rate relative to capacity (e.g., 0.5C, 1C)',
      },
      example: 'C-Rate = 5 kW ÷ 10 kWh = 0.5C',
    },
  ],

  standardValues: [
    {
      name: 'LFP DoD',
      value: 80,
      unit: '%',
      source: 'Manufacturer Specs',
      description: 'Typical DoD for Lithium Iron Phosphate',
    },
    {
      name: 'Lead-Acid DoD',
      value: 50,
      unit: '%',
      source: 'Industry Standard',
      description: 'Recommended DoD for lead-acid longevity',
    },
    {
      name: 'LFP Cycle Life',
      value: 4000,
      unit: 'cycles',
      source: 'Industry Average',
      description: 'Cycles at 80% DoD',
    },
    {
      name: 'Lead-Acid Cycle Life',
      value: 500,
      unit: 'cycles',
      source: 'Industry Average',
      description: 'Cycles at 50% DoD',
    },
    {
      name: 'Lithium Efficiency',
      value: 92,
      unit: '%',
      source: 'Industry Average',
      description: 'Round-trip efficiency for lithium batteries',
    },
    {
      name: 'Lead-Acid Efficiency',
      value: 80,
      unit: '%',
      source: 'Industry Average',
      description: 'Round-trip efficiency for lead-acid batteries',
    },
  ],

  validationRules: [
    { field: 'dailyConsumption', rule: 'required', message: 'Daily consumption is required' },
    { field: 'dailyConsumption', rule: 'positive', message: 'Daily consumption must be positive' },
    { field: 'backupHours', rule: 'required', message: 'Backup hours required' },
    { field: 'backupHours', rule: 'min', value: 1, message: 'Backup hours must be at least 1' },
    { field: 'depthOfDischarge', rule: 'range', value: [20, 100], message: 'DoD should be 20-100%' },
  ],

  databaseRefs: [
    {
      table: 'battery_specifications',
      operation: 'read',
      description: 'Battery models, capacities, and specifications',
      fields: ['manufacturer', 'model', 'chemistry', 'voltage', 'capacity_kwh', 'capacity_ah', 'max_discharge', 'cycle_life', 'warranty_years'],
    },
    {
      table: 'battery_pricing',
      operation: 'read',
      description: 'Battery pricing by type and capacity',
      fields: ['chemistry', 'price_per_kwh', 'installation_cost', 'region'],
    },
  ],

  apiRefs: [],

  systemPrompt: `You are a professional Battery Storage Sizing Calculator.

TASK: Size a battery energy storage system based on user requirements.

STRICT RULES:
1. Always account for Depth of Discharge (DoD) - never use 100% for lead-acid
2. Apply round-trip efficiency loss
3. Verify C-rate is within battery limits (typically 0.5C-1C for lithium)
4. Round UP the number of batteries
5. Consider both energy (kWh) and power (kW) requirements

BATTERY TYPE GUIDELINES:
- Lithium LFP: DoD 80-90%, 92% efficiency, 4000+ cycles
- Lithium NMC: DoD 80-90%, 90% efficiency, 2000+ cycles
- Lead-Acid AGM: DoD 50%, 80% efficiency, 500 cycles
- Lead-Acid Flooded: DoD 50%, 85% efficiency, 800 cycles

SAFETY FACTORS:
- Add 10-20% capacity buffer for aging
- Ensure inverter power matches peak load
- Check battery max continuous discharge rate`,

  outputTemplate: `## Input Summary
| Parameter | Value | Unit |
|-----------|-------|------|
| Daily Consumption | [VALUE] | kWh |
| Backup Hours | [VALUE] | hours |
| System Voltage | [VALUE] | V |
| Depth of Discharge | [VALUE] | % |
| Battery Type | [VALUE] | - |

## Calculations

### Step 1: Backup Energy Required
Backup Energy = Daily Consumption × (Backup Hours ÷ 24)
Backup Energy = [VALUE] × ([VALUE] ÷ 24) = [RESULT] kWh

### Step 2: Gross Battery Capacity (accounting for DoD)
Gross Capacity = Backup Energy ÷ DoD
Gross Capacity = [VALUE] ÷ [VALUE] = [RESULT] kWh

### Step 3: Total Capacity (accounting for efficiency)
Total Capacity = Gross Capacity ÷ Efficiency
Total Capacity = [VALUE] ÷ [VALUE] = [RESULT] kWh

### Step 4: Capacity in Amp-hours
Capacity (Ah) = Total Capacity (Wh) ÷ System Voltage
Capacity = [VALUE] ÷ [VALUE] = [RESULT] Ah

## Results
| Output | Value | Unit |
|--------|-------|------|
| Required Usable Capacity | [VALUE] | kWh |
| Total Battery Capacity | [VALUE] | kWh |
| Capacity at System Voltage | [VALUE] | Ah |
| Estimated Cost | $[VALUE] | - |

## Battery Configuration
| Configuration | Value |
|--------------|-------|
| Battery Type | [VALUE] |
| Nominal Voltage | [VALUE] V |
| Recommended Capacity | [VALUE] kWh |

## Key Insights
1. [Insight about sizing adequacy]
2. [Insight about technology choice]
3. [Recommendation for optimization]

## Assumptions
- Round-trip efficiency: [VALUE]%
- Depth of Discharge: [VALUE]%
- Temperature: Standard (25°C)`,
};

// Battery specifications by type
const BATTERY_SPECS: Record<string, { dod: number; efficiency: number; cycleLife: number; pricePerKwh: number }> = {
  lithium_lfp: { dod: 0.80, efficiency: 0.92, cycleLife: 4000, pricePerKwh: 400 },
  lithium_nmc: { dod: 0.80, efficiency: 0.90, cycleLife: 2000, pricePerKwh: 350 },
  lead_acid_agm: { dod: 0.50, efficiency: 0.80, cycleLife: 500, pricePerKwh: 200 },
  lead_acid_gel: { dod: 0.50, efficiency: 0.80, cycleLife: 600, pricePerKwh: 220 },
  lead_acid_flooded: { dod: 0.50, efficiency: 0.85, cycleLife: 800, pricePerKwh: 150 },
};

export class BatterySizingTaskHandler extends BaseTaskHandler {
  constructor() {
    super(BATTERY_SIZING_CONFIG);
  }

  /**
   * Calculate battery sizing
   */
  calculate(inputs: ParsedInputs): TaskCalculationResult {
    const dailyConsumption = inputs.dailyConsumption as number;
    const backupHours = inputs.backupHours as number;
    const systemVoltage = (inputs.systemVoltage as number) || 48;
    const batteryType = (inputs.batteryType as string) || 'lithium_lfp';
    const userDoD = inputs.depthOfDischarge as number;
    const userEfficiency = inputs.roundTripEfficiency as number;
    const peakLoad = inputs.peakLoad as number;

    // Get battery specs
    const specs = BATTERY_SPECS[batteryType] || BATTERY_SPECS.lithium_lfp;
    const dod = userDoD ? userDoD / 100 : specs.dod;
    const efficiency = userEfficiency ? userEfficiency / 100 : specs.efficiency;

    // Calculate backup energy (convert hours to days fraction)
    const backupDays = backupHours / 24;
    const backupEnergy = dailyConsumption * backupDays;

    // Gross capacity (accounting for DoD)
    const grossCapacity = backupEnergy / dod;

    // Total capacity (accounting for efficiency)
    const totalCapacity = grossCapacity / efficiency;

    // Capacity in Ah
    const capacityAh = (totalCapacity * 1000) / systemVoltage;

    // Add 10% safety buffer
    const recommendedCapacity = totalCapacity * 1.1;

    // Estimated cost
    const estimatedCost = recommendedCapacity * specs.pricePerKwh;

    // C-rate check (if peak load provided)
    let cRate = 0;
    let cRateOk = true;
    if (peakLoad) {
      cRate = peakLoad / totalCapacity;
      cRateOk = cRate <= 1; // Most batteries support up to 1C continuous
    }

    // Expected cycle life at this DoD
    const cycleLife = specs.cycleLife * (specs.dod / dod); // Adjust for actual DoD

    const calculations = [
      `Backup Energy = ${dailyConsumption} kWh × (${backupHours} ÷ 24) = ${backupEnergy.toFixed(2)} kWh`,
      `Gross Capacity = ${backupEnergy.toFixed(2)} ÷ ${(dod * 100).toFixed(0)}% DoD = ${grossCapacity.toFixed(2)} kWh`,
      `Total Capacity = ${grossCapacity.toFixed(2)} ÷ ${(efficiency * 100).toFixed(0)}% efficiency = ${totalCapacity.toFixed(2)} kWh`,
      `Capacity in Ah = ${(totalCapacity * 1000).toFixed(0)} Wh ÷ ${systemVoltage}V = ${capacityAh.toFixed(0)} Ah`,
      `With 10% buffer: ${recommendedCapacity.toFixed(2)} kWh`,
      `Estimated cost: $${estimatedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    ];

    if (peakLoad) {
      calculations.push(`C-Rate check: ${peakLoad} kW ÷ ${totalCapacity.toFixed(2)} kWh = ${cRate.toFixed(2)}C`);
    }

    const assumptions = [
      `Battery Type: ${batteryType.replace(/_/g, ' ').toUpperCase()}`,
      `Depth of Discharge: ${(dod * 100).toFixed(0)}%`,
      `Round-trip Efficiency: ${(efficiency * 100).toFixed(0)}%`,
      `Cycle Life: ~${cycleLife.toFixed(0)} cycles at this DoD`,
      `Price per kWh: $${specs.pricePerKwh}`,
    ];

    const batteryTypeName = batteryType.replace(/_/g, ' ').toUpperCase();
    const insights = [
      `You need a ${recommendedCapacity.toFixed(1)} kWh ${batteryTypeName} battery system`,
      `At ${systemVoltage}V, this equals ${capacityAh.toFixed(0)} Ah capacity`,
      `Estimated battery cost: $${estimatedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} (batteries only)`,
      `Expected cycle life: ~${cycleLife.toFixed(0)} cycles at ${(dod * 100).toFixed(0)}% DoD`,
    ];

    const warnings = [];
    if (!cRateOk && peakLoad) {
      warnings.push(`Peak load (${peakLoad} kW) results in ${cRate.toFixed(2)}C discharge rate - may exceed battery limits. Consider larger capacity or multiple parallel units.`);
    }
    if (batteryType.includes('lead_acid') && dod > 0.5) {
      warnings.push(`Lead-acid batteries should not exceed 50% DoD for longevity. Current setting: ${(dod * 100).toFixed(0)}%`);
    }

    return {
      success: true,
      inputs,
      outputs: {
        backupEnergy,
        grossCapacity,
        totalCapacity,
        capacityAh,
        recommendedCapacity,
        estimatedCost,
        cRate,
        cycleLife,
        systemVoltage,
      },
      calculations,
      assumptions,
      insights,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

// Export singleton instance
export const batterySizingTask = new BatterySizingTaskHandler();

