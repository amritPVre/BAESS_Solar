
import React, { useEffect, useState } from "react";
import { formatCurrency, formatNumber } from "@/utils/calculations";
import DataCard from "@/components/ui/DataCard";
import SolarChart from "@/components/ui/SolarChart";
import { DollarSign, LineChart, BarChart3, TrendingUp, CalendarClock, Sun } from "lucide-react";

interface ResultsDisplayProps {
  lcoe: number;
  annualRevenue: number;
  annualCost: number;
  netPresentValue: number;
  irr: number;
  paybackPeriod: { years: number; months: number };
  yearlyProduction: number[];
  yearlyCashFlow: number[];
  cumulativeCashFlow: number[];
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  lcoe,
  annualRevenue,
  annualCost,
  netPresentValue,
  irr,
  paybackPeriod,
  yearlyProduction,
  yearlyCashFlow,
  cumulativeCashFlow
}) => {
  const [activeTab, setActiveTab] = useState("summary");
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  // Prepare data for charts
  const productionData = yearlyProduction.map((production, index) => ({
    year: index + 1,
    production: production
  }));

  const cashFlowData = yearlyCashFlow.map((cashFlow, index) => ({
    year: index,
    cashFlow: cashFlow,
    cumulativeCashFlow: cumulativeCashFlow[index]
  }));

  return (
    <div className={`glass-card rounded-xl p-6 shadow-sm transition-all duration-500 ${isVisible ? 'opacity-100 transform-none' : 'opacity-0 translate-y-4'}`}>
      <h2 className="section-title">Results</h2>
      
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 stagger-children">
        <DataCard
          title="Levelized Cost of Energy"
          value={`$${formatNumber(lcoe)}/kWh`}
          icon={<Sun className="h-5 w-5" />}
          className="bg-solar-gray hover:shadow-md transition-all duration-300"
        />
        
        <DataCard
          title="Annual Revenue"
          value={formatCurrency(annualRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          className="bg-solar-gray hover:shadow-md transition-all duration-300"
        />
        
        <DataCard
          title="Annual Cost"
          value={formatCurrency(annualCost)}
          icon={<BarChart3 className="h-5 w-5" />}
          className="bg-solar-gray hover:shadow-md transition-all duration-300"
        />
      </div>
      
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 stagger-children">
        <DataCard
          title="Net Present Value"
          value={formatCurrency(netPresentValue)}
          icon={<DollarSign className="h-5 w-5" />}
          className="bg-solar-gray hover:shadow-md transition-all duration-300"
        />
        
        <DataCard
          title="Internal Rate of Return"
          value={`${formatNumber(irr)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          className="bg-solar-gray hover:shadow-md transition-all duration-300"
        />
        
        <DataCard
          title="Simple Payback Period"
          value={`${paybackPeriod.years} years and ${paybackPeriod.months} months`}
          icon={<CalendarClock className="h-5 w-5" />}
          className="bg-solar-gray hover:shadow-md transition-all duration-300"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <SolarChart
          data={productionData}
          xKey="year"
          yKey="production"
          title="Annual Energy Production over 25 Years"
          type="bar"
          color="#4CB571"
          xLabel="Year"
          yLabel="kWh"
          height={300}
          yTickFormatter={(value) => `${formatNumber(value)} kWh`}
        />
        
        <SolarChart
          data={cashFlowData.slice(0, 26)}
          xKey="year"
          yKey="cashFlow"
          yKey2="cumulativeCashFlow"
          title="Annual Cash Flow & Cumulative Cash Flow"
          type="line"
          color="#4CB571"
          color2="#0496FF"
          xLabel="Year"
          yLabel="$"
          height={300}
          yTickFormatter={(value) => `$${formatNumber(value)}`}
        />
      </div>
      
      <div className="mt-8">
        <SolarChart
          data={cumulativeCashFlow.map((value, index) => ({ year: index, value }))}
          xKey="year"
          yKey="value"
          title="Cumulative Cash Flow over System Lifetime"
          type="area"
          color="#0496FF"
          xLabel="Year"
          yLabel="$"
          height={300}
          areaFillOpacity={0.1}
          yTickFormatter={(value) => `$${formatNumber(value)}`}
        />
      </div>
    </div>
  );
};

export default ResultsDisplay;
