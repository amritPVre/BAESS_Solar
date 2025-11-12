import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { LayoutParameters } from './types';
import { CheckedState } from "@radix-ui/react-checkbox";
import { Car, Settings, BarChart } from 'lucide-react';

interface CarportStructureConfigProps {
  layoutParams: LayoutParameters;
  onLayoutChange?: (params: LayoutParameters) => void;
  readOnly?: boolean;
}

export const CarportStructureConfig: React.FC<CarportStructureConfigProps> = ({ 
  layoutParams, 
  onLayoutChange,
  readOnly = true
}) => {
  // Ensure carportConfig exists
  const carportConfig = layoutParams.carportConfig || {
    rows: 6,
    modulesPerRow: 10,
    forceRectangle: true
  };

  const handleChange = (field: string, value: number | boolean) => {
    if (readOnly || !onLayoutChange) return;
    
    console.log(`Carport Structure Config: Updating ${field} to ${value}`);
    
    onLayoutChange({
      ...layoutParams,
      carportConfig: {
        ...carportConfig,
        [field]: value
      }
    });
  };

  // Function to handle checkbox state changes
  const handleCheckboxChange = (checked: CheckedState) => {
    if (readOnly || !onLayoutChange) return;
    
    console.log(`Carport Structure Config: Updating forceRectangle to ${checked === true}`);
    
    onLayoutChange({
      ...layoutParams,
      carportConfig: {
        ...carportConfig,
        forceRectangle: checked === true
      }
    });
  };

  // Calculate module count per carport
  const modulesPerCarport = carportConfig.rows * carportConfig.modulesPerRow;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-purple-600 to-violet-700 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Carport Structure Configuration</h3>
            <p className="text-purple-100 text-sm">Configure carport layout and structural parameters</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Configuration Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-purple-600" />
              <h4 className="font-medium text-gray-900">Structure Parameters</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="rows-input" className="text-sm font-medium text-gray-700">Rows</Label>
                <Input
                  id="rows-input"
                  type="number"
                  value={carportConfig.rows}
                  onChange={(e) => handleChange('rows', parseInt(e.target.value))}
                  disabled={readOnly}
                  className={`h-9 ${readOnly ? "bg-gray-50" : "bg-white border-purple-200 focus:border-purple-500"}`}
                  min="1"
                  max="20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modules-per-row" className="text-sm font-medium text-gray-700">Modules Per Row</Label>
                <Input
                  id="modules-per-row"
                  type="number"
                  value={carportConfig.modulesPerRow}
                  onChange={(e) => handleChange('modulesPerRow', parseInt(e.target.value))}
                  disabled={readOnly}
                  className={`h-9 ${readOnly ? "bg-gray-50" : "bg-white border-purple-200 focus:border-purple-500"}`}
                  min="1"
                  max="30"
                />
              </div>
            </div>
            
            <div className="p-3 bg-white rounded-lg border border-purple-200">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="force-rectangle"
                  checked={carportConfig.forceRectangle}
                  onCheckedChange={handleCheckboxChange}
                  disabled={readOnly}
                  className={readOnly ? "bg-gray-50" : ""}
                />
                <div>
                  <Label htmlFor="force-rectangle" className="text-sm font-medium text-gray-900">Maintain Rectangular Shape</Label>
                  <p className="text-xs text-gray-600 mt-1">Force carport to maintain rectangular layout</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Summary Statistics */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart className="h-4 w-4 text-purple-600" />
              <h4 className="font-medium text-gray-900">Configuration Summary</h4>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-gradient-to-r from-purple-100 to-violet-100 rounded-lg p-3 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-purple-800">Carport Structure</div>
                    <div className="text-xs text-purple-600 mt-1">Rows × Modules per row</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-purple-800">{carportConfig.rows} × {carportConfig.modulesPerRow}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-violet-100 to-indigo-100 rounded-lg p-3 border border-violet-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-violet-800">Modules Per Carport</div>
                    <div className="text-xs text-violet-600 mt-1">Total modules per structure</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-violet-800">{modulesPerCarport}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-3 border border-indigo-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-indigo-800">Shape Configuration</div>
                    <div className="text-xs text-indigo-600 mt-1">Layout enforcement</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-indigo-800">
                      {carportConfig.forceRectangle ? "Rectangular" : "Flexible"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Compact Carport Layout Diagram */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Layout Preview</h4>
            <div className="text-sm text-purple-600">
              {carportConfig.rows} rows × {carportConfig.modulesPerRow} modules per row
            </div>
          </div>
          <CarportLayoutDiagram 
            rows={carportConfig.rows} 
            modulesPerRow={carportConfig.modulesPerRow}
            forceRectangle={carportConfig.forceRectangle}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Helper component to render the carport layout diagram
const CarportLayoutDiagram: React.FC<{
  rows: number, 
  modulesPerRow: number,
  forceRectangle: boolean
}> = ({ 
  rows, 
  modulesPerRow,
  forceRectangle
}) => {
  // Calculate dimensions based on rows and modules
  const maxModules = Math.max(modulesPerRow, 10);
  const moduleWidth = 200 / maxModules;
  const moduleHeight = moduleWidth * 0.6; // Aspect ratio for modules
  
  const carportWidth = moduleWidth * modulesPerRow;
  const carportHeight = moduleHeight * rows;
  
  // Carport supports (pillars)
  const renderSupports = () => {
    const numSupports = Math.ceil(modulesPerRow / 5) + 1; // One support every 5 modules + end supports
    const supportWidth = 4;
    const supportPositions = [];
    
    // Calculate positions for supports
    for (let i = 0; i < numSupports; i++) {
      const position = i === 0 ? 0 : i === numSupports - 1 ? carportWidth : (carportWidth / (numSupports - 1)) * i;
      supportPositions.push(position);
    }
    
    return (
      <>
        {supportPositions.map((position, idx) => (
          <div 
            key={`support-${idx}`}
            className="absolute bg-gray-600 rounded-full" 
            style={{ 
              width: supportWidth, 
              height: supportWidth, 
              bottom: -supportWidth/2, 
              left: position - supportWidth/2,
              zIndex: 2
            }}
          />
        ))}
      </>
    );
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Carport structure */}
        <div 
          className="border-2 border-blue-700 bg-blue-50 rounded-sm overflow-hidden relative"
          style={{ width: carportWidth, height: carportHeight }}
        >
          {/* Module layout */}
          {Array.from({ length: rows }).map((_, rowIdx) => (
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
          
          {/* Render supports/pillars */}
          {renderSupports()}
        </div>
        
        {/* Ground surface */}
        <div 
          className="h-1 bg-gray-400 rounded-full mt-1"
          style={{ width: carportWidth + 20 }}
        />
      </div>
      
      <div className="text-xs text-center text-gray-500 mt-3">
        {forceRectangle ? 
          "Maintaining rectangular shape for accurate representation" : 
          "Carport shape adapts to the drawn area"
        }
      </div>
    </div>
  );
}; 