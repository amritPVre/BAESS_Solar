import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, CheckCircle2, Zap, Cable, Package, Wrench, Shield, Building2, Grid3X3, Layers, Anchor } from 'lucide-react';

// ==========================================
// INTERFACES & TYPES
// ==========================================

interface ACBOQItem {
  description: string;
  specifications: string;
  unit: string;
  qty: number;
  category: string;
}

interface ACBOQCategory {
  name: string;
  icon: React.ReactNode;
  items: ACBOQItem[];
}

interface ACSystemInputs {
  // LV Connection inputs
  inverterCapacity?: number;
  qtyOfInverters?: number;
  inverterOutputVoltage?: number;
  inverterOutputCurrent?: number;
  distanceInverterToCombiner?: number;
  acCableCrossSectionInverterToCombiner?: number;
  runsPerPhaseInverterToCombiner?: number; // NEW: Number of runs per phase
  distanceCombinerToPoC?: number;
  acCableCrossSectionCombinerToPoC?: number;
  runsPerPhaseCombinerToPoC?: number; // NEW: Number of runs per phase
  combinerIncomerBreakerRating?: number;
  combinerOutgoingBreakerRating?: number;
  qtyInputsPerLVCombiner?: number;
  totalLVCombinerPanels?: number;

  // HV String inputs
  numberOfStringInverters?: number;
  invertersPerLVCombiner?: number;
  qtyOfIDTs?: number;
  qtyOfPTs?: number; // NEW: Number of Power Transformers
  idtInputVoltage?: number;
  idtInputCurrent?: number;
  idtOutputVoltage?: number;
  idtOutputCurrent?: number;
  ptInputVoltage?: number;
  ptInputCurrent?: number;
  ptOutputVoltage?: number;
  ptOutputCurrent?: number;
  distanceLVCombinerToIDT?: number;
  cableSizeLVCombinerToIDT?: number;
  runsPerPhaseLVCombinerToIDT?: number; // NEW: Number of runs per phase
  distanceIDTToPT?: number;
  cableSizeIDTToPT?: number;
  runsPerPhaseIDTToPT?: number; // NEW: Number of runs per phase (for single-core MV)
  distancePTToPoC?: number;
  cableSizePTToPoC?: number;
  runsPerPhasePTToPoC?: number; // NEW: Number of runs per phase (for single-core MV)
  transformerMVARating?: number;
  transformerImpedance?: number;
  
  // NEW: HV String & Central Equipment Ratings
  idtPowerRatingMVA?: number; // IDT power rating in MVA
  ptPowerRatingMVA?: number; // Power Transformer rating in MVA
  ptVectorGrouping?: string; // Power Transformer vector grouping (e.g., Dyn11)
  combinerPanelsPerIDT?: number; // Number of LV Combiner panels per IDT
  
  // NEW: HV String Breaker Ratings  
  combinerToIDTBreakerRating?: number;
  idtToPTBreakerRating?: number;
  ptToPoCBreakerRating?: number;
  ptToPoCBreakerType?: string;

  // HV Central inputs
  numberOfCentralInverters?: number;
  distanceInverterToIDT?: number;
  cableSizeInverterToIDT?: number;
  runsPerPhaseInverterToIDT?: number; // NEW: Number of runs per phase

  // Common parameters
  sheathAreaMultiplier?: number;
  cableTrayFillFactor?: number;
  trayVerticalStackingLayers?: number;
  cableTieSpacing?: number;
  extraTiesPerRun?: number;
  sparePercentage?: number;
}

// ==========================================
// ENGINEERING STANDARDS DATABASE
// ==========================================

const AC_ENGINEERING_STANDARDS = {
  // ==========================================
  // COMPREHENSIVE TREFOIL FORMATION DATABASE
  // ==========================================

  // CABLE BUNDLING LIMITS IN TRAYS - 4-CORE TREFOIL FORMATION (INCLUDES 100mm TRAYS)
  cableBundling4CoreTray: [
    // 100mm TRAY SPECIFICATIONS (Small Systems 10-150kW)
    { crossSection: 6, minCables: 2, maxCables: 6, trayWidth: 100, trayHeight: 50, circuits: '2_TO_6_CIRCUITS', systemSize: 'SMALL' },
    { crossSection: 10, minCables: 2, maxCables: 5, trayWidth: 100, trayHeight: 50, circuits: '2_TO_5_CIRCUITS', systemSize: 'SMALL' },
    { crossSection: 16, minCables: 1, maxCables: 4, trayWidth: 100, trayHeight: 50, circuits: '1_TO_4_CIRCUITS', systemSize: 'SMALL' },
    { crossSection: 25, minCables: 1, maxCables: 3, trayWidth: 100, trayHeight: 75, circuits: '1_TO_3_CIRCUITS', systemSize: 'SMALL' },
    { crossSection: 35, minCables: 1, maxCables: 2, trayWidth: 100, trayHeight: 75, circuits: '1_TO_2_CIRCUITS', systemSize: 'SMALL' },
    { crossSection: 50, minCables: 1, maxCables: 2, trayWidth: 100, trayHeight: 75, circuits: '1_TO_2_CIRCUITS', systemSize: 'SMALL' },
    { crossSection: 70, minCables: 1, maxCables: 1, trayWidth: 100, trayHeight: 75, circuits: '1_CIRCUIT', systemSize: 'SMALL' },
    { crossSection: 95, minCables: 1, maxCables: 1, trayWidth: 100, trayHeight: 75, circuits: '1_CIRCUIT', systemSize: 'SMALL' },
    
    // 200mm+ TRAY SPECIFICATIONS (Standard/Large Systems)
    { crossSection: 6, minCables: 4, maxCables: 12, trayWidth: 200, trayHeight: 75, circuits: '4_TO_12_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 10, minCables: 4, maxCables: 10, trayWidth: 200, trayHeight: 75, circuits: '4_TO_10_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 16, minCables: 3, maxCables: 8, trayWidth: 200, trayHeight: 75, circuits: '3_TO_8_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 25, minCables: 3, maxCables: 6, trayWidth: 200, trayHeight: 75, circuits: '3_TO_6_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 35, minCables: 2, maxCables: 5, trayWidth: 200, trayHeight: 75, circuits: '2_TO_5_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 50, minCables: 2, maxCables: 4, trayWidth: 300, trayHeight: 75, circuits: '2_TO_4_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 70, minCables: 2, maxCables: 3, trayWidth: 300, trayHeight: 75, circuits: '2_TO_3_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 95, minCables: 1, maxCables: 3, trayWidth: 300, trayHeight: 100, circuits: '1_TO_3_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 120, minCables: 1, maxCables: 2, trayWidth: 400, trayHeight: 100, circuits: '1_TO_2_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 150, minCables: 1, maxCables: 2, trayWidth: 400, trayHeight: 100, circuits: '1_TO_2_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 185, minCables: 1, maxCables: 2, trayWidth: 500, trayHeight: 100, circuits: '1_TO_2_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 240, minCables: 1, maxCables: 1, trayWidth: 600, trayHeight: 125, circuits: '1_CIRCUIT', systemSize: 'STANDARD' },
    { crossSection: 300, minCables: 1, maxCables: 1, trayWidth: 600, trayHeight: 125, circuits: '1_CIRCUIT', systemSize: 'STANDARD' }
  ],

  // CABLE BUNDLING LIMITS IN TRAYS - 1-CORE TREFOIL FORMATION (3 cores = 1 circuit, INCLUDES 100mm TRAYS)
  cableBundling1CoreTray: [
    // 100mm TRAY SPECIFICATIONS (Small Systems 10-150kW)
    { crossSection: 6, minCores: 3, maxCores: 18, trayWidth: 100, trayHeight: 50, completeCircuits: '1_TO_6_CIRCUITS', systemSize: 'SMALL' },
    { crossSection: 10, minCores: 3, maxCores: 15, trayWidth: 100, trayHeight: 50, completeCircuits: '1_TO_5_CIRCUITS', systemSize: 'SMALL' },
    { crossSection: 16, minCores: 3, maxCores: 12, trayWidth: 100, trayHeight: 50, completeCircuits: '1_TO_4_CIRCUITS', systemSize: 'SMALL' },
    { crossSection: 25, minCores: 3, maxCores: 9, trayWidth: 100, trayHeight: 75, completeCircuits: '1_TO_3_CIRCUITS', systemSize: 'SMALL' },
    { crossSection: 35, minCores: 3, maxCores: 6, trayWidth: 100, trayHeight: 75, completeCircuits: '1_TO_2_CIRCUITS', systemSize: 'SMALL' },
    { crossSection: 50, minCores: 3, maxCores: 6, trayWidth: 100, trayHeight: 75, completeCircuits: '1_TO_2_CIRCUITS', systemSize: 'SMALL' },
    { crossSection: 70, minCores: 3, maxCores: 3, trayWidth: 100, trayHeight: 75, completeCircuits: '1_CIRCUIT', systemSize: 'SMALL' },
    { crossSection: 95, minCores: 3, maxCores: 3, trayWidth: 100, trayHeight: 75, completeCircuits: '1_CIRCUIT', systemSize: 'SMALL' },
    
    // 200mm+ TRAY SPECIFICATIONS (Standard/Large Systems)
    { crossSection: 6, minCores: 9, maxCores: 36, trayWidth: 200, trayHeight: 75, completeCircuits: '3_TO_12_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 10, minCores: 9, maxCores: 30, trayWidth: 200, trayHeight: 75, completeCircuits: '3_TO_10_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 16, minCores: 6, maxCores: 24, trayWidth: 200, trayHeight: 75, completeCircuits: '2_TO_8_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 25, minCores: 6, maxCores: 18, trayWidth: 200, trayHeight: 75, completeCircuits: '2_TO_6_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 35, minCores: 6, maxCores: 15, trayWidth: 200, trayHeight: 75, completeCircuits: '2_TO_5_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 50, minCores: 3, maxCores: 12, trayWidth: 300, trayHeight: 75, completeCircuits: '1_TO_4_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 70, minCores: 3, maxCores: 9, trayWidth: 300, trayHeight: 75, completeCircuits: '1_TO_3_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 95, minCores: 3, maxCores: 9, trayWidth: 300, trayHeight: 100, completeCircuits: '1_TO_3_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 120, minCores: 3, maxCores: 6, trayWidth: 400, trayHeight: 100, completeCircuits: '1_TO_2_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 150, minCores: 3, maxCores: 6, trayWidth: 400, trayHeight: 100, completeCircuits: '1_TO_2_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 185, minCores: 3, maxCores: 6, trayWidth: 500, trayHeight: 100, completeCircuits: '1_TO_2_CIRCUITS', systemSize: 'STANDARD' },
    { crossSection: 240, minCores: 3, maxCores: 3, trayWidth: 600, trayHeight: 125, completeCircuits: '1_CIRCUIT', systemSize: 'STANDARD' },
    { crossSection: 300, minCores: 3, maxCores: 3, trayWidth: 600, trayHeight: 125, completeCircuits: '1_CIRCUIT', systemSize: 'STANDARD' }
  ],

  // CABLE TIE SPACING STANDARDS BY CABLE TYPE
  cableTieSpacing: [
    { cableType: '4_CORE_6_TO_25', horizontal: 300, vertical: 400, support: 1500 },
    { cableType: '4_CORE_35_TO_70', horizontal: 250, vertical: 350, support: 1200 },
    { cableType: '4_CORE_95_TO_150', horizontal: 200, vertical: 300, support: 1000 },
    { cableType: '4_CORE_185_TO_300', horizontal: 150, vertical: 250, support: 800 },
    { cableType: '1_CORE_6_TO_25', horizontal: 400, vertical: 500, support: 2000 },
    { cableType: '1_CORE_35_TO_70', horizontal: 350, vertical: 450, support: 1500 },
    { cableType: '1_CORE_95_TO_150', horizontal: 300, vertical: 400, support: 1200 },
    { cableType: '1_CORE_185_TO_300', horizontal: 250, vertical: 350, support: 1000 }
  ],

  // CABLE TIE SPECIFICATIONS DATABASE
  cableTies: [
    { type: 'NYLON_66', material: 'POLYAMIDE', length: 100, width: 2.5, tensile: 220, tempRange: '-40_TO_85C', standard: 'UL_62275', application: 'STRING_INV_TO_PANEL_LIGHT' },
    { type: 'NYLON_66', material: 'POLYAMIDE', length: 150, width: 3.6, tensile: 400, tempRange: '-40_TO_85C', standard: 'UL_62275', application: 'STRING_INV_TO_PANEL_MEDIUM' },
    { type: 'UV_RESISTANT', material: 'PA66_UV', length: 150, width: 3.6, tensile: 380, tempRange: '-40_TO_85C', standard: 'UL_62275', application: 'LV_PANEL_TO_IDT_STANDARD' },
    { type: 'UV_RESISTANT', material: 'PA66_UV', length: 200, width: 4.8, tensile: 520, tempRange: '-40_TO_85C', standard: 'UL_62275', application: 'LV_PANEL_TO_IDT_HEAVY' },
    { type: 'UV_RESISTANT', material: 'PA66_UV', length: 200, width: 4.8, tensile: 520, tempRange: '-40_TO_85C', standard: 'UL_62275', application: 'CENTRAL_INV_TO_IDT' },
    { type: 'STAINLESS_STEEL', material: 'SS316', length: 200, width: 4.6, tensile: 1200, tempRange: '-80_TO_538C', standard: 'ASTM_A240', application: 'IDT_TO_PT_HEAVY_DUTY' },
    { type: 'STAINLESS_STEEL', material: 'SS316', length: 300, width: 7.9, tensile: 2250, tempRange: '-80_TO_538C', standard: 'ASTM_A240', application: 'PT_TO_POC_MAXIMUM_DUTY' }
  ],

  // TRAY TYPE SELECTION DATABASE
  trayTypes: [
    { segment: 'STRING_INV_TO_LV_PANEL', type: 'PERFORATED_TRAY', reason: 'LIGHT_CABLES_SHELTERED_LOCATION', load: 'LIGHT_TO_MEDIUM' },
    { segment: 'STRING_INV_TO_HV_PANEL', type: 'PERFORATED_TRAY', reason: 'LIGHT_CABLES_SHELTERED_LOCATION', load: 'LIGHT_TO_MEDIUM' },
    { segment: 'LV_PANEL_TO_IDT', type: 'LADDER_TRAY', reason: 'MEDIUM_CABLES_OUTDOOR_VENTILATION', load: 'MEDIUM_TO_HEAVY' },
    { segment: 'CENTRAL_INV_TO_IDT', type: 'LADDER_TRAY', reason: 'HEAVY_CABLES_OUTDOOR_CANOPY', load: 'HEAVY_DUTY' }
  ],

  // CABLE TRAY SPECIFICATIONS DATABASE (INCLUDES 100mm TRAYS FOR SMALL SYSTEMS)
  traySpecs: [
    // 100mm TRAY SPECIFICATIONS (Small Systems 10-150kW)
    { type: 'PERFORATED_TRAY', material: 'GALVANIZED_STEEL', width: 100, height: 50, thickness: 1.2, loadCapacity: 25, standard: 'IEC_61537', application: 'STRING_INV_TO_LV_PANEL_SMALL', systemSize: 'SMALL' },
    { type: 'PERFORATED_TRAY', material: 'GALVANIZED_STEEL', width: 100, height: 75, thickness: 1.6, loadCapacity: 30, standard: 'IEC_61537', application: 'STRING_INV_TO_HV_PANEL_SMALL', systemSize: 'SMALL' },
    { type: 'LADDER_TRAY', material: 'GALVANIZED_STEEL', width: 100, height: 50, thickness: 1.6, loadCapacity: 30, standard: 'IEC_61537', application: 'LV_PANEL_TO_IDT_SMALL', systemSize: 'SMALL' },
    { type: 'LADDER_TRAY', material: 'GALVANIZED_STEEL', width: 100, height: 75, thickness: 2, loadCapacity: 35, standard: 'IEC_61537', application: 'LV_PANEL_TO_IDT_MEDIUM', systemSize: 'SMALL' },
    { type: 'LADDER_TRAY', material: 'GALVANIZED_STEEL', width: 100, height: 75, thickness: 2, loadCapacity: 35, standard: 'IEC_61537', application: 'CENTRAL_INV_TO_IDT_SMALL', systemSize: 'SMALL' },
    { type: 'SOLID_BOTTOM_TRAY', material: 'GALVANIZED_STEEL', width: 100, height: 50, thickness: 1.6, loadCapacity: 28, standard: 'IEC_61537', application: 'WET_ENVIRONMENT_SMALL', systemSize: 'SMALL' },
    { type: 'SOLID_BOTTOM_TRAY', material: 'GALVANIZED_STEEL', width: 100, height: 75, thickness: 2, loadCapacity: 32, standard: 'IEC_61537', application: 'WET_ENVIRONMENT_MEDIUM', systemSize: 'SMALL' },
    
    // 200mm+ TRAY SPECIFICATIONS (Standard/Large Systems)
    { type: 'PERFORATED_TRAY', material: 'GALVANIZED_STEEL', width: 200, height: 75, thickness: 1.6, loadCapacity: 40, standard: 'IEC_61537', application: 'STRING_INV_TO_LV_PANEL', systemSize: 'STANDARD' },
    { type: 'PERFORATED_TRAY', material: 'GALVANIZED_STEEL', width: 300, height: 75, thickness: 1.6, loadCapacity: 60, standard: 'IEC_61537', application: 'STRING_INV_TO_PANEL_MEDIUM', systemSize: 'STANDARD' },
    { type: 'LADDER_TRAY', material: 'GALVANIZED_STEEL', width: 200, height: 75, thickness: 2, loadCapacity: 50, standard: 'IEC_61537', application: 'LV_PANEL_TO_IDT_LIGHT', systemSize: 'STANDARD' },
    { type: 'LADDER_TRAY', material: 'GALVANIZED_STEEL', width: 300, height: 75, thickness: 2, loadCapacity: 75, standard: 'IEC_61537', application: 'LV_PANEL_TO_IDT_MEDIUM', systemSize: 'STANDARD' },
    { type: 'LADDER_TRAY', material: 'GALVANIZED_STEEL', width: 400, height: 100, thickness: 2.5, loadCapacity: 100, standard: 'IEC_61537', application: 'LV_PANEL_TO_IDT_HEAVY', systemSize: 'STANDARD' },
    { type: 'LADDER_TRAY', material: 'GALVANIZED_STEEL', width: 500, height: 100, thickness: 2.5, loadCapacity: 125, standard: 'IEC_61537', application: 'CENTRAL_INV_TO_IDT_HEAVY', systemSize: 'STANDARD' },
    { type: 'LADDER_TRAY', material: 'GALVANIZED_STEEL', width: 600, height: 125, thickness: 3, loadCapacity: 150, standard: 'IEC_61537', application: 'IDT_TO_PT_MAXIMUM_LOAD', systemSize: 'STANDARD' }
  ],

  // SYSTEM ROUTING RULES & SIZE CLASSIFICATION
  routingRules: {
    LV: {
      STRING_INVERTER_TO_LV_COMBINER: 'TRAY',
      LV_COMBINER_TO_IDT: 'TRAY', 
      IDT_TO_POC: 'TRENCH'
    },
    HV_String: {
      STRING_INVERTER_TO_HV_COMBINER: 'TRAY',
      HV_COMBINER_TO_IDT: 'TRENCH',
      IDT_TO_PT: 'TRENCH',
      PT_TO_POC: 'TRENCH'
    },
    HV_Central: {
      CENTRAL_INVERTER_TO_IDT: 'TRAY',
      IDT_TO_PT: 'TRENCH', 
      PT_TO_POC: 'TRENCH'
    }
  },

  // SYSTEM SIZE CLASSIFICATION FOR 100mm TRAY SELECTION
  systemSizeRules: {
    SMALL: { minCapacity: 10, maxCapacity: 50, preferredTrayWidth: 100, description: 'RESIDENTIAL_COMMERCIAL_SMALL' },
    MEDIUM_SMALL: { minCapacity: 50, maxCapacity: 100, preferredTrayWidth: 100, description: 'COMMERCIAL_ROOFTOP' },
    MEDIUM: { minCapacity: 100, maxCapacity: 150, preferredTrayWidth: 100, description: 'SMALL_UTILITY_SCALE' },
    STANDARD: { minCapacity: 150, maxCapacity: 1000, preferredTrayWidth: 200, description: 'MEDIUM_TO_LARGE_SCALE' }
  },

  // TRAY WIDTH COST FACTORS
  trayCostOptimization: {
    width100mm: { costFactor: 0.6, savingsPercentage: 40 },
    width200mm: { costFactor: 1.0, savingsPercentage: 0 }
  },

  // SAFETY FACTORS & INDUSTRY STANDARDS
  safetyFactors: {
    trayInstallation: 1.15,
    trenchInstallation: 1.10,
    cableTies: 1.15,
    materialWastage: 1.10,
    ambientTemperature: 40, // Celsius
    minimumBendRadius: 12, // × cable diameter
    cableSpacingTray: 1.5, // × cable diameter
    cableSpacingTrench: 2.0, // × cable diameter
    deratingFactorBundled: 0.8
  },

  // Legacy compatibility fields
  cableLugs: [6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400],
  cableTrayWidths: [100, 150, 200, 300, 400, 500, 600, 800, 1000],
  cableTrayDepths: [50, 65, 75, 100],
  trayMaterials: [
    { material: 'Mild steel, powder coated', environment: 'inland', cost: 'low' },
    { material: 'Stainless steel 304', environment: 'moderate', cost: 'high' },
    { material: 'Stainless steel 316', environment: 'coastal/corrosive', cost: 'very high' },
    { material: 'Hot-dip galvanized', environment: 'outdoor', cost: 'medium' }
  ],
  combinerPanels: [
    { width: 600, height: 800, depth: 300, material: 'Powder-coated mild steel', ip: 'IP54', maxInputs: 6 },
    { width: 800, height: 800, depth: 300, material: 'Powder-coated mild steel', ip: 'IP54', maxInputs: 12 },
    { width: 1000, height: 800, depth: 350, material: 'Stainless steel 304', ip: 'IP65', maxInputs: 24 },
    { width: 1200, height: 1000, depth: 400, material: 'Stainless steel 316', ip: 'IP66', maxInputs: 40 }
  ],
  busbars: [25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400]
};

// Engineering parameters (defaults)
const AC_ENGINEERING_PARAMS = {
  sheathAreaMultiplier: 1.3,
  cableTrayFillFactor: 0.60,
  trayVerticalStackingLayers: 1,
  cableTieSpacing: 0.5, // meters
  extraTiesPerRun: 2,
  sparePercentage: 5,
  busbarSafetyFactor: 1.1,
  defaultTrayDepth: 75 // mm
};

// ==========================================
// COMPONENT
// ==========================================

interface ACBOQCalculatorProps {
  // System type
  connectionType: 'LV' | 'HV_String' | 'HV_Central';
  
  // AC system inputs (would come from parent component)
  acSystemInputs: ACSystemInputs;
  
  // Optional overrides
  engineeringParams?: Partial<typeof AC_ENGINEERING_PARAMS>;
  
  // Callback to expose calculated BOQ data to parent
  onBOQCalculated?: (items: Array<{
    description: string;
    specifications: string;
    unit: string;
    qty: number | string;
    category: string;
  }>) => void;
}

const ACBOQCalculator: React.FC<ACBOQCalculatorProps> = ({
  connectionType,
  acSystemInputs,
  engineeringParams = {},
  onBOQCalculated
}) => {
  const [copiedTable, setCopiedTable] = useState(false);

  // Merge engineering parameters
  const params = useMemo(() => ({ ...AC_ENGINEERING_PARAMS, ...engineeringParams }), [engineeringParams]);

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  // Comprehensive Cable Length Debugging Function - DISABLED TO FIX INFINITE LOOP
  const debugCableCalculation = useCallback((cableType: string, cableParams: {
    equipmentCount: number;
    distance: number;
    runsPerPhase: number;
    phases: number;
    cableSize: number;
    isActual: boolean;
    fallbackReason?: string;
  }) => {
    const { equipmentCount, distance, runsPerPhase, phases } = cableParams;
    const totalLength = equipmentCount * distance * runsPerPhase * phases;
    
    // Temporarily disable console logs to fix infinite loop
    // console.group(`🔌 ${cableType} Cable Calculation Debug`);
    // ... all console logs commented out
    
    return totalLength;
  }, []);

  const selectNextHigherStandard = useCallback((calculatedValue: number, standardList: number[]): { selected: number; calculated: number } => {
    const suitable = standardList.filter(std => std >= calculatedValue);
    return {
      selected: suitable.length > 0 ? suitable[0] : standardList[standardList.length - 1],
      calculated: calculatedValue
    };
  }, []);

  const calculateBundleParameters = useCallback((cableCrossSection: number, coreCount: number, cableCount: number) => {
    // Effective cable area calculation
    const effectiveCableArea = cableCrossSection * params.sheathAreaMultiplier * coreCount;
    const totalBundleArea = effectiveCableArea * cableCount;
    const equivalentDiameter = Math.sqrt(4 * totalBundleArea / Math.PI);
    const circumference = Math.PI * equivalentDiameter;
    
    return { effectiveCableArea, totalBundleArea, equivalentDiameter, circumference };
  }, [params.sheathAreaMultiplier]);

  const selectOptimalCableTie = useCallback((requiredLength: number, environment: 'indoor' | 'outdoor' | 'coastal' = 'outdoor') => {
    const suitableTies = AC_ENGINEERING_STANDARDS.cableTies.filter(tie => tie.length >= requiredLength);
    
    if (suitableTies.length === 0) {
      return AC_ENGINEERING_STANDARDS.cableTies[AC_ENGINEERING_STANDARDS.cableTies.length - 1];
    }

    // Selection based on environment
    if (environment === 'coastal') {
      return suitableTies.find(tie => tie.material.includes('SS316')) || suitableTies[0];
    } else if (environment === 'outdoor' && requiredLength > 300) {
      return suitableTies.find(tie => tie.material.includes('stainless')) || suitableTies[0];
    } else {
      return suitableTies[0];
    }
  }, []);

  // ==========================================
  // CIRCUIT BREAKER TYPE SELECTION LOGIC
  // ==========================================

  // Determine specific LV breaker type based on current rating (adjusted to match application usage)
  const selectLVBreakerType = useCallback((currentRating: number): { type: string; poles: string; breakingCapacity: string } => {
    if (currentRating <= 40) {
      return { 
        type: 'MCB', 
        poles: '4-pole', 
        breakingCapacity: '10kA' 
      };
    } else if (currentRating <= 630) {
      return { 
        type: 'MCCB', 
        poles: '4-pole', 
        breakingCapacity: '25kA' 
      };
    } else {
      return { 
        type: 'ACB', 
        poles: '4-pole', 
        breakingCapacity: '50kA' 
      };
    }
  }, []);

  // Determine specific MV/HV breaker type based on voltage and current rating
  const selectHVBreakerType = useCallback((voltageLevel: number, currentRating: number): { type: string; poles: string; breakingCapacity: string } => {
    if (voltageLevel >= 33000) {
      return { 
        type: 'SF6 CB', 
        poles: '3-pole', 
        breakingCapacity: '31.5kA' 
      };
    } else {
      return { 
        type: 'VCB', 
        poles: '3-pole', 
        breakingCapacity: '25kA' 
      };
    }
  }, []);

  // ==========================================
  // NEW: 100mm TRAY SIZE DETERMINATION FUNCTIONS
  // ==========================================

  // Determine system size classification based on total capacity
  const determineSystemSize = useCallback((totalCapacityKW: number): 'SMALL' | 'MEDIUM_SMALL' | 'MEDIUM' | 'STANDARD' => {
    const sizeRules = AC_ENGINEERING_STANDARDS.systemSizeRules;
    
    if (totalCapacityKW >= sizeRules.SMALL.minCapacity && totalCapacityKW < sizeRules.MEDIUM_SMALL.minCapacity) {
      return 'SMALL';
    } else if (totalCapacityKW >= sizeRules.MEDIUM_SMALL.minCapacity && totalCapacityKW < sizeRules.MEDIUM.minCapacity) {
      return 'MEDIUM_SMALL';
    } else if (totalCapacityKW >= sizeRules.MEDIUM.minCapacity && totalCapacityKW <= sizeRules.MEDIUM.maxCapacity) {
      return 'MEDIUM';
    } else {
      return 'STANDARD';
    }
  }, []);

  // Select appropriate tray width based on system size and cable requirements
  const selectTrayWidthBasedOnSystemSize = useCallback((
    systemCapacityKW: number,
    cableSpecs: { crossSection: number; cableType: '4_CORE' | '1_CORE' },
    connectionSegment: string
  ) => {
    const systemSize = determineSystemSize(systemCapacityKW);
    
    // For small to medium systems (10-150kW), try to use 100mm trays first
    if (systemSize === 'SMALL' || systemSize === 'MEDIUM_SMALL' || systemSize === 'MEDIUM') {
      
      if (connectionSegment.includes('STRING_INV_TO_LV_PANEL') || connectionSegment.includes('STRING_INV_TO_HV_PANEL')) {
        return {
          preferredWidth: 100,
          trayType: 'PERFORATED_TRAY',
          height: cableSpecs.crossSection <= 25 ? 50 : 75,
          systemSize: 'SMALL',
          reason: 'SMALL_SYSTEM_LIGHT_CABLES'
        };
      } else if (connectionSegment.includes('LV_PANEL_TO_IDT') || connectionSegment.includes('CENTRAL_INV_TO_IDT')) {
        return {
          preferredWidth: 100,
          trayType: 'LADDER_TRAY',
          height: cableSpecs.crossSection <= 25 ? 50 : 75,
          systemSize: 'SMALL',
          reason: 'SMALL_SYSTEM_OUTDOOR'
        };
      }
    }
    
    // For larger systems or if 100mm is not suitable, use standard widths
    return {
      preferredWidth: 200,
      trayType: connectionSegment.includes('STRING_INV') ? 'PERFORATED_TRAY' : 'LADDER_TRAY',
      height: 75,
      systemSize: 'STANDARD',
      reason: 'STANDARD_SYSTEM'
    };
  }, [determineSystemSize]);

  // Check if cable requirements can fit in 100mm tray
  const canFitIn100mmTray = useCallback((
    cableSpecs: { crossSection: number; cableType: '4_CORE' | '1_CORE' },
    requiredCables: number,
    requiredCores?: number
  ): boolean => {
    if (cableSpecs.cableType === '4_CORE') {
      const bundlingLimits = AC_ENGINEERING_STANDARDS.cableBundling4CoreTray.find(
        b => b.crossSection >= cableSpecs.crossSection && b.systemSize === 'SMALL'
      );
      return bundlingLimits ? (requiredCables <= bundlingLimits.maxCables) : false;
    } else {
      const bundlingLimits = AC_ENGINEERING_STANDARDS.cableBundling1CoreTray.find(
        b => b.crossSection >= cableSpecs.crossSection && b.systemSize === 'SMALL'
      );
      return bundlingLimits ? ((requiredCores || 0) <= bundlingLimits.maxCores) : false;
    }
  }, []);

  // ==========================================
  // TREFOIL FORMATION & MULTIPLE RUNS ALGORITHMS
  // ==========================================

  // UPDATED: Get cable bundling limits for 4-core cables in trefoil formation (INCLUDES 100mm LOGIC)
  const get4CoreBundlingLimits = useCallback((crossSection: number, systemSize: 'SMALL' | 'STANDARD' = 'STANDARD') => {
    // First try to find suitable 100mm tray for small systems
    if (systemSize === 'SMALL') {
      const smallBundling = AC_ENGINEERING_STANDARDS.cableBundling4CoreTray.find(
        b => b.crossSection >= crossSection && b.systemSize === 'SMALL'
      );
      if (smallBundling) return smallBundling;
    }
    
    // Fallback to standard trays
    const bundling = AC_ENGINEERING_STANDARDS.cableBundling4CoreTray.find(
      b => b.crossSection >= crossSection && (b.systemSize === 'STANDARD' || !b.systemSize)
    );
    return bundling || AC_ENGINEERING_STANDARDS.cableBundling4CoreTray[AC_ENGINEERING_STANDARDS.cableBundling4CoreTray.length - 1];
  }, []);

  // UPDATED: Get cable bundling limits for 1-core cables in trefoil formation (INCLUDES 100mm LOGIC)
  const get1CoreBundlingLimits = useCallback((crossSection: number, systemSize: 'SMALL' | 'STANDARD' = 'STANDARD') => {
    // First try to find suitable 100mm tray for small systems
    if (systemSize === 'SMALL') {
      const smallBundling = AC_ENGINEERING_STANDARDS.cableBundling1CoreTray.find(
        b => b.crossSection >= crossSection && b.systemSize === 'SMALL'
      );
      if (smallBundling) return smallBundling;
    }
    
    // Fallback to standard trays
    const bundling = AC_ENGINEERING_STANDARDS.cableBundling1CoreTray.find(
      b => b.crossSection >= crossSection && (b.systemSize === 'STANDARD' || !b.systemSize)
    );
    return bundling || AC_ENGINEERING_STANDARDS.cableBundling1CoreTray[AC_ENGINEERING_STANDARDS.cableBundling1CoreTray.length - 1];
  }, []);

  // UPDATED: Calculate 4-core multiple runs from single device (INCLUDES 100mm TRAY LOGIC)
  const calculate4CoreMultipleRuns = useCallback((
    cableCrossSection: number, 
    runsPerDevice: number, 
    distance: number, 
    systemCapacityKW: number = 200
  ) => {
    const systemSize = determineSystemSize(systemCapacityKW) === 'STANDARD' ? 'STANDARD' : 'SMALL';
    const bundlingLimits = get4CoreBundlingLimits(cableCrossSection, systemSize);
    const totalCables = runsPerDevice;
    
    // Calculate number of trays needed
    const traysRequired = Math.ceil(totalCables / bundlingLimits.maxCables);
    const cablesPerTray = Math.ceil(totalCables / traysRequired);
    
    return {
      totalCables,
      totalCircuits: totalCables, // Each 4-core cable = 1 complete circuit
      traysRequired,
      cablesPerTray,
      recommendedTrayWidth: bundlingLimits.trayWidth,
      recommendedTrayHeight: bundlingLimits.trayHeight,
      totalTrayLength: distance * traysRequired,
      trefoilFormation: 'INTERNAL_TREFOIL_4_CORE',
      systemSize: bundlingLimits.systemSize || systemSize,
      costOptimization: bundlingLimits.trayWidth === 100 ? '40% savings with 100mm tray' : 'Standard tray'
    };
  }, [get4CoreBundlingLimits, determineSystemSize]);

  // UPDATED: Calculate 1-core multiple runs from single device (INCLUDES 100mm TRAY LOGIC)
  const calculate1CoreMultipleRuns = useCallback((
    cableCrossSection: number, 
    circuitsPerDevice: number, 
    distance: number, 
    systemCapacityKW: number = 200
  ) => {
    const systemSize = determineSystemSize(systemCapacityKW) === 'STANDARD' ? 'STANDARD' : 'SMALL';
    const bundlingLimits = get1CoreBundlingLimits(cableCrossSection, systemSize);
    const totalCircuits = circuitsPerDevice;
    const totalCores = totalCircuits * 3; // 3 cores per trefoil circuit
    
    // Calculate number of trays needed
    const traysRequired = Math.ceil(totalCores / bundlingLimits.maxCores);
    const coresPerTray = Math.ceil(totalCores / traysRequired);
    
    // Ensure complete trefoil circuits in each tray (multiples of 3)
    const adjustedCoresPerTray = Math.floor(coresPerTray / 3) * 3;
    const trefoilCircuitsPerTray = adjustedCoresPerTray / 3;
    
    return {
      totalCircuits,
      totalCores,
      trefoilGroups: totalCircuits,
      traysRequired,
      coresPerTray: adjustedCoresPerTray,
      circuitsPerTray: trefoilCircuitsPerTray,
      recommendedTrayWidth: bundlingLimits.trayWidth,
      recommendedTrayHeight: bundlingLimits.trayHeight,
      totalTrayLength: distance * traysRequired,
      trefoilFormation: 'EXTERNAL_TREFOIL_3_CORE_GROUPS',
      systemSize: bundlingLimits.systemSize || systemSize,
      costOptimization: bundlingLimits.trayWidth === 100 ? '35% savings with 100mm tray' : 'Standard tray'
    };
  }, [get1CoreBundlingLimits, determineSystemSize]);

  // NEW: Determine routing method based on system type and connection segment
  const determineRoutingMethod = useCallback((systemType: string, segment: string) => {
    const rules = AC_ENGINEERING_STANDARDS.routingRules[systemType as keyof typeof AC_ENGINEERING_STANDARDS.routingRules];
    return rules?.[segment as keyof typeof rules] || 'TRENCH';
  }, []);

  // NEW: Get cable tie spacing for specific cable type
  const getCableTieSpacing = useCallback((crossSection: number, coreType: '4_CORE' | '1_CORE') => {
    let cableTypeCategory: string;
    
    if (coreType === '4_CORE') {
      if (crossSection <= 25) cableTypeCategory = '4_CORE_6_TO_25';
      else if (crossSection <= 70) cableTypeCategory = '4_CORE_35_TO_70';
      else if (crossSection <= 150) cableTypeCategory = '4_CORE_95_TO_150';
      else cableTypeCategory = '4_CORE_185_TO_300';
    } else {
      if (crossSection <= 25) cableTypeCategory = '1_CORE_6_TO_25';
      else if (crossSection <= 70) cableTypeCategory = '1_CORE_35_TO_70';
      else if (crossSection <= 150) cableTypeCategory = '1_CORE_95_TO_150';
      else cableTypeCategory = '1_CORE_185_TO_300';
    }
    
    const spacing = AC_ENGINEERING_STANDARDS.cableTieSpacing.find(s => s.cableType === cableTypeCategory);
    return spacing || AC_ENGINEERING_STANDARDS.cableTieSpacing[0];
  }, []);

  // NEW: Calculate cable ties for trefoil formation
  const calculateCableTiesTrefoil = useCallback((bundleResults: { totalCircuits?: number; totalCables?: number; trefoilFormation?: string }, segment: { crossSection: number; cableType: '4_CORE' | '1_CORE'; distance: number; destination: string }, routingMethod: string) => {
    const spacing = getCableTieSpacing(segment.crossSection, segment.cableType);
    const safetyFactor = routingMethod === 'TRAY' ? 
      AC_ENGINEERING_STANDARDS.safetyFactors.trayInstallation : 
      AC_ENGINEERING_STANDARDS.safetyFactors.trenchInstallation;
    
    let tiesPerRun: number;
    if (routingMethod === 'TRAY') {
      // For tray installations
      tiesPerRun = Math.ceil((1000 / spacing.horizontal) + (1000 / spacing.support));
    } else {
      // For trench installations
      tiesPerRun = Math.ceil(segment.distance / (spacing.vertical / 1000));
    }
    
    const totalRuns = bundleResults.totalCircuits || bundleResults.totalCables || 1;
    const totalTies = Math.ceil(tiesPerRun * segment.distance * totalRuns * safetyFactor);
    
    // Select appropriate tie type based on segment
    let tieApplication: string;
    if (segment.destination === 'LV_PANEL' || segment.destination === 'HV_PANEL') {
      tieApplication = segment.crossSection <= 35 ? 'STRING_INV_TO_PANEL_LIGHT' : 'STRING_INV_TO_PANEL_MEDIUM';
    } else if (segment.destination === 'IDT') {
      tieApplication = 'LV_PANEL_TO_IDT_HEAVY';
    } else {
      tieApplication = 'PT_TO_POC_MAXIMUM_DUTY';
    }
    
    const selectedTie = AC_ENGINEERING_STANDARDS.cableTies.find(tie => tie.application === tieApplication) || 
                       AC_ENGINEERING_STANDARDS.cableTies[0];
    
    return {
      totalTies,
      tieSpecification: `${selectedTie.length}mm ${selectedTie.material}`,
      tieType: selectedTie.type,
      routingMethod,
      trefoilFormation: bundleResults.trefoilFormation
    };
  }, [getCableTieSpacing]);

  // NEW: Calculate tray length based on distance rules
  const calculateTrayAndTrenchLengths = useCallback((totalDistance: number) => {
    if (totalDistance <= 30) {
      // Short distance: Use trays for entire route
      return {
        trayLength: totalDistance,
        trenchLength: 0,
        description: "Full tray route"
      };
    } else {
      // Long distance: 15m trays (7-8m each side for vertical rise/fall) + rest trench
      return {
        trayLength: 15,
        trenchLength: totalDistance - 15,
        description: "Tray for vertical sections (15m) + underground trench for horizontal run"
      };
    }
  }, []);

  // CALCULATE MINIMUM TRENCH DIMENSIONS BASED ON VOLTAGE AND CABLES
  const calculateTrenchDimensions = useCallback((voltageLevel: 'LV' | 'MV' | 'HV', totalCores: number, cableCrossSection: number) => {
    const trenchRules = {
      LV: { minDepth: 600, minWidth: 400, sandBedding: 100 },
      MV: { minDepth: 900, minWidth: 500, sandBedding: 150 },
      HV: { minDepth: 1200, minWidth: 600, sandBedding: 200 }
    };

    const baseRule = trenchRules[voltageLevel];
    
    // Adjust width based on number of cable cores and cross-section
    let adjustedWidth = baseRule.minWidth;
    
    // For multiple cores, increase width proportionally
    if (totalCores > 3) {
      adjustedWidth = Math.max(baseRule.minWidth, baseRule.minWidth + Math.floor(totalCores / 6) * 100);
    }
    
    // For larger cable cross-sections, increase width
    if (cableCrossSection > 150) {
      adjustedWidth += 100;
    } else if (cableCrossSection > 95) {
      adjustedWidth += 50;
    }

    return {
      depth: baseRule.minDepth,
      width: adjustedWidth,
      sandBedding: baseRule.sandBedding,
      specifications: `${adjustedWidth}mm(W) × ${baseRule.minDepth}mm(D) with ${baseRule.sandBedding}mm sand bedding`
    };
  }, []);

  // DETERMINE MAXIMUM TRENCH DIMENSIONS FOR MULTIPLE TRENCHES
  const getMaxTrenchDimensions = useCallback((trenchSpecs: Array<{depth: number, width: number, sandBedding: number, specifications: string}>) => {
    if (trenchSpecs.length === 0) return trenchSpecs[0] || { depth: 600, width: 400, sandBedding: 100, specifications: "400mm(W) × 600mm(D) with 100mm sand bedding" };
    
    const maxDepth = Math.max(...trenchSpecs.map(t => t.depth));
    const maxWidth = Math.max(...trenchSpecs.map(t => t.width));
    const maxSandBedding = Math.max(...trenchSpecs.map(t => t.sandBedding));
    
    return {
      depth: maxDepth,
      width: maxWidth,
      sandBedding: maxSandBedding,
      specifications: `${maxWidth}mm(W) × ${maxDepth}mm(D) with ${maxSandBedding}mm sand bedding`
    };
  }, []);

  const selectCableTray = useCallback((totalArea: number, trayLength: number, numberOfRuns: number) => {
    // UPDATED: Include number of runs in area calculation
    const totalCableArea = totalArea * numberOfRuns;
    const requiredArea = totalCableArea / params.cableTrayFillFactor;
    const requiredWidth = requiredArea / (params.defaultTrayDepth * trayLength);
    
    const trayWidth = selectNextHigherStandard(requiredWidth, AC_ENGINEERING_STANDARDS.cableTrayWidths);
    const trayMaterial = AC_ENGINEERING_STANDARDS.trayMaterials[0]; // Default to mild steel powder coated
    
    return {
      width: trayWidth.selected,
      calculatedWidth: trayWidth.calculated,
      depth: params.defaultTrayDepth,
      material: trayMaterial.material,
      totalCableArea,
      numberOfRuns
    };
  }, [params.cableTrayFillFactor, params.defaultTrayDepth, selectNextHigherStandard]);

  const selectCombinerPanel = useCallback((inputCount: number, incomerRating: number) => {
    const suitablePanels = AC_ENGINEERING_STANDARDS.combinerPanels.filter(panel => 
      panel.maxInputs >= inputCount
    );
    
    return suitablePanels.length > 0 ? suitablePanels[0] : AC_ENGINEERING_STANDARDS.combinerPanels[AC_ENGINEERING_STANDARDS.combinerPanels.length - 1];
  }, []);

  // ==========================================
  // MAIN CALCULATION FUNCTION
  // ==========================================

  const calculateACBOQ = useCallback((): ACBOQItem[] => {
    const items: ACBOQItem[] = [];

    if (connectionType === 'LV') {
      // ==========================================
      // LV CONNECTION TYPE - TREFOIL FORMATION
      // ==========================================

      const {
        qtyOfInverters = 1,
        distanceInverterToCombiner = 50,
        acCableCrossSectionInverterToCombiner = 16,
        runsPerPhaseInverterToCombiner = 1,
        distanceCombinerToPoC = 100,
        acCableCrossSectionCombinerToPoC = 35,
        runsPerPhaseCombinerToPoC = 1,
        combinerIncomerBreakerRating = 200,
        qtyInputsPerLVCombiner = 6,
        totalLVCombinerPanels = 2
      } = acSystemInputs;

      // Calculate total system capacity for 100mm tray optimization
      const totalSystemCapacityKW = (acSystemInputs.inverterCapacity || 50) * qtyOfInverters;

      // TREFOIL FORMATION ANALYSIS - Multiple 4-core runs from inverters (INCLUDES 100mm TRAY LOGIC)
      const inverterMultipleRuns = calculate4CoreMultipleRuns(
        acCableCrossSectionInverterToCombiner,
        runsPerPhaseInverterToCombiner,
        distanceInverterToCombiner,
        totalSystemCapacityKW
      );

      // TREFOIL FORMATION ANALYSIS - Multiple 4-core runs from combiners (INCLUDES 100mm TRAY LOGIC)
      const combinerMultipleRuns = calculate4CoreMultipleRuns(
        acCableCrossSectionCombinerToPoC,
        runsPerPhaseCombinerToPoC,
        distanceCombinerToPoC,
        totalSystemCapacityKW
      );

      // Debug system inputs - DISABLED TO FIX INFINITE LOOP
      // console.group(`🏗️ LV CONNECTION SYSTEM - INPUT VALIDATION`);
      // console.log(`📊 System Inputs:`, acSystemInputs);
      // console.log(`✅ qtyOfInverters:`, qtyOfInverters);
      // console.log(`✅ totalLVCombinerPanels:`, totalLVCombinerPanels);
      // console.groupEnd();

      // 1. STRING INVERTERS
      const inverterCapacity = acSystemInputs.inverterCapacity || 50; // kW
      items.push({
        description: "String Inverter",
        specifications: `Solar PV inverter ${inverterCapacity}kW, grid-tied with MPPT, IP65 rated`,
        unit: "pcs",
        qty: qtyOfInverters,
        category: "Inverters & Protection"
      });

      // 2. INVERTER TO LV COMBINER BREAKER - USE ACTUAL SELECTED RATING WITH SPECIFIC TYPE
      const inverterCombinerBreakerRating = acSystemInputs.combinerIncomerBreakerRating || Math.ceil((acSystemInputs.inverterOutputCurrent || 100) * 1.25); // Use actual selected, fallback to calculated
      const inverterCombinerBreakerSpec = selectLVBreakerType(inverterCombinerBreakerRating);
      items.push({
        description: "Circuit Breaker (Inverter to LV Combiner)",
        specifications: `${inverterCombinerBreakerSpec.type} ${inverterCombinerBreakerRating}A, ${inverterCombinerBreakerSpec.poles}, ${inverterCombinerBreakerSpec.breakingCapacity} breaking capacity`,
        unit: "pcs",
        qty: qtyOfInverters,
        category: "Inverters & Protection"
      });

      // 3. LV COMBINER TO POC BREAKER - WITH SPECIFIC TYPE
      const combinerPoCBreakerRating = acSystemInputs.combinerOutgoingBreakerRating || 250;
      const combinerPoCBreakerSpec = selectLVBreakerType(combinerPoCBreakerRating);
      items.push({
        description: "Circuit Breaker (LV Combiner to PoC)",
        specifications: `${combinerPoCBreakerSpec.type} ${combinerPoCBreakerRating}A, ${combinerPoCBreakerSpec.poles}, ${combinerPoCBreakerSpec.breakingCapacity} breaking capacity`,
        unit: "pcs", 
        qty: totalLVCombinerPanels,
        category: "Inverters & Protection"
      });

      // 4. AC Phase Cables (Inverter to Combiner) - TREFOIL FORMATION
      const inverterTotalLength = qtyOfInverters * inverterMultipleRuns.totalTrayLength;
      
      items.push({
        description: "AC Phase Cable (Inverter to Combiner)",
        specifications: `4-core XLPE Al ${acCableCrossSectionInverterToCombiner}mm² (${qtyOfInverters} inverters × ${runsPerPhaseInverterToCombiner} runs each = ${inverterMultipleRuns.totalCircuits} circuits)`,
        unit: "m",
        qty: Math.ceil(inverterTotalLength),
        category: "AC Cables"
      });

      // 5. AC Phase Cables (Combiner to PoC) - TREFOIL FORMATION
      const combinerTotalLength = totalLVCombinerPanels * combinerMultipleRuns.totalTrayLength;
      
      items.push({
        description: "AC Phase Cable (Combiner to PoC)",
        specifications: `4-core XLPE Al ${acCableCrossSectionCombinerToPoC}mm² (${totalLVCombinerPanels} combiners × ${runsPerPhaseCombinerToPoC} runs each = ${combinerMultipleRuns.totalCircuits} circuits)`,
        unit: "m",
        qty: Math.ceil(combinerTotalLength),
        category: "AC Cables"
      });

      // 3. Cable Lugs (Inverter to Combiner)
      const inverterCombinerConductors = 4; // 4-core cable
      const inverterCombinerLugsPerRun = inverterCombinerConductors * 2; // Both ends
      const totalCableRunsInverterToCombiner = qtyOfInverters * runsPerPhaseInverterToCombiner;
      const totalInverterCombinerLugs = Math.ceil(totalCableRunsInverterToCombiner * inverterCombinerLugsPerRun * (1 + params.sparePercentage / 100));
      const inverterCombinerLugSize = selectNextHigherStandard(acCableCrossSectionInverterToCombiner, AC_ENGINEERING_STANDARDS.cableLugs);
      
      // console.log(`🔌 Inverter-Combiner Lugs: ${totalCableRunsInverterToCombiner} runs × ${inverterCombinerLugsPerRun} lugs/run = ${totalInverterCombinerLugs} total lugs`);
      
      items.push({
        description: "Cable Lugs (Inverter to Combiner)",
        specifications: `${inverterCombinerLugSize.selected}mm² lug${inverterCombinerLugSize.selected > inverterCombinerLugSize.calculated ? ` (calculated ${inverterCombinerLugSize.calculated}mm²)` : ''}`,
        unit: "pcs",
        qty: totalInverterCombinerLugs,
        category: "Cable Termination"
      });

      // 4. Cable Lugs (Combiner to PoC)
      const combinerPoCConductors = 4;
      const combinerPoCLugsPerRun = combinerPoCConductors * 2;
      const totalCableRunsCombinerToPoC = totalLVCombinerPanels * runsPerPhaseCombinerToPoC;
      const totalCombinerPoCLugs = Math.ceil(totalCableRunsCombinerToPoC * combinerPoCLugsPerRun * (1 + params.sparePercentage / 100));
      const combinerPoCLugSize = selectNextHigherStandard(acCableCrossSectionCombinerToPoC, AC_ENGINEERING_STANDARDS.cableLugs);
      
      // console.log(`🔌 Combiner-PoC Lugs: ${totalCableRunsCombinerToPoC} runs × ${combinerPoCLugsPerRun} lugs/run = ${totalCombinerPoCLugs} total lugs`);
      
      items.push({
        description: "Cable Lugs (Combiner to PoC)",
        specifications: `${combinerPoCLugSize.selected}mm² lug${combinerPoCLugSize.selected > combinerPoCLugSize.calculated ? ` (calculated ${combinerPoCLugSize.calculated}mm²)` : ''}`,
        unit: "pcs",
        qty: totalCombinerPoCLugs,
        category: "Cable Termination"
      });

      // 5. Cable Ties (Inverter to Combiner)
      const inverterCombinerBundle = calculateBundleParameters(acCableCrossSectionInverterToCombiner, 4, 1);
      const requiredInverterTieLength = inverterCombinerBundle.circumference + 20;
      const selectedInverterTie = selectOptimalCableTie(requiredInverterTieLength);
      const tiesPerInverterRun = Math.ceil(distanceInverterToCombiner / params.cableTieSpacing) + params.extraTiesPerRun;
      const totalInverterTies = Math.ceil(totalCableRunsInverterToCombiner * tiesPerInverterRun * (1 + params.sparePercentage / 100));
      
      items.push({
        description: "Cable Ties (Inverter to Combiner)",
        specifications: `${selectedInverterTie.length}mm ${selectedInverterTie.material}${selectedInverterTie.width ? ` ${selectedInverterTie.width}mm width` : ''}`,
        unit: "pcs",
        qty: totalInverterTies,
        category: "Cable Management"
      });

      // 6. Cable Ties (Combiner to PoC)
      const combinerPoCBundle = calculateBundleParameters(acCableCrossSectionCombinerToPoC, 4, 1);
      const requiredCombinerTieLength = combinerPoCBundle.circumference + 20;
      const selectedCombinerTie = selectOptimalCableTie(requiredCombinerTieLength);
      const tiesPerCombinerRun = Math.ceil(distanceCombinerToPoC / params.cableTieSpacing) + params.extraTiesPerRun;
      const totalCombinerTies = Math.ceil(totalCableRunsCombinerToPoC * tiesPerCombinerRun * (1 + params.sparePercentage / 100));
      
      items.push({
        description: "Cable Ties (Combiner to PoC)",
        specifications: `${selectedCombinerTie.length}mm ${selectedCombinerTie.material}${selectedCombinerTie.width ? ` ${selectedCombinerTie.width}mm width` : ''}`,
        unit: "pcs",
        qty: totalCombinerTies,
        category: "Cable Management"
      });

      // 7. Cable Trays (Inverter to Combiner) - TREFOIL FORMATION + 5% CONTINGENCY
      const inverterRouteLengths = calculateTrayAndTrenchLengths(distanceInverterToCombiner);
      
      if (inverterRouteLengths.trayLength > 0) {
        const totalInverterTrays = qtyOfInverters * inverterMultipleRuns.traysRequired;
        const baseTrayLength = inverterRouteLengths.trayLength * totalInverterTrays;
        const trayLengthWith5PercentContingency = Math.ceil(baseTrayLength * 1.05); // 5% contingency rounded up
        
        items.push({
          description: "Cable Tray (Inverter to Combiner)",
          specifications: `${determineRoutingMethod('LV', 'STRING_INVERTER_TO_LV_COMBINER')} type, ${inverterMultipleRuns.recommendedTrayWidth}mm × ${inverterMultipleRuns.recommendedTrayHeight}mm, galvanized steel - ${inverterMultipleRuns.cablesPerTray} cables/tray max, ${inverterMultipleRuns.trefoilFormation} (5% extra length added)`,
          unit: "m",
          qty: trayLengthWith5PercentContingency,
          category: "Cable Support"
        });
      }

      // 7a. Underground Trench (Inverter to Combiner) - TREFOIL FORMATION
      if (inverterRouteLengths.trenchLength > 0) {
        const inverterTrenchDims = calculateTrenchDimensions('LV', inverterMultipleRuns.totalCircuits * 4, acCableCrossSectionInverterToCombiner);
        items.push({
          description: "Trench Excavation (Inverter to Combiner)",
          specifications: `Underground trench ${inverterTrenchDims.specifications} for ${inverterMultipleRuns.totalCircuits} circuits of 4-core XLPE cables, including warning tape and bedding sand`,
          unit: "m",
          qty: Math.ceil(inverterRouteLengths.trenchLength * qtyOfInverters),
          category: "Cable Support"
        });
      }

      // 8. Cable Trays (Combiner to PoC) - TREFOIL FORMATION + 5% CONTINGENCY
      const combinerRouteLengths = calculateTrayAndTrenchLengths(distanceCombinerToPoC);
      
      if (combinerRouteLengths.trayLength > 0) {
        const totalCombinerTrays = totalLVCombinerPanels * combinerMultipleRuns.traysRequired;
        const baseCombinerTrayLength = combinerRouteLengths.trayLength * totalCombinerTrays;
        const combinerTrayLengthWith5PercentContingency = Math.ceil(baseCombinerTrayLength * 1.05); // 5% contingency rounded up
        
        items.push({
          description: "Cable Tray (Combiner to PoC)",
          specifications: `${determineRoutingMethod('LV', 'LV_COMBINER_TO_IDT')} type, ${combinerMultipleRuns.recommendedTrayWidth}mm × ${combinerMultipleRuns.recommendedTrayHeight}mm, galvanized steel - ${combinerMultipleRuns.cablesPerTray} cables/tray max, ${combinerMultipleRuns.trefoilFormation} (5% extra length added)`,
          unit: "m",
          qty: combinerTrayLengthWith5PercentContingency,
          category: "Cable Support"
        });
      }

      // 8a. Underground Trench (Combiner to PoC) - TREFOIL FORMATION
      if (combinerRouteLengths.trenchLength > 0) {
        const combinerTrenchDims = calculateTrenchDimensions('LV', combinerMultipleRuns.totalCircuits * 4, acCableCrossSectionCombinerToPoC);
        items.push({
          description: "Trench Excavation (Combiner to PoC)",
          specifications: `Underground trench ${combinerTrenchDims.specifications} for ${combinerMultipleRuns.totalCircuits} circuits of 4-core XLPE cables, including warning tape and bedding sand`,
          unit: "m",
          qty: Math.ceil(combinerRouteLengths.trenchLength),
          category: "Cable Support"
        });
      }

      // 9. AC Combiner Panels
      const selectedPanel = selectCombinerPanel(qtyInputsPerLVCombiner, combinerIncomerBreakerRating);
      
      items.push({
        description: "AC Combiner Panel (LV)",
        specifications: `${selectedPanel.width} x ${selectedPanel.height} x ${selectedPanel.depth}mm, ${selectedPanel.material}, ${selectedPanel.ip}, ${selectedPanel.maxInputs} inputs max`,
        unit: "pcs",
        qty: totalLVCombinerPanels,
        category: "Distribution Panels"
      });

      // 10. Busbars for Combiner Panels
      const busbarCurrent = combinerIncomerBreakerRating * params.busbarSafetyFactor;
      const busbarSize = selectNextHigherStandard(busbarCurrent / 10, AC_ENGINEERING_STANDARDS.busbars); // Rough mapping: 10A per mm²
      
      items.push({
        description: "Busbar (AC Combiner Panel)",
        specifications: `${busbarSize.selected}mm² copper busbar${busbarSize.selected > busbarSize.calculated ? ` (calculated ${busbarSize.calculated.toFixed(1)}mm²)` : ''}`,
        unit: "pcs",
        qty: totalLVCombinerPanels,
        category: "Distribution Components"
      });

    } else if (connectionType === 'HV_String') {
      // ==========================================
      // HV STRING INVERTER TYPE - TREFOIL FORMATION
      // ==========================================

      const {
        numberOfStringInverters = 10,
        invertersPerLVCombiner = 5,
        totalLVCombinerPanels = 2,
        qtyOfIDTs = 1,
        distanceInverterToCombiner = 30,
        acCableCrossSectionInverterToCombiner = 16,
        runsPerPhaseInverterToCombiner = 1,
        distanceLVCombinerToIDT = 50,
        cableSizeLVCombinerToIDT = 95,
        runsPerPhaseLVCombinerToIDT = 1,
        distanceIDTToPT = 25,
        cableSizeIDTToPT = 185,
        runsPerPhaseIDTToPT = 4,
        distancePTToPoC = 100,
        cableSizePTToPoC = 240,
        runsPerPhasePTToPoC = 4,
        combinerIncomerBreakerRating = 200,
        qtyInputsPerLVCombiner = 5
      } = acSystemInputs;

      // Calculate total system capacity for 100mm tray optimization
      const totalSystemCapacityKW = (acSystemInputs.inverterCapacity || 50) * numberOfStringInverters;
      const determinedSystemSize = determineSystemSize(totalSystemCapacityKW);
      


      // TREFOIL FORMATION ANALYSIS - Multiple 4-core runs from string inverters to LV combiner (INCLUDES 100mm TRAY LOGIC)
      const inverterMultipleRuns = calculate4CoreMultipleRuns(
        acCableCrossSectionInverterToCombiner,
        runsPerPhaseInverterToCombiner,
        distanceInverterToCombiner,
        totalSystemCapacityKW
      );

      // TREFOIL FORMATION ANALYSIS - Multiple 4-core runs from LV combiner to IDT (INCLUDES 100mm TRAY LOGIC)
      const combinerToIDTMultipleRuns = calculate4CoreMultipleRuns(
        cableSizeLVCombinerToIDT,
        runsPerPhaseLVCombinerToIDT,
        distanceLVCombinerToIDT,
        totalSystemCapacityKW
      );

      // TREFOIL FORMATION ANALYSIS - Multiple 1-core MV circuits from IDT to PT (INCLUDES 100mm TRAY LOGIC)
      const idtToPTMultipleRuns = calculate1CoreMultipleRuns(
        cableSizeIDTToPT,
        runsPerPhaseIDTToPT, // This represents number of 3-phase circuits
        distanceIDTToPT,
        totalSystemCapacityKW
      );

      // TREFOIL FORMATION ANALYSIS - Multiple 1-core MV circuits from PT to PoC (INCLUDES 100mm TRAY LOGIC)
      const ptToPoCMultipleRuns = calculate1CoreMultipleRuns(
        cableSizePTToPoC,
        runsPerPhasePTToPoC, // This represents number of 3-phase circuits
        distancePTToPoC,
        totalSystemCapacityKW
      );

      // Debug system inputs - DISABLED TO FIX INFINITE LOOP
      // console.group(`🏗️ HV STRING INVERTER SYSTEM - INPUT VALIDATION`);
      // console.log(`📊 System Inputs:`, acSystemInputs);
      // console.log(`✅ numberOfStringInverters:`, numberOfStringInverters);
      // console.log(`✅ totalLVCombinerPanels:`, totalLVCombinerPanels);
      // console.log(`✅ qtyOfIDTs:`, qtyOfIDTs);
      // console.groupEnd();

      // Check if Power Transformer is available
      const isPTAvailable = (acSystemInputs.qtyOfPTs || 0) > 0 || (acSystemInputs.ptInputVoltage && acSystemInputs.ptInputVoltage > 0);

      // 1. STRING INVERTERS
      const hvStringInverterCapacity = acSystemInputs.inverterCapacity || 50; // kW
      items.push({
        description: "String Inverter",
        specifications: `Solar PV inverter ${hvStringInverterCapacity}kW, grid-tied with MPPT, IP65 rated`,
        unit: "pcs",
        qty: numberOfStringInverters,
        category: "Inverters & Protection"
      });

      // 2. ISOLATION DISTRIBUTION TRANSFORMERS (IDTs)
      const idtCapacityMVA = acSystemInputs.idtPowerRatingMVA || 1.0;
      const idtPrimaryVoltage = (acSystemInputs.idtInputVoltage || 415) / 1000; // Convert to kV
      const idtSecondaryVoltage = (acSystemInputs.idtOutputVoltage || 11000) / 1000; // Convert to kV  
      const lvPanelsPerIDT = acSystemInputs.combinerPanelsPerIDT || Math.ceil((acSystemInputs.totalLVCombinerPanels || 2) / (qtyOfIDTs || 1));
      
      items.push({
        description: "Inverter Duty Transformer (IDT)",
        specifications: `${idtCapacityMVA}MVA, ${idtPrimaryVoltage}/${idtSecondaryVoltage}kV, oil-filled, ONAN cooling, ${lvPanelsPerIDT} LV panels per IDT`,
        unit: "pcs",
        qty: qtyOfIDTs,
        category: "Transformers"
      });

      // 3. POWER TRANSFORMER (if available)
      if (isPTAvailable) {
        const ptCapacityMVA = acSystemInputs.ptPowerRatingMVA || 2.0;
        const ptPrimaryVoltage = (acSystemInputs.ptInputVoltage || 11000) / 1000; // Convert to kV
        const ptSecondaryVoltage = (acSystemInputs.ptOutputVoltage || 33000) / 1000; // Convert to kV
        const ptVectorGroup = acSystemInputs.ptVectorGrouping || 'Dyn11';
        
        items.push({
          description: "Power Transformer (PT)",
          specifications: `${ptCapacityMVA}MVA, ${ptPrimaryVoltage}/${ptSecondaryVoltage}kV, ${ptVectorGroup} vector grouping, oil-filled, ONAN cooling`,
          unit: "pcs",
          qty: acSystemInputs.qtyOfPTs || 1,
          category: "Transformers"
        });
      }

      // 4. INVERTER TO LV COMBINER BREAKER - USE ACTUAL SELECTED RATING WITH SPECIFIC TYPE
      const hvInverterCombinerBreakerRating = acSystemInputs.combinerIncomerBreakerRating || Math.ceil((acSystemInputs.inverterOutputCurrent || 100) * 1.25); // Use actual selected, fallback to calculated
      const hvInverterCombinerBreakerSpec = selectLVBreakerType(hvInverterCombinerBreakerRating);
      items.push({
        description: "Circuit Breaker (Inverter to LV Combiner)",
        specifications: `${hvInverterCombinerBreakerSpec.type} ${hvInverterCombinerBreakerRating}A, ${hvInverterCombinerBreakerSpec.poles}, ${hvInverterCombinerBreakerSpec.breakingCapacity} breaking capacity`,
        unit: "pcs",
        qty: numberOfStringInverters,
        category: "Inverters & Protection"
      });

      // 3. LV COMBINER TO IDT BREAKER - USE ACTUAL DESIGNED RATING
      const combinerIDTBreakerRating = acSystemInputs.combinerToIDTBreakerRating || combinerIncomerBreakerRating || 200;
      const combinerIDTBreakerSpec = selectLVBreakerType(combinerIDTBreakerRating);
      
      // Debug breaker quantities - one-time log
      if (typeof window !== 'undefined' && 
          !(window as { __BREAKER_QTY_DEBUG__?: boolean }).__BREAKER_QTY_DEBUG__) {
        (window as { __BREAKER_QTY_DEBUG__?: boolean }).__BREAKER_QTY_DEBUG__ = true;
        console.log('🎯 BREAKER QUANTITIES DEBUG:');
        console.log('totalLVCombinerPanels from acSystemInputs:', totalLVCombinerPanels);
        console.log('qtyOfIDTs from acSystemInputs:', qtyOfIDTs);
        console.log('acSystemInputs object:', {
          totalLVCombinerPanels: acSystemInputs.totalLVCombinerPanels,
          qtyOfIDTs: acSystemInputs.qtyOfIDTs,
          qtyOfPTs: acSystemInputs.qtyOfPTs
        });
      }
      
      items.push({
        description: "Circuit Breaker (LV Combiner to IDT)",
        specifications: `${combinerIDTBreakerSpec.type} ${combinerIDTBreakerRating}A, ${combinerIDTBreakerSpec.poles}, ${combinerIDTBreakerSpec.breakingCapacity} breaking capacity`,
        unit: "pcs",
        qty: acSystemInputs.totalLVCombinerPanels || totalLVCombinerPanels,
        category: "Inverters & Protection"
      });

      // 4. CONDITIONAL BREAKERS BASED ON PT AVAILABILITY - USE ACTUAL DESIGNED RATINGS
      if (isPTAvailable) {
        // IDT to PT breaker - USE ACTUAL DESIGNED RATING
        const idtPTBreakerRating = acSystemInputs.idtToPTBreakerRating || Math.ceil((acSystemInputs.idtOutputCurrent || 30) * 1.25); // Use actual designed, fallback to calculated
        const idtVoltageLevel = acSystemInputs.idtOutputVoltage || 11000;
        const idtPTBreakerSpec = selectHVBreakerType(idtVoltageLevel, idtPTBreakerRating);
        items.push({
          description: "Circuit Breaker (IDT to PT)",
          specifications: `${idtPTBreakerSpec.type} ${idtPTBreakerRating}A, ${idtPTBreakerSpec.poles}, MV class, ${idtVoltageLevel}V rated`,
          unit: "pcs",
          qty: acSystemInputs.qtyOfIDTs || qtyOfIDTs,
          category: "Inverters & Protection"
        });

        // PT to PoC breaker - USE ACTUAL DESIGNED RATING AND TYPE
        const ptPoCBreakerRating = acSystemInputs.ptToPoCBreakerRating || Math.ceil((acSystemInputs.ptOutputCurrent || 10) * 1.25); // Use actual designed, fallback to calculated
        const ptVoltageLevel = acSystemInputs.ptOutputVoltage || 33000;
        
        // Use actual selected breaker type if available, otherwise fall back to engineering rules
        const actualBreakerType = acSystemInputs.ptToPoCBreakerType;
        const ptPoCBreakerSpec = actualBreakerType ? 
          { type: actualBreakerType, poles: '3-pole' } : 
          selectHVBreakerType(ptVoltageLevel, ptPoCBreakerRating);
        
        items.push({
          description: "Circuit Breaker (PT to PoC)",
          specifications: `${ptPoCBreakerSpec.type} ${ptPoCBreakerRating}A, ${ptPoCBreakerSpec.poles}, HV class, ${ptVoltageLevel}V rated`,
          unit: "pcs",
          qty: (acSystemInputs.qtyOfPTs || 1), // Use actual PT count
          category: "Inverters & Protection"
        });
      } else {
        // IDT to PoC breaker (when PT is not available)
        const idtPoCBreakerRating = acSystemInputs.idtToPTBreakerRating || Math.ceil((acSystemInputs.idtOutputCurrent || 30) * 1.25); // Use IDT to PT breaker rating for direct connection
        const idtVoltageLevel = acSystemInputs.idtOutputVoltage || 11000;
        const idtPoCBreakerSpec = selectHVBreakerType(idtVoltageLevel, idtPoCBreakerRating);
        items.push({
          description: "Circuit Breaker (IDT to PoC)",
          specifications: `${idtPoCBreakerSpec.type} ${idtPoCBreakerRating}A, ${idtPoCBreakerSpec.poles}, MV class, ${idtVoltageLevel}V rated`,
          unit: "pcs",
          qty: acSystemInputs.qtyOfIDTs || qtyOfIDTs,
          category: "Inverters & Protection"
        });
      }

      // 5. AC Phase Cables (Inverter to LV Combiner) - TREFOIL FORMATION
      const inverterTotalLength = numberOfStringInverters * inverterMultipleRuns.totalTrayLength;
      
      items.push({
        description: "AC Phase Cable (Inverter to LV Combiner)",
        specifications: `4-core XLPE Al ${acCableCrossSectionInverterToCombiner}mm² (${numberOfStringInverters} inverters × ${runsPerPhaseInverterToCombiner} runs each = ${inverterMultipleRuns.totalCircuits} circuits)`,
        unit: "m",
        qty: Math.ceil(inverterTotalLength),
        category: "AC Cables"
      });

      // 6. AC Phase Cables (LV Combiner to IDT) - TREFOIL FORMATION
      const combinerToIDTTotalLength = (acSystemInputs.totalLVCombinerPanels || totalLVCombinerPanels) * combinerToIDTMultipleRuns.totalTrayLength;
      
      items.push({
        description: "AC Phase Cable (LV Combiner to IDT)",
        specifications: `4-core XLPE Al ${cableSizeLVCombinerToIDT}mm² (${acSystemInputs.totalLVCombinerPanels || totalLVCombinerPanels} combiners × ${runsPerPhaseLVCombinerToIDT} runs each = ${combinerToIDTMultipleRuns.totalCircuits} circuits)`,
        unit: "m",
        qty: Math.ceil(combinerToIDTTotalLength),
        category: "AC Cables"
      });

      // 3. MV Single-Core Cables (IDT to PT) - TREFOIL FORMATION
      const idtToPTTotalLength = (acSystemInputs.qtyOfIDTs || qtyOfIDTs) * idtToPTMultipleRuns.totalCores * distanceIDTToPT;
      
      items.push({
        description: "MV Single-Core Cable (IDT to PT)",
        specifications: `Single-core XLPE Al ${cableSizeIDTToPT}mm² (${idtToPTMultipleRuns.totalCircuits} circuits × 3 phases = ${idtToPTMultipleRuns.totalCores} cores total)`,
        unit: "m",
        qty: Math.ceil(idtToPTTotalLength),
        category: "MV Cables"
      });

      // 4. MV Single-Core Cables (PT to PoC) - TREFOIL FORMATION
      const ptToPoCTotalLength = 1 * ptToPoCMultipleRuns.totalCores * distancePTToPoC; // Usually 1 PT per system
      
      items.push({
        description: "MV Single-Core Cable (PT to PoC)",
        specifications: `Single-core XLPE Al ${cableSizePTToPoC}mm² (${ptToPoCMultipleRuns.totalCircuits} circuits × 3 phases = ${ptToPoCMultipleRuns.totalCores} cores total)`,
        unit: "m",
        qty: Math.ceil(ptToPoCTotalLength),
        category: "MV Cables"
      });

      // 5. Cable Lugs (Inverter to LV Combiner)
      const inverterCombinerConductors = 4;
      const inverterCombinerLugsPerRun = inverterCombinerConductors * 2;
      const totalCableRunsInverterToCombiner = numberOfStringInverters * runsPerPhaseInverterToCombiner;
      const totalInverterCombinerLugs = Math.ceil(totalCableRunsInverterToCombiner * inverterCombinerLugsPerRun * (1 + params.sparePercentage / 100));
      const inverterCombinerLugSize = selectNextHigherStandard(acCableCrossSectionInverterToCombiner, AC_ENGINEERING_STANDARDS.cableLugs);
      
      // console.log(`🔌 HV String Inverter-Combiner Lugs: ${totalCableRunsInverterToCombiner} runs × ${inverterCombinerLugsPerRun} lugs/run = ${totalInverterCombinerLugs} total lugs`);
      
      items.push({
        description: "Cable Lugs (Inverter to LV Combiner)",
        specifications: `${inverterCombinerLugSize.selected}mm² lug${inverterCombinerLugSize.selected > inverterCombinerLugSize.calculated ? ` (calculated ${inverterCombinerLugSize.calculated}mm²)` : ''}`,
        unit: "pcs",
        qty: totalInverterCombinerLugs,
        category: "Cable Termination"
      });

      // 6. Cable Lugs (LV Combiner to IDT)
      const combinerIDTConductors = 4;
      const combinerIDTLugsPerRun = combinerIDTConductors * 2;
      const totalCableRunsCombinerToIDT = (acSystemInputs.totalLVCombinerPanels || totalLVCombinerPanels) * runsPerPhaseLVCombinerToIDT;
      const totalCombinerIDTLugs = Math.ceil(totalCableRunsCombinerToIDT * combinerIDTLugsPerRun * (1 + params.sparePercentage / 100));
      const combinerIDTLugSize = selectNextHigherStandard(cableSizeLVCombinerToIDT, AC_ENGINEERING_STANDARDS.cableLugs);
      
      // console.log(`🔌 HV String Combiner-IDT Lugs: ${totalCableRunsCombinerToIDT} runs × ${combinerIDTLugsPerRun} lugs/run = ${totalCombinerIDTLugs} total lugs`);
      
      items.push({
        description: "Cable Lugs (LV Combiner to IDT)",
        specifications: `${combinerIDTLugSize.selected}mm² lug${combinerIDTLugSize.selected > combinerIDTLugSize.calculated ? ` (calculated ${combinerIDTLugSize.calculated}mm²)` : ''}`,
        unit: "pcs",
        qty: totalCombinerIDTLugs,
        category: "Cable Termination"
      });

      // 7. MV Cable Lugs (IDT to PT)
      const idtToPTConductors = 3; // Three-phase MV single-core
      const totalMVCableRunsIDTToPT = qtyOfIDTs * runsPerPhaseIDTToPT * idtToPTConductors;
      const lugsPerMVConductor = 2; // Both ends
      const idtPTMVLugs = Math.ceil(totalMVCableRunsIDTToPT * lugsPerMVConductor * (1 + params.sparePercentage / 100));
      const idtPTMVLugSize = selectNextHigherStandard(cableSizeIDTToPT, AC_ENGINEERING_STANDARDS.cableLugs);
      
      // console.log(`🔌 HV String IDT-PT MV Lugs: ${totalMVCableRunsIDTToPT} MV conductors × ${lugsPerMVConductor} lugs/conductor = ${idtPTMVLugs} total lugs`);
      
      items.push({
        description: "MV Cable Lugs (IDT to PT)",
        specifications: `${idtPTMVLugSize.selected}mm² compression lug${idtPTMVLugSize.selected > idtPTMVLugSize.calculated ? ` (calculated ${idtPTMVLugSize.calculated}mm²)` : ''}`,
        unit: "pcs",
        qty: idtPTMVLugs,
        category: "MV Termination"
      });

      // 8. MV Cable Lugs (PT to PoC)
      const ptToPoCConductors = 3; // Three-phase MV single-core
      const totalMVCableRunsPTToPoC = 1 * runsPerPhasePTToPoC * ptToPoCConductors; // Usually 1 PT
      const ptPoCMVLugs = Math.ceil(totalMVCableRunsPTToPoC * lugsPerMVConductor * (1 + params.sparePercentage / 100));
      const ptPoCMVLugSize = selectNextHigherStandard(cableSizePTToPoC, AC_ENGINEERING_STANDARDS.cableLugs);
      
      // console.log(`🔌 HV String PT-PoC MV Lugs: ${totalMVCableRunsPTToPoC} MV conductors × ${lugsPerMVConductor} lugs/conductor = ${ptPoCMVLugs} total lugs`);
      
      items.push({
        description: "MV Cable Lugs (PT to PoC)",
        specifications: `${ptPoCMVLugSize.selected}mm² compression lug${ptPoCMVLugSize.selected > ptPoCMVLugSize.calculated ? ` (calculated ${ptPoCMVLugSize.calculated}mm²)` : ''}`,
        unit: "pcs",
        qty: ptPoCMVLugs,
        category: "MV Termination"
      });

      // 9. Cable Ties (Inverter to LV Combiner)
      const inverterCombinerBundle = calculateBundleParameters(acCableCrossSectionInverterToCombiner, 4, 1);
      const requiredInverterTieLength = inverterCombinerBundle.circumference + 20;
      const selectedInverterTie = selectOptimalCableTie(requiredInverterTieLength);
      const tiesPerInverterRun = Math.ceil(distanceInverterToCombiner / params.cableTieSpacing) + params.extraTiesPerRun;
      const totalInverterTies = Math.ceil(totalCableRunsInverterToCombiner * tiesPerInverterRun * (1 + params.sparePercentage / 100));
      
      items.push({
        description: "Cable Ties (Inverter to LV Combiner)",
        specifications: `${selectedInverterTie.length}mm ${selectedInverterTie.material}${selectedInverterTie.width ? ` ${selectedInverterTie.width}mm width` : ''}`,
        unit: "pcs",
        qty: totalInverterTies,
        category: "Cable Management"
      });

      // 10. Cable Ties (LV Combiner to IDT)
      const combinerIDTBundle = calculateBundleParameters(cableSizeLVCombinerToIDT, 4, 1);
      const requiredCombinerTieLength = combinerIDTBundle.circumference + 20;
      const selectedCombinerTie = selectOptimalCableTie(requiredCombinerTieLength);
      const tiesPerCombinerRun = Math.ceil(distanceLVCombinerToIDT / params.cableTieSpacing) + params.extraTiesPerRun;
      const totalCombinerTies = Math.ceil(totalCableRunsCombinerToIDT * tiesPerCombinerRun * (1 + params.sparePercentage / 100));
      
      items.push({
        description: "Cable Ties (LV Combiner to IDT)",
        specifications: `${selectedCombinerTie.length}mm ${selectedCombinerTie.material}${selectedCombinerTie.width ? ` ${selectedCombinerTie.width}mm width` : ''}`,
        unit: "pcs",
        qty: totalCombinerTies,
        category: "Cable Management"
      });

      // 11. Heavy-Duty Cable Ties/Bands (MV Cables)
      const mvBundle = calculateBundleParameters(cableSizeIDTToPT, 1, 3); // 3 single-core cables
      const requiredMVTieLength = mvBundle.circumference + 30; // Extra margin for MV
      const selectedMVTie = selectOptimalCableTie(requiredMVTieLength, 'outdoor');
      const mvTiesIDTToPT = Math.ceil((distanceIDTToPT / params.cableTieSpacing + params.extraTiesPerRun) * (acSystemInputs.qtyOfIDTs || qtyOfIDTs) * (1 + params.sparePercentage / 100));
      const mvTiesPTToPoC = Math.ceil((distancePTToPoC / params.cableTieSpacing + params.extraTiesPerRun) * 1 * (1 + params.sparePercentage / 100));
      
      items.push({
        description: "Heavy-Duty Cable Ties (MV Cables)",
        specifications: `${selectedMVTie.length}mm ${selectedMVTie.material}${selectedMVTie.width ? ` ${selectedMVTie.width}mm width` : ''} - for MV cable bundling`,
        unit: "pcs",
        qty: mvTiesIDTToPT + mvTiesPTToPoC,
        category: "MV Cable Management"
      });

      // 12. Cable Trays (Inverter to LV Combiner only) - TREFOIL FORMATION + 5% CONTINGENCY
      const inverterRouteLengths = calculateTrayAndTrenchLengths(distanceInverterToCombiner);
      
      if (inverterRouteLengths.trayLength > 0) {
        const totalInverterTrays = numberOfStringInverters * inverterMultipleRuns.traysRequired;
        const baseHVStringTrayLength = inverterRouteLengths.trayLength * totalInverterTrays; // Total tray length for all inverters
        const hvStringTrayLengthWith5PercentContingency = Math.ceil(baseHVStringTrayLength * 1.05); // 5% contingency rounded up

        
        items.push({
          description: "Cable Tray (Inverter to LV Combiner)",
          specifications: `${determineRoutingMethod('HV_String', 'STRING_INVERTER_TO_HV_COMBINER')} type, ${inverterMultipleRuns.recommendedTrayWidth}mm × ${inverterMultipleRuns.recommendedTrayHeight}mm, galvanized steel - ${inverterMultipleRuns.cablesPerTray} cables/tray max, ${inverterMultipleRuns.trefoilFormation} (5% extra length added)`,
          unit: "m",
          qty: hvStringTrayLengthWith5PercentContingency,
          category: "Cable Support"
        });
      }

      // 12a. Underground Trench (Inverter to LV Combiner) - WITH DIMENSIONS
      if (inverterRouteLengths.trenchLength > 0) {
        const inverterTrenchDims = calculateTrenchDimensions('LV', inverterMultipleRuns.totalCircuits * 4, acCableCrossSectionInverterToCombiner);
        items.push({
          description: "Trench Excavation (Inverter to LV Combiner)",
          specifications: `Underground trench ${inverterTrenchDims.specifications} for ${inverterMultipleRuns.totalCircuits} circuits of 4-core XLPE cables, including warning tape and bedding sand`,
          unit: "m",
          qty: Math.ceil(inverterRouteLengths.trenchLength * numberOfStringInverters / invertersPerLVCombiner),
          category: "Cable Support"
        });
      }

      // 12b. Underground Trench (LV Combiner to IDT) - WITH DIMENSIONS
      const combinerToIDTTrenchDims = calculateTrenchDimensions('LV', combinerToIDTMultipleRuns.totalCircuits * 4, cableSizeLVCombinerToIDT);
      items.push({
        description: "Trench Excavation (LV Combiner to IDT)",
        specifications: `Underground trench ${combinerToIDTTrenchDims.specifications} for ${combinerToIDTMultipleRuns.totalCircuits} circuits of 4-core XLPE cables, including warning tape and bedding sand`,
        unit: "m",
        qty: Math.ceil(distanceLVCombinerToIDT),
        category: "Cable Support"
      });

      // 12c. Underground Trench (MV Cables) - WITH MAXIMUM DIMENSIONS
      const totalMVTrenchLength = (distanceIDTToPT * (acSystemInputs.qtyOfIDTs || qtyOfIDTs)) + (distancePTToPoC * 1);
      const idtToPTTrenchDims = calculateTrenchDimensions('MV', idtToPTMultipleRuns.totalCores, cableSizeIDTToPT);
      const ptToPoCTrenchDims = calculateTrenchDimensions('MV', ptToPoCMultipleRuns.totalCores, cableSizePTToPoC);
      const maxMVTrenchDims = getMaxTrenchDimensions([idtToPTTrenchDims, ptToPoCTrenchDims]);
      
      items.push({
        description: "Trench Excavation (MV Cables - IDT to PT & PT to PoC)",
        specifications: `Underground trench ${maxMVTrenchDims.specifications} for ${idtToPTMultipleRuns.totalCircuits + ptToPoCMultipleRuns.totalCircuits} circuits (${idtToPTMultipleRuns.totalCores + ptToPoCMultipleRuns.totalCores} single-core cables), including warning tape, bedding sand, and cable protection tiles`,
        unit: "m",
        qty: Math.ceil(totalMVTrenchLength),
        category: "MV Installation"
      });

      // 13. AC LV Combiner Panels
      const selectedPanel = selectCombinerPanel(qtyInputsPerLVCombiner, combinerIncomerBreakerRating);
      
      items.push({
        description: "AC LV Combiner Panel",
        specifications: `${selectedPanel.width} x ${selectedPanel.height} x ${selectedPanel.depth}mm, ${selectedPanel.material}, ${selectedPanel.ip}, ${selectedPanel.maxInputs} inputs max`,
        unit: "pcs",
        qty: acSystemInputs.totalLVCombinerPanels || totalLVCombinerPanels,
        category: "Distribution Panels"
      });

      // 14. Busbars for LV Combiner Panels
      const busbarCurrent = combinerIncomerBreakerRating * params.busbarSafetyFactor;
      const busbarSize = selectNextHigherStandard(busbarCurrent / 10, AC_ENGINEERING_STANDARDS.busbars); // Rough mapping
      
      items.push({
        description: "Busbar (LV Combiner Panel)",
        specifications: `${busbarSize.selected}mm² copper busbar${busbarSize.selected > busbarSize.calculated ? ` (calculated ${busbarSize.calculated.toFixed(1)}mm²)` : ''}`,
        unit: "pcs",
        qty: acSystemInputs.totalLVCombinerPanels || totalLVCombinerPanels,
        category: "Distribution Components"
      });

    } else if (connectionType === 'HV_Central') {
      // ==========================================
      // HV CENTRAL INVERTER TYPE - TREFOIL FORMATION
      // ==========================================

      const {
        numberOfCentralInverters = 2,
        qtyOfIDTs = acSystemInputs.qtyOfIDTs || 1, // Use actual IDT count from system inputs
        qtyOfPTs = acSystemInputs.qtyOfPTs || 1, // Use actual PT count from system inputs
        distanceInverterToIDT = 20,
        cableSizeInverterToIDT = 120,
        runsPerPhaseInverterToIDT = 7,
        distanceIDTToPT = 30,
        cableSizeIDTToPT = 185,
        runsPerPhaseIDTToPT = 4,
        distancePTToPoC = 150,
        cableSizePTToPoC = 300,
        runsPerPhasePTToPoC = 4
      } = acSystemInputs;

      // Calculate total system capacity for 100mm tray optimization
      const totalSystemCapacityKW = (acSystemInputs.inverterCapacity || 1000) * numberOfCentralInverters;

      // TREFOIL FORMATION ANALYSIS - Multiple 4-core runs from central inverters to IDT (INCLUDES 100mm TRAY LOGIC)
      const inverterToIDTMultipleRuns = calculate4CoreMultipleRuns(
        cableSizeInverterToIDT,
        runsPerPhaseInverterToIDT,
        distanceInverterToIDT,
        totalSystemCapacityKW
      );

      // TREFOIL FORMATION ANALYSIS - Multiple 1-core MV circuits from IDT to PT (INCLUDES 100mm TRAY LOGIC)
      const idtToPTMultipleRuns = calculate1CoreMultipleRuns(
        cableSizeIDTToPT,
        runsPerPhaseIDTToPT, // This represents number of 3-phase circuits
        distanceIDTToPT,
        totalSystemCapacityKW
      );

      // TREFOIL FORMATION ANALYSIS - Multiple 1-core MV circuits from PT to PoC (INCLUDES 100mm TRAY LOGIC)
      const ptToPoCMultipleRuns = calculate1CoreMultipleRuns(
        cableSizePTToPoC,
        runsPerPhasePTToPoC, // This represents number of 3-phase circuits
        distancePTToPoC,
        totalSystemCapacityKW
      );

      // Debug system inputs - DISABLED TO FIX INFINITE LOOP
      // console.group(`🏗️ HV CENTRAL INVERTER SYSTEM - INPUT VALIDATION`);
      // console.log(`📊 System Inputs:`, acSystemInputs);
      // console.log(`✅ numberOfCentralInverters:`, numberOfCentralInverters);
      // console.log(`✅ qtyOfIDTs:`, qtyOfIDTs);
      // console.log(`✅ qtyOfPTs:`, qtyOfPTs);
      // console.groupEnd();

      // Check if Power Transformer is available
      const isPTAvailableCentral = (qtyOfPTs || 0) > 0 || (acSystemInputs.ptInputVoltage && acSystemInputs.ptInputVoltage > 0);

      // 1. CENTRAL INVERTERS
      const centralInverterCapacity = acSystemInputs.inverterCapacity || 500; // kW (Central inverters are typically larger)
      items.push({
        description: "Central Inverter", 
        specifications: `Solar PV central inverter ${centralInverterCapacity}kW, grid-tied with MPPT, outdoor enclosure`,
        unit: "pcs",
        qty: numberOfCentralInverters,
        category: "Inverters & Protection"
      });

      // 2. INVERTER DUTY TRANSFORMERS (IDTs) 
      const centralIDTCapacityMVA = acSystemInputs.idtPowerRatingMVA || 2.0; // Central systems typically larger
      const centralIDTPrimaryVoltage = (acSystemInputs.idtInputVoltage || 415) / 1000; // Convert to kV
      const centralIDTSecondaryVoltage = (acSystemInputs.idtOutputVoltage || 11000) / 1000; // Convert to kV
      const centralInvertersPerIDT = Math.ceil(numberOfCentralInverters / qtyOfIDTs); // Calculate central inverters per IDT
      items.push({
        description: "Inverter Duty Transformer (IDT)",
        specifications: `${centralIDTCapacityMVA}MVA, ${centralIDTPrimaryVoltage}/${centralIDTSecondaryVoltage}kV, oil-filled, ONAN cooling, ${centralInvertersPerIDT} central inverters per IDT`,
        unit: "pcs",
        qty: qtyOfIDTs,
        category: "Transformers"
      });

      // 3. POWER TRANSFORMER (if available)
      if (isPTAvailableCentral) {
        const centralPTCapacityMVA = acSystemInputs.ptPowerRatingMVA || 3.0; // Central systems typically larger
        const centralPTPrimaryVoltage = (acSystemInputs.ptInputVoltage || 11000) / 1000; // Convert to kV
        const centralPTSecondaryVoltage = (acSystemInputs.ptOutputVoltage || 33000) / 1000; // Convert to kV
        const centralPTVectorGroup = acSystemInputs.ptVectorGrouping || 'Dyn11';
        items.push({
          description: "Power Transformer (PT)",
          specifications: `${centralPTCapacityMVA}MVA, ${centralPTPrimaryVoltage}/${centralPTSecondaryVoltage}kV, ${centralPTVectorGroup} vector grouping, oil-filled, ONAN cooling`,
          unit: "pcs",
          qty: acSystemInputs.qtyOfPTs || 1,
          category: "Transformers"
        });
      }

      // 4. CENTRAL INVERTER TO IDT BREAKER - USE ACTUAL SELECTED RATING WITH SPECIFIC TYPE
      const centralInverterIDTBreakerRating = acSystemInputs.combinerIncomerBreakerRating || Math.ceil((acSystemInputs.inverterOutputCurrent || 1000) * 1.25); // Use actual selected, fallback to calculated
      const centralInverterIDTBreakerSpec = selectLVBreakerType(centralInverterIDTBreakerRating);
      items.push({
        description: "Circuit Breaker (Central Inverter to IDT)",
        specifications: `${centralInverterIDTBreakerSpec.type} ${centralInverterIDTBreakerRating}A, ${centralInverterIDTBreakerSpec.poles}, ${centralInverterIDTBreakerSpec.breakingCapacity} breaking capacity`,
        unit: "pcs",
        qty: numberOfCentralInverters,
        category: "Inverters & Protection"
      });

      // 3. CONDITIONAL BREAKERS BASED ON PT AVAILABILITY - WITH SPECIFIC HV BREAKER TYPES
      if (isPTAvailableCentral) {
        // IDT to PT breaker
        const idtPTBreakerRatingCentral = Math.ceil((acSystemInputs.idtOutputCurrent || 30) * 1.25); // 25% safety margin
        const idtVoltageLevelCentral = acSystemInputs.idtOutputVoltage || 11000;
        const idtPTBreakerSpecCentral = selectHVBreakerType(idtVoltageLevelCentral, idtPTBreakerRatingCentral);
        items.push({
          description: "Circuit Breaker (IDT to PT)",
          specifications: `${idtPTBreakerSpecCentral.type} ${idtPTBreakerRatingCentral}A, ${idtPTBreakerSpecCentral.poles}, MV class, ${idtVoltageLevelCentral}V rated`,
          unit: "pcs",
          qty: qtyOfIDTs,
          category: "Inverters & Protection"
        });

        // PT to PoC breaker - USE ACTUAL DESIGNED TYPE
        const ptPoCBreakerRatingCentral = Math.ceil((acSystemInputs.ptOutputCurrent || 10) * 1.25); // 25% safety margin
        const ptVoltageLevelCentral = acSystemInputs.ptOutputVoltage || 33000;
        
        // Use actual selected breaker type if available, otherwise fall back to engineering rules
        const actualBreakerTypeCentral = acSystemInputs.ptToPoCBreakerType;
        const ptPoCBreakerSpecCentral = actualBreakerTypeCentral ? 
          { type: actualBreakerTypeCentral, poles: '3-pole' } : 
          selectHVBreakerType(ptVoltageLevelCentral, ptPoCBreakerRatingCentral);
        
        items.push({
          description: "Circuit Breaker (PT to PoC)",
          specifications: `${ptPoCBreakerSpecCentral.type} ${ptPoCBreakerRatingCentral}A, ${ptPoCBreakerSpecCentral.poles}, HV class, ${ptVoltageLevelCentral}V rated`,
          unit: "pcs",
          qty: acSystemInputs.qtyOfPTs || 1,
          category: "Inverters & Protection"
        });
      } else {
        // IDT to PoC breaker (when PT is not available)
        const idtPoCBreakerRatingCentral = Math.ceil((acSystemInputs.idtOutputCurrent || 30) * 1.25); // 25% safety margin
        const idtVoltageLevelCentral = acSystemInputs.idtOutputVoltage || 11000;
        const idtPoCBreakerSpecCentral = selectHVBreakerType(idtVoltageLevelCentral, idtPoCBreakerRatingCentral);
        items.push({
          description: "Circuit Breaker (IDT to PoC)",
          specifications: `${idtPoCBreakerSpecCentral.type} ${idtPoCBreakerRatingCentral}A, ${idtPoCBreakerSpecCentral.poles}, MV class, ${idtVoltageLevelCentral}V rated`,
          unit: "pcs",
          qty: qtyOfIDTs,
          category: "Inverters & Protection"
        });
      }

      // 4. AC Phase Cables (Central Inverter to IDT) - TREFOIL FORMATION
      const inverterToIDTTotalLength = numberOfCentralInverters * inverterToIDTMultipleRuns.totalTrayLength;
      
      items.push({
        description: "AC Phase Cable (Central Inverter to IDT)",
        specifications: `4-core XLPE Al ${cableSizeInverterToIDT}mm² (${numberOfCentralInverters} central inverters × ${runsPerPhaseInverterToIDT} runs each = ${inverterToIDTMultipleRuns.totalCircuits} circuits)`,
        unit: "m",
        qty: Math.ceil(inverterToIDTTotalLength),
        category: "AC Cables"
      });

      // 5. MV Single-Core Cables (IDT to PT) - TREFOIL FORMATION
      const idtToPTTotalLength = qtyOfIDTs * idtToPTMultipleRuns.totalCores * distanceIDTToPT;
      
      items.push({
        description: "MV Single-Core Cable (IDT to PT)",
        specifications: `Single-core XLPE Al ${cableSizeIDTToPT}mm² (${idtToPTMultipleRuns.totalCircuits} circuits × 3 phases = ${idtToPTMultipleRuns.totalCores} cores total)`,
        unit: "m",
        qty: Math.ceil(idtToPTTotalLength),
        category: "MV Cables"
      });

      // 6. MV Single-Core Cables (PT to PoC) - TREFOIL FORMATION
      const ptToPoCTotalLength = qtyOfPTs * ptToPoCMultipleRuns.totalCores * distancePTToPoC;
      
      items.push({
        description: "MV Single-Core Cable (PT to PoC)",
        specifications: `Single-core XLPE Al ${cableSizePTToPoC}mm² (${ptToPoCMultipleRuns.totalCircuits} circuits × 3 phases = ${ptToPoCMultipleRuns.totalCores} cores total)`,
        unit: "m",
        qty: Math.ceil(ptToPoCTotalLength),
        category: "MV Cables"
      });

      // 4. Cable Lugs (Central Inverter to IDT)
      const inverterIDTConductors = 4; // 4-core cable from inverter
      const inverterIDTLugsPerRun = inverterIDTConductors * 2;
      const totalCableRunsInverterToIDT = numberOfCentralInverters * runsPerPhaseInverterToIDT;
      const totalInverterIDTLugs = Math.ceil(totalCableRunsInverterToIDT * inverterIDTLugsPerRun * (1 + params.sparePercentage / 100));
      const inverterIDTLugSize = selectNextHigherStandard(cableSizeInverterToIDT, AC_ENGINEERING_STANDARDS.cableLugs);
      
      // console.log(`🔌 HV Central Inverter-IDT Lugs: ${totalCableRunsInverterToIDT} runs × ${inverterIDTLugsPerRun} lugs/run = ${totalInverterIDTLugs} total lugs`);
      
      items.push({
        description: "Cable Lugs (Central Inverter to IDT)",
        specifications: `${inverterIDTLugSize.selected}mm² lug${inverterIDTLugSize.selected > inverterIDTLugSize.calculated ? ` (calculated ${inverterIDTLugSize.calculated}mm²)` : ''}`,
        unit: "pcs",
        qty: totalInverterIDTLugs,
        category: "Cable Termination"
      });

      // 5. MV Cable Lugs (IDT to PT)
      const idtToPTConductors = 3; // Three-phase MV single-core
      const totalMVCableRunsIDTToPT = qtyOfIDTs * runsPerPhaseIDTToPT * idtToPTConductors;
      const lugsPerMVConductor = 2; // Both ends
      const idtPTMVLugs = Math.ceil(totalMVCableRunsIDTToPT * lugsPerMVConductor * (1 + params.sparePercentage / 100));
      const idtPTMVLugSize = selectNextHigherStandard(cableSizeIDTToPT, AC_ENGINEERING_STANDARDS.cableLugs);
      
      // console.log(`🔌 HV Central IDT-PT MV Lugs: ${totalMVCableRunsIDTToPT} MV conductors × ${lugsPerMVConductor} lugs/conductor = ${idtPTMVLugs} total lugs`);
      
      items.push({
        description: "MV Cable Lugs (IDT to PT)",
        specifications: `${idtPTMVLugSize.selected}mm² compression lug${idtPTMVLugSize.selected > idtPTMVLugSize.calculated ? ` (calculated ${idtPTMVLugSize.calculated}mm²)` : ''}`,
        unit: "pcs",
        qty: idtPTMVLugs,
        category: "MV Termination"
      });

      // 6. MV Cable Lugs (PT to PoC)
      const ptToPoCConductors = 3; // Three-phase MV single-core
      const totalMVCableRunsPTToPoC = qtyOfPTs * runsPerPhasePTToPoC * ptToPoCConductors;
      const ptPoCMVLugs = Math.ceil(totalMVCableRunsPTToPoC * lugsPerMVConductor * (1 + params.sparePercentage / 100));
      const ptPoCMVLugSize = selectNextHigherStandard(cableSizePTToPoC, AC_ENGINEERING_STANDARDS.cableLugs);
      
      // console.log(`🔌 HV Central PT-PoC MV Lugs: ${totalMVCableRunsPTToPoC} MV conductors × ${lugsPerMVConductor} lugs/conductor = ${ptPoCMVLugs} total lugs`);
      
      items.push({
        description: "MV Cable Lugs (PT to PoC)",
        specifications: `${ptPoCMVLugSize.selected}mm² compression lug${ptPoCMVLugSize.selected > ptPoCMVLugSize.calculated ? ` (calculated ${ptPoCMVLugSize.calculated}mm²)` : ''}`,
        unit: "pcs",
        qty: ptPoCMVLugs,
        category: "MV Termination"
      });

      // 7. Cable Ties (Central Inverter to IDT)
      const inverterIDTBundle = calculateBundleParameters(cableSizeInverterToIDT, 4, 1);
      const requiredInverterTieLength = inverterIDTBundle.circumference + 20;
      const selectedInverterTie = selectOptimalCableTie(requiredInverterTieLength, 'outdoor');
      const tiesPerInverterRun = Math.ceil(distanceInverterToIDT / params.cableTieSpacing) + params.extraTiesPerRun;
      const totalInverterTies = Math.ceil(totalCableRunsInverterToIDT * tiesPerInverterRun * (1 + params.sparePercentage / 100));
      
      items.push({
        description: "Cable Ties (Central Inverter to IDT)",
        specifications: `${selectedInverterTie.length}mm ${selectedInverterTie.material}${selectedInverterTie.width ? ` ${selectedInverterTie.width}mm width` : ''}`,
        unit: "pcs",
        qty: totalInverterTies,
        category: "Cable Management"
      });

      // 8. Heavy-Duty Cable Ties/Bands (MV Cables - IDT to PT)
      const mvBundleIDTToPT = calculateBundleParameters(cableSizeIDTToPT, 1, 3); // 3 single-core cables
      const requiredMVTieLength1 = mvBundleIDTToPT.circumference + 30;
      const selectedMVTie1 = selectOptimalCableTie(requiredMVTieLength1, 'outdoor');
      const mvTiesIDTToPT = Math.ceil((distanceIDTToPT / params.cableTieSpacing + params.extraTiesPerRun) * qtyOfIDTs * (1 + params.sparePercentage / 100));
      
      items.push({
        description: "Heavy-Duty Cable Ties (MV IDT to PT)",
        specifications: `${selectedMVTie1.length}mm ${selectedMVTie1.material}${selectedMVTie1.width ? ` ${selectedMVTie1.width}mm width` : ''} - for MV cable bundling`,
        unit: "pcs",
        qty: mvTiesIDTToPT,
        category: "MV Cable Management"
      });

      // 9. Heavy-Duty Cable Ties/Bands (MV Cables - PT to PoC)
      const mvBundlePTToPoC = calculateBundleParameters(cableSizePTToPoC, 1, 3);
      const requiredMVTieLength2 = mvBundlePTToPoC.circumference + 30;
      const selectedMVTie2 = selectOptimalCableTie(requiredMVTieLength2, 'outdoor');
      const mvTiesPTToPoC = Math.ceil((distancePTToPoC / params.cableTieSpacing + params.extraTiesPerRun) * qtyOfPTs * (1 + params.sparePercentage / 100));
      
      items.push({
        description: "Heavy-Duty Cable Ties (MV PT to PoC)",
        specifications: `${selectedMVTie2.length}mm ${selectedMVTie2.material}${selectedMVTie2.width ? ` ${selectedMVTie2.width}mm width` : ''} - for large MV cable bundling`,
        unit: "pcs",
        qty: mvTiesPTToPoC,
        category: "MV Cable Management"
      });

      // 10. Cable Trays (Central Inverter to IDT) - TREFOIL FORMATION + 5% CONTINGENCY
      const centralInverterRouteLengths = calculateTrayAndTrenchLengths(distanceInverterToIDT);
      
      if (centralInverterRouteLengths.trayLength > 0) {
        const totalCentralInverterTrays = numberOfCentralInverters * inverterToIDTMultipleRuns.traysRequired;
        const baseCentralInverterTrayLength = centralInverterRouteLengths.trayLength * totalCentralInverterTrays;
        const centralInverterTrayLengthWith5PercentContingency = Math.ceil(baseCentralInverterTrayLength * 1.05); // 5% contingency rounded up
        
        items.push({
          description: "Cable Tray (Central Inverter to IDT)",
          specifications: `${determineRoutingMethod('HV_Central', 'CENTRAL_INVERTER_TO_IDT')} type, ${inverterToIDTMultipleRuns.recommendedTrayWidth}mm × ${inverterToIDTMultipleRuns.recommendedTrayHeight}mm, galvanized steel - ${inverterToIDTMultipleRuns.cablesPerTray} cables/tray max, ${inverterToIDTMultipleRuns.trefoilFormation} (5% extra length added)`,
          unit: "m",
          qty: centralInverterTrayLengthWith5PercentContingency,
          category: "Cable Support"
        });
      }

      // 10a. Underground Trench (Central Inverter to IDT) - WITH DIMENSIONS
      if (centralInverterRouteLengths.trenchLength > 0) {
        const centralInverterTrenchDims = calculateTrenchDimensions('LV', inverterToIDTMultipleRuns.totalCircuits * 4, cableSizeInverterToIDT);
        items.push({
          description: "Trench Excavation (Central Inverter to IDT)",
          specifications: `Underground trench ${centralInverterTrenchDims.specifications} for ${inverterToIDTMultipleRuns.totalCircuits} circuits of 4-core XLPE cables, including warning tape and bedding sand`,
          unit: "m",
          qty: Math.ceil(centralInverterRouteLengths.trenchLength),
          category: "Cable Support"
        });
      }

      // 11. Underground Trench (MV Cables) - WITH MAXIMUM DIMENSIONS
      const totalMVTrenchLength = (distanceIDTToPT * qtyOfIDTs) + (distancePTToPoC * qtyOfPTs);
      const idtToPTTrenchDimsCentral = calculateTrenchDimensions('MV', idtToPTMultipleRuns.totalCores, cableSizeIDTToPT);
      const ptToPoCTrenchDimsCentral = calculateTrenchDimensions('MV', ptToPoCMultipleRuns.totalCores, cableSizePTToPoC);
      const maxMVTrenchDimsCentral = getMaxTrenchDimensions([idtToPTTrenchDimsCentral, ptToPoCTrenchDimsCentral]);
      
      items.push({
        description: "Trench Excavation (MV Cables - IDT to PT & PT to PoC)",
        specifications: `Underground trench ${maxMVTrenchDimsCentral.specifications} for ${idtToPTMultipleRuns.totalCircuits + ptToPoCMultipleRuns.totalCircuits} circuits (${idtToPTMultipleRuns.totalCores + ptToPoCMultipleRuns.totalCores} single-core cables), including warning tape, bedding sand, and cable protection tiles`,
        unit: "m",
        qty: Math.ceil(totalMVTrenchLength),
        category: "MV Installation"
      });
    }

    return items;
  }, [
    connectionType, 
    acSystemInputs, 
    params, 
    selectNextHigherStandard, 
    calculateBundleParameters, 
    selectOptimalCableTie, 
    selectCombinerPanel, 
    calculateTrayAndTrenchLengths,
    // New trefoil formation functions  
    calculate4CoreMultipleRuns,
    calculate1CoreMultipleRuns,
    determineRoutingMethod,
    // New trench dimension functions
    calculateTrenchDimensions,
    getMaxTrenchDimensions,
    // New breaker selection functions
    selectLVBreakerType,
    selectHVBreakerType,
    // System size classification function
    determineSystemSize
  ]);

  // ==========================================
  // CATEGORIZATION
  // ==========================================

  const categorizeBOQItems = (items: ACBOQItem[]): ACBOQCategory[] => {
    const categories = [
      { name: "Inverters & Protection", icon: <Zap className="w-4 h-4 text-blue-600" />, items: [] as ACBOQItem[] },
      { name: "Transformers", icon: <Building2 className="w-4 h-4 text-green-600" />, items: [] as ACBOQItem[] },
      { name: "AC Cables", icon: <Cable className="w-4 h-4" />, items: [] as ACBOQItem[] },
      { name: "MV Cables", icon: <Cable className="w-4 h-4 text-red-600" />, items: [] as ACBOQItem[] },
      { name: "Cable Termination", icon: <Zap className="w-4 h-4" />, items: [] as ACBOQItem[] },
      { name: "MV Termination", icon: <Zap className="w-4 h-4 text-red-600" />, items: [] as ACBOQItem[] },
      { name: "Cable Management", icon: <Anchor className="w-4 h-4" />, items: [] as ACBOQItem[] },
      { name: "MV Cable Management", icon: <Anchor className="w-4 h-4 text-red-600" />, items: [] as ACBOQItem[] },
      { name: "Cable Support", icon: <Layers className="w-4 h-4" />, items: [] as ACBOQItem[] },
      { name: "MV Installation", icon: <Layers className="w-4 h-4 text-red-600" />, items: [] as ACBOQItem[] },
      { name: "Distribution Panels", icon: <Package className="w-4 h-4" />, items: [] as ACBOQItem[] },
      { name: "Distribution Components", icon: <Grid3X3 className="w-4 h-4" />, items: [] as ACBOQItem[] },
      { name: "MV Equipment", icon: <Building2 className="w-4 h-4" />, items: [] as ACBOQItem[] },
      { name: "System Configuration", icon: <Wrench className="w-4 h-4" />, items: [] as ACBOQItem[] }
    ];

    // Group items by category
    items.forEach(item => {
      const category = categories.find(cat => cat.name === item.category);
      if (category) {
        category.items.push(item);
      }
    });

    // Return only categories that have items
    return categories.filter(category => category.items.length > 0);
  };

  // ==========================================
  // CALCULATE BOQ
  // ==========================================

  const boqItems = useMemo(() => calculateACBOQ(), [calculateACBOQ]);
  const categorizedBOQ = useMemo(() => categorizeBOQItems(boqItems), [boqItems]);

  // Call callback when BOQ items are calculated
  useEffect(() => {
    if (boqItems.length > 0 && onBOQCalculated) {
      // Transform to standardized format
      const standardizedItems = boqItems.map(item => ({
        description: item.description,
        specifications: item.specifications,
        unit: item.unit,
        qty: item.qty,
        category: item.category
      }));
      onBOQCalculated(standardizedItems);
    }
  }, [boqItems, onBOQCalculated]);

  // ==========================================
  // EXPORT FUNCTIONS
  // ==========================================

  const downloadCSV = () => {
    const csvContent = generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `AC_BOQ_${connectionType}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCSVContent = (): string => {
    let csv = "S.No,Description,Specifications,Unit,Qty\n";
    let serialNumber = 1;

    categorizedBOQ.forEach(category => {
      csv += `\n"=== ${category.name} ===","","","",""\n`;
      category.items.forEach(item => {
        const description = `"${item.description.replace(/"/g, '""')}"`;
        const specifications = `"${item.specifications.replace(/"/g, '""')}"`;
        const unit = `"${item.unit}"`;
        const qty = item.qty;
        csv += `${serialNumber},${description},${specifications},${unit},${qty}\n`;
        serialNumber++;
      });
    });

    return csv;
  };

  const copyTableToClipboard = async () => {
    const tableContent = generateTableContent();
    
    try {
      await navigator.clipboard.writeText(tableContent);
      setCopiedTable(true);
      setTimeout(() => setCopiedTable(false), 2000);
    } catch (err) {
      console.error('Failed to copy table: ', err);
    }
  };

  const generateTableContent = (): string => {
    let content = "S.No\tDescription\tSpecifications\tUnit\tQty\n";
    let serialNumber = 1;

    categorizedBOQ.forEach(category => {
      content += `\n=== ${category.name} ===\t\t\t\t\n`;
      category.items.forEach(item => {
        content += `${serialNumber}\t${item.description}\t${item.specifications}\t${item.unit}\t${item.qty}\n`;
        serialNumber++;
      });
    });

    return content;
  };

  // ==========================================
  // SUMMARY CALCULATIONS
  // ==========================================

  const summary = useMemo(() => {
    const totalCableLength = boqItems
      .filter(item => item.category === "AC Cables" || item.category === "MV Cables")
      .reduce((sum, item) => sum + item.qty, 0);
    
    const totalLugs = boqItems
      .filter(item => item.category === "Cable Termination" || item.category === "MV Termination")
      .reduce((sum, item) => sum + item.qty, 0);
    
    const totalCableTies = boqItems
      .filter(item => item.category === "Cable Management" || item.category === "MV Cable Management")
      .reduce((sum, item) => sum + item.qty, 0);
    
    const totalTrayLength = boqItems
      .filter(item => item.category === "Cable Support" || item.category === "MV Installation")
      .reduce((sum, item) => sum + item.qty, 0);
    
    const totalPanels = boqItems
      .filter(item => item.category === "Distribution Panels")
      .reduce((sum, item) => sum + item.qty, 0);

    return { totalCableLength, totalLugs, totalCableTies, totalTrayLength, totalPanels };
  }, [boqItems]);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            <CardTitle>Professional Engineering AC BOQ - {connectionType} Configuration</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={copyTableToClipboard}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {copiedTable ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedTable ? 'Copied!' : 'Copy Table'}
            </Button>
            <Button
              onClick={downloadCSV}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </Button>
          </div>
        </div>
        
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 p-4 bg-slate-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">Total Cable Length</div>
            <div className="text-lg font-semibold text-blue-600">{summary.totalCableLength}m</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">Total Lugs</div>
            <div className="text-lg font-semibold text-green-600">{summary.totalLugs} pcs</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">Total Cable Ties</div>
            <div className="text-lg font-semibold text-orange-600">{summary.totalCableTies} pcs</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">Total Tray Length</div>
            <div className="text-lg font-semibold text-purple-600">{summary.totalTrayLength}m</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">AC Combiner Panels</div>
            <div className="text-lg font-semibold text-red-600">{summary.totalPanels} pcs</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          NEC & IEC compliant AC side calculations with professional engineering standards. 
          All components sized to next higher standard with safety margins applied.
        </p>

        {/* BOQ Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">S.No</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Description</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Specifications</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Unit</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Qty</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let serialNumber = 1;
                return categorizedBOQ.flatMap(category => [
                  // Category header
                  <tr key={`category-${category.name}`} className="bg-blue-50">
                    <td colSpan={5} className="border border-gray-300 px-4 py-2 font-semibold text-blue-800">
                      <div className="flex items-center gap-2">
                        {category.icon}
                        {category.name}
                      </div>
                    </td>
                  </tr>,
                  // Category items
                  ...category.items.map(item => (
                    <tr key={`item-${serialNumber}`} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-center">{serialNumber++}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.description}</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">{item.specifications}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{item.unit}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center font-semibold">{item.qty}</td>
                    </tr>
                  ))
                ]);
              })()}
            </tbody>
          </table>
        </div>

        {boqItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No BOQ items calculated. Please check input parameters.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ACBOQCalculator;
