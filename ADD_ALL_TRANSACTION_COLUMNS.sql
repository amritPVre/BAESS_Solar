-- ============================================================================
-- ADD ALL Missing Transaction Table Columns
-- ============================================================================
-- This ensures ALL possible column variations exist
-- ============================================================================

-- Add ALL possible column variations that might be required
ALTER TABLE public.ai_credit_transactions
ADD COLUMN IF NOT EXISTS credits_before INTEGER,
ADD COLUMN IF NOT EXISTS credits_after INTEGER,
ADD COLUMN IF NOT EXISTS credits_amount INTEGER,
ADD COLUMN IF NOT EXISTS credit_change INTEGER,
ADD COLUMN IF NOT EXISTS old_balance INTEGER,
ADD COLUMN IF NOT EXISTS new_balance INTEGER,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Set defaults for existing rows (if any)
UPDATE public.ai_credit_transactions
SET 
  credits_before = COALESCE(credits_before, old_balance, 0),
  credits_after = COALESCE(credits_after, new_balance, 0),
  credits_amount = COALESCE(credits_amount, credit_change, 0)
WHERE credits_before IS NULL 
   OR credits_after IS NULL 
   OR credits_amount IS NULL;

-- Verify all columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ai_credit_transactions'
AND column_name IN (
  'credits_before',
  'credits_after',
  'credits_amount',
  'credit_change',
  'old_balance',
  'new_balance',
  'description'
)
ORDER BY column_name;

SELECT '✅ All transaction table columns added!' AS status;

