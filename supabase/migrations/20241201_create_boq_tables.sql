-- Create BOQ system tables with admin and user support
-- Migration: 20241201_create_boq_tables.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main BOQ runs table
CREATE TABLE IF NOT EXISTS public.boq_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  calculation_type TEXT NOT NULL CHECK (calculation_type IN ('LV', 'HV_String', 'HV_Central')),
  
  -- Prompt and input data
  prompt_text TEXT NOT NULL,
  inputs_block TEXT NOT NULL,
  token_estimate INTEGER NOT NULL DEFAULT 0,
  
  -- LLM configuration
  ai_model TEXT NOT NULL CHECK (ai_model IN ('openai', 'gemini')),
  temperature DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  max_tokens INTEGER NOT NULL DEFAULT 1500,
  
  -- Processing status and results  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed_llm_non_compliant', 'failed_parsing', 'failed_network')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  
  -- LLM responses
  llm_response_raw TEXT,
  last_response JSONB,
  
  -- Parsed BOQ results
  parsed_boq_json JSONB,
  validation_errors TEXT[],
  validation_warnings TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Audit trail
  request_headers JSONB,
  response_headers JSONB,
  total_tokens_used INTEGER,
  processing_time_ms INTEGER
);

-- BOQ export tracking table
CREATE TABLE IF NOT EXISTS public.boq_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES public.boq_runs(id) ON DELETE CASCADE,
  export_format TEXT NOT NULL CHECK (export_format IN ('csv', 'excel', 'json')),
  file_path TEXT,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_boq_runs_project_user ON public.boq_runs (project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_boq_runs_status ON public.boq_runs (status);
CREATE INDEX IF NOT EXISTS idx_boq_runs_created_at ON public.boq_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_boq_runs_calculation_type ON public.boq_runs (calculation_type);
CREATE INDEX IF NOT EXISTS idx_boq_runs_user_id ON public.boq_runs (user_id);
CREATE INDEX IF NOT EXISTS idx_boq_exports_run_id ON public.boq_exports (run_id);

-- Enable Row Level Security
ALTER TABLE public.boq_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boq_exports ENABLE ROW LEVEL SECURITY;

-- Grant access to service role for management (admin access)
GRANT ALL ON public.boq_runs TO service_role;
GRANT ALL ON public.boq_exports TO service_role;

-- Grant access to authenticated users for basic operations
GRANT SELECT, INSERT, UPDATE ON public.boq_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.boq_exports TO authenticated;

-- RLS Policies for BOQ runs
-- Policy 1: Users can view their own BOQ runs
CREATE POLICY "Users can view own BOQ runs" ON public.boq_runs
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid()::text = user_id 
    OR 
    -- Admin users can view all (check if user has admin role)
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.email LIKE '%@admin.%'
           OR auth.users.raw_user_meta_data->>'user_type' = 'admin')
    )
  );

-- Policy 2: Users can insert their own BOQ runs (including admin)
CREATE POLICY "Users can insert BOQ runs" ON public.boq_runs
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid()::text = user_id
    OR
    -- Admin can insert for any user
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.email LIKE '%@admin.%'
           OR auth.users.raw_user_meta_data->>'user_type' = 'admin')
    )
  );

-- Policy 3: Users can update their own BOQ runs (including admin)
CREATE POLICY "Users can update BOQ runs" ON public.boq_runs
  FOR UPDATE 
  TO authenticated
  USING (
    auth.uid()::text = user_id
    OR
    -- Admin can update any runs
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.email LIKE '%@admin.%'
           OR auth.users.raw_user_meta_data->>'user_type' = 'admin')
    )
  );

-- Policy 4: Users can delete their own BOQ runs (admin can delete any)
CREATE POLICY "Users can delete BOQ runs" ON public.boq_runs
  FOR DELETE 
  TO authenticated
  USING (
    auth.uid()::text = user_id
    OR
    -- Admin can delete any runs
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.email LIKE '%@admin.%'
           OR auth.users.raw_user_meta_data->>'user_type' = 'admin')
    )
  );

-- RLS Policies for BOQ exports
-- Policy 5: Users can view exports for their own BOQ runs (admin can view all)
CREATE POLICY "Users can view BOQ exports" ON public.boq_exports
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid()::text = (SELECT user_id FROM public.boq_runs WHERE id = run_id)
    OR
    -- Admin can view all exports
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.email LIKE '%@admin.%'
           OR auth.users.raw_user_meta_data->>'user_type' = 'admin')
    )
  );

-- Policy 6: Users can create exports for their own BOQ runs (admin for any)
CREATE POLICY "Users can insert BOQ exports" ON public.boq_exports
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid()::text = (SELECT user_id FROM public.boq_runs WHERE id = run_id)
    OR
    -- Admin can create exports for any runs
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.email LIKE '%@admin.%'
           OR auth.users.raw_user_meta_data->>'user_type' = 'admin')
    )
  );

-- Function to update the updated_at timestamp (reuse existing if available)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update the updated_at timestamp
CREATE TRIGGER update_boq_runs_updated_at
BEFORE UPDATE ON public.boq_runs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_boq_exports_updated_at
BEFORE UPDATE ON public.boq_exports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a view for easy BOQ run queries with user info (admin convenience)
CREATE OR REPLACE VIEW public.boq_runs_with_user_info AS
SELECT 
  br.*,
  au.email as user_email,
  au.raw_user_meta_data->>'role' as user_role,
  au.raw_user_meta_data->>'user_type' as user_type
FROM public.boq_runs br
LEFT JOIN auth.users au ON au.id::text = br.user_id;

-- Grant view access
GRANT SELECT ON public.boq_runs_with_user_info TO authenticated;
GRANT SELECT ON public.boq_runs_with_user_info TO service_role;

-- Enable Realtime for live updates (optional)
ALTER PUBLICATION supabase_realtime ADD TABLE public.boq_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.boq_exports;
