/**
 * AI Feasibility Report Generator Service
 * Generates comprehensive solar PV feasibility study reports using Google Gemini AI
 */

import { toast } from 'sonner';

interface ReportGenerationData {
  reportForm: any;
  boqParameters: any;
  solarResults: any;
  systemParams: any;
  selectedPanel: any;
  selectedInverter: any;
  polygonConfigs: any[];
  acConfiguration: any;
  detailedLosses: any;
  consolidatedBOQ: any[];
  boqCostSummary: any;
  financialParams: any;
  financialResults: any;
  location: any;
  metadata: any;
}

interface ReportGenerationResult {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * Formats the comprehensive prompt for Gemini AI
 */
export function formatFeasibilityReportPrompt(data: ReportGenerationData): string {
  const {
    reportForm,
    solarResults,
    systemParams,
    selectedPanel,
    selectedInverter,
    consolidatedBOQ,
    boqCostSummary,
    financialParams,
    financialResults,
    location,
    metadata
  } = data;

  // Build the comprehensive prompt
  const prompt = `
You are an expert solar energy consultant and technical writer with 15+ years of experience in preparing bankable feasibility studies for solar PV projects. You specialize in creating comprehensive, professional reports that meet the standards of international financial institutions and Big-4 consulting firms.

# TASK
Generate a comprehensive Solar PV Feasibility Study Report based on the provided technical and financial data.

# REPORT METADATA
- Report Title: ${reportForm.reportTitle || 'Solar PV Feasibility Study'}
- Report Date: ${reportForm.reportDate ? new Date(reportForm.reportDate).toLocaleDateString() : new Date().toLocaleDateString()}
- Prepared By: ${reportForm.companyInfo.companyName || 'N/A'}
- Prepared For: ${reportForm.userType === 'EPC_CONTRACTOR' ? reportForm.clientInfo?.clientCompany || 'Client' : 'Internal Use'}
- Project Name: ${reportForm.projectInfo.projectName || 'Solar PV Project'}
- Project Location: ${location?.address || 'Project Site'}

# PROJECT OVERVIEW
- System Capacity: ${metadata?.capacity || systemParams?.capacity || 0} kWp
- Total PV Modules: ${selectedPanel ? Math.floor((metadata?.capacity || 0) * 1000 / (selectedPanel.nominal_power_stc_w || 500)) : 'N/A'}
- Module Type: ${selectedPanel?.manufacturer || 'N/A'} ${selectedPanel?.model || 'N/A'} (${selectedPanel?.nominal_power_stc_w || 0}W ${selectedPanel?.bifacial ? 'Bifacial' : 'Mono-crystalline'})
- Inverter Type: ${selectedInverter?.manufacturer || 'N/A'} ${selectedInverter?.model || 'N/A'} (${selectedInverter?.nominal_ac_power_kw || 0}kW)
- Number of Inverters: ${metadata?.manualInverterCount || 1}
- Inverter Configuration: ${metadata?.isCentralInverter ? 'Central Inverter' : 'String Inverter'}

# SITE CONDITIONS
- Location: ${location?.address || 'N/A'}
- Coordinates: ${location?.latitude?.toFixed(4) || 'N/A'}°, ${location?.longitude?.toFixed(4) || 'N/A'}°
- Timezone: ${location?.timezone || 'N/A'}
- System Tilt: ${systemParams?.tilt || 0}°
- System Azimuth: ${systemParams?.azimuth || 180}° (${systemParams?.azimuth === 180 ? 'South-facing' : systemParams?.azimuth < 180 ? 'Southeast' : 'Southwest'})
- DC/AC Ratio: ${systemParams?.dcAcRatio?.toFixed(2) || 'N/A'}

# ENERGY PRODUCTION ANALYSIS
${solarResults?.energy ? `
- Annual Energy Production (Year 1): ${solarResults.energy.metrics.total_yearly?.toLocaleString() || 'N/A'} kWh
- Maximum Daily Production: ${solarResults.energy.metrics.max_daily?.toFixed(2) || 'N/A'} kWh
- Minimum Daily Production: ${solarResults.energy.metrics.min_daily?.toFixed(2) || 'N/A'} kWh
- Specific Yield: ${((solarResults.energy.metrics.total_yearly || 0) / (metadata?.capacity || 1)).toFixed(2)} kWh/kWp/year

Monthly Energy Production:
${solarResults.energy.monthly?.map((m: any, i: number) => 
  `  ${m.Month}: ${m['Monthly Energy Production (kWh)']?.toLocaleString() || 0} kWh`
).join('\n') || 'N/A'}
` : 'Energy analysis data not available'}

# SOLAR RESOURCE DATA
${solarResults?.irradiation ? `
- Annual Solar Irradiation: ${solarResults.irradiation.annual?.toFixed(2) || 'N/A'} kWh/m²/year
- Average Daily Irradiation: ${solarResults.irradiation.metrics?.avg_daily?.toFixed(2) || 'N/A'} kWh/m²/day
- Peak Irradiation: ${solarResults.irradiation.metrics?.max_daily?.toFixed(2) || 'N/A'} kWh/m²/day

Monthly Solar Irradiation:
${solarResults.irradiation.monthly?.map((m: any) => 
  `  ${m.Month}: ${m['Monthly Solar Irradiation (kWh/m²)']?.toFixed(2) || 0} kWh/m²`
).join('\n') || 'N/A'}
` : 'Solar resource data not available'}

# SYSTEM LOSSES
${data.detailedLosses ? `
Total System Losses: ${systemParams?.losses?.toFixed(2) || 'N/A'}%

Breakdown:
- Soiling Losses: ${data.detailedLosses.soiling || 0}%
- Shading Losses: ${data.detailedLosses.shading || 0}%
- Module Mismatch: ${data.detailedLosses.mismatch || 0}%
- Wiring Losses: ${data.detailedLosses.wiring || 0}%
- Connection Losses: ${data.detailedLosses.connections || 0}%
- Temperature Losses: ${data.detailedLosses.temperature || 0}%
- Age/Degradation: ${data.detailedLosses.age || 0}%
` : 'System loss data not available'}

# FINANCIAL ANALYSIS
${financialParams && financialResults ? `
## Investment Summary
- Total Project Cost: $${boqCostSummary?.totalProjectCost?.toLocaleString() || 'N/A'}
- Specific Cost: $${(boqCostSummary?.totalProjectCost / (metadata?.capacity || 1))?.toFixed(2) || 'N/A'}/kWp
- Government Subsidies: $${financialParams.governmentSubsidy?.toLocaleString() || 0}
- Net Investment: $${((boqCostSummary?.totalProjectCost || 0) - (financialParams.governmentSubsidy || 0))?.toLocaleString()}

## Operating Assumptions
- Annual O&M Cost: ${financialParams.omExpensesPercent}% of project cost = $${((boqCostSummary?.totalProjectCost || 0) * (financialParams.omExpensesPercent || 0) / 100)?.toLocaleString()}/year
- O&M Escalation: ${financialParams.omEscalationRate}% every ${financialParams.omEscalationFrequency} year(s)
- Electricity Tariff: $${financialParams.electricityRate}/kWh
- Tariff Escalation: ${financialParams.tariffEscalationRate}% every ${financialParams.tariffEscalationFrequency} year(s)
- Annual Degradation: ${financialParams.annualDegradation}%
- Discount Rate: ${financialParams.discountRate}%
- Income Tax Rate: ${financialParams.incomeTaxRate}%

## Financial Performance Metrics
- Internal Rate of Return (IRR): ${financialResults.irr?.toFixed(2) || 'N/A'}%
- Net Present Value (NPV): $${financialResults.npv?.toLocaleString() || 'N/A'}
- Return on Investment (ROI): ${financialResults.roi?.toFixed(2) || 'N/A'}% annually
- Payback Period: ${financialResults.payback_period?.toFixed(2) || 'N/A'} years
- Levelized Cost of Energy (LCOE): $${financialResults.lcoe?.toFixed(4) || 'N/A'}/kWh

## 25-Year Financial Summary
- Total Energy Generation: ${financialResults.summary?.total_energy_25yr?.toLocaleString() || 'N/A'} kWh
- Total Revenue: $${financialResults.summary?.total_revenue_25yr?.toLocaleString() || 'N/A'}
- Total O&M Costs: $${financialResults.summary?.total_om_cost_25yr?.toLocaleString() || 'N/A'}
- Net Profit (25 years): $${financialResults.summary?.net_revenue_25yr?.toLocaleString() || 'N/A'}
` : 'Financial analysis pending - user needs to complete Financial Analysis tab'}

# EQUIPMENT BILL OF QUANTITIES
${consolidatedBOQ && consolidatedBOQ.length > 0 ? `
Total BOQ Line Items: ${consolidatedBOQ.length}

Major Equipment (Top 10 items by significance):
${consolidatedBOQ.slice(0, 10).map((item: any, index: number) => 
  `${index + 1}. ${item.description}
   Specifications: ${item.specifications}
   Quantity: ${item.qty} ${item.unit}`
).join('\n\n')}

[Full BOQ with ${consolidatedBOQ.length} items available in appendix]
` : 'BOQ data not available'}

# PROJECT OBJECTIVE
${reportForm.projectInfo?.projectObjective || 'Not specified'}

---

# INSTRUCTIONS FOR REPORT GENERATION

Based on the data provided above, please generate a comprehensive EXECUTIVE SUMMARY for the Solar PV Feasibility Study Report.

**IMPORTANT**: Do NOT include any project metadata header (Report Date, Prepared By, Prepared For, Project Name, Project Location, etc.) in your response. These details are already on the cover page.

## EXECUTIVE SUMMARY (Comprehensive)

Generate a detailed, professional executive summary that includes:

### 1.1 Project Overview
- Opening paragraph introducing the project, location, and primary objective
- Key technical parameters (use these EXACT label formats):
  * **System Capacity:** [value]
  * **PV Modules:** [quantity x manufacturer model (wattage, type)]
  * **Inverters:** [quantity x manufacturer model (power rating, type)]
  * **Location:** [location with coordinates]
  * **System Orientation:** [Tilt: X°, Azimuth: Y° (direction)]
  * **DC/AC Ratio:** [value]%

### 1.2 Energy Production
- Annual energy production (Year 1) in kWh and MWh
- Specific yield (kWh/kWp/year) with interpretation
- Overall system losses (total percentage only, no detailed breakdown)

### 1.3 Financial Viability Snapshot
Present a clear financial case (use these EXACT label formats):
- **Total Project Cost:** $[value]
- **Net Investment:** $[value] (after subsidies if any)
- **Internal Rate of Return (IRR):** [X]% with benchmark comparison (typical: 12-18%)
  * Explain what this IRR means for investors
- **Net Present Value (NPV):** $[value] with positive/negative interpretation
- **Payback Period:** [X] years (Simple and/or Discounted)
  * Timeline context
- **Levelized Cost of Energy (LCOE):** $[X]/kWh
  * Comparison with grid electricity tariffs

### 1.4 Cost Savings and Environmental Impact
- Expected annual cost savings
- Electricity tariff considerations and escalation
- Estimated CO2 emissions reduction (calculate from annual energy)
- Environmental sustainability contributions

### 1.5 Energy Independence Assessment
- Contribution to on-site energy generation
- Grid independence benefits
- Resilience against tariff increases

### 1.6 GO/NO-GO Recommendation
- **Clear recommendation** (HIGH CONFIDENCE GO / MODERATE GO / CONDITIONAL GO / NO-GO)
- **Justification** based on financial metrics
- **Confidence Level:** [High/Medium/Low]

### 1.7 Critical Success Factors
List EXACTLY 4 critical success factors (use these EXACT label formats):

1. **Procurement and Installation Quality:** Focus on high-quality components and professional installation practices
2. **Operations and Maintenance (O&M):** Emphasize proactive O&M strategy for optimal performance and uptime
3. **Performance Monitoring:** Include both energy production tracking AND module degradation management as one integrated factor
4. **Grid Interconnection and Permitting:** Focus on efficient navigation of grid connection and regulatory requirements

**IMPORTANT NOTES**:
- List ONLY these 4 factors (be concise and effective)
- Do NOT include "Tariff and Escalation Accuracy" as a separate factor
- Do NOT include "Module Degradation Management" as a separate factor (it's merged with Performance Monitoring)
- Do NOT include a "Key Risks and Mitigation Strategies" section in the Executive Summary

# WRITING GUIDELINES

1. **Tone**: Professional, decisive, data-driven, consultant-level
2. **Language**: Clear, concise, suitable for C-level executives and financial institutions
3. **Structure**: 
   - Use clear headings and subheadings
   - Use bullet points for lists
   - Use **bold** for key metrics and emphasis
   - Use *italics* for terms that need highlighting
4. **Data**: Support ALL claims with specific numbers from the provided data
5. **Quantification**: Always provide numbers (%, $, kWh, years, etc.)
6. **Benchmarking**: Compare against industry standards:
   - IRR: 12-18% typical
   - Payback: 5-8 years typical
   - Performance Ratio: >75% good
   - Specific Cost: $800-1,500/kWp typical
7. **Justification**: Every strength/weakness/opportunity/threat must be based on provided data
8. **Format**: Plain text with markdown formatting
9. **Length**: ~2,000-2,500 words (comprehensive)

**IMPORTANT**:
- Be specific with all numbers - no vague statements
- Make actionable recommendations
- Use location-specific insights where data permits
- Maintain Big-4 consulting firm standards
- Be decisive in recommendations
- Interpret financial metrics for non-technical readers
- Focus on investment decision-making

**OUTPUT FORMAT**:
Structure your response with clear markdown headings. Start DIRECTLY with the content - NO project metadata header!

# 1. EXECUTIVE SUMMARY

[Opening paragraph with project introduction - start with "This feasibility study..."]

## Key Technical Parameters:
System Capacity: [X] kWp
PV Modules: [quantity x manufacturer model (wattage, type)]
Inverters: [quantity x manufacturer model (power, type)]
Location: [location (coordinates)]
System Orientation: Tilt: [X]°, Azimuth: [Y]° (direction)
DC/AC Ratio: [X]%

## Financial Viability Snapshot:
[Financial summary paragraph]

Total Project Cost: $[X]
Net Investment: $[X]
Internal Rate of Return (IRR): [X]% [Comparison with benchmark]
Net Present Value (NPV): $[X] [Interpretation]
Payback Period: [X] years
Levelized Cost of Energy (LCOE): $[X]/kWh [Comparison with grid tariff]

## Recommendation:
**[GO/PROCEED WITH CAUTION/NO-GO]**. [Clear reasoning...]

Confidence Level: [High/Medium/Low]

## Critical Success Factors:
1. Procurement and Installation Quality: [Details about high-quality components and professional installation]
2. Operations and Maintenance (O&M): [Details about proactive O&M strategy]
3. Performance Monitoring: [Details about energy tracking AND module degradation management together]
4. Grid Interconnection and Permitting: [Details about efficient regulatory navigation]

---

Please generate the executive summary now following the structure above.

**IMPORTANT REMINDERS**:
- Do NOT include detailed system losses breakdown (only mention total losses percentage)
- Do NOT include "Key Risks and Mitigation Strategies" section
- Include EXACTLY 4 Critical Success Factors (no more, no less)
- Do NOT include "Tariff and Escalation Accuracy" as a factor
- Merge module degradation with Performance Monitoring factor
- End with Critical Success Factors section
`;

  return prompt;
}

/**
 * Generates feasibility report using Google Gemini AI
 */
export async function generateFeasibilityReport(
  data: ReportGenerationData,
  model: 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' = 'gemini-2.5-flash-lite'
): Promise<ReportGenerationResult> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        error: 'Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.'
      };
    }

    console.log('🚀 Starting feasibility report generation with', model);
    
    // Format the comprehensive prompt
    const prompt = formatFeasibilityReportPrompt(data);
    
    console.log('📝 Prompt length:', prompt.length, 'characters');
    
    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: data.reportForm.aiSettings?.temperature || 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE"
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Gemini API error:', errorData);
      return {
        success: false,
        error: `API request failed: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`
      };
    }

    const result = await response.json();
    
    console.log('✅ Gemini API response received');
    
    // Extract generated content
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      console.error('❌ No content generated:', result);
      return {
        success: false,
        error: 'No content was generated. Please try again.'
      };
    }

    console.log('📄 Generated report length:', generatedText.length, 'characters');
    
    return {
      success: true,
      content: generatedText
    };

  } catch (error) {
    console.error('❌ Error generating feasibility report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Downloads generated report as markdown file
 */
export function downloadReportAsMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  toast.success('Report downloaded successfully!');
}

/**
 * Downloads generated report as text file
 */
export function downloadReportAsText(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  toast.success('Report downloaded successfully!');
}

/**
 * Interface for separated AI report sections
 */
export interface AIReportSections {
  executiveSummary: string;
  swotAnalysis: string;
}

/**
 * Parse AI-generated content into Executive Summary and SWOT sections
 */
export function separateAIReportSections(content: string): AIReportSections {
  console.log('🔍 Separating AI Report Sections...');
  console.log('📄 Content length:', content.length);
  console.log('📝 First 500 chars:', content.substring(0, 500));
  
  // Try to split by SWOT ANALYSIS header
  const swotMatch = content.match(/#+\s*SWOT\s*ANALYSIS/i);
  
  if (swotMatch && swotMatch.index) {
    const executiveSummary = content.substring(0, swotMatch.index).trim();
    const swotAnalysis = content.substring(swotMatch.index).trim();
    
    console.log('✅ Found SWOT section at index:', swotMatch.index);
    console.log('📊 Executive Summary length:', executiveSummary.length);
    console.log('📊 SWOT Analysis length:', swotAnalysis.length);
    
    return {
      executiveSummary,
      swotAnalysis
    };
  }
  
  // If no clear separation, try alternative patterns
  const parts = content.split(/---+/);
  if (parts.length >= 2) {
    console.log('✅ Split by separator, found', parts.length, 'parts');
    return {
      executiveSummary: parts[0].trim(),
      swotAnalysis: parts[1].trim()
    };
  }
  
  console.log('⚠️ Could not separate sections, returning full content as Executive Summary');
  // Fallback: return all as executive summary
  return {
    executiveSummary: content,
    swotAnalysis: ''
  };
}

/**
 * Parse markdown content into structured sections for PDF rendering
 */
export interface ParsedSection {
  type: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'list' | 'table';
  content: string;
  level?: number;
  items?: string[];
  tableData?: { headers: string[]; rows: string[][] };
}

export function parseMarkdownContent(markdown: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = markdown.split('\n');
  
  let currentParagraph = '';
  let currentList: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      if (currentParagraph) {
        sections.push({ type: 'paragraph', content: currentParagraph.trim() });
        currentParagraph = '';
      }
      if (currentList.length > 0) {
        sections.push({ type: 'list', content: '', items: [...currentList] });
        currentList = [];
      }
      continue;
    }
    
    // Heading 1 (# or ##)
    if (line.startsWith('# ')) {
      if (currentParagraph) {
        sections.push({ type: 'paragraph', content: currentParagraph.trim() });
        currentParagraph = '';
      }
      sections.push({ type: 'heading1', content: line.replace(/^#\s+/, ''), level: 1 });
    }
    // Heading 2 (##)
    else if (line.startsWith('## ')) {
      if (currentParagraph) {
        sections.push({ type: 'paragraph', content: currentParagraph.trim() });
        currentParagraph = '';
      }
      sections.push({ type: 'heading2', content: line.replace(/^##\s+/, ''), level: 2 });
    }
    // Heading 3 (###)
    else if (line.startsWith('### ')) {
      if (currentParagraph) {
        sections.push({ type: 'paragraph', content: currentParagraph.trim() });
        currentParagraph = '';
      }
      sections.push({ type: 'heading3', content: line.replace(/^###\s+/, ''), level: 3 });
    }
    // List items (-, *, or numbered)
    else if (line.match(/^[-*]\s+/) || line.match(/^\d+\.\s+/)) {
      if (currentParagraph) {
        sections.push({ type: 'paragraph', content: currentParagraph.trim() });
        currentParagraph = '';
      }
      const listItem = line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
      currentList.push(listItem);
    }
    // Regular paragraph
    else {
      if (currentList.length > 0) {
        sections.push({ type: 'list', content: '', items: [...currentList] });
        currentList = [];
      }
      currentParagraph += (currentParagraph ? ' ' : '') + line;
    }
  }
  
  // Add remaining content
  if (currentParagraph) {
    sections.push({ type: 'paragraph', content: currentParagraph.trim() });
  }
  if (currentList.length > 0) {
    sections.push({ type: 'list', content: '', items: currentList });
  }
  
  return sections;
}

