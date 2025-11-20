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

    // Get Svix webhook headers
    const svixId = req.headers['webhook-id'];
    const svixTimestamp = req.headers['webhook-timestamp'];
    const svixSignature = req.headers['webhook-signature'];
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

    console.log('📝 Webhook Headers:', {
      svixId,
      svixTimestamp,
      svixSignature: svixSignature ? 'present' : 'missing',
      secretConfigured: !!webhookSecret
    });

    // Verify Svix signature if secret is configured
    if (webhookSecret && svixSignature && svixId && svixTimestamp) {
      try {
        // Svix signature format: v1,base64_signature
        const signatureParts = svixSignature.split(',');
        if (signatureParts.length !== 2 || signatureParts[0] !== 'v1') {
          console.error('❌ Invalid signature format');
          return res.status(401).json({ error: 'Invalid signature format' });
        }

        const signature = signatureParts[1];
        
        // Svix signs: webhook-id.webhook-timestamp.body
        const body = JSON.stringify(req.body);
        const signedContent = `${svixId}.${svixTimestamp}.${body}`;
        
        // Remove "whsec_" prefix from secret if present
        const secret = webhookSecret.replace('whsec_', '');
        
        // Calculate expected signature
        const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(signedContent)
          .digest('base64');

        if (signature !== expectedSignature) {
          console.error('❌ Invalid webhook signature');
          console.error('Expected:', expectedSignature);
          console.error('Received:', signature);
          return res.status(401).json({ error: 'Invalid signature' });
        }
        console.log('✅ Webhook signature verified (Svix)');
      } catch (error) {
        console.error('❌ Signature verification error:', error);
        return res.status(401).json({ error: 'Signature verification failed' });
      }
    } else {
      console.log('⚠️ Webhook signature verification skipped');
      console.log('   Secret:', !!webhookSecret);
      console.log('   Signature:', !!svixSignature);
      console.log('   ID:', !!svixId);
      console.log('   Timestamp:', !!svixTimestamp);
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

    // Extract event type (Dodo uses 'type' field)
    const eventType = event.type || event.event_type;
    console.log('📋 Event Type:', eventType);

    // Get user_id and plan_id from metadata
    const userId = event.data?.metadata?.user_id;
    const planId = event.data?.metadata?.plan_id;
    const customerEmail = event.data?.customer?.email;

    console.log('📊 Webhook Data:', {
      userId,
      planId,
      customerEmail,
      customerId: event.data?.customer?.customer_id,
      subscriptionId: event.data?.subscription_id
    });

    if (!userId) {
      console.error('❌ No user_id in webhook metadata');
      return res.status(400).json({ error: 'Missing user_id in metadata' });
    }

    console.log('👤 Processing webhook for user:', userId);

    // Handle different event types
    switch (eventType) {
      case 'subscription.active':
        console.log('🟢 Subscription activated');
        await supabase.rpc('update_subscription_tier', {
          p_user_id: userId,
          p_new_tier: planId || 'pro',
          p_dodo_customer_id: event.data.customer?.customer_id,
          p_dodo_subscription_id: event.data.subscription_id
        });
        break;

      case 'payment.succeeded':
        console.log('💰 Payment succeeded - activating subscription');
        const { data: rpcResult, error: rpcError } = await supabase.rpc('update_subscription_tier', {
          p_user_id: userId,
          p_new_tier: planId || 'pro',
          p_dodo_customer_id: event.data.customer?.customer_id,
          p_dodo_subscription_id: event.data.subscription_id
        });

        if (rpcError) {
          console.error('❌ RPC Error:', rpcError);
          throw rpcError;
        }
        console.log('✅ RPC Result:', rpcResult);
        break;

      case 'subscription.renewed':
        console.log('🔄 Subscription renewed - refreshing credits');
        await supabase.rpc('update_subscription_tier', {
          p_user_id: userId,
          p_new_tier: planId || 'pro',
          p_dodo_customer_id: event.data.customer?.customer_id,
          p_dodo_subscription_id: event.data.subscription_id
        });
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
