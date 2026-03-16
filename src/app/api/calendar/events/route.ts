/**
 * Calendar Events API Route
 * Create and manage calendar events
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCalendarEvent, listUpcomingEvents } from '@/lib/google/calendar'

/**
 * GET /api/calendar/events
 * List upcoming events
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get subscriber ID
    const subscriberResult: any = await (supabase as any)
      .from('subscribers')
      .select('id, google_calendar_connected')
      .eq('auth_user_id', user.id)
      .single()

    const subscriber = subscriberResult.data

    if (!subscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 })
    }

    if (!subscriber.google_calendar_connected) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 })
    }

    // Get upcoming events
    const events = await listUpcomingEvents(subscriber.id, 20)

    return NextResponse.json({ events })

  } catch (error: any) {
    console.error('List events error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list events' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/calendar/events
 * Create a new calendar event
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get subscriber ID
    const subscriberResult: any = await (supabase as any)
      .from('subscribers')
      .select('id, google_calendar_connected')
      .eq('auth_user_id', user.id)
      .single()

    const subscriber = subscriberResult.data

    if (!subscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 })
    }

    if (!subscriber.google_calendar_connected) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 })
    }

    // Parse request body
    const body = await req.json()
    const { summary, description, startTime, endTime, attendees, location } = body

    // Validate required fields
    if (!summary || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: summary, startTime, endTime' },
        { status: 400 }
      )
    }

    // Create calendar event
    const event = await createCalendarEvent(subscriber.id, {
      summary,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      attendees,
      location,
    })

    // Log the event creation
    await (supabase as any)
      .from('commands_log')
      .insert({
        subscriber_id: subscriber.id,
        channel: 'app',
        raw_message: `Created calendar event: ${summary}`,
        skill_triggered: 'calendar-create-event',
        success: true,
      })

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        summary: event.summary,
        start: event.start,
        end: event.end,
        htmlLink: event.htmlLink,
      },
    })

  } catch (error: any) {
    console.error('Create event error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
      { status: 500 }
    )
  }
}
