import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Cable, AlertTriangle, CheckCircle, Zap, ChevronDown, ChevronUp, Info } from "lucide-react";
import { fetchHVCables, type HVCable } from "@/services/cableSelectionService";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface HTCableSizingSectionProps {
  sectionType: 'idt_to_transformer' | 'transformer_to_poc';
  sectionTitle: string;
  calculatedCurrent: number;
  operatingVoltage: number;
  onLossesChange?: (losses: { kW: number; percentage: number }, sectionId: string) => void;
  onCableSelect?: (cableData: {
    cable: HVCable | null;
    material: 'COPPER' | 'ALUMINUM';
    length: number;
    numberOfRuns: number;
    calculatedCurrent: number;
    deratedCurrent: number;
  }, sectionType: string, sectionTitle: string) => void;
  initialCableData?: {
    cable: HVCable | null;
    material: 'COPPER' | 'ALUMINUM';
    length: number;
    numberOfRuns: number;
  } | null;
}

// HT Cable Underground installation conditions
const HT_INSTALLATION_CONDITIONS = {
  cableLayingType: 'Underground',
  depthOfLying: 0.7, // m
  groundTemperature: 40, // °C
  soilThermalResistivity: 1.5, // K⋅m/W
  trefoilSpacing: 30, // cm
  cableType: 'Single core XLPE',
  airTemperature: 50, // °C
  trenchWidth: 1 // m
};

const HTCableSizingSection: React.FC<HTCableSizingSectionProps> = ({
  sectionType,
  sectionTitle,
  calculatedCurrent,
  operatingVoltage,
  onLossesChange,
  onCableSelect,
  initialCableData
}) => {
  const [cableLength, setCableLength] = useState<number>(initialCableData?.length || 100);
  const [availableCables, setAvailableCables] = useState<HVCable[]>([]);
  const [selectedCable, setSelectedCable] = useState<HVCable | null>(initialCableData?.cable || null);
  const [numberOfRuns, setNumberOfRuns] = useState<number>(initialCableData?.numberOfRuns || 1);
  const [loading, setLoading] = useState(true);
  const [showInstallationConditions, setShowInstallationConditions] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Log when initial cable data is restored and mark initial mount complete
  useEffect(() => {
    if (initialCableData?.cable) {
      console.log(`🔄 HTCableSizingSection: Restored HV cable for "${sectionTitle}":`, {
        crossSection: initialCableData.cable.cross_section_mm2,
        material: initialCableData.material,
        length: initialCableData.length,
        numberOfRuns: initialCableData.numberOfRuns
      });
    }
    // Mark initial mount as complete after first render
    setIsInitialMount(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const designCurrent = calculatedCurrent * 1.25; // 1.25x safety factor

  // Helper function to trigger cable selection callback (skip during initial mount)
  const triggerCableCallback = React.useCallback((cable: HVCable | null) => {
    if (onCableSelect && cable && !isInitialMount) {
      const deratedCurrent = cable.current_in_air * 0.8; // Apply 80% derating factor
      const cableData = {
        cable: cable,
        material: 'ALUMINUM' as const,
        length: cableLength,
        numberOfRuns: numberOfRuns,
        calculatedCurrent: calculatedCurrent,
        deratedCurrent: deratedCurrent
      };
      
      onCableSelect(cableData, sectionType, sectionTitle);
    }
  }, [onCableSelect, cableLength, numberOfRuns, calculatedCurrent, sectionType, sectionTitle, isInitialMount]);

  useEffect(() => {
    loadCables();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCables = async () => {
    try {
      setLoading(true);
      const cables = await fetchHVCables();
      
      // TEMPORARY: Skip voltage filtering to allow all HV cables at any voltage level
      // TODO: Update database with proper voltage ratings for 33kV+ cables
      const filteredCables = cables; // Use all cables without voltage filtering
      
      const uniqueCables = filteredCables.reduce((acc: HVCable[], current: HVCable) => {
        const existing = acc.find(cable => cable.cross_section_mm2 === current.cross_section_mm2);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, []).sort((a, b) => {
        return parseFloat(a.cross_section_mm2.toString()) - parseFloat(b.cross_section_mm2.toString());
      });
      
      setAvailableCables(uniqueCables);
      
      // Restore initial cable if available
      if (initialCableData?.cable) {
        const foundCable = uniqueCables.find(c => c.id === initialCableData.cable!.id);
        if (foundCable) {
          setSelectedCable(foundCable);
          console.log(`🔄 Restored HV cable from initial data: ${foundCable.cross_section_mm2}mm²`);
        } else {
          console.warn(`⚠️  Initial HV cable not found in available cables list`);
        }
      }
    } catch (error) {
      console.error(`🔌 [${sectionTitle}] Error loading HT cables:`, error);
      toast.error("Failed to load HT cables");
    } finally {
      setLoading(false);
    }
  };

  const calculateKFactorDeratingFactor = (): {
    total: number;
    K1: number;
    K2: number; 
    K3: number;
    K4: number;
  } => {
    if (!selectedCable) return { total: 0, K1: 0, K2: 0, K3: 0, K4: 0 };

    // K1: Depth factor
    const actualDepth = HT_INSTALLATION_CONDITIONS.depthOfLying;
    let K1: number;
    
    if (actualDepth <= 0.5) {
      K1 = 1.10;
    } else if (actualDepth <= 0.7) {
      K1 = 1.00;
    } else if (actualDepth <= 1.0) {
      K1 = 0.95;
    } else if (actualDepth <= 1.5) {
      K1 = 0.90;
    } else {
      K1 = 0.85;
    }

    // K2: Temperature factor
    const θ_max = parseFloat(selectedCable.max_temperature?.toString() || '90') || 90;
    const θ_soil = HT_INSTALLATION_CONDITIONS.groundTemperature;
    const θ_ref = 20;
    const K2 = Math.sqrt((θ_max - θ_soil) / (θ_max - θ_ref));

    // K3: Soil thermal resistivity factor
    const ρ_ref = 1.5;
    const ρ_soil = HT_INSTALLATION_CONDITIONS.soilThermalResistivity;
    const K3 = Math.sqrt(ρ_ref / ρ_soil);

    // K4: Grouping factor (trefoil formation)
    const K4 = 0.85;

    const total = K1 * K2 * K3 * K4;
    return { total, K1, K2, K3, K4 };
  };

  const calculateDeratedCurrent = (): number => {
    if (!selectedCable) return 0;
    
    const baseAmpacity = parseFloat(selectedCable.current_in_ground?.toString() || '0') || 0;
    const kFactors = calculateKFactorDeratingFactor();
    const deratedCurrent = (baseAmpacity * kFactors.total * numberOfRuns);
    
    return deratedCurrent;
  };

  const isCableAdequate = (): boolean => {
    const deratedCurrent = calculateDeratedCurrent();
    return deratedCurrent >= designCurrent;
  };

  const calculateVoltageDropPercentage = (): number => {
    if (!selectedCable || !cableLength || cableLength <= 0) return 0;
    
    const resistancePerKm = parseFloat(selectedCable.ac_resistance?.toString() || '0') || 0;
    const reactancePerKm = parseFloat(selectedCable.reactance?.toString() || '0') || 0;
    const impedancePerKm = Math.sqrt(Math.pow(resistancePerKm, 2) + Math.pow(reactancePerKm, 2));
    const totalImpedance = (impedancePerKm * cableLength / 1000) / numberOfRuns;
    const current = designCurrent;
    const voltageDrop = Math.sqrt(3) * current * totalImpedance;
    const voltageDropPercentage = (voltageDrop / operatingVoltage) * 100;
    
    return Math.min(Math.abs(voltageDropPercentage), 100);
  };

  const calculatePowerLoss = (): { kW: number; percentage: number } => {
    if (!selectedCable || !cableLength || cableLength <= 0) return { kW: 0, percentage: 0 };
    
    const resistancePerKm = parseFloat(selectedCable.ac_resistance?.toString() || '0') || 0;
    const totalResistance = (resistancePerKm * cableLength / 1000) / numberOfRuns;
    const current = designCurrent;
    const powerLossW = 3 * Math.pow(current, 2) * totalResistance;
    const powerLossKW = powerLossW / 1000;
    const totalPowerKW = (operatingVoltage * calculatedCurrent * Math.sqrt(3)) / 1000;
    const powerLossPercentage = totalPowerKW > 0 ? (powerLossKW / totalPowerKW) * 100 : 0;
    
    return { 
      kW: Math.abs(powerLossKW), 
      percentage: Math.min(Math.abs(powerLossPercentage), 100) 
    };
  };

  const voltageDropPercentage = calculateVoltageDropPercentage();
  const powerLoss = calculatePowerLoss();
  const deratedCurrent = calculateDeratedCurrent();
  const kFactors = calculateKFactorDeratingFactor();
  const sectionId = `ht-cable-${sectionType}`;

  React.useEffect(() => {
    if (selectedCable && cableLength > 0 && onLossesChange) {
      onLossesChange(powerLoss, sectionId);
    }
  }, [selectedCable, cableLength, numberOfRuns, designCurrent, sectionId, onLossesChange, powerLoss]);

  return (
    <Card className="border border-purple-200/50 bg-gradient-to-br from-purple-50 to-violet-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
          <Cable className="h-5 w-5" />
          {sectionTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-md border border-yellow-200">
          <span className="text-sm text-yellow-800 font-medium">Design Current (with 1.25x safety factor):</span>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Zap className="h-3 w-3 mr-1" />
            {designCurrent.toFixed(2)} A
          </Badge>
        </div>

        <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-md border border-indigo-200">
          <span className="text-sm text-indigo-800 font-medium">Operating Voltage:</span>
          <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-300">
            {(operatingVoltage / 1000).toFixed(1)} kV
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`ht-cable-length-${sectionType}`}>
              Average Cable Length (m):
            </Label>
            <Input
              id={`ht-cable-length-${sectionType}`}
              type="number"
              value={cableLength}
              onChange={(e) => {
                const newLength = Number(e.target.value);
                setCableLength(newLength);
                // Trigger callback if cable is selected
                if (selectedCable) {
                  setTimeout(() => triggerCableCallback(selectedCable), 0);
                }
              }}
              className="w-full"
              min="1"
              max="5000"
            />
          </div>

          <div className="grid gap-2">
            <Label>Cable Material:</Label>
            <Select value="ALUMINUM" disabled>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Aluminum (Standard for HT)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALUMINUM">Aluminum (Al) - Standard for HT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Cable Cross Section:</Label>
            <Select 
              value={selectedCable?.id || ""} 
              onValueChange={(value) => {
                const cable = availableCables.find(c => c.id === value);
                setSelectedCable(cable || null);
                triggerCableCallback(cable || null);
              }}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loading ? "Loading..." : "Select section"} />
              </SelectTrigger>
              <SelectContent>
                {availableCables.map((cable) => (
                  <SelectItem key={cable.id} value={cable.id}>
                    {cable.cross_section_mm2} mm² - HT
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`ht-runs-${sectionType}`}>
              Number of Cable Runs:
            </Label>
            <Select value={numberOfRuns.toString()} onValueChange={(value) => {
              const newRuns = Number(value);
              setNumberOfRuns(newRuns);
              // Trigger callback if cable is selected
              if (selectedCable) {
                setTimeout(() => triggerCableCallback(selectedCable), 0);
              }
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select runs" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(runs => (
                  <SelectItem key={runs} value={runs.toString()}>
                    {runs} Run{runs > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedCable && (
          <>
            <Separator className="my-3" />

            <div className="grid gap-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md border border-blue-200">
                <span className="text-sm text-blue-800 font-medium">Derated Current:</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                  {deratedCurrent.toFixed(2)} A
                </Badge>
              </div>

              <div className={`p-3 rounded-md border ${
                isCableAdequate() 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {isCableAdequate() ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    isCableAdequate() ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {isCableAdequate() 
                      ? "✓ Selected HT cable is adequate for this design"
                      : "⚠ Please select a higher cross section or more cable runs"
                    }
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-md border border-orange-200">
                <span className="text-sm text-orange-800 font-medium">Voltage Drop:</span>
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                  {voltageDropPercentage.toFixed(2)}%
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-md border border-purple-200">
                  <span className="text-sm text-purple-800 font-medium">Power Loss:</span>
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                    {powerLoss.kW.toFixed(3)} kW
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-md border border-purple-200">
                  <span className="text-sm text-purple-800 font-medium">Loss %:</span>
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                    {powerLoss.percentage.toFixed(2)}%
                  </Badge>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-slate-600" />
                  <h4 className="font-medium text-sm text-slate-800">Selected HT Cable Summary</h4>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Cross Section:</span>
                      <span className="font-medium">{selectedCable.cross_section_mm2} mm²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Cable Type:</span>
                      <span className="font-medium">HT Cable</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Cable Runs:</span>
                      <span className="font-medium">{numberOfRuns}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Length:</span>
                      <span className="font-medium">{cableLength} m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Base Ampacity:</span>
                      <span className="font-medium">{selectedCable.current_in_ground} A</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Material:</span>
                      <span className="font-medium">{selectedCable.conductor_material}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Collapsible open={showInstallationConditions} onOpenChange={setShowInstallationConditions}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">HT Installation Conditions & K-Factor Derating</span>
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                      K-Factor: {kFactors.total.toFixed(3)}
                    </Badge>
                  </div>
                  {showInstallationConditions ? (
                    <ChevronUp className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-3">
                  <div className="p-3 bg-gray-50 rounded border text-xs">
                    <h5 className="font-medium text-gray-800 mb-2">Fixed Installation Conditions:</h5>
                    <div className="grid grid-cols-2 gap-y-1 gap-x-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Installation:</span>
                        <span className="font-medium">{HT_INSTALLATION_CONDITIONS.cableLayingType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Burial Depth:</span>
                        <span className="font-medium">{HT_INSTALLATION_CONDITIONS.depthOfLying}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ground Temp:</span>
                        <span className="font-medium">{HT_INSTALLATION_CONDITIONS.groundTemperature}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Soil Resistivity:</span>
                        <span className="font-medium">{HT_INSTALLATION_CONDITIONS.soilThermalResistivity} K⋅m/W</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Spacing:</span>
                        <span className="font-medium">Trefoil {HT_INSTALLATION_CONDITIONS.trefoilSpacing}cm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trench Width:</span>
                        <span className="font-medium">{HT_INSTALLATION_CONDITIONS.trenchWidth}m</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded border text-xs">
                    <h5 className="font-medium text-green-800 mb-2">K-Factor Breakdown:</h5>
                    <div className="grid grid-cols-2 gap-y-1 gap-x-4">
                      <div className="flex justify-between">
                        <span className="text-green-700">K1 (Depth):</span>
                        <span className="font-medium">{kFactors.K1.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">K2 (Temperature):</span>
                        <span className="font-medium">{kFactors.K2.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">K3 (Resistivity):</span>
                        <span className="font-medium">{kFactors.K3.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">K4 (Grouping):</span>
                        <span className="font-medium">{kFactors.K4.toFixed(3)}</span>
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span className="text-green-800">Total (K1×K2×K3×K4):</span>
                      <span className="text-green-800">{kFactors.total.toFixed(3)}</span>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HTCableSizingSection;