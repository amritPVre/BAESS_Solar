import { supabase } from '@/integrations/supabase/client';

export interface AdvancedCalculatorProject {
  id?: string;
  user_id?: string;
  project_name: string;
  status: 'draft' | 'completed';
  
  // Location Data
  location?: {
    address: string;
    latitude: number;
    longitude: number;
    timezone: string;
    elevation?: number;
    country?: string;
    state?: string;
    city?: string;
  };
  
  // System Configuration
  system_params?: {
    capacity: number;
    tilt: number;
    azimuth: number;
    moduleEfficiency: number;
    losses: number;
    arrayType: number;
    latitude: number;
    longitude: number;
    timezone: string;
    dcAcRatio: number;
    inverterCount: number;
    manualDcAcRatio?: number;
  };
  
  // Selected Components
  selected_panel?: any;
  selected_inverter?: any;
  
  // Area Design
  polygon_configs?: any[];
  
  // DC Configuration
  dc_config?: {
    totalStringCount: number;
    averageStringVoltage: number;
    averageStringCurrent: number;
    centralStringSizingData?: any;
    dcStringCableData?: any;
    dcdbCableData?: any;
    manualInverterCount?: number;
    isCentralInverter?: boolean;
    stringSizingSubArrays?: any[];
    stringSizingInverterConfigs?: any[];
  };
  
  // AC Configuration
  ac_configuration?: any;
  
  // Losses
  detailed_losses?: Record<string, number>;
  
  // Solar Results
  solar_results?: any;
  
  // BOQ Data
  consolidated_boq?: any[];
  boq_cost_summary?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comprehensive_boq_data?: any;
  
  // Financial Data
  financial_params?: any;
  financial_results?: any;
  
  // AI Report Data
  ai_report_form?: any;
  ai_executive_summary?: string;
  
  // Images
  captured_map_image?: string;
  captured_sld_image?: string;
  sld_metadata?: any;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
  last_saved_tab?: string;
  progress_percentage?: number;
}

export class AdvancedCalculatorProjectService {
  /**
   * Save or update a project
   */
  static async saveProject(
    project: AdvancedCalculatorProject,
    userId: string
  ): Promise<{ success: boolean; projectId?: string; error?: string }> {
    try {
      console.log('🔄 Saving project...', { projectName: project.project_name, status: project.status });

      const projectData = {
        user_id: userId,
        project_name: project.project_name,
        status: project.status,
        location: project.location,
        system_params: project.system_params,
        selected_panel: project.selected_panel,
        selected_inverter: project.selected_inverter,
        polygon_configs: project.polygon_configs,
        dc_config: project.dc_config,
        ac_configuration: project.ac_configuration,
        detailed_losses: project.detailed_losses,
        solar_results: project.solar_results,
        consolidated_boq: project.consolidated_boq,
        boq_cost_summary: project.boq_cost_summary,
        comprehensive_boq_data: project.comprehensive_boq_data,
        financial_params: project.financial_params,
        financial_results: project.financial_results,
        ai_report_form: project.ai_report_form,
        ai_executive_summary: project.ai_executive_summary,
        captured_map_image: project.captured_map_image,
        captured_sld_image: project.captured_sld_image,
        sld_metadata: project.sld_metadata,
        last_saved_tab: project.last_saved_tab,
        progress_percentage: project.progress_percentage || 0,
      };

      let result;

      if (project.id) {
        // Update existing project
        result = await supabase
          .from('advanced_calculator_projects')
          .update(projectData)
          .eq('id', project.id)
          .eq('user_id', userId)
          .select()
          .single();
      } else {
        // Insert new project
        result = await supabase
          .from('advanced_calculator_projects')
          .insert(projectData)
          .select()
          .single();
      }

      if (result.error) {
        console.error('❌ Error saving project:', result.error);
        return { success: false, error: result.error.message };
      }

      console.log('✅ Project saved successfully:', result.data.id);
      return { success: true, projectId: result.data.id };
    } catch (error: any) {
      console.error('❌ Exception saving project:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load a specific project by ID
   */
  static async loadProject(projectId: string, userId: string): Promise<{ 
    success: boolean; 
    project?: AdvancedCalculatorProject; 
    error?: string 
  }> {
    try {
      console.log('🔄 Loading project...', { projectId });

      const { data, error } = await supabase
        .from('advanced_calculator_projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ Error loading project:', error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'Project not found' };
      }

      console.log('✅ Project loaded successfully');
      return { success: true, project: data as AdvancedCalculatorProject };
    } catch (error: any) {
      console.error('❌ Exception loading project:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all projects for a user
   */
  static async getUserProjects(userId: string): Promise<{
    success: boolean;
    projects?: AdvancedCalculatorProject[];
    error?: string;
  }> {
    try {
      console.log('🔄 Fetching user projects...');

      const { data, error } = await supabase
        .from('advanced_calculator_projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching projects:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Fetched projects:', data.length);
      return { success: true, projects: data as AdvancedCalculatorProject[] };
    } catch (error: any) {
      console.error('❌ Exception fetching projects:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a project
   */
  static async deleteProject(projectId: string, userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('🔄 Deleting project...', { projectId });

      const { error } = await supabase
        .from('advanced_calculator_projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error deleting project:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Project deleted successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Exception deleting project:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate progress percentage based on completed tabs
   */
  static calculateProgress(project: Partial<AdvancedCalculatorProject>): number {
    const steps = [
      { key: 'location', weight: 10 },
      { key: 'selected_panel', weight: 10 },
      { key: 'polygon_configs', weight: 15 },
      { key: 'dc_config', weight: 15 },
      { key: 'ac_configuration', weight: 10 },
      { key: 'detailed_losses', weight: 5 },
      { key: 'solar_results', weight: 10 },
      { key: 'consolidated_boq', weight: 10 },
      { key: 'financial_results', weight: 10 },
      { key: 'ai_executive_summary', weight: 5 },
    ];

    let completedWeight = 0;
    const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0);

    steps.forEach(step => {
      const value = (project as any)[step.key];
      if (value && (Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0 || typeof value === 'string')) {
        completedWeight += step.weight;
      }
    });

    return Math.round((completedWeight / totalWeight) * 100);
  }
}

