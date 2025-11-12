/**
 * AI Credit Balance Display Component
 * Shows user's remaining AI credits with subscription tier info
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  AlertCircle,
  Crown,
  Zap
} from 'lucide-react';
import {
  formatCreditDisplay,
  getDaysUntilReset,
  getCreditUsagePercentage,
  shouldPromptUpgrade
} from '@/services/aiCreditService';
import { useAICredits } from '@/hooks/useAICredits';
import { cn } from '@/lib/utils';

interface AICreditBalanceProps {
  compact?: boolean;
  showUpgradePrompt?: boolean;
  onUpgradeClick?: () => void;
  className?: string;
}

export const AICreditBalance: React.FC<AICreditBalanceProps> = ({
  compact = false,
  showUpgradePrompt = true,
  onUpgradeClick,
  className
}) => {
  // Use the global AI credits hook - this will auto-update when credits change!
  const { balance, loading } = useAICredits();

  if (loading) {
    return (
      <Card className={cn("p-4 animate-pulse", className)}>
        <div className="h-20 bg-gray-200 rounded"></div>
      </Card>
    );
  }

  if (!balance) {
    return (
      <Card className={cn("p-4 border-red-200 bg-red-50", className)}>
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">Failed to load credit balance</span>
        </div>
      </Card>
    );
  }

  const usagePercentage = getCreditUsagePercentage(balance.remaining, balance.monthlyLimit);
  const daysUntilReset = getDaysUntilReset(balance.nextResetDate);
  const needsUpgrade = shouldPromptUpgrade(balance.remaining, balance.monthlyLimit);

  const tierColors = {
    free: 'bg-gray-100 text-gray-700 border-gray-300',
    pro: 'bg-blue-100 text-blue-700 border-blue-300',
    advanced: 'bg-purple-100 text-purple-700 border-purple-300',
    enterprise: 'bg-amber-100 text-amber-700 border-amber-300'
  };

  const tierIcons = {
    free: <Sparkles className="h-4 w-4" />,
    pro: <Zap className="h-4 w-4" />,
    advanced: <TrendingUp className="h-4 w-4" />,
    enterprise: <Crown className="h-4 w-4" />
  };

  // Compact view for header/navbar - Modern & Futuristic Design
  if (compact) {
    const getGradientStyle = () => {
      if (balance.isSuperAdmin) {
        return "bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 border-purple-300";
      }
      if (usagePercentage > 80) {
        return "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-300 animate-pulse";
      }
      if (usagePercentage > 60) {
        return "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-300";
      }
      return "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-300";
    };

    const getTextColor = () => {
      if (balance.isSuperAdmin) {
        return "bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 bg-clip-text text-transparent";
      }
      if (usagePercentage > 80) return "text-red-600";
      if (usagePercentage > 60) return "text-yellow-600";
      return "text-blue-600";
    };

    return (
      <div className={cn("flex items-center gap-3", className)}>
        {/* Sleek Credit Display */}
        <div className={cn(
          "relative group flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all duration-300 cursor-default hover:shadow-lg",
          getGradientStyle()
        )}>
          {/* Icon with glow effect */}
          <div className="relative">
            <div className={cn(
              "absolute inset-0 rounded-full blur-md opacity-30",
              balance.isSuperAdmin ? "bg-gradient-to-r from-purple-500 to-pink-500" :
              usagePercentage > 80 ? "bg-red-500" :
              usagePercentage > 60 ? "bg-yellow-500" :
              "bg-blue-500"
            )} />
            <Sparkles className={cn(
              "h-4 w-4 relative z-10 transition-transform duration-300 group-hover:scale-110",
              balance.isSuperAdmin ? "text-purple-600" :
              usagePercentage > 80 ? "text-red-600" :
              usagePercentage > 60 ? "text-yellow-600" :
              "text-blue-600"
            )} />
            {usagePercentage > 80 && !balance.isSuperAdmin && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
            )}
          </div>

          {/* Credit Numbers - Clean & Bold */}
          <div className="flex items-baseline gap-1">
            <span className={cn(
              "text-lg font-bold tracking-tight transition-all leading-none",
              getTextColor()
            )}>
              {formatCreditDisplay(balance.remaining, balance.isSuperAdmin)}
            </span>
            {!balance.isSuperAdmin && (
              <>
                <span className="text-gray-400 font-medium text-sm leading-none">/</span>
                <span className="text-sm font-semibold text-gray-500 leading-none">
                  {balance.monthlyLimit}
                </span>
              </>
            )}
          </div>

          {/* Label */}
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider leading-none">
            AI Credits
          </span>

          {/* Hover tooltip - Enhanced */}
          <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 bottom-full mb-3 left-1/2 transform -translate-x-1/2 px-4 py-2.5 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-50">
            {balance.isSuperAdmin ? (
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-400" />
                <span>Super Admin - Unlimited Credits</span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-300">Usage:</span>
                  <span className="font-semibold">{usagePercentage.toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-300">Resets in:</span>
                  <span className="font-semibold">{daysUntilReset} days</span>
                </div>
                <div className="flex items-center gap-1 pt-1 border-t border-gray-700">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className="text-[10px] text-gray-400">
                    {new Date(balance.nextResetDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-[6px] border-transparent border-t-gray-900"></div>
          </div>
        </div>

        {/* Tier Badge - Compact */}
        <Badge 
          variant="outline" 
          className={cn(
            "text-[10px] font-semibold px-2 py-1.5 transition-all hover:scale-105 h-9",
            tierColors[balance.subscriptionTier]
          )}
        >
          <span className="flex items-center gap-1">
            {tierIcons[balance.subscriptionTier]}
            <span className="capitalize">{balance.subscriptionTier}</span>
          </span>
        </Badge>
      </div>
    );
  }

  // Full view for dashboard/settings
  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Credits</h3>
              <p className="text-sm text-gray-500">
                {balance.isSuperAdmin ? 'Unlimited Access' : 'Monthly Allowance'}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-sm", tierColors[balance.subscriptionTier])}>
            <span className="flex items-center gap-1.5">
              {tierIcons[balance.subscriptionTier]}
              <span className="capitalize font-semibold">{balance.subscriptionTier} Plan</span>
            </span>
          </Badge>
        </div>

        {/* Credits Display */}
        {balance.isSuperAdmin ? (
          <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
            <div className="flex items-center justify-center gap-2">
              <Crown className="h-6 w-6 text-amber-600" />
              <span className="text-2xl font-bold text-amber-700">Unlimited Credits</span>
              <Crown className="h-6 w-6 text-amber-600" />
            </div>
            <p className="text-center text-sm text-amber-600 mt-2">
              Super Admin Access - No Restrictions
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold text-gray-900">
                  {balance.remaining}
                </span>
                <span className="text-sm text-gray-500">
                  of {balance.monthlyLimit} credits
                </span>
              </div>
              <Progress 
                value={((balance.remaining / balance.monthlyLimit) * 100)} 
                className={cn(
                  "h-2",
                  balance.remaining === 0 ? "bg-red-100" :
                  needsUpgrade ? "bg-orange-100" : "bg-blue-100"
                )}
              />
            </div>

            {/* Usage Stats */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Used this month
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {balance.monthlyLimit - balance.remaining} ({usagePercentage}%)
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Resets in
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {daysUntilReset} {daysUntilReset === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>

            {/* Low Credits Warning */}
            {balance.remaining === 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-red-700">
                      No credits remaining
                    </p>
                    <p className="text-xs text-red-600">
                      Upgrade your plan or wait for monthly reset to continue using AI features.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upgrade Prompt */}
            {showUpgradePrompt && needsUpgrade && balance.remaining > 0 && balance.subscriptionTier !== 'enterprise' && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-orange-700">
                        Running low on credits
                      </p>
                      <p className="text-xs text-orange-600">
                        You're using {usagePercentage}% of your monthly allowance. Consider upgrading for more credits.
                      </p>
                    </div>
                    {onUpgradeClick && (
                      <Button 
                        size="sm" 
                        onClick={onUpgradeClick}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        View Upgrade Options
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Credit Usage Info */}
        <div className="pt-3 border-t">
          <p className="text-xs text-gray-500">
            <strong>1 credit</strong> = 1 AI operation (BOQ Generation, BOQ Pricing, or AI Report)
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AICreditBalance;

