import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building, 
  Calculator, 
  FileText, 
  Layers,
  Grid3X3,
  ArrowRight,
  Info,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Interface for structural material line items
interface StructuralMaterialItem {
  id: string;
  item: string;
  description: string;
  specifications: string;
  unit: string;
  quantity: number;
  category: string;
  structureType: string;
  areaIndex: number;
  calculationBasis: string;
}

// Interface for table configuration
interface TableConfig {
  rowsPerTable: number;
  modulesPerRow: number;
  interTableSpacingX: number;
  interTableSpacingY: number;
}

// Interface for carport configuration
interface CarportConfig {
  rows: number;
  modulesPerRow: number;
  forceRectangle: boolean;
}

// Interface for polygon configuration
interface PolygonConfig {
  area: number;
  moduleCount: number;
  structureType: string;
  azimuth?: number;
  tiltAngle?: number;
  capacityKw: number;
  tableCount?: number;
  tableConfig?: TableConfig;
  carportConfig?: CarportConfig;
  orientation?: 'landscape' | 'portrait'; // Module orientation from user configuration
  [key: string]: unknown;
}

interface StructuralMaterialCalculatorProps {
  polygonConfigs: PolygonConfig[];
  selectedPanel?: {
    manufacturer: string;
    model?: string;
    power_rating?: number;
    [key: string]: unknown;
  } | null;
  onMaterialsCalculated?: (materials: StructuralMaterialItem[]) => void;
}

const StructuralMaterialCalculator: React.FC<StructuralMaterialCalculatorProps> = ({ 
  polygonConfigs, 
  selectedPanel,
  onMaterialsCalculated
}) => {
  const [structuralMaterials, setStructuralMaterials] = useState<StructuralMaterialItem[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState("consolidated"); // Default to consolidated view for standardized format

  // Helper function to get module dimensions (default typical values if not available)
  const getModuleDimensions = () => {
    // Default module dimensions (typical 450W module)
    const defaultLength = 2.274; // meters
    const defaultWidth = 1.134; // meters
    
    return {
      length: selectedPanel?.length || defaultLength,
      width: selectedPanel?.width || defaultWidth
    };
  };

  // Helper function to calculate actual table dimensions based on configuration
  const calculateTableDimensions = (config: PolygonConfig) => {
    const moduleDims = getModuleDimensions();
    
    let tableLength = 0;
    let tableWidth = 0;
    let modulesPerTable = 0;
    let actualRowsPerTable = 1;
    let actualModulesPerRow = 1;
    
    // PRIORITY: Use the table count from polygon config if available (from correct module placement calculation)
    let calculatedTableCount = config.tableCount || 0;
    
    // Debug log to verify correct table count is being used
    if (config.tableCount) {
      console.log(`🔧 StructuralMaterialCalculator: Using table count from polygon config: ${config.tableCount} tables for ${config.moduleCount} modules`);
    }
    
    if (config.tableConfig) {
      // Use actual table configuration
      const { rowsPerTable, modulesPerRow } = config.tableConfig;
      console.log(`🔧 StructuralMaterialCalculator: Using actual tableConfig - ${rowsPerTable} rows × ${modulesPerRow} modules (${config.moduleCount} total modules)`);
      modulesPerTable = rowsPerTable * modulesPerRow;
      actualRowsPerTable = rowsPerTable;
      actualModulesPerRow = modulesPerRow;
      // Only recalculate if not provided in config
      if (!calculatedTableCount) {
        calculatedTableCount = Math.ceil(config.moduleCount / modulesPerTable);
      }
      
      // Calculate dimensions based on actual orientation
      const orientation = config.orientation || 'landscape';
      if (orientation === 'portrait') {
        tableLength = modulesPerRow * moduleDims.width;
        tableWidth = rowsPerTable * moduleDims.length;
      } else {
        tableLength = modulesPerRow * moduleDims.length;
        tableWidth = rowsPerTable * moduleDims.width;
      }
    } else if (config.carportConfig) {
      // Use carport configuration
      const { rows, modulesPerRow } = config.carportConfig;
      modulesPerTable = rows * modulesPerRow;
      actualRowsPerTable = rows;
      actualModulesPerRow = modulesPerRow;
      // Only recalculate if not provided in config
      if (!calculatedTableCount) {
        calculatedTableCount = Math.ceil(config.moduleCount / modulesPerTable);
      }
      
      // Calculate dimensions based on actual orientation
      const orientation = config.orientation || 'landscape';
      if (orientation === 'portrait') {
        tableLength = modulesPerRow * moduleDims.width;
        tableWidth = rows * moduleDims.length;
      } else {
        tableLength = modulesPerRow * moduleDims.length;
        tableWidth = rows * moduleDims.width;
      }
    } else {
      // Calculate from actual data instead of using potentially incorrect tableCount
      
      if (config.structureType === 'ballasted') {
        // For ballasted systems, each row is a table (single row per table)
        // Try to estimate the layout based on area and module count
        
        // Try different common row lengths to find the best fit
        // Common ballasted layouts: 10, 12, 15, 18, 20, 24, 25, 30 modules per row
        const commonRowLengths = [10, 12, 15, 18, 20, 24, 25, 30];
        
        // Find all layouts that result in whole number of rows
        const perfectMatches = [];
        for (const rowLength of commonRowLengths) {
          const estimatedRows = config.moduleCount / rowLength;
          const difference = Math.abs(estimatedRows - Math.round(estimatedRows));
          
          if (difference < 0.1) { // Essentially whole numbers
            perfectMatches.push({
              modulesPerRow: rowLength,
              rows: Math.round(estimatedRows),
              difference: difference
            });
          }
        }
        
        let bestModulesPerRow = 15; // Default fallback
        
        if (perfectMatches.length > 0) {
          // Among perfect matches, prefer moderate row lengths (12-20 modules per row)
          // as they are most common in ballasted systems
          const preferredMatches = perfectMatches.filter(match => 
            match.modulesPerRow >= 12 && match.modulesPerRow <= 20
          );
          
          if (preferredMatches.length > 0) {
            // Sort by row count (prefer moderate number of rows: 8-15)
            preferredMatches.sort((a, b) => {
              const aRowPenalty = Math.abs(a.rows - 12); // Prefer around 12 rows
              const bRowPenalty = Math.abs(b.rows - 12);
              return aRowPenalty - bRowPenalty;
            });
            bestModulesPerRow = preferredMatches[0].modulesPerRow;
          } else {
            // No preferred matches, take the best overall perfect match
            perfectMatches.sort((a, b) => a.difference - b.difference);
            bestModulesPerRow = perfectMatches[0].modulesPerRow;
          }
        } else {
          // No perfect fits, calculate based on area and module density
          const moduleArea = moduleDims.length * moduleDims.width;
          const totalModuleArea = config.moduleCount * moduleArea;
          const estimatedDensity = totalModuleArea / config.area;
          
          if (estimatedDensity > 0.8) {
            // High density - likely fewer rows with more modules
            bestModulesPerRow = Math.min(25, Math.max(18, Math.round(Math.sqrt(config.moduleCount * 1.2))));
          } else {
            // Lower density - likely more rows with fewer modules  
            bestModulesPerRow = Math.min(18, Math.max(12, Math.round(Math.sqrt(config.moduleCount * 1.8))));
          }
        }
        
        const estimatedModulesPerRow = bestModulesPerRow;
        
        // Only recalculate if not provided in config
        if (!calculatedTableCount) {
          calculatedTableCount = Math.round(config.moduleCount / estimatedModulesPerRow);
          
          // Ensure we don't get unreasonable values
          if (calculatedTableCount < 1) calculatedTableCount = 1;
          if (calculatedTableCount > config.moduleCount) calculatedTableCount = config.moduleCount;
        }
        
        modulesPerTable = Math.round(config.moduleCount / calculatedTableCount);
        actualRowsPerTable = 1; // Single row per table for ballasted
        actualModulesPerRow = modulesPerTable;
        
        // Use actual orientation from user configuration, default to landscape if not specified
        const orientation = config.orientation || 'landscape';
        if (orientation === 'portrait') {
          tableLength = actualModulesPerRow * moduleDims.width;
          tableWidth = actualRowsPerTable * moduleDims.length;
        } else {
          tableLength = actualModulesPerRow * moduleDims.length;
          tableWidth = actualRowsPerTable * moduleDims.width;
        }
        
      } else if (config.structureType === 'fixed_tilt') {
        // Fixed tilt elevated structures - typically 3 rows for optimal layout
        // Only recalculate if not provided in config
        if (!calculatedTableCount) {
          calculatedTableCount = Math.ceil(config.moduleCount / 24); // Default 24 modules per table (3×8)
        }
        modulesPerTable = Math.round(config.moduleCount / calculatedTableCount);
        
        // Determine optimal layout for elevated structures
        if (modulesPerTable <= 10) {
          actualRowsPerTable = 1;
          actualModulesPerRow = modulesPerTable;
        } else if (modulesPerTable <= 24) {
          actualRowsPerTable = 3;
          actualModulesPerRow = Math.ceil(modulesPerTable / 3);
        } else {
          actualRowsPerTable = 4;
          actualModulesPerRow = Math.ceil(modulesPerTable / 4);
        }
        
        // Use actual orientation from user configuration, default to landscape if not specified
        const orientation = config.orientation || 'landscape';
        if (orientation === 'portrait') {
          // Portrait: table length = modules per row × module width, table width = rows × module length  
          tableLength = actualModulesPerRow * moduleDims.width;
          tableWidth = actualRowsPerTable * moduleDims.length;
        } else {
          // Landscape: table length = modules per row × module length, table width = rows × module width
          tableLength = actualModulesPerRow * moduleDims.length;
          tableWidth = actualRowsPerTable * moduleDims.width;
        }
        
      } else if (config.structureType === 'ground_mount_tables') {
        // Ground mount might have multiple rows, try to find reasonable layout
        // Only recalculate if not provided in config
        if (!calculatedTableCount) {
          calculatedTableCount = Math.ceil(config.moduleCount / 15);
        }
        modulesPerTable = Math.round(config.moduleCount / calculatedTableCount);
        
        if (modulesPerTable <= 8) {
          actualRowsPerTable = 1;
          actualModulesPerRow = modulesPerTable;
        } else if (modulesPerTable <= 16) {
          actualRowsPerTable = 2;
          actualModulesPerRow = Math.ceil(modulesPerTable / 2);
        } else {
          actualRowsPerTable = 3;
          actualModulesPerRow = Math.ceil(modulesPerTable / 3);
        }
        
        // Use actual orientation from user configuration, default to landscape if not specified
        const orientation = config.orientation || 'landscape';
        if (orientation === 'portrait') {
          tableLength = actualModulesPerRow * moduleDims.width;
          tableWidth = actualRowsPerTable * moduleDims.length;
        } else {
          tableLength = actualModulesPerRow * moduleDims.length;
          tableWidth = actualRowsPerTable * moduleDims.width;
        }
        
      } else {
        // For other types, try to create a reasonable rectangular layout
        // Only recalculate if not provided in config
        if (!calculatedTableCount) {
          calculatedTableCount = Math.ceil(config.moduleCount / 16);
        }
        modulesPerTable = Math.round(config.moduleCount / calculatedTableCount);
        const sqrtModules = Math.sqrt(modulesPerTable);
        actualRowsPerTable = Math.max(1, Math.floor(sqrtModules));
        actualModulesPerRow = Math.ceil(modulesPerTable / actualRowsPerTable);
        
        // Use actual orientation from user configuration, default to landscape if not specified
        const orientation = config.orientation || 'landscape';
        if (orientation === 'portrait') {
          tableLength = actualModulesPerRow * moduleDims.width;
          tableWidth = actualRowsPerTable * moduleDims.length;
        } else {
          tableLength = actualModulesPerRow * moduleDims.length;
          tableWidth = actualRowsPerTable * moduleDims.width;
        }
      }
    }
    
    // Use the calculated table count
    const tableCount = calculatedTableCount;
    
    return {
      tableLength,
      tableWidth,
      modulesPerTable,
      tableCount,
      tableArea: tableLength * tableWidth,
      actualRowsPerTable,
      actualModulesPerRow
    };
  };

  // Calculate structural materials for ballasted roof systems
  const calculateBallastedMaterials = (config: PolygonConfig, areaIndex: number): StructuralMaterialItem[] => {
    const materials: StructuralMaterialItem[] = [];
    const { tableLength, tableWidth, modulesPerTable, tableCount, tableArea, actualRowsPerTable, actualModulesPerRow } = calculateTableDimensions(config);
    
    // Dynamic ballast blocks calculation based on table size
    // Rule: 1 ballast block per 1.5m² of table area, minimum 4 blocks per table
    const ballastedBlocksPerTable = Math.max(4, Math.ceil(tableArea / 1.5));
    const ballastWeight = 40; // 40kg per ballast block
    materials.push({
      id: `ballast-blocks-${areaIndex}`,
      item: "Concrete Ballast Blocks",
      description: "Pre-cast concrete ballast blocks for weight-based mounting",
      specifications: `40kg concrete blocks, 600x300x100mm, Grade C25/30`,
      unit: "pcs",
      quantity: Math.ceil(tableCount * ballastedBlocksPerTable),
      category: "Foundation & Ballast",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${tableCount} tables × ${ballastedBlocksPerTable} blocks/table (${tableArea.toFixed(1)}m² table area)`
    });

    // Dynamic rail calculation based on actual table dimensions
    // Rule: Rail length = table length + 10% margin for connections
    const railLengthPerTable = tableLength * 1.1;
    const railRowsPerTable = actualRowsPerTable; // Use actual rows per table
    materials.push({
      id: `purlin-rails-${areaIndex}`,
      item: "Aluminum Purlin Rails",
      description: "Extruded aluminum mounting rails for module support",
      specifications: "6063-T6 aluminum, 40x40x3mm profile, anodized finish",
      unit: "m",
      quantity: Math.ceil(tableCount * railLengthPerTable * railRowsPerTable),
      category: "Mounting Structure",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${tableCount} tables × ${railLengthPerTable.toFixed(1)}m length × ${railRowsPerTable} rows (${tableLength.toFixed(1)}m table length)`
    });

    // Dynamic clamps calculation based on actual module layout
    // End clamps: 2 per module row (one at each end)
    const endClampsPerTable = actualRowsPerTable * 2;
    // Mid clamps: (modules per row - 1) × 2 clamps per module gap × number of rows
    const midClampsPerTable = Math.max(0, (actualModulesPerRow - 1) * 2 * actualRowsPerTable);
    
    materials.push({
      id: `end-clamps-${areaIndex}`,
      item: "End Clamps",
      description: "Aluminum end clamps for module edge securing",
      specifications: "6061-T6 aluminum, fits 30-50mm module frames, with EPDM gasket",
      unit: "pcs",
      quantity: Math.ceil(tableCount * endClampsPerTable),
      category: "Module Fasteners",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${tableCount} tables × ${endClampsPerTable} clamps/table (${actualRowsPerTable} rows × 2 end clamps)`
    });

    materials.push({
      id: `mid-clamps-${areaIndex}`,
      item: "Mid Clamps",
      description: "Aluminum mid clamps for inter-module connections",
      specifications: "6061-T6 aluminum, fits 30-50mm module frames, with EPDM gasket",
      unit: "pcs",
      quantity: Math.ceil(tableCount * midClampsPerTable),
      category: "Module Fasteners",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${tableCount} tables × ${midClampsPerTable} clamps/table (${actualModulesPerRow-1} gaps × 2 clamps × ${actualRowsPerTable} rows)`
    });

    // Dynamic rafter calculation based on table width
    // Rule: Cross rafters span the width of the table
    const rafterLengthPerTable = tableWidth * 1.05; // 5% margin for connections
    const rafterCountPerTable = Math.max(2, Math.ceil(tableLength / 3)); // 1 rafter per 3m length, minimum 2
    materials.push({
      id: `rafter-beams-${areaIndex}`,
      item: "Aluminum Cross Rafters",
      description: "Structural cross beams for table support",
      specifications: "6063-T6 aluminum, 60x40x4mm rectangular tube, mill finish",
      unit: "m",
      quantity: Math.ceil(tableCount * rafterLengthPerTable * rafterCountPerTable),
      category: "Mounting Structure",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${tableCount} tables × ${rafterLengthPerTable.toFixed(1)}m length × ${rafterCountPerTable} rafters (${tableWidth.toFixed(1)}m table width)`
    });

    return materials;
  };

  // Calculate structural materials for elevated/fixed tilt systems
  const calculateElevatedMaterials = (config: PolygonConfig, areaIndex: number): StructuralMaterialItem[] => {
    const materials: StructuralMaterialItem[] = [];
    const { tableLength, tableWidth, modulesPerTable, tableCount, tableArea, actualRowsPerTable, actualModulesPerRow } = calculateTableDimensions(config);
    const tiltAngle = config.tiltAngle || 30; // Default 30 degrees
    
    // Structural grid-based posts calculation for elevated flat roof systems
    // Rule: Posts placed at structural grid points - typically 4 corner posts + intermediate posts
    // For 2-row systems: 4 corner posts + intermediate posts based on table length
    const basePostsPerTable = 4; // 4 corner posts minimum
    const intermediatePostsPerRow = Math.max(0, Math.floor((actualModulesPerRow - 1) / 3)); // 1 post per 3 modules along length
    const postsPerTable = basePostsPerTable + (intermediatePostsPerRow * actualRowsPerTable);
    const postHeight = 2.0; // 2.0m height for flat roof applications
    materials.push({
      id: `column-posts-${areaIndex}`,
      item: "Aluminum Column Posts",
      description: "Lightweight aluminum posts for flat roof elevated mounting",
      specifications: `80x80x4mm aluminum tube, anodized finish, height ${postHeight}m`,
      unit: "pcs",
      quantity: Math.ceil(tableCount * postsPerTable),
      category: "Support Structure",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${tableCount} tables × ${postsPerTable} posts/table (${basePostsPerTable} corner + ${intermediatePostsPerRow * actualRowsPerTable} intermediate posts for ${actualModulesPerRow}×${actualRowsPerTable} layout)`
    });

    // Foundation calculation for flat roof elevated systems - smaller foundations
    const foundationsPerPost = 1;
    const concretePerFoundation = 0.125; // 0.125 m³ concrete per foundation (0.5×0.5×0.5m)
    materials.push({
      id: `concrete-foundations-${areaIndex}`,
      item: "Concrete Foundation Blocks",
      description: "Compact concrete foundation blocks for flat roof post mounting",
      specifications: "Grade C25/30 concrete, 0.5×0.5×0.5m blocks with post anchor bolts",
      unit: "pcs",
      quantity: Math.ceil(tableCount * postsPerTable * foundationsPerPost),
      category: "Foundation & Ballast",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${tableCount * postsPerTable} posts × ${foundationsPerPost} foundation/post (0.5×0.5×0.5m blocks)`
    });

    // Dynamic purlin rails calculation for flat roof elevated systems
    const railLengthPerTable = tableLength * 1.05; // 5% margin for connections (less than ballasted)
    const railRowsPerTable = actualRowsPerTable; // Use actual rows per table
    materials.push({
      id: `purlin-rails-elevated-${areaIndex}`,
      item: "Aluminum Purlin Rails",
      description: "Lightweight extruded aluminum mounting rails for flat roof",
      specifications: "6063-T6 aluminum, 40×30×3mm profile, anodized finish",
      unit: "m",
      quantity: Math.ceil(tableCount * railLengthPerTable * railRowsPerTable),
      category: "Mounting Structure",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${tableCount} tables × ${railLengthPerTable.toFixed(1)}m length × ${railRowsPerTable} rows (${tableLength.toFixed(1)}m table length)`
    });

    // Dynamic rafter calculation for flat roof elevated systems
    const rafterLengthPerTable = tableWidth * 1.05; // 5% margin for connections
    const rafterCountPerTable = Math.max(2, Math.ceil(tableLength / 2.5)); // 1 rafter per 2.5m length for wind stability
    materials.push({
      id: `rafter-beams-elevated-${areaIndex}`,
      item: "Aluminum Rafters",
      description: "Lightweight aluminum rafters connecting posts to rails",
      specifications: "60×40×4mm aluminum rectangular tube, anodized finish",
      unit: "m",
      quantity: Math.ceil(tableCount * rafterLengthPerTable * rafterCountPerTable),
      category: "Mounting Structure",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${tableCount} tables × ${rafterLengthPerTable.toFixed(1)}m length × ${rafterCountPerTable} rafters (${tableWidth.toFixed(1)}m table width, 2.5m spacing)`
    });

    // Dynamic clamps calculation based on actual module layout
    const endClampsPerTable = actualRowsPerTable * 2;
    const midClampsPerTable = Math.max(0, (actualModulesPerRow - 1) * 2 * actualRowsPerTable);
    
    materials.push({
      id: `end-clamps-elevated-${areaIndex}`,
      item: "End Clamps - Heavy Duty",
      description: "Heavy-duty aluminum end clamps for elevated systems",
      specifications: "6061-T6 aluminum, fits 30-50mm frames, with EPDM gasket, enhanced grip",
      unit: "pcs",
      quantity: Math.ceil(tableCount * endClampsPerTable),
      category: "Module Fasteners",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${tableCount} tables × ${endClampsPerTable} clamps/table (${actualRowsPerTable} rows × 2 end clamps)`
    });

    materials.push({
      id: `mid-clamps-elevated-${areaIndex}`,
      item: "Mid Clamps - Heavy Duty",
      description: "Heavy-duty aluminum mid clamps for elevated systems",
      specifications: "6061-T6 aluminum, fits 30-50mm frames, with EPDM gasket, enhanced grip",
      unit: "pcs",
      quantity: Math.ceil(tableCount * midClampsPerTable),
      category: "Module Fasteners",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${tableCount} tables × ${midClampsPerTable} clamps/table (${actualModulesPerRow-1} gaps × 2 clamps × ${actualRowsPerTable} rows)`
    });

    return materials;
  };

  // Calculate structural materials for ground mount systems
  const calculateGroundMountMaterials = (config: PolygonConfig, areaIndex: number): StructuralMaterialItem[] => {
    const materials: StructuralMaterialItem[] = [];
    const { tableLength, tableWidth, modulesPerTable, tableCount, tableArea, actualRowsPerTable, actualModulesPerRow } = calculateTableDimensions(config);
    const tiltAngle = config.tiltAngle || 25; // Default 25 degrees
    
    // Structural grid-based pile calculation for ground mount systems
    // Rule: 4 corner piles + intermediate piles based on table dimensions
    // For long tables (>8m), add intermediate piles every 4-5m
    const basePostsPerTable = 4; // 4 corner piles minimum
    const intermediatePilesLongSide = Math.max(0, Math.floor((tableLength - 1) / 4)); // 1 pile per 4m along length
    const intermediatePilesShortSide = actualRowsPerTable > 2 ? Math.max(0, Math.floor((tableWidth - 1) / 3)) : 0; // For 3+ rows, add piles every 3m along width
    const pilesPerTable = basePostsPerTable + intermediatePilesLongSide + intermediatePilesShortSide;
    const pileLength = 2.5; // 2.5m pile length
    materials.push({
      id: `driven-piles-${areaIndex}`,
      item: "Galvanized Steel Driven Piles",
      description: "Hot-dip galvanized steel piles for ground mounting",
      specifications: `114.3mm OD x 6mm wall thickness, HDG coating 85µm, length ${pileLength}m`,
      unit: "pcs",
      quantity: Math.ceil(tableCount * pilesPerTable),
      category: "Foundation & Ballast",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${tableCount} tables × ${pilesPerTable} piles/table (${basePostsPerTable} corner + ${intermediatePilesLongSide} length + ${intermediatePilesShortSide} width piles for ${actualModulesPerRow}×${actualRowsPerTable} layout)`
    });

    // Column posts connecting to piles (1:1 ratio with piles)
    const postsPerTable = pilesPerTable;
    const postHeight = 1.8; // 1.8m post height above ground
    materials.push({
      id: `column-posts-ground-${areaIndex}`,
      item: "Galvanized Steel Column Posts",
      description: "Galvanized posts connecting piles to mounting structure",
      specifications: `89mm OD x 4mm wall steel tube, HDG coating 85µm, height ${postHeight}m`,
      unit: "pcs",
      quantity: Math.ceil(tableCount * postsPerTable),
      category: "Support Structure",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${tableCount} tables × ${postsPerTable} posts/table (matching pile count)`
    });

    // Dynamic purlin rails calculation based on table dimensions
    const railLengthPerTable = tableLength * 1.1; // 10% margin for connections
    const railRowsPerTable = actualRowsPerTable; // Use actual rows per table
    materials.push({
      id: `purlin-rails-ground-${areaIndex}`,
      item: "Aluminum Purlin Rails - Ground Mount",
      description: "Heavy-duty aluminum rails for ground mount systems",
      specifications: "6063-T6 aluminum, 55x38x3mm profile, mill finish with protective coating",
      unit: "m",
      quantity: Math.ceil(tableCount * railLengthPerTable * railRowsPerTable),
      category: "Mounting Structure",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${tableCount} tables × ${railLengthPerTable.toFixed(1)}m length × ${railRowsPerTable} rows (${tableLength.toFixed(1)}m table length)`
    });

    // Dynamic rafter support beams based on table width
    const rafterLengthPerTable = tableWidth * 1.05; // 5% margin for connections
    const rafterCountPerTable = Math.max(2, Math.ceil(tableLength / 3)); // 1 rafter per 3m length for ground mount
    materials.push({
      id: `rafter-beams-ground-${areaIndex}`,
      item: "Galvanized Steel Support Rafters",
      description: "Structural rafters for ground mount table framework",
      specifications: "100x50x4mm steel rectangular tube, HDG coating 85µm",
      unit: "m",
      quantity: Math.ceil(tableCount * rafterLengthPerTable * rafterCountPerTable),
      category: "Mounting Structure",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${tableCount} tables × ${rafterLengthPerTable.toFixed(1)}m length × ${rafterCountPerTable} rafters (${tableWidth.toFixed(1)}m table width)`
    });

    // Dynamic clamps calculation based on actual module layout
    const endClampsPerTable = actualRowsPerTable * 2;
    const midClampsPerTable = Math.max(0, (actualModulesPerRow - 1) * 2 * actualRowsPerTable);
    
    materials.push({
      id: `end-clamps-ground-${areaIndex}`,
      item: "End Clamps - Ground Mount",
      description: "Aluminum end clamps designed for ground mount systems",
      specifications: "6061-T6 aluminum, fits 30-50mm frames, stainless steel bolts, EPDM gasket",
      unit: "pcs",
      quantity: Math.ceil(tableCount * endClampsPerTable),
      category: "Module Fasteners",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${tableCount} tables × ${endClampsPerTable} clamps/table (${actualRowsPerTable} rows × 2 end clamps)`
    });

    materials.push({
      id: `mid-clamps-ground-${areaIndex}`,
      item: "Mid Clamps - Ground Mount",
      description: "Aluminum mid clamps designed for ground mount systems",
      specifications: "6061-T6 aluminum, fits 30-50mm frames, stainless steel bolts, EPDM gasket",
      unit: "pcs",
      quantity: Math.ceil(tableCount * midClampsPerTable),
      category: "Module Fasteners",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${tableCount} tables × ${midClampsPerTable} clamps/table (${actualModulesPerRow-1} gaps × 2 clamps × ${actualRowsPerTable} rows)`
    });

    return materials;
  };

  // Calculate comprehensive structural materials for carport systems (Single-Sided Solar PV Carport)
  // Based on detailed engineering specifications from carport_boq_formulas.md
  const calculateCarportMaterials = (config: PolygonConfig, areaIndex: number): StructuralMaterialItem[] => {
    const materials: StructuralMaterialItem[] = [];
    const { tableLength, tableWidth, modulesPerTable, tableCount, actualRowsPerTable, actualModulesPerRow } = calculateTableDimensions(config);
    const moduleDims = getModuleDimensions();
    
    // For carports, each "table" represents a carport bay/section
    const carportCount = tableCount;
    const totalCarportLength = tableLength; // Total carport length
    const totalCarportWidth = tableWidth;   // Total carport width
    const tiltAngle = config.tiltAngle || 5; // Default 5° tilt for carports
    const carportHeight = 2.5; // 2.5m minimum clearance height

    console.log(`🏗️ Carport Calculation: ${carportCount} carports, ${totalCarportLength.toFixed(1)}m × ${totalCarportWidth.toFixed(1)}m each, ${actualRowsPerTable} rows × ${actualModulesPerRow} modules`);

    // === 1. FOUNDATION SYSTEM ===
    
    // Foundation Grid Calculation (per carport_boq_formulas.md)
    // Longitudinal spacing: 6.0m maximum, Transverse spacing: 8.0m maximum for single-sided design
    const longitudinalLines = Math.ceil(totalCarportLength / 6.0) + 1; // Foundation lines along length
    const transverseLines = 2; // Single-sided: high side + low side
    const totalFoundationsPerCarport = longitudinalLines * transverseLines;
    const foundationVolume = 2.0; // 1.0×1.0×2.0m = 2.0 m³ per foundation

    materials.push({
      id: `carport-driven-piles-${areaIndex}`,
      item: "Carport Foundation Concrete",
      description: "Concrete foundations for carport structural grid",
      specifications: "Grade C25/30 concrete, 1.0×1.0×2.0m deep foundations with reinforcement",
      unit: "m³",
      quantity: carportCount * totalFoundationsPerCarport * foundationVolume * 1.05, // 5% wastage
      category: "Foundation & Ballast",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${carportCount} carports × ${totalFoundationsPerCarport} foundations × ${foundationVolume}m³ (${longitudinalLines}×${transverseLines} grid @ 6m×8m spacing)`
    });

    // Foundation Reinforcement Steel
    const rebarPerFoundation = 88.4; // kg per foundation (from formula)
    materials.push({
      id: `carport-foundation-rebar-${areaIndex}`,
      item: "Foundation Reinforcement Steel",
      description: "Steel reinforcement bars for carport foundations",
      specifications: "Y16 main bars + Y10 stirrups, Grade 500 steel, cut and bent",
      unit: "kg",
      quantity: carportCount * totalFoundationsPerCarport * rebarPerFoundation,
      category: "Foundation & Ballast",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${carportCount * totalFoundationsPerCarport} foundations × ${rebarPerFoundation}kg/foundation`
    });

    // === 2. COLUMN STRUCTURE ===
    
    // Column Height Determination for 5° tilt single-sided carport
    const structuralDepth = 0.3; // 0.3m structural depth
    const highSideHeight = carportHeight + (totalCarportWidth * Math.sin(tiltAngle * Math.PI / 180)) + structuralDepth;
    const lowSideHeight = carportHeight + structuralDepth;
    
    // Columns (1 per foundation)
    const columnsPerCarport = totalFoundationsPerCarport;
    const highSideColumns = longitudinalLines; // High side columns
    const lowSideColumns = longitudinalLines;  // Low side columns
    const totalColumnLength = (highSideColumns * highSideHeight) + (lowSideColumns * lowSideHeight);
    
    // Determine column sizing based on carport span
    let columnSpecs = "150×150×6mm SHS"; // Light duty default
    let columnWeight = 27.3; // kg/m
    if (totalCarportWidth > 15) {
      columnSpecs = "250×250×10mm SHS"; // Heavy duty
      columnWeight = 75.1;
    } else if (totalCarportWidth > 8) {
      columnSpecs = "200×200×8mm SHS"; // Medium duty  
      columnWeight = 47.1;
    }

    materials.push({
      id: `carport-main-columns-${areaIndex}`,
      item: "Carport Main Steel Columns",
      description: "Primary structural columns for carport frame",
      specifications: `${columnSpecs} steel tube, S355 grade, HDG coating 85µm`,
      unit: "kg",
      quantity: carportCount * totalColumnLength * columnWeight,
      category: "Support Structure",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${carportCount} carports × ${totalColumnLength.toFixed(1)}m total column length × ${columnWeight}kg/m (${columnsPerCarport} columns: ${highSideColumns} high-side @ ${highSideHeight.toFixed(1)}m + ${lowSideColumns} low-side @ ${lowSideHeight.toFixed(1)}m)`
    });

    // === 3. MAIN BEAM STRUCTURE ===
    
    // Primary Beams (spanning across carport width)
    const primaryBeamLength = totalCarportWidth * 1.03; // 3% margin
    const primaryBeamsPerCarport = longitudinalLines;
    const totalPrimaryBeamLength = primaryBeamLength * primaryBeamsPerCarport;
    
    // Beam sizing based on span
    let beamSpecs = "310UB40";
    let beamWeight = 40.4; // kg/m
    if (totalCarportWidth > 15) {
      beamSpecs = "460UB67";
      beamWeight = 67.4;
    } else if (totalCarportWidth > 12) {
      beamSpecs = "410UB59";
      beamWeight = 59.0;
    } else if (totalCarportWidth > 8) {
      beamSpecs = "360UB50";
      beamWeight = 50.7;
    }

    materials.push({
      id: `carport-primary-beams-${areaIndex}`,
      item: "Carport Primary Roof Beams",
      description: "Main structural beams spanning carport width",
      specifications: `${beamSpecs} steel I-beam, S355 grade, HDG coating 85µm`,
      unit: "kg",
      quantity: carportCount * totalPrimaryBeamLength * beamWeight,
      category: "Support Structure",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${carportCount} carports × ${primaryBeamLength.toFixed(1)}m length × ${primaryBeamsPerCarport} beams × ${beamWeight}kg/m (spanning ${totalCarportWidth.toFixed(1)}m carport width)`
    });

    // === 4. SECONDARY BEAM STRUCTURE ===
    
    // Secondary Beams (parallel to carport length)
    const secondaryBeamsPerCarport = 2 + Math.max(0, longitudinalLines - 2); // High-side + low-side + intermediates
    const secondaryBeamLength = totalCarportLength * 1.02; // 2% margin
    const totalSecondaryBeamLength = secondaryBeamsPerCarport * secondaryBeamLength;
    
    // C-section sizing based on loading
    let cSectionSpecs = "C250×75×25×3mm";
    let cSectionWeight = 22.8; // kg/m
    if (actualRowsPerTable * actualModulesPerRow > 40) {
      cSectionSpecs = "C350×100×35×4.5mm"; // Heavy loading
      cSectionWeight = 48.8;
    } else if (actualRowsPerTable * actualModulesPerRow > 20) {
      cSectionSpecs = "C300×90×30×4mm"; // Medium loading
      cSectionWeight = 35.4;
    }

    materials.push({
      id: `carport-secondary-beams-${areaIndex}`,
      item: "Carport Secondary Roof Beams",
      description: "Secondary structural beams for roof support",
      specifications: `${cSectionSpecs} steel C-section, S355 grade, HDG coating 85µm`,
      unit: "kg",
      quantity: carportCount * totalSecondaryBeamLength * cSectionWeight,
      category: "Support Structure",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${carportCount} carports × ${secondaryBeamLength.toFixed(1)}m length × ${secondaryBeamsPerCarport} beams × ${cSectionWeight}kg/m`
    });

    // === 5. RAFTER STRUCTURE ===
    
    // Rafters (1.5m spacing standard for PV mounting)
    const rafterSpacing = 1.5; // meters
    const raftersPerCarport = Math.ceil(totalCarportLength / rafterSpacing) + 1;
    const rafterLength = totalCarportWidth / Math.cos(tiltAngle * Math.PI / 180); // Adjusted for tilt
    const totalRafterLength = raftersPerCarport * rafterLength;
    
    // Rafter sizing
    const rafterSpecs = actualRowsPerTable * actualModulesPerRow > 30 ? "C250×75×25×3mm" : "C200×75×20×2.5mm";
    const rafterWeight = actualRowsPerTable * actualModulesPerRow > 30 ? 18.7 : 14.2; // kg/m

    materials.push({
      id: `carport-rafters-${areaIndex}`,
      item: "Carport Roof Rafters",
      description: "Structural rafters for PV module support",
      specifications: `${rafterSpecs} steel C-section, S355 grade, HDG coating 85µm`,
      unit: "kg",
      quantity: carportCount * totalRafterLength * rafterWeight,
      category: "Support Structure",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${carportCount} carports × ${rafterLength.toFixed(1)}m length × ${raftersPerCarport} rafters × ${rafterWeight}kg/m (${rafterSpacing}m spacing)`
    });

    // === 6. PV MODULE MOUNTING SYSTEM ===
    
    // Module Rails (2 rails per module row)
    const railLinesPerCarport = actualRowsPerTable * 2; // 2 rails per row
    const railLengthPerLine = totalCarportLength * 1.05; // 5% margin
    const totalRailLength = railLinesPerCarport * railLengthPerLine;

    materials.push({
      id: `carport-pv-rails-${areaIndex}`,
      item: "Carport PV Mounting Rails",
      description: "Aluminum rails for solar module mounting on carport",
      specifications: "6063-T6 aluminum, 50×40×4mm profile, anodized finish, 2.1 kg/m",
      unit: "m",
      quantity: carportCount * totalRailLength,
      category: "Mounting Structure",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${carportCount} carports × ${railLengthPerLine.toFixed(1)}m length × ${railLinesPerCarport} rails (${actualRowsPerTable} rows × 2 rails/row)`
    });

    // Rail Support Brackets
    const bracketsPerRail = Math.ceil(railLengthPerLine / 1.2) + 1; // Every 1.2m spacing
    const totalBrackets = carportCount * railLinesPerCarport * bracketsPerRail;

    materials.push({
      id: `carport-rail-brackets-${areaIndex}`,
      item: "Carport Rail Support Brackets",
      description: "Adjustable brackets for rail-to-beam connection",
      specifications: "6061-T6 aluminum, adjustable height 50-200mm, stainless steel fasteners",
      unit: "pcs",
      quantity: totalBrackets,
      category: "Mounting Structure",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${carportCount} carports × ${railLinesPerCarport} rails × ${bracketsPerRail} brackets/rail (every 1.2m spacing)`
    });

    // === 7. MODULE CLAMPS & FASTENERS ===
    
    const totalModules = actualRowsPerTable * actualModulesPerRow;
    
    // End Clamps (perimeter modules only)
    const cornerModules = 4;
    const edgeModules = 2 * (actualRowsPerTable - 2) + 2 * (actualModulesPerRow - 2);
    const endClamps = 4 * cornerModules + 2 * Math.max(0, edgeModules);
    const endClampsSimplified = 8 + 4 * (actualRowsPerTable + actualModulesPerRow - 4);

    materials.push({
      id: `carport-end-clamps-${areaIndex}`,
      item: "Carport Module End Clamps",
      description: "Heavy-duty end clamps for module edge securing",
      specifications: "6061-T6 aluminum, fits 35-50mm frames, grounding capability, EPDM gasket",
      unit: "pcs",
      quantity: carportCount * Math.max(endClamps, endClampsSimplified),
      category: "Module Fasteners",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${carportCount} carports × ${Math.max(endClamps, endClampsSimplified)} clamps (perimeter modules: ${cornerModules} corners + ${Math.max(0, edgeModules)} edges)`
    });

    // Mid Clamps (internal module connections)
    const horizontalConnections = (actualRowsPerTable - 1) * actualModulesPerRow * 2;
    const verticalConnections = actualRowsPerTable * (actualModulesPerRow - 1) * 2;
    const midClamps = horizontalConnections + verticalConnections;

    materials.push({
      id: `carport-mid-clamps-${areaIndex}`,
      item: "Carport Module Mid Clamps",
      description: "Heavy-duty mid clamps for inter-module connections",
      specifications: "6061-T6 aluminum, fits 35-50mm frames, grounding capability, EPDM gasket",
      unit: "pcs",
      quantity: carportCount * midClamps,
      category: "Module Fasteners",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${carportCount} carports × ${midClamps} clamps (${horizontalConnections} horizontal + ${verticalConnections} vertical connections)`
    });

    // === 8. CONNECTIONS AND FASTENERS ===
    
    // Module to Rail Fasteners (T-bolts)
    const tBolts = totalModules * 4; // 4 per module
    materials.push({
      id: `carport-t-bolts-${areaIndex}`,
      item: "Module T-Bolt Fasteners",
      description: "T-bolts for module-to-rail connections",
      specifications: "M8×25 stainless steel T-bolts with nuts and washers",
      unit: "pcs",
      quantity: carportCount * tBolts,
      category: "Module Fasteners",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${carportCount} carports × ${totalModules} modules × 4 T-bolts/module`
    });

    // Structural Bolts (High-Strength)
    const columnConnections = columnsPerCarport * 2; // Base + top connections
    const beamConnections = primaryBeamsPerCarport * secondaryBeamsPerCarport * 2;
    const majorConnections = columnConnections + beamConnections;
    const structuralBolts = majorConnections * 4; // 4 bolts per connection

    materials.push({
      id: `carport-structural-bolts-${areaIndex}`,
      item: "Carport Structural Bolts",
      description: "High-strength bolts for main structural connections",
      specifications: "M20×80 Grade 8.8 bolts with nuts and washers, HDG coating",
      unit: "pcs",
      quantity: carportCount * structuralBolts,
      category: "Support Structure",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${carportCount} carports × ${majorConnections} connections × 4 bolts/connection (${columnConnections} column + ${beamConnections} beam connections)`
    });

    // === 9. WEATHERPROOFING AND ACCESSORIES ===
    
    // Sealants and Gaskets
    const sealantLength = totalRailLength * 0.1; // 10cm per meter of rail
    materials.push({
      id: `carport-sealants-${areaIndex}`,
      item: "Carport Weatherproofing Sealants",
      description: "Structural glazing sealant for weather sealing",
      specifications: "Neutral cure silicone sealant, UV stable, 25-year warranty",
      unit: "m",
      quantity: carportCount * sealantLength,
      category: "Weatherproofing",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${carportCount} carports × ${totalRailLength.toFixed(0)}m total rail length × 10% sealing requirement`
    });

    // Drainage System (Gutters)
    const gutterLength = totalCarportLength * 2; // Both sides of carport
    materials.push({
      id: `carport-gutters-${areaIndex}`,
      item: "Carport Drainage Gutters",
      description: "Aluminum gutters for rainwater collection",
      specifications: "150mm aluminum gutter with brackets, powder coated finish",
      unit: "m",
      quantity: carportCount * gutterLength,
      category: "Weatherproofing",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${carportCount} carports × ${totalCarportLength.toFixed(1)}m length × 2 sides`
    });

    // Downpipes
    const downpipes = Math.ceil(gutterLength / 15); // 1 per 15m of gutter
    materials.push({
      id: `carport-downpipes-${areaIndex}`,
      item: "Carport Downpipes",
      description: "Vertical downpipes for gutter drainage",
      specifications: "100mm aluminum downpipes with brackets and connections",
      unit: "pcs",
      quantity: carportCount * downpipes,
      category: "Weatherproofing",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${carportCount} carports × ${downpipes} downpipes (1 per 15m gutter length)`
    });

    return materials;
  };

  // Calculate structural materials for shed/roof mounting systems
  const calculateShedMaterials = (config: PolygonConfig, areaIndex: number): StructuralMaterialItem[] => {
    const materials: StructuralMaterialItem[] = [];
    const { tableLength, tableWidth, modulesPerTable, tableCount } = calculateTableDimensions(config);
    
    // For shed mounting, calculate based on actual module layout
    const totalModules = config.moduleCount;
    const estimatedRows = Math.ceil(Math.sqrt(totalModules));
    const estimatedColumns = Math.ceil(totalModules / estimatedRows);
    
    // Dynamic mounting rails calculation based on module dimensions
    const moduleDims = getModuleDimensions();
    const railLengthPerRow = estimatedColumns * moduleDims.length * 1.1; // 10% margin for overlaps
    const totalRailLength = railLengthPerRow * estimatedRows;
    materials.push({
      id: `shed-mounting-rails-${areaIndex}`,
      item: "Shed Mounting Rails",
      description: "Aluminum mounting rails for shed roof installation",
      specifications: "6063-T6 aluminum, 40x40x3mm profile, with integrated grounding",
      unit: "m",
      quantity: totalRailLength,
      category: "Mounting Structure",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${estimatedRows} rows × ${railLengthPerRow.toFixed(1)}m/row (${estimatedColumns} modules/row × ${moduleDims.length}m module length)`
    });

    // Dynamic roof hooks calculation based on module count and roof type
    // Rule: 4 hooks per module for secure attachment
    const hooksPerModule = 4;
    materials.push({
      id: `shed-roof-hooks-${areaIndex}`,
      item: "Shed Roof Hooks",
      description: "Stainless steel roof hooks for shed mounting",
      specifications: "304 stainless steel, adjustable height 140-240mm, with EPDM seal",
      unit: "pcs",
      quantity: totalModules * hooksPerModule,
      category: "Roof Attachments",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${totalModules} modules × ${hooksPerModule} hooks/module`
    });

    // Dynamic clamps calculation based on actual module layout
    const endClampsPerRow = 2; // 2 end clamps per row (one at each end)
    const totalEndClamps = estimatedRows * endClampsPerRow;
    
    // Mid clamps: (modules per row - 1) × 2 × number of rows
    const midClampsPerRow = Math.max(0, (estimatedColumns - 1) * 2);
    const totalMidClamps = midClampsPerRow * estimatedRows;
    
    materials.push({
      id: `shed-end-clamps-${areaIndex}`,
      item: "Shed End Clamps",
      description: "Aluminum end clamps for shed roof module mounting",
      specifications: "6061-T6 aluminum, fits 30-50mm frames, with EPDM gasket",
      unit: "pcs",
      quantity: totalEndClamps,
      category: "Module Fasteners",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${estimatedRows} rows × ${endClampsPerRow} end clamps/row`
    });

    materials.push({
      id: `shed-mid-clamps-${areaIndex}`,
      item: "Shed Mid Clamps",
      description: "Aluminum mid clamps for shed roof module mounting",
      specifications: "6061-T6 aluminum, fits 30-50mm frames, with EPDM gasket",
      unit: "pcs",
      quantity: totalMidClamps,
      category: "Module Fasteners",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${estimatedRows} rows × ${midClampsPerRow} mid clamps/row (${estimatedColumns-1} gaps × 2 clamps)`
    });

    // Dynamic flashing calculation based on roof penetrations
    // Rule: Each roof hook requires flashing around penetration
    const flashingPerHook = 0.3; // 0.3m flashing per hook penetration
    const totalFlashingLength = (totalModules * hooksPerModule * flashingPerHook);
    materials.push({
      id: `shed-flashing-${areaIndex}`,
      item: "Roof Flashing",
      description: "Waterproof flashing for roof penetrations",
      specifications: "EPDM rubber flashing, 300mm width, UV resistant",
      unit: "m",
      quantity: totalFlashingLength,
      category: "Weatherproofing",
      structureType: config.structureType,
      areaIndex,
      calculationBasis: `${totalModules * hooksPerModule} roof hooks × ${flashingPerHook}m flashing/hook`
    });

    return materials;
  };

  // Main calculation function
  const calculateAllStructuralMaterials = (): StructuralMaterialItem[] => {
    const allMaterials: StructuralMaterialItem[] = [];

    polygonConfigs.forEach((config, index) => {
      let materials: StructuralMaterialItem[] = [];

      switch (config.structureType) {
        case 'ballasted':
          materials = calculateBallastedMaterials(config, index);
          break;
        case 'fixed_tilt':
          materials = calculateElevatedMaterials(config, index);
          break;
        case 'ground_mount_tables':
          materials = calculateGroundMountMaterials(config, index);
          break;
        case 'carport':
          materials = calculateCarportMaterials(config, index);
          break;
        case 'pv_table_free_form':
        default:
          materials = calculateShedMaterials(config, index);
          break;
      }

      allMaterials.push(...materials);
    });

    return allMaterials;
  };

  // Calculate materials when component mounts or configs change
  useEffect(() => {
    if (polygonConfigs && polygonConfigs.length > 0) {
      setIsCalculating(true);
      setTimeout(() => {
        const materials = calculateAllStructuralMaterials();
        setStructuralMaterials(materials);
        onMaterialsCalculated?.(materials); // Pass materials to parent component
        setIsCalculating(false);
        toast.success(`Calculated structural materials for ${polygonConfigs.length} areas`);
      }, 500);
    }
  }, [polygonConfigs]);

  // Export materials to CSV
  const exportMaterials = () => {
    if (structuralMaterials.length === 0) {
      toast.error("No structural materials to export");
      return;
    }

    try {
      const headers = ['Area', 'Structure Type', 'Item', 'Description', 'Specifications', 'Unit', 'Quantity', 'Category', 'Calculation Basis'];
      const csvRows = [
        headers.join(','),
        ...structuralMaterials.map(item => [
          `Area ${item.areaIndex + 1}`,
          `"${item.structureType}"`,
          `"${item.item}"`,
          `"${item.description}"`,
          `"${item.specifications}"`,
          `"${item.unit}"`,
          item.quantity,
          `"${item.category}"`,
          `"${item.calculationBasis}"`
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const fileName = `Structural_Materials_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Structural materials exported as ${fileName}`);
    } catch (error) {
      console.error('Error exporting materials:', error);
      toast.error("Failed to export materials");
    }
  };

  // Get materials by structure type
  const getMaterialsByStructureType = (structureType: string) => {
    return structuralMaterials.filter(material => material.structureType === structureType);
  };

  // Get unique structure types
  const getUniqueStructureTypes = () => {
    return [...new Set(structuralMaterials.map(material => material.structureType))];
  };

  // Get structure type display name
  const getStructureTypeName = (structureType: string) => {
    switch(structureType) {
      case 'ballasted': return 'Ballasted Roof';
      case 'fixed_tilt': return 'Fixed Tilt Elevated';
      case 'ground_mount_tables': return 'Ground Mount Tables';
      case 'carport': return 'Carport Structure';
      case 'pv_table_free_form': return 'Shed/Free Form';
      default: return structureType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Foundation & Ballast': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Support Structure': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Mounting Structure': return 'bg-green-50 text-green-700 border-green-200';
      case 'Module Fasteners': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Roof Attachments': return 'bg-red-50 text-red-700 border-red-200';
      case 'Weatherproofing': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Get calculation explanation for specific material items
  const getCalculationExplanation = (itemName: string): string => {
    switch (itemName) {
      case "Concrete Ballast Blocks":
        return "💡 Calculation Logic:\n• Rule: 1 ballast block per 1.5m² of table area\n• Formula: Math.max(4, Math.ceil(tableArea ÷ 1.5))\n• Engineering Basis: Ensures adequate wind uplift resistance\n• Block Size: 40kg concrete blocks (600×300×100mm)\n• Minimum: 4 blocks per table for structural stability";
      
      case "Aluminum Purlin Rails":
        return "💡 Calculation Logic:\n• Rule: Rail length = table length + margin (5-10%)\n• Formula: tableLength × 1.05-1.1 × rowsPerTable\n• Orientation: Uses actual user-selected orientation (landscape/portrait)\n• Engineering Basis: Extra length accounts for:\n  - Rail splicing and connections\n  - End overlaps for structural continuity\n  - Installation tolerances\n• Flat Roof: Lighter 40×30×3mm profile for reduced dead load\n• Ground Mount: Standard 40×40×3mm profile";
      
      case "Aluminum Cross Rafters":
        return "💡 Calculation Logic:\n• Spacing Rule: 1 rafter per 3m of table length (min 2)\n• Length Rule: Table width + 5% connection margin\n• Formula: Math.max(2, Math.ceil(tableLength ÷ 3))\n• Engineering Basis:\n  - 3m spacing provides adequate load distribution\n  - 5% extra length for connection details\n• Material: 6063-T6 aluminum, 60×40×4mm tube";
      
      case "End Clamps":
        return "💡 Calculation Logic:\n• Rule: 2 end clamps per module row\n• Formula: rowsPerTable × 2 × tableCount\n• Engineering Basis: Secures module edges\n• Material: 6061-T6 aluminum with EPDM gasket\n• Fits: 30-50mm module frame thickness";
      
      case "Mid Clamps":
        return "💡 Calculation Logic:\n• Rule: 2 clamps per module gap between modules\n• Formula: (modulesPerRow - 1) × 2 × rowsPerTable\n• Engineering Basis: Connects adjacent modules\n• Material: 6061-T6 aluminum with EPDM gasket\n• Note: No clamps needed if only 1 module per row";
      
      case "Aluminum Column Posts":
        return "💡 Calculation Logic:\n• Rule: 4 corner posts + intermediate posts (1 per 3 modules)\n• Formula: 4 + Math.floor((modulesPerRow-1) ÷ 3) × rows\n• Engineering Basis: Structural grid positioning for stability\n• Flat Roof Height: 2.0m for reduced wind loads\n• Material: Lightweight 80×80×4mm aluminum for flat roof";
      
      case "Concrete Foundation Blocks":
        return "💡 Calculation Logic:\n• Rule: 1 foundation block per post\n• Formula: postsPerTable × tableCount\n• Engineering Basis: Individual foundation for each post\n• Flat Roof Size: 0.5×0.5×0.5m compact blocks\n• Material: Grade C25/30 concrete with anchor bolts";
      
      case "Aluminum Rafters":
        return "💡 Calculation Logic:\n• Spacing Rule: 1 rafter per 2.5m table length (min 2)\n• Length Rule: Table width + 5% connection margin\n• Formula: Math.max(2, Math.ceil(tableLength ÷ 2.5))\n• Engineering Basis: Connects posts to rail system for wind stability\n• Material: Lightweight 60×40×4mm aluminum for flat roof";
      
      case "Galvanized Steel Driven Piles":
        return "💡 Calculation Logic:\n• Rule: 4 corner piles + intermediate piles based on spacing\n• Formula: 4 + Math.floor((length-1) ÷ 4) + width piles\n• Engineering Basis: Structural grid positioning for ground stability\n• Spacing: 1 pile per 4m along length, every 3m along width for 3+ rows\n• Material: 114.3mm OD galvanized steel, 2.5m length";
      
      case "Galvanized Steel Column Posts":
        return "💡 Calculation Logic:\n• Rule: 1 post per pile (1:1 ratio)\n• Formula: pilesPerTable × tableCount\n• Engineering Basis: Connects foundation piles to mounting structure\n• Height: 1.8m above ground for ground mount, 2.0m for elevated\n• Material: 89mm OD galvanized steel tube";
      
      // === CARPORT SYSTEM EXPLANATIONS ===
      case "Carport Foundation Concrete":
        return "💡 Calculation Logic:\n• Grid Rule: 6m longitudinal × 8m transverse spacing\n• Formula: Math.ceil(length ÷ 6) + 1 × 2 lines × 2.0m³\n• Engineering Basis: IEC 61215 & AS/NZS 1170 standards\n• Foundation Size: 1.0×1.0×2.0m deep with 5% wastage\n• Load Capacity: Designed for carport dead + live + wind loads";
      
      case "Foundation Reinforcement Steel":
        return "💡 Calculation Logic:\n• Rebar Rule: 88.4kg per foundation (standard calculation)\n• Components: Y16 main bars + Y10 stirrups @ 200mm\n• Formula: foundations × 88.4kg/foundation\n• Engineering Basis: AS 3600 concrete design standards\n• Grade: 500MPa reinforcing steel, cut and bent";
      
      case "Carport Main Steel Columns":
        return "💡 Calculation Logic:\n• Height Rule: High-side = 2.5 + (width × sin(5°)) + 0.3m\n• Low-side = 2.5 + 0.3m structural depth\n• Sizing: 150×150×6mm (light), 200×200×8mm (medium), 250×250×10mm (heavy)\n• Formula: column_length × weight_per_meter\n• Engineering Basis: AS 4100 steel design standards";
      
      case "Carport Primary Roof Beams":
        return "💡 Calculation Logic:\n• Beam Rule: Spans carport width with 3% margin\n• Sizing: 310UB40 (≤8m), 360UB50 (8-12m), 410UB59 (12-15m), 460UB67 (>15m)\n• Formula: beam_length × beams_per_carport × kg/m\n• Engineering Basis: Australian steel beam standards\n• Load Design: Dead + live + wind loads per AS/NZS 1170";
      
      case "Carport Secondary Roof Beams":
        return "💡 Calculation Logic:\n• Layout Rule: High-side + low-side + intermediate beams\n• C-section Sizing: Based on module loading (light/medium/heavy)\n• Formula: beam_length × number_of_beams × kg/m\n• Spacing: Parallel to carport length with 2% margin\n• Material: C250×75×25×3mm to C350×100×35×4.5mm";
      
      case "Carport Roof Rafters":
        return "💡 Calculation Logic:\n• Spacing Rule: 1.5m centers (standard for PV mounting)\n• Length Rule: Carport width ÷ cos(5°) for tilt adjustment\n• Formula: Math.ceil(length ÷ 1.5) + 1 × rafter_length\n• Sizing: C200×75×20×2.5mm (standard), C250×75×25×3mm (heavy)\n• Load Path: Transfers PV loads to main structure";
      
      case "Carport PV Mounting Rails":
        return "💡 Calculation Logic:\n• Rail Rule: 2 rails per module row with 5% margin\n• Formula: rows × 2 × carport_length × 1.05\n• Material: 6063-T6 aluminum, 50×40×4mm profile\n• Weight: 2.1 kg/m with anodized finish\n• Function: Direct support for solar modules";
      
      case "Carport Rail Support Brackets":
        return "💡 Calculation Logic:\n• Spacing Rule: Every 1.2m along rail length (IEC 61215)\n• Formula: Math.ceil(rail_length ÷ 1.2) + 1\n• Load Capacity: Minimum 1.5 kN per bracket\n• Material: 6061-T6 aluminum, adjustable 50-200mm\n• Function: Connects PV rails to carport structure";
      
      case "Carport Module End Clamps":
        return "💡 Calculation Logic:\n• Perimeter Rule: Corner modules (4 clamps) + edge modules (2 clamps)\n• Formula: 8 + 4 × (rows + modules_per_row - 4)\n• Engineering Basis: Secures module perimeter edges\n• Material: 6061-T6 aluminum with grounding capability\n• Standards: Fits 35-50mm module frames";
      
      case "Carport Module Mid Clamps":
        return "💡 Calculation Logic:\n• Connection Rule: Horizontal + vertical module connections\n• Horizontal: (rows-1) × modules × 2 clamps\n• Vertical: rows × (modules-1) × 2 clamps\n• Engineering Basis: Inter-module structural continuity\n• Material: 6061-T6 aluminum with EPDM gasket";
      
      case "Module T-Bolt Fasteners":
        return "💡 Calculation Logic:\n• Fastener Rule: 4 T-bolts per module\n• Formula: total_modules × 4\n• Function: Secures modules to mounting rails\n• Material: M8×25 stainless steel with anti-seize\n• Standards: Module-to-rail connection per IEC 61215";
      
      case "Carport Structural Bolts":
        return "💡 Calculation Logic:\n• Connection Rule: 4 bolts per major structural connection\n• Connections: Column base/top + beam intersections\n• Formula: (column_connections + beam_connections) × 4\n• Grade: M20×80 Grade 8.8 high-strength bolts\n• Standards: AS 4100 structural steel connections";
      
      case "Carport Weatherproofing Sealants":
        return "💡 Calculation Logic:\n• Sealing Rule: 10cm sealant per meter of rail\n• Formula: total_rail_length × 0.1\n• Material: Neutral cure silicone, UV stable\n• Function: Weather sealing at module interfaces\n• Warranty: 25-year structural glazing grade";
      
      case "Carport Drainage Gutters":
        return "💡 Calculation Logic:\n• Coverage Rule: Both sides of carport (2 × length)\n• Formula: carport_length × 2\n• Size: 150mm minimum for carport application\n• Material: Aluminum with powder coated finish\n• Function: Rainwater collection and management";
      
      case "Carport Downpipes":
        return "💡 Calculation Logic:\n• Spacing Rule: 1 downpipe per 15m of gutter length\n• Formula: Math.ceil(gutter_length ÷ 15)\n• Size: 100mm diameter aluminum\n• Function: Vertical drainage from gutters\n• Installation: Includes brackets and connections";
      
      default:
        return "💡 Calculation based on:\n• Table dimensions and module layout\n• Industry standard engineering practices\n• Structural load requirements\n• Material specifications and tolerances";
    }
  };

  if (!polygonConfigs || polygonConfigs.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="p-6 text-center">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No PV Areas Configured</h3>
          <p className="text-gray-600">Add PV installation areas to calculate structural materials</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <Building className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-900">Structural Material Calculator</h2>
              <p className="text-green-700 text-sm">Detailed structural BOQ for each installation area</p>
            </div>
          </div>
          <Button onClick={exportMaterials} variant="outline" disabled={structuralMaterials.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-900">{structuralMaterials.length}</div>
            <div className="text-sm text-blue-700">Material Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-900">{getUniqueStructureTypes().length}</div>
            <div className="text-sm text-green-700">Structure Types</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-900">{new Set(structuralMaterials.map(m => m.category)).size}</div>
            <div className="text-sm text-purple-700">Categories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-900">{polygonConfigs.length}</div>
            <div className="text-sm text-orange-700">Installation Areas</div>
          </CardContent>
        </Card>
      </div>

      {/* Materials Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-green-500" />
            Structural Materials by Area
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Summary View</TabsTrigger>
              <TabsTrigger value="by-structure">By Structure Type</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Table</TabsTrigger>
              <TabsTrigger value="consolidated">Consolidated View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="space-y-4">
              {polygonConfigs.map((config, index) => {
                const areaMaterials = structuralMaterials.filter(m => m.areaIndex === index);
                const categorySummary = areaMaterials.reduce((acc, material) => {
                  acc[material.category] = (acc[material.category] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);
                
                return (
                  <Card key={index} className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">Area {index + 1}</h4>
                        <Badge variant="outline">{getStructureTypeName(config.structureType)}</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {config.area?.toFixed(1)}m² • {config.moduleCount} modules • {config.capacityKw?.toFixed(1)}kWp
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(categorySummary).map(([category, count]) => (
                          <div key={category} className={`p-3 rounded-lg border ${getCategoryColor(category)}`}>
                            <div className="font-medium text-sm">{category}</div>
                            <div className="text-xs mt-1">{count} items</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
            
            <TabsContent value="by-structure" className="space-y-4">
              {getUniqueStructureTypes().map(structureType => {
                const materials = getMaterialsByStructureType(structureType);
                return (
                  <Card key={structureType}>
                    <CardHeader>
                      <CardTitle className="text-lg">{getStructureTypeName(structureType)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Item</th>
                              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Specifications</th>
                              <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">Unit</th>
                              <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">Quantity</th>
                              <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">Category</th>
                            </tr>
                          </thead>
                          <tbody>
                            {materials.map((material, idx) => (
                              <tr key={material.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                                <td className="border border-gray-300 px-3 py-2 font-medium">{material.item}</td>
                                <td className="border border-gray-300 px-3 py-2 text-sm text-gray-600">{material.specifications}</td>
                                <td className="border border-gray-300 px-3 py-2 text-center">{material.unit}</td>
                                <td className="border border-gray-300 px-3 py-2 text-right font-bold">{material.quantity.toLocaleString()}</td>
                                <td className="border border-gray-300 px-3 py-2 text-center">
                                  <Badge variant="outline" className="text-xs">{material.category}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
            
            <TabsContent value="detailed">
              <TooltipProvider>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-green-50">
                        <th className="border border-gray-300 px-3 py-3 text-left font-semibold text-sm">Area</th>
                        <th className="border border-gray-300 px-3 py-3 text-left font-semibold text-sm">Structure</th>
                        <th className="border border-gray-300 px-3 py-3 text-left font-semibold text-sm">Item</th>
                        <th className="border border-gray-300 px-3 py-3 text-left font-semibold text-sm">Description</th>
                        <th className="border border-gray-300 px-3 py-3 text-left font-semibold text-sm">Specifications</th>
                        <th className="border border-gray-300 px-3 py-3 text-center font-semibold text-sm">Unit</th>
                        <th className="border border-gray-300 px-3 py-3 text-right font-semibold text-sm">Qty</th>
                        <th className="border border-gray-300 px-3 py-3 text-center font-semibold text-sm">Category</th>
                        <th className="border border-gray-300 px-3 py-3 text-left font-semibold text-sm">Calculation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {structuralMaterials.map((material, index) => (
                        <tr key={material.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                          <td className="border border-gray-300 px-3 py-2 font-medium">Area {material.areaIndex + 1}</td>
                          <td className="border border-gray-300 px-3 py-2">
                            <Badge variant="outline" className="text-xs">{getStructureTypeName(material.structureType)}</Badge>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 font-semibold">
                            <div className="flex items-center gap-2 group">
                              <span>{material.item}</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-md p-3 text-sm bg-blue-50 border-blue-200">
                                  <div className="whitespace-pre-line">
                                    {getCalculationExplanation(material.item)}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-gray-700">{material.description}</td>
                          <td className="border border-gray-300 px-3 py-2 text-xs text-gray-600">{material.specifications}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center font-medium">{material.unit}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right font-bold">{material.quantity.toLocaleString()}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            <Badge variant="outline" className={`text-xs ${getCategoryColor(material.category)}`}>
                              {material.category}
                            </Badge>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-xs text-gray-500">{material.calculationBasis}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TooltipProvider>
            </TabsContent>

            {/* Consolidated View Tab - Standardized Format */}
            <TabsContent value="consolidated" className="mt-4">
              <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-700">
                  <strong>Consolidated View:</strong> This table shows structural materials in a standardized format (S.No, Description, Specifications, Unit, Qty) 
                  matching the DC and AC BOQ formats for easy integration and comparison.
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gradient-to-r from-green-50 to-blue-50">
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">S.No</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Description</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Specifications</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Unit</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {structuralMaterials.map((material, index) => {
                      // Combine Area, Structure, Item, and Description into one column
                      const consolidatedDescription = `${material.item} - ${material.description} (Area ${material.areaIndex + 1} - ${getStructureTypeName(material.structureType)})`;
                      
                      // Combine Specifications and Calculation Basis
                      const consolidatedSpecifications = `${material.specifications}${material.calculationBasis ? ` | Basis: ${material.calculationBasis}` : ''}`;
                      
                      return (
                        <tr key={material.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                          <td className="border border-gray-300 px-4 py-2 text-center font-medium">{index + 1}</td>
                          <td className="border border-gray-300 px-4 py-2 font-semibold text-gray-900">{consolidatedDescription}</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">{consolidatedSpecifications}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center font-medium">{material.unit}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center font-bold">{material.quantity.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Stats for Consolidated View */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Items:</span>
                    <span className="ml-2 font-bold text-gray-900">{structuralMaterials.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Categories:</span>
                    <span className="ml-2 font-bold text-gray-900">
                      {new Set(structuralMaterials.map(m => m.category)).size}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Structure Types:</span>
                    <span className="ml-2 font-bold text-gray-900">
                      {new Set(structuralMaterials.map(m => m.structureType)).size}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Areas:</span>
                    <span className="ml-2 font-bold text-gray-900">
                      {new Set(structuralMaterials.map(m => m.areaIndex)).size}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Information Footer */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <strong>Note:</strong> This structural material calculation is based on standard industry practices and typical installation parameters. 
              Actual material requirements may vary based on site conditions, local building codes, wind/snow loads, soil conditions, and specific manufacturer requirements. 
              Please consult with a structural engineer and verify all calculations before procurement and installation.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StructuralMaterialCalculator;
