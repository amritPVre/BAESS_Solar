
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
  yKey3?: string; // Added third y-key support
  barKeys?: string[];
  lineKey?: string;
  title: string;
  type: "line" | "bar" | "area" | "composed";
  color?: string;
  color2?: string;
  color3?: string; // Added color for third data series
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
  yKey3, // Added third y-key
  barKeys = [],
  lineKey,
  title, 
  type, 
  color = "#8884d8", 
  color2,
  color3, // Added color3
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
  
  // Custom tooltip styles
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-white p-3 rounded-md shadow-md border border-gray-100">
          <p className="font-medium mb-1">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {yTickFormatter(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
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
            <Tooltip formatter={(value) => yTickFormatter(Number(value))} content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey={yKey} 
              stroke={color} 
              activeDot={{ r: 8 }} 
              name={yKey}
              strokeWidth={2}
              dot={{ strokeWidth: 2 }}
            />
            {yKey2 && (
              <Line 
                type="monotone" 
                dataKey={yKey2} 
                stroke={color2 || "#82ca9d"} 
                activeDot={{ r: 8 }} 
                name={yKey2}
                strokeWidth={2}
                dot={{ strokeWidth: 2 }}
              />
            )}
            {yKey3 && (
              <Line 
                type="monotone" 
                dataKey={yKey3} 
                stroke={color3 || "#ffc658"} 
                activeDot={{ r: 8 }} 
                name={yKey3}
                strokeWidth={2}
                dot={{ strokeWidth: 2 }}
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
            <Tooltip formatter={(value) => yTickFormatter(Number(value))} content={<CustomTooltip />} />
            <Bar 
              dataKey={yKey} 
              fill={color} 
              name={yKey}
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
            {yKey2 && (
              <Bar 
                dataKey={yKey2} 
                fill={color2 || "#82ca9d"} 
                name={yKey2}
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
              />
            )}
            {yKey3 && (
              <Bar 
                dataKey={yKey3} 
                fill={color3 || "#ffc658"} 
                name={yKey3}
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
              />
            )}
          </BarChart>
        );
      case "area":
        return (
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`colorGradient-${yKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis 
              dataKey={xKey} 
              label={{ value: xLabel, position: 'insideBottom', offset: -5 }} 
            />
            <YAxis 
              label={{ value: yLabel, angle: -90, position: 'insideLeft' }} 
              tickFormatter={yTickFormatter}
            />
            <Tooltip formatter={(value) => yTickFormatter(Number(value))} content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey={yKey} 
              stroke={color} 
              fill={`url(#colorGradient-${yKey})`}
              fillOpacity={1}
              name={yKey}
              animationDuration={1500}
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
            <Tooltip formatter={(value) => yTickFormatter(Number(value))} content={<CustomTooltip />} />
            {barKeys && barKeys.map((key, index) => (
              <Bar 
                key={key} 
                dataKey={key} 
                fill={colors[index % colors.length]} 
                stackId="a" 
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
              />
            ))}
            {lineKey && (
              <Line 
                type="monotone" 
                dataKey={lineKey} 
                stroke={colors[barKeys.length % colors.length]} 
                strokeWidth={2}
                activeDot={{ r: 6 }}
                dot={{ strokeWidth: 2 }}
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
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey={yKey} stroke={color} activeDot={{ r: 8 }} />
          </LineChart>
        );
    }
  };

  return (
    <div className="w-full">
      {title && <h3 className="text-center text-lg font-semibold mb-4 text-solar-dark">{title}</h3>}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      
      {legend && (
        <div className="flex flex-wrap justify-center mt-4 gap-4">
          {legend.map((item) => (
            <div key={item.key} className="flex items-center bg-white px-2 py-1 rounded-full shadow-sm">
              <div 
                className="w-3 h-3 mr-1 rounded-full"
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
