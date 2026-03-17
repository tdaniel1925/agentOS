/**
 * Admin Alert System
 * Sends notifications to admins when critical failures occur
 */

import { createServiceClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio/client'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@jordyn.app'
const ADMIN_PHONE = process.env.ADMIN_PHONE || '+16517287626'

export interface AdminAlert {
  type: 'phone_provisioning_failure' | 'stripe_failure' | 'webhook_failure' | 'critical_error'
  subscriberId: string
  businessName: string
  message: string
  metadata?: Record<string, any>
}

/**
 * Send admin alert via email and SMS
 */
export async function sendAdminAlert(alert: AdminAlert): Promise<void> {
  try {
    const supabase = createServiceClient()

    // Log alert in database
    await (supabase as any).from('admin_alerts').insert({
      alert_type: alert.type,
      subscriber_id: alert.subscriberId,
      message: alert.message,
      metadata: alert.metadata || {},
      created_at: new Date().toISOString(),
      resolved: false,
    })

    // Format alert message
    const timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    const emailSubject = `[Jordyn Alert] ${formatAlertType(alert.type)}`
    const emailBody = `
      <h2>${formatAlertType(alert.type)}</h2>
      <p><strong>Time:</strong> ${timestamp}</p>
      <p><strong>Business:</strong> ${alert.businessName}</p>
      <p><strong>Subscriber ID:</strong> ${alert.subscriberId}</p>
      <p><strong>Issue:</strong> ${alert.message}</p>
      ${alert.metadata ? `<pre>${JSON.stringify(alert.metadata, null, 2)}</pre>` : ''}
      <hr>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/subscribers/${alert.subscriberId}">View Subscriber</a></p>
    `

    const smsBody = `🚨 Jordyn Alert: ${formatAlertType(alert.type)}\n\n${alert.businessName}\n${alert.message}\n\nCheck dashboard for details.`

    // Send email to admin
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'alerts@jordyn.app',
        to: ADMIN_EMAIL,
        subject: emailSubject,
        html: emailBody,
      })
      console.log(`📧 Admin email alert sent to ${ADMIN_EMAIL}`)
    } catch (emailError) {
      console.error('❌ Failed to send admin email:', emailError)
    }

    // Send SMS to admin (only for critical alerts)
    if (alert.type === 'phone_provisioning_failure' || alert.type === 'critical_error') {
      try {
        await sendSMS({
          to: ADMIN_PHONE,
          body: smsBody.substring(0, 160), // SMS character limit
        })
        console.log(`📱 Admin SMS alert sent to ${ADMIN_PHONE}`)
      } catch (smsError) {
        console.error('❌ Failed to send admin SMS:', smsError)
      }
    }

  } catch (error) {
    console.error('❌ Failed to send admin alert:', error)
    // Don't throw - we don't want alert failures to break the main flow
  }
}

/**
 * Alert when phone provisioning fails
 */
export async function alertPhoneProvisioningFailure(
  subscriberId: string,
  businessName: string,
  error: string,
  attempts: number
): Promise<void> {
  await sendAdminAlert({
    type: 'phone_provisioning_failure',
    subscriberId,
    businessName,
    message: `Phone number provisioning failed after ${attempts} attempts`,
    metadata: {
      error,
      attempts,
      action_required: 'Manual provisioning needed',
    },
  })
}

/**
 * Alert when Stripe subscription creation fails
 */
export async function alertStripeSubscriptionFailure(
  subscriberId: string,
  businessName: string,
  error: string
): Promise<void> {
  await sendAdminAlert({
    type: 'stripe_failure',
    subscriberId,
    businessName,
    message: `Stripe subscription creation failed: ${error}`,
    metadata: {
      error,
      action_required: 'Check Stripe dashboard and subscriber record',
    },
  })
}

/**
 * Alert when webhook processing fails
 */
export async function alertWebhookFailure(
  webhookType: string,
  error: string,
  eventId?: string
): Promise<void> {
  await sendAdminAlert({
    type: 'webhook_failure',
    subscriberId: 'system',
    businessName: 'System',
    message: `Webhook ${webhookType} processing failed`,
    metadata: {
      webhook_type: webhookType,
      event_id: eventId,
      error,
      action_required: 'Check webhook logs',
    },
  })
}

/**
 * Alert for critical system errors
 */
export async function alertCriticalError(
  context: string,
  error: string,
  metadata?: Record<string, any>
): Promise<void> {
  await sendAdminAlert({
    type: 'critical_error',
    subscriberId: 'system',
    businessName: 'System',
    message: `Critical error in ${context}: ${error}`,
    metadata: {
      context,
      error,
      ...metadata,
    },
  })
}

/**
 * Format alert type for display
 */
function formatAlertType(type: string): string {
  const typeMap: Record<string, string> = {
    phone_provisioning_failure: 'Phone Provisioning Failed',
    stripe_failure: 'Stripe Error',
    webhook_failure: 'Webhook Processing Failed',
    critical_error: 'Critical System Error',
  }
  return typeMap[type] || type
}
