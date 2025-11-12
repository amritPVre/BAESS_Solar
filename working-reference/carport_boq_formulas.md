# Single-Sided Solar PV Carport Structure BOQ Calculation Formulas

## Input Parameters Definition

### Primary Inputs:
- **Carport Height (H_c)**: 2.5m (fixed minimum clearance)
- **Module Orientation**: Landscape OR Portrait
- **Number of PV Rows per Carport (N_rows)**
- **Number of Modules per Row (N_mod_per_row)**
- **Carport Tilt Angle (θ)**: 5° (typical case)
- **Module Dimensions**: Length (L_mod), Width (W_mod), Thickness (T_mod)

### Derived Dimensions:
```
For Portrait Orientation:
- Total Carport Width = N_rows × L_mod
- Total Carport Length = N_mod_per_row × W_mod
- Module mounting dimension = W_mod (width)

For Landscape Orientation:
- Total Carport Width = N_rows × W_mod  
- Total Carport Length = N_mod_per_row × L_mod
- Module mounting dimension = L_mod (length)
```

### Foundation Specifications:
- **Foundation Block Size**: 1.0m × 1.0m × 2.0m deep
- **Foundation Spacing**: Based on structural analysis (typically 6-8m centers)

---

## 1. STRUCTURAL ANALYSIS & FOUNDATION REQUIREMENTS

### Foundation Grid Calculation:
```
Foundation Spacing Guidelines (IEC 61215 & AS/NZS 1170):
- Longitudinal spacing (along carport length): 6.0m maximum
- Transverse spacing (across carport width): 8.0m maximum for single-sided design

Number of Foundation Lines:
- Longitudinal lines = ceiling(Total Carport Length / 6.0) + 1
- Transverse lines = 2 (single-sided: high side + low side)

Total Foundation Points = Longitudinal lines × Transverse lines

Foundation Volume Calculation:
- Volume per foundation = 1.0m × 1.0m × 2.0m = 2.0 m³
- Total foundation volume = Total Foundation Points × 2.0 m³
```

### Load Calculations (BS 6399-2):
```
Dead Load:
- Module weight: Typically 22-25 kg/m²
- Structure weight: 15-20 kg/m²
- Total dead load = 40-45 kg/m² = 0.4-0.45 kN/m²

Live Load:
- Maintenance load: 0.25 kN/m²
- Wind uplift: Calculated based on site wind speed

Wind Load (5° tilt - nearly flat):
- Upward pressure coefficient: Cp = -1.2 to -1.8
- Downward pressure coefficient: Cp = +0.2 to +0.4
```

---

## 2. COLUMN STRUCTURE CALCULATIONS

### Column Height Determination:
```
For 5° tilt angle single-sided carport:

High Side Column Height:
H_high = H_c + (Total Carport Width × sin(5°)) + structural depth
H_high = 2.5 + (Total Carport Width × 0.0872) + 0.3
H_high = 2.8 + (Total Carport Width × 0.0872) meters

Low Side Column Height:
H_low = H_c + structural depth = 2.5 + 0.3 = 2.8 meters

Total Column Length Required:
= (Number of high-side foundations × H_high) + (Number of low-side foundations × H_low)
```

### Column Sizing (AS 4100):
```
For carport spans up to 15m:
- Light duty (up to 30 modules): 150×150×6mm SHS
- Medium duty (30-60 modules): 200×200×8mm SHS  
- Heavy duty (60+ modules): 250×250×10mm SHS

Column Weight Calculation:
- 150×150×6mm SHS: 27.3 kg/m
- 200×200×8mm SHS: 47.1 kg/m
- 250×250×10mm SHS: 75.1 kg/m
```

---

## 3. MAIN BEAM STRUCTURE

### Primary Beam Calculations:
```
Main Beams (Spanning across carport width):
- Number of main beams = Longitudinal foundation lines
- Beam span = Total carport width
- Total beam length = Number of main beams × Total carport width

For single-sided design, main beams are typically:
- Span up to 8m: 310UB40 (40.4 kg/m)
- Span 8-12m: 360UB50 (50.7 kg/m)
- Span 12-15m: 410UB59 (59.0 kg/m)
- Span >15m: 460UB67 (67.4 kg/m)

Total Main Beam Weight:
= Total beam length × beam weight per meter
```

### Secondary Beam Calculations:
```
Secondary Beams (Parallel to carport length):
- High-side beam: 1 continuous beam along high side
- Low-side beam: 1 continuous beam along low side
- Intermediate beams: At foundation lines between high and low sides

Number of secondary beams = 2 + (Longitudinal foundation lines - 2)
Secondary beam length each = Total carport length
Total secondary beam length = Number of secondary beams × Total carport length

Secondary beam sizing (C-sections):
- Light loading: C250×75×25×3mm (22.8 kg/m)
- Medium loading: C300×90×30×4mm (35.4 kg/m)
- Heavy loading: C350×100×35×4.5mm (48.8 kg/m)
```

---

## 4. RAFTER STRUCTURE

### Rafter Calculations:
```
Rafter Spacing: 1.5m centers (standard for PV mounting)
Number of rafters = ceiling(Total carport length / 1.5) + 1

Rafter Length Calculation:
- For 5° tilt: Rafter length = Total carport width / cos(5°)
- Rafter length = Total carport width / 0.9962
- Rafter length ≈ Total carport width × 1.004

Total rafter length = Number of rafters × Rafter length

Rafter Sizing (C-sections):
- Standard: C200×75×20×2.5mm (14.2 kg/m)
- Heavy duty: C250×75×25×3mm (18.7 kg/m)
```

---

## 5. PV MODULE MOUNTING SYSTEM

### Module Rail Calculations:
```
Rail Configuration:
- Rails run perpendicular to module length
- 2 rails per module (standard mounting)

For Portrait Orientation:
- Rail length per line = Total carport length
- Number of rail lines = N_rows × 2
- Total rail length = N_rows × 2 × Total carport length

For Landscape Orientation:  
- Rail length per line = Total carport length
- Number of rail lines = N_rows × 2
- Total rail length = N_rows × 2 × Total carport length

Rail Specifications:
- Section: 50×40×4mm aluminum 6063-T5
- Weight: 2.1 kg/m
- Splice connectors: 1 per 6m rail length
```

### Rail Support Structure:
```
Rail Support Brackets:
- Spacing: Every 1.2m along rail length (IEC 61215)
- Brackets per rail line = ceiling(Rail length / 1.2) + 1
- Total brackets = Number of rail lines × Brackets per rail line

Bracket specifications:
- Material: Galvanized steel or aluminum
- Load capacity: Minimum 1.5 kN per bracket
```

---

## 6. MODULE CLAMPS & FASTENERS

### Clamp Calculations:
```
Total modules = N_rows × N_mod_per_row

End Clamps (perimeter modules only):
- Corner modules: 4 end clamps each
- Edge modules (non-corner): 2 end clamps each
- Corner modules = 4 (assuming rectangular array)
- Edge modules = 2 × (N_rows - 2) + 2 × (N_mod_per_row - 2)
- Total end clamps = 4 × 4 + 2 × [2 × (N_rows - 2) + 2 × (N_mod_per_row - 2)]
- Simplified: End clamps = 8 + 4 × (N_rows + N_mod_per_row - 4)

Mid Clamps (internal module connections):
- Horizontal connections: (N_rows - 1) × N_mod_per_row × 2
- Vertical connections: N_rows × (N_mod_per_row - 1) × 2  
- Total mid clamps = 2 × [(N_rows - 1) × N_mod_per_row + N_rows × (N_mod_per_row - 1)]
```

### Fastener Requirements:
```
Module to Rail Fasteners:
- T-bolts or rail nuts: 4 per module
- Total T-bolts = Total modules × 4

Rail to Structure Fasteners:
- Bolts per bracket: 4 (M8 or M10)
- Total bracket bolts = Total brackets × 4

Structure Connection Bolts:
- Beam to column: 8 bolts per connection (M16-M20)
- Rafter to beam: 4 bolts per connection (M12-M16)
- Foundation bolts: 4 per foundation (M20-M24)
```

---

## 7. CONCRETE & REINFORCEMENT

### Concrete Requirements:
```
Foundation Concrete:
- Volume per foundation = 1.0 × 1.0 × 2.0 = 2.0 m³
- Total volume = Total foundation points × 2.0 m³
- Concrete grade: C25/30 (equivalent to M30)
- Additional 5% wastage factor

Total concrete volume = Total foundation points × 2.0 × 1.05 m³
```

### Steel Reinforcement:
```
Foundation Reinforcement (per foundation):
- Main bars: 8 × Y16 bars @ 2.0m length = 32m × 2.00 kg/m = 64 kg
- Stirrups: Y10 @ 200mm spacing
- Stirrup length = 2 × (1.0 - 2 × 0.05) + 2 × (1.0 - 2 × 0.05) = 3.6m
- Number of stirrups = 2000/200 + 1 = 11
- Stirrup weight = 11 × 3.6 × 0.617 = 24.4 kg
- Total rebar per foundation = 64 + 24.4 = 88.4 kg

Total reinforcement = Total foundation points × 88.4 kg
```

---

## 8. ELECTRICAL & MISCELLANEOUS

### Cable Management:
```
Cable Tray/Conduit Requirements:
- Under-carport cable routing
- Length = Total carport length × Number of cable runs
- Typically 2-3 cable runs for larger carports
- Cable tray: 300mm wide × 100mm deep galvanized steel

Earthing System:
- Earth electrode: 1 per carport
- Earth conductors: Copper 25mm² or 50mm²
- Total earthing conductor = Perimeter of structure + cross-connections
```

### Drainage & Accessories:
```
Roof Drainage:
- Gutters: Total carport length × 2 (both sides)
- Downpipes: 1 per 15m of gutter length
- Gutter size: 150mm minimum for carport application

Lighting Provisions (optional):
- LED fixtures: 1 per 25m² of carport area
- Conduit for lighting: Perimeter + cross-connections
```

---

## 9. BOQ CALCULATION FORMULAS SUMMARY

### Material Quantities Formula Set:

```python
# Foundation & Concrete
total_foundations = ceiling(carport_length/6.0 + 1) × 2
concrete_volume = total_foundations × 2.0 × 1.05  # m³
reinforcement_steel = total_foundations × 88.4    # kg

# Structural Steel  
main_beam_length = ceiling(carport_length/6.0 + 1) × carport_width
secondary_beam_length = (2 + ceiling(carport_length/6.0 - 1)) × carport_length
rafter_length = ceiling(carport_length/1.5 + 1) × carport_width × 1.004
column_length = calculate_column_heights()  # Based on high/low sides

# PV Mounting Rails
rail_length = rows × 2 × carport_length
rail_brackets = rail_lines × ceiling(carport_length/1.2 + 1)

# Clamps & Fasteners  
end_clamps = 8 + 4 × (rows + modules_per_row - 4)
mid_clamps = 2 × [(rows-1) × modules_per_row + rows × (modules_per_row-1)]
t_bolts = total_modules × 4
structural_bolts = calculate_connection_bolts()

# Miscellaneous
gutters = carport_length × 2
cable_tray = carport_length × number_of_cable_runs
```

### Load Verification:
- Total dead load ≤ 0.45 kN/m²
- Foundation bearing pressure ≤ soil bearing capacity
- Column buckling check per AS 4100
- Beam deflection ≤ span/250

This comprehensive formula set provides exact calculations for all components of single-sided solar carport structures with the specified parameters.