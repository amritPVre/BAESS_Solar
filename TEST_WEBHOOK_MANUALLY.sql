-- ============================================================================
-- TEST: Manually Trigger Subscription Update (Simulate Webhook)
-- ============================================================================
-- Use this to test if the webhook function works without actual payment
-- ============================================================================

-- Step 1: Find your user ID
SELECT 
  id,
  email,
  subscription_tier,
  ai_credits_remaining,
  subscription_status
FROM public.profiles
WHERE email = 'YOUR_EMAIL_HERE@example.com';

-- Copy the 'id' from above and use it below

-- Step 2: Test the update function (replace USER_ID)
SELECT update_subscription_tier(
  'YOUR_USER_ID_HERE'::uuid,  -- Replace with actual user ID
  'pro',                        -- Plan: 'pro', 'advanced', or 'enterprise'
  'cus_test_manual',           -- Test customer ID
  'sub_test_manual'            -- Test subscription ID
);

-- Step 3: Verify the update worked
SELECT 
  id,
  email,
  subscription_tier,
  ai_credits_remaining,
  ai_credits_monthly_limit,
  subscription_status,
  dodo_customer_id,
  dodo_subscription_id,
  subscription_start_date,
  next_credit_reset_date
FROM public.profiles
WHERE email = 'YOUR_EMAIL_HERE@example.com';

-- Step 4: Check transaction history
SELECT 
  transaction_type,
  credit_change,
  old_balance,
  new_balance,
  description,
  created_at
FROM public.ai_credit_transactions
WHERE user_id = 'YOUR_USER_ID_HERE'::uuid
ORDER BY created_at DESC
LIMIT 5;

-- If everything looks good, the webhook should work!

