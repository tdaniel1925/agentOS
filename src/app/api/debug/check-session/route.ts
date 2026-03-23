/**
 * Check Session Debug Endpoint
 * Shows current auth status and session info
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = await createClient()
    const cookieStore = await cookies()

    // Get all cookies
    const allCookies = cookieStore.getAll()
    const supabaseCookies = allCookies.filter(c =>
      c.name.includes('supabase') || c.name.includes('auth')
    )

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    // If user exists, try to get subscriber
    let subscriber = null
    if (user) {
      const { data, error } = await (supabase as any)
        .from('subscribers')
        .select('id, business_name, status, auth_user_id')
        .eq('auth_user_id', user.id)
        .single()

      subscriber = { data, error: error?.message }
    }

    return NextResponse.json({
      authenticated: !!user,
      hasSession: !!session,
      user: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      } : null,
      session: session ? {
        expires_at: session.expires_at,
        expires_in: session.expires_in
      } : null,
      subscriber,
      cookies: {
        count: supabaseCookies.length,
        names: supabaseCookies.map(c => c.name)
      },
      errors: {
        userError: userError?.message,
        sessionError: sessionError?.message
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
