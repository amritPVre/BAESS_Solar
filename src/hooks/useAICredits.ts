/**
 * Custom Hook for AI Credit Management
 * Provides credit checking and deduction functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import {
  getCreditBalance,
  hasEnoughCredits,
  deductAICredits,
  formatCreditDisplay,
  type CreditBalance
} from '@/services/aiCreditService';

export interface UseAICreditsReturn {
  balance: CreditBalance | null;
  loading: boolean;
  refreshBalance: () => Promise<void>;
  checkAndDeduct: (
    projectId: string | null,
    operationType: 'boq_generation' | 'boq_pricing' | 'ai_report_generation',
    operationName?: string
  ) => Promise<boolean>;
  hasCredits: (required?: number) => Promise<boolean>;
  formatCredits: (credits: number, isSuperAdmin: boolean) => string;
}

/**
 * Hook for managing AI credits
 * 
 * @example
 * const { balance, checkAndDeduct, hasCredits } = useAICredits();
 * 
 * const handleGenerateBOQ = async () => {
 *   const canProceed = await checkAndDeduct(projectId, 'boq_generation', 'Generate BOQ');
 *   if (canProceed) {
 *     // Proceed with BOQ generation
 *   }
 * };
 */
export const useAICredits = (): UseAICreditsReturn => {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBalance = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCreditBalance();
      setBalance(data);
    } catch (error) {
      console.error('Error loading credit balance:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI credit balance',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load credit balance on mount only
  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  /**
   * Refresh credit balance manually
   */
  const refreshBalance = useCallback(async () => {
    await loadBalance();
  }, [loadBalance]);

  /**
   * Check if user has enough credits
   */
  const hasCredits = useCallback(async (required: number = 1): Promise<boolean> => {
    return await hasEnoughCredits(required);
  }, []);

  /**
   * Check credits and deduct if sufficient
   * Shows appropriate toasts for success/failure
   * Returns true if credits were deducted successfully, false otherwise
   */
  const checkAndDeduct = useCallback(async (
    projectId: string | null,
    operationType: 'boq_generation' | 'boq_pricing' | 'ai_report_generation',
    operationName: string = 'AI operation'
  ): Promise<boolean> => {
    try {
      // First check if user has enough credits
      const hasCreds = await hasEnoughCredits(1);
      
      if (!hasCreds) {
        const currentBalance = await getCreditBalance();
        
        if (currentBalance && !currentBalance.isSuperAdmin) {
          toast({
            title: 'Insufficient AI Credits',
            description: `You need 1 AI credit to ${operationName}. You have ${currentBalance.remaining} credits remaining. Please upgrade your plan or wait for monthly reset.`,
            variant: 'destructive',
            duration: 6000
          });
        }
        
        return false;
      }

      // Attempt to deduct credits
      const result = await deductAICredits(
        projectId,
        operationType,
        1,
        operationName
      );

      if (!result.success) {
        toast({
          title: 'Credit Deduction Failed',
          description: result.message,
          variant: 'destructive'
        });
        return false;
      }

      // Success - refresh balance
      await refreshBalance();

      // Show success toast (optional, can be disabled)
      if (!result.isSuperAdmin) {
        toast({
          title: 'AI Credit Used',
          description: `1 credit deducted for ${operationName}. ${result.creditsRemaining} credits remaining.`,
          duration: 3000
        });
      }

      return true;
    } catch (error) {
      console.error('Error in checkAndDeduct:', error);
      toast({
        title: 'Error',
        description: 'Failed to process AI credit transaction',
        variant: 'destructive'
      });
      return false;
    }
  }, [refreshBalance]);

  /**
   * Format credits for display
   */
  const formatCredits = useCallback((credits: number, isSuperAdmin: boolean): string => {
    return formatCreditDisplay(credits, isSuperAdmin);
  }, []);

  return {
    balance,
    loading,
    refreshBalance,
    checkAndDeduct,
    hasCredits,
    formatCredits
  };
};

/**
 * Hook for checking credits before an operation (without automatic deduction)
 * Useful for showing UI states before user commits to an action
 * 
 * @example
 * const { canAfford, checking } = useCanAffordAIOperation(1);
 * 
 * <Button disabled={!canAfford || checking}>
 *   Generate BOQ {!canAfford && '(Insufficient Credits)'}
 * </Button>
 */
export const useCanAffordAIOperation = (requiredCredits: number = 1) => {
  const [canAfford, setCanAfford] = useState<boolean>(true);
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    const checkAffordability = async () => {
      setChecking(true);
      const hasEnough = await hasEnoughCredits(requiredCredits);
      setCanAfford(hasEnough);
      setChecking(false);
    };

    checkAffordability();
  }, [requiredCredits]);

  return { canAfford, checking };
};

export default useAICredits;

