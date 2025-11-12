import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Globe, Award, Shield } from 'lucide-react';
import { Helmet } from 'react-helmet';

const TermsOfService = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service | BAESS Labs</title>
        <meta name="description" content="Read BAESS Labs terms of service to understand the rules and guidelines for using our solar design platform." />
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

        {/* Content */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
                Terms of <span className="text-[#FFA500]">Service</span>
              </h1>
              <p className="text-white/70 mb-8">Last updated: January 30, 2025</p>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-8 prose prose-invert max-w-none">
                  <div className="text-white/90 space-y-6">
                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                      <p>
                        By accessing or using BAESS Labs ("the Platform," "we," "our," or "us"), you agree to be bound by 
                        these Terms of Service. If you do not agree to these terms, please do not use our services.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
                      <p>
                        BAESS Labs provides a cloud-based solar design and engineering platform featuring:
                      </p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Solar PV system design and simulation tools</li>
                        <li>AI-powered Bill of Quantities (BOQ) generation</li>
                        <li>Energy calculation and financial analysis</li>
                        <li>Project management and collaboration features</li>
                        <li>Integration with third-party services (Google Maps, OpenAI, etc.)</li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
                      <h3 className="text-xl font-semibold text-white mb-3">3.1 Registration</h3>
                      <p>
                        To access certain features, you must register for an account. You agree to provide accurate, 
                        current, and complete information during registration and to update such information as necessary.
                      </p>
                      
                      <h3 className="text-xl font-semibold text-white mb-3 mt-4">3.2 Account Security</h3>
                      <p>
                        You are responsible for maintaining the confidentiality of your account credentials and for all 
                        activities under your account. You agree to notify us immediately of any unauthorized access.
                      </p>

                      <h3 className="text-xl font-semibold text-white mb-3 mt-4">3.3 Account Termination</h3>
                      <p>
                        We reserve the right to suspend or terminate your account if you violate these terms or engage 
                        in fraudulent, abusive, or illegal activities.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">4. Subscription and Payment</h2>
                      <h3 className="text-xl font-semibold text-white mb-3">4.1 Subscription Plans</h3>
                      <p>
                        We offer multiple subscription tiers (Free, Professional, Advanced, Enterprise) with varying 
                        features and AI credit allocations. Current pricing and features are available on our website.
                      </p>

                      <h3 className="text-xl font-semibold text-white mb-3 mt-4">4.2 Billing</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Subscriptions are billed monthly or annually based on your selection</li>
                        <li>All fees are non-refundable except as required by law</li>
                        <li>We reserve the right to change pricing with 30 days' notice</li>
                        <li>Failed payments may result in service suspension</li>
                      </ul>

                      <h3 className="text-xl font-semibold text-white mb-3 mt-4">4.3 AI Credits</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>AI credits are used for AI-powered features (BOQ generation, reports, pricing)</li>
                        <li>Credits reset monthly on your subscription anniversary date</li>
                        <li>Unused credits do not roll over to the next month</li>
                        <li>Super admins have unlimited AI credits</li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">5. Acceptable Use</h2>
                      <p>You agree NOT to:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Violate any applicable laws or regulations</li>
                        <li>Infringe on intellectual property rights of others</li>
                        <li>Upload malicious code, viruses, or harmful content</li>
                        <li>Attempt to gain unauthorized access to our systems</li>
                        <li>Reverse engineer, decompile, or disassemble the Platform</li>
                        <li>Use the service for competitive analysis or to build similar products</li>
                        <li>Resell or redistribute our services without authorization</li>
                        <li>Share your account credentials with others</li>
                        <li>Abuse AI features or attempt to circumvent credit limits</li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">6. Intellectual Property</h2>
                      <h3 className="text-xl font-semibold text-white mb-3">6.1 Our Property</h3>
                      <p>
                        The Platform, including all content, features, software, and technology, is owned by BAESS Labs 
                        and protected by intellectual property laws. You may not copy, modify, or distribute our 
                        proprietary materials without written permission.
                      </p>

                      <h3 className="text-xl font-semibold text-white mb-3 mt-4">6.2 Your Content</h3>
                      <p>
                        You retain ownership of the project data and designs you create using the Platform. By using our 
                        service, you grant us a limited license to host, store, and process your content to provide our services.
                      </p>

                      <h3 className="text-xl font-semibold text-white mb-3 mt-4">6.3 AI-Generated Content</h3>
                      <p>
                        Content generated by AI features (BOQ, reports) is provided to you under a non-exclusive license. 
                        You are responsible for reviewing and validating AI-generated content before use.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">7. Disclaimer of Warranties</h2>
                      <p>
                        THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT 
                        WARRANT THAT:
                      </p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>The service will be uninterrupted, secure, or error-free</li>
                        <li>Results from the service will be accurate or reliable</li>
                        <li>AI-generated content will be suitable for your specific needs</li>
                        <li>Defects will be corrected immediately</li>
                      </ul>
                      <p className="mt-4">
                        You acknowledge that solar design calculations and AI outputs should be reviewed by qualified 
                        professionals before implementation.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
                      <p>
                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, BAESS LABS SHALL NOT BE LIABLE FOR:
                      </p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Indirect, incidental, special, or consequential damages</li>
                        <li>Loss of profits, revenue, data, or business opportunities</li>
                        <li>Damages resulting from use or inability to use the service</li>
                        <li>Errors or inaccuracies in AI-generated content or calculations</li>
                      </ul>
                      <p className="mt-4">
                        Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">9. Indemnification</h2>
                      <p>
                        You agree to indemnify and hold harmless BAESS Labs from any claims, damages, losses, or expenses 
                        arising from your use of the Platform, violation of these terms, or infringement of third-party rights.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">10. Data and Privacy</h2>
                      <p>
                        Our collection and use of personal information is governed by our Privacy Policy. By using the 
                        Platform, you consent to our data practices as described in the Privacy Policy.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">11. Third-Party Services</h2>
                      <p>
                        Our Platform integrates with third-party services (Google Maps, OpenAI, Gemini, etc.). Your use 
                        of these services is subject to their respective terms and conditions.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">12. Modifications to Service</h2>
                      <p>
                        We reserve the right to modify, suspend, or discontinue the Platform (or any part thereof) at any 
                        time with or without notice. We shall not be liable for any such modifications or discontinuations.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">13. Governing Law</h2>
                      <p>
                        These Terms shall be governed by and construed in accordance with applicable laws, without regard 
                        to conflict of law principles. Any disputes shall be resolved in the appropriate courts.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">14. Changes to Terms</h2>
                      <p>
                        We may update these Terms from time to time. We will notify you of material changes by posting the 
                        new Terms on this page and updating the "Last updated" date. Continued use of the Platform after 
                        changes constitutes acceptance of the new Terms.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">15. Severability</h2>
                      <p>
                        If any provision of these Terms is found to be unenforceable, the remaining provisions shall 
                        continue in full force and effect.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">16. Contact Information</h2>
                      <p>
                        If you have questions about these Terms of Service, please contact us at:
                      </p>
                      <div className="mt-4 p-4 bg-white/5 rounded-lg">
                        <p><strong>BAESS Labs</strong></p>
                        <p>Email: konnect@baesslabs.com</p>
                      </div>
                    </section>

                    <section className="mt-8 p-4 bg-[#FFA500]/10 rounded-lg border border-[#FFA500]/30">
                      <p className="text-sm">
                        <strong>By using BAESS Labs, you acknowledge that you have read, understood, and agree to be bound 
                        by these Terms of Service.</strong>
                      </p>
                    </section>
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

export default TermsOfService;

