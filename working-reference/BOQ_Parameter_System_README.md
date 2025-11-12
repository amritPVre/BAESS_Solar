# BOQ Parameter Management System

## Overview
This system extracts parameters from the solar calculator and formats them for AI LLM-powered BOQ (Bill of Quantities) calculations. It's designed to work with your existing solar calculator app to provide structured input for detailed BOQ estimations.

## Files Created

### 1. Type Definitions (`src/types/boq-parameters.ts`)
- **DCInputs**: Structure type, module dimensions, table counts, string data
- **LightningProtectionInputs**: Plant area, soil type
- **ACCommonInputs**: System type, inverter count
- **LVConnectionInputs**: LV-specific parameters (cables, breakers, distances)
- **HVStringInverterInputs**: HV + String inverter parameters (IDT, PT, transformers)
- **HVCentralInverterInputs**: HV + Central inverter parameters
- **SubstationInputs**: Yard size, earthing resistance targets
- **FixedPreferences**: Default values for materials and devices
- **TransformerEarthingInputs**: Earthing requirements for transformers

### 2. Parameter Manager Service (`src/services/BOQParameterManager.ts`)
Singleton service that:
- Extracts parameters from various calculator components
- Stores parameters temporarily during the session
- Formats parameters for AI LLM prompts
- Provides default values for missing parameters

### 3. React Hooks (`src/hooks/useBOQParameterExtraction.ts`)
- **useBOQParameterExtraction**: Main hook for parameter extraction and management
- **useBOQParameterDebug**: Helper hook for debugging and parameter inspection

### 4. UI Component (`src/components/advanced-solar-calculator/BOQParameterPanel.tsx`)
User interface with tabbed layout:
- **Overview**: System status and parameter summary
- **Parameters**: View current extracted parameters
- **AI Prompt**: Generate and manage AI LLM prompts
- **Actions**: Extract, download, and clear parameters

## Parameter Sources

Based on your `prompt_input_BOQ_list.csv`, parameters are extracted from:

### From PV Areas Tab:
- Structure type
- Total number of tables
- Module layout per table
- Total number of rows (ballasted systems)
- Total plant area

### From PV Select Tab:
- Module width/length (mm)
- String short-circuit current

### From DC Config Tab:
- Total strings per inverter
- Number of inverters

### From AC Config Tab:
- Cable sizing data (distances, cross-sections)
- Circuit breaker ratings
- Transformer specifications (IDT, PT)

### From Location Tab:
- Soil type selection

### Default Values:
- Substation yard size: 30×30m (LV), 40×40m (HV)
- Target earthing resistance: 5Ω (LV), 1Ω (HV)
- Transformer impedance: 6% (default)
- Fixed preferences: String fuse, tinned copper, PVC insulation

## Integration Instructions

### Step 1: Add BOQParameterPanel to Main Calculator

```typescript
// In your main calculator component
import BOQParameterPanel from './BOQParameterPanel';

// Add to your component JSX
<BOQParameterPanel
  polygonConfigs={polygonConfigs}
  selectedPanel={selectedPanel}
  selectedInverter={selectedInverter}
  structureType={structureType}
  connectionType={connectionType}
  isCentralInverter={isCentralInverter}
  manualInverterCount={manualInverterCount}
  totalStringCount={totalStringCount}
  averageStringCurrent={averageStringCurrent}
  soilType={soilType}
  acConfigData={acConfigData} // Cable/breaker/transformer data
  isVisible={true}
/>
```

### Step 2: Usage Flow

1. **Complete Solar Design**: Fill all required tabs (PV Areas, PV Select, DC Config, AC Config, Location)
2. **Check Status**: BOQParameterPanel will show "Ready" when all parameters are available
3. **Generate Prompt**: Click "Generate AI Prompt" to create formatted input
4. **Use with AI**: Copy or download the prompt for your AI LLM BOQ calculations

### Step 3: AI LLM Integration

The generated prompt contains structured data like:

```
# Solar PV BOQ Calculation Parameters

**System Type:** HV_String
**Calculation Date:** 2024-01-15T10:30:00.000Z

## 1. DC Side Inputs
- Structure Type: ground_mount_tables
- Module Width: 1134mm
- Module Length: 2382mm
- Total Number of Tables: 20
- Module Layout per Table: 3L×5
- String Short-circuit Current: 11.2A
- Total Strings per Inverter: 12

## 2. Lightning Protection Inputs
- Total Plant Area: 2500m²
- Soil Type: loam

[... continues with all parameters]
```

## System Types Supported

1. **LV Connection**: Direct LV connection to grid
2. **HV String**: String inverters with HV connection (IDT + PT)
3. **HV Central**: Central inverters with HV connection (IDT + PT)

## Debugging Features

- Console logging of parameters: `logCurrentParameters()`
- JSON export: `downloadParametersAsJSON()`
- Prompt preview: `getFormattedPromptForType(type)`

## Error Handling

The system includes:
- Parameter validation
- Missing data warnings  
- Default value fallbacks
- Session management
- Clear error messages

## Future Enhancements

- Real-time parameter sync with calculator changes
- Parameter validation rules
- Custom default value overrides
- Multiple AI prompt formats
- Parameter history and comparison

## Support

This system is designed to work with your existing BOQ calculation workflow. The extracted parameters match the requirements in your `prompt_input_BOQ_list.csv` specification.
