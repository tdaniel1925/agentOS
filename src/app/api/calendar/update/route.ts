/**
 * Update Calendar Settings API Route
 * Saves calendar URL, type, and timezone
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUpcomingEvents } from '@/lib/calendar/caldav-reader'

export async function POST(req: NextRequest) {
  try {
    const { calendarUrl, calendarType, timezone } = await req.json()

    if (!calendarUrl) {
      return NextResponse.json(
        { error: 'Calendar URL is required' },
        { status: 400 }
      )
    }

    if (!timezone) {
      return NextResponse.json(
        { error: 'Timezone is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get subscriber
    const subscriberResult: any = await (supabase as any)
      .from('subscribers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    const subscriber = subscriberResult.data

    if (!subscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 })
    }

    // Test the calendar URL before saving
    try {
      await getUpcomingEvents(calendarUrl, 7)
    } catch (error: any) {
      return NextResponse.json(
        { error: `Calendar URL test failed: ${error.message}` },
        { status: 400 }
      )
    }

    // Update subscriber with calendar settings
    const updateResult: any = await (supabase as any)
      .from('subscribers')
      .update({
        calendar_url: calendarUrl,
        calendar_type: calendarType || 'other',
        timezone,
        google_calendar_connected: calendarType === 'google',
        microsoft_calendar_connected: calendarType === 'outlook',
      })
      .eq('id', subscriber.id)

    if (updateResult.error) {
      throw updateResult.error
    }

    // Log the update
    await (supabase as any)
      .from('commands_log')
      .insert({
        subscriber_id: subscriber.id,
        channel: 'app',
        raw_message: `Connected ${calendarType || 'other'} calendar and set timezone to ${timezone}`,
        skill_triggered: 'calendar-setup',
        success: true,
      })

    return NextResponse.json({
      success: true,
      message: 'Calendar settings saved successfully!'
    })

  } catch (error: any) {
    console.error('Calendar update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update calendar settings' },
      { status: 500 }
    )
  }
}
