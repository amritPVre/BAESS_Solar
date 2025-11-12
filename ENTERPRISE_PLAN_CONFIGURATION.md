# Enterprise Plan Configuration Guide

## 🎯 Overview

Your Dodo Payments integration now supports **4 subscription plans**:
- ✅ Free ($0) - 9 credits
- ✅ Professional ($18/mo) - 180 credits  
- ✅ Advanced ($54/mo) - 360 credits
- ✅ **Enterprise ($108/mo) - 1,080 credits** ← NEW!

The Enterprise plan support has been **added to all files** but can be **enabled/disabled** easily based on when you're ready.

---

## ✅ What Was Updated

All necessary files have been updated to support Enterprise:

### Backend:
- ✅ `src/services/dodoPaymentService.ts` - Added Enterprise product ID
- ✅ `src/pages/api/checkout/create-session.ts` - Validates Enterprise plan
- ✅ `src/pages/api/webhooks/dodo.ts` - Processes Enterprise subscriptions

### Frontend:
- ✅ `src/components/subscription/CheckoutButton.tsx` - Accepts Enterprise planId
- ✅ `src/components/subscription/SubscriptionManager.tsx` - Shows Enterprise upgrade options

### Configuration:
- ✅ `.env.example` - Added Enterprise product ID placeholder

---

## 🚀 How to Enable Enterprise Plan

### Step 1: Create Enterprise Product in Dodo Dashboard (5 min)

1. Go to https://dashboard.dodopayments.com
2. Navigate to Products
3. Click "Create Product"
4. Configure:
   - **Name**: "Enterprise Plan"
   - **Price**: **$108/month** (or $1,296/year if annual)
   - **Billing**: Monthly or Annual
   - **Description**: "For large organizations and EPCs"
5. **Copy the Product ID** (e.g., `prod_xxxxxxxxxxxx`)

### Step 2: Add to Environment Variables (1 min)

Add to your `.env` file:

```env
# Add this line
VITE_DODO_PRODUCT_ID_ENTERPRISE=prod_your_actual_enterprise_id_here
```

### Step 3: Update Supabase Subscription Plans Table (Optional - 2 min)

Add Enterprise to your `subscription_plans` table:

```sql
-- Insert Enterprise plan
INSERT INTO subscription_plans (
  id, 
  name, 
  display_name, 
  description, 
  price_monthly, 
  ai_credits_monthly, 
  features, 
  sort_order
) VALUES (
  'enterprise',
  'Enterprise',
  'Enterprise',
  'For large organizations and EPCs',
  108.00,
  1080,
  '["1,080 AI credits per month", "Everything in Advanced", "Custom Integrations", "Team Training", "SLA Guarantee", "White-label Options"]',
  4
);
```

### Step 4: That's It! ✅

Enterprise plan is now live and ready to accept subscriptions!

---

## 🔄 Current Status

### Landing Page (Index.tsx)
Your landing page **already shows** the Enterprise plan with "Contact Sales" button:

```tsx
{/* Enterprise Plan */}
<div className="bg-gradient-to-br from-[#0A2463] to-[#0A2463]/90">
  <h3>Enterprise</h3>
  <p>$108/month</p>
  <Button>Contact Sales</Button>
</div>
```

### Options for Landing Page:

**Option A: Keep "Contact Sales" Button**
- Good for qualifying leads
- Allows custom pricing discussion
- No code changes needed

**Option B: Replace with Checkout Button**
```tsx
// Replace the "Contact Sales" button with:
import { CheckoutButton } from '@/components/subscription/CheckoutButton';

<CheckoutButton
  planId="enterprise"
  label="Get Started"
  className="w-full bg-gradient-to-r from-[#FFA500] to-[#F7931E]"
/>
```

**Option C: Offer Both**
```tsx
<div className="flex gap-2">
  <CheckoutButton
    planId="enterprise"
    label="Buy Now"
    className="flex-1 bg-gradient-to-r from-[#FFA500] to-[#F7931E]"
  />
  <Button 
    variant="outline"
    onClick={() => window.location.href = '/contact'}
  >
    Contact Sales
  </Button>
</div>
```

---

## ⚙️ How to Disable Enterprise (If Not Ready)

If you want to **hide** the Enterprise plan temporarily:

### In SubscriptionManager.tsx:

Comment out or remove the Enterprise checkout buttons:

```tsx
{isFreeTier ? (
  <>
    <CheckoutButton planId="pro" label="Upgrade to Professional" />
    <CheckoutButton planId="advanced" label="Upgrade to Advanced" />
    {/* Temporarily disabled 
    <CheckoutButton planId="enterprise" label="Upgrade to Enterprise" />
    */}
  </>
```

### In Landing Page:

Keep the "Contact Sales" button instead of checkout button.

---

## 📋 Enterprise Plan Database Requirements

Your database already supports Enterprise! The `profiles` table stores:

```sql
subscription_tier = 'enterprise'  -- Stored value
ai_credits_monthly_limit = 1080   -- Monthly allocation
```

The existing infrastructure handles it automatically:
- ✅ Credit allocation (1,080 credits)
- ✅ Subscription status tracking
- ✅ Webhook processing
- ✅ Monthly renewal

---

## 🎨 UI Behavior with Enterprise

### In Account Settings Page:

**Free Users see:**
- Upgrade to Professional
- Upgrade to Advanced  
- Upgrade to Enterprise ← NEW!

**Professional Users see:**
- Upgrade to Advanced
- Upgrade to Enterprise ← NEW!
- Cancel Subscription

**Advanced Users see:**
- Upgrade to Enterprise ← NEW!
- Cancel Subscription

**Enterprise Users see:**
- Cancel Subscription (only)

---

## 💰 Pricing Comparison

| Plan | Price | AI Credits | Best For |
|------|-------|------------|----------|
| Free | $0 | 9 | Trial users |
| Professional | $18/mo | 180 | Individual professionals |
| Advanced | $54/mo | 360 | Growing businesses |
| **Enterprise** | **$108/mo** | **1,080** | **Large organizations** |

---

## 🔧 Configuration Summary

### Minimal Setup (5 minutes):
1. ✅ Create Enterprise product in Dodo Dashboard
2. ✅ Add `VITE_DODO_PRODUCT_ID_ENTERPRISE` to `.env`
3. ✅ Test checkout flow
4. ✅ Done!

### Complete Setup (10 minutes):
1. ✅ Minimal setup above
2. ✅ Update `subscription_plans` table in Supabase
3. ✅ Decide on landing page button (Contact Sales vs Checkout)
4. ✅ Test all upgrade paths
5. ✅ Done!

---

## 🧪 Testing Enterprise Plan

```bash
# 1. Start dev server
npm run dev

# 2. Login to your account
# 3. Navigate to /account

# 4. Click "Upgrade to Enterprise"
# 5. Complete test payment with Dodo test card
# 6. Verify:
#    - Redirect to success page
#    - Database updated with enterprise tier
#    - 1,080 credits allocated
#    - Next billing date set

# 7. Check webhook logs in Dodo Dashboard
```

---

## 📝 Recommendation

**For Your Situation:**

Since you mentioned "will do in future", I recommend:

### NOW (Already Done ✅):
- ✅ Code structure added (supports Enterprise)
- ✅ Type definitions updated
- ✅ API routes ready
- ✅ Components ready

### WHEN READY TO ENABLE (5 minutes):
1. Create Enterprise product in Dodo Dashboard
2. Add product ID to `.env`
3. Optionally update landing page button
4. Test and go live!

**Benefits of This Approach:**
- ✅ No code changes needed later
- ✅ Type-safe throughout
- ✅ Easy to enable when ready
- ✅ Minimal disruption
- ✅ Can test anytime

---

## 🎯 Current State

**Status**: ✅ **ENTERPRISE READY - ACTIVATION PENDING**

**What Works Now:**
- ✅ Free tier (manual management)
- ✅ Professional tier ($18)
- ✅ Advanced tier ($54)
- ⏳ Enterprise tier ($108) - Code ready, needs Dodo product creation

**To Go Live with Enterprise:**
1. Create product in Dodo (5 min)
2. Add to `.env` (1 min)
3. Test (5 min)
4. ✅ LIVE!

---

## 🤝 Questions?

The Enterprise plan is fully integrated into the codebase. You can:
- Enable it now (if ready)
- Enable it later (5 minute setup)
- Keep it as "Contact Sales" indefinitely
- Mix approaches (checkout + contact sales)

**The code is flexible and ready for any approach you choose!** 🚀

