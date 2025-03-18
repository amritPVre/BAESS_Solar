
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, LineChart, DollarSign, TrendingUp, CalendarClock } from "lucide-react";
import SolarChart from "./ui/SolarChart";
import { formatCurrency, formatNumber } from "@/utils/calculations";
import { FinancialMetrics } from "@/utils/financialCalculator";

interface FinancialMetricsDisplayProps {
  financialMetrics: FinancialMetrics;
  currencySymbol: string;
}

const FinancialMetricsDisplay: React.FC<FinancialMetricsDisplayProps> = ({
  financialMetrics,
  currencySymbol
}) => {
  const [activeTab, setActiveTab] = useState("summary");
  
  const isInfinitePayback = !Number.isFinite(financialMetrics.payback_period) || 
                           financialMetrics.payback_period > 25;
  
  const paybackText = isInfinitePayback
    ? "Project does not reach payback within 25 years"
    : `${Math.floor(financialMetrics.payback_period)} years and ${Math.floor((financialMetrics.payback_period % 1) * 12)} months`;
  
  const revenueType = financialMetrics.summary.revenue_type;
  
  // Prepare data for charts
  const cashFlowData = financialMetrics.cash_flows.map((cashFlow, index) => ({
    year: index,
    cashFlow: cashFlow
  }));
  
  const cumulativeCashFlow = financialMetrics.cash_flows.reduce(
    (acc: number[], val, idx) => {
      const prevTotal = idx > 0 ? acc[idx - 1] : 0;
      acc.push(prevTotal + val);
      return acc;
    }, 
    []
  );
  
  const cumulativeCashFlowData = cumulativeCashFlow.map((value, index) => ({
    year: index,
    value: value
  }));
  
  const yearlyRevenueData = financialMetrics.yearly_details.map((detail) => ({
    year: detail.year,
    revenue: detail.revenue || detail.savings || 0,
    omCost: detail.om_cost,
    netCashFlow: detail.net_cash_flow
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Financial Analysis Results (25 Year Period)</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-solar-50/50 hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-8 w-8 text-solar-dark" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Present Value</p>
                  <p className="text-2xl font-bold">{currencySymbol}{formatNumber(financialMetrics.npv)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-solar-50/50 hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-solar-dark" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Internal Rate of Return</p>
                  <p className="text-2xl font-bold">{formatNumber(financialMetrics.irr)}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-solar-50/50 hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CalendarClock className="h-8 w-8 text-solar-dark" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Simple Payback Period</p>
                  <p className="text-2xl font-bold">{paybackText}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-2">
              <h3 className="text-lg font-medium">25-Year Performance Summary</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Energy Generation:</span>
                <span className="font-medium">{formatNumber(financialMetrics.summary.total_energy_25yr)} kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total {revenueType}:</span>
                <span className="font-medium">{currencySymbol}{formatNumber(financialMetrics.summary.total_revenue_25yr)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total O&M Costs:</span>
                <span className="font-medium">{currencySymbol}{formatNumber(financialMetrics.summary.total_om_cost_25yr)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Net {revenueType}:</span>
                <span>{currencySymbol}{formatNumber(financialMetrics.summary.net_revenue_25yr)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-2">
              <h3 className="text-lg font-medium">Additional Metrics</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Return on Investment (Annual Avg):</span>
                <span className="font-medium">{formatNumber(financialMetrics.roi)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Initial Investment:</span>
                <span className="font-medium">{currencySymbol}{formatNumber(Math.abs(financialMetrics.cash_flows[0]))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Annual Cash Flow:</span>
                <span className="font-medium">
                  {currencySymbol}{formatNumber(
                    financialMetrics.cash_flows.slice(1).reduce((sum, val) => sum + val, 0) / 
                    (financialMetrics.cash_flows.length - 1)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">System Type:</span>
                <span className="font-medium">{financialMetrics.system_type}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {isInfinitePayback && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 text-amber-700">
          <p className="font-medium">⚠️ Note: The project does not reach payback within the 25-year analysis period.</p>
          <p className="text-sm mt-1">
            This could be due to high initial costs, low energy production, low electricity tariff, or high O&M costs.
            Consider adjusting these parameters to improve financial viability.
          </p>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="payback">
            <LineChart className="h-4 w-4 mr-2" />
            Payback Analysis
          </TabsTrigger>
          <TabsTrigger value="cashflow">
            <BarChart3 className="h-4 w-4 mr-2" />
            Revenue vs Expenses
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="payback">
          <Card>
            <CardHeader>
              <CardTitle>Payback Period & Cumulative Cash Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <SolarChart
                data={cumulativeCashFlowData}
                xKey="year"
                yKey="value"
                title=""
                type="line"
                color="#2ca02c"
                xLabel="Year"
                yLabel={`Cash Flow (${currencySymbol})`}
                height={350}
                yTickFormatter={(value) => `${currencySymbol}${formatNumber(value)}`}
              />
              
              <div className="mt-4 text-sm text-muted-foreground">
                <p>This chart visualizes the cumulative cash flow over the project lifetime. The break-even point occurs when the line crosses the zero mark.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <CardTitle>25-Year {revenueType} vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <SolarChart
                data={yearlyRevenueData}
                xKey="year"
                barKeys={["revenue", "omCost"]}
                lineKey="netCashFlow"
                title=""
                type="composed"
                colors={["#3366cc", "#ff9900", "#2ca02c"]}
                xLabel="Year"
                yLabel={`Amount (${currencySymbol})`}
                height={350}
                yTickFormatter={(value) => `${currencySymbol}${formatNumber(value)}`}
                legend={[
                  { key: "revenue", label: revenueType, color: "#3366cc" },
                  { key: "omCost", label: "O&M Expenses", color: "#ff9900" },
                  { key: "netCashFlow", label: "Net Cash Flow", color: "#2ca02c" }
                ]}
              />
              
              <div className="mt-4 text-sm text-muted-foreground">
                <p>This chart compares your annual {revenueType.toLowerCase()} against operation & maintenance expenses.</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>{revenueType} typically decreases slightly over time due to module degradation</li>
                  <li>O&M expenses increase over time due to the escalation rate</li>
                  <li>The green line represents your annual financial benefit</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-2">Yearly Breakdown</h3>
        <div className="border rounded-md overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground tracking-wider">Year</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground tracking-wider">Energy Output (kWh)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground tracking-wider">{revenueType} ({currencySymbol})</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground tracking-wider">O&M Cost ({currencySymbol})</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground tracking-wider">Net Cash Flow ({currencySymbol})</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {financialMetrics.yearly_details.map((year) => (
                <tr key={year.year} className="hover:bg-muted/20">
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{year.year}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{formatNumber(year.energy_output)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{currencySymbol}{formatNumber(year.revenue || year.savings || 0)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{currencySymbol}{formatNumber(year.om_cost)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{currencySymbol}{formatNumber(year.net_cash_flow)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialMetricsDisplay;
