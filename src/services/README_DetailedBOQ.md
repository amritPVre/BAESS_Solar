# Detailed Solar PV BOQ Generator

## Overview
This implementation creates a comprehensive BOQ (Bill of Quantities) generator for Solar PV plants based on the detailed prompt specifications in `working-reference/solar_pv_boq_prompt.md`.

## Components Created

### 1. AIBOQGenerator.ts
**Location**: `src/services/AIBOQGenerator.ts`

**Purpose**: AI-powered service that uses LLM (OpenAI GPT-4 or Google Gemini 2.0) to generate professional BOQ based on detailed prompt specifications.

**Key Features**:
- ✅ **AI/LLM Integration**: Uses existing `callOpenAI()` and `callGemini()` services
- ✅ **Detailed Prompt Integration**: Combines parameters with `solar_pv_boq_prompt.md` specifications
- ✅ **Professional Engineering**: AI applies IEC standards and industry best practices
- ✅ **Model Selection**: Choose between OpenAI GPT-4 or Google Gemini 2.0
- ✅ **Parameter Integration**: Uses `BOQParameterManager.formatForAIPrompt()` for input data
- ✅ **Response Parsing**: Extracts BOQ table from AI output automatically
- ✅ **Export Options**: CSV and clipboard functionality

**Standards Compliance**:
- IEC 60364-5-54 (Earthing)
- IEC 62561 (Lightning Protection) 
- IEC 60228 (Cable Conductors)
- IEC 61869 (Current & Potential Transformers)
- IEC 60255 (Protection Relays)
- IEC 61643-11 (Surge Protective Devices)
- IEC 60099-4 (Surge Arresters)
- IEC 61439 (LV Switchgear)
- IEC 62271 (HV Switchgear)
- IEC 62056 (DLMS Protocol)
- IS 3043 (Indian Standards)

### 2. DetailedBOQGenerator.tsx (AI-Powered)
**Location**: `src/components/advanced-solar-calculator/DetailedBOQGenerator.tsx`

**Purpose**: React component that provides the UI for AI-powered BOQ generation and viewing.

**Key Features**:
- ✅ **AI Model Selection**: Choose between OpenAI GPT-4 or Google Gemini 2.0
- ✅ **Parameter Integration**: Uses existing BOQ parameter system
- ✅ **System Detection**: Automatically detects LV/HV configurations
- ✅ **AI BOQ Generation**: Uses AI/LLM with detailed prompt specifications
- ✅ **Professional Results**: AI-generated BOQ with industry-standard specifications
- ✅ **Table Display**: Shows AI-generated BOQ in structured table format
- ✅ **Export Options**: CSV download and clipboard copy functionality
- ✅ **Standards Documentation**: Shows all applicable IEC standards

### 3. Integration with Main Calculator
**Location**: `src/components/advanced-solar-calculator/index.tsx`

**Changes**:
- ✅ Added new "AI BOQ" tab to main calculator interface
- ✅ Integrated with existing parameter extraction system  
- ✅ Passes all required configuration data to AI generator
- ✅ Uses Bot icons to indicate AI-powered functionality

## BOQ Output Format

The AI generator produces a professional 3-column BOQ table:

| Description | Specifications | Qty |
|---|---|---|
| DC Bonding Jumpers | 6 mm² tinned Cu, PVC, 2 m each, IEC 60364-5-54 | 500 Nos |
| DC PE Cable | 10 mm² tinned Cu, PVC, IEC 60364-5-54/60228 | 2500 m |
| ESE Lightning Arrestor | 79 m radius, SS mast 6 m, IEC 62305/62561 | 5 Nos |
| CTs – HV Protection | 600/5 A, 5P20, 15 VA, IEC 61869-2 | 3 Nos |
| ZnO Surge Arrester – 11 kV | Ur 18 kV, IEC 60099-4 | 3 Nos |
| Net Meter at PoC | 3ph 4w, Class 0.2S, DLMS/IEC 62056 | 1 Nos |

## AI-Powered Calculation Workflow

### 1. Parameter Extraction
- Uses `BOQParameterManager.formatForAIPrompt()` to extract all system parameters
- Includes DC inputs, lightning protection, AC configuration, substation details
- Formats parameters in structured prompt format

### 2. Prompt Combination
- Combines extracted parameters with detailed prompt from `solar_pv_boq_prompt.md`
- Includes all IEC standards and engineering rules
- Provides complete context to AI model

### 3. AI Processing
- **OpenAI GPT-4**: Advanced reasoning and detailed engineering analysis
- **Google Gemini 2.0**: Fast processing with professional accuracy
- AI applies industry best practices and IEC standards automatically

### 4. Rules Applied by AI
- **DC Structure Earthing**: Bonding jumpers, PE sizing (adiabatic), earth pits (1 per 20 tables)
- **Lightning Protection**: ESE arrestors (1 per 10,000m²), dedicated earth pits, earthing compound  
- **AC Earthing**: LV PE (IEC Table 54.2), HV PE (adiabatic), equipment bonding, earth grid
- **Instrumentation**: CTs (protection/metering), PTs, SPDs, protection relays
- **Communication**: RS-485, Cat-6, Fiber optic cables with +10% slack
- **Net Meter**: 3ph, 4w, bidirectional, DLMS/IEC 62056
- **Busbars**: LV (1.5× incomer), HV (1.25× current, 31.5kA withstand)
- **Transformer Earthing**: 4 pits per transformer (HV systems only)

## Usage

1. **Configure System**: Complete PV Areas, Component Selection, and AC Configuration tabs
2. **Navigate to "AI BOQ" Tab**: New tab in main calculator interface  
3. **Select AI Model**: Choose between OpenAI GPT-4 or Google Gemini 2.0
4. **Generate AI BOQ**: Click "Generate AI BOQ" button
5. **Review Results**: View comprehensive AI-generated BOQ table with professional specifications
6. **Export**: Download as CSV or copy table to clipboard

## System Requirements

- **LV Systems**: 30×30m yard, 5Ω earthing resistance, no transformer earthing
- **HV Systems**: 40×40m yard, 1Ω earthing resistance, includes transformer earthing
- **All Systems**: Deterministic calculations, no ranges or estimates, IEC compliance

## Key Benefits

- ✅ **AI-Powered Intelligence**: Uses advanced language models for professional engineering decisions
- ✅ **Complete Coverage**: All BOQ categories from detailed prompt specifications
- ✅ **Standards Compliance**: AI applies full IEC standards knowledge automatically
- ✅ **Professional Results**: Industry-grade AI-generated quantities and specifications
- ✅ **Model Flexibility**: Choose between OpenAI GPT-4 or Google Gemini 2.0
- ✅ **System Intelligence**: Automatic LV/HV detection with appropriate AI calculations
- ✅ **Expert Knowledge**: AI leverages years of engineering expertise and best practices
- ✅ **Seamless Integration**: Works with existing parameter extraction system
