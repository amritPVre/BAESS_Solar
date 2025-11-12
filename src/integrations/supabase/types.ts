export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string
          company: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          preferred_currency: string
          updated_at: string
          subscription_tier: string
          ai_credits_remaining: number
          ai_credits_monthly_limit: number
          subscription_start_date: string
          next_credit_reset_date: string
          is_super_admin: boolean
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
        }
        Insert: {
          avatar_url?: string
          company?: string
          created_at?: string
          email: string
          id: string
          name?: string
          phone?: string
          preferred_currency?: string
          updated_at?: string
          subscription_tier?: string
          ai_credits_remaining?: number
          ai_credits_monthly_limit?: number
          subscription_start_date?: string
          next_credit_reset_date?: string
          is_super_admin?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
        }
        Update: {
          avatar_url?: string
          company?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          preferred_currency?: string
          updated_at?: string
          subscription_tier?: string
          ai_credits_remaining?: number
          ai_credits_monthly_limit?: number
          subscription_start_date?: string
          next_credit_reset_date?: string
          is_super_admin?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_name: string
          created_at: string
          id: string
          location: string
          name: string
          owner_id: string
          status: string
          updated_at: string
        }
        Insert: {
          client_name?: string
          created_at?: string
          id?: string
          location?: string
          name: string
          owner_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_name?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          owner_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      advanced_calculator_projects: {
        Row: {
          id: string
          user_id: string
          project_name: string
          status: string
          location: Json | null
          system_params: Json | null
          selected_panel: Json | null
          selected_inverter: Json | null
          polygon_configs: Json | null
          dc_config: Json | null
          ac_configuration: Json | null
          detailed_losses: Json | null
          solar_results: Json | null
          consolidated_boq: Json | null
          boq_cost_summary: Json | null
          financial_params: Json | null
          financial_results: Json | null
          ai_report_form: Json | null
          ai_executive_summary: string | null
          captured_map_image: string | null
          captured_sld_image: string | null
          sld_metadata: Json | null
          created_at: string
          updated_at: string
          last_saved_tab: string | null
          progress_percentage: number | null
        }
        Insert: {
          id?: string
          user_id: string
          project_name: string
          status?: string
          location?: Json | null
          system_params?: Json | null
          selected_panel?: Json | null
          selected_inverter?: Json | null
          polygon_configs?: Json | null
          dc_config?: Json | null
          ac_configuration?: Json | null
          detailed_losses?: Json | null
          solar_results?: Json | null
          consolidated_boq?: Json | null
          boq_cost_summary?: Json | null
          financial_params?: Json | null
          financial_results?: Json | null
          ai_report_form?: Json | null
          ai_executive_summary?: string | null
          captured_map_image?: string | null
          captured_sld_image?: string | null
          sld_metadata?: Json | null
          created_at?: string
          updated_at?: string
          last_saved_tab?: string | null
          progress_percentage?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          project_name?: string
          status?: string
          location?: Json | null
          system_params?: Json | null
          selected_panel?: Json | null
          selected_inverter?: Json | null
          polygon_configs?: Json | null
          dc_config?: Json | null
          ac_configuration?: Json | null
          detailed_losses?: Json | null
          solar_results?: Json | null
          consolidated_boq?: Json | null
          boq_cost_summary?: Json | null
          financial_params?: Json | null
          financial_results?: Json | null
          ai_report_form?: Json | null
          ai_executive_summary?: string | null
          captured_map_image?: string | null
          captured_sld_image?: string | null
          sld_metadata?: Json | null
          created_at?: string
          updated_at?: string
          last_saved_tab?: string | null
          progress_percentage?: number | null
        }
        Relationships: []
      }
      lv_cables: {
        Row: {
          id: string
          cross_section_mm2: number
          material: string
          type: string
          current_in_air: number | null
          current_in_conduit: number | null
          buried_conduit_ampacity: number | null
          direct_burial_ampacity: number | null
          voltage_rating: string | null
          conductor_material: string | null
          insulation_type: string | null
          num_cores: number | null
          created_at: string | null
          updated_at: string | null
          max_temperature: number | null
          voltage_rating_numeric: number | null
        }
        Insert: {
          id?: string
          cross_section_mm2: number
          material: string
          type: string
          current_in_air?: number | null
          current_in_conduit?: number | null
          buried_conduit_ampacity?: number | null
          direct_burial_ampacity?: number | null
          voltage_rating?: string | null
          conductor_material?: string | null
          insulation_type?: string | null
          num_cores?: number | null
          created_at?: string | null
          updated_at?: string | null
          max_temperature?: number | null
          voltage_rating_numeric?: number | null
        }
        Update: {
          id?: string
          cross_section_mm2?: number
          material?: string
          type?: string
          current_in_air?: number | null
          current_in_conduit?: number | null
          buried_conduit_ampacity?: number | null
          direct_burial_ampacity?: number | null
          voltage_rating?: string | null
          conductor_material?: string | null
          insulation_type?: string | null
          num_cores?: number | null
          created_at?: string | null
          updated_at?: string | null
          max_temperature?: number | null
          voltage_rating_numeric?: number | null
        }
        Relationships: []
      }
      hv_cables: {
        Row: {
          id: string
          cross_section_mm2: number
          voltage_rating: number
          current_in_air: number
          current_in_ground: number
          conductor_material: string
          insulation_type: string
          core_type: string | null
          max_temperature: number
          ac_resistance: number | null
          reactance: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cross_section_mm2: number
          voltage_rating: number
          current_in_air: number
          current_in_ground: number
          conductor_material: string
          insulation_type: string
          core_type?: string | null
          max_temperature: number
          ac_resistance?: number | null
          reactance?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cross_section_mm2?: number
          voltage_rating?: number
          current_in_air?: number
          current_in_ground?: number
          conductor_material?: string
          insulation_type?: string
          core_type?: string | null
          max_temperature?: number
          ac_resistance?: number | null
          reactance?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      lv_derating_factors: {
        Row: {
          id: string
          factor_type: string
          cable_type: string
          value_key: string
          value_numeric: number | null
          derating_factor: number
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          factor_type: string
          cable_type: string
          value_key: string
          value_numeric?: number | null
          derating_factor: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          factor_type?: string
          cable_type?: string
          value_key?: string
          value_numeric?: number | null
          derating_factor?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hv_derating_factors: {
        Row: {
          id: string
          factor_type: string
          cable_type: string
          value_key: string
          value_numeric: number | null
          derating_factor: number
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          factor_type: string
          cable_type: string
          value_key: string
          value_numeric?: number | null
          derating_factor: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          factor_type?: string
          cable_type?: string
          value_key?: string
          value_numeric?: number | null
          derating_factor?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      derating_factors: {
        Row: {
          id: string
          factor_type: string
          cable_type: string
          value_key: string
          value_numeric: number | null
          derating_factor: number
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          factor_type: string
          cable_type: string
          value_key: string
          value_numeric?: number | null
          derating_factor: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          factor_type?: string
          cable_type?: string
          value_key?: string
          value_numeric?: number | null
          derating_factor?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      solar_inverters: {
        Row: {
          id: string
          manufacturer: string
          model: string
          file_name: string | null
          data_source: string | null
          nominal_ac_power_kw: number | null
          maximum_ac_power_kw: number | null
          nominal_ac_current_a: number | null
          maximum_ac_current_a: number | null
          nominal_ac_voltage_v: number | null
          phase: string | null
          frequency_hz: number | null
          power_threshold_w: number | null
          nominal_mpp_voltage_v: number | null
          min_mpp_voltage_v: number | null
          max_dc_voltage_v: number | null
          max_dc_current_a: number | null
          total_string_inputs: number | null
          total_mppt: number | null
          night_consumption_w: number | null
          topology: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          manufacturer: string
          model: string
          file_name?: string | null
          data_source?: string | null
          nominal_ac_power_kw?: number | null
          maximum_ac_power_kw?: number | null
          nominal_ac_current_a?: number | null
          maximum_ac_current_a?: number | null
          nominal_ac_voltage_v?: number | null
          phase?: string | null
          frequency_hz?: number | null
          power_threshold_w?: number | null
          nominal_mpp_voltage_v?: number | null
          min_mpp_voltage_v?: number | null
          max_dc_voltage_v?: number | null
          max_dc_current_a?: number | null
          total_string_inputs?: number | null
          total_mppt?: number | null
          night_consumption_w?: number | null
          topology?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          manufacturer?: string
          model?: string
          file_name?: string | null
          data_source?: string | null
          nominal_ac_power_kw?: number | null
          maximum_ac_power_kw?: number | null
          nominal_ac_current_a?: number | null
          maximum_ac_current_a?: number | null
          nominal_ac_voltage_v?: number | null
          phase?: string | null
          frequency_hz?: number | null
          power_threshold_w?: number | null
          nominal_mpp_voltage_v?: number | null
          min_mpp_voltage_v?: number | null
          max_dc_voltage_v?: number | null
          max_dc_current_a?: number | null
          total_string_inputs?: number | null
          total_mppt?: number | null
          night_consumption_w?: number | null
          topology?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      solar_panels: {
        Row: {
          id: string
          manufacturer: string
          model: string
          file_name: string | null
          data_source: string | null
          nominal_power_w: number | null
          technology: string | null
          cells_in_series: number | null
          cells_in_parallel: number | null
          maximum_voltage_iec: number | null
          noct_c: number | null
          vmp_v: number | null
          imp_a: number | null
          voc_v: number | null
          isc_a: number | null
          current_temp_coeff: number | null
          power_temp_coeff: number | null
          module_length: number | null
          module_width: number | null
          module_weight: number | null
          panel_area_m2: number | null
          efficiency_percent: number | null
          bifaciality: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          manufacturer: string
          model: string
          file_name?: string | null
          data_source?: string | null
          nominal_power_w?: number | null
          technology?: string | null
          cells_in_series?: number | null
          cells_in_parallel?: number | null
          maximum_voltage_iec?: number | null
          noct_c?: number | null
          vmp_v?: number | null
          imp_a?: number | null
          voc_v?: number | null
          isc_a?: number | null
          current_temp_coeff?: number | null
          power_temp_coeff?: number | null
          module_length?: number | null
          module_width?: number | null
          module_weight?: number | null
          panel_area_m2?: number | null
          efficiency_percent?: number | null
          bifaciality?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          manufacturer?: string
          model?: string
          file_name?: string | null
          data_source?: string | null
          nominal_power_w?: number | null
          technology?: string | null
          cells_in_series?: number | null
          cells_in_parallel?: number | null
          maximum_voltage_iec?: number | null
          noct_c?: number | null
          vmp_v?: number | null
          imp_a?: number | null
          voc_v?: number | null
          isc_a?: number | null
          current_temp_coeff?: number | null
          power_temp_coeff?: number | null
          module_length?: number | null
          module_width?: number | null
          module_weight?: number | null
          panel_area_m2?: number | null
          efficiency_percent?: number | null
          bifaciality?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      circuit_breaker_types: {
        Row: {
          id: string
          breaker_type: string
          abbreviation: string
          governing_standard: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          breaker_type: string
          abbreviation: string
          governing_standard: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          breaker_type?: string
          abbreviation?: string
          governing_standard?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      circuit_breaker_ratings: {
        Row: {
          id: string
          breaker_type_id: string
          ampere_rating: number
          voltage_rating: number | null
          breaking_capacity_ka: number | null
          is_standard: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          breaker_type_id: string
          ampere_rating: number
          voltage_rating?: number | null
          breaking_capacity_ka?: number | null
          is_standard?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          breaker_type_id?: string
          ampere_rating?: number
          voltage_rating?: number | null
          breaking_capacity_ka?: number | null
          is_standard?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "circuit_breaker_ratings_breaker_type_id_fkey"
            columns: ["breaker_type_id"]
            isOneToOne: false
            referencedRelation: "circuit_breaker_types"
            referencedColumns: ["id"]
          }
        ]
      }
      circuit_breakers: {
        Row: {
          id: string
          breaker_type: string
          ampacity: number
          rated_voltage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          breaker_type: string
          ampacity: number
          rated_voltage: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          breaker_type?: string
          ampacity?: number
          rated_voltage?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      albedo_values: {
        Row: {
          id: string;
          surface_type: string;
          albedo_value: number;
          albedo_range_min?: number;
          albedo_range_max?: number;
          description?: string;
          category?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          surface_type: string;
          albedo_value: number;
          albedo_range_min?: number;
          albedo_range_max?: number;
          description?: string;
          category?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          surface_type?: string;
          albedo_value?: number;
          albedo_range_min?: number;
          albedo_range_max?: number;
          description?: string;
          category?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

export type AlbedoValue = {
  id: string;
  surface_type: string;
  albedo_value: number;
  albedo_range_min?: number;
  albedo_range_max?: number;
  description?: string;
  category?: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
};
