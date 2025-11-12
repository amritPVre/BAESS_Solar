// Supabase BOQ Service
// Database operations for BOQ runs and results
// Implements persistence layer for the BOQ workflow

import { createClient } from '@supabase/supabase-js';
import { BOQRun, CreateBOQRunInput, UpdateBOQRunInput, ParsedBOQRow } from '../types/supabase-boq';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Save initial BOQ run as draft record with pending status
 * Returns the run ID for subsequent updates
 */
export async function saveBoqRunToSupabase(input: CreateBOQRunInput): Promise<string> {
  console.log('💾 Saving BOQ run to Supabase...');
  console.log('📊 Input:', {
    project_id: input.project_id,
    user_id: input.user_id,
    calculation_type: input.calculation_type,
    ai_model: input.ai_model,
    token_estimate: input.token_estimate
  });
  
  try {
    const runData = {
      project_id: input.project_id,
      user_id: input.user_id,
      calculation_type: input.calculation_type,
      prompt_text: input.prompt_text,
      inputs_block: input.inputs_block,
      token_estimate: input.token_estimate,
      ai_model: input.ai_model,
      temperature: input.temperature,
      max_tokens: input.max_tokens,
      status: 'pending' as const,
      retry_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('boq_runs')
      .insert([runData])
      .select('id')
      .single();
    
    if (error) {
      console.error('❌ Supabase insert error:', error);
      throw new Error(`Failed to save BOQ run: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned from Supabase insert');
    }
    
    console.log('✅ BOQ run saved with ID:', data.id);
    return data.id;
    
  } catch (error) {
    console.error('❌ Error saving BOQ run:', error);
    throw error;
  }
}

/**
 * Update existing BOQ run with new data
 */
export async function updateBoqRun(runId: string, updates: Partial<UpdateBOQRunInput>): Promise<void> {
  console.log('🔄 Updating BOQ run:', runId);
  console.log('📝 Updates:', Object.keys(updates));
  
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('boq_runs')
      .update(updateData)
      .eq('id', runId);
    
    if (error) {
      console.error('❌ Supabase update error:', error);
      throw new Error(`Failed to update BOQ run: ${error.message}`);
    }
    
    console.log('✅ BOQ run updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating BOQ run:', error);
    throw error;
  }
}

/**
 * Get BOQ run by ID
 */
export async function getBOQRun(runId: string): Promise<BOQRun | null> {
  console.log('📖 Fetching BOQ run:', runId);
  
  try {
    const { data, error } = await supabase
      .from('boq_runs')
      .select('*')
      .eq('id', runId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('❌ Supabase select error:', error);
      throw new Error(`Failed to fetch BOQ run: ${error.message}`);
    }
    
    console.log('✅ BOQ run fetched successfully');
    return data as BOQRun;
    
  } catch (error) {
    console.error('❌ Error fetching BOQ run:', error);
    throw error;
  }
}

/**
 * Get BOQ runs for a project with optional filtering
 */
export async function getBOQRunsForProject(
  projectId: string, 
  options?: {
    userId?: string;
    status?: BOQRun['status'];
    calculationType?: BOQRun['calculation_type'];
    limit?: number;
  }
): Promise<BOQRun[]> {
  console.log('📋 Fetching BOQ runs for project:', projectId);
  console.log('🔍 Options:', options);
  
  try {
    let query = supabase
      .from('boq_runs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }
    
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    
    if (options?.calculationType) {
      query = query.eq('calculation_type', options.calculationType);
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Supabase select error:', error);
      throw new Error(`Failed to fetch BOQ runs: ${error.message}`);
    }
    
    console.log('✅ Found', data?.length || 0, 'BOQ runs');
    return (data || []) as BOQRun[];
    
  } catch (error) {
    console.error('❌ Error fetching BOQ runs:', error);
    throw error;
  }
}

/**
 * Delete BOQ run and associated data
 */
export async function deleteBOQRun(runId: string): Promise<void> {
  console.log('🗑️ Deleting BOQ run:', runId);
  
  try {
    const { error } = await supabase
      .from('boq_runs')
      .delete()
      .eq('id', runId);
    
    if (error) {
      console.error('❌ Supabase delete error:', error);
      throw new Error(`Failed to delete BOQ run: ${error.message}`);
    }
    
    console.log('✅ BOQ run deleted successfully');
    
  } catch (error) {
    console.error('❌ Error deleting BOQ run:', error);
    throw error;
  }
}

/**
 * Get recent successful BOQ runs for reference
 */
export async function getRecentSuccessfulRuns(
  calculationType: BOQRun['calculation_type'],
  limit: number = 5
): Promise<BOQRun[]> {
  console.log('📈 Fetching recent successful runs for:', calculationType);
  
  try {
    const { data, error } = await supabase
      .from('boq_runs')
      .select('*')
      .eq('calculation_type', calculationType)
      .eq('status', 'completed')
      .not('parsed_boq_json', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('❌ Supabase select error:', error);
      throw new Error(`Failed to fetch successful runs: ${error.message}`);
    }
    
    console.log('✅ Found', data?.length || 0, 'successful runs');
    return (data || []) as BOQRun[];
    
  } catch (error) {
    console.error('❌ Error fetching successful runs:', error);
    throw error;
  }
}

/**
 * Check if Supabase is configured and accessible
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials not configured');
    return false;
  }
  
  try {
    // Try to connect to Supabase with a simple query that doesn't require specific tables
    const { data, error } = await supabase
      .from('circuit_breakers') // Use existing table from your migrations
      .select('count')
      .limit(1);
    
    if (error) {
      console.warn('⚠️ Supabase connection test with circuit_breakers failed:', error.message);
      
      // Try alternative connection test - just check if we can connect
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError && userError.message !== 'Auth session missing!') {
          console.error('❌ Supabase auth connection failed:', userError);
          return false;
        }
        console.log('✅ Supabase connection successful (auth check)');
        return true;
      } catch (authError) {
        console.error('❌ Supabase connection error:', authError);
        return false;
      }
    }
    
    console.log('✅ Supabase connection successful');
    return true;
    
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
}

/**
 * Initialize Supabase tables if they don't exist
 * This is a helper function for development
 */
export async function initializeBOQTables(): Promise<void> {
  console.log('🏗️ Initializing BOQ tables (development helper)...');
  
  // Note: In production, tables should be created via Supabase migrations
  // This is just a development helper
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS boq_runs (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      calculation_type TEXT NOT NULL CHECK (calculation_type IN ('LV', 'HV_String', 'HV_Central')),
      
      prompt_text TEXT NOT NULL,
      inputs_block TEXT NOT NULL,
      token_estimate INTEGER NOT NULL DEFAULT 0,
      
      ai_model TEXT NOT NULL CHECK (ai_model IN ('openai', 'gemini')),
      temperature DECIMAL(3,2) NOT NULL DEFAULT 0.0,
      max_tokens INTEGER NOT NULL DEFAULT 1500,
      
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed_llm_non_compliant', 'failed_parsing', 'failed_network')),
      retry_count INTEGER NOT NULL DEFAULT 0,
      
      llm_response_raw TEXT,
      last_response JSONB,
      
      parsed_boq_json JSONB,
      validation_errors TEXT[],
      validation_warnings TEXT[],
      
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      completed_at TIMESTAMP WITH TIME ZONE,
      
      request_headers JSONB,
      response_headers JSONB,
      total_tokens_used INTEGER,
      processing_time_ms INTEGER
    );
    
    CREATE INDEX IF NOT EXISTS idx_boq_runs_project_user ON boq_runs (project_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_boq_runs_status ON boq_runs (status);
    CREATE INDEX IF NOT EXISTS idx_boq_runs_created_at ON boq_runs (created_at DESC);
  `;
  
  // Note: This would need to be executed via Supabase SQL editor or migrations
  console.log('📝 Table creation SQL prepared. Execute via Supabase SQL editor:');
  console.log(createTableSQL);
}
