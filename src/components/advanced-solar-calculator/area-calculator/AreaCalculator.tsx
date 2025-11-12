import React, { useState, useCallback, useEffect } from 'react';
import type { SolarPanel } from '@/types/components';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Trash2, Square, Hexagon, Ruler } from 'lucide-react';
import { AreaMapContainer } from './AreaMapContainer';
import { StructureSelector } from './StructureSelector';
import { AreaCalculationResults } from './AreaCalculationResults';
import { DrawingInstructions } from './DrawingInstructions';
import { useAreaCalculator } from './useAreaCalculator';
import { PolygonConfig, LayoutParameters } from './types';
import { DEFAULT_LAYOUT_PARAMS } from './constants';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sliders, RotateCcw } from 'lucide-react';
import { useModulePlacement } from './hooks/useModulePlacement';
import { TableLayoutAlignment } from './hooks/types';
import { StructureParameters } from './StructureParameters';
import { TableAlignmentSelector } from './components/TableAlignmentSelector';
import { usePolygonEdgeDimensions } from './hooks/usePolygonEdgeDimensions';

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
    moduleCount,
    structureType,
    setStructureType,
    drawingManagerRef,
    instructionsVisible,
    setInstructionsVisible,
    structureTypes,
    startDrawingPolygon,
    startDrawingRectangle,
    clearAllPolygons,
    onMapLoaded,
    moduleCalculationRef,
    mapRef
  } = useAreaCalculator({ selectedPanel, onCapacityCalculated, latitude, longitude });

  // Create local state for layout parameters since useAreaCalculator no longer provides it
  const [layoutParams, setLayoutParams] = useState<LayoutParameters>(
    DEFAULT_LAYOUT_PARAMS[structureTypes[0]?.id] || DEFAULT_LAYOUT_PARAMS.ballasted
  );

  // Set a default module count value if none is provided from useAreaCalculator
  // This ensures modules will be placed even if moduleCount is 0
  // Use unlimited value to let the placement algorithm determine the actual count based on area and structure constraints
  const defaultModuleCount = Number.MAX_SAFE_INTEGER; // No artificial limit - let placement algorithm decide
  const effectiveModuleCount = moduleCount > 0 ? moduleCount : defaultModuleCount;
  
  // FORCE DEBUG: Log the actual values to verify changes took effect - CACHE BUSTER v3.0
  console.log(`🔧 FORCE DEBUG v3.0 CACHE BUSTER - defaultModuleCount: ${defaultModuleCount}, moduleCount: ${moduleCount}, effectiveModuleCount: ${effectiveModuleCount}, MAX_SAFE_INTEGER: ${Number.MAX_SAFE_INTEGER}`);

  // Add state for table alignment - initialize with Center alignment for better usability
  const [tableAlignment, setTableAlignment] = useState<TableLayoutAlignment>(TableLayoutAlignment.Center);

  // Add state for edge dimensions display
  const [showEdgeDimensions, setShowEdgeDimensions] = useState(true);

  // Use edge dimensions hook to display polygon edge measurements
  console.log('🔧 About to call usePolygonEdgeDimensions with:', {
    polygonCount: polygons.length,
    mapAvailable: !!mapRef?.current,
    showEdgeDimensions
  });
  
  const { edgeLabels, clearAllEdgeLabels, createAllEdgeLabels } = usePolygonEdgeDimensions({
    polygons,
    map: mapRef?.current,
    enabled: showEdgeDimensions
  });
  
  console.log('🔧 Hook returned:', { edgeLabelsCount: edgeLabels?.length || 0 });

  // Debug logging for edge dimensions integration
  useEffect(() => {
    console.log('🔧 AreaCalculator edge dimensions state:', {
      showEdgeDimensions,
      polygonCount: polygons.length,
      mapAvailable: !!mapRef?.current,
      edgeLabelsCount: edgeLabels.length
    });
  }, [showEdgeDimensions, polygons.length, edgeLabels.length]);

  // Connect with module placement hook to place modules on the map
  const {
    placedModules, 
    polygonConfigs: modulePlacementPolygonConfigs,
    capacityKw, 
    moduleRectangles,
    triggerModuleCalculation,
    forceRedrawAllModules
  } = useModulePlacement({
    map: mapRef?.current,
    polygons,
    selectedPanel,
    moduleCount: effectiveModuleCount, // Use the effective module count
    structureType,
    layoutParams, // Pass layout params directly
    totalArea,
    onCapacityCalculated,
    tableAlignment // Pass the table alignment
  });

  // Debug log to track module count
  useEffect(() => {
    const isUnlimited = effectiveModuleCount === Number.MAX_SAFE_INTEGER;
    console.log(`Module counts - effective: ${isUnlimited ? 'UNLIMITED (algorithm decides)' : effectiveModuleCount}, original: ${moduleCount}, placed: ${placedModules}`);
  }, [effectiveModuleCount, moduleCount, placedModules]);

  // Simple wrapper for module calculation
  const handleTriggerCalculation = useCallback(() => {
    console.log("AreaCalculator: Triggering module calculation due to parameter change");
    
    // Ensure we call the actual triggerModuleCalculation from useModulePlacement
    if (typeof triggerModuleCalculation === 'function') {
      console.log("Calling triggerModuleCalculation from useModulePlacement");
      triggerModuleCalculation();
    }
  }, [triggerModuleCalculation]);

  // Connect the moduleCalculationRef to our wrapper function
  useEffect(() => {
    if (moduleCalculationRef.current) {
      console.log("Setting moduleCalculationRef.triggerCalculation to our wrapper");
      moduleCalculationRef.current.triggerCalculation = handleTriggerCalculation;
    }
  }, [moduleCalculationRef, handleTriggerCalculation]);

  // Also trigger calculation when layout parameters change
  useEffect(() => {
    console.log("Layout parameters changed:", JSON.stringify(layoutParams));
    
    // Trigger after a short delay to ensure state is updated
    setTimeout(() => {
      handleTriggerCalculation();
    }, 10);
  }, [layoutParams, handleTriggerCalculation]);

  // Also trigger calculation when table alignment changes
  useEffect(() => {
    console.log("Table alignment changed:", tableAlignment);
    
    // Only trigger calculation if we have polygons
    if (polygons.length > 0) {
      // Trigger after a short delay to ensure state is updated
      setTimeout(() => {
        handleTriggerCalculation();
      }, 10);
    }
  }, [tableAlignment, polygons.length, handleTriggerCalculation]);

  // Update layout parameters when structure type changes
  useEffect(() => {
    console.log("Structure type changed to:", structureType.id);
    const defaultParams = DEFAULT_LAYOUT_PARAMS[structureType.id] || DEFAULT_LAYOUT_PARAMS.ballasted;
    
    // Preserve tableConfig if we're switching to ground_mount_tables and already have settings
    if (structureType.id === 'ground_mount_tables' && layoutParams.tableConfig) {
      setLayoutParams({
        ...defaultParams,
        tableConfig: layoutParams.tableConfig
      });
    } 
    // Preserve carportConfig if we're switching to carport and already have settings
    else if (structureType.id === 'carport' && layoutParams.carportConfig) {
      setLayoutParams({
        ...defaultParams,
        carportConfig: layoutParams.carportConfig
      });
    }
    // Handle fixed_tilt structure with table configuration
    else if (structureType.id === 'fixed_tilt' && layoutParams.tableConfig) {
      setLayoutParams({
        ...defaultParams,
        tableConfig: {
          ...defaultParams.tableConfig,
          ...layoutParams.tableConfig
        }
      });
    }
    else {
      setLayoutParams(defaultParams);
    }
  }, [structureType.id]);

  // Reset to default parameters for the current structure type
  const resetToDefaults = () => {
    console.log("Resetting layout parameters to defaults for", structureType.id);
    const defaults = DEFAULT_LAYOUT_PARAMS[structureType.id];
    if (defaults) {
      setLayoutParams({...defaults});
    }
    // Also reset the table alignment to Center
    setTableAlignment(TableLayoutAlignment.Center);
  };

  // Handle table alignment change - WRAP IN useCallback
  const handleTableAlignmentChange = useCallback((alignment: TableLayoutAlignment) => {
    console.log("AreaCalculator: Changing table alignment to:", alignment);
    setTableAlignment(alignment); // This will trigger the useEffect that depends on tableAlignment
    
    // The actual module calculation is triggered by the useEffect hook that watches tableAlignment changes,
    // or by the force-module-recalculation event dispatched by TableAlignmentSelector.
    // To ensure timely recalculation, especially if the useEffect might be debounced or delayed,
    // we can also consider directly triggering here if needed, but let's rely on existing mechanisms first.
  }, [/* setTableAlignment is stable, no other direct deps from this function's body */]);

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
      
      {instructionsVisible && <DrawingInstructions isOpen={instructionsVisible} onClose={() => setInstructionsVisible(false)} />}
      
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

            {polygons.length > 0 && (
              <Button 
                onClick={() => setShowEdgeDimensions(!showEdgeDimensions)} 
                variant={showEdgeDimensions ? "default" : "outline"}
                size="sm" 
                className="gap-1"
                title={showEdgeDimensions ? "Hide edge dimensions" : "Show edge dimensions"}
              >
                <Ruler className="h-4 w-4" />
                {showEdgeDimensions ? "Hide" : "Show"} Dimensions
              </Button>
            )}
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
            placedModuleCount={placedModules}
            totalCapacity={capacityKw}
            polygonConfigs={modulePlacementPolygonConfigs}
            selectedPanelArea={
              // Use the exact panel area if available, otherwise calculate it
              // For Longi LR5-72HPH-565M panel, the area is 2.58 m²
              selectedPanel.panel_area_m2 || 
              (selectedPanel.length && selectedPanel.width ? 
                (selectedPanel.length * selectedPanel.width / 1000000) : 
                2.58 // Default to 2.58 m² based on the Longi panel dimensions
              )
            }
          />
          
          {polygons.length > 0 && (
            <StructureParameters
              layoutParams={layoutParams}
              structureType={structureType}
              onLayoutChange={setLayoutParams}
              tableAlignment={tableAlignment}
              onTableAlignmentChange={handleTableAlignmentChange}
            />
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <StructureSelector 
            structureType={structureType}
            structureTypes={structureTypes}
            onChange={setStructureType}
          />
          <TableAlignmentSelector 
            value={tableAlignment} 
            onChange={handleTableAlignmentChange}
            structureType={structureType}
          />
          <Button onClick={resetToDefaults} variant="outline" size="sm" className="w-full gap-1">
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AreaCalculator;
