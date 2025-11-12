import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ArrowLeft, Target, Eye, Lightbulb, Users, Award, TrendingUp, Globe, Shield } from 'lucide-react';
import { Helmet } from 'react-helmet';

const AboutUs = () => {
  const values = [
    {
      icon: <Lightbulb className="h-8 w-8" />,
      title: 'Innovation',
      description: 'Continuously pushing boundaries with AI-powered solutions for solar design'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Customer-Centric',
      description: 'Building tools that solve real problems for solar professionals worldwide'
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: 'Excellence',
      description: 'Committed to delivering the highest quality solar design and engineering tools'
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: 'Growth',
      description: 'Empowering businesses to scale and succeed in the renewable energy sector'
    }
  ];

  const stats = [
    { value: '100MW+', label: 'Design Capacity' },
    { value: '50+', label: 'BOQ Items with AI' },
    { value: '5+', label: 'Utility Apps' },
    { value: '95%', label: 'Time Saved' }
  ];

  return (
    <>
      <Helmet>
        <title>About Us | BAESS Labs</title>
        <meta name="description" content="Learn about BAESS Labs - Next-generation solar intelligence platform powered by AI, revolutionizing solar design and engineering." />
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
                About <span className="text-[#FFA500]">BAESS Labs</span>
              </h1>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                Next-generation solar intelligence platform powered by AI
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              {stats.map((stat, index) => (
                <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="text-center py-8">
                    <div className="text-4xl font-black text-[#FFA500] mb-2">
                      {stat.value}
                    </div>
                    <div className="text-white/80">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Mission & Vision */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-[#FFA500] rounded-lg">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Our Mission</h2>
                  </div>
                  <p className="text-white/80 text-lg leading-relaxed">
                    To revolutionize solar design and engineering by providing intelligent, AI-powered tools 
                    that empower professionals to design better, faster, and more efficiently. We're committed 
                    to accelerating the global transition to renewable energy through innovation and technology.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-[#FFA500] rounded-lg">
                      <Eye className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Our Vision</h2>
                  </div>
                  <p className="text-white/80 text-lg leading-relaxed">
                    To become the world's leading solar intelligence platform, trusted by engineers, consultants, 
                    and EPCs globally. We envision a future where every solar project is optimized through 
                    AI-driven insights, making clean energy accessible and affordable for everyone.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Story Section */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-16">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">Our Story</h2>
                <div className="prose prose-lg max-w-none text-white/80 space-y-4">
                  <p>
                    BAESS Labs was born from a simple observation: solar design professionals spend countless hours 
                    on repetitive calculations, manual BOQ generation, and complex system sizing. We knew there had 
                    to be a better way.
                  </p>
                  <p>
                    Founded by experienced solar engineers and AI specialists, we set out to build a platform that 
                    combines deep domain expertise with cutting-edge artificial intelligence. Our goal was to create 
                    tools that not only automate tedious tasks but also provide intelligent recommendations that improve 
                    design quality.
                  </p>
                  <p>
                    Today, BAESS Labs serves professionals across the globe, helping them design solar systems faster, 
                    more accurately, and with greater confidence. From small residential installations to large-scale 
                    utility projects, our platform handles it all.
                  </p>
                  <p>
                    We're just getting started. As we continue to innovate and expand, our commitment remains unchanged: 
                    to empower solar professionals with the best tools in the industry.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Values */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">Our Values</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {values.map((value, index) => (
                  <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="p-3 bg-[#FFA500] rounded-lg text-white w-fit mb-4">
                        {value.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                      <p className="text-white/80">{value.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center">
              <Card className="bg-gradient-to-r from-[#FFA500] to-[#F7931E] border-0">
                <CardContent className="py-12">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Join Us on Our Journey
                  </h2>
                  <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                    Be part of the solar revolution. Start designing smarter with BAESS Labs today.
                  </p>
                  <div className="flex gap-4 justify-center flex-wrap">
                    <Link to="/auth">
                      <Button size="lg" className="bg-white text-[#FFA500] hover:bg-white/90 font-semibold">
                        Get Started Free
                      </Button>
                    </Link>
                    <Link to="/careers">
                      <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-[#FFA500] font-semibold">
                        Join Our Team
                      </Button>
                    </Link>
                  </div>
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

export default AboutUs;

