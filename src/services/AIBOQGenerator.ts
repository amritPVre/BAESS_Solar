// AI-Based Solar PV BOQ Generator Service
// Uses AI/LLM to generate BOQ based on detailed prompt specifications
// Combines BOQ parameters with detailed prompt from working-reference/solar_pv_boq_prompt.md

import { BOQParameters } from '../types/boq-parameters';
import { callOpenAI, callGemini } from '../utils/aiServices';
import { boqParameterManager } from './BOQParameterManager';

export interface AIBOQItem {
  description: string;
  specifications: string;
  qty: string;
}

export interface AIBOQResponse {
  items: AIBOQItem[];
  model: string;
  timestamp: string;
  success: boolean;
  error?: string;
}

export class AIBOQGenerator {
  private static instance: AIBOQGenerator;
  
  public static getInstance(): AIBOQGenerator {
    if (!AIBOQGenerator.instance) {
      AIBOQGenerator.instance = new AIBOQGenerator();
    }
    return AIBOQGenerator.instance;
  }

  /**
   * Generate BOQ using AI/LLM based on detailed prompt specifications
   * @param calculationType - LV, HV_String, or HV_Central
   * @param aiModel - 'openai' or 'gemini'
   */
  public async generateBOQ(
    calculationType: 'LV' | 'HV_String' | 'HV_Central',
    aiModel: 'openai' | 'gemini' = 'openai'
  ): Promise<AIBOQResponse> {
    try {
      console.log('🤖 Generating Solar PV BOQ using AI/LLM...');
      console.log('📊 Calculation Type:', calculationType);
      console.log('🧠 AI Model:', aiModel);

      // Step 1: Get the detailed prompt template
      const detailedPrompt = this.getDetailedPromptTemplate();
      
      // Step 2: Extract and format BOQ parameters
      const parametersPrompt = boqParameterManager.formatForAIPrompt(calculationType);
      
      // Step 3: Combine detailed prompt with parameters
      const completePrompt = this.combinePromptWithParameters(detailedPrompt, parametersPrompt);
      
      console.log('📝 Complete prompt prepared, sending to AI...');
      
      // Step 4: Send to AI service
      let aiResponse;
      if (aiModel === 'openai') {
        aiResponse = await callOpenAI(completePrompt);
      } else {
        aiResponse = await callGemini(completePrompt);
      }
      
      // Step 5: Parse AI response to BOQ items
      const boqItems = this.parseAIResponseToBOQ(aiResponse);
      
      console.log('✅ AI BOQ generation completed:', boqItems.length, 'items');
      
      return {
        items: boqItems,
        model: aiResponse.model,
        timestamp: aiResponse.timestamp,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Error generating AI BOQ:', error);
      
      return {
        items: [],
        model: aiModel,
        timestamp: new Date().toISOString(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get the detailed prompt template from solar_pv_boq_prompt.md
   */
  private getDetailedPromptTemplate(): string {
    return `# 🌍 Master Prompt for Solar PV Plant BOQ

You are an expert PV electrical designer. Produce a Bill of Quantities (BOQ) for a Solar PV plant covering:

## Scope of BOQ items
1. DC structure earthing (bonding jumpers, PE conductors, DC earth pits)  
2. Lightning protection (ESE lightning arrestors, LA earth pits, earthing compound)  
3. AC earthing (PE conductors, equipment bonding, earth grid strips & rods)  
4. AC instrumentation & protection  
   - Current Transformers (protection & metering)  
   - Potential Transformers (if applicable)  
   - AC Surge Protective Devices (SPDs)  
   - Protection relays (LV & HV panels)  
   - Communication cables  
   - Net meter at PoC  
5. Busbars (LV & HV panels/substation)  
6. Transformer earthing (neutral and body earthing pits)  

Follow IEC 60364-5-54, IEC 62561, IEC 60228, IEC 61869, IEC 60255, IEC 61643-11, IEC 60099-4, IEC 61439, IEC 62271, DLMS/IEC 62056, IEC 62056, IS 3043.  

Return only a 3-column BOQ table: **Description | Specifications | Qty**.  

---

## Inputs you will provide
{PARAMETERS_PLACEHOLDER}

---

## Rules & Defaults

### 1. DC Structure Earthing
- Bonding jumpers: 6 mm² Cu, PVC, 2 m each, 1 per table  
- PE sizing: adiabatic (Ik = Isc, t = 1 s, k = 115), min 6 mm², round to IEC 60228 size  
- PE length = DC cable length (default 5 m per table if not given)  
- Earth pits: 1 pit per 20 tables, copper-bonded rod 3 m × Ø16 mm  

### 2. Lightning Protection (ESE type)
- No. of LA = plant area ÷ 10,000 m² (round up)  
- LA spec: ESE LA, 79 m radius, SS mast 6 m, IEC 62305/62561  
- Each LA has 3 dedicated earth pits (Cu-bonded 3 m × Ø16 mm rods)  
- Earthing compound: 25 kg per pit, bentonite+graphite mix, IEC 62561-7  

### 3. AC Earthing
- LV PE: IEC Table 54.2 (≤16 mm² → same; 16<S≤35 → 16 mm²; >35 → S/2)  
- HV PE: adiabatic (Ik = 10 kA, t = 1 s, k = 115; round up)  
- PE length = phase cable length per segment  
- Equipment bonding: LV → 6 mm², 2 m each; HV → 16 mm², 3 m each, 2 per inverter skid/IDT/PT  
- Earth grid: LV = 30×30 m, HV = 40×40 m; copper strip 50×6 mm, 10 m spacing; rods every 20 m + corners; soil resistivity (Ω·m): saturated clay 30, clay 60, loam 100, moist sand 200, dry sand 500, rock 1000; Rg ≤ 5 Ω (LV), ≤ 1 Ω (HV), add rods if needed  

### 4. CTs & PTs
- LV CTs: Protection 5P10, 10 VA, sec 5 A, prim = 1.2× breaker rating; Metering 0.5, 10 VA, sec 5 A  
- HV CTs: Protection 5P20, 15 VA, sec 5 A, prim = 1.25× current; Metering 0.2S, 15 VA, sec 5 A  
- LV PTs: only if required, 415/√3 → 110/√3, Class 0.5, 15 VA  
- HV PTs: 11 kV/√3 → 110 V/√3, Class 0.5 (25 VA), protection 3P (25 VA)  

### 5. SPDs
- LV: Type 2, 3-phase, Uc = 320 V, Imax = 40 kA, Up ≤ 1.5 kV  
- LV incomer/Tx sec: Type 1+2 if lightning/overhead, else Type 2  
- HV: ZnO arrester, Ur = 18 kV (for 11 kV), Ur = 42 kV (for 33 kV)  

### 6. Relays
- LV: numeric, 50/51, 50N/51N, 27/59, 81O/81U  
- HV: add 46, 49, 87T as required  

### 7. Communication
- RS-485 shielded, 2-pair, 24 AWG, LSZH, 120 Ω, +10% slack  
- Cat-6 LSZH for LAN, +10% slack  
- Single-mode 12-core OS2 armoured fiber, +10% slack  

### 8. Net Meter
- 3ph, 4w, bidirectional, Class 0.2S, DLMS/IEC 62056, CT/PT-operated 5 A, RS-485 + Ethernet  

### 9. Busbars
- LV panels: copper busbar rated 1.5× incomer current, temp rise ≤ 70°C, IEC 61439-2  
- HV switchgear: copper busbar rated 1.25× current, 31.5 kA short-time withstand (1 s), IEC 62271  

### 10. Transformer Earthing
- Each transformer neutral: 2 dedicated earth pits (Cu-bonded rod 3 m × Ø16 mm) interconnected  
- Each transformer body/tank: 2 dedicated earth pits (Cu-bonded rod 3 m × Ø16 mm) interconnected  
- Total per transformer: 4 pits (2 neutral, 2 body)  
- Interconnection via Cu strip 50×6 mm to earth grid  
- Earthing compound: 25 kg per pit  

---

## Output Format (strict)
Return only a BOQ table with 3 columns:  

**Description | Specifications | Qty**  

⚠️ No explanations, no ranges, no notes — only deterministic values.  

---

## Sample Output (HV example)

| Description | Specifications | Qty |  
|---|---|---|  
| DC Bonding Jumpers | 6 mm² tinned Cu, PVC, 2 m each, IEC 60364-5-54 | 500 Nos |  
| DC PE Cable | 10 mm² tinned Cu, PVC, IEC 60364-5-54/60228 | 2500 m |  
| DC Earth Pits | Copper-bonded rod 3 m × Ø16 mm, IEC 62561-2 | 25 Nos |  
| ESE Lightning Arrestor | 79 m radius, SS mast 6 m, IEC 62305/62561 | 5 Nos |  
| LA Earth Pits | Copper-bonded rod 3 m × Ø16 mm, IEC 62561-2 | 15 Nos |  
| Earthing Compound | 25 kg bag, bentonite-graphite, IEC 62561-7 | 40 Bags |  
| Earthing Cable (PE) – Inverter→IDT | 35 mm² tinned Cu, PVC, IEC 60364-5-54/60228 | 500 m |  
| Equipment Bonding Jumpers | 16 mm² tinned Cu, PVC, 3 m each, IEC 60364-5-54 | 20 Nos |  
| Earth Grid Strip | Cu strip 50×6 mm, IEC 62561-2 | 600 m |  
| Earth Rods | Copper-bonded rod 3 m × Ø16 mm, IEC 62561-2 | 24 Nos |  
| Transformer Neutral Earth Pits | 3 m Cu-bonded rod Ø16 mm, IEC 62561-2 | 4 Nos |  
| Transformer Body Earth Pits | 3 m Cu-bonded rod Ø16 mm, IEC 62561-2 | 4 Nos |  
| LV Busbar | Cu busbar, rated 1.5× incomer current, IEC 61439-2 | 1 Lot |  
| HV Busbar | Cu busbar, rated 1.25× current, 31.5 kA 1s, IEC 62271 | 1 Lot |  
| CTs – HV Protection | 600/5 A, 5P20, 15 VA, IEC 61869-2 | 3 Nos |  
| CTs – HV Metering | 600/5 A, 0.2S, 15 VA, IEC 61869-2 | 3 Nos |  
| PTs – HV | 11 kV/√3 : 110 V/√3, Class 0.5 (25 VA), IEC 61869-3 | 3 Nos |  
| ZnO Surge Arrester – 11 kV | Ur 18 kV, IEC 60099-4 | 3 Nos |  
| Relay – HV Feeder | Numeric, 50/51, 50N/51N, 27/59, 81O/81U, IEC 60255 | 1 Nos |  
| RS-485 Cable | 2-pair, 24 AWG, LSZH, 120 Ω | 400 m |  
| Fiber Optic Cable | 12-core OS2, armoured, IEC 60793 | 300 m |  
| Net Meter at PoC | 3ph 4w, Class 0.2S, DLMS/IEC 62056 | 1 Nos |  `;
  }

  /**
   * Combine the detailed prompt with the extracted parameters
   */
  private combinePromptWithParameters(detailedPrompt: string, parametersPrompt: string): string {
    return detailedPrompt.replace('{PARAMETERS_PLACEHOLDER}', parametersPrompt);
  }

  /**
   * Parse AI response to extract BOQ items
   * Expected format: table with Description | Specifications | Qty columns
   */
  private parseAIResponseToBOQ(aiResponse: any): AIBOQItem[] {
    try {
      console.log('🔍 Parsing AI response to BOQ items...');
      
      // Get the content from AI response
      const content = aiResponse.estimates?.[0]?.reasoning || aiResponse.content || '';
      
      if (!content) {
        throw new Error('No content received from AI response');
      }

      // Extract table from the response
      const boqItems: AIBOQItem[] = [];
      const lines = content.split('\n');
      let inTable = false;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines and headers
        if (!trimmedLine || trimmedLine.includes('Description') || trimmedLine.includes('---')) {
          if (trimmedLine.includes('Description')) {
            inTable = true;
          }
          continue;
        }
        
        // If we're in the table and line contains |, parse it
        if (inTable && trimmedLine.includes('|')) {
          const parts = trimmedLine.split('|').map(part => part.trim()).filter(part => part);
          
          if (parts.length >= 3) {
            boqItems.push({
              description: parts[0],
              specifications: parts[1],
              qty: parts[2]
            });
          }
        }
      }
      
      console.log('📋 Parsed', boqItems.length, 'BOQ items from AI response');
      return boqItems;
      
    } catch (error) {
      console.error('❌ Error parsing AI response:', error);
      return [];
    }
  }

  /**
   * Format BOQ items as table string
   */
  public formatBOQTable(boqItems: AIBOQItem[]): string {
    let table = '| Description | Specifications | Qty |\n';
    table += '|---|---|---|\n';
    
    boqItems.forEach(item => {
      table += `| ${item.description} | ${item.specifications} | ${item.qty} |\n`;
    });

    return table;
  }

  /**
   * Export BOQ items to CSV
   */
  public exportToCSV(boqItems: AIBOQItem[]): string {
    let csv = 'Description,Specifications,Qty\n';
    boqItems.forEach(item => {
      csv += `"${item.description}","${item.specifications}","${item.qty}"\n`;
    });
    return csv;
  }
}

// Export singleton instance
export const aiBOQGenerator = AIBOQGenerator.getInstance();
