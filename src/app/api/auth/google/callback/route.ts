/**
 * Google OAuth Callback Route
 * Handles OAuth redirect from Google and stores tokens
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTokensFromCode } from '@/lib/google/calendar'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // subscriber ID
    const error = searchParams.get('error')

    // Handle OAuth denial
    if (error) {
      return NextResponse.redirect(
        new URL('/app?calendar_error=access_denied', req.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/app?calendar_error=invalid_callback', req.url)
      )
    }

    const subscriberId = state

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        new URL('/app?calendar_error=token_error', req.url)
      )
    }

    // Store tokens in database
    const supabase = await createClient()

    const updateResult: any = await (supabase as any)
      .from('subscribers')
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        google_calendar_connected: true,
      })
      .eq('id', subscriberId)

    if (updateResult.error) {
      throw updateResult.error
    }

    // Log the connection
    await (supabase as any)
      .from('commands_log')
      .insert({
        subscriber_id: subscriberId,
        channel: 'app',
        raw_message: 'Connected Google Calendar',
        skill_triggered: 'calendar-connect',
        success: true,
      })

    // Redirect back to dashboard with success message
    return NextResponse.redirect(
      new URL('/app?calendar_connected=true', req.url)
    )

  } catch (error: any) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(
      new URL(`/app?calendar_error=${encodeURIComponent(error.message)}`, req.url)
    )
  }
}
