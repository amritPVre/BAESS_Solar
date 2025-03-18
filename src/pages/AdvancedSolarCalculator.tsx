
import React from "react";
import { Helmet } from "react-helmet";
import AdvancedSolarCalculator from "@/components/AdvancedSolarCalculator";

const AdvancedSolarCalculatorPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <Helmet>
        <title>Advanced Solar Calculator | Solar Financial Tool</title>
      </Helmet>
      
      <AdvancedSolarCalculator />
    </div>
  );
};

export default AdvancedSolarCalculatorPage;
