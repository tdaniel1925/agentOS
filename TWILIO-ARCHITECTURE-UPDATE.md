# Twilio Phone Number Architecture - Updated

**Date:** March 17, 2026
**Change:** Migrated from VAPI phone numbers to Twilio phone numbers with A2P compliance

---

## Architecture Change

### ❌ Old Architecture (Incorrect)
- VAPI phone numbers → Voice calls only
- One shared Twilio number → All SMS
- SMS not subscriber-specific

### ✅ New Architecture (Correct)
- **Twilio phone numbers** → Voice + SMS (both)
- Each subscriber gets **dedicated Twilio number**
- Voice calls forward to VAPI assistant
- SMS handled by Twilio webhook
- All numbers auto-associated with A2P campaign

---

## How It Works

### 1. Signup Flow

**When subscriber signs up:**

```typescript
// src/app/api/signup/claim-agent/route.ts

// 1. Create VAPI assistant (for AI voice)
const assistant = await createVapiAssistant({...})

// 2. Provision Twilio number (voice + SMS)
const provisionedNumber = await provisionSubscriberPhoneNumber({
  areaCode: '214',
  businessName: 'Joe\'s Pizza',
  subscriberId: 'sub_abc123',
  vapiAssistantId: assistant.id, // For voice forwarding
})

// Result:
// - Twilio number purchased: +12145551234
// - SMS webhook configured: /api/webhooks/twilio-sms
// - Voice webhook configured: /api/webhooks/voice/forward-to-vapi
// - Auto-associated with A2P campaign (SMS compliant)
```

### 2. Voice Call Flow

```
Customer calls +12145551234
     ↓
Twilio receives call
     ↓
Webhook: /api/webhooks/voice/forward-to-vapi
     ↓
Forwards to VAPI assistant (AI voice)
     ↓
VAPI handles conversation
     ↓
Call ends, summary saved
```

### 3. SMS Flow

```
Customer texts +12145551234
     ↓
Twilio receives SMS
     ↓
Webhook: /api/webhooks/twilio-sms
     ↓
Parse SMS command ("daily report", "call summary", etc.)
     ↓
Execute command
     ↓
Send SMS response FROM +12145551234
```

---

## Key Components

### Phone Provisioning

**File:** `src/lib/twilio/provisioning.ts`

```typescript
export async function provisionSubscriberPhoneNumber(options: {
  areaCode?: string
  businessName: string
  subscriberId: string
  vapiAssistantId?: string
}): Promise<ProvisionedNumber> {
  // 1. Search for available number
  const availableNumbers = await client.availablePhoneNumbers('US')
    .local.list({ areaCode, smsEnabled: true, voiceEnabled: true })

  // 2. Purchase number
  const purchasedNumber = await client.incomingPhoneNumbers.create({
    phoneNumber: availableNumbers[0].phoneNumber,
    friendlyName: `${businessName} - Jordyn AI`,
    smsUrl: '/api/webhooks/twilio-sms',
    voiceUrl: '/api/webhooks/voice/forward-to-vapi',
  })

  // 3. Auto-associate with A2P campaign
  await associateNumberWithA2P(purchasedNumber.sid)

  return {
    phoneNumber: purchasedNumber.phoneNumber,
    phoneNumberSid: purchasedNumber.sid,
  }
}
```

### A2P Association

**File:** `src/lib/twilio/a2p-helpers.ts`

```typescript
export async function associateNumberWithA2P(phoneNumberSid: string): Promise<void> {
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

  await client.messaging.v1
    .services(messagingServiceSid)
    .phoneNumbers
    .create({ phoneNumberSid })

  console.log('✅ Number associated with A2P campaign')
}
```

### SMS Sending

**File:** `src/lib/twilio/client.ts`

SMS automatically sends from subscriber's own number:

```typescript
// Signup welcome SMS
await sendSMS({
  to: '+12145556789', // Subscriber's business phone
  from: '+12145551234', // Subscriber's Jordyn number
  body: 'Welcome to Jordyn! Your AI receptionist is ready...'
})

// Outbound notifications
await sendSMS({
  to: customerPhone,
  from: subscriber.phone_number, // Always from subscriber's number
  body: 'Your appointment is confirmed for tomorrow at 2pm'
})
```

---

## Database Schema

### Subscriber Fields

```sql
-- Old fields (deprecated)
vapi_phone_number: TEXT        -- ❌ Remove
vapi_phone_number_id: TEXT     -- ❌ Remove

-- New fields (correct)
phone_number: TEXT              -- E.g., '+12145551234'
phone_number_sid: TEXT          -- Twilio SID: 'PNxxxxxxxxx'
vapi_assistant_id: TEXT         -- VAPI assistant for voice
phone_provisioned_at: TIMESTAMP -- When provisioned
```

### Migration

```sql
-- Rename columns
ALTER TABLE subscribers
  RENAME COLUMN vapi_phone_number TO phone_number;

ALTER TABLE subscribers
  RENAME COLUMN vapi_phone_number_id TO phone_number_sid;

-- Keep vapi_assistant_id (still needed for voice forwarding)
```

---

## Cost Analysis

### Per Subscriber Costs

| Item | Cost | Frequency |
|------|------|-----------|
| Twilio Phone Number | $1.00/month | Monthly |
| Incoming SMS | $0.0079/msg | Per message |
| Outgoing SMS | $0.0079/msg | Per message |
| Incoming Voice | $0.0085/min | Per minute |
| Outgoing Voice | $0.013/min | Per minute |
| VAPI Assistant | $0.00 | Free (runtime cost only) |

### A2P Costs (One-Time + Monthly)

| Item | Cost | Frequency |
|------|------|-----------|
| Brand Registration | $4 | One-time (already paid) |
| Campaign Registration | $10 | One-time (already paid) |
| Messaging Service | $2-10/month | Monthly (volume-based) |

### Trial Economics

**Per trial signup:**
```
Phone provisioning: $1.00 (first month)
Welcome SMS: $0.0079
Total cost: ~$1.01

50% conversion rate:
- Revenue: $97/month × 0.5 = $48.50
- Cost: $1.01
- Net profit: $47.49 per trial
```

**Still highly profitable!**

---

## Production Checklist

### Environment Variables

```env
# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxx  # A2P campaign (already set)
TWILIO_A2P_BRAND_SID=BNxxxxxxxxx          # A2P brand (already set)

# VAPI (for voice AI only)
VAPI_API_KEY=your_vapi_key
```

### Webhook Configuration

**Twilio Numbers** (auto-configured during provisioning):
- SMS: `https://jordyn.app/api/webhooks/twilio-sms`
- Voice: `https://jordyn.app/api/webhooks/voice/forward-to-vapi`
- Status: `https://jordyn.app/api/webhooks/twilio-status`

### New Numbers Auto-Associate

Every new Twilio number is automatically:
1. ✅ Purchased with SMS + Voice enabled
2. ✅ Webhooks configured
3. ✅ Associated with A2P campaign
4. ✅ Saved to subscriber record

**No manual A2P setup needed per-number!**

---

## Files Changed

### New Files
1. `src/lib/twilio/provisioning.ts` - Twilio number provisioning
2. `src/lib/twilio/a2p-helpers.ts` - A2P campaign helpers
3. `TWILIO-ARCHITECTURE-UPDATE.md` - This document

### Modified Files
1. `src/app/api/signup/claim-agent/route.ts`
   - Changed from `buyVapiPhoneNumber()` to `provisionSubscriberPhoneNumber()`
   - Added A2P auto-association
   - Updated field names

2. `src/app/api/subscribers/provision-phone/route.ts`
   - Manual provisioning now uses Twilio
   - Auto-associates with A2P campaign

3. `src/app/api/cron/cleanup-expired-trials/route.ts`
   - Release Twilio numbers instead of VAPI
   - Use `releasePhoneNumber()` from provisioning

4. `src/app/(dashboard)/app/page.tsx`
   - Updated to check `phone_number` field
   - Display Twilio number

5. `src/lib/twilio/client.ts`
   - Already updated to use messaging service SID
   - SMS automatically A2P compliant

---

## Testing

### Test Signup Flow

```bash
# 1. Sign up new subscriber
curl -X POST https://jordyn.app/api/signup/claim-agent \
  -H "Content-Type: application/json" \
  -d '{
    "assistant_id": "ast_123",
    "business_data": {
      "business_name": "Test Business",
      "business_phone": "+12145551234"
    }
  }'

# Expected result:
# - Twilio number provisioned
# - Number associated with A2P campaign
# - Welcome SMS sent from new number
# - Subscriber record updated with phone_number and phone_number_sid
```

### Test SMS Sending

```bash
# Check Twilio logs
https://console.twilio.com/us1/monitor/logs/sms

# Should show:
# - Messaging Service SID: MGxxxxxxxxx (A2P compliant)
# - From: subscriber's Twilio number
# - Status: delivered
```

### Test Voice Forwarding

```bash
# Call subscriber's Twilio number
# Should:
# 1. Hit Twilio
# 2. Forward to VAPI assistant
# 3. VAPI answers with AI voice
# 4. Conversation handled
```

---

## Migration Path (If Needed)

If you have existing subscribers with VAPI numbers:

```typescript
// Migration script (one-time)
async function migrateVapiToTwilio() {
  // 1. Get all subscribers with VAPI numbers
  const subscribers = await supabase
    .from('subscribers')
    .select('*')
    .not('vapi_phone_number', 'is', null)

  for (const sub of subscribers) {
    // 2. Provision new Twilio number
    const twilioNumber = await provisionSubscriberPhoneNumber({
      areaCode: extractAreaCode(sub.vapi_phone_number),
      businessName: sub.business_name,
      subscriberId: sub.id,
      vapiAssistantId: sub.vapi_assistant_id,
    })

    // 3. Update subscriber
    await supabase
      .from('subscribers')
      .update({
        phone_number: twilioNumber.phoneNumber,
        phone_number_sid: twilioNumber.phoneNumberSid,
      })
      .eq('id', sub.id)

    // 4. Release old VAPI number (optional)
    // await releaseVapiNumber(sub.vapi_phone_number_id)

    // 5. Notify subscriber of new number
    await sendSMS({
      to: sub.phone,
      from: twilioNumber.phoneNumber,
      body: `Your new Jordyn number: ${twilioNumber.phoneNumber}. All features active!`
    })
  }
}
```

---

## Benefits of New Architecture

### ✅ Advantages

1. **SMS Compliance**: Every number auto-associated with A2P campaign
2. **Dedicated Numbers**: Each subscriber has their own phone identity
3. **Unified Management**: All phone numbers in Twilio console
4. **Better Deliverability**: A2P-compliant SMS has higher delivery rates
5. **Cost Effective**: $1/month per subscriber for dedicated number
6. **Scalable**: No shared resources, each subscriber independent

### ⚠️ Considerations

1. **Cost**: $1/month per subscriber (vs. $0 before)
2. **Phone Inventory**: Need to ensure Twilio has numbers available
3. **Cleanup**: Must release numbers when trials expire (automated)

---

## Support & Troubleshooting

### Common Issues

**1. Number Provisioning Fails**
```
Error: No available numbers in area code 214
```
**Solution**: Provisioning automatically tries nearby area codes, then falls back to any US number

**2. A2P Association Fails**
```
Error: Number already associated with another service
```
**Solution**: Number might be in use elsewhere. Admin alert sent automatically.

**3. SMS Not Delivered**
```
Status: blocked
```
**Solution**: Check A2P campaign status at https://console.twilio.com/us1/develop/sms/services

### Debug Commands

```bash
# Check if number is in A2P campaign
curl https://api.twilio.com/2010-04-01/Accounts/{ACCOUNT_SID}/Messages/Services/{SERVICE_SID}/PhoneNumbers.json \
  -u {ACCOUNT_SID}:{AUTH_TOKEN}

# Test SMS from subscriber's number
curl -X POST https://api.twilio.com/2010-04-01/Accounts/{ACCOUNT_SID}/Messages.json \
  -u {ACCOUNT_SID}:{AUTH_TOKEN} \
  --data-urlencode "MessagingServiceSid=MGxxxxxxxxx" \
  --data-urlencode "To=+15551234567" \
  --data-urlencode "Body=Test from Jordyn"
```

---

## Conclusion

**Architecture updated successfully! ✅**

Each subscriber now gets:
- ✅ Dedicated Twilio phone number
- ✅ Voice + SMS capability
- ✅ A2P compliance (auto-configured)
- ✅ VAPI AI voice assistant
- ✅ Unique phone identity

All new signups will provision Twilio numbers automatically with A2P compliance built-in.
