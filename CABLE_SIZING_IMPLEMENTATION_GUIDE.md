# Cable Sizing Implementation Guide - BESS Designer

## Overview
Complete implementation of DC and AC cable sizing for BESS systems, supporting both DC-coupled and AC-coupled configurations.

## Cable Sizing Requirements

### DC Cable Sizing

#### 1. PV Array to Inverter
- **Cable Type**: Single-core DC cables (2 per circuit: +ve and -ve)
- **Voltage**: From PV string configuration (V_oc, V_mpp)
- **Current**: String current × Number of parallel strings
- **Application**: Solar PV array DC output to inverter DC input
- **Considerations**:
  - Voltage drop limit: 1-3% (typically 2%)
  - Temperature derating
  - Installation method derating
  - Cable length from array to inverter location

#### 2. Battery Pack to Inverter
- **Cable Type**: Single-core DC cables (2 per circuit: +ve and -ve)
- **Voltage**: Battery pack voltage (from string configuration)
- **Current**: Battery pack max discharge current
- **Application**: Battery pack DC output to battery/hybrid inverter DC input
- **Considerations**:
  - Voltage drop limit: 1-3% (typically 2%)
  - High current handling (0.5C to 1C discharge rates)
  - Temperature derating
  - Installation method derating
  - Cable length from battery to inverter

### AC Cable Sizing

#### 3. For DC Coupled Systems
- **Hybrid Inverter AC Output → Main LV Panel**
  - Cable Type: Multicore (3-core for single-phase, 4-core for three-phase)
  - Voltage: 230V (single-phase) or 400V (three-phase)
  - Current: Total inverter AC output current
  - Voltage drop limit: 1-5% (typically 3%)

#### 4. For AC Coupled Systems
- **Battery Inverter AC Output → Main LV Panel**
  - Cable Type: Multicore (3-core for single-phase, 4-core for three-phase)
  - Voltage: 230V (single-phase) or 400V (three-phase)
  - Current: Battery inverter AC output current
  - Voltage drop limit: 1-5% (typically 3%)

- **PV Inverter AC Output → Main LV Panel**
  - Cable Type: Multicore (3-core for single-phase, 4-core for three-phase)
  - Voltage: 230V (single-phase) or 400V (three-phase)
  - Current: PV inverter AC output current
  - Voltage drop limit: 1-5% (typically 3%)

## Calculation Methodology

### DC Cable Sizing Steps:
1. **Calculate Design Current**: I_design = I_operating × Safety Factor (1.25)
2. **Apply Derating Factors**:
   - Temperature factor (f_temp)
   - Installation method factor (f_install)
   - Grouping factor (f_group)
   - I_required = I_design / (f_temp × f_install × f_group)
3. **Select Cable**: Choose minimum cable size where I_cable ≥ I_required
4. **Verify Voltage Drop**:
   - V_drop = 2 × I_operating × R_cable × L / 1000
   - V_drop % = (V_drop / V_system) × 100
   - Must be ≤ allowed limit (typically 2%)
5. **If voltage drop exceeds limit**: Select next larger cable size and recheck

### AC Cable Sizing Steps:
1. **Calculate Design Current**: I_design = P / (√3 × V × pf) for three-phase
2. **Apply Derating Factors**:
   - Temperature factor
   - Installation method factor
   - Grouping factor
   - I_required = I_design / (f_temp × f_install × f_group)
3. **Select Cable**: Choose minimum cable size where I_cable ≥ I_required
4. **Verify Voltage Drop**:
   - Three-phase: V_drop = √3 × I × R × L × cos(φ) / 1000
   - Single-phase: V_drop = 2 × I × R × L × cos(φ) / 1000
   - V_drop % = (V_drop / V_system) × 100
   - Must be ≤ allowed limit (typically 3-5%)
5. **If voltage drop exceeds limit**: Select next larger cable size and recheck

## User Inputs Required

### Common Inputs:
- Cable material: Copper / Aluminum
- Installation method
- Ambient temperature
- Number of grouped cables
- Cable length (meters)
- Voltage drop limit (%)

### DC-Specific Inputs:
- PV string configuration (if not from PV Sizing tab)
- Battery pack configuration (if not from BESS Config tab)

### AC-Specific Inputs:
- System voltage (230V / 400V)
- Phase configuration (Single / Three-phase)
- Power factor (typically 0.95-1.0)

## Output Display

### For Each Cable:
1. **Calculated Parameters**:
   - Design current (A)
   - Required cable ampacity after derating (A)
   - Selected cable size (mm²)
   - Cable rated ampacity (A)
   - Actual voltage drop (V and %)
   - Cable resistance (Ω/km)

2. **Cable Specification**:
   - Material (Copper/Aluminum)
   - Size (mm²)
   - Installation method
   - Quantity (2 for DC single-core, 1 for AC multicore)
   - Suggested make/type

3. **Validation**:
   - ✓ Ampacity adequate
   - ✓ Voltage drop within limits
   - Warning icons if marginal

## Database Schema

### DC Cables Table:
```sql
dc_cables (
  id, cable_size_mm2, material, installation_method, 
  ampacity_a, max_conductor_temp_c, resistance_dc_20c_ohm_per_km
)
```

### AC Cables Table (Existing):
```sql
lv_cables (
  id, cable_size, material, core_config, 
  ampacity, resistance, voltage_rating
)
```

### Derating Factors Tables:
```sql
dc_derating_factors (material, factor_type, factor_key, factor_value)
lv_derating_factors (material, factor_type, factor_key, factor_value)
```

## UI Design

### Layout:
- Two main sections: DC Cable Sizing and AC Cable Sizing
- Each section contains subsections for different cable runs
- Each subsection has:
  - Input parameters (collapsible)
  - Calculation results
  - Cable specification card
  - Validation status

### Dark Theme:
- Consistent with BESS Designer color scheme
- Color coding:
  - DC Cables: Yellow/Amber gradient
  - AC Cables: Green/Emerald gradient
  - Validation: Green (pass), Red (fail), Amber (warning)

## Implementation Status

### ✅ Completed:
- Database schema for DC cables
- TypeScript types for cables
- Service functions for cable data fetch
- Voltage drop calculation utility

### 🔄 In Progress:
- Full Cable Sizing tab UI implementation
- Cable selection algorithm
- Derating factor application
- Validation logic

### 📋 Pending:
- PDF report generation with cable specifications
- Cable cost estimation
- Cable schedule export

## Related Files:
- `src/types/cables.ts`: Cable type definitions
- `src/services/cableService.ts`: Cable data fetching and calculations
- `supabase/migrations/20250203_create_dc_cables_table.sql`: DC cable database
- `src/pages/BESSDesigner.tsx`: Main implementation (lines 4745+)

## Testing Checklist:
- [ ] DC cable sizing for various PV configurations
- [ ] DC cable sizing for various battery pack configurations
- [ ] AC cable sizing for DC-coupled systems
- [ ] AC cable sizing for AC-coupled systems
- [ ] Voltage drop validation
- [ ] Derating factor application
- [ ] Cable size optimization
- [ ] Edge cases (very long cables, high currents)

## Next Steps:
1. Implement cable selection algorithm with derating
2. Create UI components for each cable run
3. Add validation and warnings
4. Integrate with existing PV and BESS configuration data
5. Add cable specification export functionality

