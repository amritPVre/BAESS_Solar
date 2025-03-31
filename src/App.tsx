
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SolarProjectsProvider>
        <TooltipProvider>
          <Helmet titleTemplate="%s | Solar Financial Tool" defaultTitle="Solar Financial Tool" />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
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
                  <SolarCalculator />
                </AuthGuard>
              } />
              {/* For backward compatibility - maintain both routes */}
              <Route path="/calculator" element={
                <AuthGuard>
                  <SolarCalculator />
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
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SolarProjectsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
