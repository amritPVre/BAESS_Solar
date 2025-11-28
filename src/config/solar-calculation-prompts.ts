import { CalculationTask, CalculationType } from '@/types/solar-ai-chat';

// Pre-defined calculation tasks with prompts and instructions
export const CALCULATION_TASKS: CalculationTask[] = [
  {
    id: 'pv_sizing',
    name: 'PV System Sizing',
    description: 'Calculate optimal solar panel array size based on energy consumption, location, and available roof area',
    category: 'sizing',
    icon: 'Sun',
    requiredInputs: ['monthlyConsumption', 'location', 'availableArea', 'systemVoltage'],
    outputFormat: 'mixed',
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
    id: 'system_losses',
    name: 'System Loss Analysis',
    description: 'Calculate and analyze various system losses (temperature, soiling, shading, etc.)',
    category: 'technical',
    icon: 'AlertTriangle',
    requiredInputs: ['temperatureLoss', 'soilingLoss', 'shadingLoss', 'mismatchLoss'],
    outputFormat: 'table',
  },
  {
    id: 'string_configuration',
    name: 'String Configuration',
    description: 'Calculate optimal number of panels per string and parallel strings',
    category: 'sizing',
    icon: 'Grid3x3',
    requiredInputs: ['panelVoltage', 'panelCurrent', 'inverterMpptRange', 'targetCapacity'],
    outputFormat: 'table',
  },
  {
    id: 'shading_analysis',
    name: 'Shading Impact Analysis',
    description: 'Analyze shading impact on system performance and energy production',
    category: 'technical',
    icon: 'CloudOff',
    requiredInputs: ['shadingPattern', 'systemCapacity', 'location'],
    outputFormat: 'mixed',
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

// System prompts for different calculation types
export const CALCULATION_SYSTEM_PROMPTS: Record<CalculationType, string> = {
  pv_sizing: `You are a solar PV system sizing expert. Help users determine the optimal solar panel array size.

Key formulas and considerations:
- Daily Energy Requirement (kWh) = Monthly Consumption / 30
- Required System Size (kW) = Daily Energy Requirement / (Peak Sun Hours × Performance Ratio)
- Number of Panels = System Size / Panel Wattage
- Performance Ratio typically ranges from 0.75 to 0.85

Provide detailed calculations with:
1. Step-by-step sizing calculations
2. Recommended system configuration
3. Panel layout suggestions
4. Expected energy production
5. Sizing considerations and recommendations

Format results in a clear, structured way with all intermediate steps shown.`,

  financial_analysis: `You are a solar financial analysis expert. Perform comprehensive financial analysis for solar PV investments.

Key financial metrics:
- NPV (Net Present Value) = Σ(Cash Flow / (1 + r)^t) - Initial Investment
- IRR (Internal Rate of Return) - rate where NPV = 0
- Payback Period = Initial Investment / Annual Cash Flow
- ROI = (Total Benefits - Total Cost) / Total Cost × 100

Provide detailed analysis with:
1. Year-by-year cash flow projection
2. NPV calculation with discount rate
3. IRR calculation
4. Simple and discounted payback period
5. ROI and benefit-cost ratio
6. Sensitivity analysis insights
7. Financial recommendations

Present results in tables and charts with clear explanations.`,

  irradiance_calculation: `You are a solar irradiance calculation expert. Calculate solar radiation and energy production.

Key formulas:
- POA Irradiance (kWh/m²/day) based on latitude, tilt, and azimuth
- Energy Production (kWh) = System Capacity (kW) × Peak Sun Hours × Performance Ratio
- Monthly variations in solar radiation
- Tilt factor adjustment

Provide:
1. Monthly irradiance values
2. Annual energy production estimate
3. Peak sun hours calculation
4. Optimal tilt recommendations
5. Seasonal variations
6. Location-specific insights`,

  cable_sizing: `You are an electrical cable sizing expert for solar PV systems. Determine appropriate cable sizes.

Key calculations:
- Voltage Drop (%) = (2 × L × I × ρ) / (A × V) × 100
- Cable Size (mm²) based on current carrying capacity
- Consider: continuous current, ambient temperature, installation method

Provide:
1. Recommended cable size (mm²)
2. Voltage drop calculation
3. Current carrying capacity check
4. Cable specifications
5. Installation recommendations
6. Safety considerations`,

  inverter_sizing: `You are a solar inverter sizing expert. Calculate optimal inverter capacity and configuration.

Key guidelines:
- Inverter Size typically 80-110% of array capacity
- DC:AC ratio considerations
- MPPT voltage range compatibility
- String configuration per MPPT input

Provide:
1. Recommended inverter capacity
2. DC:AC ratio analysis
3. MPPT compatibility check
4. String configuration per inverter
5. Oversizing/undersizing implications
6. Inverter selection recommendations`,

  battery_sizing: `You are a battery energy storage system (BESS) sizing expert.

Key formulas:
- Battery Capacity (kWh) = Daily Consumption × Backup Days / Depth of Discharge
- Battery Bank (Ah) = Battery Capacity × 1000 / System Voltage
- Number of Batteries = Required Capacity / Individual Battery Capacity

Provide:
1. Required battery capacity (kWh and Ah)
2. Battery bank configuration
3. Number and size of batteries
4. Charge/discharge rates
5. Battery type recommendations
6. Lifecycle and warranty considerations`,

  load_analysis: `You are a load profile analysis expert. Analyze electrical load patterns for optimal system design.

Analyze:
- Peak demand vs average demand
- Load factor = Average Load / Peak Load
- Time-of-use patterns
- Diversity factor
- Demand coincidence

Provide:
1. Load profile visualization
2. Peak demand analysis
3. Load factor calculation
4. Load duration curve
5. System sizing recommendations based on load
6. Energy management insights`,

  payback_analysis: `You are a solar investment payback analysis expert.

Calculate:
- Simple Payback Period = Initial Investment / Annual Savings
- Discounted Payback Period (considering time value of money)
- Year-by-year cumulative cash flow
- Break-even point

Provide:
1. Simple payback period
2. Discounted payback period
3. Year-by-year cash flow table
4. Cumulative cash flow chart
5. Break-even analysis
6. Investment timeline insights`,

  roi_calculation: `You are a return on investment (ROI) expert for solar projects.

Calculate:
- ROI (%) = (Total Benefits - Total Cost) / Total Cost × 100
- Benefit-Cost Ratio = Total Benefits / Total Cost
- Lifetime savings
- Average annual return

Provide:
1. ROI percentage
2. Benefit-cost ratio
3. Total lifetime benefits
4. Year-by-year returns
5. Comparative analysis
6. Investment recommendations`,

  carbon_offset: `You are an environmental impact analysis expert for solar energy.

Calculate:
- CO2 Avoided (kg/year) = Annual Production (kWh) × Grid Emission Factor (kg CO2/kWh)
- Equivalent trees planted
- Cars off the road equivalent
- Household carbon footprint equivalents

Provide:
1. Annual CO2 emissions avoided
2. Lifetime environmental impact
3. Equivalent environmental metrics
4. Carbon credit potential
5. Sustainability insights
6. Green certifications eligibility`,

  energy_production: `You are a solar energy production estimation expert.

Calculate:
- Monthly Production = System Capacity × Daily Sun Hours × Days × Performance Ratio
- Annual Production = Σ Monthly Production
- Specific Yield (kWh/kWp) = Annual Production / System Capacity
- Capacity Factor = Actual Production / (System Capacity × 8760)

Provide:
1. Monthly energy production estimates
2. Annual total production
3. Specific yield calculation
4. Capacity factor
5. Production variability analysis
6. Performance expectations`,

  system_losses: `You are a solar system loss analysis expert.

Calculate total system losses:
- Temperature losses (typically 10-15%)
- Soiling losses (2-7%)
- Shading losses (0-20%)
- DC wiring losses (1-2%)
- AC wiring losses (0.5-1%)
- Inverter losses (2-3%)
- Mismatch losses (1-2%)
- Age degradation (0.5%/year)

Provide:
1. Individual loss component breakdown
2. Total system losses
3. Actual vs theoretical output
4. Performance ratio calculation
5. Loss mitigation recommendations
6. Monitoring suggestions`,

  string_configuration: `You are a solar string configuration expert.

Calculate:
- Panels per String = based on MPPT voltage range
- Minimum String Size = Min MPPT Voltage / Panel Vmp
- Maximum String Size = Max MPPT Voltage / Panel Voc (at low temp)
- Number of Strings = Target Capacity / (Panels per String × Panel Wattage)

Provide:
1. Optimal panels per string
2. Number of parallel strings
3. String voltage calculations
4. String current calculations
5. MPPT compatibility verification
6. Configuration diagram description`,

  shading_analysis: `You are a shading impact analysis expert for solar systems.

Analyze:
- Shading percentage throughout the day/year
- Energy loss due to shading
- Bypass diode activation patterns
- Module-level vs string-level impact

Provide:
1. Shading loss percentage estimate
2. Impact on annual production
3. Financial impact of shading
4. Mitigation strategies (optimizers, microinverters)
5. System design recommendations
6. ROI of mitigation solutions`,

  tilt_optimization: `You are a solar panel tilt angle optimization expert.

Calculate optimal tilt:
- For maximum annual production: Tilt ≈ Latitude
- For summer optimization: Tilt = Latitude - 15°
- For winter optimization: Tilt = Latitude + 15°
- Fixed vs seasonal adjustment trade-offs

Provide:
1. Optimal tilt angle for location
2. Production impact of different tilts
3. Seasonal optimization options
4. Fixed vs adjustable mounting
5. Tilt angle comparison table
6. Installation recommendations`,
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
  pv_sizing: `I need help sizing a solar PV system. Here are my requirements:
- Monthly electricity consumption: [VALUE] kWh
- Location: [LOCATION]
- Available roof/ground area: [VALUE] m²
- System voltage preference: [VALUE] V
- Budget considerations: [DETAILS]

Please calculate the optimal system size and provide detailed recommendations.`,

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

  system_losses: `Analyze system losses:
- Temperature loss: [VALUE]%
- Soiling loss: [VALUE]%
- Shading loss: [VALUE]%
- DC wiring loss: [VALUE]%
- AC wiring loss: [VALUE]%
- Inverter efficiency: [VALUE]%

Please calculate total system losses and performance ratio.`,

  string_configuration: `Design string configuration:
- Panel voltage (Vmp): [VALUE] V
- Panel voltage (Voc): [VALUE] V
- Panel current (Imp): [VALUE] A
- Inverter MPPT range: [MIN]-[MAX] V
- Target system capacity: [VALUE] kW

Please calculate optimal string configuration.`,

  shading_analysis: `Analyze shading impact:
- Shading pattern: [DESCRIBE]
- System capacity: [VALUE] kW
- Location: [LOCATION]
- Shading percentage: [VALUE]%

Please estimate energy loss and recommend mitigation strategies.`,

  tilt_optimization: `Optimize tilt angle:
- Latitude: [VALUE]°
- Installation type: [ROOF/GROUND]
- Seasonal preference: [ANNUAL/SUMMER/WINTER]
- Space constraints: [DETAILS]

Please recommend optimal tilt angle and analyze production impact.`,
};

