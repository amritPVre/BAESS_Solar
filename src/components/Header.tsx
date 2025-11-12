
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sun, LogOut, Settings, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.email === "amrit.mandal0191@gmail.com";

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src="/baess-logo.PNG" alt="BAESS Labs" className="h-8 w-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-none">BAESS</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-wider leading-none">Solar Intelligence</span>
          </div>
        </Link>
        <nav className="hidden md:flex items-center justify-between gap-6 mx-6">
          {isAuthenticated ? (
            <>
              <Link
                to="/"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === "/" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  Home
                </span>
              </Link>
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/solar-calculator"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === "/solar-calculator" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Calculator
              </Link>
              <Link
                to="/boq-generator"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === "/boq-generator" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                BOQ Generator
              </Link>
              <Link
                to="/solar-components"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === "/solar-components" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Components
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === "/admin" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Admin
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
              >
                Login
              </Link>
            </>
          )}
        </nav>
        
        <div className="ml-auto flex items-center gap-4">
          {isAuthenticated && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout} 
              className="flex items-center gap-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
