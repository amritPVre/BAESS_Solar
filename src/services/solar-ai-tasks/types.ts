// Types for Solar AI Task Handlers

import { CalculationType } from '@/types/solar-ai-chat';

/**
 * Input parameter definition for a calculation task
 */
export interface TaskInputParameter {
  name: string;
  label: string;
  type: 'number' | 'string' | 'select' | 'array';
  unit?: string;
  required: boolean;
  defaultValue?: number | string;
  options?: string[];  // For select type
  min?: number;
  max?: number;
  description?: string;
}

/**
 * Formula definition used in calculations
 */
export interface TaskFormula {
  name: string;
  expression: string;
  description: string;
  variables: Record<string, string>;  // variable name -> description
  example?: string;
}

/**
 * Database reference for storing/retrieving data
 */
export interface DatabaseReference {
  table: string;
  operation: 'read' | 'write' | 'both';
  description: string;
  fields?: string[];
}

/**
 * External API reference for data retrieval
 */
export interface APIReference {
  name: string;
  endpoint?: string;
  purpose: string;
  dataProvided: string[];
}

/**
 * Standard reference values used in calculations
 */
export interface StandardValue {
  name: string;
  value: number | string;
  unit?: string;
  source: string;
  description: string;
}

/**
 * Validation rule for inputs
 */
export interface ValidationRule {
  field: string;
  rule: 'required' | 'min' | 'max' | 'range' | 'positive' | 'percentage';
  value?: number | [number, number];
  message: string;
}

/**
 * Complete task handler configuration
 */
export interface TaskHandlerConfig {
  id: CalculationType;
  name: string;
  description: string;
  category: 'sizing' | 'financial' | 'technical' | 'environmental';
  
  // Input definitions
  inputs: TaskInputParameter[];
  
  // Calculation formulas
  formulas: TaskFormula[];
  
  // Standard/default values
  standardValues: StandardValue[];
  
  // Validation rules
  validationRules: ValidationRule[];
  
  // Database references
  databaseRefs?: DatabaseReference[];
  
  // External API references
  apiRefs?: APIReference[];
  
  // System prompt for AI
  systemPrompt: string;
  
  // Output format template
  outputTemplate: string;
}

/**
 * Parsed input values from user message
 */
export interface ParsedInputs {
  [key: string]: number | string | number[] | null;
}

/**
 * Calculation result
 */
export interface TaskCalculationResult {
  success: boolean;
  inputs: ParsedInputs;
  outputs: Record<string, number | string>;
  calculations: string[];  // Step-by-step calculations
  assumptions: string[];   // Assumptions made
  insights: string[];      // Key insights
  warnings?: string[];     // Any warnings
}

