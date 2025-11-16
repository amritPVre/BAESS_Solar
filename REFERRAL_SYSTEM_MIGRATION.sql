-- ============================================================================
-- REFERRAL SYSTEM SETUP
-- ============================================================================
-- This creates a complete referral system with unique codes for each user
-- New users get +3 credits, referring users get +9 credits
-- ============================================================================

-- ========================================
-- Step 1: Add referral_code column to profiles
-- ========================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(5) UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by VARCHAR(5),
ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_credits_earned INTEGER DEFAULT 0;

-- ========================================
-- Step 2: Create referrals tracking table
-- ========================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code VARCHAR(5) NOT NULL,
  credits_given_to_referrer INTEGER DEFAULT 9,
  credits_given_to_referred INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referred_id) -- A user can only be referred once
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);

-- ========================================
-- Step 3: Function to generate unique referral code
-- ========================================
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS VARCHAR(5)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code VARCHAR(5);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code: 3 uppercase letters + 2 numbers (e.g., ABC12)
    new_code := 
      CHR(65 + floor(random() * 26)::int) ||  -- A-Z
      CHR(65 + floor(random() * 26)::int) ||  -- A-Z
      CHR(65 + floor(random() * 26)::int) ||  -- A-Z
      floor(random() * 10)::text ||           -- 0-9
      floor(random() * 10)::text;             -- 0-9
    
    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM public.profiles WHERE referral_code = new_code
    ) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- ========================================
-- Step 4: Function to apply referral bonus
-- ========================================
CREATE OR REPLACE FUNCTION public.apply_referral_bonus(
  referred_user_id UUID,
  ref_code VARCHAR(5)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referrer_user_id UUID;
  result JSONB;
BEGIN
  -- Find the referrer by code
  SELECT id INTO referrer_user_id
  FROM public.profiles
  WHERE referral_code = ref_code;
  
  -- If referral code doesn't exist
  IF referrer_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid referral code'
    );
  END IF;
  
  -- Can't refer yourself
  IF referrer_user_id = referred_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Cannot use your own referral code'
    );
  END IF;
  
  -- Check if user was already referred
  IF EXISTS(SELECT 1 FROM public.referrals WHERE referred_id = referred_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User already used a referral code'
    );
  END IF;
  
  -- Add bonus credits to referred user (+3)
  UPDATE public.profiles
  SET 
    ai_credits_remaining = ai_credits_remaining + 3,
    referred_by = ref_code
  WHERE id = referred_user_id;
  
  -- Add bonus credits to referrer (+9)
  UPDATE public.profiles
  SET 
    ai_credits_remaining = ai_credits_remaining + 9,
    total_referrals = total_referrals + 1,
    referral_credits_earned = referral_credits_earned + 9
  WHERE id = referrer_user_id;
  
  -- Record the referral
  INSERT INTO public.referrals (
    referrer_id,
    referred_id,
    referral_code,
    credits_given_to_referrer,
    credits_given_to_referred
  ) VALUES (
    referrer_user_id,
    referred_user_id,
    ref_code,
    9,
    3
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Referral bonus applied successfully',
    'credits_received', 3
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error applying referral bonus: ' || SQLERRM
    );
END;
$$;

-- ========================================
-- Step 5: Update trigger to generate codes for new users
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_ref_code VARCHAR(5);
BEGIN
  -- Generate unique referral code
  new_ref_code := generate_referral_code();
  
  -- Insert new profile with referral code
  INSERT INTO public.profiles (
    id,
    email,
    name,
    subscription_tier,
    ai_credits_remaining,
    ai_credits_monthly_limit,
    subscription_status,
    referral_code
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'free',
    9,
    9,
    'active',
    new_ref_code
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- Step 6: Generate codes for existing users (MIGRATION)
-- ========================================
DO $$
DECLARE
  user_record RECORD;
  new_code VARCHAR(5);
BEGIN
  FOR user_record IN 
    SELECT id FROM public.profiles WHERE referral_code IS NULL
  LOOP
    new_code := public.generate_referral_code();
    UPDATE public.profiles 
    SET referral_code = new_code 
    WHERE id = user_record.id;
  END LOOP;
  
  RAISE NOTICE 'Referral codes generated for all existing users';
END $$;

-- ========================================
-- Step 7: Enable RLS (Row Level Security)
-- ========================================
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referral stats
CREATE POLICY "Users can view own referral stats"
ON public.referrals
FOR SELECT
USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- Only the system can insert referrals
CREATE POLICY "System can insert referrals"
ON public.referrals
FOR INSERT
WITH CHECK (true);

-- ========================================
-- Step 8: Grant permissions
-- ========================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.referrals TO authenticated;
GRANT INSERT ON public.referrals TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.apply_referral_bonus(UUID, VARCHAR) TO authenticated, service_role;

-- ========================================
-- Step 9: Verify setup
-- ========================================
SELECT 
  'Referral system setup complete!' AS status,
  COUNT(*) AS total_users_with_codes
FROM public.profiles
WHERE referral_code IS NOT NULL;

-- Check a sample of generated codes
SELECT 
  id,
  email,
  referral_code,
  total_referrals,
  referral_credits_earned
FROM public.profiles
LIMIT 5;

