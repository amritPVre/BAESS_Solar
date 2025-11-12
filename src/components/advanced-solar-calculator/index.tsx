import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  BarChart3, 
  Calculator, 
  Download, 
  Layers,
  LineChart, 
  MapPin,
  Settings, 
  Sun,
  Zap,
  Activity,
  Grid3X3,
  Info,
  Compass,
  RotateCcw,
  FileText,
  Shield,
  Cable,
  Building,
  Power,
  ArrowRight,
  Bot,
  Receipt,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { calculateSolarEnergy, calculateSolarEnergyWithPVWatts, calculateMultiplePVSystems, MultiplePVSystemsParams } from "@/utils/solarEnergyCalculation";
import { InverterParams, SolarCalculationResult, SolarParams } from "@/types/solarCalculations";
import { PolygonConfig } from "./area-calculator/types";
import SystemConfiguration from "../advanced-solar-calculator/SystemConfiguration";
import ComponentSelector from "./ComponentSelector";
import EfficiencyAdjustment from "./EfficiencyAdjustment";
import ProductionResults from "./ProductionResults";
import AreaCalculator, { type AreaCalculatorRef } from "./AreaCalculator";
import LocationInputs from "../advanced-solar-inputs/LocationInputs";
import { ACSideConfiguration, type ACConfiguration, type ACSideConfigurationRef } from "./ACSideConfiguration";
import InverterSelector from "./InverterSelector";
import DetailedLossesConfiguration from "./DetailedLossesConfiguration";
import StringSizingCalculator from "./StringSizingCalculator";
import EnhancedStringSizingCalculator from "./EnhancedStringSizingCalculator";
import DCDBSizingCalculator from "./DCDBSizingCalculator";
import CentralInverterStringSizing from "./CentralInverterStringSizing";
import DCStringSizingCalculator from "./DCStringSizingCalculator";
import DCDBCableSizing from "./DCDBCableSizing";
import BOQGenerator from "./BOQGenerator";
import StructuralMaterialCalculator from "./StructuralMaterialCalculator";
import ElectricalMaterialCalculator from "./ElectricalMaterialCalculator";
import BOQParameterPanel from "./BOQParameterPanel";
import DetailedBOQGenerator from "./DetailedBOQGenerator";
import DCBOQCalculator from "./DCBOQCalculator";
import ACBOQCalculator from "./ACBOQCalculator";
import { FinancialAnalysis, type FinancialParams } from "./FinancialAnalysis";
import { AIFeasibilityReport, ReportFormData } from "./AIFeasibilityReport";
import type { FinancialResults } from "@/utils/financialCalculations";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getArrayTypeForStructure } from "./area-calculator/utils/drawingUtils";
import { AdvancedCalculatorProjectService } from "@/services/advancedCalculatorProjectService";
import { useAuth } from "@/hooks/useAuth";
import { AICreditBalance } from "@/components/ai-credits/AICreditBalance";

const AdvancedSolarCalculator: React.FC = () => {
  // Helper function to map AC configuration data for ACBOQCalculator
  const mapACConfigurationToInputs = (acConfig: ACConfiguration, inverterCount: number, actualInverterPowerKW: number) => {
    const connectionType = acConfig.connectionType === 'LV' ? 'LV' : 
                          acConfig.inverterType === 'STRING' ? 'HV_String' : 'HV_Central';
    
    // Helper function to convert Map or plain object to Map
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ensureMap = (data: Map<string, any> | Record<string, any> | undefined | null): Map<string, any> => {
      if (!data) return new Map();
      if (data instanceof Map) return data;
      // If it's a plain object, convert to Map
      if (typeof data === 'object' && !Array.isArray(data)) {
        return new Map(Object.entries(data));
      }
      return new Map();
    };
    
    // Helper functions to extract actual designed values
    const getActualBreakerRating = (searchTerms: string[]): number => {
      const breakersMap = ensureMap(acConfig.selectedBreakers);
      const breakers = Array.from(breakersMap.values());
      for (const term of searchTerms) {
        const targetBreaker = breakers.find(b => 
          b.sectionTitle?.toLowerCase().includes(term.toLowerCase()) ||
          b.sectionType?.toLowerCase().includes(term.toLowerCase())
        );
        if (targetBreaker) {
          return targetBreaker.breaker?.ampacity || 100;
        }
      }
      return 100; // Fallback
    };

    const getActualBreakerType = (searchTerms: string[]): string | null => {
      const breakersMap = ensureMap(acConfig.selectedBreakers);
      const breakers = Array.from(breakersMap.values());
      for (const term of searchTerms) {
        const targetBreaker = breakers.find(b => 
          b.sectionTitle?.toLowerCase().includes(term.toLowerCase()) ||
          b.sectionType?.toLowerCase().includes(term.toLowerCase())
        );
        if (targetBreaker) {
          // Extract breaker type from the breaker_type property
          const breakerType = targetBreaker.breaker?.breaker_type || '';
          if (breakerType.toLowerCase().includes('vcb')) return 'VCB';
          if (breakerType.toLowerCase().includes('sf6')) return 'SF6 CB';
          if (breakerType.toLowerCase().includes('acb')) return 'ACB';
          if (breakerType.toLowerCase().includes('mccb')) return 'MCCB';
          if (breakerType.toLowerCase().includes('mcb')) return 'MCB';
          // If exact match or clean type, return as-is
          return breakerType || null;
        }
      }
      return null; // Let engineering rules determine type
    };

    const getActualCableData = (searchTerms: string[]) => {
      const cablesMap = ensureMap(acConfig.selectedCables);
      const cables = Array.from(cablesMap.values());
      for (const term of searchTerms) {
        const targetCable = cables.find(c => 
          c.sectionTitle?.toLowerCase().includes(term.toLowerCase()) ||
          c.sectionType?.toLowerCase().includes(term.toLowerCase())
        );
        if (targetCable) {
          return {
            crossSection: (targetCable.cable as { cross_section_mm2?: number })?.cross_section_mm2 || 16,
            length: targetCable.length || 50,
            runs: targetCable.numberOfRuns || 1
          };
        }
      }
      return { crossSection: 16, length: 50, runs: 1 }; // Fallback
    };

    // Extract actual designed values for LV connections
    const inverterToCombinerData = getActualCableData(['inverter to', 'inverter-combiner', 'inverter']);
    
    // Extract common parameters with actual values
    const baseInputs = {
      // ACTUAL INVERTER DATA
      inverterCapacity: actualInverterPowerKW, // Use actual inverter power from props
      qtyOfInverters: inverterCount,
      inverterOutputCurrent: (actualInverterPowerKW * 1000) / (400 * Math.sqrt(3)), // Calculate actual current
      
      // ACTUAL CABLE DATA - INVERTER TO COMBINER
      distanceInverterToCombiner: inverterToCombinerData.length,
      acCableCrossSectionInverterToCombiner: inverterToCombinerData.crossSection,
      runsPerPhaseInverterToCombiner: inverterToCombinerData.runs,
    };

    // Map based on connection type
    if (connectionType === 'LV') {
    // Extract actual designed values for LV system
    const combinerToPoCData = getActualCableData(['combiner to', 'panel to poc', 'output', 'combiner-poc']);
    // Enhanced search terms for breaker extraction - More specific terms
    const inputBreakerRating = getActualBreakerRating([
      'input', 'incoming', 'incomer', 'inverter', 'combiner input', 'panel input',
      'inverter to', 'inverter-combiner', 'string inverter', 'pv inverter'
    ]);
    const outputBreakerRating = getActualBreakerRating([
      'output', 'outgoing', 'poc', 'combiner output', 'panel output',
      'combiner to poc', 'panel to poc', 'to poc', 'main output'
    ]);
    
      
      return {
        ...baseInputs,
        // ACTUAL COMBINER TO POC CABLE DATA
        distanceCombinerToPoC: combinerToPoCData.length,
        acCableCrossSectionCombinerToPoC: combinerToPoCData.crossSection,
        runsPerPhaseCombinerToPoC: combinerToPoCData.runs,
        
        // ACTUAL BREAKER RATINGS
        combinerIncomerBreakerRating: inputBreakerRating,
        combinerOutgoingBreakerRating: outputBreakerRating,
        
        // COMBINER PANEL DATA
        qtyInputsPerLVCombiner: acConfig.acCombinerPanels?.configurations?.[0]?.inputs || 6,
        totalLVCombinerPanels: acConfig.acCombinerPanels?.count || 1,
      };
    } else if (connectionType === 'HV_String') {
      // Extract actual designed values using robust getActualCableData function
      const combinerToIDTData = getActualCableData(['combiner to idt', 'lv combiner to idt', 'panel to idt', 'combiner-idt']);
      const idtToPTData = getActualCableData([
        'idt to pt', 'idt to transformer', 'idt-pt', 'idt-transformer', 
        'idt 1 to power transformer', 'power transformer', 'transformer', 'ht'
      ]);
      const ptToPoCData = getActualCableData([
        'pt to poc', 'transformer to poc', 'pt-poc', 'transformer-poc',
        'power transformer to point of connection', 'point of connection', 'poc', 'ht'
      ]);
      
      // Extract actual breaker ratings for HV String
      const combinerIncomerBreakerRating = getActualBreakerRating([
        'input', 'incoming', 'incomer', 'inverter', 'combiner input', 'panel input',
        'inverter to', 'inverter-combiner', 'string inverter', 'pv inverter'
      ]);
      const combinerToIDTBreakerRating = getActualBreakerRating([
        'combiner to idt', 'panel to idt', 'lv combiner to idt', 'outgoing', 'combiner output',
        'panel output breaker', 'output breaker', 'combiner', 'panel'
      ]);
      const idtToPTBreakerRating = getActualBreakerRating([
        'idt to pt', 'idt to transformer', 'idt-pt', 'idt-transformer', 'mv input', 'transformer input',
        'idt 1 to power transformer', 'power transformer', 'mv breaker', 'hv breaker', 'transformer breaker',
        'step up transformer', 'isolation transformer'
      ]);
      const ptToPoCBreakerRating = getActualBreakerRating([
        'pt to poc', 'transformer to poc', 'pt-poc', 'transformer-poc', 'main output', 'grid connection'
      ]);
      const ptToPoCBreakerType = getActualBreakerType([
        'pt to poc', 'transformer to poc', 'pt-poc', 'transformer-poc', 'main output', 'grid connection'
      ]);

      // One-time debug output (only if no data found and debug flag set)
      if (typeof window !== 'undefined' && 
          !(window as { __SOLAR_DEBUG_LOGGED__?: boolean }).__SOLAR_DEBUG_LOGGED__ && 
          idtToPTData.crossSection === 16 && 
          idtToPTBreakerRating === 100) {
        (window as { __SOLAR_DEBUG_LOGGED__?: boolean }).__SOLAR_DEBUG_LOGGED__ = true;
        console.log('🔍 ONE-TIME DEBUG: HV+String Data Extraction Status');
        console.log('Available breakers:', Array.from(acConfig.selectedBreakers?.entries() || []));
        console.log('Available cables:', Array.from(acConfig.selectedCables?.entries() || []));
        console.log('Extracted breaker ratings:', {
          combinerToIDT: combinerToIDTBreakerRating,
          idtToPT: idtToPTBreakerRating,
          ptToPoC: ptToPoCBreakerRating
        });
        console.log('Extracted cable data:', { idtToPTData, ptToPoCData });
      }
      
      
      return {
        ...baseInputs,
        numberOfStringInverters: inverterCount,
        invertersPerLVCombiner: acConfig.hvStringConfig?.lvACCombinerPanels?.configurations?.[0]?.inputs || acConfig.acCombinerPanels?.configurations?.[0]?.inputs || 4,
        totalLVCombinerPanels: acConfig.hvStringConfig?.lvACCombinerPanels?.count || acConfig.acCombinerPanels?.count || 2,
        qtyOfIDTs: acConfig.hvStringConfig?.idts?.count || acConfig.idtConfig?.count || 1,
        qtyOfPTs: acConfig.hvStringConfig?.powerTransformer ? 1 : (acConfig.usePowerTransformer ? 1 : 0),
        
        // ACTUAL LV COMBINER TO IDT CABLE DATA
        distanceLVCombinerToIDT: combinerToIDTData.length,
        cableSizeLVCombinerToIDT: combinerToIDTData.crossSection,
        runsPerPhaseLVCombinerToIDT: combinerToIDTData.runs,
        
        // ACTUAL IDT TO PT CABLE DATA  
        distanceIDTToPT: idtToPTData.length,
        cableSizeIDTToPT: idtToPTData.crossSection,
        runsPerPhaseIDTToPT: idtToPTData.runs,
        
        // ACTUAL PT TO POC CABLE DATA
        distancePTToPoC: ptToPoCData.length,
        cableSizePTToPoC: ptToPoCData.crossSection,
        runsPerPhasePTToPoC: ptToPoCData.runs,
        
        
        // ACTUAL BREAKER RATINGS
        combinerIncomerBreakerRating: combinerIncomerBreakerRating,
        combinerToIDTBreakerRating: combinerToIDTBreakerRating,
        idtToPTBreakerRating: idtToPTBreakerRating,
        ptToPoCBreakerRating: ptToPoCBreakerRating,
        ptToPoCBreakerType: ptToPoCBreakerType,
        
        // TRANSFORMER DATA
        idtInputVoltage: 415, // Standard LV input
        idtOutputVoltage: acConfig.hvStringConfig?.idts?.configurations?.[0]?.secondaryVoltage || acConfig.idtConfig?.secondaryVoltage || 11000,
        idtInputCurrent: (actualInverterPowerKW * 1000 * inverterCount) / (415 * Math.sqrt(3)), // Calculate from total power
        idtOutputCurrent: (actualInverterPowerKW * 1000 * inverterCount) / (11000 * Math.sqrt(3)), // Calculate from total power
        
        ptInputVoltage: acConfig.hvStringConfig?.idts?.configurations?.[0]?.secondaryVoltage || acConfig.idtConfig?.secondaryVoltage || 11000,
        ptOutputVoltage: acConfig.hvStringConfig?.powerTransformer?.secondaryVoltage || acConfig.powerTransformerConfig?.secondaryVoltage || 33000,
        ptInputCurrent: (actualInverterPowerKW * 1000 * inverterCount) / (11000 * Math.sqrt(3)),
        ptOutputCurrent: (actualInverterPowerKW * 1000 * inverterCount) / (33000 * Math.sqrt(3)),
        
        // IDT AND PT EQUIPMENT SPECIFICATIONS
        idtPowerRatingMVA: acConfig.hvStringConfig?.idts?.configurations?.[0]?.powerRating || acConfig.idtConfig?.powerRating || 1.0, // MVA
        ptPowerRatingMVA: acConfig.hvStringConfig?.powerTransformer?.powerRating || acConfig.powerTransformerConfig?.powerRating || 0,
        ptVectorGrouping: acConfig.hvStringConfig?.powerTransformer?.vectorGrouping || 'Dyn11', // vectorGrouping only exists in hvStringConfig, not in powerTransformerConfig
        combinerPanelsPerIDT: acConfig.hvStringConfig?.idts?.configurations?.[0]?.combinerPanelsPerIDT || Math.ceil((acConfig.hvStringConfig?.lvACCombinerPanels?.count || 2) / (acConfig.hvStringConfig?.idts?.count || 1)),
        
        qtyInputsPerLVCombiner: acConfig.hvStringConfig?.lvACCombinerPanels?.configurations?.[0]?.inputs || acConfig.acCombinerPanels?.configurations?.[0]?.inputs || 4,
      };
    } else { // HV_Central
      // Use the same cable extraction logic as design summary (working correctly)
      let inverterToIDTDistance = 20; // fallback
      let inverterToIDTRuns = 7; // fallback
      let inverterToIDTSize = 185; // fallback
      let idtToPTDistance = 30; // fallback
      let idtToPTRuns = 4; // fallback
      let idtToPTSize = 240; // fallback
      let ptToPoCDistance = 120; // fallback
      let ptToPoCRuns = 4; // fallback
      let ptToPoCSize = 400; // fallback

      // Process selectedCables using the same logic that works in design summary
      if (acConfig.selectedCables && acConfig.selectedCables.size > 0) {
        // console.log('🔧 BOQ Data Mapping - Available cable keys:', Array.from(acConfig.selectedCables.keys()));
        
        // Debug: Check cable data extraction for IDT→PT and PT→PoC - DISABLED TO FIX INFINITE LOOP
        const allKeys = Array.from(acConfig.selectedCables.keys());
        // console.log('🔧 BOQ Data Mapping - All available cable keys:', allKeys);
        
        const ptRelatedKeys = allKeys.filter(key => {
          const lower = key.toLowerCase();
          return lower.includes('pt') || lower.includes('transformer') || lower.includes('poc') || lower.includes('grid') || lower.includes('connection');
        });
        // console.log('🔧 BOQ Data Mapping - PT/PoC related keys found:', ptRelatedKeys);
        
        // Debug: temporarily store keys for manual inspection
        // if (allKeys.length > 1) {
        //   console.log('🔧 AVAILABLE KEYS:', allKeys);
        // }
        
        acConfig.selectedCables.forEach((cableData, key) => {
          // console.log(`🔧 BOQ Data Mapping - Processing cable key: ${key}, length: ${cableData.length}m, runs: ${cableData.numberOfRuns}`);
          const lowerKey = key.toLowerCase();
          
          // Central Inverter to IDT cable
          if ((lowerKey.includes('output') && lowerKey.includes('idt')) || lowerKey.includes('central')) {
            inverterToIDTDistance = cableData.length;
            inverterToIDTRuns = cableData.numberOfRuns || 7;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            inverterToIDTSize = (cableData.cable as any)?.cross_section_mm2 || 185;
            // console.log(`   → Set Central INV→IDT = ${inverterToIDTDistance}m × ${inverterToIDTRuns} runs, ${inverterToIDTSize}mm²`);
          }
          // IDT to PT cable  
          else if (lowerKey.includes('idt') && (lowerKey.includes('transformer') || lowerKey.includes('pt'))) {
            idtToPTDistance = cableData.length;
            idtToPTRuns = cableData.numberOfRuns || 1; // MV cables typically 1 run per phase
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            idtToPTSize = (cableData.cable as any)?.cross_section_mm2 || 240;
            
            // Debug this specific extraction since we know this key exists - DISABLED TO PREVENT INFINITE LOOP
            // if (key.includes('idt_to_transformer')) {
            //   console.log(`🔧 IDT→PT EXTRACTION: key="${key}" → length=${cableData.length}, runs=${cableData.numberOfRuns}, cable=${JSON.stringify(cableData.cable)}`);
            // }
          }
          // PT to PoC cable - try multiple key patterns
          else if ((lowerKey.includes('transformer') || lowerKey.includes('pt')) && lowerKey.includes('poc')) {
            ptToPoCDistance = cableData.length;
            ptToPoCRuns = cableData.numberOfRuns || 4;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ptToPoCSize = (cableData.cable as any)?.cross_section_mm2 || 400;
            // console.log(`   ✅ MATCHED PT→PoC: key="${key}" → distance=${ptToPoCDistance}m, runs=${ptToPoCRuns}, size=${ptToPoCSize}mm²`);
          }
          // Additional pattern for PT to PoC
          else if (lowerKey.includes('grid') || lowerKey.includes('connection')) {
            ptToPoCDistance = cableData.length;
            ptToPoCRuns = cableData.numberOfRuns || 4;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ptToPoCSize = (cableData.cable as any)?.cross_section_mm2 || 400;
            // console.log(`   ✅ MATCHED PT→PoC (grid): key="${key}" → distance=${ptToPoCDistance}m, runs=${ptToPoCRuns}, size=${ptToPoCSize}mm²`);
          }
          else if (ptRelatedKeys.includes(key)) {
            // console.log(`   ❌ UNMATCHED PT-related key: "${key}" (lowerKey: "${lowerKey}") - check matching conditions`);
          }
        });
      }
      
      // console.log('🔧 BOQ Data Mapping - Final extracted values:');
      // console.log(`   IDT→PT: ${idtToPTDistance}m × ${idtToPTRuns} runs, ${idtToPTSize}mm²`);
      // console.log(`   PT→PoC: ${ptToPoCDistance}m × ${ptToPoCRuns} runs, ${ptToPoCSize}mm²`);
      
      // Extract PT to PoC breaker type for HV Central
      const ptToPoCBreakerTypeCentral = getActualBreakerType([
        'pt to poc', 'transformer to poc', 'pt-poc', 'transformer-poc', 'main output', 'grid connection'
      ]);
      
      return {
        ...baseInputs,
        numberOfCentralInverters: inverterCount,
        qtyOfIDTs: acConfig.hvCentralConfig?.idts?.count || acConfig.idtConfig?.count || 1, // Extract actual IDT count
        qtyOfPTs: acConfig.hvCentralConfig?.powerTransformer ? 1 : 0, // PT exists if powerTransformer object is present
        distanceInverterToIDT: inverterToIDTDistance,
        cableSizeInverterToIDT: inverterToIDTSize,
        runsPerPhaseInverterToIDT: inverterToIDTRuns,
        distanceIDTToPT: idtToPTDistance,
        cableSizeIDTToPT: idtToPTSize,
        runsPerPhaseIDTToPT: idtToPTRuns,
        distancePTToPoC: ptToPoCDistance,
        cableSizePTToPoC: ptToPoCSize,
        runsPerPhasePTToPoC: ptToPoCRuns,
        
        // IDT AND PT EQUIPMENT SPECIFICATIONS FOR HV CENTRAL
        idtPowerRatingMVA: acConfig.hvCentralConfig?.idts?.configurations?.[0]?.powerRating || acConfig.idtConfig?.powerRating || 2.0, // MVA (Central systems typically larger)
        ptPowerRatingMVA: acConfig.hvCentralConfig?.powerTransformer?.powerRating || acConfig.powerTransformerConfig?.powerRating || 0,
        ptVectorGrouping: acConfig.hvCentralConfig?.powerTransformer?.vectorGrouping || 'Dyn11', // vectorGrouping only exists in hvCentralConfig, not in powerTransformerConfig
        combinerPanelsPerIDT: 0, // Not applicable for central inverter systems
        ptToPoCBreakerType: ptToPoCBreakerTypeCentral,
      };
    }
  };

  // Location parameters
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.0060);
  const [timezone, setTimezone] = useState("America/New_York");
  const [country, setCountry] = useState("United States");
  const [city, setCity] = useState("New York");
  const [albedo, setAlbedo] = useState(0.2); // Default green grass albedo
  const [surfaceType, setSurfaceType] = useState<string>("Green grass (healthy, wet)");
  
  // Soil type for earthing calculations
  type SoilType = "saturated_clay" | "clay" | "loam" | "moist_sand" | "dry_sand" | "rock";
  const [soilType, setSoilType] = useState<SoilType>("loam"); // Default to loam
  
  // Meteo data source and project details
  const [meteoDataSource, setMeteoDataSource] = useState("nsrdb"); // Default to NSRDB
  const [projectApplication, setProjectApplication] = useState("Residential"); // Default to Residential
  const [projectInstallation, setProjectInstallation] = useState("ground-mount"); // Default to ground-mount

  // Project save/load state
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [projectName, setProjectName] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  
  // Temperature parameters for string sizing
  const [lowestTemperature, setLowestTemperature] = useState(-10); // Default -10°C
  const [highestTemperature, setHighestTemperature] = useState(60); // Default 60°C
  
  // DC configuration parameters
  const [useDCCombiner, setUseDCCombiner] = useState(false); // DC combiner box usage
  
  // String sizing data for DCDB calculations
  const [totalStringCount, setTotalStringCount] = useState(0);
  const [averageStringVoltage, setAverageStringVoltage] = useState(0);
  const [averageStringCurrent, setAverageStringCurrent] = useState(0);
  
  // BOQ data for PDF report
  const [boqDataForReport, setBoqDataForReport] = useState<Array<{
    slNo: number;
    description: string;
    specifications: string;
    unit: string;
    qty: string | number;
  }>>([]);
  
  // Comprehensive BOQ state for persistence
  const [comprehensiveBOQData, setComprehensiveBOQData] = useState<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generatedBOQ: Array<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mergedBOQ: Array<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pricedBOQ: Array<any>;
    generationTimestamp: string | null;
    pricingTimestamp: string | null;
    selectedAIModel: 'openai' | 'gemini';
    additionalCosts: Array<{
      id: number;
      name: string;
      percentage: number;
      enabled: boolean;
    }>;
  } | null>(null);
  
  // Financial data for AI Report
  const [financialParamsForReport, setFinancialParamsForReport] = useState<FinancialParams | null>(null);
  const [financialResultsForReport, setFinancialResultsForReport] = useState<FinancialResults | null>(null);
  
  // AI Report form data
  const [aiReportFormData, setAiReportFormData] = useState<ReportFormData | null>(null);
  const [aiGeneratedReport, setAiGeneratedReport] = useState<string | null>(null);
  
  // Central inverter specific data
  interface CentralStringSizingData {
    totalDCDBPerInverter: number;
    actualPVStringsPerDCDB: number;
    actualPVStringsPerMPPT: number;
    dcdbStringInputsPerDCDB: number;
    totalDCDBInSystem: number;
    dcdbConfiguration: {
      dcdbPerInverter: number;
      stringsPerDCDB: number;
      totalDCDBCount: number;
      mpptUtilization: number;
    };
  }
  const [centralStringSizingData, setCentralStringSizingData] = useState<CentralStringSizingData | null>(null);

  // BOQ visibility state
  const [showBOQ, setShowBOQ] = useState(false);
  const [structuralMaterials, setStructuralMaterials] = useState<{
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
  }[]>([]);

  // Electrical BOQ state
  const [electricalMaterials, setElectricalMaterials] = useState<{
    id: string;
    item: string;
    description: string;
    specifications: string;
    unit: string;
    quantity: number;
    category: string;
    connectionType: string;
    inverterType: string;
    areaIndex?: number;
    calculationBasis: string;
  }[]>([]);

  // DC Cable sizing data interfaces
  interface CableSizingData {
    cable?: {
      cross_section_mm2: string;
      [key: string]: unknown;
    };
    material?: string;
    length?: number;
    numberOfRuns?: number;
    voltageDropResults?: {
      voltageDrop: number;
      voltageDropPercentage: number;
      resistance: number;
      isAcceptable: boolean;
    };
    [key: string]: unknown;
  }
  
  const [dcStringCableData, setDcStringCableData] = useState<CableSizingData | null>(null);
  const [dcdbCableData, setDcdbCableData] = useState<CableSizingData | null>(null);
  
  // PV system parameters
  const [tilt, setTilt] = useState(30);
  const [azimuth, setAzimuth] = useState(180); // 180 = south
  const [arrayType, setArrayType] = useState(0); // 0 = Fixed (open rack)
  const [losses, setLosses] = useState(14.08); // Default value
  const [detailedLosses, setDetailedLosses] = useState<Record<string, number>>({});
  const [moduleEfficiency, setModuleEfficiency] = useState(0.2); // 20%
  const [performanceRatio, setPerformanceRatio] = useState(0.8); // 80%
  const [capacity, setCapacity] = useState(10); // 10 kW
  const [moduleArea, setModuleArea] = useState(1.7); // m�
  const [moduleWattPeak, setModuleWattPeak] = useState(400); // Wp
  
  // Component selection
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [selectedInverter, setSelectedInverter] = useState(null);
  
  // Area calculation results
  const [areaBasedLayout, setAreaBasedLayout] = useState(null);
  const [polygonConfigs, setPolygonConfigs] = useState([]);
  const [groundCoverageRatio, setGroundCoverageRatio] = useState(0.4); // Default GCR value
  
  // Inverter configuration
  const [inverterParams, setInverterParams] = useState<InverterParams | null>(null);
  const [dcAcRatio, setDcAcRatio] = useState(120); // Fixed value
  const [manualDcAcRatio, setManualDcAcRatio] = useState<number>(1.2); // Manual DC/AC ratio from user input
  const [manualInverterCount, setManualInverterCount] = useState<number>(1); // Manual inverter count from user input
  
  // State for detailed string sizing configuration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stringSizingSubArrays, setStringSizingSubArrays] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stringSizingInverterConfigs, setStringSizingInverterConfigs] = useState<any[]>([]);

  // Stable callback for string sizing data changes to prevent infinite loops
  const handleStringSizingDataChange = useCallback((data: {
    totalStringCount: number;
    averageStringVoltage: number;
    averageStringCurrent: number;
    totalCapacity: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subArrays?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inverterConfigs?: any[];
  }) => {
    setTotalStringCount(data.totalStringCount);
    setAverageStringVoltage(data.averageStringVoltage);
    setAverageStringCurrent(data.averageStringCurrent);
    // Save detailed configuration for project persistence
    if (data.subArrays) setStringSizingSubArrays(data.subArrays);
    if (data.inverterConfigs) setStringSizingInverterConfigs(data.inverterConfigs);
  }, []);

  // Stable callback for central string sizing data changes
  const handleCentralStringSizingDataChange = useCallback((data: CentralStringSizingData) => {
    setCentralStringSizingData(data);
  }, []);
  
  // Callback for comprehensive BOQ data updates
  const handleComprehensiveBOQDataUpdate = useCallback((data: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generatedBOQ: Array<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mergedBOQ: Array<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pricedBOQ: Array<any>;
    generationTimestamp: string | null;
    pricingTimestamp: string | null;
    selectedAIModel: 'openai' | 'gemini';
    additionalCosts: Array<{
      id: number;
      name: string;
      percentage: number;
      enabled: boolean;
    }>;
  }) => {
    console.log('📊 Received comprehensive BOQ data update:', {
      generatedBOQCount: data.generatedBOQ.length,
      mergedBOQCount: data.mergedBOQ.length,
      pricedBOQCount: data.pricedBOQ.length,
      generationTimestamp: data.generationTimestamp,
      pricingTimestamp: data.pricingTimestamp,
      selectedAIModel: data.selectedAIModel
    });
    setComprehensiveBOQData(data);
  }, []);
  
  // AC Side configuration
  const [acConfiguration, setACConfiguration] = useState<ACConfiguration | null>(null);
  
  // Results state
  const [results, setResults] = useState<SolarCalculationResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState("location");
  
  // Financial Analysis state
  const [totalProjectCost, setTotalProjectCost] = useState(0);
  
  // Map image state
  const [mapImage, setMapImage] = useState<string | null>(null);
  
  // Map image state
  const [capturedMapImage, setCapturedMapImage] = useState<string | null>(null);
  const [capturedMapMetadata, setCapturedMapMetadata] = useState<{
    totalCapacity?: number;
    moduleCount?: number;
    totalArea?: number;
    structureType?: string;
    timestamp?: Date;
  } | null>(null);

  // SLD image state
  const [capturedSLDImage, setCapturedSLDImage] = useState<string | null>(null);
  const [capturedSLDMetadata, setCapturedSLDMetadata] = useState<{
    connectionType: 'LV' | 'HV';
    systemSize: number;
    inverterType: string;
    timestamp: Date;
  } | null>(null);

  // Ref for AreaCalculator to access capture function
  const areaCalculatorRef = useRef<AreaCalculatorRef>(null);

  // Ref for ACSideConfiguration to access SLD capture function
  const acConfigRef = useRef<ACSideConfigurationRef>(null);

  // Calculate total inverter count and output parameters using manual values
  const calculateInverterParameters = () => {
    if (!selectedInverter || !capacity) {
      return {
        inverter_model: "Default Inverter",
        quantity: 1,
        dc_ac_ratio: 1.2,
        power: 5000,
        efficiency: 0.96
      };
    }
    
    const inverterPower = selectedInverter.nominal_ac_power_kw * 1000 || selectedInverter.max_power || selectedInverter.power_rating || 5000; // Use nominal AC power in Watts
    const efficiency = selectedInverter.efficiency || 0.96; // Default 96% efficiency
    
    return {
      inverter_model: selectedInverter.model || selectedInverter.name || "Selected Inverter",
      quantity: manualInverterCount, // Use manual inverter count
      dc_ac_ratio: manualDcAcRatio,  // Use manual DC/AC ratio
      power: inverterPower,
      efficiency: typeof efficiency === 'string' ? parseFloat(efficiency) / 100 : efficiency
    };
  };

  // Auto-save function (saves as draft)
  const handleAutoSave = useCallback(async () => {
    if (!user || !projectName || isSaving) return;

    try {
      setIsSaving(true);
      const progressPercentage = AdvancedCalculatorProjectService.calculateProgress({
        location: { address: city, latitude, longitude, timezone, country, city },
        selected_panel: selectedPanel,
        selected_inverter: selectedInverter,
        polygon_configs: polygonConfigs,
        dc_config: {
          totalStringCount,
          averageStringVoltage,
          averageStringCurrent,
          manualInverterCount,
          isCentralInverter: selectedInverter ? classifyInverterType(selectedInverter) === 'CENTRAL' : false,
          stringSizingSubArrays,
          stringSizingInverterConfigs,
        },
        ac_configuration: acConfiguration ? {
          ...acConfiguration,
          // Convert Maps to plain objects for database storage
          selectedBreakers: acConfiguration.selectedBreakers ? 
            Object.fromEntries(acConfiguration.selectedBreakers) : undefined,
          selectedCables: acConfiguration.selectedCables ? 
            Object.fromEntries(acConfiguration.selectedCables) : undefined,
        } : null,
        detailed_losses: detailedLosses,
        solar_results: results,
        consolidated_boq: boqDataForReport,
        comprehensive_boq_data: comprehensiveBOQData,
        financial_results: financialResultsForReport,
        ai_report_form: aiReportFormData,
      });

      const result = await AdvancedCalculatorProjectService.saveProject({
        id: currentProjectId || undefined,
        project_name: projectName,
        status: 'draft',
        location: {
          address: city,
          latitude,
          longitude,
          timezone,
          elevation: 0,
          country,
          state: '',
          city,
        },
        system_params: {
          capacity,
          tilt: polygonConfigs[0]?.tiltAngle || 30,
          azimuth: polygonConfigs[0]?.azimuth || 180,
          moduleEfficiency: selectedPanel?.efficiency_percent || 20,
          losses: losses,
          arrayType: getArrayTypeForStructure(polygonConfigs[0]?.structureType || 'fixed-tilt'),
          latitude,
          longitude,
          timezone,
          dcAcRatio: manualDcAcRatio,
          inverterCount: manualInverterCount,
          manualDcAcRatio,
        },
        selected_panel: selectedPanel,
        selected_inverter: selectedInverter,
        polygon_configs: polygonConfigs,
        dc_config: {
          totalStringCount,
          averageStringVoltage,
          averageStringCurrent,
          centralStringSizingData,
          dcStringCableData,
          dcdbCableData,
          manualInverterCount,
          isCentralInverter: selectedInverter ? classifyInverterType(selectedInverter) === 'CENTRAL' : false,
          stringSizingSubArrays, // Save detailed sub-array configuration
          stringSizingInverterConfigs, // Save MPPT assignments
        },
        ac_configuration: acConfiguration ? {
          ...acConfiguration,
          // Convert Maps to plain objects for database storage
          selectedBreakers: acConfiguration.selectedBreakers ? 
            Object.fromEntries(acConfiguration.selectedBreakers) : undefined,
          selectedCables: acConfiguration.selectedCables ? 
            Object.fromEntries(acConfiguration.selectedCables) : undefined,
        } : null,
        detailed_losses: detailedLosses,
        solar_results: results,
        consolidated_boq: boqDataForReport,
        comprehensive_boq_data: comprehensiveBOQData,
        boq_cost_summary: { totalCost: totalProjectCost },
        financial_params: financialParamsForReport,
        financial_results: financialResultsForReport,
        ai_report_form: aiReportFormData,
        ai_executive_summary: aiGeneratedReport,
        captured_map_image: capturedMapImage,
        captured_sld_image: capturedSLDImage,
        sld_metadata: capturedSLDMetadata,
        last_saved_tab: activeTab,
        progress_percentage: progressPercentage,
      }, user.id);

      if (result.success && result.projectId) {
        if (!currentProjectId) {
          setCurrentProjectId(result.projectId);
        }
        setLastSavedAt(new Date());
        console.log('✅ Auto-saved successfully');
      }
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [
    user, projectName, isSaving, city, latitude, longitude, timezone, country, capacity,
    polygonConfigs, selectedPanel, selectedInverter, manualDcAcRatio, manualInverterCount,
    losses, totalStringCount, averageStringVoltage, averageStringCurrent, centralStringSizingData,
    dcStringCableData, dcdbCableData, stringSizingSubArrays, stringSizingInverterConfigs,
    acConfiguration, detailedLosses,
    results, boqDataForReport, comprehensiveBOQData, totalProjectCost, financialParamsForReport, financialResultsForReport,
    aiReportFormData, aiGeneratedReport, capturedMapImage, capturedSLDImage, capturedSLDMetadata, activeTab, currentProjectId
  ]);

  // Auto-save functionality useEffect
  useEffect(() => {
    // Only auto-save if user is logged in, has a project name, and something has changed
    if (!user || !projectName || !latitude) return;

    const autoSaveTimer = setTimeout(() => {
      handleAutoSave();
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [
    projectName, latitude, longitude, city, country, selectedPanel, selectedInverter,
    polygonConfigs, results, acConfiguration, detailedLosses, boqDataForReport,
    comprehensiveBOQData, financialResultsForReport, user, handleAutoSave
  ]);

  // Load project from URL parameter
  useEffect(() => {
    const loadProjectFromURL = async () => {
      const projectId = searchParams.get('projectId');
      if (!projectId || !user || isLoadingProject) return;

      try {
        setIsLoadingProject(true);
        console.log('🔄 Loading project from URL:', projectId);
        toast.loading('Loading project...');

        const result = await AdvancedCalculatorProjectService.loadProject(projectId, user.id);

        if (result.success && result.project) {
          const project = result.project;
          console.log('✅ Project loaded:', project);

          // Update all states from the loaded project
          setProjectName(project.project_name);
          setCurrentProjectId(project.id || null);

          // Location data
          if (project.location) {
            setCity(project.location.address || project.location.city || '');
            setLatitude(project.location.latitude);
            setLongitude(project.location.longitude);
            setTimezone(project.location.timezone);
            setCountry(project.location.country || '');
          }

          // System params
          if (project.system_params) {
            setCapacity(project.system_params.capacity);
            setTilt(project.system_params.tilt);
            setAzimuth(project.system_params.azimuth);
            setModuleEfficiency(project.system_params.moduleEfficiency / 100);
            setLosses(project.system_params.losses);
            setArrayType(project.system_params.arrayType);
            setManualDcAcRatio(project.system_params.manualDcAcRatio || 1.2);
            setManualInverterCount(project.system_params.inverterCount || 1);
          }

          // Components
          if (project.selected_panel) setSelectedPanel(project.selected_panel);
          if (project.selected_inverter) setSelectedInverter(project.selected_inverter);

          // Area configuration
          if (project.polygon_configs) setPolygonConfigs(project.polygon_configs);

          // DC configuration
          if (project.dc_config) {
            setTotalStringCount(project.dc_config.totalStringCount || 0);
            setAverageStringVoltage(project.dc_config.averageStringVoltage || 0);
            setAverageStringCurrent(project.dc_config.averageStringCurrent || 0);
            // Restore manual inverter count from dc_config (overrides system_params value)
            if (project.dc_config.manualInverterCount) {
              console.log('🔄 Restoring manualInverterCount from dc_config:', project.dc_config.manualInverterCount);
              setManualInverterCount(project.dc_config.manualInverterCount);
            }
            if (project.dc_config.centralStringSizingData) {
              setCentralStringSizingData(project.dc_config.centralStringSizingData);
            }
            if (project.dc_config.dcStringCableData) {
              setDcStringCableData(project.dc_config.dcStringCableData);
            }
            if (project.dc_config.dcdbCableData) {
              setDcdbCableData(project.dc_config.dcdbCableData);
            }
            // Restore detailed string sizing configuration
            if (project.dc_config.stringSizingSubArrays) {
              setStringSizingSubArrays(project.dc_config.stringSizingSubArrays);
            }
            if (project.dc_config.stringSizingInverterConfigs) {
              setStringSizingInverterConfigs(project.dc_config.stringSizingInverterConfigs);
            }
          }

          // AC configuration - Convert plain objects back to Maps
          if (project.ac_configuration) {
            console.log('📦 Raw AC configuration from database:', {
              connectionType: project.ac_configuration.connectionType,
              pocVoltage: project.ac_configuration.pocVoltage,
              useIDT: project.ac_configuration.useIDT,
              hasSelectedBreakers: !!project.ac_configuration.selectedBreakers,
              selectedBreakersType: typeof project.ac_configuration.selectedBreakers,
              hasSelectedCables: !!project.ac_configuration.selectedCables,
              selectedCablesType: typeof project.ac_configuration.selectedCables,
              rawBreakers: project.ac_configuration.selectedBreakers,
              rawCables: project.ac_configuration.selectedCables
            });
            
            const acConfig = {
              ...project.ac_configuration,
              // Convert plain objects back to Maps
              selectedBreakers: project.ac_configuration.selectedBreakers ? 
                new Map(Object.entries(project.ac_configuration.selectedBreakers)) : undefined,
              selectedCables: project.ac_configuration.selectedCables ? 
                new Map(Object.entries(project.ac_configuration.selectedCables)) : undefined,
            };
            
            console.log('🔄 Restoring AC configuration with Maps:', {
              connectionType: acConfig.connectionType,
              breakersCount: acConfig.selectedBreakers?.size || 0,
              cablesCount: acConfig.selectedCables?.size || 0,
              breakersKeys: acConfig.selectedBreakers ? Array.from(acConfig.selectedBreakers.keys()) : [],
              cablesKeys: acConfig.selectedCables ? Array.from(acConfig.selectedCables.keys()) : []
            });
            
            setACConfiguration(acConfig);
          }

          // Losses
          if (project.detailed_losses) setDetailedLosses(project.detailed_losses);

          // Solar results
          if (project.solar_results) setResults(project.solar_results);

          // BOQ data
          if (project.consolidated_boq) setBoqDataForReport(project.consolidated_boq);
          if (project.comprehensive_boq_data) {
            console.log('📦 Loading comprehensive BOQ data:', project.comprehensive_boq_data);
            setComprehensiveBOQData(project.comprehensive_boq_data);
          }
          if (project.boq_cost_summary) setTotalProjectCost(project.boq_cost_summary.totalCost || 0);

          // Financial data
          if (project.financial_params) setFinancialParamsForReport(project.financial_params);
          if (project.financial_results) setFinancialResultsForReport(project.financial_results);
          
          // AI Report form data
          if (project.ai_report_form) setAiReportFormData(project.ai_report_form);
          if (project.ai_executive_summary) setAiGeneratedReport(project.ai_executive_summary);

          // Images
          if (project.captured_map_image) setCapturedMapImage(project.captured_map_image);
          if (project.captured_sld_image) setCapturedSLDImage(project.captured_sld_image);
          if (project.sld_metadata) setCapturedSLDMetadata(project.sld_metadata);

          // Set active tab to last saved tab or default to location
          if (project.last_saved_tab) {
            setActiveTab(project.last_saved_tab);
          }

          toast.dismiss();
          toast.success(`Project "${project.project_name}" loaded successfully!`);
        } else {
          toast.dismiss();
          toast.error(result.error || 'Failed to load project');
        }
      } catch (error) {
        console.error('❌ Error loading project:', error);
        toast.dismiss();
        toast.error('Failed to load project');
      } finally {
        setIsLoadingProject(false);
      }
    };

    loadProjectFromURL();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user]); // isLoadingProject intentionally omitted to prevent re-triggering

  // Final save function (saves as completed)
  const handleFinalSave = async () => {
    if (!user || !projectName) {
      toast.error("Please enter a project name to save");
      return;
    }

    try {
      setIsSaving(true);
      const progressPercentage = 100; // Mark as complete

      const result = await AdvancedCalculatorProjectService.saveProject({
        id: currentProjectId || undefined,
        project_name: projectName,
        status: 'completed',
        location: {
          address: city,
          latitude,
          longitude,
          timezone,
          elevation: 0,
          country,
          state: '',
          city,
        },
        system_params: {
          capacity,
          tilt: polygonConfigs[0]?.tiltAngle || 30,
          azimuth: polygonConfigs[0]?.azimuth || 180,
          moduleEfficiency: selectedPanel?.efficiency_percent || 20,
          losses: losses,
          arrayType: getArrayTypeForStructure(polygonConfigs[0]?.structureType || 'fixed-tilt'),
          latitude,
          longitude,
          timezone,
          dcAcRatio: manualDcAcRatio,
          inverterCount: manualInverterCount,
          manualDcAcRatio,
        },
        selected_panel: selectedPanel,
        selected_inverter: selectedInverter,
        polygon_configs: polygonConfigs,
        dc_config: {
          totalStringCount,
          averageStringVoltage,
          averageStringCurrent,
          centralStringSizingData,
          dcStringCableData,
          dcdbCableData,
          manualInverterCount,
          isCentralInverter: selectedInverter ? classifyInverterType(selectedInverter) === 'CENTRAL' : false,
          stringSizingSubArrays, // Save detailed sub-array configuration
          stringSizingInverterConfigs, // Save MPPT assignments
        },
        ac_configuration: acConfiguration ? {
          ...acConfiguration,
          // Convert Maps to plain objects for database storage
          selectedBreakers: acConfiguration.selectedBreakers ? 
            Object.fromEntries(acConfiguration.selectedBreakers) : undefined,
          selectedCables: acConfiguration.selectedCables ? 
            Object.fromEntries(acConfiguration.selectedCables) : undefined,
        } : null,
        detailed_losses: detailedLosses,
        solar_results: results,
        consolidated_boq: boqDataForReport,
        comprehensive_boq_data: comprehensiveBOQData,
        boq_cost_summary: { totalCost: totalProjectCost },
        financial_params: financialParamsForReport,
        financial_results: financialResultsForReport,
        ai_report_form: aiReportFormData,
        ai_executive_summary: aiGeneratedReport,
        captured_map_image: capturedMapImage,
        captured_sld_image: capturedSLDImage,
        sld_metadata: capturedSLDMetadata,
        last_saved_tab: activeTab,
        progress_percentage: progressPercentage,
      }, user.id);

      if (result.success) {
        if (!currentProjectId && result.projectId) {
          setCurrentProjectId(result.projectId);
        }
        setLastSavedAt(new Date());
        toast.success("Project saved successfully!");
      } else {
        toast.error(result.error || "Failed to save project");
      }
    } catch (error) {
      console.error('❌ Save failed:', error);
      toast.error(error instanceof Error ? error.message : "Failed to save project");
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for AC configuration changes
  const handleACConfigurationChange = (config: ACConfiguration) => {
    setACConfiguration(config);
    
    // Note: AC losses are now handled in the detailed losses configuration
    // No need to modify system losses here to avoid infinite loops
  };

  // Handler for manual DC/AC ratio change - memoized to prevent infinite loops
  const handleDcAcRatioChange = useCallback((ratio: number) => {
    setManualDcAcRatio(ratio);
    console.log("Manual DC/AC ratio updated:", ratio);
  }, []);

  // Handler for manual inverter count change - memoized to prevent infinite loops
  const handleInverterCountChange = useCallback((count: number) => {
    setManualInverterCount(count);
    console.log("Manual inverter count updated:", count);
  }, []);

  // Handler for albedo changes
  const handleAlbedoChange = useCallback((newAlbedo: number, newSurfaceType?: string) => {
    setAlbedo(newAlbedo);
    if (newSurfaceType) {
      setSurfaceType(newSurfaceType);
    }
    console.log("Albedo updated:", newAlbedo, "Surface type:", newSurfaceType);
  }, []);

  // Update module parameters when panel is selected - wrapped in useCallback to fix dependency issue
  const updateModuleParameters = useCallback(() => {
    if (selectedPanel) {
      // Extract panel dimensions and calculate area, with proper fallbacks
      let panelArea = 0;
      
      // First check for explicit panel_area_m2 field
      if (selectedPanel.panel_area_m2 && selectedPanel.panel_area_m2 > 0) {
        panelArea = selectedPanel.panel_area_m2;
        console.log(`Using panel_area_m2 directly: ${panelArea.toFixed(3)}m�`);
      } 
      // Then check for module_length and module_width fields (in mm)
      else if (selectedPanel.module_length && selectedPanel.module_width) {
        panelArea = (selectedPanel.module_length * selectedPanel.module_width) / 1000000;
        console.log(`Using module_length � module_width: ${panelArea.toFixed(3)}m�`);
      }
      // Then check for length and width fields (in mm)
      else if (selectedPanel.length && selectedPanel.width) {
        panelArea = (selectedPanel.length * selectedPanel.width) / 1000000;
        console.log(`Using length � width: ${panelArea.toFixed(3)}m�`);
      }
      // Finally fall back to standard dimensions
      else {
        const defaultLength = 1700; // mm
        const defaultWidth = 1000; // mm
        panelArea = (defaultLength * defaultWidth) / 1000000;
        console.log(`Using default dimensions: ${panelArea.toFixed(3)}m�`);
      }
      
      // Correctly extract panel efficiency from all possible fields
      let panelEfficiency = 20; // default fallback %
      
      if (selectedPanel.efficiency_percent && selectedPanel.efficiency_percent > 0) {
        panelEfficiency = selectedPanel.efficiency_percent;
        console.log(`Using panel efficiency_percent: ${panelEfficiency}%`);
      } else if (selectedPanel.efficiency && selectedPanel.efficiency > 0) {
        // Handle efficiency as decimal or percentage
        panelEfficiency = selectedPanel.efficiency > 1 ? selectedPanel.efficiency : selectedPanel.efficiency * 100;
        console.log(`Using panel efficiency: ${panelEfficiency}%`);
      }
      
      // Enhanced panel power extraction
      let panelPower = 0;
      
      console.log('SelectedPanel object:', selectedPanel);
      
      const possiblePowerFields = [
        'nominal_power_w',
        'power_rating',
        'power',
        'wattage',
        'watt_peak',
        'max_power',
        'pmax',
        'rated_power',
        'module_power',
        'wp',
        'w',
      ];
      
      for (const field of possiblePowerFields) {
        let value = selectedPanel[field];
        if (typeof value === 'string') {
          value = parseFloat(value.replace(/[^\d.]/g, ''));
        }
        if (typeof value === 'number' && value > 0) {
          panelPower = value;
          console.log(`Panel power found in field '${field}':`, panelPower);
          break;
        }
      }
      
      // Handle the specific error case (34kW bug)
      if (panelPower > 30000 && panelPower < 40000) {
        panelPower = panelPower / 100;
        console.log(`Converting specific error case panel from 34kW to ${panelPower}W`);
      }
      
      if (!panelPower || panelPower <= 0) {
        // Calculate power from area and efficiency as fallback
        panelPower = Math.round(panelArea * 1000 * panelEfficiency);
        console.warn('No power value available - calculating from area and efficiency:', panelPower);
      }
      
      setModuleArea(panelArea);
      setModuleEfficiency(panelEfficiency / 100);
      setModuleWattPeak(panelPower);
      
      console.log(`Panel parameters updated: ${panelArea.toFixed(2)}m�, ${panelEfficiency}%, ${panelPower}W`);
    }
  }, [selectedPanel, setModuleArea, setModuleEfficiency, setModuleWattPeak]);

  // When components are selected, automatically go to location tab
  useEffect(() => {
    if (selectedPanel && selectedInverter) {
      updateModuleParameters();
    }
  }, [selectedPanel, selectedInverter, updateModuleParameters]);

  // Scroll to top when tab changes for better UX
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [activeTab]);

  // Enhance the handleAreaCalculation function with additional debugging and safeguards
  const handleAreaCalculation = (capacityKw: number, areaM2: number, moduleCount: number, configs?: PolygonConfig[]) => {
    console.log("Area calculation received:", { capacityKw, areaM2, moduleCount, configCount: configs?.length });
    
    // Validate incoming data
    if (isNaN(capacityKw) || capacityKw === undefined) {
      console.error("Invalid capacity value received:", capacityKw);
      capacityKw = 0;
    }
    
    if (moduleCount > 0 && capacityKw === 0) {
      console.warn("Modules placed but capacity is zero - recalculating");
      // More robust panel power determination with improved consistency
      console.log("Selected panel for capacity calculation:", selectedPanel);
      
      let panelPower = 0;
      
      // Check for nominal_power_w first as it's the most reliable source
      if (selectedPanel?.nominal_power_w && selectedPanel.nominal_power_w > 0) {
        panelPower = selectedPanel.nominal_power_w;
        console.log(`Using nominal_power_w: ${panelPower}W`);
      }
      // ONLY handle the specific edge case of 34kW panels
      else if (selectedPanel?.power_rating && selectedPanel.power_rating > 30000 && selectedPanel.power_rating < 40000) {
        panelPower = selectedPanel.power_rating / 100; // Convert from 34000W to 340W
        console.log(`Converting specific error case panel from ${selectedPanel.power_rating}W to ${panelPower}W`);
      } 
      else if (selectedPanel?.power && selectedPanel.power > 30000 && selectedPanel.power < 40000) {
        panelPower = selectedPanel.power / 100; // Convert from 34000W to 340W
        console.log(`Converting specific error case panel from ${selectedPanel.power}W to ${panelPower}W`);
      }
      // For all other values, use the actual power values
      else if (selectedPanel?.power_rating && selectedPanel.power_rating > 0) {
        panelPower = selectedPanel.power_rating;
        console.log(`Using actual panel power_rating: ${panelPower}W`);
      } 
      else if (selectedPanel?.power && selectedPanel.power > 0) {
        panelPower = selectedPanel.power;
        console.log(`Using actual panel power: ${panelPower}W`);
      } 
      else {
        // Use default panel power if no valid value found
        panelPower = 400;
        console.warn("No valid panel power found, using default:", panelPower);
      }
      
      // Calculate capacity with the extracted power value
      capacityKw = (moduleCount * panelPower) / 1000;
      console.log("Recalculated capacity:", capacityKw.toFixed(2), "kW from", moduleCount, "modules at", panelPower, "W each");
    }
    
    setCapacity(capacityKw);
    if (configs) {
      setPolygonConfigs(configs);
      
      // Calculate Ground Coverage Ratio (GCR)
      const totalModuleArea = configs.reduce((sum, config) => sum + config.moduleCount, 0) * (selectedPanel?.panel_area_m2 || moduleArea);
      const totalGroundArea = configs.reduce((sum, config) => sum + config.area, 0);
      const calculatedGCR = totalGroundArea > 0 ? totalModuleArea / totalGroundArea : 0.4;
      setGroundCoverageRatio(Math.min(Math.max(calculatedGCR, 0.01), 0.99)); // Clamp to PVWatts range
      
      console.log(`📊 Calculated GCR: ${calculatedGCR.toFixed(3)} (Module area: ${totalModuleArea.toFixed(1)} m², Ground area: ${totalGroundArea.toFixed(1)} m²)`);
    }
  };

  const handleCalculate = async () => {
    if (!latitude || !longitude || !capacity) {
      toast.error("Please provide location and system capacity");
      return;
    }

    if (!selectedPanel) {
      toast.error("Please select a solar panel");
      return;
    }

    setCalculating(true);
    
    try {
      console.log("Starting calculation with parameters:", {
        capacity,
        tilt,
        azimuth,
        losses,
        albedo,
        surfaceType,
        groundCoverageRatio,
        polygonConfigs: polygonConfigs?.length
      });

      let calculationResults;

      if (polygonConfigs && polygonConfigs.length > 0) {
        console.log("Using multiple polygon configurations for calculation");
        
        const pvSystemsParams: MultiplePVSystemsParams = {
          latitude,
          longitude,
          timezone,
          module_efficiency: moduleEfficiency,
          performance_ratio: performanceRatio,
          module_area: moduleArea,
          module_watt_peak: moduleWattPeak,
          inverterParams: calculateInverterParameters(),
          losses: losses,
          bifaciality: selectedPanel?.bifaciality || undefined,
          albedo: albedo,
        gcr: groundCoverageRatio,
          pvSystems: polygonConfigs.map((config, index) => ({
            structureType: config.structureType,
            area: config.area,
            moduleCount: config.moduleCount,
            capacityKw: config.capacityKw,
            azimuth: config.azimuth,
            tiltAngle: config.tiltAngle
          }))
        };
        
        calculationResults = await calculateMultiplePVSystems(pvSystemsParams);
        console.log("Multiple PV systems calculation completed:", calculationResults);
      } else {
        console.log("Using single system calculation");
        
        const solarParams: SolarParams = {
          plant_capacity_kw: capacity,
          surface_tilt: tilt,
          surface_azimuth: azimuth,
          latitude,
          longitude,
          timezone,
          array_type: arrayType,
          losses,
          module_efficiency: moduleEfficiency,
          performance_ratio: performanceRatio,
          module_area: moduleArea,
          module_watt_peak: moduleWattPeak,
          bifaciality: selectedPanel?.bifaciality || undefined,
          albedo: albedo,
          gcr: groundCoverageRatio
        };

        calculationResults = await calculateSolarEnergyWithPVWatts(solarParams);
        console.log("Single system calculation completed:", calculationResults);
      }

      setResults(calculationResults);
              setActiveTab("results"); // Navigate to results after calculation
      toast.success("Solar energy calculation completed!");
      
    } catch (error) {
      console.error("Calculation error:", error);
      toast.error("Failed to calculate solar energy production");
    } finally {
      setCalculating(false);
    }
  };
  
  const handleMapImageCaptured = (imageDataUrl: string, metadata?: {
    totalCapacity?: number;
    moduleCount?: number;
    totalArea?: number;
    structureType?: string;
    timestamp?: Date;
  }) => {
    setCapturedMapImage(imageDataUrl);
    if (metadata) {
      setCapturedMapMetadata(metadata);
      console.log("Map image captured and stored with metadata:", metadata);
    } else {
      console.log("Map image captured and stored");
    }
  };

  const handleSLDImageCaptured = (imageDataUrl: string, metadata: {
    connectionType: 'LV' | 'HV';
    systemSize: number;
    inverterType: string;
    timestamp: Date;
  }) => {
    setCapturedSLDImage(imageDataUrl);
    setCapturedSLDMetadata(metadata);
    console.log("SLD image captured and stored with metadata:", metadata);
    // Show success feedback
    import('sonner').then(({ toast }) => {
      toast.success(`${metadata.connectionType} SLD captured successfully!`);
    });
  };

  // Helper function to classify inverter type based on power rating
  const classifyInverterType = (inverter: {
    nominal_ac_power_kw?: number;
    ac_power_rating_w?: number;
    power_rating?: number;
    rated_power?: number;
    [key: string]: unknown;
  } | null): 'STRING' | 'CENTRAL' => {
    if (!inverter) return 'STRING';
    
    // Get power rating from various possible property names
    const powerKW = inverter.nominal_ac_power_kw || 
                   inverter.ac_power_rating_w / 1000 || 
                   inverter.power_rating / 1000 || 
                   inverter.rated_power / 1000 || 
                   0;
    
    return powerKW >= 500 ? 'CENTRAL' : 'STRING';
  };

  // Check if current inverter is central type
  const isCentralInverter = selectedInverter ? classifyInverterType(selectedInverter) === 'CENTRAL' : false;

  // Reset handlers
  const handleResetAll = useCallback(() => {
    if (window.confirm('⚠️ Reset entire calculator? This will clear all data and cannot be undone.')) {
      // Reset all states to initial values
      setSelectedPanel(null);
      setSelectedInverter(null);
      setCapacity(0);
      setTilt(null);
      setAzimuth(null);
      setPolygonConfigs([]);
      setResults(null);
      setDetailedLosses(null);
      setTotalStringCount(0);
      setAverageStringVoltage(0);
      setAverageStringCurrent(0);
      setCentralStringSizingData(null);
      setDcStringCableData(null);
      setDcdbCableData(null);
      setACConfiguration(null);
      setBoqDataForReport([]);
      setTotalProjectCost(0);
      setActiveTab('location');
      
      toast.success('Calculator reset successfully');
      console.log('🔄 Calculator reset - all data cleared');
    }
  }, []);

  const handleResetCurrentTab = useCallback(() => {
    const tabNames: Record<string, string> = {
      'components': 'PV Selection',
      'location': 'Location',
      'areas': 'PV Areas',
      'dcconfig': 'DC Configuration',
      'acconfig': 'AC Configuration',
      'summary': 'Design Summary',
      'losses': 'Losses',
      'results': 'Results',
      'boq': 'BOQ',
      'detailed-boq': 'AI BOQ',
      'financials': 'Financials'
    };

    const currentTabName = tabNames[activeTab] || 'Current Tab';
    
    if (window.confirm(`Reset ${currentTabName}? This will clear data for this section only.`)) {
      switch(activeTab) {
        case 'components':
          setSelectedPanel(null);
          setSelectedInverter(null);
          setCapacity(0);
          toast.success('PV Selection reset');
          break;
        case 'location':
          toast.info('Location data persists for the session');
          break;
        case 'areas':
          setPolygonConfigs([]);
          setCapacity(0);
          toast.success('PV Areas reset');
          break;
        case 'dcconfig':
          setTotalStringCount(0);
          setAverageStringVoltage(0);
          setAverageStringCurrent(0);
          setCentralStringSizingData(null);
          setDcStringCableData(null);
          setDcdbCableData(null);
          toast.success('DC Configuration reset');
          break;
        case 'acconfig':
          setACConfiguration(null);
          toast.success('AC Configuration reset');
          break;
        case 'losses':
          setDetailedLosses(null);
          toast.success('Losses configuration reset');
          break;
        case 'results':
          setResults(null);
          toast.success('Results cleared');
          break;
        default:
          toast.info(`No reset action defined for ${currentTabName}`);
      }
      
      console.log(`🔄 ${currentTabName} reset`);
    }
  }, [activeTab]);

  return (
    <div className="w-full max-w-[1800px] mx-auto pb-8 px-6">
      {/* Header with Credit Balance and Reset Buttons */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sun className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-[#D97706] to-[#B45309] text-transparent bg-clip-text">BAESS Labs</span>
            <span className="text-gray-400"> | </span>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">PV AI Designer Pro</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* AI Credit Balance Display */}
          <AICreditBalance compact showUpgradePrompt={false} />
          
          <Button
            onClick={handleResetCurrentTab}
            variant="outline"
            size="sm"
            className="gap-2 border-orange-400 text-orange-600 hover:bg-orange-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Current Tab
          </Button>
          <Button
            onClick={handleResetAll}
            variant="outline"
            size="sm"
            className="gap-2 border-red-400 text-red-600 hover:bg-red-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset All
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex justify-center mx-auto">
          <TabsTrigger value="location">
            <MapPin className="h-4 w-4 mr-2" />
            Location
          </TabsTrigger>
          <TabsTrigger value="components">
            <Calculator className="h-4 w-4 mr-2" />
            PV Select
          </TabsTrigger>
          <TabsTrigger value="areas" disabled={!selectedPanel}>
            <Layers className="h-4 w-4 mr-2" />
            PV Areas
          </TabsTrigger>
          <TabsTrigger value="dcconfig" disabled={!capacity || !(polygonConfigs && polygonConfigs.length > 0)}>
            <Power className="h-4 w-4 mr-2" />
            DC Config
          </TabsTrigger>
          <TabsTrigger value="acconfig" disabled={!selectedInverter}>
            <Zap className="h-4 w-4 mr-2" />
            AC Config
          </TabsTrigger>
          <TabsTrigger value="summary" disabled={!selectedInverter}>
            <FileText className="h-4 w-4 mr-2" />
            Design Summary
          </TabsTrigger>
          <TabsTrigger value="losses" disabled={!selectedInverter}>
            <Activity className="h-4 w-4 mr-2" />
            Losses
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!results}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
          {/* Hidden: BOQ Debug tab - kept in code for development */}
          <TabsTrigger value="boq-debug" disabled={!results} className="hidden">
            <Bot className="h-4 w-4 mr-2" />
            BOQ Debug
          </TabsTrigger>
          {/* Hidden: BOQ Gen tab - kept in code for development */}
          <TabsTrigger value="boq" disabled={!results} className="hidden">
            <Receipt className="h-4 w-4 mr-2" />
            BOQ Gen
          </TabsTrigger>
          <TabsTrigger value="detailed-boq" disabled={!results}>
            <Bot className="h-4 w-4 mr-2" />
            AI BOQ
          </TabsTrigger>
          <TabsTrigger value="financials" disabled={!results || totalProjectCost <= 0}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Financials
          </TabsTrigger>
          <TabsTrigger value="ai-report" disabled={!results || !boqDataForReport || boqDataForReport.length === 0}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI Report
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="components">
          <div className="xl:max-w-6xl xl:mx-auto">
            <ComponentSelector 
              onPanelSelect={setSelectedPanel}
              selectedPanel={selectedPanel}
            />
            
            {/* Modern Navigation Buttons */}
            <div className="flex justify-between items-center mt-8">
              <Button
                onClick={() => setActiveTab("location")}
                variant="outline"
                className="group px-6 py-3 rounded-xl font-semibold border-2 hover:border-blue-400 hover:shadow-lg transition-all duration-300"
              >
                <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Back to Location
              </Button>
              <Button
                onClick={() => setActiveTab("areas")}
                disabled={!selectedPanel || !latitude || !longitude}
                className="group relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 text-white font-bold px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 text-lg overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative flex items-center gap-3">
                  Continue to PV Areas
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="location">
          <div className="xl:max-w-6xl xl:mx-auto">
            {/* Modern Hero Header */}
            <div className="relative mb-6 overflow-hidden rounded-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 opacity-90"></div>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTEwIDIwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00ek0yNiAzNGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
              <div className="relative p-8">
                <div className="flex items-center gap-4 mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white rounded-xl blur-lg opacity-30"></div>
                    <div className="relative p-4 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 shadow-2xl">
                      <MapPin className="h-8 w-8 text-white" />
                  </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Location Settings</h2>
                    <p className="text-blue-50 mt-1.5 text-sm font-medium">Configure your project location and environmental parameters</p>
                  </div>
                </div>
              </div>
              </div>
              
            <div className="space-y-6">
              <LocationInputs 
                projectName={projectName}
                setProjectName={setProjectName}
                latitude={latitude}
                longitude={longitude}
                timezone={timezone}
                country={country}
                city={city}
                albedo={albedo}
                surfaceType={surfaceType}
                soilType={soilType}
                meteoDataSource={meteoDataSource}
                projectApplication={projectApplication}
                projectInstallation={projectInstallation}
                lowestTemperature={lowestTemperature}
                highestTemperature={highestTemperature}
                setLatitude={setLatitude}
                setLongitude={setLongitude}
                setTimezone={setTimezone}
                setCountry={setCountry}
                setCity={setCity}
                setAlbedo={handleAlbedoChange}
                setSoilType={setSoilType}
                setMeteoDataSource={setMeteoDataSource}
                setProjectApplication={setProjectApplication}
                setProjectInstallation={setProjectInstallation}
                setLowestTemperature={setLowestTemperature}
                setHighestTemperature={setHighestTemperature}
              />
              </div>
            
            {/* Modern Continue Button */}
            <div className="mt-8 flex justify-end">
              <Button
                disabled={!projectName || !latitude || !longitude}
                onClick={() => {
                  if (!projectName) {
                    toast.error("Please enter a project name before continuing");
                    return;
                  }
                  setActiveTab("components");
                }}
                className="group relative bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:from-blue-700 hover:via-cyan-600 hover:to-teal-600 text-white font-bold px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 text-lg overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative flex items-center gap-3">
                  {!projectName ? "Enter Project Name to Continue" : "Continue to PV Select"}
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="areas">
          {selectedPanel ? (
            <>
            <AreaCalculator 
              ref={areaCalculatorRef}
              selectedPanel={selectedPanel} 
              onCapacityCalculated={handleAreaCalculation}
              onMapImageCaptured={handleMapImageCaptured}
              latitude={latitude}
              longitude={longitude}
              initialPolygonConfigs={polygonConfigs}
            />
              
              {/* Enhanced PV Areas Summary */}
              {polygonConfigs && polygonConfigs.length > 0 && (
            <Card className="mt-2 border-0 shadow-lg bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-slate-600 to-gray-700 text-white">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded backdrop-blur-sm">
                    <Grid3X3 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Multiple Installation Areas</h3>
                    <p className="text-slate-200 text-xs">Summary of all designed PV installation zones</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-3">
                <div className="overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-slate-100">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Area</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Structure Type</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Size (m²)</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Azimuth</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Tilt</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Modules</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Tables</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Capacity (kWp)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {polygonConfigs.map((config, index) => {
                          // Get structure type colors
                          const getStructureColor = (type: string) => {
                            switch (type) {
                              case 'ballasted': return 'bg-blue-50 text-blue-700';
                              case 'fixed_tilt': return 'bg-emerald-50 text-emerald-700';
                              case 'ground_mount_tables': return 'bg-amber-50 text-amber-700';
                              case 'carport': return 'bg-purple-50 text-purple-700';
                              case 'pv_table_free_form': return 'bg-rose-50 text-rose-700';
                              default: return 'bg-gray-50 text-gray-700';
                            }
                          };
                          
                          const azimuthValue = config.azimuth !== undefined && !isNaN(config.azimuth) ? config.azimuth : 180;
                          const tiltValue = config.tiltAngle !== undefined && !isNaN(config.tiltAngle) ? config.tiltAngle : 10;
                          
                          return (
                            <tr key={`poly-${index}`} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                                  <span className="text-xs font-medium text-gray-900">Area {index + 1}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStructureColor(config.structureType)}`}>
                                  {config.structureType === 'ballasted' && 'Ballasted Roof'}
                                  {config.structureType === 'fixed_tilt' && 'Fixed Tilt Elevated'}
                                  {config.structureType === 'ground_mount_tables' && 'Ground Mount Tables'}
                                  {config.structureType === 'carport' && 'Carport Structure'}
                                  {config.structureType === 'pv_table_free_form' && 'PV Table - Free Form'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs text-right font-medium text-gray-900">{config.area.toFixed(1)}</td>
                              <td className="px-3 py-2 text-xs text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                  <Compass className="w-3 h-3" />
                                  {azimuthValue.toFixed(0)}°
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                                  <RotateCcw className="w-3 h-3" />
                                  {tiltValue.toFixed(0)}°
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs text-right font-bold text-gray-900">{config.moduleCount}</td>
                              <td className="px-3 py-2 text-right">
                                {config.tableCount !== undefined && config.tableCount > 0 ? config.tableCount : '-'}
                              </td>
                              <td className="px-3 py-2 text-xs text-right">
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-bold">
                                  <Zap className="w-3 h-3" />
                                  {config.capacityKw.toFixed(1)} kWp
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="border-t-2 font-semibold bg-gradient-to-r from-gray-100 to-slate-200">
                          <td className="px-3 py-2 text-xs" colSpan={2}>
                            <span className="inline-flex items-center gap-1 font-bold text-gray-900">
                              <BarChart3 className="w-3 h-3" />
                              TOTAL
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-right font-bold text-gray-900">{polygonConfigs.reduce((sum, config) => sum + config.area, 0).toFixed(1)} m²</td>
                          <td className="px-3 py-2 text-xs text-center text-gray-500">Mixed</td>
                          <td className="px-3 py-2 text-xs text-center text-gray-500">Mixed</td>
                          <td className="px-3 py-2 text-xs text-right font-bold text-gray-900">{polygonConfigs.reduce((sum, config) => sum + config.moduleCount, 0)}</td>
                          <td className="px-3 py-2 text-xs text-right">
                            {polygonConfigs.reduce((sum, config) => sum + (config.tableCount || 0), 0)}
                          </td>
                          <td className="px-3 py-2 text-xs text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded text-xs font-bold">
                              <Zap className="w-3 h-3" />
                              {polygonConfigs.reduce((sum, config) => sum + config.capacityKw, 0).toFixed(1)} kWp
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* BOQ Toggle Button */}
          {polygonConfigs && polygonConfigs.length > 0 && (
            <div className="mt-6 text-center">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 rounded-lg blur-sm opacity-70 animate-pulse"></div>
                <Button
                  disabled
                  size="lg"
                  className="relative bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-500 text-gray-900 font-bold border-0 hover:from-orange-600 hover:via-amber-500 hover:to-yellow-600 cursor-not-allowed"
                >
                  <Receipt className="h-5 w-5 mr-2" />
                  ☀️ 3D Modelling Coming Soon
                </Button>
              </div>
              <p className="text-sm font-semibold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent mt-3">
                ✨ Enables user to create 3D scene and near shading analysis
              </p>
            </div>
          )}
            </>
          ) : (
            <div className="p-8 text-center">
              <p>Please select a panel before defining array areas.</p>
              <Button
                onClick={() => setActiveTab("components")}
                className="mt-4"
              >
                Go to PV Select
              </Button>
            </div>
          )}
          
          {/* Structural Material Calculator - Hidden from user view, data still calculated */}
          {polygonConfigs && polygonConfigs.length > 0 && selectedPanel && showBOQ && (
            <div className="hidden">
              <StructuralMaterialCalculator 
                polygonConfigs={polygonConfigs}
                selectedPanel={selectedPanel}
                onMaterialsCalculated={setStructuralMaterials}
              />
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            <Button
              onClick={() => setActiveTab("components")}
              variant="outline"
            >
              Back to PV Select
            </Button>
            <Button
              onClick={async () => {
                // Auto-capture PV area layout before navigating to next tab
                if (areaCalculatorRef.current && polygonConfigs && polygonConfigs.length > 0) {
                  console.log("🎨 Auto-capturing PV area layout before navigation...");
                  try {
                    await areaCalculatorRef.current.captureMap();
                    console.log("✅ Auto-capture successful!");
                  } catch (error) {
                    console.error("❌ Auto-capture failed:", error);
                    // Continue navigation even if capture fails
                  }
                }
                setActiveTab("dcconfig");
              }}
              className="bg-primary"
              disabled={!latitude || !longitude || !capacity || !(polygonConfigs && polygonConfigs.length > 0)}
            >
              Continue to DC Config
            </Button>
          </div>
        </TabsContent>

        {/* DC Config Tab */}
        <TabsContent value="dcconfig">
          <div className="xl:max-w-6xl xl:mx-auto">
            {/* Simple Hero Header */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-2 border-blue-200/50 mb-6">
              <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
              <CardHeader className="pb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg">
                    <Power className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">DC Configuration</h2>
                    <p className="text-muted-foreground mt-1">Configure your inverter, string sizing, and DC distribution system</p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="space-y-6">
              <InverterSelector
                selectedInverter={selectedInverter || null}
                onInverterSelect={setSelectedInverter}
                selectedPanel={selectedPanel}
                totalSystemCapacity={capacity}
                initialInverterCount={manualInverterCount}
                onManualInverterCountChange={useCallback((count: number, ratio: number) => {
                  setManualInverterCount(count);
                  setManualDcAcRatio(ratio);
                  handleInverterCountChange(count);
                  handleDcAcRatioChange(ratio);
                }, [handleInverterCountChange, handleDcAcRatioChange])}
              />

            {/* String Sizing Section */}
            {selectedInverter && selectedPanel && (
              <>
                {/* Common String Sizing (Module Selection & Basic Calculations) */}
                <EnhancedStringSizingCalculator
                  selectedPanel={selectedPanel}
                  selectedInverter={selectedInverter}
                  lowestTemperature={lowestTemperature}
                  highestTemperature={highestTemperature}
                  polygonConfigs={polygonConfigs}
                  manualInverterCount={manualInverterCount}
                  capacity={capacity}
                  showMPPTAssignment={!isCentralInverter} // Hide MPPT assignment for central inverters
                  onStringSizingDataChange={handleStringSizingDataChange}
                  initialSubArrays={stringSizingSubArrays.length > 0 ? stringSizingSubArrays : undefined}
                  initialInverterConfigs={stringSizingInverterConfigs.length > 0 ? stringSizingInverterConfigs : undefined}
                />

                {/* Central Inverter: Additional DCDB-based String Assignment */}
                {isCentralInverter && totalStringCount > 0 && (
                  <CentralInverterStringSizing
                    selectedInverter={selectedInverter}
                    selectedPanel={selectedPanel}
                    polygonConfigs={polygonConfigs}
                    lowestTemperature={lowestTemperature}
                    highestTemperature={highestTemperature}
                    capacity={capacity}
                    totalInverters={manualInverterCount}
                    totalEstimatedPVStrings={totalStringCount} // Pass the already calculated string count
                    averageStringVoltage={averageStringVoltage}
                    averageStringCurrent={averageStringCurrent}
                    onCentralStringSizingData={handleCentralStringSizingDataChange}
                    initialConfiguration={centralStringSizingData} // Pass saved configuration for restoration
                  />
                )}
              </>
            )}

            {/* DC Distribution Configuration - Only for Central Inverters */}
            {isCentralInverter && selectedInverter && selectedPanel && totalStringCount > 0 && centralStringSizingData && (
              <DCDBSizingCalculator
                selectedInverter={selectedInverter}
                selectedPanel={selectedPanel}
                polygonConfigs={polygonConfigs}
                totalStringCount={totalStringCount}
                totalSystemCapacity={capacity}
                averageStringVoltage={averageStringVoltage}
                averageStringCurrent={averageStringCurrent}
                lowestTemperature={lowestTemperature}
                highestTemperature={highestTemperature}
                centralInverterData={centralStringSizingData}
              />
            )}

            {/* Section Separator */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50 px-6 py-2.5 rounded-full shadow-md border-2 border-blue-200/50">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 shadow-sm">
                      <Cable className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">DC Cable Sizing & Distribution</span>
                  </div>
                </div>
              </div>
            </div>

            {/* DC String Cable Sizing Section */}
            {selectedInverter && selectedPanel && totalStringCount > 0 && (
              <DCStringSizingCalculator
                selectedPanel={selectedPanel}
                selectedInverter={selectedInverter}
                totalStringCount={totalStringCount}
                averageStringCurrent={averageStringCurrent}
                averageStringVoltage={averageStringVoltage}
                initialCableData={dcStringCableData || undefined}
                          onCableSizingComplete={(data) => {
            console.log('DC String Cable Sizing Complete:', data);
            setDcStringCableData(data);
          }}
              />
            )}

            {/* DCDB to Inverter Cable Sizing Section - Only for Central Inverters */}
            {isCentralInverter && selectedInverter && selectedPanel && totalStringCount > 0 && centralStringSizingData && (
              <DCDBCableSizing
                selectedPanel={selectedPanel}
                selectedInverter={selectedInverter}
                centralInverterData={centralStringSizingData as unknown as Record<string, unknown>}
                averageStringCurrent={averageStringCurrent}
                averageStringVoltage={averageStringVoltage}
                initialCableData={dcdbCableData || undefined}
                          onCableSizingComplete={(data) => {
            console.log('DCDB Cable Sizing Complete:', data);
            setDcdbCableData(data);
          }}
              />
            )}

            {/* DC BOQ Calculator - Hidden from user view, data still calculated */}
            {selectedInverter && selectedPanel && totalStringCount > 0 && polygonConfigs && polygonConfigs.length > 0 && (
              <div className="hidden">
                <DCBOQCalculator
                  selectedPanel={selectedPanel}
                  selectedInverter={selectedInverter}
                  totalStringCount={totalStringCount}
                  averageStringCurrent={averageStringCurrent}
                  averageStringVoltage={averageStringVoltage}
                  manualInverterCount={manualInverterCount}
                  capacity={capacity}
                  isCentralInverter={isCentralInverter}
                  polygonConfigs={polygonConfigs}
                  centralStringSizingData={centralStringSizingData}
                  dcStringCableData={dcStringCableData}
                  dcdbCableData={dcdbCableData}
                />
              </div>
            )}
          </div>
          
            {/* Modern Navigation Buttons */}
            <div className="flex justify-between items-center mt-8">
            <Button
              onClick={() => setActiveTab("areas")}
              variant="outline"
                className="group px-6 py-3 rounded-xl font-semibold border-2 hover:border-blue-400 hover:shadow-lg transition-all duration-300"
            >
                <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
              Back to PV Areas
            </Button>
            <Button
              onClick={() => setActiveTab("acconfig")}
              disabled={!selectedInverter}
              className="group relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <span className="relative flex items-center gap-2">
                Continue to AC Config
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Button>
            </div>
          </div>
        </TabsContent>

        {/* AC Config Tab */}
        <TabsContent value="acconfig">
          <div className="xl:max-w-6xl xl:mx-auto space-y-6">
            {/* AC Side Configuration */}
            {selectedInverter && (
              <ACSideConfiguration
                ref={acConfigRef}
                systemSize={capacity}
                inverterPower={selectedInverter.nominal_ac_power_kw}
                inverterCount={manualInverterCount}
                                  inverterOutputVoltage={selectedInverter.nominal_ac_voltage_v || (selectedInverter.phase === '1' ? 230 : 400)}
                inverterOutputCurrent={selectedInverter.rated_ac_current || (selectedInverter.nominal_ac_power_kw * 1000 / (selectedInverter.phase === '1' ? (selectedInverter.nominal_ac_voltage_v || 230) : Math.sqrt(3) * (selectedInverter.nominal_ac_voltage_v || 400)))}
                onConfigurationChange={handleACConfigurationChange}
                onSLDImageCaptured={handleSLDImageCaptured}
                initialConfiguration={acConfiguration || undefined}
              />
            )}

            {/* Professional AC BOQ Calculator - Hidden from user view, data still calculated */}
            {selectedInverter && acConfiguration && (
              <div className="mt-6 hidden">
                <ACBOQCalculator 
                  connectionType={acConfiguration.connectionType === 'LV' ? 'LV' : 
                               acConfiguration.inverterType === 'STRING' ? 'HV_String' : 'HV_Central'}
                  acSystemInputs={mapACConfigurationToInputs(acConfiguration, manualInverterCount, selectedInverter?.nominal_ac_power_kw || 40)}
                  engineeringParams={{
                    sparePercentage: 5,
                    cableTrayFillFactor: 0.60,
                    cableTieSpacing: 0.5,
                    extraTiesPerRun: 2,
                    sheathAreaMultiplier: 1.3,
                    busbarSafetyFactor: 1.1
                  }}
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-between mt-6">
            <Button
              onClick={() => setActiveTab("dcconfig")}
              variant="outline"
              className="group flex items-center gap-2"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              Back to DC Config
            </Button>
            <Button
              onClick={async () => {
                // Auto-capture SLD before navigating to next tab
                if (acConfigRef.current && acConfiguration) {
                  console.log("🎨 Auto-capturing SLD before navigation...");
                  try {
                    await acConfigRef.current.captureSLD();
                    console.log("✅ SLD auto-capture successful!");
                  } catch (error) {
                    console.error("❌ SLD auto-capture failed:", error);
                    // Continue navigation even if capture fails
                  }
                }
                setActiveTab("summary");
              }}
              className="group relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              disabled={!selectedInverter}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <span className="relative flex items-center gap-2">
                Continue to Design Summary
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Button>
          </div>
        </TabsContent>

                 {/* Design Summary Tab */}
                 <TabsContent value="summary">
          <div className="xl:max-w-6xl xl:mx-auto">
          <div className="space-y-6">
             {/* Project Overview Card */}
             <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-blue-600 rounded-lg">
                   <FileText className="h-5 w-5 text-white" />
                 </div>
                 <div>
                   <h2 className="text-xl font-bold text-blue-900">Solar PV System Design Summary</h2>
                   <p className="text-blue-700 text-sm">Complete design overview and specifications</p>
                 </div>
               </div>
               
               {/* Key System Metrics */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                 <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                   <div className="text-2xl font-bold text-blue-900">{capacity?.toFixed(1)} kWp</div>
                   <div className="text-sm text-blue-700">Total System Capacity</div>
                 </div>
                 <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                   <div className="text-2xl font-bold text-blue-900">{polygonConfigs?.reduce((sum, config) => sum + config.moduleCount, 0) || 0}</div>
                   <div className="text-sm text-blue-700">Total Modules</div>
                 </div>
                 <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                   <div className="text-2xl font-bold text-blue-900">{manualInverterCount}</div>
                   <div className="text-sm text-blue-700">Inverters</div>
                 </div>
                 <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                   <div className="text-2xl font-bold text-blue-900">{manualDcAcRatio?.toFixed(2)}</div>
                   <div className="text-sm text-blue-700">DC/AC Ratio</div>
                 </div>
               </div>
             </Card>

             {/* Location Information */}
             <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-200">
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-emerald-600 rounded-lg">
                   <MapPin className="h-5 w-5 text-white" />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-emerald-900">Installation Location</h3>
                   <p className="text-emerald-700 text-sm">Geographic coordinates and location details</p>
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <div className="flex justify-between">
                     <span className="text-gray-600">City:</span>
                     <span className="font-medium">{city}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-gray-600">Country:</span>
                     <span className="font-medium">{country}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-gray-600">Timezone:</span>
                     <span className="font-medium">{timezone}</span>
                   </div>
                 </div>
                 <div className="space-y-2">
                   <div className="flex justify-between">
                     <span className="text-gray-600">Latitude:</span>
                     <span className="font-medium">{latitude?.toFixed(4)}°</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-gray-600">Longitude:</span>
                     <span className="font-medium">{longitude?.toFixed(4)}°</span>
                   </div>
                 </div>
               </div>
             </Card>

             {/* Project Details */}
             <Card className="p-6 bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200">
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-slate-600 rounded-lg">
                   <Building className="h-5 w-5 text-white" />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-slate-900">Project Details</h3>
                   <p className="text-slate-700 text-sm">Application type and installation configuration</p>
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <div className="flex justify-between">
                     <span className="text-gray-600">Meteo Data Source:</span>
                     <span className="font-medium uppercase">{meteoDataSource}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-gray-600">Application Type:</span>
                     <span className="font-medium">{projectApplication}</span>
                   </div>
                 </div>
                 <div className="space-y-2">
                   <div className="flex justify-between">
                     <span className="text-gray-600">Installation Type:</span>
                     <span className="font-medium">{projectInstallation}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-gray-600">Surface Albedo:</span>
                     <span className="font-medium">{albedo?.toFixed(2)} ({surfaceType})</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-gray-600">Soil Type:</span>
                     <span className="font-medium">{soilType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                   </div>
                 </div>
               </div>
             </Card>

             {/* Panel Specifications */}
             {selectedPanel && (
               <Card className="p-6 bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-yellow-600 rounded-lg">
                     <Sun className="h-5 w-5 text-white" />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold text-yellow-900">Solar Panel Specifications</h3>
                     <p className="text-yellow-700 text-sm">Photovoltaic module technical details</p>
                   </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <div className="flex justify-between">
                       <span className="text-gray-600">Model:</span>
                       <span className="font-medium">{selectedPanel.model || selectedPanel.name}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Manufacturer:</span>
                       <span className="font-medium">{selectedPanel.manufacturer}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Power Rating:</span>
                       <span className="font-medium">{moduleWattPeak}W</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Efficiency:</span>
                       <span className="font-medium">{(moduleEfficiency * 100).toFixed(1)}%</span>
                     </div>
                   </div>
                   <div className="space-y-2">
                     <div className="flex justify-between">
                       <span className="text-gray-600">Panel Area:</span>
                       <span className="font-medium">{moduleArea?.toFixed(2)} m²</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Technology:</span>
                       <span className="font-medium">{selectedPanel.panel_type || selectedPanel.technology || 'N/A'}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Cell Type:</span>
                       <span className="font-medium">{selectedPanel.cell_type || 'N/A'}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Module Type:</span>
                       <span className="font-medium">
                         {selectedPanel.bifaciality === 0 || selectedPanel.bifaciality === null 
                           ? "Mono Facial" 
                           : `Bi-Facial (${(selectedPanel.bifaciality * 100).toFixed(0)}%)`
                         }
                       </span>
                     </div>
                   </div>
                 </div>
               </Card>
             )}

             {/* Inverter Specifications */}
             {selectedInverter && (
               <Card className="p-6 bg-gradient-to-br from-cyan-50 to-blue-100 border-cyan-200">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-cyan-600 rounded-lg">
                     <Zap className="h-5 w-5 text-white" />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold text-cyan-900">Inverter Specifications</h3>
                     <p className="text-cyan-700 text-sm">Power conversion equipment details</p>
                   </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <div className="flex justify-between">
                       <span className="text-gray-600">Model:</span>
                       <span className="font-medium">{selectedInverter.model || selectedInverter.name}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Manufacturer:</span>
                       <span className="font-medium">{selectedInverter.manufacturer}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">AC Power Rating:</span>
                       <span className="font-medium">{selectedInverter.nominal_ac_power_kw || selectedInverter.power_rating / 1000} kW</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Efficiency:</span>
                       <span className="font-medium">{((selectedInverter.efficiency || 0.96) * 100).toFixed(1)}%</span>
                     </div>
                   </div>
                   <div className="space-y-2">
                     <div className="flex justify-between">
                       <span className="text-gray-600">Quantity:</span>
                       <span className="font-medium">{manualInverterCount} units</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Phase:</span>
                       <span className="font-medium">{selectedInverter.phase} Phase</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Output Voltage:</span>
                       <span className="font-medium">{selectedInverter.nominal_ac_voltage_v || 400}V</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Type:</span>
                       <span className="font-medium">{selectedInverter.inverter_type || 'String Inverter'}</span>
                     </div>
                   </div>
                 </div>
               </Card>
             )}

             {/* DC Configuration Summary */}
             {selectedInverter && (
               <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-100 border-orange-200">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-orange-600 rounded-lg">
                     <Power className="h-5 w-5 text-white" />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold text-orange-900">DC Configuration Summary</h3>
                     <p className="text-orange-700 text-sm">String sizing and DC system details</p>
                   </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <div className="flex justify-between">
                       <span className="text-gray-600">MPPT Voltage Range:</span>
                       <span className="font-medium">
                         {selectedInverter.min_mpp_voltage_v || selectedInverter.mppt_min_voltage || 'N/A'} - {selectedInverter.max_dc_voltage_v || selectedInverter.nominal_mpp_voltage_v || selectedInverter.max_mpp_voltage_v || selectedInverter.mppt_max_voltage || 'N/A'} V
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Max DC Voltage:</span>
                       <span className="font-medium">{selectedInverter.max_dc_voltage_v || selectedInverter.max_dc_voltage || 'N/A'} V</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">DC Distribution:</span>
                       <span className="font-medium">
                         {isCentralInverter ? 'DCDB (Distribution Board)' : (useDCCombiner ? 'DC Combiner Box' : 'Direct Connection')}
                       </span>
                     </div>
                   </div>
                   <div className="space-y-2">
                     <div className="flex justify-between">
                       <span className="text-gray-600">Min Temperature:</span>
                       <span className="font-medium">{lowestTemperature}°C</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Max Temperature:</span>
                       <span className="font-medium">{highestTemperature}°C</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">DC/AC Ratio:</span>
                       <span className="font-medium">{manualDcAcRatio?.toFixed(2)}</span>
                     </div>
                   </div>
                 </div>
                 
                 {selectedPanel && (
                   <div className="mt-4 p-4 bg-white rounded-lg border border-orange-200">
                     <h4 className="font-medium text-orange-900 mb-2">Module Electrical Parameters</h4>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                       <div className="flex justify-between">
                         <span className="text-gray-600">Voc:</span>
                         <span className="font-medium">
                           {selectedPanel.voc_v || selectedPanel.voc || selectedPanel.open_circuit_voltage || 'N/A'} V
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Vmp:</span>
                         <span className="font-medium">
                           {selectedPanel.vmp_v || selectedPanel.vmp || selectedPanel.max_power_voltage || 'N/A'} V
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Isc:</span>
                         <span className="font-medium">
                           {selectedPanel.isc_a || selectedPanel.isc || selectedPanel.short_circuit_current || 'N/A'} A
                         </span>
                       </div>
                     </div>
                   </div>
                 )}
               </Card>
             )}

             {/* PV Areas Summary */}
             {polygonConfigs && polygonConfigs.length > 0 && (
               <Card className="p-6 bg-gradient-to-br from-violet-50 to-purple-100 border-violet-200">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-violet-600 rounded-lg">
                     <Grid3X3 className="h-5 w-5 text-white" />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold text-violet-900">Installation Areas Summary</h3>
                     <p className="text-violet-700 text-sm">PV array layout and configuration details</p>
                   </div>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full border-collapse">
                     <thead>
                       <tr className="border-b">
                         <th className="text-left py-2 px-4">Area</th>
                         <th className="text-left py-2 px-4">Structure Type</th>
                         <th className="text-right py-2 px-4">Size (m²)</th>
                         <th className="text-center py-2 px-4">Azimuth</th>
                         <th className="text-center py-2 px-4">Tilt</th>
                         <th className="text-right py-2 px-4">Modules</th>
                         <th className="text-right py-2 px-4">
                           Tables
                           <div className="text-xs font-normal text-gray-500 mt-1">
                             (For BOQ/BOM)
                           </div>
                         </th>
                         <th className="text-right py-2 px-4">Capacity (kWp)</th>
                       </tr>
                     </thead>
                     <tbody>
                       {polygonConfigs.map((config, index) => (
                         <tr key={index} className="border-b hover:bg-gray-50">
                           <td className="py-2 px-4">Area {index + 1}</td>
                           <td className="py-2 px-4">
                             <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                               {config.structureType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                             </span>
                           </td>
                           <td className="py-2 px-4 text-right">{config.area?.toFixed(1)}</td>
                           <td className="py-2 px-4 text-center">{config.azimuth?.toFixed(0)}°</td>
                           <td className="py-2 px-4 text-center">{config.tiltAngle?.toFixed(0)}°</td>
                           <td className="py-2 px-4 text-right">{config.moduleCount}</td>
                           <td className="py-2 px-4 text-right">
                             {config.tableCount !== undefined ? config.tableCount : '-'}
                           </td>
                           <td className="py-2 px-4 text-right">{config.capacityKw?.toFixed(1)}</td>
                         </tr>
                       ))}
                       <tr className="border-t-2 font-semibold bg-gray-50">
                         <td className="py-2 px-4" colSpan={2}>TOTAL</td>
                         <td className="py-2 px-4 text-right">{polygonConfigs.reduce((sum, config) => sum + config.area, 0).toFixed(1)} m²</td>
                         <td className="py-2 px-4 text-center">-</td>
                         <td className="py-2 px-4 text-center">-</td>
                         <td className="py-2 px-4 text-right">{polygonConfigs.reduce((sum, config) => sum + config.moduleCount, 0)}</td>
                         <td className="py-2 px-4 text-right">
                           {polygonConfigs.reduce((sum, config) => sum + (config.tableCount || 0), 0)}
                         </td>
                         <td className="py-2 px-4 text-right">{polygonConfigs.reduce((sum, config) => sum + config.capacityKw, 0).toFixed(1)} kWp</td>
                       </tr>
                     </tbody>
                   </table>
                 </div>
               </Card>
                         )}

            {/* DC String Configuration Summary */}
            {selectedInverter && selectedPanel && totalStringCount > 0 && (
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-100 border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <Cable className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-900">DC String Configuration</h3>
                    <p className="text-purple-700 text-sm">PV string layout and DC electrical configuration</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-200">
                    <div className="text-2xl font-bold text-purple-900">{totalStringCount}</div>
                    <div className="text-sm text-purple-700">Total PV Strings</div>
                  </div>
                  
                  {/* Calculate modules per string */}
                  {(() => {
                    const totalModules = polygonConfigs?.reduce((sum, config) => sum + config.moduleCount, 0) || 0;
                    const modulesPerString = totalStringCount > 0 ? Math.round(totalModules / totalStringCount) : 0;
                    return (
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-200">
                        <div className="text-2xl font-bold text-purple-900">{modulesPerString}</div>
                        <div className="text-sm text-purple-700">Modules per String</div>
                      </div>
                    );
                  })()}
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-200">
                    <div className="text-2xl font-bold text-purple-900">{averageStringVoltage?.toFixed(0)}V</div>
                    <div className="text-sm text-purple-700">Average String Voltage</div>
                  </div>
                </div>

                {/* Central Inverter specific information */}
                {isCentralInverter && centralStringSizingData && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-3">DCDB Configuration (Central Inverter)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total DCDBs per Inverter:</span>
                        <span className="font-medium">{centralStringSizingData.dcdbConfiguration?.dcdbPerInverter || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total DCDBs in System:</span>
                        <span className="font-medium">{(centralStringSizingData.dcdbConfiguration?.dcdbPerInverter || 0) * manualInverterCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Strings per DCDB:</span>
                        <span className="font-medium">{Number(centralStringSizingData.actualPVStringsPerDCDB) || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* DCDB Sizing Configuration Summary (Central Inverter Only) */}
            {isCentralInverter && selectedInverter && selectedPanel && centralStringSizingData && (
              <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-100 border-indigo-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-600 rounded-lg">
                    <Grid3X3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-indigo-900">DCDB Sizing Configuration</h3>
                    <p className="text-indigo-700 text-sm">DC Distribution Board specifications and component details</p>
                  </div>
                </div>

                {/* DCDB System Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-200">
                    <div className="text-2xl font-bold text-indigo-900">{centralStringSizingData.dcdbConfiguration?.dcdbPerInverter || 0}</div>
                    <div className="text-sm text-indigo-700">DCDBs per Inverter</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-200">
                    <div className="text-2xl font-bold text-indigo-900">{(centralStringSizingData.dcdbConfiguration?.dcdbPerInverter || 0) * manualInverterCount}</div>
                    <div className="text-sm text-indigo-700">Total DCDBs in System</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-200">
                    <div className="text-2xl font-bold text-indigo-900">{Number(centralStringSizingData.actualPVStringsPerDCDB) || 0}</div>
                    <div className="text-sm text-indigo-700">Strings per DCDB</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-200">
                    <div className="text-2xl font-bold text-indigo-900">{((Number(centralStringSizingData.actualPVStringsPerDCDB) || 0) * averageStringCurrent).toFixed(1)}A</div>
                    <div className="text-sm text-indigo-700">Current per DCDB</div>
                  </div>
                </div>

                {/* DCDB Component Specifications */}
                <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200">
                  <h4 className="font-medium text-indigo-900 mb-3">Component Specifications</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* String Fuses */}
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-800 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-500" />
                        String Fuses
                      </h5>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rating:</span>
                          <span className="font-medium">{Math.ceil(averageStringCurrent * 1.56)}A</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Voltage:</span>
                          <span className="font-medium">1000V DC</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium">PV Fuse</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium text-blue-600">{totalStringCount} pcs</span>
                        </div>
                      </div>
                    </div>

                    {/* DCDB Breakers */}
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-800 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-500" />
                        DCDB Breakers
                      </h5>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rating:</span>
                          <span className="font-medium">{Math.ceil((Number(centralStringSizingData.actualPVStringsPerDCDB) || 0) * averageStringCurrent * 1.25)}A</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Voltage:</span>
                          <span className="font-medium">1000V DC</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Poles:</span>
                          <span className="font-medium">2P</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium text-green-600">{(centralStringSizingData.dcdbConfiguration?.dcdbPerInverter || 0) * manualInverterCount} pcs</span>
                        </div>
                      </div>
                    </div>

                    {/* DCDB Enclosures */}
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-800 flex items-center gap-2">
                        <Building className="h-4 w-4 text-purple-500" />
                        DCDB Enclosures
                      </h5>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rating:</span>
                          <span className="font-medium">IP65</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Material:</span>
                          <span className="font-medium">Powder Coated Steel</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Busbar:</span>
                          <span className="font-medium">{Math.ceil((Number(centralStringSizingData.actualPVStringsPerDCDB) || 0) * averageStringCurrent * 1.25 / 100) * 100}A</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium text-purple-600">{(centralStringSizingData.dcdbConfiguration?.dcdbPerInverter || 0) * manualInverterCount} pcs</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DCDB Performance Summary */}
                <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <h4 className="font-medium text-indigo-900 mb-3">System Performance Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total DC Input Current:</span>
                      <span className="font-medium">{(totalStringCount * averageStringCurrent).toFixed(1)}A</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">MPPT Utilization:</span>
                      <span className="font-medium text-green-600">{centralStringSizingData.dcdbConfiguration?.mpptUtilization?.toFixed(1) || 'N/A'}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">System Efficiency:</span>
                      <span className="font-medium">≥98.5%</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* DC Cable Configuration Summary */}
            {(dcStringCableData || dcdbCableData) && (
              <Card className="p-6 bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-teal-600 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-teal-900">DC Cable Configuration</h3>
                    <p className="text-teal-700 text-sm">DC cabling specifications and performance metrics</p>
                  </div>
                </div>

                {/* DC String Cables */}
                {dcStringCableData && (
                  <div className="mb-4 p-4 bg-white rounded-lg border border-teal-200">
                    <h4 className="font-medium text-teal-900 mb-3 flex items-center gap-2">
                      <Cable className="h-4 w-4" />
                      DC String Cables
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cross Section:</span>
                        <span className="font-medium">{dcStringCableData.cable?.cross_section_mm2 || 'N/A'} mm²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Material:</span>
                        <span className="font-medium">{dcStringCableData.material || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Length per String:</span>
                        <span className="font-medium">{dcStringCableData.length || 'N/A'} m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Cable Length:</span>
                        <span className="font-medium">
                          {dcStringCableData.length && totalStringCount 
                            ? (Number(dcStringCableData.length) * totalStringCount * 2).toFixed(0) 
                            : 'N/A'
                          } m
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="text-xs text-blue-800">
                        <strong>Cable Length Calculation:</strong> Total = Length per String × Number of Strings × 2 (for positive and negative 1-core cables)
                        <br />
                        <strong>Formula:</strong> {dcStringCableData.length || 'N/A'}m × {totalStringCount} strings × 2 = {dcStringCableData.length && totalStringCount ? (Number(dcStringCableData.length) * totalStringCount * 2).toFixed(0) : 'N/A'}m
                      </div>
                    </div>
                    
                    {/* Voltage Drop Information */}
                    {dcStringCableData.voltageDropResults && (
                      <div className="mt-3 pt-3 border-t border-teal-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Voltage Drop:</span>
                            <span className={`font-medium ${dcStringCableData.voltageDropResults.isAcceptable ? 'text-green-600' : 'text-red-600'}`}>
                              {dcStringCableData.voltageDropResults.voltageDropPercentage?.toFixed(2) || 'N/A'}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Power Loss at STC:</span>
                            <span className={`font-medium ${dcStringCableData.voltageDropResults.isAcceptable ? 'text-green-600' : 'text-red-600'}`}>
                              {dcStringCableData.voltageDropResults.voltageDropPercentage?.toFixed(2) || 'N/A'}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* DCDB to Inverter Cables (Central Inverter Only) */}
                {dcdbCableData && isCentralInverter && (
                  <div className="p-4 bg-white rounded-lg border border-teal-200">
                    <h4 className="font-medium text-teal-900 mb-3 flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      DCDB to Inverter Cables
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cross Section:</span>
                        <span className="font-medium">{dcdbCableData.cable?.cross_section_mm2 || 'N/A'} mm²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Material:</span>
                        <span className="font-medium">{dcdbCableData.material || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Length per DCDB:</span>
                        <span className="font-medium">
                          {dcdbCableData.length && dcdbCableData.numberOfRuns 
                            ? (Number(dcdbCableData.length) * Number(dcdbCableData.numberOfRuns)).toFixed(0) 
                            : 'N/A'
                          } m
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Cable Length:</span>
                        <span className="font-medium">
                          {dcdbCableData.length && dcdbCableData.numberOfRuns && centralStringSizingData?.dcdbConfiguration?.dcdbPerInverter 
                            ? (Number(dcdbCableData.length) * Number(dcdbCableData.numberOfRuns) * centralStringSizingData.dcdbConfiguration.dcdbPerInverter * manualInverterCount * 2).toFixed(0) 
                            : 'N/A'
                          } m
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="text-xs text-blue-800">
                        <strong>Cable Length Calculation:</strong> Total = Length per DCDB × Number of Runs × DCDBs per Inverter × Inverter Count × 2 (for positive and negative 1-core cables)
                        <br />
                        <strong>Formula:</strong> {dcdbCableData.length || 'N/A'}m × {dcdbCableData.numberOfRuns || 'N/A'} runs × {centralStringSizingData?.dcdbConfiguration?.dcdbPerInverter || 'N/A'} DCDBs/inverter × {manualInverterCount} inverters × 2 = {dcdbCableData.length && dcdbCableData.numberOfRuns && centralStringSizingData?.dcdbConfiguration?.dcdbPerInverter ? (Number(dcdbCableData.length) * Number(dcdbCableData.numberOfRuns) * centralStringSizingData.dcdbConfiguration.dcdbPerInverter * manualInverterCount * 2).toFixed(0) : 'N/A'}m
                      </div>
                    </div>
                    
                    {/* Voltage Drop Information */}
                    {dcdbCableData.voltageDropResults && (
                      <div className="mt-3 pt-3 border-t border-teal-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Voltage Drop:</span>
                            <span className={`font-medium ${dcdbCableData.voltageDropResults.isAcceptable ? 'text-green-600' : 'text-red-600'}`}>
                              {dcdbCableData.voltageDropResults.voltageDropPercentage?.toFixed(2) || 'N/A'}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Power Loss at STC:</span>
                            <span className={`font-medium ${dcdbCableData.voltageDropResults.isAcceptable ? 'text-green-600' : 'text-red-600'}`}>
                              {dcdbCableData.voltageDropResults.voltageDropPercentage?.toFixed(2) || 'N/A'}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* AC Configuration Summary */}
             {acConfiguration && (
               <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-100 border-orange-200">
                 <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-orange-600 rounded-lg">
                     <Activity className="h-5 w-5 text-white" />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold text-orange-900">AC System Configuration</h3>
                     <p className="text-orange-700 text-sm">Electrical infrastructure and protection devices</p>
                   </div>
                 </div>

                 {/* Basic Configuration */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                   <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-200">
                     <div className="text-lg font-bold text-orange-900">{acConfiguration.connectionType?.toUpperCase()}</div>
                     <div className="text-sm text-orange-700">Connection Type</div>
                   </div>
                   <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-200">
                     <div className="text-lg font-bold text-orange-900">{acConfiguration.pocVoltage}V</div>
                     <div className="text-sm text-orange-700">PoC Voltage</div>
                   </div>
                   <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-200">
                     <div className="text-lg font-bold text-orange-900">{acConfiguration.inverterType}</div>
                     <div className="text-sm text-orange-700">Inverter Type</div>
                   </div>
                 </div>

                 {/* AC Combiner Panels - Enhanced for HV */}
                 {(acConfiguration.acCombinerPanels || 
                   acConfiguration.hvStringConfig?.lvACCombinerPanels ||
                   acConfiguration.hvCentralConfig) && (
                   <div className="mb-6">
                     <h4 className="text-lg font-semibold text-orange-900 mb-3 flex items-center gap-2">
                       <Grid3X3 className="h-4 w-4" />
                       {acConfiguration.connectionType === 'HV' ? 'LV AC Combiner Panels' : 'AC Combiner Panels'}
                     </h4>
                     <div className="bg-white p-4 rounded-lg border border-orange-200">
                       {/* LV Configuration */}
                       {acConfiguration.connectionType === 'LV' && acConfiguration.acCombinerPanels && (
                         <div className="grid grid-cols-2 gap-4">
                           <div className="flex justify-between">
                             <span className="text-gray-600">Panel Count:</span>
                             <span className="font-medium">{acConfiguration.acCombinerPanels.count}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">Total Inputs:</span>
                             <span className="font-medium">{acConfiguration.acCombinerPanels.configurations.reduce((sum, config) => sum + config.inputs, 0)}</span>
                           </div>
                         </div>
                       )}
                       
                       {/* HV String Configuration */}
                       {acConfiguration.connectionType === 'HV' && acConfiguration.inverterType === 'STRING' && acConfiguration.hvStringConfig?.lvACCombinerPanels && (
                         <div className="grid grid-cols-2 gap-4">
                           <div className="flex justify-between">
                             <span className="text-gray-600">Panel Count:</span>
                             <span className="font-medium">{acConfiguration.hvStringConfig.lvACCombinerPanels.count}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">Total Inputs:</span>
                             <span className="font-medium">{acConfiguration.hvStringConfig.lvACCombinerPanels.configurations.reduce((sum, config) => sum + config.inputs, 0)}</span>
                           </div>
                         </div>
                       )}
                       
                       {/* HV Central Configuration */}
                       {acConfiguration.connectionType === 'HV' && acConfiguration.inverterType === 'CENTRAL' && acConfiguration.hvCentralConfig && (
                         <div className="grid grid-cols-2 gap-4">
                           <div className="flex justify-between">
                             <span className="text-gray-600">Configuration:</span>
                             <span className="font-medium">Central Inverter Setup</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">Direct IDT Connection:</span>
                             <span className="font-medium">No AC Combiner Panels</span>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 )}

                 {/* Circuit Breakers - Comprehensive Detection */}
                 {(((acConfiguration.selectedBreakers && acConfiguration.selectedBreakers.size > 0) ||
                   acConfiguration.inputBreaker || acConfiguration.outputBreaker ||
                   acConfiguration.circuitBreakers ||
                   (acConfiguration.connectionType === 'HV' && (acConfiguration.hvStringConfig || acConfiguration.hvCentralConfig)))) && (
                   <div className="mb-6">
                     <h4 className="text-lg font-semibold text-orange-900 mb-3 flex items-center gap-2">
                       <Zap className="h-4 w-4" />
                       Circuit Breakers
                     </h4>
                                            <div className="bg-white p-4 rounded-lg border border-orange-200">
                         <div className="overflow-x-auto">
                           {((acConfiguration.selectedBreakers && acConfiguration.selectedBreakers.size > 0) ||
                             acConfiguration.inputBreaker || acConfiguration.outputBreaker) ? (
                             <table className="w-full text-sm">
                               <thead>
                                 <tr className="border-b border-orange-200">
                                   <th className="text-left py-2 px-3 text-orange-900">Location</th>
                                   <th className="text-left py-2 px-3 text-orange-900">Type</th>
                                   <th className="text-right py-2 px-3 text-orange-900">Rating (A)</th>
                                   <th className="text-right py-2 px-3 text-orange-900">Voltage (kV)</th>
                                 </tr>
                               </thead>
                               <tbody>
                                 {/* Display selectedBreakers if available */}
                                 {acConfiguration.selectedBreakers && Array.from(acConfiguration.selectedBreakers.entries()).map(([key, { breaker, sectionTitle }]) => (
                                   <tr key={key} className="border-b border-gray-100">
                                     <td className="py-2 px-3">{sectionTitle}</td>
                                     <td className="py-2 px-3">
                                       <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                         {breaker.breaker_type}
                                       </span>
                                     </td>
                                     <td className="py-2 px-3 text-right font-medium">{breaker.ampacity}</td>
                                     <td className="py-2 px-3 text-right font-medium">{breaker.rated_voltage}</td>
                                   </tr>
                                 ))}
                                 
                                 {/* Display inputBreaker if selectedBreakers is empty */}
                                 {(!acConfiguration.selectedBreakers || acConfiguration.selectedBreakers.size === 0) && acConfiguration.inputBreaker && (
                                   <tr className="border-b border-gray-100">
                                     <td className="py-2 px-3">Input Section</td>
                                     <td className="py-2 px-3">
                                       <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                         {acConfiguration.inputBreaker.breaker_type}
                                       </span>
                                     </td>
                                     <td className="py-2 px-3 text-right font-medium">{acConfiguration.inputBreaker.ampacity}</td>
                                     <td className="py-2 px-3 text-right font-medium">{acConfiguration.inputBreaker.rated_voltage}</td>
                                   </tr>
                                 )}
                                 
                                 {/* Display outputBreaker if selectedBreakers is empty */}
                                 {(!acConfiguration.selectedBreakers || acConfiguration.selectedBreakers.size === 0) && acConfiguration.outputBreaker && (
                                   <tr className="border-b border-gray-100">
                                     <td className="py-2 px-3">Output Section</td>
                                     <td className="py-2 px-3">
                                       <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                         {acConfiguration.outputBreaker.breaker_type}
                                       </span>
                                     </td>
                                     <td className="py-2 px-3 text-right font-medium">{acConfiguration.outputBreaker.ampacity}</td>
                                     <td className="py-2 px-3 text-right font-medium">{acConfiguration.outputBreaker.rated_voltage}</td>
                                   </tr>
                                 )}
                               </tbody>
                             </table>
                                                        ) : (
                               <div className="text-center py-8 text-orange-600 bg-orange-50 rounded-lg border border-orange-200">
                                 <Shield className="h-12 w-12 text-orange-300 mx-auto mb-3" />
                                 <div className="text-lg font-medium mb-2">
                                   {acConfiguration.connectionType === 'HV' ? 'HV Circuit Breakers Configured' : 'No Circuit Breakers Configured'}
                                 </div>
                                 <div className="text-sm">
                                   {acConfiguration.connectionType === 'HV' ? 
                                     'Circuit breakers are configured in the HV system but detailed information is not available for display' :
                                     'Please configure breakers in the AC Configuration tab'
                                   }
                                 </div>
                               </div>
                             )}
                         </div>
                       </div>
                   </div>
                 )}

                 {/* Transformers - Enhanced for HV */}
                 {(acConfiguration.idtConfig || acConfiguration.powerTransformerConfig || 
                   acConfiguration.hvStringConfig?.idts || acConfiguration.hvStringConfig?.powerTransformer ||
                   acConfiguration.hvCentralConfig?.idts || acConfiguration.hvCentralConfig?.powerTransformer) && (
                   <div className="mb-6">
                     <h4 className="text-lg font-semibold text-orange-900 mb-3 flex items-center gap-2">
                       <Settings className="h-4 w-4" />
                       Transformers
                     </h4>
                     <div className="space-y-4">
                       {/* IDT Configuration */}
                       {(acConfiguration.idtConfig || acConfiguration.hvStringConfig?.idts || acConfiguration.hvCentralConfig?.idts) && (
                         <div className="bg-white p-4 rounded-lg border border-orange-200">
                           <h5 className="font-semibold text-orange-800 mb-3">Inverter Duty Transformers (IDT)</h5>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                             <div className="bg-gray-50 p-3 rounded-lg">
                               <span className="text-gray-600 block text-xs mb-1">Count:</span>
                               <span className="font-bold text-lg text-gray-800">
                                 {acConfiguration.hvStringConfig?.idts.count || 
                                  acConfiguration.hvCentralConfig?.idts.count || 
                                  acConfiguration.idtConfig?.count || 1}
                               </span>
                             </div>
                             <div className="bg-gray-50 p-3 rounded-lg">
                               <span className="text-gray-600 block text-xs mb-1">Rating:</span>
                               <span className="font-bold text-lg text-gray-800">
                                 {acConfiguration.hvStringConfig?.idts.configurations[0]?.powerRating ||
                                  acConfiguration.hvCentralConfig?.idts.configurations[0]?.powerRating ||
                                  acConfiguration.idtConfig?.powerRating || 'N/A'} MVA
                               </span>
                             </div>
                             <div className="bg-gray-50 p-3 rounded-lg">
                               <span className="text-gray-600 block text-xs mb-1">Primary:</span>
                               <span className="font-bold text-lg text-gray-800">
                                 {acConfiguration.hvStringConfig?.idts.configurations[0]?.primaryVoltage ||
                                  acConfiguration.hvCentralConfig?.idts.configurations[0]?.primaryVoltage ||
                                  acConfiguration.idtConfig?.primaryVoltage || 'N/A'}V
                               </span>
                             </div>
                             <div className="bg-gray-50 p-3 rounded-lg">
                               <span className="text-gray-600 block text-xs mb-1">Secondary:</span>
                               <span className="font-bold text-lg text-gray-800">
                                 {acConfiguration.hvStringConfig?.idts.configurations[0]?.secondaryVoltage ||
                                  acConfiguration.hvCentralConfig?.idts.configurations[0]?.secondaryVoltage ||
                                  acConfiguration.idtConfig?.secondaryVoltage || 'N/A'}V
                               </span>
                             </div>
                           </div>
                         </div>
                       )}

                       {/* Power Transformer Configuration - Only show when PT is actually enabled */}
                       {(() => {
                         // Check if PT is actually enabled based on configuration type
                         let showPT = false;
                         let ptConfig = null;
                         
                         if (acConfiguration.connectionType === 'HV') {
                           if (acConfiguration.inverterType === 'STRING' && acConfiguration.hvStringConfig?.powerTransformer) {
                             // HV String: PT is enabled
                             showPT = true;
                             ptConfig = acConfiguration.hvStringConfig.powerTransformer;
                           } else if (acConfiguration.inverterType === 'CENTRAL' && acConfiguration.hvCentralConfig?.powerTransformer) {
                             // HV Central: PT is enabled
                             showPT = true;
                             ptConfig = acConfiguration.hvCentralConfig.powerTransformer;
                           }
                         } else if (acConfiguration.connectionType === 'LV' && acConfiguration.powerTransformerConfig) {
                           // Legacy LV configuration
                           showPT = true;
                           ptConfig = acConfiguration.powerTransformerConfig;
                         }
                         
                         return showPT && ptConfig ? (
                           <div className="bg-white p-4 rounded-lg border border-orange-200">
                             <h5 className="font-semibold text-orange-800 mb-3">Power Transformer</h5>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                               <div className="bg-gray-50 p-3 rounded-lg">
                                 <span className="text-gray-600 block text-xs mb-1">Rating:</span>
                                 <span className="font-bold text-lg text-gray-800">
                                   {ptConfig.powerRating || 'N/A'} MVA
                                 </span>
                               </div>
                               <div className="bg-gray-50 p-3 rounded-lg">
                                 <span className="text-gray-600 block text-xs mb-1">Primary:</span>
                                 <span className="font-bold text-lg text-gray-800">
                                   {ptConfig.primaryVoltage || 'N/A'}V
                                 </span>
                               </div>
                               <div className="bg-gray-50 p-3 rounded-lg">
                                 <span className="text-gray-600 block text-xs mb-1">Secondary:</span>
                                 <span className="font-bold text-lg text-gray-800">
                                   {ptConfig.secondaryVoltage || 'N/A'}V
                                 </span>
                               </div>
                               <div className="bg-gray-50 p-3 rounded-lg">
                                 <span className="text-gray-600 block text-xs mb-1">Vector Group:</span>
                                 <span className="font-bold text-lg text-gray-800">
                                   {ptConfig.vectorGrouping || 'Dyn11'}
                                 </span>
                               </div>
                             </div>
                           </div>
                         ) : null;
                       })()}
                     </div>
                   </div>
                 )}

                 {/* Cables - Comprehensive Detection */}
                 {(((acConfiguration.selectedCables && acConfiguration.selectedCables.size > 0) ||
                   acConfiguration.inputCables || acConfiguration.outputCables ||
                   (acConfiguration.actualCableLosses && acConfiguration.actualCableLosses.kW > 0) ||
                   (acConfiguration.connectionType === 'HV' && (acConfiguration.hvStringConfig || acConfiguration.hvCentralConfig)))) && (
                   <div className="mb-6">
                     <h4 className="text-lg font-semibold text-orange-900 mb-3 flex items-center gap-2">
                       <Zap className="h-4 w-4" />
                       Cable Configuration
                     </h4>
                     <div className="bg-white p-4 rounded-lg border border-orange-200">
                       {((acConfiguration.selectedCables && acConfiguration.selectedCables.size > 0) ||
                         acConfiguration.inputCables || acConfiguration.outputCables) ? (
                         <div className="overflow-x-auto">
                           <table className="w-full text-sm">
                             <thead>
                               <tr className="border-b border-orange-200">
                                 <th className="text-left py-2 px-3 text-orange-900">Location</th>
                                 <th className="text-left py-2 px-3 text-orange-900">Material</th>
                                 <th className="text-right py-2 px-3 text-orange-900">Cross Section (mm²)</th>
                                 <th className="text-right py-2 px-3 text-orange-900">Length (m)</th>
                                 <th className="text-right py-2 px-3 text-orange-900">Runs</th>
                                 <th className="text-right py-2 px-3 text-orange-900">Current Rating (A)</th>
                                 <th className="text-right py-2 px-3 text-orange-900">Derated Current (A)</th>
                               </tr>
                             </thead>
                             <tbody>
                               {/* Display selectedCables if available */}
                               {acConfiguration.selectedCables && Array.from(acConfiguration.selectedCables.entries()).map(([key, cableData]) => {
                                 if (!cableData.cable) return null;
                                 return (
                                   <tr key={key} className="border-b border-gray-100">
                                     <td className="py-2 px-3">{cableData.sectionTitle}</td>
                                     <td className="py-2 px-3">
                                       <span className={`px-2 py-1 rounded text-xs ${cableData.material === 'COPPER' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                                         {cableData.material}
                                       </span>
                                     </td>
                                     <td className="py-2 px-3 text-right font-medium">{cableData.cable.cross_section_mm2}</td>
                                     <td className="py-2 px-3 text-right font-medium">{cableData.length}</td>
                                     <td className="py-2 px-3 text-right font-medium">{cableData.numberOfRuns}</td>
                                     <td className="py-2 px-3 text-right font-medium">{cableData.calculatedCurrent.toFixed(1)}</td>
                                     <td className="py-2 px-3 text-right font-medium">{cableData.deratedCurrent.toFixed(1)}</td>
                                   </tr>
                                 );
                               })}
                               
                               {/* Display inputCables if selectedCables is empty */}
                               {(!acConfiguration.selectedCables || acConfiguration.selectedCables.size === 0) && acConfiguration.inputCables && (
                                 <tr className="border-b border-gray-100">
                                   <td className="py-2 px-3">Input Section</td>
                                   <td className="py-2 px-3">
                                     <span className={`px-2 py-1 rounded text-xs ${acConfiguration.inputCables.material === 'COPPER' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                                       {acConfiguration.inputCables.material}
                                     </span>
                                   </td>
                                   <td className="py-2 px-3 text-right font-medium">{acConfiguration.inputCables.cable.cross_section_mm2}</td>
                                   <td className="py-2 px-3 text-right font-medium">{acConfiguration.inputCables.length}</td>
                                   <td className="py-2 px-3 text-right font-medium">1</td>
                                   <td className="py-2 px-3 text-right font-medium">{acConfiguration.inputCables.calculatedCurrent.toFixed(1)}</td>
                                   <td className="py-2 px-3 text-right font-medium">{acConfiguration.inputCables.deratedCurrent.toFixed(1)}</td>
                                 </tr>
                               )}
                               
                               {/* Display outputCables if selectedCables is empty */}
                               {(!acConfiguration.selectedCables || acConfiguration.selectedCables.size === 0) && acConfiguration.outputCables && (
                                 <tr className="border-b border-gray-100">
                                   <td className="py-2 px-3">Output Section</td>
                                   <td className="py-2 px-3">
                                     <span className={`px-2 py-1 rounded text-xs ${acConfiguration.outputCables.material === 'COPPER' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                                       {acConfiguration.outputCables.material}
                                     </span>
                                   </td>
                                   <td className="py-2 px-3 text-right font-medium">{acConfiguration.outputCables.cable.cross_section_mm2}</td>
                                   <td className="py-2 px-3 text-right font-medium">{acConfiguration.outputCables.length}</td>
                                   <td className="py-2 px-3 text-right font-medium">1</td>
                                   <td className="py-2 px-3 text-right font-medium">{acConfiguration.outputCables.calculatedCurrent.toFixed(1)}</td>
                                   <td className="py-2 px-3 text-right font-medium">{acConfiguration.outputCables.deratedCurrent.toFixed(1)}</td>
                                 </tr>
                               )}
                             </tbody>
                           </table>
                         </div>
                                                ) : (
                           <div className="text-center py-8 text-orange-600 bg-orange-50 rounded-lg border border-orange-200">
                             <Cable className="h-12 w-12 text-orange-300 mx-auto mb-3" />
                             <div className="text-lg font-medium mb-2">
                               {acConfiguration.connectionType === 'HV' ? 'HV Cables Configured' : 'No Cables Configured'}
                             </div>
                             <div className="text-sm">
                               {acConfiguration.connectionType === 'HV' ? 
                                 'Cables are configured in the HV system but detailed specifications are not available for display' :
                                 'Please configure cables in the AC Configuration tab'
                               }
                             </div>
                           </div>
                         )}
                     </div>
                   </div>
                 )}

                 {/* AC Cable Total Lengths per Circuit */}
                 <div className="mb-6">
                   <h4 className="text-lg font-semibold text-orange-900 mb-3 flex items-center gap-2">
                     <Cable className="h-4 w-4" />
                     AC Cable Total Lengths per Circuit
                   </h4>
                   <div className="bg-white p-4 rounded-lg border border-orange-200">
                     {(() => {
                       // Calculate total cable lengths based on connection type and inverter type
                       const connectionType = acConfiguration.connectionType;
                       const inverterType = acConfiguration.inverterType;
                       const inverterCount = manualInverterCount;
                       
                       // Default cable lengths (can be extracted from actual configuration if available)
                       const defaultLengths = {
                         inverterToLVPanel: 50, // meters per inverter
                         lvPanelToPoC: 100, // meters 
                         lvPanelToIDT: 200, // meters per LV panel
                         idtToPowerTransformer: 300, // meters per IDT
                         powerTransformerToPoC: 500, // meters
                         inverterToIDT: 100, // meters per central inverter (direct connection)
                       };
                       
                       // Extract actual lengths and runs from selected cables if available
                       const actualLengths = { ...defaultLengths };
                       const actualRuns = {
                         inverterToLVPanel: 1,
                         lvPanelToPoC: 1,
                         lvPanelToIDT: 1,
                         idtToPowerTransformer: 1,
                         powerTransformerToPoC: 1,
                         inverterToIDT: 1
                       };
                       
                       // Calculate actual length per unit (distance × runs)
                       const actualLengthPerUnit = { ...defaultLengths };
                       
                       if (acConfiguration.selectedCables && acConfiguration.selectedCables.size > 0) {
                         // console.log('🔧 Design Summary - Available cable keys:', Array.from(acConfiguration.selectedCables.keys()));
                         acConfiguration.selectedCables.forEach((cableData, key) => {
                           // console.log(`🔧 Design Summary - Processing cable key: ${key}, length: ${cableData.length}m, runs: ${cableData.numberOfRuns}`);
                           const lowerKey = key.toLowerCase();
                           
                           // Match actual cable keys from configuration (same logic as BOQParameterManager)
                           if (lowerKey.includes('input-inverter') || (lowerKey.includes('input') && lowerKey.includes('inverter'))) {
                             // 'input-Inverter' - String inverter to LV Panel
                             actualLengths.inverterToLVPanel = cableData.length;
                             actualRuns.inverterToLVPanel = cableData.numberOfRuns || 1;
                             actualLengthPerUnit.inverterToLVPanel = actualLengths.inverterToLVPanel * actualRuns.inverterToLVPanel;
                             // console.log(`   → Set inverterToLVPanel = ${cableData.length}m × ${actualRuns.inverterToLVPanel} runs = ${actualLengthPerUnit.inverterToLVPanel}m per unit`);
                           } else if (lowerKey.includes('output-panel') || (lowerKey.includes('output') && lowerKey.includes('panel'))) {
                             // 'output-Panel' - LV Panel to PoC
                             actualLengths.lvPanelToPoC = cableData.length;
                             actualRuns.lvPanelToPoC = cableData.numberOfRuns || 1;
                             actualLengthPerUnit.lvPanelToPoC = actualLengths.lvPanelToPoC * actualRuns.lvPanelToPoC;
                             // console.log(`   → Set lvPanelToPoC = ${cableData.length}m × ${actualRuns.lvPanelToPoC} runs = ${actualLengthPerUnit.lvPanelToPoC}m per unit`);
                           } else if (lowerKey.includes('panel') && lowerKey.includes('idt')) {
                             // LV Panel to IDT
                             actualLengths.lvPanelToIDT = cableData.length;
                             actualRuns.lvPanelToIDT = cableData.numberOfRuns || 1;
                             actualLengthPerUnit.lvPanelToIDT = actualLengths.lvPanelToIDT * actualRuns.lvPanelToIDT;
                             // console.log(`   → Set lvPanelToIDT = ${cableData.length}m × ${actualRuns.lvPanelToIDT} runs = ${actualLengthPerUnit.lvPanelToIDT}m per unit`);
                           } else if (lowerKey.includes('idt_to_transformer') || (lowerKey.includes('idt') && lowerKey.includes('transformer'))) {
                             // 'idt_to_transformer' - IDT to Power Transformer
                             actualLengths.idtToPowerTransformer = cableData.length;
                             actualRuns.idtToPowerTransformer = cableData.numberOfRuns || 1;
                             actualLengthPerUnit.idtToPowerTransformer = actualLengths.idtToPowerTransformer * actualRuns.idtToPowerTransformer;
                             // console.log(`   → Set idtToPowerTransformer = ${cableData.length}m × ${actualRuns.idtToPowerTransformer} runs = ${actualLengthPerUnit.idtToPowerTransformer}m per unit`);
                           } else if (lowerKey.includes('transformer_to_poc') || (lowerKey.includes('transformer') && lowerKey.includes('poc'))) {
                             // 'transformer_to_poc' - Power Transformer to PoC
                             actualLengths.powerTransformerToPoC = cableData.length;
                             actualRuns.powerTransformerToPoC = cableData.numberOfRuns || 1;
                             actualLengthPerUnit.powerTransformerToPoC = actualLengths.powerTransformerToPoC * actualRuns.powerTransformerToPoC;
                             // console.log(`   → Set powerTransformerToPoC = ${cableData.length}m × ${actualRuns.powerTransformerToPoC} runs = ${actualLengthPerUnit.powerTransformerToPoC}m per unit`);
                           } else if ((lowerKey.includes('output') && lowerKey.includes('idt')) || lowerKey.includes('central')) {
                             // 'output-Inv to IDT (Max 3)' - Central Inverter to IDT
                             actualLengths.inverterToIDT = cableData.length;
                             actualRuns.inverterToIDT = cableData.numberOfRuns || 1;
                             actualLengthPerUnit.inverterToIDT = actualLengths.inverterToIDT * actualRuns.inverterToIDT;
                             // console.log(`   → Set inverterToIDT = ${cableData.length}m × ${actualRuns.inverterToIDT} runs = ${actualLengthPerUnit.inverterToIDT}m per unit`);
                           }
                         });
                         
                         // console.log('🔧 Design Summary - Final actualLengths (distance):', actualLengths);
                         // console.log('🔧 Design Summary - Final actualRuns:', actualRuns);
                         // console.log('🔧 Design Summary - Final actualLengthPerUnit (distance × runs):', actualLengthPerUnit);
                       }
                       
                       const circuits = [];
                       
                       if (connectionType === 'LV') {
                         // LV Connection Type
                         circuits.push({
                           name: 'Inverters to LV AC Panel',
                           singleLength: actualLengthPerUnit.inverterToLVPanel, // Distance × Runs
                           count: inverterCount,
                           totalLength: actualLengthPerUnit.inverterToLVPanel * inverterCount, // (Distance × Runs) × Count
                           description: `${inverterCount} inverters × ${actualLengthPerUnit.inverterToLVPanel}m each (${actualLengths.inverterToLVPanel}m × ${actualRuns.inverterToLVPanel} runs)`
                         });
                         
                         circuits.push({
                           name: 'LV AC Panel to Point of Connection (PoC)',
                           singleLength: actualLengthPerUnit.lvPanelToPoC, // Distance × Runs
                           count: 1,
                           totalLength: actualLengthPerUnit.lvPanelToPoC, // (Distance × Runs) × 1
                           description: `Single connection (${actualLengths.lvPanelToPoC}m × ${actualRuns.lvPanelToPoC} runs)`
                         });
                         
                       } else if (connectionType === 'HV') {
                         if (inverterType === 'STRING') {
                           // HV Connection - String Inverters
                           circuits.push({
                             name: 'String Inverters to LV AC Panel',
                             singleLength: actualLengthPerUnit.inverterToLVPanel, // Distance × Runs
                             count: inverterCount,
                             totalLength: actualLengthPerUnit.inverterToLVPanel * inverterCount, // (Distance × Runs) × Count
                             description: `${inverterCount} string inverters × ${actualLengthPerUnit.inverterToLVPanel}m each (${actualLengths.inverterToLVPanel}m × ${actualRuns.inverterToLVPanel} runs)`
                           });
                           
                           // Calculate number of LV panels (typically one per group of inverters)
                           const lvPanelCount = acConfiguration.hvStringConfig?.lvACCombinerPanels?.count || Math.ceil(inverterCount / 8);
                           
                           circuits.push({
                             name: 'LV AC Panel to Inverter Duty Transformer (IDT)',
                             singleLength: actualLengthPerUnit.lvPanelToIDT, // Distance × Runs
                             count: lvPanelCount,
                             totalLength: actualLengthPerUnit.lvPanelToIDT * lvPanelCount, // (Distance × Runs) × Count
                             description: `${lvPanelCount} LV panels × ${actualLengthPerUnit.lvPanelToIDT}m each (${actualLengths.lvPanelToIDT}m × ${actualRuns.lvPanelToIDT} runs)`
                           });
                           
                           // IDT count (typically one per group)
                           const idtCount = acConfiguration.hvStringConfig?.idts?.count || Math.ceil(inverterCount / 8);
                           
                           circuits.push({
                             name: 'IDT to Power Transformer',
                             singleLength: actualLengthPerUnit.idtToPowerTransformer, // Distance × Runs
                             count: idtCount,
                             totalLength: actualLengthPerUnit.idtToPowerTransformer * idtCount, // (Distance × Runs) × Count
                             description: `${idtCount} IDTs × ${actualLengthPerUnit.idtToPowerTransformer}m each (${actualLengths.idtToPowerTransformer}m × ${actualRuns.idtToPowerTransformer} runs)`
                           });
                           
                           circuits.push({
                             name: 'Power Transformer to Point of Connection (PoC)',
                             singleLength: actualLengthPerUnit.powerTransformerToPoC, // Distance × Runs
                             count: 1,
                             totalLength: actualLengthPerUnit.powerTransformerToPoC, // (Distance × Runs) × 1
                             description: `Single connection (${actualLengths.powerTransformerToPoC}m × ${actualRuns.powerTransformerToPoC} runs)`
                           });
                           
                         } else if (inverterType === 'CENTRAL') {
                           // HV Connection - Central Inverters
                           const idtCount = acConfiguration.hvCentralConfig?.idts?.count || inverterCount;
                           
                           circuits.push({
                             name: 'Central Inverters to Inverter Duty Transformer (IDT)',
                             singleLength: actualLengthPerUnit.inverterToIDT, // Distance × Runs
                             count: inverterCount,
                             totalLength: actualLengthPerUnit.inverterToIDT * inverterCount, // (Distance × Runs) × Count
                             description: `${inverterCount} central inverters × ${actualLengthPerUnit.inverterToIDT}m each (${actualLengths.inverterToIDT}m × ${actualRuns.inverterToIDT} runs)`
                           });
                           
                           circuits.push({
                             name: 'IDT to Power Transformer',
                             singleLength: actualLengthPerUnit.idtToPowerTransformer, // Distance × Runs
                             count: idtCount,
                             totalLength: actualLengthPerUnit.idtToPowerTransformer * idtCount, // (Distance × Runs) × Count
                             description: `${idtCount} IDTs × ${actualLengthPerUnit.idtToPowerTransformer}m each (${actualLengths.idtToPowerTransformer}m × ${actualRuns.idtToPowerTransformer} runs)`
                           });
                           
                           circuits.push({
                             name: 'Power Transformer to Point of Connection (PoC)',
                             singleLength: actualLengthPerUnit.powerTransformerToPoC, // Distance × Runs
                             count: 1,
                             totalLength: actualLengthPerUnit.powerTransformerToPoC, // (Distance × Runs) × 1
                             description: `Single connection (${actualLengths.powerTransformerToPoC}m × ${actualRuns.powerTransformerToPoC} runs)`
                           });
                         }
                       }
                       
                       // Calculate grand total
                       const grandTotal = circuits.reduce((sum, circuit) => sum + circuit.totalLength, 0);
                       
                       return (
                         <div className="space-y-4">
                           {/* Configuration Summary */}
                           <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                             <div className="grid grid-cols-3 gap-4 text-sm">
                               <div>
                                 <span className="text-gray-600">Connection Type:</span>
                                 <div className="font-semibold text-blue-700">{connectionType}</div>
                               </div>
                               <div>
                                 <span className="text-gray-600">Inverter Type:</span>
                                 <div className="font-semibold text-blue-700">{inverterType}</div>
                               </div>
                               <div>
                                 <span className="text-gray-600">Inverter Count:</span>
                                 <div className="font-semibold text-blue-700">{inverterCount}</div>
                               </div>
                             </div>
                           </div>
                           
                           {/* Circuit-wise Cable Lengths */}
                           <div className="overflow-x-auto">
                             <table className="w-full text-sm">
                               <thead>
                                 <tr className="border-b border-orange-200">
                                   <th className="text-left py-2 px-3 text-orange-900">Circuit</th>
                                   <th className="text-right py-2 px-3 text-orange-900">Length per Unit (m)</th>
                                   <th className="text-right py-2 px-3 text-orange-900">Quantity</th>
                                   <th className="text-right py-2 px-3 text-orange-900">Total Length (m)</th>
                                   <th className="text-left py-2 px-3 text-orange-900">Description</th>
                                 </tr>
                               </thead>
                               <tbody>
                                 {circuits.map((circuit, index) => (
                                   <tr key={index} className="border-b border-gray-100">
                                     <td className="py-2 px-3 font-medium">{circuit.name}</td>
                                     <td className="py-2 px-3 text-right">{circuit.singleLength}</td>
                                     <td className="py-2 px-3 text-right">{circuit.count}</td>
                                     <td className="py-2 px-3 text-right font-bold text-blue-600">{circuit.totalLength}</td>
                                     <td className="py-2 px-3 text-gray-600 text-xs">{circuit.description}</td>
                                   </tr>
                                 ))}
                                 {circuits.length > 1 && (
                                   <tr className="border-t-2 border-orange-300 bg-orange-50">
                                     <td className="py-3 px-3 font-bold text-orange-900" colSpan={3}>
                                       Grand Total AC Cable Length
                                     </td>
                                     <td className="py-3 px-3 text-right font-bold text-xl text-orange-900">
                                       {grandTotal} m
                                     </td>
                                     <td className="py-3 px-3 text-gray-600 text-xs">
                                       All circuits combined
                                     </td>
                                   </tr>
                                 )}
                               </tbody>
                             </table>
                           </div>
                           
                           {/* Total Length Summary Cards */}
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                             <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                               <div className="text-2xl font-bold text-blue-900">{grandTotal} m</div>
                               <div className="text-sm text-blue-700">Total AC Cable Length</div>
                             </div>
                             <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                               <div className="text-2xl font-bold text-green-900">{circuits.length}</div>
                               <div className="text-sm text-green-700">Number of Circuits</div>
                             </div>
                             <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                               <div className="text-2xl font-bold text-purple-900">{(grandTotal / 1000).toFixed(2)} km</div>
                               <div className="text-sm text-purple-700">Total Length (km)</div>
                             </div>
                           </div>
                         </div>
                       );
                     })()}
                   </div>
                 </div>

                 {/* AC Cable Losses Display - Enhanced */}
                 {((acConfiguration.actualCableLosses && acConfiguration.actualCableLosses.kW > 0) || acConfiguration.totalACLosses > 0) && (
                   <div className="mb-6">
                     <h4 className="text-lg font-semibold text-orange-900 mb-3 flex items-center gap-2">
                       <Zap className="h-4 w-4" />
                       AC Cable Losses
                     </h4>
                                            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-lg border border-red-200">
                         <div className="text-center mb-4">
                           <div className="text-3xl font-bold text-red-700 mb-2">
                             {(acConfiguration.actualCableLosses?.kW || acConfiguration.totalACLosses || 0).toFixed(2)} kW
                           </div>
                           <div className="text-lg text-red-600 font-medium">
                             Total Cable Losses {acConfiguration.actualCableLosses?.percentage ? 
                               `(${acConfiguration.actualCableLosses.percentage.toFixed(2)}%)` : 
                               `(${((acConfiguration.totalACLosses || 0) / capacity * 100).toFixed(2)}%)`}
                           </div>
                           <div className="text-sm text-red-500 mt-1">
                             {acConfiguration.actualCableLosses?.sections ? 
                               `From ${acConfiguration.actualCableLosses.sections} cable section${acConfiguration.actualCableLosses.sections !== 1 ? 's' : ''}` :
                               'Total AC system cable losses'}
                           </div>
                         </div>
                         
                         {/* Breakdown by sections if available */}
                         {acConfiguration.actualCableLosses?.details && Object.keys(acConfiguration.actualCableLosses.details).length > 0 && (
                           <div className="mt-4 bg-white p-3 rounded border border-red-100">
                             <div className="text-sm text-red-800 font-medium mb-2">Loss Breakdown by Section:</div>
                             <div className="grid grid-cols-1 gap-2">
                               {Object.entries(acConfiguration.actualCableLosses.details).map(([sectionId, losses]) => {
                                 // Use sequential details if available for more accurate loss values
                                 const sequentialLoss = acConfiguration.actualCableLosses?.sequentialDetails?.[sectionId];
                                 const displayLoss = sequentialLoss || losses;
                                 
                                 return (
                                   <div key={sectionId} className="flex justify-between text-sm border-b border-red-50 pb-1">
                                     <span className="text-red-700 capitalize">
                                       {sectionId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/-/g, ' ')}:
                                     </span>
                                     <div className="text-right">
                                       <span className="font-medium text-red-800">
                                         {displayLoss.kW.toFixed(3)} kW ({displayLoss.percentage.toFixed(2)}%)
                                       </span>
                                       {sequentialLoss && (
                                         <div className="text-xs text-red-600">
                                           At {sequentialLoss.powerAtStage.toFixed(1)} kW stage
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                 );
                               })}
                             </div>
                             
                             {/* Calculation method explanation */}
                             {acConfiguration.actualCableLosses?.sequentialDetails && (
                               <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                                 <div className="text-xs text-blue-800">
                                   {acConfiguration.connectionType === 'HV' ? (
                                     <>
                                       <strong>HV Additive Loss Calculation:</strong> For HV connections, cable loss percentages are added together 
                                       ({Object.values(acConfiguration.actualCableLosses.details).map(loss => `${(loss && typeof loss === 'object' && 'percentage' in loss && typeof loss.percentage === 'number') ? loss.percentage.toFixed(2) : '0'}%`).join(' + ')} = {acConfiguration.actualCableLosses.percentage.toFixed(2)}%). 
                                       Absolute losses calculated as: Total System Power × Total Loss Percentage.
                                     </>
                                   ) : (
                                     <>
                                       <strong>LV Sequential Loss Calculation:</strong> Losses are applied sequentially through the power flow path.
                                       Each stage receives the power remaining after previous losses.
                                     </>
                                   )}
                                 </div>
                               </div>
                             )}
                           </div>
                         )}
                     </div>
                   </div>
                 )}

                 {/* Transformer Losses for HV connections */}
                 {acConfiguration.connectionType === 'HV' && (
                   <div className="bg-white p-4 rounded-lg border border-purple-200">
                     <div className="text-center">
                       <h4 className="font-semibold text-purple-900 mb-2">Transformer Losses</h4>
                       <div className="grid grid-cols-1 gap-2">
                         {/* IDT Losses */}
                         {(acConfiguration.idtConfig || acConfiguration.hvStringConfig?.idts || acConfiguration.hvCentralConfig?.idts) && (
                           <div>
                             <div className="text-lg font-bold text-purple-900">
                               {(() => {
                                 let idtLosses = 0;
                                 
                                 // Use only the appropriate configuration based on connection type and inverter type
                                 if (acConfiguration.connectionType === 'HV') {
                                   if (acConfiguration.inverterType === 'STRING' && acConfiguration.hvStringConfig?.idts) {
                                     // HV String configuration
                                     acConfiguration.hvStringConfig.idts.configurations.forEach(idt => {
                                       idtLosses += idt.copperLoss + idt.ironLoss;
                                     });
                                   } else if (acConfiguration.inverterType === 'CENTRAL' && acConfiguration.hvCentralConfig?.idts) {
                                     // HV Central configuration
                                     acConfiguration.hvCentralConfig.idts.configurations.forEach(idt => {
                                       idtLosses += idt.copperLoss + idt.ironLoss;
                                     });
                                   }
                                 } else if (acConfiguration.connectionType === 'LV' && acConfiguration.idtConfig) {
                                   // Legacy LV configuration
                                   idtLosses = (acConfiguration.idtConfig.copperLoss + acConfiguration.idtConfig.ironLoss) * acConfiguration.idtConfig.count;
                                 }
                                 
                                 return idtLosses.toFixed(2);
                               })()} kW
                             </div>
                             <div className="text-xs text-purple-700">IDT Losses</div>
                           </div>
                         )}
                         {/* Power Transformer Losses - Only show when PT is actually enabled */}
                         {(() => {
                           let showPT = false;
                           let ptLosses = 0;
                           
                           // Check if PT is actually enabled based on configuration type
                           if (acConfiguration.connectionType === 'HV') {
                             if (acConfiguration.inverterType === 'STRING' && acConfiguration.hvStringConfig?.powerTransformer) {
                               // HV String: PT is enabled
                               showPT = true;
                               ptLosses = acConfiguration.hvStringConfig.powerTransformer.copperLoss + acConfiguration.hvStringConfig.powerTransformer.ironLoss;
                             } else if (acConfiguration.inverterType === 'CENTRAL' && acConfiguration.hvCentralConfig?.powerTransformer) {
                               // HV Central: PT is enabled
                               showPT = true;
                               ptLosses = acConfiguration.hvCentralConfig.powerTransformer.copperLoss + acConfiguration.hvCentralConfig.powerTransformer.ironLoss;
                             }
                           } else if (acConfiguration.connectionType === 'LV' && acConfiguration.powerTransformerConfig) {
                             // Legacy LV configuration
                             showPT = true;
                             ptLosses = acConfiguration.powerTransformerConfig.copperLoss + acConfiguration.powerTransformerConfig.ironLoss;
                           }
                           
                           return showPT ? (
                             <div>
                               <div className="text-lg font-bold text-purple-900">
                                 {ptLosses.toFixed(2)} kW
                               </div>
                               <div className="text-xs text-purple-700">Power Transformer Losses</div>
                             </div>
                           ) : null;
                         })()}
                       </div>
                     </div>
                   </div>
                 )}
               </Card>
             )}

             {/* System Performance Parameters */}
             <Card className="p-6 bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200">
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-gray-600 rounded-lg">
                   <Settings className="h-5 w-5 text-white" />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-gray-900">System Performance Parameters</h3>
                   <p className="text-gray-700 text-sm">Configuration and design specifications</p>
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                 <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                   <div className="text-sm text-gray-600 mb-1">Array Type</div>
                   <div className="text-lg font-bold text-gray-900">
                     {arrayType === 0 ? 'Fixed (Open Rack)' :
                      arrayType === 1 ? 'Fixed (Roof Mounted)' :
                      arrayType === 2 ? '1-Axis Tracking' :
                      arrayType === 3 ? '1-Axis Backtracking' :
                      arrayType === 4 ? '2-Axis Tracking' : 'Unknown'}
                   </div>
                 </div>
                 <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                   <div className="text-sm text-gray-600 mb-1">DC/AC Ratio</div>
                   <div className="text-lg font-bold text-gray-900">{manualDcAcRatio?.toFixed(2)}</div>
                 </div>
                 <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                   <div className="text-sm text-gray-600 mb-1">Power Density</div>
                   <div className="text-lg font-bold text-gray-900">{(capacity / (polygonConfigs?.reduce((sum, config) => sum + config.area, 0) || 1) * 1000).toFixed(0)} W/m²</div>
                 </div>
                 <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                   <div className="text-sm text-gray-600 mb-1">Surface Albedo</div>
                   <div className="text-lg font-bold text-gray-900">{albedo.toFixed(2)}</div>
                   <div className="text-xs text-gray-500 mt-1 truncate" title={surfaceType}>
                     {surfaceType}
                   </div>
                 </div>
                 <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                   <div className="text-sm text-gray-600 mb-1">Ground Coverage Ratio</div>
                   <div className="text-lg font-bold text-gray-900">{(groundCoverageRatio * 100).toFixed(1)}%</div>
                   <div className="text-xs text-gray-500 mt-1">GCR: {groundCoverageRatio.toFixed(3)}</div>
                 </div>
               </div>
             </Card>

             {/* Map Image if available */}
             {capturedMapImage && (
               <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-green-600 rounded-lg">
                     <MapPin className="h-5 w-5 text-white" />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold text-green-900">Site Layout</h3>
                     <p className="text-green-700 text-sm">Captured installation site overview</p>
                   </div>
                 </div>
                 <div className="bg-gray-100 p-4 rounded-lg">
                   <img src={capturedMapImage} alt="Site Layout" className="w-full max-w-md mx-auto rounded shadow" />
                   {capturedMapMetadata && (
                     <div className="mt-2 text-sm text-gray-600 text-center">
                       Captured: {capturedMapMetadata.timestamp?.toLocaleDateString()}
                     </div>
                   )}
                 </div>
                             </Card>
            )}


          </div>

          {/* Structural Materials BOQ Summary */}
          {structuralMaterials && structuralMaterials.length > 0 && (
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-600 rounded-lg">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-900">Structural Materials BOQ</h3>
                  <p className="text-green-700 text-sm">Bill of Quantities for structural components</p>
                </div>
              </div>

              {/* BOQ Summary Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
                  <div className="text-2xl font-bold text-green-900">{structuralMaterials.length}</div>
                  <div className="text-sm text-green-700">Material Items</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
                  <div className="text-2xl font-bold text-green-900">{[...new Set(structuralMaterials.map(m => m.structureType))].length}</div>
                  <div className="text-sm text-green-700">Structure Types</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
                  <div className="text-2xl font-bold text-green-900">{[...new Set(structuralMaterials.map(m => m.category))].length}</div>
                  <div className="text-sm text-green-700">Categories</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
                  <div className="text-2xl font-bold text-green-900">{polygonConfigs?.length || 0}</div>
                  <div className="text-sm text-green-700">Installation Areas</div>
                </div>
              </div>

              {/* BOQ Materials by Category */}
              <div className="space-y-4">
                <h4 className="font-medium text-green-900">Materials by Category</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-green-300">
                    <thead>
                      <tr className="bg-green-100">
                        <th className="border border-green-300 px-3 py-2 text-left text-sm font-semibold text-green-900">Item</th>
                        <th className="border border-green-300 px-3 py-2 text-left text-sm font-semibold text-green-900">Description</th>
                        <th className="border border-green-300 px-3 py-2 text-center text-sm font-semibold text-green-900">Unit</th>
                        <th className="border border-green-300 px-3 py-2 text-right text-sm font-semibold text-green-900">Quantity</th>
                        <th className="border border-green-300 px-3 py-2 text-center text-sm font-semibold text-green-900">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {structuralMaterials.map((material, index) => (
                        <tr key={material.id} className={`hover:bg-green-50 ${index % 2 === 0 ? 'bg-white' : 'bg-green-25'}`}>
                          <td className="border border-green-300 px-3 py-2 font-medium text-sm">{material.item}</td>
                          <td className="border border-green-300 px-3 py-2 text-sm text-gray-700">{material.description}</td>
                          <td className="border border-green-300 px-3 py-2 text-center font-medium text-sm">{material.unit}</td>
                          <td className="border border-green-300 px-3 py-2 text-right font-bold text-sm">{material.quantity.toLocaleString()}</td>
                          <td className="border border-green-300 px-3 py-2 text-center">
                            <Badge variant="outline" className="text-xs">{material.category}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                <div className="text-xs text-blue-800">
                  <strong>Note:</strong> This BOQ is based on standard engineering practices. 
                  Actual requirements may vary based on site conditions and local building codes. 
                  Please consult with a structural engineer for final verification.
                </div>
              </div>
            </Card>
          )}

          {/* Electrical Materials BOQ Summary */}
          {electricalMaterials && electricalMaterials.length > 0 && (
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-900">Electrical Materials BOQ</h3>
                  <p className="text-blue-700 text-sm">Bill of Quantities for electrical components</p>
                </div>
              </div>

              {/* BOQ Summary Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                  <div className="text-2xl font-bold text-blue-900">{electricalMaterials.length}</div>
                  <div className="text-sm text-blue-700">Material Items</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                  <div className="text-2xl font-bold text-blue-900">{[...new Set(electricalMaterials.map(m => m.category))].length}</div>
                  <div className="text-sm text-blue-700">Categories</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                  <div className="text-2xl font-bold text-blue-900">{electricalMaterials[0]?.connectionType || 'N/A'}</div>
                  <div className="text-sm text-blue-700">Connection Type</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                  <div className="text-2xl font-bold text-blue-900">{electricalMaterials[0]?.inverterType || 'N/A'}</div>
                  <div className="text-sm text-blue-700">Inverter Type</div>
                </div>
              </div>

              {/* BOQ Materials by Category */}
              <div className="space-y-4">
                <h4 className="font-medium text-blue-900">Electrical Materials by Category</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-blue-300">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="border border-blue-300 px-3 py-2 text-left text-sm font-semibold text-blue-900">Item</th>
                        <th className="border border-blue-300 px-3 py-2 text-left text-sm font-semibold text-blue-900">Description</th>
                        <th className="border border-blue-300 px-3 py-2 text-center text-sm font-semibold text-blue-900">Unit</th>
                        <th className="border border-blue-300 px-3 py-2 text-right text-sm font-semibold text-blue-900">Quantity</th>
                        <th className="border border-blue-300 px-3 py-2 text-center text-sm font-semibold text-blue-900">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {electricalMaterials.map((material, index) => (
                        <tr key={material.id} className={`hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-blue-25'}`}>
                          <td className="border border-blue-300 px-3 py-2 font-medium text-sm">{material.item}</td>
                          <td className="border border-blue-300 px-3 py-2 text-sm text-gray-700">{material.description}</td>
                          <td className="border border-blue-300 px-3 py-2 text-center font-medium text-sm">{material.unit}</td>
                          <td className="border border-blue-300 px-3 py-2 text-right font-bold text-sm">{material.quantity.toLocaleString()}</td>
                          <td className="border border-blue-300 px-3 py-2 text-center">
                            <Badge variant="outline" className="text-xs">{material.category}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 p-3 bg-amber-50 rounded border border-amber-200">
                <div className="text-xs text-amber-800">
                  <strong>Note:</strong> This electrical BOQ is based on standard industry practices and typical installation parameters. 
                  Actual requirements may vary based on local electrical codes, grid connection requirements, and site conditions. 
                  Please consult with a qualified electrical engineer for final verification.
                </div>
              </div>
            </Card>
          )}
          
          <div className="flex justify-between mt-6">
            <Button
              onClick={() => setActiveTab("acconfig")}
              variant="outline"
              className="group flex items-center gap-2"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              Back to AC Config
            </Button>
            <Button
              onClick={() => setActiveTab("losses")}
              className="group relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              disabled={!selectedInverter}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <span className="relative flex items-center gap-2">
                Continue to Losses
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Button>
          </div>
          </div>
        </TabsContent>

        {/* Losses Tab */}
        <TabsContent value="losses">
          <div className="xl:max-w-6xl xl:mx-auto">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-500" />
              System Performance & Losses
            </h2>
            
            <div className="space-y-4">
              {/* Hide Design Summary section as requested */}
              <div className="hidden">
                <EfficiencyAdjustment 
                  selectedPanel={selectedPanel}
                  systemCapacity={capacity}
                />
              </div>
              
              <DetailedLossesConfiguration 
                losses={losses}
                onLossesChange={setLosses}
                onDetailedLossesChange={setDetailedLosses}
                acConfiguration={acConfiguration}
                systemSize={capacity}
                dcStringCableData={dcStringCableData}
                dcdbCableData={dcdbCableData}
                selectedInverter={selectedInverter}
              />
            </div>
          </Card>
          
          <div className="flex justify-between mt-6">
            <Button
              onClick={() => setActiveTab("summary")}
              variant="outline"
              className="group flex items-center gap-2"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              Back to Design Summary
            </Button>
            <Button
              onClick={handleCalculate}
              className="group relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              disabled={calculating || !selectedInverter}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <span className="relative flex items-center gap-2">
                {calculating ? (
                  <>Calculating...</>
                ) : (
                  <>
                    Calculate Production Results
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </Button>
          </div>
          </div>
        </TabsContent>

        {/* Keep empty configuration tab to maintain structure but hide from user */}
        <TabsContent value="configuration" className="hidden">
        </TabsContent>
        
        <TabsContent value="results">
          {results && (
            <div className="xl:max-w-6xl xl:mx-auto">
            <ProductionResults 
              results={results} 
              systemParams={{
                capacity,
                tilt,
                azimuth,
                moduleEfficiency,
                losses,
                arrayType,
                latitude,
                longitude,
                timezone,
                dcAcRatio: manualDcAcRatio,
                inverterCount: manualInverterCount
              }}
              selectedPanel={selectedPanel}
              selectedInverter={selectedInverter}
              polygonConfigs={polygonConfigs}
              acConfiguration={acConfiguration}
              detailedLosses={detailedLosses}
              mapImage={capturedMapImage}
              sldImage={capturedSLDImage}
              sldMetadata={capturedSLDMetadata}
                onNewCalculation={() => setActiveTab("location")}
              />
              
              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <Button
                  onClick={() => setActiveTab("losses")}
                  variant="outline"
                  className="group flex items-center gap-2"
                >
                  <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  Back to Losses
                </Button>
                <Button
                  onClick={() => setActiveTab("detailed-boq")}
                  className="group relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <span className="relative flex items-center gap-2">
                    Continue to AI BOQ
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* BOQ Parameters Debug Tab */}
        <TabsContent value="boq-debug">
          {results && (
            <div className="xl:max-w-6xl xl:mx-auto">
              <BOQParameterPanel
                polygonConfigs={polygonConfigs}
                selectedPanel={selectedPanel}
                selectedInverter={selectedInverter}
                structureType={polygonConfigs?.[0]?.structureType || 'ballasted'}
                connectionType={acConfiguration.connectionType}
                isCentralInverter={acConfiguration.inverterType === 'CENTRAL'}
                manualInverterCount={manualInverterCount}
                totalStringCount={
                  selectedInverter?.total_string_inputs ||
                  selectedInverter?.strings || 
                  selectedInverter?.max_strings || 
                  selectedInverter?.string_input || 
                  selectedInverter?.inputs ||
                  selectedInverter?.string_inputs ||
                  selectedInverter?.mppt_inputs ||
                  (selectedInverter?.mppt_inputs && selectedInverter?.strings_per_mppt ? 
                    selectedInverter.mppt_inputs * selectedInverter.strings_per_mppt : null) ||
                  selectedInverter?.specifications?.strings ||
                  selectedInverter?.specifications?.max_strings ||
                  selectedInverter?.specs?.strings ||
                  selectedInverter?.parameters?.strings ||
                  selectedInverter?.electrical?.strings ||
                  selectedInverter?.dc_input?.strings ||
                  selectedInverter?.dc_inputs?.strings ||
                  20
                }
                averageStringCurrent={
                  selectedPanel?.isc_a ||
                  selectedPanel?.short_circuit_current || 
                  selectedPanel?.isc || 
                  selectedPanel?.shortCircuitCurrent ||
                  selectedPanel?.isc_stc ||
                  selectedPanel?.Isc ||
                  selectedPanel?.ISC ||
                  selectedPanel?.current_isc ||
                  selectedPanel?.module_isc ||
                  selectedPanel?.specifications?.isc ||
                  selectedPanel?.electrical?.isc ||
                  0
                }
                soilType={soilType}
                acConfigData={{
                  // Pass the actual AC configuration instead of hardcoded values
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  acConfiguration: acConfiguration as any,
                  cableData: {
                    // Use fallback values for now as AC config structure varies
                    // TODO: Extract actual cable lengths and cross sections from AC config when available
                    inverterToCombinerDistance: 50,
                    inverterToCombinerCrossSection: 16,
                    combinerToPoCDistance: 100,
                    combinerToPoCCrossSection: 50,
                    combinerToIDTDistance: 80,
                    combinerToIDTCrossSection: 95,
                    idtToPTDistance: 25,
                    idtToPTCrossSection: 185,
                    ptToPoCDistance: 150,
                    ptToPoCCrossSection: 240,
                    inverterToIDTDistance: 40,
                    inverterToIDTCrossSection: 185
                  },
                  breakerData: {
                    // Use fallback values for now as AC config structure varies
                    // TODO: Extract actual breaker ratings from AC config when available
                    incomeBreakerRating: 100,
                    outgoingBreakerRating: 63,
                    inverterToIDTType: "MCCB",
                    inverterToIDTRating: 400,
                    idtToPTType: "VCB",
                    idtToPTRating: 630,
                    ptToPoCType: "VCB",
                    ptToPoCRating: 630,
                    centralInverterToIDTType: "VCB",
                    centralInverterToIDTRating: 1250
                  },
                  transformerData: {
                    idtCount: 1,
                    idtInputVoltage: acConfiguration.connectionType === 'HV' ? (acConfiguration.inverterType === 'CENTRAL' ? 1500 : 400) : 400,
                    idtInputCurrent: 0,
                    idtOutputVoltage: 11000,
                    idtOutputCurrent: 0,
                    ptCount: 1,
                    ptInputVoltage: 11000,
                    ptInputCurrent: 0,
                    ptOutputVoltage: 33000,
                    ptOutputCurrent: 0,
                    mvaRating: acConfiguration.inverterType === 'CENTRAL' ? 2.5 : 1.0
                  }
                }}
                isVisible={true}
              />
            </div>
          )}
        </TabsContent>

        {/* BOQ Generation Tab */}
        <TabsContent value="boq">
          {results && (
            <BOQGenerator
              designSummaryData={{
                capacity,
                totalModules: polygonConfigs?.reduce((sum, config) => sum + config.moduleCount, 0) || 0,
                inverterCount: manualInverterCount,
                dcAcRatio: manualDcAcRatio,
                city,
                country,
                latitude,
                longitude,
                projectApplication,
                projectInstallation,
                selectedPanel,
                selectedInverter,
                polygonConfigs: polygonConfigs || [],
                acConfiguration,
                totalStringCount,
                averageStringVoltage,
                averageStringCurrent,
                centralStringSizingData,
                isCentralInverter,
                useDCCombiner,
                lowestTemperature,
                highestTemperature
              }}
            />
          )}
        </TabsContent>

        {/* Detailed BOQ Generation Tab */}
        <TabsContent value="detailed-boq">
          {results && (
            <div className="xl:max-w-6xl xl:mx-auto">
              <DetailedBOQGenerator
                polygonConfigs={polygonConfigs}
                selectedPanel={selectedPanel}
                selectedInverter={selectedInverter}
                structureType={polygonConfigs?.[0]?.structureType || 'ballasted'}
                connectionType={acConfiguration.connectionType}
                isCentralInverter={acConfiguration.inverterType === 'CENTRAL'}
                manualInverterCount={manualInverterCount}
                onBOQDataUpdate={setBoqDataForReport}
                totalStringCount={
                  selectedInverter?.total_string_inputs ||
                  selectedInverter?.strings || 
                  selectedInverter?.max_strings || 
                  selectedInverter?.string_input || 
                  selectedInverter?.inputs ||
                  selectedInverter?.string_inputs ||
                  selectedInverter?.mppt_inputs ||
                  (selectedInverter?.mppt_inputs && selectedInverter?.strings_per_mppt ? 
                    selectedInverter.mppt_inputs * selectedInverter.strings_per_mppt : null) ||
                  selectedInverter?.specifications?.strings ||
                  selectedInverter?.specifications?.max_strings ||
                  selectedInverter?.specs?.strings ||
                  selectedInverter?.parameters?.strings ||
                  selectedInverter?.electrical?.strings ||
                  selectedInverter?.dc_input?.strings ||
                  selectedInverter?.dc_inputs?.strings ||
                  20
                }
                averageStringCurrent={averageStringCurrent}
                averageStringVoltage={averageStringVoltage}
                capacity={capacity}
                soilType={soilType}
                acConfigData={acConfiguration}
                centralStringSizingData={centralStringSizingData}
                dcStringCableData={dcStringCableData}
                dcdbCableData={dcdbCableData}
                mapACConfigToInputs={mapACConfigurationToInputs}
                projectCountry={country}
                onTotalProjectCostCalculated={setTotalProjectCost}
                onNavigateToFinancials={() => setActiveTab('financials')}
                initialBOQData={comprehensiveBOQData}
                onComprehensiveBOQDataUpdate={handleComprehensiveBOQDataUpdate}
              />
              
              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <Button
                  onClick={() => setActiveTab("results")}
                  variant="outline"
                  className="group flex items-center gap-2"
                >
                  <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  Back to Results
                </Button>
                <Button
                  onClick={() => setActiveTab("financials")}
                  disabled={totalProjectCost <= 0}
                  className="group relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <span className="relative flex items-center gap-2">
                    Continue to Financials
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Financial Analysis Tab */}
        <TabsContent value="financials">
          {results && totalProjectCost > 0 && (
            <div className="xl:max-w-6xl xl:mx-auto">
              <FinancialAnalysis
                annualEnergyYear1={results.energy.metrics.total_yearly}
                totalProjectCost={totalProjectCost}
                isVisible={true}
                solarResults={results}
                systemParams={{
                  capacity,
                  tilt: tilt || 0,
                  azimuth: azimuth || 180,
                  moduleEfficiency: selectedPanel?.efficiency_percent || selectedPanel?.efficiency || 20,
                  losses: losses,
                  latitude: results.location?.latitude || results.location?.lat || 0,
                  longitude: results.location?.longitude || results.location?.lng || 0,
                  timezone: results.timezone || 'UTC',
                  dcAcRatio: manualDcAcRatio,
                  inverterCount: manualInverterCount || 1
                }}
                selectedPanel={selectedPanel}
                selectedInverter={selectedInverter}
                polygonConfigs={polygonConfigs}
                acConfiguration={acConfiguration}
                detailedLosses={detailedLosses}
                projectLocation={`${city || 'N/A'}, ${country || 'N/A'}`}
                boqData={boqDataForReport}
                projectName={`Solar PV Project - ${capacity.toFixed(2)} kWp`}
                onNavigateToAIReport={() => setActiveTab('ai-report')}
                onFinancialDataUpdate={(params, results) => {
                  setFinancialParamsForReport(params);
                  setFinancialResultsForReport(results);
                }}
                initialFinancialParams={financialParamsForReport}
                initialFinancialResults={financialResultsForReport}
              />
              
              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <Button
                  onClick={() => setActiveTab("detailed-boq")}
                  variant="outline"
                  className="group flex items-center gap-2"
                >
                  <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  Back to AI BOQ
                </Button>
                <Button
                  onClick={() => setActiveTab("ai-report")}
                  disabled={!boqDataForReport || boqDataForReport.length === 0}
                  className="group relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <span className="relative flex items-center gap-2">
                    Continue to AI Report
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* AI Feasibility Report Tab */}
        <TabsContent value="ai-report">
          {results && boqDataForReport && boqDataForReport.length > 0 && (
            <div className="xl:max-w-6xl xl:mx-auto">
              <AIFeasibilityReport
                solarResults={results}
                systemParams={{
                  capacity,
                  tilt: tilt || 0,
                  azimuth: azimuth || 180,
                  moduleEfficiency: selectedPanel?.efficiency_percent || selectedPanel?.efficiency || 20,
                  losses: losses,
                  arrayType: arrayType,
                  latitude: results.location?.latitude || results.location?.lat || 0,
                  longitude: results.location?.longitude || results.location?.lng || 0,
                  timezone: results.timezone || 'UTC',
                  dcAcRatio: manualDcAcRatio,
                  inverterCount: manualInverterCount || 1
                }}
                selectedPanel={selectedPanel}
                selectedInverter={selectedInverter}
                polygonConfigs={polygonConfigs}
                acConfiguration={acConfiguration}
                detailedLosses={detailedLosses}
                consolidatedBOQ={boqDataForReport}
                boqCostSummary={{
                  totalEquipmentCost: totalProjectCost, // TODO: Get from DetailedBOQGenerator
                  totalDevelopmentCost: 0, // TODO: Get from DetailedBOQGenerator
                  totalProjectCost: totalProjectCost
                }}
                financialParams={financialParamsForReport}
                financialResults={financialResultsForReport}
                location={{
                  address: `${city || ''}, ${country || ''}`,
                  latitude: latitude,
                  longitude: longitude,
                  timezone: timezone || 'UTC',
                  elevation: undefined,
                  country: country,
                  state: undefined
                }}
                metadata={{
                  annualEnergyYear1: results.energy.metrics.total_yearly,
                  totalStringCount: totalStringCount || 0,
                  manualInverterCount: manualInverterCount || 1,
                  capacity: capacity,
                  isCentralInverter: isCentralInverter || false
                }}
                initialReportFormData={aiReportFormData}
                initialGeneratedReport={aiGeneratedReport}
                onReportFormDataUpdate={(formData) => {
                  setAiReportFormData(formData);
                }}
                onGeneratedReportUpdate={(report) => {
                  setAiGeneratedReport(report);
                }}
              />
              
              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-6">
                <Button
                  onClick={() => setActiveTab("financials")}
                  variant="outline"
                  className="group flex items-center gap-2"
                >
                  <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  Back to Financials
                </Button>

                <div className="flex items-center gap-4">
                  {/* Save Status Indicator */}
                  {isSaving && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      <span>Saving...</span>
                    </div>
                  )}
                  {lastSavedAt && !isSaving && (
                    <div className="text-sm text-slate-600">
                      Last saved: {lastSavedAt.toLocaleTimeString()}
                    </div>
                  )}

                  {/* Final Save Button */}
                  <Button
                    onClick={handleFinalSave}
                    disabled={isSaving || !projectName || !results}
                    className="group relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <span className="relative flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      {isSaving ? "Saving..." : "Save Project"}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedSolarCalculator;
