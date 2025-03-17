
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { ArrowRight, Sun, LineChart, Clock, Zap, BarChart3, Users, Shield } from "lucide-react";

const Index: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleGetStarted = () => {
    navigate("/auth");
  };

  const features = [
    {
      icon: <Sun className="h-10 w-10 text-solar" />,
      title: "Solar System Design",
      description: "Design your solar PV system with customizable parameters for location, panel type, and system size."
    },
    {
      icon: <LineChart className="h-10 w-10 text-solar" />,
      title: "Financial Analysis",
      description: "Calculate ROI, payback period, and NPV to understand the financial benefits of your investment."
    },
    {
      icon: <Clock className="h-10 w-10 text-solar" />,
      title: "25-Year Projections",
      description: "View detailed projections for energy production and cash flow over the system's lifetime."
    },
    {
      icon: <Zap className="h-10 w-10 text-solar" />,
      title: "Energy Calculation",
      description: "Estimate annual energy production based on your location and system specifications."
    },
    {
      icon: <BarChart3 className="h-10 w-10 text-solar" />,
      title: "Interactive Charts",
      description: "Visualize your data with beautiful, interactive charts for production and financial metrics."
    },
    {
      icon: <Users className="h-10 w-10 text-solar" />,
      title: "Client Reporting",
      description: "Generate professional PDF reports to share with clients or stakeholders."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-sky-50 to-white py-24 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center">
            <motion.div 
              className="lg:w-1/2 mb-12 lg:mb-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Solar PV Financial <span className="text-solar">Calculator</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-lg">
                Make data-driven decisions with our comprehensive solar PV financial analysis tool. Calculate ROI, payback periods, and environmental impact.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="text-lg bg-solar hover:bg-solar-dark text-white px-8 py-6"
                  onClick={handleGetStarted}
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>
            <motion.div 
              className="lg:w-1/2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="relative">
                <div className="bg-solar-light rounded-2xl shadow-2xl overflow-hidden">
                  <img 
                    src="/placeholder.svg" 
                    alt="Solar PV Calculator Dashboard" 
                    className="w-full h-auto transform scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-solar/20 to-transparent"></div>
                </div>
                <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-solar rounded-full flex items-center justify-center">
                  <Shield className="h-12 w-12 text-white" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our solar calculator provides everything you need to analyze and understand the financial aspects of your solar investment
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="mb-4 bg-solar-light rounded-full w-16 h-16 flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-solar-light">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to analyze your solar investment?</h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Sign up today and get access to our comprehensive solar financial calculator. Make informed decisions backed by data.
          </p>
          <Button 
            className="text-lg bg-solar hover:bg-solar-dark text-white px-8 py-6"
            onClick={handleGetStarted}
          >
            Get Started <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
