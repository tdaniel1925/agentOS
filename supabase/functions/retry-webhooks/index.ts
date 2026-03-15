/**
 * Retry Webhooks Edge Function
 * Runs every 15 minutes via pg_cron
 * Retries failed outbound webhooks to Apex (max 5 attempts)
 * Alerts BotMakers when webhooks fail permanently
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const apexWebhookUrl = Deno.env.get('APEX_WEBHOOK_URL')!
const apexWebhookSecret = Deno.env.get('APEX_WEBHOOK_SECRET')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!
const botmakersAdminEmail = Deno.env.get('BOTMAKERS_ADMIN_EMAIL')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Attempt webhook delivery
 */
async function attemptWebhookDelivery(
  event: any
): Promise<boolean> {
  try {
    const response = await fetch(apexWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AgentOS-Secret': apexWebhookSecret,
        'X-Idempotency-Key': event.idempotency_key
      },
      body: JSON.stringify(event.payload),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    const responseBody = await response.json().catch(() => ({}))

    if (response.ok) {
      // ── Success ───────────────────────────────────
      await supabase
        .from('webhook_events')
        .update({
          delivered: true,
          delivered_at: new Date().toISOString(),
          http_status: response.status,
          response_body: responseBody,
          attempts: event.attempts + 1,
          last_attempt_at: new Date().toISOString()
        })
        .eq('id', event.id)

      console.log(`✅ Webhook delivered: ${event.idempotency_key}`)
      return true
    } else {
      // ── Non-200 response ──────────────────────────
      await supabase
        .from('webhook_events')
        .update({
          http_status: response.status,
          response_body: responseBody,
          attempts: event.attempts + 1,
          last_attempt_at: new Date().toISOString(),
          last_error: `HTTP ${response.status}`
        })
        .eq('id', event.id)

      console.error(`❌ Webhook failed: ${event.idempotency_key} - HTTP ${response.status}`)
      return false
    }
  } catch (error: any) {
    // ── Network error / timeout ───────────────────
    await supabase
      .from('webhook_events')
      .update({
        attempts: event.attempts + 1,
        last_attempt_at: new Date().toISOString(),
        last_error: error.message
      })
      .eq('id', event.id)

    console.error(`❌ Webhook error: ${event.idempotency_key} - ${error.message}`)
    return false
  }
}

/**
 * Send alert email to BotMakers admin
 */
async function sendFailureAlert(exhaustedWebhooks: any[]): Promise<void> {
  const emailBody = [
    `${exhaustedWebhooks.length} webhooks to Apex failed after 5 attempts.`,
    '',
    'FAILED WEBHOOKS:',
    '─────────────────────────────────────────',
    ...exhaustedWebhooks.map(e =>
      `Event: ${e.event_type}\n` +
      `Idempotency Key: ${e.idempotency_key}\n` +
      `Last Error: ${e.last_error}\n` +
      `Last Attempt: ${new Date(e.last_attempt_at).toLocaleString()}\n` +
      `Payload: ${JSON.stringify(e.payload.data, null, 2)}\n`
    ),
    '─────────────────────────────────────────',
    '',
    'ACTION REQUIRED:',
    '1. Check if Apex webhook endpoint is down',
    '2. Verify APEX_WEBHOOK_URL and APEX_WEBHOOK_SECRET',
    '3. Review webhook_events table for details',
    '4. Consider manual webhook replay if needed'
  ].join('\n')

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'AgentOS Alerts <alerts@hireyourbot.com>',
        to: botmakersAdminEmail,
        subject: `⚠️ ${exhaustedWebhooks.length} webhooks failed to deliver to Apex`,
        text: emailBody
      })
    })

    if (!response.ok) {
      console.error('Failed to send alert email:', await response.text())
    } else {
      console.log('📧 Alert email sent to BotMakers admin')
    }
  } catch (error) {
    console.error('Error sending alert email:', error)
  }
}

serve(async (req) => {
  try {
    console.log('🔄 Webhook Retry Edge Function started')

    // Verify authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.includes('Bearer')) {
      return new Response('Unauthorized', { status: 401 })
    }

    // ── Find failed outbound webhooks ────────────────
    // Under max attempts, not yet delivered
    const { data: failedWebhooks, error: fetchError } = await supabase
      .from('webhook_events')
      .select('*')
      .eq('direction', 'outbound')
      .eq('delivered', false)
      .lt('attempts', 5)
      .order('created_at', { ascending: true })
      .limit(50)

    if (fetchError) {
      console.error('Error fetching failed webhooks:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch webhooks' }),
        { status: 500 }
      )
    }

    if (!failedWebhooks || failedWebhooks.length === 0) {
      console.log('✅ No failed webhooks to retry')
      return new Response(
        JSON.stringify({ message: 'Nothing to retry', retried: 0, succeeded: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ── Retry each failed webhook ────────────────────
    let retried = 0
    let succeeded = 0

    for (const event of failedWebhooks) {
      retried++
      const success = await attemptWebhookDelivery(event)
      if (success) succeeded++

      // Small delay between retries to avoid overwhelming Apex
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`Retried: ${retried} webhooks, Succeeded: ${succeeded}`)

    // ── Check for exhausted webhooks ─────────────────
    // These have hit max attempts and still failed
    const { data: exhaustedWebhooks } = await supabase
      .from('webhook_events')
      .select('*')
      .eq('direction', 'outbound')
      .eq('delivered', false)
      .gte('attempts', 5)

    if (exhaustedWebhooks && exhaustedWebhooks.length > 0) {
      console.warn(`⚠️ ${exhaustedWebhooks.length} webhooks exhausted all retry attempts`)
      await sendFailureAlert(exhaustedWebhooks)
    }

    return new Response(
      JSON.stringify({
        message: 'Retry complete',
        retried,
        succeeded,
        failed: retried - succeeded,
        exhausted: exhaustedWebhooks?.length || 0
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Webhook retry error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
