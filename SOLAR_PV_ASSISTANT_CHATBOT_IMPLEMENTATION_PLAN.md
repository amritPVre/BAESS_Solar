# Solar PV Design Assistant Chatbot - Implementation Plan 🤖☀️

## 📋 **Project Overview**

**App Name:** Solar PV Design Assistant (AI-Powered Chatbot)

**Purpose:** Interactive AI chatbot that assists users with solar PV system design through conversational interface, performing calculations and providing design recommendations.

**AI Model:** Google Gemini 2.5 Flash Lite

---

## 🎯 **Core Features**

### **1. AC/DC Cable Sizing Module**
- Calculate optimal cable sizes based on current, voltage, distance
- Voltage drop calculations
- Cable material recommendations (Copper/Aluminum)
- Number of runs calculation
- Cable cost estimation

### **2. Solar PV String Sizing Module**
- Calculate number of modules per string
- Determine number of strings in parallel
- Inverter compatibility checks
- String voltage calculations (Voc, Vmp)
- String current calculations (Isc, Imp)

### **3. Solar Energy Production Assessment**
- Annual energy production estimation
- Monthly energy generation breakdown
- Performance ratio calculations
- Degradation factor considerations
- Weather and location-based adjustments

### **4. Project Cost Estimation**
- Equipment costs (modules, inverters, cables)
- Installation costs
- BOS (Balance of System) costs
- Total project investment calculation

### **5. Financial Analysis**
- Simple payback period calculation
- IRR (Internal Rate of Return)
- NPV (Net Present Value)
- LCOE (Levelized Cost of Energy)
- ROI analysis

### **6. Interactive Conversational Flow**
- Natural language understanding
- Context-aware responses
- Progressive information gathering
- Real-time calculations
- Result visualization

---

## 🏗️ **Architecture Design**

### **System Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Chat Interface Component                     │  │
│  │  • Message Display                                        │  │
│  │  • Input Field                                            │  │
│  │  • Quick Action Buttons                                   │  │
│  │  • Result Visualization                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          State Management (React Context/Zustand)         │  │
│  │  • Chat History                                           │  │
│  │  • User Input Data                                        │  │
│  │  • Calculation Results                                    │  │
│  │  • Current Module/Context                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Services Layer                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Gemini AI Service                            │  │
│  │  • Conversation Management                                │  │
│  │  • Intent Recognition                                     │  │
│  │  • Response Generation                                    │  │
│  │  • Function Calling                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Calculation Modules (Pure Functions)            │  │
│  │  ┌────────────────┐  ┌─────────────────┐                │  │
│  │  │ Cable Sizing   │  │ String Sizing   │                │  │
│  │  └────────────────┘  └─────────────────┘                │  │
│  │  ┌────────────────┐  ┌─────────────────┐                │  │
│  │  │ Energy Prod.   │  │ Cost Estimation │                │  │
│  │  └────────────────┘  └─────────────────┘                │  │
│  │  ┌────────────────┐  ┌─────────────────┐                │  │
│  │  │ Payback Period │  │ IRR/NPV         │                │  │
│  │  └────────────────┘  └─────────────────┘                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Database (Supabase)                       │
│  • Chat History Storage                                         │
│  • User Preferences                                             │
│  • Saved Calculations                                           │
│  • Project Templates                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ **Technology Stack**

### **Frontend**
- **Framework:** React with TypeScript
- **UI Components:** Shadcn UI
- **Styling:** Tailwind CSS
- **Chat UI:** Custom chat components with markdown support
- **Charts:** Recharts for data visualization
- **State Management:** Zustand or React Context
- **Animations:** Framer Motion

### **Backend/Services**
- **AI Model:** Google Gemini 2.5 Flash Lite
- **API Client:** `@google/generative-ai` npm package
- **Calculation Engine:** Pure TypeScript functions
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (already integrated)

### **AI Integration**
- **Function Calling:** Gemini's function calling feature
- **Prompt Engineering:** Structured prompts for each module
- **Context Management:** Conversation history tracking
- **Response Streaming:** Real-time response display

---

## 📁 **Project File Structure**

```
src/
├── pages/
│   └── SolarAssistantChat.tsx           # Main chatbot page
│
├── components/
│   └── solar-assistant/
│       ├── ChatInterface.tsx             # Main chat container
│       ├── ChatMessage.tsx               # Individual message component
│       ├── ChatInput.tsx                 # Message input field
│       ├── QuickActions.tsx              # Quick action buttons
│       ├── TypingIndicator.tsx           # Loading animation
│       ├── ResultCard.tsx                # Calculation result display
│       ├── CableSizingResult.tsx         # Cable sizing visualization
│       ├── StringSizingResult.tsx        # String sizing visualization
│       ├── EnergyProductionChart.tsx     # Energy production charts
│       ├── FinancialSummary.tsx          # Financial analysis display
│       └── ChatHistory.tsx               # Chat history sidebar
│
├── services/
│   ├── geminiService.ts                  # Gemini AI integration
│   ├── chatbotService.ts                 # Chat orchestration
│   └── calculationModules/
│       ├── cableSizing.ts                # Cable sizing calculations
│       ├── stringSizing.ts               # String sizing calculations
│       ├── energyProduction.ts           # Energy production calculations
│       ├── costEstimation.ts             # Cost estimation calculations
│       ├── paybackPeriod.ts              # Payback period calculations
│       └── financialAnalysis.ts          # IRR, NPV calculations
│
├── utils/
│   ├── chatbot/
│   │   ├── promptTemplates.ts            # AI prompts for each module
│   │   ├── functionDefinitions.ts        # Gemini function definitions
│   │   ├── intentParser.ts               # Parse user intent
│   │   └── responseFormatter.ts          # Format AI responses
│   └── validation.ts                     # Input validation
│
├── types/
│   ├── chatbot.ts                        # Chatbot type definitions
│   ├── calculations.ts                   # Calculation type definitions
│   └── gemini.ts                         # Gemini API types
│
└── hooks/
    ├── useChatbot.ts                     # Main chatbot logic hook
    ├── useChat.ts                        # Chat state management
    └── useCalculations.ts                # Calculation state management
```

---

## 🔧 **Implementation Steps**

### **Phase 1: Setup & Foundation (Week 1)**

#### **Step 1.1: Install Dependencies**
```bash
npm install @google/generative-ai
npm install zustand
npm install react-markdown
npm install remark-gfm
npm install react-syntax-highlighter
```

#### **Step 1.2: Create Type Definitions**

**File:** `src/types/chatbot.ts`
```typescript
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  module?: CalculationModule;
  data?: any; // Calculation results
}

export type CalculationModule =
  | 'cable_sizing'
  | 'string_sizing'
  | 'energy_production'
  | 'cost_estimation'
  | 'payback_period'
  | 'financial_analysis';

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  currentModule: CalculationModule | null;
  collectedData: Record<string, any>;
  conversationContext: string[];
}

export interface CalculationRequest {
  module: CalculationModule;
  inputs: Record<string, any>;
}

export interface CalculationResult {
  success: boolean;
  data?: any;
  error?: string;
  visualization?: any;
}
```

#### **Step 1.3: Setup Gemini Service**

**File:** `src/services/geminiService.ts`
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export class GeminiService {
  private model: any;
  private chat: any;

  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });
  }

  async startChat(systemPrompt: string, history: any[] = []) {
    this.chat = this.model.startChat({
      history: history,
      systemInstruction: systemPrompt,
    });
    return this.chat;
  }

  async sendMessage(message: string) {
    if (!this.chat) {
      throw new Error('Chat not initialized');
    }
    const result = await this.chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  }

  async sendMessageWithFunctions(
    message: string,
    functions: any[]
  ) {
    const result = await this.chat.sendMessage(message, {
      tools: [{ functionDeclarations: functions }],
    });
    return result.response;
  }
}

export const geminiService = new GeminiService();
```

---

### **Phase 2: Calculation Modules (Week 2)**

#### **Step 2.1: Cable Sizing Module**

**File:** `src/services/calculationModules/cableSizing.ts`
```typescript
export interface CableSizingInput {
  current: number; // Amperes
  voltage: number; // Volts
  distance: number; // Meters
  cableType: 'ac' | 'dc';
  material: 'copper' | 'aluminum';
  maxVoltageDrop: number; // Percentage
  ambientTemp: number; // Celsius
  installationMethod: string;
}

export interface CableSizingResult {
  recommendedSize: number; // mm²
  voltageDrop: number; // Percentage
  voltageDropVolts: number; // Volts
  resistance: number; // Ohms
  powerLoss: number; // Watts
  numberOfRuns: number;
  estimatedCost: number; // USD
  specifications: {
    cableType: string;
    material: string;
    crossSection: number;
    currentCapacity: number;
  };
}

export function calculateCableSizing(
  input: CableSizingInput
): CableSizingResult {
  const {
    current,
    voltage,
    distance,
    cableType,
    material,
    maxVoltageDrop,
    ambientTemp,
    installationMethod,
  } = input;

  // Cable resistivity (Ohm·mm²/m at 20°C)
  const resistivity = material === 'copper' ? 0.0175 : 0.0283;

  // Temperature correction factor
  const tempCoefficient = material === 'copper' ? 0.00393 : 0.00403;
  const correctedResistivity =
    resistivity * (1 + tempCoefficient * (ambientTemp - 20));

  // Maximum allowed voltage drop in volts
  const maxVoltageDropVolts = (voltage * maxVoltageDrop) / 100;

  // Calculate minimum cable cross-section
  // For DC: R = ρ * 2L / A → A = ρ * 2L * I / ΔV
  // For AC (3-phase): R = ρ * √3 * L / A → A = ρ * √3 * L * I / ΔV
  const lengthFactor = cableType === 'dc' ? 2 : Math.sqrt(3);
  const minCrossSection =
    (correctedResistivity * lengthFactor * distance * current) /
    maxVoltageDropVolts;

  // Standard cable sizes (mm²)
  const standardSizes = [
    1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400,
  ];

  // Find the next standard size
  const recommendedSize =
    standardSizes.find((size) => size >= minCrossSection) ||
    standardSizes[standardSizes.length - 1];

  // Calculate actual voltage drop with recommended size
  const resistance =
    (correctedResistivity * lengthFactor * distance) / recommendedSize;
  const voltageDropVolts = current * resistance;
  const voltageDrop = (voltageDropVolts / voltage) * 100;

  // Power loss
  const powerLoss = current * current * resistance;

  // Current capacity based on installation method and size
  const currentCapacity = calculateCurrentCapacity(
    recommendedSize,
    material,
    installationMethod,
    ambientTemp
  );

  // Calculate number of runs if current exceeds capacity
  const numberOfRuns = Math.ceil(current / currentCapacity);

  // Estimate cost (simplified)
  const costPerMeter = estimateCableCost(recommendedSize, material);
  const estimatedCost = costPerMeter * distance * numberOfRuns * 2; // Both ways

  return {
    recommendedSize,
    voltageDrop: parseFloat(voltageDrop.toFixed(2)),
    voltageDropVolts: parseFloat(voltageDropVolts.toFixed(2)),
    resistance: parseFloat(resistance.toFixed(4)),
    powerLoss: parseFloat(powerLoss.toFixed(2)),
    numberOfRuns,
    estimatedCost: parseFloat(estimatedCost.toFixed(2)),
    specifications: {
      cableType: cableType.toUpperCase(),
      material: material.charAt(0).toUpperCase() + material.slice(1),
      crossSection: recommendedSize,
      currentCapacity: parseFloat(currentCapacity.toFixed(2)),
    },
  };
}

function calculateCurrentCapacity(
  size: number,
  material: 'copper' | 'aluminum',
  installationMethod: string,
  ambientTemp: number
): number {
  // Simplified current capacity calculation
  // Based on IEC 60364-5-52
  const baseCapacity = material === 'copper' 
    ? size * 5.5 // Approximate for copper
    : size * 4.3; // Approximate for aluminum

  // Derating factor for temperature
  const tempDeratingFactor = 1 - (ambientTemp - 30) * 0.01;

  return baseCapacity * tempDeratingFactor;
}

function estimateCableCost(size: number, material: 'copper' | 'aluminum'): number {
  // Cost per meter in USD (approximate)
  const baseCost = material === 'copper' ? 2.5 : 1.8;
  return baseCost * (size / 10);
}
```

#### **Step 2.2: String Sizing Module**

**File:** `src/services/calculationModules/stringSizing.ts`
```typescript
export interface StringSizingInput {
  moduleVoc: number; // Open circuit voltage (V)
  moduleVmp: number; // Max power voltage (V)
  moduleIsc: number; // Short circuit current (A)
  moduleImp: number; // Max power current (A)
  modulePower: number; // Module power (W)
  inverterMaxVoltage: number; // Max DC voltage (V)
  inverterMinMpptVoltage: number; // Min MPPT voltage (V)
  inverterMaxMpptVoltage: number; // Max MPPT voltage (V)
  inverterMaxCurrent: number; // Max input current (A)
  inverterMaxPower: number; // Inverter power (W)
  minTemperature: number; // Min ambient temp (°C)
  maxTemperature: number; // Max ambient temp (°C)
}

export interface StringSizingResult {
  modulesPerString: number;
  numberOfStrings: number;
  totalModules: number;
  totalSystemPower: number; // kW
  stringVoltages: {
    vocAtMinTemp: number;
    vmpAtSTC: number;
    vmpAtMaxTemp: number;
  };
  stringCurrent: {
    iscAtSTC: number;
    impAtSTC: number;
  };
  dcToAcRatio: number;
  warnings: string[];
  recommendations: string[];
}

export function calculateStringSizing(
  input: StringSizingInput
): StringSizingResult {
  const {
    moduleVoc,
    moduleVmp,
    moduleIsc,
    moduleImp,
    modulePower,
    inverterMaxVoltage,
    inverterMinMpptVoltage,
    inverterMaxMpptVoltage,
    inverterMaxCurrent,
    inverterMaxPower,
    minTemperature,
    maxTemperature,
  } = input;

  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Temperature coefficients (typical for crystalline silicon)
  const vocTempCoeff = -0.0033; // -0.33%/°C
  const vmpTempCoeff = -0.0045; // -0.45%/°C

  // Calculate voltage at temperature extremes
  const vocAtMinTemp =
    moduleVoc * (1 + vocTempCoeff * (minTemperature - 25));
  const vmpAtMaxTemp =
    moduleVmp * (1 + vmpTempCoeff * (maxTemperature - 25));

  // Calculate maximum modules per string based on voltage constraints
  const maxModulesVoltageLimit = Math.floor(
    inverterMaxVoltage / vocAtMinTemp
  );
  const minModulesVoltageLimit = Math.ceil(
    inverterMinMpptVoltage / vmpAtMaxTemp
  );
  const maxModulesMpptLimit = Math.floor(
    inverterMaxMpptVoltage / moduleVmp
  );

  // Determine optimal modules per string
  let modulesPerString = Math.min(
    maxModulesVoltageLimit,
    maxModulesMpptLimit
  );

  if (modulesPerString < minModulesVoltageLimit) {
    warnings.push(
      `Minimum modules per string (${minModulesVoltageLimit}) cannot be achieved with this inverter`
    );
    modulesPerString = minModulesVoltageLimit;
  }

  // Calculate string voltages
  const stringVocAtMinTemp = vocAtMinTemp * modulesPerString;
  const stringVmpAtSTC = moduleVmp * modulesPerString;
  const stringVmpAtMaxTemp = vmpAtMaxTemp * modulesPerString;

  // Check voltage limits
  if (stringVocAtMinTemp > inverterMaxVoltage) {
    warnings.push(
      `String Voc at min temp (${stringVocAtMinTemp.toFixed(1)}V) exceeds inverter max voltage (${inverterMaxVoltage}V)`
    );
  }

  if (stringVmpAtMaxTemp < inverterMinMpptVoltage) {
    warnings.push(
      `String Vmp at max temp (${stringVmpAtMaxTemp.toFixed(1)}V) is below inverter min MPPT voltage (${inverterMinMpptVoltage}V)`
    );
  }

  // Calculate number of strings based on power
  const stringPower = modulePower * modulesPerString;
  const maxStringsByPower = Math.floor(inverterMaxPower / stringPower);

  // Calculate number of strings based on current
  const maxStringsByCurrent = Math.floor(inverterMaxCurrent / moduleImp);

  const numberOfStrings = Math.min(maxStringsByPower, maxStringsByCurrent);

  if (numberOfStrings === 0) {
    warnings.push('No strings can be connected to this inverter');
  }

  // Calculate total system parameters
  const totalModules = modulesPerString * numberOfStrings;
  const totalSystemPower = (modulePower * totalModules) / 1000; // kW

  // DC to AC ratio
  const dcToAcRatio = (totalSystemPower * 1000) / inverterMaxPower;

  // Recommendations
  if (dcToAcRatio < 1.1) {
    recommendations.push(
      'Consider increasing DC/AC ratio to 1.1-1.3 for better performance'
    );
  } else if (dcToAcRatio > 1.35) {
    recommendations.push(
      'DC/AC ratio is high. Inverter may clip power during peak production'
    );
  }

  if (modulesPerString < 8) {
    recommendations.push(
      'Consider using more modules per string to reduce current and cable costs'
    );
  }

  return {
    modulesPerString,
    numberOfStrings,
    totalModules,
    totalSystemPower: parseFloat(totalSystemPower.toFixed(2)),
    stringVoltages: {
      vocAtMinTemp: parseFloat(stringVocAtMinTemp.toFixed(1)),
      vmpAtSTC: parseFloat(stringVmpAtSTC.toFixed(1)),
      vmpAtMaxTemp: parseFloat(stringVmpAtMaxTemp.toFixed(1)),
    },
    stringCurrent: {
      iscAtSTC: parseFloat(moduleIsc.toFixed(2)),
      impAtSTC: parseFloat(moduleImp.toFixed(2)),
    },
    dcToAcRatio: parseFloat(dcToAcRatio.toFixed(2)),
    warnings,
    recommendations,
  };
}
```

#### **Step 2.3: Energy Production Module**

**File:** `src/services/calculationModules/energyProduction.ts`
```typescript
export interface EnergyProductionInput {
  systemCapacity: number; // kW
  latitude: number;
  longitude: number;
  tiltAngle: number; // degrees
  azimuthAngle: number; // degrees (0=North, 90=East, 180=South, 270=West)
  performanceRatio: number; // 0-1 (typically 0.75-0.85)
  annualDegradation: number; // percentage per year
  projectLifetime: number; // years
}

export interface EnergyProductionResult {
  annualProduction: number; // kWh/year
  specificYield: number; // kWh/kWp/year
  monthlyProduction: MonthlyProduction[];
  yearlyProduction: YearlyProduction[];
  totalLifetimeProduction: number; // kWh
  averageDailyProduction: number; // kWh/day
}

export interface MonthlyProduction {
  month: string;
  production: number; // kWh
  specificYield: number; // kWh/kWp
}

export interface YearlyProduction {
  year: number;
  production: number; // kWh
  degradationFactor: number;
}

export function calculateEnergyProduction(
  input: EnergyProductionInput
): EnergyProductionResult {
  const {
    systemCapacity,
    latitude,
    tiltAngle,
    azimuthAngle,
    performanceRatio,
    annualDegradation,
    projectLifetime,
  } = input;

  // Simplified solar irradiance model (PSH - Peak Sun Hours)
  // In real application, use NREL or similar API
  const annualPSH = estimateAnnualPSH(latitude, tiltAngle, azimuthAngle);

  // Annual production calculation
  const annualProduction =
    systemCapacity * annualPSH * 365 * performanceRatio;

  // Specific yield
  const specificYield = annualProduction / systemCapacity;

  // Monthly production (simplified)
  const monthlyProduction = calculateMonthlyProduction(
    systemCapacity,
    latitude,
    tiltAngle,
    performanceRatio
  );

  // Yearly production with degradation
  const yearlyProduction: YearlyProduction[] = [];
  let totalLifetimeProduction = 0;

  for (let year = 1; year <= projectLifetime; year++) {
    const degradationFactor = Math.pow(
      1 - annualDegradation / 100,
      year - 1
    );
    const production = annualProduction * degradationFactor;
    
    yearlyProduction.push({
      year,
      production: parseFloat(production.toFixed(2)),
      degradationFactor: parseFloat(degradationFactor.toFixed(4)),
    });

    totalLifetimeProduction += production;
  }

  const averageDailyProduction = annualProduction / 365;

  return {
    annualProduction: parseFloat(annualProduction.toFixed(2)),
    specificYield: parseFloat(specificYield.toFixed(2)),
    monthlyProduction,
    yearlyProduction,
    totalLifetimeProduction: parseFloat(totalLifetimeProduction.toFixed(2)),
    averageDailyProduction: parseFloat(averageDailyProduction.toFixed(2)),
  };
}

function estimateAnnualPSH(
  latitude: number,
  tiltAngle: number,
  azimuthAngle: number
): number {
  // Simplified PSH estimation
  // In production, use actual solar radiation data from NREL or similar
  
  const absLatitude = Math.abs(latitude);
  
  // Base PSH at equator (optimally tilted)
  let basePSH = 5.5;
  
  // Latitude adjustment
  if (absLatitude < 15) basePSH = 5.5;
  else if (absLatitude < 30) basePSH = 5.0;
  else if (absLatitude < 45) basePSH = 4.5;
  else basePSH = 4.0;
  
  // Tilt optimization factor
  const optimalTilt = absLatitude;
  const tiltDifference = Math.abs(tiltAngle - optimalTilt);
  const tiltFactor = 1 - tiltDifference * 0.005; // 0.5% loss per degree difference
  
  // Azimuth factor (South is optimal in Northern hemisphere)
  const optimalAzimuth = latitude >= 0 ? 180 : 0;
  const azimuthDifference = Math.abs(azimuthAngle - optimalAzimuth);
  const azimuthFactor = 1 - Math.min(azimuthDifference, 90) * 0.003;
  
  return basePSH * tiltFactor * azimuthFactor;
}

function calculateMonthlyProduction(
  systemCapacity: number,
  latitude: number,
  tiltAngle: number,
  performanceRatio: number
): MonthlyProduction[] {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Simplified monthly PSH variation (Northern hemisphere pattern)
  const monthlyPSHFactors = [
    0.7, 0.8, 0.9, 1.0, 1.1, 1.15,
    1.2, 1.15, 1.05, 0.95, 0.75, 0.65
  ];

  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  return months.map((month, index) => {
    const basePSH = estimateAnnualPSH(latitude, tiltAngle, 180);
    const monthlyPSH = basePSH * monthlyPSHFactors[index];
    const production =
      systemCapacity * monthlyPSH * daysInMonth[index] * performanceRatio;
    const specificYield = production / systemCapacity;

    return {
      month,
      production: parseFloat(production.toFixed(2)),
      specificYield: parseFloat(specificYield.toFixed(2)),
    };
  });
}
```

---

### **Phase 3: Financial Calculation Modules (Week 3)**

#### **Step 3.1: Payback Period Module**

**File:** `src/services/calculationModules/paybackPeriod.ts`
```typescript
export interface PaybackInput {
  initialInvestment: number; // USD
  annualSavings: number; // USD/year
  annualOMCost: number; // USD/year
  electricityEscalation: number; // % per year
  omEscalation: number; // % per year
}

export interface PaybackResult {
  simplePayback: number; // years
  discountedPayback: number; // years
  paybackBreakdown: PaybackYearData[];
}

export interface PaybackYearData {
  year: number;
  savings: number;
  omCost: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
}

export function calculatePaybackPeriod(
  input: PaybackInput
): PaybackResult {
  const {
    initialInvestment,
    annualSavings,
    annualOMCost,
    electricityEscalation,
    omEscalation,
  } = input;

  const paybackBreakdown: PaybackYearData[] = [];
  let cumulativeCashFlow = -initialInvestment;
  let simplePayback = 0;
  let discountedPayback = 0;

  for (let year = 1; year <= 30; year++) {
    const savings =
      annualSavings * Math.pow(1 + electricityEscalation / 100, year - 1);
    const omCost =
      annualOMCost * Math.pow(1 + omEscalation / 100, year - 1);
    const netCashFlow = savings - omCost;
    cumulativeCashFlow += netCashFlow;

    paybackBreakdown.push({
      year,
      savings: parseFloat(savings.toFixed(2)),
      omCost: parseFloat(omCost.toFixed(2)),
      netCashFlow: parseFloat(netCashFlow.toFixed(2)),
      cumulativeCashFlow: parseFloat(cumulativeCashFlow.toFixed(2)),
    });

    if (cumulativeCashFlow >= 0 && simplePayback === 0) {
      simplePayback = year;
    }
  }

  if (simplePayback === 0) {
    simplePayback = -1; // Payback not achieved in 30 years
  }

  return {
    simplePayback,
    discountedPayback: simplePayback, // Simplified
    paybackBreakdown: paybackBreakdown.slice(0, Math.min(25, paybackBreakdown.length)),
  };
}
```

#### **Step 3.2: IRR/NPV Module**

**File:** `src/services/calculationModules/financialAnalysis.ts`
```typescript
export interface FinancialAnalysisInput {
  initialInvestment: number;
  annualRevenue: number;
  annualOMCost: number;
  projectLifetime: number;
  discountRate: number; // %
  electricityEscalation: number; // %
  omEscalation: number; // %
  annualDegradation: number; // %
}

export interface FinancialAnalysisResult {
  npv: number;
  irr: number; // %
  roi: number; // %
  lcoe: number; // $/kWh
  cashFlowAnalysis: CashFlowYear[];
}

export interface CashFlowYear {
  year: number;
  revenue: number;
  omCost: number;
  netCashFlow: number;
  discountedCashFlow: number;
  cumulativeNPV: number;
}

export function calculateFinancialAnalysis(
  input: FinancialAnalysisInput
): FinancialAnalysisResult {
  const {
    initialInvestment,
    annualRevenue,
    annualOMCost,
    projectLifetime,
    discountRate,
    electricityEscalation,
    omEscalation,
    annualDegradation,
  } = input;

  const cashFlowAnalysis: CashFlowYear[] = [];
  let cumulativeNPV = -initialInvestment;
  let totalDiscountedRevenue = 0;
  let totalDiscountedCosts = initialInvestment;

  for (let year = 1; year <= projectLifetime; year++) {
    const degradationFactor = Math.pow(1 - annualDegradation / 100, year - 1);
    const revenue =
      annualRevenue *
      degradationFactor *
      Math.pow(1 + electricityEscalation / 100, year - 1);
    const omCost =
      annualOMCost * Math.pow(1 + omEscalation / 100, year - 1);
    const netCashFlow = revenue - omCost;
    const discountFactor = Math.pow(1 + discountRate / 100, year);
    const discountedCashFlow = netCashFlow / discountFactor;

    cumulativeNPV += discountedCashFlow;
    totalDiscountedRevenue += revenue / discountFactor;
    totalDiscountedCosts += omCost / discountFactor;

    cashFlowAnalysis.push({
      year,
      revenue: parseFloat(revenue.toFixed(2)),
      omCost: parseFloat(omCost.toFixed(2)),
      netCashFlow: parseFloat(netCashFlow.toFixed(2)),
      discountedCashFlow: parseFloat(discountedCashFlow.toFixed(2)),
      cumulativeNPV: parseFloat(cumulativeNPV.toFixed(2)),
    });
  }

  // Calculate IRR using Newton-Raphson method
  const irr = calculateIRR(initialInvestment, cashFlowAnalysis);

  // Calculate ROI
  const totalRevenue = cashFlowAnalysis.reduce((sum, cf) => sum + cf.revenue, 0);
  const totalOMCost = cashFlowAnalysis.reduce((sum, cf) => sum + cf.omCost, 0);
  const roi = ((totalRevenue - totalOMCost - initialInvestment) / initialInvestment) * 100;

  // Calculate LCOE
  const lcoe = totalDiscountedCosts / totalDiscountedRevenue;

  return {
    npv: parseFloat(cumulativeNPV.toFixed(2)),
    irr: parseFloat(irr.toFixed(2)),
    roi: parseFloat(roi.toFixed(2)),
    lcoe: parseFloat(lcoe.toFixed(4)),
    cashFlowAnalysis,
  };
}

function calculateIRR(
  initialInvestment: number,
  cashFlows: CashFlowYear[]
): number {
  // Newton-Raphson method to find IRR
  let irr = 0.1; // Initial guess: 10%
  const maxIterations = 100;
  const tolerance = 0.0001;

  for (let i = 0; i < maxIterations; i++) {
    let npv = -initialInvestment;
    let dnpv = 0;

    cashFlows.forEach((cf, index) => {
      const year = index + 1;
      const factor = Math.pow(1 + irr, year);
      npv += cf.netCashFlow / factor;
      dnpv -= (year * cf.netCashFlow) / (factor * (1 + irr));
    });

    const newIRR = irr - npv / dnpv;

    if (Math.abs(newIRR - irr) < tolerance) {
      return newIRR * 100; // Convert to percentage
    }

    irr = newIRR;
  }

  return irr * 100; // Return percentage
}
```

---

### **Phase 4: Gemini AI Integration with Function Calling (Week 4)**

#### **Step 4.1: Define Function Declarations for Gemini**

**File:** `src/utils/chatbot/functionDefinitions.ts`
```typescript
export const calculationFunctions = [
  {
    name: 'calculate_cable_sizing',
    description:
      'Calculate optimal AC or DC cable size based on electrical parameters',
    parameters: {
      type: 'object',
      properties: {
        current: {
          type: 'number',
          description: 'Current in Amperes',
        },
        voltage: {
          type: 'number',
          description: 'Voltage in Volts',
        },
        distance: {
          type: 'number',
          description: 'Cable length in meters',
        },
        cableType: {
          type: 'string',
          enum: ['ac', 'dc'],
          description: 'Type of cable (AC or DC)',
        },
        material: {
          type: 'string',
          enum: ['copper', 'aluminum'],
          description: 'Cable conductor material',
        },
        maxVoltageDrop: {
          type: 'number',
          description: 'Maximum allowed voltage drop in percentage',
        },
        ambientTemp: {
          type: 'number',
          description: 'Ambient temperature in Celsius',
        },
        installationMethod: {
          type: 'string',
          description: 'Cable installation method',
        },
      },
      required: [
        'current',
        'voltage',
        'distance',
        'cableType',
        'material',
        'maxVoltageDrop',
      ],
    },
  },
  {
    name: 'calculate_string_sizing',
    description:
      'Calculate optimal PV string configuration for a given inverter',
    parameters: {
      type: 'object',
      properties: {
        moduleVoc: {
          type: 'number',
          description: 'Module open circuit voltage in Volts',
        },
        moduleVmp: {
          type: 'number',
          description: 'Module maximum power voltage in Volts',
        },
        moduleIsc: {
          type: 'number',
          description: 'Module short circuit current in Amperes',
        },
        moduleImp: {
          type: 'number',
          description: 'Module maximum power current in Amperes',
        },
        modulePower: {
          type: 'number',
          description: 'Module power rating in Watts',
        },
        inverterMaxVoltage: {
          type: 'number',
          description: 'Inverter maximum DC voltage in Volts',
        },
        inverterMinMpptVoltage: {
          type: 'number',
          description: 'Inverter minimum MPPT voltage in Volts',
        },
        inverterMaxMpptVoltage: {
          type: 'number',
          description: 'Inverter maximum MPPT voltage in Volts',
        },
        inverterMaxCurrent: {
          type: 'number',
          description: 'Inverter maximum input current in Amperes',
        },
        inverterMaxPower: {
          type: 'number',
          description: 'Inverter power rating in Watts',
        },
        minTemperature: {
          type: 'number',
          description: 'Minimum ambient temperature in Celsius',
        },
        maxTemperature: {
          type: 'number',
          description: 'Maximum ambient temperature in Celsius',
        },
      },
      required: [
        'moduleVoc',
        'moduleVmp',
        'moduleIsc',
        'moduleImp',
        'modulePower',
        'inverterMaxVoltage',
        'inverterMinMpptVoltage',
        'inverterMaxMpptVoltage',
        'inverterMaxCurrent',
        'inverterMaxPower',
      ],
    },
  },
  {
    name: 'calculate_energy_production',
    description:
      'Estimate annual and lifetime solar energy production',
    parameters: {
      type: 'object',
      properties: {
        systemCapacity: {
          type: 'number',
          description: 'System capacity in kW',
        },
        latitude: {
          type: 'number',
          description: 'Location latitude',
        },
        longitude: {
          type: 'number',
          description: 'Location longitude',
        },
        tiltAngle: {
          type: 'number',
          description: 'Panel tilt angle in degrees',
        },
        azimuthAngle: {
          type: 'number',
          description: 'Panel azimuth angle in degrees',
        },
        performanceRatio: {
          type: 'number',
          description: 'System performance ratio (0-1)',
        },
        annualDegradation: {
          type: 'number',
          description: 'Annual degradation rate in percentage',
        },
        projectLifetime: {
          type: 'number',
          description: 'Project lifetime in years',
        },
      },
      required: [
        'systemCapacity',
        'latitude',
        'tiltAngle',
        'performanceRatio',
      ],
    },
  },
  {
    name: 'calculate_payback_period',
    description:
      'Calculate simple and discounted payback period',
    parameters: {
      type: 'object',
      properties: {
        initialInvestment: {
          type: 'number',
          description: 'Initial project investment in USD',
        },
        annualSavings: {
          type: 'number',
          description: 'Annual electricity cost savings in USD',
        },
        annualOMCost: {
          type: 'number',
          description: 'Annual O&M cost in USD',
        },
        electricityEscalation: {
          type: 'number',
          description: 'Electricity price escalation in percentage per year',
        },
        omEscalation: {
          type: 'number',
          description: 'O&M cost escalation in percentage per year',
        },
      },
      required: [
        'initialInvestment',
        'annualSavings',
        'annualOMCost',
      ],
    },
  },
  {
    name: 'calculate_financial_analysis',
    description:
      'Calculate NPV, IRR, ROI, and LCOE for solar project',
    parameters: {
      type: 'object',
      properties: {
        initialInvestment: {
          type: 'number',
          description: 'Initial project investment in USD',
        },
        annualRevenue: {
          type: 'number',
          description: 'Annual revenue or savings in USD',
        },
        annualOMCost: {
          type: 'number',
          description: 'Annual O&M cost in USD',
        },
        projectLifetime: {
          type: 'number',
          description: 'Project lifetime in years',
        },
        discountRate: {
          type: 'number',
          description: 'Discount rate in percentage',
        },
        electricityEscalation: {
          type: 'number',
          description: 'Electricity price escalation in percentage',
        },
        omEscalation: {
          type: 'number',
          description: 'O&M cost escalation in percentage',
        },
        annualDegradation: {
          type: 'number',
          description: 'Annual system degradation in percentage',
        },
      },
      required: [
        'initialInvestment',
        'annualRevenue',
        'annualOMCost',
        'projectLifetime',
        'discountRate',
      ],
    },
  },
];
```

#### **Step 4.2: System Prompts**

**File:** `src/utils/chatbot/promptTemplates.ts`
```typescript
export const SYSTEM_PROMPT = `You are a Solar PV Design Assistant - an expert AI chatbot specialized in helping users design and analyze solar photovoltaic systems.

Your role is to:
1. Guide users through solar PV system design processes
2. Ask relevant questions to gather necessary information
3. Perform accurate calculations using available functions
4. Provide clear explanations of results
5. Offer professional recommendations

**Available Calculation Modules:**
- Cable Sizing (AC/DC)
- PV String Sizing
- Energy Production Assessment
- Cost Estimation
- Payback Period Analysis
- Financial Analysis (IRR, NPV, ROI, LCOE)

**Guidelines:**
- Be conversational and friendly, but professional
- Ask one question at a time for clarity
- Provide default values when appropriate
- Explain technical terms simply
- Show step-by-step calculation process
- Highlight warnings and recommendations
- Use emojis sparingly for better UX (⚡, 🔌, 💡, 📊, 💰)

**When user asks for help:**
1. Identify which module they need
2. Ask for required inputs one by one
3. Suggest typical values when appropriate
4. Execute calculation when all data is collected
5. Present results clearly with visualizations
6. Offer follow-up actions

Always maintain context of the conversation and remember previously provided information.`;

export const WELCOME_MESSAGE = `👋 Hello! I'm your Solar PV Design Assistant.

I can help you with:
⚡ Cable Sizing (AC/DC)
🔌 PV String Configuration
☀️ Energy Production Estimation
💰 Financial Analysis (Payback, IRR, NPV)
📊 System Design Recommendations

What would you like to work on today?`;

export const MODULE_PROMPTS = {
  cable_sizing: `I'll help you size the cables for your solar system. Let's start with some basic information:

What type of cable do you need?
1. DC cable (from PV panels to inverter)
2. AC cable (from inverter to grid/load)`,

  string_sizing: `I'll help you configure the optimal PV string arrangement. To start, I need information about:

1. The solar module specifications
2. The inverter specifications
3. Temperature conditions

Do you have this information ready?`,

  energy_production: `I'll estimate the energy production for your solar system. I'll need:

1. System capacity (kW)
2. Location (latitude/longitude)
3. Panel tilt and orientation
4. Performance assumptions

Let's start with the system capacity - how many kW is your planned system?`,

  payback_period: `I'll calculate the payback period for your solar investment. I need to know:

1. Initial investment cost
2. Expected annual savings
3. O&M costs
4. Escalation rates

What's the total initial investment for the project (in USD)?`,

  financial_analysis: `I'll perform a comprehensive financial analysis including NPV, IRR, and LCOE. I'll need:

1. Initial investment
2. Annual revenue/savings
3. Operating costs
4. Project lifetime
5. Financial assumptions

What's the initial project investment (in USD)?`,
};
```

---

### **Phase 5: Chat Interface (Week 5)**

#### **Step 5.1: Main Chatbot Hook**

**File:** `src/hooks/useChatbot.ts`
```typescript
import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { geminiService } from '@/services/geminiService';
import { calculationFunctions } from '@/utils/chatbot/functionDefinitions';
import { SYSTEM_PROMPT, WELCOME_MESSAGE } from '@/utils/chatbot/promptTemplates';
import {
  calculateCableSizing,
  type CableSizingInput,
} from '@/services/calculationModules/cableSizing';
import {
  calculateStringSizing,
  type StringSizingInput,
} from '@/services/calculationModules/stringSizing';
import {
  calculateEnergyProduction,
  type EnergyProductionInput,
} from '@/services/calculationModules/energyProduction';
import {
  calculatePaybackPeriod,
  type PaybackInput,
} from '@/services/calculationModules/paybackPeriod';
import {
  calculateFinancialAnalysis,
  type FinancialAnalysisInput,
} from '@/services/calculationModules/financialAnalysis';
import type { ChatMessage, CalculationModule } from '@/types/chatbot';

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uuidv4(),
      role: 'assistant',
      content: WELCOME_MESSAGE,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentModule, setCurrentModule] = useState<CalculationModule | null>(null);
  const chatRef = useRef<any>(null);

  const initializeChat = useCallback(async () => {
    if (!chatRef.current) {
      const history = messages.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      chatRef.current = await geminiService.startChat(SYSTEM_PROMPT, history);
    }
  }, [messages]);

  const executeFunctionCall = useCallback(
    (functionName: string, args: any) => {
      console.log('Executing function:', functionName, args);

      switch (functionName) {
        case 'calculate_cable_sizing':
          return calculateCableSizing(args as CableSizingInput);

        case 'calculate_string_sizing':
          return calculateStringSizing(args as StringSizingInput);

        case 'calculate_energy_production':
          return calculateEnergyProduction(args as EnergyProductionInput);

        case 'calculate_payback_period':
          return calculatePaybackPeriod(args as PaybackInput);

        case 'calculate_financial_analysis':
          return calculateFinancialAnalysis(args as FinancialAnalysisInput);

        default:
          throw new Error(`Unknown function: ${functionName}`);
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        await initializeChat();

        // Send message to Gemini with function calling
        const result = await geminiService.sendMessageWithFunctions(
          content,
          calculationFunctions
        );

        let responseText = '';
        let calculationResult = null;

        // Check if function call was made
        const functionCall = result.functionCalls()?.[0];

        if (functionCall) {
          console.log('Function call detected:', functionCall);

          // Execute the calculation
          const calcResult = executeFunctionCall(
            functionCall.name,
            functionCall.args
          );

          calculationResult = calcResult;

          // Send function response back to Gemini
          const functionResponse = {
            name: functionCall.name,
            response: calcResult,
          };

          const followUpResult = await chatRef.current.sendMessage([
            {
              functionResponse: functionResponse,
            },
          ]);

          responseText = followUpResult.response.text();
        } else {
          responseText = result.text();
        }

        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: responseText,
          timestamp: new Date(),
          data: calculationResult,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Error sending message:', error);

        const errorMessage: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content:
            'I apologize, but I encountered an error. Please try again or rephrase your question.',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [initializeChat, executeFunctionCall]
  );

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: uuidv4(),
        role: 'assistant',
        content: WELCOME_MESSAGE,
        timestamp: new Date(),
      },
    ]);
    chatRef.current = null;
    setCurrentModule(null);
  }, []);

  return {
    messages,
    isLoading,
    currentModule,
    sendMessage,
    clearChat,
  };
}
```

---

## 📊 **UI/UX Design Guidelines**

### **Chat Interface Design**

1. **Modern Chat Bubble Design**
   - User messages: Right-aligned, blue gradient
   - Assistant messages: Left-aligned, dark theme
   - Calculation results: Special card format with visualizations

2. **Interactive Elements**
   - Quick action buttons for common tasks
   - Input validation with real-time feedback
   - Copy result button
   - Download PDF report button

3. **Visualizations**
   - Cable sizing: Diagram with specifications
   - String sizing: Array layout visualization
   - Energy production: Monthly/yearly charts
   - Financial analysis: Cash flow graphs

4. **Responsive Design**
   - Mobile-first approach
   - Collapsible history sidebar
   - Full-screen mode option

---

## 🚀 **Deployment Steps**

### **Step 1: Environment Variables**

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### **Step 2: Testing Checklist**

- [ ] Test each calculation module independently
- [ ] Test Gemini conversation flow
- [ ] Test function calling integration
- [ ] Test error handling
- [ ] Test mobile responsiveness
- [ ] Test with real-world scenarios

### **Step 3: Launch**

1. Add route to main app
2. Add to dashboard as new app card
3. Deduct AI credits per conversation (e.g., 1 credit per 10 messages)
4. Monitor usage and costs
5. Collect user feedback

---

## 💰 **AI Credits Integration**

**Credit Deduction Strategy:**
- 1 credit per conversation session
- Or 0.1 credit per message
- Or 1 credit per calculation performed

**Implementation:**
```typescript
// In useChatbot hook
const sendMessage = async (content: string) => {
  // Check AI credits
  const creditSuccess = await checkAndDeduct(
    projectId,
    'chatbot_message',
    'Solar Assistant Chat'
  );
  
  if (!creditSuccess) {
    // Show insufficient credits message
    return;
  }
  
  // Proceed with sending message
  // ...
};
```

---

## 📈 **Future Enhancements**

1. **Advanced Features**
   - Weather data integration (NREL API)
   - 3D visualization of system layout
   - Multi-language support
   - Voice input/output
   - PDF report generation

2. **AI Improvements**
   - Fine-tune prompts based on user feedback
   - Add more calculation modules
   - Implement context memory across sessions
   - Add image analysis for roof measurements

3. **Integration**
   - Connect with PV Designer Pro
   - Connect with BESS Designer
   - Export designs to other tools
   - Import data from existing projects

---

## 🎯 **Success Metrics**

- User engagement (messages per session)
- Calculation accuracy
- Response time
- User satisfaction ratings
- Feature usage statistics
- Conversion to paid features

---

## 📚 **Resources**

**Gemini AI Documentation:**
- https://ai.google.dev/gemini-api/docs
- https://ai.google.dev/gemini-api/docs/function-calling

**Solar Design References:**
- IEC 60364 (Cable sizing)
- IEC 61215 (PV modules)
- IEEE 1547 (Interconnection standards)

**Financial Analysis:**
- NREL Cost Models
- PVWatts Calculator
- SAM (System Advisor Model)

---

This comprehensive plan provides everything you need to build the Solar PV Design Assistant chatbot. Start with Phase 1 and progress through each phase systematically. The modular design allows you to test each component independently before integration.

Would you like me to start implementing any specific module or component?

