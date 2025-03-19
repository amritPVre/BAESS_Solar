
import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Calculator, PanelTop, BarChart3, SunMedium } from "lucide-react";

const Index: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Helmet>
        <title>Solar Financial Tool</title>
      </Helmet>

      <header className="container mx-auto py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <SunMedium className="h-8 w-8 text-solar" />
          <h1 className="text-2xl font-bold text-gray-900">Solar Financial Tool</h1>
        </div>
        <div>
          {user ? (
            <Link to="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </header>

      <main className="container mx-auto py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Design, Calculate & Finance Your Solar Projects
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              A comprehensive tool for solar professionals and enthusiasts to design solar PV systems, 
              calculate energy production, and analyze financial metrics.
            </p>
            <div className="flex flex-wrap gap-4">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" className="bg-solar hover:bg-solar-dark text-white">
                    Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button size="lg" className="bg-solar hover:bg-solar-dark text-white">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
              <a href="#features">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </a>
            </div>
          </div>
          <div className="hidden lg:block">
            <img
              src="/placeholder.svg"
              alt="Solar Panel Illustration"
              className="w-full max-w-lg mx-auto rounded-lg shadow-xl"
            />
          </div>
        </div>

        <div id="features" className="mt-24">
          <h3 className="text-3xl font-bold text-center mb-12">
            Complete Solar Project Toolkit
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="bg-solar/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Calculator className="text-solar h-6 w-6" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Financial Calculator</h4>
              <p className="text-gray-600">
                Calculate ROI, payback period, IRR, and other financial metrics for your solar projects.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="bg-solar/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <PanelTop className="text-solar h-6 w-6" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Solar PV Designer</h4>
              <p className="text-gray-600">
                Design solar PV systems by placing panels on buildings and analyzing shading impacts.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="bg-solar/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <BarChart3 className="text-solar h-6 w-6" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Energy Analysis</h4>
              <p className="text-gray-600">
                Generate detailed energy production forecasts based on location and system parameters.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-12">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <SunMedium className="h-6 w-6 text-solar" />
              <p className="text-sm text-gray-600">
                © {new Date().getFullYear()} Solar Financial Tool
              </p>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-gray-600 hover:text-solar">Terms</a>
              <a href="#" className="text-sm text-gray-600 hover:text-solar">Privacy</a>
              <a href="#" className="text-sm text-gray-600 hover:text-solar">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
