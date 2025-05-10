
import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StructureType } from './types';

interface StructureSelectorProps {
  structureType: StructureType;
  structureTypes: StructureType[];
  onChange: (structureType: StructureType) => void;
}

export const StructureSelector: React.FC<StructureSelectorProps> = ({
  structureType,
  structureTypes,
  onChange
}) => {
  return (
    <div className="flex-1 min-w-[200px]">
      <label htmlFor="structure-type-select" className="block text-sm font-medium mb-1">
        Structure Type
      </label>
      <Select
        value={structureType.id}
        onValueChange={(value) => {
          const selected = structureTypes.find(type => type.id === value);
          if (selected) onChange(selected);
        }}
      >
        <SelectTrigger 
          id="structure-type-select" 
          className="w-full"
        >
          <SelectValue placeholder="Select structure type" />
        </SelectTrigger>
        <SelectContent>
          {structureTypes.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              {type.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
