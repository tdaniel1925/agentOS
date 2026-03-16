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

    // Fetch subscriber with phone number info
    const { data: subscriber, error } = await supabase
      .from('subscribers')
      .select(`
        *,
        subscriber_phone_numbers (
          id,
          phone_number,
          phone_number_id,
          vapi_assistant_id,
          status,
          assigned_at
        )
      `)
      .eq('id', id)
      .single()

    if (error || !subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    // Extract phone number data
    const phoneNumber = subscriber.subscriber_phone_numbers?.[0] || null

    return NextResponse.json({
      id: subscriber.id,
      email: subscriber.email,
      name: subscriber.name,
      business_name: subscriber.business_name,
      business_type: subscriber.business_type,
      control_phone: subscriber.control_phone,
      stripe_subscription_status: subscriber.stripe_subscription_status,
      vapi_assistant_id: phoneNumber?.vapi_assistant_id || null,
      vapi_phone_number: phoneNumber?.phone_number || null,
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
