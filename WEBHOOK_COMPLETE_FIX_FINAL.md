# 🎯 Complete Webhook Fix - All Steps in Order

## Issue Found
The `ai_credit_transactions` table has multiple constraints that must be satisfied:
1. ✅ Missing columns (credits_before, credits_after, etc.)
2. ✅ NOT NULL constraints on required fields
3. ⚠️ **CHECK constraint on transaction_type column** - doesn't allow 'subscription_upgrade'

---

## 🔧 Run These SQL Files in Exact Order

### Step 1: Check Current Constraints (Optional - for debugging)
**File:** `CHECK_ALL_TRANSACTION_CONSTRAINTS.sql`

This shows you what's currently blocking the insert.

---

### Step 2: Fix Transaction Type Constraint ⭐ **NEW**
**File:** `FIX_TRANSACTION_TYPE_CONSTRAINT.sql`

**What it does:**
- Drops the old check constraint
- Adds a new one that allows 'subscription_upgrade' plus other transaction types
- Verifies the update

**Run this in Supabase SQL Editor:**
```sql
-- Copy and paste entire FIX_TRANSACTION_TYPE_CONSTRAINT.sql file
```

**Expected output:**
```
✅ Transaction type constraint updated with all valid types!
```

---

### Step 3: Test the Webhook Function
**File:** `TEST_WEBHOOK_PRO_180_CREDITS.sql`

Or run this directly:

```sql
SELECT update_subscription_tier(
  'ae169905-660a-4581-954c-0918af4ce56a'::uuid,
  'pro',
  'cus_test_pro_180',
  'sub_test_pro_180'
);
```

**Expected SUCCESS result:**
```json
{
  "success": true,
  "user_id": "ae169905-660a-4581-954c-0918af4ce56a",
  "normalized_tier": "pro",
  "credits_added": 180,
  "old_balance": 6,
  "new_balance": 180,
  "credit_change": 174,
  "message": "Subscription updated successfully"
}
```

---

## ✅ Verify It Worked

### Check Profile:
```sql
SELECT 
  email,
  subscription_tier,
  ai_credits_remaining,
  subscription_status,
  dodo_subscription_id
FROM profiles
WHERE email = 'windsolarpowermodel@gmail.com';
```

**Should show:**
- subscription_tier: `pro`
- ai_credits_remaining: `180`
- subscription_status: `active`
- dodo_subscription_id: `sub_test_pro_180`

### Check Transaction Log:
```sql
SELECT 
  transaction_type,
  credits_amount,
  credits_before,
  credits_after,
  description,
  created_at
FROM ai_credit_transactions
WHERE user_id = 'ae169905-660a-4581-954c-0918af4ce56a'::uuid
ORDER BY created_at DESC
LIMIT 1;
```

**Should show:**
- transaction_type: `subscription_upgrade`
- credits_amount: `174`
- credits_before: `6`
- credits_after: `180`
- description: "Subscription upgraded to pro via Dodo Payments (180 credits for Pro)"

---

## 🎯 All Fixes Applied (Summary)

1. ✅ Added `dodo_customer_id`, `dodo_subscription_id` columns to profiles
2. ✅ Created `update_subscription_tier` RPC function
3. ✅ Fixed subscription tier check constraint (allow 'pro' and 'professional')
4. ✅ Added missing transaction columns: credit_change, old_balance, new_balance, description
5. ✅ Added credits_amount column
6. ✅ Added credits_before, credits_after columns
7. ✅ Updated Pro plan to 180 credits
8. ⭐ **Fixed transaction_type check constraint to allow 'subscription_upgrade'**

---

## 🚀 After This Works

### Test with Real Payment:
1. Go to https://www.baess.app
2. Login as windsolarpowermodel@gmail.com
3. Click "Upgrade to Pro"
4. Complete payment in Dodo
5. Get redirected back to baess.app
6. **Check your credits - should show 180!** ✅

### Dodo Webhook Will:
- Receive payment event
- Call `update_subscription_tier` function
- Update profile to Pro tier
- Add 180 credits
- Log transaction
- All automatic! 🎉

---

## 🆘 If It Still Fails

Run the constraint check:
```sql
-- See Step 1: CHECK_ALL_TRANSACTION_CONSTRAINTS.sql
```

This will show you any remaining constraint violations.

---

## 📋 Transaction Types Now Allowed

After running `FIX_TRANSACTION_TYPE_CONSTRAINT.sql`, these are valid:

- `subscription_upgrade` ⭐ (for Dodo webhook)
- `subscription_renewal` (for monthly renewals)
- `subscription_downgrade` (for plan downgrades)
- `credit_purchase` (for one-time purchases)
- `credit_usage` (for using credits)
- `credit_refund` (for refunds)
- `admin_adjustment` (for manual changes)
- `bonus_credit` (for promotions)
- `referral_bonus` (for referrals)
- `monthly_reset` (for credit resets)
- `ai_generation` (for AI usage)
- `boq_generation` (for BOQ usage)
- `report_generation` (for reports)

---

## 🎉 Success Criteria

When everything works:
- ✅ Test SQL returns `"success": true`
- ✅ Profile shows 180 credits
- ✅ Transaction logged in database
- ✅ Real payment updates credits automatically
- ✅ App UI shows correct credit balance

---

**Run FIX_TRANSACTION_TYPE_CONSTRAINT.sql now, then test again!** 🚀

