-- ============================================================================
-- FIX: Create/Update Subscription Tier RPC Function for Webhook
-- ============================================================================
-- This function is called by the Dodo Payments webhook to update user credits
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Drop old function if exists
DROP FUNCTION IF EXISTS public.update_subscription_tier(uuid, text, text, text);

-- Create the RPC function that the webhook calls
CREATE OR REPLACE FUNCTION public.update_subscription_tier(
  p_user_id UUID,
  p_new_tier TEXT,
  p_dodo_customer_id TEXT DEFAULT NULL,
  p_dodo_subscription_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits INTEGER;
  v_result JSONB;
BEGIN
  -- Determine credits based on tier
  CASE p_new_tier
    WHEN 'pro' THEN v_credits := 50;
    WHEN 'professional' THEN v_credits := 50;
    WHEN 'advanced' THEN v_credits := 200;
    WHEN 'enterprise' THEN v_credits := 500;
    ELSE v_credits := 9; -- free tier
  END CASE;

  -- Update user profile with new subscription
  UPDATE public.profiles
  SET 
    subscription_tier = p_new_tier,
    subscription_status = 'active',
    ai_credits_remaining = v_credits,
    ai_credits_monthly_limit = v_credits,
    subscription_start_date = COALESCE(subscription_start_date, NOW()),
    next_credit_reset_date = NOW() + INTERVAL '1 month',
    dodo_customer_id = COALESCE(p_dodo_customer_id, dodo_customer_id),
    dodo_subscription_id = COALESCE(p_dodo_subscription_id, dodo_subscription_id),
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Log the transaction
  INSERT INTO public.ai_credit_transactions (
    user_id,
    transaction_type,
    credit_change,
    old_balance,
    new_balance,
    description,
    created_at
  )
  SELECT 
    p_user_id,
    'subscription_upgrade',
    v_credits - COALESCE(ai_credits_remaining, 0),
    COALESCE(ai_credits_remaining, 0),
    v_credits,
    'Subscription upgraded to ' || p_new_tier || ' via Dodo Payments',
    NOW()
  FROM public.profiles
  WHERE id = p_user_id;

  -- Return success with details
  v_result := jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'new_tier', p_new_tier,
    'credits_added', v_credits,
    'message', 'Subscription updated successfully'
  );

  RAISE NOTICE 'Subscription updated: %', v_result;
  
  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error updating subscription for user %: %', p_user_id, SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'user_id', p_user_id
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_subscription_tier(UUID, TEXT, TEXT, TEXT) 
TO anon, authenticated, service_role;

-- Test the function (replace with actual user ID)
-- SELECT update_subscription_tier(
--   'your-user-id-here'::uuid,
--   'pro',
--   'cus_test123',
--   'sub_test123'
-- );

-- Verify function exists
SELECT 
  proname AS function_name,
  pg_get_function_arguments(oid) AS arguments
FROM pg_proc
WHERE proname = 'update_subscription_tier';

SELECT '✅ Webhook RPC function created successfully!' AS status;

