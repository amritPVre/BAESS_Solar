// DC Cable Sizing Task Handler
// Calculate DC cable sizes for solar PV string and main cables

import { BaseTaskHandler } from './base-task-handler';
import { TaskHandlerConfig, ParsedInputs, TaskCalculationResult } from './types';

const DC_CABLE_SIZING_CONFIG: TaskHandlerConfig = {
  id: 'dc_cable_sizing',
  name: 'DC Cable Sizing',
  description: 'Calculate DC cable sizes for solar PV string and main DC cables',
  category: 'technical',

  inputs: [
    {
      name: 'stringCurrent',
      label: 'String Current (Isc)',
      type: 'number',
      unit: 'A',
      required: true,
      min: 0,
      description: 'Short circuit current of single string',
    },
    {
      name: 'stringVoltage',
      label: 'String Voltage (Voc)',
      type: 'number',
      unit: 'V',
      required: true,
      min: 0,
      description: 'Open circuit voltage of string',
    },
    {
      name: 'numberOfStrings',
      label: 'Number of Strings',
      type: 'number',
      required: true,
      min: 1,
      description: 'Total number of parallel strings',
    },
    {
      name: 'stringCableLength',
      label: 'String Cable Length',
      type: 'number',
      unit: 'm',
      required: true,
      min: 0,
      description: 'Length of cable from string to combiner box (one-way)',
    },
    {
      name: 'mainCableLength',
      label: 'Main DC Cable Length',
      type: 'number',
      unit: 'm',
      required: false,
      description: 'Length from combiner box to inverter (one-way)',
    },
    {
      name: 'maxVoltageDrop',
      label: 'Maximum Voltage Drop',
      type: 'number',
      unit: '%',
      required: false,
      defaultValue: 2,
      min: 0.5,
      max: 5,
      description: 'Maximum allowable voltage drop (typically 1-3%)',
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
      defaultValue: 'exposed',
      options: ['exposed', 'conduit', 'buried', 'cable_tray'],
      description: 'Installation method for derating',
    },
    {
      name: 'ambientTemp',
      label: 'Ambient Temperature',
      type: 'number',
      unit: '°C',
      required: false,
      defaultValue: 40,
      description: 'Maximum expected ambient temperature',
    },
    {
      name: 'cableRating',
      label: 'Cable Temperature Rating',
      type: 'select',
      unit: '°C',
      required: false,
      defaultValue: '90',
      options: ['70', '90', '105'],
      description: 'Cable insulation temperature rating',
    },
  ],

  formulas: [
    {
      name: 'Design Current (NEC)',
      expression: 'I_design = Isc × 1.25 × 1.25 = Isc × 1.56',
      description: 'NEC requires 125% for continuous load × 125% safety factor',
      variables: {
        'Isc': 'String short circuit current',
        '1.56': 'Combined NEC factor (1.25 × 1.25)',
      },
      example: '12A × 1.56 = 18.72A design current',
    },
    {
      name: 'Minimum Cable Size (Voltage Drop)',
      expression: 'A (mm²) = (2 × L × I × ρ) ÷ (Vd × V) × 100',
      description: 'Cable size based on voltage drop limit',
      variables: {
        'L': 'Cable length (one-way, m)',
        'I': 'Design current (A)',
        'ρ': 'Resistivity (Cu: 0.0175, Al: 0.0282 Ω·mm²/m)',
        'Vd': 'Voltage drop percentage',
        'V': 'System voltage',
      },
    },
    {
      name: 'Actual Voltage Drop',
      expression: 'Vdrop (%) = (2 × L × I × ρ) ÷ (A × V) × 100',
      description: 'Calculate voltage drop for selected cable',
      variables: {},
    },
    {
      name: 'Power Loss',
      expression: 'P_loss = I² × R = I² × (2 × L × ρ ÷ A)',
      description: 'Power dissipated in cable',
      variables: {},
      example: '15A² × (2 × 20m × 0.0175 ÷ 6mm²) = 26.25W',
    },
    {
      name: 'Main DC Cable Current',
      expression: 'I_main = I_string × Number of Strings × 1.25',
      description: 'Total DC current from all strings',
      variables: {},
    },
    {
      name: 'Temperature Derating',
      expression: 'I_derated = I_rated × Derating Factor',
      description: 'Reduce ampacity for high ambient temperature',
      variables: {},
    },
  ],

  standardValues: [
    {
      name: 'Copper Resistivity',
      value: 0.0175,
      unit: 'Ω·mm²/m',
      source: 'IEC 60228',
      description: 'At 20°C',
    },
    {
      name: 'Aluminum Resistivity',
      value: 0.0282,
      unit: 'Ω·mm²/m',
      source: 'IEC 60228',
      description: 'At 20°C',
    },
    {
      name: 'String Voltage Drop Limit',
      value: 1,
      unit: '%',
      source: 'Best Practice',
      description: 'Recommended max for string cables',
    },
    {
      name: 'Main DC Voltage Drop Limit',
      value: 2,
      unit: '%',
      source: 'Best Practice',
      description: 'Recommended max for main DC cables',
    },
    {
      name: 'Total DC Voltage Drop',
      value: 3,
      unit: '%',
      source: 'IEC/NEC',
      description: 'Maximum total DC side voltage drop',
    },
    {
      name: 'NEC Continuous Load Factor',
      value: 1.56,
      unit: '',
      source: 'NEC 690.8',
      description: '1.25 × 1.25 for PV systems',
    },
  ],

  validationRules: [
    { field: 'stringCurrent', rule: 'required', message: 'String current is required' },
    { field: 'stringCurrent', rule: 'positive', message: 'Current must be positive' },
    { field: 'stringVoltage', rule: 'required', message: 'String voltage is required' },
    { field: 'numberOfStrings', rule: 'required', message: 'Number of strings is required' },
    { field: 'stringCableLength', rule: 'required', message: 'String cable length is required' },
  ],

  databaseRefs: [
    {
      table: 'cable_specifications',
      operation: 'read',
      description: 'DC solar cable specifications',
      fields: ['size_mm2', 'ampacity_90c', 'ampacity_105c', 'resistance_ohm_km', 'weight_kg_km'],
    },
    {
      table: 'derating_factors',
      operation: 'read',
      description: 'Temperature and installation derating factors',
      fields: ['temp_c', 'derating_70c', 'derating_90c', 'derating_105c'],
    },
  ],

  apiRefs: [],

  systemPrompt: `You are a professional DC Cable Sizing Calculator for Solar PV Systems.

TASK: Calculate appropriate DC cable sizes for string and main cables.

STRICT RULES:
1. Apply NEC 1.56 factor (1.25 × 1.25) to Isc for design current
2. Calculate BOTH string cables AND main DC cable
3. Check BOTH voltage drop AND current carrying capacity
4. Apply temperature derating for ambient >30°C
5. Round UP to next standard cable size

DC CABLE STANDARDS:
- Standard sizes (mm²): 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120
- Solar DC cables rated 1000V or 1500V DC
- UV-resistant for outdoor installation

VOLTAGE DROP GUIDELINES:
- String cables: ≤1% recommended
- Main DC cable: ≤2% recommended
- Total DC side: ≤3% maximum

INSTALLATION CONSIDERATIONS:
- Use UV-rated DC solar cable (e.g., USE-2, PV Wire, H1Z2Z2-K)
- Minimum 4mm² for string cables (mechanical strength)
- Consider conduit fill calculations for multiple cables`,

  outputTemplate: `## Input Summary
| Parameter | Value | Unit |
|-----------|-------|------|
| String Isc | [VALUE] | A |
| String Voc | [VALUE] | V |
| Number of Strings | [VALUE] | - |
| String Cable Length | [VALUE] | m |
| Main Cable Length | [VALUE] | m |

## String Cable Sizing

### Design Current
| Calculation | Value |
|-------------|-------|
| Isc | [VALUE] A |
| × 1.56 (NEC factor) | [VALUE] A |

### Cable Selection
| Parameter | Value | Unit |
|-----------|-------|------|
| Minimum Size (Vdrop) | [VALUE] | mm² |
| Selected Size | [VALUE] | mm² |
| Ampacity (derated) | [VALUE] | A |
| Actual Voltage Drop | [VALUE] | % |
| Power Loss | [VALUE] | W |

## Main DC Cable Sizing

### Design Current
| Calculation | Value |
|-------------|-------|
| Isc × Strings | [VALUE] A |
| × 1.25 (NEC) | [VALUE] A |

### Cable Selection
| Parameter | Value | Unit |
|-----------|-------|------|
| Minimum Size (Vdrop) | [VALUE] | mm² |
| Selected Size | [VALUE] | mm² |
| Ampacity (derated) | [VALUE] | A |
| Actual Voltage Drop | [VALUE] | % |
| Power Loss | [VALUE] | W |

## Summary
| Cable | Size | Vdrop | Current OK |
|-------|------|-------|------------|
| String | [VALUE] mm² | [VALUE]% | ✓/✗ |
| Main DC | [VALUE] mm² | [VALUE]% | ✓/✗ |
| Total DC Vdrop | - | [VALUE]% | ✓/✗ |

## Key Insights
1. [String cable recommendation]
2. [Main cable recommendation]
3. [Total system efficiency note]

## Assumptions
- Cable material: [VALUE]
- Ambient temperature: [VALUE]°C
- Derating factor: [VALUE]`,
};

// Standard DC cable sizes in mm²
const STANDARD_DC_SIZES = [2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];

// Ampacity for copper cables at 90°C in free air
const CABLE_AMPACITY_90C: Record<number, number> = {
  2.5: 30, 4: 40, 6: 52, 10: 71, 16: 96, 25: 128,
  35: 158, 50: 192, 70: 246, 95: 298, 120: 346, 150: 394, 185: 450, 240: 530,
};

// Temperature derating factors for 90°C rated cable
const TEMP_DERATING: Record<number, number> = {
  30: 1.00, 35: 0.96, 40: 0.91, 45: 0.87, 50: 0.82, 55: 0.76, 60: 0.71,
};

export class DCCableSizingTaskHandler extends BaseTaskHandler {
  constructor() {
    super(DC_CABLE_SIZING_CONFIG);
  }

  /**
   * Get next standard cable size >= calculated size
   */
  private getNextStandardSize(calculatedSize: number): number {
    for (const size of STANDARD_DC_SIZES) {
      if (size >= calculatedSize) return size;
    }
    return STANDARD_DC_SIZES[STANDARD_DC_SIZES.length - 1];
  }

  /**
   * Get temperature derating factor
   */
  private getTempDerating(temp: number): number {
    const temps = Object.keys(TEMP_DERATING).map(Number).sort((a, b) => a - b);
    for (const t of temps) {
      if (temp <= t) return TEMP_DERATING[t];
    }
    return 0.71;
  }

  /**
   * Calculate DC cable sizing
   */
  calculate(inputs: ParsedInputs): TaskCalculationResult {
    const stringCurrent = inputs.stringCurrent as number;
    const stringVoltage = inputs.stringVoltage as number;
    const numberOfStrings = inputs.numberOfStrings as number;
    const stringCableLength = inputs.stringCableLength as number;
    const mainCableLength = (inputs.mainCableLength as number) || 0;
    const maxVoltageDrop = (inputs.maxVoltageDrop as number) || 2;
    const material = (inputs.cableMaterial as string) || 'copper';
    const ambientTemp = (inputs.ambientTemp as number) || 40;

    const resistivity = material === 'copper' ? 0.0175 : 0.0282;
    const tempDerating = this.getTempDerating(ambientTemp);

    // String cable calculations
    const stringDesignCurrent = stringCurrent * 1.56; // NEC factor
    const stringVdLimit = Math.min(maxVoltageDrop, 1.5); // Max 1.5% for strings

    // Calculate minimum string cable size (voltage drop)
    const stringMinSize = (2 * stringCableLength * stringDesignCurrent * resistivity) / 
                          ((stringVdLimit / 100) * stringVoltage) * 100;
    
    // Minimum 4mm² for mechanical strength
    const stringSelectedSize = Math.max(4, this.getNextStandardSize(stringMinSize));
    
    // Actual string voltage drop
    const stringActualVd = (2 * stringCableLength * stringDesignCurrent * resistivity) / 
                           (stringSelectedSize * stringVoltage) * 100;
    
    // String cable ampacity check
    const stringAmpacity = (CABLE_AMPACITY_90C[stringSelectedSize] || 100) * tempDerating;
    const stringCurrentOk = stringAmpacity >= stringDesignCurrent;
    
    // String power loss
    const stringPowerLoss = Math.pow(stringDesignCurrent, 2) * 
                            (2 * stringCableLength * resistivity / stringSelectedSize);

    // Main DC cable calculations
    let mainSelectedSize = 0;
    let mainActualVd = 0;
    let mainAmpacity = 0;
    let mainCurrentOk = true;
    let mainPowerLoss = 0;
    let mainDesignCurrent = 0;

    if (mainCableLength > 0) {
      mainDesignCurrent = stringCurrent * numberOfStrings * 1.25;
      const mainVdLimit = maxVoltageDrop;

      const mainMinSize = (2 * mainCableLength * mainDesignCurrent * resistivity) / 
                          ((mainVdLimit / 100) * stringVoltage) * 100;
      
      mainSelectedSize = this.getNextStandardSize(mainMinSize);
      
      mainActualVd = (2 * mainCableLength * mainDesignCurrent * resistivity) / 
                     (mainSelectedSize * stringVoltage) * 100;
      
      mainAmpacity = (CABLE_AMPACITY_90C[mainSelectedSize] || 500) * tempDerating;
      mainCurrentOk = mainAmpacity >= mainDesignCurrent;
      
      mainPowerLoss = Math.pow(mainDesignCurrent, 2) * 
                      (2 * mainCableLength * resistivity / mainSelectedSize);
    }

    // Total voltage drop
    const totalVdrop = stringActualVd + mainActualVd;
    const totalVdropOk = totalVdrop <= 3; // Max 3% total

    // Total power loss
    const totalPowerLoss = (stringPowerLoss * numberOfStrings) + mainPowerLoss;
    const systemPower = stringCurrent * stringVoltage * numberOfStrings;
    const efficiencyLoss = (totalPowerLoss / systemPower) * 100;

    const calculations = [
      `String design current = ${stringCurrent}A × 1.56 = ${stringDesignCurrent.toFixed(2)}A`,
      `String min size = (2 × ${stringCableLength}m × ${stringDesignCurrent.toFixed(2)}A × ${resistivity}) ÷ (${stringVdLimit}% × ${stringVoltage}V) × 100`,
      `String min size = ${stringMinSize.toFixed(2)} mm² → Selected: ${stringSelectedSize} mm²`,
      `String actual Vdrop = ${stringActualVd.toFixed(2)}%`,
      `String ampacity (derated) = ${CABLE_AMPACITY_90C[stringSelectedSize]}A × ${tempDerating} = ${stringAmpacity.toFixed(1)}A`,
    ];

    if (mainCableLength > 0) {
      calculations.push(
        `Main design current = ${stringCurrent}A × ${numberOfStrings} × 1.25 = ${mainDesignCurrent.toFixed(2)}A`,
        `Main selected size: ${mainSelectedSize} mm²`,
        `Main actual Vdrop = ${mainActualVd.toFixed(2)}%`,
        `Total DC voltage drop = ${stringActualVd.toFixed(2)}% + ${mainActualVd.toFixed(2)}% = ${totalVdrop.toFixed(2)}%`
      );
    }

    const assumptions = [
      `Cable material: ${material.charAt(0).toUpperCase() + material.slice(1)}`,
      `Resistivity: ${resistivity} Ω·mm²/m`,
      `Ambient temperature: ${ambientTemp}°C`,
      `Temperature derating: ${tempDerating}`,
      `NEC factor: 1.56 (1.25 × 1.25)`,
    ];

    const insights = [
      `String cables: ${stringSelectedSize} mm² ${material} (${stringActualVd.toFixed(2)}% voltage drop)`,
      mainCableLength > 0 ? `Main DC cable: ${mainSelectedSize} mm² ${material} (${mainActualVd.toFixed(2)}% voltage drop)` : null,
      `Total DC voltage drop: ${totalVdrop.toFixed(2)}% - ${totalVdropOk ? 'within 3% limit' : 'EXCEEDS 3% limit'}`,
      `Cable power loss: ${totalPowerLoss.toFixed(1)}W (${efficiencyLoss.toFixed(2)}% of system power)`,
    ].filter(Boolean) as string[];

    const warnings = [];
    if (!stringCurrentOk) {
      warnings.push(`String cable ampacity (${stringAmpacity.toFixed(1)}A) less than design current (${stringDesignCurrent.toFixed(1)}A). Use larger cable.`);
    }
    if (mainCableLength > 0 && !mainCurrentOk) {
      warnings.push(`Main cable ampacity (${mainAmpacity.toFixed(1)}A) less than design current (${mainDesignCurrent.toFixed(1)}A). Use larger cable.`);
    }
    if (!totalVdropOk) {
      warnings.push(`Total DC voltage drop (${totalVdrop.toFixed(2)}%) exceeds 3% limit. Use larger cables.`);
    }

    return {
      success: stringCurrentOk && mainCurrentOk && totalVdropOk,
      inputs,
      outputs: {
        stringDesignCurrent,
        stringMinSize,
        stringSelectedSize,
        stringActualVd,
        stringAmpacity,
        stringCurrentOk,
        stringPowerLoss,
        mainDesignCurrent,
        mainSelectedSize,
        mainActualVd,
        mainAmpacity,
        mainCurrentOk,
        mainPowerLoss,
        totalVdrop,
        totalVdropOk,
        totalPowerLoss,
        efficiencyLoss,
      },
      calculations,
      assumptions,
      insights,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

// Export singleton instance
export const dcCableSizingTask = new DCCableSizingTaskHandler();

