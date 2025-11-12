/**
 * Vercel Serverless Function: Cancel Subscription
 * Path: /api/subscription/cancel
 */

import { createClient } from '@supabase/supabase-js';
import { DodoPayments } from 'dodopayments';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('dodo_subscription_id')
      .eq('id', user.id)
      .single();

    if (!profile?.dodo_subscription_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Cancel subscription in Dodo Payments
    const dodoClient = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY
    });

    await dodoClient.subscriptions.cancel(profile.dodo_subscription_id);

    console.log('✅ Subscription cancelled:', profile.dodo_subscription_id);

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully'
    });

  } catch (error) {
    console.error('❌ Cancellation error:', error);
    res.status(500).json({
      error: 'Failed to cancel subscription',
      details: error.message
    });
  }
}

