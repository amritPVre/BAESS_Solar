
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PVWattsResponse } from "@/types/pvwatts";
import { SolarPanel, SolarInverter } from "@/services/solarComponentsService";
import SolarChart from "@/components/ui/SolarChart";
import { Zap, LineChart, CalendarDays } from "lucide-react";

interface ProductionResultsProps {
  results: PVWattsResponse | null;
  selectedPanel: SolarPanel | null;
  selectedInverter: SolarInverter | null;
  systemCapacity: number;
  loading: boolean;
  hourlyAverages: number[] | null;
}

const ProductionResults: React.FC<ProductionResultsProps> = ({
  results,
  selectedPanel,
  selectedInverter,
  systemCapacity,
  loading,
  hourlyAverages
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Energy Production Results
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Calculating energy production...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return null;
  }

  // Prepare hourly chart data
  const hourlyChartData = hourlyAverages ? hourlyAverages.map((value, index) => ({
    hour: `${index}:00`,
    value: value
  })) : [];

  // Prepare monthly chart data - explicitly mapping to an array of objects for Recharts
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyChartData = monthNames.map((month, index) => ({
    month: month,
    energy: results.outputs.ac_monthly[index],
    dc: results.outputs.dc_monthly[index],
    irradiance: results.outputs.poa_monthly[index]
  }));

  // Format losses value safely
  const formatLosses = () => {
    if (typeof results.inputs.losses === 'number') {
      return results.inputs.losses.toFixed(2);
    }
    return String(results.inputs.losses || '0');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Energy Production Results
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
          <div className="bg-muted p-3 rounded shadow-sm">
            <p className="text-sm text-muted-foreground">Annual AC Output</p>
            <p className="text-lg font-semibold">{results.outputs.ac_annual.toFixed(1)} kWh</p>
          </div>
          <div className="bg-muted p-3 rounded shadow-sm">
            <p className="text-sm text-muted-foreground">Specific Yield</p>
            <p className="text-lg font-semibold">{(results.outputs.ac_annual / systemCapacity).toFixed(1)} kWh/kWp</p>
          </div>
          <div className="bg-muted p-3 rounded shadow-sm">
            <p className="text-sm text-muted-foreground">Avg. Daily Output</p>
            <p className="text-lg font-semibold">{(results.outputs.ac_annual / 365).toFixed(1)} kWh</p>
          </div>
        </div>

        <Tabs defaultValue="charts">
          <TabsList className="mb-4">
            <TabsTrigger value="charts" className="flex items-center gap-1">
              <LineChart className="h-4 w-4" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              Monthly Data
            </TabsTrigger>
          </TabsList>
          <TabsContent value="charts" className="space-y-6">
            {/* Hourly Chart */}
            {hourlyAverages && (
              <div className="bg-white p-4 rounded border">
                <SolarChart
                  data={hourlyChartData}
                  xKey="hour"
                  yKey="value"
                  title="Average Daily Energy Production Profile"
                  type="line"
                  color="#8884d8"
                  xLabel="Hour of Day"
                  yLabel="Average Energy (kWh)"
                  yTickFormatter={(value: number) => `${value.toFixed(2)}`}
                  height={300}
                />
              </div>
            )}

            {/* Monthly Chart - fixed to properly show data */}
            <div className="bg-white p-4 rounded border">
              <SolarChart
                data={monthlyChartData}
                xKey="month"
                yKey="energy"
                title="Monthly Energy Production"
                type="bar"
                color="#82ca9d"
                xLabel="Month"
                yLabel="Energy (kWh)"
                yTickFormatter={(value: number) => `${value.toFixed(0)}`}
                height={300}
              />
            </div>
          </TabsContent>
          <TabsContent value="monthly">
            {/* Monthly Breakdown Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border rounded shadow-sm text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Month</th>
                    <th className="px-4 py-2 text-right">AC Energy (kWh)</th>
                    <th className="px-4 py-2 text-right">DC Energy (kWh)</th>
                    <th className="px-4 py-2 text-right">POA Irrad. (kWh/m²/day)</th>
                  </tr>
                </thead>
                <tbody>
                  {monthNames.map((month, index) => (
                    <tr key={month} className="border-t hover:bg-muted/50">
                      <td className="px-4 py-2 font-medium">{month}</td>
                      <td className="px-4 py-2 text-right">{results.outputs.ac_monthly[index].toFixed(1)}</td>
                      <td className="px-4 py-2 text-right">{results.outputs.dc_monthly[index].toFixed(1)}</td>
                      <td className="px-4 py-2 text-right">{results.outputs.poa_monthly[index].toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* System & Location Info */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-muted p-4 rounded">
                <h3 className="font-semibold mb-2">System Configuration Summary</h3>
                <div className="space-y-1">
                  <div className="grid grid-cols-2">
                    <span className="text-muted-foreground">Panel:</span>
                    <span>{selectedPanel?.manufacturer} {selectedPanel?.model}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-muted-foreground">Inverter:</span>
                    <span>{selectedInverter?.manufacturer} {selectedInverter?.model}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-muted-foreground">System Size:</span>
                    <span>{systemCapacity} kWp</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-muted-foreground">System Losses:</span>
                    <span>{formatLosses()}%</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-muted-foreground">Tilt/Azimuth:</span>
                    <span>{results.inputs.tilt}°/{results.inputs.azimuth}°</span>
                  </div>
                </div>
              </div>
              <div className="bg-muted p-4 rounded">
                <h3 className="font-semibold mb-2">Location & API Info</h3>
                <div className="space-y-1">
                  <div className="grid grid-cols-2">
                    <span className="text-muted-foreground">Location:</span>
                    <span>{results.station_info.city}, {results.station_info.state}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-muted-foreground">Lat/Lon:</span>
                    <span>{results.station_info.lat.toFixed(4)}, {results.station_info.lon.toFixed(4)}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-muted-foreground">Elevation:</span>
                    <span>{results.station_info.elev} m</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-muted-foreground">Capacity Factor:</span>
                    <Badge>{(results.outputs.capacity_factor * 100).toFixed(1)}%</Badge>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-muted-foreground">PVWatts Version:</span>
                    <span>{results.version}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProductionResults;
