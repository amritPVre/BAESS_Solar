
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, RotateCw } from "lucide-react";
import { pipeline } from "@huggingface/transformers";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  options?: string[];
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
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [modelError, setModelError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize with welcome message
    const initialId = `msg_${Date.now()}`;
    const initialMessage: Message = {
      id: initialId,
      role: "assistant",
      content: "Hi! I'm your solar PV BOQ assistant. I'll help you generate a detailed bill of quantities for your solar project. Let's start with the basics.",
      options: [
        "residential",
        "commercial", 
        "industrial", 
        "utility scale"
      ]
    };
    setMessages([initialMessage]);

    // Try to load the model
    const loadModel = async () => {
      try {
        setIsLoading(true);
        toast.info("Loading language model, this may take a moment...");
        
        console.log("Attempting to load language model...");
        
        // Try loading a smaller model that's more likely to work in browser environments
        const pipe = await pipeline(
          "text-generation",
          "Xenova/distilgpt2", // A smaller model that's more likely to work
          { device: "auto" } // Let the library choose the best device
        );
        
        console.log("Language model loaded successfully!");
        setGeneratorPipeline(pipe);
        setIsModelLoaded(true);
        setModelError(null);
        toast.success("Language model loaded successfully!");
      } catch (error) {
        console.error("Error loading model:", error);
        setModelError(error instanceof Error ? error.message : "Unknown error");
        toast.error("Using simplified conversation mode. The AI features will be limited.");
        setIsModelLoaded(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadModel();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant");
    const selectedOption = lastAssistantMsg ? selectedOptions[lastAssistantMsg.id] : null;
    
    if ((!input.trim() && !selectedOption)) return;
    
    const userContent = selectedOption || input;
    const messageId = `msg_${Date.now()}`;
    
    const userMessage: Message = { id: messageId, role: "user", content: userContent };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    if (lastAssistantMsg) {
      setSelectedOptions(prev => {
        const newSelections = { ...prev };
        delete newSelections[lastAssistantMsg.id];
        return newSelections;
      });
    }
    
    setIsProcessing(true);

    try {
      const conversation = messages.map(msg => msg.content).join("\n") + "\n" + userContent;
      
      let response;
      
      if (isModelLoaded && generatorPipeline) {
        try {
          const result = await generatorPipeline(conversation, {
            max_new_tokens: 250,
            temperature: 0.7,
            repetition_penalty: 1.2
          });
          
          response = result[0].generated_text;
          response = response.substring(conversation.length).trim();
        } catch (modelError) {
          console.error("Error using model for generation:", modelError);
          response = generateFallbackResponse(userContent, messages);
        }
      } else {
        response = generateFallbackResponse(userContent, messages);
      }
      
      const options = getOptionsForNextQuestion(userContent, messages);
      
      const assistantMsgId = `msg_${Date.now() + 1}`;
      const assistantMessage: Message = { 
        id: assistantMsgId,
        role: "assistant", 
        content: response,
        options: options
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      if (messages.length >= 10 || userContent.toLowerCase().includes("generate boq")) {
        generateBOQ();
      }
    } catch (error) {
      console.error("Error processing message:", error);
      toast.error("Error processing your message. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptionSelect = (messageId: string, option: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [messageId]: option
    }));
  };

  const getOptionsForNextQuestion = (input: string, previousMessages: Message[]): string[] | undefined => {
    const lastMessage = previousMessages[previousMessages.length - 1]?.content.toLowerCase() || "";
    
    if (lastMessage.includes("what type of solar project") || previousMessages.length === 1) {
      return ["rooftop", "ground-mount", "carport", "floating"];
    } else if (lastMessage.includes("installation type")) {
      return undefined;
    } else if (lastMessage.includes("capacity of your system")) {
      return ["monocrystalline", "polycrystalline", "thin-film", "bifacial"];
    } else if (lastMessage.includes("type of solar module")) {
      return ["string", "central", "microinverter", "hybrid"];
    } else if (lastMessage.includes("type of inverter")) {
      return ["yes", "no"];
    } else if (lastMessage.includes("battery storage")) {
      return ["fixed", "adjustable", "tracking", "dual-tracking"];
    } else if (lastMessage.includes("mounting structure")) {
      return ["grid-tied", "hybrid", "off-grid"];
    } else if (lastMessage.includes("grid connection")) {
      return ["yes", "no"];
    } else if (lastMessage.includes("monitoring system")) {
      return ["yes", "no"];
    }
    
    return undefined;
  };

  const generateFallbackResponse = (input: string, previousMessages: Message[]): string => {
    const inputLower = input.toLowerCase();
    const lastMessage = previousMessages[previousMessages.length - 1]?.content.toLowerCase() || "";
    
    const acknowledgment = getAcknowledgment(input);
    
    if (lastMessage.includes("what type of solar project") || previousMessages.length === 1) {
      return `${acknowledgment} Now, what installation type are you looking for?`;
    } else if (lastMessage.includes("installation type")) {
      return `${acknowledgment} What's the capacity of your system in kilowatts (kW)?`;
    } else if (lastMessage.includes("capacity of your system")) {
      return `${acknowledgment} What type of solar module would you prefer?`;
    } else if (lastMessage.includes("type of solar module")) {
      return `${acknowledgment} What type of inverter would you like to use?`;
    } else if (lastMessage.includes("type of inverter")) {
      return `${acknowledgment} Do you want to include battery storage in your system?`;
    } else if (lastMessage.includes("battery storage")) {
      return `${acknowledgment} What mounting structure do you prefer?`;
    } else if (lastMessage.includes("mounting structure")) {
      return `${acknowledgment} What's your grid connection type?`;
    } else if (lastMessage.includes("grid connection")) {
      return `${acknowledgment} Would you like to include a monitoring system?`;
    } else if (lastMessage.includes("monitoring system")) {
      return `${acknowledgment} I have all the information I need now. Would you like me to generate your BOQ?`;
    } else if (inputLower.includes("yes") && lastMessage.includes("generate your boq")) {
      return "Great! I'll generate your BOQ now.";
    } else {
      return "I'm processing your request. Can you provide more details about your solar project?";
    }
  };

  const getAcknowledgment = (input: string): string => {
    const responses = [
      `Got it! You selected ${input}.`,
      `Thanks for choosing ${input}!`,
      `Excellent choice with ${input}.`,
      `I've noted down ${input}.`,
      `${input}, perfect!`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateBOQ = () => {
    const projectTypeMatch = messages.find(m => m.role === "user" && m.content.toLowerCase().match(/(residential|commercial|industrial|utility)/));
    const installationTypeMatch = messages.find(m => m.role === "user" && m.content.toLowerCase().match(/(rooftop|ground-mount|carport|floating)/));
    const capacityMatch = messages.find(m => m.role === "user" && m.content.match(/\d+(\.\d+)?\s*kw/i));
    const moduleTypeMatch = messages.find(m => m.role === "user" && m.content.toLowerCase().match(/(monocrystalline|polycrystalline|thin-film|bifacial)/));
    const inverterTypeMatch = messages.find(m => m.role === "user" && m.content.toLowerCase().match(/(string|central|microinverter|hybrid)/));
    
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
    
    const boqData = generateMockBOQ(mockData);
    
    onBOQGenerated(boqData);
    
    const assistantMsgId = `msg_${Date.now()}`;
    setMessages(prev => [...prev, { 
      id: assistantMsgId,
      role: "assistant", 
      content: "I've generated your BOQ based on our conversation. You can view the results in the BOQ Results tab!" 
    }]);
  };

  const extractMatch = (text: string, regex: RegExp): string => {
    const match = text.toLowerCase().match(regex);
    return match ? match[0] : "";
  };

  function generateMockBOQ(values: any) {
    const systemCapacity = values.systemCapacity;
    
    const modulePower = values.moduleType === "monocrystalline" ? 450 : 400;
    const moduleCount = Math.ceil((systemCapacity * 1000) / modulePower);
    
    const inverterSizing = values.inverterType === "string" ? 1.2 : 1.1;
    const inverterCapacity = Math.ceil(systemCapacity / inverterSizing);
    const inverterCount = values.inverterType === "microinverter" 
      ? moduleCount 
      : Math.ceil(systemCapacity / 10);
    
    const mountingPointsPerModule = values.installationType === "ground-mount" ? 4 : 2.5;
    
    const dcDisconnects = Math.ceil(systemCapacity / 20) + 1;
    const acDisconnects = Math.ceil(systemCapacity / 50) + 1;
    
    let batteryItems = [];
    if (values.batteryStorage) {
      const batteryUnitSize = 5;
      const batteryCount = Math.ceil((systemCapacity * 2) / batteryUnitSize);
      batteryItems = [
        { item: "Battery Unit (5kWh)", quantity: batteryCount, unit: "pcs" },
        { item: "Battery Management System", quantity: 1, unit: "set" },
        { item: "Battery Inverter", quantity: 1, unit: "pcs" },
        { item: "Battery Rack", quantity: Math.ceil(batteryCount / 4), unit: "set" },
      ];
    }
    
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
            quantity: values.dcCableLength * 2, 
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
    
    if (batteryItems.length > 0) {
      boqItems.push({
        category: "Battery Storage System",
        items: batteryItems
      });
    }
    
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
        estimatedArea: moduleCount * 2,
        estimatedWeight: moduleCount * 25,
      }
    };
  }

  const renderOptions = (message: Message) => {
    if (!message.options || message.options.length === 0) return null;
    
    const selectedValue = selectedOptions[message.id] || "";
    
    return (
      <div className="mt-4 mb-2">
        <RadioGroup 
          value={selectedValue}
          onValueChange={(value) => handleOptionSelect(message.id, value)}
          className="flex flex-col space-y-2"
        >
          {message.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2 bg-muted/20 p-2 rounded-md hover:bg-muted/40 transition-colors">
              <RadioGroupItem value={option} id={`option-${message.id}-${index}`} />
              <label 
                htmlFor={`option-${message.id}-${index}`} 
                className="text-sm cursor-pointer flex-1 py-1"
              >
                {option}
              </label>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  };

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
        {!isLoading && modelError && (
          <div className="ml-auto text-sm text-amber-500">Running in simplified mode</div>
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
              {message.role === "assistant" && renderOptions(message)}
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
            disabled={isLoading || isProcessing || (!input.trim() && !Object.values(selectedOptions).length)}
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
