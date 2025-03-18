
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, loading, user, session } = useAuth();
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  
  useEffect(() => {
    console.log("AuthGuard: checking auth status:", { 
      isAuthenticated, 
      loading, 
      userId: user?.id, 
      sessionActive: !!session 
    });
    
    // Only take action when loading is complete
    if (!loading) {
      setAuthChecked(true);
      
      if (!isAuthenticated) {
        console.log("User is not authenticated, redirecting to auth page");
        navigate("/auth", { replace: true });
      }
    }
  }, [isAuthenticated, loading, navigate, user, session]);

  // Show loading while checking auth status
  if (loading || !authChecked) {
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
