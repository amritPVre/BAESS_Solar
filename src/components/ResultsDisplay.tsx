import React, { useEffect, useState } from "react";
import { formatCurrency, formatNumber } from "@/utils/calculations";
import DataCard from "@/components/ui/DataCard";
import SolarChart from "@/components/ui/SolarChart";
import PDFReport from "@/components/PDFReport";
import { 
  DollarSign, 
  LineChart, 
  BarChart3, 
  TrendingUp, 
  CalendarClock, 
  Sun, 
  MapPin, 
  Download, 
  ArrowDown, 
  ArrowUp,
  Cloud,
  TreePine,
  Car
} from "lucide-react";
import SolarLocationMap from "@/components/SolarLocationMap";
import ProductionCashflowTable from "@/components/ProductionCashflowTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  clientName?: string;
  clientEmail?: string;
  clientAddress?: string;
  companyName?: string;
  companyContact?: string;
  systemSize?: number;
  panelType?: string;
  co2Reduction?: number;
  treesEquivalent?: number;
  vehicleMilesOffset?: number;
  location?: { lat: number; lng: number };
  timezone?: string;
  country?: string;
  city?: string;
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
  cumulativeCashFlow,
  clientName = "Client",
  clientEmail = "",
  clientAddress = "",
  companyName = "Solar Company",
  companyContact = "",
  systemSize = 0,
  panelType = "",
  co2Reduction = 0,
  treesEquivalent = 0,
  vehicleMilesOffset = 0,
  location = { lat: 40.7128, lng: -74.0060 },
  timezone = "America/New_York",
  country = "United States",
  city = "New York"
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [showTable, setShowTable] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

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
      <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
        <Sun className="h-6 w-6 mr-2 text-solar animate-pulse" />
        Solar System Analysis Results
      </h2>
      
      <Tabs defaultValue="summary" className="w-full mb-8">
        <TabsList className="grid grid-cols-4 w-full mb-6 rounded-xl overflow-hidden bg-gradient-to-r from-solar-light/20 to-solar-blue/10">
          <TabsTrigger value="summary" className="data-[state=active]:bg-solar-blue data-[state=active]:text-white font-medium">
            <LineChart className="h-4 w-4 mr-2" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="financial" className="data-[state=active]:bg-solar data-[state=active]:text-white font-medium">
            <DollarSign className="h-4 w-4 mr-2" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="production" className="data-[state=active]:bg-solar-accent data-[state=active]:text-white font-medium">
            <Sun className="h-4 w-4 mr-2" />
            Production
          </TabsTrigger>
          <TabsTrigger value="location" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white font-medium">
            <MapPin className="h-4 w-4 mr-2" />
            Location
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="animate-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <DataCard
              title="Levelized Cost of Energy"
              value={`$${formatNumber(lcoe)}/kWh`}
              icon={<Sun className="h-5 w-5 text-solar-accent" />}
              className="bg-gradient-to-br from-white to-solar-gray hover:shadow-md transition-all duration-300 transform hover:scale-105"
            />
            
            <DataCard
              title="Annual Revenue"
              value={formatCurrency(annualRevenue)}
              icon={<DollarSign className="h-5 w-5 text-green-500" />}
              className="bg-gradient-to-br from-white to-solar-gray hover:shadow-md transition-all duration-300 transform hover:scale-105"
            />
            
            <DataCard
              title="Annual Cost"
              value={formatCurrency(annualCost)}
              icon={<BarChart3 className="h-5 w-5 text-red-500" />}
              className="bg-gradient-to-br from-white to-solar-gray hover:shadow-md transition-all duration-300 transform hover:scale-105"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <DataCard
              title="Net Present Value"
              value={formatCurrency(netPresentValue)}
              icon={<DollarSign className="h-5 w-5 text-blue-500" />}
              className="bg-gradient-to-br from-white to-solar-gray hover:shadow-md transition-all duration-300 transform hover:scale-105"
            />
            
            <DataCard
              title="Internal Rate of Return"
              value={`${formatNumber(irr)}%`}
              icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
              className="bg-gradient-to-br from-white to-solar-gray hover:shadow-md transition-all duration-300 transform hover:scale-105"
            />
            
            <DataCard
              title="Simple Payback Period"
              value={`${paybackPeriod.years} years and ${paybackPeriod.months} months`}
              icon={<CalendarClock className="h-5 w-5 text-orange-500" />}
              className="bg-gradient-to-br from-white to-solar-gray hover:shadow-md transition-all duration-300 transform hover:scale-105"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <SolarChart
                data={productionData}
                xKey="year"
                yKey="production"
                title="Annual Energy Production"
                type="bar"
                color="#8B5CF6"
                xLabel="Year"
                yLabel="kWh"
                height={300}
                yTickFormatter={(value) => `${formatNumber(value)} kWh`}
              />
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <SolarChart
                data={cumulativeCashFlow.map((value, index) => ({ year: index, value }))}
                xKey="year"
                yKey="value"
                title="Cumulative Cash Flow"
                type="area"
                color="#0EA5E9"
                xLabel="Year"
                yLabel="$"
                height={300}
                areaFillOpacity={0.1}
                yTickFormatter={(value) => `$${formatNumber(value)}`}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="financial" className="animate-in">
          <div className="mb-8 bg-gradient-to-br from-solar-light/30 to-white p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-bold mb-4 text-solar-dark">Financial Performance</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <p className="text-sm text-muted-foreground">Net Present Value</p>
                <p className="text-2xl font-bold text-solar">{formatCurrency(netPresentValue)}</p>
                <p className="text-xs text-muted-foreground mt-1">Total value in today's money</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <p className="text-sm text-muted-foreground">Internal Rate of Return</p>
                <p className="text-2xl font-bold text-purple-600">{formatNumber(irr)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Annual return rate</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <p className="text-sm text-muted-foreground">Payback Period</p>
                <p className="text-2xl font-bold text-orange-500">{paybackPeriod.years}.{paybackPeriod.months} years</p>
                <p className="text-xs text-muted-foreground mt-1">Time to recover investment</p>
              </div>
            </div>
            
            <div className="mt-6">
              <SolarChart
                data={cashFlowData.slice(0, 26)}
                xKey="year"
                yKey="cashFlow"
                yKey2="cumulativeCashFlow"
                title="Annual & Cumulative Cash Flow"
                type="line"
                color="#F97316"
                color2="#2563EB"
                xLabel="Year"
                yLabel="$"
                height={350}
                yTickFormatter={(value) => `$${formatNumber(value)}`}
              />
            </div>
          </div>
          
          <button
            onClick={() => setShowTable(!showTable)}
            className="flex items-center justify-center w-full bg-solar/10 hover:bg-solar/20 rounded-lg p-3 mb-6 transition-all duration-300"
          >
            {showTable ? (
              <>
                <ArrowUp className="h-4 w-4 mr-2" />
                Hide Detailed Cash Flow Table
              </>
            ) : (
              <>
                <ArrowDown className="h-4 w-4 mr-2" />
                Show Detailed Cash Flow Table
              </>
            )}
          </button>
          
          {showTable && (
            <div className="animate-in mb-8">
              <h3 className="text-lg font-semibold mb-3">25-Year Production & Cashflow</h3>
              <ProductionCashflowTable 
                yearlyProduction={yearlyProduction}
                yearlyCashFlow={yearlyCashFlow}
                cumulativeCashFlow={cumulativeCashFlow}
              />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="production" className="animate-in">
          <div className="mb-8 bg-gradient-to-br from-solar-accent/30 to-white p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-bold mb-4 text-solar-accent">Energy Production</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <p className="text-sm text-muted-foreground">Total System Size</p>
                <p className="text-2xl font-bold text-solar-accent">{systemSize} kW</p>
                <p className="text-xs text-muted-foreground mt-1">Installed capacity</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <p className="text-sm text-muted-foreground">Annual Production</p>
                <p className="text-2xl font-bold text-solar-accent">{formatNumber(yearlyProduction[0])} kWh</p>
                <p className="text-xs text-muted-foreground mt-1">First year output</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <p className="text-sm text-muted-foreground">25-Year Total</p>
                <p className="text-2xl font-bold text-solar-accent">{formatNumber(yearlyProduction.reduce((sum, val) => sum + val, 0))} kWh</p>
                <p className="text-xs text-muted-foreground mt-1">Lifetime production</p>
              </div>
            </div>
            
            <div className="mt-6">
              <SolarChart
                data={productionData}
                xKey="year"
                yKey="production"
                title="Annual Energy Production over 25 Years"
                type="bar"
                color="#F59E0B"
                xLabel="Year"
                yLabel="kWh"
                height={350}
                yTickFormatter={(value) => `${formatNumber(value)} kWh`}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center text-center">
              <Cloud className="h-12 w-12 mb-2 text-blue-500" />
              <p className="text-sm text-muted-foreground">CO2 Reduction</p>
              <p className="text-xl font-bold">{formatNumber(co2Reduction)} kg/year</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center text-center">
              <TreePine className="h-12 w-12 mb-2 text-green-500" />
              <p className="text-sm text-muted-foreground">Trees Equivalent</p>
              <p className="text-xl font-bold">{formatNumber(treesEquivalent)}</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center text-center">
              <Car className="h-12 w-12 mb-2 text-purple-500" />
              <p className="text-sm text-muted-foreground">Vehicle Miles Offset</p>
              <p className="text-xl font-bold">{formatNumber(vehicleMilesOffset)}</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="location" className="animate-in">
          <div className="mb-8 bg-gradient-to-br from-blue-100 to-white p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-bold mb-4 text-blue-700">Location Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-blue-500" /> Location Details
                  </h4>
                  <div className="space-y-2">
                    <p className="flex items-center"><span className="font-medium w-24">City:</span> {city}</p>
                    <p className="flex items-center"><span className="font-medium w-24">Country:</span> {country}</p>
                    <p className="flex items-center"><span className="font-medium w-24">Timezone:</span> {timezone}</p>
                    <p className="flex items-center"><span className="font-medium w-24">Coordinates:</span> {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Sun className="h-4 w-4 mr-2 text-solar-accent" /> System Information
                  </h4>
                  <div className="space-y-2">
                    <p className="flex items-center"><span className="font-medium w-24">System Size:</span> {systemSize} kW</p>
                    <p className="flex items-center"><span className="font-medium w-24">Panel Type:</span> {panelType}</p>
                    <p className="flex items-center"><span className="font-medium w-24">Energy Cost:</span> ${formatNumber(lcoe)}/kWh</p>
                  </div>
                </div>
              </div>
              
              <div className="h-full min-h-[300px] rounded-lg overflow-hidden shadow-sm">
                <SolarLocationMap location={location} />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mb-8 bg-gradient-to-r from-solar-light/30 to-solar-blue/10 p-6 rounded-xl shadow-sm">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <Download className="h-5 w-5 mr-2 text-solar" />
          Generate Detailed Report
        </h3>
        <p className="text-muted-foreground mb-4">
          Download a comprehensive PDF report with all financial metrics, energy production data, and environmental benefits.
        </p>
        <PDFReport
          clientName={clientName}
          clientEmail={clientEmail}
          clientAddress={clientAddress}
          companyName={companyName}
          companyContact={companyContact}
          systemSize={systemSize}
          panelType={panelType}
          lcoe={lcoe}
          annualRevenue={annualRevenue}
          annualCost={annualCost}
          netPresentValue={netPresentValue}
          irr={irr}
          paybackPeriod={paybackPeriod}
          co2Reduction={co2Reduction}
          treesEquivalent={treesEquivalent}
          vehicleMilesOffset={vehicleMilesOffset}
          yearlyProduction={yearlyProduction}
          cumulativeCashFlow={cumulativeCashFlow}
          location={location}
          city={city}
          country={country}
        />
      </div>
    </div>
  );
};

export default ResultsDisplay;
