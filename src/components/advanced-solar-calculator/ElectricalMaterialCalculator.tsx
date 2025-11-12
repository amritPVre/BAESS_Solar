import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Zap, 
  Calculator, 
  FileText, 
  Layers,
  Grid3X3,
  ArrowRight,
  Info,
  Download,
  Power,
  Cable,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Interface for electrical material line items
interface ElectricalMaterialItem {
  id: string;
  item: string;
  description: string;
  specifications: string;
  unit: string;
  quantity: number;
  category: string;
  connectionType: string; // LV or HV
  inverterType: string; // String or Central
  areaIndex?: number;
  calculationBasis: string;
}

type SoilType = "saturated_clay" | "clay" | "loam" | "moist_sand" | "dry_sand" | "rock";

interface ElectricalMaterialCalculatorProps {
  selectedInverter?: {
    manufacturer: string;
    model?: string;
    nominal_ac_power_kw?: number;
    phase?: number;
    inverter_type?: string;
    [key: string]: unknown;
  } | null;
  manualInverterCount: number;
  capacity: number;
  connectionType: 'LV' | 'HV';
  isCentralInverter: boolean;
  totalStringCount: number;
  averageStringCurrent: number;
  averageStringVoltage: number;
  centralStringSizingData?: any;
  polygonConfigs?: any[];
  soilType?: SoilType;
  onMaterialsCalculated?: (materials: ElectricalMaterialItem[]) => void;
}

const ElectricalMaterialCalculator: React.FC<ElectricalMaterialCalculatorProps> = ({ 
  selectedInverter,
  manualInverterCount,
  capacity,
  connectionType,
  isCentralInverter,
  totalStringCount,
  averageStringCurrent,
  averageStringVoltage,
  centralStringSizingData,
  polygonConfigs,
  soilType = "loam",
  onMaterialsCalculated
}) => {
  const [electricalMaterials, setElectricalMaterials] = useState<ElectricalMaterialItem[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");

  // Helper function to calculate AC combiner panels needed
  const calculateACCombinerPanels = () => {
    // Rule: 1 AC combiner panel per 6-8 string inverters (LV) or specific capacity grouping
    if (connectionType === 'LV') {
      return Math.ceil(manualInverterCount / 6); // 6 inverters per AC combiner panel
    } else {
      // For HV, based on capacity grouping
      return Math.ceil(capacity / 1000); // 1 panel per 1MW
    }
  };

  // Helper function to estimate cable lengths
  const estimateCableLength = (fromComponent: string, toComponent: string): number => {
    // Simplified cable length estimation based on typical installation distances
    const cableLengths: Record<string, number> = {
      'inverter_to_combiner': 50, // 50m average
      'combiner_to_poc': 100, // 100m average
      'dcdb_to_inverter': 30, // 30m average
      'inverter_to_lv_panel': 40, // 40m average
      'combiner_to_idt': 80, // 80m average
      'idt_to_transformer': 25, // 25m average
      'transformer_to_poc': 150, // 150m average
      'central_to_idt': 60, // 60m average
    };
    
    const key = `${fromComponent}_to_${toComponent}`;
    return cableLengths[key] || 50; // Default 50m
  };

  // Helper function to get soil resistivity and earthing parameters based on soil type
  const getSoilEarthingParameters = (soilType: SoilType) => {
    // Soil resistivity values in ohm-meters (typical ranges)
    const soilParameters = {
      saturated_clay: {
        resistivity: 30, // 30 Ω⋅m
        description: "Saturated Clay",
        earthRodSpacing: 3, // 3m spacing between rods
        minElectrodes: 4,
        resistivityRange: "20-50 Ω⋅m"
      },
      clay: {
        resistivity: 100, // 100 Ω⋅m
        description: "Clay",
        earthRodSpacing: 4, // 4m spacing
        minElectrodes: 6,
        resistivityRange: "50-200 Ω⋅m"
      },
      loam: {
        resistivity: 150, // 150 Ω⋅m
        description: "Loam",
        earthRodSpacing: 5, // 5m spacing
        minElectrodes: 8,
        resistivityRange: "100-300 Ω⋅m"
      },
      moist_sand: {
        resistivity: 500, // 500 Ω⋅m
        description: "Moist Sand",
        earthRodSpacing: 6, // 6m spacing
        minElectrodes: 10,
        resistivityRange: "200-1000 Ω⋅m"
      },
      dry_sand: {
        resistivity: 2000, // 2000 Ω⋅m
        description: "Dry Sand",
        earthRodSpacing: 8, // 8m spacing
        minElectrodes: 12,
        resistivityRange: "1000-5000 Ω⋅m"
      },
      rock: {
        resistivity: 10000, // 10000 Ω⋅m
        description: "Rock",
        earthRodSpacing: 10, // 10m spacing
        minElectrodes: 16,
        resistivityRange: "5000-50000 Ω⋅m"
      }
    };

    return soilParameters[soilType];
  };

  // Calculate materials for LV Connection Type (String Inverters)
  const calculateLVConnectionMaterials = (): ElectricalMaterialItem[] => {
    const materials: ElectricalMaterialItem[] = [];
    const acCombinerPanels = calculateACCombinerPanels();

    // AC Combiner Panels
    materials.push({
      id: 'ac-combiner-panels-lv',
      item: 'AC Combiner Panels',
      description: 'AC combiner panels for string inverter consolidation',
      specifications: 'IP65 rated, galvanized steel enclosure, 6-way incoming, weatherproof',
      unit: 'nos',
      quantity: acCombinerPanels,
      category: 'AC Distribution',
      connectionType: 'LV',
      inverterType: 'String',
      calculationBasis: `${manualInverterCount} inverters ÷ 6 inverters/panel = ${acCombinerPanels} panels`
    });

    // Incomer Circuit Breakers
    const incomingBreakers = acCombinerPanels * 6; // 6 incoming per panel
    materials.push({
      id: 'incomer-cb-lv',
      item: 'Incomer Circuit Breakers',
      description: 'AC incomer circuit breakers for string inverter inputs',
      specifications: `${Math.ceil((selectedInverter?.nominal_ac_power_kw || 50) * 1.25)}A, 3-pole, C-curve, 10kA breaking capacity`,
      unit: 'nos',
      quantity: incomingBreakers,
      category: 'Protection Devices',
      connectionType: 'LV',
      inverterType: 'String',
      calculationBasis: `${acCombinerPanels} panels × 6 incoming breakers/panel`
    });

    // Outgoing Circuit Breakers
    materials.push({
      id: 'outgoing-cb-lv',
      item: 'Outgoing Circuit Breakers',
      description: 'AC outgoing circuit breakers from combiner panels',
      specifications: `${Math.ceil(capacity * 1.25 / acCombinerPanels)}A, 3-pole, C-curve, 10kA breaking capacity`,
      unit: 'nos',
      quantity: acCombinerPanels,
      category: 'Protection Devices',
      connectionType: 'LV',
      inverterType: 'String',
      calculationBasis: `${acCombinerPanels} panels × 1 outgoing breaker/panel`
    });

    // Inverter to AC Combiner AC Cables
    const invToCombinerCableLength = estimateCableLength('inverter', 'combiner');
    const totalInvToCombinerLength = invToCombinerCableLength * manualInverterCount;
    materials.push({
      id: 'inv-to-combiner-cable-lv',
      item: 'Inverter to AC Combiner Cables',
      description: 'AC cables from string inverters to AC combiner panels',
      specifications: '4C×25mm² XLPE insulated, armored, 1.1kV rated, copper conductor',
      unit: 'meters',
      quantity: totalInvToCombinerLength,
      category: 'AC Cables',
      connectionType: 'LV',
      inverterType: 'String',
      calculationBasis: `${manualInverterCount} inverters × ${invToCombinerCableLength}m/inverter`
    });

    // AC Combiner to PoC Cables
    const combinerToPocCableLength = estimateCableLength('combiner', 'poc');
    const totalCombinerToPocLength = combinerToPocCableLength * acCombinerPanels;
    materials.push({
      id: 'combiner-to-poc-cable-lv',
      item: 'AC Combiner to PoC Cables',
      description: 'AC cables from combiner panels to Point of Connection',
      specifications: `4C×${Math.ceil(capacity / acCombinerPanels * 1.5)}mm² XLPE insulated, armored, 1.1kV rated`,
      unit: 'meters',
      quantity: totalCombinerToPocLength,
      category: 'AC Cables',
      connectionType: 'LV',
      inverterType: 'String',
      calculationBasis: `${acCombinerPanels} panels × ${combinerToPocCableLength}m/panel`
    });

    return materials;
  };

  // Calculate materials for HV Connection Type
  const calculateHVConnectionMaterials = (): ElectricalMaterialItem[] => {
    const materials: ElectricalMaterialItem[] = [];

    // DCDB Components (Common for HV)
    if (isCentralInverter) {
      const totalDCDBs = centralStringSizingData?.dcdbConfiguration?.totalDCDBCount || Math.ceil(totalStringCount / 16);
      
      // DCDB Enclosures
      materials.push({
        id: 'dcdb-enclosures-hv',
        item: 'DCDB Enclosures',
        description: 'DC Distribution Board enclosures for central inverter systems',
        specifications: 'IP65 rated, galvanized steel, ventilation louvers, 16-way string inputs',
        unit: 'nos',
        quantity: totalDCDBs,
        category: 'DC Distribution',
        connectionType: 'HV',
        inverterType: 'Central',
        calculationBasis: `${totalStringCount} strings ÷ 16 strings/DCDB = ${totalDCDBs} DCDBs`
      });

      // DC Fuses
      const fuseRating = Math.ceil(averageStringCurrent * 1.56);
      materials.push({
        id: 'dc-fuses-hv',
        item: 'DC String Fuses',
        description: 'DC fuses for PV string protection in DCDB',
        specifications: `${fuseRating}A, 1000V DC, PV application, gPV characteristic`,
        unit: 'nos',
        quantity: totalStringCount,
        category: 'Protection Devices',
        connectionType: 'HV',
        inverterType: 'Central',
        calculationBasis: `${totalStringCount} strings × 1 fuse/string`
      });

      // Fuse Holders
      materials.push({
        id: 'fuse-holders-hv',
        item: 'DC Fuse Holders',
        description: 'Fuse holders for DC string fuses',
        specifications: `${fuseRating}A rated, 1000V DC, touch-safe, DIN rail mounting`,
        unit: 'nos',
        quantity: totalStringCount,
        category: 'Protection Devices',
        connectionType: 'HV',
        inverterType: 'Central',
        calculationBasis: `${totalStringCount} strings × 1 holder/string`
      });

      // DC SPD (Surge Protection Device)
      materials.push({
        id: 'dc-spd-hv',
        item: 'DC Surge Protection Devices',
        description: 'DC surge protection devices for DCDB',
        specifications: 'Type II, 1000V DC, 20kA surge current, with remote indication',
        unit: 'nos',
        quantity: totalDCDBs * 2, // 2 per DCDB (positive and negative)
        category: 'Protection Devices',
        connectionType: 'HV',
        inverterType: 'Central',
        calculationBasis: `${totalDCDBs} DCDBs × 2 SPDs/DCDB (±ve and -ve)`
      });

      // DC MCB/Isolator
      materials.push({
        id: 'dc-mcb-hv',
        item: 'DC MCB/Isolator',
        description: 'DC miniature circuit breakers for DCDB main isolation',
        specifications: `${Math.ceil(averageStringCurrent * 16 * 1.25)}A, 2-pole, 1000V DC, 10kA breaking`,
        unit: 'nos',
        quantity: totalDCDBs,
        category: 'Protection Devices',
        connectionType: 'HV',
        inverterType: 'Central',
        calculationBasis: `${totalDCDBs} DCDBs × 1 MCB/DCDB`
      });

      // DC Bus Bars
      materials.push({
        id: 'dc-bus-bars-hv',
        item: 'DC Bus Bars for DCDB',
        description: 'Copper bus bars for DC distribution in DCDB',
        specifications: `${Math.ceil(averageStringCurrent * 16 / 100) * 10}×5mm copper bar, tinned, with insulators`,
        unit: 'meters',
        quantity: totalDCDBs * 4, // 4m per DCDB (positive and negative)
        category: 'DC Distribution',
        connectionType: 'HV',
        inverterType: 'Central',
        calculationBasis: `${totalDCDBs} DCDBs × 4m bus bar/DCDB`
      });

      // DCDB to Inverter DC Cables
      const dcdbToInvLength = estimateCableLength('dcdb', 'inverter');
      materials.push({
        id: 'dcdb-to-inv-cable-hv',
        item: 'DCDB to Inverter DC Cables',
        description: 'DC cables from DCDB to central inverter DC input',
        specifications: `2C×${Math.ceil(averageStringCurrent * 16 * 1.5)}mm² XLPE, 1.8kV DC rated, copper`,
        unit: 'meters',
        quantity: totalDCDBs * dcdbToInvLength,
        category: 'DC Cables',
        connectionType: 'HV',
        inverterType: 'Central',
        calculationBasis: `${totalDCDBs} DCDBs × ${dcdbToInvLength}m/DCDB`
      });
    }

    // String Inverter + HV specific components
    if (!isCentralInverter) {
      materials.push(...calculateStringInverterHVMaterials());
    } else {
      materials.push(...calculateCentralInverterHVMaterials());
    }

    return materials;
  };

  // Calculate materials for String Inverter + HV Connection
  const calculateStringInverterHVMaterials = (): ElectricalMaterialItem[] => {
    const materials: ElectricalMaterialItem[] = [];
    const acCombinerPanels = calculateACCombinerPanels();
    
    // String Inverter to LV Combiner Panel AC Cables
    const invToLVLength = estimateCableLength('inverter', 'lv_panel');
    materials.push({
      id: 'inv-to-lv-cable-hv-string',
      item: 'String Inverter to LV Panel AC Cables',
      description: 'AC cables from string inverters to LV combiner panels',
      specifications: '4C×35mm² XLPE insulated, armored, 1.1kV rated, copper conductor',
      unit: 'meters',
      quantity: manualInverterCount * invToLVLength,
      category: 'AC Cables',
      connectionType: 'HV',
      inverterType: 'String',
      calculationBasis: `${manualInverterCount} inverters × ${invToLVLength}m/inverter`
    });

    // LV Combiner Panels for HV
    materials.push({
      id: 'lv-combiner-panels-hv-string',
      item: 'LV Combiner Panels (HV Connection)',
      description: 'LV combiner panels for string inverter consolidation in HV systems',
      specifications: 'IP54 rated, mild steel powder coated, 415V, 12-way incoming',
      unit: 'nos',
      quantity: acCombinerPanels,
      category: 'AC Distribution',
      connectionType: 'HV',
      inverterType: 'String',
      calculationBasis: `${manualInverterCount} inverters ÷ 12 inverters/panel = ${acCombinerPanels} panels`
    });

    // Inverter Duty Transformer
    const idtRating = Math.ceil(capacity / 800) * 1000; // 1000kVA transformers
    const idtQuantity = Math.ceil(capacity / 1000);
    materials.push({
      id: 'idt-transformer-hv-string',
      item: 'Inverter Duty Transformers',
      description: 'Step-up transformers for inverter AC output',
      specifications: `${idtRating}kVA, 415V/11kV, ONAN cooled, vector group Dyn11, impedance 6%`,
      unit: 'nos',
      quantity: idtQuantity,
      category: 'Transformers',
      connectionType: 'HV',
      inverterType: 'String',
      calculationBasis: `${capacity}kW ÷ 1000kW/transformer = ${idtQuantity} transformers`
    });

    // AC Combiner to IDT Cables
    const combinerToIDTLength = estimateCableLength('combiner', 'idt');
    materials.push({
      id: 'combiner-to-idt-cable-hv-string',
      item: 'AC Combiner to IDT Cables',
      description: 'AC cables from LV combiner panels to IDT LV side',
      specifications: `4C×${Math.ceil(capacity / acCombinerPanels * 2)}mm² XLPE, 1.1kV, copper`,
      unit: 'meters',
      quantity: acCombinerPanels * combinerToIDTLength,
      category: 'AC Cables',
      connectionType: 'HV',
      inverterType: 'String',
      calculationBasis: `${acCombinerPanels} panels × ${combinerToIDTLength}m/panel`
    });

    return materials;
  };

  // Calculate materials for Central Inverter + HV Connection
  const calculateCentralInverterHVMaterials = (): ElectricalMaterialItem[] => {
    const materials: ElectricalMaterialItem[] = [];

    // Central Inverters
    materials.push({
      id: 'central-inverters-hv',
      item: 'Central Inverters',
      description: 'Central string inverters for large-scale PV systems',
      specifications: `${selectedInverter?.nominal_ac_power_kw || 1000}kW, 415V AC output, IP54 rated, efficiency >98%`,
      unit: 'nos',
      quantity: manualInverterCount,
      category: 'Inverters',
      connectionType: 'HV',
      inverterType: 'Central',
      calculationBasis: `${capacity}kW ÷ ${selectedInverter?.nominal_ac_power_kw || 1000}kW/inverter = ${manualInverterCount} inverters`
    });

    // Central Inverter to IDT Cables
    const centralToIDTLength = estimateCableLength('central', 'idt');
    materials.push({
      id: 'central-to-idt-cable-hv',
      item: 'Central Inverter to IDT Cables',
      description: 'AC cables from central inverters to IDT LV side',
      specifications: `4C×${Math.ceil((selectedInverter?.nominal_ac_power_kw || 1000) * 1.5)}mm² XLPE, 1.1kV, copper`,
      unit: 'meters',
      quantity: manualInverterCount * centralToIDTLength,
      category: 'AC Cables',
      connectionType: 'HV',
      inverterType: 'Central',
      calculationBasis: `${manualInverterCount} inverters × ${centralToIDTLength}m/inverter`
    });

    // LV Panel Incomer Breakers for IDT
    materials.push({
      id: 'lv-panel-incomer-cb-hv-central',
      item: 'LV Panel Incomer Circuit Breakers',
      description: 'LV panel incomer breakers connecting to IDT',
      specifications: `${Math.ceil((selectedInverter?.nominal_ac_power_kw || 1000) * 1.44 * 1.25)}A, 4-pole, ACB type`,
      unit: 'nos',
      quantity: manualInverterCount,
      category: 'Protection Devices',
      connectionType: 'HV',
      inverterType: 'Central',
      calculationBasis: `${manualInverterCount} inverters × 1 breaker/inverter`
    });

    return materials;
  };

  // Calculate common HV system components (transformers, protection, etc.)
  const calculateCommonHVMaterials = (): ElectricalMaterialItem[] => {
    const materials: ElectricalMaterialItem[] = [];

    // Power Transformers
    const powerTransformerRating = Math.ceil(capacity / 15000) * 20000; // 20MVA transformers
    const powerTransformerQty = Math.ceil(capacity / 20000);
    materials.push({
      id: 'power-transformer-hv',
      item: 'Power Transformers',
      description: 'Main power transformers for grid connection',
      specifications: `${powerTransformerRating / 1000}MVA, 11kV/33kV, ONAN/ONAF cooled, vector group YNyn0`,
      unit: 'nos',
      quantity: powerTransformerQty,
      category: 'Transformers',
      connectionType: 'HV',
      inverterType: isCentralInverter ? 'Central' : 'String',
      calculationBasis: `${capacity}kW ÷ 20MW/transformer = ${powerTransformerQty} transformers`
    });

    // IDT to Power Transformer Cables
    const idtToTransformerLength = estimateCableLength('idt', 'transformer');
    materials.push({
      id: 'idt-to-transformer-cable-hv',
      item: 'IDT to Power Transformer Cables',
      description: 'HV cables from IDT to power transformer',
      specifications: '3C×240mm² XLPE insulated, 11kV rated, copper conductor, armored',
      unit: 'meters',
      quantity: powerTransformerQty * idtToTransformerLength,
      category: 'HV Cables',
      connectionType: 'HV',
      inverterType: isCentralInverter ? 'Central' : 'String',
      calculationBasis: `${powerTransformerQty} transformers × ${idtToTransformerLength}m/transformer`
    });

    // Power Transformer to PoC Cables
    const transformerToPocLength = estimateCableLength('transformer', 'poc');
    materials.push({
      id: 'transformer-to-poc-cable-hv',
      item: 'Power Transformer to PoC Cables',
      description: 'HV cables from power transformer to Point of Connection',
      specifications: '3C×400mm² XLPE insulated, 33kV rated, copper conductor, armored',
      unit: 'meters',
      quantity: powerTransformerQty * transformerToPocLength,
      category: 'HV Cables',
      connectionType: 'HV',
      inverterType: isCentralInverter ? 'Central' : 'String',
      calculationBasis: `${powerTransformerQty} transformers × ${transformerToPocLength}m/transformer`
    });

    // Power Transformer to PoC Circuit Breakers
    materials.push({
      id: 'transformer-to-poc-cb-hv',
      item: 'Power Transformer to PoC Circuit Breakers',
      description: 'HV circuit breakers for transformer output protection',
      specifications: `${Math.ceil(powerTransformerRating / Math.sqrt(3) / 33)}A, 36kV, SF6 type, 25kA breaking`,
      unit: 'nos',
      quantity: powerTransformerQty,
      category: 'Protection Devices',
      connectionType: 'HV',
      inverterType: isCentralInverter ? 'Central' : 'String',
      calculationBasis: `${powerTransformerQty} transformers × 1 breaker/transformer`
    });

    return materials;
  };

  // Calculate protection and metering components
  const calculateProtectionMeteringMaterials = (): ElectricalMaterialItem[] => {
    const materials: ElectricalMaterialItem[] = [];

    // Current Transformers (CTs) - REMOVED: Algorithm calculation not accurate, will implement proper rule-based calculation later
    // const ctQuantity = connectionType === 'HV' ? 12 : 6; // More CTs for HV systems

    // Potential Transformers (PTs)
    if (connectionType === 'HV') {
      materials.push({
        id: 'potential-transformers',
        item: 'Potential Transformers (PTs)',
        description: 'Voltage transformers for HV metering and protection',
        specifications: '33kV/110V, Class 1, 100VA, outdoor type',
        unit: 'nos',
        quantity: 3, // 3 PTs for 3-phase HV
        category: 'Metering & Protection',
        connectionType: 'HV',
        inverterType: isCentralInverter ? 'Central' : 'String',
        calculationBasis: '3 PTs for 3-phase HV metering'
      });
    }

    // Energy Meters
    materials.push({
      id: 'energy-meters',
      item: 'Energy Meters',
      description: 'Digital energy meters for generation measurement',
      specifications: connectionType === 'HV' ? 'Class 0.2S, 3-phase, 4-wire, HV CT/PT operated' : 'Class 1, 3-phase, 4-wire, direct connected',
      unit: 'nos',
      quantity: connectionType === 'HV' ? 2 : 1, // Redundant metering for HV
      category: 'Metering & Protection',
      connectionType,
      inverterType: isCentralInverter ? 'Central' : 'String',
      calculationBasis: connectionType === 'HV' ? '2 meters for redundant HV metering' : '1 meter for LV metering'
    });

    // Protection Relays
    if (connectionType === 'HV') {
      materials.push({
        id: 'protection-relays',
        item: 'Protection Relays',
        description: 'Multifunction protection relays for HV system',
        specifications: 'Numerical relay, overcurrent, earth fault, ROCOF, anti-islanding protection',
        unit: 'nos',
        quantity: 4, // Multiple protection functions
        category: 'Metering & Protection',
        connectionType: 'HV',
        inverterType: isCentralInverter ? 'Central' : 'String',
        calculationBasis: '4 relays for comprehensive HV protection (generator, transformer, feeder, sync)'
      });
    }

    return materials;
  };

  // Calculate earthing system materials
  const calculateEarthingMaterials = (): ElectricalMaterialItem[] => {
    const materials: ElectricalMaterialItem[] = [];
    const totalInstallationArea = polygonConfigs?.reduce((sum, config) => sum + (config.area || 0), 0) || 1000;
    const soilParams = getSoilEarthingParameters(soilType);

    // Earthing Cable - REMOVED: Algorithm calculation not accurate, will implement proper rule-based calculation later
    // const earthingCableLength = Math.max(totalInstallationArea * 1.5, 500); // 1.5m per m² area, minimum 500m

    // Earth Electrodes - REMOVED: Algorithm calculation not accurate, will implement proper rule-based calculation later
    // const baseElectrodes = Math.max(Math.ceil(totalInstallationArea / 500), soilParams.minElectrodes);
    // const earthElectrodes = Math.max(baseElectrodes, soilParams.minElectrodes);

    // Soil Treatment - REMOVED: Related to earthing electrodes which are removed
    // Pit Enhancement - REMOVED: Related to earthing electrodes which are removed

    // Equipment Earthing Clamps - REMOVED: Algorithm calculation not accurate, will implement proper rule-based calculation later
    // const equipmentCount = manualInverterCount + (connectionType === 'HV' ? 8 : 4);

    // Earth Resistance Test Joints - REMOVED: Algorithm calculation not accurate, will implement proper rule-based calculation later
    // Related to earthing electrodes which are also removed

    // Control Room/Inverter Room Earthing
    if (connectionType === 'HV' || isCentralInverter) {
      materials.push({
        id: 'control-room-earthing',
        item: 'Control Room Earthing Grid',
        description: 'Earthing grid for control room and inverter room',
        specifications: '25mm² copper tape, grid pattern, with connection points',
        unit: 'meters',
        quantity: 200, // Standard control room earthing grid
        category: 'Earthing System',
        connectionType,
        inverterType: isCentralInverter ? 'Central' : 'String',
        calculationBasis: 'Standard 200m earthing grid for control room/inverter room'
      });
    }

    return materials;
  };

  // Main calculation function
  const calculateAllElectricalMaterials = (): ElectricalMaterialItem[] => {
    const allMaterials: ElectricalMaterialItem[] = [];

    // Add connection type specific materials
    if (connectionType === 'LV') {
      allMaterials.push(...calculateLVConnectionMaterials());
    } else {
      allMaterials.push(...calculateHVConnectionMaterials());
      allMaterials.push(...calculateCommonHVMaterials());
    }

    // Add common materials for all configurations
    allMaterials.push(...calculateProtectionMeteringMaterials());
    allMaterials.push(...calculateEarthingMaterials());

    return allMaterials;
  };

  // Calculate materials when component mounts or configs change
  useEffect(() => {
    if (selectedInverter && manualInverterCount > 0 && capacity > 0) {
      setIsCalculating(true);
      setTimeout(() => {
        const materials = calculateAllElectricalMaterials();
        setElectricalMaterials(materials);
        onMaterialsCalculated?.(materials);
        setIsCalculating(false);
        toast.success(`Calculated electrical materials for ${connectionType} connection`);
      }, 500);
    }
  }, [selectedInverter, manualInverterCount, capacity, connectionType, isCentralInverter, totalStringCount, soilType]);

  // Export materials to CSV
  const exportMaterials = () => {
    if (electricalMaterials.length === 0) {
      toast.error("No electrical materials to export");
      return;
    }

    try {
      const headers = ['Item', 'Description', 'Specifications', 'Unit', 'Quantity', 'Category', 'Connection Type', 'Inverter Type', 'Calculation Basis'];
      const csvRows = [
        headers.join(','),
        ...electricalMaterials.map(item => [
          `"${item.item}"`,
          `"${item.description}"`,
          `"${item.specifications}"`,
          `"${item.unit}"`,
          item.quantity,
          `"${item.category}"`,
          `"${item.connectionType}"`,
          `"${item.inverterType}"`,
          `"${item.calculationBasis}"`
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const fileName = `Electrical_Materials_${connectionType}_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Electrical materials exported as ${fileName}`);
    } catch (error) {
      console.error('Error exporting materials:', error);
      toast.error("Failed to export materials");
    }
  };

  // Get materials by category
  const getMaterialsByCategory = (category: string) => {
    return electricalMaterials.filter(material => material.category === category);
  };

  // Get unique categories
  const getUniqueCategories = () => {
    return [...new Set(electricalMaterials.map(material => material.category))];
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'AC Distribution': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DC Distribution': return 'bg-green-50 text-green-700 border-green-200';
      case 'Protection Devices': return 'bg-red-50 text-red-700 border-red-200';
      case 'AC Cables': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'DC Cables': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'HV Cables': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Transformers': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Inverters': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Metering & Protection': return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'Earthing System': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (!selectedInverter || manualInverterCount === 0 || capacity === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="p-6 text-center">
          <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Electrical Configuration Required</h3>
          <p className="text-gray-600">Complete inverter selection and system configuration to calculate electrical materials</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-blue-900">Electrical Materials Calculator</h2>
              <p className="text-blue-700 text-sm">Comprehensive electrical BOQ for {connectionType} connection ({isCentralInverter ? 'Central' : 'String'} inverters)</p>
            </div>
          </div>
          <Button onClick={exportMaterials} variant="outline" disabled={electricalMaterials.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-900">{electricalMaterials.length}</div>
            <div className="text-sm text-blue-700">Material Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-900">{getUniqueCategories().length}</div>
            <div className="text-sm text-green-700">Categories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-900">{connectionType}</div>
            <div className="text-sm text-purple-700">Connection Type</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-900">{capacity.toFixed(0)}kW</div>
            <div className="text-sm text-orange-700">System Capacity</div>
          </CardContent>
        </Card>
      </div>

      {/* Materials Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="h-5 w-5 text-blue-500" />
            Electrical Materials by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Summary View</TabsTrigger>
              <TabsTrigger value="by-category">By Category</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Table</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="space-y-4">
              {getUniqueCategories().map(category => {
                const categoryMaterials = getMaterialsByCategory(category);
                const totalQuantity = categoryMaterials.reduce((sum, material) => sum + material.quantity, 0);
                
                return (
                  <Card key={category} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">{category}</h4>
                        <Badge variant="outline" className={getCategoryColor(category)}>
                          {categoryMaterials.length} items
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Total components: {totalQuantity.toLocaleString()}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categoryMaterials.slice(0, 4).map((material) => (
                          <div key={material.id} className={`p-3 rounded-lg border ${getCategoryColor(category)}`}>
                            <div className="font-medium text-sm">{material.item}</div>
                            <div className="text-xs mt-1">{material.quantity.toLocaleString()} {material.unit}</div>
                          </div>
                        ))}
                        {categoryMaterials.length > 4 && (
                          <div className="text-xs text-gray-500 italic">
                            +{categoryMaterials.length - 4} more items...
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
            
            <TabsContent value="by-category" className="space-y-4">
              {getUniqueCategories().map(category => {
                const materials = getMaterialsByCategory(category);
                return (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Badge className={getCategoryColor(category)}>{category}</Badge>
                      </CardTitle>
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
                            </tr>
                          </thead>
                          <tbody>
                            {materials.map((material, idx) => (
                              <tr key={material.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                                <td className="border border-gray-300 px-3 py-2 font-medium">{material.item}</td>
                                <td className="border border-gray-300 px-3 py-2 text-sm text-gray-600">{material.specifications}</td>
                                <td className="border border-gray-300 px-3 py-2 text-center">{material.unit}</td>
                                <td className="border border-gray-300 px-3 py-2 text-right font-bold">{material.quantity.toLocaleString()}</td>
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
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
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
                    {electricalMaterials.map((material, index) => (
                      <tr key={material.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <td className="border border-gray-300 px-3 py-2 font-semibold">{material.item}</td>
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
              <strong>Note:</strong> This electrical material calculation is based on standard industry practices and typical installation parameters. 
              Actual material requirements may vary based on local electrical codes, grid connection requirements, site conditions, and specific manufacturer specifications. 
              Please consult with a qualified electrical engineer and verify all calculations before procurement and installation.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ElectricalMaterialCalculator;
