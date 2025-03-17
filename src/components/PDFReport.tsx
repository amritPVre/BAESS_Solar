
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Sun, Trees, Car, Cloud, LineChart, MapPin, BarChart3 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { formatCurrency, formatNumber } from "@/utils/calculations";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
  location?: { lat: number; lng: number };
  city?: string;
  country?: string;
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
  cumulativeCashFlow,
  location,
  city,
  country
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const page3Ref = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Calculate yearly production sum
  const totalProduction = yearlyProduction.reduce((sum, val) => sum + val, 0);
  
  // Calculate 25-year savings (simple calculation)
  const totalSavings = cumulativeCashFlow[cumulativeCashFlow.length - 1];

  // Get currency symbol
  const getCurrencySymbol = (currency: string) => {
    const currencies: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: 'C$',
      AUD: 'A$',
      INR: '₹',
      CNY: '¥',
    };
    return currencies[currency || 'USD'] || '$';
  };

  const currencySymbol = getCurrencySymbol(user?.preferredCurrency || 'USD');

  const generatePDF = async () => {
    if (!reportRef.current || !page2Ref.current || !page3Ref.current) return;

    try {
      // Show loading toast
      toast({
        title: "Generating PDF",
        description: "Please wait while we prepare your report...",
      });
      
      // Create a PDF document with A4 size
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Capture first page
      const canvas1 = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white',
      });
      
      // Add first page
      const imgData1 = canvas1.toDataURL('image/jpeg', 1.0);
      pdf.addImage(imgData1, 'JPEG', 0, 0, 210, 297);
      
      // Capture second page
      const canvas2 = await html2canvas(page2Ref.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white',
      });
      
      // Add second page
      pdf.addPage();
      const imgData2 = canvas2.toDataURL('image/jpeg', 1.0);
      pdf.addImage(imgData2, 'JPEG', 0, 0, 210, 297);
      
      // Capture third page
      const canvas3 = await html2canvas(page3Ref.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white',
      });
      
      // Add third page
      pdf.addPage();
      const imgData3 = canvas3.toDataURL('image/jpeg', 1.0);
      pdf.addImage(imgData3, 'JPEG', 0, 0, 210, 297);
      
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

  return (
    <div className="w-full">
      <Button 
        onClick={generatePDF} 
        className="mb-8 bg-solar hover:bg-solar-dark text-white"
      >
        <Download className="mr-2 h-4 w-4" />
        Generate PDF Report
      </Button>

      {/* Hidden PDF templates - only rendered when generating the PDF */}
      <div className="hidden">
        {/* Page 1 - Main Overview */}
        <div 
          ref={reportRef} 
          className="pdf-report bg-white p-8" 
          style={{ width: "800px", height: "1123px", position: "relative" }}
        >
          {/* Header */}
          <div className="bg-[#4CB571] p-6 rounded-lg text-white flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Solar PV System Report</h1>
              <p className="text-lg">Financial Analysis & Environmental Benefits</p>
            </div>
            <Sun className="h-16 w-16" />
          </div>

          {/* Client & System Info */}
          <div className="grid grid-cols-1 gap-6 mb-8">
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
          </div>
          
          {/* System Specifications */}
          <div className="mb-8 bg-[#E5DEFF] p-5 rounded-lg">
            <h2 className="text-xl font-semibold mb-3 text-[#1A1F2C] flex items-center">
              <Sun className="h-5 w-5 mr-2 text-[#8B5CF6]" />
              System Specifications
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 text-[#403E43]">
                <p><strong>Total System Capacity:</strong> {systemSize} kW</p>
                <p><strong>Panel Type:</strong> {panelType}</p>
                <p><strong>Annual Energy Generation:</strong> {formatNumber(yearlyProduction[0] / 1000)} MWh</p>
                <p><strong>25-Year Production:</strong> {formatNumber(totalProduction / 1000)} MWh</p>
                <p><strong>Energy Cost:</strong> {currencySymbol}{formatNumber(lcoe)}/kWh</p>
              </div>
              <div className="space-y-2 text-[#403E43]">
                <p><strong>Total Initial Investment:</strong> {currencySymbol}{formatNumber(annualRevenue * 3)}</p>
                <p><strong>Annual Revenue:</strong> {currencySymbol}{formatNumber(annualRevenue)}</p>
                <p><strong>Annual Costs:</strong> {currencySymbol}{formatNumber(annualCost)}</p>
                <p><strong>Net Present Value:</strong> {currencySymbol}{formatNumber(netPresentValue)}</p>
                <p><strong>Payback Period:</strong> {paybackPeriod.years} years {paybackPeriod.months} months</p>
              </div>
            </div>
          </div>

          {/* Location Information */}
          {location && (
            <div className="mb-8 bg-[#E1EFF6] p-5 rounded-lg">
              <h2 className="text-xl font-semibold mb-3 text-[#1A1F2C] flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-[#2563EB]" />
                Location Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-[#403E43]">
                  <p><strong>Location:</strong> {city}, {country}</p>
                  <p><strong>Coordinates:</strong> {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
                </div>
                <div className="h-48 rounded-lg overflow-hidden border-2 border-[#2563EB]/20">
                  {/* Map Placeholder - would be replaced with actual map in implementation */}
                  <div className="bg-blue-100 h-full w-full flex items-center justify-center">
                    <MapPin className="h-12 w-12 text-[#2563EB]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Environmental Benefits */}
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

          {/* Footer */}
          <div className="text-xs text-[#8E9196] absolute bottom-8 left-8 right-8">
            <p className="font-medium mb-1">Disclaimer:</p>
            <p>This report provides estimates based on the information provided and general assumptions. Actual results may vary depending on various factors including weather patterns, equipment performance, electricity prices, and maintenance. We recommend consulting with a certified solar professional for a detailed assessment.</p>
            <p className="mt-1">© {new Date().getFullYear()} {companyName}. All rights reserved.</p>
          </div>
        </div>

        {/* Page 2 - Payback Period and Production Charts */}
        <div 
          ref={page2Ref} 
          className="pdf-report bg-white p-8" 
          style={{ width: "800px", height: "1123px", position: "relative" }}
        >
          {/* Header */}
          <div className="bg-[#4CB571] p-6 rounded-lg text-white flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Financial Performance</h1>
              <p className="text-lg">Payback Period and Energy Production Charts</p>
            </div>
            <LineChart className="h-16 w-16" />
          </div>

          {/* Financial Summary */}
          <div className="bg-[#FDE1D3] p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#1A1F2C] flex items-center">
              <LineChart className="h-5 w-5 mr-2 text-[#F97316]" />
              Financial Summary
            </h2>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/80 p-4 rounded-lg text-center">
                <p className="text-sm text-[#8E9196]">Net Present Value</p>
                <p className="text-2xl font-bold text-[#1A1F2C]">{currencySymbol}{formatNumber(netPresentValue)}</p>
              </div>
              
              <div className="bg-white/80 p-4 rounded-lg text-center">
                <p className="text-sm text-[#8E9196]">Internal Rate of Return</p>
                <p className="text-2xl font-bold text-[#1A1F2C]">{formatNumber(irr)}%</p>
              </div>
              
              <div className="bg-white/80 p-4 rounded-lg text-center">
                <p className="text-sm text-[#8E9196]">Payback Period</p>
                <p className="text-2xl font-bold text-[#1A1F2C]">{paybackPeriod.years} years {paybackPeriod.months} months</p>
              </div>
            </div>
          </div>

          {/* Payback Period Chart */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-[#1A1F2C] flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-[#8B5CF6]" />
              Payback Period Visualization
            </h2>
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
              <div className="h-64 rounded-lg overflow-hidden">
                {/* Placeholder for Payback Period Chart */}
                <div className="bg-gradient-to-r from-solar-light to-solar/10 h-full w-full flex items-center justify-center">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 mx-auto text-solar mb-2" />
                    <p className="text-gray-600">Payback Period: {paybackPeriod.years} years {paybackPeriod.months} months</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 25 Year Energy Production Chart */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-[#1A1F2C] flex items-center">
              <Sun className="h-5 w-5 mr-2 text-[#F97316]" />
              25-Year Energy Production
            </h2>
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
              <div className="h-64 rounded-lg overflow-hidden">
                {/* Placeholder for Energy Production Chart */}
                <div className="bg-gradient-to-r from-solar-light to-blue-50 h-full w-full flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-solar mb-2" />
                    <p className="text-gray-600">Total Production: {formatNumber(totalProduction / 1000)} MWh</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs text-[#8E9196] absolute bottom-8 left-8 right-8">
            <p className="font-medium mb-1">Disclaimer:</p>
            <p>This report provides estimates based on the information provided and general assumptions. Actual results may vary depending on various factors including weather patterns, equipment performance, electricity prices, and maintenance. We recommend consulting with a certified solar professional for a detailed assessment.</p>
            <p className="mt-1">© {new Date().getFullYear()} {companyName}. All rights reserved.</p>
          </div>
        </div>

        {/* Page 3 - Cumulative Cash Flow Table */}
        <div 
          ref={page3Ref} 
          className="pdf-report bg-white p-8" 
          style={{ width: "800px", height: "1123px", position: "relative" }}
        >
          {/* Header */}
          <div className="bg-[#4CB571] p-6 rounded-lg text-white flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">25-Year Financial Performance</h1>
              <p className="text-lg">Detailed Yearly Production and Cash Flow</p>
            </div>
            <BarChart3 className="h-16 w-16" />
          </div>

          {/* Cumulative Cash Flow Table */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-[#1A1F2C]">
              25-Year Production & Cash Flow
            </h2>
            <div className="bg-white p-4 rounded-lg border border-gray-200 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-3 text-left border-b">Year</th>
                    <th className="py-2 px-3 text-left border-b">Energy Production (kWh)</th>
                    <th className="py-2 px-3 text-left border-b">Cash Flow ({currencySymbol})</th>
                    <th className="py-2 px-3 text-left border-b">Cumulative Cash Flow ({currencySymbol})</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyProduction.slice(0, 25).map((production, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-2 px-3 border-b">{index + 1}</td>
                      <td className="py-2 px-3 border-b">{formatNumber(production)}</td>
                      <td className="py-2 px-3 border-b">
                        {currencySymbol}{formatNumber(index < cumulativeCashFlow.length - 1 
                          ? cumulativeCashFlow[index + 1] - cumulativeCashFlow[index] 
                          : 0)}
                      </td>
                      <td className={`py-2 px-3 border-b ${
                        cumulativeCashFlow[index] >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {currencySymbol}{formatNumber(cumulativeCashFlow[index])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs text-[#8E9196] absolute bottom-8 left-8 right-8">
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
