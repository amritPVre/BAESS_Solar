// ============================================
// EXPRESS BACKEND SERVER FOR DODO PAYMENTS
// ============================================
// This server handles API routes for:
// - Checkout session creation
// - Webhook processing
// - Subscription management

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { DodoPayments } from 'dodopayments';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// Enable CORS for frontend (allow any localhost port for development)
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow any localhost origin for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // Allow production origin
    if (process.env.VITE_APP_URL && origin === process.env.VITE_APP_URL) {
      return callback(null, true);
    }
    
    // Reject other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Logging middleware (helpful for debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Dodo Payments API server is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      checkout: '/api/checkout/create-session',
      webhook: '/api/webhooks/dodo',
      subscriptionStatus: '/api/subscription/status',
      subscriptionCancel: '/api/subscription/cancel',
    }
  });
});

// ============================================
// API ROUTE HANDLERS
// ============================================

// Checkout session creation
app.post('/api/checkout/create-session', async (req, res) => {
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
        error: `Product ID not configured for ${planId} plan. Check your .env file.`
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
      success_url: `${process.env.VITE_APP_URL}/subscription/success`,
      cancel_url: `${process.env.VITE_APP_URL}/account`,
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
});

// Webhook handler
app.post('/api/webhooks/dodo', async (req, res) => {
  try {
    console.log('🔔 Webhook received:', {
      type: req.body.event_type,
      hasSignature: !!req.headers['x-dodo-signature']
    });

    const signature = req.headers['x-dodo-signature'];
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

    if (!signature) {
      console.error('❌ Missing webhook signature');
      return res.status(401).json({ error: 'Missing signature' });
    }

    if (!webhookSecret) {
      console.error('❌ Missing webhook secret in environment');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Verify webhook signature
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
});

// Subscription status
app.get('/api/subscription/status', async (req, res) => {
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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.status(200).json({
      subscription_tier: profile.subscription_tier,
      ai_credits: profile.ai_credits,
      dodo_customer_id: profile.dodo_customer_id,
      dodo_subscription_id: profile.dodo_subscription_id,
    });

  } catch (error) {
    console.error('❌ Status error:', error);
    res.status(500).json({
      error: 'Failed to fetch subscription status',
      details: error.message
    });
  }
});

// Subscription cancellation
app.post('/api/subscription/cancel', async (req, res) => {
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
});

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    availableRoutes: {
      health: 'GET /api/health',
      checkout: 'POST /api/checkout/create-session',
      webhook: 'POST /api/webhooks/dodo',
      subscriptionStatus: 'GET /api/subscription/status',
      subscriptionCancel: 'POST /api/subscription/cancel',
    }
  });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('\n');
  console.log('🚀 Dodo Payments API Server Started!');
  console.log('\n');
  console.log('📡 Server running on:', `http://localhost:${PORT}`);
  console.log('🔗 Webhook endpoint:', `http://localhost:${PORT}/api/webhooks/dodo`);
  console.log('💳 Checkout endpoint:', `http://localhost:${PORT}/api/checkout/create-session`);
  console.log('\n');
  console.log('✅ Ready to accept requests!');
  console.log('\n');
  console.log('💡 Tips:');
  console.log('   - Use ngrok to expose this server for webhooks');
  console.log('   - Run: ngrok http', PORT);
  console.log('   - Update Dodo webhook URL with your ngrok URL');
  console.log('\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});

