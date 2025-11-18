-- ============================================================================
-- TEST: Webhook with Pro Plan (180 Credits)
-- ============================================================================
-- For user: windsolarpowermodel@gmail.com
-- ============================================================================

-- Step 1: Check current status
SELECT 
  email,
  subscription_tier,
  ai_credits_remaining,
  subscription_status
FROM public.profiles
WHERE email = 'windsolarpowermodel@gmail.com';

-- Current: 6 credits, free tier

-- Step 2: Run the upgrade test
SELECT update_subscription_tier(
  'ae169905-660a-4581-954c-0918af4ce56a'::uuid,
  'pro',
  'cus_test_pro_180',
  'sub_test_pro_180'
);

-- Expected result:
-- {
--   "success": true,
--   "credits_added": 180,
--   "old_balance": 6,
--   "new_balance": 180,
--   "credit_change": 174
-- }

-- Step 3: Verify the update
SELECT 
  email,
  subscription_tier,           -- Should be: 'pro'
  ai_credits_remaining,        -- Should be: 180
  ai_credits_monthly_limit,    -- Should be: 180
  subscription_status,         -- Should be: 'active'
  dodo_subscription_id
FROM public.profiles
WHERE email = 'windsolarpowermodel@gmail.com';

-- Step 4: Check transaction record
SELECT 
  transaction_type,
  credits_amount,              -- Should be: 174 (180 - 6)
  credits_before,              -- Should be: 6
  credits_after,               -- Should be: 180
  credit_change,               -- Should be: 174
  old_balance,                 -- Should be: 6
  new_balance,                 -- Should be: 180
  description,
  created_at
FROM public.ai_credit_transactions
WHERE user_id = 'ae169905-660a-4581-954c-0918af4ce56a'::uuid
ORDER BY created_at DESC
LIMIT 1;

-- ✅ Success indicators:
-- - Profile shows 180 credits
-- - Tier is 'pro'
-- - Status is 'active'
-- - Transaction logged with all fields
-- - App UI shows 180 credits

-- Reset if needed (optional):
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

