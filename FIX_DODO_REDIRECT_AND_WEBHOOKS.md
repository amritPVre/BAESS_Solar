# 🔧 Fix: Dodo Payments Redirect and Credit Updates

## Issue 1: Page Doesn't Redirect After Payment ❌

**Problem:** After payment, you stay on Dodo's page instead of being redirected back to your app.

### Root Cause
Your `.env` file has:
```env
VITE_APP_URL=http://localhost:8080
```

But your Vite frontend is actually running on:
```
http://localhost:8084
```

So Dodo is trying to redirect to port 8080, which doesn't work!

### ✅ Fix: Update .env

1. Open your `.env` file
2. Find the line with `VITE_APP_URL`
3. Change it to:

```env
VITE_APP_URL=http://localhost:8084
```

4. **Restart the backend server**:
```bash
# Stop server (Ctrl+C)
npm run server
```

5. Try payment again - it should redirect now!

---

## Issue 2: Credits Not Updated After Payment ❌

**Problem:** After successful payment, subscription tier and AI credits don't update automatically.

### Root Cause
**Webhooks aren't working!** Here's what should happen:

```
1. Payment succeeds on Dodo ✅
2. Dodo sends webhook to your backend ❌ (Can't reach localhost)
3. Backend updates subscription & credits ❌ (Never happens)
```

Webhooks need a **publicly accessible URL**, but your backend is on `localhost:3001` which Dodo can't reach.

### Solution Options

Choose ONE of these solutions:

---

### ✅ Solution A: Fix ngrok (Recommended for Development)

**Step 1: Fix PowerShell Execution Policy**

Open PowerShell as **Administrator** and run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Step 2: Close and Reopen PowerShell** (normal mode, not admin)

**Step 3: Start ngrok**

```bash
ngrok http 3001
```

**Step 4: Copy the ngrok URL**

You'll see something like:
```
Forwarding: https://abc-123-xyz.ngrok-free.app -> http://localhost:3001
```

Copy: `https://abc-123-xyz.ngrok-free.app`

**Step 5: Update Dodo Webhook**

1. Go to: https://dashboard.dodopayments.com
2. Navigate to: **Settings → Webhooks**
3. Click **"Add Endpoint"** or **"Edit"** if exists
4. Set webhook URL to:
   ```
   https://your-ngrok-url.ngrok-free.app/api/webhooks/dodo
   ```
5. Select these events:
   - `subscription.active`
   - `subscription.renewed`
   - `subscription.cancelled`
   - `payment.succeeded`
   - `payment.failed`
6. Save

**Step 6: Test Again**

Make another $1 test payment. After payment:
- Check backend terminal for webhook logs
- Check database - subscription should update automatically!

---

### ✅ Solution B: Use Return URL Handler (Alternative)

If ngrok still doesn't work, we can update credits when user returns from checkout.

**This requires code changes - let me create this for you:**

I'll create a new route that:
1. Gets called when user returns from Dodo
2. Checks payment status with Dodo API
3. Updates subscription and credits
4. Shows success message

Would you like me to implement this?

---

### ✅ Solution C: Manual Update (Quick Test Only)

For now, to test the UI, manually update the database after each payment:

```sql
-- Update subscription after successful payment
UPDATE public.profiles
SET 
  subscription_tier = 'pro',
  ai_credits_remaining = 180,
  ai_credits_monthly_limit = 180,
  subscription_status = 'active',
  subscription_start_date = NOW(),
  next_credit_reset_date = NOW() + INTERVAL '1 month'
WHERE email = 'windsolarpowermodel@gmail.com';

-- Verify update
SELECT 
  email,
  subscription_tier,
  ai_credits_remaining,
  subscription_status
FROM public.profiles
WHERE email = 'windsolarpowermodel@gmail.com';
```

Then refresh your app to see the updated credits.

**Note:** This is NOT a production solution! Use Solution A or B for real implementation.

---

## 🎯 Recommended Approach

**For Development:**
1. Fix the redirect URL (Issue 1 - Easy!)
2. Set up ngrok for webhooks (Solution A)
3. Test complete flow

**For Production:**
1. Deploy backend to Vercel/Railway/Heroku
2. Backend gets a public URL automatically
3. Set that URL in Dodo webhooks
4. Everything works!

---

## 📋 Quick Checklist

- [ ] Update `VITE_APP_URL` in `.env` to `http://localhost:8084`
- [ ] Restart backend server
- [ ] Test payment - should redirect back to app now
- [ ] Fix ngrok execution policy
- [ ] Start ngrok: `ngrok http 3001`
- [ ] Update Dodo webhook URL with ngrok URL
- [ ] Test payment again
- [ ] Check backend logs for webhook
- [ ] Verify credits updated in database
- [ ] Verify credits show in app UI

---

## 🔍 Debugging

### Check if Webhook Fired

In Dodo Dashboard → Webhooks → View Logs:
- Look for recent webhook attempts
- Check status codes:
  - ✅ 200 = Success
  - ❌ 4xx/5xx = Error
  - ⏳ Pending = Not sent yet

### Check Backend Logs

After payment, look in your `npm run server` terminal for:

```
🔔 Webhook received: { type: 'subscription.active', ... }
✅ Webhook signature verified
👤 Processing webhook for user: ae169905-660a-4581-954c-0918af4ce56a
🟢 Subscription activated
✅ Webhook processed successfully
```

If you don't see this, webhooks aren't reaching your backend!

---

Let me know which solution you want to implement!

