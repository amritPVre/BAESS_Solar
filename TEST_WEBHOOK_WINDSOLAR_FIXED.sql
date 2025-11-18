-- ============================================================================
-- TEST: Fixed Webhook Simulation for windsolarpowermodel@gmail.com
-- ============================================================================
-- Using 'pro' instead of 'professional' (constraint fix)
-- ============================================================================

-- ========================================
-- Query 1: Check Current User Status
-- ========================================
SELECT 
  id,
  email,
  name,
  subscription_tier,
  ai_credits_remaining,
  ai_credits_monthly_limit,
  subscription_status
FROM public.profiles
WHERE email = 'windsolarpowermodel@gmail.com';

-- ========================================
-- Query 2: Test PRO Plan Upgrade (50 credits) ✅ FIXED
-- ========================================
SELECT update_subscription_tier(
  'ae169905-660a-4581-954c-0918af4ce56a'::uuid,
  'pro',                                         -- Changed from 'professional' to 'pro'
  'cus_test_manual_windsolar',
  'sub_test_manual_windsolar'
);

-- Expected Result: {"success": true, "credits_added": 50, ...}

-- ========================================
-- Query 3: Verify the Update Worked
-- ========================================
SELECT 
  id,
  email,
  name,
  subscription_tier,                    -- Should be: 'pro'
  ai_credits_remaining,                 -- Should be: 50
  ai_credits_monthly_limit,             -- Should be: 50
  subscription_status,
  dodo_customer_id,
  dodo_subscription_id,
  subscription_start_date,
  next_credit_reset_date
FROM public.profiles
WHERE email = 'windsolarpowermodel@gmail.com';

-- ========================================
-- Query 4: Check Transaction History
-- ========================================
SELECT 
  transaction_type,
  credit_change,
  old_balance,
  new_balance,
  description,
  created_at
FROM public.ai_credit_transactions
WHERE user_id = 'ae169905-660a-4581-954c-0918af4ce56a'::uuid
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- Alternative: Test ADVANCED Plan (200 credits)
-- ========================================
/*
SELECT update_subscription_tier(
  'ae169905-660a-4581-954c-0918af4ce56a'::uuid,
  'advanced',
  'cus_test_advanced',
  'sub_test_advanced'
);
*/

-- ========================================
-- Alternative: Test ENTERPRISE Plan (500 credits)
-- ========================================
/*
SELECT update_subscription_tier(
  'ae169905-660a-4581-954c-0918af4ce56a'::uuid,
  'enterprise',
  'cus_test_enterprise',
  'sub_test_enterprise'
);
*/

-- ========================================
-- Reset Back to Free (if needed)
-- ========================================
/*
UPDATE public.profiles
SET 
  subscription_tier = 'free',
  ai_credits_remaining = 6,
  ai_credits_monthly_limit = 9,
  dodo_customer_id = NULL,
  dodo_subscription_id = NULL
WHERE id = 'ae169905-660a-4581-954c-0918af4ce56a'::uuid;
*/

-- ========================================
-- ✅ This version should work without errors!
-- ========================================

