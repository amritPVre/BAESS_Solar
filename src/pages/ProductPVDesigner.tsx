import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lightbulb, MapPin, Zap, FileText, DollarSign, Cpu, CheckCircle2, ArrowRight, Sparkles, Sun, TrendingUp, Globe, Star, Users } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function ProductPVDesigner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: MapPin,
      title: "3D Site Mapping",
      description: "Satellite imagery • Auto area calculation • Shading analysis",
      gradient: "from-[#FFA500] to-[#F7931E]"
    },
    {
      icon: Zap,
      title: "Smart String Sizing",
      description: "Auto module-inverter optimization • Voltage calculations",
      gradient: "from-[#3B82F6] to-[#10B981]"
    },
    {
      icon: FileText,
      title: "AI-Powered BOQ",
      description: "IEC compliant • Complete BOS • Instant generation",
      gradient: "from-[#10B981] to-[#FFA500]"
    },
    {
      icon: DollarSign,
      title: "Financial Modeling",
      description: "NPV • IRR • Payback • ROI analysis",
      gradient: "from-[#FFA500] to-[#F7931E]"
    },
    {
      icon: Sun,
      title: "Energy Simulation",
      description: "NREL-validated • Monthly/annual forecasts",
      gradient: "from-[#F7931E] to-[#FFA500]"
    },
    {
      icon: Cpu,
      title: "AI Design Assistant",
      description: "Instant recommendations • Component suggestions",
      gradient: "from-[#3B82F6] to-[#FFA500]"
    }
  ];

  return (
    <>
      <Helmet>
        <title>AI PV Designer Pro - Solar PV System Design Simulator | BAESS Labs</title>
        <meta name="description" content="AI-powered solar PV simulator. Design 5kW-50MW systems. 3D mapping, string sizing, BOQ generation, financial analysis. 500+ engineers. IEC compliant. Free trial." />
        <meta name="keywords" content="solar PV simulator, AI solar design, solar engineering software, PV system design, photovoltaic simulator, solar design platform, NREL PV simulation" />
        <link rel="canonical" href="https://www.baess.app/products/pv-designer" />
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-lg shadow-lg' : 'bg-white'
        }`}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 sm:h-20">
              <Link to="/" className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                <img 
                  src="/BAESS_logo_v02.png" 
                  alt="BAESS Labs" 
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </Link>

              <div className="flex items-center gap-4">
                <Link to="/" className="text-sm font-medium text-[#0A2463] hover:text-[#FFA500] transition-colors hidden sm:block">
                  Home
                </Link>
                {user ? (
                  <Link to="/dashboard">
                    <Button className="bg-gradient-to-r from-[#FFA500] to-[#F7931E] hover:from-[#F7931E] hover:to-[#FFA500] text-white font-semibold">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button className="bg-gradient-to-r from-[#FFA500] to-[#F7931E] hover:from-[#F7931E] hover:to-[#FFA500] text-white font-semibold">
                      Start Free Trial
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 bg-gradient-to-br from-[#FFA500] via-[#F7931E] to-[#FFA500] overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/30">
                <Sparkles className="h-4 w-4 text-white" />
                <span className="text-sm font-semibold text-white">AI-Powered Solar PV Simulator</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                Design Solar PV Systems
                <br />
                <span className="text-[#0A2463]">10x Faster with AI</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-white/90 mb-8">
                Complete PV simulation platform. 3D mapping • String sizing • AI BOQ • Financial analysis.
                <br />Construction-ready designs in hours, not weeks.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')}
                  className="bg-white text-[#FFA500] hover:bg-[#0A2463] hover:text-white font-bold px-8"
                >
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/pv-designer')}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-8"
                >
                  View Demo
                </Button>
              </div>

              <p className="text-sm text-white/70 mt-6">
                No credit card • Full access • First AI solar simulator
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-black text-[#FFA500] mb-2">500+</div>
                <div className="text-sm text-[#0A2463] font-medium">Engineers</div>
              </div>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-black text-[#FFA500] mb-2">10x</div>
                <div className="text-sm text-[#0A2463] font-medium">Faster Design</div>
              </div>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-black text-[#FFA500] mb-2">99%</div>
                <div className="text-sm text-[#0A2463] font-medium">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-black text-[#FFA500] mb-2">IEC</div>
                <div className="text-sm text-[#0A2463] font-medium">Compliant</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 bg-[#FEF3C7]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-[#0A2463] mb-4">
                Complete Solar PV Design Suite
              </h2>
              <p className="text-[#0A2463]/70 max-w-2xl mx-auto">
                Initial feasibility to construction-ready documents
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <Card key={index} className="group p-6 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-[#FFA500] cursor-pointer bg-white">
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0A2463] mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#0A2463]/70">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="py-16 bg-[#0A2463] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-8 text-center">
              What You Can <span className="text-[#FFA500]">Design</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {[
                "5kW-50MW+ systems",
                "Rooftop & ground-mount",
                "Single & three-phase",
                "DC & AC calculations",
                "Cable & breaker sizing",
                "Structural load analysis",
                "Grid integration",
                "Professional reports"
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-[#FFA500]/20 hover:border-[#FFA500] transition-all">
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-[#10B981]" />
                  <span className="text-white font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-black text-[#0A2463] mb-12 text-center">
              Concept to Construction in <span className="text-[#FFA500]">3 Steps</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { num: "1", title: "Map Your Site", desc: "Satellite imagery • Area calculation • Precision tools" },
                { num: "2", title: "AI Generates Design", desc: "String config • Complete BOQ • Financial analysis" },
                { num: "3", title: "Export & Share", desc: "Professional PDF • Technical specs • Client-ready" }
              ].map((step) => (
                <div key={step.num} className="relative">
                  <div className="bg-gradient-to-br from-[#FEF3C7] to-[#FFA500]/10 rounded-3xl p-8 h-full border-2 border-[#FFA500]/20 hover:border-[#FFA500] transition-all">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#FFA500] to-[#F7931E] rounded-2xl flex items-center justify-center mb-6 font-black text-3xl text-white">
                      {step.num}
                    </div>
                    <h3 className="text-xl font-bold text-[#0A2463] mb-3">{step.title}</h3>
                    <p className="text-[#0A2463]/70">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-[#FFA500] via-[#F7931E] to-[#FFA500] relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Ready to Design Your First Solar Project?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join 500+ engineers using AI-powered solar simulation
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-white text-[#FFA500] hover:bg-[#0A2463] hover:text-white font-bold text-lg px-10"
            >
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-white/70 mt-4">
              Full access • No credit card • Cancel anytime
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#0A2463] text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              <div>
                <img 
                  src="/BAESS_logo_v02.png" 
                  alt="BAESS Labs" 
                  className="h-10 w-auto object-contain brightness-0 invert mb-4"
                />
                <p className="text-sm text-white/70">
                  Next-generation solar intelligence platform powered by AI.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-4">Product</h4>
                <ul className="space-y-2">
                  <li><Link to="/products/pv-designer" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">AI PV Designer Pro</Link></li>
                  <li><Link to="/products/bess-designer" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">BESS Designer</Link></li>
                  <li><Link to="/products" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">All Products</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><Link to="/blog" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">Blog</Link></li>
                  <li><Link to="/forum" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">Forum</Link></li>
                  <li><Link to="/contact" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">Contact</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li><Link to="/privacy" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">Privacy</Link></li>
                  <li><Link to="/terms" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">Terms</Link></li>
                  <li><Link to="/faq" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">FAQ</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 pt-8">
              <p className="text-sm text-white/70 text-center">
                © {new Date().getFullYear()} BAESS Labs. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
