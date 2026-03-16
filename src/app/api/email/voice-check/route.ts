/**
 * Voice Email Check API
 *
 * Triggers a VAPI call to read user's emails aloud
 * Called when user texts "call me about my emails"
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getMicrosoftUnreadEmails,
  refreshMicrosoftToken,
  encryptToken,
  decryptToken
} from '@/lib/email/microsoft'
import {
  formatEmailsForVoice,
  triggerVoiceEmailCheck
} from '@/lib/email/voice-check'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { subscriber_id, limit } = body

    if (!subscriber_id) {
      return NextResponse.json({ error: 'subscriber_id required' }, { status: 400 })
    }

    console.log(`📞 Voice email check requested for subscriber: ${subscriber_id}`)

    // Load environment variables
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get subscriber info
    const subscriberResult: any = await (supabase as any)
      .from('subscribers')
      .select('id, name, control_phone')
      .eq('id', subscriber_id)
      .single()

    if (subscriberResult.error || !subscriberResult.data) {
      throw new Error('Subscriber not found')
    }

    const subscriber = subscriberResult.data

    if (!subscriber.control_phone) {
      throw new Error('Subscriber has no control phone number')
    }

    // Get active email connection
    const connectionResult: any = await (supabase as any)
      .from('email_connections')
      .select('*')
      .eq('subscriber_id', subscriber_id)
      .eq('provider', 'outlook')
      .eq('status', 'active')
      .single()

    if (connectionResult.error || !connectionResult.data) {
      return NextResponse.json({
        success: false,
        error: 'No active email connection found',
        message: 'User needs to connect their email first'
      }, { status: 400 })
    }

    const connection = connectionResult.data

    // Check if token needs refresh
    let accessToken = decryptToken(connection.encrypted_access_token)

    if (new Date(connection.token_expires_at) < new Date()) {
      console.log('🔄 Refreshing expired access token...')

      const refreshToken = decryptToken(connection.encrypted_refresh_token)
      const newTokens = await refreshMicrosoftToken(refreshToken)

      // Update database with new tokens
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
    const emailLimit = limit || 10 // Default to 10 emails
    const emails = await getMicrosoftUnreadEmails(accessToken, emailLimit)

    if (emails.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No unread emails',
        message: 'Inbox is empty'
      }, { status: 400 })
    }

    console.log(`📧 Found ${emails.length} unread emails`)

    // Format emails for voice
    const formattedEmails = formatEmailsForVoice(emails)

    // Trigger VAPI call
    const callId = await triggerVoiceEmailCheck(
      subscriber.control_phone,
      formattedEmails,
      subscriber.name,
      {
        subscriber_id: subscriber.id,
        connection_id: connection.id
      }
    )

    console.log(`✅ Voice email check call initiated: ${callId}`)

    // Update last sync time
    await (supabase as any)
      .from('email_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connection.id)

    // Log activity
    await (supabase as any)
      .from('commands_log')
      .insert({
        subscriber_id: subscriber.id,
        command: 'voice_email_check',
        intent: 'EMAIL_VOICE_CHECK',
        success: true,
        response_sent: `Calling to read ${emails.length} emails`,
        metadata: {
          email_count: emails.length,
          vapi_call_id: callId
        }
      })

    return NextResponse.json({
      success: true,
      message: `Calling to read ${emails.length} email${emails.length === 1 ? '' : 's'}`,
      call_id: callId,
      email_count: emails.length
    })

  } catch (error: unknown) {
    console.error('❌ Error in voice email check:', error)
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
