/**
 * API Route: Dodo Payments Webhook Handler
 * POST /api/webhooks/dodo
 * 
 * Handles webhook events from Dodo Payments for subscription lifecycle
 */

import { supabase } from '@/integrations/supabase/client';
import {
  DodoWebhookPayload,
  verifyWebhookSignature,
  parseTierFromProductId,
} from '@/services/dodoPaymentService';

// Store processed webhook IDs to prevent duplicate processing
const processedWebhooks = new Set<string>();

export default async function handler(req: Request) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get webhook signature from headers
    const signature = req.headers.get('x-dodo-signature') || '';
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get raw body for signature verification
    const rawBody = await req.text();

    // Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse webhook payload
    const payload: DodoWebhookPayload = JSON.parse(rawBody);
    
    // Create unique webhook ID for idempotency
    const webhookId = `${payload.type}_${payload.timestamp}_${payload.data.subscription_id}`;
    
    // Check if webhook already processed (idempotency)
    if (processedWebhooks.has(webhookId)) {
      console.log('Webhook already processed:', webhookId);
      return new Response(
        JSON.stringify({ received: true, message: 'Already processed' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Process webhook based on event type
    await processWebhookEvent(payload);

    // Mark webhook as processed
    processedWebhooks.add(webhookId);

    // Clean up old processed webhooks (keep last 1000)
    if (processedWebhooks.size > 1000) {
      const iterator = processedWebhooks.values();
      processedWebhooks.delete(iterator.next().value);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Process webhook event based on type
 */
async function processWebhookEvent(payload: DodoWebhookPayload): Promise<void> {
  const { type, data } = payload;
  const userId = data.metadata?.user_id;

  if (!userId) {
    console.error('User ID not found in webhook metadata');
    return;
  }

  console.log(`Processing webhook: ${type} for user: ${userId}`);

  switch (type) {
    case 'subscription.active':
      await handleSubscriptionActive(userId, data);
      break;

    case 'subscription.renewed':
      await handleSubscriptionRenewed(userId, data);
      break;

    case 'subscription.on_hold':
      await handleSubscriptionOnHold(userId, data);
      break;

    case 'subscription.failed':
      await handleSubscriptionFailed(userId, data);
      break;

    case 'payment.succeeded':
      await handlePaymentSucceeded(userId, data);
      break;

    case 'payment.failed':
      await handlePaymentFailed(userId, data);
      break;

    default:
      console.log(`Unhandled webhook type: ${type}`);
  }
}

/**
 * Handle subscription.active event
 * Subscription successfully activated
 */
async function handleSubscriptionActive(
  userId: string,
  data: DodoWebhookPayload['data']
): Promise<void> {
  const tier = parseTierFromProductId(data.product_id || '');
  
  if (!tier) {
    console.error('Could not determine tier from product ID:', data.product_id);
    return;
  }

  // Update user subscription using database function
  const { error } = await supabase.rpc('update_subscription_tier', {
    p_user_id: userId,
    p_new_tier: tier,
    p_stripe_customer_id: data.customer_id,
    p_stripe_subscription_id: data.subscription_id,
  });

  if (error) {
    console.error('Error activating subscription:', error);
    throw error;
  }

  console.log(`Subscription activated: User ${userId} -> ${tier} tier`);
}

/**
 * Handle subscription.renewed event
 * Monthly subscription renewed successfully
 */
async function handleSubscriptionRenewed(
  userId: string,
  data: DodoWebhookPayload['data']
): Promise<void> {
  // Get user's current subscription info
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_tier, ai_credits_monthly_limit')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching user profile:', profileError);
    return;
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

  // Log credit reset transaction
  await supabase.from('ai_credit_transactions').insert({
    user_id: userId,
    transaction_type: 'monthly_reset',
    credits_amount: profile.ai_credits_monthly_limit,
    credits_before: 0,
    credits_after: profile.ai_credits_monthly_limit,
    operation_type: 'other',
    description: 'Monthly subscription renewed - credits reset',
  });

  console.log(`Subscription renewed: User ${userId} - Credits reset to ${profile.ai_credits_monthly_limit}`);
}

/**
 * Handle subscription.on_hold event
 * Payment failed, subscription on hold
 */
async function handleSubscriptionOnHold(
  userId: string,
  data: DodoWebhookPayload['data']
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }

  console.log(`Subscription on hold: User ${userId}`);
  
  // TODO: Send email notification to user about payment failure
}

/**
 * Handle subscription.failed event
 * Subscription creation or renewal completely failed
 */
async function handleSubscriptionFailed(
  userId: string,
  data: DodoWebhookPayload['data']
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }

  console.log(`Subscription failed: User ${userId}`);
  
  // TODO: Send email notification to user
}

/**
 * Handle payment.succeeded event
 * Payment processed successfully
 */
async function handlePaymentSucceeded(
  userId: string,
  data: DodoWebhookPayload['data']
): Promise<void> {
  console.log(`Payment succeeded: User ${userId}, Amount: ${data.amount} ${data.currency}`);
  
  // Log payment in transactions (optional)
  // You can add a payments table if you want to track all payments
}

/**
 * Handle payment.failed event
 * Payment attempt failed
 */
async function handlePaymentFailed(
  userId: string,
  data: DodoWebhookPayload['data']
): Promise<void> {
  console.log(`Payment failed: User ${userId}`);
  
  // TODO: Send email notification to user about payment failure
}

// Vite/React Router compatible export
export const POST = handler;

