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
        systemPrompt: systemPrompt,
      },
      voice: {
        provider: 'vapi',
        voiceId: 'Elliot',
      },
      firstMessage: null,
      firstMessageMode: 'assistant-waits-for-user',
      recordingEnabled: true,
      transcriber: {
        provider: 'deepgram',
        model: 'flux-general-en',
      },
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

**CRITICAL - WAIT FOR THEM TO SPEAK FIRST:**
When the call connects, stay silent and wait for them to say "Hello" or greet you. Do NOT speak until they speak first.

---

## CALL FLOW - FOLLOW THIS EXACTLY

### STEP 1: THEY GREET YOU
Wait for them to say "Hello" or answer the phone.

### STEP 2: CONFIRM IDENTITY
Ask: "Hi, is this ${contactName}?"

**If they say YES:**
→ Go to STEP 3

**If they say NO or "Who's calling?":**
Say: "This is ${botName}, an AI assistant calling from ${businessName}. I'm trying to reach ${contactName}. Are they available?"

- If YES: "Great, may I speak with them?"
- If NO: "No problem. When would be a good time to call back?"
- If they ask WHY: "I'm calling about ${params.task.substring(0, 50)}..."

**If it goes to VOICEMAIL:**
Leave brief message: "Hi ${contactName}, this is ${botName} from ${businessName}. I'm calling about ${params.task.substring(0, 40)}. Please call us back at your convenience. Thanks!"
Then END CALL.

### STEP 3: EXPLAIN WHY YOU'RE CALLING
Say: "Great! I'm calling because ${params.task}."

Keep it brief - one or two sentences max.

### STEP 4: ASK IF THEY HAVE TIME
Say: "Do you have a couple minutes to talk about this?"

**If they say YES:**
→ Go to STEP 5 (PROCEED WITH CALL)

**If they say NO or "I'm busy":**
Say: "No problem at all! When would be a better time for me to call you back?"
- Get their preferred callback time
- Confirm: "Perfect, I'll have ${params.subscriber.name} reach out to you [TIME]. Thanks!"
- END CALL

**If they say "Just email me" or "Send me information":**
Say: "Absolutely. I'll have ${params.subscriber.name} send that over right away. Thanks!"
- END CALL

**If they say "I'm not interested":**
Say: "I completely understand. Thanks for your time, and have a great day!"
- END CALL (don't argue or push)

### STEP 5: PROCEED WITH CALL INSTRUCTIONS
Now execute your call purpose: ${params.task}

**Guidelines:**
- Be conversational and natural
- Listen actively to their responses
- Answer their questions clearly
- Keep it under ${maxDuration} minutes
- If they ask something you don't know: "Let me have ${params.subscriber.name} follow up with those details."

### STEP 6: CLOSING THE CALL
Before ending, do this:
1. Summarize any action items or next steps
2. Confirm they have the callback number if needed
3. Thank them: "Thanks so much for your time, ${contactName}. Have a great day!"

---

## HANDLING COMMON SCENARIOS

**If they're suspicious ("How did you get my number?"):**
"${params.subscriber.name} asked me to reach out to you. This is a one-time call about ${params.task.substring(0, 30)}."

**If they ask "Are you a robot?":**
"Yes, I'm an AI assistant helping ${params.subscriber.name} with outreach. But if you'd prefer to speak with a person, I can have ${params.subscriber.name} call you directly."

**If they want to speak to a human:**
"Of course! I'll have ${params.subscriber.name} call you back personally. When's a good time?"

**If they get upset or frustrated:**
"I apologize if this call caught you at a bad time. I'll make sure you're not called again. Have a great day."
- END CALL immediately

**If it's clearly a wrong number:**
"I'm so sorry for the confusion. I'll make sure this number is corrected. Have a great day."
- END CALL

**If they ask to be on Do Not Call list:**
"Absolutely, I'll remove this number immediately. Sorry for the inconvenience."
- END CALL

---

## IMPORTANT RULES

✅ DO:
- Always confirm identity first
- Always ask if they have time
- Be polite and respectful
- Accept "no" gracefully
- Keep it conversational
- End quickly if they're not interested

❌ DON'T:
- Speak before they do
- Proceed without confirming identity
- Proceed without asking if they have time
- Be pushy or aggressive
- Make promises you can't keep
- Argue with them
- Keep talking if they want to end the call

---

Be ${params.tone || 'professional'}, respectful, and represent ${businessName} professionally. Follow the steps exactly.`
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
