# ✅ Backend Server - ES Module Issue Fixed!

## 🔧 What Was Fixed

**Problem:** Your `package.json` has `"type": "module"`, which made Node.js treat `server.js` as an ES module, but it was written with CommonJS syntax (`require`).

**Solution:** ✅ Converted `server.js` to use ES module syntax (`import/export`)

---

## 🚀 Server Status

Your backend server should now be running! Check the terminal output:

### Expected Output:

```
[0] VITE v5.4.10  ready in xxx ms
[0] ➜  Local:   http://localhost:8084/
[1] 🚀 Dodo Payments API Server Started!
[1] 📡 Server running on: http://localhost:3001
```

**[0]** = Frontend (Vite) on port 8084  
**[1]** = Backend (Express) on port 3001

---

## ✅ Quick Tests

### Test 1: Backend Health Check

Open browser or use curl:

**Browser:**
```
http://localhost:3001/api/health
```

**PowerShell:**
```powershell
curl http://localhost:3001/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Dodo Payments API server is running",
  "timestamp": "2025-02-12T...",
  "endpoints": {
    "health": "/api/health",
    "checkout": "/api/checkout/create-session",
    "webhook": "/api/webhooks/dodo",
    "subscriptionStatus": "/api/subscription/status",
    "subscriptionCancel": "/api/subscription/cancel"
  }
}
```

### Test 2: Frontend Access

Open browser:
```
http://localhost:8084/account
```

**What to do:**
1. Login to your account
2. Click "Upgrade to Professional" or "Upgrade to Advanced"
3. Should show loading spinner
4. Should redirect to Dodo checkout page ✅

---

## 🔍 Troubleshooting

### "Cannot reach localhost:3001"

**Check 1:** Is backend running?
- Look at terminal for `[1] 🚀 Dodo Payments API Server Started!`
- If not showing, backend failed to start

**Check 2:** Environment variables set?
Make sure your `.env` file has:
```env
PORT=3001
VITE_API_URL=http://localhost:3001
VITE_APP_URL=http://localhost:8084
DODO_PAYMENTS_API_KEY=your_actual_key
DODO_WEBHOOK_SECRET=your_actual_secret
VITE_DODO_PRODUCT_ID_PRO=your_actual_prod_id
VITE_DODO_PRODUCT_ID_ADVANCED=your_actual_prod_id
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Check 3:** Firewall blocking?
Try this in PowerShell:
```powershell
Test-NetConnection -ComputerName localhost -Port 3001
```

Should show: `TcpTestSucceeded : True`

**Check 4:** Port already in use?
```powershell
netstat -ano | findstr :3001
```

If you see output, port 3001 is already in use by another process.

**Solution:** Change port in `.env`:
```env
PORT=3002
VITE_API_URL=http://localhost:3002
```

Then restart: `npm run dev:full`

---

### Backend Shows Errors

**Common errors:**

1. **"Cannot find module '@supabase/supabase-js'"**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **"Missing environment variable"**
   - Check your `.env` file
   - Make sure all variables are set
   - No spaces around `=` sign

3. **"Invalid API key"**
   - Check Dodo dashboard for correct API key
   - Make sure using test key for development

---

### Frontend Shows CORS Error

**Browser console shows:** `Access to fetch at 'http://localhost:3001/api/...' blocked by CORS`

**Fix:** Update `.env`:
```env
VITE_APP_URL=http://localhost:8084
```

And make sure your backend server is using the correct CORS origin (already configured in `server.js`).

---

## 🔗 Update ngrok (Important!)

Now that backend is running on port 3001, update ngrok:

**Stop old ngrok:**
- Press `Ctrl+C` in ngrok terminal

**Start new ngrok:**
```bash
ngrok http 3001
```

**Copy the forwarding URL:**
```
https://abc-123-xyz.ngrok-free.dev -> http://localhost:3001
```

**Update Dodo Webhook:**
Go to Dodo Dashboard → Settings → Webhooks

Set webhook URL to:
```
https://your-ngrok-url.ngrok-free.dev/api/webhooks/dodo
```

⚠️ **Don't forget the `/api/webhooks/dodo` path!**

---

## 📊 What's Running

```
┌──────────────────────────────────────────────────────┐
│  Port 8084: Frontend (Vite/React)                     │
│  http://localhost:8084                                │
│                                                       │
│  - Landing page                                       │
│  - Account page with upgrade buttons                  │
│  - Subscription success page                          │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│  Port 3001: Backend (Express API)                     │
│  http://localhost:3001                                │
│                                                       │
│  - POST /api/checkout/create-session                  │
│  - POST /api/webhooks/dodo                            │
│  - GET  /api/subscription/status                      │
│  - POST /api/subscription/cancel                      │
│  - GET  /api/health                                   │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│  External Services                                    │
│                                                       │
│  - Dodo Payments API (checkout & webhooks)            │
│  - Supabase (database & auth)                         │
└──────────────────────────────────────────────────────┘
```

---

## 🧪 Full Test Flow

1. **Start servers:**
   ```bash
   npm run dev:full
   ```

2. **Check backend health:**
   ```
   http://localhost:3001/api/health
   ```

3. **Open app:**
   ```
   http://localhost:8084
   ```

4. **Login to your account**

5. **Go to Account page:**
   ```
   http://localhost:8084/account
   ```

6. **Click upgrade button**
   - Shows loading spinner
   - Redirects to Dodo checkout
   - Complete payment with test card

7. **Dodo sends webhook**
   - Backend processes webhook
   - Updates Supabase database
   - User subscription upgraded!

8. **Check backend terminal**
   - Should show webhook received
   - Should show database updated

---

## 🎯 Success Checklist

- [ ] Backend server starts without errors
- [ ] Frontend loads on port 8084
- [ ] Health check returns OK
- [ ] Can access /account page
- [ ] Upgrade button shows loading state
- [ ] Redirects to Dodo checkout page
- [ ] ngrok pointing to port 3001
- [ ] Dodo webhook URL updated with ngrok

---

## 📝 Your Current Setup

**Frontend URL:** http://localhost:8084  
**Backend URL:** http://localhost:3001  
**Backend Health:** http://localhost:3001/api/health  
**Account Page:** http://localhost:8084/account  

**Next Steps:**
1. ✅ Test health check endpoint
2. ✅ Update ngrok to port 3001
3. ✅ Update Dodo webhook URL
4. ✅ Test upgrade button
5. ✅ Complete test payment

---

## 🆘 Still Having Issues?

**Check backend terminal logs:**
- Look for errors starting with `❌`
- Check for missing environment variables
- Check for API connection errors

**Check browser console:**
- Press F12 → Console tab
- Look for network errors
- Check if API calls are being made to `http://localhost:3001`

**Common fixes:**
1. Restart servers: Stop with Ctrl+C, run `npm run dev:full` again
2. Check .env file: Make sure all variables are set correctly
3. Clear browser cache: Ctrl+Shift+Delete
4. Try different browser: Test in incognito/private mode

---

**Everything ready? Test the upgrade button now!** 🚀

