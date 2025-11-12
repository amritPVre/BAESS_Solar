import { supabase } from '@/integrations/supabase/client';
import type { DCSingleCoreCable, DCCableDeratingFactor } from '@/types/cables';

/**
 * Fetch all DC single core cables from Supabase
 */
export async function getDCSingleCoreCables(material?: 'Copper' | 'Aluminum'): Promise<DCSingleCoreCable[]> {
  try {
    let query = supabase
      .from('dc_single_core_cables')
      .select('*')
      .order('cross_section_mm2', { ascending: true });

    if (material) {
      query = query.eq('material', material);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching DC cables:', error);
    return [];
  }
}

/**
 * Fetch DC cable derating factors
 */
export async function getDCCableDeratingFactors(
  material: 'Copper' | 'Aluminum',
  factorType?: string
): Promise<DCCableDeratingFactor[]> {
  try {
    let query = supabase
      .from('dc_cable_derating_factors')
      .select('*')
      .eq('material', material);

    if (factorType) {
      query = query.eq('factor_type', factorType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching DC derating factors:', error);
    return [];
  }
}

/**
 * Calculate DC cable voltage drop
 * @param current - Design current in Amps
 * @param length - One-way cable length in meters
 * @param resistance - Cable resistance in Ohm/km
 * @param voltage - System voltage in Volts
 * @returns Voltage drop in volts and percentage
 */
export function calculateDCVoltageDrop(
  current: number,
  length: number,
  resistance: number,
  voltage: number
): { voltageDrop: number; voltageDropPercent: number } {
  // For DC, voltage drop = 2 * I * R * L / 1000 (factor of 2 for + and - cables)
  const voltageDrop = 2 * current * resistance * (length / 1000);
  const voltageDropPercent = (voltageDrop / voltage) * 100;

  return {
    voltageDrop: Number(voltageDrop.toFixed(2)),
    voltageDropPercent: Number(voltageDropPercent.toFixed(2))
  };
}

/**
 * Get derating factor for ambient temperature
 */
export function getTemperatureDeratingFactor(
  factors: DCCableDeratingFactor[],
  ambientTemp: number
): number {
  const tempFactors = factors.filter(f => f.factor_type === 'ambient_temp');
  
  // Find closest temperature
  const temps = tempFactors.map(f => parseInt(f.factor_key));
  const closestTemp = temps.reduce((prev, curr) => 
    Math.abs(curr - ambientTemp) < Math.abs(prev - ambientTemp) ? curr : prev
  );

  const factor = tempFactors.find(f => f.factor_key === closestTemp.toString());
  return factor?.factor_value || 1.0;
}

/**
 * Get grouping derating factor
 */
export function getGroupingDeratingFactor(
  factors: DCCableDeratingFactor[],
  numCircuits: number,
  installationType: 'touch' | 'spaced' | 'conduit' = 'touch'
): number {
  const factorTypeMap = {
    touch: 'grouping_air_touch',
    spaced: 'grouping_air_spaced',
    conduit: 'grouping_conduit'
  };

  const groupFactors = factors.filter(f => f.factor_type === factorTypeMap[installationType]);
  
  // Find closest circuit count
  const circuits = groupFactors.map(f => parseInt(f.factor_key));
  const closestCircuit = circuits.reduce((prev, curr) => 
    Math.abs(curr - numCircuits) < Math.abs(prev - numCircuits) ? curr : prev
  );

  const factor = groupFactors.find(f => f.factor_key === closestCircuit.toString());
  return factor?.factor_value || 1.0;
}

/**
 * Calculate derated ampacity
 */
export function calculateDeratedAmpacity(
  baseAmpacity: number,
  temperatureFactor: number,
  groupingFactor: number,
  otherFactors: number = 1.0
): number {
  return baseAmpacity * temperatureFactor * groupingFactor * otherFactors;
}

/**
 * Find suitable DC cable size
 */
export function findSuitableDCCable(
  cables: DCSingleCoreCable[],
  requiredAmpacity: number,
  installationMethod: 'Free Air' | 'Direct Buried'
): DCSingleCoreCable | null {
  const ampacityField = installationMethod === 'Free Air' 
    ? 'free_air_ampacity_a' 
    : 'direct_buried_ampacity_a';

  // Find smallest cable that meets requirement
  const suitableCables = cables.filter(cable => cable[ampacityField] >= requiredAmpacity);
  
  if (suitableCables.length === 0) return null;

  // Return the smallest suitable cable
  return suitableCables.reduce((prev, curr) => 
    curr.cross_section_mm2 < prev.cross_section_mm2 ? curr : prev
  );
}

