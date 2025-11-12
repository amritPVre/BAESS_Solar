import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home, ChevronRight, BookOpen, Zap, Calculator, FileText, DollarSign,
  BarChart3, Map, Settings, Award, TrendingUp, Search,
  Sun, Battery, Cable, Box, Layers, Target, CheckCircle2, PlayCircle,
  ArrowRight, Code, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Documentation = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('getting-started');

  const categories = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: <PlayCircle className="h-5 w-5" />,
      color: '#3B82F6',
      items: 7
    },
    {
      id: 'pv-design',
      name: 'PV System Design',
      icon: <Sun className="h-5 w-5" />,
      color: '#FFA500',
      items: 12
    },
    {
      id: 'boq-generation',
      name: 'BOQ Generation',
      icon: <FileText className="h-5 w-5" />,
      color: '#10B981',
      items: 8
    },
    {
      id: 'financial',
      name: 'Financial Analysis',
      icon: <DollarSign className="h-5 w-5" />,
      color: '#8B5CF6',
      items: 6
    },
    {
      id: 'utilities',
      name: 'Utility Tools',
      icon: <Calculator className="h-5 w-5" />,
      color: '#EF4444',
      items: 5
    },
    {
      id: 'api-integration',
      name: 'API & Integration',
      icon: <Code className="h-5 w-5" />,
      color: '#14B8A6',
      items: 4
    }
  ];

  const quickLinks = [
    { name: 'System Requirements', icon: <Settings className="h-4 w-4" />, link: '#system-requirements' },
    { name: 'Quick Start Guide', icon: <Zap className="h-4 w-4" />, link: '#quick-start' },
    { name: 'Video Tutorials', icon: <PlayCircle className="h-4 w-4" />, link: '#video-tutorials' },
    { name: 'API Documentation', icon: <Code className="h-4 w-4" />, link: '#api-docs' },
    { name: 'FAQ', icon: <BookOpen className="h-4 w-4" />, link: '/faq' },
    { name: 'Contact Support', icon: <Award className="h-4 w-4" />, link: '/contact' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEF3C7] via-white to-[#FEF3C7]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0A2463] to-[#0F2E5C] text-white sticky top-0 z-40 border-b border-[#FFA500]/20 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Link to="/" className="hover:text-[#FFA500] transition-colors flex-shrink-0">
                <Home className="h-4 w-4" />
              </Link>
              <ChevronRight className="h-3 w-3 text-white/50 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold truncate">
                  <span className="text-[#FFA500]">Documentation</span> Center
                </h1>
                <p className="text-white/70 text-xs sm:text-sm hidden sm:block">
                  Master PV AI Designer Pro
                </p>
              </div>
            </div>
            
            <Link to="/dashboard" className="flex-shrink-0">
              <Button size="sm" className="bg-[#FFA500] hover:bg-[#F7931E] text-white font-semibold text-xs sm:text-sm">
                Dashboard
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-3xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#0A2463]/40" />
          <Input
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 h-11 text-base border-2 border-[#FFA500]/20 focus:border-[#FFA500] rounded-xl"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-[#FFA500]/20 sticky top-20">
              <CardHeader>
                <CardTitle className="text-[#0A2463] flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#FFA500]" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 ${
                      selectedCategory === category.id
                        ? 'bg-gradient-to-r from-[#FFA500] to-[#F7931E] text-white shadow-lg scale-105'
                        : 'hover:bg-[#FEF3C7] text-[#0A2463]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            selectedCategory === category.id
                              ? 'bg-white/20'
                              : 'bg-[#FEF3C7]'
                          }`}
                          style={{ 
                            color: selectedCategory === category.id ? 'white' : category.color 
                          }}
                        >
                          {category.icon}
                        </div>
                        <span className="font-semibold">{category.name}</span>
                      </div>
                      <Badge 
                        className={selectedCategory === category.id ? 'bg-white/20 text-white' : ''}
                        style={{ 
                          backgroundColor: selectedCategory === category.id ? 'rgba(255,255,255,0.2)' : `${category.color}20`,
                          color: selectedCategory === category.id ? 'white' : category.color
                        }}
                      >
                        {category.items}
                      </Badge>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Quick Links - Horizontal at Top */}
            <Card className="border-2 border-[#3B82F6]/20 bg-gradient-to-r from-[#3B82F6]/5 to-white">
              <CardHeader>
                <CardTitle className="text-[#0A2463] flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#3B82F6]" />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.link}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-[#3B82F6]/10 transition-all hover:scale-105 text-center group border border-[#3B82F6]/10"
                    >
                      <div className="text-[#3B82F6] group-hover:scale-110 transition-transform">
                        {link.icon}
                      </div>
                      <span className="text-xs font-medium text-[#0A2463] group-hover:text-[#3B82F6]">
                        {link.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
            {selectedCategory === 'getting-started' && (
              <div className="space-y-6">
                <Card className="border-2 border-[#3B82F6]/20">
                  <CardHeader className="bg-gradient-to-r from-[#3B82F6]/10 to-white">
                    <CardTitle className="text-2xl text-[#0A2463] flex items-center gap-3">
                      <PlayCircle className="h-7 w-7 text-[#3B82F6]" />
                      Getting Started
                    </CardTitle>
                    <CardDescription className="text-base">
                      Learn the basics and get up to speed quickly
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="text-[#0A2463] font-semibold hover:text-[#FFA500]">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                            Creating Your First Account
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-[#0A2463]/80 space-y-3 pt-4">
                          <p>Follow these simple steps to create your account:</p>
                          <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>Click "Get Started" on the landing page</li>
                            <li>Fill in your email and create a secure password</li>
                            <li>Verify your email address</li>
                            <li>Complete your profile setup</li>
                            <li>Choose a subscription plan (Free plan available)</li>
                          </ol>
                          <div className="bg-[#3B82F6]/5 border-l-4 border-[#3B82F6] p-4 rounded-r-lg mt-4">
                            <p className="text-sm"><strong>💡 Tip:</strong> Use a work email for better collaboration features.</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-2">
                        <AccordionTrigger className="text-[#0A2463] font-semibold hover:text-[#FFA500]">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                            Understanding AI Credits
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-[#0A2463]/80 space-y-3 pt-4">
                          <p>AI Credits power the AI features in the platform:</p>
                          <ul className="space-y-2 ml-4">
                            <li className="flex items-start gap-2">
                              <Badge className="bg-[#FFA500] mt-1">1 Credit</Badge>
                              <span>AI BOQ Generation</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Badge className="bg-[#FFA500] mt-1">1 Credit</Badge>
                              <span>BOQ Pricing Analysis</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Badge className="bg-[#FFA500] mt-1">1 Credit</Badge>
                              <span>AI Feasibility Report Generation</span>
                            </li>
                          </ul>
                          <div className="bg-[#10B981]/5 border-l-4 border-[#10B981] p-4 rounded-r-lg mt-4">
                            <p className="text-sm"><strong>✅ Free Plan:</strong> Get 9 AI credits per month to try out the features!</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-3">
                        <AccordionTrigger className="text-[#0A2463] font-semibold hover:text-[#FFA500]">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                            Dashboard Overview
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-[#0A2463]/80 space-y-3 pt-4">
                          <p>Your dashboard provides quick access to:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                            <div className="flex items-start gap-3 p-3 bg-[#FEF3C7] rounded-lg">
                              <Calculator className="h-5 w-5 text-[#FFA500] mt-0.5" />
                              <div>
                                <p className="font-semibold text-sm">Advanced Calculator</p>
                                <p className="text-xs text-[#0A2463]/70">Complete PV system design</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-[#FEF3C7] rounded-lg">
                              <FileText className="h-5 w-5 text-[#10B981] mt-0.5" />
                              <div>
                                <p className="font-semibold text-sm">BOQ Generator</p>
                                <p className="text-xs text-[#0A2463]/70">Generate detailed BOQs</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-[#FEF3C7] rounded-lg">
                              <BarChart3 className="h-5 w-5 text-[#8B5CF6] mt-0.5" />
                              <div>
                                <p className="font-semibold text-sm">Projects</p>
                                <p className="text-xs text-[#0A2463]/70">Manage all projects</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-[#FEF3C7] rounded-lg">
                              <Settings className="h-5 w-5 text-[#3B82F6] mt-0.5" />
                              <div>
                                <p className="font-semibold text-sm">Settings</p>
                                <p className="text-xs text-[#0A2463]/70">Configure preferences</p>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-4">
                        <AccordionTrigger className="text-[#0A2463] font-semibold hover:text-[#FFA500]">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                            System Requirements
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-[#0A2463]/80 space-y-3 pt-4">
                          <p className="font-semibold">Minimum Requirements:</p>
                          <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                            <li>Stable internet connection (minimum 2 Mbps)</li>
                            <li>Screen resolution: 1366x768 or higher</li>
                            <li>JavaScript enabled</li>
                          </ul>
                          <p className="font-semibold mt-4">Recommended:</p>
                          <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Latest browser version for best performance</li>
                            <li>High-speed internet (10 Mbps or higher)</li>
                            <li>Full HD display (1920x1080) for optimal experience</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedCategory === 'pv-design' && (
              <div className="space-y-6">
                <Card className="border-2 border-[#FFA500]/20">
                  <CardHeader className="bg-gradient-to-r from-[#FFA500]/10 to-white">
                    <CardTitle className="text-2xl text-[#0A2463] flex items-center gap-3">
                      <Sun className="h-7 w-7 text-[#FFA500]" />
                      PV System Design Module
                    </CardTitle>
                    <CardDescription className="text-base">
                      Complete guide to designing solar PV systems
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-[#0A2463] mb-3 flex items-center gap-2">
                          <Target className="h-5 w-5 text-[#FFA500]" />
                          Design Workflow
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-start gap-4 p-4 bg-[#FEF3C7] rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-[#FFA500] text-white flex items-center justify-center font-bold flex-shrink-0">
                              1
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-[#0A2463] mb-1">Location & Site Details</h4>
                              <p className="text-sm text-[#0A2463]/70">Enter project location, select soil type, and configure site parameters</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-4 p-4 bg-[#FEF3C7] rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-[#FFA500] text-white flex items-center justify-center font-bold flex-shrink-0">
                              2
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-[#0A2463] mb-1">PV Area Modelling Tool</h4>
                              <p className="text-sm text-[#0A2463]/70">Draw PV arrays on map, configure tilt, azimuth, and structure types</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-4 p-4 bg-[#FEF3C7] rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-[#FFA500] text-white flex items-center justify-center font-bold flex-shrink-0">
                              3
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-[#0A2463] mb-1">Component Selection</h4>
                              <p className="text-sm text-[#0A2463]/70">Choose solar panels and inverters from comprehensive database</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-4 p-4 bg-[#FEF3C7] rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-[#FFA500] text-white flex items-center justify-center font-bold flex-shrink-0">
                              4
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-[#0A2463] mb-1">DC/AC Configuration</h4>
                              <p className="text-sm text-[#0A2463]/70">Configure string sizing, DC/AC design, and electrical parameters</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-4 p-4 bg-[#FEF3C7] rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-[#FFA500] text-white flex items-center justify-center font-bold flex-shrink-0">
                              5
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-[#0A2463] mb-1">Energy Simulation</h4>
                              <p className="text-sm text-[#0A2463]/70">Run PVWatts simulation to calculate energy production</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#3B82F6]/5 border-l-4 border-[#3B82F6] p-4 rounded-r-lg">
                        <p className="text-sm font-semibold text-[#0A2463] mb-2">
                          <Award className="h-4 w-4 inline mr-1 text-[#3B82F6]" />
                          Pro Tip:
                        </p>
                        <p className="text-sm text-[#0A2463]/80">
                          Save your project at each step to avoid losing progress. The platform auto-saves every 5 minutes, but manual saves are recommended.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Features Card */}
                <Card className="border-2 border-[#10B981]/20">
                  <CardHeader>
                    <CardTitle className="text-xl text-[#0A2463] flex items-center gap-2">
                      <Layers className="h-6 w-6 text-[#10B981]" />
                      Key Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3 p-3 border border-[#10B981]/20 rounded-lg">
                        <Map className="h-5 w-5 text-[#10B981] mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-sm text-[#0A2463]">Google Maps Integration</h4>
                          <p className="text-xs text-[#0A2463]/70 mt-1">Draw precise PV layouts on satellite imagery</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 border border-[#10B981]/20 rounded-lg">
                        <Battery className="h-5 w-5 text-[#10B981] mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-sm text-[#0A2463]">Auto String Sizing</h4>
                          <p className="text-xs text-[#0A2463]/70 mt-1">Intelligent string configuration based on inverter specs</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 border border-[#10B981]/20 rounded-lg">
                        <Cable className="h-5 w-5 text-[#10B981] mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-sm text-[#0A2463]">Cable Sizing</h4>
                          <p className="text-xs text-[#0A2463]/70 mt-1">Automatic cable sizing with voltage drop calculations</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 border border-[#10B981]/20 rounded-lg">
                        <Box className="h-5 w-5 text-[#10B981] mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-sm text-[#0A2463]">Component Library</h4>
                          <p className="text-xs text-[#0A2463]/70 mt-1">Extensive database of panels and inverters</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedCategory === 'boq-generation' && (
              <div className="space-y-6">
                <Card className="border-2 border-[#10B981]/20">
                  <CardHeader className="bg-gradient-to-r from-[#10B981]/10 to-white">
                    <CardTitle className="text-2xl text-[#0A2463] flex items-center gap-3">
                      <FileText className="h-7 w-7 text-[#10B981]" />
                      BOQ Generation with AI
                    </CardTitle>
                    <CardDescription className="text-base">
                      Generate comprehensive Bill of Quantities automatically
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <p className="text-[#0A2463]/80">
                      The AI-powered BOQ generator creates detailed material lists based on your PV system design:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-[#10B981]/5 rounded-xl border border-[#10B981]/20">
                        <div className="text-2xl font-bold text-[#10B981] mb-2">50+</div>
                        <p className="text-sm text-[#0A2463] font-semibold">BOQ Items</p>
                        <p className="text-xs text-[#0A2463]/70 mt-1">Comprehensive material coverage</p>
                      </div>
                      <div className="p-4 bg-[#3B82F6]/5 rounded-xl border border-[#3B82F6]/20">
                        <div className="text-2xl font-bold text-[#3B82F6] mb-2">1</div>
                        <p className="text-sm text-[#0A2463] font-semibold">AI Credit</p>
                        <p className="text-xs text-[#0A2463]/70 mt-1">Per BOQ generation</p>
                      </div>
                      <div className="p-4 bg-[#FFA500]/5 rounded-xl border border-[#FFA500]/20">
                        <div className="text-2xl font-bold text-[#FFA500] mb-2">&lt; 30s</div>
                        <p className="text-sm text-[#0A2463] font-semibold">Generation Time</p>
                        <p className="text-xs text-[#0A2463]/70 mt-1">Fast and accurate</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-[#0A2463] mb-3">BOQ Categories Include:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          'Solar Panels & Mounting',
                          'Inverters & Transformers',
                          'DC & AC Cables',
                          'Circuit Breakers & Protection',
                          'Earthing & Lightning Protection',
                          'Civil & Structural Work',
                          'Labor & Installation',
                          'Testing & Commissioning'
                        ].map((item) => (
                          <div key={item} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#FFA500]/10">
                            <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                            <span className="text-sm text-[#0A2463]">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedCategory === 'financial' && (
              <div className="space-y-6">
                <Card className="border-2 border-[#8B5CF6]/20">
                  <CardHeader className="bg-gradient-to-r from-[#8B5CF6]/10 to-white">
                    <CardTitle className="text-2xl text-[#0A2463] flex items-center gap-3">
                      <DollarSign className="h-7 w-7 text-[#8B5CF6]" />
                      Financial Analysis
                    </CardTitle>
                    <CardDescription className="text-base">
                      Comprehensive ROI and feasibility analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <p className="text-[#0A2463]/80">
                      Perform detailed financial analysis including NPV, IRR, and payback period calculations:
                    </p>

                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-[#8B5CF6]/5 to-white rounded-xl border border-[#8B5CF6]/20">
                        <h4 className="font-semibold text-[#0A2463] mb-2 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-[#8B5CF6]" />
                          Key Metrics
                        </h4>
                        <ul className="space-y-2 text-sm text-[#0A2463]/80">
                          <li>• Net Present Value (NPV)</li>
                          <li>• Internal Rate of Return (IRR)</li>
                          <li>• Payback Period</li>
                          <li>• Levelized Cost of Energy (LCOE)</li>
                          <li>• 25-Year Cash Flow Analysis</li>
                        </ul>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-[#10B981]/5 to-white rounded-xl border border-[#10B981]/20">
                        <h4 className="font-semibold text-[#0A2463] mb-2 flex items-center gap-2">
                          <Target className="h-5 w-5 text-[#10B981]" />
                          Customizable Parameters
                        </h4>
                        <ul className="space-y-2 text-sm text-[#0A2463]/80">
                          <li>• Electricity tariff and escalation rates</li>
                          <li>• O&M expenses and escalation</li>
                          <li>• Government subsidies</li>
                          <li>• Discount rate and tax considerations</li>
                          <li>• Annual degradation factors</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedCategory === 'utilities' && (
              <div className="space-y-6">
                <Card className="border-2 border-[#EF4444]/20">
                  <CardHeader className="bg-gradient-to-r from-[#EF4444]/10 to-white">
                    <CardTitle className="text-2xl text-[#0A2463] flex items-center gap-3">
                      <Calculator className="h-7 w-7 text-[#EF4444]" />
                      Utility Tools
                    </CardTitle>
                    <CardDescription className="text-base">
                      Standalone calculators for quick estimations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 border border-[#EF4444]/20 rounded-xl hover:shadow-lg transition-shadow">
                        <h4 className="font-semibold text-[#0A2463] mb-2">PV Area Modelling Tool</h4>
                        <p className="text-sm text-[#0A2463]/70">Calculate module capacity based on available area and layout</p>
                      </div>
                      <div className="p-4 border border-[#EF4444]/20 rounded-xl hover:shadow-lg transition-shadow">
                        <h4 className="font-semibold text-[#0A2463] mb-2">String Sizing Estimation App</h4>
                        <p className="text-sm text-[#0A2463]/70">Determine optimal string configuration for inverters</p>
                      </div>
                      <div className="p-4 border border-[#EF4444]/20 rounded-xl hover:shadow-lg transition-shadow">
                        <h4 className="font-semibold text-[#0A2463] mb-2">Advanced PV Design and Energy Modelling App</h4>
                        <p className="text-sm text-[#0A2463]/70">Complete system design with energy production simulation</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedCategory === 'api-integration' && (
              <div className="space-y-6">
                <Card className="border-2 border-[#14B8A6]/20">
                  <CardHeader className="bg-gradient-to-r from-[#14B8A6]/10 to-white">
                    <CardTitle className="text-2xl text-[#0A2463] flex items-center gap-3">
                      <Code className="h-7 w-7 text-[#14B8A6]" />
                      API & Integration
                    </CardTitle>
                    <CardDescription className="text-base">
                      Integrate PV AI Designer Pro with your systems
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="bg-[#14B8A6]/5 border-l-4 border-[#14B8A6] p-4 rounded-r-lg">
                      <p className="text-sm font-semibold text-[#0A2463] mb-2">
                        Coming Soon
                      </p>
                      <p className="text-sm text-[#0A2463]/80">
                        RESTful API and integrations are currently under development. Contact us for early access.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-[#0A2463] mb-3">Planned Features:</h4>
                      <div className="space-y-2">
                        {[
                          'RESTful API for project management',
                          'BOQ export to ERP systems',
                          'Third-party component database integration',
                          'Webhook support for real-time updates'
                        ].map((item) => (
                          <div key={item} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-[#14B8A6]/10">
                            <Badge className="bg-[#FFA500]">Soon</Badge>
                            <span className="text-sm text-[#0A2463]">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Link to="/contact">
                      <Button className="w-full bg-[#14B8A6] hover:bg-[#14B8A6]/90 text-white">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Contact for API Access
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#0A2463] to-[#0F2E5C] text-white py-16 border-t-4 border-[#FFA500] mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img 
                  src="/BAESS_logo_v02.png" 
                  alt="BAESS Labs" 
                  className="h-10 w-auto brightness-0 invert"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden">
                  <Award className="h-8 w-8 text-[#FFA500]" />
                  <span className="text-2xl font-black">BAESS</span>
                </div>
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-4">
                AI-powered solar PV design platform for engineers and contractors worldwide.
              </p>
              <div className="flex gap-3">
                <Badge className="bg-[#FFA500]">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Trusted by 1000+ Engineers
                </Badge>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/advanced-calculator" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    Advanced Calculator
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/account" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
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
                  <Link to="/blog" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/forum" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    Forum
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/documentation" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    FAQ
                  </Link>
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

          <div className="border-t border-white/10 pt-8">
            <p className="text-center text-white/50 text-sm">
              © 2025 BAESS Labs. All rights reserved. Built with ❤️ for solar engineers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Documentation;

