
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
  
  const [layoutParams, setLayoutParams] = useState<LayoutParameters>({
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

  useEffect(() => {
    layoutParamsRef.current = layoutParams;
    if (onStructureChange) {
      onStructureChange();
    }
  }, [layoutParams, onStructureChange]);

  // Update layout parameters when structure type changes - using refs to prevent loops
  useEffect(() => {
    const defaultParams = DEFAULT_LAYOUT_PARAMS[structureType.id] || DEFAULT_LAYOUT_PARAMS.ballasted;
    
    // Preserve tableConfig if we're switching to ground_mount_tables and already have settings
    if (structureType.id === 'ground_mount_tables' && layoutParams.tableConfig) {
      setLayoutParams({
        ...defaultParams,
        tableConfig: layoutParams.tableConfig
      });
    } else {
      setLayoutParams(defaultParams);
    }
  }, [structureType.id]);

  return {
    structureType,
    setStructureType,
    layoutParams,
    setLayoutParams,
    structureTypeRef,
    layoutParamsRef,
    structureTypes: STRUCTURE_TYPES
  };
};
