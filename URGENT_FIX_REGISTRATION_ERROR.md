# 🚨 URGENT: Fix "Database error saving new user"

## Problem

When trying to sign up, you get this error:
```
POST https://...supabase.co/auth/v1/signup 500 (Internal Server Error)
Registration failed: Database error saving new user
```

## Root Cause

The database trigger that automatically creates a user profile after sign-up is either:
- Missing
- Disabled
- Has incorrect permissions

## ✅ Quick Fix (3 minutes)

### Step 1: Open Supabase Dashboard

1. Go to: **https://supabase.com/dashboard**
2. Sign in with your account
3. Select your project

### Step 2: Open SQL Editor

1. Click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**

### Step 3: Copy and Run the SQL

1. Open the file: `FIX_USER_REGISTRATION_TRIGGER.sql`
2. Copy ALL the SQL code
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** (or press F5)

You should see multiple success messages like:
```
✅ Success. 1 row affected.
✅ Success. 1 row affected.
...
```

At the end, you'll see:
```
trigger_name: on_auth_user_created
enabled: O
```

This confirms the trigger is created and enabled!

### Step 4: Test Sign-Up Again

1. Go back to your app: http://localhost:8084/auth
2. Try signing up with a NEW email (don't use the same email that failed)
3. Fill in the form and click "Register"
4. You should see:
   ```
   ✅ reCAPTCHA token obtained: ...
   Attempting registration with: your@email.com
   ```
5. Check your email for the verification link

## 🧪 What This SQL Does

1. **Creates a function** (`handle_new_user`) that:
   - Automatically creates a profile when a user signs up
   - Sets default values (free tier, 9 AI credits, etc.)
   - Uses the user's email and name from sign-up form

2. **Creates a trigger** (`on_auth_user_created`) that:
   - Runs automatically after every sign-up
   - Calls the `handle_new_user` function
   - Works invisibly in the background

3. **Sets up permissions** to allow:
   - The trigger to insert profiles
   - Users to read their own profiles
   - Users to update their own profiles

4. **Enables RLS** (Row Level Security) for data protection

## 🔍 Verify It Worked

After running the SQL, you can verify the trigger exists by running this query:

```sql
-- Check if trigger exists
SELECT 
  tgname AS trigger_name,
  tgenabled AS enabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

Expected result:
```
trigger_name: on_auth_user_created
enabled: O
```

## ❌ Common Issues

### Issue 1: "Permission denied"
**Solution**: Make sure you're logged in as the project owner or have admin access

### Issue 2: "Relation 'profiles' does not exist"
**Solution**: You need to create the profiles table first. Let me know if you see this error.

### Issue 3: Still getting the error after running SQL
**Solution**: 
1. Clear browser cache
2. Use a NEW email address (not the one that failed before)
3. Check Supabase logs: Project Settings → Logs → Postgres

## 🎯 After This Fix

Once the trigger is working:
- ✅ All new sign-ups will work automatically
- ✅ Profiles will be created with default settings
- ✅ Users will get 9 AI credits to start
- ✅ Email verification will be sent
- ✅ Users can log in after verifying email

## 🔧 Technical Details

### What Happens Now When Someone Signs Up:

```
1. User fills sign-up form
   ↓
2. reCAPTCHA v3 generates token ✅
   ↓
3. Form submits to Supabase Auth
   ↓
4. Supabase creates user in auth.users table
   ↓
5. TRIGGER: on_auth_user_created fires automatically
   ↓
6. FUNCTION: handle_new_user() creates profile in profiles table
   ↓
7. User receives verification email
   ↓
8. User verifies email and can log in ✅
```

### Default Profile Values:

When a profile is created, it gets:
- **Tier**: Free
- **AI Credits**: 9
- **Monthly Limit**: 9
- **Status**: Active
- **Currency**: USD
- **Start Date**: Now
- **Next Reset**: 1 month from now

## 📝 Summary

**What you need to do**:
1. ✅ Open Supabase SQL Editor
2. ✅ Run the SQL from `FIX_USER_REGISTRATION_TRIGGER.sql`
3. ✅ Test sign-up with a new email
4. ✅ Check your email inbox for verification

**Time required**: 3 minutes

**Status after fix**: Registration will work perfectly! 🎉

---

**Need help?** If you still see errors after running the SQL, send me:
1. The error message from Supabase SQL Editor (if any)
2. The console log error (if still happening)
3. Your Supabase project region (e.g., us-east-1)

Let me know once you've run the SQL and I'll help you test!

