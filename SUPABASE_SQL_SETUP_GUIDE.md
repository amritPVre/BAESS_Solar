# Supabase SQL Setup Guide for Dodo Payments

## 🎯 Quick Answer

**Good News!** Your database schema is **already complete** from the AI Credit System migration (`20250129_add_ai_credit_system.sql`).

You have two options:

### **Option 1: Verify Only (Recommended - 2 minutes)**
Your database is ready! Just verify everything is set up correctly.

### **Option 2: Update & Verify (5 minutes)**
Run a migration to update Enterprise plan and add extra verification.

---

## ✅ What's Already in Your Database

From your existing migration `20250129_add_ai_credit_system.sql`:

### Tables:
- ✅ `profiles` - with all subscription columns
- ✅ `subscription_plans` - with all 4 plans (Free, Pro, Advanced, Enterprise)
- ✅ `ai_credit_transactions` - transaction history

### Columns in profiles:
- ✅ `subscription_tier` (free/pro/advanced/enterprise)
- ✅ `ai_credits_remaining` (current balance)
- ✅ `ai_credits_monthly_limit` (monthly allocation)
- ✅ `subscription_status` (active/canceled/past_due)
- ✅ `stripe_customer_id` (stores Dodo customer ID)
- ✅ `stripe_subscription_id` (stores Dodo subscription ID)
- ✅ `next_credit_reset_date` (when credits reset)

### Functions:
- ✅ `update_subscription_tier()` - Updates user subscription
- ✅ `deduct_ai_credits()` - Deducts AI credits
- ✅ `allocate_ai_credits()` - Allocates credits (admin)

### Data:
- ✅ Free plan ($0, 9 credits)
- ✅ Professional plan ($18, 180 credits)
- ✅ Advanced plan ($54, 360 credits)
- ✅ Enterprise plan ($108, 1,080 credits)

---

## 🚀 Setup Instructions

### **Option 1: Verify Your Database (Quick - 2 min)**

Run the verification script to confirm everything is ready:

```bash
# Using Supabase CLI
supabase db execute -f supabase/migrations/VERIFY_DODO_SETUP.sql

# OR using psql directly
psql "your-supabase-connection-string" -f supabase/migrations/VERIFY_DODO_SETUP.sql
```

**Expected Output:**
```
✅ PASS - All 4 plans exist
✅ PASS - All required columns exist
✅ PASS - Correct pricing
✅ DATABASE READY FOR DODO PAYMENTS
```

**If you see all ✅ checks passing:** You're ready! No SQL changes needed.

### **Option 2: Run Update Migration (Optional - 5 min)**

If you want to ensure Enterprise is fully configured and add extra Dodo-specific columns:

```bash
# Using Supabase CLI
supabase db execute -f supabase/migrations/20250212_dodo_payments_verification.sql

# OR using psql directly
psql "your-supabase-connection-string" -f supabase/migrations/20250212_dodo_payments_verification.sql
```

**What this migration does:**
- ✅ Verifies all required tables exist
- ✅ Updates Enterprise plan features for Dodo
- ✅ Adds `dodo_customer_id` and `dodo_subscription_id` columns (optional)
- ✅ Updates `update_subscription_tier()` function to handle Dodo
- ✅ Runs verification checks

---

## 📊 Database Schema Overview

### profiles Table (Subscription Data)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  
  -- Subscription fields (already exist)
  subscription_tier TEXT DEFAULT 'free',
  ai_credits_remaining INTEGER DEFAULT 9,
  ai_credits_monthly_limit INTEGER DEFAULT 9,
  subscription_start_date TIMESTAMPTZ DEFAULT NOW(),
  next_credit_reset_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
  subscription_status TEXT DEFAULT 'active',
  
  -- Payment gateway IDs (already exist)
  stripe_customer_id TEXT,        -- Stores Dodo customer ID
  stripe_subscription_id TEXT,    -- Stores Dodo subscription ID
  
  -- Optional Dodo-specific columns (added by migration)
  dodo_customer_id TEXT,          -- Optional: Dodo-specific
  dodo_subscription_id TEXT,      -- Optional: Dodo-specific
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### subscription_plans Table (Plan Definitions)

```sql
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,              -- 'free', 'pro', 'advanced', 'enterprise'
  name TEXT NOT NULL,               -- 'Free', 'Pro', 'Advanced', 'Enterprise'
  display_name TEXT NOT NULL,       -- Display name for UI
  description TEXT,                 -- Plan description
  price_monthly DECIMAL(10, 2),     -- 0.00, 18.00, 54.00, 108.00
  ai_credits_monthly INTEGER,       -- 9, 180, 360, 1080
  features JSONB,                   -- Array of feature strings
  is_active BOOLEAN DEFAULT TRUE,   -- Enable/disable plan
  sort_order INTEGER DEFAULT 0,     -- Display order
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### ai_credit_transactions Table (Audit Log)

```sql
CREATE TABLE ai_credit_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID,                  -- Optional: link to project
  transaction_type TEXT NOT NULL,   -- 'deduction', 'allocation', 'monthly_reset'
  credits_amount INTEGER NOT NULL,  -- Amount changed
  credits_before INTEGER NOT NULL,  -- Balance before
  credits_after INTEGER NOT NULL,   -- Balance after
  operation_type TEXT,              -- 'boq_generation', 'ai_report_generation'
  description TEXT,                 -- Human-readable description
  metadata JSONB,                   -- Extra data
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔧 Manual Verification (Optional)

If you want to manually verify without running scripts:

### 1. Check Tables Exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'subscription_plans', 'ai_credit_transactions');
```

**Expected:** 3 rows returned

### 2. Check All Plans Exist:

```sql
SELECT id, display_name, price_monthly, ai_credits_monthly, is_active
FROM subscription_plans
ORDER BY sort_order;
```

**Expected:**
```
free        | Free Plan      | 0.00  | 9    | t
pro         | Professional   | 18.00 | 180  | t
advanced    | Advanced       | 54.00 | 360  | t
enterprise  | Enterprise     | 108.00| 1080 | t
```

### 3. Check Enterprise Specifically:

```sql
SELECT * FROM subscription_plans WHERE id = 'enterprise';
```

**Expected:** 1 row with 1,080 credits and $108 price

### 4. Check Subscription Columns:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE '%subscr%' OR column_name LIKE '%credit%'
ORDER BY column_name;
```

**Expected:** At least 7 subscription-related columns

---

## 🎯 Quick Decision Guide

### Should I Run SQL Migrations?

**Run Verification Script:**
```bash
✅ Always recommended
✅ Read-only, safe to run
✅ Shows exactly what's in your database
✅ Takes 30 seconds
```

**Run Update Migration:**
```bash
⏳ Optional
✅ If you want to add dodo_* columns
✅ If Enterprise plan features need updating
✅ If you want extra verification
✅ Takes 2 minutes
```

**Skip SQL Entirely:**
```bash
❌ NOT recommended
⚠️ You should at least verify the schema
⚠️ Dodo webhooks need these tables
```

---

## 📝 What Happens During Dodo Payment

### 1. User Pays via Dodo
```
User clicks "Upgrade to Professional" 
→ Redirects to Dodo checkout
→ Enters payment info
→ Payment processed
```

### 2. Dodo Sends Webhook
```
POST /api/webhooks/dodo
Event: "subscription.active"
Data: {
  subscription_id: "sub_xxx",
  customer_id: "cus_xxx",
  product_id: "prod_subscription_monthly_pro",
  metadata: { user_id: "uuid" }
}
```

### 3. Webhook Handler Updates Supabase
```sql
-- Your webhook handler calls this function:
SELECT update_subscription_tier(
  p_user_id := 'user-uuid',
  p_new_tier := 'pro',
  p_stripe_customer_id := 'dodo_cus_xxx',
  p_stripe_subscription_id := 'dodo_sub_xxx'
);

-- Which updates:
UPDATE profiles SET
  subscription_tier = 'pro',
  ai_credits_remaining = 180,
  ai_credits_monthly_limit = 180,
  subscription_status = 'active',
  stripe_subscription_id = 'dodo_sub_xxx'
WHERE id = 'user-uuid';
```

### 4. User Gets Access
```
App reads from Supabase:
- Subscription tier: 'pro'
- Credits: 180/180
- Status: 'active'

UI updates:
- Shows Pro badge
- Enables AI features
- Displays credit balance
```

---

## ✅ Recommended Action

**Run this command:**

```bash
supabase db execute -f supabase/migrations/VERIFY_DODO_SETUP.sql
```

**Then:**
- If all checks pass ✅ → You're ready, no changes needed!
- If checks fail ❌ → Run the update migration
- If Enterprise missing ⚠️ → Run the update migration

---

## 📞 Need Help?

### Common Issues:

**"Table doesn't exist"**
```bash
# Run the AI credit system migration first:
supabase db execute -f supabase/migrations/20250129_add_ai_credit_system.sql
```

**"Enterprise plan missing"**
```bash
# Run the update migration:
supabase db execute -f supabase/migrations/20250212_dodo_payments_verification.sql
```

**"Function not found"**
```bash
# Ensure AI credit migration ran successfully:
# Check the migration status in Supabase dashboard
```

---

## 🎉 Summary

**Your database is 99% ready!** The AI Credit System migration already created everything you need.

**Action Items:**
1. ✅ Run verification script (30 seconds)
2. ⏳ Optionally run update migration (2 minutes)
3. ✅ Continue with Dodo Dashboard setup

**Files to Use:**
- `supabase/migrations/VERIFY_DODO_SETUP.sql` - Verification (read-only)
- `supabase/migrations/20250212_dodo_payments_verification.sql` - Update (optional)

Both files are **idempotent** (safe to run multiple times)!

