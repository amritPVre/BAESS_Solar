import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Briefcase, Heart, Coffee, Zap, Users, Globe, Award, Shield } from 'lucide-react';
import { Helmet } from 'react-helmet';

const Careers = () => {
  const benefits = [
    {
      icon: <Heart className="h-6 w-6" />,
      title: 'Health & Wellness',
      description: 'Comprehensive health insurance and wellness programs'
    },
    {
      icon: <Coffee className="h-6 w-6" />,
      title: 'Work-Life Balance',
      description: 'Flexible hours and remote work options'
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Growth Opportunities',
      description: 'Professional development and learning budget'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Amazing Team',
      description: 'Collaborative culture with passionate people'
    }
  ];

  const openPositions = [
    {
      title: 'Senior Full-Stack Developer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description: 'Build and scale our AI-powered solar design platform using React, Node.js, and modern cloud technologies.'
    },
    {
      title: 'Solar Systems Engineer',
      department: 'Product',
      location: 'Hybrid',
      type: 'Full-time',
      description: 'Work with our engineering team to enhance solar design algorithms and validate technical accuracy.'
    },
    {
      title: 'AI/ML Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description: 'Develop and optimize AI models for BOQ generation, feasibility analysis, and intelligent design recommendations.'
    },
    {
      title: 'Product Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      description: 'Create intuitive and beautiful user experiences for solar professionals using our platform.'
    },
    {
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Hybrid',
      type: 'Full-time',
      description: 'Help solar professionals get the most value from our platform and drive customer satisfaction.'
    },
    {
      title: 'Technical Content Writer',
      department: 'Marketing',
      location: 'Remote',
      type: 'Part-time',
      description: 'Create technical documentation, blog posts, and educational content for solar engineering audience.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Careers | BAESS Labs</title>
        <meta name="description" content="Join BAESS Labs and help revolutionize solar design with AI. Explore open positions and be part of the renewable energy revolution." />
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
                Join Our <span className="text-[#FFA500]">Mission</span>
              </h1>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                Help us revolutionize solar design with AI and accelerate the global transition to renewable energy
              </p>
            </div>

            {/* Benefits */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">Why Join BAESS Labs?</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {benefits.map((benefit, index) => (
                  <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="p-3 bg-[#FFA500] rounded-lg text-white w-fit mb-4">
                        {benefit.icon}
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">{benefit.title}</h3>
                      <p className="text-white/80 text-sm">{benefit.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Open Positions */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">Open Positions</h2>
              <div className="space-y-6 max-w-4xl mx-auto">
                {openPositions.map((position, index) => (
                  <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <CardTitle className="text-xl text-white mb-2">{position.title}</CardTitle>
                          <CardDescription className="text-white/70">{position.description}</CardDescription>
                        </div>
                        <Button className="bg-[#FFA500] hover:bg-[#F7931E] text-white">
                          Apply Now
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-3">
                        <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {position.department}
                        </Badge>
                        <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                          <MapPin className="h-3 w-3 mr-1" />
                          {position.location}
                        </Badge>
                        <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                          <Clock className="h-3 w-3 mr-1" />
                          {position.type}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Culture Section */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-16">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">Our Culture</h2>
                <div className="prose prose-lg max-w-none text-white/80 space-y-4">
                  <p>
                    At BAESS Labs, we believe that great products are built by great teams. We foster a culture of 
                    innovation, collaboration, and continuous learning where every voice matters.
                  </p>
                  <p>
                    We're a diverse team of engineers, designers, and solar professionals united by a common mission: 
                    to make solar design smarter, faster, and more accessible. Whether you're working remotely or from 
                    our office, you'll be part of a supportive environment that values work-life balance and personal growth.
                  </p>
                  <p>
                    We celebrate wins together, learn from failures, and constantly push ourselves to deliver exceptional 
                    value to our customers. If you're passionate about renewable energy and technology, you'll feel right at home here.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* CTA Section */}
            <div className="text-center">
              <Card className="bg-gradient-to-r from-[#FFA500] to-[#F7931E] border-0">
                <CardContent className="py-12">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Don't See Your Role?
                  </h2>
                  <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                    We're always looking for talented people to join our team. Send us your resume and let us know how you can contribute.
                  </p>
                  <Button size="lg" className="bg-white text-[#FFA500] hover:bg-white/90 font-semibold">
                    Send General Application
                  </Button>
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

export default Careers;

