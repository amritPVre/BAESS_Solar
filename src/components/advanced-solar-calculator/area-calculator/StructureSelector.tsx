
import React from 'react';
import { Check, ChevronDown, Building2, Home, Grid3X3, Zap, Layers } from 'lucide-react';
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

// Map structure types to appropriate icons
const getStructureIcon = (structureId: string) => {
  const iconProps = { className: "h-4 w-4" };
  
  switch (structureId) {
    case 'ballasted':
      return <Home {...iconProps} />;
    case 'fixed_tilt':
      return <Zap {...iconProps} />;
    case 'ground_mount_tables':
      return <Grid3X3 {...iconProps} />;
    case 'carport':
      return <Building2 {...iconProps} />;
    case 'pv_table_free_form':
      return <Layers {...iconProps} />;
    default:
      return <Layers {...iconProps} />;
  }
};

// Get color theme for each structure type
const getStructureTheme = (structureId: string) => {
  switch (structureId) {
    case 'ballasted':
      return {
        bg: "from-blue-50 to-blue-100",
        border: "border-blue-200",
        text: "text-blue-700",
        icon: "text-blue-600"
      };
    case 'fixed_tilt':
      return {
        bg: "from-emerald-50 to-emerald-100",
        border: "border-emerald-200", 
        text: "text-emerald-700",
        icon: "text-emerald-600"
      };
    case 'ground_mount_tables':
      return {
        bg: "from-amber-50 to-amber-100",
        border: "border-amber-200",
        text: "text-amber-700",
        icon: "text-amber-600"
      };
    case 'carport':
      return {
        bg: "from-purple-50 to-purple-100",
        border: "border-purple-200",
        text: "text-purple-700",
        icon: "text-purple-600"
      };
    case 'pv_table_free_form':
      return {
        bg: "from-rose-50 to-rose-100",
        border: "border-rose-200",
        text: "text-rose-700",
        icon: "text-rose-600"
      };
    default:
      return {
        bg: "from-gray-50 to-gray-100",
        border: "border-gray-200",
        text: "text-gray-700",
        icon: "text-gray-600"
      };
  }
};

export const StructureSelector: React.FC<StructureSelectorProps> = ({
  structureType,
  structureTypes,
  onChange
}) => {
  const currentTheme = getStructureTheme(structureType.id);
  
  return (
    <div className="w-full">
      <div className={`relative rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-all duration-200`}>
        <Select
          value={structureType.id}
          onValueChange={(value) => {
            const selected = structureTypes.find(type => type.id === value);
            if (selected) onChange(selected);
          }}
        >
          <SelectTrigger className="w-full border-0 bg-transparent shadow-none focus:ring-0 p-2 h-auto text-xs">
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 text-left">
                <div className="font-medium text-slate-900 text-xs">
                  {structureType.name}
                </div>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-500" />
            </div>
          </SelectTrigger>
          
          <SelectContent className="min-w-[240px] border border-slate-200 shadow-lg rounded-lg">
            <div className="p-1">
              {structureTypes.map((type) => {
                const isSelected = type.id === structureType.id;
                
                return (
                  <SelectItem 
                    key={type.id} 
                    value={type.id}
                    className="p-0 focus:bg-transparent data-[highlighted]:bg-transparent"
                  >
                    <div className={`w-full p-2 rounded border transition-all duration-200 ${
                      isSelected 
                        ? 'border-blue-200 bg-blue-50' 
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    }`}>
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex-1">
                          <div className={`font-medium text-xs ${
                            isSelected ? 'text-blue-700' : 'text-slate-900'
                          }`}>
                            {type.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {type.id === 'ballasted' && 'Roof mounting'}
                            {type.id === 'fixed_tilt' && 'Elevated mounting'}
                            {type.id === 'ground_mount_tables' && 'Ground tables'}
                            {type.id === 'carport' && 'Solar canopy'}
                            {type.id === 'pv_table_free_form' && 'Free-form table'}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-3 w-3 text-blue-600" />
                        )}
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </div>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
