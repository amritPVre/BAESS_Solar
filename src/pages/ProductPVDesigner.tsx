import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lightbulb, MapPin, Calculator, FileText, DollarSign, Cpu, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProductPVDesigner() {
  const navigate = useNavigate();

  const features = [
    {
      icon: MapPin,
      title: "3D Site Mapping",
      description: "Draw solar arrays on satellite imagery with automatic area calculations and shading analysis."
    },
    {
      icon: Calculator,
      title: "String Sizing Calculator",
      description: "Automatic module-to-inverter optimization with temperature coefficients and voltage calculations."
    },
    {
      icon: FileText,
      title: "AI-Powered BOQ",
      description: "Generate complete Bill of Quantities with AI following IEC standards. Includes all BOS components."
    },
    {
      icon: DollarSign,
      title: "Financial Modeling",
      description: "NPV, IRR, payback period, and lifetime savings analysis following global best practices."
    },
    {
      icon: Lightbulb,
      title: "Energy Simulation",
      description: "NREL-validated PV performance modeling with monthly/annual production forecasts."
    },
    {
      icon: Cpu,
      title: "AI Design Assistant",
      description: "Get instant design recommendations, component suggestions, and optimization tips powered by AI."
    }
  ];

  const capabilities = [
    "5kW to 50MW+ system design",
    "Rooftop & ground-mount support",
    "Single & three-phase systems",
    "DC & AC side calculations",
    "Cable & breaker sizing",
    "Structural load analysis",
    "Grid integration studies",
    "Professional PDF reports"
  ];

  return (
    <>
      <Helmet>
        <title>AI PV Designer Pro - Solar PV System Design Software | BAESS Labs</title>
        <meta name="description" content="Professional solar PV design software with AI-powered BOQ generation. Design 5kW to 50MW systems. 3D mapping, string sizing, financial analysis. Used by 500+ solar engineers. IEC compliant." />
        <meta name="keywords" content="solar PV design software, AI solar calculator, solar design tool, PV system calculator, solar engineering software, photovoltaic design" />
        <link rel="canonical" href="https://baess.app/products/pv-designer" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-gray-50">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">AI-Powered Solar PV Design Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
              Design Solar PV Systems 10x Faster with AI
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Complete solar PV design platform with 3D mapping, automatic string sizing, AI-powered BOQ generation, 
              and financial analysis. From concept to construction-ready in hours, not weeks.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-lg px-8"
              >
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/pv-designer')}
                className="text-lg px-8 border-orange-600 text-orange-600 hover:bg-orange-50"
              >
                View Demo
              </Button>
            </div>

            <p className="text-sm text-gray-500 mt-4">
              No credit card required • Full access • First AI-powered solar design platform
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">500+</div>
              <div className="text-gray-600">Engineers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">10x</div>
              <div className="text-gray-600">Faster Design</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">99%</div>
              <div className="text-gray-600">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">IEC</div>
              <div className="text-gray-600">Compliant</div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Complete Solar PV Design Suite</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need from initial feasibility to construction-ready documents
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <feature.icon className="h-12 w-12 text-orange-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Capabilities */}
        <section className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">What You Can Design</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {capabilities.map((capability, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-1" />
                    <span className="text-lg">{capability}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold mb-12 text-center">From Concept to Construction in 3 Steps</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Map Your Site</h3>
              <p className="text-gray-600">
                Draw solar arrays on satellite imagery. Calculate available area with precision tools.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Generates Design</h3>
              <p className="text-gray-600">
                Get optimized string configuration, complete BOQ, and financial analysis automatically.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Export & Share</h3>
              <p className="text-gray-600">
                Professional PDF reports with technical specs, BOQ, and financial projections ready for clients.
              </p>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="container mx-auto px-4 py-16">
          <Card className="p-8">
            <h2 className="text-3xl font-bold mb-8 text-center">Traditional Design vs AI-Powered Design</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-500">Traditional Method</h3>
                <ul className="space-y-3 text-gray-600">
                  <li>• Manual calculations in Excel</li>
                  <li>• 2-3 weeks per project</li>
                  <li>• Prone to human error</li>
                  <li>• Limited optimization</li>
                  <li>• Outdated component data</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4 text-orange-600">With AI PV Designer Pro</h3>
                <ul className="space-y-3 text-orange-700 font-medium">
                  <li>✓ Automated AI calculations</li>
                  <li>✓ 4-6 hours per project</li>
                  <li>✓ 99%+ accuracy guaranteed</li>
                  <li>✓ AI-powered optimization</li>
                  <li>✓ Real-time component database</li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16">
          <Card className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Design Your First Solar Project with AI?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join 500+ engineers who've switched from spreadsheets to AI-powered design
            </p>
            <Button 
              size="lg"
              variant="secondary"
              onClick={() => navigate('/auth')}
              className="text-lg px-8"
            >
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm mt-4 opacity-75">
              Full access • No credit card • Cancel anytime
            </p>
          </Card>
        </section>
      </div>
    </>
  );
}

