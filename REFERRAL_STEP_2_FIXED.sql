-- ============================================================================
-- REFERRAL SYSTEM - STEP 2: Create Tracking Table (FIXED)
-- ============================================================================
-- Run this if Step 2 gave you "column does not exist" error
-- ============================================================================

-- First, let's verify Step 1 columns exist
DO $$
BEGIN
  -- Check if columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'referral_code'
  ) THEN
    RAISE EXCEPTION 'referral_code column does not exist in profiles table. Please run Step 1 first!';
  END IF;
  
  RAISE NOTICE 'Step 1 columns verified - proceeding with Step 2';
END $$;

-- Drop table if it exists (in case of partial creation)
DROP TABLE IF EXISTS public.referrals CASCADE;

-- Create referrals tracking table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code VARCHAR(5) NOT NULL,
  credits_given_to_referrer INTEGER DEFAULT 9,
  credits_given_to_referred INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referred_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);

-- Verify table was created
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'referrals'
ORDER BY ordinal_position;

-- Success message
SELECT '✅ Step 2 complete: referrals table created successfully!' as status;

