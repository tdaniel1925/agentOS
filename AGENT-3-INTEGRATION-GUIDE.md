# Phone Provisioning UI - Integration Guide

Quick guide for integrating the phone provisioning UI into your checkout flow.

---

## Step 1: After Successful Payment

In your Stripe checkout success handler, redirect to the onboarding page:

```typescript
// src/app/api/webhooks/stripe/route.ts (or wherever you handle checkout.session.completed)

if (event.type === 'checkout.session.completed') {
  const session = event.data.object
  const subscriberId = session.metadata.subscriber_id

  // After creating subscriber and subscription...

  // Redirect URL (return this to Stripe)
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/${subscriberId}`

  // Or if handling client-side:
  router.push(`/onboarding/${subscriberId}`)
}
```

---

## Step 2: Background Assistant Creation

The onboarding page expects `vapi_assistant_id` to be populated. You need a background job to create this after payment.

**Option A: Webhook Handler**
```typescript
// In your Stripe webhook handler, after subscription created:
import { createVAPIAssistant } from '@/lib/phone-numbers/provision'

const assistantId = await createVAPIAssistant(subscriberId, subscriberData)

await supabase
  .from('subscribers')
  .update({ vapi_assistant_id: assistantId })
  .eq('id', subscriberId)
```

**Option B: Supabase Edge Function**
Create a trigger that runs when a subscriber is created:
```sql
CREATE OR REPLACE FUNCTION create_vapi_assistant_for_new_subscriber()
RETURNS TRIGGER AS $$
BEGIN
  -- Call your Edge Function to create VAPI assistant
  PERFORM http_post(
    'https://your-project.supabase.co/functions/v1/create-assistant',
    json_build_object('subscriber_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_subscriber_created
AFTER INSERT ON subscribers
FOR EACH ROW
EXECUTE FUNCTION create_vapi_assistant_for_new_subscriber();
```

**Option C: Immediate (Not Recommended - Slow)**
Create assistant immediately in checkout flow (adds 30-60 seconds to checkout)

---

## Step 3: Database Setup

Ensure these tables exist:

```sql
-- subscribers table needs:
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS vapi_assistant_id TEXT;

-- subscriber_phone_numbers table (should already exist)
CREATE TABLE IF NOT EXISTS subscriber_phone_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscriber_id UUID REFERENCES subscribers(id),
  phone_number TEXT NOT NULL,
  phone_number_id TEXT NOT NULL, -- VAPI phone number ID
  twilio_sid TEXT NOT NULL,
  provider TEXT DEFAULT 'twilio',
  number_type TEXT DEFAULT 'local',
  area_code TEXT,
  vapi_assistant_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Step 4: Test the Flow

1. **Create a test subscriber:**
```bash
curl -X POST http://localhost:3000/api/test/create-subscriber \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "stripe_subscription_status": "active"
  }'
```

2. **Navigate to onboarding:**
```
http://localhost:3000/onboarding/[subscriber_id]
```

3. **Expected behavior:**
   - Shows "Setting Up Jordan..." with progress bar
   - Polls every 3 seconds for vapi_assistant_id
   - Once detected, shows "Get Your Business Number"
   - User enters ZIP, searches, selects number
   - Charges $15, provisions number
   - Shows success screen
   - Redirects to /dashboard

---

## Step 5: Environment Variables

Ensure these are set (should already be configured):

```env
# Required for phone provisioning
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
VAPI_API_KEY=xxxx
STRIPE_SECRET_KEY=sk_test_xxxx
NEXT_PUBLIC_APP_URL=https://theapexbots.com

# Optional
VAPI_WEBHOOK_SECRET=xxxx (for webhook signature verification)
```

---

## Common Issues

### Issue: "Provisioning is taking longer than expected"
**Cause**: VAPI assistant creation timeout (>5 minutes)
**Fix**: Check VAPI API status, verify API key, check logs

### Issue: "Payment failed"
**Cause**: No payment method on file, card declined
**Fix**: Ensure Stripe customer has valid payment method

### Issue: "No available numbers found"
**Cause**: ZIP code not in mapping, or area code exhausted
**Fix**: Expand ZIP-to-area-code mapping in `getAreaCodeFromZip()`

### Issue: Page shows loading forever
**Cause**: vapi_assistant_id never gets populated
**Fix**: Check background job is running, verify Supabase RLS policies

---

## Monitoring

Watch these tables for issues:

```sql
-- Check if assistant was created
SELECT id, email, vapi_assistant_id, created_at
FROM subscribers
WHERE vapi_assistant_id IS NULL AND created_at > NOW() - INTERVAL '1 hour';

-- Check provisioning attempts
SELECT * FROM commands_log
WHERE skill_triggered = 'phone_number_provisioned'
ORDER BY created_at DESC LIMIT 10;

-- Check setup fee charges
SELECT * FROM cost_events
WHERE event_type = 'phone_setup_fee'
ORDER BY created_at DESC LIMIT 10;

-- Check for errors
SELECT * FROM error_log
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

## Production Checklist

Before going live:

- [ ] Test full flow on staging with real Stripe test card
- [ ] Verify VAPI assistant creation works (check logs)
- [ ] Verify Twilio number purchase works (use test numbers)
- [ ] Test payment failure handling (use Stripe test cards)
- [ ] Test timeout scenario (mock slow VAPI response)
- [ ] Verify mobile responsive on real devices
- [ ] Check all error messages are user-friendly
- [ ] Verify $15 charge appears in Stripe dashboard
- [ ] Confirm SMS confirmation is sent after provisioning
- [ ] Test "Go to Dashboard" redirect works

---

## Support

If issues arise:

1. Check `commands_log` table for provisioning events
2. Check `error_log` table for exceptions
3. Check browser console for client-side errors
4. Verify Supabase RLS policies allow subscriber access
5. Check VAPI API logs for assistant creation failures
6. Verify Twilio account has available numbers in target area codes

---

## Quick Reference

**Route**: `/onboarding/[id]`

**API Endpoints**:
- `GET /api/subscribers/[id]` - Fetch subscriber status
- `GET /api/phone-numbers/search?zipCode=94102` - Search numbers
- `POST /api/phone-numbers/provision` - Provision number ($15)

**Components**:
- `ProvisioningProgress` - Shows progress bar during assistant creation
- `NumberChooser` - ZIP code input + number selection
- `ProvisioningComplete` - Success screen

**State Flow**:
loading → provisioning → choose_number → complete → /dashboard
