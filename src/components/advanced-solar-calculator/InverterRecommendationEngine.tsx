import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SolarPanel, SolarInverter } from "@/services/solarComponentsService";
import { Zap, Calculator, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface InverterRecommendation {
  inverter: SolarInverter;
  dcAcRatio: number;
  requiredQuantity: number;
  totalInverterCapacity: number;
  isOptimal: boolean;
  isAcceptable: boolean;
  reasonText: string;
}

interface InverterRecommendationEngineProps {
  availableInverters: SolarInverter[];
  selectedPanel: SolarPanel | null;
  totalSystemCapacity: number; // Original capacity from area calculation
  onInverterSelect: (recommendation: InverterRecommendation | null) => void;
  selectedInverter: SolarInverter | null;
}

// PVWatts module type efficiency values for adjustment calculation
const PVWATTS_MODULE_EFFICIENCIES = {
  STANDARD: 15, // Standard module (15% efficient)
  PREMIUM: 19,  // Premium module (19% efficient)
  THIN_FILM: 10 // Thin film module (10% efficient)
};

// DC/AC ratio constraints
const DC_AC_RATIO_CONSTRAINTS = {
  MIN: 0.9,
  MAX: 1.25,
  OPTIMAL_MIN: 1.1,
  OPTIMAL_MAX: 1.2
};

const InverterRecommendationEngine: React.FC<InverterRecommendationEngineProps> = ({
  availableInverters,
  selectedPanel,
  totalSystemCapacity,
  onInverterSelect,
  selectedInverter
}) => {
  const [recommendations, setRecommendations] = useState<InverterRecommendation[]>([]);

  // Step 1: Calculate efficiency adjustment
  const efficiencyAdjustment = useMemo(() => {
    if (!selectedPanel || !selectedPanel.efficiency_percent) {
      return {
        actualEfficiency: 15,
        closestPVWattsEfficiency: 15,
        adjustmentFactor: 1.0,
        moduleTypeName: 'Standard'
      };
    }

    const actualEfficiency = selectedPanel.efficiency_percent;
    
    // Find closest PVWatts module type
    let closestEfficiency = PVWATTS_MODULE_EFFICIENCIES.STANDARD;
    let moduleTypeName = 'Standard';
    
    const standardDiff = Math.abs(actualEfficiency - PVWATTS_MODULE_EFFICIENCIES.STANDARD);
    const premiumDiff = Math.abs(actualEfficiency - PVWATTS_MODULE_EFFICIENCIES.PREMIUM);
    const thinFilmDiff = Math.abs(actualEfficiency - PVWATTS_MODULE_EFFICIENCIES.THIN_FILM);
    
    if (premiumDiff < standardDiff && premiumDiff < thinFilmDiff) {
      closestEfficiency = PVWATTS_MODULE_EFFICIENCIES.PREMIUM;
      moduleTypeName = 'Premium';
    } else if (thinFilmDiff < standardDiff && thinFilmDiff < premiumDiff) {
      closestEfficiency = PVWATTS_MODULE_EFFICIENCIES.THIN_FILM;
      moduleTypeName = 'Thin Film';
    }
    
    const adjustmentFactor = actualEfficiency / closestEfficiency;
    
    return {
      actualEfficiency,
      closestPVWattsEfficiency: closestEfficiency,
      adjustmentFactor,
      moduleTypeName
    };
  }, [selectedPanel]);

  // Step 2: Calculate adjusted capacity
  const adjustedCapacity = useMemo(() => {
    return totalSystemCapacity * efficiencyAdjustment.adjustmentFactor;
  }, [totalSystemCapacity, efficiencyAdjustment.adjustmentFactor]);

  // Step 3: Generate inverter recommendations
  useEffect(() => {
    if (availableInverters.length === 0 || totalSystemCapacity <= 0) {
      setRecommendations([]);
      return;
    }

    const newRecommendations: InverterRecommendation[] = [];
    
    // For each inverter, consider multiple quantity options
    availableInverters.forEach(inverter => {
      const inverterPowerKw = inverter.nominal_ac_power_kw || 0;
      
      if (inverterPowerKw <= 0) return;
      
      // Calculate minimum quantity needed - using totalSystemCapacity (actual drawn capacity)
      const minQuantity = Math.max(1, Math.ceil(totalSystemCapacity / inverterPowerKw / DC_AC_RATIO_CONSTRAINTS.MAX));
      
      // Calculate maximum quantity that would still be acceptable (not too low DC/AC ratio)
      const maxQuantity = Math.floor(totalSystemCapacity / inverterPowerKw / DC_AC_RATIO_CONSTRAINTS.MIN);
      
      // Consider each quantity option from min to max
      for (let quantity = minQuantity; quantity <= maxQuantity; quantity++) {
        const totalInverterCapacity = quantity * inverterPowerKw;
        
        // Calculate DC/AC ratio based on actual drawn capacity (totalSystemCapacity)
        const dcAcRatio = totalSystemCapacity / totalInverterCapacity;
        
        // Check if DC/AC ratio is within acceptable range
        const isAcceptable = dcAcRatio >= DC_AC_RATIO_CONSTRAINTS.MIN && 
                            dcAcRatio <= DC_AC_RATIO_CONSTRAINTS.MAX;
        
        if (!isAcceptable) continue; // Skip unacceptable configurations
        
        // Simplified reasoning - just show the DC/AC ratio is acceptable
        const reasonText = 'Acceptable DC/AC ratio';
        
        newRecommendations.push({
          inverter,
          dcAcRatio,
          requiredQuantity: quantity,
          totalInverterCapacity,
          isOptimal: false, // No longer using optimal flag
          isAcceptable,
          reasonText
        });
      }
    });
    
    // Sort recommendations
    newRecommendations.sort((a, b) => {
      // Sort by quantity (smallest to largest)
      return a.requiredQuantity - b.requiredQuantity;
    });

    setRecommendations(newRecommendations);
  }, [availableInverters, totalSystemCapacity]);

  const handleInverterSelect = (recommendation: InverterRecommendation) => {
    onInverterSelect(recommendation);
  };

  if (!selectedPanel || totalSystemCapacity <= 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please select a panel and calculate system capacity first.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Inverter Recommendations */}
      <div className="space-y-3">
        {recommendations.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              No suitable inverters found for {totalSystemCapacity.toFixed(1)} kW. 
              Consider different inverter models.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <Card
                key={`${recommendation.inverter.id}-${recommendation.requiredQuantity}`}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedInverter?.id === recommendation.inverter.id
                    ? 'ring-2 ring-green-500 bg-green-50'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleInverterSelect(recommendation)}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">
                          {recommendation.inverter.manufacturer} {recommendation.inverter.model}
                        </h4>
                        {selectedInverter?.id === recommendation.inverter.id && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs py-0">
                            Selected
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {recommendation.inverter.nominal_ac_power_kw} kW • {recommendation.inverter.phase || 'Single'} Phase
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="text-right">
                        <p className="text-muted-foreground">Qty</p>
                        <p className="font-semibold">{recommendation.requiredQuantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">DC/AC</p>
                        <p className="font-semibold text-blue-600">
                          {(recommendation.dcAcRatio * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InverterRecommendationEngine; 