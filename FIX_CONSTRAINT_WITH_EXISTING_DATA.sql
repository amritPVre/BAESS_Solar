-- ============================================================================
-- FIX: Transaction Type Constraint for Your Specific Data
-- ============================================================================
-- Your table has: 'deduction' and 'allocation'
-- We'll add these to the constraint
-- ============================================================================

-- Step 1: Drop the old constraint
ALTER TABLE public.ai_credit_transactions
DROP CONSTRAINT IF EXISTS ai_credit_transactions_transaction_type_check;

-- Step 2: Add new constraint that includes your existing types + new ones
ALTER TABLE public.ai_credit_transactions
ADD CONSTRAINT ai_credit_transactions_transaction_type_check
CHECK (transaction_type IN (
  -- Your existing types (currently in the table)
  'deduction',               -- Your existing type (12 rows)
  'allocation',              -- Your existing type (1 row)
  
  -- New types for Dodo Payments webhook
  'subscription_upgrade',    -- For subscription upgrades ⭐
  'subscription_renewal',    -- For monthly renewals
  'subscription_downgrade',  -- For plan downgrades
  
  -- Standard credit operations
  'credit_purchase',         -- For one-time purchases
  'credit_usage',            -- For using credits
  'credit_refund',           -- For refunds
  
  -- Admin and bonuses
  'admin_adjustment',        -- For manual changes
  'bonus_credit',            -- For promotional credits
  'referral_bonus',          -- For referral rewards
  
  -- Periodic operations
  'monthly_reset',           -- For monthly credit resets
  
  -- AI and generation
  'ai_generation',           -- For AI usage
  'boq_generation',          -- For BOQ generation
  'report_generation'        -- For report generation
));

-- Step 3: Verify the constraint was added
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.ai_credit_transactions'::regclass
AND conname = 'ai_credit_transactions_transaction_type_check';

-- Step 4: Verify all existing rows are valid
SELECT 
  transaction_type,
  COUNT(*) as count
FROM public.ai_credit_transactions
GROUP BY transaction_type
ORDER BY count DESC;

SELECT '✅ Constraint updated to include your existing transaction types!' AS status;

