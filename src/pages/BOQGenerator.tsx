
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, List, Settings } from "lucide-react";
import { BOQForm } from "@/components/boq/BOQForm";
import { BOQResults } from "@/components/boq/BOQResults";
import SectionHeader from "@/components/ui/SectionHeader";

const BOQGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState("specifications");
  const [boqData, setBOQData] = useState<any>(null);
  
  const handleBOQGenerated = (data: any) => {
    setBOQData(data);
    setActiveTab("results");
  };

  return (
    <div className="container mx-auto py-6">
      <SectionHeader
        title="Solar PV BOQ Generator"
        description="Generate a detailed Bill of Quantities for your solar PV installation"
        icon={<FileText className="h-6 w-6" />}
      />

      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 mb-8">
            <TabsTrigger value="specifications" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System Specifications
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              BOQ Results
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="specifications">
            <Card>
              <CardHeader>
                <CardTitle>System Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <BOQForm onBOQGenerated={handleBOQGenerated} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Bill of Quantities</CardTitle>
              </CardHeader>
              <CardContent>
                {boqData ? (
                  <BOQResults data={boqData} />
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Please fill the system specifications to generate a BOQ
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BOQGenerator;
