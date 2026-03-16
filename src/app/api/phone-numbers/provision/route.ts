/**
 * Phone Number Provisioning API
 *
 * POST /api/phone-numbers/provision
 * {
 *   subscriberId: string
 *   phoneNumber: string
 *   areaCode: string
 * }
 *
 * Purchases Twilio number, creates VAPI assistant, imports to VAPI,
 * stores in database, initializes usage tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { provisionPhoneNumber } from '@/lib/phone-numbers/provision'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { subscriberId, phoneNumber, areaCode } = body

    // Validation
    if (!subscriberId || !phoneNumber || !areaCode) {
      return NextResponse.json(
        { error: 'Missing required fields: subscriberId, phoneNumber, areaCode' },
        { status: 400 }
      )
    }

    // Verify subscriber exists
    const { data: subscriber, error: subError } = await supabase
      .from('subscribers')
      .select('*, stripe_customer_id, stripe_subscription_id, stripe_subscription_status')
      .eq('id', subscriberId)
      .single()

    if (subError || !subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    // Check if already has active phone number
    const { data: existingNumber } = await supabase
      .from('subscriber_phone_numbers')
      .select('*')
      .eq('subscriber_id', subscriberId)
      .eq('status', 'active')
      .single()

    if (existingNumber) {
      return NextResponse.json(
        {
          error: 'Subscriber already has an active phone number',
          existingNumber: existingNumber.phone_number
        },
        { status: 400 }
      )
    }

    // Check if subscriber has active subscription
    if (subscriber.stripe_subscription_status !== 'active') {
      return NextResponse.json(
        {
          error: 'Active subscription required to provision phone number',
          status: subscriber.stripe_subscription_status
        },
        { status: 403 }
      )
    }

    // Charge $15 setup fee
    let paymentIntent
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: 1500, // $15.00
        currency: 'usd',
        customer: subscriber.stripe_customer_id,
        description: `Phone number setup fee - ${phoneNumber}`,
        metadata: {
          subscriber_id: subscriberId,
          phone_number: phoneNumber,
          area_code: areaCode,
          type: 'phone_setup_fee'
        },
        // Attempt to charge the default payment method
        payment_method: subscriber.stripe_payment_method_id || undefined,
        confirm: subscriber.stripe_payment_method_id ? true : false,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        }
      })

      // If payment requires action, return client secret
      if (paymentIntent.status === 'requires_action' ||
          paymentIntent.status === 'requires_payment_method') {
        return NextResponse.json(
          {
            requiresPayment: true,
            clientSecret: paymentIntent.client_secret,
            message: 'Payment authentication required'
          },
          { status: 402 }
        )
      }

      // If payment failed
      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment failed: ${paymentIntent.status}`)
      }

    } catch (stripeError: unknown) {
      const errorMessage = stripeError instanceof Error ? stripeError.message : String(stripeError)
      console.error('❌ Setup fee payment failed:', errorMessage)

      return NextResponse.json(
        {
          error: 'Failed to charge setup fee',
          details: errorMessage
        },
        { status: 402 }
      )
    }

    // Log the payment
    await supabase
      .from('cost_events')
      .insert({
        subscriber_id: subscriberId,
        event_type: 'phone_setup_fee',
        amount_usd: 15.00,
        provider: 'stripe',
        transaction_id: paymentIntent.id,
        metadata: {
          phone_number: phoneNumber,
          area_code: areaCode
        }
      })

    // Provision the phone number
    let provisionResult
    try {
      provisionResult = await provisionPhoneNumber(
        subscriberId,
        phoneNumber,
        areaCode
      )
    } catch (provisionError: unknown) {
      const errorMessage = provisionError instanceof Error ? provisionError.message : String(provisionError)
      console.error('❌ Phone provisioning failed after payment:', errorMessage)

      // Refund the setup fee since provisioning failed
      try {
        await stripe.refunds.create({
          payment_intent: paymentIntent.id,
          reason: 'requested_by_customer',
          metadata: {
            reason: 'Phone provisioning failed',
            error: errorMessage
          }
        })
        console.log('✅ Refunded setup fee due to provisioning failure')
      } catch (refundError) {
        console.error('❌ Failed to refund setup fee:', refundError)
      }

      return NextResponse.json(
        {
          error: 'Phone provisioning failed',
          details: errorMessage,
          refunded: true
        },
        { status: 500 }
      )
    }

    // Send confirmation SMS
    const { sendSMS } = await import('@/lib/twilio/client')
    await sendSMS({
      to: subscriber.control_phone,
      body: `🎉 Your Jordan number is ready!\n\n${provisionResult.phoneNumber}\n\nYou have 200 free voice minutes and 500 free SMS included this month. Call Jordan anytime to check emails, make calls, or get help.`
    })

    return NextResponse.json({
      success: true,
      ...provisionResult,
      setupFee: 15.00,
      paymentIntentId: paymentIntent.id,
      includedMinutes: 200,
      includedSMS: 500,
      message: 'Phone number provisioned successfully! Check your phone for details.'
    })

  } catch (error: unknown) {
    console.error('❌ Phone provisioning API error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      {
        error: 'Phone provisioning failed',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
