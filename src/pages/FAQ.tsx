import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Home, ChevronRight, ChevronDown, Zap, Calculator,
  DollarSign, FileText, Sparkles, CreditCard, Database,
  HelpCircle, MessageSquare, BookOpen, Users, Shield,
  Award, TrendingUp, Settings, ArrowRight
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
} from '@/components/ui/accordion';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

interface FAQCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

export const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories: FAQCategory[] = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: <Zap className="h-5 w-5" />,
      color: '#FFA500',
      description: 'Learn the basics of PV AI Designer Pro'
    },
    {
      id: 'advanced-calculator',
      name: 'Advanced PV System Modelling App',
      icon: <Calculator className="h-5 w-5" />,
      color: '#3B82F6',
      description: 'PV system design and calculations'
    },
    {
      id: 'boq-generation',
      name: 'BOQ Generation',
      icon: <FileText className="h-5 w-5" />,
      color: '#10B981',
      description: 'AI-powered bill of quantities'
    },
    {
      id: 'financial-analysis',
      name: 'Financial Analysis',
      icon: <DollarSign className="h-5 w-5" />,
      color: '#8B5CF6',
      description: 'ROI and financial metrics'
    },
    {
      id: 'ai-features',
      name: 'AI Features',
      icon: <Sparkles className="h-5 w-5" />,
      color: '#EC4899',
      description: 'AI credits and smart features'
    },
    {
      id: 'reports',
      name: 'Reports & PDF',
      icon: <BookOpen className="h-5 w-5" />,
      color: '#F59E0B',
      description: 'Generate professional reports'
    },
    {
      id: 'subscription',
      name: 'Subscription & Billing',
      icon: <CreditCard className="h-5 w-5" />,
      color: '#EF4444',
      description: 'Plans and AI credits'
    },
    {
      id: 'account',
      name: 'Account & Security',
      icon: <Shield className="h-5 w-5" />,
      color: '#06B6D4',
      description: 'Profile and security settings'
    }
  ];

  const faqs: FAQItem[] = [
    // Getting Started
    {
      category: 'getting-started',
      question: 'What is PV AI Designer Pro?',
      answer: 'PV AI Designer Pro is an advanced solar photovoltaic system design platform powered by artificial intelligence. It helps engineers, contractors, and project owners design, analyze, and generate comprehensive documentation for solar PV installations. The platform combines precise engineering calculations with AI-powered automation to streamline the entire design workflow.'
    },
    {
      category: 'getting-started',
      question: 'How do I get started with my first project?',
      answer: '1. Sign in to your account\n2. Go to Dashboard and click "New Project"\n3. Choose "Advanced Solar Calculator"\n4. Enter your project location to get weather data\n5. Use the map-based area designer to draw your installation zones\n6. Select solar panels and inverters from our database\n7. Configure DC and AC systems\n8. Generate BOQ and financial analysis\n9. Export comprehensive PDF reports'
    },
    {
      category: 'getting-started',
      question: 'What makes PV AI Designer Pro different from other solar design tools?',
      answer: 'PV AI Designer Pro stands out with: (1) AI-powered BOQ generation that creates detailed bills of quantities automatically, (2) Comprehensive financial analysis with 25-year projections, (3) Real-time weather data integration using NREL APIs, (4) Advanced string sizing with automatic MPPT optimization, (5) Interactive map-based design with Google Maps, (6) AI-generated feasibility reports, and (7) Complete component database with 1000+ panels and inverters.'
    },
    {
      category: 'getting-started',
      question: 'Do I need any technical knowledge to use the platform?',
      answer: 'PV AI Designer Pro is designed for both experts and beginners. Basic users can utilize AI-powered automation and templates, while advanced users have full control over engineering parameters. The platform provides intelligent suggestions and validation to ensure technically sound designs regardless of your experience level.'
    },

    // Advanced Calculator
    {
      category: 'advanced-calculator',
      question: 'How does the Advanced PV Design and Energy Modelling App work?',
      answer: 'The Advanced PV Design and Energy Modelling App uses a multi-step workflow: (1) Location & Weather Data - automatically fetches irradiance and temperature data, (2) Area Design - draw installation zones on satellite maps with precision tools, (3) Component Selection - choose from 1000+ verified panels and inverters, (4) String Sizing - AI optimizes string lengths and MPPT assignments, (5) AC Configuration - design LV/HV electrical systems with automatic cable sizing, (6) Loss Analysis - calculate detailed system losses, (7) Energy Production - simulate hourly production for entire year using NREL PVWatts.'
    },
    {
      category: 'advanced-calculator',
      question: 'What is the PV Area Modelling Tool and how do I use it?',
      answer: 'The PV Area Modelling Tool is an interactive Google Maps-based tool that lets you: (1) Search and zoom to your project location, (2) Draw polygon zones where panels will be installed, (3) Choose structure types (Fixed Tilt, Carport, Elevated, etc.), (4) Configure tilt angles, azimuth, and row spacing, (5) Automatically calculate module placement considering shadows and spacing, (6) View real-time capacity and GCR calculations. The tool provides precise measurements and optimal module layout for each drawn zone.'
    },
    {
      category: 'advanced-calculator',
      question: 'How does the String Sizing Estimation App determine optimal string length?',
      answer: 'The String Sizing Estimation App performs complex calculations considering: (1) Module Voc and Vmp at different temperatures, (2) Inverter MPPT voltage windows (min/max), (3) Maximum DC voltage limits, (4) Temperature coefficients and local climate data, (5) String voltage at coldest and hottest conditions, (6) Optimal MPPT utilization for maximum efficiency. The AI recommends ideal string lengths that maximize energy harvest while ensuring safe operation within all electrical limits.'
    },
    {
      category: 'advanced-calculator',
      question: 'What AC configurations are supported?',
      answer: 'PV AI Designer Pro supports: (1) LV Connection (415V) - for string inverters up to 110kW, direct to LV panel, (2) HV String Configuration - string inverters with IDT (Inverter Duty Transformer) stepping up to 11kV or 33kV, with optional power transformer to higher voltages, (3) HV Central Configuration - central inverters (500kW-2500kW) with transformer substations. The platform automatically sizes cables, circuit breakers, and protection devices for each configuration.'
    },
    {
      category: 'advanced-calculator',
      question: 'How accurate are the energy production calculations?',
      answer: 'Energy calculations use NREL PVWatts API with industry-leading accuracy: (1) Real weather data from NSRDB database, (2) Hourly irradiance and temperature profiles, (3) Validated performance models used by engineers worldwide, (4) Detailed loss analysis (soiling, shading, temperature, wiring, etc.), (5) AC/DC power calculations with inverter efficiency curves. Results typically match actual production within ±5% for properly maintained systems.'
    },

    // BOQ Generation
    {
      category: 'boq-generation',
      question: 'What is AI-powered BOQ Generation?',
      answer: 'AI-powered BOQ (Bill of Quantities) Generation uses advanced AI models (GPT-4 or Gemini) to automatically create comprehensive material lists and specifications based on your system design. The AI analyzes your configuration (capacity, components, structure types, electrical design) and generates detailed line items with quantities, specifications, and engineering notes for procurement and installation.'
    },
    {
      category: 'boq-generation',
      question: 'How many AI credits does BOQ generation cost?',
      answer: 'BOQ operations require AI credits: (1) BOQ Generation: 1 credit - creates initial bill of quantities from design, (2) BOQ Pricing: 1 credit - adds pricing data and cost estimates for all items. Free plan users get 9 credits/month. Professional and higher plans include more credits. Super admins have unlimited usage for testing and development.'
    },
    {
      category: 'boq-generation',
      question: 'What items are included in the generated BOQ?',
      answer: 'The comprehensive BOQ includes: (1) PV Modules - exact quantities with manufacturer/model, (2) Inverters - complete specifications, (3) Mounting Structures - purlins, rafters, columns, foundations based on structure type, (4) DC Electrical - cables, connectors, DCDBs, string fuses, SPDs, (5) AC Electrical - cables, breakers, panels, transformers, earthing, (6) Civil Works - foundations, cable trenches, roads, (7) SCADA & Monitoring - data loggers, sensors, communication, (8) Safety Equipment - PPE, signs, fire extinguishers, (9) Installation - labor, tools, testing equipment.'
    },
    {
      category: 'boq-generation',
      question: 'Can I edit the generated BOQ?',
      answer: 'Yes! The generated BOQ is fully editable: (1) Modify quantities and specifications, (2) Add custom line items, (3) Remove unnecessary items, (4) Update unit rates and pricing, (5) Add additional cost categories (EPC margin, contingency, taxes), (6) Export to Excel for further processing, (7) Save and version control within projects. Changes are automatically saved to your project.'
    },
    {
      category: 'boq-generation',
      question: 'How does BOQ pricing work?',
      answer: 'BOQ Pricing AI analyzes current market data to add realistic cost estimates: (1) Component costs based on manufacturer data, (2) Material costs from construction indices, (3) Labor rates adjusted for your project country, (4) Equipment rental and transportation costs, (5) Installation complexity factors, (6) Markup for EPC contractors. You can override any price and add additional cost categories like taxes, customs, profit margins, etc.'
    },

    // Financial Analysis
    {
      category: 'financial-analysis',
      question: 'What financial metrics does the platform calculate?',
      answer: 'The Financial Analysis module provides: (1) LCOE (Levelized Cost of Energy), (2) NPV (Net Present Value) over 25 years, (3) IRR (Internal Rate of Return), (4) Simple and Discounted Payback Period, (5) Annual Cash Flow projections, (6) Cumulative Cash Flow charts, (7) Electricity savings with tariff escalation, (8) O&M costs with inflation, (9) Tax benefits and depreciation, (10) ROI (Return on Investment). All calculations follow international standards for solar project financing.'
    },
    {
      category: 'financial-analysis',
      question: 'Can I customize financial parameters?',
      answer: 'Yes, all parameters are fully customizable: (1) System Cost - total project cost from BOQ or custom input, (2) Government Subsidies/Incentives, (3) Electricity Tariff - can use slab rates or flat rate, (4) Tariff Escalation Rate (annual %), (5) O&M Costs (% of project cost), (6) Discount Rate for NPV calculation, (7) Income Tax Rate, (8) Panel Degradation Rate, (9) Loan Terms (if financed), (10) Insurance costs. The platform immediately recalculates all metrics when you change parameters.'
    },
    {
      category: 'financial-analysis',
      question: 'How is the 25-year cash flow calculated?',
      answer: 'The 25-year projection considers: (1) Year 1 energy production from PVWatts simulation, (2) Annual degradation (typically 0.5-0.8% per year), (3) Revenue from electricity generation (savings or OPEX reduction), (4) Electricity tariff escalation year-over-year, (5) O&M expenses with inflation adjustment, (6) Major component replacements (inverters at year 12-15), (7) Insurance and administrative costs, (8) Tax benefits and depreciation schedules, (9) Discount rate application for present value. Results shown in detailed tables and charts.'
    },
    {
      category: 'financial-analysis',
      question: 'What\'s the difference between Simple and Discounted Payback?',
      answer: 'Simple Payback Period: Years until cumulative savings equal initial investment, without considering time value of money. Simple to understand but ignores inflation and opportunity cost.\n\nDiscounted Payback Period: Years until discounted cash flows equal initial investment, accounting for time value of money using discount rate. More accurate for investment decisions as it considers that money today is worth more than money in the future.'
    },

    // AI Features
    {
      category: 'ai-features',
      question: 'What are AI Credits and how do they work?',
      answer: 'AI Credits are the currency for AI-powered features in PV AI Designer Pro. Each AI operation costs credits: (1) BOQ Generation: 1 credit, (2) BOQ Pricing: 1 credit, (3) AI Feasibility Report: 1 credit. Credits reset monthly based on your subscription plan. Free users get 9/month, Professional gets 180/month, Advanced gets 360/month, Enterprise gets 1,080/month. Super admins have unlimited credits for platform development and testing.'
    },
    {
      category: 'ai-features',
      question: 'What AI models power the platform?',
      answer: 'PV AI Designer Pro uses cutting-edge AI: (1) OpenAI GPT-4 - for BOQ generation and feasibility reports, highest accuracy, (2) Google Gemini Pro - alternative AI engine with competitive performance, (3) You can choose your preferred model for each operation, (4) AI is trained on solar engineering best practices and standards, (5) Outputs are validated against engineering rules and safety codes. The AI understands complex solar PV systems and generates professional engineering documentation.'
    },
    {
      category: 'ai-features',
      question: 'What if I run out of AI credits?',
      answer: 'When credits run low: (1) You\'ll see warnings at 20% remaining, (2) Upgrade to higher plan for more monthly credits, (3) Admins can allocate additional credits to users, (4) Credits reset automatically on your monthly renewal date, (5) You can still use all non-AI features (calculator, component library, manual BOQ), (6) Essential features remain accessible. Enterprise users get 1,080 credits/month, the highest allocation available.'
    },
    {
      category: 'ai-features',
      question: 'How does the AI Feasibility Report work?',
      answer: 'The AI Feasibility Report Generator creates professional project reports: (1) Executive Summary with key metrics and recommendations, (2) Site Analysis with location data and irradiance, (3) Technical Design with system architecture and components, (4) Energy Production estimates and performance ratio, (5) Financial Analysis with NPV, IRR, payback, (6) SWOT Analysis of project strengths, weaknesses, opportunities, threats, (7) Risk Assessment and mitigation strategies, (8) Implementation timeline and milestones. Reports are customizable with company branding and client information.'
    },

    // Reports & PDF
    {
      category: 'reports',
      question: 'What reports can I generate?',
      answer: 'PV AI Designer Pro generates: (1) Technical Design Report - complete system specifications, single-line diagrams, cable schedules, (2) Financial Analysis Report - 25-year projections, charts, break-even analysis, (3) BOQ Report - detailed bill of quantities with pricing, (4) AI Feasibility Report - comprehensive project feasibility study, (5) Production Charts - hourly, daily, monthly energy output, (6) Component Datasheets - panel and inverter specifications. All reports are professionally formatted and ready for clients or financing applications.'
    },
    {
      category: 'reports',
      question: 'Can I customize the PDF reports?',
      answer: 'Yes, reports are highly customizable: (1) Company Logo and branding, (2) Company information (name, address, contact), (3) Client details for personalization, (4) Project name and description, (5) Choose sections to include/exclude, (6) Add custom notes and recommendations, (7) Select chart types and data visualization, (8) Multi-page layout with table of contents, (9) Professional headers and footers. Reports maintain consistent branding and professional appearance.'
    },
    {
      category: 'reports',
      question: 'What format are the reports in?',
      answer: 'Reports are generated as: (1) PDF - high-quality, print-ready documents with vector graphics, (2) Excel/CSV - for BOQ and financial data for further analysis, (3) Images - PNG exports of site maps, single-line diagrams, and charts for presentations. PDFs include bookmarks for easy navigation and are optimized for both screen viewing and printing.'
    },
    {
      category: 'reports',
      question: 'How do I include the Single Line Diagram in reports?',
      answer: 'Single Line Diagrams (SLD) are automatically generated: (1) Navigate to AC Configuration tab, (2) Complete your electrical design (cables, breakers, transformers), (3) Click "Capture SLD" button to save diagram, (4) Diagram is stored with project metadata, (5) Automatically included in PDF reports, (6) Shows complete electrical architecture from PV array to grid connection. SLD updates dynamically as you modify the AC configuration.'
    },

    // Subscription & Billing
    {
      category: 'subscription',
      question: 'What subscription plans are available?',
      answer: 'PV AI Designer Pro offers four plans:\n\n(1) Free Plan - $0/month: 9 AI credits, unlimited energy simulation, limited utility apps access, AI BOQ generation (limited), community support\n\n(2) Professional - $18/month: 180 AI credits, unlimited energy simulation, full AI BOQ generation, 5x utility apps access, priority support\n\n(3) Advanced - $54/month: 360 AI credits, everything in Pro, full utility apps access, team access (coming soon), API access (coming soon), dedicated support\n\n(4) Enterprise - $108/month (paid annually): 1,080 AI credits, everything in Advanced, custom integrations, team training, SLA guarantee, white-label options\n\nAll plans include: Component database, energy calculations, financial analysis, PDF reports.'
    },
    {
      category: 'subscription',
      question: 'Can I change my subscription plan?',
      answer: 'Yes, you can upgrade or downgrade anytime: (1) Go to Account Settings → Subscription, (2) Choose your desired plan, (3) Upgrades take effect immediately, (4) Downgrades take effect at next billing cycle, (5) AI credits adjust to new plan limits, (6) All your projects and data remain intact, (7) No penalties for changing plans. Enterprise plans may require contacting sales for custom terms.'
    },
    {
      category: 'subscription',
      question: 'Do unused AI credits roll over?',
      answer: 'No, AI credits are "use it or lose it" within each billing cycle: (1) Credits reset on your monthly renewal date, (2) Unused credits do not accumulate to next month, (3) This ensures fair usage and platform sustainability, (4) Consider upgrading to higher plan if you consistently run out, (5) Admins can allocate bonus credits for special projects, (6) Enterprise users get the highest allocation with 1,080 credits/month.'
    },
    {
      category: 'subscription',
      question: 'Is there a free trial?',
      answer: 'Yes! The Free Plan is permanently free with no credit card required: (1) 9 AI credits per month, (2) Unlimited energy simulation, (3) Access to core features, (4) Community support, (5) Full component database, (6) Limited utility apps access. This lets you thoroughly evaluate the platform. Upgrade anytime when you need more AI credits or advanced features.'
    },

    // Account & Security
    {
      category: 'account',
      question: 'How do I create an account?',
      answer: 'Creating an account is simple: (1) Click "Sign In" on homepage, (2) Choose "Sign Up" tab, (3) Enter your name, email, and password, (4) Verify your email address, (5) Complete your profile (optional), (6) Start designing! Your account includes: Free plan with 9 AI credits/month, secure cloud storage for projects, automatic backups, access from any device.'
    },
    {
      category: 'account',
      question: 'Is my data secure?',
      answer: 'Yes, security is our top priority: (1) Supabase PostgreSQL database with enterprise-grade security, (2) Row-Level Security (RLS) ensures users only access their own data, (3) All connections use HTTPS/TLS encryption, (4) Passwords hashed with bcrypt, (5) Regular automated backups, (6) GDPR compliant data handling, (7) Two-factor authentication (coming soon), (8) SOC 2 Type II infrastructure. Your designs and business data are safe and private.'
    },
    {
      category: 'account',
      question: 'Can I share projects with team members?',
      answer: 'Project sharing and collaboration features: (1) Advanced and Enterprise plans support team features, (2) Share read-only links to clients, (3) Export projects as data files for team members, (4) Role-based access control (coming soon), (5) Real-time collaboration (coming soon), (6) Comment and review workflows (roadmap). Currently, each user manages their own projects with export/import for sharing.'
    },
    {
      category: 'account',
      question: 'How do I delete my account?',
      answer: 'To delete your account: (1) Go to Account Settings → Security, (2) Scroll to "Danger Zone", (3) Click "Delete Account", (4) Confirm deletion (cannot be undone), (5) All your projects and data will be permanently removed, (6) Any active subscription will be cancelled, (7) You\'ll receive confirmation email. Please export any important data before deleting. We\'re sad to see you go but respect your choice!'
    }
  ];

  // Filter FAQs based on search and category
  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryFAQs = (categoryId: string) => {
    return filteredFAQs.filter((faq) => faq.category === categoryId);
  };

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
                  Frequently Asked <span className="text-[#FFA500]">Questions</span>
                </h1>
                <p className="text-white/70 text-xs sm:text-sm hidden sm:block">
                  Get quick answers about PV AI Designer Pro
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-4 relative z-10">
        <Card className="border-2 border-[#FFA500]/20 shadow-xl">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#0A2463]/40" />
              <Input
                type="text"
                placeholder="Search for answers... (e.g., 'How do AI credits work?')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 text-base border-2 border-[#FFA500]/20 focus:border-[#FFA500] rounded-xl"
              />
            </div>
            {searchQuery && (
              <p className="mt-2 text-xs sm:text-sm text-[#0A2463]/70">
                Found <span className="font-bold text-[#FFA500]">{filteredFAQs.length}</span> result{filteredFAQs.length !== 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-[#FFA500]/20 shadow-xl sticky top-24">
              <CardHeader>
                <CardTitle className="text-[#0A2463] flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-[#FFA500]" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                    selectedCategory === null
                      ? 'bg-[#FFA500] text-white font-semibold shadow-lg'
                      : 'hover:bg-[#FEF3C7] text-[#0A2463]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">All Questions</span>
                    <Badge variant="secondary">{faqs.length}</Badge>
                  </div>
                </button>
                
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-[#FFA500] text-white font-semibold shadow-lg'
                        : 'hover:bg-[#FEF3C7] text-[#0A2463]'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <div style={{ color: selectedCategory === category.id ? 'white' : category.color }}>
                        {category.icon}
                      </div>
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center justify-between ml-8">
                      <span className={`text-xs ${selectedCategory === category.id ? 'text-white/80' : 'text-[#0A2463]/60'}`}>
                        {getCategoryFAQs(category.id).length} questions
                      </span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            {selectedCategory ? (
              // Show selected category
              (() => {
                const category = categories.find((c) => c.id === selectedCategory);
                const categoryFAQs = getCategoryFAQs(selectedCategory);
                
                return (
                  <div>
                    <Card className="border-2 border-[#FFA500]/20 shadow-xl mb-6">
                      <CardHeader className="bg-gradient-to-r from-[#FEF3C7] to-white">
                        <div className="flex items-center gap-3">
                          <div 
                            className="p-3 rounded-full"
                            style={{ backgroundColor: `${category?.color}20` }}
                          >
                            <div style={{ color: category?.color }}>
                              {category?.icon}
                            </div>
                          </div>
                          <div>
                            <CardTitle className="text-2xl text-[#0A2463]">
                              {category?.name}
                            </CardTitle>
                            <CardDescription>
                              {category?.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>

                    {categoryFAQs.length > 0 ? (
                      <Accordion type="single" collapsible className="space-y-4">
                        {categoryFAQs.map((faq, index) => (
                          <Card key={index} className="border-2 border-[#FFA500]/20 shadow-lg overflow-hidden">
                            <AccordionItem value={`item-${index}`} className="border-none">
                              <AccordionTrigger className="px-6 py-4 hover:bg-[#FEF3C7] transition-colors [&[data-state=open]]:bg-[#FEF3C7]">
                                <span className="text-left font-semibold text-[#0A2463]">
                                  {faq.question}
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="px-6 py-4 text-[#0A2463]/80 bg-white">
                                <div className="prose prose-sm max-w-none">
                                  {faq.answer.split('\n\n').map((paragraph, i) => (
                                    <p key={i} className="mb-3 last:mb-0 leading-relaxed whitespace-pre-line">
                                      {paragraph}
                                    </p>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Card>
                        ))}
                      </Accordion>
                    ) : (
                      <Card className="border-2 border-[#FFA500]/20 shadow-lg">
                        <CardContent className="p-12 text-center">
                          <Search className="h-16 w-16 text-[#0A2463]/20 mx-auto mb-4" />
                          <h3 className="text-xl font-bold text-[#0A2463] mb-2">No results found</h3>
                          <p className="text-[#0A2463]/70">Try adjusting your search query</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              })()
            ) : (
              // Show all categories with FAQs
              <div className="space-y-8">
                {categories.map((category) => {
                  const categoryFAQs = getCategoryFAQs(category.id);
                  if (categoryFAQs.length === 0) return null;
                  
                  return (
                    <div key={category.id}>
                      <Card className="border-2 border-[#FFA500]/20 shadow-xl mb-6">
                        <CardHeader className="bg-gradient-to-r from-[#FEF3C7] to-white">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div 
                                className="p-3 rounded-full"
                                style={{ backgroundColor: `${category.color}20` }}
                              >
                                <div style={{ color: category.color }}>
                                  {category.icon}
                                </div>
                              </div>
                              <div>
                                <CardTitle className="text-2xl text-[#0A2463]">
                                  {category.name}
                                </CardTitle>
                                <CardDescription>
                                  {category.description}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-lg px-3 py-1">
                              {categoryFAQs.length}
                            </Badge>
                          </div>
                        </CardHeader>
                      </Card>

                      <Accordion type="single" collapsible className="space-y-4">
                        {categoryFAQs.map((faq, index) => (
                          <Card key={index} className="border-2 border-[#FFA500]/20 shadow-lg overflow-hidden">
                            <AccordionItem value={`${category.id}-${index}`} className="border-none">
                              <AccordionTrigger className="px-6 py-4 hover:bg-[#FEF3C7] transition-colors [&[data-state=open]]:bg-[#FEF3C7]">
                                <span className="text-left font-semibold text-[#0A2463]">
                                  {faq.question}
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="px-6 py-4 text-[#0A2463]/80 bg-white">
                                <div className="prose prose-sm max-w-none">
                                  {faq.answer.split('\n\n').map((paragraph, i) => (
                                    <p key={i} className="mb-3 last:mb-0 leading-relaxed whitespace-pre-line">
                                      {paragraph}
                                    </p>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Card>
                        ))}
                      </Accordion>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Still Need Help Section */}
            <Card className="border-2 border-[#3B82F6]/20 shadow-xl mt-12 bg-gradient-to-br from-[#3B82F6]/5 to-white">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#3B82F6] to-[#10B981] rounded-full flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold text-[#0A2463] mb-2">
                      Still Need Help?
                    </h3>
                    <p className="text-[#0A2463]/70 mb-4">
                      Can't find what you're looking for? Our community forum is here to help!
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <Link to="/forum">
                        <Button className="bg-gradient-to-r from-[#3B82F6] to-[#10B981] hover:from-[#2563EB] hover:to-[#059669] text-white font-semibold">
                          <Users className="mr-2 h-4 w-4" />
                          Visit Forum
                        </Button>
                      </Link>
                      <Link to="/blog">
                        <Button variant="outline" className="border-2 border-[#3B82F6]">
                          <BookOpen className="mr-2 h-4 w-4" />
                          Read Blog
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer - Reuse comprehensive footer from Index */}
      <footer className="bg-gradient-to-r from-[#0A2463] to-[#0F2E5C] text-white py-16 border-t-4 border-[#FFA500]">
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
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
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
                <li>
                  <Link to="/faq" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    FAQ
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

export default FAQ;

