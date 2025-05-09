
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FinancialMetrics } from "@/types/solarCalculations";
import SolarChart from "./ui/SolarChart";
import { formatNumber } from "@/utils/calculations";
import { BarChart3, CandlestickChart, Clock, DollarSign, Heart, LineChart, Plus, TrendingUp, Zap } from "lucide-react";

interface FinancialMetricsDisplayProps {
  financialMetrics: FinancialMetrics;
  currencySymbol: string;
}

const FinancialMetricsDisplay: React.FC<FinancialMetricsDisplayProps> = ({
  financialMetrics,
  currencySymbol
}) => {
  const {
    npv,
    irr,
    roi,
    paybackPeriod,
    payback_period,
    yearly_details,
    cash_flows,
    system_type,
    summary
  } = financialMetrics;

  // Use either paybackPeriod or payback_period (for compatibility)
  const effectivePaybackPeriod = payback_period ?? paybackPeriod ?? 0;
  const isInfinitePayback = !isFinite(effectivePaybackPeriod) || effectivePaybackPeriod > 25;
  
  // Format payback period
  const formatPayback = () => {
    if (isInfinitePayback) {
      return "Beyond 25 years";
    }
    const years = Math.floor(payback_period);
    const months = Math.round((payback_period - years) * 12);
    return `${years} years${months > 0 ? ` and ${months} months` : ''}`;
  };

  // Prepare data for cumulative cash flow chart
  const cumulativeCashFlow = (cash_flows || []).reduce((acc, val, idx) => {
    const prev = idx > 0 ? acc[idx - 1] : 0;
    acc.push(prev + val);
    return acc;
  }, [] as number[]);

  const cashFlowChartData = (cash_flows || []).map((value, index) => ({
    year: index,
    cashFlow: index > 0 ? value : 0, // Skip initial investment for clarity
    cumulativeCashFlow: cumulativeCashFlow[index]
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CandlestickChart className="h-5 w-5 mr-2 text-solar" />
            Financial Analysis Results (25 Year Period)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900">Net Present Value</h3>
              </div>
              <p className="text-2xl font-bold text-gray-800">{currencySymbol}{formatNumber(npv, 2)}</p>
              <p className="text-xs text-gray-500 mt-1">Discounted value of all future cash flows</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold text-gray-900">IRR</h3>
              </div>
              <p className="text-2xl font-bold text-gray-800">{formatNumber(irr, 2)}%</p>
              <p className="text-xs text-gray-500 mt-1">Internal Rate of Return</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center space-x-2 mb-2">
                <LineChart className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900">Annual Avg ROI</h3>
              </div>
              <p className="text-2xl font-bold text-gray-800">{formatNumber(roi, 2)}%</p>
              <p className="text-xs text-gray-500 mt-1">Return on Investment</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold text-gray-900">Simple Payback Period</h3>
            </div>
            <p className="text-2xl font-bold text-gray-800">{formatPayback()}</p>
            <p className="text-xs text-gray-500 mt-1">Time to recover initial investment</p>
            
            {isInfinitePayback && (
              <div className="mt-3 p-3 bg-amber-50 rounded-md text-sm text-amber-700 border border-amber-200">
                <p className="font-medium mb-1">⚠️ Note: The project does not reach payback within the 25-year analysis period.</p>
                <p>This could be due to high initial costs, low energy production, low electricity rates, or high O&M costs.</p>
              </div>
            )}
          </div>

          <Separator />

          <h3 className="text-lg font-semibold">25-Year Performance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-900">Total Energy Generation</h3>
              </div>
              <p className="text-2xl font-bold text-gray-800">{formatNumber(summary.total_energy_25yr)} kWh</p>
              <p className="text-xs text-gray-500 mt-1">Including 0.6% annual degradation</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold text-gray-900">Net {summary.revenue_type}</h3>
              </div>
              <p className="text-2xl font-bold text-gray-800">{currencySymbol}{formatNumber(summary.net_revenue_25yr)}</p>
              <p className="text-xs text-gray-500 mt-1">Total {summary.revenue_type.toLowerCase()} minus O&M costs</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              Financial Charts
            </h3>

            <div className="space-y-4">
              <h4 className="font-medium">Payback Analysis</h4>
              <div className="h-72 md:h-96 w-full">
                <SolarChart
                  data={cumulativeCashFlow.map((value, index) => ({ year: index, value }))}
                  xKey="year"
                  yKey="value"
                  title=""
                  type="area"
                  color="#0496FF"
                  xLabel="Year"
                  yLabel={currencySymbol}
                  height={350}
                  areaFillOpacity={0.1}
                  yTickFormatter={(value) => `${currencySymbol}${formatNumber(value)}`}
                />
              </div>
              <p className="text-sm text-gray-600">
                This chart shows the cumulative cash flow over the 25-year analysis period. The point where the line crosses the zero line represents the payback period.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">{summary.revenue_type} vs Expenses</h4>
              <div className="h-72 md:h-96 w-full">
                <SolarChart
                  data={yearly_details.map(detail => ({
                    year: detail.year,
                    revenue: detail.revenue || detail.savings || 0,
                    expenses: detail.om_cost,
                    net: detail.net_cash_flow
                  }))}
                  xKey="year"
                  yKey="revenue"
                  yKey2="expenses"
                  yKey3="net"
                  title=""
                  type="bar"
                  color="#4CB571"
                  color2="#FF9F1C"
                  color3="#0496FF"
                  xLabel="Year"
                  yLabel={currencySymbol}
                  height={350}
                  yTickFormatter={(value) => `${currencySymbol}${formatNumber(value)}`}
                  legend={[
                    { key: "revenue", label: summary.revenue_type, color: "#4CB571" },
                    { key: "expenses", label: "O&M Expenses", color: "#FF9F1C" },
                    { key: "net", label: "Net Cash Flow", color: "#0496FF" }
                  ]}
                />
              </div>
              <p className="text-sm text-gray-600">
                This chart compares annual {summary.revenue_type.toLowerCase()} against operation & maintenance expenses, with the net cash flow showing your financial benefit each year.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialMetricsDisplay;
