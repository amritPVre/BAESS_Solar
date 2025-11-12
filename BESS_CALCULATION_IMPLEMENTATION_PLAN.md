# BESS Calculation Implementation Plan

## 📋 Overview
This document outlines the step-by-step plan to update the BESS Designer app with the correct calculation methodology.

---

## 🎯 Implementation Steps

### **STEP 1: Create Utility Functions for Day/Night Energy Separation**

**Location**: New file `src/utils/bessCalculations.ts`

**Functions to Create**:

```typescript
/**
 * Separates 24-hour load profile into daytime and nighttime energy
 * @param hourlyLoads - Array of 24 hourly load values (kWh)
 * @param solarStartHour - Hour when solar production starts (default: 6 for 6:00 AM)
 * @param solarEndHour - Hour when solar production ends (default: 18 for 6:00 PM)
 * @returns Object with daytime, nighttime, and total energy
 */
export function separateDayNightEnergy(
    hourlyLoads: number[], 
    solarStartHour: number = 6, 
    solarEndHour: number = 18
): {
    daytimeEnergy: number;
    nighttimeEnergy: number;
    totalEnergy: number;
    peakDaytimeLoad: number;
    peakNighttimeLoad: number;
    peakLoad: number;
}

/**
 * Calculates battery capacity based on nighttime energy only
 */
export function calculateBatteryCapacity(
    nighttimeEnergy: number,
    dischargeEfficiency: number = 0.95,
    depthOfDischarge: number = 0.80,
    daysOfAutonomy: number = 1
): {
    usableCapacity: number;
    nameplateCapacity: number;
}

/**
 * Calculates PV capacity including battery charging requirement
 */
export function calculatePVCapacity(
    daytimeEnergy: number,
    nighttimeEnergy: number,
    avgDailySolarIrradiation: number,
    pvSystemLosses: number = 0.15,
    chargingEfficiency: number = 0.95,
    solarUncertainty: number = 0.10
): {
    totalEnergyRequired: number;
    pvCapacity: number;
    adjustedSolarIrradiation: number;
}

/**
 * Calculates battery inverter sizing for AC coupled system
 */
export function calculateBatteryInverterAC(
    batteryCapacity: number,
    peakNighttimeLoad: number,
    chargingHours: number = 5,
    chargingEfficiency: number = 0.95,
    cRate: number = 0.5
): {
    dischargePower: number;
    chargingPower: number;
    requiredRating: number;
}

/**
 * Calculates hybrid inverter sizing for DC coupled system
 */
export function calculateHybridInverterDC(
    batteryCapacity: number,
    peakLoad: number,
    pvCapacity: number,
    cRate: number = 0.5
): {
    peakLoadScenario: number;
    pvOverloadScenario: number;
    loadPlusChargingScenario: number;
    dischargingScenario: number;
    requiredRating: number;
}

/**
 * Calculates PV inverter sizing for AC coupled system
 */
export function calculatePVInverterAC(
    pvCapacity: number,
    dcAcRatio: number = 1.25,
    peakDaytimeLoad: number = 0
): {
    ratingByDcAcRatio: number;
    ratingByOverload: number;
    recommendedRating: number;
}
```

**Why**: Centralized, testable, reusable calculation functions

---

### **STEP 2: Update DesignAssist Component**

**Location**: `src/pages/BESSDesigner.tsx` (lines 875-1307)

**Changes**:

1. **Import the new utility functions**
   ```typescript
   import { 
       separateDayNightEnergy, 
       calculateBatteryCapacity,
       calculatePVCapacity,
       calculateBatteryInverterAC,
       calculateHybridInverterDC,
       calculatePVInverterAC
   } from '@/utils/bessCalculations';
   ```

2. **Replace existing calculation logic**
   ```typescript
   const recommendations = useMemo(() => {
       // OLD: const dailyEnergyConsumption = hourlyData.reduce(...)
       
       // NEW: Separate day/night energy
       const energySplit = separateDayNightEnergy(hourlyData);
       const { daytimeEnergy, nighttimeEnergy, totalEnergy, peakDaytimeLoad, peakNighttimeLoad, peakLoad } = energySplit;
       
       // Calculate battery capacity (80% and 90% DoD)
       const battery80 = calculateBatteryCapacity(nighttimeEnergy, 0.95, 0.80, 1);
       const battery90 = calculateBatteryCapacity(nighttimeEnergy, 0.95, 0.90, 1);
       
       // Calculate PV capacity
       const pvSizing = calculatePVCapacity(
           daytimeEnergy, 
           nighttimeEnergy, 
           avgDailySolarIrradiation
       );
       
       // Calculate inverters
       const batteryInvAC = calculateBatteryInverterAC(battery80.nameplateCapacity, peakNighttimeLoad);
       const hybridInvDC = calculateHybridInverterDC(battery80.nameplateCapacity, peakLoad, pvSizing.pvCapacity);
       const pvInvAC = calculatePVInverterAC(pvSizing.pvCapacity, 1.25, peakDaytimeLoad);
       
       return {
           // Energy breakdown
           daytimeEnergy,
           nighttimeEnergy,
           totalEnergy,
           peakDaytimeLoad,
           peakNighttimeLoad,
           peakLoad,
           
           // Battery
           batteryCapacity80DoD: battery80.nameplateCapacity,
           batteryCapacity90DoD: battery90.nameplateCapacity,
           usableBatteryCapacity80: battery80.usableCapacity,
           usableBatteryCapacity90: battery90.usableCapacity,
           
           // PV
           pvSize: pvSizing.pvCapacity,
           totalEnergyRequired: pvSizing.totalEnergyRequired,
           adjustedSolarIrradiation: pvSizing.adjustedSolarIrradiation,
           
           // Inverters
           dcCoupledInverterRating: hybridInvDC.requiredRating,
           acCoupledPvInverterRating: pvInvAC.recommendedRating,
           acCoupledBatteryInverterRating: batteryInvAC.requiredRating,
           
           // Detailed breakdown
           batteryInverterDetails: batteryInvAC,
           hybridInverterDetails: hybridInvDC,
           pvInverterDetails: pvInvAC,
       };
   }, [hourlyData, avgDailySolarIrradiation]);
   ```

3. **Update UI to show day/night breakdown**
   ```typescript
   {/* NEW: Energy Breakdown Section */}
   <Card>
       <CardHeader>
           <CardTitle>📊 Energy Consumption Analysis</CardTitle>
       </CardHeader>
       <CardContent>
           <div className="grid grid-cols-3 gap-4">
               <div className="p-4 bg-blue-500/10 rounded-lg">
                   <p className="text-sm text-blue-200">Daytime Energy</p>
                   <p className="text-2xl font-bold text-blue-300">
                       {recommendations.daytimeEnergy.toFixed(2)} kWh
                   </p>
                   <p className="text-xs text-blue-200/70">06:00 - 18:00 (Solar Hours)</p>
               </div>
               <div className="p-4 bg-purple-500/10 rounded-lg">
                   <p className="text-sm text-purple-200">Nighttime Energy</p>
                   <p className="text-2xl font-bold text-purple-300">
                       {recommendations.nighttimeEnergy.toFixed(2)} kWh
                   </p>
                   <p className="text-xs text-purple-200/70">18:00 - 06:00 (Battery Supply)</p>
               </div>
               <div className="p-4 bg-cyan-500/10 rounded-lg">
                   <p className="text-sm text-cyan-200">Total Daily Energy</p>
                   <p className="text-2xl font-bold text-cyan-300">
                       {recommendations.totalEnergy.toFixed(2)} kWh
                   </p>
                   <p className="text-xs text-cyan-200/70">24-hour consumption</p>
               </div>
           </div>
       </CardContent>
   </Card>
   ```

**Why**: This is the core logic that drives all recommendations

---

### **STEP 3: Update BatterySelection Component**

**Location**: `src/pages/BESSDesigner.tsx` (lines 2299-2771)

**Changes**:

1. **Update battery capacity calculation**
   ```typescript
   // OLD: Uses total daily energy
   // const dailyEnergyConsumption = useMemo(() => hourlyData.reduce((sum: number, val: number) => sum + val, 0), [hourlyData]);
   
   // NEW: Use nighttime energy only
   const energySplit = useMemo(() => separateDayNightEnergy(hourlyData), [hourlyData]);
   const { nighttimeEnergy, totalEnergy } = energySplit;
   
   // Calculate suggested battery capacity using NIGHTTIME energy only
   const chargingEfficiency = 0.95;
   const dischargingEfficiency = 0.95;
   const daysOfAutonomy = sizingParams?.autonomy || 1;
   const depthOfDischarge = 0.80;
   
   const batterySizing = useMemo(() => 
       calculateBatteryCapacity(nighttimeEnergy, dischargingEfficiency, depthOfDischarge, daysOfAutonomy),
       [nighttimeEnergy, dischargingEfficiency, depthOfDischarge, daysOfAutonomy]
   );
   
   const suggestedBatteryCapacity = batterySizing.nameplateCapacity;
   ```

2. **Update display to show energy breakdown**
   ```typescript
   {/* Update "Required Energy per Day" card */}
   <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-indigo-500/40">
       <div className="flex items-center justify-between mb-3">
           <p className="text-sm font-bold text-indigo-200">Required Energy per Day</p>
           <Zap className="h-6 w-6 text-indigo-400" />
       </div>
       <p className="text-4xl font-bold bg-gradient-to-r from-indigo-300 to-blue-300 bg-clip-text text-transparent">
           {totalEnergy.toFixed(2)} kWh
       </p>
       <div className="mt-3 pt-3 border-t border-indigo-500/30">
           <div className="grid grid-cols-2 gap-2 text-xs">
               <div>
                   <p className="text-indigo-300/70">☀️ Daytime</p>
                   <p className="font-bold text-indigo-200">{energySplit.daytimeEnergy.toFixed(1)} kWh</p>
               </div>
               <div>
                   <p className="text-purple-300/70">🌙 Nighttime</p>
                   <p className="font-bold text-purple-200">{nighttimeEnergy.toFixed(1)} kWh</p>
               </div>
           </div>
       </div>
       <p className="text-xs text-indigo-200/70 mt-2">⚡ Battery sized for nighttime only</p>
   </div>
   ```

**Why**: Ensures battery is sized correctly based on nighttime energy only

---

### **STEP 4: Update PVSizing Component**

**Location**: `src/pages/BESSDesigner.tsx` (PVSizing component)

**Changes**:

1. **Update suggested PV capacity calculation**
   ```typescript
   // Receive day/night energy split as props
   const PVSizing = ({ 
       pvParams, 
       setPvParams, 
       pvResults, 
       couplingType, 
       bessCapacity, 
       avgDailySolarIrradiation,
       batterySelection,
       daytimeEnergy,    // NEW PROP
       nighttimeEnergy   // NEW PROP
   }: any) => {
       // ...existing state...
       
       // NEW: Calculate PV capacity correctly
       const pvSizing = useMemo(() => 
           calculatePVCapacity(daytimeEnergy, nighttimeEnergy, avgDailySolarIrradiation),
           [daytimeEnergy, nighttimeEnergy, avgDailySolarIrradiation]
       );
       
       const suggestedPvCapacity = pvSizing.pvCapacity;
       const totalEnergyRequired = pvSizing.totalEnergyRequired;
       
       // Rest of the component...
   }
   ```

2. **Update top "Suggested PV Configuration" section**
   ```typescript
   <Card>
       <CardHeader>
           <CardTitle>☀️ Suggested PV Configuration</CardTitle>
           <p className="text-xs text-cyan-200/70 mt-2">
               Based on {daytimeEnergy.toFixed(1)} kWh daytime load + 
               {nighttimeEnergy.toFixed(1)} kWh battery charging requirement
           </p>
       </CardHeader>
       <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="p-4 bg-slate-800/80 rounded-lg">
                   <p className="text-xs text-cyan-200/70">Total PV Energy Required</p>
                   <p className="text-2xl font-bold text-cyan-300">
                       {totalEnergyRequired.toFixed(2)} kWh/day
                   </p>
                   <p className="text-xs text-cyan-200/60 mt-1">
                       Daytime: {daytimeEnergy.toFixed(1)} + 
                       Battery: {(totalEnergyRequired - daytimeEnergy).toFixed(1)}
                   </p>
               </div>
               {/* ... other cards ... */}
           </div>
       </CardContent>
   </Card>
   ```

**Why**: Ensures PV is sized to supply both daytime load AND battery charging

---

### **STEP 5: Update Main BESSDesigner Component**

**Location**: `src/pages/BESSDesigner.tsx` (main export function)

**Changes**:

1. **Calculate energy split at top level**
   ```typescript
   // Add this near other useMemo calculations
   const energySplit = useMemo(() => {
       const hourlyData = loadData.weekday || [];
       return separateDayNightEnergy(hourlyData);
   }, [loadData]);
   ```

2. **Pass energy split to components**
   ```typescript
   case 'design-assist':
       return <DesignAssist 
           projectData={projectData} 
           loadData={loadData} 
           setPvParams={setPvParams} 
           setSizingParams={setSizingParams}
           energySplit={energySplit}  // NEW PROP
       />;
   
   case 'battery':
       return <BatterySelection 
           batterySelection={batterySelection} 
           setBatterySelection={setBatterySelection} 
           loadData={loadData} 
           sizingParams={sizingParams}
           projectData={projectData}
           energySplit={energySplit}  // NEW PROP
       />;
   
   case 'pv': {
       // ... existing BESS capacity calculation ...
       return <PVSizing 
           pvParams={pvParams} 
           setPvParams={setPvParams} 
           pvResults={pvResults} 
           couplingType={batterySelection.couplingType} 
           bessCapacity={totalBessCapacity} 
           avgDailySolarIrradiation={projectData.avgDailySolarIrradiation}
           batterySelection={batterySelection}
           daytimeEnergy={energySplit.daytimeEnergy}    // NEW PROP
           nighttimeEnergy={energySplit.nighttimeEnergy}  // NEW PROP
       />;
   }
   ```

**Why**: Ensures energy split is calculated once and passed consistently

---

### **STEP 6: Update Daily Load Profile Display**

**Location**: `src/pages/BESSDesigner.tsx` (LoadAnalysis component)

**Changes**:

1. **Add visual indicator for day/night hours**
   ```typescript
   {/* In the chart section */}
   <ResponsiveContainer width="100%" height={300}>
       <BarChart data={chartData}>
           <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
           <XAxis 
               dataKey="hour" 
               stroke="#9CA3AF" 
               tick={{ fill: '#9CA3AF' }}
           />
           <YAxis 
               label={{ value: 'Load (kWh)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} 
               stroke="#9CA3AF" 
               tick={{ fill: '#9CA3AF' }}
           />
           <Tooltip 
               contentStyle={{ 
                   backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                   border: '1px solid #4B5563',
                   borderRadius: '8px'
               }}
               formatter={(value: number, name: string) => {
                   const hour = parseInt(name);
                   const period = (hour >= 6 && hour < 18) ? '☀️ Daytime (PV)' : '🌙 Nighttime (Battery)';
                   return [`${value.toFixed(2)} kWh`, period];
               }}
           />
           
           {/* NEW: Add reference areas for day/night */}
           <ReferenceArea 
               x1={0} 
               x2={5} 
               fill="#9333ea" 
               fillOpacity={0.1} 
               label={{ value: 'Night', position: 'top', fill: '#c084fc' }}
           />
           <ReferenceArea 
               x1={6} 
               x2={17} 
               fill="#0ea5e9" 
               fillOpacity={0.1} 
               label={{ value: 'Day (Solar)', position: 'top', fill: '#38bdf8' }}
           />
           <ReferenceArea 
               x1={18} 
               x2={23} 
               fill="#9333ea" 
               fillOpacity={0.1} 
               label={{ value: 'Night', position: 'top', fill: '#c084fc' }}
           />
           
           <Bar 
               dataKey="value" 
               fill="url(#colorGradient)" 
               radius={[4, 4, 0, 0]}
           />
           
           <defs>
               <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9}/>
                   <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6}/>
               </linearGradient>
           </defs>
       </BarChart>
   </ResponsiveContainer>
   
   {/* NEW: Show energy split summary */}
   <div className="grid grid-cols-3 gap-4 mt-4">
       <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
           <p className="text-xs text-blue-200">☀️ Daytime Energy</p>
           <p className="text-xl font-bold text-blue-300">
               {energySplit.daytimeEnergy.toFixed(2)} kWh
           </p>
           <p className="text-xs text-blue-200/60">06:00 - 18:00</p>
       </div>
       <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
           <p className="text-xs text-purple-200">🌙 Nighttime Energy</p>
           <p className="text-xl font-bold text-purple-300">
               {energySplit.nighttimeEnergy.toFixed(2)} kWh
           </p>
           <p className="text-xs text-purple-200/60">18:00 - 06:00</p>
       </div>
       <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
           <p className="text-xs text-cyan-200">📊 Total Energy</p>
           <p className="text-xl font-bold text-cyan-300">
               {energySplit.totalEnergy.toFixed(2)} kWh
           </p>
           <p className="text-xs text-cyan-200/60">24 hours</p>
       </div>
   </div>
   ```

**Why**: Helps users visually understand the day/night energy split

---

## 🧪 Testing Plan

### Test Case 1: Simple Residential Load
```
Scenario:
- Daytime energy (6am-6pm): 20 kWh
- Nighttime energy (6pm-6am): 15 kWh
- Peak daytime load: 3 kW
- Peak nighttime load: 2.5 kW
- Solar irradiation: 5.0 kWh/m²/day

Expected Results:
- Battery Capacity (80% DoD): ~19.74 kWh
- PV Capacity: ~11.88 kWp
- Battery Inverter (AC): ~8.30 kW
- Hybrid Inverter (DC): ~9.87 kW
- PV Inverter (AC): ~9.50 kW
```

### Test Case 2: Commercial Load with High Daytime Consumption
```
Scenario:
- Daytime energy: 150 kWh (heavy machinery)
- Nighttime energy: 50 kWh (base load)
- Peak daytime load: 25 kW
- Peak nighttime load: 8 kW
- Solar irradiation: 5.5 kWh/m²/day

Expected Results:
- Battery Capacity (80% DoD): ~65.79 kWh
- PV Capacity: ~50.88 kWp (much larger due to daytime load)
- Battery Inverter (AC): ~27.98 kW
- Hybrid Inverter (DC): ~42.37 kW
- PV Inverter (AC): ~40.70 kW
```

### Test Case 3: Edge Case - All Nighttime Load
```
Scenario:
- Daytime energy: 5 kWh (minimal)
- Nighttime energy: 50 kWh (all consumption at night)
- Peak load: 8 kW
- Solar irradiation: 5.0 kWh/m²/day

Expected Results:
- Battery Capacity (80% DoD): ~65.79 kWh
- PV Capacity: ~14.47 kWp (sized for battery charging)
- System shows battery supplies all load
```

---

## 📊 Validation Checklist

Before deployment, verify:

- [ ] Battery capacity is based on nighttime energy only
- [ ] PV capacity includes both daytime load AND battery charging requirement
- [ ] Inverter sizing accounts for peak loads correctly
- [ ] Day/night energy breakdown is displayed in UI
- [ ] Design Assist recommendations are correct
- [ ] AC coupled calculations match methodology
- [ ] DC coupled calculations match methodology
- [ ] All existing projects still load correctly
- [ ] Save/restore functionality works with new calculations
- [ ] Export/PDF includes updated methodology

---

## 🚀 Deployment Order

1. **Phase 1**: Create utility functions (STEP 1)
   - Test functions independently
   - Write unit tests

2. **Phase 2**: Update DesignAssist (STEP 2)
   - Verify recommendations are correct
   - Test with multiple load profiles

3. **Phase 3**: Update BatterySelection (STEP 3)
   - Ensure battery sizing is correct
   - Test with different autonomy settings

4. **Phase 4**: Update PVSizing (STEP 4)
   - Verify PV capacity calculations
   - Test AC and DC coupled separately

5. **Phase 5**: Update main component (STEP 5)
   - Integrate all changes
   - End-to-end testing

6. **Phase 6**: Update UI/UX (STEP 6)
   - Add visual indicators
   - Improve user understanding

---

## 📝 Documentation Updates

After implementation, update:

1. **User Guide**: Explain day/night energy concept
2. **Methodology Section**: Detail calculation formulas
3. **FAQ**: Address common questions about sizing
4. **API Documentation**: If exposing calculation endpoints
5. **Release Notes**: Highlight breaking changes and improvements

---

## ⚠️ Breaking Changes

**Important**: This is a breaking change to the calculation methodology.

- Existing projects may show different battery/PV sizes
- Add migration notice for users
- Consider adding a "Recalculate" button for saved projects
- Keep old calculation as "legacy" option (optional)

---

## 🎯 Success Metrics

- Battery capacity reduced by ~40-60% for typical loads
- PV capacity increased by ~20-30%
- System cost optimized (battery savings > PV increase)
- User comprehension improved with day/night visualization
- Calculation accuracy validated against industry standards

