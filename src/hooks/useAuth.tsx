
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { useUserProfile } from "./useUserProfile";
import { useSupabaseAuth } from "./useSupabaseAuth";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  avatarUrl?: string;
  preferredCurrency: string;
}

export interface AuthContextType {
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
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const { 
    session, 
    signIn, 
    signUp, 
    signOut, 
    authStateChange 
  } = useSupabaseAuth();
  
  const {
    user,
    fetchUserProfile,
    updateUserProfile,
  } = useUserProfile();

  // Update authentication state when user or session changes
  useEffect(() => {
    // User is authenticated if both user and session exist
    setIsAuthenticated(!!user && !!session);
  }, [user, session]);

  // Listen for auth state changes
  useEffect(() => {
    console.log("AuthProvider: Initializing auth state listener");
    let subscription: any = null;
    
    const setupAuthListener = async () => {
      console.log("Initializing auth state");
      setLoading(true);
      
      try {
        // Pass null and null as the arguments
        subscription = await authStateChange(null, null);
      } catch (error) {
        console.error("Error setting up auth listener:", error);
      } finally {
        setLoading(false);
      }
    };

    setupAuthListener();

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [authStateChange]);

  // Fetch user profile when session changes
  useEffect(() => {
    const fetchProfileForSession = async () => {
      if (session?.user?.id) {
        console.log("Fetching profile for user:", session.user.id);
        setLoading(true);
        try {
          await fetchUserProfile(session.user.id);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfileForSession();
  }, [session, fetchUserProfile]);

  const login = async (email: string, password: string) => {
    console.log("Login attempt for:", email);
    setLoading(true);
    
    try {
      const data = await signIn(email, password);
      
      console.log("Login successful:", data.user?.id);
      toast.success("Login successful!");
      
      // Immediately fetch and set user profile
      if (data.user) {
        await fetchUserProfile(data.user.id);
      }
    } catch (error: any) {
      console.error("Login failed:", error.message);
      toast.error(error.message || "Failed to log in");
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const register = async (
    name: string, 
    email: string, 
    password: string,
    referralCode?: string
  ) => {
    console.log("Registration attempt for:", email, referralCode ? `with referral code: ${referralCode}` : '');
    setLoading(true);
    
    try {
      await signUp(name, email, password, referralCode);
      console.log("Registration successful");
      toast.success("Registration successful! Please check your email to confirm your account.");
    } catch (error: any) {
      console.error("Registration failed:", error.message);
      toast.error(error.message || "Failed to register");
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = async () => {
    console.log("Logout attempt");
    try {
      await signOut();
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
      await updateUserProfile(user.id, userData);
      console.log("Profile updated successfully");
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Failed to update profile:", error.message);
      toast.error("Failed to update profile");
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const contextValue: AuthContextType = {
    user,
    session,
    isAuthenticated,
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
