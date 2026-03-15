---
name: onboard
description: Deploys a new subscriber's bot after payment. Fires automatically when checkout.session.completed webhook received. Creates VAPI assistant, provisions phone number, sends welcome SMS.
disable-model-invocation: true
---

# Onboard Skill

## Trigger
Called by Stripe webhook handler after successful payment (checkout.session.completed event).

## Purpose
Automatically provisions and deploys a subscriber's AI bot within 5 minutes of payment.

## Implementation
Located at: `/src/app/api/onboard/route.ts`

## Steps

### 1. Load subscriber data
Read subscriber record from Supabase.
Get: name, business_name, business_type, bot_name, phone, email.

### 2. Select industry pack
Map business_type to system prompt template:
- `insurance` → INSURANCE_SYSTEM_PROMPT
- `cpa` → CPA_SYSTEM_PROMPT
- `law` → LAW_SYSTEM_PROMPT
- `realestate` → REALESTATE_SYSTEM_PROMPT
- `other` → GENERIC_SYSTEM_PROMPT

Industry prompts defined in: `/src/lib/vapi/assistants.ts`

### 3. Create VAPI assistant
POST to `https://api.vapi.ai/assistant`

Body:
```json
{
  "name": "[bot_name]-[subscriber_id]",
  "model": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514",
    "systemPrompt": "[industry_pack_prompt]"
  },
  "voice": {
    "provider": "playht",
    "voiceId": "jennifer"
  },
  "firstMessage": "Thank you for calling [business_name]. This is [bot_name]. How can I help you today?",
  "recordingEnabled": true,
  "transcriber": {
    "provider": "deepgram",
    "model": "nova-2"
  }
}
```

Save assistant ID to `subscribers.vapi_assistant_id`.

### 4. Provision phone number
POST to `https://api.vapi.ai/phone-number/buy`

Try to buy a local number near subscriber's area code.
If unavailable, buy any available number.

Save phone number and ID to:
- `subscribers.vapi_phone_number`
- `subscribers.vapi_phone_number_id`

### 5. Create control state
Insert default control_states record:
```sql
INSERT INTO control_states (
  subscriber_id,
  outbound_calls_enabled,
  social_posting_enabled,
  email_sending_enabled,
  campaigns_enabled
) VALUES (
  [subscriber_id],
  true,
  true,
  true,
  true
)
```

### 6. Send welcome SMS
Via Twilio from control number (TWILIO_PHONE_NUMBER) to subscriber's phone:

```
Welcome to AgentOS! I'm [bot_name], your new AI employee.

Your new business number: [vapi_number]
Share it with clients or forward your existing number.

Text me anytime to give me instructions.
Try: "What can you do?"

Your first weekly report arrives Monday morning.
— [bot_name] 🤖
```

### 7. Send welcome email
Use welcome email template from `/src/lib/resend/templates.ts`

Includes:
- VAPI phone number
- Control SMS number
- Link to dashboard
- Getting started instructions

### 8. Update subscriber status
```sql
UPDATE subscribers
SET status = 'active',
    onboarded_at = NOW()
WHERE id = [subscriber_id]
```

## Error Handling

### If VAPI assistant creation fails:
- Retry 3x with exponential backoff (1s, 2s, 4s)
- If still failing:
  - Set `status = 'onboard_failed'`
  - SMS subscriber: "Setting up [bot_name] — taking a bit longer. Ready in ~30 min."
  - Alert BotMakers team (TODO: implement alert)

### If phone number provisioning fails:
- Try alternate area code
- Try without area code preference
- If still failing:
  - Use shared test number temporarily (TODO: implement)
  - Alert BotMakers to resolve manually

## Success Criteria
1. VAPI assistant created
2. Phone number provisioned
3. Control state initialized
4. Welcome SMS delivered
5. Welcome email delivered
6. Subscriber status = 'active'
7. Total time < 5 minutes

## Dependencies
- VAPI API (assistant + phone)
- Twilio (SMS)
- Resend (Email)
- Supabase (database)

## Cost Per Execution
- VAPI assistant: $0 (pay per minute of calls)
- VAPI phone number: ~$1.00/month
- Twilio SMS: ~$0.0075
- Resend email: ~$0.001
- **Total one-time**: ~$0.01
- **Recurring**: ~$1.00/month

## Monitoring
Log all steps to `task_performance` table.
Track duration and success rate.
Alert if success rate < 95%.
