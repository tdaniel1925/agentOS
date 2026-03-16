/**
 * VAPI Webhook Handler
 * Handles call events from VAPI (call completed, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleCallCompletion } from '@/lib/skills/outbound-call'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()

    // Verify VAPI webhook signature (if configured)
    const signature = req.headers.get('X-Vapi-Signature')
    const webhookSecret = process.env.VAPI_WEBHOOK_SECRET

    if (webhookSecret && signature) {
      // TODO: Implement signature verification
      // For now, we'll trust the webhook
    }

    // Handle different event types
    const eventType = payload.type || payload.event

    switch (eventType) {
      case 'call.ended':
      case 'call-ended':
        return await handleCallEnded(payload)

      case 'call.started':
      case 'call-started':
        return await handleCallStarted(payload)

      case 'transcript':
        return await handleTranscript(payload)

      default:
        console.log('Unknown VAPI event type:', eventType)
        return new Response('OK', { status: 200 })
    }
  } catch (error) {
    console.error('VAPI webhook error:', error)
    return new Response('Internal error', { status: 500 })
  }
}

/**
 * Handle call ended event
 */
async function handleCallEnded(payload: any): Promise<Response> {
  const supabase = createServiceClient()

  try {
    const callId = payload.call?.id || payload.id
    const assistantId = payload.call?.assistantId || payload.assistantId
    const transcript = payload.call?.transcript || payload.transcript || ''
    const duration = payload.call?.duration || payload.duration || 0 // Duration in seconds
    const metadata = payload.call?.metadata || payload.metadata || {}
    const direction = payload.call?.direction || metadata.direction || 'inbound'
    const phoneNumberId = payload.call?.phoneNumberId || payload.phoneNumberId
    const customerNumber = payload.call?.customer?.number

    // Get subscriber ID from metadata
    const subscriberId = metadata.subscriber_id

    if (!subscriberId) {
      console.error('No subscriber_id in call metadata')
      return new Response('OK', { status: 200 })
    }

    // Get phone number record to link to subscriber
    const phoneResult: any = await (supabase as any)
      .from('subscriber_phone_numbers')
      .select('id, phone_number')
      .eq('subscriber_id', subscriberId)
      .eq('phone_number_id', phoneNumberId)
      .single()

    const phoneRecord = phoneResult.data

    // Convert duration from seconds to minutes
    const durationMinutes = duration / 60

    // Track usage in the database using the PostgreSQL function
    const trackResult = await (supabase as any).rpc('track_call_usage', {
      p_subscriber_id: subscriberId,
      p_duration_minutes: durationMinutes,
      p_direction: direction
    })

    if (trackResult.error) {
      console.error('❌ Failed to track call usage:', trackResult.error)
    } else {
      console.log(`✅ Tracked ${durationMinutes.toFixed(2)} minutes for subscriber ${subscriberId}`)
    }

    // Log the call in call_logs table
    if (phoneRecord) {
      await (supabase as any)
        .from('call_logs')
        .insert({
          subscriber_id: subscriberId,
          phone_number_id: phoneRecord.id,
          vapi_call_id: callId,
          direction,
          from_number: direction === 'outbound' ? phoneRecord.phone_number : customerNumber,
          to_number: direction === 'outbound' ? customerNumber : phoneRecord.phone_number,
          duration_seconds: duration,
          duration_minutes: durationMinutes,
          status: 'completed',
          assistant_id: assistantId,
          transcript,
          started_at: new Date(Date.now() - (duration * 1000)).toISOString(),
          ended_at: new Date().toISOString(),
          metadata
        })
    }

    // Handle the call completion (existing logic)
    await handleCallCompletion({
      callId,
      transcript,
      duration,
      assistantId,
      subscriberId,
      metadata,
    })

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Call ended handling error:', error)
    return new Response('Error', { status: 500 })
  }
}

/**
 * Handle call started event
 */
async function handleCallStarted(payload: any): Promise<Response> {
  const supabase = createServiceClient()

  try {
    const callId = payload.call?.id || payload.id
    const metadata = payload.call?.metadata || payload.metadata || {}

    // Update call_summaries table with call start time
    await (supabase as any)
      .from('call_summaries')
      .update({
        started_at: new Date().toISOString(),
      })
      .eq('vapi_call_id', callId)

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Call started handling error:', error)
    return new Response('OK', { status: 200 })
  }
}

/**
 * Handle transcript event (real-time transcript updates)
 */
async function handleTranscript(payload: any): Promise<Response> {
  // For now, just acknowledge
  // In the future, we could store real-time transcripts
  return new Response('OK', { status: 200 })
}
