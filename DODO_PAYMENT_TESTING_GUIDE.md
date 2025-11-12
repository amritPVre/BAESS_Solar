# 🧪 Dodo Payments Testing Guide

## ✅ Checkpoint: You're Here!
You successfully clicked "Upgrade to Professional" and were redirected to Dodo Payments checkout page! ✅

Now let's complete the test payment and verify subscription activation.

---

## 🎯 Testing Flow Overview

```
1. Complete test payment on Dodo checkout page
2. Get redirected back to your app
3. Check if subscription tier updated in database
4. Check if AI credits were allocated
5. Verify webhook was received (optional but recommended)
```

---

## 💳 Step 1: Complete Test Payment

### Dodo Payments Test Cards

Use these **test card numbers** on the Dodo checkout page:

**✅ Successful Payment:**
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**❌ Failed Payment (for testing failures):**
```
Card Number: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits
```

### Complete the Checkout

1. On the Dodo checkout page, enter the test card details above
2. Fill in any required billing information (use test data)
3. Click "Pay" or "Complete Payment"
4. **Wait for redirect** - You should be redirected back to your app

### Expected Redirect

After successful payment:
```
Redirect URL: http://localhost:8080/subscription/success
```

If you cancel:
```
Redirect URL: http://localhost:8080/account
```

---

## 🔍 Step 2: Verify Subscription Updated

### Check in Supabase

1. **Open Supabase Dashboard** → SQL Editor
2. **Run this query:**

```sql
-- Check if subscription was updated
SELECT 
  id,
  email,
  name,
  subscription_tier,
  ai_credits_remaining,
  ai_credits_monthly_limit,
  subscription_status,
  dodo_customer_id,
  dodo_subscription_id,
  subscription_start_date
FROM public.profiles
WHERE email = 'windsolarpowermodel@gmail.com';
```

### What to Expect

**✅ If webhook worked:**
```
subscription_tier: 'pro' (changed from 'free')
ai_credits_remaining: 180 (Pro plan credits)
ai_credits_monthly_limit: 180
subscription_status: 'active'
dodo_customer_id: 'cus_xxxxx' (populated)
dodo_subscription_id: 'sub_xxxxx' (populated)
```

**❌ If webhook hasn't processed yet:**
```
subscription_tier: 'free' (still old value)
ai_credits_remaining: 6 (still old value)
```

**If webhook hasn't fired, wait 30 seconds and check again.**

---

## 📊 Step 3: Check Backend Logs

### Look for Webhook in Server Terminal

After payment, you should see this in your `npm run server` terminal:

```
🔔 Webhook received: { type: 'subscription.active', hasSignature: true }
✅ Webhook signature verified
👤 Processing webhook for user: ae169905-660a-4581-954c-0918af4ce56a
🟢 Subscription activated
✅ Webhook processed successfully
```

**Note:** Webhooks only work if you exposed your backend via ngrok (see below).

---

## 🌐 Step 4: Set Up Webhooks (Important!)

For webhooks to work in development, you need to expose your backend server:

### Option A: Use ngrok (Recommended)

**1. Fix ngrok PowerShell issue:**

Your ngrok is blocked by execution policy. Run this in PowerShell as **Administrator**:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then close and reopen PowerShell.

**2. Start ngrok:**

```bash
ngrok http 3001
```

**3. Copy the forwarding URL:**

```
Forwarding: https://abc-123-xyz.ngrok-free.app -> http://localhost:3001
```

**4. Update Dodo Dashboard:**

- Go to: https://dashboard.dodopayments.com
- Navigate to: **Settings → Webhooks**
- Click **"Add Endpoint"**
- Set URL to: `https://your-ngrok-url.ngrok-free.app/api/webhooks/dodo`
- Select events: `subscription.active`, `subscription.renewed`, `subscription.failed`, `payment.succeeded`
- Save

**5. Test webhook:**

Make another test payment and check if the webhook fires!

### Option B: Manual Database Update (Quick Test)

If you don't want to set up webhooks right now, manually update the database:

```sql
-- Manually activate Pro subscription
UPDATE public.profiles
SET 
  subscription_tier = 'pro',
  ai_credits_remaining = 180,
  ai_credits_monthly_limit = 180,
  subscription_status = 'active',
  subscription_start_date = NOW(),
  next_credit_reset_date = NOW() + INTERVAL '1 month'
WHERE email = 'windsolarpowermodel@gmail.com';

-- Verify
SELECT subscription_tier, ai_credits_remaining 
FROM public.profiles 
WHERE email = 'windsolarpowermodel@gmail.com';
```

---

## 🎨 Step 5: Verify in Your App UI

### Check Account Page

1. Go to: http://localhost:8080/account
2. **Refresh the page** (F5)
3. Look for:
   - ✅ Current Plan badge shows **"Professional"** or **"Pro"**
   - ✅ AI Credits show **180** (or similar)
   - ✅ "Upgrade" button is now "Current Plan" (disabled)

### Check Credits in Action

Try using an AI feature:
- Go to a project
- Generate a BOQ or use AI features
- Check if credits deduct properly

---

## 🐛 Troubleshooting

### Issue: Subscription Not Updated After Payment

**Check 1: Webhook Status**

In Dodo Dashboard → Webhooks, check if webhook was delivered:
- ✅ Status: 200 OK → Webhook worked
- ❌ Status: 4xx or 5xx → Check backend logs for errors
- ⏳ Status: Pending → Webhook hasn't been sent yet

**Check 2: Backend Logs**

Look in your server terminal for webhook processing logs.

**Check 3: Dodo Dashboard**

- Go to: https://dashboard.dodopayments.com
- Check: **Payments** tab
- Verify payment shows as "Succeeded"
- Check: **Subscriptions** tab
- Verify subscription shows as "Active"

### Issue: ngrok Not Working

If you can't fix the execution policy:

**Alternative: Use Dodo CLI (if available)**
```bash
dodo webhooks listen --forward-to http://localhost:3001/api/webhooks/dodo
```

Or **manually update database** using SQL from Option B above.

---

## 📋 Testing Checklist

- [ ] Entered test card details on Dodo checkout
- [ ] Completed payment successfully
- [ ] Redirected back to app
- [ ] Checked Supabase - subscription_tier updated to 'pro'
- [ ] Checked Supabase - ai_credits_remaining updated to 180
- [ ] Verified in app UI - shows Pro plan
- [ ] Set up ngrok for webhooks (optional but recommended)
- [ ] Updated Dodo webhook URL with ngrok
- [ ] Tested webhook by making another payment
- [ ] Checked webhook logs in backend terminal

---

## 🎉 Success Criteria

**Your payment integration is working if:**

1. ✅ You can click "Upgrade to Professional"
2. ✅ You're redirected to Dodo checkout page
3. ✅ You can complete payment with test card
4. ✅ You're redirected back to your app
5. ✅ Your subscription tier changes in database
6. ✅ Your AI credits increase to 180
7. ✅ Your app UI reflects the new plan

**Webhooks are working if:**

8. ✅ Backend logs show webhook received
9. ✅ Database updates automatically after payment
10. ✅ No manual SQL needed to activate subscription

---

## 🚀 Next Steps After Testing

### If Everything Works:

1. **Test the Advanced plan** ($54/month, 360 credits)
2. **Test subscription cancellation** (if you implemented it)
3. **Test credit deduction** when using AI features
4. **Test credit reset** (monthly, on subscription anniversary)

### For Production:

1. **Switch to LIVE API keys** in Dodo Dashboard
2. **Update .env** with production keys
3. **Deploy backend** to Vercel/Railway/etc
4. **Update Dodo webhook URL** to production URL
5. **Test with real card** (use your own card, then refund)
6. **Set up Stripe for payouts** (if needed)

---

## 📚 Useful Links

- **Dodo Dashboard:** https://dashboard.dodopayments.com
- **Dodo Docs:** https://docs.dodopayments.com
- **Test Cards:** https://docs.dodopayments.com/testing
- **Webhook Events:** https://docs.dodopayments.com/webhooks

---

**Start by completing a test payment with the card number above!** 🚀

Then come back and verify the subscription updated properly.

