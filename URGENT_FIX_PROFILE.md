## 🚨 URGENT: Missing Profile Fix Required

### Problem Identified

Your user exists in Supabase Auth but **doesn't have a profile row** in the `profiles` table. This is why the checkout fails with "0 rows returned".

```
User ID: ae169905-660a-4581-954c-0918af4ce56a
Email: windsolarpowermodel@gmail.com
Profile exists: ❌ NO
```

### ✅ Quick Fix (2 minutes)

**Step 1: Open Supabase Dashboard**

Go to: https://supabase.com/dashboard

**Step 2: Select Your Project**

Click on your project (sunny-finance-toolkit or similar)

**Step 3: Open SQL Editor**

- Click on **"SQL Editor"** in the left sidebar
- Click **"New Query"**

**Step 4: Copy and Run This SQL**

```sql
-- Create the missing profile
INSERT INTO public.profiles (
  id,
  email,
  name,
  subscription_tier,
  ai_credits_remaining,
  ai_credits_monthly_limit,
  subscription_status,
  subscription_start_date,
  next_credit_reset_date
)
VALUES (
  'ae169905-660a-4581-954c-0918af4ce56a'::uuid,
  'windsolarpowermodel@gmail.com',
  'wind solar',
  'free',
  9,
  9,
  'active',
  NOW(),
  NOW() + INTERVAL '1 month'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- Verify it worked
SELECT id, email, name, subscription_tier, ai_credits_remaining
FROM public.profiles
WHERE email = 'windsolarpowermodel@gmail.com';
```

**Step 5: Click "Run" (or press F5)**

You should see:
```
Success. 1 row affected.
```

And then see your profile data returned.

### 🧪 Test the Upgrade Button Again

After creating the profile:

1. **Keep your backend server running** (the terminal with `npm run server`)
2. **Refresh your browser** at http://localhost:8080/account
3. **Click "Upgrade to Professional"**
4. **You should now be redirected to Dodo Payments!** 🎉

### Expected Server Output

After fixing, the server logs should show:

```
📦 Checkout request received: { planId: 'pro', hasAuthHeader: true }
✅ User authenticated: windsolarpowermodel@gmail.com
📋 User profile: { 
  userId: 'ae169905-660a-4581-954c-0918af4ce56a', 
  email: 'windsolarpowermodel@gmail.com', 
  currentTier: 'free' 
}
💳 Creating checkout session...
✅ Checkout session created: https://pay.dodopayments.com/...
```

---

### 🤔 Why Did This Happen?

This usually happens when:
1. User signed up before the profiles table trigger was created
2. Profiles table was dropped and recreated
3. Manual user creation in Supabase Auth without corresponding profile

### 🔧 Long-Term Fix

To prevent this, ensure you have a trigger that creates profiles automatically:

```sql
-- Check if trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

If it doesn't exist, you may need to create an auth trigger. But for now, just run the SQL above to fix your account!

---

**Run the SQL now and then test the upgrade button!** 🚀

