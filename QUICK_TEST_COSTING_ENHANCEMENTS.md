# Quick Test Guide - Project Costing Enhancements 🚀

## ⚡ What's New (5 Major Features)

### 1. ✅ Inverter Price Now Shows Correctly
- Was: $0
- Now: Actual price based on inverter type and capacity

### 2. ✅ Component Details Below Summary Cards
- PV: Shows Wp, module count, total kW
- Inverter: Shows model name, capacity, type

### 3. ✅ Specification Column Added
- Full specs for every item
- Hover to see complete text

### 4. ✅ Editable Unit Prices
- Click any unit price to edit
- Totals update in real-time

### 5. ✅ Dynamic Total Recalculation
- All cards update as you edit prices
- No refresh needed

---

## 🧪 Quick Test (3 minutes)

### Step 1: Generate Pricing (30 seconds)
1. Navigate to **Project Costing** tab
2. Click **"💰 Generate Pricing"**
3. Wait ~30 seconds

### Step 2: Check Summary Cards (30 seconds)
Look at the top 4 cards:

**PV Modules Card**:
- [ ] Shows total price (e.g., $1,323)
- [ ] Shows "630Wp × 14 modules" below
- [ ] Shows "8.82 kW Total" below

**Inverter Card**:
- [ ] Shows total price (NOT $0!) ✅
- [ ] Shows inverter model (e.g., SUN2000-12K-MB0)
- [ ] Shows capacity and type (e.g., 12.00 kW Hybrid)

**Electrical BOS Card**:
- [ ] Shows total price
- [ ] Shows "Mounting, Cables, Protection"

**Total Project Card**:
- [ ] Shows total price
- [ ] Shows "Incl. Installation & Contingency"

### Step 3: Check Specification Column (30 seconds)
Scroll down to any pricing table:

- [ ] **5 columns appear**: Item, **Specification**, Qty, Unit Price, Total
- [ ] Specification shows detailed specs
- [ ] Hover over spec to see full text

Example spec:
```
"Galvanized steel, 100×100mm, L=2m, concrete foundation, M20 grade, as per IS 2062"
```

### Step 4: Edit Unit Prices (1 minute)
1. Find any item in the table
2. Click on the **Unit Price** field (looks like an input box)
3. Change the value (e.g., $35 → $50)
4. Press Tab or click outside

**Check Real-Time Updates**:
- [ ] Item total updates immediately (e.g., $280 → $400)
- [ ] **Electrical BOS** card updates (top summary)
- [ ] **Total Project** card updates (top summary)

### Step 5: Test Reset Button (30 seconds)
1. After editing prices, notice "Reset Prices" button appears at top
2. Click **"Reset Prices"**
3. All prices return to original values
4. Totals revert back

---

## 📊 Expected Values

### Fixed Pricing (DO NOT EDIT):
| Component | Rate | Example |
|-----------|------|---------|
| PV Modules | $150/kW | 8.82 kW → **$1,323** |
| Hybrid Inverter | $100/kW | 12 kW → **$1,200** |
| PV Inverter | $70/kW | 10 kW → **$700** |
| Battery Inverter | $65/kW | 5 kW → **$325** |

### AC Coupled Example:
- PV Inverter: 10 kW × $70 = $700
- Battery Inverter: 5 kW × $65 = $325
- **Total Inverter**: $1,025 ✅

---

## ✅ Success Criteria

### Inverter Price:
- [x] Shows actual price (not $0)
- [x] DC Coupled: Shows hybrid inverter price
- [x] AC Coupled: Shows PV + Battery inverter price

### Summary Card Details:
- [x] PV card shows Wp, module count, kW
- [x] Inverter card shows model, capacity, type
- [x] Cards have divider line above specs
- [x] Text is smaller and lighter than main price

### Specification Column:
- [x] Appears in all 7 category tables
- [x] Shows between "Item" and "Qty"
- [x] Contains detailed technical specs
- [x] Truncates long text with "..." 
- [x] Shows full text on hover

### Editable Unit Prices:
- [x] Input fields are styled (dark bg, cyan border)
- [x] Can type new values
- [x] Accepts decimals (e.g., 35.50)
- [x] Right-aligned numbers
- [x] Focus border changes color

### Real-Time Updates:
- [x] Item total changes instantly
- [x] Electrical BOS card updates
- [x] Total Project card updates
- [x] No lag or delay
- [x] Updates while typing (on blur)

### UX Features:
- [x] Info banner at top: "Unit prices are editable..."
- [x] Reset button appears when edited
- [x] Reset button clears all edits
- [x] Prices reset when regenerating

---

## 🐛 Common Issues & Fixes

### Issue 1: Inverter Price Still $0
**Cause**: Design not complete or inverter not selected

**Fix**:
1. Go to **Battery Configuration** tab
2. Select an inverter
3. Return to **Project Costing**
4. Regenerate pricing

### Issue 2: Specification Column Missing
**Cause**: Old pricing data without specs

**Fix**:
1. Click **"💰 Generate Pricing"** again
2. AI will include specifications
3. Refresh if needed (Ctrl+F5)

### Issue 3: Edited Price Not Updating Total
**Cause**: Input field didn't trigger update

**Fix**:
1. Click outside the input field
2. Press Tab or Enter
3. Check if "Reset Prices" button appeared

### Issue 4: Can't See Full Specification
**Cause**: Text is truncated

**Fix**:
- Hover mouse over the specification
- Full text appears in tooltip

---

## 💡 Pro Tips

### Editing Multiple Prices:
1. Edit first price → Tab
2. Edit second price → Tab
3. Edit third price → Tab
4. Watch totals update in real-time!

### Resetting After Mistakes:
- Click "Reset Prices" anytime
- All edits are cleared
- Original prices restored

### Regenerating Fresh Pricing:
- Click "💰 Generate Pricing" again
- All edits are auto-cleared
- New prices from AI

---

## 📸 Screenshot Locations

### Summary Cards:
- Top of page
- 4 cards in a row
- Blue, Green, Purple, Cyan colors
- Details below each price

### Info Banner:
- Just above pricing tables
- Says "Unit prices are editable..."
- "Reset Prices" button on right (when edited)

### Pricing Tables:
- 7 sections (categories)
- Each with gradient header
- 5 columns including Specification
- Unit Price column has input fields

### Edited State:
- Item total in green
- Summary cards update
- Reset button visible

---

## 🔍 Console Checks

Open browser console (F12) and look for:

**Inverter Data**:
```javascript
console.log('Inverter Model:', inverterModel);
console.log('Inverter Power:', inverterPowerKW, 'kW');
console.log('Inverter Price:', inverterPrice);
```

**Should show**:
- Model: "SUN2000-12K-MB0" (not undefined)
- Power: 12 (not 0)
- Price: 1200 (not 0)

---

## 🎯 Interactive Test Flow

```
1. Generate Pricing
   ↓
2. Verify Summary Cards
   ✓ PV: Shows specs
   ✓ Inverter: Shows model & NOT $0
   ↓
3. Check Tables
   ✓ Specification column exists
   ✓ Specs are detailed
   ↓
4. Edit Unit Price
   ✓ Click input field
   ✓ Type new value
   ✓ Tab or click out
   ↓
5. Verify Updates
   ✓ Item total changes
   ✓ BOS card changes
   ✓ Total card changes
   ✓ Reset button appears
   ↓
6. Test Reset
   ✓ Click "Reset Prices"
   ✓ All prices revert
   ✓ Totals revert
   ✓ Button disappears
```

---

## 📝 Test Checklist

### Before Testing:
- [ ] Refresh browser (Ctrl+F5)
- [ ] Complete system design
- [ ] Generate BOQ first
- [ ] Navigate to Project Costing tab

### During Testing:
- [ ] Generate pricing
- [ ] Check all 4 summary cards
- [ ] Check specification column
- [ ] Edit at least 3 prices
- [ ] Verify real-time updates
- [ ] Test reset button

### After Testing:
- [ ] All features work
- [ ] No console errors
- [ ] UI looks professional
- [ ] Data is accurate
- [ ] Edits are intuitive

---

## 🚀 Ready to Test!

1. **Refresh**: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. **Navigate**: Project Costing tab
3. **Generate**: Click "💰 Generate Pricing"
4. **Test**: Follow steps above
5. **Report**: Any issues found

---

## 📊 Feature Summary

| Feature | Status | Test |
|---------|--------|------|
| Inverter Price Fix | ✅ | Check not $0 |
| PV Module Specs | ✅ | Check Wp, kW below price |
| Inverter Specs | ✅ | Check model, capacity below |
| Specification Column | ✅ | Check 5 columns in tables |
| Editable Unit Prices | ✅ | Click input, edit value |
| Real-Time Totals | ✅ | Watch cards update |
| Reset Button | ✅ | Click to revert all |
| Info Banner | ✅ | See edit instructions |

---

**All features implemented and ready to test! 🎉**

