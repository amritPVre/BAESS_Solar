# Solar AI Calculation Tasks - Complete Reference Guide

## Table of Contents
1. [Overview](#overview)
2. [Sizing Tasks](#sizing-tasks)
   - [PV System Sizing](#1-pv-system-sizing)
   - [Inverter Sizing](#2-inverter-sizing)
   - [Battery Sizing](#3-battery-sizing)
   - [String Configuration](#4-string-configuration)
3. [Financial Tasks](#financial-tasks)
   - [Financial Analysis](#5-financial-analysis)
   - [Payback Analysis](#6-payback-analysis)
   - [ROI Calculation](#7-roi-calculation)
4. [Technical Tasks](#technical-tasks)
   - [Cable Sizing (AC)](#8-cable-sizing-ac)
   - [DC Cable Sizing](#9-dc-cable-sizing)
   - [Irradiance Calculation](#10-irradiance-calculation)
   - [Load Analysis](#11-load-analysis)
   - [Energy Production](#12-energy-production)
   - [Tilt Optimization](#13-tilt-optimization)
   - [Earthing Sizing](#14-earthing-sizing)
5. [Environmental Tasks](#environmental-tasks)
   - [Carbon Offset](#15-carbon-offset)
6. [Standard Reference Values](#standard-reference-values)
7. [Database Schema](#database-schema)
8. [External APIs](#external-apis)

---

## Overview

This document contains the complete calculation logic, formulas, and specifications for all 15 solar engineering calculation tasks in the BAESS Solar AI Assistant.

### Task Categories

| Category | Tasks | Purpose |
|----------|-------|---------|
| **Sizing** | 4 tasks | Equipment sizing and configuration |
| **Financial** | 3 tasks | Investment analysis and returns |
| **Technical** | 7 tasks | Engineering calculations |
| **Environmental** | 1 task | Environmental impact analysis |

---

# Sizing Tasks

## 1. PV System Sizing

### Description
Design grid-connected, battery-less solar PV systems for residential and small C&I projects. This tool calculates optimal system capacity based on daytime energy consumption, available space, and real solar irradiance data from NREL PVWatts API.

**System Type:** Grid-connected without battery storage
**Target Projects:** Residential & Small Commercial/Industrial (C&I)

---

### Conversational Input Collection Flow

**IMPORTANT:** The AI asks ONE question at a time and waits for user response before proceeding.

---

#### Step 1: Daily Daytime Energy Consumption

**AI Asks:** "Do you have your Daily Average Day-time Electricity Consumption value (in kWh)? This is your energy usage from 6:00 AM to 6:00 PM."

| User Response | AI Action |
|---------------|-----------|
| **"Yes, [value] kWh"** | Ask if user wants to provide hourly breakdown |
| **"No, I don't have it"** | Proceed to Step 2 (will use space-based sizing only) |

**If YES to hourly breakdown:**

AI presents table for user to fill:
| Time Slot | Average Consumption (kWh) |
|-----------|---------------------------|
| 6:00 AM | [enter value] |
| 7:00 AM | [enter value] |
| 8:00 AM | [enter value] |
| 9:00 AM | [enter value] |
| 10:00 AM | [enter value] |
| 11:00 AM | [enter value] |
| 12:00 PM | [enter value] |
| 1:00 PM | [enter value] |
| 2:00 PM | [enter value] |
| 3:00 PM | [enter value] |
| 4:00 PM | [enter value] |
| 5:00 PM | [enter value] |

**If NO to hourly:** AI generates synthetic profile by distributing consumption equally across 6AM-6PM.

---

#### Step 2: Location

**AI Asks:** "Please provide your installation location coordinates (Latitude, Longitude). If you don't have coordinates, type 'NO' and I'll ask for your city and country."

| User Response | AI Action |
|---------------|-----------|
| **"28.6139, 77.2090"** | Extract timezone, proceed to Step 3 |
| **"No"** | Ask for City and Country |

**If city/country provided:** Geocode to coordinates + extract timezone

---

#### Step 3: Available Space

**AI Asks:** "What is the available space for solar PV installation? (in square meters, m²)"

| Input | Unit | Required |
|-------|------|----------|
| `availableSpace` | m² | ✅ Yes |

---

#### Step 4: Shading Condition

**AI Asks:** "How much of the installation area is shaded? Please select:

**1.** Partially shaded (approximately 10% of the area)
**2.** No shades at all (fully shade-free)

Reply with 1 or 2."

| Option | System Loss Applied |
|--------|---------------------|
| 1 (Partial) | 14.5% |
| 2 (Shade-free) | 12.0% |

---

#### Step 5: Installation Type

**AI Asks:** "What type of mounting structure will you use? Select one:

**1.** Open Rack (Ground Mounted)
**2.** Fixed - Roof Mounted
**3.** 1-Axis Tracker
**4.** 1-Axis Backtracking
**5.** 2-Axis Tracker

Reply with 1, 2, 3, 4, or 5."

| Option | PVWatts Code |
|--------|--------------|
| 1 | 0 |
| 2 | 1 |
| 3 | 2 |
| 4 | 3 |
| 5 | 4 |

---

#### Step 6: Solar Panel Manufacturer

**AI Asks:** "Please select a solar panel manufacturer:

**1.** LONGi Solar
**2.** JinkoSolar
**3.** Trina Solar

I'll use a 600Wp module from your selected manufacturer. Reply with 1, 2, or 3."

**Backend:** Fetch 600Wp panel specs from Supabase `solar_panels` table

---

#### Step 7: Inverter Manufacturer

**AI Asks:** "Please select an inverter manufacturer:

**1.** Sungrow
**2.** Huawei
**3.** Growatt

Reply with 1, 2, or 3."

**Inverter Capacity Auto-Selection:**
- DC/AC ratio must be between 0.9 and 1.25
- Prefer ratio > 1.0
- Minimum number of inverters
- Backend fetches from Supabase `solar_inverters` table

---

#### Step 8: System AC Voltage

**AI Asks:** "What is your grid AC voltage? Select:

**1.** 380V
**2.** 400V
**3.** 415V
**4.** 480V

Reply with 1, 2, 3, or 4."

---

### Backend Calculation Logic

#### Step 1: Location Processing

```python
IF user_provided_coordinates:
    latitude = input.latitude
    longitude = input.longitude
    timezone = get_timezone_from_coordinates(latitude, longitude)
ELSE:
    coordinates = geocode_city(city, country)  # Get city center coordinates
    latitude = coordinates.lat
    longitude = coordinates.lng
    timezone = get_timezone_from_coordinates(latitude, longitude)
```

---

#### Step 2: Fetch Solar Irradiance Data (NREL PVWatts API)

**API Endpoint:** `https://developer.nrel.gov/api/pvwatts/v8.json`

**Initial API Call Parameters:**
```json
{
  "api_key": "YOUR_NREL_API_KEY",
  "lat": latitude,
  "lon": longitude,
  "system_capacity": 1,  // 1 kW for baseline
  "azimuth": azimuth,    // Calculated based on hemisphere
  "tilt": tilt,          // Calculated based on latitude
  "array_type": installation_type,  // 0-4 from user input
  "module_type": 1,      // Standard module
  "losses": system_loss  // Based on shading condition
}
```

**Extract from Response:**
- `solrad_annual` → Annual average solar radiation (kWh/m²/day)
- `solrad_monthly` → Monthly solar radiation values

**Calculate Daily Solar Irradiation:**
```
E_sol (kWh/m²/day) = solrad_annual from PVWatts
```

---

#### Step 3: Calculate PV Capacity - Method 1 (Consumption-Based)

```
PV_wp1 (kWp) = E_comp / (E_sol × PR)
```

**Where:**
- `E_comp` = Daily Average Day-time Energy Consumption (kWh/day)
- `E_sol` = Daily Solar Irradiation (kWh/m²/day) from PVWatts
- `PR` = Performance Ratio = 0.80 (80%)

**Example:**
```
E_comp = 50 kWh/day
E_sol = 5.2 kWh/m²/day
PV_wp1 = 50 / (5.2 × 0.80) = 12.02 kWp
```

---

#### Step 4: Calculate PV Capacity - Method 2 (Space-Based)

```
PV_wp2 (kWp) = (St × GCR) / Sp × Pmodule
```

**Where:**
- `St` = Available installation space (m²)
- `GCR` = Ground Coverage Ratio = 0.45
- `Sp` = Single module area (m²) - from selected manufacturer's 600Wp module
- `Pmodule` = Module power = 0.6 kWp (600Wp)

**Simplified:**
```
PV_wp2 (kWp) = (St × 0.45 / Sp) × 0.6
```

**Example:**
```
St = 200 m²
Sp = 2.8 m² (for 600Wp module)
PV_wp2 = (200 × 0.45 / 2.8) × 0.6 = 19.29 kWp
```

---

#### Step 5: Determine Final PV Capacity

```python
IF PV_wp1 <= PV_wp2:
    final_capacity = PV_wp1
    space_constrained = False
    message = "System sized to match daytime consumption"
ELSE:
    final_capacity = PV_wp2
    space_constrained = True
    message = "Due to space constraint, maximum possible PV capacity is {PV_wp2} kWp"
```

---

#### Step 6: Inverter Selection Algorithm

**Objective:** 
1. Minimum number of inverters
2. DC/AC ratio between 0.9 and 1.25
3. Prioritize DC/AC ratio > 1.0

**Algorithm:**
```python
def select_inverter(pv_capacity_kw, available_inverters):
    """
    available_inverters = list of (model, ac_capacity_kw) from selected manufacturer
    sorted by ac_capacity descending
    """
    best_config = None
    best_score = float('inf')
    
    for inverter in available_inverters:
        ac_capacity = inverter.ac_capacity_kw
        
        # Try different quantities
        for qty in range(1, 20):
            total_ac = ac_capacity * qty
            dc_ac_ratio = pv_capacity_kw / total_ac
            
            # Check if within acceptable range
            if 0.9 <= dc_ac_ratio <= 1.25:
                # Calculate score (lower is better)
                # Prioritize: 1) fewer inverters, 2) ratio > 1.0
                if dc_ac_ratio >= 1.0:
                    score = qty * 10 + (1.25 - dc_ac_ratio)  # Lower qty, higher ratio preferred
                else:
                    score = qty * 10 + 100 + (1.0 - dc_ac_ratio)  # Penalize ratio < 1.0
                
                if score < best_score:
                    best_score = score
                    best_config = {
                        'model': inverter.model,
                        'quantity': qty,
                        'ac_capacity_each': ac_capacity,
                        'total_ac_capacity': total_ac,
                        'dc_ac_ratio': dc_ac_ratio
                    }
    
    return best_config
```

**Examples:**
| PV Capacity | Available Inverters | Selection | DC/AC Ratio |
|-------------|---------------------|-----------|-------------|
| 120 kWp | 33, 40, 50, 100, 125 kW | 1 × 100 kW | 1.20 ✓ |
| 88 kWp | 33, 40, 50, 100, 125 kW | 2 × 40 kW | 1.10 ✓ |
| 150 kWp | 33, 40, 50, 100, 125 kW | 1 × 125 kW | 1.20 ✓ |
| 45 kWp | 33, 40, 50, 100, 125 kW | 1 × 40 kW | 1.125 ✓ |

---

#### Step 7: System Parameters for PVWatts

**System Losses:**
| Shading Condition | Total System Loss |
|-------------------|-------------------|
| Partial Shading (up to 10%) | 14.5% |
| Fully Shade Free | 12.0% |

**Fixed Parameters:**
| Parameter | Value | Notes |
|-----------|-------|-------|
| Module Efficiency | 21% | Mono-PERC standard |
| Inverter Efficiency | 97% | Grid-tie inverter |
| Bifaciality Factor | 0.7 | For bifacial modules |
| DC/AC Ratio | Calculated | From inverter selection |

**Tilt Angle Calculation:**
```python
IF abs(latitude) <= 25:
    tilt = abs(latitude) - 2
ELSE:
    tilt = 25  # Fixed at 25° for latitudes > 25°
```

**Azimuth Calculation:**
```python
IF latitude >= 0:  # Northern Hemisphere
    azimuth = 180  # South-facing
ELSE:              # Southern Hemisphere
    azimuth = 0    # North-facing (or 360°)
```

---

#### Step 8: Final PVWatts API Call

**Request Parameters:**
```json
{
  "api_key": "YOUR_NREL_API_KEY",
  "lat": latitude,
  "lon": longitude,
  "system_capacity": final_capacity,
  "azimuth": calculated_azimuth,
  "tilt": calculated_tilt,
  "array_type": installation_type,
  "module_type": 1,
  "losses": system_loss,
  "dc_ac_ratio": dc_ac_ratio,
  "inv_eff": 97,
  "gcr": 0.45
}
```

**Response Data to Extract:**
| Field | Description |
|-------|-------------|
| `solrad_monthly` | Monthly solar radiation (kWh/m²/day) |
| `poa_monthly` | Plane of array irradiance (kWh/m²) |
| `dc_monthly` | DC array output (kWh) |
| `ac_monthly` | AC system output (kWh) |
| `ac_annual` | Annual AC output (kWh) |
| `solrad_annual` | Annual average solar radiation |
| `capacity_factor` | System capacity factor |

---

### Output Presentation

#### 1. Monthly Performance Table (Canvas/Artifact)

| Month | Solar Radiation (kWh/m²/day) | POA Irradiance (kWh/m²) | DC Output (kWh) | AC Output (kWh) | Monthly PR (%) |
|-------|------------------------------|-------------------------|-----------------|-----------------|----------------|
| Jan | [solrad] | [poa] | [dc] | [ac] | [calculated] |
| Feb | [solrad] | [poa] | [dc] | [ac] | [calculated] |
| Mar | [solrad] | [poa] | [dc] | [ac] | [calculated] |
| Apr | [solrad] | [poa] | [dc] | [ac] | [calculated] |
| May | [solrad] | [poa] | [dc] | [ac] | [calculated] |
| Jun | [solrad] | [poa] | [dc] | [ac] | [calculated] |
| Jul | [solrad] | [poa] | [dc] | [ac] | [calculated] |
| Aug | [solrad] | [poa] | [dc] | [ac] | [calculated] |
| Sep | [solrad] | [poa] | [dc] | [ac] | [calculated] |
| Oct | [solrad] | [poa] | [dc] | [ac] | [calculated] |
| Nov | [solrad] | [poa] | [dc] | [ac] | [calculated] |
| Dec | [solrad] | [poa] | [dc] | [ac] | [calculated] |
| **Annual** | [avg] | [total] | [total] | [total] | [avg] |

**Monthly PR Calculation:**
```
Monthly PR (%) = (AC_monthly / (POA_monthly × System_Capacity)) × 100
```

---

#### 2. System Configuration Summary

| Parameter | Value | Unit |
|-----------|-------|------|
| **Location** | [Lat, Long] | ° |
| **Timezone** | [TZ] | - |
| **PV Array Capacity** | [final_capacity] | kWp |
| **Number of Modules** | [count] | pcs (600Wp) |
| **Module Manufacturer** | [name] | - |
| **Inverter Model** | [qty] × [model] | - |
| **Inverter Manufacturer** | [name] | - |
| **Total Inverter AC Capacity** | [total] | kW |
| **DC/AC Ratio** | [ratio] | - |
| **Tilt Angle** | [tilt] | ° |
| **Azimuth** | [azimuth] | ° |
| **Installation Type** | [type] | - |
| **System AC Voltage** | [voltage] | V |
| **Ground Coverage Ratio** | 0.45 | - |
| **System Losses** | [loss] | % |

---

#### 3. Annual Performance Summary

| Metric | Value | Unit |
|--------|-------|------|
| Annual AC Energy Yield | [ac_annual] | kWh |
| Specific Yield | [ac_annual / capacity] | kWh/kWp |
| Average Annual PR | [calculated] | % |
| Capacity Factor | [from API] | % |
| Annual Solar Radiation | [solrad_annual] | kWh/m²/day |

---

#### 4. Major Installation Items (AI Generated)

| S.No | Item | Specification | Quantity | Unit |
|------|------|---------------|----------|------|
| 1 | Solar PV Modules | [Manufacturer] 600Wp | [count] | pcs |
| 2 | Grid-Tie Inverter | [Model] [kW] | [qty] | nos |
| 3 | Module Mounting Structure | [Type] | [area] | m² |
| 4 | DC Cables (String) | 4mm² Solar DC | [length] | m |
| 5 | DC Cables (Main) | [size] mm² | [length] | m |
| 6 | AC Cables | [size] mm² 3C+E | [length] | m |
| 7 | DC Combiner Box | [strings] input | [qty] | nos |
| 8 | AC Distribution Board | [rating] A | 1 | nos |
| 9 | Earthing System | GI/Cu | 1 | set |
| 10 | Lightning Arrester | Class II SPD | [qty] | nos |
| 11 | Energy Meter | Bi-directional | 1 | nos |
| 12 | Monitoring System | WiFi/LAN | 1 | set |

---

### Database References

**Required Tables:**
| Table | Purpose |
|-------|---------|
| `solar_panels` | Fetch manufacturer list, 600Wp module specs |
| `solar_inverters` | Fetch manufacturer list, inverter models & capacities |

**solar_panels Table Schema:**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| manufacturer | VARCHAR | Manufacturer name |
| model | VARCHAR | Model number |
| wattage | INT | Module power (Wp) |
| width | DECIMAL | Module width (mm) |
| height | DECIMAL | Module height (mm) |
| efficiency | DECIMAL | Module efficiency (%) |
| voc | DECIMAL | Open circuit voltage |
| isc | DECIMAL | Short circuit current |

**solar_inverters Table Schema:**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| manufacturer | VARCHAR | Manufacturer name |
| model | VARCHAR | Model number |
| ac_capacity_kw | DECIMAL | AC output capacity |
| dc_max_kw | DECIMAL | Max DC input |
| mppt_count | INT | Number of MPPT |
| efficiency | DECIMAL | Inverter efficiency (%) |

---

### API References

**NREL PVWatts API v8:**
- **Endpoint:** `https://developer.nrel.gov/api/pvwatts/v8.json`
- **Documentation:** https://developer.nrel.gov/docs/solar/pvwatts/v8/
- **API Key:** `zNZ118S4E62Nm7A4bCiBQO4eDS4Gx3jsYJ0kIjsL`
- **Rate Limit:** 1000 requests/hour with API key
- **Service File:** `src/services/pvwatts-api.service.ts`

**Request Parameters (Required):**
| Parameter | Description |
|-----------|-------------|
| system_capacity | kW, 0.05 to 500000 |
| module_type | 0=Standard, 1=Premium, 2=Thin Film |
| losses | System losses %, -5 to 99 |
| array_type | 0-4 (Open Rack to 2-Axis) |
| tilt | degrees, 0 to 90 |
| azimuth | degrees, 0 to < 360 |
| lat, lon | Location coordinates |

**Response Data Used:**
- `solrad_monthly` - Monthly solar radiation (kWh/m²/day)
- `poa_monthly` - Plane of array irradiance (kWh/m²)
- `dc_monthly` - DC array output (kWh)
- `ac_monthly` - AC system output (kWh)
- `ac_annual` - Annual AC output (kWh)
- `solrad_annual` - Annual average solar radiation
- `capacity_factor` - System capacity factor
- `station_info` - Location/weather station details

**Supabase Database:**
- **Project:** solar-finc
- **Project ID:** ejmjukrfpdpgkxdwgoax
- **Service File:** `src/services/solar-equipment.service.ts`

**Geocoding API (for city/country):**
- Option 1: OpenStreetMap Nominatim
- Option 2: Google Geocoding API
- Option 3: Mapbox Geocoding API

**Timezone API:**
- Option 1: TimeZoneDB API
- Option 2: Google Timezone API
- Option 3: Calculate from longitude (approximate)

---

### Validation Rules

| Field | Rule | Message |
|-------|------|---------|
| dailyDaytimeConsumption | Required, > 0 | Daily consumption is required |
| latitude | Required*, -90 to +90 | Valid latitude required |
| longitude | Required*, -180 to +180 | Valid longitude required |
| availableSpace | Required, > 0 | Available space is required |
| shadingCondition | Required, valid option | Select shading condition |
| installationType | Required, 0-4 | Select installation type |
| panelManufacturer | Required | Select panel manufacturer |
| inverterManufacturer | Required | Select inverter manufacturer |
| systemACVoltage | Required, valid option | Select AC voltage |

*Either coordinates OR city+country required

---

## 2. Inverter Sizing

### Description
Calculate optimal inverter capacity and configuration for the PV system.

### Required Inputs

| Input | Label | Unit | Required | Default | Description |
|-------|-------|------|----------|---------|-------------|
| `pvArrayCapacity` | PV Array Capacity | kWp | ✅ Yes | - | Total DC capacity |
| `pvVoc` | Panel Voc | V | No | - | Open circuit voltage |
| `pvVmp` | Panel Vmp | V | No | - | Max power voltage |
| `pvIsc` | Panel Isc | A | No | - | Short circuit current |
| `panelsPerString` | Panels per String | - | No | - | Series panels count |
| `numberOfStrings` | Number of Strings | - | No | - | Parallel strings |
| `systemType` | System Type | - | No | grid_tied | grid_tied/off_grid/hybrid |
| `gridVoltage` | Grid Voltage | V | No | 230 | AC grid voltage |
| `gridPhase` | Grid Phase | - | No | single | single/three |

### Formulas

#### 1. DC:AC Ratio
```
DC:AC Ratio = PV Array Capacity (kWp) ÷ Inverter AC Capacity (kW)
```
**Typical Range:** 1.0 to 1.3

**Example:** 10 kWp ÷ 8 kW = 1.25 DC:AC ratio

#### 2. Inverter AC Sizing
```
Inverter Size (kW) = PV Capacity (kWp) ÷ DC:AC Ratio
```
**Example:** 10 kWp ÷ 1.2 = 8.33 kW inverter

#### 3. String Voltage at Cold Temperature
```
Vstring_cold = Panels × Voc × [1 + TempCoeff × (T_min - 25)]
```
**Variables:**
- TempCoeff: Typically -0.30%/°C
- T_min: Minimum expected temperature (e.g., -10°C)

**Example:** 10 × 48V × [1 + (-0.003) × (-35)] = 10 × 48 × 1.105 = 530.4V

#### 4. String Voltage at Hot Temperature
```
Vstring_hot = Panels × Vmp × [1 + TempCoeff × (T_max - 25)]
```
**Variables:**
- T_max: Maximum cell temperature (e.g., 70°C)

**Example:** 10 × 40V × [1 + (-0.003) × (45)] = 10 × 40 × 0.865 = 346V

#### 5. Maximum Input Current
```
I_max = Number of Strings × Isc × 1.25
```
**Note:** NEC requires 125% safety factor

**Example:** 4 strings × 11A × 1.25 = 55A

### DC:AC Ratio Guidelines

| Irradiance Level | PSH | Recommended DC:AC |
|------------------|-----|-------------------|
| High (>5.5 PSH) | 5.5-7.0 | 1.10-1.15 |
| Medium (4-5.5 PSH) | 4.0-5.5 | 1.15-1.20 |
| Low (<4 PSH) | 2.5-4.0 | 1.20-1.30 |

### Standard Values

| Parameter | Value | Source |
|-----------|-------|--------|
| Optimal DC:AC Ratio | 1.1-1.25 | Industry Practice |
| Voc Temp Coefficient | -0.30 %/°C | Typical Mono-Si |
| Min Inverter Efficiency | 97% | CEC Standard |
| Max DC Voltage (Residential) | 600V | NEC (US) |
| Max DC Voltage (Commercial) | 1000V | IEC Standard |

### Output

| Output | Unit | Description |
|--------|------|-------------|
| Recommended Inverter Size | kW | AC capacity |
| DC:AC Ratio | - | Sizing ratio |
| Estimated Clipping Loss | % | Power loss at peak |
| MPPT Compatibility | Pass/Fail | Voltage range check |

---

## 3. Battery Sizing

### Description
Size battery energy storage system based on load profile and backup requirements.

### Required Inputs

| Input | Label | Unit | Required | Default | Description |
|-------|-------|------|----------|---------|-------------|
| `dailyConsumption` | Daily Energy Consumption | kWh | ✅ Yes | - | Daily usage to cover |
| `backupHours` | Backup Hours Required | hours | ✅ Yes | - | Autonomy duration |
| `systemVoltage` | System Voltage | V | No | 48 | Battery bank voltage |
| `depthOfDischarge` | Depth of Discharge | % | No | 80 | Max discharge level |
| `batteryType` | Battery Technology | - | No | lithium_lfp | Chemistry type |
| `peakLoad` | Peak Load | kW | No | - | Max power draw |
| `roundTripEfficiency` | Round-Trip Efficiency | % | No | 90 | Charge/discharge efficiency |

### Formulas

#### 1. Required Energy Storage
```
Energy (kWh) = (Daily Consumption × Backup Days) ÷ DoD ÷ Efficiency
```
**Variables:**
- Backup Days = Backup Hours ÷ 24
- DoD = Depth of Discharge (decimal)
- Efficiency = Round-trip efficiency (decimal)

**Example:** (30 kWh × 0.5 days) ÷ 0.80 ÷ 0.90 = 20.8 kWh

#### 2. Battery Capacity in Amp-hours
```
Capacity (Ah) = Energy (Wh) ÷ Voltage (V)
```
**Example:** 20,800 Wh ÷ 48V = 433 Ah

#### 3. Number of Batteries (Series)
```
Series Batteries = System Voltage ÷ Battery Voltage
```
**Example:** 48V ÷ 12V = 4 batteries in series

#### 4. Number of Batteries (Parallel)
```
Parallel Strings = Required Ah ÷ Battery Ah
```
**Example:** 433 Ah ÷ 200 Ah = 2.17 → 3 strings (round up)

#### 5. Total Batteries
```
Total = Series × Parallel
```
**Example:** 4 × 3 = 12 batteries

#### 6. C-Rate Check
```
C-Rate = Peak Power (kW) ÷ Capacity (kWh)
```
**Note:** Most batteries support 0.5C to 1C continuous discharge

**Example:** 5 kW ÷ 20 kWh = 0.25C ✓

### Battery Technology Comparison

| Technology | DoD | Efficiency | Cycle Life | Cost ($/kWh) |
|------------|-----|------------|------------|--------------|
| Lithium LFP | 80-90% | 92% | 4000+ | $400 |
| Lithium NMC | 80-90% | 90% | 2000+ | $350 |
| Lead-Acid AGM | 50% | 80% | 500 | $200 |
| Lead-Acid Gel | 50% | 80% | 600 | $220 |
| Lead-Acid Flooded | 50% | 85% | 800 | $150 |

### Output

| Output | Unit | Description |
|--------|------|-------------|
| Required Usable Capacity | kWh | Actual usable storage |
| Total Battery Capacity | kWh | Gross capacity needed |
| Capacity at System Voltage | Ah | Amp-hour rating |
| Number of Batteries | - | Total units needed |
| Estimated Cost | $ | Battery cost estimate |
| C-Rate Check | Pass/Fail | Peak power capability |

---

## 4. String Configuration

### Description
Calculate optimal number of panels per string and parallel strings for inverter compatibility.

### Required Inputs

| Input | Label | Unit | Required | Default | Description |
|-------|-------|------|----------|---------|-------------|
| `panelVmp` | Panel Vmp | V | ✅ Yes | - | Max power voltage |
| `panelVoc` | Panel Voc | V | ✅ Yes | - | Open circuit voltage |
| `panelImp` | Panel Imp | A | ✅ Yes | - | Max power current |
| `panelIsc` | Panel Isc | A | No | - | Short circuit current |
| `panelWattage` | Panel Wattage | W | ✅ Yes | - | Panel power rating |
| `inverterMpptMin` | Inverter MPPT Min | V | ✅ Yes | - | Min MPPT voltage |
| `inverterMpptMax` | Inverter MPPT Max | V | ✅ Yes | - | Max MPPT voltage |
| `inverterMaxVoc` | Inverter Max Vdc | V | No | - | Max DC input voltage |
| `inverterMaxCurrent` | Inverter Max Current | A | No | - | Max input current |
| `targetCapacity` | Target Capacity | kWp | No | - | Desired system size |
| `minTemp` | Minimum Temperature | °C | No | -10 | Coldest expected temp |
| `maxTemp` | Maximum Cell Temperature | °C | No | 70 | Hottest cell temp |
| `tempCoeffVoc` | Voc Temp Coefficient | %/°C | No | -0.30 | Voltage temp coeff |

### Formulas

#### 1. Voc at Cold Temperature
```
Voc_cold = Voc_STC × [1 + TempCoeff × (T_min - 25)]
```
**Note:** Voc INCREASES in cold weather

**Example:** 48V × [1 + (-0.003) × (-10 - 25)] = 48 × 1.105 = 53.04V

#### 2. Vmp at Hot Temperature
```
Vmp_hot = Vmp_STC × [1 + TempCoeff × (T_max - 25)]
```
**Note:** Vmp DECREASES in hot weather

**Example:** 40V × [1 + (-0.003) × (70 - 25)] = 40 × 0.865 = 34.6V

#### 3. Maximum Panels per String
```
Max Panels = floor(Inverter Max Voc ÷ Voc_cold)
```
**Example:** floor(600V ÷ 53.04V) = 11 panels

#### 4. Minimum Panels per String
```
Min Panels = ceil(MPPT Min Voltage ÷ Vmp_hot)
```
**Example:** ceil(150V ÷ 34.6V) = 5 panels

#### 5. Optimal Panels per String
```
Optimal = Value closest to (MPPT_min + MPPT_max) ÷ 2 ÷ Vmp
```
**Example:** (150 + 500) ÷ 2 ÷ 40 = 8.1 → 8 panels

#### 6. Number of Parallel Strings
```
Strings = ceil(Target Capacity ÷ (Panels per String × Panel Wattage))
```
**Example:** ceil(10000W ÷ (8 × 550W)) = 3 strings

### Temperature Design Values

| Parameter | Cold Design | Hot Design |
|-----------|-------------|------------|
| Temperature | -10°C | 70°C (cell) |
| Voltage Effect | Voc increases | Vmp decreases |
| ΔT from STC (25°C) | -35°C | +45°C |

### Output

| Output | Unit | Description |
|--------|------|-------------|
| Min Panels per String | panels | Minimum for MPPT |
| Max Panels per String | panels | Maximum for safety |
| Optimal Panels | panels | Recommended |
| String Voc (cold) | V | Max voltage check |
| String Vmp (hot) | V | Min MPPT check |
| Number of Strings | - | Parallel strings needed |
| Total Panels | panels | System total |
| Total Capacity | kWp | Actual capacity |

---

# Financial Tasks

## 5. Financial Analysis

### Description
Comprehensive financial analysis including NPV, IRR, payback period, and ROI calculations.

### Required Inputs

| Input | Label | Unit | Required | Default | Description |
|-------|-------|------|----------|---------|-------------|
| `systemCost` | Total System Cost | $ | ✅ Yes | - | Total installed cost |
| `annualProduction` | Annual Production | kWh | ✅ Yes | - | First-year production |
| `energyRate` | Electricity Rate | $/kWh | ✅ Yes | - | Current grid rate |
| `projectLifetime` | Project Lifetime | years | No | 25 | System lifespan |
| `discountRate` | Discount Rate | % | No | 8 | Opportunity cost |
| `annualDegradation` | Annual Degradation | % | No | 0.5 | Production decline |
| `electricityEscalation` | Electricity Escalation | %/year | No | 3 | Rate increase |
| `annualOMCost` | Annual O&M Cost | $ | No | 0 | Maintenance cost |
| `incentives` | Incentives/Rebates | $ | No | 0 | Tax credits, rebates |

### Formulas

#### 1. Net Present Value (NPV)
```
NPV = Σ(CF_t ÷ (1 + r)^t) - Initial Investment
```
Where:
- CF_t = Cash flow in year t
- r = Discount rate (decimal)
- t = Year number (1 to n)

**Example:** NPV = (6000/1.08¹ + 6000/1.08² + ...) - 50000

#### 2. Internal Rate of Return (IRR)
```
IRR = Rate (r) where NPV = 0
```
**Note:** Solved iteratively using Newton-Raphson method

#### 3. Simple Payback Period
```
Simple Payback = Net Investment ÷ Year 1 Net Savings
```
**Example:** $50,000 ÷ $6,000 = 8.3 years

#### 4. Discounted Payback Period
```
Discounted Payback = Year when Cumulative Discounted CF ≥ Investment
```

#### 5. Return on Investment (ROI)
```
ROI (%) = (Total Benefits - Total Costs) ÷ Total Costs × 100
```
**Example:** ($150,000 - $60,000) ÷ $60,000 × 100 = 150%

#### 6. Levelized Cost of Energy (LCOE)
```
LCOE ($/kWh) = Total Lifetime Cost ÷ Total Lifetime Energy
```
**Example:** $55,000 ÷ 250,000 kWh = $0.22/kWh

#### 7. Year N Savings (with degradation and escalation)
```
Savings_N = Year1_Savings × (1 - degradation)^(N-1) × (1 + escalation)^(N-1)
```

### Financial Benchmarks

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| NPV | > 0 | > 0 | = 0 | < 0 |
| IRR | > 15% | > 10% | > 8% | < 8% |
| Payback | < 5 yrs | < 7 yrs | < 10 yrs | > 10 yrs |
| LCOE vs Grid | < 50% | < 75% | < 100% | > 100% |

### Output

| Output | Unit | Description |
|--------|------|-------------|
| Net Present Value | $ | Discounted profit |
| Internal Rate of Return | % | Effective interest rate |
| Simple Payback | years | Time to recover investment |
| Discounted Payback | years | Time-adjusted recovery |
| ROI | % | Total return percentage |
| LCOE | $/kWh | Cost per unit energy |
| Total Lifetime Savings | $ | 25-year savings |

---

## 6. Payback Analysis

### Description
Calculate simple and discounted payback periods with year-by-year cash flow analysis.

### Required Inputs

| Input | Label | Unit | Required | Default | Description |
|-------|-------|------|----------|---------|-------------|
| `initialInvestment` | Initial Investment | $ | ✅ Yes | - | Upfront cost |
| `annualSavings` | Annual Savings | $/year | ✅ Yes | - | First-year savings |
| `maintenanceCost` | Maintenance Cost | $/year | No | 0 | Annual O&M |
| `escalationRate` | Escalation Rate | %/year | No | 3 | Price increase |
| `discountRate` | Discount Rate | % | No | 8 | Time value |
| `degradation` | Annual Degradation | % | No | 0.5 | Production decline |
| `incentives` | Incentives | $ | No | 0 | Upfront reduction |

### Formulas

#### 1. Simple Payback Period
```
SPP (years) = Net Investment ÷ Annual Net Savings
```
Where Net Investment = Initial Investment - Incentives

#### 2. Net Annual Savings (Year N)
```
Savings_N = (Year1 × (1-deg)^(N-1) × (1+esc)^(N-1)) - Maintenance
```

#### 3. Discounted Cash Flow (Year N)
```
DCF_N = Net Savings_N ÷ (1 + discount)^N
```

#### 4. Cumulative Discounted Cash Flow
```
Cumulative_N = Σ(DCF from Year 1 to N)
```

#### 5. Discounted Payback Period
```
DPP = Year when Cumulative DCF ≥ Net Investment
```

### Payback Ratings

| Rating | Simple Payback | Assessment |
|--------|----------------|------------|
| Excellent | < 5 years | Very attractive |
| Good | 5-7 years | Attractive |
| Acceptable | 7-10 years | Reasonable |
| Marginal | 10-15 years | Consider carefully |
| Poor | > 15 years | Not recommended |

### Output

| Output | Unit | Description |
|--------|------|-------------|
| Simple Payback | years | Basic recovery time |
| Discounted Payback | years | Time-adjusted recovery |
| Break-even Year | year | When profit starts |
| Cash Flow Table | - | Year-by-year breakdown |

---

## 7. ROI Calculation

### Description
Calculate return on investment and benefit-cost ratio for solar investment.

### Required Inputs

| Input | Label | Unit | Required | Default | Description |
|-------|-------|------|----------|---------|-------------|
| `totalInvestment` | Total Investment | $ | ✅ Yes | - | All costs |
| `annualSavings` | Annual Savings | $/year | ✅ Yes | - | Yearly benefits |
| `projectLifetime` | Project Lifetime | years | No | 25 | Operating life |
| `annualOMCost` | Annual O&M | $/year | No | 0 | Maintenance |
| `escalationRate` | Escalation Rate | %/year | No | 3 | Rate increase |
| `degradation` | Degradation | %/year | No | 0.5 | Production decline |
| `incentives` | Incentives | $ | No | 0 | Cost reduction |
| `residualValue` | Residual Value | $ | No | 0 | End-of-life value |

### Formulas

#### 1. Total Lifetime Benefits
```
Total Benefits = Σ(Annual Savings × (1-deg)^(n-1) × (1+esc)^(n-1))
```
For n = 1 to Project Lifetime

#### 2. Total Lifetime Costs
```
Total Costs = Net Investment + (Annual O&M × Lifetime)
```

#### 3. Net Benefit
```
Net Benefit = Total Benefits - Total Costs
```

#### 4. ROI (%)
```
ROI = (Total Benefits - Total Costs) ÷ Total Costs × 100
```

#### 5. Annualized ROI
```
Annual ROI = ROI ÷ Project Lifetime
```

#### 6. Benefit-Cost Ratio (BCR)
```
BCR = Total Benefits ÷ Total Costs
```

### ROI Benchmarks

| ROI Range | Rating | BCR | Interpretation |
|-----------|--------|-----|----------------|
| > 200% | Excellent | > 3.0 | Triple+ return |
| 100-200% | Good | 2.0-3.0 | Double+ return |
| 50-100% | Acceptable | 1.5-2.0 | 50%+ gain |
| 0-50% | Marginal | 1.0-1.5 | Small gain |
| < 0% | Poor | < 1.0 | Loss |

### Output

| Output | Unit | Description |
|--------|------|-------------|
| Total ROI | % | Lifetime return |
| Annualized ROI | % | Per-year return |
| Benefit-Cost Ratio | - | Benefits per $1 spent |
| Net Benefit | $ | Absolute profit |
| Milestone Values | $ | Value at years 5/10/15/20/25 |

---

# Technical Tasks

## 8. Cable Sizing (AC)

### Description
Determine appropriate AC cable size based on current, voltage, distance, and voltage drop requirements.

### Required Inputs

| Input | Label | Unit | Required | Default | Description |
|-------|-------|------|----------|---------|-------------|
| `current` | Operating Current | A | ✅ Yes | - | Max operating current |
| `voltage` | System Voltage | V | ✅ Yes | - | AC voltage |
| `distance` | Cable Distance | m | ✅ Yes | - | One-way length |
| `maxVoltageDrop` | Max Voltage Drop | % | No | 3 | Allowable drop |
| `cableMaterial` | Cable Material | - | No | copper | copper/aluminum |
| `installationType` | Installation Type | - | No | conduit | Method |
| `circuitType` | Circuit Type | - | No | single_phase_ac | Phase type |
| `ambientTemp` | Ambient Temperature | °C | No | 30 | Operating temp |

### Formulas

#### 1. Cable Cross-Section (Voltage Drop Method)
```
A (mm²) = (2 × L × I × ρ) ÷ (Vd × V) × 100
```
For single-phase/DC. Use √3 instead of 2 for three-phase.

**Variables:**
- L = Cable length (m)
- I = Current (A)
- ρ = Resistivity (Cu: 0.0175, Al: 0.0282 Ω·mm²/m)
- Vd = Voltage drop (decimal)
- V = System voltage

**Example:** A = (2 × 50 × 30 × 0.0175) ÷ (0.03 × 400) × 100 = 4.375 mm²

#### 2. Actual Voltage Drop
```
Vdrop (%) = (2 × L × I × ρ) ÷ (A × V) × 100
```

#### 3. Three-Phase Voltage Drop
```
Vdrop (%) = (√3 × L × I × ρ) ÷ (A × V) × 100
```

#### 4. Current Carrying Capacity
```
I_derated = I_base × Temp_Factor × Install_Factor
```

### Standard Cable Sizes (mm²)
```
1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300
```

### Resistivity Values

| Material | Resistivity | Unit |
|----------|-------------|------|
| Copper | 0.0175 | Ω·mm²/m |
| Aluminum | 0.0282 | Ω·mm²/m |

### Temperature Derating Factors (90°C cable)

| Ambient Temp | Factor |
|--------------|--------|
| 30°C | 1.00 |
| 35°C | 0.96 |
| 40°C | 0.91 |
| 45°C | 0.87 |
| 50°C | 0.82 |

### Output

| Output | Unit | Description |
|--------|------|-------------|
| Recommended Cable Size | mm² | Selected size |
| Actual Voltage Drop | % | Calculated drop |
| Voltage Drop (absolute) | V | In volts |
| Cable Ampacity | A | Derated capacity |
| Safety Margin | % | Capacity headroom |

---

## 9. DC Cable Sizing

### Description
Calculate DC cable sizes for solar PV string and main DC cables with NEC compliance.

### Required Inputs

| Input | Label | Unit | Required | Default | Description |
|-------|-------|------|----------|---------|-------------|
| `stringCurrent` | String Current (Isc) | A | ✅ Yes | - | Short circuit current |
| `stringVoltage` | String Voltage (Voc) | V | ✅ Yes | - | Open circuit voltage |
| `numberOfStrings` | Number of Strings | - | ✅ Yes | - | Parallel strings |
| `stringCableLength` | String Cable Length | m | ✅ Yes | - | To combiner box |
| `mainCableLength` | Main Cable Length | m | No | - | To inverter |
| `maxVoltageDrop` | Max Voltage Drop | % | No | 2 | Limit |
| `cableMaterial` | Cable Material | - | No | copper | Conductor |
| `ambientTemp` | Ambient Temperature | °C | No | 40 | Environment |

### Formulas

#### 1. Design Current (NEC Compliant)
```
I_design = Isc × 1.25 × 1.25 = Isc × 1.56
```
**Note:** NEC 690.8 requires 125% for continuous load × 125% safety

#### 2. String Cable Size
```
A (mm²) = (2 × L × I_design × ρ) ÷ (Vd × V) × 100
```
**Minimum:** 4 mm² for mechanical strength

#### 3. Main DC Cable Current
```
I_main = Isc × Number of Strings × 1.25
```

#### 4. Main Cable Size
Same formula as string cable, using main current and length

#### 5. Power Loss
```
P_loss (W) = I² × (2 × L × ρ ÷ A)
```

### Voltage Drop Limits

| Cable Type | Recommended | Maximum |
|------------|-------------|---------|
| String cables | ≤ 1% | ≤ 1.5% |
| Main DC cable | ≤ 2% | ≤ 2.5% |
| Total DC side | ≤ 3% | ≤ 3% |

### Output

| Output | Unit | Description |
|--------|------|-------------|
| String Cable Size | mm² | Per string |
| String Voltage Drop | % | Per string |
| Main Cable Size | mm² | Combiner to inverter |
| Main Voltage Drop | % | Main run |
| Total DC Voltage Drop | % | Combined |
| Power Loss | W | Total DC losses |

---

## 10. Irradiance Calculation

### Description
Calculate solar irradiance and energy production based on location, tilt, and azimuth.

### Required Inputs

| Input | Label | Unit | Required | Default | Description |
|-------|-------|------|----------|---------|-------------|
| `latitude` | Latitude | ° | ✅ Yes | - | Location (-90 to +90) |
| `longitude` | Longitude | ° | No | - | Location (-180 to +180) |
| `tilt` | Panel Tilt | ° | No | latitude | Angle from horizontal |
| `azimuth` | Panel Azimuth | ° | No | 180 | Direction (180=South) |
| `systemCapacity` | System Capacity | kWp | No | - | For production estimate |
| `performanceRatio` | Performance Ratio | % | No | 80 | System efficiency |

### Formulas

#### 1. Global Horizontal Irradiance (GHI)
```
GHI = DNI × cos(θz) + DHI
```
**Variables:**
- DNI = Direct Normal Irradiance
- DHI = Diffuse Horizontal Irradiance
- θz = Solar zenith angle

#### 2. Plane of Array Irradiance (POA)
```
POA = DNI × cos(AOI) + DHI × (1 + cos(β))/2 + GHI × ρ × (1 - cos(β))/2
```
**Variables:**
- AOI = Angle of incidence
- β = Panel tilt
- ρ = Ground albedo (typically 0.2)

#### 3. Peak Sun Hours (PSH)
```
PSH = Daily Irradiation (kWh/m²/day) ÷ 1 kW/m²
```

#### 4. Daily Energy Production
```
E_day (kWh) = Capacity (kWp) × PSH × PR
```

#### 5. Annual Energy Production
```
E_year (kWh) = Capacity × PSH × 365 × PR
```

#### 6. Optimal Tilt Angle
```
Optimal Tilt ≈ |Latitude| (for annual optimization)
```

### PSH by Latitude

| Latitude Range | Region | Avg PSH |
|----------------|--------|---------|
| 0-15° | Tropical | 5.5-6.5 |
| 15-25° | Subtropical | 5.0-6.0 |
| 25-35° | Warm Temperate | 4.5-5.5 |
| 35-45° | Temperate | 4.0-5.0 |
| 45-55° | Cool Temperate | 3.5-4.5 |
| 55-65° | Subarctic | 2.5-3.5 |

### Output

| Output | Unit | Description |
|--------|------|-------------|
| Average Daily PSH | hours | Peak sun hours |
| Annual GHI | kWh/m²/year | Solar resource |
| Optimal Tilt | ° | Best angle |
| Monthly PSH | hours | Per month |
| Annual Production | kWh | Expected output |
| Specific Yield | kWh/kWp | Production per kWp |

---

## 11. Load Analysis

### Description
Analyze load patterns and peak demand to optimize system design.

### Required Inputs

| Input | Label | Unit | Required | Default | Description |
|-------|-------|------|----------|---------|-------------|
| `dailyConsumption` | Daily Consumption | kWh | ✅ Yes | - | Total daily usage |
| `peakDemand` | Peak Demand | kW | ✅ Yes | - | Max power draw |
| `operatingHours` | Operating Hours | hours | No | 24 | Daily operation |
| `loadType` | Load Type | - | No | mixed | residential/commercial/industrial |
| `monthlyBill` | Monthly Bill | $ | No | - | For rate calculation |
| `electricityRate` | Electricity Rate | $/kWh | No | - | Grid rate |

### Formulas

#### 1. Average Load
```
Average Load (kW) = Daily Consumption (kWh) ÷ Operating Hours
```

#### 2. Load Factor
```
Load Factor (%) = Average Load ÷ Peak Load × 100
```

#### 3. Demand Factor
```
Demand Factor = Peak Demand ÷ Total Connected Load × 100
```

#### 4. Monthly/Annual Consumption
```
Monthly = Daily × 30
Annual = Daily × 365
```

#### 5. Recommended PV Size
```
PV Size (kWp) = Annual Consumption ÷ (PSH × 365 × PR)
```

### Load Factor Interpretation

| Load Factor | Interpretation | Typical Application |
|-------------|----------------|---------------------|
| < 30% | High peaks, low average | Residential |
| 30-50% | Moderate variation | Small commercial |
| 50-70% | Consistent load | Large commercial |
| > 70% | Very consistent | Industrial 24/7 |

### Load Profiles

| Type | Peak Hours | Base Factor | Solar Match |
|------|------------|-------------|-------------|
| Residential | 6-9 PM | 0.30 | Moderate |
| Commercial | 9 AM-6 PM | 0.50 | Excellent |
| Industrial | 24/7 | 0.70 | Good |
| Agricultural | Daytime | 0.40 | Good |

### Output

| Output | Unit | Description |
|--------|------|-------------|
| Average Load | kW | Mean power |
| Load Factor | % | Efficiency indicator |
| Base Load | kW | Minimum demand |
| Monthly Consumption | kWh | 30-day usage |
| Annual Cost | $ | Yearly expense |
| Recommended PV Size | kWp | Optimal capacity |
| Storage Recommendation | Yes/No | Battery needed? |

---

## 12. Energy Production

### Description
Estimate monthly and annual energy production with performance ratio.

### Required Inputs

| Input | Label | Unit | Required | Default | Description |
|-------|-------|------|----------|---------|-------------|
| `systemCapacity` | System Capacity | kWp | ✅ Yes | - | DC capacity |
| `location` | Location | - | No | - | For PSH lookup |
| `latitude` | Latitude | ° | No | - | For PSH estimate |
| `peakSunHours` | Peak Sun Hours | hours | No | 5.0 | Average daily PSH |
| `performanceRatio` | Performance Ratio | % | No | 80 | System efficiency |
| `tilt` | Panel Tilt | ° | No | 0 | Installation angle |
| `degradation` | Annual Degradation | %/year | No | 0.5 | Production decline |

### Formulas

#### 1. Daily Energy Production
```
E_day = Capacity × PSH × PR
```

#### 2. Monthly Energy Production
```
E_month = Capacity × Monthly_PSH × Days × PR
```

#### 3. Annual Energy Production
```
E_year = Capacity × PSH × 365 × PR
```

#### 4. Specific Yield
```
SY (kWh/kWp) = Annual Production ÷ System Capacity
```

#### 5. Capacity Factor
```
CF (%) = Annual Production ÷ (Capacity × 8760) × 100
```

#### 6. Year N Production
```
E_N = E_year × (1 - degradation)^(N-1)
```

### Monthly Variation Factors (Northern Hemisphere)

| Month | Factor | Relative to Average |
|-------|--------|---------------------|
| Jan | 0.60 | -40% |
| Feb | 0.70 | -30% |
| Mar | 0.90 | -10% |
| Apr | 1.00 | Average |
| May | 1.10 | +10% |
| Jun | 1.15 | +15% |
| Jul | 1.15 | +15% |
| Aug | 1.10 | +10% |
| Sep | 1.00 | Average |
| Oct | 0.85 | -15% |
| Nov | 0.70 | -30% |
| Dec | 0.55 | -45% |

### Specific Yield Benchmarks

| SY Range | Quality | Typical Region |
|----------|---------|----------------|
| > 1700 kWh/kWp | Excellent | Desert, Tropical |
| 1400-1700 | Good | Mediterranean |
| 1100-1400 | Moderate | Temperate |
| < 1100 | Low | Northern, Cloudy |

### Output

| Output | Unit | Description |
|--------|------|-------------|
| Daily Production | kWh | Average daily |
| Monthly Production | kWh | Per month table |
| Annual Production | kWh | First year |
| Specific Yield | kWh/kWp | Per kWp output |
| Capacity Factor | % | Utilization |
| 25-Year Production | kWh | Lifetime total |

---

## 13. Tilt Optimization

### Description
Find optimal tilt angle for maximum annual energy production.

### Required Inputs

| Input | Label | Unit | Required | Default | Description |
|-------|-------|------|----------|---------|-------------|
| `latitude` | Latitude | ° | ✅ Yes | - | Location |
| `installationType` | Installation Type | - | No | fixed | fixed/seasonal/tracker |
| `seasonalPreference` | Seasonal Preference | - | No | annual | annual/summer/winter |
| `roofPitch` | Roof Pitch | ° | No | - | Existing roof angle |
| `azimuth` | Azimuth | ° | No | 180 | Panel direction |

### Formulas

#### 1. Annual Optimal Tilt
```
Tilt_annual ≈ |Latitude|
```

#### 2. Summer Optimal Tilt
```
Tilt_summer = |Latitude| - 15°
```

#### 3. Winter Optimal Tilt
```
Tilt_winter = |Latitude| + 15°
```

#### 4. Production Factor vs Tilt
```
Factor ≈ cos(Tilt - Optimal)²
```

### Tilt Recommendations by Latitude

| Latitude | Annual | Summer | Winter |
|----------|--------|--------|--------|
| 0° | 10° | 10° | 10° |
| 15° | 15° | 0° | 30° |
| 30° | 30° | 15° | 45° |
| 45° | 45° | 30° | 60° |
| 60° | 60° | 45° | 75° |

### Tracker Gains

| System Type | Production Gain |
|-------------|-----------------|
| Fixed (optimal) | 100% (baseline) |
| Seasonal adjust (2×/year) | +5% |
| Single-axis tracker | +20-25% |
| Dual-axis tracker | +30-40% |

### Output

| Output | Unit | Description |
|--------|------|-------------|
| Optimal Tilt (annual) | ° | Best fixed angle |
| Optimal Tilt (summer) | ° | Summer optimized |
| Optimal Tilt (winter) | ° | Winter optimized |
| Tilt Comparison Table | - | Production at various tilts |
| Tracker Comparison | - | Fixed vs tracker gains |

---

## 14. Earthing Sizing

### Description
Calculate earthing conductor and electrode sizing for solar PV systems.

### Required Inputs

| Input | Label | Unit | Required | Default | Description |
|-------|-------|------|----------|---------|-------------|
| `systemCapacity` | System Capacity | kWp | ✅ Yes | - | PV system size |
| `faultCurrent` | Fault Current | kA | No | - | Max fault current |
| `disconnectionTime` | Disconnection Time | s | No | 0.4 | Fault clearance |
| `soilResistivity` | Soil Resistivity | Ω·m | No | 100 | Earth resistivity |
| `targetEarthResistance` | Target Resistance | Ω | No | 10 | Max allowable |
| `systemVoltage` | System Voltage (AC) | V | No | 230 | For touch voltage |
| `conductorMaterial` | Conductor Material | - | No | copper | Conductor type |
| `electrodeType` | Electrode Type | - | No | rod | rod/plate/strip/ring |

### Formulas

#### 1. Earth Conductor Size (Adiabatic Equation)
```
A (mm²) = (I × √t) ÷ k
```
**k-factors:**
- Copper: 143 A·s½/mm²
- Galvanized Steel: 52 A·s½/mm²
- Copper-clad Steel: 100 A·s½/mm²

**Example:** A = (10000A × √0.4s) ÷ 143 = 44.2 mm²

#### 2. Single Rod Electrode Resistance
```
R = ρ ÷ (2πL) × [ln(4L/d) - 1]
```
**Variables:**
- ρ = Soil resistivity (Ω·m)
- L = Rod length (m)
- d = Rod diameter (m)

**Example:** R = 100 ÷ (2π×3) × [ln(4×3/0.016) - 1] = 28.5 Ω

#### 3. Parallel Rods Resistance
```
R_total = R_single ÷ n × F
```
**F = Multiplying factor based on spacing**

| Rods | Factor (spacing = length) |
|------|---------------------------|
| 1 | 1.00 |
| 2 | 1.16 |
| 3 | 1.29 |
| 4 | 1.36 |
| 5 | 1.41 |

#### 4. Touch Voltage
```
V_touch = I_fault × R_earth
```
**Limit:** < 50V for general areas

### Soil Resistivity Guide

| Soil Type | Resistivity (Ω·m) |
|-----------|-------------------|
| Wet clay | 20-50 |
| Loam | 50-100 |
| Dry clay | 100-200 |
| Sand | 500-3000 |
| Rock | 1000-10000 |
| Gravel | 300-1000 |

### Minimum Conductor Sizes

| Material | Min Size (mm²) |
|----------|----------------|
| Copper | 6 |
| Galvanized Steel | 50 |
| Copper-clad Steel | 16 |

### Output

| Output | Unit | Description |
|--------|------|-------------|
| Main Earth Conductor | mm² | From calculation |
| Equipment Bond | mm² | For frames |
| Single Rod Resistance | Ω | One rod |
| Rods Required | - | To meet target |
| Final Resistance | Ω | Expected |
| Rod Spacing | m | Recommended |
| Touch Voltage Check | Pass/Fail | Safety |

---

# Environmental Tasks

## 15. Carbon Offset

### Description
Calculate CO2 emissions avoided and environmental impact of solar installation.

### Required Inputs

| Input | Label | Unit | Required | Default | Description |
|-------|-------|------|----------|---------|-------------|
| `annualProduction` | Annual Production | kWh | ✅ Yes | - | Yearly generation |
| `gridEmissionFactor` | Grid Emission Factor | kg CO2/kWh | No | 0.45 | Grid carbon intensity |
| `projectLifetime` | Project Lifetime | years | No | 25 | Operating life |
| `degradation` | Annual Degradation | % | No | 0.5 | Production decline |
| `systemCapacity` | System Capacity | kWp | No | - | For embodied carbon |

### Formulas

#### 1. Annual CO2 Avoided
```
CO2 (kg/year) = Annual Production (kWh) × Emission Factor (kg CO2/kWh)
```

#### 2. Lifetime CO2 Avoided
```
Total CO2 (tonnes) = Σ(Year_N Production × Emission Factor) ÷ 1000
```
Accounting for degradation

#### 3. Equivalent Trees
```
Trees = CO2 Avoided (kg) ÷ 22
```
Based on 22 kg CO2/year per mature tree

#### 4. Equivalent Driving Distance
```
km = CO2 Avoided (kg) ÷ 0.12
```
Based on 0.12 kg CO2/km average car

#### 5. Carbon Payback Period
```
Payback (months) = Embodied Carbon (kg) ÷ (Annual CO2 Avoided ÷ 12)
```
Embodied carbon ≈ 40 kg CO2/kWp

### Regional Grid Emission Factors

| Region | kg CO2/kWh |
|--------|------------|
| World Average | 0.45 |
| USA Average | 0.40 |
| EU Average | 0.30 |
| China | 0.55 |
| India | 0.70 |
| Australia | 0.65 |
| Middle East | 0.50 |
| Nordic | 0.10 |

### Environmental Equivalents

| Equivalent | Per kg CO2 |
|------------|------------|
| Trees (annual) | 0.045 trees |
| Car driving | 8.3 km |
| Flights (economy) | 0.0002 LHR-NYC |
| Households (annual) | 0.000125 homes |

### Output

| Output | Unit | Description |
|--------|------|-------------|
| Annual CO2 Avoided | kg | Yearly offset |
| Annual CO2 Avoided | tonnes | Yearly offset |
| Lifetime CO2 Avoided | tonnes | 25-year total |
| Equivalent Trees | trees | Annual absorption |
| Equivalent Driving | km | Distance offset |
| Carbon Payback | months | Mfg payback time |
| Equivalent Homes | homes | Annual emissions |

---

# Standard Reference Values

## Performance Metrics

| Parameter | Value | Source |
|-----------|-------|--------|
| Performance Ratio (PR) | 0.75-0.85 | IEC 61724 |
| System Degradation | 0.5%/year | NREL |
| Inverter Efficiency | 97-99% | CEC |
| Module Efficiency | 20-22% | Tier-1 Mfg |

## Financial Defaults

| Parameter | Value | Source |
|-----------|-------|--------|
| Discount Rate | 8% | Industry Standard |
| Electricity Escalation | 3%/year | Historical Avg |
| System Lifetime | 25 years | Warranty Standard |
| O&M Cost | 1-2% of CAPEX/year | Industry Avg |

## Electrical Standards

| Parameter | Value | Source |
|-----------|-------|--------|
| Max Residential DC Voltage | 600V | NEC (US) |
| Max Commercial DC Voltage | 1000V | IEC |
| Max AC Voltage Drop | 5% | IEC 60364 |
| Max DC Voltage Drop | 3% | Best Practice |
| NEC Continuous Load Factor | 1.25 × 1.25 = 1.56 | NEC 690.8 |

## Material Properties

| Material | Resistivity (Ω·mm²/m) | k-factor |
|----------|----------------------|----------|
| Copper | 0.0175 | 143 |
| Aluminum | 0.0282 | - |
| Galvanized Steel | - | 52 |

---

# Database Schema

## Tables

### `solar_irradiance_data`
| Column | Type | Description |
|--------|------|-------------|
| location | VARCHAR | City/Country |
| latitude | DECIMAL | Degrees |
| longitude | DECIMAL | Degrees |
| monthly_psh | JSON | PSH per month |
| annual_ghi | DECIMAL | kWh/m²/year |

### `panel_specifications`
| Column | Type | Description |
|--------|------|-------------|
| manufacturer | VARCHAR | Brand |
| model | VARCHAR | Model number |
| wattage | INT | Wp rating |
| voc | DECIMAL | Open circuit V |
| vmp | DECIMAL | Max power V |
| isc | DECIMAL | Short circuit A |
| imp | DECIMAL | Max power A |
| efficiency | DECIMAL | % |
| temp_coeff_voc | DECIMAL | %/°C |

### `inverter_specifications`
| Column | Type | Description |
|--------|------|-------------|
| manufacturer | VARCHAR | Brand |
| model | VARCHAR | Model |
| ac_power_kw | DECIMAL | AC output |
| mppt_min | INT | Min MPPT V |
| mppt_max | INT | Max MPPT V |
| max_voc | INT | Max DC input V |
| efficiency | DECIMAL | % |

### `electricity_rates`
| Column | Type | Description |
|--------|------|-------------|
| region | VARCHAR | Location |
| residential_rate | DECIMAL | $/kWh |
| commercial_rate | DECIMAL | $/kWh |
| effective_date | DATE | Rate date |

### `grid_emission_factors`
| Column | Type | Description |
|--------|------|-------------|
| country | VARCHAR | Country |
| emission_factor | DECIMAL | kg CO2/kWh |
| year | INT | Data year |
| source | VARCHAR | Data source |

---

# External APIs

## PVGIS (EU JRC)
- **Endpoint:** `https://re.jrc.ec.europa.eu/api/v5_2/`
- **Data:** Monthly GHI, DNI, DHI, Optimal Tilt, Temperature
- **Coverage:** Europe, Africa, Asia

## NREL PVWatts
- **Endpoint:** `https://developer.nrel.gov/api/pvwatts/v8`
- **Data:** AC Output, Solar Radiation, Capacity Factor
- **Coverage:** USA

## NASA POWER
- **Endpoint:** `https://power.larc.nasa.gov/api/`
- **Data:** GHI, DNI, DHI, Temperature, Wind Speed
- **Coverage:** Global

## Electricity Maps
- **Endpoint:** `https://api.electricitymap.org/`
- **Data:** Real-time carbon intensity, Power breakdown
- **Coverage:** Global

---

# Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-26 | Initial documentation |

---

**Document maintained by:** BAESS Labs
**Last updated:** January 2024

