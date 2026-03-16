/**
 * Calendar Check Skill
 * Checks upcoming calendar events and provides mobile link
 */

import { createServiceClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio/client'
import { getMicrosoftCalendarEvents, getTodayCalendarEvents, decryptToken } from '@/lib/email/microsoft'

interface CheckCalendarParams {
  subscriber: any
  timeframe?: 'today' | 'week'
}

interface CheckResult {
  success: boolean
  message: string
}

/**
 * Check calendar (async operation)
 */
export async function checkCalendar(params: CheckCalendarParams): Promise<CheckResult> {
  const { subscriber } = params
  const supabase = createServiceClient()

  try {
    // Check if calendar connected
    const { data: connection } = await (supabase as any)
      .from('email_connections')
      .select('*')
      .eq('subscriber_id', subscriber.id)
      .eq('status', 'active')
      .single()

    if (!connection) {
      return {
        success: false,
        message: "Your calendar isn't connected yet. Reply CONNECT CALENDAR to set it up.",
      }
    }

    // Send acknowledgment
    await sendSMS({
      to: subscriber.control_phone,
      body: "Checking your calendar... I'll text you in a moment.",
    })

    // Process async
    processCalendarCheck({ subscriber, connection, timeframe: params.timeframe || 'today' }).catch(console.error)

    return {
      success: true,
      message: 'Processing started',
    }
  } catch (error) {
    console.error('❌ [Calendar Check] Error:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      message: `I ran into an issue: ${errorMsg}`,
    }
  }
}

/**
 * Process calendar check (async background task)
 */
async function processCalendarCheck(params: {
  subscriber: any
  connection: any
  timeframe: 'today' | 'week'
}): Promise<void> {
  const supabase = createServiceClient()

  try {
    // Decrypt access token
    const accessToken = decryptToken(params.connection.encrypted_access_token)

    // Fetch events
    let events
    if (params.timeframe === 'today') {
      events = await getTodayCalendarEvents(accessToken)
    } else {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 7)
      events = await getMicrosoftCalendarEvents(accessToken, startDate, endDate)
    }

    // Build summary
    const summary = buildCalendarSummary(
      events,
      params.timeframe,
      params.subscriber.id
    )

    // Send SMS
    await sendSMS({
      to: params.subscriber.control_phone,
      body: summary,
    })

    // Log command
    await (supabase as any).from('commands_log').insert({
      subscriber_id: params.subscriber.id,
      channel: 'sms',
      sender_identifier: params.subscriber.control_phone,
      intent: 'CHECK_CALENDAR',
      raw_message: `Check calendar ${params.timeframe}`,
      executed: true,
      response_sent: true,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ [Calendar Check Process] Error:', error)
    throw error
  }
}

/**
 * Build calendar summary message
 */
function buildCalendarSummary(
  events: any[],
  timeframe: string,
  subscriberId: string
): string {
  if (events.length === 0) {
    return `📅 ${timeframe === 'today' ? 'Today' : 'This week'}:\nNo events scheduled.`
  }

  let summary = `📅 ${timeframe === 'today' ? 'Today' : 'This week'}:\n`
  summary += `${events.length} event${events.length > 1 ? 's' : ''} scheduled\n`

  // Show next 2 events
  const nextTwo = events.slice(0, 2)
  nextTwo.forEach((event: any) => {
    const time = new Date(event.start.dateTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
    summary += `• ${time} - ${event.subject}\n`
  })

  if (events.length > 2) {
    summary += `...and ${events.length - 2} more\n`
  }

  // Add mobile web link
  const webUrl = `${process.env.NEXT_PUBLIC_APP_URL}/m/calendar/${subscriberId}?view=${timeframe === 'today' ? 'today' : 'week'}`
  summary += `\nView all: ${webUrl}`

  return summary
}
