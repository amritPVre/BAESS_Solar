/**
 * Subscription Manager Component
 * Displays current subscription info and provides upgrade/cancel options
 */

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Crown, Calendar, CreditCard, TrendingUp } from 'lucide-react';
import { subscriptionAPI } from '@/services/dodoPaymentService';
import { CheckoutButton } from './CheckoutButton';
import { useToast } from '@/hooks/use-toast';
import { getCreditBalance } from '@/services/aiCreditService';
import type { CreditBalance } from '@/services/aiCreditService';

export const SubscriptionManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<CreditBalance | null>(null);
  const [canceling, setCanceling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const balance = await getCreditBalance();
      setSubscription(balance);
    } catch (error) {
      console.error('Error loading subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCanceling(true);
    
    try {
      const result = await subscriptionAPI.cancelSubscription();
      
      toast({
        title: 'Subscription Canceled',
        description: result.message,
      });
      
      // Reload subscription info
      await loadSubscription();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      
      toast({
        title: 'Cancellation Error',
        description: error instanceof Error ? error.message : 'Failed to cancel subscription',
        variant: 'destructive',
      });
    } finally {
      setCanceling(false);
    }
  };

  const getTierDisplayName = (tier: string): string => {
    switch (tier) {
      case 'pro':
        return 'Professional';
      case 'advanced':
        return 'Advanced';
      case 'enterprise':
        return 'Enterprise';
      default:
        return 'Free';
    }
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'pro':
        return 'bg-blue-500';
      case 'advanced':
        return 'bg-purple-500';
      case 'enterprise':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="p-8">
        <p className="text-center text-gray-600">No subscription information available</p>
      </Card>
    );
  }

  const isFreeTier = subscription.subscriptionTier === 'free';

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${getTierColor(subscription.subscriptionTier)} flex items-center justify-center`}>
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {getTierDisplayName(subscription.subscriptionTier)} Plan
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Your current subscription tier
              </p>
            </div>
          </div>
          
          {!isFreeTier && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Active
            </Badge>
          )}
        </div>

        {/* Plan Details Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* AI Credits */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">AI Credits</p>
              <p className="text-xl font-bold text-gray-900">
                {subscription.remaining} / {subscription.monthlyLimit}
              </p>
              <p className="text-xs text-gray-500">per month</p>
            </div>
          </div>

          {/* Next Reset */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Next Reset</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(subscription.nextResetDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <p className="text-xs text-gray-500">
                {Math.ceil((new Date(subscription.nextResetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
              </p>
            </div>
          </div>

          {/* Usage */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Usage</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round(((subscription.monthlyLimit - subscription.remaining) / subscription.monthlyLimit) * 100)}%
              </p>
              <p className="text-xs text-gray-500">this month</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          {isFreeTier ? (
            <>
              <CheckoutButton
                planId="pro"
                label="Upgrade to Professional"
                className="bg-blue-600 hover:bg-blue-700"
              />
              <CheckoutButton
                planId="advanced"
                label="Upgrade to Advanced"
                className="bg-purple-600 hover:bg-purple-700"
              />
              <CheckoutButton
                planId="enterprise"
                label="Upgrade to Enterprise"
                className="bg-amber-600 hover:bg-amber-700"
              />
            </>
          ) : subscription.subscriptionTier === 'pro' ? (
            <>
              <CheckoutButton
                planId="advanced"
                label="Upgrade to Advanced"
                className="bg-purple-600 hover:bg-purple-700"
              />
              <CheckoutButton
                planId="enterprise"
                label="Upgrade to Enterprise"
                className="bg-amber-600 hover:bg-amber-700"
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={canceling}>
                    {canceling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Canceling...
                      </>
                    ) : (
                      'Cancel Subscription'
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your subscription will remain active until the end of your current billing period.
                      You'll continue to have access to all features until then.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelSubscription}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Cancel Subscription
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : subscription.subscriptionTier === 'advanced' ? (
            <>
              <CheckoutButton
                planId="enterprise"
                label="Upgrade to Enterprise"
                className="bg-amber-600 hover:bg-amber-700"
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={canceling}>
                    {canceling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Canceling...
                      </>
                    ) : (
                      'Cancel Subscription'
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your subscription will remain active until the end of your current billing period.
                      You'll continue to have access to all features until then.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelSubscription}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Cancel Subscription
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={canceling}>
                  {canceling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Canceling...
                    </>
                  ) : (
                    'Cancel Subscription'
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your subscription will remain active until the end of your current billing period.
                    You'll continue to have access to all features until then.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelSubscription}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Cancel Subscription
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </Card>

      {/* Information Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-gray-900 mb-2">💡 About AI Credits</h4>
        <p className="text-sm text-gray-700">
          AI credits are used for AI-powered features like BOQ generation, intelligent pricing, and
          AI-generated reports. Credits reset monthly on your subscription anniversary date.
        </p>
      </Card>
    </div>
  );
};

export default SubscriptionManager;

