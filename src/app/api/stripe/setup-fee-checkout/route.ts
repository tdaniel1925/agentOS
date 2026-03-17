/**
 * Stripe Setup Fee Checkout
 *
 * Creates a Stripe Checkout session for the $15 phone number setup fee
 * After payment, webhook will trigger phone provisioning
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover'
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { subscriberId, phoneNumber, areaCode } = body

    if (!subscriberId || !phoneNumber || !areaCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get subscriber
    const { data: subscriber, error: subError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('id', subscriberId)
      .single()

    if (subError || !subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    // Check if already paid setup fee
    if (subscriber.setup_fee_paid) {
      return NextResponse.json(
        { error: 'Setup fee already paid' },
        { status: 400 }
      )
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Phone Number Setup Fee',
              description: `Phone number: ${phoneNumber}`,
            },
            unit_amount: 1500, // $15.00 in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        subscriber_id: subscriberId,
        phone_number: phoneNumber,
        area_code: areaCode,
        type: 'setup_fee'
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/${subscriberId}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/${subscriberId}?payment=cancelled`,
      customer_email: subscriber.email
    })

    return NextResponse.json({
      url: session.url
    })
  } catch (error: unknown) {
    console.error('Setup fee checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout' },
      { status: 500 }
    )
  }
}
