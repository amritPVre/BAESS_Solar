import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Building2, 
  Users, 
  Briefcase, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info,
  Download,
  Image as ImageIcon,
  X,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { boqParameterManager } from '@/services/BOQParameterManager';
import { generateFeasibilityReport, downloadReportAsMarkdown, downloadReportAsText } from '@/services/feasibilityReportGenerator';
import { useAICredits } from '@/hooks/useAICredits';
import AdvancedPDFReport from './AdvancedPDFReport';

// Simplified type definitions - only fields used in report generation
export interface ReportFormData {
  reportTitle: string;
  userType: 'EPC_CONTRACTOR' | 'PROJECT_OWNER';
  
  companyInfo: {
    companyName: string; // Required
    companyAddress: string; // Optional
    authorName: string; // Required
    authorTitle: string; // Required
    companyLogo?: string; // Optional - base64 encoded image
  };
  
  clientInfo?: {
    clientName: string; // Required for EPC
    clientCompany: string; // Required for EPC
    clientAddress: string; // Optional for EPC
  };
  
  projectInfo: {
    projectName: string; // Required
    projectObjective: string; // Required
    siteAddress: string; // Optional
  };
  
}

interface AIFeasibilityReportProps {
  // All existing data from app state - passed as-is
  solarResults?: any;
  systemParams?: any;
  selectedPanel?: any;
  selectedInverter?: any;
  polygonConfigs?: any[];
  acConfiguration?: any;
  detailedLosses?: any;
  consolidatedBOQ?: any[];
  boqCostSummary?: any;
  financialParams?: any;
  financialResults?: any;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
    timezone: string;
    elevation?: number;
    country?: string;
    state?: string;
  };
  metadata?: {
    annualEnergyYear1: number;
    totalStringCount: number;
    manualInverterCount: number;
    capacity: number;
    isCentralInverter: boolean;
  };
  
  // Initial data for restoring saved projects
  initialReportFormData?: ReportFormData | null;
  initialGeneratedReport?: string | null;
  
  // Callback to update parent with form data for saving
  onReportFormDataUpdate?: (formData: ReportFormData) => void;
  onGeneratedReportUpdate?: (report: string | null) => void;
}

export const AIFeasibilityReport: React.FC<AIFeasibilityReportProps> = ({
  solarResults,
  systemParams,
  selectedPanel,
  selectedInverter,
  polygonConfigs,
  acConfiguration,
  detailedLosses,
  consolidatedBOQ,
  boqCostSummary,
  financialParams,
  financialResults,
  location,
  metadata,
  initialReportFormData,
  initialGeneratedReport,
  onReportFormDataUpdate,
  onGeneratedReportUpdate
}) => {
  // Simplified form state
  const [formData, setFormData] = useState<ReportFormData>({
    reportTitle: '',
    userType: 'PROJECT_OWNER',
    companyInfo: {
      companyName: '',
      companyAddress: '',
      authorName: '',
      authorTitle: ''
    },
    clientInfo: {
      clientName: '',
      clientCompany: '',
      clientAddress: ''
    },
    projectInfo: {
      projectName: '',
      projectObjective: '',
      siteAddress: location?.address || ''
    }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  
  // AI Credits integration
  const { checkAndDeduct, hasCredits, balance, refreshBalance } = useAICredits();

  // Restore saved form data when component mounts
  useEffect(() => {
    if (initialReportFormData) {
      console.log('📋 Restoring AI Report form data from saved project:', initialReportFormData);
      setFormData(initialReportFormData);
    }
  }, []); // Only run once on mount

  // Restore saved generated report when component mounts
  useEffect(() => {
    if (initialGeneratedReport) {
      console.log('📄 Restoring AI Generated Report from saved project');
      setGeneratedReport(initialGeneratedReport);
    }
  }, []); // Only run once on mount

  // Sync form data changes back to parent for saving
  useEffect(() => {
    if (onReportFormDataUpdate) {
      onReportFormDataUpdate(formData);
    }
  }, [formData, onReportFormDataUpdate]);

  // Sync generated report changes back to parent for saving
  useEffect(() => {
    if (onGeneratedReportUpdate) {
      onGeneratedReportUpdate(generatedReport);
    }
  }, [generatedReport, onGeneratedReportUpdate]);

  // Check data availability
  const dataAvailability = useMemo(() => {
    const hasFinancial = !!(financialParams && financialResults);
    console.log('🔍 Financial Data Check:', { 
      params: !!financialParams, 
      results: !!financialResults,
      hasFinancial 
    });
    
    return {
      solarResults: !!solarResults,
      systemParams: !!systemParams,
      components: !!(selectedPanel && selectedInverter),
      polygonConfigs: !!(polygonConfigs && polygonConfigs.length > 0),
      acConfiguration: !!acConfiguration,
      boq: !!(consolidatedBOQ && consolidatedBOQ.length > 0),
      financial: hasFinancial,
      location: !!location
    };
  }, [solarResults, systemParams, selectedPanel, selectedInverter, polygonConfigs, acConfiguration, consolidatedBOQ, financialParams, financialResults, location]);

  const isDataReady = useMemo(() => {
    return Object.values(dataAvailability).every(v => v === true);
  }, [dataAvailability]);


  // Collect all data for LLM prompt
  const collectFeasibilityReportData = useCallback(() => {
    console.log('📊 Collecting Feasibility Report Data...');
    
    const data = {
      // 1. Report Form Data (new)
      reportForm: formData,
      
      // 2. BOQ Parameters (existing - same as AI BOQ)
      boqParameters: boqParameterManager.getCurrentParameters(),
      
      // 3. PVWatts Results (existing)
      solarResults: solarResults,
      
      // 4. System Parameters (existing)
      systemParams: systemParams,
      
      // 5. Components (existing)
      selectedPanel: selectedPanel,
      selectedInverter: selectedInverter,
      
      // 6. Polygon Configs (existing)
      polygonConfigs: polygonConfigs,
      
      // 7. AC Configuration (existing)
      acConfiguration: acConfiguration,
      
      // 8. Detailed Losses (existing)
      detailedLosses: detailedLosses,
      
      // 9. Consolidated BOQ (existing)
      consolidatedBOQ: consolidatedBOQ,
      boqCostSummary: boqCostSummary,
      
      // 10. Financial Parameters (existing)
      financialParams: financialParams,
      
      // 11. Financial Results (existing)
      financialResults: financialResults,
      
      // 12. Location Data (existing)
      location: location,
      
      // 13. Additional Metadata
      metadata: metadata
    };

    console.log('✅ Data Collection Complete');
    console.log('📋 Available Data Keys:', Object.keys(data));
    console.log('🔍 Data Availability:', dataAvailability);
    
    return data;
  }, [formData, solarResults, systemParams, selectedPanel, selectedInverter, polygonConfigs, acConfiguration, detailedLosses, consolidatedBOQ, boqCostSummary, financialParams, financialResults, location, metadata, dataAvailability]);

  // Handle form field changes
  const handleFieldChange = useCallback((section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev as any)[section],
        [field]: value
      }
    }));
  }, []);

  // Handle logo upload
  const handleLogoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo file size must be less than 2MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({
        ...prev,
        companyInfo: {
          ...prev.companyInfo,
          companyLogo: base64String
        }
      }));
      toast.success('Logo uploaded successfully!');
    };
    reader.onerror = () => {
      toast.error('Failed to upload logo. Please try again.');
    };
    reader.readAsDataURL(file);
  }, []);

  // Remove logo
  const handleRemoveLogo = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      companyInfo: {
        ...prev.companyInfo,
        companyLogo: undefined
      }
    }));
    toast.success('Logo removed');
  }, []);


  // Generate feasibility report
  const handleGenerateReport = useCallback(async () => {
    if (!isDataReady) {
      toast.error('Please complete all required system configurations first');
      return;
    }

    if (!formData.reportTitle || !formData.projectInfo.projectName) {
      toast.error('Please provide report title and project name');
      return;
    }

    if (!formData.companyInfo.companyName) {
      toast.error('Please provide company information');
      return;
    }

    // Check AI credits BEFORE starting generation
    const hasEnoughCredits = await hasCredits(1); // AI Report costs 1 credit
    if (!hasEnoughCredits) {
      toast.error('Insufficient AI credits. You need 1 credit for AI Report generation.', {
        description: `Your current balance: ${balance?.remaining || 0} credits`
      });
      return;
    }

    try {
      setIsGenerating(true);
      toast.info('Generating your feasibility report... This may take 1-2 minutes.');
      
      // Collect all data
      const reportData = collectFeasibilityReportData();
      
      console.log('🚀 Starting Feasibility Report Generation...');
      console.log('📦 Report Data Package:', reportData);
      
      // Generate report using Gemini AI (using Gemini 2.5 Flash-Lite)
      const result = await generateFeasibilityReport(reportData, 'gemini-2.5-flash-lite');
      
      if (result.success && result.content) {
        setGeneratedReport(result.content);
        toast.success('Feasibility report generated successfully!');
        console.log('✅ Report generated, length:', result.content.length, 'characters');
        
        // Deduct AI credits after successful generation
        try {
          const projectId = null; // Will be null for unsaved projects
          const success = await checkAndDeduct(
            projectId,
            'ai_report_generation',
            `Generated AI Feasibility Report: ${formData.reportTitle}`
          );
          
          if (success) {
            await refreshBalance(); // Refresh to show updated balance immediately
            console.log('✅ Deducted 1 AI credit for AI report generation');
          } else {
            console.warn('⚠️ Failed to deduct AI credits, but report was generated');
          }
        } catch (error) {
          console.error('❌ Error deducting AI credits:', error);
          // Don't show error to user - report was already generated successfully
        }
      } else {
        toast.error(result.error || 'Failed to generate report');
        console.error('❌ Generation failed:', result.error);
      }
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [isDataReady, formData, collectFeasibilityReportData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Sparkles className="h-8 w-8 text-purple-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              AI-Powered Feasibility Report Generator
            </h2>
            <p className="text-gray-700 mb-4">
              Generate a professional, bankable feasibility study report using AI and your project's technical & financial data.
            </p>
            
            {/* Data Readiness Status */}
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                {isDataReady ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
                <h3 className="font-semibold text-gray-900">
                  {isDataReady ? 'System Data Ready' : 'Complete Required Configurations'}
                </h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  {dataAvailability.solarResults ? '✅' : '⚠️'}
                  <span className={dataAvailability.solarResults ? 'text-green-700' : 'text-orange-600'}>
                    Energy Analysis
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {dataAvailability.components ? '✅' : '⚠️'}
                  <span className={dataAvailability.components ? 'text-green-700' : 'text-orange-600'}>
                    Components
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {dataAvailability.boq ? '✅' : '⚠️'}
                  <span className={dataAvailability.boq ? 'text-green-700' : 'text-orange-600'}>
                    BOQ Data
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {dataAvailability.financial ? '✅' : '⚠️'}
                  <span className={dataAvailability.financial ? 'text-green-700' : 'text-orange-600'}>
                    Financial Analysis
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Form Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">
            <FileText className="h-4 w-4 mr-2" />
            Report Info
          </TabsTrigger>
          <TabsTrigger value="details">
            <Building2 className="h-4 w-4 mr-2" />
            Company & Project
          </TabsTrigger>
          <TabsTrigger value="client" disabled={formData.userType === 'PROJECT_OWNER'}>
            <Users className="h-4 w-4 mr-2" />
            Client (Optional)
          </TabsTrigger>
        </TabsList>

        {/* Report Info Tab - Simplified */}
        <TabsContent value="info" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Report Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="reportTitle">Report Title *</Label>
                <Input
                  id="reportTitle"
                  placeholder="e.g., Solar PV Feasibility Study - ABC Corporation"
                  value={formData.reportTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, reportTitle: e.target.value }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">This will appear as the main title of your report</p>
              </div>

              <div>
                <Label>Who is preparing this report? *</Label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="userType"
                      value="PROJECT_OWNER"
                      checked={formData.userType === 'PROJECT_OWNER'}
                      onChange={(e) => setFormData(prev => ({ ...prev, userType: e.target.value as any }))}
                      className="text-blue-600"
                    />
                    <div>
                      <div className="font-medium">Project Owner/Developer</div>
                      <div className="text-sm text-gray-600">For own use or internal stakeholders</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="userType"
                      value="EPC_CONTRACTOR"
                      checked={formData.userType === 'EPC_CONTRACTOR'}
                      onChange={(e) => setFormData(prev => ({ ...prev, userType: e.target.value as any }))}
                      className="text-blue-600"
                    />
                    <div>
                      <div className="font-medium">EPC Contractor</div>
                      <div className="text-sm text-gray-600">Preparing for a client (Client tab will be enabled)</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Company & Project Details Tab - Consolidated */}
        <TabsContent value="details" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Company Information
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="e.g., SolarTech Solutions Ltd."
                    value={formData.companyInfo.companyName}
                    onChange={(e) => handleFieldChange('companyInfo', 'companyName', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="companyAddress">Company Address (Optional)</Label>
                  <Input
                    id="companyAddress"
                    placeholder="City, Country"
                    value={formData.companyInfo.companyAddress}
                    onChange={(e) => handleFieldChange('companyInfo', 'companyAddress', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="authorName">Report Author Name *</Label>
                  <Input
                    id="authorName"
                    placeholder="John Doe"
                    value={formData.companyInfo.authorName}
                    onChange={(e) => handleFieldChange('companyInfo', 'authorName', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="authorTitle">Author Title/Position *</Label>
                  <Input
                    id="authorTitle"
                    placeholder="e.g., Senior Solar Engineer"
                    value={formData.companyInfo.authorTitle}
                    onChange={(e) => handleFieldChange('companyInfo', 'authorTitle', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Company Logo Upload */}
              <div className="pt-4 border-t">
                <Label htmlFor="companyLogo" className="flex items-center gap-2 mb-3">
                  <ImageIcon className="h-4 w-4 text-blue-600" />
                  Company Logo (Optional)
                </Label>
                <div className="flex items-start gap-4">
                  {/* Logo Preview */}
                  {formData.companyInfo.companyLogo ? (
                    <div className="flex-shrink-0">
                      <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                        <img 
                          src={formData.companyInfo.companyLogo} 
                          alt="Company Logo" 
                          className="w-full h-full object-contain p-2"
                        />
                        <button
                          onClick={handleRemoveLogo}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          title="Remove logo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-center">Logo uploaded</p>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <div className="flex-1">
                    <div className="space-y-2">
                      <label htmlFor="companyLogo" className="cursor-pointer">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          <Upload className="h-4 w-4" />
                          {formData.companyInfo.companyLogo ? 'Change Logo' : 'Upload Logo'}
                        </div>
                      </label>
                      <input
                        id="companyLogo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <p className="text-xs text-gray-500">
                        Upload your company logo (PNG, JPG, or SVG). Max size: 2MB. Logo will be displayed in the report header.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Project Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  placeholder="e.g., 100 kWp Rooftop Solar Installation"
                  value={formData.projectInfo.projectName}
                  onChange={(e) => handleFieldChange('projectInfo', 'projectName', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="projectObjective">Project Objective *</Label>
                <Textarea
                  id="projectObjective"
                  placeholder="What problem does this project solve? e.g., Reduce electricity costs and carbon footprint..."
                  value={formData.projectInfo.projectObjective}
                  onChange={(e) => handleFieldChange('projectInfo', 'projectObjective', e.target.value)}
                  className="mt-1"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Describe the main goals and expected outcomes of the project
                </p>
              </div>

              <div>
                <Label htmlFor="siteAddress">Site Address (Optional)</Label>
                <Input
                  id="siteAddress"
                  placeholder="Project site location"
                  value={formData.projectInfo.siteAddress}
                  onChange={(e) => handleFieldChange('projectInfo', 'siteAddress', e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-filled from Location tab, editable
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Client Info Tab - Simplified (only for EPC Contractors) */}
        <TabsContent value="client" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Client Information (Prepared For)
            </h3>
            
            {formData.userType === 'EPC_CONTRACTOR' ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-700">
                    <Info className="h-4 w-4 inline mr-1" />
                    These fields are optional. They will be included in the report if provided.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName">Client Contact Name</Label>
                    <Input
                      id="clientName"
                      placeholder="Contact person name"
                      value={formData.clientInfo?.clientName || ''}
                      onChange={(e) => handleFieldChange('clientInfo', 'clientName', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="clientCompany">Client Company Name</Label>
                    <Input
                      id="clientCompany"
                      placeholder="Company name"
                      value={formData.clientInfo?.clientCompany || ''}
                      onChange={(e) => handleFieldChange('clientInfo', 'clientCompany', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="clientAddress">Client Address (Optional)</Label>
                  <Input
                    id="clientAddress"
                    placeholder="City, Country"
                    value={formData.clientInfo?.clientAddress || ''}
                    onChange={(e) => handleFieldChange('clientInfo', 'clientAddress', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Info className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Client information is only required for EPC contractors.</p>
                <p className="text-sm mt-2">Switch to "EPC Contractor" in Report Info tab to enable this section.</p>
              </div>
            )}
          </Card>
        </TabsContent>


      </Tabs>

      {/* Generated Report Display */}
      {generatedReport && (
        <Card className="p-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-bold text-lg text-green-900">Feasibility Report Generated Successfully!</h3>
                <p className="text-sm text-green-700">Your comprehensive feasibility study is ready for download</p>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {/* Primary PDF Download */}
              {(() => {
                // Use the full generated report as Executive Summary
                // No need to separate SWOT since we're not using it
                console.log('📊 AIFeasibilityReport: Passing AI content to PDF');
                console.log('  - Content length:', generatedReport.length, 'chars');
                
                return (
                  <AdvancedPDFReport
                    results={solarResults}
                    systemParams={systemParams}
                    selectedPanel={selectedPanel}
                    selectedInverter={selectedInverter}
                    polygonConfigs={polygonConfigs}
                    acConfiguration={acConfiguration}
                    detailedLosses={detailedLosses}
                    financialResults={financialResults}
                    financialParams={financialParams}
                    boqData={consolidatedBOQ}
                    aiExecutiveSummary={generatedReport}
                    aiSwotAnalysis={undefined}
                    companyInfo={{
                      companyName: formData.companyInfo.companyName,
                      companyAddress: formData.companyInfo.companyAddress,
                      authorName: formData.companyInfo.authorName,
                      authorTitle: formData.companyInfo.authorTitle,
                      companyLogo: formData.companyInfo.companyLogo,
                    }}
                    clientInfo={formData.userType === 'EPC_CONTRACTOR' && formData.clientInfo ? {
                      clientName: formData.clientInfo.clientName,
                      clientCompany: formData.clientInfo.clientCompany,
                      clientAddress: formData.clientInfo.clientAddress,
                    } : undefined}
                    projectInfo={{
                      projectName: formData.projectInfo.projectName,
                      projectObjective: formData.projectInfo.projectObjective,
                      siteAddress: formData.projectInfo.siteAddress,
                    }}
                  />
                );
              })()}
              
              {/* Alternative formats */}
              <Button
                onClick={() => downloadReportAsMarkdown(
                  generatedReport,
                  `${formData.projectInfo.projectName.replace(/[^a-z0-9]/gi, '_')}_Feasibility_Study`
                )}
                variant="outline"
                className="gap-2 border-green-600 text-green-700 hover:bg-green-100"
              >
                <Download className="h-4 w-4" />
                Download Markdown
              </Button>
              <Button
                onClick={() => downloadReportAsText(
                  generatedReport,
                  `${formData.projectInfo.projectName.replace(/[^a-z0-9]/gi, '_')}_Feasibility_Study`
                )}
                variant="outline"
                className="gap-2 border-green-600 text-green-700 hover:bg-green-100"
              >
                <Download className="h-4 w-4" />
                Download Text
              </Button>
              <Button
                onClick={() => setGeneratedReport(null)}
                variant="ghost"
                className="text-gray-600 hover:text-gray-900"
              >
                Generate New
              </Button>
            </div>
          </div>
          
          {/* Report Preview */}
          <div className="mt-4 p-4 bg-white rounded-lg border border-green-200 max-h-96 overflow-y-auto">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                {generatedReport.substring(0, 2000)}...
                {generatedReport.length > 2000 && (
                  <span className="text-gray-500 italic">
                    \n\n[Preview truncated - {Math.ceil((generatedReport.length - 2000) / 1000)}K more characters in full report]
                  </span>
                )}
              </pre>
            </div>
          </div>
        </Card>
      )}

      {/* Generate Button */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1">Ready to Generate Report?</h3>
            <p className="text-sm text-gray-600">
              {isDataReady 
                ? 'All system data is available. Estimated generation time: 1-2 minutes.'
                : 'Please complete all required configurations (Location, Components, BOQ, Financial Analysis) first.'
              }
            </p>
          </div>
          
          <Button
            onClick={handleGenerateReport}
            disabled={!isDataReady || isGenerating}
            size="lg"
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Feasibility Report
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

