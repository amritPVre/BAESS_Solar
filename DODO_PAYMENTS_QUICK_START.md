# Dodo Payments - Quick Start Guide

## 🎯 What Has Been Implemented

Your BAESS Labs application now has a complete Dodo Payments subscription integration! Here's what was added:

### ✅ Backend Services
- **Dodo Payment Service** (`src/services/dodoPaymentService.ts`)
  - Checkout session creation
  - Webhook signature verification  
  - Subscription management API client

### ✅ API Routes
- **POST `/api/checkout/create-session`** - Creates Dodo checkout sessions
- **POST `/api/webhooks/dodo`** - Handles Dodo webhook events
- **GET `/api/subscription/status`** - Get subscription status
- **POST `/api/subscription/cancel`** - Cancel subscription

### ✅ Frontend Components
- **CheckoutButton** - Initiates checkout flow
- **SubscriptionManager** - Displays subscription info and management
- **SubscriptionSuccess** - Post-payment success page

### ✅ Routing
- `/subscription/success` - Success page after payment

## 🚀 Next Steps (What YOU Need to Do)

### 1. Create Dodo Payments Account (5 minutes)

1. Go to https://dashboard.dodopayments.com
2. Sign up for an account
3. Complete your business profile

### 2. Get Your API Credentials (2 minutes)

In Dodo Dashboard:
1. Navigate to **Settings** → **API Keys**
2. Copy your **API Key** (starts with `dodo_`)
3. Copy your **Webhook Secret** (starts with `whsec_`)

### 3. Create Subscription Products (5 minutes)

Create two subscription products in Dodo Dashboard:

**Product 1: Professional Plan**
- Name: "Professional Plan"
- Price: **$18/month**
- Billing: Monthly
- Copy the Product ID after creation

**Product 2: Advanced Plan**
- Name: "Advanced Plan"
- Price: **$54/month**
- Billing: Monthly
- Copy the Product ID after creation

### 4. Configure Environment Variables (3 minutes)

Create/update your `.env` file:

```env
# Dodo Payments Configuration
VITE_DODO_API_KEY=dodo_test_your_key_here
DODO_PAYMENTS_API_KEY=dodo_test_your_key_here
DODO_WEBHOOK_SECRET=whsec_your_secret_here

# Product IDs (replace with your actual IDs)
VITE_DODO_PRODUCT_ID_PRO=prod_xxxxxxxxxxxxx
VITE_DODO_PRODUCT_ID_ADVANCED=prod_xxxxxxxxxxxxx

# App URL
VITE_APP_URL=http://localhost:5173
```

### 5. Test the Integration (10 minutes)

```bash
# Start your dev server
npm run dev

# Navigate to:
http://localhost:5173/account

# Click "Upgrade to Professional" or "Upgrade to Advanced"
# Complete the test payment with Dodo test cards
# Verify redirect to success page
```

### 6. Configure Webhooks (5 minutes)

In Dodo Dashboard:
1. Go to **Settings** → **Webhooks**
2. Click **"Add Endpoint"**
3. Enter your webhook URL:
   - Development: `https://your-ngrok-url.com/api/webhooks/dodo`
   - Production: `https://your-domain.com/api/webhooks/dodo`
4. Select these events:
   - ✅ `subscription.active`
   - ✅ `subscription.renewed`
   - ✅ `subscription.on_hold`
   - ✅ `subscription.failed`
   - ✅ `payment.succeeded`
   - ✅ `payment.failed`
5. Save the endpoint

**Note:** For local development, use [ngrok](https://ngrok.com/) to expose your localhost:
```bash
ngrok http 5173
```

## 📖 How It Works

### User Flow:

1. **User clicks "Upgrade"** → 
2. **Frontend calls** `/api/checkout/create-session` → 
3. **Backend creates** Dodo checkout session → 
4. **User redirects** to Dodo payment page → 
5. **User completes** payment → 
6. **Dodo sends webhook** to your server → 
7. **Webhook handler** updates database → 
8. **User redirects** to success page → 
9. **Subscription activated!** ✅

### Webhook Events:

- **`subscription.active`** → Subscription activated, credits allocated
- **`subscription.renewed`** → Monthly renewal, credits reset
- **`subscription.on_hold`** → Payment failed, subscription paused
- **`subscription.failed`** → Subscription creation failed
- **`payment.succeeded`** → Payment processed successfully
- **`payment.failed`** → Payment attempt failed

## 🔍 Testing Checklist

- [ ] Test checkout flow with test card
- [ ] Verify subscription activation in database
- [ ] Test webhook delivery and processing
- [ ] Verify credit allocation after payment
- [ ] Test subscription cancellation
- [ ] Test plan upgrade/downgrade

## 🛠️ Common Issues & Solutions

### Issue: Checkout button doesn't work
**Solution:** 
- Check API key in `.env`
- Verify product IDs are correct
- Check browser console for errors

### Issue: Webhooks not received
**Solution:**
- Verify webhook URL is publicly accessible
- Use ngrok for local development
- Check webhook secret is correct
- Verify HTTPS is enabled

### Issue: Subscription not activating
**Solution:**
- Check webhook delivery in Dodo Dashboard
- Verify database migration is complete
- Check server logs for errors
- Ensure user_id is in webhook metadata

## 📞 Need Help?

### Resources:
- **Full Documentation:** See `DODO_PAYMENTS_INTEGRATION_GUIDE.md`
- **Setup Checklist:** See `DODO_PAYMENTS_SETUP_CHECKLIST.md`
- **Dodo Docs:** https://docs.dodopayments.com
- **Dodo Support:** support@dodopayments.com

### Support Channels:
- Check Dodo Dashboard for webhook logs
- Review server console logs
- Check database for subscription updates

## 🎉 You're Ready!

Once you complete these steps, your subscription system will be fully operational:

✅ Users can subscribe to Professional ($18/mo) or Advanced ($54/mo)  
✅ Automated credit allocation based on plan  
✅ Monthly recurring billing  
✅ Self-service subscription management  
✅ Webhook-based automation  

**Time to complete setup:** ~30 minutes  
**Technical complexity:** Low to Medium  

---

**Questions?** Refer to the detailed integration guide or Dodo Payments documentation.

Good luck! 🚀

