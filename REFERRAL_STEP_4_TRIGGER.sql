-- ============================================================================
-- REFERRAL SYSTEM - STEP 4: Update Trigger for New Users
-- ============================================================================
-- Only run this AFTER Steps 1, 2 & 3 complete successfully!
-- ============================================================================

-- Update trigger to generate referral codes for new users
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

-- Verify trigger exists
SELECT tgname 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- You should see: on_auth_user_created

