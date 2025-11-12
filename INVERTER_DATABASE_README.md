# Inverter Database for BESS Designer

## Overview
This document describes the inverter database tables added to support the BESS Designer application. Two tables have been created to store hybrid inverters (for DC-coupled systems) and battery inverters (for AC-coupled systems).

## Database Tables

### 1. `hybrid_inverters` Table
Stores Solar PV + BESS Hybrid Inverters for DC-coupled systems.

**Schema:**
- `id` - UUID primary key
- `supplier` - Manufacturer/supplier name (TEXT)
- `model` - Model number/name (TEXT)
- `application` - Application type: Residential, C&I, or Utility Scale
- `max_pv_capacity_kwp` - Maximum PV capacity in kWp
- `max_pv_dc_voltage_v` - Maximum PV DC voltage
- `mppt_voltage_range_min_v` / `mppt_voltage_range_max_v` - MPPT voltage range
- `max_pv_dc_input_current_a` - Maximum PV DC input current
- `battery_voltage_range_min_v` / `battery_voltage_range_max_v` - Battery voltage range
- `battery_charge_current_a` - Battery charging current
- `battery_discharge_current_a` - Battery discharging current
- `rated_ac_capacity_kw` - Rated AC output capacity
- `operating_ac_voltage_v` - Operating AC voltage
- `max_ac_output_current_a` - Maximum AC output current
- `created_at` / `updated_at` - Timestamps

**Total Records:** 55 inverters

**Suppliers:** Sungrow, GoodWe, Growatt, Fronius, SolarEdge, SMA, Huawei

### 2. `battery_inverters` Table
Stores Battery Inverters for AC-coupled systems.

**Schema:**
- `id` - UUID primary key
- `manufacturer` - Manufacturer name (TEXT)
- `application` - Application type: Residential, C&I, or Utility-Scale
- `model` - Model number/name (TEXT)
- `battery_voltage_min_v` / `battery_voltage_max_v` - Battery voltage range
- `max_battery_charging_current_a` - Maximum battery charging current
- `max_battery_discharging_current_a` - Maximum battery discharging current
- `operating_ac_voltage_v` - Operating AC voltage
- `max_ac_output_current_a` - Maximum AC output current
- `rated_inverter_ac_capacity_kw` - Rated inverter AC capacity
- `created_at` / `updated_at` - Timestamps

**Total Records:** 34 inverters

**Manufacturers:** SMA, Tesla, Solaredge, Growatt, Goodwe, Sungrow, ABB, Huawei

## Migration Files

### 1. `20250202_create_inverter_tables.sql`
Creates the database schema:
- Creates `hybrid_inverters` table with appropriate columns and constraints
- Creates `battery_inverters` table with appropriate columns and constraints
- Adds indexes on `application`, `supplier/manufacturer`, and `rated_capacity` columns
- Enables Row Level Security (RLS)
- Creates RLS policies for authenticated users and public read access
- Adds helper function to parse voltage ranges
- Adds documentation comments

### 2. `20250202_insert_inverter_data.sql`
Inserts all inverter data:
- 55 INSERT statements for hybrid inverters
- 34 INSERT statements for battery inverters
- Properly parses voltage ranges from Excel format (e.g., "200-950" → min: 200, max: 950)

## Running the Migrations

### Option 1: Supabase CLI (Recommended)
```bash
# Run the migrations
supabase db reset

# Or apply specific migrations
supabase db push
```

### Option 2: SQL Editor in Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `20250202_create_inverter_tables.sql`
3. Run the query
4. Then copy and paste the contents of `20250202_insert_inverter_data.sql`
5. Run the query

### Option 3: Using psql
```bash
psql -h <your-db-host> -U postgres -d postgres -f supabase/migrations/20250202_create_inverter_tables.sql
psql -h <your-db-host> -U postgres -d postgres -f supabase/migrations/20250202_insert_inverter_data.sql
```

## Querying the Data

### Get all hybrid inverters for residential applications
```sql
SELECT * FROM hybrid_inverters 
WHERE application = 'Residential' 
ORDER BY rated_ac_capacity_kw;
```

### Get battery inverters by capacity range
```sql
SELECT * FROM battery_inverters 
WHERE rated_inverter_ac_capacity_kw BETWEEN 5 AND 50 
ORDER BY rated_inverter_ac_capacity_kw;
```

### Search by manufacturer/supplier
```sql
-- Hybrid inverters from Sungrow
SELECT * FROM hybrid_inverters WHERE supplier = 'Sungrow';

-- Battery inverters from SMA
SELECT * FROM battery_inverters WHERE manufacturer = 'SMA';
```

### Filter by battery voltage range
```sql
-- Hybrid inverters supporting 48V batteries (typical residential)
SELECT * FROM hybrid_inverters 
WHERE battery_voltage_range_min_v <= 48 
  AND battery_voltage_range_max_v >= 48;
```

## Usage in BESS Designer App

The inverter data will be used in the BESS Designer to:

1. **Coupling Type Selection**: When user selects DC or AC coupling, appropriate inverters are shown
2. **Application-based Filtering**: Filter inverters by Residential, C&I, or Utility Scale
3. **Capacity Matching**: Suggest inverters based on calculated system requirements
4. **Voltage Compatibility**: Match inverters with selected battery voltage ranges
5. **Complete System Design**: Provide realistic inverter options for the designed BESS system

## Data Source

The data was extracted from:
- `working-reference/hybrid_inv.xlsx` - 55 hybrid inverters
- `working-reference/batt_inv.xlsx` - 34 battery inverters

## Next Steps

1. ✅ Create database tables
2. ✅ Insert inverter data
3. 🔲 Create TypeScript types for inverters
4. 🔲 Create service functions to fetch inverters
5. 🔲 Integrate into BESS Designer UI
6. 🔲 Add inverter selection functionality
7. 🔲 Add inverter recommendation logic

## Support

For questions or issues with the inverter database, please contact the development team or open an issue in the repository.

