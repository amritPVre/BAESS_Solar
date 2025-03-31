
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SolarPanel {
  id: string;
  manufacturer: string;
  model: string;
  nominal_power_w: number;
  technology: string;
  vmp_v: number;
  imp_a: number;
  voc_v: number;
  isc_a: number;
  module_length: number;
  module_width: number;
  panel_area_m2: number;
  efficiency_percent: number;
}

export interface SolarInverter {
  id: string;
  manufacturer: string;
  model: string;
  nominal_ac_power_kw: number;
  maximum_ac_power_kw: number;
  phase: string;
  topology: string;
  min_mpp_voltage_v: number;
  max_dc_voltage_v: number;
  total_mppt: number;
  total_string_inputs: number;
}

export const fetchSolarPanels = async (
  search: string = "", 
  manufacturer: string = ""
): Promise<SolarPanel[]> => {
  try {
    let query = supabase
      .from('solar_panels')
      .select('id, manufacturer, model, nominal_power_w, technology, vmp_v, imp_a, voc_v, isc_a, module_length, module_width, panel_area_m2, efficiency_percent');

    if (search) {
      query = query.or(`manufacturer.ilike.%${search}%,model.ilike.%${search}%`);
    }

    if (manufacturer) {
      query = query.eq('manufacturer', manufacturer);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data as SolarPanel[];
  } catch (error) {
    console.error("Error fetching solar panels:", error);
    toast.error("Failed to load solar panels");
    return [];
  }
};

export const fetchSolarInverters = async (
  search: string = "", 
  manufacturer: string = ""
): Promise<SolarInverter[]> => {
  try {
    let query = supabase
      .from('solar_inverters')
      .select('id, manufacturer, model, nominal_ac_power_kw, maximum_ac_power_kw, phase, topology, min_mpp_voltage_v, max_dc_voltage_v, total_mppt, total_string_inputs');

    if (search) {
      query = query.or(`manufacturer.ilike.%${search}%,model.ilike.%${search}%`);
    }

    if (manufacturer) {
      query = query.eq('manufacturer', manufacturer);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data as SolarInverter[];
  } catch (error) {
    console.error("Error fetching solar inverters:", error);
    toast.error("Failed to load solar inverters");
    return [];
  }
};

export const fetchPanelManufacturers = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('solar_panels')
      .select('manufacturer')
      .order('manufacturer');

    if (error) {
      throw error;
    }

    // Extract unique manufacturers
    const manufacturers = [...new Set(data.map(item => item.manufacturer))];
    return manufacturers;
  } catch (error) {
    console.error("Error fetching manufacturers:", error);
    toast.error("Failed to load manufacturers");
    return [];
  }
};

export const fetchInverterManufacturers = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('solar_inverters')
      .select('manufacturer')
      .order('manufacturer');

    if (error) {
      throw error;
    }

    // Extract unique manufacturers
    const manufacturers = [...new Set(data.map(item => item.manufacturer))];
    return manufacturers;
  } catch (error) {
    console.error("Error fetching manufacturers:", error);
    toast.error("Failed to load manufacturers");
    return [];
  }
};
