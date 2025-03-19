
import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/ui/SectionHeader";
import { DesignCanvas } from "@/components/designer/DesignCanvas";
import { DesignToolbar } from "@/components/designer/DesignToolbar";
import { Card, CardContent } from "@/components/ui/card";
import { Square, Laptop, SunMedium } from "lucide-react";

const SolarDesigner: React.FC = () => {
  const [activeTool, setActiveTool] = useState<"select" | "building" | "panel" | "delete">("select");

  return (
    <div className="container mx-auto py-6">
      <Helmet>
        <title>Solar PV Designer | Solar Financial Tool</title>
      </Helmet>

      <div className="mb-8">
        <SectionHeader
          title="Solar PV Designer"
          description="Design your solar PV system by drawing buildings and placing panels"
          icon={<SunMedium className="h-6 w-6" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardContent className="p-4">
              <DesignToolbar activeTool={activeTool} onToolChange={setActiveTool} />
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
              Tip: Use the toolbar to draw buildings and place solar panels
            </div>
            <Button variant="outline" size="sm">
              Save Design
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarDesigner;
