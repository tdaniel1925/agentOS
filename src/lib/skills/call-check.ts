/**
 * Call Check Skill
 * Checks missed calls and provides mobile link to full history
 */

import { createServiceClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio/client'

interface CheckCallsParams {
  subscriber: any
}

interface CheckResult {
  success: boolean
  message: string
}

/**
 * Check missed calls (async operation)
 */
export async function checkCalls(params: CheckCallsParams): Promise<CheckResult> {
  const { subscriber } = params
  const supabase = createServiceClient()

  try {
    // Send immediate acknowledgment
    await sendSMS({
      to: subscriber.control_phone,
      body: "Checking your call history... I'll text you in a moment.",
    })

    // Process async
    processCallCheck({ subscriber }).catch(console.error)

    return {
      success: true,
      message: 'Processing started',
    }
  } catch (error) {
    console.error('❌ [Call Check] Error:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      message: `I ran into an issue: ${errorMsg}`,
    }
  }
}

/**
 * Process call check (async background task)
 */
async function processCallCheck(params: { subscriber: any }): Promise<void> {
  const supabase = createServiceClient()

  try {
    // Fetch calls from last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const { data: calls } = await (supabase as any)
      .from('call_logs')
      .select('*')
      .eq('subscriber_id', params.subscriber.id)
      .gte('started_at', yesterday.toISOString())
      .order('started_at', { ascending: false })

    const allCalls = calls || []
    const missedCalls = allCalls.filter(
      (c: any) => c.status === 'no-answer' || c.status === 'busy'
    )
    const completedCalls = allCalls.filter((c: any) => c.status === 'completed')

    // Build SMS summary
    const summary = buildCallSummary(
      allCalls.length,
      missedCalls.length,
      completedCalls.length,
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
      intent: 'CHECK_CALLS',
      raw_message: 'Check calls',
      executed: true,
      response_sent: true,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ [Call Check Process] Error:', error)
    throw error
  }
}

/**
 * Build call summary message
 */
function buildCallSummary(
  total: number,
  missed: number,
  completed: number,
  subscriberId: string
): string {
  if (total === 0) {
    return '📞 Calls (last 24hrs):\nNo calls yet.'
  }

  let summary = '📞 Calls (last 24hrs):\n'

  if (missed > 0) {
    summary += `🔴 ${missed} missed call${missed > 1 ? 's' : ''}\n`
  }

  summary += `✅ ${completed} completed\n`

  // Add mobile web link
  const webUrl = `${process.env.NEXT_PUBLIC_APP_URL}/m/calls/${subscriberId}`
  summary += `\nView all: ${webUrl}`

  return summary
}
