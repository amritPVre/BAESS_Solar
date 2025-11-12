
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

// Use Supabase generated types
export type SolarPanel = Tables<'solar_panels'>;
export type SolarInverter = Tables<'solar_inverters'>;

export const fetchSolarPanels = async (
  search: string = "", 
  manufacturer: string = ""
): Promise<SolarPanel[]> => {
  try {
    let query = supabase
      .from('solar_panels')
      .select('*');

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

    return (data || []) as SolarPanel[];
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
      .select('*');

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

    return (data || []) as SolarInverter[];
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
    return manufacturers.filter(Boolean);
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
    return manufacturers.filter(Boolean);
  } catch (error) {
    console.error("Error fetching manufacturers:", error);
    toast.error("Failed to load manufacturers");
    return [];
  }
};
