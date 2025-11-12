// =====================================================
// Inverter Types for BESS Designer
// =====================================================

export interface HybridInverter {
  id: string;
  supplier: string;
  model: string;
  application: 'Residential' | 'C&I' | 'Utility Scale';
  max_pv_capacity_kwp: number;
  max_pv_dc_voltage_v: number;
  mppt_voltage_range_min_v: number | null;
  mppt_voltage_range_max_v: number | null;
  max_pv_dc_input_current_a: number | null;
  battery_voltage_range_min_v: number | null;
  battery_voltage_range_max_v: number | null;
  battery_charge_current_a: number | null;
  battery_discharge_current_a: number | null;
  rated_ac_capacity_kw: number;
  operating_ac_voltage_v: number;
  max_ac_output_current_a: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface BatteryInverter {
  id: string;
  manufacturer: string;
  application: 'Residential' | 'C&I' | 'Utility-Scale' | 'Utility Scale';
  model: string;
  battery_voltage_min_v: number | null;
  battery_voltage_max_v: number | null;
  max_battery_charging_current_a: number | null;
  max_battery_discharging_current_a: number | null;
  operating_ac_voltage_v: number;
  max_ac_output_current_a: number | null;
  rated_inverter_ac_capacity_kw: number;
  created_at?: string;
  updated_at?: string;
}

export interface InverterFilters {
  application?: string;
  minCapacity?: number;
  maxCapacity?: number;
  minBatteryVoltage?: number;
  maxBatteryVoltage?: number;
  supplier?: string;
  manufacturer?: string;
}

export type InverterType = 'hybrid' | 'battery';

