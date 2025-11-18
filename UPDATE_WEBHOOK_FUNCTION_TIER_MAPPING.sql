-- ============================================================================
-- UPDATE: Webhook Function to Handle Tier Name Variations
-- ============================================================================
-- This updates the function to map 'professional' → 'pro'
-- ============================================================================

DROP FUNCTION IF EXISTS public.update_subscription_tier(uuid, text, text, text);

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
  v_normalized_tier TEXT;
  v_result JSONB;
BEGIN
  -- Normalize tier names (handle variations from Dodo Payments)
  v_normalized_tier := CASE p_new_tier
    WHEN 'professional' THEN 'pro'
    WHEN 'pro' THEN 'pro'
    WHEN 'advanced' THEN 'advanced'
    WHEN 'enterprise' THEN 'enterprise'
    WHEN 'free' THEN 'free'
    ELSE 'pro' -- Default to pro if unknown
  END;

  -- Determine credits based on normalized tier
  CASE v_normalized_tier
    WHEN 'pro' THEN v_credits := 50;
    WHEN 'advanced' THEN v_credits := 200;
    WHEN 'enterprise' THEN v_credits := 500;
    ELSE v_credits := 9; -- free tier
  END CASE;

  -- Update user profile with new subscription
  UPDATE public.profiles
  SET 
    subscription_tier = v_normalized_tier,
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
    'Subscription upgraded to ' || v_normalized_tier || ' via Dodo Payments',
    NOW()
  FROM public.profiles
  WHERE id = p_user_id;

  -- Return success with details
  v_result := jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'requested_tier', p_new_tier,
    'normalized_tier', v_normalized_tier,
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
      'user_id', p_user_id,
      'requested_tier', p_new_tier
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_subscription_tier(UUID, TEXT, TEXT, TEXT) 
TO anon, authenticated, service_role;

-- Verify function was updated
SELECT 
  proname AS function_name,
  pg_get_function_arguments(oid) AS arguments
FROM pg_proc
WHERE proname = 'update_subscription_tier';

SELECT '✅ Webhook function updated with tier name mapping!' AS status;

