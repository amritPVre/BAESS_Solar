
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SolarCalculationResult } from "@/types/solarCalculations";
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ChartOptions } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export interface ProductionResultsProps {
  results: SolarCalculationResult;
  systemParams: {
    capacity: number;
    tilt: number;
    azimuth: number;
    moduleEfficiency: number;
    losses: number;
    arrayType: number;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  selectedPanel: any;
  selectedInverter: any;
  polygonConfigs: any[];
  onNewCalculation: () => void;
}

// Array type names for display
const ARRAY_TYPE_NAMES = [
  "Fixed (open rack)",
  "Fixed (roof mount)",
  "1-Axis Tracking",
  "2-Axis Tracking"
];

const ProductionResults: React.FC<ProductionResultsProps> = ({
  results,
  systemParams,
  selectedPanel,
  selectedInverter,
  polygonConfigs,
  onNewCalculation
}) => {
  const [chartData, setChartData] = useState<any>(null);
  
  // Process results for display
  useEffect(() => {
    if (results && results.energy && results.energy.monthly) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      const monthlyData = results.energy.monthly.map(item => item["Monthly Energy Production (kWh)"]);
      const monthlyIrradiation = results.irradiation.monthly.map(item => item["Monthly Solar Irradiation (kWh/m²)"]);
      
      setChartData({
        labels: monthNames,
        datasets: [
          {
            label: 'Monthly Energy Production (kWh)',
            data: monthlyData,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            type: 'bar'
          },
          {
            label: 'Solar Irradiation (kWh/m²)',
            data: monthlyIrradiation,
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 2,
            type: 'line',
            yAxisID: 'y1'
          }
        ]
      });
    }
  }, [results]);
  
  // Chart options
  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Energy Production & Solar Irradiation',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Energy Production (kWh)',
        }
      },
      y1: {
        beginAtZero: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Irradiation (kWh/m²)',
        }
      },
    },
  };
  
  // Calculate annual energy summary
  const totalEnergyProduction = results.energy.metrics?.total_yearly || 0;
  const specificYield = systemParams.capacity > 0 ? totalEnergyProduction / systemParams.capacity : 0;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Solar Energy Production Results</h2>
        <Button onClick={onNewCalculation} variant="outline">
          New Calculation
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Annual Energy Production</p>
              <p className="text-3xl font-bold">{totalEnergyProduction.toFixed(0)} kWh</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Specific Yield</p>
              <p className="text-3xl font-bold">{specificYield.toFixed(0)} kWh/kWp</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Daily Average</p>
              <p className="text-3xl font-bold">{(totalEnergyProduction / 365).toFixed(1)} kWh</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {chartData && (
        <Card>
          <CardContent className="pt-6">
            <div style={{ height: '400px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">System Configuration</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">System Capacity:</span>
                <span>{systemParams.capacity.toFixed(2)} kWp</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Module Type:</span>
                <span>{selectedPanel?.manufacturer} {selectedPanel?.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mounting:</span>
                <span>{ARRAY_TYPE_NAMES[systemParams.arrayType]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tilt Angle:</span>
                <span>{systemParams.tilt}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Azimuth:</span>
                <span>{systemParams.azimuth}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">System Losses:</span>
                <span>{systemParams.losses}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Location Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Latitude:</span>
                <span>{systemParams.latitude.toFixed(4)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Longitude:</span>
                <span>{systemParams.longitude.toFixed(4)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Timezone:</span>
                <span>{systemParams.timezone}</span>
              </div>
              {results.irradiation && results.irradiation.metrics && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Yearly Irradiation:</span>
                    <span>{results.irradiation.metrics.total_yearly.toFixed(0)} kWh/m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average Daily Irradiation:</span>
                    <span>{(results.irradiation.metrics.total_yearly / 365).toFixed(2)} kWh/m²</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Energy Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Energy (kWh)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Irradiation (kWh/m²)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Daily (kWh)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.energy.monthly.map((item, index) => {
                const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][index];
                const dailyEnergy = item["Monthly Energy Production (kWh)"] / daysInMonth;
                
                return (
                  <tr key={`month-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.Month}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item["Monthly Energy Production (kWh)"].toFixed(1)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {results.irradiation.monthly[index]["Monthly Solar Irradiation (kWh/m²)"].toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dailyEnergy.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductionResults;
