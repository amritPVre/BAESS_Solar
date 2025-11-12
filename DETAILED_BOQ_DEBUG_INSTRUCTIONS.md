# Detailed BOQ & Energy Debug Instructions 🔍

## 🚨 **Issue Identified**

From your console log, we can see:
```
💵 Equipment Cost: 4206.8      ← ❌ WRONG (should be ~$13,735)
💵 Dev Cost Total: 1304.108
💵 TOTAL PROJECT COST: 5510.908  ← ❌ WRONG (should be $17,992.59)
```

**Root Cause:** The BOQ is incomplete or missing major components (PV modules, batteries, inverters).

---

## 🔍 **New Detailed Logging Added**

I've added two detailed log sections:

### **1. BOQ Component Breakdown** 📋
Shows every item in the BOQ with:
- Category name
- Item name, quantity, unit price
- Item total cost
- Category total

### **2. Energy Metrics Details** ⚡
Shows complete PV and energy data:
- PV Results object structure
- Daily generation value
- System capacity
- Module details
- Annual energy calculations

---

## 📊 **What to Look For**

### **Step 1: Check BOQ Breakdown**

Open the console and look for:

```
💰 ========== TOTAL PROJECT COST CALCULATION ==========
📋 Component Pricing Breakdown:

  Category 1: PV Modules
    Item 1: Solar PV Panels
      Qty: 40 Nos
      Unit Price: $93
      Total: $3720
  ➜ Category Total: $3720

  Category 2: Batteries
    Item 1: NMC 51.2V 150Ah
      Qty: 3 Nos
      Unit Price: $1536
      Total: $4608
  ➜ Category Total: $4608

  Category 3: Inverters
    Item 1: Hybrid Inverter SUN2000-12K-MB0
      Qty: 1 Nos
      Unit Price: $1200
      Total: $1200
  ➜ Category Total: $1200

  [... more categories ...]

💵 ========== COST SUMMARY ==========
💵 Equipment Cost (BOQ Items): 13735.00    ← Should be ~$13,700-14,000
💵 Dev Cost Total (31% of Equipment): 4257.85
💵 TOTAL PROJECT COST: 17992.85           ← Should match screenshot
```

---

### **Step 2: Identify Missing Components**

**Expected Major Items:**

| Component | Qty | Expected Cost |
|-----------|-----|---------------|
| PV Modules (620W × 40) | 40 units | ~$3,720 |
| Batteries (NMC 51.2V 150Ah) | 3 units | ~$4,608 |
| Hybrid Inverter (12kW) | 1 unit | ~$1,200 |
| Mounting Structure | 1 set | ~$800-1,500 |
| Battery Racking | 1 set | ~$500-800 |
| DC Cables (PV + Battery) | meters | ~$500-800 |
| AC Cables | meters | ~$300-500 |
| Electrical BOS | 1 lot | ~$800-1,500 |

**Total Expected:** ~$13,000-14,000

---

### **Step 3: Check Energy Data**

Look for:

```
⚡ ========== ENERGY METRICS ==========
📊 PV Results Object: {...}
⚡ PV Daily Generation: 94.86      ← Check this value
⚡ PV System Capacity: 24.8 kW
⚡ Total Modules: 40
⚡ Module Power: 620 W
⚡ Total Annual PV (Year 1): 34624 kWh   ← Should be ~34,000-38,000
======================================
```

**Expected Values:**
- PV Daily Generation: 94.86 kWh (from your console) or 105.40 kWh (from screenshot)
- PV System Capacity: 24.8 kW ✓
- Total Modules: 40 ✓
- Total Annual PV (Year 1): ~34,600 kWh (94.86 × 365) or ~38,471 kWh (105.40 × 365)

**Note:** The difference might be due to:
- Different PSH (Peak Sun Hours) values
- System losses percentage
- Location/weather data changes

---

## 🛠️ **How to Fix**

### **If Major Components Are Missing from BOQ:**

**Problem:** BOQ only showing BOS items, no PV/Battery/Inverter

**Solution:**

1. **Go to Project Costing Tab**
2. **Click "AI Assisted BOQ generation"** button
3. **Wait for generation to complete** (~30-60 seconds)
4. **Verify the BOQ table shows:**
   - Solar PV Panels (40 units, ~$3,720)
   - Batteries (3 units, ~$4,608)
   - Hybrid Inverter (1 unit, ~$1,200)
   - Mounting Structure
   - Battery Racking
   - Cables (DC + AC)
   - Electrical BOS
5. **Check bottom metrics:**
   - Equipment Cost: ~$13,735
   - Total Project Cost: ~$17,992.59
   - Cost per Wp: ~$0.726/Wp
6. **Then go to Financial Analysis Tab**
7. **Verify Initial Investment updates to $17,992.59**

---

### **If BOQ is Complete but Not Updating:**

**Problem:** BOQ shows correct data but Financial Analysis doesn't update

**Solution:**

1. **Hard Refresh the Tab**
   - Press Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. **Navigate to Financial Analysis Tab Again**
3. **Check console for:**
   ```
   🔄 Financial Params Update Check:
     Total Project Cost: 17992.59
     Current Initial Investment: 5510.908
     Should Update? true
   ✅ Updating Initial Investment to: 17992.59
   ```
4. **If you see "Should Update? false":**
   - The values already match (no update needed)
   - Or the totals are the same (check if BOQ regenerated with same wrong data)

---

### **If Energy Values Are Wrong:**

**Problem:** PV Daily Generation doesn't match Simulation tab

**Console Shows:** 94.86 kWh  
**Screenshot Shows:** 105.40 kWh

**Possible Causes:**
1. **PSH changed** - Check PV Sizing tab
2. **System losses changed** - Default is 15%
3. **Location changed** - Different solar radiation
4. **Module orientation changed** - Affects generation

**Solution:**

1. **Go to Location Tab**
   - Verify location is correct
   - Check solar radiation values
2. **Go to PV Sizing Tab**
   - Verify PSH (Peak Sun Hours)
   - Verify system losses (15%)
   - Verify module configuration
3. **Go to Design Assist Tab**
   - Recalculate the system
   - Check daily generation value
4. **Go to Simulation Result Tab**
   - Verify daily average matches
   - Should show: "105.40 kWh/day" or "94.86 kWh/day"
5. **Go to Financial Analysis Tab**
   - Should use the same value

---

## 📋 **Console Log Checklist**

Please share these specific sections from your console:

### **1. BOQ Breakdown:**
```
💰 ========== TOTAL PROJECT COST CALCULATION ==========
📋 Component Pricing Breakdown:
  [Copy all category and item details]
💵 ========== COST SUMMARY ==========
💵 Equipment Cost (BOQ Items): XXXXX
💵 Dev Cost Total: XXXXX
💵 TOTAL PROJECT COST: XXXXX
```

### **2. Energy Metrics:**
```
⚡ ========== ENERGY METRICS ==========
⚡ PV Daily Generation: XXXXX
⚡ PV System Capacity: XXXXX kW
⚡ Total Annual PV (Year 1): XXXXX kWh
📊 Avg Daily Load: XXXXX kWh
📊 Total Annual Load: XXXXX kWh
======================================
```

### **3. Year 1 Data:**
```
📅 YEAR 1 DATA:
  Energy from PV: XXXXX kWh
  Total Energy: XXXXX kWh
  Revenue: $XXXXX
  Net Profit: $XXXXX
```

---

## 🎯 **Expected vs Actual**

| Metric | Expected | Your Console | Status |
|--------|----------|--------------|--------|
| Equipment Cost | ~$13,735 | $4,206.8 | ❌ WRONG |
| Dev Cost Total | ~$4,257 | $1,304.1 | ❌ WRONG |
| Total Project Cost | $17,992.59 | $5,510.91 | ❌ WRONG |
| PV Daily Generation | 94.86 or 105.40 kWh | ? | ⚠️ CHECK |
| Annual PV (Year 1) | 34,624 or 38,471 kWh | ? | ⚠️ CHECK |

---

## 🔄 **Quick Fix Steps**

1. ✅ **Go to Project Costing Tab**
2. ✅ **Regenerate BOQ** (AI Assisted BOQ generation button)
3. ✅ **Verify BOQ includes:**
   - PV Modules: $3,720
   - Batteries: $4,608
   - Inverter: $1,200
   - Other items: ~$4,000
4. ✅ **Check Total: $17,992.59**
5. ✅ **Go to Financial Analysis Tab**
6. ✅ **Check console for detailed breakdown**
7. ✅ **Verify Initial Investment updates**
8. ✅ **Check Year 1 energy values**

---

## 📸 **What to Share**

After following the steps, please share:

1. **Console log showing BOQ breakdown** (all categories and items)
2. **Console log showing energy metrics**
3. **Screenshot of Project Costing tab** (bottom metrics)
4. **Screenshot of Financial Analysis tab** (initial investment field)
5. **Screenshot of Simulation Result tab** (daily generation)

**This will help us identify exactly what's missing or wrong! 🔍**

