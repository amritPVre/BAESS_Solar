import React, { useState } from "react";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import SolarComponentsLibrary from "@/components/solar-components/SolarComponentsLibrary";
import SampleDataAdminPanel from "@/components/solar-components/SampleDataAdminPanel";
import ExcelDataImporter from "@/components/solar-components/ExcelDataImporter";
import { SolarPanel, SolarInverter } from "@/services/solarComponentsService";
import { toast } from "sonner";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReturnToDashboardButton from "@/components/ui/ReturnToDashboardButton";

const SolarComponentsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.email === "amrit.mandal0191@gmail.com"; // Admin email for RLS policies
  const [selectedPanel, setSelectedPanel] = useState<SolarPanel | null>(null);
  const [selectedInverter, setSelectedInverter] = useState<SolarInverter | null>(null);
  const [activeTab, setActiveTab] = useState<string>("browse");

  const handleSelectPanel = (panel: SolarPanel) => {
    setSelectedPanel(panel);
    toast.success(`Selected panel: ${panel.manufacturer} ${panel.model}`);
  };

  const handleSelectInverter = (inverter: SolarInverter) => {
    setSelectedInverter(inverter);
    toast.success(`Selected inverter: ${inverter.manufacturer} ${inverter.model}`);
  };

  return (
    <AuthGuard>
      <Helmet>
        <title>Solar Components Library</title>
      </Helmet>
      <Header />
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Solar Components Library</h1>
          <ReturnToDashboardButton />
        </div>
        <p className="text-muted-foreground mb-8">
          Browse, select, and manage solar panels and inverters for your solar designs.
        </p>
        
        {isAdmin && (
          <div className="mb-8">
            <Tabs 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full max-w-md mx-auto mb-6">
                <TabsTrigger value="browse">Browse Components</TabsTrigger>
                <TabsTrigger value="import">Import Data</TabsTrigger>
                <TabsTrigger value="sample">Sample Data</TabsTrigger>
              </TabsList>

              <TabsContent value="browse">
                <SolarComponentsLibrary 
                  onSelectPanel={handleSelectPanel}
                  onSelectInverter={handleSelectInverter}
                  selectedPanelId={selectedPanel?.id}
                  selectedInverterId={selectedInverter?.id}
                />
              </TabsContent>

              <TabsContent value="import">
                <div className="max-w-3xl mx-auto">
                  <ExcelDataImporter />
                </div>
              </TabsContent>

              <TabsContent value="sample">
                <div className="max-w-3xl mx-auto">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="admin-panel">
                      <AccordionTrigger>Sample Data Controls</AccordionTrigger>
                      <AccordionContent>
                        <SampleDataAdminPanel />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {!isAdmin && (
          <SolarComponentsLibrary 
            onSelectPanel={handleSelectPanel}
            onSelectInverter={handleSelectInverter}
            selectedPanelId={selectedPanel?.id}
            selectedInverterId={selectedInverter?.id}
          />
        )}
      </div>
    </AuthGuard>
  );
};

export default SolarComponentsPage;
