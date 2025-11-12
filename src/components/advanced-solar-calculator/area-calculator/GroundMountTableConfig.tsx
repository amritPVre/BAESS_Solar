import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LayoutParameters } from './types';
import { Grid3X3, Settings, BarChart } from 'lucide-react';

interface GroundMountTableConfigProps {
  layoutParams: LayoutParameters;
  onLayoutChange?: (params: LayoutParameters) => void;
  readOnly?: boolean;
}

export const GroundMountTableConfig: React.FC<GroundMountTableConfigProps> = ({ 
  layoutParams, 
  onLayoutChange,
  readOnly = true
}) => {
  // Ensure tableConfig exists
  const tableConfig = layoutParams.tableConfig || {
    rowsPerTable: 3,
    modulesPerRow: 5,
    interTableSpacingY: 4.0,
    interTableSpacingX: 0.5
  };

  const handleChange = (field: string, value: number) => {
    if (readOnly || !onLayoutChange) return;
    
    console.log(`Ground Mount Table Config: Updating ${field} to ${value}`);
    
    onLayoutChange({
      ...layoutParams,
      tableConfig: {
        ...tableConfig,
        [field]: value
      }
    });
  };

  // Calculate module count per table
  const modulesPerTable = tableConfig.rowsPerTable * tableConfig.modulesPerRow;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-amber-600 to-orange-700 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Grid3X3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Ground Mount Table Configuration</h3>
            <p className="text-amber-100 text-sm">Configure table layout and spacing parameters</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Configuration Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-amber-600" />
              <h4 className="font-medium text-gray-900">Table Parameters</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="rows-per-table" className="text-sm font-medium text-gray-700">Rows Per Table</Label>
                <Input
                  id="rows-per-table"
                  type="number"
                  value={tableConfig.rowsPerTable}
                  onChange={(e) => handleChange('rowsPerTable', parseInt(e.target.value))}
                  disabled={readOnly}
                  className={`h-9 ${readOnly ? "bg-gray-50" : "bg-white border-amber-200 focus:border-amber-500"}`}
                  min="1"
                  max="10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modules-per-row" className="text-sm font-medium text-gray-700">Modules Per Row</Label>
                <Input
                  id="modules-per-row"
                  type="number"
                  value={tableConfig.modulesPerRow}
                  onChange={(e) => handleChange('modulesPerRow', parseInt(e.target.value))}
                  disabled={readOnly}
                  className={`h-9 ${readOnly ? "bg-gray-50" : "bg-white border-amber-200 focus:border-amber-500"}`}
                  min="1"
                  max="20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="table-spacing-y" className="text-sm font-medium text-gray-700">Y Spacing (m)</Label>
                <Input
                  id="table-spacing-y"
                  type="number"
                  value={tableConfig.interTableSpacingY}
                  onChange={(e) => handleChange('interTableSpacingY', parseFloat(e.target.value))}
                  disabled={readOnly}
                  className={`h-9 ${readOnly ? "bg-gray-50" : "bg-white border-amber-200 focus:border-amber-500"}`}
                  min="0.5"
                  max="10"
                  step="0.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="table-spacing-x" className="text-sm font-medium text-gray-700">X Spacing (m)</Label>
                <Input
                  id="table-spacing-x"
                  type="number"
                  value={tableConfig.interTableSpacingX}
                  onChange={(e) => handleChange('interTableSpacingX', parseFloat(e.target.value))}
                  disabled={readOnly}
                  className={`h-9 ${readOnly ? "bg-gray-50" : "bg-white border-amber-200 focus:border-amber-500"}`}
                  min="0.1"
                  max="5"
                  step="0.1"
                />
              </div>
            </div>
          </div>
          
          {/* Summary Statistics */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart className="h-4 w-4 text-amber-600" />
              <h4 className="font-medium text-gray-900">Configuration Summary</h4>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-3 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-amber-800">Table Structure</div>
                    <div className="text-xs text-amber-600 mt-1">Rows × Modules per row</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-amber-800">{tableConfig.rowsPerTable} × {tableConfig.modulesPerRow}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg p-3 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-orange-800">Modules Per Table</div>
                    <div className="text-xs text-orange-600 mt-1">Total modules per table</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-orange-800">{modulesPerTable}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg p-3 border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-yellow-800">Table Spacing</div>
                    <div className="text-xs text-yellow-600 mt-1">Y-axis × X-axis (meters)</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-yellow-800">{tableConfig.interTableSpacingY}m × {tableConfig.interTableSpacingX}m</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Compact Table Layout Diagram */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Layout Preview</h4>
            <div className="text-sm text-amber-600">
              {tableConfig.rowsPerTable} rows × {tableConfig.modulesPerRow} modules per row
            </div>
          </div>
          <TableLayoutDiagram 
            rowsPerTable={tableConfig.rowsPerTable} 
            modulesPerRow={tableConfig.modulesPerRow}
            tableConfig={tableConfig}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Helper component to render the table layout diagram
const TableLayoutDiagram: React.FC<{
  rowsPerTable: number, 
  modulesPerRow: number,
  tableConfig: {
    interTableSpacingX: number;
    interTableSpacingY: number;
  }
}> = ({ 
  rowsPerTable, 
  modulesPerRow,
  tableConfig
}) => {
  // Calculate dimensions based on rows and modules
  const maxModules = Math.max(modulesPerRow, 10);
  const moduleWidth = 200 / maxModules;
  const moduleHeight = moduleWidth * 0.6; // Aspect ratio for modules
  
  const tableWidth = moduleWidth * modulesPerRow;
  const tableHeight = moduleHeight * rowsPerTable;
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3 justify-center">
        {/* First row of tables */}
        <div 
          className="border-2 border-blue-700 bg-blue-100 rounded-sm overflow-hidden"
          style={{ width: tableWidth, height: tableHeight }}
        >
          {Array.from({ length: rowsPerTable }).map((_, rowIdx) => (
            <div key={`row-${rowIdx}`} className="flex">
              {Array.from({ length: modulesPerRow }).map((_, moduleIdx) => (
                <div 
                  key={`module-${rowIdx}-${moduleIdx}`}
                  className="border border-blue-500 bg-blue-300"
                  style={{ width: moduleWidth, height: moduleHeight }}
                />
              ))}
            </div>
          ))}
        </div>
        
        {/* Arrow between tables */}
        <div className="flex items-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        {/* Second table */}
        <div 
          className="border-2 border-blue-700 bg-blue-100 rounded-sm overflow-hidden"
          style={{ width: tableWidth, height: tableHeight }}
        >
          {Array.from({ length: rowsPerTable }).map((_, rowIdx) => (
            <div key={`row2-${rowIdx}`} className="flex">
              {Array.from({ length: modulesPerRow }).map((_, moduleIdx) => (
                <div 
                  key={`module2-${rowIdx}-${moduleIdx}`}
                  className="border border-blue-500 bg-blue-300"
                  style={{ width: moduleWidth, height: moduleHeight }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-xs text-center text-gray-500 mt-1">
        Table spacing: {tableConfig.interTableSpacingX}m (X) × {tableConfig.interTableSpacingY}m (Y)
      </div>
    </div>
  );
}; 