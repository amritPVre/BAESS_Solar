// Cable Sizing Task Handler
// Determines appropriate cable size based on current, voltage, distance, and voltage drop requirements

import { BaseTaskHandler } from './base-task-handler';
import { TaskHandlerConfig, ParsedInputs, TaskCalculationResult } from './types';

const CABLE_SIZING_CONFIG: TaskHandlerConfig = {
  id: 'cable_sizing',
  name: 'Cable Sizing',
  description: 'Determine appropriate cable size based on current, voltage, distance, and voltage drop requirements',
  category: 'technical',

  inputs: [
    {
      name: 'current',
      label: 'Operating Current',
      type: 'number',
      unit: 'A',
      required: true,
      min: 0,
      description: 'Maximum operating current (Isc for DC, rated for AC)',
    },
    {
      name: 'voltage',
      label: 'System Voltage',
      type: 'number',
      unit: 'V',
      required: true,
      min: 0,
      description: 'Operating voltage of the circuit',
    },
    {
      name: 'distance',
      label: 'Cable Run Distance',
      type: 'number',
      unit: 'm',
      required: true,
      min: 0,
      description: 'One-way cable length (total circuit length = 2× for DC)',
    },
    {
      name: 'maxVoltageDrop',
      label: 'Maximum Voltage Drop',
      type: 'number',
      unit: '%',
      required: true,
      defaultValue: 3,
      min: 0.5,
      max: 10,
      description: 'Acceptable voltage drop limit (typically 2-3% for DC, 3-5% for AC)',
    },
    {
      name: 'cableMaterial',
      label: 'Cable Material',
      type: 'select',
      required: false,
      defaultValue: 'copper',
      options: ['copper', 'aluminum'],
      description: 'Conductor material',
    },
    {
      name: 'installationType',
      label: 'Installation Type',
      type: 'select',
      required: false,
      defaultValue: 'conduit',
      options: ['conduit', 'direct_burial', 'cable_tray', 'free_air', 'underground'],
      description: 'Installation method affects derating',
    },
    {
      name: 'circuitType',
      label: 'Circuit Type',
      type: 'select',
      required: false,
      defaultValue: 'dc',
      options: ['dc', 'single_phase_ac', 'three_phase_ac'],
      description: 'Type of electrical circuit',
    },
    {
      name: 'ambientTemp',
      label: 'Ambient Temperature',
      type: 'number',
      unit: '°C',
      required: false,
      defaultValue: 30,
      description: 'Operating environment temperature',
    },
  ],

  formulas: [
    {
      name: 'Cable Cross-Section (Voltage Drop Method)',
      expression: 'A (mm²) = (2 × L × I × ρ) ÷ (Vd × V) × 100',
      description: 'Calculate minimum cable size based on voltage drop limit',
      variables: {
        'L': 'Cable length in meters (one-way)',
        'I': 'Current in Amperes',
        'ρ': 'Resistivity (Copper: 0.0175, Aluminum: 0.0282 Ω·mm²/m)',
        'Vd': 'Voltage drop percentage (e.g., 0.03 for 3%)',
        'V': 'System voltage',
      },
      example: 'A = (2 × 50 × 30 × 0.0175) ÷ (0.03 × 400) × 100 = 4.375 mm² → Use 6 mm²',
    },
    {
      name: 'Actual Voltage Drop',
      expression: 'Vdrop (%) = (2 × L × I × ρ) ÷ (A × V) × 100',
      description: 'Calculate actual voltage drop for selected cable size',
      variables: {
        'A': 'Cable cross-section in mm²',
      },
      example: 'Vdrop = (2 × 50 × 30 × 0.0175) ÷ (6 × 400) × 100 = 2.19%',
    },
    {
      name: 'Voltage Drop (Volts)',
      expression: 'Vdrop (V) = (2 × L × I × ρ) ÷ A',
      description: 'Calculate voltage drop in absolute volts',
      variables: {},
      example: 'Vdrop = (2 × 50 × 30 × 0.0175) ÷ 6 = 8.75V',
    },
    {
      name: 'Three-Phase Voltage Drop',
      expression: 'Vdrop (%) = (√3 × L × I × ρ) ÷ (A × V) × 100',
      description: 'For three-phase AC circuits, use √3 factor instead of 2',
      variables: {
        '√3': '1.732 (phase factor for three-phase)',
      },
    },
    {
      name: 'Current Carrying Capacity',
      expression: 'I_max = Base Capacity × Temp Derating × Installation Derating',
      description: 'Maximum allowable current after applying derating factors',
      variables: {
        'Base Capacity': 'From cable manufacturer tables (IEC 60364-5-52)',
        'Temp Derating': 'Factor for ambient temperature above 30°C',
        'Installation Derating': 'Factor for installation method',
      },
    },
  ],

  standardValues: [
    {
      name: 'Copper Resistivity (ρ)',
      value: 0.0175,
      unit: 'Ω·mm²/m',
      source: 'IEC 60228',
      description: 'At 20°C, increases with temperature',
    },
    {
      name: 'Aluminum Resistivity (ρ)',
      value: 0.0282,
      unit: 'Ω·mm²/m',
      source: 'IEC 60228',
      description: 'At 20°C, about 61% conductivity of copper',
    },
    {
      name: 'Standard Cable Sizes',
      value: '1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240',
      unit: 'mm²',
      source: 'IEC 60228',
      description: 'Available standard cross-sections',
    },
    {
      name: 'DC Voltage Drop Limit',
      value: 3,
      unit: '%',
      source: 'IEC 60364 / NEC',
      description: 'Recommended maximum for DC circuits',
    },
    {
      name: 'AC Voltage Drop Limit',
      value: 5,
      unit: '%',
      source: 'IEC 60364 / NEC',
      description: 'Recommended maximum for AC circuits',
    },
  ],

  validationRules: [
    { field: 'current', rule: 'required', message: 'Operating current is required' },
    { field: 'current', rule: 'positive', message: 'Current must be positive' },
    { field: 'voltage', rule: 'required', message: 'System voltage is required' },
    { field: 'voltage', rule: 'positive', message: 'Voltage must be positive' },
    { field: 'distance', rule: 'required', message: 'Cable distance is required' },
    { field: 'distance', rule: 'positive', message: 'Distance must be positive' },
    { field: 'maxVoltageDrop', rule: 'range', value: [0.5, 10], message: 'Voltage drop should be 0.5-10%' },
  ],

  databaseRefs: [
    {
      table: 'cable_specifications',
      operation: 'read',
      description: 'Cable ampacity and specifications by size and type',
      fields: ['size_mm2', 'material', 'ampacity_air', 'ampacity_conduit', 'ampacity_buried', 'weight_kg_km'],
    },
    {
      table: 'derating_factors',
      operation: 'read',
      description: 'Temperature and installation derating factors',
      fields: ['ambient_temp', 'derating_factor', 'installation_type'],
    },
  ],

  apiRefs: [],

  systemPrompt: `You are a professional Cable Sizing Calculator for solar PV systems.

TASK: Calculate the appropriate cable size based on current, voltage, and distance.

STRICT RULES:
1. Always calculate based on voltage drop requirement
2. Verify current carrying capacity is adequate
3. Round UP to the nearest standard cable size
4. Standard sizes (mm²): 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240
5. For DC circuits: Use factor of 2 for round-trip
6. For 3-phase AC: Use √3 = 1.732 factor
7. Apply derating factors for temperature and installation method
8. If cable material not specified, assume COPPER

RESISTIVITY VALUES:
- Copper: 0.0175 Ω·mm²/m at 20°C
- Aluminum: 0.0282 Ω·mm²/m at 20°C

VOLTAGE DROP GUIDELINES:
- DC string cables: ≤ 2%
- DC main cables: ≤ 3%
- AC cables: ≤ 5%`,

  outputTemplate: `## Input Summary
| Parameter | Value | Unit |
|-----------|-------|------|
| Current | [VALUE] | A |
| Voltage | [VALUE] | V |
| Distance | [VALUE] | m |
| Max Voltage Drop | [VALUE] | % |
| Material | [VALUE] | - |
| Installation | [VALUE] | - |

## Calculations

### Step 1: Minimum Cable Size (Voltage Drop)
A = (2 × [L] × [I] × [ρ]) ÷ ([Vd%] × [V]) × 100
A = (2 × [VALUE] × [VALUE] × [VALUE]) ÷ ([VALUE] × [VALUE]) × 100
A = [RESULT] mm²

### Step 2: Select Standard Size
Calculated: [VALUE] mm² → Selected: [VALUE] mm²

### Step 3: Actual Voltage Drop
Vdrop = (2 × [L] × [I] × [ρ]) ÷ ([A] × [V]) × 100
Vdrop = [RESULT]%

### Step 4: Current Capacity Check
Selected cable capacity: [VALUE] A (after derating)
Required current: [VALUE] A
Status: ✓ PASS / ✗ FAIL

## Results
| Output | Value | Unit |
|--------|-------|------|
| Recommended Cable Size | [VALUE] | mm² |
| Actual Voltage Drop | [VALUE] | % |
| Voltage Drop (absolute) | [VALUE] | V |
| Cable Current Capacity | [VALUE] | A |
| Safety Margin | [VALUE] | % |

## Key Insights
1. [Insight about cable selection]
2. [Insight about voltage drop margin]
3. [Recommendation if applicable]

## Assumptions
- Resistivity: [VALUE] Ω·mm²/m ([MATERIAL] at 20°C)
- Circuit type: [DC/AC]
- Temperature derating: [VALUE] (ambient [VALUE]°C)`,
};

// Standard cable sizes in mm²
const STANDARD_CABLE_SIZES = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];

// Cable ampacity table (copper, in conduit at 30°C)
const CABLE_AMPACITY: Record<number, number> = {
  1.5: 18, 2.5: 25, 4: 34, 6: 43, 10: 60, 16: 80, 25: 106,
  35: 131, 50: 159, 70: 202, 95: 244, 120: 284, 150: 324, 185: 371, 240: 434, 300: 497,
};

// Temperature derating factors
const TEMP_DERATING: Record<number, number> = {
  30: 1.00, 35: 0.94, 40: 0.87, 45: 0.79, 50: 0.71, 55: 0.61, 60: 0.50,
};

export class CableSizingTaskHandler extends BaseTaskHandler {
  constructor() {
    super(CABLE_SIZING_CONFIG);
  }

  /**
   * Get the next standard cable size >= calculated size
   */
  private getNextStandardSize(calculatedSize: number): number {
    for (const size of STANDARD_CABLE_SIZES) {
      if (size >= calculatedSize) return size;
    }
    return STANDARD_CABLE_SIZES[STANDARD_CABLE_SIZES.length - 1];
  }

  /**
   * Get temperature derating factor
   */
  private getTempDerating(temp: number): number {
    const temps = Object.keys(TEMP_DERATING).map(Number).sort((a, b) => a - b);
    for (const t of temps) {
      if (temp <= t) return TEMP_DERATING[t];
    }
    return 0.50; // Minimum derating for very high temps
  }

  /**
   * Calculate cable sizing
   */
  calculate(inputs: ParsedInputs): TaskCalculationResult {
    const current = inputs.current as number;
    const voltage = inputs.voltage as number;
    const distance = inputs.distance as number;
    const maxVoltageDrop = (inputs.maxVoltageDrop as number) || 3;
    const material = (inputs.cableMaterial as string) || 'copper';
    const circuitType = (inputs.circuitType as string) || 'dc';
    const ambientTemp = (inputs.ambientTemp as number) || 30;

    // Resistivity based on material
    const resistivity = material === 'copper' ? 0.0175 : 0.0282;

    // Factor for circuit type
    const circuitFactor = circuitType === 'three_phase_ac' ? 1.732 : 2;

    // Calculate minimum cable size based on voltage drop
    const vdFraction = maxVoltageDrop / 100;
    const calculatedSize = (circuitFactor * distance * current * resistivity) / (vdFraction * voltage) * 100;

    // Select next standard size
    const selectedSize = this.getNextStandardSize(calculatedSize);

    // Calculate actual voltage drop
    const actualVdPercent = (circuitFactor * distance * current * resistivity) / (selectedSize * voltage) * 100;
    const actualVdVolts = (circuitFactor * distance * current * resistivity) / selectedSize;

    // Get ampacity and apply derating
    const baseAmpacity = CABLE_AMPACITY[selectedSize] || 500;
    const tempDerating = this.getTempDerating(ambientTemp);
    const deratedAmpacity = baseAmpacity * tempDerating;

    // Check if current capacity is sufficient
    const capacityOk = deratedAmpacity >= current;
    const safetyMargin = ((deratedAmpacity - current) / current) * 100;

    const calculations = [
      `Resistivity (${material}): ${resistivity} Ω·mm²/m`,
      `Circuit factor: ${circuitFactor} (${circuitType})`,
      `Min cable size = (${circuitFactor} × ${distance} × ${current} × ${resistivity}) ÷ (${vdFraction} × ${voltage}) × 100`,
      `Min cable size = ${calculatedSize.toFixed(2)} mm²`,
      `Selected standard size: ${selectedSize} mm²`,
      `Actual voltage drop = (${circuitFactor} × ${distance} × ${current} × ${resistivity}) ÷ (${selectedSize} × ${voltage}) × 100`,
      `Actual voltage drop = ${actualVdPercent.toFixed(2)}%`,
      `Temperature derating at ${ambientTemp}°C: ${tempDerating}`,
      `Derated ampacity: ${baseAmpacity} × ${tempDerating} = ${deratedAmpacity.toFixed(0)} A`,
    ];

    const assumptions = [
      `Cable material: ${material.charAt(0).toUpperCase() + material.slice(1)}`,
      `Resistivity: ${resistivity} Ω·mm²/m at 20°C`,
      `Ambient temperature: ${ambientTemp}°C`,
      `Temperature derating factor: ${tempDerating}`,
    ];

    const insights = [
      `Recommended cable size: ${selectedSize} mm² ${material}`,
      `Actual voltage drop (${actualVdPercent.toFixed(2)}%) is ${actualVdPercent <= maxVoltageDrop ? 'within' : 'EXCEEDS'} the ${maxVoltageDrop}% limit`,
      capacityOk
        ? `Cable has ${safetyMargin.toFixed(0)}% current capacity margin`
        : `WARNING: Cable capacity (${deratedAmpacity.toFixed(0)}A) is less than required (${current}A)`,
    ];

    const warnings = [];
    if (!capacityOk) {
      warnings.push(`Cable ampacity insufficient. Consider ${this.getNextStandardSize(selectedSize + 1)} mm² or larger.`);
    }
    if (actualVdPercent > maxVoltageDrop) {
      warnings.push(`Voltage drop exceeds limit. Consider larger cable size.`);
    }

    return {
      success: capacityOk && actualVdPercent <= maxVoltageDrop,
      inputs,
      outputs: {
        recommendedSize: selectedSize,
        actualVoltageDrop: actualVdPercent,
        voltageDropVolts: actualVdVolts,
        cableAmpacity: deratedAmpacity,
        safetyMargin: safetyMargin,
        calculatedMinSize: calculatedSize,
      },
      calculations,
      assumptions,
      insights,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

// Export singleton instance
export const cableSizingTask = new CableSizingTaskHandler();

