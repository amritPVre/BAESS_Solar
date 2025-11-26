# ✅ CORRECT Zoho SMTP Configuration for Domain Email

## 🎯 The Issue: Wrong SMTP Server!

Since you have **konnect@baesslabs.com** (a domain-based email, not @zohomail.com), you need to use:

❌ **WRONG:** `smtp.zoho.com` (for personal @zohomail.com accounts)  
✅ **CORRECT:** `smtppro.zoho.com` (for domain-based accounts)

**Source:** [Zoho SMTP Configuration Guide](https://www.zoho.com/mail/help/zoho-smtp.html#smtp-details)

---

## ⚡ CORRECT Configuration (Use This!)

### **Go to Supabase Dashboard:**
Settings → Authentication → SMTP Settings

---

## 📧 Option 1: SSL (Port 465) - RECOMMENDED

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORRECT ZOHO SMTP FOR DOMAIN EMAIL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Enable Custom SMTP: ✅ ON

Sender email: konnect@baesslabs.com
Sender name: BAESS Labs

Host: smtppro.zoho.com
Port: 465
Username: konnect@baesslabs.com
Password: [your Zoho password or app-specific password]

Security Type: SSL/TLS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📧 Option 2: TLS (Port 587) - ALTERNATIVE

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORRECT ZOHO SMTP FOR DOMAIN EMAIL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Enable Custom SMTP: ✅ ON

Sender email: konnect@baesslabs.com
Sender name: BAESS Labs

Host: smtppro.zoho.com
Port: 587
Username: konnect@baesslabs.com
Password: [your Zoho password or app-specific password]

Security Type: TLS/STARTTLS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔐 Password Requirements

According to Zoho documentation:

### **If Two-Factor Authentication is Enabled:**

You **MUST** use an Application-Specific Password:

1. Go to: https://accounts.zoho.com/home
2. Navigate to: **Security** → **Application-Specific Passwords**
3. Click: **Generate New Password**
4. Name: "BAESS Labs Supabase"
5. Copy the generated password
6. **Use this in Supabase**, not your regular password

### **If No Two-Factor Authentication:**

You can use your regular Zoho email password.

**Recommended:** Enable 2FA and use app-specific passwords for better security!

---

## 📊 Summary of Changes

| Setting | ❌ Wrong (Before) | ✅ Correct (Now) |
|---------|------------------|------------------|
| **Host** | smtp.zoho.com | **smtppro.zoho.com** |
| **Port (SSL)** | 465 | 465 ✅ |
| **Port (TLS)** | 587 | 587 ✅ |
| **Security** | SSL/TLS or STARTTLS | SSL/TLS or STARTTLS ✅ |
| **Username** | konnect@baesslabs.com | konnect@baesslabs.com ✅ |
| **Password** | Regular password | App-specific password (if 2FA) |

---

## 🚀 Quick Fix Steps

### **1. Update Supabase SMTP Settings** (2 minutes)

Go to: **Supabase Dashboard → Settings → Authentication → SMTP Settings**

Change:
```
Host: smtppro.zoho.com (CHANGE THIS!)
Port: 465
Security: SSL/TLS
```

Keep everything else the same.

---

### **2. Save and Test** (1 minute)

1. Click **"Save"**
2. Click **"Send Test Email"**
3. Enter your email
4. Check inbox

**Should work now!** ✅

---

### **3. Test Password Reset** (1 minute)

1. Go to: https://www.baess.app/auth
2. Click "Forgot password?"
3. Enter email
4. Should send successfully! ✅

---

## 📖 Reference from Zoho

According to [Zoho's official documentation](https://www.zoho.com/mail/help/zoho-smtp.html#smtp-details):

> **Outgoing Server Settings** (Paid Organization users with a domain-based email address, you@yourdomain.com):
> 
> - **Outgoing Server Name:** smtppro.zoho.com
> - **Port:** 465 (SSL) or 587 (TLS)
> - **Security Type:** SSL or TLS
> - **Require Authentication:** Yes

---

## ✅ Complete Correct Configuration

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL CORRECT CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Email Type: Domain-based (konnect@baesslabs.com)
Server: smtppro.zoho.com (for paid domain accounts)

Option A (SSL - Recommended):
├─ Host: smtppro.zoho.com
├─ Port: 465
├─ Security: SSL/TLS
├─ Username: konnect@baesslabs.com
└─ Password: [app-specific password]

Option B (TLS - Alternative):
├─ Host: smtppro.zoho.com
├─ Port: 587
├─ Security: TLS/STARTTLS
├─ Username: konnect@baesslabs.com
└─ Password: [app-specific password]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎯 Why This Fixes Your Error

**The 500 error happened because:**
- You were using `smtp.zoho.com` (for personal accounts)
- But you have `konnect@baesslabs.com` (domain account)
- Zoho rejected the connection → 500 error

**Now with `smtppro.zoho.com`:**
- ✅ Correct server for domain emails
- ✅ Authentication will work
- ✅ Emails will send
- ✅ No more 500 errors!

---

## 🔄 Change It Right Now

**Go to Supabase and change ONE thing:**

```
Host: smtppro.zoho.com
```

That's it! Save → Test → Should work! ✅

---

**Reference:** [Zoho SMTP Server Configuration](https://www.zoho.com/mail/help/zoho-smtp.html#smtp-details)

