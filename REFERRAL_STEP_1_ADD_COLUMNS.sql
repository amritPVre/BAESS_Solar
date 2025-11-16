-- ============================================================================
-- REFERRAL SYSTEM SETUP - STEP BY STEP
-- ============================================================================
-- Run each step ONE AT A TIME to avoid errors
-- ============================================================================

-- ========================================
-- STEP 1: Add columns to profiles table
-- ========================================
-- Run this first and wait for success message
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(5),
ADD COLUMN IF NOT EXISTS referred_by VARCHAR(5),
ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_credits_earned INTEGER DEFAULT 0;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('referral_code', 'referred_by', 'total_referrals', 'referral_credits_earned');

-- You should see 4 rows showing the new columns
-- ========================================
-- STOP HERE - Verify columns exist before proceeding!
-- ========================================

