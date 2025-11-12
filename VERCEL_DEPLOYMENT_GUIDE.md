# 🚀 BAESS Solar - Vercel Deployment Guide

## ✅ Backend Conversion Complete!

Your backend has been successfully converted from Express.js (`server.js`) to Vercel Serverless Functions in the `/api` folder.

### What Changed:

- ✅ All Express routes migrated to `/api` folder
- ✅ Health check endpoint created
- ✅ Dodo Payments checkout/webhook endpoints updated
- ✅ Subscription status and cancel endpoints created
- ✅ API paths fixed in `dodoPaymentService.ts`
- ✅ All changes pushed to GitHub

---

## 📦 Vercel Serverless API Endpoints

Your app now has these serverless functions:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/checkout/create-session` | POST | Create Dodo checkout session |
| `/api/webhooks/dodo` | POST | Handle Dodo payment webhooks |
| `/api/subscription/status` | GET | Get subscription status |
| `/api/subscription/cancel` | POST | Cancel subscription |

---

## 🌐 Step-by-Step Vercel Deployment

### **1. Connect GitHub to Vercel**

1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click **"Add New Project"**
4. Select **"Import Git Repository"**
5. Find and import **`BAESS_Solar`** repository
6. Click **"Import"**

### **2. Configure Build Settings**

Vercel should auto-detect these settings:

- **Framework Preset**: Vite
- **Root Directory**: `./`
- **Build Command**: `npm run build` or `vite build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### **3. Add Environment Variables**

Go to **Settings** → **Environment Variables** and add:

#### **Supabase Configuration:**
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### **API Keys:**
```
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

#### **Dodo Payments (Use LIVE credentials for production):**
```
VITE_DODO_API_KEY=your_live_dodo_api_key
DODO_PAYMENTS_API_KEY=your_live_dodo_api_key
DODO_WEBHOOK_SECRET=your_dodo_webhook_secret

VITE_DODO_PRODUCT_ID_PRO=prod_xxx_professional
VITE_DODO_PRODUCT_ID_ADVANCED=prod_xxx_advanced
VITE_DODO_PRODUCT_ID_ENTERPRISE=prod_xxx_enterprise
```

#### **App URLs (Important!):**
```
VITE_APP_URL=https://your-vercel-domain.vercel.app
VITE_API_URL=https://your-vercel-domain.vercel.app
```

> **Note:** After first deployment, you'll get your actual Vercel URL. Update `VITE_APP_URL` and `VITE_API_URL` with it.

#### **Other:**
```
NODE_ENV=production
```

### **4. Deploy!**

1. Click **"Deploy"**
2. Wait 2-5 minutes for build to complete
3. You'll get a URL like: `https://baess-solar.vercel.app`

---

## 🔄 Post-Deployment Configuration

### **Update Dodo Payments Dashboard**

1. Log into [Dodo Payments Dashboard](https://dodopayments.com)
2. Switch to **LIVE mode** ⚠️
3. Go to **Settings** → **Webhooks**
4. Update webhook URL to:
   ```
   https://your-vercel-domain.vercel.app/api/webhooks/dodo
   ```
5. Copy the **Webhook Secret** and add it to Vercel environment variables

### **Update Supabase Configuration**

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Update **Site URL** to:
   ```
   https://your-vercel-domain.vercel.app
   ```
4. Add **Redirect URLs**:
   ```
   https://your-vercel-domain.vercel.app/auth/callback
   https://your-vercel-domain.vercel.app/subscription/success
   ```

### **Test Your Deployment**

✅ Test these features:

1. **Authentication:** Login/Signup
2. **PV Designer Pro:** Draw solar arrays on map
3. **BOQ Generation:** Test AI-powered BOQ (uses OpenAI)
4. **Google Maps:** Verify maps are loading
5. **Subscription Upgrade:** Test payment flow (use live card)
6. **Webhook Processing:** Verify subscription activates after payment

---

## 🔐 Security Checklist

- ✅ Use **LIVE** Dodo API keys in production
- ✅ Add **Webhook Secret** for signature verification
- ✅ Never commit `.env` file to GitHub (already in `.gitignore`)
- ✅ Enable CORS only for your domain (currently set to `*` for testing)
- ✅ Verify RLS policies in Supabase are properly configured

---

## 🌐 Custom Domain Setup (Optional)

### Add Custom Domain:

1. Go to Vercel project **Settings** → **Domains**
2. Add your domain (e.g., `app.baesslabs.com`)
3. Update DNS records as instructed:
   - Type: `CNAME`
   - Name: `app` (or `@` for root)
   - Value: `cname.vercel-dns.com`
4. After DNS propagation (5-60 minutes):
   - Update `VITE_APP_URL` to `https://app.baesslabs.com`
   - Update webhook URL in Dodo Payments
   - Update Site URL in Supabase

---

## 🐛 Troubleshooting

### **Build Fails**

- Check Vercel build logs for errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### **API Routes Don't Work**

- Ensure environment variables are set in Vercel
- Check function logs in Vercel dashboard
- Verify API endpoint paths start with `/api`

### **Webhooks Not Received**

- Verify webhook URL is correct in Dodo dashboard
- Check webhook secret is set in environment variables
- Look at function logs in Vercel for errors

### **Payment Fails**

- Ensure you're using **LIVE** Dodo API keys
- Verify **LIVE** product IDs are correct
- Check Dodo dashboard for payment status

### **Maps Not Loading**

- Verify `VITE_GOOGLE_MAPS_API_KEY` is set
- Check Google Cloud Console for API restrictions
- Ensure domain is whitelisted in Google Maps API settings

---

## 📊 Monitoring & Logs

### Vercel Dashboard:

- **Functions:** View serverless function logs
- **Analytics:** Monitor page views and performance
- **Deployments:** View deployment history

### Recommended Monitoring:

- Set up **Vercel Speed Insights** for performance
- Enable **Vercel Analytics** for user analytics
- Monitor Supabase dashboard for database metrics
- Check Dodo Payments dashboard for transaction logs

---

## 🔄 Continuous Deployment

Every push to the `main` branch on GitHub will automatically trigger a new deployment on Vercel!

To deploy updates:
```bash
git add .
git commit -m "Your update message"
git push origin main
```

Vercel will automatically:
1. Pull latest code
2. Run build
3. Deploy to production
4. Update your live site (usually < 2 minutes)

---

## 📞 Support

For issues:
- **Vercel:** [vercel.com/support](https://vercel.com/support)
- **Dodo Payments:** [dodopayments.com/support](https://dodopayments.com/support)
- **Supabase:** [supabase.com/support](https://supabase.com/support)

---

## ✅ Deployment Checklist

- [ ] GitHub repo pushed to BAESS_Solar
- [ ] Vercel project created and connected
- [ ] All environment variables added to Vercel
- [ ] First deployment successful
- [ ] Update `VITE_APP_URL` with actual Vercel URL
- [ ] Update Dodo Payments webhook URL
- [ ] Update Supabase Site URL and redirect URLs
- [ ] Switch Dodo Dashboard to LIVE mode
- [ ] Test login/signup
- [ ] Test PV Designer Pro
- [ ] Test BOQ generation
- [ ] Test subscription upgrade flow
- [ ] Test webhook processing
- [ ] Set up custom domain (optional)
- [ ] Monitor logs and analytics

---

**🎉 Your BAESS Solar app is now ready for production on Vercel!**
