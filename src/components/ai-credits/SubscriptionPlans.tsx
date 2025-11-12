/**
 * Subscription Plans Display Component
 * Shows available subscription tiers with features and pricing
 */

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  Sparkles,
  Zap,
  TrendingUp,
  Crown,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getSubscriptionPlans,
  getCreditBalance,
  type SubscriptionPlan,
  type CreditBalance
} from '@/services/aiCreditService';
import { subscriptionAPI } from '@/services/dodoPaymentService';
import { cn } from '@/lib/utils';

interface SubscriptionPlansProps {
  onSelectPlan?: (planId: string) => void;
  showCurrentPlan?: boolean;
  className?: string;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  onSelectPlan,
  showCurrentPlan = true,
  className
}) => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentBalance, setCurrentBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPlansAndBalance();
  }, []);

  const loadPlansAndBalance = async () => {
    setLoading(true);
    try {
      const [plansData, balanceData] = await Promise.all([
        getSubscriptionPlans(),
        getCreditBalance()
      ]);
      setPlans(plansData);
      setCurrentBalance(balanceData);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const tierIcons = {
    free: <Sparkles className="h-6 w-6" />,
    pro: <Zap className="h-6 w-6" />,
    advanced: <TrendingUp className="h-6 w-6" />,
    enterprise: <Crown className="h-6 w-6" />
  };

  const tierGradients = {
    free: 'from-gray-500 to-gray-600',
    pro: 'from-blue-500 to-blue-600',
    advanced: 'from-purple-500 to-purple-600',
    enterprise: 'from-amber-500 to-amber-600'
  };

  const isCurrentPlan = (planId: string): boolean => {
    return currentBalance?.subscriptionTier === planId;
  };

  const isUpgrade = (planId: string): boolean => {
    if (!currentBalance) return false;
    const currentOrder = plans.find(p => p.id === currentBalance.subscriptionTier)?.sortOrder || 0;
    const targetOrder = plans.find(p => p.id === planId)?.sortOrder || 0;
    return targetOrder > currentOrder;
  };

  const handleSelectPlan = async (planId: string) => {
    console.log('🎯 Plan selected:', planId);

    // If custom handler provided, use it
    if (onSelectPlan) {
      console.log('Using custom onSelectPlan handler');
      onSelectPlan(planId);
      return;
    }

    // Otherwise, handle checkout internally
    if (planId === 'free') {
      toast.info('You are already on the free plan');
      return;
    }

    if (planId === 'enterprise') {
      toast.info('Please contact sales for Enterprise plan', {
        description: 'Email: team@baesslabs.com'
      });
      return;
    }

    // Handle pro and advanced plans
    if (planId === 'pro' || planId === 'advanced') {
      try {
        setCheckoutLoading(planId);
        console.log('🚀 Initiating checkout for:', planId);
        
        const { checkoutUrl } = await subscriptionAPI.initiateCheckout(planId as 'pro' | 'advanced');
        
        console.log('✅ Checkout URL received:', checkoutUrl);
        toast.success('Redirecting to checkout...', {
          description: `Upgrading to ${planId === 'pro' ? 'Professional' : 'Advanced'} plan`
        });
        
        // Redirect to Dodo checkout
        window.location.href = checkoutUrl;
      } catch (error: any) {
        console.error('❌ Checkout error:', error);
        toast.error('Failed to initiate checkout', {
          description: error.message || 'Please try again or contact support'
        });
        setCheckoutLoading(null);
      }
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">
          Choose Your Plan
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select the perfect plan for your solar design needs. All plans include full access to design tools, 
          with varying AI credit allowances.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const current = isCurrentPlan(plan.id);
          const upgrade = isUpgrade(plan.id);

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
                current && "ring-2 ring-blue-500 shadow-lg",
                plan.id === 'enterprise' && "lg:scale-105"
              )}
            >
              {/* Popular Badge */}
              {plan.id === 'pro' && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              )}

              {/* Best Value Badge */}
              {plan.id === 'advanced' && (
                <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  BEST VALUE
                </div>
              )}

              <div className="p-6 space-y-6">
                {/* Icon & Title */}
                <div className="space-y-4">
                  <div className={cn(
                    "w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center text-white",
                    tierGradients[plan.id as keyof typeof tierGradients] || tierGradients.free
                  )}>
                    {tierIcons[plan.id as keyof typeof tierIcons] || tierIcons.free}
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {plan.displayName}
                    </h3>
                    {plan.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {plan.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.priceMonthly}
                    </span>
                    <span className="text-gray-600">/ month</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-blue-600">
                      {plan.aiCreditsMonthly.toLocaleString()}
                    </span>
                    {' '}AI credits per month
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <div className="pt-4">
                  {current && showCurrentPlan ? (
                    <Button
                      disabled
                      className="w-full"
                      variant="outline"
                    >
                      Current Plan
                    </Button>
                ) : plan.id === 'free' ? (
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    className="w-full"
                    variant="outline"
                  >
                    Current Plan
                  </Button>
                  ) : (
                    <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={checkoutLoading === plan.id}
                      className={cn(
                        "w-full",
                        upgrade && "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      )}
                      variant={upgrade ? "default" : "outline"}
                    >
                    {checkoutLoading === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      upgrade ? 'Upgrade Now' : 'Select Plan'
                    )}
                    </Button>
                  )}
                </div>

                {/* Current Plan Indicator */}
                {current && (
                  <Badge variant="outline" className="w-full justify-center bg-blue-50 text-blue-700 border-blue-200">
                    Your Current Plan
                  </Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="text-center text-sm text-gray-600 space-y-2 pt-4">
        <p>
          <strong>Note:</strong> Credits reset monthly on your subscription anniversary date.
        </p>
        <p>
          All plans include: Advanced solar design tools • Project management • Export capabilities • Cloud storage
        </p>
      </div>

      {/* FAQ Section */}
      <div className="mt-12 pt-8 border-t">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
          Frequently Asked Questions
        </h3>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">What are AI credits?</h4>
            <p className="text-sm text-gray-600">
              AI credits are used for AI-powered features like automated BOQ generation, 
              intelligent pricing, and AI-generated feasibility reports. 1 credit = 1 AI operation.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Do unused credits roll over?</h4>
            <p className="text-sm text-gray-600">
              No, credits reset monthly on your subscription date. We recommend upgrading 
              if you consistently use all your credits before the month ends.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Can I change plans anytime?</h4>
            <p className="text-sm text-gray-600">
              Yes! You can upgrade or downgrade at any time. When upgrading, you immediately 
              get the new tier's credit allocation.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">What happens if I run out of credits?</h4>
            <p className="text-sm text-gray-600">
              You can still use all design features. AI-powered features will be unavailable 
              until your next monthly reset or until you upgrade your plan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;

