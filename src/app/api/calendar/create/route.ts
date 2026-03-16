/**
 * Calendar Create Event API
 *
 * Create a new calendar event
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  createMicrosoftCalendarEvent,
  refreshMicrosoftToken,
  encryptToken,
  decryptToken
} from '@/lib/email/microsoft'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const {
      subscriber_id,
      subject,
      start,
      end,
      location,
      attendees,
      body: eventBody,
      isAllDay
    } = body

    if (!subscriber_id || !subject || !start || !end) {
      return NextResponse.json({
        error: 'subscriber_id, subject, start, and end are required'
      }, { status: 400 })
    }

    console.log(`📅 Creating calendar event for subscriber: ${subscriber_id}`)

    // Load environment variables
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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
        error: 'No active Microsoft connection found',
        message: 'User needs to connect their Microsoft account first'
      }, { status: 400 })
    }

    const connection = connectionResult.data

    // Check if token needs refresh
    let accessToken = decryptToken(connection.encrypted_access_token)

    if (new Date(connection.token_expires_at) < new Date()) {
      console.log('🔄 Refreshing expired access token...')

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

    // Create the calendar event
    const event = await createMicrosoftCalendarEvent(accessToken, {
      subject,
      start: new Date(start),
      end: new Date(end),
      location,
      attendees,
      body: eventBody,
      isAllDay
    })

    console.log(`✅ Calendar event created: ${event.id}`)

    // Log activity
    await (supabase as any)
      .from('commands_log')
      .insert({
        subscriber_id: subscriber_id,
        command: 'calendar_create',
        intent: 'CALENDAR_CREATE',
        success: true,
        response_sent: `Created event: ${subject}`,
        metadata: {
          event_id: event.id,
          subject: subject,
          start: start,
          end: end
        }
      })

    return NextResponse.json({
      success: true,
      event: event,
      message: `Event "${subject}" created successfully`
    })

  } catch (error: unknown) {
    console.error('❌ Error creating calendar event:', error)
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
