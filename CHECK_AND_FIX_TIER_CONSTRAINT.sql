-- ============================================================================
-- CHECK AND FIX: Subscription Tier Constraint
-- ============================================================================
-- Step 1: Check what values are currently allowed
-- ============================================================================

-- Check the constraint definition
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
AND conname LIKE '%subscription_tier%';

-- Check current subscription tier values in use
SELECT DISTINCT subscription_tier
FROM public.profiles
ORDER BY subscription_tier;

-- ============================================================================
-- Step 2: Drop the old constraint
-- ============================================================================

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

-- ============================================================================
-- Step 3: Add new constraint with all valid values
-- ============================================================================

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_subscription_tier_check
CHECK (subscription_tier IN (
  'free',
  'pro',
  'professional',  -- Adding this
  'advanced',
  'enterprise'
));

-- ============================================================================
-- Step 4: Verify the constraint was updated
-- ============================================================================

SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
AND conname = 'profiles_subscription_tier_check';

-- You should see all 5 tier options now

SELECT '✅ Subscription tier constraint updated successfully!' AS status;

