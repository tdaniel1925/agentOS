/**
 * Voice Email Check - VAPI Integration
 *
 * Calls user and reads through their emails conversationally
 */

import {
  getMicrosoftUnreadEmails,
  refreshMicrosoftToken,
  encryptToken,
  decryptToken,
  sendMicrosoftEmail
} from './microsoft'

const VAPI_API_KEY = process.env.VAPI_API_KEY!
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID!

interface EmailForVoice {
  id: string
  from: string
  subject: string
  receivedDateTime: string
  preview: string
  fullBody?: string
}

/**
 * Format emails for VAPI assistant prompt
 */
export function formatEmailsForVoice(emails: any[]): EmailForVoice[] {
  return emails.map(email => ({
    id: email.id,
    from: email.from?.emailAddress?.name || email.from?.emailAddress?.address || 'Unknown',
    subject: email.subject || '(no subject)',
    receivedDateTime: formatEmailTime(email.receivedDateTime),
    preview: email.bodyPreview || '(empty email)'
  }))
}

/**
 * Format email timestamp to friendly string
 */
function formatEmailTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  } else {
    return date.toLocaleDateString()
  }
}

/**
 * Generate VAPI system prompt with email data
 */
export function generateEmailVoicePrompt(
  emails: EmailForVoice[],
  userName: string
): string {
  const emailCount = emails.length

  // Format emails for the prompt
  const emailList = emails.map((email, index) => `
**Email ${index + 1}:**
- From: ${email.from}
- Subject: "${email.subject}"
- Received: ${email.receivedDateTime}
- Preview: ${email.preview}
- Email ID: ${email.id}
`).join('\n')

  return `You are Jordan, the user's AI assistant. You're calling ${userName} to go through their emails.

**EMAILS IN INBOX (${emailCount} unread):**
${emailList}

---

**YOUR JOB:**

**OPENING:**
"Hey ${userName}! I just checked your inbox. You have ${emailCount} unread email${emailCount === 1 ? '' : 's'}. Want me to go through them with you?"

**IF USER SAYS YES:**
Go through each email one by one. For each email:

1. Announce the number: "Email number 1"
2. Say who it's from: "This is from [name]"
3. Read the subject: "Subject is [subject]"
4. Share when it arrived: "Received [time ago]"
5. Give a brief preview: "They say: [preview]"
6. Ask: "Want me to read the next one, or take action on this?"

**USER CAN SAY:**
- "Next" or "Skip" → Move to next email
- "Read that again" → Repeat current email
- "Reply" or "Reply to that" → Offer to draft a reply (say: "What should I say back?")
- "Mark important" → Acknowledge and continue
- "Delete it" or "Archive" → Acknowledge and continue
- "Read the full email" → Provide more detail from preview
- "Stop" or "That's enough" → End call

**IF USER WANTS TO REPLY:**
1. Ask: "What should I say back to [sender]?"
2. Listen to their message
3. Confirm: "Got it. I'll email [sender]: '[their message]'. Should I send that?"
4. If yes: "Sent! Moving to the next email..."
5. If no: "Okay, I won't send it. Next email?"

**TONE:**
- Conversational and helpful
- Read email subjects and previews clearly
- Don't rush - let them process each email
- Be ready to repeat information
- Professional but friendly

**IMPORTANT RULES:**
- Only share the emails listed above - don't make up emails
- Keep each email summary brief (20-30 seconds max)
- If user says "stop" or "that's all", end gracefully
- Remember which email you're on (track by number)
- Don't read more than 10 emails in one call (offer to call back later)

**ENDING:**
After going through all emails OR user says stop:
"That's all your emails! I'll check again in a few hours. Just text me if you need anything else!"

**CRITICAL:** You're reading REAL emails from their REAL inbox. Be accurate and helpful.`
}

/**
 * Create ephemeral VAPI assistant for email reading
 */
export async function createEmailVoiceAssistant(
  emails: EmailForVoice[],
  userName: string
): Promise<string> {
  const systemPrompt = generateEmailVoicePrompt(emails, userName)

  const response = await fetch('https://api.vapi.ai/assistant', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: `Email Voice Check - ${userName} - ${new Date().toISOString()}`,
      model: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        messages: [{
          role: 'system',
          content: systemPrompt
        }],
        temperature: 0.7,
        maxTokens: 1000
      },
      voice: {
        provider: 'playht',
        voiceId: 'jennifer' // Friendly female voice
      },
      firstMessage: `Hey ${userName}! I just checked your inbox. You have ${emails.length} unread email${emails.length === 1 ? '' : 's'}. Want me to go through them with you?`,
      endCallMessage: "Talk to you soon!",
      maxDurationSeconds: 600 // 10 minutes max
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create VAPI assistant: ${error}`)
  }

  const data = await response.json()
  return data.id
}

/**
 * Trigger voice email check call
 */
export async function triggerVoiceEmailCheck(
  phoneNumber: string,
  emails: EmailForVoice[],
  userName: string,
  metadata?: Record<string, any>
): Promise<string> {
  // Create ephemeral assistant with email data
  const assistantId = await createEmailVoiceAssistant(emails, userName)

  // Trigger outbound call
  const response = await fetch('https://api.vapi.ai/call/phone', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      assistantId: assistantId,
      phoneNumberId: VAPI_PHONE_NUMBER_ID,
      customer: {
        number: phoneNumber
      },
      metadata: {
        type: 'email_voice_check',
        email_count: emails.length,
        ...metadata
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to trigger VAPI call: ${error}`)
  }

  const data = await response.json()
  return data.id // Return call ID
}
