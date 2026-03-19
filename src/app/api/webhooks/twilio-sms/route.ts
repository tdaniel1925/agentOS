/**
 * Twilio SMS Webhook V2 - Natural Language Demo Requests
 *
 * Handles two types of requests:
 * 1. REP SENDS DEMO: "shoot a msg to jim 281-222-9999. hes on the glass business."
 * 2. PROSPECT REQUESTS: "DEMO" or "YES"
 *
 * Features:
 * - AI-powered natural language parsing
 * - Rep phone number lookup
 * - Demo credits system
 * - Personalized SMS generation
 * - Industry-specific prompts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseDemoRequest, generateProspectSMS } from '@/lib/ai/demo-parser'
import { getIndustryPrompt } from '@/lib/ai/industry-prompts'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🚀 SMS webhook called (V2 - NLP enabled)')

    // Load environment variables
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!
    const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER!

    // Create Supabase client - use plain client for webhooks (no cookies)
    console.log('Creating Supabase client...')
    console.log('URL:', SUPABASE_URL)
    console.log('Key exists:', !!SUPABASE_SERVICE_ROLE_KEY)
    console.log('Key length:', SUPABASE_SERVICE_ROLE_KEY?.length)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Supabase client created')

    // Parse form data from Twilio
    const formData = await request.formData()
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    const {
      From: fromPhone,
      To: toPhone,
      Body: messageBody,
      MessageSid: messageSid
    } = params

    console.log(`📨 Incoming SMS from ${fromPhone}: "${messageBody}"`)

    // =============================================
    // CHECK 1: Is sender an Apex rep?
    // =============================================

    console.log('Checking if sender is rep:', fromPhone)
    const repLookup: any = await (supabase as any)
      .from('agentos_reps')
      .select('*')
      .eq('phone', fromPhone)
      .eq('active', true)
      .single()

    console.log('Rep lookup result:', repLookup.error ? `Error: ${repLookup.error.message}` : `Found: ${!!repLookup.data}`)
    const isRep = !!repLookup.data

    // =============================================
    // CHECK 2: Is sender a subscriber?
    // =============================================

    console.log('Checking if sender is subscriber:', fromPhone)
    const subscriberLookup: any = await (supabase as any)
      .from('subscribers')
      .select('*')
      .eq('control_phone', fromPhone)
      .single()

    console.log('Subscriber lookup result:', subscriberLookup.error ? `Error: ${subscriberLookup.error.message}` : `Found: ${!!subscriberLookup.data}`)
    const isSubscriber = !!subscriberLookup.data

    // =============================================
    // PATH A: SUBSCRIBER COMMANDS (connect email, check calls, etc.)
    // =============================================

    if (isSubscriber && !isRep) {
      const subscriber = subscriberLookup.data
      console.log(`✅ Subscriber detected: ${subscriber.email} (${subscriber.bot_name})`)

      // Import command handlers
      const { parseSMSIntent } = await import('@/lib/skills/sms-parser')
      const { executeSkill } = await import('@/lib/skills/executor')

      // Load full context
      const context = await loadSubscriberContext(subscriber.id, supabase)

      // Parse command
      const intent = await parseSMSIntent(messageBody, context)

      console.log('[Subscriber Command]', {
        raw_message: messageBody,
        parsed_intent: intent.intent,
        confidence: intent.confidence
      })

      // Log command
      await (supabase as any).from('commands_log').insert({
        subscriber_id: subscriber.id,
        channel: 'sms',
        raw_message: messageBody,
        skill_triggered: intent.intent,
        success: true,
      })

      // Execute skill
      const result = await executeSkill(intent, context, subscriber)

      // Send response
      if (result.message) {
        await sendSMS(fromPhone, result.message)
      }

      return twilioResponse()
    }

    // =============================================
    // PATH B: REP IS SENDING A DEMO REQUEST
    // =============================================

    if (isRep) {
      const rep = repLookup.data

      console.log(`✅ Rep detected: ${rep.name} (${rep.apex_rep_code})`)

      // Parse request with AI
      const parsed = await parseDemoRequest(messageBody)

      if (parsed.intent !== 'send_demo') {
        await sendSMS(fromPhone, "I didn't quite understand that. Try: 'send demo to John 555-123-4567, he's in real estate'")
        return twilioResponse()
      }

      if (!parsed.prospect_phone) {
        await sendSMS(fromPhone, "I need a phone number. Try: 'send demo to John 555-123-4567'")
        return twilioResponse()
      }

      // Check demo credits
      if (rep.demo_credits_remaining <= 0) {
        if (rep.business_center_tier === 'free') {
          await sendSMS(fromPhone,
            `You've used all your free demos! Upgrade to Business Center ($39/month) for 50 demos/month. Or have prospects text DEMO to ${TWILIO_PHONE_NUMBER}`
          )
          return twilioResponse()
        } else {
          await sendSMS(fromPhone,
            `You've used all ${rep.business_center_tier === 'basic' ? '50' : '999'} demos this month. Resets soon! For now, have prospects text DEMO to ${TWILIO_PHONE_NUMBER}`
          )
          return twilioResponse()
        }
      }

      // Generate personalized SMS
      const prospectSMS = await generateProspectSMS({
        prospect_name: parsed.prospect_name,
        business_type: parsed.business_type,
        rep_name: rep.name
      })

      // Get industry prompt for when they say YES
      const industryPrompt = getIndustryPrompt(
        parsed.business_type,
        parsed.prospect_name,
        rep.name
      )

      // Create pending_demo_requests record
      const pendingResult: any = await (supabase as any)
        .from('pending_demo_requests')
        .insert({
          rep_id: rep.id,
          rep_name: rep.name,
          prospect_name: parsed.prospect_name,
          prospect_phone: parsed.prospect_phone,
          prospect_business_type: parsed.business_type,
          sms_sent: prospectSMS,
          industry_prompt: industryPrompt,
          status: 'awaiting_reply',
          original_message: messageBody,
          parsed_data: parsed
        })
        .select()
        .single()

      if (pendingResult.error) {
        throw pendingResult.error
      }

      // Deduct demo credit
      await (supabase as any)
        .from('agentos_reps')
        .update({
          demo_credits_remaining: rep.demo_credits_remaining - 1,
          last_demo_sent_at: new Date().toISOString()
        })
        .eq('id', rep.id)

      // Log activity
      await (supabase as any)
        .from('demo_activity_log')
        .insert({
          rep_id: rep.id,
          pending_request_id: pendingResult.data.id,
          activity_type: 'demo_requested',
          metadata: {
            prospect_phone: parsed.prospect_phone,
            prospect_name: parsed.prospect_name,
            business_type: parsed.business_type
          }
        })

      // Send personalized SMS to prospect
      await sendSMS(parsed.prospect_phone, prospectSMS)

      // Log SMS sent
      await (supabase as any)
        .from('demo_activity_log')
        .insert({
          rep_id: rep.id,
          pending_request_id: pendingResult.data.id,
          activity_type: 'sms_sent_to_prospect',
          metadata: {
            sms_content: prospectSMS
          }
        })

      // Confirm to rep
      const prospectNameDisplay = parsed.prospect_name || 'prospect'
      const creditsRemaining = rep.demo_credits_remaining - 1
      await sendSMS(fromPhone,
        `✅ Demo request sent to ${prospectNameDisplay}! They'll reply YES when ready. ${creditsRemaining} demos remaining this month.`
      )

      return twilioResponse()
    }

    // =============================================
    // PATH C: PROSPECT IS REPLYING
    // =============================================

    // Check if this is a YES reply to a pending demo
    if (messageBody.trim().toUpperCase() === 'YES') {
      const pendingResult: any = await (supabase as any)
        .from('pending_demo_requests')
        .select('*')
        .eq('prospect_phone', fromPhone)
        .eq('status', 'awaiting_reply')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (pendingResult.data) {
        const pending = pendingResult.data

        // Update status
        await (supabase as any)
          .from('pending_demo_requests')
          .update({
            status: 'confirmed',
            confirmed_at: new Date().toISOString()
          })
          .eq('id', pending.id)

        // Log confirmation
        await (supabase as any)
          .from('demo_activity_log')
          .insert({
            rep_id: pending.rep_id,
            pending_request_id: pending.id,
            activity_type: 'prospect_confirmed',
            metadata: {}
          })

        // Create demo_calls record
        const demoCallResult: any = await (supabase as any)
          .from('demo_calls')
          .insert({
            rep_id: pending.rep_id,
            rep_code: null, // Will be populated by rep lookup
            rep_name: pending.rep_name,
            prospect_phone: fromPhone,
            prospect_name: pending.prospect_name,
            prospect_business_type: pending.prospect_business_type,
            source: 'rep_sms',
            status: 'scheduled',
            metadata: {
              pending_request_id: pending.id,
              original_rep_message: pending.original_message
            }
          })
          .select()
          .single()

        if (demoCallResult.error) {
          throw demoCallResult.error
        }

        // Trigger VAPI call with industry-specific prompt
        const VAPI_API_KEY = process.env.VAPI_API_KEY!
        const VAPI_DEMO_ASSISTANT_ID = process.env.VAPI_DEMO_ASSISTANT_ID!
        const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID!

        const vapiResponse = await fetch('https://api.vapi.ai/call/phone', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phoneNumberId: VAPI_PHONE_NUMBER_ID,
            customer: {
              number: fromPhone
            },
            assistantOverrides: {
              model: {
                messages: [{
                  role: 'system',
                  content: pending.industry_prompt
                }]
              }
            },
            metadata: {
              demo_call_id: demoCallResult.data.id,
              source: 'rep_sms_confirmed',
              rep_id: pending.rep_id,
              business_type: pending.prospect_business_type
            }
          })
        })

        if (!vapiResponse.ok) {
          const errorText = await vapiResponse.text()
          console.error('❌ VAPI call failed:', errorText)
          throw new Error(`VAPI call failed: ${errorText}`)
        }

        const vapiCall = await vapiResponse.json()

        // Update demo_calls with VAPI ID
        await (supabase as any)
          .from('demo_calls')
          .update({
            status: 'in_progress',
            vapi_call_id: vapiCall.id,
            call_started_at: new Date().toISOString()
          })
          .eq('id', demoCallResult.data.id)

        // Log call started
        await (supabase as any)
          .from('demo_activity_log')
          .insert({
            rep_id: pending.rep_id,
            demo_call_id: demoCallResult.data.id,
            pending_request_id: pending.id,
            activity_type: 'demo_call_started',
            metadata: {
              vapi_call_id: vapiCall.id
            }
          })

        // Notify rep
        const repResult: any = await (supabase as any)
          .from('agentos_reps')
          .select('phone')
          .eq('id', pending.rep_id)
          .single()

        if (repResult.data?.phone) {
          const prospectNameDisplay = pending.prospect_name || 'prospect'
          await sendSMS(repResult.data.phone,
            `✅ ${prospectNameDisplay} confirmed! Jordan is calling them now.`
          )
        }

        // Confirm to prospect
        await sendSMS(fromPhone, "Great! You'll receive a call from Jordan in just a moment.")

        return twilioResponse()
      }
    }

    // =============================================
    // PATH D: PROSPECT REQUESTING DEMO DIRECTLY
    // =============================================

    const keyword = messageBody.trim().toUpperCase()

    if (keyword === 'DEMO' || keyword.startsWith('DEMO ')) {
      // Parse optional rep code: "DEMO MJ4829"
      const words = messageBody.trim().split(/\s+/)
      const repIdentifier = words.slice(1).join(' ') || null

      // Look up rep if identifier provided
      let repId: string | null = null
      if (repIdentifier) {
        const repResult: any = await (supabase as any)
          .from('agentos_reps')
          .select('id')
          .or(`apex_rep_code.ilike.%${repIdentifier}%,name.ilike.%${repIdentifier}%`)
          .single()

        if (repResult.data) repId = repResult.data.id
      }

      // Create demo_calls record
      const demoCallResult: any = await (supabase as any)
        .from('demo_calls')
        .insert({
          rep_id: repId,
          rep_code: null,
          rep_name: null,
          prospect_phone: fromPhone,
          prospect_name: null,
          prospect_business_type: null,
          source: 'sms',
          status: 'scheduled',
          metadata: {
            inbound_message: messageBody,
            inbound_sms_sid: messageSid,
            rep_identifier: repIdentifier
          }
        })
        .select()
        .single()

      if (demoCallResult.error) {
        throw demoCallResult.error
      }

      // Trigger VAPI call (standard timed demo)
      const VAPI_API_KEY = process.env.VAPI_API_KEY!
      const VAPI_DEMO_ASSISTANT_ID = process.env.VAPI_DEMO_ASSISTANT_ID!
      const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID!

      const vapiResponse = await fetch('https://api.vapi.ai/call/phone', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assistantId: VAPI_DEMO_ASSISTANT_ID,
          phoneNumberId: VAPI_PHONE_NUMBER_ID,
          customer: {
            number: fromPhone
          },
          metadata: {
            demo_call_id: demoCallResult.data.id,
            source: 'sms_inbound',
            rep_id: repId
          }
        })
      })

      if (!vapiResponse.ok) {
        const errorText = await vapiResponse.text()
        console.error('❌ VAPI call failed:', errorText)
        throw new Error(`VAPI call failed: ${errorText}`)
      }

      const vapiCall = await vapiResponse.json()

      // Update demo_calls
      await (supabase as any)
        .from('demo_calls')
        .update({
          status: 'in_progress',
          vapi_call_id: vapiCall.id,
          call_started_at: new Date().toISOString()
        })
        .eq('id', demoCallResult.data.id)

      // Send confirmation SMS
      const confirmationMessage = repId
        ? `Thanks! Jordan is calling you now to show you how AgentOS works. This demo is courtesy of your agent.`
        : `Thanks! Jordan is calling you now to show you how AgentOS works for just $97/month. Get ready!`

      await sendSMS(fromPhone, confirmationMessage)

      return twilioResponse()
    }

    // =============================================
    // FALLBACK: Unknown message
    // =============================================

    await sendSMS(fromPhone,
      `Text DEMO for a quick demo call, or if you're an Apex rep, describe who to send a demo to (e.g., "send demo to John 555-123-4567, insurance agent")`
    )

    return twilioResponse()

  } catch (error: unknown) {
    console.error('❌ ERROR processing Twilio SMS webhook:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// =============================================
// HELPER FUNCTIONS
// =============================================

async function sendSMS(to: string, body: string): Promise<void> {
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!
  const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER!

  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      To: to,
      From: TWILIO_PHONE_NUMBER,
      Body: body
    })
  })
}

function twilioResponse(): NextResponse {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
    headers: { 'Content-Type': 'text/xml' }
  })
}

async function loadSubscriberContext(subscriberId: string, supabase: any): Promise<any> {
  // Get subscriber
  const subscriberResult: any = await supabase
    .from('subscribers')
    .select('*')
    .eq('id', subscriberId)
    .single()

  const subscriber = subscriberResult.data

  // Get active features
  const featuresResult: any = await supabase
    .from('feature_flags')
    .select('*')
    .eq('subscriber_id', subscriberId)
    .eq('enabled', true)

  const features = featuresResult.data || []

  return {
    subscriber,
    features,
  }
}
