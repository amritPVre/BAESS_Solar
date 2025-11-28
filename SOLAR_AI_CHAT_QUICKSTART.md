# 🚀 Solar AI Chat Assistant - Quick Start Guide

## ⚡ Get Started in 5 Minutes

### Step 1: Set Up Gemini API Key

1. **Get your API key** from [Google AI Studio](https://makersuite.google.com/app/apikey)

2. **Add to your environment**:
   ```bash
   # Create/edit .env.local file in project root
   echo "VITE_GEMINI_API_KEY=your_api_key_here" >> .env.local
   ```

3. **Restart your dev server**:
   ```bash
   npm run dev
   ```

### Step 2: Run Database Migration

Run the migration to create the chat sessions table:

```bash
# If using Supabase CLI
supabase db push

# Or manually in Supabase SQL Editor
# Copy and paste: supabase/migrations/20250126_create_solar_ai_chat_sessions.sql
```

### Step 3: Access the App

1. Navigate to your dashboard at `http://localhost:5173/dashboard`
2. Click the **"Solar AI Assistant"** card (emerald/teal gradient)
3. You're ready to go! 🎉

## 🎯 Try These Example Tasks

### Example 1: PV System Sizing
```
Task: PV System Sizing

"I need to size a solar PV system for a residential building with 
500 kWh monthly consumption in Mumbai, India. I have 300 m² of 
roof space available. What system size do you recommend?"
```

### Example 2: Financial Analysis
```
Task: Financial Analysis

"Calculate the financial metrics for a 50 kW solar system:
- Total cost: $45,000
- Electricity rate: $0.15/kWh
- Annual production: 65,000 kWh
- Project lifetime: 25 years
- Discount rate: 8%"
```

### Example 3: Cable Sizing
```
Task: Cable Sizing

"I need to size cables for a solar array:
- System current: 120 A
- DC voltage: 600 V
- Cable run distance: 75 meters
- Maximum voltage drop: 2%
- Installation: Conduit in roof"
```

## 🎨 Interface Overview

```
┌─────────────────────────────────────────────────────────┐
│  [Logo] Solar AI Assistant    [Credits] [Export] [Home] │
├────┬────────────────────────┬───────────────────────────┤
│    │                        │                           │
│ [≡]│  💬 Chat Interface    │  📊 Results Canvas        │
│    │                        │                           │
│ 📜 │  [User Message]        │  ┌──────────────────────┐│
│    │  [AI Response]         │  │ Results | Insights   ││
│ New│                        │  ├──────────────────────┤│
│Chat│  ┌──────────────────┐  │  │ • System Size: 45kW  ││
│    │  │ Type message...  │  │  │ • Panels: 120 units  ││
│ 📅 │  └──────────────────┘  │  │ • Expected: 60MWh/yr ││
│    │  [Send]                │  └──────────────────────┘│
└────┴────────────────────────┴───────────────────────────┘
```

## 💡 Quick Tips

### Getting Better Results
1. **Be specific** with your inputs
2. **Provide units** (kW, kWh, m², etc.)
3. **Ask follow-up questions** to refine results
4. **Use the task selector** for structured calculations

### Keyboard Shortcuts
- `Enter` → Send message
- `Shift + Enter` → New line
- `Ctrl/Cmd + K` → New chat (coming soon)

### Export Your Work
- **PDF**: Click "Export PDF" in header (full session report)
- **Excel**: Click "Export Excel" (multi-sheet workbook)
- **Artifact PDF**: Click PDF button in artifact canvas

## 🔍 15 Calculation Types Available

### 🔧 System Sizing (4)
- PV System Sizing
- Inverter Sizing
- Battery Storage Sizing
- String Configuration

### 💰 Financial Analysis (3)
- Comprehensive Financial Analysis
- ROI Calculation
- Payback Period Analysis

### ⚡ Technical Calculations (7)
- Solar Irradiance Calculation
- Cable Sizing
- Load Profile Analysis
- System Loss Analysis
- Shading Impact Analysis
- Tilt Angle Optimization
- Energy Production Estimates

### 🌱 Environmental Impact (1)
- Carbon Offset Analysis

## 🎓 Example Workflow

### Complete Project Analysis

**Step 1**: Start with PV Sizing
```
"Size a 100 kW commercial rooftop system in Delhi"
```

**Step 2**: Calculate Financials
```
"Based on the 100 kW system, analyze the financial viability 
with a total cost of $90,000 and electricity rate of $0.12/kWh"
```

**Step 3**: Check Environmental Impact
```
"What's the carbon offset for this 100 kW system over 25 years?"
```

**Step 4**: Export Everything
- Click "Export PDF" for a complete project report
- Share with clients or team members

## 🛠️ Troubleshooting

### Issue: AI not responding
**Solution**: Check console for errors, verify API key is set correctly

### Issue: Export not working
**Solution**: Allow downloads in browser, disable popup blocker

### Issue: Can't see artifact
**Solution**: Click the eye icon to show/hide artifact canvas

## 📊 Features at a Glance

| Feature | Status | Description |
|---------|--------|-------------|
| 15+ Calculations | ✅ | Specialized prompts for each type |
| Chat History | ✅ | Auto-saved to database |
| Export PDF | ✅ | Professional reports |
| Export Excel | ✅ | Multi-sheet workbooks |
| Artifact Canvas | ✅ | Real-time results display |
| Mobile Responsive | ✅ | Works on all devices |
| AI Credits | ✅ | Integrated with credit system |
| Session Management | ✅ | Save, load, delete chats |

## 🎉 You're Ready!

Click the **"Solar AI Assistant"** card on your dashboard and start your first calculation!

**Need Help?** See the full documentation in `SOLAR_AI_CHAT_ASSISTANT.md`

---

**Quick Links**:
- 🏠 Dashboard: `/dashboard`
- 🤖 AI Assistant: `/solar-ai-chat`
- 📚 Full Docs: `SOLAR_AI_CHAT_ASSISTANT.md`

