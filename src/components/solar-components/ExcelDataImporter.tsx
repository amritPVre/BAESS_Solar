import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useAuth } from "@/hooks/useAuth";

interface SolarPanel {
  manufacturer: string;
  model: string;
  nominal_power_w: number;
  technology?: string;
  cells_in_series?: number;
  cells_in_parallel?: number;
  vmp_v?: number;
  imp_a?: number;
  voc_v?: number;
  isc_a?: number;
  module_length?: number;
  module_width?: number;
  module_weight?: number;
  panel_area_m2?: number;
  efficiency_percent?: number;
  file_name?: string;
  data_source?: string;
  noct_c?: number;
  maximum_voltage_iec?: number;
  current_temp_coeff?: number;
  power_temp_coeff?: number;
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
  const { user } = useAuth();
  const [isPanelUploading, setPanelUploading] = useState(false);
  const [isInverterUploading, setInverterUploading] = useState(false);
  const [panelFile, setPanelFile] = useState<File | null>(null);
  const [inverterFile, setInverterFile] = useState<File | null>(null);
  const [panelResults, setPanelResults] = useState<{total: number, success: number, errors: number} | null>(null);
  const [inverterResults, setInverterResults] = useState<{total: number, success: number, errors: number} | null>(null);
  const [activeTab, setActiveTab] = useState("panels");

  const isAdmin = user?.email === "amrit.mandal0191@gmail.com";

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
          
          const json = XLSX.utils.sheet_to_json(worksheet, { header: "A" });
          
          const headers = json[0];
          
          const rows = json.slice(1);
          
          const headerMap: Record<string, string> = {};
          
          Object.entries(headers).forEach(([key, value]) => {
            if (typeof value === 'string') {
              headerMap[value.toLowerCase().trim()] = value;
            }
          });
          
          const result = rows.map(row => {
            const obj: Record<string, any> = {};
            
            Object.entries(row).forEach(([cellKey, cellValue]) => {
              const headerKey = headers[cellKey];
              if (headerKey && typeof headerKey === 'string') {
                obj[headerKey] = cellValue;
              }
            });
            
            return obj;
          });
          
          console.log("Processed Excel data:", { headerMap, firstRow: result[0] });
          
          resolve(result);
        } catch (error) {
          console.error("Error processing Excel file:", error);
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

    if (!isAdmin) {
      toast.error("Only admin users can upload data");
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

      console.log("Raw Excel data sample:", data[0]);

      const panelData: SolarPanel[] = data.map(item => {
        const getValue = (fieldNames: string[]): any => {
          for (const name of fieldNames) {
            if (item[name] !== undefined) return item[name];
            
            const lowerName = name.toLowerCase();
            const key = Object.keys(item).find(k => k.toLowerCase() === lowerName);
            if (key !== undefined) return item[key];
          }
          return undefined;
        };
        
        const manufacturer = getValue(['manufacturer', 'Manufacturer']);
        const model = getValue(['model', 'Model']);
        const nominal_power_w = getValue(['nominal_power_w', 'Nominal_Power_W', 'Nominal Power', 'Power']);
        
        return {
          manufacturer: String(manufacturer || ""),
          model: String(model || ""),
          nominal_power_w: Number(nominal_power_w || 0),
          technology: String(getValue(['technology', 'Technology']) || ""),
          cells_in_series: Number(getValue(['cells_in_series', 'Cells_in_Series']) || 0),
          cells_in_parallel: Number(getValue(['cells_in_parallel', 'Cells_in_Parallel']) || 0),
          vmp_v: Number(getValue(['vmp_v', 'Vmp_V']) || 0),
          imp_a: Number(getValue(['imp_a', 'Imp_A']) || 0),
          voc_v: Number(getValue(['voc_v', 'Voc_V']) || 0),
          isc_a: Number(getValue(['isc_a', 'Isc_A']) || 0),
          module_length: Number(getValue(['module_length', 'Module_Length']) || 0),
          module_width: Number(getValue(['module_width', 'Module_Width']) || 0),
          module_weight: Number(getValue(['module_weight', 'Module_Weight']) || 0),
          panel_area_m2: Number(getValue(['panel_area_m2', 'Panel_Area_m2']) || 0),
          efficiency_percent: Number(getValue(['efficiency_percent', 'Efficiency_percent']) || 0),
          file_name: String(getValue(['file_name', 'File_Name']) || ""),
          data_source: String(getValue(['data_source', 'Data_Source']) || ""),
          noct_c: Number(getValue(['noct_c', 'NOCT_C']) || 0),
          maximum_voltage_iec: Number(getValue(['maximum_voltage_iec', 'Maximum_Voltage_IEC']) || 0),
          current_temp_coeff: Number(getValue(['current_temp_coeff', 'Current_Temp_Coeff']) || 0),
          power_temp_coeff: Number(getValue(['power_temp_coeff', 'Power_Temp_Coeff']) || 0),
        };
      });

      console.log("Mapped panel data sample:", panelData[0]);

      const validPanels = panelData.filter(panel => 
        panel.manufacturer && 
        panel.model && 
        panel.nominal_power_w > 0
      );

      console.log("Valid panels:", validPanels.length, "of", panelData.length);

      if (validPanels.length === 0) {
        toast.error("No valid panel data found. Each panel must have manufacturer, model, and nominal power.");
        setPanelUploading(false);
        return;
      }

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

    if (!isAdmin) {
      toast.error("Only admin users can upload data");
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
      
      const inverterData: SolarInverter[] = data.map(item => {
        const getValue = (fieldNames: string[]): any => {
          for (const name of fieldNames) {
            if (item[name] !== undefined) return item[name];
            
            const lowerName = name.toLowerCase();
            const key = Object.keys(item).find(k => k.toLowerCase() === lowerName);
            if (key !== undefined) return item[key];
          }
          return undefined;
        };
        
        return {
          manufacturer: String(getValue(['manufacturer', 'Manufacturer']) || ""),
          model: String(getValue(['model', 'Model']) || ""),
          nominal_ac_power_kw: Number(getValue(['nominal_ac_power_kw', 'Nominal_AC_Power_kW']) || 0),
          maximum_ac_power_kw: Number(getValue(['maximum_ac_power_kw', 'Maximum_AC_Power_kW']) || 0),
          nominal_ac_voltage_v: Number(getValue(['nominal_ac_voltage_v', 'Nominal_AC_Voltage_V']) || 0),
          maximum_ac_current_a: Number(getValue(['maximum_ac_current_a', 'Maximum_AC_Current_A']) || 0),
          phase: String(getValue(['phase', 'Phase']) || ""),
          topology: String(getValue(['topology', 'Topology']) || ""),
          power_threshold_w: Number(getValue(['power_threshold_w', 'Power_Threshold_W']) || 0),
          nominal_mpp_voltage_v: Number(getValue(['nominal_mpp_voltage_v', 'Nominal_MPP_Voltage_V']) || 0),
          min_mpp_voltage_v: Number(getValue(['min_mpp_voltage_v', 'Min_MPP_Voltage_V']) || 0),
          max_dc_voltage_v: Number(getValue(['max_dc_voltage_v', 'Max_DC_Voltage_V']) || 0),
          max_dc_current_a: Number(getValue(['max_dc_current_a', 'Max_DC_Current_A']) || 0),
          total_mppt: Number(getValue(['total_mppt', 'Total_MPPT']) || 0),
          total_string_inputs: Number(getValue(['total_string_inputs', 'Total_String_Inputs']) || 0),
        };
      });

      console.log("Mapped inverter data sample:", inverterData[0]);

      const validInverters = inverterData.filter(inverter => 
        inverter.manufacturer && 
        inverter.model
      );

      console.log("Valid inverters:", validInverters.length, "of", inverterData.length);

      if (validInverters.length === 0) {
        toast.error("No valid inverter data found. Each inverter must have manufacturer and model.");
        setInverterUploading(false);
        return;
      }

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

  if (!isAdmin) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Import Solar Components Data</CardTitle>
          <CardDescription>
            Only admin users can import data into the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h3 className="text-lg font-medium mb-2">Admin Access Required</h3>
            <p className="text-muted-foreground">
              You need admin privileges to upload data to the component library.
              Please contact the administrator if you need to add components.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
                  Manufacturer, Model, Nominal_Power_W
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Column names are case-insensitive, but must match the database field names.
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
                  Manufacturer, Model
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Column names are case-insensitive, but must match the database field names.
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
              The importer is case-insensitive when matching column names.
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
