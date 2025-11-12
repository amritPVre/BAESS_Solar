-- ============================================================================
-- DODO PAYMENTS DATABASE VERIFICATION SCRIPT
-- ============================================================================
-- Run this script to verify your database is ready for Dodo Payments
-- This is a READ-ONLY verification script - it doesn't modify anything
-- ============================================================================

-- Display header
SELECT '
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║          DODO PAYMENTS DATABASE VERIFICATION                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
' AS "VERIFICATION REPORT";

-- ============================================================================
-- CHECK 1: Verify profiles table structure
-- ============================================================================

SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CHECK 1: Profiles Table Structure
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' AS "Check";

SELECT 
  CASE 
    WHEN COUNT(*) = 7 THEN '✅ PASS'
    ELSE '❌ FAIL - Missing ' || (7 - COUNT(*))::TEXT || ' required columns'
  END AS "Status",
  COUNT(*)::TEXT || ' / 7' AS "Columns Found",
  STRING_AGG(column_name, ', ') AS "Found Columns"
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN (
  'subscription_tier',
  'ai_credits_remaining',
  'ai_credits_monthly_limit',
  'subscription_status',
  'stripe_customer_id',
  'stripe_subscription_id',
  'next_credit_reset_date'
);

-- ============================================================================
-- CHECK 2: Verify subscription_plans table
-- ============================================================================

SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CHECK 2: Subscription Plans Table
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' AS "Check";

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') 
    THEN '✅ PASS - Table exists'
    ELSE '❌ FAIL - Table missing'
  END AS "Status";

-- ============================================================================
-- CHECK 3: Verify all 4 subscription plans exist
-- ============================================================================

SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CHECK 3: Subscription Plans Data
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' AS "Check";

SELECT 
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ PASS - All 4 plans exist'
    WHEN COUNT(*) = 3 THEN '⚠️ WARNING - Enterprise plan missing'
    ELSE '❌ FAIL - Only ' || COUNT(*)::TEXT || ' plans found'
  END AS "Status",
  COUNT(*)::TEXT || ' / 4' AS "Plans Found"
FROM subscription_plans
WHERE id IN ('free', 'pro', 'advanced', 'enterprise');

-- Display plan details
SELECT 
  '📋 Plan Details:' AS "Info",
  NULL AS id,
  NULL AS name,
  NULL AS price,
  NULL AS credits,
  NULL AS active
UNION ALL
SELECT 
  '',
  id::TEXT,
  display_name,
  CONCAT('$', price_monthly::TEXT, '/mo'),
  ai_credits_monthly::TEXT,
  CASE WHEN is_active THEN '✅' ELSE '❌' END
FROM subscription_plans
ORDER BY 
  CASE id
    WHEN 'free' THEN 1
    WHEN 'pro' THEN 2
    WHEN 'advanced' THEN 3
    WHEN 'enterprise' THEN 4
    ELSE 99
  END;

-- ============================================================================
-- CHECK 4: Verify Enterprise plan configuration
-- ============================================================================

SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CHECK 4: Enterprise Plan Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' AS "Check";

SELECT 
  CASE 
    WHEN price_monthly = 108.00 AND ai_credits_monthly = 1080 
    THEN '✅ PASS - Correct pricing'
    ELSE '❌ FAIL - Incorrect pricing'
  END AS "Status",
  CONCAT('$', price_monthly, '/mo') AS "Price",
  CONCAT(ai_credits_monthly, ' credits') AS "Credits",
  CASE WHEN is_active THEN '✅ Active' ELSE '❌ Inactive' END AS "Active"
FROM subscription_plans
WHERE id = 'enterprise';

-- ============================================================================
-- CHECK 5: Verify ai_credit_transactions table
-- ============================================================================

SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CHECK 5: AI Credit Transactions Table
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' AS "Check";

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_credit_transactions') 
    THEN '✅ PASS - Table exists'
    ELSE '❌ FAIL - Table missing'
  END AS "Status";

-- ============================================================================
-- CHECK 6: Verify database functions
-- ============================================================================

SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CHECK 6: Required Functions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' AS "Check";

SELECT 
  proname AS "Function Name",
  CASE 
    WHEN proname IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS "Status"
FROM pg_proc
WHERE proname IN ('update_subscription_tier', 'deduct_ai_credits', 'allocate_ai_credits')
ORDER BY proname;

-- ============================================================================
-- CHECK 7: Verify indexes for performance
-- ============================================================================

SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CHECK 7: Database Indexes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' AS "Check";

SELECT 
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ PASS - Key indexes exist'
    ELSE '⚠️ WARNING - Some indexes missing'
  END AS "Status",
  COUNT(*)::TEXT AS "Indexes Found"
FROM pg_indexes
WHERE tablename = 'profiles'
AND indexname IN (
  'idx_profiles_subscription_tier',
  'idx_profiles_next_credit_reset_date',
  'idx_ai_credit_transactions_user_id'
);

-- ============================================================================
-- CHECK 8: Sample user subscription check
-- ============================================================================

SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CHECK 8: Sample User Subscriptions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' AS "Check";

SELECT 
  subscription_tier AS "Tier",
  COUNT(*) AS "User Count",
  CONCAT(
    ROUND(COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM profiles) * 100, 1),
    '%'
  ) AS "Percentage"
FROM profiles
WHERE subscription_tier IS NOT NULL
GROUP BY subscription_tier
ORDER BY 
  CASE subscription_tier
    WHEN 'free' THEN 1
    WHEN 'pro' THEN 2
    WHEN 'advanced' THEN 3
    WHEN 'enterprise' THEN 4
  END;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FINAL SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' AS "Summary";

DO $$
DECLARE
  all_checks_passed BOOLEAN;
BEGIN
  -- Check if all critical components exist
  SELECT 
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') AND
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') AND
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_credit_transactions') AND
    EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_subscription_tier') AND
    (SELECT COUNT(*) FROM subscription_plans WHERE id IN ('free', 'pro', 'advanced', 'enterprise')) = 4
  INTO all_checks_passed;

  IF all_checks_passed THEN
    RAISE NOTICE '';
    RAISE NOTICE '╔═══════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║                                                           ║';
    RAISE NOTICE '║          ✅ DATABASE READY FOR DODO PAYMENTS             ║';
    RAISE NOTICE '║                                                           ║';
    RAISE NOTICE '║  All required tables, functions, and data exist.         ║';
    RAISE NOTICE '║                                                           ║';
    RAISE NOTICE '║  Next Steps:                                             ║';
    RAISE NOTICE '║  1. Configure DODO_PAYMENTS_API_KEY in .env             ║';
    RAISE NOTICE '║  2. Create subscription products in Dodo Dashboard       ║';
    RAISE NOTICE '║  3. Configure webhook endpoint                           ║';
    RAISE NOTICE '║  4. Test checkout flow                                   ║';
    RAISE NOTICE '║                                                           ║';
    RAISE NOTICE '╚═══════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
  ELSE
    RAISE WARNING '';
    RAISE WARNING '╔═══════════════════════════════════════════════════════════╗';
    RAISE WARNING '║                                                           ║';
    RAISE WARNING '║          ⚠️  DATABASE SETUP INCOMPLETE                    ║';
    RAISE WARNING '║                                                           ║';
    RAISE WARNING '║  Some required components are missing.                    ║';
    RAISE WARNING '║  Please run: 20250129_add_ai_credit_system.sql          ║';
    RAISE WARNING '║  Then run: 20250212_dodo_payments_verification.sql      ║';
    RAISE WARNING '║                                                           ║';
    RAISE WARNING '╚═══════════════════════════════════════════════════════════╝';
    RAISE WARNING '';
  END IF;
END $$;

-- ============================================================================
-- END OF VERIFICATION SCRIPT
-- ============================================================================

