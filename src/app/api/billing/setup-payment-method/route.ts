/**
 * Setup Payment Method API
 * Creates a Stripe Checkout Session for adding payment method
 * Used during trial period before first charge
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

export async function POST(req: NextRequest) {
  try {
    const { subscriber_id } = await req.json()

    if (!subscriber_id) {
      return NextResponse.json(
        { error: 'subscriber_id is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get subscriber
    const subscriberResult: any = await (supabase as any)
      .from('subscribers')
      .select('*')
      .eq('id', subscriber_id)
      .single()

    if (subscriberResult.error || !subscriberResult.data) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    const subscriber = subscriberResult.data

    // Check if already has payment method
    if (subscriber.payment_method_added) {
      return NextResponse.json({
        success: true,
        message: 'Payment method already added',
      })
    }

    // Check if has Stripe customer ID
    if (!subscriber.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found for this subscriber' },
        { status: 400 }
      )
    }

    console.log(`💳 Creating payment setup session for subscriber ${subscriber_id}`)

    // Check if there's an existing checkout session that's not expired
    if (subscriber.stripe_checkout_session_id) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(
          subscriber.stripe_checkout_session_id
        )

        // If session is still open and not expired (expires after 24 hours)
        if (existingSession.status === 'open' && existingSession.url) {
          console.log(`   Using existing checkout session: ${existingSession.id}`)
          return NextResponse.json({
            success: true,
            checkout_url: existingSession.url,
            session_id: existingSession.id,
          })
        }
      } catch (error) {
        console.log('   Existing session invalid, creating new one')
      }
    }

    // Create new Checkout Session for payment method setup
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: subscriber.stripe_customer_id,
      mode: 'setup',
      payment_method_types: ['card'],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?payment_setup=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?payment_setup=cancelled`,
      metadata: {
        subscriber_id: subscriber.id,
        business_name: subscriber.business_name,
      },
    })

    // Update subscriber with new checkout session ID
    await (supabase as any)
      .from('subscribers')
      .update({
        stripe_checkout_session_id: checkoutSession.id,
      })
      .eq('id', subscriber_id)

    // Log the action
    await (supabase as any)
      .from('commands_log')
      .insert({
        subscriber_id,
        channel: 'system',
        raw_message: 'Payment method setup initiated',
        skill_triggered: 'payment_method_setup',
        success: true,
        metadata: {
          checkout_session_id: checkoutSession.id,
        },
      })

    console.log(`✅ Payment setup session created: ${checkoutSession.id}`)

    return NextResponse.json({
      success: true,
      checkout_url: checkoutSession.url,
      session_id: checkoutSession.id,
    })

  } catch (error: any) {
    console.error('❌ Payment setup session creation failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create payment setup session'
      },
      { status: 500 }
    )
  }
}
