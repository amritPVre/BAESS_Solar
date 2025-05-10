
import React, { useState, useCallback } from 'react';
import type { SolarPanel } from '@/types/components';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Trash2, Square, Hexagon } from 'lucide-react';
import { AreaMapContainer } from './AreaMapContainer';
import { StructureSelector } from './StructureSelector';
import { AreaCalculationResults } from './AreaCalculationResults';
import { StructureParameters } from './StructureParameters';
import { DrawingInstructions } from './DrawingInstructions';
import { useAreaCalculator } from './useAreaCalculator';
import { PolygonConfig } from './types';

interface AreaCalculatorProps {
  selectedPanel: SolarPanel;
  onCapacityCalculated: (capacityKw: number, areaM2: number, moduleCount: number, configs?: PolygonConfig[]) => void;
  latitude: number;
  longitude: number;
}

const AreaCalculator: React.FC<AreaCalculatorProps> = ({ 
  selectedPanel, 
  onCapacityCalculated, 
  latitude, 
  longitude 
}) => {
  const {
    polygons, 
    totalArea,
    totalCapacity,
    moduleCount,
    placedModuleCount,
    placedModulesPerPolygon,
    polygonConfigs,
    structureType,
    setStructureType,
    drawingManagerRef,
    instructionsVisible,
    setInstructionsVisible,
    layoutParams,
    structureTypes,
    startDrawingPolygon,
    startDrawingRectangle,
    clearAllPolygons,
    onMapLoaded
  } = useAreaCalculator({ selectedPanel, onCapacityCalculated, latitude, longitude });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Define PV Installation Areas
        </h2>
        
        <div className="flex gap-2">
          {instructionsVisible ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setInstructionsVisible(false)}
              className="text-xs"
            >
              Hide Instructions
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setInstructionsVisible(true)}
              className="text-xs"
            >
              Show Instructions
            </Button>
          )}
        </div>
      </div>
      
      {instructionsVisible && <DrawingInstructions />}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <div className="lg:col-span-3">
          <div className="flex flex-wrap gap-2 mb-4">
            <StructureSelector 
              structureType={structureType}
              structureTypes={structureTypes}
              onChange={setStructureType}
            />
            
            <Button 
              onClick={startDrawingPolygon} 
              variant="outline" 
              size="sm" 
              className="gap-1"
            >
              <Hexagon className="h-4 w-4" />
              Draw Polygon
            </Button>
            
            <Button 
              onClick={startDrawingRectangle} 
              variant="outline" 
              size="sm" 
              className="gap-1"
            >
              <Square className="h-4 w-4" />
              Draw Rectangle
            </Button>
            
            <Button 
              onClick={clearAllPolygons} 
              variant="outline" 
              size="sm" 
              className="gap-1 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </div>
          
          <AreaMapContainer
            drawingManagerRef={drawingManagerRef}
            latitude={latitude}
            longitude={longitude}
            onMapLoaded={onMapLoaded}
          />
        </div>
        
        <div className="lg:col-span-1">
          <AreaCalculationResults
            totalArea={totalArea}
            moduleCount={moduleCount}
            placedModuleCount={placedModuleCount}
            totalCapacity={totalCapacity}
            polygonConfigs={polygonConfigs}
          />
          
          {polygons.length > 0 && (
            <StructureParameters
              layoutParams={layoutParams}
              structureType={structureType}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AreaCalculator;
