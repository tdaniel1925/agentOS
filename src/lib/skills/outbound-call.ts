/**
 * Outbound Call Skill
 * Creates dynamic VAPI assistants for specific outbound call tasks
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  createVapiAssistant,
  createOutboundCall,
  deleteVapiAssistant,
} from '@/lib/vapi/client'
import { sendSMS } from '@/lib/twilio/client'
import { createServiceClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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
    const systemPrompt = await generateSystemPrompt(params, callType)

    // 3. Create temporary VAPI assistant
    const assistant = await createVapiAssistant({
      name: `${params.subscriber.id}-outbound-${Date.now()}`,
      model: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        systemPrompt: systemPrompt,
      },
      voice: {
        provider: 'playht',
        voiceId: 'jennifer', // Professional female voice
      },
      firstMessage: generateFirstMessage(params),
      recordingEnabled: true,
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
      },
    })

    // 4. Fire the call
    const call = await createOutboundCall({
      phoneNumber: params.contactNumber,
      assistantId: assistant.id,
      metadata: {
        subscriber_id: params.subscriber.id,
        task: params.task,
        contact_name: params.contactName,
        temporary_assistant: true,
      },
    })

    // 5. Log the call initiation
    await supabase.from('call_summaries').insert({
      subscriber_id: params.subscriber.id,
      call_type: 'outbound',
      caller_number: params.contactNumber,
      vapi_call_id: call.id,
      vapi_assistant_id: assistant.id,
      summary: `Calling ${params.contactName || params.contactNumber} about: ${params.task}`,
      created_at: new Date().toISOString(),
    })

    // 6. Confirm to subscriber
    const confirmMessage = `Calling ${params.contactName || params.contactNumber} now. I'll text you a summary when done.`

    await sendSMS({
      to: params.subscriber.contact_phone,
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
      to: params.subscriber.contact_phone,
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
 * Generate custom system prompt using Claude Sonnet
 */
async function generateSystemPrompt(
  params: OutboundCallParams,
  callType: 'business' | 'personal' | 'campaign'
): Promise<string> {
  const maxDuration = callType === 'business' ? 5 : callType === 'personal' ? 2 : 3

  const prompt = `Generate a professional system prompt for a VAPI voice AI assistant making an outbound call.

Call details:
- Calling: ${params.contactName || params.contactNumber}
- Task: ${params.task}
- Subscriber: ${params.subscriber.name}
- Business: ${params.subscriber.business_name || params.subscriber.name}
- Business type: ${params.subscriber.business_type || 'general'}
- Bot name: ${params.subscriber.bot_name}
- Tone: ${params.tone || 'professional'}
- Call type: ${callType}
- Max duration: ${maxDuration} minutes

Create a system prompt that:
1. Instructs the AI to introduce itself properly
2. States the purpose of the call clearly
3. Provides specific instructions for this task
4. Includes escalation rules (when to defer to human)
5. Defines how to end the call professionally
6. Keeps the call brief and respectful

Return ONLY the system prompt text, no other commentary.`

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  return content.text
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
    await supabase
      .from('call_summaries')
      .update({
        summary: summary,
        duration_seconds: params.duration,
        transcript: params.transcript,
        completed_at: new Date().toISOString(),
      })
      .eq('vapi_call_id', params.callId)

    // Get subscriber contact info
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('contact_phone, name')
      .eq('id', params.subscriberId)
      .single()

    if (subscriber?.contact_phone) {
      // Send summary to subscriber
      await sendSMS({
        to: subscriber.contact_phone,
        body: `Call completed with ${params.metadata.contact_name || 'contact'}:\n\n${summary}`,
      })
    }

    // Delete temporary assistant (cleanup)
    if (params.metadata.temporary_assistant) {
      await deleteVapiAssistant(params.assistantId)
    }

    // Log cost event
    const estimatedCost = (params.duration / 60) * 0.15 // Rough estimate: $0.15/minute
    await supabase.from('cost_events').insert({
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
 * Generate call summary using Claude Haiku
 */
async function generateCallSummary(
  transcript: string,
  task: string
): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Summarize this outbound call in 2-3 sentences. Focus on outcome and any action items.

Task: ${task}

Transcript:
${transcript}

Summary:`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return 'Call completed. Unable to generate summary.'
    }

    return content.text
  } catch (error) {
    console.error('Summary generation error:', error)
    return 'Call completed. Summary generation failed.'
  }
}
