-- ============================================================================
-- REFERRAL SYSTEM - STEP 3: Create Functions
-- ============================================================================
-- Only run this AFTER Steps 1 & 2 complete successfully!
-- ============================================================================

-- Function to generate unique referral code
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
      CHR(65 + floor(random() * 26)::int) ||
      CHR(65 + floor(random() * 26)::int) ||
      CHR(65 + floor(random() * 26)::int) ||
      floor(random() * 10)::text ||
      floor(random() * 10)::text;
    
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

-- Function to apply referral bonus
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

-- Verify functions were created
SELECT proname 
FROM pg_proc 
WHERE proname IN ('generate_referral_code', 'apply_referral_bonus');

-- You should see both function names

