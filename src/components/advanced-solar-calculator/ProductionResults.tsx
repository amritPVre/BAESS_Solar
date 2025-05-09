
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SolarCalculationResult } from '@/types/solarCalculations';
import { BarChart3, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Temporary chart representation since we can't use react-chartjs-2
const SimpleBarChart = ({ data, labels }: { data: number[], labels: string[] }) => (
  <div className="relative h-64 w-full">
    <div className="flex h-full items-end justify-between gap-2 overflow-hidden rounded">
      {data.map((value, index) => {
        const heightPercentage = Math.max(5, (value / Math.max(...data)) * 100);
        return (
          <div key={index} className="group relative flex h-full w-full flex-col justify-end">
            <div 
              className="bg-primary rounded-t w-full transition-all duration-300 group-hover:bg-primary/80" 
              style={{ height: `${heightPercentage}%` }}
            ></div>
            <span className="mt-1 text-[8px] sm:text-xs text-center overflow-hidden text-ellipsis">
              {labels[index]}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

interface ProductionResultsProps {
  results: SolarCalculationResult;
  systemParams?: {
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
  selectedPanel?: any;
  selectedInverter?: any;
  polygonConfigs?: any[];
  onNewCalculation?: () => void;
}

const ProductionResults: React.FC<ProductionResultsProps> = ({ 
  results,
  systemParams,
  selectedPanel,
  selectedInverter,
  polygonConfigs,
  onNewCalculation
}) => {
  // Extract monthly data
  const monthlyLabels = results.energy.monthly.map(item => item.Month);
  const monthlyData = results.energy.monthly.map(item => item["Monthly Energy Production (kWh)"]);
  
  // Extract yearly data with degradation
  const yearlyLabels = Array.from({ length: results.yearlyProduction.length }, (_, i) => `Year ${i + 1}`);
  const yearlyData = results.yearlyProduction;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <span>Solar Production Results</span>
          </CardTitle>
          {onNewCalculation && (
            <Button variant="outline" size="sm" onClick={onNewCalculation}>
              Run New Calculation
            </Button>
          )}
        </div>
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
            <BarChart3 className="h-5 w-5" />
            <span>Monthly Production</span>
          </h3>
          <div className="h-80 w-full bg-white p-4 rounded shadow">
            <SimpleBarChart data={monthlyData} labels={monthlyLabels} />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            <span>Annual Production with Degradation</span>
          </h3>
          <div className="h-80 w-full bg-white p-4 rounded shadow">
            <SimpleBarChart data={yearlyData} labels={yearlyLabels} />
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
            {systemParams && (
              <>
                <div>
                  <p className="text-sm text-gray-600">Tilt Angle</p>
                  <p className="font-semibold">{systemParams.tilt}°</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Azimuth</p>
                  <p className="font-semibold">{systemParams.azimuth}°</p>
                </div>
              </>
            )}
          </div>
        </div>
        
        {polygonConfigs && polygonConfigs.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Installation Areas</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Area
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size (m²)
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modules
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {polygonConfigs.map((config, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        Area {index + 1}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                        {config.area.toFixed(1)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-center">
                        {config.structureType === 'fixed_tilt' ? 'Fixed Tilt' : 
                         config.structureType === 'ballasted' ? 'Ballasted' : 
                         config.structureType}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                        {config.capacityKw.toFixed(2)} kW
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                        {config.moduleCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductionResults;
