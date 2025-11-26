# 🔐 Password Recovery Feature - Setup Guide

## ✅ What's Been Implemented

Your BAESS Labs app now has a complete password recovery system! Users can reset their passwords if they forget them.

---

## 🎯 User Flow

### **Step 1: User Clicks "Forgot password?"**
- On the login page, below the password field
- Green link: "Forgot password?"
- Redirects to `/forgot-password`

### **Step 2: Enter Email**
- User enters their registered email address
- Clicks "Send Reset Link"
- System sends password reset email via Supabase

### **Step 3: Check Email**
- User receives email with reset link
- Email contains: "Reset your password for BAESS Labs"
- Link format: `https://www.baess.app/reset-password#access_token=...`

### **Step 4: Reset Password**
- User clicks link in email
- Redirects to `/reset-password` page
- User enters new password (twice for confirmation)
- Password must be at least 6 characters

### **Step 5: Success!**
- Password is updated in Supabase
- Success message displayed
- Auto-redirect to login page after 3 seconds

---

## 🛠️ Supabase Configuration (Required)

### **1. Configure Email Templates**

Go to **Supabase Dashboard → Authentication → Email Templates**

#### **Reset Password Email Template:**

**Subject:**
```
Reset your password for BAESS Labs
```

**Body:**
```html
<h2>Reset Your Password</h2>
<p>Hi there,</p>
<p>You requested to reset your password for your BAESS Labs account.</p>
<p>Click the button below to set a new password:</p>
<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #0A2463; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a></p>
<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>This link will expire in 24 hours.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>Best regards,<br>BAESS Labs Team</p>
```

---

### **2. Configure Redirect URLs**

Go to **Supabase Dashboard → Authentication → URL Configuration**

**Add these redirect URLs:**
```
http://localhost:5173/reset-password
http://localhost:8084/reset-password
https://www.baess.app/reset-password
```

**Site URL:**
```
https://www.baess.app
```

---

### **3. Enable Password Recovery**

Go to **Supabase Dashboard → Authentication → Settings**

Ensure these are enabled:
- ✅ **Enable email confirmations** (ON)
- ✅ **Secure email change** (ON)
- ✅ **Secure password change** (ON)

---

## 📱 Features Included

### **Forgot Password Page** (`/forgot-password`)

**Features:**
- ✅ Email input with validation
- ✅ "Send Reset Link" button
- ✅ Loading state while sending
- ✅ Success confirmation message
- ✅ Email icon for visual clarity
- ✅ "Back to Login" link
- ✅ BAESS Labs branding

**User Experience:**
- Clean, centered card design
- Matches auth page aesthetic
- Mobile-responsive
- Clear instructions

---

### **Reset Password Page** (`/reset-password`)

**Features:**
- ✅ New password input
- ✅ Confirm password input
- ✅ Password visibility toggle (eye icon)
- ✅ Password matching validation
- ✅ Minimum 6 characters validation
- ✅ Real-time validation feedback
- ✅ Success animation
- ✅ Auto-redirect after success

**Security:**
- Password must match confirmation
- Minimum length enforced
- Secure update via Supabase Auth
- Token-based authentication

---

### **Login Form Update**

**Added:**
- ✅ "Forgot password?" link
- ✅ Positioned next to "Password" label
- ✅ Green color matching brand
- ✅ Hover underline effect

**Location:**
```
Password  [Forgot password?]
[password input field]
```

---

## 🎨 Design Details

### **Colors:**
- Primary: Navy Blue `#0A2463`
- Accent: Solar Green (from brand)
- Success: Green `#10B981`
- Background: Cream gradient `#FEF3C7`

### **Components Used:**
- shadcn/ui Card
- shadcn/ui Input
- shadcn/ui Button
- shadcn/ui Label
- Lucide React icons
- Framer Motion animations

---

## 🧪 Testing the Feature

### **Test Flow:**

1. **Go to login page:** `http://localhost:5173/auth` or `https://www.baess.app/auth`

2. **Click "Forgot password?"** link below password field

3. **Enter email:** Use a real email you have access to

4. **Click "Send Reset Link"**

5. **Check email:** Look for "Reset your password for BAESS Labs"

6. **Click reset link** in email

7. **Enter new password:** Type new password twice

8. **Click "Reset Password"**

9. **Success!** You'll see success message and auto-redirect

10. **Login with new password** to verify it worked

---

## 🔍 Troubleshooting

### **Email Not Received:**

**Check:**
- Spam/junk folder
- Email address is correct and registered
- Supabase email template is configured
- SMTP settings in Supabase are correct

**Solution:**
```sql
-- Verify user exists in Supabase
SELECT email FROM auth.users WHERE email = 'user@example.com';
```

---

### **Reset Link Not Working:**

**Check:**
- Link hasn't expired (24 hours)
- Redirect URL is configured in Supabase
- User clicked the link (not just copied it)

**Supabase Setting:**
```
Authentication → URL Configuration → Redirect URLs
Add: https://www.baess.app/reset-password
```

---

### **Password Not Updating:**

**Check Console Logs:**
```javascript
// In browser console, check for errors
// Should see: "Password updated successfully"
```

**Verify Supabase Auth:**
```javascript
// Check if user is in recovery mode
supabase.auth.onAuthStateChange((event) => {
  console.log('Auth event:', event);
  // Should see: PASSWORD_RECOVERY
});
```

---

## 📊 Database Impact

**No new tables created!** 

This feature uses Supabase's built-in authentication system:
- `auth.users` table (existing)
- Password hashes stored securely
- Reset tokens managed by Supabase
- Email delivery via Supabase SMTP

---

## 🔒 Security Features

1. **Token-Based Reset:**
   - Unique, time-limited tokens
   - Expires after 24 hours
   - One-time use only

2. **Password Requirements:**
   - Minimum 6 characters
   - Must match confirmation
   - Securely hashed by Supabase

3. **Email Verification:**
   - Only registered emails can request reset
   - Email must be verified

4. **Rate Limiting:**
   - Supabase rate limits reset requests
   - Prevents abuse

---

## 🎯 Production Checklist

Before going live:
- [ ] Supabase email template configured
- [ ] Production redirect URL added (`https://www.baess.app/reset-password`)
- [ ] Site URL set to `https://www.baess.app`
- [ ] Test with real email
- [ ] Verify email delivery (not in spam)
- [ ] Test complete flow end-to-end
- [ ] Check mobile responsive design
- [ ] Verify success redirect works

---

## 📧 Email Configuration (Optional - Custom SMTP)

**Default:** Supabase sends emails automatically (limited on free tier)

**For Custom Domain Emails:**

Go to **Supabase Dashboard → Project Settings → Auth → SMTP Settings**

**Configure:**
```
SMTP Host: smtp.gmail.com (or your provider)
SMTP Port: 587
SMTP User: noreply@baess.app
SMTP Password: [your app password]
```

**From Email:**
```
BAESS Labs <noreply@baess.app>
```

---

## 🚀 What Users See

### **On Login Page:**
```
Email
[your@email.com]

Password  [Forgot password?]  ← NEW LINK
[••••••••]

[Login] button
```

### **On Forgot Password Page:**
```
🔐 Forgot Password?
Enter your email and we'll send you a reset link

Email
[your@email.com]

[Send Reset Link]

Remember your password? Back to Login
```

### **On Reset Password Page:**
```
🔐 Reset Your Password
Enter your new password below

New Password
[••••••••] [👁]

Confirm New Password
[••••••••] [👁]

Must be at least 6 characters
❌ Passwords don't match (if different)

[Reset Password]
```

### **Success State:**
```
✅ Password Reset Successful!
Redirecting you to login...
```

---

## 🎉 Ready to Use!

Your password recovery feature is now live and ready for users!

**Routes Added:**
- ✅ `/forgot-password` - Request reset
- ✅ `/reset-password` - Set new password

**Files Created:**
- ✅ `src/pages/ForgotPassword.tsx`
- ✅ `src/pages/ResetPassword.tsx`
- ✅ Updated `src/components/auth/LoginForm.tsx`
- ✅ Updated `src/App.tsx` with new routes

**Deployed:** Changes pushed to GitHub and deploying on Vercel now!

---

**Need help?** Check Supabase Dashboard → Authentication → Users to see password reset activity logs.

