/**
 * Claim Agent API Route - Signup V2
 * Final step in Rosie-style signup flow
 * Creates subscriber account with 7-day free trial
 * Supports both OAuth and email/password signup
 * Agent 6: OAuth Integration & Claim Agent
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSubscriberFromOAuth, createSubscriberFromEmail } from '@/lib/auth/oauth-providers'
import { sendEmail } from '@/lib/resend/client'
import { provisionSubscriberPhoneNumber } from '@/lib/twilio/provisioning'
import { sendSMS, formatPhoneNumber } from '@/lib/twilio/client'
import { createServiceClient } from '@/lib/supabase/server'
import { alertPhoneProvisioningFailure, alertStripeSubscriptionFailure } from '@/lib/alerts/admin-notifications'
import Stripe from 'stripe'
import type { BusinessDetails } from '@/types/signup-v2'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

interface ClaimAgentRequest {
  // Auth method 1: Email/Password
  email?: string
  password?: string
  name?: string

  // Auth method 2: OAuth (Supabase Auth creates user automatically)
  oauth_provider?: 'google' | 'microsoft'
  oauth_user_data?: {
    email: string
    name: string | null
    provider_id: string
  }

  // Required for both methods
  assistant_id: string
  business_data: {
    name: string
    phone: string | null
    website: string | null
    address: string
    hours: object | null
    rating: number | null
    review_count: number | null
    place_id: string
    formatted_address: string
    latitude: number
    longitude: number
    business_type?: string
  }
}

interface ClaimAgentResponse {
  success: boolean
  subscriber_id: string
  trial_ends_at: string
  error?: string
}

export async function POST(req: NextRequest): Promise<NextResponse<ClaimAgentResponse>> {
  try {
    const body: ClaimAgentRequest = await req.json()

    const {
      email,
      password,
      name,
      oauth_provider,
      oauth_user_data,
      assistant_id,
      business_data,
    } = body

    // Validate required fields
    if (!assistant_id) {
      return NextResponse.json(
        { success: false, subscriber_id: '', trial_ends_at: '', error: 'assistant_id is required' },
        { status: 400 }
      )
    }

    if (!business_data || !business_data.name) {
      return NextResponse.json(
        { success: false, subscriber_id: '', trial_ends_at: '', error: 'business_data is required' },
        { status: 400 }
      )
    }

    let subscriberId: string
    let trialEndsAt: string
    let userEmail: string
    let userName: string

    // Prepare business data for database
    const dbBusinessData = {
      business_name: business_data.name,
      business_phone: business_data.phone,
      business_website: business_data.website,
      business_address: business_data.formatted_address,
      business_type: business_data.business_type,
      google_place_id: business_data.place_id,
      business_hours: business_data.hours || undefined,
      google_rating: business_data.rating || undefined,
      google_review_count: business_data.review_count || undefined,
    }

    // Method 1: OAuth signup
    // For OAuth, Supabase Auth already created the auth user
    // We just need to create the subscriber record
    if (oauth_provider && oauth_user_data) {
      const result = await createSubscriberFromOAuth(
        oauth_user_data.provider_id,
        oauth_user_data.email,
        oauth_user_data.name,
        oauth_provider,
        assistant_id,
        dbBusinessData
      )

      subscriberId = result.subscriber_id
      trialEndsAt = result.trial_ends_at
      userEmail = oauth_user_data.email
      userName = oauth_user_data.name || business_data.name
    }
    // Method 2: Email/Password signup
    else if (email && password) {
      const result = await createSubscriberFromEmail(
        email,
        password,
        name || business_data.name,
        assistant_id,
        dbBusinessData
      )

      subscriberId = result.subscriber_id
      trialEndsAt = result.trial_ends_at
      userEmail = email
      userName = name || business_data.name
    }
    // Invalid request
    else {
      return NextResponse.json(
        {
          success: false,
          subscriber_id: '',
          trial_ends_at: '',
          error: 'Either email/password or OAuth credentials required'
        },
        { status: 400 }
      )
    }

    // PROVISION DEDICATED TWILIO NUMBER (Voice + SMS)
    let twilioPhoneNumber: string | null = null
    let twilioPhoneNumberSid: string | null = null

    try {
      console.log(`📞 Provisioning Twilio number for subscriber ${subscriberId}`)

      // Extract area code from business phone
      const businessPhone = business_data.phone || ''
      const areaCode = businessPhone.replace(/\D/g, '').substring(0, 3)

      // Provision Twilio number (voice + SMS) and auto-associate with A2P campaign
      const provisionedNumber = await provisionSubscriberPhoneNumber({
        areaCode: areaCode || undefined,
        businessName: business_data.business_name,
        subscriberId: subscriberId,
        vapiAssistantId: assistant_id, // For forwarding voice calls to VAPI
      })

      twilioPhoneNumber = provisionedNumber.phoneNumber
      twilioPhoneNumberSid = provisionedNumber.phoneNumberSid

      // Update subscriber with phone number
      const supabase = createServiceClient()
      await (supabase as any)
        .from('subscribers')
        .update({
          phone_number: provisionedNumber.phoneNumber,
          phone_number_sid: provisionedNumber.phoneNumberSid,
          vapi_assistant_id: assistant_id, // Keep VAPI assistant for AI voice
        })
        .eq('id', subscriberId)

      console.log(`✅ Phone provisioned: ${provisionedNumber.phoneNumber}`)
      console.log(`✅ Auto-associated with A2P campaign for SMS compliance`)
    } catch (phoneError) {
      console.error('⚠️ Phone provisioning failed:', phoneError)

      // Send admin alert
      await alertPhoneProvisioningFailure(
        subscriberId,
        business_data.business_name,
        phoneError instanceof Error ? phoneError.message : String(phoneError),
        1
      )

      // Don't fail the whole signup - we can provision later
    }

    // CREATE STRIPE SUBSCRIPTION WITH 7-DAY TRIAL
    try {
      console.log(`💳 Creating Stripe subscription for ${userEmail}`)

      // Create or get Stripe customer
      let stripeCustomer
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1
      })

      if (existingCustomers.data.length > 0) {
        stripeCustomer = existingCustomers.data[0]
      } else {
        stripeCustomer = await stripe.customers.create({
          email: userEmail,
          name: userName,
          metadata: {
            subscriber_id: subscriberId,
            business_name: business_data.business_name,
          }
        })
      }

      // Get the base product price ID from env
      const priceId = process.env.STRIPE_PRICE_ID_BASE || 'price_1QpcX4HdUWxMuNL5YpQkKLEq' // $97/month

      // Create Checkout Session for payment method collection
      // User can add payment method anytime during trial
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomer.id,
        mode: 'setup',
        payment_method_types: ['card'],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?payment_setup=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?payment_setup=cancelled`,
        metadata: {
          subscriber_id: subscriberId,
          business_name: business_data.business_name,
        },
      })

      // Create subscription with 7-day trial
      // It will automatically charge the saved payment method on day 8
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{ price: priceId }],
        trial_period_days: 7,
        metadata: {
          subscriber_id: subscriberId,
          business_name: business_data.business_name,
          signup_flow: 'signup-v2',
        },
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
      })

      // Update subscriber with Stripe details
      const supabase = createServiceClient()
      await (supabase as any)
        .from('subscribers')
        .update({
          stripe_customer_id: stripeCustomer.id,
          stripe_subscription_id: subscription.id,
          stripe_checkout_session_id: checkoutSession.id,
          payment_method_added: false,
        })
        .eq('id', subscriberId)

      console.log(`✅ Stripe subscription created: ${subscription.id}`)
      console.log(`✅ Checkout session created: ${checkoutSession.id}`)
    } catch (stripeError) {
      console.error('⚠️ Stripe subscription creation failed:', stripeError)

      // Send admin alert
      await alertStripeSubscriptionFailure(
        subscriberId,
        business_data.business_name,
        stripeError instanceof Error ? stripeError.message : String(stripeError)
      )

      // Don't fail signup - user can still use trial and we can add payment method later
    }

    // SEND WELCOME SMS
    if (twilioPhoneNumber && business_data.phone) {
      try {
        await sendSMS({
          to: formatPhoneNumber(business_data.phone),
          from: twilioPhoneNumber, // Send from subscriber's own number
          body: `Welcome to Jordyn! 🎉

Your AI receptionist is ready at ${twilioPhoneNumber}

Forward your existing number to Jordyn or share this new number with clients. Text me anytime to give instructions!

Try: "What can you do?"

— Jordyn 💜`,
        })
        console.log('✅ Welcome SMS sent')
      } catch (smsError) {
        console.error('⚠️ Welcome SMS failed:', smsError)
        // Don't fail signup
      }
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(userEmail, userName, business_data.name, trialEndsAt, twilioPhoneNumber)
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the whole request if email fails
    }

    // Return success
    return NextResponse.json({
      success: true,
      subscriber_id: subscriberId,
      trial_ends_at: trialEndsAt,
    })

  } catch (error: any) {
    console.error('Claim agent error:', error)
    return NextResponse.json(
      {
        success: false,
        subscriber_id: '',
        trial_ends_at: '',
        error: error.message || 'Failed to claim agent'
      },
      { status: 500 }
    )
  }
}

/**
 * Send welcome email to new subscriber
 */
async function sendWelcomeEmail(
  email: string,
  name: string,
  businessName: string,
  trialEndsAt: string,
  phoneNumber?: string | null
): Promise<void> {
  const trialEndDate = new Date(trialEndsAt)
  const formattedDate = trialEndDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to AgentOS</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1B3A7D 0%, #C7181F 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to AgentOS!</h1>
    </div>

    <!-- Main Content -->
    <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>

      <p style="font-size: 16px; margin-bottom: 20px;">
        Your custom Jordyn agent for <strong>${businessName}</strong> is ready!
      </p>

      <div style="background: #f3f4f6; border-left: 4px solid #1B3A7D; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #666;">
          <strong style="color: #1B3A7D; font-size: 16px;">Your 7-Day Free Trial</strong>
        </p>
        <p style="margin: 10px 0 0 0; font-size: 16px;">
          Trial ends: <strong>${formattedDate}</strong>
        </p>
      </div>

      ${phoneNumber ? `
      <div style="background: linear-gradient(135deg, #9333ea, #ec4899); border-radius: 10px; padding: 25px; margin: 30px 0; text-align: center;">
        <p style="color: white; font-size: 14px; margin: 0 0 10px 0; opacity: 0.9;">Your Jordyn Number</p>
        <p style="color: white; font-size: 28px; font-weight: bold; margin: 0; letter-spacing: 1px;">${phoneNumber}</p>
        <p style="color: white; font-size: 14px; margin: 15px 0 0 0; opacity: 0.9;">Forward your existing number here or share with clients!</p>
      </div>
      ` : ''}

      <h2 style="color: #1B3A7D; font-size: 20px; margin-top: 30px;">What's Next?</h2>

      <ol style="padding-left: 20px;">
        <li style="margin-bottom: 15px;">
          <strong>Log into your dashboard</strong> to customize Jordyn's settings
        </li>
        <li style="margin-bottom: 15px;">
          <strong>Test your agent</strong> by calling or texting
        </li>
        <li style="margin-bottom: 15px;">
          <strong>Add features</strong> like email, calendar, or social media
        </li>
        <li style="margin-bottom: 15px;">
          <strong>Choose your plan</strong> on day 7 to keep using Jordyn
        </li>
      </ol>

      <div style="text-align: center; margin: 40px 0 20px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.theapexbots.com'}/app"
           style="display: inline-block; background: #1B3A7D; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
          Go to Dashboard
        </a>
      </div>

      <p style="font-size: 14px; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        Questions? Reply to this email or visit our help center.
      </p>

      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        Welcome aboard!<br>
        <strong>The AgentOS Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p>AgentOS by BotMakers Inc.</p>
      <p style="margin: 5px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://theapexbots.com'}" style="color: #1B3A7D; text-decoration: none;">theapexbots.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
Welcome to AgentOS!

Hi ${name},

Your custom Jordyn agent for ${businessName} is ready!

YOUR 7-DAY FREE TRIAL
Trial ends: ${formattedDate}

WHAT'S NEXT?
1. Log into your dashboard to customize Jordyn's settings
2. Test your agent by calling or texting
3. Add features like email, calendar, or social media
4. Choose your plan on day 7 to keep using Jordyn

Go to Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://app.theapexbots.com'}/app

Questions? Reply to this email or visit our help center.

Welcome aboard!
The AgentOS Team

AgentOS by BotMakers Inc.
${process.env.NEXT_PUBLIC_APP_URL || 'https://theapexbots.com'}
  `

  await sendEmail({
    to: email,
    subject: `Welcome to AgentOS - Your Jordyn Agent for ${businessName} is Ready!`,
    html,
    text,
  })
}
