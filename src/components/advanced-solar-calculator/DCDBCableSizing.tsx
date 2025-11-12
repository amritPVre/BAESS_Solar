import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Cable, Calculator, Zap, AlertTriangle, CheckCircle, 
  Thermometer, Shield, Info, TrendingUp, ArrowRight, Eye, EyeOff
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

interface DCDBCableSizingProps {
  selectedPanel: Record<string, unknown>;
  selectedInverter: Record<string, unknown>;
  centralInverterData: Record<string, unknown>;
  averageStringCurrent: number;
  averageStringVoltage: number;
  onCableSizingComplete?: (data: Record<string, unknown>) => void;
  initialCableData?: Record<string, unknown>; // For restoring saved cable selections
}

const DCDBCableSizing: React.FC<DCDBCableSizingProps> = ({
  selectedPanel,
  selectedInverter,
  centralInverterData,
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
    (initialCableData?.length as number) || 100
  );
  const [selectedCableSize, setSelectedCableSize] = useState<string>(
    ((initialCableData?.cable as Record<string, unknown>)?.cross_section_mm2 as string) || ''
  );
  const [numberOfRuns, setNumberOfRuns] = useState<number>(
    (initialCableData?.numberOfRuns as number) || 1
  );

  // State for section visibility
  const [showDeratingFactors, setShowDeratingFactors] = useState(false);
  const [showCableSizingResults, setShowCableSizingResults] = useState(true); // Initially visible
  const [showCableSpecifications, setShowCableSpecifications] = useState(false); // Initially hidden

  // State for available cables and derating factors
  const [availableCables, setAvailableCables] = useState<DCCable[]>([]);
  const [deratingFactors, setDeratingFactors] = useState<DeratingFactor[]>([]);
  const [loading, setLoading] = useState(false);

  // Load cables and derating factors on mount
  useEffect(() => {
    if (initialCableData) {
      console.log('🔄 DCDBCableSizing: Restoring cable data from saved project:', initialCableData);
    }
    loadCableData();
    loadDeratingFactors();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCableData = async () => {
    try {
      setLoading(true);
      
      // Extended cable data including larger cross-sections for DCDB output
      const mockCableData: DCCable[] = [
        // Existing smaller sizes
        {
          "id": "d4f39f40-87e4-453a-ba8e-504a5fa8c3d5",
          "cross_section_mm2": "4",
          "material": "Copper",
          "type": "Single Core",
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
          "id": "8bbfb8b3-49bc-4eb3-bb1a-c8546dab3f1e",
          "cross_section_mm2": "6",
          "material": "Copper",
          "type": "Single Core",
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
          "id": "f37e2749-07ba-4ed7-b93e-367cb0fa5614",
          "cross_section_mm2": "10",
          "material": "Copper",
          "type": "Single Core",
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
          "id": "5e3b6bb9-f10d-4ecf-a006-cc9d4f2798a0",
          "cross_section_mm2": "16",
          "material": "Copper",
          "type": "Single Core",
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
        // Larger cross-sections for DCDB output
        {
          "id": "cable-25mm-cu",
          "cross_section_mm2": "25",
          "material": "Copper",
          "type": "Single Core",
          "current_in_air": "125",
          "current_in_conduit": "107",
          "buried_conduit_ampacity": "110",
          "direct_burial_ampacity": "125",
          "voltage_rating": "0.6/1kV",
          "conductor_material": "Stranded",
          "insulation_type": "XLPE",
          "max_temperature": "90",
          "voltage_rating_numeric": "1000"
        },
        {
          "id": "cable-35mm-cu",
          "cross_section_mm2": "35",
          "material": "Copper",
          "type": "Single Core",
          "current_in_air": "154",
          "current_in_conduit": "132",
          "buried_conduit_ampacity": "135",
          "direct_burial_ampacity": "154",
          "voltage_rating": "0.6/1kV",
          "conductor_material": "Stranded",
          "insulation_type": "XLPE",
          "max_temperature": "90",
          "voltage_rating_numeric": "1000"
        },
        {
          "id": "cable-50mm-cu",
          "cross_section_mm2": "50",
          "material": "Copper",
          "type": "Single Core",
          "current_in_air": "196",
          "current_in_conduit": "168",
          "buried_conduit_ampacity": "172",
          "direct_burial_ampacity": "196",
          "voltage_rating": "0.6/1kV",
          "conductor_material": "Stranded",
          "insulation_type": "XLPE",
          "max_temperature": "90",
          "voltage_rating_numeric": "1000"
        },
        {
          "id": "cable-70mm-cu",
          "cross_section_mm2": "70",
          "material": "Copper",
          "type": "Single Core",
          "current_in_air": "251",
          "current_in_conduit": "216",
          "buried_conduit_ampacity": "220",
          "direct_burial_ampacity": "251",
          "voltage_rating": "0.6/1kV",
          "conductor_material": "Stranded",
          "insulation_type": "XLPE",
          "max_temperature": "90",
          "voltage_rating_numeric": "1000"
        },
        {
          "id": "cable-95mm-cu",
          "cross_section_mm2": "95",
          "material": "Copper",
          "type": "Single Core",
          "current_in_air": "310",
          "current_in_conduit": "267",
          "buried_conduit_ampacity": "272",
          "direct_burial_ampacity": "310",
          "voltage_rating": "0.6/1kV",
          "conductor_material": "Stranded",
          "insulation_type": "XLPE",
          "max_temperature": "90",
          "voltage_rating_numeric": "1000"
        },
        {
          "id": "cable-120mm-cu",
          "cross_section_mm2": "120",
          "material": "Copper",
          "type": "Single Core",
          "current_in_air": "357",
          "current_in_conduit": "308",
          "buried_conduit_ampacity": "314",
          "direct_burial_ampacity": "357",
          "voltage_rating": "0.6/1kV",
          "conductor_material": "Stranded",
          "insulation_type": "XLPE",
          "max_temperature": "90",
          "voltage_rating_numeric": "1000"
        },
        // Aluminum variants for larger sizes
        {
          "id": "cable-25mm-al",
          "cross_section_mm2": "25",
          "material": "Aluminum",
          "type": "Single Core",
          "current_in_air": "97",
          "current_in_conduit": "83",
          "buried_conduit_ampacity": "85",
          "direct_burial_ampacity": "97",
          "voltage_rating": "0.6/1kV",
          "conductor_material": "Stranded",
          "insulation_type": "XLPE",
          "max_temperature": "90",
          "voltage_rating_numeric": "1000"
        },
        {
          "id": "cable-35mm-al",
          "cross_section_mm2": "35",
          "material": "Aluminum",
          "type": "Single Core",
          "current_in_air": "119",
          "current_in_conduit": "102",
          "buried_conduit_ampacity": "105",
          "direct_burial_ampacity": "119",
          "voltage_rating": "0.6/1kV",
          "conductor_material": "Stranded",
          "insulation_type": "XLPE",
          "max_temperature": "90",
          "voltage_rating_numeric": "1000"
        },
        {
          "id": "cable-50mm-al",
          "cross_section_mm2": "50",
          "material": "Aluminum",
          "type": "Single Core",
          "current_in_air": "152",
          "current_in_conduit": "130",
          "buried_conduit_ampacity": "133",
          "direct_burial_ampacity": "152",
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
      // Use the same derating factors as string cable sizing
      const mockDeratingData: DeratingFactor[] = [
        // Temperature factors
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
          "id": "390181d1-0c1c-4154-aaf0-f61810d62fbf",
          "factor_type": "ambient_temperature",
          "cable_type": "LV_COPPER_MC",
          "value_key": "30",
          "value_numeric": "30",
          "derating_factor": "1.00",
          "description": "Ambient temperature 30°C"
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
          "id": "80d1a965-474e-4823-8793-aeff0a6f5e74",
          "factor_type": "ambient_temperature",
          "cable_type": "LV_COPPER_MC",
          "value_key": "50",
          "value_numeric": "50",
          "derating_factor": "0.82",
          "description": "Ambient temperature 50°C"
        },
        // Single core grouping factors
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
          "id": "sc-flat-2",
          "factor_type": "grouping_single_core_laid_flat",
          "cable_type": "DC_SINGLE_CORE_600V",
          "value_key": "2",
          "value_numeric": "2",
          "derating_factor": "0.81",
          "description": "2 circuits - Laid Flat"
        },
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
          "id": "thermal-ins",
          "factor_type": "thermal_insulation",
          "cable_type": "LV_COPPER_MC",
          "value_key": "through",
          "value_numeric": "1",
          "derating_factor": "0.50",
          "description": "Through thermal insulation"
        }
      ];
      
      setDeratingFactors(mockDeratingData);
      
    } catch (error) {
      console.error('Error loading derating factors:', error);
    }
  };

  // Filter cables by material
  const filteredCables = useMemo(() => {
    return availableCables.filter(cable => 
      cable.material === selectedCableMaterial
    );
  }, [availableCables, selectedCableMaterial]);

  // Calculate DCDB output current
  const dcdbOutputCurrent = useMemo(() => {
    if (!centralInverterData?.actualPVStringsPerDCDB || !averageStringCurrent) return 0;
    const stringsPerDCDB = Number(centralInverterData.actualPVStringsPerDCDB) || 0;
    return stringsPerDCDB * averageStringCurrent;
  }, [centralInverterData, averageStringCurrent]);

  // Calculate derating factors (same logic as string cable sizing)
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
      const sortedFactors = tempFactors.sort((a, b) => 
        Math.abs(parseInt(a.value_numeric) - installationConditions.ambientTemperature) - 
        Math.abs(parseInt(b.value_numeric) - installationConditions.ambientTemperature)
      );
      if (sortedFactors.length > 0) {
        tempFactor = parseFloat(sortedFactors[0].derating_factor);
      }
    }

    // Grouping factor for single core cables
    let factorType = 'grouping_conduit';
    
    if (installationConditions.cableArrangement === 'touching_trefoil') {
      factorType = 'grouping_single_core_touching_trefoil';
    } else if (installationConditions.cableArrangement === 'laid_flat') {
      factorType = 'grouping_single_core_laid_flat';
    } else if (installationConditions.cableArrangement === 'spaced') {
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
      f.factor_type === factorType
    );
    
    const groupingFactorData = groupingFactors.find(f => 
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
        insulationFactor = 0.5;
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
  const calculateVoltageDropDC = useCallback((cable: DCCable, current: number, length: number, voltage: number) => {
    // DC resistance values (approximate, Ω/km at 20°C)
    const resistancePerKm = {
      'Copper': {
        '4': 4.61, '6': 3.08, '10': 1.84, '16': 1.15, '25': 0.727, '35': 0.524, 
        '50': 0.387, '70': 0.268, '95': 0.193, '120': 0.153
      },
      'Aluminum': {
        '4': 7.41, '6': 4.95, '10': 2.95, '16': 1.85, '25': 1.20, '35': 0.868, 
        '50': 0.641, '70': 0.443, '95': 0.320, '120': 0.253
      }
    };

    const material = cable.material as 'Copper' | 'Aluminum';
    const size = cable.cross_section_mm2;
    const resistance = resistancePerKm[material]?.[size as keyof typeof resistancePerKm.Copper] || 0;

    // DC voltage drop calculation with parallel runs: Vd = 2 × I × R × L / (1000 × numberOfRuns)
    const totalResistance = (2 * resistance * length) / (1000 * numberOfRuns); // Ω
    const voltageDrop = current * totalResistance; // V
    const voltageDropPercentage = (voltageDrop / voltage) * 100;

    return {
      voltageDrop,
      voltageDropPercentage,
      resistance: totalResistance,
      isAcceptable: voltageDropPercentage <= 2 // 2% max voltage drop for DCDB to inverter
    };
  }, [numberOfRuns]);

  // Calculate cable sizing
  const cableSizing = useMemo(() => {
    if (!centralInverterData || dcdbOutputCurrent === 0) return null;

    // DCDB output current with safety factor (125% as per NEC/IEC)
    const outputCurrent = dcdbOutputCurrent;
    const designCurrent = outputCurrent * 1.25; // 125% safety factor
    const currentPerRun = designCurrent / numberOfRuns; // Current per cable run

    // Required ampacity considering derating
    const requiredAmpacity = currentPerRun / calculateDerating.total;

    // Find suitable cables
    const suitableCables = filteredCables.filter(cable => {
      const ampacity = getAmpacityForInstallation(cable, installationConditions.installationType);
      const deratedAmpacity = ampacity * calculateDerating.total;
      return deratedAmpacity >= currentPerRun;
    });

    // Calculate voltage drop
    let voltageDropResults: { voltageDrop: number; voltageDropPercentage: number; resistance: number; isAcceptable: boolean } | null = null;
    if (selectedCableSize) {
      const selectedCable = filteredCables.find(c => c.cross_section_mm2 === selectedCableSize);
      if (selectedCable) {
        voltageDropResults = calculateVoltageDropDC(
          selectedCable,
          outputCurrent,
          cableLength,
          averageStringVoltage
        );
      }
    }

    return {
      outputCurrent,
      designCurrent,
      currentPerRun,
      requiredAmpacity,
      suitableCables,
      voltageDropResults
    };
  }, [
    centralInverterData,
    dcdbOutputCurrent,
    numberOfRuns,
    filteredCables,
    calculateDerating,
    installationConditions,
    selectedCableSize,
    cableLength,
    averageStringVoltage,
    calculateVoltageDropDC
  ]);

  const handleCableSizeSelection = (cableSize: string) => {
    setSelectedCableSize(cableSize);
    
    // Notify parent component
    if (onCableSizingComplete && cableSizing) {
      const selectedCable = filteredCables.find(c => c.cross_section_mm2 === cableSize);
      if (selectedCable) {
        const voltageDropResults = calculateVoltageDropDC(
          selectedCable,
          cableSizing.outputCurrent,
          cableLength,
          averageStringVoltage
        );

        onCableSizingComplete({
          cable: selectedCable,
          material: selectedCableMaterial,
          length: cableLength,
          numberOfRuns,
          current: cableSizing.outputCurrent,
          currentPerRun: cableSizing.currentPerRun,
          designCurrent: cableSizing.designCurrent,
          voltageDropResults,
          deratingFactors: calculateDerating,
          sectionType: 'DCDB_TO_INVERTER'
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
            <p className="text-gray-500">Loading DCDB cable data...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main DCDB Cable Sizing Card */}
      <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-green-600" />
            DCDB to Inverter DC Cable Sizing
            <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">Central Inverter</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* DCDB Information */}
          <div className="p-4 bg-white/70 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-4 w-4 text-green-600" />
              <h4 className="font-medium text-gray-800">DCDB Output Parameters</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-white rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-1 text-sm">DCDB Output Current</h4>
                <div className="text-lg font-bold text-green-700">
                  {dcdbOutputCurrent.toFixed(1)} A
                </div>
                <div className="text-xs text-green-600">
                  {Number(centralInverterData?.actualPVStringsPerDCDB) || 0} strings × {averageStringCurrent.toFixed(1)}A
                </div>
              </div>
              
              <div className="p-3 bg-white rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-1 text-sm">Cable Configuration</h4>
                <div className="text-lg font-bold text-blue-700">
                  2 × Single Core
                </div>
                <div className="text-xs text-blue-600">+ve and -ve conductors</div>
              </div>
              
              <div className="p-3 bg-white rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-1 text-sm">Voltage Level</h4>
                <div className="text-lg font-bold text-purple-700">
                  {averageStringVoltage.toFixed(0)} V DC
                </div>
                <div className="text-xs text-purple-600">DCDB output voltage</div>
              </div>
            </div>
          </div>

          {/* Installation Conditions - Integrated */}
          <div className="p-4 bg-white/70 rounded-lg border border-green-200">
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
                  id="thermalInsulationDCDB"
                  checked={installationConditions.thermalInsulation}
                  onChange={(e) => setInstallationConditions(prev => ({
                    ...prev,
                    thermalInsulation: e.target.checked
                  }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="thermalInsulationDCDB" className="text-sm">
                  Through Thermal Insulation
                </Label>
              </div>
            </div>
          </div>

          {/* Cable Selection */}
          <div className="flex items-center gap-2 mb-4">
            <Cable className="h-4 w-4 text-green-600" />
            <h4 className="font-medium text-gray-800">Cable Selection</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                onChange={(e) => setCableLength(parseInt(e.target.value) || 100)}
                className="h-9"
              />
            </div>

            <div>
              <Label className="text-sm">Number of Runs per Polarity</Label>
              <Select
                value={numberOfRuns.toString()}
                onValueChange={(value) => setNumberOfRuns(parseInt(value))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} run{num > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              className="text-xs h-8 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              {showDeratingFactors ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showDeratingFactors ? 'Hide' : 'Show'} Derating Factors
            </Button>
            {showDeratingFactors && (
              <Badge className="text-xs bg-green-100 text-green-700 border-green-300">
                Total Factor: {calculateDerating.total.toFixed(3)}
              </Badge>
            )}
          </div>

          {showDeratingFactors && (
            <div className="p-4 bg-green-50/50 rounded-lg border border-green-200 mb-4">
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
              className="text-xs h-8 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              {showCableSizingResults ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showCableSizingResults ? 'Hide' : 'Show'} Cable Sizing Results
            </Button>
          </div>

          {/* Cable Sizing Results Content - Collapsible */}
          {showCableSizingResults && cableSizing && (
            <div className="p-4 bg-green-50/50 rounded-lg border border-green-200 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-4 w-4 text-green-600" />
                <h4 className="font-medium text-gray-800">Cable Sizing Results</h4>
              </div>
              {/* Current Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-white rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-1 text-sm">DCDB Output Current</h4>
                  <div className="text-lg font-bold text-green-700">
                    {cableSizing.outputCurrent.toFixed(1)} A
                  </div>
                  <div className="text-xs text-green-600">Per DCDB</div>
                </div>
                
                <div className="p-3 bg-white rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-900 mb-1 text-sm">Design Current</h4>
                  <div className="text-lg font-bold text-orange-700">
                    {cableSizing.designCurrent.toFixed(1)} A
                  </div>
                  <div className="text-xs text-orange-600">125% safety factor</div>
                </div>
                
                <div className="p-3 bg-white rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-1 text-sm">Current per Run</h4>
                  <div className="text-lg font-bold text-blue-700">
                    {cableSizing.currentPerRun.toFixed(1)} A
                  </div>
                  <div className="text-xs text-blue-600">{numberOfRuns} run{numberOfRuns > 1 ? 's' : ''} per polarity</div>
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {cableSizing.suitableCables.map((cable) => {
                    const baseAmpacity = getAmpacityForInstallation(cable, installationConditions.installationType);
                    const deratedAmpacity = baseAmpacity * calculateDerating.total;
                    const isSelected = selectedCableSize === cable.cross_section_mm2;
                    
                    return (
                      <div
                        key={cable.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-green-300'
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
                            <div className="font-medium text-green-600">
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
                    Voltage Drop Analysis - {selectedCableSize} mm² {selectedCableMaterial} ({numberOfRuns} run{numberOfRuns > 1 ? 's' : ''} per polarity)
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
                        {cableSizing.voltageDropResults.resistance.toFixed(6)} Ω
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
                          {cableSizing.voltageDropResults.isAcceptable ? 'Acceptable' : 'Exceeds 2%'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DCDB Cable Specifications - Collapsible */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCableSpecifications(!showCableSpecifications)}
              className="text-xs h-8 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              {showCableSpecifications ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showCableSpecifications ? 'Hide' : 'Show'} Cable Specifications
            </Button>
          </div>

          {showCableSpecifications && (
            <div className="p-4 bg-green-50/50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-green-600" />
                <h4 className="font-medium text-gray-800">DCDB Cable Specifications</h4>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2 text-sm">DCDB to Inverter Cable Requirements</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Single-core cables for positive and negative polarity</li>
                    <li>• Higher current rating for DCDB output current</li>
                    <li>• UV-resistant jacket for outdoor installations</li>
                    <li>• Temperature rating: 90°C minimum</li>
                    <li>• Voltage rating: 1000V DC minimum</li>
                    <li>• XLPE insulation for durability and high temperature performance</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-blue-900 text-sm">Installation Guidelines</h4>
                  </div>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Parallel runs reduce current per cable and voltage drop</li>
                    <li>• Use appropriate cable management systems for heavy cables</li>
                    <li>• Ensure proper grounding and bonding at both ends</li>
                    <li>• Install surge protection devices at DCDB and inverter</li>
                    <li>• Follow local electrical codes for high-current DC installations</li>
                    <li>• Consider mechanical protection for buried or exposed installations</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DCDBCableSizing;