# 🔧 Backend Server Restart Required

## ⚠️ Current Issues

Based on your console logs:

1. **Pro Plan:** `400 Bad Request` - Backend validation fixed ✅
2. **Advanced Plan:** `404 Not Found` - Backend server not responding ❌
3. **Enterprise Plan:** Working perfectly ✅

The **404 error** means the backend server either:
- Never started properly
- Crashed after starting
- Is not running on port 3001

---

## 🚀 Quick Fix

### Step 1: Check Your Terminal

Look at the terminal where you ran `npm run dev:full`

**Do you see:**
```
[1] 🚀 Dodo Payments API Server Started!
[1] 📡 Server running on: http://localhost:3001
```

**If YES:** Backend is running, skip to Step 3  
**If NO:** Backend crashed or didn't start, continue to Step 2

---

### Step 2: Restart Backend

**In your terminal:**

1. **Stop the current process:**
   - Press `Ctrl + C`

2. **Start both servers again:**
   ```bash
   npm run dev:full
   ```

3. **Wait for both to start:**
   ```
   [0] VITE v5.4.10  ready in xxx ms
   [0] ➜  Local:   http://localhost:8084/
   [1] 🚀 Dodo Payments API Server Started!
   [1] 📡 Server running on: http://localhost:3001
   ```

---

### Step 3: Test Backend Health

**Open in browser:**
```
http://localhost:3001/api/health
```

**Should see:**
```json
{
  "status": "ok",
  "message": "Dodo Payments API server is running",
  "timestamp": "2025-11-12T...",
  "endpoints": { ... }
}
```

**If you see 404 or can't connect:**
- Backend is NOT running
- Go back to Step 2

---

### Step 4: Hard Refresh Frontend

**In your browser:**
```bash
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

---

### Step 5: Test Upgrade Buttons Again

Go to: **http://localhost:8084/account**

Click each button:

#### ✅ Professional Plan
- Should initiate checkout
- Redirect to Dodo

#### ✅ Advanced Plan  
- Should initiate checkout
- Redirect to Dodo

#### ✅ Enterprise Plan
- Shows "contact sales" message
- No redirect (expected)

---

## 🔍 If Backend Still Won't Start

### Check for Port Conflicts

**PowerShell:**
```powershell
netstat -ano | findstr :3001
```

**If you see output:**
```
TCP    0.0.0.0:3001    0.0.0.0:0    LISTENING    12345
```

Port 3001 is already in use!

**Kill the process:**
```powershell
taskkill /PID 12345 /F
```

Then restart: `npm run dev:full`

---

### Check for Errors in Terminal

When you run `npm run dev:full`, look for errors in the `[1]` output (backend):

**Common errors:**

1. **"Cannot find module"**
   ```bash
   npm install
   ```

2. **"Port 3001 already in use"**
   - Kill the process (see above)
   - Or change PORT in .env to 3002

3. **"Missing environment variable"**
   - Check your .env file
   - Make sure all variables are set

---

## ✅ Expected Console Logs (After Fix)

### Professional Plan:
```javascript
🎯 Plan selected: pro
🚀 Initiating checkout for: pro
POST http://localhost:3001/api/checkout/create-session 200 OK
✅ Checkout URL received: https://checkout.dodopayments.com/...
```

### Advanced Plan:
```javascript
🎯 Plan selected: advanced
🚀 Initiating checkout for: advanced
POST http://localhost:3001/api/checkout/create-session 200 OK
✅ Checkout URL received: https://checkout.dodopayments.com/...
```

### Enterprise Plan:
```javascript
🎯 Plan selected: enterprise
(Shows toast: "Please contact sales")
```

---

## 📊 What I Fixed

| Issue | Status |
|-------|--------|
| Backend validation accepts 'pro' | ✅ Fixed in server.js |
| Backend validation accepts 'advanced' | ✅ Already working |
| Frontend sends 'pro' (not 'professional') | ✅ Already fixed |
| CORS allows port 8084 | ✅ Already fixed |

**Only issue left:** Backend server needs to be restarted!

---

## 🎯 Commands Summary

```bash
# Stop current servers
Ctrl + C

# Restart both servers
npm run dev:full

# Test backend health (in browser)
http://localhost:3001/api/health

# Hard refresh frontend (in browser)
Ctrl + Shift + R
```

---

**Restart your backend server now and try the upgrade buttons again!** 🚀

