import React, { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { SolarPanel } from '@/types/components';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Layers, Trash2, Square, Hexagon, Camera, Download, Mouse, Info, BarChart3, Grid3X3, Car, Ruler } from 'lucide-react';
import { AreaMapContainer } from './area-calculator/AreaMapContainer';
import { StructureSelector } from './area-calculator/StructureSelector';
import { AreaCalculationResults } from './area-calculator/AreaCalculationResults';
import { StructureParameters } from './area-calculator/StructureParameters';
import { DrawingInstructions } from './area-calculator/DrawingInstructions';
import { GroundMountTableConfig } from './area-calculator/GroundMountTableConfig';
import { CarportStructureConfig } from './area-calculator/CarportStructureConfig';
import { useAreaCalculator } from './area-calculator/useAreaCalculator';
import { PolygonConfig, LayoutParameters } from './area-calculator/types';
import { DEFAULT_LAYOUT_PARAMS } from './area-calculator/constants';
import { useModulePlacement } from './area-calculator/hooks/useModulePlacement';
import { captureMapWithMetadata, captureMapWithHybridApproach } from './area-calculator/utils/mapCapture';
import { usePolygonEdgeDimensions } from './area-calculator/hooks/usePolygonEdgeDimensions';
import { toast } from 'sonner';

interface AreaCalculatorProps {
  selectedPanel: SolarPanel;
  onCapacityCalculated: (capacityKw: number, areaM2: number, moduleCount: number, configs?: PolygonConfig[]) => void;
  onMapImageCaptured?: (imageDataUrl: string) => void;
  latitude: number;
  longitude: number;
  initialPolygonConfigs?: PolygonConfig[]; // For restoring saved projects
}

// Expose capture function via ref
export interface AreaCalculatorRef {
  captureMap: () => Promise<boolean>;
}

const AreaCalculator = forwardRef<AreaCalculatorRef, AreaCalculatorProps>((props, ref) => {
  const { 
    selectedPanel, 
    onCapacityCalculated, 
    onMapImageCaptured,
    latitude, 
    longitude,
    initialPolygonConfigs
  } = props;
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
    structureTypes,
    startDrawingPolygon,
    startDrawingRectangle,
    clearAllPolygons,
    onMapLoaded,
    moduleCalculationRef,
    mapRef
  } = useAreaCalculator({ selectedPanel, onCapacityCalculated, latitude, longitude, initialPolygonConfigs });

  // Create local state for layout parameters since useAreaCalculator no longer provides it
  const [layoutParams, setLayoutParams] = useState<LayoutParameters>(
    DEFAULT_LAYOUT_PARAMS[structureTypes[0]?.id] || DEFAULT_LAYOUT_PARAMS.ballasted
  );

  // Set a default module count value if none is provided from useAreaCalculator
  // This ensures modules will be placed even if moduleCount is 0
  // Use unlimited value to let the placement algorithm determine the actual count based on area and structure constraints
  const defaultModuleCount = Number.MAX_SAFE_INTEGER; // No artificial limit - let placement algorithm decide
  const effectiveModuleCount = moduleCount > 0 ? moduleCount : defaultModuleCount;

  // Add state for edge dimensions display - initially hidden
  const [showEdgeDimensions, setShowEdgeDimensions] = useState(false);

  // Use edge dimensions hook to display polygon edge measurements
  const { edgeLabels, clearAllEdgeLabels, createAllEdgeLabels } = usePolygonEdgeDimensions({
    polygons,
    map: mapRef?.current,
    enabled: showEdgeDimensions
  });

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
    onCapacityCalculated
  });

  // Debug log to track module count
  useEffect(() => {
    const isUnlimited = effectiveModuleCount === Number.MAX_SAFE_INTEGER;
    console.log(`🔧 MAIN AreaCalculator - Module counts - effective: ${isUnlimited ? 'UNLIMITED (algorithm decides)' : effectiveModuleCount}, original: ${moduleCount}, placed: ${placedModules}`);
  }, [effectiveModuleCount, moduleCount, placedModules]);

  // Update layout parameters when structure type changes
  useEffect(() => {
    console.log("Structure type changed to:", structureType.id);
    const defaultParams = DEFAULT_LAYOUT_PARAMS[structureType.id] || DEFAULT_LAYOUT_PARAMS.ballasted;
    setLayoutParams(defaultParams);
  }, [structureType.id]);

  // Create enhanced version of clearAllPolygons that also clears module rectangles
  const handleClearAll = useCallback(() => {
    console.log("Clear All button clicked - clearing polygons and modules");
    
    // First clear all polygons
    clearAllPolygons();
    
    // Then clear all module rectangles using the proper hook function
    // This ensures all module-related state (placedModules, capacityKw, etc.) is properly reset
    if (typeof forceRedrawAllModules === 'function') {
      forceRedrawAllModules();
    }
    
    // Force a final capacity update with zeros to ensure UI updates
    // Use setTimeout to ensure this happens after the hook's internal updates
    setTimeout(() => {
      onCapacityCalculated(0, 0, 0);
    }, 100);
    
  }, [clearAllPolygons, forceRedrawAllModules, onCapacityCalculated]);

  // Handle layout parameter changes
  const handleLayoutChange = useCallback((newParams: LayoutParameters) => {
    console.log("Layout parameters changed:", JSON.stringify(newParams));
    // Use a functional update to ensure we're using the latest state
    setLayoutParams(prevParams => {
      // Log to verify the change
      console.log(`Updating layout: Previous orientation=${prevParams.orientation}, New orientation=${newParams.orientation}`);
      
      // Create a fresh copy to ensure React detects the change
      const updatedParams = { ...newParams };
      
      // If this is an orientation change, show a notification
      if (prevParams.orientation !== updatedParams.orientation) {
        toast.info(`Orientation changed to ${updatedParams.orientation}`);
      }
      
      return updatedParams;
    });
    
    // Force redraw calculation after a small delay to let the state update
    setTimeout(() => {
      if (polygons.length > 0) {
        console.log("Triggering calculation after layout parameter change");
        // Use the direct triggerModuleCalculation from useModulePlacement instead of moduleCalculationRef
        if (typeof triggerModuleCalculation === 'function') {
          // Force a recalculation - this is crucial for parameters like orientation
          triggerModuleCalculation();
          
          // Also force a redraw after parameters change
          setTimeout(() => {
            if (typeof forceRedrawAllModules === 'function') {
              forceRedrawAllModules();
            }
          }, 250);
        } else if (moduleCalculationRef?.current?.triggerCalculation) {
          moduleCalculationRef.current.triggerCalculation();
        }
      }
    }, 100);
  }, [polygons, moduleCalculationRef, triggerModuleCalculation, forceRedrawAllModules]);

  // Link the module calculation reference to our direct trigger calculation function
  useEffect(() => {
    if (moduleCalculationRef?.current) {
      moduleCalculationRef.current.triggerCalculation = () => {
        console.log("ModuleCalculationRef trigger redirecting to triggerModuleCalculation");
        if (typeof triggerModuleCalculation === 'function') {
          triggerModuleCalculation();
        }
      };
    }
  }, [moduleCalculationRef, triggerModuleCalculation]);

  // Map capture functionality - simplified approach
  const handleCaptureMap = useCallback(async () => {
    console.log("handleCaptureMap called");
    console.log("mapRef:", mapRef);
    console.log("mapRef.current:", mapRef?.current);
    
    if (!mapRef?.current) {
      console.error("Map reference is null or undefined");
      toast.error("Map not available for capture");
      return;
    }

    try {
      toast.info("Capturing map image...");
      
      // Test if html2canvas can be imported
      console.log("Attempting to import html2canvas...");
      const html2canvas = await import('html2canvas');
      console.log("html2canvas imported successfully:", html2canvas);
      
      const metadata = {
        totalCapacity: capacityKw || totalCapacity,
        moduleCount: placedModules || placedModuleCount,
        totalArea: totalArea,
        structureType: structureType.name,
        timestamp: new Date()
      };

      console.log("Calling captureMapWithMetadata with metadata:", metadata);
      const capturedImageDataUrl = await captureMapWithMetadata(mapRef.current, metadata);
      console.log("captureMapWithMetadata result:", capturedImageDataUrl ? "Image captured successfully" : "Failed");
      
      if (capturedImageDataUrl && capturedImageDataUrl.startsWith('data:image/')) {
        toast.success("Map captured and downloaded successfully!");
        
        // Pass the actual image data URL to parent component
        if (onMapImageCaptured) {
          console.log("Calling onMapImageCaptured callback with image data");
          onMapImageCaptured(capturedImageDataUrl);
        }
        
        return true;
      } else {
        console.error("captureMapWithMetadata failed - no valid image data URL returned");
        toast.error("Failed to capture map image");
        return false;
      }
    } catch (error) {
      console.error("Error capturing map:", error);
      toast.error(`Error capturing map image: ${error.message || error}`);
      return false;
    }
  }, [mapRef, capacityKw, totalCapacity, placedModules, placedModuleCount, totalArea, structureType, onMapImageCaptured]);



  // Hybrid approach: Static Maps background + Canvas overlay for all modules
  const handleHybridCapture = useCallback(async () => {
    console.log("🎨 handleHybridCapture called");
    
    if (!mapRef?.current) {
      console.error("Map reference is null or undefined");
      toast.error("Map not available for hybrid capture");
      return;
    }

    try {
      toast.info("Capturing with Hybrid approach (Static Maps + Canvas)...");
      
      const metadata = {
        totalCapacity: capacityKw || totalCapacity,
        moduleCount: placedModules || placedModuleCount,
        totalArea: totalArea,
        structureType: structureType.name,
        timestamp: new Date()
      };

      console.log("🎨 Hybrid capture metadata:", metadata);
      console.log("🎨 Polygons available:", polygons.length);
      console.log("🎨 Module rectangles available:", moduleRectangles.length);

      // Extract actual Google Maps polygon objects from PolygonInfo array
      const googleMapsPolygons = polygons.map(polygonInfo => polygonInfo.polygon);

      // Include all module shapes (both Rectangle and Polygon objects)
      const allModuleShapes = moduleRectangles.filter(
        (shape): shape is google.maps.Rectangle | google.maps.Polygon => 
          shape instanceof google.maps.Rectangle || shape instanceof google.maps.Polygon
      );

      console.log("🎨 Module shapes for hybrid:", allModuleShapes.length, "total available:", moduleRectangles.length);
      console.log("🎨 Module types breakdown:", {
        rectangles: allModuleShapes.filter(s => s instanceof google.maps.Rectangle).length,
        polygons: allModuleShapes.filter(s => s instanceof google.maps.Polygon).length
      });

      const hybridImageDataUrl = await captureMapWithHybridApproach(
        mapRef.current,
        googleMapsPolygons,
        allModuleShapes,
        metadata,
        { maxWidth: 1000, maxHeight: 1000 } // Higher resolution for better quality
      );
      
      if (hybridImageDataUrl && hybridImageDataUrl.startsWith('data:image/')) {
        toast.success("Hybrid capture completed successfully! All modules rendered precisely.");
        
        // Pass the actual image data URL to parent component
        if (onMapImageCaptured) {
          console.log("Calling onMapImageCaptured callback with hybrid image data");
          onMapImageCaptured(hybridImageDataUrl);
        }
        
        return true;
      } else {
        toast.error("Hybrid capture failed - no valid image data URL returned");
        return false;
      }
    } catch (error) {
      console.error("Error in hybrid capture:", error);
      toast.error(`Hybrid capture failed: ${error.message || error}`);
      return false;
    }
  }, [mapRef, capacityKw, totalCapacity, placedModules, placedModuleCount, totalArea, structureType.name, polygons, moduleRectangles, onMapImageCaptured]);

  // Expose capture function to parent component via ref
  useImperativeHandle(ref, () => ({
    captureMap: async () => {
      console.log("📸 captureMap called from parent via ref");
      return await handleHybridCapture();
    }
  }), [handleHybridCapture]);

  return (
    <div className="bg-slate-50 rounded-xl shadow-lg overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="h-14 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">PV Installation Designer</h1>
              <p className="text-xs text-slate-600">Professional Solar Design Suite</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
            <div className={`w-2 h-2 rounded-full ${polygons.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-green-700 text-xs font-medium">
              {polygons.length > 0 ? 'Design Active' : 'Ready'}
            </span>
          </div>
          <div className="text-sm text-slate-600 hidden lg:block">
            {polygons.length} Areas • {placedModules || placedModuleCount} Modules • {(capacityKw || totalCapacity).toFixed(1)} kWp
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex min-h-[600px]">
        {/* Left Sidebar - Configuration Tools */}
        <div className="w-56 bg-gradient-to-b from-slate-50 to-white border-r border-slate-200 shadow-sm overflow-y-auto pb-6 max-h-[600px]">
          <div className="p-3 border-b border-slate-200 bg-gradient-to-r from-slate-600 to-gray-700">
            <h2 className="text-xs font-medium text-white uppercase tracking-wider">Design Tools</h2>
          </div>
          
          {/* Structure Configuration */}
          <div className="p-3 border-b border-slate-200">
            <div className="mb-2 flex items-center gap-2">
              <div className="p-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded">
                <Layers className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-xs font-medium text-slate-700 uppercase tracking-wider">Structure Type</h3>
            </div>
            <StructureSelector 
              structureType={structureType}
              structureTypes={structureTypes}
              onChange={setStructureType}
            />
          </div>

          {/* Drawing Instructions Toggle */}
          <div className="px-3 py-2 border-b border-slate-200">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setInstructionsVisible(!instructionsVisible)}
              className="w-full justify-start text-xs h-7 bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200 text-cyan-700 hover:from-cyan-100 hover:to-blue-100 hover:border-cyan-300 transition-all duration-200"
            >
              <Info className="h-3 w-3 mr-2 text-cyan-600" />
              {instructionsVisible ? 'Hide' : 'Show'} Instructions
            </Button>
          </div>

          {/* Structure Parameters */}
          {polygons.length > 0 && (
            <div className="p-3 border-b border-slate-200 bg-gradient-to-br from-green-50/50 to-emerald-50/50">
              <div className="mb-2 flex items-center gap-2">
                <div className="p-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded">
                  <Grid3X3 className="h-3 w-3 text-white" />
                </div>
                <h3 className="text-xs font-medium text-green-700 uppercase tracking-wider">Configuration</h3>
              </div>
              <StructureParameters
                layoutParams={layoutParams}
                structureType={structureType}
                onLayoutChange={handleLayoutChange}
              />
              
              {/* Advanced Configuration Button for Ground Mount Tables */}
              {structureType.id === 'ground_mount_tables' && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start text-xs h-8 mt-2 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-700 hover:from-amber-100 hover:to-orange-100 hover:border-amber-400 hover:text-amber-800 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <Grid3X3 className="h-3 w-3 mr-2 text-amber-600" />
                      Advanced Table Config
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Advanced Ground Mount Tables Configuration</DialogTitle>
                    </DialogHeader>
                    <GroundMountTableConfig 
                      layoutParams={layoutParams}
                      onLayoutChange={handleLayoutChange}
                      readOnly={false}
                    />
                  </DialogContent>
                </Dialog>
              )}
              
              {/* Advanced Configuration Button for Carport */}
              {structureType.id === 'carport' && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start text-xs h-8 mt-2 bg-gradient-to-r from-purple-50 to-violet-50 border-purple-300 text-purple-700 hover:from-purple-100 hover:to-violet-100 hover:border-purple-400 hover:text-purple-800 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <Car className="h-3 w-3 mr-2 text-purple-600" />
                      Advanced Carport Config
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Advanced Carport Structure Configuration</DialogTitle>
                    </DialogHeader>
                    <CarportStructureConfig 
                      layoutParams={layoutParams}
                      onLayoutChange={handleLayoutChange}
                      readOnly={false}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </div>

        {/* Map Area - Now takes remaining space between smaller sidebars */}
        <div className="flex-1 flex flex-col">
          {/* Drawing Tools */}
          <div className="h-12 bg-gradient-to-r from-slate-100 to-gray-100 border-b border-slate-200 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Button 
                onClick={startDrawingPolygon} 
                variant="outline" 
                size="sm" 
                className="h-8 gap-1 text-xs bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 text-emerald-700 hover:from-emerald-100 hover:to-green-100 hover:border-emerald-300 transition-all duration-200 shadow-sm hover:shadow"
              >
                <Hexagon className="h-3 w-3 text-emerald-600" />
                Polygon
              </Button>
              
              <Button 
                onClick={startDrawingRectangle} 
                variant="outline" 
                size="sm" 
                className="h-8 gap-1 text-xs bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow"
              >
                <Square className="h-3 w-3 text-blue-600" />
                Rectangle
              </Button>
              
              <Button 
                onClick={handleClearAll} 
                variant="outline" 
                size="sm" 
                className="h-8 gap-1 text-xs bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-700 hover:from-red-100 hover:to-rose-100 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow"
              >
                <Trash2 className="h-3 w-3 text-red-600" />
                Clear All
              </Button>

              {polygons.length > 0 && (
                <Button 
                  onClick={() => setShowEdgeDimensions(!showEdgeDimensions)} 
                  variant={showEdgeDimensions ? "default" : "outline"}
                  size="sm" 
                  className="h-8 gap-1 text-xs transition-all duration-200 shadow-sm hover:shadow"
                  title={showEdgeDimensions ? "Hide edge dimensions" : "Show edge dimensions"}
                >
                  <Ruler className="h-3 w-3" />
                  {showEdgeDimensions ? "Hide" : "Show"} Dimensions
                </Button>
              )}
            </div>

            {polygons.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-6 w-px bg-slate-300"></div>
                
                {/* 
                  Future Reference: Basic Capture Method 
                  - Simple map capture without enhanced features
                  - Kept for potential future debugging or alternative options
                */}
                {/* <Button 
                  onClick={handleCaptureMap} 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-1 text-xs bg-gradient-to-r from-cyan-50 to-teal-50 border-cyan-200 text-cyan-700 hover:from-cyan-100 hover:to-teal-100 hover:border-cyan-300 transition-all duration-200 shadow-sm hover:shadow"
                >
                  <Camera className="h-3 w-3 text-cyan-600" />
                  Capture
                </Button> */}
                
                {/* Primary Export Button - Enhanced Hybrid Capture */}
                <Button 
                  onClick={handleHybridCapture} 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-1 text-xs bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-700 hover:from-emerald-100 hover:to-teal-100 hover:border-emerald-400 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  <Camera className="h-3 w-3 text-emerald-600" />
                  Export Design ✨
                </Button>

                {/* 
                  Future Reference: Legacy Capture Method 
                  - Original capture implementation
                  - Preserved for compatibility testing and fallback options
                */}
                {/* <Button 
                  onClick={handleCaptureMap} 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-1 text-xs bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 transition-all duration-200 shadow-sm hover:shadow"
                >
                  <Download className="h-3 w-3 text-green-600" />
                  Old Method
                </Button> */}
              </div>
            )}
          </div>

          {/* Map Area */}
          <div className="flex-1 relative">
            <AreaMapContainer
              drawingManagerRef={drawingManagerRef}
              latitude={latitude}
              longitude={longitude}
              onMapLoaded={onMapLoaded}
            />
          </div>
        </div>

        {/* Right Sidebar - Performance Analytics */}
        <div className="w-60 bg-white border-l border-slate-200 shadow-sm">
          <div className="max-h-[600px] overflow-y-auto">
            <AreaCalculationResults
              totalArea={totalArea}
              moduleCount={moduleCount}
              placedModuleCount={placedModules || placedModuleCount}
              totalCapacity={capacityKw || totalCapacity}
              polygonConfigs={modulePlacementPolygonConfigs || polygonConfigs}
            />
          </div>
        </div>
      </div>

      {/* Drawing Instructions Modal */}
      <DrawingInstructions 
        isOpen={instructionsVisible} 
        onClose={() => setInstructionsVisible(false)} 
      />
    </div>
  );
});

// Set display name for better debugging
AreaCalculator.displayName = 'AreaCalculator';

export default AreaCalculator;
