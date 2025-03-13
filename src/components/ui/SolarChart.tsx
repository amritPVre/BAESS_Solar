
import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, LineChart, Line, Legend, ResponsiveContainer } from "recharts";

type ChartType = "area" | "bar" | "line";

interface SolarChartProps {
  data: Array<any>;
  xKey: string;
  yKey: string;
  yKey2?: string;
  title: string;
  type?: ChartType;
  color?: string;
  color2?: string;
  xLabel?: string;
  yLabel?: string;
  areaFillOpacity?: number;
  hideXAxis?: boolean;
  hideYAxis?: boolean;
  hideGrid?: boolean;
  hideLegend?: boolean;
  height?: number;
  xTickFormatter?: (value: any) => string;
  yTickFormatter?: (value: any) => string;
}

const SolarChart: React.FC<SolarChartProps> = ({
  data,
  xKey,
  yKey,
  yKey2,
  title,
  type = "area",
  color = "#4CB571",
  color2 = "#0496FF",
  xLabel,
  yLabel,
  areaFillOpacity = 0.2,
  hideXAxis = false,
  hideYAxis = false,
  hideGrid = false,
  hideLegend = true,
  height = 300,
  xTickFormatter,
  yTickFormatter
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const renderChart = () => {
    switch (type) {
      case "area":
        return (
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            {!hideGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />}
            {!hideXAxis && <XAxis 
              dataKey={xKey} 
              label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -10 } : undefined}
              tickFormatter={xTickFormatter}
            />}
            {!hideYAxis && <YAxis 
              label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft' } : undefined}
              tickFormatter={yTickFormatter}
            />}
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                border: 'none', 
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number) => {
                return yTickFormatter ? yTickFormatter(value) : value;
              }}
            />
            {!hideLegend && <Legend />}
            <Area
              type="monotone"
              dataKey={yKey}
              stroke={color}
              fill={color}
              fillOpacity={areaFillOpacity}
              animationDuration={1500}
              strokeWidth={2}
            />
            {yKey2 && (
              <Area
                type="monotone"
                dataKey={yKey2}
                stroke={color2}
                fill={color2}
                fillOpacity={areaFillOpacity}
                animationDuration={1500}
                strokeWidth={2}
              />
            )}
          </AreaChart>
        );
      case "bar":
        return (
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            {!hideGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />}
            {!hideXAxis && <XAxis 
              dataKey={xKey} 
              label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -10 } : undefined}
              tickFormatter={xTickFormatter}
            />}
            {!hideYAxis && <YAxis 
              label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft' } : undefined}
              tickFormatter={yTickFormatter}
            />}
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                border: 'none', 
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number) => {
                return yTickFormatter ? yTickFormatter(value) : value;
              }}
            />
            {!hideLegend && <Legend />}
            <Bar
              dataKey={yKey}
              fill={color}
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
            {yKey2 && (
              <Bar
                dataKey={yKey2}
                fill={color2}
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
              />
            )}
          </BarChart>
        );
      case "line":
        return (
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            {!hideGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />}
            {!hideXAxis && <XAxis 
              dataKey={xKey} 
              label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -10 } : undefined}
              tickFormatter={xTickFormatter}
            />}
            {!hideYAxis && <YAxis 
              label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft' } : undefined}
              tickFormatter={yTickFormatter}
            />}
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                border: 'none', 
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number) => {
                return yTickFormatter ? yTickFormatter(value) : value;
              }}
            />
            {!hideLegend && <Legend />}
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              animationDuration={1500}
            />
            {yKey2 && (
              <Line
                type="monotone"
                dataKey={yKey2}
                stroke={color2}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                animationDuration={1500}
              />
            )}
          </LineChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white p-4 rounded-xl shadow-sm transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div style={{ width: '100%', height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SolarChart;
