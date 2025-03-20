
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Printer, 
  Download, 
  Copy, 
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface BOQItem {
  item: string;
  quantity: number;
  unit: string;
}

interface BOQCategory {
  category: string;
  items: BOQItem[];
}

interface BOQResultsProps {
  data: {
    projectDetails: {
      type: string;
      installation: string;
      capacity: number;
      moduleType: string;
      inverterType: string;
    };
    boqItems: BOQCategory[];
    summary: {
      totalModules: number;
      totalInverters: number;
      estimatedArea: number;
      estimatedWeight: number;
    };
  };
}

export function BOQResults({ data }: BOQResultsProps) {
  const { toast } = useToast();
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    Object.fromEntries(data.boqItems.map(item => [item.category, true]))
  );

  const handleCopyToClipboard = () => {
    // Format BOQ as text
    let boqText = `SOLAR PV SYSTEM - BILL OF QUANTITIES\n\n`;
    boqText += `Project Type: ${data.projectDetails.type}\n`;
    boqText += `Installation Type: ${data.projectDetails.installation}\n`;
    boqText += `System Capacity: ${data.projectDetails.capacity} kW\n\n`;
    
    data.boqItems.forEach(category => {
      boqText += `${category.category.toUpperCase()}\n`;
      category.items.forEach(item => {
        boqText += `- ${item.item}: ${item.quantity} ${item.unit}\n`;
      });
      boqText += `\n`;
    });
    
    boqText += `SUMMARY\n`;
    boqText += `- Total Modules: ${data.summary.totalModules}\n`;
    boqText += `- Total Inverters: ${data.summary.totalInverters}\n`;
    boqText += `- Estimated Area: ${data.summary.estimatedArea} m²\n`;
    boqText += `- Estimated Weight: ${data.summary.estimatedWeight} kg\n`;
    
    navigator.clipboard.writeText(boqText).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "The BOQ has been copied to your clipboard"
      });
      setCopiedText("Copied!");
      setTimeout(() => setCopiedText(null), 2000);
    });
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleDownloadCSV = () => {
    let csvContent = "Category,Item,Quantity,Unit\n";
    
    data.boqItems.forEach(category => {
      category.items.forEach(item => {
        csvContent += `"${category.category}","${item.item}",${item.quantity},"${item.unit}"\n`;
      });
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `solar_boq_${data.projectDetails.capacity}kW.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "CSV Downloaded",
      description: "Your BOQ has been downloaded as CSV"
    });
  };
  
  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="space-y-6 print:space-y-2">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 print:hidden">
        <h2 className="text-xl font-bold">Bill of Quantities</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
            {copiedText ? <CheckCircle2 className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            {copiedText || "Copy"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
        </div>
      </div>
      
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="print:py-2">
          <CardTitle>Project Specifications</CardTitle>
          <CardDescription>
            Based on your inputs, we've generated a detailed BOQ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 print:gap-2">
            <div>
              <p className="text-sm text-muted-foreground">Project Type</p>
              <p className="font-medium capitalize">{data.projectDetails.type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Installation Type</p>
              <p className="font-medium capitalize">{data.projectDetails.installation}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">System Capacity</p>
              <p className="font-medium">{data.projectDetails.capacity} kW</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Module Type</p>
              <p className="font-medium capitalize">{data.projectDetails.moduleType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inverter Type</p>
              <p className="font-medium capitalize">{data.projectDetails.inverterType}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4 print:space-y-2">
        {data.boqItems.map((category, index) => (
          <Collapsible
            key={index}
            open={openCategories[category.category]}
            onOpenChange={() => toggleCategory(category.category)}
            className="border rounded-md"
          >
            <div className="flex justify-between items-center px-4 py-2 print:py-1 bg-muted/50">
              <h3 className="text-lg font-medium">{category.category}</h3>
              <CollapsibleTrigger asChild className="print:hidden">
                <Button variant="ghost" size="sm">
                  {openCategories[category.category] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="print:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {category.items.map((item, itemIndex) => (
                    <TableRow key={itemIndex}>
                      <TableCell>{item.item}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
      
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="print:py-2">
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-2">
            <div>
              <p className="text-sm text-muted-foreground">Total Modules</p>
              <p className="font-medium">{data.summary.totalModules} pcs</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Inverters</p>
              <p className="font-medium">{data.summary.totalInverters} pcs</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Area</p>
              <p className="font-medium">{data.summary.estimatedArea} m²</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Weight</p>
              <p className="font-medium">{data.summary.estimatedWeight} kg</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground print:pt-0">
          <p>This is an estimated bill of quantities. Actual requirements may vary based on detailed site assessment.</p>
        </CardFooter>
      </Card>
      
      <style jsx global>{`
        @media print {
          @page { size: portrait; margin: 1cm; }
          body * { font-size: 12px !important; }
          h1, h2, h3 { font-size: 14px !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:py-1 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
          .print\\:py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
          .print\\:pt-0 { padding-top: 0 !important; }
          .print\\:space-y-2 > * + * { margin-top: 0.5rem !important; }
          .print\\:gap-2 { gap: 0.5rem !important; }
        }
      `}</style>
    </div>
  );
}
