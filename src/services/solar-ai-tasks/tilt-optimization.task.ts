// Tilt Angle Optimization Task Handler
// Find optimal tilt angle for maximum annual energy production

import { BaseTaskHandler } from './base-task-handler';
import { TaskHandlerConfig, ParsedInputs, TaskCalculationResult } from './types';

const TILT_OPTIMIZATION_CONFIG: TaskHandlerConfig = {
  id: 'tilt_optimization',
  name: 'Tilt Angle Optimization',
  description: 'Find optimal tilt angle for maximum annual energy production',
  category: 'technical',

  inputs: [
    {
      name: 'latitude',
      label: 'Latitude',
      type: 'number',
      unit: '°',
      required: true,
      min: -90,
      max: 90,
      description: 'Location latitude (positive for North, negative for South)',
    },
    {
      name: 'installationType',
      label: 'Installation Type',
      type: 'select',
      required: false,
      defaultValue: 'fixed',
      options: ['fixed', 'seasonal_adjust', 'single_axis_tracker', 'dual_axis_tracker'],
      description: 'Type of mounting system',
    },
    {
      name: 'seasonalPreference',
      label: 'Seasonal Preference',
      type: 'select',
      required: false,
      defaultValue: 'annual',
      options: ['annual', 'summer', 'winter'],
      description: 'Optimize for specific season or annual average',
    },
    {
      name: 'roofPitch',
      label: 'Roof Pitch',
      type: 'number',
      unit: '°',
      required: false,
      min: 0,
      max: 60,
      description: 'Existing roof angle (for roof-mounted systems)',
    },
    {
      name: 'azimuth',
      label: 'Azimuth',
      type: 'number',
      unit: '°',
      required: false,
      defaultValue: 180,
      min: 0,
      max: 360,
      description: 'Panel orientation (180° = South in Northern Hemisphere)',
    },
    {
      name: 'groundClearance',
      label: 'Ground Clearance Constraint',
      type: 'number',
      unit: 'm',
      required: false,
      description: 'Minimum ground clearance for ground-mount systems',
    },
  ],

  formulas: [
    {
      name: 'Annual Optimal Tilt',
      expression: 'Tilt_annual ≈ |Latitude|',
      description: 'Rule of thumb for fixed annual-optimized tilt',
      variables: {
        'Latitude': 'Absolute value of location latitude',
      },
      example: 'At 35°N: Optimal tilt ≈ 35°',
    },
    {
      name: 'Summer Optimal Tilt',
      expression: 'Tilt_summer = |Latitude| - 15°',
      description: 'Lower tilt to capture high summer sun',
      variables: {},
      example: 'At 35°N: Summer tilt = 35° - 15° = 20°',
    },
    {
      name: 'Winter Optimal Tilt',
      expression: 'Tilt_winter = |Latitude| + 15°',
      description: 'Higher tilt to capture low winter sun',
      variables: {},
      example: 'At 35°N: Winter tilt = 35° + 15° = 50°',
    },
    {
      name: 'Production Factor vs Tilt',
      expression: 'Factor = cos(Tilt - Optimal)²',
      description: 'Approximate production loss for non-optimal tilt',
      variables: {},
      example: '10° off optimal ≈ cos(10°)² = 97% production',
    },
    {
      name: 'Tracker Gain',
      expression: 'Single-axis: +20-25% | Dual-axis: +30-40%',
      description: 'Typical production gain from tracking systems',
      variables: {},
    },
    {
      name: 'Inter-Row Spacing',
      expression: 'Spacing = Panel Height × sin(Tilt) ÷ tan(Solar Altitude)',
      description: 'Minimum row spacing to avoid shading at winter solstice',
      variables: {
        'Solar Altitude': 'Sun height at winter solstice noon',
      },
    },
  ],

  standardValues: [
    {
      name: 'Flat Roof Minimum Tilt',
      value: 10,
      unit: '°',
      source: 'Best Practice',
      description: 'Minimum tilt for self-cleaning and drainage',
    },
    {
      name: 'Single-Axis Tracker Gain',
      value: 25,
      unit: '%',
      source: 'Industry Average',
      description: 'Typical production increase vs fixed',
    },
    {
      name: 'Dual-Axis Tracker Gain',
      value: 35,
      unit: '%',
      source: 'Industry Average',
      description: 'Typical production increase vs fixed',
    },
    {
      name: 'Seasonal Adjustment Gain',
      value: 5,
      unit: '%',
      source: 'Industry Average',
      description: 'Gain from adjusting tilt twice per year',
    },
  ],

  validationRules: [
    { field: 'latitude', rule: 'required', message: 'Latitude is required' },
    { field: 'latitude', rule: 'range', value: [-90, 90], message: 'Latitude must be -90 to +90' },
  ],

  databaseRefs: [],
  apiRefs: [
    {
      name: 'PVGIS',
      endpoint: 'https://re.jrc.ec.europa.eu/api/',
      purpose: 'Calculate optimal tilt with actual irradiance data',
      dataProvided: ['Optimal Tilt', 'Optimal Azimuth', 'Production at Various Tilts'],
    },
  ],

  systemPrompt: `You are a professional Solar Tilt Angle Optimization Calculator.

TASK: Determine optimal tilt angle for maximum energy production.

STRICT RULES:
1. Use latitude as primary input for tilt calculation
2. Account for seasonal preferences if specified
3. Consider tracking options and their benefits
4. Provide production comparison at different tilts

TILT GUIDELINES:
- Annual optimal: Tilt ≈ |Latitude| (±5°)
- Summer focus: Tilt = |Latitude| - 15°
- Winter focus: Tilt = |Latitude| + 15°
- Minimum tilt: 10° for self-cleaning

AZIMUTH OPTIMIZATION:
- Northern Hemisphere: 180° (South)
- Southern Hemisphere: 0° (North)
- East/West bias affects morning/afternoon peak

TRACKER CONSIDERATIONS:
- Single-axis (E-W): +20-25% production
- Single-axis (N-S): +15-20% production
- Dual-axis: +30-40% production
- Higher latitudes benefit more from tracking`,

  outputTemplate: `## Input Summary
| Parameter | Value | Unit |
|-----------|-------|------|
| Latitude | [VALUE] | ° |
| Installation Type | [VALUE] | - |
| Seasonal Preference | [VALUE] | - |

## Optimal Angles
| Scenario | Tilt | Azimuth | Production Factor |
|----------|------|---------|-------------------|
| Annual Optimal | [VALUE]° | [VALUE]° | 100% |
| Summer Optimal | [VALUE]° | [VALUE]° | [VALUE]% |
| Winter Optimal | [VALUE]° | [VALUE]° | [VALUE]% |

## Tilt Angle Comparison
| Tilt | Annual Production | vs Optimal |
|------|-------------------|------------|
| 0° (flat) | [VALUE]% | -[VALUE]% |
| 15° | [VALUE]% | -[VALUE]% |
| [OPTIMAL]° | 100% | 0% |
| 45° | [VALUE]% | -[VALUE]% |
| 90° (vertical) | [VALUE]% | -[VALUE]% |

## Tracking Comparison
| System Type | Production | Gain vs Fixed |
|-------------|------------|---------------|
| Fixed (optimal tilt) | 100% | - |
| Seasonal adjust (2×/year) | [VALUE]% | +[VALUE]% |
| Single-axis tracker | [VALUE]% | +[VALUE]% |
| Dual-axis tracker | [VALUE]% | +[VALUE]% |

## Roof Constraint Analysis
[If roof pitch provided]
| Roof Pitch | vs Optimal | Production Loss |
|------------|------------|-----------------|
| [VALUE]° | [DIFF]° | [VALUE]% |

## Key Insights
1. [Optimal tilt recommendation]
2. [Tracking recommendation]
3. [Practical consideration]

## Assumptions
- Optimal azimuth: [VALUE]° (South/North facing)
- No significant shading
- Ground albedo: 0.2`,
};

export class TiltOptimizationTaskHandler extends BaseTaskHandler {
  constructor() {
    super(TILT_OPTIMIZATION_CONFIG);
  }

  /**
   * Calculate production factor for given tilt vs optimal
   */
  private getProductionFactor(tilt: number, optimalTilt: number): number {
    const diff = Math.abs(tilt - optimalTilt);
    // Cosine-based approximation of loss
    return Math.pow(Math.cos(diff * Math.PI / 180), 2) * 100;
  }

  /**
   * Calculate tilt optimization
   */
  calculate(inputs: ParsedInputs): TaskCalculationResult {
    const latitude = inputs.latitude as number;
    const installationType = (inputs.installationType as string) || 'fixed';
    const seasonalPreference = (inputs.seasonalPreference as string) || 'annual';
    const roofPitch = inputs.roofPitch as number;
    const azimuth = (inputs.azimuth as number) || (latitude >= 0 ? 180 : 0);

    const absLatitude = Math.abs(latitude);

    // Calculate optimal tilts
    const annualOptimal = absLatitude;
    const summerOptimal = Math.max(10, absLatitude - 15);
    const winterOptimal = Math.min(75, absLatitude + 15);

    // Selected optimal based on preference
    let selectedOptimal: number;
    switch (seasonalPreference) {
      case 'summer':
        selectedOptimal = summerOptimal;
        break;
      case 'winter':
        selectedOptimal = winterOptimal;
        break;
      default:
        selectedOptimal = annualOptimal;
    }

    // Ensure minimum tilt for self-cleaning
    const recommendedTilt = Math.max(10, selectedOptimal);

    // Production factors at various tilts
    const tiltComparison = [0, 10, 15, 20, 25, 30, 35, 40, 45, 60, 90].map(tilt => ({
      tilt,
      factor: this.getProductionFactor(tilt, annualOptimal),
      diff: tilt - annualOptimal,
    }));

    // Optimal azimuth
    const optimalAzimuth = latitude >= 0 ? 180 : 0;
    const azimuthDiff = Math.abs(azimuth - optimalAzimuth);
    const azimuthLoss = azimuthDiff * 0.2; // ~0.2% loss per degree off optimal

    // Tracker gains
    const trackerGains = {
      fixed: 100,
      seasonal_adjust: 105,
      single_axis_tracker: 125,
      dual_axis_tracker: 135,
    };

    // Roof constraint analysis
    let roofAnalysis = null;
    if (roofPitch !== undefined) {
      const roofDiff = Math.abs(roofPitch - annualOptimal);
      const roofLoss = 100 - this.getProductionFactor(roofPitch, annualOptimal);
      roofAnalysis = {
        roofPitch,
        diff: roofPitch - annualOptimal,
        productionFactor: this.getProductionFactor(roofPitch, annualOptimal),
        loss: roofLoss,
      };
    }

    // Summer vs winter production ratio
    const summerFactor = this.getProductionFactor(recommendedTilt, summerOptimal);
    const winterFactor = this.getProductionFactor(recommendedTilt, winterOptimal);

    const calculations = [
      `Annual optimal tilt = |${latitude}°| = ${annualOptimal.toFixed(1)}°`,
      `Summer optimal tilt = |${latitude}°| - 15° = ${summerOptimal.toFixed(1)}°`,
      `Winter optimal tilt = |${latitude}°| + 15° = ${winterOptimal.toFixed(1)}°`,
      `Selected optimal (${seasonalPreference}): ${selectedOptimal.toFixed(1)}°`,
      `Recommended tilt (≥10°): ${recommendedTilt.toFixed(1)}°`,
      `Optimal azimuth: ${optimalAzimuth}° (${latitude >= 0 ? 'South' : 'North'} facing)`,
      roofPitch !== undefined ? `Roof pitch: ${roofPitch}° (${(roofAnalysis?.loss || 0).toFixed(1)}% loss vs optimal)` : null,
    ].filter(Boolean) as string[];

    const assumptions = [
      `Latitude: ${latitude}°`,
      `Hemisphere: ${latitude >= 0 ? 'Northern' : 'Southern'}`,
      `Seasonal Preference: ${seasonalPreference}`,
      `Optimal Azimuth: ${optimalAzimuth}° (${latitude >= 0 ? 'South' : 'North'})`,
      `Minimum tilt for self-cleaning: 10°`,
    ];

    const insights = [
      `Optimal fixed tilt for ${seasonalPreference} optimization: ${recommendedTilt.toFixed(0)}°`,
      `At this location, flat panels would produce ${this.getProductionFactor(0, annualOptimal).toFixed(0)}% of optimal`,
      installationType === 'fixed' 
        ? `Consider seasonal adjustment (2×/year) for ~5% more production`
        : `${installationType.replace(/_/g, ' ')} provides ~${trackerGains[installationType as keyof typeof trackerGains] - 100}% more production`,
      roofAnalysis 
        ? `Roof pitch of ${roofPitch}° results in ${roofAnalysis.loss.toFixed(1)}% production loss vs optimal`
        : null,
    ].filter(Boolean) as string[];

    const warnings = [];
    if (recommendedTilt < 10) {
      warnings.push('Minimum 10° tilt recommended for panel self-cleaning and drainage');
    }
    if (roofAnalysis && roofAnalysis.loss > 10) {
      warnings.push(`Significant loss (${roofAnalysis.loss.toFixed(1)}%) due to roof pitch. Consider tilt frames or alternative location.`);
    }

    return {
      success: true,
      inputs,
      outputs: {
        annualOptimal,
        summerOptimal,
        winterOptimal,
        selectedOptimal,
        recommendedTilt,
        optimalAzimuth,
        azimuthDiff,
        azimuthLoss,
        tiltComparison,
        trackerGains,
        roofAnalysis,
        summerFactor,
        winterFactor,
      },
      calculations,
      assumptions,
      insights,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

// Export singleton instance
export const tiltOptimizationTask = new TiltOptimizationTaskHandler();

