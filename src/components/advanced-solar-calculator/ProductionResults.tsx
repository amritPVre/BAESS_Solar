
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SolarCalculationResult } from '@/types/solarCalculations';
import { Sun, BarChart3, Layers, Download } from "lucide-react";

interface ProductionResultsProps {
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

const ProductionResults: React.FC<ProductionResultsProps> = ({
  results,
  systemParams,
  selectedPanel,
  selectedInverter,
  polygonConfigs,
  onNewCalculation
}) => {
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat(undefined, { 
      maximumFractionDigits: 1 
    }).format(value);
  };

  // Determine array type name
  const getArrayTypeName = (arrayType: number) => {
    switch (arrayType) {
      case 0: return "Fixed (open rack)";
      case 1: return "Fixed (roof mount)";
      case 2: return "1-Axis Tracking";
      case 3: return "2-Axis Tracking";
      default: return "Unknown";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Solar Energy Production Results</h2>
        <Button onClick={() => window.print()} variant="outline" size="sm" className="hidden md:flex">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50/50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
              Energy Production
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Annual:</span>
                <span className="font-bold text-xl">{formatNumber(results.energy.metrics.total_yearly)} kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daily Average:</span>
                <span className="font-medium">{formatNumber(results.energy.metrics.total_yearly / 365)} kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Specific Yield:</span>
                <span className="font-medium">
                  {formatNumber(results.energy.metrics.total_yearly / systemParams.capacity)} kWh/kWp
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Sun className="h-5 w-5 mr-2 text-amber-600" />
              Solar Irradiation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Annual:</span>
                <span className="font-bold text-xl">
                  {formatNumber(results.irradiation.metrics.total_yearly)} kWh/m²
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daily Average:</span>
                <span className="font-medium">
                  {formatNumber(results.irradiation.metrics.total_yearly / 365)} kWh/m²
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Performance Ratio:</span>
                <span className="font-medium">{(systemParams.moduleEfficiency * 100).toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50/50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Layers className="h-5 w-5 mr-2 text-blue-600" />
              System Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capacity:</span>
                <span className="font-bold text-xl">{formatNumber(systemParams.capacity)} kWp</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modules:</span>
                <span className="font-medium">{results.system.total_modules}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Array Type:</span>
                <span className="font-medium">{getArrayTypeName(systemParams.arrayType)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Monthly Energy Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center border rounded p-4">
            {/* This would normally contain chart components */}
            <p className="text-center text-muted-foreground">
              Monthly energy production chart would be displayed here
              <br />
              <span className="text-sm">
                Jan: {formatNumber(results.energy.monthly[0]["Monthly Energy Production (kWh)"])} kWh,
                Feb: {formatNumber(results.energy.monthly[1]["Monthly Energy Production (kWh)"])} kWh,
                ...
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {polygonConfigs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Installation Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left text-sm">Area</th>
                    <th className="px-3 py-2 text-left text-sm">Structure</th>
                    <th className="px-3 py-2 text-right text-sm">Size (m²)</th>
                    <th className="px-3 py-2 text-center text-sm">Azimuth</th>
                    <th className="px-3 py-2 text-right text-sm">Modules</th>
                    <th className="px-3 py-2 text-right text-sm">Capacity (kWp)</th>
                  </tr>
                </thead>
                <tbody>
                  {polygonConfigs.map((config, index) => (
                    <tr key={`poly-${index}`} className="border-t border-muted">
                      <td className="px-3 py-2 text-sm font-medium">Area {index + 1}</td>
                      <td className="px-3 py-2 text-sm">
                        {config.structureType === 'ballasted' && 'Ballasted Roof'}
                        {config.structureType === 'fixed_tilt' && 'Fixed Ground Mount'}
                        {config.structureType === 'ground_mount_tables' && 'Ground Mount Tables'}
                        {config.structureType === 'carport' && 'Carport'}
                      </td>
                      <td className="px-3 py-2 text-sm text-right">{config.area.toFixed(1)}</td>
                      <td className="px-3 py-2 text-sm text-center">
                        {config.azimuth.toFixed(0)}°
                      </td>
                      <td className="px-3 py-2 text-sm text-right">{config.moduleCount}</td>
                      <td className="px-3 py-2 text-sm text-right">{config.capacityKw.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onNewCalculation}>
          Modify Parameters
        </Button>
        <Button onClick={() => window.print()} variant="default">
          <Download className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>
    </div>
  );
};

export default ProductionResults;
