import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home, ChevronRight, Mail, Send, Bug, MessageSquare,
  Briefcase, Sparkles, CheckCircle2, ArrowRight, Award, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type ContactType = 'technical' | 'bug' | 'sales';

export const ContactUs = () => {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<ContactType>('technical');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium'
  });

  const contactTypes = [
    {
      id: 'technical' as ContactType,
      name: 'Technical Support',
      icon: <MessageSquare className="h-6 w-6" />,
      color: '#3B82F6',
      description: 'Get help with technical issues or questions',
      email: 'support@baess.app'
    },
    {
      id: 'bug' as ContactType,
      name: 'Report an Issue',
      icon: <Bug className="h-6 w-6" />,
      color: '#EF4444',
      description: 'Report bugs or app issues',
      email: 'support@baess.app'
    },
    {
      id: 'sales' as ContactType,
      name: 'Sales & Marketing',
      icon: <Briefcase className="h-6 w-6" />,
      color: '#10B981',
      description: 'Inquiries about partnerships or enterprise plans',
      email: 'solar@baesslabs.com'
    }
  ];

  const selectedContact = contactTypes.find(t => t.id === selectedType);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      toast({
        title: "Message Sent!",
        description: `We'll get back to you at ${formData.email} soon.`,
      });

      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          priority: 'medium'
        });
      }, 3000);
    }, 1500);
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
                  Get in <span className="text-[#FFA500]">Touch</span>
                </h1>
                <p className="text-white/70 text-xs sm:text-sm hidden sm:block">
                  We're here to help with your solar design journey
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

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Contact Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {contactTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
                  selectedType === type.id
                    ? 'ring-4 ring-[#FFA500] shadow-2xl scale-105'
                    : 'hover:shadow-xl hover:scale-102 border-2 border-[#FFA500]/20'
                }`}
                style={{
                  background: selectedType === type.id
                    ? `linear-gradient(135deg, ${type.color}15 0%, white 100%)`
                    : 'white'
                }}
              >
                {selectedType === type.id && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 className="h-6 w-6 text-[#FFA500]" />
                  </div>
                )}
                
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-4 mx-auto"
                  style={{ backgroundColor: `${type.color}20` }}
                >
                  <div style={{ color: type.color }}>
                    {type.icon}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-[#0A2463] mb-2 text-center">
                  {type.name}
                </h3>
                <p className="text-sm text-[#0A2463]/70 text-center mb-3">
                  {type.description}
                </p>
                <div className="flex items-center justify-center gap-1 text-xs font-medium" style={{ color: type.color }}>
                  <Mail className="h-3 w-3" />
                  <span>{type.email}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Contact Form */}
          <Card className="border-2 border-[#FFA500]/20 shadow-2xl overflow-hidden">
            <CardHeader 
              className="bg-gradient-to-r from-[#FEF3C7] to-white border-b-2 border-[#FFA500]/20"
              style={{ 
                background: `linear-gradient(135deg, ${selectedContact?.color}10 0%, white 100%)`
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${selectedContact?.color}20` }}
                >
                  <div style={{ color: selectedContact?.color }}>
                    {selectedContact?.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl text-[#0A2463] flex items-center gap-3">
                    {selectedContact?.name}
                    <Badge 
                      className="text-white"
                      style={{ backgroundColor: selectedContact?.color }}
                    >
                      {selectedContact?.email}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    {selectedContact?.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#0A2463] mb-2">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-[#0A2463]/70 mb-4">
                    We'll get back to you at <span className="font-semibold text-[#FFA500]">{formData.email}</span> soon.
                  </p>
                  <p className="text-sm text-[#0A2463]/60">
                    Typical response time: 24-48 hours
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[#0A2463] font-semibold">
                        Your Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="border-2 border-[#FFA500]/20 focus:border-[#FFA500] h-12"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[#0A2463] font-semibold">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="border-2 border-[#FFA500]/20 focus:border-[#FFA500] h-12"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Subject */}
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-[#0A2463] font-semibold">
                        Subject <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="subject"
                        placeholder="Brief description of your inquiry"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        className="border-2 border-[#FFA500]/20 focus:border-[#FFA500] h-12"
                        required
                      />
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-[#0A2463] font-semibold">
                        Priority Level
                      </Label>
                      <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                        <SelectTrigger className="border-2 border-[#FFA500]/20 focus:border-[#FFA500] h-12">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - General inquiry</SelectItem>
                          <SelectItem value="medium">Medium - Need assistance</SelectItem>
                          <SelectItem value="high">High - Urgent issue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-[#0A2463] font-semibold">
                      Your Message <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Please provide detailed information about your inquiry..."
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      className="border-2 border-[#FFA500]/20 focus:border-[#FFA500] min-h-[150px] resize-none"
                      required
                    />
                    <p className="text-xs text-[#0A2463]/60">
                      Please include as much detail as possible to help us assist you better.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-[#FFA500] to-[#F7931E] hover:from-[#F7931E] hover:to-[#FFA500] text-white font-semibold h-12 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isSubmitting ? (
                        <>
                          <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          Send Message
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData({
                        name: '',
                        email: '',
                        subject: '',
                        message: '',
                        priority: 'medium'
                      })}
                      className="sm:w-auto border-2 border-[#0A2463] text-[#0A2463] hover:bg-[#0A2463] hover:text-white h-12"
                    >
                      Clear Form
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Additional Help Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <Card className="border-2 border-[#3B82F6]/20 bg-gradient-to-br from-[#3B82F6]/5 to-white">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-6 w-6 text-[#3B82F6]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#0A2463] mb-2">
                      Need Immediate Help?
                    </h3>
                    <p className="text-sm text-[#0A2463]/70 mb-3">
                      Check our FAQ section for instant answers to common questions.
                    </p>
                    <Link to="/faq">
                      <Button variant="outline" className="border-2 border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white">
                        Visit FAQ
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#10B981]/20 bg-gradient-to-br from-[#10B981]/5 to-white">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#10B981]/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-6 w-6 text-[#10B981]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#0A2463] mb-2">
                      Community Forum
                    </h3>
                    <p className="text-sm text-[#0A2463]/70 mb-3">
                      Connect with other users and share experiences in our community forum.
                    </p>
                    <Link to="/forum">
                      <Button variant="outline" className="border-2 border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-white">
                        Join Forum
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                <li>
                  <Link to="/contact" className="text-sm text-white/70 hover:text-[#FFA500] transition-colors">
                    Contact Us
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

export default ContactUs;

