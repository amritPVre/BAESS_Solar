
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SolarPanel, SolarInverter } from "@/services/solarComponentsService";
import { PVWattsResponse } from "@/types/pvwatts";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AreaChart, Area } from "recharts";
import { ChevronDown, Calendar, BarChart as BarChartIcon, Clock } from "lucide-react";

interface ProductionResultsProps {
  results: PVWattsResponse | null;
  selectedPanel: SolarPanel | null;
  selectedInverter: SolarInverter | null;
  systemCapacity: number;
  loading: boolean;
  hourlyAverages: number[] | null;
  showFullSummary?: boolean;
}

const ProductionResults: React.FC<ProductionResultsProps> = ({
  results,
  selectedPanel,
  selectedInverter,
  systemCapacity,
  loading,
  hourlyAverages,
  showFullSummary = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Energy Production Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </div>
            <Skeleton className="h-[300px] w-full rounded-lg mb-6" />
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!results || !results.outputs) {
    return null;
  }

  // Prepare monthly data
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  
  const monthlyData = monthNames.map((month, index) => ({
    month,
    ac: results.outputs.ac_monthly[index],
    dc: results.outputs.dc_monthly[index],
    poa: results.outputs.poa_monthly[index],
    solrad: results.outputs.solrad_monthly[index],
  }));
  
  // Prepare hourly data
  const hourlyData = hourlyAverages
    ? hourlyAverages.map((value, index) => ({
        hour: `${index}:00`,
        production: value,
      }))
    : [];

  // Calculate metrics
  const annualOutput = Math.round(results.outputs.ac_annual);
  const specificYield = Math.round(results.outputs.ac_annual / systemCapacity);
  const capacityFactor = (results.outputs.capacity_factor * 100).toFixed(1);
  const dailyAverage = (results.outputs.ac_annual / 365).toFixed(1);
  
  // Month with max production
  const maxProductionIndex = results.outputs.ac_monthly.indexOf(
    Math.max(...results.outputs.ac_monthly)
  );
  const maxProductionMonth = monthNames[maxProductionIndex];
  const maxProductionValue = Math.round(results.outputs.ac_monthly[maxProductionIndex]);
  
  // Month with min production
  const minProductionIndex = results.outputs.ac_monthly.indexOf(
    Math.min(...results.outputs.ac_monthly)
  );
  const minProductionMonth = monthNames[minProductionIndex];
  const minProductionValue = Math.round(results.outputs.ac_monthly[minProductionIndex]);
  
  // Get peak hour production
  const peakHourIndex = hourlyAverages ? hourlyAverages.indexOf(Math.max(...hourlyAverages)) : 12;
  const peakHour = `${peakHourIndex}:00`;
  const peakProduction = hourlyAverages ? hourlyAverages[peakHourIndex].toFixed(2) : "0.00";

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Annual Production Stats */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-none shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <Calendar className="h-8 w-8 text-amber-500" />
              <div className="text-right">
                <p className="text-sm font-medium text-amber-600">Annual Production</p>
                <h3 className="text-2xl font-bold text-amber-700">{annualOutput.toLocaleString()} kWh</h3>
                <p className="text-xs text-amber-600 mt-1">
                  {dailyAverage} kWh daily average
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Specific Yield Stats */}
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-none shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <BarChartIcon className="h-8 w-8 text-emerald-500" />
              <div className="text-right">
                <p className="text-sm font-medium text-emerald-600">Specific Yield</p>
                <h3 className="text-2xl font-bold text-emerald-700">{specificYield.toLocaleString()} kWh/kWp</h3>
                <p className="text-xs text-emerald-600 mt-1">
                  Capacity factor: {capacityFactor}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Peak Production Stats */}
        <Card className="bg-gradient-to-br from-blue-50 to-sky-50 border-none shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <Clock className="h-8 w-8 text-blue-500" />
              <div className="text-right">
                <p className="text-sm font-medium text-blue-600">Peak Hour Production</p>
                <h3 className="text-2xl font-bold text-blue-700">{peakHour}</h3>
                <p className="text-xs text-blue-600 mt-1">
                  {peakProduction} kWh average output
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Production Charts */}
      <div className="space-y-8">
        {/* Hourly Production Chart */}
        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Average Hourly Energy Production
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              {hourlyAverages ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fontSize: 12 }} 
                      interval={window.innerWidth < 768 ? 2 : 1}
                    />
                    <YAxis tick={{ fontSize: 12 }} unit=" kWh" />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(2)} kWh`, 'Energy Production']}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #f0f0f0'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="production" 
                      name="Average Energy" 
                      stroke="#3b82f6" 
                      fill="url(#colorEnergy)" 
                      strokeWidth={2}
                    />
                    <defs>
                      <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <p className="text-gray-500">No hourly data available.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Monthly Production Chart */}
        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Monthly Energy Production
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} unit=" kWh" />
                  <Tooltip 
                    formatter={(value: number) => [`${Math.round(value).toLocaleString()} kWh`, 'Energy Production']}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #f0f0f0'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="ac" 
                    name="AC Energy" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                    barSize={window.innerWidth < 768 ? 15 : 30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {showFullSummary && (
          <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 pb-4">
              <CardTitle className="text-white flex items-center gap-2">
                <ChevronDown className="h-5 w-5" />
                Production Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Monthly Production</h3>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2">Month</th>
                          <th className="text-right py-2">AC (kWh)</th>
                          <th className="text-right py-2">DC (kWh)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyData.map((data, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-2 font-medium">{data.month}</td>
                            <td className="text-right py-2">{Math.round(data.ac).toLocaleString()}</td>
                            <td className="text-right py-2">{Math.round(data.dc).toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-100 font-semibold">
                          <td className="py-2">Total</td>
                          <td className="text-right py-2">{Math.round(results.outputs.ac_annual).toLocaleString()}</td>
                          <td className="text-right py-2">
                            {Math.round(results.outputs.dc_monthly.reduce((sum, val) => sum + val, 0)).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Solar Resource & Station Info</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">Solar Resource</h4>
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <dt className="text-gray-600">Yearly POA:</dt>
                        <dd className="font-medium">
                          {(results.outputs.poa_monthly.reduce((sum, val) => sum + val, 0)).toFixed(1)} kWh/m²
                        </dd>
                        <dt className="text-gray-600">Yearly Solar Radiation:</dt>
                        <dd className="font-medium">
                          {(results.outputs.solrad_monthly.reduce((sum, val) => sum + val, 0) / 12).toFixed(2)} kWh/m²/day
                        </dd>
                        <dt className="text-gray-600">Best Month:</dt>
                        <dd className="font-medium">
                          {(() => {
                            const maxIndex = results.outputs.solrad_monthly.indexOf(Math.max(...results.outputs.solrad_monthly));
                            return `${monthNames[maxIndex]} (${results.outputs.solrad_monthly[maxIndex].toFixed(2)} kWh/m²/day)`;
                          })()}
                        </dd>
                        <dt className="text-gray-600">Worst Month:</dt>
                        <dd className="font-medium">
                          {(() => {
                            const minIndex = results.outputs.solrad_monthly.indexOf(Math.min(...results.outputs.solrad_monthly));
                            return `${monthNames[minIndex]} (${results.outputs.solrad_monthly[minIndex].toFixed(2)} kWh/m²/day)`;
                          })()}
                        </dd>
                      </dl>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">Station Information</h4>
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <dt className="text-gray-600">Location:</dt>
                        <dd className="font-medium">
                          {results.station_info.city}, {results.station_info.state}
                        </dd>
                        <dt className="text-gray-600">Coordinates:</dt>
                        <dd className="font-medium">
                          {results.station_info.lat.toFixed(4)}, {results.station_info.lon.toFixed(4)}
                        </dd>
                        <dt className="text-gray-600">Elevation:</dt>
                        <dd className="font-medium">{results.station_info.elev} m</dd>
                        <dt className="text-gray-600">Timezone:</dt>
                        <dd className="font-medium">UTC{results.station_info.tz >= 0 ? `+${results.station_info.tz}` : results.station_info.tz}</dd>
                        <dt className="text-gray-600">PVWatts Version:</dt>
                        <dd className="font-medium">{results.version}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProductionResults;
