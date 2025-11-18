# 🔧 Complete Webhook Fix - All Steps in Order

## Overview
Your webhook is receiving events from Dodo Payments, but credits aren't updating because of missing database tables/columns and functions.

## ✅ Run These Files in Exact Order

---

### **Step 1:** Add Dodo Tracking Columns
**File:** `ADD_DODO_COLUMNS_TO_PROFILES.sql`

**What it does:**
- Adds `dodo_customer_id` column
- Adds `dodo_subscription_id` column
- Adds `updated_at` column

**Status:** ✅ Already completed

---

### **Step 2:** Fix Subscription Tier Constraint
**File:** `CHECK_AND_FIX_TIER_CONSTRAINT.sql`

**What it does:**
- Allows 'professional', 'pro', 'advanced', 'enterprise', 'free' values
- Removes old restrictive constraint

**Status:** ✅ Already completed

---

### **Step 3:** Fix Credit Transactions Table
**File:** `FIX_CREDIT_TRANSACTIONS_TABLE.sql` ⭐ **RUN THIS NOW**

**What it does:**
- Adds `credit_change` column
- Adds `old_balance` column
- Adds `new_balance` column
- Adds `description` column

**How to run:**
1. Open Supabase SQL Editor
2. Copy/paste file contents
3. Click Run
4. Verify: You should see 4 columns added

**This is causing your current error!**

---

### **Step 4:** Update Webhook RPC Function
**File:** `UPDATE_WEBHOOK_FUNCTION_TIER_MAPPING.sql`

**What it does:**
- Creates the `update_subscription_tier()` function
- Handles tier name variations (professional → pro)
- Updates credits based on plan
- Logs transactions

**Status:** ✅ Already completed

---

### **Step 5:** Test the Webhook
**File:** `TEST_WEBHOOK_WINDSOLAR_FIXED.sql`

**What it does:**
- Tests webhook with your actual user data
- Simulates a 'pro' plan upgrade (50 credits)
- Verifies credits update correctly

**Run after Step 3!**

---

## 🎯 Quick Action Plan

### Right Now:

1. **Run Step 3** (`FIX_CREDIT_TRANSACTIONS_TABLE.sql`)
   ```sql
   -- This adds the missing columns
   ALTER TABLE public.ai_credit_transactions
   ADD COLUMN IF NOT EXISTS credit_change INTEGER NOT NULL DEFAULT 0,
   ADD COLUMN IF NOT EXISTS old_balance INTEGER NOT NULL DEFAULT 0,
   ADD COLUMN IF NOT EXISTS new_balance INTEGER NOT NULL DEFAULT 0,
   ADD COLUMN IF NOT EXISTS description TEXT;
   ```

2. **Then re-run the test** (`TEST_WEBHOOK_WINDSOLAR_FIXED.sql`)
   ```sql
   SELECT update_subscription_tier(
     'ae169905-660a-4581-954c-0918af4ce56a'::uuid,
     'pro',
     'cus_test_manual_windsolar',
     'sub_test_manual_windsolar'
   );
   ```

3. **Check your credits**
   - Should jump from 6 to 50
   - Check in app UI
   - Verify in database

---

## 📊 Expected Results After All Steps

### Database Check:
```sql
SELECT 
  subscription_tier,     -- Should be: 'pro'
  ai_credits_remaining, -- Should be: 50
  subscription_status   -- Should be: 'active'
FROM profiles 
WHERE email = 'windsolarpowermodel@gmail.com';
```

### Transaction Check:
```sql
SELECT 
  transaction_type,      -- 'subscription_upgrade'
  credit_change,         -- +44 (50 new - 6 old)
  old_balance,          -- 6
  new_balance,          -- 50
  description
FROM ai_credit_transactions 
WHERE user_id = 'ae169905-660a-4581-954c-0918af4ce56a'::uuid
ORDER BY created_at DESC
LIMIT 1;
```

### App UI:
- AI Credits should show: **50**
- Subscription tier should show: **Pro**

---

## 🐛 Troubleshooting

### Error: "column X does not exist"
**Solution:** Run the corresponding fix file:
- `credit_change` → Run `FIX_CREDIT_TRANSACTIONS_TABLE.sql`
- `dodo_customer_id` → Run `ADD_DODO_COLUMNS_TO_PROFILES.sql`

### Error: "check constraint violated"
**Solution:** Run `CHECK_AND_FIX_TIER_CONSTRAINT.sql`

### Error: "function does not exist"
**Solution:** Run `UPDATE_WEBHOOK_FUNCTION_TIER_MAPPING.sql`

---

## ✅ Final Verification

After all steps complete, run this diagnostic:

```sql
-- 1. Check webhook function exists
SELECT 'Function exists: ' || EXISTS(
  SELECT 1 FROM pg_proc WHERE proname = 'update_subscription_tier'
);

-- 2. Check required columns exist in profiles
SELECT 'Profiles columns: ' || COUNT(*) || '/3' FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('dodo_customer_id', 'dodo_subscription_id', 'updated_at');

-- 3. Check required columns exist in transactions
SELECT 'Transaction columns: ' || COUNT(*) || '/4' FROM information_schema.columns 
WHERE table_name = 'ai_credit_transactions' 
AND column_name IN ('credit_change', 'old_balance', 'new_balance', 'description');

-- 4. Check constraint allows all tiers
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'profiles_subscription_tier_check';
```

**All should return positive results!**

---

## 🚀 After Successful Test

Once the manual test works:

1. **Make a real test payment** in Dodo
2. **Webhook will trigger automatically**
3. **Credits update without manual intervention**
4. **You're done!** ✅

---

## 📝 Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `ADD_DODO_COLUMNS_TO_PROFILES.sql` | Add tracking columns | ✅ Done |
| `CHECK_AND_FIX_TIER_CONSTRAINT.sql` | Fix tier values | ✅ Done |
| `FIX_CREDIT_TRANSACTIONS_TABLE.sql` | Add transaction columns | ⭐ **DO THIS NOW** |
| `UPDATE_WEBHOOK_FUNCTION_TIER_MAPPING.sql` | Create RPC function | ✅ Done |
| `TEST_WEBHOOK_WINDSOLAR_FIXED.sql` | Test everything works | ⏳ Run after above |

---

## 🎉 Success Indicators

You'll know everything works when:
- ✅ Manual test returns `{"success": true, "credits_added": 50}`
- ✅ Your app shows 50 credits
- ✅ Transaction appears in `ai_credit_transactions` table
- ✅ No errors in Supabase logs
- ✅ Real payment updates credits automatically

---

**Next step:** Run `FIX_CREDIT_TRANSACTIONS_TABLE.sql` right now! 🚀

