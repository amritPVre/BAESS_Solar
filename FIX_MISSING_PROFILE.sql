-- ============================================================================
-- FIX: Create Missing Profile for User
-- ============================================================================
-- This script creates the missing profile for the authenticated user
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard > SQL Editor
-- ============================================================================

-- Create the profile for the user
INSERT INTO public.profiles (
  id,
  email,
  name,
  subscription_tier,
  ai_credits_remaining,
  ai_credits_monthly_limit,
  subscription_status,
  subscription_start_date,
  next_credit_reset_date,
  created_at,
  updated_at
)
VALUES (
  'ae169905-660a-4581-954c-0918af4ce56a'::uuid,  -- User ID from auth.users
  'windsolarpowermodel@gmail.com',                 -- Email
  'wind solar',                                     -- Name
  'free',                                           -- Starting tier
  9,                                                -- Free tier credits
  9,                                                -- Monthly credit limit
  'active',                                         -- Active subscription
  NOW(),                                            -- Start date
  NOW() + INTERVAL '1 month',                       -- Next reset date
  NOW(),                                            -- Created at
  NOW()                                             -- Updated at
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  subscription_tier = COALESCE(profiles.subscription_tier, EXCLUDED.subscription_tier),
  updated_at = NOW();

-- Verify the profile was created
SELECT 
  id,
  email,
  name,
  subscription_tier,
  ai_credits_remaining,
  subscription_status
FROM public.profiles
WHERE id = 'ae169905-660a-4581-954c-0918af4ce56a'::uuid;

-- If successful, you should see:
-- ✅ 1 row returned with your profile information

