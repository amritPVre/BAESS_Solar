
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import SolarChart from "@/components/ui/SolarChart";
import { FinancialMetrics } from "@/utils/financialCalculator";
import { formatNumber } from "@/utils/calculations";
import { DollarSign, BarChart3, LineChart, TrendingUp, Clock } from "lucide-react";

interface FinancialMetricsDisplayProps {
  financialMetrics: FinancialMetrics;
  currencySymbol: string;
}

const FinancialMetricsDisplay: React.FC<FinancialMetricsDisplayProps> = ({
  financialMetrics,
  currencySymbol
}) => {
  const revenueType = financialMetrics.summary.revenue_type;
  const paybackText = 
    !isFinite(financialMetrics.payback_period) || financialMetrics.payback_period > 25
      ? "Project does not reach payback within 25 years"
      : `${Math.floor(financialMetrics.payback_period)} years and ${Math.round((financialMetrics.payback_period % 1) * 12)} months`;

  // Create cash flow data for charts
  const cashFlowData = financialMetrics.cash_flows.map((value, index) => ({
    year: index,
    cashFlow: value
  }));

  // Calculate cumulative cash flows
  const cumulativeCashFlows = financialMetrics.cash_flows.reduce(
    (acc: number[], val, idx) => {
      const prevTotal = idx > 0 ? acc[idx - 1] : 0;
      acc.push(prevTotal + val);
      return acc;
    },
    []
  );

  const cumulativeCashFlowData = cumulativeCashFlows.map((value, index) => ({
    year: index,
    cumulativeCashFlow: value
  }));

  // Extract yearly details for charts
  const revenueKey = revenueType.toLowerCase() === 'revenue' ? 'revenue' : 'savings';
  const yearlyDetailsData = financialMetrics.yearly_details.map(detail => ({
    year: detail.year,
    [revenueKey]: detail[revenueKey as keyof typeof detail] as number,
    omCost: detail.om_cost,
    netCashFlow: detail.net_cash_flow
  }));

  // Find break-even point (for chart annotation)
  const breakEvenYear = cumulativeCashFlows.findIndex((value, index) => 
    index > 0 && cumulativeCashFlows[index - 1] < 0 && value >= 0
  );

  // Format IRR and ROI with appropriate precision
  const formatPercentage = (value: number) => {
    if (value > 100) return value.toFixed(0) + '%';
    if (value > 10) return value.toFixed(1) + '%';
    return value.toFixed(2) + '%';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* NPV Card */}
        <Card className="bg-white dark:bg-zinc-900">
          <CardContent className="p-4">
            <div className="flex flex-col items-center justify-center space-y-2 text-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Present Value</CardTitle>
              <p className="text-2xl font-bold">
                {financialMetrics.npv >= 0 ? '+' : ''}
                {currencySymbol}{formatNumber(financialMetrics.npv)}
              </p>
              <Badge variant={financialMetrics.npv >= 0 ? "success" : "destructive"} className="mt-1">
                {financialMetrics.npv >= 0 ? 'Profitable' : 'Not Profitable'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* IRR Card */}
        <Card className="bg-white dark:bg-zinc-900">
          <CardContent className="p-4">
            <div className="flex flex-col items-center justify-center space-y-2 text-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">Internal Rate of Return</CardTitle>
              <p className="text-2xl font-bold">
                {formatPercentage(financialMetrics.irr)}
              </p>
              <Badge variant={financialMetrics.irr >= 8 ? "success" : 
                          (financialMetrics.irr >= 5 ? "outline" : "destructive")} className="mt-1">
                {financialMetrics.irr >= 8 ? 'Strong' : 
                 (financialMetrics.irr >= 5 ? 'Moderate' : 'Weak')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* ROI Card */}
        <Card className="bg-white dark:bg-zinc-900">
          <CardContent className="p-4">
            <div className="flex flex-col items-center justify-center space-y-2 text-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">Annual Avg. ROI</CardTitle>
              <p className="text-2xl font-bold">
                {formatPercentage(financialMetrics.roi)}
              </p>
              <Badge variant={financialMetrics.roi >= 8 ? "success" : 
                          (financialMetrics.roi >= 5 ? "outline" : "destructive")} className="mt-1">
                {financialMetrics.roi >= 8 ? 'Strong' : 
                 (financialMetrics.roi >= 5 ? 'Moderate' : 'Weak')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Payback Period Card */}
        <Card className="bg-white dark:bg-zinc-900">
          <CardContent className="p-4">
            <div className="flex flex-col items-center justify-center space-y-2 text-center">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">Payback Period</CardTitle>
              <p className="text-2xl font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                {Math.floor(financialMetrics.payback_period) < 100 ? paybackText : "N/A"}
              </p>
              <Badge variant={financialMetrics.payback_period <= 10 ? "success" : 
                          (financialMetrics.payback_period <= 15 ? "outline" : "destructive")} className="mt-1">
                {financialMetrics.payback_period <= 10 ? 'Quick' : 
                 (financialMetrics.payback_period <= 15 ? 'Moderate' : 'Long')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>25-Year Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/40 rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground">Total Energy</h4>
              <p className="text-2xl font-bold mt-1">{formatNumber(financialMetrics.summary.total_energy_25yr)} kWh</p>
              <p className="text-xs text-muted-foreground mt-1">Including 0.6% annual degradation</p>
            </div>
            
            <div className="p-4 bg-muted/40 rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground">Total {revenueType}</h4>
              <p className="text-2xl font-bold mt-1">{currencySymbol}{formatNumber(financialMetrics.summary.total_revenue_25yr)}</p>
              <p className="text-xs text-muted-foreground mt-1">Over 25-year project lifetime</p>
            </div>
            
            <div className="p-4 bg-muted/40 rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground">O&M Costs</h4>
              <p className="text-2xl font-bold mt-1">{currencySymbol}{formatNumber(financialMetrics.summary.total_om_cost_25yr)}</p>
              <p className="text-xs text-muted-foreground mt-1">Maintenance and operational expenses</p>
            </div>
            
            <div className="p-4 bg-muted/40 rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground">Net {revenueType}</h4>
              <p className="text-2xl font-bold mt-1">{currencySymbol}{formatNumber(financialMetrics.summary.net_revenue_25yr)}</p>
              <p className="text-xs text-muted-foreground mt-1">Total {revenueType.toLowerCase()} minus O&M costs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <Tabs defaultValue="payback">
        <TabsList className="mb-4">
          <TabsTrigger value="payback">Payback Analysis</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="payback">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <LineChart className="h-5 w-5 mr-2 text-solar" />
                Payback Period & Cumulative Cash Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SolarChart
                data={cumulativeCashFlowData}
                xKey="year"
                yKey="cumulativeCashFlow"
                title=""
                type="line"
                color="#2ca02c"
                xLabel="Years"
                yLabel={`Cash Flow (${currencySymbol})`}
                height={300}
                yTickFormatter={(value) => `${currencySymbol}${formatNumber(value)}`}
                extraMarkers={breakEvenYear > 0 && breakEvenYear < 25 ? [
                  {
                    x: breakEvenYear,
                    y: cumulativeCashFlows[breakEvenYear],
                    color: "red",
                    size: 12,
                    symbol: "star",
                    label: `Break-even: ${breakEvenYear.toFixed(1)} years`
                  }
                ] : undefined}
                referenceLines={[
                  {
                    y: 0,
                    stroke: '#666',
                    strokeDasharray: '3 3',
                    label: 'Break-even line'
                  },
                  ...(breakEvenYear > 0 && breakEvenYear < 25 ? [
                    {
                      x: breakEvenYear,
                      stroke: 'red',
                      strokeDasharray: '3 3',
                      label: `Year ${breakEvenYear}`
                    }
                  ] : [])
                ]}
              />
              {!isFinite(financialMetrics.payback_period) || financialMetrics.payback_period > 25 ? (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-amber-800 dark:text-amber-400">
                    ⚠️ The project does not reach payback within the 25-year analysis period. Consider:
                  </p>
                  <ul className="list-disc list-inside text-sm mt-2 text-amber-700 dark:text-amber-300">
                    <li>Reducing initial costs</li>
                    <li>Increasing system size or production</li>
                    <li>Exploring available incentives</li>
                    <li>Finding better electricity rates</li>
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cashflow">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-solar" />
                25-Year {revenueType} vs Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SolarChart
                data={yearlyDetailsData}
                xKey="year"
                yKey={[revenueKey, "omCost", "netCashFlow"]}
                title=""
                type="composed"
                multiColor={{
                  [revenueKey]: "#3366cc",
                  "omCost": "#ff9900",
                  "netCashFlow": "#2ca02c"
                }}
                chartTypes={{
                  [revenueKey]: "bar",
                  "omCost": "bar",
                  "netCashFlow": "line"
                }}
                stacked={false}
                xLabel="Year"
                yLabel={`Amount (${currencySymbol})`}
                height={300}
                yTickFormatter={(value) => `${currencySymbol}${formatNumber(value)}`}
                legend={[
                  { name: revenueType, color: "#3366cc" },
                  { name: "O&M Expenses", color: "#ff9900" },
                  { name: "Net Cash Flow", color: "#2ca02c" }
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Yearly Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Year-by-Year Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="border px-3 py-2 text-left">Year</th>
                  <th className="border px-3 py-2 text-left">Performance Ratio</th>
                  <th className="border px-3 py-2 text-left">Energy Output (kWh)</th>
                  <th className="border px-3 py-2 text-left">{revenueType} ({currencySymbol})</th>
                  <th className="border px-3 py-2 text-left">O&M Cost ({currencySymbol})</th>
                  <th className="border px-3 py-2 text-left">Net Cash Flow ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody>
                {financialMetrics.yearly_details.map((detail, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                    <td className="border px-3 py-2">{detail.year}</td>
                    <td className="border px-3 py-2">{(detail.degradation_factor * 100).toFixed(1)}%</td>
                    <td className="border px-3 py-2">{formatNumber(detail.energy_output)}</td>
                    <td className="border px-3 py-2">
                      {formatNumber(detail[revenueKey === 'revenue' ? 'revenue' : 'savings'] as number)}
                    </td>
                    <td className="border px-3 py-2">{formatNumber(detail.om_cost)}</td>
                    <td className="border px-3 py-2 font-medium">{formatNumber(detail.net_cash_flow)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialMetricsDisplay;
