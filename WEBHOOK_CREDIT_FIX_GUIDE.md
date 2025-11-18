# 🔧 Webhook Credit Update Fix Guide

## 🎯 Problem

Dodo Payments webhooks are being received successfully (you can see the events in the log), but AI credits are not being added to the user's account after payment.

## 🔍 Root Cause

The webhook handler (`api/webhooks/dodo.js`) is calling a database function `update_subscription_tier` that either:
1. Doesn't exist in your Supabase database
2. Exists but doesn't properly update credits
3. Exists but lacks proper permissions

## ✅ Solution (3 Steps)

### Step 1: Add Missing Columns (if needed)

**File:** `ADD_DODO_COLUMNS_TO_PROFILES.sql`

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents
3. Click **Run**
4. Verify: You should see 3 columns listed (dodo_customer_id, dodo_subscription_id, updated_at)

---

### Step 2: Create the Webhook RPC Function

**File:** `FIX_WEBHOOK_RPC_FUNCTION.sql`

1. In Supabase SQL Editor
2. Copy and paste the contents
3. Click **Run**
4. Verify: You should see "✅ Webhook RPC function created successfully!"

**This function does:**
- ✅ Updates subscription tier
- ✅ Sets AI credits based on plan
- ✅ Marks subscription as active
- ✅ Logs the transaction
- ✅ Returns success/error info

**Credit Allocation:**
- Free: 9 credits
- Pro/Professional: 50 credits
- Advanced: 200 credits
- Enterprise: 500 credits

---

### Step 3: Test the Fix

**File:** `TEST_WEBHOOK_MANUALLY.sql`

1. In the SQL file, replace `YOUR_EMAIL_HERE@example.com` with your actual email
2. Run Query 1 to find your user ID
3. Copy your user ID
4. Replace `YOUR_USER_ID_HERE` in Query 2 with your actual ID
5. Run Query 2 to simulate a webhook call
6. Run Queries 3 & 4 to verify credits were added

**Expected Result:**
- ✅ `subscription_tier` = 'pro' (or whatever you specified)
- ✅ `ai_credits_remaining` = 50 (for pro plan)
- ✅ `subscription_status` = 'active'
- ✅ New transaction in `ai_credit_transactions` table

---

## 🧪 Testing with Real Payment

After running Steps 1-3, you can test with a real payment:

1. **Make a test payment** (use a small amount or test mode)
2. **Watch Vercel logs** (or webhook logs in Dodo dashboard)
3. **Check your account** - credits should update automatically
4. **Verify in database**:

```sql
SELECT 
  email,
  subscription_tier,
  ai_credits_remaining,
  subscription_status,
  dodo_subscription_id
FROM profiles
WHERE email = 'your-email@example.com';
```

---

## 📊 Verifying Webhook Events

### Check Webhook Logs in Dodo Dashboard

1. Go to Dodo Payments Dashboard
2. Navigate to **Webhooks** → **Recent Events**
3. You should see:
   - ✅ `payment.succeeded` (200 OK)
   - ✅ `subscription.active` (200 OK)
   - ✅ `subscription.renewed` (200 OK)

### Check Vercel Function Logs

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Functions** → `/api/webhooks/dodo`
4. Check logs for:
   - ✅ "🔔 Webhook received"
   - ✅ "🟢 Subscription activated"
   - ✅ "✅ Webhook processed successfully"

**If you see errors**, copy them and we'll fix them!

---

## 🐛 Common Issues & Fixes

### Issue 1: "Function update_subscription_tier does not exist"

**Solution:** Run Step 2 (`FIX_WEBHOOK_RPC_FUNCTION.sql`)

---

### Issue 2: "Column dodo_customer_id does not exist"

**Solution:** Run Step 1 (`ADD_DODO_COLUMNS_TO_PROFILES.sql`)

---

### Issue 3: Credits still not updating after fix

**Possible causes:**
1. **Wrong plan_id in metadata**
   - Check what metadata is being sent to Dodo
   - Should include: `user_id` and `plan_id`

2. **Environment variables not set in Vercel**
   - Verify `VITE_SUPABASE_URL` is set
   - Verify `VITE_SUPABASE_ANON_KEY` is set

3. **Webhook not calling the function**
   - Check Vercel logs for errors
   - Verify webhook URL is correct: `https://www.baess.app/api/webhooks/dodo`

**Debug Query:**
```sql
-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'update_subscription_tier';

-- Check function permissions
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'update_subscription_tier';
```

---

### Issue 4: Webhook receives events but function not called

**Check webhook handler code:**

In `api/webhooks/dodo.js`, verify line 74-79 calls the function:
```javascript
case 'subscription.active':
  await supabase.rpc('update_subscription_tier', {
    p_user_id: userId,
    p_new_tier: planId || 'pro',
    p_dodo_customer_id: event.data.customer_id,
    p_dodo_subscription_id: event.data.id
  });
```

---

## 🔐 Security Checklist

- [ ] Webhook secret configured in Vercel env vars (`DODO_WEBHOOK_SECRET`)
- [ ] RPC function has proper permissions (granted to `service_role`)
- [ ] Supabase service role key is set (if needed)
- [ ] RLS policies allow webhook to update profiles

---

## 📝 Quick Verification Script

Run this after the fix to verify everything:

```sql
-- 1. Check function exists
SELECT 'Function exists: ' || EXISTS(
  SELECT 1 FROM pg_proc WHERE proname = 'update_subscription_tier'
) AS status;

-- 2. Check columns exist
SELECT 'Columns exist: ' || (
  SELECT COUNT(*) FROM information_schema.columns 
  WHERE table_name = 'profiles' 
  AND column_name IN ('dodo_customer_id', 'dodo_subscription_id')
) || '/2' AS status;

-- 3. Test function call
SELECT 'Function test: ' || 
  (update_subscription_tier(
    (SELECT id FROM profiles LIMIT 1),
    'pro',
    'test_cus',
    'test_sub'
  )->>'success')::boolean AS status;
```

All three should return TRUE/success!

---

## 🚀 After Fix Deployed

1. **Redeploy Vercel** (to ensure latest code is live)
2. **Test with small payment** (or use test mode)
3. **Monitor webhook logs** in real-time
4. **Check user account** immediately after payment
5. **Verify transaction history** in database

---

## 💡 Prevention: Testing Future Updates

Always test webhook locally before deploying:

```bash
# Use webhook testing tool (like webhook.site)
# Or test with curl:
curl -X POST https://www.baess.app/api/webhooks/dodo \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "subscription.active",
    "data": {
      "id": "sub_test",
      "customer_id": "cus_test",
      "metadata": {
        "user_id": "YOUR_USER_ID",
        "plan_id": "pro"
      }
    }
  }'
```

---

## 📞 Still Not Working?

If credits still don't update after following all steps:

1. **Run the diagnostic:**
```sql
SELECT 
  'User ID: ' || id,
  'Email: ' || email,
  'Tier: ' || subscription_tier,
  'Credits: ' || ai_credits_remaining,
  'Status: ' || subscription_status,
  'Dodo Sub: ' || COALESCE(dodo_subscription_id, 'NULL')
FROM profiles 
WHERE email = 'your-email@example.com';
```

2. **Check recent transactions:**
```sql
SELECT * FROM ai_credit_transactions 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC 
LIMIT 10;
```

3. **Share these results** and we'll debug further!

---

## ✅ Success Checklist

After fix, verify:
- [ ] RPC function exists in Supabase
- [ ] Columns added to profiles table
- [ ] Manual test works (Step 3)
- [ ] Real payment updates credits
- [ ] Webhook logs show 200 OK
- [ ] Transaction recorded in database
- [ ] User sees updated credits in UI

---

**Your webhook should now properly update AI credits after successful payments!** 🎉

