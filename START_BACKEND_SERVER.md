# 🚀 Start Backend Express Server - Step by Step

## ✅ What I've Done

I've already created all the files you need:

1. ✅ `server.js` - Express backend server
2. ✅ `api/checkout/create-session.js` - Vercel serverless function (for future)
3. ✅ `api/webhooks/dodo.js` - Vercel webhook handler (for future)
4. ✅ Updated `package.json` with new scripts
5. ✅ Updated `src/services/dodoPaymentService.ts` to use backend

---

## 📋 Step-by-Step Setup

### Step 1: Install Backend Dependencies

Open your terminal and run:

```bash
npm install express cors dotenv concurrently
```

**What this installs:**
- `express` - Backend server framework
- `cors` - Allow frontend to talk to backend
- `dotenv` - Load environment variables
- `concurrently` - Run multiple servers at once

---

### Step 2: Update Your .env File

Add these lines to your `.env` file:

```env
# ============================================
# BACKEND SERVER CONFIGURATION
# ============================================

# Backend server port
PORT=3001

# Backend API URL (for frontend to call)
VITE_API_URL=http://localhost:3001

# ============================================
# DODO PAYMENTS (Keep your existing values)
# ============================================

DODO_PAYMENTS_API_KEY=dodo_test_your_key_here
DODO_WEBHOOK_SECRET=whsec_your_secret_here
VITE_DODO_PRODUCT_ID_PRO=prod_your_pro_id
VITE_DODO_PRODUCT_ID_ADVANCED=prod_your_advanced_id
VITE_DODO_PRODUCT_ID_ENTERPRISE=prod_your_enterprise_id

# ============================================
# SUPABASE (Your existing values)
# ============================================

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# ============================================
# APP URL
# ============================================

VITE_APP_URL=http://localhost:8080
```

---

### Step 3: Start Both Servers

Run this single command:

```bash
npm run dev:full
```

**You should see:**

```
[0] 
[0] VITE v5.x.x  ready in xxx ms
[0] 
[0] ➜  Local:   http://localhost:8080/
[0] ➜  Network: use --host to expose
[0] 
[1] 
[1] 🚀 Dodo Payments API Server Started!
[1] 
[1] 📡 Server running on: http://localhost:3001
[1] 🔗 Webhook endpoint: http://localhost:3001/api/webhooks/dodo
[1] 💳 Checkout endpoint: http://localhost:3001/api/checkout/create-session
[1] 
[1] ✅ Ready to accept requests!
```

**[0]** = Frontend (Vite)  
**[1]** = Backend (Express)

---

### Step 4: Update ngrok (Important!)

**Stop your old ngrok** (Ctrl+C in Command Prompt)

**Start new ngrok pointing to backend:**

```bash
ngrok http 3001
```

**Copy the new URL**, something like:
```
https://xyz-new-url.ngrok-free.dev
```

---

### Step 5: Update Dodo Webhook URL

Go to Dodo Dashboard → Settings → Webhooks

**Update your webhook endpoint to:**
```
https://your-new-ngrok-url.ngrok-free.dev/api/webhooks/dodo
```

⚠️ **Important:** Add `/api/webhooks/dodo` at the end!

---

### Step 6: Test Everything! 🧪

#### Test 1: Backend Health Check

Open browser: http://localhost:3001/api/health

**Should see:**
```json
{
  "status": "ok",
  "message": "Dodo Payments API server is running",
  "timestamp": "2025-02-12T..."
}
```

#### Test 2: Frontend Loads

Open browser: http://localhost:8080

**Should see:** Your app loads normally ✅

#### Test 3: Upgrade Button Works!

1. Go to http://localhost:8080/account
2. Click **"Upgrade to Professional"** or **"Upgrade to Advanced"**
3. **Should see:** Loading spinner → Redirects to Dodo checkout page! 🎉

---

## 🎯 Expected Terminal Output

### Terminal 1 (npm run dev:full):

```
[0] VITE v5.4.1  ready in 1234 ms
[0] ➜  Local:   http://localhost:8080/
[1] 🚀 Dodo Payments API Server Started!
[1] 📡 Server running on: http://localhost:3001
[1] ✅ Ready to accept requests!
```

### Terminal 2 (ngrok):

```
ngrok

Session Status                online
Forwarding                    https://abc-123.ngrok-free.dev -> http://localhost:3001

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

---

## 🔍 Troubleshooting

### "Cannot find module 'express'"

```bash
npm install express cors dotenv concurrently
```

### "Port 3001 already in use"

**Option A:** Kill the process using port 3001
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F

# Or just change the port in .env
PORT=3002
```

### "npm run dev:full" not found

Make sure your `package.json` has:
```json
{
  "scripts": {
    "server": "node server.js",
    "dev:full": "concurrently \"npm run dev\" \"npm run server\""
  }
}
```

### Backend logs show errors

**Check:**
- `.env` file has all required variables
- Dodo API key is correct
- Supabase URL and keys are correct

### Upgrade button still not working

**Check browser console:**
- Should show: `POST http://localhost:3001/api/checkout/create-session`
- If 404: Backend not running
- If CORS error: Backend not configured properly
- If 401: User not logged in or auth token issue

**Check backend terminal:**
- Should show: "Creating checkout session: {userId: ..., planId: ...}"
- If nothing: Request not reaching backend

---

## ✅ Success Indicators

When everything works:

1. ✅ **Two servers running** (ports 8080 and 3001)
2. ✅ **ngrok connected** to port 3001
3. ✅ **Health check returns OK**: http://localhost:3001/api/health
4. ✅ **App loads**: http://localhost:8080
5. ✅ **Upgrade button works**: Redirects to Dodo checkout
6. ✅ **Backend shows logs**: "Creating checkout session..."
7. ✅ **Dodo checkout loads**: Payment form appears

---

## 🎬 Quick Test Workflow

```bash
# Terminal 1: Start both servers
npm run dev:full

# Terminal 2: Start ngrok
ngrok http 3001

# Browser 1: Test health
http://localhost:3001/api/health

# Browser 2: Test app
http://localhost:8080/account
# Click "Upgrade to Professional"
# Should redirect to Dodo! ✅
```

---

## 📊 What's Running

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Frontend      │      │   Backend       │      │  Dodo Payments  │
│   Vite :8080    │─────>│   Express :3001 │─────>│                 │
│                 │      │                 │<─────│  (Webhooks)     │
│ React App       │      │ API Routes      │      │  Checkout       │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                  ↑
                                  │
                              ngrok
                                  │
                    https://xyz.ngrok-free.dev
```

---

## 🎯 Next Steps After Setup

Once backend is working:

1. ✅ Test full checkout flow
2. ✅ Complete a test payment
3. ✅ Verify webhook processes
4. ✅ Check database updated
5. ✅ Test subscription success page

---

## 📝 Commands Summary

```bash
# Install dependencies
npm install express cors dotenv concurrently

# Start both servers
npm run dev:full

# Start ngrok (separate terminal)
ngrok http 3001

# Test health
curl http://localhost:3001/api/health

# Or in browser:
# http://localhost:3001/api/health
```

---

## 💡 Pro Tips

1. **Keep both terminals visible** - You'll see logs from both servers
2. **Check backend logs** when testing - Shows what's happening
3. **Use browser dev tools** - Network tab shows API calls
4. **Test health endpoint first** - Confirms backend is running
5. **ngrok must point to 3001** - Not 8080!

---

## 🆘 Still Having Issues?

**Check this order:**

1. ✅ Dependencies installed? `npm install express cors dotenv concurrently`
2. ✅ `.env` has `PORT=3001` and `VITE_API_URL=http://localhost:3001`?
3. ✅ Both servers running? `npm run dev:full` shows [0] and [1]
4. ✅ Health check works? http://localhost:3001/api/health
5. ✅ ngrok points to 3001? `ngrok http 3001`
6. ✅ Dodo webhook updated with new ngrok URL?

---

**You're ready to start! Run the commands above and test the upgrade button! 🚀**

