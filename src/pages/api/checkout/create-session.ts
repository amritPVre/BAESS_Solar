/**
 * API Route: Create Dodo Payments Checkout Session
 * POST /api/checkout/create-session
 * 
 * Creates a checkout session for subscription purchase
 */

import { createCheckoutSession } from '@/services/dodoPaymentService';
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
    // Parse request body
    const { planId } = await req.json();

    // Validate plan ID
    if (!planId || !['pro', 'advanced', 'enterprise'].includes(planId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile for name and email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create checkout session with Dodo Payments
    const session = await createCheckoutSession({
      planId: planId as 'pro' | 'advanced' | 'enterprise',
      userEmail: profile.email,
      userName: profile.name || profile.email,
      userId: user.id,
      returnUrl: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/subscription/success`,
      // Optional: Add trial period (e.g., 14 days)
      // trialDays: 14,
    });

    // Return checkout URL to frontend
    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.sessionId,
        checkoutUrl: session.checkoutUrl,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Checkout session creation error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Vite/React Router compatible export
export const POST = handler;

