# 🔍 Google Analytics 4 (GA4) Setup Guide - BAESS Labs

## 📋 Complete Implementation Guide

---

## ✅ What's Already Done

The Google Analytics 4 tracking system has been **fully implemented** in your codebase:

✅ **react-ga4** package installed  
✅ Analytics utility functions created (`src/utils/analytics.ts`)  
✅ App.tsx updated with auto-tracking  
✅ Page view tracking on route changes  
✅ Custom event tracking functions ready  

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Google Analytics 4 Property

1. **Go to:** https://analytics.google.com
2. **Sign in** with your Google account
3. **Click** "Admin" (gear icon, bottom left)
4. **Click** "Create Property"
5. **Fill in:**
   ```
   Property name: BAESS Labs
   Reporting time zone: (Your timezone)
   Currency: USD (or your currency)
   ```
6. **Click** "Next"

---

### Step 2: Set Up Data Stream

1. **Select platform:** "Web"
2. **Fill in:**
   ```
   Website URL: https://www.baess.app
   Stream name: BAESS Production
   ```
3. **Enable Enhanced Measurement** (recommended):
   - ✅ Page views
   - ✅ Scrolls
   - ✅ Outbound clicks
   - ✅ Site search
   - ✅ Video engagement
   - ✅ File downloads

4. **Click** "Create stream"

---

### Step 3: Copy Your Measurement ID

After creating the stream, you'll see:

```
Measurement ID: G-XXXXXXXXXX
```

**Copy this ID** - you'll need it in the next step!

---

### Step 4: Add to Environment Variables

#### **Local Development:**

1. Open your `.env` file (in project root)
2. Add this line:
   ```env
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
   (Replace `G-XXXXXXXXXX` with your actual Measurement ID)

3. Save the file

#### **Vercel Production:**

1. Go to: https://vercel.com/your-project/settings/environment-variables
2. **Add new variable:**
   ```
   Name: VITE_GA_MEASUREMENT_ID
   Value: G-XXXXXXXXXX
   Environment: Production, Preview, Development
   ```
3. **Click** "Save"
4. **Redeploy** your site (important!)

---

### Step 5: Test It's Working

#### **Method 1: Real-time Reports (Fastest)**

1. Go to GA4: https://analytics.google.com
2. Navigate to: **Reports** → **Realtime**
3. Open your site: https://www.baess.app
4. You should see **1 active user** appear within 30 seconds!

#### **Method 2: Browser Console**

1. Open your site
2. Press **F12** (open DevTools)
3. Go to **Console** tab
4. Look for: `✅ Google Analytics initialized`
5. Navigate to different pages
6. Each page view will be tracked automatically

#### **Method 3: GA4 DebugView**

1. Install Chrome extension: **Google Analytics Debugger**
2. Enable the extension
3. Visit your site
4. Go to GA4 → **Admin** → **DebugView**
5. You'll see all events in real-time!

---

## 📊 What's Being Tracked Automatically

### 1. **Page Views** 🔄
Every route change is tracked automatically:
```
/ → Homepage
/auth → Auth page
/dashboard → Dashboard
/blog → Blog
... and ALL other pages
```

### 2. **Enhanced Measurements** (if enabled)
- Scrolls (25%, 50%, 75%, 90%)
- Outbound link clicks
- File downloads
- Site search
- Video engagement

---

## 🎯 Custom Event Tracking (Ready to Use)

You have pre-built functions for tracking specific user actions:

### Track Button Clicks
```typescript
import { trackButtonClick } from '@/utils/analytics';

// Example usage in a component:
<Button onClick={() => {
  trackButtonClick('Get Started', 'Homepage Hero');
  // ... your other code
}}>
  Get Started
</Button>
```

### Track Sign Ups
```typescript
import { trackSignUp } from '@/utils/analytics';

// After successful registration:
trackSignUp('email'); // or 'google', 'github', etc.
```

### Track Purchases
```typescript
import { trackPurchase } from '@/utils/analytics';

// After successful payment:
trackPurchase(
  'txn_123456',      // Transaction ID
  49.99,             // Value
  'USD',             // Currency
  'Pro Plan'         // Item name
);
```

### Track Searches
```typescript
import { trackSearch } from '@/utils/analytics';

// When user searches:
trackSearch(searchQuery);
```

### Track Downloads
```typescript
import { trackDownload } from '@/utils/analytics';

// When user downloads a file:
trackDownload('solar-guide.pdf', 'PDF');
```

### Track Social Shares
```typescript
import { trackSocialShare } from '@/utils/analytics';

// When user shares content:
trackSocialShare('LinkedIn', 'Blog Post');
```

---

## 🎨 Implementation Examples

### Example 1: Track "Get Started" Button on Homepage

**File:** `src/pages/Index.tsx`

```typescript
import { trackButtonClick } from '@/utils/analytics';

// In your component:
<Button
  onClick={() => {
    trackButtonClick('Get Started CTA', 'Homepage Hero Section');
    navigate('/auth');
  }}
  className="..."
>
  Get Started
</Button>
```

---

### Example 2: Track Subscription Purchases

**File:** `src/pages/SubscriptionSuccess.tsx`

```typescript
import { trackPurchase } from '@/utils/analytics';

useEffect(() => {
  if (subscriptionData) {
    trackPurchase(
      subscriptionData.id,
      subscriptionData.amount / 100, // Convert cents to dollars
      'USD',
      `${subscriptionData.plan} Plan`
    );
  }
}, [subscriptionData]);
```

---

### Example 3: Track AI BOQ Generation

**File:** `src/components/advanced-solar-calculator/BOQGenerator.tsx`

```typescript
import { trackEvent } from '@/utils/analytics';

const handleGenerateBOQ = async () => {
  // ... your generation logic
  
  // Track successful generation
  trackEvent('AI Feature', 'BOQ Generated', 'Gemini AI', 1);
};
```

---

## 📈 Key Metrics to Monitor

### **Week 1: Setup Verification**
- [ ] Users (should see traffic)
- [ ] Page views (should increase daily)
- [ ] Real-time active users (test yourself)
- [ ] Top pages (check if accurate)

### **Week 2-4: User Behavior**
- [ ] Average session duration (goal: >2 minutes)
- [ ] Pages per session (goal: >3 pages)
- [ ] Bounce rate (goal: <60%)
- [ ] Top traffic sources

### **Month 2+: Conversions**
- [ ] Sign-ups (track with custom event)
- [ ] Subscriptions (track with ecommerce event)
- [ ] Goal completions
- [ ] User retention

---

## 🔧 Advanced Configuration (Optional)

### Enable IP Anonymization (GDPR-Friendly)

Already enabled in `src/utils/analytics.ts`:
```typescript
gaOptions: {
  anonymizeIp: true,
}
```

### Set User Properties

```typescript
import ReactGA from 'react-ga4';

// After user logs in:
ReactGA.set({
  userId: user.id,
  subscription_tier: 'pro',
  account_age: 'new',
});
```

### Create Custom Dimensions

1. Go to GA4 → **Admin** → **Custom Definitions**
2. **Click** "Create custom dimension"
3. Examples:
   ```
   Dimension name: Subscription Tier
   Scope: User
   Parameter: subscription_tier
   ```

---

## 🎯 Recommended Events to Track

### Priority 1 (Implement First):
- ✅ Page views (already done)
- [ ] Sign ups
- [ ] Sign ins
- [ ] Subscription purchases
- [ ] AI BOQ generations
- [ ] BESS designer usage

### Priority 2 (Next Week):
- [ ] Button clicks (CTA buttons)
- [ ] Form submissions
- [ ] PDF downloads
- [ ] Blog post views
- [ ] Social shares

### Priority 3 (Future):
- [ ] Search queries
- [ ] Video plays
- [ ] Time on page (custom)
- [ ] Feature usage frequency
- [ ] Error tracking

---

## 🛠️ Troubleshooting

### Issue 1: "GA not initialized" Warning

**Problem:** Console shows warning about GA not being initialized

**Solution:**
1. Check `.env` file has `VITE_GA_MEASUREMENT_ID`
2. Restart dev server: `npm run dev`
3. Hard refresh browser: `Ctrl + Shift + R`

---

### Issue 2: No Data in GA4

**Problem:** Real-time reports show 0 users

**Solutions:**

1. **Check Measurement ID is correct:**
   - Go to GA4 → Admin → Data Streams
   - Copy the Measurement ID
   - Verify it matches your `.env` file

2. **Check browser console:**
   - Open DevTools (F12)
   - Look for: `✅ Google Analytics initialized`
   - If not present, GA didn't initialize

3. **Disable ad blockers:**
   - Ad blockers can block GA
   - Try in incognito mode
   - Or disable blocker for your site

4. **Verify Environment Variable:**
   ```bash
   # In terminal:
   echo $VITE_GA_MEASUREMENT_ID
   ```

---

### Issue 3: Events Not Showing

**Problem:** Custom events don't appear in GA4

**Solutions:**

1. **Check DebugView:**
   - GA4 → Admin → DebugView
   - Install GA Debugger extension
   - Watch events fire in real-time

2. **Verify event syntax:**
   ```typescript
   // Correct:
   trackEvent('Category', 'Action', 'Label', 1);
   
   // Incorrect:
   trackEvent('category'); // Missing parameters
   ```

3. **Wait for processing:**
   - Events can take 24-48 hours to appear in standard reports
   - Use DebugView for real-time validation

---

## 📚 GA4 Reports to Check

### **Realtime Report**
- **Location:** Reports → Realtime
- **Shows:** Current active users, page views, events
- **Check:** Daily during first week

### **User Acquisition**
- **Location:** Reports → Acquisition → User Acquisition
- **Shows:** Where users come from (Google, Direct, Social)
- **Check:** Weekly

### **Pages and Screens**
- **Location:** Reports → Engagement → Pages and screens
- **Shows:** Most viewed pages, time spent
- **Check:** Weekly

### **Events**
- **Location:** Reports → Engagement → Events
- **Shows:** All tracked events (page_view, custom events)
- **Check:** Weekly

### **Conversions**
- **Location:** Reports → Engagement → Conversions
- **Shows:** Goal completions (mark events as conversions)
- **Check:** Weekly

---

## 🎉 Next Steps

### After Setup:

1. **Mark Key Events as Conversions:**
   - Go to: Admin → Events
   - Find `sign_up`, `purchase`, etc.
   - Toggle "Mark as conversion"

2. **Create Goals:**
   - Admin → Goals
   - Example: "Sign ups per month"
   - Example: "Monthly revenue"

3. **Set Up Audiences:**
   - Admin → Audiences
   - Example: "Returning users"
   - Example: "Paid subscribers"
   - Use for remarketing

4. **Link to Google Search Console:**
   - Admin → Product Links
   - Link GSC property
   - See search queries in GA4

5. **Set Up Custom Reports:**
   - Reports → Library
   - Create reports for your KPIs
   - Example: "Subscription funnel"

---

## 📋 Quick Reference

### **Measurement ID Location:**
- GA4: Admin → Data Streams → Your stream

### **Environment Variable:**
```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### **Import Statement:**
```typescript
import { trackEvent, trackPageView, trackButtonClick } from '@/utils/analytics';
```

### **Basic Event Tracking:**
```typescript
trackEvent('Category', 'Action', 'Label', value);
```

---

## ✅ Setup Checklist

- [ ] GA4 property created
- [ ] Data stream set up
- [ ] Measurement ID copied
- [ ] `.env` updated (local)
- [ ] Vercel env variable added
- [ ] Site redeployed
- [ ] Real-time report shows traffic
- [ ] Page views are tracking
- [ ] Custom events planned
- [ ] Key events marked as conversions
- [ ] Weekly monitoring scheduled

---

## 📞 Resources

- **GA4 Help:** https://support.google.com/analytics
- **GA4 Academy:** https://analytics.google.com/analytics/academy/
- **GA4 Debugger:** Chrome Web Store → "Google Analytics Debugger"
- **React GA4 Docs:** https://github.com/PriceRunner/react-ga4

---

## 🎯 Summary

✅ **Implemented:**
- Google Analytics 4 setup
- Automatic page view tracking
- Custom event tracking functions
- Privacy-friendly configuration

✅ **Your Next Step:**
1. Get your GA4 Measurement ID
2. Add to `.env` and Vercel
3. Redeploy
4. Test in Real-time report!

**Estimated Time:** 5 minutes to go live! 🚀

---

**Created:** November 26, 2025  
**Status:** ✅ Ready for Production  
**Testing:** Use Real-time Reports to verify

