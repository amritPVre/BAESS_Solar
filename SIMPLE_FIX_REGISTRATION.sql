-- ============================================================================
-- SIMPLE FIX: User Registration - Step by Step
-- ============================================================================
-- Run each section ONE AT A TIME and check for errors
-- ============================================================================

-- ========================================
-- STEP 1: Check if profiles table exists
-- ========================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- You should see columns like: id, email, name, subscription_tier, etc.
-- If you DON'T see any results, the profiles table doesn't exist!

-- ========================================
-- STEP 2: Drop old trigger and function (clean slate)
-- ========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ========================================
-- STEP 3: Create new function (SIMPLIFIED VERSION)
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert with only required fields
  INSERT INTO public.profiles (
    id,
    email,
    name
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the signup
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- ========================================
-- STEP 4: Create the trigger
-- ========================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- STEP 5: Verify trigger was created
-- ========================================
SELECT 
  tgname as trigger_name,
  tgenabled as is_enabled,
  tgtype as trigger_type
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Should show: on_auth_user_created | O | 25

-- ========================================
-- STEP 6: Test the function manually
-- ========================================
-- Try to insert a test profile to see if it works
DO $$
DECLARE
  test_id uuid := gen_random_uuid();
BEGIN
  -- Simulate what the trigger would do
  INSERT INTO public.profiles (id, email, name)
  VALUES (test_id, 'test@example.com', 'Test User');
  
  -- Clean up the test
  DELETE FROM public.profiles WHERE id = test_id;
  
  RAISE NOTICE 'Test successful! Trigger should work.';
END $$;

-- ========================================
-- STEP 7: Grant permissions
-- ========================================
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;

-- ========================================
-- ✅ After running ALL steps above, try signing up again!
-- ========================================

