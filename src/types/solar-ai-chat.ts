// Types for Solar AI Chat Application

export type CalculationType = 
  | 'pv_sizing'
  | 'financial_analysis'
  | 'irradiance_calculation'
  | 'cable_sizing'
  | 'inverter_sizing'
  | 'battery_sizing'
  | 'load_analysis'
  | 'payback_analysis'
  | 'roi_calculation'
  | 'carbon_offset'
  | 'energy_production'
  | 'system_losses'
  | 'string_configuration'
  | 'shading_analysis'
  | 'tilt_optimization';

export interface CalculationTask {
  id: CalculationType;
  name: string;
  description: string;
  category: 'sizing' | 'financial' | 'technical' | 'environmental';
  icon: string;
  requiredInputs: string[];
  outputFormat: 'table' | 'chart' | 'report' | 'mixed';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  calculationType?: CalculationType;
  artifactData?: ArtifactData;
}

export interface ArtifactData {
  type: 'calculation' | 'chart' | 'table' | 'report';
  title: string;
  data: any;
  calculationType: CalculationType;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  calculationType?: CalculationType;
  projectName?: string;
}

export interface CalculationInput {
  [key: string]: number | string | boolean;
}

export interface CalculationResult {
  success: boolean;
  data?: any;
  error?: string;
  insights?: string[];
  recommendations?: string[];
}

export interface ExportOptions {
  format: 'pdf' | 'excel';
  includeCharts: boolean;
  includeInsights: boolean;
  includeRecommendations: boolean;
}

