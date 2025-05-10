
import React from 'react';
import { StructureType } from './types';
import { cn } from '@/lib/utils';

interface StructureSelectorProps {
  structureType: StructureType;
  structureTypes: StructureType[];
  onChange: (type: StructureType) => void;
  className?: string;
}

export const StructureSelector: React.FC<StructureSelectorProps> = ({ 
  structureType, 
  structureTypes, 
  onChange,
  className 
}) => {
  return (
    <select
      value={structureType.id}
      onChange={(e) => {
        const selected = structureTypes.find(type => type.id === e.target.value);
        if (selected) onChange(selected);
      }}
      className={cn(
        "rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
        className
      )}
    >
      {structureTypes.map(type => (
        <option key={type.id} value={type.id}>{type.name}</option>
      ))}
    </select>
  );
};
