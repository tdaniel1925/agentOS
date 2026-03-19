/**
 * Email Draft Generator
 * Creates professional email responses that are emailed to the user to copy/paste
 * User maintains full control - Jordyn never sends on their behalf
 */

import Anthropic from '@anthropic-ai/sdk'
import { sendEmail } from '@/lib/resend/client'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface DraftEmailParams {
  subscriber: any
  replyTo: string
  replyToName?: string
  subject: string
  context?: string
  userInstructions?: string
}

/**
 * Generate email draft and send to user
 */
export async function generateAndSendDraft(params: DraftEmailParams): Promise<{
  success: boolean
  message: string
}> {
  const { subscriber, replyTo, replyToName, subject, context, userInstructions } = params

  try {
    console.log('✍️ [Draft] Generating email draft for:', subscriber.id)

    // Generate draft with Claude
    const draft = await generateDraftWithClaude({
      businessName: subscriber.business_name || subscriber.name,
      businessType: subscriber.business_type || 'business',
      replyTo,
      replyToName: replyToName || replyTo.split('@')[0],
      subject,
      context,
      userInstructions
    })

    console.log('✅ [Draft] Draft generated')

    // Email draft to user
    const userEmail = subscriber.email || subscriber.control_phone // Fallback if no email

    await sendEmail({
      to: userEmail,
      subject: `Draft Reply: ${subject}`,
      html: buildDraftEmail(draft, replyTo, replyToName || replyTo, subject),
    })

    console.log('✅ [Draft] Draft emailed to user')

    return {
      success: true,
      message: `Draft sent to ${userEmail}! Check your inbox and copy/paste to send.`
    }

  } catch (error) {
    console.error('❌ [Draft] Generation failed:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate draft'
    }
  }
}

/**
 * Generate draft email content with Claude
 */
async function generateDraftWithClaude(params: {
  businessName: string
  businessType: string
  replyTo: string
  replyToName: string
  subject: string
  context?: string
  userInstructions?: string
}): Promise<string> {
  const { businessName, businessType, replyTo, replyToName, subject, context, userInstructions } = params

  const prompt = `You are drafting a professional email reply for ${businessName}, a ${businessType}.

Replying to: ${replyToName} <${replyTo}>
Original subject: ${subject}
${context ? `Context: ${context}` : ''}
${userInstructions ? `User instructions: ${userInstructions}` : ''}

Write a professional, friendly email response. Guidelines:
- Warm but professional tone
- Clear and concise
- Address the sender by name
- Sign off appropriately
- Stay on brand for a ${businessType}
${userInstructions ? '- Follow the user\'s specific instructions' : '- Be helpful and responsive'}

Return ONLY the email body (no subject line, no "Dear..." if not needed). Start naturally.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    temperature: 0.7,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  })

  const content = response.content[0]
  if (content.type === 'text') {
    return content.text.trim()
  }

  throw new Error('Failed to generate draft')
}

/**
 * Build HTML email with draft
 */
function buildDraftEmail(
  draftBody: string,
  replyTo: string,
  replyToName: string,
  subject: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Draft</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #9333ea, #ec4899); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 24px;">📧 Email Draft Ready</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Copy and paste this into your reply</p>
  </div>

  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
      <strong>To:</strong> ${replyToName} &lt;${replyTo}&gt;<br>
      <strong>Subject:</strong> Re: ${subject}
    </p>
  </div>

  <div style="background: white; border: 2px solid #9333ea; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <div style="white-space: pre-wrap; font-size: 15px; line-height: 1.6;">${escapeHtml(draftBody)}</div>
  </div>

  <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
    <p style="margin: 0; font-size: 14px; color: #92400e;">
      <strong>👆 Review before sending!</strong><br>
      This is a draft. Edit it to match your voice, then copy/paste into your email client.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
    <p style="margin: 0;">
      <strong>Jordyn.</strong> - Your AI Receptionist<br>
      <span style="font-size: 12px;">Privacy-first email assistance</span>
    </p>
  </div>

</body>
</html>
  `.trim()
}

/**
 * Escape HTML for safe display
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
