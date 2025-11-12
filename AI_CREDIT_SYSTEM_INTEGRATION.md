# AI Credit System Integration Guide

## Overview

The AI Credit System tracks and manages AI API usage across the application. Each AI operation (BOQ generation, BOQ pricing, AI report generation) consumes 1 credit. Users have monthly credit allowances based on their subscription tier.

## Database Schema

### Migration File
`supabase/migrations/20250129_add_ai_credit_system.sql`

**Key Tables:**
- `profiles` - Extended with subscription and credit columns
- `subscription_plans` - Defines available tiers and pricing
- `ai_credit_transactions` - Audit log of all credit operations

**Key Functions:**
- `deduct_ai_credits()` - Deducts credits and logs transaction
- `allocate_ai_credits()` - Admin function to add credits
- `reset_monthly_credits()` - Automated monthly reset
- `update_subscription_tier()` - Handles subscription changes

## Subscription Tiers

| Tier | Price/Month | AI Credits | Features |
|------|-------------|------------|----------|
| Free | $0 | 9 | Basic features, 1 project |
| Pro | $18 | 180 | Unlimited projects, priority support |
| Advanced | $54 | 360 | All Pro + API access, collaboration |
| Enterprise | $108 | 1080 | All Advanced + white-label, SLA |

Super Admin: **Unlimited credits** (infinite)

## Frontend Integration

### 1. Service Layer (`src/services/aiCreditService.ts`)

**Core Functions:**

```typescript
import {
  getCreditBalance,
  hasEnoughCredits,
  deductAICredits,
  getCreditTransactions,
  getSubscriptionPlans,
  updateSubscriptionTier,
  allocateCredits // Admin only
} from '@/services/aiCreditService';

// Check balance
const balance = await getCreditBalance();
// Returns: { remaining, monthlyLimit, nextResetDate, subscriptionTier, isSuperAdmin }

// Check if user can afford operation
const canAfford = await hasEnoughCredits(1);

// Deduct credits
const result = await deductAICredits(
  projectId,
  'boq_generation', // or 'boq_pricing' or 'ai_report_generation'
  1,
  'Generate BOQ for Project X'
);
```

### 2. React Hook (`src/hooks/useAICredits.ts`)

**Usage in Components:**

```typescript
import { useAICredits } from '@/hooks/useAICredits';

const MyComponent = () => {
  const { balance, checkAndDeduct, hasCredits, loading } = useAICredits();

  const handleAIOperation = async () => {
    // Check and deduct credits before API call
    const canProceed = await checkAndDeduct(
      projectId,
      'boq_generation',
      'Generate BOQ'
    );

    if (!canProceed) {
      // User doesn't have credits - hook already shows toast
      return;
    }

    // Proceed with AI API call
    try {
      await generateBOQ();
    } catch (error) {
      // Handle error - consider refunding credit if API fails
    }
  };

  return (
    <div>
      {balance && (
        <p>Credits: {balance.remaining} / {balance.monthlyLimit}</p>
      )}
      <button onClick={handleAIOperation}>
        Generate BOQ (1 credit)
      </button>
    </div>
  );
};
```

### 3. UI Components

**Credit Balance Display:**
```typescript
import { AICreditBalance } from '@/components/ai-credits/AICreditBalance';

// Compact version for navbar/header
<AICreditBalance compact={true} />

// Full version for dashboard/settings
<AICreditBalance 
  showUpgradePrompt={true}
  onUpgradeClick={() => navigate('/subscription')}
/>
```

**Subscription Plans:**
```typescript
import { SubscriptionPlans } from '@/components/ai-credits/SubscriptionPlans';

<SubscriptionPlans 
  onSelectPlan={(planId) => handleUpgrade(planId)}
  showCurrentPlan={true}
/>
```

**Admin Panel:**
```typescript
import { AdminCreditAllocation } from '@/components/ai-credits/AdminCreditAllocation';

// Only renders for super admins
<AdminCreditAllocation />
```

## Integration Steps

### Step 1: Run Database Migration

```bash
# Apply the migration
supabase migration up

# Or if using Supabase CLI locally
supabase db reset
```

### Step 2: Update Existing AI Operation Components

#### Example: DetailedBOQGenerator Integration

**Before:**
```typescript
const handleGenerateBOQ = async () => {
  setGenerating(true);
  try {
    const response = await generateBOQWithAI(params);
    setBOQData(response);
  } catch (error) {
    toast.error('Generation failed');
  } finally {
    setGenerating(false);
  }
};
```

**After:**
```typescript
import { useAICredits } from '@/hooks/useAICredits';

const DetailedBOQGenerator = () => {
  const { checkAndDeduct } = useAICredits();
  
  const handleGenerateBOQ = async () => {
    // Check and deduct credits BEFORE API call
    const canProceed = await checkAndDeduct(
      projectId,
      'boq_generation',
      'Generate BOQ'
    );

    if (!canProceed) {
      return; // Hook shows appropriate toast
    }

    setGenerating(true);
    try {
      const response = await generateBOQWithAI(params);
      setBOQData(response);
      toast.success('BOQ generated successfully!');
    } catch (error) {
      toast.error('Generation failed');
      // TODO: Consider refunding credit on API failure
    } finally {
      setGenerating(false);
    }
  };
  
  return (
    <Button onClick={handleGenerateBOQ}>
      Generate BOQ (1 AI Credit)
    </Button>
  );
};
```

#### Example: BOQ Pricing Integration

```typescript
const handlePricingGeneration = async () => {
  const canProceed = await checkAndDeduct(
    projectId,
    'boq_pricing',
    'Generate BOQ Pricing'
  );

  if (!canProceed) return;

  // Proceed with pricing API call
  await generatePricing();
};
```

#### Example: AI Report Generation Integration

```typescript
const handleGenerateReport = async () => {
  const canProceed = await checkAndDeduct(
    projectId,
    'ai_report_generation',
    'Generate AI Feasibility Report'
  );

  if (!canProceed) return;

  // Proceed with report generation
  await generateReport();
};
```

### Step 3: Add Credit Display to Header/Navbar

```typescript
// In your main layout/header component
import { AICreditBalance } from '@/components/ai-credits/AICreditBalance';

<header>
  <nav>
    {/* Other nav items */}
    <AICreditBalance 
      compact={true}
      onUpgradeClick={() => navigate('/subscription')}
    />
  </nav>
</header>
```

### Step 4: Create Subscription Management Page

```typescript
// src/pages/Subscription.tsx
import { SubscriptionPlans } from '@/components/ai-credits/SubscriptionPlans';
import { AICreditBalance } from '@/components/ai-credits/AICreditBalance';

const SubscriptionPage = () => {
  const handleSelectPlan = async (planId: string) => {
    // Integrate with Stripe or payment processor
    // For now, just update the tier
    const result = await updateSubscriptionTier(planId);
    if (result.success) {
      toast.success('Subscription updated!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <AICreditBalance />
      <SubscriptionPlans onSelectPlan={handleSelectPlan} />
    </div>
  );
};
```

### Step 5: Add Admin Panel to Admin Dashboard

```typescript
// In your AdminDashboard.tsx
import { AdminCreditAllocation } from '@/components/ai-credits/AdminCreditAllocation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminDashboard = () => {
  return (
    <Tabs defaultValue="users">
      <TabsList>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="credits">AI Credits</TabsTrigger>
        <TabsTrigger value="components">Components</TabsTrigger>
      </TabsList>
      
      <TabsContent value="credits">
        <AdminCreditAllocation />
      </TabsContent>
      
      {/* Other tabs */}
    </Tabs>
  );
};
```

## Error Handling & Edge Cases

### 1. Insufficient Credits

The `checkAndDeduct` function automatically shows a toast:
```
"Insufficient AI Credits - You need 1 AI credit to Generate BOQ. 
You have 0 credits remaining. Please upgrade your plan or wait for monthly reset."
```

### 2. API Failure After Credit Deduction

**Option A: Manual Refund (Recommended)**
```typescript
const handleAIOperation = async () => {
  const canProceed = await checkAndDeduct(projectId, 'boq_generation', 'Generate BOQ');
  if (!canProceed) return;

  try {
    await generateBOQ();
  } catch (error) {
    // Refund the credit
    await allocateCredits(userId, 1, 'Refund - API failure');
    toast.error('Operation failed. Credit refunded.');
  }
};
```

**Option B: Optimistic Deduction**
```typescript
// Only deduct after successful API call
const result = await generateBOQ();
if (result.success) {
  await deductAICredits(projectId, 'boq_generation', 1);
}
```

### 3. Super Admin

Super admins have `isSuperAdmin: true` and bypass all credit checks:
- Balance shows as ∞ (infinity symbol)
- `hasEnoughCredits()` always returns true
- `deductAICredits()` logs transaction but doesn't deduct
- All operations proceed without restriction

### 4. Concurrent Operations

The database function uses row-level locking to prevent race conditions:
```sql
-- Atomic credit deduction
UPDATE profiles
SET ai_credits_remaining = ai_credits_remaining - p_credits_to_deduct
WHERE id = p_user_id;
```

## Monthly Credit Reset

### Automated Reset (Recommended)

Set up a Supabase Edge Function or cron job:

```typescript
// supabase/functions/reset-monthly-credits/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async () => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data, error } = await supabaseAdmin.rpc('reset_monthly_credits');

  return new Response(
    JSON.stringify({ reset_count: data, error }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

**Configure Cron:**
```toml
# supabase/config.toml
[functions.reset-monthly-credits]
cron = "0 0 * * *"  # Run daily at midnight
```

## Testing

### Test Super Admin

```sql
-- Make a user super admin
UPDATE profiles 
SET is_super_admin = true 
WHERE email = 'admin@example.com';
```

### Test Different Tiers

```sql
-- Upgrade user to Pro
SELECT update_subscription_tier(
  'user-uuid-here'::uuid,
  'pro'::text
);

-- Manually add credits
SELECT allocate_ai_credits(
  'user-uuid-here'::uuid,
  50,
  'admin-uuid-here'::uuid,
  'Test allocation'
);
```

### Test Credit Deduction

```typescript
// In your browser console
import { deductAICredits } from '@/services/aiCreditService';

await deductAICredits(null, 'boq_generation', 1, 'Test deduction');
```

## Future Enhancements

1. **Stripe Integration**
   - Add Stripe payment processing
   - Webhook handlers for subscription events
   - Automatic tier updates on payment success

2. **Credit Bundles**
   - Allow users to purchase additional credit packs
   - One-time purchases that don't expire

3. **Usage Analytics**
   - Dashboard showing credit usage over time
   - Most expensive operations
   - Predicted credit exhaustion date

4. **Credit Sharing**
   - Team/organization-level credit pools
   - Credit allocation between team members

5. **Rollover Credits**
   - Optional rollover of unused credits (limit 50%)
   - Premium feature for higher tiers

6. **API Rate Limiting**
   - Prevent abuse with per-minute rate limits
   - Additional protection beyond credit system

## Troubleshooting

### Credits not deducting

1. Check RLS policies are properly set
2. Verify function permissions
3. Check browser console for errors

### Monthly reset not working

1. Verify Edge Function is deployed
2. Check cron schedule configuration
3. Test function manually: `supabase functions invoke reset-monthly-credits`

### Admin can't allocate credits

1. Verify user has `is_super_admin = true`
2. Check RLS policies on `ai_credit_transactions`
3. Ensure service role key is configured

## Support

For issues or questions:
- Check database logs: `supabase logs`
- Review transaction history in `ai_credit_transactions` table
- Contact development team for assistance

---

**Last Updated:** January 29, 2025
**Version:** 1.0.0

