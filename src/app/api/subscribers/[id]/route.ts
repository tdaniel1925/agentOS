/**
 * Subscriber API - Get subscriber by ID
 *
 * GET /api/subscribers/[id]
 *
 * Returns subscriber data including VAPI assistant status
 * Used for polling during onboarding
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Subscriber ID required' },
        { status: 400 }
      )
    }

    // Fetch subscriber
    const { data: subscriber, error: subError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('id', id)
      .single()

    if (subError || !subscriber) {
      console.error('Subscriber fetch error:', subError)
      return NextResponse.json(
        { error: 'Subscriber not found', details: subError?.message },
        { status: 404 }
      )
    }

    // Fetch phone number info separately
    const { data: phoneNumbers } = await supabase
      .from('subscriber_phone_numbers')
      .select('*')
      .eq('subscriber_id', id)
      .eq('status', 'active')
      .order('assigned_at', { ascending: false })
      .limit(1)

    const phoneNumber = phoneNumbers?.[0] || null

    return NextResponse.json({
      id: subscriber.id,
      email: subscriber.email,
      name: subscriber.name,
      business_name: subscriber.business_name,
      business_type: subscriber.business_type,
      control_phone: subscriber.control_phone,
      stripe_subscription_status: subscriber.stripe_subscription_status,
      vapi_assistant_id: (subscriber as any).vapi_assistant_id || phoneNumber?.vapi_assistant_id || null,
      vapi_phone_number: (subscriber as any).vapi_phone_number || phoneNumber?.phone_number || null,
      phone_number_status: phoneNumber?.status || null,
      phone_number_assigned_at: phoneNumber?.assigned_at || null,
      created_at: subscriber.created_at
    })

  } catch (error: unknown) {
    console.error('Subscriber API error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      { error: 'Failed to fetch subscriber', details: errorMessage },
      { status: 500 }
    )
  }
}
