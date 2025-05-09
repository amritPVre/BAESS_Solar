
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { PolygonConfig } from './types';

interface AreaCalculationResultsProps {
  totalArea: number;
  moduleCount: number;
  placedModuleCount: number;
  totalCapacity: number;
  polygonConfigs: PolygonConfig[];
}

export const AreaCalculationResults: React.FC<AreaCalculationResultsProps> = ({ 
  totalArea, 
  moduleCount, 
  placedModuleCount, 
  totalCapacity, 
  polygonConfigs 
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-medium text-lg mb-2">Calculation Results</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Total Area</p>
            <p className="font-medium">{totalArea.toFixed(1)} m²</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Placed Modules</p>
            <p className="font-medium">{placedModuleCount} <span className="text-xs text-gray-500">({moduleCount} max possible)</span></p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Capacity</p>
            <p className="font-medium">{totalCapacity.toFixed(2)} kWp</p>
          </div>
          
          {polygonConfigs.length > 0 && (
            <div className="pt-3 border-t mt-3">
              <p className="text-sm font-medium mb-2">Areas Breakdown:</p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {polygonConfigs.map((config, idx) => (
                  <div key={`area-${idx}`} className="text-xs p-2 bg-gray-50 rounded">
                    <div className="flex justify-between">
                      <span className="font-medium">Area {idx+1}:</span>
                      <span>{config.area.toFixed(1)} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Modules:</span>
                      <span>{config.moduleCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Azimuth:</span>
                      <span>{config.azimuth}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span>{config.structureType}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
