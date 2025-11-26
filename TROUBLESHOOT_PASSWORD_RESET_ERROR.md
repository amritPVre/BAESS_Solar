# 🔧 Troubleshoot Password Reset Error (500)

## ❌ Error You're Seeing

```
Password reset error: AuthApiError: Error sending recovery email
Failed to load resource: the server responded with a status of 500
```

This means **Supabase cannot send the email** because SMTP is not configured yet.

---

## ✅ Fix: Configure Zoho SMTP in Supabase

### **Step 1: Go to Supabase Dashboard**

1. Open: https://supabase.com/dashboard
2. Select your BAESS Labs project
3. Go to: **Settings** (left sidebar, bottom)
4. Click: **Authentication**
5. Scroll down to: **SMTP Settings**

---

### **Step 2: Enable Custom SMTP**

Click the toggle to **Enable Custom SMTP** and fill in:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SMTP CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Enable Custom SMTP: ✅ ON

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sender Configuration:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sender email: konnect@baesslabs.com
Sender name: BAESS Labs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SMTP Server Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Host: smtp.zoho.com
Port number: 587

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Authentication:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Username: konnect@baesslabs.com
Password: [your Zoho email password]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Security:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Enable secure connection (TLS/STARTTLS)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### **Step 3: Save and Test**

1. Click **"Save"** button
2. Click **"Send Test Email"** button
3. Enter your email address
4. Check your inbox

**Expected Result:**
- ✅ Email arrives from "BAESS Labs <konnect@baesslabs.com>"
- ✅ No errors in Supabase dashboard

---

## 🔐 If Using 2FA on Zoho (Recommended)

If you have Two-Factor Authentication enabled on your Zoho account, you **must** use an app-specific password:

### **Generate App-Specific Password:**

1. **Go to Zoho Mail:** https://mail.zoho.com
2. Click profile icon → **My Account**
3. Go to **Security** tab
4. Scroll to: **Application-Specific Passwords**
5. Click: **Generate New Password**
6. Name: "BAESS Labs Supabase"
7. Select: "Email - SMTP"
8. Click: **Generate**
9. **Copy the password** (you won't see it again!)
10. **Use this password** in Supabase SMTP settings (not your main password)

---

## ⚠️ Other Warnings (Not Blocking)

### **1. reCAPTCHA Warning (Safe to Ignore for Now)**

```
<GoogleReCaptchaProvider /> recaptcha key not provided
```

**This is not blocking password reset.** It only affects the signup page.

**To fix (optional):**
- Add `VITE_RECAPTCHA_SITE_KEY` to Vercel environment variables
- See: `RECAPTCHA_SETUP.md` in your repo

---

### **2. Multiple GoTrueClient Warning (Safe to Ignore)**

```
Multiple GoTrueClient instances detected
```

**This is just a warning, not an error.** It happens when multiple components import Supabase client.

**To fix (optional - later):**
- Ensure all components use the same Supabase client instance
- Use a singleton pattern

---

## 🧪 Test After Configuration

### **Test 1: Direct Test from Supabase**

1. In Supabase SMTP settings
2. Click "Send Test Email"
3. Enter your email
4. Should receive test email

---

### **Test 2: Test from Your App**

1. Go to: https://www.baess.app/auth
2. Click: "Forgot password?"
3. Enter your email
4. Click: "Send Reset Link"
5. Check inbox for email from "BAESS Labs"

---

## 📊 Expected Flow After Fix

```
User clicks "Forgot password?"
   ↓
Enters email address
   ↓
Supabase connects to Zoho SMTP
   ↓
Email sent via konnect@baesslabs.com
   ↓
User receives branded BAESS Labs email
   ↓
User clicks reset link
   ↓
Redirects to /reset-password
   ↓
User sets new password
   ↓
Success! ✅
```

---

## 🚨 Still Getting 500 Error?

### **Check These:**

**1. SMTP Credentials:**
- [ ] Username is full email: `konnect@baesslabs.com`
- [ ] Password is correct (or app-specific password if using 2FA)
- [ ] No extra spaces in any field

**2. Port and Security:**
- [ ] Port is 587 (not 465 or 25)
- [ ] TLS/STARTTLS is enabled

**3. Zoho Account:**
- [ ] konnect@baesslabs.com is active and working
- [ ] SMTP is enabled for your account (check Zoho settings)
- [ ] Account is not locked or suspended

**4. Test SMTP Manually:**

Open terminal and test Zoho SMTP:
```bash
telnet smtp.zoho.com 587
```

Should respond with:
```
220 mx.zohomail.com ESMTP ready
```

If it doesn't connect, your network might be blocking port 587.

---

## 🔄 Alternative: Try Port 465

If port 587 doesn't work, try SSL on port 465:

```
Host: smtp.zoho.com
Port: 465
Username: konnect@baesslabs.com
Password: [your password]

✅ Enable secure connection (SSL)
```

---

## 📝 Quick Checklist

**Right now:**
- [ ] Go to Supabase Dashboard
- [ ] Settings → Authentication → SMTP Settings
- [ ] Enable Custom SMTP
- [ ] Host: smtp.zoho.com
- [ ] Port: 587
- [ ] Username: konnect@baesslabs.com
- [ ] Password: [Zoho password or app password]
- [ ] Enable TLS/STARTTLS
- [ ] Click Save
- [ ] Click "Send Test Email"
- [ ] Verify test email received
- [ ] Test password reset from app
- [ ] ✅ Should work!

---

## 🎯 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **500 Error** | SMTP not configured - follow Step 1-3 above |
| **Authentication failed** | Use app-specific password if using 2FA |
| **Connection timeout** | Port 587 might be blocked, try 465 |
| **Invalid credentials** | Double-check username is full email |
| **Emails not arriving** | Check spam folder, verify SMTP saved |
| **Wrong sender** | Make sure sender email is `konnect@baesslabs.com` |

---

## ✅ After SMTP is Configured

**You'll also want to:**

1. **Update email templates** (make them pretty):
   - Go to: Authentication → Email Templates
   - Update "Reset Password" template
   - Update "Confirm signup" template
   - Use the HTML templates from `ZOHO_SMTP_SETUP_BAESS.md`

2. **Test both email flows:**
   - Password reset
   - New user signup confirmation

3. **Check email deliverability:**
   - Add SPF record to DNS
   - Configure DKIM in Zoho
   - See: `ZOHO_SMTP_SETUP_BAESS.md` for details

---

## 🆘 Need More Help?

**Check Supabase Logs:**
1. Go to Supabase Dashboard
2. Click: **Logs** (left sidebar)
3. Select: **Auth Logs**
4. Look for recent password reset attempts
5. Check error messages

**Zoho Mail Logs:**
1. Go to Zoho Mail
2. Check: Sent folder
3. Verify SMTP is allowed in account settings

---

## 🎉 Success Looks Like

**After configuration:**

```
✅ Test email sent from Supabase
✅ Email received from "BAESS Labs <konnect@baesslabs.com>"
✅ Password reset works from app
✅ No 500 errors
✅ User receives branded email
✅ Reset link works
✅ User can set new password
```

---

**Start with Step 1-3 above to configure SMTP, then test again!** 🚀

The 500 error will disappear once SMTP is properly configured in Supabase.

