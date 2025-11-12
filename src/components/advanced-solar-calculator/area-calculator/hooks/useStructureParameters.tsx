import { useState, useEffect, useRef } from 'react';
import { StructureType, LayoutParameters } from '../types';
import { DEFAULT_LAYOUT_PARAMS, STRUCTURE_TYPES } from '../constants';

interface UseStructureParametersProps {
  onStructureChange?: () => void;
}

export const useStructureParameters = ({ 
  onStructureChange 
}: UseStructureParametersProps = {}) => {
  const [structureType, setStructureType] = useState<StructureType>(STRUCTURE_TYPES[0]);
  const structureTypeRef = useRef(structureType);
  
  const [layoutParams, setLayoutParamsState] = useState<LayoutParameters>({
    ...DEFAULT_LAYOUT_PARAMS.ballasted,
    orientation: DEFAULT_LAYOUT_PARAMS.ballasted.orientation as "landscape" | "portrait"
  });
  const layoutParamsRef = useRef(layoutParams);

  // Update refs when state changes
  useEffect(() => {
    structureTypeRef.current = structureType;
    if (onStructureChange) {
      onStructureChange();
    }
  }, [structureType, onStructureChange]);

  // Custom layout params setter that ensures proper updates and triggering
  const handleLayoutChange = (newParams: LayoutParameters) => {
    console.log("useStructureParameters: handleLayoutChange received newParams:", JSON.stringify(newParams));
    console.log("useStructureParameters: current internal layoutParams state BEFORE update:", JSON.stringify(layoutParams));

    // Always create a new object by merging the current state with newParams
    // This ensures that if newParams is a partial update, existing values are preserved,
    // and if it's a full update, it's taken. Crucially, it's always a new reference.
    const paramsToSet = { ...layoutParams, ...newParams };

    console.log("useStructureParameters: Attempting to set internal layoutParams state to:", JSON.stringify(paramsToSet));
    setLayoutParamsState(paramsToSet); // Call the actual useState setter
  };

  useEffect(() => {
    // This log is CRITICAL: It shows the actual value of layoutParams state after any update.
    console.log("useStructureParameters useEffect[layoutParams]: Internal state IS NOW:", JSON.stringify(layoutParams));
    layoutParamsRef.current = layoutParams;
    
    if (onStructureChange) {
      console.log("useStructureParameters useEffect[layoutParams]: Triggering onStructureChange callback because internal layoutParams changed.");
      onStructureChange();
    }
  }, [layoutParams, onStructureChange]);

  // Update layout parameters when structure type changes - using refs to prevent loops
  useEffect(() => {
    const defaultParams = DEFAULT_LAYOUT_PARAMS[structureType.id] || DEFAULT_LAYOUT_PARAMS.ballasted;
    
    // Preserve tableConfig if we're switching to ground_mount_tables and already have settings
    if (structureType.id === 'ground_mount_tables' && layoutParams.tableConfig) {
      setLayoutParamsState({
        ...defaultParams,
        tableConfig: layoutParams.tableConfig
      });
    } 
    // Preserve carportConfig if we're switching to carport and already have settings
    else if (structureType.id === 'carport' && layoutParams.carportConfig) {
      setLayoutParamsState({
        ...defaultParams,
        carportConfig: layoutParams.carportConfig
      });
    }
    // Handle fixed_tilt structure with table configuration
    else if (structureType.id === 'fixed_tilt' && layoutParams.tableConfig) {
      setLayoutParamsState({
        ...defaultParams,
        tableConfig: {
          ...defaultParams.tableConfig,
          ...layoutParams.tableConfig
        }
      });
    }
    else {
      setLayoutParamsState(defaultParams);
    }
  }, [structureType.id]);

  return {
    structureType,
    setStructureType,
    layoutParams,
    setLayoutParams: handleLayoutChange,
    structureTypeRef,
    layoutParamsRef,
    structureTypes: STRUCTURE_TYPES
  };
};
