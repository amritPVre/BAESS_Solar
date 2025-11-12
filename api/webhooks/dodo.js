/**
 * Vercel Serverless Function: Dodo Payments Webhook Handler
 * This file is for VERCEL deployment
 * Path: /api/webhooks/dodo
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for admin operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Webhook received:', req.body);

    const signature = req.headers['x-dodo-signature'] || '';
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    // TODO: Verify webhook signature here
    // For now, we'll process the webhook (add signature verification in production)

    // Parse webhook payload
    const payload = req.body;
    const { type, data } = payload;
    const userId = data.metadata?.user_id;

    console.log('Webhook event:', type, 'for user:', userId);

    if (!userId) {
      console.error('User ID not found in webhook metadata');
      return res.status(400).json({ error: 'User ID missing' });
    }

    // Process webhook based on type
    if (type === 'subscription.active') {
      // Parse tier from product ID
      const productId = data.product_id;
      let tier = 'pro';
      
      if (productId === process.env.VITE_DODO_PRODUCT_ID_PRO) tier = 'pro';
      else if (productId === process.env.VITE_DODO_PRODUCT_ID_ADVANCED) tier = 'advanced';
      else if (productId === process.env.VITE_DODO_PRODUCT_ID_ENTERPRISE) tier = 'enterprise';

      console.log('Activating subscription:', tier, 'for user:', userId);

      // Update user subscription using database function
      const { data: result, error } = await supabase.rpc('update_subscription_tier', {
        p_user_id: userId,
        p_new_tier: tier,
        p_stripe_customer_id: data.customer_id,
        p_stripe_subscription_id: data.subscription_id,
      });

      if (error) {
        console.error('Error activating subscription:', error);
        throw error;
      }

      console.log('Subscription activated:', result);
    } else if (type === 'subscription.renewed') {
      // Handle subscription renewal - reset credits
      console.log('Processing subscription renewal for user:', userId);

      // Get user's current subscription info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_tier, ai_credits_monthly_limit')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('Error fetching user profile:', profileError);
        throw profileError;
      }

      // Reset credits to monthly limit
      const { error: resetError } = await supabase
        .from('profiles')
        .update({
          ai_credits_remaining: profile.ai_credits_monthly_limit,
          next_credit_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (resetError) {
        console.error('Error resetting credits:', resetError);
        throw resetError;
      }

      console.log('Credits reset for user:', userId, 'to:', profile.ai_credits_monthly_limit);
    } else if (type === 'subscription.on_hold' || type === 'subscription.failed') {
      // Handle subscription issues
      const status = type === 'subscription.on_hold' ? 'past_due' : 'canceled';
      
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating subscription status:', error);
        throw error;
      }

      console.log('Subscription status updated to:', status, 'for user:', userId);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message,
    });
  }
}

