// BOQ Parameter Panel Component
// Provides interface for managing BOQ parameters for AI LLM calculations

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  FileText, 
  Download, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Database,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { useBOQParameterExtraction, useBOQParameterDebug } from "../../hooks/useBOQParameterExtraction";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Type definitions for BOQ parameter panel
// Using Record<string, any> for flexibility with dynamic data structures
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PolygonConfig = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PanelConfig = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InverterConfig = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ACConfiguration = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CableData = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BreakerData = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TransformerData = Record<string, any>;

interface BOQParameterPanelProps {
  // Props from main calculator
  polygonConfigs?: PolygonConfig[];
  selectedPanel?: PanelConfig;
  selectedInverter?: InverterConfig;
  structureType?: string;
  connectionType?: 'LV' | 'HV';
  isCentralInverter?: boolean;
  manualInverterCount?: number;
  totalStringCount?: number;
  averageStringCurrent?: number;
  soilType?: string;
  acConfigData?: {
    acConfiguration?: ACConfiguration; // The actual AC configuration object from the AC Config tab
    cableData?: CableData;
    breakerData?: BreakerData;
    transformerData?: TransformerData;
  };
  
  // Control props
  isVisible?: boolean;
}

const BOQParameterPanel: React.FC<BOQParameterPanelProps> = ({
  polygonConfigs,
  selectedPanel,
  selectedInverter,
  structureType,
  connectionType,
  isCentralInverter,
  manualInverterCount,
  totalStringCount,
  averageStringCurrent,
  soilType,
  acConfigData,
  isVisible = true
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [aiPrompt, setAIPrompt] = useState("");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  // Use the BOQ parameter extraction hook
  const {
    extractAllParameters,
    getFormattedPrompt,
    getCurrentParameters,
    clearParameters,
    isReady,
    calculationType
  } = useBOQParameterExtraction({
    polygonConfigs,
    selectedPanel,
    selectedInverter,
    structureType,
    connectionType,
    isCentralInverter,
    manualInverterCount,
    totalStringCount,
    averageStringCurrent,
    soilType,
    acConfigData
  });

  // Debug hooks
  const {
    logCurrentParameters,
    downloadParametersAsJSON,
    getFormattedPromptForType
  } = useBOQParameterDebug();

  // Generate AI prompt
  const handleGeneratePrompt = async () => {
    setIsGeneratingPrompt(true);
    try {
      extractAllParameters();
      await new Promise(resolve => setTimeout(resolve, 500)); // Allow extraction to complete
      
      const prompt = getFormattedPrompt(calculationType);
      setAIPrompt(prompt);
      setActiveTab("prompt");
      toast.success(`AI prompt generated for ${calculationType} system`);
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast.error('Failed to generate AI prompt');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // Copy prompt to clipboard
  const handleCopyPrompt = async () => {
    if (aiPrompt) {
      try {
        await navigator.clipboard.writeText(aiPrompt);
        toast.success('Prompt copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy prompt');
      }
    }
  };

  // Download prompt as text file
  const handleDownloadPrompt = () => {
    if (aiPrompt) {
      const blob = new Blob([aiPrompt], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boq-prompt-${calculationType}-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Prompt downloaded');
    }
  };

  // Get current parameters summary
  const getCurrentParametersCount = () => {
    const params = getCurrentParameters();
    let count = 0;
    if (params.dcInputs) count++;
    if (params.lightningProtection) count++;
    if (params.acCommon) count++;
    if (params.lvConnection) count++;
    if (params.hvStringInverter) count++;
    if (params.hvCentralInverter) count++;
    return count;
  };

  if (!isVisible) return null;

  return (
    <div className="w-full">
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-100 border-indigo-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-indigo-900">
                  AI BOQ Parameter Manager
                </CardTitle>
                <p className="text-sm text-indigo-700 mt-1">
                  Extract parameters for AI-powered BOQ calculations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={isReady ? "default" : "destructive"}
                className={isReady ? "bg-green-100 text-green-800" : ""}
              >
                {isReady ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Ready
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Incomplete
                  </>
                )}
              </Badge>
              <Badge variant="outline" className="text-indigo-700 border-indigo-300">
                {calculationType}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="text-xs">
                <Database className="h-3 w-3 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="parameters" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Parameters
              </TabsTrigger>
              <TabsTrigger value="prompt" className="text-xs">
                <Bot className="h-3 w-3 mr-1" />
                AI Prompt
              </TabsTrigger>
              <TabsTrigger value="actions" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Actions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-indigo-200">
                  <h4 className="font-medium text-indigo-900 mb-2">System Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Connection Type:</span>
                      <span className="font-medium">{connectionType || 'Not Set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Inverter Type:</span>
                      <span className="font-medium">
                        {isCentralInverter ? 'Central' : 'String'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Structure Type:</span>
                      <span className="font-medium">{structureType || 'Not Set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Soil Type:</span>
                      <span className="font-medium">{soilType || 'Not Set'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-indigo-200">
                  <h4 className="font-medium text-indigo-900 mb-2">Parameter Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Parameters Ready:</span>
                      <span className="font-medium">{getCurrentParametersCount()}/6</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Tables:</span>
                      <span className="font-medium">
                        {polygonConfigs?.reduce((sum, config) => sum + (config.tableCount || 0), 0) || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Area:</span>
                      <span className="font-medium">
                        {(polygonConfigs?.reduce((sum, config) => sum + (config.area || 0), 0) || 0).toFixed(1)}m²
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Inverter Count:</span>
                      <span className="font-medium">{manualInverterCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="parameters" className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-indigo-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-indigo-900">Current Parameters</h4>
                  <Button
                    onClick={logCurrentParameters}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Log to Console
                  </Button>
                </div>
                <div className="space-y-4 text-sm max-h-96 overflow-y-auto">
                  {Object.entries(getCurrentParameters()).map(([key, value]) => (
                    <div key={key} className="border border-gray-200 rounded-lg p-3">
                      <h5 className="font-semibold text-indigo-800 mb-2 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </h5>
                      {typeof value === 'object' && value !== null ? (
                        <div className="space-y-1 pl-2 border-l-2 border-indigo-200">
                          {Object.entries(value as Record<string, any>)
                            .filter(([subKey, subValue]) => {
                              // Filter out parameters not required for HV String design
                              if (key === 'hvStringInverter') {
                                const hiddenParams = [
                                  'distanceCombinerToPoCM',
                                  'acCableCrossSectionCombinerToPoCMm2', 
                                  'cbTypeInverterToIDT',
                                  'cbRatingInverterToIDTA'
                                ];
                                if (hiddenParams.includes(subKey)) {
                                  // Hide if value is empty string, 0, or null
                                  return !(subValue === "" || subValue === 0 || subValue === null);
                                }
                              }
                              return true; // Show all other parameters
                            })
                            .map(([subKey, subValue]) => (
                            <div key={subKey} className="flex justify-between py-0.5">
                              <span className="text-gray-600 text-xs capitalize">
                                {subKey.replace(/([A-Z])/g, ' $1')}:
                              </span>
                              <span className="font-medium text-indigo-600 text-xs">
                                {typeof subValue === 'object' && subValue !== null 
                                  ? `{${Object.keys(subValue).length} properties}` 
                                  : String(subValue || 'N/A')
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-indigo-700 font-medium">
                          {String(value)}
                        </div>
                      )}
                    </div>
                  ))}
                  {Object.keys(getCurrentParameters()).length === 0 && (
                    <div className="text-center py-8">
                      <Bot className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 italic">No parameters extracted yet</p>
                      <p className="text-xs text-gray-400 mt-1">Parameters will appear after design completion</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prompt" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleGeneratePrompt}
                    disabled={!isReady || isGeneratingPrompt}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isGeneratingPrompt ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Bot className="h-4 w-4 mr-2" />
                    )}
                    Generate AI Prompt
                  </Button>

                  {aiPrompt && (
                    <>
                      <Button
                        onClick={handleCopyPrompt}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        onClick={handleDownloadPrompt}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </>
                  )}
                </div>

                {aiPrompt && (
                  <div className="bg-white rounded-lg border border-indigo-200">
                    <div className="p-3 border-b border-indigo-200 bg-indigo-50">
                      <h4 className="font-medium text-indigo-900">AI LLM Prompt for {calculationType} BOQ</h4>
                      <p className="text-xs text-indigo-600 mt-1">
                        Ready to use with your AI model for BOQ calculations
                      </p>
                    </div>
                    <Textarea
                      value={aiPrompt}
                      readOnly
                      className="min-h-[300px] resize-none border-0 focus:ring-0"
                      placeholder="Generated prompt will appear here..."
                    />
                  </div>
                )}

                {!aiPrompt && (
                  <div className="bg-white rounded-lg border border-dashed border-indigo-300 p-8 text-center">
                    <Bot className="h-12 w-12 text-indigo-400 mx-auto mb-3" />
                    <p className="text-indigo-600 font-medium">No prompt generated yet</p>
                    <p className="text-sm text-indigo-500 mt-1">
                      Click "Generate AI Prompt" to create parameters for your AI model
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={extractAllParameters}
                        disabled={!isReady}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Extract Parameters
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Extract all parameters from current configuration</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={downloadParametersAsJSON}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download JSON
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download parameters as JSON file for external use</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={clearParameters}
                        variant="outline"
                        className="w-full justify-start text-red-600 hover:text-red-700"
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Clear Session
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear all stored parameters and start fresh</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 mb-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Usage Instructions
                </h4>
                <div className="text-sm text-amber-700 space-y-1">
                  <p>• Complete your solar design in all tabs first</p>
                  <p>• Ensure all required parameters show "Ready" status</p>
                  <p>• Generate the AI prompt for your specific system type</p>
                  <p>• Use the prompt with your AI LLM for detailed BOQ calculations</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BOQParameterPanel;
