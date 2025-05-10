
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutParameters, StructureType } from './types';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StructureParametersProps {
  layoutParams: LayoutParameters;
  structureType: StructureType;
  onChange?: (newParams: LayoutParameters) => void;
}

export const StructureParameters: React.FC<StructureParametersProps> = ({
  layoutParams,
  structureType,
  onChange
}) => {
  // Generate unique IDs for form fields
  const fieldIdPrefix = React.useId();
  
  const handleChange = (field: keyof LayoutParameters, value: any) => {
    if (onChange) {
      const numValue = Number(value);
      onChange({
        ...layoutParams,
        [field]: !isNaN(numValue) ? numValue : value
      });
    }
  };
  
  const handleOrientationChange = (value: string) => {
    if (onChange) {
      onChange({
        ...layoutParams,
        orientation: value as 'portrait' | 'landscape'
      });
    }
  };
  
  // For ground mount table and carport specific configs
  const handleTableConfigChange = (field: string, value: any) => {
    if (onChange && layoutParams.tableConfig) {
      const numValue = Number(value);
      onChange({
        ...layoutParams,
        tableConfig: {
          ...layoutParams.tableConfig,
          [field]: !isNaN(numValue) ? numValue : value
        }
      });
    }
  };
  
  const handleCarportConfigChange = (field: string, value: any) => {
    if (onChange && layoutParams.carportConfig) {
      const numValue = typeof value === 'string' ? Number(value) : value;
      onChange({
        ...layoutParams,
        carportConfig: {
          ...layoutParams.carportConfig,
          [field]: typeof numValue === 'number' && !isNaN(numValue) ? numValue : value
        }
      });
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium">Module Layout Parameters</CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`${fieldIdPrefix}-tilt-angle`}>Tilt Angle (°)</Label>
            <Input
              id={`${fieldIdPrefix}-tilt-angle`}
              type="number"
              value={layoutParams.tiltAngle}
              onChange={(e) => handleChange('tiltAngle', e.target.value)}
              min={0}
              max={45}
              className="w-full"
              disabled={!onChange}
            />
          </div>
          
          <div>
            <Label htmlFor={`${fieldIdPrefix}-orientation`}>Orientation</Label>
            <Select 
              value={layoutParams.orientation} 
              onValueChange={handleOrientationChange}
              disabled={!onChange}
            >
              <SelectTrigger id={`${fieldIdPrefix}-orientation`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landscape">Landscape</SelectItem>
                <SelectItem value="portrait">Portrait</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor={`${fieldIdPrefix}-row-spacing`}>Row Spacing (m)</Label>
            <Input
              id={`${fieldIdPrefix}-row-spacing`}
              type="number"
              value={layoutParams.interRowSpacing}
              onChange={(e) => handleChange('interRowSpacing', e.target.value)}
              min={0.05}
              max={5}
              step={0.1}
              className="w-full"
              disabled={!onChange}
            />
          </div>
          
          <div>
            <Label htmlFor={`${fieldIdPrefix}-adjacent-gap`}>Module Gap (mm)</Label>
            <Input
              id={`${fieldIdPrefix}-adjacent-gap`}
              type="number"
              value={layoutParams.adjacentGap}
              onChange={(e) => handleChange('adjacentGap', e.target.value)}
              min={10}
              max={100}
              className="w-full"
              disabled={!onChange}
            />
          </div>
        </div>
        
        {/* Ground Mount Table specific controls */}
        {structureType.id === 'ground_mount_tables' && layoutParams.tableConfig && (
          <div className="mt-4 border-t border-gray-200 pt-3">
            <h4 className="font-medium text-sm mb-2">Ground Mount Table Configuration</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`${fieldIdPrefix}-rows-per-table`}>Rows Per Table</Label>
                <Input
                  id={`${fieldIdPrefix}-rows-per-table`}
                  type="number"
                  value={layoutParams.tableConfig.rowsPerTable || 3}
                  onChange={(e) => handleTableConfigChange('rowsPerTable', e.target.value)}
                  min={1}
                  max={10}
                  className="w-full"
                  disabled={!onChange}
                />
              </div>
              
              <div>
                <Label htmlFor={`${fieldIdPrefix}-modules-per-row`}>Modules Per Row</Label>
                <Input
                  id={`${fieldIdPrefix}-modules-per-row`}
                  type="number"
                  value={layoutParams.tableConfig.modulesPerRow || 5}
                  onChange={(e) => handleTableConfigChange('modulesPerRow', e.target.value)}
                  min={1}
                  max={20}
                  className="w-full"
                  disabled={!onChange}
                />
              </div>
              
              <div>
                <Label htmlFor={`${fieldIdPrefix}-table-spacing-y`}>Table Spacing Y (m)</Label>
                <Input
                  id={`${fieldIdPrefix}-table-spacing-y`}
                  type="number"
                  value={layoutParams.tableConfig.interTableSpacingY || 4.0}
                  onChange={(e) => handleTableConfigChange('interTableSpacingY', e.target.value)}
                  min={0.5}
                  max={10}
                  step={0.1}
                  className="w-full"
                  disabled={!onChange}
                />
                <p className="text-xs text-gray-500 mt-1">Distance between tables (front-to-front)</p>
              </div>
              
              <div>
                <Label htmlFor={`${fieldIdPrefix}-table-spacing-x`}>Table Spacing X (m)</Label>
                <Input
                  id={`${fieldIdPrefix}-table-spacing-x`}
                  type="number"
                  value={layoutParams.tableConfig.interTableSpacingX || 0.5}
                  onChange={(e) => handleTableConfigChange('interTableSpacingX', e.target.value)}
                  min={0.1}
                  max={5}
                  step={0.1}
                  className="w-full"
                  disabled={!onChange}
                />
                <p className="text-xs text-gray-500 mt-1">Distance between adjacent tables</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Carport specific controls */}
        {structureType.id === 'carport' && layoutParams.carportConfig && (
          <div className="mt-4 border-t border-gray-200 pt-3">
            <h4 className="font-medium text-sm mb-2">Carport Structure Configuration</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`${fieldIdPrefix}-carport-rows`}>Rows</Label>
                <Input
                  id={`${fieldIdPrefix}-carport-rows`}
                  type="number"
                  value={layoutParams.carportConfig.rows || 6}
                  onChange={(e) => handleCarportConfigChange('rows', e.target.value)}
                  min={1}
                  max={20}
                  className="w-full"
                  disabled={!onChange}
                />
              </div>
              
              <div>
                <Label htmlFor={`${fieldIdPrefix}-carport-modules-per-row`}>Modules Per Row</Label>
                <Input
                  id={`${fieldIdPrefix}-carport-modules-per-row`}
                  type="number"
                  value={layoutParams.carportConfig.modulesPerRow || 10}
                  onChange={(e) => handleCarportConfigChange('modulesPerRow', e.target.value)}
                  min={1}
                  max={30}
                  className="w-full"
                  disabled={!onChange}
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-3 text-xs text-gray-600 pt-2 border-t">
          <p>Layout shows modules using {layoutParams.orientation} orientation with {layoutParams.tiltAngle}° tilt.</p>
          {structureType.id === 'ground_mount_tables' && layoutParams.tableConfig ? (
            <p>
              Table config: {layoutParams.tableConfig.rowsPerTable || 3} rows per table, {' '}
              {layoutParams.tableConfig.modulesPerRow || 5} modules per row
            </p>
          ) : structureType.id === 'carport' && layoutParams.carportConfig ? (
            <p>
              Carport config: {layoutParams.carportConfig.rows || 6} rows, {' '}
              {layoutParams.carportConfig.modulesPerRow || 10} modules per row
            </p>
          ) : (
            <p>Row spacing: {layoutParams.interRowSpacing}m, Module gap: {layoutParams.adjacentGap}mm</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
