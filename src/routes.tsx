
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
import BESSDesigner from "./pages/BESSDesigner";
import { UserAccount } from "./pages/UserAccount";
import AdminDashboard from "./pages/AdminDashboard";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogAdmin from "./pages/BlogAdmin";
import BlogPostEditor from "./pages/BlogPostEditor";
import Forum from "./pages/Forum";
import ForumTopic from "./pages/ForumTopic";
import ForumNewTopic from "./pages/ForumNewTopic";
import Integrations from "./pages/Integrations";
import Changelog from "./pages/Changelog";
import AboutUs from "./pages/AboutUs";
import Careers from "./pages/Careers";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";

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
    path: "/bess-designer",
    element: (
      <AuthGuard>
        <BESSDesigner />
      </AuthGuard>
    ),
  },
  {
    path: "/account",
    element: (
      <AuthGuard>
        <UserAccount />
      </AuthGuard>
    ),
  },
  {
    path: "/admin",
    element: (
      <AuthGuard>
        <AdminDashboard />
      </AuthGuard>
    ),
  },
  {
    path: "/blog",
    element: <Blog />,
  },
  {
    path: "/blog/admin",
    element: (
      <AuthGuard>
        <BlogAdmin />
      </AuthGuard>
    ),
  },
  {
    path: "/blog/admin/posts/new",
    element: (
      <AuthGuard>
        <BlogPostEditor />
      </AuthGuard>
    ),
  },
  {
    path: "/blog/admin/posts/edit/:id",
    element: (
      <AuthGuard>
        <BlogPostEditor />
      </AuthGuard>
    ),
  },
  {
    path: "/blog/:slug",
    element: <BlogPost />,
  },
  {
    path: "/forum",
    element: <Forum />,
  },
  {
    path: "/forum/topic/:slug",
    element: <ForumTopic />,
  },
  {
    path: "/forum/new",
    element: (
      <AuthGuard>
        <ForumNewTopic />
      </AuthGuard>
    ),
  },
  {
    path: "/integrations",
    element: <Integrations />,
  },
  {
    path: "/changelog",
    element: <Changelog />,
  },
  {
    path: "/about",
    element: <AboutUs />,
  },
  {
    path: "/careers",
    element: <Careers />,
  },
  {
    path: "/privacy",
    element: <PrivacyPolicy />,
  },
  {
    path: "/terms",
    element: <TermsOfService />,
  },
  {
    path: "/subscription/success",
    element: (
      <AuthGuard>
        <SubscriptionSuccess />
      </AuthGuard>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
