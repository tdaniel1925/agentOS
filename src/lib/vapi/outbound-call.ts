/**
 * VAPI Outbound Call Service
 * Creates outbound calls with dynamic system prompts
 */

import { createServiceClient } from '@/lib/supabase/server'

const VAPI_API_KEY = process.env.VAPI_API_KEY
const VAPI_BASE_URL = 'https://api.vapi.ai'

interface OutboundCallParams {
  subscriberId: string
  toNumber: string
  context?: {
    contactName?: string
    purpose?: string
    additionalContext?: string
  }
}

interface VAPIOutboundCallResponse {
  id: string
  type: 'webCall' | 'phoneCall'
  status: 'queued' | 'ringing' | 'in-progress' | 'ended'
  phoneNumber: string
  customer: {
    number: string
  }
  startedAt?: string
  endedAt?: string
}

/**
 * Build dynamic system prompt for outbound call
 */
function buildOutboundSystemPrompt(params: {
  businessName: string
  businessDescription: string
  agentName: string
  personality: string
  faqs: Array<{ question: string; answer: string }>
  context?: {
    contactName?: string
    purpose?: string
    additionalContext?: string
  }
}): string {
  const { businessName, businessDescription, agentName, personality, faqs, context } = params

  let prompt = `You are ${agentName}, the AI assistant for ${businessName}.

About this business: ${businessDescription}

Your personality: ${personality}

`

  // Add FAQs if available
  if (faqs && faqs.length > 0) {
    prompt += `Frequently asked questions you can answer:\n`
    faqs.forEach((faq, i) => {
      prompt += `${i + 1}. Q: ${faq.question}\n   A: ${faq.answer}\n\n`
    })
  }

  // Add outbound call context
  if (context) {
    prompt += `\n--- OUTBOUND CALL CONTEXT ---\n`

    if (context.contactName) {
      prompt += `You are calling: ${context.contactName}\n`
    }

    if (context.purpose) {
      prompt += `Purpose of this call: ${context.purpose}\n`
    }

    if (context.additionalContext) {
      prompt += `Additional context: ${context.additionalContext}\n`
    }

    prompt += `\nCALL OPENING: Start by saying "Hi ${context.contactName || 'there'}, this is ${agentName} calling from ${businessName}. ${context.purpose || 'I wanted to follow up with you.'}"\n`
  }

  prompt += `\nRULES:
- Be natural, warm, and ${personality}
- Never claim to be human if directly asked
- Stay on topic and focused on the purpose of the call
- If the person is not interested, politely thank them and end the call
- If they have questions you cannot answer, offer to have a human call them back
- Always capture a callback number if they want to be contacted again
`

  return prompt
}

/**
 * Create an outbound call via VAPI
 */
export async function createOutboundCall(params: OutboundCallParams): Promise<{
  success: boolean
  callId?: string
  vapiCallId?: string
  error?: string
}> {
  try {
    if (!VAPI_API_KEY) {
      throw new Error('VAPI_API_KEY not configured')
    }

    const supabase = createServiceClient()

    // Get subscriber and agent info
    const { data: subscriber, error: subError }: any = await (supabase as any)
      .from('subscribers')
      .select('*')
      .eq('id', params.subscriberId)
      .single()

    if (subError || !subscriber) {
      return { success: false, error: 'Subscriber not found' }
    }

    // Get agent configuration
    const { data: agent, error: agentError }: any = await (supabase as any)
      .from('agents')
      .select('*')
      .eq('subscriber_id', params.subscriberId)
      .single()

    if (agentError || !agent) {
      return { success: false, error: 'Agent not configured' }
    }

    if (!agent.vapi_assistant_id) {
      return { success: false, error: 'VAPI assistant not provisioned' }
    }

    // Build dynamic system prompt
    const systemPrompt = buildOutboundSystemPrompt({
      businessName: subscriber.business_name || 'our company',
      businessDescription: agent.business_description || '',
      agentName: agent.agent_name || 'Jordan',
      personality: agent.personality || 'professional',
      faqs: agent.faqs || [],
      context: params.context
    })

    // Create outbound call via VAPI API
    const response = await fetch(`${VAPI_BASE_URL}/call/phone`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assistantId: agent.vapi_assistant_id,
        customer: {
          number: params.toNumber
        },
        phoneNumberId: subscriber.vapi_phone_number_id,
        // Override assistant config with dynamic prompt
        assistantOverrides: {
          model: {
            provider: 'openai',
            model: 'gpt-4',
            messages: [{
              role: 'system',
              content: systemPrompt
            }]
          },
          voice: {
            provider: 'azure',
            voiceId: 'andrew'
          }
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('VAPI outbound call failed:', errorData)
      return {
        success: false,
        error: `VAPI API error: ${errorData.message || response.statusText}`
      }
    }

    const vapiCall: VAPIOutboundCallResponse = await response.json()

    // Create call record in database
    const { data: callRecord, error: callError }: any = await (supabase as any)
      .from('calls')
      .insert({
        subscriber_id: params.subscriberId,
        agent_id: agent.id,
        vapi_call_id: vapiCall.id,
        call_type: 'outbound_sms_command',
        direction: 'outbound',
        caller_number: agent.twilio_number,
        callee_number: params.toNumber,
        contact_name: params.context?.contactName,
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (callError) {
      console.error('Failed to create call record:', callError)
      return {
        success: true, // Call was created in VAPI, just logging failed
        vapiCallId: vapiCall.id,
        error: 'Call created but database logging failed'
      }
    }

    return {
      success: true,
      callId: callRecord.id,
      vapiCallId: vapiCall.id
    }

  } catch (error) {
    console.error('Outbound call creation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
