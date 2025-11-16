-- ============================================================================
-- REFERRAL SYSTEM - STEP 2: Create Tracking Table
-- ============================================================================
-- Only run this AFTER Step 1 completes successfully!
-- ============================================================================

-- Create referrals tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
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
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);

-- Verify table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'referrals';

-- You should see: referrals

