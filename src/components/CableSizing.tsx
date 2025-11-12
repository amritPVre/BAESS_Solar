import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sun, Zap, Battery, ChevronDown, ChevronUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { getDCSingleCoreCables, calculateDCVoltageDrop, getDCCableDeratingFactors, calculateDeratedAmpacity, getTemperatureDeratingFactor, getGroupingDeratingFactor } from '@/services/cableService';
import { fetchLVCables, fetchLVDeratingFactors, type LVCable, type LVDeratingFactor } from '@/services/cableSelectionService';
import type { DCSingleCoreCable, DCCableDeratingFactor } from '@/types/cables';

interface CableSizingProps {
  couplingType: 'DC' | 'AC' | '';
  // PV configuration
  pvVoltage?: number;
  pvCurrent?: number;
  pvStrings?: number;
  // Battery configuration
  batteryVoltage?: number;
  batteryCurrent?: number;
  // Inverter data for AC cable auto-population
  hybridInverter?: any; // For DC coupled system
  batteryInverter?: any; // For AC coupled system battery inverter
  pvInverter?: any; // For AC coupled system PV inverter
  inverterQuantity?: number;
  // Callback to send cable parameters to parent (for BOQ)
  onCableParamsChange?: (params: any) => void;
}

export const CableSizing: React.FC<CableSizingProps> = ({
  couplingType,
  pvVoltage = 0,
  pvCurrent = 0,
  pvStrings = 1,
  batteryVoltage = 0,
  batteryCurrent = 0,
  hybridInverter,
  batteryInverter,
  pvInverter,
  inverterQuantity = 1,
  onCableParamsChange
}) => {
  // Helper function to calculate AC current from inverter power rating
  // Formula: I = P / (√3 × V × PF) for 3-phase
  // Where: P = Power (W), V = Line voltage (V), PF = Power factor (typically 0.95)
  const calculateInverterCurrent = (powerKW: number, voltageV: number, powerFactor: number = 0.95): number => {
    const powerW = powerKW * 1000;
    const current = powerW / (Math.sqrt(3) * voltageV * powerFactor);
    return current;
  };
  // State for PV Cable Sizing
  const [pvCableParams, setPvCableParams] = useState({
    ambientTemp: 50,
    installationType: 'In Air (Tray/Rack)',
    numberOfCircuits: 1,
    cableArrangement: 'Touching Trefoil',
    throughThermalInsulation: false,
    material: 'Copper' as 'Copper' | 'Aluminum',
    cableLength: 50,
    selectedCableSize: 6,
    showDerating: false,
    showResults: true,
  });

  // State for Battery Cable Sizing
  const [battCableParams, setBattCableParams] = useState({
    ambientTemp: 50,
    installationType: 'In Air (Tray/Rack)',
    numberOfCircuits: 1,
    cableArrangement: 'Touching Trefoil',
    throughThermalInsulation: false,
    material: 'Copper' as 'Copper' | 'Aluminum',
    cableLength: 30,
    selectedCableSize: 10,
    showDerating: false,
    showResults: true,
  });

  // State for AC Cable Sizing (Hybrid Inverter - DC Coupled)
  const [acHybridCableParams, setAcHybridCableParams] = useState({
    operatingCurrent: 0, // Changed from designCurrent to operatingCurrent
    operatingVoltage: 400,
    cableLength: 10,
    material: 'Copper' as 'COPPER' | 'ALUMINUM',
    selectedCableSize: 120,
    cableRuns: 3,
    showDerating: false,
    showResults: true,
  });

  // State for AC Cable Sizing (PV Inverter - AC Coupled)
  const [acPvCableParams, setAcPvCableParams] = useState({
    operatingCurrent: 0, // Changed from designCurrent to operatingCurrent
    operatingVoltage: 400,
    cableLength: 10,
    material: 'Copper' as 'COPPER' | 'ALUMINUM',
    selectedCableSize: 120,
    cableRuns: 3,
    showDerating: false,
    showResults: true,
  });

  // State for AC Cable Sizing (Battery Inverter - AC Coupled)
  const [acBattCableParams, setAcBattCableParams] = useState({
    operatingCurrent: 0, // Changed from designCurrent to operatingCurrent
    operatingVoltage: 400,
    cableLength: 5,
    material: 'Copper' as 'COPPER' | 'ALUMINUM',
    selectedCableSize: 120,
    cableRuns: 2,
    showDerating: false,
    showResults: true,
  });

  const [dcCables, setDcCables] = useState<DCSingleCoreCable[]>([]);
  const [lvCables, setLvCables] = useState<LVCable[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for showing/hiding K-Factor details
  const [showHybridKFactor, setShowHybridKFactor] = useState(false);
  const [showPvKFactor, setShowPvKFactor] = useState(false);
  const [showBattKFactor, setShowBattKFactor] = useState(false);

  // Fetch DC and AC cables from database
  useEffect(() => {
    const fetchCables = async () => {
      try {
        const [dcCablesData, lvCablesData] = await Promise.all([
          getDCSingleCoreCables(),
          fetchLVCables()
        ]);
        setDcCables(dcCablesData);
        setLvCables(lvCablesData);
      } catch (error) {
        console.error('Error fetching cables:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCables();
  }, []);

  // Auto-populate Hybrid Inverter AC cable parameters (DC Coupled System)
  useEffect(() => {
    if (couplingType === 'DC' && hybridInverter) {
      const voltage = hybridInverter.operating_ac_voltage_v || 400;
      const powerKW = (hybridInverter.rated_ac_capacity_kw || 0) * inverterQuantity;
      // Hybrid inverters: PF = 0.95
      // Formula: I = (P × 1000) / (V × √3 × PF)
      const operatingCurrent = calculateInverterCurrent(powerKW, voltage, 0.95);
      
      // Always update when inverter data changes (store operating current)
      setAcHybridCableParams(prev => ({
        ...prev,
        operatingCurrent: Number(operatingCurrent.toFixed(2)), // Store operating current
        operatingVoltage: voltage,
      }));
      
      console.log('🔌 Hybrid Inverter AC Cable Auto-populated:', {
        powerKW,
        voltage,
        powerFactor: 0.95,
        operatingCurrent: operatingCurrent.toFixed(2),
        designCurrent: (operatingCurrent * 1.25).toFixed(2),
        formula: `(${powerKW} × 1000) / (${voltage} × 1.732 × 0.95)`,
        inverter: hybridInverter.model
      });
    }
  }, [hybridInverter, inverterQuantity, couplingType]);

  // Auto-populate PV Inverter AC cable parameters (AC Coupled System)
  useEffect(() => {
    if (couplingType === 'AC' && pvInverter) {
      const voltage = pvInverter.output_voltage || pvInverter.ac_nom_voltage_v || 400;
      const powerKW = (pvInverter.nominal_ac_power_kw || pvInverter.ac_nom_power_w / 1000 || 0) * inverterQuantity;
      // PV inverters: PF = 1.0 (unity power factor)
      // Formula: I = (P × 1000) / (V × √3 × PF)
      const operatingCurrent = calculateInverterCurrent(powerKW, voltage, 1.0);
      
      // Always update when inverter data changes (store operating current)
      setAcPvCableParams(prev => ({
        ...prev,
        operatingCurrent: Number(operatingCurrent.toFixed(2)), // Store operating current
        operatingVoltage: voltage,
      }));
      
      console.log('🔌 PV Inverter AC Cable Auto-populated:', {
        powerKW,
        voltage,
        powerFactor: 1.0,
        operatingCurrent: operatingCurrent.toFixed(2),
        designCurrent: (operatingCurrent * 1.25).toFixed(2),
        formula: `(${powerKW} × 1000) / (${voltage} × 1.732 × 1.0)`,
        inverter: pvInverter.model || 'Unknown'
      });
    }
  }, [pvInverter, inverterQuantity, couplingType]);

  // Auto-populate Battery Inverter AC cable parameters (AC Coupled System)
  useEffect(() => {
    if (couplingType === 'AC' && batteryInverter) {
      const voltage = batteryInverter.operating_ac_voltage_v || 400;
      const powerKW = (batteryInverter.rated_inverter_ac_capacity_kw || 0) * inverterQuantity;
      // Battery inverters: PF = 0.95
      // Formula: I = (P × 1000) / (V × √3 × PF)
      const operatingCurrent = calculateInverterCurrent(powerKW, voltage, 0.95);
      
      // Always update when inverter data changes (store operating current)
      setAcBattCableParams(prev => ({
        ...prev,
        operatingCurrent: Number(operatingCurrent.toFixed(2)), // Store operating current
        operatingVoltage: voltage,
      }));
      
      console.log('🔌 Battery Inverter AC Cable Auto-populated:', {
        powerKW,
        voltage,
        powerFactor: 0.95,
        operatingCurrent: operatingCurrent.toFixed(2),
        designCurrent: (operatingCurrent * 1.25).toFixed(2),
        formula: `(${powerKW} × 1000) / (${voltage} × 1.732 × 0.95)`,
        inverter: batteryInverter.model
      });
    }
  }, [batteryInverter, inverterQuantity, couplingType]);

  // Send cable parameters to parent component (for BOQ) whenever they change
  useEffect(() => {
    if (onCableParamsChange) {
      const params = {
        dcPv: {
          selectedCableSize: pvCableParams.selectedCableSize,
          cableLength: pvCableParams.cableLength,
          material: pvCableParams.material,
          designCurrent: pvCurrent * 1.25, // 125% of operating current
          numberOfStrings: pvStrings, // For calculating total cable length
          insulation: 'XLPE',
        },
        dcBatt: {
          selectedCableSize: battCableParams.selectedCableSize,
          cableLength: battCableParams.cableLength,
          material: battCableParams.material,
          designCurrent: batteryCurrent * 1.25, // 125% of operating current
          numberOfParallel: 1, // TODO: Get from battery configuration
          insulation: 'XLPE',
        },
        acHybrid: {
          selectedCableSize: acHybridCableParams.selectedCableSize,
          cableLength: acHybridCableParams.cableLength,
          cableRuns: acHybridCableParams.cableRuns,
          material: acHybridCableParams.material,
          operatingCurrent: acHybridCableParams.operatingCurrent,
          designCurrent: acHybridCableParams.operatingCurrent * 1.25,
          insulation: '4-Core XLPE Armoured',
        },
        acPv: {
          selectedCableSize: acPvCableParams.selectedCableSize,
          cableLength: acPvCableParams.cableLength,
          cableRuns: acPvCableParams.cableRuns,
          material: acPvCableParams.material,
          operatingCurrent: acPvCableParams.operatingCurrent,
          designCurrent: acPvCableParams.operatingCurrent * 1.25,
          insulation: '4-Core XLPE Armoured',
        },
        acBatt: {
          selectedCableSize: acBattCableParams.selectedCableSize,
          cableLength: acBattCableParams.cableLength,
          cableRuns: acBattCableParams.cableRuns,
          material: acBattCableParams.material,
          operatingCurrent: acBattCableParams.operatingCurrent,
          designCurrent: acBattCableParams.operatingCurrent * 1.25,
          insulation: '4-Core XLPE Armoured',
        }
      };
      onCableParamsChange(params);
      console.log('📦 Cable parameters sent to BOQ:', params);
    }
  }, [
    pvCableParams.selectedCableSize, pvCableParams.cableLength, pvCableParams.material,
    battCableParams.selectedCableSize, battCableParams.cableLength, battCableParams.material,
    acHybridCableParams.selectedCableSize, acHybridCableParams.cableLength, acHybridCableParams.cableRuns, acHybridCableParams.operatingCurrent,
    acPvCableParams.selectedCableSize, acPvCableParams.cableLength, acPvCableParams.cableRuns, acPvCableParams.operatingCurrent,
    acBattCableParams.selectedCableSize, acBattCableParams.cableLength, acBattCableParams.cableRuns, acBattCableParams.operatingCurrent,
    pvCurrent, batteryCurrent, pvStrings, onCableParamsChange
  ]);

  // Derating factor calculation
  const calculateDeratingFactor = (ambientTemp: number, installationType: string, numberOfCircuits: number, cableArrangement: string) => {
    // Temperature derating factor
    let tempFactor = 1.0;
    if (ambientTemp <= 30) tempFactor = 1.15;
    else if (ambientTemp <= 35) tempFactor = 1.10;
    else if (ambientTemp <= 40) tempFactor = 1.05;
    else if (ambientTemp <= 45) tempFactor = 1.0;
    else if (ambientTemp <= 50) tempFactor = 0.95;
    else if (ambientTemp <= 55) tempFactor = 0.89;
    else if (ambientTemp <= 60) tempFactor = 0.82;
    else if (ambientTemp <= 65) tempFactor = 0.75;
    else if (ambientTemp <= 70) tempFactor = 0.67;
    else tempFactor = 0.60;

    // Grouping factor based on number of circuits
    let groupingFactor = 1.0;
    if (cableArrangement === 'Touching Trefoil') {
      if (numberOfCircuits === 1) groupingFactor = 1.0;
      else if (numberOfCircuits === 2) groupingFactor = 0.85;
      else if (numberOfCircuits === 3) groupingFactor = 0.79;
      else if (numberOfCircuits === 4) groupingFactor = 0.75;
      else if (numberOfCircuits === 5) groupingFactor = 0.73;
      else if (numberOfCircuits === 6) groupingFactor = 0.72;
      else groupingFactor = 0.70;
    } else if (cableArrangement === 'Spaced') {
      groupingFactor = 1.0; // No derating for spaced cables
    }

    // Installation type factor
    let installationFactor = 1.0;
    if (installationType === 'In Air (Tray/Rack)') installationFactor = 1.0;
    else if (installationType === 'Direct Buried') installationFactor = 0.90;
    else if (installationType === 'In Conduit') installationFactor = 0.80;
    else if (installationType === 'In Duct') installationFactor = 0.85;

    const totalFactor = tempFactor * groupingFactor * installationFactor;

    return {
      tempFactor,
      groupingFactor,
      installationFactor,
      totalFactor,
    };
  };

  // Calculate cable sizing for PV
  const pvCableSizing = useMemo(() => {
    if (!pvCurrent || pvCurrent <= 0) return null;

    const operatingCurrent = pvCurrent * pvStrings;
    const designCurrent = operatingCurrent * 1.25; // 125% safety factor
    
    const derating = calculateDeratingFactor(
      pvCableParams.ambientTemp,
      pvCableParams.installationType,
      pvCableParams.numberOfCircuits,
      pvCableParams.cableArrangement
    );

    const requiredAmpacity = designCurrent / derating.totalFactor;

    // Filter cables by material
    const installMethod = pvCableParams.installationType === 'In Air (Tray/Rack)' ? 'Free Air' : 'Direct Buried';
    const suitableCables = dcCables
      .filter(cable => cable.material === pvCableParams.material)
      .map(cable => {
        const baseAmpacity = installMethod === 'Free Air' ? cable.free_air_ampacity_a : cable.direct_buried_ampacity_a;
        const deratedAmpacity = baseAmpacity * derating.totalFactor;
        const voltageDrop = calculateDCVoltageDrop(
          operatingCurrent,
          pvCableParams.cableLength,
          cable.resistance_dc_20c_ohm_per_km,
          pvVoltage
        );
        return {
          ...cable,
          deratedAmpacity,
          voltageDrop: voltageDrop.voltageDrop,
          voltageDropPercent: voltageDrop.voltageDropPercent,
          isSuitable: deratedAmpacity >= requiredAmpacity,
        };
      })
      .sort((a, b) => a.cross_section_mm2 - b.cross_section_mm2);

    const selectedCable = suitableCables.find(c => c.cross_section_mm2 === pvCableParams.selectedCableSize) || suitableCables[0];

    return {
      operatingCurrent,
      designCurrent,
      requiredAmpacity,
      derating,
      suitableCables: suitableCables.slice(0, 6), // Show first 6 options
      selectedCable,
    };
  }, [pvCurrent, pvStrings, pvVoltage, pvCableParams, dcCables]);

  // Calculate cable sizing for Battery
  const battCableSizing = useMemo(() => {
    if (!batteryCurrent || batteryCurrent <= 0) return null;

    const operatingCurrent = batteryCurrent;
    const designCurrent = operatingCurrent * 1.25; // 125% safety factor
    
    const derating = calculateDeratingFactor(
      battCableParams.ambientTemp,
      battCableParams.installationType,
      battCableParams.numberOfCircuits,
      battCableParams.cableArrangement
    );

    const requiredAmpacity = designCurrent / derating.totalFactor;

    // Filter cables by material
    const installMethod = battCableParams.installationType === 'In Air (Tray/Rack)' ? 'Free Air' : 'Direct Buried';
    const suitableCables = dcCables
      .filter(cable => cable.material === battCableParams.material)
      .map(cable => {
        const baseAmpacity = installMethod === 'Free Air' ? cable.free_air_ampacity_a : cable.direct_buried_ampacity_a;
        const deratedAmpacity = baseAmpacity * derating.totalFactor;
        const voltageDrop = calculateDCVoltageDrop(
          operatingCurrent,
          battCableParams.cableLength,
          cable.resistance_dc_20c_ohm_per_km,
          batteryVoltage
        );
        return {
          ...cable,
          deratedAmpacity,
          voltageDrop: voltageDrop.voltageDrop,
          voltageDropPercent: voltageDrop.voltageDropPercent,
          isSuitable: deratedAmpacity >= requiredAmpacity,
        };
      })
      .sort((a, b) => a.cross_section_mm2 - b.cross_section_mm2);

    const selectedCable = suitableCables.find(c => c.cross_section_mm2 === battCableParams.selectedCableSize) || suitableCables[0];

    // Smart cable selection: Show 6 cables centered around selected cable
    // Logic: Try to show 2 lower + selected + 3 higher, but adjust based on position
    const selectedIndex = suitableCables.findIndex(c => c.cross_section_mm2 === battCableParams.selectedCableSize);
    let displayCables: typeof suitableCables = [];
    
    if (suitableCables.length <= 6) {
      // If we have 6 or fewer cables, show all
      displayCables = suitableCables;
    } else if (selectedIndex === -1) {
      // If selected cable not found, show first 6
      displayCables = suitableCables.slice(0, 6);
    } else if (selectedIndex === 0) {
      // Selected is lowest: show selected + 5 higher
      displayCables = suitableCables.slice(0, 6);
    } else if (selectedIndex === 1) {
      // Selected is 2nd lowest: show 1 lower + selected + 4 higher
      displayCables = suitableCables.slice(0, 6);
    } else if (selectedIndex === suitableCables.length - 1) {
      // Selected is highest: show 5 lower + selected
      displayCables = suitableCables.slice(-6);
    } else if (selectedIndex === suitableCables.length - 2) {
      // Selected is 2nd highest: show 4 lower + selected + 1 higher
      displayCables = suitableCables.slice(-6);
    } else {
      // Selected is in middle: show 2 lower + selected + 3 higher
      const startIndex = Math.max(0, selectedIndex - 2);
      const endIndex = Math.min(suitableCables.length, startIndex + 6);
      displayCables = suitableCables.slice(startIndex, endIndex);
    }

    return {
      operatingCurrent,
      designCurrent,
      requiredAmpacity,
      derating,
      suitableCables: displayCables,
      selectedCable,
    };
  }, [batteryCurrent, batteryVoltage, battCableParams, dcCables]);

  // Get unique DC cable sizes for dropdown - MUST be before conditional return
  const availableCableSizes = useMemo(() => {
    const sizes = Array.from(new Set(dcCables.map(c => c.cross_section_mm2))).sort((a, b) => a - b);
    return sizes;
  }, [dcCables]);

  // Get unique LV cable sizes for AC dropdown
  const availableLVCableSizes = useMemo(() => {
    const sizes = Array.from(new Set(lvCables.map(c => c.cross_section_mm2))).sort((a, b) => a - b);
    return sizes;
  }, [lvCables]);

  // AC cable sizing calculation helper - K-Factor based
  const calculateACVoltageDrop = (
    current: number,
    length: number,
    cableSize: number,
    voltage: number = 400,
    powerFactor: number = 0.8
  ) => {
    // 3-phase voltage drop formula: V_drop = √3 × I × (R × cos(φ) + X × sin(φ)) × L
    // Simplified for resistive: V_drop ≈ √3 × I × R × L
    const resistivity = 0.0175; // Ohm·mm²/m for copper at 20°C
    const resistance = (resistivity * length) / cableSize; // Ohm per phase
    const voltageDrop = Math.sqrt(3) * current * resistance;
    const voltageDropPercent = (voltageDrop / voltage) * 100;
    
    // Power loss = 3 × I² × R
    const powerLossW = 3 * current * current * resistance;
    const powerLossKW = powerLossW / 1000;
    
    return {
      voltageDrop: Number(voltageDrop.toFixed(2)),
      voltageDropPercent: Number(voltageDropPercent.toFixed(2)),
      powerLossKW: Number(powerLossKW.toFixed(3))
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-blue-300">Loading cable data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* DC Cable Sizing Section */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-amber-300 bg-clip-text text-transparent flex items-center gap-3">
          <Sun className="h-7 w-7 text-yellow-400" />
          DC Cable Sizing
        </h3>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN: PV Array to Inverter */}
          <Card className="border border-yellow-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-yellow-500/20 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-yellow-300 to-amber-300 bg-clip-text text-transparent flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    DC String Cable Sizing
                  </CardTitle>
                  <CardDescription className="text-yellow-200/60 mt-1">
                    PV Array → {couplingType === 'DC' ? 'Hybrid Inverter' : 'String Inverter'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {pvVoltage > 0 && pvCurrent > 0 ? (
              <>
                {/* Installation Conditions */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-base font-semibold text-yellow-200">Installation Conditions</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-800/60 rounded-lg border border-yellow-500/30">
                    <div>
                      <Label className="text-xs text-yellow-200/80 mb-2">Ambient Temperature (°C)</Label>
                      <Input
                        type="number"
                        value={pvCableParams.ambientTemp}
                        onChange={(e) => setPvCableParams({...pvCableParams, ambientTemp: parseFloat(e.target.value) || 50})}
                        className="bg-slate-700/80 border-yellow-500/60 text-yellow-100"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs text-yellow-200/80 mb-2">Installation Type</Label>
                      <select
                        value={pvCableParams.installationType}
                        onChange={(e) => setPvCableParams({...pvCableParams, installationType: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-700/80 border border-yellow-500/60 rounded-md text-white text-sm"
                        style={{ backgroundColor: '#1e293b' }}
                      >
                        <option value="In Air (Tray/Rack)" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>In Air (Tray/Rack)</option>
                        <option value="Direct Buried" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Direct Buried</option>
                        <option value="In Conduit" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>In Conduit</option>
                        <option value="In Duct" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>In Duct</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-yellow-200/80 mb-2">Number of Cable Circuits</Label>
                      <Input
                        type="number"
                        min="1"
                        value={pvCableParams.numberOfCircuits}
                        onChange={(e) => setPvCableParams({...pvCableParams, numberOfCircuits: parseInt(e.target.value) || 1})}
                        className="bg-slate-700/80 border-yellow-500/60 text-yellow-100"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs text-yellow-200/80 mb-2">Cable Arrangement</Label>
                      <select
                        value={pvCableParams.cableArrangement}
                        onChange={(e) => setPvCableParams({...pvCableParams, cableArrangement: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-700/80 border border-yellow-500/60 rounded-md text-white text-sm"
                        style={{ backgroundColor: '#1e293b' }}
                      >
                        <option value="Touching Trefoil" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Touching Trefoil</option>
                        <option value="Spaced" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Spaced</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Cable Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-5 w-5 text-blue-400" />
                    <h4 className="text-base font-semibold text-blue-200">Cable Selection</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-800/60 rounded-lg border border-blue-500/30">
                    <div>
                      <Label className="text-xs text-blue-200/80 mb-2">Conductor Material</Label>
                      <select
                        value={pvCableParams.material}
                        onChange={(e) => setPvCableParams({...pvCableParams, material: e.target.value as 'Copper' | 'Aluminum'})}
                        className="w-full px-3 py-2 bg-slate-700/80 border border-blue-500/60 rounded-md text-white text-sm"
                        style={{ backgroundColor: '#1e293b' }}
                      >
                        <option value="Copper" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Copper</option>
                        <option value="Aluminum" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Aluminum</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-blue-200/80 mb-2">Cable Length (m)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={pvCableParams.cableLength}
                        onChange={(e) => setPvCableParams({...pvCableParams, cableLength: parseFloat(e.target.value) || 50})}
                        className="bg-slate-700/80 border-blue-500/60 text-blue-100"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs text-blue-200/80 mb-2">Cross Section (mm²)</Label>
                      <select
                        value={pvCableParams.selectedCableSize}
                        onChange={(e) => setPvCableParams({...pvCableParams, selectedCableSize: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 bg-slate-700/80 border border-blue-500/60 rounded-md text-white text-sm"
                        style={{ backgroundColor: '#1e293b' }}
                      >
                        {availableCableSizes.map(size => (
                          <option key={size} value={size} style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
                            {size} mm²
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => setPvCableParams({...pvCableParams, showDerating: !pvCableParams.showDerating})}
                    variant="ghost"
                    className="text-blue-300 hover:text-blue-200 flex items-center gap-2"
                  >
                    {pvCableParams.showDerating ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {pvCableParams.showDerating ? 'Hide' : 'Show'} Derating Factors
                  </Button>
                </div>

                {/* Derating Factors */}
                {pvCableParams.showDerating && pvCableSizing && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30">
                    <div className="p-3 bg-slate-800/60 rounded-lg">
                      <p className="text-xs text-orange-300 font-semibold mb-1">Temperature</p>
                      <p className="text-2xl font-bold text-orange-200">{pvCableSizing.derating.tempFactor.toFixed(3)}</p>
                      <p className="text-xs text-orange-300/70 mt-1">@ {pvCableParams.ambientTemp}°C</p>
                    </div>
                    <div className="p-3 bg-slate-800/60 rounded-lg">
                      <p className="text-xs text-blue-300 font-semibold mb-1">Grouping</p>
                      <p className="text-2xl font-bold text-blue-200">{pvCableSizing.derating.groupingFactor.toFixed(3)}</p>
                      <p className="text-xs text-blue-300/70 mt-1">{pvCableParams.numberOfCircuits} circuits - {pvCableParams.cableArrangement}</p>
                    </div>
                    <div className="p-3 bg-slate-800/60 rounded-lg">
                      <p className="text-xs text-purple-300 font-semibold mb-1">Installation</p>
                      <p className="text-2xl font-bold text-purple-200">{pvCableSizing.derating.installationFactor.toFixed(3)}</p>
                      <p className="text-xs text-purple-300/70 mt-1">{pvCableParams.installationType}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-emerald-900/40 to-cyan-900/40 rounded-lg border border-emerald-500/40">
                      <p className="text-xs text-emerald-300 font-semibold mb-1">Total Factor</p>
                      <p className="text-2xl font-bold text-emerald-200">{pvCableSizing.derating.totalFactor.toFixed(3)}</p>
                      <p className="text-xs text-emerald-300/70 mt-1">Combined</p>
                    </div>
                  </div>
                )}

                {/* Calculate Button and Results */}
                {pvCableSizing && (
                  <>
                    <Button
                      onClick={() => setPvCableParams({...pvCableParams, showResults: !pvCableParams.showResults})}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3"
                    >
                      {pvCableParams.showResults ? 'Hide' : 'Calculate'} Cable Sizing Results
                    </Button>

                    {pvCableParams.showResults && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-lg border border-blue-500/40">
                            <p className="text-sm text-blue-300 font-semibold mb-2">String Current</p>
                            <p className="text-3xl font-bold text-blue-200">{pvCableSizing.operatingCurrent.toFixed(1)} A</p>
                            <p className="text-xs text-blue-300/70 mt-1">Operating current</p>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-orange-900/30 to-amber-900/30 rounded-lg border border-orange-500/40">
                            <p className="text-sm text-orange-300 font-semibold mb-2">Design Current</p>
                            <p className="text-3xl font-bold text-orange-200">{pvCableSizing.designCurrent.toFixed(1)} A</p>
                            <p className="text-xs text-orange-300/70 mt-1">125% safety factor</p>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/40">
                            <p className="text-sm text-purple-300 font-semibold mb-2">Required Ampacity</p>
                            <p className="text-3xl font-bold text-purple-200">{pvCableSizing.requiredAmpacity.toFixed(1)} A</p>
                            <p className="text-xs text-purple-300/70 mt-1">After derating</p>
                          </div>
                        </div>

                        {/* Suitable Cable Sizes */}
                        <div className="space-y-3">
                          <h5 className="text-sm font-semibold text-gray-300">Suitable Cable Sizes</h5>
                          <div className="grid grid-cols-3 gap-3">
                            {pvCableSizing.suitableCables.map((cable) => (
                              <div
                                key={cable.id}
                                onClick={() => setPvCableParams({...pvCableParams, selectedCableSize: cable.cross_section_mm2})}
                                className={`p-3 rounded-lg cursor-pointer transition-all ${
                                  cable.cross_section_mm2 === pvCableParams.selectedCableSize
                                    ? 'bg-blue-600/40 border-2 border-blue-400'
                                    : 'bg-slate-800/60 border border-slate-600 hover:border-blue-500/50'
                                }`}
                              >
                                <p className="text-lg font-bold text-blue-200">{cable.cross_section_mm2} mm²</p>
                                <p className="text-xs text-gray-400 mb-2">{cable.material}</p>
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-300">Base: {cable.free_air_ampacity_a}A</p>
                                  <p className="text-xs font-semibold text-cyan-300">Derated: {cable.deratedAmpacity.toFixed(0)}A</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Voltage Drop Analysis */}
                        {pvCableSizing.selectedCable && (
                          <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-cyan-500/40">
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="text-sm font-semibold text-cyan-200 flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Voltage Drop Analysis - {pvCableSizing.selectedCable.cross_section_mm2} mm² {pvCableSizing.selectedCable.material}
                              </h5>
                              {pvCableSizing.selectedCable.voltageDropPercent <= 2 ? (
                                <div className="flex items-center gap-2 text-green-400">
                                  <CheckCircle className="h-5 w-5" />
                                  <span className="text-sm font-semibold">Acceptable</span>
                                </div>
                              ) : pvCableSizing.selectedCable.voltageDropPercent <= 3 ? (
                                <div className="flex items-center gap-2 text-yellow-400">
                                  <AlertTriangle className="h-5 w-5" />
                                  <span className="text-sm font-semibold">Marginal</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-red-400">
                                  <AlertTriangle className="h-5 w-5" />
                                  <span className="text-sm font-semibold">Excessive</span>
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="p-3 bg-slate-700/60 rounded-lg">
                                <p className="text-xs text-blue-300 mb-1">Voltage Drop</p>
                                <p className="text-2xl font-bold text-blue-200">{pvCableSizing.selectedCable.voltageDrop.toFixed(2)} V</p>
                              </div>
                              <div className="p-3 bg-slate-700/60 rounded-lg">
                                <p className="text-xs text-cyan-300 mb-1">Percentage</p>
                                <p className="text-2xl font-bold text-cyan-200">{pvCableSizing.selectedCable.voltageDropPercent.toFixed(2)}%</p>
                              </div>
                              <div className="p-3 bg-slate-700/60 rounded-lg">
                                <p className="text-xs text-emerald-300 mb-1">System Voltage</p>
                                <p className="text-2xl font-bold text-emerald-200">{pvVoltage.toFixed(1)} V</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-yellow-200/60">
                <p>Please configure PV system in the PV Sizing tab first.</p>
                <p className="text-sm mt-2">PV voltage and current are required for cable sizing.</p>
              </div>
            )}
          </CardContent>
        </Card>

          {/* RIGHT COLUMN: Battery Pack to Inverter */}
          <Card className="border border-purple-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-purple-500/20 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent flex items-center gap-2">
                    <Battery className="h-5 w-5 text-purple-400" />
                    Battery DC Cable Sizing
                  </CardTitle>
                  <CardDescription className="text-purple-200/60 mt-1">
                    Battery Pack → {couplingType === 'DC' ? 'Hybrid Inverter' : 'Battery Inverter'} DC Input
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {batteryVoltage > 0 && batteryCurrent > 0 ? (
                <>
                  {/* Installation Conditions */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="text-base font-semibold text-purple-200">Installation Conditions</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-800/60 rounded-lg border border-purple-500/30">
                      <div>
                        <Label className="text-xs text-purple-200/80 mb-2">Ambient Temperature (°C)</Label>
                        <Input
                          type="number"
                          value={battCableParams.ambientTemp}
                          onChange={(e) => setBattCableParams({...battCableParams, ambientTemp: parseFloat(e.target.value) || 50})}
                          className="bg-slate-700/80 border-purple-500/60 text-purple-100"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs text-purple-200/80 mb-2">Installation Type</Label>
                        <select
                          value={battCableParams.installationType}
                          onChange={(e) => setBattCableParams({...battCableParams, installationType: e.target.value})}
                          className="w-full px-3 py-2 bg-slate-700/80 border border-purple-500/60 rounded-md text-white text-sm"
                          style={{ backgroundColor: '#1e293b' }}
                        >
                          <option value="In Air (Tray/Rack)" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>In Air (Tray/Rack)</option>
                          <option value="Direct Buried" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Direct Buried</option>
                          <option value="In Conduit" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>In Conduit</option>
                          <option value="In Duct" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>In Duct</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-purple-200/80 mb-2">Number of Cable Circuits</Label>
                        <Input
                          type="number"
                          min="1"
                          value={battCableParams.numberOfCircuits}
                          onChange={(e) => setBattCableParams({...battCableParams, numberOfCircuits: parseInt(e.target.value) || 1})}
                          className="bg-slate-700/80 border-purple-500/60 text-purple-100"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs text-purple-200/80 mb-2">Cable Arrangement</Label>
                        <select
                          value={battCableParams.cableArrangement}
                          onChange={(e) => setBattCableParams({...battCableParams, cableArrangement: e.target.value})}
                          className="w-full px-3 py-2 bg-slate-700/80 border border-purple-500/60 rounded-md text-white text-sm"
                          style={{ backgroundColor: '#1e293b' }}
                        >
                          <option value="Touching Trefoil" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Touching Trefoil</option>
                          <option value="Spaced" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Spaced</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Cable Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-5 w-5 text-pink-400" />
                      <h4 className="text-base font-semibold text-pink-200">Cable Selection</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-800/60 rounded-lg border border-pink-500/30">
                      <div>
                        <Label className="text-xs text-pink-200/80 mb-2">Conductor Material</Label>
                        <select
                          value={battCableParams.material}
                          onChange={(e) => setBattCableParams({...battCableParams, material: e.target.value as 'Copper' | 'Aluminum'})}
                          className="w-full px-3 py-2 bg-slate-700/80 border border-pink-500/60 rounded-md text-white text-sm"
                          style={{ backgroundColor: '#1e293b' }}
                        >
                          <option value="Copper" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Copper</option>
                          <option value="Aluminum" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Aluminum</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-pink-200/80 mb-2">Cable Length (m)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={battCableParams.cableLength}
                          onChange={(e) => setBattCableParams({...battCableParams, cableLength: parseFloat(e.target.value) || 50})}
                          className="bg-slate-700/80 border-pink-500/60 text-pink-100"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs text-pink-200/80 mb-2">Cross Section (mm²)</Label>
                        <select
                          value={battCableParams.selectedCableSize}
                          onChange={(e) => setBattCableParams({...battCableParams, selectedCableSize: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 bg-slate-700/80 border border-pink-500/60 rounded-md text-white text-sm"
                          style={{ backgroundColor: '#1e293b' }}
                        >
                          {availableCableSizes.map(size => (
                            <option key={size} value={size} style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
                              {size} mm²
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => setBattCableParams({...battCableParams, showDerating: !battCableParams.showDerating})}
                      variant="ghost"
                      className="text-pink-300 hover:text-pink-200 flex items-center gap-2"
                    >
                      {battCableParams.showDerating ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {battCableParams.showDerating ? 'Hide' : 'Show'} Derating Factors
                    </Button>
                  </div>

                  {/* Derating Factors */}
                  {battCableParams.showDerating && battCableSizing && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-500/30">
                      <div className="p-3 bg-slate-800/60 rounded-lg">
                        <p className="text-xs text-orange-300 font-semibold mb-1">Temperature</p>
                        <p className="text-2xl font-bold text-orange-200">{battCableSizing.derating.tempFactor.toFixed(3)}</p>
                        <p className="text-xs text-orange-300/70 mt-1">@ {battCableParams.ambientTemp}°C</p>
                      </div>
                      <div className="p-3 bg-slate-800/60 rounded-lg">
                        <p className="text-xs text-blue-300 font-semibold mb-1">Grouping</p>
                        <p className="text-2xl font-bold text-blue-200">{battCableSizing.derating.groupingFactor.toFixed(3)}</p>
                        <p className="text-xs text-blue-300/70 mt-1">{battCableParams.numberOfCircuits} circuits - {battCableParams.cableArrangement}</p>
                      </div>
                      <div className="p-3 bg-slate-800/60 rounded-lg">
                        <p className="text-xs text-purple-300 font-semibold mb-1">Installation</p>
                        <p className="text-2xl font-bold text-purple-200">{battCableSizing.derating.installationFactor.toFixed(3)}</p>
                        <p className="text-xs text-purple-300/70 mt-1">{battCableParams.installationType}</p>
                      </div>
                      <div className="p-3 bg-slate-800/60 rounded-lg">
                        <p className="text-xs text-pink-300 font-semibold mb-1">Combined</p>
                        <p className="text-2xl font-bold text-pink-200">{battCableSizing.derating.totalFactor.toFixed(3)}</p>
                        <p className="text-xs text-pink-300/70 mt-1">Total Factor</p>
                      </div>
                    </div>
                  )}

                  {/* Calculate Button and Results */}
                  {battCableSizing && (
                    <Button
                      onClick={() => setBattCableParams({...battCableParams, showResults: !battCableParams.showResults})}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3"
                    >
                      {battCableParams.showResults ? 'Hide' : 'Calculate'} Cable Sizing Results
                    </Button>
                  )}

                  {battCableParams.showResults && battCableSizing && (
                    <div className="space-y-4">
                      {/* Current and Ampacity Summary */}
                      <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg border border-purple-500/40">
                        <div className="p-3 bg-purple-900/30 rounded-lg">
                          <p className="text-xs text-purple-300 mb-1">Operating Current</p>
                          <p className="text-2xl font-bold text-purple-200">{battCableSizing.operatingCurrent.toFixed(1)} A</p>
                        </div>
                        <div className="p-3 bg-pink-900/30 rounded-lg">
                          <p className="text-xs text-pink-300 mb-1">Design Current</p>
                          <p className="text-2xl font-bold text-pink-200">{battCableSizing.designCurrent.toFixed(1)} A</p>
                          <p className="text-xs text-pink-300/70 mt-1">125% safety</p>
                        </div>
                        <div className="p-3 bg-blue-900/30 rounded-lg">
                          <p className="text-xs text-blue-300 mb-1">Required Ampacity</p>
                          <p className="text-2xl font-bold text-blue-200">{battCableSizing.requiredAmpacity.toFixed(1)} A</p>
                          <p className="text-xs text-blue-300/70 mt-1">After derating</p>
                        </div>
                      </div>

                      {/* Suitable Cable Sizes */}
                      <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-pink-500/40">
                        <h5 className="text-sm font-semibold text-pink-200 mb-3">Suitable Cable Sizes</h5>
                        <div className="grid grid-cols-3 gap-3">
                          {battCableSizing.suitableCables.map((cable) => (
                            <div
                              key={cable.id}
                              onClick={() => setBattCableParams({...battCableParams, selectedCableSize: cable.cross_section_mm2})}
                              className={`p-3 rounded-lg cursor-pointer transition-all ${
                                cable.cross_section_mm2 === battCableParams.selectedCableSize
                                  ? 'bg-pink-600/40 border-2 border-pink-400'
                                  : 'bg-slate-800/60 border border-slate-600 hover:border-pink-500/50'
                              }`}
                            >
                              <p className="text-lg font-bold text-pink-200">{cable.cross_section_mm2} mm²</p>
                              <p className="text-xs text-gray-400 mb-2">{cable.material}</p>
                              <div className="space-y-1">
                                <p className="text-xs text-gray-300">Base: {cable.free_air_ampacity_a}A</p>
                                <p className="text-xs font-semibold text-cyan-300">Derated: {cable.deratedAmpacity.toFixed(0)}A</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Voltage Drop Analysis */}
                      {battCableSizing.selectedCable && (
                        <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-cyan-500/40">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="text-sm font-semibold text-cyan-200 flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Voltage Drop Analysis - {battCableSizing.selectedCable.cross_section_mm2} mm² {battCableSizing.selectedCable.material}
                            </h5>
                            {battCableSizing.selectedCable.voltageDropPercent <= 2 ? (
                              <div className="flex items-center gap-2 text-green-400">
                                <CheckCircle className="h-5 w-5" />
                                <span className="text-sm font-semibold">Acceptable</span>
                              </div>
                            ) : battCableSizing.selectedCable.voltageDropPercent <= 3 ? (
                              <div className="flex items-center gap-2 text-yellow-400">
                                <AlertTriangle className="h-5 w-5" />
                                <span className="text-sm font-semibold">Marginal</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-red-400">
                                <AlertTriangle className="h-5 w-5" />
                                <span className="text-sm font-semibold">Excessive</span>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 bg-slate-700/60 rounded-lg">
                              <p className="text-xs text-blue-300 mb-1">Voltage Drop</p>
                              <p className="text-2xl font-bold text-blue-200">{battCableSizing.selectedCable.voltageDrop.toFixed(2)} V</p>
                            </div>
                            <div className="p-3 bg-slate-700/60 rounded-lg">
                              <p className="text-xs text-cyan-300 mb-1">Percentage</p>
                              <p className="text-2xl font-bold text-cyan-200">{battCableSizing.selectedCable.voltageDropPercent.toFixed(2)}%</p>
                            </div>
                            <div className="p-3 bg-slate-700/60 rounded-lg">
                              <p className="text-xs text-emerald-300 mb-1">Battery Voltage</p>
                              <p className="text-2xl font-bold text-emerald-200">{batteryVoltage.toFixed(1)} V</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-purple-200/60">
                  <p>Please configure battery system in the BESS Configuration tab first.</p>
                  <p className="text-sm mt-2">Battery voltage and current are required for cable sizing.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AC Cable Sizing Section */}
      <div className="space-y-6 mt-8">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent flex items-center gap-3">
          <Zap className="h-7 w-7 text-emerald-400" />
          AC Cable Sizing
        </h3>

        {couplingType === 'DC' ? (
          /* DC Coupled: Single Full-Width Section - Hybrid Inverter to Main LV Panel */
          <Card className="border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-emerald-500/20 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent flex items-center gap-2">
                    <Zap className="h-5 w-5 text-emerald-400" />
                    Inverter to AC Combiner Panel
                  </CardTitle>
                  <CardDescription className="text-emerald-200/60 mt-1">
                    Hybrid Inverter → Main LV Panel
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-emerald-900/20 rounded-lg border border-emerald-500/30">
                <div>
                  <Label className="text-xs text-emerald-200/80 mb-2">Operating Current (A)</Label>
                  <Input
                    type="number"
                    value={acHybridCableParams.operatingCurrent || 0}
                    onChange={(e) => setAcHybridCableParams({...acHybridCableParams, operatingCurrent: parseFloat(e.target.value) || 0})}
                    className="bg-slate-700/80 border-emerald-500/60 text-emerald-100"
                  />
                </div>
                <div>
                  <Label className="text-xs text-emerald-200/80 mb-2">Operating Voltage (V)</Label>
                  <Input
                    type="number"
                    value={acHybridCableParams.operatingVoltage}
                    onChange={(e) => setAcHybridCableParams({...acHybridCableParams, operatingVoltage: parseFloat(e.target.value) || 400})}
                    className="bg-slate-700/80 border-emerald-500/60 text-emerald-100"
                  />
                </div>
                <div>
                  <Label className="text-xs text-emerald-200/80 mb-2">Average Cable Length (m)</Label>
                  <Input
                    type="number"
                    value={acHybridCableParams.cableLength}
                    onChange={(e) => setAcHybridCableParams({...acHybridCableParams, cableLength: parseFloat(e.target.value) || 10})}
                    className="bg-slate-700/80 border-emerald-500/60 text-emerald-100"
                  />
                </div>
                <div>
                  <Label className="text-xs text-emerald-200/80 mb-2">Cable Material</Label>
                  <select
                    value={acHybridCableParams.material}
                    onChange={(e) => setAcHybridCableParams({...acHybridCableParams, material: e.target.value as 'COPPER' | 'ALUMINUM'})}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-emerald-500/60 rounded-md text-white text-sm"
                    style={{ backgroundColor: '#1e293b' }}
                  >
                    <option value="Copper" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Copper (Cu)</option>
                    <option value="Aluminum" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Aluminum (Al)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/60 rounded-lg border border-emerald-500/30">
                <div>
                  <Label className="text-xs text-emerald-200/80 mb-2">Cable Cross Section (mm² Stranded)</Label>
                  <select
                    value={acHybridCableParams.selectedCableSize}
                    onChange={(e) => setAcHybridCableParams({...acHybridCableParams, selectedCableSize: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-emerald-500/60 rounded-md text-white text-sm"
                    style={{ backgroundColor: '#1e293b' }}
                  >
                    {availableLVCableSizes.map(size => (
                      <option key={size} value={size} style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
                        {size} mm² (Stranded)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-emerald-200/80 mb-2">Number of Cable Runs</Label>
                  <Input
                    type="number"
                    min="1"
                    value={acHybridCableParams.cableRuns}
                    onChange={(e) => setAcHybridCableParams({...acHybridCableParams, cableRuns: parseInt(e.target.value) || 3})}
                    className="bg-slate-700/80 border-emerald-500/60 text-emerald-100"
                  />
                </div>
              </div>

              {(() => {
                const operatingCurrent = acHybridCableParams.operatingCurrent || 0;
                const designCurrent = operatingCurrent * 1.25; // Calculate design current from operating current
                const kFactor = 0.718;
                const requiredAmpacity = designCurrent / kFactor;
                
                const { voltageDrop, voltageDropPercent, powerLossKW } = calculateACVoltageDrop(
                  designCurrent / acHybridCableParams.cableRuns,
                  acHybridCableParams.cableLength,
                  acHybridCableParams.selectedCableSize,
                  acHybridCableParams.operatingVoltage
                );

                const deratedCurrent = designCurrent * kFactor;
                const isAdequate = voltageDropPercent <= 3;

                return (
                  <div className="space-y-4">
                    {/* Current and Ampacity Summary */}
                    <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg border border-emerald-500/40">
                      <div className="p-3 bg-emerald-900/30 rounded-lg" title="The actual continuous operating current of the inverter at rated power">
                        <p className="text-xs text-emerald-300 mb-1">Operating Current ⓘ</p>
                        <p className="text-2xl font-bold text-emerald-200">{operatingCurrent.toFixed(1)} A</p>
                        <p className="text-xs text-emerald-300/60 mt-1">Actual load current</p>
                      </div>
                      <div className="p-3 bg-teal-900/30 rounded-lg" title="Operating current × 1.25 safety factor as per electrical standards">
                        <p className="text-xs text-teal-300 mb-1">Design Current</p>
                        <p className="text-2xl font-bold text-teal-200">{designCurrent.toFixed(1)} A</p>
                        <p className="text-xs text-teal-300/70 mt-1">125% safety</p>
                      </div>
                      <div className="p-3 bg-cyan-900/30 rounded-lg" title="Design current ÷ K-factor (0.718) to account for derating factors">
                        <p className="text-xs text-cyan-300 mb-1">Required Ampacity ⓘ</p>
                        <p className="text-2xl font-bold text-cyan-200">{requiredAmpacity.toFixed(1)} A</p>
                        <p className="text-xs text-cyan-300/70 mt-1">After derating</p>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-lg border border-emerald-500/40">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-semibold text-emerald-200">Cable Sizing Results</h5>
                        {isAdequate ? (
                          <div className="flex items-center gap-2 text-green-400">
                            <CheckCircle className="h-5 w-5" />
                            <span className="text-sm font-semibold">✓ Selected cable is adequate for this design</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-400">
                            <AlertTriangle className="h-5 w-5" />
                            <span className="text-sm font-semibold">⚠ Voltage drop excessive</span>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 bg-slate-700/60 rounded-lg" title="K-Factor (0.718) × Design Current - represents the cable's effective current after applying derating factors">
                          <p className="text-xs text-emerald-300 mb-1">K-Factor Adjusted ⓘ</p>
                          <p className="text-2xl font-bold text-emerald-200">{deratedCurrent.toFixed(1)} A</p>
                          <p className="text-xs text-emerald-300/60 mt-1">Design × 0.718</p>
                        </div>
                        <div className="p-3 bg-slate-700/60 rounded-lg">
                          <p className="text-xs text-cyan-300 mb-1">Voltage Drop</p>
                          <p className="text-2xl font-bold text-cyan-200">{voltageDropPercent.toFixed(2)}%</p>
                        </div>
                        <div className="p-3 bg-slate-700/60 rounded-lg">
                          <p className="text-xs text-teal-300 mb-1">Power Loss</p>
                          <p className="text-2xl font-bold text-teal-200">{powerLossKW.toFixed(2)} kW</p>
                        </div>
                        <div className="p-3 bg-slate-700/60 rounded-lg">
                          <p className="text-xs text-blue-300 mb-1">Loss %</p>
                          <p className="text-2xl font-bold text-blue-200">{((powerLossKW / (designCurrent * acHybridCableParams.operatingVoltage * Math.sqrt(3) / 1000)) * 100).toFixed(2)}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-800/60 rounded-lg border border-emerald-500/30">
                      <h5 className="text-sm font-semibold text-emerald-200 mb-3">Selected Cable Summary</h5>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div><span className="text-emerald-300/70">Cross Section:</span> <span className="text-emerald-100 font-semibold">{acHybridCableParams.selectedCableSize} mm²</span></div>
                        <div><span className="text-emerald-300/70">Length:</span> <span className="text-emerald-100 font-semibold">{acHybridCableParams.cableLength} m</span></div>
                        <div><span className="text-emerald-300/70">Material:</span> <span className="text-emerald-100 font-semibold">{acHybridCableParams.material}</span></div>
                        <div><span className="text-emerald-300/70">Cable Runs:</span> <span className="text-emerald-100 font-semibold">{acHybridCableParams.cableRuns}</span></div>
                        <div><span className="text-emerald-300/70">Insulation:</span> <span className="text-emerald-100 font-semibold">XLPE</span></div>
                        <div><span className="text-emerald-300/70">K-Factor:</span> <span className="text-emerald-100 font-semibold">0.718</span></div>
                      </div>
                    </div>

                    {/* K-Factor Derating Details - Collapsible */}
                    <div className="border border-emerald-500/30 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setShowHybridKFactor(!showHybridKFactor)}
                        className="w-full p-3 bg-slate-800/60 hover:bg-slate-800/80 transition-colors flex items-center justify-between"
                      >
                        <span className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
                          Installation Conditions & K-Factor Derating
                          <span className="text-xs px-2 py-0.5 bg-emerald-500/20 rounded text-emerald-300">K-Factor: 0.718</span>
                        </span>
                        <ChevronDown className={`h-4 w-4 text-emerald-300 transition-transform ${showHybridKFactor ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showHybridKFactor && (
                        <div className="p-4 bg-slate-900/40 space-y-4 text-sm">
                          {/* Installation Conditions */}
                          <div>
                            <h6 className="font-semibold text-emerald-200 mb-2">Installation Conditions:</h6>
                            <ul className="space-y-1 text-emerald-100/80">
                              <li>• Underground installation at 0.7m depth</li>
                              <li>• Ground temperature: 40°C</li>
                              <li>• Soil thermal resistivity: 1.5 K·m/W</li>
                              <li>• Trefoil spacing: 30cm</li>
                              <li>• Cable type: 4 core XLPE</li>
                              <li>• Air temperature: 50°C</li>
                              <li>• Trench width: 1m</li>
                            </ul>
                          </div>

                          {/* K-Factor Based Derating */}
                          <div>
                            <h6 className="font-semibold text-emerald-200 mb-2">K-Factor Based Derating:</h6>
                            <ul className="space-y-1 text-emerald-100/80">
                              <li>• <span className="text-emerald-300">K1</span> (Depth factor): 1.000 - 0.7m burial depth</li>
                              <li>• <span className="text-emerald-300">K2</span> (Temperature factor): 0.845 - 40°C soil temp</li>
                              <li>• <span className="text-emerald-300">K3</span> (Resistivity factor): 1.000 - 1.5 K·m/W soil resistivity</li>
                              <li>• <span className="text-emerald-300">K4</span> (Grouping factor): 0.850 - Trefoil formation</li>
                            </ul>
                            <p className="mt-2 font-semibold text-emerald-300">
                              • Total K-factor: K1×K2×K3×K4 = 0.718
                            </p>
                          </div>

                          {/* Traditional Fixed Factors for Comparison */}
                          <div className="pt-3 border-t border-emerald-500/20">
                            <h6 className="font-semibold text-blue-300 mb-2">Traditional Fixed Factors (for comparison):</h6>
                            <ul className="space-y-1 text-blue-200/80">
                              <li>• Ground temperature factor: 0.88</li>
                              <li>• Grouping factor: 0.85</li>
                              <li>• Burial depth factor: 0.95</li>
                            </ul>
                            <p className="mt-2 font-semibold text-blue-300">
                              • Traditional derating factor: 0.711
                            </p>
                          </div>

                          {/* Note */}
                          <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded">
                            <p className="text-xs text-yellow-200">
                              <span className="font-semibold">Note:</span> The K-factor method (K1×K2×K3×K4) properly considers depth, soil temperature, thermal resistivity (1.5 K·m/W), and cable grouping effects.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        ) : (
          /* AC Coupled: Two Equal Columns - PV Inverter and Battery Inverter to Main LV Panel */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN: PV Inverter to Main LV Panel */}
            <Card className="border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-xl">
              <CardHeader className="border-b border-emerald-500/20 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent flex items-center gap-2">
                      <Sun className="h-5 w-5 text-emerald-400" />
                      PV Inverter AC Cable
                    </CardTitle>
                    <CardDescription className="text-emerald-200/60 mt-1">
                      PV Inverter → Main LV Panel
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-emerald-900/20 rounded-lg border border-emerald-500/30">
                  <div>
                    <Label className="text-xs text-emerald-200/80 mb-1">Operating Current (A)</Label>
                    <Input
                      type="number"
                      value={acPvCableParams.operatingCurrent || 0}
                      onChange={(e) => setAcPvCableParams({...acPvCableParams, operatingCurrent: parseFloat(e.target.value) || 0})}
                      className="bg-slate-700/80 border-emerald-500/60 text-emerald-100 h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-emerald-200/80 mb-1">Voltage (V)</Label>
                    <Input
                      type="number"
                      value={acPvCableParams.operatingVoltage}
                      onChange={(e) => setAcPvCableParams({...acPvCableParams, operatingVoltage: parseFloat(e.target.value) || 400})}
                      className="bg-slate-700/80 border-emerald-500/60 text-emerald-100 h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-emerald-200/80 mb-1">Length (m)</Label>
                    <Input
                      type="number"
                      value={acPvCableParams.cableLength}
                      onChange={(e) => setAcPvCableParams({...acPvCableParams, cableLength: parseFloat(e.target.value) || 10})}
                      className="bg-slate-700/80 border-emerald-500/60 text-emerald-100 h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-emerald-200/80 mb-1">Material</Label>
                    <select
                      value={acPvCableParams.material}
                      onChange={(e) => setAcPvCableParams({...acPvCableParams, material: e.target.value as 'COPPER' | 'ALUMINUM'})}
                      className="w-full px-2 py-1.5 h-9 bg-slate-700/80 border border-emerald-500/60 rounded-md text-white text-xs"
                      style={{ backgroundColor: '#1e293b' }}
                    >
                      <option value="Copper" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Copper</option>
                      <option value="Aluminum" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Aluminum</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-emerald-200/80 mb-1">Cable Size (mm²)</Label>
                    <select
                      value={acPvCableParams.selectedCableSize}
                      onChange={(e) => setAcPvCableParams({...acPvCableParams, selectedCableSize: parseFloat(e.target.value)})}
                      className="w-full px-2 py-1.5 h-9 bg-slate-700/80 border border-emerald-500/60 rounded-md text-white text-xs"
                      style={{ backgroundColor: '#1e293b' }}
                    >
                      {availableLVCableSizes.map(size => (
                        <option key={size} value={size} style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
                          {size} mm²
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-emerald-200/80 mb-1">Cable Runs</Label>
                    <Input
                      type="number"
                      min="1"
                      value={acPvCableParams.cableRuns}
                      onChange={(e) => setAcPvCableParams({...acPvCableParams, cableRuns: parseInt(e.target.value) || 3})}
                      className="bg-slate-700/80 border-emerald-500/60 text-emerald-100 h-9 text-sm"
                    />
                  </div>
                </div>

                {(() => {
                  const operatingCurrent = acPvCableParams.operatingCurrent || 0;
                  const designCurrent = operatingCurrent * 1.25; // Calculate design current from operating current
                  const kFactor = 0.718;
                  const requiredAmpacity = designCurrent / kFactor;
                  
                  const { voltageDrop, voltageDropPercent, powerLossKW } = calculateACVoltageDrop(
                    designCurrent / acPvCableParams.cableRuns,
                    acPvCableParams.cableLength,
                    acPvCableParams.selectedCableSize,
                    acPvCableParams.operatingVoltage
                  );
                  const deratedCurrent = designCurrent * kFactor;
                  const isAdequate = voltageDropPercent <= 3;

                  return (
                    <div className="space-y-3">
                      {/* Current and Ampacity Summary */}
                      <div className="grid grid-cols-3 gap-2 p-3 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg border border-emerald-500/40">
                        <div className="p-2 bg-emerald-900/30 rounded-lg" title="The actual continuous operating current of the inverter at rated power">
                          <p className="text-xs text-emerald-300 mb-1">Operating Current ⓘ</p>
                          <p className="text-xl font-bold text-emerald-200">{operatingCurrent.toFixed(1)} A</p>
                          <p className="text-xs text-emerald-300/60 mt-0.5">Actual load</p>
                        </div>
                        <div className="p-2 bg-teal-900/30 rounded-lg" title="Operating current × 1.25 safety factor as per electrical standards">
                          <p className="text-xs text-teal-300 mb-1">Design Current</p>
                          <p className="text-xl font-bold text-teal-200">{designCurrent.toFixed(1)} A</p>
                          <p className="text-xs text-teal-300/70 mt-0.5">125% safety</p>
                        </div>
                        <div className="p-2 bg-cyan-900/30 rounded-lg" title="Design current ÷ K-factor (0.718) to account for derating factors">
                          <p className="text-xs text-cyan-300 mb-1">Required Ampacity ⓘ</p>
                          <p className="text-xl font-bold text-cyan-200">{requiredAmpacity.toFixed(1)} A</p>
                          <p className="text-xs text-cyan-300/70 mt-0.5">After derating</p>
                        </div>
                      </div>

                      <div className="p-3 bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-lg border border-emerald-500/40">
                        <div className="flex items-center justify-between mb-2">
                          {isAdequate ? (
                            <div className="flex items-center gap-2 text-green-400 text-xs">
                              <CheckCircle className="h-4 w-4" />
                              <span>✓ Adequate</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-400 text-xs">
                              <AlertTriangle className="h-4 w-4" />
                              <span>⚠ Excessive</span>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 bg-slate-700/60 rounded-lg" title="K-Factor (0.718) × Design Current">
                            <p className="text-xs text-emerald-300">K-Factor Adjusted ⓘ</p>
                            <p className="text-lg font-bold text-emerald-200">{deratedCurrent.toFixed(1)} A</p>
                            <p className="text-xs text-emerald-300/60 mt-0.5">Design × 0.718</p>
                          </div>
                          <div className="p-2 bg-slate-700/60 rounded-lg">
                            <p className="text-xs text-cyan-300">Voltage Drop</p>
                            <p className="text-lg font-bold text-cyan-200">{voltageDropPercent.toFixed(2)}%</p>
                          </div>
                          <div className="p-2 bg-slate-700/60 rounded-lg">
                            <p className="text-xs text-teal-300">Power Loss</p>
                            <p className="text-lg font-bold text-teal-200">{powerLossKW.toFixed(2)} kW</p>
                          </div>
                          <div className="p-2 bg-slate-700/60 rounded-lg">
                            <p className="text-xs text-blue-300">K-Factor</p>
                            <p className="text-lg font-bold text-blue-200">0.718</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* K-Factor Derating Details - Collapsible (PV Inverter) */}
                <div className="border border-emerald-500/30 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowPvKFactor(!showPvKFactor)}
                    className="w-full p-3 bg-slate-800/60 hover:bg-slate-800/80 transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
                      Installation Conditions & K-Factor Derating
                      <span className="text-xs px-2 py-0.5 bg-emerald-500/20 rounded text-emerald-300">K-Factor: 0.718</span>
                    </span>
                    <ChevronDown className={`h-4 w-4 text-emerald-300 transition-transform ${showPvKFactor ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showPvKFactor && (
                    <div className="p-4 bg-slate-900/40 space-y-4 text-sm">
                      {/* Installation Conditions */}
                      <div>
                        <h6 className="font-semibold text-emerald-200 mb-2">Installation Conditions:</h6>
                        <ul className="space-y-1 text-emerald-100/80">
                          <li>• Underground installation at 0.7m depth</li>
                          <li>• Ground temperature: 40°C</li>
                          <li>• Soil thermal resistivity: 1.5 K·m/W</li>
                          <li>• Trefoil spacing: 30cm</li>
                          <li>• Cable type: 4 core XLPE</li>
                          <li>• Air temperature: 50°C</li>
                          <li>• Trench width: 1m</li>
                        </ul>
                      </div>

                      {/* K-Factor Based Derating */}
                      <div>
                        <h6 className="font-semibold text-emerald-200 mb-2">K-Factor Based Derating:</h6>
                        <ul className="space-y-1 text-emerald-100/80">
                          <li>• <span className="text-emerald-300">K1</span> (Depth factor): 1.000 - 0.7m burial depth</li>
                          <li>• <span className="text-emerald-300">K2</span> (Temperature factor): 0.845 - 40°C soil temp</li>
                          <li>• <span className="text-emerald-300">K3</span> (Resistivity factor): 1.000 - 1.5 K·m/W soil resistivity</li>
                          <li>• <span className="text-emerald-300">K4</span> (Grouping factor): 0.850 - Trefoil formation</li>
                        </ul>
                        <p className="mt-2 font-semibold text-emerald-300">
                          • Total K-factor: K1×K2×K3×K4 = 0.718
                        </p>
                      </div>

                      {/* Traditional Fixed Factors for Comparison */}
                      <div className="pt-3 border-t border-emerald-500/20">
                        <h6 className="font-semibold text-blue-300 mb-2">Traditional Fixed Factors (for comparison):</h6>
                        <ul className="space-y-1 text-blue-200/80">
                          <li>• Ground temperature factor: 0.88</li>
                          <li>• Grouping factor: 0.85</li>
                          <li>• Burial depth factor: 0.95</li>
                        </ul>
                        <p className="mt-2 font-semibold text-blue-300">
                          • Traditional derating factor: 0.711
                        </p>
                      </div>

                      {/* Note */}
                      <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded">
                        <p className="text-xs text-yellow-200">
                          <span className="font-semibold">Note:</span> The K-factor method (K1×K2×K3×K4) properly considers depth, soil temperature, thermal resistivity (1.5 K·m/W), and cable grouping effects.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* RIGHT COLUMN: Battery Inverter to Main LV Panel */}
            <Card className="border border-teal-500/40 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 backdrop-blur-md shadow-xl">
              <CardHeader className="border-b border-teal-500/20 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent flex items-center gap-2">
                      <Battery className="h-5 w-5 text-teal-400" />
                      Battery Inverter AC Cable
                    </CardTitle>
                    <CardDescription className="text-teal-200/60 mt-1">
                      Battery Inverter → Main LV Panel
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-teal-900/20 rounded-lg border border-teal-500/30">
                  <div>
                    <Label className="text-xs text-teal-200/80 mb-1">Operating Current (A)</Label>
                    <Input
                      type="number"
                      value={acBattCableParams.operatingCurrent || 0}
                      onChange={(e) => setAcBattCableParams({...acBattCableParams, operatingCurrent: parseFloat(e.target.value) || 0})}
                      className="bg-slate-700/80 border-teal-500/60 text-teal-100 h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-teal-200/80 mb-1">Voltage (V)</Label>
                    <Input
                      type="number"
                      value={acBattCableParams.operatingVoltage}
                      onChange={(e) => setAcBattCableParams({...acBattCableParams, operatingVoltage: parseFloat(e.target.value) || 400})}
                      className="bg-slate-700/80 border-teal-500/60 text-teal-100 h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-teal-200/80 mb-1">Length (m)</Label>
                    <Input
                      type="number"
                      value={acBattCableParams.cableLength}
                      onChange={(e) => setAcBattCableParams({...acBattCableParams, cableLength: parseFloat(e.target.value) || 5})}
                      className="bg-slate-700/80 border-teal-500/60 text-teal-100 h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-teal-200/80 mb-1">Material</Label>
                    <select
                      value={acBattCableParams.material}
                      onChange={(e) => setAcBattCableParams({...acBattCableParams, material: e.target.value as 'COPPER' | 'ALUMINUM'})}
                      className="w-full px-2 py-1.5 h-9 bg-slate-700/80 border border-teal-500/60 rounded-md text-white text-xs"
                      style={{ backgroundColor: '#1e293b' }}
                    >
                      <option value="Copper" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Copper</option>
                      <option value="Aluminum" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Aluminum</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-teal-200/80 mb-1">Cable Size (mm²)</Label>
                    <select
                      value={acBattCableParams.selectedCableSize}
                      onChange={(e) => setAcBattCableParams({...acBattCableParams, selectedCableSize: parseFloat(e.target.value)})}
                      className="w-full px-2 py-1.5 h-9 bg-slate-700/80 border border-teal-500/60 rounded-md text-white text-xs"
                      style={{ backgroundColor: '#1e293b' }}
                    >
                      {availableLVCableSizes.map(size => (
                        <option key={size} value={size} style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
                          {size} mm²
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-teal-200/80 mb-1">Cable Runs</Label>
                    <Input
                      type="number"
                      min="1"
                      value={acBattCableParams.cableRuns}
                      onChange={(e) => setAcBattCableParams({...acBattCableParams, cableRuns: parseInt(e.target.value) || 2})}
                      className="bg-slate-700/80 border-teal-500/60 text-teal-100 h-9 text-sm"
                    />
                  </div>
                </div>

                {(() => {
                  const operatingCurrent = acBattCableParams.operatingCurrent || 0;
                  const designCurrent = operatingCurrent * 1.25; // Calculate design current from operating current
                  const kFactor = 0.718;
                  const requiredAmpacity = designCurrent / kFactor;
                  
                  const { voltageDrop, voltageDropPercent, powerLossKW } = calculateACVoltageDrop(
                    designCurrent / acBattCableParams.cableRuns,
                    acBattCableParams.cableLength,
                    acBattCableParams.selectedCableSize,
                    acBattCableParams.operatingVoltage
                  );
                  const deratedCurrent = designCurrent * kFactor;
                  const isAdequate = voltageDropPercent <= 3;

                  return (
                    <div className="space-y-3">
                      {/* Current and Ampacity Summary */}
                      <div className="grid grid-cols-3 gap-2 p-3 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-lg border border-teal-500/40">
                        <div className="p-2 bg-teal-900/30 rounded-lg" title="The actual continuous operating current of the inverter at rated power">
                          <p className="text-xs text-teal-300 mb-1">Operating Current ⓘ</p>
                          <p className="text-xl font-bold text-teal-200">{operatingCurrent.toFixed(1)} A</p>
                          <p className="text-xs text-teal-300/60 mt-0.5">Actual load</p>
                        </div>
                        <div className="p-2 bg-cyan-900/30 rounded-lg" title="Operating current × 1.25 safety factor as per electrical standards">
                          <p className="text-xs text-cyan-300 mb-1">Design Current</p>
                          <p className="text-xl font-bold text-cyan-200">{designCurrent.toFixed(1)} A</p>
                          <p className="text-xs text-cyan-300/70 mt-0.5">125% safety</p>
                        </div>
                        <div className="p-2 bg-blue-900/30 rounded-lg" title="Design current ÷ K-factor (0.718) to account for derating factors">
                          <p className="text-xs text-blue-300 mb-1">Required Ampacity ⓘ</p>
                          <p className="text-xl font-bold text-blue-200">{requiredAmpacity.toFixed(1)} A</p>
                          <p className="text-xs text-blue-300/70 mt-0.5">After derating</p>
                        </div>
                      </div>

                      <div className="p-3 bg-gradient-to-br from-teal-900/30 to-cyan-900/30 rounded-lg border border-teal-500/40">
                        <div className="flex items-center justify-between mb-2">
                          {isAdequate ? (
                            <div className="flex items-center gap-2 text-green-400 text-xs">
                              <CheckCircle className="h-4 w-4" />
                              <span>✓ Adequate</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-400 text-xs">
                              <AlertTriangle className="h-4 w-4" />
                              <span>⚠ Excessive</span>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 bg-slate-700/60 rounded-lg" title="K-Factor (0.718) × Design Current">
                            <p className="text-xs text-teal-300">K-Factor Adjusted ⓘ</p>
                            <p className="text-lg font-bold text-teal-200">{deratedCurrent.toFixed(1)} A</p>
                            <p className="text-xs text-teal-300/60 mt-0.5">Design × 0.718</p>
                          </div>
                          <div className="p-2 bg-slate-700/60 rounded-lg">
                            <p className="text-xs text-cyan-300">Voltage Drop</p>
                            <p className="text-lg font-bold text-cyan-200">{voltageDropPercent.toFixed(2)}%</p>
                          </div>
                          <div className="p-2 bg-slate-700/60 rounded-lg">
                            <p className="text-xs text-teal-300">Power Loss</p>
                            <p className="text-lg font-bold text-teal-200">{powerLossKW.toFixed(2)} kW</p>
                          </div>
                          <div className="p-2 bg-slate-700/60 rounded-lg">
                            <p className="text-xs text-blue-300">K-Factor</p>
                            <p className="text-lg font-bold text-blue-200">0.718</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* K-Factor Derating Details - Collapsible (Battery Inverter) */}
                <div className="border border-teal-500/30 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowBattKFactor(!showBattKFactor)}
                    className="w-full p-3 bg-slate-800/60 hover:bg-slate-800/80 transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm font-semibold text-teal-300 flex items-center gap-2">
                      Installation Conditions & K-Factor Derating
                      <span className="text-xs px-2 py-0.5 bg-teal-500/20 rounded text-teal-300">K-Factor: 0.718</span>
                    </span>
                    <ChevronDown className={`h-4 w-4 text-teal-300 transition-transform ${showBattKFactor ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showBattKFactor && (
                    <div className="p-4 bg-slate-900/40 space-y-4 text-sm">
                      {/* Installation Conditions */}
                      <div>
                        <h6 className="font-semibold text-teal-200 mb-2">Installation Conditions:</h6>
                        <ul className="space-y-1 text-teal-100/80">
                          <li>• Underground installation at 0.7m depth</li>
                          <li>• Ground temperature: 40°C</li>
                          <li>• Soil thermal resistivity: 1.5 K·m/W</li>
                          <li>• Trefoil spacing: 30cm</li>
                          <li>• Cable type: 4 core XLPE</li>
                          <li>• Air temperature: 50°C</li>
                          <li>• Trench width: 1m</li>
                        </ul>
                      </div>

                      {/* K-Factor Based Derating */}
                      <div>
                        <h6 className="font-semibold text-teal-200 mb-2">K-Factor Based Derating:</h6>
                        <ul className="space-y-1 text-teal-100/80">
                          <li>• <span className="text-teal-300">K1</span> (Depth factor): 1.000 - 0.7m burial depth</li>
                          <li>• <span className="text-teal-300">K2</span> (Temperature factor): 0.845 - 40°C soil temp</li>
                          <li>• <span className="text-teal-300">K3</span> (Resistivity factor): 1.000 - 1.5 K·m/W soil resistivity</li>
                          <li>• <span className="text-teal-300">K4</span> (Grouping factor): 0.850 - Trefoil formation</li>
                        </ul>
                        <p className="mt-2 font-semibold text-teal-300">
                          • Total K-factor: K1×K2×K3×K4 = 0.718
                        </p>
                      </div>

                      {/* Traditional Fixed Factors for Comparison */}
                      <div className="pt-3 border-t border-teal-500/20">
                        <h6 className="font-semibold text-blue-300 mb-2">Traditional Fixed Factors (for comparison):</h6>
                        <ul className="space-y-1 text-blue-200/80">
                          <li>• Ground temperature factor: 0.88</li>
                          <li>• Grouping factor: 0.85</li>
                          <li>• Burial depth factor: 0.95</li>
                        </ul>
                        <p className="mt-2 font-semibold text-blue-300">
                          • Traditional derating factor: 0.711
                        </p>
                      </div>

                      {/* Note */}
                      <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded">
                        <p className="text-xs text-yellow-200">
                          <span className="font-semibold">Note:</span> The K-factor method (K1×K2×K3×K4) properly considers depth, soil temperature, thermal resistivity (1.5 K·m/W), and cable grouping effects.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

