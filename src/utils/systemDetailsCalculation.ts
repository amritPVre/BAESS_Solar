
import { SystemDetails } from "@/types/solarCalculations";

interface InverterParams {
  inverter_model: string;
  quantity: number;
  dc_ac_ratio: number;
  power?: number;
  efficiency?: number;
}

export function calculateSystemDetails(
  plant_capacity_kw: number,
  module_area: number,
  module_watt_peak: number,
  inverterParams?: InverterParams | null
): SystemDetails {
  // Calculate number of modules
  const total_modules = Math.ceil((plant_capacity_kw * 1000) / module_watt_peak);
  
  // Calculate total array area
  const total_area = total_modules * module_area;
  
  // Calculate inverter details
  let inverter_efficiency = 0.96; // Default efficiency
  let effective_dc_ac_ratio = 1.2; // Default DC/AC ratio
  let number_of_inverters = 0;
  let inverter_configuration = undefined;
  
  if (inverterParams) {
    inverter_efficiency = inverterParams.efficiency || 0.96;
    effective_dc_ac_ratio = inverterParams.dc_ac_ratio;
    number_of_inverters = inverterParams.quantity;
    
    inverter_configuration = {
      inverter_model: inverterParams.inverter_model,
      quantity: inverterParams.quantity,
      dc_ac_ratio: inverterParams.dc_ac_ratio
    };
  }
  
  return {
    total_modules,
    total_area,
    calculated_capacity: plant_capacity_kw,
    inverter_efficiency,
    effective_dc_ac_ratio,
    number_of_inverters,
    inverter_configuration
  };
}
