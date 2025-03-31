
import React, { useState } from "react";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import SolarComponentsLibrary from "@/components/solar-components/SolarComponentsLibrary";
import SampleDataAdminPanel from "@/components/solar-components/SampleDataAdminPanel";
import { SolarPanel, SolarInverter } from "@/services/solarComponentsService";
import { toast } from "sonner";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const SolarComponentsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.email === "admin@example.com"; // Simple admin check
  const [selectedPanel, setSelectedPanel] = useState<SolarPanel | null>(null);
  const [selectedInverter, setSelectedInverter] = useState<SolarInverter | null>(null);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Solar Components Library</h1>
          <p className="text-muted-foreground">
            Browse and select from our database of solar panels and inverters for your solar designs.
          </p>
        </div>

        {/* Admin Panel (visible only to admin users) */}
        {isAdmin && (
          <div className="mb-8">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="admin-panel">
                <AccordionTrigger>Admin Controls</AccordionTrigger>
                <AccordionContent>
                  <SampleDataAdminPanel />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        <SolarComponentsLibrary 
          onSelectPanel={handleSelectPanel}
          onSelectInverter={handleSelectInverter}
          selectedPanelId={selectedPanel?.id}
          selectedInverterId={selectedInverter?.id}
        />
      </div>
    </AuthGuard>
  );
};

export default SolarComponentsPage;
