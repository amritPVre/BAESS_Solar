import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Cable, AlertTriangle, CheckCircle, Zap, ChevronDown, ChevronUp, Info } from "lucide-react";
import { fetchLVCables, type LVCable } from "@/services/cableSelectionService";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CableSizingSectionProps {
  combinerPanelIndex: number;
  inverterCount: number;
  inverterOutputCurrent: number;
  inverterOutputVoltage: number;
  sectionType: 'input' | 'output';
  sectionTitle: string;
  onLossesChange?: (losses: { kW: number; percentage: number }, sectionId: string) => void;
  // Optional operating voltage for display
  operatingVoltage?: number;
  // Callback to pass selected cable data back to parent
  onCableSelect?: (cableData: {
    cable: LVCable | null;
    material: 'COPPER' | 'ALUMINUM';
    length: number;
    numberOfRuns: number;
    calculatedCurrent: number;
    deratedCurrent: number;
  }, sectionType: string, sectionTitle: string) => void;
  // Initial cable data (for restoring saved projects)
  initialCableData?: {
    cable: LVCable | null;
    material: 'COPPER' | 'ALUMINUM';
    length: number;
    numberOfRuns: number;
  } | null;
}

// Underground cable installation conditions as per user specifications
const INSTALLATION_CONDITIONS = {
  cableLayingType: 'Underground',
  groundTemperature: 40, // °C
  depthOfLying: 0.7, // m
  thermalResistivity: 1.5,
  spacing: 30, // cm (trefoil spacing)
  trenchWidth: 1, // m
  cableType: '4 core XLPE',
  airTemperature: 50 // °C
};

// Derating factors based on installation conditions
const DERATING_FACTORS = {
  groundTemperature: 0.88, // Factor for 40°C ground temperature
  grouping: 0.85, // Factor for cables laid in trefoil spacing
  burial: 0.95 // Factor for direct burial at 0.7m depth
};

const CableSizingSection: React.FC<CableSizingSectionProps> = ({
  combinerPanelIndex,
  inverterCount,
  inverterOutputCurrent,
  inverterOutputVoltage,
  sectionType,
  sectionTitle,
  onLossesChange,
  operatingVoltage,
  onCableSelect,
  initialCableData
}) => {
  const [cableLength, setCableLength] = useState<number>(initialCableData?.length || 10); // Default 10m
  const [cableMaterial, setCableMaterial] = useState<'COPPER' | 'ALUMINUM'>(initialCableData?.material || 'COPPER');
  const [availableCables, setAvailableCables] = useState<LVCable[]>([]);
  const [selectedCable, setSelectedCable] = useState<LVCable | null>(initialCableData?.cable || null);
  const [numberOfRuns, setNumberOfRuns] = useState<number>(initialCableData?.numberOfRuns || 1);
  const [loading, setLoading] = useState(true);
  const [showInstallationConditions, setShowInstallationConditions] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Log when restoring from initial data and mark initial mount complete
  useEffect(() => {
    if (initialCableData && initialCableData.cable) {
      console.log(`✅ CableSizingSection: Restored cable for ${sectionTitle}:`, initialCableData.cable.cross_section_mm2, 'mm²');
    }
    // Mark initial mount as complete after first render
    setIsInitialMount(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Design current calculation
  const designCurrent = sectionType === 'input' 
    ? inverterOutputCurrent 
    : inverterOutputCurrent; // For output, the current is already calculated in parent component

  useEffect(() => {
    loadCables();
  }, []);

  const loadCables = async () => {
    try {
      setLoading(true);
      const cables = await fetchLVCables();
      // Filter cables by type (4 core XLPE) and remove duplicates by cross_section_mm2
      const filteredCables = cables.filter(cable => 
        cable.insulation_type?.toLowerCase().includes('xlpe') &&
        cable.num_cores === 4
      );
      
      // Remove duplicates based on cross_section_mm2 and sort by cross section
      const uniqueCables = filteredCables.reduce((acc: LVCable[], current) => {
        const existing = acc.find(cable => cable.cross_section_mm2 === current.cross_section_mm2);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, []).sort((a, b) => {
        // Sort by cross section numerically
        return a.cross_section_mm2 - b.cross_section_mm2;
      });
      
      setAvailableCables(uniqueCables);
    } catch (error) {
      console.error('Error loading cables:', error);
      toast.error("Failed to load cables");
    } finally {
      setLoading(false);
    }
  };

  // Calculate K-factor based derating factor
  const calculateKFactorDeratingFactor = (): {
    total: number;
    K1: number;
    K2: number; 
    K3: number;
    K4: number;
  } => {
    if (!selectedCable) return { total: 0, K1: 0, K2: 0, K3: 0, K4: 0 };

    // K1: Depth factor (based on burial depth)
    const standardDepth = 0.7; // m (standard reference depth)
    const actualDepth = INSTALLATION_CONDITIONS.depthOfLying; // m
    let K1: number;
    
    if (actualDepth <= 0.5) {
      K1 = 1.10; // Shallow burial increases heat dissipation
    } else if (actualDepth <= 0.7) {
      K1 = 1.00; // Standard depth
    } else if (actualDepth <= 1.0) {
      K1 = 0.95; // Deeper burial reduces heat dissipation
    } else if (actualDepth <= 1.5) {
      K1 = 0.90;
    } else {
      K1 = 0.85; // Very deep burial
    }

    // K2: Soil temperature factor
    const θ_max = 90; // Maximum operating temperature for XLPE (°C)
    const θ_soil = INSTALLATION_CONDITIONS.groundTemperature; // Actual soil temperature (°C)
    const θ_ref = 20; // Reference soil temperature (°C)
    const K2 = Math.sqrt((θ_max - θ_soil) / (θ_max - θ_ref));

    // K3: Soil thermal resistivity factor
    const ρ_ref = 1.5; // Reference thermal resistivity (K⋅m/W)
    const ρ_soil = INSTALLATION_CONDITIONS.thermalResistivity; // Actual soil thermal resistivity (K⋅m/W)
    const K3 = Math.sqrt(ρ_ref / ρ_soil);

    // K4: Grouping factor (cable arrangement)
    const K4 = 0.85; // Trefoil formation with 30cm spacing

    // Total derating factor = K1 × K2 × K3 × K4
    const total = K1 * K2 * K3 * K4;

    return { total, K1, K2, K3, K4 };
  };

  // Calculate traditional derating factor (for comparison/fallback)
  const calculateTotalDeratingFactor = (): number => {
    return DERATING_FACTORS.groundTemperature * 
           DERATING_FACTORS.grouping * 
           DERATING_FACTORS.burial;
  };

  // Calculate derated current for selected cable
  const calculateDeratedCurrent = (): number => {
    if (!selectedCable) return 0;
    
    const baseAmpacity = selectedCable.direct_burial_ampacity || selectedCable.current_in_conduit || 0;
    
    // Use K-factor based calculation
    const kFactors = calculateKFactorDeratingFactor();
    const deratedCurrent = (baseAmpacity * kFactors.total * numberOfRuns);
    
    return deratedCurrent;
  };

  // Check if cable selection is adequate
  const isCableAdequate = (): boolean => {
    const deratedCurrent = calculateDeratedCurrent();
    return deratedCurrent >= designCurrent;
  };

  // Calculate voltage drop percentage
  const calculateVoltageDropPercentage = (): number => {
    if (!selectedCable || !cableLength || cableLength <= 0) return 0;
    
    // Convert cross_section_mm2 to number (it comes as string from DB)
    const crossSection = Number(selectedCable.cross_section_mm2);
    if (isNaN(crossSection) || crossSection <= 0) return 0;
    
    // Material resistivity at 20°C (Ohm⋅mm²/m)
    const resistivity = cableMaterial === 'COPPER' ? 0.0175 : 0.0287; // Aluminum
    
    // Calculate resistance: R = ρ × L / A (Ohm)
    // For AC circuits: R_ac ≈ R_dc × 1.1 (skin effect factor)
    const resistance = (resistivity * cableLength) / crossSection * 1.1; // Ohm
    
    // Voltage drop for 3-phase AC: VD = √3 × I × R / runs
    const current = designCurrent;
    const voltageDrop = (Math.sqrt(3) * current * resistance) / numberOfRuns; // V
    
    // Use operatingVoltage if provided (for LV String inverter cases), otherwise use inverterOutputVoltage
    const referenceVoltage = operatingVoltage || inverterOutputVoltage;
    
    // Voltage drop percentage
    const voltageDropPercentage = (voltageDrop / referenceVoltage) * 100;
    
    return Math.min(Math.abs(voltageDropPercentage), 100); // Cap at 100%
  };

  // Calculate power loss
  const calculatePowerLoss = (): { kW: number; percentage: number } => {
    if (!selectedCable || !cableLength || cableLength <= 0) return { kW: 0, percentage: 0 };
    
    // Convert cross_section_mm2 to number (it comes as string from DB)
    const crossSection = Number(selectedCable.cross_section_mm2);
    if (isNaN(crossSection) || crossSection <= 0) return { kW: 0, percentage: 0 };
    
    // Material resistivity at 20°C (Ohm⋅mm²/m)
    const resistivity = cableMaterial === 'COPPER' ? 0.0175 : 0.0287; // Aluminum
    
    // Calculate resistance: R = ρ × L / A (Ohm)
    const resistance = (resistivity * cableLength) / crossSection * 1.1; // AC resistance with skin effect
    
    // Power loss for 3-phase: P_loss = 3 × I² × R / runs (W)
    const current = designCurrent;
    const powerLossW = (3 * Math.pow(current, 2) * resistance) / numberOfRuns;
    const powerLossKW = powerLossW / 1000; // Convert to kW
    
    // Use operatingVoltage if provided (for LV String inverter cases), otherwise use inverterOutputVoltage
    const referenceVoltage = operatingVoltage || inverterOutputVoltage;
    
    // Reference power for percentage calculation (kW)
    // For 'input' (inverter to combiner): use single inverter power
    // For 'output' (combiner to PoC): use total combined power from this section
    const referencePowerKW = sectionType === 'input' 
      ? (referenceVoltage * inverterOutputCurrent * Math.sqrt(3)) / 1000  // Single inverter power
      : (referenceVoltage * designCurrent * Math.sqrt(3)) / 1000;          // Total power for output section
    
    // Power loss percentage
    const powerLossPercentage = referencePowerKW > 0 ? (powerLossKW / referencePowerKW) * 100 : 0;
    
    return { 
      kW: Math.abs(powerLossKW), 
      percentage: Math.min(Math.abs(powerLossPercentage), 100) 
    };
  };

  const voltageDropPercentage = calculateVoltageDropPercentage();
  const powerLoss = calculatePowerLoss();
  const deratedCurrent = calculateDeratedCurrent();
  const totalDeratingFactor = calculateTotalDeratingFactor();
  const kFactors = calculateKFactorDeratingFactor();

  // Generate unique section ID for loss tracking
  const sectionId = `panel-${combinerPanelIndex}-${sectionType}`;

  // Report losses to parent component
  React.useEffect(() => {
    if (selectedCable && cableLength > 0 && onLossesChange) {
      onLossesChange(powerLoss, sectionId);
    }
  }, [selectedCable?.id, cableLength, cableMaterial, numberOfRuns, designCurrent, sectionId, onLossesChange]);

  // Call the callback when cable selection changes (skip during initial mount)
  React.useEffect(() => {
    if (onCableSelect && !isInitialMount) {
      onCableSelect({
        cable: selectedCable,
        material: cableMaterial,
        length: cableLength,
        numberOfRuns: numberOfRuns,
        calculatedCurrent: designCurrent,
        deratedCurrent: deratedCurrent
      }, sectionType, sectionTitle);
    }
  }, [selectedCable, cableMaterial, cableLength, numberOfRuns, designCurrent, deratedCurrent, sectionType, sectionTitle, onCableSelect, isInitialMount]);

  return (
    <Card className="border border-blue-200/50 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
          <Cable className="h-5 w-5" />
          {sectionTitle} - Panel {combinerPanelIndex + 1}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Design Current Display - Top */}
        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-md border border-yellow-200">
          <span className="text-sm text-yellow-800 font-medium">Design Current:</span>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Zap className="h-3 w-3 mr-1" />
            {designCurrent.toFixed(2)} A
          </Badge>
        </div>

        {/* Operating Voltage Display */}
        {operatingVoltage && (
          <div className="flex justify-between items-center p-3 bg-purple-50 rounded-md border border-purple-200">
            <span className="text-sm text-purple-800 font-medium">Operating Voltage:</span>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
              {operatingVoltage >= 1000 ? `${(operatingVoltage / 1000).toFixed(1)} kV` : `${operatingVoltage.toFixed(0)} V`}
            </Badge>
          </div>
        )}

        {/* Cable Length & Material - Side by Side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`cable-length-${combinerPanelIndex}-${sectionType}`}>
              Average Cable Length (m):
            </Label>
            <Input
              id={`cable-length-${combinerPanelIndex}-${sectionType}`}
              type="number"
              value={cableLength}
              onChange={(e) => setCableLength(Number(e.target.value))}
              className="w-full"
              min="1"
              max="1000"
            />
          </div>

          <div className="grid gap-2">
            <Label>Cable Material:</Label>
            <Select value={cableMaterial} onValueChange={(value: 'COPPER' | 'ALUMINUM') => setCableMaterial(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COPPER">Copper (Cu)</SelectItem>
                <SelectItem value="ALUMINUM">Aluminum (Al)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cable Cross Section & Number of Runs - Side by Side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Cable Cross Section:</Label>
            <Select 
              value={selectedCable?.id || ""} 
              onValueChange={(value) => {
                const cable = availableCables.find(c => c.id === value);
                setSelectedCable(cable || null);
              }}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loading ? "Loading..." : "Select section"} />
              </SelectTrigger>
              <SelectContent>
                {availableCables.map((cable) => (
                  <SelectItem key={cable.id} value={cable.id}>
                    {cable.cross_section_mm2} mm² ({cable.conductor_material})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`runs-${combinerPanelIndex}-${sectionType}`}>
              Number of Cable Runs:
            </Label>
            <Select value={numberOfRuns.toString()} onValueChange={(value) => setNumberOfRuns(Number(value))}>
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

            {/* Derated Current Calculation */}
            <div className="grid gap-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md border border-blue-200">
                <span className="text-sm text-blue-800 font-medium">Derated Current:</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                  {deratedCurrent.toFixed(2)} A
                </Badge>
              </div>

              {/* Cable Adequacy Check */}
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
                      ? "✓ Selected cable is adequate for this design"
                      : "⚠ Please select a higher cross section or more cable runs"
                    }
                  </span>
                </div>
              </div>

              {/* Voltage Drop */}
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-md border border-orange-200">
                <span className="text-sm text-orange-800 font-medium">Voltage Drop:</span>
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                  {voltageDropPercentage.toFixed(2)}%
                </Badge>
              </div>

              {/* Power Loss */}
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

              {/* Cable Summary */}
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-slate-600" />
                  <h4 className="font-medium text-sm text-slate-800">Selected Cable Summary</h4>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Cross Section:</span>
                      <span className="font-medium">{selectedCable.cross_section_mm2} mm²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Material:</span>
                      <span className="font-medium">{cableMaterial}</span>
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
                      <span className="font-medium">{(selectedCable.direct_burial_ampacity || selectedCable.current_in_conduit || 0)} A</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Insulation:</span>
                      <span className="font-medium">{selectedCable.insulation_type}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collapsible Installation Conditions */}
              <Collapsible open={showInstallationConditions} onOpenChange={setShowInstallationConditions}>
                                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Installation Conditions & K-Factor Derating</span>
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
                <CollapsibleContent className="mt-2">
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="font-medium text-gray-700 mb-2">Installation Conditions:</div>
                      <div>• Underground installation at {INSTALLATION_CONDITIONS.depthOfLying}m depth</div>
                      <div>• Ground temperature: {INSTALLATION_CONDITIONS.groundTemperature}°C</div>
                      <div>• Soil thermal resistivity: {INSTALLATION_CONDITIONS.thermalResistivity} K⋅m/W</div>
                      <div>• Trefoil spacing: {INSTALLATION_CONDITIONS.spacing}cm</div>
                      <div>• Cable type: {INSTALLATION_CONDITIONS.cableType}</div>
                      <div>• Air temperature: {INSTALLATION_CONDITIONS.airTemperature}°C</div>
                      <div>• Trench width: {INSTALLATION_CONDITIONS.trenchWidth}m</div>
                      
                      <Separator className="my-2" />
                      
                      <div className="font-medium text-green-700 mb-2">K-Factor Based Derating:</div>
                      <div>• K1 (Depth factor): {kFactors.K1.toFixed(3)} - {INSTALLATION_CONDITIONS.depthOfLying}m burial depth</div>
                      <div>• K2 (Temperature factor): {kFactors.K2.toFixed(3)} - {INSTALLATION_CONDITIONS.groundTemperature}°C soil temp</div>
                      <div>• K3 (Resistivity factor): {kFactors.K3.toFixed(3)} - {INSTALLATION_CONDITIONS.thermalResistivity} K⋅m/W soil resistivity</div>
                      <div>• K4 (Grouping factor): {kFactors.K4.toFixed(3)} - Trefoil formation</div>
                      <div className="font-medium text-green-700 pt-1">
                        • <strong>Total K-factor: K1×K2×K3×K4 = {kFactors.total.toFixed(3)}</strong>
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div className="font-medium text-blue-700 mb-2">Traditional Fixed Factors (for comparison):</div>
                      <div>• Ground temperature factor: {DERATING_FACTORS.groundTemperature}</div>
                      <div>• Grouping factor: {DERATING_FACTORS.grouping}</div>
                      <div>• Burial depth factor: {DERATING_FACTORS.burial}</div>
                      <div className="font-medium text-blue-700 pt-1">
                        • Traditional derating factor: {totalDeratingFactor.toFixed(3)}
                      </div>
                      
                      <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                        <div className="text-xs text-yellow-800">
                          <strong>Note:</strong> The K-factor method (K1×K2×K3×K4) properly considers depth, soil temperature, 
                          thermal resistivity ({INSTALLATION_CONDITIONS.thermalResistivity} K⋅m/W), and cable grouping effects.
                        </div>
                      </div>
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

export default CableSizingSection; 