# AI-Powered Solar PV Feasibility Study Report - Prompt Design

## Overview
This document outlines the comprehensive prompt structure for generating a professional, white-label techno-commercial feasibility study report for solar PV projects using LLM (Gemini 2.5 Flash).

---

## PROMPT TEMPLATE

### System Role
```
You are an expert solar energy consultant and technical writer with 15+ years of experience in preparing bankable feasibility studies for solar PV projects. You specialize in creating comprehensive, professional reports that meet the standards of international financial institutions, development banks, and Big-4 consulting firms (Deloitte, KPMG, PwC, EY).

Your reports are characterized by:
- Clear, professional business language
- Data-driven analysis with proper citations
- Balanced perspective (opportunities AND challenges)
- Actionable recommendations
- Compliance with international standards (IEC, IEEE, IFC)
- Financial rigor and transparency
```

---

## INPUT DATA STRUCTURE

**IMPORTANT: All data is passed directly from existing app state - NO TRANSFORMATION NEEDED**

The prompt will receive the following **exact data structures** already in use throughout the app:

### 1. FORM-COLLECTED DATA (New - from AI Report tab)
```typescript
// User-provided report customization data
interface ReportFormData {
  reportTitle: string;
  reportDate: Date;
  userType: 'EPC_CONTRACTOR' | 'PROJECT_OWNER';
  
  companyInfo: {
    companyLogo?: string; // Base64 or URL
    companyName: string;
    companyAddress: string;
    companyEmail: string;
    companyPhone: string;
    companyWebsite?: string;
    authorName: string;
    authorTitle: string;
  };
  
  clientInfo?: { // Only if EPC_CONTRACTOR
    clientName: string;
    clientTitle: string;
    clientCompany: string;
    clientAddress: string;
    clientEmail: string;
    clientPhone: string;
  };
  
  projectInfo: {
    projectName: string;
    projectObjective: string;
    siteAddress: string;
    startDate: Date;
    commissioningDate: Date;
  };
  
  customization: {
    executiveSummaryFocus: string[]; // ['cost_savings', 'roi', etc.]
    includeDetailedTechnicalSpecs: boolean;
    includeRiskAnalysis: boolean;
    includeSensitivityAnalysis: boolean;
    includeMonthlyBreakdown: boolean;
    confidentialityLevel: string;
  };
}
```

### 2. BOQ PARAMETERS (Existing - from useBOQParameterExtraction)
```typescript
// EXACTLY as returned from boqParameterManager.getParameters()
// This is the SAME data structure used for AI BOQ generation
const boqParameters: BOQParameters = {
  // All parameters extracted from:
  // - DC inputs
  // - Lightning protection
  // - AC configuration
  // - LV/HV system specifics
  // ...complete object as-is
};
```

### 3. PVWATTS RESULTS (Existing - from ProductionResults component)
```typescript
// EXACTLY as received from PVWatts API via results prop
const solarResults: SolarCalculationResult = {
  energy: {
    monthly: [ 
      { Month: "January", "Monthly Energy Production (kWh)": number },
      // ... 12 months
    ],
    hourly?: number[]; // 8760 values
    hourlyDC?: number[];
    metrics: {
      max_daily: number;
      min_daily: number;
      total_yearly: number;
      max_hourly?: number;
      min_hourly?: number;
    }
  },
  irradiation: {
    monthly: [
      { Month: "January", "Monthly Solar Irradiation (kWh/m²)": number },
      // ... 12 months
    ],
    annual: number;
    metrics: {
      max_daily: number;
      min_daily: number;
      avg_daily: number;
    }
  },
  yearlyProduction: number[]; // 25 years with degradation
  system: {
    capacity: number;
    module_type: number;
    array_type: number;
    tilt: number;
    azimuth: number;
    losses: number;
    dc_ac_ratio: number;
    inv_eff: number;
    gcr?: number;
  },
  location: {
    latitude: number;
    longitude: number;
    lat?: number;
    lng?: number;
  },
  timezone?: string;
  country?: string;
  city?: string;
};
```

### 4. SYSTEM PARAMETERS (Existing - from systemParams prop)
```typescript
// EXACTLY as passed to ProductionResults component
const systemParams = {
  capacity: number;
  tilt: number;
  azimuth: number;
  moduleEfficiency: number;
  losses: number;
  arrayType: number;
  latitude: number;
  longitude: number;
  timezone: string;
  dcAcRatio: number;
  inverterCount: number;
};
```

### 5. SELECTED COMPONENTS (Existing - direct from state)
```typescript
// selectedPanel - EXACTLY as stored in component state
const selectedPanel = {
  id: string;
  manufacturer: string;
  model: string;
  nominal_power_stc_w: number;
  efficiency: number;
  length_mm: number;
  width_mm: number;
  bifacial: boolean;
  temp_coeff_pmax_percent_per_c: number;
  // ... all other panel properties
};

// selectedInverter - EXACTLY as stored in component state
const selectedInverter = {
  id: string;
  manufacturer: string;
  model: string;
  nominal_ac_power_kw: number;
  maximum_ac_power_kw: number;
  topology: string;
  total_string_inputs: number;
  total_mppt: number;
  // ... all other inverter properties
};
```

### 6. POLYGON CONFIGURATIONS (Existing - from AreaCalculator)
```typescript
// polygonConfigs - EXACTLY as stored in state
const polygonConfigs = [
  {
    id: number;
    moduleCount: number;
    capacityKw: number;
    area: number;
    azimuth: number;
    tilt: number;
    structureType: string;
    tableLayoutRows?: number;
    // ... all polygon data
  }
];
```

### 7. AC CONFIGURATION (Existing - from AC Config tab)
```typescript
// acConfiguration - EXACTLY as stored in state
const acConfiguration = {
  connectionType: 'LV' | 'HV';
  pocVoltage: number;
  inverterType: 'string' | 'central';
  useIDT: boolean;
  usePowerTransformer: boolean;
  idtConfig?: {
    quantity: number;
    capacity: number;
    primaryVoltage: number;
    secondaryVoltage: number;
    // ... transformer data
  };
  powerTransformerConfig?: {
    // ... PT data if applicable
  };
  selectedBreakers: Array<{
    // ... breaker data
  }>;
  selectedCables: Array<{
    // ... cable data
  }>;
  // ... complete AC config
};
```

### 8. DETAILED LOSSES (Existing - from detailedLosses prop)
```typescript
// detailedLosses - EXACTLY as calculated and stored
const detailedLosses = {
  soiling: number;
  shading: number;
  snow: number;
  mismatch: number;
  wiring: number;
  connections: number;
  lid: number;
  nameplate: number;
  age: number;
  availability: number;
  // ... all loss categories
};
```

### 9. CONSOLIDATED BOQ (Existing - from DetailedBOQGenerator)
```typescript
// mergedBOQ - EXACTLY as generated in AI BOQ tab
const consolidatedBOQ = [
  {
    slNo: number;
    description: string;
    specifications: string;
    unit: string;
    qty: number | string;
    unitPrice?: number;
    totalPrice?: number;
    confidence?: string;
    priceSource?: string;
    category?: string;
    source: 'structure' | 'dc' | 'ac';
  }
  // ... all BOQ items
];

// Cost summary
const boqCostSummary = {
  totalEquipmentCost: number;
  totalDevelopmentCost: number;
  totalProjectCost: number;
  additionalCosts: {
    engineeringDesign: { enabled: boolean; percent: number; amount: number };
    permitsFees: { enabled: boolean; percent: number; amount: number };
    // ... other costs
  };
};
```

### 10. FINANCIAL PARAMETERS (Existing - from FinancialAnalysis component)
```typescript
// financialParams - EXACTLY as input by user in Financial Inputs
const financialParams = {
  omExpensesPercent: number;
  electricityRate: number;
  omEscalationRate: number;
  omEscalationFrequency: number;
  tariffEscalationRate: number;
  tariffEscalationFrequency: number;
  annualDegradation: number;
  discountRate: number;
  governmentSubsidy: number;
  incomeTaxRate: number;
};
```

### 11. FINANCIAL RESULTS (Existing - from financialCalculator.calculate_metrics)
```typescript
// financialResults - EXACTLY as returned from financial calculator
const financialResults = {
  npv: number;
  irr: number;
  roi: number;
  payback_period: number;
  lcoe?: number;
  yearly_details: Array<{
    year: number;
    energy_output: number;
    revenue: number;
    om_cost: number;
    net_cash_flow: number;
    cumulative_cash_flow: number;
    discount_factor: number;
    discounted_cash_flow: number;
    gross_profit: number;
    tax: number;
  }>;
  cash_flows: number[];
  system_type: string;
  summary: {
    total_energy_25yr: number;
    total_revenue_25yr: number;
    total_om_cost_25yr: number;
    net_revenue_25yr: number;
    revenue_type: string;
  };
};
```

---

## DATA COLLECTION CODE

```typescript
// This function collects ALL data for the feasibility report prompt
// NO transformation - just pass existing objects directly
const collectFeasibilityReportData = () => {
  return {
    // 1. Report Form Data (new)
    reportForm: reportFormData, // from AI Report tab form
    
    // 2. BOQ Parameters (existing - same as AI BOQ)
    boqParameters: boqParameterManager.getParameters(), // DIRECT
    
    // 3. PVWatts Results (existing)
    solarResults: results, // DIRECT from Results tab
    
    // 4. System Parameters (existing)
    systemParams: systemParams, // DIRECT
    
    // 5. Components (existing)
    selectedPanel: selectedPanel, // DIRECT
    selectedInverter: selectedInverter, // DIRECT
    
    // 6. Polygon Configs (existing)
    polygonConfigs: polygonConfigs, // DIRECT
    
    // 7. AC Configuration (existing)
    acConfiguration: acConfiguration, // DIRECT
    
    // 8. Detailed Losses (existing)
    detailedLosses: detailedLosses, // DIRECT
    
    // 9. Consolidated BOQ (existing)
    consolidatedBOQ: mergedBOQ, // DIRECT from AI BOQ tab
    boqCostSummary: {
      totalEquipmentCost,
      totalDevelopmentCost,
      totalProjectCost,
      additionalCosts
    },
    
    // 10. Financial Parameters (existing)
    financialParams: financialParams, // DIRECT from Financial Inputs
    
    // 11. Financial Results (existing)
    financialResults: financialResults, // DIRECT from Financial Results
    
    // 12. Location Data (existing)
    location: {
      address: locationAddress,
      latitude: latitude,
      longitude: longitude,
      timezone: timezone,
      elevation: elevation,
      country: country,
      state: state
    },
    
    // 13. Additional Metadata
    metadata: {
      annualEnergyYear1: annualEnergyYear1, // from state
      totalStringCount: totalStringCount, // from state
      manualInverterCount: manualInverterCount, // from state
      capacity: capacity, // from state
      isCentralInverter: isCentralInverter // from state
    }
  };
};
```

---

## OUTPUT REQUIREMENTS

Generate a comprehensive feasibility study report with the following structure:

### **EXECUTIVE SUMMARY** (2-3 pages)
- Project overview and objectives
- Key technical highlights
- Financial viability snapshot (IRR, NPV, Payback)
- Investment recommendation with confidence level
- Critical success factors and risks

### **1. INTRODUCTION**
- 1.1 Background and Context
- 1.2 Project Objectives
- 1.3 Scope of Study
- 1.4 Methodology and Standards
- 1.5 Report Structure

### **2. PROJECT DESCRIPTION**
- 2.1 Site Location and Access
- 2.2 Project Capacity and Configuration
- 2.3 Technology Selection Rationale
- 2.4 Project Timeline and Milestones
- 2.5 Stakeholders and Organization

### **3. SOLAR RESOURCE ASSESSMENT**
- 3.1 Meteorological Data Source and Reliability
- 3.2 Global Horizontal Irradiation (GHI) Analysis
- 3.3 Plane of Array (POA) Irradiation
- 3.4 Temperature Profile and Impact
- 3.5 Seasonal Variations and Trends
- 3.6 Long-term Solar Resource Certainty (P50/P90 if applicable)

### **4. TECHNICAL DESIGN**
- 4.1 System Architecture Overview
- 4.2 PV Module Selection and Specifications
  - Technology comparison and selection criteria
  - Performance characteristics
  - Quality certifications and warranties
- 4.3 Inverter Selection and Specifications
  - Sizing rationale (DC/AC ratio)
  - Efficiency profile
  - Grid compatibility
- 4.4 Electrical Design
  - String configuration
  - DC cabling and protection
  - AC collection system
  - Grid interconnection
- 4.5 Structural and Mounting System
  - Foundation design
  - Wind and snow load considerations
  - Material specifications
- 4.6 Balance of System (BOS)
  - Transformers and switchgear
  - Monitoring and control systems
  - Safety and protection equipment

### **5. ENERGY YIELD ANALYSIS**
- 5.1 Simulation Methodology (PVWatts/PVsyst)
- 5.2 Annual Energy Production Forecast
  - Year 1 production
  - 25-year production with degradation
- 5.3 Monthly Energy Generation Profile
- 5.4 Performance Ratio Analysis
- 5.5 Loss Analysis and Mitigation Strategies
- 5.6 Energy Yield Uncertainty and Confidence Levels

### **6. FINANCIAL ANALYSIS**
- 6.1 Capital Expenditure (CAPEX) Breakdown
  - Equipment costs
  - Installation and commissioning
  - Soft costs (permits, insurance, contingency)
- 6.2 Operating Expenditure (OPEX) Forecast
  - O&M costs
  - Insurance and security
  - Land lease (if applicable)
  - Management and administration
- 6.3 Revenue Model
  - Energy pricing assumptions
  - Escalation rates
  - Incentives and subsidies
- 6.4 Financial Metrics
  - Internal Rate of Return (IRR) - interpretation and benchmarking
  - Net Present Value (NPV) - significance for investment decision
  - Levelized Cost of Energy (LCOE) - comparison with grid tariff
  - Payback periods - simple and discounted
  - Return on Investment (ROI)
- 6.5 25-Year Cash Flow Projection
  - Annual revenue, costs, and net cash flow
  - Cumulative cash flow
  - Debt service coverage ratio (if applicable)
- 6.6 Sensitivity Analysis
  - Impact of electricity tariff variations
  - Impact of CAPEX variations
  - Impact of O&M cost variations
  - Impact of energy yield variations
  - Impact of degradation rate variations
- 6.7 Scenario Analysis
  - Base case
  - Optimistic case
  - Conservative case

### **7. REGULATORY AND PERMITTING**
- 7.1 Regulatory Framework
- 7.2 Grid Connection Requirements
- 7.3 Permits and Approvals Required
- 7.4 Compliance with Standards
- 7.5 Environmental and Social Considerations

### **8. RISK ANALYSIS**
- 8.1 Technical Risks
  - Equipment performance
  - Technology obsolescence
  - Grid stability
- 8.2 Financial Risks
  - Tariff volatility
  - Cost escalation
  - Currency fluctuations
- 8.3 Operational Risks
  - O&M reliability
  - Security and vandalism
  - Natural disasters
- 8.4 Market and Regulatory Risks
  - Policy changes
  - Subsidy withdrawal
  - Grid curtailment
- 8.5 Risk Mitigation Strategies
- 8.6 Risk Matrix and Prioritization

### **9. IMPLEMENTATION PLAN**
- 9.1 Project Phases and Timeline
  - Design and engineering
  - Procurement
  - Construction
  - Commissioning
- 9.2 Procurement Strategy
- 9.3 Quality Assurance and Testing
- 9.4 Health, Safety, and Environment (HSE) Plan
- 9.5 Commissioning and Handover

### **10. CONCLUSIONS AND RECOMMENDATIONS**
- 10.1 Summary of Key Findings
- 10.2 Project Viability Assessment
  - Go/No-Go recommendation with detailed justification
  - Investment attractiveness rating
- 10.3 Critical Success Factors
- 10.4 Next Steps and Action Items
- 10.5 Recommendations for Further Study (if any)

### **APPENDICES**
- A. Detailed Bill of Quantities (BOQ)
- B. Monthly Energy Production and Meteorological Data
- C. Equipment Datasheets and Certifications
- D. Financial Calculation Worksheets
- E. Sensitivity Analysis Charts
- F. Site Maps and Layout Drawings
- G. Acronyms and Definitions
- H. References and Data Sources

---

## WRITING STYLE GUIDELINES

### Tone and Language
- **Professional and Authoritative**: Use confident, expert language while remaining objective
- **Clear and Concise**: Avoid jargon where possible; explain technical terms when necessary
- **Data-Driven**: Support all claims with data, calculations, or references
- **Balanced**: Present both opportunities and challenges fairly
- **Action-Oriented**: Provide clear recommendations and next steps

### Formatting Instructions
- Use proper headings hierarchy (H1, H2, H3)
- Include tables for comparative data
- Use bullet points for lists
- Include callout boxes for key findings
- Cite all data sources
- Use metric units (kW, kWh, kWp) consistently
- Format currency as USD with thousands separators

### Key Phrases to Use
- "Based on comprehensive analysis..."
- "Industry best practices suggest..."
- "Conservative estimates indicate..."
- "In accordance with IEC/IEEE standards..."
- "Benchmarking against similar projects..."
- "Subject to final due diligence..."
- "Within acceptable risk parameters..."

### Key Phrases to Avoid
- "Guaranteed returns..."
- "Zero risk..."
- "Absolutely certain..."
- "Always" or "Never"
- Overly promotional language
- Unsubstantiated claims

---

## SPECIFIC INSTRUCTIONS FOR AI

1. **Executive Summary**: 
   - Must be self-contained and readable independently
   - Include specific numbers (capacity, cost, IRR, payback)
   - Provide clear go/no-go recommendation with confidence level (High/Medium/Low)

2. **Financial Analysis**:
   - Interpret metrics, don't just report numbers
   - Compare against industry benchmarks (typical solar IRR: 12-18%, payback: 5-8 years)
   - Explain what each metric means for the investor/client

3. **Risk Analysis**:
   - Be realistic about risks, don't downplay them
   - Quantify risks where possible (e.g., "10% reduction in tariff would decrease IRR by X%")
   - Provide actionable mitigation strategies

4. **Energy Yield**:
   - Explain methodology and data sources clearly
   - Acknowledge uncertainties and provide P50/P90 ranges if data permits
   - Compare simulated vs. actual performance of similar systems

5. **Technical Design**:
   - Justify all major equipment selections
   - Compare alternatives considered
   - Explain trade-offs (e.g., higher efficiency vs. cost)

6. **Recommendations Section**:
   - Be decisive and clear
   - Provide specific, actionable next steps
   - Include timeline for decision-making

7. **Data Presentation**:
   - Use tables for monthly data
   - Describe trends in text (e.g., "Peak production in June-August, lowest in December-January")
   - Highlight any anomalies or concerns

8. **Compliance**:
   - Reference relevant standards (IEC 61724, IEC 61853, IEEE 1547)
   - Mention compliance with local grid codes
   - Discuss warranty and quality certifications

---

## QUALITY CHECKS

Before finalizing the report, ensure:
- [ ] All financial calculations are consistent and traceable
- [ ] Units are consistent throughout (kW, kWh, USD)
- [ ] No contradictory statements
- [ ] All tables and charts are referenced in text
- [ ] Executive summary aligns with detailed findings
- [ ] Recommendations are supported by analysis
- [ ] Sensitivity analysis covers key variables
- [ ] Risk assessment is comprehensive and balanced
- [ ] Report meets the standards of Big-4 consulting firms
- [ ] Language is professional and free of errors

---

## EXAMPLE OUTPUT SNIPPET

### Executive Summary

**Project Overview**
This feasibility study evaluates the technical and financial viability of a {{capacity}} kWp ground-mounted solar photovoltaic (PV) system proposed for installation at {{siteAddress}}, {{projectLocation}}. The project aims to {{projectObjective - e.g., "reduce electricity costs by generating clean energy on-site" or "develop a solar power plant for energy export to the grid"}}.

**Technical Highlights**
The proposed system comprises {{totalModules}} units of {{panelManufacturer}} {{panelModel}} {{panelWattage}}Wp bifacial modules and {{totalInverters}} units of {{inverterManufacturer}} {{inverterModel}} {{inverterCapacity}}kW string inverters, achieving a DC/AC ratio of {{dcAcRatio}}. The system is designed for a 25-year operational life with optimal tilt ({{tilt}}°) and azimuth ({{azimuth}}°) for the site's latitude ({{latitude}}°).

Solar resource assessment using PVWatts simulation indicates an annual energy production of **{{annualEnergyYear1}} kWh in Year 1**, with an average performance ratio of {{averagePR}}%. Accounting for 0.5% annual degradation, the system is projected to generate **{{lifetime25YearsEnergy}} MWh over its 25-year lifetime**.

**Financial Viability**
The total project investment is estimated at **USD {{totalProjectCost}}** (USD {{costPerKW}}/kWp), including all equipment, installation, and development costs. Based on an electricity tariff of **USD {{electricityTariff}}/kWh** with {{tariffEscalation}}% annual escalation, the project demonstrates strong financial viability:

- **Internal Rate of Return (IRR)**: {{irr}}% (well above industry benchmark of 12-15%)
- **Net Present Value (NPV)**: USD {{npv}} (at {{discountRate}}% discount rate)
- **Levelized Cost of Energy (LCOE)**: USD {{lcoe}}/kWh ({{X}}% below grid tariff)
- **Simple Payback Period**: {{simplePayback}} years
- **Discounted Payback Period**: {{discountedPayback}} years

Sensitivity analysis indicates the project remains viable under a range of scenarios, with IRR staying above 12% even with a 15% reduction in electricity tariff or 20% increase in CAPEX.

**Investment Recommendation**
Based on comprehensive technical and financial analysis, this project is **HIGHLY RECOMMENDED** for investment. The project offers:
✅ Strong financial returns with IRR of {{irr}}%
✅ Attractive payback period of {{simplePayback}} years
✅ Proven technology from tier-1 manufacturers
✅ Favorable solar resource ({{annualGHI}} kWh/m²/year GHI)
✅ Manageable technical and financial risks

**Confidence Level**: High (based on conservative assumptions, proven technology, and robust financial metrics)

**Critical Success Factors**:
1. Securing grid connection approval within Q{{X}} {{year}}
2. Maintaining electricity tariff at or above USD {{electricityTariff * 0.85}}/kWh
3. Procurement of tier-1 equipment with international warranties
4. Professional O&M to maintain >{{targetPR}}% performance ratio
5. Timely project completion to capitalize on current incentive structure

**Next Steps**:
1. Conduct detailed site survey and geotechnical investigation
2. Initiate grid connection application process
3. Finalize financing structure (equity/debt mix)
4. Complete detailed engineering and procurement
5. Secure necessary permits and land rights

---

This report provides a comprehensive foundation for investment decision-making. Further due diligence is recommended in areas of grid stability, off-taker creditworthiness, and detailed legal review of land agreements.

---

*This report has been prepared in accordance with international standards and best practices for solar PV feasibility studies, including IEC 61724 (PV system performance monitoring) and IFC Performance Standards for environmental and social assessment.*


