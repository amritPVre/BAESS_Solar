
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Sun, Trees, Car, Cloud, LineChart } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { formatCurrency, formatNumber } from "@/utils/calculations";
import { useToast } from "@/hooks/use-toast";

interface PDFReportProps {
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  companyName: string;
  companyContact: string;
  systemSize: number;
  panelType: string;
  lcoe: number;
  annualRevenue: number;
  annualCost: number;
  netPresentValue: number;
  irr: number;
  paybackPeriod: { years: number; months: number };
  co2Reduction: number;
  treesEquivalent: number;
  vehicleMilesOffset: number;
  yearlyProduction: number[];
  cumulativeCashFlow: number[];
}

const PDFReport: React.FC<PDFReportProps> = ({
  clientName,
  clientEmail,
  clientAddress,
  companyName,
  companyContact,
  systemSize,
  panelType,
  lcoe,
  annualRevenue,
  annualCost,
  netPresentValue,
  irr,
  paybackPeriod,
  co2Reduction,
  treesEquivalent,
  vehicleMilesOffset,
  yearlyProduction,
  cumulativeCashFlow
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const generatePDF = async () => {
    if (!reportRef.current) return;

    try {
      // Show loading toast
      toast({
        title: "Generating PDF",
        description: "Please wait while we prepare your report...",
      });
      
      // Create a temporary container for the report that we'll remove later
      const tempContainer = document.createElement('div');
      tempContainer.className = 'pdf-temp-container';
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '800px';
      tempContainer.style.zIndex = '-1000';
      document.body.appendChild(tempContainer);
      
      // Clone the report for rendering
      const reportClone = reportRef.current.cloneNode(true) as HTMLElement;
      reportClone.style.display = 'block';
      reportClone.style.width = '800px';
      reportClone.style.height = 'auto';
      reportClone.style.overflow = 'visible';
      reportClone.style.position = 'relative';
      reportClone.style.backgroundColor = 'white';
      tempContainer.appendChild(reportClone);
      
      // Wait for any resources to load
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use html2canvas with more reliable settings
      const canvas = await html2canvas(reportClone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white',
        logging: true,
        windowWidth: 800,
        windowHeight: reportClone.offsetHeight,
        onclone: (document, clone) => {
          // Ensure all elements are properly rendered in the clone
          const clonedReport = clone.querySelector('.pdf-report') as HTMLElement;
          if (clonedReport) {
            clonedReport.style.display = 'block';
            clonedReport.style.width = '800px';
            clonedReport.style.visibility = 'visible';
            clonedReport.style.overflow = 'visible';
            
            // Ensure all child elements are visible
            const allElements = clonedReport.querySelectorAll('*');
            allElements.forEach(el => {
              (el as HTMLElement).style.visibility = 'visible';
            });
          }
        }
      });
      
      // Create PDF with appropriate dimensions
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Clean up - remove the temporary container
      document.body.removeChild(tempContainer);
      
      // Save the PDF
      pdf.save(`${clientName.replace(/\s+/g, '-')}-Solar-Report.pdf`);
      
      // Success toast
      toast({
        title: "PDF Generated Successfully",
        description: "Your report has been downloaded.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      
      // Error toast
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate yearly production sum
  const totalProduction = yearlyProduction.reduce((sum, val) => sum + val, 0);
  
  // Calculate 25-year savings (simple calculation)
  const totalSavings = cumulativeCashFlow[cumulativeCashFlow.length - 1];

  return (
    <div className="w-full">
      <Button 
        onClick={generatePDF} 
        className="mb-8 bg-solar hover:bg-solar-dark text-white"
      >
        <Download className="mr-2 h-4 w-4" />
        Generate PDF Report
      </Button>

      {/* Hidden PDF template - only rendered when generating the PDF */}
      <div className="hidden">
        <div 
          ref={reportRef} 
          className="pdf-report bg-white p-8" 
          style={{ width: "800px", minHeight: "1123px" }}
        >
          {/* Header - Simplified with solid colors instead of gradients */}
          <div className="bg-[#4CB571] p-6 rounded-lg text-white flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Solar PV System Report</h1>
              <p className="text-lg">Financial Analysis & Environmental Benefits</p>
            </div>
            <Sun className="h-16 w-16" />
          </div>

          {/* Client & System Info */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-[#F1F0FB] p-5 rounded-lg">
              <h2 className="text-xl font-semibold mb-3 text-[#1A1F2C] flex items-center">
                <FileText className="h-5 w-5 mr-2 text-[#8B5CF6]" />
                Client Information
              </h2>
              <div className="space-y-2 text-[#403E43]">
                <p><strong>Name:</strong> {clientName}</p>
                <p><strong>Email:</strong> {clientEmail}</p>
                <p><strong>Address:</strong> {clientAddress}</p>
                <p><strong>Prepared By:</strong> {companyName}</p>
                <p><strong>Contact:</strong> {companyContact}</p>
              </div>
            </div>
            
            <div className="bg-[#E5DEFF] p-5 rounded-lg">
              <h2 className="text-xl font-semibold mb-3 text-[#1A1F2C] flex items-center">
                <Sun className="h-5 w-5 mr-2 text-[#8B5CF6]" />
                System Specifications
              </h2>
              <div className="space-y-2 text-[#403E43]">
                <p><strong>System Size:</strong> {systemSize} kW</p>
                <p><strong>Panel Type:</strong> {panelType}</p>
                <p><strong>Estimated Annual Production:</strong> {formatNumber(yearlyProduction[0])} kWh</p>
                <p><strong>25-Year Production:</strong> {formatNumber(totalProduction)} kWh</p>
                <p><strong>Energy Cost:</strong> ${formatNumber(lcoe)}/kWh</p>
              </div>
            </div>
          </div>

          {/* Financial Summary - Changed from gradient to solid color */}
          <div className="bg-[#FDE1D3] p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#1A1F2C] flex items-center">
              <LineChart className="h-5 w-5 mr-2 text-[#F97316]" />
              Financial Summary
            </h2>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/80 p-4 rounded-lg text-center">
                <p className="text-sm text-[#8E9196]">Net Present Value</p>
                <p className="text-2xl font-bold text-[#1A1F2C]">{formatCurrency(netPresentValue)}</p>
              </div>
              
              <div className="bg-white/80 p-4 rounded-lg text-center">
                <p className="text-sm text-[#8E9196]">Internal Rate of Return</p>
                <p className="text-2xl font-bold text-[#1A1F2C]">{formatNumber(irr)}%</p>
              </div>
              
              <div className="bg-white/80 p-4 rounded-lg text-center">
                <p className="text-sm text-[#8E9196]">Payback Period</p>
                <p className="text-2xl font-bold text-[#1A1F2C]">{paybackPeriod.years} years {paybackPeriod.months} months</p>
              </div>
              
              <div className="bg-white/80 p-4 rounded-lg text-center">
                <p className="text-sm text-[#8E9196]">Annual Revenue</p>
                <p className="text-2xl font-bold text-[#1A1F2C]">{formatCurrency(annualRevenue)}</p>
              </div>
              
              <div className="bg-white/80 p-4 rounded-lg text-center">
                <p className="text-sm text-[#8E9196]">Annual Cost</p>
                <p className="text-2xl font-bold text-[#1A1F2C]">{formatCurrency(annualCost)}</p>
              </div>
              
              <div className="bg-white/80 p-4 rounded-lg text-center">
                <p className="text-sm text-[#8E9196]">25-Year Savings</p>
                <p className="text-2xl font-bold text-[#1A1F2C]">{formatCurrency(totalSavings)}</p>
              </div>
            </div>
          </div>

          {/* Environmental Benefits - Changed from gradient to solid color */}
          <div className="bg-[#D3E4FD] p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#1A1F2C] flex items-center">
              <Trees className="h-5 w-5 mr-2 text-[#4CB571]" />
              Environmental Benefits (Annual)
            </h2>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/80 p-4 rounded-lg text-center flex flex-col items-center">
                <Cloud className="h-8 w-8 mb-2 text-[#0EA5E9]" />
                <p className="text-sm text-[#8E9196]">CO2 Reduction</p>
                <p className="text-xl font-bold text-[#1A1F2C]">{formatNumber(co2Reduction)} kg/year</p>
              </div>
              
              <div className="bg-white/80 p-4 rounded-lg text-center flex flex-col items-center">
                <Trees className="h-8 w-8 mb-2 text-[#4CB571]" />
                <p className="text-sm text-[#8E9196]">Trees Equivalent</p>
                <p className="text-xl font-bold text-[#1A1F2C]">{formatNumber(treesEquivalent)}</p>
              </div>
              
              <div className="bg-white/80 p-4 rounded-lg text-center flex flex-col items-center">
                <Car className="h-8 w-8 mb-2 text-[#D946EF]" />
                <p className="text-sm text-[#8E9196]">Vehicle Miles Offset</p>
                <p className="text-xl font-bold text-[#1A1F2C]">{formatNumber(vehicleMilesOffset)}</p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-[#8E9196] mt-10">
            <p className="font-medium mb-1">Disclaimer:</p>
            <p>This report provides estimates based on the information provided and general assumptions. Actual results may vary depending on various factors including weather patterns, equipment performance, electricity prices, and maintenance. We recommend consulting with a certified solar professional for a detailed assessment.</p>
            <p className="mt-1">© {new Date().getFullYear()} {companyName}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFReport;
