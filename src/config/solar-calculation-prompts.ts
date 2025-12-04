import { CalculationTask, CalculationType } from '@/types/solar-ai-chat';

// Pre-defined calculation tasks with prompts and instructions
export const CALCULATION_TASKS: CalculationTask[] = [
  {
    id: 'pv_sizing',
    name: 'PV System Sizing',
    description: 'Design grid-connected, battery-less solar PV systems for residential and small C&I projects',
    category: 'sizing',
    icon: 'Sun',
    requiredInputs: [
      'dailyDaytimeConsumption (optional)',
      'locationCoordinates or city/country',
      'availableSpace (m²)',
      'shadingCondition',
      'installationType',
      'panelManufacturer',
      'inverterManufacturer',
      'systemACVoltage',
    ],
    outputFormat: 'mixed',
    conversationalFlow: true,  // Enable step-by-step questioning
  },
  {
    id: 'financial_analysis',
    name: 'Financial Analysis',
    description: 'Comprehensive financial analysis including NPV, IRR, payback period, and ROI calculations',
    category: 'financial',
    icon: 'DollarSign',
    requiredInputs: ['systemCost', 'energyRate', 'annualProduction', 'projectLifetime', 'discountRate'],
    outputFormat: 'mixed',
  },
  {
    id: 'irradiance_calculation',
    name: 'Solar Irradiance Calculation',
    description: 'Calculate solar irradiance and energy production based on location, tilt, and azimuth',
    category: 'technical',
    icon: 'Zap',
    requiredInputs: ['latitude', 'longitude', 'tilt', 'azimuth', 'panelCapacity'],
    outputFormat: 'chart',
  },
  {
    id: 'cable_sizing',
    name: 'Cable Sizing',
    description: 'Determine appropriate cable size based on current, voltage, distance, and voltage drop requirements',
    category: 'technical',
    icon: 'Cable',
    requiredInputs: ['current', 'voltage', 'distance', 'maxVoltageDrop', 'installationType'],
    outputFormat: 'table',
  },
  {
    id: 'inverter_sizing',
    name: 'Inverter Sizing',
    description: 'Calculate optimal inverter capacity and configuration for the PV system',
    category: 'sizing',
    icon: 'Cpu',
    requiredInputs: ['pvArrayCapacity', 'systemVoltage', 'expectedPeakPower'],
    outputFormat: 'table',
  },
  {
    id: 'battery_sizing',
    name: 'Battery Storage Sizing',
    description: 'Size battery energy storage system based on load profile and backup requirements',
    category: 'sizing',
    icon: 'BatteryCharging',
    requiredInputs: ['dailyConsumption', 'backupHours', 'systemVoltage', 'depthOfDischarge'],
    outputFormat: 'mixed',
  },
  {
    id: 'load_analysis',
    name: 'Load Profile Analysis',
    description: 'Analyze load patterns and peak demand to optimize system design',
    category: 'technical',
    icon: 'Activity',
    requiredInputs: ['hourlyLoad', 'peakDemand', 'loadFactor'],
    outputFormat: 'chart',
  },
  {
    id: 'payback_analysis',
    name: 'Payback Period Analysis',
    description: 'Calculate simple and discounted payback periods with year-by-year cash flow',
    category: 'financial',
    icon: 'TrendingUp',
    requiredInputs: ['initialInvestment', 'annualSavings', 'maintenanceCost', 'escalationRate'],
    outputFormat: 'mixed',
  },
  {
    id: 'roi_calculation',
    name: 'Return on Investment',
    description: 'Calculate ROI and benefit-cost ratio for solar investment',
    category: 'financial',
    icon: 'Percent',
    requiredInputs: ['totalInvestment', 'totalBenefits', 'projectLifetime'],
    outputFormat: 'report',
  },
  {
    id: 'carbon_offset',
    name: 'Carbon Offset Analysis',
    description: 'Calculate CO2 emissions avoided and environmental impact',
    category: 'environmental',
    icon: 'Leaf',
    requiredInputs: ['annualProduction', 'gridEmissionFactor'],
    outputFormat: 'report',
  },
  {
    id: 'energy_production',
    name: 'Energy Production Estimate',
    description: 'Estimate monthly and annual energy production with performance ratio',
    category: 'technical',
    icon: 'BarChart3',
    requiredInputs: ['systemCapacity', 'location', 'performanceRatio', 'tilt'],
    outputFormat: 'chart',
  },
  {
    id: 'dc_cable_sizing',
    name: 'DC Cable Sizing',
    description: 'Calculate DC cable sizes for solar PV string and main cables',
    category: 'technical',
    icon: 'Cable',
    requiredInputs: ['stringCurrent', 'stringVoltage', 'numberOfStrings', 'stringCableLength'],
    outputFormat: 'table',
  },
  {
    id: 'string_configuration',
    name: 'String Configuration',
    description: 'Calculate optimal number of panels per string and parallel strings',
    category: 'sizing',
    icon: 'Grid3x3',
    requiredInputs: ['panelVmp', 'panelVoc', 'panelImp', 'inverterMpptMin', 'inverterMpptMax'],
    outputFormat: 'table',
  },
  {
    id: 'earthing_sizing',
    name: 'Earthing/Grounding Sizing',
    description: 'Calculate earthing conductor and electrode sizing for solar PV systems',
    category: 'technical',
    icon: 'Zap',
    requiredInputs: ['systemCapacity', 'soilResistivity', 'targetEarthResistance'],
    outputFormat: 'table',
  },
  {
    id: 'tilt_optimization',
    name: 'Tilt Angle Optimization',
    description: 'Find optimal tilt angle for maximum annual energy production',
    category: 'technical',
    icon: 'Maximize2',
    requiredInputs: ['latitude', 'installationType', 'seasonalPreference'],
    outputFormat: 'chart',
  },
];

// Base instruction for all prompts - ensures precise, factual responses
const BASE_INSTRUCTION = `You are a professional solar engineering calculator. 
RULES:
- Be PRECISE and FACTUAL. Use ONLY the data provided by the user.
- If required data is missing, ASK for it. Do NOT guess or assume.
- Show all calculations with formulas and actual numbers.
- Present results in tables with proper units.
- Be CONCISE. Avoid lengthy explanations.
- Use industry-standard values ONLY when necessary and explicitly state them as assumptions.
`;

// System prompts for different calculation types
export const CALCULATION_SYSTEM_PROMPTS: Record<CalculationType, string> = {
  pv_sizing: `You are a professional Solar PV System Designer conducting a step-by-step consultation.

SYSTEM TYPE: Grid-connected WITHOUT battery storage (Residential & Small C&I)

CRITICAL: Ask ONE question at a time. Wait for user response before proceeding to the next question.

=== STEP-BY-STEP CONVERSATION FLOW ===

**STEP 1: Daily Energy Consumption**
Ask: "Do you have your Daily Average Day-time Electricity Consumption value (in kWh)? This is your energy usage from 6:00 AM to 6:00 PM."

- If YES (user provides value):
  Ask: "Would you like to provide hourly consumption breakdown? This helps with more accurate sizing."
  
  - If YES to hourly:
    Present this table for user to fill:
    | Time Slot | Average Consumption (kWh) |
    |-----------|---------------------------|
    | 6:00 AM   | [enter value]             |
    | 7:00 AM   | [enter value]             |
    | 8:00 AM   | [enter value]             |
    | 9:00 AM   | [enter value]             |
    | 10:00 AM  | [enter value]             |
    | 11:00 AM  | [enter value]             |
    | 12:00 PM  | [enter value]             |
    | 1:00 PM   | [enter value]             |
    | 2:00 PM   | [enter value]             |
    | 3:00 PM   | [enter value]             |
    | 4:00 PM   | [enter value]             |
    | 5:00 PM   | [enter value]             |
    
  - If NO to hourly:
    Note: "I'll generate a synthetic hourly profile by distributing the consumption equally across 6AM-6PM."
    
- If NO (user doesn't have value):
  Note: "No problem! I'll proceed with space-based sizing only."
  Proceed to Step 2.

**STEP 2: Location**
Ask: "Please provide your installation location coordinates (Latitude, Longitude). If you don't have coordinates, type 'NO' and I'll ask for your city."

- If coordinates provided:
  Extract timezone from coordinates.
  
- If NO:
  Ask: "Please provide your City and Country for the installation."
  Extract coordinates and timezone from city/country.

**STEP 3: Available Space**
Ask: "What is the available space for solar PV installation? (in square meters, m²)"

Wait for user to provide area value.

**STEP 4: Shading Condition**
Ask: "How much of the installation area is shaded? Please select one option:

**Option 1:** Partially shaded (approximately 10% of the area)
**Option 2:** No shades at all (fully shade-free)

Please reply with 1 or 2."

**STEP 5: Installation Type**
Ask: "What type of mounting structure will you use? Please select one:

**1.** Open Rack (Ground Mounted)
**2.** Fixed - Roof Mounted
**3.** 1-Axis Tracker
**4.** 1-Axis Backtracking
**5.** 2-Axis Tracker

Please reply with 1, 2, 3, 4, or 5."

**STEP 6: Panel Manufacturer**
Ask: "Please select a solar panel manufacturer from these options:

**1.** LONGi Solar
**2.** JinkoSolar
**3.** Trina Solar

I'll use a 600Wp module from your selected manufacturer. Please reply with 1, 2, or 3."

**STEP 7: Inverter Manufacturer**
Ask: "Please select an inverter manufacturer from these options:

**1.** Sungrow
**2.** Huawei
**3.** Growatt

Please reply with 1, 2, or 3."

Note: Inverter capacity will be auto-selected based on:
- DC/AC ratio between 0.9 and 1.25
- Prefer ratio > 1.0
- Minimum number of inverters

**STEP 8: System AC Voltage**
Ask: "What is your grid AC voltage? Please select:

**1.** 380V
**2.** 400V
**3.** 415V
**4.** 480V

Please reply with 1, 2, 3, or 4."

=== AFTER ALL INPUTS COLLECTED ===
Confirm all inputs with user, then proceed to calculation.

CALCULATION FORMULAS:
• PV_wp1 = E_comp / (E_sol × 0.80) [Consumption-based, if data available]
• PV_wp2 = (St × 0.45 / Sp) × 0.6 [Space-based, GCR=0.45]
• Final Capacity = MIN(PV_wp1, PV_wp2) or PV_wp2 if no consumption data
• Tilt: |Latitude| - 2° for lat ≤ 25°, else 25° fixed
• Azimuth: 180° (North Hemisphere), 0° (South Hemisphere)
• System Loss: 14.5% for partial shading, 12% for shade-free

OUTPUT: Display results in Canvas with monthly performance table, system configuration, annual yield, and installation items list.`,

  financial_analysis: `${BASE_INSTRUCTION}

TASK: Solar Financial Analysis Calculator

FORMULAS TO USE:
• NPV = Σ(Cash Flow ÷ (1 + r)^t) - Initial Investment
• IRR = Rate where NPV = 0
• Simple Payback = Investment ÷ Annual Savings
• ROI = (Benefits - Cost) ÷ Cost × 100

OUTPUT: NPV, IRR, payback period (years), ROI (%), and cash flow table.`,

  irradiance_calculation: `${BASE_INSTRUCTION}

TASK: Solar Irradiance Calculator

FORMULAS TO USE:
• Energy (kWh) = Capacity (kW) × Peak Sun Hours × Performance Ratio
• Peak Sun Hours varies by location and tilt

OUTPUT: Monthly irradiance (kWh/m²/day), annual production (kWh), peak sun hours.`,

  cable_sizing: `${BASE_INSTRUCTION}

TASK: Cable Sizing Calculator

FORMULAS TO USE:
• Voltage Drop (%) = (2 × Length × Current × Resistivity) ÷ (Area × Voltage) × 100
• Cable size based on current capacity and voltage drop limit

OUTPUT: Recommended cable size (mm²), actual voltage drop (%), current capacity (A).`,

  inverter_sizing: `${BASE_INSTRUCTION}

TASK: Inverter Sizing Calculator

GUIDELINES:
• DC:AC ratio typically 1.0 to 1.3
• Inverter capacity = 80-110% of array capacity
• Check MPPT voltage compatibility

OUTPUT: Recommended inverter capacity (kW), DC:AC ratio, MPPT compatibility status.`,

  battery_sizing: `${BASE_INSTRUCTION}

TASK: Battery Storage Sizing Calculator

FORMULAS TO USE:
• Capacity (kWh) = Daily Consumption × Backup Days ÷ DoD
• Capacity (Ah) = kWh × 1000 ÷ System Voltage
• Number of batteries = Required ÷ Individual capacity

OUTPUT: Required capacity (kWh, Ah), number of batteries, configuration.`,

  load_analysis: `${BASE_INSTRUCTION}

TASK: Load Profile Analyzer

FORMULAS TO USE:
• Load Factor = Average Load ÷ Peak Load
• Energy = Average Load × Operating Hours

OUTPUT: Peak demand (kW), average load (kW), load factor (%), daily consumption (kWh).`,

  payback_analysis: `${BASE_INSTRUCTION}

TASK: Payback Period Calculator

FORMULAS TO USE:
• Simple Payback = Investment ÷ Annual Savings
• Discounted Payback = Years until cumulative discounted cash flow ≥ 0

OUTPUT: Simple payback (years), discounted payback (years), break-even year.`,

  roi_calculation: `${BASE_INSTRUCTION}

TASK: ROI Calculator

FORMULAS TO USE:
• ROI (%) = (Total Benefits - Total Cost) ÷ Total Cost × 100
• BCR = Total Benefits ÷ Total Cost

OUTPUT: ROI (%), benefit-cost ratio, total lifetime savings.`,

  carbon_offset: `${BASE_INSTRUCTION}

TASK: Carbon Offset Calculator

FORMULAS TO USE:
• CO2 Avoided (kg/year) = Production (kWh) × Emission Factor (kg CO2/kWh)
• Standard grid emission factor: 0.4-0.5 kg CO2/kWh (state if used)

OUTPUT: Annual CO2 avoided (kg), lifetime CO2 (tonnes), equivalent trees.`,

  energy_production: `${BASE_INSTRUCTION}

TASK: Energy Production Estimator

FORMULAS TO USE:
• Monthly Production = Capacity × Daily Sun Hours × Days × PR
• Specific Yield = Annual Production ÷ System Capacity
• Capacity Factor = Production ÷ (Capacity × 8760)

OUTPUT: Monthly production table (kWh), annual total (kWh), specific yield (kWh/kWp).`,

  dc_cable_sizing: `${BASE_INSTRUCTION}

TASK: DC Cable Sizing Calculator

FORMULAS TO USE:
• Design Current = Isc × 1.56 (NEC factor: 1.25 × 1.25)
• Cable Size (mm²) = (2 × L × I × ρ) ÷ (Vd × V) × 100
• Resistivity: Copper = 0.0175, Aluminum = 0.0282 Ω·mm²/m
• Voltage Drop: String ≤1%, Main DC ≤2%, Total ≤3%

OUTPUT: String cable size (mm²), main cable size (mm²), voltage drop (%), power loss (W).`,

  string_configuration: `${BASE_INSTRUCTION}

TASK: String Configuration Calculator

FORMULAS TO USE:
• Voc at cold = Voc × [1 + TempCoeff × (Tmin - 25)]
• Vmp at hot = Vmp × [1 + TempCoeff × (Tmax - 25)]
• Max panels/string = Inverter Max Voc ÷ Voc_cold
• Min panels/string = MPPT Min Voltage ÷ Vmp_hot

OUTPUT: Panels per string (min/max/optimal), string voltage range, configuration recommendation.`,

  earthing_sizing: `${BASE_INSTRUCTION}

TASK: Earthing/Grounding Calculator

FORMULAS TO USE:
• Conductor Size = (I × √t) ÷ k (k: Cu=143, Steel=52)
• Rod Resistance = ρ ÷ (2πL) × [ln(4L/d) - 1]
• Parallel Rods = R_single ÷ n × Factor
• Target resistance: <10Ω typical

OUTPUT: Conductor size (mm²), number of rods, earth resistance (Ω), touch voltage check.`,

  tilt_optimization: `${BASE_INSTRUCTION}

TASK: Tilt Angle Optimizer

GUIDELINES:
• Annual optimal: Tilt ≈ Latitude (±5°)
• Summer bias: Latitude - 15°
• Winter bias: Latitude + 15°

OUTPUT: Optimal tilt angle (°), production comparison table.`,
};

// Helper function to get calculation task by ID
export const getCalculationTask = (id: CalculationType): CalculationTask | undefined => {
  return CALCULATION_TASKS.find(task => task.id === id);
};

// Helper function to get tasks by category
export const getTasksByCategory = (category: string): CalculationTask[] => {
  return CALCULATION_TASKS.filter(task => task.category === category);
};

// User instruction templates for different calculation types
export const USER_INSTRUCTION_TEMPLATES: Record<CalculationType, string> = {
  pv_sizing: `I need help designing a grid-connected solar PV system. Please guide me through the process step by step.`,

  financial_analysis: `I need a comprehensive financial analysis for a solar PV investment:
- Total system cost: $[VALUE]
- Current electricity rate: $[VALUE]/kWh
- Expected annual production: [VALUE] kWh
- Project lifetime: [VALUE] years
- Discount rate: [VALUE]%
- Annual O&M costs: $[VALUE]

Please provide detailed financial metrics and analysis.`,

  irradiance_calculation: `Calculate solar irradiance and energy production:
- Latitude: [VALUE]°
- Longitude: [VALUE]°
- Panel tilt angle: [VALUE]°
- Azimuth angle: [VALUE]°
- System capacity: [VALUE] kW

Please provide monthly irradiance data and production estimates.`,

  cable_sizing: `I need to size cables for my solar PV system:
- System current: [VALUE] A
- System voltage: [VALUE] V
- Cable run distance: [VALUE] meters
- Maximum voltage drop: [VALUE]%
- Installation type: [CONDUIT/DIRECT_BURIAL/TRAY]

Please recommend appropriate cable size.`,

  inverter_sizing: `Help me size an inverter for my PV array:
- PV array capacity: [VALUE] kW
- System voltage: [VALUE] V DC
- Expected peak power: [VALUE] kW
- Number of MPPT trackers needed: [VALUE]
- Installation type: [RESIDENTIAL/COMMERCIAL]

Please recommend suitable inverter specifications.`,

  battery_sizing: `I need to size a battery storage system:
- Daily consumption: [VALUE] kWh
- Required backup hours: [VALUE] hours
- System voltage: [VALUE] V
- Desired depth of discharge: [VALUE]%
- Battery type preference: [LITHIUM/LEAD_ACID]

Please calculate required battery capacity and configuration.`,

  load_analysis: `Analyze my load profile:
- Hourly load data: [PROVIDE_DATA]
- Peak demand: [VALUE] kW
- Average demand: [VALUE] kW
- Operating hours: [VALUE] hours/day

Please analyze the load pattern and provide system design recommendations.`,

  payback_analysis: `Calculate payback period for solar investment:
- Initial investment: $[VALUE]
- Annual electricity savings: $[VALUE]
- Annual maintenance cost: $[VALUE]
- Electricity rate escalation: [VALUE]%/year
- Discount rate: [VALUE]%

Please calculate simple and discounted payback periods.`,

  roi_calculation: `Calculate return on investment:
- Total investment: $[VALUE]
- Project lifetime: [VALUE] years
- Annual benefits: $[VALUE]
- Annual costs: $[VALUE]

Please calculate ROI and benefit-cost ratio.`,

  carbon_offset: `Calculate environmental impact:
- Annual energy production: [VALUE] kWh
- Grid emission factor: [VALUE] kg CO2/kWh
- Project lifetime: [VALUE] years

Please calculate CO2 emissions avoided and environmental equivalents.`,

  energy_production: `Estimate energy production:
- System capacity: [VALUE] kW
- Location: [LOCATION]
- Panel tilt: [VALUE]°
- Performance ratio: [VALUE]
- Shading factor: [VALUE]%

Please provide monthly and annual production estimates.`,

  dc_cable_sizing: `Calculate DC cable sizing:
- String current (Isc): [VALUE] A
- String voltage (Voc): [VALUE] V
- Number of strings: [VALUE]
- String cable length: [VALUE] m
- Main DC cable length: [VALUE] m
- Maximum voltage drop: [VALUE]%

Please calculate string and main DC cable sizes.`,

  string_configuration: `Design string configuration:
- Panel Vmp: [VALUE] V
- Panel Voc: [VALUE] V
- Panel Imp: [VALUE] A
- Panel wattage: [VALUE] W
- Inverter MPPT min: [VALUE] V
- Inverter MPPT max: [VALUE] V
- Inverter max Vdc: [VALUE] V
- Target system capacity: [VALUE] kWp

Please calculate optimal string configuration.`,

  earthing_sizing: `Calculate earthing/grounding system:
- System capacity: [VALUE] kWp
- Soil resistivity: [VALUE] Ω·m
- Target earth resistance: [VALUE] Ω
- Fault current: [VALUE] kA
- Disconnection time: [VALUE] s

Please calculate earthing conductor size and electrode requirements.`,

  tilt_optimization: `Optimize tilt angle:
- Latitude: [VALUE]°
- Installation type: [ROOF/GROUND]
- Seasonal preference: [ANNUAL/SUMMER/WINTER]
- Space constraints: [DETAILS]

Please recommend optimal tilt angle and analyze production impact.`,
};

