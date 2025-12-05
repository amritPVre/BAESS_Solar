
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useEffect } from "react";
import { initGA, trackPageView } from "@/utils/analytics";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProjectDetails from "./pages/ProjectDetails";
import SolarCalculator from "./components/SolarCalculator";
import BOQGenerator from "./pages/BOQGenerator";
import SolarComponentsPage from "./pages/SolarComponentsPage";
import AdminDashboard from "./pages/AdminDashboard";
import { AuthProvider } from "@/hooks/useAuth";
import { SolarProjectsProvider } from "@/hooks/useSolarProjects";
import AuthGuard from "./components/AuthGuard";
import SolarDesignerPage from "./pages/SolarDesignerPage";
import AdvancedSolarCalculatorPage from "./pages/AdvancedSolarCalculatorPage";
import { UserAccount } from "./pages/UserAccount";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import Integrations from "./pages/Integrations";
import Changelog from "./pages/Changelog";
import AboutUs from "./pages/AboutUs";
import Careers from "./pages/Careers";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogAdmin from "./pages/BlogAdmin";
import BlogPostEditor from "./pages/BlogPostEditor";
import Forum from "./pages/Forum";
import ForumTopic from "./pages/ForumTopic";
import ForumNewTopic from "./pages/ForumNewTopic";
import FAQ from "./pages/FAQ";
import ContactUs from "./pages/ContactUs";
import Documentation from "./pages/Documentation";
import BESSDesigner from "./pages/BESSDesigner";
import Products from "./pages/Products";
import ProductBESSDesigner from "./pages/ProductBESSDesigner";
import ProductPVDesigner from "./pages/ProductPVDesigner";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SolarAIChat from "./pages/SolarAIChat";

// ========== SANDBOX IMPORTS START ==========
import SandboxLayout from "./pages/sandbox/SandboxLayout";
import SandboxHome from "./pages/sandbox/SandboxHome";
// ========== SANDBOX IMPORTS END ==========

const queryClient = new QueryClient();

// Component to track page views on route changes
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view when route changes
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
};

const App = () => {
  // Initialize Google Analytics on mount
  useEffect(() => {
    initGA();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SolarProjectsProvider>
        <TooltipProvider>
          <Helmet titleTemplate="%s | BAESS Labs" defaultTitle="BAESS Labs - Solar Intelligence Delivered" />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnalyticsTracker />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              } />
              <Route path="/project/:projectId" element={
                <AuthGuard>
                  <ProjectDetails />
                </AuthGuard>
              } />
              <Route path="/solar-calculator" element={
                <AuthGuard>
                  <SolarDesignerPage />
                </AuthGuard>
              } />
              <Route path="/advanced-calculator" element={
                <AuthGuard>
                  <AdvancedSolarCalculatorPage />
                </AuthGuard>
              } />
              
              {/* BESS Designer Route */}
              <Route path="/bess-designer" element={
                <AuthGuard>
                  <BESSDesigner />
                </AuthGuard>
              } />
              
              {/* Solar AI Chat Route */}
              <Route path="/solar-ai-chat" element={
                <AuthGuard>
                  <SolarAIChat />
                </AuthGuard>
              } />
              
              {/* ========== SANDBOX ROUTES START ========== */}
              <Route path="/sandbox" element={
                <AuthGuard>
                  <SandboxLayout />
                </AuthGuard>
              }>
                <Route index element={<SandboxHome />} />
                {/* Add more sandbox app routes here */}
              </Route>
              {/* ========== SANDBOX ROUTES END ========== */}
              
              {/* For backward compatibility - maintain both routes */}
              <Route path="/calculator" element={
                <AuthGuard>
                  <SolarDesignerPage />
                </AuthGuard>
              } />
              
              {/* BOQ Generator Route */}
              <Route path="/boq-generator" element={
                <AuthGuard>
                  <BOQGenerator />
                </AuthGuard>
              } />
              
              {/* Solar Components Library Route */}
              <Route path="/solar-components" element={
                <AuthGuard>
                  <SolarComponentsPage />
                </AuthGuard>
              } />
              
              {/* Admin Dashboard Route */}
              <Route path="/admin" element={
                <AuthGuard>
                  <AdminDashboard />
                </AuthGuard>
              } />
              
              {/* User Account Route */}
              <Route path="/account" element={
                <AuthGuard>
                  <UserAccount />
                </AuthGuard>
              } />
              
              {/* Subscription Success Route */}
              <Route path="/subscription/success" element={
                <AuthGuard>
                  <SubscriptionSuccess />
                </AuthGuard>
              } />
              
              {/* Public Pages */}
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/changelog" element={<Changelog />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/documentation" element={<Documentation />} />
              
              {/* Product Pages (SEO Landing Pages) */}
              <Route path="/products" element={<Products />} />
              <Route path="/products/pv-designer" element={<ProductPVDesigner />} />
              <Route path="/products/bess-designer" element={<ProductBESSDesigner />} />
              
              {/* Blog Routes */}
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/blog/admin" element={
                <AuthGuard>
                  <BlogAdmin />
                </AuthGuard>
              } />
              <Route path="/blog/admin/create" element={
                <AuthGuard>
                  <BlogPostEditor />
                </AuthGuard>
              } />
              <Route path="/blog/admin/edit/:id" element={
                <AuthGuard>
                  <BlogPostEditor />
                </AuthGuard>
              } />
              
              {/* Forum Routes */}
              <Route path="/forum" element={<Forum />} />
              <Route path="/forum/topic/:slug" element={<ForumTopic />} />
              <Route path="/forum/new" element={
                <AuthGuard>
                  <ForumNewTopic />
                </AuthGuard>
              } />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SolarProjectsProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
