/**
 * AI Credit Management Service
 * Handles all AI credit operations including deduction, allocation, and balance checking
 */

import { supabase } from '@/integrations/supabase/client';

export interface CreditBalance {
  remaining: number;
  monthlyLimit: number;
  nextResetDate: string;
  subscriptionTier: 'free' | 'pro' | 'advanced' | 'enterprise';
  isSuperAdmin: boolean;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  projectId?: string;
  transactionType: 'deduction' | 'refund' | 'allocation' | 'monthly_reset' | 'admin_adjustment';
  creditsAmount: number;
  creditsBefore: number;
  creditsAfter: number;
  operationType?: 'boq_generation' | 'boq_pricing' | 'ai_report_generation' | 'other';
  description?: string;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  priceMonthly: number;
  aiCreditsMonthly: number;
  features: string[];
  sortOrder: number;
}

export interface CreditDeductionResult {
  success: boolean;
  creditsRemaining?: number;
  creditsDeducted?: number;
  creditsRequired?: number;
  isSuperAdmin?: boolean;
  message: string;
}

/**
 * Get current user's credit balance
 */
export const getCreditBalance = async (): Promise<CreditBalance | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('ai_credits_remaining, ai_credits_monthly_limit, next_credit_reset_date, subscription_tier, is_super_admin')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return {
      remaining: data.is_super_admin ? 999999 : data.ai_credits_remaining,
      monthlyLimit: data.ai_credits_monthly_limit,
      nextResetDate: data.next_credit_reset_date,
      subscriptionTier: data.subscription_tier,
      isSuperAdmin: data.is_super_admin
    };
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    return null;
  }
};

/**
 * Check if user has sufficient credits for an operation
 */
export const hasEnoughCredits = async (requiredCredits: number = 1): Promise<boolean> => {
  const balance = await getCreditBalance();
  if (!balance) return false;
  
  // Super admin always has enough credits
  if (balance.isSuperAdmin) return true;
  
  return balance.remaining >= requiredCredits;
};

/**
 * Deduct AI credits for an operation
 */
export const deductAICredits = async (
  projectId: string | null,
  operationType: 'boq_generation' | 'boq_pricing' | 'ai_report_generation',
  creditsToDeduct: number = 1,
  description?: string
): Promise<CreditDeductionResult> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        message: 'User not authenticated'
      };
    }

    // Call the database function to deduct credits
    const { data, error } = await supabase.rpc('deduct_ai_credits', {
      p_user_id: user.id,
      p_project_id: projectId,
      p_credits_to_deduct: creditsToDeduct,
      p_operation_type: operationType,
      p_description: description
    });

    if (error) throw error;

    return data as CreditDeductionResult;
  } catch (error) {
    console.error('Error deducting credits:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to deduct credits'
    };
  }
};

/**
 * Allocate credits to a user (Admin only)
 */
export const allocateCredits = async (
  targetUserId: string,
  creditsToAdd: number,
  description?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        message: 'User not authenticated'
      };
    }

    const { data, error } = await supabase.rpc('allocate_ai_credits', {
      p_user_id: targetUserId,
      p_credits_to_add: creditsToAdd,
      p_admin_id: user.id,
      p_description: description
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error allocating credits:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to allocate credits'
    };
  }
};

/**
 * Get user's credit transaction history
 */
export const getCreditTransactions = async (
  limit: number = 50,
  offset: number = 0
): Promise<CreditTransaction[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('ai_credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return data.map(row => ({
      id: row.id,
      userId: row.user_id,
      projectId: row.project_id || undefined,
      transactionType: row.transaction_type,
      creditsAmount: row.credits_amount,
      creditsBefore: row.credits_before,
      creditsAfter: row.credits_after,
      operationType: row.operation_type || undefined,
      description: row.description || undefined,
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('Error fetching credit transactions:', error);
    return [];
  }
};

/**
 * Get all subscription plans
 */
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    return data.map(plan => ({
      id: plan.id,
      name: plan.name,
      displayName: plan.display_name,
      description: plan.description || undefined,
      priceMonthly: parseFloat(plan.price_monthly),
      aiCreditsMonthly: plan.ai_credits_monthly,
      features: plan.features || [],
      sortOrder: plan.sort_order
    }));
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return [];
  }
};

/**
 * Update user's subscription tier
 */
export const updateSubscriptionTier = async (
  newTier: 'free' | 'pro' | 'advanced' | 'enterprise',
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        message: 'User not authenticated'
      };
    }

    const { data, error } = await supabase.rpc('update_subscription_tier', {
      p_user_id: user.id,
      p_new_tier: newTier,
      p_stripe_customer_id: stripeCustomerId,
      p_stripe_subscription_id: stripeSubscriptionId
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating subscription:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update subscription'
    };
  }
};

/**
 * Format credit display (shows 999999+ for super admin)
 */
export const formatCreditDisplay = (credits: number, isSuperAdmin: boolean): string => {
  if (isSuperAdmin) return '∞';
  return credits.toString();
};

/**
 * Get operation display name
 */
export const getOperationDisplayName = (operationType: string): string => {
  const displayNames: Record<string, string> = {
    'boq_generation': 'BOQ Generation',
    'boq_pricing': 'BOQ Pricing',
    'ai_report_generation': 'AI Report Generation',
    'other': 'Other'
  };
  return displayNames[operationType] || operationType;
};

/**
 * Calculate days until credit reset
 */
export const getDaysUntilReset = (nextResetDate: string): number => {
  const resetDate = new Date(nextResetDate);
  const now = new Date();
  const diffTime = resetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

/**
 * Get credit usage percentage
 */
export const getCreditUsagePercentage = (remaining: number, monthlyLimit: number): number => {
  if (monthlyLimit === 0) return 0;
  const used = monthlyLimit - remaining;
  return Math.round((used / monthlyLimit) * 100);
};

/**
 * Check if user needs to upgrade (running low on credits)
 */
export const shouldPromptUpgrade = (remaining: number, monthlyLimit: number): boolean => {
  if (monthlyLimit === 0) return false;
  const percentage = (remaining / monthlyLimit) * 100;
  return percentage <= 20; // Prompt when 20% or less remaining
};

