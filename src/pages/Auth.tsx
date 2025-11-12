
import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Home } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import AuthInfoPanel from "@/components/auth/AuthInfoPanel";

const Auth: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("login");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Auth page: checking auth status:", { 
      isAuthenticated, 
      loading, 
      userId: isAuthenticated ? "authenticated" : "not authenticated", 
      sessionActive: !!isAuthenticated 
    });
    
    // Only redirect when the auth state is fully determined (not loading)
    // and the user is authenticated
    if (isAuthenticated && !loading) {
      // Check if there's a redirect path from the location state
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      console.log("User is authenticated, redirecting to:", from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, location]);

  const clearError = () => setError(null);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-sky-50 to-white relative">
      {/* Back to Home Button - Fixed Position */}
      <Link to="/" className="fixed top-6 left-6 z-50">
        <Button 
          variant="outline" 
          className="flex items-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white border-2 border-[#FFA500]/20 hover:border-[#FFA500] text-[#0A2463] hover:text-[#FFA500] transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Home</span>
          <Home className="h-4 w-4 sm:hidden" />
        </Button>
      </Link>

      <div className="w-full max-w-5xl p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AuthInfoPanel />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-center mb-2">
                  <img src="/BAESS_logo_v02.png" alt="BAESS Labs" className="h-16 w-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                <CardDescription className="text-center text-xs mt-1">
                  Sign in to save your projects and view your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                  </div>
                )}
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="mt-6">
                    <LoginForm setError={setError} clearError={clearError} />
                  </TabsContent>
                  
                  <TabsContent value="register" className="mt-6">
                    <RegisterForm setError={setError} clearError={clearError} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
