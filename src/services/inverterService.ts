// =====================================================
// Inverter Service - Fetch inverters from Supabase
// =====================================================

import { supabase } from '@/integrations/supabase/client';
import type { HybridInverter, BatteryInverter, InverterFilters } from '@/types/inverters';

/**
 * Fetch hybrid inverters (DC-coupled systems)
 */
export async function getHybridInverters(filters?: InverterFilters): Promise<HybridInverter[]> {
  try {
    let query = supabase
      .from('hybrid_inverters')
      .select('*')
      .order('rated_ac_capacity_kw', { ascending: true });

    // Apply filters
    if (filters?.application) {
      // Map application type for consistency
      const mappedApp = filters.application === 'Commercial & Industrial' ? 'C&I' : filters.application;
      query = query.eq('application', mappedApp);
    }

    if (filters?.minCapacity) {
      query = query.gte('rated_ac_capacity_kw', filters.minCapacity);
    }

    if (filters?.maxCapacity) {
      query = query.lte('rated_ac_capacity_kw', filters.maxCapacity);
    }

    if (filters?.minBatteryVoltage && filters?.maxBatteryVoltage) {
      query = query
        .lte('battery_voltage_range_min_v', filters.maxBatteryVoltage)
        .gte('battery_voltage_range_max_v', filters.minBatteryVoltage);
    }

    if (filters?.supplier) {
      query = query.eq('supplier', filters.supplier);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching hybrid inverters:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getHybridInverters:', error);
    return [];
  }
}

/**
 * Fetch battery inverters (AC-coupled systems)
 */
export async function getBatteryInverters(filters?: InverterFilters): Promise<BatteryInverter[]> {
  try {
    let query = supabase
      .from('battery_inverters')
      .select('*')
      .order('rated_inverter_ac_capacity_kw', { ascending: true });

    // Apply filters
    if (filters?.application) {
      // Map application type for consistency and handle variations
      let mappedApp = filters.application;
      if (filters.application === 'Commercial & Industrial') {
        mappedApp = 'C&I';
      }
      
      // Handle both "Utility-Scale" and "Utility Scale" formats
      const appFilter = mappedApp === 'Utility Scale' 
        ? ['Utility Scale', 'Utility-Scale']
        : [mappedApp];
      query = query.in('application', appFilter);
    }

    if (filters?.minCapacity) {
      query = query.gte('rated_inverter_ac_capacity_kw', filters.minCapacity);
    }

    if (filters?.maxCapacity) {
      query = query.lte('rated_inverter_ac_capacity_kw', filters.maxCapacity);
    }

    if (filters?.minBatteryVoltage && filters?.maxBatteryVoltage) {
      query = query
        .lte('battery_voltage_min_v', filters.maxBatteryVoltage)
        .gte('battery_voltage_max_v', filters.minBatteryVoltage);
    }

    if (filters?.manufacturer) {
      query = query.eq('manufacturer', filters.manufacturer);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching battery inverters:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getBatteryInverters:', error);
    return [];
  }
}

/**
 * Get unique suppliers for hybrid inverters
 */
export async function getHybridInverterSuppliers(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('hybrid_inverters')
      .select('supplier')
      .order('supplier');

    if (error) throw error;

    const uniqueSuppliers = [...new Set(data?.map(item => item.supplier) || [])];
    return uniqueSuppliers;
  } catch (error) {
    console.error('Error fetching hybrid inverter suppliers:', error);
    return [];
  }
}

/**
 * Get unique manufacturers for battery inverters
 */
export async function getBatteryInverterManufacturers(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('battery_inverters')
      .select('manufacturer')
      .order('manufacturer');

    if (error) throw error;

    const uniqueManufacturers = [...new Set(data?.map(item => item.manufacturer) || [])];
    return uniqueManufacturers;
  } catch (error) {
    console.error('Error fetching battery inverter manufacturers:', error);
    return [];
  }
}

/**
 * Get inverter by ID
 */
export async function getHybridInverterById(id: string): Promise<HybridInverter | null> {
  try {
    const { data, error } = await supabase
      .from('hybrid_inverters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching hybrid inverter by ID:', error);
    return null;
  }
}

export async function getBatteryInverterById(id: string): Promise<BatteryInverter | null> {
  try {
    const { data, error } = await supabase
      .from('battery_inverters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching battery inverter by ID:', error);
    return null;
  }
}

/**
 * Helper function to check if battery voltage is compatible with inverter
 */
export function isBatteryVoltageCompatible(
  batteryVoltage: number,
  inverterMinVoltage: number | null,
  inverterMaxVoltage: number | null
): boolean {
  if (!inverterMinVoltage || !inverterMaxVoltage) return true;
  return batteryVoltage >= inverterMinVoltage && batteryVoltage <= inverterMaxVoltage;
}

/**
 * Recommend inverters based on system requirements
 */
export interface InverterRecommendationParams {
  couplingType: 'DC' | 'AC';
  application: string;
  requiredCapacity: number;
  batteryVoltage?: number;
  pvCapacity?: number;
}

export async function recommendInverters(params: InverterRecommendationParams) {
  const { couplingType, application, requiredCapacity, batteryVoltage, pvCapacity } = params;

  // Add 20% margin for safety
  const minCapacity = requiredCapacity * 0.8;
  const maxCapacity = requiredCapacity * 1.5;

  const filters: InverterFilters = {
    application,
    minCapacity,
    maxCapacity,
  };

  // Add battery voltage filter if provided
  if (batteryVoltage) {
    filters.minBatteryVoltage = batteryVoltage * 0.8;
    filters.maxBatteryVoltage = batteryVoltage * 1.2;
  }

  if (couplingType === 'DC') {
    const inverters = await getHybridInverters(filters);
    
    // Additional filtering for PV capacity if provided
    if (pvCapacity) {
      return inverters.filter(inv => inv.max_pv_capacity_kwp >= pvCapacity);
    }
    
    return inverters;
  } else {
    return await getBatteryInverters(filters);
  }
}

