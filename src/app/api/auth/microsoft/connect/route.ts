/**
 * Microsoft OAuth - Initiate Connection
 *
 * Generates secure OAuth link and redirects user to Microsoft login
 * Called when user taps link from SMS
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getMicrosoftAuthUrl } from '@/lib/email/microsoft'
import crypto from 'crypto'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Missing token parameter' }, { status: 400 })
    }

    // Load environment variables
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Verify token is valid (check pending_approvals or similar table)
    // For now, we'll use the token as a temporary state identifier
    // In production, verify token against database

    // Generate state parameter (includes subscriber info + security token)
    const state = Buffer.from(JSON.stringify({
      token: token,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex')
    })).toString('base64')

    // Get Microsoft OAuth URL
    const authUrl = getMicrosoftAuthUrl(state)

    // Redirect to Microsoft login
    return NextResponse.redirect(authUrl)

  } catch (error: unknown) {
    console.error('❌ Error initiating Microsoft OAuth:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
