
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

const formSchema = z.object({
  projectType: z.string({
    required_error: "Please select a project type",
  }),
  installationType: z.string({
    required_error: "Please select an installation type",
  }),
  systemCapacity: z.coerce
    .number()
    .min(1, { message: "Capacity must be at least 1 kW" })
    .max(10000, { message: "Capacity must be at most 10,000 kW" }),
  moduleType: z.string({
    required_error: "Please select a module type",
  }),
  inverterType: z.string({
    required_error: "Please select an inverter type",
  }),
  mountingStructure: z.string(),
  batteryStorage: z.boolean().optional().default(false),
  batteryCapacity: z.coerce.number().optional(),
  dcCableLength: z.coerce.number().min(1, { message: "Length must be at least 1 meter" }),
  acCableLength: z.coerce.number().min(1, { message: "Length must be at least 1 meter" }),
  gridConnection: z.string(),
  monitoringSystem: z.boolean().optional().default(false),
  safetyEquipment: z.string().array().optional().default([]),
});

type FormValues = z.infer<typeof formSchema>;

interface BOQFormProps {
  onBOQGenerated: (data: any) => void;
}

export function BOQForm({ onBOQGenerated }: BOQFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectType: "residential",
      installationType: "rooftop",
      systemCapacity: 5,
      moduleType: "monocrystalline",
      inverterType: "string",
      mountingStructure: "fixed",
      batteryStorage: false,
      dcCableLength: 30,
      acCableLength: 20,
      gridConnection: "grid-tied",
      monitoringSystem: true,
      safetyEquipment: ["surge-protectors", "circuit-breakers"],
    },
  });

  const batteryStorage = form.watch("batteryStorage");

  async function onSubmit(values: FormValues) {
    try {
      // In a real implementation, this would call an API to generate the BOQ
      // For now, we'll simulate it with a timeout
      toast.info("Generating your BOQ...");
      
      setTimeout(() => {
        // Generate mock BOQ data based on the form values
        const boqData = generateMockBOQ(values);
        onBOQGenerated(boqData);
        toast.success("BOQ generated successfully!");
      }, 1500);
    } catch (error) {
      toast.error("Failed to generate BOQ. Please try again.");
      console.error(error);
    }
  }

  // This function simulates BOQ generation based on form values
  function generateMockBOQ(values: FormValues) {
    const systemCapacity = values.systemCapacity;
    
    // Simplified calculations for demonstration
    const modulePower = values.moduleType === "monocrystalline" ? 450 : 400; // W per module
    const moduleCount = Math.ceil((systemCapacity * 1000) / modulePower);
    
    // Determine inverter count and sizing based on system capacity
    const inverterSizing = values.inverterType === "string" ? 1.2 : 1.1; // DC/AC ratio
    const inverterCapacity = Math.ceil(systemCapacity / inverterSizing);
    const inverterCount = values.inverterType === "microinverter" 
      ? moduleCount 
      : Math.ceil(systemCapacity / 10); // Assuming 10kW inverters for string
    
    // Structure mounting points based on installation type
    const mountingPointsPerModule = values.installationType === "ground-mount" ? 4 : 2.5;
    
    // Calculate safety equipment quantities
    const dcDisconnects = Math.ceil(systemCapacity / 20) + 1;
    const acDisconnects = Math.ceil(systemCapacity / 50) + 1;
    
    // Calculate battery system if selected
    let batteryItems = [];
    if (values.batteryStorage && values.batteryCapacity) {
      const batteryUnitSize = 5; // kWh per unit
      const batteryCount = Math.ceil(values.batteryCapacity / batteryUnitSize);
      batteryItems = [
        { item: "Battery Unit (5kWh)", quantity: batteryCount, unit: "pcs" },
        { item: "Battery Management System", quantity: 1, unit: "set" },
        { item: "Battery Inverter", quantity: 1, unit: "pcs" },
        { item: "Battery Rack", quantity: Math.ceil(batteryCount / 4), unit: "set" },
      ];
    }
    
    // Main BOQ items
    const boqItems = [
      { 
        category: "Solar Modules",
        items: [
          { 
            item: `${values.moduleType} Module (${modulePower}W)`, 
            quantity: moduleCount, 
            unit: "pcs" 
          }
        ]
      },
      {
        category: "Inverters",
        items: [
          { 
            item: `${values.inverterType === "microinverter" ? "Microinverter" : "String Inverter"}`, 
            quantity: inverterCount, 
            unit: "pcs" 
          }
        ]
      },
      {
        category: "Mounting Structure",
        items: [
          { 
            item: `${values.mountingStructure} Mounting Rails`, 
            quantity: Math.ceil(moduleCount * 0.5), 
            unit: "sets" 
          },
          { 
            item: "Mounting Clamps", 
            quantity: moduleCount * 4, 
            unit: "pcs" 
          },
          { 
            item: "Mounting Hardware Kit", 
            quantity: Math.ceil(moduleCount * mountingPointsPerModule), 
            unit: "sets" 
          }
        ]
      },
      {
        category: "Cables & Connections",
        items: [
          { 
            item: "DC Solar Cable", 
            quantity: values.dcCableLength * 2, // Both positive and negative
            unit: "meters" 
          },
          { 
            item: "AC Cable", 
            quantity: values.acCableLength, 
            unit: "meters" 
          },
          { 
            item: "MC4 Connectors", 
            quantity: moduleCount * 2, 
            unit: "pairs" 
          },
          {
            item: "Cable Conduit", 
            quantity: Math.ceil((values.dcCableLength + values.acCableLength) * 0.7), 
            unit: "meters"
          }
        ]
      },
      {
        category: "Safety Equipment",
        items: [
          { 
            item: "DC Disconnect Switch", 
            quantity: dcDisconnects, 
            unit: "pcs" 
          },
          { 
            item: "AC Disconnect Switch", 
            quantity: acDisconnects, 
            unit: "pcs" 
          },
          { 
            item: "Surge Protection Device", 
            quantity: Math.ceil(systemCapacity / 10) + 1, 
            unit: "pcs" 
          },
          { 
            item: "Circuit Breakers", 
            quantity: Math.ceil(systemCapacity / 5) + 2, 
            unit: "pcs" 
          }
        ]
      }
    ];
    
    // Add battery section if applicable
    if (batteryItems.length > 0) {
      boqItems.push({
        category: "Battery Storage System",
        items: batteryItems
      });
    }
    
    // Add monitoring if selected
    if (values.monitoringSystem) {
      boqItems.push({
        category: "Monitoring System",
        items: [
          { item: "Data Logger", quantity: 1, unit: "set" },
          { item: "Communication Gateway", quantity: 1, unit: "set" },
          { item: "Monitoring Software License", quantity: 1, unit: "license" }
        ]
      });
    }
    
    // Add grid connection equipment based on selection
    if (values.gridConnection === "grid-tied") {
      boqItems.push({
        category: "Grid Connection",
        items: [
          { item: "Grid Tie Interface", quantity: 1, unit: "set" },
          { item: "AC Combiner Box", quantity: Math.ceil(systemCapacity / 20), unit: "pcs" }
        ]
      });
    } else if (values.gridConnection === "hybrid") {
      boqItems.push({
        category: "Grid Connection",
        items: [
          { item: "Hybrid Inverter Upgrade", quantity: inverterCount, unit: "sets" },
          { item: "Grid/Generator Auto Transfer Switch", quantity: 1, unit: "set" }
        ]
      });
    } else if (values.gridConnection === "off-grid") {
      boqItems.push({
        category: "Off-Grid Components",
        items: [
          { item: "Charge Controller", quantity: Math.ceil(systemCapacity / 5), unit: "pcs" },
          { item: "Off-Grid Inverter", quantity: Math.ceil(systemCapacity / 5), unit: "pcs" }
        ]
      });
    }
    
    return {
      projectDetails: {
        type: values.projectType,
        installation: values.installationType,
        capacity: values.systemCapacity,
        moduleType: values.moduleType,
        inverterType: values.inverterType,
      },
      boqItems,
      summary: {
        totalModules: moduleCount,
        totalInverters: inverterCount,
        estimatedArea: moduleCount * 2, // m²
        estimatedWeight: moduleCount * 25, // kg
      }
    };
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="projectType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="utility">Utility Scale</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="installationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Installation Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select installation type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="rooftop">Rooftop</SelectItem>
                    <SelectItem value="ground-mount">Ground Mount</SelectItem>
                    <SelectItem value="carport">Carport</SelectItem>
                    <SelectItem value="floating">Floating</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="systemCapacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>System Capacity (kW)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} min={1} max={10000} />
                </FormControl>
                <FormDescription>
                  Enter the system size in kilowatts (kW)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="moduleType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Module Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select module type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="monocrystalline">Monocrystalline</SelectItem>
                    <SelectItem value="polycrystalline">Polycrystalline</SelectItem>
                    <SelectItem value="thin-film">Thin Film</SelectItem>
                    <SelectItem value="bifacial">Bifacial</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="inverterType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inverter Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select inverter type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="string">String Inverter</SelectItem>
                    <SelectItem value="central">Central Inverter</SelectItem>
                    <SelectItem value="microinverter">Microinverter</SelectItem>
                    <SelectItem value="hybrid">Hybrid Inverter</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mountingStructure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mounting Structure</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mounting type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Tilt</SelectItem>
                    <SelectItem value="adjustable">Adjustable Tilt</SelectItem>
                    <SelectItem value="tracking">Single-Axis Tracking</SelectItem>
                    <SelectItem value="dual-tracking">Dual-Axis Tracking</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="batteryStorage"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Include Battery Storage</FormLabel>
                  <FormDescription>
                    Add battery storage system to the installation
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          {batteryStorage && (
            <FormField
              control={form.control}
              name="batteryCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Battery Capacity (kWh)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} min={1} />
                  </FormControl>
                  <FormDescription>
                    Enter desired battery capacity in kilowatt-hours (kWh)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="dcCableLength"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DC Cable Length (meters)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} min={1} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acCableLength"
            render={({ field }) => (
              <FormItem>
                <FormLabel>AC Cable Length (meters)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} min={1} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gridConnection"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grid Connection Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grid connection type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="grid-tied">Grid-Tied</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="off-grid">Off-Grid</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="monitoringSystem"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Include Monitoring System</FormLabel>
                  <FormDescription>
                    Add monitoring system for performance tracking
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full">Generate BOQ</Button>
      </form>
    </Form>
  );
}
