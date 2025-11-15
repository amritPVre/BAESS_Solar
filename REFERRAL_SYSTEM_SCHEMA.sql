-- =====================================================
-- REFERRAL SYSTEM DATABASE SCHEMA
-- =====================================================
-- This script sets up the referral program infrastructure
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Add referral_code column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(5) UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by VARCHAR(5),
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_referral_credits INTEGER DEFAULT 0;

-- 2. Create referrals tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referrer_code VARCHAR(5) NOT NULL,
  referrer_credits_awarded INTEGER DEFAULT 0,
  referee_credits_awarded INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, completed, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referee_id), -- A user can only be referred once
  CHECK (referrer_id != referee_id) -- Can't refer yourself
);

-- 3. Create referral_credits_log table for tracking credit transactions
CREATE TABLE IF NOT EXISTS public.referral_credits_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
  credits_added INTEGER NOT NULL,
  transaction_type VARCHAR(20) NOT NULL, -- referrer_reward, referee_reward
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON public.referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_credits_log_user_id ON public.referral_credits_log(user_id);

-- 5. Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(5) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(5) := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    
    -- Generate 3 letters
    FOR i IN 1..3 LOOP
      result := result || substr(chars, floor(random() * 26 + 1)::int, 1);
    END LOOP;
    
    -- Generate 2 numbers
    FOR i IN 1..2 LOOP
      result := result || floor(random() * 10)::int;
    END LOOP;
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = result) INTO code_exists;
    
    -- If unique, return it
    IF NOT code_exists THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. Function to auto-generate referral code on profile creation
CREATE OR REPLACE FUNCTION auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for auto-generating referral codes
DROP TRIGGER IF EXISTS trigger_auto_generate_referral_code ON public.profiles;
CREATE TRIGGER trigger_auto_generate_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_referral_code();

-- 8. Function to process referral rewards
CREATE OR REPLACE FUNCTION process_referral_reward(
  p_referee_id UUID,
  p_referral_code VARCHAR(5)
)
RETURNS JSON AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
  v_referee_credits INTEGER := 3;
  v_referrer_credits INTEGER := 9;
  v_result JSON;
BEGIN
  -- Find referrer by code
  SELECT id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = p_referral_code;
  
  -- If referrer not found, return error
  IF v_referrer_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid referral code'
    );
  END IF;
  
  -- Check if user is trying to refer themselves
  IF v_referrer_id = p_referee_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot use your own referral code'
    );
  END IF;
  
  -- Check if referee already used a referral code
  IF EXISTS(SELECT 1 FROM public.referrals WHERE referee_id = p_referee_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You have already used a referral code'
    );
  END IF;
  
  -- Create referral record
  INSERT INTO public.referrals (
    referrer_id,
    referee_id,
    referrer_code,
    referrer_credits_awarded,
    referee_credits_awarded,
    status
  ) VALUES (
    v_referrer_id,
    p_referee_id,
    p_referral_code,
    v_referrer_credits,
    v_referee_credits,
    'pending'
  ) RETURNING id INTO v_referral_id;
  
  -- Update referred_by in profile
  UPDATE public.profiles
  SET referred_by = p_referral_code
  WHERE id = p_referee_id;
  
  RETURN json_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'referee_credits', v_referee_credits,
    'referrer_credits', v_referrer_credits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Function to activate referral (called after email verification)
CREATE OR REPLACE FUNCTION activate_referral(p_referee_id UUID)
RETURNS JSON AS $$
DECLARE
  v_referral RECORD;
  v_referee_new_credits INTEGER;
  v_referrer_new_credits INTEGER;
BEGIN
  -- Get pending referral
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referee_id = p_referee_id
    AND status = 'pending'
  LIMIT 1;
  
  -- If no pending referral, return
  IF v_referral IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No pending referral found');
  END IF;
  
  -- Add credits to referee
  UPDATE public.profiles
  SET ai_credits_remaining = ai_credits_remaining + v_referral.referee_credits_awarded
  WHERE id = p_referee_id
  RETURNING ai_credits_remaining INTO v_referee_new_credits;
  
  -- Add credits to referrer
  UPDATE public.profiles
  SET 
    ai_credits_remaining = ai_credits_remaining + v_referral.referrer_credits_awarded,
    referral_count = referral_count + 1,
    total_referral_credits = total_referral_credits + v_referral.referrer_credits_awarded
  WHERE id = v_referral.referrer_id
  RETURNING ai_credits_remaining INTO v_referrer_new_credits;
  
  -- Update referral status
  UPDATE public.referrals
  SET 
    status = 'active',
    activated_at = NOW()
  WHERE id = v_referral.id;
  
  -- Log credit transactions
  INSERT INTO public.referral_credits_log (user_id, referral_id, credits_added, transaction_type, description)
  VALUES 
    (p_referee_id, v_referral.id, v_referral.referee_credits_awarded, 'referee_reward', 'Welcome bonus for using referral code'),
    (v_referral.referrer_id, v_referral.id, v_referral.referrer_credits_awarded, 'referrer_reward', 'Reward for successful referral');
  
  RETURN json_build_object(
    'success', true,
    'referee_credits_added', v_referral.referee_credits_awarded,
    'referee_new_balance', v_referee_new_credits,
    'referrer_credits_added', v_referral.referrer_credits_awarded,
    'referrer_new_balance', v_referrer_new_credits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Function to get referral stats for a user
CREATE OR REPLACE FUNCTION get_referral_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_profile RECORD;
  v_successful_referrals INTEGER;
  v_pending_referrals INTEGER;
BEGIN
  -- Get user profile
  SELECT 
    referral_code,
    referral_count,
    total_referral_credits
  INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Count successful referrals
  SELECT COUNT(*) INTO v_successful_referrals
  FROM public.referrals
  WHERE referrer_id = p_user_id
    AND status IN ('active', 'completed');
  
  -- Count pending referrals
  SELECT COUNT(*) INTO v_pending_referrals
  FROM public.referrals
  WHERE referrer_id = p_user_id
    AND status = 'pending';
  
  RETURN json_build_object(
    'referral_code', v_profile.referral_code,
    'total_referrals', v_profile.referral_count,
    'successful_referrals', v_successful_referrals,
    'pending_referrals', v_pending_referrals,
    'total_credits_earned', v_profile.total_referral_credits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Enable RLS on new tables
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_credits_log ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS policies for referrals table
CREATE POLICY "Users can view their own referrals as referrer"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view their own referrals as referee"
ON public.referrals FOR SELECT
USING (auth.uid() = referee_id);

-- 13. Create RLS policies for referral_credits_log
CREATE POLICY "Users can view their own credit log"
ON public.referral_credits_log FOR SELECT
USING (auth.uid() = user_id);

-- 14. Grant necessary permissions
GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT SELECT ON public.referral_credits_log TO authenticated;

-- =====================================================
-- TESTING QUERIES (Optional - for verification)
-- =====================================================

-- Check if tables were created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('referrals', 'referral_credits_log');

-- Check if columns were added to profiles
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- AND column_name IN ('referral_code', 'referred_by', 'referral_count', 'total_referral_credits');

-- Test referral code generation
-- SELECT generate_referral_code();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Referral system schema created successfully!';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Update existing user profiles with referral codes (see below)';
  RAISE NOTICE '   2. Integrate referral code input in sign-up form';
  RAISE NOTICE '   3. Display referral code in user dashboard';
  RAISE NOTICE '   4. Test the referral flow';
END $$;

-- =====================================================
-- OPTIONAL: Generate referral codes for existing users
-- =====================================================
-- Uncomment and run this if you have existing users without referral codes
/*
UPDATE public.profiles
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;
*/

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================
/*
-- Example 1: Process a referral when user signs up
SELECT process_referral_reward(
  'user-uuid-here',  -- referee ID
  'ABC12'            -- referral code they used
);

-- Example 2: Activate referral after email verification
SELECT activate_referral('user-uuid-here');

-- Example 3: Get referral stats for a user
SELECT get_referral_stats('user-uuid-here');
*/

