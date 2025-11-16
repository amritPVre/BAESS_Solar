# 🎁 Referral Program Setup Guide

## Overview

The complete referral program has been implemented! Here's what's included:

### ✅ Features Implemented

1. **Unique Referral Codes**
   - Each user gets a unique 5-character code (e.g., `ABC12`)
   - Format: 3 uppercase letters + 2 numbers
   - Auto-generated for all users (existing and new)

2. **Credit Rewards**
   - New users: **+3 AI credits** when signing up with a referral code
   - Referrer: **+9 AI credits** for each successful referral

3. **Social Media Sharing**
   - WhatsApp
   - Facebook
   - Twitter/X
   - LinkedIn
   - Native mobile share (automatic)
   - Copy to clipboard

4. **Referral Tracking**
   - Total referrals count
   - Total credits earned from referrals
   - View who referred you

5. **Security**
   - Can't use your own referral code
   - Each user can only be referred once
   - Unique code validation
   - reCAPTCHA v3 protection

---

## 📋 Setup Instructions

### Step 1: Run Database Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open and run the file: `REFERRAL_SYSTEM_MIGRATION.sql`

This will:
- ✅ Add referral_code columns to profiles table
- ✅ Create referrals tracking table
- ✅ Create code generation function
- ✅ Create referral bonus application function
- ✅ Update trigger to auto-generate codes for new users
- ✅ **Generate codes for ALL existing users**
- ✅ Set up Row Level Security policies

### Step 2: Verify Database Setup

After running the migration, you should see output like:

```
Referral system setup complete!
Total users with codes: [number]
```

Check that your users have codes:

```sql
SELECT 
  id,
  email,
  referral_code,
  total_referrals,
  referral_credits_earned
FROM public.profiles
LIMIT 10;
```

### Step 3: Deploy to Vercel

```bash
# Already committed and pushed to GitHub
# Just redeploy in Vercel (or it will auto-deploy)
```

### Step 4: Test the System

#### Test 1: Check Your Referral Code
1. Log in to your account
2. Go to **Account Settings**
3. Scroll to **"Referral Program"** section
4. You should see your unique referral code

#### Test 2: Share Referral Link
1. Click the **"Share Referral Link"** button
2. Or try individual social media buttons
3. Verify the link format: `https://www.baess.app/auth?ref=ABC12`

#### Test 3: Sign Up with Referral Code
1. Log out or use a different browser/incognito
2. Go to sign-up page
3. The referral code field should auto-fill if you clicked a referral link
4. Or manually enter a referral code
5. Complete registration
6. You should see: "🎉 Referral Code Applied! You received 3 bonus AI credits!"

#### Test 4: Verify Credits
1. Log back in to the referrer's account
2. Check AI credits - should have increased by +9
3. Check referral stats - should show:
   - Total Referrals: 1
   - Credits Earned: 9

---

## 🎨 UI Components

### 1. Referral Card (Account Page)

Located in: `src/components/referral/ReferralCard.tsx`

Features:
- Large, prominent referral code display
- Copy button
- Referral stats (total referrals, credits earned)
- "How it Works" section
- Social media share buttons
- Mobile-optimized

Design:
- Orange/amber gradient theme
- Modern, sleek UI
- Fully responsive

### 2. Register Form Update

Located in: `src/components/auth/RegisterForm.tsx`

Features:
- New "Referral Code (Optional)" field
- Auto-fills from URL parameter (`?ref=ABC12`)
- Uppercase input formatting
- Visual indicator (gift icon)
- Bonus credit info

### 3. Account Page Integration

Located in: `src/pages/UserAccount.tsx`

Features:
- New navigation link: "Referral Program"
- Full referral card section
- Positioned between Subscription and AI Credits sections

---

## 🔗 Share Link Format

### URL Structure
```
https://www.baess.app/auth?ref=ABC12
```

### Share Message Template

**Short Version:**
```
🌞 Design solar PV systems with AI in minutes!
✨ Use my referral code: ABC12
🎁 Get +3 FREE AI credits when you sign up!

https://www.baess.app/auth?ref=ABC12
```

**Long Version** (for LinkedIn/Facebook):
```
I've been using BAESS Labs for AI-powered solar PV system design, and it's incredible! 🌞

If you're in solar engineering or energy, you should check this out:

✨ AI-powered BOQ generation
📊 Advanced financial analysis
⚡ BESS energy storage design
🎯 NREL-verified calculations

Use my referral code ABC12 to get +3 FREE AI credits when you sign up!

https://www.baess.app/auth?ref=ABC12
```

---

## 📊 Database Schema

### profiles table (new columns)
```sql
referral_code VARCHAR(5) UNIQUE  -- e.g., "ABC12"
referred_by VARCHAR(5)           -- Code used during signup
total_referrals INTEGER          -- Count of successful referrals
referral_credits_earned INTEGER  -- Total bonus credits earned
```

### referrals table (new)
```sql
id UUID PRIMARY KEY
referrer_id UUID                 -- User who referred
referred_id UUID                 -- User who was referred
referral_code VARCHAR(5)         -- Code used
credits_given_to_referrer INT    -- Usually 9
credits_given_to_referred INT    -- Usually 3
created_at TIMESTAMP
```

---

## 🔐 Security Features

1. **Unique Codes**
   - Collision detection in generation function
   - Database unique constraint

2. **Validation**
   - Can't refer yourself
   - Can only be referred once
   - Invalid codes fail gracefully

3. **RLS Policies**
   - Users can only view their own referral stats
   - System-level functions for bonus application

4. **reCAPTCHA v3**
   - Already implemented for sign-up
   - Protects against bot abuse

---

## 🎯 How It Works

### User Flow

1. **Existing User**:
   ```
   Login → Account Page → Referral Section
   → See code → Click Share → Choose platform
   → Share with friends
   ```

2. **New User**:
   ```
   Click referral link → Sign-up page
   → Referral code auto-fills → Complete registration
   → Get +3 credits bonus
   ```

3. **Referrer**:
   ```
   Friend signs up → Automatic credit bonus
   → +9 credits added → Notification (optional)
   → Stats updated
   ```

### Backend Flow

1. **Code Generation** (automatic):
   ```sql
   New user signs up
   → Trigger: on_auth_user_created
   → Function: generate_referral_code()
   → Insert profile with unique code
   ```

2. **Referral Application** (on sign-up):
   ```sql
   Sign-up with code
   → Function: apply_referral_bonus(user_id, code)
   → Validate code
   → Add +3 credits to new user
   → Add +9 credits to referrer
   → Insert referral record
   → Update stats
   ```

---

## 🚀 Next Steps (Optional Enhancements)

### Phase 2: Analytics Dashboard
- [ ] Referral performance chart
- [ ] Top referrers leaderboard
- [ ] Conversion tracking

### Phase 3: Advanced Features
- [ ] Custom referral rewards (tiered system)
- [ ] Email notifications for successful referrals
- [ ] Referral milestones (badges/achievements)
- [ ] Limited-time bonus campaigns

### Phase 4: Marketing Tools
- [ ] Referral email templates
- [ ] Social media post templates
- [ ] Referral contest system
- [ ] Affiliate program (for influencers)

---

## 🐛 Troubleshooting

### Issue: "Invalid referral code"
**Solution**: Check that:
1. Code exists in database
2. Code is exactly 5 characters (3 letters + 2 numbers)
3. Case-insensitive matching is working

### Issue: Credits not applied
**Solution**: Check:
1. User hasn't been referred before
2. Not using their own code
3. RLS policies are correct
4. Function has proper permissions

### Issue: Codes not generated for existing users
**Solution**: Run this in Supabase SQL Editor:
```sql
DO $$
DECLARE
  user_record RECORD;
  new_code VARCHAR(5);
BEGIN
  FOR user_record IN 
    SELECT id FROM public.profiles WHERE referral_code IS NULL
  LOOP
    new_code := public.generate_referral_code();
    UPDATE public.profiles 
    SET referral_code = new_code 
    WHERE id = user_record.id;
  END LOOP;
END $$;
```

### Issue: Share buttons not working
**Solution**: Check:
1. Browser allows pop-ups
2. URL encoding is correct
3. Social media platforms aren't blocked

---

## 📱 Mobile Sharing

The referral system uses the **Web Share API** for native mobile sharing:

```javascript
if (navigator.share) {
  // Use native share sheet
  navigator.share({
    title: "Join BAESS Labs",
    text: "Get +3 free AI credits!",
    url: "https://www.baess.app/auth?ref=ABC12"
  });
}
```

This provides a seamless experience on:
- iOS (Safari)
- Android (Chrome, Firefox)
- Progressive Web Apps

---

## ✅ Testing Checklist

Before going live:

- [ ] Run database migration
- [ ] Verify all users have referral codes
- [ ] Test sign-up with referral code
- [ ] Verify credits are applied correctly
- [ ] Test all social sharing buttons
- [ ] Test copy to clipboard
- [ ] Test on mobile devices
- [ ] Test edge cases (own code, duplicate use)
- [ ] Check referral stats display correctly
- [ ] Verify URL parameter (`?ref=`) auto-fills form

---

## 🎉 Success!

Your referral program is now live! Users can:
- ✅ Share their unique codes
- ✅ Earn bonus credits
- ✅ Track their referral success
- ✅ Share easily on social media

**Need help?** Check the troubleshooting section or review the code comments in:
- `src/services/referralService.ts`
- `src/components/referral/ReferralCard.tsx`
- `REFERRAL_SYSTEM_MIGRATION.sql`

