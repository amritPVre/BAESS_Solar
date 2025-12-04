// Inverter Sizing Task Handler
// Calculate optimal inverter capacity and configuration for the PV system

import { BaseTaskHandler } from './base-task-handler';
import { TaskHandlerConfig, ParsedInputs, TaskCalculationResult } from './types';

const INVERTER_SIZING_CONFIG: TaskHandlerConfig = {
  id: 'inverter_sizing',
  name: 'Inverter Sizing',
  description: 'Calculate optimal inverter capacity and configuration for the PV system',
  category: 'sizing',

  inputs: [
    {
      name: 'pvArrayCapacity',
      label: 'PV Array Capacity',
      type: 'number',
      unit: 'kWp',
      required: true,
      min: 0,
      description: 'Total DC capacity of the solar panel array',
    },
    {
      name: 'pvVoc',
      label: 'Panel Open Circuit Voltage (Voc)',
      type: 'number',
      unit: 'V',
      required: false,
      description: 'Maximum voltage of single panel (at STC)',
    },
    {
      name: 'pvVmp',
      label: 'Panel Max Power Voltage (Vmp)',
      type: 'number',
      unit: 'V',
      required: false,
      description: 'Operating voltage at max power',
    },
    {
      name: 'pvIsc',
      label: 'Panel Short Circuit Current (Isc)',
      type: 'number',
      unit: 'A',
      required: false,
      description: 'Maximum current of single panel',
    },
    {
      name: 'panelsPerString',
      label: 'Panels per String',
      type: 'number',
      required: false,
      min: 1,
      description: 'Number of panels connected in series',
    },
    {
      name: 'numberOfStrings',
      label: 'Number of Strings',
      type: 'number',
      required: false,
      min: 1,
      description: 'Number of parallel strings',
    },
    {
      name: 'systemType',
      label: 'System Type',
      type: 'select',
      required: false,
      defaultValue: 'grid_tied',
      options: ['grid_tied', 'off_grid', 'hybrid'],
      description: 'Type of solar installation',
    },
    {
      name: 'gridVoltage',
      label: 'Grid Voltage',
      type: 'select',
      unit: 'V',
      required: false,
      defaultValue: '230',
      options: ['120', '230', '240', '400', '480'],
      description: 'AC grid voltage',
    },
    {
      name: 'gridPhase',
      label: 'Grid Phase',
      type: 'select',
      required: false,
      defaultValue: 'single',
      options: ['single', 'three'],
      description: 'Single phase or three phase grid',
    },
  ],

  formulas: [
    {
      name: 'DC:AC Ratio',
      expression: 'DC:AC Ratio = PV Array Capacity (kWp) ÷ Inverter AC Capacity (kW)',
      description: 'Ratio of DC array size to inverter AC rating',
      variables: {
        'Typical Range': '1.0 to 1.3 (higher in areas with less solar)',
      },
      example: '10 kWp ÷ 8 kW = 1.25 DC:AC ratio',
    },
    {
      name: 'Inverter AC Sizing',
      expression: 'Inverter Size = PV Capacity ÷ DC:AC Ratio',
      description: 'Minimum inverter size based on desired DC:AC ratio',
      variables: {
        'DC:AC Ratio': 'Typically 1.1 to 1.25',
      },
      example: '10 kWp ÷ 1.2 = 8.33 kW inverter',
    },
    {
      name: 'String Voltage Check',
      expression: 'Vstring = Panels × Vmp (at max temp) to Panels × Voc (at min temp)',
      description: 'Verify string voltage is within inverter MPPT range',
      variables: {
        'Vmp at high temp': 'Vmp × (1 + TempCoeff × ΔT)',
        'Voc at low temp': 'Voc × (1 - TempCoeff × ΔT)',
      },
    },
    {
      name: 'Maximum Input Current',
      expression: 'Imax = Number of Strings × Isc × 1.25',
      description: 'Maximum DC input current (with NEC 125% safety factor)',
      variables: {
        'Isc': 'Panel short circuit current',
      },
      example: '4 strings × 11A × 1.25 = 55A',
    },
    {
      name: 'Clipping Loss Estimate',
      expression: 'Clipping Loss ≈ (DC:AC Ratio - 1) × Peak Production Hours × Days',
      description: 'Estimate energy lost due to inverter clipping at high DC:AC ratios',
      variables: {
        'Peak Production Hours': 'Hours above inverter capacity',
      },
    },
  ],

  standardValues: [
    {
      name: 'Optimal DC:AC Ratio',
      value: '1.1 - 1.25',
      unit: '',
      source: 'Industry Practice',
      description: 'Balance between cost savings and clipping losses',
    },
    {
      name: 'Temperature Coefficient (Voc)',
      value: -0.3,
      unit: '%/°C',
      source: 'Typical Panel Spec',
      description: 'Voltage decrease per degree above STC (25°C)',
    },
    {
      name: 'Minimum Inverter Efficiency',
      value: 97,
      unit: '%',
      source: 'CEC Standard',
      description: 'Modern inverters achieve 97-99% peak efficiency',
    },
    {
      name: 'Max DC Voltage (Residential)',
      value: 600,
      unit: 'V',
      source: 'NEC (US)',
      description: 'Maximum DC voltage for residential systems',
    },
    {
      name: 'Max DC Voltage (Commercial)',
      value: 1000,
      unit: 'V',
      source: 'IEC Standard',
      description: 'Maximum for commercial/utility systems',
    },
  ],

  validationRules: [
    { field: 'pvArrayCapacity', rule: 'required', message: 'PV array capacity is required' },
    { field: 'pvArrayCapacity', rule: 'positive', message: 'PV capacity must be positive' },
  ],

  databaseRefs: [
    {
      table: 'inverter_specifications',
      operation: 'read',
      description: 'Inverter models and technical specifications',
      fields: ['manufacturer', 'model', 'ac_power_kw', 'max_dc_power', 'mppt_voltage_min', 'mppt_voltage_max', 'max_dc_current', 'efficiency', 'warranty'],
    },
    {
      table: 'panel_specifications',
      operation: 'read',
      description: 'Solar panel electrical characteristics',
      fields: ['model', 'voc', 'vmp', 'isc', 'imp', 'temp_coeff_voc', 'temp_coeff_pmax'],
    },
  ],

  apiRefs: [],

  systemPrompt: `You are a professional Solar Inverter Sizing Calculator.

TASK: Size and configure the optimal inverter for a PV system.

STRICT RULES:
1. Calculate appropriate DC:AC ratio (typically 1.1-1.25)
2. Verify MPPT voltage range compatibility
3. Check maximum input current limits
4. Consider string configuration if panel specs provided
5. Account for temperature effects on voltage

DC:AC RATIO GUIDELINES:
- High irradiance areas (>5.5 PSH): 1.1-1.15
- Medium irradiance (4-5.5 PSH): 1.15-1.2
- Low irradiance (<4 PSH): 1.2-1.3

VOLTAGE CONSIDERATIONS:
- Cold temp increases Voc (check max MPPT voltage)
- Hot temp decreases Vmp (check min MPPT voltage)
- Use -10°C for max Voc, +70°C for min Vmp

SAFETY:
- Apply 125% safety factor to Isc per NEC
- Max residential DC voltage: 600V (US) / 1000V (EU)
- Leave 10% margin on MPPT voltage range`,

  outputTemplate: `## Input Summary
| Parameter | Value | Unit |
|-----------|-------|------|
| PV Array Capacity | [VALUE] | kWp |
| System Type | [VALUE] | - |
| Grid Voltage | [VALUE] | V |
| Grid Phase | [VALUE] | - |

## Inverter Sizing Analysis

### Recommended Inverter Capacity
| DC:AC Ratio | Inverter Size | Clipping Risk |
|-------------|---------------|---------------|
| 1.10 | [VALUE] kW | Low |
| 1.20 | [VALUE] kW | Medium |
| 1.30 | [VALUE] kW | Higher |

### Recommended: [VALUE] kW inverter (DC:AC = [VALUE])

## String Configuration Check
| Parameter | Value | Status |
|-----------|-------|--------|
| String Voc (cold) | [VALUE] V | ✓/✗ Within MPPT max |
| String Vmp (hot) | [VALUE] V | ✓/✗ Within MPPT min |
| Total Isc | [VALUE] A | ✓/✗ Within max input |

## Results
| Output | Value | Unit |
|--------|-------|------|
| Recommended Inverter Size | [VALUE] | kW |
| DC:AC Ratio | [VALUE] | - |
| Estimated Clipping Loss | [VALUE] | % |
| Inverter Efficiency | [VALUE] | % |

## Key Insights
1. [Insight about sizing]
2. [Insight about configuration]
3. [Recommendation]

## Assumptions
- DC:AC Ratio target: [VALUE]
- Inverter efficiency: [VALUE]%
- Temperature range: -10°C to +70°C`,
};

export class InverterSizingTaskHandler extends BaseTaskHandler {
  constructor() {
    super(INVERTER_SIZING_CONFIG);
  }

  /**
   * Calculate inverter sizing
   */
  calculate(inputs: ParsedInputs): TaskCalculationResult {
    const pvArrayCapacity = inputs.pvArrayCapacity as number;
    const pvVoc = inputs.pvVoc as number;
    const pvVmp = inputs.pvVmp as number;
    const pvIsc = inputs.pvIsc as number;
    const panelsPerString = inputs.panelsPerString as number;
    const numberOfStrings = inputs.numberOfStrings as number;
    const systemType = (inputs.systemType as string) || 'grid_tied';
    const gridVoltage = parseInt((inputs.gridVoltage as string) || '230');
    const gridPhase = (inputs.gridPhase as string) || 'single';

    // Calculate inverter sizes at different DC:AC ratios
    const dcAcRatios = [1.1, 1.15, 1.2, 1.25, 1.3];
    const inverterSizes = dcAcRatios.map(ratio => ({
      ratio,
      size: pvArrayCapacity / ratio,
      clippingRisk: ratio <= 1.1 ? 'Very Low' : ratio <= 1.2 ? 'Low' : ratio <= 1.25 ? 'Medium' : 'Higher',
    }));

    // Recommended: 1.15-1.2 ratio for most cases
    const recommendedRatio = 1.2;
    const recommendedSize = pvArrayCapacity / recommendedRatio;

    // Round to common inverter sizes
    const commonSizes = [3, 4, 5, 6, 8, 10, 12, 15, 17, 20, 25, 30, 33, 36, 50, 60, 75, 100, 125];
    const closestSize = commonSizes.find(s => s >= recommendedSize) || recommendedSize;
    const actualRatio = pvArrayCapacity / closestSize;

    // String configuration checks (if panel specs provided)
    let stringVocCold = 0;
    let stringVmpHot = 0;
    let totalIsc = 0;
    let stringCheckPassed = true;

    if (pvVoc && panelsPerString) {
      // Voc at -10°C (increases ~0.35%/°C below 25°C)
      stringVocCold = pvVoc * panelsPerString * (1 + 0.0035 * 35); // 35°C below STC
    }

    if (pvVmp && panelsPerString) {
      // Vmp at +70°C (decreases ~0.4%/°C above 25°C)
      stringVmpHot = pvVmp * panelsPerString * (1 - 0.004 * 45); // 45°C above STC
    }

    if (pvIsc && numberOfStrings) {
      totalIsc = pvIsc * numberOfStrings * 1.25; // NEC 125% safety factor
    }

    // Estimate clipping loss
    const clippingLossPercent = actualRatio > 1.2 ? (actualRatio - 1.2) * 5 : 0; // Rough estimate

    // Efficiency assumption
    const inverterEfficiency = 97.5;

    const calculations = [
      `PV Array Capacity: ${pvArrayCapacity} kWp`,
      `Recommended DC:AC ratio: ${recommendedRatio}`,
      `Calculated inverter size: ${pvArrayCapacity} ÷ ${recommendedRatio} = ${recommendedSize.toFixed(2)} kW`,
      `Nearest common size: ${closestSize} kW`,
      `Actual DC:AC ratio: ${pvArrayCapacity} ÷ ${closestSize} = ${actualRatio.toFixed(2)}`,
      `Estimated clipping loss: ${clippingLossPercent.toFixed(1)}%`,
    ];

    if (stringVocCold > 0) {
      calculations.push(`String Voc (at -10°C): ${stringVocCold.toFixed(1)} V`);
    }
    if (stringVmpHot > 0) {
      calculations.push(`String Vmp (at +70°C): ${stringVmpHot.toFixed(1)} V`);
    }
    if (totalIsc > 0) {
      calculations.push(`Total Isc (with 125% factor): ${totalIsc.toFixed(1)} A`);
    }

    const assumptions = [
      `System Type: ${systemType.replace(/_/g, ' ')}`,
      `Grid: ${gridPhase} phase, ${gridVoltage}V`,
      `Inverter Efficiency: ${inverterEfficiency}%`,
      `Temperature range: -10°C to +70°C`,
      `Voc temp coefficient: -0.35%/°C`,
      `Vmp temp coefficient: -0.40%/°C`,
    ];

    const insights = [
      `Recommended inverter: ${closestSize} kW (DC:AC ratio = ${actualRatio.toFixed(2)})`,
      `This provides good balance between cost savings and energy harvest`,
      clippingLossPercent > 0
        ? `Expect ~${clippingLossPercent.toFixed(1)}% energy loss from clipping at peak production`
        : `Minimal clipping expected with this configuration`,
    ];

    const warnings = [];
    if (actualRatio > 1.3) {
      warnings.push(`DC:AC ratio of ${actualRatio.toFixed(2)} may result in significant clipping losses`);
    }
    if (actualRatio < 1.0) {
      warnings.push(`DC:AC ratio below 1.0 means oversized inverter - higher cost with no benefit`);
    }

    return {
      success: stringCheckPassed,
      inputs,
      outputs: {
        recommendedInverterSize: closestSize,
        dcAcRatio: actualRatio,
        calculatedSize: recommendedSize,
        clippingLossPercent,
        inverterEfficiency,
        stringVocCold,
        stringVmpHot,
        totalIsc,
        gridVoltage,
        gridPhase,
      },
      calculations,
      assumptions,
      insights,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

// Export singleton instance
export const inverterSizingTask = new InverterSizingTaskHandler();

