/**
 * API Route: Get Subscription Status
 * GET /api/subscription/status
 * 
 * Returns current user's subscription status and details
 */

import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: Request) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user's subscription details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        subscription_tier,
        subscription_status,
        ai_credits_remaining,
        ai_credits_monthly_limit,
        subscription_start_date,
        next_credit_reset_date,
        stripe_subscription_id
      `)
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        status: profile.subscription_status,
        tier: profile.subscription_tier,
        creditsRemaining: profile.ai_credits_remaining,
        creditsMonthly: profile.ai_credits_monthly_limit,
        subscriptionStartDate: profile.subscription_start_date,
        nextBillingDate: profile.next_credit_reset_date,
        subscriptionId: profile.stripe_subscription_id,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch subscription status',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Vite/React Router compatible export
export const GET = handler;

