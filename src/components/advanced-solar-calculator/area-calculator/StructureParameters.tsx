
import React, { useEffect, useState } from 'react';
import { LayoutParameters, StructureType } from './types';

interface StructureParametersProps {
  structureType: StructureType;
  layoutParams: LayoutParameters;
}

export const StructureParameters: React.FC<StructureParametersProps> = ({
  structureType,
  layoutParams,
}) => {
  // Create unique IDs for form elements
  const [inputIds] = useState({
    tiltAngle: `tilt-angle-${Math.random().toString(36).substring(2, 9)}`,
    orientation: `orientation-${Math.random().toString(36).substring(2, 9)}`,
    rowSpacing: `row-spacing-${Math.random().toString(36).substring(2, 9)}`,
    moduleGap: `module-gap-${Math.random().toString(36).substring(2, 9)}`,
    rowsPerTable: `rows-per-table-${Math.random().toString(36).substring(2, 9)}`,
    modulesPerRow: `modules-per-row-${Math.random().toString(36).substring(2, 9)}`,
    tableSpacingY: `table-spacing-y-${Math.random().toString(36).substring(2, 9)}`,
    tableSpacingX: `table-spacing-x-${Math.random().toString(36).substring(2, 9)}`,
    carportRows: `carport-rows-${Math.random().toString(36).substring(2, 9)}`,
    carportModulesPerRow: `carport-modules-per-row-${Math.random().toString(36).substring(2, 9)}`,
    forceRectangle: `force-rectangle-${Math.random().toString(36).substring(2, 9)}`
  });

  return (
    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-medium mb-3">Structure Parameters</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor={inputIds.tiltAngle} className="block text-sm text-gray-600">
            Tilt Angle (°)
          </label>
          <input
            id={inputIds.tiltAngle}
            type="number"
            value={layoutParams.tiltAngle}
            readOnly
            className="w-full p-1 border rounded bg-gray-100"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor={inputIds.orientation} className="block text-sm text-gray-600">
            Orientation
          </label>
          <input
            id={inputIds.orientation}
            type="text"
            value={layoutParams.orientation === 'landscape' ? 'Landscape' : 'Portrait'}
            readOnly
            className="w-full p-1 border rounded bg-gray-100"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor={inputIds.rowSpacing} className="block text-sm text-gray-600">
            Row Spacing (m)
          </label>
          <input
            id={inputIds.rowSpacing}
            type="number"
            value={layoutParams.interRowSpacing}
            readOnly
            className="w-full p-1 border rounded bg-gray-100"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor={inputIds.moduleGap} className="block text-sm text-gray-600">
            Module Gap (mm)
          </label>
          <input
            id={inputIds.moduleGap}
            type="number"
            value={layoutParams.adjacentGap}
            readOnly
            className="w-full p-1 border rounded bg-gray-100"
          />
        </div>
      </div>

      {/* Ground Mount Table specific information */}
      {structureType.id === 'ground_mount_tables' && layoutParams.tableConfig && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-medium text-sm mb-2">Table Configuration</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor={inputIds.rowsPerTable} className="block text-sm text-gray-600">
                Rows Per Table
              </label>
              <input
                id={inputIds.rowsPerTable}
                type="number"
                value={layoutParams.tableConfig.rowsPerTable}
                readOnly
                className="w-full p-1 border rounded bg-gray-100"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor={inputIds.modulesPerRow} className="block text-sm text-gray-600">
                Modules Per Row
              </label>
              <input
                id={inputIds.modulesPerRow}
                type="number"
                value={layoutParams.tableConfig.modulesPerRow}
                readOnly
                className="w-full p-1 border rounded bg-gray-100"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor={inputIds.tableSpacingY} className="block text-sm text-gray-600">
                Y-Spacing (m)
              </label>
              <input
                id={inputIds.tableSpacingY}
                type="number"
                value={layoutParams.tableConfig.interTableSpacingY || 4.0}
                readOnly
                className="w-full p-1 border rounded bg-gray-100"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor={inputIds.tableSpacingX} className="block text-sm text-gray-600">
                X-Spacing (m)
              </label>
              <input
                id={inputIds.tableSpacingX}
                type="number"
                value={layoutParams.tableConfig.interTableSpacingX || 0.5}
                readOnly
                className="w-full p-1 border rounded bg-gray-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* Carport specific information */}
      {structureType.id === 'carport' && layoutParams.carportConfig && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-medium text-sm mb-2">Carport Configuration</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor={inputIds.carportRows} className="block text-sm text-gray-600">
                Rows
              </label>
              <input
                id={inputIds.carportRows}
                type="number"
                value={layoutParams.carportConfig.rows}
                readOnly
                className="w-full p-1 border rounded bg-gray-100"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor={inputIds.carportModulesPerRow} className="block text-sm text-gray-600">
                Modules Per Row
              </label>
              <input
                id={inputIds.carportModulesPerRow}
                type="number"
                value={layoutParams.carportConfig.modulesPerRow}
                readOnly
                className="w-full p-1 border rounded bg-gray-100"
              />
            </div>

            <div className="col-span-2">
              <div className="flex items-center space-x-2 mt-2">
                <input
                  id={inputIds.forceRectangle}
                  type="checkbox"
                  checked={layoutParams.carportConfig.forceRectangle}
                  readOnly
                  disabled
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor={inputIds.forceRectangle} className="text-sm text-gray-600">
                  Force Rectangular Shape
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">
        <p>Based on {structureType.name} configuration and selected parameters.</p>
      </div>
    </div>
  );
};
