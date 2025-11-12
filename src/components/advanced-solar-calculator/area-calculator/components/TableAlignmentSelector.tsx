import React, { useEffect } from 'react';
import { TableLayoutAlignment } from '../hooks/types';
import { Button } from '@/components/ui/button';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Maximize,
  XCircle,
  Zap
} from 'lucide-react';
import { StructureType } from '../types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TableAlignmentSelectorProps {
  value: TableLayoutAlignment;
  onChange: (alignment: TableLayoutAlignment) => void;
  structureType: StructureType;
}

// Define which alignments are disabled for specific structure types
// Ballasted flat roof: left, center, right (no justify)
// PV Table - Free Form: all alignments available (left, center, right, justify)
// All other types: only center alignment
const disabledAlignmentsMap: Record<string, TableLayoutAlignment[]> = {
  ballasted: [TableLayoutAlignment.Justify, TableLayoutAlignment.Optimum], // Left, center, right available for ballasted flat roof (no justify, no optimum)
  pv_table_free_form: [TableLayoutAlignment.Optimum], // All alignments except optimum available for PV Table - Free Form
  fixed_tilt: [TableLayoutAlignment.Left, TableLayoutAlignment.Right, TableLayoutAlignment.Justify, TableLayoutAlignment.Optimum], // Only center for fixed tilt
  ground_mount_tables: [TableLayoutAlignment.Left, TableLayoutAlignment.Right, TableLayoutAlignment.Justify], // Center and optimum for ground mount tables (disabled left/right for now)
  carport: [TableLayoutAlignment.Left, TableLayoutAlignment.Right, TableLayoutAlignment.Justify, TableLayoutAlignment.Optimum], // Only center for carport
};

export const TableAlignmentSelector: React.FC<TableAlignmentSelectorProps> = ({ 
  value, 
  onChange,
  structureType 
}) => {
  // useEffect to handle alignment changes when structureType changes
  useEffect(() => {
    const currentDisabledAlignments = disabledAlignmentsMap[structureType.id] || [];
    if (currentDisabledAlignments.includes(value)) {
      console.log(`TableAlignmentSelector: Alignment '${value}' is disabled for structure '${structureType.name}'. Resetting to Center.`);
      // Directly call parent's onChange to request a change to Center.
      // The parent (AreaCalculator) will update its state, which will flow back as the 'value' prop.
      onChange(TableLayoutAlignment.Center);
    }
  }, [structureType, value, onChange]);

  // Helper function to get icon component based on alignment
  const getAlignmentIcon = (alignment: TableLayoutAlignment) => {
    switch (alignment) {
      case TableLayoutAlignment.Left:
        return <AlignLeft size={18} />;
      case TableLayoutAlignment.Center:
        return <AlignCenter size={18} />;
      case TableLayoutAlignment.Right:
        return <AlignRight size={18} />;
      case TableLayoutAlignment.Justify:
        return <Maximize size={18} />;
      case TableLayoutAlignment.Optimum:
        return <Zap size={18} />;
      default:
        return <AlignCenter size={18} />;
    }
  };

  // Handler to ensure alignment value changes are properly applied
  const handleAlignmentChange = (newAlignment: TableLayoutAlignment) => {
    const currentDisabledAlignments = disabledAlignmentsMap[structureType.id] || [];
    if (currentDisabledAlignments.includes(newAlignment)) {
      console.warn(`TableAlignmentSelector: Attempted to select disabled alignment '${newAlignment}' for structure '${structureType.name}'. Ignoring.`);
      return; // Do not proceed if the alignment is disabled
    }

    console.log(`TableAlignmentSelector: User selected ${newAlignment}. Calling onChange.`);
    onChange(newAlignment); // Call the parent's handler to update the state

    // Dispatch event to force module recalculation
    // The 10ms timeout might be for debouncing or ensuring DOM is ready for event, keep it for now.
    setTimeout(() => {
      const event = new CustomEvent('force-module-recalculation', {
        detail: { alignment: newAlignment, source: 'TableAlignmentSelector' }
      });
      console.log(`TableAlignmentSelector: Dispatched force-module-recalculation for ${newAlignment}`);
      document.dispatchEvent(event);

      // Optional: dispatch another event if other components need to know about UI interaction specifically
      // For now, force-module-recalculation should be sufficient for placement updates.
      /*
      setTimeout(() => {
        const verificationEvent = new CustomEvent('user-alignment-selection-processed', {
          detail: { alignment: newAlignment }
        });
        document.dispatchEvent(verificationEvent);
      }, 500);
      */
    }, 10);
  };

  // Filter out disabled alignments to hide them completely
  const disabledAlignments = disabledAlignmentsMap[structureType.id] || [];
  const availableAlignments = (Object.values(TableLayoutAlignment) as TableLayoutAlignment[])
    .filter(alignment => !disabledAlignments.includes(alignment));

  // Determine grid columns based on available alignments count
  const gridCols = availableAlignments.length === 1 ? 'grid-cols-1' : 
                  availableAlignments.length === 2 ? 'grid-cols-2' : 
                  availableAlignments.length === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className="space-y-2 bg-white p-3 rounded-md border border-gray-200 shadow-sm">
      <label className="text-sm font-medium text-gray-700 block mb-2">Module Alignment</label>
      {availableAlignments.length === 1 ? (
        // Special case for center-only: show as a single centered button
        <div className="flex justify-center">
          <Button
            key={availableAlignments[0]}
            type="button"
            variant={value === availableAlignments[0] ? "default" : "outline"}
            size="sm"
            className="flex justify-center items-center h-9 px-6"
            onClick={() => handleAlignmentChange(availableAlignments[0])}
            title={availableAlignments[0].charAt(0).toUpperCase() + availableAlignments[0].slice(1)}
          >
            {getAlignmentIcon(availableAlignments[0])}
            <span className="ml-2">{availableAlignments[0].charAt(0).toUpperCase() + availableAlignments[0].slice(1)}</span>
          </Button>
        </div>
      ) : (
        // Multiple options: show as grid
        <div className={`grid ${gridCols} gap-2 w-full`}>
          {availableAlignments.map((alignment) => (
            <Button
              key={alignment}
              type="button"
              variant={value === alignment ? "default" : "outline"}
              size="sm"
              className="flex justify-center items-center h-9"
              onClick={() => handleAlignmentChange(alignment)}
              title={alignment.charAt(0).toUpperCase() + alignment.slice(1)}
            >
              {getAlignmentIcon(alignment)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TableAlignmentSelector; 