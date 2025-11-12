// Supabase Types for BOQ System
// Database schema for storing BOQ runs, prompts, and results

// LLM Response structure (varies by provider)
export interface LLMResponse {
  content?: string;
  text?: string;
  message?: string;
  usage?: {
    total_tokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  model?: string;
  finish_reason?: string;
  [key: string]: unknown; // Allow additional provider-specific fields
}

// HTTP Headers structure
export interface HTTPHeaders {
  'content-type'?: string;
  'authorization'?: string;
  'user-agent'?: string;
  'x-request-id'?: string;
  'x-ratelimit-remaining'?: string;
  'x-ratelimit-reset'?: string;
  [key: string]: string | undefined; // Allow additional headers
}

export interface BOQRun {
  id: string;
  project_id: string;
  user_id: string;
  calculation_type: 'LV' | 'HV_String' | 'HV_Central';
  
  // Prompt and inputs
  prompt_text: string;
  inputs_block: string;
  token_estimate: number;
  
  // LLM request metadata  
  ai_model: 'openai' | 'gemini';
  temperature: number;
  max_tokens: number;
  
  // Processing status
  status: 'pending' | 'completed' | 'failed_llm_non_compliant' | 'failed_parsing' | 'failed_network';
  retry_count: number;
  
  // LLM responses (for all attempts)
  llm_response_raw: string | null;
  last_response: LLMResponse | null;
  
  // Parsed results
  parsed_boq_json: ParsedBOQRow[] | null;
  validation_errors: string[] | null;
  validation_warnings: string[] | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  
  // Audit trail
  request_headers: HTTPHeaders | null;
  response_headers: HTTPHeaders | null;
  total_tokens_used: number | null;
  processing_time_ms: number | null;
}

export interface BOQExportRecord {
  id: string;
  run_id: string;
  export_format: 'csv' | 'excel' | 'json';
  file_path: string | null;
  download_count: number;
  created_at: string;
}

export interface ParsedBOQRow {
  description: string;
  specifications: string;
  qty: string;
  unit: string;
}

// Input types for creating new runs
export interface CreateBOQRunInput {
  project_id: string;
  user_id: string;
  calculation_type: 'LV' | 'HV_String' | 'HV_Central';
  prompt_text: string;
  inputs_block: string;
  token_estimate: number;
  ai_model: 'openai' | 'gemini';
  temperature: number;
  max_tokens: number;
}

export interface UpdateBOQRunInput {
  id: string;
  status?: BOQRun['status'];
  retry_count?: number;
  llm_response_raw?: string;
  last_response?: LLMResponse;
  parsed_boq_json?: ParsedBOQRow[];
  validation_errors?: string[];
  validation_warnings?: string[];
  completed_at?: string;
  request_headers?: HTTPHeaders;
  response_headers?: HTTPHeaders;
  total_tokens_used?: number;
  processing_time_ms?: number;
}
