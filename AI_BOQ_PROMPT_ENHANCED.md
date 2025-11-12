# Enhanced AI BOQ Prompt - Fine-Tuned Version

## Overview
This is an **enhanced, fine-tuned version** of the AI prompt with more specific instructions, calculation rules, and better context for generating accurate BOQ items.

---

## Enhanced Prompt Template

### System Role (Enhanced)
```
You are a senior electrical engineer with 15+ years of experience in Solar PV + Battery Energy Storage Systems. You are creating a detailed Bill of Quantities (BOQ) following IEC and Indian Standards (IS). Your BOQ must be accurate, detailed, and ready for procurement and installation.
```

### Enhanced Project Context
```javascript
const projectContext = {
  // PV System
  pvCapacity: '8.82 kW',
  pvStrings: 3,
  modulesPerString: 14,
  totalModules: 42,
  
  // Battery System
  batteryCapacity: '23.04 kWh',
  batteryTechnology: 'NMC',
  numberOfBatteries: 3,
  singleBatteryVoltage: 51.2,
  singleBatteryCapacity: 7.68,
  batteriesInSeries: 3,
  batteriesInParallel: 1,
  totalPackVoltage: 153.6, // 51.2 × 3
  maxBatteryCurrent: 150, // From battery specs
  
  // Inverter System
  couplingType: 'DC',
  inverterModel: 'SUN2000-12K-MB0',
  inverterCount: 1,
  inverterPowerKW: 12,
  inverterACVoltage: 400,
  inverterACCurrent: 18.23,
  inverterPhase: '3-Phase',
  
  // Cable Sizing Results
  dcPvCableSize: 6, // mm²
  dcBatteryCableSize: 10, // mm²
  acCableSize: 120, // mm²
  
  // Site Information
  projectType: 'Residential',
  location: 'Chinsurah, West Bengal',
  climate: 'Tropical',
  installationType: 'Ground-mount', // or Roof-mount
  
  // Standards
  standards: ['IEC 62446', 'IS 16221', 'CEA Regulations'],
  country: 'India'
};
```

### Enhanced Prompt with Calculation Rules

```
You are a senior electrical engineer with 15+ years of experience in Solar PV + Battery Energy Storage Systems. You are creating a detailed Bill of Quantities (BOQ) following IEC and Indian Standards (IS). Your BOQ must be accurate, detailed, and ready for procurement and installation.

PROJECT DETAILS:
==================
PV System:
- Capacity: ${projectContext.pvCapacity}
- Configuration: ${projectContext.pvStrings} strings × ${projectContext.modulesPerString} modules = ${projectContext.totalModules} modules total

Battery System:
- Total Capacity: ${projectContext.batteryCapacity}
- Technology: ${projectContext.batteryTechnology}
- Number of Batteries: ${projectContext.numberOfBatteries}
- Single Battery: ${projectContext.singleBatteryCapacity} kWh, ${projectContext.singleBatteryVoltage}V
- Configuration: ${projectContext.batteriesInSeries} in series × ${projectContext.batteriesInParallel} in parallel
- Pack Voltage: ${projectContext.totalPackVoltage}V
- Max Current: ${projectContext.maxBatteryCurrent}A

Inverter System:
- Type: ${projectContext.couplingType} coupled (Hybrid inverter)
- Model: ${projectContext.inverterModel}
- Quantity: ${projectContext.inverterCount}
- Power Rating: ${projectContext.inverterPowerKW} kW
- AC Output: ${projectContext.inverterACVoltage}V, ${projectContext.inverterPhase}, ${projectContext.inverterACCurrent}A

Cables Designed:
- DC PV Cable: ${projectContext.dcPvCableSize}mm²
- DC Battery Cable: ${projectContext.dcBatteryCableSize}mm²
- AC Output Cable: ${projectContext.acCableSize}mm²

Site Information:
- Project Type: ${projectContext.projectType}
- Location: ${projectContext.location}, ${projectContext.country}
- Climate: ${projectContext.climate}
- Installation: ${projectContext.installationType}
- Standards: ${projectContext.standards.join(', ')}

GENERATE DETAILED BOQ FOR THE FOLLOWING ITEMS:
==============================================

1. BATTERY RACKING SYSTEM
   Requirements:
   - Number of batteries to accommodate: ${projectContext.numberOfBatteries} units
   - Battery technology: ${projectContext.batteryTechnology}
   - Battery dimensions (typical for ${projectContext.singleBatteryVoltage}V ${projectContext.singleBatteryCapacity}kWh):
     * 48-52V 100-200Ah: 450×170×220mm, 25-30kg each
   
   Calculation Rules:
   - LFP/NMC batteries: 4-6 batteries per rack (use 5 as default)
   - Lead Acid batteries: 2-4 batteries per rack (use 3 as default)
   - Number of racks = ROUNDUP(${projectContext.numberOfBatteries} / batteries_per_rack)
   
   Generate SEPARATE line items for:
   a) Battery Rack Structure
      - Description: "Battery Racking System - Steel Structure"
      - Specification: "MS steel rack with powder coating, [Width]×[Depth]×[Height]mm, load capacity [X]kg, includes base frame, vertical posts, horizontal rails, adjustable shelves"
      - Calculate dimensions:
        * Width: (number of batteries per rack) × 500mm
        * Depth: 800mm (standard)
        * Height: 2000mm (for 2-tier) or 1200mm (for single-tier)
        * Load capacity: (batteries per rack × weight per battery) × 1.5 safety factor
      - Unit: "Set"
      - Qty: Calculate racks needed
   
   b) Rack Accessories Kit
      - Description: "Battery Rack Installation Kit"
      - Specification: "SS bolts (M10×100mm), nuts, washers, anchor bolts (M12×150mm), leveling pads (rubber, 100×100mm), anti-vibration mounts"
      - Unit: "Set"
      - Qty: Same as number of racks
   
   c) Bus Bars for Battery Interconnection
      - Description: "Copper Bus Bars for Battery Interconnection"
      - Specification: "Copper bus bar, 10×3mm, tinned, with insulated cover, suitable for ${projectContext.singleBatteryVoltage}V systems, current rating ${projectContext.maxBatteryCurrent}A"
      - Calculate qty: (number of batteries - 1) × 2 (for series connections) × batteries in parallel
      - Unit: "Nos"

2. EARTHING SYSTEM
   Calculation Rules:
   - Earth electrodes: ROUNDUP(PV_capacity_kW / 5) + inverter_count, minimum 2
   - Earth pits: Equal to number of electrodes
   - GI strip: Estimated installation perimeter × 1.2 (for ${projectContext.projectType}: 40m base + 5m per kW)
   - Bonding cable: (Number of equipment items × 3m) + 20% extra
     Equipment count: Inverters + DCDB + ACDB + PV structure + Battery rack = ${projectContext.inverterCount} + 1 + 1 + 1 + [racks]
   
   Generate SEPARATE line items for:
   a) Earth Electrodes
      - Description: "Copper Bonded Earth Electrodes"
      - Specification: "Copper bonded earth electrode, 14.2mm dia × 3000mm length, 254 micron copper coating, as per IS 3043"
      - Unit: "Nos"
      - Qty: Calculate as per rule above
   
   b) Earth Pits with Inspection Chambers
      - Description: "Earthing Pits with Inspection Chambers"
      - Specification: "600×600×600mm masonry earth pit with 600×600mm GI cover, complete with charcoal (25kg) & salt (10kg) filling, inspection chamber"
      - Unit: "Nos"
      - Qty: Same as electrodes
   
   c) GI Strip for Earth Continuity
      - Description: "GI Strip for Earthing"
      - Specification: "50×6mm GI flat strip, 275 g/m² zinc coating, as per IS 2629"
      - Unit: "Mtrs"
      - Qty: Calculate as per rule above
   
   d) Copper Bonding Cable
      - Description: "Bare Copper Cable for Equipment Bonding"
      - Specification: "70mm² bare copper cable, electrolytic grade, 99.9% purity, flexible"
      - Unit: "Mtrs"
      - Qty: Calculate as per rule above
   
   e) Earth Clamps and Lugs
      - Description: "Earth Clamps and Lugs Set"
      - Specification: "Bronze/copper earth clamps (25mm to 70mm²), cable lugs, nuts & bolts, waterproof compound"
      - Unit: "Set"
      - Qty: 1
   
   f) Earth Resistance Testing
      - Description: "Earth Pit Testing & Commissioning"
      - Specification: "Earth resistance testing using 3-pole method, earth audit report as per IS 3043"
      - Unit: "Lumpsum"
      - Qty: "-"

3. LIGHTNING PROTECTION SYSTEM
   Calculation Rules:
   - DC Lightning Arrestors: 1 per inverter for < 10kW, 2 for > 10kW
   - AC SPD (Type 1+2): 1 in main distribution board
   - AC SPD (Type 2): 1 per inverter (at inverter AC output)
   - DC SPD: 1 for PV array, 1 for battery bank
   - Down conductors: 2 minimum for ground-mount, 4 for roof-mount
   
   Generate SEPARATE line items for:
   a) DC Lightning Arrestor - PV Side
      - Description: "DC Surge Protection Device - PV Array"
      - Specification: "SPD Type 2, 1000V DC, 40kA (8/20μs), Uc: 1000V, Up: <2.5kV, with remote indication contact, IP65, as per IEC 61643-11"
      - Unit: "Nos"
      - Qty: Calculate based on rules (1 or 2)
   
   b) DC SPD - Battery Side
      - Description: "DC Surge Protection Device - Battery Bank"
      - Specification: "SPD Type 2, ${projectContext.totalPackVoltage}V DC (max), 40kA (8/20μs), suitable for battery systems, with visual indication"
      - Unit: "Nos"
      - Qty: 1
   
   c) AC SPD - Main Distribution
      - Description: "AC Surge Protection Device - Type 1+2"
      - Specification: "SPD Type 1+2 (combined), 3-phase + N, 400V AC, Iimp: 12.5kA (10/350μs), Imax: 40kA (8/20μs), Up: <1.5kV, remote indication, as per IEC 61643-11"
      - Unit: "Nos"
      - Qty: 1
   
   d) AC SPD - Inverter Output
      - Description: "AC Surge Protection Device - Type 2 (Inverter)"
      - Specification: "SPD Type 2, 3-phase, 400V AC, 40kA (8/20μs), Up: <1.2kV, DIN rail mount"
      - Unit: "Nos"
      - Qty: ${projectContext.inverterCount}
   
   e) Down Conductors
      - Description: "Lightning Down Conductors"
      - Specification: "50mm² bare copper conductor, flexible, with PVC pipe protection (32mm), fixing clamps every 1m"
      - Calculate length: 
        * Ground-mount: Average structure height (3m) × 2 locations = 6m
        * Roof-mount: Average height (6m) × 4 locations = 24m
      - Unit: "Mtrs"
      - Qty: Calculate
   
   f) Air Termination Rods
      - Description: "Lightning Air Termination Rods"
      - Specification: "Copper air terminal rod, 12mm dia × 1500mm length, with mounting bracket, as per IS/IEC 62305"
      - Unit: "Nos"
      - Qty: 2 for ground-mount, 4 for roof-mount

4. CABLE MANAGEMENT SYSTEM
   Calculation Rules:
   - Cable tray width selection:
     * For DC cables (6-10mm²): 100mm width
     * For AC cables (95-185mm²): 200mm width
     * For mixed: 300mm width
   - Cable tray length: 
     * PV to inverter distance + Inverter to distribution board + 20% extra
     * Estimated for ${projectContext.projectType}: 15m + 10m + 5m = 30m
   - PVC conduit: 30% of cable tray length (for underground/concealed sections)
   - Cable glands: (DC cables: 2 per string × strings) + (AC cables: 4 per inverter) + (Battery: 2)
   
   Generate SEPARATE line items for:
   a) Cable Tray - Perforated GI (Main Runs)
      - Description: "Cable Tray - Perforated GI (Main Distribution)"
      - Specification: "200mm wide × 50mm depth × 0.8mm thick perforated GI cable tray, with powder coating, includes bends, tees, risers, support brackets @1.5m"
      - Unit: "Mtrs"
      - Qty: 20m (main AC/DC runs)
   
   b) Cable Tray - Perforated GI (PV String Runs)
      - Description: "Cable Tray - Perforated GI (PV Strings)"
      - Specification: "100mm wide × 50mm depth × 0.8mm thick perforated GI cable tray, with powder coating, includes bends, support brackets @1.5m"
      - Unit: "Mtrs"
      - Qty: 10m (PV array to combiner/inverter)
   
   c) PVC Conduit - Heavy Duty
      - Description: "PVC Conduit - Heavy Duty"
      - Specification: "32mm dia heavy duty PVC conduit (3mm wall thickness), ISI marked, UV stabilized, with bends, junctions, saddles"
      - Unit: "Mtrs"
      - Qty: Calculate (30% of cable tray length, min 10m)
   
   d) Cable Glands - Brass (Various Sizes)
      - Description: "Brass Cable Glands"
      - Specification: "Brass cable glands with locknut and washer, IP68, sizes: 16mm (for 6mm² cables), 20mm (for 10mm² cables), 50mm (for ${projectContext.acCableSize}mm² cables)"
      - Calculate:
        * 16mm glands: ${projectContext.pvStrings} × 2 (for DC PV) = [X] nos
        * 20mm glands: 2 (for DC battery)
        * 50mm glands: 4 (for AC output)
      - Unit: "Lot"
      - Qty: 1 lot (specify quantities in specification)
   
   e) Cable Markers and Identification
      - Description: "Cable Identification System"
      - Specification: "PVC cable markers (pre-printed: L1/L2/L3/N/E, DC+/DC-, custom labels), cable tags (weatherproof), UV resistant, as per IEC 60445"
      - Unit: "Set"
      - Qty: 1
   
   f) Cable Ties and Accessories
      - Description: "Cable Management Accessories"
      - Specification: "Nylon cable ties (various sizes: 100mm, 200mm, 350mm), cable cleats, P-clips, J-hooks, spiral wraps"
      - Unit: "Set"
      - Qty: 1

5. AC/DC DISTRIBUTION BOXES
   DCDB Configuration:
   - Number of input circuits: ${projectContext.pvStrings} (PV strings) + ${projectContext.batteriesInParallel} (battery strings)
   - DC MCB rating for PV: String current × 1.25, standard: 16A or 20A
   - DC MCB rating for battery: ${projectContext.maxBatteryCurrent}A × 1.25
   - Main DC isolator: Sum of all currents × 1.25
   - SPD: As per lightning protection
   
   ACDB Configuration:
   - Input from inverter: ${projectContext.inverterACCurrent}A × 1.25 = ${(projectContext.inverterACCurrent * 1.25).toFixed(1)}A
   - MCB rating: Next standard rating (25A, 32A, 40A, 63A)
   - Isolator rating: MCB rating + 20%
   
   Generate SEPARATE line items for:
   
   a) DCDB - Complete Assembly
      - Description: "DC Distribution Box (DCDB) - Complete"
      - Specification: "DCDB for ${projectContext.pvStrings}-string PV system with battery, IP65 rated, polycarbonate/mild steel enclosure with powder coating, wall-mounted, 600×400×250mm (H×W×D), includes DIN rail, neutral & earth bus bars, cable entry glands, lock & key, as per IEC 60670"
      - Unit: "Nos"
      - Qty: 1
   
   b) DC MCB - PV String Protection
      - Description: "DC Miniature Circuit Breaker - PV Strings"
      - Specification: "DC MCB, 2-pole, 16A, 1000V DC, C-curve, 6kA breaking capacity, DIN rail mount, as per IEC 60947-2"
      - Unit: "Nos"
      - Qty: ${projectContext.pvStrings}
   
   c) DC MCB - Battery String Protection
      - Description: "DC Miniature Circuit Breaker - Battery"
      - Specification: "DC MCB, 2-pole, ${Math.ceil(projectContext.maxBatteryCurrent * 1.25 / 10) * 10}A, 1000V DC, C-curve, 10kA breaking capacity"
      - Unit: "Nos"
      - Qty: ${projectContext.batteriesInParallel}
   
   d) DC Isolator Switch - Main
      - Description: "DC Isolator Switch - Main"
      - Specification: "4-pole rotary DC isolator, ${Math.ceil((projectContext.pvStrings * 10 + projectContext.maxBatteryCurrent) * 1.25 / 10) * 10}A, 1000V DC, IP65, with lockable red/yellow handle, door-coupled mechanism"
      - Unit: "Nos"
      - Qty: 1
   
   e) DC Fuse - PV String (Optional but recommended)
      - Description: "DC Fuse Holders with Fuses - PV"
      - Specification: "gPV fuse holder (DIN rail) with 10×38mm gPV fuses, 15A, 1000V DC, as per IEC 60269-6"
      - Unit: "Nos"
      - Qty: ${projectContext.pvStrings}
   
   f) ACDB - Complete Assembly
      - Description: "AC Distribution Box (ACDB) - Complete"
      - Specification: "ACDB for ${projectContext.inverterPhase} inverter output, IP65 rated, mild steel enclosure (1.6mm) with powder coating, wall-mounted, 500×400×200mm (H×W×D), includes DIN rail, neutral bar, earth bar, metering section, cable entry glands, lock & key"
      - Unit: "Nos"
      - Qty: 1
   
   g) AC MCB - Inverter Output Protection
      - Description: "AC Miniature Circuit Breaker - Inverter"
      - Specification: "AC MCB, 4-pole (3P+N), ${Math.ceil(projectContext.inverterACCurrent * 1.25 / 5) * 5}A, 400V AC, C-curve, 10kA breaking capacity, as per IEC 60898"
      - Unit: "Nos"
      - Qty: ${projectContext.inverterCount}
   
   h) AC Isolator Switch
      - Description: "AC Isolator Switch - Main"
      - Specification: "4-pole rotary AC isolator, ${Math.ceil(projectContext.inverterACCurrent * 1.5 / 10) * 10}A, 415V AC, IP65, with lockable handle, door-coupled mechanism"
      - Unit: "Nos"
      - Qty: 1
   
   i) Energy Meter - Bidirectional
      - Description: "Bidirectional Energy Meter"
      - Specification: "3-phase bidirectional energy meter, ${projectContext.inverterACCurrent}A, with Modbus RTU/RS485 output, LCD display, pulse output, DIN rail mount, as per IS 16444"
      - Unit: "Nos"
      - Qty: 1
   
   j) Current Transformers (if required)
      - Description: "Current Transformers for Metering"
      - Specification: "Split-core CT, ${Math.ceil(projectContext.inverterACCurrent * 1.5 / 50) * 50}A/5A, Class 0.5S, burden 5VA"
      - Unit: "Nos"
      - Qty: 3 (for 3-phase)
   
   k) Bus Bars - Copper
      - Description: "Copper Bus Bars for Distribution"
      - Specification: "Electrolytic copper bus bar, 25×5mm, current rating ${projectContext.inverterACCurrent}A, with insulators and supports"
      - Unit: "Mtrs"
      - Qty: 2m (for ACDB)
   
   l) Neutral Link and Earth Bar
      - Description: "Neutral Link and Earth Bar"
      - Specification: "Brass neutral link (12-way) and copper earth bar (12-way) with insulated cover, DIN rail mount"
      - Unit: "Set"
      - Qty: 1

6. PROTECTIVE EQUIPMENT AND SAFETY
   Generate line items for:
   
   a) Warning Signs and Labels
      - Description: "Safety Signage and Warning Labels"
      - Specification: "UV resistant PVC signs: 'DANGER - HIGH VOLTAGE', 'DC ISOLATOR', 'AC ISOLATOR', 'EARTH CONNECTION', 'BATTERY HAZARD', single line diagram label, as per IS 2551"
      - Unit: "Set"
      - Qty: 1
   
   b) Fire Extinguisher - CO2
      - Description: "CO2 Fire Extinguisher"
      - Specification: "4.5kg CO2 type fire extinguisher, suitable for electrical fires (Class E), ISI marked, with wall mounting bracket, as per IS 15683"
      - Unit: "Nos"
      - Qty: 1
   
   c) First Aid Kit
      - Description: "First Aid Kit for Electrical Installation"
      - Specification: "First aid box with electrical burn treatment supplies, as per Factory Act requirements"
      - Unit: "Nos"
      - Qty: 1
   
   d) Arc Flash Protection Kit (for systems > 10kW)
      - Description: "Personal Protective Equipment (PPE) Kit"
      - Specification: "Arc flash PPE: insulated gloves (1000V), safety goggles, face shield, insulated tools set"
      - Unit: "Set"
      - Qty: 1

7. INSTALLATION MATERIALS AND CONSUMABLES
   Generate line items for:
   
   a) Cable Lugs and Ferrules
      - Description: "Cable Lugs and Ferrules Set"
      - Specification: "Copper cable lugs (tinned): 6mm² (ring type), 10mm² (ring type), ${projectContext.acCableSize}mm² (compression type), ferrules (bootlace) for control wiring, with crimping die"
      - Unit: "Set"
      - Qty: 1
   
   b) Heat Shrink Tubes
      - Description: "Heat Shrink Tubing Kit"
      - Specification: "3:1 ratio adhesive-lined heat shrink tubes, various sizes (6mm to 50mm dia), various colors, polyolefin"
      - Unit: "Set"
      - Qty: 1
   
   c) Electrical Tape and Insulation
      - Description: "Insulation Materials"
      - Specification: "PVC electrical tape (ISI marked), self-amalgamating tape, heat-resistant tape, various colors"
      - Unit: "Set"
      - Qty: 1
   
   d) Duct Sealing Compound
      - Description: "Duct Sealing and Waterproofing Compound"
      - Specification: "Fire-retardant duct sealing compound, silicon sealant (electrical grade), PU foam (fire-rated)"
      - Unit: "Set"
      - Qty: 1
   
   e) Anti-Corrosion Coating
      - Description: "Anti-Corrosion Treatment"
      - Specification: "Zinc-rich primer, epoxy-based anti-corrosion coating for metal surfaces, rust converter"
      - Unit: "Set"
      - Qty: 1

8. TESTING AND COMMISSIONING
   Generate line items for:
   
   a) System Testing and Commissioning
      - Description: "System Testing and Commissioning Services"
      - Specification: "Complete system testing including insulation resistance test, earth continuity test, polarity test, functional test of all protection devices, performance testing as per IEC 62446, commissioning report"
      - Unit: "Lumpsum"
      - Qty: "-"
   
   b) As-Built Drawings and Documentation
      - Description: "As-Built Documentation"
      - Specification: "As-built drawings (AutoCAD format), single line diagrams, cable schedule, equipment datasheets, O&M manual, safety procedures"
      - Unit: "Lumpsum"
      - Qty: "-"

OUTPUT FORMAT:
==============
Return ONLY a valid JSON array. Each object must have exactly these 4 fields:
{
  "description": "Clear, specific item name",
  "specification": "Detailed technical specification with standards, ratings, dimensions, materials",
  "unit": "Nos | Mtrs | Set | Lot | Lumpsum",
  "qty": number (calculate precisely) or "-" (only for lumpsum items)
}

CRITICAL REQUIREMENTS:
====================
✓ Calculate ALL quantities precisely using the rules above
✓ Include standard references (IEC, IS, etc.)
✓ Specify IP ratings for outdoor equipment
✓ Include material specifications (copper grade, steel type, etc.)
✓ Break down complex items into multiple line items
✓ Use standard electrical component sizes and ratings
✓ Consider safety factors (1.25× for currents, 1.5× for mechanical loads)
✓ Include units like "Nos" for countable items, not "Set" unless it's actually a set of items

✗ Do NOT include items already in major BOQ (solar panels, batteries, main inverters, PV-to-inverter cables, battery-to-inverter cables)
✗ Do NOT use vague specifications like "suitable for the project"
✗ Do NOT return quantity as "As required" - always calculate
✗ Do NOT skip calculation rules provided above

Generate comprehensive BOQ now:
```

---

## Usage Instructions

### To Update the Prompt in Code:

1. Open `src/pages/BESSDesigner.tsx`
2. Find the `generateAIBOQ` function (around line 3980)
3. Locate the `prompt` constant (around line 4018)
4. Replace the existing prompt with the enhanced version above
5. Update the `projectContext` object to include additional variables:

```typescript
const projectContext = {
  // PV System
  pvCapacity: (totalModules * pvModulePower / 1000).toFixed(2) + ' kW',
  pvStrings: pvStrings,
  modulesPerString: modulesPerString,
  totalModules: totalModules,
  
  // Battery System (existing + new)
  batteryCapacity: (numberOfBatteries * batteryCapacity).toFixed(2) + ' kWh',
  batteryTechnology: batterySelection.technology,
  numberOfBatteries: numberOfBatteries,
  singleBatteryVoltage: singleBatteryVoltage,
  singleBatteryCapacity: batteryCapacity,
  batteriesInSeries: inSeries,
  batteriesInParallel: inParallel,
  totalPackVoltage: singleBatteryVoltage * inSeries,
  maxBatteryCurrent: 150, // TODO: Get from battery specs
  
  // Inverter System (new)
  couplingType: couplingType,
  inverterModel: hybridInverter?.model || pvInverter?.model || 'Unknown',
  inverterCount: inverterQuantity,
  inverterPowerKW: couplingType === 'DC' 
    ? (hybridInverter?.rated_inverter_ac_capacity_kw || 0) * inverterQuantity
    : (pvInverter?.rated_power_kw || 0) * inverterQuantity,
  inverterACVoltage: hybridInverter?.operating_ac_voltage_v || pvInverter?.operating_ac_voltage_v || 400,
  inverterACCurrent: acHybridCableParams?.operatingCurrent || acPvCableParams?.operatingCurrent || 0,
  inverterPhase: '3-Phase', // TODO: Detect from inverter specs
  
  // Cable Sizing Results (new)
  dcPvCableSize: cableParams?.dcPv?.selectedCableSize || 0,
  dcBatteryCableSize: cableParams?.dcBatt?.selectedCableSize || 0,
  acCableSize: cableParams?.acHybrid?.selectedCableSize || cableParams?.acPv?.selectedCableSize || 0,
  
  // Site Information (enhanced)
  projectType: 'Residential', // TODO: Get from project data
  location: projectData.locationName || 'Unknown',
  climate: 'Tropical', // TODO: Detect from location
  installationType: pvParams.mountingType || 'Ground-mount',
  
  // Standards (new)
  standards: ['IEC 62446', 'IS 16221', 'CEA Regulations'],
  country: 'India' // TODO: Detect from location
};
```

---

## Expected Improvements

### More Accurate Quantities
- Battery racks: Calculated from actual battery count (e.g., 1 rack for 3 batteries)
- Earth electrodes: Based on system size (e.g., 3 for 8.82kW system)
- Cable trays: Estimated length based on project type and capacity
- MCBs: Exact ratings calculated from current values

### More Detailed Specifications
- IP ratings specified (IP65 for outdoor)
- Standard references included (IEC, IS)
- Material grades mentioned (copper grade, steel type)
- Dimensions provided where applicable

### Better Item Breakdown
- Battery racking split into: Structure + Accessories + Bus bars
- Earthing split into: Electrodes + Pits + Strip + Bonding + Clamps + Testing
- Distribution boxes split into: Box + MCBs + Isolators + Meters + Bus bars

### Calculation Rules Applied
- Current ratings: Operating current × 1.25 (safety factor)
- Mechanical loads: Actual load × 1.5 (safety factor)
- Lengths: Estimated + 20% extra
- Standard sizes used (16A, 20A, 32A, 40A, 63A for MCBs)

---

## Testing the Enhanced Prompt

### Test Case 1: Small Residential (Current Example)
```
- PV: 8.82 kW (3 strings, 14 modules/string)
- Battery: 23.04 kWh (3× 7.68kWh NMC batteries, 3S1P)
- Inverter: 12kW Hybrid, DC coupled
```

**Expected Output**:
- Battery Rack: 1 set (for 3 batteries)
- Earth Electrodes: 3 nos (8.82kW/5 + 1 inverter = 2.76, round up to 3)
- DC MCBs (PV): 3 nos (one per string)
- DC MCBs (Battery): 1 no (1 parallel string)
- AC MCB: 32A (18.23A × 1.25 = 22.79A, next standard: 32A)

### Test Case 2: Medium Commercial
```
- PV: 50 kW (10 strings, 20 modules/string)
- Battery: 100 kWh (10× 10kWh LFP batteries, 5S2P)
- Inverter: 50kW Hybrid, DC coupled
```

**Expected Output**:
- Battery Racks: 2 sets (10 batteries / 5 per rack)
- Earth Electrodes: 11 nos (50kW/5 + 1 inverter)
- DC MCBs (PV): 10 nos (one per string)
- DC MCBs (Battery): 2 nos (2 parallel strings)
- AC MCB: 100A (calculated from inverter current)

---

## Tips for Further Fine-Tuning

1. **Add More Examples** in the prompt showing ideal output format
2. **Specify Brand Preferences** if applicable (e.g., "Schneider Electric or equivalent")
3. **Add Regional Variations** based on location (coastal areas need SS316, inland can use SS304)
4. **Include Cost Constraints** if relevant (e.g., "optimize for Indian market pricing")
5. **Test with Edge Cases**: Very small systems (<3kW), very large systems (>100kW)
6. **Iterate Based on Output**: Review AI-generated BOQ, identify gaps, add more specific rules

---

**Next Steps**:
1. Review this enhanced prompt
2. Test with current system configuration
3. Compare output vs current prompt
4. Make final adjustments based on your requirements
5. Update the code with final version

Would you like me to implement this enhanced prompt in the code?

