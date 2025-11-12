// React Hook for BOQ Parameter Extraction
// Integrates with existing calculator components to extract parameters for AI LLM BOQ calculations

import { useCallback, useEffect } from 'react';
import { boqParameterManager } from '../services/BOQParameterManager';
import { BOQParameters } from '../types/boq-parameters';

// Type definitions for BOQ parameter extraction
// Using Record<string, any> for flexibility with dynamic data structures
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PolygonConfig = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PanelConfig = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InverterConfig = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ACConfiguration = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CableData = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BreakerData = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TransformerData = Record<string, any>;

interface UseBOQParameterExtractionProps {
  // Data from various tabs/components
  polygonConfigs?: PolygonConfig[];
  selectedPanel?: PanelConfig;
  selectedInverter?: InverterConfig;
  structureType?: string;
  connectionType?: 'LV' | 'HV';
  isCentralInverter?: boolean;
  manualInverterCount?: number;
  totalStringCount?: number;
  averageStringCurrent?: number;
  soilType?: string;
  // AC Config data (would come from AC Config calculations)
  acConfigData?: {
    acConfiguration?: ACConfiguration; // The actual AC configuration object
    cableData?: CableData;
    breakerData?: BreakerData;
    transformerData?: TransformerData;
  };
}

interface UseBOQParameterExtractionReturn {
  extractAllParameters: () => void;
  getFormattedPrompt: (calculationType: 'LV' | 'HV_String' | 'HV_Central') => string;
  getCurrentParameters: () => Partial<BOQParameters>;
  clearParameters: () => void;
  isReady: boolean;
  calculationType: 'LV' | 'HV_String' | 'HV_Central';
}

export const useBOQParameterExtraction = (
  props: UseBOQParameterExtractionProps
): UseBOQParameterExtractionReturn => {
  const {
    polygonConfigs,
    selectedPanel,
    selectedInverter,
    structureType,
    connectionType,
    isCentralInverter,
    manualInverterCount,
    totalStringCount,
    averageStringCurrent,
    soilType,
    acConfigData
  } = props;

  // Determine calculation type based on configuration
  const calculationType: 'LV' | 'HV_String' | 'HV_Central' = 
    connectionType === 'LV' ? 'LV' : 
    isCentralInverter ? 'HV_Central' : 'HV_String';

  // Check if minimum required data is available
  const isReady = !!(
    polygonConfigs && 
    selectedPanel && 
    structureType && 
    connectionType && 
    manualInverterCount &&
    soilType
  );

  // Extract all parameters from current state
  const extractAllParameters = useCallback(() => {
    if (!isReady) {
      console.warn('BOQ Parameter Extraction: Required data not available');
      return;
    }

    try {
      console.log('🔧 Extracting BOQ parameters for AI LLM...');
      console.log('🔍 BOQ Debug - selectedInverter properties:', selectedInverter ? Object.keys(selectedInverter) : 'null');
      console.log('🔍 BOQ Debug - selectedInverter object:', selectedInverter);
      console.log('🔍 BOQ Debug - totalStringCount passed:', totalStringCount);
      
      // Debug inverter string capacity properties
      if (selectedInverter) {
        console.log('🔍 BOQ Debug - Complete selectedInverter object:', selectedInverter);
        console.log('🔍 BOQ Debug - selectedInverter keys:', Object.keys(selectedInverter));
        console.log('🔍 BOQ Debug - Inverter string capacity properties:', {
          total_string_inputs: selectedInverter?.total_string_inputs,
          total_mppt: selectedInverter?.total_mppt,
          strings: selectedInverter?.strings,
          max_strings: selectedInverter?.max_strings,
          string_input: selectedInverter?.string_input,
          inputs: selectedInverter?.inputs,
          string_inputs: selectedInverter?.string_inputs,
          mppt_inputs: selectedInverter?.mppt_inputs,
          strings_per_mppt: selectedInverter?.strings_per_mppt,
          specifications: selectedInverter?.specifications,
          specs: selectedInverter?.specs,
          parameters: selectedInverter?.parameters,
          electrical: selectedInverter?.electrical
        });
        
        // Additional debug for inverter numeric searches
        if (selectedInverter?.specifications) {
          console.log('🔍 BOQ Debug - inverter specifications numeric values (5-25):', Object.values(selectedInverter.specifications).filter(val => typeof val === 'number' && val >= 5 && val <= 25));
        }
        if (selectedInverter?.electrical) {
          console.log('🔍 BOQ Debug - inverter electrical numeric values (5-25):', Object.values(selectedInverter.electrical).filter(val => typeof val === 'number' && val >= 5 && val <= 25));
        }
        if (selectedInverter?.specs) {
          console.log('🔍 BOQ Debug - inverter specs numeric values (5-25):', Object.values(selectedInverter.specs).filter(val => typeof val === 'number' && val >= 5 && val <= 25));
        }
      }

      // 1. Extract DC Inputs
      boqParameterManager.extractDCInputs({
        polygonConfigs,
        selectedPanel,
        structureType,
        totalStringCount,
        averageStringCurrent
      });

      // 2. Extract Lightning Protection Inputs
      boqParameterManager.extractLightningProtectionInputs({
        polygonConfigs,
        soilType
      });

      // 3. Extract AC Common Inputs
      boqParameterManager.extractACCommonInputs({
        connectionType,
        manualInverterCount
      });

      // 4. Extract connection-specific inputs (with error handling)
      try {
        if (calculationType === 'LV') {
          console.log('🔧 Attempting LV connection extraction...');
          boqParameterManager.extractLVConnectionInputs({
            selectedInverter,
            manualInverterCount,
            acConfiguration: acConfigData?.acConfiguration,
            cableData: acConfigData?.cableData,
            breakerData: acConfigData?.breakerData
          });
          console.log('✅ LV connection extraction successful');
        } else if (calculationType === 'HV_String') {
          console.log('🔧 Attempting HV String extraction...');
          boqParameterManager.extractHVStringInverterInputs({
            selectedInverter,
            manualInverterCount,
            acConfiguration: acConfigData?.acConfiguration,
            cableData: acConfigData?.cableData,
            breakerData: acConfigData?.breakerData,
            transformerData: acConfigData?.transformerData
          });
          console.log('✅ HV String extraction successful');
        } else if (calculationType === 'HV_Central') {
          console.log('🔧 Attempting HV Central extraction...');
          boqParameterManager.extractHVCentralInverterInputs({
            manualInverterCount,
            acConfiguration: acConfigData?.acConfiguration,
            cableData: acConfigData?.cableData,
            breakerData: acConfigData?.breakerData,
            transformerData: acConfigData?.transformerData
          });
          console.log('✅ HV Central extraction successful');
        }
      } catch (connectionError) {
        console.warn('⚠️ Connection-specific extraction failed, but continuing with available parameters:', connectionError);
        console.log('📊 Available parameters so far:', boqParameterManager.getCurrentParameters());
        
        // AC configuration extraction failed, but we have DC, Lightning, and AC Common parameters
        // The BOQ workflow will handle creating fallback AC connection parameters if needed
        console.log('📊 AC extraction failed, but continuing with available parameters for BOQ generation');
        console.log('✅ Available: DC Inputs, Lightning Protection, AC Common');
        console.log('⚠️ Missing: AC Connection specifics (distances, cable sizes, breaker ratings)');
        console.log('🔧 BOQ workflow will provide realistic fallbacks for missing AC parameters');
      }

      console.log('✅ BOQ parameters extracted successfully');
      console.log('📊 Current parameters:', boqParameterManager.getCurrentParameters());
      
    } catch (error) {
      console.error('❌ Error extracting BOQ parameters:', error);
    }
  }, [
    isReady,
    polygonConfigs,
    selectedPanel,
    structureType,
    totalStringCount,
    averageStringCurrent,
    soilType,
    connectionType,
    manualInverterCount,
    calculationType,
    selectedInverter,
    acConfigData
  ]);

  // Get formatted prompt for AI LLM
  const getFormattedPrompt = useCallback((calcType: 'LV' | 'HV_String' | 'HV_Central'): string => {
    try {
      return boqParameterManager.formatForAIPrompt(calcType);
    } catch (error) {
      console.error('❌ Error formatting prompt:', error);
      return `Error: ${error}`;
    }
  }, []);

  // Get current parameters for debugging
  const getCurrentParameters = useCallback(() => {
    return boqParameterManager.getCurrentParameters();
  }, []);

  // Clear parameters
  const clearParameters = useCallback(() => {
    boqParameterManager.clearSession();
    console.log('🧹 BOQ parameters cleared');
  }, []);

  // Auto-extract when data changes and is ready
  useEffect(() => {
    if (isReady) {
      const timeout = setTimeout(() => {
        extractAllParameters();
      }, 500); // Small delay to ensure all data is settled

      return () => clearTimeout(timeout);
    }
  }, [extractAllParameters, isReady]);

  return {
    extractAllParameters,
    getFormattedPrompt,
    getCurrentParameters,
    clearParameters,
    isReady,
    calculationType
  };
};

// Helper hook for debugging BOQ parameters
export const useBOQParameterDebug = () => {
  const logCurrentParameters = useCallback(() => {
    const params = boqParameterManager.getCurrentParameters();
    console.table(params);
    return params;
  }, []);

  const downloadParametersAsJSON = useCallback(() => {
    const params = boqParameterManager.getCurrentParameters();
    const blob = new Blob([JSON.stringify(params, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boq-parameters-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const getFormattedPromptForType = useCallback((type: 'LV' | 'HV_String' | 'HV_Central') => {
    try {
      const prompt = boqParameterManager.formatForAIPrompt(type);
      console.log(`📋 Formatted prompt for ${type}:`, prompt);
      return prompt;
    } catch (error) {
      console.error('❌ Error generating prompt:', error);
      return null;
    }
  }, []);

  return {
    logCurrentParameters,
    downloadParametersAsJSON,
    getFormattedPromptForType
  };
};
