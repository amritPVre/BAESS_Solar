
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SolarCalculationResult } from '@/types/solarCalculations';
import { LineChart, BarChart } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';

interface ProductionResultsProps {
  results: SolarCalculationResult;
}

const ProductionResults: React.FC<ProductionResultsProps> = ({ results }) => {
  // Chart data for monthly energy production
  const monthlyEnergyData = {
    labels: results.energy.monthly.map(item => item.Month),
    datasets: [
      {
        label: 'Monthly Energy (kWh)',
        data: results.energy.monthly.map(item => item["Monthly Energy Production (kWh)"]),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  // Chart data for yearly production with degradation
  const yearlyProductionData = {
    labels: Array.from({ length: results.yearlyProduction.length }, (_, i) => `Year ${i + 1}`),
    datasets: [
      {
        label: 'Yearly Energy (kWh)',
        data: results.yearlyProduction,
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 2,
      },
    ],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          <span>Solar Production Results</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-600">Annual Production</p>
            <p className="text-xl font-bold">{Math.round(results.energy.metrics.total_yearly).toLocaleString()} kWh</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-600">System Size</p>
            <p className="text-xl font-bold">{results.system.calculated_capacity.toFixed(2)} kW</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-600">Specific Yield</p>
            <p className="text-xl font-bold">
              {(results.energy.metrics.total_yearly / results.system.calculated_capacity).toFixed(0)} kWh/kWp
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            <span>Monthly Production</span>
          </h3>
          <div className="h-80 w-full bg-white p-4 rounded shadow">
            <Bar data={monthlyEnergyData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            <span>Annual Production with Degradation</span>
          </h3>
          <div className="h-80 w-full bg-white p-4 rounded shadow">
            <Line data={yearlyProductionData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">System Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Number of Modules</p>
              <p className="font-semibold">{results.system.total_modules}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Array Area</p>
              <p className="font-semibold">{results.system.total_area.toFixed(1)} m²</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductionResults;
