
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, RotateCw } from "lucide-react";
import { pipeline } from "@huggingface/transformers";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface BOQChatProps {
  onBOQGenerated: (data: any) => void;
}

export function BOQChat({ onBOQGenerated }: BOQChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [generatorPipeline, setGeneratorPipeline] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate an initial greeting when the component mounts
  useEffect(() => {
    const initialMessage: Message = {
      role: "assistant",
      content: "Hi! I'm your solar PV BOQ assistant. I'll help you generate a detailed bill of quantities for your solar project. Let's start with the basics. What type of solar project are you planning? (residential, commercial, industrial, or utility scale)"
    };
    setMessages([initialMessage]);

    // Load the model
    const loadModel = async () => {
      try {
        setIsLoading(true);
        toast.info("Loading language model, this may take a moment...");
        
        // Initialize the pipeline with a small, efficient model
        // Updated configuration to remove the 'quantized' property and use 'device' instead
        const pipe = await pipeline(
          "text-generation",
          "HuggingFaceH4/zephyr-7b-alpha",
          { device: "cpu" }
        );
        
        setGeneratorPipeline(pipe);
        setIsModelLoaded(true);
        setIsLoading(false);
        toast.success("Language model loaded successfully!");
      } catch (error) {
        console.error("Error loading model:", error);
        toast.error("Failed to load language model. Using fallback mode.");
        setIsModelLoaded(false);
        setIsLoading(false);
      }
    };

    loadModel();
  }, []);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      // Get context from previous messages
      const conversation = messages.map(msg => msg.content).join("\n") + "\n" + input;
      
      let response;
      
      if (isModelLoaded && generatorPipeline) {
        // Use the loaded model if available
        const result = await generatorPipeline(conversation, {
          max_new_tokens: 250,
          temperature: 0.7,
          repetition_penalty: 1.2
        });
        
        response = result[0].generated_text;
        // Extract only the new text (remove the input)
        response = response.substring(conversation.length).trim();
      } else {
        // Fallback logic with predefined responses
        response = generateFallbackResponse(input, messages);
      }
      
      // Add assistant message
      const assistantMessage: Message = { role: "assistant", content: response };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Check if we have enough information to generate BOQ
      if (messages.length >= 10 || input.toLowerCase().includes("generate boq")) {
        generateBOQ();
      }
    } catch (error) {
      console.error("Error processing message:", error);
      toast.error("Error processing your message. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Fallback logic for when the model isn't loaded
  const generateFallbackResponse = (input: string, previousMessages: Message[]): string => {
    const inputLower = input.toLowerCase();
    const lastMessage = previousMessages[previousMessages.length - 1]?.content.toLowerCase() || "";
    
    if (lastMessage.includes("what type of solar project")) {
      return "Great! Now, what installation type are you looking for? (rooftop, ground-mount, carport, or floating)";
    } else if (lastMessage.includes("installation type")) {
      return "What's the capacity of your system in kilowatts (kW)?";
    } else if (lastMessage.includes("capacity of your system")) {
      return "What type of solar module would you prefer? (monocrystalline, polycrystalline, thin-film, or bifacial)";
    } else if (lastMessage.includes("type of solar module")) {
      return "What type of inverter would you like to use? (string, central, microinverter, or hybrid)";
    } else if (lastMessage.includes("type of inverter")) {
      return "Do you want to include battery storage in your system? (yes/no)";
    } else if (lastMessage.includes("battery storage")) {
      return "What mounting structure do you prefer? (fixed, adjustable, tracking, or dual-tracking)";
    } else if (lastMessage.includes("mounting structure")) {
      return "What's your grid connection type? (grid-tied, hybrid, or off-grid)";
    } else if (lastMessage.includes("grid connection")) {
      return "Would you like to include a monitoring system? (yes/no)";
    } else if (lastMessage.includes("monitoring system")) {
      return "I have all the information I need now. Would you like me to generate your BOQ? (yes/no)";
    } else if (inputLower.includes("yes") && lastMessage.includes("generate your boq")) {
      return "Great! I'll generate your BOQ now.";
    } else {
      return "I'm processing your request. Can you provide more details about your solar project?";
    }
  };
  
  // Generate BOQ based on conversation
  const generateBOQ = () => {
    // Extract information from chat
    const projectTypeMatch = messages.find(m => m.role === "user" && m.content.toLowerCase().match(/(residential|commercial|industrial|utility)/));
    const installationTypeMatch = messages.find(m => m.role === "user" && m.content.toLowerCase().match(/(rooftop|ground-mount|carport|floating)/));
    const capacityMatch = messages.find(m => m.role === "user" && m.content.match(/\d+(\.\d+)?\s*kw/i));
    const moduleTypeMatch = messages.find(m => m.role === "user" && m.content.toLowerCase().match(/(monocrystalline|polycrystalline|thin-film|bifacial)/));
    const inverterTypeMatch = messages.find(m => m.role === "user" && m.content.toLowerCase().match(/(string|central|microinverter|hybrid)/));
    
    // Create mock data with defaults and overrides from chat
    const mockData = {
      projectType: projectTypeMatch ? 
        extractMatch(projectTypeMatch.content, /(residential|commercial|industrial|utility)/) : "residential",
      installationType: installationTypeMatch ? 
        extractMatch(installationTypeMatch.content, /(rooftop|ground-mount|carport|floating)/) : "rooftop",
      systemCapacity: capacityMatch ? 
        parseFloat(extractMatch(capacityMatch.content, /(\d+(\.\d+)?)/)) : 5,
      moduleType: moduleTypeMatch ? 
        extractMatch(moduleTypeMatch.content, /(monocrystalline|polycrystalline|thin-film|bifacial)/) : "monocrystalline",
      inverterType: inverterTypeMatch ? 
        extractMatch(inverterTypeMatch.content, /(string|central|microinverter|hybrid)/) : "string",
      mountingStructure: "fixed",
      batteryStorage: false,
      dcCableLength: 30,
      acCableLength: 20,
      gridConnection: "grid-tied",
      monitoringSystem: true,
    };
    
    // Generate the BOQ using similar logic from the BOQForm component
    const boqData = generateMockBOQ(mockData);
    
    // Send the generated BOQ to the parent component
    onBOQGenerated(boqData);
    
    // Add a final message
    setMessages(prev => [...prev, { 
      role: "assistant", 
      content: "I've generated your BOQ based on our conversation. You can view the results in the BOQ Results tab!" 
    }]);
  };
  
  // Helper function to extract matches from regex
  const extractMatch = (text: string, regex: RegExp): string => {
    const match = text.toLowerCase().match(regex);
    return match ? match[0] : "";
  };
  
  // This function simulates BOQ generation based on form values (copied from BOQForm)
  function generateMockBOQ(values: any) {
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
    if (values.batteryStorage) {
      const batteryUnitSize = 5; // kWh per unit
      const batteryCount = Math.ceil((systemCapacity * 2) / batteryUnitSize); // Assuming 2 hours storage
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
    <div className="flex flex-col h-[600px] border rounded-lg overflow-hidden bg-background">
      <div className="p-4 border-b bg-muted/50 flex items-center gap-2">
        <Bot className="h-5 w-5 text-primary" />
        <h3 className="font-medium">Solar BOQ Assistant</h3>
        {isLoading && (
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <RotateCw className="h-3 w-3 animate-spin" />
            Loading AI model...
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "assistant" 
                  ? "bg-muted text-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {message.role === "assistant" ? (
                  <>
                    <Bot className="h-4 w-4" />
                    <span className="text-xs font-medium">Assistant</span>
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4" />
                    <span className="text-xs font-medium">You</span>
                  </>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading || isProcessing}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={isLoading || isProcessing || !input.trim()}
          >
            {isProcessing ? (
              <RotateCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
