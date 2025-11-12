import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ArrowLeft, Zap, Database, Cloud, Code, Boxes, Workflow, CheckCircle, Users, Globe, Award, Shield } from 'lucide-react';
import { Helmet } from 'react-helmet';

const Integrations = () => {
  const integrations = [
    {
      name: 'PVWatts API',
      description: 'Direct integration with NREL\'s PVWatts for accurate solar energy calculations',
      icon: <Zap className="h-8 w-8" />,
      status: 'Active',
      category: 'Energy Simulation'
    },
    {
      name: 'Google Maps API',
      description: 'High-resolution satellite imagery and location-based services',
      icon: <Cloud className="h-8 w-8" />,
      status: 'Active',
      category: 'Mapping'
    },
    {
      name: 'OpenAI GPT-4',
      description: 'AI-powered BOQ generation and intelligent design recommendations',
      icon: <Code className="h-8 w-8" />,
      status: 'Active',
      category: 'AI Services'
    },
    {
      name: 'Google Gemini',
      description: 'Advanced AI model for feasibility reports and analysis',
      icon: <Code className="h-8 w-8" />,
      status: 'Active',
      category: 'AI Services'
    },
    {
      name: 'Supabase',
      description: 'Cloud database and authentication infrastructure',
      icon: <Database className="h-8 w-8" />,
      status: 'Active',
      category: 'Backend'
    },
    {
      name: 'REST API',
      description: 'Full-featured REST API for third-party integrations (Coming Soon)',
      icon: <Workflow className="h-8 w-8" />,
      status: 'Coming Soon',
      category: 'Developer Tools'
    },
    {
      name: 'Webhooks',
      description: 'Real-time event notifications for workflow automation (Coming Soon)',
      icon: <Boxes className="h-8 w-8" />,
      status: 'Coming Soon',
      category: 'Developer Tools'
    }
  ];

  const features = [
    'Real-time data synchronization',
    'Secure OAuth 2.0 authentication',
    'Comprehensive API documentation',
    'Webhook support for automation',
    'Rate limiting and monitoring',
    'Enterprise-grade security'
  ];

  return (
    <>
      <Helmet>
        <title>Integrations | BAESS Labs</title>
        <meta name="description" content="Explore BAESS Labs integrations with industry-leading platforms and services for solar design and engineering." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#0A2463] via-[#1e3a8a] to-[#0A2463]">
        {/* Header */}
        <header className="bg-[#0A2463]/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2">
                <img
                  src="/BAESS_logo_v02.png"
                  alt="BAESS Labs"
                  className="h-10 w-auto object-contain brightness-0 invert"
                />
              </Link>
              <Link to="/">
                <Button variant="outline" className="flex items-center gap-2 border-[#FFA500] text-[#FFA500] hover:bg-[#FFA500] hover:text-white hover:border-[#FFA500]">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
                Powerful <span className="text-[#FFA500]">Integrations</span>
              </h1>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                Connect with industry-leading platforms and services to supercharge your solar design workflow
              </p>
            </div>

            {/* Integration Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {integrations.map((integration, index) => (
                <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-[#FFA500] rounded-lg text-white">
                        {integration.icon}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        integration.status === 'Active' 
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                          : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      }`}>
                        {integration.status}
                      </span>
                    </div>
                    <CardTitle className="text-white">{integration.name}</CardTitle>
                    <CardDescription className="text-white/70">{integration.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80 text-sm">{integration.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Features Section */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Integration Features</CardTitle>
                <CardDescription className="text-white/70">
                  Everything you need for seamless connectivity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 text-white">
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CTA Section */}
            <div className="mt-16 text-center">
              <Card className="bg-gradient-to-r from-[#FFA500] to-[#F7931E] border-0">
                <CardContent className="py-12">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Need a Custom Integration?
                  </h2>
                  <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                    Our Enterprise plan includes custom integration support. Contact our team to discuss your specific requirements.
                  </p>
                  <Link to="/auth">
                    <Button size="lg" className="bg-white text-[#FFA500] hover:bg-white/90 font-semibold">
                      Contact Sales
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
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
                    <Link to="/#features" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link to="/#pricing" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                      Pricing
                    </Link>
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
                    <a href="#" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                      Press Kit
                    </a>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className="text-sm font-bold text-white mb-4">Resources</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                      Help Center
                    </a>
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
      </div>
    </>
  );
};

export default Integrations;

