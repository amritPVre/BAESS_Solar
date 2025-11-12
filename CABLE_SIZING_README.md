# Cable Sizing Module - Implementation Guide

## Overview
The Cable Sizing module has been added to the BESS Designer application to provide comprehensive DC and AC cable sizing for solar PV and battery energy storage systems.

## ✅ Completed

### 1. **Database Setup**
- ✅ Created `dc_single_core_cables` table with copper and aluminum single-core cable specifications
- ✅ Created `dc_cable_derating_factors` table for temperature and grouping derating factors
- ✅ Migration file: `supabase/migrations/20250203_create_dc_cables_table.sql`
- ✅ Populated with standard XLPE cable ampacity data (1.5mm² to 1000mm²)
- ✅ Added derating factors for ambient temperature (10°C to 80°C)
- ✅ Added grouping factors for cable circuits (1 to 6 circuits)
- ✅ Row Level Security enabled with public read access

### 2. **TypeScript Types**
- ✅ Created `src/types/cables.ts` with interfaces:
  - `DCSingleCoreCable`: DC single-core cable specifications
  - `DCCableDeratingFactor`: Derating factor data
  - `ACMulticoreCable`: AC multicore cable specifications
  - `CableSizingParams`: Cable sizing input parameters
  - `CableSizingResult`: Cable sizing calculation results

### 3. **Service Layer**
- ✅ Created `src/services/cableService.ts` with functions:
  - `getDCSingleCoreCables()`: Fetch DC cables from database
  - `getDCCableDeratingFactors()`: Fetch derating factors
  - `calculateDCVoltageDrop()`: Calculate voltage drop for DC cables
  - `getTemperatureDeratingFactor()`: Get temperature derating
  - `getGroupingDeratingFactor()`: Get grouping derating
  - `calculateDeratedAmpacity()`: Calculate derated cable capacity
  - `findSuitableDCCable()`: Find suitable cable size

### 4. **UI Integration**
- ✅ Added "Cable Sizing" tab to navigation (after PV Sizing tab)
- ✅ Created dark-themed UI with placeholder sections for:
  - **DC Cable Sizing**: PV array → Inverter, Battery → Inverter
  - **AC Cable Sizing**: Inverter(s) → Main LV Panel
- ✅ Dynamic sections based on coupling type (DC/AC)
- ✅ Consistent with BESS Designer dark theme

## 🚧 Pending Implementation

### DC Cable Sizing (Priority: High)
1. **PV Array to Inverter DC Cable**
   - Calculate design current based on PV system capacity
   - Input fields: Cable length, Ambient temp, Installation method, Material
   - Calculate: Required ampacity, Derating factors, Voltage drop, Power loss
   - Display: Suitable cable sizes with selection
   - Generate: Cable sizing result card with verification

2. **Battery to Inverter DC Cable**
   - Calculate design current based on battery C-rate (0.5C)
   - Input fields: Cable length, Ambient temp, Installation method, Material
   - Calculate: Required ampacity, Derating factors, Voltage drop, Power loss
   - Display: Suitable cable sizes with selection
   - Generate: Cable sizing result card with verification

### AC Cable Sizing (Priority: High)
1. **For DC Coupled Systems**
   - Hybrid Inverter → Main LV Panel
   - Calculate design current from inverter AC rating
   - Input fields: Cable length, Voltage (400V), Cores (3/4), Material, Installation
   - Use existing `lv_cables` and `lv_derating_factors` tables
   - Calculate: Voltage drop, Power loss, Suitable cable selection

2. **For AC Coupled Systems**
   - Battery Inverter → Main LV Panel
   - PV Inverter → Main LV Panel
   - Similar calculations as above
   - Support for separate cable runs

### Additional Features (Priority: Medium)
1. **Cable Derating Calculator**
   - Interactive derating factor visualization
   - Show all applicable derating factors
   - Display final total derating factor

2. **Voltage Drop Visualization**
   - Chart showing voltage drop vs cable length
   - Comparison of different cable sizes
   - Highlight acceptable vs unacceptable ranges

3. **Cable Summary Report**
   - Generate comprehensive cable schedule
   - Include all cable runs with specifications
   - Export to PDF with BOQ integration

## Database Schema

### DC Single Core Cables Table
```sql
dc_single_core_cables:
- id (UUID, PK)
- cross_section_mm2 (DECIMAL)
- material (VARCHAR: Copper/Aluminum)
- insulation_type (VARCHAR, default: XLPE)
- free_air_ampacity_a (DECIMAL)
- direct_buried_ampacity_a (DECIMAL)
- max_conductor_temp_c (INTEGER, default: 90)
- resistance_dc_20c_ohm_per_km (DECIMAL)
```

### DC Cable Derating Factors Table
```sql
dc_cable_derating_factors:
- id (UUID, PK)
- material (VARCHAR: Copper/Aluminum)
- factor_type (VARCHAR: ambient_temp, grouping_air_touch, etc.)
- factor_key (VARCHAR: temperature value or circuit count)
- factor_value (DECIMAL: derating factor)
- description (TEXT)
```

### Existing AC Cable Tables
- `lv_cables`: Multicore cable specifications (already in database)
- `lv_derating_factors`: AC cable derating factors (already in database)

## Installation Instructions

### 1. Run Database Migration
```bash
# Apply the migration to create DC cable tables
supabase migration up
```

### 2. Verify Data
```sql
-- Check DC cables
SELECT * FROM dc_single_core_cables LIMIT 10;

-- Check derating factors
SELECT * FROM dc_cable_derating_factors WHERE material = 'Copper' LIMIT 10;
```

## Usage Example (Future Implementation)

```typescript
// Example of how cable sizing will work
const pvCableSizing = {
  design_current: 150, // Amps
  cable_length: 50, // meters
  ambient_temp: 50, // °C
  installation_method: 'Free Air',
  num_circuits: 2,
  material: 'Copper'
};

// Fetch suitable cables
const cables = await getDCSingleCoreCables('Copper');
const factors = await getDCCableDeratingFactors('Copper');

// Calculate derating
const tempFactor = getTemperatureDeratingFactor(factors, 50);
const groupFactor = getGroupingDeratingFactor(factors, 2, 'touch');

// Find suitable cable
const requiredAmpacity = design_current / (tempFactor * groupFactor);
const selectedCable = findSuitableDCCable(cables, requiredAmpacity, 'Free Air');

// Calculate voltage drop
const { voltageDrop, voltageDropPercent } = calculateDCVoltageDrop(
  150,
  50,
  selectedCable.resistance_dc_20c_ohm_per_km,
  600 // DC system voltage
);
```

## Design Patterns

### Component Structure
- Follow existing BESS Designer dark theme
- Use Card components with gradient backgrounds
- Color coding:
  - DC PV cables: Yellow/Amber theme
  - DC Battery cables: Blue/Indigo theme
  - AC cables: Green/Emerald theme
- Show derating factors in expandable sections
- Display results in highlighted cards

### Calculation Flow
1. User enters cable run parameters
2. System fetches relevant cables and derating factors
3. Calculate derated ampacity
4. Find suitable cable sizes
5. User selects cable
6. Calculate voltage drop and power loss
7. Verify cable adequacy
8. Display results with visual indicators

## References

- Cable database source: `working-reference/cable_db.py`
- Based on international standards (IEC, AS/NZS 3008)
- XLPE insulation, 90°C conductor temperature
- Comprehensive derating factor tables

## Next Steps

1. ✅ Database migration
2. ✅ Type definitions
3. ✅ Service layer
4. ✅ UI scaffolding
5. ⏳ Implement DC cable sizing logic
6. ⏳ Implement AC cable sizing logic
7. ⏳ Add validation and error handling
8. ⏳ Create result visualization
9. ⏳ Integration with BOQ generator
10. ⏳ Testing and refinement

## Notes

- DC cables use single-core configuration (2 nos per circuit: +ve and -ve)
- AC cables use multicore configuration (3-core or 4-core)
- Voltage drop limit typically 2-3% for DC, 1-2% for AC
- Consider future expansion when sizing cables
- All calculations based on conservative approach for safety

