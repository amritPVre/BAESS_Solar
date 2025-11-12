# Current AI BOQ Prompt - BESS Designer

## Overview
This document contains the exact AI prompt currently used for generating Balance of System (BOS) components in the BOQ.

---

## AI Model Configuration

**Provider**: OpenRouter  
**Model**: `deepseek/deepseek-chat`  
**Temperature**: 0.7  
**Max Tokens**: 2000  

---

## Current Prompt Template

### System Role
```
You are an electrical engineer creating a Bill of Quantities (BOQ) for a Solar PV + Battery Energy Storage System (BESS) project.
```

### Project Context Variables
```javascript
const projectContext = {
  pvCapacity: '8.82 kW',                    // Calculated: totalModules × pvModulePower / 1000
  batteryCapacity: '23.04 kWh',             // Calculated: numberOfBatteries × batteryCapacity
  batteryTechnology: 'NMC',                 // From batterySelection.technology
  numberOfBatteries: 3,                     // Calculated from series × parallel or manual
  singleBatteryVoltage: 51.2,               // From selectedBattery.voltage
  singleBatteryCapacity: 7.68,              // From selectedBattery.capacity
  batteriesInSeries: 3,                     // From batterySelection.batteriesInSeries
  batteriesInParallel: 1,                   // From batterySelection.batteriesInParallel
  couplingType: 'DC',                       // DC or AC coupling
  inverterCount: 1,                         // Number of inverters
  projectType: 'Residential'                // TODO: Currently hardcoded
};
```

### Full Prompt
```
You are an electrical engineer creating a Bill of Quantities (BOQ) for a Solar PV + Battery Energy Storage System (BESS) project.

Project Details:
- PV System: ${projectContext.pvCapacity}
- Battery System: ${projectContext.batteryCapacity} (${projectContext.batteryTechnology})
- Number of Batteries: ${projectContext.numberOfBatteries}
- Single Battery: ${projectContext.singleBatteryCapacity} kWh, ${projectContext.singleBatteryVoltage}V
- Battery Configuration: ${projectContext.batteriesInSeries} in series × ${projectContext.batteriesInParallel} in parallel
- System Type: ${projectContext.couplingType} coupled
- Inverters: ${projectContext.inverterCount}
- Project Type: ${projectContext.projectType}

Please generate a detailed BOQ for the following items:

1. Battery Racking System:
   - Analyze the battery specifications (${projectContext.numberOfBatteries} units of ${projectContext.singleBatteryCapacity}kWh ${projectContext.singleBatteryVoltage}V ${projectContext.batteryTechnology} batteries)
   - For LFP/NMC batteries: Estimate 4-6 batteries per rack
   - For Lead Acid batteries: Estimate 2-4 batteries per rack
   - Calculate number of racks needed
   - Specify: Steel rack system with dimensions (e.g., 1200×800×2000mm), load capacity, includes structural steel, mounting brackets, bolts, leveling pads, anti-corrosive powder coating
   - Provide unit as "Set" and quantity as number of rack sets

2. Earthing System components:
   - Earth electrodes (copper/GI, with specifications)
   - Earth pits with inspection chambers
   - GI strips for earth continuity
   - Copper bonding cables
   - Earth terminations and clamps
   - Specify quantities based on system size

3. Lightning Protection System:
   - Lightning arrestors for PV array
   - Surge Protection Devices (SPD) for AC/DC side with ratings
   - Down conductors
   - Earth terminations
   - Specify quantities and ratings

4. Cable Management:
   - Cable trays (GI, perforated) with sizes based on cable quantities
   - PVC conduits with sizes
   - Cable glands for different cable sizes
   - Cable markers and identification tags
   - Cable ties and accessories
   - Specify lengths and quantities

5. AC/DC Distribution Boxes:
   - DCDB (DC Distribution Box) with internal components, IP rating, material
   - ACDB (AC Distribution Box) with MCBs, isolators
   - MCB ratings and quantities for different circuits
   - Isolator switches with ratings
   - Fuses and bus bars
   - Specify ratings and quantities based on system capacity

6. Other Electrical BOS items specific to ${projectContext.projectType} installations

For each item, provide:
- Description (clear and specific)
- Technical specification (detailed specs with ratings, dimensions, materials)
- Unit of measurement (Nos/Mtrs/Set/Lumpsum)
- Estimated quantity (calculate based on system size, use "-" only for truly lumpsum items)

Return ONLY a valid JSON array with this structure:
[
  {
    "description": "item description",
    "specification": "technical specs",
    "unit": "unit type (Nos/Mtrs/Set/Lumpsum)",
    "qty": number or "-" for lumpsum
  }
]

Be specific with quantities and technical specifications. Do not include items already in the major components list (solar panels, batteries, inverters, major AC/DC cables from PV to inverter or battery to inverter).
```

---

## Example Prompt with Real Values

```
You are an electrical engineer creating a Bill of Quantities (BOQ) for a Solar PV + Battery Energy Storage System (BESS) project.

Project Details:
- PV System: 8.82 kW
- Battery System: 23.04 kWh (NMC)
- Number of Batteries: 3
- Single Battery: 7.68 kWh, 51.2V
- Battery Configuration: 3 in series × 1 in parallel
- System Type: DC coupled
- Inverters: 1
- Project Type: Residential

Please generate a detailed BOQ for the following items:

1. Battery Racking System:
   - Analyze the battery specifications (3 units of 7.68kWh 51.2V NMC batteries)
   - For LFP/NMC batteries: Estimate 4-6 batteries per rack
   - For Lead Acid batteries: Estimate 2-4 batteries per rack
   - Calculate number of racks needed
   - Specify: Steel rack system with dimensions (e.g., 1200×800×2000mm), load capacity, includes structural steel, mounting brackets, bolts, leveling pads, anti-corrosive powder coating
   - Provide unit as "Set" and quantity as number of rack sets

2. Earthing System components:
   - Earth electrodes (copper/GI, with specifications)
   - Earth pits with inspection chambers
   - GI strips for earth continuity
   - Copper bonding cables
   - Earth terminations and clamps
   - Specify quantities based on system size

3. Lightning Protection System:
   - Lightning arrestors for PV array
   - Surge Protection Devices (SPD) for AC/DC side with ratings
   - Down conductors
   - Earth terminations
   - Specify quantities and ratings

4. Cable Management:
   - Cable trays (GI, perforated) with sizes based on cable quantities
   - PVC conduits with sizes
   - Cable glands for different cable sizes
   - Cable markers and identification tags
   - Cable ties and accessories
   - Specify lengths and quantities

5. AC/DC Distribution Boxes:
   - DCDB (DC Distribution Box) with internal components, IP rating, material
   - ACDB (AC Distribution Box) with MCBs, isolators
   - MCB ratings and quantities for different circuits
   - Isolator switches with ratings
   - Fuses and bus bars
   - Specify ratings and quantities based on system capacity

6. Other Electrical BOS items specific to Residential installations

For each item, provide:
- Description (clear and specific)
- Technical specification (detailed specs with ratings, dimensions, materials)
- Unit of measurement (Nos/Mtrs/Set/Lumpsum)
- Estimated quantity (calculate based on system size, use "-" only for truly lumpsum items)

Return ONLY a valid JSON array with this structure:
[
  {
    "description": "item description",
    "specification": "technical specs",
    "unit": "unit type (Nos/Mtrs/Set/Lumpsum)",
    "qty": number or "-" for lumpsum
  }
]

Be specific with quantities and technical specifications. Do not include items already in the major components list (solar panels, batteries, inverters, major AC/DC cables from PV to inverter or battery to inverter).
```

---

## Example AI Response

```json
[
  {
    "description": "Battery Racking System",
    "specification": "Steel rack system, 1200×800×2000mm, 500kg load capacity, includes structural steel, mounting brackets, bolts, leveling pads, anti-corrosive powder coating",
    "unit": "Set",
    "qty": 1
  },
  {
    "description": "Earth Electrodes",
    "specification": "Copper bonded earth electrode, 14mm dia × 3000mm length, IS 3043",
    "unit": "Nos",
    "qty": 4
  },
  {
    "description": "Earth Pits with Inspection Chambers",
    "specification": "600×600×600mm masonry earth pit with GI cover, complete with charcoal & salt filling",
    "unit": "Nos",
    "qty": 4
  },
  {
    "description": "GI Strip for Earthing",
    "specification": "50×6mm GI flat strip for earth continuity",
    "unit": "Mtrs",
    "qty": 30
  },
  {
    "description": "Copper Bonding Cables",
    "specification": "70mm² bare copper cable for equipment bonding",
    "unit": "Mtrs",
    "qty": 20
  },
  {
    "description": "Lightning Arrestor for PV Array",
    "specification": "DC surge arrestor, 1000V, 40kA, Type 2, suitable for solar applications",
    "unit": "Nos",
    "qty": 1
  },
  {
    "description": "AC Surge Protection Device (SPD)",
    "specification": "SPD Type 1+2, 3-phase, 400V, 40kA, with remote indication",
    "unit": "Nos",
    "qty": 1
  },
  {
    "description": "DC Surge Protection Device (SPD)",
    "specification": "DC SPD, 600V, 40kA, suitable for battery systems",
    "unit": "Nos",
    "qty": 1
  },
  {
    "description": "Cable Tray - Perforated GI",
    "specification": "200mm wide × 50mm depth perforated GI cable tray with fittings",
    "unit": "Mtrs",
    "qty": 15
  },
  {
    "description": "PVC Conduit",
    "specification": "32mm dia heavy duty PVC conduit with fittings",
    "unit": "Mtrs",
    "qty": 10
  },
  {
    "description": "Cable Glands",
    "specification": "Brass cable glands, various sizes (16mm to 32mm)",
    "unit": "Set",
    "qty": 1
  },
  {
    "description": "Cable Markers & Identification Tags",
    "specification": "PVC cable markers with numbering, UV resistant",
    "unit": "Set",
    "qty": 1
  },
  {
    "description": "DCDB (DC Distribution Box)",
    "specification": "DCDB with DC MCBs, isolators, SPDs, IP65 rated, polycarbonate enclosure, 6-string configuration",
    "unit": "Nos",
    "qty": 1
  },
  {
    "description": "ACDB (AC Distribution Box)",
    "specification": "ACDB with MCBs, isolators, metering section, IP65 rated, steel enclosure",
    "unit": "Nos",
    "qty": 1
  },
  {
    "description": "MCB - DC (for PV strings)",
    "specification": "DC MCB, 2-pole, 16A, 1000V DC, C-curve",
    "unit": "Nos",
    "qty": 3
  },
  {
    "description": "MCB - AC (for inverter output)",
    "specification": "AC MCB, 4-pole, 25A, 400V AC, C-curve",
    "unit": "Nos",
    "qty": 1
  },
  {
    "description": "DC Isolator Switch",
    "specification": "4-pole DC isolator, 32A, 1000V DC, rotary type with lockable handle",
    "unit": "Nos",
    "qty": 1
  },
  {
    "description": "AC Isolator Switch",
    "specification": "4-pole AC isolator, 40A, 415V AC, rotary type",
    "unit": "Nos",
    "qty": 1
  }
]
```

---

## Current Issues & Limitations

### 1. **Missing Context**
- ❌ No inverter details (model, AC output current, voltage)
- ❌ No cable sizing details (to estimate cable gland sizes, tray widths)
- ❌ No PV module count or string configuration (for DCDB sizing)
- ❌ No site location/climate (for earthing, lightning protection requirements)
- ❌ No regulatory standards (IEC/IS/NEC)

### 2. **Vague Instructions**
- "Specify quantities based on system size" - Too generic
- "Specify lengths and quantities" - No calculation guidance
- "Other Electrical BOS items" - Too open-ended

### 3. **Inconsistent Quantities**
- AI may return "1 Set" for multiple items that should have specific quantities
- Cable tray length not based on actual cable routing
- MCB quantities may not match actual circuit requirements

### 4. **Missing Item Types**
- ❌ Fuse holders and fuses (DC and AC side)
- ❌ Bus bars (copper, with ratings)
- ❌ Neutral links and earth bars
- ❌ Cable lugs and ferrules
- ❌ Mounting channels and support brackets
- ❌ Warning signage and labels
- ❌ Fire extinguishers (specific to solar/battery installations)

### 5. **Specification Gaps**
- No IP ratings for outdoor equipment
- No material grades (e.g., SS304, SS316 for coastal areas)
- No standard compliance (IS, IEC, UL)
- No brand preferences or equivalents

---

## What Could Be Improved

### Add More Context Variables
```javascript
// Additional context needed:
{
  // Inverter details
  inverterModel: 'SUN2000-12K-MB0',
  inverterACVoltage: 400,
  inverterACCurrent: 18.23,
  
  // PV details
  pvStrings: 3,
  modulesPerString: 14,
  
  // Cable details
  dcCableSizes: [6, 10], // mm²
  acCableSizes: [120],
  
  // Site details
  location: 'Chinsurah, West Bengal',
  climate: 'Tropical',
  soilType: 'Clay',
  
  // Standards
  standards: ['IEC', 'IS'],
  country: 'India'
}
```

### More Specific Instructions
Instead of:
```
"Specify quantities based on system size"
```

Use:
```
"Calculate earth electrodes: 1 per 5kW of system capacity, minimum 2"
"Calculate GI strip length: Perimeter of installation + 20% extra"
"Calculate cable tray length: Total cable length / 5 (average cable bundling)"
```

### Define Calculation Rules
```
Battery Racking:
- For 3 batteries: 1 rack (capacity 4-6 batteries)
- For 7 batteries: 2 racks
- Rack dimensions based on battery size:
  - 48V 100Ah (small): 800×600×1800mm
  - 48V 200Ah (medium): 1200×800×2000mm
  - High voltage (>200V): 1500×1000×2200mm

Earthing System:
- Earth electrodes: 1 per 5kW PV + 1 per inverter, minimum 2
- Earth pits: Equal to number of electrodes
- GI strip: Installation perimeter × 1.2
- Bonding cable: Number of equipment × 3m average

Lightning Protection:
- For ground-mount < 10kW: 1 DC arrestor
- For roof-mount or > 10kW: 2 DC arrestors
- AC SPDs: 1 per inverter (Type 1+2 for main, Type 2 for each inverter)
```

---

## Next Steps for Fine-Tuning

1. **Review AI_BOQ_PROMPT_ENHANCED.md** - See improved version
2. **Test with sample projects** - Residential, Commercial, Industrial
3. **Compare AI output vs manual BOQ** - Identify gaps
4. **Iterate on instructions** - Add specific calculation rules
5. **Add examples** - Show AI what good output looks like

---

**File Location**: `src/pages/BESSDesigner.tsx` (Line 4018-4089)  
**Last Updated**: January 2025  
**Status**: Active, ready for fine-tuning

