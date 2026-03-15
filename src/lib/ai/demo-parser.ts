/**
 * AI-Powered Demo Request Parser
 *
 * Uses Claude to parse natural language demo requests from reps
 * Examples:
 * - "shoot a msg to jim 281-222-9999. hes on the glass business."
 * - "send demo to Jenny 555-867-5309 - she runs a real estate agency"
 * - "call Sarah at 651-555-1234, insurance agent"
 */

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export interface ParsedDemoRequest {
  intent: 'send_demo' | 'unknown'
  prospect_name: string | null
  prospect_phone: string | null
  business_type: string | null
  notes: string | null
}

/**
 * Parse natural language demo request using Claude
 */
export async function parseDemoRequest(message: string): Promise<ParsedDemoRequest> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0,
      messages: [{
        role: 'user',
        content: `Parse this demo request message and extract structured data.

MESSAGE: "${message}"

Return ONLY valid JSON with these exact fields:
{
  "intent": "send_demo" | "unknown",
  "prospect_name": "string or null",
  "prospect_phone": "string in E.164 format (+1XXXXXXXXXX) or null",
  "business_type": "string or null (e.g., 'real estate', 'insurance', 'glass business')",
  "notes": "any other relevant context or null"
}

Rules:
- intent is "send_demo" if they want to send a demo to someone
- intent is "unknown" if it's not a demo request
- Normalize phone to E.164: +1XXXXXXXXXX
- Extract business type/industry if mentioned
- Be lenient with typos and informal language

JSON:`
      }]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const parsed = JSON.parse(content.text.trim())
    return parsed as ParsedDemoRequest

  } catch (error) {
    console.error('Error parsing demo request:', error)
    return {
      intent: 'unknown',
      prospect_name: null,
      prospect_phone: null,
      business_type: null,
      notes: null
    }
  }
}

/**
 * Generate personalized SMS to prospect using AI
 */
export async function generateProspectSMS(params: {
  prospect_name: string | null
  business_type: string | null
  rep_name: string
}): Promise<string> {
  const { prospect_name, business_type, rep_name } = params

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // Faster and cheaper
      max_tokens: 200,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: `Generate a warm, personalized SMS (under 160 characters) introducing Jordan (an AI assistant) to a prospect.

CONTEXT:
- Prospect name: ${prospect_name || 'there'}
- Business type: ${business_type || 'their business'}
- Referred by: ${rep_name}

REQUIREMENTS:
- Friendly, professional tone
- Mention their specific industry if known
- Clear call-to-action: "Reply YES for a 2-min demo"
- Under 160 characters
- Don't use emojis

SMS MESSAGE:`
      }]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    return content.text.trim()

  } catch (error) {
    console.error('Error generating SMS:', error)

    // Fallback to template
    const name = prospect_name ? `Hi ${prospect_name}! ` : 'Hi! '
    const industry = business_type ? `about ${business_type} automation` : 'about AI automation'
    return `${name}${rep_name} wanted me to reach out ${industry}. I'm Jordan - reply YES for a quick demo!`
  }
}
