/**
 * Dodo Payments Integration Service
 * Handles all interactions with Dodo Payments API
 */

import DodoPayments from 'dodopayments';

// Initialize Dodo Payments client
// Note: API key should be loaded from environment variable in backend only
let dodoClient: DodoPayments | null = null;

/**
 * Initialize Dodo Payments client (Server-side only)
 * Call this in your API routes, never in frontend code
 */
export const initializeDodoClient = (): DodoPayments => {
  if (!dodoClient) {
    const apiKey = import.meta.env.VITE_DODO_API_KEY || process.env.DODO_PAYMENTS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Dodo Payments API key not configured');
    }

    dodoClient = new DodoPayments({
      bearerToken: apiKey,
    });
  }
  
  return dodoClient;
};

/**
 * Product IDs mapping for subscription plans
 */
export const DODO_PRODUCT_IDS = {
  pro: import.meta.env.VITE_DODO_PRODUCT_ID_PRO || 'prod_subscription_monthly_pro',
  advanced: import.meta.env.VITE_DODO_PRODUCT_ID_ADVANCED || 'prod_subscription_monthly_advanced',
  enterprise: import.meta.env.VITE_DODO_PRODUCT_ID_ENTERPRISE || 'prod_subscription_annual_enterprise',
} as const;

/**
 * Map our internal plan IDs to Dodo product IDs
 */
export const getPlanProductId = (planId: string): string | null => {
  switch (planId) {
    case 'pro':
      return DODO_PRODUCT_IDS.pro;
    case 'advanced':
      return DODO_PRODUCT_IDS.advanced;
    case 'enterprise':
      return DODO_PRODUCT_IDS.enterprise;
    default:
      return null;
  }
};

/**
 * Create a checkout session for subscription
 * This should be called from your backend API route
 */
export interface CreateCheckoutSessionParams {
  planId: 'pro' | 'advanced' | 'enterprise';
  userEmail: string;
  userName: string;
  userId: string;
  returnUrl?: string;
  trialDays?: number;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
}

export const createCheckoutSession = async (
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResult> => {
  const client = initializeDodoClient();
  
  const productId = getPlanProductId(params.planId);
  if (!productId) {
    throw new Error(`Invalid plan ID: ${params.planId}`);
  }

  try {
    const session = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      // Optional: configure trial period
      ...(params.trialDays && {
        subscription_data: {
          trial_period_days: params.trialDays,
        },
      }),
      customer: {
        email: params.userEmail,
        name: params.userName,
      },
      // Store user ID in metadata for webhook processing
      metadata: {
        user_id: params.userId,
        plan_id: params.planId,
      },
      return_url: params.returnUrl || `${window.location.origin}/subscription/success`,
    });

    return {
      sessionId: session.session_id,
      checkoutUrl: session.checkout_url,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
};

/**
 * Verify webhook signature
 * Use this in your webhook handler to ensure requests come from Dodo
 */
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  // Implement signature verification based on Dodo's webhook signature method
  // This is a placeholder - check Dodo's documentation for exact implementation
  try {
    // Dodo typically uses HMAC SHA256 for webhook signatures
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};

/**
 * Webhook event types from Dodo Payments
 */
export type DodoWebhookEvent = 
  | 'subscription.active'
  | 'subscription.on_hold'
  | 'subscription.failed'
  | 'subscription.renewed'
  | 'payment.succeeded'
  | 'payment.failed';

/**
 * Webhook payload structure
 */
export interface DodoWebhookPayload {
  business_id: string;
  timestamp: string;
  type: DodoWebhookEvent;
  data: {
    subscription_id?: string;
    customer_id?: string;
    product_id?: string;
    amount?: number;
    currency?: string;
    status?: string;
    metadata?: {
      user_id?: string;
      plan_id?: string;
    };
    [key: string]: any;
  };
}

/**
 * Parse Dodo tier from product ID
 */
export const parseTierFromProductId = (productId: string): 'pro' | 'advanced' | 'enterprise' | null => {
  if (productId === DODO_PRODUCT_IDS.pro) return 'pro';
  if (productId === DODO_PRODUCT_IDS.advanced) return 'advanced';
  if (productId === DODO_PRODUCT_IDS.enterprise) return 'enterprise';
  return null;
};

/**
 * Frontend API client for subscription operations
 * These functions call your backend API routes
 */
export class SubscriptionAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3001' : '')) {
    this.baseUrl = baseUrl;
  }

  /**
   * Initiate checkout for a subscription plan
   */
  async initiateCheckout(planId: 'pro' | 'advanced' | 'enterprise'): Promise<{ checkoutUrl: string }> {
    // Get auth token from Supabase
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${this.baseUrl}/api/checkout/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ planId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    return response.json();
  }

  /**
   * Get current subscription status
   */
  async getSubscriptionStatus(): Promise<{
    status: string;
    tier: string;
    nextBillingDate: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/subscription/status`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch subscription status');
    }

    return response.json();
  }

  /**
   * Cancel current subscription
   */
  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/subscription/cancel`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel subscription');
    }

    return response.json();
  }

  /**
   * Update subscription plan (upgrade/downgrade)
   */
  async updateSubscriptionPlan(newPlanId: 'pro' | 'advanced' | 'enterprise'): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await fetch(`${this.baseUrl}/subscription/update-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newPlanId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update subscription plan');
    }

    return response.json();
  }
}

// Export singleton instance for frontend use
export const subscriptionAPI = new SubscriptionAPIClient();

