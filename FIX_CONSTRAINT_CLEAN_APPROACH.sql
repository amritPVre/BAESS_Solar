-- ============================================================================
-- FIX: Transaction Type Constraint - Clean Data Approach (OPTIONAL)
-- ============================================================================
-- This updates old transaction types to standard ones for consistency
-- Use this if you want cleaner, standardized data
-- ============================================================================

-- Step 1: Update old transaction types to standard ones
-- Map 'deduction' to 'credit_usage' (more descriptive)
UPDATE public.ai_credit_transactions
SET transaction_type = 'credit_usage'
WHERE transaction_type = 'deduction';

-- Map 'allocation' to 'bonus_credit' (assuming it was a credit allocation)
UPDATE public.ai_credit_transactions
SET transaction_type = 'bonus_credit'
WHERE transaction_type = 'allocation';

-- Step 2: Verify updates
SELECT 
  transaction_type,
  COUNT(*) as count
FROM public.ai_credit_transactions
GROUP BY transaction_type
ORDER BY count DESC;

-- Step 3: Drop old constraint
ALTER TABLE public.ai_credit_transactions
DROP CONSTRAINT IF EXISTS ai_credit_transactions_transaction_type_check;

-- Step 4: Add new constraint with only standard types
ALTER TABLE public.ai_credit_transactions
ADD CONSTRAINT ai_credit_transactions_transaction_type_check
CHECK (transaction_type IN (
  'subscription_upgrade',    -- For subscription upgrades ⭐
  'subscription_renewal',    -- For monthly renewals
  'subscription_downgrade',  -- For plan downgrades
  'credit_purchase',         -- For one-time purchases
  'credit_usage',            -- For using credits (was 'deduction')
  'credit_refund',           -- For refunds
  'admin_adjustment',        -- For manual changes
  'bonus_credit',            -- For promotional credits (was 'allocation')
  'referral_bonus',          -- For referral rewards
  'monthly_reset',           -- For monthly credit resets
  'ai_generation',           -- For AI usage
  'boq_generation',          -- For BOQ generation
  'report_generation'        -- For report generation
));

-- Step 5: Verify constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.ai_credit_transactions'::regclass
AND conname = 'ai_credit_transactions_transaction_type_check';

SELECT '✅ Transaction types cleaned and constraint applied!' AS status;

