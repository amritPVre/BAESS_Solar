# 🔍 URGENT: Debug Instructions for Inverter & Battery Issues

## Current Status

Your console log shows:
- ✅ PV Modules: Working ($3,720 for 24.8 kW)
- ❌ **Inverter: 0 kW, $0** (PROBLEM)
- ❌ **Battery Voltage: 0V** (PROBLEM)

---

## 🚨 Action Required: Get Full Debug Output

### Step 1: Refresh Browser
```bash
Ctrl + F5 (Windows) or Cmd + Shift + R (Mac)
```

### Step 2: Open Console
```bash
Press F12
Click "Console" tab
```

### Step 3: Navigate to BOQ Tab
1. Click **BOQ** tab
2. Click **"✨ AI Assisted BOQ Generation"**
3. Look for: `🔋 BOQ Battery Check - FULL:`

### Step 4: Navigate to Project Costing Tab
1. Click **Project Costing** tab
2. Look for: `💰 Costing Debug - FULL:`

### Step 5: Copy BOTH Console Outputs

You should see something like this:

```javascript
🔋 BOQ Battery Check - FULL: {
  numberOfBatteries: 3,
  batteryCapacity: 7.68,
  singleBatteryVoltage: 0,
  selectedBattery: {
    name: "NMC 51.2V 150Ah",
    model: "...",
    voltage: ...,           // ← NEED THIS
    nominal_voltage: ...,   // ← NEED THIS
    capacity: 7.68,
    allFields: [...]        // ← NEED THIS (ALL FIELD NAMES)
  },
  batterySelection: {
    selectedBatteryId: "...",
    technology: "Lithium-Ion",
    batteriesInSeries: 3,
    batteriesInParallel: 1
  }
}

💰 Costing Debug - FULL: {
  pvCapacityKW: 24.8,
  pvModulesPrice: 3720,
  couplingType: "DC",
  inverterPowerKW: 0,
  inverterPrice: 0,
  inverterQuantity: ...,   // ← NEED THIS
  selectedHybridInverter: {
    model: "SUN2000-12K-MB0",
    rated_inverter_ac_capacity_kw: ...,  // ← NEED THIS
    rated_ac_capacity_kw: ...,           // ← NEED THIS
    rated_power_kw: ...,                 // ← NEED THIS
    allFields: [...]                     // ← NEED THIS (ALL FIELD NAMES)
  },
  batteryInfo: {
    selectedBattery: "NMC 51.2V 150Ah",
    numberOfBatteries: 3,
    capacity: 7.68,
    voltage: ...,          // ← NEED THIS
    singleBatteryVoltage: 0
  }
}
```

---

## 🔍 What I'm Looking For

### For Inverter Issue:
1. **`inverterQuantity`** - Is it 0, undefined, or a valid number?
2. **`allFields`** - What are ALL the field names in the inverter object?
3. **`rated_inverter_ac_capacity_kw`** - Is this field present? What's its value?
4. **`rated_ac_capacity_kw`** - Is this field present? What's its value?

### For Battery Issue:
1. **`allFields`** - What are ALL the field names in the battery object?
2. **`voltage`** - Is this field present? What's its value?
3. **`nominal_voltage`** - Is this field present? What's its value?

---

## 💡 Likely Root Causes

### Inverter = 0:

**Scenario 1**: `inverterQuantity` is 0 or undefined
- **Fix**: Need to set inverter quantity in Battery Configuration

**Scenario 2**: Field name mismatch
- **Example**: Database has `ac_capacity` but code looks for `rated_inverter_ac_capacity_kw`
- **Fix**: Update field name once we see `allFields`

### Battery Voltage = 0:

**Scenario 1**: Field name mismatch
- **Example**: Database has `voltage_v` but code looks for `voltage`
- **Fix**: Update field name once we see `allFields`

**Scenario 2**: Voltage not in database
- **Fix**: Parse from battery name "51.2V" → 51.2

---

## 📋 Quick Checklist

Before getting debug output, verify:

### In Battery Configuration Tab:
- [ ] Battery is selected (e.g., "NMC 51.2V 150Ah")
- [ ] Inverter is selected (e.g., "SUN2000-12K-MB0")
- [ ] Inverter quantity is set (e.g., 1)
- [ ] Series/Parallel config is set (e.g., 3S1P)

### If Any Are Missing:
1. Go to **BESS Configuration** tab
2. Select battery
3. Select inverter
4. Set inverter quantity
5. Set series/parallel config
6. **THEN** regenerate BOQ & check costing

---

## 🔧 Immediate Fixes I Can Apply

Once you provide the debug output showing `allFields`, I can:

1. **Update field mappings** to use correct database field names
2. **Add fallback calculations** (e.g., parse "51.2V" from name if voltage field missing)
3. **Fix inverter quantity** if it's a state management issue
4. **Add validation** to show warnings if data is missing

---

## 📝 Example of What to Share

Copy the ENTIRE console output (or screenshot) showing:

```javascript
🔋 BOQ Battery Check - FULL: {...}
💰 Costing Debug - FULL: {...}
```

**Include the expanded objects** (click the triangles to expand):
- `selectedBattery: {...}` ← Expand this
- `selectedHybridInverter: {...}` ← Expand this
- `allFields: [...]` ← **This is the most important!**

---

## ⚡ Why This Debug is Critical

The `allFields` array will show me:
```javascript
allFields: ["id", "model", "voltage_v", "capacity_kwh", "technology", ...]
```

This tells me:
- ✅ "voltage_v" exists → I'll use `selectedBattery.voltage_v`
- ❌ "voltage" doesn't exist → That's why it's 0!

Same for inverter:
```javascript
allFields: ["id", "model", "ac_capacity", "dc_capacity", ...]
```

This tells me:
- ✅ "ac_capacity" exists → I'll use `selectedHybridInverter.ac_capacity`
- ❌ "rated_inverter_ac_capacity_kw" doesn't exist → That's why it's 0!

---

## 🚀 Next Steps

1. **Refresh browser** (Ctrl+F5)
2. **Open console** (F12)
3. **Generate BOQ** → Copy `🔋 BOQ Battery Check - FULL:`
4. **Navigate to Costing** → Copy `💰 Costing Debug - FULL:`
5. **Share both outputs** (paste here or screenshot)
6. **I'll fix the field mappings** immediately

---

## ⏱️ ETA for Fix

Once I see the debug output:
- **5 minutes** to identify correct field names
- **5 minutes** to update code with correct mappings
- **Total: ~10 minutes** to complete fix

---

**Ready! Refresh browser and share the full debug output! 🔍**

