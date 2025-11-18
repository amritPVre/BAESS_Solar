-- ============================================================================
-- TEST: Manual Webhook Simulation for windsolarpowermodel@gmail.com
-- ============================================================================
-- This will test if the webhook function works correctly
-- Run each query ONE AT A TIME in Supabase SQL Editor
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
  subscription_status,
  dodo_customer_id,
  dodo_subscription_id
FROM public.profiles
WHERE email = 'windsolarpowermodel@gmail.com';

-- Current Status:
-- - Tier: free
-- - Credits: 6/9
-- - Status: active

-- ========================================
-- Query 2: Test PROFESSIONAL Plan Upgrade (50 credits)
-- ========================================
SELECT update_subscription_tier(
  'ae169905-660a-4581-954c-0918af4ce56a'::uuid,  -- Your user ID
  'professional',                                 -- Upgrading to Professional plan
  'cus_test_manual_windsolar',                   -- Test customer ID
  'sub_test_manual_windsolar'                    -- Test subscription ID
);

-- Expected Result: {"success": true, "credits_added": 50, ...}

-- ========================================
-- Query 3: Verify the Update Worked
-- ========================================
SELECT 
  id,
  email,
  name,
  subscription_tier,                    -- Should be: 'professional'
  ai_credits_remaining,                 -- Should be: 50
  ai_credits_monthly_limit,             -- Should be: 50
  subscription_status,                  -- Should be: 'active'
  dodo_customer_id,                     -- Should be: 'cus_test_manual_windsolar'
  dodo_subscription_id,                 -- Should be: 'sub_test_manual_windsolar'
  subscription_start_date,
  next_credit_reset_date
FROM public.profiles
WHERE email = 'windsolarpowermodel@gmail.com';

-- ========================================
-- Query 4: Check Transaction History
-- ========================================
SELECT 
  transaction_type,
  credit_change,                        -- Should show: +44 (50 new - 6 old)
  old_balance,                          -- Should show: 6
  new_balance,                          -- Should show: 50
  description,
  created_at
FROM public.ai_credit_transactions
WHERE user_id = 'ae169905-660a-4581-954c-0918af4ce56a'::uuid
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- Alternative: Test ADVANCED Plan (200 credits)
-- ========================================
-- If you want to test Advanced plan instead, run this:
/*
SELECT update_subscription_tier(
  'ae169905-660a-4581-954c-0918af4ce56a'::uuid,
  'advanced',                                     -- 200 credits
  'cus_test_advanced',
  'sub_test_advanced'
);
*/

-- ========================================
-- Alternative: Test ENTERPRISE Plan (500 credits)
-- ========================================
-- If you want to test Enterprise plan instead, run this:
/*
SELECT update_subscription_tier(
  'ae169905-660a-4581-954c-0918af4ce56a'::uuid,
  'enterprise',                                   -- 500 credits
  'cus_test_enterprise',
  'sub_test_enterprise'
);
*/

-- ========================================
-- Reset Back to Free (if testing)
-- ========================================
-- If you want to reset back to free tier after testing:
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
-- ✅ SUCCESS INDICATORS
-- ========================================
-- After running Query 2, you should see:
-- 1. Query 2 returns: {"success": true, "user_id": "ae169905...", "new_tier": "professional", "credits_added": 50}
-- 2. Query 3 shows: subscription_tier = 'professional', ai_credits_remaining = 50
-- 3. Query 4 shows: New transaction with credit_change = +44, new_balance = 50
-- 4. Your account page in the app should show 50 credits!

-- ========================================
-- 🎉 If all checks pass, your webhook is ready!
-- ========================================
-- The next real payment will automatically update credits via webhook

