# Supabase Password Management Guide

## 🔐 How to View/Reset Your Super Admin Password

### Important Note
Supabase **does NOT store or display** passwords in plain text for security reasons. You can only reset passwords, not view them.

---

## Option 1: Reset Password via Supabase Dashboard (Recommended)

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Login to your Supabase account
3. Select your project: **solar-finc** (ID: ejmjukrfpdpgkxdwgoax)

### Step 2: Navigate to Authentication
1. In the left sidebar, click **Authentication**
2. Click **Users** tab
3. Find your user account (**amrit.mandal0191@gmail.com**)

### Step 3: Reset Password
1. Click on your user email to open user details
2. Click the **•••** (three dots menu) in the top right
3. Select **"Send password reset email"**
4. Check your email inbox for the reset link
5. Click the link and set a new password

---

## Option 2: Reset Password via SQL (Direct Method)

If you want to set a password immediately without email:

### Step 1: Open SQL Editor
1. Go to https://supabase.com/dashboard/project/ejmjukrfpdpgkxdwgoax
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run Password Update Query
```sql
-- Update password directly (requires knowing user ID)
-- First, get your user ID:
SELECT id, email 
FROM auth.users 
WHERE email = 'amrit.mandal0191@gmail.com';

-- Then update the password (replace YOUR_NEW_PASSWORD with your desired password)
UPDATE auth.users 
SET 
  encrypted_password = crypt('YOUR_NEW_PASSWORD', gen_salt('bf')),
  updated_at = now()
WHERE email = 'amrit.mandal0191@gmail.com';
```

**Replace** `YOUR_NEW_PASSWORD` with your actual desired password.

### Step 3: Verify
Try logging in to your app with the new password.

---

## Option 3: Reset Password via Supabase CLI

If you have Supabase CLI installed:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref ejmjukrfpdpgkxdwgoax

# Reset password via CLI
supabase db reset --linked
```

---

## Option 4: Request Password Reset from Your App

If your app has a "Forgot Password" feature:

1. Go to your app's login page
2. Click "Forgot Password" or "Reset Password"
3. Enter your email: amrit.mandal0191@gmail.com
4. Check your email for reset link
5. Set new password

---

## 🔧 Best Practices

### 1. Use a Password Manager
Store your Supabase password in a password manager like:
- **1Password**
- **LastPass**
- **Bitwarden** (open-source)
- **Dashlane**

### 2. Enable Two-Factor Authentication (2FA)
1. Go to Supabase Dashboard
2. Click your profile icon (top right)
3. Go to **Account Settings**
4. Enable **Two-Factor Authentication**

### 3. Use Strong Passwords
- At least 12 characters
- Mix of uppercase, lowercase, numbers, and symbols
- Don't use common words or patterns
- Example generator: https://passwordsgenerator.net/

### 4. Update Your .env File
After resetting your password, you may need to update your local environment:

```env
VITE_SUPABASE_URL=https://ejmjukrfpdpgkxdwgoax.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Note: The Supabase URL and anon key don't change when you reset your password.

---

## 📧 Email Configuration

If you're not receiving password reset emails:

### Check Email Settings
1. Go to Supabase Dashboard → **Authentication** → **Email Templates**
2. Verify your email templates are configured
3. Check **Settings** → **Email Auth** → Verify your SMTP settings

### Check Spam Folder
- Password reset emails sometimes go to spam
- Add `noreply@mail.app.supabase.io` to your contacts

### Use Custom SMTP (Optional)
For production, set up custom SMTP:
1. Go to **Settings** → **Email Auth**
2. Enable custom SMTP
3. Configure with Gmail, SendGrid, or Mailgun

---

## 🆘 Troubleshooting

### Issue: "Cannot reset password - user not found"
**Solution**: Verify the email address is correct in the `auth.users` table:

```sql
SELECT id, email, created_at 
FROM auth.users 
WHERE email LIKE '%amrit%';
```

### Issue: "Password reset email not received"
**Solution**:
1. Check spam folder
2. Try again after 5 minutes
3. Use direct SQL method instead

### Issue: "New password not working"
**Solution**:
1. Clear browser cache and cookies
2. Try incognito/private browsing mode
3. Verify you're using the correct email
4. Reset password again

---

## 🔗 Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Your Project**: https://supabase.com/dashboard/project/ejmjukrfpdpgkxdwgoax
- **SQL Editor**: https://supabase.com/dashboard/project/ejmjukrfpdpgkxdwgoax/sql
- **Authentication Users**: https://supabase.com/dashboard/project/ejmjukrfpdpgkxdwgoax/auth/users
- **Supabase Docs**: https://supabase.com/docs

---

## 📝 Summary

**✅ Easiest Method**: Use "Send password reset email" from Supabase Dashboard → Authentication → Users

**✅ Fastest Method**: Use SQL UPDATE query directly (Option 2)

**✅ Most Secure**: Enable 2FA and use a password manager

---

**Remember**: Passwords are encrypted and cannot be viewed. You can only reset them! 🔒

