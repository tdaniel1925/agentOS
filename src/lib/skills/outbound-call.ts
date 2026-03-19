/**
 * Outbound Call Skill
 * Creates dynamic VAPI assistants for specific outbound call tasks
 */

import {
  createVapiAssistant,
  createOutboundCall,
  deleteVapiAssistant,
} from '@/lib/vapi/client'
import { sendSMS } from '@/lib/twilio/client'
import { createServiceClient } from '@/lib/supabase/server'

interface OutboundCallParams {
  contactName?: string
  contactNumber: string
  task: string
  tone?: 'professional' | 'casual' | 'urgent'
  subscriber: any
  context: any
}

/**
 * Main function to create and fire an outbound call
 */
export async function makeOutboundCall(
  params: OutboundCallParams
): Promise<{ success: boolean; message: string }> {
  const supabase = createServiceClient()

  try {
    // 1. Detect call type
    const callType = detectCallType(params.task)

    // 2. Generate custom system prompt
    const systemPrompt = generateSystemPrompt(params, callType)

    // 3. Create temporary VAPI assistant
    // Keep name under 40 chars: use first 8 chars of subscriber ID + timestamp
    const shortId = params.subscriber.id.substring(0, 8)
    const timestamp = Date.now().toString().slice(-10)
    const assistant = await createVapiAssistant({
      name: `ob-${shortId}-${timestamp}`,
      model: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.8,
        systemPrompt: systemPrompt,
      },
      voice: {
        provider: 'vapi',
        voiceId: 'Elliot',
      },
      firstMessage: generateFirstMessage(params),
      recordingEnabled: true,
      transcriber: {
        provider: 'deepgram',
        model: 'flux-general-en',
        language: 'en',
      },
      silenceTimeoutSeconds: 10,
      maxDurationSeconds: 300,
      voicemailDetectionEnabled: true,
      backgroundSound: 'off',
      firstMessageMode: 'assistant-waits-for-user',
    })

    // 4. Get subscriber's VAPI phone number ID from database
    const phoneNumberIdResult: any = await (supabase as any)
      .from('subscribers')
      .select('vapi_phone_number_id')
      .eq('id', params.subscriber.id)
      .single()

    if (!phoneNumberIdResult.data?.vapi_phone_number_id) {
      throw new Error('No VAPI phone number configured for this subscriber')
    }

    const vapiPhoneNumberId = phoneNumberIdResult.data.vapi_phone_number_id

    // 5. Fire the call using the subscriber's phone number
    const call = await createOutboundCall({
      phoneNumber: params.contactNumber,
      assistantId: assistant.id,
      phoneNumberId: vapiPhoneNumberId,
      metadata: {
        subscriber_id: params.subscriber.id,
        task: params.task,
        contact_name: params.contactName,
        temporary_assistant: true,
      },
    })

    // 6. Log the call initiation
    await (supabase as any).from('call_summaries').insert({
      subscriber_id: params.subscriber.id,
      call_type: 'outbound',
      caller_number: params.contactNumber,
      vapi_call_id: call.id,
      vapi_assistant_id: assistant.id,
      summary: `Calling ${params.contactName || params.contactNumber} about: ${params.task}`,
      created_at: new Date().toISOString(),
    })

    // 7. Confirm to subscriber
    const confirmMessage = `Calling ${params.contactName || params.contactNumber} now. I'll text you a summary when done.`

    await sendSMS({
      to: params.subscriber.control_phone,
      body: confirmMessage,
    })

    return {
      success: true,
      message: confirmMessage,
    }
  } catch (error) {
    console.error('Outbound call error:', error)

    // Notify subscriber of failure
    await sendSMS({
      to: params.subscriber.control_phone,
      body: `Couldn't connect the call to ${params.contactName || params.contactNumber}. Error: ${error}`,
    })

    return {
      success: false,
      message: 'Call creation failed',
    }
  }
}

/**
 * Detect call type from task description
 */
function detectCallType(task: string): 'business' | 'personal' | 'campaign' {
  const taskLower = task.toLowerCase()

  // Business keywords
  if (
    taskLower.includes('renewal') ||
    taskLower.includes('quote') ||
    taskLower.includes('policy') ||
    taskLower.includes('appointment') ||
    taskLower.includes('follow up') ||
    taskLower.includes('lead') ||
    taskLower.includes('client')
  ) {
    return 'business'
  }

  // Personal keywords
  if (
    taskLower.includes('lunch') ||
    taskLower.includes('dinner') ||
    taskLower.includes('coffee') ||
    taskLower.includes('personal')
  ) {
    return 'personal'
  }

  // Campaign keywords
  if (
    taskLower.includes('campaign') ||
    taskLower.includes('blast') ||
    taskLower.includes('batch')
  ) {
    return 'campaign'
  }

  // Default to business
  return 'business'
}

/**
 * Generate custom system prompt template
 */
function generateSystemPrompt(
  params: OutboundCallParams,
  callType: 'business' | 'personal' | 'campaign'
): string {
  const maxDuration = callType === 'business' ? 5 : callType === 'personal' ? 2 : 3
  const contactName = params.contactName || 'there'
  const botName = params.subscriber.bot_name || 'the assistant'
  const businessName = params.subscriber.business_name || params.subscriber.name

  return `You are ${botName}, an AI assistant calling on behalf of ${businessName}.

**CALL PURPOSE:**
${params.task}

**YOUR APPROACH:**
- Be ${params.tone || 'professional'} and respectful
- Introduce yourself: "Hi ${contactName}, this is ${botName} calling from ${businessName}."
- State your purpose clearly and briefly
- Listen actively and respond naturally
- Keep the call under ${maxDuration} minutes
- If asked about complex details, offer to have ${params.subscriber.name} call them back

**ESCALATION RULES:**
- If they want to speak to a human, say: "I'll have ${params.subscriber.name} call you back directly."
- If you can't answer something, admit it: "Let me have ${params.subscriber.name} follow up with those details."
- If they're upset or frustrated, apologize and offer: "I understand. Let me have ${params.subscriber.name} reach out to you personally."

**ENDING THE CALL:**
- Summarize any next steps
- Thank them for their time
- End politely: "Thanks ${contactName}, have a great day!"

**IMPORTANT:**
- Be conversational, not robotic
- Don't make promises you can't keep
- Don't pressure or be pushy
- Respect if they want to end the call

Stay on task, be helpful, and represent ${businessName} professionally.`
}

/**
 * Generate first message for the call
 */
function generateFirstMessage(params: OutboundCallParams): string {
  const greeting = `Hi${params.contactName ? ` ${params.contactName}` : ''}, this is ${params.subscriber.bot_name}, ${params.subscriber.name}'s AI assistant from ${params.subscriber.business_name || params.subscriber.name}.`

  return greeting
}

/**
 * Handle call completion (called by VAPI webhook)
 */
export async function handleCallCompletion(params: {
  callId: string
  transcript: string
  duration: number
  assistantId: string
  subscriberId: string
  metadata: any
}): Promise<void> {
  const supabase = createServiceClient()

  try {
    // Generate call summary using Claude Haiku
    const summary = await generateCallSummary(params.transcript, params.metadata.task)

    // Update call_summaries table
    await (supabase as any)
      .from('call_summaries')
      .update({
        summary: summary,
        duration_seconds: params.duration,
        transcript: params.transcript,
        completed_at: new Date().toISOString(),
      })
      .eq('vapi_call_id', params.callId)

    // Get subscriber contact info
    const subscriberQueryResult: any = await (supabase as any)
      .from('subscribers')
      .select('control_phone, name')
      .eq('id', params.subscriberId)
      .single()

    const subscriber = subscriberQueryResult.data

    if (subscriber?.control_phone) {
      // Send summary to subscriber
      await sendSMS({
        to: subscriber.control_phone,
        body: `Call completed with ${params.metadata.contact_name || 'contact'}:\n\n${summary}`,
      })
    }

    // Delete temporary assistant (cleanup)
    if (params.metadata.temporary_assistant) {
      await deleteVapiAssistant(params.assistantId)
    }

    // Log cost event
    const estimatedCost = (params.duration / 60) * 0.15 // Rough estimate: $0.15/minute
    await (supabase as any).from('cost_events').insert({
      subscriber_id: params.subscriberId,
      event_type: 'vapi_outbound_call',
      cost_usd: estimatedCost,
      metadata: {
        call_id: params.callId,
        duration: params.duration,
        task: params.metadata.task,
      },
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Call completion handling error:', error)
  }
}

/**
 * Generate call summary from transcript
 */
async function generateCallSummary(
  transcript: string,
  task: string
): Promise<string> {
  // For now, return the transcript directly
  // TODO: Add AI summarization if needed
  if (!transcript || transcript.length < 10) {
    return `Call completed. Task: ${task}. No transcript available.`
  }

  return `Call completed.\n\nTask: ${task}\n\nTranscript:\n${transcript.substring(0, 500)}${transcript.length > 500 ? '...' : ''}`
}
