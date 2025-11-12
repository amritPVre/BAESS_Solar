-- Set your account as Super Admin
-- Run this in Supabase SQL Editor

-- Update your account to be super admin
UPDATE profiles 
SET 
  is_super_admin = TRUE,
  subscription_tier = 'enterprise',
  ai_credits_remaining = 999999,
  ai_credits_monthly_limit = 999999
WHERE email = 'amrit.mandal0191@gmail.com';

-- Verify the update
SELECT 
  id,
  name,
  email,
  is_super_admin,
  subscription_tier,
  ai_credits_remaining,
  ai_credits_monthly_limit
FROM profiles
WHERE email = 'amrit.mandal0191@gmail.com';

