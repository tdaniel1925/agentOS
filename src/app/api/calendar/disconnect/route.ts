/**
 * Disconnect Calendar API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
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

    // Disconnect calendar - clear all calendar tokens and flags
    const updateResult: any = await (supabase as any)
      .from('subscribers')
      .update({
        google_calendar_connected: false,
        google_access_token: null,
        google_refresh_token: null,
        google_token_expiry: null,
        microsoft_calendar_connected: false,
        microsoft_access_token: null,
        microsoft_refresh_token: null,
        microsoft_token_expiry: null,
        calendar_type: null,
        calendar_url: null,
      })
      .eq('id', subscriber.id)

    if (updateResult.error) {
      throw updateResult.error
    }

    // Log the disconnection
    await (supabase as any)
      .from('commands_log')
      .insert({
        subscriber_id: subscriber.id,
        channel: 'app',
        raw_message: 'Disconnected calendar',
        skill_triggered: 'calendar-disconnect',
        success: true,
      })

    return NextResponse.json({
      success: true,
      message: 'Calendar disconnected successfully'
    })

  } catch (error: any) {
    console.error('Calendar disconnect error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect calendar' },
      { status: 500 }
    )
  }
}
