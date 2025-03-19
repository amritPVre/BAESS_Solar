
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Info } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SolarChart from "./ui/SolarChart";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FinancialMetrics } from "@/utils/financialCalculator";

interface FinancialMetricsDisplayProps {
  financialMetrics: FinancialMetrics;
  currencySymbol: string;
}

const FinancialMetricsDisplay: React.FC<FinancialMetricsDisplayProps> = ({
  financialMetrics,
  currencySymbol
}) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const formatCurrency = (amount: number): string => {
    return `${currencySymbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };
  
  const formatNumber = (num: number, digits: number = 2): string => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  };
  
  const isPaybackReached = !isNaN(financialMetrics.payback_period) && 
                          isFinite(financialMetrics.payback_period) && 
                          financialMetrics.payback_period <= 25;
  
  // Prepare data for cash flow chart
  const cashFlowChartData = financialMetrics.cash_flows.map((cashFlow, index) => ({
    year: index,
    cashFlow,
    cumulativeCashFlow: financialMetrics.cash_flows.slice(0, index + 1)
      .reduce((sum, val) => sum + val, 0)
  }));
  
  // Calculate break-even point for annotation
  let breakEvenYear = null;
  let breakEvenValue = null;
  
  for (let i = 1; i < cashFlowChartData.length; i++) {
    if (cashFlowChartData[i-1].cumulativeCashFlow < 0 && 
        cashFlowChartData[i].cumulativeCashFlow >= 0) {
      // Interpolate to find exact break-even point
      const prev = cashFlowChartData[i-1];
      const curr = cashFlowChartData[i];
      const fraction = -prev.cumulativeCashFlow / (curr.cumulativeCashFlow - prev.cumulativeCashFlow);
      breakEvenYear = prev.year + fraction;
      breakEvenValue = 0;
      break;
    }
  }
  
  // Create yearly details chart data
  const revenueType = financialMetrics.summary.revenue_type.toLowerCase();
  
  const yearlyChartData = financialMetrics.yearly_details.map(detail => {
    return {
      year: detail.year,
      [revenueType]: detail[revenueType],
      expenses: detail.om_cost,
      netCashFlow: detail.net_cash_flow
    };
  });
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Financial Analysis Results</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="details">Yearly Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  Net Present Value 
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="ml-1 h-5 w-5 p-0">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Present value of all future cash flows</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(financialMetrics.npv)}</p>
                <p className="text-sm text-muted-foreground">At 8% discount rate</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  Internal Rate of Return
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="ml-1 h-5 w-5 p-0">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Discount rate that makes NPV zero</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatNumber(financialMetrics.irr)}%</p>
                <p className="text-sm text-muted-foreground">Annual return rate</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  Payback Period
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="ml-1 h-5 w-5 p-0">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Time to recover initial investment</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {isPaybackReached
                    ? `${Math.floor(financialMetrics.payback_period)} years and ${Math.round((financialMetrics.payback_period % 1) * 12)} months`
                    : "Not within 25 years"}
                </p>
                <p className="text-sm text-muted-foreground">Simple payback</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>25-Year Energy Production</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <span>Total Energy Production:</span>
                  <span className="font-bold">{formatNumber(financialMetrics.summary.total_energy_25yr, 0)} kWh</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span>System Type:</span>
                  <span className="font-bold">{financialMetrics.system_type}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span>Yearly Average:</span>
                  <span className="font-bold">
                    {formatNumber(financialMetrics.summary.total_energy_25yr / 25, 0)} kWh/year
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>25-Year Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <span>Total {financialMetrics.summary.revenue_type}:</span>
                  <span className="font-bold text-green-600">{formatCurrency(financialMetrics.summary.total_revenue_25yr)}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span>Total O&M Costs:</span>
                  <span className="font-bold text-red-600">{formatCurrency(financialMetrics.summary.total_om_cost_25yr)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Net {financialMetrics.summary.revenue_type}:</span>
                  <span className="font-bold">{formatCurrency(financialMetrics.summary.net_revenue_25yr)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {!isPaybackReached && (
            <Card className="bg-yellow-50 border-yellow-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-yellow-800">Note About Payback Period</CardTitle>
              </CardHeader>
              <CardContent className="text-yellow-800">
                <p>The project does not reach payback within the 25-year analysis period. This could be due to:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>High initial costs</li>
                  <li>Low energy production</li>
                  <li>Low electricity {financialMetrics.system_type === "Grid Export Only" ? "tariff" : "savings"}</li>
                  <li>High O&M costs</li>
                </ul>
                <p className="mt-2">Consider adjusting these parameters to improve financial viability.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="charts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payback Period & Cumulative Cash Flow</CardTitle>
              <CardDescription>
                This chart shows when your investment breaks even and your total returns over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <SolarChart
                data={cashFlowChartData}
                xKey="year"
                yKey="cumulativeCashFlow"
                title=""
                type="area"
                color="#0496FF"
                xLabel="Year"
                yLabel={`Amount (${currencySymbol})`}
                height={320}
                areaFillOpacity={0.2}
                yTickFormatter={(value) => formatCurrency(value)}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{financialMetrics.summary.revenue_type} vs Expenses</CardTitle>
              <CardDescription>
                Annual breakdown of revenue/savings and operation & maintenance costs
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <SolarChart
                data={yearlyChartData}
                xKey="year"
                barKeys={[revenueType, "expenses"]}
                lineKey="netCashFlow"
                title=""
                type="composed"
                colors={["#3366cc", "#ff9900", "#2ca02c"]}
                xLabel="Year"
                yLabel={`Amount (${currencySymbol})`}
                height={320}
                yTickFormatter={(value) => formatCurrency(value)}
                legend={[
                  { key: revenueType, label: financialMetrics.summary.revenue_type, color: "#3366cc" },
                  { key: "expenses", label: "O&M Expenses", color: "#ff9900" },
                  { key: "netCashFlow", label: "Net Cash Flow", color: "#2ca02c" }
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Year-by-Year Financial Details</CardTitle>
              <CardDescription>
                Detailed breakdown of energy production, revenue/savings, costs, and cash flow for each year
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Energy Output (kWh)</TableHead>
                    <TableHead>{financialMetrics.summary.revenue_type} ({currencySymbol})</TableHead>
                    <TableHead>O&M Cost ({currencySymbol})</TableHead>
                    <TableHead>Net Cash Flow ({currencySymbol})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialMetrics.yearly_details.map((year) => (
                    <TableRow key={year.year}>
                      <TableCell>{year.year}</TableCell>
                      <TableCell>{formatNumber(year.energy_output, 0)}</TableCell>
                      <TableCell>{formatCurrency(year[revenueType])}</TableCell>
                      <TableCell>{formatCurrency(year.om_cost)}</TableCell>
                      <TableCell 
                        className={year.net_cash_flow >= 0 ? "text-green-600" : "text-red-600"}
                      >
                        {formatCurrency(year.net_cash_flow)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button 
          onClick={() => window.print()} 
          className="bg-solar hover:bg-solar-dark text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Financial Analysis
        </Button>
      </div>
    </div>
  );
};

export default FinancialMetricsDisplay;
