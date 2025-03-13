
import React from "react";
import { formatNumber } from "@/utils/calculations";
import DataCard from "@/components/ui/DataCard";
import { Tree, Cloud, Car } from "lucide-react";

interface EnvironmentalBenefitsProps {
  co2Reduction: number;
  treesEquivalent: number;
  vehicleMilesOffset: number;
}

const EnvironmentalBenefits: React.FC<EnvironmentalBenefitsProps> = ({
  co2Reduction,
  treesEquivalent,
  vehicleMilesOffset
}) => {
  return (
    <div className="glass-card rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <h2 className="section-title">Environmental Benefits</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <DataCard
          title="CO2 Reduction"
          value={`${formatNumber(co2Reduction)} kg/year`}
          icon={<Cloud className="h-5 w-5" />}
          className="bg-solar-gray hover:shadow-md transition-all duration-300 animate-float"
        />
        
        <DataCard
          title="Trees Planted Equivalent"
          value={`${formatNumber(treesEquivalent)}`}
          icon={<Tree className="h-5 w-5" />}
          className="bg-solar-gray hover:shadow-md transition-all duration-300 animate-float"
          valueClassName="text-xl font-semibold"
        />
        
        <DataCard
          title="Vehicle Miles Offset"
          value={`${formatNumber(vehicleMilesOffset)}`}
          icon={<Car className="h-5 w-5" />}
          className="bg-solar-gray hover:shadow-md transition-all duration-300 animate-float"
          valueClassName="text-xl font-semibold"
        />
      </div>
    </div>
  );
};

export default EnvironmentalBenefits;
