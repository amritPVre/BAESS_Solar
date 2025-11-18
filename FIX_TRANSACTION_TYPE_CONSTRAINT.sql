-- ============================================================================
-- FIX: Transaction Type Check Constraint
-- ============================================================================
-- Check what values are currently allowed and add 'subscription_upgrade'
-- ============================================================================

-- Step 1: Check current constraint definition
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.ai_credit_transactions'::regclass
AND conname LIKE '%transaction_type%';

-- Step 2: Check what transaction types are currently in use
SELECT DISTINCT transaction_type
FROM public.ai_credit_transactions
ORDER BY transaction_type;

-- Step 3: Drop the old constraint
ALTER TABLE public.ai_credit_transactions
DROP CONSTRAINT IF EXISTS ai_credit_transactions_transaction_type_check;

-- Step 4: Add new constraint with all valid transaction types
ALTER TABLE public.ai_credit_transactions
ADD CONSTRAINT ai_credit_transactions_transaction_type_check
CHECK (transaction_type IN (
  'subscription_upgrade',    -- New: For subscription upgrades
  'subscription_renewal',    -- For monthly renewals
  'subscription_downgrade',  -- For plan downgrades
  'credit_purchase',         -- For one-time credit purchases
  'credit_usage',            -- For using credits
  'credit_refund',           -- For refunds
  'admin_adjustment',        -- For manual admin changes
  'bonus_credit',            -- For promotional credits
  'referral_bonus',          -- For referral rewards
  'monthly_reset',           -- For monthly credit resets
  'ai_generation',           -- For AI usage
  'boq_generation',          -- For BOQ generation
  'report_generation'        -- For report generation
));

-- Step 5: Verify the constraint was updated
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.ai_credit_transactions'::regclass
AND conname = 'ai_credit_transactions_transaction_type_check';

SELECT '✅ Transaction type constraint updated with all valid types!' AS status;

