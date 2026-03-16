/**
 * Google OAuth Initiation Route
 * Redirects user to Google consent screen
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthorizationUrl } from '@/lib/google/calendar'

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
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    const subscriber = subscriberResult.data

    if (!subscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 })
    }

    // Generate authorization URL
    const authUrl = getAuthorizationUrl(subscriber.id)

    // Redirect to Google OAuth consent screen
    return NextResponse.redirect(authUrl)

  } catch (error: any) {
    console.error('Google OAuth initiation error:', error)
    return NextResponse.json(
      { error: error.message || 'OAuth initiation failed' },
      { status: 500 }
    )
  }
}
