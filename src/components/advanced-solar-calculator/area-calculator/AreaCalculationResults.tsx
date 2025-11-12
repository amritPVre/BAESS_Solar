import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PolygonConfig } from './types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, BarChart3, Layers, Zap, TrendingUp, MapPin, Grid3X3, Target, Activity } from 'lucide-react';

interface AreaCalculationResultsProps {
  totalArea: number;
  moduleCount: number;
  placedModuleCount: number;
  totalCapacity: number;
  polygonConfigs: PolygonConfig[];
  selectedPanelArea?: number; // Area of a single panel in m²
}

export const AreaCalculationResults: React.FC<AreaCalculationResultsProps> = ({ 
  totalArea, 
  moduleCount, 
  placedModuleCount, 
  totalCapacity, 
  polygonConfigs,
  selectedPanelArea = 2.58 // Default to Longi panel area if not provided
}) => {
  // Calculate Ground Coverage Ratio (GCR)
  // GCR is the ratio of module area to the ground area
  // For PV installations, this is typically the module area divided by the total area
  
  // Calculate total module area in square meters
  const totalModuleArea = placedModuleCount * selectedPanelArea;
  
  // Calculate GCR - The correct industry formula
  const groundCoverageRatio = totalArea > 0 ? (totalModuleArea / totalArea) : 0;
  
  // Log values for debugging
  console.log(`GCR Calculation: ${totalModuleArea} m² (modules) / ${totalArea} m² (ground) = ${groundCoverageRatio}`);
  console.log(`Panel area used: ${selectedPanelArea} m², Module count: ${placedModuleCount}`);
  
  // Function to determine GCR efficiency class - adjusted for industry standards
  const getGCRClass = (gcr: number): { text: string, color: string } => {
    if (gcr <= 0.3) return { text: "Low density", color: "text-amber-600" };
    if (gcr <= 0.5) return { text: "Optimal", color: "text-green-600" };
    if (gcr <= 0.7) return { text: "High density", color: "text-blue-600" };
    return { text: "Very dense", color: "text-purple-600" };
  };
  
  const gcrClass = getGCRClass(groundCoverageRatio);

  // Calculate System Coverage Ratio (SCR)
  const scr = totalArea > 0 ? (totalModuleArea / totalArea) * 100 : 0;

  // Calculate Module Density
  const moduleDensity = totalArea > 0 ? (placedModuleCount / totalArea) : 0;
  
  // Calculate Total Table Count across all polygon configurations
  const calculateTotalTableCount = (): number => {
    if (!polygonConfigs || polygonConfigs.length === 0) return 0;
    
    return polygonConfigs.reduce((total, config) => {
      // Use the actual tableCount if available, otherwise calculate it
      if (config.tableCount !== undefined) {
        return total + config.tableCount;
      }
      
      // Fallback calculation if tableCount is not set (for backward compatibility)
      let tablesInArea = 0;
      switch (config.structureType) {
        case 'ground_mount_tables':
        case 'fixed_tilt': {
          // Use actual layout parameters - need to get from current configuration
          // For now, use reasonable defaults but this should be improved to use actual config
          const isGroundMount = config.structureType === 'ground_mount_tables';
          const defaultRowsPerTable = isGroundMount ? 3 : 1;
          const defaultModulesPerRow = isGroundMount ? 5 : 8;
          const modulesPerTable = defaultRowsPerTable * defaultModulesPerRow;
          tablesInArea = Math.ceil(config.moduleCount / modulesPerTable);
          break;
        }
        case 'carport': {
          // Use actual carport configuration - default 6 rows × 10 modules per carport
          const modulesPerCarport = 60;
          tablesInArea = Math.ceil(config.moduleCount / modulesPerCarport);
          break;
        }
        case 'ballasted': {
          // For ballasted systems, estimate tables based on typical ballasted table size
          // Typical ballasted table: 2 rows × 10 modules = 20 modules per table
          // This helps quantify purlins, rafters, ballast blocks, etc.
          const modulesPerBallastTable = 20;
          tablesInArea = Math.ceil(config.moduleCount / modulesPerBallastTable);
          break;
        }
        case 'pv_table_free_form':
        default: {
          // For free-form, estimate based on typical PV table size
          // Typical PV table: 2 rows × 8 modules = 16 modules per table
          const modulesPerTable = 16;
          tablesInArea = Math.ceil(config.moduleCount / modulesPerTable);
          break;
        }
      }
      
      return total + tablesInArea;
    }, 0);
  };
  
  // Calculate Total Table Layout Rows (spatial arrangement) for elevated flat roof and ground-mount structures
  const calculateTotalTableLayoutRows = (): { count: number, hasElevatedOrGroundMount: boolean } => {
    if (!polygonConfigs || polygonConfigs.length === 0) return { count: 0, hasElevatedOrGroundMount: false };
    
    let totalLayoutRows = 0;
    let hasElevatedOrGroundMount = false;
    
    polygonConfigs.forEach(config => {
      if (config.structureType === 'fixed_tilt' || config.structureType === 'ground_mount_tables') {
        hasElevatedOrGroundMount = true;
        
        // Use spatial layout information if available
        if (config.tableLayoutRows !== undefined) {
          totalLayoutRows += config.tableLayoutRows;
        } else {
          // Estimate spatial arrangement based on table count and structure type
          const tableCount = config.tableCount || 0;
          const isGroundMount = config.structureType === 'ground_mount_tables';
          
          if (tableCount > 0) {
            // Estimate spatial rows based on realistic field arrangements
            let estimatedLayoutRows = 1;
            
            if (isGroundMount) {
              // Ground mount: typically 3 tables per row for better ground utilization
              let tablesPerRow = 3;
              if (tableCount <= 6) tablesPerRow = 2; // Small installations
              else if (tableCount <= 12) tablesPerRow = 3;
              else tablesPerRow = 3; // Larger installations maintain 3 per row
              
              estimatedLayoutRows = Math.ceil(tableCount / tablesPerRow);
            } else {
              // Elevated structures: typically 2-3 tables per row due to roof constraints
              let tablesPerRow = 3;
              if (tableCount <= 6) tablesPerRow = 2; // Small roof installations
              else if (tableCount <= 15) tablesPerRow = 3;
              else tablesPerRow = 3; // Maintain 3 per row for larger roofs
              
              estimatedLayoutRows = Math.ceil(tableCount / tablesPerRow);
            }
            
            totalLayoutRows += estimatedLayoutRows;
          }
        }
      }
    });
    
    return { count: totalLayoutRows, hasElevatedOrGroundMount };
  };
  
  const totalTableCount = calculateTotalTableCount();
  const { count: totalTableLayoutRows, hasElevatedOrGroundMount } = calculateTotalTableLayoutRows();
  
  return (
    <div className="overflow-hidden bg-white">
      <div className="p-3 bg-gradient-to-r from-slate-700 to-gray-800 text-white">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-white/20 rounded">
            <BarChart3 className="h-3 w-3" />
          </div>
          <div>
            <h3 className="font-medium text-xs text-white">Performance Analytics</h3>
            <p className="text-slate-300 text-xs">Live metrics</p>
          </div>
        </div>
      </div>
      
      <div className="p-3">
        <div className="space-y-2">
          {/* Compact Key Performance Indicators */}
          <div className="grid grid-cols-1 gap-2">
            {/* Total Area - Compact */}
            <div className="rounded bg-blue-50 border border-blue-200 p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="p-1 bg-blue-500 rounded">
                    <MapPin className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-700">Area</p>
                    <p className="text-sm font-bold text-blue-900">{totalArea.toFixed(1)} m²</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Placed Modules - Compact */}
            <div className="rounded bg-green-50 border border-green-200 p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="p-1 bg-green-500 rounded">
                    <Grid3X3 className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-green-700">Modules</p>
                    <p className="text-sm font-bold text-green-900">{placedModuleCount}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Capacity - Compact */}
            <div className="rounded bg-orange-50 border border-orange-200 p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="p-1 bg-orange-500 rounded">
                    <Zap className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-orange-700">Capacity</p>
                    <p className="text-sm font-bold text-orange-900">{totalCapacity.toFixed(1)} kWp</p>
                </div>
              </div>
            </div>
          </div>
          
            {/* Tables Count - Compact - Show for all structure types since we now quantify all */}
            {totalTableCount > 0 && (
              <div className="rounded bg-emerald-50 border border-emerald-200 p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="p-1 bg-emerald-500 rounded">
                      <Layers className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-700">PV Tables</p>
                      <p className="text-sm font-bold text-emerald-900">{totalTableCount}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-1">
                  <p className="text-xs text-emerald-600">For BOQ/BOM estimation</p>
                </div>
              </div>
            )}

            {/* Table Layout Rows Count - Show only for elevated flat roof and ground-mount structures */}
            {hasElevatedOrGroundMount && totalTableLayoutRows > 0 && (
              <div className="rounded bg-cyan-50 border border-cyan-200 p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="p-1 bg-cyan-500 rounded">
                      <Grid3X3 className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-cyan-700">Table Rows</p>
                      <p className="text-sm font-bold text-cyan-900">{totalTableLayoutRows}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-1">
                  <p className="text-xs text-cyan-600">Elevated & Ground-Mount</p>
                </div>
              </div>
            )}
          
            {/* SCR - Compact */}
            <div className="rounded bg-purple-50 border border-purple-200 p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="p-1 bg-purple-500 rounded">
                    <Target className="h-3 w-3 text-white" />
                </div>
                <div>
                    <p className="text-xs font-medium text-purple-700">SCR</p>
                    <p className="text-sm font-bold text-purple-900">{scr.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
              <div className="mt-1">
                <div className="w-full bg-purple-200 rounded-full h-1">
              <div 
                    className="bg-purple-500 h-1 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(scr, 100)}%` }}
              ></div>
            </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-purple-600">0%</span>
                  <span className="text-purple-600 font-medium">
                    {scr >= 35 ? 'Optimal' : scr >= 25 ? 'Good' : 'Low'}
              </span>
                  <span className="text-purple-600">100%</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Analytics */}
          {polygonConfigs && polygonConfigs.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
              <h4 className="text-xs font-medium text-slate-700 mb-2 flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                Area Breakdown
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {polygonConfigs.map((config, index) => (
                  <div key={index} className="flex items-center justify-between p-1 bg-slate-50 rounded text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="font-medium">Area {index + 1}</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="text-slate-600">{config.moduleCount || 0}mod</span>
                      <span className="text-amber-600 font-medium">{(config.capacityKw || 0).toFixed(1)}kW</span>
                  </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* System Efficiency Summary */}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-xs font-medium text-slate-700 mb-2 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Efficiency
            </h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="p-1 bg-slate-50 rounded">
                <div className="text-slate-600">Coverage</div>
                <div className="font-bold text-slate-900">{scr.toFixed(1)}%</div>
              </div>
              <div className="p-1 bg-slate-50 rounded">
                <div className="text-slate-600">Density</div>
                <div className="font-bold text-slate-900">{moduleDensity.toFixed(2)} mod/m²</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
