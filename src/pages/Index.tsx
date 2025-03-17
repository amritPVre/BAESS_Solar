
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.6 }
    }
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
                <div className="bg-solar-light rounded-2xl shadow-2xl overflow-hidden p-2">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      duration: 0.8,
                      type: "spring", 
                      stiffness: 100 
                    }}
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1613665813446-82a78b7127aa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" 
                      alt="Solar panels on house roof" 
                      className="w-full h-auto rounded-xl"
                    />
                  </motion.div>
                  
                  <motion.div 
                    className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md"
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <div className="text-sm font-medium">Annual Savings</div>
                    <div className="text-xl font-bold text-solar">$1,250+</div>
                  </motion.div>
                  
                  <motion.div 
                    className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                  >
                    <div className="text-sm font-medium">CO₂ Reduction</div>
                    <div className="text-xl font-bold text-green-500">4.2 tons/year</div>
                  </motion.div>
                </div>
                
                <motion.div 
                  className="absolute -bottom-6 -right-6 h-24 w-24 bg-solar rounded-full flex items-center justify-center"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.3, type: "spring" }}
                >
                  <Shield className="h-12 w-12 text-white" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <motion.div 
          className="absolute top-1/4 left-5 h-20 w-20 bg-yellow-100 rounded-full opacity-70"
          animate={{ 
            y: [0, -15, 0],
            x: [0, 5, 0]
          }}
          transition={{ 
            repeat: Infinity,
            duration: 8,
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute top-2/3 right-10 h-12 w-12 bg-blue-100 rounded-full opacity-60"
          animate={{ 
            y: [0, 20, 0],
            x: [0, -10, 0]
          }}
          transition={{ 
            repeat: Infinity,
            duration: 7,
            ease: "easeInOut" 
          }}
        />
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
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                variants={itemVariants}
              >
                <div className="mb-4 bg-solar-light rounded-full w-16 h-16 flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
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
