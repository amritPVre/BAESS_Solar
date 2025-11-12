// AI Services for BOQ Generation
// This module provides interfaces to different AI models for BOQ calculations
//
// Environment Variables Required:
// - VITE_OPENAI_API_KEY: OpenAI API key for GPT-4
// - VITE_GEMINI_API_KEY: Google AI API key for Gemini 2.0 Flash Experimental
//
// Note: If API keys are not available, the system will gracefully fallback to mock data

import { logEnvironmentStatus, getEnvironmentVariable } from './envCheck';

export interface AIEstimate {
  id: string;
  quantity: number;
  specifications: string;
  reasoning: string;
}

export interface AIResponse {
  estimates: AIEstimate[];
  model: string;
  timestamp: string;
}

// OpenAI GPT-4 Integration
export async function callOpenAI(prompt: string): Promise<AIResponse> {
  try {
    // Get API key from environment variables using our helper function
    const apiKey = getEnvironmentVariable('VITE_OPENAI_API_KEY');
    
    if (!apiKey) {
      console.warn('OpenAI API key not found. Using mock data.');
      return getMockAIResponse('GPT-4');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional solar PV system engineer specializing in BOQ calculations. Provide accurate, industry-standard estimates for solar installation components.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      let errorMessage = `OpenAI API error: ${response.status} - ${response.statusText}`;
      
      if (response.status === 429) {
        errorMessage += ' (Rate limit exceeded - please wait a moment and try again)';
      } else if (response.status === 401) {
        errorMessage += ' (Invalid API key)';
      } else if (response.status === 402) {
        errorMessage += ' (Quota exceeded - please check your OpenAI billing)';
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response - handle markdown code blocks
    let parsedResponse;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      
      // Check if response is wrapped in markdown code blocks
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      parsedResponse = JSON.parse(cleanContent);
      console.log('Successfully parsed OpenAI response:', parsedResponse);
    } catch (parseError) {
      console.warn('Failed to parse OpenAI response as JSON:', content);
      console.warn('Parse error:', parseError);
      throw new Error('OpenAI returned invalid JSON response');
    }
    
    return {
      estimates: parsedResponse.estimates,
      model: 'GPT-4',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Fallback to mock data if API fails
    return getMockAIResponse('GPT-4');
  }
}

// Google Gemini 2.5 Flash Integration
export async function callGemini(prompt: string): Promise<AIResponse> {
  try {
    // Get API key from environment variables using our helper function
    const apiKey = getEnvironmentVariable('VITE_GEMINI_API_KEY');
    
    if (!apiKey) {
      console.warn('Gemini API key not found. Using mock data.');
      return getMockAIResponse('Gemini 2.0 Flash Experimental');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a professional solar PV system engineer specializing in BOQ calculations. Provide accurate, industry-standard estimates for solar installation components.\n\n${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000,
        }
      })
    });

    if (!response.ok) {
      let errorMessage = `Gemini API error: ${response.status} - ${response.statusText}`;
      
      if (response.status === 404) {
        errorMessage += ' (Model not found - please check the model name)';
      } else if (response.status === 401 || response.status === 403) {
        errorMessage += ' (Invalid API key or permission denied)';
      } else if (response.status === 429) {
        errorMessage += ' (Rate limit exceeded - please wait a moment and try again)';
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON response - handle markdown code blocks
    let parsedResponse;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      
      // Check if response is wrapped in markdown code blocks
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      parsedResponse = JSON.parse(cleanContent);
      console.log('Successfully parsed Gemini response:', parsedResponse);
    } catch (parseError) {
      console.warn('Failed to parse Gemini response as JSON:', content);
      console.warn('Parse error:', parseError);
      throw new Error('Gemini returned invalid JSON response');
    }
    
    return {
      estimates: parsedResponse.estimates,
      model: 'Gemini 2.0 Flash Experimental',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Fallback to mock data if API fails
    return getMockAIResponse('Gemini 2.0 Flash Experimental');
  }
}

// Mock AI response for development and fallback
function getMockAIResponse(model: string): AIResponse {
  console.log(`Using mock data for ${model} - API key not available or API failed`);
  
  return {
    estimates: [
      {
        id: '3',
        quantity: Math.floor(Math.random() * 20) + 10, // 10-30 sets
        specifications: 'Aluminum mounting rails with SS clamps and bolts, suitable for tile/metal roof installation',
        reasoning: 'Based on module count and typical mounting structure requirements per module'
      },
      {
        id: '4',
        quantity: Math.floor(Math.random() * 500) + 200, // 200-700 meters
        specifications: '4mm² twin core DC cable, 1000V rated, UV resistant for outdoor installation',
        reasoning: 'Estimated based on string count, average string length, and inter-string connections'
      },
      {
        id: '5',
        quantity: Math.floor(Math.random() * 100) + 50, // 50-150 meters
        specifications: '4mm² 3-core AC cable for inverter to distribution board connections',
        reasoning: 'Based on inverter count and typical distance from inverters to main AC distribution point'
      },
      {
        id: '6',
        quantity: 1,
        specifications: 'Complete earthing system with copper electrodes, GI strips, and bonding conductors',
        reasoning: 'Standard grounding system required for one solar installation site'
      },
      {
        id: '8',
        quantity: 1,
        specifications: '63A TPN MCB, surge protection devices, and isolation switches',
        reasoning: 'Standard AC distribution requirements for the system capacity'
      },
      {
        id: '9',
        quantity: 1,
        specifications: 'Lightning protection system with rods and grounding network',
        reasoning: 'Safety requirement for solar installations'
      },
      {
        id: '10',
        quantity: 1,
        specifications: 'Installation, testing, and commissioning services',
        reasoning: 'Complete system setup and verification'
      }
    ],
    model: `${model} (Mock Data)`,
    timestamp: new Date().toISOString()
  };
}

// Main function to call appropriate AI service
export async function generateBOQEstimates(
  prompt: string, 
  aiModel: 'openai' | 'gemini'
): Promise<AIResponse> {
  console.log(`Attempting to call ${aiModel.toUpperCase()} API...`);
  
  // Log environment status for debugging
  logEnvironmentStatus();
  
  if (aiModel === 'openai') {
    return await callOpenAI(prompt);
  } else {
    return await callGemini(prompt);
  }
}

// Define the enhanced BOQ template return type
interface EnhancedBOQItem {
  id: string;
  item: string;
  description: string;
  unit: string;
  quantity: number;
  source: 'design_summary' | 'calculated_estimated';
  category: string;
  specifications?: string;
}

// Define the design data interface
interface DesignData {
  totalModules: number;
  inverterCount: number;
  selectedPanel?: {
    manufacturer?: string;
    model?: string;
    name?: string;
    power_rating?: number;
    nominal_power?: number;
    efficiency?: number;
  } | null;
  selectedInverter?: {
    manufacturer?: string;
    model?: string;
    name?: string;
    nominal_ac_power_kw?: number;
    efficiency?: number;
  } | null;
  centralStringSizingData?: {
    dcdbConfiguration?: {
      totalDCDBCount?: number;
      dcdbPerInverter?: number;
      stringsPerDCDB?: number;
    };
    actualPVStringsPerDCDB?: number;
  } | null;
  acConfiguration?: {
    connectionType?: 'LV' | 'HV';
    useIDT?: boolean;
    usePowerTransformer?: boolean;
    idtConfig?: {
      powerRating: number;
      primaryVoltage: number;
      secondaryVoltage: number;
      count?: number;
    };
    powerTransformerConfig?: {
      powerRating: number;
      primaryVoltage: number;
      secondaryVoltage: number;
    };
    hvStringConfig?: {
      lvACCombinerPanels?: {
        count: number;
      };
      idts?: {
        count: number;
        configurations?: Array<{
          powerRating: number;
          primaryVoltage: number;
          secondaryVoltage: number;
        }>;
      };
      powerTransformer?: {
        powerRating: number;
        primaryVoltage: number;
        secondaryVoltage: number;
      };
    };
    hvCentralConfig?: {
      lvACCombinerPanels?: {
        count: number;
      };
      idts?: {
        count: number;
        configurations?: Array<{
          powerRating: number;
          primaryVoltage: number;
          secondaryVoltage: number;
        }>;
      };
      powerTransformer?: {
        powerRating: number;
        primaryVoltage: number;
        secondaryVoltage: number;
      };
    };
    acCombinerPanels?: {
      count: number;
    };
  } | null;
  isCentralInverter?: boolean;
  totalStringCount?: number;
  averageStringCurrent?: number;
  [key: string]: unknown;
}

// Helper function to get comprehensive BOQ template with ALL possible items
export function getComprehensiveBOQTemplate(designData: DesignData): EnhancedBOQItem[] {
  // Determine if items should have quantities based on design configuration
  const isHVConnection = designData.acConfiguration?.connectionType === 'HV';
  const isCentralInverter = designData.isCentralInverter;
  const hasIDT = isHVConnection && (designData.acConfiguration?.useIDT || designData.acConfiguration?.hvStringConfig?.idts || designData.acConfiguration?.hvCentralConfig?.idts);
  const hasPowerTransformer = isHVConnection && (designData.acConfiguration?.usePowerTransformer || designData.acConfiguration?.hvStringConfig?.powerTransformer || designData.acConfiguration?.hvCentralConfig?.powerTransformer);
  const hasDCDB = isCentralInverter && designData.centralStringSizingData?.dcdbConfiguration;

  return [
    // PV System Components
    {
      id: '1',
      item: 'Solar PV Modules',
      description: 'Monocrystalline/Polycrystalline solar panels with 25-year warranty',
      unit: 'Nos',
      quantity: designData.totalModules,
      source: 'design_summary',
      category: 'PV System',
      specifications: designData.selectedPanel ? 
        `${designData.selectedPanel.manufacturer} ${designData.selectedPanel.model || designData.selectedPanel.name}, ${designData.selectedPanel.power_rating || designData.selectedPanel.nominal_power}W, Efficiency: ${((designData.selectedPanel.efficiency || 0.2) * 100).toFixed(1)}%` : 
        'To be specified'
    },
    
    // Inverter Components
    {
      id: '2',
      item: isCentralInverter ? 'Central Inverters' : 'String Inverters',
      description: isCentralInverter ? 'Central string inverters for utility scale applications' : 'Grid-tied string inverters with MPPT technology',
      unit: 'Nos',
      quantity: designData.inverterCount,
      source: 'design_summary',
      category: 'Power Conversion',
      specifications: designData.selectedInverter ? 
        `${designData.selectedInverter.manufacturer} ${designData.selectedInverter.model || designData.selectedInverter.name}, ${designData.selectedInverter.nominal_ac_power_kw}kW, Efficiency: ${((designData.selectedInverter.efficiency || 0.96) * 100).toFixed(1)}%` : 
        'To be specified'
    },

    // DC Distribution Components
    {
      id: '3',
      item: 'DCDB (DC Distribution Boards)',
      description: 'DC distribution boards with string fuses and monitoring',
      unit: 'Nos',
      quantity: hasDCDB ? (designData.centralStringSizingData?.dcdbConfiguration?.totalDCDBCount || 0) : 0,
      source: 'design_summary',
      category: 'DC Distribution',
      specifications: hasDCDB ? `${designData.centralStringSizingData?.actualPVStringsPerDCDB || 0} strings per DCDB` : ''
    },
    
    {
      id: '4',
      item: 'String Fuses',
      description: 'DC fuses for string protection (1000V DC rated)',
      unit: 'Nos',
      quantity: designData.totalStringCount || 0,
      source: 'design_summary',
      category: 'Protection Equipment',
      specifications: designData.averageStringCurrent ? `${Math.ceil((designData.averageStringCurrent || 8) * 1.56)}A, 1000V DC rating` : ''
    },

    // AC Distribution Components
    {
      id: '5',
      item: 'LV AC Combiner Panels',
      description: 'Low voltage AC combiner panels for inverter output collection',
      unit: 'Nos',
      quantity: designData.acConfiguration?.hvStringConfig?.lvACCombinerPanels?.count || 
                designData.acConfiguration?.hvCentralConfig?.lvACCombinerPanels?.count || 
                designData.acConfiguration?.acCombinerPanels?.count || 0,
      source: 'design_summary',
      category: 'AC Distribution',
      specifications: designData.acConfiguration ? 'As per AC configuration' : ''
    },
    
    {
      id: '6',
      item: 'AC Distribution Board',
      description: 'Main AC distribution panel with protection devices',
      unit: 'Nos',
      quantity: !isHVConnection ? 1 : 0,
      source: 'calculated_estimated',
      category: 'AC Distribution',
      specifications: !isHVConnection ? 'Main AC distribution board' : ''
    },

    // Transformer Components (HV only)
    {
      id: '7',
      item: 'Inverter Duty Transformers (IDT)',
      description: 'Step-up transformers from LV to MV (HV connection only)',
      unit: 'Nos',
      quantity: hasIDT ? (
        designData.acConfiguration?.hvStringConfig?.idts?.count ||
        designData.acConfiguration?.hvCentralConfig?.idts?.count ||
        designData.acConfiguration?.idtConfig?.count || 0
      ) : 0,
      source: 'design_summary',
      category: 'Power Transformation',
      specifications: hasIDT ? (
        designData.acConfiguration?.hvStringConfig?.idts?.configurations?.[0] ? 
          `${designData.acConfiguration.hvStringConfig.idts.configurations[0].powerRating}MVA, ${designData.acConfiguration.hvStringConfig.idts.configurations[0].primaryVoltage}V/${designData.acConfiguration.hvStringConfig.idts.configurations[0].secondaryVoltage}V` :
        designData.acConfiguration?.hvCentralConfig?.idts?.configurations?.[0] ?
          `${designData.acConfiguration.hvCentralConfig.idts.configurations[0].powerRating}MVA, ${designData.acConfiguration.hvCentralConfig.idts.configurations[0].primaryVoltage}V/${designData.acConfiguration.hvCentralConfig.idts.configurations[0].secondaryVoltage}V` :
        designData.acConfiguration?.idtConfig ?
          `${designData.acConfiguration.idtConfig.powerRating}MVA, ${designData.acConfiguration.idtConfig.primaryVoltage}V/${designData.acConfiguration.idtConfig.secondaryVoltage}V` :
          'As per HV configuration'
      ) : ''
    },
    
    {
      id: '8',
      item: 'Power Transformer',
      description: 'Step-up power transformer for utility voltage level (HV connection only)',
      unit: 'Nos',
      quantity: hasPowerTransformer ? 1 : 0,
      source: 'design_summary',
      category: 'Power Transformation',
      specifications: hasPowerTransformer ? (
        designData.acConfiguration?.hvStringConfig?.powerTransformer ?
          `${designData.acConfiguration.hvStringConfig.powerTransformer.powerRating}MVA, ${designData.acConfiguration.hvStringConfig.powerTransformer.primaryVoltage}V/${designData.acConfiguration.hvStringConfig.powerTransformer.secondaryVoltage}V` :
        designData.acConfiguration?.hvCentralConfig?.powerTransformer ?
          `${designData.acConfiguration.hvCentralConfig.powerTransformer.powerRating}MVA, ${designData.acConfiguration.hvCentralConfig.powerTransformer.primaryVoltage}V/${designData.acConfiguration.hvCentralConfig.powerTransformer.secondaryVoltage}V` :
        designData.acConfiguration?.powerTransformerConfig ?
          `${designData.acConfiguration.powerTransformerConfig.powerRating}MVA, ${designData.acConfiguration.powerTransformerConfig.primaryVoltage}V/${designData.acConfiguration.powerTransformerConfig.secondaryVoltage}V` :
          'As per HV configuration'
      ) : ''
    },

    // Mounting System
    {
      id: '9',
      item: 'Mounting Structure',
      description: isCentralInverter ? 'Galvanized steel mounting structure with foundations' : 'Aluminum mounting rails, clamps, and fasteners',
      unit: 'Set',
      quantity: 0,
      source: 'calculated_estimated',
      category: 'Mounting System'
    },

    // Cables
    {
      id: '10',
      item: 'DC Cables (String to DCDB)',
      description: 'DC cables from strings to DCDB (4mm² twin core)',
      unit: 'Meter',
      quantity: 0,
      source: 'calculated_estimated',
      category: 'DC Cabling'
    },
    
    {
      id: '11',
      item: 'DC Cables (DCDB to Inverter)',
      description: 'Large DC cables from DCDB to central inverters',
      unit: 'Meter',
      quantity: 0,
      source: 'calculated_estimated',
      category: 'DC Cabling'
    },
    
    {
      id: '12',
      item: 'DC Cables (String to Inverter)',
      description: 'DC cables for string connections (4mm² twin core)',
      unit: 'Meter',
      quantity: 0,
      source: 'calculated_estimated',
      category: 'DC Cabling'
    },
    
    {
      id: '13',
      item: 'AC Cables (LV)',
      description: 'AC cables for LV connections',
      unit: 'Meter',
      quantity: 0,
      source: 'calculated_estimated',
      category: 'AC Cabling'
    },
    
    {
      id: '14',
      item: 'AC Cables (MV/HV)',
      description: 'MV/HV AC cables for utility connection',
      unit: 'Meter',
      quantity: 0,
      source: 'calculated_estimated',
      category: 'AC Cabling'
    },

    // Protection & Safety
    {
      id: '15',
      item: 'Grounding System',
      description: 'Complete earthing and bonding system',
      unit: 'Set',
      quantity: 1,
      source: 'calculated_estimated',
      category: 'Safety & Protection'
    },
    
    {
      id: '16',
      item: 'Lightning Protection System',
      description: 'Lightning rods, arresters, and grounding grid',
      unit: 'Set',
      quantity: 1,
      source: 'calculated_estimated',
      category: 'Protection'
    },
    
    {
      id: '17',
      item: 'Circuit Breakers',
      description: 'MCB, MCCB, ACB, VCB as per system requirements',
      unit: 'Lot',
      quantity: 1,
      source: 'calculated_estimated',
      category: 'Protection Equipment'
    },

    // Monitoring & Control
    {
      id: '18',
      item: 'Generation Meter',
      description: 'Bi-directional energy meter for net metering',
      unit: 'Nos',
      quantity: 1,
      source: 'design_summary',
      category: 'Monitoring'
    },
    
    {
      id: '19',
      item: 'SCADA & Monitoring System',
      description: 'Complete monitoring and control system',
      unit: 'Set',
      quantity: isCentralInverter ? 1 : 0,
      source: 'design_summary',
      category: 'Monitoring & Control',
      specifications: isCentralInverter ? 'Industrial grade SCADA system' : ''
    },

    // Civil Works & Services
    {
      id: '20',
      item: 'Civil Works',
      description: 'Foundations, cable trenches, and access roads',
      unit: 'Lumpsum',
      quantity: isCentralInverter ? 1 : 0,
      source: 'calculated_estimated',
      category: 'Civil Works',
      specifications: isCentralInverter ? 'Utility scale civil works' : ''
    },
    
    {
      id: '21',
      item: 'Installation & Commissioning',
      description: 'Complete installation, testing, and commissioning',
      unit: 'Job',
      quantity: 1,
      source: 'calculated_estimated',
      category: 'Services'
    }
  ];
}

// Helper function to enhance BOQ templates with better industry-standard items
export function getEnhancedBOQTemplate(
  template: 'residential_commercial' | 'industrial_utility',
  designData: DesignData
): EnhancedBOQItem[] {
  if (template === 'residential_commercial') {
    return [
      {
        id: '1',
        item: 'Solar PV Modules',
        description: 'Monocrystalline/Polycrystalline solar panels with 25-year warranty',
        unit: 'Nos',
        quantity: designData.totalModules,
        source: 'design_summary',
        category: 'PV System',
        specifications: designData.selectedPanel ? 
          `${designData.selectedPanel.manufacturer} ${designData.selectedPanel.model || designData.selectedPanel.name}, ${designData.selectedPanel.power_rating || designData.selectedPanel.nominal_power}W, Efficiency: ${((designData.selectedPanel.efficiency || 0.2) * 100).toFixed(1)}%` : 
          'To be specified'
      },
      {
        id: '2',
        item: 'String Inverters',
        description: 'Grid-tied string inverters with MPPT technology',
        unit: 'Nos',
        quantity: designData.inverterCount,
        source: 'design_summary',
        category: 'Power Conversion',
        specifications: designData.selectedInverter ? 
          `${designData.selectedInverter.manufacturer} ${designData.selectedInverter.model || designData.selectedInverter.name}, ${designData.selectedInverter.nominal_ac_power_kw}kW, Efficiency: ${((designData.selectedInverter.efficiency || 0.96) * 100).toFixed(1)}%` : 
          'To be specified'
      },
      {
        id: '3',
        item: 'Mounting Structure',
        description: 'Aluminum mounting rails, clamps, and fasteners',
        unit: 'Set',
        quantity: 0,
        source: 'calculated_estimated',
        category: 'Mounting System'
      },
      {
        id: '4',
        item: 'DC Cables',
        description: 'DC cables for string connections (4mm² twin core)',
        unit: 'Meter',
        quantity: 0,
        source: 'calculated_estimated',
        category: 'DC Electrical'
      },
      {
        id: '5',
        item: 'AC Cables',
        description: 'AC cables for inverter connections',
        unit: 'Meter',
        quantity: 0,
        source: 'calculated_estimated',
        category: 'AC Electrical'
      },
      {
        id: '6',
        item: 'Grounding System',
        description: 'Complete earthing and bonding system',
        unit: 'Set',
        quantity: 1,
        source: 'calculated_estimated',
        category: 'Safety & Protection'
      },
      {
        id: '7',
        item: 'Generation Meter',
        description: 'Bi-directional energy meter for net metering',
        unit: 'Nos',
        quantity: 1,
        source: 'design_summary',
        category: 'Monitoring'
      },
      {
        id: '8',
        item: 'AC Distribution Board',
        description: 'Main AC distribution panel with protection devices',
        unit: 'Nos',
        quantity: 1,
        source: 'calculated_estimated',
        category: 'AC Distribution'
      },
      {
        id: '9',
        item: 'Lightning Protection',
        description: 'Lightning arresters and surge protection devices',
        unit: 'Set',
        quantity: 1,
        source: 'calculated_estimated',
        category: 'Protection'
      },
      {
        id: '10',
        item: 'Installation & Commissioning',
        description: 'Complete installation, testing, and commissioning',
        unit: 'Job',
        quantity: 1,
        source: 'calculated_estimated',
        category: 'Services'
      }
    ];
  } else {
    // Industrial/Utility template
    return [
      {
        id: '1',
        item: 'Solar PV Modules',
        description: 'High-efficiency solar panels for utility scale (Tier-1 manufacturer)',
        unit: 'Nos',
        quantity: designData.totalModules,
        source: 'design_summary',
        category: 'PV System',
        specifications: designData.selectedPanel ? 
          `${designData.selectedPanel.manufacturer} ${designData.selectedPanel.model || designData.selectedPanel.name}, ${designData.selectedPanel.power_rating || designData.selectedPanel.nominal_power}W, Efficiency: ${((designData.selectedPanel.efficiency || 0.2) * 100).toFixed(1)}%` : 
          'To be specified'
      },
      {
        id: '2',
        item: 'Central Inverters',
        description: 'Central string inverters for utility scale applications',
        unit: 'Nos',
        quantity: designData.inverterCount,
        source: 'design_summary',
        category: 'Power Conversion',
        specifications: designData.selectedInverter ? 
          `${designData.selectedInverter.manufacturer} ${designData.selectedInverter.model || designData.selectedInverter.name}, ${designData.selectedInverter.nominal_ac_power_kw}kW, Efficiency: ${((designData.selectedInverter.efficiency || 0.96) * 100).toFixed(1)}%` : 
          'To be specified'
      },
      {
        id: '3',
        item: 'DCDB (DC Distribution Boards)',
        description: 'DC distribution boards with string fuses and monitoring',
        unit: 'Nos',
        quantity: designData.centralStringSizingData?.dcdbConfiguration?.totalDCDBCount || 0,
        source: 'design_summary',
        category: 'DC Distribution',
        specifications: `${designData.centralStringSizingData?.actualPVStringsPerDCDB || 0} strings per DCDB`
      },
      {
        id: '4',
        item: 'String Fuses',
        description: 'DC fuses for string protection (1000V DC rated)',
        unit: 'Nos',
        quantity: designData.totalStringCount,
        source: 'design_summary',
        category: 'Protection Equipment',
        specifications: `${Math.ceil((designData.averageStringCurrent || 8) * 1.56)}A, 1000V DC rating`
      },
      {
        id: '5',
        item: 'Fixed Tilt Mounting Structure',
        description: 'Galvanized steel mounting structure with foundations',
        unit: 'Set',
        quantity: 0,
        source: 'calculated_estimated',
        category: 'Mounting System'
      },
      {
        id: '6',
        item: 'DC Cables (String to DCDB)',
        description: 'DC cables from strings to DCDB (4mm² twin core)',
        unit: 'Meter',
        quantity: 0,
        source: 'calculated_estimated',
        category: 'DC Cabling'
      },
      {
        id: '7',
        item: 'DC Cables (DCDB to Inverter)',
        description: 'Large DC cables from DCDB to central inverters',
        unit: 'Meter',
        quantity: 0,
        source: 'calculated_estimated',
        category: 'DC Cabling'
      },
      {
        id: '8',
        item: 'AC Cables',
        description: 'MV/HV AC cables for utility connection',
        unit: 'Meter',
        quantity: 0,
        source: 'calculated_estimated',
        category: 'AC Cabling'
      },
      {
        id: '9',
        item: 'Step-up Transformer',
        description: 'Power transformer for utility voltage level',
        unit: 'Nos',
        quantity: 1,
        source: 'calculated_estimated',
        category: 'Power Transformation'
      },
      {
        id: '10',
        item: 'SCADA & Monitoring System',
        description: 'Complete monitoring and control system',
        unit: 'Set',
        quantity: 1,
        source: 'design_summary',
        category: 'Monitoring & Control'
      },
      {
        id: '11',
        item: 'Lightning Protection System',
        description: 'Lightning rods, arresters, and grounding grid',
        unit: 'Set',
        quantity: 1,
        source: 'calculated_estimated',
        category: 'Protection'
      },
      {
        id: '12',
        item: 'Civil Works',
        description: 'Foundations, cable trenches, and access roads',
        unit: 'Lumpsum',
        quantity: 1,
        source: 'calculated_estimated',
        category: 'Civil Works'
      }
    ];
  }
}
