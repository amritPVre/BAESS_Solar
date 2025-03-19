
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/ui/SectionHeader";
import { DesignCanvas } from "@/components/designer/DesignCanvas";
import { DesignToolbar } from "@/components/designer/DesignToolbar";
import { Card, CardContent } from "@/components/ui/card";
import { Square, Laptop, SunMedium, Save, FileDown } from "lucide-react";
import { toast } from "sonner";

const SolarDesigner: React.FC = () => {
  const [activeTool, setActiveTool] = useState<"select" | "building" | "panel" | "delete">("select");
  const [designStats, setDesignStats] = useState({
    totalPanelArea: 0,
    estimatedCapacity: 0,
    buildingCount: 0
  });
  
  const handleSaveDesign = () => {
    // This would be expanded to actually save the design
    toast.success("Design saved successfully!");
  };
  
  const handleExportDesign = () => {
    // This would be expanded to export the design to PDF or other formats
    toast.success("Design exported successfully!");
  };

  return (
    <div className="container mx-auto py-6">
      <Helmet>
        <title>Solar PV Designer | Solar Financial Tool</title>
        <script src="https://polyfill.io/v3/polyfill.min.js?features=default"></script>
      </Helmet>

      <div className="mb-8">
        <SectionHeader
          title="Solar PV Designer"
          description="Design your solar PV system by drawing buildings and placing panels on satellite imagery"
          icon={<SunMedium className="h-6 w-6" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardContent className="p-4">
              <DesignToolbar activeTool={activeTool} onToolChange={setActiveTool} />
              
              <div className="mt-8 space-y-3">
                <h3 className="font-medium text-lg mb-2">Actions</h3>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={handleSaveDesign}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Design
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={handleExportDesign}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Export Design
                </Button>
              </div>
              
              <div className="mt-8">
                <h3 className="font-medium text-lg mb-2">Design Statistics</h3>
                <div className="bg-muted p-3 rounded-md text-sm">
                  <p className="flex justify-between">
                    <span>Total Panel Area:</span>
                    <span className="font-medium">{designStats.totalPanelArea.toFixed(1)} m²</span>
                  </p>
                  <p className="flex justify-between mt-1">
                    <span>Estimated Capacity:</span>
                    <span className="font-medium">{designStats.estimatedCapacity.toFixed(2)} kW</span>
                  </p>
                  <p className="flex justify-between mt-1">
                    <span>Buildings:</span>
                    <span className="font-medium">{designStats.buildingCount}</span>
                  </p>
                </div>
              </div>
              
              <div className="mt-8 p-3 border border-yellow-200 bg-yellow-50 rounded-md">
                <h3 className="font-medium text-sm mb-1 text-yellow-800">How to Use</h3>
                <ol className="text-xs text-yellow-700 list-decimal pl-4 space-y-1">
                  <li>Search for a location using the search box</li>
                  <li>Select "Building" tool to draw building outlines</li>
                  <li>Select "Solar Panel" tool to place panels on rooftops</li>
                  <li>Use "Select" tool to move or resize objects</li>
                  <li>Use "Delete" tool to remove objects</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="bg-gradient-to-b from-white to-gray-50 shadow-sm border border-gray-200">
            <CardContent className="p-4">
              <DesignCanvas activeTool={activeTool} />
            </CardContent>
          </Card>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Tip: Search for a location, then use the toolbar to draw buildings and place solar panels
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarDesigner;
