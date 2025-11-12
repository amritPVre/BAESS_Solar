// BOQ Parameter Interfaces for AI LLM Input
// Based on prompt_input_BOQ_list.csv from working-reference folder

export interface DCInputs {
  structureType: string; // From PV areas tab
  moduleWidthMm: number; // From PV select tab
  moduleLengthMm: number; // From PV select tab
  totalNumberOfTables: number; // From PV areas tab
  moduleLayoutPerTable: string; // From PV Areas tab (e.g., "2P×5" or "3L×8")
  totalNumberOfRows?: number; // Only required if structure type = Ballasted
  stringShortCircuitCurrentA: number; // From PV select tab
  totalNumberOfStringsPerInverter: number; // From DC Config tab
  
  // Edge dimensions from drawn PV area
  edge1LengthM: number; // From PV areas drawing
  edge2LengthM: number; // From PV areas drawing  
  edge3LengthM: number; // From PV areas drawing
  edge4LengthM: number; // From PV areas drawing
}

export interface LightningProtectionInputs {
  totalPlantAreaM2: number; // From PV areas tab
  soilType: 'saturated_clay' | 'clay' | 'loam' | 'moist_sand' | 'dry_sand' | 'rock'; // From Location Tab
}

export interface ACCommonInputs {
  systemType: 'LV_Connection' | 'HV_Connection'; // From AC Config tab
  numberOfInverters: number; // From DC Config tab
}

export interface LVConnectionInputs {
  inverterOutputVoltageV: number; // From DC config tab
  inverterOutputCurrentA: number; // From DC config tab (per inverter)
  
  // LV Combiner Panel Details
  numberOfInvertersConnectedToLVCombiner: number; // From AC config tab
  lvCombinerPanelOutputCurrentA: number; // Calculated: Number of inverters × Single inverter output current
  
  // Inverter to Combiner Cable Parameters (3 separate values)
  distanceInverterToCombinerM: number; // Distance from design summary (e.g., 10m)
  totalCableLengthPerInverterToCombinerM: number; // Distance × Runs (e.g., 5R × 10m = 50m)
  completeCableLengthInverterToCombinerM: number; // Per circuit × Number of inverters (e.g., 4 × 50m = 200m)
  acCableCrossSectionInverterToCombinerMm2: string; // From AC config tab (format: "4R*120")
  
  // Combiner to PoC Cable Parameters (3 separate values)
  distanceCombinerToPoCM: number; // Distance from design summary (e.g., 100m)
  totalCableLengthPerCombinerToPoCM: number; // Distance × Runs (e.g., 1R × 100m = 100m)
  completeCableLengthCombinerToPoCM: number; // Per circuit × Number of combiners (e.g., 1 × 100m = 100m)
  acCableCrossSectionCombinerToPoCMm2: string; // From AC config tab (format: "4R*120")
  
  combinerIncomeBreakerRatingA: number; // From AC config tab
  combinerOutgoingBreakerRatingA: number; // From AC config tab
}

export interface HVStringInverterInputs {
  numberOfStringInverters: number; // From DC config tab
  inverterOutputVoltageV: number; // From DC config tab
  inverterOutputCurrentA: number; // From DC config tab (per inverter)
  invertersPerLVCombinerPanel: number; // From AC config tab
  totalLVCombinerPanels: number; // From AC config tab
  distanceCombinerToPoCM: number; // From AC config tab
  acCableCrossSectionCombinerToPoCMm2: string; // From AC config tab (format: "4R*120")
  
  // IDT Details
  quantityOfIDTs: number; // From AC config tab
  singleIDTRatingMVA: number; // Single IDT rating in MVA
  idtTransformerImpedancePercentage: number; // IDT transformer impedance (default 6%)
  idtInputVoltageV: number; // From AC config tab
  idtInputCurrentA: number; // From AC config tab
  idtOutputVoltageV: number; // From AC config tab
  idtOutputCurrentA: number; // From AC config tab
  
  // PT Details
  quantityOfPTs: number; // From AC config tab
  singlePTRatingMVA: number; // Power Transformer rating in MVA
  ptTransformerImpedancePercentage: number; // PT transformer impedance (default 6%)
  ptInputVoltageV: number; // From AC config tab
  ptInputCurrentA: number; // From AC config tab
  ptOutputVoltageV: number; // From AC config tab
  ptOutputCurrentA: number; // From AC config tab
  
  // String Inverter to Combiner Cable Parameters (3 separate values)
  distanceInverterToCombinerM: number; // Distance from design summary (e.g., 10m)
  totalCableLengthPerInverterToCombinerM: number; // Distance × Runs (e.g., 1R × 10m = 10m)
  completeCableLengthInverterToCombinerM: number; // Per circuit × Number of inverters (e.g., 5 × 10m = 50m)
  acCableCrossSectionInverterToCombinerMm2: string; // From AC config tab (format: "4R*120")
  
  // Combiner to IDT Cable Parameters (3 separate values)
  distanceCombinerToIDTM: number; // Distance from design summary (e.g., 200m)
  totalCableLengthPerCombinerToIDTM: number; // Distance × Runs (e.g., 4R × 200m = 800m)
  completeCableLengthCombinerToIDTM: number; // Per circuit × Number of combiners (e.g., 1 × 800m = 800m)
  cableSizeCombinerToIDTMm2: string; // From AC config tab (format: "4R*120")
  
  // IDT to PT Cable Parameters (3 separate values)
  distanceIDTToPTM: number; // Distance from design summary (e.g., 100m)
  totalCableLengthPerIDTToPTM: number; // Distance × Runs (e.g., 1R × 100m = 100m)
  completeCableLengthIDTToPTM: number; // Per circuit × Number of IDTs (e.g., 1 × 100m = 100m)
  cableSizeIDTToPTMm2: string; // From AC config tab (format: "4R*120")
  
  // PT to PoC Cable Parameters (3 separate values)
  distancePTToPoCM: number; // Distance from design summary (e.g., 100m)
  totalCableLengthPerPTToPoCM: number; // Distance × Runs (e.g., 1R × 100m = 100m)
  completeCableLengthPTToPoCM: number; // Per circuit × Number of PTs (e.g., 1 × 100m = 100m)
  cableSizePTToPoCMm2: string; // From AC config tab (format: "4R*120")
  
  // Circuit Breaker Details
  combinerIncomeBreakerRatingA: number; // From AC config tab
  combinerOutgoingBreakerRatingA: number; // From AC config tab
  cbTypeInverterToIDT: string; // From AC config tab
  cbRatingInverterToIDTA: number; // From AC config tab
  cbTypeIDTToPT: string; // From AC config tab
  cbRatingIDTToPTA: number; // From AC config tab
  cbTypePTToPoC: string; // From AC config tab
  cbRatingPTToPoCA: number; // From AC config tab
}

export interface HVCentralInverterInputs {
  numberOfCentralInverters: number; // From DC config tab
  
  // IDT Details
  quantityOfIDTs: number; // From AC config tab
  singleIDTRatingMVA: number; // Single IDT rating in MVA
  idtTransformerImpedancePercentage: number; // IDT transformer impedance (default 6%)
  idtInputVoltageV: number; // From AC config tab
  idtInputCurrentA: number; // From AC config tab
  idtOutputVoltageV: number; // From AC config tab
  idtOutputCurrentA: number; // From AC config tab
  
  // PT Details
  quantityOfPTs: number; // From AC config tab
  singlePTRatingMVA: number; // Power Transformer rating in MVA
  ptTransformerImpedancePercentage: number; // PT transformer impedance (default 6%)
  ptInputVoltageV: number; // From AC config tab
  ptInputCurrentA: number; // From AC config tab
  ptOutputVoltageV: number; // From AC config tab
  ptOutputCurrentA: number; // From AC config tab
  
  // Central Inverter to IDT Cable Parameters (3 separate values)
  distanceInverterToIDTM: number; // Distance from design summary (e.g., 10m)
  totalCableLengthPerInverterToIDTM: number; // Distance × Runs (e.g., 1R × 10m = 10m)
  completeCableLengthInverterToIDTM: number; // Per circuit × Number of inverters (e.g., 5 × 10m = 50m)
  cableSizeInverterToIDTMm2: string; // From AC config tab (format: "4R*120")
  
  // IDT to PT Cable Parameters (3 separate values)
  distanceIDTToPTM: number; // Distance from design summary (e.g., 100m)
  totalCableLengthPerIDTToPTM: number; // Distance × Runs (e.g., 1R × 100m = 100m)
  completeCableLengthIDTToPTM: number; // Per circuit × Number of IDTs (e.g., 2 × 100m = 200m)
  cableSizeIDTToPTMm2: string; // From AC config tab (format: "4R*120")
  
  // PT to PoC Cable Parameters (3 separate values)
  distancePTToPoCM: number; // Distance from design summary (e.g., 100m)
  totalCableLengthPerPTToPoCM: number; // Distance × Runs (e.g., 1R × 100m = 100m)
  completeCableLengthPTToPoCM: number; // Per circuit × Number of PTs (e.g., 1 × 100m = 100m)
  cableSizePTToPoCMm2: string; // From AC config tab (format: "4R*120")
  
  // Circuit Breaker Details
  cbTypeCentralInverterToIDT: string; // From AC config tab
  cbRatingCentralInverterToIDTA: number; // From AC config tab
  cbTypeIDTToPT: string; // From AC config tab
  cbRatingIDTToPTA: number; // From AC config tab
  cbTypePTToPoC: string; // From AC config tab
  cbRatingPTToPoCA: number; // From AC config tab
}

export interface SubstationInputs {
  substationElectricalRoomGridSizeM2: number; // Default: 30×30m (900m²) for LV, 40×40m (1600m²) for HV
  targetEarthingResistanceOhms: number; // Default: 5Ω for LV, 1Ω for HV
}

export interface FixedPreferences {
  stringSideProtectiveDevice: string; // Default: "String fuse"
  preferredMaterial: string; // Default: "Tinned copper"
  preferredInsulationOfEarthingCables: string; // Default: "PVC"
  railBondingMode: string; // Default: "Bonding clamps"
  structureDropRule: string; // "one drop per N tables" - where N depends on structure type and is defined in rules, not user input
}

export interface TransformerEarthingInputs {
  numberOfIDTs: number; // From AC config tab (HV systems only)
  numberOfPTs: number; // Always 1 for HV connection type systems
  transformerEarthing: string; // Default: "2 dedicated earth pits for neutral + 2 for body earthing" (HV systems only)
}

// Complete BOQ Parameters Interface
export interface BOQParameters {
  dcInputs: DCInputs;
  lightningProtection: LightningProtectionInputs;
  acCommon: ACCommonInputs;
  lvConnection?: LVConnectionInputs; // Only for LV systems
  hvStringInverter?: HVStringInverterInputs; // Only for HV + String inverter
  hvCentralInverter?: HVCentralInverterInputs; // Only for HV + Central inverter
  substation: SubstationInputs;
  fixedPreferences: FixedPreferences;
  transformerEarthing?: TransformerEarthingInputs; // Only for HV systems (not for LV)
  
  // Metadata
  timestamp: Date;
  sessionId: string;
  calculationType: 'LV' | 'HV_String' | 'HV_Central';
}

// Default values for fixed preferences
export const DEFAULT_FIXED_PREFERENCES: FixedPreferences = {
  stringSideProtectiveDevice: "String fuse",
  preferredMaterial: "Tinned copper", 
  preferredInsulationOfEarthingCables: "PVC",
  railBondingMode: "Bonding clamps",
  structureDropRule: "one drop per N tables (where N depends on structure type and is defined in rules, not user input)"
};

// Default values for substation based on system type
export const getDefaultSubstationInputs = (systemType: 'LV_Connection' | 'HV_Connection'): SubstationInputs => {
  return {
    substationElectricalRoomGridSizeM2: systemType === 'LV_Connection' ? 900 : 1600, // 30×30m (900m²) or 40×40m (1600m²)
    targetEarthingResistanceOhms: systemType === 'LV_Connection' ? 5 : 1
  };
};

// Default transformer earthing
export const DEFAULT_TRANSFORMER_EARTHING: TransformerEarthingInputs = {
  numberOfIDTs: 0, // To be filled from AC config
  numberOfPTs: 1, // Always 1 for HV systems
  transformerEarthing: "2 dedicated earth pits for neutral earthing + 2 dedicated earth pits for body earthing"
};
