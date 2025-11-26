# 📧 Custom Email Setup for BAESS Labs

## 🎯 Goal
Change password recovery emails from:
- ❌ **From:** Supabase Auth `<noreply@mail.app.supabase.io>`

To:
- ✅ **From:** BAESS Labs `<noreply@baess.app>`

---

## 🚀 Quick Setup Options

You have **3 options** to send emails from your baess.app domain:

### **Option 1: Gmail SMTP (Easiest - 15 minutes)**
- Free for low volume (<500 emails/day)
- Easy to set up
- Reliable delivery
- **Recommended for getting started**

### **Option 2: SendGrid (Best for Production)**
- Free tier: 100 emails/day
- Better deliverability
- Email analytics
- Professional solution

### **Option 3: Domain Provider SMTP (Varies)**
- Use your domain's email service
- Depends on where you bought baess.app
- May require email hosting plan

---

## ⚡ Option 1: Gmail SMTP (Recommended for Now)

### **Step 1: Create App-Specific Password**

1. **Go to Google Account Settings:**
   - Visit: https://myaccount.google.com/security
   - Or use your personal Gmail account

2. **Enable 2-Step Verification** (if not already enabled)
   - Required for app passwords

3. **Generate App Password:**
   - Search for "App passwords" in settings
   - Click "App passwords"
   - Select "Mail" and "Other" (custom name)
   - Name it: "BAESS Labs Supabase"
   - Click "Generate"
   - **Copy the 16-character password** (example: `abcd efgh ijkl mnop`)

---

### **Step 2: Configure Supabase SMTP**

1. **Go to Supabase Dashboard:**
   - Your Project → Settings → Authentication

2. **Scroll to "SMTP Settings"**

3. **Enable Custom SMTP** and fill in:

```
Enable Custom SMTP: ✅ ON

Sender email: noreply@baess.app
Sender name: BAESS Labs

Host: smtp.gmail.com
Port number: 587
Username: your-gmail@gmail.com
Password: [paste 16-char app password from Step 1]

Secure connection: ✅ Enable (TLS/STARTTLS)
```

4. **Click "Save"**

5. **Send Test Email:**
   - Click "Send Test Email" button
   - Enter your email
   - Check if you receive it from "BAESS Labs <noreply@baess.app>"

---

### **Important Note About Gmail:**

Even though you're using Gmail SMTP, the email will show as coming from `noreply@baess.app` in the **From** field, but technically it's sent via Gmail's servers. 

**For true domain email (no "via gmail.com" warning), use Option 2 (SendGrid) or Option 3 (Domain Email).**

---

## 🔥 Option 2: SendGrid (Professional Solution)

### **Step 1: Create SendGrid Account**

1. **Sign up:** https://signup.sendgrid.com/
   - Free tier: 100 emails/day forever
   - No credit card required

2. **Verify your email address**

---

### **Step 2: Domain Authentication**

1. **Go to SendGrid Dashboard:**
   - Settings → Sender Authentication → Authenticate Your Domain

2. **Enter your domain:** `baess.app`

3. **Copy DNS Records** provided by SendGrid (will look like):
   ```
   Type: CNAME
   Host: em1234.baess.app
   Value: u1234567.wl123.sendgrid.net
   
   Type: CNAME
   Host: s1._domainkey.baess.app
   Value: s1.domainkey.u1234567.wl123.sendgrid.net
   
   Type: CNAME
   Host: s2._domainkey.baess.app
   Value: s2.domainkey.u1234567.wl123.sendgrid.net
   ```

4. **Add DNS Records to your domain:**
   - Go to where you manage baess.app DNS (Spaceship.com, Cloudflare, etc.)
   - Add all CNAME records provided by SendGrid
   - Wait 10-30 minutes for DNS propagation

5. **Verify domain in SendGrid:**
   - Click "Verify" button
   - Should show ✅ Verified

---

### **Step 3: Create API Key**

1. **Go to SendGrid:**
   - Settings → API Keys → Create API Key

2. **Name:** "BAESS Labs Supabase"

3. **Permissions:** "Full Access" or "Mail Send" only

4. **Click "Create & View"**

5. **Copy the API Key** (starts with `SG.`)
   - **Important:** Save it securely, you won't see it again!

---

### **Step 4: Configure Supabase SMTP**

1. **Go to Supabase Dashboard:**
   - Your Project → Settings → Authentication → SMTP Settings

2. **Enable Custom SMTP:**

```
Enable Custom SMTP: ✅ ON

Sender email: noreply@baess.app
Sender name: BAESS Labs

Host: smtp.sendgrid.net
Port number: 587
Username: apikey
Password: [paste your SendGrid API key starting with SG.]

Secure connection: ✅ Enable (TLS/STARTTLS)
```

3. **Click "Save"**

4. **Send Test Email** to verify

---

## 📮 Option 3: Domain Email Service

If you purchased email hosting with baess.app:

### **Step 1: Get SMTP Details from Your Provider**

**Common providers:**

**If using Google Workspace (baess.app):**
```
Host: smtp.gmail.com
Port: 587
Username: noreply@baess.app
Password: [your email password or app password]
```

**If using Microsoft 365:**
```
Host: smtp.office365.com
Port: 587
Username: noreply@baess.app
Password: [your email password]
```

**If using Spaceship Email:**
- Log into Spaceship.com
- Go to Email Hosting → SMTP Settings
- Copy the SMTP details

---

### **Step 2: Configure in Supabase**

Use the SMTP details from your provider in Supabase SMTP Settings (same as above).

---

## 🎨 Update Email Template (After SMTP Setup)

Once SMTP is configured, update the email template:

### **Go to Supabase:**
- Authentication → Email Templates → Reset Password

### **Update Subject:**
```
Reset your password - BAESS Labs
```

### **Update Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1A1A1A; background-color: #FEF3C7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #0A2463 0%, #3B82F6 100%); padding: 40px 20px; text-align: center; }
    .logo { font-size: 32px; font-weight: bold; color: #FFFFFF; margin-bottom: 10px; }
    .logo-accent { color: #FFA500; }
    .header-text { color: #FEF3C7; font-size: 16px; margin: 0; }
    .content { padding: 40px 30px; }
    .content h2 { color: #0A2463; margin-top: 0; font-size: 24px; }
    .content p { color: #4A5568; margin: 16px 0; }
    .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #FFA500 0%, #F7931E 100%); color: #FFFFFF !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; box-shadow: 0 4px 12px rgba(255, 165, 0, 0.3); }
    .button:hover { opacity: 0.9; }
    .link-text { font-size: 12px; color: #718096; word-break: break-all; margin: 20px 0; padding: 15px; background-color: #F7FAFC; border-radius: 6px; }
    .footer { padding: 30px; background-color: #F7FAFC; border-top: 2px solid #FEF3C7; text-align: center; }
    .footer p { color: #718096; font-size: 14px; margin: 8px 0; }
    .footer-links { margin-top: 15px; }
    .footer-links a { color: #0A2463; text-decoration: none; margin: 0 10px; font-size: 13px; }
    .security-note { background-color: #FEF3C7; border-left: 4px solid #FFA500; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .security-note p { color: #0A2463; margin: 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BAESS <span class="logo-accent">Labs</span></div>
      <p class="header-text">Solar Intelligence Delivered</p>
    </div>
    
    <div class="content">
      <h2>Reset Your Password</h2>
      <p>Hi there,</p>
      <p>You requested to reset your password for your BAESS Labs account. Click the button below to create a new password:</p>
      
      <center>
        <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
      </center>
      
      <div class="security-note">
        <p><strong>⏱️ This link expires in 24 hours</strong></p>
      </div>
      
      <p>Or copy and paste this link into your browser:</p>
      <div class="link-text">{{ .ConfirmationURL }}</div>
      
      <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    </div>
    
    <div class="footer">
      <p><strong>BAESS Labs Team</strong></p>
      <p>Solar Intelligence for a Sustainable Future</p>
      <div class="footer-links">
        <a href="https://www.baess.app">Visit Website</a> |
        <a href="https://www.baess.app/contact">Contact Support</a> |
        <a href="https://www.baess.app/privacy">Privacy Policy</a>
      </div>
      <p style="margin-top: 20px; font-size: 12px; color: #A0AEC0;">
        © 2025 BAESS Labs. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
```

---

## ✅ Verification Checklist

After setup, test the email:

- [ ] Email arrives from "BAESS Labs <noreply@baess.app>"
- [ ] Subject line shows "Reset your password - BAESS Labs"
- [ ] Email has BAESS Labs branding (logo, colors)
- [ ] "Reset Password" button works
- [ ] Email looks good on mobile
- [ ] Not in spam folder
- [ ] No "via" warnings (if using SendGrid)

---

## 🎨 Also Update: Confirmation Email

Don't forget to update the **Email Confirmation** template too!

**Go to:** Authentication → Email Templates → Confirm signup

**Subject:**
```
Welcome to BAESS Labs - Confirm your email
```

**Body:** (Similar HTML template as above, but with):
```html
<h2>Welcome to BAESS Labs! 🎉</h2>
<p>Thanks for signing up! Click the button below to verify your email address:</p>
<a href="{{ .ConfirmationURL }}" class="button">Confirm Email</a>
```

---

## 🚨 Common Issues & Fixes

### **Issue: Test email fails**

**Check:**
- SMTP credentials are correct
- Port 587 is open (not blocked by firewall)
- Username format is correct (sometimes it's just `apikey` for SendGrid)
- Password has no extra spaces

**Fix:**
- Double-check all SMTP settings
- Try port 465 instead of 587
- Verify API key is active

---

### **Issue: Emails go to spam**

**Solutions:**
1. **Add SPF record** to baess.app DNS:
   ```
   Type: TXT
   Host: @
   Value: v=spf1 include:sendgrid.net ~all
   ```
   (Adjust based on your email provider)

2. **Add DKIM records** (provided by SendGrid/provider)

3. **Warm up sending domain** (start with low volume)

---

### **Issue: Shows "via gmail.com" or "via sendgrid.net"**

This happens when domain authentication is incomplete.

**Fix:**
- Complete domain authentication in SendGrid
- Add all DNS records (SPF, DKIM, DMARC)
- Wait for DNS propagation (up to 24 hours)

---

## 📊 Recommended Setup Timeline

### **Now (Get It Working):**
- ✅ Use **Gmail SMTP** (Option 1)
- Quick 15-minute setup
- Emails work immediately
- Good enough for testing

### **This Week (Production-Ready):**
- ✅ Upgrade to **SendGrid** (Option 2)
- Better deliverability
- Professional appearance
- No "via" warnings
- Email analytics

### **Later (Optional Enhancement):**
- Create branded email templates
- Add DMARC policy
- Set up email forwarding (support@baess.app)
- Monitor bounce/spam rates

---

## 🎯 Quick Start: Gmail SMTP (5 Minutes)

**If you want to fix this RIGHT NOW:**

1. Go to https://myaccount.google.com/apppasswords
2. Create app password named "BAESS Supabase"
3. Copy the 16-character password
4. Go to Supabase → Settings → Authentication → SMTP Settings
5. Fill in:
   ```
   Sender: noreply@baess.app
   Name: BAESS Labs
   Host: smtp.gmail.com
   Port: 587
   User: your-gmail@gmail.com
   Pass: [16-char password]
   TLS: ✅
   ```
6. Save → Send Test Email
7. Done! ✅

---

## 🚀 Result

**Before:**
```
From: Supabase Auth <noreply@mail.app.supabase.io>
Subject: Reset your password for BAESS Labs
```

**After:**
```
From: BAESS Labs <noreply@baess.app>
Subject: Reset your password - BAESS Labs
✨ Branded email with BAESS Labs logo and colors
```

---

**Choose your setup option and let me know if you need help with any step!** 🎉

