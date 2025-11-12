import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Sliders, RotateCcw, Grid3X3, Car } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StructureType, LayoutParameters } from './types';
import { DEFAULT_LAYOUT_PARAMS } from './constants';
import TableAlignmentSelector from './components/TableAlignmentSelector';
import { TableLayoutAlignment } from './hooks/types';

interface StructureParametersProps {
  layoutParams: LayoutParameters;
  structureType: StructureType;
  onLayoutChange?: (params: LayoutParameters) => void;
  tableAlignment?: TableLayoutAlignment;
  onTableAlignmentChange?: (alignment: TableLayoutAlignment) => void;
}

export const StructureParameters = ({ 
  layoutParams, 
  structureType,
  onLayoutChange = () => {},
  tableAlignment = TableLayoutAlignment.Center,
  onTableAlignmentChange = () => {}
}: StructureParametersProps) => {
  const [isExpanded, setIsExpanded] = useState(true); // Changed to true for default expanded state
  
  useEffect(() => {
    console.log("StructureParameters: onLayoutChange prop is:", onLayoutChange.toString().substring(0, 200) + "..."); // Log the function's signature
    // This is to help debug if the correct callback is being passed.
  }, [onLayoutChange]);

  useEffect(() => {
    console.log("StructureParameters: Received onTableAlignmentChange:", 
      typeof onTableAlignmentChange, 
      onTableAlignmentChange.toString().substring(0, 300)
    );
  }, [onTableAlignmentChange]);
  
  // Determine if this structure type has advanced settings
  const hasAdvancedSettings = structureType.id === 'fixed_tilt' || structureType.id === 'ground_mount_tables' || structureType.id === 'carport';
  
  // Helper to update layout params
  const updateLayoutParams = (updates: Partial<LayoutParameters>) => {
    console.log("StructureParameters: updateLayoutParams called with:", JSON.stringify(updates));
    console.log("StructureParameters: current layoutParams:", JSON.stringify(layoutParams));
    
    // Capture the old orientation for comparison
    const oldOrientation = layoutParams.orientation;
    
    // Create a new object to ensure React detects the change
    const updatedParams = { ...layoutParams, ...updates };
    console.log("StructureParameters: merged params to send:", JSON.stringify(updatedParams));
    
    // Special handling for orientation changes
    if (updates.orientation && updates.orientation !== oldOrientation) {
      console.log(`StructureParameters: ORIENTATION CHANGED from ${oldOrientation} to ${updates.orientation}`);
    }
    
    // Call the parent's onLayoutChange handler
    onLayoutChange(updatedParams);
    
    // Add a validation check after a small delay to verify the changes took effect
    setTimeout(() => {
      console.log("StructureParameters: after update, layoutParams are now:", JSON.stringify(layoutParams));
    }, 100);
  };

  // Helper to update table config
  const updateTableConfig = (updates: Partial<typeof layoutParams.tableConfig>) => {
    if (!layoutParams.tableConfig) return;
    
    const updatedTableConfig = { 
      ...layoutParams.tableConfig, 
      ...updates 
    };
    
    updateLayoutParams({ tableConfig: updatedTableConfig });
  };

  // Helper to update carport config
  const updateCarportConfig = (updates: Partial<typeof layoutParams.carportConfig>) => {
    if (!layoutParams.carportConfig) return;
    
    const updatedCarportConfig = { 
      ...layoutParams.carportConfig, 
      ...updates 
    };
    
    updateLayoutParams({ carportConfig: updatedCarportConfig });
  };

  // Reset to default parameters for the current structure type
  const resetToDefaults = () => {
    console.log("Resetting layout parameters to defaults for", structureType.id);
    const defaults = DEFAULT_LAYOUT_PARAMS[structureType.id];
    if (defaults) {
      onLayoutChange({...defaults});
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-xs text-green-700 flex items-center gap-1">
          <Sliders className="h-3 w-3 text-green-600" />
            Layout Parameters
        </h4>
        <div className="flex gap-1">
          {hasAdvancedSettings && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-green-600 hover:text-green-700 hover:underline px-1 transition-colors duration-200"
            >
            {isExpanded ? 'Hide' : 'Show'}
            </button>
          )}
            <Button
              variant="outline"
              size="sm"
            className="h-6 text-xs flex items-center gap-1 px-2 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 transition-all duration-200"
              onClick={resetToDefaults}
            >
            <RotateCcw className="h-3 w-3 text-green-600" />
              Reset
            </Button>
          </div>
        </div>
        
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="tilt-angle-input" className="text-xs text-slate-600 font-medium">Tilt Angle (°)</Label>
              <Input
                id="tilt-angle-input"
                type="number"
                value={layoutParams.tiltAngle}
                onChange={(e) => updateLayoutParams({ tiltAngle: Number(e.target.value) })}
                min="0"
                max="45"
              className="h-7 text-xs border-blue-200 focus:border-blue-400 focus:ring-blue-400/20"
              />
            </div>
          <div className="space-y-1">
            <Label htmlFor="orientation-select" className="text-xs text-slate-600 font-medium">Orientation</Label>
              <Select
                value={layoutParams.orientation}
                onValueChange={(value) => {
                  console.log(`StructureParameters: Orientation Select onValueChange to: ${value}`);
                  const orientationUpdate = { orientation: value as 'landscape' | 'portrait' };
                  updateLayoutParams(orientationUpdate);
                }}
              >
              <SelectTrigger id="orientation-select" className="h-7 text-xs border-blue-200 focus:border-blue-400 focus:ring-blue-400/20">
                  <SelectValue placeholder="Select orientation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="landscape">Landscape</SelectItem>
                  <SelectItem value="portrait">Portrait</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
        <div className={`grid gap-2 ${['fixed_tilt', 'ground_mount_tables', 'carport'].includes(structureType.id) ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {!['fixed_tilt', 'ground_mount_tables', 'carport'].includes(structureType.id) && (
          <div className="space-y-1">
            <Label htmlFor="row-spacing-input" className="text-xs text-slate-600 font-medium">Row Spacing (m)</Label>
              <Input
                id="row-spacing-input"
                type="number"
                value={layoutParams.interRowSpacing}
                  onChange={(e) => updateLayoutParams({ interRowSpacing: Number(e.target.value) })}
                min="0.3"
                max="5"
                step="0.1"
              className="h-7 text-xs border-purple-200 focus:border-purple-400 focus:ring-purple-400/20"
              />
            </div>
            )}
          <div className="space-y-1">
            <Label htmlFor="module-gap-input" className="text-xs text-slate-600 font-medium">Module Gap (mm)</Label>
              <Input
                id="module-gap-input"
                type="number"
                value={layoutParams.adjacentGap}
                onChange={(e) => updateLayoutParams({ adjacentGap: Number(e.target.value) })}
                min="10"
                max="100"
              className="h-7 text-xs border-purple-200 focus:border-purple-400 focus:ring-purple-400/20"
              />
            </div>
          </div>
          
          {/* Show Table Alignment controls for all structure types, not just table-based ones */}
        <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 p-2 rounded border border-indigo-200/50">
            <TableAlignmentSelector
              value={tableAlignment}
              onChange={onTableAlignmentChange}
              structureType={structureType}
            />
          </div>
          
          {/* Fixed Tilt Elevated settings */}
          {isExpanded && structureType.id === 'fixed_tilt' && layoutParams.tableConfig && (
          <div className="pt-2 border-t border-gray-200 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 p-2 rounded">
            <h5 className="font-medium text-xs mb-2 text-blue-700 flex items-center gap-1">
              <Sliders className="h-3 w-3" />
              Fixed Tilt Config
            </h5>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="rows-per-table-input" className="text-xs text-slate-600 font-medium">Rows Per Table</Label>
                  <Input
                    id="rows-per-table-input"
                    type="number"
                    value={layoutParams.tableConfig.rowsPerTable}
                    onChange={(e) => updateTableConfig({ rowsPerTable: Number(e.target.value) })}
                    min="1"
                    max="4"
                  className="h-7 text-xs border-blue-200 focus:border-blue-400"
                  />
                </div>
              <div className="space-y-1">
                <Label htmlFor="modules-per-row-input" className="text-xs text-slate-600 font-medium">Modules Per Row</Label>
                  <Input
                    id="modules-per-row-input"
                    type="number"
                    value={layoutParams.tableConfig.modulesPerRow}
                    onChange={(e) => updateTableConfig({ modulesPerRow: Number(e.target.value) })}
                    min="1"
                    max="12"
                  className="h-7 text-xs border-blue-200 focus:border-blue-400"
                  />
                </div>
              <div className="space-y-1">
                <Label htmlFor="table-y-spacing-input" className="text-xs text-slate-600 font-medium">Table Spacing Y (m)</Label>
                  <Input
                    id="table-y-spacing-input"
                    type="number"
                    value={layoutParams.tableConfig.interTableSpacingY || 4.0}
                    onChange={(e) => updateTableConfig({ interTableSpacingY: Number(e.target.value) })}
                    min="0.5"
                    max="10"
                    step="0.1"
                  className="h-7 text-xs border-blue-200 focus:border-blue-400"
                  />
                </div>
              <div className="space-y-1">
                <Label htmlFor="table-x-spacing-input" className="text-xs text-slate-600 font-medium">Table Spacing X (m)</Label>
                  <Input
                    id="table-x-spacing-input"
                    type="number"
                    value={layoutParams.tableConfig.interTableSpacingX || 0.5}
                    onChange={(e) => updateTableConfig({ interTableSpacingX: Number(e.target.value) })}
                    min="0.1"
                    max="5"
                    step="0.1"
                  className="h-7 text-xs border-blue-200 focus:border-blue-400"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Ground Mount Table settings */}
          {isExpanded && structureType.id === 'ground_mount_tables' && layoutParams.tableConfig && (
          <div className="pt-2 border-t border-gray-200 bg-gradient-to-r from-amber-50/30 to-orange-50/30 p-2 rounded">
            <h5 className="font-medium text-xs mb-2 text-amber-700 flex items-center gap-1">
              <Grid3X3 className="h-3 w-3" />
              Ground Mount Config
            </h5>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="rows-per-table-input" className="text-xs text-slate-600 font-medium">Rows Per Table</Label>
                  <Input
                    id="rows-per-table-input"
                    type="number"
                    value={layoutParams.tableConfig.rowsPerTable}
                    onChange={(e) => updateTableConfig({ rowsPerTable: Number(e.target.value) })}
                    min="1"
                    max="10"
                  className="h-7 text-xs border-amber-200 focus:border-amber-400"
                  />
                </div>
              <div className="space-y-1">
                <Label htmlFor="modules-per-row-input" className="text-xs text-slate-600 font-medium">Modules Per Row</Label>
                  <Input
                    id="modules-per-row-input"
                    type="number"
                    value={layoutParams.tableConfig.modulesPerRow}
                    onChange={(e) => updateTableConfig({ modulesPerRow: Number(e.target.value) })}
                    min="1"
                    max="20"
                  className="h-7 text-xs border-amber-200 focus:border-amber-400"
                  />
                </div>
              <div className="space-y-1">
                <Label htmlFor="table-y-spacing-input" className="text-xs text-slate-600 font-medium">Table Spacing Y (m)</Label>
                  <Input
                    id="table-y-spacing-input"
                    type="number"
                    value={layoutParams.tableConfig.interTableSpacingY || 4.0}
                    onChange={(e) => updateTableConfig({ interTableSpacingY: Number(e.target.value) })}
                    min="0.5"
                    max="10"
                    step="0.1"
                  className="h-7 text-xs border-amber-200 focus:border-amber-400"
                  />
                </div>
              <div className="space-y-1">
                <Label htmlFor="table-x-spacing-input" className="text-xs text-slate-600 font-medium">Table Spacing X (m)</Label>
                  <Input
                    id="table-x-spacing-input"
                    type="number"
                    value={layoutParams.tableConfig.interTableSpacingX || 0.5}
                    onChange={(e) => updateTableConfig({ interTableSpacingX: Number(e.target.value) })}
                    min="0.1"
                    max="5"
                    step="0.1"
                  className="h-7 text-xs border-amber-200 focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Carport settings */}
          {isExpanded && structureType.id === 'carport' && layoutParams.carportConfig && (
          <div className="pt-2 border-t border-gray-200 bg-gradient-to-r from-purple-50/30 to-violet-50/30 p-2 rounded">
            <h5 className="font-medium text-xs mb-2 text-purple-700 flex items-center gap-1">
              <Car className="h-3 w-3" />
              Carport Config
            </h5>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="carport-rows-input" className="text-xs text-slate-600 font-medium">Rows</Label>
                  <Input
                    id="carport-rows-input"
                    type="number"
                    value={layoutParams.carportConfig.rows}
                    onChange={(e) => updateCarportConfig({ rows: Number(e.target.value) })}
                    min="1"
                    max="20"
                  className="h-7 text-xs border-purple-200 focus:border-purple-400"
                  />
                </div>
              <div className="space-y-1">
                <Label htmlFor="carport-modules-per-row-input" className="text-xs text-slate-600 font-medium">Modules Per Row</Label>
                  <Input
                    id="carport-modules-per-row-input"
                    type="number"
                    value={layoutParams.carportConfig.modulesPerRow}
                    onChange={(e) => updateCarportConfig({ modulesPerRow: Number(e.target.value) })}
                    min="1"
                    max="30"
                  className="h-7 text-xs border-purple-200 focus:border-purple-400"
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="force-rectangle-checkbox"
                      checked={layoutParams.carportConfig.forceRectangle}
                      onChange={(e) => updateCarportConfig({ forceRectangle: e.target.checked })}
                    className="h-3 w-3 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                    />
                  <Label htmlFor="force-rectangle-checkbox" className="text-xs text-slate-600 font-medium">Force rectangular shape</Label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
};
