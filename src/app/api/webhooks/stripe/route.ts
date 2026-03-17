/**
 * Stripe Webhook Handler
 * Processes payment events from Stripe
 *
 * CRITICAL SECURITY:
 * - Always verify webhook signature
 * - Check idempotency before processing
 * - Never activate features before payment confirmed
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { verifyWebhookSignature } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import { calculateCommission, updateRepSubscriberCount } from '@/lib/apex/commission'

export async function POST(req: NextRequest) {
  try {
    // Get raw body and signature
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = verifyWebhookSignature(body, signature)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Process event
    await processStripeEvent(event)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function processStripeEvent(event: Stripe.Event): Promise<void> {
  const supabase = createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      // New subscriber paid successfully
      const session = event.data.object as Stripe.Checkout.Session

      // Handle setup fee payment (one-time payment for phone number)
      if (session.metadata?.type === 'setup_fee') {
        await handleSetupFeePayment(session, event.id, supabase)
        return
      }

      if (session.mode !== 'subscription') {
        console.log('Skipping non-subscription checkout')
        return
      }

      // Check idempotency
      const existingEventResult: any = await (supabase as any)
        .from('upgrade_events')
        .select('id')
        .eq('stripe_event_id', event.id)
        .single()

      const existingEvent = existingEventResult.data

      if (existingEvent) {
        console.log('Event already processed:', event.id)
        return
      }

      // Create/update subscriber record
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string
      const customerEmail = session.customer_details?.email

      if (!customerEmail) {
        console.error('No customer email in session')
        return
      }

      // Get or create subscriber
      const subscriberResult: any = await (supabase as any)
        .from('subscribers')
        .select('*')
        .eq('email', customerEmail)
        .single()

      const subscriber = subscriberResult.data

      if (!subscriber) {
        // This shouldn't happen - subscriber should exist from onboard form
        console.error('Subscriber not found for email:', customerEmail)
        return
      }

      // Update subscriber with Stripe details and mark setup fee as paid
      await (supabase as any)
        .from('subscribers')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          billing_status: 'active',
          status: 'active',
          setup_fee_paid: true,
          setup_fee_amount: 15.00,
          setup_fee_paid_at: new Date().toISOString(),
        })
        .eq('id', subscriber.id)

      // Record idempotency
      await (supabase as any).from('upgrade_events').insert({
        subscriber_id: subscriber.id,
        stripe_event_id: event.id,
        event_type: 'checkout.session.completed',
      })

      // Activate base features
      await (supabase as any).from('feature_flags').insert([
        {
          subscriber_id: subscriber.id,
          feature_name: 'calls',
          enabled: true,
          enabled_at: new Date().toISOString(),
        },
        {
          subscriber_id: subscriber.id,
          feature_name: 'appointments',
          enabled: true,
          enabled_at: new Date().toISOString(),
        },
        {
          subscriber_id: subscriber.id,
          feature_name: 'email',
          enabled: true,
          enabled_at: new Date().toISOString(),
        },
      ])

      // Calculate and record commission
      if (subscriber.rep_id) {
        await calculateCommission({
          subscriberId: subscriber.id,
          oldMrr: 0,
          newMrr: 97,
          eventType: 'signup',
          stripeEventId: event.id,
        })

        await updateRepSubscriberCount(subscriber.rep_id, 1)
      }

      // Trigger onboarding (call /api/onboard)
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriberId: subscriber.id }),
      })

      console.log('Checkout completed for subscriber:', subscriber.id)
      break
    }

    case 'customer.subscription.updated': {
      // Plan changed (upgrade or downgrade)
      const subscription = event.data.object as Stripe.Subscription

      // Check idempotency
      const existingEventResult2: any = await (supabase as any)
        .from('upgrade_events')
        .select('id')
        .eq('stripe_event_id', event.id)
        .single()

      const existingEvent2 = existingEventResult2.data

      if (existingEvent2) {
        console.log('Event already processed:', event.id)
        return
      }

      // Find subscriber by subscription ID
      const subscriberResult2: any = await (supabase as any)
        .from('subscribers')
        .select('*')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      const subscriber2 = subscriberResult2.data

      if (!subscriber2) {
        console.error('Subscriber not found for subscription:', subscription.id)
        return
      }

      // Calculate new MRR from subscription items
      const newMrr = subscription.items.data.reduce((total, item) => {
        const amount = item.price.unit_amount || 0
        return total + (amount / 100) // Convert cents to dollars
      }, 0)

      const oldMrr = subscriber2.current_mrr

      // Update subscriber MRR
      await (supabase as any)
        .from('subscribers')
        .update({ current_mrr: newMrr })
        .eq('id', subscriber2.id)

      // Record idempotency
      await (supabase as any).from('upgrade_events').insert({
        subscriber_id: subscriber2.id,
        stripe_event_id: event.id,
        event_type: 'customer.subscription.updated',
      })

      // Calculate commission delta
      if (subscriber2.rep_id) {
        const eventType = newMrr > oldMrr ? 'upgrade' : 'downgrade'
        await calculateCommission({
          subscriberId: subscriber2.id,
          oldMrr,
          newMrr,
          eventType,
          stripeEventId: event.id,
        })
      }

      console.log('Subscription updated for subscriber:', subscriber2.id)
      break
    }

    case 'customer.subscription.deleted': {
      // Cancellation
      const subscription = event.data.object as Stripe.Subscription

      const subscriberResult3: any = await (supabase as any)
        .from('subscribers')
        .select('*')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      const subscriber3 = subscriberResult3.data

      if (!subscriber3) {
        console.error('Subscriber not found for subscription:', subscription.id)
        return
      }

      // Update subscriber status
      await (supabase as any)
        .from('subscribers')
        .update({
          billing_status: 'cancelled',
          status: 'cancelled',
        })
        .eq('id', subscriber3.id)

      // Pause all active campaigns
      await (supabase as any)
        .from('campaigns')
        .update({ status: 'paused' })
        .eq('subscriber_id', subscriber3.id)
        .eq('status', 'active')

      // Calculate commission loss
      if (subscriber3.rep_id) {
        await calculateCommission({
          subscriberId: subscriber3.id,
          oldMrr: subscriber3.current_mrr,
          newMrr: 0,
          eventType: 'cancellation',
          stripeEventId: event.id,
        })

        await updateRepSubscriberCount(subscriber3.rep_id, -1)
      }

      console.log('Subscription cancelled for subscriber:', subscriber3.id)
      break
    }

    case 'invoice.payment_failed': {
      // Payment issue - start grace period
      const invoice = event.data.object as Stripe.Invoice

      const subscriberResult4: any = await (supabase as any)
        .from('subscribers')
        .select('*')
        .eq('stripe_customer_id', invoice.customer as string)
        .single()

      const subscriber4 = subscriberResult4.data

      if (!subscriber4) {
        console.error('Subscriber not found for customer:', invoice.customer)
        return
      }

      // Update billing status but don't pause bot yet (grace period)
      await (supabase as any)
        .from('subscribers')
        .update({
          billing_status: 'past_due',
        })
        .eq('id', subscriber4.id)

      // TODO: Send SMS to subscriber about payment issue

      console.log('Payment failed for subscriber:', subscriber4.id)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }
}

/**
 * Handle setup fee payment and trigger phone number provisioning
 */
async function handleSetupFeePayment(
  session: Stripe.Checkout.Session,
  eventId: string,
  supabase: any
): Promise<void> {
  const { subscriber_id, phone_number, area_code } = session.metadata || {}

  if (!subscriber_id || !phone_number || !area_code) {
    console.error('Missing metadata in setup fee payment:', session.metadata)
    return
  }

  // Check idempotency
  const { data: existingEvent } = await supabase
    .from('upgrade_events')
    .select('id')
    .eq('stripe_event_id', eventId)
    .single()

  if (existingEvent) {
    console.log('Setup fee payment already processed:', eventId)
    return
  }

  // Mark setup fee as paid
  await supabase
    .from('subscribers')
    .update({
      setup_fee_paid: true,
      setup_fee_amount: 15.00,
      setup_fee_paid_at: new Date().toISOString()
    })
    .eq('id', subscriber_id)

  // Record idempotency
  await supabase.from('upgrade_events').insert({
    subscriber_id: subscriber_id,
    stripe_event_id: eventId,
    event_type: 'setup_fee_paid',
  })

  // Trigger phone number provisioning
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/phone-numbers/provision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriberId: subscriber_id,
        phoneNumber: phone_number,
        areaCode: area_code
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Phone provisioning failed:', error)
      // TODO: Refund the setup fee or notify admin
    } else {
      console.log('Phone number provisioned successfully for subscriber:', subscriber_id)
    }
  } catch (error) {
    console.error('Error triggering phone provisioning:', error)
    // TODO: Refund the setup fee or notify admin
  }
}
