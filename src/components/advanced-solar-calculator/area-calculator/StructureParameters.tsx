
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LayoutParameters, StructureType } from './types';

interface StructureParametersProps {
  layoutParams: LayoutParameters;
  structureType: StructureType;
}

export const StructureParameters: React.FC<StructureParametersProps> = ({ 
  layoutParams, 
  structureType 
}) => {
  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <h3 className="font-medium text-sm mb-2">Structure Parameters</h3>
        <div className="space-y-2 text-xs">
          <p>
            <span className="font-medium">Tilt:</span> {layoutParams.tiltAngle}°
          </p>
          <p>
            <span className="font-medium">Orientation:</span> {layoutParams.orientation}
          </p>
          {structureType.id === 'ground_mount_tables' && layoutParams.tableConfig && (
            <div className="mt-1">
              <p><span className="font-medium">Table Config:</span></p>
              <p className="pl-2">{layoutParams.tableConfig.rowsPerTable} rows × {layoutParams.tableConfig.modulesPerRow} modules</p>
            </div>
          )}
          {structureType.id === 'carport' && layoutParams.carportConfig && (
            <div className="mt-1">
              <p><span className="font-medium">Carport Config:</span></p>
              <p className="pl-2">{layoutParams.carportConfig.rows} rows × {layoutParams.carportConfig.modulesPerRow} modules</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
