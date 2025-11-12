# Dodo Payments Integration - Setup Checklist

## ✅ Phase 1: Installation & Dependencies (COMPLETED)

- [x] Installed `dodopayments` npm package
- [x] Created service files for Dodo Payments integration
- [x] Created API routes for checkout and webhooks
- [x] Created frontend components for subscription management
- [x] Updated routing to include subscription success page

## 📋 Phase 2: Configuration Required

### Step 1: Dodo Payments Dashboard Setup

1. **Create Dodo Payments Account**
   - [ ] Sign up at https://dashboard.dodopayments.com
   - [ ] Verify your email
   - [ ] Complete business profile

2. **Get API Credentials**
   - [ ] Navigate to Settings > API Keys
   - [ ] Copy Production API Key
   - [ ] Copy Test API Key (for development)
   - [ ] Copy Webhook Secret Key

3. **Create Subscription Products**
   
   **Professional Plan:**
   - [ ] Create product in Dodo Dashboard
   - [ ] Set name: "Professional Plan"
   - [ ] Set price: $18/month
   - [ ] Set billing cycle: Monthly
   - [ ] Copy the Product ID (e.g., `prod_xxxxxxxxxxxx`)
   
   **Advanced Plan:**
   - [ ] Create product in Dodo Dashboard
   - [ ] Set name: "Advanced Plan"  
   - [ ] Set price: $54/month
   - [ ] Set billing cycle: Monthly
   - [ ] Copy the Product ID (e.g., `prod_xxxxxxxxxxxx`)

### Step 2: Environment Variables Configuration

1. **Create `.env` file** (copy from `.env.example`)
   
   ```bash
   cp .env.example .env
   ```

2. **Add Dodo Payments credentials to `.env`:**
   
   ```env
   # For Development (Test Mode)
   VITE_DODO_API_KEY=dodo_test_xxxxxxxxxxxxxxxx
   DODO_PAYMENTS_API_KEY=dodo_test_xxxxxxxxxxxxxxxx
   DODO_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
   
   # Product IDs from Dodo Dashboard
   VITE_DODO_PRODUCT_ID_PRO=prod_subscription_monthly_pro
   VITE_DODO_PRODUCT_ID_ADVANCED=prod_subscription_monthly_advanced
   
   # App URL (for return URLs)
   VITE_APP_URL=http://localhost:5173
   ```

3. **For Production:**
   - [ ] Use production API keys
   - [ ] Update `VITE_APP_URL` to your production domain
   - [ ] Use production product IDs

### Step 3: Database Verification

The following database structures should already exist (from previous AI credit system migration):

- [ ] Verify `profiles` table has subscription columns:
  - `subscription_tier`
  - `ai_credits_remaining`
  - `ai_credits_monthly_limit`
  - `subscription_start_date`
  - `next_credit_reset_date`
  - `stripe_customer_id` (will store Dodo customer ID)
  - `stripe_subscription_id` (will store Dodo subscription ID)
  - `subscription_status`

- [ ] Verify `subscription_plans` table exists with plans
- [ ] Verify `ai_credit_transactions` table exists
- [ ] Verify `update_subscription_tier()` function exists

**If any are missing, run:**
```bash
# Check your Supabase migrations folder
cd supabase/migrations
# Run the AI credit system migration if needed
```

### Step 4: Webhook Configuration

1. **Set up webhook endpoint in Dodo Dashboard:**
   - [ ] Navigate to Settings > Webhooks
   - [ ] Click "Add Endpoint"
   - [ ] Enter webhook URL:
     - Development: `https://your-dev-url.com/api/webhooks/dodo`
     - Production: `https://your-production-url.com/api/webhooks/dodo`
   - [ ] Select events to receive:
     - [x] `subscription.active`
     - [x] `subscription.renewed`
     - [x] `subscription.on_hold`
     - [x] `subscription.failed`
     - [x] `payment.succeeded`
     - [x] `payment.failed`
   - [ ] Copy the webhook signing secret
   - [ ] Save endpoint

2. **Configure Webhook Handler:**
   - [ ] Ensure `DODO_WEBHOOK_SECRET` is set in `.env`
   - [ ] Test webhook signature verification

### Step 5: Testing in Development

1. **Test Checkout Flow:**
   ```bash
   # Start your development server
   npm run dev
   ```
   
   - [ ] Navigate to `/account` page
   - [ ] Click "Upgrade to Professional" or "Upgrade to Advanced"
   - [ ] Verify redirect to Dodo checkout page
   - [ ] Complete test payment (use Dodo test cards)
   - [ ] Verify redirect back to success page
   - [ ] Check that subscription is activated in database

2. **Test Webhook Processing:**
   - [ ] Use Dodo Dashboard to trigger test webhooks
   - [ ] Check server logs for webhook processing
   - [ ] Verify database updates after webhook events
   - [ ] Test all webhook event types

3. **Test Subscription Management:**
   - [ ] View subscription status in account page
   - [ ] Test subscription cancellation
   - [ ] Test plan upgrades/downgrades

### Step 6: Frontend Integration

1. **Update Landing Page (Optional):**
   - [ ] Update pricing section to use `CheckoutButton` component
   - [ ] Test checkout from landing page

2. **Update Account Page:**
   - [ ] Verify `SubscriptionManager` component is displayed
   - [ ] Test all subscription management features

### Step 7: Production Deployment

1. **Pre-Deployment:**
   - [ ] Switch to production API keys
   - [ ] Update webhook URL to production domain
   - [ ] Update `VITE_APP_URL` to production domain
   - [ ] Test in staging environment first

2. **Deploy:**
   - [ ] Deploy backend API routes
   - [ ] Deploy frontend with updated environment variables
   - [ ] Verify webhook endpoint is accessible

3. **Post-Deployment Verification:**
   - [ ] Test complete signup flow
   - [ ] Test payment processing
   - [ ] Verify webhook delivery
   - [ ] Check database updates
   - [ ] Test email notifications (if implemented)

## 🔧 Troubleshooting

### Common Issues:

**Checkout Not Working:**
- Verify API key is correct and has proper permissions
- Check product IDs match exactly
- Ensure user is authenticated
- Check browser console for errors

**Webhooks Not Processing:**
- Verify webhook secret is correct
- Check webhook signature verification
- Ensure webhook URL is publicly accessible
- Check server logs for errors
- Verify HTTPS is enabled (required for webhooks)

**Subscription Not Activating:**
- Check webhook delivery in Dodo Dashboard
- Verify database function `update_subscription_tier()` exists
- Check user_id in webhook metadata
- Review server logs for errors

### Debugging Tools:

1. **Dodo Dashboard:**
   - View all subscription events
   - See webhook delivery status
   - Retry failed webhooks
   - View test data

2. **Server Logs:**
   ```bash
   # Check API route logs
   console.log statements in:
   - src/pages/api/checkout/create-session.ts
   - src/pages/api/webhooks/dodo.ts
   ```

3. **Database Queries:**
   ```sql
   -- Check user subscription
   SELECT subscription_tier, ai_credits_remaining, subscription_status 
   FROM profiles 
   WHERE email = 'user@example.com';
   
   -- Check recent transactions
   SELECT * FROM ai_credit_transactions 
   WHERE user_id = 'user-uuid' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

## 📊 Monitoring

Set up monitoring for:
- [ ] Successful checkout sessions
- [ ] Failed payments
- [ ] Webhook processing errors
- [ ] Subscription churns
- [ ] Revenue metrics

## 📧 Email Notifications (To Implement)

Consider adding email notifications for:
- [ ] Successful subscription activation
- [ ] Payment failures
- [ ] Subscription cancellation
- [ ] Credit reset reminders
- [ ] Upgrade prompts when credits run low

## 🔐 Security Checklist

- [ ] API keys stored in environment variables only
- [ ] Webhook signature verification enabled
- [ ] HTTPS enforced on production
- [ ] Rate limiting on API endpoints
- [ ] Input validation on all forms
- [ ] User authentication on all protected routes

## 📝 Documentation

- [ ] Update internal docs with setup instructions
- [ ] Document subscription tiers and features
- [ ] Create support articles for common issues
- [ ] Document cancellation and refund policies

## ✨ Next Steps (Optional Enhancements)

- [ ] Add proration support for mid-cycle upgrades
- [ ] Implement annual billing with discount
- [ ] Add subscription pause functionality
- [ ] Implement usage-based billing for extra credits
- [ ] Add team/multi-seat subscriptions
- [ ] Implement coupon/promo code support
- [ ] Add invoice generation and download
- [ ] Integrate with accounting software

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your Dodo credentials to .env

# Start development server
npm run dev

# Test checkout flow at
# http://localhost:5173/account
```

## Support

- **Dodo Payments Documentation:** https://docs.dodopayments.com
- **Dodo Support:** support@dodopayments.com
- **Dashboard:** https://dashboard.dodopayments.com

---

**Last Updated:** $(date)
**Integration Version:** 1.0.0
**Status:** ✅ Code Ready - Configuration Required

