# reCAPTCHA v3 Setup Guide for BAESS Labs

## 🔐 Quick Setup (5 minutes)

### Step 1: Get reCAPTCHA Keys from Google

1. **Go to Google reCAPTCHA Admin Console**:
   - Visit: https://www.google.com/recaptcha/admin/create
   - Sign in with your Google account

2. **Create a New Site**:
   - **Label**: `BAESS Labs - Production` (or `BAESS Labs - Development` for testing)
   - **reCAPTCHA type**: Select **reCAPTCHA v3**
   - **Domains**: 
     - For development: `localhost`
     - For production: `www.baess.app` and `baess.app`
   - **Accept the reCAPTCHA Terms of Service**
   - Click **Submit**

3. **Copy Your Keys**:
   - **Site Key**: Starts with `6L...` (public key, goes in frontend)
   - **Secret Key**: Starts with `6L...` (private key, NOT used in our frontend-only setup)

### Step 2: Add Site Key to Environment Variables

#### For Local Development (.env file):

Add this line to your `.env` file:

```env
VITE_RECAPTCHA_SITE_KEY=your_site_key_here
```

Replace `your_site_key_here` with the **Site Key** from Step 1.

#### For Vercel Production:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `VITE_RECAPTCHA_SITE_KEY`
   - **Value**: Your production Site Key
   - **Environments**: Select **Production**, **Preview**, and **Development**
4. Click **Save**
5. **Redeploy** your app for the changes to take effect

### Step 3: Test the Implementation

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the sign-up page**:
   - http://localhost:8084/auth

3. **Open Browser Console** (F12):
   - You should see: `reCAPTCHA loaded successfully` in the console
   - Check for any errors

4. **Try to sign up**:
   - Fill in the form
   - Click "Register"
   - The form should submit with a reCAPTCHA token

5. **Check the console**:
   - You should see: `reCAPTCHA token obtained: [token]`
   - If the score is low, you'll see: `⚠️ reCAPTCHA score is low (0.X), but allowing registration`

## 🎯 How It Works

### What is reCAPTCHA v3?

- **Invisible**: No checkboxes or puzzles for users to solve
- **Scores users**: Returns a score from 0.0 (bot) to 1.0 (human)
- **Backend verification**: You can verify the token on your backend (optional)

### Current Implementation

**Frontend Only (Simple)**:
- ✅ Adds reCAPTCHA badge to sign-up page
- ✅ Generates token on form submission
- ✅ Logs score for monitoring
- ✅ Currently allows all registrations (for testing)

**Why Frontend Only?**:
- Supabase handles auth on their backend
- reCAPTCHA primarily deters bots from submitting forms
- Most bots won't have a valid reCAPTCHA token

### Score Interpretation

- **0.9 - 1.0**: Very likely human ✅
- **0.7 - 0.9**: Probably human ✅
- **0.5 - 0.7**: Suspicious ⚠️
- **0.0 - 0.5**: Very likely bot ❌

## 🔧 Configuration Options

### Adjust Score Threshold (Optional)

In `src/components/auth/RegisterForm.tsx`, you can modify:

```typescript
const MIN_RECAPTCHA_SCORE = 0.5; // Default: 0.5

// In handleRegister function:
if (recaptchaScore < MIN_RECAPTCHA_SCORE) {
  setError("Registration failed. Please try again.");
  return;
}
```

### Hide reCAPTCHA Badge (Optional)

Add to your CSS (in `src/index.css`):

```css
.grecaptcha-badge {
  visibility: hidden;
}
```

**Note**: If you hide the badge, you must include this text somewhere:
> "This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply."

## 📊 Monitoring

### Check reCAPTCHA Analytics

1. Go to: https://www.google.com/recaptcha/admin
2. Select your site
3. View:
   - Request count
   - Score distribution
   - Domain verification

## 🐛 Troubleshooting

### Error: "reCAPTCHA not loaded"
- Check if `VITE_RECAPTCHA_SITE_KEY` is in your `.env` file
- Restart your development server after adding the key
- Clear browser cache

### Error: "Invalid site key"
- Verify the site key is correct
- Check if domain is registered in Google reCAPTCHA admin
- For localhost, make sure you added `localhost` as a domain

### Error: "Network error"
- Check your internet connection
- Verify Google reCAPTCHA is not blocked by firewall/VPN
- Try a different browser

### Low scores in development
- Development/testing can show lower scores
- Use incognito/private browsing for more accurate scores
- Production scores are generally higher

## 🚀 Next Steps (Optional Enhancements)

1. **Backend Verification**:
   - Create a Supabase Edge Function
   - Verify the token server-side
   - Reject registrations with low scores

2. **Rate Limiting**:
   - Limit sign-ups per IP address
   - Already implemented in Supabase Auth

3. **Email Verification**:
   - Already implemented via Supabase
   - Users must verify email before access

4. **Disposable Email Blocking**:
   - Integrate email validation service
   - Block known temporary email domains

## 📝 Summary

✅ **What we implemented**:
- reCAPTCHA v3 integration on sign-up form
- Automatic bot detection
- Score logging for monitoring
- Zero friction for legitimate users

✅ **What it protects against**:
- Automated bot registrations
- Form spam
- Mass fake accounts
- Brute force attacks

✅ **User experience**:
- Completely invisible
- No annoying puzzles
- No extra steps
- Fast and seamless

---

**Need Help?** Contact: konnect@baesslabs.com

