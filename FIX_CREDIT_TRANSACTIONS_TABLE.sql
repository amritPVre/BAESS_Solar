-- ============================================================================
-- FIX: AI Credit Transactions Table Structure
-- ============================================================================
-- This adds missing columns to the ai_credit_transactions table
-- ============================================================================

-- Step 1: Check current table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ai_credit_transactions'
ORDER BY ordinal_position;

-- Step 2: Add missing columns if they don't exist
ALTER TABLE public.ai_credit_transactions
ADD COLUMN IF NOT EXISTS credit_change INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS old_balance INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS new_balance INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Step 3: Verify columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'ai_credit_transactions'
AND column_name IN ('credit_change', 'old_balance', 'new_balance', 'description')
ORDER BY column_name;

-- Step 4: Check full table structure now
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ai_credit_transactions'
ORDER BY ordinal_position;

SELECT '✅ AI credit transactions table updated successfully!' AS status;

