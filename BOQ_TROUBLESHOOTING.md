# BOQ Troubleshooting Guide

## Issues Fixed in Latest Update

### 1. ✅ Battery Not Showing (selectedBattery: undefined)

**Problem**: Console showing `selectedBattery: undefined` causing battery count to be 0 or NaN.

**Root Causes**:
- Battery lookup failing due to missing technology key
- Series/Parallel values being undefined causing NaN calculations

**Solutions Implemented**:
- Added fallback for undefined battery technology (defaults to 'Lithium-Ion')
- Added better error logging to identify which battery ID is missing
- Fixed series/parallel calculation to handle undefined values (defaults to 1)
- Improved battery quantity calculation logic

**New Console Logging**:
```javascript
🔋 BOQ Battery Debug: {
  selectedBattery: "Battery Model Name" or "Not found",
  batteryId: "RES-NMC-51.2V-280Ah",
  technology: "Lithium-Ion",
  manualQuantity: undefined,
  inSeries: 3,
  inParallel: 1,  // Now defaults to 1 instead of undefined
  calculatedQty: 3,  // inSeries × inParallel
  suggestedQty: 7,
  finalQuantity: 7
}
```

**Action Required**:
1. Refresh browser (Ctrl+F5 or Cmd+Shift+R)
2. Navigate to BESS Configuration tab
3. Select a battery if not already selected
4. Check console for new debug output
5. Navigate to BOQ tab to verify battery is now showing

---

### 2. ✅ OpenRouter API 404 Error

**Problem**: `Failed to load resource: the server responded with a status of 404`

**Root Cause**: Incorrect model name in API request.

**Solution**: Changed model from `deepseek/deepseek-chat-v3.1:free` to `deepseek/deepseek-chat`

**Updated API Call**:
```javascript
{
  "model": "deepseek/deepseek-chat",  // Correct model name
  "messages": [...]
}
```

**Enhanced Error Logging**:
```javascript
🤖 Calling OpenRouter AI API...
✅ API Response received
// Or on error:
❌ OpenRouter API Error: {
  status: 404,
  statusText: "Not Found",
  body: "detailed error message"
}
```

**Action Required**:
1. Verify your `.env` file has: `VITE_OPENROUTER_API_KEY=sk-or-your-key-here`
2. Refresh browser
3. Try clicking "AI Generate BOS Details" button again
4. Check console for detailed error messages if it still fails

---

### 3. ⚠️ Cable Lengths Still Missing

**Current Status**: Cable lengths show "To be determined" even after cable sizing.

**Root Cause**: CableSizing component manages its own internal state and doesn't sync back to parent BOQ component.

**Temporary Workaround**:
1. Complete cable sizing in the **Cable Sizing** tab
2. **Manually note down** your cable specifications:
   - DC PV Cable: Size and Length
   - DC Battery Cable: Size and Length  
   - AC Cables: Sizes and Lengths
3. Update your final BOQ with these values

**Future Fix**: Upcoming update will automatically sync cable parameters from Cable Sizing to BOQ.

**Why This Happens**:
The CableSizing component was designed as a standalone tool with its own state management. To sync data:
- Option A: Refactor CableSizing to expose state changes (complex, needs testing)
- Option B: Add manual input fields in BOQ (quick fix, coming soon)
- Option C: Export cable data and import to BOQ (medium complexity)

**Updated Note in BOQ**:
The BOQ now displays a clear message explaining that cable lengths need to be manually transferred from Cable Sizing tab for now.

---

## Verification Steps

### Step 1: Check Battery Display

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Navigate to BOQ tab
4. Look for `🔋 BOQ Battery Debug:` log
5. Verify:
   - `selectedBattery` is NOT "Not found"
   - `finalQuantity` is a number > 0
   - Battery appears in BOQ table with correct quantity

**If battery still not showing**:
```bash
# Check these:
1. Did you select a battery in BESS Configuration tab?
2. Is the battery ID valid? (check batteryId in console log)
3. Try selecting a different battery and come back to BOQ
```

### Step 2: Test AI Generation

1. Ensure `.env` has `VITE_OPENROUTER_API_KEY=your_key`
2. Restart dev server: `npm run dev`
3. Navigate to BOQ tab
4. Click "✨ AI Generate BOS Details"
5. Check console for:
   ```
   🤖 Calling OpenRouter AI API...
   ✅ API Response received
   ✨ AI Generated BOQ Items: [array of items]
   ```

**If still getting 404**:
```bash
# Possible issues:
1. Wrong API key format (should start with sk-or-)
2. API key expired or invalid
3. OpenRouter service issue (check status.openrouter.ai)
4. Network/firewall blocking the request
```

**If getting other errors**:
- **401 Unauthorized**: API key is invalid
- **429 Too Many Requests**: Rate limit exceeded, wait a minute
- **500 Server Error**: OpenRouter service issue, try again later

### Step 3: Document Cable Specifications

Since cable data doesn't sync automatically yet:

1. Go to **Cable Sizing** tab
2. Complete your cable sizing
3. **Take screenshots** or note down:

**For DC Coupled System**:
- DC PV Cable: _____ mm², _____ meters
- DC Battery Cable: _____ mm², _____ meters
- AC Hybrid Inverter Cable: _____ mm², _____ meters

**For AC Coupled System**:
- DC PV Cable: _____ mm², _____ meters
- AC PV Inverter Cable: _____ mm², _____ meters
- AC Battery Inverter Cable: _____ mm², _____ meters

---

## Common Error Messages

### Error: "selectedBattery: undefined"
**Meaning**: Battery lookup failed
**Fix**: Select battery in BESS Configuration tab, then refresh BOQ

### Error: "calculated: NaN"
**Meaning**: Series or Parallel value is undefined
**Fix**: Already fixed in latest code. Refresh browser.

### Error: "API Error: 404 Not Found"
**Meaning**: Wrong API endpoint or model name
**Fix**: Already fixed - model changed to `deepseek/deepseek-chat`

### Error: "OpenRouter API key not configured"
**Meaning**: Environment variable not set
**Fix**: Add `VITE_OPENROUTER_API_KEY` to `.env` and restart server

---

## OpenRouter API Key Setup (Detailed)

### Getting Your API Key:

1. **Go to**: https://openrouter.ai
2. **Sign up** (free account available)
3. **Navigate to**: Settings → API Keys
4. **Click**: "Create Key"
5. **Copy** the key (format: `sk-or-v1-xxxxx...`)

### Setting Up .env File:

**Create `.env` in project root** (same directory as package.json):

```env
# OpenRouter API Key for AI BOQ Generation
VITE_OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here

# Note: Do NOT commit this file to git!
# Add .env to .gitignore
```

**Verify `.gitignore` includes**:
```
.env
.env.local
.env*.local
```

### Restart Development Server:

```bash
# Stop current server (Ctrl+C)

# Restart
npm run dev

# Or with other package managers:
yarn dev
pnpm dev
```

### Test API Key:

```javascript
// In browser console, check if key is loaded:
console.log('API Key loaded:', !!import.meta.env.VITE_OPENROUTER_API_KEY);
// Should print: API Key loaded: true
```

---

## Model Name Reference

**Updated Models** (January 2025):

| Old Model (404 Error) | New Model (Works) |
|----------------------|-------------------|
| `deepseek/deepseek-chat-v3.1:free` | `deepseek/deepseek-chat` |

**Alternative Models** (if deepseek/deepseek-chat fails):
- `openai/gpt-3.5-turbo` (paid, very reliable)
- `anthropic/claude-instant` (paid, fast)
- `meta-llama/llama-2-70b-chat` (free tier available)

To change the model, edit line in `BESSDesigner.tsx`:
```javascript
"model": "deepseek/deepseek-chat",  // Change this
```

---

## Debug Checklist

Before asking for help, verify:

- [ ] Battery is selected in BESS Configuration
- [ ] PV system is sized in PV Sizing tab
- [ ] Browser console is open (F12)
- [ ] `.env` file exists with API key
- [ ] Development server was restarted after adding API key
- [ ] Browser cache cleared (Ctrl+F5)
- [ ] Console shows battery debug log
- [ ] Console shows API call attempts
- [ ] Network tab shows API request (if AI generation attempted)

---

## Getting Help

**Include this information when reporting issues**:

1. **Console Log Output**:
   - Copy the `🔋 BOQ Battery Debug:` log
   - Copy any error messages (red text)
   - Copy the `🤖 Calling OpenRouter AI API...` sequence

2. **Steps to Reproduce**:
   - What you did before the error
   - Which tab you were on
   - What button you clicked

3. **Environment**:
   - Browser: Chrome/Firefox/Edge/Safari
   - Browser version
   - Operating System
   - Node.js version: `node --version`

4. **Screenshots**:
   - BOQ table showing the issue
   - Console log with errors
   - Battery Configuration (if relevant)

---

## Quick Fix Commands

```bash
# Clear node modules and reinstall
rm -rf node_modules
npm install

# Clear browser cache and restart
# Ctrl+F5 (Windows/Linux) or Cmd+Shift+R (Mac)

# Verify environment variable
node -e "console.log(process.env.VITE_OPENROUTER_API_KEY ? 'Set' : 'Not Set')"

# Check if .env file exists
ls -la | grep .env

# Restart development server with verbose logging
npm run dev -- --debug
```

---

**Last Updated**: January 2025  
**Version**: 1.1.0 (Fixes Applied)

