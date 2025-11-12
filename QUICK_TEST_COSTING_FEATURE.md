# Quick Test Guide - AI Costing & Mounting Structure 🚀

## ⚡ Quick Start (5 minutes)

### Step 1: Design System (2 min)
1. Navigate to **PV Sizing** tab
2. Enter basic config:
   - Total modules: 14
   - Modules per row: 10
   - Rows per table: 2
   - Mounting Type: Fixed Tilt
3. Complete **Battery Configuration** (select inverter)
4. Complete **Cable Sizing**

### Step 2: Generate BOQ (1 min)
1. Navigate to **BOQ** tab
2. Click **"✨ AI Assisted BOQ Generation"**
3. Wait ~20-30 seconds
4. ✅ Verify mounting structure items appear (Rails, Clamps, Foundation)

### Step 3: Generate Pricing (2 min)
1. Navigate to **Project Costing** tab (NEW!)
2. Click **"💰 Generate Pricing"**
3. Wait ~20-30 seconds
4. ✅ See 4 summary cards + detailed pricing tables

---

## ✅ What to Check

### BOQ Tab - Mounting Structure Items
Look for these AI-generated items:
- [ ] Foundation Posts/System
- [ ] Main Rails (Aluminum 6063-T6)
- [ ] Cross Rails
- [ ] Mid Clamps (with calculated qty)
- [ ] End Clamps (with calculated qty)
- [ ] Hardware Kit
- [ ] Earthing Lugs (for ground mount)

**Example Output**:
```
5. Foundation Posts - Ground Mounting
   Spec: Galvanized steel, 100×100mm, L=2m, concrete foundation
   Unit: Nos | QTY: 8

6. Main Rails - PV Module Support
   Spec: Aluminum 6063-T6, 40×40mm, L=6m, anodized
   Unit: Mtrs | QTY: 24

7. Mid Clamps - Module Fixing
   Spec: SS304, adjustable height, torque 12-15 Nm, IEC 61215
   Unit: Nos | QTY: 36
```

### Project Costing Tab - Summary
Check these 4 cards:
- [ ] **PV Modules**: `PV_kW × $150` (e.g., 8.82 kW = $1,323)
- [ ] **Inverter**: `Inv_kW × $100` (hybrid) or `× $70` (PV)
- [ ] **Electrical BOS**: AI-calculated (e.g., $3,200)
- [ ] **Total Project**: Sum of all (e.g., $15,249)

### Project Costing Tab - Detailed Pricing
Check these 7 categories exist:
- [ ] 1. PV Mounting Structure
- [ ] 2. Battery Racking
- [ ] 3. Earthing System
- [ ] 4. Lightning Protection
- [ ] 5. Cable Management
- [ ] 6. Distribution & Protection
- [ ] 7. Safety & Testing

Each category should show:
- Item names
- Quantities with units
- Unit prices in USD
- Total prices calculated correctly

---

## 🐛 Common Issues

### Issue: Costing button disabled
**Fix**: Generate BOQ first in BOQ tab

### Issue: No mounting items in BOQ
**Fix**: 
1. Set mounting config in PV Sizing tab
2. Regenerate BOQ

### Issue: API Error
**Fix**: 
1. Check `.env` has `VITE_OPENROUTER_API_KEY`
2. Restart dev server
3. Clear browser cache (Ctrl+F5)

---

## 💡 Expected Values

### Fixed Pricing (DO NOT CHANGE):
| Item | Rate | Example Calculation |
|------|------|---------------------|
| PV Modules | $150/kW | 8.82 kW × $150 = **$1,323** |
| Hybrid Inv | $100/kW | 12 kW × $100 = **$1,200** |
| PV Inv | $70/kW | 10 kW × $70 = **$700** |
| Battery Inv | $65/kW | 5 kW × $65 = **$325** |

### AI Pricing (Varies by region/market):
- Mounting Structure: ~$1,000-3,000
- Battery Racking: ~$500-1,500
- Earthing: ~$300-800
- Lightning Protection: ~$400-1,200
- Cable Management: ~$200-600
- Distribution Boxes: ~$800-2,000
- Safety & Testing: ~$300-800

---

## 🎯 Success Criteria

✅ **BOQ Tab**:
- Mounting structure items appear
- Items have specifications with standards (IEC/IS)
- Quantities are calculated (not "As required")
- Clamp quantities match formulas

✅ **Costing Tab**:
- Summary cards show correct fixed prices
- 7 detailed categories appear
- All prices are realistic USD amounts
- Total matches sum of categories
- No $0 or missing prices

---

## 📸 Screenshot Locations

1. **PV Sizing**: Mounting configuration section
2. **BOQ**: Mounting structure items (rows 5-11)
3. **Costing**: 4 summary cards at top
4. **Costing**: Detailed pricing tables for each category

---

## 🔍 Console Logs to Check

Open browser console (F12), look for:

**BOQ Generation**:
```javascript
🤖 Calling OpenRouter AI API...
📦 Project Context: {mountingType: "Fixed Tilt", ...}
✅ AI BOQ generated: 45 items
```

**Costing Generation**:
```javascript
Calling pricing API...
✅ Pricing generated successfully
```

**Errors to watch**:
```javascript
❌ API Error: 404 // Wrong model name
❌ API Error: 401 // Missing/invalid API key
❌ API Error: 429 // Rate limit exceeded
```

---

## ⏱️ Performance

Expected generation times:
- **BOQ Generation**: 20-40 seconds
- **Costing Generation**: 20-40 seconds
- **Total Time**: 40-80 seconds for full workflow

If slower:
- Check internet connection
- Check OpenRouter API status
- Try regenerating

---

## 📝 Test Checklist

### Before Testing:
- [ ] `.env` has `VITE_OPENROUTER_API_KEY`
- [ ] Dev server running (`npm run dev`)
- [ ] Browser cache cleared (Ctrl+F5)

### During Testing:
- [ ] Design system in PV Sizing (mounting config)
- [ ] Select inverter in Battery Config
- [ ] Complete Cable Sizing
- [ ] Generate BOQ (verify mounting items)
- [ ] Generate Pricing (verify all categories)
- [ ] Check console for errors

### After Testing:
- [ ] BOQ has 40+ items including mounting
- [ ] Costing shows 4 summary cards
- [ ] Costing shows 7 detailed categories
- [ ] All prices are realistic USD amounts
- [ ] No errors in console

---

## 🚀 Ready to Test!

1. **Start Dev Server**: `npm run dev`
2. **Open App**: http://localhost:8080 (or your port)
3. **Follow Steps 1-3** above
4. **Check Success Criteria**
5. **Report Any Issues**

**Happy Testing! 🎉**

