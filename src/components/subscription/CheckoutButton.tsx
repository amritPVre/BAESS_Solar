/**
 * Checkout Button Component
 * Initiates Dodo Payments checkout flow for subscription plans
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { subscriptionAPI } from '@/services/dodoPaymentService';
import { useToast } from '@/hooks/use-toast';

interface CheckoutButtonProps {
  planId: 'pro' | 'advanced' | 'enterprise';
  label?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
}

export const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  planId,
  label = 'Upgrade Now',
  className,
  variant = 'default',
  size = 'default',
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    setLoading(true);
    
    try {
      // Call API to create checkout session
      const { checkoutUrl } = await subscriptionAPI.initiateCheckout(planId);
      
      // Redirect to Dodo Payments checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      
      toast({
        title: 'Checkout Error',
        description: error instanceof Error ? error.message : 'Failed to initiate checkout. Please try again.',
        variant: 'destructive',
      });
      
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || loading}
      className={className}
      variant={variant}
      size={size}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        label
      )}
    </Button>
  );
};

export default CheckoutButton;

