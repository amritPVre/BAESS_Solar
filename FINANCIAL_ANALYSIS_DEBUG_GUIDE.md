# Financial Analysis Debug Guide 🔍

## 🎯 **Console Logging Added**

Comprehensive console logging has been added to debug the data flow from Project Costing and Simulation tabs to the Financial Analysis tab.

---

## 📊 **What to Look For**

### **1. Total Project Cost Calculation** 💰

When you visit the Financial Analysis tab, look for these logs:

```
💰 Financial Analysis - Calculating Total Project Cost
📦 Pricing Data: {...}
📊 Dev Costs: {...}
💵 Equipment Cost: XXXXX
💵 Dev Cost Total: XXXXX
💵 TOTAL PROJECT COST: XXXXX
```

**Expected Values (from your screenshot):**
- Equipment Cost: ~$13,735 (from BOQ table)
- Dev Cost Total: ~$4,257.79 (31% of equipment)
- **TOTAL PROJECT COST: $17,992.59**

**If you see:**
- ⚠️ No pricing data available → BOQ not generated yet
- ❌ Wrong total → Check if BOQ was generated with AI

---

### **2. Initial Investment Update** 🔄

```
🔄 Financial Params Update Check:
  Total Project Cost: XXXXX
  Current Initial Investment: XXXXX
  Should Update? true/false
✅ Updating Initial Investment to: XXXXX
```

**Expected:**
- Total Project Cost: $17,992.59
- Current Initial Investment: (should update to match)
- Should Update: true (if they don't match)
- ✅ Message confirms update

**If you see:**
- Should Update: false → Already up to date
- No ✅ message → Not updating (check why)

---

### **3. Financial Results Calculation Start** 📊

```
📊 ===== FINANCIAL RESULTS CALCULATION =====
📋 Financial Params: {...}
⚡ PV Results: {...}
🔋 Sizing Results: {...}
🏠 Project Data: {...}
```

**Check these objects:**
- Financial Params should have initialInvestment: 17992.59
- PV Results should have dailyGeneration: 105.40 (from screenshot)
- Sizing Results should have energyFlow array
- Project Data should have application: 'Residential'

---

### **4. Energy Metrics** ⚡

```
💰 Initial Investment from params: XXXXX
🎁 Incentives: XXXXX
💵 Net Initial Investment: XXXXX
⚡ PV Daily Generation: XXX.XX
⚡ Total Annual PV (Year 1): XXXXX kWh
📊 Avg Daily Load: XX.XX kWh
📊 Total Annual Load: XXXXX kWh
```

**Expected Values (from your screenshots):**
- PV Daily Generation: **105.40 kWh**
- Total Annual PV (Year 1): **38,471 kWh** (105.40 × 365)
- Net Initial Investment: **$17,992.59** (or with incentives subtracted)

**Current Issue:**
- You're seeing **9,181 kWh** in Year 1 instead of **38,471 kWh**
- This suggests `pvResults.dailyGeneration` is wrong or undefined

---

### **5. Year 1 Detailed Data** 📅

```
📅 YEAR 1 DATA:
  Energy from PV: XXXXX kWh
  Energy from Battery: XXXX kWh
  Total Energy: XXXXX kWh
  Current Tariff: $X.XXX $/kWh
  Revenue: $XXXXX
  O&M Cost: $XXXX
  Gross Profit: $XXXXX
  Tax: $XXXX
  Net Profit: $XXXXX
```

**Expected Values:**
- Energy from PV: ~25,000-38,000 kWh (depending on load)
- Total Energy: Should match simulation tab (38,471 kWh for Year 1)
- Revenue: Should be Energy × Tariff
- Net Profit: Revenue - O&M - Tax

**If Total Energy is wrong:**
- Check "Energy from PV" value
- Verify `pvResults.dailyGeneration` is correct

---

### **6. Final Financial Metrics** 📊

```
📊 ===== FINAL FINANCIAL METRICS =====
💰 NPV: XXXXX
📈 IRR: XX.XX %
⏱️ Payback Period: X.X years
💡 LCOE: $X.XXX $/kWh
📊 Cost Breakdown:
  Battery Cost: XXXXX
  PV Cost: XXXXX
  Other Costs: XXXXX
  Initial Investment: XXXXX
📋 Cashflow Array Length: 25 years
```

**Expected:**
- Initial Investment: **$17,992.59**
- Battery Cost: ~$7,197 (40% of $17,992.59)
- PV Cost: ~$8,097 (45% of $17,992.59)
- Other Costs: ~$2,699 (15% of $17,992.59)
- Cashflow Array: 25 years

**Current Issue:**
- Initial Investment showing **$5,510.908** instead of **$17,992.59**
- This means `financialParams.initialInvestment` is not being set correctly

---

## 🔍 **Troubleshooting Guide**

### **Issue 1: Wrong Initial Investment**

**Symptom:** Showing $5,510.908 instead of $17,992.59

**Check these logs:**
1. ✅ Total Project Cost calculation → Should be $17,992.59
2. ✅ Financial Params Update Check → Should update to $17,992.59
3. ❌ If not updating → Check if `pricingData` exists
4. ❌ If pricingData is null → Generate BOQ first

**Solution:**
1. Go to Project Costing tab
2. Click "AI Assisted BOQ generation"
3. Wait for BOQ to complete
4. Go to Financial Analysis tab
5. Check if initialInvestment updated

---

### **Issue 2: Wrong Energy Values**

**Symptom:** Year 1 showing 9,181 kWh instead of 38,471 kWh

**Check these logs:**
1. ✅ PV Daily Generation → Should be 105.40 kWh
2. ✅ Total Annual PV (Year 1) → Should be 38,471 kWh
3. ❌ If PV Daily Generation is wrong → Check `pvResults` object

**Possible Causes:**
- `pvResults.dailyGeneration` is undefined or wrong
- `pvResults` is from old calculation
- Simulation not run properly

**Solution:**
1. Go to Simulation Result tab
2. Verify daily average shows 105.40 kWh/day
3. Return to Financial Analysis
4. Check if `pvResults.dailyGeneration` matches

---

### **Issue 3: Cost Breakdown Pie Chart Wrong**

**Symptom:** Pie chart showing random values

**Check these logs:**
- Battery Cost: Should be 40% of Initial Investment
- PV Cost: Should be 45% of Initial Investment
- Other Costs: Should be 15% of Initial Investment

**If these are wrong:**
- The Initial Investment is wrong (see Issue 1)
- Fix Initial Investment first, then pie chart will update

---

## 📋 **Expected Console Output**

### **Correct Flow:**

```
💰 Financial Analysis - Calculating Total Project Cost
📦 Pricing Data: {componentPricing: Array(8)}
📊 Dev Costs: {designEngineering: 1, statutoryApproval: 1, ...}
💵 Equipment Cost: 13735.00
💵 Dev Cost Total: 4257.79
💵 TOTAL PROJECT COST: 17992.59

🔄 Financial Params Update Check:
  Total Project Cost: 17992.59
  Current Initial Investment: 0
  Should Update? true
✅ Updating Initial Investment to: 17992.59

📊 ===== FINANCIAL RESULTS CALCULATION =====
📋 Financial Params: {initialInvestment: 17992.59, ...}
⚡ PV Results: {dailyGeneration: 105.40, ...}
🔋 Sizing Results: {numberOfBatteries: 3, ...}
🏠 Project Data: {application: 'Residential', ...}

💰 Initial Investment from params: 17992.59
🎁 Incentives: 0
💵 Net Initial Investment: 17992.59
⚡ PV Daily Generation: 105.40
⚡ Total Annual PV (Year 1): 38471 kWh
📊 Avg Daily Load: 64.52 kWh
📊 Total Annual Load: 23550 kWh

📅 YEAR 1 DATA:
  Energy from PV: 23550 kWh
  Energy from Battery: 0 kWh
  Total Energy: 23550 kWh
  Current Tariff: $0.220 $/kWh
  Revenue: $5181.00
  O&M Cost: $1000
  Gross Profit: $4181.00
  Tax: $836.20
  Net Profit: $3344.80

📊 ===== FINAL FINANCIAL METRICS =====
💰 NPV: XXXXX
📈 IRR: XX.XX %
⏱️ Payback Period: X.X years
💡 LCOE: $X.XXX $/kWh
📊 Cost Breakdown:
  Battery Cost: 7197.04
  PV Cost: 8096.67
  Other Costs: 2698.89
  Initial Investment: 17992.59
📋 Cashflow Array Length: 25 years
```

---

## 🚨 **Common Issues & Fixes**

### **1. "⚠️ No pricing data available"**
**Fix:** Go to Project Costing tab → Click "AI Assisted BOQ generation"

### **2. "Total Project Cost: 0"**
**Fix:** BOQ not generated → Generate BOQ first

### **3. "PV Daily Generation: undefined"**
**Fix:** 
- Go to PV Sizing tab
- Ensure PV system is designed
- Check "Design Assist" tab calculations

### **4. "Initial Investment from params: 0"**
**Fix:** 
- Wait for auto-update (check Update Check logs)
- If not updating, refresh tab

### **5. "Energy from PV: 0 kWh"**
**Fix:**
- Check `pvResults.dailyGeneration`
- Verify simulation ran correctly
- Recalculate in Simulation tab

---

## ✅ **What to Send for Further Debugging**

If issues persist, copy and paste these console logs:

1. **Project Cost Calculation:**
```
💰 Financial Analysis - Calculating Total Project Cost
... (entire block)
💵 TOTAL PROJECT COST: XXXXX
```

2. **Financial Results Calculation:**
```
📊 ===== FINANCIAL RESULTS CALCULATION =====
... (entire block)
```

3. **Year 1 Data:**
```
📅 YEAR 1 DATA:
... (entire block)
```

4. **Final Metrics:**
```
📊 ===== FINAL FINANCIAL METRICS =====
... (entire block)
```

---

## 🎯 **Next Steps**

1. **Visit Financial Analysis Tab**
2. **Open Browser Console** (F12)
3. **Look for the log sections** listed above
4. **Compare values** with expected values
5. **Identify which calculation is wrong**
6. **Apply the relevant fix**

**The console logs will tell us exactly where the data flow breaks! 🔍**

