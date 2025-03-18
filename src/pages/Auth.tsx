
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import AuthInfoPanel from "@/components/auth/AuthInfoPanel";

const Auth: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
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
      console.log("User is authenticated, redirecting to dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const clearError = () => setError(null);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-sky-50 to-white">
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
                <CardTitle className="text-2xl text-center">Solar PV Calculator</CardTitle>
                <CardDescription className="text-center">
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
