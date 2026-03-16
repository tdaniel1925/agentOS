# AGENT 6: EMAIL REPLY & COMPOSE (FUTURE)
**Status**: Spec Only (Not Yet Built)
**Priority**: P3 (Post-Launch Enhancement)
**Estimated Time**: 4-5 hours
**Dependencies**: Agent 1 (Email inbox must exist)

---

## MISSION
Enable users to reply to emails and compose new emails via SMS commands or mobile web interface.

---

## USER FLOWS

### Flow 1: Reply via SMS Command
```
1. User receives email summary SMS:
   📧 Inbox (last 24hrs):
   🔴 1 urgent
   👤 3 client emails
   View all: https://theapexbots.com/m/emails/uuid

2. User views emails on mobile, sees:
   #1 - John Smith: "Need proposal ASAP"
   #2 - Jane Doe: "Quick question"
   #3 - Bob Client: "Following up"

3. User texts Jordan:
   "reply to #1 - I'll send that proposal by end of day today"

4. Jordan responds:
   "✅ Reply drafted to John Smith
   Subject: Re: Need proposal ASAP

   Preview & send: https://theapexbots.com/m/email/draft/uuid

   Or text SEND to send immediately"

5a. User texts "SEND" → Email sent immediately
5b. User clicks link → Opens draft editor to review/edit first
```

### Flow 2: Reply via Mobile Web
```
1. User clicks email in inbox
2. Email detail modal opens
3. User clicks "Reply" button
4. Draft compose page opens with:
   - To: pre-filled with sender
   - Subject: "Re: Original Subject"
   - Body: empty text area
   - Original email quoted below

5. User types reply
6. Clicks "Send"
7. Success message: "✅ Email sent to John Smith"
8. Returns to inbox
```

### Flow 3: Compose New Email via SMS
```
User texts:
"send email to john@example.com about Project Update - Here's the latest status on the project..."

Jordan parses:
- To: john@example.com
- Subject: Project Update
- Body: Here's the latest status on the project...

Jordan responds:
"✅ Email drafted to john@example.com
Subject: Project Update

Preview & send: https://theapexbots.com/m/email/draft/uuid

Or text SEND to send immediately"
```

---

## TECHNICAL IMPLEMENTATION

### 1. Email Drafts Table

```sql
CREATE TABLE email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,

  -- Reply context (if replying)
  reply_to_message_id TEXT,
  original_email_data JSONB,

  -- Email fields
  to_address TEXT NOT NULL,
  cc_addresses TEXT[],
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  body_html TEXT,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  failed_reason TEXT,

  -- Reference numbering (for SMS)
  reference_number INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
)

CREATE INDEX idx_email_drafts_subscriber ON email_drafts(subscriber_id)
CREATE INDEX idx_email_drafts_reference ON email_drafts(subscriber_id, reference_number)
CREATE INDEX idx_email_drafts_status ON email_drafts(status)
```

### 2. SMS Parser for Email Commands

```typescript
// File: src/lib/skills/sms-parser.ts

function parseEmailCommand(message: string): EmailCommand | null {
  const lower = message.toLowerCase()

  // Reply to #N
  const replyMatch = lower.match(/reply to #?(\d+)(?: -|:)?\s*(.+)/i)
  if (replyMatch) {
    return {
      type: 'REPLY_TO_EMAIL',
      referenceNumber: parseInt(replyMatch[1]),
      body: replyMatch[2].trim()
    }
  }

  // Send email to <email> about <subject> - <body>
  const sendMatch = message.match(/send email to ([^\s]+@[^\s]+)(?: about ([^-]+))?\s*-\s*(.+)/i)
  if (sendMatch) {
    return {
      type: 'COMPOSE_EMAIL',
      to: sendMatch[1],
      subject: sendMatch[2]?.trim() || '(No Subject)',
      body: sendMatch[3].trim()
    }
  }

  // Confirm send
  if (lower === 'send' || lower === 'send email') {
    return {
      type: 'CONFIRM_SEND'
    }
  }

  return null
}
```

### 3. Reply Skill

```typescript
// File: src/lib/skills/email-reply.ts

export async function replyToEmail(params: {
  subscriber: any
  referenceNumber: number
  bodyText: string
}): Promise<CheckResult> {
  const supabase = createServiceClient()

  // Get the latest email summary to find reference #N
  const { data: summary } = await supabase
    .from('email_summaries')
    .select('*')
    .eq('subscriber_id', params.subscriber.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!summary || !summary.emails_data) {
    return {
      success: false,
      message: "I couldn't find that email. Text CHECK EMAIL to refresh your inbox first."
    }
  }

  const emails = summary.emails_data
  const targetEmail = emails[params.referenceNumber - 1]

  if (!targetEmail) {
    return {
      success: false,
      message: `I couldn't find email #${params.referenceNumber}. You have ${emails.length} emails in your inbox.`
    }
  }

  // Create draft
  const replySubject = targetEmail.subject.startsWith('Re:')
    ? targetEmail.subject
    : `Re: ${targetEmail.subject}`

  const { data: draft } = await supabase
    .from('email_drafts')
    .insert({
      subscriber_id: params.subscriber.id,
      reply_to_message_id: targetEmail.id,
      original_email_data: targetEmail,
      to_address: targetEmail.from.emailAddress.address,
      subject: replySubject,
      body_text: params.bodyText,
      status: 'draft'
    })
    .select()
    .single()

  // Generate preview link
  const previewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/m/email/draft/${draft.id}`

  // Send SMS with preview
  await sendSMS({
    to: params.subscriber.control_phone,
    body: `✅ Reply drafted to ${targetEmail.from.emailAddress.name || targetEmail.from.emailAddress.address}\nSubject: ${replySubject}\n\nPreview & send: ${previewUrl}\n\nOr text SEND to send immediately`
  })

  return {
    success: true,
    message: 'Draft created'
  }
}
```

### 4. Send Email Function

```typescript
// File: src/lib/skills/email-send.ts

export async function sendDraftEmail(params: {
  draftId: string
  subscriberId: string
}): Promise<{ success: boolean; message: string }> {
  const supabase = createServiceClient()

  // Get draft
  const { data: draft } = await supabase
    .from('email_drafts')
    .select('*')
    .eq('id', params.draftId)
    .eq('subscriber_id', params.subscriberId)
    .single()

  if (!draft) {
    return { success: false, message: 'Draft not found' }
  }

  if (draft.status === 'sent') {
    return { success: false, message: 'Email already sent' }
  }

  // Mark as sending
  await supabase
    .from('email_drafts')
    .update({ status: 'sending' })
    .eq('id', draft.id)

  try {
    // Get email connection
    const { data: connection } = await supabase
      .from('email_connections')
      .select('*')
      .eq('subscriber_id', params.subscriberId)
      .eq('status', 'active')
      .single()

    if (!connection) {
      throw new Error('Email not connected')
    }

    // Decrypt access token
    const { decryptToken } = await import('@/lib/email/microsoft')
    const accessToken = decryptToken(connection.encrypted_access_token)

    // Send via Microsoft Graph API
    const { sendMicrosoftEmail } = await import('@/lib/email/microsoft')
    await sendMicrosoftEmail(
      accessToken,
      draft.to_address,
      draft.subject,
      draft.body_text
    )

    // Mark as sent
    await supabase
      .from('email_drafts')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', draft.id)

    return {
      success: true,
      message: `✅ Email sent to ${draft.to_address}`
    }
  } catch (error) {
    // Mark as failed
    await supabase
      .from('email_drafts')
      .update({
        status: 'failed',
        failed_reason: error instanceof Error ? error.message : String(error)
      })
      .eq('id', draft.id)

    return {
      success: false,
      message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
```

### 5. Draft Editor Page

```typescript
// File: src/app/m/email/draft/[id]/page.tsx

import { createServiceClient } from '@/lib/supabase/server'
import { EmailDraftEditor } from '@/components/mobile/EmailDraftEditor'
import { notFound } from 'next/navigation'

export default async function DraftEditorPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = createServiceClient()

  // Get draft
  const { data: draft } = await supabase
    .from('email_drafts')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!draft) {
    return notFound()
  }

  return <EmailDraftEditor draft={draft} />
}
```

### 6. Draft Editor Component

```typescript
// File: src/components/mobile/EmailDraftEditor.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EmailDraftEditorProps {
  draft: {
    id: string
    to_address: string
    subject: string
    body_text: string
    original_email_data?: any
    subscriber_id: string
  }
}

export function EmailDraftEditor({ draft }: EmailDraftEditorProps) {
  const router = useRouter()
  const [body, setBody] = useState(draft.body_text)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    setIsSending(true)
    setError('')

    try {
      // Update draft body if changed
      if (body !== draft.body_text) {
        await fetch(`/api/email/draft/${draft.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body_text: body })
        })
      }

      // Send email
      const res = await fetch(`/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: draft.id,
          subscriberId: draft.subscriber_id
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to send')
      }

      // Success! Redirect to inbox
      alert('✅ Email sent!')
      router.push(`/m/emails/${draft.subscriber_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B3A7D] text-white p-4 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="text-2xl mb-2"
        >
          ←
        </button>
        <h1 className="text-xl font-bold">Draft Email</h1>
      </div>

      {/* Draft Form */}
      <div className="p-4 space-y-4">
        {/* To */}
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-1">To</label>
          <div className="text-base font-semibold text-gray-900">
            {draft.to_address}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-1">Subject</label>
          <div className="text-base font-semibold text-gray-900">
            {draft.subject}
          </div>
        </div>

        {/* Body */}
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-1">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
            placeholder="Type your message..."
          />
        </div>

        {/* Original Email (if reply) */}
        {draft.original_email_data && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-2">Original Message:</div>
            <div className="text-sm text-gray-700">
              <div className="font-semibold mb-1">
                From: {draft.original_email_data.from?.emailAddress?.name}
              </div>
              <div className="text-xs text-gray-600 whitespace-pre-wrap">
                {draft.original_email_data.bodyPreview}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            {error}
          </div>
        )}
      </div>

      {/* Send Button */}
      <div className="sticky bottom-0 bg-white border-t p-4">
        <button
          onClick={handleSend}
          disabled={isSending || !body.trim()}
          className="w-full bg-[#1B3A7D] text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {isSending ? 'Sending...' : '📤 Send Email'}
        </button>
      </div>
    </div>
  )
}
```

---

## SUBJECT LINE PARSING RULES

### For Replies
```typescript
function getReplySubject(originalSubject: string): string {
  // Already has Re: prefix
  if (originalSubject.startsWith('Re:') || originalSubject.startsWith('RE:')) {
    return originalSubject
  }

  // Add Re: prefix
  return `Re: ${originalSubject}`
}
```

### For New Emails
```typescript
function parseNewEmailCommand(message: string): {
  to: string
  subject: string
  body: string
} | null {
  // Pattern: "send email to EMAIL about SUBJECT - BODY"
  const match = message.match(
    /send email to ([^\s]+@[^\s]+)(?: about ([^-]+))?\s*-\s*(.+)/i
  )

  if (!match) return null

  return {
    to: match[1],
    subject: match[2]?.trim() || '(No Subject)',
    body: match[3].trim()
  }
}

// Examples:
parseNewEmailCommand("send email to john@example.com about Project Update - Here's the status")
// → { to: "john@example.com", subject: "Project Update", body: "Here's the status" }

parseNewEmailCommand("send email to jane@corp.com - Quick question about the meeting")
// → { to: "jane@corp.com", subject: "(No Subject)", body: "Quick question..." }
```

---

## TESTING CHECKLIST

- [ ] User can reply via SMS "reply to #1 - message"
- [ ] Subject automatically gets "Re:" prefix
- [ ] Draft is created in database
- [ ] SMS includes preview link
- [ ] User can text "SEND" to send immediately
- [ ] Draft editor page loads correctly
- [ ] User can edit body before sending
- [ ] Send button works
- [ ] Email sends via Microsoft Graph
- [ ] Success message displays
- [ ] User redirected to inbox after send
- [ ] Failed sends show error message
- [ ] New email parsing works
- [ ] Subject line extracted correctly
- [ ] Handles missing subject gracefully

---

## SUCCESS CRITERIA

1. **SMS reply works**: User can reply to email #1-10 via SMS
2. **Draft preview works**: User can review before sending
3. **One-tap send works**: Text "SEND" sends immediately
4. **Subject preserved**: Re: added automatically for replies
5. **New email works**: Parse "send email to X about Y - Z" correctly

---

## FILES SUMMARY

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/skills/email-reply.ts` | ~150 | Reply skill logic |
| `src/lib/skills/email-send.ts` | ~100 | Send email logic |
| `src/lib/skills/sms-parser.ts` | +50 | Email command parsing |
| `src/app/m/email/draft/[id]/page.tsx` | ~40 | Draft editor page |
| `src/components/mobile/EmailDraftEditor.tsx` | ~200 | Draft editor UI |
| `src/app/api/email/send/route.ts` | ~40 | Send API |
| `src/app/api/email/draft/[id]/route.ts` | ~40 | Update draft API |
| Migration: `011_email_drafts.sql` | ~30 | Drafts table |

**Total**: ~650 lines of code

---

## LAUNCH PRIORITY

**Post-Launch** (P3) - Build this AFTER the 5 main agents complete and are deployed.

Why? This is a "nice to have" feature but not critical for MVP. Users can still:
1. View emails on mobile
2. Call the person back
3. Reply from their normal email client

Email reply is a **convenience feature** that makes Jordan more powerful, but the core SMS → Web link flow works without it.
