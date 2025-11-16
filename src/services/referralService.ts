import { supabase } from '@/integrations/supabase/client';

export interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  creditsEarned: number;
  referredBy: string | null;
}

export interface ReferralShareData {
  url: string;
  title: string;
  text: string;
}

/**
 * Get user's referral code and stats
 */
export const getReferralStats = async (userId: string): Promise<ReferralStats | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('referral_code, total_referrals, referral_credits_earned, referred_by')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return {
      referralCode: data.referral_code,
      totalReferrals: data.total_referrals || 0,
      creditsEarned: data.referral_credits_earned || 0,
      referredBy: data.referred_by,
    };
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return null;
  }
};

/**
 * Apply referral code for a new user
 */
export const applyReferralCode = async (
  userId: string,
  referralCode: string
): Promise<{ success: boolean; message: string; creditsReceived?: number }> => {
  try {
    const { data, error } = await supabase.rpc('apply_referral_bonus', {
      referred_user_id: userId,
      ref_code: referralCode.toUpperCase(),
    });

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error('Error applying referral code:', error);
    return {
      success: false,
      message: error.message || 'Failed to apply referral code',
    };
  }
};

/**
 * Get referral share data
 */
export const getReferralShareData = (referralCode: string): ReferralShareData => {
  const appUrl = import.meta.env.VITE_APP_URL || 'https://www.baess.app';
  const shareUrl = `${appUrl}/auth?ref=${referralCode}`;
  
  return {
    url: shareUrl,
    title: 'Join BAESS Labs - AI-Powered Solar Design',
    text: `🌞 Design solar PV systems with AI in minutes!\n\n✨ Use my referral code: ${referralCode}\n🎁 Get +3 FREE AI credits when you sign up!\n\n`,
  };
};

/**
 * Generate WhatsApp share link
 */
export const getWhatsAppShareLink = (referralCode: string): string => {
  const shareData = getReferralShareData(referralCode);
  const message = encodeURIComponent(`${shareData.text}${shareData.url}`);
  return `https://wa.me/?text=${message}`;
};

/**
 * Generate Facebook share link
 */
export const getFacebookShareLink = (referralCode: string): string => {
  const shareData = getReferralShareData(referralCode);
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}&quote=${encodeURIComponent(shareData.text)}`;
};

/**
 * Generate Twitter/X share link
 */
export const getTwitterShareLink = (referralCode: string): string => {
  const shareData = getReferralShareData(referralCode);
  const text = encodeURIComponent(`${shareData.text}${shareData.url}`);
  return `https://twitter.com/intent/tweet?text=${text}`;
};

/**
 * Generate LinkedIn share link
 */
export const getLinkedInShareLink = (referralCode: string): string => {
  const shareData = getReferralShareData(referralCode);
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}`;
};

/**
 * Copy referral link to clipboard
 */
export const copyReferralLink = async (referralCode: string): Promise<boolean> => {
  try {
    const shareData = getReferralShareData(referralCode);
    const textToCopy = `${shareData.text}${shareData.url}`;
    await navigator.clipboard.writeText(textToCopy);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Use Web Share API if available (for mobile)
 */
export const nativeShare = async (referralCode: string): Promise<boolean> => {
  if (!navigator.share) {
    return false;
  }

  try {
    const shareData = getReferralShareData(referralCode);
    await navigator.share({
      title: shareData.title,
      text: shareData.text,
      url: shareData.url,
    });
    return true;
  } catch (error) {
    console.error('Error sharing:', error);
    return false;
  }
};

