
import { useState, useCallback, useContext, createContext, ReactNode } from "react";
import { useAuth } from "./useAuth";
import { SolarProject } from "@/types/solarProject";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SolarProjectsContextType {
  projects: SolarProject[];
  loading: boolean;
  error: string | null;
  loadProjects: () => Promise<void>;
  getProject: (id: string) => Promise<SolarProject>;
  saveProject: (project: Omit<SolarProject, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<SolarProject>;
  updateProject: (project: SolarProject) => Promise<SolarProject>;
  deleteProject: (id: string) => Promise<void>;
}

const SolarProjectsContext = createContext<SolarProjectsContextType | null>(null);

export const SolarProjectsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<SolarProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProjects([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Convert database format to SolarProject format
      const formattedProjects: SolarProject[] = data.map(project => ({
        id: project.id,
        userId: project.user_id,
        name: project.name,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        clientName: project.client_name,
        clientEmail: project.client_email || '',
        clientPhone: project.client_phone || '',
        clientAddress: project.client_address || '',
        companyName: project.company_name || '',
        companyContact: project.company_contact || '',
        companyEmail: project.company_email || '',
        companyPhone: project.company_phone || '',
        knowsAnnualEnergy: project.knows_annual_energy,
        manualAnnualEnergy: Number(project.manual_annual_energy) || 0,
        annualEnergy: Number(project.annual_energy) || 0,
        systemSize: Number(project.system_size),
        panelType: project.panel_type || '',
        panelEfficiency: Number(project.panel_efficiency) || 0,
        inverterType: project.inverter_type || '',
        inverterEfficiency: Number(project.inverter_efficiency) || 0,
        roofType: project.roof_type || '',
        roofAngle: Number(project.roof_angle) || 0,
        orientation: project.orientation || '',
        solarIrradiance: Number(project.solar_irradiance) || 0,
        shadingFactor: Number(project.shading_factor) || 0,
        location: project.location || { lat: 0, lng: 0 },
        timezone: project.timezone || '',
        country: project.country || '',
        city: project.city || '',
        systemCost: Number(project.system_cost),
        electricityRate: Number(project.electricity_rate),
        electricityEscalationRate: Number(project.electricity_escalation_rate) || 0,
        incentives: Number(project.incentives) || 0,
        financingOption: project.financing_option || '',
        loanTerm: Number(project.loan_term) || 0,
        interestRate: Number(project.interest_rate) || 0,
        maintenanceCost: Number(project.maintenance_cost) || 0,
        maintenanceEscalationRate: Number(project.maintenance_escalation_rate) || 0,
        degradationRate: Number(project.degradation_rate) || 0,
        discountRate: Number(project.discount_rate) || 0,
        lcoe: Number(project.lcoe) || 0,
        annualRevenue: Number(project.annual_revenue) || 0,
        annualCost: Number(project.annual_cost) || 0,
        netPresentValue: Number(project.net_present_value) || 0,
        irr: Number(project.irr) || 0,
        paybackPeriod: project.payback_period || { years: 0, months: 0 },
        co2Reduction: Number(project.co2_reduction) || 0,
        treesEquivalent: Number(project.trees_equivalent) || 0,
        vehicleMilesOffset: Number(project.vehicle_miles_offset) || 0,
        yearlyProduction: project.yearly_production || [],
        yearlyCashFlow: project.yearly_cash_flow || [],
        cumulativeCashFlow: project.cumulative_cash_flow || [],
      }));
      
      setProjects(formattedProjects);
    } catch (err: any) {
      console.error("Failed to load projects:", err);
      setError("Failed to load projects: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  const getProject = useCallback(async (id: string): Promise<SolarProject> => {
    if (!isAuthenticated || !user) {
      throw new Error("User not authenticated");
    }
    
    try {
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (!data) {
        throw new Error("Project not found");
      }
      
      // Convert database format to SolarProject format
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        clientName: data.client_name,
        clientEmail: data.client_email || '',
        clientPhone: data.client_phone || '',
        clientAddress: data.client_address || '',
        companyName: data.company_name || '',
        companyContact: data.company_contact || '',
        companyEmail: data.company_email || '',
        companyPhone: data.company_phone || '',
        knowsAnnualEnergy: data.knows_annual_energy,
        manualAnnualEnergy: Number(data.manual_annual_energy) || 0,
        annualEnergy: Number(data.annual_energy) || 0,
        systemSize: Number(data.system_size),
        panelType: data.panel_type || '',
        panelEfficiency: Number(data.panel_efficiency) || 0,
        inverterType: data.inverter_type || '',
        inverterEfficiency: Number(data.inverter_efficiency) || 0,
        roofType: data.roof_type || '',
        roofAngle: Number(data.roof_angle) || 0,
        orientation: data.orientation || '',
        solarIrradiance: Number(data.solar_irradiance) || 0,
        shadingFactor: Number(data.shading_factor) || 0,
        location: data.location || { lat: 0, lng: 0 },
        timezone: data.timezone || '',
        country: data.country || '',
        city: data.city || '',
        systemCost: Number(data.system_cost),
        electricityRate: Number(data.electricity_rate),
        electricityEscalationRate: Number(data.electricity_escalation_rate) || 0,
        incentives: Number(data.incentives) || 0,
        financingOption: data.financing_option || '',
        loanTerm: Number(data.loan_term) || 0,
        interestRate: Number(data.interest_rate) || 0,
        maintenanceCost: Number(data.maintenance_cost) || 0,
        maintenanceEscalationRate: Number(data.maintenance_escalation_rate) || 0,
        degradationRate: Number(data.degradation_rate) || 0,
        discountRate: Number(data.discount_rate) || 0,
        lcoe: Number(data.lcoe) || 0,
        annualRevenue: Number(data.annual_revenue) || 0,
        annualCost: Number(data.annual_cost) || 0,
        netPresentValue: Number(data.net_present_value) || 0,
        irr: Number(data.irr) || 0,
        paybackPeriod: data.payback_period || { years: 0, months: 0 },
        co2Reduction: Number(data.co2_reduction) || 0,
        treesEquivalent: Number(data.trees_equivalent) || 0,
        vehicleMilesOffset: Number(data.vehicle_miles_offset) || 0,
        yearlyProduction: data.yearly_production || [],
        yearlyCashFlow: data.yearly_cash_flow || [],
        cumulativeCashFlow: data.cumulative_cash_flow || [],
      };
    } catch (err: any) {
      console.error("Failed to get project:", err);
      throw new Error("Failed to get project: " + err.message);
    }
  }, [user, isAuthenticated]);

  const saveProject = useCallback(async (projectData: Omit<SolarProject, "id" | "userId" | "createdAt" | "updatedAt">): Promise<SolarProject> => {
    if (!isAuthenticated || !user) {
      throw new Error("User not authenticated");
    }
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: projectData.name,
          client_name: projectData.clientName,
          client_email: projectData.clientEmail,
          client_phone: projectData.clientPhone,
          client_address: projectData.clientAddress,
          company_name: projectData.companyName,
          company_contact: projectData.companyContact,
          company_email: projectData.companyEmail,
          company_phone: projectData.companyPhone,
          knows_annual_energy: projectData.knowsAnnualEnergy,
          manual_annual_energy: projectData.manualAnnualEnergy,
          annual_energy: projectData.annualEnergy,
          system_size: projectData.systemSize,
          panel_type: projectData.panelType,
          panel_efficiency: projectData.panelEfficiency,
          inverter_type: projectData.inverterType,
          inverter_efficiency: projectData.inverterEfficiency,
          roof_type: projectData.roofType,
          roof_angle: projectData.roofAngle,
          orientation: projectData.orientation,
          solar_irradiance: projectData.solarIrradiance,
          shading_factor: projectData.shadingFactor,
          location: projectData.location,
          timezone: projectData.timezone,
          country: projectData.country,
          city: projectData.city,
          system_cost: projectData.systemCost,
          electricity_rate: projectData.electricityRate,
          electricity_escalation_rate: projectData.electricityEscalationRate,
          incentives: projectData.incentives,
          financing_option: projectData.financingOption,
          loan_term: projectData.loanTerm,
          interest_rate: projectData.interestRate,
          maintenance_cost: projectData.maintenanceCost,
          maintenance_escalation_rate: projectData.maintenanceEscalationRate,
          degradation_rate: projectData.degradationRate,
          discount_rate: projectData.discountRate,
          currency: user.preferredCurrency,
          lcoe: projectData.lcoe,
          annual_revenue: projectData.annualRevenue,
          annual_cost: projectData.annualCost,
          net_present_value: projectData.netPresentValue,
          irr: projectData.irr,
          payback_period: projectData.paybackPeriod,
          co2_reduction: projectData.co2Reduction,
          trees_equivalent: projectData.treesEquivalent,
          vehicle_miles_offset: projectData.vehicleMilesOffset,
          yearly_production: projectData.yearlyProduction,
          yearly_cash_flow: projectData.yearlyCashFlow,
          cumulative_cash_flow: projectData.cumulativeCashFlow,
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Refresh the projects list
      loadProjects();
      
      // Convert and return the new project
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        ...projectData
      };
    } catch (error: any) {
      console.error("Failed to save project:", error);
      throw error;
    }
  }, [user, isAuthenticated, loadProjects]);

  const updateProject = useCallback(async (projectData: SolarProject): Promise<SolarProject> => {
    if (!isAuthenticated || !user) {
      throw new Error("User not authenticated");
    }
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: projectData.name,
          client_name: projectData.clientName,
          client_email: projectData.clientEmail,
          client_phone: projectData.clientPhone,
          client_address: projectData.clientAddress,
          company_name: projectData.companyName,
          company_contact: projectData.companyContact,
          company_email: projectData.companyEmail,
          company_phone: projectData.companyPhone,
          knows_annual_energy: projectData.knowsAnnualEnergy,
          manual_annual_energy: projectData.manualAnnualEnergy,
          annual_energy: projectData.annualEnergy,
          system_size: projectData.systemSize,
          panel_type: projectData.panelType,
          panel_efficiency: projectData.panelEfficiency,
          inverter_type: projectData.inverterType,
          inverter_efficiency: projectData.inverterEfficiency,
          roof_type: projectData.roofType,
          roof_angle: projectData.roofAngle,
          orientation: projectData.orientation,
          solar_irradiance: projectData.solarIrradiance,
          shading_factor: projectData.shadingFactor,
          location: projectData.location,
          timezone: projectData.timezone,
          country: projectData.country,
          city: projectData.city,
          system_cost: projectData.systemCost,
          electricity_rate: projectData.electricityRate,
          electricity_escalation_rate: projectData.electricityEscalationRate,
          incentives: projectData.incentives,
          financing_option: projectData.financingOption,
          loan_term: projectData.loanTerm,
          interest_rate: projectData.interestRate,
          maintenance_cost: projectData.maintenanceCost,
          maintenance_escalation_rate: projectData.maintenanceEscalationRate,
          degradation_rate: projectData.degradationRate,
          discount_rate: projectData.discountRate,
          currency: user.preferredCurrency,
          lcoe: projectData.lcoe,
          annual_revenue: projectData.annualRevenue,
          annual_cost: projectData.annualCost,
          net_present_value: projectData.netPresentValue,
          irr: projectData.irr,
          payback_period: projectData.paybackPeriod,
          co2_reduction: projectData.co2Reduction,
          trees_equivalent: projectData.treesEquivalent,
          vehicle_miles_offset: projectData.vehicleMilesOffset,
          yearly_production: projectData.yearlyProduction,
          yearly_cash_flow: projectData.yearlyCashFlow,
          cumulative_cash_flow: projectData.cumulativeCashFlow,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectData.id)
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Refresh the projects list
      loadProjects();
      
      return projectData;
    } catch (error: any) {
      console.error("Failed to update project:", error);
      throw error;
    }
  }, [user, isAuthenticated, loadProjects]);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    if (!isAuthenticated || !user) {
      throw new Error("User not authenticated");
    }
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setProjects(prevProjects => prevProjects.filter(p => p.id !== id));
    } catch (error: any) {
      console.error("Failed to delete project:", error);
      throw error;
    }
  }, [user, isAuthenticated]);

  return (
    <SolarProjectsContext.Provider
      value={{
        projects,
        loading,
        error,
        loadProjects,
        getProject,
        saveProject,
        updateProject,
        deleteProject,
      }}
    >
      {children}
    </SolarProjectsContext.Provider>
  );
};

export const useSolarProjects = () => {
  const context = useContext(SolarProjectsContext);
  
  if (!context) {
    throw new Error("useSolarProjects must be used within a SolarProjectsProvider");
  }
  
  return context;
};
