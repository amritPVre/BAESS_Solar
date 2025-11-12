import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your subscription...');

  useEffect(() => {
    verifyAndUpdateSubscription();
  }, []);

  const verifyAndUpdateSubscription = async () => {
    try {
      // Get the payment session ID from URL params (if Dodo provides it)
      const sessionId = searchParams.get('session_id') || searchParams.get('payment_id');
      
      console.log('🎉 Payment success page loaded');
      console.log('Session ID:', sessionId);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        setStatus('error');
        setMessage('Authentication failed. Please log in again.');
        return;
      }

      console.log('✅ User authenticated:', user.email);

      // Get current profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        setStatus('error');
        setMessage('Could not load your profile. Please contact support.');
        return;
      }

      console.log('📋 Current profile:', profile);

      // Check if subscription is already updated
      if (profile.subscription_tier !== 'free') {
        console.log('✅ Subscription already activated:', profile.subscription_tier);
        setStatus('success');
        setMessage(`Your ${profile.subscription_tier.toUpperCase()} subscription is now active!`);
        toast.success('Subscription activated successfully!');
        
        // Redirect to account page after 3 seconds
        setTimeout(() => {
          navigate('/account');
        }, 3000);
        return;
      }

      // If subscription not updated yet, wait a bit and try again
      console.log('⏳ Subscription not updated yet, checking again...');
      setMessage('Confirming your payment with our payment processor...');

      // Wait 5 seconds for webhook to process
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check again
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (updateError) {
        console.error('Update check error:', updateError);
        setStatus('error');
        setMessage('Could not verify payment. Please refresh the page or contact support.');
        return;
      }

      if (updatedProfile.subscription_tier !== 'free') {
        console.log('✅ Subscription activated:', updatedProfile.subscription_tier);
        setStatus('success');
        setMessage(`Your ${updatedProfile.subscription_tier.toUpperCase()} subscription is now active!`);
        toast.success('Subscription activated successfully!');
        
        // Redirect to account page after 3 seconds
        setTimeout(() => {
          navigate('/account');
        }, 3000);
      } else {
        // Still not updated - webhook might be slow or failed
        console.log('⚠️ Webhook has not processed yet');
        setStatus('success');
        setMessage('Payment received! Your subscription will be activated within a few minutes.');
        toast.info('Payment successful! Activating subscription...');
        
        // Redirect to account page after 5 seconds
        setTimeout(() => {
          navigate('/account');
        }, 5000);
      }

    } catch (error) {
      console.error('❌ Verification error:', error);
      setStatus('error');
      setMessage('An error occurred. Please contact support if your payment was charged.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        {status === 'loading' && (
          <>
            <div className="flex justify-center">
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Processing Payment</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500">
              Redirecting you to your account...
            </p>
            <Button 
              onClick={() => navigate('/account')}
              className="w-full"
            >
              Go to Account Now
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center">
              <div className="bg-red-100 rounded-full p-4">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Verification Failed</h1>
            <p className="text-gray-600">{message}</p>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => navigate('/account')}
                variant="outline"
                className="w-full"
              >
                Go to Account
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
