-- Migration: Add AI Credit Management System
-- Created: 2025-01-29
-- Description: Adds subscription tiers, AI credit tracking, and transaction logging

-- Step 1: Add subscription and AI credit columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'advanced', 'enterprise')),
ADD COLUMN IF NOT EXISTS ai_credits_remaining INTEGER DEFAULT 9,
ADD COLUMN IF NOT EXISTS ai_credits_monthly_limit INTEGER DEFAULT 9,
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS next_credit_reset_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'paused'));

-- Step 2: Create subscription plans reference table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL,
  ai_credits_monthly INTEGER NOT NULL,
  features JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert subscription plans
INSERT INTO subscription_plans (id, name, display_name, description, price_monthly, ai_credits_monthly, features, sort_order) VALUES
('free', 'Free', 'Free Plan', 'Perfect for trying out the platform', 0.00, 9, '["9 AI credits per month", "Basic solar design tools", "Single project at a time", "Standard support"]', 1),
('pro', 'Pro', 'Professional', 'For individual professionals and small teams', 18.00, 180, '["180 AI credits per month", "Unlimited projects", "Advanced design tools", "AI BOQ generation", "Priority support", "Custom branding"]', 2),
('advanced', 'Advanced', 'Advanced', 'For growing businesses and consulting firms', 54.00, 360, '["360 AI credits per month", "Unlimited projects", "All Pro features", "Advanced financial analysis", "Multi-user collaboration", "API access", "Dedicated support"]', 3),
('enterprise', 'Enterprise', 'Enterprise', 'For large organizations and EPCs', 108.00, 1080, '["1080 AI credits per month", "Unlimited projects", "All Advanced features", "White-label options", "Custom integrations", "SLA guarantee", "24/7 dedicated support", "Training sessions"]', 4)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  ai_credits_monthly = EXCLUDED.ai_credits_monthly,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Step 3: Create AI credit transactions table for audit trail
CREATE TABLE IF NOT EXISTS ai_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES advanced_calculator_projects(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deduction', 'refund', 'allocation', 'monthly_reset', 'admin_adjustment')),
  credits_amount INTEGER NOT NULL,
  credits_before INTEGER NOT NULL,
  credits_after INTEGER NOT NULL,
  operation_type TEXT CHECK (operation_type IN ('boq_generation', 'boq_pricing', 'ai_report_generation', 'other')),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_credit_transactions_user_id ON ai_credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_credit_transactions_project_id ON ai_credit_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_credit_transactions_created_at ON ai_credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_next_credit_reset_date ON profiles(next_credit_reset_date);

-- Step 4: Create function to deduct AI credits
CREATE OR REPLACE FUNCTION deduct_ai_credits(
  p_user_id UUID,
  p_project_id UUID,
  p_credits_to_deduct INTEGER,
  p_operation_type TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_credits INTEGER;
  v_is_super_admin BOOLEAN;
  v_result JSONB;
BEGIN
  -- Get current credits and admin status
  SELECT ai_credits_remaining, is_super_admin
  INTO v_current_credits, v_is_super_admin
  FROM profiles
  WHERE id = p_user_id;

  -- Super admin has infinite credits
  IF v_is_super_admin THEN
    -- Log the transaction but don't deduct
    INSERT INTO ai_credit_transactions (
      user_id, project_id, transaction_type, credits_amount,
      credits_before, credits_after, operation_type, description
    ) VALUES (
      p_user_id, p_project_id, 'deduction', p_credits_to_deduct,
      999999, 999999, p_operation_type, COALESCE(p_description, 'Super Admin - Unlimited')
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'credits_remaining', 999999,
      'is_super_admin', true,
      'message', 'Super Admin has unlimited credits'
    );
  END IF;

  -- Check if user has enough credits
  IF v_current_credits < p_credits_to_deduct THEN
    RETURN jsonb_build_object(
      'success', false,
      'credits_remaining', v_current_credits,
      'credits_required', p_credits_to_deduct,
      'message', 'Insufficient AI credits'
    );
  END IF;

  -- Deduct credits
  UPDATE profiles
  SET ai_credits_remaining = ai_credits_remaining - p_credits_to_deduct
  WHERE id = p_user_id;

  -- Log the transaction
  INSERT INTO ai_credit_transactions (
    user_id, project_id, transaction_type, credits_amount,
    credits_before, credits_after, operation_type, description
  ) VALUES (
    p_user_id, p_project_id, 'deduction', p_credits_to_deduct,
    v_current_credits, v_current_credits - p_credits_to_deduct,
    p_operation_type, p_description
  );

  RETURN jsonb_build_object(
    'success', true,
    'credits_remaining', v_current_credits - p_credits_to_deduct,
    'credits_deducted', p_credits_to_deduct,
    'message', 'Credits deducted successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create function to allocate/add AI credits (for admin)
CREATE OR REPLACE FUNCTION allocate_ai_credits(
  p_user_id UUID,
  p_credits_to_add INTEGER,
  p_admin_id UUID,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_credits INTEGER;
  v_is_admin BOOLEAN;
BEGIN
  -- Verify admin status
  SELECT is_super_admin INTO v_is_admin
  FROM profiles
  WHERE id = p_admin_id;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Only super admins can allocate credits'
    );
  END IF;

  -- Get current credits
  SELECT ai_credits_remaining INTO v_current_credits
  FROM profiles
  WHERE id = p_user_id;

  -- Add credits
  UPDATE profiles
  SET ai_credits_remaining = ai_credits_remaining + p_credits_to_add
  WHERE id = p_user_id;

  -- Log the transaction
  INSERT INTO ai_credit_transactions (
    user_id, transaction_type, credits_amount,
    credits_before, credits_after, operation_type, description, created_by
  ) VALUES (
    p_user_id, 'allocation', p_credits_to_add,
    v_current_credits, v_current_credits + p_credits_to_add,
    'other', COALESCE(p_description, 'Admin allocation'), p_admin_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'credits_remaining', v_current_credits + p_credits_to_add,
    'credits_added', p_credits_to_add,
    'message', 'Credits allocated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create function to reset monthly credits
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS INTEGER AS $$
DECLARE
  v_reset_count INTEGER := 0;
  v_user RECORD;
BEGIN
  -- Find users whose reset date has passed
  FOR v_user IN
    SELECT id, ai_credits_monthly_limit, ai_credits_remaining, subscription_tier
    FROM profiles
    WHERE next_credit_reset_date <= NOW()
      AND is_super_admin = FALSE
      AND subscription_status = 'active'
  LOOP
    -- Reset credits to monthly limit
    UPDATE profiles
    SET 
      ai_credits_remaining = v_user.ai_credits_monthly_limit,
      next_credit_reset_date = next_credit_reset_date + INTERVAL '1 month'
    WHERE id = v_user.id;

    -- Log the reset
    INSERT INTO ai_credit_transactions (
      user_id, transaction_type, credits_amount,
      credits_before, credits_after, operation_type, description
    ) VALUES (
      v_user.id, 'monthly_reset', v_user.ai_credits_monthly_limit,
      v_user.ai_credits_remaining, v_user.ai_credits_monthly_limit,
      'other', 'Monthly credit reset for ' || v_user.subscription_tier || ' plan'
    );

    v_reset_count := v_reset_count + 1;
  END LOOP;

  RETURN v_reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create function to update subscription tier
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

  -- Get current credits
  SELECT ai_credits_remaining INTO v_current_credits
  FROM profiles
  WHERE id = p_user_id;

  -- Update subscription
  UPDATE profiles
  SET 
    subscription_tier = p_new_tier,
    ai_credits_monthly_limit = v_new_credits,
    ai_credits_remaining = v_new_credits,
    subscription_start_date = NOW(),
    next_credit_reset_date = NOW() + INTERVAL '1 month',
    stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
    stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id),
    subscription_status = 'active',
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Log the change
  INSERT INTO ai_credit_transactions (
    user_id, transaction_type, credits_amount,
    credits_before, credits_after, operation_type, description
  ) VALUES (
    p_user_id, 'allocation', v_new_credits,
    v_current_credits, v_new_credits,
    'other', 'Subscription upgraded to ' || p_new_tier
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_tier', p_new_tier,
    'credits_remaining', v_new_credits,
    'message', 'Subscription updated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Enable Row Level Security
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- RLS Policies for ai_credit_transactions
CREATE POLICY "Users can view their own transactions"
  ON ai_credit_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all transactions"
  ON ai_credit_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "System can insert transactions"
  ON ai_credit_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE ai_credit_transactions IS 'Tracks all AI credit usage, allocations, and adjustments';
COMMENT ON TABLE subscription_plans IS 'Defines available subscription tiers and their features';
COMMENT ON FUNCTION deduct_ai_credits IS 'Deducts AI credits for a user and logs the transaction';
COMMENT ON FUNCTION allocate_ai_credits IS 'Allows admins to allocate additional credits to users';
COMMENT ON FUNCTION reset_monthly_credits IS 'Resets credits for all users on their monthly reset date';
COMMENT ON FUNCTION update_subscription_tier IS 'Updates user subscription tier and resets credits';

