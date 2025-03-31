
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Sample data for solar panels
const samplePanels = [
  {
    manufacturer: "SunPower",
    model: "SPR-MAX3-400",
    nominal_power_w: 400,
    technology: "Monocrystalline",
    cells_in_series: 72,
    vmp_v: 40.5,
    imp_a: 9.88,
    voc_v: 48.2,
    isc_a: 10.4,
    module_length: 1690,
    module_width: 998,
    module_weight: 19,
    panel_area_m2: 1.686,
    efficiency_percent: 22.6
  },
  {
    manufacturer: "LG",
    model: "NeON R LG375Q1C-V5",
    nominal_power_w: 375,
    technology: "Monocrystalline",
    cells_in_series: 60,
    vmp_v: 37.2,
    imp_a: 10.08,
    voc_v: 43.6,
    isc_a: 10.8,
    module_length: 1700,
    module_width: 1016,
    module_weight: 17.5,
    panel_area_m2: 1.727,
    efficiency_percent: 21.7
  },
  {
    manufacturer: "Panasonic",
    model: "EVPV370",
    nominal_power_w: 370,
    technology: "HIT Monocrystalline",
    cells_in_series: 96,
    vmp_v: 40.5,
    imp_a: 9.14,
    voc_v: 49.4,
    isc_a: 9.92,
    module_length: 1590,
    module_width: 1053,
    module_weight: 18.5,
    panel_area_m2: 1.675,
    efficiency_percent: 22.1
  },
  {
    manufacturer: "Canadian Solar",
    model: "HiKu CS3W-395MS",
    nominal_power_w: 395,
    technology: "Monocrystalline PERC",
    cells_in_series: 132,
    vmp_v: 40.1,
    imp_a: 9.85,
    voc_v: 48.1,
    isc_a: 10.5,
    module_length: 2108,
    module_width: 1048,
    module_weight: 24.9,
    panel_area_m2: 2.209,
    efficiency_percent: 19.15
  },
  {
    manufacturer: "Jinko Solar",
    model: "Tiger Pro 72HC",
    nominal_power_w: 590,
    technology: "Monocrystalline",
    cells_in_series: 144,
    vmp_v: 41.65,
    imp_a: 14.17,
    voc_v: 49.50,
    isc_a: 14.94,
    module_length: 2465,
    module_width: 1134,
    module_weight: 32.6,
    panel_area_m2: 2.795,
    efficiency_percent: 21.10
  }
];

// Sample data for solar inverters
const sampleInverters = [
  {
    manufacturer: "SMA",
    model: "Sunny Tripower 15000TL",
    nominal_ac_power_kw: 15,
    maximum_ac_power_kw: 15,
    nominal_ac_voltage_v: 230,
    maximum_ac_current_a: 24,
    phase: "Three-phase",
    topology: "Transformerless",
    power_threshold_w: 10,
    nominal_mpp_voltage_v: 800,
    min_mpp_voltage_v: 240,
    max_dc_voltage_v: 1000,
    max_dc_current_a: 33,
    total_mppt: 2,
    total_string_inputs: 6
  },
  {
    manufacturer: "Fronius",
    model: "Primo 8.2-1",
    nominal_ac_power_kw: 8.2,
    maximum_ac_power_kw: 8.2,
    nominal_ac_voltage_v: 240,
    maximum_ac_current_a: 35.3,
    phase: "Single-phase",
    topology: "Transformerless",
    power_threshold_w: 5,
    nominal_mpp_voltage_v: 600,
    min_mpp_voltage_v: 200,
    max_dc_voltage_v: 1000,
    max_dc_current_a: 18,
    total_mppt: 2,
    total_string_inputs: 2
  },
  {
    manufacturer: "SolarEdge",
    model: "SE10K",
    nominal_ac_power_kw: 10,
    maximum_ac_power_kw: 10,
    nominal_ac_voltage_v: 400,
    maximum_ac_current_a: 16.5,
    phase: "Three-phase",
    topology: "HD-Wave",
    power_threshold_w: 2.5,
    nominal_mpp_voltage_v: 750,
    min_mpp_voltage_v: 500,
    max_dc_voltage_v: 900,
    max_dc_current_a: 27,
    total_mppt: 1,
    total_string_inputs: 2
  },
  {
    manufacturer: "Enphase",
    model: "IQ8PLUS-72-2-US",
    nominal_ac_power_kw: 0.29,
    maximum_ac_power_kw: 0.295,
    nominal_ac_voltage_v: 240,
    maximum_ac_current_a: 1.23,
    phase: "Single-phase",
    topology: "Microinverter",
    power_threshold_w: 1,
    nominal_mpp_voltage_v: 32,
    min_mpp_voltage_v: 27,
    max_dc_voltage_v: 48,
    max_dc_current_a: 11.8,
    total_mppt: 1,
    total_string_inputs: 1
  },
  {
    manufacturer: "Huawei",
    model: "SUN2000-36KTL",
    nominal_ac_power_kw: 36,
    maximum_ac_power_kw: 40,
    nominal_ac_voltage_v: 400,
    maximum_ac_current_a: 57.8,
    phase: "Three-phase",
    topology: "Transformerless",
    power_threshold_w: 10,
    nominal_mpp_voltage_v: 600,
    min_mpp_voltage_v: 200,
    max_dc_voltage_v: 1100,
    max_dc_current_a: 22,
    total_mppt: 4,
    total_string_inputs: 8
  }
];

export const insertSamplePanels = async () => {
  try {
    const { error } = await supabase
      .from('solar_panels')
      .insert(samplePanels as any);
    
    if (error) throw error;
    
    toast.success("Sample solar panel data inserted successfully");
    return true;
  } catch (error: any) {
    console.error("Error inserting sample panels:", error);
    toast.error(`Failed to insert sample data: ${error.message || 'Unknown error'}`);
    return false;
  }
};

export const insertSampleInverters = async () => {
  try {
    const { error } = await supabase
      .from('solar_inverters')
      .insert(sampleInverters as any);
    
    if (error) throw error;
    
    toast.success("Sample solar inverter data inserted successfully");
    return true;
  } catch (error: any) {
    console.error("Error inserting sample inverters:", error);
    toast.error(`Failed to insert sample data: ${error.message || 'Unknown error'}`);
    return false;
  }
};

export const insertAllSampleData = async () => {
  const panelsResult = await insertSamplePanels();
  const invertersResult = await insertSampleInverters();
  
  return panelsResult && invertersResult;
};
