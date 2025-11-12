# Dodo Payments Integration Guide for BAESS Labs

## Overview
This guide provides step-by-step instructions for integrating Dodo Payments subscription billing into the BAESS Labs application.

## Documentation Reference
- [Dodo Payments Subscription Guide](https://docs.dodopayments.com/developer-resources/subscription-integration-guide#node-js-sdk)

## Current System Architecture

### Subscription Plans
| Plan | Monthly Price | AI Credits | Dodo Product ID (to configure) |
|------|--------------|------------|--------------------------------|
| Free | $0 | 9 | N/A (manual management) |
| Professional | $18 | 180 | `prod_subscription_monthly_pro` |
| Advanced | $54 | 360 | `prod_subscription_monthly_advanced` |

### Database Structure
- **profiles table**: Stores user subscription data
  - `subscription_tier`: 'free', 'pro', 'advanced', 'enterprise'
  - `ai_credits_remaining`: Current credit balance
  - `ai_credits_monthly_limit`: Monthly credit allocation
  - `subscription_start_date`: When subscription started
  - `next_credit_reset_date`: Next reset date
  - `stripe_customer_id`: Now will store Dodo customer ID
  - `stripe_subscription_id`: Now will store Dodo subscription ID
  - `subscription_status`: 'active', 'canceled', 'past_due', 'paused'

## Prerequisites

### 1. Dodo Payments Dashboard Setup
1. **Create Account**: Sign up at [Dodo Payments Dashboard](https://dashboard.dodopayments.com)
2. **Get API Credentials**:
   - Navigate to Settings > API Keys
   - Copy your `API Key` (starts with `dodo_`)
   - Copy your `Webhook Secret Key`
3. **Create Subscription Products**:
   - Product 1: "Professional Plan"
     - Price: $18/month
     - Billing Cycle: Monthly
     - Copy the `product_id` (e.g., `prod_xxxx`)
   - Product 2: "Advanced Plan"
     - Price: $54/month
     - Billing Cycle: Monthly
     - Copy the `product_id`

### 2. Required Information
Before starting, collect:
- ✅ Dodo Payments API Key
- ✅ Dodo Payments Webhook Secret
- ✅ Professional Plan Product ID from Dodo
- ✅ Advanced Plan Product ID from Dodo
- ✅ Your app's public URL (for webhooks)

## Integration Steps

### Step 1: Install Dependencies

```bash
npm install dodopayments express body-parser
```

### Step 2: Environment Variables

Create/update `.env` file:

```env
# Dodo Payments Configuration
DODO_PAYMENTS_API_KEY=your_api_key_here
DODO_WEBHOOK_SECRET=your_webhook_secret_here

# Product IDs from Dodo Dashboard
DODO_PRODUCT_ID_PRO=prod_subscription_monthly_pro
DODO_PRODUCT_ID_ADVANCED=prod_subscription_monthly_advanced

# App Configuration
VITE_APP_URL=https://your-app-url.com
```

### Step 3: Backend Architecture

#### File Structure to Create:
```
src/
├── services/
│   └── dodoPaymentService.ts       # Dodo API integration
├── pages/
│   └── api/
│       ├── checkout/
│       │   └── create-session.ts   # Create checkout sessions
│       ├── webhooks/
│       │   └── dodo.ts              # Handle webhooks
│       └── subscription/
│           ├── status.ts            # Check subscription status
│           └── cancel.ts            # Cancel subscription
└── components/
    └── subscription/
        ├── CheckoutButton.tsx       # Initiates checkout
        └── SubscriptionManager.tsx  # Manage subscription
```

### Step 4: Implementation Components

#### A. Dodo Payment Service (`src/services/dodoPaymentService.ts`)

This service handles all Dodo Payments API interactions:

**Key Functions:**
- `createCheckoutSession()`: Create a checkout session for subscription
- `retrieveSubscription()`: Get subscription details
- `cancelSubscription()`: Cancel a subscription
- `updateSubscriptionPlan()`: Change subscription plan

#### B. Checkout API Route (`src/pages/api/checkout/create-session.ts`)

**Flow:**
1. User clicks "Upgrade" button
2. Frontend calls this API with plan selection
3. API creates Dodo checkout session
4. Returns checkout URL
5. Frontend redirects user to Dodo checkout

#### C. Webhook Handler (`src/pages/api/webhooks/dodo.ts`)

**Handles Events:**
- `subscription.active`: Subscription activated → Update user tier
- `subscription.renewed`: Payment successful → Refresh credits
- `subscription.on_hold`: Payment failed → Pause features
- `subscription.failed`: Subscription creation failed → Notify user
- `payment.succeeded`: Payment processed → Log transaction
- `payment.failed`: Payment failed → Handle failure

**Security:**
- Verifies webhook signature
- Validates event authenticity
- Idempotent processing (handles duplicate events)

### Step 5: Frontend Integration

#### Update `SubscriptionPlans.tsx`:

```typescript
// Add checkout initiation
const handleUpgrade = async (planId: string) => {
  try {
    // Call your API to create checkout session
    const response = await fetch('/api/checkout/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId })
    });
    
    const { checkoutUrl } = await response.json();
    
    // Redirect to Dodo checkout
    window.location.href = checkoutUrl;
  } catch (error) {
    console.error('Checkout error:', error);
  }
};
```

#### Return URL Handling:

After successful payment, users return to your app:
```
https://your-app.com/subscription/success?session_id=xyz
```

Create success page to confirm subscription activation.

### Step 6: Webhook Configuration

1. **In Dodo Dashboard**:
   - Go to Settings > Webhooks
   - Add webhook endpoint: `https://your-app.com/api/webhooks/dodo`
   - Select events:
     - `subscription.active`
     - `subscription.renewed`
     - `subscription.on_hold`
     - `subscription.failed`
     - `payment.succeeded`
     - `payment.failed`

2. **Webhook Processing Flow**:
   ```
   Dodo → Your Webhook → Verify Signature → Process Event → Update Database
   ```

### Step 7: Database Updates

When webhook events arrive, update Supabase:

**For `subscription.active`:**
```sql
UPDATE profiles SET
  subscription_tier = 'pro', -- or 'advanced'
  ai_credits_remaining = 180, -- or 360
  ai_credits_monthly_limit = 180,
  subscription_start_date = NOW(),
  next_credit_reset_date = NOW() + INTERVAL '1 month',
  stripe_subscription_id = 'dodo_subscription_id',
  subscription_status = 'active'
WHERE id = user_id;
```

**For `subscription.renewed`:**
- Reset credits to monthly limit
- Update next reset date
- Log credit transaction

**For `subscription.on_hold`:**
- Set status to 'past_due'
- Optionally disable AI features

### Step 8: Subscription Management Features

#### Cancel Subscription:
```typescript
// User can cancel from account settings
const cancelSubscription = async () => {
  await fetch('/api/subscription/cancel', { method: 'POST' });
  // Subscription remains active until period end
};
```

#### Check Subscription Status:
```typescript
const checkStatus = async () => {
  const response = await fetch('/api/subscription/status');
  const { status, nextBillingDate } = await response.json();
};
```

## Testing Workflow

### Test Mode Flow:
1. **Create Test Checkout**:
   - Use test API keys from Dodo Dashboard
   - Create test subscription products
   - Test cards provided by Dodo

2. **Test Scenarios**:
   - ✅ Successful subscription signup
   - ✅ Failed payment (use test card)
   - ✅ Subscription renewal
   - ✅ Subscription cancellation
   - ✅ Plan upgrade/downgrade
   - ✅ Webhook delivery

3. **Verify Database**:
   - Check user profile updates
   - Verify credit allocation
   - Confirm transaction logs

## Production Checklist

- [ ] Switch to production API keys
- [ ] Update webhook URL to production domain
- [ ] Configure production subscription products
- [ ] Test end-to-end flow in production
- [ ] Set up monitoring for webhook failures
- [ ] Configure email notifications
- [ ] Add error logging (Sentry, etc.)
- [ ] Test subscription lifecycle events

## Security Best Practices

1. **API Key Security**:
   - Store in environment variables
   - Never expose in frontend code
   - Rotate keys periodically

2. **Webhook Security**:
   - Always verify webhook signatures
   - Use HTTPS for webhook endpoint
   - Implement idempotency keys

3. **User Data**:
   - Store only necessary payment data
   - Comply with PCI DSS requirements
   - Handle PII securely

## Error Handling

### Common Scenarios:

1. **Checkout Creation Fails**:
   - Show user-friendly error
   - Log error details
   - Provide retry option

2. **Webhook Processing Fails**:
   - Dodo retries automatically
   - Implement idempotency
   - Alert on repeated failures

3. **Payment Failure**:
   - Notify user via email
   - Show message in dashboard
   - Provide update payment method option

## Monitoring & Analytics

Track:
- Subscription conversion rate
- Failed payment rate
- Churn rate
- Average revenue per user (ARPU)
- Webhook processing times
- API response times

## Support & Resources

- **Dodo Payments Docs**: https://docs.dodopayments.com
- **Dodo Support**: support@dodopayments.com
- **API Status**: https://status.dodopayments.com

## Next Steps

1. Review this guide
2. Gather all prerequisites
3. Set up development environment
4. Implement step-by-step
5. Test thoroughly
6. Deploy to production

---

**Note**: This integration replaces references to "Stripe" in your current database schema with Dodo Payments equivalents. The column names (`stripe_customer_id`, `stripe_subscription_id`) can remain the same to avoid migrations, or can be renamed if preferred.

