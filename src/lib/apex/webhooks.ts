/**
 * Apex Integration - Webhook Helpers
 *
 * Two-way communication between Apex and AgentOS:
 * 1. Send sales events TO Apex (subscription created/updated/canceled)
 * 2. Receive distributor data FROM Apex (via webhook endpoints)
 */

import crypto from 'crypto'

const APEX_WEBHOOK_URL = process.env.APEX_WEBHOOK_URL!
const APEX_WEBHOOK_SECRET = process.env.APEX_WEBHOOK_SECRET!

// =============================================
// OUTBOUND: AgentOS → Apex
// =============================================

export interface ApexSaleEvent {
  apex_rep_code: string
  subscriber_id: string
  subscriber_email: string
  subscriber_name: string
  mrr: number
  event_type: 'subscription.created' | 'subscription.updated' | 'subscription.canceled'
  timestamp: string
  metadata?: Record<string, any>
}

/**
 * Send subscription created event to Apex
 * Called when customer signs up via /join/[rep_code]
 */
export async function notifyApexSubscriptionCreated(data: {
  apex_rep_code: string
  subscriber_id: string
  subscriber_email: string
  subscriber_name: string
  mrr: number
}): Promise<void> {
  const event: ApexSaleEvent = {
    ...data,
    event_type: 'subscription.created',
    timestamp: new Date().toISOString()
  }

  await sendToApex('/api/webhooks/agentos/subscription-created', event)
}

/**
 * Send subscription updated event to Apex
 * Called when MRR changes (upgrade/downgrade)
 */
export async function notifyApexSubscriptionUpdated(data: {
  apex_rep_code: string
  subscriber_id: string
  subscriber_email: string
  subscriber_name: string
  old_mrr: number
  new_mrr: number
}): Promise<void> {
  const event = {
    apex_rep_code: data.apex_rep_code,
    subscriber_id: data.subscriber_id,
    subscriber_email: data.subscriber_email,
    subscriber_name: data.subscriber_name,
    mrr: data.new_mrr,
    event_type: 'subscription.updated' as const,
    timestamp: new Date().toISOString(),
    metadata: {
      old_mrr: data.old_mrr,
      new_mrr: data.new_mrr
    }
  }

  await sendToApex('/api/webhooks/agentos/subscription-updated', event)
}

/**
 * Send subscription canceled event to Apex
 * Called when customer churns
 */
export async function notifyApexSubscriptionCanceled(data: {
  apex_rep_code: string
  subscriber_id: string
  subscriber_email: string
  subscriber_name: string
  mrr_lost: number
  cancellation_reason?: string
}): Promise<void> {
  const event = {
    apex_rep_code: data.apex_rep_code,
    subscriber_id: data.subscriber_id,
    subscriber_email: data.subscriber_email,
    subscriber_name: data.subscriber_name,
    mrr: 0,
    event_type: 'subscription.canceled' as const,
    timestamp: new Date().toISOString(),
    metadata: {
      mrr_lost: data.mrr_lost,
      cancellation_reason: data.cancellation_reason
    }
  }

  await sendToApex('/api/webhooks/agentos/subscription-canceled', event)
}

/**
 * Send webhook to Apex with signature verification
 */
async function sendToApex(path: string, payload: any): Promise<void> {
  const url = APEX_WEBHOOK_URL + path
  const signature = generateSignature(payload)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Apex webhook failed (${path}):`, errorText)
      throw new Error(`Apex webhook failed: ${response.status}`)
    }

    console.log(`✅ Sent to Apex: ${path}`, payload.event_type)
  } catch (error) {
    console.error(`❌ Failed to send to Apex (${path}):`, error)
    // Don't throw - we don't want to break AgentOS if Apex is down
    // Log to error_log table instead
  }
}

// =============================================
// INBOUND: Apex → AgentOS
// =============================================

/**
 * Verify webhook signature from Apex
 * Use in webhook route handlers
 */
export function verifyApexSignature(signature: string, payload: any): boolean {
  const expectedSignature = generateSignature(payload)
  return signature === expectedSignature
}

/**
 * Generate HMAC signature for webhook payload
 */
function generateSignature(payload: any): string {
  return crypto
    .createHmac('sha256', APEX_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex')
}
