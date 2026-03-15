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
    const duration = payload.call?.duration || payload.duration || 0
    const metadata = payload.call?.metadata || payload.metadata || {}

    // Get subscriber ID from metadata
    const subscriberId = metadata.subscriber_id

    if (!subscriberId) {
      console.error('No subscriber_id in call metadata')
      return new Response('OK', { status: 200 })
    }

    // Handle the call completion
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
    await supabase
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
