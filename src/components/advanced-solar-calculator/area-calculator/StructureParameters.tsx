
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <div className="mt-6 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-medium mb-3">Module Layout Parameters</h3>
      <div className="flex flex-wrap gap-4">
        <div>
          <Label htmlFor="tiltAngle" className="block text-sm text-gray-600 mb-1">Tilt Angle (°)</Label>
          <Input
            id="tiltAngle"
            type="number"
            value={layoutParams.tiltAngle}
            min="0"
            max="45"
            className="w-24 p-1 border rounded"
            readOnly
          />
        </div>
        <div>
          <Label htmlFor="orientation" className="block text-sm text-gray-600 mb-1">Orientation</Label>
          <Select value={layoutParams.orientation} disabled>
            <SelectTrigger id="orientation" className="w-32">
              <SelectValue placeholder="Orientation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="landscape">Landscape</SelectItem>
              <SelectItem value="portrait">Portrait</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="rowSpacing" className="block text-sm text-gray-600 mb-1">Row Spacing (m)</Label>
          <Input
            id="rowSpacing"
            type="number"
            value={layoutParams.interRowSpacing}
            min="0.3"
            max="5"
            step="0.1"
            className="w-24 p-1 border rounded"
            readOnly
          />
        </div>
        <div>
          <Label htmlFor="moduleGap" className="block text-sm text-gray-600 mb-1">Module Gap (mm)</Label>
          <Input
            id="moduleGap"
            type="number"
            value={layoutParams.adjacentGap}
            min="10"
            max="100"
            className="w-24 p-1 border rounded"
            readOnly
          />
        </div>
      </div>
      
      {structureType.id === 'ground_mount_tables' && layoutParams.tableConfig && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-2">Ground Mount Table Configuration</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rowsPerTable" className="block text-sm text-gray-600 mb-1">Rows Per Table</Label>
              <Input
                id="rowsPerTable"
                type="number"
                value={layoutParams.tableConfig.rowsPerTable}
                className="w-full p-1 border rounded"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="modulesPerRow" className="block text-sm text-gray-600 mb-1">Modules Per Row</Label>
              <Input
                id="modulesPerRow"
                type="number"
                value={layoutParams.tableConfig.modulesPerRow}
                className="w-full p-1 border rounded"
                readOnly
              />
            </div>
          </div>
        </div>
      )}
      
      {structureType.id === 'carport' && layoutParams.carportConfig && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-2">Carport Configuration</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="carportRows" className="block text-sm text-gray-600 mb-1">Rows</Label>
              <Input
                id="carportRows"
                type="number"
                value={layoutParams.carportConfig.rows}
                className="w-full p-1 border rounded"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="carportModulesPerRow" className="block text-sm text-gray-600 mb-1">Modules Per Row</Label>
              <Input
                id="carportModulesPerRow"
                type="number"
                value={layoutParams.carportConfig.modulesPerRow}
                className="w-full p-1 border rounded"
                readOnly
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-600">
        <p>{structureType.name} layout uses {layoutParams.orientation} orientation with {layoutParams.tiltAngle}° tilt.</p>
      </div>
    </div>
  );
};
