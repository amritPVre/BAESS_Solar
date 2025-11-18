-- ============================================================================
-- Add Dodo Payment Tracking Columns to Profiles
-- ============================================================================
-- Run this BEFORE the webhook RPC function if columns don't exist
-- ============================================================================

-- Add Dodo Payments tracking columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dodo_customer_id TEXT,
ADD COLUMN IF NOT EXISTS dodo_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_dodo_customer 
ON public.profiles(dodo_customer_id);

CREATE INDEX IF NOT EXISTS idx_profiles_dodo_subscription 
ON public.profiles(dodo_subscription_id);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('dodo_customer_id', 'dodo_subscription_id', 'updated_at');

SELECT '✅ Dodo tracking columns added to profiles table!' AS status;

