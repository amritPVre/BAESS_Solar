-- ============================================================================
-- CHECK: All Constraints on ai_credit_transactions Table
-- ============================================================================
-- This helps identify ALL constraints that might cause issues
-- ============================================================================

-- 1. Check ALL constraints on the table
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.ai_credit_transactions'::regclass
ORDER BY contype, conname;

-- Constraint types:
-- c = check constraint
-- f = foreign key
-- p = primary key
-- u = unique

-- 2. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ai_credit_transactions'
ORDER BY ordinal_position;

-- 3. Check existing transaction types in the table
SELECT 
  transaction_type,
  COUNT(*) as count
FROM public.ai_credit_transactions
GROUP BY transaction_type
ORDER BY count DESC;

-- 4. Check sample records
SELECT 
  id,
  user_id,
  transaction_type,
  credits_amount,
  credits_before,
  credits_after,
  created_at
FROM public.ai_credit_transactions
ORDER BY created_at DESC
LIMIT 5;

SELECT '✅ Constraint check complete!' AS status;

