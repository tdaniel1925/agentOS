/**
 * Test Calendar Connection API Route
 * Tests a CalDAV/iCal URL before saving
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUpcomingEvents } from '@/lib/calendar/caldav-reader'

export async function POST(req: NextRequest) {
  try {
    const { calendarUrl } = await req.json()

    if (!calendarUrl) {
      return NextResponse.json(
        { error: 'Calendar URL is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to fetch events from the calendar (next 7 days)
    const events = await getUpcomingEvents(calendarUrl, 7)

    return NextResponse.json({
      success: true,
      eventCount: events.length,
      message: `Successfully connected! Found ${events.length} upcoming events.`
    })

  } catch (error: any) {
    console.error('Calendar connection test error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to connect to calendar. Please check the URL.' },
      { status: 400 }
    )
  }
}
