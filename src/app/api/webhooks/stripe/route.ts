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

      if (session.mode !== 'subscription') {
        console.log('Skipping non-subscription checkout')
        return
      }

      // Check idempotency
      const { data: existingEvent } = await supabase
        .from('upgrade_events')
        .select('id')
        .eq('stripe_event_id', event.id)
        .single()

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
      let { data: subscriber } = await supabase
        .from('subscribers')
        .select('*')
        .eq('email', customerEmail)
        .single()

      if (!subscriber) {
        // This shouldn't happen - subscriber should exist from onboard form
        console.error('Subscriber not found for email:', customerEmail)
        return
      }

      // Update subscriber with Stripe details
      await supabase
        .from('subscribers')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          billing_status: 'active',
          status: 'active',
        })
        .eq('id', subscriber.id)

      // Record idempotency
      await supabase.from('upgrade_events').insert({
        subscriber_id: subscriber.id,
        stripe_event_id: event.id,
        event_type: 'checkout.session.completed',
      })

      // Activate base features
      await supabase.from('feature_flags').insert([
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
      const { data: existingEvent } = await supabase
        .from('upgrade_events')
        .select('id')
        .eq('stripe_event_id', event.id)
        .single()

      if (existingEvent) {
        console.log('Event already processed:', event.id)
        return
      }

      // Find subscriber by subscription ID
      const { data: subscriber } = await supabase
        .from('subscribers')
        .select('*')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (!subscriber) {
        console.error('Subscriber not found for subscription:', subscription.id)
        return
      }

      // Calculate new MRR from subscription items
      const newMrr = subscription.items.data.reduce((total, item) => {
        const amount = item.price.unit_amount || 0
        return total + (amount / 100) // Convert cents to dollars
      }, 0)

      const oldMrr = subscriber.current_mrr

      // Update subscriber MRR
      await supabase
        .from('subscribers')
        .update({ current_mrr: newMrr })
        .eq('id', subscriber.id)

      // Record idempotency
      await supabase.from('upgrade_events').insert({
        subscriber_id: subscriber.id,
        stripe_event_id: event.id,
        event_type: 'customer.subscription.updated',
      })

      // Calculate commission delta
      if (subscriber.rep_id) {
        const eventType = newMrr > oldMrr ? 'upgrade' : 'downgrade'
        await calculateCommission({
          subscriberId: subscriber.id,
          oldMrr,
          newMrr,
          eventType,
          stripeEventId: event.id,
        })
      }

      console.log('Subscription updated for subscriber:', subscriber.id)
      break
    }

    case 'customer.subscription.deleted': {
      // Cancellation
      const subscription = event.data.object as Stripe.Subscription

      const { data: subscriber } = await supabase
        .from('subscribers')
        .select('*')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (!subscriber) {
        console.error('Subscriber not found for subscription:', subscription.id)
        return
      }

      // Update subscriber status
      await supabase
        .from('subscribers')
        .update({
          billing_status: 'cancelled',
          status: 'cancelled',
        })
        .eq('id', subscriber.id)

      // Pause all active campaigns
      await supabase
        .from('campaigns')
        .update({ status: 'paused' })
        .eq('subscriber_id', subscriber.id)
        .eq('status', 'active')

      // Calculate commission loss
      if (subscriber.rep_id) {
        await calculateCommission({
          subscriberId: subscriber.id,
          oldMrr: subscriber.current_mrr,
          newMrr: 0,
          eventType: 'cancellation',
          stripeEventId: event.id,
        })

        await updateRepSubscriberCount(subscriber.rep_id, -1)
      }

      console.log('Subscription cancelled for subscriber:', subscriber.id)
      break
    }

    case 'invoice.payment_failed': {
      // Payment issue - start grace period
      const invoice = event.data.object as Stripe.Invoice

      const { data: subscriber } = await supabase
        .from('subscribers')
        .select('*')
        .eq('stripe_customer_id', invoice.customer as string)
        .single()

      if (!subscriber) {
        console.error('Subscriber not found for customer:', invoice.customer)
        return
      }

      // Update billing status but don't pause bot yet (grace period)
      await supabase
        .from('subscribers')
        .update({
          billing_status: 'past_due',
        })
        .eq('id', subscriber.id)

      // TODO: Send SMS to subscriber about payment issue

      console.log('Payment failed for subscriber:', subscriber.id)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }
}
