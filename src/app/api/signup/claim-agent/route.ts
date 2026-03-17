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
import type { BusinessDetails } from '@/types/signup-v2'

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

    // Send welcome email
    try {
      await sendWelcomeEmail(userEmail, userName, business_data.name, trialEndsAt)
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
  trialEndsAt: string
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
