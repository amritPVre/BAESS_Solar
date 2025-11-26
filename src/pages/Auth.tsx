
import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Home } from "lucide-react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
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

  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={recaptchaSiteKey || ""}
      language="en"
      useRecaptchaNet={false}
      useEnterprise={false}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: "head",
      }}
    >
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50 relative overflow-hidden">
        {/* Futuristic Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
        </div>

        {/* Back to Home Button - Fixed Position */}
        <Link to="/" className="fixed top-6 left-6 z-50">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 bg-white/90 backdrop-blur-md hover:bg-white border border-gray-200 hover:border-[#FFA500] text-gray-700 hover:text-[#FFA500] transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Home</span>
            <Home className="h-4 w-4 sm:hidden" />
          </Button>
        </Link>

        <div className="w-full max-w-6xl p-4 md:p-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <AuthInfoPanel />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl">
                <CardHeader className="space-y-4">
                  <div className="flex justify-center">
                    <img 
                      src="/BAESS_logo_v02.png" 
                      alt="BAESS Labs" 
                      className="h-14 w-auto" 
                      onError={(e) => e.currentTarget.style.display = 'none'} 
                    />
                  </div>
                  <CardDescription className="text-center text-sm text-gray-600">
                    Solar Intelligence Delivered
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                  
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-100/50 p-1">
                      <TabsTrigger 
                        value="login"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
                      >
                        Login
                      </TabsTrigger>
                      <TabsTrigger 
                        value="register"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
                      >
                        Register
                      </TabsTrigger>
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
    </GoogleReCaptchaProvider>
  );
};

export default Auth;
