-- ============================================================================
-- FIX: Foreign Key Constraint Issue
-- ============================================================================
-- The profiles table has a foreign key pointing to the wrong table
-- This script will fix it
-- ============================================================================

-- Step 1: Check current foreign key constraints
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
AND contype = 'f';

-- You should see something like:
-- profiles_id_fkey | profiles | users | FOREIGN KEY (id) REFERENCES users(id)
-- ❌ This is WRONG - it should reference auth.users, not "users"

-- ========================================
-- Step 2: Drop the incorrect foreign key constraint
-- ========================================
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey CASCADE;

-- ========================================
-- Step 3: Recreate the foreign key constraint correctly
-- ========================================
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- ========================================
-- Step 4: Verify the fix
-- ========================================
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
AND contype = 'f';

-- ✅ Should now show:
-- profiles_id_fkey | profiles | users | FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE

-- ========================================
-- Step 5: Recreate the trigger (if needed)
-- ========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert new profile with default values
  INSERT INTO public.profiles (
    id,
    email,
    name,
    subscription_tier,
    ai_credits_remaining,
    ai_credits_monthly_limit,
    subscription_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'free',
    9,
    9,
    'active'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error details
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    -- Don't fail the signup
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- Step 6: Grant permissions
-- ========================================
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;

-- ========================================
-- Step 7: Test it!
-- ========================================
SELECT 'Foreign key constraint fixed! Try signing up now.' AS result;

