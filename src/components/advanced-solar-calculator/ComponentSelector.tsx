
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SolarPanel, SolarInverter, fetchSolarPanels, fetchSolarInverters, fetchPanelManufacturers, fetchInverterManufacturers } from "@/services/solarComponentsService";
import { toast } from "sonner";
import { Component as PanelIcon, Zap, Ruler, Lightbulb, Search } from "lucide-react";

interface ComponentSelectorProps {
  onPanelSelect: (panel: SolarPanel | null) => void;
  onInverterSelect: (inverter: SolarInverter | null) => void;
  selectedPanel: SolarPanel | null;
  selectedInverter: SolarInverter | null;
}

const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  onPanelSelect,
  onInverterSelect,
  selectedPanel,
  selectedInverter
}) => {
  // States for manufacturer selection
  const [panelManufacturers, setPanelManufacturers] = useState<string[]>([]);
  const [inverterManufacturers, setInverterManufacturers] = useState<string[]>([]);
  
  // States for selected manufacturers
  const [selectedPanelManufacturer, setSelectedPanelManufacturer] = useState<string>("");
  const [selectedInverterManufacturer, setSelectedInverterManufacturer] = useState<string>("");
  
  // States for components lists
  const [availablePanels, setAvailablePanels] = useState<SolarPanel[]>([]);
  const [availableInverters, setAvailableInverters] = useState<SolarInverter[]>([]);
  
  // Loading states
  const [loadingPanelManufacturers, setLoadingPanelManufacturers] = useState(true);
  const [loadingInverterManufacturers, setLoadingInverterManufacturers] = useState(true);
  const [loadingPanels, setLoadingPanels] = useState(false);
  const [loadingInverters, setLoadingInverters] = useState(false);

  // Fetch manufacturers on initial load
  useEffect(() => {
    const loadManufacturers = async () => {
      try {
        setLoadingPanelManufacturers(true);
        setLoadingInverterManufacturers(true);
        
        const panelMfrs = await fetchPanelManufacturers();
        const inverterMfrs = await fetchInverterManufacturers();
        
        setPanelManufacturers(panelMfrs);
        setInverterManufacturers(inverterMfrs);
      } catch (error) {
        console.error("Failed to load manufacturers:", error);
        toast.error("Failed to load component manufacturers");
      } finally {
        setLoadingPanelManufacturers(false);
        setLoadingInverterManufacturers(false);
      }
    };
    
    loadManufacturers();
  }, []);

  // Load panels when manufacturer is selected
  useEffect(() => {
    const loadPanels = async () => {
      if (!selectedPanelManufacturer) {
        setAvailablePanels([]);
        return;
      }
      
      try {
        setLoadingPanels(true);
        const panels = await fetchSolarPanels("", selectedPanelManufacturer);
        setAvailablePanels(panels);
      } catch (error) {
        console.error("Failed to load panels:", error);
        toast.error("Failed to load solar panels");
      } finally {
        setLoadingPanels(false);
      }
    };
    
    loadPanels();
  }, [selectedPanelManufacturer]);

  // Load inverters when manufacturer is selected
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
      } catch (error) {
        console.error("Failed to load inverters:", error);
        toast.error("Failed to load solar inverters");
      } finally {
        setLoadingInverters(false);
      }
    };
    
    loadInverters();
  }, [selectedInverterManufacturer]);

  // Handle panel selection
  const handlePanelSelect = (panelId: string) => {
    const panel = availablePanels.find(p => p.id === panelId);
    if (panel) {
      onPanelSelect(panel);
    }
  };

  // Handle inverter selection
  const handleInverterSelect = (inverterId: string) => {
    const inverter = availableInverters.find(i => i.id === inverterId);
    if (inverter) {
      onInverterSelect(inverter);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <PanelIcon className="h-5 w-5 text-primary" />
            Component Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Panel Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Solar Panel Selection</h3>
              
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Manufacturer</label>
                <Select
                  value={selectedPanelManufacturer}
                  onValueChange={setSelectedPanelManufacturer}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select manufacturer" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingPanelManufacturers ? (
                      <div className="flex items-center justify-center p-2">
                        <div className="animate-spin h-4 w-4 border-b-2 rounded-full border-primary"></div>
                      </div>
                    ) : (
                      panelManufacturers.map(manufacturer => (
                        <SelectItem key={manufacturer} value={manufacturer}>
                          {manufacturer}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Model</label>
                <Select
                  value={selectedPanel?.id || ""}
                  onValueChange={handlePanelSelect}
                  disabled={!selectedPanelManufacturer || loadingPanels}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select panel model" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingPanels ? (
                      <div className="flex items-center justify-center p-2">
                        <div className="animate-spin h-4 w-4 border-b-2 rounded-full border-primary"></div>
                      </div>
                    ) : availablePanels.length > 0 ? (
                      <SelectGroup>
                        {availablePanels.map(panel => (
                          <SelectItem key={panel.id} value={panel.id}>
                            {panel.model} ({panel.nominal_power_w}W)
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ) : selectedPanelManufacturer ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No panels found for this manufacturer
                      </div>
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        Select a manufacturer first
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Panel Details */}
              {selectedPanel && (
                <div className="rounded-lg border p-3 bg-card mt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{selectedPanel.manufacturer} {selectedPanel.model}</p>
                      <Badge variant="outline" className="mt-1">
                        {selectedPanel.technology || "Standard"}
                      </Badge>
                    </div>
                    <Badge variant="secondary">{selectedPanel.nominal_power_w}W</Badge>
                  </div>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span>{selectedPanel.vmp_v}V / {selectedPanel.imp_a}A</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ruler className="h-3.5 w-3.5 text-blue-500" />
                      <span>{selectedPanel.module_length}×{selectedPanel.module_width}mm</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
                      <span>Efficiency: {selectedPanel.efficiency_percent?.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Inverter Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Solar Inverter Selection</h3>
              
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Manufacturer</label>
                <Select
                  value={selectedInverterManufacturer}
                  onValueChange={setSelectedInverterManufacturer}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select manufacturer" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingInverterManufacturers ? (
                      <div className="flex items-center justify-center p-2">
                        <div className="animate-spin h-4 w-4 border-b-2 rounded-full border-primary"></div>
                      </div>
                    ) : (
                      inverterManufacturers.map(manufacturer => (
                        <SelectItem key={manufacturer} value={manufacturer}>
                          {manufacturer}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Model</label>
                <Select
                  value={selectedInverter?.id || ""}
                  onValueChange={handleInverterSelect}
                  disabled={!selectedInverterManufacturer || loadingInverters}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select inverter model" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingInverters ? (
                      <div className="flex items-center justify-center p-2">
                        <div className="animate-spin h-4 w-4 border-b-2 rounded-full border-primary"></div>
                      </div>
                    ) : availableInverters.length > 0 ? (
                      <SelectGroup>
                        {availableInverters.map(inverter => (
                          <SelectItem key={inverter.id} value={inverter.id}>
                            {inverter.model} ({inverter.nominal_ac_power_kw}kW)
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ) : selectedInverterManufacturer ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No inverters found for this manufacturer
                      </div>
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        Select a manufacturer first
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Inverter Details */}
              {selectedInverter && (
                <div className="rounded-lg border p-3 bg-card mt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{selectedInverter.manufacturer} {selectedInverter.model}</p>
                      <Badge variant="outline" className="mt-1">
                        {selectedInverter.phase || "Single"} Phase
                      </Badge>
                    </div>
                    <Badge variant="secondary">{selectedInverter.nominal_ac_power_kw}kW</Badge>
                  </div>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span>MPPT: {selectedInverter.total_mppt || 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-blue-500" />
                      <span>Strings: {selectedInverter.total_string_inputs || 1}</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <Zap className="h-3.5 w-3.5 text-green-500" />
                      <span>MPPT Range: {selectedInverter.min_mpp_voltage_v}-{selectedInverter.max_dc_voltage_v}V</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComponentSelector;
