# 🎴 Solar Engineering Q&A Flash Card Generator - Compact Prompt

## 📋 System Overview
100-day LinkedIn series: Solar engineering interview Q&A with AI-generated answers and flash cards.

---

## 🔄 Workflow

```
User Input: Question only
    ↓
AI Generates: Structured answer (editable text box)
    ↓
User Reviews/Edits: Modify if needed
    ↓
Click: "Generate Flash Cards"
    ↓
Output: Flash Cards PDF + LinkedIn Post Text
```

---

## 🤖 AI Answer Generation Prompt

```
You are an expert solar engineering educator creating interview preparation content.

QUESTION: [USER_PROVIDED_QUESTION]

Generate a comprehensive yet compact answer with this structure:

## Explanation
2-3 paragraphs explaining the concept clearly with bullet points for key facts.

## Formula
Include relevant formula with variable definitions and units. State assumptions if any.

## Practical Example
Real-world scenario with actual numbers (e.g., "10kW rooftop in California"). 
Show step-by-step calculation with final result.

## Key Takeaway
1-2 sentences summarizing what to remember for interviews.

CONSTRAINTS:
- Total answer must fit in 3 flash cards (~800-1000 words max)
- Use clear, professional language with industry-standard terms
- Balance technical depth with accessibility
- Make it interview-ready

OUTPUT: Return answer in markdown with clear sections as above.
```

---

## 📝 LinkedIn Post Generation Prompt

```
Generate an engaging LinkedIn post for this Q&A flash card carousel.

QUESTION: [USER_PROVIDED_QUESTION]
ANSWER SUMMARY: [KEY POINTS FROM GENERATED ANSWER]

Structure:

1. HOOK LINE (1 sentence):
   Start with relatable question, surprising fact, or common misconception.
   Examples:
   - "Ever wondered why solar panels still work on cloudy days?"
   - "Here's the #1 mistake designers make with string sizing..."

2. CONTEXT (2-3 sentences):
   Explain topic briefly and why it matters.

3. KEY INSIGHT (2-3 sentences):
   Main takeaway with specific number, formula, or fact.

4. ENGAGEMENT PROMPT (1 sentence):
   - "What's your method? Drop a comment! 👇"
   - "Swipe through for the complete breakdown →"

5. CALL-TO-ACTION:
   "💡 Save this for interview prep!"

6. HASHTAGS (3-5):
   #SolarEngineering #RenewableEnergy #PVDesign #InterviewPrep #SolarPower

TONE: Professional yet conversational, educational, confident, approachable.

LENGTH: 150-200 words max

OUTPUT: Ready-to-post text (no markdown).
```

---

## 🎨 Flash Card Design Specifications

### **Dimensions**
- Size: 1080 x 1350 px (4:5 ratio)
- Format: PNG or PDF
- Quality: High resolution

### **Color Palette**
- Navy Blue: `#0A2463` (backgrounds, headers)
- Bright Orange: `#FFA500` (accents, CTA)
- White: `#FFFFFF` (text on dark)
- Light Cream: `#FEF3C7` (light backgrounds)
- Dark Text: `#1A1A1A` (text on light)

### **Typography**
- Headers: Poppins Bold/SemiBold
- Body: Inter Regular/Medium
- Question: 42-48px
- Headers: 24-32px
- Body: 24px
- Small text: 18px

---

## 📐 Card Templates

### **CARD 1: Question**
```
Background: Navy gradient (#0A2463 to #3B82F6)
Header: "DAY XX | SOLAR Q&A" (Poppins Bold 24px, orange, top-left)
Icon: Question mark/lightbulb (120px, orange, center-top)
Question: Large white text (42-48px, centered, max-width 900px)
Hashtags: Orange 18px, bottom
Logo: BAESS Labs 80px, bottom-right, 80% opacity
```

### **CARD 2-3: Answer**
```
Background: Light cream (#FEF3C7) - alternate with navy for variety
Header: "DAY XX | ANSWER [X/Y]" (Poppins Bold 22px, navy, top-left)
Title: "📌 [Section Name]" (Poppins SemiBold 32px, orange)
Content: Bullet points (Inter Regular 24px, dark gray, orange bullets)
Navigation: "→ Swipe for more" (18px, navy, bottom-right)
Max: 3-4 bullet points or 250-300 words per card
```

### **CARD 4: BAESS Promo**
```
Background: Orange gradient (#FFA500 to #FFD700)
Logo: BAESS Labs 200px, white, top-center
Tagline: "Design Solar Systems with AI" (Poppins Bold 36px, white)
Features: 
  ✨ AI-Powered PV Designer
  ⚡ Instant BOQ Generation
  📊 Advanced Financial Analysis
  🔋 BESS Design Tool
  (Inter Medium 24px, white, line-height 1.8)
CTA Button: White rounded button (border-radius 50px)
  "Try Free → www.baess.app"
  (Poppins Bold 26px, navy text, padding 20px 60px)
Hashtags: #BAESSLabs #SolarDesign (18px white 50% opacity, bottom)
```

---

## 📊 Answer-to-Card Distribution Logic

```
IF answer < 800 words:
  Card 1: Question
  Card 2: Explanation + Formula + Example
  Card 3: Key Takeaway (if needed) OR skip to Promo
  Card 4: BAESS Promo

IF answer 800-1000 words:
  Card 1: Question
  Card 2: Explanation
  Card 3: Formula + Example + Takeaway
  Card 4: BAESS Promo

IF answer > 1000 words:
  ERROR: "Answer too long. Please condense to fit in 3 cards."
```

---

## 💾 Export Requirements

**Flash Cards:**
- PDF: Single multi-page file (all cards)
- PNG Set: Individual files (1080x1350px each)
- Naming: `Day_XX_Question_Keyword.pdf/png`

**LinkedIn Post:**
- Plain text file or clipboard copy
- Character count displayed
- Ideal length: 150-200 characters

---

## ✅ Quality Checklist

- [ ] Text readable at mobile size (400px width)
- [ ] High contrast for accessibility
- [ ] Consistent branding (colors, fonts, logo)
- [ ] No text cutoff or overflow
- [ ] Generous spacing
- [ ] Answer fits in max 3 cards
- [ ] LinkedIn post 150-200 words
- [ ] CTA clear and prominent

---

## 🎯 Design Principles

- **Modern & Futuristic:** Clean lines, subtle gradients, minimal clutter
- **High Contrast:** Navy/white or cream/dark text
- **Generous Spacing:** White space = readability
- **Visual Hierarchy:** Size + color guide the eye
- **Professional:** Industry-standard terminology
- **Actionable:** Clear CTA on promo card

---

## 📱 UI Components Needed

**Answer Generation:**
- Question input field
- "Generate Answer" button
- Editable text area (markdown support)
- Character/word counter
- "Generate Flash Cards" button

**Output Display:**
- Flash card thumbnails (all 4 cards)
- Download PDF button
- Download PNG Set button
- LinkedIn post text box (editable)
- "Copy to Clipboard" button

---

## 🎨 Complete Design Prompt for AI

```
Create LinkedIn carousel flash cards for solar engineering Q&A:

CARD 1 - QUESTION:
1080x1350px, navy gradient background, "DAY [XX] | SOLAR Q&A" header (orange, 24px, top-left), 
large question mark icon (120px, orange glow, center-top), question text (white, 42-48px, centered, 
bold, max-width 900px), hashtags (orange, 18px, bottom), BAESS logo (80px, bottom-right, subtle).

CARD 2-3 - ANSWER:
1080x1350px, light cream background, "DAY [XX] | ANSWER [X/Y]" header (navy, 22px, top-left), 
section title with emoji (orange, 32px), bullet points (dark gray, 24px, orange bullets, 
line-height 1.6, max 3-4 points), "→ Swipe" hint (navy, 18px, bottom-right). 
Alternate backgrounds: cream and navy for variety.

CARD 4 - PROMO:
1080x1350px, orange gradient background, BAESS Labs logo (200px, white, top-center), 
tagline "Design Solar Systems with AI" (white, 36px, bold), 4 features with emojis 
(white, 24px, good spacing), white rounded CTA button "Try Free → www.baess.app" 
(navy text, 26px, bold, prominent), hashtags (white 50% opacity, 18px, bottom).

STYLE: Modern, futuristic, minimal, high contrast, professional, generous white space, 
orange (#FFA500) and navy (#0A2463) color scheme, Poppins font for headers, 
Inter for body text.
```

---

**🎉 This compact prompt contains everything your AI needs to generate professional Solar Engineering Q&A flash cards!**
