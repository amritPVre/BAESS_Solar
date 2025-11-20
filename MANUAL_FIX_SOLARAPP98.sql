-- ============================================================================
-- MANUAL FIX: Add Credits for solarapp98@gmail.com
-- ============================================================================
-- User ID: 0d04a2eb-b13b-4f9c-a469-86a94be45a78
-- Email: solarapp98@gmail.com
-- Issue: Payment successful but webhook not processing
-- ============================================================================

-- Step 1: Check current status
SELECT 
  id,
  email,
  name,
  subscription_tier,
  ai_credits_remaining,
  subscription_status,
  dodo_customer_id,
  dodo_subscription_id
FROM profiles
WHERE email = 'solarapp98@gmail.com';

-- Expected output: free tier with 9 credits

-- ============================================================================
-- Step 2: IMPORTANT - Which plan did they purchase?
-- ============================================================================
-- Pro Plan (Professional) → 180 credits
-- Advanced Plan → 200 credits
-- 
-- CHANGE THE VALUES BELOW BASED ON THEIR PURCHASE!
-- ============================================================================

-- Option A: If they purchased PRO plan (180 credits)
SELECT update_subscription_tier(
  '0d04a2eb-b13b-4f9c-a469-86a94be45a78'::uuid,
  'pro',
  NULL,  -- We'll update this with actual customer_id later
  NULL   -- We'll update this with actual subscription_id later
);

-- Option B: If they purchased ADVANCED plan (200 credits)
/*
SELECT update_subscription_tier(
  '0d04a2eb-b13b-4f9c-a469-86a94be45a78'::uuid,
  'advanced',
  NULL,
  NULL
);
*/

-- Step 3: Verify the update
SELECT 
  email,
  subscription_tier,
  ai_credits_remaining,
  ai_credits_monthly_limit,
  subscription_status,
  updated_at
FROM profiles
WHERE email = 'solarapp98@gmail.com';

-- Expected output for PRO:
-- subscription_tier: pro
-- ai_credits_remaining: 180
-- subscription_status: active

-- Step 4: Check transaction log
SELECT 
  transaction_type,
  credits_amount,
  credits_before,
  credits_after,
  credit_change,
  description,
  created_at
FROM ai_credit_transactions
WHERE user_id = '0d04a2eb-b13b-4f9c-a469-86a94be45a78'::uuid
ORDER BY created_at DESC
LIMIT 5;

-- Should show the subscription_upgrade transaction

SELECT '✅ Manual credit update complete for solarapp98@gmail.com!' AS status;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. This is a temporary fix while we debug the webhook
-- 2. The user can now access the app with their purchased credits
-- 3. We still need to fix the webhook for future automatic updates
-- 4. If you have the Dodo customer_id and subscription_id, update them:
--
-- UPDATE profiles
-- SET 
--   dodo_customer_id = 'cus_xxx',  -- Get from Dodo dashboard
--   dodo_subscription_id = 'sub_xxx'  -- Get from Dodo dashboard
-- WHERE email = 'solarapp98@gmail.com';
-- ============================================================================

