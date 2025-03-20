
import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import ProjectDetails from "./pages/ProjectDetails";
import SolarDesigner from "./pages/SolarDesigner";
import Index from "./pages/Index";
import AuthGuard from "@/components/AuthGuard";
import { SolarDesignerPage } from "./pages/SolarDesignerPage";
import BOQGenerator from "./pages/BOQGenerator";

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
    path: "/solar-designer",
    element: (
      <AuthGuard>
        <SolarDesigner />
      </AuthGuard>
    ),
  },
  {
    path: "/solar-designer-page",
    element: (
      <AuthGuard>
        <SolarDesignerPage />
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
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
