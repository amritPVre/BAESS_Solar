// Detailed BOQ Generator Component
// Based on working-reference/solar_pv_boq_prompt.md
// Implements comprehensive Solar PV BOQ calculations per IEC standards

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Download, 
  Zap,
  CheckCircle2,
  AlertCircle,
  Calculator,
  FileSpreadsheet,
  Copy,
  Bot,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { runBoqWorkflow, getBOQWorkflowResult, BOQWorkflowResult } from "../../services/boqWorkflowService";
import { ParsedBOQRow } from "../../services/boqTableParser";
import { useBOQParameterExtraction } from "../../hooks/useBOQParameterExtraction";
import { useAICredits } from "../../hooks/useAICredits";
import { useAuth } from "../../hooks/useAuth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import StructuralMaterialCalculator from "./StructuralMaterialCalculator";
import DCBOQCalculator from "./DCBOQCalculator";
import ACBOQCalculator from "./ACBOQCalculator";

// BOQ categorization function
interface CategorizedBOQ {
  category: string;
  items: ParsedBOQRow[];
  icon: string;
}

// Deep copy function to completely break all references and remove data-lov-id
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepCleanObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepCleanObject(item));
  }
  
  // Create a new object without data-lov-id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleaned: any = {};
  for (const key in obj) {
    if (key !== 'data-lov-id' && Object.prototype.hasOwnProperty.call(obj, key)) {
      cleaned[key] = deepCleanObject(obj[key]);
    }
  }
  return cleaned;
}

// Utility function to remove invalid React props from BOQ items
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanBOQItem(item: any): any {
  if (!item || typeof item !== 'object') return item;
  
  // Use deep clean to remove data-lov-id at all levels
  return deepCleanObject(item);
}

// Clean an array of BOQ items
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanBOQItems(items: any[]): any[] {
  if (!Array.isArray(items)) return items;
  return items.map(cleanBOQItem);
}

function categorizeBOQItems(items: ParsedBOQRow[]): CategorizedBOQ[] {
  const categories: Record<string, ParsedBOQRow[]> = {};
  
  items.forEach(item => {
    // CRITICAL: Clean each item immediately to remove data-lov-id
    const cleanItem = cleanBOQItem(item);
    
    let category = '';
    let icon = '';
    
    // Check if item has explicit category (from merged BOQ)
    if (cleanItem.category === 'DC_BOQ') {
      category = '01. DC BOQ';
      icon = '⚡';
    } else if (cleanItem.category === 'STRUCTURE_BOQ') {
      category = '02. STRUCTURE BOQ';
      icon = '🏗️';
    } else if (cleanItem.category === 'AC_BOQ') {
      category = '03. AC BOQ';
      icon = '🔌';
    } else {
      // For AI-generated items, categorize based on description
      // Use higher numbers (10+) to ensure they sort after system BOQ sections
      const desc = cleanItem.description.toLowerCase();
      
      if (desc.includes('dc') && (desc.includes('bonding') || desc.includes('jumper'))) {
        category = '10. DC Bonding & Grounding';
        icon = '🔩';
      } else if (desc.includes('dc') && (desc.includes('conductor') || desc.includes('cable'))) {
        category = '11. DC Earthing System';
        icon = '🌍';
      } else if (desc.includes('dc earth') || desc.includes('dc pit')) {
        category = '11. DC Earthing System';
        icon = '🌍';
      } else if (desc.includes('lightning') || desc.includes('ese') || desc.includes('la earth')) {
        category = '12. Lightning Protection';
        icon = '🌩️';
      } else if (desc.includes('earthing compound') || desc.includes('bentonite')) {
        category = '13. Earthing Materials';
        icon = '🪨';
      } else if (desc.includes('ac pe') || desc.includes('ac earth') || desc.includes('earth grid') || desc.includes('earth rod') || desc.includes('equipment bonding')) {
        category = '14. AC Earthing System';
        icon = '🔋';
      } else if (desc.includes('current transformer') || desc.includes('potential transformer') || desc.includes('ct') || desc.includes('pt')) {
        category = '15. Instrumentation (CT/PT)';
        icon = '📊';
      } else if (desc.includes('surge') || desc.includes('spd') || desc.includes('protection relay') || desc.includes('relay')) {
        category = '16. Protection & Control';
        icon = '🛡️';
      } else if (desc.includes('communication') || desc.includes('cable') || desc.includes('net meter') || desc.includes('meter')) {
        category = '17. Communication & Metering';
        icon = '📡';
      } else if (desc.includes('busbar') || desc.includes('panel') || desc.includes('feeder')) {
        category = '18. Electrical Equipment';
        icon = '⚙️';
      } else if (desc.includes('transformer') && desc.includes('earth')) {
        category = '19. Transformer Earthing (HV)';
        icon = '🔌';
      } else {
        category = '20. Other Components';
        icon = '📦';
      }
    }
    
    if (!categories[category]) {
      categories[category] = [];
    }
    // Push the already-cleaned item
    categories[category].push(cleanItem);
  });
  
  // Sort categories and convert to array
  // CRITICAL: Return primitive values only, no object spreading
  const sortedCategories = Object.keys(categories)
    .sort()
    .map(category => {
      const displayCategory = String(category.substring(3)); // Remove number prefix for display
      const displayIcon = String(getIconForCategory(category));
      const cleanedItems = categories[category].map(item => cleanBOQItem(item)); // Double-clean for safety
      
      // Return a new clean object with no possibility of data-lov-id
      return {
        category: displayCategory,
        items: cleanedItems,
        icon: displayIcon
      };
    });
  
  return sortedCategories;
}

function getIconForCategory(category: string): string {
  if (category.includes('DC BOQ')) return '⚡';
  if (category.includes('STRUCTURE BOQ')) return '🏗️';
  if (category.includes('AC BOQ')) return '🔌';
  if (category.includes('DC Bonding')) return '🔩';
  if (category.includes('DC Earthing')) return '🌍';
  if (category.includes('Lightning')) return '🌩️';
  if (category.includes('Materials')) return '🪨';
  if (category.includes('AC Earthing')) return '🔋';
  if (category.includes('Instrumentation')) return '📊';
  if (category.includes('Protection')) return '🛡️';
  if (category.includes('Communication')) return '📡';
  if (category.includes('Electrical')) return '⚙️';
  if (category.includes('Transformer')) return '🔌';
  return '📦';
}

// Type definitions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PolygonConfig = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PanelConfig = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InverterConfig = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ACConfigData = Record<string, any>;

interface DetailedBOQGeneratorProps {
  // Data inputs
  polygonConfigs?: PolygonConfig[];
  selectedPanel?: PanelConfig;
  selectedInverter?: InverterConfig;
  structureType?: string;
  connectionType?: 'LV' | 'HV';
  isCentralInverter?: boolean;
  manualInverterCount?: number;
  totalStringCount?: number;
  averageStringCurrent?: number;
  averageStringVoltage?: number;
  capacity?: number;
  soilType?: string;
  acConfigData?: ACConfigData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  centralStringSizingData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dcStringCableData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dcdbCableData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapACConfigToInputs?: (acConfig: any, inverterCount: number, inverterPowerKW: number) => any;
  projectCountry?: string;
  
  // Control props
  isVisible?: boolean;
  
  // Initial BOQ data for restoration
  initialBOQData?: {
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
  } | null;
  
  // Callbacks
  onTotalProjectCostCalculated?: (totalCost: number) => void;
  onNavigateToFinancials?: () => void;
  onBOQDataUpdate?: (boqData: Array<{
    slNo: number;
    description: string;
    specifications: string;
    unit: string;
    qty: string | number;
  }>) => void;
  onComprehensiveBOQDataUpdate?: (data: {
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
  }) => void;
}

const DetailedBOQGenerator: React.FC<DetailedBOQGeneratorProps> = ({
  polygonConfigs,
  selectedPanel,
  selectedInverter,
  structureType,
  connectionType,
  isCentralInverter,
  manualInverterCount,
  totalStringCount,
  averageStringCurrent,
  averageStringVoltage,
  capacity,
  soilType,
  acConfigData,
  centralStringSizingData,
  dcStringCableData,
  onTotalProjectCostCalculated,
  onNavigateToFinancials,
  dcdbCableData,
  mapACConfigToInputs,
  projectCountry = "United States",
  isVisible = true,
  onBOQDataUpdate,
  initialBOQData,
  onComprehensiveBOQDataUpdate
}) => {
  // Smart default tab: Show Results tab if we have existing BOQ data (saved project)
  // This prevents infinite re-render loop on the AI Generator tab when restoring data
  // Using lazy initialization - this function only runs ONCE during initial mount
  const [activeTab, setActiveTab] = useState(() => {
    if (initialBOQData?.mergedBOQ && initialBOQData.mergedBOQ.length > 0) {
      console.log('📊 Detected existing BOQ data - defaulting to Results tab');
      return "results";
    }
    if (initialBOQData?.pricedBOQ && initialBOQData.pricedBOQ.length > 0) {
      console.log('💰 Detected existing priced BOQ data - defaulting to Pricing tab');
      return "pricing";
    }
    console.log('🆕 No existing BOQ data - defaulting to AI Generator tab');
    return "generator";
  });
  const [generatedBOQ, setGeneratedBOQ] = useState<ParsedBOQRow[]>(initialBOQData?.generatedBOQ || []);
  const [mergedBOQ, setMergedBOQ] = useState<ParsedBOQRow[]>(initialBOQData?.mergedBOQ || []); // System + AI merged BOQ
  const [pricedBOQ, setPricedBOQ] = useState<Array<ParsedBOQRow & { 
    unitPrice: number; 
    totalPrice: number; 
    confidence: string;
    priceSource: 'ai' | 'web' | 'manual' | 'fixed';
    sourceUrl?: string;
    cachedAt?: number;
    pricingNotes?: string;
    totalKW?: number; // For panels/inverters with $/kW pricing
  }>>(initialBOQData?.pricedBOQ || []);
  const [workflowResult, setWorkflowResult] = useState<BOQWorkflowResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPricingGenerating, setIsPricingGenerating] = useState(false);
  const [isWebSearching, setIsWebSearching] = useState(false);
  const [generationTimestamp, setGenerationTimestamp] = useState<Date | null>(
    initialBOQData?.generationTimestamp ? new Date(initialBOQData.generationTimestamp) : null
  );
  const [pricingTimestamp, setPricingTimestamp] = useState<Date | null>(
    initialBOQData?.pricingTimestamp ? new Date(initialBOQData.pricingTimestamp) : null
  );
  const [selectedAIModel, setSelectedAIModel] = useState<'openai' | 'gemini'>(
    initialBOQData?.selectedAIModel || 'openai'
  );
  
  // Additional project costs state
  const [additionalCosts, setAdditionalCosts] = useState(
    initialBOQData?.additionalCosts || [
      { id: 1, name: 'Design Engineering Cost', percentage: 1, enabled: true },
      { id: 2, name: 'Statutory Approval Fees', percentage: 1, enabled: true },
      { id: 3, name: 'Project Management Fees', percentage: 2, enabled: true },
      { id: 4, name: 'Installation and Commissioning Cost', percentage: 10, enabled: true },
      { id: 5, name: 'Land Acquisition/Purchase Cost', percentage: 3, enabled: true },
      { id: 6, name: 'Land Development Cost', percentage: 1, enabled: true },
      { id: 7, name: 'Taxes and Duty Fees', percentage: 5, enabled: true },
      { id: 8, name: 'Insurance Fees', percentage: 1, enabled: true },
      { id: 9, name: 'International Logistics Cost', percentage: 2, enabled: true },
      { id: 10, name: 'Domestic Logistics to the Site Cost', percentage: 2, enabled: true },
      { id: 11, name: 'Finance Management Fees', percentage: 1, enabled: true },
      { id: 12, name: 'Contingencies', percentage: 3, enabled: true },
    ]
  );
  
  // Financial parameters state
  const [financialParams, setFinancialParams] = useState({
    omExpensesPercent: 1.5, // % of total project cost
    electricityRate: 0.12, // $/kWh
    omEscalationRate: 3.0, // %
    omEscalationFrequency: 1, // years
    tariffEscalationRate: 2.5, // %
    tariffEscalationFrequency: 1, // years
    annualDegradation: 0.5, // %
    discountRate: 8.0, // %
    governmentSubsidy: 0, // $
    incomeTaxRate: 21.0, // %
  });

  // AI Credits integration
  const { user } = useAuth();
  const { checkAndDeduct, hasCredits, balance, refreshBalance } = useAICredits();
  
  const [financialResults, setFinancialResults] = useState<{
    irr: number;
    lcoe: number;
    npv: number;
    paybackPeriod: number;
    avgROI: number;
    cashFlowTable: Array<{
      year: number;
      energyGenerated: number;
      revenue: number;
      omCost: number;
      grossProfit: number;
      tax: number;
      netProfit: number;
      cumulativeProfit: number;
      discountedCashFlow: number;
      cumulativeNPV: number;
    }>;
  } | null>(null);
  
  // Consolidated BOQ items state
  const [consolidatedBOQItems, setConsolidatedBOQItems] = useState<Array<{
    sNo: number;
    description: string;
    specifications: string;
    unit: string;
    qty: number | string;
    category: string;
    source: 'structure' | 'dc' | 'ac';
  }>>([]);
  const [structureItemCount, setStructureItemCount] = useState(0);
  const [dcItemCount, setDCItemCount] = useState(0);
  const [acItemCount, setACItemCount] = useState(0);

  // State to hold BOQ data from each source
  const [structureBOQData, setStructureBOQData] = useState<Array<{
    description: string;
    specifications: string;
    unit: string;
    qty: number | string;
    category: string;
  }>>([]);
  
  const [dcBOQData, setDCBOQData] = useState<Array<{
    description: string;
    specifications: string;
    unit: string;
    qty: number | string;
    category: string;
  }>>([]);
  
  const [acBOQData, setACBOQData] = useState<Array<{
    description: string;
    specifications: string;
    unit: string;
    qty: number | string;
    category: string;
  }>>([]);
  
  // Flag to prevent send-to-parent effect during restoration
  const [isRestoringData, setIsRestoringData] = useState(false);
  
  // Ref to track if we've already restored data (prevents re-restoration on prop updates from our own sends)
  const hasRestoredRef = React.useRef(false);

  // Callbacks to receive BOQ data from child components
  const handleStructureBOQCalculated = React.useCallback((materials: Array<{
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
  }>) => {
    // Transform StructuralMaterialItem[] to standardized BOQ format
    const getStructureTypeName = (type: string) => {
      const typeMap: Record<string, string> = {
        'ballasted': 'Ballasted System',
        'fixed_tilt': 'Fixed Tilt System',
        'elevated': 'Elevated Structure',
        'ground_mounted': 'Ground Mounted'
      };
      return typeMap[type] || type;
    };

    const standardizedItems = materials.map(material => ({
      description: `${material.item} - ${material.description} (Area ${material.areaIndex + 1} - ${getStructureTypeName(material.structureType)})`,
      specifications: `${material.specifications}${material.calculationBasis ? ` | Basis: ${material.calculationBasis}` : ''}`,
      unit: material.unit,
      qty: material.quantity,
      category: material.category
    }));
    
    setStructureBOQData(standardizedItems);
  }, []);

  const handleDCBOQCalculated = React.useCallback((items: Array<{
    description: string;
    specifications: string;
    unit: string;
    qty: number | string;
    category: string;
  }>) => {
    setDCBOQData(items);
  }, []);

  const handleACBOQCalculated = React.useCallback((items: Array<{
    description: string;
    specifications: string;
    unit: string;
    qty: number | string;
    category: string;
  }>) => {
    setACBOQData(items);
  }, []);

  // Restore BOQ data from initialBOQData when project is loaded (ONLY ONCE)
  useEffect(() => {
    // Only restore if we have data, haven't restored yet, and not currently restoring
    if (initialBOQData && !hasRestoredRef.current && !isRestoringData) {
      console.log('🔄 Restoring AI BOQ data from saved project:', {
        generatedBOQCount: initialBOQData.generatedBOQ?.length || 0,
        mergedBOQCount: initialBOQData.mergedBOQ?.length || 0,
        pricedBOQCount: initialBOQData.pricedBOQ?.length || 0,
        hasGenerationTimestamp: !!initialBOQData.generationTimestamp,
        hasPricingTimestamp: !!initialBOQData.pricingTimestamp,
        selectedAIModel: initialBOQData.selectedAIModel
      });

      // Mark that we're restoring and have restored
      setIsRestoringData(true);
      hasRestoredRef.current = true;

      // Restore generated BOQ (clean any invalid props)
      if (initialBOQData.generatedBOQ && initialBOQData.generatedBOQ.length > 0) {
        setGeneratedBOQ(cleanBOQItems(initialBOQData.generatedBOQ));
      }

      // Restore merged BOQ (clean any invalid props)
      if (initialBOQData.mergedBOQ && initialBOQData.mergedBOQ.length > 0) {
        setMergedBOQ(cleanBOQItems(initialBOQData.mergedBOQ));
      }

      // Restore priced BOQ (clean any invalid props)
      if (initialBOQData.pricedBOQ && initialBOQData.pricedBOQ.length > 0) {
        setPricedBOQ(cleanBOQItems(initialBOQData.pricedBOQ));
      }

      // Restore timestamps
      if (initialBOQData.generationTimestamp) {
        setGenerationTimestamp(new Date(initialBOQData.generationTimestamp));
      }
      if (initialBOQData.pricingTimestamp) {
        setPricingTimestamp(new Date(initialBOQData.pricingTimestamp));
      }

      // Restore AI model selection
      if (initialBOQData.selectedAIModel) {
        setSelectedAIModel(initialBOQData.selectedAIModel);
      }

      // Restore additional costs
      if (initialBOQData.additionalCosts && initialBOQData.additionalCosts.length > 0) {
        setAdditionalCosts(initialBOQData.additionalCosts);
      }

      console.log('✅ AI BOQ data restored successfully - will not restore again');
      
      // Reset flag after restoration is complete
      setTimeout(() => setIsRestoringData(false), 100);
    }
  }, [initialBOQData, isRestoringData]);

  // Consolidate all BOQ items from Structure, DC, and AC
  React.useEffect(() => {
    // Don't consolidate while restoring data
    if (isRestoringData) {
      return;
    }
    
    const consolidateAllBOQs = () => {
      const allItems: Array<{
        sNo: number;
        description: string;
        specifications: string;
        unit: string;
        qty: number | string;
        category: string;
        source: 'structure' | 'dc' | 'ac';
      }> = [];
      
      let serialNumber = 1;
      
      // Add Structure BOQ items
      structureBOQData.forEach(item => {
        allItems.push({
          sNo: serialNumber++,
          description: item.description,
          specifications: item.specifications,
          unit: item.unit,
          qty: item.qty,
          category: item.category,
          source: 'structure'
        });
      });
      
      // Add DC BOQ items
      dcBOQData.forEach(item => {
        allItems.push({
          sNo: serialNumber++,
          description: item.description,
          specifications: item.specifications,
          unit: item.unit,
          qty: item.qty,
          category: item.category,
          source: 'dc'
        });
      });
      
      // Add AC BOQ items
      acBOQData.forEach(item => {
        allItems.push({
          sNo: serialNumber++,
          description: item.description,
          specifications: item.specifications,
          unit: item.unit,
          qty: item.qty,
          category: item.category,
          source: 'ac'
        });
      });
      
      setConsolidatedBOQItems(allItems);
      setStructureItemCount(structureBOQData.length);
      setDCItemCount(dcBOQData.length);
      setACItemCount(acBOQData.length);
    };

    consolidateAllBOQs();
  }, [structureBOQData, dcBOQData, acBOQData, isRestoringData]);

  // Calculate and pass total project cost to parent component
  useEffect(() => {
    // Don't trigger cost calculation while restoring data
    if (isRestoringData) {
      return;
    }
    
    if (pricedBOQ && pricedBOQ.length > 0 && onTotalProjectCostCalculated) {
      const equipmentTotal = pricedBOQ.reduce((sum, item) => sum + item.totalPrice, 0);
      const additionalTotal = additionalCosts
        .filter(c => c.enabled)
        .reduce((sum, cost) => sum + (equipmentTotal * cost.percentage / 100), 0);
      const totalProjectCost = equipmentTotal + additionalTotal;
      
      onTotalProjectCostCalculated(totalProjectCost);
    }
  }, [pricedBOQ, additionalCosts, onTotalProjectCostCalculated, isRestoringData]);

  // Effect to update BOQ data for PDF report when mergedBOQ changes
  useEffect(() => {
    // Don't send BOQ updates while restoring data
    if (isRestoringData) {
      return;
    }
    
    if (mergedBOQ.length > 0 && onBOQDataUpdate) {
      // Format the merged BOQ to match the required structure for PDF report
      const formattedBOQ = mergedBOQ.map((item, index) => ({
        slNo: index + 1,
        description: item.description,
        specifications: item.specifications,
        unit: item.unit,
        qty: item.qty
      }));
      
      console.log('📊 Sending consolidated BOQ data to parent:', formattedBOQ.length, 'items');
      onBOQDataUpdate(formattedBOQ);
    }
  }, [mergedBOQ, onBOQDataUpdate, isRestoringData]);

  // Effect to log when initial BOQ data is restored
  useEffect(() => {
    if (initialBOQData) {
      console.log('🔄 DetailedBOQGenerator: Restoring BOQ data from saved project:', {
        generatedBOQCount: initialBOQData.generatedBOQ?.length || 0,
        mergedBOQCount: initialBOQData.mergedBOQ?.length || 0,
        pricedBOQCount: initialBOQData.pricedBOQ?.length || 0,
        generationTimestamp: initialBOQData.generationTimestamp,
        pricingTimestamp: initialBOQData.pricingTimestamp,
        selectedAIModel: initialBOQData.selectedAIModel,
        additionalCostsCount: initialBOQData.additionalCosts?.length || 0
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount - initialBOQData is intentionally not included

  // Effect to send comprehensive BOQ data updates to parent
  useEffect(() => {
    // Don't send updates while restoring data to prevent infinite loop
    if (isRestoringData) {
      console.log('🔒 Skipping parent update during data restoration');
      return;
    }
    
    if (onComprehensiveBOQDataUpdate && (generatedBOQ.length > 0 || mergedBOQ.length > 0 || pricedBOQ.length > 0)) {
      const comprehensiveData = {
        generatedBOQ,
        mergedBOQ,
        pricedBOQ,
        generationTimestamp: generationTimestamp ? generationTimestamp.toISOString() : null,
        pricingTimestamp: pricingTimestamp ? pricingTimestamp.toISOString() : null,
        selectedAIModel,
        additionalCosts
      };
      
      console.log('📦 Sending comprehensive BOQ data to parent:', {
        generatedBOQCount: generatedBOQ.length,
        mergedBOQCount: mergedBOQ.length,
        pricedBOQCount: pricedBOQ.length,
        hasGenerationTimestamp: !!generationTimestamp,
        hasPricingTimestamp: !!pricingTimestamp,
        selectedAIModel
      });
      
      onComprehensiveBOQDataUpdate(comprehensiveData);
    }
  }, [generatedBOQ, mergedBOQ, pricedBOQ, generationTimestamp, pricingTimestamp, selectedAIModel, additionalCosts, onComprehensiveBOQDataUpdate, isRestoringData]);

  // Use the BOQ parameter extraction hook
  const {
    extractAllParameters,
    getCurrentParameters,
    isReady,
    calculationType
  } = useBOQParameterExtraction({
    polygonConfigs,
    selectedPanel,
    selectedInverter,
    structureType,
    connectionType,
    isCentralInverter,
    manualInverterCount,
    totalStringCount,
    averageStringCurrent,
    soilType,
    // Wrap acConfigData properly for the hook
    acConfigData: acConfigData ? {
      acConfiguration: acConfigData
    } : undefined
  });

  // Generate detailed BOQ using AI/LLM
  const handleGenerateBOQ = useCallback(async () => {
    // Check AI credits BEFORE starting generation
    const hasEnoughCredits = await hasCredits(1); // BOQ generation costs 1 credit
    if (!hasEnoughCredits) {
      toast.error('Insufficient AI credits. You need 1 credit for BOQ generation.', {
        description: `Your current balance: ${balance?.remaining || 0} credits`
      });
      return;
    }

    setIsGenerating(true);
    try {
      console.log('🤖 Starting AI-based BOQ generation...');
      
      // Extract all parameters first
      extractAllParameters();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Allow extraction to complete
      
      // Check if we have minimum required parameters
      const boqParameters = getCurrentParameters();
      console.log('📊 BOQ Parameters for AI generation:', boqParameters);
      
      if (!boqParameters.dcInputs || !boqParameters.lightningProtection || !boqParameters.acCommon) {
        throw new Error('Missing required parameters. Please ensure all configuration tabs are completed.');
      }
      
      // Run the complete BOQ workflow with fresh inputs
      const workflowOptions = {
        calculationType,
        aiModel: selectedAIModel,
        userId: 'user_' + Date.now(), // Temporary user ID - replace with actual user ID from auth
        projectId: 'project_' + Date.now(), // Temporary project ID - replace with actual project ID
        maxRetries: 3,
        temperature: 0.0,
        maxTokens: 4000
      };
      
      // Prepare fresh inputs for parameter extraction
      const workflowInputs = {
        polygonConfigs,
        selectedPanel,
        selectedInverter,
        structureType,
        manualInverterCount,
        totalStringCount,
        averageStringCurrent,
        soilType,
        acConfigData
      };
      
      console.log('🔄 Running BOQ workflow with options:', workflowOptions);
      console.log('📥 Workflow inputs with fresh acConfigData:', workflowInputs);
      const result = await runBoqWorkflow(workflowOptions, workflowInputs);
      
      if (!result.success) {
        throw new Error(result.error || 'BOQ workflow failed');
      }
      
        console.log('✅ BOQ workflow completed successfully!', result);
        
        // Store AI-generated BOQ (clean any invalid props)
        setWorkflowResult(result);
        setGeneratedBOQ(cleanBOQItems(result.boqRows));
        
        // Merge system-calculated BOQ with AI-generated BOQ in desired order:
        // 1. DC BOQ → 2. Structure BOQ → 3. AC BOQ → 4. AI Generated BOQ
        const mergedItems: ParsedBOQRow[] = [];
        
        // Separate consolidated items by source
        const dcItems = consolidatedBOQItems.filter(item => item.source === 'dc');
        const structureItems = consolidatedBOQItems.filter(item => item.source === 'structure');
        const acItems = consolidatedBOQItems.filter(item => item.source === 'ac');
        
        // 1. Add DC BOQ items first
        dcItems.forEach(item => {
          mergedItems.push({
            description: item.description,
            specifications: item.specifications,
            qty: item.qty.toString(),
            unit: item.unit,
            category: 'DC_BOQ' // Mark source for categorization
          });
        });
        
        // 2. Add Structure BOQ items second
        structureItems.forEach(item => {
          mergedItems.push({
            description: item.description,
            specifications: item.specifications,
            qty: item.qty.toString(),
            unit: item.unit,
            category: 'STRUCTURE_BOQ' // Mark source for categorization
          });
        });
        
        // 3. Add AC BOQ items third
        acItems.forEach(item => {
          mergedItems.push({
            description: item.description,
            specifications: item.specifications,
            qty: item.qty.toString(),
            unit: item.unit,
            category: 'AC_BOQ' // Mark source for categorization
          });
        });
        
        // 4. Add AI-generated items last
        result.boqRows.forEach(aiItem => {
          mergedItems.push({
            description: aiItem.description,
            specifications: aiItem.specifications,
            qty: aiItem.qty,
            unit: aiItem.unit,
            category: aiItem.category || 'AI_GENERATED' // Keep AI category or mark as AI_GENERATED
          });
        });
        
        setMergedBOQ(cleanBOQItems(mergedItems));
        setGenerationTimestamp(new Date());
        setActiveTab("results");
        
        // Show success message with detailed stats
        const totalSystemItems = consolidatedBOQItems.length;
        const totalAIItems = result.boqRows.length;
        const totalItems = mergedItems.length;
        const successMessage = `BOQ generated successfully! ${totalItems} total items (${dcItems.length} DC + ${structureItems.length} Structure + ${acItems.length} AC + ${totalAIItems} AI) using ${result.metadata.aiModel} in ${result.metadata.processingTimeMs}ms${result.metadata.retryCount > 0 ? ` (${result.metadata.retryCount} retries)` : ''}`;
        toast.success(successMessage);

        // Deduct AI credits after successful generation (whether project is saved or not)
        try {
          const projectId = null; // Will be null for unsaved projects
          const success = await checkAndDeduct(
            projectId,
            'boq_generation',
            `Generated AI BOQ: ${totalItems} items using ${result.metadata.aiModel}`
          );
          
          if (success) {
            await refreshBalance(); // Refresh to show updated balance immediately
            console.log('✅ Deducted 1 AI credit for BOQ generation');
          } else {
            console.warn('⚠️ Failed to deduct AI credits, but BOQ was generated');
          }
        } catch (error) {
          console.error('❌ Error deducting AI credits:', error);
          // Don't show error to user - BOQ was already generated successfully
        }
      
      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          toast.warning(warning, { duration: 8000 });
        });
      }
      
    } catch (error) {
      console.error('❌ Error generating AI BOQ:', error);
      toast.error(`Failed to generate AI BOQ: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  }, [
    extractAllParameters, 
    getCurrentParameters, 
    calculationType, 
    selectedAIModel,
    polygonConfigs,
    selectedPanel,
    selectedInverter,
    structureType,
    manualInverterCount,
    totalStringCount,
    averageStringCurrent,
    soilType,
    acConfigData,
    consolidatedBOQItems,
    hasCredits,
    balance,
    checkAndDeduct,
    refreshBalance
  ]);

  // Cache helper functions
  const CACHE_KEY_PREFIX = 'boq_pricing_cache_';
  const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

  const getCachedPrice = useCallback((itemDescription: string, itemSpec: string) => {
    const cacheKey = `${CACHE_KEY_PREFIX}${itemDescription}_${itemSpec}`.replace(/[^a-zA-Z0-9_]/g, '_');
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    try {
      const data = JSON.parse(cached);
      const now = Date.now();
      const age = now - data.cachedAt;
      
      if (age > CACHE_DURATION) {
        console.log(`🗑️ Removing expired cache for: ${itemDescription} (age: ${(age / 1000 / 60).toFixed(0)} minutes)`);
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      console.log(`📦 Found cached price for: ${itemDescription} (age: ${(age / 1000 / 60).toFixed(0)} minutes, expires in: ${((CACHE_DURATION - age) / 1000 / 60).toFixed(0)} minutes)`);
      return data;
    } catch {
      return null;
    }
  }, [CACHE_DURATION]);

  const setCachedPrice = useCallback((itemDescription: string, itemSpec: string, priceData: { unitPrice: number; confidence: string; sourceUrl?: string; notes?: string }) => {
    const cacheKey = `${CACHE_KEY_PREFIX}${itemDescription}_${itemSpec}`.replace(/[^a-zA-Z0-9_]/g, '_');
    const data = {
      ...priceData,
      cachedAt: Date.now()
    };
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
      console.log(`💾 Cached price for: ${itemDescription} -> $${priceData.unitPrice}`);
    } catch (error) {
      console.warn('Failed to cache price:', error);
    }
  }, []);

  // Clear all pricing cache
  const clearPricingCache = useCallback(() => {
    const keys = Object.keys(localStorage);
    let clearedCount = 0;
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    });
    console.log(`🗑️ Cleared ${clearedCount} cached prices`);
    toast.success(`Cleared ${clearedCount} cached prices. Generate pricing again for fresh web searches.`);
  }, []);

  // Generate Pricing for BOQ using Two-Stage Process
  const handleGeneratePricing = useCallback(async () => {
    if (mergedBOQ.length === 0) {
      toast.error('No BOQ available. Please generate BOQ first.');
      return;
    }

    // Check AI credits BEFORE starting pricing
    const hasEnoughCredits = await hasCredits(1); // BOQ pricing costs 1 credit
    if (!hasEnoughCredits) {
      toast.error('Insufficient AI credits. You need 1 credit for BOQ pricing.', {
        description: `Your current balance: ${balance?.remaining || 0} credits`
      });
      return;
    }

    setIsPricingGenerating(true);
    try {
      console.log('💰 Stage 1: Starting AI-based pricing estimation for all items...');
      
      // Get Gemini API key from environment
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not found in environment variables');
      }

      // ========== PRE-STAGE: IDENTIFY & PRICE PANELS/INVERTERS WITH $/kW ==========
      // Separate items that use fixed $/kW pricing - BE VERY SPECIFIC
      const specialPricingItems = mergedBOQ.filter(item => {
        const desc = item.description.toLowerCase();
        
        // Check for PV modules/panels (exclude inverter-related items)
        const isPVModule = (desc.includes('pv module') || desc.includes('solar panel') || desc.includes('solar module')) 
                           && !desc.includes('inverter');
        
        // Check for inverters (must have "inverter" but exclude accessories)
        const isInverter = (desc.includes('string inverter') || desc.includes('central inverter'))
                           && !desc.includes('cable')
                           && !desc.includes('breaker')
                           && !desc.includes('combiner')
                           && !desc.includes('to');
        
        return isPVModule || isInverter;
      });

      console.log(`⚡ Found ${specialPricingItems.length} items for $/kW fixed pricing (panels & inverters)`);

      // Calculate special pricing with $/kW methodology
      const specialPricedItems = specialPricingItems.map(item => {
        const desc = item.description.toLowerCase();
        const qty = typeof item.qty === 'string' ? parseFloat(item.qty) : item.qty;
        
        let pricePerKW = 0;
        let totalKW = 0;
        let itemType = '';
        
        if (desc.includes('pv module') || desc.includes('solar panel') || desc.includes('solar module')) {
          // ====== SOLAR PANEL: $150/kW ======
          pricePerKW = 150;
          itemType = 'Solar Panel';
          
          // Extract wattage from specifications (e.g., "585Wp", "585W", "585 Wp")
          const wattMatch = item.specifications.match(/(\d+)\s*W[p]?\b/i);
          const moduleWattage = wattMatch ? parseInt(wattMatch[1]) : 550; // Default 550W
          
          // Calculate total kW
          totalKW = (qty * moduleWattage) / 1000;
          
          console.log(`📊 ${item.description}: ${qty} panels × ${moduleWattage}W = ${totalKW.toFixed(2)} kW`);
          
        } else if (desc.includes('string inverter')) {
          // ====== STRING INVERTER: $70/kW ======
          pricePerKW = 70;
          itemType = 'String Inverter';
          
          // Extract kW rating from specifications (e.g., "40kW", "40.5 kW", "40 kW")
          const kwMatch = item.specifications.match(/(\d+\.?\d*)\s*kW\b/i);
          const inverterKW = kwMatch ? parseFloat(kwMatch[1]) : 40; // Default 40kW
          
          // Calculate total kW
          totalKW = qty * inverterKW;
          
          console.log(`📊 ${item.description}: ${qty} inverters × ${inverterKW}kW = ${totalKW.toFixed(2)} kW`);
          
        } else if (desc.includes('central inverter')) {
          // ====== CENTRAL INVERTER: $40/kW ======
          pricePerKW = 40;
          itemType = 'Central Inverter';
          
          // Extract kW rating from specifications (e.g., "1000kW", "1500 kW", "2.5MW" -> 2500kW)
          let inverterKW = 1000; // Default 1000kW (1MW)
          
          // Try to match kW first
          const kwMatch = item.specifications.match(/(\d+\.?\d*)\s*kW\b/i);
          if (kwMatch) {
            inverterKW = parseFloat(kwMatch[1]);
          } else {
            // Try to match MW and convert to kW
            const mwMatch = item.specifications.match(/(\d+\.?\d*)\s*MW\b/i);
            if (mwMatch) {
              inverterKW = parseFloat(mwMatch[1]) * 1000;
            }
          }
          
          // Calculate total kW
          totalKW = qty * inverterKW;
          
          console.log(`📊 ${item.description}: ${qty} inverters × ${inverterKW}kW = ${totalKW.toFixed(2)} kW`);
        }
        
        // Calculate total price
        const totalPrice = totalKW * pricePerKW;
        
        return cleanBOQItem({
          ...item,
          unit: 'kW', // Change unit to kW for panels and inverters
          qty: totalKW.toFixed(2), // Change qty to total kW as string
          unitPrice: pricePerKW, // Display $/kW rate (150, 70, or 40)
          totalPrice: totalPrice,
          totalKW: totalKW, // Store for display and recalculation
          confidence: 'High',
          priceSource: 'fixed' as const,
          pricingNotes: `Fixed rate: $${pricePerKW}/kW for ${itemType}. Total capacity: ${totalKW.toFixed(2)} kW`,
        });
      });

      console.log(`✅ ${specialPricedItems.length} items priced with $/kW methodology`);

      // Get remaining items for AI pricing (exclude ONLY panels & inverters using same strict logic)
      const itemsForAI = mergedBOQ.filter(item => {
        const desc = item.description.toLowerCase();
        
        // Check for PV modules/panels (exclude inverter-related items)
        const isPVModule = (desc.includes('pv module') || desc.includes('solar panel') || desc.includes('solar module')) 
                           && !desc.includes('inverter');
        
        // Check for inverters (must have "inverter" but exclude accessories)
        const isInverter = (desc.includes('string inverter') || desc.includes('central inverter'))
                           && !desc.includes('cable')
                           && !desc.includes('breaker')
                           && !desc.includes('combiner')
                           && !desc.includes('to');
        
        // Return true for items that should be AI priced (NOT panels or inverters)
        return !(isPVModule || isInverter);
      });

      console.log(`🤖 Sending ${itemsForAI.length} items to AI for pricing (excluding panels & inverters)`);

      // ========== STAGE 1: AI ESTIMATION FOR NON-PANEL/INVERTER ITEMS ==========
      // Build comprehensive pricing prompt for initial estimation
      const pricingPrompt = `You are an expert solar PV procurement and costing specialist with deep knowledge of international equipment pricing, regional market variations, and USA-based benchmarking (2024-2025 rates).

PROJECT LOCATION: ${projectCountry}

YOUR TASK: Provide accurate unit pricing in USD ($) for each line item in the solar PV Bill of Quantities below.

⚠️ IMPORTANT EXCLUSIONS - DO NOT PRICE THESE ITEMS:
The following items use fixed $/kW pricing methodology and are priced separately:
1. PV Modules/Solar Panels → Fixed at $150/kW (based on module wattage)
2. String Inverters → Fixed at $70/kW (based on inverter capacity)
3. Central Inverters → Fixed at $40/kW (based on inverter capacity)

These items have been REMOVED from the list below and are NOT included in your response.

PRICING REQUIREMENTS:
1. Provide unit price in USD ($) (ex-works/delivered)
2. Base estimate on:
   - USA market rates (2024-2025) as baseline
   - Similar component benchmarks from major manufacturers
   - Regional pricing factors for ${projectCountry}
   - Consider economies of scale for bulk quantities
3. Provide confidence level: High/Medium/Low
   - High: Standard catalog items with well-established market prices
   - Medium: Common items but with price variability based on specifications
   - Low: Specialized items or region-specific pricing uncertainty

BILL OF QUANTITIES TO PRICE (${itemsForAI.length} items):
${itemsForAI.map((item, index) => `
${index + 1}. ${item.description}
   Specifications: ${item.specifications}
   Unit: ${item.unit}
   Quantity: ${item.qty}
`).join('\n')}

OUTPUT FORMAT (JSON array):
Return ONLY a valid JSON array with this exact structure for each item:
[
  {
    "itemNumber": 1,
    "unitPrice": <number in USD>,
    "confidence": "<High/Medium/Low>",
    "notes": "<brief pricing rationale, 1-2 sentences>"
  },
  ...
]

IMPORTANT:
- Return ONLY the JSON array, no markdown formatting, no explanations outside the JSON
- Ensure JSON is valid and parseable
- All prices must be positive numbers
- Consider quantity breaks for large volumes
- Account for shipping, duties, and regional factors
- Use realistic market prices from reputable suppliers
- DO NOT include PV modules or inverters (already handled separately at $150/kW, $70/kW, $40/kW)`;

      // Call Gemini API only if there are items to price
      let pricingData: Array<{ unitPrice: number; confidence: string; notes?: string }> = [];
      
      if (itemsForAI.length === 0) {
        console.log('⏩ No items for AI pricing - all items are panels/inverters with fixed $/kW pricing');
      } else {
        console.log('🤖 Using Gemini 2.5 Flash-Lite for Stage 1 pricing...');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: pricingPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Gemini pricing response:', data);

      // Extract pricing data from response
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) {
        throw new Error('No response text from Gemini API');
      }

        // Parse JSON from response (handle markdown code blocks if present)
        try {
          // Remove markdown code blocks if present
          const cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          pricingData = JSON.parse(cleanedText);
        } catch (parseError) {
          console.error('Failed to parse pricing response:', generatedText);
          throw new Error('Failed to parse pricing data from AI response');
        }

        if (!Array.isArray(pricingData) || pricingData.length === 0) {
          throw new Error('Invalid pricing data format received from AI');
        }

        console.log('✅ Stage 1 complete: AI pricing data parsed successfully');
      }

      // ========== IDENTIFY MEDIUM/LOW CONFIDENCE ITEMS ==========
      const mediumLowItems = pricingData
        .map((pricing, index) => ({ ...pricing, originalIndex: index, boqItem: itemsForAI[index] }))
        .filter(item => item.confidence === 'Medium' || item.confidence === 'Low');

      console.log(`🔍 Found ${mediumLowItems.length} items with Medium/Low confidence requiring web search`);
      
      if (mediumLowItems.length > 0) {
        console.log('📋 Medium/Low confidence items:');
        mediumLowItems.forEach((item, idx) => {
          console.log(`  ${idx + 1}. ${item.boqItem.description} - Confidence: ${item.confidence} - Initial Price: $${item.unitPrice}`);
        });
      }

      // Check cache first for medium/low items
      const itemsNeedingWebSearch: typeof mediumLowItems = [];
      const cachedPrices: Array<{ originalIndex: number; cached: { unitPrice: number; confidence: string; sourceUrl?: string; notes?: string; cachedAt: number } }> = [];

      console.log(`\n🔍 Checking cache for ${mediumLowItems.length} medium/low confidence items...`);
      mediumLowItems.forEach((item, idx) => {
        const cached = getCachedPrice(item.boqItem.description, item.boqItem.specifications);
        if (cached) {
          const ageMinutes = ((Date.now() - cached.cachedAt) / 1000 / 60).toFixed(0);
          console.log(`  ${idx + 1}. ✅ CACHED (${ageMinutes}m old): ${item.boqItem.description} -> $${cached.unitPrice}`);
          cachedPrices.push({ ...item, cached });
        } else {
          console.log(`  ${idx + 1}. 🌐 NEEDS WEB SEARCH: ${item.boqItem.description}`);
          itemsNeedingWebSearch.push(item);
        }
      });

      console.log(`\n📊 Cache Summary:`);
      console.log(`  - Total medium/low items: ${mediumLowItems.length}`);
      console.log(`  - Found in cache: ${cachedPrices.length}`);
      console.log(`  - Need web search: ${itemsNeedingWebSearch.length}\n`);

      // ========== STAGE 2: WEB SEARCH PRICING FOR MEDIUM/LOW CONFIDENCE ITEMS ==========
      let webSearchResults: Array<{ unitPrice: number; confidence: string; sourceUrl?: string; notes?: string }> = [];
      
      if (itemsNeedingWebSearch.length > 0) {
        setIsWebSearching(true);
        console.log(`🌐 Stage 2: Web search pricing for ${itemsNeedingWebSearch.length} items using Gemini 2.5 Flash-Lite...`);
        
        toast.info(`Searching web for ${itemsNeedingWebSearch.length} specialized items...`, { duration: 3000 });

        // Build web search prompt with Google Search grounding
        const webSearchPrompt = `You are an expert solar PV procurement specialist. Search the web for CURRENT, ACCURATE USA market pricing (2024-2025) for the following specialized solar PV components. Use real supplier websites and manufacturer data to provide verified pricing.

PROJECT LOCATION: ${projectCountry}

ITEMS REQUIRING WEB SEARCH PRICING:
${itemsNeedingWebSearch.map((item, idx) => `
${idx + 1}. ${item.boqItem.description}
   Specifications: ${item.boqItem.specifications}
   Unit: ${item.boqItem.unit}
   Quantity: ${item.boqItem.qty}
   Initial Estimate: $${item.unitPrice} (${item.confidence} confidence)
`).join('\n')}

WEB SEARCH INSTRUCTIONS:
1. **Search Real Websites**: Search for each item on actual supplier websites:
   - Solar equipment suppliers: AltE Store, Renvu, Solar Electric Supply, Wholesale Solar, CED Greentech
   - Manufacturers: ABB, Schneider Electric, Eaton, Siemens, Legrand
   - B2B marketplaces: Alibaba (for bulk), ThomasNet, GlobalSpec
   
2. **Find Current 2024-2025 Prices**: Look for recently updated product listings with actual prices

3. **Consider Quantities**: Check for bulk discounts if quantity is high (>100 units)

4. **Regional Adjustments**: Account for shipping, duties, and ${projectCountry} market factors

5. **Provide Source URLs**: Include the actual URL where you found the price

6. **Confidence Levels**:
   - "High" = Found recent price on major supplier website
   - "Medium" = Price from secondary source or older listing
   - "Low" = Estimated based on similar products

OUTPUT FORMAT (JSON array):
[
  {
    "itemNumber": 1,
    "unitPrice": <number in USD>,
    "confidence": "High",
    "sourceUrl": "<actual URL from web search>",
    "notes": "Found on [supplier name], [date], for [specific product]"
  },
  ...
]

CRITICAL:
- Return ONLY valid JSON array, no markdown formatting
- Use REAL web search to find ACTUAL current prices
- Include ACTUAL source URLs from your search
- All prices must be in USD
- Focus on USA market rates`;

        try {
          // Call Gemini 2.5 Flash-Lite with Google Search grounding
          console.log('🔍 Enabling Google Search grounding for real-time pricing...');
          const webSearchResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: webSearchPrompt
                }]
              }],
              tools: [{
                googleSearch: {}
              }],
              generationConfig: {
                temperature: 0.1,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
              }
            })
          });

          if (!webSearchResponse.ok) {
            const errorData = await webSearchResponse.json().catch(() => null);
            console.error('❌ Web search pricing error:', errorData);
            throw new Error(`Web search failed: ${errorData?.error?.message || webSearchResponse.statusText}`);
          }

          const webData = await webSearchResponse.json();
          console.log('🔍 Web search API response received:', webData);
          
          const webText = webData.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (webText) {
            const cleanedWebText = webText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            webSearchResults = JSON.parse(cleanedWebText);
            console.log('✅ Stage 2 complete: Web search pricing obtained with Google Search grounding');
            console.log(`📊 Web search returned ${webSearchResults.length} real-time prices:`);
            webSearchResults.forEach((result, idx) => {
              const item = itemsNeedingWebSearch[idx];
              if (item) {
                const priceChange = item.unitPrice ? ((result.unitPrice - item.unitPrice) / item.unitPrice * 100).toFixed(1) : 'N/A';
                console.log(`  ${idx + 1}. ${item.boqItem.description}: $${result.unitPrice} (${result.confidence}) [${priceChange}% change]`);
                console.log(`      Source: ${result.sourceUrl || 'N/A'}`);
                console.log(`      Notes: ${result.notes || 'N/A'}`);
              }
            });

            // Cache the web search results
            itemsNeedingWebSearch.forEach((item, idx) => {
              if (webSearchResults[idx]) {
                setCachedPrice(item.boqItem.description, item.boqItem.specifications, webSearchResults[idx]);
                console.log(`💾 Cached web search price for: ${item.boqItem.description}`);
              }
            });
          }
        } catch (webSearchError) {
          console.warn('⚠️ Web search failed, using initial AI estimates:', webSearchError);
          toast.warning('Web search partially failed. Using initial AI estimates for some items.');
        } finally {
          setIsWebSearching(false);
        }
      }

      // ========== MERGE ALL PRICING DATA ==========
      // Create a map for easier lookup
      const specialPricedMap = new Map(specialPricedItems.map(item => [item.description, item]));
      const aiPricedMap = new Map<string, typeof pricingData[0]>();
      
      // Build AI priced map from itemsForAI with correct indices
      itemsForAI.forEach((item, index) => {
        if (pricingData[index]) {
          aiPricedMap.set(item.description, pricingData[index]);
        }
      });

      // Build web search results map for easier lookup
      const webSearchMap = new Map<string, typeof webSearchResults[0]>();
      itemsNeedingWebSearch.forEach((item, index) => {
        if (webSearchResults[index]) {
          webSearchMap.set(item.boqItem.description, webSearchResults[index]);
          console.log(`📍 Mapped web search result for: ${item.boqItem.description} -> $${webSearchResults[index].unitPrice}`);
        }
      });

      // Build cached results map for easier lookup
      const cachedPricesMap = new Map<string, typeof cachedPrices[0]['cached']>();
      cachedPrices.forEach(cached => {
        const item = mediumLowItems[cached.originalIndex];
        if (item) {
          cachedPricesMap.set(item.boqItem.description, cached.cached);
          console.log(`📦 Mapped cached result for: ${item.boqItem.description} -> $${cached.cached.unitPrice}`);
        }
      });

      const finalPricedItems = mergedBOQ.map((item) => {
        const qty = typeof item.qty === 'string' ? parseFloat(item.qty) || 0 : item.qty;
        
        // Check if this is a special priced item (panel/inverter with $/kW)
        const specialPriced = specialPricedMap.get(item.description);
        if (specialPriced) {
          return specialPriced;
        }

        // Otherwise, this is an AI-priced item - get initial AI pricing
        const aiPricing = aiPricedMap.get(item.description) || { unitPrice: 0, confidence: 'Low', notes: 'Price not available' };
        
        let finalPricing: { unitPrice: number; confidence: string; sourceUrl?: string; notes?: string } = { ...aiPricing };
        let priceSource: 'ai' | 'web' | 'manual' | 'fixed' = 'ai';
        let sourceUrl: string | undefined;
        let cachedAt: number | undefined;

        // PRIORITY 1: Check if this item has cached web search results (most recent and reliable)
        const cachedPrice = cachedPricesMap.get(item.description);
        if (cachedPrice) {
          console.log(`✅ Using cached web price for ${item.description}: $${cachedPrice.unitPrice}`);
          finalPricing = { ...cachedPrice };
          priceSource = 'web';
          sourceUrl = cachedPrice.sourceUrl;
          cachedAt = cachedPrice.cachedAt;
        } 
        // PRIORITY 2: Check if this item has fresh web search results from this session
        else {
          const webPrice = webSearchMap.get(item.description);
          if (webPrice) {
            console.log(`✅ Using web search price for ${item.description}: $${webPrice.unitPrice} (upgraded from AI $${aiPricing.unitPrice})`);
            finalPricing = { ...webPrice };
            priceSource = 'web';
            sourceUrl = webPrice.sourceUrl;
          } else {
            // Use AI pricing as fallback
            console.log(`ℹ️ Using AI price for ${item.description}: $${aiPricing.unitPrice} (${aiPricing.confidence})`);
          }
        }

        const unitPrice = finalPricing.unitPrice || 0;
        const totalPrice = qty * unitPrice;

        return cleanBOQItem({
          ...item,
          unitPrice,
          totalPrice,
          confidence: finalPricing.confidence || 'Low',
          priceSource,
          sourceUrl,
          cachedAt,
          pricingNotes: finalPricing.notes || ''
        });
      });

      setPricedBOQ(cleanBOQItems(finalPricedItems));
      setPricingTimestamp(new Date());
      setActiveTab("pricing");
      
      const fixedCount = finalPricedItems.filter(i => i.priceSource === 'fixed').length;
      const aiCount = finalPricedItems.filter(i => i.priceSource === 'ai').length;
      const webCount = finalPricedItems.filter(i => i.priceSource === 'web').length;
      const highCount = finalPricedItems.filter(i => i.confidence === 'High').length;
      const medCount = finalPricedItems.filter(i => i.confidence === 'Medium').length;
      const lowCount = finalPricedItems.filter(i => i.confidence === 'Low').length;
      
      console.log('📊 FINAL PRICING SUMMARY:');
      console.log(`  Total items: ${finalPricedItems.length}`);
      console.log(`  Price sources: ${fixedCount} $/kW fixed, ${aiCount} AI, ${webCount} Web Search`);
      console.log(`  Confidence: ${highCount} High, ${medCount} Medium, ${lowCount} Low`);
      
      toast.success(`Pricing complete! ${finalPricedItems.length} items (${fixedCount} $/kW fixed, ${webCount} web-searched, ${aiCount} AI)`);

      // Deduct AI credits after successful pricing (whether project is saved or not)
      try {
        const projectId = null; // Will be null for unsaved projects
        const success = await checkAndDeduct(
          projectId,
          'boq_pricing',
          `Generated BOQ pricing: ${finalPricedItems.length} items`
        );
        
        if (success) {
          await refreshBalance(); // Refresh to show updated balance immediately
          console.log('✅ Deducted 1 AI credit for BOQ pricing');
        } else {
          console.warn('⚠️ Failed to deduct AI credits, but pricing was generated');
        }
      } catch (error) {
        console.error('❌ Error deducting AI credits:', error);
        // Don't show error to user - pricing was already generated successfully
      }
    } catch (error) {
      console.error('❌ Error generating pricing:', error);
      toast.error(`Failed to generate pricing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsPricingGenerating(false);
      setIsWebSearching(false);
    }
  }, [mergedBOQ, projectCountry, getCachedPrice, setCachedPrice, hasCredits, balance, checkAndDeduct, refreshBalance]);

  // Handle additional cost toggle
  const handleAdditionalCostToggle = useCallback((id: number) => {
    setAdditionalCosts(prev => 
      prev.map(cost => 
        cost.id === id ? { ...cost, enabled: !cost.enabled } : cost
      )
    );
  }, []);

  // Handle additional cost percentage update
  const handleAdditionalCostPercentageUpdate = useCallback((id: number, newPercentage: number) => {
    setAdditionalCosts(prev => 
      prev.map(cost => 
        cost.id === id ? { ...cost, percentage: newPercentage } : cost
      )
    );
  }, []);

  // Handle manual price updates
  const handleManualPriceUpdate = useCallback((index: number, newUnitPrice: number) => {
    setPricedBOQ(prev => {
      const updated = [...prev];
      const item = updated[index];
      
      let totalPrice = 0;
      
      // Check if this is a fixed $/kW item (panel or inverter) by checking priceSource
      if (item.priceSource === 'fixed' && item.totalKW && item.totalKW > 0) {
        // Recalculate total price: totalKW × new $/kW rate
        totalPrice = item.totalKW * newUnitPrice;
        console.log(`✏️ Manual edit: ${item.description} - ${item.totalKW.toFixed(2)} kW × $${newUnitPrice}/kW = $${totalPrice.toFixed(2)}`);
      } else {
        // Regular item: qty × unit price
        const qty = typeof item.qty === 'string' ? parseFloat(item.qty) || 0 : item.qty;
        totalPrice = newUnitPrice * qty;
      }
      
      updated[index] = cleanBOQItem({
        ...item,
        unitPrice: newUnitPrice,
        totalPrice: totalPrice,
        priceSource: 'manual',
        confidence: 'High' // Manual prices are high confidence
      });
      
      return updated;
    });
  }, []);

  // Download BOQ as CSV
  const handleDownloadCSV = useCallback(() => {
    if (mergedBOQ.length === 0) {
      toast.error('No BOQ data to download');
      return;
    }

    try {
      const categorizedItems = categorizeBOQItems(mergedBOQ);
      const headers = ['S.No', 'Description', 'Specifications', 'Unit', 'Qty'];
      const csvRows = [headers.join(',')];
      
      let serialNumber = 1;
      
      categorizedItems.forEach(category => {
        // Add category header
        csvRows.push(`"=== ${category.icon} ${category.category.toUpperCase()} (${category.items.length} items) ===","","","",""`);
        
        // Add category items
        category.items.forEach(item => {
          csvRows.push([
            serialNumber++,
            `"${item.description.replace(/"/g, '""')}"`,
            `"${item.specifications.replace(/"/g, '""')}"`,
            `"${item.unit}"`,
            `"${item.qty}"`
          ].join(','));
        });
        
        // Add empty row after category
        csvRows.push('","","","",""');
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const timestamp = new Date().toISOString().slice(0,19).replace(/:/g,'-');
        const filename = `Solar_PV_BOQ_${calculationType}_Categorized_${timestamp}.csv`;
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Categorized BOQ CSV downloaded successfully!');
      }
    } catch (error) {
      console.error('Error downloading BOQ CSV:', error);
      toast.error('Failed to download BOQ CSV');
    }
  }, [mergedBOQ, calculationType]);

  // Copy BOQ table to clipboard
  const handleCopyTable = useCallback(() => {
    if (mergedBOQ.length === 0) {
      toast.error('No BOQ data to copy');
      return;
    }

    try {
      const categorizedItems = categorizeBOQItems(mergedBOQ);
      const headers = ['S.No', 'Description', 'Specifications', 'Unit', 'Qty'];
      const tableRows = [headers.join('\t')];
      
      let serialNumber = 1;
      
      categorizedItems.forEach(category => {
        // Add category header
        tableRows.push(`=== ${category.icon} ${category.category.toUpperCase()} (${category.items.length} items) ===\t\t\t\t`);
        
        // Add category items
        category.items.forEach(item => {
          tableRows.push([
            serialNumber++,
            item.description,
            item.specifications,
            item.unit,
            item.qty
          ].join('\t'));
        });
        
        // Add empty row after category
        tableRows.push('\t\t\t\t');
      });
      
      const tableString = tableRows.join('\n');
      navigator.clipboard.writeText(tableString);
      toast.success('Categorized BOQ table copied to clipboard!');
    } catch (error) {
      console.error('Error copying BOQ table:', error);
      toast.error('Failed to copy BOQ table');
    }
  }, [mergedBOQ]);

  if (!isVisible) return null;

  return (
    <div className="w-full">
      <Card className="border-indigo-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Bot className="h-5 w-5" />
                AI-Powered Solar PV BOQ Generator
              </CardTitle>
              <p className="text-sm text-indigo-600 mt-1">
                Uses AI/LLM with detailed prompt specifications and IEC standards for comprehensive BOQ generation
              </p>
            </div>
            <Badge variant="outline" className="bg-white border-indigo-300">
              {calculationType} System
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-none bg-gray-50">
              <TabsTrigger value="generator" className="data-[state=active]:bg-white">
                <Bot className="h-4 w-4 mr-2" />
                AI Generator
              </TabsTrigger>
              <TabsTrigger value="results" className="data-[state=active]:bg-white">
                <FileText className="h-4 w-4 mr-2" />
                Results ({mergedBOQ.length})
              </TabsTrigger>
              <TabsTrigger value="pricing" className="data-[state=active]:bg-white" disabled={mergedBOQ.length === 0}>
                <Calculator className="h-4 w-4 mr-2" />
                Pricing ({pricedBOQ.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generator" className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Bot className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">AI-Powered BOQ Generation</h3>
                    <p className="text-blue-700 text-sm mb-4">
                      This generator uses AI/LLM with detailed prompt specifications and implements professional engineering calculations per:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-blue-600">
                      <div>• IEC 60364-5-54 (Earthing)</div>
                      <div>• IEC 62561 (Lightning Protection)</div>
                      <div>• IEC 60228 (Cable Conductors)</div>
                      <div>• IEC 61869 (CTs & PTs)</div>
                      <div>• IEC 60255 (Protection Relays)</div>
                      <div>• IEC 61643-11 (SPDs)</div>
                      <div>• IEC 60099-4 (Surge Arresters)</div>
                      <div>• IEC 61439 (LV Switchgear)</div>
                      <div>• IEC 62271 (HV Switchgear)</div>
                      <div>• IEC 62056 (DLMS Protocol)</div>
                      <div>• IS 3043 (Indian Standards)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consolidated BOQ from All Tabs - Merged into Single Table */}
              {/* Hidden from user view - kept in code for debugging purposes */}
              <div className="space-y-4 my-6 hidden">
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Consolidated Bill of Quantities (BOQ)
                  </h3>
                  <p className="text-sm text-orange-700">
                    Merged BOQ from Structure, DC, and AC configurations. Review all items before generating AI-enhanced BOQ.
                  </p>
                </div>

                {/* Render all three BOQ calculators in hidden divs to get their data, then display merged */}
                <div className="hidden">
                  {polygonConfigs && polygonConfigs.length > 0 && selectedPanel && (
                    <div id="hidden-structure-boq">
                      <StructuralMaterialCalculator 
                        // @ts-expect-error - Type mismatch between different PolygonConfig definitions
                        polygonConfigs={polygonConfigs}
                        // @ts-expect-error - Type mismatch between different PanelConfig definitions  
                        selectedPanel={selectedPanel}
                        onMaterialsCalculated={handleStructureBOQCalculated}
                      />
                    </div>
                  )}

                  {selectedInverter && selectedPanel && totalStringCount && totalStringCount > 0 && polygonConfigs && polygonConfigs.length > 0 && (
                    <div id="hidden-dc-boq">
                      <DCBOQCalculator
                        selectedPanel={selectedPanel}
                        selectedInverter={selectedInverter}
                        totalStringCount={totalStringCount}
                        averageStringCurrent={averageStringCurrent || 0}
                        averageStringVoltage={averageStringVoltage || 0}
                        manualInverterCount={manualInverterCount || 1}
                        capacity={capacity || 0}
                        isCentralInverter={isCentralInverter || false}
                        polygonConfigs={polygonConfigs}
                        centralStringSizingData={centralStringSizingData}
                        dcStringCableData={dcStringCableData}
                        dcdbCableData={dcdbCableData}
                        onBOQCalculated={handleDCBOQCalculated}
                      />
                    </div>
                  )}

                  {selectedInverter && acConfigData && mapACConfigToInputs && (
                    <div id="hidden-ac-boq">
                      <ACBOQCalculator 
                        connectionType={connectionType === 'LV' ? 'LV' : 
                                     (isCentralInverter ? 'HV_Central' : 'HV_String')}
                        acSystemInputs={mapACConfigToInputs(acConfigData, manualInverterCount || 1, selectedInverter?.nominal_ac_power_kw || 40)}
                        engineeringParams={{
                          sparePercentage: 5,
                          cableTrayFillFactor: 0.60,
                          cableTieSpacing: 0.5,
                          extraTiesPerRun: 2,
                          sheathAreaMultiplier: 1.3,
                          busbarSafetyFactor: 1.1
                        }}
                        onBOQCalculated={handleACBOQCalculated}
                      />
                    </div>
                  )}
                </div>

                {/* Visible Merged BOQ Table */}
                <div className="mt-6">
                  <Tabs defaultValue="all-consolidated" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="all-consolidated">All - Consolidated</TabsTrigger>
                      <TabsTrigger value="all">All Items</TabsTrigger>
                      <TabsTrigger value="structure">Structure</TabsTrigger>
                      <TabsTrigger value="dc">DC Items</TabsTrigger>
                      <TabsTrigger value="ac">AC Items</TabsTrigger>
                    </TabsList>
                    
                    {/* NEW: All - Consolidated Tab with Unified Table */}
                    <TabsContent value="all-consolidated" className="mt-4">
                      <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                        <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                          <FileSpreadsheet className="h-5 w-5" />
                          Unified Bill of Quantities - All Items in Standardized Format
                        </h4>
                        <p className="text-sm text-gray-700">
                          This consolidated view merges Structure, DC, and AC BOQs into one unified table with standardized columns 
                          (S.No, Description, Specifications, Unit, Qty) for easy review and export.
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gradient-to-r from-purple-50 to-blue-50">
                              <th className="border border-gray-300 px-4 py-3 text-center font-semibold">S.No</th>
                              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Description</th>
                              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Specifications</th>
                              <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Unit</th>
                              <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Qty</th>
                            </tr>
                          </thead>
                          <tbody>
                            {consolidatedBOQItems.length > 0 ? (
                              consolidatedBOQItems.map((item, index) => {
                                const rows = [];
                                
                                // Add category header when source changes (check if first item or source changed)
                                const isFirstOfSource = index === 0 || consolidatedBOQItems[index - 1].source !== item.source;
                                
                                if (isFirstOfSource) {
                                  const sourceConfig = {
                                    structure: {
                                      color: 'green',
                                      icon: '🏗️',
                                      label: 'STRUCTURE BOQ ITEMS',
                                      count: structureItemCount
                                    },
                                    dc: {
                                      color: 'orange',
                                      icon: '⚡',
                                      label: 'DC BOQ ITEMS',
                                      count: dcItemCount
                                    },
                                    ac: {
                                      color: 'blue',
                                      icon: '🔌',
                                      label: 'AC BOQ ITEMS',
                                      count: acItemCount
                                    }
                                  }[item.source];

                                  rows.push(
                                    <tr key={`header-${item.source}-${index}`} className={`bg-${sourceConfig.color}-50 border-t-2 border-${sourceConfig.color}-200`}>
                                      <td colSpan={5} className={`border border-gray-300 px-4 py-3 font-bold text-${sourceConfig.color}-800`}>
                                        <div className="flex items-center gap-2">
                                          <span className="text-lg">{sourceConfig.icon}</span>
                                          <span>{sourceConfig.label}</span>
                                          <span className={`ml-auto text-xs bg-${sourceConfig.color}-200 px-2 py-1 rounded-full`}>
                                            {sourceConfig.count} items
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }

                                // Add item row
                                rows.push(
                                  <tr key={`item-${index}`} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                                    <td className="border border-gray-300 px-4 py-2 text-center font-medium">{item.sNo}</td>
                                    <td className="border border-gray-300 px-4 py-2 font-semibold text-gray-900">{item.description}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">{item.specifications}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-center font-medium">{item.unit}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-center font-bold">{typeof item.qty === 'number' ? item.qty.toLocaleString() : item.qty}</td>
                                  </tr>
                                );

                                return rows;
                              }).flat()
                            ) : (
                                // Placeholder/Instructions when no data
                                <>
                                  <tr>
                                    <td colSpan={5} className="border border-gray-300 px-4 py-8 text-center">
                                      <div className="flex flex-col items-center gap-4 max-w-3xl mx-auto">
                                        <FileSpreadsheet className="h-16 w-16 text-purple-400" />
                                        <div>
                                          <p className="font-bold text-lg text-gray-900 mb-2">📊 Consolidated BOQ - All Items in Standardized Format</p>
                                          <p className="text-sm text-gray-700 mb-4">
                                            This tab is designed to display all BOQ items from Structure, DC, and AC configurations in one unified table with sequential serial numbers.
                                          </p>
                                        </div>
                                        
                                        {/* Status Check */}
                                        <div className="w-full max-w-md p-4 bg-blue-50 rounded-lg border border-blue-200">
                                          <p className="font-semibold text-blue-900 mb-2">✓ Design Status:</p>
                                          <div className="space-y-1 text-sm text-left">
                                            <div className="flex items-center gap-2">
                                              {polygonConfigs && polygonConfigs.length > 0 ? '✅' : '⚠️'}
                                              <span>PV Areas: {polygonConfigs && polygonConfigs.length > 0 ? `${polygonConfigs.length} area(s) configured` : 'Not configured'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {selectedPanel ? '✅' : '⚠️'}
                                              <span>Panel: {selectedPanel ? 'Selected' : 'Not selected'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {selectedInverter ? '✅' : '⚠️'}
                                              <span>Inverter: {selectedInverter ? 'Selected' : 'Not selected'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {acConfigData ? '✅' : '⚠️'}
                                              <span>AC Config: {acConfigData ? 'Configured' : 'Not configured'}</span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* View Instructions */}
                                        <div className="w-full p-4 bg-purple-50 rounded-lg border border-purple-200">
                                          <p className="font-semibold text-purple-900 mb-2">📋 How to View BOQ Items:</p>
                                          <p className="text-sm text-gray-700 mb-3">
                                            All three BOQ sections now use the standardized format. Switch to these tabs to view the data:
                                          </p>
                                          <div className="grid md:grid-cols-3 gap-2 text-xs">
                                            <div className="p-2 bg-white rounded border border-green-200">
                                              <strong className="text-green-800">🏗️ Structure</strong>
                                              <div className="text-gray-600">→ Consolidated View sub-tab</div>
                                            </div>
                                            <div className="p-2 bg-white rounded border border-orange-200">
                                              <strong className="text-orange-800">⚡ DC Items</strong>
                                              <div className="text-gray-600">→ All DC components</div>
                                            </div>
                                            <div className="p-2 bg-white rounded border border-blue-200">
                                              <strong className="text-blue-800">🔌 AC Items</strong>
                                              <div className="text-gray-600">→ All AC components</div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                </>
                              )}
                          </tbody>
                        </table>
                      </div>

                      {/* Summary Statistics */}
                      {consolidatedBOQItems.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Total Line Items:</span>
                              <span className="ml-2 font-bold text-gray-900">{consolidatedBOQItems.length}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Structure Items:</span>
                              <span className="ml-2 font-bold text-green-600">{structureItemCount}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">DC Items:</span>
                              <span className="ml-2 font-bold text-orange-600">{dcItemCount}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">AC Items:</span>
                              <span className="ml-2 font-bold text-blue-600">{acItemCount}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Navigation Guide */}
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <h5 className="font-semibold text-blue-900 mb-3">📋 How to View Complete Consolidated BOQ:</h5>
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div className="p-3 bg-white rounded border border-green-200">
                            <div className="font-semibold text-green-800 mb-1 flex items-center gap-2">
                              <span>🏗️</span> Structure BOQ
                            </div>
                            <p className="text-gray-700 text-xs">
                              Click the <strong>"Structure"</strong> tab, then select <strong>"Consolidated View"</strong> to see standardized format
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded border border-orange-200">
                            <div className="font-semibold text-orange-800 mb-1 flex items-center gap-2">
                              <span>⚡</span> DC BOQ
                            </div>
                            <p className="text-gray-700 text-xs">
                              Click the <strong>"DC Items"</strong> tab to see all DC components in standardized format
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded border border-blue-200">
                            <div className="font-semibold text-blue-800 mb-1 flex items-center gap-2">
                              <span>🔌</span> AC BOQ
                            </div>
                            <p className="text-gray-700 text-xs">
                              Click the <strong>"AC Items"</strong> tab to see all AC components in standardized format
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-purple-100 rounded-lg border border-purple-300">
                          <p className="text-sm text-purple-900">
                            <strong>💡 Pro Tip:</strong> All three BOQ sections now use the same standardized format 
                            (<strong>S.No | Description | Specifications | Unit | Qty</strong>). You can easily copy and merge them 
                            into a single Excel/CSV file for comprehensive project documentation.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="all" className="mt-4">
                      {polygonConfigs && selectedPanel && (
                        <StructuralMaterialCalculator 
                          // @ts-expect-error - Type mismatch
                          polygonConfigs={polygonConfigs}
                          // @ts-expect-error - Type mismatch
                          selectedPanel={selectedPanel}
                          onMaterialsCalculated={() => {}}
                        />
                      )}
                      {selectedInverter && selectedPanel && totalStringCount && totalStringCount > 0 && (
                        <div className="mt-6">
                          <DCBOQCalculator
                            selectedPanel={selectedPanel}
                            selectedInverter={selectedInverter}
                            totalStringCount={totalStringCount}
                            averageStringCurrent={averageStringCurrent || 0}
                            averageStringVoltage={averageStringVoltage || 0}
                            manualInverterCount={manualInverterCount || 1}
                            capacity={capacity || 0}
                            isCentralInverter={isCentralInverter || false}
                            polygonConfigs={polygonConfigs}
                            centralStringSizingData={centralStringSizingData}
                            dcStringCableData={dcStringCableData}
                            dcdbCableData={dcdbCableData}
                          />
                        </div>
                      )}
                      {selectedInverter && acConfigData && mapACConfigToInputs && (
                        <div className="mt-6">
                          <ACBOQCalculator 
                            connectionType={connectionType === 'LV' ? 'LV' : 
                                         (isCentralInverter ? 'HV_Central' : 'HV_String')}
                            acSystemInputs={mapACConfigToInputs(acConfigData, manualInverterCount || 1, selectedInverter?.nominal_ac_power_kw || 40)}
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
                    </TabsContent>

                    <TabsContent value="structure" className="mt-4">
                      {polygonConfigs && selectedPanel && (
                        <StructuralMaterialCalculator 
                          // @ts-expect-error - Type mismatch
                          polygonConfigs={polygonConfigs}
                          // @ts-expect-error - Type mismatch
                          selectedPanel={selectedPanel}
                          onMaterialsCalculated={() => {}}
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="dc" className="mt-4">
                      {selectedInverter && selectedPanel && totalStringCount && totalStringCount > 0 && (
                        <DCBOQCalculator
                          selectedPanel={selectedPanel}
                          selectedInverter={selectedInverter}
                          totalStringCount={totalStringCount}
                          averageStringCurrent={averageStringCurrent || 0}
                          averageStringVoltage={averageStringVoltage || 0}
                          manualInverterCount={manualInverterCount || 1}
                          capacity={capacity || 0}
                          isCentralInverter={isCentralInverter || false}
                          polygonConfigs={polygonConfigs}
                          centralStringSizingData={centralStringSizingData}
                          dcStringCableData={dcStringCableData}
                          dcdbCableData={dcdbCableData}
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="ac" className="mt-4">
                      {selectedInverter && acConfigData && mapACConfigToInputs && (
                        <ACBOQCalculator 
                          connectionType={connectionType === 'LV' ? 'LV' : 
                                       (isCentralInverter ? 'HV_Central' : 'HV_String')}
                          acSystemInputs={mapACConfigToInputs(acConfigData, manualInverterCount || 1, selectedInverter?.nominal_ac_power_kw || 40)}
                          engineeringParams={{
                            sparePercentage: 5,
                            cableTrayFillFactor: 0.60,
                            cableTieSpacing: 0.5,
                            extraTiesPerRun: 2,
                            sheathAreaMultiplier: 1.3,
                            busbarSafetyFactor: 1.1
                          }}
                        />
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* Separator between BOQ tables and AI generation section */}
              <div className="border-t border-gray-300 my-8"></div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">System Readiness</h4>
                    <p className="text-sm text-gray-600">
                      {isReady ? 'All parameters configured' : 'Please complete system configuration'}
                    </p>
                  </div>
                  {isReady ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-orange-500" />
                  )}
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">AI Model Selection</h4>
                  <div className="flex items-center gap-3">
                    <Select value={selectedAIModel} onValueChange={(value: 'openai' | 'gemini') => setSelectedAIModel(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select AI Model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            OpenAI GPT-4
                          </div>
                        </SelectItem>
                        <SelectItem value="gemini">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Google Gemini 2.0
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 flex-1">
                      Choose the AI model for BOQ generation. GPT-4 provides detailed engineering analysis, while Gemini offers fast processing.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleGenerateBOQ}
                          disabled={!isReady || isGenerating}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                          size="lg"
                        >
                          {isGenerating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Generating AI BOQ...
                            </>
                          ) : (
                            <>
                              <Bot className="h-4 w-4 mr-2" />
                              Generate AI BOQ
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Generate comprehensive BOQ using AI/LLM with detailed prompt specifications</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {generationTimestamp && (
                  <p className="text-xs text-gray-500 text-center">
                    Last generated: {generationTimestamp.toLocaleString()}
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="results" className="p-0">
              {mergedBOQ.length > 0 ? (
                <div className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Complete Project BOQ</h3>
                      <p className="text-sm text-gray-600">
                        {mergedBOQ.length} total items • {consolidatedBOQItems.length} System + {generatedBOQ.length} AI Generated • {calculationType} System
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCopyTable}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Table
                      </Button>
                      <Button
                        onClick={handleDownloadCSV}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download CSV
                      </Button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left p-3 font-semibold text-gray-700 border-b">S.No</th>
                            <th className="text-left p-3 font-semibold text-gray-700 border-b">Description</th>
                            <th className="text-left p-3 font-semibold text-gray-700 border-b">Specifications</th>
                            <th className="text-left p-3 font-semibold text-gray-700 border-b">Unit</th>
                            <th className="text-left p-3 font-semibold text-gray-700 border-b">Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            // Triple-clean: clean input, clean during categorization, clean at render
                            const categorizedBOQ = deepCleanObject(categorizeBOQItems(cleanBOQItems(mergedBOQ)));
                            
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            return categorizedBOQ.map((category: any, categoryIndex: number) => {
                              
                              const startSerialNumber = categorizedBOQ
                                .slice(0, categoryIndex)
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                .reduce((sum: number, cat: any) => sum + cat.items.length, 0) + 1;
                              
                              // Create a completely new object with ONLY the properties we need
                              const safeCategory = {
                                category: String(category.category || ''),
                                icon: String(category.icon || ''),
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                items: Array.isArray(category.items) ? category.items.map((item: any) => ({
                                  description: String(item.description || ''),
                                  specifications: String(item.specifications || ''),
                                  unit: String(item.unit || ''),
                                  qty: item.qty || 0,
                                })) : []
                              };
                              
                              return (
                                <React.Fragment key={`cat-${categoryIndex}`}>
                                {/* Category Header */}
                                <tr className="bg-indigo-50 border-t-2 border-indigo-200">
                                  <td colSpan={5} className="p-3 font-bold text-indigo-900 border-b border-indigo-200">
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{safeCategory.icon}</span>
                                      <span className="uppercase text-sm tracking-wide">{safeCategory.category}</span>
                                      <span className="ml-auto text-xs bg-indigo-200 px-2 py-1 rounded-full">
                                        {safeCategory.items.length} items
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                                {/* Category Items */}
                                {safeCategory.items.map((safeItem, itemIndex) => {
                                  const currentSerial = startSerialNumber + itemIndex;
                                  return (
                                    <tr key={`cat-${categoryIndex}-item-${itemIndex}`} className={`hover:bg-gray-50 ${currentSerial % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                                      <td className="p-3 font-medium text-gray-700 border-b">{currentSerial}</td>
                                      <td className="p-3 font-semibold text-gray-900 border-b">{safeItem.description}</td>
                                      <td className="p-3 text-gray-700 text-xs border-b">{safeItem.specifications}</td>
                                      <td className="p-3 font-medium text-gray-700 border-b">{safeItem.unit}</td>
                                      <td className="p-3 font-bold text-indigo-600 border-b">{safeItem.qty}</td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800 mb-3">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold text-lg">Complete Project BOQ Generated</span>
                    </div>
                    <div className="grid md:grid-cols-4 gap-4 mb-3">
                      <div className="p-3 bg-white rounded border border-orange-200">
                        <div className="text-xs text-gray-600 mb-1">DC BOQ</div>
                        <div className="text-2xl font-bold text-orange-700">{consolidatedBOQItems.filter(i => i.source === 'dc').length}</div>
                        <div className="text-xs text-gray-600">PV modules, cables, etc.</div>
                      </div>
                      <div className="p-3 bg-white rounded border border-green-200">
                        <div className="text-xs text-gray-600 mb-1">Structure BOQ</div>
                        <div className="text-2xl font-bold text-green-700">{consolidatedBOQItems.filter(i => i.source === 'structure').length}</div>
                        <div className="text-xs text-gray-600">Mounting, hardware, etc.</div>
                      </div>
                      <div className="p-3 bg-white rounded border border-blue-200">
                        <div className="text-xs text-gray-600 mb-1">AC BOQ</div>
                        <div className="text-2xl font-bold text-blue-700">{consolidatedBOQItems.filter(i => i.source === 'ac').length}</div>
                        <div className="text-xs text-gray-600">Inverters, breakers, etc.</div>
                      </div>
                      <div className="p-3 bg-white rounded border border-purple-200">
                        <div className="text-xs text-gray-600 mb-1">AI Generated</div>
                        <div className="text-2xl font-bold text-purple-700">{generatedBOQ.length}</div>
                        <div className="text-xs text-gray-600">Earthing, protection, etc.</div>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm">
                      ✅ <strong>System-Calculated Items (DC + Structure + AC):</strong> Based on your actual design configuration<br/>
                      ✅ <strong>AI-Generated Items:</strong> Earthing, lightning protection, metering following IEC standards<br/>
                      ✅ <strong>Total {mergedBOQ.length} items</strong> in sequential order: DC → Structure → AC → AI Generated
                    </p>
                  </div>

                  {/* Generate Pricing Button */}
                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={handleGeneratePricing}
                      disabled={isPricingGenerating || isWebSearching || mergedBOQ.length === 0}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-6 text-lg"
                    >
                      {isPricingGenerating && !isWebSearching ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Stage 1: AI Estimation...
                        </>
                      ) : isWebSearching ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Stage 2: Web Search (Specialized Items)...
                        </>
                      ) : (
                        <>
                          <Calculator className="h-5 w-5 mr-3" />
                          Generate AI Pricing for BOQ
                        </>
                      )}
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={clearPricingCache}
                            disabled={isPricingGenerating || isWebSearching}
                            variant="outline"
                            className="px-6 py-6 text-lg border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                          >
                            <Trash2 className="h-5 w-5 mr-2" />
                            Clear Cache
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Clear cached pricing to force fresh web searches for all items</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="text-center py-12">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No AI BOQ Generated</h3>
                    <p className="text-gray-600 mb-4">
                      Generate an AI-powered BOQ to see comprehensive calculations and specifications using advanced language models.
                    </p>
                    <Button
                      onClick={() => setActiveTab("generator")}
                      variant="outline"
                    >
                      Go to AI Generator
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="p-0">
              {pricedBOQ.length > 0 ? (
                <div className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">BOQ with AI-Generated Pricing</h3>
                      <p className="text-sm text-gray-600">
                        {pricedBOQ.length} items • Project Location: {projectCountry} • USA Market Rates (2024-2025)
                        {pricingTimestamp && ` • Generated on ${pricingTimestamp.toLocaleString()}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          // Copy priced BOQ with pricing columns
                          const headers = 'S.No\tDescription\tSpecifications\tUnit\tQty\tUnit Price (USD)\tTotal Price (USD)\tSource\tConfidence\tSource URL\tkW Capacity\n';
                          const rows = cleanBOQItems(pricedBOQ).map((item, index) => {
                            const sourceLabel = item.priceSource === 'ai' ? 'AI' : item.priceSource === 'web' ? 'Web Search' : item.priceSource === 'fixed' ? '$/kW Fixed' : 'Manual';
                            const kwCapacity = item.totalKW ? `${item.totalKW.toFixed(2)} kW` : 'N/A';
                            return `${index + 1}\t${item.description}\t${item.specifications}\t${item.unit}\t${item.qty}\t$${item.unitPrice.toFixed(2)}\t$${item.totalPrice.toFixed(2)}\t${sourceLabel}\t${item.confidence}\t${item.sourceUrl || 'N/A'}\t${kwCapacity}`;
                          }).join('\n');
                          navigator.clipboard.writeText(headers + rows);
                          toast.success('Priced BOQ copied to clipboard!');
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Table
                      </Button>
                      <Button
                        onClick={() => {
                          // Download priced BOQ as CSV
                          const headers = 'S.No,Description,Specifications,Unit,Qty,Unit Price (USD),Total Price (USD),Source,Confidence,Source URL,kW Capacity\n';
                          const rows = cleanBOQItems(pricedBOQ).map((item, index) => {
                            const sourceLabel = item.priceSource === 'ai' ? 'AI' : item.priceSource === 'web' ? 'Web Search' : item.priceSource === 'fixed' ? '$/kW Fixed' : 'Manual';
                            const kwCapacity = item.totalKW ? `${item.totalKW.toFixed(2)} kW` : 'N/A';
                            return `${index + 1},"${item.description.replace(/"/g, '""')}","${item.specifications.replace(/"/g, '""')}",${item.unit},${item.qty},$${item.unitPrice.toFixed(2)},$${item.totalPrice.toFixed(2)},${sourceLabel},${item.confidence},"${item.sourceUrl || 'N/A'}",${kwCapacity}`;
                          }).join('\n');
                          const csv = headers + rows;
                          const blob = new Blob([csv], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `priced-boq-${Date.now()}.csv`;
                          a.click();
                          toast.success('Priced BOQ downloaded!');
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download CSV
                      </Button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left p-3 font-semibold text-gray-700 border-b">S.No</th>
                            <th className="text-left p-3 font-semibold text-gray-700 border-b">Description</th>
                            <th className="text-left p-3 font-semibold text-gray-700 border-b">Specifications</th>
                            <th className="text-left p-3 font-semibold text-gray-700 border-b">Unit</th>
                            <th className="text-right p-3 font-semibold text-gray-700 border-b">Qty</th>
                            <th className="text-right p-3 font-semibold text-gray-700 border-b">Unit Price (Editable)</th>
                            <th className="text-right p-3 font-semibold text-gray-700 border-b">Total Price</th>
                            <th className="text-center p-3 font-semibold text-gray-700 border-b">Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cleanBOQItems(pricedBOQ).map((item, index) => {
                            const confidenceColor = 
                              item.confidence === 'High' ? 'bg-green-100 text-green-800' :
                              item.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800';
                            
                            const sourceIcon = 
                              item.priceSource === 'ai' ? '🤖' :
                              item.priceSource === 'web' ? '🔍' :
                              item.priceSource === 'fixed' ? '⚡' :
                              '✏️';
                            
                            const sourceLabel = 
                              item.priceSource === 'ai' ? 'AI' :
                              item.priceSource === 'web' ? 'Web' :
                              item.priceSource === 'fixed' ? '$/kW' :
                              'Manual';
                            
                            const isCached = item.cachedAt && (Date.now() - item.cachedAt < CACHE_DURATION);
                            
                            return (
                              <tr key={`priced-${index}`} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                                <td className="p-3 font-medium text-gray-700 border-b">{index + 1}</td>
                                <td className="p-3 font-semibold text-gray-900 border-b">{item.description}</td>
                                <td className="p-3 text-gray-700 text-xs border-b">{item.specifications}</td>
                                <td className="p-3 font-medium text-gray-700 border-b">{item.unit}</td>
                                <td className="p-3 font-bold text-indigo-600 border-b text-right">
                                  {item.qty}
                                </td>
                                <td className="p-2 border-b text-right">
                                  <div className="flex flex-col items-end gap-1">
                                    <input
                                      type="number"
                                      value={item.unitPrice}
                                      onChange={(e) => handleManualPriceUpdate(index, parseFloat(e.target.value) || 0)}
                                      className="w-full text-right font-bold text-green-700 border border-gray-300 rounded px-2 py-1 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                      step={item.priceSource === 'fixed' ? '1' : '0.01'}
                                      min="0"
                                    />
                                    {item.priceSource === 'fixed' && (
                                      <span className="text-xs text-gray-600 font-medium">$/kW</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 border-b text-right">
                                  <div className="flex flex-col items-end">
                                    <span className="font-bold text-blue-700">${item.totalPrice.toFixed(2)}</span>
                                    {item.priceSource === 'fixed' && item.totalKW && (
                                      <span className="text-xs text-gray-600">({item.totalKW.toFixed(2)} kW)</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 border-b text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${confidenceColor}`}>
                                      {sourceIcon} {sourceLabel}
                                    </span>
                                    {item.priceSource === 'web' && item.sourceUrl && (
                                      <a
                                        href={item.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline"
                                        title={item.sourceUrl}
                                      >
                                        🔗 Source
                                      </a>
                                    )}
                                    {isCached && (
                                      <span className="text-xs text-gray-500" title="Cached web search">
                                        📦 Cached
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {/* Total Row */}
                          <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 font-bold">
                            <td colSpan={6} className="p-4 text-right text-lg text-gray-900 border-t-2 border-indigo-300">
                              PROJECT TOTAL:
                            </td>
                            <td className="p-4 text-right text-2xl text-indigo-700 border-t-2 border-indigo-300">
                              ${pricedBOQ.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}
                            </td>
                            <td className="border-t-2 border-indigo-300"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800 mb-3">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold text-lg">AI Pricing Complete</span>
                    </div>
                    <div className="grid md:grid-cols-4 gap-4 mb-3">
                      <div className="p-3 bg-white rounded border border-green-200">
                        <div className="text-xs text-gray-600 mb-1">Total Items</div>
                        <div className="text-2xl font-bold text-green-700">{pricedBOQ.length}</div>
                        <div className="text-xs text-gray-600">Priced line items</div>
                      </div>
                      <div className="p-3 bg-white rounded border border-purple-200">
                        <div className="text-xs text-gray-600 mb-1">Pricing Sources</div>
                        <div className="flex gap-1 text-xs mt-1 flex-wrap">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            ⚡ $/kW: {pricedBOQ.filter(i => i.priceSource === 'fixed').length}
                          </span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            🤖 AI: {pricedBOQ.filter(i => i.priceSource === 'ai').length}
                          </span>
                          <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded">
                            🔍 Web: {pricedBOQ.filter(i => i.priceSource === 'web').length}
                          </span>
                          <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded">
                            ✏️ Manual: {pricedBOQ.filter(i => i.priceSource === 'manual').length}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded border border-blue-200">
                        <div className="text-xs text-gray-600 mb-1">Confidence</div>
                        <div className="flex gap-1 text-xs mt-1 flex-wrap">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            High: {pricedBOQ.filter(i => i.confidence === 'High').length}
                          </span>
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Med: {pricedBOQ.filter(i => i.confidence === 'Medium').length}
                          </span>
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                            Low: {pricedBOQ.filter(i => i.confidence === 'Low').length}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded border border-indigo-200">
                        <div className="text-xs text-gray-600 mb-1">Project Total</div>
                        <div className="text-2xl font-bold text-indigo-700">
                          ${pricedBOQ.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </div>
                        <div className="text-xs text-gray-600">USD (ex-works)</div>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm">
                      🤖 <strong>AI Model:</strong> Gemini 2.5 Flash-Lite with Google Search grounding for real-time pricing<br/>
                      🌐 <strong>Market:</strong> USA rates (2024-2025) adjusted for {projectCountry}<br/>
                      ✏️ <strong>Editable:</strong> All unit prices can be manually adjusted - Total price updates automatically ($/kW for panels/inverters)<br/>
                      ⚠️ <strong>Note:</strong> Prices are estimates. Actual costs may vary based on supplier, quantity, location, and market conditions.
                    </p>
                  </div>

                  {/* Project Development Costs Section */}
                  <div className="mt-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-orange-800 mb-4">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold text-lg">Project Development Costs</span>
                      <span className="text-xs text-orange-700 ml-2">(% of Equipment Cost)</span>
                    </div>

                    <div className="bg-white border border-orange-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-orange-50 sticky top-0">
                            <tr>
                              <th className="text-left p-3 font-semibold text-gray-700 border-b w-12">
                                <input
                                  type="checkbox"
                                  checked={additionalCosts.every(c => c.enabled)}
                                  onChange={(e) => {
                                    const allEnabled = e.target.checked;
                                    setAdditionalCosts(prev => prev.map(c => ({ ...c, enabled: allEnabled })));
                                  }}
                                  className="h-4 w-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                  title="Toggle all"
                                />
                              </th>
                              <th className="text-left p-3 font-semibold text-gray-700 border-b">Cost Item</th>
                              <th className="text-right p-3 font-semibold text-gray-700 border-b">Percentage</th>
                              <th className="text-right p-3 font-semibold text-gray-700 border-b">Cost (USD)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {additionalCosts.map((cost, index) => {
                              const equipmentTotal = pricedBOQ.reduce((sum, item) => sum + item.totalPrice, 0);
                              const costAmount = cost.enabled ? (equipmentTotal * cost.percentage / 100) : 0;
                              
                              return (
                                <tr key={cost.id} className={`hover:bg-orange-25 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'} ${!cost.enabled ? 'opacity-50' : ''}`}>
                                  <td className="p-3 border-b text-center">
                                    <input
                                      type="checkbox"
                                      checked={cost.enabled}
                                      onChange={() => handleAdditionalCostToggle(cost.id)}
                                      className="h-4 w-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                    />
                                  </td>
                                  <td className="p-3 font-medium text-gray-900 border-b">
                                    {cost.name}
                                  </td>
                                  <td className="p-2 border-b text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <input
                                        type="number"
                                        value={cost.percentage}
                                        onChange={(e) => handleAdditionalCostPercentageUpdate(cost.id, parseFloat(e.target.value) || 0)}
                                        disabled={!cost.enabled}
                                        className="w-20 text-right font-medium text-gray-700 border border-gray-300 rounded px-2 py-1 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                      />
                                      <span className="text-gray-600 font-medium">%</span>
                                    </div>
                                  </td>
                                  <td className="p-3 font-bold text-orange-700 border-b text-right">
                                    ${costAmount.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                            {/* Subtotal Row */}
                            <tr className="bg-orange-100 font-bold">
                              <td colSpan={3} className="p-4 text-right text-base text-gray-900 border-t-2 border-orange-300">
                                Development Costs Subtotal:
                              </td>
                              <td className="p-4 text-right text-lg text-orange-800 border-t-2 border-orange-300">
                                ${additionalCosts
                                  .filter(c => c.enabled)
                                  .reduce((sum, cost) => {
                                    const equipmentTotal = pricedBOQ.reduce((s, item) => s + item.totalPrice, 0);
                                    return sum + (equipmentTotal * cost.percentage / 100);
                                  }, 0)
                                  .toFixed(2)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Grand Total */}
                    <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Equipment Cost</div>
                          <div className="text-xl font-bold text-gray-900">
                            ${pricedBOQ.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-400">+</div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Development Costs</div>
                          <div className="text-xl font-bold text-orange-700">
                            ${additionalCosts
                              .filter(c => c.enabled)
                              .reduce((sum, cost) => {
                                const equipmentTotal = pricedBOQ.reduce((s, item) => s + item.totalPrice, 0);
                                return sum + (equipmentTotal * cost.percentage / 100);
                              }, 0)
                              .toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-400">=</div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">TOTAL PROJECT COST</div>
                          <div className="text-3xl font-bold text-green-700">
                            ${(() => {
                              const equipmentTotal = pricedBOQ.reduce((sum, item) => sum + item.totalPrice, 0);
                              const additionalTotal = additionalCosts
                                .filter(c => c.enabled)
                                .reduce((sum, cost) => sum + (equipmentTotal * cost.percentage / 100), 0);
                              return (equipmentTotal + additionalTotal).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 text-xs mt-3">
                      💡 <strong>Note:</strong> Check/uncheck items to include/exclude from total project cost. All percentages are editable.
                    </p>

                    {/* Navigate to Financials Button */}
                    {onNavigateToFinancials && (() => {
                      const equipmentTotal = pricedBOQ.reduce((sum, item) => sum + item.totalPrice, 0);
                      const additionalTotal = additionalCosts
                        .filter(c => c.enabled)
                        .reduce((sum, cost) => sum + (equipmentTotal * cost.percentage / 100), 0);
                      const totalProjectCost = equipmentTotal + additionalTotal;
                      
                      return totalProjectCost > 0 ? (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="flex flex-col items-center gap-3">
                            <p className="text-sm text-gray-600 text-center">
                              Ready to analyze the financial viability of this project?
                            </p>
                            <Button
                              onClick={onNavigateToFinancials}
                              size="lg"
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-6 text-base shadow-lg hover:shadow-xl transition-all"
                            >
                              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                              Proceed to Financial Analysis
                              <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Button>
                            <p className="text-xs text-gray-500">
                              Calculate IRR, NPV, LCOE, Payback Period & 25-Year Cash Flow
                            </p>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="text-center py-12">
                    <Calculator className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Pricing Generated</h3>
                    <p className="text-gray-600 mb-4">
                      Generate BOQ first, then click "Generate AI Pricing" in the Results tab.
                    </p>
                    <Button
                      onClick={() => setActiveTab("results")}
                      variant="outline"
                    >
                      Go to Results
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailedBOQGenerator;
