# 🔍 How to Check Supabase Logs for Registration Error

## Quick Steps to Find the Real Error

### Step 1: Go to Supabase Logs

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. In the left sidebar, click **"Logs"**
4. Select **"Postgres Logs"**

### Step 2: Filter for Errors

1. Look for logs from the last 5-10 minutes
2. Search for keywords:
   - `ERROR`
   - `profiles`
   - `handle_new_user`
   - `INSERT`

### Step 3: Common Errors and Solutions

#### Error 1: "column does not exist"
```
ERROR: column "subscription_tier" does not exist
```

**Solution**: Your profiles table is missing columns. Run this to check:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles';
```

#### Error 2: "permission denied"
```
ERROR: permission denied for table profiles
```

**Solution**: Run this in SQL Editor:

```sql
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;
```

#### Error 3: "violates not-null constraint"
```
ERROR: null value in column "X" violates not-null constraint
```

**Solution**: The function is trying to insert NULL into a required field. Check which column and update the function.

#### Error 4: "relation 'profiles' does not exist"
```
ERROR: relation "public.profiles" does not exist
```

**Solution**: Your profiles table doesn't exist! You need to create it first.

## 🔧 Alternative: Disable Trigger Temporarily

If you can't fix the trigger immediately, you can disable it and create profiles manually:

```sql
-- Disable the trigger
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Now sign-ups will work, but you'll need to create profiles manually
```

Then create profiles manually with:

```sql
INSERT INTO public.profiles (id, email, name)
VALUES (
  'user-id-from-auth-users',
  'user@email.com',
  'User Name'
);
```

## 📋 Check Your Current Setup

Run these queries to see what you have:

```sql
-- 1. Does profiles table exist?
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
);

-- 2. What columns does it have?
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Does the trigger exist?
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 4. Does the function exist?
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
```

## 🚨 Most Likely Issue

Based on the error you saw (`handle_new_user = )Values(`), it looks like the function has a **syntax error** or the profiles table is **missing required columns**.

Try the `SIMPLE_FIX_REGISTRATION.sql` file I just created - it has:
- Step-by-step instructions
- Error handling
- Simplified function (only inserts id, email, name)
- Better logging

## 📸 Send Me This Info

If it still doesn't work, send me:

1. **Output of this query**:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

2. **The exact error from Postgres Logs** (copy the full error message)

3. **Result of this query**:
```sql
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

This will help me understand exactly what's wrong!

