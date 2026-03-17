# Twilio A2P Campaign Setup Guide

## What is A2P?

**A2P (Application-to-Person) messaging** is required by US carriers for all business SMS. Without A2P registration, your SMS messages will be blocked or heavily filtered.

## Jordyn Architecture

Jordyn uses a **hybrid approach** for telephony:

- **VAPI phone numbers** → Used ONLY for voice calls
- **Single Twilio number** → Used for ALL SMS messages
  - Configured via `TWILIO_PHONE_NUMBER` environment variable
  - All subscribers receive SMS from this shared number
  - This number must be A2P registered

## Prerequisites

Before running the setup script, ensure you have:

1. **Valid Twilio Account**
   - Account SID and Auth Token
   - SMS-capable phone number purchased
   - Account in good standing

2. **Business Information**
   - Legal business name
   - EIN (Tax ID)
   - Physical business address
   - Business website
   - Business contact email and phone

3. **Environment Variables Set**
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+12145551234
   ```

## Setup Process

### Step 1: Update Business Information

Edit `src/lib/twilio/a2p-registration.ts` and update the `setupJordynA2PCampaign` function with **real business information**:

```typescript
const brandSid = await registerBrand({
  businessName: 'BotMakers Inc',  // Real business name
  businessIndustry: 'TECHNOLOGY',
  businessWebsite: 'https://jordyn.app',  // Real website
  businessAddress: {
    street: '123 Main St',  // Real address
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94102',
    country: 'US',
  },
  businessContactEmail: 'support@jordyn.app',  // Real email
  businessContactPhone: '+15551234567',  // Real phone
  businessTaxId: '12-3456789',  // Real EIN
})
```

### Step 2: Run Setup Script

```bash
# Install tsx if not already installed
npm install -D tsx

# Run the setup script
npx tsx src/scripts/setup-a2p-campaign.ts
```

This script will:
1. Register your brand with Twilio
2. Create a Messaging Service with A2P use case
3. Associate your SMS phone number with the campaign
4. Output the SIDs you need to add to environment variables

### Step 3: Add Environment Variables

After the script completes, it will output two SIDs. Add them to your environment:

**Local development** (`.env.local`):
```env
TWILIO_A2P_BRAND_SID=BNxxxxxxxxx
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxx
```

**Production** (Vercel):
```bash
vercel env add TWILIO_A2P_BRAND_SID production
# Paste the BN... SID when prompted

vercel env add TWILIO_MESSAGING_SERVICE_SID production
# Paste the MG... SID when prompted
```

### Step 4: Wait for Approval

- Twilio will review your brand registration
- **Approval time**: 1-3 business days (typically)
- You'll receive an email when approved
- Monitor status: [Twilio Console → Messaging → Services](https://console.twilio.com/us1/develop/sms/services)

### Step 5: Verify Setup

Once approved, test SMS sending:

```typescript
import { sendSMS } from '@/lib/twilio/client'

await sendSMS({
  to: '+12145551234',
  body: 'Test message from Jordyn AI'
})
```

Check your server logs - you should see:
```
📱 Sending SMS via A2P messaging service MGxxxxxxxxx
```

## Message Compliance

Your SMS messages must follow these guidelines:

### ✅ Allowed Message Types

- **Appointment confirmations**: "Your appointment with {Business} is confirmed for tomorrow at 2pm"
- **Call summaries**: "Call summary: Spoke with John about insurance quote"
- **Welcome messages**: "Welcome to Jordyn! Your AI receptionist is ready"
- **Status updates**: "Your request has been processed"
- **Two-way conversations**: User texts commands, Jordyn responds

### ❌ Prohibited Content

- Marketing without explicit opt-in
- Unsolicited promotional messages
- Messages with misleading sender information
- Prohibited content (see [TCPA guidelines](https://www.twilio.com/docs/glossary/what-is-tcpa))

### Opt-Out Handling

All SMS must honor opt-out keywords:
- **STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT** → Unsubscribe user
- **START, YES, UNSTOP** → Re-subscribe user
- **HELP, INFO, SUPPORT** → Send help message

These are automatically configured in the campaign.

## Troubleshooting

### Brand Registration Failed

**Error**: `Brand registration failed: missing required field`

**Solution**: Ensure all business information is complete and accurate:
- Business name must match legal registration
- Address must be a physical location (not PO Box)
- EIN must be valid format (XX-XXXXXXX)

### Phone Number Not Found

**Error**: `Phone number +12145551234 not found in Twilio account`

**Solution**:
1. Verify the number in [Twilio Console → Phone Numbers](https://console.twilio.com/us1/develop/phone-numbers/manage/active)
2. Ensure `TWILIO_PHONE_NUMBER` matches exactly (including +1)
3. Number must be SMS-capable

### Campaign Pending

**Status**: Campaign created but not yet approved

**Action**:
- Wait 1-3 business days
- Check email for Twilio notifications
- Messages may be throttled until approved
- Low-volume testing is allowed during review

### Messages Still Blocked

**Issue**: SMS messages not being delivered even after approval

**Solutions**:
1. **Verify environment variable**:
   ```bash
   echo $TWILIO_MESSAGING_SERVICE_SID
   # Should output: MGxxxxxxxxx
   ```

2. **Check message logs**:
   - [Twilio Console → Monitor → Logs → Messages](https://console.twilio.com/us1/monitor/logs/sms)
   - Look for error codes and descriptions

3. **Verify carrier filtering**:
   - Some carriers have additional filters
   - Avoid spam trigger words
   - Include business name in messages
   - Honor opt-outs promptly

## Cost Estimate

A2P registration costs (one-time + monthly):

| Item | Cost | Frequency |
|------|------|-----------|
| Brand Registration | $4 | One-time |
| Campaign Registration | $10 | One-time |
| Campaign Fee (low volume) | $2-10/month | Monthly |
| SMS Messages | $0.0079/msg | Per message |

**Total first month**: ~$20-30
**Ongoing monthly**: ~$5-15 (depending on volume)

## Additional Resources

- [Twilio A2P 10DLC Overview](https://www.twilio.com/docs/messaging/guides/a2p-10dlc)
- [Brand Registration Guide](https://www.twilio.com/docs/messaging/guides/a2p-10dlc/brand-registration)
- [Campaign Creation Guide](https://www.twilio.com/docs/messaging/guides/a2p-10dlc/campaign-registration)
- [TCPA Compliance](https://www.twilio.com/docs/glossary/what-is-tcpa)
- [Twilio Support](https://support.twilio.com)

## Support

If you encounter issues:

1. Check Twilio Console for error messages
2. Review [Twilio's A2P documentation](https://www.twilio.com/docs/messaging/guides/a2p-10dlc)
3. Contact Twilio Support with your Brand SID and Campaign SID
4. For Jordyn-specific issues, contact: support@jordyn.app
