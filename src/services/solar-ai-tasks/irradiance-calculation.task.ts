// Solar Irradiance Calculation Task Handler
// Calculate solar irradiance and energy production based on location, tilt, and azimuth

import { BaseTaskHandler } from './base-task-handler';
import { TaskHandlerConfig, ParsedInputs, TaskCalculationResult } from './types';

const IRRADIANCE_CALCULATION_CONFIG: TaskHandlerConfig = {
  id: 'irradiance_calculation',
  name: 'Solar Irradiance Calculation',
  description: 'Calculate solar irradiance and energy production based on location, tilt, and azimuth',
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
      description: 'Location latitude (-90 to +90, positive for North)',
    },
    {
      name: 'longitude',
      label: 'Longitude',
      type: 'number',
      unit: '°',
      required: false,
      min: -180,
      max: 180,
      description: 'Location longitude (-180 to +180, positive for East)',
    },
    {
      name: 'tilt',
      label: 'Panel Tilt Angle',
      type: 'number',
      unit: '°',
      required: false,
      defaultValue: 0,
      min: 0,
      max: 90,
      description: 'Angle from horizontal (0° = flat, 90° = vertical)',
    },
    {
      name: 'azimuth',
      label: 'Panel Azimuth',
      type: 'number',
      unit: '°',
      required: false,
      defaultValue: 180,
      min: 0,
      max: 360,
      description: 'Panel orientation (180° = South in N.Hemisphere, 0° = North in S.Hemisphere)',
    },
    {
      name: 'systemCapacity',
      label: 'System Capacity',
      type: 'number',
      unit: 'kWp',
      required: false,
      description: 'PV system capacity for energy production estimate',
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
      description: 'System performance ratio (typically 75-85%)',
    },
  ],

  formulas: [
    {
      name: 'Global Horizontal Irradiance (GHI)',
      expression: 'GHI = DNI × cos(θz) + DHI',
      description: 'Total irradiance on a horizontal surface',
      variables: {
        'DNI': 'Direct Normal Irradiance',
        'DHI': 'Diffuse Horizontal Irradiance',
        'θz': 'Solar zenith angle',
      },
    },
    {
      name: 'Plane of Array Irradiance (POA)',
      expression: 'POA = DNI × cos(AOI) + DHI × (1 + cos(β))/2 + GHI × ρ × (1 - cos(β))/2',
      description: 'Total irradiance on tilted panel surface',
      variables: {
        'AOI': 'Angle of incidence',
        'β': 'Panel tilt angle',
        'ρ': 'Ground reflectance (albedo, typically 0.2)',
      },
    },
    {
      name: 'Peak Sun Hours (PSH)',
      expression: 'PSH = Daily Irradiation (kWh/m²/day) ÷ 1 kW/m²',
      description: 'Equivalent hours of 1000 W/m² irradiance',
      variables: {
        'Daily Irradiation': 'Sum of hourly irradiance values',
      },
      example: '5.5 kWh/m²/day = 5.5 Peak Sun Hours',
    },
    {
      name: 'Daily Energy Production',
      expression: 'E_day (kWh) = Capacity (kWp) × PSH × PR',
      description: 'Expected daily energy generation',
      variables: {
        'PR': 'Performance Ratio (0.75-0.85)',
      },
      example: '10 kWp × 5.5 PSH × 0.80 = 44 kWh/day',
    },
    {
      name: 'Annual Energy Production',
      expression: 'E_year (kWh) = Capacity × Annual PSH × 365 × PR',
      description: 'Expected annual energy generation',
      variables: {},
      example: '10 kWp × 5.5 × 365 × 0.80 = 16,060 kWh/year',
    },
    {
      name: 'Optimal Tilt Angle',
      expression: 'Optimal Tilt ≈ |Latitude| ± 15° (seasonal adjustment)',
      description: 'Rule of thumb for optimal annual tilt',
      variables: {
        '±15°': 'Subtract for summer, add for winter optimization',
      },
    },
  ],

  standardValues: [
    {
      name: 'Tropical PSH',
      value: '5.5-6.5',
      unit: 'hours',
      source: 'NASA POWER',
      description: 'Peak sun hours in tropical regions (±23.5° latitude)',
    },
    {
      name: 'Temperate PSH',
      value: '3.5-5.0',
      unit: 'hours',
      source: 'NASA POWER',
      description: 'Peak sun hours in temperate regions (35-55° latitude)',
    },
    {
      name: 'Desert PSH',
      value: '6.0-7.5',
      unit: 'hours',
      source: 'NASA POWER',
      description: 'Peak sun hours in desert regions',
    },
    {
      name: 'Ground Albedo',
      value: 0.2,
      unit: '',
      source: 'Standard',
      description: 'Typical ground reflectance for grass/soil',
    },
    {
      name: 'Snow Albedo',
      value: 0.6,
      unit: '',
      source: 'Standard',
      description: 'Ground reflectance with snow cover',
    },
  ],

  validationRules: [
    { field: 'latitude', rule: 'required', message: 'Latitude is required' },
    { field: 'latitude', rule: 'range', value: [-90, 90], message: 'Latitude must be -90 to +90' },
    { field: 'tilt', rule: 'range', value: [0, 90], message: 'Tilt must be 0-90°' },
    { field: 'azimuth', rule: 'range', value: [0, 360], message: 'Azimuth must be 0-360°' },
  ],

  databaseRefs: [
    {
      table: 'solar_irradiance_data',
      operation: 'read',
      description: 'Historical irradiance data by location',
      fields: ['latitude', 'longitude', 'monthly_ghi', 'monthly_dni', 'monthly_dhi', 'annual_psh'],
    },
  ],

  apiRefs: [
    {
      name: 'PVGIS (EU JRC)',
      endpoint: 'https://re.jrc.ec.europa.eu/api/v5_2/',
      purpose: 'European solar radiation database',
      dataProvided: ['Monthly/Annual GHI', 'DNI', 'DHI', 'Optimal Tilt', 'Temperature'],
    },
    {
      name: 'NASA POWER',
      endpoint: 'https://power.larc.nasa.gov/api/',
      purpose: 'Global solar and meteorological data',
      dataProvided: ['GHI', 'DNI', 'DHI', 'Temperature', 'Wind Speed'],
    },
    {
      name: 'NREL NSRDB',
      endpoint: 'https://developer.nrel.gov/api/nsrdb/',
      purpose: 'US National Solar Radiation Database',
      dataProvided: ['TMY Data', 'Hourly Irradiance', 'Weather Data'],
    },
  ],

  systemPrompt: `You are a professional Solar Irradiance Calculator.

TASK: Calculate solar irradiance and estimate energy production based on location.

STRICT RULES:
1. Use latitude to estimate Peak Sun Hours if no exact data
2. Account for tilt and azimuth in calculations
3. Provide monthly breakdown when possible
4. State data source clearly

PSH ESTIMATION BY LATITUDE:
- 0-15°: 5.5-6.5 PSH (Tropical)
- 15-30°: 5.0-6.0 PSH (Subtropical)
- 30-45°: 4.0-5.5 PSH (Temperate)
- 45-60°: 3.0-4.5 PSH (Northern)
- 60°+: 2.0-3.5 PSH (Arctic/Subarctic)

OPTIMAL TILT GUIDELINES:
- Annual optimal: Tilt ≈ Latitude
- Summer bias: Latitude - 15°
- Winter bias: Latitude + 15°

AZIMUTH:
- Northern Hemisphere: 180° (South facing)
- Southern Hemisphere: 0° (North facing)`,

  outputTemplate: `## Input Summary
| Parameter | Value | Unit |
|-----------|-------|------|
| Latitude | [VALUE] | ° |
| Longitude | [VALUE] | ° |
| Tilt Angle | [VALUE] | ° |
| Azimuth | [VALUE] | ° |

## Solar Resource Assessment

### Irradiance Data
| Parameter | Value | Unit |
|-----------|-------|------|
| Annual GHI | [VALUE] | kWh/m²/year |
| Average Daily PSH | [VALUE] | hours |
| Optimal Tilt | [VALUE] | ° |

### Monthly Breakdown
| Month | Daily PSH | Monthly Total |
|-------|-----------|---------------|
| Jan | [VALUE] | [VALUE] kWh/m² |
| Feb | [VALUE] | [VALUE] kWh/m² |
| ... | ... | ... |

## Energy Production Estimate
| Metric | Value | Unit |
|--------|-------|------|
| Daily Production | [VALUE] | kWh |
| Monthly Average | [VALUE] | kWh |
| Annual Production | [VALUE] | kWh |
| Specific Yield | [VALUE] | kWh/kWp |

## Key Insights
1. [Solar resource quality assessment]
2. [Tilt/azimuth optimization recommendation]
3. [Seasonal variation note]

## Assumptions
- Performance Ratio: [VALUE]%
- Ground Albedo: 0.2
- Data Source: [SOURCE]`,
};

// Regional PSH data by latitude range
const PSH_BY_LATITUDE: Array<{ latMin: number; latMax: number; pshAvg: number; pshRange: string }> = [
  { latMin: 0, latMax: 15, pshAvg: 6.0, pshRange: '5.5-6.5' },
  { latMin: 15, latMax: 25, pshAvg: 5.5, pshRange: '5.0-6.0' },
  { latMin: 25, latMax: 35, pshAvg: 5.0, pshRange: '4.5-5.5' },
  { latMin: 35, latMax: 45, pshAvg: 4.5, pshRange: '4.0-5.0' },
  { latMin: 45, latMax: 55, pshAvg: 3.8, pshRange: '3.5-4.5' },
  { latMin: 55, latMax: 65, pshAvg: 3.0, pshRange: '2.5-3.5' },
  { latMin: 65, latMax: 90, pshAvg: 2.5, pshRange: '2.0-3.0' },
];

// Monthly variation factors (Northern Hemisphere)
const MONTHLY_FACTORS = [0.6, 0.7, 0.9, 1.0, 1.1, 1.15, 1.15, 1.1, 1.0, 0.85, 0.7, 0.55];

export class IrradianceCalculationTaskHandler extends BaseTaskHandler {
  constructor() {
    super(IRRADIANCE_CALCULATION_CONFIG);
  }

  /**
   * Get PSH estimate based on latitude
   */
  private getPSHByLatitude(latitude: number): { pshAvg: number; pshRange: string } {
    const absLat = Math.abs(latitude);
    for (const range of PSH_BY_LATITUDE) {
      if (absLat >= range.latMin && absLat < range.latMax) {
        return { pshAvg: range.pshAvg, pshRange: range.pshRange };
      }
    }
    return { pshAvg: 4.5, pshRange: '4.0-5.0' };
  }

  /**
   * Calculate irradiance
   */
  calculate(inputs: ParsedInputs): TaskCalculationResult {
    const latitude = inputs.latitude as number;
    const longitude = inputs.longitude as number || 0;
    const tilt = (inputs.tilt as number) || Math.abs(latitude);
    const azimuth = (inputs.azimuth as number) || (latitude >= 0 ? 180 : 0);
    const systemCapacity = inputs.systemCapacity as number;
    const performanceRatio = ((inputs.performanceRatio as number) || 80) / 100;

    // Get PSH estimate
    const { pshAvg, pshRange } = this.getPSHByLatitude(latitude);

    // Optimal tilt calculation
    const optimalTilt = Math.abs(latitude);

    // Tilt adjustment factor (simplified)
    const tiltDiff = Math.abs(tilt - optimalTilt);
    const tiltAdjustment = 1 - (tiltDiff * 0.003); // ~0.3% loss per degree off optimal

    // Azimuth adjustment (simplified)
    const optimalAzimuth = latitude >= 0 ? 180 : 0;
    const azimuthDiff = Math.min(Math.abs(azimuth - optimalAzimuth), 360 - Math.abs(azimuth - optimalAzimuth));
    const azimuthAdjustment = 1 - (azimuthDiff * 0.002); // ~0.2% loss per degree

    // Adjusted PSH
    const adjustedPSH = pshAvg * tiltAdjustment * azimuthAdjustment;

    // Annual GHI estimate
    const annualGHI = adjustedPSH * 365;

    // Monthly PSH breakdown
    const isNorthern = latitude >= 0;
    const monthlyPSH = MONTHLY_FACTORS.map((factor, i) => {
      const monthFactor = isNorthern ? factor : MONTHLY_FACTORS[(i + 6) % 12];
      return adjustedPSH * monthFactor;
    });

    // Energy production (if capacity provided)
    let dailyProduction = 0;
    let monthlyProduction = 0;
    let annualProduction = 0;
    let specificYield = 0;

    if (systemCapacity) {
      dailyProduction = systemCapacity * adjustedPSH * performanceRatio;
      annualProduction = systemCapacity * annualGHI * performanceRatio;
      monthlyProduction = annualProduction / 12;
      specificYield = annualProduction / systemCapacity;
    }

    const calculations = [
      `Latitude: ${latitude}° → Base PSH range: ${pshRange} hours`,
      `Optimal tilt for annual: ${optimalTilt.toFixed(1)}°`,
      `Tilt adjustment: ${(tiltAdjustment * 100).toFixed(1)}% (tilt=${tilt}° vs optimal=${optimalTilt.toFixed(1)}°)`,
      `Azimuth adjustment: ${(azimuthAdjustment * 100).toFixed(1)}% (${azimuth}° vs optimal=${optimalAzimuth}°)`,
      `Adjusted average PSH: ${pshAvg} × ${tiltAdjustment.toFixed(3)} × ${azimuthAdjustment.toFixed(3)} = ${adjustedPSH.toFixed(2)} hours`,
      `Annual GHI: ${adjustedPSH.toFixed(2)} × 365 = ${annualGHI.toFixed(0)} kWh/m²/year`,
    ];

    if (systemCapacity) {
      calculations.push(
        `Daily production: ${systemCapacity} kWp × ${adjustedPSH.toFixed(2)} × ${performanceRatio} = ${dailyProduction.toFixed(1)} kWh`,
        `Annual production: ${annualProduction.toFixed(0)} kWh`,
        `Specific yield: ${specificYield.toFixed(0)} kWh/kWp/year`
      );
    }

    const assumptions = [
      `Latitude: ${latitude}°, Longitude: ${longitude}°`,
      `Panel Tilt: ${tilt}°`,
      `Panel Azimuth: ${azimuth}°`,
      `Performance Ratio: ${(performanceRatio * 100).toFixed(0)}%`,
      `Ground Albedo: 0.2 (standard)`,
      `Data: Estimated from latitude (use PVGIS/NASA for precise values)`,
    ];

    const solarQuality = adjustedPSH >= 5.5 ? 'Excellent' : adjustedPSH >= 4.5 ? 'Good' : adjustedPSH >= 3.5 ? 'Moderate' : 'Low';
    
    const insights = [
      `Solar resource at this location is ${solarQuality} (${adjustedPSH.toFixed(1)} PSH average)`,
      tilt !== optimalTilt ? `Consider adjusting tilt to ${optimalTilt.toFixed(0)}° for optimal annual production` : `Tilt angle is optimally set for annual production`,
      `Summer months will produce ~${((monthlyPSH[5] / adjustedPSH) * 100).toFixed(0)}% more than average, winter ~${((monthlyPSH[11] / adjustedPSH) * 100).toFixed(0)}% less`,
    ];

    if (systemCapacity) {
      insights.push(`Expected annual production: ${annualProduction.toFixed(0)} kWh (${specificYield.toFixed(0)} kWh/kWp)`);
    }

    return {
      success: true,
      inputs,
      outputs: {
        adjustedPSH,
        annualGHI,
        optimalTilt,
        tiltAdjustment,
        azimuthAdjustment,
        monthlyPSH,
        dailyProduction,
        monthlyProduction,
        annualProduction,
        specificYield,
        solarQuality,
      },
      calculations,
      assumptions,
      insights,
    };
  }
}

// Export singleton instance
export const irradianceCalculationTask = new IrradianceCalculationTaskHandler();

