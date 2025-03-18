
import React from "react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Area, 
  AreaChart,
  ReferenceLine,
  ComposedChart
} from "recharts";

interface SolarChartProps {
  data: any[];
  xKey: string;
  yKey?: string;
  yKey2?: string;
  barKeys?: string[];
  lineKey?: string;
  title: string;
  type: "line" | "bar" | "area" | "composed";
  color?: string;
  color2?: string;
  colors?: string[];
  xLabel?: string;
  yLabel?: string;
  height?: number;
  areaFillOpacity?: number;
  yTickFormatter?: (value: number) => string;
  legend?: { key: string; label: string; color: string }[];
}

const SolarChart: React.FC<SolarChartProps> = ({ 
  data, 
  xKey, 
  yKey = 'value', 
  yKey2,
  barKeys = [],
  lineKey,
  title, 
  type, 
  color = "#8884d8", 
  color2,
  colors = ["#8884d8", "#82ca9d", "#ffc658"],
  xLabel = "", 
  yLabel = "", 
  height = 400,
  areaFillOpacity = 0.3,
  yTickFormatter = (value) => `${value}`,
  legend
}) => {
  if (data.length === 0) {
    return <div className="text-center text-muted-foreground">No data available</div>;
  }
  
  const renderChart = () => {
    switch (type) {
      case "line":
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis 
              dataKey={xKey} 
              label={{ value: xLabel, position: 'insideBottom', offset: -5 }} 
            />
            <YAxis 
              label={{ value: yLabel, angle: -90, position: 'insideLeft' }} 
              tickFormatter={yTickFormatter}
            />
            <Tooltip formatter={(value) => yTickFormatter(Number(value))} />
            <Line 
              type="monotone" 
              dataKey={yKey} 
              stroke={color} 
              activeDot={{ r: 8 }} 
              name={yKey}
            />
            {yKey2 && (
              <Line 
                type="monotone" 
                dataKey={yKey2} 
                stroke={color2 || "#82ca9d"} 
                activeDot={{ r: 8 }} 
                name={yKey2}
              />
            )}
            <ReferenceLine y={0} stroke="black" />
          </LineChart>
        );
      case "bar":
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis 
              dataKey={xKey} 
              label={{ value: xLabel, position: 'insideBottom', offset: -5 }} 
            />
            <YAxis 
              label={{ value: yLabel, angle: -90, position: 'insideLeft' }} 
              tickFormatter={yTickFormatter}
            />
            <Tooltip formatter={(value) => yTickFormatter(Number(value))} />
            <Bar 
              dataKey={yKey} 
              fill={color} 
              name={yKey}
            />
          </BarChart>
        );
      case "area":
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis 
              dataKey={xKey} 
              label={{ value: xLabel, position: 'insideBottom', offset: -5 }} 
            />
            <YAxis 
              label={{ value: yLabel, angle: -90, position: 'insideLeft' }} 
              tickFormatter={yTickFormatter}
            />
            <Tooltip formatter={(value) => yTickFormatter(Number(value))} />
            <Area 
              type="monotone" 
              dataKey={yKey} 
              stroke={color} 
              fill={color} 
              fillOpacity={areaFillOpacity}
              name={yKey}
            />
            <ReferenceLine y={0} stroke="black" />
          </AreaChart>
        );
      case "composed":
        return (
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis 
              dataKey={xKey} 
              label={{ value: xLabel, position: 'insideBottom', offset: -5 }} 
            />
            <YAxis 
              label={{ value: yLabel, angle: -90, position: 'insideLeft' }} 
              tickFormatter={yTickFormatter}
            />
            <Tooltip formatter={(value) => yTickFormatter(Number(value))} />
            {barKeys && barKeys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={colors[index % colors.length]} stackId="a" />
            ))}
            {lineKey && (
              <Line 
                type="monotone" 
                dataKey={lineKey} 
                stroke={colors[barKeys.length % colors.length]} 
                strokeWidth={2}
              />
            )}
            {legend && <Legend />}
          </ComposedChart>
        );
      default:
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey={yKey} stroke={color} activeDot={{ r: 8 }} />
          </LineChart>
        );
    }
  };

  return (
    <div className="w-full">
      {title && <h3 className="text-center text-lg font-medium mb-4">{title}</h3>}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      
      {legend && (
        <div className="flex flex-wrap justify-center mt-4 gap-4">
          {legend.map((item) => (
            <div key={item.key} className="flex items-center">
              <div 
                className="w-3 h-3 mr-1"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SolarChart;
