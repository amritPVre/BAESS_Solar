// Solar Equipment Service
// Fetches solar panels and inverters from Supabase database

import { supabase } from '@/integrations/supabase/client';

// Solar Panel interface matching database schema
export interface SolarPanel {
  id: string;
  manufacturer: string;
  model: string;
  file_name?: string;
  data_source?: string;
  nominal_power_w: number;
  technology?: string;
  cells_in_series?: number;
  cells_in_parallel?: number;
  maximum_voltage_iec?: number;
  noct_c?: number;
  vmp_v: number;
  imp_a: number;
  voc_v: number;
  isc_a: number;
  current_temp_coeff?: number;
  power_temp_coeff?: number;
  module_length?: number;      // mm
  module_width?: number;       // mm
  module_weight?: number;      // kg
  panel_area_m2?: number;      // m²
  efficiency_percent?: number;
  bifaciality?: number;
  created_at?: string;
  updated_at?: string;
}

// Solar Inverter interface matching database schema
export interface SolarInverter {
  id: string;
  manufacturer: string;
  model: string;
  file_name?: string;
  data_source?: string;
  nominal_ac_power_kw: number;
  maximum_ac_power_kw?: number;
  nominal_ac_current_a?: number;
  maximum_ac_current_a?: number;
  nominal_ac_voltage_v?: number;
  phase?: string;              // 'Single Phase' | '3-Phase'
  frequency_hz?: number;
  power_threshold_w?: number;
  nominal_mpp_voltage_v?: number;
  min_mpp_voltage_v?: number;
  max_dc_voltage_v?: number;
  max_dc_current_a?: number;
  total_string_inputs?: number;
  total_mppt?: number;
  night_consumption_w?: number;
  topology?: string;
  created_at?: string;
  updated_at?: string;
}

// Simplified manufacturer info
export interface ManufacturerInfo {
  manufacturer: string;
  panelCount?: number;
  inverterCount?: number;
}

/**
 * Fetch unique solar panel manufacturers from database
 */
export async function fetchPanelManufacturers(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('solar_panels')
      .select('manufacturer')
      .order('manufacturer');

    if (error) {
      console.error('Error fetching panel manufacturers:', error);
      throw error;
    }

    // Get unique manufacturers
    const uniqueManufacturers = [...new Set(data?.map(p => p.manufacturer) || [])];
    return uniqueManufacturers.filter(m => m != null);
  } catch (error) {
    console.error('Failed to fetch panel manufacturers:', error);
    throw error;
  }
}

/**
 * Fetch unique inverter manufacturers from database
 */
export async function fetchInverterManufacturers(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('solar_inverters')
      .select('manufacturer')
      .order('manufacturer');

    if (error) {
      console.error('Error fetching inverter manufacturers:', error);
      throw error;
    }

    // Get unique manufacturers
    const uniqueManufacturers = [...new Set(data?.map(i => i.manufacturer) || [])];
    return uniqueManufacturers.filter(m => m != null);
  } catch (error) {
    console.error('Failed to fetch inverter manufacturers:', error);
    throw error;
  }
}

/**
 * Fetch panels by manufacturer, optionally filter by wattage
 */
export async function fetchPanelsByManufacturer(
  manufacturer: string,
  targetWattage?: number
): Promise<SolarPanel[]> {
  try {
    let query = supabase
      .from('solar_panels')
      .select('*')
      .eq('manufacturer', manufacturer)
      .order('nominal_power_w', { ascending: false });

    if (targetWattage) {
      // Find panels within ±50W of target
      query = query
        .gte('nominal_power_w', targetWattage - 50)
        .lte('nominal_power_w', targetWattage + 50);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching panels:', error);
      throw error;
    }

    return (data || []) as SolarPanel[];
  } catch (error) {
    console.error('Failed to fetch panels:', error);
    throw error;
  }
}

/**
 * Fetch the closest panel to target wattage (e.g., 600Wp) for a manufacturer
 */
export async function fetchPanelForDesign(
  manufacturer: string,
  targetWattage: number = 600
): Promise<SolarPanel | null> {
  try {
    // First try exact match
    let { data, error } = await supabase
      .from('solar_panels')
      .select('*')
      .eq('manufacturer', manufacturer)
      .eq('nominal_power_w', targetWattage)
      .limit(1)
      .single();

    if (data) {
      return data as SolarPanel;
    }

    // If no exact match, find closest
    const { data: allPanels, error: fetchError } = await supabase
      .from('solar_panels')
      .select('*')
      .eq('manufacturer', manufacturer)
      .order('nominal_power_w', { ascending: false });

    if (fetchError || !allPanels || allPanels.length === 0) {
      console.warn(`No panels found for manufacturer: ${manufacturer}`);
      return null;
    }

    // Find closest to target wattage
    const closest = allPanels.reduce((prev, curr) => {
      const prevDiff = Math.abs((prev.nominal_power_w || 0) - targetWattage);
      const currDiff = Math.abs((curr.nominal_power_w || 0) - targetWattage);
      return currDiff < prevDiff ? curr : prev;
    });

    return closest as SolarPanel;
  } catch (error) {
    console.error('Failed to fetch panel for design:', error);
    throw error;
  }
}

/**
 * Fetch inverters by manufacturer
 */
export async function fetchInvertersByManufacturer(
  manufacturer: string
): Promise<SolarInverter[]> {
  try {
    const { data, error } = await supabase
      .from('solar_inverters')
      .select('*')
      .eq('manufacturer', manufacturer)
      .order('nominal_ac_power_kw', { ascending: true });

    if (error) {
      console.error('Error fetching inverters:', error);
      throw error;
    }

    return (data || []) as SolarInverter[];
  } catch (error) {
    console.error('Failed to fetch inverters:', error);
    throw error;
  }
}

/**
 * Select optimal inverter configuration based on PV capacity
 * Rules:
 * - DC/AC ratio between 0.9 and 1.25
 * - Prefer ratio > 1.0
 * - Minimum number of inverters
 */
export interface InverterSelection {
  inverter: SolarInverter;
  quantity: number;
  totalAcCapacity: number;
  dcAcRatio: number;
  score: number;
}

export async function selectOptimalInverter(
  manufacturer: string,
  pvCapacityKw: number,
  dcAcRatioMin: number = 0.9,
  dcAcRatioMax: number = 1.25,
  dcAcRatioPreferred: number = 1.0
): Promise<InverterSelection | null> {
  try {
    const inverters = await fetchInvertersByManufacturer(manufacturer);
    
    if (inverters.length === 0) {
      console.warn(`No inverters found for manufacturer: ${manufacturer}`);
      return null;
    }

    let bestConfig: InverterSelection | null = null;
    let bestScore = Infinity;

    // Sort by AC capacity descending
    const sortedInverters = [...inverters].sort(
      (a, b) => (b.nominal_ac_power_kw || 0) - (a.nominal_ac_power_kw || 0)
    );

    for (const inverter of sortedInverters) {
      const acCapacity = inverter.nominal_ac_power_kw || 0;
      if (acCapacity <= 0) continue;

      // Try different quantities (1 to 20)
      for (let qty = 1; qty <= 20; qty++) {
        const totalAc = acCapacity * qty;
        const dcAcRatio = pvCapacityKw / totalAc;

        // Check if within acceptable range
        if (dcAcRatio >= dcAcRatioMin && dcAcRatio <= dcAcRatioMax) {
          // Calculate score (lower is better)
          // Priority: 1) fewer inverters, 2) ratio >= 1.0
          let score: number;
          if (dcAcRatio >= dcAcRatioPreferred) {
            // Preferred: ratio >= 1.0
            score = qty * 10 + (dcAcRatioMax - dcAcRatio);
          } else {
            // Less preferred: ratio < 1.0 (add penalty)
            score = qty * 10 + 100 + (dcAcRatioPreferred - dcAcRatio);
          }

          if (score < bestScore) {
            bestScore = score;
            bestConfig = {
              inverter,
              quantity: qty,
              totalAcCapacity: totalAc,
              dcAcRatio: parseFloat(dcAcRatio.toFixed(3)),
              score,
            };
          }
        }
      }
    }

    return bestConfig;
  } catch (error) {
    console.error('Failed to select optimal inverter:', error);
    throw error;
  }
}

/**
 * Get all available inverter capacities for a manufacturer
 */
export async function getAvailableInverterCapacities(
  manufacturer: string
): Promise<number[]> {
  try {
    const inverters = await fetchInvertersByManufacturer(manufacturer);
    const capacities = inverters
      .map(inv => inv.nominal_ac_power_kw || 0)
      .filter(cap => cap > 0);
    
    // Return unique sorted capacities
    return [...new Set(capacities)].sort((a, b) => a - b);
  } catch (error) {
    console.error('Failed to get inverter capacities:', error);
    throw error;
  }
}

/**
 * Calculate module area from dimensions or use provided value
 */
export function getModuleArea(panel: SolarPanel): number {
  if (panel.panel_area_m2 && panel.panel_area_m2 > 0) {
    return panel.panel_area_m2;
  }
  
  // Calculate from length × width (mm to m²)
  if (panel.module_length && panel.module_width) {
    return (panel.module_length / 1000) * (panel.module_width / 1000);
  }
  
  // Default estimate for 600Wp panel
  return 2.8;
}

/**
 * Get panel specifications summary
 */
export interface PanelSummary {
  manufacturer: string;
  model: string;
  wattage: number;
  efficiency: number;
  area: number;
  voc: number;
  vmp: number;
  isc: number;
  imp: number;
  bifaciality: number;
}

export function getPanelSummary(panel: SolarPanel): PanelSummary {
  return {
    manufacturer: panel.manufacturer,
    model: panel.model,
    wattage: panel.nominal_power_w || 0,
    efficiency: panel.efficiency_percent || 21,
    area: getModuleArea(panel),
    voc: panel.voc_v || 0,
    vmp: panel.vmp_v || 0,
    isc: panel.isc_a || 0,
    imp: panel.imp_a || 0,
    bifaciality: panel.bifaciality || 0.7,
  };
}

/**
 * Get inverter specifications summary
 */
export interface InverterSummary {
  manufacturer: string;
  model: string;
  acCapacityKw: number;
  maxDcVoltage: number;
  minMpptVoltage: number;
  maxDcCurrent: number;
  mpptCount: number;
  stringInputs: number;
  efficiency: number;
}

export function getInverterSummary(inverter: SolarInverter): InverterSummary {
  return {
    manufacturer: inverter.manufacturer,
    model: inverter.model,
    acCapacityKw: inverter.nominal_ac_power_kw || 0,
    maxDcVoltage: inverter.max_dc_voltage_v || 1000,
    minMpptVoltage: inverter.min_mpp_voltage_v || 200,
    maxDcCurrent: inverter.max_dc_current_a || 0,
    mpptCount: inverter.total_mppt || 1,
    stringInputs: inverter.total_string_inputs || 1,
    efficiency: 97,  // Assume 97% if not specified
  };
}

export default {
  fetchPanelManufacturers,
  fetchInverterManufacturers,
  fetchPanelsByManufacturer,
  fetchPanelForDesign,
  fetchInvertersByManufacturer,
  selectOptimalInverter,
  getAvailableInverterCapacities,
  getModuleArea,
  getPanelSummary,
  getInverterSummary,
};

