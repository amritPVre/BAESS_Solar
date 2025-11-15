import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  ArrowRight, Calculator, PanelTop, BarChart3, Zap, Check, 
  Star, Sparkles, TrendingUp, Users, Globe, Award,
  ChevronRight, Menu, X, Sun, DollarSign, Shield, Rocket, Lightbulb, Battery
} from "lucide-react";

const Index: React.FC = () => {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Helmet>
        <title>BAESS Labs - Solar Intelligence for the Future</title>
        <meta name="description" content="Experience the future of solar design with AI-powered tools, real-time calculations, and intelligent project management." />
      </Helmet>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-lg shadow-lg' : 'bg-white'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src="/BAESS_logo_v02.png" 
                alt="BAESS Labs" 
                className="h-10 sm:h-12 w-auto object-contain"
                onError={(e) => {
                  // Fallback to text logo if image fails to load
            e.currentTarget.style.display = 'none';
                  const fallback = document.getElementById('logo-fallback');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div id="logo-fallback" className="hidden items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FFA500] to-[#F7931E] blur-lg opacity-30 rounded-full"></div>
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#FFA500] to-[#F7931E] rounded-xl flex items-center justify-center transform hover:rotate-12 transition-transform duration-300">
                    <span className="text-white font-black text-lg sm:text-xl">B</span>
                  </div>
                </div>
          <div className="flex flex-col">
                  <h1 className="text-lg sm:text-xl font-black text-[#0A2463] leading-none tracking-tight">
                    BAESS <span className="text-[#FFA500]">Labs</span>
                  </h1>
                  <p className="text-[8px] sm:text-xs text-[#F7931E] leading-none mt-0.5 font-medium tracking-wide">
                    SOLAR INTELLIGENCE
                  </p>
          </div>
          </div>
        </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {/* Products Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setIsProductsOpen(true)}
                onMouseLeave={() => setIsProductsOpen(false)}
              >
                <button
                  className="text-sm font-medium text-[#0A2463] hover:text-[#FFA500] transition-colors flex items-center gap-1 py-2"
                >
                  Products
                  <ChevronRight className={`h-4 w-4 transition-transform ${isProductsOpen ? 'rotate-90' : ''}`} />
                </button>
                {isProductsOpen && (
                  <div className="absolute left-0 top-full pt-2 z-50">
                    <div className="w-80 bg-white rounded-2xl shadow-2xl border-2 border-[#FFA500]/20 overflow-hidden">
                      <div className="p-2">
                        <Link
                          to="/products/pv-designer"
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#FEF3C7] transition-all group"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-[#FFA500] to-[#F7931E] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <Lightbulb className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-[#0A2463] text-sm mb-1">
                              AI PV Designer Pro
                            </div>
                            <div className="text-xs text-[#0A2463]/70">
                              Advanced calculator for solar design
                            </div>
                          </div>
                        </Link>
                        <Link
                          to="/products/bess-designer"
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#FEF3C7] transition-all group"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-[#3B82F6] to-[#10B981] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <Battery className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-[#0A2463] text-sm mb-1">
                              BESS Designer
                            </div>
                            <div className="text-xs text-[#0A2463]/70">
                              Battery energy storage system design
                            </div>
                          </div>
                        </Link>
                        <Link
                          to="/products"
                          className="block p-3 text-center text-sm font-medium text-[#FFA500] hover:bg-[#FEF3C7] rounded-xl transition-all"
                        >
                          View All Products →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <a href="#features" className="text-sm font-medium text-[#0A2463] hover:text-[#FFA500] transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-[#0A2463] hover:text-[#FFA500] transition-colors">
                How It Works
              </a>
              <a href="#pricing" className="text-sm font-medium text-[#0A2463] hover:text-[#FFA500] transition-colors">
                Pricing
              </a>
              <Link to="/blog" className="text-sm font-medium text-[#0A2463] hover:text-[#FFA500] transition-colors">
                Blog
              </Link>
              <Link to="/forum" className="text-sm font-medium text-[#0A2463] hover:text-[#FFA500] transition-colors">
                Forum
              </Link>
              <Link to="/faq" className="text-sm font-medium text-[#0A2463] hover:text-[#FFA500] transition-colors">
                FAQ
              </Link>
          {user ? (
            <Link to="/dashboard">
                  <Button className="bg-gradient-to-r from-[#FFA500] to-[#F7931E] hover:from-[#F7931E] hover:to-[#FFA500] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                    Dashboard <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
            </Link>
          ) : (
            <Link to="/auth">
                  <Button className="bg-gradient-to-r from-[#FFA500] to-[#F7931E] hover:from-[#F7931E] hover:to-[#FFA500] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                    Get Started <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-[#FEF3C7] transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-[#0A2463]" />
              ) : (
                <Menu className="h-6 w-6 text-[#0A2463]" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden py-4 border-t border-[#FEF3C7]">
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-sm font-bold text-[#0A2463] mb-2 px-2">Products</div>
                  <Link to="/products/pv-designer" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium text-[#0A2463]/70 hover:text-[#FFA500] transition-colors block pl-4 py-1">
                    AI PV Designer Pro
                  </Link>
                  <Link to="/products/bess-designer" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium text-[#0A2463]/70 hover:text-[#FFA500] transition-colors block pl-4 py-1">
                    BESS Designer
                  </Link>
                  <Link to="/products" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium text-[#FFA500] hover:text-[#F7931E] transition-colors block pl-4 py-1">
                    View All →
                  </Link>
                </div>
                <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium text-[#0A2463] hover:text-[#FFA500] transition-colors">
                  Features
                </a>
                <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium text-[#0A2463] hover:text-[#FFA500] transition-colors">
                  How It Works
                </a>
                <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium text-[#0A2463] hover:text-[#FFA500] transition-colors">
                  Pricing
                </a>
                <Link to="/blog" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium text-[#0A2463] hover:text-[#FFA500] transition-colors">
                  Blog
                </Link>
                <Link to="/forum" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium text-[#0A2463] hover:text-[#FFA500] transition-colors">
                  Forum
                </Link>
                <Link to="/faq" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium text-[#0A2463] hover:text-[#FFA500] transition-colors">
                  FAQ
                </Link>
                <a href="#testimonials" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium text-[#0A2463] hover:text-[#FFA500] transition-colors">
                  Testimonials
                </a>
                {user ? (
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-[#FFA500] to-[#F7931E] text-white font-semibold">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-[#FFA500] to-[#F7931E] text-white font-semibold">
                      Get Started
                    </Button>
            </Link>
          )}
        </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 bg-gradient-to-br from-[#FFA500] via-[#F7931E] to-[#FFA500] overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/30">
                <Sparkles className="h-4 w-4 text-white" />
                <span className="text-sm font-semibold text-white">AI-Powered Solar Design</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 leading-tight">
                Solar Intelligence
                <br />
                <span className="text-[#0A2463]">for the Future</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto lg:mx-0">
                Experience next-generation solar design with <span className="font-bold text-white">AI-powered calculations</span>, real-time project management, and intelligent automation that saves you hours.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {user ? (
                <Link to="/dashboard">
                    <Button size="lg" className="bg-white text-[#FFA500] hover:bg-[#0A2463] hover:text-white font-bold text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-2xl hover:shadow-3xl transition-all duration-300 group w-full sm:w-auto">
                      Launch Dashboard
                      <Rocket className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                    <Button size="lg" className="bg-white text-[#FFA500] hover:bg-[#0A2463] hover:text-white font-bold text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-2xl hover:shadow-3xl transition-all duration-300 group w-full sm:w-auto">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}
              <a href="#features">
                  <Button size="lg" className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-xl hover:shadow-2xl transition-all duration-300 w-full sm:w-auto border-2 border-white/30">
                    Explore Features
                </Button>
              </a>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-8 mt-10 sm:mt-12">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-[#10B981]" />
                  <span className="text-sm sm:text-base text-white font-medium">No Credit Card</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-[#10B981]" />
                  <span className="text-sm sm:text-base text-white font-medium">Free Forever</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-[#10B981]" />
                  <span className="text-sm sm:text-base text-white font-medium">Cancel Anytime</span>
                </div>
              </div>
            </div>

            {/* Hero Image/Animation */}
            <div className="relative hidden lg:block">
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                {/* Glowing Orb */}
                <div className="absolute inset-0 bg-white rounded-full blur-3xl opacity-20 animate-pulse"></div>
                
                {/* Orbiting Elements */}
                <div className="absolute inset-0 animate-spin-slow">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
                    <Sun className="h-8 w-8 text-[#FFA500]" />
                  </div>
                </div>
                
                <div className="absolute inset-8 animate-spin-slower">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-xl shadow-xl flex items-center justify-center">
                    <Calculator className="h-7 w-7 text-[#3B82F6]" />
            </div>
          </div>
                
                <div className="absolute inset-16 animate-spin-slowest">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center">
                    <Zap className="h-6 w-6 text-[#10B981]" />
          </div>
        </div>

                {/* Center Icon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#FFA500] to-[#F7931E] rounded-2xl flex items-center justify-center">
                    <PanelTop className="h-10 w-10 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#FFA500] mb-2">50+</div>
              <div className="text-sm sm:text-base text-[#0A2463] font-medium">BOQ Items with AI</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#FFA500] mb-2">100MW+</div>
              <div className="text-sm sm:text-base text-[#0A2463] font-medium">Design Capacity</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#FFA500] mb-2">95%</div>
              <div className="text-sm sm:text-base text-[#0A2463] font-medium">Time Saved</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#FFA500] mb-2">5+</div>
              <div className="text-sm sm:text-base text-[#0A2463] font-medium">Utility Apps</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 bg-[#FEF3C7]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-[#FFA500]/10 rounded-full px-4 py-2 mb-4">
              <Sparkles className="h-4 w-4 text-[#FFA500]" />
              <span className="text-sm font-semibold text-[#FFA500]">Powerful Features</span>
              </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0A2463] mb-4">
              Everything You Need,
              <br />
              <span className="text-[#FFA500]">Nothing You Don't</span>
            </h2>
            <p className="text-lg sm:text-xl text-[#0A2463]/70 max-w-3xl mx-auto">
              From initial design to final financial analysis, we've got every step covered with cutting-edge AI technology.
              </p>
            </div>
            
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature Card 1 */}
            <div className="group bg-white rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-[#FFA500] cursor-pointer">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#FFA500] to-[#F7931E] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Calculator className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0A2463] mb-3">AI BOQ Generation</h3>
              <p className="text-sm sm:text-base text-[#0A2463]/70 mb-4">
                Generate comprehensive Bill of Quantities in seconds with our AI-powered engine. Accurate, detailed, and ready to use.
              </p>
              <div className="flex items-center gap-2 text-[#FFA500] font-semibold text-sm group-hover:gap-3 transition-all">
                <span>Learn More</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>

            {/* Feature Card 2 */}
            <div className="group bg-white rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-[#FFA500] cursor-pointer">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#3B82F6] to-[#10B981] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <PanelTop className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0A2463] mb-3">Smart PV Designer</h3>
              <p className="text-sm sm:text-base text-[#0A2463]/70 mb-4">
                Design solar systems visually with intelligent module placement, shading analysis, and real-time optimization.
              </p>
              <div className="flex items-center gap-2 text-[#3B82F6] font-semibold text-sm group-hover:gap-3 transition-all">
                <span>Learn More</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>

            {/* Feature Card 3 */}
            <div className="group bg-white rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-[#FFA500] cursor-pointer">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#10B981] to-[#FFA500] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0A2463] mb-3">Financial Analytics</h3>
              <p className="text-sm sm:text-base text-[#0A2463]/70 mb-4">
                Complete financial modeling with ROI, NPV, IRR calculations, and beautiful reports that win clients.
              </p>
              <div className="flex items-center gap-2 text-[#10B981] font-semibold text-sm group-hover:gap-3 transition-all">
                <span>Learn More</span>
                <ArrowRight className="h-4 w-4" />
          </div>
        </div>

            {/* Feature Card 4 */}
            <div className="group bg-white rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-[#FFA500] cursor-pointer">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#F7931E] to-[#FFA500] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0A2463] mb-3">Energy Simulation</h3>
              <p className="text-sm sm:text-base text-[#0A2463]/70 mb-4">
                Hourly energy production forecasts with weather data integration and performance ratio analysis.
              </p>
              <div className="flex items-center gap-2 text-[#FFA500] font-semibold text-sm group-hover:gap-3 transition-all">
                <span>Learn More</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
            
            {/* Feature Card 5 */}
            <div className="group bg-white rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-[#FFA500] cursor-pointer">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#3B82F6] to-[#FFA500] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Globe className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0A2463] mb-3">Global Coverage</h3>
              <p className="text-sm sm:text-base text-[#0A2463]/70 mb-4">
                Design projects anywhere in the world with accurate weather data and local grid requirements.
              </p>
              <div className="flex items-center gap-2 text-[#3B82F6] font-semibold text-sm group-hover:gap-3 transition-all">
                <span>Learn More</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
            
            {/* Feature Card 6 */}
            <div className="group bg-white rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-[#FFA500] cursor-pointer">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#10B981] to-[#3B82F6] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0A2463] mb-3">Lightning Fast</h3>
              <p className="text-sm sm:text-base text-[#0A2463]/70 mb-4">
                Complete project designs in minutes, not hours. Our AI does the heavy lifting so you can focus on growth.
              </p>
              <div className="flex items-center gap-2 text-[#10B981] font-semibold text-sm group-hover:gap-3 transition-all">
                <span>Learn More</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-[#0A2463] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-[#FFA500]/20 rounded-full px-4 py-2 mb-4">
              <Sparkles className="h-4 w-4 text-[#FFA500]" />
              <span className="text-sm font-semibold text-[#FFA500]">Simple Process</span>
              </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
              From Concept to <span className="text-[#FFA500]">Commission</span>
              <br />in 4 Simple Steps
            </h2>
            <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto">
              Our intelligent workflow guides you through every phase of solar project development.
              </p>
            </div>
            
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border-2 border-[#FFA500]/20 hover:border-[#FFA500] transition-all duration-300 h-full">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#FFA500] to-[#F7931E] rounded-2xl flex items-center justify-center mb-6 font-black text-2xl sm:text-3xl text-white">
                  1
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Define Project</h3>
                <p className="text-sm sm:text-base text-white/70">
                  Enter location, capacity, and basic parameters. Our AI suggests optimal configurations automatically.
                </p>
              </div>
              {/* Connector Line */}
              <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-[#FFA500] to-transparent"></div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border-2 border-[#FFA500]/20 hover:border-[#FFA500] transition-all duration-300 h-full">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#FFA500] to-[#F7931E] rounded-2xl flex items-center justify-center mb-6 font-black text-2xl sm:text-3xl text-white">
                  2
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Design System</h3>
                <p className="text-sm sm:text-base text-white/70">
                  Use our visual designer to place modules, configure inverters, and optimize layouts with real-time feedback.
                </p>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-[#FFA500] to-transparent"></div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border-2 border-[#FFA500]/20 hover:border-[#FFA500] transition-all duration-300 h-full">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#FFA500] to-[#F7931E] rounded-2xl flex items-center justify-center mb-6 font-black text-2xl sm:text-3xl text-white">
                  3
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Generate Reports</h3>
                <p className="text-sm sm:text-base text-white/70">
                  AI creates comprehensive BOQ, financial analysis, and professional reports ready for client presentation.
                </p>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-[#FFA500] to-transparent"></div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border-2 border-[#FFA500]/20 hover:border-[#FFA500] transition-all duration-300 h-full">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#FFA500] to-[#F7931E] rounded-2xl flex items-center justify-center mb-6 font-black text-2xl sm:text-3xl text-white">
                  4
              </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Win Projects</h3>
                <p className="text-sm sm:text-base text-white/70">
                  Deliver professional proposals faster than competitors. Close more deals with confidence.
              </p>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-[#FFA500]/10 rounded-full px-4 py-2 mb-4">
              <DollarSign className="h-4 w-4 text-[#FFA500]" />
              <span className="text-sm font-semibold text-[#FFA500]">Flexible Pricing</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0A2463] mb-4">
              Choose Your <span className="text-[#FFA500]">Power Plan</span>
            </h2>
            <p className="text-lg sm:text-xl text-[#0A2463]/70 max-w-3xl mx-auto">
              Start free, scale as you grow. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-7xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border-2 border-gray-200 hover:border-[#FFA500]/50 transition-all duration-300">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-[#0A2463] mb-2">Free Plan</h3>
                <p className="text-sm text-[#0A2463]/70">Perfect for trying out the platform</p>
              </div>
              <div className="mb-6">
                <div className="text-4xl sm:text-5xl font-black text-[#0A2463]">
                  $0
                  <span className="text-lg font-normal text-[#0A2463]/70">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#0A2463]/70"><strong>9 AI Credits</strong>/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#0A2463]/70">Unlimited Energy Simulation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#0A2463]/70">Access to Utility Apps - Limited</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#0A2463]/70">AI BOQ Generation - Limited</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#0A2463]/70">Community Support</span>
                </li>
              </ul>
              <Link to="/auth">
                <Button className="w-full bg-gray-100 text-[#0A2463] hover:bg-[#FFA500] hover:text-white font-semibold transition-all duration-300">
                  Start Free
                </Button>
              </Link>
            </div>

            {/* Professional Plan (Popular) */}
            <div className="bg-gradient-to-br from-[#FEF3C7] to-[#FFA500]/10 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-[#FFA500] relative transform md:scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FFA500] to-[#F7931E] text-white px-4 py-1 rounded-full text-sm font-bold">
                Most Popular
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-[#0A2463] mb-2">Professional</h3>
                <p className="text-sm text-[#0A2463]/70">For individual professionals and small teams</p>
              </div>
              <div className="mb-6">
                <div className="text-4xl sm:text-5xl font-black text-[#FFA500]">
                  $18
                  <span className="text-lg font-normal text-[#0A2463]/70">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#0A2463]/70"><strong>180 AI Credits</strong>/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#0A2463]/70">Unlimited Energy Simulation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#0A2463]/70">AI BOQ Generation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#0A2463]/70">Full Access to AI BOQ Generation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#0A2463]/70">Access to Utility Apps - 5x than Free</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#0A2463]/70">Priority Support</span>
                </li>
              </ul>
              <Link to="/auth">
                <Button className="w-full bg-gradient-to-r from-[#FFA500] to-[#F7931E] text-white hover:from-[#F7931E] hover:to-[#FFA500] font-semibold shadow-lg transition-all duration-300">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Advanced Plan */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border-2 border-gray-200 hover:border-[#FFA500]/50 transition-all duration-300">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-[#0A2463] mb-2">Advanced</h3>
                <p className="text-sm text-[#0A2463]/70">For growing businesses and consulting firms</p>
              </div>
              <div className="mb-6">
                <div className="text-4xl sm:text-5xl font-black text-[#0A2463]">
                  $54
                  <span className="text-lg font-normal text-[#0A2463]/70">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#0A2463]/70"><strong>360 AI Credits</strong>/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#0A2463]/70">Everything in Pro</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#0A2463]/70">Full Access to Utility Apps</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#0A2463]/70">Team Access (coming soon)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#0A2463]/70">API Access (coming soon)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#0A2463]/70">Dedicated Support</span>
                </li>
              </ul>
              <Link to="/auth">
                <Button className="w-full bg-[#0A2463] text-white hover:bg-[#FFA500] font-semibold transition-all duration-300">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-gradient-to-br from-[#0A2463] to-[#0A2463]/90 rounded-3xl p-6 sm:p-8 shadow-lg border-2 border-[#FFA500]/30 relative transition-all duration-300">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#0A2463] to-[#1e3a8a] text-white px-4 py-1 rounded-full text-sm font-bold">
                Paid Annually
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
                <p className="text-sm text-white/70">For large organizations and EPCs</p>
              </div>
              <div className="mb-6">
                <div className="text-4xl sm:text-5xl font-black text-[#FFA500]">
                  $108
                  <span className="text-lg font-normal text-white/70">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white/90"><strong>1,080 AI Credits</strong>/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white/90">Everything in Advanced</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white/90">Custom Integrations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white/90">Team Training</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white/90">SLA Guarantee</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white/90">White-label Options</span>
                </li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-[#FFA500] to-[#F7931E] text-white hover:from-[#F7931E] hover:to-[#FFA500] font-semibold shadow-lg transition-all duration-300">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 sm:py-24 bg-[#FEF3C7]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-[#FFA500]/10 rounded-full px-4 py-2 mb-4">
              <Star className="h-4 w-4 text-[#FFA500] fill-[#FFA500]" />
              <span className="text-sm font-semibold text-[#FFA500]">Loved by Professionals</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0A2463] mb-4">
              What Our <span className="text-[#FFA500]">Users Say</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 text-[#FFA500] fill-[#FFA500]" />
                ))}
              </div>
              <p className="text-sm sm:text-base text-[#0A2463]/70 mb-6 italic">
                "BAESS Labs cut our project design time from 8 hours to 30 minutes. The AI BOQ feature alone is worth the subscription!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#FFA500] to-[#F7931E] rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                  MK
                </div>
                <div>
                  <div className="font-bold text-[#0A2463] text-sm sm:text-base">Michael Khan</div>
                  <div className="text-xs sm:text-sm text-[#0A2463]/70">Senior Solar Engineer</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 text-[#FFA500] fill-[#FFA500]" />
                ))}
              </div>
              <p className="text-sm sm:text-base text-[#0A2463]/70 mb-6 italic">
                "The financial analysis tools are incredibly detailed. Our clients love the professional reports we generate now."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#3B82F6] to-[#10B981] rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                  SP
                </div>
                <div>
                  <div className="font-bold text-[#0A2463] text-sm sm:text-base">Sarah Patterson</div>
                  <div className="text-xs sm:text-sm text-[#0A2463]/70">Project Manager</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 text-[#FFA500] fill-[#FFA500]" />
                ))}
              </div>
              <p className="text-sm sm:text-base text-[#0A2463]/70 mb-6 italic">
                "Game-changer for our business. We've increased our proposal win rate by 40% since switching to BAESS Labs."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#10B981] to-[#FFA500] rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                  AR
                </div>
                <div>
                  <div className="font-bold text-[#0A2463] text-sm sm:text-base">Alex Rodriguez</div>
                  <div className="text-xs sm:text-sm text-[#0A2463]/70">EPC Director</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-[#FFA500] via-[#F7931E] to-[#FFA500] relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white mb-6">
            Ready to <span className="text-[#0A2463]">Transform</span>
            <br />
            Your Solar Business?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-8 sm:mb-12 max-w-3xl mx-auto">
            Join thousands of solar professionals who are already designing smarter, faster, and better with BAESS Labs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg" className="bg-white text-[#FFA500] hover:bg-[#0A2463] hover:text-white font-bold text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-7 shadow-2xl transition-all duration-300 group w-full sm:w-auto">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button size="lg" className="bg-white text-[#FFA500] hover:bg-[#0A2463] hover:text-white font-bold text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-7 shadow-2xl transition-all duration-300 group w-full sm:w-auto">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-[#FFA500] font-bold text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-7 transition-all duration-300 w-full sm:w-auto">
                  Schedule Demo
                </Button>
              </>
            )}
          </div>
          <p className="text-sm sm:text-base text-white/70 mt-6 sm:mt-8">
            No credit card required · Free forever · Cancel anytime
                </p>
              </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A2463] text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
            {/* Company Info */}
            <div>
              <div className="mb-4">
                <img 
                  src="/BAESS_logo_v02.png" 
                  alt="BAESS Labs" 
                  className="h-10 w-auto object-contain brightness-0 invert"
                />
              </div>
              <p className="text-sm text-white/70 mb-4">
                Next-generation solar intelligence platform powered by AI.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#FFA500] transition-colors">
                  <Users className="h-4 w-4" />
                </a>
                <a href="#" className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#FFA500] transition-colors">
                  <Globe className="h-4 w-4" />
                </a>
                <a href="#" className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#FFA500] transition-colors">
                  <Award className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <Link to="/integrations" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link to="/changelog" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/careers" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/forum" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    Forum
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/documentation" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-white/70 text-center sm:text-left">
                © {new Date().getFullYear()} BAESS Labs. All rights reserved.
              </p>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#10B981]" />
                <span className="text-sm text-white/70">SOC 2 Compliant</span>
            </div>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slower {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slowest {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-spin-slower {
          animation: spin-slower 15s linear infinite;
        }
        .animate-spin-slowest {
          animation: spin-slowest 10s linear infinite;
        }
        .delay-700 {
          animation-delay: 700ms;
        }
        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  );
};

export default Index;
