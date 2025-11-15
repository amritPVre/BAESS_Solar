import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/card";
import { Card } from "@/components/ui/card";
import { Battery, Lightbulb, FileText, Calculator, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Products() {
  const navigate = useNavigate();

  const products = [
    {
      icon: Lightbulb,
      title: "AI PV Designer Pro",
      description: "Complete solar PV design platform with 3D mapping, string sizing, and AI-powered BOQ generation.",
      features: ["3D Site Mapping", "Auto String Sizing", "Financial Analysis", "5kW to 50MW"],
      link: "/products/pv-designer",
      color: "orange"
    },
    {
      icon: Battery,
      title: "BESS Designer",
      description: "Professional battery energy storage system design tool with intelligent sizing and ROI analysis.",
      features: ["Intelligent Sizing", "TOU Optimization", "Safety Compliance", "10kWh to 10MWh"],
      link: "/products/bess-designer",
      color: "blue"
    },
    {
      icon: FileText,
      title: "AI BOQ Generator",
      description: "Automated Bill of Quantities generation following IEC standards with complete BOS components.",
      features: ["IEC Compliant", "AI-Powered", "Complete BOS", "Instant Export"],
      link: "/pv-designer",
      color: "green"
    },
    {
      icon: Calculator,
      title: "Solar Calculator",
      description: "Quick solar PV calculations for initial feasibility and system sizing estimates.",
      features: ["Fast Estimates", "Energy Modeling", "ROI Calculator", "Free Tool"],
      link: "/solar-calculator",
      color: "purple"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Products - AI-Powered Solar Design Tools | BAESS Labs</title>
        <meta name="description" content="Complete suite of AI-powered solar design tools. PV Designer, BESS Designer, BOQ Generator, and Solar Calculator. Used by 500+ engineers worldwide." />
        <meta name="keywords" content="solar design software, BESS designer, BOQ generator, solar calculator, PV design tools" />
        <link rel="canonical" href="https://baess.app/products" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6">
              Complete Solar Design Suite
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              AI-powered tools for every stage of solar project design - from initial feasibility to construction-ready documents
            </p>
          </div>
        </section>

        {/* Products Grid */}
        <section className="container mx-auto px-4 pb-20">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {products.map((product, index) => (
              <Card key={index} className="p-8 hover:shadow-xl transition-shadow">
                <div className={`w-16 h-16 bg-${product.color}-100 rounded-lg flex items-center justify-center mb-6`}>
                  <product.icon className={`h-8 w-8 text-${product.color}-600`} />
                </div>
                
                <h2 className="text-2xl font-bold mb-3">{product.title}</h2>
                <p className="text-gray-600 mb-6">{product.description}</p>
                
                <ul className="space-y-2 mb-6">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-600">
                      <span className={`w-1.5 h-1.5 bg-${product.color}-600 rounded-full mr-2`}></span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  onClick={() => navigate(product.link)}
                  variant="outline"
                  className="w-full"
                >
                  Learn More <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-16">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-12 text-center max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Solar Design Workflow?</h2>
            <p className="text-xl mb-8 opacity-90">
              Start with a free trial - no credit card required
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

