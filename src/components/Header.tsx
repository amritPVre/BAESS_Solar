import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sun } from "lucide-react";

const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center px-4">
        <Link to="/" className="flex items-center gap-2">
          <Sun className="h-6 w-6 text-solar" />
          <span className="text-lg font-semibold">Solar Financial</span>
        </Link>
        <nav className="hidden md:flex items-center justify-between gap-6 mx-6">
          {isAuthenticated ? (
            <>
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
        
        <div className="ml-auto flex items-center space-x-4">
          {isAuthenticated && (
            <button onClick={logout} className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground">
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
