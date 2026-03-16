/**
 * Email Reply Skill
 * Handles creating draft replies to emails via SMS commands
 */

import { createServiceClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio/client'

export interface ReplyToEmailParams {
  subscriber: any
  referenceNumber: number
  bodyText: string
}

export interface EmailReplyResult {
  success: boolean
  message: string
  draftId?: string
}

/**
 * Create a draft reply to an email by reference number
 */
export async function replyToEmail(params: ReplyToEmailParams): Promise<EmailReplyResult> {
  const { subscriber, referenceNumber, bodyText } = params
  const supabase = createServiceClient()

  try {
    console.log('[Email Reply] Starting for subscriber:', subscriber.id, 'ref:', referenceNumber)

    // Get the latest email summary to find reference #N
    const { data: summary, error: summaryError } = await (supabase as any)
      .from('email_summaries')
      .select('*')
      .eq('subscriber_id', subscriber.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (summaryError || !summary || !summary.emails_data) {
      console.error('[Email Reply] No email summary found:', summaryError)
      return {
        success: false,
        message: "I couldn't find that email. Text CHECK EMAIL to refresh your inbox first.",
      }
    }

    const emails = summary.emails_data
    const targetEmail = emails[referenceNumber - 1]

    if (!targetEmail) {
      console.warn('[Email Reply] Email not found at index:', referenceNumber - 1)
      return {
        success: false,
        message: `I couldn't find email #${referenceNumber}. You have ${emails.length} email${emails.length === 1 ? '' : 's'} in your inbox.`,
      }
    }

    console.log('[Email Reply] Found email:', {
      subject: targetEmail.subject,
      from: targetEmail.from?.emailAddress?.address
    })

    // Create reply subject
    const replySubject = getReplySubject(targetEmail.subject)

    // Get recipient email address
    const toAddress = targetEmail.from?.emailAddress?.address
    if (!toAddress) {
      console.error('[Email Reply] No sender email address found')
      return {
        success: false,
        message: "I couldn't find the sender's email address for this message.",
      }
    }

    // Create draft
    const { data: draft, error: draftError } = await (supabase as any)
      .from('email_drafts')
      .insert({
        subscriber_id: subscriber.id,
        reply_to_message_id: targetEmail.id,
        original_email_data: targetEmail,
        to_address: toAddress,
        subject: replySubject,
        body_text: bodyText,
        status: 'draft',
        reference_number: referenceNumber,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      })
      .select()
      .single()

    if (draftError || !draft) {
      console.error('[Email Reply] Failed to create draft:', draftError)
      return {
        success: false,
        message: "I couldn't create the draft. Please try again.",
      }
    }

    console.log('[Email Reply] Draft created:', draft.id)

    // Generate preview link
    const previewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/m/email/draft/${draft.id}`

    // Get sender name for display
    const senderName = targetEmail.from?.emailAddress?.name || toAddress

    // Send SMS with preview
    const smsMessage = `✅ Reply drafted to ${senderName}
Subject: ${replySubject}

Preview & send: ${previewUrl}

Or text SEND to send immediately`

    await sendSMS({
      to: subscriber.control_phone,
      body: smsMessage,
    })

    console.log('[Email Reply] SMS sent successfully')

    return {
      success: true,
      message: 'Draft created',
      draftId: draft.id,
    }
  } catch (error) {
    console.error('[Email Reply] Error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create draft reply',
    }
  }
}

/**
 * Create a new email draft (not a reply)
 */
export async function composeEmail(params: {
  subscriber: any
  toAddress: string
  subject: string
  bodyText: string
}): Promise<EmailReplyResult> {
  const { subscriber, toAddress, subject, bodyText } = params
  const supabase = createServiceClient()

  try {
    console.log('[Compose Email] Starting for subscriber:', subscriber.id)

    // Validate email address
    if (!toAddress.includes('@')) {
      return {
        success: false,
        message: `"${toAddress}" doesn't look like a valid email address. Please check and try again.`,
      }
    }

    // Create draft
    const { data: draft, error: draftError } = await (supabase as any)
      .from('email_drafts')
      .insert({
        subscriber_id: subscriber.id,
        to_address: toAddress,
        subject: subject,
        body_text: bodyText,
        status: 'draft',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      })
      .select()
      .single()

    if (draftError || !draft) {
      console.error('[Compose Email] Failed to create draft:', draftError)
      return {
        success: false,
        message: "I couldn't create the draft. Please try again.",
      }
    }

    console.log('[Compose Email] Draft created:', draft.id)

    // Generate preview link
    const previewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/m/email/draft/${draft.id}`

    // Send SMS with preview
    const smsMessage = `✅ Email drafted to ${toAddress}
Subject: ${subject}

Preview & send: ${previewUrl}

Or text SEND to send immediately`

    await sendSMS({
      to: subscriber.control_phone,
      body: smsMessage,
    })

    console.log('[Compose Email] SMS sent successfully')

    return {
      success: true,
      message: 'Draft created',
      draftId: draft.id,
    }
  } catch (error) {
    console.error('[Compose Email] Error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create draft',
    }
  }
}

/**
 * Get reply subject with "Re:" prefix
 */
function getReplySubject(originalSubject: string): string {
  // Already has Re: prefix
  if (originalSubject.startsWith('Re:') || originalSubject.startsWith('RE:') || originalSubject.startsWith('re:')) {
    return originalSubject
  }

  // Add Re: prefix
  return `Re: ${originalSubject}`
}
