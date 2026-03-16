/**
 * SMS Command Parser
 * Uses Claude Haiku to parse natural language SMS into structured intents
 */

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface SMSIntent {
  intent: string
  confidence: number
  entities: Record<string, any>
  requires_confirmation: boolean
  is_urgent: boolean
}

/**
 * Parse SMS command into structured intent
 */
export async function parseSMSIntent(
  message: string,
  context: any
): Promise<SMSIntent> {
  try {
    const systemPrompt = `You are an expert at parsing natural language commands into structured intent objects.

Given a text message from a subscriber to their AI assistant, classify the intent and extract relevant entities.

Intent Categories:
- CALL_RELATED: CHECK_MISSED_CALLS, MAKE_OUTBOUND_CALL, UPDATE_GREETING, PAUSE_CALLS, RESUME_CALLS
- EMAIL_RELATED: CONNECT_EMAIL, CHECK_EMAIL, SEND_EMAIL, CREATE_CAMPAIGN, PAUSE_CAMPAIGN, RESUME_CAMPAIGN, CAMPAIGN_REPORT
- SOCIAL_RELATED: CREATE_POST, SCHEDULE_POSTS, SOCIAL_REPORT
- LEAD_RELATED: GENERATE_LEADS, FOLLOW_UP_LEADS
- APPOINTMENT_RELATED: CHECK_SCHEDULE, BOOK_APPOINTMENT, CANCEL_APPOINTMENT
- CONTROL_RELATED: PAUSE_BOT, RESUME_BOT, CHECK_STATUS, ADD_SKILL, REMOVE_SKILL
- REPORT_RELATED: WEEKLY_REPORT, COST_REPORT, CALL_REPORT
- UNKNOWN: Anything that doesn't match above

Entity Extraction:
For CREATE_CAMPAIGN extract: prospect_name, prospect_email, prospect_phone, industry, goal, duration, interval
For GENERATE_LEADS extract: target_type, location, size, qualifier
For CREATE_POST extract: topic, platform, count

Return ONLY valid JSON with this structure:
{
  "intent": "INTENT_NAME",
  "confidence": 0.95,
  "entities": { "key": "value" },
  "requires_confirmation": false,
  "is_urgent": false
}

Be precise. Extract phone numbers, names, durations, and other entities accurately.`

    const userPrompt = `Subscriber context:
- Business: ${context.subscriber.business_type || 'general'}
- Bot name: ${context.subscriber.bot_name}
- Active features: ${context.features.map((f: any) => f.feature_name).join(', ') || 'none'}

Message to parse:
"${message}"

Return JSON only:`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 500,
      temperature: 0,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    // Extract JSON from response
    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const intent = JSON.parse(jsonMatch[0]) as SMSIntent

    // Validate intent structure
    if (!intent.intent || typeof intent.confidence !== 'number') {
      throw new Error('Invalid intent structure')
    }

    return intent
  } catch (error) {
    console.error('SMS parsing error:', error)

    // Return UNKNOWN intent on error
    return {
      intent: 'UNKNOWN',
      confidence: 0.0,
      entities: { error: 'parsing_failed', raw_message: message },
      requires_confirmation: true,
      is_urgent: false,
    }
  }
}
