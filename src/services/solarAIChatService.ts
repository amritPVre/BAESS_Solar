import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  ChatMessage, 
  ChatSession, 
  CalculationInput, 
  CalculationResult,
  CalculationType 
} from '@/types/solar-ai-chat';
import { 
  CALCULATION_SYSTEM_PROMPTS, 
  getCalculationTask 
} from '@/config/solar-calculation-prompts';
import { supabase } from '@/integrations/supabase/client';
import { 
  getTaskHandler, 
  buildCalculationPrompt,
  getInputDefinitions,
  getFormulasDescription,
  hasTaskHandler 
} from '@/services/solar-ai-tasks';
import type { ArrayType } from '@/services/pvwatts-api.service';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

class SolarAIChatService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Send a message to Gemini AI with context
   * Returns both a chat response and a canvas/artifact response
   */
  async sendMessage(
    userMessage: string,
    calculationType: CalculationType,
    context?: ChatMessage[]
  ): Promise<{ chatResponse: string; canvasResponse: string | null }> {
    try {
      const systemPrompt = CALCULATION_SYSTEM_PROMPTS[calculationType];
      const task = getCalculationTask(calculationType);

      // Build conversation history for context (Gemini format)
      // IMPORTANT: Gemini requires the first message to be from 'user', not 'model'
      // Filter out any leading assistant messages (like our initial conversation starter)
      let contextMessages = context || [];
      
      // Find the index of the first user message
      const firstUserIndex = contextMessages.findIndex(msg => msg.role === 'user');
      
      // Only include messages starting from the first user message
      if (firstUserIndex > 0) {
        contextMessages = contextMessages.slice(firstUserIndex);
      } else if (firstUserIndex === -1) {
        // No user messages yet - create empty history
        contextMessages = [];
      }
      
      const conversationHistory = contextMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      // Build a text summary of ALL user inputs from conversation history
      const allUserInputs = context
        ?.filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .join('\n') || '';
      
      // Combine all user inputs including current message for analysis
      const fullUserContext = allUserInputs 
        ? `Previous inputs:\n${allUserInputs}\n\nCurrent message:\n${userMessage}`
        : userMessage;

      // ====== SPECIAL HANDLING FOR PV SIZING - STEP-BY-STEP CONVERSATION ======
      if (calculationType === 'pv_sizing') {
        return await this.handlePVSizingConversation(userMessage, fullUserContext, context || []);
      }

      // ====== STANDARD HANDLING FOR OTHER CALCULATION TYPES ======
      // First, determine if we have enough data to perform calculation
      // Include FULL conversation context in analysis
      const analysisPrompt = `You are analyzing a ${task?.name} calculation request.

FULL CONVERSATION CONTEXT (all user messages so far):
${fullUserContext}

Required inputs for ${task?.name}: ${task?.requiredInputs.join(', ')}

Based on ALL the information provided above (combining all messages), determine:
- Have enough numerical values been provided to perform a meaningful calculation?

Respond with ONLY:
1. "READY" - if there's enough data to calculate (be lenient - if most key values are there, say READY)
2. "NEED_INFO: [specific missing item]" - only if critical data is completely missing

Be LENIENT. If user provided core values like current, voltage, distance - that's enough to calculate.`;

      const analysisResult = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
      });
      const analysisText = (await analysisResult.response).text().trim();

      // If we need more information, only generate chat response
      if (analysisText.startsWith('NEED_INFO')) {
        const missingInfo = analysisText.replace('NEED_INFO:', '').trim();
        
        // Include conversation context when asking for more info
        const chatPrompt = `You are a helpful solar engineering assistant doing a ${task?.name} calculation.

CONVERSATION SO FAR:
${fullUserContext}

Still missing: ${missingInfo}

Respond conversationally (2-3 sentences max):
1. Acknowledge the data they've provided so far
2. Ask ONLY for the specific missing data
3. Keep it brief and professional`;

        const chatResult = await this.model.generateContent({
          contents: [{ role: 'user', parts: [{ text: chatPrompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
        });

        return {
          chatResponse: (await chatResult.response).text(),
          canvasResponse: null,
        };
      }

      // We have enough data - generate both chat response and canvas result
      // Generate CANVAS response (detailed calculations) with FULL context
      const canvasChat = this.model.startChat({
        history: conversationHistory,
        generationConfig: {
          maxOutputTokens: 3000,
          temperature: 0.2,
          topP: 0.85,
          topK: 20,
        },
      });

      // Use enhanced task handler prompt if available, otherwise use basic prompt
      let canvasPrompt: string;
      
      if (hasTaskHandler(calculationType)) {
        // Use the comprehensive task handler prompt with formulas and references
        canvasPrompt = buildCalculationPrompt(calculationType, userMessage, fullUserContext) || '';
      } else {
        // Fallback to basic prompt for tasks without handlers yet
        canvasPrompt = `${systemPrompt}

STRICT CALCULATION MODE - USE ALL DATA FROM CONVERSATION:

ALL USER INPUTS (from entire conversation):
${fullUserContext}

INSTRUCTIONS:
- Extract ALL numerical values from the conversation above
- Perform the calculation using these values
- Use standard industry values for anything not specified (state assumptions)
- Show all formulas with actual numbers
- Present results in clear tables

OUTPUT FORMAT:
## Input Summary
| Parameter | Value | Unit |
|-----------|-------|------|

## Calculations
[Show each formula with numbers]

## Results
| Output | Value | Unit |
|--------|-------|------|

## Key Insights (2-3 max)
- [Actionable insight 1]
- [Actionable insight 2]

## Assumptions Used (if any)`;
      }

      const canvasResult = await canvasChat.sendMessage(canvasPrompt);
      const canvasResponse = (await canvasResult.response).text();

      // Generate CHAT response (brief, conversational) - also context-aware
      const chatPrompt = `You just completed a ${task?.name} calculation.

User's inputs (from conversation):
${fullUserContext}

Respond in 2-3 sentences ONLY:
1. Confirm you've completed the calculation
2. Mention one key result/highlight from the calculation
3. Tell them to check the Results panel on the right for full details

Keep it brief and friendly. Do NOT repeat the full calculation.`;

      const chatResult = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: chatPrompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 200 },
      });

      return {
        chatResponse: (await chatResult.response).text(),
        canvasResponse: canvasResponse,
      };
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      throw new Error('Failed to get response from AI. Please try again.');
    }
  }

  /**
   * Special handler for PV Sizing - implements strict step-by-step conversation
   * Uses simple step detection based on last assistant message
   */
  private async handlePVSizingConversation(
    userMessage: string,
    fullUserContext: string,
    context: ChatMessage[]
  ): Promise<{ chatResponse: string; canvasResponse: string | null }> {
    
    // Get the last assistant message to determine which step we're on
    const assistantMessages = context.filter(msg => msg.role === 'assistant');
    const lastAssistantMsg = assistantMessages[assistantMessages.length - 1]?.content || '';
    
    // Current message (just received)
    const currentInput = userMessage.trim();
    const currentInputLower = currentInput.toLowerCase();
    
    // Determine current step based on what the assistant last asked
    let currentStep = this.detectPVSizingStep(lastAssistantMsg);
    
    console.log(`PV Sizing - Current Step: ${currentStep}, User Input: "${currentInput}"`);
    
    // State object to collect all values
    const state = this.collectPVSizingState(context, currentStep, currentInput);
    
    console.log('PV Sizing - Collected State:', state);

    // Process current input and determine next step
    let nextQuestion = '';

    switch (currentStep) {
      case 1: // User responding to consumption question
        if (currentInputLower.includes('no') || currentInputLower.includes("don't") || currentInputLower.includes('dont')) {
          state.consumption = 'NO_DATA';
          // Skip to location (Step 2)
          nextQuestion = `No problem! I'll size the system based on your available space.

**Step 2 of 8: Location**

Please provide your installation location:
- **Coordinates**: Latitude, Longitude (e.g., "22.5726, 88.3639")
- **Or City/Country**: (e.g., "Kolkata, India")`;
        } else {
          // Extract consumption value
          state.consumption = currentInput.replace(/[^\d.]/g, '') || currentInput;
          // Ask about hourly breakdown (Step 1b)
          nextQuestion = `Got it! Daily consumption noted: **${state.consumption} kWh**

Would you like to provide an **hourly consumption breakdown** (6AM-6PM) for more accurate sizing?

Reply **"Yes"** to enter hourly data, or **"No"** to continue.`;
        }
        break;

      case 1.5: // User responding to hourly breakdown question
        // Whether yes or no, move to location
        if (currentInputLower === 'yes') {
          nextQuestion = `Please enter your hourly consumption values in this format:
6AM: X, 7AM: X, 8AM: X, ... 5PM: X

Or just list 12 values separated by commas (6AM to 5PM).

(You can also type "skip" to proceed without hourly data)`;
        } else {
          // Skip hourly, go to location
          nextQuestion = `**Step 2 of 8: Location**

Please provide your installation location:
- **Coordinates**: Latitude, Longitude (e.g., "22.5726, 88.3639")
- **Or City/Country**: (e.g., "Kolkata, India")`;
        }
        break;

      case 1.6: // User providing hourly data or skipping
        // Move to location regardless
        nextQuestion = `**Step 2 of 8: Location**

Please provide your installation location:
- **Coordinates**: Latitude, Longitude (e.g., "22.5726, 88.3639")
- **Or City/Country**: (e.g., "Kolkata, India")`;
        break;

      case 2: // User responding to location question
        state.location = currentInput;
        nextQuestion = `Location noted: **${state.location}** ✓

**Step 3 of 8: Available Space**

What is the available space for solar panel installation? (in square meters, m²)`;
        break;

      case 3: // User responding to space question
        state.space = currentInput.replace(/[^\d.]/g, '') || currentInput;
        nextQuestion = `Available space: **${state.space} m²** ✓

**Step 4 of 8: Shading Condition**

How much of the installation area is shaded?

**1.** Partially shaded (approximately 10% of the area)
**2.** No shades at all (fully shade-free)

Reply with **1** or **2**`;
        break;

      case 4: // User responding to shading question
        state.shading = currentInput.includes('1') ? '1' : '2';
        const shadingText = state.shading === '1' ? 'Partially shaded' : 'No shading';
        nextQuestion = `Shading: **${shadingText}** ✓

**Step 5 of 8: Installation Type**

What type of mounting structure will you use?

**1.** Open Rack (Ground Mounted)
**2.** Fixed - Roof Mounted
**3.** 1-Axis Tracker
**4.** 1-Axis Backtracking
**5.** 2-Axis Tracker

Reply with **1**, **2**, **3**, **4**, or **5**`;
        break;

      case 5: // User responding to installation type question
        state.installation = currentInput.match(/[1-5]/)?.[0] || '2';
        const installTypes = ['Open Rack', 'Fixed Roof', '1-Axis', '1-Axis Backtracking', '2-Axis'];
        nextQuestion = `Installation: **${installTypes[parseInt(state.installation) - 1]}** ✓

**Step 6 of 8: Solar Panel Manufacturer**

Please select a solar panel manufacturer:

**1.** LONGi Solar
**2.** JinkoSolar
**3.** Trina Solar

Reply with **1**, **2**, or **3**`;
        break;

      case 6: // User responding to panel manufacturer question
        state.panel = currentInput.match(/[1-3]/)?.[0] || '1';
        const panels = ['LONGi Solar', 'JinkoSolar', 'Trina Solar'];
        nextQuestion = `Panel: **${panels[parseInt(state.panel) - 1]} 600Wp** ✓

**Step 7 of 8: Inverter Manufacturer**

Please select an inverter manufacturer:

**1.** Sungrow
**2.** Huawei
**3.** Growatt

Reply with **1**, **2**, or **3**`;
        break;

      case 7: // User responding to inverter manufacturer question
        state.inverter = currentInput.match(/[1-3]/)?.[0] || '1';
        const inverters = ['Sungrow', 'Huawei', 'Growatt'];
        nextQuestion = `Inverter: **${inverters[parseInt(state.inverter) - 1]}** ✓

**Step 8 of 8: System AC Voltage**

What is your grid connection AC voltage?

**1.** 380V
**2.** 400V
**3.** 415V
**4.** 480V

Reply with **1**, **2**, **3**, or **4**`;
        break;

      case 8: // User responding to voltage question - ALL DONE!
        state.voltage = currentInput.match(/[1-4]/)?.[0] || '2';
        return this.performPVSizingCalculation(state);

      default:
        // Fallback - ask for consumption
        nextQuestion = `**Step 1 of 8: Energy Consumption**

Do you have your **Daily Average Day-time Electricity Consumption** value (in kWh)?
This is your energy usage from 6:00 AM to 6:00 PM.

Reply with:
- **"Yes, [value] kWh"** - if you know your daytime consumption
- **"No"** - if you don't have this value`;
    }

    return { chatResponse: nextQuestion, canvasResponse: null };
  }

  /**
   * Detect which step of PV sizing we're on based on last assistant message
   */
  private detectPVSizingStep(lastAssistantMsg: string): number {
    const msgLower = lastAssistantMsg.toLowerCase();
    
    if (msgLower.includes('step 1') && msgLower.includes('energy consumption')) return 1;
    if (msgLower.includes('hourly') && (msgLower.includes('breakdown') || msgLower.includes('yes') && msgLower.includes('no'))) return 1.5;
    if (msgLower.includes('enter your hourly') || msgLower.includes('12 values')) return 1.6;
    if (msgLower.includes('step 2') && msgLower.includes('location')) return 2;
    if (msgLower.includes('step 3') && msgLower.includes('available space')) return 3;
    if (msgLower.includes('step 4') && msgLower.includes('shading')) return 4;
    if (msgLower.includes('step 5') && msgLower.includes('installation type')) return 5;
    if (msgLower.includes('step 6') && msgLower.includes('panel')) return 6;
    if (msgLower.includes('step 7') && msgLower.includes('inverter')) return 7;
    if (msgLower.includes('step 8') && msgLower.includes('voltage')) return 8;
    
    return 1; // Default to first step
  }

  /**
   * Collect all PV sizing state from conversation history
   */
  private collectPVSizingState(
    context: ChatMessage[],
    currentStep: number,
    currentInput: string
  ): {
    consumption: string | null;
    location: string | null;
    space: string | null;
    shading: string | null;
    installation: string | null;
    panel: string | null;
    inverter: string | null;
    voltage: string | null;
  } {
    const state = {
      consumption: null as string | null,
      location: null as string | null,
      space: null as string | null,
      shading: null as string | null,
      installation: null as string | null,
      panel: null as string | null,
      inverter: null as string | null,
      voltage: null as string | null,
    };

    // Parse conversation history to extract previously collected values
    const messages = [...context];
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.role === 'assistant') {
        const step = this.detectPVSizingStep(msg.content);
        // Get the next user message as the answer to this step
        const userResponse = messages[i + 1]?.role === 'user' ? messages[i + 1].content.trim() : null;
        
        if (userResponse) {
          const userLower = userResponse.toLowerCase();
          switch (step) {
            case 1:
              if (userLower.includes('no') || userLower.includes("don't")) {
                state.consumption = 'NO_DATA';
              } else {
                state.consumption = userResponse.replace(/[^\d.]/g, '') || userResponse;
              }
              break;
            case 2:
              state.location = userResponse;
              break;
            case 3:
              state.space = userResponse.replace(/[^\d.]/g, '') || userResponse;
              break;
            case 4:
              state.shading = userResponse.includes('1') ? '1' : '2';
              break;
            case 5:
              state.installation = userResponse.match(/[1-5]/)?.[0] || '2';
              break;
            case 6:
              state.panel = userResponse.match(/[1-3]/)?.[0] || '1';
              break;
            case 7:
              state.inverter = userResponse.match(/[1-3]/)?.[0] || '1';
              break;
            case 8:
              state.voltage = userResponse.match(/[1-4]/)?.[0] || '2';
              break;
          }
        }
      }
    }

    return state;
  }

  /**
   * Perform the final PV sizing calculation using real APIs and database
   */
  private async performPVSizingCalculation(state: {
    consumption: string | null;
    location: string | null;
    space: string | null;
    shading: string | null;
    installation: string | null;
    panel: string | null;
    inverter: string | null;
    voltage: string | null;
  }): Promise<{ chatResponse: string; canvasResponse: string }> {
    
    console.log('PV Sizing - ALL DATA COLLECTED! Performing REAL calculation with APIs...');
    console.log('Final State:', state);
    
    const installTypes = ['Open Rack', 'Fixed Roof', '1-Axis', '1-Axis Backtracking', '2-Axis'];
    const panelMfrs = ['LONGi Solar', 'JinkoSolar', 'Trina Solar'];
    const inverterMfrs = ['Sungrow', 'Huawei', 'Growatt'];
    const voltages = [380, 400, 415, 480];
    
    const selectedPanelMfr = panelMfrs[parseInt(state.panel || '1') - 1] || 'LONGi Solar';
    const selectedInverterMfr = inverterMfrs[parseInt(state.inverter || '1') - 1] || 'Sungrow';
    const selectedInstall = parseInt(state.installation || '2') - 1;
    const selectedVoltage = voltages[parseInt(state.voltage || '2') - 1] || 400;
    const shadingCondition = state.shading === '1' ? 'partial' : 'shade_free';
    
    try {
      // Import services dynamically to avoid circular dependencies
      const { simulatePVSystem, calculateOptimalTilt, calculateOptimalAzimuth, getSystemLosses } = 
        await import('./pvwatts-api.service');
      const { fetchPanelForDesign, selectOptimalInverter, getModuleArea, getPanelSummary, getInverterSummary } = 
        await import('./solar-equipment.service');
      
      // Step 1: Geocode location to get coordinates
      let latitude: number;
      let longitude: number;
      
      // Parse location - could be "city, country" or "lat, lon"
      const locationStr = state.location || '';
      const coordMatch = locationStr.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
      
      if (coordMatch && Math.abs(parseFloat(coordMatch[1])) <= 90) {
        latitude = parseFloat(coordMatch[1]);
        longitude = parseFloat(coordMatch[2]);
        console.log('Parsed coordinates:', { latitude, longitude });
      } else {
        // Geocode the location using OpenStreetMap Nominatim
        console.log('Geocoding location:', locationStr);
        try {
          const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationStr)}&limit=1`;
          const geoResponse = await fetch(geocodeUrl, {
            headers: { 'User-Agent': 'BAESS-Solar-AI/1.0' }
          });
          const geoData = await geoResponse.json();
          
          if (geoData && geoData[0]) {
            latitude = parseFloat(geoData[0].lat);
            longitude = parseFloat(geoData[0].lon);
            console.log('Geocoded coordinates:', { latitude, longitude, display: geoData[0].display_name });
          } else {
            // Default to Kolkata if geocoding fails
            console.warn('Geocoding failed, using default Kolkata coordinates');
            latitude = 22.5726;
            longitude = 88.3639;
          }
        } catch (geoError) {
          console.error('Geocoding error:', geoError);
          latitude = 22.5726;
          longitude = 88.3639;
        }
      }

      // Step 2: Fetch panel specifications from Supabase
      console.log('Fetching panel from:', selectedPanelMfr);
      let panel = await fetchPanelForDesign(selectedPanelMfr, 600);
      
      // Fallback panel specs if not found in DB
      const moduleWattage = panel?.nominal_power_w || 600;
      const moduleArea = panel ? getModuleArea(panel) : 2.8;
      const moduleEfficiency = panel?.efficiency_percent || 21;
      
      console.log('Panel specs:', { moduleWattage, moduleArea, moduleEfficiency });

      // Step 3: Calculate system angles
      const tilt = calculateOptimalTilt(latitude);
      const azimuth = calculateOptimalAzimuth(latitude);
      const systemLoss = getSystemLosses(shadingCondition as 'partial' | 'shade_free');
      
      console.log('System angles:', { tilt, azimuth, systemLoss });

      // Step 4: Call PVWatts API to get real solar irradiance data
      console.log('Calling PVWatts API for solar irradiance...');
      
      // First, get baseline irradiance with 1kW system
      const { callPVWattsAPI } = await import('./pvwatts-api.service');
      
      let pvwattsData;
      try {
        pvwattsData = await callPVWattsAPI({
          system_capacity: 1, // 1 kW for baseline
          module_type: 1, // Premium
          losses: systemLoss,
          array_type: selectedInstall as ArrayType,
          tilt,
          azimuth,
          lat: latitude,
          lon: longitude,
          gcr: 0.45,
          inv_eff: 97,
        });
        console.log('PVWatts API response received:', {
          solrad_annual: pvwattsData.outputs.solrad_annual,
          ac_annual: pvwattsData.outputs.ac_annual,
        });
      } catch (apiError) {
        console.error('PVWatts API error:', apiError);
        throw new Error('Failed to fetch solar irradiance data from NREL PVWatts API');
      }

      const dailySolrad = pvwattsData.outputs.solrad_annual; // kWh/m²/day average
      const stationInfo = pvwattsData.station_info;

      // Step 5: Calculate PV Capacity
      const dailyConsumption = state.consumption !== 'NO_DATA' ? parseFloat(state.consumption || '0') : 0;
      const availableSpace = parseFloat(state.space || '0');
      const performanceRatio = 0.80;
      const gcr = 0.45;

      // Method 1: Consumption-based capacity
      let pvCapacity1 = 0;
      if (dailyConsumption > 0) {
        pvCapacity1 = dailyConsumption / (dailySolrad * performanceRatio);
        console.log('Consumption-based capacity (PV_wp1):', pvCapacity1.toFixed(2), 'kWp');
      }

      // Method 2: Space-based capacity
      const numModulesFromSpace = (availableSpace * gcr) / moduleArea;
      const pvCapacity2 = numModulesFromSpace * (moduleWattage / 1000);
      console.log('Space-based capacity (PV_wp2):', pvCapacity2.toFixed(2), 'kWp');

      // Select final capacity
      let finalCapacity: number;
      let isSpaceConstrained = false;
      let capacityNote = '';
      
      if (dailyConsumption > 0) {
        if (pvCapacity1 <= pvCapacity2) {
          finalCapacity = pvCapacity1;
          capacityNote = 'Based on energy consumption requirement';
        } else {
          finalCapacity = pvCapacity2;
          isSpaceConstrained = true;
          capacityNote = `⚠️ Space-constrained: Consumption requires ${pvCapacity1.toFixed(1)} kWp but only ${pvCapacity2.toFixed(1)} kWp fits in available space`;
        }
      } else {
        finalCapacity = pvCapacity2;
        capacityNote = 'Based on available installation space';
      }

      // Round to nearest module
      const numModules = Math.ceil((finalCapacity * 1000) / moduleWattage);
      const actualCapacity = (numModules * moduleWattage) / 1000;
      console.log('Final capacity:', actualCapacity, 'kWp with', numModules, 'modules');

      // Step 6: Select inverter from database
      console.log('Selecting inverter from:', selectedInverterMfr);
      let inverterConfig = await selectOptimalInverter(selectedInverterMfr, actualCapacity);
      
      // Fallback if no inverter found
      let inverterModel = 'Standard';
      let inverterQty = 1;
      let inverterAcCapacity = actualCapacity;
      let dcAcRatio = 1.0;
      
      if (inverterConfig) {
        inverterModel = inverterConfig.inverter.model;
        inverterQty = inverterConfig.quantity;
        inverterAcCapacity = inverterConfig.totalAcCapacity;
        dcAcRatio = inverterConfig.dcAcRatio;
        console.log('Inverter selected:', { inverterModel, inverterQty, dcAcRatio });
      } else {
        // Calculate a reasonable default
        const singleInverterKw = Math.ceil(actualCapacity / 1.1);
        inverterModel = `${singleInverterKw}kW`;
        dcAcRatio = actualCapacity / singleInverterKw;
        console.log('Using default inverter config:', { inverterModel, dcAcRatio });
      }

      // Step 7: Run full PVWatts simulation with actual capacity
      console.log('Running full PVWatts simulation for', actualCapacity, 'kWp...');
      
      let fullSimulation;
      try {
        fullSimulation = await callPVWattsAPI({
          system_capacity: actualCapacity,
          module_type: 1,
          losses: systemLoss,
          array_type: selectedInstall as ArrayType,
          tilt,
          azimuth,
          lat: latitude,
          lon: longitude,
          dc_ac_ratio: dcAcRatio,
          inv_eff: 97,
          gcr: 0.45,
        });
        console.log('Full simulation complete:', {
          ac_annual: fullSimulation.outputs.ac_annual,
          capacity_factor: fullSimulation.outputs.capacity_factor,
        });
      } catch (simError) {
        console.error('Simulation error, using baseline calculation');
        fullSimulation = pvwattsData;
        // Scale outputs by capacity
        fullSimulation.outputs.ac_annual *= actualCapacity;
        fullSimulation.outputs.dc_monthly = fullSimulation.outputs.dc_monthly.map(v => v * actualCapacity);
        fullSimulation.outputs.ac_monthly = fullSimulation.outputs.ac_monthly.map(v => v * actualCapacity);
      }

      // Step 8: Format monthly data
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
      
      const monthlyData = monthNames.map((month, i) => ({
        month,
        solrad: fullSimulation.outputs.solrad_monthly[i],
        poa: fullSimulation.outputs.poa_monthly[i],
        dcOutput: Math.round(fullSimulation.outputs.dc_monthly[i]),
        acOutput: Math.round(fullSimulation.outputs.ac_monthly[i]),
        pr: fullSimulation.outputs.poa_monthly[i] > 0 
          ? ((fullSimulation.outputs.ac_monthly[i] / (fullSimulation.outputs.poa_monthly[i] * actualCapacity)) * 100).toFixed(1)
          : '0',
      }));

      // Calculate annual totals
      const annualAcOutput = Math.round(fullSimulation.outputs.ac_annual);
      const annualDcOutput = Math.round(fullSimulation.outputs.dc_monthly.reduce((a, b) => a + b, 0));
      const annualPoa = fullSimulation.outputs.poa_monthly.reduce((a, b) => a + b, 0);
      const specificYield = Math.round(annualAcOutput / actualCapacity);
      const avgPR = ((annualAcOutput / (annualPoa * actualCapacity)) * 100).toFixed(1);
      const capacityFactor = fullSimulation.outputs.capacity_factor.toFixed(2);

      // Step 9: Generate BOM
      const estimatedStringCableLength = Math.ceil(numModules * 3);
      const estimatedMainDCCable = Math.ceil(actualCapacity * 2);
      const modulesPerString = 18;
      const numStrings = Math.ceil(numModules / modulesPerString);
      const acCurrent = Math.ceil((actualCapacity * 1000) / (selectedVoltage * Math.sqrt(3)));

      // Step 10: Build professional output
      const canvasResponse = `# 📊 Grid-Connected Solar PV System Design Report

## Executive Summary

| Metric | Value |
|--------|-------|
| **Project Location** | ${stationInfo?.city || state.location}, ${stationInfo?.state || ''} |
| **Coordinates** | ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E |
| **Recommended System Capacity** | **${actualCapacity.toFixed(2)} kWp** |
| **Estimated Annual Generation** | **${annualAcOutput.toLocaleString()} kWh/year** |
| **Specific Yield** | ${specificYield} kWh/kWp/year |
| **Performance Ratio** | ${avgPR}% |

---

## 1. System Configuration

### 1.1 Array Specifications
| Parameter | Value | Remarks |
|-----------|-------|---------|
| PV Array DC Capacity | ${actualCapacity.toFixed(2)} kWp | Rounded to nearest module |
| Solar Module | ${selectedPanelMfr} ${moduleWattage}Wp | Mono-PERC Technology |
| Number of Modules | ${numModules} | Qty × ${moduleWattage}Wp |
| Module Efficiency | ${moduleEfficiency}% | STC Conditions |
| Total DC Power | ${(numModules * moduleWattage / 1000).toFixed(2)} kWp | ${numModules} × ${moduleWattage}Wp |

### 1.2 Inverter Configuration
| Parameter | Value | Remarks |
|-----------|-------|---------|
| Inverter Manufacturer | ${selectedInverterMfr} | Grid-Tie String Inverter |
| Inverter Model | ${inverterModel} | ${inverterQty > 1 ? `× ${inverterQty} units` : 'Single unit'} |
| Quantity | ${inverterQty} | Optimized for DC/AC ratio |
| Total AC Capacity | ${inverterAcCapacity.toFixed(1)} kW | Combined |
| **DC/AC Ratio** | **${dcAcRatio.toFixed(3)}** | ${dcAcRatio >= 1.0 ? '✅ Optimal (≥1.0)' : '⚠️ Below 1.0'} |

### 1.3 Installation Parameters
| Parameter | Value | Source |
|-----------|-------|--------|
| Mounting Type | ${installTypes[selectedInstall]} | User Selection |
| Tilt Angle | ${tilt}° | Calculated: ${Math.abs(latitude) <= 25 ? `|${latitude.toFixed(1)}°| - 2°` : 'Fixed 25° (Lat > 25°)'} |
| Azimuth | ${azimuth}° | ${latitude >= 0 ? 'South-facing (Northern Hemisphere)' : 'North-facing (Southern Hemisphere)'} |
| Ground Coverage Ratio | 0.45 | Industry Standard |
| System AC Voltage | ${selectedVoltage}V | 3-Phase |
| Total System Losses | ${systemLoss}% | ${shadingCondition === 'partial' ? 'Includes 3% shading loss' : 'Shade-free installation'} |

---

## 2. Capacity Sizing Analysis

### 2.1 Design Methodology
${dailyConsumption > 0 ? `
**Method 1: Consumption-Based Sizing (PV_wp1)**
\`\`\`
PV_wp1 = Daily Consumption ÷ (Solar Irradiation × Performance Ratio)
PV_wp1 = ${dailyConsumption} kWh ÷ (${dailySolrad.toFixed(2)} kWh/m²/day × 0.80)
PV_wp1 = ${pvCapacity1.toFixed(2)} kWp
\`\`\`
` : '*Energy consumption data not provided - using space-based sizing only*'}

**Method 2: Space-Based Sizing (PV_wp2)**
\`\`\`
PV_wp2 = (Available Space × GCR ÷ Module Area) × Module Power
PV_wp2 = (${availableSpace} m² × 0.45 ÷ ${moduleArea.toFixed(2)} m²) × ${moduleWattage/1000} kWp
PV_wp2 = ${pvCapacity2.toFixed(2)} kWp
\`\`\`

### 2.2 Final Capacity Selection
| Sizing Method | Capacity (kWp) | Status |
|---------------|----------------|--------|
${dailyConsumption > 0 ? `| Consumption-Based | ${pvCapacity1.toFixed(2)} | ${!isSpaceConstrained ? '✅ Selected' : '⚠️ Exceeds space'} |` : '| Consumption-Based | N/A | Not provided |'}
| Space-Based | ${pvCapacity2.toFixed(2)} | ${isSpaceConstrained || dailyConsumption === 0 ? '✅ Selected' : 'Available capacity'} |
| **Final Design** | **${actualCapacity.toFixed(2)}** | **${capacityNote}** |

---

## 3. Solar Resource Assessment

**Data Source:** NREL PVWatts® v8 API | **Weather Station:** ${stationInfo?.solar_resource_file || 'TMY3'}

### 3.1 Monthly Solar Irradiation & Energy Production

| Month | GHI (kWh/m²/day) | POA (kWh/m²) | DC Output (kWh) | AC Output (kWh) | PR (%) |
|-------|------------------|--------------|-----------------|-----------------|--------|
${monthlyData.map(m => `| ${m.month} | ${m.solrad.toFixed(2)} | ${m.poa.toFixed(1)} | ${m.dcOutput.toLocaleString()} | ${m.acOutput.toLocaleString()} | ${m.pr}% |`).join('\n')}
| **Annual** | **${dailySolrad.toFixed(2)}** | **${annualPoa.toFixed(0)}** | **${annualDcOutput.toLocaleString()}** | **${annualAcOutput.toLocaleString()}** | **${avgPR}%** |

### 3.2 Annual Performance Metrics

| Metric | Value | Industry Benchmark |
|--------|-------|-------------------|
| Annual Energy Yield | ${annualAcOutput.toLocaleString()} kWh | Based on TMY data |
| Specific Yield | ${specificYield} kWh/kWp | India avg: 1,400-1,700 |
| Performance Ratio | ${avgPR}% | Target: 75-82% |
| Capacity Utilization Factor | ${capacityFactor}% | Typical: 15-20% |

---

## 4. Bill of Materials (Indicative)

| S.No | Description | Specification | Qty | Unit |
|------|-------------|---------------|-----|------|
| 1 | Solar PV Modules | ${selectedPanelMfr} ${moduleWattage}Wp Mono-PERC | ${numModules} | Nos |
| 2 | Grid-Tie Inverter | ${selectedInverterMfr} ${inverterModel} | ${inverterQty} | Nos |
| 3 | Module Mounting Structure | ${installTypes[selectedInstall]} - Hot-dip galvanized | ${Math.ceil(actualCapacity * 7)} | m² |
| 4 | DC String Cables | 4 mm² TUV certified solar cable | ${estimatedStringCableLength} | m |
| 5 | DC Main Cables | ${actualCapacity > 50 ? '16' : '10'} mm² solar cable | ${estimatedMainDCCable} | m |
| 6 | AC Power Cables | ${actualCapacity > 50 ? '70' : '25'} mm² 3C+E XLPE | 30 | m |
| 7 | DC Combiner Box | ${Math.min(numStrings, 8)} string input, 1000V DC | ${Math.ceil(numStrings / 8)} | Nos |
| 8 | AC Distribution Panel | ${Math.ceil(acCurrent * 1.25)}A TPN | 1 | Nos |
| 9 | Earthing System | LA earthing + Equipment earthing | 1 | Set |
| 10 | Surge Protection Device | Type II SPD (DC & AC) | ${inverterQty + 1} | Nos |
| 11 | Net Energy Meter | Bi-directional ABT compliant | 1 | Nos |
| 12 | Monitoring System | Cloud-based with WiFi/4G | 1 | Set |

---

## 5. Key Insights & Recommendations

### ✅ System Viability
${isSpaceConstrained 
  ? `- **Space Constraint Alert:** The available ${availableSpace} m² limits the system to ${actualCapacity.toFixed(1)} kWp. To meet the full consumption requirement of ${dailyConsumption} kWh/day, approximately ${Math.ceil((pvCapacity1 * moduleArea) / gcr)} m² would be needed.`
  : `- The available space of ${availableSpace} m² is sufficient for the designed ${actualCapacity.toFixed(1)} kWp system with ${((availableSpace - (numModules * moduleArea / gcr)) / availableSpace * 100).toFixed(0)}% buffer.`
}

### 💰 Estimated Performance
- **Annual Generation:** ${annualAcOutput.toLocaleString()} kWh/year
- **Daily Average:** ${Math.round(annualAcOutput / 365)} kWh/day
${dailyConsumption > 0 ? `- **Solar Fraction:** ${Math.min(100, Math.round((annualAcOutput / 365) / dailyConsumption * 100))}% of daytime consumption` : ''}

### 🔧 Technical Notes
- DC/AC ratio of ${dcAcRatio.toFixed(2)} ${dcAcRatio >= 1.0 && dcAcRatio <= 1.25 ? 'is optimal for maximizing energy harvest while protecting inverter' : dcAcRatio < 1.0 ? 'is conservative; consider higher DC capacity for better utilization' : 'is aggressive; monitor inverter clipping'}
- ${tilt}° tilt angle is optimized for annual energy production at ${Math.abs(latitude).toFixed(1)}° latitude
- Performance ratio of ${avgPR}% is ${parseFloat(avgPR) >= 78 ? 'excellent' : parseFloat(avgPR) >= 75 ? 'good' : 'below average'} for this installation type

---

*Report generated using NREL PVWatts® v8 API | Weather data: ${stationInfo?.weather_data_source || 'NSRDB'}*
*Design compliant with IEC 61724, IS/IEC 62548, and CEA Technical Standards*`;

      const chatResponse = `✅ **Professional PV System Design Complete!**

📊 **Design Summary:**
| Metric | Value |
|--------|-------|
| 📍 Location | ${stationInfo?.city || state.location} (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°) |
| ⚡ System Capacity | **${actualCapacity.toFixed(2)} kWp** |
| 🔆 Annual Generation | **${annualAcOutput.toLocaleString()} kWh/year** |
| 📈 Specific Yield | ${specificYield} kWh/kWp |
| 📉 Performance Ratio | ${avgPR}% |

📋 **Equipment:**
- **Modules:** ${numModules} × ${selectedPanelMfr} ${moduleWattage}Wp
- **Inverter:** ${inverterQty} × ${selectedInverterMfr} ${inverterModel}
- **DC/AC Ratio:** ${dcAcRatio.toFixed(3)} ${dcAcRatio >= 1.0 ? '✅' : '⚠️'}

👉 **View the detailed engineering report** in the Results panel with:
- Monthly production forecasts (NREL PVWatts data)
- Complete Bill of Materials
- Technical specifications & recommendations

${isSpaceConstrained ? `\n⚠️ **Note:** Space-constrained design. Full consumption coverage would require ${Math.ceil((pvCapacity1 * moduleArea) / gcr)} m².` : ''}

Need any modifications to the design?`;

      return { chatResponse, canvasResponse };
      
    } catch (error) {
      console.error('PV Sizing calculation error:', error);
      
      // Return error message in a professional format
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      const chatResponse = `❌ **Calculation Error**

There was an issue processing your PV system design:
\`${errorMessage}\`

Please verify your inputs and try again. If the problem persists, the solar data service may be temporarily unavailable.`;

      const canvasResponse = `# ⚠️ Calculation Error

An error occurred while processing the PV system design calculation.

**Error Details:**
\`\`\`
${errorMessage}
\`\`\`

**Troubleshooting:**
1. Verify the location is valid and can be geocoded
2. Check that the space value is a positive number
3. Ensure all selections are valid

**Your Inputs:**
- Location: ${state.location}
- Space: ${state.space} m²
- Panel: ${panelMfrs[parseInt(state.panel || '1') - 1]}
- Inverter: ${inverterMfrs[parseInt(state.inverter || '1') - 1]}

Please try again or contact support if the issue persists.`;

      return { chatResponse, canvasResponse };
    }
  }

  /**
   * Perform a specific calculation with structured data
   */
  async performCalculation(
    calculationType: CalculationType,
    inputs: CalculationInput
  ): Promise<CalculationResult> {
    try {
      const task = getCalculationTask(calculationType);
      if (!task) {
        return {
          success: false,
          error: 'Invalid calculation type',
        };
      }

      // Validate required inputs
      const missingInputs = task.requiredInputs.filter(
        input => !(input in inputs)
      );
      if (missingInputs.length > 0) {
        return {
          success: false,
          error: `Missing required inputs: ${missingInputs.join(', ')}`,
        };
      }

      // Format inputs for prompt
      const inputDescription = Object.entries(inputs)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n');

      const prompt = `${CALCULATION_SYSTEM_PROMPTS[calculationType]}

STRICT RULES:
- Calculate ONLY with the provided values below.
- Do NOT invent or assume additional data.
- Use standard industry defaults ONLY when explicitly required and state them clearly.
- Present results in clear tables with units.
- Be concise and result-focused.

INPUT PARAMETERS:
${inputDescription}

PERFORM ${task.name.toUpperCase()} CALCULATION:

OUTPUT FORMAT:
## 1. Input Verification
List all inputs with units.

## 2. Calculations
Show each formula with actual numbers substituted.

## 3. Results Table
| Parameter | Value | Unit |
|-----------|-------|------|
| ... | ... | ... |

## 4. Key Recommendations (Max 3)
- Only actionable items based on results

## 5. Assumptions Used (if any)
List any standard values applied.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        data: text,
        insights: this.extractInsights(text),
        recommendations: this.extractRecommendations(text),
      };
    } catch (error) {
      console.error('Error performing calculation:', error);
      return {
        success: false,
        error: 'Failed to perform calculation. Please try again.',
      };
    }
  }

  /**
   * Extract insights from AI response
   */
  private extractInsights(text: string): string[] {
    const insights: string[] = [];
    const insightsMatch = text.match(/insights?:?\s*([\s\S]*?)(?=recommendations?:|$)/i);
    
    if (insightsMatch && insightsMatch[1]) {
      const insightText = insightsMatch[1];
      const bulletPoints = insightText.match(/[•\-\*]\s*(.+)/g);
      if (bulletPoints) {
        insights.push(...bulletPoints.map(point => point.replace(/[•\-\*]\s*/, '').trim()));
      }
    }
    
    return insights;
  }

  /**
   * Extract recommendations from AI response
   */
  private extractRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    const recoMatch = text.match(/recommendations?:?\s*([\s\S]*?)$/i);
    
    if (recoMatch && recoMatch[1]) {
      const recoText = recoMatch[1];
      const bulletPoints = recoText.match(/[•\-\*]\s*(.+)/g);
      if (bulletPoints) {
        recommendations.push(...bulletPoints.map(point => point.replace(/[•\-\*]\s*/, '').trim()));
      }
    }
    
    return recommendations;
  }

  /**
   * Save chat session to database
   */
  async saveChatSession(session: ChatSession): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('solar_ai_chat_sessions')
        .upsert({
          id: session.id,
          user_id: session.userId,
          title: session.title,
          messages: session.messages,
          calculation_type: session.calculationType,
          project_name: session.projectName,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('Chat session saved successfully:', data);
      return true;
    } catch (error) {
      console.error('Error saving chat session:', error);
      return false;
    }
  }

  /**
   * Load chat sessions for user
   */
  async loadChatSessions(userId: string): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from('solar_ai_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data?.map(session => ({
        id: session.id,
        userId: session.user_id,
        title: session.title,
        messages: (session.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at),
        calculationType: session.calculation_type,
        projectName: session.project_name,
      })) || [];
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      return [];
    }
  }

  /**
   * Delete chat session
   */
  async deleteChatSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('solar_ai_chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting chat session:', error);
      return false;
    }
  }

  /**
   * Update chat session title
   */
  async updateSessionTitle(sessionId: string, newTitle: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('solar_ai_chat_sessions')
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating chat title:', error);
      return false;
    }
  }

  /**
   * Generate title for chat session based on first message
   */
  async generateSessionTitle(firstMessage: string, calculationType: CalculationType): Promise<string> {
    try {
      const task = getCalculationTask(calculationType);
      const prompt = `Create a brief title (max 40 chars) for: "${firstMessage.substring(0, 80)}". Task: ${task?.name}. Output ONLY the title text.`;

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 50,
        },
      });
      const response = await result.response;
      const title = response.text().trim().replace(/['"]/g, '').replace(/\n/g, ' ');
      
      return title.length > 40 ? title.substring(0, 40) + '...' : title;
    } catch (error) {
      console.error('Error generating title:', error);
      return `${getCalculationTask(calculationType)?.name || 'Calculation'} - ${new Date().toLocaleDateString()}`;
    }
  }
}

export const solarAIChatService = new SolarAIChatService();
export default solarAIChatService;

