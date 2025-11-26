# 📧 Zoho Mail SMTP Setup for BAESS Labs

## ✅ You Have Custom Email: konnect@baesslabs.com

Perfect! Since you're using Zoho Mail, here's the exact configuration for Supabase.

---

## 🚀 Quick Setup (10 Minutes)

### **Step 1: Configure Supabase SMTP**

1. **Go to Supabase Dashboard:**
   - Your Project → Settings → Authentication → SMTP Settings

2. **Enable Custom SMTP and fill in:**

```
✅ Enable Custom SMTP

Sender email: konnect@baesslabs.com
Sender name: BAESS Labs

Host: smtp.zoho.com
Port number: 587
Username: konnect@baesslabs.com
Password: [your Zoho email password]

✅ Secure connection: Enable (TLS/STARTTLS)
```

3. **Click "Save"**

4. **Click "Send Test Email"** to verify

---

## 🔐 Security Note: Use App-Specific Password (Recommended)

For better security, use a Zoho app-specific password instead of your main password:

### **Create App-Specific Password in Zoho:**

1. **Go to Zoho Mail Settings:**
   - Log in to https://mail.zoho.com
   - Click your profile icon → My Account
   - Go to **Security** tab

2. **Enable Two-Factor Authentication** (if not already):
   - Required for app-specific passwords

3. **Generate App Password:**
   - Go to: **Application-Specific Passwords**
   - Click **Generate New Password**
   - Name: "BAESS Labs Supabase SMTP"
   - Select: "Email - SMTP"
   - Click **Generate**
   - **Copy the generated password** (you won't see it again!)

4. **Use this app password** instead of your main password in Supabase SMTP settings

---

## ⚙️ Complete Supabase Configuration

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUPABASE SMTP SETTINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Enable Custom SMTP: ✅ ON

Sender Details:
├─ Sender email: konnect@baesslabs.com
└─ Sender name: BAESS Labs

SMTP Server:
├─ Host: smtp.zoho.com
├─ Port number: 587
├─ Username: konnect@baesslabs.com
├─ Password: [Zoho app-specific password]
└─ Secure connection: ✅ Enable (TLS/STARTTLS)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📧 Email Templates

### **Update Password Reset Email**

**Go to:** Supabase → Authentication → Email Templates → Reset Password

**Subject:**
```
Reset your password - BAESS Labs
```

**Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.6; 
      color: #1A1A1A; 
      background-color: #FEF3C7; 
      margin: 0; 
      padding: 0; 
    }
    .container { 
      max-width: 600px; 
      margin: 40px auto; 
      background-color: #FFFFFF; 
      border-radius: 12px; 
      overflow: hidden; 
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
    }
    .header { 
      background: linear-gradient(135deg, #0A2463 0%, #3B82F6 100%); 
      padding: 40px 20px; 
      text-align: center; 
    }
    .logo { 
      font-size: 32px; 
      font-weight: bold; 
      color: #FFFFFF; 
      margin-bottom: 10px; 
    }
    .logo-accent { 
      color: #FFA500; 
    }
    .header-text { 
      color: #FEF3C7; 
      font-size: 16px; 
      margin: 0; 
    }
    .content { 
      padding: 40px 30px; 
    }
    .content h2 { 
      color: #0A2463; 
      margin-top: 0; 
      font-size: 24px; 
    }
    .content p { 
      color: #4A5568; 
      margin: 16px 0; 
    }
    .button { 
      display: inline-block; 
      padding: 16px 40px; 
      background: linear-gradient(135deg, #FFA500 0%, #F7931E 100%); 
      color: #FFFFFF !important; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: bold; 
      font-size: 16px; 
      margin: 20px 0; 
      box-shadow: 0 4px 12px rgba(255, 165, 0, 0.3); 
    }
    .button:hover { 
      opacity: 0.9; 
    }
    .link-text { 
      font-size: 12px; 
      color: #718096; 
      word-break: break-all; 
      margin: 20px 0; 
      padding: 15px; 
      background-color: #F7FAFC; 
      border-radius: 6px; 
    }
    .footer { 
      padding: 30px; 
      background-color: #F7FAFC; 
      border-top: 2px solid #FEF3C7; 
      text-align: center; 
    }
    .footer p { 
      color: #718096; 
      font-size: 14px; 
      margin: 8px 0; 
    }
    .footer-links { 
      margin-top: 15px; 
    }
    .footer-links a { 
      color: #0A2463; 
      text-decoration: none; 
      margin: 0 10px; 
      font-size: 13px; 
    }
    .security-note { 
      background-color: #FEF3C7; 
      border-left: 4px solid #FFA500; 
      padding: 15px; 
      margin: 20px 0; 
      border-radius: 4px; 
    }
    .security-note p { 
      color: #0A2463; 
      margin: 0; 
      font-size: 14px; 
    }
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
        © 2025 BAESS Labs. All rights reserved.<br>
        Questions? Reply to <a href="mailto:konnect@baesslabs.com" style="color: #0A2463;">konnect@baesslabs.com</a>
      </p>
    </div>
  </div>
</body>
</html>
```

---

### **Update Email Confirmation Template**

**Go to:** Authentication → Email Templates → Confirm signup

**Subject:**
```
Welcome to BAESS Labs - Confirm your email
```

**Body:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* (Same styles as above) */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BAESS <span class="logo-accent">Labs</span></div>
      <p class="header-text">Solar Intelligence Delivered</p>
    </div>
    
    <div class="content">
      <h2>Welcome to BAESS Labs! 🎉</h2>
      <p>Hi there,</p>
      <p>Thanks for signing up! We're excited to have you on board. Click the button below to verify your email address and get started:</p>
      
      <center>
        <a href="{{ .ConfirmationURL }}" class="button">Confirm Email</a>
      </center>
      
      <div class="security-note">
        <p><strong>⏱️ This link expires in 24 hours</strong></p>
      </div>
      
      <p>Or copy and paste this link into your browser:</p>
      <div class="link-text">{{ .ConfirmationURL }}</div>
      
      <p>Once confirmed, you'll have access to:</p>
      <ul>
        <li>✨ AI-Powered PV Designer</li>
        <li>⚡ Instant BOQ Generation</li>
        <li>📊 Advanced Financial Analysis</li>
        <li>🔋 BESS Design Tool</li>
      </ul>
      
      <p>If you didn't create an account, you can safely ignore this email.</p>
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
        © 2025 BAESS Labs. All rights reserved.<br>
        Questions? Reply to <a href="mailto:konnect@baesslabs.com" style="color: #0A2463;">konnect@baesslabs.com</a>
      </p>
    </div>
  </div>
</body>
</html>
```

---

## 🧪 Testing

### **Step 1: Test SMTP Connection**

1. In Supabase SMTP Settings, click **"Send Test Email"**
2. Enter your email address
3. Check your inbox
4. Should receive email from: **BAESS Labs <konnect@baesslabs.com>**

### **Step 2: Test Password Reset**

1. Go to `https://www.baess.app/auth`
2. Click "Forgot password?"
3. Enter your test email
4. Check inbox
5. Verify email shows:
   ```
   From: BAESS Labs <konnect@baesslabs.com>
   Subject: Reset your password - BAESS Labs
   ✅ BAESS Labs branding
   ✅ Orange gradient button
   ✅ Navy header
   ```

### **Step 3: Test Signup Confirmation**

1. Create a new test account
2. Check email confirmation
3. Should show welcome message with BAESS branding

---

## 🚨 Troubleshooting

### **Issue: SMTP Authentication Failed**

**Check:**
- Username must be full email: `konnect@baesslabs.com` (not just "konnect")
- Password is correct
- If using 2FA, must use app-specific password

**Fix:**
```
1. Go to Zoho Mail → My Account → Security
2. Generate app-specific password
3. Use that instead of main password
```

---

### **Issue: Emails Not Sending**

**Check:**
- Zoho SMTP is enabled for your account
- Port 587 is open (not blocked by firewall)
- TLS/STARTTLS is enabled

**Alternative Ports (if 587 fails):**
- Try port **465** with SSL/TLS
- Or port **25** (less secure, not recommended)

---

### **Issue: Emails Go to Spam**

**Solution 1: Add SPF Record**

Add this to your baesslabs.com DNS:
```
Type: TXT
Host: @
Value: v=spf1 include:zoho.com ~all
```

**Solution 2: Add DKIM Record**

1. Go to Zoho Mail → Control Panel → Domains
2. Find your domain: baesslabs.com
3. Go to DKIM Settings
4. Copy the DKIM records
5. Add them to your DNS provider

**Solution 3: Add DMARC Policy**
```
Type: TXT
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:konnect@baesslabs.com
```

---

## 📊 Email Deliverability Checklist

After setup:

- [ ] SMTP connection successful
- [ ] Test email received
- [ ] Email shows correct sender name: "BAESS Labs"
- [ ] Email shows correct sender address: konnect@baesslabs.com
- [ ] Email has BAESS Labs branding
- [ ] Not landing in spam
- [ ] SPF record added to DNS
- [ ] DKIM configured in Zoho
- [ ] DMARC policy added
- [ ] Reply-to works (konnect@baesslabs.com)

---

## ✅ Final Configuration Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZOHO MAIL → SUPABASE SMTP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Email Account: konnect@baesslabs.com
Sender Name: BAESS Labs

SMTP Details:
├─ Host: smtp.zoho.com
├─ Port: 587
├─ Security: TLS/STARTTLS
├─ Username: konnect@baesslabs.com
└─ Password: [App-specific password]

Email Templates:
├─ Password Reset: ✅ Configured
├─ Email Confirmation: ✅ Configured
└─ Reply-to: konnect@baesslabs.com

Result:
From: BAESS Labs <konnect@baesslabs.com>
Branding: ✅ Full BAESS Labs design
Mobile: ✅ Responsive
Professional: ✅ Yes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎯 Quick Setup Checklist

**Right Now (10 minutes):**
- [ ] Go to Supabase → Settings → Authentication → SMTP Settings
- [ ] Enable Custom SMTP
- [ ] Enter Zoho SMTP details:
  - Host: smtp.zoho.com
  - Port: 587
  - Username: konnect@baesslabs.com
  - Password: [your Zoho password or app password]
- [ ] Save settings
- [ ] Send test email
- [ ] Verify email received from "BAESS Labs"

**Next (15 minutes):**
- [ ] Update password reset email template
- [ ] Update email confirmation template
- [ ] Add BAESS Labs HTML branding
- [ ] Test complete flow

**Later (Optional):**
- [ ] Add SPF record to DNS
- [ ] Configure DKIM in Zoho
- [ ] Add DMARC policy
- [ ] Monitor email deliverability

---

## 🎉 Result

**Before:**
```
From: Supabase Auth <noreply@mail.app.supabase.io>
```

**After:**
```
From: BAESS Labs <konnect@baesslabs.com>
✅ Professional
✅ Branded
✅ Trustworthy
✅ Your own domain
```

---

**Your emails will now come from your professional BAESS Labs email address!** 🚀

Ready to configure? Just follow Step 1 above! 📧

