-- ============================================================================
-- CHECK: Full AI Credit Transactions Table Structure
-- ============================================================================

-- Get ALL columns and their properties
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ai_credit_transactions'
ORDER BY ordinal_position;

-- Check for NOT NULL constraints
SELECT 
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ai_credit_transactions'
AND is_nullable = 'NO'
ORDER BY column_name;

-- This will show us what columns are required (NOT NULL)

