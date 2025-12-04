// String Configuration Task Handler
// Calculate optimal number of panels per string and parallel strings

import { BaseTaskHandler } from './base-task-handler';
import { TaskHandlerConfig, ParsedInputs, TaskCalculationResult } from './types';

const STRING_CONFIGURATION_CONFIG: TaskHandlerConfig = {
  id: 'string_configuration',
  name: 'String Configuration',
  description: 'Calculate optimal number of panels per string and parallel strings',
  category: 'sizing',

  inputs: [
    {
      name: 'panelVmp',
      label: 'Panel Voltage at Max Power (Vmp)',
      type: 'number',
      unit: 'V',
      required: true,
      min: 0,
      description: 'Maximum power point voltage of the panel',
    },
    {
      name: 'panelVoc',
      label: 'Panel Open Circuit Voltage (Voc)',
      type: 'number',
      unit: 'V',
      required: true,
      min: 0,
      description: 'Open circuit voltage at STC (25°C)',
    },
    {
      name: 'panelImp',
      label: 'Panel Current at Max Power (Imp)',
      type: 'number',
      unit: 'A',
      required: true,
      min: 0,
      description: 'Current at maximum power point',
    },
    {
      name: 'panelIsc',
      label: 'Panel Short Circuit Current (Isc)',
      type: 'number',
      unit: 'A',
      required: false,
      description: 'Short circuit current (for safety calculations)',
    },
    {
      name: 'panelWattage',
      label: 'Panel Wattage',
      type: 'number',
      unit: 'W',
      required: true,
      min: 0,
      description: 'Rated power of each panel',
    },
    {
      name: 'inverterMpptMin',
      label: 'Inverter MPPT Min Voltage',
      type: 'number',
      unit: 'V',
      required: true,
      min: 0,
      description: 'Minimum MPPT tracking voltage of inverter',
    },
    {
      name: 'inverterMpptMax',
      label: 'Inverter MPPT Max Voltage',
      type: 'number',
      unit: 'V',
      required: true,
      min: 0,
      description: 'Maximum MPPT tracking voltage of inverter',
    },
    {
      name: 'inverterMaxVoc',
      label: 'Inverter Max DC Voltage',
      type: 'number',
      unit: 'V',
      required: false,
      description: 'Maximum allowable DC input voltage',
    },
    {
      name: 'inverterMaxCurrent',
      label: 'Inverter Max Input Current',
      type: 'number',
      unit: 'A',
      required: false,
      description: 'Maximum DC input current per MPPT',
    },
    {
      name: 'targetCapacity',
      label: 'Target System Capacity',
      type: 'number',
      unit: 'kWp',
      required: false,
      description: 'Desired total system capacity',
    },
    {
      name: 'minTemp',
      label: 'Minimum Temperature',
      type: 'number',
      unit: '°C',
      required: false,
      defaultValue: -10,
      description: 'Lowest expected ambient temperature',
    },
    {
      name: 'maxTemp',
      label: 'Maximum Cell Temperature',
      type: 'number',
      unit: '°C',
      required: false,
      defaultValue: 70,
      description: 'Highest expected cell temperature',
    },
    {
      name: 'tempCoeffVoc',
      label: 'Temp Coefficient Voc',
      type: 'number',
      unit: '%/°C',
      required: false,
      defaultValue: -0.30,
      description: 'Voltage temperature coefficient (typically -0.25 to -0.35)',
    },
  ],

  formulas: [
    {
      name: 'Voc at Cold Temperature',
      expression: 'Voc_cold = Voc_STC × [1 + TempCoeff × (T_min - 25)]',
      description: 'Open circuit voltage increases in cold weather',
      variables: {
        'TempCoeff': 'Temperature coefficient (%/°C), negative value',
        'T_min': 'Minimum expected temperature (°C)',
      },
      example: 'Voc_cold = 48V × [1 + (-0.30%) × (-10 - 25)] = 48 × 1.105 = 53.0V',
    },
    {
      name: 'Vmp at Hot Temperature',
      expression: 'Vmp_hot = Vmp_STC × [1 + TempCoeff × (T_max - 25)]',
      description: 'Operating voltage decreases in hot weather',
      variables: {
        'T_max': 'Maximum expected cell temperature (°C)',
      },
      example: 'Vmp_hot = 40V × [1 + (-0.35%) × (70 - 25)] = 40 × 0.842 = 33.7V',
    },
    {
      name: 'Maximum Panels per String',
      expression: 'Max Panels = floor(Inverter Max Voc ÷ Voc_cold)',
      description: 'Maximum panels limited by inverter voltage at cold temp',
      variables: {},
      example: 'Max = floor(600V ÷ 53V) = 11 panels',
    },
    {
      name: 'Minimum Panels per String',
      expression: 'Min Panels = ceil(MPPT Min Voltage ÷ Vmp_hot)',
      description: 'Minimum panels to stay within MPPT range at hot temp',
      variables: {},
      example: 'Min = ceil(150V ÷ 33.7V) = 5 panels',
    },
    {
      name: 'Optimal Panels per String',
      expression: 'Optimal = Value within [Min, Max] closest to MPPT midpoint',
      description: 'Typically targets middle of MPPT voltage range',
      variables: {},
    },
    {
      name: 'Number of Strings',
      expression: 'Strings = ceil(Target Capacity ÷ (Panels per String × Panel Wattage))',
      description: 'Parallel strings needed for target capacity',
      variables: {},
    },
  ],

  standardValues: [
    {
      name: 'Voc Temperature Coefficient',
      value: -0.30,
      unit: '%/°C',
      source: 'Typical Mono-Si',
      description: 'Typical for crystalline silicon panels',
    },
    {
      name: 'Design Cold Temperature',
      value: -10,
      unit: '°C',
      source: 'Conservative Design',
      description: 'Common minimum design temperature',
    },
    {
      name: 'Design Hot Temperature',
      value: 70,
      unit: '°C',
      source: 'Conservative Design',
      description: 'Cell temperature under high irradiance',
    },
    {
      name: 'Max Residential Voltage',
      value: 600,
      unit: 'V',
      source: 'NEC (US)',
      description: 'Maximum for residential systems',
    },
  ],

  validationRules: [
    { field: 'panelVmp', rule: 'required', message: 'Panel Vmp is required' },
    { field: 'panelVoc', rule: 'required', message: 'Panel Voc is required' },
    { field: 'panelImp', rule: 'required', message: 'Panel Imp is required' },
    { field: 'panelWattage', rule: 'required', message: 'Panel wattage is required' },
    { field: 'inverterMpptMin', rule: 'required', message: 'Inverter MPPT min voltage is required' },
    { field: 'inverterMpptMax', rule: 'required', message: 'Inverter MPPT max voltage is required' },
  ],

  databaseRefs: [
    {
      table: 'panel_specifications',
      operation: 'read',
      description: 'Solar panel electrical specifications',
      fields: ['model', 'vmp', 'voc', 'imp', 'isc', 'pmax', 'temp_coeff_voc'],
    },
    {
      table: 'inverter_specifications',
      operation: 'read',
      description: 'Inverter MPPT specifications',
      fields: ['model', 'mppt_min', 'mppt_max', 'max_voc', 'max_current', 'num_mppt'],
    },
  ],

  apiRefs: [],

  systemPrompt: `You are a professional Solar String Configuration Calculator.

TASK: Calculate optimal number of panels per string and string configuration.

STRICT RULES:
1. ALWAYS check voltage at COLD temperature (Voc increases)
2. ALWAYS check voltage at HOT temperature (Vmp decreases)
3. String voltage must be within MPPT range at all temperatures
4. Never exceed inverter maximum DC voltage
5. Account for NEC 125% safety factor on Isc if applicable

TEMPERATURE EFFECTS:
- Cold weather: Voc INCREASES (risk of exceeding max voltage)
- Hot weather: Vmp DECREASES (risk of dropping below MPPT min)
- Typical Voc temp coeff: -0.25% to -0.35%/°C

DESIGN TEMPERATURES:
- Cold: -10°C (or record low + 5°C)
- Hot: 70°C cell temp (ambient + 25-30°C rise)

SAFETY MARGINS:
- Stay 5-10% below max voltage
- Stay 10% above minimum MPPT voltage
- Allow for voltage drop in long cable runs`,

  outputTemplate: `## Input Summary
| Parameter | Panel | Inverter |
|-----------|-------|----------|
| Voc | [VALUE] V | Max: [VALUE] V |
| Vmp | [VALUE] V | MPPT: [MIN]-[MAX] V |
| Imp | [VALUE] A | Max: [VALUE] A |
| Power | [VALUE] W | - |

## Temperature-Adjusted Voltages
| Condition | Temperature | Voc | Vmp |
|-----------|-------------|-----|-----|
| STC | 25°C | [VALUE] V | [VALUE] V |
| Cold | [VALUE]°C | [VALUE] V | - |
| Hot | [VALUE]°C | - | [VALUE] V |

## String Configuration Limits
| Parameter | Value | Formula |
|-----------|-------|---------|
| Min Panels/String | [VALUE] | MPPT Min ÷ Vmp_hot |
| Max Panels/String | [VALUE] | Max Vdc ÷ Voc_cold |
| Optimal Panels/String | [VALUE] | Mid-MPPT range |

## Recommended Configuration
| Parameter | Value | Unit |
|-----------|-------|------|
| Panels per String | [VALUE] | panels |
| String Voc (cold) | [VALUE] | V |
| String Vmp (STC) | [VALUE] | V |
| String Vmp (hot) | [VALUE] | V |
| Number of Strings | [VALUE] | parallel |
| Total Panels | [VALUE] | panels |
| Total Capacity | [VALUE] | kWp |

## Voltage Verification
| Check | Value | Limit | Status |
|-------|-------|-------|--------|
| Voc at cold | [VALUE] V | < [VALUE] V | ✓/✗ |
| Vmp at hot | [VALUE] V | > [VALUE] V | ✓/✗ |

## Key Insights
1. [Configuration recommendation]
2. [Safety margin assessment]
3. [Optimization note]

## Assumptions
- Min Temperature: [VALUE]°C
- Max Cell Temperature: [VALUE]°C
- Temp Coefficient Voc: [VALUE]%/°C`,
};

export class StringConfigurationTaskHandler extends BaseTaskHandler {
  constructor() {
    super(STRING_CONFIGURATION_CONFIG);
  }

  /**
   * Calculate string configuration
   */
  calculate(inputs: ParsedInputs): TaskCalculationResult {
    const panelVmp = inputs.panelVmp as number;
    const panelVoc = inputs.panelVoc as number;
    const panelImp = inputs.panelImp as number;
    const panelIsc = (inputs.panelIsc as number) || panelImp * 1.1;
    const panelWattage = inputs.panelWattage as number;
    const inverterMpptMin = inputs.inverterMpptMin as number;
    const inverterMpptMax = inputs.inverterMpptMax as number;
    const inverterMaxVoc = (inputs.inverterMaxVoc as number) || inverterMpptMax * 1.2;
    const inverterMaxCurrent = inputs.inverterMaxCurrent as number;
    const targetCapacity = inputs.targetCapacity as number;
    const minTemp = (inputs.minTemp as number) ?? -10;
    const maxTemp = (inputs.maxTemp as number) || 70;
    const tempCoeffVoc = (inputs.tempCoeffVoc as number) || -0.30;

    // Temperature-adjusted voltages
    const vocCold = panelVoc * (1 + (tempCoeffVoc / 100) * (minTemp - 25));
    const vmpHot = panelVmp * (1 + (tempCoeffVoc / 100) * (maxTemp - 25));

    // Calculate string limits
    const maxPanelsPerString = Math.floor(inverterMaxVoc / vocCold);
    const minPanelsPerString = Math.ceil(inverterMpptMin / vmpHot);

    // Check if valid configuration exists
    const isValidRange = maxPanelsPerString >= minPanelsPerString;

    // Optimal panels per string (target middle of MPPT range)
    const mpptMidpoint = (inverterMpptMin + inverterMpptMax) / 2;
    const optimalByVmp = Math.round(mpptMidpoint / panelVmp);
    const optimalPanels = Math.min(maxPanelsPerString, Math.max(minPanelsPerString, optimalByVmp));

    // String voltages
    const stringVocCold = optimalPanels * vocCold;
    const stringVmpSTC = optimalPanels * panelVmp;
    const stringVmpHot = optimalPanels * vmpHot;
    const stringIsc = panelIsc;

    // Number of strings for target capacity
    let numberOfStrings = 1;
    let totalPanels = optimalPanels;
    let totalCapacity = (optimalPanels * panelWattage) / 1000;

    if (targetCapacity) {
      numberOfStrings = Math.ceil((targetCapacity * 1000) / (optimalPanels * panelWattage));
      totalPanels = numberOfStrings * optimalPanels;
      totalCapacity = (totalPanels * panelWattage) / 1000;
    }

    // Total string current
    const totalCurrent = numberOfStrings * panelIsc;

    // Verification checks
    const vocCheck = stringVocCold < inverterMaxVoc;
    const vmpMinCheck = stringVmpHot > inverterMpptMin;
    const vmpMaxCheck = stringVmpSTC < inverterMpptMax;
    const currentCheck = !inverterMaxCurrent || (stringIsc <= inverterMaxCurrent);

    // Safety margins
    const vocMargin = ((inverterMaxVoc - stringVocCold) / inverterMaxVoc) * 100;
    const vmpMinMargin = ((stringVmpHot - inverterMpptMin) / inverterMpptMin) * 100;

    const calculations = [
      `Voc at ${minTemp}°C = ${panelVoc}V × [1 + (${tempCoeffVoc}%) × (${minTemp} - 25)] = ${vocCold.toFixed(2)}V`,
      `Vmp at ${maxTemp}°C = ${panelVmp}V × [1 + (${tempCoeffVoc}%) × (${maxTemp} - 25)] = ${vmpHot.toFixed(2)}V`,
      `Max panels/string = floor(${inverterMaxVoc}V ÷ ${vocCold.toFixed(2)}V) = ${maxPanelsPerString} panels`,
      `Min panels/string = ceil(${inverterMpptMin}V ÷ ${vmpHot.toFixed(2)}V) = ${minPanelsPerString} panels`,
      `Optimal panels/string = ${optimalPanels} (within MPPT range)`,
      `String Voc (cold) = ${optimalPanels} × ${vocCold.toFixed(2)}V = ${stringVocCold.toFixed(1)}V`,
      `String Vmp (hot) = ${optimalPanels} × ${vmpHot.toFixed(2)}V = ${stringVmpHot.toFixed(1)}V`,
    ];

    if (targetCapacity) {
      calculations.push(
        `Strings needed = ceil(${targetCapacity}kW × 1000 ÷ (${optimalPanels} × ${panelWattage}W)) = ${numberOfStrings}`,
        `Total capacity = ${totalPanels} × ${panelWattage}W = ${totalCapacity.toFixed(2)} kWp`
      );
    }

    const assumptions = [
      `Min Temperature: ${minTemp}°C`,
      `Max Cell Temperature: ${maxTemp}°C`,
      `Voc Temperature Coefficient: ${tempCoeffVoc}%/°C`,
      `Panel Isc: ${panelIsc.toFixed(1)}A`,
    ];

    const insights = [
      `Recommended: ${optimalPanels} panels per string (range: ${minPanelsPerString}-${maxPanelsPerString})`,
      `String voltage at cold: ${stringVocCold.toFixed(1)}V (${vocMargin.toFixed(1)}% margin to max)`,
      `String voltage at hot: ${stringVmpHot.toFixed(1)}V (${vmpMinMargin.toFixed(1)}% margin above MPPT min)`,
      targetCapacity ? `Configuration: ${numberOfStrings} strings × ${optimalPanels} panels = ${totalPanels} panels (${totalCapacity.toFixed(2)} kWp)` : null,
    ].filter(Boolean) as string[];

    const warnings = [];
    if (!isValidRange) {
      warnings.push(`No valid configuration: Min panels (${minPanelsPerString}) exceeds max (${maxPanelsPerString}). Check inverter compatibility.`);
    }
    if (!vocCheck) {
      warnings.push(`String Voc at cold (${stringVocCold.toFixed(1)}V) exceeds inverter max (${inverterMaxVoc}V). Reduce panels per string.`);
    }
    if (!vmpMinCheck) {
      warnings.push(`String Vmp at hot (${stringVmpHot.toFixed(1)}V) below MPPT min (${inverterMpptMin}V). Add more panels.`);
    }
    if (!currentCheck && inverterMaxCurrent) {
      warnings.push(`String Isc (${stringIsc.toFixed(1)}A) may exceed inverter max current (${inverterMaxCurrent}A).`);
    }

    return {
      success: isValidRange && vocCheck && vmpMinCheck,
      inputs,
      outputs: {
        minPanelsPerString,
        maxPanelsPerString,
        optimalPanels,
        vocCold,
        vmpHot,
        stringVocCold,
        stringVmpSTC,
        stringVmpHot,
        stringIsc,
        numberOfStrings,
        totalPanels,
        totalCapacity,
        vocMargin,
        vmpMinMargin,
        vocCheck,
        vmpMinCheck,
        currentCheck,
      },
      calculations,
      assumptions,
      insights,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

// Export singleton instance
export const stringConfigurationTask = new StringConfigurationTaskHandler();

