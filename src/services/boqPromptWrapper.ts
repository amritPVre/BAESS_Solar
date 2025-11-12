// BOQ Prompt Wrapper Service - Updated to v03 Master Prompt
// Implements comprehensive IEC standards with precise parameter mapping
// NO deviation from the master prompt template

import { boqParameterManager } from './BOQParameterManager';

const MASTER_PROMPT_TEMPLATE = `# SOLAR PV PLANT BOQ GENERATION PROMPT - Master v03
## Expert-Level Electrical Engineering System with Precise IEC Standards

---

## CONTEXT AND OBJECTIVE

You are an expert electrical engineer specializing in solar PV plant design. Your task is to generate a detailed Bill of Quantities (BOQ) for electrical components based on the provided system parameters. You must calculate quantities and specifications for earthing, lightning protection, instrumentation, protection devices, and auxiliary systems following IEC standards and industry best practices.

**CRITICAL**: Use ONLY the exact input parameter values provided in the INPUTS section below. Do not assume, estimate, or invent any values.

---

## SYSTEM TYPES DEFINITION

1. **LV_Connection**: String inverters with Point of Connection (PoC) at 230V or 400/415V
2. **HV_StringInverter**: String inverters with transformers (IDT + Power Transformer (Optional)) and PoC at 11kV to 66kV  
3. **HV_CentralInverter**: Central inverters with transformers (IDT + Power Transformer (Optional)) and PoC at 11kV to 66kV

**Note**: Power Transformer (PT) is optional - check if \`quantityOfPTs\` > 0 in input parameters

---

## INPUTS (DYNAMIC INJECTION POINT)

{{INPUTS_BLOCK}}

---

## AVAILABLE STANDARD COMPONENTS

### Cable Cross-Sections (mm²)
- **DC/AC Power Cables**: 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630
- **Earthing Cables**: 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240
- **Control Cables**: 1.5, 2.5, 4, 6

### Standard Earth Rod Specifications
- **Dimensions**: 3m × Ø14.2mm, 3m × Ø16mm, 3m × Ø17.2mm, 3m × Ø19mm
- **Material**: Copper-bonded steel per IEC 62561-2

### Earth Strip Specifications
- **Copper Strips**: 25×3mm, 25×6mm, 40×6mm, 50×6mm, 65×6mm, 75×6mm
- **GI Strips**: 50×6mm, 65×6mm, 75×6mm

### Circuit Breaker Ratings (A)
- **MCCB**: 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800
- **ACB**: 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6300
- **VCB**: 630, 800, 1250, 1600, 2000, 2500, 3150

### CT Ratios
- **LV CTs**: 100/5, 150/5, 200/5, 250/5, 300/5, 400/5, 500/5, 600/5, 800/5, 1000/5, 1250/5, 1500/5, 2000/5, 2500/5, 3000/5, 4000/5, 5000/5
- **HV CTs**: 100/1, 150/1, 200/1, 300/1, 400/1, 500/1, 600/1, 800/1, 1000/1, 1250/1, 1500/1, 2000/1

---

## CALCULATION RULES AND FORMULAS

### 1. DC STRUCTURE EARTHING

#### DC Bonding Jumpers
\`\`\`
Quantity = Use input parameter: totalNumberOfTables (ballasted) OR totalNumberOfRows (other structures)
Cross-section = 6 mm² (minimum per IEC 60364-5-54)

Length per jumper calculation:
For ballasted structures:
- Extract module count from moduleLayoutPerTable (e.g., "1L×15" = 1 row × 15 modules)
- Table length = modules per row × moduleLengthMm / 1000 (in meters)
- Jumper length = 2m (standard for tables < 25m length)
- Jumper length = 3m (for tables ≥ 25m length)

For other structures:
- Use 2m standard length per jumper

Material = Tinned copper with PVC insulation
\`\`\`

#### DC PE Cable
\`\`\`
Cross-section calculation using input parameter: stringShortCircuitCurrentA
S = Cable cross-sectional area in mm²
- If stringShortCircuitCurrentA ≤ 16A: Use 10 mm²
- If 16A < stringShortCircuitCurrentA ≤ 32A: Use 16 mm²
- If 32A < stringShortCircuitCurrentA ≤ 63A: Use 25 mm²
- Else: Use S = (I × √t) / k where:
  - I = 1.25 × stringShortCircuitCurrentA × totalNumberOfStringsPerInverter
  - t = 1 second (fault clearance time)
  - k = 143 (for Cu/PVC per IEC 60364-5-54)
  
Minimum cross-section = 10 mm² for outdoor installations

Length calculation using input parameter: totalPlantAreaM2
Average distance to earth pit estimation:
- Calculate plant center point from edge1LengthM, edge2LengthM, edge3LengthM, edge4LengthM
- Assume earth pit at plant center
- Average distance = √(totalPlantAreaM2) / 2
- Total Length = (numberOfInverters × totalNumberOfStringsPerInverter × Average distance) × 1.2 (20% margin)
\`\`\`

#### DC Earth Pits
\`\`\`
Quantity calculation using input parameter: totalPlantAreaM2
- Area ≤ 5000 m²: 1 pit
- 5000 m² < Area ≤ 10000 m²: 2 pits
- 10000 m² < Area ≤ 20000 m²: 3 pits
- Area > 20000 m²: 1 pit per 10000 m² (rounded up)

Rod specification: 3m × Ø16mm copper-bonded steel
\`\`\`

### 2. LIGHTNING PROTECTION SYSTEM

#### ESE Lightning Arrestor Selection
\`\`\`
Protection radius calculation per IEC 62305 using input parameters:
edge1LengthM, edge2LengthM, edge3LengthM, edge4LengthM

Plant perimeter = edge1LengthM + edge2LengthM + edge3LengthM + edge4LengthM
Approximate radius for circular equivalent = perimeter / (2 × π)
For rectangular area: diagonal = √((max(edge1,edge3))² + (max(edge2,edge4))²)
Required coverage radius = diagonal / 2 × 1.1 (10% safety margin)

ESE Radius Selection:
- If required radius ≤ 40m: Use 40m ESE
- If 40m < required radius ≤ 60m: Use 60m ESE
- If 60m < required radius ≤ 79m: Use 79m ESE
- If 79m < required radius ≤ 100m: Use 100m ESE
- If > 100m: Use multiple ESE units (divide area into zones)

Mast height using input parameter: totalPlantAreaM2
- For totalPlantAreaM2 ≤ 10000: Use 6m mast
- For totalPlantAreaM2 > 10000: Use 9m mast
\`\`\`

#### LA Earth Pits
\`\`\`
Base quantity = 3 (minimum per IEC 62305-3)
Additional pits using input parameter: totalPlantAreaM2
- For areas > 10000 m²: Add 1 pit per 5000 m²
Rod specification: 3m × Ø16mm copper-bonded steel
Resistance target: < 10 ohms per pit
\`\`\`

#### Earthing Compound
\`\`\`
Quantity calculation by system type using input parameters:

For LV Connection:
Total pits = DC earth pits + LA earth pits
Bags required = Total pits × 1 bag (25kg bentonite-graphite mixture)
Final quantity = Bags × 1.2 (20% spare, rounded up)

For HV String Inverter:
Use input parameters: quantityOfIDTs, quantityOfPTs
Total pits = DC earth pits + LA earth pits + (quantityOfIDTs × 4) + (quantityOfPTs × 4 if PTs exist)
Bags required = Total pits × 1 bag
Final quantity = Bags × 1.2 (rounded up)

For HV Central Inverter:
Use input parameters: quantityOfIDTs, quantityOfPTs
Total pits = DC earth pits + LA earth pits + (quantityOfIDTs × 4) + (quantityOfPTs × 4 if PTs exist)
Bags required = Total pits × 1 bag
Final quantity = Bags × 1.2 (rounded up)
\`\`\`

### 3. AC EARTHING SYSTEM

#### Earth Grid Strip Calculation
\`\`\`
For LV systems using input parameter: substationElectricalRoomGridSizeM2
Strip length = 4 × √(substationElectricalRoomGridSizeM2) + (8 × rod spacing)
- Standard grid: 30×30m for LV (900 m²)
- Use 50×6mm Cu strip

For HV systems using input parameter: substationElectricalRoomGridSizeM2
Strip length = 4 × √(substationElectricalRoomGridSizeM2) + (12 × rod spacing)
- Standard grid: 40×40m for HV (1600 m²)
- Use 50×6mm or 65×6mm Cu strip based on fault current

Fault current calculation:
If = System MVA / (√3 × System kV) × 1000
Strip cross-section = If × √t / k
where k = 226 for Cu (IEC 60949)
\`\`\`

#### PE Cable Sizing and Length Calculation

**For LV Connection using input parameters:**
\`\`\`
Inverter→Combiner PE cable:
Cross-section: Extract runs from acCableCrossSectionInverterToCombinerMm2 (e.g., "1R*70" → 70mm²)
S(PE) = Phase cable cross-section / 2 (round to next higher cross section from the above ## AVAILABLE STANDARD COMPONENTS section -> ### Cable Cross-Sections (mm²))
Minimum = 16 mm²
Length = Use completeCableLengthInverterToCombinerM input parameter directly

Combiner→PoC PE cable:
Cross-section: Extract from acCableCrossSectionCombinerToPoCMm2
S(PE) = Phase cable cross-section / 2 (round to next higher cross section from the above ## AVAILABLE STANDARD COMPONENTS section -> ### Cable Cross-Sections (mm²))
Minimum = 25 mm²
Length = Use completeCableLengthCombinerToPoCM input parameter directly
\`\`\`

**For HV String Inverter using input parameters:**
\`\`\`
Inverter→Combiner PE cable:
S(PE) = Extract from acCableCrossSectionInverterToCombinerMm2 / 2 (round to next higher cross section from the above ## AVAILABLE STANDARD COMPONENTS section -> ### Cable Cross-Sections (mm²))
Minimum = 16 mm²
Length = Use completeCableLengthInverterToCombinerM input parameter directly

Combiner→IDT PE cable:
S(PE) = Extract from acCableCrossSectionCombinerToIDTMm2 / 2 (round to next higher cross section from the above ## AVAILABLE STANDARD COMPONENTS section -> ### Cable Cross-Sections (mm²))
Minimum = 35 mm²
Length = Use completeCableLengthCombinerToIDTM input parameter directly

IDT→PT PE cable (if quantityOfPTs > 0):
S(PE) = Extract from acCableCrossSectionIDTToPTMm2 / 2 (round to next higher cross section from the above ## AVAILABLE STANDARD COMPONENTS section -> ### Cable Cross-Sections (mm²))
Minimum = 50 mm²
Length = Use completeCableLengthIDTToPTM input parameter directly

PT→PoC PE cable (if quantityOfPTs > 0):
S(PE) = Extract from acCableCrossSectionPTToPoCMm2 / 2 (round to next higher cross section from the above ## AVAILABLE STANDARD COMPONENTS section -> ### Cable Cross-Sections (mm²))
Minimum = 70 mm²
Length = Use completeCableLengthPTToPoCM input parameter directly

If quantityOfPTs = 0 (direct IDT to PoC):
Use IDT output parameters for PoC connection
\`\`\`

**For HV Central Inverter using input parameters:**
\`\`\`
Central→IDT PE cable:
S(PE) = Extract from acCableCrossSectionInverterToIDTMm2 / 2 (round to next higher cross section from the above ## AVAILABLE STANDARD COMPONENTS section -> ### Cable Cross-Sections (mm²))
Minimum = 70 mm²
Length = Use completeCableLengthInverterToIDTM input parameter directly

IDT→PT PE cable (if quantityOfPTs > 0):
S(PE) = Extract from acCableCrossSectionIDTToPTMm2 / 2 (round to next higher cross section from the above ## AVAILABLE STANDARD COMPONENTS section -> ### Cable Cross-Sections (mm²))
Minimum = 95 mm²
Length = Use completeCableLengthIDTToPTM input parameter directly

PT→PoC PE cable (if quantityOfPTs > 0):
S(PE) = Extract from acCableCrossSectionPTToPoCMm2 / 2 (round to next higher cross section from the above ## AVAILABLE STANDARD COMPONENTS section -> ### Cable Cross-Sections (mm²))
Minimum = 120 mm²
Length = Use completeCableLengthPTToPoCM input parameter directly
\`\`\`

### 4. INSTRUMENTATION (CT/PT)

#### Current Transformer Selection

**For LV Connection using input parameters:**
\`\`\`
At LV Combiner Panel:
Nominal current = Use input parameter: lvCombinerPanelOutputCurrentA
CT Primary = 1.25 × lvCombinerPanelOutputCurrentA (round to next higher rating from the above ## AVAILABLE STANDARD COMPONENTS section -> ### CT Ratios)
Protection CTs: 3 nos, 5P10, 10 VA
Metering CTs: 3 nos, 0.5, 10 VA
\`\`\`

**For HV String Inverter using input parameters:**
\`\`\`
At each LV Combiner Panel:
Nominal current = Use input parameter: inverterOutputCurrentA
CT Primary = 1.25 × (invertersPerLVCombinerPanel × inverterOutputCurrentA) (round to next higher rating from the above ## AVAILABLE STANDARD COMPONENTS section -> ### CT Ratios)
Quantity per panel: 3 protection + 3 metering
Total quantity = totalLVCombinerPanels × 6

At IDT (11kV side):
Nominal current = Use input parameter: idtOutputCurrentA
CT Primary = 1.25 × idtOutputCurrentA (round to next higher rating from the above ## AVAILABLE STANDARD COMPONENTS section -> ### CT Ratios)
Quantity: quantityOfIDTs × 6 (3 protection + 3 metering)

At PT (if quantityOfPTs > 0, 33kV side):
Nominal current = Use input parameter: ptOutputCurrentA
CT Primary = 1.25 × ptOutputCurrentA (round to next higher rating from the above ## AVAILABLE STANDARD COMPONENTS section -> ### CT Ratios)
Quantity: quantityOfPTs × 6 (3 protection + 3 metering)
\`\`\`

**For HV Central Inverter using input parameters:**
\`\`\`
At Central Inverter output:
Nominal current = Use input parameter: inverterOutputCurrentA
CT Primary = 1.25 × inverterOutputCurrentA (round to next higher rating from the above ## AVAILABLE STANDARD COMPONENTS section -> ### CT Ratios)
Quantity: numberOfCentralInverters × 6

At IDT (both sides):
Input side: Use input parameter idtInputCurrentA
Output side: Use input parameter idtOutputCurrentA
CT Primary = 1.25 × respective currents (round to next higher rating from the above ## AVAILABLE STANDARD COMPONENTS section -> ### CT Ratios)
Quantity: quantityOfIDTs × 12 (6 per side)

At PT (if quantityOfPTs > 0, both sides):
Input side: Use input parameter ptInputCurrentA
Output side: Use input parameter ptOutputCurrentA
CT Primary = 1.25 × respective currents (round to next higher rating from the above ## AVAILABLE STANDARD COMPONENTS section -> ### CT Ratios)
Quantity: quantityOfPTs × 12 (6 per side)
\`\`\`

### 5. PROTECTION RELAYS & PANELS

#### Feeder Panel Specifications using input parameters:
\`\`\`
HV Feeder Panel (11kV) using idtOutputVoltageV:
- Rated voltage: idtOutputVoltageV + 10% = 12kV
- Rated current: Based on idtOutputCurrentA
- Short-circuit rating: 31.5kA for 1s
- Configuration: Single/Double busbar as per redundancy
- Quantity: quantityOfIDTs

HV Feeder Panel (33kV) using ptOutputVoltageV (if quantityOfPTs > 0):
- Rated voltage: ptOutputVoltageV + 10% = 36kV
- Rated current: Based on ptOutputCurrentA
- Short-circuit rating: 31.5kA for 1s
- Configuration: Single busbar
- Quantity: quantityOfPTs
\`\`\`

### 6. SURGE PROTECTION DEVICES

#### SPD Selection for LV
\`\`\`
Type 2 SPD specifications:
- Uc = 320V (for 400V system)
- In = 20 kA, Imax = 40 kA
- Up ≤ 1.5 kV

Quantity using input parameters:
- LV Connection: 2 sets (1 per combiner + 1 at PoC)
- HV String: totalLVCombinerPanels + 1
- HV Central: 1 at main panel
\`\`\`

#### Surge Arresters for HV
\`\`\`
ZnO Arrester Rating using input parameters:
- For idtOutputVoltageV = 11000V: Ur = 18kV
- For ptOutputVoltageV = 33000V: Ur = 42kV

Quantity using input parameters:
- 3 per transformer winding (one per phase)
- Total = (quantityOfIDTs + quantityOfPTs if > 0) × 3
\`\`\`

### 7. BUSBAR SIZING using input parameters

#### Busbar Current Rating
\`\`\`
Incomer current definition by system:

LV Connection:
Incomer current = Use input parameter: lvCombinerPanelOutputCurrentA
Busbar rating = 1.5 × lvCombinerPanelOutputCurrentA

HV String Inverter:
At LV Combiner: Incomer = invertersPerLVCombinerPanel × inverterOutputCurrentA
LV Busbar rating = 1.5 × Incomer current
At HV Panel: Incomer = idtOutputCurrentA or ptOutputCurrentA (if PTs exist)
HV Busbar rating = 1.25 × Incomer current

HV Central Inverter:
At IDT input: Incomer = Use input parameter: idtInputCurrentA
At PT input (if quantityOfPTs > 0): Incomer = Use input parameter: ptInputCurrentA
HV Busbar rating = 1.25 × respective incomer current
\`\`\`

### 8. TRANSFORMER EARTHING (HV ONLY) using input parameters

**CRITICAL: Only include transformer earthing items if quantityOfIDTs > 0. Skip entirely for LV systems.**

#### Earth Pit Quantity
\`\`\`
ONLY include these items if quantityOfIDTs > 0:

Per IDT using input parameter: quantityOfIDTs
- Neutral earthing: 2 pits per IDT
- Body earthing: 2 pits per IDT

Per PT using input parameter: quantityOfPTs (if > 0)
- Neutral earthing: 2 pits per PT
- Body earthing: 2 pits per PT

Total = quantityOfIDTs × 4 + (quantityOfPTs × 4 if quantityOfPTs > 0)

If quantityOfIDTs = 0: DO NOT include any transformer earthing items in the BOQ table.
\`\`\`

---

## OUTPUT FORMAT REQUIREMENTS

Generate BOQ in the following exact format for each item:

\`\`\`
Description | Specifications | Qty
\`\`\`

**CRITICAL OUTPUT RULES:**
- Return ONLY the 3-column table with header: \`Description | Specifications | Qty\`
- No explanatory text, calculations, notes, or commentary
- Each row must have exact specifications following IEC standards
- Quantities must be whole numbers (round up when needed)
- Include proper units (m, Nos, Bags, Lot)

---

## VALIDATION CHECKS

Before finalizing quantities, verify using input parameters:

1. **PE cable cross-section** = Phase cable/2 rounded up to next higher standard size from Cable Cross-Sections list (extracted from acCableCrossSection parameters)
2. **CT primary rating** = 1.25 × Nominal current rounded up to next higher standard rating from CT Ratios list
3. **Earth resistance targets**: Use targetEarthingResistanceOhm parameter
4. **Cable lengths** use completeCableLength parameters directly
5. **Busbar rating** based on actual current parameters (lvCombinerPanelOutputCurrentA, idtInputCurrentA, etc.)
6. **Total earthing compound** accounts for all pits using quantityOfIDTs and quantityOfPTs
7. **Protection relay quantities** match transformer quantities
8. **PT existence** checked: only calculate PT items if quantityOfPTs > 0
9. **Feeder panel quantities** = quantityOfIDTs + quantityOfPTs (if > 0)

---

## CRITICAL PARAMETER USAGE NOTES

**ALWAYS use these exact input parameter names:**
- \`totalPlantAreaM2\` - for area calculations
- \`stringShortCircuitCurrentA\` - for DC PE sizing
- \`quantityOfIDTs\`, \`quantityOfPTs\` - for transformer-related items
- \`completeCableLengthXXXM\` - for all cable length calculations
- \`acCableCrossSectionXXXMm2\` - for extracting cross-sections and runs
- \`idtInputCurrentA\`, \`idtOutputCurrentA\` - for IDT CT calculations
- \`ptInputCurrentA\`, \`ptOutputCurrentA\` - for PT CT calculations (if PTs exist)
- \`lvCombinerPanelOutputCurrentA\` - for LV system calculations
- \`substationElectricalRoomGridSizeM2\` - for earth grid calculations
- \`targetEarthingResistanceOhm\` - for earthing system design
- \`soilType\` - for soil resistivity values

**CONDITIONAL LOGIC:**
- PT-related items: Only calculate if \`quantityOfPTs > 0\`
- System type determines calculation method (LV vs HV String vs HV Central)
- Cable routes vary by system type (check which completeCableLength parameters exist)

---

## ERROR HANDLING

If any parameter is missing or unclear:
1. Check if parameter exists in input (e.g., PT parameters only if quantityOfPTs > 0)
2. Use conservative (higher) values for safety
3. Reference the relevant IEC standard
4. Skip items marked "optional" if dependent parameters are zero/missing

---

Remember: This BOQ must be accurate and complete based ONLY on the provided input parameters. Do not assume or add components not indicated by the inputs. When quantityOfPTs = 0, skip all PT-related calculations and items.`;

/**
 * Build the final BOQ prompt by inserting the formatted inputs block.
 * @param calculationType 'LV' | 'HV_String' | 'HV_Central'
 * @returns final prompt string ready to send to LLM
 */
export async function buildBoqPromptForLLM(calculationType: 'LV' | 'HV_String' | 'HV_Central'): Promise<string> {
  console.log('🔨 Building BOQ prompt for LLM - calculationType:', calculationType);
  
  // Get formatted inputs block from BOQParameterManager
  const inputsBlock = boqParameterManager.formatForAIPrompt(calculationType);
  
  console.log('📝 Inputs block length:', inputsBlock.length, 'characters');
  
  // Sanitize newline sequences
  const sanitizedInputs = inputsBlock.replace(/\r\n/g, '\n');
  
  // Replace the placeholder with actual inputs
  const finalPrompt = MASTER_PROMPT_TEMPLATE.replace('{{INPUTS_BLOCK}}', sanitizedInputs);
  
  console.log('🎯 Final prompt built - total length:', finalPrompt.length, 'characters');
  
  return finalPrompt;
}

/**
 * Send prompt to LLM for BOQ generation with deterministic settings
 * Returns plain text response (not JSON) for table parsing
 */
export async function sendPromptToLLM(finalPrompt: string, aiModel: 'openai' | 'gemini' = 'openai'): Promise<any> {
  console.log('🤖 Sending prompt to LLM:', aiModel);
  console.log('📊 Prompt length:', finalPrompt.length, 'characters');
  
  try {
    if (aiModel === 'openai') {
      return await callOpenAIForBOQ(finalPrompt);
    } else {
      return await callGeminiForBOQ(finalPrompt);
    }
  } catch (error) {
    console.error('❌ LLM request failed:', error);
    throw new Error(`LLM request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Call OpenAI specifically for BOQ generation (returns plain text)
 */
async function callOpenAIForBOQ(prompt: string): Promise<{ content: string; model: string }> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ OpenAI API key not found, using mock response for BOQ');
    return getMockBOQResponse('OpenAI GPT-4');
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert PV electrical designer. CRITICAL: Use ONLY the exact values from the input parameters provided. Do NOT use generic or example values. Calculate all quantities based on the specific system configuration. Return ONLY a 3-column table with header "Description | Specifications | Qty". No additional text, code blocks, or formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.0, // Deterministic
        max_tokens: 4000
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('✅ OpenAI response received');
    return {
      content: content,
      model: 'OpenAI GPT-4'
    };
    
  } catch (error) {
    console.error('❌ OpenAI API error:', error);
    console.log('🔄 Using mock response for OpenAI');
    return getMockBOQResponse('OpenAI GPT-4');
  }
}

/**
 * Call Gemini specifically for BOQ generation (returns plain text)
 */
async function callGeminiForBOQ(prompt: string): Promise<{ content: string; model: string }> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ Gemini API key not found, using mock response for BOQ');
    return getMockBOQResponse('Gemini 2.0 Flash');
  }
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${prompt}\n\nCRITICAL INSTRUCTIONS:\n1. Use ONLY the exact values from the input parameters provided in the prompt above\n2. Do NOT use generic or example values\n3. Calculate all quantities based on the specific system configuration provided\n4. Return ONLY the table with exact format "Description | Specifications | Qty"\n5. No code blocks, no additional text`
          }]
        }],
        generationConfig: {
          temperature: 0.0, // Deterministic
          maxOutputTokens: 4000
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log('✅ Gemini response received');
    return {
      content: content,
      model: 'Gemini 2.0 Flash'
    };
    
  } catch (error) {
    console.error('❌ Gemini API error:', error);
    console.log('🔄 Using mock response for Gemini');
    return getMockBOQResponse('Gemini 2.0 Flash');
  }
}

/**
 * Mock BOQ response for development and fallback
 */
function getMockBOQResponse(model: string): { content: string; model: string } {
  console.log(`🔄 Using mock BOQ response for ${model} - API key not available or API failed`);
  
  const mockBOQTable = `Description | Specifications | Qty
DC Structure Bonding Jumper | 6 mm² tinned Cu, PVC, 2 m, IEC 60364-5-54 / IEC 60228 | 21 Nos
DC PE Conductor | 6 mm² tinned Cu, PVC, IEC 60364-5-54 / IEC 60228 | 105 m
DC Earth Pits | Copper-bonded rod 3 m × Ø16 mm, IEC 62561-2 | 2 Nos
ESE Lightning Arrestor | ESE LA, coverage radius 79 m, mast SS 6 m, IEC 62305 / IEC 62561 | 1 Nos
LA Earth Pits | Copper-bonded rod 3 m × Ø16 mm, IEC 62561-2 | 3 Nos
Earthing Compound | Bentonite + Graphite, 25 kg, IS 3043 | 7 Bags
AC PE Conductor (Inverter→Combiner) | 16 mm² tinned Cu, PVC, IEC 60364-5-54 / IEC 60228 | 50 m
AC PE Conductor (Combiner→PoC) | 16 mm² tinned Cu, PVC, IEC 60364-5-54 / IEC 60228 | 100 m
Equipment Bonding (LV) | 6 mm² tinned Cu, 2 m, IEC 60364-5-54 / IEC 60228 | 3 Nos
Earth Grid Strip | Cu strip 50×6 mm, IEC 62561 | 120 m
Earth Grid Rods | Copper-bonded rod 3 m × Ø16 mm, IEC 62561-2 | 16 Nos
Current Transformer (Protection) | 5P10, 10 VA, 5 A secondary, 125 A primary, IEC 61869 | 3 Nos
Current Transformer (Metering) | Class 0.5, 10 VA, 5 A secondary, 125 A primary, IEC 61869 | 3 Nos
AC Surge Protective Device | Type 2, 3-phase, Uc = 320 V AC, Imax = 40 kA, Up ≤ 1.5 kV, IEC 61643-11 | 1 Nos
Protection Relay | Numeric relay, 50/51, 50N/51N, 27/59, 81O/81U, IEC 60255 | 1 Nos
Communication Cable (Inverter→SCADA) | RS-485 shielded, 2-pair, 24 AWG, LSZH, 120 Ω | 110 m
Communication Cable (LAN) | Cat-6 LSZH | 110 m
Net Meter | 3-phase 4-wire, bidirectional, DLMS/IEC 62056, Class 0.2S, 5 A secondary | 1 Nos
LV Busbar | Copper, sized for 649 A, IEC 61439-2 | 1 Lot`;
  
  return {
    content: mockBOQTable,
    model: `${model} (Mock Data)`
  };
}
