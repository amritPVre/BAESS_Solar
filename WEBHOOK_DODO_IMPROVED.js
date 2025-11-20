/**
 * IMPROVED Vercel Serverless Function: Dodo Payments Webhook Handler
 * Path: /api/webhooks/dodo
 * 
 * This improved version handles more event types and has better logging
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Handle GET requests for webhook verification
  if (req.method === 'GET') {
    return res.status(200).json({ 
      message: 'Webhook endpoint is active',
      timestamp: new Date().toISOString()
    });
  }

  // Only allow POST for actual webhook events
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Enhanced logging
    console.log('🔔 ========== WEBHOOK RECEIVED ==========');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    console.log('🔑 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('========================================');

    // Try both possible signature header names
    const signature = req.headers['webhook-signature'] || 
                     req.headers['x-dodo-signature'] ||
                     req.headers['dodo-signature'];
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
        console.error('Expected:', expectedSignature);
        console.error('Received:', signature);
        return res.status(401).json({ error: 'Invalid signature' });
      }
      console.log('✅ Webhook signature verified');
    } else {
      console.log('⚠️ Webhook signature verification skipped');
      console.log('   Secret configured:', !!webhookSecret);
      console.log('   Signature present:', !!signature);
    }

    const event = req.body;
    
    // Initialize Supabase client
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

    // Extract event type (Dodo might use different field names)
    const eventType = event.event_type || event.type || event.event;
    console.log('📋 Event Type:', eventType);

    // Extract user data from various possible locations
    const userId = event.data?.metadata?.user_id || 
                  event.metadata?.user_id ||
                  event.data?.user_id;
    
    const planId = event.data?.metadata?.plan_id || 
                  event.metadata?.plan_id ||
                  event.data?.plan_id ||
                  event.data?.product_id;

    const customerEmail = event.data?.customer_email || 
                         event.data?.email;

    const customerId = event.data?.customer_id;
    const subscriptionId = event.data?.id || event.data?.subscription_id;
    const paymentStatus = event.data?.payment_status || event.data?.status;

    console.log('📊 Extracted Data:', {
      userId,
      planId,
      customerEmail,
      customerId,
      subscriptionId,
      paymentStatus
    });

    // If no user_id but we have email, try to find the user
    let finalUserId = userId;
    if (!finalUserId && customerEmail) {
      console.log('🔍 No user_id found, searching by email:', customerEmail);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', customerEmail)
        .single();

      if (profile) {
        finalUserId = profile.id;
        console.log('✅ Found user by email:', finalUserId);
      } else {
        console.error('❌ Could not find user by email:', error);
      }
    }

    if (!finalUserId) {
      console.error('❌ No user_id found in webhook');
      console.error('   Checked: metadata.user_id, data.user_id, email lookup');
      return res.status(400).json({ 
        error: 'Missing user identification',
        hint: 'Ensure metadata.user_id is set when creating checkout session'
      });
    }

    console.log('👤 Processing webhook for user:', finalUserId);

    // Normalize plan_id to tier name
    let tierName = 'pro'; // default
    if (planId) {
      const lowerPlanId = planId.toLowerCase();
      if (lowerPlanId.includes('professional') || lowerPlanId.includes('pro')) {
        tierName = 'pro';
      } else if (lowerPlanId.includes('advanced')) {
        tierName = 'advanced';
      } else if (lowerPlanId.includes('enterprise')) {
        tierName = 'enterprise';
      } else if (lowerPlanId.includes('free')) {
        tierName = 'free';
      }
    }
    console.log('🎯 Determined tier:', tierName);

    // Handle different event types
    // These are the most common Dodo Payments event types
    const shouldUpdateCredits = [
      'subscription.active',
      'subscription.created',
      'subscription.updated',
      'payment.succeeded',
      'checkout.session.completed',
      'checkout.completed'
    ].includes(eventType);

    if (shouldUpdateCredits) {
      console.log('💳 Processing payment/subscription event');
      console.log('🔄 Calling update_subscription_tier RPC...');

      const { data: rpcResult, error: rpcError } = await supabase.rpc('update_subscription_tier', {
        p_user_id: finalUserId,
        p_new_tier: tierName,
        p_dodo_customer_id: customerId,
        p_dodo_subscription_id: subscriptionId
      });

      if (rpcError) {
        console.error('❌ RPC Error:', rpcError);
        throw rpcError;
      }

      console.log('✅ RPC Result:', rpcResult);
      console.log('🎉 Credits updated successfully!');

    } else if (eventType === 'subscription.on_hold' ||
               eventType === 'subscription.paused') {
      console.log('⏸️ Subscription paused/on hold');
      await supabase.rpc('update_subscription_tier', {
        p_user_id: finalUserId,
        p_new_tier: 'free'
      });

    } else if (eventType === 'subscription.cancelled' ||
               eventType === 'subscription.failed' ||
               eventType === 'subscription.expired') {
      console.log('❌ Subscription cancelled/failed/expired');
      await supabase.rpc('update_subscription_tier', {
        p_user_id: finalUserId,
        p_new_tier: 'free'
      });

    } else if (eventType === 'subscription.renewed') {
      console.log('🔄 Subscription renewed');
      // Refresh credits for the current tier
      await supabase.rpc('update_subscription_tier', {
        p_user_id: finalUserId,
        p_new_tier: tierName,
        p_dodo_customer_id: customerId,
        p_dodo_subscription_id: subscriptionId
      });

    } else {
      console.log('ℹ️ Unhandled event type:', eventType);
      console.log('   No action taken, but logged for analysis');
    }

    console.log('✅ ========== WEBHOOK PROCESSED ==========');
    res.status(200).json({ 
      received: true,
      event_type: eventType,
      user_id: finalUserId,
      processed: shouldUpdateCredits
    });

  } catch (error) {
    console.error('❌ ========== WEBHOOK ERROR ==========');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.error('=====================================');
    
    res.status(500).json({
      error: 'Webhook processing failed',
      details: error.message,
      hint: 'Check Vercel function logs for full details'
    });
  }
}

