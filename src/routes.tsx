
import React from "react";
import { Navigate, RouteObject } from "react-router-dom";
import { Auth } from "./pages/Auth";
import { NotFound } from "./pages/NotFound";
import { Dashboard } from "./pages/Dashboard";
import { ProjectDetails } from "./pages/ProjectDetails";
import { SolarDesignerPage } from "./pages/SolarDesignerPage";
import { Index } from "./pages/Index";
import { AuthGuard } from "@/components/AuthGuard";

export const routes: RouteObject[] = [
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
    path: "/project/:id",
    element: (
      <AuthGuard>
        <ProjectDetails />
      </AuthGuard>
    ),
  },
  {
    path: "/designer",
    element: <SolarDesignerPage />,
  },
  {
    path: "/solar-designer",
    element: <Navigate to="/designer" replace />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];
