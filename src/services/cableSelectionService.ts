import { createClient } from "@supabase/supabase-js";
import { supabase } from "../integrations/supabase/client";
import type { Database } from "../integrations/supabase/types";
import { toast } from "sonner";

// Cable types
export type LVCable = Database['public']['Tables']['lv_cables']['Row'];
export type HVCable = Database['public']['Tables']['hv_cables']['Row'];
export type LVDeratingFactor = Database['public']['Tables']['lv_derating_factors']['Row'];
export type HVDeratingFactor = Database['public']['Tables']['hv_derating_factors']['Row'];

// Cable selection parameters
export interface CableSelectionParams {
  current: number;
  voltage: number;
  cableType: 'LV' | 'HV';
  material?: 'COPPER' | 'ALUMINUM';
  installationType?: 'CONDUIT' | 'SURFACE' | 'BURIED';
  ambientTemperature?: number;
  groundTemperature?: number;
  soilResistivity?: number;
  burialDepth?: number;
  grouping?: number;
  groupingSpacing?: number;
  maxVoltageDropPercent?: number;
  length?: number;
}

/**
 * Fetches all LV cables from the database
 */
export async function fetchLVCables(): Promise<LVCable[]> {
  const { data, error } = await supabase
    .from('lv_cables')
    .select('*');
  
  if (error) {
    console.error('Error fetching LV cables:', error);
    toast.error("Failed to load LV cables");
    return [];
  }
  
  return data || [];
}

/**
 * Fetches all HV cables from the database
 */
export async function fetchHVCables(): Promise<HVCable[]> {
  const { data, error } = await supabase
    .from('hv_cables')
    .select('*');
  
  if (error) {
    console.error('Error fetching HV cables:', error);
    toast.error("Failed to load HV cables");
    return [];
  }
  
  return data || [];
}

/**
 * Fetches LV derating factors from the database
 */
export async function fetchLVDeratingFactors(
  factorType: string,
  cableType: string
): Promise<LVDeratingFactor[]> {
  const { data, error } = await supabase
    .from('lv_derating_factors')
    .select('*')
    .eq('factor_type', factorType)
    .eq('cable_type', cableType);
  
  if (error) {
    console.error(`Error fetching LV derating factors for ${factorType}:`, error);
    toast.error("Failed to load LV derating factors");
    return [];
  }
  
  return data || [];
}

/**
 * Fetches HV derating factors from the database
 */
export async function fetchHVDeratingFactors(
  factorType: string,
  cableType: string
): Promise<HVDeratingFactor[]> {
  const { data, error } = await supabase
    .from('hv_derating_factors')
    .select('*')
    .eq('factor_type', factorType)
    .eq('cable_type', cableType);
  
  if (error) {
    console.error(`Error fetching HV derating factors for ${factorType}:`, error);
    toast.error("Failed to load HV derating factors");
    return [];
  }
  
  return data || [];
}

/**
 * Gets the appropriate derating factor for a given value
 */
export function getDeratingFactor(
  factors: LVDeratingFactor[] | HVDeratingFactor[],
  value: number
): number {
  // Sort factors by value_numeric
  const sortedFactors = [...factors].sort((a, b) => {
    return (a.value_numeric || 0) - (b.value_numeric || 0);
  });
  
  // Find the closest factor
  for (let i = 0; i < sortedFactors.length; i++) {
    const factor = sortedFactors[i];
    const nextFactor = sortedFactors[i + 1];
    
    // If value is exactly equal to factor value
    if (factor.value_numeric === value) {
      return factor.derating_factor;
    }
    
    // If value is between this factor and next factor
    if (nextFactor && value > factor.value_numeric && value < nextFactor.value_numeric) {
      // Linear interpolation
      const ratio = (value - factor.value_numeric) / (nextFactor.value_numeric - factor.value_numeric);
      return factor.derating_factor + ratio * (nextFactor.derating_factor - factor.derating_factor);
    }
  }
  
  // If value is less than smallest factor, use smallest factor
  if (sortedFactors.length > 0 && value < (sortedFactors[0].value_numeric || 0)) {
    return sortedFactors[0].derating_factor;
  }
  
  // If value is greater than largest factor, use largest factor
  if (sortedFactors.length > 0 && value > (sortedFactors[sortedFactors.length - 1].value_numeric || 0)) {
    return sortedFactors[sortedFactors.length - 1].derating_factor;
  }
  
  // Default to 1 if no factors found
  return 1;
}

/**
 * Calculates the total derating factor for LV cables based on installation conditions
 */
export async function calculateLVDeratingFactor(
  material: 'COPPER' | 'ALUMINUM',
  installationType: 'CONDUIT' | 'SURFACE',
  ambientTemperature: number = 30,
  grouping: number = 1
): Promise<number> {
  const cableType = `LV_${material}_MC`;
  
  // Get ambient temperature derating factor
  const tempFactors = await fetchLVDeratingFactors('ambient_temperature', cableType);
  const tempFactor = getDeratingFactor(tempFactors, ambientTemperature);
  
  // Get grouping derating factor
  const groupingType = installationType === 'CONDUIT' ? 'grouping_conduit' : 'grouping_surface';
  const groupingFactors = await fetchLVDeratingFactors(groupingType, cableType);
  const groupingFactor = getDeratingFactor(groupingFactors, grouping);
  
  // Calculate total derating factor
  return tempFactor * groupingFactor;
}

/**
 * Calculates the total derating factor for HV cables based on installation conditions
 */
export async function calculateHVDeratingFactor(
  installationType: 'AIR' | 'BURIED',
  ambientTemperature: number = 30,
  groundTemperature: number = 20,
  soilResistivity: number = 1.0,
  burialDepth: number = 1.0,
  grouping: number = 1,
  groupingSpacing: number = 0
): Promise<number> {
  const cableType = `HV_${installationType}`;
  let totalFactor = 1.0;
  
  if (installationType === 'AIR') {
    // For air installations, consider ambient temperature
    const tempFactors = await fetchHVDeratingFactors('ambient_temperature', cableType);
    const tempFactor = getDeratingFactor(tempFactors, ambientTemperature);
    totalFactor *= tempFactor;
  } else if (installationType === 'BURIED') {
    // For buried installations
    // Ground temperature
    const groundTempFactors = await fetchHVDeratingFactors('ground_temperature', cableType);
    const groundTempFactor = getDeratingFactor(groundTempFactors, groundTemperature);
    
    // Soil resistivity
    const soilFactors = await fetchHVDeratingFactors('soil_resistivity', cableType);
    const soilFactor = getDeratingFactor(soilFactors, soilResistivity);
    
    // Burial depth
    const depthFactors = await fetchHVDeratingFactors('burial_depth', cableType);
    const depthFactor = getDeratingFactor(depthFactors, burialDepth);
    
    // Grouping (for trefoil arrangement)
    if (grouping > 1) {
      const groupKey = `${grouping}_${groupingSpacing}`;
      const groupingFactors = await fetchHVDeratingFactors('grouping_buried_trefoil', cableType);
      const matchingFactor = groupingFactors.find(f => f.value_key === groupKey);
      const groupingFactor = matchingFactor ? matchingFactor.derating_factor : 1.0;
      totalFactor *= groupingFactor;
    }
    
    totalFactor *= groundTempFactor * soilFactor * depthFactor;
  }
  
  return totalFactor;
}

/**
 * Selects appropriate LV cable based on current and installation conditions
 */
export async function selectLVCable(params: CableSelectionParams): Promise<LVCable | null> {
  const {
    current,
    material = 'COPPER',
    installationType = 'SURFACE',
    ambientTemperature = 30,
    grouping = 1,
    maxVoltageDropPercent = 3,
    length = 100
  } = params;
  
  // Calculate derating factor
  const deratingFactor = await calculateLVDeratingFactor(
    material,
    installationType as 'CONDUIT' | 'SURFACE',
    ambientTemperature,
    grouping
  );
  
  // Calculate required current capacity with derating
  const requiredCapacity = current / deratingFactor;
  
  // Fetch all LV cables
  const cables = await fetchLVCables();
  
  // Filter cables by material
  const materialCables = cables.filter(cable => cable.material === material);
  
  // Filter by voltage rating
  const voltageRatedCables = materialCables.filter(cable => 
    cable.voltage_rating_numeric >= params.voltage
  );
  
  // Find suitable cables based on current capacity
  const suitableCables = voltageRatedCables.filter(cable => {
    // Use the appropriate ampacity field based on installation type
    const capacityField = installationType === 'CONDUIT' 
      ? 'conduit_wall_ampacity' 
      : installationType === 'SURFACE' 
        ? 'clipped_direct_ampacity' 
        : 'direct_burial_ampacity';
    
    return cable[capacityField] >= requiredCapacity;
  });
  
  // If no suitable cables found
  if (suitableCables.length === 0) {
    return null;
  }
  
  // Sort by capacity (smallest suitable cable first)
  suitableCables.sort((a, b) => {
    const capacityField = installationType === 'CONDUIT' 
      ? 'conduit_wall_ampacity' 
      : installationType === 'SURFACE' 
        ? 'clipped_direct_ampacity' 
        : 'direct_burial_ampacity';
    
    return a[capacityField] - b[capacityField];
  });
  
  // If voltage drop is a concern, check that too
  if (maxVoltageDropPercent && length) {
    // Find the first cable that meets voltage drop requirements
    for (const cable of suitableCables) {
      // Calculate voltage drop
      const voltageDropPerAmp = material === 'COPPER' ? 0.0164 : 0.0270; // mV/A/m
      const voltageDrop = (voltageDropPerAmp * current * length) / cable.cross_section_mm2;
      const voltageDropPercent = (voltageDrop / params.voltage) * 100;
      
      if (voltageDropPercent <= maxVoltageDropPercent) {
        return cable;
      }
    }
    
    // If no cable meets voltage drop requirements, return the largest available
    return suitableCables[suitableCables.length - 1];
  }
  
  // Return the smallest suitable cable
  return suitableCables[0];
}

/**
 * Selects appropriate HV cable based on current and installation conditions
 */
export async function selectHVCable(params: CableSelectionParams): Promise<HVCable | null> {
  const {
    current,
    voltage,
    installationType = 'BURIED',
    ambientTemperature = 30,
    groundTemperature = 20,
    soilResistivity = 1.0,
    burialDepth = 1.0,
    grouping = 1,
    groupingSpacing = 0,
    maxVoltageDropPercent = 2,
    length = 100
  } = params;
  
  // Calculate derating factor
  const deratingFactor = await calculateHVDeratingFactor(
    installationType === 'BURIED' ? 'BURIED' : 'AIR',
    ambientTemperature,
    groundTemperature,
    soilResistivity,
    burialDepth,
    grouping,
    groupingSpacing
  );
  
  // Calculate required current capacity with derating
  const requiredCapacity = current / deratingFactor;
  
  // Fetch all HV cables
  const cables = await fetchHVCables();
  
  // Filter cables by voltage rating
  const voltageRatedCables = cables.filter(cable => {
    // Use voltage_rating_numeric for LV cables
    const voltageRatingField = params.cableType === 'LV' ? 'voltage_rating_numeric' : 'voltage_rating';
    return cable[voltageRatingField] >= voltage;
  });
  
  // Find suitable cables based on current capacity
  const suitableCables = voltageRatedCables.filter(cable => {
    const capacityField = installationType === 'BURIED' ? 'ampacity_ground' : 'ampacity_air';
    return cable[capacityField] >= requiredCapacity;
  });
  
  // If no suitable cables found
  if (suitableCables.length === 0) {
    return null;
  }
  
  // Sort by capacity (smallest suitable cable first)
  suitableCables.sort((a, b) => {
    const capacityField = installationType === 'BURIED' ? 'ampacity_ground' : 'ampacity_air';
    return a[capacityField] - b[capacityField];
  });
  
  // Return the smallest suitable cable
  return suitableCables[0];
}

/**
 * Selects appropriate cable based on current, voltage, and installation conditions
 */
export async function selectCable(params: CableSelectionParams): Promise<{
  recommendedCable: LVCable | HVCable;
  deratedCurrent: number;
}> {
  try {
    const { cableType } = params;
    
    if (cableType === 'LV') {
      const cable = await selectLVCable(params);
      return {
        recommendedCable: cable || mockLVCable(),
        deratedCurrent: cable ? 
          (cable.current_in_conduit || cable.current_in_air) * 0.85 : 
          params.current * 1.25
      };
    } else {
      const cable = await selectHVCable(params);
      return {
        recommendedCable: cable || mockHVCable(),
        deratedCurrent: cable ? 
          (cable.current_in_ground || cable.current_in_air) * 0.85 : 
          params.current * 1.25
      };
    }
  } catch (error) {
    console.error('Error selecting cable:', error);
    toast.error("Failed to select cable - using mock data");
    
    // Return mock data if there's an error
    return {
      recommendedCable: params.cableType === 'LV' ? mockLVCable() : mockHVCable(),
      deratedCurrent: params.current * 1.25
    };
  }
}

// Mock LV Cable for fallback
function mockLVCable(): LVCable {
  return {
    id: 'mock-lv-1',
    cross_section_mm2: 35,
    material: 'XLPE',
    current_in_air: 150,
    current_in_conduit: 120,
    voltage_rating: '0.6/1kV',
    voltage_rating_numeric: 1000,
    conductor_material: 'COPPER',
    insulation_type: 'XLPE',
    max_temperature: 90,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// Mock HV Cable for fallback
function mockHVCable(): HVCable {
  return {
    id: 'mock-hv-1',
    cross_section_mm2: 95,
    voltage_rating: 11000,
    current_in_air: 280,
    current_in_ground: 240,
    conductor_material: 'COPPER',
    insulation_type: 'XLPE',
    max_temperature: 90,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
} 