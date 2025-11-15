
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";

export const useSupabaseAuth = () => {
  const [session, setSession] = useState<Session | null>(null);

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw error;
    }
    
    setSession(data.session);
    return data;
  };

  const signUp = async (
    name: string, 
    email: string, 
    password: string,
    referralCode?: string,
    recaptchaToken?: string
  ) => {
    // Step 1: Create auth user
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          referral_code: referralCode || null,
          recaptcha_token: recaptchaToken || null,
        },
      },
    });
    
    if (error) {
      throw error;
    }
    
    // Step 2: If referral code provided, process the referral
    if (data.user && referralCode && referralCode.length === 5) {
      try {
        const { data: referralData, error: referralError } = await supabase
          .rpc('process_referral_reward', {
            p_referee_id: data.user.id,
            p_referral_code: referralCode.toUpperCase()
          });
        
        if (referralError) {
          console.error('Referral processing error:', referralError);
          // Don't throw - user is already created, just log the referral error
        } else if (referralData) {
          console.log('Referral processed successfully:', referralData);
        }
      } catch (refError) {
        console.error('Referral exception:', refError);
        // Don't throw - user is already created
      }
    }
    
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setSession(null);
  };

  const authStateChange = useCallback(async (event: string | null, currentSession: Session | null) => {
    if (currentSession) {
      setSession(currentSession);
    }

    if (!event && !currentSession) {
      // Initial session check
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      return data.session;
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (eventType, session) => {
        console.log("Auth state changed:", eventType, session?.user?.id);
        setSession(session);
        // Don't return the session here as it causes TypeScript error
      }
    );

    return subscription;
  }, []);

  return {
    session,
    signIn,
    signUp,
    signOut,
    authStateChange,
  };
};
