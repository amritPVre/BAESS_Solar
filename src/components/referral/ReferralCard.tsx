import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  getReferralStats,
  copyReferralLink,
  getWhatsAppShareLink,
  getFacebookShareLink,
  getTwitterShareLink,
  getLinkedInShareLink,
  nativeShare,
} from '@/services/referralService';
import { 
  Share2, 
  Copy, 
  Users, 
  Gift, 
  Sparkles,
  Check
} from 'lucide-react';
import { FaWhatsapp, FaFacebookF, FaTwitter, FaLinkedinIn } from 'react-icons/fa';

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  creditsEarned: number;
  referredBy: string | null;
}

export const ReferralCard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadReferralStats();
    }
  }, [user]);

  const loadReferralStats = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    const data = await getReferralStats(user.id);
    setStats(data);
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!stats?.referralCode) return;
    
    const success = await copyReferralLink(stats.referralCode);
    if (success) {
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    if (!stats?.referralCode) return;
    
    const shared = await nativeShare(stats.referralCode);
    if (!shared) {
      // Fallback to copy if native share not available
      handleCopy();
    }
  };

  const handleSocialShare = (platform: 'whatsapp' | 'facebook' | 'twitter' | 'linkedin') => {
    if (!stats?.referralCode) return;
    
    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = getWhatsAppShareLink(stats.referralCode);
        break;
      case 'facebook':
        url = getFacebookShareLink(stats.referralCode);
        break;
      case 'twitter':
        url = getTwitterShareLink(stats.referralCode);
        break;
      case 'linkedin':
        url = getLinkedInShareLink(stats.referralCode);
        break;
    }
    
    window.open(url, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-orange-500" />
            Referral Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className="w-full bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Gift className="w-6 h-6 text-orange-500" />
          Referral Program
        </CardTitle>
        <CardDescription>
          Share BAESS Labs and earn rewards! 🎁
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Referral Code Section */}
        <div className="bg-white rounded-lg p-4 border-2 border-orange-200">
          <p className="text-sm text-gray-600 mb-2">Your Referral Code</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="text-3xl font-bold text-orange-600 tracking-wider font-mono">
                {stats.referralCode}
              </div>
            </div>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="border-orange-300 hover:bg-orange-50"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-orange-100">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">Total Referrals</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalReferrals}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-orange-100">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Credits Earned</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.creditsEarned}
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-lg p-4 border border-orange-100">
          <h3 className="font-semibold mb-3 text-gray-900">How it Works</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold">1.</span>
              <span>Share your referral code with friends</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold">2.</span>
              <span>They get <strong>+3 AI credits</strong> on sign-up</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold">3.</span>
              <span>You get <strong>+9 AI credits</strong> for each referral</span>
            </li>
          </ul>
        </div>

        {/* Share Buttons */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Share via:</p>
          
          {/* Mobile/Desktop Share Button */}
          <Button
            onClick={handleNativeShare}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            size="lg"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share Referral Link
          </Button>

          {/* Social Media Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              onClick={() => handleSocialShare('whatsapp')}
              variant="outline"
              size="lg"
              className="hover:bg-green-50 border-green-200"
              title="Share on WhatsApp"
            >
              <FaWhatsapp className="w-5 h-5 text-green-600" />
            </Button>
            
            <Button
              onClick={() => handleSocialShare('facebook')}
              variant="outline"
              size="lg"
              className="hover:bg-blue-50 border-blue-200"
              title="Share on Facebook"
            >
              <FaFacebookF className="w-5 h-5 text-blue-600" />
            </Button>
            
            <Button
              onClick={() => handleSocialShare('twitter')}
              variant="outline"
              size="lg"
              className="hover:bg-sky-50 border-sky-200"
              title="Share on Twitter"
            >
              <FaTwitter className="w-5 h-5 text-sky-500" />
            </Button>
            
            <Button
              onClick={() => handleSocialShare('linkedin')}
              variant="outline"
              size="lg"
              className="hover:bg-blue-50 border-blue-300"
              title="Share on LinkedIn"
            >
              <FaLinkedinIn className="w-5 h-5 text-blue-700" />
            </Button>
          </div>
        </div>

        {/* Referred By (if applicable) */}
        {stats.referredBy && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              ✨ You joined using referral code: <strong>{stats.referredBy}</strong>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

