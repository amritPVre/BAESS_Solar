/**
 * Vercel Serverless Function: Create Dodo Checkout Session
 * This file is for VERCEL deployment
 * Path: /api/checkout/create-session
 */

import { createClient } from '@supabase/supabase-js';
import DodoPayments from 'dodopayments';

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Initialize Dodo Payments
const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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
    const { planId } = req.body;

    // Validate plan ID
    if (!planId || !['pro', 'advanced', 'enterprise'].includes(planId)) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Get product ID from environment
    const productIdMap = {
      pro: process.env.VITE_DODO_PRODUCT_ID_PRO,
      advanced: process.env.VITE_DODO_PRODUCT_ID_ADVANCED,
      enterprise: process.env.VITE_DODO_PRODUCT_ID_ENTERPRISE,
    };

    const productId = productIdMap[planId];
    if (!productId) {
      return res.status(400).json({ error: 'Product ID not configured for ' + planId });
    }

    console.log('Creating checkout session:', {
      userId: user.id,
      planId,
      productId,
      email: profile.email
    });

    // Create checkout session with Dodo
    const session = await dodoClient.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      customer: {
        email: profile.email,
        name: profile.name || profile.email,
      },
      metadata: {
        user_id: user.id,
        plan_id: planId,
      },
      return_url: `${process.env.VITE_APP_URL || 'https://your-app.vercel.app'}/subscription/success`,
    });

    console.log('Checkout session created:', session.session_id);

    return res.status(200).json({
      success: true,
      sessionId: session.session_id,
      checkoutUrl: session.checkout_url,
    });

  } catch (error) {
    console.error('Checkout session creation error:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
}

