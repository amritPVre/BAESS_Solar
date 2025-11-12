import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Zap, CheckCircle, AlertTriangle, Shield } from "lucide-react";
import { fetchCircuitBreakersByType, type CircuitBreaker } from "@/services/circuitBreakerService";
import { toast } from "sonner";

interface CircuitBreakerSectionProps {
  combinerPanelIndex: number;
  inverterCount: number;
  inverterOutputCurrent: number;
  inverterOutputVoltage: number;
  sectionType: 'individual' | 'outgoing' | 'idt_output' | 'power_transformer';
  sectionTitle: string;
  // Optional override for calculated current (useful for IDT/transformer outputs)
  calculatedCurrent?: number;
  // Optional voltage override for higher voltage applications
  operatingVoltage?: number;
  // Callback to pass selected breaker data back to parent
  onBreakerSelect?: (breaker: CircuitBreaker | null, sectionType: string, sectionTitle: string) => void;
  // Initial selected breaker (for restoring saved projects)
  initialSelectedBreaker?: CircuitBreaker | null;
}

type BreakerType = 'MCB' | 'MCCB' | 'ACB' | 'VCB'; // Added VCB for high voltage applications

const CircuitBreakerSection: React.FC<CircuitBreakerSectionProps> = ({
  combinerPanelIndex,
  inverterCount,
  inverterOutputCurrent,
  inverterOutputVoltage,
  sectionType,
  sectionTitle,
  calculatedCurrent,
  operatingVoltage,
  onBreakerSelect,
  initialSelectedBreaker
}) => {
  // Default to VCB for high voltage applications, MCCB for LV
  const defaultBreakerType = (): BreakerType => {
    const voltage = operatingVoltage || inverterOutputVoltage;
    if (voltage >= 1000) return 'VCB'; // High voltage applications
    if (sectionType === 'idt_output' || sectionType === 'power_transformer') return 'VCB';
    return 'MCCB';
  };

  const [breakerType, setBreakerType] = useState<BreakerType>(
    initialSelectedBreaker ? (initialSelectedBreaker.breaker_type as BreakerType) : defaultBreakerType()
  );
  const [availableBreakers, setAvailableBreakers] = useState<CircuitBreaker[]>([]);
  const [selectedBreaker, setSelectedBreaker] = useState<CircuitBreaker | null>(initialSelectedBreaker || null);
  const [loading, setLoading] = useState(true);
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Log when restoring from initial data and mark initial mount complete
  useEffect(() => {
    if (initialSelectedBreaker) {
      console.log(`✅ CircuitBreakerSection: Restored breaker for ${sectionTitle}:`, initialSelectedBreaker.ampacity, 'A');
    }
    // Mark initial mount as complete after first render
    setIsInitialMount(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Design current calculation with safety factor
  const getDesignCurrent = (): number => {
    if (calculatedCurrent) {
      return calculatedCurrent * 1.25; // Use provided current × safety factor
    }
    
    switch (sectionType) {
      case 'individual':
        return inverterOutputCurrent * 1.25; // Single inverter × safety factor
      case 'outgoing':
        return (inverterOutputCurrent * inverterCount * 1.25); // Sum of all inverters × safety factor
      case 'idt_output':
      case 'power_transformer':
        return (calculatedCurrent || inverterOutputCurrent * inverterCount) * 1.25;
      default:
        return inverterOutputCurrent * 1.25;
    }
  };

  const designCurrent = getDesignCurrent();

  // Load breakers when breaker type changes
  const loadBreakers = async () => {
    try {
      setLoading(true);
      console.log(`Loading ${breakerType} breakers...`);
      
      const breakers = await fetchCircuitBreakersByType(breakerType);
      console.log(`Fetched ${breakers.length} ${breakerType} breakers from database`);
      
      // More practical voltage filtering logic
      const voltage = operatingVoltage || inverterOutputVoltage;
      const voltageRatingKV = voltage / 1000;
      
      console.log(`Filtering for voltage: ${voltage}V (${voltageRatingKV}kV)`);
      
      // Filter breakers based on voltage compatibility
      const suitableBreakers = breakers.filter(breaker => {
        // For LV breakers (MCB, MCCB, ACB), be more lenient with voltage requirements
        if (['MCB', 'MCCB', 'ACB'].includes(breaker.breaker_type)) {
          // LV breakers rated at 415V can typically handle up to 1000V applications
          const isLVApp = voltage <= 1000;
          const hasAdequateVoltage = breaker.rated_voltage >= voltageRatingKV;
          const result = isLVApp || hasAdequateVoltage;
          console.log(`LV Breaker ${breaker.breaker_type} ${breaker.ampacity}A: isLVApp=${isLVApp}, hasAdequateVoltage=${hasAdequateVoltage}, result=${result}`);
          return result;
        }
        
        // For HV breakers (VCB), require proper voltage rating
        const result = breaker.rated_voltage >= voltageRatingKV;
        console.log(`HV Breaker ${breaker.breaker_type} ${breaker.ampacity}A: voltage check=${result}`);
        return result;
      });
      
      console.log(`After filtering: ${suitableBreakers.length} suitable breakers`);
      
      setAvailableBreakers(suitableBreakers);
      
      // Only reset selection if there's no initial breaker to restore
      // If we have an initial breaker, check if it's in the list and keep it selected
      if (initialSelectedBreaker) {
        const foundBreaker = suitableBreakers.find(b => b.id === initialSelectedBreaker.id);
        if (foundBreaker) {
          setSelectedBreaker(foundBreaker);
          console.log(`🔄 Restored breaker from initial data: ${foundBreaker.ampacity}A`);
        } else {
          console.warn(`⚠️  Initial breaker not found in suitable breakers list`);
        }
      } else if (!selectedBreaker) {
        // Only reset to null if we don't already have a selection
        setSelectedBreaker(null);
      }
    } catch (error) {
      console.error('Error loading breakers:', error);
      toast.error("Failed to load circuit breakers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBreakers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakerType, inverterOutputVoltage, operatingVoltage]);

  // Call the callback when breaker selection changes (skip during initial mount)
  useEffect(() => {
    if (onBreakerSelect && !isInitialMount) {
      onBreakerSelect(selectedBreaker, sectionType, sectionTitle);
    }
  }, [selectedBreaker, sectionType, sectionTitle, onBreakerSelect, isInitialMount]);

  // Check if selected breaker is adequate
  const isBreakerAdequate = (): boolean => {
    if (!selectedBreaker) return false;
    return selectedBreaker.ampacity >= designCurrent;
  };

  // Get breaker adequacy message
  const getBreakerAdequacyMessage = (): string => {
    if (!selectedBreaker) return "Please select a circuit breaker";
    
    if (isBreakerAdequate()) {
      return "✓ Selected breaker is adequate for this design";
    } else {
      return "⚠ Please select a higher ampacity breaker";
    }
  };

  // Get appropriate breaker types based on voltage level
  const getAvailableBreakerTypes = (): BreakerType[] => {
    const voltage = operatingVoltage || inverterOutputVoltage;
    if (voltage >= 1000) {
      // High voltage applications: VCB is preferred, but include all options
      return ['VCB', 'ACB', 'MCCB', 'MCB'];
    } else {
      // Low voltage applications: All types available
      return ['MCB', 'MCCB', 'ACB', 'VCB'];
    }
  };

  return (
    <Card className="border border-orange-200/50 bg-gradient-to-br from-orange-50 to-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
          <Shield className="h-5 w-5" />
          {sectionTitle}
          {sectionType === 'outgoing' && ` - Panel ${combinerPanelIndex + 1}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Design Current Display - Top */}
        <div className="flex justify-between items-center p-3 bg-red-50 rounded-md border border-red-200">
          <span className="text-sm text-red-800 font-medium">Design Current (with 1.25x safety factor):</span>
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
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

        {/* Breaker Type & Selection - Side by Side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Breaker Type:</Label>
            <Select value={breakerType} onValueChange={(value: BreakerType) => setBreakerType(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select breaker type" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableBreakerTypes().map(type => (
                  <SelectItem key={type} value={type}>
                    {type === 'MCB' && 'MCB (Miniature Circuit Breaker)'}
                    {type === 'MCCB' && 'MCCB (Molded Case Circuit Breaker)'}
                    {type === 'ACB' && 'ACB (Air Circuit Breaker)'}
                    {type === 'VCB' && 'VCB (Vacuum Circuit Breaker)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Circuit Breaker Rating:</Label>
            <Select 
              value={selectedBreaker?.id || ""} 
              onValueChange={(value) => {
                const breaker = availableBreakers.find(b => b.id === value);
                setSelectedBreaker(breaker || null);
              }}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loading ? "Loading..." : "Select breaker"} />
              </SelectTrigger>
              <SelectContent>
                {availableBreakers.map((breaker) => {
                  // For MCCB in LV applications, hide voltage rating in dropdown
                  const voltage = operatingVoltage || inverterOutputVoltage;
                  const isLVApplication = voltage <= 1000;
                  const showVoltageInDropdown = !(breaker.breaker_type === 'MCCB' && isLVApplication);
                  
                  return (
                    <SelectItem key={breaker.id} value={breaker.id}>
                      {breaker.ampacity} A{showVoltageInDropdown ? ` - ${breaker.rated_voltage} kV` : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedBreaker && (
          <>
            <Separator className="my-3" />

            {/* Breaker Adequacy Check */}
            <div className={`p-3 rounded-md border ${
              isBreakerAdequate() 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {isBreakerAdequate() ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  isBreakerAdequate() ? 'text-green-700' : 'text-red-700'
                }`}>
                  {getBreakerAdequacyMessage()}
                </span>
              </div>
            </div>

            {/* Selected Breaker Summary */}
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-slate-600" />
                <h4 className="font-medium text-sm text-slate-800">Selected Breaker Summary</h4>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Type:</span>
                    <span className="font-medium">{selectedBreaker.breaker_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ampacity:</span>
                    <span className="font-medium">{selectedBreaker.ampacity} A</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      {operatingVoltage && operatingVoltage <= 1000 ? 'PoC Voltage:' : 'Voltage Rating:'}
                    </span>
                    <span className="font-medium">
                      {operatingVoltage && operatingVoltage <= 1000 
                        ? `${(operatingVoltage / 1000).toFixed(3)} kV`
                        : `${selectedBreaker.rated_voltage} kV`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Design Current:</span>
                    <span className="font-medium">{designCurrent.toFixed(2)} A</span>
                  </div>
                </div>
              </div>
              
              {/* Margin Display */}
              <div className="mt-2 pt-2 border-t border-slate-300">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Safety Margin:</span>
                  <span className={`font-medium ${
                    isBreakerAdequate() ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {isBreakerAdequate() 
                      ? `+${((selectedBreaker.ampacity - designCurrent) / designCurrent * 100).toFixed(1)}%`
                      : `${((selectedBreaker.ampacity - designCurrent) / designCurrent * 100).toFixed(1)}%`
                    }
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CircuitBreakerSection; 