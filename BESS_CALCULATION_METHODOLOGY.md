# BESS Calculation Methodology - Correct Implementation

## 📋 Overview

This document outlines the correct calculation methodology for Battery Energy Storage System (BESS) sizing in both DC-coupled and AC-coupled solar PV + BESS systems.

## 🌞 Key Principle: Day/Night Energy Separation

### Fundamental Concept
- **Daytime (Solar Hours)**: PV supplies load directly + charges battery
- **Nighttime (No Solar)**: Battery supplies entire load
- **Battery sizing**: Based on NIGHTTIME energy only
- **PV sizing**: Must supply daytime load + charge battery for nighttime

---

## 📊 Step 1: Separate Day and Night Energy

### Define Solar Hours
Based on solar irradiation profile or simplified assumption:
```
Typical solar hours: 6:00 AM - 6:00 PM (12 hours)
Night hours: 6:00 PM - 6:00 AM (12 hours)
```

### Calculate Energies
```typescript
// Nighttime Energy (when battery must supply power)
nighttimeEnergy = sum of hourly loads from 18:00 to 06:00

// Daytime Energy (when PV can supply directly)
daytimeEnergy = sum of hourly loads from 06:00 to 18:00

// Total Daily Energy
totalDailyEnergy = nighttimeEnergy + daytimeEnergy
```

### Example:
```
Nighttime Energy (18:00-06:00): 25 kWh
Daytime Energy (06:00-18:00): 35 kWh
Total Daily Energy: 60 kWh
```

---

## 🔋 Step 2: Battery Capacity Calculation

### Formula (Same for AC & DC Coupled)
```
Required Battery Energy = Nighttime Energy / (Discharge Efficiency × DoD)

Where:
- Nighttime Energy: Energy consumed during non-solar hours
- Discharge Efficiency: 0.95 (95%, Li-ion typical)
- DoD (Depth of Discharge): 0.80 (80%) or 0.90 (90%)
```

### Calculation Steps:
1. **Usable Energy Required**
   ```
   Usable Energy = Nighttime Energy / Discharge Efficiency
   Usable Energy = 25 kWh / 0.95 = 26.32 kWh
   ```

2. **Nameplate Capacity (with DoD)**
   ```
   Battery Capacity (80% DoD) = 26.32 / 0.80 = 32.89 kWh
   Battery Capacity (90% DoD) = 26.32 / 0.90 = 29.24 kWh
   ```

3. **With Days of Autonomy**
   ```
   If autonomy = 2 days:
   Battery Capacity = 32.89 × 2 = 65.78 kWh
   ```

---

## ⚡ Step 3: Battery Inverter Sizing (AC & DC Different)

### AC Coupled - Battery Inverter (PCS)

#### Discharge Power Rating
```
Discharge Power = max(Peak Nighttime Load, Battery Max Discharge Rate)

Where:
- Peak Nighttime Load: Maximum load during night hours
- Battery Max Discharge Rate: Typically 0.5C to 1.0C
```

**Example:**
```
Peak Nighttime Load: 4.5 kW
Battery Capacity: 32.89 kWh
Battery Discharge at 0.5C: 32.89 × 0.5 = 16.45 kW

Discharge Power Rating = max(4.5, 16.45) = 16.45 kW
But practically, use Peak Load with 20-30% margin = 4.5 × 1.25 = 5.63 kW
```

#### Charging Power Rating
```
Charging Power = (Battery Capacity / Charging Hours) × (1 / Charging Efficiency) × 1.5

Where:
- Charging Hours: Available solar hours for charging (~4-6 hours)
- Charging Efficiency: 0.95
- 1.5: 50% headroom factor for solar peaks
```

**Example:**
```
Battery Capacity: 32.89 kWh
Charging Hours: 5 hours
Charging Efficiency: 0.95

Required Charging Power = (32.89 / 5) / 0.95 × 1.5
                        = 6.58 / 0.95 × 1.5
                        = 10.39 kW

Final Battery Inverter Rating = max(Discharge, Charging)
                               = max(5.63, 10.39) = 10.39 kW
```

### DC Coupled - Hybrid Inverter

The hybrid inverter must handle multiple scenarios:

```
Hybrid Inverter Rating = max(
    Peak Load,                          // Any time
    PV Peak Power / 1.20,               // DC overloading scenario
    Peak Load + Battery Charging Power,  // Daytime: Load + Battery charging
    Battery Discharging Power           // Nighttime: Battery discharge only
)
```

**Example:**
```
Peak Load: 5.0 kW
PV Capacity: 10.0 kWp → 10.0 / 1.20 = 8.33 kW
Battery Charging (0.5C): 16.45 kW
Peak Load + Charging: 5.0 + 16.45 = 21.45 kW (unrealistic, use practical charging rate)

Practical: Use 0.3C for concurrent load serving
Peak Load + Charging: 5.0 + (32.89 × 0.3) = 14.87 kW

Hybrid Inverter Rating = max(5.0, 8.33, 14.87, 16.45) = 16.45 kW
Practical: 15 kW hybrid inverter
```

---

## ☀️ Step 4: PV Array Sizing

### Total PV Energy Requirement
```
PV must produce:
1. Daytime Load Energy (directly consumed)
2. Battery Charging Energy (for nighttime use)
```

### Formula
```
Total PV Energy Required = Daytime Energy + (Nighttime Energy / (Charging Eff × PV Eff))

Where:
- Daytime Energy: Direct consumption during solar hours
- Nighttime Energy: Energy to be stored for night use
- Charging Efficiency: 0.95 (battery charging)
- PV Efficiency: 0.85 (15% system losses)
```

### PV Capacity Calculation
```
PV Capacity (kWp) = Total PV Energy Required / (Solar Irradiation × PV System Efficiency)

Where:
- Solar Irradiation: Daily average (kWh/m²/day), e.g., 5.0
- PV System Efficiency: 0.85 (after all losses)
```

**Example:**
```
Daytime Energy: 35 kWh
Nighttime Energy: 25 kWh
Charging Efficiency: 0.95
PV Efficiency: 0.85

Battery Charging Energy = 25 / (0.95 × 0.85) = 30.95 kWh

Total PV Energy Required = 35 + 30.95 = 65.95 kWh/day

PV Capacity = 65.95 / (5.0 × 0.85) = 15.52 kWp
```

### With Solar Uncertainty
```
Adjusted Solar Irradiation = 5.0 × (1 - 0.10) = 4.5 kWh/m²/day

PV Capacity = 65.95 / (4.5 × 0.85) = 17.24 kWp
```

---

## 🔌 Step 5: PV Inverter Sizing (AC Coupled Only)

### DC/AC Ratio Method
```
PV Inverter Rating = PV Capacity / DC:AC Ratio

Where DC:AC Ratio: 1.15 to 1.35 (typical 1.25)
```

**Example:**
```
PV Capacity: 17.24 kWp
DC:AC Ratio: 1.25

PV Inverter Rating = 17.24 / 1.25 = 13.79 kW ≈ 14 kW
```

### Alternative: Based on Peak PV Power + Grid Limit
```
If Grid Export Limit = 10 kW:
PV Inverter Rating = min(PV Peak Power / 1.20, Grid Limit)
                   = min(17.24 / 1.20, 10.0) = min(14.37, 10.0) = 10 kW
```

---

## 📐 Step 6: Peak Load Considerations

### For Inverter Sizing
```
Always ensure inverter can handle:

1. Peak Daytime Load (for PV inverter or hybrid)
2. Peak Nighttime Load (for battery inverter or hybrid)
3. Absolute Peak Load (overall maximum)
```

**Example:**
```
Hourly Loads: [2.5, 2.0, 1.8, 1.5, 1.2, 1.5, 3.0, 4.5, 5.0, 4.2, 3.8, 3.5,
               3.2, 3.0, 3.5, 4.0, 4.5, 5.5, 5.0, 4.5, 4.0, 3.5, 3.0, 2.5]

Peak Daytime Load (06:00-18:00): 5.5 kW (at 17:00)
Peak Nighttime Load (18:00-06:00): 5.0 kW (at 18:00)
Absolute Peak Load: 5.5 kW

Inverter must handle ≥ 5.5 kW (with safety margin ~6.6 kW)
```

---

## 🔄 Complete Calculation Flow

### Step-by-Step Process:

1. **Load Analysis**
   - Extract 24-hour load profile
   - Define solar hours (e.g., 06:00-18:00)
   - Calculate nighttime energy
   - Calculate daytime energy
   - Identify peak loads (day/night/overall)

2. **Battery Sizing**
   - Required Energy = Nighttime Energy
   - Apply discharge efficiency losses
   - Apply DoD factor (80% or 90%)
   - Apply days of autonomy multiplier

3. **Battery Inverter Sizing** (AC Coupled)
   - Discharge: Based on peak nighttime load
   - Charging: Based on battery capacity / charging hours with 50% headroom
   - Rating = max(Discharge, Charging)

4. **Hybrid Inverter Sizing** (DC Coupled)
   - Consider: Peak load, PV capacity, battery charging, battery discharging
   - Rating = max(all scenarios)

5. **PV Sizing**
   - Total Energy = Daytime Energy + Battery Charging Energy
   - Apply PV system losses
   - Apply solar uncertainty
   - PV Capacity = Total Energy / (Solar Irradiation × Efficiency)

6. **PV Inverter Sizing** (AC Coupled)
   - Based on DC/AC ratio (1.15-1.35)
   - OR based on peak PV power / 1.20
   - Consider grid export limits

---

## 📊 Summary Comparison: Current vs. Correct

### ❌ CURRENT (WRONG)
```
Battery Capacity = Total Daily Energy (60 kWh) / (Efficiency × DoD)
                 = 60 / (0.90 × 0.80) = 83.33 kWh  ❌ OVERSIZED!

PV Capacity = Total Daily Energy / Solar Irradiation
            = 60 / 5.0 = 12 kWp  ❌ UNDERSIZED!
```

### ✅ CORRECT (RIGHT)
```
Battery Capacity = Nighttime Energy (25 kWh) / (Efficiency × DoD)
                 = 25 / (0.95 × 0.80) = 32.89 kWh  ✅

PV Capacity = (Daytime + Battery Charging) / (Solar Irr × Eff)
            = (35 + 30.95) / (5.0 × 0.85) = 15.52 kWp  ✅
```

**Result**: 
- Battery 2.5× smaller (saves cost!)
- PV 30% larger (produces more energy!)
- System properly balanced!

---

## 🛠️ Implementation Steps for App

### 1. Update Load Analysis Component
- Add function to separate daytime/nighttime hours
- Calculate `nighttimeEnergy` and `daytimeEnergy`
- Identify `peakDaytimeLoad` and `peakNighttimeLoad`

### 2. Update Design Assist Component
- Modify battery sizing logic to use only nighttime energy
- Update PV sizing to include battery charging requirement
- Separate inverter sizing for AC vs DC coupled

### 3. Update Battery Selection Component  
- Change suggested capacity calculation to use nighttime energy
- Update display to show nighttime vs total energy

### 4. Update PV Sizing Component
- Adjust suggested PV capacity formula
- Update DC/AC ratio calculations

### 5. Add Validation & Display
- Show day/night energy breakdown
- Display calculation assumptions
- Add tooltips explaining methodology

---

## 📝 Notes

1. **Solar Hours Definition**: Can be refined based on actual solar irradiation data
2. **C-Rate Flexibility**: Charging/discharging rates should match battery specifications
3. **Safety Margins**: Always include 20-30% margin for real-world variations
4. **Grid Integration**: Consider grid export limits and zero-export mode requirements
5. **Seasonal Variation**: Consider worst-case solar conditions (winter)

---

## 🔗 References

- IEEE Standard 1547: Interconnection Standards
- IEC 62933: Electrical Energy Storage Systems
- NREL PVWatts Documentation
- Battery Manufacturer Datasheets (C-rates, DoD, Efficiencies)

