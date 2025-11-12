# BOQ Standards Reference - Component Specifications

## Overview
This document provides **industry-standard specifications** for electrical components used in Solar PV + BESS systems. These standards should be referenced by the AI when generating BOQ items to ensure accuracy and compliance.

---

## 1. DC CIRCUIT BREAKERS (MCBs)

### Standard Current Ratings (Amps)
```
Residential/Small Commercial (PV Strings):
- 6A, 10A, 16A, 20A, 25A, 32A

Medium Commercial:
- 40A, 50A, 63A

Large Commercial/Industrial:
- 80A, 100A, 125A
```

### Voltage Ratings
```
Standard: 1000V DC, 1500V DC
Breaking Capacity: 6kA (residential), 10kA (commercial), 15kA (industrial)
Curve: C-curve (most common for PV)
Poles: 2-pole (standard for DC circuits)
```

### Selection Rules
```
Rating = String Current × 1.25 (safety factor)
Round up to next standard rating
Example: 12.5A string → 12.5 × 1.25 = 15.625A → Use 16A MCB
```

### Standard Specifications Format
```
"DC MCB, 2-pole, [RATING]A, 1000V DC, C-curve, [6/10/15]kA breaking capacity, as per IEC 60947-2"
```

---

## 2. AC CIRCUIT BREAKERS (MCBs)

### Standard Current Ratings (Amps)
```
Residential:
- 6A, 10A, 16A, 20A, 25A, 32A, 40A, 50A, 63A

Commercial:
- 80A, 100A, 125A

Note: For > 63A, use MCCB instead of MCB
```

### Voltage Ratings
```
Single Phase: 230V AC, 250V AC
Three Phase: 400V AC, 415V AC, 440V AC
Breaking Capacity: 6kA (residential), 10kA (commercial), 15kA (industrial)
Curve: C-curve (standard), D-curve (motors)
Poles: 2-pole (1P+N), 4-pole (3P+N)
```

### Selection Rules
```
Rating = Inverter AC Current × 1.25 (safety factor)
Round up to next standard rating
Example: 18.23A inverter → 18.23 × 1.25 = 22.79A → Use 25A or 32A MCB
```

### Standard Specifications Format
```
"AC MCB, [2/4]-pole ([1P+N/3P+N]), [RATING]A, [230/400]V AC, C-curve, [6/10/15]kA breaking capacity, as per IEC 60898"
```

---

## 3. MOLDED CASE CIRCUIT BREAKERS (MCCBs)

### When to Use
```
Use MCCB when:
- Current rating > 63A
- Higher breaking capacity required (> 15kA)
- Adjustable trip settings needed
```

### Standard Current Ratings (Amps)
```
Small: 63A, 80A, 100A, 125A
Medium: 160A, 200A, 250A
Large: 320A, 400A, 500A, 630A
```

### Voltage Ratings
```
AC: 415V AC, 690V AC
DC: 440V DC, 750V DC, 1000V DC
Breaking Capacity: 25kA, 36kA, 50kA, 65kA, 85kA
```

### Standard Specifications Format
```
"MCCB, [3/4]-pole, [RATING]A, [415/690]V AC, adjustable thermal-magnetic, [25/36/50]kA breaking capacity, as per IEC 60947-2"
```

---

## 4. DC FUSES (gPV Type for Solar)

### Standard Current Ratings (Amps)
```
Residential/Small Commercial:
- 10A, 12A, 15A, 16A, 20A, 25A, 32A

Commercial:
- 40A, 50A, 63A

Note: gPV fuses are specifically designed for photovoltaic applications
```

### Sizes (Physical Dimensions)
```
10×38mm: Up to 32A
14×51mm: Up to 63A
22×58mm: Up to 125A
```

### Voltage Ratings
```
Standard: 1000V DC, 1500V DC
Type: gPV (photovoltaic fuse per IEC 60269-6)
```

### Selection Rules
```
Rating = String Current × 1.5 to 2.0
Round to next standard rating
Example: 10A string → 10 × 1.5 = 15A → Use 15A or 16A gPV fuse
```

### Standard Specifications Format
```
"gPV fuse holder (DIN rail) with 10×38mm gPV fuses, [RATING]A, 1000V DC, as per IEC 60269-6"
```

---

## 5. ISOLATOR SWITCHES

### DC Isolators - Standard Ratings (Amps)
```
Residential: 32A, 40A, 63A
Commercial: 80A, 100A, 125A, 160A, 200A, 250A
```

### AC Isolators - Standard Ratings (Amps)
```
Residential: 32A, 40A, 63A
Commercial: 80A, 100A, 125A, 160A, 200A, 250A
```

### Selection Rules
```
DC: Rating = Total DC Current × 1.25, round up to next standard
AC: Rating = AC MCB Rating × 1.2, round up to next standard
```

### Key Features Required
```
- Rotary type with red/yellow handle
- Door-coupled mechanism
- Lockable in OFF position
- IP rating: IP65 (outdoor), IP55 (indoor)
- Visible isolation gap
```

### Standard Specifications Format
```
DC: "[2/4]-pole rotary DC isolator, [RATING]A, [1000/1500]V DC, IP65, with lockable red/yellow handle, door-coupled mechanism"

AC: "[2/4]-pole rotary AC isolator, [RATING]A, [415/690]V AC, IP65, with lockable handle, door-coupled mechanism"
```

---

## 6. SURGE PROTECTION DEVICES (SPDs)

### Types and Applications
```
Type 1 (Class I): Main distribution board, lightning protection
Type 1+2 (Combined): Single protection device with both capabilities
Type 2 (Class II): Sub-distribution, inverter protection
Type 3 (Class III): Equipment level (usually not needed in solar)
```

### DC SPD Specifications

#### For PV Arrays
```
Voltage: 600V DC, 1000V DC, 1500V DC (choose based on Voc)
Surge Current (Iimp 10/350μs): 10kA, 12.5kA, 15kA (Type 1)
Surge Current (Imax 8/20μs): 20kA, 40kA, 60kA (Type 2)
Protection Level (Up): < 2.5kV (for 600V), < 4kV (for 1000V)
Poles: 2-pole (for non-isolated systems), 3-pole (for isolated)
```

#### For Battery Systems
```
Voltage: Match battery voltage + 20% (e.g., 48V battery → 60V DC SPD)
         Or use 600V DC for high-voltage batteries (> 200V)
Surge Current: 20kA minimum (Type 2)
Protection Level: < 2.5kV
Poles: 2-pole
```

### AC SPD Specifications

#### Main Distribution (Type 1+2)
```
Configuration: 3-phase + N (4-pole) or 1-phase + N (2-pole)
Voltage: 230V AC (single), 400V AC (three-phase)
Surge Current Iimp (10/350μs): 12.5kA, 15kA, 20kA per pole
Surge Current Imax (8/20μs): 40kA, 50kA, 60kA per pole
Protection Level (Up): < 1.5kV
```

#### Inverter Output (Type 2)
```
Configuration: Match inverter phase (3P for 3-phase)
Voltage: 230V AC (single), 400V AC (three-phase)
Surge Current Imax (8/20μs): 20kA, 40kA per pole
Protection Level (Up): < 1.2kV, < 1.5kV
```

### Features Required
```
- Remote indication contact
- Visual indication (green/red LED or window)
- Thermal disconnector
- DIN rail mount or bolt-on
- IP rating: IP20 (indoor enclosure), IP65 (outdoor)
```

### Standard Specifications Format
```
DC (PV): "SPD Type 2, 1000V DC, 40kA (8/20μs), Uc: 1000V, Up: <2.5kV, with remote indication contact, IP65, as per IEC 61643-11"

DC (Battery): "SPD Type 2, [VOLTAGE]V DC (max), 40kA (8/20μs), suitable for battery systems, with visual indication"

AC (Main): "SPD Type 1+2 (combined), [1/3]-phase + N, [230/400]V AC, Iimp: 12.5kA (10/350μs), Imax: 40kA (8/20μs), Up: <1.5kV, remote indication, as per IEC 61643-11"

AC (Inverter): "SPD Type 2, [1/3]-phase, [230/400]V AC, 40kA (8/20μs), Up: <1.2kV, DIN rail mount"
```

---

## 7. DISTRIBUTION BOXES (DB/DCDB/ACDB)

### Enclosure Types
```
Material: Polycarbonate (UV resistant), Mild Steel (powder coated), Stainless Steel
IP Ratings: 
  - Indoor: IP40, IP55
  - Outdoor: IP65, IP66
  - Coastal/harsh: IP66, IP67 (SS316)
```

### Standard Sizes (H × W × D in mm)
```
Small (6-12 way): 300×250×150, 400×300×150, 500×400×200
Medium (12-24 way): 600×400×200, 600×500×250, 800×600×300
Large (24+ way): 1000×800×300, 1200×1000×400
```

### DCDB Configuration
```
Components Required:
- DIN rail (35mm) - Length based on circuits
- Neutral bus bar (if applicable)
- Earth bus bar (mandatory)
- Cable entry glands (sized for cables)
- Circuit identification labels
- Single line diagram (laminated)
- Lock & key
```

### ACDB Configuration
```
Components Required (additional to DCDB):
- Metering section (with CT chamber if required)
- Neutral link (main neutral bar with disconnectable link)
- Separate earth bar
- Voltage/current indicators (optional but recommended)
```

### Standard Specifications Format
```
DCDB: "DCDB for [X]-string PV system [+ battery], IP[rating] rated, [material] enclosure [with powder coating], [wall/floor]-mounted, [H]×[W]×[D]mm, includes DIN rail, neutral & earth bus bars, cable entry glands, lock & key, as per IEC 60670"

ACDB: "ACDB for [1/3]-phase inverter output, IP[rating] rated, [material] enclosure ([thickness]mm) [with powder coating], [wall/floor]-mounted, [H]×[W]×[D]mm, includes DIN rail, neutral bar, earth bar, metering section, cable entry glands, lock & key"
```

---

## 8. EARTHING COMPONENTS

### Earth Electrodes
```
Type: Copper bonded GI rod
Diameter: 12.7mm (½"), 14.2mm (9/16"), 17.2mm (¾")
Length: 1.8m, 2.4m, 3.0m (most common)
Copper Coating: 254 microns minimum (as per IS 3043)
Standard: IS 3043, BS 7430
```

### Earth Pits
```
Size: 600×600×600mm (most common), 750×750×750mm (heavy duty)
Material: Brick masonry with cement plaster
Cover: 600×600mm GI sheet, 4-5mm thick
Filling: Charcoal (25kg), Salt (10kg), Earth (remaining)
Inspection: Removable cover for inspection chamber
```

### GI Strip
```
Size: 25×3mm (light duty), 50×6mm (standard), 75×10mm (heavy duty)
Coating: 275 g/m² zinc coating minimum
Standard: IS 2629
Usage: Continuous earth strip around perimeter
```

### Copper Bonding Cable
```
Size: 25mm², 35mm², 50mm², 70mm², 95mm²
Type: Bare or PVC insulated (green/yellow)
Grade: Electrolytic copper, 99.9% purity
Standard: BS 6360, IS 8130
```

### Earth Resistance Targets
```
Residential: < 5 ohms (acceptable up to 10 ohms)
Commercial: < 2 ohms
Industrial: < 1 ohm
Data centers/critical: < 0.5 ohms
```

---

## 9. BATTERY RACKING SYSTEMS

### Battery Types and Typical Dimensions

#### 48-52V Lithium (LFP/NMC) - 100-200Ah
```
Typical Size: 450×170×220mm (L×W×H)
Weight: 25-30kg each
Batteries per rack: 4-6 (standard), 8-10 (large)
```

#### High Voltage Lithium (200-400V)
```
Typical Size: 600×400×180mm (L×W×H)
Weight: 50-75kg each
Batteries per rack: 2-4 (depends on size)
```

#### Lead Acid (12V 100-200Ah)
```
Typical Size: 560×125×275mm (L×W×H)
Weight: 60-75kg each
Batteries per rack: 2-4 per shelf, 2-tier rack
```

### Rack Dimensions

#### Small Rack (3-4 batteries)
```
External: 1000×600×1500mm (L×W×H)
Load capacity: 150-200kg
Tiers: Single or double
```

#### Medium Rack (5-8 batteries)
```
External: 1200×800×2000mm (L×W×H)
Load capacity: 300-400kg
Tiers: 2-3 tiers
```

#### Large Rack (10+ batteries)
```
External: 1500×1000×2200mm (L×W×H)
Load capacity: 500-600kg
Tiers: 3-4 tiers
```

### Material Specifications
```
Frame: MS square/rectangular tube, 40×40mm or 50×50mm, 2-3mm wall thickness
Shelves: Perforated MS sheet, 2-3mm thick OR MS angle 40×40×5mm with mesh
Coating: Powder coating, 60-80 microns minimum (anti-corrosive)
         OR hot-dip galvanized for harsh environments
Leveling: Adjustable leveling pads (rubber, 100×100mm, M16 bolt)
```

### Standard Specifications Format
```
"MS steel battery rack with powder coating, [L]×[W]×[H]mm, load capacity [X]kg, includes base frame, vertical posts, horizontal rails, adjustable shelves ([X] tiers), mounting brackets, anti-vibration pads"
```

---

## 10. CABLE GLANDS

### Brass Cable Glands (Standard)

#### Sizes by Cable Cross-Section
```
Cable Size → Gland Size → Thread Size
1.5-2.5mm² → 12mm → M12
4-6mm² → 16mm → M16
10mm² → 20mm → M20
16-25mm² → 25mm → M25
35mm² → 32mm → M32
50-70mm² → 40mm → M40
95-120mm² → 50mm → M50
150-185mm² → 63mm → M63
240-300mm² → 75mm → M75
```

### IP Ratings
```
Standard: IP54, IP66, IP68
Selection: IP66 minimum for outdoor, IP68 for underground/wet areas
```

### Material Options
```
Brass: Standard, cost-effective
Nickel-plated brass: Corrosion resistant
Stainless steel (SS316): Marine/coastal areas
Nylon/Plastic: Indoor, light-duty only
```

### Standard Specifications Format
```
"Brass cable glands with locknut and washer, IP[66/68], sizes: [X]mm (for [Y]mm² cables), [Z]mm (for [A]mm² cables)"
```

---

## 11. CABLE TRAYS

### Standard Widths (mm)
```
50, 75, 100, 150, 200, 300, 450, 600
```

### Standard Depths (mm)
```
25, 50, 75, 100, 150
```

### Types
```
Perforated: Standard for cable ventilation (40-50% open area)
Ladder type: Heavy cables, good ventilation
Solid/channel: Restricted areas, EMI shielding
Wire mesh: Light duty, flexible routing
```

### Material & Coating
```
Material: Mild Steel (MS), Aluminum (for light weight)
Coating: 
  - Pre-galvanized (120 g/m²): Indoor
  - Hot-dip galvanized (275 g/m²): Outdoor
  - Powder coated: Indoor + outdoor (aesthetic)
Thickness: 0.8mm (light), 1.0mm (standard), 1.2mm (heavy), 1.6mm (industrial)
```

### Support Spacing
```
Horizontal runs: 1.5m (standard), 1.0m (heavy cables)
Vertical runs: 2.0m maximum
```

### Standard Specifications Format
```
"[Width]mm wide × [Depth]mm depth × [Thickness]mm thick perforated GI cable tray, with powder coating, includes bends, tees, risers, support brackets @1.5m"
```

---

## 12. BUS BARS

### Material
```
Copper: Standard (electrolytic grade, 99.9% purity)
Aluminum: Cost-effective alternative (conductivity rating required)
Tinned copper: Corrosion resistance, better connections
```

### Standard Sizes (Width × Thickness in mm)
```
Small (up to 100A): 15×3, 20×3, 25×3
Medium (100-250A): 25×5, 30×5, 40×5
Large (250-500A): 50×5, 50×10, 60×10
Heavy (500A+): 75×10, 100×10, 125×10
```

### Current Carrying Capacity (Approximate for Copper)
```
20×3mm: 100-120A
25×3mm: 120-150A
25×5mm: 180-230A
50×5mm: 350-450A
50×10mm: 600-800A
100×10mm: 1200-1600A
```

### Insulation
```
Types: PVC sleeve, Heat shrink, Epoxy coating
Color coding: L1-Red, L2-Yellow, L3-Blue, N-Black, E-Green/Yellow
```

### Standard Specifications Format
```
"Electrolytic copper bus bar, [W]×[T]mm, [tinned], current rating [X]A, with insulators and supports [, color: L1-Red/L2-Yellow/L3-Blue/N-Black]"
```

---

## 13. ENERGY METERS

### Types
```
Unidirectional: Import only (consumption)
Bidirectional: Import + Export (solar net metering)
```

### Class Accuracy
```
Class 1.0: Standard residential
Class 0.5: Commercial
Class 0.5S or 0.2S: High accuracy, revenue metering
```

### Communication Protocols
```
Modbus RTU (RS485): Industrial standard
IEC 61107: Optical port
IEC 62056-21 (DLMS/COSEM): Advanced metering
Pulse output: Simple integration (SO pulse)
```

### Current Transformer (CT) Requirements

#### Direct Connection (No CT)
```
Up to: 100A
Meter rating: 5(60)A or 10(100)A
```

#### With CT
```
Above 100A or for future expansion
Standard CT ratios: 50/5A, 75/5A, 100/5A, 150/5A, 200/5A, 300/5A, 400/5A
CT Class: 0.5S or 0.5 for metering
CT Burden: 2.5VA, 5VA (typical)
```

### Standard Specifications Format
```
Direct: "[1/3]-phase bidirectional energy meter, [X]A ([direct/CT]), Class [0.5/0.5S], with [Modbus RTU/RS485] output, LCD display, pulse output, DIN rail mount, as per IS 16444"

With CT: "[1/3]-phase bidirectional energy meter, CT operated, Class [0.5S], with Modbus RTU, LCD display, pulse output, panel mount, as per IS 16444"

CT: "Split-core CT, [X]A/5A, Class 0.5S, burden [2.5/5]VA, as per IEC 61869-2"
```

---

## 14. LIGHTNING PROTECTION

### Air Termination
```
Type: Copper rod, ESE (Early Streamer Emission)
Standard rod: 12mm dia × 1500mm length
ESE: 25mm dia × 400-600mm (with electronics)
Protection radius: Standard - 20m (at ground), ESE - up to 60m
Standard: IS/IEC 62305-3
```

### Down Conductors
```
Bare copper conductor: 50mm², 70mm² (standard for solar)
Aluminum conductor: 95mm², 120mm² (alternative)
Protection: PVC pipe (32mm dia) in accessible areas
Clamps: Every 1m vertical, 2m horizontal
Standard: IS/IEC 62305-3
```

### Earth Termination
```
Type: Ring earth electrode OR multiple earth rods
Depth: Minimum 0.5m below ground
Separation: Minimum 1m from building earth
Resistance: < 10 ohms (combined with system earthing)
```

---

## SELECTION GUIDELINES FOR AI

### When Generating BOQ Items:

1. **Current Ratings**:
   ```
   Step 1: Calculate actual current
   Step 2: Apply safety factor (1.25× for MCB, 1.5× for fuses)
   Step 3: Round UP to next STANDARD rating from lists above
   Step 4: Never use non-standard ratings (e.g., don't use 18A, use 20A)
   ```

2. **Voltage Selection**:
   ```
   DC: Match or exceed Voc (open circuit voltage)
       PV: Use 1000V DC (residential), 1500V DC (commercial)
       Battery: Use 600V DC or 1000V DC depending on pack voltage
   AC: Match grid voltage (230V single-phase, 400V three-phase in India)
   ```

3. **Breaking Capacity**:
   ```
   Residential: 6kA minimum
   Commercial: 10kA standard
   Industrial/High fault level: 15kA or higher
   ```

4. **IP Ratings**:
   ```
   Indoor dry: IP40, IP55
   Indoor humid: IP65
   Outdoor: IP65, IP66
   Underground/submersible: IP68
   Coastal/marine: IP66 minimum + SS316 material
   ```

5. **Standards References**:
   ```
   Always include applicable standard:
   - MCBs: IEC 60898 (AC), IEC 60947-2 (DC)
   - Fuses: IEC 60269-6 (gPV)
   - SPDs: IEC 61643-11
   - Earthing: IS 3043, BS 7430
   - Enclosures: IEC 60670
   - Meters: IS 16444, IEC 62053
   ```

6. **Quantity Calculations**:
   ```
   - PV String MCBs: 1 per string
   - Battery String MCBs: 1 per parallel string
   - Main Isolators: 1 per DB
   - SPDs: 
     * DC PV: 1-2 (depending on system size)
     * DC Battery: 1
     * AC Main: 1 (Type 1+2)
     * AC Inverter: 1 per inverter (Type 2)
   - Earth electrodes: ROUNDUP(kW / 5) + inverter count, min 2
   - Cable glands: 2 per DC string + 4 per AC inverter + 2 per battery
   ```

---

**Reference Standards Summary**:
- IEC 60898: Low-voltage AC MCBs
- IEC 60947-2: Low-voltage DC MCBs and MCCBs
- IEC 60269-6: gPV Fuses for photovoltaic systems
- IEC 61643-11: Surge protective devices
- IEC 62305: Lightning protection
- IEC 60670: Enclosures for electrical equipment
- IS 3043: Earthing (Indian Standard)
- IS 2629: GI strips (Indian Standard)
- IS 16444: Energy meters (Indian Standard)
- IS 16221: Grid-connected solar systems (Indian Standard)

**Last Updated**: January 2025
**Version**: 1.0.0

