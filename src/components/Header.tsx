
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sun, LogOut, Settings, Home, ChevronDown, Lightbulb, Battery } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.email === "amrit.mandal0191@gmail.com";
  const [isProductsOpen, setIsProductsOpen] = useState(false);

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
              
              {/* Products Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setIsProductsOpen(true)}
                onMouseLeave={() => setIsProductsOpen(false)}
              >
                <button
                  className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 ${
                    location.pathname.startsWith("/products") ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Products <ChevronDown className="h-3 w-3" />
                </button>
                
                {isProductsOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white shadow-lg rounded-lg border overflow-hidden z-50">
                    <Link 
                      to="/products/pv-designer"
                      className="flex items-start gap-3 px-4 py-3 hover:bg-orange-50 transition-colors border-b"
                    >
                      <Lightbulb className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-sm">AI PV Designer Pro</div>
                        <div className="text-xs text-gray-600">Solar PV system design</div>
                      </div>
                    </Link>
                    <Link 
                      to="/products/bess-designer"
                      className="flex items-start gap-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b"
                    >
                      <Battery className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-sm">BESS Designer</div>
                        <div className="text-xs text-gray-600">Battery storage systems</div>
                      </div>
                    </Link>
                    <Link 
                      to="/products"
                      className="flex items-center justify-center px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm text-gray-700 font-medium"
                    >
                      View All Products →
                    </Link>
                  </div>
                )}
              </div>
              
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
                to="/products"
                className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
              >
                Products
              </Link>
              <Link
                to="/blog"
                className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
              >
                Blog
              </Link>
              <Link
                to="/documentation"
                className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
              >
                Docs
              </Link>
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
