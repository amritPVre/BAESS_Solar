import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Sun, Download, Loader2, Zap, BarChart3, TrendingUp, MapPin, Settings, Grid3X3, Activity } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { formatCurrency, formatNumber } from "@/utils/calculations";
import { toast } from "sonner";
import { SolarCalculationResult } from "@/types/solarCalculations";
import { ACConfiguration } from "./ACSideConfiguration";
import { FinancialResults } from "@/utils/financialCalculations";
import autoTable from 'jspdf-autotable';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// Flexible types that match what ProductionResults passes
type FlexibleSolarPanel = {
  manufacturer?: string;
  model?: string;
  nominal_power_w?: number | null;
  efficiency_percent?: number | null;
  technology?: string;
  panel_area_m2?: number | null;
  power_rating?: number;
  power?: number;
  name?: string;
  panel_type?: string;
  cell_type?: string;
  bifaciality?: number | null;
  length?: number;
  width?: number;
  module_length?: number;
  module_width?: number;
  efficiency?: number;
};

type FlexibleSolarInverter = {
  manufacturer?: string;
  model?: string;
  nominal_ac_power_kw?: number | null;
  maximum_ac_power_kw?: number | null;
  phase?: string;
  max_power?: number;
  power_rating?: number;
  efficiency?: number;
  name?: string;
  nominal_ac_voltage?: number;
  rated_ac_current?: number;
};

type FlexiblePolygonConfig = {
  area?: number;
  moduleCount?: number;
  capacityKw?: number;
  structureType?: string;
  azimuth?: number;
  tiltAngle?: number;
  id?: string;
  tableCount?: number;
};

interface AdvancedPDFReportProps {
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
  selectedPanel: FlexibleSolarPanel;
  selectedInverter: FlexibleSolarInverter;
  polygonConfigs: FlexiblePolygonConfig[];
  acConfiguration?: ACConfiguration;
  detailedLosses?: Record<string, number>;
  mapImage?: string | null;
  sldImage?: string | null;
  
  // Optional financial data - if provided, adds financial analysis pages
  financialResults?: FinancialResults;
  financialParams?: {
    totalProjectCost: number;
    governmentSubsidy: number;
    annualEnergyYear1: number;
    electricityRate: number;
    tariffEscalationRate: number;
    omExpensesPercent: number;
    omEscalationRate: number;
    annualDegradation: number;
    discountRate: number;
    incomeTaxRate: number;
    totalOMCosts25Years: number;
    totalRevenue25Years: number;
  };
  
  // Optional BOQ data for Annexure
  boqData?: Array<{
    slNo: number;
    description: string;
    specifications: string;
    unit: string;
    qty: string | number;
  }>;
  
  // Optional AI-generated content for enhanced report
  aiExecutiveSummary?: string;
  aiSwotAnalysis?: string;
  companyInfo?: {
    companyName: string;
    companyAddress?: string;
    authorName?: string;
    authorTitle?: string;
    companyLogo?: string;
  };
  clientInfo?: {
    clientName?: string;
    clientCompany?: string;
    clientAddress?: string;
  };
  projectInfo?: {
    projectName: string;
    projectObjective?: string;
    siteAddress?: string;
  };
}

const AdvancedPDFReport: React.FC<AdvancedPDFReportProps> = ({
  results,
  systemParams,
  selectedPanel,
  selectedInverter,
  polygonConfigs,
  acConfiguration,
  detailedLosses,
  mapImage,
  sldImage,
  financialResults,
  financialParams,
  boqData,
  aiExecutiveSummary,
  aiSwotAnalysis,
  companyInfo,
  clientInfo,
  projectInfo,
}) => {
  const [generating, setGenerating] = useState(false);
  
  // State for chart images
  const [monthlyChartImage, setMonthlyChartImage] = useState<string | null>(null);
  const [probabilityChartImage, setProbabilityChartImage] = useState<string | null>(null);
  
  // Calculate total pages in the entire document
  const energyPages = acConfiguration ? 7 : 6; // Pages 3-9 (with AC) or 3-8 (without AC)
  const financialPages = (financialResults && financialParams) ? 4 : 0; // Pages 10-13 if financial data exists
  const aiPages = (aiExecutiveSummary || aiSwotAnalysis) ? 2 : 0; // Estimate: 2 pages Executive Summary only
  const boqPages = boqData && boqData.length > 0 ? Math.ceil(boqData.length / 40) : 0; // Approx 40 rows per page
  const totalPages = 1 + 1 + energyPages + financialPages + aiPages + boqPages; // Cover + TOC + Energy + Financial + AI + BOQ
  
  // Refs for each page
  const page1Ref = useRef<HTMLDivElement>(null); // Cover
  const tocRef = useRef<HTMLDivElement>(null); // Table of Contents
  const page2Ref = useRef<HTMLDivElement>(null);
  const page3Ref = useRef<HTMLDivElement>(null);
  const page4Ref = useRef<HTMLDivElement>(null);
  const page5Ref = useRef<HTMLDivElement>(null);
  const page6Ref = useRef<HTMLDivElement>(null);
  const page7Ref = useRef<HTMLDivElement>(null);
  const page8Ref = useRef<HTMLDivElement>(null);
  
  // Refs for charts
  const monthlyChartRef = useRef<HTMLDivElement>(null);
  const probabilityChartRef = useRef<HTMLDivElement>(null);

  // Calculate totals and metrics
  const totalCapacity = systemParams.capacity;
  const totalModules = polygonConfigs?.reduce((sum, config) => sum + config.moduleCount, 0) || 0;
  const totalArea = polygonConfigs?.reduce((sum, config) => sum + config.area, 0) || 0;
  const annualProduction = results.energy?.metrics.total_yearly || 0;
  const monthlyProduction = results.energy?.monthly?.map(item => item["Monthly Energy Production (kWh)"]) || [];
  const monthlyIrradiation = results.irradiation?.monthly?.map(item => item["Monthly Solar Irradiation (kWh/m²)"]) || [];

  // Array type names
  const ARRAY_TYPE_NAMES = ["Fixed (open rack)", "Fixed (roof mount)", "2-Axis Tracking"];

  // Function to get structure type display name
  const getStructureTypeName = (structureType: string) => {
    switch(structureType) {
      case 'ballasted': return 'Ballasted Roof';
      case 'fixed_tilt': return 'Fixed Tilt';
      case 'ground_mount_tables': return 'Ground Mount';
      case 'carport': return 'Carport';
      case 'pv_table_free_form': return 'PV Table - Free Form';
      default: return structureType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
    }
  };

  // Get unique structure types from polygon configurations
  const getSystemStructureTypes = () => {
    if (!polygonConfigs || polygonConfigs.length === 0) {
      return ARRAY_TYPE_NAMES[systemParams.arrayType]; // Fallback to array type
    }
    
    const uniqueStructureTypes = [...new Set(polygonConfigs.map(config => config.structureType).filter(Boolean))];
    if (uniqueStructureTypes.length === 0) {
      return ARRAY_TYPE_NAMES[systemParams.arrayType]; // Fallback to array type
    }
    
    return uniqueStructureTypes.map(type => getStructureTypeName(type)).join(', ');
  };

  // Generate 25-year production data
  const generate25YearData = () => {
    const degradationRate = 0.5; // 0.5% per year
    const years = [];
    let cumulativeProduction = 0;
    
    for (let year = 1; year <= 25; year++) {
      const yearlyProduction = annualProduction * Math.pow(1 - degradationRate / 100, year - 1);
      cumulativeProduction += yearlyProduction;
      years.push({
        year,
        production: yearlyProduction,
        cumulative: cumulativeProduction,
        degradation: ((1 - Math.pow(1 - degradationRate / 100, year - 1)) * 100).toFixed(1)
      });
    }
    return years;
  };

  const yearlyData = generate25YearData();

  // Chart data for monthly production
  const monthlyChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Monthly Energy Production (kWh)',
        data: monthlyProduction,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.1)',
        },
      },
      x: {
        grid: {
          color: 'rgba(0,0,0,0.1)',
        },
      },
    },
  };

  // Function to capture chart as image
  const captureChartAsImage = (chartRef: React.RefObject<HTMLDivElement>): string | null => {
    if (!chartRef.current) return null;
    
    const canvas = chartRef.current.querySelector('canvas');
    if (!canvas) return null;
    
    return canvas.toDataURL('image/png');
  };

  // Function to capture all charts
  const captureAllCharts = () => {
    const monthlyChart = captureChartAsImage(monthlyChartRef);
    const probabilityChart = captureChartAsImage(probabilityChartRef);
    
    setMonthlyChartImage(monthlyChart);
    setProbabilityChartImage(probabilityChart);
    
    return { monthlyChart, probabilityChart };
  };

  const generatePDF = async () => {
    // Check required refs based on configuration
    const requiredRefs = [page1Ref, page2Ref];
    if (acConfiguration) {
      requiredRefs.push(page3Ref, page4Ref, page5Ref, page6Ref, page7Ref, page8Ref); // AC Config + all subsequent pages
    } else {
      requiredRefs.push(page3Ref, page4Ref, page5Ref, page6Ref, page7Ref); // System Performance + all subsequent pages
    }
    
    if (requiredRefs.some(ref => !ref.current)) {
      toast.error("Could not find report elements to generate PDF");
      return;
    }

    try {
      setGenerating(true);
      toast.success("Generating comprehensive PDF report...", { 
        description: `Please wait while we prepare your ${acConfiguration ? '8' : '7'}-page solar analysis report` 
      });

      // First, capture all charts as images
      const chartImages = captureAllCharts();
      
      // Wait for charts to render and state to update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const pageHeight = 297;

      // Helper function to add footer with logo and page number
      const addFooter = (pageNum: number, totalPages: number) => {
        const footerY = pageHeight - 10;
        const margin = 15;
        
        // Add company logo to bottom left if available
        if (companyInfo?.companyLogo) {
          try {
            const logoWidth = 15;
            const logoHeight = 15;
            const logoX = margin;
            const logoY = pageHeight - 20;
            pdf.addImage(companyInfo.companyLogo, 'PNG', logoX, logoY, logoWidth, logoHeight);
          } catch (error) {
            console.warn('Could not add logo to footer:', error);
          }
        }
        
        // Add page number to bottom right
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
      };

      // Helper function to capture and add page
      const addPageToPDF = async (ref: React.RefObject<HTMLDivElement>, addNewPage = true) => {
        const element = ref.current;
        if (!element) return;

        // Create container for rendering
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '800px';
        document.body.appendChild(container);

        const clone = element.cloneNode(true) as HTMLDivElement;
        container.appendChild(clone);
        clone.style.display = 'block';

        // Capture page
        const canvas = await html2canvas(clone, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: 'white',
          logging: false,
        });

        // Add to PDF
        if (addNewPage) pdf.addPage();
        const imgData = canvas.toDataURL('image/png', 1.0);
        pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);

        // Cleanup
        document.body.removeChild(container);
      };

      // Add all pages
      await addPageToPDF(page1Ref, false); // Cover Page (logo is already in HTML rendering)
      await addPageToPDF(tocRef); // Table of Contents
      
      // Add AI-Generated Executive Summary (if provided) - RIGHT AFTER TOC
      console.log('🤖 AI Content Check in PDF Generation:');
      console.log('  - Executive Summary:', aiExecutiveSummary ? `${aiExecutiveSummary.length} chars` : 'NOT PROVIDED');
      console.log('  - SWOT Analysis:', aiSwotAnalysis ? `${aiSwotAnalysis.length} chars` : 'NOT PROVIDED');
      
      if (aiExecutiveSummary || aiSwotAnalysis) {
        console.log('✅ Adding AI Executive Summary to PDF (after TOC)...');
        const margin = 15;
        const pageWidth = 210;
        const pageHeight = 297;
        const contentWidth = pageWidth - (2 * margin);
        let currentPageNum = 3; // Executive Summary starts at page 3 (after Cover + TOC)
        
        // Helper function to parse and render markdown-style content
        const renderMarkdownContent = (content: string, startY: number, sectionTitle: string = ''): number => {
          const lines = content.split('\n');
          let yPos = startY;
          const maxY = 270;
          
          // Helper to add continuation header when creating new page
          const addContinuationHeader = () => {
            // Draw header line
            pdf.setDrawColor(16, 185, 129);
            pdf.setLineWidth(0.5);
            pdf.line(margin, margin + 10, pageWidth - margin, margin + 10);
            
            // Header text
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text(`${sectionTitle} (Continued)`, margin + 12, margin + 6);
            
            // Icon
            pdf.setFillColor(16, 185, 129);
            pdf.circle(margin + 5, margin + 4, 3, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(10);
            pdf.text('E', margin + 3, margin + 6);
            
            // Page number in header
            pdf.setFontSize(9);
            pdf.setTextColor(100, 116, 139);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Page ${currentPageNum} of ${totalPages}`, pageWidth - margin, margin + 6, { align: 'right' });
          };
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (!line) {
              yPos += 3;
              continue;
            }
            
            // Check if we need a new page
            if (yPos > maxY) {
              // Add footer with logo and page number to current page
              addFooter(currentPageNum, totalPages);
              
              // Add new page
              pdf.addPage();
              currentPageNum++;
              
              // Add continuation header if section title provided
              if (sectionTitle) {
                addContinuationHeader();
                yPos = margin + 20; // Start below the continuation header
              } else {
                yPos = margin + 10;
              }
            }
            
            // H1 Heading (# )
            if (line.startsWith('# ')) {
              yPos += 5;
              pdf.setFontSize(16);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(37, 99, 235);
              const text = line.replace(/^#\s+/, '').replace(/\*\*/g, '');
              pdf.text(text, margin, yPos);
              yPos += 8;
            }
            // H2 Heading (## )
            else if (line.startsWith('## ')) {
              yPos += 4;
              pdf.setFontSize(14);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(59, 130, 246);
              const text = line.replace(/^##\s+/, '').replace(/\*\*/g, '');
              pdf.text(text, margin, yPos);
              yPos += 7;
            }
            // H3 Heading (### )
            else if (line.startsWith('### ')) {
              yPos += 3;
              pdf.setFontSize(12);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(40, 40, 40);
              const text = line.replace(/^###\s+/, '').replace(/\*\*/g, '');
              pdf.text(text, margin, yPos);
              yPos += 6;
            }
            // H4 Heading (#### )
            else if (line.startsWith('#### ')) {
              yPos += 2;
              pdf.setFontSize(11);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(71, 85, 105);
              const text = line.replace(/^####\s+/, '').replace(/\*\*/g, '');
              pdf.text(text, margin, yPos);
              yPos += 5;
            }
            // Bullet list (-, *)
            else if (line.match(/^[-*]\s+/)) {
              const bulletText = line.replace(/^[-*]\s+/, '').replace(/\*\*(.+?)\*\*/g, '$1');
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'normal');
              pdf.setTextColor(40, 40, 40);
              
              // Add bullet point
              pdf.circle(margin + 2, yPos - 1.5, 0.8, 'F');
              
              // Wrap text
              const wrappedLines = pdf.splitTextToSize(bulletText, contentWidth - 6);
              for (let j = 0; j < wrappedLines.length; j++) {
                if (yPos > maxY) {
                  // Add footer with logo and page number
                  addFooter(currentPageNum, totalPages);
                  
                  // Add new page
                  pdf.addPage();
                  currentPageNum++;
                  
                  // Add continuation header if section title provided
                  if (sectionTitle) {
                    addContinuationHeader();
                    yPos = margin + 20;
                  } else {
                    yPos = margin + 10;
                  }
                  
                  pdf.setFontSize(10);
                  pdf.setTextColor(40, 40, 40);
                }
                pdf.text(wrappedLines[j], margin + 6, yPos);
                yPos += 5;
              }
            }
            // Section Headers (lines ending with colon - section titles)
            else if (line.match(/^[A-Z][\w\s\-&()]+:$/)) {
              yPos += 3;
              pdf.setFontSize(11);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(40, 40, 40);
              const text = line.replace(/\*\*/g, '');
              pdf.text(text, margin, yPos);
              yPos += 6;
            }
            // Regular paragraph with bold-italic parameter labels
            else {
              pdf.setFontSize(10);
              pdf.setTextColor(40, 40, 40);
              
              // List of parameter labels that should be bold+italic
              const parameterLabels = [
                'System Capacity:',
                'PV Modules:',
                'Inverters:',
                'Location:',
                'System Orientation:',
                'DC/AC Ratio:',
                'Total Project Cost:',
                'Net Investment:',
                'Internal Rate of Return (IRR):',
                'Net Present Value (NPV):',
                'Payback Period:',
                'Levelized Cost of Energy (LCOE):',
                'Confidence Level:',
                'Procurement and Installation Quality:',
                'Operations and Maintenance (O&M):',
                'Performance Monitoring:',
                'Grid Interconnection and Permitting:'
              ];
              
              // Check if line starts with any parameter label
              let hasParameterLabel = false;
              let labelText = '';
              let remainingText = line;
              
              for (const label of parameterLabels) {
                if (line.startsWith(label)) {
                  hasParameterLabel = true;
                  labelText = label;
                  remainingText = line.substring(label.length).trim();
                  break;
                }
              }
              
              if (hasParameterLabel) {
                // Render label in bold-italic, then remaining text in normal
                if (yPos > maxY) {
                  addFooter(currentPageNum, totalPages);
                  pdf.addPage();
                  currentPageNum++;
                  if (sectionTitle) {
                    addContinuationHeader();
                    yPos = margin + 20;
                  } else {
                    yPos = margin + 10;
                  }
                  pdf.setFontSize(10);
                  pdf.setTextColor(40, 40, 40);
                }
                
                // Render bold-italic label
                pdf.setFont('helvetica', 'bolditalic');
                pdf.text(labelText, margin, yPos);
                const labelWidth = pdf.getTextWidth(labelText);
                
                // Render remaining text in normal font
                pdf.setFont('helvetica', 'normal');
                const cleanText = remainingText.replace(/\*\*(.+?)\*\*/g, '$1');
                const wrappedLines = pdf.splitTextToSize(cleanText, contentWidth - labelWidth - 2);
                
                if (wrappedLines.length > 0) {
                  // First line continues on same line as label
                  pdf.text(wrappedLines[0], margin + labelWidth + 2, yPos);
                  yPos += 5;
                  
                  // Subsequent lines on new lines
                  for (let i = 1; i < wrappedLines.length; i++) {
                    if (yPos > maxY) {
                      addFooter(currentPageNum, totalPages);
                      pdf.addPage();
                      currentPageNum++;
                      if (sectionTitle) {
                        addContinuationHeader();
                        yPos = margin + 20;
                      } else {
                        yPos = margin + 10;
                      }
                      pdf.setFontSize(10);
                      pdf.setTextColor(40, 40, 40);
                    }
                    pdf.text(wrappedLines[i], margin, yPos);
                    yPos += 5;
                  }
                } else {
                  yPos += 5;
                }
                yPos += 2;
              } else {
                // Normal paragraph without parameter label
                pdf.setFont('helvetica', 'normal');
                const cleanText = line.replace(/\*\*(.+?)\*\*/g, '$1');
                const wrappedLines = pdf.splitTextToSize(cleanText, contentWidth);
                
                for (const wrappedLine of wrappedLines) {
                  if (yPos > maxY) {
                    addFooter(currentPageNum, totalPages);
                    pdf.addPage();
                    currentPageNum++;
                    if (sectionTitle) {
                      addContinuationHeader();
                      yPos = margin + 20;
                    } else {
                      yPos = margin + 10;
                    }
                    pdf.setFontSize(10);
                    pdf.setTextColor(40, 40, 40);
                  }
                  pdf.text(wrappedLine, margin, yPos, { align: 'justify', maxWidth: contentWidth });
                  yPos += 5;
                }
                yPos += 2;
              }
            }
          }
          
          // Add footer with logo and page number to last page
          addFooter(currentPageNum, totalPages);
          
          return yPos;
        };
        
        // Render Executive Summary (all AI content, ignoring SWOT separation)
        // Use whichever section has actual content
        let actualContent = aiExecutiveSummary || aiSwotAnalysis;
        
        if (actualContent) {
          // Strip the project metadata header section if present
          const lines = actualContent.split('\n');
          let startIndex = 0;
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip any lines that are part of the metadata section
            if (line.includes('Solar PV Project Report') || 
                line.includes('Report Date:') || 
                line.includes('Prepared By:') || 
                line.includes('Prepared For:') || 
                line.includes('Project Name:') || 
                line.includes('Project Location:') ||
                line.match(/^Report Date:/i) ||
                line.match(/^Prepared By:/i) ||
                line.match(/^Prepared For:/i) ||
                line.match(/^Project Name:/i) ||
                line.match(/^Project Location:/i) ||
                line.match(/^[-=_*]{3,}$/)) { // Skip separator lines
              continue;
            }
            
            // If we find the actual executive summary heading or content, start from there
            if (line.match(/^#+\s*(1\.)?\s*EXECUTIVE\s*SUMMARY/i)) {
              startIndex = i;
              break;
            }
            
            // If we find "This feasibility study" or similar opening text
            if (line.match(/^This\s+feasibility\s+study/i) || 
                line.match(/^This\s+report/i) ||
                line.match(/^The\s+project/i)) {
              startIndex = i;
              break;
            }
            
            // If we find "Key Technical Parameters" section
            if (line.match(/Key\s+Technical\s+Parameters/i)) {
              startIndex = i;
              break;
            }
            
            // If line has substantial content (not just metadata), might be start of content
            if (line.length > 50 && !line.includes(':')) {
              startIndex = i;
              break;
            }
          }
          
          // Reconstruct content without metadata
          if (startIndex < lines.length) {
            actualContent = lines.slice(startIndex).join('\n').trim();
          }
          
          console.log('📄 Executive Summary Metadata Stripping:');
          console.log('  - Started at line:', startIndex);
          console.log('  - Content preview (first 200 chars):', actualContent.substring(0, 200));
          
          pdf.addPage();
          
          // Header
          pdf.setDrawColor(16, 185, 129);
          pdf.setLineWidth(0.5);
          pdf.line(margin, margin + 10, pageWidth - margin, margin + 10);
          
          pdf.setFontSize(18);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text('Executive Summary', margin + 12, margin + 6);
          
          // Icon
          pdf.setFillColor(16, 185, 129);
          pdf.circle(margin + 5, margin + 4, 3, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.text('E', margin + 3, margin + 6);
          
          // Page number
          pdf.setFontSize(9);
          pdf.setTextColor(100, 116, 139);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Page ${currentPageNum} of ${totalPages}`, pageWidth - margin, margin + 6, { align: 'right' });
          
          // Render content without project metadata, pass section title for continuation headers
          renderMarkdownContent(actualContent, margin + 20, 'Executive Summary');
        }
      }
      
      await addPageToPDF(page2Ref); // Design Summary
      
      if (acConfiguration) {
        await addPageToPDF(page3Ref); // AC Configuration
        await addPageToPDF(page4Ref); // System Performance & Losses
        await addPageToPDF(page5Ref); // Production Results & Analysis
        await addPageToPDF(page6Ref); // Uncertainty Analysis
        await addPageToPDF(page7Ref); // 25-Year Generation Summary
        await addPageToPDF(page8Ref); // Layout & SLD
      } else {
        await addPageToPDF(page3Ref); // System Performance & Losses
        await addPageToPDF(page4Ref); // Production Results & Analysis
        await addPageToPDF(page5Ref); // Uncertainty Analysis
        await addPageToPDF(page6Ref); // 25-Year Generation Summary
        await addPageToPDF(page7Ref); // Layout & SLD
      }

      // Add Financial Analysis Pages (if financial data is provided)
      if (financialResults && financialParams) {
        const margin = 15;
        const pageWidth = 210;
        const pageHeight = 297;
        
        // Financial pages start after cover + TOC + AI pages + energy pages
        const financialPageStart = (aiExecutiveSummary || aiSwotAnalysis) 
          ? (acConfiguration ? (10 + aiPages) : (9 + aiPages))
          : (acConfiguration ? 10 : 9);
        
        // Page: Financial Analysis
        pdf.addPage();
        let yPos = margin;
        
        // Header with icon and border (matching existing format)
        pdf.setDrawColor(16, 185, 129);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPos + 10, pageWidth - margin, yPos + 10);
        
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0); // Black text
        pdf.text('Financial Analysis', margin + 12, yPos + 6);
        
        // Add dollar icon (simple representation)
        pdf.setFillColor(16, 185, 129);
        pdf.circle(margin + 5, yPos + 4, 3, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.text('$', margin + 3.5, yPos + 6);
        
        // Page number
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${financialPageStart} of ${totalPages}`, pageWidth - margin, yPos + 6, { align: 'right' });
        
        yPos += 18;
        
        // Investment Summary (first position)
        pdf.setFontSize(14);
        pdf.setTextColor(16, 185, 129);
        pdf.text('Investment Summary', margin, yPos);
        
        yPos += 8;
        
        const totalProjectCost = financialParams?.totalProjectCost || 0;
        const governmentSubsidy = financialParams?.governmentSubsidy || 0;
        const netInvestment = totalProjectCost - governmentSubsidy;
        const annualEnergyYear1 = financialParams?.annualEnergyYear1 || 0;
        const systemCapacity = systemParams?.capacity || 0;
        
        autoTable(pdf, {
          startY: yPos,
          head: [['Description', 'Amount (USD)']],
          body: [
            ['Total Project Cost', `$${totalProjectCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`],
            ['Government Subsidy/Incentives', `$${governmentSubsidy.toLocaleString('en-US', { maximumFractionDigits: 0 })}`],
            ['Net Investment', `$${netInvestment.toLocaleString('en-US', { maximumFractionDigits: 0 })}`],
            ['Cost per Watt ($/Wp)', systemCapacity > 0 ? `$${(totalProjectCost / (systemCapacity * 1000)).toFixed(2)}` : 'N/A'],
            ['Annual Energy (Year 1)', `${(annualEnergyYear1 / 1000).toFixed(2)} MWh`]
          ],
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
          margin: { left: margin, right: margin },
          columnStyles: { 1: { fontStyle: 'bold', halign: 'right' } }
        });
        
        yPos = (pdf as typeof pdf & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
        
        // Financial Assumptions
        if (yPos + 60 > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(16, 185, 129);
        pdf.text('Financial Assumptions', margin, yPos);
        
        yPos += 8;
        
        autoTable(pdf, {
          startY: yPos,
          head: [['Parameter', 'Value']],
          body: [
            ['Electricity Tariff (Year 1)', `$${(financialParams?.electricityRate || 0).toFixed(3)}/kWh`],
            ['Tariff Escalation Rate', `${financialParams?.tariffEscalationRate || 0}% per year`],
            ['O&M Expenses', `${financialParams?.omExpensesPercent || 0}% of project cost`],
            ['O&M Escalation Rate', `${financialParams?.omEscalationRate || 0}% per year`],
            ['Annual Degradation', `${financialParams?.annualDegradation || 0}%`],
            ['Discount Rate (WACC)', `${financialParams?.discountRate || 0}%`],
            ['Income Tax Rate', `${financialParams?.incomeTaxRate || 0}%`],
            ['Project Lifetime', '25 years']
          ],
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
          margin: { left: margin, right: margin }
        });
        
        yPos = (pdf as typeof pdf & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
        
        // Key Financial Metrics (third position)
        if (yPos + 60 > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(16, 185, 129);
        pdf.text('Key Financial Metrics', margin, yPos);
        
        yPos += 8;
        
        const irr = financialResults?.irr || 0;
        const npv = financialResults?.npv || 0;
        const lcoe = financialResults?.lcoe || 0;
        const simplePayback = financialResults?.simplePaybackPeriod || 0;
        const discountedPayback = financialResults?.discountedPaybackPeriod || 0;
        const averageROI = financialResults?.averageROI || 0;
        const discountRate = financialParams?.discountRate || 0;
        const electricityRate = financialParams?.electricityRate || 0;
        
        autoTable(pdf, {
          startY: yPos,
          head: [['Metric', 'Value', 'Status']],
          body: [
            ['Internal Rate of Return (IRR)', `${irr.toFixed(2)}%`, irr > discountRate ? 'Exceeds WACC' : 'Below WACC'],
            ['Net Present Value (NPV)', `$${npv.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, npv > 0 ? 'Positive' : 'Negative'],
            ['Levelized Cost of Energy (LCOE)', `$${lcoe.toFixed(3)}/kWh`, `vs $${electricityRate.toFixed(3)} tariff`],
            ['Simple Payback Period', `${simplePayback.toFixed(1)} years`, simplePayback < 10 ? 'Attractive' : 'Extended'],
            ['Discounted Payback Period', `${discountedPayback.toFixed(1)} years`, '-'],
            ['Average Annual ROI', `${averageROI.toFixed(2)}%`, '-']
          ],
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 10 },
          margin: { left: margin, right: margin },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 70 },
            1: { fontStyle: 'bold', textColor: [16, 185, 129], halign: 'right', cellWidth: 50 },
            2: { fontSize: 9, textColor: [100, 116, 139], halign: 'left', cellWidth: 60 }
          }
        });
        
        // Footer for Financial Analysis page
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Financial Analysis Report', pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        // Page: 25-Year Cash Flow
        pdf.addPage();
        yPos = margin;
        
        // Header with icon and border (matching existing format)
        pdf.setDrawColor(139, 92, 246);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPos + 10, pageWidth - margin, yPos + 10);
        
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0); // Black text
        pdf.text('25-Year Cash Flow Projection', margin + 12, yPos + 6);
        
        // Add trending up icon (simple arrow representation)
        pdf.setDrawColor(139, 92, 246);
        pdf.setLineWidth(1.5);
        // Upward arrow
        pdf.line(margin + 3, yPos + 7, margin + 7, yPos + 3);
        pdf.line(margin + 7, yPos + 3, margin + 7, yPos + 5);
        pdf.line(margin + 7, yPos + 3, margin + 9, yPos + 3);
        
        // Page number
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${financialPageStart + 1} of ${totalPages}`, pageWidth - margin, yPos + 6, { align: 'right' });
        
        yPos += 18;
        
        // Show all 25 years with all 9 columns
        const cashFlowData = financialResults.cashFlowTable.map(row => [
          row.year.toString(),
          `${row.energyGenerated.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          `$${row.electricityTariff.toFixed(3)}`,
          `$${(row.revenue / 1000).toFixed(0)}K`,
          `$${(row.omCost / 1000).toFixed(0)}K`,
          `$${(row.grossProfit / 1000).toFixed(0)}K`,
          `$${(row.tax / 1000).toFixed(0)}K`,
          `$${(row.netProfit / 1000).toFixed(0)}K`,
          `$${(row.cumulativeProfit / 1000).toFixed(0)}K`
        ]);
        
        autoTable(pdf, {
          startY: yPos,
          head: [['Year', 'Energy\n(kWh)', 'Tariff\n($/kWh)', 'Revenue\n($)', 'O&M Cost\n($)', 'Gross Profit\n($)', 'Tax\n($)', 'Net Profit\n($)', 'Cumulative\n($)']],
          body: cashFlowData,
          theme: 'grid',
          headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold', fontSize: 7, halign: 'center' },
          styles: { fontSize: 6, cellPadding: 1.5 },
          columnStyles: {
            0: { halign: 'center', fontStyle: 'bold', cellWidth: 15 },
            1: { halign: 'right', cellWidth: 20 },
            2: { halign: 'right', cellWidth: 18 },
            3: { halign: 'right', textColor: [16, 185, 129], cellWidth: 18 },
            4: { halign: 'right', textColor: [239, 68, 68], cellWidth: 18 },
            5: { halign: 'right', cellWidth: 20 },
            6: { halign: 'right', textColor: [245, 158, 11], cellWidth: 18 },
            7: { halign: 'right', textColor: [59, 130, 246], fontStyle: 'bold', cellWidth: 20 },
            8: { halign: 'right', fontStyle: 'bold', cellWidth: 23 }
          },
          margin: { left: margin, right: margin }
        });
        
        yPos = (pdf as typeof pdf & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
        
        // Add Financial Performance Overview table here (moved from next page)
        if (yPos + 40 > pageHeight - margin) {
          // Not enough space, keep on same page but note might overflow
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(139, 92, 246);
        pdf.setFont('helvetica', 'bold');
        pdf.text('25-Year Performance Summary', margin, yPos);
        
        yPos += 8;
        
        autoTable(pdf, {
          startY: yPos,
          head: [['Description', 'Amount (USD)']],
          body: [
            ['Total 25-Year Revenue', `$${(financialResults.totalRevenue25Years / 1000000).toFixed(2)}M`],
            ['Total 25-Year O&M Costs', `$${(financialResults.totalOMCosts25Years / 1000).toFixed(0)}K`],
            ['Total 25-Year Tax Paid', `$${(financialResults.totalTaxPaid25Years / 1000).toFixed(0)}K`],
            ['Total 25-Year Net Profit', `$${(financialResults.totalNetProfit25Years / 1000000).toFixed(2)}M`]
          ],
          theme: 'striped',
          headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
          margin: { left: margin, right: margin },
          columnStyles: { 1: { fontStyle: 'bold', halign: 'right', textColor: [16, 185, 129] } }
        });
        
        // Footer for Cash Flow page
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.setFont('helvetica', 'normal');
        pdf.text('25-Year Cash Flow Projection Report', pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        // NEW PAGE: Financial Performance Charts
        pdf.addPage();
        yPos = margin;
        
        // Header for charts page
        pdf.setDrawColor(139, 92, 246);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPos + 10, pageWidth - margin, yPos + 10);
        
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Financial Performance Charts', margin + 12, yPos + 6);
        
        // Add icon
        pdf.setDrawColor(139, 92, 246);
        pdf.setLineWidth(1.5);
        pdf.line(margin + 3, yPos + 7, margin + 7, yPos + 3);
        pdf.line(margin + 7, yPos + 3, margin + 7, yPos + 5);
        pdf.line(margin + 7, yPos + 3, margin + 9, yPos + 3);
        
        // Page number
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${financialPageStart + 2} of ${totalPages}`, pageWidth - margin, yPos + 6, { align: 'right' });
        
        yPos += 18;
        
        // Add Key Financial Metrics Cards
        pdf.setFontSize(14);
        pdf.setTextColor(139, 92, 246);
        pdf.text('Key Financial Metrics', margin, yPos);
        
        yPos += 10;
        
        // Create 4 metric cards in 2 rows
        const cardWidth = (pageWidth - 2 * margin - 10) / 2; // 2 cards per row with 10mm spacing
        const cardHeight = 30;
        const cardSpacing = 10;
        
        // Card 1: IRR
        pdf.setFillColor(240, 253, 244);
        pdf.roundedRect(margin, yPos, cardWidth, cardHeight, 3, 3, 'F');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.text('IRR', margin + 5, yPos + 8);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(16, 185, 129);
        pdf.text(`${financialResults.irr.toFixed(1)}%`, margin + 5, yPos + 20);
        
        // Card 2: NPV
        pdf.setFillColor(239, 246, 255);
        pdf.roundedRect(margin + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 3, 3, 'F');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont('helvetica', 'normal');
        pdf.text('NPV', margin + cardWidth + cardSpacing + 5, yPos + 8);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(59, 130, 246);
        pdf.text(`$${(financialResults.npv / 1000).toFixed(0)}K`, margin + cardWidth + cardSpacing + 5, yPos + 20);
        
        yPos += cardHeight + cardSpacing;
        
        // Card 3: LCOE
        pdf.setFillColor(254, 249, 231);
        pdf.roundedRect(margin, yPos, cardWidth, cardHeight, 3, 3, 'F');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont('helvetica', 'normal');
        pdf.text('LCOE', margin + 5, yPos + 8);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(245, 158, 11);
        pdf.text(`$${financialResults.lcoe.toFixed(3)}`, margin + 5, yPos + 20);
        
        // Card 4: Payback Period
        pdf.setFillColor(245, 243, 255);
        pdf.roundedRect(margin + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 3, 3, 'F');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Payback', margin + cardWidth + cardSpacing + 5, yPos + 8);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(139, 92, 246);
        pdf.text(`${financialResults.simplePaybackPeriod.toFixed(1)}y`, margin + cardWidth + cardSpacing + 5, yPos + 20);
        
        yPos += cardHeight + 15;
        
        // Project Details Section - 2 Column Layout
        pdf.setFillColor(239, 246, 255); // Light blue background
        pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'F');
        pdf.setDrawColor(191, 219, 254); // Blue border
        pdf.setLineWidth(0.5);
        pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'S');
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 58, 138); // Dark blue
        
        const detailsMargin = margin + 5;
        const columnWidth = (pageWidth - 2 * margin - 10) / 2;
        let detailY = yPos + 8;
        
        // Column 1
        pdf.text('Report Date:', detailsMargin, detailY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(55, 65, 81); // Gray
        pdf.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }), detailsMargin + 32, detailY);
        
        // Column 2
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 58, 138);
        pdf.text('Prepared By:', detailsMargin + columnWidth, detailY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(55, 65, 81);
        pdf.text(companyInfo?.authorName || companyInfo?.companyName || 'N/A', detailsMargin + columnWidth + 32, detailY);
        
        detailY += 7;
        
        // Column 1
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 58, 138);
        pdf.text('Prepared For:', detailsMargin, detailY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(55, 65, 81);
        pdf.text(clientInfo?.clientName || clientInfo?.clientCompany || 'Internal Use', detailsMargin + 32, detailY);
        
        // Column 2
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 58, 138);
        pdf.text('Project Name:', detailsMargin + columnWidth, detailY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(55, 65, 81);
        pdf.text(projectInfo?.projectName || 'Solar PV Project', detailsMargin + columnWidth + 32, detailY);
        
        detailY += 7;
        
        // Full width for location
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 58, 138);
        pdf.text('Project Location:', detailsMargin, detailY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(55, 65, 81);
        const locationText = projectInfo?.siteAddress || `${systemParams.latitude.toFixed(4)}°N, ${systemParams.longitude.toFixed(4)}°W`;
        pdf.text(locationText, detailsMargin + 38, detailY);
        
        yPos += 45;
        
        // Chart 1: Annual Cash Flow Components (full width, stacked vertically)
        const chartWidth = pageWidth - 2 * margin;
        const chartHeight = 75;
        
        const chart1X = margin;
        const chart1Y = yPos;
        
        // Title
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Annual Cash Flow Components', chart1X + 2, chart1Y + 5);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        pdf.text('Revenue, Costs & Profit breakdown', chart1X + 2, chart1Y + 10);
        
        // Draw bar chart for selected years (1, 6, 11, 16, 21, 25)
        const selectedYears = [0, 5, 10, 15, 20, 24]; // indices for years 1, 6, 11, 16, 21, 25
        const barChartY = chart1Y + 15;
        const barChartHeight = 45;
        const barGroupWidth = (chartWidth - 20) / selectedYears.length;
        const barWidth = barGroupWidth / 4; // 3 bars + 1 space
        
        // Find max value for scaling
        const allValues = selectedYears.flatMap(idx => {
          const row = financialResults.cashFlowTable[idx];
          return [row.revenue, row.omCost, row.netProfit];
        });
        const maxValue = Math.max(...allValues);
        const scale = barChartHeight / (maxValue * 1.1);
        
        selectedYears.forEach((yearIndex, i) => {
          const row = financialResults.cashFlowTable[yearIndex];
          const groupX = chart1X + 10 + i * barGroupWidth;
          
          // Revenue bar (green)
          const revenueHeight = row.revenue * scale;
          pdf.setFillColor(16, 185, 129);
          pdf.rect(groupX, barChartY + barChartHeight - revenueHeight, barWidth, revenueHeight, 'F');
          
          // O&M bar (red)
          const omHeight = row.omCost * scale;
          pdf.setFillColor(239, 68, 68);
          pdf.rect(groupX + barWidth, barChartY + barChartHeight - omHeight, barWidth, omHeight, 'F');
          
          // Net Profit bar (blue)
          const profitHeight = row.netProfit * scale;
          pdf.setFillColor(59, 130, 246);
          pdf.rect(groupX + barWidth * 2, barChartY + barChartHeight - profitHeight, barWidth, profitHeight, 'F');
          
          // Year label
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 116, 139);
          pdf.text(`${row.year}`, groupX + barWidth * 1.5, barChartY + barChartHeight + 5, { align: 'center' });
        });
        
        // Legend (centered)
        const legendY = barChartY + barChartHeight + 10;
        const legendStartX = pageWidth / 2 - 40;
        
        pdf.setFillColor(16, 185, 129);
        pdf.rect(legendStartX, legendY, 4, 4, 'F');
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(60, 60, 60);
        pdf.text('Revenue', legendStartX + 6, legendY + 3);
        
        pdf.setFillColor(239, 68, 68);
        pdf.rect(legendStartX + 28, legendY, 4, 4, 'F');
        pdf.text('O&M Cost', legendStartX + 34, legendY + 3);
        
        pdf.setFillColor(59, 130, 246);
        pdf.rect(legendStartX + 58, legendY, 4, 4, 'F');
        pdf.text('Net Profit', legendStartX + 64, legendY + 3);
        
        // Chart 2: Payback Analysis (full width, positioned below chart 1)
        yPos = chart1Y + chartHeight + 5;
        const chart2X = margin;
        const chart2Y = yPos;
        
        // Title
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Payback Analysis', chart2X + 2, chart2Y + 5);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        pdf.text('Cumulative profit (simple & discounted)', chart2X + 2, chart2Y + 10);
        
        // Draw line chart with better formatting
        const lineChartY = chart2Y + 15;
        const lineChartHeight = 45;
        const lineChartWidth = chartWidth - 20;
        const lineChartX = chart2X + 10;
        
        // Draw axes
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.5);
        pdf.line(lineChartX, lineChartY, lineChartX, lineChartY + lineChartHeight); // Y-axis
        pdf.line(lineChartX, lineChartY + lineChartHeight, lineChartX + lineChartWidth, lineChartY + lineChartHeight); // X-axis
        
        // Draw horizontal grid lines
        pdf.setDrawColor(240, 240, 240);
        pdf.setLineWidth(0.2);
        for (let i = 1; i <= 4; i++) {
          const gridY = lineChartY + (lineChartHeight / 4) * i;
          pdf.line(lineChartX, gridY, lineChartX + lineChartWidth, gridY);
        }
        
        // Plot all 25 years for smoother lines
        const plotYears = financialResults.cashFlowTable.map((_, idx) => idx);
        const xStep = lineChartWidth / (plotYears.length - 1);
        
        // Find min and max for scaling (including cumulative NPV for discounted payback)
        const cumulativeValues = financialResults.cashFlowTable.map(r => r.cumulativeProfit);
        const cumulativeNPVs = financialResults.cashFlowTable.map(r => r.cumulativeNPV);
        const allCumulativeValues = [...cumulativeValues, ...cumulativeNPVs];
        const minProfit = Math.min(...allCumulativeValues);
        const maxProfit = Math.max(...allCumulativeValues);
        const range = maxProfit - minProfit;
        
        // Draw simple payback line (teal/green) - smooth continuous line
        pdf.setDrawColor(16, 185, 129);
        pdf.setLineWidth(2);
        plotYears.forEach((yearIndex, i) => {
          if (i < plotYears.length - 1) {
            const y1 = lineChartY + lineChartHeight - ((financialResults.cashFlowTable[yearIndex].cumulativeProfit - minProfit) / range) * lineChartHeight;
            const y2 = lineChartY + lineChartHeight - ((financialResults.cashFlowTable[yearIndex + 1].cumulativeProfit - minProfit) / range) * lineChartHeight;
            pdf.line(lineChartX + i * xStep, y1, lineChartX + (i + 1) * xStep, y2);
          }
        });
        
        // Draw discounted payback line (blue) - using cumulative NPV
        pdf.setDrawColor(59, 130, 246);
        pdf.setLineWidth(2);
        plotYears.forEach((yearIndex, i) => {
          if (i < plotYears.length - 1) {
            const y1 = lineChartY + lineChartHeight - ((financialResults.cashFlowTable[yearIndex].cumulativeNPV - minProfit) / range) * lineChartHeight;
            const y2 = lineChartY + lineChartHeight - ((financialResults.cashFlowTable[yearIndex + 1].cumulativeNPV - minProfit) / range) * lineChartHeight;
            pdf.line(lineChartX + i * xStep, y1, lineChartX + (i + 1) * xStep, y2);
          }
        });
        
        // X-axis labels (show every 5 years and year 25)
        const labelYears = [0, 4, 9, 14, 19, 24];
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        labelYears.forEach((yearIndex) => {
          pdf.text(`${financialResults.cashFlowTable[yearIndex].year}`, lineChartX + yearIndex * xStep, lineChartY + lineChartHeight + 5, { align: 'center' });
        });
        
        // Legend (centered)
        const legend2Y = lineChartY + lineChartHeight + 10;
        const legend2StartX = pageWidth / 2 - 50;
        
        pdf.setDrawColor(16, 185, 129);
        pdf.setLineWidth(2);
        pdf.line(legend2StartX, legend2Y + 2, legend2StartX + 10, legend2Y + 2);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(60, 60, 60);
        pdf.text('Simple Payback', legend2StartX + 13, legend2Y + 3.5);
        
        pdf.setDrawColor(59, 130, 246);
        pdf.setLineWidth(2);
        pdf.line(legend2StartX + 55, legend2Y + 2, legend2StartX + 65, legend2Y + 2);
        pdf.text('Discounted Payback', legend2StartX + 68, legend2Y + 3.5);
        
        // Footer for Financial Performance Charts page
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Financial Performance Charts', pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        // Page: Viability Assessment
        pdf.addPage();
        yPos = margin;
        
        // Header with icon and border (matching existing format)
        pdf.setDrawColor(37, 99, 235);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPos + 10, pageWidth - margin, yPos + 10);
        
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0); // Black text
        pdf.text('Project Viability Assessment', margin + 12, yPos + 6);
        
        // Add checkmark icon (simple representation)
        pdf.setDrawColor(37, 99, 235);
        pdf.setLineWidth(2);
        // Checkmark
        pdf.line(margin + 3, yPos + 5, margin + 5, yPos + 7);
        pdf.line(margin + 5, yPos + 7, margin + 9, yPos + 2);
        
        // Page number
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${financialPageStart + 3} of ${totalPages}`, pageWidth - margin, yPos + 6, { align: 'right' });
        
        yPos += 18;
        
        // Recommendation
        const irrAcceptable = financialResults.irr > financialParams.discountRate;
        const npvPositive = financialResults.npv > 0;
        const paybackReasonable = financialResults.simplePaybackPeriod > 0 && financialResults.simplePaybackPeriod < 10;
        
        let recommendation = '';
        let recommendationBg: [number, number, number] = [0, 0, 0];
        
        if (irrAcceptable && npvPositive && paybackReasonable) {
          recommendation = '✓ HIGHLY RECOMMENDED';
          recommendationBg = [16, 185, 129];
        } else if ((irrAcceptable && npvPositive) || paybackReasonable) {
          recommendation = '⚠ RECOMMENDED WITH CONSIDERATIONS';
          recommendationBg = [245, 158, 11];
        } else {
          recommendation = '⚡ REQUIRES FURTHER EVALUATION';
          recommendationBg = [239, 68, 68];
        }
        
        pdf.setFillColor(...recommendationBg);
        pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 3, 3, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        // Center-aligned text with proper vertical centering
        pdf.text(recommendation, pageWidth / 2, yPos + 15.5, { align: 'center' });
        
        yPos += 40;
        
        // Key Strengths
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(16, 185, 129);
        pdf.text('Key Project Strengths', margin, yPos);
        
        yPos += 10;
        
        pdf.setFontSize(11.5);
        pdf.setFont('helvetica', 'normal');
        const strengths = [];
        if (irrAcceptable) strengths.push(`IRR of ${financialResults.irr.toFixed(2)}% exceeds discount rate of ${financialParams.discountRate}%`);
        if (npvPositive) strengths.push(`Positive NPV of $${(financialResults.npv / 1000).toFixed(0)}K demonstrates strong value creation`);
        if (paybackReasonable) strengths.push(`Attractive payback period of ${financialResults.simplePaybackPeriod.toFixed(1)} years ensures quick capital recovery`);
        strengths.push(`Strong 25-year net profit projection of $${(financialResults.totalNetProfit25Years / 1000000).toFixed(2)}M`);
        
        const bulletSpacing = 7;
        strengths.forEach((strength, index) => {
          // Draw bullet point
          pdf.setFillColor(16, 185, 129);
          pdf.circle(margin + 3, yPos + 3, 1.5, 'F');
          
          // Draw text with proper wrapping
          pdf.setTextColor(40, 40, 40);
          const wrappedText = pdf.splitTextToSize(strength, pageWidth - 2 * margin - 15);
          pdf.text(wrappedText, margin + 8, yPos + 4);
          
          yPos += wrappedText.length * 5.5 + bulletSpacing;
        });
        
        yPos += 5;
        
        // Assessment Summary
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(37, 99, 235);
        pdf.text('Assessment Summary', margin, yPos);
        
        yPos += 10;
        
        pdf.setFontSize(9.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(40, 40, 40);
        
        const summaryText = `This comprehensive feasibility study evaluates a ${systemParams.capacity.toFixed(1)} kWp solar photovoltaic system designed to generate ${(financialParams.annualEnergyYear1 / 1000).toFixed(2)} MWh of clean electricity annually. The project demonstrates strong financial viability with an Internal Rate of Return (IRR) of ${financialResults.irr.toFixed(2)}%, significantly exceeding the weighted average cost of capital of ${financialParams.discountRate}%. The investment generates a positive Net Present Value of $${(financialResults.npv / 1000).toFixed(0)}K, indicating substantial value creation for stakeholders.

Over the 25-year operational lifetime, the system is projected to generate cumulative revenues of $${(financialResults.totalRevenue25Years / 1000000).toFixed(2)}M against total operating and maintenance expenses of $${(financialResults.totalOMCosts25Years / 1000).toFixed(0)}K, resulting in a net profit of $${(financialResults.totalNetProfit25Years / 1000000).toFixed(2)}M. The Levelized Cost of Energy (LCOE) is calculated at $${financialResults.lcoe.toFixed(3)}/kWh, which compares favorably against the electricity tariff of $${financialParams.electricityRate.toFixed(3)}/kWh, ensuring long-term economic competitiveness.

The project achieves capital payback within ${financialResults.simplePaybackPeriod.toFixed(1)} years and delivers an average annual Return on Investment of ${financialResults.averageROI.toFixed(2)}%. These metrics, combined with the proven technology and favorable regulatory environment, position this solar PV investment as an attractive opportunity for sustainable energy generation and financial returns.`;
        
        const splitText = pdf.splitTextToSize(summaryText, pageWidth - 2 * margin - 4);
        pdf.text(splitText, margin + 2, yPos);
        
        yPos += splitText.length * 5 + 10;
        
        // Footer for Viability Assessment page
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Project Viability Assessment Report', pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        // Disclaimer
        pdf.setFillColor(239, 246, 255);  // Light blue background
        pdf.setDrawColor(59, 130, 246);    // Blue border
        pdf.setLineWidth(0.5);
        pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 28, 2, 2, 'FD');
        
        pdf.setFontSize(8);
        pdf.setTextColor(30, 64, 175);     // Dark blue text
        pdf.setFont('helvetica', 'bold');
        pdf.text('Please Note', margin + 5, yPos + 6);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        const disclaimerText = 'This feasibility study is based on assumptions and projections. Actual results may vary due to weather, equipment performance, and market conditions. Please conduct further due diligence before making investment decisions.';
        const splitDisclaimer = pdf.splitTextToSize(disclaimerText, pageWidth - 2 * margin - 10);
        pdf.text(splitDisclaimer, margin + 5, yPos + 12);
      }

      // Add BOQ Annexure - if BOQ data is provided
      if (boqData && boqData.length > 0) {
        const margin = 15;
        const pageWidth = 210;
        const pageHeight = 297;
        const boqStartPage = totalPages - boqPages + 1;
        
        // Add new page for BOQ
        pdf.addPage();
        
        // Header for BOQ Annexure
        const headerStartY = margin;
        
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(37, 99, 235);
        pdf.text('Annexure-1', pageWidth / 2, headerStartY + 5, { align: 'center' });
        
        pdf.setFontSize(14);
        pdf.setTextColor(40, 40, 40);
        pdf.text('Bill of Quantities (BOQ)', pageWidth / 2, headerStartY + 13, { align: 'center' });
        
        // Draw separator line
        pdf.setDrawColor(37, 99, 235);
        pdf.setLineWidth(0.6);
        pdf.line(margin, headerStartY + 18, pageWidth - margin, headerStartY + 18);
        
        // Prepare table data
        const tableData = boqData.map(item => [
          item.slNo.toString(),
          item.description,
          item.specifications,
          item.unit,
          typeof item.qty === 'number' ? item.qty.toString() : item.qty
        ]);
        
        // Generate table using autoTable
        autoTable(pdf, {
          head: [['Sl. No.', 'Description', 'Specification', 'Unit', 'Qty']],
          body: tableData,
          startY: headerStartY + 24,
          theme: 'grid',
          headStyles: {
            fillColor: [37, 99, 235],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10,
            halign: 'center',
            valign: 'middle',
            cellPadding: 3
          },
          bodyStyles: {
            fontSize: 9,
            textColor: [40, 40, 40],
            cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
            valign: 'middle',
            overflow: 'linebreak',
            lineWidth: 0.1,
            minCellHeight: 10
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 15, valign: 'middle' }, // Sl. No.
            1: { halign: 'left', cellWidth: 60, valign: 'middle', overflow: 'linebreak' },   // Description
            2: { halign: 'left', cellWidth: 70, valign: 'middle', overflow: 'linebreak' },   // Specification
            3: { halign: 'center', cellWidth: 20, valign: 'middle' }, // Unit
            4: { halign: 'center', cellWidth: 20, valign: 'middle' }  // Qty
          },
          alternateRowStyles: {
            fillColor: [245, 247, 250]
          },
          margin: { left: margin, right: margin, top: 30 }, // Extra top margin for continuation header
          didDrawPage: (data) => {
            // Calculate current page based on BOQ start page and autoTable page number
            const currentPage = boqStartPage + data.pageNumber - 1;
            
            // Add continuation header on pages after first
            if (data.pageNumber > 1) {
              const headerY = 18;
              
              // Header text
              pdf.setFontSize(11);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(37, 99, 235);
              pdf.text('Annexure-1: Bill of Quantities (BOQ) - Continued', pageWidth / 2, headerY, { align: 'center' });
              
              // Separator line
              pdf.setDrawColor(37, 99, 235);
              pdf.setLineWidth(0.5);
              pdf.line(margin, headerY + 3, pageWidth - margin, headerY + 3);
            }
            
            // Add page numbers to all BOQ pages
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 116, 139);
            pdf.text(
              `Page ${currentPage} of ${totalPages}`,
              pageWidth - margin,
              pageHeight - 10,
              { align: 'right' }
            );
          }
        });
      }

      // Save PDF
      const timestamp = new Date().toISOString().split('T')[0];
      const reportType = financialResults ? 'Techno-Commercial' : 'Solar-PV-System';
      pdf.save(`${reportType}-Report-${totalCapacity}kW-${timestamp}.pdf`);

      toast.success("PDF Generated Successfully!", { 
        description: "Your comprehensive solar report has been downloaded" 
      });

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF", { 
        description: "There was an error creating the report. Please try again." 
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="w-full">
      {/* Hidden charts for capture */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
        <div ref={monthlyChartRef} style={{ width: '800px', height: '400px' }}>
          <Bar 
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              datasets: [
                {
                  label: '⚡ Monthly Energy Production',
                  data: monthlyProduction,
                  backgroundColor: 'rgba(34, 197, 94, 0.8)',
                  borderColor: 'rgb(34, 197, 94)',
                  borderWidth: 2,
                  borderRadius: 8,
                  borderSkipped: false,
                  hoverBackgroundColor: 'rgba(34, 197, 94, 0.9)',
                  hoverBorderColor: 'rgb(34, 197, 94)',
                  hoverBorderWidth: 3,
                  type: 'bar' as const,
                  yAxisID: 'y'
                },
                                {
                  label: '☀️ Solar Irradiation',
                  data: monthlyIrradiation,
                  backgroundColor: 'rgba(251, 146, 60, 0.6)',
                  borderColor: 'rgb(251, 146, 60)',
                  borderWidth: 2,
                  borderRadius: 4,
                  borderSkipped: false,
                  hoverBackgroundColor: 'rgba(251, 146, 60, 0.8)',
                  hoverBorderColor: 'rgb(251, 146, 60)',
                  hoverBorderWidth: 3,
                  yAxisID: 'y1'
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top' as const,
                  labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: {
                      size: 12,
                      weight: 'bold'
                    }
                  }
                },
                title: {
                  display: true,
                  text: '📊 Monthly Energy Production & Solar Irradiation',
                  font: {
                    size: 16,
                    weight: 'bold'
                  },
                  color: '#1f2937',
                  padding: 20
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Energy (kWh)',
                    font: {
                      size: 12,
                      weight: 'bold'
                    },
                    color: '#374151'
                  },
                  grid: {
                    color: 'rgba(0,0,0,0.1)',
                    lineWidth: 1
                  },
                  ticks: {
                    color: '#6b7280',
                    font: {
                      size: 10
                    }
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Month',
                    font: {
                      size: 12,
                      weight: 'bold'
                    },
                    color: '#374151'
                  },
                  grid: {
                    color: 'rgba(0,0,0,0.1)',
                    lineWidth: 1
                  },
                  ticks: {
                    color: '#6b7280',
                    font: {
                      size: 10
                    }
                  }
                },
                y1: {
                  beginAtZero: true,
                  position: 'right' as const,
                  title: {
                    display: true,
                    text: 'Irradiation (kWh/m²)',
                    font: {
                      size: 12,
                      weight: 'bold'
                    },
                    color: '#374151'
                  },
                  grid: {
                    drawOnChartArea: false,
                  },
                  ticks: {
                    color: '#6b7280',
                    font: {
                      size: 10
                    }
                  },
                  border: {
                    display: false
                  }
                }
              }
            }}
          />
        </div>
        
        <div ref={probabilityChartRef} style={{ width: '800px', height: '400px' }}>
          <Line 
            data={{
              labels: Array.from({length: 21}, (_, i) => `${(annualProduction * (0.8 + i * 0.02)).toFixed(0)}`),
              datasets: [
                {
                  label: 'Probability Density',
                  data: Array.from({length: 21}, (_, i) => {
                    const x = 0.8 + i * 0.02;
                    const mean = 1.0;
                    const stdDev = 0.05;
                    return Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2)) / (stdDev * Math.sqrt(2 * Math.PI));
                  }),
                  borderColor: 'rgb(251, 146, 60)',
                  backgroundColor: 'rgba(251, 146, 60, 0.1)',
                  borderWidth: 3,
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: 'rgb(251, 146, 60)',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2,
                  pointRadius: 0,
                },
                {
                  label: `P50 - ${annualProduction.toFixed(0)} kWh`,
                  data: Array.from({length: 21}, (_, i) => {
                    // Create a vertical line at P50 (index 10)
                    if (i === 10) {
                      const mean = 1.0;
                      const stdDev = 0.05;
                      return Math.exp(-0.5 * Math.pow((mean - mean) / stdDev, 2)) / (stdDev * Math.sqrt(2 * Math.PI));
                    }
                    return null;
                  }),
                  borderColor: 'rgb(37, 99, 235)',
                  backgroundColor: 'rgb(37, 99, 235)',
                  borderWidth: 0,
                  pointBackgroundColor: 'rgb(37, 99, 235)',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2,
                  pointRadius: 6,
                  pointHoverRadius: 8,
                  showLine: false,
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top' as const,
                  labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: {
                      size: 12,
                      weight: 'bold'
                    }
                  }
                },
                title: {
                  display: true,
                  text: 'Annual Production Probability Distribution',
                  font: {
                    size: 14,
                    weight: 'bold'
                  },
                  color: '#374151',
                  padding: 20
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
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
                    color: 'rgba(0,0,0,0.1)',
                    lineWidth: 1
                  },
                  ticks: {
                    color: '#6b7280',
                    font: {
                      size: 10
                    }
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Annual Production (kWh)',
                    font: {
                      size: 12,
                      weight: 'bold'
                    },
                    color: '#374151'
                  },
                  grid: {
                    color: 'rgba(0,0,0,0.1)',
                    lineWidth: 1
                  },
                  ticks: {
                    color: '#6b7280',
                    font: {
                      size: 10
                    }
                  }
                }
              }
            }}
          />
        </div>
      </div>

      <Button 
        onClick={generatePDF} 
        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white gap-2"
        disabled={generating}
      >
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating Report...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            Generate Final Report
          </>
        )}
      </Button>

      {/* Hidden PDF Templates */}
      <div className="hidden">
        
        {/* Page 1 - Cover Page */}
        <div 
          ref={page1Ref} 
          className="bg-white p-8" 
          style={{ width: "800px", height: "1123px", position: "relative" }}
        >
          {/* Header & Footer */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-600 to-blue-800"></div>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-r from-blue-600 to-blue-800"></div>
          
          {/* Main Content */}
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-8">
              {/* Company Logo or Default Solar Icon */}
              {companyInfo?.companyLogo ? (
                <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                  <img 
                    src={companyInfo.companyLogo} 
                    alt="Company Logo" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Sun className="h-20 w-20 text-white" />
                </div>
              )}
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Solar PV System Report</h1>
              <h2 className="text-2xl text-blue-600 mb-6">Comprehensive Design & Analysis</h2>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Project Overview</h3>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <span className="font-medium text-gray-600">System Capacity:</span>
                  <div className="text-2xl font-bold text-blue-600">{totalCapacity.toFixed(1)} kWp</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Annual Production:</span>
                  <div className="text-2xl font-bold text-green-600">{formatNumber(annualProduction)} kWh</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Total Modules:</span>
                  <div className="text-lg font-semibold text-gray-800">{totalModules}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">System Type:</span>
                  <div className="text-lg font-semibold text-gray-800">{getSystemStructureTypes()}</div>
                </div>
              </div>
            </div>

            {/* Financial Metrics Cards - Only show if financial data is available */}
            {financialResults && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Key Financial Metrics</h3>
                <div className="grid grid-cols-4 gap-4">
                  {/* IRR Card */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-lg border border-emerald-200 shadow-sm">
                    <div className="text-xs font-medium text-emerald-700 mb-2 uppercase tracking-wide">IRR</div>
                    <div className="text-3xl font-bold text-emerald-600 mb-1">
                      {financialResults.irr.toFixed(1)}%
                    </div>
                    <div className="text-xs text-emerald-600">Internal Rate of Return</div>
                  </div>

                  {/* NPV Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200 shadow-sm">
                    <div className="text-xs font-medium text-blue-700 mb-2 uppercase tracking-wide">NPV</div>
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      ${(financialResults.npv / 1000).toFixed(0)}K
                    </div>
                    <div className="text-xs text-blue-600">Net Present Value</div>
                  </div>

                  {/* LCOE Card */}
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-lg border border-amber-200 shadow-sm">
                    <div className="text-xs font-medium text-amber-700 mb-2 uppercase tracking-wide">LCOE</div>
                    <div className="text-3xl font-bold text-amber-600 mb-1">
                      ${financialResults.lcoe.toFixed(3)}
                    </div>
                    <div className="text-xs text-amber-600">Cost per kWh</div>
                  </div>

                  {/* Payback Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-lg border border-purple-200 shadow-sm">
                    <div className="text-xs font-medium text-purple-700 mb-2 uppercase tracking-wide">Payback</div>
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      {financialResults.simplePaybackPeriod.toFixed(1)}y
                    </div>
                    <div className="text-xs text-purple-600">Simple Payback Period</div>
                  </div>
                </div>
              </div>
            )}

            {/* Project Details Section - 2 Column Layout */}
            <div className="mt-6 mb-4">
              <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div>
                    <span className="font-semibold text-blue-900">Report Date:</span>
                    <span className="ml-2 text-gray-700">
                      {new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-900">Prepared By:</span>
                    <span className="ml-2 text-gray-700">{companyInfo?.authorName || companyInfo?.companyName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-900">Prepared For:</span>
                    <span className="ml-2 text-gray-700">
                      {clientInfo?.clientName || clientInfo?.clientCompany || 'Internal Use'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-900">Project Name:</span>
                    <span className="ml-2 text-gray-700">{projectInfo?.projectName || 'Solar PV Project'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold text-blue-900">Project Location:</span>
                    <span className="ml-2 text-gray-700">
                      {projectInfo?.siteAddress || `${systemParams.latitude.toFixed(4)}°N, ${systemParams.longitude.toFixed(4)}°W`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-gray-600 text-sm text-center">
              <p>Generated on {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>
        </div>

        {/* Page 2 - Table of Contents */}
        <div 
          ref={tocRef} 
          className="bg-white p-8" 
          style={{ width: "800px", height: "1123px", position: "relative" }}
        >
          {/* Header & Footer */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-r from-blue-600 to-blue-800"></div>
          
          {/* Content */}
          <div className="pt-16">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 pb-4 border-b-2 border-blue-500">Table of Contents</h1>
            
            <div className="space-y-3">
              {/* Cover Page */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200 hover:bg-blue-50 px-3 rounded">
                <span className="text-gray-700">Cover Page</span>
                <span className="text-blue-600 font-semibold">1</span>
              </div>
              
              {/* TOC itself */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200 hover:bg-blue-50 px-3 rounded">
                <span className="text-gray-700">Table of Contents</span>
                <span className="text-blue-600 font-semibold">2</span>
              </div>
              
              {/* Executive Summary - only if AI content exists */}
              {(aiExecutiveSummary || aiSwotAnalysis) && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 hover:bg-blue-50 px-3 rounded">
                  <span className="text-gray-700">Executive Summary</span>
                  <span className="text-blue-600 font-semibold">3</span>
                </div>
              )}
              
              {/* Design Summary */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200 hover:bg-blue-50 px-3 rounded">
                <span className="text-gray-700">Design Summary</span>
                <span className="text-blue-600 font-semibold">{(aiExecutiveSummary || aiSwotAnalysis) ? (3 + aiPages) : 3}</span>
              </div>
              
              {/* AC Configuration - only if acConfiguration exists */}
              {acConfiguration && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 hover:bg-blue-50 px-3 rounded">
                  <span className="text-gray-700">AC System Configuration</span>
                  <span className="text-blue-600 font-semibold">{(aiExecutiveSummary || aiSwotAnalysis) ? (4 + aiPages) : 4}</span>
                </div>
              )}
              
              {/* System Performance & Losses */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200 hover:bg-blue-50 px-3 rounded">
                <span className="text-gray-700">System Performance & Losses</span>
                <span className="text-blue-600 font-semibold">{
                  (aiExecutiveSummary || aiSwotAnalysis) 
                    ? (acConfiguration ? (5 + aiPages) : (4 + aiPages)) 
                    : (acConfiguration ? 5 : 4)
                }</span>
              </div>
              
              {/* Production Results */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200 hover:bg-blue-50 px-3 rounded">
                <span className="text-gray-700">Production Results & Analysis</span>
                <span className="text-blue-600 font-semibold">{
                  (aiExecutiveSummary || aiSwotAnalysis) 
                    ? (acConfiguration ? (6 + aiPages) : (5 + aiPages)) 
                    : (acConfiguration ? 6 : 5)
                }</span>
              </div>
              
              {/* Uncertainty Analysis */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200 hover:bg-blue-50 px-3 rounded">
                <span className="text-gray-700">Uncertainty Analysis</span>
                <span className="text-blue-600 font-semibold">{
                  (aiExecutiveSummary || aiSwotAnalysis) 
                    ? (acConfiguration ? (7 + aiPages) : (6 + aiPages)) 
                    : (acConfiguration ? 7 : 6)
                }</span>
              </div>
              
              {/* 25-Year Generation */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200 hover:bg-blue-50 px-3 rounded">
                <span className="text-gray-700">25-Year Generation Summary</span>
                <span className="text-blue-600 font-semibold">{
                  (aiExecutiveSummary || aiSwotAnalysis) 
                    ? (acConfiguration ? (8 + aiPages) : (7 + aiPages)) 
                    : (acConfiguration ? 8 : 7)
                }</span>
              </div>
              
              {/* Layout & SLD */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200 hover:bg-blue-50 px-3 rounded">
                <span className="text-gray-700">System Layout & Electrical Schematic</span>
                <span className="text-blue-600 font-semibold">{
                  (aiExecutiveSummary || aiSwotAnalysis) 
                    ? (acConfiguration ? (9 + aiPages) : (8 + aiPages)) 
                    : (acConfiguration ? 9 : 8)
                }</span>
              </div>
              
              {/* Financial Pages - only if financial data exists */}
              {financialResults && financialParams && (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 hover:bg-blue-50 px-3 rounded">
                    <span className="text-gray-700">Financial Analysis</span>
                    <span className="text-blue-600 font-semibold">{
                      (aiExecutiveSummary || aiSwotAnalysis) 
                        ? (acConfiguration ? (10 + aiPages) : (9 + aiPages)) 
                        : (acConfiguration ? 10 : 9)
                    }</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 hover:bg-blue-50 px-3 rounded">
                    <span className="text-gray-700">25-Year Cash Flow Projection</span>
                    <span className="text-blue-600 font-semibold">{
                      (aiExecutiveSummary || aiSwotAnalysis) 
                        ? (acConfiguration ? (11 + aiPages) : (10 + aiPages)) 
                        : (acConfiguration ? 11 : 10)
                    }</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 hover:bg-blue-50 px-3 rounded">
                    <span className="text-gray-700">Financial Performance Charts</span>
                    <span className="text-blue-600 font-semibold">{
                      (aiExecutiveSummary || aiSwotAnalysis) 
                        ? (acConfiguration ? (12 + aiPages) : (11 + aiPages)) 
                        : (acConfiguration ? 12 : 11)
                    }</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 hover:bg-blue-50 px-3 rounded">
                    <span className="text-gray-700">Project Viability Assessment</span>
                    <span className="text-blue-600 font-semibold">{
                      (aiExecutiveSummary || aiSwotAnalysis) 
                        ? (acConfiguration ? (13 + aiPages) : (12 + aiPages)) 
                        : (acConfiguration ? 13 : 12)
                    }</span>
                  </div>
                </>
              )}
              
              {/* BOQ Annexure - only if BOQ data exists */}
              {boqData && boqData.length > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 hover:bg-blue-50 px-3 rounded">
                  <span className="text-gray-700 font-semibold">Annexure-1: Bill of Quantities (BOQ)</span>
                  <span className="text-blue-600 font-semibold">{totalPages - boqPages + 1}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="absolute bottom-8 right-8 text-sm text-gray-500">
            Page 2 of {totalPages}
          </div>
        </div>

        {/* Page 3 - Design Summary */}
        <div 
          ref={page2Ref} 
          className="bg-white p-8" 
          style={{ width: "800px", height: "1123px", position: "relative" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-blue-500">
            <div className="flex items-center gap-3">
              <Grid3X3 className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Design Summary</h1>
            </div>
            <div className="text-sm text-gray-600">Page {(aiExecutiveSummary || aiSwotAnalysis) ? (3 + aiPages) : 3} of {totalPages}</div>
          </div>

          {/* System Configuration */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-700 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              ⚙️ System Configuration
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-4 bg-gradient-to-r from-green-50 to-green-25">
                <h3 className="font-semibold mb-3 text-green-700 flex items-center gap-2">
                  <span>🔋</span> PV Module Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Manufacturer:</span>
                    <span className="font-medium text-green-800">{selectedPanel?.manufacturer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Model:</span>
                    <span className="font-medium text-green-800">{selectedPanel?.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Power Rating:</span>
                    <span className="font-medium text-green-800">{selectedPanel?.nominal_power_w}W</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Efficiency:</span>
                    <span className="font-medium text-green-800">{selectedPanel?.efficiency_percent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Modules:</span>
                    <span className="font-medium text-green-800">{totalModules}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-25">
                <h3 className="font-semibold mb-3 text-blue-700 flex items-center gap-2">
                  <span>⚡</span> Inverter Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Manufacturer:</span>
                    <span className="font-medium text-blue-800">{selectedInverter?.manufacturer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Model:</span>
                    <span className="font-medium text-blue-800">{selectedInverter?.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Power Rating:</span>
                    <span className="font-medium text-blue-800">{selectedInverter?.nominal_ac_power_kw ? (selectedInverter.nominal_ac_power_kw * 1000).toFixed(0) : 0}W</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Efficiency:</span>
                    <span className="font-medium text-blue-800">98%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Inverters:</span>
                    <span className="font-medium text-blue-800">{systemParams.inverterCount}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Installation Parameters */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-700 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              📍 Installation Parameters
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center bg-gradient-to-r from-orange-50 to-orange-25">
                <div className="text-2xl font-bold text-orange-600">{systemParams.tilt}°</div>
                <div className="text-sm text-orange-700 font-medium">📐 Tilt Angle</div>
              </Card>
              <Card className="p-4 text-center bg-gradient-to-r from-purple-50 to-purple-25">
                <div className="text-2xl font-bold text-purple-600">{systemParams.azimuth}°</div>
                <div className="text-sm text-purple-700 font-medium">🧭 Azimuth</div>
              </Card>
              <Card className="p-4 text-center bg-gradient-to-r from-teal-50 to-teal-25">
                <div className="text-2xl font-bold text-teal-600">
                  {getSystemStructureTypes()}
                </div>
                <div className="text-sm text-teal-700 font-medium">🏗️ Structure Type</div>
              </Card>
            </div>
          </div>

          {/* Area Configuration */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-blue-700 flex items-center gap-2">
              📊 PV Array Configuration
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 p-2 text-left">Structure Type</th>
                    <th className="border border-gray-300 p-2 text-center">Area (m²)</th>
                    <th className="border border-gray-300 p-2 text-center">Modules</th>
                    <th className="border border-gray-300 p-2 text-center">Tables</th>
                    <th className="border border-gray-300 p-2 text-center">Capacity (kWp)</th>
                    <th className="border border-gray-300 p-2 text-center">Tilt (°)</th>
                    <th className="border border-gray-300 p-2 text-center">Azimuth (°)</th>
                  </tr>
                </thead>
                <tbody>
                  {polygonConfigs?.map((config, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="border border-gray-300 p-2">{getStructureTypeName(config.structureType)}</td>
                      <td className="border border-gray-300 p-2 text-center">{config.area.toFixed(1)}</td>
                      <td className="border border-gray-300 p-2 text-center">{config.moduleCount}</td>
                      <td className="border border-gray-300 p-2 text-center">
                        {config.tableCount !== undefined ? config.tableCount : '-'}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">{config.capacityKw.toFixed(1)}</td>
                      <td className="border border-gray-300 p-2 text-center">{config.tiltAngle}</td>
                      <td className="border border-gray-300 p-2 text-center">{config.azimuth}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-100 font-semibold">
                    <td className="border border-gray-300 p-2">TOTAL</td>
                    <td className="border border-gray-300 p-2 text-center">{totalArea.toFixed(1)}</td>
                    <td className="border border-gray-300 p-2 text-center">{totalModules}</td>
                    <td className="border border-gray-300 p-2 text-center">
                      {polygonConfigs?.reduce((sum, config) => sum + (config.tableCount || 0), 0) || '-'}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">{totalCapacity.toFixed(1)}</td>
                    <td className="border border-gray-300 p-2 text-center">-</td>
                    <td className="border border-gray-300 p-2 text-center">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-8 left-8 right-8 text-center text-xs text-gray-500 border-t pt-2">
            Solar PV System Design Summary Report
          </div>
        </div>

        {/* Page 3 - AC Configuration */}
        {acConfiguration && (
        <div 
          ref={page3Ref} 
          className="bg-white p-8" 
          style={{ width: "800px", height: "1123px", position: "relative" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-blue-500">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">AC System Configuration</h1>
            </div>
            <div className="text-sm text-gray-600">Page {(aiExecutiveSummary || aiSwotAnalysis) ? (4 + aiPages) : 4} of {totalPages}</div>
          </div>

          {/* Basic Configuration */}
          <div className="mb-5">
            <h2 className="text-lg font-semibold mb-3 text-blue-700">System Overview</h2>
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-3 text-center bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="text-xl font-bold text-blue-600">
                  {acConfiguration?.connectionType?.toUpperCase() || 'LV'}
                </div>
                <div className="text-xs text-gray-600">Connection Type</div>
              </Card>
              <Card className="p-3 text-center bg-gradient-to-br from-green-50 to-green-100">
                <div className="text-xl font-bold text-green-600">
                  {acConfiguration?.pocVoltage || '415'}V
                </div>
                <div className="text-xs text-gray-600">PoC Voltage</div>
              </Card>
              <Card className="p-3 text-center bg-gradient-to-br from-purple-50 to-purple-100">
                <div className="text-xl font-bold text-purple-600">
                  {acConfiguration?.inverterType || 'String'}
                </div>
                <div className="text-xs text-gray-600">Inverter Type</div>
              </Card>
            </div>
          </div>

          {/* AC Combiner Panels */}
          {acConfiguration?.acCombinerPanels && (
            <div className="mb-5">
              <h2 className="text-lg font-semibold mb-3 text-blue-700 flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                AC Combiner Panels
              </h2>
              <Card className="p-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xl font-bold text-gray-800">
                      {acConfiguration.acCombinerPanels.count}
                    </div>
                    <div className="text-xs text-gray-600">Panel Count</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xl font-bold text-gray-800">
                      {acConfiguration.acCombinerPanels.configurations.reduce((sum, config) => sum + config.inputs, 0)}
                    </div>
                    <div className="text-xs text-gray-600">Total Inputs</div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <h3 className="text-base font-semibold text-gray-700 mb-2">Panel Configurations</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-gray-200">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-2 text-left">Panel #</th>
                          <th className="border border-gray-300 p-2 text-center">Inputs</th>
                          <th className="border border-gray-300 p-2 text-center">Rating (A)</th>
                          <th className="border border-gray-300 p-2 text-left">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acConfiguration.acCombinerPanels.configurations.map((config, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="border border-gray-300 p-2 font-medium">Panel {index + 1}</td>
                            <td className="border border-gray-300 p-2 text-center">{config.inputs}</td>
                            <td className="border border-gray-300 p-2 text-center">{config.outputCurrent}A</td>
                            <td className="border border-gray-300 p-2">Standard AC combiner panel</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Circuit Breakers */}
          {acConfiguration?.selectedBreakers && acConfiguration.selectedBreakers.size > 0 ? (
            <div className="mb-5">
              <h2 className="text-lg font-semibold mb-3 text-blue-700 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Circuit Breakers
              </h2>
              <Card className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">Location</th>
                        <th className="border border-gray-300 p-2 text-left">Type</th>
                        <th className="border border-gray-300 p-2 text-center">Rating (A)</th>
                        <th className="border border-gray-300 p-2 text-center">Voltage (kV)</th>
                        <th className="border border-gray-300 p-2 text-center">ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(acConfiguration.selectedBreakers.entries()).map(([key, { breaker, sectionTitle }]) => (
                        <tr key={key} className="border-b border-gray-100">
                          <td className="border border-gray-300 p-2 font-medium">{sectionTitle}</td>
                          <td className="border border-gray-300 p-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {breaker.breaker_type}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-2 text-center font-medium">{breaker.ampacity}</td>
                          <td className="border border-gray-300 p-2 text-center font-medium">{breaker.rated_voltage}</td>
                          <td className="border border-gray-300 p-2 text-center text-xs">{breaker.id.slice(0, 8)}...</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ) : (
            acConfiguration && (
              <div className="mb-5">
                <h2 className="text-lg font-semibold mb-3 text-blue-700 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Circuit Breakers
                </h2>
                <Card className="p-4">
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <Zap className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <div className="text-lg font-medium mb-2">No Circuit Breakers Configured</div>
                    <div className="text-sm">Circuit breakers can be configured in the AC Configuration tab</div>
                  </div>
                </Card>
              </div>
            )
          )}

          {/* Cable Configuration */}
          {acConfiguration?.selectedCables && acConfiguration.selectedCables.size > 0 ? (
            <div className="mb-5">
              <h2 className="text-lg font-semibold mb-3 text-blue-700 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Cable Configuration
              </h2>
              <Card className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">Location</th>
                        <th className="border border-gray-300 p-2 text-left">Material</th>
                        <th className="border border-gray-300 p-2 text-center">Cross Section (mm²)</th>
                        <th className="border border-gray-300 p-2 text-center">Length (m)</th>
                        <th className="border border-gray-300 p-2 text-center">Runs</th>
                        <th className="border border-gray-300 p-2 text-center">Current Rating (A)</th>
                        <th className="border border-gray-300 p-2 text-center">Derated Current (A)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(acConfiguration.selectedCables.entries()).map(([key, cableData]) => {
                        if (!cableData.cable) return null;
                        return (
                          <tr key={key} className="border-b border-gray-100">
                            <td className="border border-gray-300 p-2 font-medium">{cableData.sectionTitle}</td>
                            <td className="border border-gray-300 p-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${cableData.material === 'COPPER' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                                {cableData.material}
                              </span>
                            </td>
                            <td className="border border-gray-300 p-2 text-center font-medium">{cableData.cable.cross_section_mm2}</td>
                            <td className="border border-gray-300 p-2 text-center font-medium">{cableData.length}</td>
                            <td className="border border-gray-300 p-2 text-center font-medium">{cableData.numberOfRuns}</td>
                            <td className="border border-gray-300 p-2 text-center font-medium">{cableData.calculatedCurrent.toFixed(1)}</td>
                            <td className="border border-gray-300 p-2 text-center font-medium">{cableData.deratedCurrent.toFixed(1)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ) : (
            acConfiguration && (
              <div className="mb-5">
                <h2 className="text-lg font-semibold mb-3 text-blue-700 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Cable Configuration
                </h2>
                <Card className="p-4">
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <Zap className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <div className="text-lg font-medium mb-2">No Cables Configured</div>
                    <div className="text-sm">Cables can be configured in the AC Configuration tab</div>
                  </div>
                </Card>
              </div>
            )
          )}

          {/* Additional AC System Information */}
          {acConfiguration?.totalACLosses && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-3 text-blue-700">System Details</h2>
              <Card className="p-3">
                <div className="grid grid-cols-1 gap-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total AC Losses:</span>
                    <span className="font-medium">{acConfiguration.totalACLosses.toFixed(2)} kW</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Footer */}
          <div className="absolute bottom-4 left-8 right-8 flex items-center justify-between text-xs text-gray-500 border-t pt-4">
            <div>
              AC System Configuration Report
            </div>
            <div>
              Solar PV System Design Summary Report
            </div>
          </div>
        </div>
        )}

        {/* Page 4 - System Performance & Losses */}
        <div 
          ref={acConfiguration ? page4Ref : page3Ref}
          className="bg-white p-8" 
          style={{ width: "800px", height: "1123px", position: "relative" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-amber-500">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-amber-600" />
              <h1 className="text-2xl font-bold text-gray-800">System Performance & Losses</h1>
            </div>
            <div className="text-sm text-gray-600">Page {(aiExecutiveSummary || aiSwotAnalysis) ? (acConfiguration ? (5 + aiPages) : (4 + aiPages)) : (acConfiguration ? 5 : 4)} of {totalPages}</div>
          </div>

          {/* Performance Overview */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-amber-700">Performance Overview</h2>
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-4">
                <h3 className="font-semibold mb-3 text-gray-700">DC/AC Ratio</h3>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {systemParams.dcAcRatio.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">DC to AC capacity ratio</div>
              </Card>
              <Card className="p-4">
                <h3 className="font-semibold mb-3 text-gray-700">User defined System losses</h3>
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {systemParams.losses.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Combined derating factors</div>
              </Card>
            </div>
          </div>

          {/* Detailed Loss Categories */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-amber-700">Detailed Loss Analysis</h2>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">Environmental Losses</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Soiling:</span>
                    <span className="font-medium">{detailedLosses?.soiling || 1.0}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shading:</span>
                    <span className="font-medium">{detailedLosses?.shading || 1.0}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Snow:</span>
                    <span className="font-medium">{detailedLosses?.snow || 1.0}%</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">Electrical Losses</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Module Mismatch:</span>
                    <span className="font-medium">{detailedLosses?.mismatch || 1.0}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>DC Wiring:</span>
                    <span className="font-medium">{detailedLosses?.dcWiringLosses || 2.0}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>AC Wiring:</span>
                    <span className="font-medium">{detailedLosses?.acCableLosses || 1.0}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">🔋 Module Losses</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Mismatch:</span>
                    <span className="font-medium">{detailedLosses?.mismatch || 1.0}%</span>
                  </div>
                                     <div className="flex justify-between text-sm">
                     <span>Light-Induced Degradation:</span>
                     <span className="font-medium">{detailedLosses?.lightInducedDegradation || 1.0}%</span>
                   </div>
                  <div className="flex justify-between text-sm">
                    <span>Nameplate Rating:</span>
                    <span className="font-medium">{detailedLosses?.nameplateRating || 1.0}%</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">⚡ System Losses</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Age:</span>
                    <span className="font-medium">{detailedLosses?.age || 1.0}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Availability:</span>
                    <span className="font-medium">{detailedLosses?.availability || 1.0}%</span>
                  </div>
                                     {/* Show transformer losses only for HV connection type */}
                   {acConfiguration?.connectionType === 'HV' && detailedLosses?.transformerLosses && (
                     <div className="flex justify-between text-sm">
                       <span>Transformer:</span>
                       <span className="font-medium">{detailedLosses.transformerLosses}%</span>
                     </div>
                   )}
                </div>
              </div>
            </div>
          </div>





          {/* Loss Impact Analysis */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-amber-700">Loss Impact Analysis</h2>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-amber-800 mb-2">Annual Energy Loss</div>
                  <div className="text-2xl font-bold text-red-600">
                    {(annualProduction * systemParams.losses / 100).toFixed(0)} kWh
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-amber-800 mb-2">Potential Without Losses</div>
                  <div className="text-2xl font-bold text-green-600">
                    {(annualProduction / (1 - systemParams.losses / 100)).toFixed(0)} kWh
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-8 left-8 right-8 text-center text-xs text-gray-500 border-t pt-2">
            System Performance & Losses Analysis Report
          </div>
        </div>

        {/* Production Results & Analysis */}
        <div 
          ref={acConfiguration ? page5Ref : page4Ref}
          className="bg-white p-8" 
          style={{ width: "800px", height: "1123px", position: "relative" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-green-500">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-800">Production Results & Analysis</h1>
            </div>
            <div className="text-sm text-gray-600">Page {(aiExecutiveSummary || aiSwotAnalysis) ? (acConfiguration ? (6 + aiPages) : (5 + aiPages)) : (acConfiguration ? 6 : 5)} of {totalPages}</div>
          </div>

          {/* Key Metrics */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-green-700">Key Performance Metrics</h2>
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="text-2xl font-bold text-blue-600">{formatNumber(annualProduction)}</div>
                <div className="text-sm text-gray-600">Annual Production (kWh)</div>
              </Card>
              <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-green-100">
                <div className="text-2xl font-bold text-green-600">
                  {(annualProduction / totalCapacity).toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">Specific Yield (kWh/kWp)</div>
              </Card>
              <Card className="p-4 text-center bg-gradient-to-br from-orange-50 to-orange-100">
                <div className="text-2xl font-bold text-orange-600">
                  {((annualProduction / (results.irradiation?.metrics?.total_yearly || 1500) / totalCapacity) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Annual Performance Ratio (PR)</div>
              </Card>
            </div>
          </div>

          {/* Enhanced Monthly Production Chart */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-green-700">Monthly Energy Production & Solar Irradiation</h2>
            <div className="h-80 bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-center">
              {monthlyChartImage ? (
                <img 
                  src={monthlyChartImage} 
                  alt="Monthly AC Energy Production Chart" 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div className="text-gray-500 text-center">
                  <p>Monthly Energy Production & Solar Irradiation Chart</p>
                  <p className="text-sm">Chart will appear after capturing</p>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Monthly Data Table */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-green-700">Monthly Performance Analysis</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gradient-to-r from-green-100 to-blue-100">
                    <th className="border border-gray-300 px-1 py-1 text-center font-bold align-middle">Month</th>
                    <th className="border border-gray-300 px-1 py-1 text-center font-bold align-middle">POA<br/><span className="text-xs font-normal">(kWh/m²)</span></th>
                    <th className="border border-gray-300 px-1 py-1 text-center font-bold align-middle">DNI<br/><span className="text-xs font-normal">(kWh/m²)</span></th>
                    <th className="border border-gray-300 px-1 py-1 text-center font-bold align-middle">Diffuse<br/><span className="text-xs font-normal">(kWh/m²)</span></th>
                    <th className="border border-gray-300 px-1 py-1 text-center font-bold align-middle">Tamb<br/><span className="text-xs font-normal">(°C)</span></th>
                    <th className="border border-gray-300 px-1 py-1 text-center font-bold align-middle">Wind<br/><span className="text-xs font-normal">(m/s)</span></th>
                    <th className="border border-gray-300 px-1 py-1 text-center font-bold align-middle">DC Energy<br/><span className="text-xs font-normal">(kWh)</span></th>
                    <th className="border border-gray-300 px-1 py-1 text-center font-bold align-middle">AC Energy<br/><span className="text-xs font-normal">(kWh)</span></th>
                    <th className="border border-gray-300 px-1 py-1 text-center font-bold align-middle">PR<br/><span className="text-xs font-normal">(%)</span></th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    const dcCapacity = systemParams.capacity;
                    
                    // Calculate monthly values from hourly data if available
                    const monthlyCalculatedValues = monthNames.map((month, index) => {
                      const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                      let startDay = 0;
                      for (let m = 0; m < index; m++) {
                        startDay += daysInMonth[m];
                      }
                      
                      let monthDNI = 0, monthDiffuse = 0, monthTamb = 0, monthWind = 0, monthDC = 0;
                      let tempCount = 0, windCount = 0;
                      
                      // Calculate from hourly data if available
                      if (results.irradiation?.hourly?.dn && results.irradiation?.hourly?.df && 
                          results.irradiation?.hourly?.tamb && results.irradiation?.hourly?.wspd && 
                          results.energy?.hourlyDC) {
                        
                        const hourlyDNI = results.irradiation.hourly.dn;
                        const hourlyDiffuse = results.irradiation.hourly.df;
                        const hourlyTamb = results.irradiation.hourly.tamb;
                        const hourlyWind = results.irradiation.hourly.wspd;
                        const hourlyDC = results.energy.hourlyDC;
                        
                        for (let day = 0; day < daysInMonth[index]; day++) {
                          for (let hour = 0; hour < 24; hour++) {
                            const hourIndex = (startDay + day) * 24 + hour;
                            if (hourIndex < hourlyDNI.length) {
                              monthDNI += (hourlyDNI[hourIndex] || 0) / 1000;
                              monthDiffuse += (hourlyDiffuse[hourIndex] || 0) / 1000;
                              monthDC += (hourlyDC[hourIndex] || 0) / 1000;
                              
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
                      const irradiationData = results.irradiation?.monthly?.[index];
                      const energyData = results.energy?.monthly?.[index];
                      const calculatedData = monthlyCalculatedValues[index];
                      
                      const poa = irradiationData?.["Monthly Solar Irradiation (kWh/m²)"] || 0;
                      const dni = calculatedData.dni;
                      const diffuse = calculatedData.diffuse;
                      const ambTemp = calculatedData.ambTemp;
                      const windVel = calculatedData.windVel;
                      const dcEnergy = calculatedData.dcEnergy;
                      const acEnergy = energyData?.["Monthly Energy Production (kWh)"] || 0;
                      const pr = (poa > 0 && dcCapacity > 0) ? (acEnergy / (poa * dcCapacity)) * 100 : 0;
                      
                      return (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-300 px-1 py-1 text-center font-semibold align-middle" style={{ verticalAlign: 'middle' }}>{month}</td>
                          <td className="border border-gray-300 px-1 py-1 text-center align-middle" style={{ verticalAlign: 'middle' }}>{poa.toFixed(1)}</td>
                          <td className="border border-gray-300 px-1 py-1 text-center align-middle" style={{ verticalAlign: 'middle' }}>{dni.toFixed(1)}</td>
                          <td className="border border-gray-300 px-1 py-1 text-center align-middle" style={{ verticalAlign: 'middle' }}>{diffuse.toFixed(1)}</td>
                          <td className="border border-gray-300 px-1 py-1 text-center align-middle" style={{ verticalAlign: 'middle' }}>{ambTemp.toFixed(1)}</td>
                          <td className="border border-gray-300 px-1 py-1 text-center align-middle" style={{ verticalAlign: 'middle' }}>{windVel.toFixed(1)}</td>
                          <td className="border border-gray-300 px-1 py-1 text-center align-middle" style={{ verticalAlign: 'middle' }}>{formatNumber(dcEnergy)}</td>
                          <td className="border border-gray-300 px-1 py-1 text-center align-middle" style={{ verticalAlign: 'middle' }}>{formatNumber(acEnergy)}</td>
                          <td className="border border-gray-300 px-1 py-1 text-center align-middle" style={{ verticalAlign: 'middle' }}>{pr.toFixed(1)}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>



          {/* Footer */}
          <div className="absolute bottom-8 left-8 right-8 text-center text-xs text-gray-500 border-t pt-2">
            Production Results & Analysis Report
          </div>
        </div>

        {/* Uncertainty Analysis */}
        <div 
          ref={acConfiguration ? page6Ref : page5Ref}
          className="bg-white p-8" 
          style={{ width: "800px", height: "1123px", position: "relative" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-orange-500">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-orange-600" />
              <h1 className="text-2xl font-bold text-gray-800">Uncertainty Analysis</h1>
            </div>
            <div className="text-sm text-gray-600">Page {(aiExecutiveSummary || aiSwotAnalysis) ? (acConfiguration ? (7 + aiPages) : (6 + aiPages)) : (acConfiguration ? 7 : 6)} of {totalPages}</div>
          </div>

          {/* P-Values Analysis */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-orange-700">Production Probability Analysis</h2>
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-lg border border-orange-200">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
                  <div className="text-2xl font-bold text-green-600 mb-2">P90</div>
                  <div className="text-lg font-semibold text-gray-700">{(annualProduction * 0.9 / 1000).toFixed(1)} MWh</div>
                  <div className="text-sm text-gray-600 mt-2">Conservative estimate</div>
                  <div className="text-xs text-gray-500">90% probability of exceeding</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600 mb-2">P50</div>
                  <div className="text-lg font-semibold text-gray-700">{(annualProduction / 1000).toFixed(1)} MWh</div>
                  <div className="text-sm text-gray-600 mt-2">Expected production</div>
                  <div className="text-xs text-gray-500">50% probability of exceeding</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600 mb-2">P75</div>
                  <div className="text-lg font-semibold text-gray-700">{(annualProduction * 0.95 / 1000).toFixed(1)} MWh</div>
                  <div className="text-sm text-gray-600 mt-2">Probable estimate</div>
                  <div className="text-xs text-gray-500">75% probability of exceeding</div>
                </div>
              </div>
            </div>
          </div>

          {/* Probability Distribution Curve */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-orange-700">Probability Distribution Curve</h2>
            <div className="h-80 bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-center">
              {probabilityChartImage ? (
                <img 
                  src={probabilityChartImage} 
                  alt="Probability Distribution Curve Chart" 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div className="text-gray-500 text-center">
                  <p>Probability Distribution Curve</p>
                  <p className="text-sm">Chart will appear after capturing</p>
                </div>
              )}
            </div>
          </div>

          {/* Uncertainty Factors */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-orange-700">Uncertainty Factors</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Weather Variability</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Solar irradiation: ±5-8%</li>
                  <li>• Temperature effects: ±2-3%</li>
                  <li>• Cloud patterns: ±3-5%</li>
                  <li>• Seasonal variations: ±4-6%</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">System Performance</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Equipment degradation: ±1-2%</li>
                  <li>• Soiling and maintenance: ±2-4%</li>
                  <li>• Inverter efficiency: ±1-2%</li>
                  <li>• Grid availability: ±0.5-1%</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-8 left-8 right-8 text-center text-xs text-gray-500 border-t pt-2">
            Uncertainty Analysis Report
          </div>
        </div>

        {/* 25-Year Generation Summary */}
        <div 
          ref={acConfiguration ? page7Ref : page6Ref}
          className="bg-white p-8" 
          style={{ width: "800px", height: "1123px", position: "relative" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-purple-500">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-800">25-Year Generation Summary</h1>
            </div>
            <div className="text-sm text-gray-600">Page {(aiExecutiveSummary || aiSwotAnalysis) ? (acConfiguration ? (8 + aiPages) : (7 + aiPages)) : (acConfiguration ? 8 : 7)} of {totalPages}</div>
          </div>

          {/* Main Content - Table on Left, Charts on Right */}
          <div className="grid grid-cols-2 gap-6 mb-6" style={{ height: "700px" }}>
            
            {/* Left Side - Single 25-Year Production Table */}
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-purple-700">Yearly Production Forecast</h2>
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-xs border-collapse border border-gray-300">
                  <thead className="sticky top-0 bg-purple-50">
                    <tr>
                      <th className="border border-gray-300 px-1 py-1 text-center font-bold align-middle">Year</th>
                      <th className="border border-gray-300 px-1 py-1 text-center font-bold align-middle">Production (kWh)</th>
                      <th className="border border-gray-300 px-1 py-1 text-center font-bold align-middle">Cumulative (MWh)</th>
                      <th className="border border-gray-300 px-1 py-1 text-center font-bold align-middle">Degradation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyData.map((year) => (
                      <tr key={year.year} className={year.year % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="border border-gray-300 px-1 py-1 text-center font-medium align-middle" style={{ verticalAlign: 'middle' }}>{year.year}</td>
                        <td className="border border-gray-300 px-1 py-1 text-center align-middle" style={{ verticalAlign: 'middle' }}>
                          {formatNumber(year.production)}
                        </td>
                        <td className="border border-gray-300 px-1 py-1 text-center align-middle" style={{ verticalAlign: 'middle' }}>
                          {(year.cumulative / 1000).toFixed(1)}
                        </td>
                        <td className="border border-gray-300 px-1 py-1 text-center align-middle" style={{ verticalAlign: 'middle' }}>
                          {year.degradation}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Side - Charts from Yearly Tab */}
            <div className="flex flex-col gap-4">
              
              {/* 25-Year Energy Production Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-3" style={{ height: "340px" }}>
                <h3 className="text-sm font-semibold mb-2 text-gray-800 flex items-center gap-1">
                  📊 25-Year Performance Overview
                </h3>
                <div style={{ height: "280px" }} className="relative">
                  {(() => {
                    // Create 25-year projection data for chart
                    const baseAnnualEnergy = annualProduction;
                    const degradationRate = 0.006; // 0.6% per year
                    
                    const yearlyProjections = Array.from({ length: 25 }, (_, index) => {
                      const year = index + 1;
                      const degradationFactor = Math.pow(1 - degradationRate, year - 1);
                      const energyOutput = baseAnnualEnergy * degradationFactor;
                      return Math.round(energyOutput);
                    });

                    // Chart dimensions
                    const chartWidth = 340;
                    const chartHeight = 240;
                    const padding = 40;
                    const barWidth = (chartWidth - 2 * padding) / 25;
                    
                    // Calculate scale
                    const maxValue = Math.max(...yearlyProjections);
                    const minValue = Math.min(...yearlyProjections);
                    const range = maxValue - minValue;
                    
                    return (
                      <div className="h-full w-full bg-gray-50 rounded-lg p-2">
                        <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
                          {/* Chart Title */}
                          <text x={chartWidth/2} y={20} textAnchor="middle" className="text-xs font-semibold fill-gray-700">
                            Energy Output & Degradation
                          </text>
                          
                          {/* Y-axis */}
                          <line x1={padding} y1={30} x2={padding} y2={chartHeight - padding} stroke="#ddd" strokeWidth="1"/>
                          
                          {/* X-axis */}
                          <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#ddd" strokeWidth="1"/>
                          
                          {/* Energy bars */}
                          {yearlyProjections.map((value, index) => {
                            const barHeight = ((value - minValue) / range) * (chartHeight - 80);
                            const x = padding + index * barWidth + barWidth * 0.1;
                            const y = chartHeight - padding - barHeight;
                            const width = barWidth * 0.8;
                            
                            return (
                              <rect
                                key={index}
                                x={x}
                                y={y}
                                width={width}
                                height={barHeight}
                                fill="rgba(34, 197, 94, 0.8)"
                                stroke="rgb(34, 197, 94)"
                                strokeWidth="1"
                                rx="2"
                              />
                            );
                          })}
                          
                          {/* X-axis labels */}
                          {[1, 5, 10, 15, 20, 25].map(year => {
                            const x = padding + (year - 1) * barWidth + barWidth * 0.5;
                            return (
                              <text key={year} x={x} y={chartHeight - 15} textAnchor="middle" className="text-xs fill-gray-600">
                                Y{year}
                              </text>
                            );
                          })}
                          
                          {/* Y-axis labels */}
                          <text x={15} y={40} textAnchor="middle" className="text-xs fill-gray-600">
                            {(maxValue/1000).toFixed(0)}k
                          </text>
                          <text x={15} y={chartHeight - 50} textAnchor="middle" className="text-xs fill-gray-600">
                            {(minValue/1000).toFixed(0)}k
                          </text>
                        </svg>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Cumulative Degradation Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-3" style={{ height: "340px" }}>
                <h3 className="text-sm font-semibold mb-2 text-gray-800 flex items-center gap-1">
                  📉 Cumulative Degradation
                </h3>
                <div style={{ height: "280px" }} className="relative">
                  {(() => {
                    const degradationData = yearlyData.map(year => parseFloat(year.degradation));
                    const chartWidth = 340;
                    const chartHeight = 240;
                    const padding = 40;
                    
                    // Calculate points for the line
                    const points = degradationData.map((deg, index) => {
                      const x = padding + (index / (degradationData.length - 1)) * (chartWidth - 2 * padding);
                      const y = chartHeight - padding - (deg / 15) * (chartHeight - 80); // Scale to max 15%
                      return `${x},${y}`;
                    }).join(' ');
                    
                    return (
                      <div className="h-full w-full bg-gray-50 rounded-lg p-2">
                        <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
                          {/* Chart Title */}
                          <text x={chartWidth/2} y={20} textAnchor="middle" className="text-xs font-semibold fill-gray-700">
                            System Performance Decline (%)
                          </text>
                          
                          {/* Y-axis */}
                          <line x1={padding} y1={30} x2={padding} y2={chartHeight - padding} stroke="#ddd" strokeWidth="1"/>
                          
                          {/* X-axis */}
                          <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#ddd" strokeWidth="1"/>
                          
                          {/* Degradation line */}
                          <polyline
                            fill="none"
                            stroke="rgb(239, 68, 68)"
                            strokeWidth="2"
                            points={points}
                          />
                          
                          {/* Data points */}
                          {degradationData.map((deg, index) => {
                            const x = padding + (index / (degradationData.length - 1)) * (chartWidth - 2 * padding);
                            const y = chartHeight - padding - (deg / 15) * (chartHeight - 80);
                            return (
                              <circle
                                key={index}
                                cx={x}
                                cy={y}
                                r="2"
                                fill="rgb(239, 68, 68)"
                              />
                            );
                          })}
                          
                          {/* X-axis labels */}
                          {[1, 5, 10, 15, 20, 25].map(year => {
                            const x = padding + ((year - 1) / 24) * (chartWidth - 2 * padding);
                            return (
                              <text key={year} x={x} y={chartHeight - 15} textAnchor="middle" className="text-xs fill-gray-600">
                                Y{year}
                              </text>
                            );
                          })}
                          
                          {/* Y-axis labels */}
                          <text x={15} y={40} textAnchor="middle" className="text-xs fill-gray-600">
                            15%
                          </text>
                          <text x={15} y={chartHeight - 50} textAnchor="middle" className="text-xs fill-gray-600">
                            0%
                          </text>
                        </svg>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Statistics at Bottom */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-purple-700">Long-term Performance Summary</h2>
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-3 text-center bg-gradient-to-br from-purple-50 to-purple-100">
                <div className="text-lg font-bold text-purple-600">
                  {formatNumber(yearlyData.reduce((sum, year) => sum + year.production, 0))}
                </div>
                <div className="text-xs text-gray-600">Total 25-Year Production (kWh)</div>
              </Card>
              <Card className="p-3 text-center bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="text-lg font-bold text-blue-600">
                  {(yearlyData.reduce((sum, year) => sum + year.production, 0) / 25).toFixed(0)}
                </div>
                <div className="text-xs text-gray-600">Average Annual (kWh)</div>
              </Card>
              <Card className="p-3 text-center bg-gradient-to-br from-green-50 to-green-100">
                <div className="text-lg font-bold text-green-600">0.5%</div>
                <div className="text-xs text-gray-600">Annual Degradation Rate</div>
              </Card>
              <Card className="p-3 text-center bg-gradient-to-br from-orange-50 to-orange-100">
                <div className="text-lg font-bold text-orange-600">
                  {((yearlyData[24].production / annualProduction) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">Year 25 vs Year 1</div>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-8 left-8 right-8 text-center text-xs text-gray-500 border-t pt-2">
            25-Year Generation Summary Report • Generated on {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Layout & SLD */}
        <div 
          ref={acConfiguration ? page8Ref : page7Ref}
          className="bg-white p-8" 
          style={{ width: "800px", height: "1123px", position: "relative" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-orange-500">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-orange-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">System Layout & Electrical Schematic</h2>
                <p className="text-gray-600 text-sm">Site layout and single line diagram</p>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>Page {(aiExecutiveSummary || aiSwotAnalysis) ? (acConfiguration ? (9 + aiPages) : (8 + aiPages)) : (acConfiguration ? 9 : 8)} of {totalPages}</p>
              <p>{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* First Half - Layout Diagram */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <Grid3X3 className="h-5 w-5 text-orange-600" />
              Site Layout Plan
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200" style={{ height: "400px" }}>
              {mapImage ? (
                <div className="h-full flex flex-col">
                  <div className="flex-1 bg-white rounded border overflow-hidden">
                    <img 
                      src={mapImage} 
                      alt="Solar PV System Layout" 
                      className="w-full h-full object-cover"
                      style={{ maxHeight: "350px" }}
                    />
                  </div>
                  <div className="mt-3 text-xs text-gray-600 text-center">
                    <p>Solar PV System Layout - {totalCapacity.toFixed(1)} kWp | {totalModules} Modules</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Grid3X3 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm">Site layout diagram will be displayed here</p>
                    <p className="text-xs mt-1">Capture map image during area calculation</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Second Half - Single Line Diagram */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              Single Line Diagram (SLD)
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200" style={{ height: "400px" }}>
              {sldImage ? (
                <div className="h-full flex flex-col">
                  <div className="flex-1 bg-white rounded border overflow-hidden">
                    <img 
                      src={sldImage} 
                      alt="Single Line Diagram (SLD)" 
                      className="w-full h-full object-contain"
                      style={{ maxHeight: "350px" }}
                    />
                  </div>
                  <div className="mt-3 text-xs text-gray-600 text-center">
                    <p>Professional Single Line Diagram - {acConfiguration?.connectionType || 'LV'} Configuration</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <svg width="100%" height="100%" viewBox="0 0 760 360" className="border bg-white rounded">
                    {/* PV Array */}
                    <g transform="translate(50, 30)">
                      <rect x="0" y="0" width="120" height="60" fill="#e3f2fd" stroke="#2196f3" strokeWidth="2" rx="5" />
                      <text x="60" y="25" textAnchor="middle" className="text-xs font-semibold fill-blue-700">PV Array</text>
                      <text x="60" y="40" textAnchor="middle" className="text-xs fill-blue-600">{totalCapacity.toFixed(1)} kWp</text>
                      <text x="60" y="52" textAnchor="middle" className="text-xs fill-blue-600">{totalModules} Modules</text>
                    </g>

                    {/* DC Disconnect */}
                    <g transform="translate(220, 40)">
                      <rect x="0" y="0" width="40" height="40" fill="#fff3e0" stroke="#ff9800" strokeWidth="2" rx="3" />
                      <text x="20" y="25" textAnchor="middle" className="text-xs font-semibold fill-orange-700">DC</text>
                      <text x="20" y="35" textAnchor="middle" className="text-xs fill-orange-600">SW</text>
                    </g>

                  {/* Inverter */}
                  <g transform="translate(320, 20)">
                    <rect x="0" y="0" width="100" height="80" fill="#f3e5f5" stroke="#9c27b0" strokeWidth="2" rx="5" />
                    <text x="50" y="25" textAnchor="middle" className="text-xs font-semibold fill-purple-700">Inverter</text>
                    <text x="50" y="40" textAnchor="middle" className="text-xs fill-purple-600">{selectedInverter?.manufacturer || 'Selected'}</text>
                    <text x="50" y="52" textAnchor="middle" className="text-xs fill-purple-600">{selectedInverter?.model || 'Inverter'}</text>
                    <text x="50" y="68" textAnchor="middle" className="text-xs fill-purple-600">
                      {selectedInverter?.nominal_ac_power_kw ? `${selectedInverter.nominal_ac_power_kw} kW` : 'AC Power'}
                    </text>
                  </g>

                  {/* AC Disconnect */}
                  <g transform="translate(470, 40)">
                    <rect x="0" y="0" width="40" height="40" fill="#e8f5e8" stroke="#4caf50" strokeWidth="2" rx="3" />
                    <text x="20" y="25" textAnchor="middle" className="text-xs font-semibold fill-green-700">AC</text>
                    <text x="20" y="35" textAnchor="middle" className="text-xs fill-green-600">SW</text>
                  </g>

                  {/* Production Meter */}
                  <g transform="translate(560, 35)">
                    <circle cx="25" cy="25" r="25" fill="#fff8e1" stroke="#ffc107" strokeWidth="2" />
                    <text x="25" y="20" textAnchor="middle" className="text-xs font-semibold fill-amber-700">kWh</text>
                    <text x="25" y="32" textAnchor="middle" className="text-xs fill-amber-600">Meter</text>
                  </g>

                  {/* Main Panel */}
                  <g transform="translate(320, 150)">
                    <rect x="0" y="0" width="100" height="80" fill="#fce4ec" stroke="#e91e63" strokeWidth="2" rx="5" />
                    <text x="50" y="25" textAnchor="middle" className="text-xs font-semibold fill-pink-700">Main Panel</text>
                    <text x="50" y="40" textAnchor="middle" className="text-xs fill-pink-600">Service</text>
                    <text x="50" y="52" textAnchor="middle" className="text-xs fill-pink-600">Disconnect</text>
                    <text x="50" y="68" textAnchor="middle" className="text-xs fill-pink-600">& Breakers</text>
                  </g>

                  {/* Utility Grid */}
                  <g transform="translate(320, 270)">
                    <rect x="0" y="0" width="100" height="50" fill="#e0f2f1" stroke="#009688" strokeWidth="2" rx="5" />
                    <text x="50" y="25" textAnchor="middle" className="text-xs font-semibold fill-teal-700">Utility Grid</text>
                    <text x="50" y="38" textAnchor="middle" className="text-xs fill-teal-600">Connection</text>
                  </g>

                  {/* DC Connections */}
                  <line x1="170" y1="60" x2="220" y2="60" stroke="#2196f3" strokeWidth="3" />
                  <line x1="260" y1="60" x2="320" y2="60" stroke="#2196f3" strokeWidth="3" />
                  
                  {/* AC Connections */}
                  <line x1="420" y1="60" x2="470" y2="60" stroke="#4caf50" strokeWidth="3" />
                  <line x1="510" y1="60" x2="560" y2="60" stroke="#4caf50" strokeWidth="3" />
                  <line x1="585" y1="85" x2="585" y2="140" stroke="#4caf50" strokeWidth="3" />
                  <line x1="585" y1="140" x2="420" y2="140" stroke="#4caf50" strokeWidth="3" />
                  <line x1="420" y1="140" x2="420" y2="150" stroke="#4caf50" strokeWidth="3" />
                  <line x1="370" y1="230" x2="370" y2="270" stroke="#009688" strokeWidth="3" />

                    {/* Labels */}
                    <text x="195" y="55" textAnchor="middle" className="text-xs font-medium fill-blue-700">DC</text>
                    <text x="445" y="55" textAnchor="middle" className="text-xs font-medium fill-green-700">AC</text>
                    <text x="530" y="100" textAnchor="middle" className="text-xs font-medium fill-green-700">Net Metering</text>
                    <text x="370" y="250" textAnchor="middle" className="text-xs font-medium fill-teal-700">Grid Tie</text>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-8 left-8 right-8 text-center text-xs text-gray-500 border-t pt-2">
            System Layout & Electrical Schematic • Generated on {new Date().toLocaleDateString()}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdvancedPDFReport; 