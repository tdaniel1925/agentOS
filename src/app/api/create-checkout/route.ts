/**
 * Create Stripe Checkout Session
 * Called from onboard page to initiate payment
 */

import { NextRequest, NextResponse } from 'next/server'
import { getStripeServer } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { subscriberId, priceId } = await req.json()

    if (!subscriberId || !priceId) {
      return NextResponse.json(
        { error: 'subscriberId and priceId required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    const stripe = getStripeServer()

    // Get subscriber
    const subscriberResult: any = await (supabase as any)
      .from('subscribers')
      .select('*')
      .eq('id', subscriberId)
      .single()

    const subscriber = subscriberResult.data

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    // Create Stripe customer if doesn't exist
    let customerId = subscriber.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: subscriber.email,
        name: subscriber.name,
        metadata: {
          subscriber_id: subscriberId,
        },
      })
      customerId = customer.id

      await (supabase as any)
        .from('subscribers')
        .update({ stripe_customer_id: customerId })
        .eq('id', subscriberId)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboard?cancelled=true`,
      metadata: {
        subscriber_id: subscriberId,
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    })
  } catch (error) {
    console.error('Checkout creation error:', error)
    return NextResponse.json(
      { error: 'Checkout creation failed' },
      { status: 500 }
    )
  }
}
