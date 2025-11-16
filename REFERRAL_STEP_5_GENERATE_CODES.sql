-- ============================================================================
-- REFERRAL SYSTEM - STEP 5: Generate Codes for Existing Users
-- ============================================================================
-- Only run this AFTER Steps 1-4 complete successfully!
-- This will generate unique referral codes for ALL existing users
-- ============================================================================

-- Generate codes for existing users (MIGRATION)
DO $$
DECLARE
  user_record RECORD;
  new_code VARCHAR(5);
  counter INTEGER := 0;
BEGIN
  FOR user_record IN 
    SELECT id FROM public.profiles WHERE referral_code IS NULL
  LOOP
    new_code := public.generate_referral_code();
    UPDATE public.profiles 
    SET referral_code = new_code 
    WHERE id = user_record.id;
    counter := counter + 1;
  END LOOP;
  
  RAISE NOTICE 'Generated referral codes for % existing users', counter;
END $$;

-- Add unique constraint to referral_code
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_referral_code_unique UNIQUE (referral_code);

-- Verify all users have codes
SELECT 
  COUNT(*) as total_users,
  COUNT(referral_code) as users_with_codes,
  COUNT(*) - COUNT(referral_code) as users_without_codes
FROM public.profiles;

-- View some sample codes
SELECT 
  id,
  email,
  referral_code,
  total_referrals,
  referral_credits_earned
FROM public.profiles
WHERE referral_code IS NOT NULL
LIMIT 10;

