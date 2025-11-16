# 🚀 Referral System - Quick Start Guide

## ⚠️ IMPORTANT: Run Step-by-Step!

The migration has been split into 6 separate files to avoid errors.
**Run each file ONE AT A TIME** in order.

---

## 📋 Installation Steps

### Step 1: Add Columns
**File:** `REFERRAL_STEP_1_ADD_COLUMNS.sql` (renamed from `REFERRAL_SYSTEM_MIGRATION_FIXED.sql`)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of this file
3. Click **Run**
4. ✅ **Verify**: Should see 4 columns listed (referral_code, referred_by, total_referrals, referral_credits_earned)

**Don't proceed until you see the 4 columns!**

---

### Step 2: Create Tracking Table
**File:** `REFERRAL_STEP_2_CREATE_TABLES.sql`

1. Copy and paste contents into SQL Editor
2. Click **Run**
3. ✅ **Verify**: Should see "referrals" table name displayed

---

### Step 3: Create Functions
**File:** `REFERRAL_STEP_3_FUNCTIONS.sql`

1. Copy and paste contents into SQL Editor
2. Click **Run**
3. ✅ **Verify**: Should see 2 function names (generate_referral_code, apply_referral_bonus)

---

### Step 4: Update Trigger
**File:** `REFERRAL_STEP_4_TRIGGER.sql`

1. Copy and paste contents into SQL Editor
2. Click **Run**
3. ✅ **Verify**: Should see "on_auth_user_created" trigger name

---

### Step 5: Generate Codes for Existing Users
**File:** `REFERRAL_STEP_5_GENERATE_CODES.sql`

1. Copy and paste contents into SQL Editor
2. Click **Run**
3. ✅ **Verify**: Should see:
   - Notice message: "Generated referral codes for X existing users"
   - Count showing all users have codes
   - Sample of 10 users with their codes

---

### Step 6: Set Permissions
**File:** `REFERRAL_STEP_6_PERMISSIONS.sql`

1. Copy and paste contents into SQL Editor
2. Click **Run**
3. ✅ **Verify**: Should see:
   - RLS enabled (rowsecurity = true)
   - 2 policies listed
   - Success message: "✅ Referral system setup complete!"

---

## 🎉 Done!

After all 6 steps complete, your referral system is ready!

### Quick Test:

```sql
-- Check your own referral code
SELECT id, email, referral_code, total_referrals, referral_credits_earned
FROM public.profiles
WHERE email = 'your-email@example.com';
```

You should see your unique referral code!

---

## 🐛 Troubleshooting

### Error: "column referral_code does not exist"
**Solution**: You skipped Step 1 or it didn't complete. Go back and run Step 1 first.

### Error: "relation referrals does not exist"
**Solution**: You skipped Step 2. Run Step 2.

### Error: "function generate_referral_code does not exist"
**Solution**: You skipped Step 3. Run Step 3.

### No codes generated in Step 5
**Solution**: Check if you have any users:
```sql
SELECT COUNT(*) FROM public.profiles;
```
If you have users but no codes, run Step 5 again.

---

## ✅ After Setup

1. **Deploy your app**: Already pushed to GitHub, Vercel will auto-deploy
2. **Test it**:
   - Log in to your account
   - Go to Account Settings
   - Scroll to "Referral Program" section
   - You should see your code!
3. **Share it**: Try the social media buttons!

---

## 📞 Need Help?

If you get stuck:
1. Check which step failed
2. Look at the error message
3. Make sure previous steps completed successfully
4. Run the verify queries in each step

The system is designed to work even if you run steps multiple times (they use `IF NOT EXISTS` and `OR REPLACE`).

