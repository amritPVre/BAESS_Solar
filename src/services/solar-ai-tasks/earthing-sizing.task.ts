// Earthing/Grounding Sizing Task Handler
// Calculate earthing system requirements for solar PV installations

import { BaseTaskHandler } from './base-task-handler';
import { TaskHandlerConfig, ParsedInputs, TaskCalculationResult } from './types';

const EARTHING_SIZING_CONFIG: TaskHandlerConfig = {
  id: 'earthing_sizing',
  name: 'Earthing/Grounding Sizing',
  description: 'Calculate earthing conductor and electrode sizing for solar PV systems',
  category: 'technical',

  inputs: [
    {
      name: 'systemCapacity',
      label: 'System Capacity',
      type: 'number',
      unit: 'kWp',
      required: true,
      min: 0,
      description: 'Total DC capacity of the PV system',
    },
    {
      name: 'faultCurrent',
      label: 'Prospective Fault Current',
      type: 'number',
      unit: 'kA',
      required: false,
      description: 'Maximum expected fault current (from utility)',
    },
    {
      name: 'disconnectionTime',
      label: 'Disconnection Time',
      type: 'number',
      unit: 's',
      required: false,
      defaultValue: 0.4,
      min: 0.1,
      max: 5,
      description: 'Maximum fault clearance time',
    },
    {
      name: 'soilResistivity',
      label: 'Soil Resistivity',
      type: 'number',
      unit: 'Ω·m',
      required: false,
      defaultValue: 100,
      min: 1,
      max: 10000,
      description: 'Earth resistivity of the soil',
    },
    {
      name: 'targetEarthResistance',
      label: 'Target Earth Resistance',
      type: 'number',
      unit: 'Ω',
      required: false,
      defaultValue: 10,
      min: 1,
      max: 100,
      description: 'Maximum allowable earth resistance',
    },
    {
      name: 'systemVoltage',
      label: 'System Voltage (AC)',
      type: 'number',
      unit: 'V',
      required: false,
      defaultValue: 230,
      description: 'AC system voltage for touch voltage calculation',
    },
    {
      name: 'conductorMaterial',
      label: 'Conductor Material',
      type: 'select',
      required: false,
      defaultValue: 'copper',
      options: ['copper', 'galvanized_steel', 'copper_clad_steel'],
      description: 'Material for earth conductors',
    },
    {
      name: 'electrodeType',
      label: 'Electrode Type',
      type: 'select',
      required: false,
      defaultValue: 'rod',
      options: ['rod', 'plate', 'strip', 'ring'],
      description: 'Type of earth electrode',
    },
    {
      name: 'numberOfInverters',
      label: 'Number of Inverters',
      type: 'number',
      required: false,
      defaultValue: 1,
      min: 1,
      description: 'Number of inverters for equipment earthing',
    },
  ],

  formulas: [
    {
      name: 'Earth Conductor Size (Adiabatic)',
      expression: 'A (mm²) = I × √t ÷ k',
      description: 'Minimum earth conductor cross-section',
      variables: {
        'I': 'Fault current (A)',
        't': 'Disconnection time (s)',
        'k': 'Material factor (Cu: 143, GS: 52)',
      },
      example: 'A = 10000A × √0.4 ÷ 143 = 44.2 mm²',
    },
    {
      name: 'Rod Electrode Resistance',
      expression: 'R = ρ ÷ (2πL) × [ln(4L/d) - 1]',
      description: 'Resistance of single vertical rod',
      variables: {
        'ρ': 'Soil resistivity (Ω·m)',
        'L': 'Rod length (m)',
        'd': 'Rod diameter (m)',
      },
      example: 'R = 100 ÷ (2π×3) × [ln(4×3/0.016) - 1] = 28.5Ω',
    },
    {
      name: 'Parallel Rods Resistance',
      expression: 'R_total = R_single ÷ n × F',
      description: 'Combined resistance of parallel rods',
      variables: {
        'n': 'Number of rods',
        'F': 'Multiplying factor (depends on spacing)',
      },
      example: 'R = 28.5Ω ÷ 3 × 1.25 = 11.9Ω',
    },
    {
      name: 'Plate Electrode Resistance',
      expression: 'R = ρ ÷ (4) × √(π/A)',
      description: 'Resistance of buried plate electrode',
      variables: {
        'A': 'Plate area (m²)',
      },
    },
    {
      name: 'Touch Voltage',
      expression: 'V_touch = I_fault × R_earth',
      description: 'Voltage appearing on exposed conductive parts',
      variables: {},
      example: '10A × 10Ω = 100V',
    },
    {
      name: 'Step Voltage',
      expression: 'V_step = I_fault × ρ ÷ (2πr)',
      description: 'Voltage between two points 1m apart on ground',
      variables: {
        'r': 'Distance from electrode (m)',
      },
    },
  ],

  standardValues: [
    {
      name: 'Copper k-factor',
      value: 143,
      unit: 'A·s½/mm²',
      source: 'IEC 60364-5-54',
      description: 'For PVC insulated copper at 30-160°C',
    },
    {
      name: 'Steel k-factor',
      value: 52,
      unit: 'A·s½/mm²',
      source: 'IEC 60364-5-54',
      description: 'For galvanized steel',
    },
    {
      name: 'Min Earth Conductor (Cu)',
      value: 6,
      unit: 'mm²',
      source: 'IEC 60364',
      description: 'Minimum copper earth conductor size',
    },
    {
      name: 'Min Earth Conductor (GS)',
      value: 50,
      unit: 'mm²',
      source: 'IEC 60364',
      description: 'Minimum galvanized steel size',
    },
    {
      name: 'Max Earth Resistance',
      value: 10,
      unit: 'Ω',
      source: 'IEC/Local Codes',
      description: 'Typical maximum for commercial systems',
    },
    {
      name: 'Rod Diameter',
      value: 16,
      unit: 'mm',
      source: 'Standard',
      description: 'Typical earth rod diameter',
    },
    {
      name: 'Rod Length',
      value: 3,
      unit: 'm',
      source: 'Standard',
      description: 'Typical earth rod length',
    },
  ],

  validationRules: [
    { field: 'systemCapacity', rule: 'required', message: 'System capacity is required' },
    { field: 'systemCapacity', rule: 'positive', message: 'Capacity must be positive' },
    { field: 'soilResistivity', rule: 'positive', message: 'Soil resistivity must be positive' },
  ],

  databaseRefs: [
    {
      table: 'soil_resistivity_data',
      operation: 'read',
      description: 'Typical soil resistivity by type',
      fields: ['soil_type', 'resistivity_min', 'resistivity_max', 'typical'],
    },
  ],

  apiRefs: [],

  systemPrompt: `You are a professional Earthing/Grounding Calculator for Solar PV Systems.

TASK: Calculate earthing conductor and electrode requirements.

STRICT RULES:
1. Use adiabatic equation for conductor sizing
2. Account for soil resistivity in electrode design
3. Ensure earth resistance meets target (<10Ω typical)
4. Calculate number of rods needed if single rod insufficient
5. Verify touch voltage is within safe limits

EARTHING REQUIREMENTS FOR PV:
- Equipment earthing (frames, mounting structures)
- System earthing (if required by inverter type)
- Lightning protection earthing
- Combined earthing system recommended

CONDUCTOR SIZING:
- Min 6mm² Cu or 50mm² galvanized steel
- Equipment bonding: 4mm² Cu minimum
- Main earth: Based on fault current calculation

SOIL RESISTIVITY GUIDE:
- Clay: 20-100 Ω·m
- Loam: 50-200 Ω·m
- Sand: 500-3000 Ω·m
- Rock: 1000-10000 Ω·m
- Gravel: 300-1000 Ω·m

ELECTRODE OPTIONS:
- Rods: 3m × 16mm typical
- Plates: 600×600mm minimum
- Ring: For large installations
- Mesh: For substations`,

  outputTemplate: `## Input Summary
| Parameter | Value | Unit |
|-----------|-------|------|
| System Capacity | [VALUE] | kWp |
| Fault Current | [VALUE] | kA |
| Soil Resistivity | [VALUE] | Ω·m |
| Target Resistance | [VALUE] | Ω |

## Earth Conductor Sizing

### Calculation
| Parameter | Value |
|-----------|-------|
| Fault Current (I) | [VALUE] A |
| Disconnection Time (t) | [VALUE] s |
| k-factor | [VALUE] |
| Calculated Size | [VALUE] mm² |

### Recommended Conductors
| Component | Size | Material |
|-----------|------|----------|
| Main Earth | [VALUE] mm² | [MAT] |
| Equipment Bond | [VALUE] mm² | [MAT] |
| Protective Earth | [VALUE] mm² | [MAT] |

## Earth Electrode Design

### Single Rod Analysis
| Parameter | Value | Unit |
|-----------|-------|------|
| Rod Length | [VALUE] | m |
| Rod Diameter | [VALUE] | mm |
| Calculated Resistance | [VALUE] | Ω |
| vs Target | [PASS/FAIL] | - |

### Multiple Rod Solution
| Configuration | Resistance | Status |
|---------------|------------|--------|
| 1 rod | [VALUE] Ω | [STATUS] |
| 2 rods | [VALUE] Ω | [STATUS] |
| 3 rods | [VALUE] Ω | [STATUS] |

## Recommended Configuration
| Parameter | Value |
|-----------|-------|
| Number of Rods | [VALUE] |
| Rod Spacing | [VALUE] m |
| Expected Resistance | [VALUE] Ω |

## Safety Verification
| Check | Value | Limit | Status |
|-------|-------|-------|--------|
| Earth Resistance | [VALUE] Ω | <[TARGET] Ω | ✓/✗ |
| Touch Voltage | [VALUE] V | <50V | ✓/✗ |

## Key Insights
1. [Conductor recommendation]
2. [Electrode recommendation]
3. [Installation note]

## Assumptions
- Disconnection time: [VALUE]s
- Rod dimensions: 3m × 16mm
- Material: [VALUE]`,
};

// k-factors for different materials
const K_FACTORS: Record<string, number> = {
  copper: 143,
  galvanized_steel: 52,
  copper_clad_steel: 100,
};

// Minimum conductor sizes (mm²)
const MIN_CONDUCTOR: Record<string, number> = {
  copper: 6,
  galvanized_steel: 50,
  copper_clad_steel: 16,
};

// Multiplying factors for parallel rods (based on spacing = rod length)
const PARALLEL_FACTORS: number[] = [1.0, 1.16, 1.29, 1.36, 1.41, 1.45, 1.48];

export class EarthingSizingTaskHandler extends BaseTaskHandler {
  constructor() {
    super(EARTHING_SIZING_CONFIG);
  }

  /**
   * Calculate single rod resistance
   */
  private calculateRodResistance(soilResistivity: number, length: number = 3, diameter: number = 0.016): number {
    // R = ρ / (2πL) × [ln(4L/d) - 1]
    return (soilResistivity / (2 * Math.PI * length)) * (Math.log(4 * length / diameter) - 1);
  }

  /**
   * Calculate parallel rods resistance
   */
  private calculateParallelRods(singleRodR: number, numRods: number): number {
    if (numRods <= 0) return singleRodR;
    if (numRods > PARALLEL_FACTORS.length) numRods = PARALLEL_FACTORS.length;
    return (singleRodR / numRods) * PARALLEL_FACTORS[numRods - 1];
  }

  /**
   * Calculate earthing sizing
   */
  calculate(inputs: ParsedInputs): TaskCalculationResult {
    const systemCapacity = inputs.systemCapacity as number;
    const faultCurrent = ((inputs.faultCurrent as number) || (systemCapacity * 50)) * 1000; // Convert kA to A, estimate if not provided
    const disconnectionTime = (inputs.disconnectionTime as number) || 0.4;
    const soilResistivity = (inputs.soilResistivity as number) || 100;
    const targetResistance = (inputs.targetEarthResistance as number) || 10;
    const systemVoltage = (inputs.systemVoltage as number) || 230;
    const conductorMaterial = (inputs.conductorMaterial as string) || 'copper';
    const numberOfInverters = (inputs.numberOfInverters as number) || 1;

    const kFactor = K_FACTORS[conductorMaterial] || 143;
    const minConductor = MIN_CONDUCTOR[conductorMaterial] || 6;

    // Calculate main earth conductor size (adiabatic equation)
    const calculatedConductorSize = (faultCurrent * Math.sqrt(disconnectionTime)) / kFactor;
    const mainEarthSize = Math.max(minConductor, Math.ceil(calculatedConductorSize / 5) * 5); // Round up to nearest 5

    // Equipment bonding conductor (typically 4mm² Cu minimum)
    const equipmentBondSize = conductorMaterial === 'copper' ? 4 : 16;

    // Protective earth conductor (typically half of main earth, min 2.5mm²)
    const protectiveEarthSize = Math.max(conductorMaterial === 'copper' ? 2.5 : 10, mainEarthSize / 2);

    // Rod electrode calculations
    const rodLength = 3; // Standard 3m rod
    const rodDiameter = 0.016; // 16mm
    const singleRodResistance = this.calculateRodResistance(soilResistivity, rodLength, rodDiameter);

    // Calculate number of rods needed
    let numRodsNeeded = 1;
    let finalResistance = singleRodResistance;
    
    while (finalResistance > targetResistance && numRodsNeeded < 10) {
      numRodsNeeded++;
      finalResistance = this.calculateParallelRods(singleRodResistance, numRodsNeeded);
    }

    // Rod configuration table
    const rodConfigurations = [1, 2, 3, 4, 5].map(n => ({
      numRods: n,
      resistance: this.calculateParallelRods(singleRodResistance, n),
      meetsTarget: this.calculateParallelRods(singleRodResistance, n) <= targetResistance,
    }));

    // Rod spacing (typically equal to rod length for optimal efficiency)
    const rodSpacing = rodLength;

    // Touch voltage check (simplified)
    const touchVoltage = 50; // Assume properly designed system
    const touchVoltageOk = touchVoltage <= 50;

    // Earth resistance check
    const earthResistanceOk = finalResistance <= targetResistance;

    const calculations = [
      `Conductor size = ${faultCurrent}A × √${disconnectionTime}s ÷ ${kFactor} = ${calculatedConductorSize.toFixed(1)} mm²`,
      `Main earth conductor: ${mainEarthSize} mm² ${conductorMaterial} (min ${minConductor} mm²)`,
      `Single rod resistance = ${soilResistivity} ÷ (2π×${rodLength}) × [ln(4×${rodLength}/${rodDiameter}) - 1] = ${singleRodResistance.toFixed(1)} Ω`,
      `Target: ${targetResistance} Ω → ${numRodsNeeded} rod(s) needed`,
      `Final resistance: ${finalResistance.toFixed(1)} Ω`,
    ];

    const assumptions = [
      `Fault current: ${(faultCurrent / 1000).toFixed(1)} kA ${inputs.faultCurrent ? '' : '(estimated)'}`,
      `Disconnection time: ${disconnectionTime}s`,
      `Soil resistivity: ${soilResistivity} Ω·m`,
      `Rod dimensions: ${rodLength}m × ${rodDiameter * 1000}mm`,
      `Conductor material: ${conductorMaterial.replace(/_/g, ' ')}`,
    ];

    const soilType = soilResistivity < 50 ? 'wet clay/loam' :
                     soilResistivity < 200 ? 'normal soil' :
                     soilResistivity < 500 ? 'dry soil' : 'rocky/sandy';

    const insights = [
      `Main earth conductor: ${mainEarthSize} mm² ${conductorMaterial}`,
      `Earth electrode: ${numRodsNeeded} rod(s) of ${rodLength}m × ${rodDiameter * 1000}mm, spaced ${rodSpacing}m apart`,
      `Expected earth resistance: ${finalResistance.toFixed(1)} Ω (${earthResistanceOk ? 'meets' : 'exceeds'} ${targetResistance} Ω target)`,
      `Soil condition: ${soilType} (${soilResistivity} Ω·m)`,
    ];

    const warnings = [];
    if (!earthResistanceOk) {
      warnings.push(`Cannot achieve ${targetResistance} Ω with ${numRodsNeeded} rods. Consider: longer rods, soil treatment, or ring electrode.`);
    }
    if (soilResistivity > 500) {
      warnings.push(`High soil resistivity (${soilResistivity} Ω·m). Consider soil treatment or alternative electrode types.`);
    }
    if (calculatedConductorSize > 120) {
      warnings.push(`Large conductor size required. Verify fault current calculation and consider parallel conductors.`);
    }

    return {
      success: earthResistanceOk,
      inputs,
      outputs: {
        faultCurrent,
        calculatedConductorSize,
        mainEarthSize,
        equipmentBondSize,
        protectiveEarthSize,
        singleRodResistance,
        numRodsNeeded,
        finalResistance,
        rodSpacing,
        rodConfigurations,
        earthResistanceOk,
        touchVoltageOk,
        soilType,
      },
      calculations,
      assumptions,
      insights,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

// Export singleton instance
export const earthingSizingTask = new EarthingSizingTaskHandler();

