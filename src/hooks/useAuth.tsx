
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for user in localStorage on initial load
    const storedUser = localStorage.getItem("solar_app_user");
    
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        localStorage.removeItem("solar_app_user");
      }
    }
    
    setLoading(false);
  }, []);

  // In a real application, you would connect to a backend service
  // For simplicity, we'll use localStorage
  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would validate credentials with a server
      // For demo, let's use mock data from localStorage
      const usersJson = localStorage.getItem("solar_app_users") || "[]";
      const users = JSON.parse(usersJson);
      
      const foundUser = users.find((u: any) => u.email === email);
      
      if (!foundUser || foundUser.password !== password) {
        throw new Error("Invalid email or password");
      }
      
      const { password: _, ...userWithoutPassword } = foundUser;
      
      // Set the user in state and localStorage
      setUser(userWithoutPassword);
      localStorage.setItem("solar_app_user", JSON.stringify(userWithoutPassword));
      
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user already exists
      const usersJson = localStorage.getItem("solar_app_users") || "[]";
      const users = JSON.parse(usersJson);
      
      if (users.some((u: any) => u.email === email)) {
        throw new Error("Email already registered");
      }
      
      // Create new user
      const newUser = {
        id: `user_${Date.now()}`,
        name,
        email,
        password,
        createdAt: new Date().toISOString(),
      };
      
      // Save to "database"
      users.push(newUser);
      localStorage.setItem("solar_app_users", JSON.stringify(users));
      
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem("solar_app_user");
    toast.info("You have been logged out");
  };
  
  const updateProfile = async (userData: Partial<User>) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!user) {
        throw new Error("User not logged in");
      }
      
      // Update user in state
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Update user in localStorage
      localStorage.setItem("solar_app_user", JSON.stringify(updatedUser));
      
      // Update user in "database"
      const usersJson = localStorage.getItem("solar_app_users") || "[]";
      const users = JSON.parse(usersJson);
      
      const updatedUsers = users.map((u: any) => {
        if (u.id === user.id) {
          return { ...u, ...userData };
        }
        return u;
      });
      
      localStorage.setItem("solar_app_users", JSON.stringify(updatedUsers));
      
    } catch (error) {
      console.error("Update profile failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
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
