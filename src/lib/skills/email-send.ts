/**
 * Email Send Skill
 * Handles sending email drafts via Microsoft Graph API
 */

import { createServiceClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio/client'

export interface SendDraftParams {
  draftId: string
  subscriberId: string
}

export interface SendResult {
  success: boolean
  message: string
}

/**
 * Send an email draft
 */
export async function sendDraftEmail(params: SendDraftParams): Promise<SendResult> {
  const { draftId, subscriberId } = params
  const supabase = createServiceClient()

  try {
    console.log('[Email Send] Starting for draft:', draftId)

    // Get draft
    const { data: draft, error: draftError } = await (supabase as any)
      .from('email_drafts')
      .select('*')
      .eq('id', draftId)
      .eq('subscriber_id', subscriberId)
      .single()

    if (draftError || !draft) {
      console.error('[Email Send] Draft not found:', draftError)
      return {
        success: false,
        message: 'Draft not found or expired'
      }
    }

    if (draft.status === 'sent') {
      console.warn('[Email Send] Draft already sent')
      return {
        success: false,
        message: 'This email has already been sent'
      }
    }

    // Mark as sending
    await (supabase as any)
      .from('email_drafts')
      .update({
        status: 'sending',
        updated_at: new Date().toISOString()
      })
      .eq('id', draft.id)

    console.log('[Email Send] Marked as sending')

    // Get email connection
    const { data: connection, error: connectionError } = await (supabase as any)
      .from('email_connections')
      .select('*')
      .eq('subscriber_id', subscriberId)
      .eq('status', 'active')
      .single()

    if (connectionError || !connection) {
      console.error('[Email Send] No email connection:', connectionError)

      // Mark as failed
      await (supabase as any)
        .from('email_drafts')
        .update({
          status: 'failed',
          failed_reason: 'Email not connected',
          updated_at: new Date().toISOString()
        })
        .eq('id', draft.id)

      return {
        success: false,
        message: 'Your email is not connected. Please reconnect your email account.',
      }
    }

    console.log('[Email Send] Email connection found:', connection.provider)

    // Decrypt access token
    const { decryptToken } = await import('@/lib/email/microsoft')
    let accessToken: string

    try {
      accessToken = decryptToken(connection.encrypted_access_token)
      console.log('[Email Send] Access token decrypted')
    } catch (error) {
      console.error('[Email Send] Failed to decrypt token:', error)

      // Mark as failed
      await (supabase as any)
        .from('email_drafts')
        .update({
          status: 'failed',
          failed_reason: 'Token decryption failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', draft.id)

      return {
        success: false,
        message: 'Failed to authenticate. Please reconnect your email account.',
      }
    }

    // Check if token is expired and refresh if needed
    const tokenExpiresAt = new Date(connection.token_expires_at)
    const now = new Date()

    if (now >= tokenExpiresAt) {
      console.log('[Email Send] Token expired, refreshing...')

      try {
        const { refreshMicrosoftToken, encryptToken } = await import('@/lib/email/microsoft')
        const refreshToken = decryptToken(connection.encrypted_refresh_token)

        const newTokens = await refreshMicrosoftToken(refreshToken)

        // Update access token
        accessToken = newTokens.access_token

        // Store new tokens
        const newEncryptedAccessToken = encryptToken(newTokens.access_token)
        const newEncryptedRefreshToken = encryptToken(newTokens.refresh_token)
        const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000)

        await (supabase as any)
          .from('email_connections')
          .update({
            encrypted_access_token: newEncryptedAccessToken,
            encrypted_refresh_token: newEncryptedRefreshToken,
            token_expires_at: newExpiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id)

        console.log('[Email Send] Token refreshed successfully')
      } catch (refreshError) {
        console.error('[Email Send] Token refresh failed:', refreshError)

        // Mark as failed
        await (supabase as any)
          .from('email_drafts')
          .update({
            status: 'failed',
            failed_reason: 'Token refresh failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', draft.id)

        return {
          success: false,
          message: 'Failed to refresh authentication. Please reconnect your email account.',
        }
      }
    }

    // Convert plain text to HTML (simple line breaks)
    const bodyHtml = draft.body_html || draft.body_text.replace(/\n/g, '<br>')

    // Send via Microsoft Graph API
    try {
      const { sendMicrosoftEmail } = await import('@/lib/email/microsoft')

      console.log('[Email Send] Sending email...')
      await sendMicrosoftEmail(accessToken, draft.to_address, draft.subject, bodyHtml)
      console.log('[Email Send] Email sent successfully')
    } catch (sendError) {
      console.error('[Email Send] Failed to send email:', sendError)

      // Mark as failed
      await (supabase as any)
        .from('email_drafts')
        .update({
          status: 'failed',
          failed_reason: sendError instanceof Error ? sendError.message : 'Send failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', draft.id)

      return {
        success: false,
        message: `Failed to send email: ${sendError instanceof Error ? sendError.message : 'Unknown error'}`,
      }
    }

    // Mark as sent
    await (supabase as any)
      .from('email_drafts')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', draft.id)

    console.log('[Email Send] Draft marked as sent')

    return {
      success: true,
      message: `✅ Email sent to ${draft.to_address}`,
    }
  } catch (error) {
    console.error('[Email Send] Unexpected error:', error)

    // Try to mark as failed
    try {
      await (supabase as any)
        .from('email_drafts')
        .update({
          status: 'failed',
          failed_reason: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', draftId)
    } catch (updateError) {
      console.error('[Email Send] Failed to mark as failed:', updateError)
    }

    return {
      success: false,
      message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Send the most recent draft for a subscriber (used for "SEND" command)
 */
export async function sendLatestDraft(subscriberId: string): Promise<SendResult> {
  const supabase = createServiceClient()

  try {
    console.log('[Send Latest] Finding latest draft for subscriber:', subscriberId)

    // Get the most recent draft that hasn't been sent
    const { data: draft, error: draftError } = await (supabase as any)
      .from('email_drafts')
      .select('*')
      .eq('subscriber_id', subscriberId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (draftError || !draft) {
      console.warn('[Send Latest] No draft found:', draftError)
      return {
        success: false,
        message: "I don't have any drafts ready to send. Create a draft first by replying to an email or composing a new one.",
      }
    }

    console.log('[Send Latest] Found draft:', draft.id)

    // Get subscriber info for SMS
    const { data: subscriber } = await (supabase as any)
      .from('subscribers')
      .select('control_phone')
      .eq('id', subscriberId)
      .single()

    // Send the draft
    const result = await sendDraftEmail({
      draftId: draft.id,
      subscriberId: subscriberId,
    })

    // Send SMS notification if successful
    if (result.success && subscriber?.control_phone) {
      await sendSMS({
        to: subscriber.control_phone,
        body: result.message,
      })
    }

    return result
  } catch (error) {
    console.error('[Send Latest] Error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send draft',
    }
  }
}
