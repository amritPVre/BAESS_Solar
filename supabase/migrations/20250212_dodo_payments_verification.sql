-- Migration: Dodo Payments Integration Verification & Setup
-- Created: 2025-02-12
-- Description: Verifies database schema for Dodo Payments integration and updates Enterprise plan

-- ============================================================================
-- PART 1: VERIFICATION & FIX
-- ============================================================================

-- This migration verifies that all required tables and columns exist for
-- Dodo Payments subscription integration. If you've run the AI credit system
-- migration (20250129_add_ai_credit_system.sql), everything should already exist.

-- Check if profiles table has required subscription columns
DO $$
BEGIN
  -- Verify subscription columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'subscription_tier'
  ) THEN
    RAISE EXCEPTION 'Missing column: profiles.subscription_tier - Run migration 20250129_add_ai_credit_system.sql first';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'ai_credits_remaining'
  ) THEN
    RAISE EXCEPTION 'Missing column: profiles.ai_credits_remaining - Run migration 20250129_add_ai_credit_system.sql first';
  END IF;

  RAISE NOTICE 'Verification passed: All required columns exist in profiles table';
END $$;

-- Fix: Add sort_order column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' 
    AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN sort_order INTEGER DEFAULT 0;
    
    -- Set sort_order for existing plans
    UPDATE subscription_plans SET sort_order = 1 WHERE id = 'free';
    UPDATE subscription_plans SET sort_order = 2 WHERE id = 'pro';
    UPDATE subscription_plans SET sort_order = 3 WHERE id = 'advanced';
    UPDATE subscription_plans SET sort_order = 4 WHERE id = 'enterprise';
    
    RAISE NOTICE '✅ Added sort_order column to subscription_plans table';
  ELSE
    RAISE NOTICE '✅ sort_order column already exists';
  END IF;
END $$;

-- ============================================================================
-- PART 2: UPDATE ENTERPRISE PLAN (Dodo Payments Specific)
-- ============================================================================

-- Update Enterprise plan with complete feature set for Dodo Payments
-- This ensures the Enterprise plan has all the features displayed on your landing page

UPDATE subscription_plans
SET
  price_monthly = 108.00,
  ai_credits_monthly = 1080,
  features = jsonb_build_array(
    '1,080 AI Credits per month',
    'Everything in Advanced',
    'Custom Integrations',
    'Team Training',
    'SLA Guarantee',
    'White-label Options',
    'Priority Support',
    'API Access (coming soon)',
    'Team Access (coming soon)'
  ),
  description = 'For large organizations and EPCs',
  is_active = TRUE,
  updated_at = NOW()
WHERE id = 'enterprise';

-- If Enterprise plan doesn't exist, insert it
INSERT INTO subscription_plans (
  id, 
  name, 
  display_name, 
  description, 
  price_monthly, 
  ai_credits_monthly, 
  features, 
  sort_order,
  is_active
) VALUES (
  'enterprise',
  'Enterprise',
  'Enterprise',
  'For large organizations and EPCs',
  108.00,
  1080,
  jsonb_build_array(
    '1,080 AI Credits per month',
    'Everything in Advanced',
    'Custom Integrations',
    'Team Training',
    'SLA Guarantee',
    'White-label Options',
    'Priority Support',
    'API Access (coming soon)',
    'Team Access (coming soon)'
  ),
  4,
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 3: ADD DODO-SPECIFIC COLUMNS (Optional Enhancement)
-- ============================================================================

-- Add Dodo-specific columns to profiles if they don't exist
-- Note: stripe_* column names are kept for backward compatibility
-- They will store Dodo customer/subscription IDs

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS dodo_customer_id TEXT,
ADD COLUMN IF NOT EXISTS dodo_subscription_id TEXT;

-- Add index for faster Dodo ID lookups
CREATE INDEX IF NOT EXISTS idx_profiles_dodo_customer_id 
ON profiles(dodo_customer_id) 
WHERE dodo_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_dodo_subscription_id 
ON profiles(dodo_subscription_id) 
WHERE dodo_subscription_id IS NOT NULL;

-- ============================================================================
-- PART 4: UPDATE SUBSCRIPTION TIER FUNCTION FOR DODO
-- ============================================================================

-- Update the function to handle Dodo customer/subscription IDs
CREATE OR REPLACE FUNCTION update_subscription_tier(
  p_user_id UUID,
  p_new_tier TEXT,
  p_stripe_customer_id TEXT DEFAULT NULL,
  p_stripe_subscription_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_new_credits INTEGER;
  v_current_credits INTEGER;
BEGIN
  -- Get new tier credits
  SELECT ai_credits_monthly INTO v_new_credits
  FROM subscription_plans
  WHERE id = p_new_tier;

  IF v_new_credits IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid subscription tier: ' || p_new_tier
    );
  END IF;

  -- Get current credits
  SELECT ai_credits_remaining INTO v_current_credits
  FROM profiles
  WHERE id = p_user_id;

  -- Update subscription (handles both Stripe and Dodo IDs)
  UPDATE profiles
  SET 
    subscription_tier = p_new_tier,
    ai_credits_monthly_limit = v_new_credits,
    ai_credits_remaining = v_new_credits,
    subscription_start_date = NOW(),
    next_credit_reset_date = NOW() + INTERVAL '1 month',
    stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
    stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id),
    dodo_customer_id = COALESCE(p_stripe_customer_id, dodo_customer_id),
    dodo_subscription_id = COALESCE(p_stripe_subscription_id, dodo_subscription_id),
    subscription_status = 'active',
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Log the change
  INSERT INTO ai_credit_transactions (
    user_id, 
    transaction_type, 
    credits_amount,
    credits_before, 
    credits_after, 
    operation_type, 
    description
  ) VALUES (
    p_user_id, 
    'allocation', 
    v_new_credits,
    COALESCE(v_current_credits, 0), 
    v_new_credits,
    'other', 
    'Subscription upgraded to ' || p_new_tier || ' via Dodo Payments'
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_tier', p_new_tier,
    'credits_remaining', v_new_credits,
    'message', 'Subscription updated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 5: VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify everything is set up correctly

-- 1. Check all subscription plans exist
DO $$
DECLARE
  v_plan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_plan_count
  FROM subscription_plans
  WHERE id IN ('free', 'pro', 'advanced', 'enterprise');
  
  IF v_plan_count = 4 THEN
    RAISE NOTICE '✅ All 4 subscription plans exist';
  ELSE
    RAISE WARNING '⚠️ Only % subscription plans found, expected 4', v_plan_count;
  END IF;
END $$;

-- 2. Check Enterprise plan details
DO $$
DECLARE
  v_enterprise RECORD;
BEGIN
  SELECT * INTO v_enterprise
  FROM subscription_plans
  WHERE id = 'enterprise';
  
  IF FOUND THEN
    RAISE NOTICE '✅ Enterprise Plan:';
    RAISE NOTICE '   - Price: $%/month', v_enterprise.price_monthly;
    RAISE NOTICE '   - Credits: %', v_enterprise.ai_credits_monthly;
    RAISE NOTICE '   - Active: %', v_enterprise.is_active;
  ELSE
    RAISE WARNING '⚠️ Enterprise plan not found';
  END IF;
END $$;

-- 3. Check profiles table has required columns
DO $$
DECLARE
  v_columns TEXT[];
BEGIN
  SELECT ARRAY_AGG(column_name) INTO v_columns
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
  
  IF ARRAY_LENGTH(v_columns, 1) >= 7 THEN
    RAISE NOTICE '✅ All required subscription columns exist in profiles table';
  ELSE
    RAISE WARNING '⚠️ Missing columns in profiles table';
  END IF;
END $$;

-- 4. Check if update_subscription_tier function exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_subscription_tier'
  ) THEN
    RAISE NOTICE '✅ update_subscription_tier() function exists';
  ELSE
    RAISE WARNING '⚠️ update_subscription_tier() function not found';
  END IF;
END $$;

-- 5. Check if deduct_ai_credits function exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'deduct_ai_credits'
  ) THEN
    RAISE NOTICE '✅ deduct_ai_credits() function exists';
  ELSE
    RAISE WARNING '⚠️ deduct_ai_credits() function not found';
  END IF;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Display summary of subscription plans
SELECT 
  '📊 SUBSCRIPTION PLANS SUMMARY' as info,
  NULL as id,
  NULL as name,
  NULL as price,
  NULL as credits
UNION ALL
SELECT 
  '',
  id::TEXT,
  display_name,
  CONCAT('$', price_monthly::TEXT, '/mo'),
  CONCAT(ai_credits_monthly::TEXT, ' credits')
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
-- NOTES
-- ============================================================================

-- ✅ This migration is IDEMPOTENT - safe to run multiple times
-- ✅ All required tables and columns should already exist from the AI credit migration
-- ✅ Enterprise plan is now configured for Dodo Payments
-- ✅ Both stripe_* and dodo_* columns available (use either)
-- ✅ update_subscription_tier() function handles Dodo subscriptions

-- Next Steps:
-- 1. Run this migration: psql -f 20250212_dodo_payments_verification.sql
-- 2. Verify output shows all ✅ checks passing
-- 3. Configure Dodo Payments API keys in .env
-- 4. Create products in Dodo Dashboard
-- 5. Test checkout flow

-- Questions? See DODO_PAYMENTS_INTEGRATION_GUIDE.md

