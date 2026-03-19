/**
 * Update Subscriber Timezone API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { timezone } = await req.json()

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

    // Update timezone
    const updateResult: any = await (supabase as any)
      .from('subscribers')
      .update({ timezone })
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
        raw_message: `Updated timezone to ${timezone}`,
        skill_triggered: 'calendar-settings',
        success: true,
      })

    return NextResponse.json({
      success: true,
      timezone
    })

  } catch (error: any) {
    console.error('Timezone update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update timezone' },
      { status: 500 }
    )
  }
}
