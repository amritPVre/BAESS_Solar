# 🔧 Zoho SMTP Alternative Configurations

## ❌ Still Getting 500 Error?

Try these alternative Zoho SMTP configurations:

---

## 🎯 Configuration 1: Standard Zoho SMTP (Try This First)

```
Enable Custom SMTP: ✅ ON

Sender email: konnect@baesslabs.com
Sender name: BAESS Labs

Host: smtp.zoho.com
Port: 587
Username: konnect@baesslabs.com
Password: [your actual Zoho password]

Security: STARTTLS
```

---

## 🎯 Configuration 2: Zoho SMTP with SSL (Try If 587 Fails)

```
Enable Custom SMTP: ✅ ON

Sender email: konnect@baesslabs.com
Sender name: BAESS Labs

Host: smtp.zoho.com
Port: 465
Username: konnect@baesslabs.com
Password: [your actual Zoho password]

Security: SSL/TLS
```

---

## 🎯 Configuration 3: Zoho Regional SMTP (If Above Fail)

Zoho has different SMTP servers based on region. Try these:

### **For US/Global Accounts:**
```
Host: smtp.zoho.com
```

### **For EU Accounts:**
```
Host: smtp.zoho.eu
```

### **For India Accounts:**
```
Host: smtp.zoho.in
```

### **For Australia Accounts:**
```
Host: smtp.zoho.com.au
```

### **For China Accounts:**
```
Host: smtp.zoho.com.cn
```

---

## 🔍 Debug: Check Supabase Logs

**This will tell you the EXACT error:**

1. **Go to Supabase Dashboard**
2. Click **Logs** (left sidebar)
3. Select **Auth Logs**
4. Look for recent entries with "recover" or "reset"
5. Check the error message

**Common errors you'll see:**

| Error | Meaning | Solution |
|-------|---------|----------|
| `Invalid credentials` | Wrong username/password | Double-check credentials |
| `Authentication failed` | Need app password | Use 2FA app password |
| `Connection timeout` | Port blocked or wrong host | Try port 465 or different host |
| `TLS negotiation failed` | SSL/TLS issue | Try different security setting |
| `Sender not allowed` | Email not verified | Verify domain in Zoho |

---

## ✅ Step-by-Step Verification

### **Step 1: Verify Your Zoho Email Works**

1. Go to: https://mail.zoho.com
2. Log in with: konnect@baesslabs.com
3. Can you log in? ✅ Good
4. Can you send/receive emails? ✅ Good

If NO, your Zoho account has issues.

---

### **Step 2: Check if SMTP is Enabled**

1. In Zoho Mail, go to: **Settings** (gear icon)
2. Click: **Mail Accounts**
3. Select: konnect@baesslabs.com
4. Check: **POP/IMAP** settings
5. Make sure **IMAP Access** is enabled

**If disabled:**
- Enable IMAP Access
- This also enables SMTP

---

### **Step 3: Generate App-Specific Password**

Even without 2FA, an app password is more reliable:

1. **Go to:** https://accounts.zoho.com/home
2. **Click:** Security
3. **Find:** Application-Specific Passwords
4. **Click:** Generate New Password

**If you don't see this option:**
- Enable 2FA first (Security → Two-Factor Authentication)
- Then generate app password

**Use the generated password in Supabase**, not your regular password.

---

### **Step 4: Test SMTP from Command Line**

**Windows PowerShell:**
```powershell
Test-NetConnection -ComputerName smtp.zoho.com -Port 587
```

**Should show:**
```
TcpTestSucceeded: True
```

**If False**, port 587 is blocked. Try port 465.

---

### **Step 5: Try Minimal Configuration**

In Supabase, try the absolute minimum:

```
Enable Custom SMTP: ✅ ON

Sender email: konnect@baesslabs.com
Sender name: BAESS Labs

Host: smtp.zoho.com
Port: 587
Username: konnect@baesslabs.com
Password: [app-specific password from Step 3]

Security: ✅ Enable
```

**Leave everything else default.**

Click Save → Send Test Email

---

## 🔄 Alternative: Use Gmail Temporarily

While debugging Zoho, use Gmail to at least get it working:

### **Quick Gmail Setup:**

1. **Generate Gmail App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Generate password for "BAESS Supabase"

2. **Configure in Supabase:**
```
Enable Custom SMTP: ✅ ON

Sender email: konnect@baesslabs.com
Sender name: BAESS Labs

Host: smtp.gmail.com
Port: 587
Username: your-personal-gmail@gmail.com
Password: [16-char app password]

Security: STARTTLS
```

**Note:** Emails will still show "From: BAESS Labs <konnect@baesslabs.com>" but sent via Gmail. This works while you fix Zoho.

---

## 🆘 Contact Zoho Support

If none of the above works, your Zoho account might have restrictions:

### **Check with Zoho:**

1. **Live Chat:** https://www.zoho.com/mail/contact.html
2. **Ask them:**
   - "Is SMTP enabled for konnect@baesslabs.com?"
   - "What are the correct SMTP settings?"
   - "Is there any restriction on my account?"

### **Common Zoho Restrictions:**

- Free accounts have SMTP limits
- New accounts may have restrictions for first 24-48 hours
- Domain verification required for some accounts
- SMTP might be disabled by default

---

## 🔍 Check Supabase SMTP Status

After saving SMTP settings:

1. **In Supabase Dashboard**
2. **SMTP Settings section**
3. Look for status message after saving
4. Should say: **"SMTP settings saved successfully"**

If you see any error message here, that's your clue!

---

## 📧 Verify Email Format

Make sure in Supabase:

```
Sender email: konnect@baesslabs.com
```

**NOT:**
- ~~noreply@baesslabs.com~~
- ~~support@baesslabs.com~~
- ~~no-reply@baesslabs.com~~

Must match your actual Zoho email address.

---

## 🧪 Test SMTP with curl (Advanced)

Test if Zoho SMTP is accepting connections:

```bash
curl -v --url 'smtp://smtp.zoho.com:587' \
  --mail-from 'konnect@baesslabs.com' \
  --mail-rcpt 'test@example.com' \
  --user 'konnect@baesslabs.com:YOUR_PASSWORD'
```

Should connect without errors.

---

## 🎯 Most Common Issues

### **Issue 1: Wrong Password**

✅ **Solution:** Use app-specific password, not regular password

### **Issue 2: Domain Not Verified in Zoho**

✅ **Solution:**
1. Go to Zoho Mail Control Panel
2. Check if baesslabs.com is verified
3. If not, verify domain ownership

### **Issue 3: SMTP Not Enabled in Zoho**

✅ **Solution:**
1. Zoho Mail → Settings → Mail Accounts
2. Enable IMAP/POP access
3. This enables SMTP

### **Issue 4: Port Blocked by Firewall**

✅ **Solution:**
- Try port 465 instead of 587
- Or use Gmail temporarily

### **Issue 5: Zoho Account Too New**

✅ **Solution:**
- Wait 24-48 hours
- Or contact Zoho support to enable SMTP

---

## 📊 Troubleshooting Checklist

- [ ] Zoho email works (can log in and send emails manually)
- [ ] IMAP/POP enabled in Zoho settings
- [ ] App-specific password generated
- [ ] Port 587 or 465 tested and accessible
- [ ] Username is full email: konnect@baesslabs.com
- [ ] Password has no extra spaces
- [ ] Sender email matches Zoho email
- [ ] Domain (baesslabs.com) verified in Zoho
- [ ] Checked Supabase Auth Logs for exact error
- [ ] Tried both STARTTLS (587) and SSL (465)
- [ ] Tried Gmail as alternative (works = issue is Zoho)

---

## 🚀 Quick Test: Does Gmail Work?

**Try this RIGHT NOW to isolate the issue:**

1. **Get Gmail app password** (2 minutes)
2. **Configure Gmail SMTP in Supabase** (2 minutes)
3. **Test password reset** (1 minute)

**If Gmail works:**
- ✅ Your app code is fine
- ✅ Supabase configuration is fine
- ❌ Problem is specifically with Zoho

**Then focus on fixing Zoho settings.**

---

## 📞 Next Steps

1. **Check Supabase Auth Logs** (exact error message)
2. **Verify Zoho account** (can log in, send emails)
3. **Generate app-specific password**
4. **Try configuration with port 465**
5. **If still fails, try Gmail temporarily**
6. **Contact Zoho support if Zoho-specific issue**

---

## 💡 Expected Working Configuration

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THIS SHOULD WORK:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Enable Custom SMTP: ✅ ON

Sender email: konnect@baesslabs.com
Sender name: BAESS Labs

Host: smtp.zoho.com
Port: 465
Username: konnect@baesslabs.com
Password: [app-specific password, not regular password]

Security: SSL/TLS (not STARTTLS)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Try this exact configuration with port **465** and **SSL/TLS**.

---

**Start with checking Supabase Auth Logs for the exact error, then try port 465 with SSL!** 🔧

