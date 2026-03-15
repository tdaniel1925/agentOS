---
name: billing-gate
description: Checks subscriber's billing status before executing any command. Must be called first in every skill execution chain. Prevents unpaid subscribers from using the service.
disable-model-invocation: true
---

# Billing Gate Skill

## Purpose
Enforce payment requirements before executing any subscriber command.
Prevent service abuse from non-paying users.
Provide graceful degradation during payment issues.

## When To Call
**ALWAYS** - before executing ANY command from a subscriber.

Every skill must start with:
```typescript
const billingStatus = await checkBillingStatus(subscriberId)
if (billingStatus !== 'ACTIVE') {
  return billingStatus.message
}
// ... proceed with skill logic
```

## Implementation
Create utility function at: `/src/lib/billing/gate.ts`

## Check Order

### 1. Load subscriber from database
```sql
SELECT
  id,
  billing_status,
  stripe_subscription_id,
  current_mrr,
  status
FROM subscribers
WHERE id = [subscriber_id]
OR phone = [from_phone]
OR email = [from_email]
```

### 2. Check billing_status field
Primary source of truth for billing state.

### 3. Verify Stripe subscription (cached, refresh hourly)
Optional double-check against Stripe API for accuracy.
Cache result to avoid excessive API calls.

## Status Responses

### ACTIVE
**Condition:** `billing_status = 'active'` AND subscription current

**Action:** ✅ Proceed with command

**Response:** None (command executes normally)

---

### GRACE_PERIOD (1-3 days past due)
**Condition:** `billing_status = 'past_due'` AND < 3 days

**Action:** ⚠️ Bot operates normally with warning

**Response (append to skill output):**
```
Just a heads up — your payment is a few days past due.
Update here: app.theapexbots.com/billing
```

---

### SOFT_PAUSE (4-7 days past due)
**Condition:** `billing_status = 'past_due'` AND 4-7 days

**Action:** 🟡 Inbound calls only. No outbound actions.

**Response:**
```
I can still answer your calls but other features
are paused until your payment is updated:
app.theapexbots.com/billing
```

**Blocked actions:**
- Outbound calls
- Email campaigns
- Social media posts
- SMS outreach

**Allowed actions:**
- Answer inbound calls
- Respond to texts
- View dashboard

---

### HARD_PAUSE (7+ days past due)
**Condition:** `billing_status = 'past_due'` AND > 7 days

**Action:** 🔴 All features paused

**Response:**
```
Your account is paused due to non-payment.
Reactivate here: app.theapexbots.com/billing
```

**Blocked:** Everything except dashboard access

---

### CANCELLED
**Condition:** `billing_status = 'cancelled'` OR `status = 'cancelled'`

**Action:** ⛔ Account cancelled

**Response:**
```
Your account has been cancelled.
Reactivate anytime at theapexbots.com
```

**Blocked:** All features

---

## Implementation Example

```typescript
// /src/lib/billing/gate.ts

export type BillingGateResult =
  | { status: 'ACTIVE'; proceed: true }
  | { status: 'GRACE_PERIOD'; proceed: true; warning: string }
  | { status: 'SOFT_PAUSE'; proceed: false; message: string; allowInbound: true }
  | { status: 'HARD_PAUSE'; proceed: false; message: string }
  | { status: 'CANCELLED'; proceed: false; message: string }

export async function checkBillingStatus(
  subscriberId: string
): Promise<BillingGateResult> {
  const supabase = createServiceClient()

  const { data: subscriber } = await supabase
    .from('subscribers')
    .select('billing_status, status, updated_at')
    .eq('id', subscriberId)
    .single()

  if (!subscriber) {
    return {
      status: 'CANCELLED',
      proceed: false,
      message: 'Account not found.',
    }
  }

  // Check status
  if (subscriber.status === 'cancelled') {
    return {
      status: 'CANCELLED',
      proceed: false,
      message: 'Your account has been cancelled. Reactivate anytime at theapexbots.com',
    }
  }

  if (subscriber.billing_status === 'active') {
    return {
      status: 'ACTIVE',
      proceed: true,
    }
  }

  if (subscriber.billing_status === 'past_due') {
    // Calculate days past due
    const daysPastDue = calculateDaysPastDue(subscriber.updated_at)

    if (daysPastDue <= 3) {
      return {
        status: 'GRACE_PERIOD',
        proceed: true,
        warning: 'Just a heads up — your payment is a few days past due. Update here: app.theapexbots.com/billing',
      }
    } else if (daysPastDue <= 7) {
      return {
        status: 'SOFT_PAUSE',
        proceed: false,
        allowInbound: true,
        message: 'I can still answer your calls but other features are paused until your payment is updated: app.theapexbots.com/billing',
      }
    } else {
      return {
        status: 'HARD_PAUSE',
        proceed: false,
        message: 'Your account is paused due to non-payment. Reactivate here: app.theapexbots.com/billing',
      }
    }
  }

  // Default: deny
  return {
    status: 'HARD_PAUSE',
    proceed: false,
    message: 'Account access restricted. Contact support.',
  }
}

function calculateDaysPastDue(updatedAt: string): number {
  const now = new Date()
  const updated = new Date(updatedAt)
  const diffMs = now.getTime() - updated.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}
```

## Usage in Skills

```typescript
// Any skill that executes subscriber commands

import { checkBillingStatus } from '@/lib/billing/gate'

export async function executeSkill(subscriberId: string, command: string) {
  // ALWAYS check billing first
  const billingCheck = await checkBillingStatus(subscriberId)

  if (!billingCheck.proceed) {
    return { success: false, message: billingCheck.message }
  }

  // Append warning if in grace period
  let responseMessage = ''

  // ... execute skill logic ...

  if (billingCheck.status === 'GRACE_PERIOD') {
    responseMessage += `\n\n${billingCheck.warning}`
  }

  return { success: true, message: responseMessage }
}
```

## Security Notes
- NEVER expose billing status to unauthorized users
- NEVER bypass billing gate for "special" subscribers
- Log all billing-gated actions to `commands_log`
- Alert BotMakers if > 10% of commands are blocked by billing

## Monitoring
Track metrics:
- % of commands blocked by billing gate
- Average days to payment after grace period
- Churn rate at each pause level

## Future Enhancements
- Auto-retry failed payment methods
- SMS reminders before each pause level
- "Update payment" button in text response
- Temporary grace period for long-time customers
