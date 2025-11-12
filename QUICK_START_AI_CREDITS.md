# AI Credits System - Quick Start Guide

## 🎉 Installation Complete!

The AI Credits Management System has been successfully installed in your Solar Finance Toolkit app.

---

## 📋 What Was Added

### 1. Database Changes (✅ Applied via Migration)
- **New columns in `profiles` table**:
  - `subscription_tier` - User's subscription plan (free/pro/advanced/enterprise)
  - `ai_credits_remaining` - Current credit balance
  - `ai_credits_monthly_limit` - Monthly credit allowance
  - `is_super_admin` - Super admin flag (unlimited credits)
  - `subscription_start_date` - When subscription started
  - `next_credit_reset_date` - Next monthly reset date
  - `stripe_customer_id` & `stripe_subscription_id` - For payment integration
  - `subscription_status` - active/canceled/past_due/paused

- **New tables**:
  - `subscription_plans` - Defines available subscription tiers
  - `ai_credit_transactions` - Audit trail of all credit usage

- **Database functions**:
  - `deduct_ai_credits()` - Deduct credits with validation
  - `allocate_ai_credits()` - Admin credit allocation
  - `reset_monthly_credits()` - Automated monthly reset
  - `update_subscription_tier()` - Handle upgrades/downgrades

### 2. New Components Added
- **`src/components/ai-credits/AdminCreditAllocation.tsx`** - Admin panel for credit management
- **`src/components/ai-credits/AICreditBalance.tsx`** - User credit balance display
- **`src/components/ai-credits/SubscriptionPlans.tsx`** - Subscription plan selector

### 3. New Services
- **`src/services/aiCreditService.ts`** - Core credit management logic
- **`src/hooks/useAICredits.ts`** - React hook for credit operations

### 4. Admin Dashboard Updated
- Added new "AI Credits" tab to your existing Admin Dashboard
- Now checks `is_super_admin` field from database instead of hardcoded email

---

## 🚀 Quick Start Steps

### Step 1: Set Your Account as Super Admin

Run this SQL in your **Supabase SQL Editor**:

```sql
-- Open Supabase Dashboard → SQL Editor → New Query
-- Copy and paste this:

UPDATE profiles 
SET 
  is_super_admin = TRUE,
  subscription_tier = 'enterprise',
  ai_credits_remaining = 999999,
  ai_credits_monthly_limit = 999999
WHERE email = 'amrit.mandal0191@gmail.com';
```

Or simply run the file we created:
```bash
# From Supabase SQL Editor, run:
supabase/set_super_admin.sql
```

### Step 2: Verify Installation

1. **Login to your app** with your admin account
2. **Navigate to Admin Dashboard** (`/admin`)
3. You should see a new **"AI Credits"** tab
4. Click on it to see the credit management interface

### Step 3: Test Credit System

1. **Create a test user** (or use an existing non-admin user)
2. **In Admin Dashboard → AI Credits tab**:
   - Search for the test user
   - Allocate some credits (e.g., 50 credits)
   - Verify the transaction appears in the history

---

## 💡 Subscription Plans

| Plan | Monthly Cost | AI Credits | Features |
|------|--------------|------------|----------|
| **Free** | $0 | 9 | Basic tools, single project |
| **Professional** | $18 | 180 | Unlimited projects, AI BOQ, priority support |
| **Advanced** | $54 | 360 | Everything in Pro + API access, collaboration |
| **Enterprise** | $108 | 1,080 | White-label, custom integrations, SLA |
| **Super Admin** | - | ∞ Unlimited | Full system access |

---

## 🎯 Credit Deduction Costs

Currently configured:
- **BOQ Generation**: 2 credits
- **BOQ Pricing**: 3 credits  
- **AI Report Generation**: 5 credits

You can adjust these in `src/services/aiCreditService.ts`.

---

## 🔧 How to Use in Your App

### Display User's Credit Balance

Add this to any component where you want to show the user's credits:

```tsx
import { AICreditBalance } from '@/components/ai-credits/AICreditBalance';

// In your component:
<AICreditBalance />

// Or compact version:
<AICreditBalance compact />
```

### Check Credits Before AI Operations

Already integrated in:
- **BOQ Generation** (`DetailedBOQGenerator.tsx`)
- **BOQ Pricing** (`DetailedBOQGenerator.tsx`)
- **AI Report Generation** (`AIFeasibilityReport.tsx`)

Example usage:
```tsx
import { useAICredits } from '@/hooks/useAICredits';

function MyComponent() {
  const { checkAndDeduct, hasCredits } = useAICredits();

  const handleAIOperation = async () => {
    // Check if user has enough credits
    const canProceed = await hasCredits(5); // Requires 5 credits
    
    if (!canProceed) {
      toast.error("Insufficient AI credits");
      return;
    }

    try {
      // Do your AI operation
      const result = await generateAIContent();
      
      // Deduct credits on success
      const success = await checkAndDeduct(
        projectId,
        'ai_report_generation',
        'Generated AI Feasibility Report'
      );
      
      if (!success) {
        console.error("Failed to deduct credits");
      }
    } catch (error) {
      console.error("AI operation failed:", error);
    }
  };

  return (
    <Button onClick={handleAIOperation}>Generate with AI</Button>
  );
}
```

---

## 👨‍💼 Admin Features

### In Admin Dashboard → AI Credits Tab:

1. **View All Users**
   - See credit balances
   - Filter by name or email
   - View subscription tiers

2. **Allocate Credits**
   - Select a user
   - Enter number of credits to add
   - Add optional description
   - Submit

3. **View Transaction History**
   - See all credit usage
   - Filter by user or operation type
   - Audit trail with timestamps

4. **User Stats**
   - Total users by tier
   - Credit usage metrics
   - Recent transactions

---

## 🔐 Row Level Security (RLS)

Already configured:
- Users can view their own credit balance
- Users can view their own transactions
- Super admins can view all users' data
- Credit deduction is handled by secure database functions

---

## 🔄 Monthly Credit Reset

The system automatically resets credits monthly:

```sql
-- Run this monthly (can be automated with Supabase Edge Function)
SELECT reset_monthly_credits();
```

To automate:
1. Go to Supabase Dashboard
2. Navigate to Database → Functions
3. Create a new Edge Function to call `reset_monthly_credits()` on a schedule

---

## 📊 Credit Transaction Log

Every credit operation is logged in `ai_credit_transactions`:
- User ID
- Project ID (if applicable)
- Operation type (BOQ generation, pricing, etc.)
- Credits amount
- Balance before/after
- Timestamp
- Description

View in Admin Dashboard → AI Credits tab → Transaction History.

---

## 🎨 Customization

### Change Credit Costs

Edit `src/services/aiCreditService.ts`:

```typescript
const CREDIT_COSTS = {
  boq_generation: 2,     // Change to your preferred cost
  boq_pricing: 3,        // Change to your preferred cost
  ai_report_generation: 5 // Change to your preferred cost
};
```

### Modify Subscription Plans

Update plans in database:

```sql
UPDATE subscription_plans 
SET 
  price_monthly = 25.00,
  ai_credits_monthly = 250
WHERE id = 'pro';
```

Or add new plans:

```sql
INSERT INTO subscription_plans (id, name, display_name, price_monthly, ai_credits_monthly, features)
VALUES (
  'custom',
  'Custom',
  'Custom Plan',
  99.00,
  500,
  '["Custom feature 1", "Custom feature 2"]'::jsonb
);
```

---

## 🐛 Troubleshooting

### Issue: "Insufficient AI credits" but I just allocated credits

**Solution**: Refresh the page or check the transaction log to verify the allocation.

### Issue: Super admin still being deducted credits

**Solution**: Verify `is_super_admin = TRUE` in profiles table:

```sql
SELECT id, email, is_super_admin 
FROM profiles 
WHERE email = 'your-email@example.com';
```

### Issue: Monthly reset not working

**Solution**: Check `next_credit_reset_date` field and manually run:

```sql
SELECT reset_monthly_credits();
```

---

## 📱 Next Steps

### 1. Add Stripe Payment Integration (Optional)
- Add Stripe Checkout for subscription upgrades
- Handle webhooks for subscription events
- Update `stripe_customer_id` and `stripe_subscription_id`

### 2. Add Credit Purchase Option
- Allow users to buy additional credits
- One-time purchase separate from subscription

### 3. Add Email Notifications
- Low credit warnings
- Monthly reset notifications
- Subscription expiry alerts

### 4. Analytics Dashboard
- Total credits consumed
- Most popular features
- Revenue tracking

---

## 🎓 Key Files to Know

| File | Purpose |
|------|---------|
| `src/services/aiCreditService.ts` | Core credit logic |
| `src/hooks/useAICredits.ts` | React hook for components |
| `src/components/ai-credits/AdminCreditAllocation.tsx` | Admin management UI |
| `src/components/ai-credits/AICreditBalance.tsx` | User balance display |
| `supabase/migrations/20250129_add_ai_credit_system.sql` | Database schema |
| `supabase/set_super_admin.sql` | Make yourself admin |

---

## 💬 Support

For any issues or questions:
1. Check the transaction log in Admin Dashboard
2. Review browser console for errors
3. Check Supabase logs for database errors

---

## ✅ Checklist

- [x] Migration applied successfully
- [ ] Set super admin status (run `set_super_admin.sql`)
- [ ] Verify Admin Dashboard shows AI Credits tab
- [ ] Test allocating credits to a user
- [ ] Test AI operations deduct credits correctly
- [ ] (Optional) Set up Stripe integration
- [ ] (Optional) Set up automated monthly reset

---

**Your AI Credits system is ready to use! 🎉**

Start by running the `set_super_admin.sql` script to give yourself unlimited credits and admin access.
