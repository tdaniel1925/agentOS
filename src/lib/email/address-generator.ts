/**
 * Jordyn Email Address Generator
 * Generates unique email addresses for subscribers
 * Format: u-{shortId}@mail.jordyn.app
 */

import { createServiceClient } from '@/lib/supabase/server'

const EMAIL_DOMAIN = process.env.JORDYN_EMAIL_DOMAIN || 'mail.jordyn.app'

/**
 * Generate a short unique ID (8 characters)
 */
function generateShortId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

/**
 * Generate unique Jordyn email address for a subscriber
 */
export async function generateJordynEmailAddress(): Promise<string> {
  const supabase = createServiceClient()

  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const shortId = generateShortId()
    const emailAddress = `u-${shortId}@${EMAIL_DOMAIN}`

    // Check if this address already exists
    const { data: existing } = await (supabase as any)
      .from('subscribers')
      .select('id')
      .eq('jordyn_email_address', emailAddress)
      .single()

    if (!existing) {
      return emailAddress
    }

    attempts++
  }

  throw new Error('Failed to generate unique email address after 10 attempts')
}

/**
 * Assign Jordyn email address to a subscriber
 */
export async function assignJordynEmailAddress(subscriberId: string): Promise<string> {
  const supabase = createServiceClient()

  // Check if subscriber already has an email address
  const { data: subscriber } = await (supabase as any)
    .from('subscribers')
    .select('jordyn_email_address')
    .eq('id', subscriberId)
    .single()

  if (subscriber?.jordyn_email_address) {
    return subscriber.jordyn_email_address
  }

  // Generate new email address
  const emailAddress = await generateJordynEmailAddress()

  // Update subscriber
  const { error } = await (supabase as any)
    .from('subscribers')
    .update({ jordyn_email_address: emailAddress })
    .eq('id', subscriberId)

  if (error) {
    throw new Error(`Failed to assign email address: ${error.message}`)
  }

  return emailAddress
}

/**
 * Parse subscriber ID from Jordyn email address
 */
export async function getSubscriberFromEmail(emailAddress: string): Promise<string | null> {
  const supabase = createServiceClient()

  // Normalize email (lowercase)
  const normalizedEmail = emailAddress.toLowerCase().trim()

  const { data: subscriber } = await (supabase as any)
    .from('subscribers')
    .select('id')
    .eq('jordyn_email_address', normalizedEmail)
    .single()

  return subscriber?.id || null
}

/**
 * Format email address for display
 */
export function formatEmailAddress(emailAddress: string): string {
  return emailAddress
}

/**
 * Get email forwarding instructions for user
 */
export function getForwardingInstructions(emailAddress: string): string {
  return `
📧 Your Jordyn Email Address:
${emailAddress}

How to set up email forwarding:

GMAIL:
1. Go to Settings → Forwarding
2. Add forwarding address: ${emailAddress}
3. Verify the address
4. Enable forwarding

OUTLOOK:
1. Go to Settings → Mail → Forwarding
2. Enable forwarding
3. Enter: ${emailAddress}
4. Save

What happens next?
- Jordyn analyzes your emails instantly
- Texts you summaries (urgent/client/lead)
- Deletes full content in 60 seconds
- Your privacy is protected 🔒

Reply "EMAIL HELP" anytime for assistance.
  `.trim()
}
