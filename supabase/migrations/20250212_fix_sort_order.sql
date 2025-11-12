-- Migration: Fix Missing sort_order Column
-- Created: 2025-02-12
-- Description: Adds sort_order column if missing (fixes verification script error)

-- ============================================================================
-- FIX: Add sort_order column if it doesn't exist
-- ============================================================================

DO $$
BEGIN
  -- Check and add sort_order column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' 
    AND column_name = 'sort_order'
  ) THEN
    -- Add the column
    ALTER TABLE subscription_plans ADD COLUMN sort_order INTEGER DEFAULT 0;
    
    -- Set sort_order for existing plans
    UPDATE subscription_plans SET sort_order = 1 WHERE id = 'free';
    UPDATE subscription_plans SET sort_order = 2 WHERE id = 'pro';
    UPDATE subscription_plans SET sort_order = 3 WHERE id = 'advanced';
    UPDATE subscription_plans SET sort_order = 4 WHERE id = 'enterprise';
    
    RAISE NOTICE '✅ Successfully added sort_order column and set values';
    RAISE NOTICE '   - free: 1';
    RAISE NOTICE '   - pro: 2';
    RAISE NOTICE '   - advanced: 3';
    RAISE NOTICE '   - enterprise: 4';
  ELSE
    RAISE NOTICE '✅ sort_order column already exists';
    
    -- Verify values are set correctly
    UPDATE subscription_plans SET sort_order = 1 WHERE id = 'free' AND sort_order = 0;
    UPDATE subscription_plans SET sort_order = 2 WHERE id = 'pro' AND sort_order = 0;
    UPDATE subscription_plans SET sort_order = 3 WHERE id = 'advanced' AND sort_order = 0;
    UPDATE subscription_plans SET sort_order = 4 WHERE id = 'enterprise' AND sort_order = 0;
    
    RAISE NOTICE '✅ Verified sort_order values';
  END IF;
END $$;

-- Verify the fix worked
SELECT 
  '✅ Verification: sort_order column' AS status,
  COUNT(*) AS plans_with_sort_order
FROM subscription_plans
WHERE sort_order > 0;

-- Display current state
SELECT 
  id,
  display_name,
  sort_order,
  CONCAT('$', price_monthly, '/mo') AS price,
  CONCAT(ai_credits_monthly, ' credits') AS credits
FROM subscription_plans
ORDER BY sort_order;

