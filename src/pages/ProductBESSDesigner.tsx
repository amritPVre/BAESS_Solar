import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Battery, Zap, TrendingUp, Shield, Clock, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProductBESSDesigner() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Battery,
      title: "Intelligent Sizing",
      description: "AI-powered battery capacity calculations based on load profiles, solar generation, and backup requirements."
    },
    {
      icon: Zap,
      title: "Multiple Configurations",
      description: "DC-coupled, AC-coupled, and hybrid BESS configurations with automatic optimization."
    },
    {
      icon: TrendingUp,
      title: "Financial Analysis",
      description: "Complete ROI calculations, payback period, and lifetime savings analysis for battery storage."
    },
    {
      icon: Shield,
      title: "Safety Compliance",
      description: "Built-in safety checks following IEC 62619, UL 1973, and local electrical codes."
    },
    {
      icon: Clock,
      title: "Time-of-Use Optimization",
      description: "Peak shaving and load shifting strategies to maximize savings with TOU tariffs."
    },
    {
      icon: Sparkles,
      title: "One-Click Reports",
      description: "Professional BESS design reports with technical specs, BOQ, and financial projections."
    }
  ];

  const benefits = [
    "Design 10kWh to 10MWh systems",
    "Residential to utility-scale support",
    "Component database (batteries, inverters)",
    "Grid independence calculations",
    "Backup duration analysis",
    "Integration with solar PV designs"
  ];

  return (
    <>
      <Helmet>
        <title>BESS Designer - Battery Energy Storage System Calculator | BAESS Labs</title>
        <meta name="description" content="Professional BESS design tool. Size battery storage systems, calculate ROI, and generate technical reports. AI-powered battery calculator for 10kWh to 10MWh projects. IEC compliant." />
        <meta name="keywords" content="BESS designer, battery storage calculator, energy storage system, BESS sizing tool, battery calculator, ESS design software" />
        <link rel="canonical" href="https://baess.app/products/bess-designer" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
              <Battery className="h-4 w-4" />
              <span className="text-sm font-medium">Battery Energy Storage System Designer</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Design Battery Storage Systems in Minutes
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Professional BESS design tool with AI-powered sizing, financial analysis, and technical reports. 
              From 10kWh residential systems to 10MWh utility-scale projects.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8"
              >
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/bess-designer')}
                className="text-lg px-8"
              >
                View Demo
              </Button>
            </div>

            <p className="text-sm text-gray-500 mt-4">
              No credit card required • Full access • Used by 500+ engineers
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Complete BESS Design Solution</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to design, size, and specify battery energy storage systems
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-blue-600 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">Why Choose Our BESS Designer?</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-1" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Input Requirements</h3>
              <p className="text-gray-600">
                Enter load profile, solar generation, and backup needs. Our AI analyzes your data.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Optimization</h3>
              <p className="text-gray-600">
                Get optimized battery capacity, inverter sizing, and configuration recommendations.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Export Report</h3>
              <p className="text-gray-600">
                Generate professional reports with BOQ, technical specs, and financial analysis.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Design Your First BESS Project?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join 500+ engineers using BAESS Labs for battery storage design
            </p>
            <Button 
              size="lg"
              variant="secondary"
              onClick={() => navigate('/auth')}
              className="text-lg px-8"
            >
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>
        </section>
      </div>
    </>
  );
}

