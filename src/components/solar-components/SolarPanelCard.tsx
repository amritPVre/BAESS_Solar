
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SolarPanel } from "@/services/solarComponentsService";
import { Battery, Zap, Ruler, Waves, Lightbulb } from "lucide-react";

interface SolarPanelCardProps {
  panel: SolarPanel;
  onSelect?: (panel: SolarPanel) => void;
  isSelected?: boolean;
}

const SolarPanelCard: React.FC<SolarPanelCardProps> = ({ panel, onSelect, isSelected }) => {
  return (
    <Card className={`h-full ${isSelected ? 'border-solar border-2' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg truncate">{panel.model}</CardTitle>
        <CardDescription>{panel.manufacturer}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pb-4">
        <div className="flex items-center">
          <Zap className="w-4 h-4 mr-2 text-amber-500" />
          <span className="text-sm text-muted-foreground">Power: </span>
          <span className="ml-auto font-medium">{panel.nominal_power_w} W</span>
        </div>
        {panel.technology && (
          <div className="flex items-center">
            <Waves className="w-4 h-4 mr-2 text-blue-500" />
            <span className="text-sm text-muted-foreground">Technology: </span>
            <span className="ml-auto font-medium">{panel.technology}</span>
          </div>
        )}
        <div className="flex items-center">
          <Battery className="w-4 h-4 mr-2 text-green-500" />
          <span className="text-sm text-muted-foreground">Voc / Vmp: </span>
          <span className="ml-auto font-medium">{panel.voc_v} V / {panel.vmp_v} V</span>
        </div>
        <div className="flex items-center">
          <Battery className="w-4 h-4 mr-2 text-green-500" />
          <span className="text-sm text-muted-foreground">Isc / Imp: </span>
          <span className="ml-auto font-medium">{panel.isc_a} A / {panel.imp_a} A</span>
        </div>
        <div className="flex items-center">
          <Ruler className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-sm text-muted-foreground">Dimensions: </span>
          <span className="ml-auto font-medium">{panel.module_length}×{panel.module_width} mm</span>
        </div>
        <div className="flex items-center">
          <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
          <span className="text-sm text-muted-foreground">Efficiency: </span>
          <span className="ml-auto font-medium">{panel.efficiency_percent?.toFixed(2)}%</span>
        </div>
      </CardContent>
      {onSelect && (
        <CardFooter>
          <Button 
            className="w-full" 
            variant={isSelected ? "default" : "outline"}
            onClick={() => onSelect(panel)}
          >
            {isSelected ? "Selected" : "Select Panel"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default SolarPanelCard;
