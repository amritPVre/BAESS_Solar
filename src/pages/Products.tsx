import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Battery, Lightbulb, FileText, Zap, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function Products() {
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

  const products = [
    {
      icon: Lightbulb,
      title: "AI PV Designer Pro",
      description: "AI-powered solar PV simulation platform. 3D mapping • String sizing • BOQ generation • Financial analysis.",
      features: ["3D Site Mapping", "Auto String Sizing", "Financial Modeling", "5kW-50MW systems"],
      link: "/products/pv-designer",
      gradient: "from-[#FFA500] to-[#F7931E]",
      bg: "from-orange-50 to-yellow-50"
    },
    {
      icon: Battery,
      title: "BESS Designer",
      description: "Professional battery energy storage system design tool. Intelligent sizing • ROI analysis • Safety compliance.",
      features: ["Intelligent Sizing", "TOU Optimization", "Safety Compliance", "10kWh-10MWh"],
      link: "/products/bess-designer",
      gradient: "from-[#3B82F6] to-[#10B981]",
      bg: "from-blue-50 to-green-50"
    },
    {
      icon: FileText,
      title: "AI BOQ Generator",
      description: "Automated Bill of Quantities generation. IEC standards • Complete BOS components • Instant export.",
      features: ["IEC Compliant", "AI-Powered", "Complete BOS", "Instant Export"],
      link: "/pv-designer",
      gradient: "from-[#10B981] to-[#3B82F6]",
      bg: "from-green-50 to-blue-50"
    },
    {
      icon: Zap,
      title: "Solar Simulator",
      description: "Quick solar PV simulation for initial feasibility. System sizing estimates • Energy modeling • ROI analysis.",
      features: ["Fast Estimates", "Energy Modeling", "ROI Analysis", "Free Tool"],
      link: "/solar-calculator",
      gradient: "from-[#6366F1] to-[#3B82F6]",
      bg: "from-purple-50 to-blue-50"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Products - AI-Powered Solar Design Tools | BAESS Labs</title>
        <meta name="description" content="Complete AI solar design suite. PV Designer, BESS Designer, BOQ Generator, Solar Simulator. 500+ engineers. IEC compliant. Free trial available." />
        <meta name="keywords" content="solar design software, BESS designer, BOQ generator, solar simulator, PV design tools, AI solar platform, energy storage design" />
        <link rel="canonical" href="https://www.baess.app/products" />
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

        {/* Hero */}
        <section className="relative pt-32 pb-20 bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-[#FFA500]/10 rounded-full px-4 py-2 mb-6">
                <Sparkles className="h-4 w-4 text-[#FFA500]" />
                <span className="text-sm font-semibold text-[#FFA500]">Complete Solar Design Suite</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0A2463] mb-6 leading-tight">
                AI-Powered Tools for Every
                <br />
                <span className="text-[#FFA500]">Stage of Solar Design</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-[#0A2463]/70 mb-8">
                Initial feasibility to construction-ready documents
                <br />Professional-grade tools trusted by 500+ engineers
              </p>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {products.map((product, index) => (
                <Card 
                  key={index} 
                  className={`group p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-[#FFA500] cursor-pointer bg-gradient-to-br ${product.bg}`}
                  onClick={() => navigate(product.link)}
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${product.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <product.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <h2 className="text-2xl font-black text-[#0A2463] mb-3">{product.title}</h2>
                  <p className="text-[#0A2463]/70 mb-6 leading-relaxed">{product.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    {product.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-[#0A2463]">
                        <CheckCircle2 className="w-4 h-4 text-[#10B981] mr-2 flex-shrink-0" />
                        <span className="font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    variant="outline"
                    className="w-full group-hover:bg-[#FFA500] group-hover:text-white group-hover:border-[#FFA500] transition-all font-semibold"
                  >
                    Learn More <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-[#FEF3C7]">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-black text-[#0A2463] mb-4">
                  Why Choose <span className="text-[#FFA500]">BAESS Labs</span>?
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { icon: Sparkles, title: "AI-First Platform", desc: "Industry's first AI-powered solar design platform" },
                  { icon: CheckCircle2, title: "IEC Compliant", desc: "All tools follow global engineering standards" },
                  { icon: Zap, title: "10x Faster", desc: "Complete designs in hours instead of weeks" }
                ].map((item, index) => (
                  <Card key={index} className="p-6 bg-white hover:shadow-lg transition-shadow text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#FFA500] to-[#F7931E] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <item.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[#0A2463] mb-2">{item.title}</h3>
                    <p className="text-sm text-[#0A2463]/70">{item.desc}</p>
                  </Card>
                ))}
              </div>
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
              Ready to Transform Your Solar Design Workflow?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Start with a free trial • No credit card required
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-white text-[#FFA500] hover:bg-[#0A2463] hover:text-white font-bold text-lg px-10"
            >
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-white/70 mt-4">
              Full access • Cancel anytime • Join 500+ engineers
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
