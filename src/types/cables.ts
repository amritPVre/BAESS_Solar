// DC Single Core Cable Types
export interface DCSingleCoreCable {
  id: string;
  cross_section_mm2: number;
  material: 'Copper' | 'Aluminum';
  insulation_type: string;
  free_air_ampacity_a: number;
  direct_buried_ampacity_a: number;
  max_conductor_temp_c: number;
  resistance_dc_20c_ohm_per_km: number;
}

export interface DCCableDeratingFactor {
  id: string;
  material: 'Copper' | 'Aluminum';
  factor_type: string;
  factor_key: string;
  factor_value: number;
  description?: string;
}

// AC Multicore Cable Types (from existing lv_cables table)
export interface ACMulticoreCable {
  id: string;
  size_mm2: number;
  cores: number;
  material: 'Copper' | 'Aluminum';
  insulation: string;
  ampacity_clipped_direct: number;
  ampacity_in_conduit: number;
  ampacity_in_buried_conduit: number;
  ampacity_direct_burial: number;
}

// Cable Sizing Parameters
export interface CableSizingParams {
  // DC Cable Parameters
  dc_pv_cable?: {
    design_current: number;
    cable_length: number;
    ambient_temp: number;
    installation_method: 'Free Air' | 'Direct Buried';
    num_circuits: number;
    material: 'Copper' | 'Aluminum';
    selected_cable?: DCSingleCoreCable;
  };
  dc_battery_cable?: {
    design_current: number;
    cable_length: number;
    ambient_temp: number;
    installation_method: 'Free Air' | 'Direct Buried';
    num_circuits: number;
    material: 'Copper' | 'Aluminum';
    selected_cable?: DCSingleCoreCable;
  };
  // AC Cable Parameters
  ac_hybrid_inverter_cable?: {
    design_current: number;
    cable_length: number;
    voltage: number;
    num_cores: 3 | 4;
    material: 'Copper' | 'Aluminum';
    installation_method: string;
    selected_cable?: ACMulticoreCable;
  };
  ac_battery_inverter_cable?: {
    design_current: number;
    cable_length: number;
    voltage: number;
    num_cores: 3 | 4;
    material: 'Copper' | 'Aluminum';
    installation_method: string;
    selected_cable?: ACMulticoreCable;
  };
  ac_pv_inverter_cable?: {
    design_current: number;
    cable_length: number;
    voltage: number;
    num_cores: 3 | 4;
    material: 'Copper' | 'Aluminum';
    installation_method: string;
    selected_cable?: ACMulticoreCable;
  };
}

export interface CableSizingResult {
  required_ampacity: number;
  derated_ampacity: number;
  selected_cable_size: number;
  voltage_drop_percent: number;
  voltage_drop_v: number;
  power_loss_kw: number;
  is_adequate: boolean;
  derating_factors: {
    temperature: number;
    grouping: number;
    total: number;
  };
}

