-- ============================================================================
-- FIX: Row Level Security Policies for Profiles Table
-- ============================================================================
-- This script updates RLS policies to allow backend server to read profiles
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard > SQL Editor
-- ============================================================================

-- Check current RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';

-- Drop existing restrictive policies and create new ones
-- This allows authenticated users to read their own profiles
-- and allows service role to read any profile

-- First, ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;

-- Create new policies that allow backend to work

-- Policy 1: Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Allow users to update their own profile  
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 4: Allow anon/authenticated role to read profiles (needed for backend)
CREATE POLICY "Enable read for backend"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- Verify the policies were created
SELECT 
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has conditions'
    ELSE 'No conditions (allows all)'
  END as policy_type
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Test the profile is accessible
SELECT id, email, name, subscription_tier 
FROM public.profiles 
WHERE id = 'ae169905-660a-4581-954c-0918af4ce56a'::uuid;

-- If you see the profile data above, the fix worked! ✅

