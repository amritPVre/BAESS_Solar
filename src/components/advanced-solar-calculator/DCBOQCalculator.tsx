import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  Power, 
  Cable, 
  Shield, 
  Zap, 
  Activity, 
  Download,
  Copy,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { toast } from "sonner";

// DC BOQ Item interface
interface DCBOQItem {
  description: string;
  specifications: string;
  unit: string;
  qty: number;
  category: string;
}

// DC BOQ Category interface
interface DCBOQCategory {
  category: string;
  items: DCBOQItem[];
  icon: string;
}

interface DCBOQCalculatorProps {
  selectedPanel: any;
  selectedInverter: any;
  totalStringCount: number;
  averageStringCurrent: number;
  averageStringVoltage: number;
  manualInverterCount: number;
  capacity: number;
  isCentralInverter: boolean;
  polygonConfigs: any[];
  centralStringSizingData?: any;
  dcStringCableData?: any;
  dcdbCableData?: any;
  onBOQCalculated?: (items: Array<{
    description: string;
    specifications: string;
    unit: string;
    qty: number | string;
    category: string;
  }>) => void;
}

const DCBOQCalculator: React.FC<DCBOQCalculatorProps> = ({
  selectedPanel,
  selectedInverter,
  totalStringCount,
  averageStringCurrent,
  averageStringVoltage,
  manualInverterCount,
  capacity,
  isCentralInverter,
  polygonConfigs,
  centralStringSizingData,
  dcStringCableData,
  dcdbCableData,
  onBOQCalculated
}) => {
  const [dcBOQItems, setDCBOQItems] = useState<DCBOQItem[]>([]);
  const [categorizedBOQ, setCategorizedBOQ] = useState<DCBOQCategory[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // Professional Engineering Standards Database
  const ENGINEERING_STANDARDS = {
    // DC Fuse Standard Ratings (A)
    dcFuseRatings: [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 20, 25, 30, 32, 35, 40, 50, 63, 80, 100, 125, 160, 200, 250],
    
    // Fuse Holder Types with compatibility
    fuseHolders: [
      { type: "cylindrical fuse holder 5×20 mm", maxCurrent: 10 },
      { type: "cylindrical fuse holder 10×38 mm", maxCurrent: 20 },
      { type: "NH fuse base size 00", maxCurrent: 63 },
      { type: "NH fuse base size 0", maxCurrent: 160 },
      { type: "NH fuse base size 1", maxCurrent: 400 }
    ],
    
    // Conduit Specifications (Nominal Diameter : Internal Area mm²)
    conduits: [
      { nominal: 16, internalArea: 133 },
      { nominal: 20, internalArea: 201 },
      { nominal: 25, internalArea: 314 },
      { nominal: 32, internalArea: 530 },
      { nominal: 40, internalArea: 804 },
      { nominal: 50, internalArea: 1257 },
      { nominal: 63, internalArea: 2027 },
      { nominal: 75, internalArea: 2835 },
      { nominal: 90, internalArea: 4072 },
      { nominal: 110, internalArea: 6082 }
    ],
    
    // Cable Tie Lengths (mm)
    cableTieLengths: [100, 120, 150, 200, 250, 300, 360, 400, 460, 500, 600, 750, 1000],
    
    // Cable Lug Sizes with Current Ratings (mm² : max current A at 90°C)
    cableLugs: [
      { size: 1.5, maxCurrent: 20 }, { size: 2.5, maxCurrent: 27 }, { size: 4, maxCurrent: 37 },
      { size: 6, maxCurrent: 47 }, { size: 10, maxCurrent: 65 }, { size: 16, maxCurrent: 85 },
      { size: 25, maxCurrent: 112 }, { size: 35, maxCurrent: 138 }, { size: 50, maxCurrent: 168 },
      { size: 70, maxCurrent: 207 }, { size: 95, maxCurrent: 251 }, { size: 120, maxCurrent: 289 },
      { size: 150, maxCurrent: 328 }, { size: 185, maxCurrent: 374 }, { size: 240, maxCurrent: 435 },
      { size: 300, maxCurrent: 493 }, { size: 400, maxCurrent: 574 }, { size: 500, maxCurrent: 656 },
      { size: 630, maxCurrent: 749 }
    ],
    
    // Enhanced SPD Database (Voltage_VDC : kA_rating : Type)
    spdOptions: [
      { voltage: 600, kA: 10, type: "Type 2" }, { voltage: 600, kA: 20, type: "Type 1+2" }, { voltage: 600, kA: 40, type: "Type 1+2" },
      { voltage: 800, kA: 10, type: "Type 2" }, { voltage: 800, kA: 20, type: "Type 1+2" }, { voltage: 800, kA: 40, type: "Type 1+2" },
      { voltage: 1000, kA: 20, type: "Type 1+2" }, { voltage: 1000, kA: 40, type: "Type 1+2" }, { voltage: 1000, kA: 65, type: "Type 1+2" },
      { voltage: 1200, kA: 20, type: "Type 1+2" }, { voltage: 1200, kA: 40, type: "Type 1+2" }, { voltage: 1200, kA: 65, type: "Type 1+2" },
      { voltage: 1500, kA: 40, type: "Type 1+2" }, { voltage: 1500, kA: 65, type: "Type 1+2" }, { voltage: 1500, kA: 100, type: "Type 1+2" }
    ],
    
    // DC Isolator/MCB Current Ratings (A)
    isolatorRatings: [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320, 400, 500, 630, 800, 1000, 1200],
    
    // Busbar Cross-Sections with Current Capacity (mm² : max current A)
    busbars: [
      { size: 25, maxCurrent: 120 }, { size: 35, maxCurrent: 150 }, { size: 50, maxCurrent: 180 },
      { size: 70, maxCurrent: 220 }, { size: 95, maxCurrent: 270 }, { size: 120, maxCurrent: 310 },
      { size: 150, maxCurrent: 350 }, { size: 185, maxCurrent: 400 }, { size: 240, maxCurrent: 460 },
      { size: 300, maxCurrent: 520 }, { size: 400, maxCurrent: 600 }
    ],
    
    // DCDB Enclosure Specifications
    dcdbEnclosures: [
      { dimensions: "300×300×150", material: "Powder-coated MS", ip: "IP54", maxFusePositions: 6, application: "Indoor/small outdoor" },
      { dimensions: "400×400×200", material: "Powder-coated MS", ip: "IP54", maxFusePositions: 12, application: "Indoor/small outdoor" },
      { dimensions: "500×400×250", material: "SS304", ip: "IP65", maxFusePositions: 18, application: "Standard outdoor" },
      { dimensions: "600×400×250", material: "SS304", ip: "IP65", maxFusePositions: 24, application: "Standard outdoor" },
      { dimensions: "800×600×300", material: "SS316", ip: "IP65", maxFusePositions: 40, application: "Harsh outdoor/marine" },
      { dimensions: "1000×800×300", material: "SS316", ip: "IP66", maxFusePositions: 60, application: "Utility-scale/harsh environment" }
    ]
  };

  // Engineering calculation parameters with defaults
  const ENGINEERING_PARAMS = {
    sheathAreaMultiplier: 1.1,
    cableTieSpacing: 0.5, // meters
    extraTiesPerRun: 2,
    bundlesTiedPerString: 1,
    fuseSizingMultiplier: 1.56, // NEC 690.8
    temperatureSafetyMargin: 1.15,
    sparePercentage: 10,
    spdsPerDCDB: 2,
    channelsPerMonitoringDevice: 2,
    coldTemperatureCoeff: -0.0035, // %/°C
    minimumOperatingTemp: -10, // °C
    temperatureDerateFactor: 0.9, // for 40°C ambient
    continuousCurrentFactor: 1.25 // NEC derating
  };

  // Helper functions for professional standard selection
  const selectNextHigherStandard = (calculatedValue: number, standardList: number[]): { chosen: number; calculated: number } => {
    const chosen = standardList.find(std => std >= calculatedValue) || standardList[standardList.length - 1];
    return { chosen, calculated: calculatedValue };
  };

  const getFuseHolderType = (fuseRating: number): string => {
    const holder = ENGINEERING_STANDARDS.fuseHolders.find(h => h.maxCurrent >= fuseRating);
    return holder ? holder.type : ENGINEERING_STANDARDS.fuseHolders[ENGINEERING_STANDARDS.fuseHolders.length - 1].type;
  };

  const getSPDSpecification = (requiredVoltage: number, systemSize: 'residential' | 'commercial' | 'utility'): any => {
    // Find suitable voltage options
    const suitableOptions = ENGINEERING_STANDARDS.spdOptions.filter(spd => spd.voltage >= requiredVoltage);
    if (suitableOptions.length === 0) {
      return ENGINEERING_STANDARDS.spdOptions[ENGINEERING_STANDARDS.spdOptions.length - 1];
    }

    // Select kA rating based on system type
    const minVoltageOptions = suitableOptions.filter(opt => opt.voltage === suitableOptions[0].voltage);
    
    if (systemSize === 'residential') {
      return minVoltageOptions.find(opt => opt.kA >= 20) || minVoltageOptions[0];
    } else if (systemSize === 'commercial') {
      return minVoltageOptions.find(opt => opt.kA >= 40) || minVoltageOptions[0];
    } else {
      return minVoltageOptions.find(opt => opt.kA >= 65) || minVoltageOptions[0];
    }
  };

  const getDCDBEnclosure = (requiredFusePositions: number, environment: 'indoor' | 'outdoor' | 'harsh'): any => {
    let suitableEnclosures = ENGINEERING_STANDARDS.dcdbEnclosures.filter(enc => enc.maxFusePositions >= requiredFusePositions);
    
    if (environment === 'indoor') {
      return suitableEnclosures.find(enc => enc.ip === 'IP54') || suitableEnclosures[0];
    } else if (environment === 'outdoor') {
      return suitableEnclosures.find(enc => enc.ip === 'IP65' && enc.material.includes('SS304')) || suitableEnclosures[0];
    } else {
      return suitableEnclosures.find(enc => enc.material.includes('SS316')) || suitableEnclosures[0];
    }
  };

  // Professional Cable Tie Selection Database
  const CABLE_TIE_TYPES = [
    { length: 100, width: 2.5, material: 'nylon PA66 UV', tensile: 180, maxBundleDia: 12, environment: 'indoor/light outdoor', cost: 'lowest' },
    { length: 150, width: 3.6, material: 'nylon PA66 UV heavy', tensile: 350, maxBundleDia: 20, environment: 'outdoor moderate UV', cost: 'low' },
    { length: 200, width: 4.6, material: 'nylon PA66 UV extra heavy', tensile: 700, maxBundleDia: 30, environment: 'outdoor/heavy', cost: 'medium' },
    { length: 100, width: 4.6, material: 'stainless steel SS304', tensile: 890, maxBundleDia: 25, environment: 'outdoor/vibration resistant', cost: 'high' },
    { length: 362, width: 7.9, material: 'stainless steel SS316L', tensile: 2670, maxBundleDia: 50, environment: 'harsh outdoor/coastal', cost: 'very high' },
    { length: 521, width: 7.9, material: 'stainless steel SS316L ultra', tensile: 3560, maxBundleDia: 60, environment: 'extreme duty', cost: 'highest' }
  ];

  const calculateBundleDiameter = (cableCrossSection: number, conductorCount: number): number => {
    // Professional bundle diameter calculation
    const effectiveAreaPerConductor = cableCrossSection * ENGINEERING_PARAMS.sheathAreaMultiplier; // 1.1x sheath multiplier
    const bundleTotalArea = effectiveAreaPerConductor * conductorCount;
    const equivalentDiameter = Math.sqrt(4 * bundleTotalArea / Math.PI);
    return equivalentDiameter;
  };

  const selectOptimalCableTie = (bundleDiameter: number, environment: 'indoor' | 'outdoor' | 'coastal' = 'outdoor'): any => {
    // Filter ties that can handle the bundle diameter
    const suitableTies = CABLE_TIE_TYPES.filter(tie => tie.maxBundleDia >= bundleDiameter);
    
    if (suitableTies.length === 0) {
      return CABLE_TIE_TYPES[CABLE_TIE_TYPES.length - 1]; // Return largest if none suitable
    }

    // Selection logic based on environment and bundle size
    if (environment === 'coastal' || bundleDiameter > 25) {
      // Prefer stainless steel for coastal or large bundles
      return suitableTies.find(tie => tie.material.includes('SS316L')) || suitableTies.find(tie => tie.material.includes('stainless')) || suitableTies[0];
    } else if (environment === 'outdoor' && bundleDiameter > 15) {
      // Prefer heavy-duty nylon or stainless for medium outdoor bundles
      return suitableTies.find(tie => tie.material.includes('heavy') || tie.material.includes('stainless')) || suitableTies[0];
    } else {
      // Use smallest suitable tie for small bundles
      return suitableTies[0];
    }
  };

  const calculateTieQuantity = (runLength: number, bundleDiameter: number, selectedTie: any): number => {
    const circumference = Math.PI * bundleDiameter;
    const requiredTieLength = circumference + 20; // 20mm margin
    
    // Verify selected tie can handle the bundle
    if (selectedTie.length < requiredTieLength) {
      console.warn(`⚠️ Selected tie length (${selectedTie.length}mm) may be insufficient for bundle circumference (${requiredTieLength.toFixed(1)}mm)`);
    }
    
    const baseTies = Math.ceil(runLength / ENGINEERING_PARAMS.cableTieSpacing); // 0.5m spacing
    const totalTies = baseTies + ENGINEERING_PARAMS.extraTiesPerRun; // +2 extra
    const withSpares = Math.ceil(totalTies * (1 + ENGINEERING_PARAMS.sparePercentage / 100)); // +10% spares
    
    return withSpares;
  };

  const getStandardDCVoltageRating = (calculatedVoltage: number): { standard: number; calculated: number } => {
    // Commercial DC isolators/MCBs come in fixed voltage standards
    let standardVoltage: number;
    
    if (calculatedVoltage > 600 && calculatedVoltage <= 800) {
      standardVoltage = 800;
    } else if (calculatedVoltage > 800 && calculatedVoltage <= 1000) {
      standardVoltage = 1000;
    } else if (calculatedVoltage > 1000 && calculatedVoltage <= 1200) {
      standardVoltage = 1200;
    } else if (calculatedVoltage > 1200 && calculatedVoltage <= 1500) {
      standardVoltage = 1500;
    } else if (calculatedVoltage <= 600) {
      standardVoltage = 600;  // For lower voltages
    } else {
      standardVoltage = 1500; // Maximum standard for >1500V
    }
    
    return { standard: standardVoltage, calculated: calculatedVoltage };
  };

  // Professional Engineering DC BOQ Calculation
  const calculateDCBOQ = (): DCBOQItem[] => {
    const items: DCBOQItem[] = [];

    if (!selectedPanel || !selectedInverter || !polygonConfigs) {
      return items;
    }

    // Calculate total modules from polygon configs
    const totalModules = polygonConfigs.reduce((total, config) => {
      return total + (config.moduleCount || 0);
    }, 0);

    // System parameters
    const modulePower = selectedPanel.power_rating_w || 400;
    const moduleVoc = selectedPanel.voc_v || (modulePower >= 400 ? 50 : 40); // Default based on power
    const moduleIsc = selectedPanel.isc_a || averageStringCurrent || 11;
    const modulesPerString = Math.ceil(totalModules / totalStringCount) || 20;
    
    // Temperature corrected calculations
    const stringMaxVoltage = modulesPerString * moduleVoc * ENGINEERING_PARAMS.temperatureSafetyMargin;
    const stringShortCircuitCurrent = moduleIsc;
    const continuousCurrent = stringShortCircuitCurrent * ENGINEERING_PARAMS.continuousCurrentFactor;
    
    // Determine system size category
    const systemSizeCategory = totalStringCount <= 10 ? 'residential' : 
                              totalStringCount <= 50 ? 'commercial' : 'utility';

    // 1. PV Modules - Enhanced Specifications
    const moduleWattage = selectedPanel.power_rating_w || selectedPanel.nominal_power_w || '565';
    const moduleEfficiency = selectedPanel.efficiency_percent || selectedPanel.efficiency || '21.9';
    const moduleLength = selectedPanel.dimensions?.length || selectedPanel.module_length || '2278';
    const moduleWidth = selectedPanel.dimensions?.width || selectedPanel.module_width || '1134';
    
    items.push({
      description: `PV Module - ${selectedPanel.model}`,
      specifications: `${moduleWattage}Wp, ${moduleEfficiency}% efficiency, ${moduleLength}×${moduleWidth}mm, ${selectedPanel.technology}`,
      unit: "Nos",
      qty: totalModules,
      category: "PV Modules"
    });

    if (!isCentralInverter) {
      // STRING-INVERTER CONFIGURATION
      
      // 1. MC4 Connectors (Single Free Ends)
      const mc4Calculated = 2 * totalStringCount;
      items.push({
        description: "MC4 Connectors (Single Free Ends)",
        specifications: "MC4 single male/female connector pair, 30A, 1500V DC, IP67",
        unit: "Pairs",
        qty: Math.ceil(mc4Calculated),
        category: "DC Connectors"
      });

      // 2. DC String to Inverter Cable (Single core cables for DC+ and DC-)
      // Extract actual cable size from dcStringCableData
      const stringCableSize = dcStringCableData?.cable?.cross_section_mm2 
        ? parseInt(dcStringCableData.cable.cross_section_mm2) 
        : 6; // Default fallback
      
      // Extract actual length from dcStringCableData
      const averageStringLength = dcStringCableData?.length || 50; // Default 50m per string
      
      // Debug log to verify data extraction
      if (dcStringCableData) {
        console.log('📊 DC String Cable Data (String Inverter):', {
          extractedSize: stringCableSize,
          extractedLength: averageStringLength,
          rawData: dcStringCableData
        });
      }
      
      // For DC, each string needs 2 cables (DC+ and DC-)
      const totalStringCableLength = totalStringCount * 2 * averageStringLength;
      
      items.push({
        description: "DC String to Inverter Cable (Single Core)",
        specifications: `${stringCableSize}mm² single core, tinned Cu, XLPE/PVC, UV resistant, 1800V DC, IEC 62930`,
        unit: "m",
        qty: Math.ceil(totalStringCableLength),
        category: "DC Cables"
      });

      // 3. UV-Resistant Cable Ties (String Runs) - Professional Engineering Calculation
      const averageStringRunLength = averageStringLength; // Use same value as cable calculation
      // stringCableSize already defined above for cable calculation
      const conductorsPerString = 2; // DC+ and DC- per string
      
      // Calculate bundle diameter for string cables
      const stringBundleDiameter = calculateBundleDiameter(stringCableSize, conductorsPerString);
      
      // Select optimal tie based on bundle diameter and outdoor environment
      const selectedStringTie = selectOptimalCableTie(stringBundleDiameter, 'outdoor');
      
      // Calculate quantity based on professional formula
      const stringTieQuantity = calculateTieQuantity(averageStringRunLength, stringBundleDiameter, selectedStringTie);
      const totalStringTies = stringTieQuantity * totalStringCount;
      
      items.push({
        description: "UV-Resistant Cable Ties (String Runs)",
        specifications: `${selectedStringTie.length}×${selectedStringTie.width}mm ${selectedStringTie.material}, tensile ${selectedStringTie.tensile}N (bundle dia: ${stringBundleDiameter.toFixed(1)}mm)`,
        unit: "pcs",
        qty: totalStringTies,
        category: "Cable Management"
      });

      // 4. DC Cable Lugs (String & Inverter Terminations)
      // stringCableSize already defined above for cable calculations
      const stringTerminationLugs = 2 * totalStringCount;
      const stringsPerInverterInput = 2; // Assumption
      const inverterInputLugs = 2 * Math.ceil(totalStringCount / stringsPerInverterInput) * manualInverterCount;
      const totalLugsCalculated = (stringTerminationLugs + inverterInputLugs) * (1 + ENGINEERING_PARAMS.sparePercentage / 100);
      
      const chosenLug = ENGINEERING_STANDARDS.cableLugs.find(lug => lug.size >= stringCableSize) || ENGINEERING_STANDARDS.cableLugs[0];
      
      items.push({
        description: "DC Cable Lugs",
        specifications: `${chosenLug.size}mm² copper lug (for ${stringCableSize}mm² conductor), 90°C rated`,
        unit: "pcs",
        qty: Math.ceil(totalLugsCalculated),
        category: "DC Connectors"
      });

      // 5. Conduits for DC String Cables
      const cableDiameter = Math.sqrt(stringCableSize / 0.785) + 3; // 3mm insulation
      const effectiveAreaPerConductor = Math.PI * Math.pow(cableDiameter / 2, 2) * ENGINEERING_PARAMS.sheathAreaMultiplier;
      const totalCableArea = totalStringCount * 2 * effectiveAreaPerConductor;
      
      // NEC conduit fill factor
      const conduitFillFactor = totalStringCount * 2 === 2 ? 0.31 : 0.40;
      const requiredInternalConduitArea = totalCableArea / conduitFillFactor;
      
      const chosenConduit = ENGINEERING_STANDARDS.conduits.find(c => c.internalArea >= requiredInternalConduitArea) || 
                           ENGINEERING_STANDARDS.conduits[ENGINEERING_STANDARDS.conduits.length - 1];
      
      const numberOfConduits = Math.ceil(totalCableArea / (conduitFillFactor * chosenConduit.internalArea));
      const totalConduitLength = Math.ceil(numberOfConduits * averageStringRunLength);
      
      items.push({
        description: "Conduit for DC String Cables",
        specifications: `${chosenConduit.nominal}mm nominal diameter, PVC Schedule 40, UV resistant (internal area = ${chosenConduit.internalArea}mm², calc req'd = ${requiredInternalConduitArea.toFixed(0)}mm²)`,
        unit: "m",
        qty: totalConduitLength,
        category: "Cable Management"
      });

    } else if (centralStringSizingData) {
      // CENTRAL-INVERTER + DCDB CONFIGURATION
      
      const stringsPerDCDB = centralStringSizingData.dcdbStringInputsPerDCDB || 12;
      const totalDCDBEnclosures = centralStringSizingData.totalDCDBInSystem || Math.ceil(totalStringCount / stringsPerDCDB);
      const inverterInputsPerDCDB = 2; // Default assumption

      // 1. MC4 Connectors (Single Free Ends)
      const centralMC4Calculated = 2 * totalStringCount;
      items.push({
        description: "MC4 Connectors (Single Free Ends)",
        specifications: "MC4 single male/female connector pair, 30A, 1500V DC, IP67",
        unit: "Pairs",
        qty: Math.ceil(centralMC4Calculated),
        category: "DC Connectors"
      });

      // 2. DC String to DCDB Cable (Single core cables for DC+ and DC-)
      // Extract actual cable size from dcStringCableData
      const stringToDCDBCableSize = dcStringCableData?.cable?.cross_section_mm2 
        ? parseInt(dcStringCableData.cable.cross_section_mm2) 
        : 6; // Default fallback
      
      // Extract actual length from dcStringCableData
      const averageStringToDCDBLength = dcStringCableData?.length || 25; // Default 25m per string
      
      // Debug log to verify data extraction
      if (dcStringCableData) {
        console.log('📊 DC String to DCDB Cable Data (Central Inverter):', {
          extractedSize: stringToDCDBCableSize,
          extractedLength: averageStringToDCDBLength,
          rawData: dcStringCableData
        });
      }
      
      // For DC, each string needs 2 cables (DC+ and DC-)
      const totalStringToDCDBCableLength = totalStringCount * 2 * averageStringToDCDBLength;
      
      items.push({
        description: "DC String to DCDB Cable (Single Core)",
        specifications: `${stringToDCDBCableSize}mm² single core, tinned Cu, XLPE/PVC, UV resistant, 1800V DC, IEC 62930`,
        unit: "m",
        qty: Math.ceil(totalStringToDCDBCableLength),
        category: "DC Cables"
      });

      // 3. DCDB Enclosures
      const requiredFusePositions = stringsPerDCDB + 2; // +2 spares
      const chosenEnclosure = getDCDBEnclosure(requiredFusePositions, 'outdoor');
      
      items.push({
        description: "DCDB Enclosure",
        specifications: `${chosenEnclosure.dimensions}mm, ${chosenEnclosure.material}, ${chosenEnclosure.ip}, ${chosenEnclosure.maxFusePositions} fuse positions, ${chosenEnclosure.application}`,
        unit: "pcs",
        qty: totalDCDBEnclosures,
        category: "DC Distribution"
      });

      // 4. DC String Fuses
      const requiredFuseRating = stringShortCircuitCurrent * ENGINEERING_PARAMS.fuseSizingMultiplier;
      const { chosen: chosenFuseRating, calculated: calculatedFuseRating } = selectNextHigherStandard(
        requiredFuseRating, ENGINEERING_STANDARDS.dcFuseRatings
      );
      
      items.push({
        description: "DC String Fuses",
        specifications: `${chosenFuseRating}A gPV fuse (calculated ${calculatedFuseRating.toFixed(1)}A), 1500V DC, IEC 60269-6`,
        unit: "pcs",
        qty: totalStringCount,
        category: "DC Protection"
      });

      // 5. Fuse Holders
      const fuseHolderType = getFuseHolderType(chosenFuseRating);
      
      items.push({
        description: "Fuse Holders",
        specifications: `${fuseHolderType}, compatible with ${chosenFuseRating}A fuse`,
        unit: "pcs",
        qty: totalStringCount,
        category: "DC Protection"
      });

      // 6. DC SPD (Surge Protection Devices)
      const requiredSPDVoltage = ENGINEERING_PARAMS.temperatureSafetyMargin * stringMaxVoltage;
      const spdSpec = getSPDSpecification(requiredSPDVoltage, systemSizeCategory);
      const totalSPDs = ENGINEERING_PARAMS.spdsPerDCDB * totalDCDBEnclosures;
      
      items.push({
        description: "DC Surge Protection Device",
        specifications: `${spdSpec.voltage}V DC, ${spdSpec.kA}kA ${spdSpec.type} (calculated ${requiredSPDVoltage.toFixed(0)}V), IEC 61643-31`,
        unit: "pcs",
        qty: totalSPDs,
        category: "DC Protection"
      });

      // 7. DC Isolators (Input Side)
      const requiredIsolatorCurrent = chosenFuseRating * 1.25;
      const calculatedIsolatorVoltage = Math.ceil(stringMaxVoltage);
      const { chosen: chosenIsolatorCurrent } = selectNextHigherStandard(
        requiredIsolatorCurrent, ENGINEERING_STANDARDS.isolatorRatings
      );
      const { standard: standardIsolatorVoltage, calculated: calcIsolatorVoltage } = getStandardDCVoltageRating(calculatedIsolatorVoltage);
      
      const totalDCIsolators = stringsPerDCDB * totalDCDBEnclosures;
      
      items.push({
        description: "DC Isolators (Input Side)",
        specifications: `${chosenIsolatorCurrent}A, ${standardIsolatorVoltage}V DC, 2-pole (calculated current ${requiredIsolatorCurrent.toFixed(1)}A, calculated voltage ${calcIsolatorVoltage}V), IEC 60947-3`,
        unit: "pcs",
        qty: totalDCIsolators,
        category: "DC Protection"
      });

      // 8. DC Main Circuit Breakers (Output Side)
      const mainMCBCurrent = stringsPerDCDB * chosenFuseRating * 1.25;
      const { chosen: chosenMCBCurrent } = selectNextHigherStandard(
        mainMCBCurrent, ENGINEERING_STANDARDS.isolatorRatings
      );
      const { standard: standardMCBVoltage, calculated: calcMCBVoltage } = getStandardDCVoltageRating(calculatedIsolatorVoltage);
      
      items.push({
        description: "DC Main Circuit Breakers (Output Side)",
        specifications: `${chosenMCBCurrent}A, ${standardMCBVoltage}V DC, 2-pole (calculated current ${mainMCBCurrent.toFixed(1)}A, calculated voltage ${calcMCBVoltage}V), IEC 60947-3`,
        unit: "pcs",
        qty: totalDCDBEnclosures,
        category: "DC Protection"
      });

      // 9. DC Busbars & Terminals
      const continuousCurrentPerBusbar = (stringsPerDCDB * stringShortCircuitCurrent * ENGINEERING_PARAMS.continuousCurrentFactor) / 0.8;
      const deratedCurrent = continuousCurrentPerBusbar / ENGINEERING_PARAMS.temperatureDerateFactor;
      
      const chosenBusbar = ENGINEERING_STANDARDS.busbars.find(bb => bb.maxCurrent >= deratedCurrent) || 
                          ENGINEERING_STANDARDS.busbars[ENGINEERING_STANDARDS.busbars.length - 1];
      
      const totalBusbars = 2 * totalDCDBEnclosures; // Positive & negative
      
      items.push({
        description: "DC Busbars & Terminals",
        specifications: `${chosenBusbar.size}mm² copper busbar (calculated ${deratedCurrent.toFixed(1)}A), IP2X protection`,
        unit: "pcs",
        qty: totalBusbars,
        category: "DC Distribution"
      });

      // 10. DCDB to Inverter DC Cable (Single core cables for DC+ and DC-)
      // Extract actual cable size from dcdbCableData
      let dcdbCableSize = 95; // Default fallback
      let dcdbTotalLength = 0;
      
      if (dcdbCableData) {
        // Extract cable size from cross_section_mm2
        dcdbCableSize = dcdbCableData.cable?.cross_section_mm2
          ? parseInt(dcdbCableData.cable.cross_section_mm2)
          : 95;
        
        // Calculate total length: DCDBs × 2 (polarity) × length per DCDB × number of runs
        const lengthPerDCDB = dcdbCableData.length || 10; // Default 10m
        const numberOfRuns = dcdbCableData.numberOfRuns || 1; // Default 1 run
        dcdbTotalLength = totalDCDBEnclosures * 2 * lengthPerDCDB * numberOfRuns;
        
        // Debug log to verify data extraction
        console.log('📊 DCDB to Inverter Cable Data (Central Inverter):', {
          extractedSize: dcdbCableSize,
          lengthPerDCDB: lengthPerDCDB,
          numberOfRuns: numberOfRuns,
          totalDCDBEnclosures: totalDCDBEnclosures,
          calculatedTotalLength: dcdbTotalLength,
          rawData: dcdbCableData
        });
      } else {
        // Fallback calculation: DCDBs × 2 (polarity) × default length (10m)
        dcdbTotalLength = totalDCDBEnclosures * 2 * 10;
      }
      
      items.push({
        description: "DCDB to Inverter DC Cable (Single Core)",
        specifications: `${dcdbCableSize}mm² single core, tinned Cu, XLPE, UV resistant, 1800V DC, IEC 62930`,
        unit: "m",
        qty: Math.ceil(dcdbTotalLength),
        category: "DC Cables"
      });

      // 11. UV-Resistant Cable Ties (String → DCDB) - Professional Engineering Calculation
      // averageStringToDCDBLength and stringToDCDBCableSize already defined above for cable calculation
      const stringToDCDBConductors = 2; // DC+ and DC- per string
      
      // Calculate bundle diameter for string to DCDB cables
      const stringToDCDBBundleDiameter = calculateBundleDiameter(stringToDCDBCableSize, stringToDCDBConductors);
      
      // Select optimal tie for string to DCDB (outdoor environment)
      const selectedStringToDCDBTie = selectOptimalCableTie(stringToDCDBBundleDiameter, 'outdoor');
      
      // Calculate quantity for each string run
      const stringToDCDBTieQuantity = calculateTieQuantity(averageStringToDCDBLength, stringToDCDBBundleDiameter, selectedStringToDCDBTie);
      const totalStringToDCDBTies = stringToDCDBTieQuantity * totalStringCount;
      
      items.push({
        description: "UV-Resistant Cable Ties (String → DCDB)",
        specifications: `${selectedStringToDCDBTie.length}×${selectedStringToDCDBTie.width}mm ${selectedStringToDCDBTie.material}, tensile ${selectedStringToDCDBTie.tensile}N (bundle dia: ${stringToDCDBBundleDiameter.toFixed(1)}mm)`,
        unit: "pcs",
        qty: totalStringToDCDBTies,
        category: "Cable Management"
      });

      // 12. DC Cable Lugs (String → DCDB & DCDB → Inverter)
      // stringToDCDBCableSize already defined above for cable calculations
      
      // dcdbCableSize already calculated above in the cable section, just use it directly
      const dcdbToInverterCableSize = dcdbCableSize; // Already extracted from dcdbCableData.cable.cross_section_mm2
      
      const stringToDCDBLugs = 2 * totalStringCount;
      const dcdbToInverterLugs = 2 * inverterInputsPerDCDB * totalDCDBEnclosures;
      const totalCentralLugsCalculated = (stringToDCDBLugs + dcdbToInverterLugs) * (1 + ENGINEERING_PARAMS.sparePercentage / 100);
      
      const chosenStringLug = ENGINEERING_STANDARDS.cableLugs.find(lug => lug.size >= stringToDCDBCableSize) || ENGINEERING_STANDARDS.cableLugs[0];
      const chosenDCDBLug = ENGINEERING_STANDARDS.cableLugs.find(lug => lug.size >= dcdbToInverterCableSize) || ENGINEERING_STANDARDS.cableLugs[0];
      
      items.push({
        description: "DC Cable Lugs (String Terminations)",
        specifications: `${chosenStringLug.size}mm² copper lug (for ${stringToDCDBCableSize}mm² conductor), 90°C rated`,
        unit: "pcs",
        qty: Math.ceil(stringToDCDBLugs * (1 + ENGINEERING_PARAMS.sparePercentage / 100)),
        category: "DC Connectors"
      });
      
      items.push({
        description: "DC Cable Lugs (DCDB to Inverter)",
        specifications: `${chosenDCDBLug.size}mm² copper lug (for ${dcdbToInverterCableSize}mm² conductor), 90°C rated`,
        unit: "pcs",
        qty: Math.ceil(dcdbToInverterLugs * (1 + ENGINEERING_PARAMS.sparePercentage / 100)),
        category: "DC Connectors"
      });

      // 13. String Monitoring Devices
      const monitoringDevices = Math.ceil(totalStringCount / ENGINEERING_PARAMS.channelsPerMonitoringDevice);
      
      items.push({
        description: "String Monitoring Device",
        specifications: `${ENGINEERING_PARAMS.channelsPerMonitoringDevice}-channel per device, DC current/voltage monitoring, wireless communication, IP65`,
        unit: "pcs",
        qty: monitoringDevices,
        category: "DC Monitoring"
      });

      // 14. Communication Cable
      const commRunLength = dcdbCableData?.averageLength || 10;
      const totalCommLength = Math.ceil(totalDCDBEnclosures * commRunLength);
      
      items.push({
        description: "Communication Cable",
        specifications: "Cat6 shielded cable, outdoor rated, UV resistant, -40°C to +75°C",
        unit: "m",
        qty: totalCommLength,
        category: "Communication"
      });

      // 15. Cable Ties for DCDB → Inverter Runs - Professional Engineering Calculation
      const dcdbToInverterRunLength = dcdbCableData?.averageLength || 10;
      const dcdbToInverterConductors = 4; // Typically 2 circuits × 2 conductors (DC+ and DC-) per circuit
      
      // Calculate bundle diameter for DCDB to inverter cables
      const dcdbToInverterBundleDiameter = calculateBundleDiameter(dcdbToInverterCableSize, dcdbToInverterConductors);
      
      // Select optimal tie for DCDB to inverter (outdoor/heavy duty environment)
      const selectedDCDBToInverterTie = selectOptimalCableTie(dcdbToInverterBundleDiameter, 'outdoor');
      
      // Calculate quantity based on number of runs
      const numberOfRuns = inverterInputsPerDCDB * totalDCDBEnclosures;
      const tiesPerRun = calculateTieQuantity(dcdbToInverterRunLength, dcdbToInverterBundleDiameter, selectedDCDBToInverterTie);
      const totalDCDBToInverterTies = tiesPerRun * numberOfRuns;
      
      items.push({
        description: "UV-Resistant Cable Ties (DCDB → Inverter)",
        specifications: `${selectedDCDBToInverterTie.length}×${selectedDCDBToInverterTie.width}mm ${selectedDCDBToInverterTie.material}, tensile ${selectedDCDBToInverterTie.tensile}N (bundle dia: ${dcdbToInverterBundleDiameter.toFixed(1)}mm)`,
        unit: "pcs",
        qty: totalDCDBToInverterTies,
        category: "Cable Management"
      });
    }

    return items;
  };

  // Categorize BOQ items
  const categorizeBOQItems = (items: DCBOQItem[]): DCBOQCategory[] => {
    const categories: Record<string, DCBOQItem[]> = {};
    
    items.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });

    const categoryOrder = [
      'PV Modules',
      'DC Connectors', 
      'DC Cables',
      'DC Protection',
      'DC Distribution',
      'DC Monitoring',
      'Communication',
      'Cable Management'
    ];

    const getIconForCategory = (category: string): string => {
      switch (category) {
        case 'PV Modules': return '☀️';
        case 'DC Connectors': return '🔌';
        case 'DC Cables': return '🔗';
        case 'DC Protection': return '🛡️';
        case 'DC Distribution': return '📦';
        case 'DC Monitoring': return '📊';
        case 'Communication': return '📡';
        case 'Cable Management': return '🔧';
        default: return '📋';
      }
    };

    return categoryOrder
      .filter(category => categories[category])
      .map(category => ({
        category,
        items: categories[category],
        icon: getIconForCategory(category)
      }));
  };

  // Calculate BOQ on component mount and when dependencies change
  useEffect(() => {
    const items = calculateDCBOQ();
    setDCBOQItems(items);
    setCategorizedBOQ(categorizeBOQItems(items));
  }, [
    selectedPanel,
    selectedInverter,
    totalStringCount,
    averageStringCurrent,
    averageStringVoltage,
    manualInverterCount,
    capacity,
    isCentralInverter,
    polygonConfigs,
    centralStringSizingData,
    dcStringCableData,
    dcdbCableData
  ]);

  // Call callback when BOQ items are calculated
  useEffect(() => {
    if (dcBOQItems.length > 0 && onBOQCalculated) {
      // Transform DCBOQItem[] to standardized format
      const standardizedItems = dcBOQItems.map(item => ({
        description: item.description,
        specifications: item.specifications,
        unit: item.unit,
        qty: item.qty,
        category: item.category
      }));
      onBOQCalculated(standardizedItems);
    }
  }, [dcBOQItems, onBOQCalculated]);

  // Download CSV function
  const handleDownloadCSV = () => {
    if (dcBOQItems.length === 0) {
      toast.error('No DC BOQ data to download');
      return;
    }

    try {
      const headers = ['S.No', 'Description', 'Specifications', 'Unit', 'Qty'];
      const csvRows = [headers.join(',')];
      
      let serialNumber = 1;
      
      categorizedBOQ.forEach(category => {
        csvRows.push(`"=== ${category.icon} ${category.category.toUpperCase()} (${category.items.length} items) ===","","","",""`);
        
        category.items.forEach(item => {
          csvRows.push([
            serialNumber++,
            `"${item.description.replace(/"/g, '""')}"`,
            `"${item.specifications.replace(/"/g, '""')}"`,
            `"${item.unit}"`,
            `"${item.qty}"`
          ].join(','));
        });
        
        csvRows.push('"","","","",""');
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const timestamp = new Date().toISOString().slice(0,19).replace(/:/g,'-');
        const filename = `DC_BOQ_${capacity}kW_${timestamp}.csv`;
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('DC BOQ CSV downloaded successfully!');
      }
    } catch (error) {
      console.error('Error downloading DC BOQ CSV:', error);
      toast.error('Failed to download DC BOQ CSV');
    }
  };

  // Copy table function
  const handleCopyTable = () => {
    if (dcBOQItems.length === 0) {
      toast.error('No DC BOQ data to copy');
      return;
    }

    try {
      const headers = ['S.No', 'Description', 'Specifications', 'Unit', 'Qty'];
      const tableRows = [headers.join('\t')];
      
      let serialNumber = 1;
      
      categorizedBOQ.forEach(category => {
        tableRows.push(`=== ${category.icon} ${category.category.toUpperCase()} (${category.items.length} items) ===\t\t\t\t`);
        
        category.items.forEach(item => {
          tableRows.push([
            serialNumber++,
            item.description,
            item.specifications,
            item.unit,
            item.qty
          ].join('\t'));
        });
        
        tableRows.push('\t\t\t\t');
      });
      
      const tableString = tableRows.join('\n');
      navigator.clipboard.writeText(tableString);
      toast.success('DC BOQ table copied to clipboard!');
    } catch (error) {
      console.error('Error copying DC BOQ table:', error);
      toast.error('Failed to copy DC BOQ table');
    }
  };

  if (dcBOQItems.length === 0) {
    return null;
  }

  const totalItems = dcBOQItems.length;

  return (
    <Card className="border-orange-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Power className="h-6 w-6 text-orange-600" />
            <div>
              <CardTitle className="text-orange-900">Professional Engineering DC BOQ</CardTitle>
              <p className="text-sm text-orange-600 mt-1">
                {totalItems} engineered items • {capacity}kW System • {totalStringCount} Strings • NEC/IEC Compliant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopyTable}
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button
              onClick={handleDownloadCSV}
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          <div className="border border-gray-200 rounded-b-lg overflow-hidden">
            <div className="overflow-x-auto max-h-96">
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
                    let serialNumber = 1;
                    
                    return categorizedBOQ.map((category, categoryIndex) => [
                      // Category Header
                      <tr key={`category-${categoryIndex}`} className="bg-orange-50 border-t-2 border-orange-200">
                        <td colSpan={5} className="p-3 font-bold text-orange-900 border-b border-orange-200">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{category.icon}</span>
                            <span className="uppercase text-sm tracking-wide">{category.category}</span>
                            <span className="ml-auto text-xs bg-orange-200 px-2 py-1 rounded-full">
                              {category.items.length} items
                            </span>
                          </div>
                        </td>
                      </tr>,
                      // Category Items
                      ...category.items.map((item, itemIndex) => {
                        const currentSerial = serialNumber++;
                        return (
                          <tr key={`${categoryIndex}-${itemIndex}`} className={`hover:bg-gray-50 ${currentSerial % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                            <td className="p-3 font-medium text-gray-700 border-b">{currentSerial}</td>
                            <td className="p-3 font-semibold text-gray-900 border-b">{item.description}</td>
                            <td className="p-3 text-gray-700 text-xs border-b">{item.specifications}</td>
                            <td className="p-3 font-medium text-gray-700 border-b">{item.unit}</td>
                            <td className="p-3 font-bold text-orange-600 border-b">{item.qty}</td>
                          </tr>
                        );
                      })
                    ]).flat();
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-green-50 border-t border-green-200 p-4">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <Shield className="h-4 w-4" />
              <span className="font-medium">Professional Engineering DC BOQ Complete</span>
            </div>
            <p className="text-green-700 text-sm">
              <strong>Generated {totalItems} professionally engineered items</strong> using standard commercial specifications with proper safety margins.
              All ratings sized per NEC 690.8 and IEC standards. Calculated values shown in parentheses where rounded to next higher standard.
              Ready for procurement and construction.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default DCBOQCalculator;
