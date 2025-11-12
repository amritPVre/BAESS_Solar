import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calculator, TrendingUp, DollarSign, Info, Download, FileSpreadsheet, TrendingDown, Zap, Clock, Percent, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { calculateFinancialMetrics, exportCashFlowToCSV, type FinancialResults } from '@/utils/financialCalculations';
import AdvancedPDFReport from './AdvancedPDFReport';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface FinancialAnalysisProps {
  annualEnergyYear1: number; // kWh from results tab
  totalProjectCost: number; // $ from AI BOQ tab (equipment + development)
  isVisible?: boolean;
  
  // Technical data for report generation
  solarResults?: any; // SolarCalculationResult
  systemParams?: {
    capacity: number;
    tilt: number;
    azimuth: number;
    moduleEfficiency: number;
    losses: number;
    latitude: number;
    longitude: number;
    timezone: string;
    dcAcRatio: number;
    inverterCount: number;
  };
  selectedPanel?: any;
  selectedInverter?: any;
  polygonConfigs?: any[];
  acConfiguration?: any;
  detailedLosses?: Record<string, number>;
  projectLocation?: string;
  projectName?: string;
  
  // Navigation callback
  onNavigateToAIReport?: () => void;
  
  // Data callbacks for AI Report
  onFinancialDataUpdate?: (params: FinancialParams, results: FinancialResults | null) => void;
  
  // Initial data for restoring saved projects
  initialFinancialParams?: FinancialParams | null;
  initialFinancialResults?: FinancialResults | null;
  
  // BOQ data for Annexure
  boqData?: Array<{
    slNo: number;
    description: string;
    specifications: string;
    unit: string;
    qty: string | number;
  }>;
}

export interface FinancialParams {
  omExpensesPercent: number;
  electricityRate: number;
  omEscalationRate: number;
  omEscalationFrequency: number;
  tariffEscalationRate: number;
  tariffEscalationFrequency: number;
  annualDegradation: number;
  discountRate: number;
  governmentSubsidy: number;
  incomeTaxRate: number;
}

export const FinancialAnalysis: React.FC<FinancialAnalysisProps> = ({
  annualEnergyYear1,
  totalProjectCost,
  isVisible = true,
  solarResults,
  systemParams,
  selectedPanel,
  selectedInverter,
  polygonConfigs,
  acConfiguration,
  detailedLosses,
  projectLocation = "Project Site",
  projectName = "Solar PV Project",
  boqData,
  onNavigateToAIReport,
  onFinancialDataUpdate,
  initialFinancialParams,
  initialFinancialResults
}) => {
  const [activeTab, setActiveTab] = useState('inputs');
  const [financialParams, setFinancialParams] = useState<FinancialParams>({
    omExpensesPercent: 1.5,
    electricityRate: 0.12,
    omEscalationRate: 3.0,
    omEscalationFrequency: 1,
    tariffEscalationRate: 2.5,
    tariffEscalationFrequency: 1,
    annualDegradation: 0.5,
    discountRate: 8.0,
    governmentSubsidy: 0,
    incomeTaxRate: 21.0,
  });

  const [financialResults, setFinancialResults] = useState<FinancialResults | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Restore financial data from saved project (ONLY ONCE on mount)
  useEffect(() => {
    if (initialFinancialParams) {
      console.log('💰 Restoring financial parameters from saved project:', initialFinancialParams);
      setFinancialParams(initialFinancialParams);
    }
    if (initialFinancialResults) {
      console.log('📊 Restoring financial results from saved project');
      setFinancialResults(initialFinancialResults);
      // If we have results, show the results tab by default
      setActiveTab('results');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Update parent component with financial data
  useEffect(() => {
    if (onFinancialDataUpdate) {
      onFinancialDataUpdate(financialParams, financialResults);
    }
  }, [financialParams, financialResults, onFinancialDataUpdate]);

  // Handle input changes
  const handleParamChange = useCallback((field: keyof FinancialParams, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFinancialParams(prev => ({ ...prev, [field]: numValue }));
  }, []);

  // Calculate financial metrics
  const handleCalculate = useCallback(() => {
    if (annualEnergyYear1 <= 0) {
      toast.error('Annual energy generation is required. Please complete the solar design first.');
      return;
    }

    if (totalProjectCost <= 0) {
      toast.error('Total project cost is required. Please complete the BOQ pricing first.');
      return;
    }

    setCalculating(true);
    
    try {
      // Perform comprehensive financial analysis
      const results = calculateFinancialMetrics({
        totalProjectCost,
        governmentSubsidy: financialParams.governmentSubsidy,
        annualEnergyYear1,
        annualDegradation: financialParams.annualDegradation,
        electricityRate: financialParams.electricityRate,
        tariffEscalationRate: financialParams.tariffEscalationRate,
        tariffEscalationFrequency: financialParams.tariffEscalationFrequency,
        omExpensesPercent: financialParams.omExpensesPercent,
        omEscalationRate: financialParams.omEscalationRate,
        omEscalationFrequency: financialParams.omEscalationFrequency,
        discountRate: financialParams.discountRate,
        incomeTaxRate: financialParams.incomeTaxRate,
        projectLifetime: 25
      });
      
      setFinancialResults(results);
      setActiveTab('results');
      toast.success('Financial analysis complete! View your 25-year projections.');
    } catch (error) {
      console.error('Financial calculation error:', error);
      toast.error('Error calculating financial metrics. Please check your inputs.');
    } finally {
      setCalculating(false);
    }
  }, [annualEnergyYear1, totalProjectCost, financialParams]);

  // Export cash flow to CSV
  const handleExportCSV = useCallback(() => {
    if (financialResults) {
      exportCashFlowToCSV(financialResults.cashFlowTable);
      toast.success('Cash flow table exported to CSV');
    }
  }, [financialResults]);

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
          <TrendingUp className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Analysis</h2>
          <p className="text-sm text-gray-600">
            Comprehensive 25-year financial modeling & investment analysis
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inputs" className="text-base">
            <DollarSign className="h-4 w-4 mr-2" />
            Financial Inputs
          </TabsTrigger>
          <TabsTrigger value="results" className="text-base">
            <Calculator className="h-4 w-4 mr-2" />
            Financial Results
          </TabsTrigger>
        </TabsList>

        {/* Financial Inputs Tab */}
        <TabsContent value="inputs" className="space-y-6">
          {/* Project Summary Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Annual Energy Generation (Year 1)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700">
                  {annualEnergyYear1.toLocaleString('en-US', { maximumFractionDigits: 0 })} kWh
                </div>
                <p className="text-sm text-gray-600 mt-1">Base year energy production</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Total Project Investment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700">
                  ${totalProjectCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-sm text-gray-600 mt-1">Equipment + Development Costs</p>
              </CardContent>
            </Card>
          </div>

          {/* Financial Parameters Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Financial Parameters
              </CardTitle>
              <CardDescription>
                Configure project assumptions for 25-year financial analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* O&M Expenses */}
                <div className="group">
                  <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-purple-300">
                    <Label htmlFor="omExpenses" className="text-sm font-semibold text-gray-700 mb-3 block">
                      Yearly O&M Expenses
                    </Label>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="relative flex-1">
                        <Input
                          id="omExpenses"
                          type="number"
                          step="0.001"
                          min="0"
                          max="10"
                          value={financialParams.omExpensesPercent}
                          onChange={(e) => handleParamChange('omExpensesPercent', e.target.value)}
                          className="text-lg font-bold text-gray-900 border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-purple-500 rounded-lg pr-10 transition-all"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2">
                      <span className="text-gray-500">% of Total Cost</span>
                      <span className="font-semibold text-purple-600">
                        ${((totalProjectCost * financialParams.omExpensesPercent) / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}/yr
                      </span>
                    </div>
                  </div>
                </div>

                {/* Electricity Rate */}
                <div className="group">
                  <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-400">
                    <Label htmlFor="electricityRate" className="text-sm font-semibold text-gray-700 mb-3 block">
                      Electricity Tariff / PPA Rate
                    </Label>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">$</span>
                        <Input
                          id="electricityRate"
                          type="number"
                          step="0.001"
                          min="0"
                          max="1"
                          value={financialParams.electricityRate}
                          onChange={(e) => handleParamChange('electricityRate', e.target.value)}
                          className="text-lg font-bold text-gray-900 border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg pl-8 transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2">
                      <span className="text-gray-500">$/kWh Rate</span>
                      <span className="font-semibold text-blue-600">
                        ${(annualEnergyYear1 * financialParams.electricityRate).toLocaleString('en-US', { maximumFractionDigits: 0 })}/yr
                      </span>
                    </div>
                  </div>
                </div>

                {/* Income Tax Rate */}
                <div className="group">
                  <div className="bg-gradient-to-br from-white to-pink-50 border border-pink-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-pink-400">
                    <Label htmlFor="taxRate" className="text-sm font-semibold text-gray-700 mb-3 block">
                      Income Tax Rate
                    </Label>
                    <div className="relative mb-2">
                      <Input
                        id="taxRate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="50"
                        value={financialParams.incomeTaxRate}
                        onChange={(e) => handleParamChange('incomeTaxRate', e.target.value)}
                        className="text-lg font-bold text-gray-900 border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-pink-500 rounded-lg pr-10 transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">%</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      On energy export
                    </div>
                  </div>
                </div>

                {/* O&M Escalation Frequency */}
                <div className="group">
                  <div className="bg-gradient-to-br from-white to-teal-50 border border-teal-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-teal-400">
                    <Label htmlFor="omFrequency" className="text-sm font-semibold text-gray-700 mb-3 block">
                      O&M Escalation Frequency
                    </Label>
                    <div className="relative">
                      <Input
                        id="omFrequency"
                        type="number"
                        step="1"
                        min="1"
                        max="10"
                        value={financialParams.omEscalationFrequency}
                        onChange={(e) => handleParamChange('omEscalationFrequency', e.target.value)}
                        className="text-lg font-bold text-gray-900 border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-teal-500 rounded-lg pr-16 transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">years</span>
                    </div>
                  </div>
                </div>

                {/* Tariff Escalation Rate */}
                <div className="group">
                  <div className="bg-gradient-to-br from-white to-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-amber-400">
                    <Label htmlFor="tariffEscalation" className="text-sm font-semibold text-gray-700 mb-3 block">
                      Electricity Tariff Escalation
                    </Label>
                    <div className="relative">
                      <Input
                        id="tariffEscalation"
                        type="number"
                        step="0.1"
                        min="0"
                        max="20"
                        value={financialParams.tariffEscalationRate}
                        onChange={(e) => handleParamChange('tariffEscalationRate', e.target.value)}
                        className="text-lg font-bold text-gray-900 border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-amber-500 rounded-lg pr-10 transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">%</span>
                    </div>
                  </div>
                </div>

                {/* Tariff Escalation Frequency */}
                <div className="group">
                  <div className="bg-gradient-to-br from-white to-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-orange-400">
                    <Label htmlFor="tariffFrequency" className="text-sm font-semibold text-gray-700 mb-3 block">
                      Tariff Escalation Frequency
                    </Label>
                    <div className="relative">
                      <Input
                        id="tariffFrequency"
                        type="number"
                        step="1"
                        min="1"
                        max="10"
                        value={financialParams.tariffEscalationFrequency}
                        onChange={(e) => handleParamChange('tariffEscalationFrequency', e.target.value)}
                        className="text-lg font-bold text-gray-900 border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-orange-500 rounded-lg pr-16 transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">years</span>
                    </div>
                  </div>
                </div>

                {/* Annual Degradation */}
                <div className="group">
                  <div className="bg-gradient-to-br from-white to-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-rose-400">
                    <Label htmlFor="degradation" className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      Annual PV Degradation
                      <div className="group/tooltip relative">
                        <Info className="h-3 w-3 text-gray-400 cursor-help" />
                        <div className="absolute hidden group-hover/tooltip:block bottom-full left-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                          Typical: 0.5% for crystalline silicon modules
                        </div>
                      </div>
                    </Label>
                    <div className="relative">
                      <Input
                        id="degradation"
                        type="number"
                        step="0.01"
                        min="0"
                        max="2"
                        value={financialParams.annualDegradation}
                        onChange={(e) => handleParamChange('annualDegradation', e.target.value)}
                        className="text-lg font-bold text-gray-900 border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-rose-500 rounded-lg pr-10 transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">%</span>
                    </div>
                  </div>
                </div>

                {/* Discount Rate */}
                <div className="group">
                  <div className="bg-gradient-to-br from-white to-cyan-50 border border-cyan-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-cyan-400">
                    <Label htmlFor="discountRate" className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      Discount Rate (WACC)
                      <div className="group/tooltip relative">
                        <Info className="h-3 w-3 text-gray-400 cursor-help" />
                        <div className="absolute hidden group-hover/tooltip:block bottom-full left-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                          Weighted Average Cost of Capital for NPV calculations
                        </div>
                      </div>
                    </Label>
                    <div className="relative">
                      <Input
                        id="discountRate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="30"
                        value={financialParams.discountRate}
                        onChange={(e) => handleParamChange('discountRate', e.target.value)}
                        className="text-lg font-bold text-gray-900 border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-cyan-500 rounded-lg pr-10 transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">%</span>
                    </div>
                  </div>
                </div>

                {/* O&M Escalation Rate */}
                <div className="group">
                  <div className="bg-gradient-to-br from-white to-indigo-50 border border-indigo-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-indigo-400">
                    <Label htmlFor="omEscalation" className="text-sm font-semibold text-gray-700 mb-3 block">
                      O&M Escalation Rate
                    </Label>
                    <div className="relative">
                      <Input
                        id="omEscalation"
                        type="number"
                        step="0.1"
                        min="0"
                        max="20"
                        value={financialParams.omEscalationRate}
                        onChange={(e) => handleParamChange('omEscalationRate', e.target.value)}
                        className="text-lg font-bold text-gray-900 border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded-lg pr-10 transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">%</span>
                    </div>
                  </div>
                </div>

                {/* Government Subsidy */}
                <div className="group">
                  <div className="bg-gradient-to-br from-white to-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-emerald-400">
                    <Label htmlFor="subsidy" className="text-sm font-semibold text-gray-700 mb-3 block">
                      Government Subsidy / Grants
                    </Label>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">$</span>
                        <Input
                          id="subsidy"
                          type="number"
                          step="1000"
                          min="0"
                          value={financialParams.governmentSubsidy}
                          onChange={(e) => handleParamChange('governmentSubsidy', e.target.value)}
                          className="text-lg font-bold text-gray-900 border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-lg pl-8 transition-all"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Reduces net investment
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculate Button */}
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={handleCalculate}
                  size="lg"
                  disabled={calculating}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-12 py-6 text-lg disabled:opacity-50"
                >
                  {calculating ? (
                    <>
                      <div className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-5 w-5 mr-3" />
                      Calculate Financial Metrics
                    </>
                  )}
                </Button>
              </div>

              {/* Info Box */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold text-blue-900 mb-1">Industry Standards Applied:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>25-year project lifecycle analysis (IEC 61724 standard)</li>
                      <li>IRR calculated using Newton-Raphson method</li>
                      <li>NPV using discounted cash flow (DCF) methodology</li>
                      <li>LCOE calculated per NREL guidelines</li>
                      <li>Tax calculations on net operating income</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Results Tab */}
        <TabsContent value="results">
          {!financialResults ? (
            <Card>
              <CardHeader>
                <CardTitle>Financial Results</CardTitle>
                <CardDescription>
                  Comprehensive financial analysis results will appear here
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calculator className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Configure your financial parameters and click "Calculate Financial Metrics" to generate results.
                  </p>
                  <Button
                    onClick={() => setActiveTab('inputs')}
                    variant="outline"
                  >
                    Back to Financial Inputs
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Export Buttons */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Financial Analysis Results</h2>
                  <p className="text-sm text-gray-600 mt-1">25-Year Project Financial Model</p>
                </div>
                <div className="flex gap-3">
                  {/* TODO: Temporarily hidden - may be needed in future */}
                  {/* {solarResults && systemParams && (
                    <AdvancedPDFReport
                      results={solarResults}
                      systemParams={systemParams}
                      selectedPanel={selectedPanel || {}}
                      selectedInverter={selectedInverter || {}}
                      polygonConfigs={polygonConfigs || []}
                      acConfiguration={acConfiguration}
                      detailedLosses={detailedLosses}
                      financialResults={financialResults}
                      financialParams={{
                        totalProjectCost,
                        governmentSubsidy: financialParams.governmentSubsidy,
                        annualEnergyYear1,
                        electricityRate: financialParams.electricityRate,
                        tariffEscalationRate: financialParams.tariffEscalationRate,
                        omExpensesPercent: financialParams.omExpensesPercent,
                        omEscalationRate: financialParams.omEscalationRate,
                        annualDegradation: financialParams.annualDegradation,
                        discountRate: financialParams.discountRate,
                        incomeTaxRate: financialParams.incomeTaxRate,
                        totalOMCosts25Years: financialResults.totalOMCosts25Years,
                        totalRevenue25Years: financialResults.totalRevenue25Years
                      }}
                      boqData={boqData}
                    />
                  )} */}
                  <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    className="gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export to CSV
                  </Button>
                  {onNavigateToAIReport && (
                    <Button
                      onClick={onNavigateToAIReport}
                      className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate AI Feasibility Report
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* IRR Card */}
                <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Percent className="h-4 w-4 text-green-600" />
                      Internal Rate of Return (IRR)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-green-700">
                      {isNaN(financialResults.irr) ? 'N/A' : `${financialResults.irr.toFixed(2)}%`}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {isNaN(financialResults.irr) 
                        ? 'IRR could not be calculated' 
                        : financialResults.irr > financialParams.discountRate 
                          ? '✓ Exceeds discount rate - Good investment' 
                          : '⚠ Below discount rate - Review viability'}
                    </p>
                  </CardContent>
                </Card>

                {/* NPV Card */}
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      Net Present Value (NPV)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-blue-700">
                      ${(financialResults.npv / 1000).toFixed(0)}K
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {financialResults.npv > 0 
                        ? '✓ Positive NPV - Project adds value' 
                        : '⚠ Negative NPV - Reconsider project'}
                    </p>
                  </CardContent>
                </Card>

                {/* LCOE Card */}
                <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      Levelized Cost of Energy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-purple-700">
                      ${financialResults.lcoe.toFixed(3)}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Per kWh over 25 years (NREL methodology)
                    </p>
                  </CardContent>
                </Card>

                {/* Simple Payback Card */}
                <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      Simple Payback Period
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-orange-700">
                      {financialResults.simplePaybackPeriod > 0 
                        ? `${financialResults.simplePaybackPeriod.toFixed(1)}` 
                        : 'N/A'}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {financialResults.simplePaybackPeriod > 0 ? 'Years to recover investment' : 'No payback within 25 years'}
                    </p>
                  </CardContent>
                </Card>

                {/* Discounted Payback Card */}
                <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-teal-600" />
                      Discounted Payback Period
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-teal-700">
                      {financialResults.discountedPaybackPeriod > 0 
                        ? `${financialResults.discountedPaybackPeriod.toFixed(1)}` 
                        : 'N/A'}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {financialResults.discountedPaybackPeriod > 0 ? 'Years (time-value adjusted)' : 'No payback within 25 years'}
                    </p>
                  </CardContent>
                </Card>

                {/* Average ROI Card */}
                <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-indigo-600" />
                      Average Annual ROI
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-indigo-700">
                      {financialResults.averageROI.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Return on investment per year
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cumulative NPV Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cumulative NPV Over 25 Years</CardTitle>
                    <CardDescription>Net Present Value progression (discounted)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={financialResults.cashFlowTable}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'NPV ($)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value: number) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} />
                        <Area 
                          type="monotone" 
                          dataKey="cumulativeNPV" 
                          stroke="#3b82f6" 
                          fill="url(#colorNPV)" 
                          name="Cumulative NPV"
                        />
                        <defs>
                          <linearGradient id="colorNPV" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Cash Flow Breakdown Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Annual Cash Flow Components</CardTitle>
                    <CardDescription>Revenue, Costs & Profit breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={financialResults.cashFlowTable.filter((_, i) => i % 5 === 0 || i === financialResults.cashFlowTable.length - 1)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value: number) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} />
                        <Legend />
                        <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                        <Bar dataKey="omCost" fill="#ef4444" name="O&M Cost" />
                        <Bar dataKey="netProfit" fill="#3b82f6" name="Net Profit" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Payback Curve */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payback Analysis</CardTitle>
                    <CardDescription>Cumulative profit (simple & discounted)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={financialResults.cashFlowTable}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'Cumulative ($)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value: number) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} />
                        <Legend />
                        <Line type="monotone" dataKey="cumulativeProfit" stroke="#10b981" strokeWidth={2} name="Simple Payback" dot={false} />
                        <Line type="monotone" dataKey="cumulativeNPV" stroke="#3b82f6" strokeWidth={2} name="Discounted Payback" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Energy Degradation Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Energy Generation Over Time</CardTitle>
                    <CardDescription>Annual energy with degradation effect</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={financialResults.cashFlowTable}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value: number) => `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })} kWh`} />
                        <Area 
                          type="monotone" 
                          dataKey="energyGenerated" 
                          stroke="#f59e0b" 
                          fill="url(#colorEnergy)" 
                          name="Energy Generated"
                        />
                        <defs>
                          <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* 25-Year Cash Flow Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">25-Year Detailed Cash Flow Projection</CardTitle>
                  <CardDescription>Complete financial breakdown by year</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr className="border-b">
                          <th className="p-2 text-left font-semibold text-gray-700">Year</th>
                          <th className="p-2 text-right font-semibold text-gray-700">Energy (kWh)</th>
                          <th className="p-2 text-right font-semibold text-gray-700">Tariff ($/kWh)</th>
                          <th className="p-2 text-right font-semibold text-gray-700">Revenue ($)</th>
                          <th className="p-2 text-right font-semibold text-gray-700">O&M Cost ($)</th>
                          <th className="p-2 text-right font-semibold text-gray-700">Gross Profit ($)</th>
                          <th className="p-2 text-right font-semibold text-gray-700">Tax ($)</th>
                          <th className="p-2 text-right font-semibold text-gray-700">Net Profit ($)</th>
                          <th className="p-2 text-right font-semibold text-gray-700">Cumulative ($)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financialResults.cashFlowTable.map((row) => (
                          <tr key={row.year} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">{row.year}</td>
                            <td className="p-2 text-right">{row.energyGenerated.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                            <td className="p-2 text-right">${row.electricityTariff.toFixed(3)}</td>
                            <td className="p-2 text-right text-green-700 font-medium">${row.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                            <td className="p-2 text-right text-red-600">${row.omCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                            <td className="p-2 text-right font-medium">${row.grossProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                            <td className="p-2 text-right text-orange-600">${row.tax.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                            <td className="p-2 text-right text-blue-700 font-bold">${row.netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                            <td className="p-2 text-right font-bold" style={{ color: row.cumulativeProfit >= 0 ? '#10b981' : '#ef4444' }}>
                              ${row.cumulativeProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-100 font-bold">
                        <tr className="border-t-2">
                          <td className="p-2" colSpan={3}>25-Year Totals</td>
                          <td className="p-2 text-right text-green-700">${financialResults.totalRevenue25Years.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                          <td className="p-2 text-right text-red-600">${financialResults.totalOMCosts25Years.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                          <td className="p-2 text-right">${(financialResults.totalRevenue25Years - financialResults.totalOMCosts25Years).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                          <td className="p-2 text-right text-orange-600">${financialResults.totalTaxPaid25Years.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                          <td className="p-2 text-right text-blue-700">${financialResults.totalNetProfit25Years.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                          <td className="p-2 text-right" style={{ color: financialResults.totalNetProfit25Years >= financialResults.netInvestment ? '#10b981' : '#ef4444' }}>
                            ${financialResults.totalNetProfit25Years.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600 mb-1">Total 25-Year Revenue</div>
                    <div className="text-2xl font-bold text-green-700">
                      ${(financialResults.totalRevenue25Years / 1000000).toFixed(2)}M
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600 mb-1">Total 25-Year O&M Costs</div>
                    <div className="text-2xl font-bold text-red-700">
                      ${(financialResults.totalOMCosts25Years / 1000000).toFixed(2)}M
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600 mb-1">Total 25-Year Net Profit</div>
                    <div className="text-2xl font-bold text-blue-700">
                      ${(financialResults.totalNetProfit25Years / 1000000).toFixed(2)}M
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> All calculations follow Best Financials standards (Being followed Globally) and NREL guidelines.
                  IRR uses Newton-Raphson method, NPV uses discounted cash flow (DCF), and LCOE follows NREL methodology.
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

