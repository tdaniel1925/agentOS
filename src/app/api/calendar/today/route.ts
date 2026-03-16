/**
 * Calendar Today API
 *
 * Get today's calendar events for the subscriber
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getTodayCalendarEvents,
  refreshMicrosoftToken,
  encryptToken,
  decryptToken
} from '@/lib/email/microsoft'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { subscriber_id } = body

    if (!subscriber_id) {
      return NextResponse.json({ error: 'subscriber_id required' }, { status: 400 })
    }

    console.log(`📅 Calendar today requested for subscriber: ${subscriber_id}`)

    // Load environment variables
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get active email connection (calendar uses same OAuth connection)
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

    // Fetch today's calendar events
    const events = await getTodayCalendarEvents(accessToken)

    console.log(`📅 Found ${events.length} events for today`)

    // Update last sync time
    await (supabase as any)
      .from('email_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connection.id)

    // Log activity
    await (supabase as any)
      .from('commands_log')
      .insert({
        subscriber_id: subscriber_id,
        command: 'calendar_today',
        intent: 'CALENDAR_VIEW',
        success: true,
        response_sent: `Found ${events.length} event${events.length === 1 ? '' : 's'} today`,
        metadata: {
          event_count: events.length
        }
      })

    return NextResponse.json({
      success: true,
      events: events,
      count: events.length
    })

  } catch (error: unknown) {
    console.error('❌ Error fetching calendar events:', error)
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
