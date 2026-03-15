/**
 * Signup API Route
 * Creates auth user and subscriber record using service role
 * This bypasses RLS for initial user creation
 *
 * Session 5: Now includes attribution resolution
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { completeAttributionFlow } from '@/lib/demo/attribution'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, url_ref } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Create auth user using regular client
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 500 }
      )
    }

    // Create subscriber record using service role (bypasses RLS)
    const serviceSupabase = createServiceClient()
    const { data: subscriber, error: subscriberError } = await serviceSupabase
      .from('subscribers')
      .insert({
        auth_user_id: authData.user.id,
        name,
        email,
        phone: phone || null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (subscriberError || !subscriber) {
      console.error('Subscriber creation error:', subscriberError)
      return NextResponse.json(
        { error: 'Failed to create subscriber profile' },
        { status: 500 }
      )
    }

    // Session 5: Resolve and store attribution
    const cookieStore = await cookies()
    const cookie_rep_code = cookieStore.get('rep_code')?.value

    const attribution = await completeAttributionFlow(
      subscriber.id,
      phone || '',
      email,
      url_ref,
      cookie_rep_code
    )

    // Log attribution for debugging
    console.log('Attribution resolved:', {
      subscriber_id: subscriber.id,
      rep_code: attribution.rep_code,
      source: attribution.attribution_source
    })

    return NextResponse.json({
      success: true,
      user: authData.user,
      attribution: {
        rep_code: attribution.rep_code,
        source: attribution.attribution_source
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Signup failed' },
      { status: 500 }
    )
  }
}
