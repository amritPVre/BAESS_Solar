
export interface PVWattsRequest {
  api_key: string;
  system_capacity: number;
  module_type: number;
  losses: number;
  array_type: number;
  tilt: number;
  azimuth: number;
  lat: number;
  lon: number;
  timeframe: 'hourly' | 'monthly';
  dc_ac_ratio?: number;
  bifaciality?: number;
  albedo?: number;
  gcr?: number;
}

export interface PVWattsResponse {
  inputs: {
    system_capacity: number;
    module_type: number;
    losses: number;
    array_type: number;
    tilt: number;
    azimuth: number;
    lat: number;
    lon: number;
    timeframe: string;
    dc_ac_ratio?: number;
    bifaciality?: number;
    albedo?: number;
    gcr?: number;
  };
  errors: string[];
  warnings: string[];
  version: string;
  station_info: {
    city: string;
    state: string;
    lat: number;
    lon: number;
    elev: number;
    tz: number;
    location: string;
    solar_resource_file: string;
  };
  outputs: {
    // Monthly data (always available)
    ac_monthly: number[];
    poa_monthly: number[];
    solrad_monthly: number[];
    dc_monthly: number[];
    ac_annual: number;
    solrad_annual: number;
    capacity_factor: number;
    
    // Hourly data (available when timeframe = 'hourly')
    ac?: number[];           // 8760 hourly AC system output (kWh)
    dc?: number[];           // 8760 hourly DC system output (kWh)
    poa?: number[];          // 8760 hourly plane-of-array irradiance (W/m²)
    dn?: number[];           // 8760 hourly direct normal irradiance (W/m²)
    df?: number[];           // 8760 hourly diffuse horizontal irradiance (W/m²)
    gh?: number[];           // 8760 hourly global horizontal irradiance (W/m²)
    tamb?: number[];         // 8760 hourly ambient temperature (°C)
    tcell?: number[];        // 8760 hourly cell temperature (°C)
    wspd?: number[];         // 8760 hourly wind speed (m/s)
  };
}
