/**
 * Email Disconnect Handler
 *
 * Allows subscribers to disconnect their email account
 * Called when they text "disconnect email" or similar
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { subscriber_id, provider } = body

    if (!subscriber_id) {
      return NextResponse.json({ error: 'subscriber_id required' }, { status: 400 })
    }

    // Load environment variables
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Build query
    let query = (supabase as any)
      .from('email_connections')
      .update({
        status: 'revoked',
        updated_at: new Date().toISOString()
      })
      .eq('subscriber_id', subscriber_id)

    // If provider specified, only disconnect that one
    if (provider) {
      query = query.eq('provider', provider)
    }

    const result: any = await query.select()

    if (result.error) {
      throw result.error
    }

    const disconnectedCount = result.data?.length || 0

    console.log(`✅ Disconnected ${disconnectedCount} email connection(s) for subscriber ${subscriber_id}`)

    return NextResponse.json({
      success: true,
      disconnected: disconnectedCount,
      message: `Disconnected ${disconnectedCount} email account(s)`
    })

  } catch (error: unknown) {
    console.error('❌ Error disconnecting email:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
