/**
 * Trial Upgrade API Route
 * Converts trial subscribers to paid subscriptions
 * POST /api/trial/upgrade
 */

import { NextRequest, NextResponse } from 'next/server'
import { getStripeServer } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import { STRIPE_PRICES } from '@/lib/stripe/products'

interface UpgradeRequestBody {
  subscriberId: string
  planId?: string // Optional: defaults to AGENTOS_BASE
}

interface Subscriber {
  id: string
  email: string
  name: string
  business_name: string
  bot_name: string
  billing_status: string
  stripe_customer_id: string | null
  trial_started_at: string | null
  trial_ends_at: string | null
}

/**
 * POST /api/trial/upgrade
 *
 * Upgrades a trialing subscriber to a paid subscription
 *
 * Body: {
 *   subscriberId: string
 *   planId?: string (optional, defaults to AGENTOS_BASE)
 * }
 *
 * Returns: {
 *   success: boolean
 *   checkoutUrl?: string
 *   subscriptionId?: string
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: UpgradeRequestBody = await request.json()
    const { subscriberId, planId } = body

    if (!subscriberId) {
      return NextResponse.json(
        { error: 'subscriberId is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    const stripe = getStripeServer()

    // Get subscriber details
    const { data: subscriber, error: fetchError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('id', subscriberId)
      .single()

    if (fetchError || !subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    const subscriberData = subscriber as unknown as Subscriber

    // Verify subscriber is on trial
    if (subscriberData.billing_status !== 'trialing') {
      return NextResponse.json(
        { error: 'Subscriber is not on trial' },
        { status: 400 }
      )
    }

    // Determine which price to use
    const priceId = planId || STRIPE_PRICES.AGENTOS_BASE

    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    // Create or get Stripe customer
    let customerId = subscriberData.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: subscriberData.email,
        name: subscriberData.name,
        metadata: {
          subscriber_id: subscriberId,
          business_name: subscriberData.business_name,
          bot_name: subscriberData.bot_name,
        },
      })
      customerId = customer.id

      // Update subscriber with Stripe customer ID
      await supabase
        .from('subscribers')
        .update({ stripe_customer_id: customerId })
        .eq('id', subscriberId)
    }

    // Create phone number setup fee invoice item
    // This will be added to the first subscription invoice
    await stripe.invoiceItems.create({
      customer: customerId,
      amount: 1500, // $15.00 setup fee in cents
      currency: 'usd',
      description: 'Phone Number Setup Fee',
    })

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          subscriber_id: subscriberId,
          converted_from_trial: 'true',
          trial_started_at: subscriberData.trial_started_at || '',
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?cancelled=true`,
      metadata: {
        subscriber_id: subscriberId,
        includes_setup_fee: 'true',
        setup_fee_amount: '15.00',
        converted_from_trial: 'true',
      },
    })

    // Log the upgrade attempt
    await supabase.from('commands_log').insert({
      subscriber_id: subscriberId,
      skill_triggered: 'trial-upgrade-initiated',
      raw_message: `Trial upgrade checkout session created: ${session.id}`,
      success: true,
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('Trial upgrade error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create upgrade checkout',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/trial/upgrade
 *
 * Get upgrade options for a subscriber
 * Query: ?subscriberId=xxx
 *
 * Returns: {
 *   eligible: boolean
 *   plans: [...available plans]
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const subscriberId = searchParams.get('subscriberId')

    if (!subscriberId) {
      return NextResponse.json(
        { error: 'subscriberId is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get subscriber details
    const { data: subscriber, error: fetchError } = await supabase
      .from('subscribers')
      .select('id, billing_status, trial_started_at, trial_ends_at')
      .eq('id', subscriberId)
      .single()

    if (fetchError || !subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    const isEligible = subscriber.billing_status === 'trialing'
    const trialEndsAt = subscriber.trial_ends_at ? new Date(subscriber.trial_ends_at) : null
    const daysRemaining = trialEndsAt
      ? Math.ceil((trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return NextResponse.json({
      eligible: isEligible,
      billing_status: subscriber.billing_status,
      trial_ends_at: subscriber.trial_ends_at,
      days_remaining: daysRemaining,
      available_plans: [
        {
          id: 'base',
          name: 'AgentOS Base',
          price: 97,
          interval: 'month',
          features: [
            '24/7 AI phone answering',
            'Automated appointment scheduling',
            'Lead capture and management',
            'Email and SMS campaigns',
            'Calendar integration',
          ],
        },
      ],
    })
  } catch (error) {
    console.error('Get upgrade options error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get upgrade options',
      },
      { status: 500 }
    )
  }
}
