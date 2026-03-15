/**
 * Onboard API Route
 * Triggers the onboarding skill to provision VAPI assistant and phone number
 * Called by Stripe webhook after successful payment
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createVapiAssistant, buyVapiPhoneNumber } from '@/lib/vapi/client'
import { getIndustryPrompt } from '@/lib/vapi/assistants'
import { sendSMS, formatPhoneNumber } from '@/lib/twilio/client'
import { sendEmail } from '@/lib/resend/client'
import { welcomeEmail } from '@/lib/resend/templates'

export async function POST(req: NextRequest) {
  try {
    const { subscriberId } = await req.json()

    if (!subscriberId) {
      return NextResponse.json(
        { error: 'subscriberId is required' },
        { status: 400 }
      )
    }

    // Run onboarding
    await onboardSubscriber(subscriberId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: 'Onboarding failed', details: String(error) },
      { status: 500 }
    )
  }
}

async function onboardSubscriber(subscriberId: string): Promise<void> {
  const supabase = createServiceClient()

  // 1. Load subscriber data
  const subscriberResult: any = await (supabase as any)
    .from('subscribers')
    .select('*')
    .eq('id', subscriberId)
    .single()

  const subscriber = subscriberResult.data
  const error = subscriberResult.error

  if (error || !subscriber) {
    throw new Error(`Subscriber not found: ${subscriberId}`)
  }

  console.log(`Starting onboarding for ${subscriber.name}...`)

  // 2. Select industry pack
  const businessType = subscriber.business_type || 'other'
  const systemPrompt = getIndustryPrompt(businessType)

  // 3. Create VAPI assistant
  let vapiAssistant
  let retryCount = 0
  const maxRetries = 3

  while (retryCount < maxRetries) {
    try {
      vapiAssistant = await createVapiAssistant({
        name: `${subscriber.bot_name}-${subscriber.id}`,
        model: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          systemPrompt: systemPrompt,
        },
        voice: {
          provider: 'playht',
          voiceId: 'jennifer',
        },
        firstMessage: `Thank you for calling ${subscriber.business_name || 'us'}. This is ${subscriber.bot_name}. How can I help you today?`,
        recordingEnabled: true,
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
        },
      })
      break
    } catch (error) {
      retryCount++
      console.error(`VAPI assistant creation attempt ${retryCount} failed:`, error)

      if (retryCount >= maxRetries) {
        // Alert BotMakers and notify subscriber
        await (supabase as any)
          .from('subscribers')
          .update({ status: 'onboard_failed' })
          .eq('id', subscriberId)

        if (subscriber.phone) {
          await sendSMS({
            to: formatPhoneNumber(subscriber.phone),
            body: `Setting up ${subscriber.bot_name} — taking a bit longer than expected. We'll have you ready in ~30 minutes!`,
          })
        }

        throw new Error('VAPI assistant creation failed after retries')
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
    }
  }

  if (!vapiAssistant) {
    throw new Error('VAPI assistant creation failed')
  }

  // Save assistant ID
  await (supabase as any)
    .from('subscribers')
    .update({ vapi_assistant_id: vapiAssistant.id })
    .eq('id', subscriberId)

  console.log(`VAPI assistant created: ${vapiAssistant.id}`)

  // 4. Provision phone number
  let vapiPhone
  try {
    // Try to get area code from subscriber phone
    const areaCode = subscriber.phone?.replace(/\D/g, '').substring(0, 3)

    vapiPhone = await buyVapiPhoneNumber({
      areaCode: areaCode,
      name: `${subscriber.business_name} - ${subscriber.bot_name}`,
      assistantId: vapiAssistant.id,
    })
  } catch (error) {
    console.error('VAPI phone number provisioning failed:', error)

    // Try without area code preference
    try {
      vapiPhone = await buyVapiPhoneNumber({
        name: `${subscriber.business_name} - ${subscriber.bot_name}`,
        assistantId: vapiAssistant.id,
      })
    } catch (retryError) {
      console.error('VAPI phone number retry failed:', retryError)

      // Alert BotMakers for manual resolution
      throw new Error('Phone number provisioning failed')
    }
  }

  // Save phone number
  await (supabase as any)
    .from('subscribers')
    .update({
      vapi_phone_number_id: vapiPhone.id,
      vapi_phone_number: vapiPhone.number,
    })
    .eq('id', subscriberId)

  console.log(`VAPI phone number provisioned: ${vapiPhone.number}`)

  // 5. Create control state
  await (supabase as any).from('control_states').insert({
    subscriber_id: subscriberId,
    outbound_calls_enabled: true,
    social_posting_enabled: true,
    email_sending_enabled: true,
    campaigns_enabled: true,
  })

  // 6. Send welcome SMS
  if (subscriber.phone) {
    const controlNumber = process.env.TWILIO_PHONE_NUMBER || '+16517287626'

    await sendSMS({
      to: formatPhoneNumber(subscriber.phone),
      body: `Welcome to AgentOS! I'm ${subscriber.bot_name}, your new AI employee.

Your new business number: ${vapiPhone.number}
Share it with clients or forward your existing number.

Text me anytime to give me instructions.
Try: "What can you do?"

Your first weekly report arrives Monday morning.
— ${subscriber.bot_name} 🤖`,
    })

    console.log('Welcome SMS sent')
  }

  // 7. Send welcome email
  if (subscriber.email) {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/app`
    const controlNumber = process.env.TWILIO_PHONE_NUMBER || '+16517287626'

    const template = welcomeEmail({
      name: subscriber.name,
      botName: subscriber.bot_name,
      vapiNumber: vapiPhone.number,
      controlNumber: controlNumber,
      dashboardUrl: dashboardUrl,
    })

    await sendEmail({
      to: subscriber.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    console.log('Welcome email sent')
  }

  // 8. Update subscriber status
  await (supabase as any)
    .from('subscribers')
    .update({
      status: 'active',
      onboarded_at: new Date().toISOString(),
    })
    .eq('id', subscriberId)

  console.log(`Onboarding complete for ${subscriber.name}!`)
}
