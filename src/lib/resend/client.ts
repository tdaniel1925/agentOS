/**
 * Resend Client Helpers
 * Email delivery integration
 */

import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@jordyn.app'

/**
 * Get Resend client instance
 */
export function getResendClient(): Resend {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured')
  }

  return new Resend(RESEND_API_KEY)
}

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

/**
 * Send email via Resend
 */
export async function sendEmail(params: SendEmailParams): Promise<{ id: string }> {
  const resend = getResendClient()

  try {
    const { data, error } = await resend.emails.send({
      from: params.from || RESEND_FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
    })

    if (error) {
      throw new Error(`Resend error: ${JSON.stringify(error)}`)
    }

    if (!data) {
      throw new Error('No data returned from Resend')
    }

    return { id: data.id }
  } catch (error) {
    throw new Error(`Failed to send email: ${error}`)
  }
}
