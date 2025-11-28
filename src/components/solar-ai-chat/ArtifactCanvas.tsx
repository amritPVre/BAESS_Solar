import React, { useState } from 'react';
import { ArtifactData } from '@/types/solar-ai-chat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileDown, 
  FileSpreadsheet, 
  Maximize2, 
  Minimize2,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ArtifactCanvasProps {
  artifact: ArtifactData | null;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export const ArtifactCanvas: React.FC<ArtifactCanvasProps> = ({
  artifact,
  onExportPDF,
  onExportExcel,
  isVisible = true,
  onToggleVisibility,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!artifact) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 border-l">
        <div className="text-center px-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
            <FileSpreadsheet className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Calculation Results Yet
          </h3>
          <p className="text-sm text-gray-600 max-w-md">
            Start a conversation or select a calculation task to see results, 
            insights, and visualizations here.
          </p>
        </div>
      </div>
    );
  }

  if (!isVisible) {
    return (
      <div className="w-16 border-l bg-gray-50 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleVisibility}
          title="Show artifacts"
        >
          <Eye className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "artifact-canvas border-l bg-white flex flex-col transition-all duration-300 theme-transition",
      isExpanded ? "w-full" : "w-[55%] min-w-[600px] max-w-[900px]"
    )}>
      {/* Header */}
      <div className="artifact-header border-b px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 theme-transition">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <FileSpreadsheet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {artifact.title}
              </h2>
              <p className="text-sm text-gray-600">
                {artifact.calculationType.replace(/_/g, ' ').toUpperCase()} • {' '}
                {artifact.timestamp.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onExportPDF && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportPDF}
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                PDF
              </Button>
            )}
            {onExportExcel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportExcel}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Restore size" : "Maximize"}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            {onToggleVisibility && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleVisibility}
                title="Hide artifacts"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="artifact-content flex-1 overflow-auto p-6 theme-transition">
        <Tabs defaultValue="results" className="h-full">
          <TabsList className="mb-4">
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="data">Raw Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="results" className="mt-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Calculation Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 prose-ul:text-gray-800 prose-ol:text-gray-800 prose-table:text-sm prose-td:border prose-td:p-2 prose-th:border prose-th:p-2 prose-th:bg-gray-50 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {typeof artifact.data === 'string' ? artifact.data : JSON.stringify(artifact.data, null, 2)}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="insights" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Insights & Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Key Insights</h4>
                    <ul className="space-y-2">
                      <li className="flex gap-2 text-sm text-gray-700">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>Analysis and insights will appear here based on calculation results</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Recommendations</h4>
                    <ul className="space-y-2">
                      <li className="flex gap-2 text-sm text-gray-700">
                        <span className="text-green-600 font-bold">→</span>
                        <span>AI-generated recommendations will appear here</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="data" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Raw Data (JSON)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                  <code>{JSON.stringify(artifact, null, 2)}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

