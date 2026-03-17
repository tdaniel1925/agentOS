/**
 * Twilio Client Helpers
 * SMS messaging integration
 */

import twilio from 'twilio'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

/**
 * Get Twilio client instance
 */
export function getTwilioClient() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials not configured')
  }

  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
}

/**
 * Send SMS via Twilio with A2P compliance
 *
 * If TWILIO_MESSAGING_SERVICE_SID is set, uses the messaging service (A2P compliant)
 * Otherwise falls back to direct phone number sending
 */
export async function sendSMS(params: {
  to: string
  body: string
  from?: string
}): Promise<{ sid: string; status: string }> {
  const client = getTwilioClient()
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

  try {
    const messageOptions: any = {
      to: params.to,
      body: params.body,
    }

    // Use messaging service if configured (A2P compliant)
    if (messagingServiceSid) {
      messageOptions.messagingServiceSid = messagingServiceSid
      console.log(`📱 Sending SMS via A2P messaging service ${messagingServiceSid}`)
    }
    // Otherwise use direct phone number
    else {
      const from = params.from || TWILIO_PHONE_NUMBER
      if (!from) {
        throw new Error('TWILIO_PHONE_NUMBER not configured')
      }
      messageOptions.from = from
      console.log(`📱 Sending SMS from ${from} (A2P not configured)`)
    }

    const message = await client.messages.create(messageOptions)

    return {
      sid: message.sid,
      status: message.status,
    }
  } catch (error) {
    throw new Error(`Failed to send SMS: ${error}`)
  }
}

/**
 * Verify Twilio webhook signature
 * CRITICAL: Always call this before processing webhook requests
 */
export function verifyTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  if (!TWILIO_AUTH_TOKEN) {
    throw new Error('TWILIO_AUTH_TOKEN not configured')
  }

  return twilio.validateRequest(TWILIO_AUTH_TOKEN, signature, url, params)
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')

  // Add +1 if not present (US numbers)
  if (cleaned.length === 10) {
    return `+1${cleaned}`
  }

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`
  }

  return `+${cleaned}`
}
