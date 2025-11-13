/**
 * Vercel Serverless Function: Create Dodo Checkout Session
 * Path: /api/checkout/create-session
 */

import { createClient } from '@supabase/supabase-js';
import { DodoPayments } from 'dodopayments';

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
    console.log('📦 Checkout request received:', {
      planId: req.body.planId,
      hasAuthHeader: !!req.headers.authorization
    });

    const { planId } = req.body;
    
    // Validate planId
    if (!planId || !['pro', 'advanced', 'enterprise'].includes(planId)) {
      return res.status(400).json({
        error: 'Invalid planId. Must be: pro, advanced, or enterprise'
      });
    }

    // Get auth token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    // Authenticate user with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('✅ User authenticated:', user.email);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile error:', profileError);
      return res.status(404).json({ error: 'User profile not found' });
    }

    console.log('📋 User profile:', {
      userId: profile.id,
      email: profile.email,
      currentTier: profile.subscription_tier
    });

    // Get product ID from environment
    const productIdMap = {
      pro: process.env.VITE_DODO_PRODUCT_ID_PRO,
      advanced: process.env.VITE_DODO_PRODUCT_ID_ADVANCED,
      enterprise: process.env.VITE_DODO_PRODUCT_ID_ENTERPRISE,
    };

    const productId = productIdMap[planId];
    
    if (!productId) {
      console.error('❌ Missing product ID for plan:', planId);
      return res.status(500).json({ 
        error: `Product ID not configured for ${planId} plan. Check your environment variables.`
      });
    }

    console.log('💳 Creating checkout session:', {
      productId,
      planId,
      userEmail: profile.email
    });

    // Initialize Dodo Payments
    const dodoClient = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY
    });

    // Create checkout session
    const checkoutSession = await dodoClient.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      return_url: `${process.env.VITE_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      success_url: `${process.env.VITE_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_APP_URL}/account?cancelled=true`,
      customer: {
        email: profile.email,
        name: profile.name || profile.email,
      },
      metadata: {
        user_id: profile.id,
        plan_id: planId,
        current_tier: profile.subscription_tier,
      },
    });

    console.log('✅ Checkout session created:', checkoutSession.checkout_url);

    res.status(200).json({
      checkoutUrl: checkoutSession.checkout_url,
      sessionId: checkoutSession.id,
    });

  } catch (error) {
    console.error('❌ Checkout error:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      details: error.message
    });
  }
}
