export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          preferred_currency: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          phone?: string | null
          preferred_currency?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          preferred_currency?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          annual_cost: number | null
          annual_energy: number | null
          annual_revenue: number | null
          city: string | null
          client_address: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          co2_reduction: number | null
          company_contact: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          country: string | null
          created_at: string | null
          cumulative_cash_flow: Json | null
          currency: string | null
          degradation_rate: number | null
          discount_rate: number | null
          electricity_escalation_rate: number | null
          electricity_rate: number
          financing_option: string | null
          id: string
          incentives: number | null
          interest_rate: number | null
          inverter_efficiency: number | null
          inverter_type: string | null
          irr: number | null
          knows_annual_energy: boolean
          lcoe: number | null
          loan_term: number | null
          location: Json | null
          maintenance_cost: number | null
          maintenance_escalation_rate: number | null
          manual_annual_energy: number | null
          name: string
          net_present_value: number | null
          orientation: string | null
          panel_efficiency: number | null
          panel_type: string | null
          payback_period: Json | null
          roof_angle: number | null
          roof_type: string | null
          shading_factor: number | null
          solar_irradiance: number | null
          system_cost: number
          system_size: number
          timezone: string | null
          trees_equivalent: number | null
          updated_at: string | null
          user_id: string
          vehicle_miles_offset: number | null
          yearly_cash_flow: Json | null
          yearly_production: Json | null
        }
        Insert: {
          annual_cost?: number | null
          annual_energy?: number | null
          annual_revenue?: number | null
          city?: string | null
          client_address?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          co2_reduction?: number | null
          company_contact?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          country?: string | null
          created_at?: string | null
          cumulative_cash_flow?: Json | null
          currency?: string | null
          degradation_rate?: number | null
          discount_rate?: number | null
          electricity_escalation_rate?: number | null
          electricity_rate: number
          financing_option?: string | null
          id?: string
          incentives?: number | null
          interest_rate?: number | null
          inverter_efficiency?: number | null
          inverter_type?: string | null
          irr?: number | null
          knows_annual_energy?: boolean
          lcoe?: number | null
          loan_term?: number | null
          location?: Json | null
          maintenance_cost?: number | null
          maintenance_escalation_rate?: number | null
          manual_annual_energy?: number | null
          name: string
          net_present_value?: number | null
          orientation?: string | null
          panel_efficiency?: number | null
          panel_type?: string | null
          payback_period?: Json | null
          roof_angle?: number | null
          roof_type?: string | null
          shading_factor?: number | null
          solar_irradiance?: number | null
          system_cost: number
          system_size: number
          timezone?: string | null
          trees_equivalent?: number | null
          updated_at?: string | null
          user_id: string
          vehicle_miles_offset?: number | null
          yearly_cash_flow?: Json | null
          yearly_production?: Json | null
        }
        Update: {
          annual_cost?: number | null
          annual_energy?: number | null
          annual_revenue?: number | null
          city?: string | null
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          co2_reduction?: number | null
          company_contact?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          country?: string | null
          created_at?: string | null
          cumulative_cash_flow?: Json | null
          currency?: string | null
          degradation_rate?: number | null
          discount_rate?: number | null
          electricity_escalation_rate?: number | null
          electricity_rate?: number
          financing_option?: string | null
          id?: string
          incentives?: number | null
          interest_rate?: number | null
          inverter_efficiency?: number | null
          inverter_type?: string | null
          irr?: number | null
          knows_annual_energy?: boolean
          lcoe?: number | null
          loan_term?: number | null
          location?: Json | null
          maintenance_cost?: number | null
          maintenance_escalation_rate?: number | null
          manual_annual_energy?: number | null
          name?: string
          net_present_value?: number | null
          orientation?: string | null
          panel_efficiency?: number | null
          panel_type?: string | null
          payback_period?: Json | null
          roof_angle?: number | null
          roof_type?: string | null
          shading_factor?: number | null
          solar_irradiance?: number | null
          system_cost?: number
          system_size?: number
          timezone?: string | null
          trees_equivalent?: number | null
          updated_at?: string | null
          user_id?: string
          vehicle_miles_offset?: number | null
          yearly_cash_flow?: Json | null
          yearly_production?: Json | null
        }
        Relationships: []
      }
      solar_inverters: {
        Row: {
          created_at: string | null
          data_source: string | null
          file_name: string | null
          frequency_hz: number | null
          id: string
          manufacturer: string
          max_dc_current_a: number | null
          max_dc_voltage_v: number | null
          maximum_ac_current_a: number | null
          maximum_ac_power_kw: number | null
          min_mpp_voltage_v: number | null
          model: string
          night_consumption_w: number | null
          nominal_ac_current_a: number | null
          nominal_ac_power_kw: number | null
          nominal_ac_voltage_v: number | null
          nominal_mpp_voltage_v: number | null
          phase: string | null
          power_threshold_w: number | null
          topology: string | null
          total_mppt: number | null
          total_string_inputs: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_source?: string | null
          file_name?: string | null
          frequency_hz?: number | null
          id?: string
          manufacturer: string
          max_dc_current_a?: number | null
          max_dc_voltage_v?: number | null
          maximum_ac_current_a?: number | null
          maximum_ac_power_kw?: number | null
          min_mpp_voltage_v?: number | null
          model: string
          night_consumption_w?: number | null
          nominal_ac_current_a?: number | null
          nominal_ac_power_kw?: number | null
          nominal_ac_voltage_v?: number | null
          nominal_mpp_voltage_v?: number | null
          phase?: string | null
          power_threshold_w?: number | null
          topology?: string | null
          total_mppt?: number | null
          total_string_inputs?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_source?: string | null
          file_name?: string | null
          frequency_hz?: number | null
          id?: string
          manufacturer?: string
          max_dc_current_a?: number | null
          max_dc_voltage_v?: number | null
          maximum_ac_current_a?: number | null
          maximum_ac_power_kw?: number | null
          min_mpp_voltage_v?: number | null
          model?: string
          night_consumption_w?: number | null
          nominal_ac_current_a?: number | null
          nominal_ac_power_kw?: number | null
          nominal_ac_voltage_v?: number | null
          nominal_mpp_voltage_v?: number | null
          phase?: string | null
          power_threshold_w?: number | null
          topology?: string | null
          total_mppt?: number | null
          total_string_inputs?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      solar_panels: {
        Row: {
          cells_in_parallel: number | null
          cells_in_series: number | null
          created_at: string | null
          current_temp_coeff: number | null
          data_source: string | null
          efficiency_percent: number | null
          file_name: string | null
          id: string
          imp_a: number | null
          isc_a: number | null
          manufacturer: string
          maximum_voltage_iec: number | null
          model: string
          module_length: number | null
          module_weight: number | null
          module_width: number | null
          noct_c: number | null
          nominal_power_w: number | null
          panel_area_m2: number | null
          power_temp_coeff: number | null
          technology: string | null
          updated_at: string | null
          vmp_v: number | null
          voc_v: number | null
        }
        Insert: {
          cells_in_parallel?: number | null
          cells_in_series?: number | null
          created_at?: string | null
          current_temp_coeff?: number | null
          data_source?: string | null
          efficiency_percent?: number | null
          file_name?: string | null
          id?: string
          imp_a?: number | null
          isc_a?: number | null
          manufacturer: string
          maximum_voltage_iec?: number | null
          model: string
          module_length?: number | null
          module_weight?: number | null
          module_width?: number | null
          noct_c?: number | null
          nominal_power_w?: number | null
          panel_area_m2?: number | null
          power_temp_coeff?: number | null
          technology?: string | null
          updated_at?: string | null
          vmp_v?: number | null
          voc_v?: number | null
        }
        Update: {
          cells_in_parallel?: number | null
          cells_in_series?: number | null
          created_at?: string | null
          current_temp_coeff?: number | null
          data_source?: string | null
          efficiency_percent?: number | null
          file_name?: string | null
          id?: string
          imp_a?: number | null
          isc_a?: number | null
          manufacturer?: string
          maximum_voltage_iec?: number | null
          model?: string
          module_length?: number | null
          module_weight?: number | null
          module_width?: number | null
          noct_c?: number | null
          nominal_power_w?: number | null
          panel_area_m2?: number | null
          power_temp_coeff?: number | null
          technology?: string | null
          updated_at?: string | null
          vmp_v?: number | null
          voc_v?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
