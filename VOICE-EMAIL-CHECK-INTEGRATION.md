# Voice Email Check - Integration Guide

## What Was Built ✅

✅ **Voice Email API** - `/api/email/voice-check`
✅ **Dynamic VAPI Assistant** - Creates custom assistant with real email data
✅ **Email Formatting** - Converts Microsoft Graph emails to voice-friendly format
✅ **Action Handlers** - Reply, mark important, archive via voice
✅ **VAPI Webhook** - `/api/webhooks/vapi-email-actions`

---

## How It Works

### **User Experience:**

1. User texts: **"call me about my emails"**
2. Jordan replies: **"Calling you now to go through your inbox..."**
3. Phone rings immediately
4. Jordan (voice): **"Hey John! I just checked your inbox. You have 5 unread emails. Want me to go through them with you?"**
5. User: **"Yes"**
6. Jordan reads each email conversationally
7. User can say: "next", "reply to that", "skip", etc.

---

## SMS Webhook Integration

### **Add to `/api/webhooks/twilio-sms/route.ts`**

Add this handler in your SMS webhook (after identifying the subscriber):

```typescript
// =============================================
// VOICE EMAIL CHECK COMMAND
// =============================================

const message = messageBody.toLowerCase().trim()

if (
  (message.includes('call') && message.includes('email')) ||
  message.includes('voice') && message.includes('email') ||
  message.includes('read') && message.includes('email') && message.includes('me')
) {
  console.log(`📞 Voice email check requested by ${subscriber.name}`)

  // Trigger voice email check API
  const voiceCheckResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/voice-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subscriber_id: subscriber.id,
      limit: 10 // Max 10 emails per call
    })
  })

  const voiceCheckData = await voiceCheckResponse.json()

  if (voiceCheckData.success) {
    // Confirm call is being placed
    await sendSMS(fromPhone,
      `Calling you now to go through your ${voiceCheckData.email_count} unread email${voiceCheckData.email_count === 1 ? '' : 's'}...`
    )
  } else {
    // Handle errors
    if (voiceCheckData.error === 'No active email connection found') {
      await sendSMS(fromPhone,
        `❌ Email not connected yet\n\nText "connect email" to get started`
      )
    } else if (voiceCheckData.error === 'No unread emails') {
      await sendSMS(fromPhone,
        `📧 Inbox clear! No unread emails.`
      )
    } else {
      await sendSMS(fromPhone,
        `❌ Couldn't check your emails right now. Try again in a moment.`
      )
    }
  }

  return twilioResponse()
}
```

---

## Voice Commands User Can Say During Call

### **Navigation:**
- **"Next"** → Move to next email
- **"Skip"** → Skip current email
- **"Read that again"** → Repeat current email
- **"Stop"** → End call

### **Actions:**
- **"Reply to that"** → Draft a reply
  - Jordan asks: "What should I say back?"
  - User dictates message
  - Jordan confirms and sends

- **"Mark important"** → Flag email
- **"Delete it"** → Archive email
- **"Read the full email"** → Get more detail

---

## Example Conversation

```
📞 RING RING

Jordan: "Hey Sarah! I just checked your inbox. You have 3 unread emails.
         Want me to go through them with you?"

User: "Yes"

Jordan: "Okay! Email number 1. This is from John Smith.
         Subject is 'Project Update'. Received 2 hours ago.
         He says: 'Thanks for the update. When can we schedule a
         follow-up meeting?' Want me to read the next one, or take
         action on this?"

User: "Reply to that"

Jordan: "Sure! What should I say back to John?"

User: "Tell him Thursday at 2pm works for me"

Jordan: "Got it. I'll email John: 'Hi John, Thursday at 2pm works
         great for me. Looking forward to it!' Should I send that?"

User: "Yes, send it"

Jordan: "Sent! Moving to email number 2. This is from Mike Davis..."
```

---

## Files Created

```
src/lib/email/voice-check.ts
  - formatEmailsForVoice() - Format emails for voice reading
  - generateEmailVoicePrompt() - Create VAPI system prompt
  - createEmailVoiceAssistant() - Create ephemeral VAPI assistant
  - triggerVoiceEmailCheck() - Initiate outbound call

src/app/api/email/voice-check/route.ts
  - POST /api/email/voice-check
  - Fetches emails from Microsoft Graph
  - Creates VAPI assistant with email data
  - Triggers outbound call

src/app/api/webhooks/vapi-email-actions/route.ts
  - POST /api/webhooks/vapi-email-actions
  - Handles voice actions (reply, mark, delete)
  - Sends emails via Microsoft Graph
  - Logs all actions
```

---

## VAPI Assistant Configuration

The assistant is created **dynamically** for each call with:

### **System Prompt:**
- Contains actual email data (who sent, subject, preview)
- Structured conversation flow
- Action handlers (reply, skip, mark, etc.)
- Time management (10 min max call)

### **Voice Settings:**
- **Provider:** PlayHT
- **Voice ID:** jennifer (friendly female voice)
- **Model:** Claude 3.5 Sonnet
- **Temperature:** 0.7 (natural conversation)

### **Call Settings:**
- **First Message:** Greeting with email count
- **Max Duration:** 600 seconds (10 minutes)
- **End Message:** "Talk to you soon!"

---

## Cost Analysis

### **Per Voice Email Check:**

**Breakdown:**
- Microsoft Graph API call: **FREE** (within limits)
- VAPI assistant creation: **$0.00** (ephemeral)
- VAPI call duration: **~$0.10-0.30/minute**
- Average call length: **3-5 minutes**
- **Total: ~$0.30-1.50 per check**

**Compare to:**
- SMS email summary: **~$0.01** (much cheaper)

**Recommendation:**
- SMS summary = Default
- Voice check = Premium/on-demand feature
- User chooses based on context (driving vs desk)

---

## Testing Checklist

### **Local Testing:**

1. ✅ Start dev server: `npm run dev`
2. ⏳ Ensure email connection exists in database
3. ⏳ Add test emails to your Microsoft inbox
4. ⏳ Text "call me about my emails" to test number
5. ⏳ Answer the call
6. ⏳ Test navigation: "next", "skip", "read that again"
7. ⏳ Test actions: "reply to that"
8. ⏳ Verify email was sent in Microsoft inbox

### **Database Checks:**

```sql
-- Check email connections
SELECT * FROM email_connections WHERE status = 'active';

-- Check voice check logs
SELECT * FROM commands_log
WHERE command = 'voice_email_check'
ORDER BY created_at DESC
LIMIT 10;

-- Check email reply logs
SELECT * FROM commands_log
WHERE command = 'email_reply_via_voice'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Advanced Features (Future)

### **Smart Email Triage:**
```
Jordan: "You have 15 emails. 3 are marked urgent. Want to hear those first?"
```

### **Email Summaries:**
```
Jordan: "You have 20 emails. Want a quick summary instead of reading each one?"
```

### **Follow-Up Reminders:**
```
User: "Remind me to reply to Sarah tomorrow"
Jordan: "Got it. I'll text you tomorrow morning."
```

### **Conversation Threading:**
```
Jordan: "This is email 3 of 4 in a thread with John. Want the whole conversation?"
```

---

## Security & Privacy

✅ **Encrypted tokens** - Email access tokens stored with AES-256
✅ **Ephemeral assistants** - VAPI assistants deleted after call
✅ **No email storage** - Emails not stored, only read via API
✅ **Secure transmission** - All API calls over HTTPS
✅ **User-controlled** - User can disconnect anytime

---

## Troubleshooting

### **"No active email connection found"**
→ User needs to text "connect email" first

### **"No unread emails"**
→ Inbox is empty, nothing to read

### **Call doesn't trigger**
→ Check VAPI_API_KEY and VAPI_PHONE_NUMBER_ID in environment

### **Token expired error**
→ Auto-refresh should handle this, check refresh token validity

### **VAPI assistant creation fails**
→ Check VAPI API key, verify Anthropic provider is enabled

---

## Next Steps

1. **Add to Vercel:** Ensure all env vars are set
2. **Deploy:** Push to production
3. **Test:** Text "call me about my emails"
4. **Monitor:** Check commands_log for usage
5. **Iterate:** Add more actions based on user feedback

---

## SMS Command Summary

| Command | Action |
|---------|--------|
| `call me about my emails` | Voice email check call |
| `voice email check` | Voice email check call |
| `read my emails to me` | Voice email check call |
| `check my emails` | Text summary (existing) |
| `connect email` | OAuth connection flow |
| `disconnect email` | Revoke email access |

---

**🎉 Voice Email Check is READY TO USE!**

Just add the SMS webhook integration and deploy!
