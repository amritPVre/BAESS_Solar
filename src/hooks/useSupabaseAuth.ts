
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

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

  const signUp = async (name: string, email: string, password: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });
    
    if (error) {
      throw error;
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
      async (eventType, session) => {
        setSession(session);
        return session;
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
