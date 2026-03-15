/**
 * Apex Webhook Utility
 * The ONLY function that sends financial events to Apex.
 *
 * Called by:
 * - Upgrade handler (subscriber.upgraded)
 * - Downgrade handler (subscriber.downgraded)
 * - Signup flow (subscriber.created)
 * - Cancellation handler (subscriber.cancelled)
 */

import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Financial event data sent to Apex
 */
export interface WebhookEventData {
  subscriber_id: string
  subscriber_name: string
  subscriber_email: string
  rep_code: string
  skill_changed?: string // Skill name for upgrade/downgrade events
  mrr_before: number // MRR before this event
  mrr_after: number // MRR after this event
  mrr_delta: number // Change in MRR (positive or negative)
  total_mrr: number // Current total MRR
  stripe_subscription_id: string
  stripe_invoice_id: string
}

/**
 * Fire a financial event webhook to Apex
 *
 * This function:
 * 1. Creates an idempotency key to prevent duplicates
 * 2. Logs the webhook to webhook_events table
 * 3. Attempts delivery to Apex
 * 4. Updates delivery status in database
 *
 * If delivery fails, the webhook retry job will retry up to 5 times.
 */
export async function fireWebhook(
  eventType: 'subscriber.created' | 'subscriber.upgraded' | 'subscriber.downgraded' | 'subscriber.cancelled',
  data: WebhookEventData
): Promise<void> {
  const supabase = getServiceClient()

  // ── Build idempotency key ─────────────────────────
  // Format: {eventType}_{subscription_id}_{invoice_id}
  const idempotencyKey = `${eventType}_${data.stripe_subscription_id}_${data.stripe_invoice_id}`

  // ── Build payload ─────────────────────────────────
  const payload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    secret: process.env.APEX_WEBHOOK_SECRET!,
    data: {
      ...data,
      idempotency_key: idempotencyKey
    }
  }

  // ── Log outbound webhook first ────────────────────
  // This creates the record BEFORE attempting delivery
  // If delivery fails, the retry job will find it
  const { error: logError } = await supabase.from('webhook_events').insert({
    direction: 'outbound',
    event_type: eventType,
    payload,
    delivered: false,
    attempts: 0,
    idempotency_key: idempotencyKey
  })

  // If duplicate key — already queued or delivered
  if (logError?.code === '23505') {
    console.log(`Webhook already queued: ${idempotencyKey}`)
    return
  }

  if (logError) {
    console.error('Error logging webhook:', logError)
    // Continue anyway — we'll try to deliver
  }

  // ── Fire to Apex ──────────────────────────────────
  await attemptWebhookDelivery(idempotencyKey, payload, supabase)
}

/**
 * Attempt webhook delivery
 * Used by fireWebhook() and the retry Edge Function
 *
 * @returns true if delivered successfully, false otherwise
 */
export async function attemptWebhookDelivery(
  idempotencyKey: string,
  payload: any,
  supabase: any
): Promise<boolean> {
  try {
    const response = await fetch(process.env.APEX_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AgentOS-Secret': process.env.APEX_WEBHOOK_SECRET!,
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(payload),
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
          attempts: supabase.sql`attempts + 1`,
          last_attempt_at: new Date().toISOString()
        })
        .eq('idempotency_key', idempotencyKey)

      console.log(`Webhook delivered: ${idempotencyKey}`)
      return true
    } else {
      // ── Non-200 response ──────────────────────────
      await supabase
        .from('webhook_events')
        .update({
          http_status: response.status,
          response_body: responseBody,
          attempts: supabase.sql`attempts + 1`,
          last_attempt_at: new Date().toISOString(),
          last_error: `HTTP ${response.status}`
        })
        .eq('idempotency_key', idempotencyKey)

      console.error(`Webhook failed: ${idempotencyKey} - HTTP ${response.status}`)
      return false
    }
  } catch (error: any) {
    // ── Network error / timeout ───────────────────
    await supabase
      .from('webhook_events')
      .update({
        attempts: supabase.sql`attempts + 1`,
        last_attempt_at: new Date().toISOString(),
        last_error: error.message
      })
      .eq('idempotency_key', idempotencyKey)

    console.error(`Webhook error: ${idempotencyKey} - ${error.message}`)
    return false
  }
}
