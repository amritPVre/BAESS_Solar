# Vercel Deployment Guide for Dodo Payments Integration

## 🎯 Overview

Your app now works in **TWO modes**:

1. **Local Development** → Express server (`server.js`)
2. **Vercel Production** → Serverless functions (`/api` folder)

---

## 📁 Project Structure

```
sunny-finance-toolkit/
├── api/                          ← Vercel serverless functions (PRODUCTION)
│   ├── checkout/
│   │   └── create-session.js    → /api/checkout/create-session
│   └── webhooks/
│       └── dodo.js               → /api/webhooks/dodo
│
├── server.js                     ← Express server (LOCAL DEV ONLY)
├── vercel.json                   ← Vercel configuration
├── src/                          ← Your React app
└── package.json
```

---

## 🚀 Deployment Steps

### Step 1: Connect GitHub to Vercel

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Add Dodo Payments integration"
   git push origin main
   ```

2. Go to https://vercel.com
3. Click **"New Project"**
4. **Import** your GitHub repository
5. Vercel will auto-detect it's a Vite project ✅

### Step 2: Configure Environment Variables in Vercel

In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**

Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Production |
| `VITE_SUPABASE_ANON_KEY` | `eyJxxx...` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJxxx...` (from Supabase settings) | Production |
| `DODO_PAYMENTS_API_KEY` | `dodo_live_xxx` (use LIVE key!) | Production |
| `DODO_WEBHOOK_SECRET` | `whsec_xxx` | Production |
| `VITE_DODO_PRODUCT_ID_PRO` | `prod_xxx` | Production |
| `VITE_DODO_PRODUCT_ID_ADVANCED` | `prod_xxx` | Production |
| `VITE_DODO_PRODUCT_ID_ENTERPRISE` | `prod_xxx` | Production |
| `VITE_APP_URL` | `https://your-app.vercel.app` | Production |

**⚠️ Important:**
- Use **LIVE** API keys for production (not test keys!)
- Create **PRODUCTION** products in Dodo Dashboard
- `VITE_APP_URL` should be your actual Vercel URL

### Step 3: Deploy

```bash
# Option A: Deploy via Vercel Dashboard
# Just push to GitHub, Vercel auto-deploys!

# Option B: Deploy via CLI
npm install -g vercel
vercel --prod
```

### Step 4: Update Dodo Webhook URL

Once deployed, update your webhook in Dodo Dashboard:

**Production Webhook URL:**
```
https://your-app.vercel.app/api/webhooks/dodo
```

Go to Dodo Dashboard → Settings → Webhooks → Add Production Endpoint

---

## 🔧 How It Works

### Local Development (localhost)

```
Frontend (Vite)          Express Server          Dodo Payments
localhost:8080    →      localhost:3001    →     api.dodopayments.com
                              ↑
                           ngrok
                              ↑
                         (webhooks)
```

**Commands:**
```bash
npm run dev:full
ngrok http 3001
```

### Production (Vercel)

```
Frontend (Vercel)        Serverless Functions    Dodo Payments
your-app.vercel.app  →   /api/checkout/*    →   api.dodopayments.com
                              ↑
                         (direct HTTPS)
                              ↑
                         (webhooks)
```

**No ngrok needed!** Vercel provides HTTPS automatically.

---

## 🔄 Code Switching (Automatic)

The frontend automatically detects which environment it's in:

```typescript
// src/services/dodoPaymentService.ts
constructor(baseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:3001') {
  this.baseUrl = baseUrl;
}
```

**Local:** Uses `http://localhost:3001` (Express)  
**Vercel:** Uses `/api` (Serverless - relative paths work!)

---

## ✅ Verification Checklist

### Before Deploying:

- [ ] All code pushed to GitHub
- [ ] `api/` folder with serverless functions exists
- [ ] `vercel.json` configuration file exists
- [ ] All environment variables ready

### After Deploying:

- [ ] App loads at `https://your-app.vercel.app`
- [ ] Login/signup works
- [ ] Can access `/account` page
- [ ] Test health check: `https://your-app.vercel.app/api/checkout/create-session` (should return 405 Method Not Allowed - that's correct!)
- [ ] Webhook endpoint: `https://your-app.vercel.app/api/webhooks/dodo` (should return 405 - correct!)
- [ ] Updated Dodo webhook URL
- [ ] Test upgrade button → redirects to Dodo checkout
- [ ] Complete test payment → webhook processes → subscription activates

---

## 🧪 Testing Production

### 1. Test Checkout Flow

1. Go to `https://your-app.vercel.app/account`
2. Click "Upgrade to Professional"
3. Should redirect to Dodo checkout
4. Complete payment (use real card or Dodo test card)
5. Should redirect back to success page
6. Check database - subscription should be updated

### 2. Test Webhook Delivery

**In Dodo Dashboard:**
- Go to Settings → Webhooks
- Click on your production endpoint
- Click "Send Test Event"
- Should show successful delivery (200 OK)

**Check Vercel Logs:**
- Vercel Dashboard → Your Project → Functions
- Click on `/api/webhooks/dodo`
- Should see execution logs

---

## 🔍 Debugging

### Vercel Function Logs

View real-time logs:
```bash
vercel logs your-app-url
```

Or in Vercel Dashboard:
- Your Project → Functions
- Click on any function to see logs
- Shows console.log output and errors

### Common Issues

**"Module not found: 'dodopayments'"**
```json
// Ensure package.json has:
{
  "dependencies": {
    "dodopayments": "^x.x.x"
  }
}
```

**"Environment variable not defined"**
- Check Vercel Dashboard → Settings → Environment Variables
- Make sure all variables are set
- Redeploy after adding variables

**"Webhook not processing"**
- Check webhook URL is correct
- Check DODO_WEBHOOK_SECRET is set
- View function logs in Vercel

**"401 Unauthorized"**
- Check Supabase keys are correct
- Make sure user is logged in
- Check Authorization header is being sent

---

## 📊 Environment Comparison

| Feature | Local Dev | Vercel Production |
|---------|-----------|-------------------|
| **Frontend** | Vite (8080) | Vercel CDN |
| **Backend** | Express (3001) | Serverless Functions |
| **API Base** | `http://localhost:3001` | `/api` (relative) |
| **Webhooks** | ngrok tunnel | Direct HTTPS |
| **Env Vars** | `.env` file | Vercel Dashboard |
| **Dodo Keys** | Test mode | Live mode |
| **Deploy** | `npm run dev:full` | Git push |

---

## 🎯 Best Practices

### Development Workflow:

1. **Develop locally** with test keys
   ```bash
   npm run dev:full
   ngrok http 3001
   ```

2. **Test thoroughly** with Dodo test cards

3. **Commit and push** to GitHub
   ```bash
   git add .
   git commit -m "Feature: Add subscription"
   git push
   ```

4. **Vercel auto-deploys** to production

5. **Test production** with real payment (small amount)

### Security:

- ✅ Keep `.env` in `.gitignore`
- ✅ Use test keys locally, live keys in production
- ✅ Never commit API keys
- ✅ Use environment variables for all secrets
- ✅ Verify webhook signatures in production

---

## 🚨 Important Notes

### Local Dev:
- ✅ Uses `server.js` (Express)
- ✅ Runs on port 3001
- ✅ Needs ngrok for webhooks
- ✅ Uses test Dodo keys

### Vercel Production:
- ✅ Uses `api/` folder (Serverless)
- ✅ Auto-scales
- ✅ Direct HTTPS (no ngrok)
- ✅ Uses live Dodo keys
- ✅ Automatic SSL
- ✅ Global CDN

### Migration:
- ✅ No code changes needed!
- ✅ Frontend auto-detects environment
- ✅ Just push to GitHub to deploy

---

## 📞 Support

**Vercel Issues:**
- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support

**Dodo Payments:**
- Dodo Docs: https://docs.dodopayments.com
- Dodo Support: support@dodopayments.com

---

## ✅ Quick Deploy Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] All env vars configured in Vercel
- [ ] Deployed successfully
- [ ] App loads on Vercel URL
- [ ] Updated Dodo webhook to production URL
- [ ] Tested upgrade button
- [ ] Tested webhook delivery
- [ ] Production payment test completed

---

**You're ready to deploy! 🚀**

Both local and production environments are configured to work seamlessly!

