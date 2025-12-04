// Base Task Handler - Foundation for all calculation task handlers

import { TaskHandlerConfig, ParsedInputs, TaskCalculationResult, ValidationRule } from './types';

/**
 * Base class for all solar calculation task handlers
 * Provides common functionality for input parsing, validation, and output formatting
 */
export abstract class BaseTaskHandler {
  protected config: TaskHandlerConfig;

  constructor(config: TaskHandlerConfig) {
    this.config = config;
  }

  /**
   * Get the task configuration
   */
  getConfig(): TaskHandlerConfig {
    return this.config;
  }

  /**
   * Get the system prompt for AI
   */
  getSystemPrompt(): string {
    return this.config.systemPrompt;
  }

  /**
   * Get required inputs list
   */
  getRequiredInputs(): string[] {
    return this.config.inputs
      .filter(input => input.required)
      .map(input => input.name);
  }

  /**
   * Get all input definitions
   */
  getInputDefinitions(): string {
    return this.config.inputs
      .map(input => {
        let def = `• ${input.label}`;
        if (input.unit) def += ` (${input.unit})`;
        if (input.required) def += ' [REQUIRED]';
        if (input.defaultValue !== undefined) def += ` [Default: ${input.defaultValue}]`;
        if (input.description) def += ` - ${input.description}`;
        return def;
      })
      .join('\n');
  }

  /**
   * Get formulas as formatted string
   */
  getFormulasDescription(): string {
    return this.config.formulas
      .map(formula => {
        let desc = `### ${formula.name}\n`;
        desc += `Formula: ${formula.expression}\n`;
        desc += `${formula.description}\n`;
        if (formula.example) desc += `Example: ${formula.example}\n`;
        return desc;
      })
      .join('\n');
  }

  /**
   * Get standard values as formatted string
   */
  getStandardValues(): string {
    if (this.config.standardValues.length === 0) return 'None';
    
    return this.config.standardValues
      .map(sv => `• ${sv.name}: ${sv.value}${sv.unit ? ' ' + sv.unit : ''} (${sv.source})`)
      .join('\n');
  }

  /**
   * Validate parsed inputs against rules
   */
  validateInputs(inputs: ParsedInputs): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const rule of this.config.validationRules) {
      const value = inputs[rule.field];

      switch (rule.rule) {
        case 'required':
          if (value === null || value === undefined) {
            errors.push(rule.message);
          }
          break;

        case 'positive':
          if (typeof value === 'number' && value <= 0) {
            errors.push(rule.message);
          }
          break;

        case 'percentage':
          if (typeof value === 'number' && (value < 0 || value > 100)) {
            errors.push(rule.message);
          }
          break;

        case 'min':
          if (typeof value === 'number' && typeof rule.value === 'number' && value < rule.value) {
            errors.push(rule.message);
          }
          break;

        case 'max':
          if (typeof value === 'number' && typeof rule.value === 'number' && value > rule.value) {
            errors.push(rule.message);
          }
          break;

        case 'range':
          if (typeof value === 'number' && Array.isArray(rule.value)) {
            if (value < rule.value[0] || value > rule.value[1]) {
              errors.push(rule.message);
            }
          }
          break;
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Build complete prompt for AI including all context
   */
  buildPrompt(userInputs: string, conversationContext: string): string {
    return `${this.config.systemPrompt}

## REQUIRED INPUTS
${this.getInputDefinitions()}

## FORMULAS
${this.getFormulasDescription()}

## STANDARD VALUES (use if not provided by user)
${this.getStandardValues()}

## DATABASE REFERENCES
${this.config.databaseRefs?.map(db => `• ${db.table}: ${db.description}`).join('\n') || 'None'}

## EXTERNAL DATA SOURCES
${this.config.apiRefs?.map(api => `• ${api.name}: ${api.purpose}`).join('\n') || 'None'}

## CONVERSATION CONTEXT
${conversationContext}

## CURRENT USER INPUT
${userInputs}

## OUTPUT FORMAT
${this.config.outputTemplate}

INSTRUCTIONS:
1. Extract all provided values from the conversation context and current input
2. Apply the formulas with actual numbers
3. Use standard values only when necessary (explicitly state as assumptions)
4. Present results in clear tables with units
5. Provide 2-3 actionable insights`;
  }

  /**
   * Abstract method to perform the actual calculation
   * Each task handler must implement this
   */
  abstract calculate(inputs: ParsedInputs): TaskCalculationResult;
}

