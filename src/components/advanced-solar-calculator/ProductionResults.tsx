import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SolarCalculationResult } from "@/types/solarCalculations";
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ChartOptions, Filler, TooltipItem } from 'chart.js';
import { FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import AdvancedPDFReport from './AdvancedPDFReport';
import { ACConfiguration } from './ACSideConfiguration';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// Professional color palette with gradients
const CHART_COLORS = {
  solar: {
    primary: '#FF6B35',
    secondary: '#F7931E',
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    rgb: '255, 107, 53',
    light: '#FFE4DC'
  },
  energy: {
    primary: '#00D2FF',
    secondary: '#3A7BD5',
    gradient: 'linear-gradient(135deg, #00D2FF 0%, #3A7BD5 100%)',
    rgb: '0, 210, 255',
    light: '#E6F7FF'
  },
  irradiance: {
    primary: '#FFD700',
    secondary: '#FF8C00',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
    rgb: '255, 215, 0',
    light: '#FFF8DC'
  },
  production: {
    primary: '#00C851',
    secondary: '#007E33',
    gradient: 'linear-gradient(135deg, #00C851 0%, #007E33 100%)',
    rgb: '0, 200, 81',
    light: '#E8F5E8'
  },
  accent: {
    primary: '#8E44AD',
    secondary: '#6C3483',
    gradient: 'linear-gradient(135deg, #8E44AD 0%, #6C3483 100%)',
    rgb: '142, 68, 173',
    light: '#F4F0F7'
  },
  neutral: {
    primary: '#718096',
    secondary: '#4A5568',
    gradient: 'linear-gradient(135deg, #718096 0%, #4A5568 100%)',
    rgb: '113, 128, 150',
    light: '#F7FAFC'
  }
};

// Helper function to create gradient backgrounds
const createGradient = (ctx: CanvasRenderingContext2D, color: string, opacity: number = 0.3) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, `rgba(${color}, ${opacity})`);
  gradient.addColorStop(1, `rgba(${color}, 0)`);
  return gradient;
};

// Enhanced chart options with professional styling
const getChartOptions = (type: 'line' | 'bar' = 'line'): ChartOptions<'line' | 'bar'> => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 20,
        font: {
          size: 12,
          weight: 'bold'
        },
        color: '#374151'
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      cornerRadius: 8,
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        size: 12
      },
      padding: 12,
      displayColors: true,
      callbacks: {
        label: function(context: TooltipItem<'line' | 'bar'>) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }).format(context.parsed.y);
          }
          return label;
        }
      }
    },
  },
  scales: {
    x: {
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.05)',
        lineWidth: 1,
      },
      ticks: {
        color: '#6b7280',
        font: {
          size: 11,
          weight: 'normal'
        }
      },
      border: {
        display: false
      }
    },
    y: {
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.05)',
        lineWidth: 1,
      },
      ticks: {
        color: '#6b7280',
        font: {
          size: 11,
          weight: 'normal'
        }
      },
      border: {
        display: false
      }
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      grid: {
        drawOnChartArea: false,
      },
      ticks: {
        color: '#6b7280',
        font: {
          size: 11,
          weight: 'normal'
        }
      },
      border: {
        display: false
      }
    },
  },
  elements: {
    line: {
      tension: 0.3,
      borderWidth: 3,
      borderCapStyle: 'round',
      borderJoinStyle: 'round',
    },
    point: {
      radius: type === 'line' ? 4 : 0,
      hoverRadius: 8,
      borderWidth: 2,
      hoverBorderWidth: 3,
    },
    bar: {
      borderRadius: 4,
      borderSkipped: false,
    }
  },
  animation: {
    duration: 1000,
    easing: 'easeInOutQuart',
  },
});

interface SolarPanel {
  manufacturer?: string;
  model?: string;
  wattPeak?: number;
  efficiency?: number;
  [key: string]: unknown;
}

interface SolarInverter {
  manufacturer?: string;
  model?: string;
  inputPower?: number;
  efficiency?: number;
  [key: string]: unknown;
}

interface PolygonConfig {
  moduleCount?: number;
  area?: number;
  structureType?: string;
  [key: string]: unknown;
}

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
    dcAcRatio: number;
    inverterCount: number;
  };
  selectedPanel: SolarPanel;
  selectedInverter: SolarInverter;
  polygonConfigs: PolygonConfig[];
  acConfiguration: ACConfiguration;
  detailedLosses?: Record<string, number>;
  mapImage?: string | null;
  mapMetadata?: {
    totalCapacity?: number;
    moduleCount?: number;
    totalArea?: number;
    structureType?: string;
    timestamp?: Date;
  } | null;
  sldImage?: string | null;
  sldMetadata?: {
    connectionType: 'LV' | 'HV';
    systemSize: number;
    inverterType: string;
    timestamp: Date;
  } | null;
  onNewCalculation: () => void;
}

// Array type names for display
const ARRAY_TYPE_NAMES = [
  "Fixed (open rack)",
  "Fixed (roof mount)",
  "2-Axis Tracking"
];

// Add data processing functions
const processHourlyData = (results: SolarCalculationResult) => {
  if (!results.energy.hourly || !results.irradiation.hourly) {
    return null;
  }

  const hourlyAC = results.energy.hourly;
  const hourlyDC = results.energy.hourlyDC || [];
  const hourlyPOA = results.irradiation.hourly.poa || [];
  const hourlyDNI = results.irradiation.hourly.dn || [];
  const hourlyDiffuse = results.irradiation.hourly.df || [];
  const hourlyTcell = results.irradiation.hourly.tcell || [];

  // Calculate hourly averages (24 hours) - only include non-zero values for better daylight averages
  const hourlyAvgPOA = Array(24).fill(0).map((_, hour) => {
    const hourlyValues = [];
    for (let day = 0; day < 365; day++) {
      const index = day * 24 + hour;
      if (index < hourlyPOA.length && hourlyPOA[index] > 0) {
        hourlyValues.push(hourlyPOA[index]);
      }
    }
    return hourlyValues.length > 0 ? hourlyValues.reduce((sum, val) => sum + val, 0) / hourlyValues.length : 0;
  });

  const hourlyAvgDNI = Array(24).fill(0).map((_, hour) => {
    const hourlyValues = [];
    for (let day = 0; day < 365; day++) {
      const index = day * 24 + hour;
      if (index < hourlyDNI.length && hourlyDNI[index] > 0) {
        hourlyValues.push(hourlyDNI[index]);
      }
    }
    return hourlyValues.length > 0 ? hourlyValues.reduce((sum, val) => sum + val, 0) / hourlyValues.length : 0;
  });

  const hourlyAvgDiffuse = Array(24).fill(0).map((_, hour) => {
    const hourlyValues = [];
    for (let day = 0; day < 365; day++) {
      const index = day * 24 + hour;
      if (index < hourlyDiffuse.length && hourlyDiffuse[index] > 0) {
        hourlyValues.push(hourlyDiffuse[index]);
      }
    }
    return hourlyValues.length > 0 ? hourlyValues.reduce((sum, val) => sum + val, 0) / hourlyValues.length : 0;
  });

  const hourlyAvgDC = Array(24).fill(0).map((_, hour) => {
    const hourlyValues = [];
    for (let day = 0; day < 365; day++) {
      const index = day * 24 + hour;
      if (index < hourlyDC.length && hourlyDC[index] > 0) {
        hourlyValues.push(hourlyDC[index]);
      }
    }
    return hourlyValues.length > 0 ? hourlyValues.reduce((sum, val) => sum + val, 0) / hourlyValues.length : 0;
  });

  const hourlyAvgAC = Array(24).fill(0).map((_, hour) => {
    const hourlyValues = [];
    for (let day = 0; day < 365; day++) {
      const index = day * 24 + hour;
      if (index < hourlyAC.length && hourlyAC[index] > 0) {
        hourlyValues.push(hourlyAC[index]);
      }
    }
    return hourlyValues.length > 0 ? hourlyValues.reduce((sum, val) => sum + val, 0) / hourlyValues.length : 0;
  });

  // Create Tcell heatmap data (365 days x 24 hours)
  const tcellHeatmapData = [];
  for (let day = 0; day < 365; day++) {
    const dayData = [];
    for (let hour = 0; hour < 24; hour++) {
      const index = day * 24 + hour;
      dayData.push(index < hourlyTcell.length ? hourlyTcell[index] : 0);
    }
    tcellHeatmapData.push(dayData);
  }

  // Create AC power heatmap data (365 days x 24 hours)
  const acPowerHeatmapData = [];
  for (let day = 0; day < 365; day++) {
    const dayData = [];
    for (let hour = 0; hour < 24; hour++) {
      const index = day * 24 + hour;
      dayData.push(index < hourlyAC.length ? hourlyAC[index] : 0);
    }
    acPowerHeatmapData.push(dayData);
  }

  return {
    hourlyAvgPOA,
    hourlyAvgDNI,
    hourlyAvgDiffuse,
    hourlyAvgDC,
    hourlyAvgAC,
    tcellHeatmapData,
    acPowerHeatmapData
  };
};

const processDailyData = (results: SolarCalculationResult) => {
  if (!results.energy.hourly || !results.irradiation.hourly) {
    return null;
  }

  const hourlyAC = results.energy.hourly;
  const hourlyDC = results.energy.hourlyDC || [];
  const hourlyPOA = results.irradiation.hourly.poa || [];
  const hourlyDNI = results.irradiation.hourly.dn || [];
  const hourlyDiffuse = results.irradiation.hourly.df || [];
  const hourlyTcell = results.irradiation.hourly.tcell || [];
  const hourlyTamb = results.irradiation.hourly.tamb || [];

  // Calculate daily totals
  const dailyPOA = [];
  const dailyDNI = [];
  const dailyDiffuse = [];
  const dailyDC = [];
  const dailyAC = [];
  const dailyTcell = [];
  const dailyTamb = [];

  for (let day = 0; day < 365; day++) {
    let dayPOA = 0, dayDNI = 0, dayDiffuse = 0, dayDC = 0, dayAC = 0, dayTcell = 0, dayTamb = 0;
    let hourCount = 0;
    
    for (let hour = 0; hour < 24; hour++) {
      const index = day * 24 + hour;
      if (index < hourlyPOA.length) {
        dayPOA += hourlyPOA[index] || 0;
        dayDNI += hourlyDNI[index] || 0;
        dayDiffuse += hourlyDiffuse[index] || 0;
        dayDC += hourlyDC[index] || 0;
        dayAC += hourlyAC[index] || 0;
        dayTcell += hourlyTcell[index] || 0;
        dayTamb += hourlyTamb[index] || 0;
        hourCount++;
      }
    }
    
    dailyPOA.push(dayPOA);
    dailyDNI.push(dayDNI);
    dailyDiffuse.push(dayDiffuse);
    dailyDC.push(dayDC);
    dailyAC.push(dayAC);
    dailyTcell.push(hourCount > 0 ? dayTcell / hourCount : 0); // Average for temperature
    dailyTamb.push(hourCount > 0 ? dayTamb / hourCount : 0); // Average for temperature
  }

  return {
    dailyPOA,
    dailyDNI,
    dailyDiffuse,
    dailyDC,
    dailyAC,
    dailyTcell,
    dailyTamb
  };
};

const getMonthFromDay = (dayOfYear: number): number => {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let totalDays = 0;
  for (let month = 0; month < 12; month++) {
    totalDays += daysInMonth[month];
    if (dayOfYear < totalDays) {
      return month;
    }
  }
  return 11; // December
};

const ProductionResults: React.FC<ProductionResultsProps> = ({
  results,
  systemParams,
  selectedPanel,
  selectedInverter,
  polygonConfigs,
  acConfiguration,
  detailedLosses,
  mapImage,
  mapMetadata,
  sldImage,
  sldMetadata,
  onNewCalculation
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [chartData, setChartData] = useState<any>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState("monthly");
  const [showDataTable, setShowDataTable] = useState(false);
  
  // Debug mapImage prop
  useEffect(() => {
    console.log("ProductionResults - mapImage prop:", mapImage ? "Image received" : "No image");
    if (mapImage) {
      console.log("ProductionResults - mapImage length:", mapImage.length);
    }
  }, [mapImage]);

  // Excel export function for hourly data
  const exportHourlyDataToExcel = () => {
    if (!results.energy.hourly || !results.irradiation.hourly) {
      alert('Hourly data is not available for export.');
      return;
    }

    // Create hourly data with timestamps
    const hourlyData = [];
    const hoursInYear = Math.min(8760, results.energy.hourly.length);
    
    for (let hour = 0; hour < hoursInYear; hour++) {
      // Calculate date and time for each hour (assuming January 1st start)
      const startDate = new Date(new Date().getFullYear(), 0, 1);
      const currentHour = new Date(startDate.getTime() + hour * 60 * 60 * 1000);
      
      const rowData = {
        'Hour': hour + 1,
        'Date': currentHour.toISOString().split('T')[0],
        'Time': currentHour.toTimeString().split(' ')[0],
        'Month': currentHour.toLocaleDateString('en-US', { month: 'short' }),
        'Day': currentHour.getDate(),
        'Hour of Day': currentHour.getHours(),
        'AC Energy (kWh)': results.energy.hourly[hour]?.toFixed(3) || 0,
        'DC Energy (kWh)': results.energy.hourlyDC?.[hour]?.toFixed(3) || 0,
        'POA Irradiance (W/m²)': results.irradiation.hourly.poa?.[hour]?.toFixed(2) || 0,
        'DNI (W/m²)': results.irradiation.hourly.dn?.[hour]?.toFixed(2) || 0,
        'Diffuse (W/m²)': results.irradiation.hourly.df?.[hour]?.toFixed(2) || 0,
        'GHI (W/m²)': results.irradiation.hourly.gh?.[hour]?.toFixed(2) || 0,
        'Ambient Temp (°C)': results.irradiation.hourly.tamb?.[hour]?.toFixed(2) || 0,
        'Cell Temp (°C)': results.irradiation.hourly.tcell?.[hour]?.toFixed(2) || 0,
        'Wind Speed (m/s)': results.irradiation.hourly.wspd?.[hour]?.toFixed(2) || 0
      };
      
      hourlyData.push(rowData);
    }

    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();
    
    // Hourly Data Sheet
    const hourlyWorksheet = XLSX.utils.json_to_sheet(hourlyData);
    XLSX.utils.book_append_sheet(workbook, hourlyWorksheet, 'Hourly Data');

    // System Information Sheet
    const systemInfo = [
      { Parameter: 'System Capacity (kW)', Value: systemParams.capacity },
      { Parameter: 'Panel Efficiency (%)', Value: systemParams.moduleEfficiency },
      { Parameter: 'System Losses (%)', Value: systemParams.losses },
      { Parameter: 'Tilt Angle (°)', Value: systemParams.tilt },
      { Parameter: 'Azimuth Angle (°)', Value: systemParams.azimuth },
      { Parameter: 'Array Type', Value: systemParams.arrayType },
      { Parameter: 'Latitude', Value: systemParams.latitude },
      { Parameter: 'Longitude', Value: systemParams.longitude },
      { Parameter: 'Timezone', Value: systemParams.timezone },
      { Parameter: 'Annual Energy (kWh)', Value: results.energy.metrics.total_yearly?.toFixed(0) },
      { Parameter: 'Annual Irradiation (kWh/m²)', Value: results.irradiation.metrics.total_yearly?.toFixed(2) },
      { Parameter: 'Export Date', Value: new Date().toISOString().split('T')[0] },
      { Parameter: 'Export Time', Value: new Date().toTimeString().split(' ')[0] }
    ];
    
    const systemWorksheet = XLSX.utils.json_to_sheet(systemInfo);
    XLSX.utils.book_append_sheet(workbook, systemWorksheet, 'System Info');

    // Monthly Summary Sheet
    const monthlyData = results.energy.monthly.map((energyData, index) => ({
      'Month': energyData.Month,
      'Energy Production (kWh)': energyData['Monthly Energy Production (kWh)'].toFixed(2),
      'Solar Irradiation (kWh/m²)': results.irradiation.monthly[index]?.['Monthly Solar Irradiation (kWh/m²)']?.toFixed(2) || 0
    }));
    
    const monthlyWorksheet = XLSX.utils.json_to_sheet(monthlyData);
    XLSX.utils.book_append_sheet(workbook, monthlyWorksheet, 'Monthly Summary');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `Solar_Hourly_Data_${systemParams.capacity}kW_${timestamp}.xlsx`;

    // Save the file
    XLSX.writeFile(workbook, filename);
  };
  
  // Process results for display
  useEffect(() => {
    if (results && results.energy && results.energy.monthly) {
      // Process monthly data for charts

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      const monthlyData = results.energy.monthly.map(item => item["Monthly Energy Production (kWh)"]);
      const monthlyIrradiation = results.irradiation.monthly.map(item => item["Monthly Solar Irradiation (kWh/m²)"]);
      
              // Monthly data processed successfully
      
      setChartData({
        labels: monthNames,
        datasets: [
          {
            label: '⚡ Monthly Energy Production',
            data: monthlyData,
            backgroundColor: CHART_COLORS.production.primary,
            borderColor: CHART_COLORS.production.secondary,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
            hoverBackgroundColor: CHART_COLORS.production.secondary,
            hoverBorderColor: '#fff',
            hoverBorderWidth: 3,
            type: 'bar' as const
          },
          {
            label: '☀️ Solar Irradiation',
            data: monthlyIrradiation,
            backgroundColor: CHART_COLORS.irradiance.primary,
            borderColor: CHART_COLORS.irradiance.secondary,
            borderWidth: 3,
            pointBackgroundColor: CHART_COLORS.irradiance.primary,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: CHART_COLORS.irradiance.primary,
            pointRadius: 5,
            pointHoverRadius: 8,
            tension: 0.4,
            type: 'line',
            yAxisID: 'y1'
          }
        ]
      });
    }
  }, [results]);

  // Process data once when results change

  // Process data for different time scales
  const hourlyAnalysisData = processHourlyData(results);
  const dailyAnalysisData = processDailyData(results);
  
  // Chart options
  const chartOptions: ChartOptions<'bar'> = {
    ...getChartOptions('bar'),
    plugins: {
      ...getChartOptions('bar').plugins,
      title: {
        display: true,
        text: '📊 Monthly Energy Production & Solar Irradiation',
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#1f2937',
        padding: 20
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Energy Production (kWh)',
          font: {
            size: 12,
            weight: 'bold'
          },
          color: '#374151'
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          lineWidth: 1,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11
          }
        },
        border: {
          display: false
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
          font: {
            size: 12,
            weight: 'bold'
          },
          color: '#374151'
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11
          }
        },
        border: {
          display: false
        }
      },
    },
  };

  // Create chart data for hourly analysis
  const createHourlyChartData = (type: 'irradiance' | 'dc-ac') => {
    if (!hourlyAnalysisData) return null;

    const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
    
    if (type === 'irradiance') {
      return {
        labels: hours,
        datasets: [
          {
            label: '🌞 POA Irradiance',
            data: hourlyAnalysisData.hourlyAvgPOA,
            borderColor: CHART_COLORS.solar.primary,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            backgroundColor: function(context: any) {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              if (!chartArea) return null;
              return createGradient(ctx, CHART_COLORS.solar.rgb, 0.4);
            },
            fill: true,
            tension: 0.4,
            pointBackgroundColor: CHART_COLORS.solar.primary,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: CHART_COLORS.solar.primary,
            pointRadius: 3,
            pointHoverRadius: 6,
            borderWidth: 3
          },
          {
            label: '☀️ DNI Irradiance',
            data: hourlyAnalysisData.hourlyAvgDNI,
            borderColor: CHART_COLORS.irradiance.primary,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            backgroundColor: function(context: any) {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              if (!chartArea) return null;
              return createGradient(ctx, CHART_COLORS.irradiance.rgb, 0.4);
            },
            fill: true,
            tension: 0.4,
            pointBackgroundColor: CHART_COLORS.irradiance.primary,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: CHART_COLORS.irradiance.primary,
            pointRadius: 3,
            pointHoverRadius: 6,
            borderWidth: 3
          },
          {
            label: '🌤️ Diffuse Irradiance',
            data: hourlyAnalysisData.hourlyAvgDiffuse,
            borderColor: CHART_COLORS.accent.primary,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            backgroundColor: function(context: any) {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              if (!chartArea) return null;
              return createGradient(ctx, CHART_COLORS.accent.rgb, 0.4);
            },
            fill: true,
            tension: 0.4,
            pointBackgroundColor: CHART_COLORS.accent.primary,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: CHART_COLORS.accent.primary,
            pointRadius: 3,
            pointHoverRadius: 6,
            borderWidth: 3
          }
        ]
      };
    } else {
      return {
        labels: hours,
        datasets: [
          {
            label: '🔋 DC Power Output',
            data: hourlyAnalysisData.hourlyAvgDC,
            borderColor: CHART_COLORS.production.primary,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            backgroundColor: function(context: any) {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              if (!chartArea) return null;
              return createGradient(ctx, CHART_COLORS.production.rgb, 0.3);
            },
            fill: true,
            tension: 0.4,
            pointBackgroundColor: CHART_COLORS.production.primary,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: CHART_COLORS.production.primary,
            pointRadius: 3,
            pointHoverRadius: 6,
            borderWidth: 3,
            yAxisID: 'y'
          },
          {
            label: '⚡ AC Power Output',
            data: hourlyAnalysisData.hourlyAvgAC,
            borderColor: CHART_COLORS.energy.primary,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            backgroundColor: function(context: any) {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              if (!chartArea) return null;
              return createGradient(ctx, CHART_COLORS.energy.rgb, 0.3);
            },
            fill: true,
            tension: 0.4,
            pointBackgroundColor: CHART_COLORS.energy.primary,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: CHART_COLORS.energy.primary,
            pointRadius: 3,
            pointHoverRadius: 6,
            borderWidth: 3,
            yAxisID: 'y1'
          }
        ]
      };
    }
  };

  // Create chart data for daily analysis
  // Create typical month daily averages chart data (30 data points)
  const createDailyChartData = (type: 'irradiance' | 'dc-ac' | 'tcell-tamb') => {
    if (!results.irradiation.hourly?.poa || !results.energy.hourly) return null;

    if (type === 'irradiance') {
      // Create 30-day typical month pattern (daily averages across all months)
      const dailyPOA = Array(30).fill(0);
      const dailyDNI = Array(30).fill(0);
      const dailyDiffuse = Array(30).fill(0);
      const counts = Array(30).fill(0);

      const hourlyPOA = results.irradiation.hourly.poa || [];
      const hourlyDNI = results.irradiation.hourly.dn || [];
      const hourlyDiffuse = results.irradiation.hourly.df || [];

      // For each day of the year, map it to a day of month (1-30) and accumulate values
      for (let dayOfYear = 0; dayOfYear < 365; dayOfYear++) {
        const dayOfMonth = (dayOfYear % 30); // Map to 0-29 for 30-day pattern
        let dayPOA = 0, dayDNI = 0, dayDiffuse = 0;
        
        // Sum all hours for this day
        for (let hour = 0; hour < 24; hour++) {
          const index = dayOfYear * 24 + hour;
          if (index < hourlyPOA.length) {
            dayPOA += hourlyPOA[index] || 0;
            dayDNI += hourlyDNI[index] || 0;
            dayDiffuse += hourlyDiffuse[index] || 0;
          }
        }
        
        dailyPOA[dayOfMonth] += dayPOA;
        dailyDNI[dayOfMonth] += dayDNI;
        dailyDiffuse[dayOfMonth] += dayDiffuse;
        counts[dayOfMonth]++;
      }

      // Average the accumulated values
      for (let day = 0; day < 30; day++) {
        if (counts[day] > 0) {
          dailyPOA[day] /= counts[day];
          dailyDNI[day] /= counts[day];
          dailyDiffuse[day] /= counts[day];
        }
      }

      const days = Array.from({length: 30}, (_, i) => `Day ${i + 1}`);
      
      return {
        labels: days,
        datasets: [
          {
            label: '🌞 POA Irradiance',
            data: dailyPOA,
            borderColor: CHART_COLORS.solar.primary,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            backgroundColor: function(context: any) {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              if (!chartArea) return null;
              return createGradient(ctx, CHART_COLORS.solar.rgb, 0.4);
            },
            fill: true,
            tension: 0.4,
            pointBackgroundColor: CHART_COLORS.solar.primary,
            pointBorderColor: '#fff',
            pointRadius: 3,
            borderWidth: 3
          },
          {
            label: '☀️ DNI Irradiance',
            data: dailyDNI,
            borderColor: CHART_COLORS.irradiance.primary,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            backgroundColor: function(context: any) {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              if (!chartArea) return null;
              return createGradient(ctx, CHART_COLORS.irradiance.rgb, 0.4);
            },
            fill: true,
            tension: 0.4,
            pointBackgroundColor: CHART_COLORS.irradiance.primary,
            pointBorderColor: '#fff',
            pointRadius: 3,
            borderWidth: 3
          },
          {
            label: '🌤️ Diffuse Irradiance',
            data: dailyDiffuse,
            borderColor: CHART_COLORS.accent.primary,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            backgroundColor: function(context: any) {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              if (!chartArea) return null;
              return createGradient(ctx, CHART_COLORS.accent.rgb, 0.4);
            },
            fill: true,
            tension: 0.4,
            pointBackgroundColor: CHART_COLORS.accent.primary,
            pointBorderColor: '#fff',
            pointRadius: 3,
            borderWidth: 3
          }
        ]
      };
    } else if (type === 'dc-ac') {
      // Create 30-day typical month pattern for DC vs AC
      const dailyDC = Array(30).fill(0);
      const dailyAC = Array(30).fill(0);
      const counts = Array(30).fill(0);

      const hourlyDC = results.energy.hourlyDC || [];
      const hourlyAC = results.energy.hourly;

      for (let dayOfYear = 0; dayOfYear < 365; dayOfYear++) {
        const dayOfMonth = (dayOfYear % 30);
        let dayDCTotal = 0, dayACTotal = 0;
        
        for (let hour = 0; hour < 24; hour++) {
          const index = dayOfYear * 24 + hour;
          if (index < hourlyAC.length) {
            dayDCTotal += hourlyDC[index] || 0;
            dayACTotal += hourlyAC[index] || 0;
          }
        }
        
        dailyDC[dayOfMonth] += dayDCTotal;
        dailyAC[dayOfMonth] += dayACTotal;
        counts[dayOfMonth]++;
      }

      for (let day = 0; day < 30; day++) {
        if (counts[day] > 0) {
          dailyDC[day] /= counts[day];
          dailyAC[day] /= counts[day];
        }
      }

      const days = Array.from({length: 30}, (_, i) => `Day ${i + 1}`);
      
      return {
        labels: days,
        datasets: [
          {
            label: '🔋 DC Energy',
            data: dailyDC,
            borderColor: CHART_COLORS.production.primary,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            backgroundColor: function(context: any) {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              if (!chartArea) return null;
              return createGradient(ctx, CHART_COLORS.production.rgb, 0.3);
            },
            fill: true,
            tension: 0.4,
            pointBackgroundColor: CHART_COLORS.production.primary,
            pointBorderColor: '#fff',
            pointRadius: 3,
            borderWidth: 3,
            yAxisID: 'y'
          },
          {
            label: '⚡ AC Energy',
            data: dailyAC,
            borderColor: CHART_COLORS.energy.primary,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            backgroundColor: function(context: any) {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              if (!chartArea) return null;
              return createGradient(ctx, CHART_COLORS.energy.rgb, 0.3);
            },
            fill: true,
            tension: 0.4,
            pointBackgroundColor: CHART_COLORS.energy.primary,
            pointBorderColor: '#fff',
            pointRadius: 3,
            borderWidth: 3,
            yAxisID: 'y1'
          }
        ]
      };
    } else if (type === 'tcell-tamb') {
      // Create 30-day typical month pattern for temperature
      const dailyTcell = Array(30).fill(0);
      const dailyTamb = Array(30).fill(0);
      const counts = Array(30).fill(0);

      const hourlyTcell = results.irradiation.hourly.tcell || [];
      const hourlyTamb = results.irradiation.hourly.tamb || [];

      for (let dayOfYear = 0; dayOfYear < 365; dayOfYear++) {
        const dayOfMonth = (dayOfYear % 30);
        let dayTcellTotal = 0, dayTambTotal = 0, hourCount = 0;
        
        for (let hour = 0; hour < 24; hour++) {
          const index = dayOfYear * 24 + hour;
          if (index < hourlyTcell.length) {
            dayTcellTotal += hourlyTcell[index] || 0;
            dayTambTotal += hourlyTamb[index] || 0;
            hourCount++;
          }
        }
        
        if (hourCount > 0) {
          dailyTcell[dayOfMonth] += dayTcellTotal / hourCount; // Average for temperatures
          dailyTamb[dayOfMonth] += dayTambTotal / hourCount;
          counts[dayOfMonth]++;
        }
      }

      for (let day = 0; day < 30; day++) {
        if (counts[day] > 0) {
          dailyTcell[day] /= counts[day];
          dailyTamb[day] /= counts[day];
        }
      }

      const days = Array.from({length: 30}, (_, i) => `Day ${i + 1}`);
      
      return {
        labels: days,
        datasets: [
          {
            label: '🌡️ Cell Temperature',
            data: dailyTcell,
            borderColor: CHART_COLORS.accent.primary,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            backgroundColor: function(context: any) {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              if (!chartArea) return null;
              return createGradient(ctx, CHART_COLORS.accent.rgb, 0.3);
            },
            fill: true,
            tension: 0.4,
            pointBackgroundColor: CHART_COLORS.accent.primary,
            pointBorderColor: '#fff',
            pointRadius: 3,
            borderWidth: 3,
            yAxisID: 'y'
          },
          {
            label: '🌡️ Ambient Temperature',
            data: dailyTamb,
            borderColor: CHART_COLORS.irradiance.primary,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            backgroundColor: function(context: any) {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              if (!chartArea) return null;
              return createGradient(ctx, CHART_COLORS.irradiance.rgb, 0.3);
            },
            fill: true,
            tension: 0.4,
            pointBackgroundColor: CHART_COLORS.irradiance.primary,
            pointBorderColor: '#fff',
            pointRadius: 3,
            borderWidth: 3,
            yAxisID: 'y1'
          }
        ]
      };
    }
    
    return null;
  };

  // Create 365 days chart data
  const createAllDaysChartData = (type: 'dc-ac') => {
    if (!dailyAnalysisData) return null;

    const days = Array.from({length: 365}, (_, i) => `Day ${i + 1}`);
    
    if (type === 'dc-ac') {
      return {
        labels: days,
        datasets: [
          {
            label: '🔋 Daily DC Energy',
            data: dailyAnalysisData.dailyDC,
            borderColor: CHART_COLORS.production.primary,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            backgroundColor: function(context: any) {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              if (!chartArea) return null;
              return createGradient(ctx, CHART_COLORS.production.rgb, 0.2);
            },
            fill: true,
            tension: 0.1,
            pointRadius: 0,
            borderWidth: 2,
            yAxisID: 'y'
          },
          {
            label: '⚡ Daily AC Energy',
            data: dailyAnalysisData.dailyAC,
            borderColor: CHART_COLORS.energy.primary,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            backgroundColor: function(context: any) {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              if (!chartArea) return null;
              return createGradient(ctx, CHART_COLORS.energy.rgb, 0.2);
            },
            fill: true,
            tension: 0.1,
            pointRadius: 0,
            borderWidth: 2,
            yAxisID: 'y1'
          }
        ]
      };
    }

    return null;
  };

  // Create monthly charts
  const createMonthlyIrradianceData = () => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Use monthly data from PVWatts API results
    const monthlyPOA = results.irradiation.monthly.map(item => item["Monthly Solar Irradiation (kWh/m²)"]);
    
    // For DNI and Diffuse, we need to calculate from hourly data if available
    const monthlyDNI = Array(12).fill(0);
    const monthlyDiffuse = Array(12).fill(0);
    
    if (results.irradiation.hourly?.dn && results.irradiation.hourly?.df) {
      const hourlyDNI = results.irradiation.hourly.dn;
      const hourlyDiffuse = results.irradiation.hourly.df;
      
      for (let month = 0; month < 12; month++) {
        let monthDNI = 0, monthDiffuse = 0, hourCount = 0;
        
        // Calculate days in month and day ranges
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let startDay = 0;
        for (let m = 0; m < month; m++) {
          startDay += daysInMonth[m];
        }
        
        for (let day = 0; day < daysInMonth[month]; day++) {
          for (let hour = 0; hour < 24; hour++) {
            const index = (startDay + day) * 24 + hour;
            if (index < hourlyDNI.length) {
              monthDNI += hourlyDNI[index] / 1000; // Convert W/m² to kWh/m²
              monthDiffuse += hourlyDiffuse[index] / 1000;
              hourCount++;
            }
          }
        }
        
        monthlyDNI[month] = monthDNI;
        monthlyDiffuse[month] = monthDiffuse;
      }
    }

    return {
      labels: monthNames,
      datasets: [
        {
          label: '🌞 POA Irradiation',
          data: monthlyPOA,
          borderColor: CHART_COLORS.solar.primary,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          backgroundColor: function(context: any) {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return null;
            return createGradient(ctx, CHART_COLORS.solar.rgb, 0.4);
          },
          fill: true,
          tension: 0.4,
          pointBackgroundColor: CHART_COLORS.solar.primary,
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 7,
          borderWidth: 3
        },
        {
          label: '☀️ DNI Irradiation',
          data: monthlyDNI,
          borderColor: CHART_COLORS.irradiance.primary,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          backgroundColor: function(context: any) {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return null;
            return createGradient(ctx, CHART_COLORS.irradiance.rgb, 0.4);
          },
          fill: true,
          tension: 0.4,
          pointBackgroundColor: CHART_COLORS.irradiance.primary,
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 7,
          borderWidth: 3
        },
        {
          label: '🌤️ Diffuse Irradiation',
          data: monthlyDiffuse,
          borderColor: CHART_COLORS.accent.primary,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          backgroundColor: function(context: any) {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return null;
            return createGradient(ctx, CHART_COLORS.accent.rgb, 0.4);
          },
          fill: true,
          tension: 0.4,
          pointBackgroundColor: CHART_COLORS.accent.primary,
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 7,
          borderWidth: 3
        }
      ]
    };
  };

  const createMonthlyEnergyData = () => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const monthlyAC = results.energy.monthly.map(item => item["Monthly Energy Production (kWh)"]);
    
    // Calculate monthly DC from hourly data if available
    const monthlyDC = Array(12).fill(0);
    
    if (results.energy.hourlyDC) {
      const hourlyDC = results.energy.hourlyDC;
      
      for (let month = 0; month < 12; month++) {
        let monthDCTotal = 0;
        
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let startDay = 0;
        for (let m = 0; m < month; m++) {
          startDay += daysInMonth[m];
        }
        
        for (let day = 0; day < daysInMonth[month]; day++) {
          for (let hour = 0; hour < 24; hour++) {
            const index = (startDay + day) * 24 + hour;
            if (index < hourlyDC.length) {
              monthDCTotal += hourlyDC[index];
            }
          }
        }
        
        monthlyDC[month] = monthDCTotal;
      }
    }

    return {
      labels: monthNames,
      datasets: [
        {
          label: '🔋 DC Energy Production',
          data: monthlyDC,
          borderColor: CHART_COLORS.production.primary,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          backgroundColor: function(context: any) {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return null;
            return createGradient(ctx, CHART_COLORS.production.rgb, 0.3);
          },
          fill: true,
          tension: 0.4,
          pointBackgroundColor: CHART_COLORS.production.primary,
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 7,
          borderWidth: 3,
          yAxisID: 'y'
        },
        {
          label: '⚡ AC Energy Production',
          data: monthlyAC,
          borderColor: CHART_COLORS.energy.primary,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          backgroundColor: function(context: any) {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return null;
            return createGradient(ctx, CHART_COLORS.energy.rgb, 0.3);
          },
          fill: true,
          tension: 0.4,
          pointBackgroundColor: CHART_COLORS.energy.primary,
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 7,
          borderWidth: 3,
          yAxisID: 'y1'
        }
      ]
    };
  };

  // Heatmap data processing functions
  const createHeatmapData = (type: 'tcell' | 'ac-power') => {
    if (!hourlyAnalysisData) return null;

    const hourlyData = type === 'tcell' 
      ? results.irradiation.hourly.tcell || []
      : results.energy.hourly || [];

    if (hourlyData.length !== 8760) return null;

    // Create 365 days × 24 hours matrix
    const heatmapData: Array<{ day: number; hour: number; value: number }> = [];
    
    for (let day = 0; day < 365; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const dataIndex = day * 24 + hour;
        const value = hourlyData[dataIndex] || 0;
        
        heatmapData.push({
          day: day + 1,
          hour,
          value
        });
      }
    }

    return heatmapData;
  };

  // Color scale function for heatmaps
  const getHeatmapColor = (value: number, minValue: number, maxValue: number, type: 'tcell' | 'ac-power'): string => {
    if (maxValue === minValue) return type === 'tcell' ? '#E5E7EB' : '#F3F4F6';
    
    const normalized = (value - minValue) / (maxValue - minValue);
    
    if (type === 'tcell') {
      // Temperature: Pure Blue (cold) to Pure Red (hot) with high contrast
      const red = Math.floor(255 * normalized);
      const blue = Math.floor(255 * (1 - normalized));
      const green = Math.floor(50 * Math.sin(normalized * Math.PI)); // Minimal green for better transition
      return `rgb(${red}, ${green}, ${blue})`;
    } else {
      // AC Power: Dark Forest Green to Bright Yellow-Green with high contrast
      const intensity = normalized;
      const red = Math.floor(intensity * 180); // 0 to 180 for yellow component
      const green = Math.floor(100 + intensity * 155); // 100 to 255 for strong green
      const blue = Math.floor(20 * (1 - intensity)); // 20 to 0 for minimal blue
      return `rgb(${red}, ${green}, ${blue})`;
    }
  };

  // Custom Heatmap Component
  const HeatmapVisualization: React.FC<{ 
    data: Array<{ day: number; hour: number; value: number }>;
    type: 'tcell' | 'ac-power';
    title: string;
    unit: string;
  }> = ({ data, type, title, unit }) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No data available for heatmap visualization
        </div>
      );
    }

    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Group data by day for easier rendering
    const dayGroups: { [key: number]: Array<{ hour: number; value: number }> } = {};
    data.forEach(item => {
      if (!dayGroups[item.day]) dayGroups[item.day] = [];
      dayGroups[item.day].push({ hour: item.hour, value: item.value });
    });

    // Month labels (simplified to show every 30 days)
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return (
      <div className="space-y-2">
                 {/* Title and Legend */}
        <div className="flex justify-between items-center mb-2">
          <div>
            <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
            <p className="text-xs text-gray-600 mt-0.5">
              {type === 'tcell' ? 'Blue (cold) → Red (hot)' : 'Dark green (low) → Yellow-green (high)'}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-700">
            <div className="text-right">
              <div className="font-medium text-xs">{minValue.toFixed(1)}{unit}</div>
              <div className="font-medium text-xs">{maxValue.toFixed(1)}{unit}</div>
            </div>
            <div className="w-16 h-12 rounded border border-gray-300 flex flex-col overflow-hidden shadow-sm">
              {Array.from({ length: 20 }, (_, i) => (
                <div 
                  key={i}
                  className="flex-1"
                  style={{ 
                    backgroundColor: getHeatmapColor(
                      minValue + (maxValue - minValue) * (19 - i) / 19, 
                      minValue, 
                      maxValue, 
                      type
                    )
                  }}
                />
              ))}
            </div>
            <div className="text-xs text-gray-600">
              <div className="mb-6">High</div>
              <div>Low</div>
            </div>
          </div>
        </div>

                 {/* Heatmap Grid */}
        <div className="relative bg-white rounded-lg border border-gray-200 p-1">
          {/* Main heatmap container */}
          <div className="flex">
            {/* Hour labels (Y-axis) */}
            <div className="w-6 flex flex-col justify-between text-xs text-gray-600 mr-1">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="text-center font-medium" style={{ height: '18px', lineHeight: '18px', fontSize: '9px' }}>
                  {i % 3 === 0 ? i : ''}
                </div>
              ))}
            </div>

            {/* Heatmap cells container */}
            <div className="flex-1">
              {/* Month labels (X-axis) */}
              <div className="flex text-xs text-gray-600 mb-0.5">
                {Array.from({ length: 12 }, (_, monthIndex) => (
                  <div key={monthIndex} className="flex-1 text-center font-medium" style={{ fontSize: '8px' }}>
                    {monthLabels[monthIndex]}
                  </div>
                ))}
              </div>

              {/* Heatmap grid - Hours (rows) x Days (columns) */}
              <div className="">
                {Array.from({ length: 24 }, (_, hourIndex) => (
                  <div key={hourIndex} className="flex">
                    {Array.from({ length: 365 }, (_, dayIndex) => {
                      const day = dayIndex + 1;
                      const dayData = dayGroups[day] || [];
                      const hourData = dayData.find(d => d.hour === hourIndex);
                      const value = hourData?.value || 0;
                      const color = getHeatmapColor(value, minValue, maxValue, type);
                      
                      return (
                        <div
                          key={dayIndex}
                          className="hover:scale-110 hover:z-10 transition-transform duration-100 cursor-pointer"
                          style={{ 
                            backgroundColor: color,
                            width: '3px',
                            height: '18px',
                            border: '0.5px solid rgba(255,255,255,0.1)'
                          }}
                          title={`Day ${day}, Hour ${hourIndex}:00\n${value.toFixed(2)}${unit}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Axis labels */}
          <div className="text-center text-xs text-gray-600 mt-1 font-medium">Days of Year (Jan - Dec)</div>
          
          {/* Y-axis label */}
          <div 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-gray-600 font-medium"
            style={{ transformOrigin: 'center' }}
          >
            Hours (0-23)
          </div>
        </div>
      </div>
    );
  };

  const createMonthlyPRData = () => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const monthlyAC = results.energy.monthly.map(item => item["Monthly Energy Production (kWh)"]);
    const monthlyPOA = results.irradiation.monthly.map(item => item["Monthly Solar Irradiation (kWh/m²)"]);
    const dcCapacity = systemParams.capacity; // Total DC capacity in kWp

    const monthlyPR = monthlyAC.map((energy, index) => {
      const poa = monthlyPOA[index];
      if (poa > 0 && dcCapacity > 0) {
        return (energy / (poa * dcCapacity)) * 100;
      }
      return 0;
    });

    return {
      labels: monthNames,
      datasets: [
        {
          label: '📊 Performance Ratio (%)',
          data: monthlyPR,
          backgroundColor: CHART_COLORS.accent.primary,
          borderColor: CHART_COLORS.accent.secondary,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
          hoverBackgroundColor: CHART_COLORS.accent.secondary,
          hoverBorderColor: '#fff',
          hoverBorderWidth: 3
        }
      ]
    };
  };
  
  // Calculate annual energy summary
  const totalEnergyProduction = results.energy.metrics?.total_yearly || 0;
  const specificYield = systemParams.capacity > 0 ? totalEnergyProduction / systemParams.capacity : 0;
  const totalAnnualIrradiation = results.irradiation.metrics?.total_yearly || 0;
  const annualPR = (totalAnnualIrradiation > 0 && systemParams.capacity > 0) 
    ? (totalEnergyProduction / (totalAnnualIrradiation * systemParams.capacity)) * 100 
    : 0;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Solar Energy Production Results</h2>
        <div className="flex gap-3">
          <Button 
            onClick={exportHourlyDataToExcel} 
            variant="outline"
            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Download Hourly Data
          </Button>
          <AdvancedPDFReport
            results={results}
            systemParams={systemParams}
            selectedPanel={selectedPanel}
            selectedInverter={selectedInverter}
            polygonConfigs={polygonConfigs}
            acConfiguration={acConfiguration}
            detailedLosses={detailedLosses}
            mapImage={mapImage}
            sldImage={sldImage}
          />
        <Button onClick={onNewCalculation} variant="outline">
          New Calculation
        </Button>
        </div>
      </div>
      
      {/* Enhanced Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Annual Energy Production Card */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full shadow-lg">
                <span className="text-xl">⚡</span>
            </div>
              <div className="text-right">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Annual Energy Production</p>
              <p className="text-2xl font-bold text-emerald-900">{totalEnergyProduction.toFixed(0)}</p>
              <p className="text-xs font-medium text-emerald-600">kWh</p>
            </div>
            <div className="mt-3 h-1 bg-gradient-to-r from-emerald-200 to-green-300 rounded-full"></div>
          </CardContent>
        </Card>
        
        {/* Specific Yield Card */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full shadow-lg">
                <span className="text-xl">📊</span>
            </div>
              <div className="text-right">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Specific Yield</p>
              <p className="text-2xl font-bold text-blue-900">{specificYield.toFixed(0)}</p>
              <p className="text-xs font-medium text-blue-600">kWh/kWp</p>
            </div>
            <div className="mt-3 h-1 bg-gradient-to-r from-blue-200 to-cyan-300 rounded-full"></div>
          </CardContent>
        </Card>
        
        {/* Daily Average Card */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full shadow-lg">
                <span className="text-xl">☀️</span>
            </div>
              <div className="text-right">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Daily Average</p>
              <p className="text-2xl font-bold text-orange-900">{(totalEnergyProduction / 365).toFixed(1)}</p>
              <p className="text-xs font-medium text-orange-600">kWh</p>
            </div>
            <div className="mt-3 h-1 bg-gradient-to-r from-orange-200 to-amber-300 rounded-full"></div>
          </CardContent>
        </Card>
        
        {/* Annual Performance Ratio Card */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full shadow-lg">
                <span className="text-xl">🎯</span>
              </div>
              <div className="text-right">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Annual Performance Ratio</p>
              <p className="text-2xl font-bold text-purple-900">{annualPR.toFixed(1)}</p>
              <p className="text-xs font-medium text-purple-600">%</p>
            </div>
            <div className="mt-3 h-1 bg-gradient-to-r from-purple-200 to-violet-300 rounded-full"></div>
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
      
      {/* PV Installation Map */}
      {mapImage && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">PV Installation Layout</h3>
            <div className="relative">
              <img 
                src={mapImage} 
                alt="Solar PV Installation Map" 
                className="w-full h-auto rounded-lg border shadow-sm"
                style={{ maxHeight: '500px', objectFit: 'contain' }}
              />
              <div className="mt-2 text-sm text-muted-foreground text-center">
                Solar panel layout with module placement and installation areas
              </div>
            </div>
            
            {/* Installation Summary */}
            <div className="mt-4 p-4 bg-muted/20 rounded-lg border">
              <h4 className="text-md font-semibold mb-3">Installation Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Capacity</p>
                  <p className="text-lg font-bold text-primary">{systemParams.capacity.toFixed(1)} kWp</p>
                </div>
                {polygonConfigs && polygonConfigs.length > 0 && (
                  <>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Module Count</p>
                      <p className="text-lg font-bold text-primary">
                        {polygonConfigs.reduce((sum, config) => sum + (config.moduleCount || 0), 0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Area</p>
                      <p className="text-lg font-bold text-primary">
                        {polygonConfigs.reduce((sum, config) => sum + (config.area || 0), 0).toFixed(1)} m²
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Structure Types</p>
                      <p className="text-lg font-bold text-primary">
                        {[...new Set(polygonConfigs.map(config => {
                          if (config.structureType === 'ballasted') return 'Ballasted Roof';
                          if (config.structureType === 'fixed_tilt') return 'Fixed Tilt';
                          if (config.structureType === 'ground_mount_tables') return 'Ground Mount';
                          if (config.structureType === 'carport') return 'Carport';
                          return config.structureType;
                        }))].join(', ')}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* System Configuration and Location Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Configuration Card */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">⚙️</span>
              </div>
                <h3 className="text-xl font-bold text-purple-900">System Configuration</h3>
              </div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-purple-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm">⚡</span>
              </div>
                <div>
                  <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">System Capacity</div>
                  <div className="text-lg font-bold text-purple-900">{systemParams.capacity.toFixed(2)} kWp</div>
              </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-purple-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <span className="text-white text-sm">📱</span>
                </div>
                <div>
                  <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">Module Type</div>
                  <div className="text-sm font-bold text-purple-900">{selectedPanel?.manufacturer || 'N/A'}</div>
                  <div className="text-xs text-purple-600">{selectedPanel?.model || 'Not selected'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-purple-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <span className="text-white text-sm">🏗️</span>
                </div>
                <div>
                  <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">Mounting</div>
                  <div className="text-lg font-bold text-purple-900">{ARRAY_TYPE_NAMES[systemParams.arrayType]}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-purple-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm">🔌</span>
                </div>
                <div>
                  <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">Selected Inverter</div>
                  <div className="text-sm font-bold text-purple-900">{selectedInverter?.manufacturer || 'N/A'}</div>
                  <div className="text-xs text-purple-600">{selectedInverter?.model || 'Not selected'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-purple-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <span className="text-white text-sm">⚡</span>
                </div>
                <div>
                  <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">System PoC Voltage</div>
                  <div className="text-lg font-bold text-purple-900">400V AC</div>
                  <div className="text-xs text-purple-600">3-phase connection</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-purple-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center">
                  <span className="text-white text-sm">⚠️</span>
                </div>
                <div>
                  <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">System Losses</div>
                  <div className="text-lg font-bold text-purple-900">{systemParams.losses.toFixed(1)}% total losses</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Location Information Card */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">🌍</span>
              </div>
                <h3 className="text-xl font-bold text-teal-900">Location Information</h3>
              </div>
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
              </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-teal-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center">
                  <span className="text-white text-sm">📍</span>
                </div>
                <div>
                  <div className="text-xs font-medium text-teal-700 uppercase tracking-wide">Coordinates</div>
                  <div className="text-lg font-bold text-teal-900">
                    {Math.abs(systemParams.latitude).toFixed(4)}° {systemParams.latitude >= 0 ? 'N' : 'S'}, {Math.abs(systemParams.longitude).toFixed(4)}° {systemParams.longitude >= 0 ? 'E' : 'W'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-teal-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm">🕒</span>
                </div>
                <div>
                  <div className="text-xs font-medium text-teal-700 uppercase tracking-wide">Timezone</div>
                  <div className="text-sm font-bold text-teal-900">{systemParams.timezone}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-teal-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                  <span className="text-white text-sm">📐</span>
                </div>
                <div>
                  <div className="text-xs font-medium text-teal-700 uppercase tracking-wide">Tilt Angle</div>
                  <div className="text-lg font-bold text-teal-900">{systemParams.tilt}° from horizontal</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-teal-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-sm">🧭</span>
                </div>
                <div>
                  <div className="text-xs font-medium text-teal-700 uppercase tracking-wide">Azimuth</div>
                  <div className="text-lg font-bold text-teal-900">{systemParams.azimuth}° orientation</div>
                </div>
              </div>

              {results.irradiation && results.irradiation.metrics && (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-teal-100">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                      <span className="text-white text-sm">☀️</span>
                  </div>
                    <div>
                      <div className="text-xs font-medium text-teal-700 uppercase tracking-wide">Yearly Irradiation</div>
                      <div className="text-lg font-bold text-teal-900">{results.irradiation.metrics.total_yearly.toFixed(0)} kWh/m²/year</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-teal-100">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                      <span className="text-white text-sm">🌅</span>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-teal-700 uppercase tracking-wide">Daily Average Irradiation</div>
                      <div className="text-lg font-bold text-teal-900">{(results.irradiation.metrics.total_yearly / 365).toFixed(1)} kWh/m²/day</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Monthly Values Table */}
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-700 flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">📊</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Monthly Performance Values</h3>
                <p className="text-gray-600 text-sm mt-1">Comprehensive monthly breakdown of all key parameters</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">DC Energy</span>
              <div className="w-3 h-3 rounded-full bg-green-500 ml-3"></div>
              <span className="text-gray-600">AC Energy</span>
              <div className="w-3 h-3 rounded-full bg-purple-500 ml-3"></div>
              <span className="text-gray-600">Performance Ratio</span>
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm bg-white">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white">
                  <th className="text-left py-2 px-2 font-bold text-sm">Month</th>
                  <th className="text-center py-2 px-1.5 font-bold text-sm">POA<br/><span className="text-xs font-normal opacity-90">(kWh/m²)</span></th>
                  <th className="text-center py-2 px-1.5 font-bold text-sm">DNI<br/><span className="text-xs font-normal opacity-90">(kWh/m²)</span></th>
                  <th className="text-center py-2 px-1.5 font-bold text-sm">Diffuse<br/><span className="text-xs font-normal opacity-90">(kWh/m²)</span></th>
                  <th className="text-center py-2 px-1.5 font-bold text-sm">Amb Temp<br/><span className="text-xs font-normal opacity-90">(°C)</span></th>
                  <th className="text-center py-2 px-1.5 font-bold text-sm">Wind Vel<br/><span className="text-xs font-normal opacity-90">(m/s)</span></th>
                  <th className="text-center py-2 px-1.5 font-bold text-sm">DC Energy<br/><span className="text-xs font-normal opacity-90">(kWh)</span></th>
                  <th className="text-center py-2 px-1.5 font-bold text-sm">AC Energy<br/><span className="text-xs font-normal opacity-90">(kWh)</span></th>
                  <th className="text-center py-2 px-1.5 font-bold text-sm">PR<br/><span className="text-xs font-normal opacity-90">(%)</span></th>
                </tr>
              </thead>
              <tbody>
                {results.irradiation?.monthly && results.energy?.monthly && (() => {
                  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                  const dcCapacity = systemParams.capacity;
                  
                  // Calculate monthly values from hourly data
                  const monthlyCalculatedValues = monthNames.map((month, index) => {
                    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                    let startDay = 0;
                    for (let m = 0; m < index; m++) {
                      startDay += daysInMonth[m];
                    }
                    
                    let monthDNI = 0, monthDiffuse = 0, monthTamb = 0, monthWind = 0, monthDC = 0;
                    let tempCount = 0, windCount = 0;
                    
                    // Calculate from hourly data if available
                    if (results.irradiation.hourly?.dn && results.irradiation.hourly?.df && 
                        results.irradiation.hourly?.tamb && results.irradiation.hourly?.wspd && 
                        results.energy.hourlyDC) {
                      
                      const hourlyDNI = results.irradiation.hourly.dn;
                      const hourlyDiffuse = results.irradiation.hourly.df;
                      const hourlyTamb = results.irradiation.hourly.tamb;
                      const hourlyWind = results.irradiation.hourly.wspd;
                      const hourlyDC = results.energy.hourlyDC;
                      
                      for (let day = 0; day < daysInMonth[index]; day++) {
                        for (let hour = 0; hour < 24; hour++) {
                          const hourIndex = (startDay + day) * 24 + hour;
                          if (hourIndex < hourlyDNI.length) {
                            monthDNI += (hourlyDNI[hourIndex] || 0) / 1000; // Convert W/m² to kWh/m²
                            monthDiffuse += (hourlyDiffuse[hourIndex] || 0) / 1000;
                            monthDC += (hourlyDC[hourIndex] || 0) / 1000; // Convert Wh to kWh
                            
                            // For temperature and wind, count all hours for average
                            monthTamb += hourlyTamb[hourIndex] || 0;
                            monthWind += hourlyWind[hourIndex] || 0;
                            tempCount++;
                            windCount++;
                          }
                        }
                      }
                    }
                    
                    return {
                      dni: monthDNI,
                      diffuse: monthDiffuse,
                      ambTemp: tempCount > 0 ? monthTamb / tempCount : 0,
                      windVel: windCount > 0 ? monthWind / windCount : 0,
                      dcEnergy: monthDC
                    };
                  });
                  
                  return monthNames.map((month, index) => {
                    const irradiationData = results.irradiation.monthly[index];
                    const energyData = results.energy.monthly[index];
                    const calculatedData = monthlyCalculatedValues[index];
                    
                    // Use API data for POA and AC, calculated data for others
                    const poa = irradiationData?.["Monthly Solar Irradiation (kWh/m²)"] || 0;
                    const dni = calculatedData.dni;
                    const diffuse = calculatedData.diffuse;
                    const ambTemp = calculatedData.ambTemp;
                    const windVel = calculatedData.windVel;
                    const dcEnergy = calculatedData.dcEnergy;
                    const acEnergy = energyData?.["Monthly Energy Production (kWh)"] || 0;
                    
                    // Calculate Performance Ratio
                    const pr = (poa > 0 && dcCapacity > 0) ? (acEnergy / (poa * dcCapacity)) * 100 : 0;
                    
                    return (
                      <tr key={index} className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                        <td className="py-2 px-2 font-bold text-gray-800 bg-gradient-to-r from-gray-50 to-transparent text-sm">{month}</td>
                        <td className="py-2 px-1.5 text-center text-gray-700 font-medium text-sm">{poa.toFixed(1)}</td>
                        <td className="py-2 px-1.5 text-center text-orange-600 font-medium text-sm">{dni.toFixed(1)}</td>
                        <td className="py-2 px-1.5 text-center text-amber-600 font-medium text-sm">{diffuse.toFixed(1)}</td>
                        <td className="py-2 px-1.5 text-center text-red-600 font-medium text-sm">{ambTemp.toFixed(1)}</td>
                        <td className="py-2 px-1.5 text-center text-cyan-600 font-medium text-sm">{windVel.toFixed(1)}</td>
                        <td className="py-2 px-1.5 text-center font-bold text-blue-700 bg-blue-50/50 text-sm">{dcEnergy.toFixed(0)}</td>
                        <td className="py-2 px-1.5 text-center font-bold text-green-700 bg-green-50/50 text-sm">{acEnergy.toFixed(0)}</td>
                        <td className="py-2 px-1.5 text-center font-bold text-purple-700 bg-purple-50/50 text-sm">{pr.toFixed(1)}</td>
                      </tr>
                    );
                  });
                })()}
                
                {/* Totals/Averages Row */}
                {results.irradiation?.metrics && results.energy?.metrics && (() => {
                  const totalPOA = results.irradiation.metrics.total_yearly || 0;
                  // Calculate total DC energy from hourly data and convert from Wh to kWh
                  const totalDCEnergy = (results.energy.hourlyDC?.reduce((sum, hourlyValue) => sum + (hourlyValue || 0), 0) || 0) / 1000;
                  const totalACEnergy = results.energy.metrics.total_yearly || 0;
                  const dcCapacity = systemParams.capacity;
                  const annualPR = (totalPOA > 0 && dcCapacity > 0) ? (totalACEnergy / (totalPOA * dcCapacity)) * 100 : 0;
                  
                  // Calculate annual DNI and Diffuse totals
                  const totalDNI = results.irradiation.hourly?.dn?.reduce((sum, hourlyValue) => sum + ((hourlyValue || 0) / 1000), 0) || 0;
                  const totalDiffuse = results.irradiation.hourly?.df?.reduce((sum, hourlyValue) => sum + ((hourlyValue || 0) / 1000), 0) || 0;
                  
                  // Calculate average temperature and wind speed
                  const avgTemp = results.irradiation.hourly?.tamb ? 
                    results.irradiation.hourly.tamb.reduce((sum, val) => sum + (val || 0), 0) / results.irradiation.hourly.tamb.length : 0;
                  const avgWind = results.irradiation.hourly?.wspd ? 
                    results.irradiation.hourly.wspd.reduce((sum, val) => sum + (val || 0), 0) / results.irradiation.hourly.wspd.length : 0;
                  
                  return (
                    <tr className="border-t-4 border-indigo-500 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white font-bold text-sm">
                      <td className="py-3 px-2 text-white">Annual</td>
                      <td className="py-3 px-1.5 text-center">{totalPOA.toFixed(0)}</td>
                      <td className="py-3 px-1.5 text-center">{totalDNI.toFixed(0)}</td>
                      <td className="py-3 px-1.5 text-center">{totalDiffuse.toFixed(0)}</td>
                      <td className="py-3 px-1.5 text-center">{avgTemp.toFixed(1)}</td>
                      <td className="py-3 px-1.5 text-center">{avgWind.toFixed(1)}</td>
                      <td className="py-3 px-1.5 text-center">{totalDCEnergy.toFixed(0)}</td>
                      <td className="py-3 px-1.5 text-center">{totalACEnergy.toFixed(0)}</td>
                      <td className="py-3 px-1.5 text-center">{annualPR.toFixed(1)}</td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Parameter Definitions</h4>
              <div className="text-xs text-blue-800 space-y-1">
                <div><strong>POA:</strong> Plane of Array irradiation</div>
                <div><strong>DNI:</strong> Direct Normal Irradiation</div>
                <div><strong>Diffuse:</strong> Diffuse horizontal irradiation</div>
                <div><strong>PR:</strong> Performance Ratio (AC Energy / POA × DC Capacity)</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">Data Sources</h4>
              <div className="text-xs text-green-800 space-y-1">
                <div><strong>Temperature & Wind:</strong> Averaged from hourly values</div>
                <div><strong>DNI & Diffuse:</strong> Aggregated from hourly W/m² data</div>
                <div><strong>Energy Values:</strong> NREL lab's latest PV simulation Model used</div>
                <div><strong>All values:</strong> Based on TMY3 weather data</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Replace Monthly Energy Breakdown with Comprehensive Analysis */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Comprehensive Energy Analysis</h3>
        
        <Tabs value={activeAnalysisTab} onValueChange={setActiveAnalysisTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-slate-100 via-gray-100 to-slate-100 p-1 rounded-xl border border-gray-200 shadow-sm">
            <TabsTrigger 
              value="hourly" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-0 text-gray-600 hover:text-gray-800 hover:bg-white/50 transition-all duration-300 rounded-lg font-medium text-sm px-3 py-2.5"
            >
              📊 Hourly Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="daily" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-0 text-gray-600 hover:text-gray-800 hover:bg-white/50 transition-all duration-300 rounded-lg font-medium text-sm px-3 py-2.5"
            >
              📅 Daily Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="monthly" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-0 text-gray-600 hover:text-gray-800 hover:bg-white/50 transition-all duration-300 rounded-lg font-medium text-sm px-3 py-2.5"
            >
              📆 Monthly Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="yearly" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-0 text-gray-600 hover:text-gray-800 hover:bg-white/50 transition-all duration-300 rounded-lg font-medium text-sm px-3 py-2.5"
            >
              📈 Yearly Projection
            </TabsTrigger>
            <TabsTrigger 
              value="uncertainty" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-0 text-gray-600 hover:text-gray-800 hover:bg-white/50 transition-all duration-300 rounded-lg font-medium text-sm px-3 py-2.5"
            >
              🎯 Uncertainty Analysis
            </TabsTrigger>
          </TabsList>

          {/* Hourly Analysis Tab */}
          <TabsContent value="hourly" className="space-y-6">
            {hourlyAnalysisData ? (
              <>
                {/* Hourly Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-2 border-gradient-to-r from-orange-200 to-yellow-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
                      <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        ☀️ Hourly Irradiance Analysis
                        <span className="text-sm font-normal text-gray-600">POA, DNI & Diffuse</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div style={{ height: '350px' }}>
                        <Line 
                          data={createHourlyChartData('irradiance')!} 
                          options={{
                            ...getChartOptions('line'),
                            plugins: {
                              ...getChartOptions('line').plugins,
                              title: {
                                display: true,
                                text: 'Hourly Average of POA, DNI and Diffuse Radiance',
                                font: { size: 14, weight: 'bold' },
                                color: '#374151'
                              }
                            },
                            scales: {
                              ...getChartOptions('line').scales,
                              y: {
                                ...getChartOptions('line').scales?.y,
                                title: { display: true, text: 'Irradiance (W/m²)', font: { size: 12, weight: 'bold' }, color: '#374151' }
                              }
                            }
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-gradient-to-r from-blue-200 to-cyan-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                      <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        ⚡ Hourly Power Production
                        <span className="text-sm font-normal text-gray-600">DC vs AC Power</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div style={{ height: '350px' }}>
                        <Line 
                          data={createHourlyChartData('dc-ac')!} 
                          options={{
                            ...getChartOptions('line'),
                            plugins: {
                              ...getChartOptions('line').plugins,
                              title: {
                                display: true,
                                text: 'Hourly Average of DC vs AC Power',
                                font: { size: 14, weight: 'bold' },
                                color: '#374151'
                              }
                            },
                            scales: {
                              ...getChartOptions('line').scales,
                              y: {
                                ...getChartOptions('line').scales?.y,
                                title: { display: true, text: 'DC Power (kWh)', font: { size: 12, weight: 'bold' }, color: '#374151' }
                              },
                              y1: {
                                ...getChartOptions('line').scales?.y1,
                                title: { display: true, text: 'AC Power (kWh)', font: { size: 12, weight: 'bold' }, color: '#374151' }
                              }
                            }
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Heatmaps */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-2 border-gradient-to-r from-purple-200 to-pink-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                      <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        🌡️ Hourly Tcell Heatmap
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-2">
                        Cell temperature patterns across all 365 days and 24 hours
                      </p>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div style={{ height: '520px', overflowY: 'auto' }}>
                        {(() => {
                          const tcellHeatmapData = createHeatmapData('tcell');
                          return tcellHeatmapData ? (
                            <HeatmapVisualization 
                              data={tcellHeatmapData}
                              type="tcell"
                                                             title="Cell Temperature Patterns (24 hours × 365 days)"
                              unit="°C"
                            />
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              Cell temperature data not available
                            </div>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-gradient-to-r from-green-200 to-teal-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50">
                      <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        ⚡ Hourly AC Power Heatmap
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-2">
                        AC power output distribution throughout the year
                      </p>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div style={{ height: '520px', overflowY: 'auto' }}>
                        {(() => {
                          const acPowerHeatmapData = createHeatmapData('ac-power');
                          return acPowerHeatmapData ? (
                            <HeatmapVisualization 
                              data={acPowerHeatmapData}
                              type="ac-power"
                                                             title="AC Power Output Patterns (24 hours × 365 days)"
                              unit="kW"
                            />
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              AC power data not available
                            </div>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Hourly data not available. Please ensure hourly data is fetched from PVWatts.</p>
              </div>
            )}
          </TabsContent>

          {/* Daily Analysis Tab */}
          <TabsContent value="daily" className="space-y-6">
            {dailyAnalysisData ? (
              <>
                {/* Toggle for chart/table view */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="daily-table-mode"
                    checked={showDataTable}
                    onCheckedChange={setShowDataTable}
                  />
                  <Label htmlFor="daily-table-mode">Show Data Table</Label>
                </div>

                {!showDataTable ? (
                  <>
                    {/* Daily Charts - Typical Month Pattern */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="border-2 border-gradient-to-r from-orange-200 to-yellow-200 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
                          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            ☀️ Daily Average Irradiance
                            <span className="text-sm font-normal text-gray-600">POA, DNI & Diffuse</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div style={{ height: '350px' }}>
                            <Line 
                              data={createDailyChartData('irradiance')!} 
                              options={{
                                ...getChartOptions('line'),
                                plugins: {
                                  ...getChartOptions('line').plugins,
                                  title: {
                                    display: true,
                                    text: 'Daily Avg of Typical Month - POA, DNI and Diffuse',
                                    font: { size: 14, weight: 'bold' },
                                    color: '#374151'
                                  }
                                },
                                scales: {
                                  ...getChartOptions('line').scales,
                                  x: {
                                    ...getChartOptions('line').scales?.x,
                                    title: { display: true, text: 'Day of Month', font: { size: 12, weight: 'bold' }, color: '#374151' }
                                  },
                                  y: {
                                    ...getChartOptions('line').scales?.y,
                                    title: { display: true, text: 'Irradiance (kWh/m²)', font: { size: 12, weight: 'bold' }, color: '#374151' }
                                  }
                                }
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-gradient-to-r from-blue-200 to-cyan-200 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            ⚡ Daily Average Energy Production
                            <span className="text-sm font-normal text-gray-600">DC vs AC Energy</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div style={{ height: '350px' }}>
                            <Line 
                              data={createDailyChartData('dc-ac')!} 
                              options={{
                                ...getChartOptions('line'),
                                plugins: {
                                  ...getChartOptions('line').plugins,
                                  title: {
                                    display: true,
                                    text: 'Daily Avg of Typical Month - DC vs AC Energy',
                                    font: { size: 14, weight: 'bold' },
                                    color: '#374151'
                                  }
                                },
                                scales: {
                                  ...getChartOptions('line').scales,
                                  x: {
                                    ...getChartOptions('line').scales?.x,
                                    title: { display: true, text: 'Day of Month', font: { size: 12, weight: 'bold' }, color: '#374151' }
                                  },
                                  y: {
                                    ...getChartOptions('line').scales?.y,
                                    title: { display: true, text: 'DC Energy (kWh)', font: { size: 12, weight: 'bold' }, color: '#374151' }
                                  },
                                  y1: {
                                    ...getChartOptions('line').scales?.y1,
                                    title: { display: true, text: 'AC Energy (kWh)', font: { size: 12, weight: 'bold' }, color: '#374151' }
                                  }
                                }
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-gradient-to-r from-purple-200 to-pink-200 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            🌡️ Daily Temperature Analysis
                            <span className="text-sm font-normal text-gray-600">Tcell vs Tamb</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div style={{ height: '350px' }}>
                            <Line 
                              data={createDailyChartData('tcell-tamb')!} 
                              options={{
                                ...getChartOptions('line'),
                                plugins: {
                                  ...getChartOptions('line').plugins,
                                  title: {
                                    display: true,
                                    text: 'Daily Avg of Tcell vs Tamb',
                                    font: { size: 14, weight: 'bold' },
                                    color: '#374151'
                                  }
                                },
                                scales: {
                                  ...getChartOptions('line').scales,
                                  x: {
                                    ...getChartOptions('line').scales?.x,
                                    title: { display: true, text: 'Day of Month', font: { size: 12, weight: 'bold' }, color: '#374151' }
                                  },
                                  y: {
                                    ...getChartOptions('line').scales?.y,
                                    title: { display: true, text: 'Cell Temperature (°C)', font: { size: 12, weight: 'bold' }, color: '#374151' }
                                  },
                                  y1: {
                                    ...getChartOptions('line').scales?.y1,
                                    title: { display: true, text: 'Ambient Temperature (°C)', font: { size: 12, weight: 'bold' }, color: '#374151' }
                                  }
                                }
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-gradient-to-r from-green-200 to-teal-200 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50">
                          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            📊 365 Days Energy Analysis
                            <span className="text-sm font-normal text-gray-600">Full Year DC vs AC</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div style={{ height: '350px' }}>
                            <Line 
                              data={createAllDaysChartData('dc-ac')!} 
                              options={{
                                ...getChartOptions('line'),
                                plugins: {
                                  ...getChartOptions('line').plugins,
                                  title: {
                                    display: true,
                                    text: 'Daily DC vs AC Energy for 365 Days',
                                    font: { size: 14, weight: 'bold' },
                                    color: '#374151'
                                  }
                                },
                                scales: {
                                  ...getChartOptions('line').scales,
                                  x: {
                                    ...getChartOptions('line').scales?.x,
                                    title: { display: true, text: 'Day of Year', font: { size: 12, weight: 'bold' }, color: '#374151' }
                                  },
                                  y: {
                                    ...getChartOptions('line').scales?.y,
                                    title: { display: true, text: 'DC Energy (kWh)', font: { size: 12, weight: 'bold' }, color: '#374151' }
                                  },
                                  y1: {
                                    ...getChartOptions('line').scales?.y1,
                                    title: { display: true, text: 'AC Energy (kWh)', font: { size: 12, weight: 'bold' }, color: '#374151' }
                                  }
                                }
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Daily Analysis Data Table</CardTitle>
                      </CardHeader>
                      <CardContent>
        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-4 py-2">Day</th>
                                <th className="border border-gray-300 px-4 py-2">POA (kWh/m²)</th>
                                <th className="border border-gray-300 px-4 py-2">DNI (kWh/m²)</th>
                                <th className="border border-gray-300 px-4 py-2">Diffuse (kWh/m²)</th>
                                <th className="border border-gray-300 px-4 py-2">DC Energy (kWh)</th>
                                <th className="border border-gray-300 px-4 py-2">AC Energy (kWh)</th>
                                <th className="border border-gray-300 px-4 py-2">Tcell (°C)</th>
                                <th className="border border-gray-300 px-4 py-2">Tamb (°C)</th>
              </tr>
            </thead>
                            <tbody>
                              {Array.from({length: Math.min(30, dailyAnalysisData.dailyPOA.length)}, (_, i) => (
                                <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                                  <td className="border border-gray-300 px-4 py-2">{i + 1}</td>
                                  <td className="border border-gray-300 px-4 py-2">{dailyAnalysisData.dailyPOA[i]?.toFixed(2) || 'N/A'}</td>
                                  <td className="border border-gray-300 px-4 py-2">{dailyAnalysisData.dailyDNI[i]?.toFixed(2) || 'N/A'}</td>
                                  <td className="border border-gray-300 px-4 py-2">{dailyAnalysisData.dailyDiffuse[i]?.toFixed(2) || 'N/A'}</td>
                                  <td className="border border-gray-300 px-4 py-2">{dailyAnalysisData.dailyDC[i]?.toFixed(2) || 'N/A'}</td>
                                  <td className="border border-gray-300 px-4 py-2">{dailyAnalysisData.dailyAC[i]?.toFixed(2) || 'N/A'}</td>
                                  <td className="border border-gray-300 px-4 py-2">{dailyAnalysisData.dailyTcell[i]?.toFixed(1) || 'N/A'}</td>
                                  <td className="border border-gray-300 px-4 py-2">{dailyAnalysisData.dailyTamb[i]?.toFixed(1) || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Daily data not available. Please ensure hourly data is fetched from PVWatts.</p>
              </div>
            )}
          </TabsContent>

          {/* Monthly Analysis Tab */}
          <TabsContent value="monthly" className="space-y-6">
            {/* Toggle for chart/table view */}
            <div className="flex items-center space-x-2">
              <Switch
                id="monthly-table-mode"
                checked={showDataTable}
                onCheckedChange={setShowDataTable}
              />
              <Label htmlFor="monthly-table-mode">Show Data Table</Label>
            </div>

            {!showDataTable ? (
              <>
                {/* Monthly Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-2 border-gradient-to-r from-orange-200 to-yellow-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
                      <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        ☀️ Monthly Irradiation Analysis
                        <span className="text-sm font-normal text-gray-600">POA, DNI & Diffuse</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div style={{ height: '350px' }}>
                        {createMonthlyIrradianceData() && (
                          <Line 
                            data={createMonthlyIrradianceData()!} 
                            options={{
                              ...getChartOptions('line'),
                              plugins: {
                                ...getChartOptions('line').plugins,
                                title: {
                                  display: true,
                                  text: 'Monthly POA, DNI and Diffuse Irradiation',
                                  font: { size: 14, weight: 'bold' },
                                  color: '#374151'
                                }
                              },
                              scales: {
                                ...getChartOptions('line').scales,
                                x: {
                                  ...getChartOptions('line').scales?.x,
                                  title: { display: true, text: 'Month', font: { size: 12, weight: 'bold' }, color: '#374151' }
                                },
                                y: {
                                  ...getChartOptions('line').scales?.y,
                                  title: { display: true, text: 'Irradiation (kWh/m²)', font: { size: 12, weight: 'bold' }, color: '#374151' }
                                }
                              }
                            }}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-gradient-to-r from-blue-200 to-cyan-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                      <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        ⚡ Monthly Energy Production
                        <span className="text-sm font-normal text-gray-600">DC vs AC Energy</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div style={{ height: '350px' }}>
                        {createMonthlyEnergyData() && (
                          <Line 
                            data={createMonthlyEnergyData()!} 
                            options={{
                              ...getChartOptions('line'),
                              plugins: {
                                ...getChartOptions('line').plugins,
                                title: {
                                  display: true,
                                  text: 'Monthly DC vs AC Energy',
                                  font: { size: 14, weight: 'bold' },
                                  color: '#374151'
                                }
                              },
                              scales: {
                                ...getChartOptions('line').scales,
                                x: {
                                  ...getChartOptions('line').scales?.x,
                                  title: { display: true, text: 'Month', font: { size: 12, weight: 'bold' }, color: '#374151' }
                                },
                                y: {
                                  ...getChartOptions('line').scales?.y,
                                  title: { display: true, text: 'DC Energy (kWh)', font: { size: 12, weight: 'bold' }, color: '#374151' }
                                },
                                y1: {
                                  ...getChartOptions('line').scales?.y1,
                                  title: { display: true, text: 'AC Energy (kWh)', font: { size: 12, weight: 'bold' }, color: '#374151' }
                                }
                              }
                            }}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly PR Chart */}
                <div className="grid grid-cols-1 gap-6">
                  <Card className="border-2 border-gradient-to-r from-purple-200 to-pink-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                      <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        📊 Monthly Performance Ratio (PR)
                        <span className="text-sm font-normal text-gray-600">Calculated PR Chart</span>
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-2">
                        Performance Ratio = [Total Solar Energy Generated / (Total POA Irradiation × Total DC Capacity)] × 100
                      </p>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div style={{ height: '350px' }}>
                        {createMonthlyPRData() && (
                          <Bar 
                            data={createMonthlyPRData()!} 
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'top' as const,
                                  labels: {
                                    usePointStyle: true,
                                    pointStyle: 'circle',
                                    font: { size: 12, weight: 'bold' },
                                    color: '#374151'
                                  }
                                },
                                title: {
                                  display: true,
                                  text: 'Monthly PR Chart (Calculated)',
                                  font: { size: 14, weight: 'bold' },
                                  color: '#374151'
                                },
                                tooltip: {
                                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                  titleColor: '#fff',
                                  bodyColor: '#fff',
                                  borderColor: '#374151',
                                  borderWidth: 1,
                                  cornerRadius: 8,
                                  titleFont: { size: 13, weight: 'bold' },
                                  bodyFont: { size: 12 },
                                  callbacks: {
                                    label: function(context) {
                                      return `PR: ${context.parsed.y.toFixed(2)}%`;
                                    }
                                  }
                                }
                              },
                              animation: {
                                duration: 1000,
                                easing: 'easeInOutQuart'
                              },
                              scales: {
                                x: {
                                  title: { 
                                    display: true, 
                                    text: 'Month', 
                                    font: { size: 12, weight: 'bold' }, 
                                    color: '#374151' 
                                  },
                                  grid: {
                                    color: 'rgba(0, 0, 0, 0.1)',
                                    lineWidth: 1
                                  },
                                  ticks: {
                                    color: '#6B7280',
                                    font: { size: 11 }
                                  }
                                },
                                y: {
                                  beginAtZero: true,
                                  title: { 
                                    display: true, 
                                    text: 'Performance Ratio (%)', 
                                    font: { size: 12, weight: 'bold' }, 
                                    color: '#374151' 
                                  },
                                  grid: {
                                    color: 'rgba(0, 0, 0, 0.1)',
                                    lineWidth: 1
                                  },
                                  ticks: {
                                    color: '#6B7280',
                                    font: { size: 11 }
                                  }
                                }
                              }
                            }}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Analysis Data Table</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2">Month</th>
                            <th className="border border-gray-300 px-4 py-2">POA Irradiation (kWh/m²)</th>
                            <th className="border border-gray-300 px-4 py-2">DC Energy (kWh)</th>
                            <th className="border border-gray-300 px-4 py-2">AC Energy (kWh)</th>
                            <th className="border border-gray-300 px-4 py-2">Performance Ratio (%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.energy.monthly.map((monthData, index) => {
                            const monthlyPOA = results.irradiation.monthly[index]["Monthly Solar Irradiation (kWh/m²)"];
                            const monthlyAC = monthData["Monthly Energy Production (kWh)"];
                            const dcCapacity = systemParams.capacity;
                            const pr = monthlyPOA > 0 && dcCapacity > 0 ? (monthlyAC / (monthlyPOA * dcCapacity)) * 100 : 0;
                
                return (
                              <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                                <td className="border border-gray-300 px-4 py-2">{monthData.Month}</td>
                                <td className="border border-gray-300 px-4 py-2">{monthlyPOA.toFixed(2)}</td>
                                <td className="border border-gray-300 px-4 py-2">N/A</td>
                                <td className="border border-gray-300 px-4 py-2">{monthlyAC.toFixed(2)}</td>
                                <td className="border border-gray-300 px-4 py-2">{pr.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Yearly Projection Tab */}
          <TabsContent value="yearly" className="space-y-6">
            {(() => {
              // Calculate base annual energy from results
              const baseAnnualEnergy = results.energy?.metrics?.total_yearly || 0;
              const degradationRate = 0.006; // 0.6% per year (typical solar panel degradation)
              
              // Create 25-year projection data
              const yearlyProjections = Array.from({ length: 25 }, (_, index) => {
                const year = index + 1;
                const degradationFactor = Math.pow(1 - degradationRate, year - 1);
                const energyOutput = baseAnnualEnergy * degradationFactor;
                const cumulativeDegradation = ((1 - degradationFactor) * 100);
                
                return {
                  year,
                  energyOutput: Math.round(energyOutput),
                  degradationFactor: degradationFactor,
                  cumulativeDegradation: cumulativeDegradation,
                  annualDegradation: year === 1 ? 0 : degradationRate * 100
                };
              });

              // Create chart data for energy bars
              const energyBarChartData = {
                labels: yearlyProjections.map(data => `Year ${data.year}`),
                datasets: [
                  {
                    label: '⚡ Annual Energy Output',
                    data: yearlyProjections.map(data => data.energyOutput),
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: 'rgb(34, 197, 94)',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false
                  }
                ]
              };

              // Create chart data for degradation line
              const degradationLineChartData = {
                labels: yearlyProjections.map(data => `Year ${data.year}`),
                datasets: [
                  {
                    label: '📉 Cumulative Degradation',
                    data: yearlyProjections.map(data => data.cumulativeDegradation),
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    borderWidth: 3,
                    pointBackgroundColor: 'rgb(239, 68, 68)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    tension: 0.4,
                    fill: true
                  }
                ]
              };

              return (
                <>
                  {/* Table and Chart Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 25-Year Projection Table - Left Side */}
                  <Card className="border-2 border-gradient-to-r from-blue-200 to-purple-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center shadow-lg">
                            <span className="text-white text-2xl">📈</span>
                          </div>
                          <div>
                            <CardTitle className="text-2xl font-bold text-gray-900">25-Year Energy Production Forecast</CardTitle>
                            <p className="text-gray-600 text-sm mt-1">Annual energy output with {(degradationRate * 100).toFixed(1)}% yearly degradation factor</p>
                          </div>
                        </div>
                        <div className="hidden lg:flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-gray-600">Energy Output</span>
                          <div className="w-3 h-3 rounded-full bg-red-500 ml-3"></div>
                          <span className="text-gray-600">Degradation</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                        <table className="w-full text-sm bg-white">
                          <thead>
                            <tr className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
                              <th className="text-left py-3 px-4 font-bold text-sm">Year</th>
                              <th className="text-center py-3 px-4 font-bold text-sm">Energy Output<br/><span className="text-xs font-normal opacity-90">(kWh)</span></th>
                              <th className="text-center py-3 px-4 font-bold text-sm">Performance Factor<br/><span className="text-xs font-normal opacity-90">(%)</span></th>
                              <th className="text-center py-3 px-4 font-bold text-sm">Cumulative Loss<br/><span className="text-xs font-normal opacity-90">(%)</span></th>
                              <th className="text-center py-3 px-4 font-bold text-sm">vs Year 1<br/><span className="text-xs font-normal opacity-90">(kWh)</span></th>
                            </tr>
                          </thead>
                          <tbody>
                            {yearlyProjections.map((projection, index) => {
                              const energyLossVsYear1 = yearlyProjections[0].energyOutput - projection.energyOutput;
                              
                              return (
                                <tr key={index} className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                  <td className="py-3 px-4 font-bold text-gray-800 bg-gradient-to-r from-gray-50 to-transparent text-sm">
                                    {projection.year}
                                    {projection.year === 1 && <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Baseline</span>}
                                    {projection.year === 25 && <span className="ml-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">Final</span>}
                    </td>
                                  <td className="py-3 px-4 text-center font-bold text-green-700 bg-green-50/50 text-sm">
                                    {projection.energyOutput.toLocaleString()}
                                  </td>
                                  <td className="py-3 px-4 text-center text-blue-600 font-medium text-sm">
                                    {(projection.degradationFactor * 100).toFixed(2)}%
                                  </td>
                                  <td className="py-3 px-4 text-center font-bold text-red-600 bg-red-50/50 text-sm">
                                    {projection.cumulativeDegradation.toFixed(2)}%
                                  </td>
                                  <td className="py-3 px-4 text-center text-orange-600 font-medium text-sm">
                                    -{energyLossVsYear1.toLocaleString()}
                                  </td>
                  </tr>
                );
              })}
                            
                            {/* Summary Row */}
                            <tr className="border-t-4 border-blue-500 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-bold text-sm">
                              <td className="py-4 px-4 text-white">25-Year Total</td>
                              <td className="py-4 px-4 text-center">
                                {yearlyProjections.reduce((sum, proj) => sum + proj.energyOutput, 0).toLocaleString()} kWh
                              </td>
                              <td className="py-4 px-4 text-center">
                                Avg: {((yearlyProjections.reduce((sum, proj) => sum + proj.degradationFactor, 0) / 25) * 100).toFixed(1)}%
                              </td>
                              <td className="py-4 px-4 text-center">
                                Final: {yearlyProjections[24].cumulativeDegradation.toFixed(1)}%
                              </td>
                              <td className="py-4 px-4 text-center">
                                Total Lost: {(yearlyProjections[0].energyOutput * 25 - yearlyProjections.reduce((sum, proj) => sum + proj.energyOutput, 0)).toLocaleString()} kWh
                              </td>
                            </tr>
            </tbody>
          </table>
        </div>
                      
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-900 mb-2">Performance Metrics</h4>
                          <div className="text-xs text-green-800 space-y-1">
                            <div><strong>Base Annual Energy:</strong> {baseAnnualEnergy.toLocaleString()} kWh</div>
                            <div><strong>Degradation Rate:</strong> {(degradationRate * 100).toFixed(1)}% per year</div>
                            <div><strong>25-Year Average:</strong> {Math.round(yearlyProjections.reduce((sum, proj) => sum + proj.energyOutput, 0) / 25).toLocaleString()} kWh/year</div>
                            <div><strong>Total Energy (25 years):</strong> {yearlyProjections.reduce((sum, proj) => sum + proj.energyOutput, 0).toLocaleString()} kWh</div>
      </div>
    </div>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2">Projection Assumptions</h4>
                          <div className="text-xs text-blue-800 space-y-1">
                            <div><strong>Technology:</strong> Crystalline Silicon</div>
                            <div><strong>Warranty Period:</strong> 25 years</div>
                            <div><strong>Environmental Factors:</strong> Standard conditions</div>
                            <div><strong>Maintenance:</strong> Regular cleaning & inspection</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                    {/* Combined Chart - Right Side */}
                    <Card className="border-2 border-gradient-to-r from-purple-200 to-indigo-200 shadow-lg">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                        <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          📊 25-Year Performance Overview
                          <span className="text-sm font-normal text-gray-600">Energy Output & Degradation</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div style={{ height: '280px' }}>
                          <Bar 
                            data={energyBarChartData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                y: {
                                  beginAtZero: false,
                                  title: {
                                    display: true,
                                    text: 'Annual Energy Output (kWh)',
                                    font: { size: 11, weight: 'bold' },
                                    color: '#374151'
                                  },
                                  grid: { color: 'rgba(0, 0, 0, 0.05)' },
                                  ticks: { color: '#6b7280', font: { size: 10 } }
                                },
                                x: {
                                  grid: { color: 'rgba(0, 0, 0, 0.05)' },
                                  ticks: { 
                                    color: '#6b7280', 
                                    font: { size: 9 },
                                    maxTicksLimit: 13
                                  }
                                }
                              },
                              plugins: {
                                title: {
                                  display: false
                                },
                                legend: {
                                  display: true,
                                  position: 'top' as const
                                }
                              }
                            } as ChartOptions<'bar'>}
                          />
                        </div>
                        
                        <div style={{ height: '280px', marginTop: '20px' }}>
                          <Line 
                            data={degradationLineChartData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  max: 20,
                                  title: {
                                    display: true,
                                    text: 'Cumulative Degradation (%)',
                                    font: { size: 11, weight: 'bold' },
                                    color: '#374151'
                                  },
                                  grid: { color: 'rgba(0, 0, 0, 0.05)' },
                                  ticks: { color: '#6b7280', font: { size: 10 } }
                                },
                                x: {
                                  title: {
                                    display: true,
                                    text: 'Project Year',
                                    font: { size: 11, weight: 'bold' },
                                    color: '#374151'
                                  },
                                  grid: { color: 'rgba(0, 0, 0, 0.05)' },
                                  ticks: { 
                                    color: '#6b7280', 
                                    font: { size: 9 },
                                    maxTicksLimit: 13
                                  }
                                }
                              },
                              plugins: {
                                title: {
                                  display: false
                                },
                                legend: {
                                  display: true,
                                  position: 'top' as const
                                }
                              }
                            } as ChartOptions<'line'>}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              );
            })()}
          </TabsContent>

          {/* Uncertainty Analysis Tab */}
          <TabsContent value="uncertainty" className="space-y-6">
            {(() => {
              // Calculate base annual energy from results
              const baseAnnualEnergy = results.energy?.metrics?.total_yearly || 0;
              const degradationRate = 0.006; // 0.6% per year (typical solar panel degradation)
              
              return (
                <>
                  {/* Uncertainty Analysis Section */}
                  <Card className="border-2 border-gradient-to-r from-amber-200 to-orange-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 via-orange-600 to-red-700 flex items-center justify-center shadow-lg">
                            <span className="text-white text-2xl">📊</span>
                          </div>
                          <div>
                            <CardTitle className="text-2xl font-bold text-gray-900">Uncertainty Analysis</CardTitle>
                            <p className="text-gray-600 text-sm mt-1">Monte Carlo simulation with 1,000 scenarios analyzing system performance variability</p>
                          </div>
                        </div>
                        <div className="hidden lg:flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-gray-600">P50 (Expected)</span>
                          <div className="w-3 h-3 rounded-full bg-purple-500 ml-3"></div>
                          <span className="text-gray-600">P75 (Conservative)</span>
                          <div className="w-3 h-3 rounded-full bg-blue-500 ml-3"></div>
                          <span className="text-gray-600">P90 (Very Conservative)</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      {(() => {
                        // Monte Carlo Simulation Parameters (Industry Standards)
                        const uncertaintyParams = {
                          irradiationStdDev: 0.06,        // ±6% inter-annual variability
                          degradationStdDev: 0.0002,      // ±0.02% per year (0.58%-0.62%)
                          systemStdDev: 0.03,             // ±3% system performance
                          equipmentStdDev: 0.02,          // ±2% equipment uncertainty
                          simulations: 1000               // Number of Monte Carlo runs
                        };

                        // Normal distribution random sampling
                        const normalRandom = (mean: number, stdDev: number): number => {
                          // Box-Muller transformation
                          const u1 = Math.random();
                          const u2 = Math.random();
                          const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                          return mean + z0 * stdDev;
                        };

                        // Calculate percentiles
                        const percentile = (arr: number[], p: number): number => {
                          const sorted = [...arr].sort((a, b) => a - b);
                          const index = (p / 100) * (sorted.length - 1);
                          const lower = Math.floor(index);
                          const upper = Math.ceil(index);
                          const weight = index % 1;
                          return sorted[lower] * (1 - weight) + sorted[upper] * weight;
                        };

                        // Run Monte Carlo Simulation
                        const runMonteCarloSimulation = () => {
                          const allSimulations: number[][] = [];
                          
                          for (let sim = 0; sim < uncertaintyParams.simulations; sim++) {
                            const yearlyResults: number[] = [];
                            
                            // Sample uncertainty factors for this simulation
                            const irradiationFactor = Math.max(0.5, normalRandom(1.0, uncertaintyParams.irradiationStdDev));
                            const systemFactor = Math.max(0.7, normalRandom(1.0, uncertaintyParams.systemStdDev));
                            const equipmentFactor = Math.max(0.8, normalRandom(1.0, uncertaintyParams.equipmentStdDev));
                            
                            for (let year = 1; year <= 25; year++) {
                              // Sample degradation rate for this year
                              const yearlyDegradationRate = Math.max(0.003, Math.min(0.012, 
                                normalRandom(degradationRate, uncertaintyParams.degradationStdDev)));
                              
                              // Calculate energy with uncertainties
                              const degradationFactor = Math.pow(1 - yearlyDegradationRate, year - 1);
                              const uncertainAnnualEnergy = baseAnnualEnergy * 
                                irradiationFactor * 
                                degradationFactor * 
                                systemFactor * 
                                equipmentFactor;
                              
                              yearlyResults.push(Math.round(uncertainAnnualEnergy));
                            }
                            allSimulations.push(yearlyResults);
                          }
                          
                          return allSimulations;
                        };

                        const simulationResults = runMonteCarloSimulation();

                        // Calculate statistics for each year
                        const yearlyStats = Array.from({ length: 25 }, (_, yearIndex) => {
                          const yearData = simulationResults.map(sim => sim[yearIndex]);
                          return {
                            year: yearIndex + 1,
                            p50: Math.round(percentile(yearData, 50)),  // Expected (median) - 50% chance of exceeding
                            p75: Math.round(percentile(yearData, 25)),  // Conservative - 75% chance of exceeding (25th percentile)
                            p90: Math.round(percentile(yearData, 10)),  // Very conservative - 90% chance of exceeding (10th percentile)
                            mean: Math.round(yearData.reduce((sum, val) => sum + val, 0) / yearData.length),
                            stdDev: Math.round(Math.sqrt(yearData.reduce((sum, val) => sum + Math.pow(val - (yearData.reduce((s, v) => s + v, 0) / yearData.length), 2), 0) / yearData.length))
                          };
                        });

                        return (
                          <div className="space-y-8">
                            {/* Uncertainty Parameters Info */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                                <h4 className="font-semibold text-blue-900 mb-2">☀️ Weather Uncertainty</h4>
                                <div className="text-xs text-blue-800">
                                  <div><strong>Inter-annual variability:</strong> ±6%</div>
                                  <div><strong>Standard:</strong> IEC 61724-1</div>
                                </div>
                              </div>
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                                <h4 className="font-semibold text-green-900 mb-2">📉 Degradation Uncertainty</h4>
                                <div className="text-xs text-green-800">
                                  <div><strong>Rate variation:</strong> ±0.02%/year</div>
                                  <div><strong>Range:</strong> 0.58% - 0.62%</div>
                                </div>
                              </div>
                              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
                                <h4 className="font-semibold text-purple-900 mb-2">⚙️ System Uncertainty</h4>
                                <div className="text-xs text-purple-800">
                                  <div><strong>Performance variation:</strong> ±3%</div>
                                  <div><strong>Factors:</strong> Soiling, shading</div>
                                </div>
                              </div>
                              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                                <h4 className="font-semibold text-orange-900 mb-2">🔧 Equipment Uncertainty</h4>
                                <div className="text-xs text-orange-800">
                                  <div><strong>Equipment variation:</strong> ±2%</div>
                                  <div><strong>Factors:</strong> Manufacturing, aging</div>
                                </div>
                              </div>
                            </div>

                             {/* PVSyst-Style Probability Distribution Chart */}
                             <Card className="border border-gray-200">
                               <CardHeader>
                                 <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                   📊 Probability Distribution (Year 1)
                                 </CardTitle>
                                 <p className="text-sm text-gray-600">
                                   Energy production probability distribution with P50, P75, P90 confidence levels
                                 </p>
                               </CardHeader>
                               <CardContent>
                                 {(() => {
                                   // Get Year 1 statistics for probability distribution
                                   const year1Stats = yearlyStats[0];
                                   const mean = year1Stats.p50;
                                   const stdDev = year1Stats.stdDev;
                                   
                                   // Generate normal distribution curve points
                                   const numPoints = 100;
                                   const minX = mean - 3.5 * stdDev;
                                   const maxX = mean + 3.5 * stdDev;
                                   const step = (maxX - minX) / numPoints;
                                   
                                   // Normal probability density function
                                   const normalPDF = (x: number, mu: number, sigma: number) => {
                                     return (1 / (sigma * Math.sqrt(2 * Math.PI))) * 
                                            Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
                                   };
                                   
                                   // Generate curve data points
                                   const curveData = [];
                                   const labels = [];
                                   for (let i = 0; i <= numPoints; i++) {
                                     const x = minX + i * step;
                                     const y = normalPDF(x, mean, stdDev);
                                     labels.push((x / 1000).toFixed(1)); // Convert to MWh for display
                                     curveData.push(y);
                                   }
                                   
                                   return (
                                     <div className="space-y-4">
                                       {/* Statistics Display */}
                                       <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                                         <div className="grid grid-cols-3 gap-4 text-center">
                                           <div>
                                             <div className="text-sm font-medium text-green-700">P50 (Expected)</div>
                                             <div className="text-xl font-bold text-green-800">{(year1Stats.p50 / 1000).toFixed(2)} MWh</div>
                                           </div>
                                           <div>
                                             <div className="text-sm font-medium text-purple-700">P75 (Conservative)</div>
                                             <div className="text-xl font-bold text-purple-800">{(year1Stats.p75 / 1000).toFixed(2)} MWh</div>
                                           </div>
                                           <div>
                                             <div className="text-sm font-medium text-blue-700">P90 (Very Conservative)</div>
                                             <div className="text-xl font-bold text-blue-800">{(year1Stats.p90 / 1000).toFixed(2)} MWh</div>
                                           </div>
                                         </div>
                                         <div className="mt-3 text-center">
                                           <div className="text-sm text-gray-600">
                                             <strong>Variability:</strong> {(year1Stats.stdDev / 1000).toFixed(2)} MWh
                                           </div>
                                         </div>
                                       </div>
                                       
                                       {/* Probability Distribution Chart */}
                                       <div style={{ height: '400px' }}>
                                         <Line
                                           data={{
                                             labels,
                                             datasets: [
                                               {
                                                 label: 'Probability Distribution',
                                                 data: curveData,
                                                 borderColor: 'rgb(59, 130, 246)',
                                                 backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                 borderWidth: 3,
                                                 fill: true,
                                                 tension: 0.4,
                                                 pointRadius: 0,
                                                 pointHoverRadius: 0
                                               },
                                               // P50 peak marker
                                               {
                                                 label: 'P50 (Peak)',
                                                 data: labels.map((label, index) => {
                                                   const energyValue = parseFloat(label);
                                                   const p50Value = year1Stats.p50 / 1000;
                                                   if (Math.abs(energyValue - p50Value) < 0.3) {
                                                     return Math.max(...curveData);
                                                   }
                                                   return null;
                                                 }),
                                                 borderColor: 'rgb(34, 197, 94)',
                                                 backgroundColor: 'rgb(34, 197, 94)',
                                                 pointRadius: 8,
                                                 pointHoverRadius: 12,
                                                 showLine: false,
                                                 borderWidth: 0
                                               }
                                             ]
                                           }}
                                           options={{
                                             responsive: true,
                                             maintainAspectRatio: false,
                                             plugins: {
                                               legend: {
                                                 display: false
                                               },
                                               tooltip: {
                                                 mode: 'index' as const,
                                                 intersect: false,
                                                 backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                                 titleColor: '#fff',
                                                 bodyColor: '#fff',
                                                 cornerRadius: 8,
                                                 padding: 12,
                                                 callbacks: {
                                                   title: function(context) {
                                                     const energyValue = parseFloat(context[0].label);
                                                     const p90Value = year1Stats.p90 / 1000;
                                                     const p75Value = year1Stats.p75 / 1000;
                                                     const p50Value = year1Stats.p50 / 1000;
                                                     
                                                     // Check if hovering near P-values with better tolerance
                                                     if (Math.abs(energyValue - p50Value) < 0.5) {
                                                       return `P50: ${p50Value.toFixed(2)} MWh (Expected - Peak)`;
                                                     } else if (Math.abs(energyValue - p75Value) < 0.5) {
                                                       return `P75: ${p75Value.toFixed(2)} MWh (Conservative)`;
                                                     } else if (Math.abs(energyValue - p90Value) < 0.5) {
                                                       return `P90: ${p90Value.toFixed(2)} MWh (Very Conservative)`;
                                                     }
                                                     
                                                     return `Energy Production: ${energyValue.toFixed(2)} MWh`;
                                                   },
                                                   label: function(context) {
                                                     if (context.datasetIndex === 0) {
                                                       const probabilityValue = context.parsed.y;
                                                       const maxProbability = Math.max(...curveData);
                                                       const relativeProbability = (probabilityValue / maxProbability) * 100;
                                                       return `Relative Probability: ${relativeProbability.toFixed(1)}%`;
                                                     } else if (context.datasetIndex === 1) {
                                                       return `Peak Distribution Point (P50)`;
                                                     }
                                                     return null;
                                                   },
                                                   footer: function(tooltipItems) {
                                                     const energyValue = parseFloat(tooltipItems[0].label);
                                                     const p90Value = year1Stats.p90 / 1000;
                                                     const p75Value = year1Stats.p75 / 1000;
                                                     const p50Value = year1Stats.p50 / 1000;
                                                     
                                                     if (Math.abs(energyValue - p50Value) < 0.5) {
                                                       return '50% chance of exceeding this value';
                                                     } else if (Math.abs(energyValue - p75Value) < 0.5) {
                                                       return '75% chance of exceeding this value';
                                                     } else if (Math.abs(energyValue - p90Value) < 0.5) {
                                                       return '90% chance of exceeding this value';
                                                     }
                                                     return '';
                                                   }
                                                 }
                                               }
                                             },
                                             scales: {
                                               x: {
                                                 title: {
                                                   display: true,
                                                   text: 'Annual Energy Production (MWh)',
                                                   font: {
                                                     size: 12,
                                                     weight: 'bold'
                                                   },
                                                   color: '#374151'
                                                 },
                                                 grid: {
                                                   color: 'rgba(0, 0, 0, 0.05)'
                                                 },
                                                 ticks: {
                                                   color: '#6b7280',
                                                   font: { size: 10 }
                                                 }
                                               },
                                               y: {
                                                 title: {
                                                   display: true,
                                                   text: 'Probability Density',
                                                   font: {
                                                     size: 12,
                                                     weight: 'bold'
                                                   },
                                                   color: '#374151'
                                                 },
                                                 grid: {
                                                   color: 'rgba(0, 0, 0, 0.05)'
                                                 },
                                                 ticks: {
                                                   color: '#6b7280',
                                                   font: { size: 10 },
                                                   display: false  // Hide Y-axis numbers as they're not meaningful for users
                                                 }
                                               }
                                             },
                                             interaction: {
                                               intersect: false,
                                               mode: 'index' as const
                                             },
                                             elements: {
                                               point: {
                                                 radius: 0,
                                                 hoverRadius: 8
                                               }
                                             }
                                           } as ChartOptions<'line'>}
                                         />
                                       </div>
                                       
                                       {/* P-Value Markers */}
                                       <div className="relative mt-4">
                                         <div className="flex justify-between items-center text-sm">
                                           <div className="text-center">
                                             <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-1"></div>
                                             <div className="font-bold text-blue-700">P90</div>
                                             <div className="text-gray-600">{(year1Stats.p90 / 1000).toFixed(2)} MWh</div>
                                           </div>
                                           <div className="text-center">
                                             <div className="w-3 h-3 bg-purple-500 rounded-full mx-auto mb-1"></div>
                                             <div className="font-bold text-purple-700">P75</div>
                                             <div className="text-gray-600">{(year1Stats.p75 / 1000).toFixed(2)} MWh</div>
                                           </div>
                                           <div className="text-center">
                                             <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
                                             <div className="font-bold text-green-700">P50</div>
                                             <div className="text-gray-600">{(year1Stats.p50 / 1000).toFixed(2)} MWh</div>
                                           </div>
                                         </div>
                                       </div>
                                     </div>
                                   );
                                 })()}
                               </CardContent>
                             </Card>

                            {/* Uncertainty Band Chart */}
                            <Card className="border border-gray-200">
                              <CardHeader>
                                <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                  📈 Energy Production Uncertainty Bands (P50-P75-P90)
                                </CardTitle>
                                <p className="text-sm text-gray-600">
                                  Confidence intervals showing range of possible outcomes over 25 years
                                </p>
                              </CardHeader>
                              <CardContent>
                                {(() => {
                                  // Create uncertainty band chart data
                                  const uncertaintyBandData = {
                                    labels: yearlyStats.map(stat => `Year ${stat.year}`),
                                    datasets: [
                                      {
                                        label: 'P50 (Expected)',
                                        data: yearlyStats.map(stat => stat.p50),
                                        borderColor: 'rgb(34, 197, 94)',
                                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                        borderWidth: 3,
                                        pointBackgroundColor: 'rgb(34, 197, 94)',
                                        pointBorderColor: '#fff',
                                        pointBorderWidth: 2,
                                        pointRadius: 4,
                                        tension: 0.4,
                                        fill: false
                                      },
                                      {
                                        label: 'P75 (Conservative)',
                                        data: yearlyStats.map(stat => stat.p75),
                                        borderColor: 'rgba(147, 51, 234, 0.8)',
                                        backgroundColor: 'rgba(147, 51, 234, 0.1)',
                                        borderWidth: 2,
                                        fill: '+1',
                                        tension: 0.4
                                      },
                                      {
                                        label: 'P90 (Very Conservative)',
                                        data: yearlyStats.map(stat => stat.p90),
                                        borderColor: 'rgba(59, 130, 246, 0.8)',
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                        borderWidth: 2,
                                        fill: '-1',
                                        tension: 0.4
                                      }
                                    ]
                                  };

                                  return (
                                    <div style={{ height: '400px' }}>
                                      <Line 
                                        data={uncertaintyBandData}
                                        options={{
                                          responsive: true,
                                          maintainAspectRatio: false,
                                          interaction: {
                                            mode: 'index' as const,
                                            intersect: false,
                                          },
                                          scales: {
                                            y: {
                                              beginAtZero: false,
                                              title: {
                                                display: true,
                                                text: 'Annual Energy Production (kWh)',
                                                font: { size: 12, weight: 'bold' },
                                                color: '#374151'
                                              },
                                              grid: { color: 'rgba(0, 0, 0, 0.05)' },
                                              ticks: { color: '#6b7280', font: { size: 11 } }
                                            },
                                            x: {
                                              title: {
                                                display: true,
                                                text: 'Project Year',
                                                font: { size: 12, weight: 'bold' },
                                                color: '#374151'
                                              },
                                              grid: { color: 'rgba(0, 0, 0, 0.05)' },
                                              ticks: { 
                                                color: '#6b7280', 
                                                font: { size: 10 },
                                                maxTicksLimit: 13
                                              }
                                            }
                                          },
                                          plugins: {
                                            legend: {
                                              display: true,
                                              position: 'top' as const
                                            },
                                            tooltip: {
                                              callbacks: {
                                                label: function(context) {
                                                  return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} kWh`;
                                                }
                                              }
                                            }
                                          },
                                          elements: {
                                            point: {
                                              radius: 0,
                                              hoverRadius: 6
                                            }
                                          }
                                        } as ChartOptions<'line'>}
                                      />
                                    </div>
                                  );
                                })()}
                              </CardContent>
                            </Card>

                             {/* Summary Statistics Table */}
                            <Card className="border border-gray-200">
                              <CardHeader>
                                <CardTitle className="text-lg font-bold text-gray-800">
                                  📋 Uncertainty Analysis Summary (Selected Years)
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="bg-gradient-to-r from-gray-600 to-gray-700 text-white">
                                        <th className="text-left py-3 px-4 font-bold">Year</th>
                                        <th className="text-center py-3 px-4 font-bold">P50 (Expected)<br/><span className="text-xs font-normal opacity-90">(kWh)</span></th>
                                        <th className="text-center py-3 px-4 font-bold">P75 (Conservative)<br/><span className="text-xs font-normal opacity-90">(kWh)</span></th>
                                        <th className="text-center py-3 px-4 font-bold">P90 (Very Conservative)<br/><span className="text-xs font-normal opacity-90">(kWh)</span></th>
                                        <th className="text-center py-3 px-4 font-bold">Std Deviation<br/><span className="text-xs font-normal opacity-90">(kWh)</span></th>
                                        <th className="text-center py-3 px-4 font-bold">Uncertainty<br/><span className="text-xs font-normal opacity-90">(%)</span></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {[1, 5, 10, 15, 20, 25].map((year, index) => {
                                        const stats = yearlyStats[year - 1];
                                        const uncertainty = ((stats.p50 - stats.p90) / stats.p50 * 100);
                                        return (
                                          <tr key={year} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="py-3 px-4 font-bold text-gray-800">{year}</td>
                                            <td className="py-3 px-4 text-center text-green-600 font-bold">{stats.p50.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-center text-purple-600 font-medium">{stats.p75.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-center text-blue-600 font-medium">{stats.p90.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-center text-gray-600">{stats.stdDev.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-center text-purple-600 font-medium">±{Math.abs(uncertainty).toFixed(1)}%</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductionResults;
