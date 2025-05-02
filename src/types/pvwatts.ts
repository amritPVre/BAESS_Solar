
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
    ac_monthly: number[];
    ac?: number[];
    poa_monthly: number[];
    solrad_monthly: number[];
    dc_monthly: number[];
    ac_annual: number;
    solrad_annual: number;
    capacity_factor: number;
  };
}
