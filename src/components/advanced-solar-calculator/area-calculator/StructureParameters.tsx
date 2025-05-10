
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Sliders } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StructureType, LayoutParameters } from './types';

interface StructureParametersProps {
  layoutParams: LayoutParameters;
  structureType: StructureType;
}

export const StructureParameters = ({ layoutParams, structureType }: StructureParametersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Determine if this structure type has advanced settings
  const hasAdvancedSettings = structureType.id === 'ground_mount_tables' || structureType.id === 'carport';
  
  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-base flex items-center gap-1">
            <Sliders className="h-4 w-4 text-primary" />
            Layout Parameters
          </h3>
          {hasAdvancedSettings && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-gray-500 hover:underline"
            >
              {isExpanded ? 'Hide Advanced' : 'Show Advanced'}
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tilt-angle-input">Tilt Angle (°)</Label>
              <Input
                id="tilt-angle-input"
                type="number"
                value={layoutParams.tiltAngle}
                readOnly
                className="bg-gray-50"
                min="0"
                max="45"
              />
            </div>
            <div>
              <Label htmlFor="orientation-select">Orientation</Label>
              <Select
                value={layoutParams.orientation}
                disabled
              >
                <SelectTrigger id="orientation-select" className="bg-gray-50">
                  <SelectValue placeholder="Select orientation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="landscape">Landscape</SelectItem>
                  <SelectItem value="portrait">Portrait</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="row-spacing-input">Row Spacing (m)</Label>
              <Input
                id="row-spacing-input"
                type="number"
                value={layoutParams.interRowSpacing}
                readOnly
                className="bg-gray-50"
                min="0.3"
                max="5"
                step="0.1"
              />
            </div>
            <div>
              <Label htmlFor="module-gap-input">Module Gap (mm)</Label>
              <Input
                id="module-gap-input"
                type="number"
                value={layoutParams.adjacentGap}
                readOnly
                className="bg-gray-50"
                min="10"
                max="100"
              />
            </div>
          </div>
          
          {/* Ground Mount Table settings */}
          {isExpanded && structureType.id === 'ground_mount_tables' && layoutParams.tableConfig && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <h4 className="font-medium text-sm mb-2">Ground Mount Table Config</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="rows-per-table-input">Rows Per Table</Label>
                  <Input
                    id="rows-per-table-input"
                    type="number"
                    value={layoutParams.tableConfig.rowsPerTable}
                    readOnly
                    className="bg-gray-50"
                    min="1"
                    max="10"
                  />
                </div>
                <div>
                  <Label htmlFor="modules-per-row-input">Modules Per Row</Label>
                  <Input
                    id="modules-per-row-input"
                    type="number"
                    value={layoutParams.tableConfig.modulesPerRow}
                    readOnly
                    className="bg-gray-50"
                    min="1"
                    max="20"
                  />
                </div>
                <div>
                  <Label htmlFor="table-y-spacing-input">Table Spacing Y (m)</Label>
                  <Input
                    id="table-y-spacing-input"
                    type="number"
                    value={layoutParams.tableConfig.interTableSpacingY || 4.0}
                    readOnly
                    className="bg-gray-50"
                    min="0.5"
                    max="10"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="table-x-spacing-input">Table Spacing X (m)</Label>
                  <Input
                    id="table-x-spacing-input"
                    type="number"
                    value={layoutParams.tableConfig.interTableSpacingX || 0.5}
                    readOnly
                    className="bg-gray-50"
                    min="0.1"
                    max="5"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Carport settings */}
          {isExpanded && structureType.id === 'carport' && layoutParams.carportConfig && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <h4 className="font-medium text-sm mb-2">Carport Structure Config</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="carport-rows-input">Rows</Label>
                  <Input
                    id="carport-rows-input"
                    type="number"
                    value={layoutParams.carportConfig.rows}
                    readOnly
                    className="bg-gray-50"
                    min="1"
                    max="20"
                  />
                </div>
                <div>
                  <Label htmlFor="carport-modules-per-row-input">Modules Per Row</Label>
                  <Input
                    id="carport-modules-per-row-input"
                    type="number"
                    value={layoutParams.carportConfig.modulesPerRow}
                    readOnly
                    className="bg-gray-50"
                    min="1"
                    max="30"
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="force-rectangle-checkbox"
                      checked={layoutParams.carportConfig.forceRectangle}
                      readOnly
                      disabled
                      className="bg-gray-50 h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="force-rectangle-checkbox">Force rectangular shape</Label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
