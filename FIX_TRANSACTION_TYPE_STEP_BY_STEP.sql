-- ============================================================================
-- FIX: Transaction Type Constraint - Step by Step Approach
-- ============================================================================
-- This handles existing rows that might have invalid transaction types
-- ============================================================================

-- STEP 1: Check what transaction types currently exist in the table
SELECT 
  transaction_type,
  COUNT(*) as row_count
FROM public.ai_credit_transactions
GROUP BY transaction_type
ORDER BY row_count DESC;

-- NOTE: Look at the output above! 
-- If you see any transaction types not in our list below, we need to either:
-- A) Update those rows to a valid type
-- B) Add those types to the constraint

-- STEP 2: Check the current constraint (if it exists)
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.ai_credit_transactions'::regclass
AND conname LIKE '%transaction_type%';

-- STEP 3: Update any invalid transaction types to valid ones
-- (Adjust this based on what you found in Step 1)

-- Example: If you have 'usage' change it to 'credit_usage'
UPDATE public.ai_credit_transactions
SET transaction_type = 'credit_usage'
WHERE transaction_type = 'usage';

-- Example: If you have 'purchase' change it to 'credit_purchase'
UPDATE public.ai_credit_transactions
SET transaction_type = 'credit_purchase'
WHERE transaction_type = 'purchase';

-- Example: If you have 'ai_boq' change it to 'boq_generation'
UPDATE public.ai_credit_transactions
SET transaction_type = 'boq_generation'
WHERE transaction_type = 'ai_boq';

-- Add more UPDATE statements based on Step 1 results

-- STEP 4: Drop the old constraint
ALTER TABLE public.ai_credit_transactions
DROP CONSTRAINT IF EXISTS ai_credit_transactions_transaction_type_check;

-- STEP 5: Add new constraint with all valid transaction types
ALTER TABLE public.ai_credit_transactions
ADD CONSTRAINT ai_credit_transactions_transaction_type_check
CHECK (transaction_type IN (
  'subscription_upgrade',    -- For subscription upgrades
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

-- STEP 6: Verify the constraint was added successfully
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.ai_credit_transactions'::regclass
AND conname = 'ai_credit_transactions_transaction_type_check';

-- STEP 7: Verify all rows now comply with the constraint
SELECT 
  transaction_type,
  COUNT(*) as row_count
FROM public.ai_credit_transactions
GROUP BY transaction_type
ORDER BY transaction_type;

SELECT '✅ Transaction type constraint fixed and verified!' AS status;

