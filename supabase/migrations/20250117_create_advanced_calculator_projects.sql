-- Create table for Advanced Solar Calculator Projects
CREATE TABLE IF NOT EXISTS public.advanced_calculator_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  
  -- Location Data
  location JSONB,
  
  -- System Configuration
  system_params JSONB,
  
  -- Selected Components
  selected_panel JSONB,
  selected_inverter JSONB,
  
  -- Area Design
  polygon_configs JSONB,
  
  -- DC Configuration
  dc_config JSONB,
  
  -- AC Configuration
  ac_configuration JSONB,
  
  -- Losses
  detailed_losses JSONB,
  
  -- Solar Results (from PVWatts)
  solar_results JSONB,
  
  -- BOQ Data
  consolidated_boq JSONB,
  boq_cost_summary JSONB,
  
  -- Financial Data
  financial_params JSONB,
  financial_results JSONB,
  
  -- AI Report Data
  ai_report_form JSONB,
  ai_executive_summary TEXT,
  
  -- Map & SLD Images
  captured_map_image TEXT,
  captured_sld_image TEXT,
  sld_metadata JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_saved_tab TEXT,
  progress_percentage INTEGER DEFAULT 0
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_advanced_projects_user_id ON public.advanced_calculator_projects(user_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_advanced_projects_status ON public.advanced_calculator_projects(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_advanced_projects_created_at ON public.advanced_calculator_projects(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.advanced_calculator_projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own projects"
  ON public.advanced_calculator_projects
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON public.advanced_calculator_projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.advanced_calculator_projects
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.advanced_calculator_projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_advanced_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER update_advanced_projects_updated_at
  BEFORE UPDATE ON public.advanced_calculator_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_advanced_projects_updated_at();

-- Add comment to table
COMMENT ON TABLE public.advanced_calculator_projects IS 'Stores comprehensive project data for Advanced Solar Calculator';

