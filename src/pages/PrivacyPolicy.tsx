import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Globe, Award, Shield } from 'lucide-react';
import { Helmet } from 'react-helmet';

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | BAESS Labs</title>
        <meta name="description" content="Read BAESS Labs privacy policy to understand how we collect, use, and protect your personal information." />
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
                Privacy <span className="text-[#FFA500]">Policy</span>
              </h1>
              <p className="text-white/70 mb-8">Last updated: January 30, 2025</p>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-8 prose prose-invert max-w-none">
                  <div className="text-white/90 space-y-6">
                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                      <p>
                        Welcome to BAESS Labs ("we," "our," or "us"). We are committed to protecting your personal information 
                        and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard 
                        your information when you use our solar design platform and services.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
                      <h3 className="text-xl font-semibold text-white mb-3">2.1 Information You Provide</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Account information (name, email address, company name)</li>
                        <li>Profile information (phone number, job title, preferences)</li>
                        <li>Project data (solar designs, calculations, BOQ data)</li>
                        <li>Payment information (processed securely through third-party providers)</li>
                        <li>Communication data (support tickets, emails, feedback)</li>
                      </ul>

                      <h3 className="text-xl font-semibold text-white mb-3 mt-4">2.2 Automatically Collected Information</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Device information (IP address, browser type, operating system)</li>
                        <li>Usage data (pages visited, features used, time spent)</li>
                        <li>Cookies and similar tracking technologies</li>
                        <li>Location data (if you enable location services)</li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
                      <p>We use your information to:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Provide and maintain our services</li>
                        <li>Process your transactions and manage your account</li>
                        <li>Send you updates, notifications, and marketing communications</li>
                        <li>Improve our platform and develop new features</li>
                        <li>Analyze usage patterns and optimize user experience</li>
                        <li>Provide customer support and respond to inquiries</li>
                        <li>Detect and prevent fraud, security threats, and technical issues</li>
                        <li>Comply with legal obligations and enforce our terms</li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">4. Information Sharing and Disclosure</h2>
                      <p>We may share your information with:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Service Providers:</strong> Third-party vendors who assist us in providing services (e.g., hosting, analytics, payment processing)</li>
                        <li><strong>AI Services:</strong> OpenAI and Google for AI-powered features (BOQ generation, feasibility reports)</li>
                        <li><strong>Mapping Services:</strong> Google Maps for location and satellite imagery services</li>
                        <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                        <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                      </ul>
                      <p className="mt-4">
                        We do not sell your personal information to third parties.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
                      <p>
                        We implement industry-standard security measures to protect your information, including:
                      </p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Encryption of data in transit and at rest</li>
                        <li>Secure authentication and access controls</li>
                        <li>Regular security audits and vulnerability assessments</li>
                        <li>Employee training on data protection practices</li>
                      </ul>
                      <p className="mt-4">
                        However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">6. Data Retention</h2>
                      <p>
                        We retain your information for as long as necessary to provide our services and fulfill the purposes 
                        outlined in this policy. When you delete your account, we will delete or anonymize your personal data, 
                        except where we are required to retain it for legal or regulatory purposes.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">7. Your Rights and Choices</h2>
                      <p>You have the right to:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Access, update, or delete your personal information</li>
                        <li>Opt-out of marketing communications</li>
                        <li>Disable cookies through your browser settings</li>
                        <li>Request a copy of your data</li>
                        <li>Object to processing of your data</li>
                        <li>Lodge a complaint with a data protection authority</li>
                      </ul>
                      <p className="mt-4">
                        To exercise these rights, please contact us at konnect@baesslabs.com
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">8. Cookies and Tracking Technologies</h2>
                      <p>
                        We use cookies and similar technologies to enhance your experience, analyze usage, and deliver 
                        personalized content. You can control cookie preferences through your browser settings.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">9. International Data Transfers</h2>
                      <p>
                        Your information may be transferred to and processed in countries other than your own. We ensure 
                        appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">10. Children's Privacy</h2>
                      <p>
                        Our services are not intended for users under the age of 18. We do not knowingly collect personal 
                        information from children. If you believe we have collected information from a child, please contact us.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">11. Changes to This Policy</h2>
                      <p>
                        We may update this Privacy Policy from time to time. We will notify you of any material changes by 
                        posting the new policy on this page and updating the "Last updated" date. We encourage you to review 
                        this policy periodically.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
                      <p>
                        If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, 
                        please contact us at:
                      </p>
                      <div className="mt-4 p-4 bg-white/5 rounded-lg">
                        <p><strong>BAESS Labs</strong></p>
                        <p>Email: konnect@baesslabs.com</p>
                      </div>
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

export default PrivacyPolicy;

