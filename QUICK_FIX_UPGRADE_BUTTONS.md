# QUICK FIX: Upgrade Buttons Not Working

## ❌ Problem
Your upgrade buttons aren't working because **Vite doesn't have a backend server** to handle the API routes!

## ✅ Solution (5 minutes)

### Step 1: Install Backend Dependencies

```bash
npm install express cors dotenv concurrently
```

### Step 2: Add .env Variables

Add this to your `.env` file:

```env
# Backend server port
PORT=3001

# Backend API URL (for frontend to call)
VITE_API_URL=http://localhost:3001

# Keep all your existing Dodo variables...
DODO_PAYMENTS_API_KEY=dodo_test_xxxxx
DODO_WEBHOOK_SECRET=whsec_xxxxx
VITE_DODO_PRODUCT_ID_PRO=prod_xxxxx
VITE_DODO_PRODUCT_ID_ADVANCED=prod_xxxxx
VITE_DODO_PRODUCT_ID_ENTERPRISE=prod_xxxxx
```

### Step 3: Update package.json Scripts

Open `package.json` and add these scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "server": "node server.js",
    "dev:full": "concurrently \"npm run dev\" \"npm run server\""
  }
}
```

### Step 4: Start Both Servers

```bash
# This starts both frontend (8080) and backend (3001)
npm run dev:full
```

You should see:
```
[0] ➜  Local:   http://localhost:8080/
[1] 🚀 Dodo Payments API Server Started!
[1] 📡 Server running on: http://localhost:3001
```

### Step 5: Update ngrok to Point to Backend

**Stop your current ngrok** and restart it pointing to the backend:

```bash
# Stop current ngrok (Ctrl+C)

# Start ngrok pointing to BACKEND (port 3001)
ngrok http 3001
```

### Step 6: Update Dodo Webhook URL

Your new webhook URL should be:
```
https://your-new-ngrok-url.ngrok-free.dev/api/webhooks/dodo
```

Go to Dodo Dashboard → Settings → Webhooks → Update endpoint

### Step 7: Test Upgrade Button!

1. Go to http://localhost:8080/account
2. Click "Upgrade to Professional"
3. Should redirect to Dodo checkout! ✅

## 🧪 Quick Test

Test if backend is running:

Open browser: http://localhost:3001/api/health

Should see:
```json
{
  "status": "ok",
  "message": "Dodo Payments API server is running"
}
```

## 🔧 Troubleshooting

### "Cannot find module 'express'"
```bash
npm install express cors dotenv concurrently
```

### "Port 3001 already in use"
```bash
# Change PORT in .env to 3002
PORT=3002
```

### "Checkout button still not working"
1. Check backend terminal - should show logs
2. Check browser console - should show fetch request
3. Verify `.env` has all Dodo keys
4. Verify backend is running (test /api/health)

### Frontend can't connect to backend
```bash
# Verify VITE_API_URL in .env
VITE_API_URL=http://localhost:3001

# Restart dev server after changing .env
Ctrl+C
npm run dev:full
```

## 📊 Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Frontend      │      │   Backend       │      │  Dodo Payments  │
│   Vite :8080    │─────>│   Express :3001 │─────>│                 │
│                 │      │                 │<─────│  (Webhooks)     │
│ • React App     │      │ • API Routes    │      │                 │
│ • Upgrade UI    │      │ • Dodo Client   │      │ • Checkout      │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                  ↑
                                  │ ngrok
                                  │ https://xxx.ngrok-free.dev
```

## ✅ Success Checklist

- [ ] Backend dependencies installed
- [ ] `.env` updated with PORT and VITE_API_URL
- [ ] `package.json` has new scripts
- [ ] `npm run dev:full` runs both servers
- [ ] http://localhost:3001/api/health returns OK
- [ ] ngrok points to port 3001
- [ ] Dodo webhook updated with new ngrok URL
- [ ] Upgrade button redirects to Dodo checkout

## 🎯 Expected Behavior

**Before fix:**
- Click upgrade → Nothing happens

**After fix:**
- Click upgrade → Loading spinner
- → Redirects to Dodo checkout page
- → Complete payment
- → Returns to success page
- → Subscription activated! ✅

---

**Questions?** Check the full guide: `BACKEND_SETUP_INSTRUCTIONS.md`

