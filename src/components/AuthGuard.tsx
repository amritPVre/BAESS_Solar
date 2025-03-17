
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log("AuthGuard: isAuthenticated:", isAuthenticated, "loading:", loading);
    
    // Only redirect when we're sure the user is not authenticated (loading is complete)
    if (!loading && !isAuthenticated) {
      console.log("User is not authenticated, redirecting to auth page");
      navigate("/auth");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-solar mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Only render children when authenticated
  return isAuthenticated ? <>{children}</> : null;
};

export default AuthGuard;
