import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { insertSamplePanels, insertSampleInverters, insertAllSampleData } from "@/utils/sampleDataGenerator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Database, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SampleDataAdminPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInsertPanels = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const success = await insertSamplePanels();
      setResult({ 
        success, 
        message: success 
          ? "Sample panel data inserted successfully" 
          : "Failed to insert sample panel data" 
      });
    } catch (error) {
      setResult({ success: false, message: "An error occurred while inserting data" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertInverters = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const success = await insertSampleInverters();
      setResult({ 
        success, 
        message: success 
          ? "Sample inverter data inserted successfully" 
          : "Failed to insert sample inverter data" 
      });
    } catch (error) {
      setResult({ success: false, message: "An error occurred while inserting data" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertAll = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const success = await insertAllSampleData();
      setResult({ 
        success, 
        message: success 
          ? "All sample data inserted successfully" 
          : "Failed to insert some or all sample data" 
      });
    } catch (error) {
      setResult({ success: false, message: "An error occurred while inserting data" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Sample Data Management</CardTitle>
        <CardDescription>Insert sample data into the database for testing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
        
        <p className="text-sm text-muted-foreground mb-4">
          Use these buttons to populate the database with sample solar panels and inverters for testing purposes.
          This will add 5 sample panels and 5 sample inverters with realistic specifications.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Button 
          onClick={handleInsertPanels} 
          disabled={isLoading}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <Database className="mr-2 h-4 w-4" />
          Insert Sample Panels
        </Button>
        <Button 
          onClick={handleInsertInverters} 
          disabled={isLoading}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <Database className="mr-2 h-4 w-4" />
          Insert Sample Inverters
        </Button>
        <Button 
          onClick={handleInsertAll} 
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          <Database className="mr-2 h-4 w-4" />
          Insert All Sample Data
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SampleDataAdminPanel;
