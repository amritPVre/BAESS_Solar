# 🚨 Webhook Not Working - Live Troubleshooting Guide

## Issue: AI Credits Not Updating After Payment

**User:** solarapp98@gmail.com  
**User ID:** 0d04a2eb-b13b-4f9c-a469-86a94be45a78  
**Status:** Payment successful, but webhook not processing

---

## Step 1: Check Dodo Payments Webhook Logs 🔍

### Go to Dodo Payments Dashboard:
1. Login to https://dashboard.dodopayments.com
2. Navigate to **Settings** → **Webhooks**
3. Click on your webhook endpoint
4. Look for **Recent Deliveries** or **Webhook Logs**

### What to Look For:

**Scenario A: Webhook is being sent**
```
✅ Status: 200 OK
❌ Status: 4xx or 5xx (error)
```

**Scenario B: No webhook attempts**
```
No recent deliveries found
```

### Share This Information:
- Is the webhook being sent? (Yes/No)
- What's the HTTP status code? (200, 400, 500, etc.)
- Any error messages in the logs?

---

## Step 2: Check Vercel Function Logs 📊

### Go to Vercel Dashboard:
1. Open https://vercel.com/dashboard
2. Select your **BAESS_Solar** project
3. Click **Functions** tab (or **Logs** tab)
4. Look for `/api/webhooks/dodo` endpoint

### Filter Logs:
- Time period: Last 1 hour
- Search: "dodo" or "webhook"

### What to Look For:

**If you see logs:**
```
✅ Request received
❌ Error in function execution
```

**If no logs:**
```
Webhook endpoint not being called
```

---

## Step 3: Verify Webhook URL in Dodo 🔗

### Check Your Dodo Webhook Configuration:

**Current URL should be:**
```
https://www.baess.app/api/webhooks/dodo
```

**NOT these:**
```
❌ https://baess.app/api/webhooks/dodo (missing www)
❌ https://www.baess.app/api/webhooks (missing /dodo)
❌ https://www.baess.app/api/web (incomplete)
```

### Test Webhook URL Manually:

Open this in browser or Postman:
```
GET https://www.baess.app/api/webhooks/dodo
```

**Expected Response:**
```
Status: 200 OK
Body: { "message": "Webhook endpoint is active" }
```

---

## Step 4: Manual Credit Update (Temporary Fix) ⚡

While we fix the webhook, let's manually update credits for this user.

### Run This SQL in Supabase:

```sql
-- Manual credit update for solarapp98@gmail.com
SELECT update_subscription_tier(
  '0d04a2eb-b13b-4f9c-a469-86a94be45a78'::uuid,
  'pro',  -- or 'advanced' depending on what plan they paid for
  NULL,   -- dodo_customer_id (we'll get this from Dodo)
  NULL    -- dodo_subscription_id (we'll get this from Dodo)
);

-- Verify the update
SELECT 
  email,
  subscription_tier,
  ai_credits_remaining,
  subscription_status
FROM profiles
WHERE email = 'solarapp98@gmail.com';
```

**What plan did they purchase?**
- Professional/Pro → 180 credits
- Advanced → 200 credits

---

## Step 5: Check Webhook Event Type 📋

Dodo Payments sends different event types. We need to ensure we're listening to the right one.

### Common Dodo Event Types:
- `checkout.session.completed`
- `subscription.created`
- `payment.succeeded`
- `subscription.updated`

### Check Our Webhook Handler:

**File:** `api/webhooks/dodo.js`

**Should handle:**
```javascript
const eventType = req.body.type || req.body.event;

if (eventType === 'checkout.session.completed' || 
    eventType === 'payment.succeeded') {
  // Process payment
}
```

---

## Step 6: Get Dodo Payment Details 💳

From Dodo Payments Dashboard, find this payment:

1. Go to **Payments** or **Transactions**
2. Search for: `solarapp98@gmail.com`
3. Click on the recent payment
4. Note down:
   - **Payment ID**
   - **Customer ID**
   - **Product/Plan purchased**
   - **Payment Status**

---

## Step 7: Webhook Signature Verification 🔐

The webhook might be failing signature verification.

### Check Environment Variables in Vercel:

Go to Vercel → Project Settings → Environment Variables

**Ensure these are set:**
```
DODO_WEBHOOK_SECRET=whsec_...  (from Dodo dashboard)
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Temporarily Disable Signature Check (Testing Only):

If signature verification is the issue, we can temporarily bypass it to test.

**Edit:** `api/webhooks/dodo.js`

Look for signature verification code and see if that's where it's failing.

---

## Step 8: Test Webhook Manually 🧪

### Use This cURL Command:

```bash
curl -X POST https://www.baess.app/api/webhooks/dodo \
  -H "Content-Type: application/json" \
  -d '{
    "type": "checkout.session.completed",
    "data": {
      "customer_id": "cus_test_123",
      "customer_email": "solarapp98@gmail.com",
      "payment_status": "paid",
      "product_id": "prod_professional"
    }
  }'
```

**Expected Response:**
```json
{
  "received": true,
  "status": "success"
}
```

---

## 🎯 Quick Action Items

### RIGHT NOW:
1. ✅ **Check Dodo webhook logs** (are requests being sent?)
2. ✅ **Check Vercel function logs** (is endpoint receiving requests?)
3. ✅ **Manually update credits** (so user can start using the app)

### AFTER THAT:
4. Share Dodo webhook logs with me
5. Share Vercel function logs with me
6. Share payment details from Dodo dashboard

### THEN:
7. Fix the root cause (based on logs)
8. Test with another payment
9. Verify automatic credit updates work

---

## 🔧 Common Fixes

### Fix 1: Webhook URL Wrong
**Problem:** URL in Dodo doesn't match Vercel endpoint  
**Solution:** Update Dodo webhook URL to exact: `https://www.baess.app/api/webhooks/dodo`

### Fix 2: Signature Verification Failing
**Problem:** DODO_WEBHOOK_SECRET mismatch  
**Solution:** Copy exact secret from Dodo → paste in Vercel env vars → redeploy

### Fix 3: Wrong Event Type
**Problem:** Listening for wrong event  
**Solution:** Update webhook handler to listen for correct Dodo event type

### Fix 4: RPC Function Error
**Problem:** Database function failing  
**Solution:** Check Supabase logs, run test SQL manually

### Fix 5: Environment Variables Not Loaded
**Problem:** Vercel env vars not applied  
**Solution:** Redeploy with cache cleared

---

## 📞 What to Share Next

Please share:

1. **Screenshot of Dodo webhook logs** (last few attempts)
2. **Screenshot of Vercel function logs** (last 1 hour)
3. **What plan did the user purchase?** (Professional or Advanced)
4. **Webhook URL from Dodo dashboard** (to verify it's correct)

Then I can provide the exact fix!

---

## ⚡ Emergency Manual Fix Script

If you need to give the user credits RIGHT NOW while we debug:

```sql
-- EMERGENCY: Manual credit add for solarapp98@gmail.com
-- Run this in Supabase SQL Editor

UPDATE profiles
SET 
  subscription_tier = 'pro',  -- Change to 'advanced' if they bought Advanced plan
  ai_credits_remaining = 180,  -- 180 for Pro, 200 for Advanced
  ai_credits_monthly_limit = 180,
  subscription_status = 'active',
  subscription_start_date = NOW(),
  next_credit_reset_date = NOW() + INTERVAL '1 month',
  updated_at = NOW()
WHERE email = 'solarapp98@gmail.com';

-- Log the manual transaction
INSERT INTO ai_credit_transactions (
  user_id,
  transaction_type,
  credits_amount,
  credits_before,
  credits_after,
  credit_change,
  old_balance,
  new_balance,
  description
) VALUES (
  '0d04a2eb-b13b-4f9c-a469-86a94be45a78'::uuid,
  'admin_adjustment',
  180,  -- Credits for the plan
  9,    -- Their current free tier credits
  180,  -- New credits
  171,  -- Change amount
  9,
  180,
  'Manual credit add after successful payment - Webhook debugging'
);

-- Verify
SELECT 
  email,
  subscription_tier,
  ai_credits_remaining,
  subscription_status
FROM profiles
WHERE email = 'solarapp98@gmail.com';
```

This will immediately give them access while we fix the webhook! 🚀

