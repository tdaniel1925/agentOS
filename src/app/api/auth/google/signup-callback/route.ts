/**
 * Google OAuth Signup Callback Route
 * Handles OAuth redirect from Google during signup flow
 * Distinct from calendar OAuth callback
 * Agent 6: OAuth Integration & Claim Agent
 *
 * Supabase Auth handles the OAuth exchange automatically.
 * This route just extracts user data and redirects to signup flow.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    // Handle OAuth denial
    if (error) {
      return NextResponse.redirect(
        new URL(`/signup-v2?error=oauth_denied&provider=google`, req.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/signup-v2?error=invalid_callback', req.url)
      )
    }

    // Exchange code for session using Supabase Auth
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(
        new URL(`/signup-v2?error=oauth_failed&provider=google`, req.url)
      )
    }

    if (!data.user) {
      return NextResponse.redirect(
        new URL('/signup-v2?error=no_user_data', req.url)
      )
    }

    // Extract user data from Supabase Auth
    const user = data.user
    const provider = user.app_metadata.provider || 'google'

    // Encode user data to pass to signup flow
    const sessionData = encodeURIComponent(
      JSON.stringify({
        email: user.email!,
        name: user.user_metadata.full_name || user.user_metadata.name || null,
        provider: provider === 'google' ? 'google' : 'microsoft',
        provider_id: user.id,
      })
    )

    // Redirect back to signup flow with OAuth success
    return NextResponse.redirect(
      new URL(`/signup-v2?oauth_success=true&session=${sessionData}`, req.url)
    )

  } catch (error: any) {
    console.error('Google OAuth signup callback error:', error)
    return NextResponse.redirect(
      new URL(
        `/signup-v2?error=${encodeURIComponent(error.message || 'oauth_failed')}&provider=google`,
        req.url
      )
    )
  }
}
