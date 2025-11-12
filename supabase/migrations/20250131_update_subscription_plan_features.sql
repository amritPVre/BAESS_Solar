-- Migration: Update Subscription Plan Features
-- Created: 2025-01-31
-- Description: Updates subscription plan features to match the new package details

-- Update subscription plans with new features
UPDATE subscription_plans SET
  features = '["9 AI Credits/month", "Unlimited Energy Simulation", "Access to Utility Apps - Limited", "AI BOQ Generation - Limited", "Community Support"]'::jsonb
WHERE id = 'free';

UPDATE subscription_plans SET
  name = 'Professional',
  display_name = 'Professional',
  features = '["180 AI Credits/month", "Unlimited Energy Simulation", "AI BOQ Generation", "Full Access to AI BOQ Generation", "Access to Utility Apps - 5x than Free", "Priority Support"]'::jsonb
WHERE id = 'pro';

UPDATE subscription_plans SET
  features = '["360 AI Credits/month", "Everything in Pro", "Full Access to Utility Apps", "Team Access (coming soon)", "API Access (coming soon)", "Dedicated Support"]'::jsonb
WHERE id = 'advanced';

UPDATE subscription_plans SET
  features = '["1,080 AI Credits/month", "Everything in Advanced", "Custom Integrations", "Team Training", "SLA Guarantee", "White-label Options"]'::jsonb
WHERE id = 'enterprise';

-- Update the updated_at timestamp
UPDATE subscription_plans SET
  updated_at = NOW()
WHERE id IN ('free', 'pro', 'advanced', 'enterprise');

