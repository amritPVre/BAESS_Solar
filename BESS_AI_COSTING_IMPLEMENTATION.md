# BESS AI Costing & Mounting Structure Implementation ✅

## Overview
Implemented two major enhancements:
1. **AI-Generated PV Mounting Structure** in BOQ (with formulas and standards)
2. **New "Project Costing" Tab** with AI-powered pricing for South East & East Asia markets

---

## Feature 1: AI-Generated Mounting Structure

### What Changed
- **Removed hardcoded mounting structure items** from BOQ
- **Added mounting structure to AI generation** with detailed formulas and standards
- **Integrated PV configuration data** from PV Sizing tab

### Implementation Details

#### 1. Added Mounting Configuration to Project Context
```typescript
const projectContext = {
  // ... existing fields
  mountingType: pvParams?.mountingType || 'Fixed Tilt',
  modulesPerRow: pvParams?.modulesPerRow || 10,
  rowsPerTable: pvParams?.rowsPerTable || 2,
  totalTables: pvParams?.totalTables || Math.ceil(totalModules / 20),
  moduleOrientation: pvParams?.moduleOrientation || 'Portrait',
  // ...
};
```

#### 2. Enhanced AI Prompt with Mounting Rules
```
===PROJECT DETAILS===
Mounting: Fixed Tilt, 2 tables/arrays, 10 modules/row × 2 rows, Portrait orientation

===CALCULATION RULES===
0. PV Mounting Structure (Fixed Tilt): 21 modules, 2 arrays
   Fixed Tilt Standards: Rail length 6m(std), Foundation: RCC/steel posts @3m spacing OR ground screws
   Module clamps: Mid clamps=(modules_per_row-1)×rows×arrays, End clamps=2×rows×arrays
   Generate 4-6 items: 
     a) Foundation System (piers/screws/ballast)
     b) Main Rails (Aluminum 6063-T6, 40×40mm)
     c) Cross Rails
     d) Mid Clamps
     e) End Clamps
     f) Hardware Kit (bolts M8×25mm SS304, washers, cable ties)
   
   Ground/Roof: Add specific items: 
     - Ground = Earth lugs + bonding
     - Roof = Roof hooks + flashings + sealant
   
   Carport: Add: Carport columns (H=3-4m), Roof beams, Purlins, Gutter system
   Floating: Add: Floats (HDPE), Anchoring system, Walkways
```

#### 3. Standard Formulas
| Component | Formula | Example (10 mod/row × 2 rows × 2 arrays) |
|-----------|---------|-------------------------------------------|
| **Mid Clamps** | (modules_per_row - 1) × rows × arrays | (10-1) × 2 × 2 = 36 clamps |
| **End Clamps** | 2 × rows × arrays | 2 × 2 × 2 = 8 clamps |
| **Main Rails** | Total_modules × module_width / rail_length | 21 × 1.1m / 6m = 4 rails |
| **Cross Rails** | rows × arrays | 2 × 2 = 4 rails |
| **Foundation Posts** | rail_length / post_spacing | 6m / 3m = 2 posts per rail |

#### 4. Mounting Type Variations
The AI now generates specific items based on mounting type:

**Fixed Tilt (Ground/Roof)**:
- Foundation system (RCC/Steel posts or Ground screws)
- Main rails (Aluminum 6063-T6, 40×40mm)
- Cross rails
- Mid clamps + End clamps
- Hardware kit
- Earthing lugs + bonding (ground)
- Roof hooks + flashings (roof)

**Carport**:
- All above items PLUS:
- Carport columns (H=3-4m)
- Roof beams
- Purlins
- Gutter system

**Floating**:
- All above items PLUS:
- HDPE floats
- Anchoring system
- Walkways

---

## Feature 2: Project Costing Tab

### Overview
New AI-powered tab that generates market-based pricing for all BOQ components using DeepSeek v3.1 LLM.

### Fixed Component Pricing
| Component | Rate (USD) | Formula |
|-----------|-----------|---------|
| **PV Modules** | $150 per kW | PV_capacity_kW × 150 |
| **Hybrid Inverter** | $100 per kW | Inverter_capacity_kW × 100 |
| **PV Inverter** | $70 per kW | Inverter_capacity_kW × 70 |
| **Battery Inverter** | $65 per kW | Inverter_capacity_kW × 65 |

### AI-Generated Pricing
For all other components, AI generates market-based pricing for:

#### Component Categories:
1. **PV Mounting Structure**
   - Foundation system
   - Rails & clamps
   - Hardware

2. **Battery Racking System**
   - Rack structure
   - Accessories
   - Bus bars

3. **Earthing System**
   - Electrodes
   - GI strips
   - Bonding cables
   - Clamps

4. **Lightning Protection**
   - DC SPDs
   - AC SPDs
   - Down conductors
   - Air terminals

5. **Cable Management**
   - Cable trays
   - Conduits
   - Cable glands
   - Cable ties

6. **Distribution & Protection**
   - DCDB (with internals)
   - ACDB (with internals)
   - MCBs, Isolators
   - Energy meter

7. **Safety & Testing**
   - Safety signs
   - Fire extinguisher
   - PPE
   - Testing & commissioning

### UI Components

#### Summary Cards
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  PV Modules  │   Inverter   │ Electrical   │    Total     │
│              │              │     BOS      │   Project    │
│   $X,XXX     │   $X,XXX     │   $X,XXX     │   $X,XXX     │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

#### Detailed Pricing Table
For each category:
```
┌─────────────────────────────────────────────────────────────┐
│  PV Mounting Structure                                      │
├──────────────────────┬──────┬──────────┬──────────────────┤
│ Item                 │ Qty  │ Unit $   │ Total $          │
├──────────────────────┼──────┼──────────┼──────────────────┤
│ Foundation Posts     │ 8    │ $25      │ $200             │
│ Main Rails (6m)      │ 12   │ $45      │ $540             │
│ Mid Clamps           │ 36   │ $3       │ $108             │
│ End Clamps           │ 8    │ $4       │ $32              │
│ Hardware Kit         │ 1    │ $150     │ $150             │
└──────────────────────┴──────┴──────────┴──────────────────┘
```

---

## AI Prompt for Costing

### Prompt Structure
```
You are a procurement specialist with expertise in Solar PV + Battery Storage systems. 
Generate market-based pricing for South East Asia and East Asia regions.

PROJECT SUMMARY:
- PV System: 8.82 kW (14 modules)
- Battery: 3 × 5kWh Lithium-Ion
- Inverter: 12kW DC coupled
- Location: Kolkata, India

FIXED PRICING (DO NOT CHANGE):
1. PV Modules: 8.82 kW @ $150/kW = $1,323.00
2. Inverter: 12kW Hybrid @ $100/kW = $1,200.00

BOS COMPONENTS TO PRICE:
[Lists all AI-generated BOQ items]

Generate realistic 2025 market prices for:
- PV Mounting Structure items
- Battery Racking System
- Earthing System components
- Lightning Protection (SPDs, arrestors)
- Cable Management (trays, conduits, glands)
- Distribution Boxes (DCDB, ACDB with internals)
- Safety Equipment
- Installation Materials
- Testing & Commissioning

Return ONLY valid JSON:
{
  "componentPricing": [
    {"category": "...", "items": [{"name": "...", "qty": X, "unit": "...", "unitPrice": Y, "total": Z}]},
    ...
  ],
  "summary": {
    "pvModules": X,
    "inverter": X,
    "batteries": X,
    "mountingStructure": X,
    "electricalBOS": X,
    "installation": X,
    "subtotal": X,
    "contingency": X,
    "total": X,
    "currency": "USD"
  }
}

Use realistic market prices. Include 10-15% for installation labor and 5% contingency.
```

---

## Implementation Code Changes

### Files Modified
- `src/pages/BESSDesigner.tsx` - Main implementation

### Key Changes

#### 1. Added Navigation Item
```typescript
const NAV_ITEMS = [
  // ... existing items
  { id: 'boq', label: 'BOQ', icon: ClipboardList },
  { id: 'costing', label: 'Project Costing', icon: DollarSign }, // NEW
  { id: 'financial', label: 'Financial Analysis', icon: DollarSign },
  // ...
];
```

#### 2. Created ProjectCosting Component
**Location**: Before `BOQTable` component (line ~3900)

**Props**:
- `projectData` - Project info (location, etc.)
- `batterySelection` - Battery config
- `pvParams` - PV parameters
- `pvResults` - PV sizing results
- `selectedHybridInverter` - Hybrid inverter data
- `selectedPvInverter` - PV inverter data
- `selectedBatteryInverter` - Battery inverter data
- `cableParams` - Cable sizing results
- `aiGeneratedItems` - BOQ items from AI

**State**:
- `loading: boolean` - API call in progress
- `pricingData: object | null` - Generated pricing data

**Methods**:
- `generatePricing()` - Calls DeepSeek API for pricing

#### 3. Added Case in renderPage()
```typescript
case 'costing': {
  return <ProjectCosting
    projectData={projectData}
    batterySelection={batterySelection}
    pvParams={pvParams}
    pvResults={pvResults}
    selectedHybridInverter={selectedHybridInverter}
    selectedPvInverter={selectedPvInverter}
    selectedBatteryInverter={selectedBatteryInverter}
    cableParams={cableParams}
    aiGeneratedItems={aiGeneratedItems}
  />;
}
```

#### 4. Updated BOQ Prompt
**Added to PROJECT DETAILS**:
```
Mounting: Fixed Tilt, 2 tables/arrays, 10 modules/row × 2 rows, Portrait orientation
```

**Added to CALCULATION RULES**:
```
0. PV Mounting Structure (Fixed Tilt): 21 modules, 2 arrays
   [Detailed formulas and specifications]
```

**Updated Output Instructions**:
```
✓ INCLUDE PV mounting structure items
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Completes Design                                    │
│    - PV Sizing (mounting config)                            │
│    - Battery Config                                         │
│    - Cable Sizing                                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. BOQ Tab - AI Generates BOQ                               │
│    - System components (PV, Battery, Inverter, Cables)      │
│    - Mounting Structure (AI generated with formulas)        │
│    - Electrical BOS (DCDB, ACDB, SPDs, etc.)                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Project Costing Tab - AI Generates Pricing               │
│    - Fixed: PV Modules ($150/kW)                            │
│    - Fixed: Inverter ($100/kW hybrid, $70/kW PV)            │
│    - AI: All BOS component pricing                          │
│    - AI: Installation & contingency                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Testing Steps

### Test 1: AI-Generated Mounting Structure

1. **Complete System Design**:
   - Navigate to **PV Sizing** tab
   - Design system (e.g., 21 modules)
   - Set mounting configuration:
     - Mounting Type: "Fixed Tilt"
     - Modules per Row: 10
     - Rows per Table: 2
     - Module Orientation: Portrait

2. **Generate BOQ**:
   - Navigate to **BOQ** tab
   - Click **"✨ AI Assisted BOQ Generation"**
   - Wait for generation to complete

3. **Verify Mounting Structure Items**:
   Look for AI-generated items:
   - ✅ Foundation System (posts/screws)
   - ✅ Main Rails (Aluminum 6063-T6)
   - ✅ Cross Rails
   - ✅ Mid Clamps (calculated qty)
   - ✅ End Clamps (calculated qty)
   - ✅ Hardware Kit

4. **Check Calculations**:
   - Mid clamps: Should be `(10-1) × 2 × 2 = 36` (or similar)
   - End clamps: Should be `2 × 2 × 2 = 8` (or similar)
   - Specifications should include standards (IS, IEC)

### Test 2: AI-Powered Costing

1. **Prerequisites**:
   - Complete Test 1 (BOQ generation)
   - Ensure BOQ has AI-generated items

2. **Generate Pricing**:
   - Navigate to **Project Costing** tab
   - Should see splash screen: "Complete BOQ generation first"
   - Click **"💰 Generate Pricing"**
   - Wait for API response (10-30 seconds)

3. **Verify Summary Cards**:
   - **PV Modules**: Should show `PV_kW × $150`
     - Example: 8.82 kW × $150 = $1,323
   - **Inverter**: Should show `Inv_kW × $100` (hybrid) or `× $70` (PV)
     - Example: 12 kW × $100 = $1,200
   - **Electrical BOS**: Should show AI-calculated total
   - **Total Project**: Sum of all categories

4. **Verify Detailed Pricing**:
   - Should see 7 categories:
     1. PV Mounting Structure
     2. Battery Racking
     3. Earthing System
     4. Lightning Protection
     5. Cable Management
     6. Distribution & Protection
     7. Safety & Testing
   
   - Each category should have:
     - Item name
     - Quantity & unit
     - Unit price (USD)
     - Total price (USD)
   
   - Prices should be realistic for Asia markets (2025)
   - All items should have actual calculated prices (not "$0" or "TBD")

5. **Check Console Logs**:
   - Open browser console (F12)
   - Look for pricing API call logs
   - Verify no errors

### Test 3: Different Mounting Types

1. **Test Roof Mount**:
   - PV Sizing: Select "Roof Mount"
   - Generate BOQ
   - Verify mounting items include:
     - ✅ Roof hooks
     - ✅ Flashings
     - ✅ Sealant

2. **Test Carport**:
   - PV Sizing: Select "Carport"
   - Generate BOQ
   - Verify mounting items include:
     - ✅ Carport columns
     - ✅ Roof beams
     - ✅ Purlins
     - ✅ Gutter system

3. **Test Floating**:
   - PV Sizing: Select "Floating"
   - Generate BOQ
   - Verify mounting items include:
     - ✅ HDPE floats
     - ✅ Anchoring system
     - ✅ Walkways

---

## Expected Output Examples

### Example 1: BOQ Mounting Structure Items (Fixed Tilt)

| Sl | Description | Specification | Unit | QTY |
|----|-------------|---------------|------|-----|
| 5 | Foundation Posts - Ground Mounting | Galvanized steel posts, 100×100×3mm, L=2m, concrete foundation 300×300×600mm, M20 grade, as per IS 2062 | Nos | 8 |
| 6 | Main Rails - PV Module Support | Aluminum alloy 6063-T6, 40×40×2mm, L=6m, anodized finish, load capacity 150 kg/m, as per IS 733 | Mtrs | 24 |
| 7 | Cross Rails - Module Mounting | Aluminum alloy 6063-T6, 30×30mm, anodized, for lateral support | Mtrs | 12 |
| 8 | Mid Clamps - Module Fixing | Stainless steel SS304, adjustable height 30-50mm, torque spec 12-15 Nm, as per IEC 61215 | Nos | 36 |
| 9 | End Clamps - Module Edge Fixing | Stainless steel SS304, grounding provision, adjustable, torque spec 12-15 Nm | Nos | 8 |
| 10 | Hardware Kit - Mounting Assembly | M8×25mm SS304 hex bolts, washers, spring washers, cable ties UV resistant, anti-corrosion compound | Set | 1 |
| 11 | Earthing Lugs - Structure Bonding | Brass/copper lugs, 35mm², compression type, for structure earthing | Nos | 12 |

### Example 2: Costing Summary

```json
{
  "summary": {
    "pvModules": 1323.00,
    "inverter": 1200.00,
    "batteries": 4500.00,
    "mountingStructure": 2850.00,
    "electricalBOS": 3200.00,
    "installation": 1450.00,
    "subtotal": 14523.00,
    "contingency": 726.15,
    "total": 15249.15,
    "currency": "USD"
  }
}
```

### Example 3: Detailed Pricing - Mounting Structure

| Item | Qty | Unit | Unit Price | Total |
|------|-----|------|------------|-------|
| Foundation Posts (Galvanized Steel) | 8 | Nos | $35 | $280 |
| Main Rails (Aluminum 6063-T6, 6m) | 4 | Nos | $65 | $260 |
| Cross Rails (Aluminum, 3m) | 4 | Nos | $30 | $120 |
| Mid Clamps (SS304) | 36 | Nos | $4 | $144 |
| End Clamps (SS304) | 8 | Nos | $5 | $40 |
| Hardware Kit (Bolts, Washers) | 1 | Set | $180 | $180 |
| Earthing Lugs & Bonding | 12 | Nos | $8 | $96 |
| **Category Total** | - | - | - | **$1,120** |

---

## Troubleshooting

### Issue 1: Mounting Structure Not in BOQ
**Symptom**: BOQ doesn't include mounting structure items

**Solution**:
1. Check PV Sizing tab has mounting configuration
2. Verify AI prompt includes mounting rules
3. Check console for AI API errors
4. Regenerate BOQ

### Issue 2: Costing Button Disabled
**Symptom**: "Generate Pricing" button is grayed out

**Cause**: BOQ not generated yet

**Solution**:
1. Navigate to BOQ tab
2. Click "AI Assisted BOQ Generation"
3. Wait for completion
4. Return to Project Costing tab

### Issue 3: Pricing Shows $0 or Missing
**Symptom**: AI returns incomplete pricing

**Solution**:
1. Check API key in `.env`:
   ```
   VITE_OPENROUTER_API_KEY=your_key_here
   ```
2. Verify API has credits
3. Check console for API errors
4. Retry generation

### Issue 4: Incorrect Fixed Prices
**Symptom**: PV/Inverter prices don't match specification

**Check**:
- PV Modules: $150/kW
- Hybrid Inverter: $100/kW
- PV Inverter: $70/kW
- Battery Inverter: $65/kW

**Solution**: These are hardcoded in prompt, not AI-generated. If wrong, check inverter capacity calculation.

---

## API Usage & Costs

### DeepSeek v3.1 via OpenRouter

**Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
**Model**: `deepseek/deepseek-chat`

**Token Usage**:
- **BOQ Generation**: ~2000-3000 tokens output
- **Pricing Generation**: ~2000-3000 tokens output
- **Total per project**: ~5000-6000 tokens

**Estimated Cost** (as of 2025):
- DeepSeek: $0.14 per 1M input tokens, $0.28 per 1M output tokens
- **Per project**: ~$0.002 (very low cost)

---

## Future Enhancements

### Potential Improvements:

1. **Currency Selection**
   - Allow user to select currency (USD, EUR, INR)
   - Auto-convert using exchange rates

2. **Region-Specific Pricing**
   - Dropdown for region selection
   - Different pricing databases per region

3. **Manual Price Override**
   - Allow user to edit AI-generated prices
   - Mark edited items

4. **Price Comparison**
   - Show price ranges (min/max/avg)
   - Compare with historical data

5. **Export Pricing**
   - Export to PDF/Excel
   - Include itemized pricing with specs

6. **Batch Pricing**
   - Generate pricing for multiple scenarios
   - Compare costs across configurations

---

## Summary

✅ **Mounting Structure**: AI-generated with formulas, standards, and mounting type variations  
✅ **Project Costing**: New tab with AI-powered market-based pricing  
✅ **Fixed Pricing**: PV modules & inverters at specified rates  
✅ **AI Pricing**: All BOS components with realistic 2025 market prices  
✅ **Regional Focus**: South East Asia & East Asia markets  
✅ **Integration**: Seamless data flow from PV Sizing → BOQ → Costing

---

**Implementation Complete! Test by generating BOQ with mounting structure, then navigate to Project Costing tab to see AI-powered pricing! 🚀💰**

