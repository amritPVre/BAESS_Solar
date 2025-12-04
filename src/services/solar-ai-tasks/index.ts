// Solar AI Task Handlers - Main Export File
// Provides task-specific handlers with formulas, validation, and calculation logic

import { CalculationType } from '@/types/solar-ai-chat';
import { BaseTaskHandler } from './base-task-handler';
import { TaskHandlerConfig } from './types';

// Import all task handlers
import { pvSizingTask, PVSizingTaskHandler } from './pv-sizing.task';
import { cableSizingTask, CableSizingTaskHandler } from './cable-sizing.task';
import { financialAnalysisTask, FinancialAnalysisTaskHandler } from './financial-analysis.task';
import { batterySizingTask, BatterySizingTaskHandler } from './battery-sizing.task';
import { inverterSizingTask, InverterSizingTaskHandler } from './inverter-sizing.task';
import { carbonOffsetTask, CarbonOffsetTaskHandler } from './carbon-offset.task';
import { irradianceCalculationTask, IrradianceCalculationTaskHandler } from './irradiance-calculation.task';
import { loadAnalysisTask, LoadAnalysisTaskHandler } from './load-analysis.task';
import { paybackAnalysisTask, PaybackAnalysisTaskHandler } from './payback-analysis.task';
import { roiCalculationTask, ROICalculationTaskHandler } from './roi-calculation.task';
import { energyProductionTask, EnergyProductionTaskHandler } from './energy-production.task';
import { stringConfigurationTask, StringConfigurationTaskHandler } from './string-configuration.task';
import { tiltOptimizationTask, TiltOptimizationTaskHandler } from './tilt-optimization.task';
import { dcCableSizingTask, DCCableSizingTaskHandler } from './dc-cable-sizing.task';
import { earthingSizingTask, EarthingSizingTaskHandler } from './earthing-sizing.task';

// Re-export types
export * from './types';
export { BaseTaskHandler } from './base-task-handler';

// Re-export task handlers
export {
  pvSizingTask,
  PVSizingTaskHandler,
  cableSizingTask,
  CableSizingTaskHandler,
  financialAnalysisTask,
  FinancialAnalysisTaskHandler,
  batterySizingTask,
  BatterySizingTaskHandler,
  inverterSizingTask,
  InverterSizingTaskHandler,
  carbonOffsetTask,
  CarbonOffsetTaskHandler,
  irradianceCalculationTask,
  IrradianceCalculationTaskHandler,
  loadAnalysisTask,
  LoadAnalysisTaskHandler,
  paybackAnalysisTask,
  PaybackAnalysisTaskHandler,
  roiCalculationTask,
  ROICalculationTaskHandler,
  energyProductionTask,
  EnergyProductionTaskHandler,
  stringConfigurationTask,
  StringConfigurationTaskHandler,
  tiltOptimizationTask,
  TiltOptimizationTaskHandler,
  dcCableSizingTask,
  DCCableSizingTaskHandler,
  earthingSizingTask,
  EarthingSizingTaskHandler,
};

/**
 * Registry of all task handlers by calculation type
 */
const TASK_HANDLERS: Partial<Record<CalculationType, BaseTaskHandler>> = {
  pv_sizing: pvSizingTask,
  cable_sizing: cableSizingTask,
  financial_analysis: financialAnalysisTask,
  battery_sizing: batterySizingTask,
  inverter_sizing: inverterSizingTask,
  carbon_offset: carbonOffsetTask,
  irradiance_calculation: irradianceCalculationTask,
  load_analysis: loadAnalysisTask,
  payback_analysis: paybackAnalysisTask,
  roi_calculation: roiCalculationTask,
  energy_production: energyProductionTask,
  string_configuration: stringConfigurationTask,
  tilt_optimization: tiltOptimizationTask,
  dc_cable_sizing: dcCableSizingTask,
  earthing_sizing: earthingSizingTask,
};

/**
 * Get task handler for a specific calculation type
 * @param calculationType The type of calculation
 * @returns The task handler or undefined if not implemented
 */
export function getTaskHandler(calculationType: CalculationType): BaseTaskHandler | undefined {
  return TASK_HANDLERS[calculationType];
}

/**
 * Get task configuration for a specific calculation type
 * @param calculationType The type of calculation
 * @returns The task configuration or undefined if not implemented
 */
export function getTaskConfig(calculationType: CalculationType): TaskHandlerConfig | undefined {
  const handler = TASK_HANDLERS[calculationType];
  return handler?.getConfig();
}

/**
 * Get the system prompt for a specific calculation type
 * Uses the enhanced task handler if available, falls back to basic prompt
 * @param calculationType The type of calculation
 * @returns The system prompt string
 */
export function getEnhancedSystemPrompt(calculationType: CalculationType): string | undefined {
  const handler = TASK_HANDLERS[calculationType];
  return handler?.getSystemPrompt();
}

/**
 * Get the full AI prompt including all context for a calculation
 * @param calculationType The type of calculation
 * @param userInputs Current user input
 * @param conversationContext Previous conversation history
 * @returns Complete prompt for AI
 */
export function buildCalculationPrompt(
  calculationType: CalculationType,
  userInputs: string,
  conversationContext: string
): string | undefined {
  const handler = TASK_HANDLERS[calculationType];
  return handler?.buildPrompt(userInputs, conversationContext);
}

/**
 * Get required inputs for a calculation type
 * @param calculationType The type of calculation
 * @returns Array of required input names
 */
export function getRequiredInputs(calculationType: CalculationType): string[] {
  const handler = TASK_HANDLERS[calculationType];
  return handler?.getRequiredInputs() || [];
}

/**
 * Get input definitions formatted for display
 * @param calculationType The type of calculation
 * @returns Formatted string of input definitions
 */
export function getInputDefinitions(calculationType: CalculationType): string {
  const handler = TASK_HANDLERS[calculationType];
  return handler?.getInputDefinitions() || '';
}

/**
 * Get formulas description for a calculation type
 * @param calculationType The type of calculation
 * @returns Formatted string of formulas
 */
export function getFormulasDescription(calculationType: CalculationType): string {
  const handler = TASK_HANDLERS[calculationType];
  return handler?.getFormulasDescription() || '';
}

/**
 * Check if a task handler is implemented for a calculation type
 * @param calculationType The type of calculation
 * @returns true if handler exists
 */
export function hasTaskHandler(calculationType: CalculationType): boolean {
  return calculationType in TASK_HANDLERS;
}

/**
 * Get list of all implemented calculation types
 * @returns Array of implemented calculation types
 */
export function getImplementedCalculationTypes(): CalculationType[] {
  return Object.keys(TASK_HANDLERS) as CalculationType[];
}

/**
 * Get all task handlers
 * @returns Map of calculation type to handler
 */
export function getAllTaskHandlers(): Partial<Record<CalculationType, BaseTaskHandler>> {
  return { ...TASK_HANDLERS };
}

