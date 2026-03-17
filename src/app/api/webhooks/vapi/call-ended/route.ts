/**
 * VAPI Call Ended Webhook
 * Handles end-of-call events from VAPI
 * Saves transcript, runs AI analysis, sends summaries
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio/client'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

const VAPI_WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET

interface VAPICallEndedPayload {
  message: {
    type: 'end-of-call-report'
    call: {
      id: string
      type: 'webCall' | 'phoneCall'
      status: 'ended'
      customer: {
        number: string
      }
      phoneNumber: {
        number: string
      }
      startedAt: string
      endedAt: string
      transcript: string
      recordingUrl?: string
      summary?: string
      analysis?: {
        successEvaluation?: string
      }
      artifact?: {
        messages: Array<{
          role: string
          message: string
        }>
      }
    }
  }
}

/**
 * Analyze call with Claude
 */
async function analyzeCall(transcript: string): Promise<{
  intent: string
  sentiment: string
  summary: string
  actionTaken: string
  nextStep: string
  leadCaptured: boolean
  appointmentBooked: boolean
}> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Analyze this phone call transcript and extract key information:

TRANSCRIPT:
${transcript}

Provide analysis in JSON format:
{
  "intent": "What did the caller want? (1 sentence)",
  "sentiment": "positive | neutral | negative | frustrated | urgent",
  "summary": "Brief summary of the call (2-3 sentences)",
  "actionTaken": "What action did the AI assistant take?",
  "nextStep": "What should happen next?",
  "leadCaptured": boolean (true if caller provided contact info and expressed interest),
  "appointmentBooked": boolean (true if an appointment was scheduled)
}

Focus on business outcomes - did this call result in a lead, appointment, or other valuable action?`
      }]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response')
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Call analysis error:', error)
    return {
      intent: 'Unknown',
      sentiment: 'neutral',
      summary: 'Call completed',
      actionTaken: 'Answered call',
      nextStep: 'No action required',
      leadCaptured: false,
      appointmentBooked: false
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify VAPI webhook secret
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${VAPI_WEBHOOK_SECRET}`) {
      console.error('Invalid VAPI webhook secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload: VAPICallEndedPayload = await req.json()
    const call = payload.message.call

    console.log('[VAPI Webhook] Call ended:', {
      id: call.id,
      duration: (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000,
      hasTranscript: !!call.transcript
    })

    if (!call.transcript) {
      console.log('[VAPI Webhook] No transcript available, skipping processing')
      return NextResponse.json({ received: true })
    }

    const supabase = createServiceClient()

    // Find the call record by VAPI call ID
    const { data: callRecord, error: findError } = await supabase
      .from('calls')
      .select('*, subscriber_id, agent_id')
      .eq('vapi_call_id', call.id)
      .single()

    if (findError || !callRecord) {
      console.error('[VAPI Webhook] Call record not found:', call.id)
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    // Analyze the call with Claude
    const analysis = await analyzeCall(call.transcript)

    // Calculate duration
    const durationSeconds = Math.floor(
      (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000
    )

    // Update call record with transcript and analysis
    const { error: updateError } = await supabase
      .from('calls')
      .update({
        status: 'completed',
        duration_seconds: durationSeconds,
        transcript: call.transcript,
        recording_url: call.recordingUrl,
        ai_intent: analysis.intent,
        ai_sentiment: analysis.sentiment,
        ai_summary: analysis.summary,
        ai_action_taken: analysis.actionTaken,
        ai_next_step: analysis.nextStep,
        lead_captured: analysis.leadCaptured,
        appointment_booked: analysis.appointmentBooked,
        ended_at: call.endedAt
      })
      .eq('id', callRecord.id)

    if (updateError) {
      console.error('[VAPI Webhook] Failed to update call:', updateError)
    }

    // Get subscriber info
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('control_phone, name')
      .eq('id', callRecord.subscriber_id)
      .single()

    if (!subscriber || !subscriber.control_phone) {
      console.log('[VAPI Webhook] No control phone, skipping notification')
      return NextResponse.json({ received: true })
    }

    // Send SMS summary to subscriber
    const callType = callRecord.direction === 'inbound' ? 'Inbound call' : 'Outbound call'
    const contactInfo = callRecord.contact_name || callRecord.caller_number || callRecord.callee_number || 'Unknown'

    let smsBody = `${callType} - ${contactInfo}\n\n`
    smsBody += `${analysis.summary}\n\n`

    if (analysis.leadCaptured) {
      smsBody += `✓ Lead captured\n`
    }

    if (analysis.appointmentBooked) {
      smsBody += `✓ Appointment booked\n`
    }

    if (analysis.nextStep && analysis.nextStep !== 'No action required') {
      smsBody += `\nNext: ${analysis.nextStep}`
    }

    await sendSMS({
      to: subscriber.control_phone,
      body: smsBody
    })

    // Save the notification message
    await supabase
      .from('messages')
      .insert({
        subscriber_id: callRecord.subscriber_id,
        agent_id: callRecord.agent_id,
        direction: 'outbound',
        from_number: process.env.TWILIO_PHONE_NUMBER,
        to_number: subscriber.control_phone,
        body: smsBody,
        message_type: 'post_call_summary',
        status: 'sent',
        call_id: callRecord.id,
        sent_at: new Date().toISOString()
      })

    // If lead was captured, create lead record
    if (analysis.leadCaptured && callRecord.contact_name) {
      const { error: leadError } = await supabase
        .from('leads')
        .insert({
          subscriber_id: callRecord.subscriber_id,
          name: callRecord.contact_name,
          phone: callRecord.caller_number || callRecord.callee_number,
          source: callRecord.direction === 'inbound' ? 'inbound_call' : 'outbound_call',
          call_id: callRecord.id,
          inquiry_type: analysis.intent,
          notes: analysis.summary,
          priority: analysis.sentiment === 'urgent' ? 'urgent' : 'medium',
          followup_status: 'new'
        })

      if (leadError) {
        console.error('[VAPI Webhook] Failed to create lead:', leadError)
      }
    }

    console.log('[VAPI Webhook] Call processing complete:', {
      callId: callRecord.id,
      analyzed: true,
      notified: true,
      leadCreated: analysis.leadCaptured
    })

    return NextResponse.json({ received: true, processed: true })

  } catch (error) {
    console.error('[VAPI Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
