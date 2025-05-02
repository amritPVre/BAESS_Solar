
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SolarComponentsLibrary from "@/components/solar-components/SolarComponentsLibrary";
import { SolarPanel, SolarInverter } from "@/services/solarComponentsService";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Component as PanelIcon, 
  Zap, 
  Ruler, 
  Lightbulb 
} from "lucide-react";

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
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <PanelIcon className="h-5 w-5 text-primary" />
            Component Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-6">
            {/* Selected Component Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Selected Panel</h4>
                {selectedPanel ? (
                  <div className="rounded-lg border p-3 bg-card">
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
                ) : (
                  <div className="rounded-lg border border-dashed p-6 flex justify-center items-center text-muted-foreground">
                    No panel selected
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Selected Inverter</h4>
                {selectedInverter ? (
                  <div className="rounded-lg border p-3 bg-card">
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
                ) : (
                  <div className="rounded-lg border border-dashed p-6 flex justify-center items-center text-muted-foreground">
                    No inverter selected
                  </div>
                )}
              </div>
            </div>

            {/* Component Library */}
            <div className="mt-6">
              <SolarComponentsLibrary 
                onSelectPanel={onPanelSelect}
                onSelectInverter={onInverterSelect}
                selectedPanelId={selectedPanel?.id}
                selectedInverterId={selectedInverter?.id}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComponentSelector;
