# Email SMS Commands - User Guide

## Commands Users Can Text

### **Connect Email**
```
"connect my email"
"connect email"
"add my email"
"link my outlook"
```

**Response:**
```
Tap here to connect your Microsoft email (expires in 15 min):
https://theapexbots.com/api/auth/microsoft/connect?token=abc123
```

---

### **Check Email Status**
```
"is my email connected"
"email status"
"check email connection"
```

**Response (if connected):**
```
✅ Email connected: your.email@outlook.com
Last checked: 2 hours ago
Status: Active
```

**Response (if not connected):**
```
❌ No email connected yet
Text "connect email" to get started
```

---

### **Disconnect Email**
```
"disconnect email"
"disconnect my email"
"remove email"
"unlink email"
```

**Response:**
```
✅ Email disconnected
Your Microsoft account has been unlinked from Jordan.
Text "connect email" anytime to reconnect.
```

---

### **Read Emails**
```
"check my email"
"what's in my inbox"
"any new emails"
"read my emails"
```

**Response (if emails found):**
```
📧 You have 3 unread emails:

1. John Smith - "Re: Project Update"
   2 hours ago
   "Thanks for the update. When can we..."

2. Sarah Johnson - "Meeting Tomorrow"
   5 hours ago
   "Just confirming our 2pm meeting..."

3. Mike Davis - "Quote Request"
   1 day ago
   "Could you send me a quote for..."

Reply with email # to read full message
```

**Response (if inbox empty):**
```
📧 Inbox clear! No unread emails.
```

**Response (if not connected):**
```
❌ Email not connected yet
Text "connect email" to get started
```

---

## SMS Handler Integration

### **Add to Twilio SMS Webhook**

Update your `/api/webhooks/twilio-sms/route.ts`:

```typescript
// =============================================
// EMAIL COMMANDS
// =============================================

const message = messageBody.toLowerCase().trim()

// CONNECT EMAIL
if (message.includes('connect') && message.includes('email')) {

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex')

  // Store token (maps to subscriber)
  await (supabase as any)
    .from('email_connection_tokens')
    .insert({
      token: token,
      subscriber_id: subscriber.id,
      provider: 'outlook',
      expires_at: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    })

  // Generate connection link
  const connectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/connect?token=${token}`

  // Send SMS with link
  await sendSMS(fromPhone,
    `Tap here to connect your Microsoft email (expires in 15 min):\n\n${connectUrl}`
  )

  return twilioResponse()
}

// CHECK EMAIL STATUS
if (
  (message.includes('email') && message.includes('status')) ||
  (message.includes('email') && message.includes('connected'))
) {

  const connectionResult: any = await (supabase as any)
    .from('email_connections')
    .select('email_address, last_sync_at, status')
    .eq('subscriber_id', subscriber.id)
    .eq('status', 'active')
    .single()

  if (connectionResult.data) {
    const conn = connectionResult.data
    const lastSync = conn.last_sync_at
      ? new Date(conn.last_sync_at).toLocaleString()
      : 'Never'

    await sendSMS(fromPhone,
      `✅ Email connected: ${conn.email_address}\nLast checked: ${lastSync}\nStatus: Active`
    )
  } else {
    await sendSMS(fromPhone,
      `❌ No email connected yet\nText "connect email" to get started`
    )
  }

  return twilioResponse()
}

// DISCONNECT EMAIL
if (message.includes('disconnect') && message.includes('email')) {

  const result: any = await (supabase as any)
    .from('email_connections')
    .update({
      status: 'revoked',
      updated_at: new Date().toISOString()
    })
    .eq('subscriber_id', subscriber.id)
    .eq('status', 'active')
    .select()

  const disconnected = result.data?.length || 0

  if (disconnected > 0) {
    await sendSMS(fromPhone,
      `✅ Email disconnected\n\nYour Microsoft account has been unlinked from Jordan.\n\nText "connect email" anytime to reconnect.`
    )
  } else {
    await sendSMS(fromPhone,
      `No email account was connected.`
    )
  }

  return twilioResponse()
}

// CHECK EMAILS (read inbox)
if (
  message.includes('check') && message.includes('email') ||
  message.includes('inbox') ||
  message.includes('read') && message.includes('email')
) {

  // Get active email connection
  const connectionResult: any = await (supabase as any)
    .from('email_connections')
    .select('*')
    .eq('subscriber_id', subscriber.id)
    .eq('provider', 'outlook')
    .eq('status', 'active')
    .single()

  if (!connectionResult.data) {
    await sendSMS(fromPhone,
      `❌ Email not connected yet\nText "connect email" to get started`
    )
    return twilioResponse()
  }

  const connection = connectionResult.data

  // Check if token needs refresh
  let accessToken = decryptToken(connection.encrypted_access_token)

  if (new Date(connection.token_expires_at) < new Date()) {
    // Token expired - refresh it
    const refreshToken = decryptToken(connection.encrypted_refresh_token)
    const newTokens = await refreshMicrosoftToken(refreshToken)

    // Update database
    await (supabase as any)
      .from('email_connections')
      .update({
        encrypted_access_token: encryptToken(newTokens.access_token),
        encrypted_refresh_token: encryptToken(newTokens.refresh_token),
        token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
      })
      .eq('id', connection.id)

    accessToken = newTokens.access_token
  }

  // Fetch unread emails
  const emails = await getMicrosoftUnreadEmails(accessToken, 5)

  if (emails.length === 0) {
    await sendSMS(fromPhone,
      `📧 Inbox clear! No unread emails.`
    )
    return twilioResponse()
  }

  // Format email summary
  let summary = `📧 You have ${emails.length} unread email${emails.length > 1 ? 's' : ''}:\n\n`

  emails.forEach((email: any, index: number) => {
    const from = email.from?.emailAddress?.name || email.from?.emailAddress?.address || 'Unknown'
    const subject = email.subject || '(no subject)'
    const preview = email.bodyPreview?.substring(0, 50) || ''

    summary += `${index + 1}. ${from} - "${subject}"\n`
    if (preview) {
      summary += `   ${preview}...\n`
    }
    summary += '\n'
  })

  await sendSMS(fromPhone, summary)

  // Update last sync time
  await (supabase as any)
    .from('email_connections')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', connection.id)

  return twilioResponse()
}
```

---

## Required Imports

Add these to your Twilio webhook file:

```typescript
import {
  getMicrosoftUnreadEmails,
  refreshMicrosoftToken,
  encryptToken,
  decryptToken
} from '@/lib/email/microsoft'
import crypto from 'crypto'
```

---

## Security Features

✅ **15-minute link expiration** - Connection links auto-expire
✅ **One-time use tokens** - Can't reuse connection links
✅ **Instant revocation** - Disconnect command immediately revokes access
✅ **Encrypted storage** - Tokens stored with AES-256 encryption
✅ **Auto token refresh** - Users stay connected indefinitely
✅ **Status tracking** - Always know connection state

---

## Database Queries for Monitoring

### **See all connected emails:**
```sql
SELECT
  s.name,
  s.email as subscriber_email,
  ec.email_address as connected_email,
  ec.provider,
  ec.status,
  ec.last_sync_at,
  ec.created_at
FROM email_connections ec
JOIN subscribers s ON ec.subscriber_id = s.id
WHERE ec.status = 'active'
ORDER BY ec.created_at DESC;
```

### **See recent connection attempts:**
```sql
SELECT
  token,
  provider,
  status,
  created_at,
  expires_at,
  completed_at
FROM email_connection_tokens
ORDER BY created_at DESC
LIMIT 20;
```

### **Count active connections:**
```sql
SELECT
  provider,
  COUNT(*) as total
FROM email_connections
WHERE status = 'active'
GROUP BY provider;
```

---

## User Education Messages

When users first sign up, send:

```
👋 Welcome to AgentOS!

Jordan can check your emails for you.
Text "connect email" to link your Microsoft/Outlook account.

Once connected, text:
• "check email" - See your inbox
• "email John about..." - Send emails
• "disconnect email" - Unlink anytime

Questions? Just ask Jordan!
```

---

## Troubleshooting

### **User says link expired:**
```
"Sorry, that link expired after 15 minutes for security.
Text 'connect email' to get a fresh link."
```

### **User already connected:**
```
"You already have email@example.com connected!
Text 'disconnect email' first if you want to connect a different account."
```

### **Connection failed:**
```
"Something went wrong connecting your email.
Please try again by texting 'connect email'"
```

---

## Cost Tracking

Track email API usage:

```typescript
// After each email check
await (supabase as any)
  .from('cost_events')
  .insert({
    subscriber_id: subscriber.id,
    service: 'microsoft_graph',
    operation: 'read_emails',
    cost: 0, // FREE within limits
    metadata: {
      emails_fetched: emails.length
    }
  })
```

---

**Users stay connected forever (until they disconnect) and can easily disconnect via SMS!**
