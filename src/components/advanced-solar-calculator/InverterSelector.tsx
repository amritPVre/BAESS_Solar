import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SolarPanel, SolarInverter, fetchSolarInverters, fetchInverterManufacturers } from "@/services/solarComponentsService";
import { toast } from "sonner";
import { Zap, Battery, Grid, Search, Settings, ChevronDown, ChevronUp, Hash, Calculator } from "lucide-react";
import InverterRecommendationEngine from "./InverterRecommendationEngine";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface InverterSelectorProps {
  onInverterSelect: (inverter: SolarInverter | null) => void;
  selectedInverter: SolarInverter | null;
  selectedPanel?: SolarPanel | null;
  totalSystemCapacity?: number;
  onManualInverterCountChange?: (count: number, dcAcRatio: number) => void;
  initialInverterCount?: number; // For restoring saved projects
}

const InverterSelector: React.FC<InverterSelectorProps> = ({
  onInverterSelect,
  selectedInverter,
  selectedPanel = null,
  totalSystemCapacity = 0,
  onManualInverterCountChange,
  initialInverterCount
}) => {
  const [inverterManufacturers, setInverterManufacturers] = useState<string[]>([]);
  const [selectedInverterManufacturer, setSelectedInverterManufacturer] = useState<string>("");
  const [availableInverters, setAvailableInverters] = useState<SolarInverter[]>([]);
  const [loadingInverterManufacturers, setLoadingInverterManufacturers] = useState(true);
  const [loadingInverters, setLoadingInverters] = useState(false);
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false);
  const [manualInverterCount, setManualInverterCount] = useState<number>(initialInverterCount || 1);
  // Initialize hasLoadedProject to true if we have an initialInverterCount (project is being loaded)
  const [hasLoadedProject, setHasLoadedProject] = useState(!!initialInverterCount && initialInverterCount > 0);
  const isFromRecommendationRef = useRef(false); // Track if selected from recommendation (using ref for immediate updates)

  useEffect(() => {
    console.log('🔌 InverterSelector mounted, initialInverterCount:', initialInverterCount);
    
    const loadManufacturers = async () => {
      try {
        setLoadingInverterManufacturers(true);
        const inverterMfrs = await fetchInverterManufacturers();
        setInverterManufacturers(inverterMfrs);
      } catch (error) {
        console.error("Failed to load manufacturers:", error);
        toast.error("Failed to load inverter manufacturers");
      } finally {
        setLoadingInverterManufacturers(false);
      }
    };
    
    loadManufacturers();
    
    return () => {
      console.log('🔌 InverterSelector unmounting');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  useEffect(() => {
    const loadInverters = async () => {
      if (!selectedInverterManufacturer) {
        setAvailableInverters([]);
        return;
      }
      
      try {
        setLoadingInverters(true);
        const inverters = await fetchSolarInverters("", selectedInverterManufacturer);
        setAvailableInverters(inverters);
        setIsRecommendationsOpen(true);
      } catch (error) {
        console.error("Failed to load inverters:", error);
        toast.error("Failed to load solar inverters");
      } finally {
        setLoadingInverters(false);
      }
    };
    
    loadInverters();
  }, [selectedInverterManufacturer]);

  // Sync internal state when selectedInverter prop changes (for project loading)
  useEffect(() => {
    if (selectedInverter && selectedInverter.manufacturer) {
      // Set the manufacturer to load inverter list
      setSelectedInverterManufacturer(selectedInverter.manufacturer);
    }
  }, [selectedInverter]);

  // Update count if initialInverterCount changes after mount (shouldn't happen normally, but just in case)
  useEffect(() => {
    if (initialInverterCount && initialInverterCount > 0 && !hasLoadedProject) {
      console.log('🔄 Updating inverter count from prop change:', initialInverterCount);
      setManualInverterCount(initialInverterCount);
      setHasLoadedProject(true);
    }
  }, [initialInverterCount, hasLoadedProject]);

  const handleInverterSelect = (inverterId: string) => {
    const inverter = availableInverters.find(i => i.id === inverterId);
    if (inverter) {
      isFromRecommendationRef.current = false; // This is a manual dropdown selection
      onInverterSelect(inverter);
      setHasLoadedProject(false); // Reset flag when user manually selects
    }
  };

  const handleRecommendationSelect = (recommendation: { inverter: SolarInverter; requiredQuantity?: number } | null) => {
    if (recommendation) {
      // Set the flag BEFORE calling onInverterSelect to prevent auto-calculation
      if (recommendation.requiredQuantity) {
        console.log('📊 Recommendation selected:', recommendation.inverter.model, 'Qty:', recommendation.requiredQuantity);
        isFromRecommendationRef.current = true; // Mark as selected from recommendation
        setManualInverterCount(recommendation.requiredQuantity);
      }
      onInverterSelect(recommendation.inverter);
      setIsRecommendationsOpen(false);
      // Don't reset hasLoadedProject here - recommendations provide explicit count
    } else {
      onInverterSelect(null);
    }
  };

  // Calculate default inverter count ONLY when inverter is manually selected from dropdown (not from recommendations)
  // This effect should NOT run when selecting from recommendations since they provide requiredQuantity
  useEffect(() => {
    // Only auto-calculate if:
    // 1. Not loading a project
    // 2. Not selected from recommendations (recommendations provide explicit quantity)
    // 3. Recommendations panel is closed (to avoid interfering with recommendation selection)
    // 4. selectedInverter changed (indicating manual selection from dropdown)
    
    const shouldAutoCalculate = selectedInverter && totalSystemCapacity > 0 && !hasLoadedProject && !isFromRecommendationRef.current && !isRecommendationsOpen;
    
    if (shouldAutoCalculate) {
      const defaultCount = Math.ceil(totalSystemCapacity / selectedInverter.nominal_ac_power_kw);
      console.log('🔢 Auto-calculating inverter count:', defaultCount, 'for', selectedInverter.model);
      setManualInverterCount(defaultCount);
    } else if (selectedInverter) {
      console.log('⏸️  Auto-calculation blocked:', {
        hasLoadedProject,
        isFromRecommendation: isFromRecommendationRef.current,
        isRecommendationsOpen,
        totalSystemCapacity
      });
    }
  }, [selectedInverter, totalSystemCapacity, hasLoadedProject, isRecommendationsOpen]);

  // Calculate DC/AC ratio and notify parent component when manual count changes
  useEffect(() => {
    if (selectedInverter && totalSystemCapacity > 0 && manualInverterCount > 0 && onManualInverterCountChange) {
      const totalInverterCapacity = manualInverterCount * selectedInverter.nominal_ac_power_kw;
      const dcAcRatio = totalSystemCapacity / totalInverterCapacity;
      onManualInverterCountChange(manualInverterCount, dcAcRatio);
    }
  }, [selectedInverter, totalSystemCapacity, manualInverterCount, onManualInverterCountChange]);

  const handleManualInverterCountChange = (value: string) => {
    const count = parseInt(value) || 1;
    setManualInverterCount(Math.max(1, count));
    isFromRecommendationRef.current = false; // User manually changed the count
  };

  const calculateDcAcRatio = () => {
    if (!selectedInverter || totalSystemCapacity <= 0 || manualInverterCount <= 0) return 0;
    const totalInverterCapacity = manualInverterCount * selectedInverter.nominal_ac_power_kw;
    return totalSystemCapacity / totalInverterCapacity;
  };

  return (
    <Card className="relative overflow-hidden bg-white border-2 border-slate-200/50 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-4 pt-5 bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-cyan-50/50">
        <CardTitle className="flex items-center gap-2.5 text-xl font-bold text-slate-800">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
            <Zap className="h-5 w-5" />
          </div>
          Inverter Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                Manufacturer
              </label>
              <Select
                value={selectedInverterManufacturer}
                onValueChange={setSelectedInverterManufacturer}
              >
                <SelectTrigger className="w-full h-11 border-2 border-slate-200/70 bg-white hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-lg transition-all duration-300 hover:shadow-md font-medium">
                  <SelectValue placeholder="Select manufacturer" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-lg border-2">
                  {loadingInverterManufacturers ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : (
                    inverterManufacturers.map(manufacturer => (
                      <SelectItem key={manufacturer} value={manufacturer} className="hover:bg-emerald-50 focus:bg-emerald-50">
                        {manufacturer}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"></div>
                Model
              </label>
              <Select
                value={selectedInverter?.id || ""}
                onValueChange={handleInverterSelect}
                disabled={!selectedInverterManufacturer || loadingInverters}
              >
                <SelectTrigger className="w-full h-11 border-2 border-slate-200/70 bg-white hover:border-teal-400 focus:ring-2 focus:ring-teal-500/20 rounded-lg transition-all duration-300 hover:shadow-md font-medium disabled:opacity-50">
                  <SelectValue placeholder="Select inverter model" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-lg border-2">
                  {loadingInverters ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-spin h-5 w-5 border-2 border-teal-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : availableInverters.length > 0 ? (
                    <SelectGroup>
                      {availableInverters.map(inverter => (
                        <SelectItem key={inverter.id} value={inverter.id} className="hover:bg-teal-50 focus:bg-teal-50">
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm font-medium">{inverter.model}</span>
                            <Badge variant="secondary" className="ml-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-0">
                              {inverter.nominal_ac_power_kw}kW
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ) : selectedInverterManufacturer ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      No inverters found for this manufacturer
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      Select a manufacturer first
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Intelligent Recommendation Engine */}
          {selectedInverterManufacturer && availableInverters.length > 0 && (
            <div className="mt-5">
              <Collapsible 
                open={isRecommendationsOpen} 
                onOpenChange={setIsRecommendationsOpen}
                className="border-2 rounded-lg border-emerald-200/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between p-4 bg-gradient-to-r from-emerald-50/70 to-teal-50/70 hover:from-emerald-100/70 hover:to-teal-100/70 transition-all duration-300">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm">
                      {isRecommendationsOpen ? (
                        <ChevronUp className="h-4 w-4 text-white" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <span className="font-bold text-sm text-slate-700">
                      Inverter Options ({availableInverters.length})
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs bg-white border-emerald-300 text-emerald-700 font-semibold">
                    {isRecommendationsOpen ? 'Hide' : 'Show'} Options
                  </Badge>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-3 bg-white">
                    <InverterRecommendationEngine
                      availableInverters={availableInverters}
                      selectedPanel={selectedPanel}
                      totalSystemCapacity={totalSystemCapacity}
                      onInverterSelect={handleRecommendationSelect}
                      selectedInverter={selectedInverter}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {selectedInverter && (
            <>
              <Card className="border-2 border-emerald-200/50 bg-gradient-to-br from-emerald-50/40 via-teal-50/30 to-cyan-50/40 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="pb-3 pt-4 bg-gradient-to-r from-emerald-50/60 to-teal-50/60">
                  <CardTitle className="text-base flex items-center gap-2 text-slate-800 font-bold">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm">
                      <Battery className="h-4 w-4" />
                    </div>
                    Inverter Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-base text-slate-800">{selectedInverter.manufacturer} {selectedInverter.model}</p>
                        <Badge variant="outline" className="mt-1.5 bg-white border-emerald-300 text-emerald-700 text-xs font-semibold">
                          {selectedInverter.phase || "Single"} Phase
                        </Badge>
                      </div>
                      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-base px-3 py-1 shadow-sm">
                        {selectedInverter.nominal_ac_power_kw}kW
                      </Badge>
                    </div>
                    <Separator className="my-3 bg-emerald-200/40" />
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white/60">
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">MPPT</p>
                          <p className="font-semibold">{selectedInverter.total_mppt || 1}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white/60">
                        <Grid className="h-3.5 w-3.5 text-blue-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Strings</p>
                          <p className="font-semibold">{selectedInverter.total_string_inputs || 1}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white/60">
                        <Battery className="h-3.5 w-3.5 text-green-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Max</p>
                          <p className="font-semibold">{selectedInverter.maximum_ac_power_kw || selectedInverter.nominal_ac_power_kw}kW</p>
                        </div>
                      </div>
                      
                      {/* AC Output Voltage */}
                      <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white/60">
                        <Zap className="h-3.5 w-3.5 text-violet-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">AC Voltage</p>
                          <p className="font-semibold">{selectedInverter.nominal_ac_voltage_v || 400}V</p>
                        </div>
                      </div>
                      
                      {/* AC Output Current */}
                      <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white/60">
                        <Zap className="h-3.5 w-3.5 text-cyan-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">AC Current</p>
                          <p className="font-semibold">{selectedInverter.nominal_ac_current_a?.toFixed(1) || (selectedInverter.nominal_ac_power_kw * 1000 / (selectedInverter.phase === '1' ? (selectedInverter.nominal_ac_voltage_v || 230) : Math.sqrt(3) * (selectedInverter.nominal_ac_voltage_v || 400))).toFixed(1)}A</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white/60">
                        <Grid className="h-3.5 w-3.5 text-emerald-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Phase</p>
                          <p className="font-semibold">{selectedInverter.phase?.split(' ')[0] || 'Single'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white/60 col-span-3">
                        <Zap className="h-3.5 w-3.5 text-orange-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">MPPT Voltage Range</p>
                          <p className="font-semibold">{selectedInverter.min_mpp_voltage_v}V - {selectedInverter.max_dc_voltage_v}V</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Manual Inverter Count Configuration */}
              <Card className="border-2 border-indigo-200/50 bg-gradient-to-br from-indigo-50/40 via-blue-50/30 to-violet-50/40 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="pb-3 pt-4 bg-gradient-to-r from-indigo-50/60 to-blue-50/60">
                  <CardTitle className="text-base flex items-center gap-2 text-slate-800 font-bold">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-sm">
                      <Hash className="h-4 w-4" />
                    </div>
                    Inverter Quantity Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="manual-inverter-count" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"></div>
                        Number of Inverters
                      </Label>
                      <Input
                        id="manual-inverter-count"
                        type="number"
                        min="1"
                        value={manualInverterCount}
                        onChange={(e) => handleManualInverterCountChange(e.target.value)}
                        className="w-full h-11 border-2 border-slate-200/70 bg-white hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 rounded-lg transition-all duration-300 hover:shadow-md font-medium"
                      />
                      <p className="text-xs text-muted-foreground font-medium">
                        Set the final number of {selectedInverter.manufacturer} {selectedInverter.model} inverters
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500"></div>
                        Final DC/AC Ratio
                      </Label>
                      <div className="p-3 h-11 border-2 border-slate-200/70 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg flex items-center shadow-sm">
                        <span className="text-base font-bold text-indigo-700">
                          {calculateDcAcRatio().toFixed(3)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        Ratio passed to PVWatts API (Ideal: 1.1-1.3)
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 rounded-lg bg-white border-2 border-indigo-200/30 shadow-sm">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600 font-medium mb-1">Total DC Capacity:</p>
                        <p className="font-bold text-slate-800 text-base">{totalSystemCapacity.toFixed(2)} kW</p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-medium mb-1">Total AC Capacity:</p>
                        <p className="font-bold text-slate-800 text-base">{(manualInverterCount * selectedInverter.nominal_ac_power_kw).toFixed(2)} kW</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InverterSelector;
