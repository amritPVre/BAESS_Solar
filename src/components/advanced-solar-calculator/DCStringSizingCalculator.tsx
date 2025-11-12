import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Cable, Calculator, Zap, AlertTriangle, CheckCircle, 
  Thermometer, Shield, Info, TrendingUp, Eye, EyeOff, Settings
} from "lucide-react";
import { toast } from "sonner";

interface DCCable {
  id: string;
  cross_section_mm2: string;
  material: string;
  type: string;
  current_in_air: string;
  current_in_conduit: string;
  buried_conduit_ampacity: string;
  direct_burial_ampacity: string;
  voltage_rating: string;
  conductor_material: string;
  insulation_type: string;
  max_temperature: string;
  voltage_rating_numeric: string;
}

interface DeratingFactor {
  id: string;
  factor_type: string;
  cable_type: string;
  value_key: string;
  value_numeric: string;
  derating_factor: string;
  description: string;
}

interface InstallationConditions {
  ambientTemperature: number;
  installationType: 'air' | 'conduit' | 'buried_conduit' | 'direct_burial';
  grouping: number;
  thermalInsulation: boolean;
  cableArrangement: 'touching_trefoil' | 'laid_flat' | 'spaced';
  spacing: number; // in meters (0.15, 0.30, 0.45, 0.60)
}

interface DCStringSizingCalculatorProps {
  selectedPanel: Record<string, unknown>;
  selectedInverter: Record<string, unknown>;
  totalStringCount: number;
  averageStringCurrent: number;
  averageStringVoltage: number;
  onCableSizingComplete?: (data: Record<string, unknown>) => void;
  initialCableData?: Record<string, unknown>; // For restoring saved cable selections
}

const DCStringSizingCalculator: React.FC<DCStringSizingCalculatorProps> = ({
  selectedPanel,
  selectedInverter,
  totalStringCount,
  averageStringCurrent,
  averageStringVoltage,
  onCableSizingComplete,
  initialCableData
}) => {
  // State for installation conditions - Initialize from saved data if available
  const [installationConditions, setInstallationConditions] = useState<InstallationConditions>({
    ambientTemperature: (initialCableData?.installationConditions as InstallationConditions)?.ambientTemperature || 50,
    installationType: (initialCableData?.installationConditions as InstallationConditions)?.installationType || 'air',
    grouping: (initialCableData?.installationConditions as InstallationConditions)?.grouping || 1,
    thermalInsulation: (initialCableData?.installationConditions as InstallationConditions)?.thermalInsulation || false,
    cableArrangement: (initialCableData?.installationConditions as InstallationConditions)?.cableArrangement || 'touching_trefoil',
    spacing: (initialCableData?.installationConditions as InstallationConditions)?.spacing || 0.30
  });

  // State for cable selection - Initialize from saved data if available
  const [selectedCableMaterial, setSelectedCableMaterial] = useState<'Copper' | 'Aluminum'>(
    (initialCableData?.material as 'Copper' | 'Aluminum') || 'Copper'
  );
  const [cableLength, setCableLength] = useState<number>(
    (initialCableData?.length as number) || 50
  );
  const [selectedCableSize, setSelectedCableSize] = useState<string>(
    ((initialCableData?.cable as Record<string, unknown>)?.cross_section_mm2 as string) || ''
  );

  // State for section visibility
  const [showDeratingFactors, setShowDeratingFactors] = useState(false);
  const [showCableSizingResults, setShowCableSizingResults] = useState(true); // Initially visible

  // State for available cables and derating factors
  const [availableCables, setAvailableCables] = useState<DCCable[]>([]);
  const [deratingFactors, setDeratingFactors] = useState<DeratingFactor[]>([]);
  const [loading, setLoading] = useState(false);

  // Load cables and derating factors on mount
  useEffect(() => {
    if (initialCableData) {
      console.log('🔄 DCStringSizingCalculator: Restoring cable data from saved project:', initialCableData);
    }
    loadCableData();
    loadDeratingFactors();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCableData = async () => {
    try {
      setLoading(true);
      
      // Mock cable data based on the Supabase database structure
      const mockCableData: DCCable[] = [
        {
          "id": "d4f39f40-87e4-453a-ba8e-504a5fa8c3d5",
          "cross_section_mm2": "4",
          "material": "Copper",
          "type": "Multicore",
          "current_in_air": "40",
          "current_in_conduit": "34",
          "buried_conduit_ampacity": "38",
          "direct_burial_ampacity": "42",
          "voltage_rating": "0.6/1kV",
          "conductor_material": "Stranded",
          "insulation_type": "XLPE",
          "max_temperature": "90",
          "voltage_rating_numeric": "1000"
        },
        {
          "id": "cdf8d5a5-b5ed-4548-a868-889036c3e139",
          "cross_section_mm2": "4.0",
          "material": "Aluminum",
          "type": "Multicore",
          "current_in_air": "31",
          "current_in_conduit": "26",
          "buried_conduit_ampacity": "29",
          "direct_burial_ampacity": "32",
          "voltage_rating": "0.6/1kV",
          "conductor_material": "Stranded",
          "insulation_type": "XLPE",
          "max_temperature": "90",
          "voltage_rating_numeric": "1000"
        },
        {
          "id": "8bbfb8b3-49bc-4eb3-bb1a-c8546dab3f1e",
          "cross_section_mm2": "6",
          "material": "Copper",
          "type": "Multicore",
          "current_in_air": "51",
          "current_in_conduit": "43",
          "buried_conduit_ampacity": "47",
          "direct_burial_ampacity": "53",
          "voltage_rating": "0.6/1kV",
          "conductor_material": "Stranded",
          "insulation_type": "XLPE",
          "max_temperature": "90",
          "voltage_rating_numeric": "1000"
        },
        {
          "id": "098365ba-e634-4961-836d-7f70a5b5cd59",
          "cross_section_mm2": "6.0",
          "material": "Aluminum",
          "type": "Multicore",
          "current_in_air": "39",
          "current_in_conduit": "33",
          "buried_conduit_ampacity": "36",
          "direct_burial_ampacity": "41",
          "voltage_rating": "0.6/1kV",
          "conductor_material": "Stranded",
          "insulation_type": "XLPE",
          "max_temperature": "90",
          "voltage_rating_numeric": "1000"
        },
        {
          "id": "f37e2749-07ba-4ed7-b93e-367cb0fa5614",
          "cross_section_mm2": "10",
          "material": "Copper",
          "type": "Multicore",
          "current_in_air": "70",
          "current_in_conduit": "60",
          "buried_conduit_ampacity": "63",
          "direct_burial_ampacity": "70",
          "voltage_rating": "0.6/1kV",
          "conductor_material": "Stranded",
          "insulation_type": "XLPE",
          "max_temperature": "90",
          "voltage_rating_numeric": "1000"
        },
        {
          "id": "ddede32f-2cfa-4a62-a66e-bc937835439a",
          "cross_section_mm2": "10.0",
          "material": "Aluminum",
          "type": "Multicore",
          "current_in_air": "54",
          "current_in_conduit": "46",
          "buried_conduit_ampacity": "49",
          "direct_burial_ampacity": "54",
          "voltage_rating": "0.6/1kV",
          "conductor_material": "Stranded",
          "insulation_type": "XLPE",
          "max_temperature": "90",
          "voltage_rating_numeric": "1000"
        },
        {
          "id": "5e3b6bb9-f10d-4ecf-a006-cc9d4f2798a0",
          "cross_section_mm2": "16",
          "material": "Copper",
          "type": "Multicore",
          "current_in_air": "94",
          "current_in_conduit": "80",
          "buried_conduit_ampacity": "81",
          "direct_burial_ampacity": "91",
          "voltage_rating": "0.6/1kV",
          "conductor_material": "Stranded",
          "insulation_type": "XLPE",
          "max_temperature": "90",
          "voltage_rating_numeric": "1000"
        },
        {
          "id": "dfa6efe7-3ea3-45fd-b0fe-b3a25c679381",
          "cross_section_mm2": "16.0",
          "material": "Aluminum",
          "type": "Multicore",
          "current_in_air": "73",
          "current_in_conduit": "62",
          "buried_conduit_ampacity": "63",
          "direct_burial_ampacity": "70",
          "voltage_rating": "0.6/1kV",
          "conductor_material": "Stranded",
          "insulation_type": "XLPE",
          "max_temperature": "90",
          "voltage_rating_numeric": "1000"
        }
      ];
      
      setAvailableCables(mockCableData);
      
    } catch (error) {
      console.error('Error loading cable data:', error);
      toast.error('Failed to load cable data');
    } finally {
      setLoading(false);
    }
  };

  const loadDeratingFactors = async () => {
    try {
      // Mock derating factors based on the Supabase database structure
      const mockDeratingData: DeratingFactor[] = [
        {
          "id": "9aa3facc-d083-4480-bef6-ca27d9c32f23",
          "factor_type": "ambient_temperature",
          "cable_type": "LV_COPPER_MC",
          "value_key": "10",
          "value_numeric": "10",
          "derating_factor": "1.15",
          "description": "Ambient temperature 10°C"
        },
        {
          "id": "90e61a36-3f57-471c-b4ce-fa20da05d2a5",
          "factor_type": "ambient_temperature",
          "cable_type": "LV_COPPER_MC",
          "value_key": "15",
          "value_numeric": "15",
          "derating_factor": "1.12",
          "description": "Ambient temperature 15°C"
        },
        {
          "id": "f1bb4269-9aa3-486d-919d-b8fdb6ad790a",
          "factor_type": "ambient_temperature",
          "cable_type": "LV_COPPER_MC",
          "value_key": "20",
          "value_numeric": "20",
          "derating_factor": "1.08",
          "description": "Ambient temperature 20°C"
        },
        {
          "id": "1c9135a5-9d9c-48b1-a3c9-a1b2875b1ebf",
          "factor_type": "ambient_temperature",
          "cable_type": "LV_COPPER_MC",
          "value_key": "25",
          "value_numeric": "25",
          "derating_factor": "1.04",
          "description": "Ambient temperature 25°C"
        },
        {
          "id": "390181d1-0c1c-4154-aaf0-f61810d62fbf",
          "factor_type": "ambient_temperature",
          "cable_type": "LV_COPPER_MC",
          "value_key": "30",
          "value_numeric": "30",
          "derating_factor": "1.00",
          "description": "Ambient temperature 30°C"
        },
        {
          "id": "895f6b1c-0ae4-478d-8d3e-9552450a1d4b",
          "factor_type": "ambient_temperature",
          "cable_type": "LV_COPPER_MC",
          "value_key": "35",
          "value_numeric": "35",
          "derating_factor": "0.96",
          "description": "Ambient temperature 35°C"
        },
        {
          "id": "60771f8d-4583-433e-89c4-0831c606ae6e",
          "factor_type": "ambient_temperature",
          "cable_type": "LV_COPPER_MC",
          "value_key": "40",
          "value_numeric": "40",
          "derating_factor": "0.91",
          "description": "Ambient temperature 40°C"
        },
        {
          "id": "5d220ab2-5258-48bc-91e5-213f282f2c45",
          "factor_type": "ambient_temperature",
          "cable_type": "LV_COPPER_MC",
          "value_key": "45",
          "value_numeric": "45",
          "derating_factor": "0.87",
          "description": "Ambient temperature 45°C"
        },
        {
          "id": "80d1a965-474e-4823-8793-aeff0a6f5e74",
          "factor_type": "ambient_temperature",
          "cable_type": "LV_COPPER_MC",
          "value_key": "50",
          "value_numeric": "50",
          "derating_factor": "0.82",
          "description": "Ambient temperature 50°C"
        },
        {
          "id": "214fa6cd-add2-4cd7-b5e9-d345eadaf694",
          "factor_type": "ambient_temperature",
          "cable_type": "LV_COPPER_MC",
          "value_key": "55",
          "value_numeric": "55",
          "derating_factor": "0.76",
          "description": "Ambient temperature 55°C"
        },
        {
          "id": "group-1",
          "factor_type": "grouping_conduit",
          "cable_type": "LV_COPPER_MC",
          "value_key": "1",
          "value_numeric": "1",
          "derating_factor": "1.00",
          "description": "Single cable"
        },
        {
          "id": "group-2",
          "factor_type": "grouping_conduit",
          "cable_type": "LV_COPPER_MC",
          "value_key": "2",
          "value_numeric": "2",
          "derating_factor": "0.80",
          "description": "2 cables grouped"
        },
        {
          "id": "group-3",
          "factor_type": "grouping_conduit",
          "cable_type": "LV_COPPER_MC",
          "value_key": "3",
          "value_numeric": "3",
          "derating_factor": "0.70",
          "description": "3 cables grouped"
        },
        {
          "id": "group-4",
          "factor_type": "grouping_conduit",
          "cable_type": "LV_COPPER_MC",
          "value_key": "4",
          "value_numeric": "4",
          "derating_factor": "0.65",
          "description": "4 cables grouped"
        },
        {
          "id": "thermal-ins",
          "factor_type": "thermal_insulation",
          "cable_type": "LV_COPPER_MC",
          "value_key": "through",
          "value_numeric": "1",
          "derating_factor": "0.50",
          "description": "Through thermal insulation"
        },
        // Single core cable grouping - Touching Trefoil
        {
          "id": "sc-trefoil-2",
          "factor_type": "grouping_single_core_touching_trefoil",
          "cable_type": "DC_SINGLE_CORE_600V",
          "value_key": "2",
          "value_numeric": "2",
          "derating_factor": "0.78",
          "description": "2 circuits - Touching Trefoil"
        },
        {
          "id": "sc-trefoil-3",
          "factor_type": "grouping_single_core_touching_trefoil",
          "cable_type": "DC_SINGLE_CORE_600V",
          "value_key": "3",
          "value_numeric": "3",
          "derating_factor": "0.66",
          "description": "3 circuits - Touching Trefoil"
        },
        {
          "id": "sc-trefoil-4",
          "factor_type": "grouping_single_core_touching_trefoil",
          "cable_type": "DC_SINGLE_CORE_600V",
          "value_key": "4",
          "value_numeric": "4",
          "derating_factor": "0.61",
          "description": "4 circuits - Touching Trefoil"
        },
        {
          "id": "sc-trefoil-5",
          "factor_type": "grouping_single_core_touching_trefoil",
          "cable_type": "DC_SINGLE_CORE_600V",
          "value_key": "5",
          "value_numeric": "5",
          "derating_factor": "0.56",
          "description": "5 circuits - Touching Trefoil"
        },
        {
          "id": "sc-trefoil-6",
          "factor_type": "grouping_single_core_touching_trefoil",
          "cable_type": "DC_SINGLE_CORE_600V",
          "value_key": "6",
          "value_numeric": "6",
          "derating_factor": "0.53",
          "description": "6 circuits - Touching Trefoil"
        },
        // Single core cable grouping - Laid Flat
        {
          "id": "sc-flat-2",
          "factor_type": "grouping_single_core_laid_flat",
          "cable_type": "DC_SINGLE_CORE_600V",
          "value_key": "2",
          "value_numeric": "2",
          "derating_factor": "0.81",
          "description": "2 circuits - Laid Flat"
        },
        {
          "id": "sc-flat-3",
          "factor_type": "grouping_single_core_laid_flat",
          "cable_type": "DC_SINGLE_CORE_600V",
          "value_key": "3",
          "value_numeric": "3",
          "derating_factor": "0.70",
          "description": "3 circuits - Laid Flat"
        },
        {
          "id": "sc-flat-4",
          "factor_type": "grouping_single_core_laid_flat",
          "cable_type": "DC_SINGLE_CORE_600V",
          "value_key": "4",
          "value_numeric": "4",
          "derating_factor": "0.64",
          "description": "4 circuits - Laid Flat"
        },
        // Single core cable grouping - Spaced (0.30m default)
        {
          "id": "sc-spaced-030-2",
          "factor_type": "grouping_single_core_spacing_030",
          "cable_type": "DC_SINGLE_CORE_600V",
          "value_key": "2",
          "value_numeric": "2",
          "derating_factor": "0.88",
          "description": "2 circuits - 0.30m spacing"
        },
        {
          "id": "sc-spaced-030-3",
          "factor_type": "grouping_single_core_spacing_030",
          "cable_type": "DC_SINGLE_CORE_600V",
          "value_key": "3",
          "value_numeric": "3",
          "derating_factor": "0.79",
          "description": "3 circuits - 0.30m spacing"
        },
        {
          "id": "sc-spaced-030-4",
          "factor_type": "grouping_single_core_spacing_030",
          "cable_type": "DC_SINGLE_CORE_600V",
          "value_key": "4",
          "value_numeric": "4",
          "derating_factor": "0.73",
          "description": "4 circuits - 0.30m spacing"
        },
        // Additional spacing options (0.15m, 0.45m, 0.60m) - showing key examples
        {
          "id": "sc-spaced-015-2",
          "factor_type": "grouping_single_core_spacing_015",
          "cable_type": "DC_SINGLE_CORE_600V",
          "value_key": "2",
          "value_numeric": "2",
          "derating_factor": "0.83",
          "description": "2 circuits - 0.15m spacing"
        },
        {
          "id": "sc-spaced-045-2",
          "factor_type": "grouping_single_core_spacing_045",
          "cable_type": "DC_SINGLE_CORE_600V",
          "value_key": "2",
          "value_numeric": "2",
          "derating_factor": "0.91",
          "description": "2 circuits - 0.45m spacing"
        },
        {
          "id": "sc-spaced-060-2",
          "factor_type": "grouping_single_core_spacing_060",
          "cable_type": "DC_SINGLE_CORE_600V",
          "value_key": "2",
          "value_numeric": "2",
          "derating_factor": "0.93",
          "description": "2 circuits - 0.60m spacing"
        }
      ];
      
      setDeratingFactors(mockDeratingData);
      
    } catch (error) {
      console.error('Error loading derating factors:', error);
    }
  };

  // Filter cables by material and available sizes
  const filteredCables = useMemo(() => {
    return availableCables.filter(cable => 
      cable.material === selectedCableMaterial &&
      ['4', '6', '10', '16', '4.0', '6.0', '10.0', '16.0'].includes(cable.cross_section_mm2)
    );
  }, [availableCables, selectedCableMaterial]);

  // Calculate derating factors
  const calculateDerating = useMemo(() => {
    let tempFactor = 1.0;
    let groupingFactor = 1.0;
    let insulationFactor = 1.0;

    // Temperature derating
    const tempFactors = deratingFactors.filter(f => 
      f.factor_type === 'ambient_temperature' && 
      f.cable_type.includes('LV_COPPER')
    );
    
    const closestTempFactor = tempFactors.find(f => 
      parseInt(f.value_numeric) === installationConditions.ambientTemperature
    );
    
    if (closestTempFactor) {
      tempFactor = parseFloat(closestTempFactor.derating_factor);
    } else {
      // Interpolate or use closest value
      const sortedFactors = tempFactors.sort((a, b) => 
        Math.abs(parseInt(a.value_numeric) - installationConditions.ambientTemperature) - 
        Math.abs(parseInt(b.value_numeric) - installationConditions.ambientTemperature)
      );
      if (sortedFactors.length > 0) {
        tempFactor = parseFloat(sortedFactors[0].derating_factor);
      }
    }

    // Grouping factor - for single core DC cables
    let factorType = 'grouping_conduit'; // Default for multicore cables
    
    // For single core DC cables, use specific arrangement factors
    if (installationConditions.cableArrangement === 'touching_trefoil') {
      factorType = 'grouping_single_core_touching_trefoil';
    } else if (installationConditions.cableArrangement === 'laid_flat') {
      factorType = 'grouping_single_core_laid_flat';
    } else if (installationConditions.cableArrangement === 'spaced') {
      // Determine spacing-based factor type
      if (installationConditions.spacing <= 0.15) {
        factorType = 'grouping_single_core_spacing_015';
      } else if (installationConditions.spacing <= 0.30) {
        factorType = 'grouping_single_core_spacing_030';
      } else if (installationConditions.spacing <= 0.45) {
        factorType = 'grouping_single_core_spacing_045';
      } else {
        factorType = 'grouping_single_core_spacing_060';
      }
    }
    
    const groupingFactors = deratingFactors.filter(f => 
      f.factor_type === factorType || f.factor_type === 'grouping_conduit' || f.factor_type === 'grouping_surface'
    );
    
    const groupingFactorData = groupingFactors.find(f => 
      parseInt(f.value_numeric) === installationConditions.grouping && f.factor_type === factorType
    ) || groupingFactors.find(f => 
      parseInt(f.value_numeric) === installationConditions.grouping
    );
    
    if (groupingFactorData) {
      groupingFactor = parseFloat(groupingFactorData.derating_factor);
    }

    // Thermal insulation factor
    if (installationConditions.thermalInsulation) {
      const insulationFactors = deratingFactors.filter(f => 
        f.factor_type === 'thermal_insulation'
      );
      if (insulationFactors.length > 0) {
        insulationFactor = parseFloat(insulationFactors[0].derating_factor);
      } else {
        insulationFactor = 0.5; // Default 50% derating for thermal insulation
      }
    }

    const totalFactor = tempFactor * groupingFactor * insulationFactor;

    return {
      temperature: tempFactor,
      grouping: groupingFactor,
      insulation: insulationFactor,
      total: totalFactor
    };
  }, [deratingFactors, installationConditions]);

  // Utility function to get ampacity based on installation type
  const getAmpacityForInstallation = (cable: DCCable, installationType: string): number => {
    switch (installationType) {
      case 'air':
        return parseFloat(cable.current_in_air);
      case 'conduit':
        return parseFloat(cable.current_in_conduit);
      case 'buried_conduit':
        return parseFloat(cable.buried_conduit_ampacity);
      case 'direct_burial':
        return parseFloat(cable.direct_burial_ampacity);
      default:
        return parseFloat(cable.current_in_air);
    }
  };

  // Utility function to calculate DC voltage drop
  const calculateVoltageDropDC = (cable: DCCable, current: number, length: number, voltage: number) => {
    // DC resistance values (approximate, Ω/km at 20°C)
    const resistancePerKm = {
      'Copper': {
        '4': 4.61, '6': 3.08, '10': 1.84, '16': 1.15,
        '4.0': 4.61, '6.0': 3.08, '10.0': 1.84, '16.0': 1.15
      },
      'Aluminum': {
        '4': 7.41, '6': 4.95, '10': 2.95, '16': 1.85,
        '4.0': 7.41, '6.0': 4.95, '10.0': 2.95, '16.0': 1.85
      }
    };

    const material = cable.material as 'Copper' | 'Aluminum';
    const size = cable.cross_section_mm2;
    const resistance = resistancePerKm[material]?.[size as keyof typeof resistancePerKm.Copper] || 0;

    // DC voltage drop calculation: Vd = 2 × I × R × L / 1000 (factor of 2 for positive and negative conductors)
    const totalResistance = (2 * resistance * length) / 1000; // Ω
    const voltageDrop = current * totalResistance; // V
    const voltageDropPercentage = (voltageDrop / voltage) * 100;

    return {
      voltageDrop,
      voltageDropPercentage,
      resistance: totalResistance,
      isAcceptable: voltageDropPercentage <= 3 // 3% max voltage drop for DC strings
    };
  };

  // Calculate cable sizing
  const cableSizing = useMemo(() => {
    if (!selectedPanel || !selectedInverter || totalStringCount === 0) return null;

    // String current with safety factor (125% as per NEC/IEC)
    const stringCurrent = averageStringCurrent;
    const designCurrent = stringCurrent * 1.25; // 125% safety factor

    // Required ampacity considering derating
    const requiredAmpacity = designCurrent / calculateDerating.total;

    // Find suitable cables
    const suitableCables = filteredCables.filter(cable => {
      const ampacity = getAmpacityForInstallation(cable, installationConditions.installationType);
      const deratedAmpacity = ampacity * calculateDerating.total;
      return deratedAmpacity >= designCurrent;
    });

    // Calculate voltage drop
    let voltageDropResults: { voltageDrop: number; voltageDropPercentage: number; resistance: number; isAcceptable: boolean } | null = null;
    if (selectedCableSize) {
      const selectedCable = filteredCables.find(c => c.cross_section_mm2 === selectedCableSize);
      if (selectedCable) {
        voltageDropResults = calculateVoltageDropDC(
          selectedCable,
          stringCurrent,
          cableLength,
          averageStringVoltage
        );
      }
    }

    return {
      stringCurrent,
      designCurrent,
      requiredAmpacity,
      suitableCables,
      voltageDropResults
    };
  }, [
    selectedPanel, 
    selectedInverter, 
    totalStringCount, 
    averageStringCurrent, 
    averageStringVoltage,
    filteredCables, 
    calculateDerating, 
    installationConditions, 
    selectedCableSize, 
    cableLength
  ]);

  const handleCableSizeSelection = (cableSize: string) => {
    setSelectedCableSize(cableSize);
    
    // Notify parent component
    if (onCableSizingComplete && cableSizing) {
      const selectedCable = filteredCables.find(c => c.cross_section_mm2 === cableSize);
      if (selectedCable) {
        const voltageDropResults = calculateVoltageDropDC(
          selectedCable,
          cableSizing.stringCurrent,
          cableLength,
          averageStringVoltage
        );

        onCableSizingComplete({
          cable: selectedCable,
          material: selectedCableMaterial,
          length: cableLength,
          current: cableSizing.stringCurrent,
          designCurrent: cableSizing.designCurrent,
          voltageDropResults,
          deratingFactors: calculateDerating
        });
      }
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Calculator className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Loading cable data...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main DC String Cable Sizing Card */}
      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cable className="h-5 w-5 text-blue-600" />
            DC String Cable Sizing
            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">String Inverter</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Installation Conditions - Integrated */}
          <div className="p-4 bg-white/70 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <Thermometer className="h-4 w-4 text-orange-500" />
              <h4 className="font-medium text-gray-800">Installation Conditions</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end">
              <div>
                <Label className="text-sm">Ambient Temperature (°C)</Label>
                <Input
                  type="number"
                  min="20"
                  max="70"
                  value={installationConditions.ambientTemperature}
                  onChange={(e) => setInstallationConditions(prev => ({
                    ...prev,
                    ambientTemperature: parseInt(e.target.value) || 50
                  }))}
                  className="h-9"
                />
              </div>
              
              <div>
                <Label className="text-sm">Installation Type</Label>
                <Select
                  value={installationConditions.installationType}
                                  onValueChange={(value: 'air' | 'conduit' | 'buried_conduit' | 'direct_burial') => setInstallationConditions(prev => ({
                  ...prev,
                  installationType: value
                }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="air">In Air (Tray/Rack)</SelectItem>
                    <SelectItem value="conduit">In Conduit</SelectItem>
                    <SelectItem value="buried_conduit">Buried in Conduit</SelectItem>
                    <SelectItem value="direct_burial">Direct Burial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm">Number of Cable Circuits</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={installationConditions.grouping}
                  onChange={(e) => setInstallationConditions(prev => ({
                    ...prev,
                    grouping: parseInt(e.target.value) || 1
                  }))}
                  className="h-9"
                />
              </div>

              <div>
                <Label className="text-sm">Cable Arrangement</Label>
                <Select
                  value={installationConditions.cableArrangement}
                                  onValueChange={(value: 'touching_trefoil' | 'laid_flat' | 'spaced') => setInstallationConditions(prev => ({
                  ...prev,
                  cableArrangement: value
                }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="touching_trefoil">Touching Trefoil</SelectItem>
                    <SelectItem value="laid_flat">Laid Flat</SelectItem>
                    <SelectItem value="spaced">Spaced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {installationConditions.cableArrangement === 'spaced' && (
                <div>
                  <Label className="text-sm">Spacing Between Centers (m)</Label>
                  <Select
                    value={installationConditions.spacing.toString()}
                    onValueChange={(value) => setInstallationConditions(prev => ({
                      ...prev,
                      spacing: parseFloat(value)
                    }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.15">0.15m</SelectItem>
                      <SelectItem value="0.30">0.30m</SelectItem>
                      <SelectItem value="0.45">0.45m</SelectItem>
                      <SelectItem value="0.60">0.60m</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="thermalInsulation"
                  checked={installationConditions.thermalInsulation}
                  onChange={(e) => setInstallationConditions(prev => ({
                    ...prev,
                    thermalInsulation: e.target.checked
                  }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="thermalInsulation" className="text-sm">
                  Through Thermal Insulation
                </Label>
              </div>
            </div>
          </div>

          {/* Cable Selection */}
          <div className="flex items-center gap-2 mb-4">
            <Cable className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-800">Cable Selection</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm">Conductor Material</Label>
              <Select
                value={selectedCableMaterial}
                onValueChange={(value: 'Copper' | 'Aluminum') => setSelectedCableMaterial(value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Copper">Copper</SelectItem>
                  <SelectItem value="Aluminum">Aluminum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm">Cable Length (m)</Label>
              <Input
                type="number"
                min="1"
                max="1000"
                value={cableLength}
                onChange={(e) => setCableLength(parseInt(e.target.value) || 50)}
                className="h-9"
              />
            </div>
            
            <div>
              <Label className="text-sm">Cross Section (mm²)</Label>
              <Select
                value={selectedCableSize}
                onValueChange={handleCableSizeSelection}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select cable size" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCables.map((cable) => (
                    <SelectItem key={cable.id} value={cable.cross_section_mm2}>
                      {cable.cross_section_mm2} mm² - {selectedCableMaterial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Derating Factors - Collapsible */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeratingFactors(!showDeratingFactors)}
              className="text-xs h-8 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              {showDeratingFactors ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showDeratingFactors ? 'Hide' : 'Show'} Derating Factors
            </Button>
            {showDeratingFactors && (
              <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                Total Factor: {calculateDerating.total.toFixed(3)}
              </Badge>
            )}
          </div>

          {showDeratingFactors && (
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-3 bg-white rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-900 mb-1 text-sm">Temperature</h4>
                  <div className="text-lg font-bold text-orange-700">
                    {calculateDerating.temperature.toFixed(3)}
                  </div>
                  <div className="text-xs text-orange-600">@ {installationConditions.ambientTemperature}°C</div>
                </div>
                
                <div className="p-3 bg-white rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-1 text-sm">Grouping</h4>
                  <div className="text-lg font-bold text-blue-700">
                    {calculateDerating.grouping.toFixed(3)}
                  </div>
                  <div className="text-xs text-blue-600">
                    {installationConditions.grouping} circuits - {' '}
                    {installationConditions.cableArrangement === 'touching_trefoil' && 'Touching Trefoil'}
                    {installationConditions.cableArrangement === 'laid_flat' && 'Laid Flat'}
                    {installationConditions.cableArrangement === 'spaced' && `${installationConditions.spacing}m Spaced`}
                  </div>
                </div>
                
                <div className="p-3 bg-white rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-1 text-sm">Insulation</h4>
                  <div className="text-lg font-bold text-purple-700">
                    {calculateDerating.insulation.toFixed(3)}
                  </div>
                  <div className="text-xs text-purple-600">
                    {installationConditions.thermalInsulation ? 'Applied' : 'N/A'}
                  </div>
                </div>
                
                <div className="p-3 bg-white rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-1 text-sm">Total Factor</h4>
                  <div className="text-lg font-bold text-green-700">
                    {calculateDerating.total.toFixed(3)}
                  </div>
                  <div className="text-xs text-green-600">Combined</div>
                </div>
              </div>
            </div>
          )}

          {/* Cable Sizing Results - Collapsible */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCableSizingResults(!showCableSizingResults)}
              className="text-xs h-8 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              {showCableSizingResults ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showCableSizingResults ? 'Hide' : 'Show'} Cable Sizing Results
            </Button>
          </div>

          {/* Cable Sizing Results Content - Collapsible */}
          {showCableSizingResults && cableSizing && (
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium text-gray-800">Cable Sizing Results</h4>
              </div>
              {/* Current Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-white rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-1 text-sm">String Current</h4>
                  <div className="text-lg font-bold text-blue-700">
                    {cableSizing.stringCurrent.toFixed(1)} A
                  </div>
                  <div className="text-xs text-blue-600">Operating current</div>
                </div>
                
                <div className="p-3 bg-white rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-900 mb-1 text-sm">Design Current</h4>
                  <div className="text-lg font-bold text-orange-700">
                    {cableSizing.designCurrent.toFixed(1)} A
                  </div>
                  <div className="text-xs text-orange-600">125% safety factor</div>
                </div>
                
                <div className="p-3 bg-white rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-1 text-sm">Required Ampacity</h4>
                  <div className="text-lg font-bold text-purple-700">
                    {cableSizing.requiredAmpacity.toFixed(1)} A
                  </div>
                  <div className="text-xs text-purple-600">After derating</div>
                </div>
              </div>

              {/* Suitable Cables */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm">Suitable Cable Sizes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {cableSizing.suitableCables.map((cable) => {
                    const baseAmpacity = getAmpacityForInstallation(cable, installationConditions.installationType);
                    const deratedAmpacity = baseAmpacity * calculateDerating.total;
                    const isSelected = selectedCableSize === cable.cross_section_mm2;
                    
                    return (
                      <div
                        key={cable.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                        onClick={() => handleCableSizeSelection(cable.cross_section_mm2)}
                      >
                        <div className="text-center">
                          <div className="font-bold text-lg">
                            {cable.cross_section_mm2} mm²
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            {selectedCableMaterial}
                          </div>
                          <div className="text-xs">
                            <div>Base: {baseAmpacity}A</div>
                            <div className="font-medium text-blue-600">
                              Derated: {deratedAmpacity.toFixed(0)}A
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Voltage Drop Results */}
              {cableSizing.voltageDropResults && selectedCableSize && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4" />
                    Voltage Drop Analysis - {selectedCableSize} mm² {selectedCableMaterial}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {cableSizing.voltageDropResults.voltageDrop.toFixed(2)} V
                      </div>
                      <div className="text-xs text-gray-600">Voltage Drop</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-lg font-bold ${
                        cableSizing.voltageDropResults.isAcceptable ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {cableSizing.voltageDropResults.voltageDropPercentage.toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-600">Percentage</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {cableSizing.voltageDropResults.resistance.toFixed(4)} Ω
                      </div>
                      <div className="text-xs text-gray-600">Total Resistance</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`flex items-center justify-center gap-1 ${
                        cableSizing.voltageDropResults.isAcceptable ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {cableSizing.voltageDropResults.isAcceptable ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">
                          {cableSizing.voltageDropResults.isAcceptable ? 'Acceptable' : 'Exceeds 3%'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DCStringSizingCalculator;