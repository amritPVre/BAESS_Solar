import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Gift, Copy, Check, Users, TrendingUp, Clock, Share2, Twitter, Facebook, Linkedin, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface ReferralStats {
  referral_code: string;
  total_referrals: number;
  successful_referrals: number;
  pending_referrals: number;
  total_credits_earned: number;
}

export default function ReferralDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadReferralStats();
    }
  }, [user]);

  const loadReferralStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_referral_stats', {
        p_user_id: user?.id
      });

      if (error) {
        console.error('Error loading referral stats:', error);
        return;
      }

      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error('Exception loading referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (stats?.referral_code) {
      navigator.clipboard.writeText(stats.referral_code);
      setCopied(true);
      toast.success('Referral code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareReferralLink = () => {
    const referralLink = `${window.location.origin}/auth?ref=${stats?.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  // Social media sharing functions
  const getShareMessage = () => {
    return `🌞 Just designed my Solar PV system with AI-powered tools at BAESS Labs! ⚡\n\nUse code ${stats?.referral_code} to get FREE AI credits and start your solar journey today! 🎁\n\n`;
  };

  const shareOnTwitter = () => {
    const referralLink = `${window.location.origin}/auth?ref=${stats?.referral_code}`;
    const message = `🌞 Just designed my Solar PV system with AI-powered tools at BAESS Labs! ⚡\n\nUse code ${stats?.referral_code} to get FREE AI credits! 🎁`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(referralLink)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnFacebook = () => {
    const referralLink = `${window.location.origin}/auth?ref=${stats?.referral_code}`;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnLinkedIn = () => {
    const referralLink = `${window.location.origin}/auth?ref=${stats?.referral_code}`;
    const message = `Just designed my Solar PV system with AI-powered tools at BAESS Labs! Use code ${stats?.referral_code} to get FREE AI credits and start your solar journey today!`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnWhatsApp = () => {
    const referralLink = `${window.location.origin}/auth?ref=${stats?.referral_code}`;
    const message = `🌞 Just designed my Solar PV system with AI-powered tools at BAESS Labs! ⚡\n\nUse code *${stats?.referral_code}* to get FREE AI credits and start your solar journey today! 🎁\n\n${referralLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const copyShareMessage = () => {
    const message = getShareMessage() + `${window.location.origin}/auth?ref=${stats?.referral_code}`;
    navigator.clipboard.writeText(message);
    toast.success('Share message copied! Paste it anywhere to share.');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-[#FFA500]" />
            Referral Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFA500]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const referralLink = `${window.location.origin}/auth?ref=${stats.referral_code}`;

  return (
    <div className="space-y-6">
      {/* Main Referral Card */}
      <Card className="border-2 border-[#FFA500]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-[#FFA500]" />
            Refer Friends & Earn Credits
          </CardTitle>
          <CardDescription>
            Share your referral code and get 9 AI credits for each friend who signs up. They get 3 credits too!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Referral Code Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Your Referral Code</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={stats.referral_code}
                  readOnly
                  className="text-2xl font-bold text-center tracking-widest bg-gradient-to-r from-[#FFA500]/10 to-[#F7931E]/10 border-2 border-[#FFA500] text-[#0A2463] pr-12"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={copyReferralCode}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-[#FFA500]" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Referral Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Share This Link</label>
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="bg-gray-50 text-sm"
              />
              <Button
                variant="outline"
                onClick={shareReferralLink}
                className="flex-shrink-0 border-[#FFA500] text-[#FFA500] hover:bg-[#FFA500] hover:text-white"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>

          {/* Social Media Sharing */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Share2 className="h-4 w-4 text-[#FFA500]" />
                Share on Social Media
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyShareMessage}
                className="text-xs text-[#0A2463] hover:text-[#FFA500]"
              >
                Copy Message
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                onClick={shareOnTwitter}
                className="flex items-center justify-center gap-2 border-2 hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2] transition-all"
              >
                <Twitter className="h-4 w-4" />
                <span className="text-sm font-medium">Twitter</span>
              </Button>

              <Button
                variant="outline"
                onClick={shareOnFacebook}
                className="flex items-center justify-center gap-2 border-2 hover:bg-[#4267B2] hover:text-white hover:border-[#4267B2] transition-all"
              >
                <Facebook className="h-4 w-4" />
                <span className="text-sm font-medium">Facebook</span>
              </Button>

              <Button
                variant="outline"
                onClick={shareOnLinkedIn}
                className="flex items-center justify-center gap-2 border-2 hover:bg-[#0077B5] hover:text-white hover:border-[#0077B5] transition-all"
              >
                <Linkedin className="h-4 w-4" />
                <span className="text-sm font-medium">LinkedIn</span>
              </Button>

              <Button
                variant="outline"
                onClick={shareOnWhatsApp}
                className="flex items-center justify-center gap-2 border-2 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm font-medium">WhatsApp</span>
              </Button>
            </div>

            {/* Preview Message */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-medium text-gray-600 mb-2">Preview Message:</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {getShareMessage()}
                <span className="text-[#FFA500] font-medium">{referralLink}</span>
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6 pb-4">
                <div className="flex flex-col items-center">
                  <Users className="h-8 w-8 text-blue-600 mb-2" />
                  <div className="text-3xl font-bold text-blue-900">{stats.total_referrals}</div>
                  <div className="text-xs text-blue-700 font-medium">Total Referrals</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6 pb-4">
                <div className="flex flex-col items-center">
                  <Check className="h-8 w-8 text-green-600 mb-2" />
                  <div className="text-3xl font-bold text-green-900">{stats.successful_referrals}</div>
                  <div className="text-xs text-green-700 font-medium">Active</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="pt-6 pb-4">
                <div className="flex flex-col items-center">
                  <Clock className="h-8 w-8 text-yellow-600 mb-2" />
                  <div className="text-3xl font-bold text-yellow-900">{stats.pending_referrals}</div>
                  <div className="text-xs text-yellow-700 font-medium">Pending</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#FFA500]/10 to-[#F7931E]/10 border-[#FFA500]/30">
              <CardContent className="pt-6 pb-4">
                <div className="flex flex-col items-center">
                  <TrendingUp className="h-8 w-8 text-[#FFA500] mb-2" />
                  <div className="text-3xl font-bold text-[#0A2463]">{stats.total_credits_earned}</div>
                  <div className="text-xs text-[#0A2463]/70 font-medium">Credits Earned</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <div className="bg-gradient-to-r from-[#FEF3C7] to-[#FFA500]/10 rounded-lg p-4 border border-[#FFA500]/20">
            <h4 className="font-semibold text-[#0A2463] mb-3 flex items-center gap-2">
              <Gift className="h-4 w-4 text-[#FFA500]" />
              How It Works
            </h4>
            <ul className="space-y-2 text-sm text-[#0A2463]/80">
              <li className="flex items-start gap-2">
                <span className="text-[#FFA500] font-bold">1.</span>
                <span>Share your referral code with friends</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FFA500] font-bold">2.</span>
                <span>They sign up using your code and get +3 AI credits</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FFA500] font-bold">3.</span>
                <span>Once they verify their email, you get +9 AI credits</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FFA500] font-bold">4.</span>
                <span>Unlimited referrals - earn more credits!</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

