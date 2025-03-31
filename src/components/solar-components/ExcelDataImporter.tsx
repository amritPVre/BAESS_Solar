
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface SolarPanel {
  manufacturer: string;
  model: string;
  nominal_power_w: number;
  technology?: string;
  cells_in_series?: number;
  vmp_v?: number;
  imp_a?: number;
  voc_v?: number;
  isc_a?: number;
  module_length?: number;
  module_width?: number;
  module_weight?: number;
  panel_area_m2?: number;
  efficiency_percent?: number;
}

interface SolarInverter {
  manufacturer: string;
  model: string;
  nominal_ac_power_kw?: number;
  maximum_ac_power_kw?: number;
  nominal_ac_voltage_v?: number;
  maximum_ac_current_a?: number;
  phase?: string;
  topology?: string;
  power_threshold_w?: number;
  nominal_mpp_voltage_v?: number;
  min_mpp_voltage_v?: number;
  max_dc_voltage_v?: number;
  max_dc_current_a?: number;
  total_mppt?: number;
  total_string_inputs?: number;
}

const ExcelDataImporter: React.FC = () => {
  const [isPanelUploading, setPanelUploading] = useState(false);
  const [isInverterUploading, setInverterUploading] = useState(false);
  const [panelFile, setPanelFile] = useState<File | null>(null);
  const [inverterFile, setInverterFile] = useState<File | null>(null);
  const [panelResults, setPanelResults] = useState<{total: number, success: number, errors: number} | null>(null);
  const [inverterResults, setInverterResults] = useState<{total: number, success: number, errors: number} | null>(null);
  const [activeTab, setActiveTab] = useState("panels");

  const handlePanelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPanelFile(e.target.files[0]);
      setPanelResults(null);
    }
  };

  const handleInverterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setInverterFile(e.target.files[0]);
      setInverterResults(null);
    }
  };

  const processExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  const uploadPanelData = async () => {
    if (!panelFile) {
      toast.error("Please select a file first");
      return;
    }

    setPanelUploading(true);
    setPanelResults(null);
    
    try {
      const data = await processExcelFile(panelFile);
      
      if (data.length === 0) {
        toast.error("No data found in the Excel file");
        setPanelUploading(false);
        return;
      }

      // Map the data to the expected format
      const panelData: SolarPanel[] = data.map(item => ({
        manufacturer: String(item.manufacturer || ""),
        model: String(item.model || ""),
        nominal_power_w: Number(item.nominal_power_w || 0),
        technology: String(item.technology || ""),
        cells_in_series: Number(item.cells_in_series || 0),
        vmp_v: Number(item.vmp_v || 0),
        imp_a: Number(item.imp_a || 0),
        voc_v: Number(item.voc_v || 0),
        isc_a: Number(item.isc_a || 0),
        module_length: Number(item.module_length || 0),
        module_width: Number(item.module_width || 0),
        module_weight: Number(item.module_weight || 0),
        panel_area_m2: Number(item.panel_area_m2 || 0),
        efficiency_percent: Number(item.efficiency_percent || 0)
      }));

      // Filter out invalid records
      const validPanels = panelData.filter(panel => 
        panel.manufacturer && 
        panel.model && 
        panel.nominal_power_w > 0
      );

      if (validPanels.length === 0) {
        toast.error("No valid panel data found. Each panel must have manufacturer, model, and nominal power.");
        setPanelUploading(false);
        return;
      }

      // Insert the data into Supabase
      const { data: insertedData, error } = await supabase
        .from('solar_panels')
        .insert(validPanels)
        .select();

      if (error) {
        console.error("Error uploading panel data:", error);
        toast.error(`Error uploading data: ${error.message}`);
      } else {
        toast.success(`Successfully uploaded ${insertedData.length} panels`);
        setPanelResults({
          total: panelData.length,
          success: insertedData.length,
          errors: panelData.length - insertedData.length
        });
      }
    } catch (error) {
      console.error("Error processing Excel file:", error);
      toast.error("Error processing Excel file. Please check the format.");
    } finally {
      setPanelUploading(false);
    }
  };

  const uploadInverterData = async () => {
    if (!inverterFile) {
      toast.error("Please select a file first");
      return;
    }

    setInverterUploading(true);
    setInverterResults(null);
    
    try {
      const data = await processExcelFile(inverterFile);
      
      if (data.length === 0) {
        toast.error("No data found in the Excel file");
        setInverterUploading(false);
        return;
      }

      // Map the data to the expected format
      const inverterData: SolarInverter[] = data.map(item => ({
        manufacturer: String(item.manufacturer || ""),
        model: String(item.model || ""),
        nominal_ac_power_kw: Number(item.nominal_ac_power_kw || 0),
        maximum_ac_power_kw: Number(item.maximum_ac_power_kw || 0),
        nominal_ac_voltage_v: Number(item.nominal_ac_voltage_v || 0),
        maximum_ac_current_a: Number(item.maximum_ac_current_a || 0),
        phase: String(item.phase || ""),
        topology: String(item.topology || ""),
        power_threshold_w: Number(item.power_threshold_w || 0),
        nominal_mpp_voltage_v: Number(item.nominal_mpp_voltage_v || 0),
        min_mpp_voltage_v: Number(item.min_mpp_voltage_v || 0),
        max_dc_voltage_v: Number(item.max_dc_voltage_v || 0),
        max_dc_current_a: Number(item.max_dc_current_a || 0),
        total_mppt: Number(item.total_mppt || 0),
        total_string_inputs: Number(item.total_string_inputs || 0),
      }));

      // Filter out invalid records
      const validInverters = inverterData.filter(inverter => 
        inverter.manufacturer && 
        inverter.model
      );

      if (validInverters.length === 0) {
        toast.error("No valid inverter data found. Each inverter must have manufacturer and model.");
        setInverterUploading(false);
        return;
      }

      // Insert the data into Supabase
      const { data: insertedData, error } = await supabase
        .from('solar_inverters')
        .insert(validInverters)
        .select();

      if (error) {
        console.error("Error uploading inverter data:", error);
        toast.error(`Error uploading data: ${error.message}`);
      } else {
        toast.success(`Successfully uploaded ${insertedData.length} inverters`);
        setInverterResults({
          total: inverterData.length,
          success: insertedData.length,
          errors: inverterData.length - insertedData.length
        });
      }
    } catch (error) {
      console.error("Error processing Excel file:", error);
      toast.error("Error processing Excel file. Please check the format.");
    } finally {
      setInverterUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Import Solar Components Data</CardTitle>
        <CardDescription>
          Upload Excel files with solar panel or inverter specifications to import into the database.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="panels" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="panels">Solar Panels</TabsTrigger>
            <TabsTrigger value="inverters">Solar Inverters</TabsTrigger>
          </TabsList>
          
          <TabsContent value="panels" className="mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Required columns:</h3>
                <p className="text-sm text-muted-foreground">
                  manufacturer, model, nominal_power_w
                </p>
              </div>
              
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Input
                  id="panel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handlePanelFileChange}
                  disabled={isPanelUploading}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  {panelFile ? `Selected: ${panelFile.name}` : "No file selected"}
                </p>
              </div>
              
              {panelResults && (
                <div className="p-3 bg-muted rounded-md">
                  <h4 className="font-medium mb-1">Upload Results:</h4>
                  <p className="text-sm">Total records: {panelResults.total}</p>
                  <p className="text-sm text-green-600">Successfully uploaded: {panelResults.success}</p>
                  {panelResults.errors > 0 && (
                    <p className="text-sm text-destructive">Failed: {panelResults.errors}</p>
                  )}
                </div>
              )}
              
              <Button 
                onClick={uploadPanelData} 
                disabled={!panelFile || isPanelUploading}
                className="w-full"
              >
                {isPanelUploading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Panel Data
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="inverters" className="mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Required columns:</h3>
                <p className="text-sm text-muted-foreground">
                  manufacturer, model
                </p>
              </div>
              
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Input
                  id="inverter-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleInverterFileChange}
                  disabled={isInverterUploading}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  {inverterFile ? `Selected: ${inverterFile.name}` : "No file selected"}
                </p>
              </div>
              
              {inverterResults && (
                <div className="p-3 bg-muted rounded-md">
                  <h4 className="font-medium mb-1">Upload Results:</h4>
                  <p className="text-sm">Total records: {inverterResults.total}</p>
                  <p className="text-sm text-green-600">Successfully uploaded: {inverterResults.success}</p>
                  {inverterResults.errors > 0 && (
                    <p className="text-sm text-destructive">Failed: {inverterResults.errors}</p>
                  )}
                </div>
              )}
              
              <Button 
                onClick={uploadInverterData} 
                disabled={!inverterFile || isInverterUploading}
                className="w-full"
              >
                {isInverterUploading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Inverter Data
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="p-3 border border-amber-200 bg-amber-50 text-amber-800 rounded-md flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Excel File Format</p>
            <p className="text-xs">
              Your Excel file should have column headers that match the database fields. 
              Required fields must be present for successful import. All other fields are optional.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileSpreadsheet className="h-4 w-4" />
          <span>Only Excel files (.xlsx, .xls) are supported</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ExcelDataImporter;
