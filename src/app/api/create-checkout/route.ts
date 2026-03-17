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

    // Create checkout session with subscription + setup fee
    // First invoice will be $112 ($97 subscription + $15 setup fee)
    // Subsequent invoices will be $97/month
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId, // $97/month recurring subscription
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          subscriber_id: subscriberId,
        },
        // Add setup fee to first invoice via add_invoice_items
        add_invoice_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Phone Number Setup Fee',
                description: 'One-time fee for phone number provisioning',
              },
              unit_amount: 1500, // $15.00 in cents
            },
            quantity: 1,
          },
        ],
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?cancelled=true`,
      metadata: {
        subscriber_id: subscriberId,
        includes_setup_fee: 'true',
        setup_fee_amount: '15.00',
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
