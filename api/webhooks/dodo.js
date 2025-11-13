/**
 * Vercel Serverless Function: Dodo Payments Webhook Handler
 * Path: /api/webhooks/dodo
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Handle GET requests for webhook verification
  if (req.method === 'GET') {
    return res.status(200).json({ message: 'Webhook endpoint is active' });
  }

  // Only allow POST for actual webhook events
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔔 Webhook received:', {
      type: req.body.event_type,
      hasSignature: !!req.headers['webhook-signature'] || !!req.headers['x-dodo-signature']
    });

    // Try both possible signature header names
    const signature = req.headers['webhook-signature'] || req.headers['x-dodo-signature'];
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

    // Verify signature if secret is configured
    if (webhookSecret && signature) {
      const body = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('❌ Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
      console.log('✅ Webhook signature verified');
    } else {
      console.log('⚠️ Webhook signature verification skipped (secret not configured or signature missing)');
    }

    const event = req.body;
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get user_id and plan_id from metadata
    const userId = event.data?.metadata?.user_id;
    const planId = event.data?.metadata?.plan_id;

    if (!userId) {
      console.error('❌ No user_id in webhook metadata');
      return res.status(400).json({ error: 'Missing user_id in metadata' });
    }

    console.log('👤 Processing webhook for user:', userId);

    // Handle different event types
    switch (event.event_type) {
      case 'subscription.active':
        console.log('🟢 Subscription activated');
        await supabase.rpc('update_subscription_tier', {
          p_user_id: userId,
          p_new_tier: planId || 'pro',
          p_dodo_customer_id: event.data.customer_id,
          p_dodo_subscription_id: event.data.id
        });
        break;

      case 'subscription.renewed':
        console.log('🔄 Subscription renewed');
        // Optionally refresh credits or extend access
        break;

      case 'subscription.on_hold':
        console.log('⏸️ Subscription on hold');
        await supabase.rpc('update_subscription_tier', {
          p_user_id: userId,
          p_new_tier: 'free'
        });
        break;

      case 'subscription.failed':
      case 'subscription.cancelled':
        console.log('❌ Subscription failed/cancelled');
        await supabase.rpc('update_subscription_tier', {
          p_user_id: userId,
          p_new_tier: 'free'
        });
        break;

      case 'payment.succeeded':
        console.log('💰 Payment succeeded');
        // Log transaction if needed
        break;

      case 'payment.failed':
        console.log('💳 Payment failed');
        // Handle failed payment
        break;

      default:
        console.log('ℹ️ Unhandled event type:', event.event_type);
    }

    console.log('✅ Webhook processed successfully');
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({
      error: 'Webhook processing failed',
      details: error.message
    });
  }
}
