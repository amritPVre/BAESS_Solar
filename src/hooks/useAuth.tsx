
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  avatarUrl?: string;
  preferredCurrency: string;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider: Initializing auth state listener");
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event);
        setLoading(true);
        setSession(currentSession);

        if (currentSession) {
          console.log("User session detected:", currentSession.user.id);
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();

          if (error) {
            console.error("Error fetching user profile:", error);
          } else if (profile) {
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
          }
        } else {
          console.log("No user session");
          setUser(null);
        }

        setLoading(false);
      }
    );

    // Get initial session
    const initializeAuth = async () => {
      console.log("Initializing auth state");
      setLoading(true);
      
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log("Initial session check:", currentSession ? "Session found" : "No session");
        
        if (currentSession) {
          setSession(currentSession);
          
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();

          if (error) {
            console.error("Error fetching user profile:", error);
          } else if (profile) {
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
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log("Login attempt for:", email);
    setLoading(true);
    
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Login error:", error.message);
        throw error;
      }
      
      console.log("Login successful:", data);
      // No need to return data here, as we're using void return type
    } catch (error: any) {
      console.error("Login failed:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const register = async (name: string, email: string, password: string) => {
    console.log("Registration attempt for:", email);
    setLoading(true);
    
    try {
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
        console.error("Registration error:", error.message);
        throw error;
      }
      
      console.log("Registration successful:", data);
      // No need to return data here, as we're using void return type
    } catch (error: any) {
      console.error("Registration failed:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = async () => {
    console.log("Logout attempt");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        throw error;
      }
      console.log("Logout successful");
      toast.info("You have been logged out");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Error logging out");
    }
  };
  
  const updateProfile = async (userData: Partial<UserProfile>) => {
    if (!user || !session) {
      throw new Error("No authenticated user");
    }
    
    console.log("Updating profile for user:", user.id);
    setLoading(true);
    
    try {
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          company: userData.company,
          phone: userData.phone,
          preferred_currency: userData.preferredCurrency,
        })
        .eq('id', user.id);
        
      if (error) {
        console.error("Profile update error:", error);
        throw error;
      }
      
      // Update local user state
      setUser({
        ...user,
        ...userData,
      });
      
      console.log("Profile updated successfully");
    } catch (error: any) {
      console.error("Failed to update profile:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const contextValue: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user && !!session,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
};
