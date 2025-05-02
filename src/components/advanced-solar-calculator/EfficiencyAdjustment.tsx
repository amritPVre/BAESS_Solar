
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SolarPanel } from "@/services/solarComponentsService";
import { Badge } from "@/components/ui/badge";
import { ClipboardList } from "lucide-react";

interface EfficiencyAdjustmentProps {
  selectedPanel: SolarPanel | null;
  systemCapacity: number;
}

interface EfficiencyAdjustment {
  moduleType: number;
  moduleTypeName: string;
  adjustmentFactor: number;
  adjustedCapacity: number;
}

// PVWatts module type efficiency values
const PVWATTS_MODULE_EFFICIENCIES = {
  STANDARD: 15, // Standard module (15% efficient)
  PREMIUM: 19,  // Premium module (19% efficient)
  THIN_FILM: 10 // Thin film module (10% efficient)
};

const EfficiencyAdjustmentComponent: React.FC<EfficiencyAdjustmentProps> = ({
  selectedPanel,
  systemCapacity
}) => {
  if (!selectedPanel) return null;

  // Calculate efficiency adjustment
  const calculateEfficiencyAdjustment = (): EfficiencyAdjustment => {
    const panelEfficiency = selectedPanel.efficiency_percent || 15;
    
    // Determine closest PVWatts module type based on efficiency
    let moduleType = 0; // Default to standard
    let moduleTypeName = 'Standard';
    let closestEfficiency = PVWATTS_MODULE_EFFICIENCIES.STANDARD;
    
    // Find closest match
    if (Math.abs(panelEfficiency - PVWATTS_MODULE_EFFICIENCIES.PREMIUM) < 
        Math.abs(panelEfficiency - closestEfficiency)) {
      moduleType = 1;
      moduleTypeName = 'Premium';
      closestEfficiency = PVWATTS_MODULE_EFFICIENCIES.PREMIUM;
    }
    
    if (Math.abs(panelEfficiency - PVWATTS_MODULE_EFFICIENCIES.THIN_FILM) < 
        Math.abs(panelEfficiency - closestEfficiency)) {
      moduleType = 2;
      moduleTypeName = 'Thin Film';
      closestEfficiency = PVWATTS_MODULE_EFFICIENCIES.THIN_FILM;
    }
    
    // Calculate adjustment factor
    const adjustmentFactor = panelEfficiency / closestEfficiency;
    
    // Calculate adjusted capacity
    const adjustedCapacity = systemCapacity * adjustmentFactor;
    
    return {
      moduleType,
      moduleTypeName,
      adjustmentFactor,
      adjustedCapacity
    };
  };

  const efficiencyAdjustment = calculateEfficiencyAdjustment();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Design Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">System Size:</span>
              <Badge>{systemCapacity} kW</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Panel Type:</span>
              <Badge variant="outline">{selectedPanel.manufacturer} {selectedPanel.model}</Badge>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Panel Efficiency:</span>
              <Badge variant="secondary">{selectedPanel.efficiency_percent?.toFixed(1)}%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">PVWatts Module Type:</span>
              <Badge variant="secondary">{efficiencyAdjustment.moduleTypeName}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EfficiencyAdjustmentComponent;
