/**
 * SMS Command Parser
 * Uses Claude to parse natural language SMS commands from subscribers
 */

import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

interface ParsedCommand {
  action: 'outbound_call' | 'update_config' | 'check_status' | 'stop' | 'start' | 'unknown'
  target?: string // name or phone number
  context?: string // what to say on the call
  confidence: 'high' | 'medium' | 'low'
  needsClarification: boolean
  clarificationQuestion?: string
}

/**
 * Parse SMS command using Claude
 */
export async function parseSMSCommand(
  rawMessage: string,
  subscriberId: string
): Promise<ParsedCommand> {
  try {
    const supabase = createServiceClient()

    // Get subscriber context (recent calls, leads for name resolution)
    const { data: recentCalls }: any = await (supabase as any)
      .from('calls')
      .select('contact_name, caller_number')
      .eq('subscriber_id', subscriberId)
      .order('created_at', { ascending: false })
      .limit(20)

    const { data: leads }: any = await (supabase as any)
      .from('leads')
      .select('name, phone')
      .eq('subscriber_id', subscriberId)
      .order('created_at', { ascending: false })
      .limit(20)

    // Build context for Claude
    let contextInfo = ''
    if (recentCalls && recentCalls.length > 0) {
      contextInfo += '\nRecent contacts:\n'
      recentCalls.forEach((call: any) => {
        if (call.contact_name && call.caller_number) {
          contextInfo += `- ${call.contact_name}: ${call.caller_number}\n`
        }
      })
    }

    if (leads && leads.length > 0) {
      contextInfo += '\nKnown leads:\n'
      leads.forEach((lead: any) => {
        contextInfo += `- ${lead.name}: ${lead.phone}\n`
      })
    }

    // Parse with Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are parsing SMS commands sent by a business owner to their AI assistant.

The business owner sent this message:
"${rawMessage}"
${contextInfo}

Parse this message and extract:
1. ACTION: What do they want to do?
   - outbound_call: They want you to call someone
   - update_config: They want to change settings
   - check_status: They want to know how things are going
   - stop: They want to pause the assistant
   - start: They want to resume the assistant
   - unknown: You can't determine what they want

2. TARGET: Who should be called? (name or phone number)
   - If they mention a name that's in the "Recent contacts" or "Known leads" above, extract the exact name
   - If they provide a phone number, extract it
   - If unclear, leave blank

3. CONTEXT: What should the assistant say or do on the call?
   - Extract the purpose/reason for the call
   - What information should the assistant convey?

4. CONFIDENCE: How sure are you about this parsing?
   - high: Very clear what they want
   - medium: Probably correct but could use confirmation
   - low: Ambiguous, need clarification

5. NEEDS_CLARIFICATION: true/false
   - true if you need more information to execute this command

6. CLARIFICATION_QUESTION: If needs clarification, what question should we ask?

Respond in JSON format:
{
  "action": "outbound_call" | "update_config" | "check_status" | "stop" | "start" | "unknown",
  "target": "name or phone",
  "context": "what to say on call",
  "confidence": "high" | "medium" | "low",
  "needsClarification": boolean,
  "clarificationQuestion": "optional question"
}

Examples:

Message: "call Maria Rodriguez back, she wants to book a consult about her car accident"
Response: {
  "action": "outbound_call",
  "target": "Maria Rodriguez",
  "context": "she wants to book a consultation about her car accident",
  "confidence": "high",
  "needsClarification": false
}

Message: "call john and follow up"
Response: {
  "action": "outbound_call",
  "target": "john",
  "context": "follow up",
  "confidence": "medium",
  "needsClarification": true,
  "clarificationQuestion": "I found multiple Johns in your contacts. Can you provide the phone number or last name?"
}

Message: "call 555-1234 about the quote"
Response: {
  "action": "outbound_call",
  "target": "555-1234",
  "context": "follow up about the quote",
  "confidence": "high",
  "needsClarification": false
}

Now parse the actual message above.`
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

    const parsed: ParsedCommand = JSON.parse(jsonMatch[0])
    return parsed

  } catch (error) {
    console.error('SMS command parsing error:', error)
    return {
      action: 'unknown',
      confidence: 'low',
      needsClarification: true,
      clarificationQuestion: 'Sorry, I didn\'t understand that command. Can you rephrase?'
    }
  }
}

/**
 * Resolve contact name to phone number
 */
export async function resolveContactNumber(
  contactName: string,
  subscriberId: string
): Promise<{ number?: string; ambiguous: boolean; matches: Array<{ name: string; phone: string }> }> {
  try {
    const supabase = createServiceClient()

    // Search in recent calls
    const { data: calls }: any = await (supabase as any)
      .from('calls')
      .select('contact_name, caller_number, callee_number')
      .eq('subscriber_id', subscriberId)
      .ilike('contact_name', `%${contactName}%`)
      .order('created_at', { ascending: false })
      .limit(5)

    // Search in leads
    const { data: leads }: any = await (supabase as any)
      .from('leads')
      .select('name, phone')
      .eq('subscriber_id', subscriberId)
      .ilike('name', `%${contactName}%`)
      .limit(5)

    const matches: Array<{ name: string; phone: string }> = []

    // Collect matches from calls
    if (calls) {
      calls.forEach((call: any) => {
        if (call.contact_name && (call.caller_number || call.callee_number)) {
          matches.push({
            name: call.contact_name,
            phone: call.caller_number || call.callee_number
          })
        }
      })
    }

    // Collect matches from leads
    if (leads) {
      leads.forEach((lead: any) => {
        if (lead.name && lead.phone) {
          matches.push({
            name: lead.name,
            phone: lead.phone
          })
        }
      })
    }

    // Deduplicate by phone number
    const uniqueMatches = matches.reduce((acc, match) => {
      if (!acc.find(m => m.phone === match.phone)) {
        acc.push(match)
      }
      return acc
    }, [] as Array<{ name: string; phone: string }>)

    if (uniqueMatches.length === 0) {
      return { ambiguous: false, matches: [] }
    }

    if (uniqueMatches.length === 1) {
      return {
        number: uniqueMatches[0].phone,
        ambiguous: false,
        matches: uniqueMatches
      }
    }

    // Multiple matches - ambiguous
    return {
      ambiguous: true,
      matches: uniqueMatches
    }

  } catch (error) {
    console.error('Contact resolution error:', error)
    return { ambiguous: false, matches: [] }
  }
}

/**
 * Extract phone number from text
 */
export function extractPhoneNumber(text: string): string | null {
  // Remove common formatting characters
  const cleaned = text.replace(/[\s\-\(\)\.]/g, '')

  // Match 10-digit or 11-digit (with country code) numbers
  const match = cleaned.match(/(?:1)?(\d{10})/)

  if (match) {
    // Return in E.164 format
    return `+1${match[1]}`
  }

  return null
}
