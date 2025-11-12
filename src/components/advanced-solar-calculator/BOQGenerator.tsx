import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { generateBOQEstimates, getEnhancedBOQTemplate, getComprehensiveBOQTemplate } from "@/utils/aiServices";
import { type ACConfiguration } from "./ACSideConfiguration";
import { 
  Bot, 
  Receipt, 
  Zap, 
  Building2, 
  Factory,
  Home,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Calculator
} from "lucide-react";

// Define interfaces for BOQ data structure
interface BOQLineItem {
  id: string;
  item: string;
  description: string;
  unit: string;
  quantity: number;
  unitRate?: number;
  amount?: number;
  source: 'design_summary' | 'calculated_estimated';
  category: string;
  specifications?: string;
}

// Define component interfaces
interface SolarPanel {
  id?: string;
  manufacturer: string;
  model?: string;
  name?: string;
  power_rating?: number;
  nominal_power?: number;
  efficiency?: number;
  technology?: string;
  panel_type?: string;
  cell_type?: string;
  bifaciality?: number;
  voc_v?: number;
  vmp_v?: number;
  isc_a?: number;
  [key: string]: unknown;
}

interface Inverter {
  id?: string;
  manufacturer: string;
  model?: string;
  name?: string;
  nominal_ac_power_kw?: number;
  power_rating?: number;
  efficiency?: number;
  phase?: string;
  nominal_ac_voltage_v?: number;
  inverter_type?: string;
  min_mpp_voltage_v?: number;
  max_dc_voltage_v?: number;
  max_mpp_voltage_v?: number;
  [key: string]: unknown;
}

interface PolygonConfig {
  area: number;
  moduleCount: number;
  structureType?: string;
  azimuth?: number;
  tiltAngle?: number;
  capacityKw: number;
  tableCount?: number;
  [key: string]: unknown;
}

// Central inverter sizing data type (matches the one in index.tsx)
interface CentralStringSizingData {
  totalDCDBPerInverter: number;
  actualPVStringsPerDCDB: number;
  actualPVStringsPerMPPT: number;
  dcdbStringInputsPerDCDB: number;
  totalDCDBInSystem: number;
  dcdbConfiguration: {
    dcdbPerInverter: number;
    stringsPerDCDB: number;
    totalDCDBCount: number;
    mpptUtilization: number;
  };
}

interface DesignSummaryData {
  // System data
  capacity: number;
  totalModules: number;
  inverterCount: number;
  dcAcRatio: number;
  
  // Location data
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  projectApplication: string;
  projectInstallation: string;
  
  // Component data
  selectedPanel: SolarPanel | null;
  selectedInverter: Inverter | null;
  
  // Configuration data
  polygonConfigs: PolygonConfig[];
  acConfiguration: ACConfiguration | null;
  
  // String and electrical data
  totalStringCount: number;
  averageStringVoltage: number;
  averageStringCurrent: number;
  
  // Central inverter data (if applicable)
  centralStringSizingData?: CentralStringSizingData | null;
  isCentralInverter: boolean;
  useDCCombiner: boolean;
  
  // Temperature parameters
  lowestTemperature: number;
  highestTemperature: number;
  
  // Index signature for additional properties
  [key: string]: unknown;
}

interface BOQGeneratorProps {
  designSummaryData: DesignSummaryData;
}

const BOQGenerator: React.FC<BOQGeneratorProps> = ({ designSummaryData }) => {
  const [selectedAI, setSelectedAI] = useState<'openai' | 'gemini'>('openai');
  const [boqTemplate, setBOQTemplate] = useState<'residential_commercial' | 'industrial_utility'>('residential_commercial');
  const [boqItems, setBOQItems] = useState<BOQLineItem[]>([]);
  const [comprehensiveBOQItems, setComprehensiveBOQItems] = useState<BOQLineItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');

  // Determine project type based on design summary
  useEffect(() => {
    if (designSummaryData.projectApplication) {
      if (designSummaryData.projectApplication.toLowerCase().includes('industrial') || 
          designSummaryData.projectApplication.toLowerCase().includes('utility')) {
        setBOQTemplate('industrial_utility');
      } else {
        setBOQTemplate('residential_commercial');
      }
    }
  }, [designSummaryData.projectApplication]);

  // Load comprehensive BOQ items
  useEffect(() => {
    // Convert design data to compatible format for the comprehensive template
    const compatibleDesignData = {
      ...designSummaryData,
      acConfiguration: designSummaryData.acConfiguration as (ACConfiguration & { [key: string]: unknown }) | null,
      centralStringSizingData: designSummaryData.centralStringSizingData as (CentralStringSizingData & { [key: string]: unknown }) | null,
    };
    
    const comprehensiveItems = getComprehensiveBOQTemplate(compatibleDesignData);
    setComprehensiveBOQItems(comprehensiveItems);
  }, [designSummaryData]);

  // Use enhanced BOQ template from AI services
  const getBaseTemplate = (template: 'residential_commercial' | 'industrial_utility'): BOQLineItem[] => {
    // Convert design data to compatible format for the enhanced template
    const compatibleDesignData = {
      ...designSummaryData,
      acConfiguration: designSummaryData.acConfiguration as (ACConfiguration & { [key: string]: unknown }) | null,
      centralStringSizingData: designSummaryData.centralStringSizingData as (CentralStringSizingData & { [key: string]: unknown }) | null,
    };
    return getEnhancedBOQTemplate(template, compatibleDesignData);
  };

  const generateAIPrompt = (template: 'residential_commercial' | 'industrial_utility', designData: DesignSummaryData): string => {
    return `
You are a solar PV system design engineer. Based on the following solar system design summary, calculate and estimate the quantities and specifications for the BOQ (Bill of Quantities) line items that are marked as "calculated_estimated".

Design Summary:
- System Capacity: ${designData.capacity} kWp
- Total Modules: ${designData.totalModules}
- Inverter Count: ${designData.inverterCount}
- Total Strings: ${designData.totalStringCount}
- Average String Voltage: ${designData.averageStringVoltage}V
- Average String Current: ${designData.averageStringCurrent}A
- Project Type: ${designData.projectApplication}
- Installation Type: ${designData.projectInstallation}
- Location: ${designData.city}, ${designData.country}
- Module: ${designData.selectedPanel?.manufacturer} ${designData.selectedPanel?.model}, ${designData.selectedPanel?.power_rating}W
- Inverter: ${designData.selectedInverter?.manufacturer} ${designData.selectedInverter?.model}, ${designData.selectedInverter?.nominal_ac_power_kw}kW
- Areas: ${designData.polygonConfigs?.map((config, index) => 
    `Area ${index + 1}: ${config.area?.toFixed(1)}m², ${config.moduleCount} modules, ${config.structureType}`
  ).join('; ')}

${template === 'industrial_utility' && designData.centralStringSizingData ? `
- DCDB Configuration: ${designData.centralStringSizingData.dcdbConfiguration?.dcdbPerInverter} DCDBs per inverter, ${designData.centralStringSizingData.dcdbConfiguration?.stringsPerDCDB} strings per DCDB
- Total DCDBs: ${designData.centralStringSizingData.dcdbConfiguration?.totalDCDBCount}
` : ''}

IMPORTANT: Respond with ONLY the JSON object, no markdown formatting, no code blocks, no explanations. Just the raw JSON:

{
  "estimates": [
    {
      "id": "string",
      "quantity": number,
      "specifications": "string",
      "reasoning": "string"
    }
  ]
}

Consider standard industry practices, typical cable runs, mounting requirements, and safety factors.
`;
  };

  const generateBOQ = async () => {
    setIsGenerating(true);
    setGenerationStep('Initializing BOQ generation...');
    
    try {
      // Step 1: Load base template
      setGenerationStep('Loading BOQ template...');
      const baseItems = getBaseTemplate(boqTemplate);
      setBOQItems(baseItems);
      
      // Step 2: Identify items needing AI calculation
      const itemsToCalculate = baseItems.filter(item => item.source === 'calculated_estimated');
      
      if (itemsToCalculate.length > 0) {
        setGenerationStep(`Calculating ${itemsToCalculate.length} items using ${selectedAI.toUpperCase()}...`);
        
        // Generate AI prompt
        const prompt = generateAIPrompt(boqTemplate, designSummaryData);
        
        // Call AI service
        setGenerationStep(`Connecting to ${selectedAI.toUpperCase()} API...`);
        const aiResponse = await generateBOQEstimates(prompt, selectedAI);
        
        setGenerationStep('Processing AI calculations...');
        
        // Update items with AI calculations
        const updatedItems = baseItems.map(item => {
          const aiEstimate = aiResponse.estimates.find(est => est.id === item.id);
          if (aiEstimate) {
            return {
              ...item,
              quantity: aiEstimate.quantity,
              specifications: aiEstimate.specifications || item.specifications
            };
          }
          return item;
        });
        
        setBOQItems(updatedItems);
        
        setGenerationStep(`BOQ generated using ${aiResponse.model}!`);
        
        if (aiResponse.model.includes('Mock Data')) {
          toast.warning(`BOQ generated using ${aiResponse.model} - API key not available. For production use, please configure your API keys.`);
        } else {
          toast.success(`BOQ generated successfully using ${aiResponse.model}!`);
        }
      } else {
        setGenerationStep('BOQ loaded from design summary (no AI calculation needed)');
        toast.success("BOQ generated from design summary!");
      }
      
    } catch (error) {
      console.error('Error generating BOQ:', error);
      toast.error("Failed to generate BOQ. Please try again.");
      setGenerationStep('Generation failed');
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationStep('');
      }, 1000);
    }
  };

  const exportBOQ = () => {
    if (boqItems.length === 0) {
      toast.error("No BOQ data to export. Please generate BOQ first.");
      return;
    }

    try {
      // Create CSV content
      const headers = ['S.No', 'Item', 'Description', 'Specifications', 'Unit', 'Quantity', 'Source', 'Category'];
      const csvRows = [
        headers.join(','),
        ...boqItems.map((item, index) => [
          index + 1,
          `"${item.item}"`,
          `"${item.description}"`,
          `"${item.specifications || 'To be specified'}"`,
          `"${item.unit}"`,
          item.quantity,
          `"${item.source === 'design_summary' ? 'Design Summary' : 'AI Calculated'}"`,
          `"${item.category}"`
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const fileName = `Solar_BOQ_${designSummaryData.capacity?.toFixed(1)}kWp_${boqTemplate}_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`BOQ exported successfully as ${fileName}`);
    } catch (error) {
      console.error('Error exporting BOQ:', error);
      toast.error("Failed to export BOQ. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-100 border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-purple-900">AI-Powered BOQ Generator</h2>
            <p className="text-purple-700 text-sm">Bill of Quantities estimation using artificial intelligence</p>
          </div>
        </div>
      </Card>

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Model Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-500" />
              AI Model Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Select AI Model
                </label>
                <Select value={selectedAI} onValueChange={(value: 'openai' | 'gemini') => setSelectedAI(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        OpenAI GPT-4
                      </div>
                    </SelectItem>
                    <SelectItem value="gemini">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Google Gemini 2.0 Flash (Experimental)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-gray-600">
                {selectedAI === 'openai' 
                  ? "GPT-4 provides detailed engineering calculations with high accuracy"
                  : "Gemini 2.0 Flash offers advanced reasoning with latest capabilities"
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BOQ Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              BOQ Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Project Type Template
                </label>
                <Select value={boqTemplate} onValueChange={(value: 'residential_commercial' | 'industrial_utility') => setBOQTemplate(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential_commercial">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Residential & Commercial
                      </div>
                    </SelectItem>
                    <SelectItem value="industrial_utility">
                      <div className="flex items-center gap-2">
                        <Factory className="h-4 w-4" />
                        Industrial & Utility Scale
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-gray-600">
                Auto-detected: <Badge variant="outline">{designSummaryData.projectApplication}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-orange-500" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{designSummaryData.capacity?.toFixed(1)} kWp</div>
              <div className="text-sm text-blue-700">System Capacity</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">{designSummaryData.totalModules}</div>
              <div className="text-sm text-green-700">Total Modules</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">{designSummaryData.inverterCount}</div>
              <div className="text-sm text-purple-700">Inverters</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">{designSummaryData.totalStringCount}</div>
              <div className="text-sm text-orange-700">PV Strings</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive BOQ Items List */}
      {comprehensiveBOQItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              Comprehensive BOQ Items from Design Summary
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Complete list of all possible BOQ items based on your design configuration. Items not applicable to your current design show zero quantity.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <th className="border border-gray-300 px-3 py-3 text-left font-semibold">S.No</th>
                    <th className="border border-gray-300 px-3 py-3 text-left font-semibold">Item</th>
                    <th className="border border-gray-300 px-3 py-3 text-left font-semibold">Description</th>
                    <th className="border border-gray-300 px-3 py-3 text-left font-semibold">Specifications</th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-semibold">Unit</th>
                    <th className="border border-gray-300 px-3 py-3 text-right font-semibold">Quantity</th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-semibold">Category</th>
                    <th className="border border-gray-300 px-3 py-3 text-center font-semibold">Applicability</th>
                  </tr>
                </thead>
                <tbody>
                  {comprehensiveBOQItems.map((item, index) => {
                    const isApplicable = item.quantity > 0;
                    const isNotApplicable = item.quantity === 0 && !item.specifications;
                    
                    return (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-gray-50 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                        } ${isNotApplicable ? 'opacity-60' : ''}`}
                      >
                        <td className="border border-gray-300 px-3 py-3 font-medium text-gray-700">{index + 1}</td>
                        <td className="border border-gray-300 px-3 py-3 font-semibold text-gray-900">{item.item}</td>
                        <td className="border border-gray-300 px-3 py-3 text-gray-700">{item.description}</td>
                        <td className="border border-gray-300 px-3 py-3 text-sm text-gray-600">
                          {item.specifications ? (
                            <span>{item.specifications}</span>
                          ) : (
                            <span className="text-gray-400 italic">
                              {isNotApplicable ? 'Not applicable to current design' : 'To be specified'}
                            </span>
                          )}
                        </td>
                        <td className="border border-gray-300 px-3 py-3 text-center font-medium">{item.unit}</td>
                        <td className={`border border-gray-300 px-3 py-3 text-right font-bold ${
                          item.quantity === 0 ? 'text-gray-400' : 'text-gray-900'
                        }`}>
                          {typeof item.quantity === 'number' ? item.quantity.toLocaleString() : item.quantity}
                        </td>
                        <td className="border border-gray-300 px-3 py-3 text-center">
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </td>
                        <td className="border border-gray-300 px-3 py-3 text-center">
                          <Badge 
                            variant={isApplicable ? 'default' : 'secondary'}
                            className={`text-xs ${
                              isApplicable ? 'bg-green-100 text-green-800' : 
                              isNotApplicable ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {isApplicable ? 'Applicable' : 
                             isNotApplicable ? 'Not Applicable' : 'Pending Calculation'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Legend */}
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h4 className="font-semibold text-indigo-900 mb-2">Legend:</h4>
              <div className="text-sm text-indigo-800 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">Applicable</Badge>
                  <span>Items included in your current design configuration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">Not Applicable</Badge>
                  <span>Items not applicable to your current design (e.g., IDT/Power Transformer for LV connections)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Pending Calculation</Badge>
                  <span>Items requiring AI calculation for quantities and specifications</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate BOQ Button */}
      <div className="flex justify-center">
        <Button 
          onClick={generateBOQ} 
          disabled={isGenerating}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Generating BOQ...
            </>
          ) : (
            <>
              <Calculator className="h-5 w-5 mr-2" />
              Generate AI-Powered BOQ
            </>
          )}
        </Button>
      </div>

      {/* Generation Status */}
      {generationStep && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <span className="text-sm font-medium">{generationStep}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BOQ Table */}
      {boqItems.length > 0 && (
        <div className="space-y-4">
          {/* BOQ Summary */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle className="h-5 w-5" />
                BOQ Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-xl font-bold text-green-900">{boqItems.length}</div>
                  <div className="text-sm text-green-700">Total Line Items</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-xl font-bold text-blue-900">
                    {boqItems.filter(item => item.source === 'design_summary').length}
                  </div>
                  <div className="text-sm text-blue-700">From Design Summary</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-xl font-bold text-purple-900">
                    {boqItems.filter(item => item.source === 'calculated_estimated').length}
                  </div>
                  <div className="text-sm text-purple-700">AI Calculated</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-xl font-bold text-orange-900">
                    {new Set(boqItems.map(item => item.category)).size}
                  </div>
                  <div className="text-sm text-orange-700">Categories</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main BOQ Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-purple-500" />
                Bill of Quantities (BOQ)
              </CardTitle>
              <Button onClick={exportBOQ} variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                      <th className="border border-gray-300 px-3 py-3 text-left font-semibold">S.No</th>
                      <th className="border border-gray-300 px-3 py-3 text-left font-semibold">Item</th>
                      <th className="border border-gray-300 px-3 py-3 text-left font-semibold">Description</th>
                      <th className="border border-gray-300 px-3 py-3 text-left font-semibold">Specifications</th>
                      <th className="border border-gray-300 px-3 py-3 text-center font-semibold">Unit</th>
                      <th className="border border-gray-300 px-3 py-3 text-right font-semibold">Quantity</th>
                      <th className="border border-gray-300 px-3 py-3 text-center font-semibold">Category</th>
                      <th className="border border-gray-300 px-3 py-3 text-center font-semibold">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boqItems.map((item, index) => (
                      <tr key={item.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <td className="border border-gray-300 px-3 py-3 font-medium text-gray-700">{index + 1}</td>
                        <td className="border border-gray-300 px-3 py-3 font-semibold text-gray-900">{item.item}</td>
                        <td className="border border-gray-300 px-3 py-3 text-gray-700">{item.description}</td>
                        <td className="border border-gray-300 px-3 py-3 text-sm text-gray-600">
                          {item.specifications || <span className="text-gray-400 italic">To be specified</span>}
                        </td>
                        <td className="border border-gray-300 px-3 py-3 text-center font-medium">{item.unit}</td>
                        <td className="border border-gray-300 px-3 py-3 text-right font-bold text-gray-900">
                          {typeof item.quantity === 'number' ? item.quantity.toLocaleString() : item.quantity}
                        </td>
                        <td className="border border-gray-300 px-3 py-3 text-center">
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </td>
                        <td className="border border-gray-300 px-3 py-3 text-center">
                          <Badge 
                            variant={item.source === 'design_summary' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {item.source === 'design_summary' ? 'Design' : 'AI Calc'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Table Footer with Notes */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">Design</Badge>
                    <span>Quantities derived directly from system design summary</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">AI Calc</Badge>
                    <span>Quantities calculated and estimated using {selectedAI.toUpperCase()} AI model</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-3">
                    <strong>Note:</strong> This BOQ is generated for estimation purposes. Actual quantities may vary based on site conditions, 
                    installation requirements, and local regulations. Please verify all specifications and quantities before procurement.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BOQGenerator;
