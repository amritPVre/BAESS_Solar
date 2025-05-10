
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings } from 'lucide-react';
import { LayoutParameters, StructureType } from './types';
import { DEFAULT_LAYOUT_PARAMS } from './constants';

interface StructureParametersProps {
  layoutParams: LayoutParameters;
  structureType: StructureType;
  onChange?: (params: LayoutParameters) => void;
}

export const StructureParameters: React.FC<StructureParametersProps> = ({ 
  layoutParams,
  structureType,
  onChange
}) => {
  const [params, setParams] = useState<LayoutParameters>({
    ...layoutParams
  });

  // Update internal state when props change
  useEffect(() => {
    setParams(layoutParams);
  }, [layoutParams]);

  // Helper to update params and call onChange if provided
  const updateParams = (updatedParams: Partial<LayoutParameters>) => {
    const newParams = { ...params, ...updatedParams };
    setParams(newParams);
    if (onChange) {
      onChange(newParams);
    }
  };

  // Get default values for table config to ensure required properties are present
  const getDefaultTableConfig = () => {
    return {
      rowsPerTable: DEFAULT_LAYOUT_PARAMS.ground_mount_tables.tableConfig?.rowsPerTable ?? 3,
      modulesPerRow: DEFAULT_LAYOUT_PARAMS.ground_mount_tables.tableConfig?.modulesPerRow ?? 5,
      interTableSpacingY: DEFAULT_LAYOUT_PARAMS.ground_mount_tables.tableConfig?.interTableSpacingY ?? 4.0,
      interTableSpacingX: DEFAULT_LAYOUT_PARAMS.ground_mount_tables.tableConfig?.interTableSpacingX ?? 0.5
    };
  };

  // Get default values for carport config to ensure required properties are present
  const getDefaultCarportConfig = () => {
    return {
      rows: DEFAULT_LAYOUT_PARAMS.carport.carportConfig?.rows ?? 6,
      modulesPerRow: DEFAULT_LAYOUT_PARAMS.carport.carportConfig?.modulesPerRow ?? 10,
      forceRectangle: DEFAULT_LAYOUT_PARAMS.carport.carportConfig?.forceRectangle ?? true
    };
  };

  // Helper function to update table config with all required properties
  const updateTableConfig = (updates: Partial<{
    rowsPerTable: number;
    modulesPerRow: number;
    interTableSpacingY: number;
    interTableSpacingX: number;
  }>) => {
    // Start with existing config or default values
    const currentConfig = params.tableConfig || getDefaultTableConfig();
    
    // Create new config with all required properties
    const newConfig = {
      rowsPerTable: updates.rowsPerTable !== undefined ? updates.rowsPerTable : currentConfig.rowsPerTable,
      modulesPerRow: updates.modulesPerRow !== undefined ? updates.modulesPerRow : currentConfig.modulesPerRow,
      interTableSpacingY: updates.interTableSpacingY !== undefined ? updates.interTableSpacingY : currentConfig.interTableSpacingY,
      interTableSpacingX: updates.interTableSpacingX !== undefined ? updates.interTableSpacingX : currentConfig.interTableSpacingX
    };
    
    // Update params with new config
    updateParams({ tableConfig: newConfig });
  };

  // Helper function to update carport config with all required properties
  const updateCarportConfig = (updates: Partial<{
    rows: number;
    modulesPerRow: number;
    forceRectangle: boolean;
  }>) => {
    // Start with existing config or default values
    const currentConfig = params.carportConfig || getDefaultCarportConfig();
    
    // Create new config with all required properties
    const newConfig = {
      rows: updates.rows !== undefined ? updates.rows : currentConfig.rows,
      modulesPerRow: updates.modulesPerRow !== undefined ? updates.modulesPerRow : currentConfig.modulesPerRow,
      forceRectangle: updates.forceRectangle !== undefined ? updates.forceRectangle : currentConfig.forceRectangle
    };
    
    // Update params with new config
    updateParams({ carportConfig: newConfig });
  };

  // Handle specific structure type parameters
  const renderStructureSpecificParams = () => {
    switch (structureType.id) {
      case 'ground_mount_tables':
        return (
          <div className="space-y-4 mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium">Ground Mount Table Configuration</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="rowsPerTable" className="text-xs">Rows Per Table</Label>
                <Input 
                  id="rowsPerTable"
                  type="number"
                  min="1"
                  max="10"
                  value={(params.tableConfig?.rowsPerTable || DEFAULT_LAYOUT_PARAMS.ground_mount_tables.tableConfig?.rowsPerTable || 3).toString()}
                  onChange={(e) => {
                    const value = Math.max(1, parseInt(e.target.value || '3', 10));
                    updateTableConfig({ rowsPerTable: value });
                  }}
                  className="h-8 text-xs"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="modulesPerRow" className="text-xs">Modules Per Row</Label>
                <Input 
                  id="modulesPerRow"
                  type="number"
                  min="1"
                  max="20"
                  value={(params.tableConfig?.modulesPerRow || DEFAULT_LAYOUT_PARAMS.ground_mount_tables.tableConfig?.modulesPerRow || 5).toString()}
                  onChange={(e) => {
                    const value = Math.max(1, parseInt(e.target.value || '5', 10));
                    updateTableConfig({ modulesPerRow: value });
                  }}
                  className="h-8 text-xs"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interTableSpacingY" className="text-xs">Table Spacing Y (m)</Label>
                <Input 
                  id="interTableSpacingY"
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={(params.tableConfig?.interTableSpacingY || DEFAULT_LAYOUT_PARAMS.ground_mount_tables.tableConfig?.interTableSpacingY || 4).toString()}
                  onChange={(e) => {
                    const value = Math.max(0.5, parseFloat(e.target.value || '4'));
                    updateTableConfig({ interTableSpacingY: value });
                  }}
                  className="h-8 text-xs"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interTableSpacingX" className="text-xs">Table Spacing X (m)</Label>
                <Input 
                  id="interTableSpacingX"
                  type="number"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={(params.tableConfig?.interTableSpacingX || DEFAULT_LAYOUT_PARAMS.ground_mount_tables.tableConfig?.interTableSpacingX || 0.5).toString()}
                  onChange={(e) => {
                    const value = Math.max(0.1, parseFloat(e.target.value || '0.5'));
                    updateTableConfig({ interTableSpacingX: value });
                  }}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        );
        
      case 'carport':
        return (
          <div className="space-y-4 mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium">Carport Configuration</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="carportRows" className="text-xs">Rows</Label>
                <Input 
                  id="carportRows"
                  type="number"
                  min="1" 
                  max="20"
                  value={(params.carportConfig?.rows || DEFAULT_LAYOUT_PARAMS.carport.carportConfig?.rows || 6).toString()}
                  onChange={(e) => {
                    const value = Math.max(1, parseInt(e.target.value || '6', 10));
                    updateCarportConfig({ rows: value });
                  }}
                  className="h-8 text-xs"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="carportModulesPerRow" className="text-xs">Modules Per Row</Label>
                <Input 
                  id="carportModulesPerRow"
                  type="number"
                  min="1"
                  max="30"
                  value={(params.carportConfig?.modulesPerRow || DEFAULT_LAYOUT_PARAMS.carport.carportConfig?.modulesPerRow || 10).toString()}
                  onChange={(e) => {
                    const value = Math.max(1, parseInt(e.target.value || '10', 10));
                    updateCarportConfig({ modulesPerRow: value });
                  }}
                  className="h-8 text-xs"
                />
              </div>
              
              <div className="col-span-2 flex items-center space-x-2 pt-2">
                <Switch 
                  id="forceRectangle"
                  checked={params.carportConfig?.forceRectangle ?? DEFAULT_LAYOUT_PARAMS.carport.carportConfig?.forceRectangle ?? true}
                  onCheckedChange={(checked) => {
                    updateCarportConfig({ forceRectangle: checked });
                  }}
                />
                <Label htmlFor="forceRectangle" className="text-xs cursor-pointer">
                  Force rectangular shape
                </Label>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card className="mt-4">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium flex items-center gap-1.5">
            <Settings className="h-4 w-4" />
            Module Layout Parameters
          </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="tiltAngle" className="text-xs">Tilt Angle (°)</Label>
            <Input 
              id="tiltAngle"
              type="number"
              min="0"
              max="45"
              value={params.tiltAngle.toString()}
              onChange={(e) => updateParams({ tiltAngle: parseFloat(e.target.value || '0') })}
              className="h-8 text-xs"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="orientation" className="text-xs">Orientation</Label>
            <Select 
              value={params.orientation}
              onValueChange={(value) => updateParams({ orientation: value as 'landscape' | 'portrait' })}
            >
              <SelectTrigger id="orientation" className="h-8 text-xs">
                <SelectValue placeholder="Orientation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landscape">Landscape</SelectItem>
                <SelectItem value="portrait">Portrait</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="interRowSpacing" className="text-xs">Row Spacing (m)</Label>
            <Input 
              id="interRowSpacing"
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={params.interRowSpacing.toString()}
              onChange={(e) => updateParams({ interRowSpacing: parseFloat(e.target.value || '0') })}
              className="h-8 text-xs"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="adjacentGap" className="text-xs">Module Gap (mm)</Label>
            <Input 
              id="adjacentGap"
              type="number"
              min="10"
              max="100"
              value={params.adjacentGap.toString()}
              onChange={(e) => updateParams({ adjacentGap: parseInt(e.target.value || '20', 10) })}
              className="h-8 text-xs"
            />
          </div>
        </div>
        
        {renderStructureSpecificParams()}
      </CardContent>
    </Card>
  );
};
