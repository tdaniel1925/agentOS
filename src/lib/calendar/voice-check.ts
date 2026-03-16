/**
 * Voice Calendar Check via VAPI
 *
 * Creates dynamic VAPI assistants that read calendar schedules aloud
 */

import { EventForVoice, formatEventsForVoice } from './format'
import { CalendarEvent } from '@/lib/email/microsoft'

const VAPI_API_KEY = process.env.VAPI_API_KEY!
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID!

/**
 * Generate system prompt for calendar voice assistant
 */
export function generateCalendarVoicePrompt(
  events: EventForVoice[],
  userName: string,
  period: 'today' | 'week'
): string {
  const periodText = period === 'today' ? 'today' : 'this week'
  const eventCount = events.length

  if (eventCount === 0) {
    return `You are Jordan, the user's AI assistant. You're calling ${userName} about their calendar.

**CALENDAR STATUS:**
${userName} has NO events scheduled ${periodText}. Their calendar is completely clear.

**OPENING:**
"Hey ${userName}! I just checked your calendar. Good news - you have nothing scheduled ${periodText}. Your schedule is wide open!"

**IF USER ASKS TO BOOK SOMETHING:**
Offer to help book a meeting or event. Ask for:
- What it's for
- Date and time
- Duration
- Anyone else attending

Be conversational and helpful!`
  }

  const eventList = events.map((event, index) => `
**Event ${index + 1}:**
- Title: "${event.subject}"
- Time: ${event.isAllDay ? 'All Day' : `${event.startTime} to ${event.endTime}`}
${event.location ? `- Location: ${event.location}` : ''}
${event.attendees > 0 ? `- Attendees: ${event.attendees} person${event.attendees === 1 ? '' : 's'}` : ''}
${event.bodyPreview ? `- Notes: ${event.bodyPreview}` : ''}
`).join('\n')

  return `You are Jordan, ${userName}'s AI assistant. You're calling to go through their calendar ${periodText}.

**CALENDAR (${eventCount} event${eventCount === 1 ? '' : 's'}):**
${eventList}

**OPENING:**
"Hey ${userName}! I just checked your calendar. You have ${eventCount} event${eventCount === 1 ? '' : 's'} ${periodText}. Want me to go through them with you?"

**CONVERSATION FLOW:**

1. **Read Each Event Clearly:**
   - Announce event number and title
   - State the time (conversational, not robotic)
   - Mention location if important
   - Note attendees if it's a meeting

   Example: "Event 1: Team Standup at 9 AM in Conference Room A."

2. **After Each Event Ask:**
   - "Want to hear the next one?"
   - "Anything you need to change?"
   - Let them respond naturally

**USER MIGHT SAY:**
- "Next" or "Skip" → Move to next event
- "Tell me more" → Read body preview if available
- "Who's attending?" → List attendees
- "When is [event name]?" → Find and read that specific event
- "Am I free at [time]?" → Check schedule at that time
- "Cancel that meeting" → Note it down, tell them to confirm via text
- "Reschedule to [time]" → Note it down for confirmation

**KEEP IT CONVERSATIONAL:**
- Don't say "Event 1, Event 2" repeatedly - vary it up
- Use natural language: "Your first meeting", "After that", "Later in the day"
- Be brief unless they ask for details
- Maximum 10 minutes call time

**END THE CALL:**
When you've covered all events or user says they're done:
"Alright ${userName}, that's your schedule ${periodText}. Talk to you soon!"

Stay friendly, efficient, and helpful!`
}

/**
 * Create ephemeral VAPI assistant for calendar voice check
 */
async function createCalendarVoiceAssistant(
  events: EventForVoice[],
  userName: string,
  period: 'today' | 'week'
): Promise<string> {
  const systemPrompt = generateCalendarVoicePrompt(events, userName, period)

  const assistant = {
    name: `Calendar Check - ${userName}`,
    model: {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      systemPrompt: systemPrompt
    },
    voice: {
      provider: 'playht',
      voiceId: 'jennifer'
    },
    firstMessage: `Hey ${userName}! I just checked your calendar. ${events.length > 0 ? `You have ${events.length} event${events.length === 1 ? '' : 's'} ${period === 'today' ? 'today' : 'this week'}. Want me to go through them with you?` : `Good news - you have nothing scheduled ${period === 'today' ? 'today' : 'this week'}!`}`,
    endCallMessage: 'Talk to you soon!',
    endCallPhrases: ['goodbye', 'bye', 'hang up', 'that\'s all', 'thanks bye'],
    maxDurationSeconds: 600
  }

  const response = await fetch('https://api.vapi.ai/assistant', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(assistant)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`VAPI assistant creation failed: ${error}`)
  }

  const data = await response.json()
  return data.id
}

/**
 * Trigger outbound call for calendar voice check
 */
export async function triggerVoiceCalendarCheck(
  phoneNumber: string,
  events: CalendarEvent[],
  userName: string,
  period: 'today' | 'week' = 'today',
  metadata?: Record<string, any>
): Promise<string> {
  // Format events for voice
  const formattedEvents = formatEventsForVoice(events)

  // Create dynamic assistant with calendar data
  const assistantId = await createCalendarVoiceAssistant(formattedEvents, userName, period)

  // Trigger outbound call
  const callData = {
    assistantId: assistantId,
    phoneNumberId: VAPI_PHONE_NUMBER_ID,
    customer: {
      number: phoneNumber
    },
    metadata: {
      ...metadata,
      type: 'calendar_voice_check',
      period: period,
      event_count: events.length
    }
  }

  const response = await fetch('https://api.vapi.ai/call/phone', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(callData)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`VAPI call failed: ${error}`)
  }

  const data = await response.json()
  return data.id
}
