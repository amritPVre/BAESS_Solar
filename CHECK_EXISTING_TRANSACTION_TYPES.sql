-- ============================================================================
-- CHECK: What Transaction Types Currently Exist
-- ============================================================================
-- Run this FIRST to see what's currently in the table
-- ============================================================================

-- See all unique transaction types currently in use
SELECT 
  transaction_type,
  COUNT(*) as count,
  MIN(created_at) as first_used,
  MAX(created_at) as last_used
FROM public.ai_credit_transactions
GROUP BY transaction_type
ORDER BY count DESC;

-- This will show you what transaction types are currently in the table.
-- Copy the output and share it so we can create the right fix!

SELECT '✅ Check complete! Share the results above.' AS status;

