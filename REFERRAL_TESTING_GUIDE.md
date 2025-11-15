# 🧪 Referral System Testing Guide

## ✅ Complete Implementation Status

All Phase 1 features have been successfully implemented:

- ✅ Email validation (700+ disposable domains blocked)
- ✅ Pattern-based detection for suspicious emails
- ✅ reCAPTCHA v3 integration
- ✅ Rate limiting (client + email based)
- ✅ Referral code generation (5-char alphanumeric)
- ✅ Referral code input in sign-up form
- ✅ Referral dashboard in user account
- ✅ URL parameter support (?ref=ABC12)
- ✅ Credit distribution system
- ✅ Complete tracking and audit logs

---

## 🚀 Testing Checklist

### 1. Database Setup Verification

**Before testing**, verify your Supabase setup:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('referrals', 'referral_credits_log');

-- Check if referral columns exist in profiles
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('referral_code', 'referred_by', 'referral_count');
```

**Expected Results:**
- `referrals` table exists
- `referral_credits_log` table exists
- All 4 columns exist in `profiles` table

---

### 2. Environment Variables Check

Verify your `.env` file has:

```bash
# Google reCAPTCHA v3
VITE_RECAPTCHA_SITE_KEY=your_actual_site_key
VITE_RECAPTCHA_SECRET_KEY=your_actual_secret_key

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

**Also verify in Vercel:**
- Go to Vercel → Your Project → Settings → Environment Variables
- Confirm all 4 variables are set

---

## 📝 Test Scenarios

### Test 1: reCAPTCHA Integration ✅

**Steps:**
1. Open sign-up page: `http://localhost:8084/auth`
2. Click on "Register" tab

**Expected Results:**
- ✅ Green badge showing "Protected by reCAPTCHA"
- ✅ reCAPTCHA notice at bottom of form
- ✅ No visible reCAPTCHA challenge (v3 is invisible)

**Screenshot Location:** Top of the registration form

---

### Test 2: Referral Code Field ✅

**Steps:**
1. On registration form, locate "Referral Code (Optional)" field
2. Type: `ABC12`

**Expected Results:**
- ✅ Text auto-converts to uppercase
- ✅ Limited to 5 characters
- ✅ Message appears: "🎉 You'll get +3 AI credits bonus!"
- ✅ Gift icon displays next to field label

**Screenshot:** Referral code input field with bonus message

---

### Test 3: Email Validation - Disposable Email Block 🛡️

**Steps:**
1. Try to sign up with email: `test@guerrillamail.com`
2. Fill other fields and submit

**Expected Results:**
- ❌ Registration fails
- ✅ Error message: "Disposable email addresses are not allowed"
- ✅ User not created in database

**Other disposable emails to test:**
- `user@mailinator.com`
- `test@10minutemail.com`
- `temp@temp-mail.org`

---

### Test 4: Email Validation - Suspicious Pattern Block 🛡️

**Steps:**
1. Try to sign up with email: `test.temp.mail@gmail.com`
2. Fill other fields and submit

**Expected Results:**
- ❌ Registration fails
- ✅ Error message: "This email address appears to be temporary or suspicious"

---

### Test 5: Rate Limiting - Client Based ⏱️

**Steps:**
1. Attempt to sign up 4 times with different emails:
   - First attempt: `test1@gmail.com` ✅ Should work
   - Second attempt: `test2@gmail.com` ✅ Should work  
   - Third attempt: `test3@gmail.com` ✅ Should work
   - Fourth attempt: `test4@gmail.com` ❌ Should be blocked

**Expected Results:**
- ✅ First 3 attempts process normally
- ❌ 4th attempt shows error: "Too many sign-up attempts. Please try again later."
- ✅ Error includes cooldown time

**To Reset:** Clear browser cache and cookies, or use incognito mode

---

### Test 6: Email Rate Limiting ⏱️

**Steps:**
1. Sign up with `test@gmail.com`
2. Immediately try to sign up again with same email

**Expected Results:**
- ❌ Second attempt blocked
- ✅ Error: "This email was recently used. Please try again later."
- ✅ 1-hour cooldown message displayed

---

### Test 7: Complete Referral Flow - User A (Referrer) 👤

**Steps:**
1. Sign up as User A:
   - Email: `usera@gmail.com`
   - Password: `password123`
   - No referral code
2. Verify email (check inbox)
3. Log in
4. Go to Account page: `/account`
5. Scroll to "Referral Program" section

**Expected Results:**
- ✅ Referral code displayed (e.g., `ABC12`)
- ✅ Copy button works
- ✅ Stats show:
  - Total Referrals: 0
  - Active: 0
  - Pending: 0
  - Credits Earned: 0

**Screenshot:** Take note of the referral code!

---

### Test 8: Complete Referral Flow - User B (Referee) Using Code 👥

**Steps:**
1. Copy User A's referral code (e.g., `ABC12`)
2. Open new incognito window
3. Visit: `http://localhost:8084/auth?ref=ABC12`

**Expected Results:**
- ✅ Auth page opens on "Register" tab (not "Login")
- ✅ Orange banner shows: "🎉 You've been referred! Sign up now and get +3 AI credits bonus!"
- ✅ Referral code field pre-filled with `ABC12`
- ✅ Bonus message: "🎉 You'll get +3 AI credits bonus!"

**Screenshot:** Sign-up page with referral banner

---

### Test 9: User B Registration with Referral Code 🎁

**Steps:**
1. Continue from Test 8
2. Fill registration form:
   - Name: `User B`
   - Email: `userb@gmail.com`
   - Password: `password123`
   - Referral Code: `ABC12` (already filled)
3. Submit

**Expected Results:**
- ✅ Registration successful
- ✅ Message: "Registration successful! Please check your email to confirm your account."
- ✅ Check Supabase `referrals` table:
  ```sql
  SELECT * FROM referrals WHERE referee_id = (
    SELECT id FROM profiles WHERE email = 'userb@gmail.com'
  );
  ```
- ✅ Status should be `pending`
- ✅ `referee_credits_awarded` = 3
- ✅ `referrer_credits_awarded` = 9

---

### Test 10: Email Verification & Credit Activation 📧

**Steps:**
1. Check User B's email inbox
2. Click verification link
3. Log in as User B
4. Check AI credits in header

**Expected Results:**
- ✅ User B's AI credits: 9 (base) + 3 (referral) = **12 credits**
- ✅ Check in database:
  ```sql
  SELECT ai_credits_remaining, referred_by FROM profiles 
  WHERE email = 'userb@gmail.com';
  ```
- ✅ `referred_by` = `ABC12`

---

### Test 11: Referrer Credit Update 💰

**Steps:**
1. Log in as User A (`usera@gmail.com`)
2. Go to Account page
3. Check Referral Program section

**Expected Results:**
- ✅ User A's AI credits: 9 (base) + 9 (referral reward) = **18 credits**
- ✅ Referral stats updated:
  - Total Referrals: 1
  - Active: 1
  - Pending: 0
  - Credits Earned: 9
- ✅ Check `referrals` table:
  ```sql
  SELECT status, activated_at FROM referrals 
  WHERE referrer_id = (SELECT id FROM profiles WHERE email = 'usera@gmail.com');
  ```
- ✅ Status = `active`
- ✅ `activated_at` timestamp present

---

### Test 12: Referral Credits Log 📊

**Steps:**
1. Check the `referral_credits_log` table:
```sql
SELECT 
  u.email,
  rcl.credits_added,
  rcl.transaction_type,
  rcl.description,
  rcl.created_at
FROM referral_credits_log rcl
JOIN profiles u ON u.id = rcl.user_id
ORDER BY rcl.created_at DESC;
```

**Expected Results:**
- ✅ 2 records created:
  1. **User B** (referee):
     - credits_added: 3
     - transaction_type: `referee_reward`
     - description: "Welcome bonus for using referral code"
  2. **User A** (referrer):
     - credits_added: 9
     - transaction_type: `referrer_reward`
     - description: "Reward for successful referral"

---

### Test 13: Anti-Abuse - Self-Referral Prevention 🚫

**Steps:**
1. Get User A's referral code
2. Log out User A
3. Try to sign up again with different email but same referral code
4. Or manually call:
```sql
SELECT process_referral_reward(
  'user_a_id',  -- same user ID
  'ABC12'       -- their own code
);
```

**Expected Results:**
- ❌ Error: "Cannot use your own referral code"
- ✅ No referral record created
- ✅ No credits awarded

---

### Test 14: Anti-Abuse - Duplicate Referral Prevention 🚫

**Steps:**
1. User B already used a referral code
2. Try to use another referral code for User B
3. Or manually call:
```sql
SELECT process_referral_reward(
  'user_b_id',  -- already referred user
  'XYZ99'       -- different code
);
```

**Expected Results:**
- ❌ Error: "You have already used a referral code"
- ✅ No second referral record created
- ✅ No additional credits

---

### Test 15: Referral Dashboard Features 🎛️

**Steps:**
1. Log in as User A (who has referred someone)
2. Go to `/account`
3. Navigate to Referral Program section

**Test the following features:**

**A. Copy Referral Code:**
- ✅ Click copy button next to code
- ✅ Check icon changes to green checkmark
- ✅ Paste in notepad - should match displayed code

**B. Copy Referral Link:**
- ✅ Click "Copy Link" button
- ✅ Paste in browser - should be: `https://www.baess.app/auth?ref=ABC12`
- ✅ Link should work and pre-fill code

**C. Stats Display:**
- ✅ Total Referrals card shows correct count
- ✅ Active referrals shown
- ✅ Pending referrals shown
- ✅ Total Credits Earned displayed

**D. How It Works Section:**
- ✅ 4-step guide displayed
- ✅ Clear instructions
- ✅ Visual icons present

---

### Test 16: Multiple Referrals from Same User 👥👥👥

**Steps:**
1. Get User A's referral code
2. Have 3 different people sign up using it:
   - User C: `userc@gmail.com`
   - User D: `userd@gmail.com`
   - User E: `usere@gmail.com`
3. All verify their emails

**Expected Results:**
- ✅ User A gets 9 credits per verified referral
- ✅ Final User A credits: 9 (base) + (9 × 3) = **36 credits**
- ✅ Referral stats:
  - Total Referrals: 3
  - Active: 3
  - Credits Earned: 27

---

### Test 17: Production Testing on baess.app 🌐

**After deploying to production:**

**Steps:**
1. Visit `https://www.baess.app/auth`
2. Verify reCAPTCHA loads
3. Test referral flow with real emails
4. Verify email verification works

**Environment Variables in Vercel:**
- ✅ `VITE_RECAPTCHA_SITE_KEY` set
- ✅ `VITE_RECAPTCHA_SECRET_KEY` set
- ✅ All Supabase vars set
- ✅ Redeploy with cache cleared after setting vars

---

## 🐛 Troubleshooting

### Issue: reCAPTCHA Not Loading

**Solutions:**
1. Check browser console for errors
2. Verify site key in `.env` matches Google Console
3. Ensure domain is added to reCAPTCHA allowed list
4. Try clearing cache and hard reload (Ctrl+Shift+R)

### Issue: Referral Code Not Pre-filling

**Solutions:**
1. Check URL has correct format: `/auth?ref=ABC12`
2. Verify `useSearchParams` import in `Auth.tsx`
3. Check browser console for navigation errors

### Issue: Credits Not Adding

**Solutions:**
1. Verify email was verified (check Supabase auth users)
2. Check `referrals` table - status should be `active` not `pending`
3. Manually activate:
```sql
SELECT activate_referral('user_id_here');
```
4. Check `referral_credits_log` for transaction records

### Issue: Disposable Email Not Blocked

**Solutions:**
1. Check if domain is in the list in `emailValidationService.ts`
2. Add domain if missing:
```typescript
'newdomain.com',
```
3. Restart dev server

### Issue: Rate Limiting Not Working

**Solutions:**
1. Clear browser storage: `localStorage.clear()`
2. Use incognito mode for fresh test
3. Check console for rate limit logs

---

## 📊 Success Metrics

After complete testing, verify:

- ✅ All 700+ disposable domains blocked
- ✅ reCAPTCHA score threshold met (> 0.5)
- ✅ Rate limits enforced (3 per 24h)
- ✅ Referral codes generated uniquely
- ✅ Credits distributed correctly (3 + 9)
- ✅ Audit trail complete in logs
- ✅ No duplicate referrals possible
- ✅ No self-referrals possible
- ✅ URL referral links work
- ✅ Dashboard displays accurately

---

## 🎉 Testing Complete!

If all tests pass:

1. ✅ Security measures are working
2. ✅ Referral system is operational
3. ✅ Credit distribution is accurate
4. ✅ Anti-abuse measures are effective
5. ✅ User experience is smooth

---

## 📧 Support

If you encounter any issues during testing:

1. Check Supabase logs
2. Check browser console
3. Review `referral_credits_log` table
4. Verify environment variables
5. Check RLS policies in Supabase

---

## 🚀 Next Steps (Optional Enhancements)

Consider implementing:
- [ ] Email notifications when referral credits are awarded
- [ ] Referral leaderboard
- [ ] Special bonuses for top referrers
- [ ] Social media sharing buttons
- [ ] Referral analytics dashboard
- [ ] Phone number verification for high-value accounts
- [ ] IP-based rate limiting (backend)
- [ ] Admin dashboard for monitoring abuse

---

**Last Updated:** November 15, 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready

