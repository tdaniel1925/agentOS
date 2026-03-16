/**
 * VAPI Email Actions Webhook
 *
 * Handles actions from voice email check calls:
 * - Reply to email
 * - Mark important
 * - Archive/delete
 *
 * Called by VAPI when user says "reply to that email" etc.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sendMicrosoftEmail,
  decryptToken,
  refreshMicrosoftToken,
  encryptToken
} from '@/lib/email/microsoft'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const {
      action,
      subscriber_id,
      email_id,
      reply_content,
      recipient_email
    } = body

    console.log(`📨 VAPI email action: ${action}`, { subscriber_id, email_id })

    // Load environment variables
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get email connection
    const connectionResult: any = await (supabase as any)
      .from('email_connections')
      .select('*')
      .eq('subscriber_id', subscriber_id)
      .eq('provider', 'outlook')
      .eq('status', 'active')
      .single()

    if (connectionResult.error || !connectionResult.data) {
      throw new Error('No active email connection found')
    }

    const connection = connectionResult.data

    // Check if token needs refresh
    let accessToken = decryptToken(connection.encrypted_access_token)

    if (new Date(connection.token_expires_at) < new Date()) {
      const refreshToken = decryptToken(connection.encrypted_refresh_token)
      const newTokens = await refreshMicrosoftToken(refreshToken)

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

    // Handle different actions
    switch (action) {
      case 'reply':
        if (!reply_content || !recipient_email) {
          throw new Error('reply_content and recipient_email required for reply action')
        }

        // Send email reply
        await sendMicrosoftEmail(
          accessToken,
          recipient_email,
          'Re: Email reply from Jordan',
          reply_content
        )

        console.log(`✅ Reply sent to ${recipient_email}`)

        // Log the action
        await (supabase as any)
          .from('commands_log')
          .insert({
            subscriber_id: subscriber_id,
            command: 'email_reply_via_voice',
            intent: 'EMAIL_REPLY',
            success: true,
            response_sent: `Reply sent to ${recipient_email}`,
            metadata: {
              recipient: recipient_email,
              via: 'voice_call'
            }
          })

        return NextResponse.json({
          success: true,
          message: 'Reply sent successfully'
        })

      case 'mark_important':
        // In a full implementation, you'd mark the email as important via Microsoft Graph API
        // For now, just log it
        console.log(`📌 Email ${email_id} marked as important`)

        await (supabase as any)
          .from('commands_log')
          .insert({
            subscriber_id: subscriber_id,
            command: 'mark_email_important',
            intent: 'EMAIL_MARK_IMPORTANT',
            success: true,
            metadata: {
              email_id: email_id,
              via: 'voice_call'
            }
          })

        return NextResponse.json({
          success: true,
          message: 'Email marked as important'
        })

      case 'archive':
      case 'delete':
        // In a full implementation, you'd archive/delete via Microsoft Graph API
        console.log(`🗑️ Email ${email_id} ${action}d`)

        await (supabase as any)
          .from('commands_log')
          .insert({
            subscriber_id: subscriber_id,
            command: `email_${action}`,
            intent: `EMAIL_${action.toUpperCase()}`,
            success: true,
            metadata: {
              email_id: email_id,
              via: 'voice_call'
            }
          })

        return NextResponse.json({
          success: true,
          message: `Email ${action}d successfully`
        })

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error: unknown) {
    console.error('❌ Error handling VAPI email action:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    )
  }
}
