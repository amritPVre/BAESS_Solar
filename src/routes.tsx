
import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import ProjectDetails from "./pages/ProjectDetails";
import Index from "./pages/Index";
import AuthGuard from "@/components/AuthGuard";
import BOQGenerator from "./pages/BOQGenerator";
import { AdvancedSolarCalculatorPage } from "./pages/AdvancedSolarCalculatorPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/dashboard",
    element: (
      <AuthGuard>
        <Dashboard />
      </AuthGuard>
    ),
  },
  {
    path: "/projects/:id",
    element: (
      <AuthGuard>
        <ProjectDetails />
      </AuthGuard>
    ),
  },
  {
    path: "/boq-generator",
    element: (
      <AuthGuard>
        <BOQGenerator />
      </AuthGuard>
    ),
  },
  {
    path: "/advanced-calculator",
    element: (
      <AuthGuard>
        <AdvancedSolarCalculatorPage />
      </AuthGuard>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
