// PV System Sizing Task Handler
// Grid-connected, battery-less solar PV system design for residential and small C&I projects
// Uses NREL PVWatts API for solar irradiance and production calculations

import { BaseTaskHandler } from './base-task-handler';
import { TaskHandlerConfig, ParsedInputs, TaskCalculationResult } from './types';
import {
  callPVWattsAPI,
  calculateOptimalTilt,
  calculateOptimalAzimuth,
  getSystemLosses,
  formatMonthlyData,
  calculateAnnualSummary,
  fetchSolarIrradiance,
  simulatePVSystem,
  type ArrayType,
  type PVWattsResponse,
  type MonthlyPVData,
} from '../pvwatts-api.service';
import {
  fetchPanelManufacturers,
  fetchInverterManufacturers,
  fetchPanelForDesign,
  selectOptimalInverter,
  getModuleArea,
  getPanelSummary,
  getInverterSummary,
  type SolarPanel,
  type SolarInverter,
  type InverterSelection,
} from '../solar-equipment.service';

// Installation type codes for PVWatts API
export const INSTALLATION_TYPES = {
  OPEN_RACK: { code: 0, label: 'Open Rack (Ground Mounted)' },
  FIXED_ROOF: { code: 1, label: 'Fixed - Roof Mounted' },
  AXIS_1: { code: 2, label: '1-Axis Tracker' },
  AXIS_1_BACKTRACK: { code: 3, label: '1-Axis Backtracking' },
  AXIS_2: { code: 4, label: '2-Axis Tracker' },
} as const;

// Shading conditions and associated losses
export const SHADING_CONDITIONS = {
  partial: { label: 'Partially Shaded (up to 10%)', loss: 3.0, systemLoss: 14.5 },
  shade_free: { label: 'Fully Shade Free (0%)', loss: 0.5, systemLoss: 12.0 },
} as const;

// AC Voltage options
export const AC_VOLTAGES = [380, 400, 415, 480] as const;

// Default system parameters
const SYSTEM_DEFAULTS = {
  performanceRatio: 0.80,        // 80% PR
  gcr: 0.45,                     // Ground Coverage Ratio
  moduleWattage: 600,            // 600Wp modules
  moduleEfficiency: 0.21,        // 21%
  inverterEfficiency: 0.97,      // 97%
  bifacialityFactor: 0.7,        // For bifacial modules
  dcAcRatioMin: 0.9,
  dcAcRatioMax: 1.25,
  dcAcRatioPreferred: 1.0,      // Prefer ratio > 1.0
};

// Hourly consumption table structure (6AM to 6PM)
export interface HourlyConsumption {
  hour: string;  // "6:00 AM", "7:00 AM", etc.
  consumption: number;  // kWh
}

const PV_SIZING_CONFIG: TaskHandlerConfig = {
  id: 'pv_sizing',
  name: 'PV System Sizing',
  description: 'Design grid-connected, battery-less solar PV systems for residential and small C&I projects',
  category: 'sizing',

  inputs: [
    // Step 1: Daily Daytime Consumption
    {
      name: 'dailyDaytimeConsumption',
      label: 'Daily Average Day-time Energy Consumption (6:00 AM to 6:00 PM)',
      type: 'number',
      unit: 'kWh/day',
      required: true,
      min: 0,
      description: 'Energy consumed during solar hours (6AM-6PM)',
    },
    {
      name: 'provideHourlyData',
      label: 'Would you like to provide hourly consumption data?',
      type: 'select',
      required: false,
      defaultValue: 'NO',
      options: ['YES', 'NO'],
      description: 'Optional hourly breakdown for detailed analysis',
    },
    {
      name: 'hourlyConsumption',
      label: 'Hourly Consumption Data (6AM-6PM)',
      type: 'object',
      required: false,
      description: 'Table of hourly consumption values',
    },
    
    // Step 2: Location
    {
      name: 'latitude',
      label: 'Latitude',
      type: 'number',
      unit: '°',
      required: false,
      min: -90,
      max: 90,
      description: 'Project location latitude (-90 to +90)',
    },
    {
      name: 'longitude',
      label: 'Longitude',
      type: 'number',
      unit: '°',
      required: false,
      min: -180,
      max: 180,
      description: 'Project location longitude (-180 to +180)',
    },
    {
      name: 'city',
      label: 'City',
      type: 'string',
      required: false,
      description: 'City name (if coordinates not available)',
    },
    {
      name: 'country',
      label: 'Country',
      type: 'string',
      required: false,
      description: 'Country name (if coordinates not available)',
    },
    
    // Step 3: Available Space
    {
      name: 'availableSpace',
      label: 'Available Installation Space',
      type: 'number',
      unit: 'm²',
      required: true,
      min: 10,
      description: 'Total area available for PV installation',
    },
    
    // Step 4: Shading Condition
    {
      name: 'shadingCondition',
      label: 'Shading Condition',
      type: 'select',
      required: true,
      options: ['partial', 'shade_free'],
      optionLabels: {
        partial: 'Partially Shaded (up to 10% shading)',
        shade_free: 'Fully Shade Free (0% shading)',
      },
      description: 'Shading condition at installation location',
    },
    
    // Step 5: Installation Type
    {
      name: 'installationType',
      label: 'Installation / Mounting Type',
      type: 'select',
      required: true,
      options: ['0', '1', '2', '3', '4'],
      optionLabels: {
        '0': 'Open Rack (Ground Mounted)',
        '1': 'Fixed - Roof Mounted',
        '2': '1-Axis Tracker',
        '3': '1-Axis Backtracking',
        '4': '2-Axis Tracker',
      },
      description: 'Solar panel mounting structure type',
    },
    
    // Step 6: Panel Manufacturer
    {
      name: 'panelManufacturer',
      label: 'Solar Panel Manufacturer',
      type: 'select',
      required: true,
      dataSource: 'solar_panels',
      description: 'Select from available manufacturers (600Wp modules)',
    },
    
    // Step 7: Inverter Manufacturer
    {
      name: 'inverterManufacturer',
      label: 'Inverter Manufacturer',
      type: 'select',
      required: true,
      dataSource: 'solar_inverters',
      description: 'Select from available manufacturers',
    },
    
    // Step 8: System AC Voltage
    {
      name: 'systemACVoltage',
      label: 'System AC Voltage',
      type: 'select',
      unit: 'V',
      required: true,
      options: ['380', '400', '415', '480'],
      description: 'Grid connection AC voltage',
    },
  ],

  formulas: [
    // Step 3: PV Capacity - Consumption Based
    {
      name: 'PV Capacity (Consumption-Based)',
      expression: 'PV_wp1 (kWp) = E_comp / (E_sol × PR)',
      description: 'Calculate PV capacity based on daily energy consumption',
      variables: {
        'E_comp': 'Daily Average Day-time Energy Consumption (kWh/day)',
        'E_sol': 'Daily Solar Irradiation from PVWatts (kWh/m²/day)',
        'PR': 'Performance Ratio = 0.80 (80%)',
      },
      example: 'PV_wp1 = 50 / (5.2 × 0.80) = 12.02 kWp',
    },
    // Step 4: PV Capacity - Space Based
    {
      name: 'PV Capacity (Space-Based)',
      expression: 'PV_wp2 (kWp) = (St × GCR / Sp) × Pmodule',
      description: 'Calculate maximum PV capacity based on available space',
      variables: {
        'St': 'Available installation space (m²)',
        'GCR': 'Ground Coverage Ratio = 0.45',
        'Sp': 'Single module area (m²) from selected manufacturer',
        'Pmodule': 'Module power = 0.6 kWp (600Wp)',
      },
      example: 'PV_wp2 = (200 × 0.45 / 2.8) × 0.6 = 19.29 kWp',
    },
    // Step 5: Final Capacity Selection
    {
      name: 'Final PV Capacity',
      expression: 'Final = MIN(PV_wp1, PV_wp2)',
      description: 'Select the lower capacity considering both consumption and space',
      variables: {
        'PV_wp1': 'Consumption-based capacity',
        'PV_wp2': 'Space-based capacity',
      },
      example: 'If PV_wp1 (12.02) ≤ PV_wp2 (19.29), Final = 12.02 kWp',
    },
    // Inverter Selection
    {
      name: 'DC/AC Ratio',
      expression: 'DC/AC Ratio = PV Capacity (kWp) / Total Inverter AC Capacity (kW)',
      description: 'Must be between 0.9 and 1.25, prefer > 1.0',
      variables: {
        'PV Capacity': 'Final PV array capacity',
        'Inverter AC': 'Total inverter AC output',
      },
      example: 'DC/AC = 120 / 100 = 1.20 (within range, > 1.0 ✓)',
    },
    // Tilt Angle
    {
      name: 'Tilt Angle Calculation',
      expression: 'Tilt = |Latitude| - 2° (for lat ≤ 25°) OR 25° (for lat > 25°)',
      description: 'Optimal tilt angle based on location latitude',
      variables: {
        'Latitude': 'Project location latitude',
      },
      example: 'Latitude = 20°, Tilt = 20 - 2 = 18°',
    },
    // Azimuth
    {
      name: 'Azimuth Calculation',
      expression: 'Azimuth = 180° (Northern Hemisphere) OR 0° (Southern Hemisphere)',
      description: 'Panel orientation based on hemisphere',
      variables: {
        'Northern': 'South-facing = 180°',
        'Southern': 'North-facing = 0° (or 360°)',
      },
      example: 'Latitude = 20°N, Azimuth = 180° (South)',
    },
    // Monthly PR
    {
      name: 'Monthly Performance Ratio',
      expression: 'Monthly PR (%) = (AC_monthly / (POA_monthly × Capacity)) × 100',
      description: 'Calculate actual performance ratio from PVWatts output',
      variables: {
        'AC_monthly': 'Monthly AC output (kWh)',
        'POA_monthly': 'Plane of Array irradiance (kWh/m²)',
        'Capacity': 'System capacity (kWp)',
      },
      example: 'PR = (1200 / (150 × 10)) × 100 = 80%',
    },
  ],

  standardValues: [
    {
      name: 'Performance Ratio (PR)',
      value: 0.80,
      unit: '',
      source: 'IEC 61724 Standard',
      description: 'Initial design PR for system sizing',
    },
    {
      name: 'Ground Coverage Ratio (GCR)',
      value: 0.45,
      unit: '',
      source: 'Industry Standard',
      description: 'Ratio of module area to total ground area',
    },
    {
      name: 'Module Efficiency',
      value: 21,
      unit: '%',
      source: 'Tier-1 Manufacturer Average',
      description: 'Standard for 600Wp mono-PERC modules',
    },
    {
      name: 'Inverter Efficiency',
      value: 97,
      unit: '%',
      source: 'CEC Standard',
      description: 'Grid-tie inverter efficiency',
    },
    {
      name: 'Bifaciality Factor',
      value: 0.7,
      unit: '',
      source: 'Bifacial Module Standard',
      description: 'Rear-side gain factor for bifacial modules',
    },
    {
      name: 'DC/AC Ratio - Minimum',
      value: 0.9,
      unit: '',
      source: 'Industry Best Practice',
      description: 'Minimum acceptable overload ratio',
    },
    {
      name: 'DC/AC Ratio - Maximum',
      value: 1.25,
      unit: '',
      source: 'Industry Best Practice',
      description: 'Maximum acceptable overload ratio',
    },
    {
      name: 'System Loss (Partial Shading)',
      value: 14.5,
      unit: '%',
      source: 'Design Standard',
      description: 'Total system loss for partially shaded installations',
    },
    {
      name: 'System Loss (Shade Free)',
      value: 12.0,
      unit: '%',
      source: 'Design Standard',
      description: 'Total system loss for shade-free installations',
    },
  ],

  validationRules: [
    {
      field: 'dailyDaytimeConsumption',
      rule: 'required',
      message: 'Daily daytime energy consumption is required',
    },
    {
      field: 'dailyDaytimeConsumption',
      rule: 'positive',
      message: 'Consumption must be a positive number',
    },
    {
      field: 'location',
      rule: 'custom',
      message: 'Either coordinates (lat/long) or city/country is required',
      validator: (inputs: ParsedInputs) => {
        const hasCoords = inputs.latitude !== undefined && inputs.longitude !== undefined;
        const hasLocation = inputs.city !== undefined && inputs.country !== undefined;
        return hasCoords || hasLocation;
      },
    },
    {
      field: 'availableSpace',
      rule: 'required',
      message: 'Available installation space is required',
    },
    {
      field: 'availableSpace',
      rule: 'min',
      value: 10,
      message: 'Minimum 10 m² required for installation',
    },
    {
      field: 'shadingCondition',
      rule: 'required',
      message: 'Please select a shading condition',
    },
    {
      field: 'installationType',
      rule: 'required',
      message: 'Please select an installation type',
    },
    {
      field: 'panelManufacturer',
      rule: 'required',
      message: 'Please select a panel manufacturer',
    },
    {
      field: 'inverterManufacturer',
      rule: 'required',
      message: 'Please select an inverter manufacturer',
    },
    {
      field: 'systemACVoltage',
      rule: 'required',
      message: 'Please select system AC voltage',
    },
  ],

  databaseRefs: [
    {
      table: 'solar_panels',
      operation: 'read',
      description: 'Fetch manufacturer list and 600Wp module specifications',
      fields: ['manufacturer', 'model', 'wattage', 'width', 'height', 'efficiency', 'voc', 'isc', 'vmp', 'imp'],
    },
    {
      table: 'solar_inverters',
      operation: 'read',
      description: 'Fetch inverter manufacturer list and model capacities',
      fields: ['manufacturer', 'model', 'ac_capacity_kw', 'dc_max_kw', 'mppt_count', 'efficiency'],
    },
  ],

  apiRefs: [
    {
      name: 'NREL PVWatts v8',
      endpoint: 'https://developer.nrel.gov/api/pvwatts/v8.json',
      purpose: 'Get hourly/monthly solar irradiance and AC production estimates',
      dataProvided: [
        'solrad_monthly - Monthly solar radiation (kWh/m²/day)',
        'poa_monthly - Plane of array irradiance (kWh/m²)',
        'dc_monthly - DC array output (kWh)',
        'ac_monthly - AC system output (kWh)',
        'ac_annual - Annual AC output (kWh)',
        'solrad_annual - Annual average solar radiation',
        'capacity_factor - System capacity factor',
      ],
    },
    {
      name: 'Geocoding API',
      endpoint: 'OpenStreetMap Nominatim / Google Geocoding',
      purpose: 'Convert city/country to coordinates',
      dataProvided: ['latitude', 'longitude'],
    },
    {
      name: 'Timezone API',
      endpoint: 'TimeZoneDB / Google Timezone',
      purpose: 'Get timezone for location',
      dataProvided: ['timezone', 'utc_offset'],
    },
  ],

  systemPrompt: `You are a professional Grid-Connected Solar PV System Designer for residential and small C&I projects.

SYSTEM TYPE: Grid-connected WITHOUT battery storage

STRICT RULES:
1. Collect ALL required inputs before calculating
2. For location: First ask for coordinates, only ask city/country if user doesn't have coordinates
3. Use NREL PVWatts API for all solar irradiance data
4. Calculate TWO capacities: consumption-based (PV_wp1) and space-based (PV_wp2)
5. Select the LOWER of the two capacities as final
6. If space-constrained (PV_wp1 > PV_wp2), inform the user

INVERTER SELECTION RULES:
- DC/AC ratio MUST be between 0.9 and 1.25
- PRIORITIZE ratio > 1.0 (greater than 1 preferred)
- Select MINIMUM number of inverters
- Example: For 120kWp with [33,40,50,100,125]kW options → 1×100kW (ratio=1.2)

TILT CALCULATION:
- Latitude ≤ 25°: Tilt = |Latitude| - 2°
- Latitude > 25°: Tilt = 25° (fixed)

AZIMUTH CALCULATION:
- Northern Hemisphere (Lat ≥ 0): Azimuth = 180° (South-facing)
- Southern Hemisphere (Lat < 0): Azimuth = 0° (North-facing)

SYSTEM LOSSES:
- Partial Shading: 14.5% total system loss
- Shade Free: 12.0% total system loss

OUTPUT FORMAT:
1. Monthly Performance Table (12 months + annual)
2. System Configuration Summary
3. Annual Performance Summary
4. Major Installation Items List`,

  outputTemplate: `## System Configuration Summary

| Parameter | Value | Unit |
|-----------|-------|------|
| Location | [LAT], [LON] | ° |
| Timezone | [TZ] | - |
| PV Array Capacity | [CAPACITY] | kWp |
| Number of Modules | [COUNT] | pcs (600Wp) |
| Panel Manufacturer | [PANEL_MFR] | - |
| Inverter Configuration | [QTY] × [MODEL] | - |
| Inverter Manufacturer | [INV_MFR] | - |
| Total Inverter AC Capacity | [INV_AC] | kW |
| DC/AC Ratio | [RATIO] | - |
| Tilt Angle | [TILT] | ° |
| Azimuth | [AZIMUTH] | ° |
| Installation Type | [TYPE] | - |
| System AC Voltage | [VOLTAGE] | V |
| Ground Coverage Ratio | 0.45 | - |
| System Losses | [LOSS] | % |

## Monthly Performance Data

| Month | Solar Rad (kWh/m²/day) | POA (kWh/m²) | DC Output (kWh) | AC Output (kWh) | PR (%) |
|-------|------------------------|--------------|-----------------|-----------------|--------|
| Jan | [VALUE] | [VALUE] | [VALUE] | [VALUE] | [VALUE] |
| Feb | [VALUE] | [VALUE] | [VALUE] | [VALUE] | [VALUE] |
| Mar | [VALUE] | [VALUE] | [VALUE] | [VALUE] | [VALUE] |
| Apr | [VALUE] | [VALUE] | [VALUE] | [VALUE] | [VALUE] |
| May | [VALUE] | [VALUE] | [VALUE] | [VALUE] | [VALUE] |
| Jun | [VALUE] | [VALUE] | [VALUE] | [VALUE] | [VALUE] |
| Jul | [VALUE] | [VALUE] | [VALUE] | [VALUE] | [VALUE] |
| Aug | [VALUE] | [VALUE] | [VALUE] | [VALUE] | [VALUE] |
| Sep | [VALUE] | [VALUE] | [VALUE] | [VALUE] | [VALUE] |
| Oct | [VALUE] | [VALUE] | [VALUE] | [VALUE] | [VALUE] |
| Nov | [VALUE] | [VALUE] | [VALUE] | [VALUE] | [VALUE] |
| Dec | [VALUE] | [VALUE] | [VALUE] | [VALUE] | [VALUE] |
| **Annual** | [AVG] | [TOTAL] | [TOTAL] | [TOTAL] | [AVG] |

## Annual Performance Summary

| Metric | Value | Unit |
|--------|-------|------|
| Annual AC Energy Yield | [VALUE] | kWh |
| Specific Yield | [VALUE] | kWh/kWp |
| Average Annual PR | [VALUE] | % |
| Capacity Factor | [VALUE] | % |

## Major Installation Items

| S.No | Item | Specification | Quantity | Unit |
|------|------|---------------|----------|------|
| 1 | Solar PV Modules | [MFR] 600Wp | [COUNT] | pcs |
| 2 | Grid-Tie Inverter | [MODEL] [kW] | [QTY] | nos |
| 3 | Module Mounting Structure | [TYPE] | [AREA] | m² |
| 4 | DC Cables (String) | 4mm² Solar DC | [LEN] | m |
| 5 | DC Cables (Main) | [SIZE]mm² | [LEN] | m |
| 6 | AC Cables | [SIZE]mm² 3C+E | [LEN] | m |
| 7 | DC Combiner Box | [STR] input | [QTY] | nos |
| 8 | AC Distribution Board | [RATING]A | 1 | nos |
| 9 | Earthing System | GI/Cu | 1 | set |
| 10 | Lightning Arrester | Class II SPD | [QTY] | nos |
| 11 | Energy Meter | Bi-directional | 1 | nos |
| 12 | Monitoring System | WiFi/LAN | 1 | set |`,
};

export class PVSizingTaskHandler extends BaseTaskHandler {
  constructor() {
    super(PV_SIZING_CONFIG);
  }

  /**
   * Calculate tilt angle based on latitude
   */
  calculateTilt(latitude: number): number {
    const absLat = Math.abs(latitude);
    if (absLat <= 25) {
      return Math.max(0, absLat - 2);
    }
    return 25; // Fixed at 25° for latitudes > 25°
  }

  /**
   * Calculate azimuth based on hemisphere
   */
  calculateAzimuth(latitude: number): number {
    return latitude >= 0 ? 180 : 0; // South for North, North for South
  }

  /**
   * Get system loss based on shading condition
   */
  getSystemLoss(shadingCondition: string): number {
    return shadingCondition === 'partial' ? 14.5 : 12.0;
  }

  /**
   * Get shading loss based on condition
   */
  getShadingLoss(shadingCondition: string): number {
    return shadingCondition === 'partial' ? 3.0 : 0.5;
  }

  /**
   * Select optimal inverter configuration
   * Rules: DC/AC ratio 0.9-1.25, prefer > 1.0, minimum quantity
   */
  selectInverter(
    pvCapacityKw: number,
    availableInverters: Array<{ model: string; ac_capacity_kw: number }>
  ): {
    model: string;
    quantity: number;
    acCapacityEach: number;
    totalAcCapacity: number;
    dcAcRatio: number;
  } | null {
    let bestConfig: ReturnType<typeof this.selectInverter> = null;
    let bestScore = Infinity;

    // Sort by AC capacity descending
    const sortedInverters = [...availableInverters].sort(
      (a, b) => b.ac_capacity_kw - a.ac_capacity_kw
    );

    for (const inverter of sortedInverters) {
      const acCapacity = inverter.ac_capacity_kw;

      // Try different quantities (1 to 20)
      for (let qty = 1; qty <= 20; qty++) {
        const totalAc = acCapacity * qty;
        const dcAcRatio = pvCapacityKw / totalAc;

        // Check if within acceptable range (0.9 to 1.25)
        if (dcAcRatio >= SYSTEM_DEFAULTS.dcAcRatioMin && dcAcRatio <= SYSTEM_DEFAULTS.dcAcRatioMax) {
          // Calculate score (lower is better)
          // Priority: 1) fewer inverters, 2) ratio >= 1.0
          let score: number;
          if (dcAcRatio >= SYSTEM_DEFAULTS.dcAcRatioPreferred) {
            // Preferred: ratio >= 1.0
            score = qty * 10 + (SYSTEM_DEFAULTS.dcAcRatioMax - dcAcRatio);
          } else {
            // Less preferred: ratio < 1.0 (add penalty)
            score = qty * 10 + 100 + (SYSTEM_DEFAULTS.dcAcRatioPreferred - dcAcRatio);
          }

          if (score < bestScore) {
            bestScore = score;
            bestConfig = {
              model: inverter.model,
              quantity: qty,
              acCapacityEach: acCapacity,
              totalAcCapacity: totalAc,
              dcAcRatio: parseFloat(dcAcRatio.toFixed(3)),
            };
          }
        }
      }
    }

    return bestConfig;
  }

  /**
   * Calculate PV capacity - Method 1: Consumption-based
   */
  calculateCapacityFromConsumption(
    dailyConsumption: number,
    dailySolarIrradiation: number,
    performanceRatio: number = SYSTEM_DEFAULTS.performanceRatio
  ): number {
    // PV_wp1 = E_comp / (E_sol × PR)
    return dailyConsumption / (dailySolarIrradiation * performanceRatio);
  }

  /**
   * Calculate PV capacity - Method 2: Space-based
   */
  calculateCapacityFromSpace(
    availableSpace: number,
    moduleArea: number,
    moduleWattage: number = SYSTEM_DEFAULTS.moduleWattage
  ): number {
    // PV_wp2 = (St × GCR / Sp) × Pmodule
    const numModules = (availableSpace * SYSTEM_DEFAULTS.gcr) / moduleArea;
    return numModules * (moduleWattage / 1000);
  }

  /**
   * Calculate number of modules
   */
  calculateModuleCount(capacityKw: number, moduleWattage: number = SYSTEM_DEFAULTS.moduleWattage): number {
    return Math.ceil((capacityKw * 1000) / moduleWattage);
  }

  /**
   * Calculate monthly Performance Ratio
   */
  calculateMonthlyPR(
    acOutput: number,
    poaIrradiance: number,
    systemCapacity: number
  ): number {
    if (poaIrradiance === 0 || systemCapacity === 0) return 0;
    return (acOutput / (poaIrradiance * systemCapacity)) * 100;
  }

  /**
   * Main calculation function
   */
  calculate(inputs: ParsedInputs): TaskCalculationResult {
    // Extract inputs
    const dailyConsumption = inputs.dailyDaytimeConsumption as number;
    const availableSpace = inputs.availableSpace as number;
    const latitude = inputs.latitude as number;
    const longitude = inputs.longitude as number;
    const shadingCondition = (inputs.shadingCondition as string) || 'shade_free';
    const installationType = parseInt(inputs.installationType as string) || 1;
    const systemACVoltage = parseInt(inputs.systemACVoltage as string) || 400;
    const panelManufacturer = inputs.panelManufacturer as string;
    const inverterManufacturer = inputs.inverterManufacturer as string;

    // Default module area for 600Wp panel (approx 2.8 m²)
    const moduleArea = 2.8; // m²
    const moduleWattage = SYSTEM_DEFAULTS.moduleWattage;

    // Calculate tilt and azimuth
    const tilt = this.calculateTilt(latitude);
    const azimuth = this.calculateAzimuth(latitude);

    // Get system loss
    const systemLoss = this.getSystemLoss(shadingCondition);

    // For demonstration, use estimated solar irradiation
    // In production, this would come from PVWatts API
    const estimatedSolarIrradiation = 5.0; // kWh/m²/day (placeholder)

    // Calculate capacity - Method 1: Consumption-based
    const pvCapacity1 = this.calculateCapacityFromConsumption(
      dailyConsumption,
      estimatedSolarIrradiation
    );

    // Calculate capacity - Method 2: Space-based
    const pvCapacity2 = this.calculateCapacityFromSpace(
      availableSpace,
      moduleArea,
      moduleWattage
    );

    // Determine final capacity
    const isSpaceConstrained = pvCapacity1 > pvCapacity2;
    const finalCapacity = isSpaceConstrained ? pvCapacity2 : pvCapacity1;
    const roundedCapacity = parseFloat(finalCapacity.toFixed(2));

    // Calculate number of modules
    const numModules = this.calculateModuleCount(roundedCapacity, moduleWattage);
    const actualCapacity = (numModules * moduleWattage) / 1000;

    // Mock inverter selection (in production, fetch from DB)
    const mockInverters = [
      { model: '33kW', ac_capacity_kw: 33 },
      { model: '40kW', ac_capacity_kw: 40 },
      { model: '50kW', ac_capacity_kw: 50 },
      { model: '100kW', ac_capacity_kw: 100 },
      { model: '125kW', ac_capacity_kw: 125 },
    ];

    const inverterConfig = this.selectInverter(actualCapacity, mockInverters);

    // Estimated annual production (simplified)
    const annualProduction = actualCapacity * estimatedSolarIrradiation * 365 * SYSTEM_DEFAULTS.performanceRatio * (1 - systemLoss / 100);
    const specificYield = annualProduction / actualCapacity;
    const capacityFactor = (annualProduction / (actualCapacity * 8760)) * 100;

    // Build calculations log
    const calculations = [
      `Tilt Angle = ${Math.abs(latitude) <= 25 ? `|${latitude}°| - 2°` : '25° (fixed)'} = ${tilt}°`,
      `Azimuth = ${latitude >= 0 ? '180° (South-facing)' : '0° (North-facing)'} = ${azimuth}°`,
      `System Loss = ${systemLoss}% (${shadingCondition === 'partial' ? 'Partial Shading' : 'Shade Free'})`,
      '',
      `--- Capacity Calculation ---`,
      `Method 1 (Consumption-based):`,
      `  PV_wp1 = ${dailyConsumption} / (${estimatedSolarIrradiation} × 0.80) = ${pvCapacity1.toFixed(2)} kWp`,
      '',
      `Method 2 (Space-based):`,
      `  PV_wp2 = (${availableSpace} × 0.45 / ${moduleArea}) × ${moduleWattage/1000} = ${pvCapacity2.toFixed(2)} kWp`,
      '',
      `Final Capacity = MIN(${pvCapacity1.toFixed(2)}, ${pvCapacity2.toFixed(2)}) = ${roundedCapacity} kWp`,
      isSpaceConstrained ? `⚠️ Space-constrained: Maximum capacity limited by available area` : `✓ Consumption-based sizing selected`,
      '',
      `Number of Modules = ${roundedCapacity} × 1000 / ${moduleWattage} = ${numModules} pcs`,
      `Actual Capacity = ${numModules} × ${moduleWattage} / 1000 = ${actualCapacity} kWp`,
    ];

    if (inverterConfig) {
      calculations.push(
        '',
        `--- Inverter Selection ---`,
        `Selected: ${inverterConfig.quantity}× ${inverterConfig.model}`,
        `Total AC Capacity = ${inverterConfig.totalAcCapacity} kW`,
        `DC/AC Ratio = ${actualCapacity} / ${inverterConfig.totalAcCapacity} = ${inverterConfig.dcAcRatio}`,
        inverterConfig.dcAcRatio >= 1.0 ? `✓ DC/AC ratio ≥ 1.0 (preferred)` : `Note: DC/AC ratio < 1.0`
      );
    }

    const assumptions = [
      `Performance Ratio: 80% (IEC 61724)`,
      `Ground Coverage Ratio: 0.45`,
      `Module Wattage: ${moduleWattage}Wp`,
      `Module Area: ${moduleArea} m²`,
      `Module Efficiency: ${SYSTEM_DEFAULTS.moduleEfficiency * 100}%`,
      `Inverter Efficiency: ${SYSTEM_DEFAULTS.inverterEfficiency * 100}%`,
      `Solar Irradiation: ${estimatedSolarIrradiation} kWh/m²/day (estimate - actual from PVWatts API)`,
    ];

    const insights = [
      `System capacity of ${actualCapacity} kWp requires ${numModules} modules of ${moduleWattage}Wp`,
      `Estimated annual production: ${annualProduction.toFixed(0)} kWh (${specificYield.toFixed(0)} kWh/kWp)`,
      isSpaceConstrained
        ? `Due to space constraint (${availableSpace} m²), maximum capacity is ${pvCapacity2.toFixed(2)} kWp`
        : `Available space (${availableSpace} m²) is sufficient for the design capacity`,
    ];

    const warnings = [];
    if (isSpaceConstrained) {
      warnings.push(`Space-constrained design: Consumption-based capacity (${pvCapacity1.toFixed(2)} kWp) exceeds space-based limit (${pvCapacity2.toFixed(2)} kWp)`);
    }
    if (inverterConfig && inverterConfig.dcAcRatio < 1.0) {
      warnings.push(`DC/AC ratio (${inverterConfig.dcAcRatio}) is below 1.0. Consider higher capacity inverter.`);
    }

    return {
      success: true,
      inputs,
      outputs: {
        // Location
        latitude,
        longitude,
        tilt,
        azimuth,
        timezone: 'UTC', // Would be fetched from API
        
        // Capacity
        pvCapacity1: parseFloat(pvCapacity1.toFixed(2)),
        pvCapacity2: parseFloat(pvCapacity2.toFixed(2)),
        finalCapacity: actualCapacity,
        isSpaceConstrained,
        numModules,
        moduleWattage,
        
        // Inverter
        inverterConfig,
        dcAcRatio: inverterConfig?.dcAcRatio || 0,
        
        // System parameters
        systemLoss,
        installationType,
        systemACVoltage,
        panelManufacturer,
        inverterManufacturer,
        
        // Production estimates
        annualProduction: parseFloat(annualProduction.toFixed(0)),
        specificYield: parseFloat(specificYield.toFixed(0)),
        capacityFactor: parseFloat(capacityFactor.toFixed(1)),
        averagePR: SYSTEM_DEFAULTS.performanceRatio * 100,
        
        // Installation area
        requiredArea: parseFloat((numModules * moduleArea / SYSTEM_DEFAULTS.gcr).toFixed(1)),
        availableSpace,
      },
      calculations,
      assumptions,
      insights,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Fetch available panel manufacturers from database
   */
  async getAvailablePanelManufacturers(): Promise<string[]> {
    try {
      return await fetchPanelManufacturers();
    } catch (error) {
      console.error('Failed to fetch panel manufacturers:', error);
      return [];
    }
  }

  /**
   * Fetch available inverter manufacturers from database
   */
  async getAvailableInverterManufacturers(): Promise<string[]> {
    try {
      return await fetchInverterManufacturers();
    } catch (error) {
      console.error('Failed to fetch inverter manufacturers:', error);
      return [];
    }
  }

  /**
   * LIVE API Calculation - Uses PVWatts API and Supabase data
   * This is the main async calculation method for production use
   */
  async calculateWithAPI(inputs: ParsedInputs): Promise<{
    success: boolean;
    result?: any;
    error?: string;
  }> {
    try {
      // Extract inputs
      const dailyConsumption = inputs.dailyDaytimeConsumption as number;
      const availableSpace = inputs.availableSpace as number;
      const latitude = inputs.latitude as number;
      const longitude = inputs.longitude as number;
      const shadingCondition = (inputs.shadingCondition as 'partial' | 'shade_free') || 'shade_free';
      const arrayType = parseInt(inputs.installationType as string) as ArrayType || 1;
      const systemACVoltage = parseInt(inputs.systemACVoltage as string) || 400;
      const panelManufacturer = inputs.panelManufacturer as string;
      const inverterManufacturer = inputs.inverterManufacturer as string;

      console.log('Starting PV System Design calculation with inputs:', {
        dailyConsumption, availableSpace, latitude, longitude,
        shadingCondition, arrayType, panelManufacturer, inverterManufacturer
      });

      // Step 1: Fetch panel specifications from database
      const panel = await fetchPanelForDesign(panelManufacturer, 600);
      if (!panel) {
        return { success: false, error: `No 600Wp panel found for manufacturer: ${panelManufacturer}` };
      }
      const panelSummary = getPanelSummary(panel);
      const moduleArea = getModuleArea(panel);
      const moduleWattage = panel.nominal_power_w || 600;
      console.log('Panel selected:', panelSummary);

      // Step 2: Calculate tilt and azimuth
      const tilt = calculateOptimalTilt(latitude);
      const azimuth = calculateOptimalAzimuth(latitude);
      const systemLoss = getSystemLosses(shadingCondition);
      console.log('Calculated angles:', { tilt, azimuth, systemLoss });

      // Step 3: Fetch solar irradiance from PVWatts API (using 1kW for baseline)
      console.log('Fetching solar irradiance from PVWatts API...');
      const solarData = await fetchSolarIrradiance(latitude, longitude, arrayType, shadingCondition);
      const dailySolrad = solarData.dailySolrad;
      console.log('Solar irradiance fetched:', { dailySolrad, annualSolrad: solarData.annualSolrad });

      // Step 4: Calculate PV Capacity - Method 1 (Consumption-based)
      const pvCapacity1 = this.calculateCapacityFromConsumption(dailyConsumption, dailySolrad);
      console.log('Consumption-based capacity (PV_wp1):', pvCapacity1.toFixed(2), 'kWp');

      // Step 5: Calculate PV Capacity - Method 2 (Space-based)
      const pvCapacity2 = this.calculateCapacityFromSpace(availableSpace, moduleArea, moduleWattage);
      console.log('Space-based capacity (PV_wp2):', pvCapacity2.toFixed(2), 'kWp');

      // Step 6: Determine final capacity
      const isSpaceConstrained = pvCapacity1 > pvCapacity2;
      const finalCapacity = isSpaceConstrained ? pvCapacity2 : pvCapacity1;
      const roundedCapacity = parseFloat(finalCapacity.toFixed(2));
      console.log('Final capacity:', roundedCapacity, 'kWp', isSpaceConstrained ? '(space constrained)' : '');

      // Step 7: Calculate number of modules
      const numModules = this.calculateModuleCount(roundedCapacity, moduleWattage);
      const actualCapacity = (numModules * moduleWattage) / 1000;
      console.log('Modules:', numModules, 'Actual capacity:', actualCapacity, 'kWp');

      // Step 8: Select optimal inverter from database
      console.log('Selecting inverter from manufacturer:', inverterManufacturer);
      const inverterSelection = await selectOptimalInverter(inverterManufacturer, actualCapacity);
      if (!inverterSelection) {
        return { success: false, error: `No suitable inverter found for ${actualCapacity}kWp from: ${inverterManufacturer}` };
      }
      const inverterSummary = getInverterSummary(inverterSelection.inverter);
      console.log('Inverter selected:', {
        model: inverterSelection.inverter.model,
        quantity: inverterSelection.quantity,
        dcAcRatio: inverterSelection.dcAcRatio
      });

      // Step 9: Run full PVWatts simulation with actual capacity
      console.log('Running PVWatts simulation for', actualCapacity, 'kWp system...');
      const simulation = await simulatePVSystem({
        systemCapacity: actualCapacity,
        latitude,
        longitude,
        tilt,
        azimuth,
        arrayType,
        shadingCondition,
        dcAcRatio: inverterSelection.dcAcRatio,
        inverterEfficiency: inverterSummary.efficiency,
        gcr: SYSTEM_DEFAULTS.gcr,
        bifaciality: panelSummary.bifaciality || SYSTEM_DEFAULTS.bifacialityFactor,
      });
      console.log('Simulation complete. Annual production:', simulation.annualSummary.annualAcOutput, 'kWh');

      // Step 10: Build installation items list
      const installationItems = this.generateInstallationItems({
        numModules,
        moduleWattage,
        panelManufacturer: panelSummary.manufacturer,
        panelModel: panelSummary.model,
        inverterModel: inverterSelection.inverter.model,
        inverterQuantity: inverterSelection.quantity,
        inverterCapacity: inverterSelection.inverter.nominal_ac_power_kw,
        installationType: INSTALLATION_TYPES[Object.keys(INSTALLATION_TYPES)[arrayType] as keyof typeof INSTALLATION_TYPES]?.label || 'Fixed',
        systemCapacity: actualCapacity,
        systemACVoltage,
      });

      // Return complete result
      return {
        success: true,
        result: {
          // Location
          latitude,
          longitude,
          timezone: simulation.stationInfo.tz,
          city: simulation.stationInfo.city,
          state: simulation.stationInfo.state,
          
          // Calculated angles
          tilt,
          azimuth,
          
          // Capacity calculations
          pvCapacity1: parseFloat(pvCapacity1.toFixed(2)),
          pvCapacity2: parseFloat(pvCapacity2.toFixed(2)),
          finalCapacity: actualCapacity,
          isSpaceConstrained,
          numModules,
          moduleWattage,
          
          // Panel details
          panel: panelSummary,
          
          // Inverter details
          inverter: {
            manufacturer: inverterManufacturer,
            model: inverterSelection.inverter.model,
            quantity: inverterSelection.quantity,
            acCapacityEach: inverterSelection.inverter.nominal_ac_power_kw,
            totalAcCapacity: inverterSelection.totalAcCapacity,
            dcAcRatio: inverterSelection.dcAcRatio,
          },
          
          // System parameters
          systemLoss,
          installationType: arrayType,
          installationTypeLabel: INSTALLATION_TYPES[Object.keys(INSTALLATION_TYPES)[arrayType] as keyof typeof INSTALLATION_TYPES]?.label || 'Fixed',
          systemACVoltage,
          gcr: SYSTEM_DEFAULTS.gcr,
          
          // Monthly performance data
          monthlyData: simulation.monthlyData,
          
          // Annual summary
          annualSummary: simulation.annualSummary,
          
          // Station info from PVWatts
          stationInfo: simulation.stationInfo,
          
          // Installation items
          installationItems,
          
          // Area calculations
          requiredArea: parseFloat((numModules * moduleArea / SYSTEM_DEFAULTS.gcr).toFixed(1)),
          availableSpace,
        },
      };
    } catch (error) {
      console.error('PV Sizing calculation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate installation items list (BOM)
   */
  generateInstallationItems(params: {
    numModules: number;
    moduleWattage: number;
    panelManufacturer: string;
    panelModel: string;
    inverterModel: string;
    inverterQuantity: number;
    inverterCapacity: number;
    installationType: string;
    systemCapacity: number;
    systemACVoltage: number;
  }): Array<{ sno: number; item: string; specification: string; quantity: number | string; unit: string }> {
    const { numModules, moduleWattage, panelManufacturer, panelModel,
            inverterModel, inverterQuantity, inverterCapacity,
            installationType, systemCapacity, systemACVoltage } = params;
    
    // Estimate cable lengths based on system size
    const estimatedStringCableLength = Math.ceil(numModules * 3); // ~3m per module
    const estimatedMainDCCable = Math.ceil(systemCapacity * 2);   // ~2m per kWp
    const estimatedACCable = 30; // typical
    
    // Estimate number of strings (assuming 15-20 modules per string)
    const modulesPerString = 18;
    const numStrings = Math.ceil(numModules / modulesPerString);
    
    // AC current rating
    const acCurrent = Math.ceil((systemCapacity * 1000) / (systemACVoltage * Math.sqrt(3)));

    return [
      { sno: 1, item: 'Solar PV Modules', specification: `${panelManufacturer} ${panelModel} ${moduleWattage}Wp`, quantity: numModules, unit: 'pcs' },
      { sno: 2, item: 'Grid-Tie Inverter', specification: `${inverterModel} ${inverterCapacity}kW`, quantity: inverterQuantity, unit: 'nos' },
      { sno: 3, item: 'Module Mounting Structure', specification: installationType, quantity: `${Math.ceil(systemCapacity * 7)}`, unit: 'm²' },
      { sno: 4, item: 'DC Cables (String)', specification: '4mm² Solar DC Cable', quantity: estimatedStringCableLength, unit: 'm' },
      { sno: 5, item: 'DC Cables (Main)', specification: `${systemCapacity > 50 ? '16' : '10'}mm² DC Cable`, quantity: estimatedMainDCCable, unit: 'm' },
      { sno: 6, item: 'AC Cables', specification: `${systemCapacity > 50 ? '70' : '25'}mm² 3C+E`, quantity: estimatedACCable, unit: 'm' },
      { sno: 7, item: 'DC Combiner Box', specification: `${Math.min(numStrings, 8)} String Input`, quantity: Math.ceil(numStrings / 8), unit: 'nos' },
      { sno: 8, item: 'AC Distribution Board', specification: `${acCurrent * 1.25}A rated`, quantity: 1, unit: 'nos' },
      { sno: 9, item: 'Earthing System', specification: 'GI/Cu as per design', quantity: 1, unit: 'set' },
      { sno: 10, item: 'Lightning Arrester', specification: 'Class II SPD', quantity: inverterQuantity + 1, unit: 'nos' },
      { sno: 11, item: 'Energy Meter', specification: 'Bi-directional Net Meter', quantity: 1, unit: 'nos' },
      { sno: 12, item: 'Monitoring System', specification: 'WiFi/LAN enabled', quantity: 1, unit: 'set' },
    ];
  }

  /**
   * Build the calculation prompt for AI - enforces step-by-step conversation
   */
  buildCalculationPrompt(userContext: string): string {
    return `${this.config.systemPrompt}

CRITICAL: YOU MUST ASK ONE QUESTION AT A TIME. DO NOT LIST ALL INPUTS AT ONCE.

=== CONVERSATION STATE ===
Analyze what data has been collected so far:
${userContext}

=== NEXT QUESTION LOGIC ===
Based on collected data, determine which question to ask next:

1. IF dailyDaytimeConsumption NOT collected:
   Ask: "Do you have your Daily Average Day-time Electricity Consumption value (in kWh)? This is your energy usage from 6:00 AM to 6:00 PM."
   
   - If user says YES with value: Ask if they want to provide hourly breakdown
   - If user says NO: Proceed to location (will use space-based sizing only)

2. IF location NOT collected:
   Ask: "Please provide your installation location coordinates (Latitude, Longitude). If you don't have coordinates, type 'NO' and I'll ask for your city and country."

3. IF availableSpace NOT collected:
   Ask: "What is the available space for solar PV installation? (in square meters, m²)"

4. IF shadingCondition NOT collected:
   Ask: "How much of the installation area is shaded? Please select:
   **1.** Partially shaded (approximately 10% of the area)
   **2.** No shades at all (fully shade-free)
   Reply with 1 or 2."

5. IF installationType NOT collected:
   Ask: "What type of mounting structure will you use? Select one:
   **1.** Open Rack (Ground Mounted)
   **2.** Fixed - Roof Mounted
   **3.** 1-Axis Tracker
   **4.** 1-Axis Backtracking
   **5.** 2-Axis Tracker
   Reply with 1, 2, 3, 4, or 5."

6. IF panelManufacturer NOT collected:
   Ask: "Please select a solar panel manufacturer:
   **1.** LONGi Solar
   **2.** JinkoSolar
   **3.** Trina Solar
   I'll use a 600Wp module from your selected manufacturer. Reply with 1, 2, or 3."

7. IF inverterManufacturer NOT collected:
   Ask: "Please select an inverter manufacturer:
   **1.** Sungrow
   **2.** Huawei
   **3.** Growatt
   Reply with 1, 2, or 3."

8. IF systemACVoltage NOT collected:
   Ask: "What is your grid AC voltage? Select:
   **1.** 380V
   **2.** 400V
   **3.** 415V
   **4.** 480V
   Reply with 1, 2, 3, or 4."

9. IF ALL INPUTS COLLECTED:
   Confirm all inputs and proceed to calculation.
   Display results in Canvas.

=== RESPONSE FORMAT ===
- Ask ONLY the next missing question
- Provide clear options when applicable
- Be concise and friendly
- Do NOT explain the entire process
- Do NOT list all remaining questions`;
  }
}

// Export singleton instance
export const pvSizingTask = new PVSizingTaskHandler();
