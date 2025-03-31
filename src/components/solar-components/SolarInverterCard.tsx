
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SolarInverter } from "@/services/solarComponentsService";
import { Zap, Battery, Grid, ListFilter, Layers } from "lucide-react";

interface SolarInverterCardProps {
  inverter: SolarInverter;
  onSelect?: (inverter: SolarInverter) => void;
  isSelected?: boolean;
}

const SolarInverterCard: React.FC<SolarInverterCardProps> = ({ inverter, onSelect, isSelected }) => {
  return (
    <Card className={`h-full ${isSelected ? 'border-solar border-2' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg truncate">{inverter.model}</CardTitle>
        <CardDescription>{inverter.manufacturer}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pb-4">
        <div className="flex items-center">
          <Zap className="w-4 h-4 mr-2 text-amber-500" />
          <span className="text-sm text-muted-foreground">Nominal AC Power: </span>
          <span className="ml-auto font-medium">{inverter.nominal_ac_power_kw} kW</span>
        </div>
        {inverter.maximum_ac_power_kw && (
          <div className="flex items-center">
            <Zap className="w-4 h-4 mr-2 text-amber-500" />
            <span className="text-sm text-muted-foreground">Max AC Power: </span>
            <span className="ml-auto font-medium">{inverter.maximum_ac_power_kw} kW</span>
          </div>
        )}
        <div className="flex items-center">
          <Grid className="w-4 h-4 mr-2 text-blue-500" />
          <span className="text-sm text-muted-foreground">Phase: </span>
          <span className="ml-auto font-medium">{inverter.phase || 'Single'}</span>
        </div>
        {inverter.topology && (
          <div className="flex items-center">
            <Layers className="w-4 h-4 mr-2 text-purple-500" />
            <span className="text-sm text-muted-foreground">Topology: </span>
            <span className="ml-auto font-medium">{inverter.topology}</span>
          </div>
        )}
        <div className="flex items-center">
          <Battery className="w-4 h-4 mr-2 text-green-500" />
          <span className="text-sm text-muted-foreground">MPPT V Range: </span>
          <span className="ml-auto font-medium">{inverter.min_mpp_voltage_v}-{inverter.max_dc_voltage_v} V</span>
        </div>
        <div className="flex items-center">
          <ListFilter className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-sm text-muted-foreground">MPPTs / Strings: </span>
          <span className="ml-auto font-medium">{inverter.total_mppt} / {inverter.total_string_inputs}</span>
        </div>
      </CardContent>
      {onSelect && (
        <CardFooter>
          <Button 
            className="w-full" 
            variant={isSelected ? "default" : "outline"}
            onClick={() => onSelect(inverter)}
          >
            {isSelected ? "Selected" : "Select Inverter"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default SolarInverterCard;
