import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Battery, Zap, TrendingUp, Shield, Clock, CheckCircle2, ArrowRight, Sparkles, Star } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function ProductBESSDesigner() {
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
      icon: Battery,
      title: "Intelligent Sizing",
      description: "AI capacity calculations • Load profiles • Backup requirements",
      gradient: "from-[#3B82F6] to-[#10B981]"
    },
    {
      icon: Zap,
      title: "Multiple Configurations",
      description: "DC-coupled • AC-coupled • Hybrid BESS optimization",
      gradient: "from-[#10B981] to-[#3B82F6]"
    },
    {
      icon: TrendingUp,
      title: "Financial Analysis",
      description: "Complete ROI • Payback period • Lifetime savings",
      gradient: "from-[#3B82F6] to-[#6366F1]"
    },
    {
      icon: Shield,
      title: "Safety Compliance",
      description: "IEC 62619 • UL 1973 • Local electrical codes",
      gradient: "from-[#6366F1] to-[#3B82F6]"
    },
    {
      icon: Clock,
      title: "TOU Optimization",
      description: "Peak shaving • Load shifting • Tariff maximization",
      gradient: "from-[#10B981] to-[#3B82F6]"
    },
    {
      icon: Sparkles,
      title: "One-Click Reports",
      description: "Professional BESS design • Technical specs • BOQ",
      gradient: "from-[#3B82F6] to-[#10B981]"
    }
  ];

  return (
    <>
      <Helmet>
        <title>BESS Designer - Battery Energy Storage System Simulator | BAESS Labs</title>
        <meta name="description" content="Professional BESS design tool. AI-powered battery storage simulation. Size 10kWh-10MWh systems. ROI analysis, safety compliance, TOU optimization. Free trial." />
        <meta name="keywords" content="BESS designer, battery storage simulator, energy storage system, BESS sizing tool, battery system design, ESS simulation software, battery ROI analysis" />
        <link rel="canonical" href="https://www.baess.app/products/bess-designer" />
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
                    <Button className="bg-gradient-to-r from-[#3B82F6] to-[#10B981] hover:from-[#10B981] hover:to-[#3B82F6] text-white font-semibold">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button className="bg-gradient-to-r from-[#3B82F6] to-[#10B981] hover:from-[#10B981] hover:to-[#3B82F6] text-white font-semibold">
                      Start Free Trial
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 bg-gradient-to-br from-[#3B82F6] via-[#10B981] to-[#3B82F6] overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/30">
                <Battery className="h-4 w-4 text-white" />
                <span className="text-sm font-semibold text-white">Battery Energy Storage System Designer</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                Design Battery Storage Systems
                <br />
                <span className="text-[#0A2463]">in Minutes</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-white/90 mb-8">
                Professional BESS design tool. AI-powered sizing • Financial analysis • Technical reports.
                <br />10kWh residential to 10MWh utility-scale projects.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')}
                  className="bg-white text-[#3B82F6] hover:bg-[#0A2463] hover:text-white font-bold px-8"
                >
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/bess-designer')}
                  className="bg-[#10B981] hover:bg-[#059669] text-white font-bold px-8"
                >
                  View Demo
                </Button>
              </div>

              <p className="text-sm text-white/70 mt-6">
                No credit card • Full access • Used by 500+ engineers
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-black text-[#3B82F6] mb-2">10kWh</div>
                <div className="text-sm text-[#0A2463] font-medium">Min Capacity</div>
              </div>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-black text-[#3B82F6] mb-2">10MWh</div>
                <div className="text-sm text-[#0A2463] font-medium">Max Capacity</div>
              </div>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-black text-[#3B82F6] mb-2">IEC</div>
                <div className="text-sm text-[#0A2463] font-medium">Compliant</div>
              </div>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-black text-[#3B82F6] mb-2">AI</div>
                <div className="text-sm text-[#0A2463] font-medium">Powered</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-[#0A2463] mb-4">
                Complete BESS Design Solution
              </h2>
              <p className="text-[#0A2463]/70 max-w-2xl mx-auto">
                Design, size, specify battery energy storage systems
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <Card key={index} className="group p-6 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-[#3B82F6] cursor-pointer bg-white">
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

        {/* Benefits */}
        <section className="py-16 bg-[#3B82F6] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-8 text-center">
              Why Choose Our <span className="text-[#10B981]">BESS Designer</span>?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                "Design 10kWh-10MWh systems",
                "Residential to utility-scale",
                "Component database included",
                "Grid independence calculations",
                "Backup duration analysis",
                "Solar PV integration"
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-white transition-all">
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
              How It <span className="text-[#3B82F6]">Works</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { num: "1", title: "Input Requirements", desc: "Load profile • Solar generation • Backup needs" },
                { num: "2", title: "AI Optimization", desc: "Battery capacity • Inverter sizing • Configuration" },
                { num: "3", title: "Export Report", desc: "Professional reports • BOQ • Technical specs" }
              ].map((step) => (
                <div key={step.num} className="relative">
                  <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-3xl p-8 h-full border-2 border-[#3B82F6]/20 hover:border-[#3B82F6] transition-all">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#3B82F6] to-[#10B981] rounded-2xl flex items-center justify-center mb-6 font-black text-3xl text-white">
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
        <section className="py-16 bg-gradient-to-br from-[#3B82F6] via-[#10B981] to-[#3B82F6] relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Ready to Design Your First BESS Project?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join 500+ engineers using AI-powered battery storage design
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-white text-[#3B82F6] hover:bg-[#0A2463] hover:text-white font-bold text-lg px-10"
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
