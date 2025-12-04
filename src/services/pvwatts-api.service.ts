// NREL PVWatts API v8 Service
// Documentation: https://developer.nrel.gov/docs/solar/pvwatts/v8/

const PVWATTS_API_KEY = 'zNZ118S4E62Nm7A4bCiBQO4eDS4Gx3jsYJ0kIjsL';
const PVWATTS_BASE_URL = 'https://developer.nrel.gov/api/pvwatts/v8.json';

// Installation type codes for PVWatts API
export type ArrayType = 0 | 1 | 2 | 3 | 4;
export const ARRAY_TYPE_LABELS: Record<ArrayType, string> = {
  0: 'Fixed - Open Rack',
  1: 'Fixed - Roof Mounted',
  2: '1-Axis',
  3: '1-Axis Backtracking',
  4: '2-Axis',
};

// Module type codes
export type ModuleType = 0 | 1 | 2;
export const MODULE_TYPE_LABELS: Record<ModuleType, string> = {
  0: 'Standard',
  1: 'Premium',
  2: 'Thin Film',
};

// Request parameters for PVWatts API
export interface PVWattsRequest {
  // Required parameters
  system_capacity: number;      // kW, range: 0.05 to 500000
  module_type: ModuleType;      // 0=Standard, 1=Premium, 2=Thin Film
  losses: number;               // %, range: -5 to 99
  array_type: ArrayType;        // 0-4 as defined above
  tilt: number;                 // degrees, 0 to 90
  azimuth: number;              // degrees, 0 to < 360
  
  // Location - required one of: lat/lon OR address
  lat?: number;                 // latitude
  lon?: number;                 // longitude
  address?: string;             // for geocoding (alternative to lat/lon)
  
  // Optional parameters
  dc_ac_ratio?: number;         // default: 1.2
  inv_eff?: number;             // inverter efficiency %, default: 96
  gcr?: number;                 // ground coverage ratio, 0.01-0.99, default: 0.4
  bifaciality?: number;         // bifacial factor, 0-1
  albedo?: number | number[];   // single value or 12 monthly values
  soiling?: number[];           // 12 monthly soiling values
  
  // Dataset selection
  dataset?: 'nsrdb' | 'intl' | 'tmy2' | 'tmy3';
  radius?: number;              // search radius for weather station, default: 100 (miles)
  
  // Timeframe selection (for hourly output)
  timeframe?: 'monthly' | 'hourly';
}

// Station info from response
export interface StationInfo {
  lat: number;
  lon: number;
  elev: number;
  tz: number;                   // timezone offset
  location: string;
  city: string;
  state: string;
  solar_resource_file: string;
  weather_data_source: string;
}

// Monthly output data
export interface PVWattsMonthlyOutputs {
  ac_monthly: number[];         // AC output kWh for each month (12 values)
  poa_monthly: number[];        // Plane of array irradiance kWh/m² for each month
  solrad_monthly: number[];     // Solar radiation kWh/m²/day for each month
  dc_monthly: number[];         // DC output kWh for each month
  ac_annual: number;            // Total annual AC output kWh
  solrad_annual: number;        // Average annual solar radiation kWh/m²/day
  capacity_factor: number;      // Capacity factor %
}

// Full PVWatts response
export interface PVWattsResponse {
  inputs: Record<string, any>;
  errors: string[];
  warnings: string[];
  version: string;
  ssc_info: {
    version: number;
    build: string;
    module: string;
  };
  station_info: StationInfo;
  outputs: PVWattsMonthlyOutputs;
}

// Formatted monthly data for display
export interface MonthlyPVData {
  month: string;
  solrad: number;     // kWh/m²/day
  poa: number;        // kWh/m² (plane of array)
  dcOutput: number;   // kWh
  acOutput: number;   // kWh
  pr: number;         // % (performance ratio)
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Call NREL PVWatts API v8
 */
export async function callPVWattsAPI(params: PVWattsRequest): Promise<PVWattsResponse> {
  // Build query string
  const queryParams = new URLSearchParams({
    api_key: PVWATTS_API_KEY,
    system_capacity: params.system_capacity.toString(),
    module_type: params.module_type.toString(),
    losses: params.losses.toString(),
    array_type: params.array_type.toString(),
    tilt: params.tilt.toString(),
    azimuth: params.azimuth.toString(),
  });

  // Add location
  if (params.lat !== undefined && params.lon !== undefined) {
    queryParams.append('lat', params.lat.toString());
    queryParams.append('lon', params.lon.toString());
  } else if (params.address) {
    queryParams.append('address', params.address);
  } else {
    throw new Error('Either lat/lon or address is required');
  }

  // Add optional parameters
  if (params.dc_ac_ratio !== undefined) {
    queryParams.append('dc_ac_ratio', params.dc_ac_ratio.toString());
  }
  if (params.inv_eff !== undefined) {
    queryParams.append('inv_eff', params.inv_eff.toString());
  }
  if (params.gcr !== undefined) {
    queryParams.append('gcr', params.gcr.toString());
  }
  if (params.bifaciality !== undefined) {
    queryParams.append('bifaciality', params.bifaciality.toString());
  }
  if (params.albedo !== undefined) {
    if (Array.isArray(params.albedo)) {
      queryParams.append('albedo', params.albedo.join('|'));
    } else {
      queryParams.append('albedo', params.albedo.toString());
    }
  }
  if (params.soiling !== undefined) {
    queryParams.append('soiling', params.soiling.join('|'));
  }
  if (params.dataset !== undefined) {
    queryParams.append('dataset', params.dataset);
  }
  if (params.radius !== undefined) {
    queryParams.append('radius', params.radius.toString());
  }
  if (params.timeframe !== undefined) {
    queryParams.append('timeframe', params.timeframe);
  }

  const url = `${PVWATTS_BASE_URL}?${queryParams.toString()}`;
  
  console.log('PVWatts API Request:', url.replace(PVWATTS_API_KEY, '***'));

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`PVWatts API error: ${response.status} ${response.statusText}`);
    }

    const data: PVWattsResponse = await response.json();

    // Check for API errors
    if (data.errors && data.errors.length > 0) {
      throw new Error(`PVWatts API errors: ${data.errors.join(', ')}`);
    }

    return data;
  } catch (error) {
    console.error('PVWatts API call failed:', error);
    throw error;
  }
}

/**
 * Calculate tilt angle based on latitude
 * Rule: |Latitude| - 2° for lat ≤ 25°, else fixed 25°
 */
export function calculateOptimalTilt(latitude: number): number {
  const absLat = Math.abs(latitude);
  if (absLat <= 25) {
    return Math.max(0, absLat - 2);
  }
  return 25;
}

/**
 * Calculate azimuth based on hemisphere
 * Northern hemisphere: 180° (South-facing)
 * Southern hemisphere: 0° (North-facing)
 */
export function calculateOptimalAzimuth(latitude: number): number {
  return latitude >= 0 ? 180 : 0;
}

/**
 * Get system losses based on shading condition
 */
export function getSystemLosses(shadingCondition: 'partial' | 'shade_free'): number {
  return shadingCondition === 'partial' ? 14.5 : 12.0;
}

/**
 * Format PVWatts response to monthly data table
 */
export function formatMonthlyData(
  outputs: PVWattsMonthlyOutputs,
  systemCapacity: number
): MonthlyPVData[] {
  const monthlyData: MonthlyPVData[] = [];

  for (let i = 0; i < 12; i++) {
    const poaMonthly = outputs.poa_monthly[i];
    const acMonthly = outputs.ac_monthly[i];
    
    // Calculate monthly PR: (AC_output) / (POA × Capacity)
    // POA is in kWh/m², we need to normalize by system capacity
    const pr = poaMonthly > 0 && systemCapacity > 0
      ? (acMonthly / (poaMonthly * systemCapacity)) * 100
      : 0;

    monthlyData.push({
      month: MONTH_NAMES[i],
      solrad: parseFloat(outputs.solrad_monthly[i].toFixed(2)),
      poa: parseFloat(poaMonthly.toFixed(2)),
      dcOutput: parseFloat(outputs.dc_monthly[i].toFixed(0)),
      acOutput: parseFloat(acMonthly.toFixed(0)),
      pr: parseFloat(pr.toFixed(1)),
    });
  }

  return monthlyData;
}

/**
 * Calculate annual summary from PVWatts outputs
 */
export function calculateAnnualSummary(
  outputs: PVWattsMonthlyOutputs,
  systemCapacity: number
): {
  annualAcOutput: number;
  annualDcOutput: number;
  annualPoa: number;
  specificYield: number;
  averagePR: number;
  capacityFactor: number;
  averageSolrad: number;
} {
  const annualDcOutput = outputs.dc_monthly.reduce((sum, val) => sum + val, 0);
  const annualPoa = outputs.poa_monthly.reduce((sum, val) => sum + val, 0);
  const specificYield = systemCapacity > 0 ? outputs.ac_annual / systemCapacity : 0;
  const averagePR = annualPoa > 0 && systemCapacity > 0
    ? (outputs.ac_annual / (annualPoa * systemCapacity)) * 100
    : 0;

  return {
    annualAcOutput: parseFloat(outputs.ac_annual.toFixed(0)),
    annualDcOutput: parseFloat(annualDcOutput.toFixed(0)),
    annualPoa: parseFloat(annualPoa.toFixed(2)),
    specificYield: parseFloat(specificYield.toFixed(0)),
    averagePR: parseFloat(averagePR.toFixed(1)),
    capacityFactor: parseFloat(outputs.capacity_factor.toFixed(2)),
    averageSolrad: parseFloat(outputs.solrad_annual.toFixed(2)),
  };
}

/**
 * Quick fetch of solar irradiance for a location (1kW system, default params)
 * Used for initial sizing calculations
 */
export async function fetchSolarIrradiance(
  latitude: number,
  longitude: number,
  arrayType: ArrayType = 1,
  shadingCondition: 'partial' | 'shade_free' = 'shade_free'
): Promise<{
  dailySolrad: number;    // kWh/m²/day average
  annualSolrad: number;   // kWh/m²/year
  monthlyData: MonthlyPVData[];
}> {
  const tilt = calculateOptimalTilt(latitude);
  const azimuth = calculateOptimalAzimuth(latitude);
  const losses = getSystemLosses(shadingCondition);

  const response = await callPVWattsAPI({
    system_capacity: 1,  // 1 kW for normalization
    module_type: 1,      // Premium
    losses: losses,
    array_type: arrayType,
    tilt: tilt,
    azimuth: azimuth,
    lat: latitude,
    lon: longitude,
    gcr: 0.45,
  });

  const monthlyData = formatMonthlyData(response.outputs, 1);
  
  // Calculate annual from daily average
  const annualSolrad = response.outputs.solrad_annual * 365;

  return {
    dailySolrad: response.outputs.solrad_annual,
    annualSolrad: parseFloat(annualSolrad.toFixed(0)),
    monthlyData,
  };
}

/**
 * Full PV system simulation with all parameters
 */
export async function simulatePVSystem(params: {
  systemCapacity: number;
  latitude: number;
  longitude: number;
  tilt?: number;              // Optional, will calculate if not provided
  azimuth?: number;           // Optional, will calculate if not provided
  arrayType: ArrayType;
  shadingCondition: 'partial' | 'shade_free';
  dcAcRatio?: number;
  inverterEfficiency?: number;
  gcr?: number;
  bifaciality?: number;
}): Promise<{
  request: PVWattsRequest;
  response: PVWattsResponse;
  monthlyData: MonthlyPVData[];
  annualSummary: ReturnType<typeof calculateAnnualSummary>;
  stationInfo: StationInfo;
}> {
  const tilt = params.tilt ?? calculateOptimalTilt(params.latitude);
  const azimuth = params.azimuth ?? calculateOptimalAzimuth(params.latitude);
  const losses = getSystemLosses(params.shadingCondition);

  const request: PVWattsRequest = {
    system_capacity: params.systemCapacity,
    module_type: 1,  // Premium (mono-crystalline)
    losses: losses,
    array_type: params.arrayType,
    tilt: tilt,
    azimuth: azimuth,
    lat: params.latitude,
    lon: params.longitude,
    dc_ac_ratio: params.dcAcRatio,
    inv_eff: params.inverterEfficiency ?? 97,
    gcr: params.gcr ?? 0.45,
    bifaciality: params.bifaciality ?? 0.7,
  };

  const response = await callPVWattsAPI(request);
  const monthlyData = formatMonthlyData(response.outputs, params.systemCapacity);
  const annualSummary = calculateAnnualSummary(response.outputs, params.systemCapacity);

  return {
    request,
    response,
    monthlyData,
    annualSummary,
    stationInfo: response.station_info,
  };
}

export default {
  callPVWattsAPI,
  calculateOptimalTilt,
  calculateOptimalAzimuth,
  getSystemLosses,
  formatMonthlyData,
  calculateAnnualSummary,
  fetchSolarIrradiance,
  simulatePVSystem,
  ARRAY_TYPE_LABELS,
  MODULE_TYPE_LABELS,
};

