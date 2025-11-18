-- ============================================================================
-- FIX: Transaction Type Constraint - Permissive Approach
-- ============================================================================
-- This approach allows ALL common transaction types without changing existing data
-- ============================================================================

-- Step 1: Drop the old constraint (if it exists)
ALTER TABLE public.ai_credit_transactions
DROP CONSTRAINT IF EXISTS ai_credit_transactions_transaction_type_check;

-- Step 2: Add a more permissive constraint that includes many common variations
ALTER TABLE public.ai_credit_transactions
ADD CONSTRAINT ai_credit_transactions_transaction_type_check
CHECK (transaction_type IN (
  -- Subscription related
  'subscription_upgrade',
  'subscription_renewal',
  'subscription_downgrade',
  'subscription',
  'upgrade',
  
  -- Credit operations
  'credit_purchase',
  'credit_usage',
  'credit_refund',
  'purchase',
  'usage',
  'refund',
  
  -- Admin and adjustments
  'admin_adjustment',
  'adjustment',
  
  -- Bonuses and rewards
  'bonus_credit',
  'bonus',
  'referral_bonus',
  'referral',
  
  -- Periodic operations
  'monthly_reset',
  'reset',
  
  -- AI and generation
  'ai_generation',
  'ai_usage',
  'ai_boq',
  'boq_generation',
  'boq',
  'report_generation',
  'report',
  'generation',
  
  -- Other common types
  'initial',
  'signup_bonus',
  'free_tier',
  'manual'
));

-- Step 3: Verify the constraint was added
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.ai_credit_transactions'::regclass
AND conname = 'ai_credit_transactions_transaction_type_check';

-- Step 4: Check all existing types are now valid
SELECT 
  transaction_type,
  COUNT(*) as count
FROM public.ai_credit_transactions
GROUP BY transaction_type
ORDER BY transaction_type;

SELECT '✅ Permissive constraint applied - all existing types should work!' AS status;

