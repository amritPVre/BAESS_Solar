/**
 * API Route: Cancel Subscription
 * POST /api/subscription/cancel
 * 
 * Cancels the user's active subscription
 * Note: Subscription remains active until the end of the billing period
 */

import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: Request) {
  // Only allow POST requests
  if (req.method !== 'POST') {
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

    // Get user's current subscription
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has an active subscription
    if (profile.subscription_tier === 'free') {
      return new Response(
        JSON.stringify({ error: 'No active subscription to cancel' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.stripe_subscription_id) {
      return new Response(
        JSON.stringify({ error: 'Subscription ID not found' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Call Dodo Payments API to cancel subscription
    // For now, we'll mark it as canceled in our database
    // The actual cancellation should be done via Dodo's API or dashboard

    // Update subscription status to 'canceled'
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    // Log the cancellation
    await supabase.from('ai_credit_transactions').insert({
      user_id: user.id,
      transaction_type: 'other',
      credits_amount: 0,
      credits_before: 0,
      credits_after: 0,
      operation_type: 'other',
      description: `Subscription ${profile.subscription_tier} canceled`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription canceled successfully. Access will continue until the end of your billing period.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error canceling subscription:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to cancel subscription',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Vite/React Router compatible export
export const POST = handler;

