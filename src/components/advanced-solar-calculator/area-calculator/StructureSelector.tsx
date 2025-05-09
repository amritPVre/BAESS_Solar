
import React from 'react';
import { StructureType } from './types';

interface StructureSelectorProps {
  structureType: StructureType;
  structureTypes: StructureType[];
  onChange: (type: StructureType) => void;
}

export const StructureSelector: React.FC<StructureSelectorProps> = ({ 
  structureType, 
  structureTypes, 
  onChange 
}) => {
  return (
    <select
      value={structureType.id}
      onChange={(e) => {
        const selected = structureTypes.find(type => type.id === e.target.value);
        if (selected) onChange(selected);
      }}
      className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
    >
      {structureTypes.map(type => (
        <option key={type.id} value={type.id}>{type.name}</option>
      ))}
    </select>
  );
};
