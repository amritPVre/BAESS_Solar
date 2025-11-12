import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Bug, Zap, Package, Users, Globe, Award, Shield } from 'lucide-react';
import { Helmet } from 'react-helmet';

const Changelog = () => {
  const releases = [
    {
      version: '2.0.0',
      date: 'January 30, 2025',
      type: 'Major Release',
      changes: [
        { type: 'feature', text: 'AI-powered BOQ generation with OpenAI GPT-4 and Google Gemini integration' },
        { type: 'feature', text: 'Advanced subscription management with tiered AI credit system' },
        { type: 'feature', text: 'Comprehensive financial analysis tools with 25-year projections' },
        { type: 'feature', text: 'AI-generated feasibility reports with SWOT analysis' },
        { type: 'improvement', text: 'Enhanced AC/DC system configuration with automatic cable sizing' },
        { type: 'improvement', text: 'Professional PDF report generation with custom branding' }
      ]
    },
    {
      version: '1.5.0',
      date: 'January 15, 2025',
      type: 'Feature Update',
      changes: [
        { type: 'feature', text: 'Interactive Google Maps integration for site area calculation' },
        { type: 'feature', text: 'Advanced module placement algorithm with multiple structure types' },
        { type: 'feature', text: 'Real-time energy simulation using NREL PVWatts API' },
        { type: 'improvement', text: 'Enhanced string sizing calculator with temperature compensation' },
        { type: 'improvement', text: 'Support for HV String and HV Central inverter configurations' }
      ]
    },
    {
      version: '1.2.0',
      date: 'December 20, 2024',
      type: 'Feature Update',
      changes: [
        { type: 'feature', text: 'Component library with 1000+ solar panels and inverters' },
        { type: 'feature', text: 'Project management dashboard with cloud storage' },
        { type: 'improvement', text: 'Improved cable sizing with derating factor calculations' },
        { type: 'improvement', text: 'Circuit breaker selection automation' },
        { type: 'fix', text: 'Fixed AC configuration data persistence issues' }
      ]
    },
    {
      version: '1.0.0',
      date: 'November 10, 2024',
      type: 'Initial Release',
      changes: [
        { type: 'feature', text: 'Core solar PV design calculator' },
        { type: 'feature', text: 'Basic BOQ generation' },
        { type: 'feature', text: 'User authentication and profiles' },
        { type: 'feature', text: 'Project save and export functionality' }
      ]
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return <Sparkles className="h-4 w-4 text-green-500" />;
      case 'improvement':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'fix':
        return <Bug className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Major Release':
        return <Badge className="bg-[#FFA500] text-white">Major Release</Badge>;
      case 'Feature Update':
        return <Badge className="bg-blue-500 text-white">Feature Update</Badge>;
      case 'Initial Release':
        return <Badge className="bg-purple-500 text-white">Initial Release</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <title>Changelog | BAESS Labs</title>
        <meta name="description" content="Stay up to date with the latest features, improvements, and bug fixes in BAESS Labs solar design platform." />
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
                Product <span className="text-[#FFA500]">Changelog</span>
              </h1>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                Track our latest features, improvements, and updates as we continuously enhance your solar design experience
              </p>
            </div>

            {/* Timeline */}
            <div className="max-w-4xl mx-auto space-y-8">
              {releases.map((release, index) => (
                <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <CardTitle className="text-2xl text-white mb-2">
                          Version {release.version}
                        </CardTitle>
                        <p className="text-white/70">{release.date}</p>
                      </div>
                      {getTypeBadge(release.type)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {release.changes.map((change, changeIndex) => (
                        <li key={changeIndex} className="flex items-start gap-3 text-white/90">
                          {getTypeIcon(change.type)}
                          <span className="flex-1">{change.text}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* CTA Section */}
            <div className="mt-16 text-center">
              <Card className="bg-gradient-to-r from-[#FFA500] to-[#F7931E] border-0">
                <CardContent className="py-12">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Stay Updated
                  </h2>
                  <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                    Subscribe to our newsletter to get notified about new features and updates
                  </p>
                  <Link to="/auth">
                    <Button size="lg" className="bg-white text-[#FFA500] hover:bg-white/90 font-semibold">
                      Get Started Free
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

export default Changelog;

