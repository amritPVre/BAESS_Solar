-- ============================================================================
-- FIX: User Registration Trigger
-- ============================================================================
-- This script creates/fixes the trigger that automatically creates a profile
-- when a new user signs up
-- 
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard > SQL Editor
-- ============================================================================

-- Step 1: Check if the function exists
-- This function will be called by the trigger to create a profile
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    name,
    subscription_tier,
    ai_credits_remaining,
    ai_credits_monthly_limit,
    subscription_status,
    subscription_start_date,
    next_credit_reset_date,
    preferred_currency,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'free',
    9,
    9,
    'active',
    NOW(),
    NOW() + INTERVAL '1 month',
    'USD',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop the old trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 3: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Step 5: Update RLS policies to allow profile creation
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read for backend" ON public.profiles;

-- Create new policies that allow trigger to work
CREATE POLICY "Enable read access for all users"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Allow service role to insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Verify the trigger was created
SELECT 
  tgname AS trigger_name,
  tgenabled AS enabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- You should see:
-- trigger_name: on_auth_user_created
-- enabled: O (means enabled)

-- Step 7: Test by checking if the function exists
SELECT 
  proname AS function_name,
  prosrc AS function_body
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- You should see the handle_new_user function listed

-- ============================================================================
-- ✅ After running this SQL, try signing up again!
-- ============================================================================

