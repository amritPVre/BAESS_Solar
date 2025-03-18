
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "./useAuth";

export const useUserProfile = () => {
  const [user, setUser] = useState<UserProfile | null>(null);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        setUser(null);
        return false;
      } 
      
      if (profile) {
        console.log("User profile loaded:", profile);
        setUser({
          id: profile.id,
          name: profile.name || '',
          email: profile.email || '',
          company: profile.company,
          phone: profile.phone,
          avatarUrl: profile.avatar_url,
          preferredCurrency: profile.preferred_currency || 'USD',
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      setUser(null);
      return false;
    }
  }, []);

  const updateUserProfile = async (userId: string, userData: Partial<UserProfile>) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        name: userData.name,
        company: userData.company,
        phone: userData.phone,
        preferred_currency: userData.preferredCurrency,
      })
      .eq('id', userId);
      
    if (error) {
      throw error;
    }
    
    // Update local user state
    if (user) {
      setUser({
        ...user,
        ...userData,
      });
    }
  };

  return {
    user,
    fetchUserProfile,
    updateUserProfile,
  };
};
