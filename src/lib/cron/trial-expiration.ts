/**
 * Trial Expiration Management
 * Handles trial reminders, expiration checks, and feature pausing
 */

import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/resend/client'
import { trialDay5Reminder, trialDay7Expiration, sendTrialExpired } from '@/lib/email/trial-emails'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables for trial expiration service')
}

/**
 * Get Supabase service client for server-side operations
 */
function getServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}

interface TrialCheckResult {
  checked: number
  reminded: number
  expired: number
  errors: Array<{ subscriber_id: string; error: string }>
}

interface Subscriber {
  id: string
  email: string
  name: string
  business_name: string
  bot_name: string
  trial_started_at: string
  trial_ends_at: string
  billing_status: string
  status: string
}

/**
 * Check all trial expirations and send reminders/pause expired trials
 */
export async function checkTrialExpirations(): Promise<TrialCheckResult> {
  const supabase = getServiceClient()
  const result: TrialCheckResult = {
    checked: 0,
    reminded: 0,
    expired: 0,
    errors: []
  }

  try {
    // Get all trialing subscribers
    const { data: trialingSubscribers, error: fetchError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('billing_status', 'trialing')
      .not('trial_ends_at', 'is', null)
      .order('trial_ends_at', { ascending: true })

    if (fetchError) {
      throw new Error(`Failed to fetch trialing subscribers: ${fetchError.message}`)
    }

    if (!trialingSubscribers || trialingSubscribers.length === 0) {
      return result
    }

    result.checked = trialingSubscribers.length

    const now = new Date()

    for (const subscriber of trialingSubscribers as Subscriber[]) {
      try {
        const trialEndsAt = new Date(subscriber.trial_ends_at)
        const daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        // Trial has expired (day 7 or later)
        if (daysRemaining <= 0) {
          await expireTrial(subscriber)
          result.expired++
        }
        // Day 5 reminder (2 days left)
        else if (daysRemaining === 2) {
          await sendDay5Reminder(subscriber)
          result.reminded++
        }
      } catch (error) {
        result.errors.push({
          subscriber_id: subscriber.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return result
  } catch (error) {
    throw new Error(`Trial expiration check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Send day 5 reminder email (2 days left in trial)
 */
async function sendDay5Reminder(subscriber: Subscriber): Promise<void> {
  const supabase = getServiceClient()

  try {
    const trialEndsAt = new Date(subscriber.trial_ends_at)
    const daysLeft = Math.ceil((trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

    const emailContent = trialDay5Reminder({
      name: subscriber.name.split(' ')[0],
      businessName: subscriber.business_name,
      botName: subscriber.bot_name,
      daysLeft,
      trialEndsAt: trialEndsAt.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })
    })

    await sendEmail({
      to: subscriber.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    })

    // Log the reminder sent
    await supabase.from('commands_log').insert({
      subscriber_id: subscriber.id,
      skill_triggered: 'trial-reminder-day-5',
      raw_message: `Trial reminder sent: ${daysLeft} days remaining`,
      success: true
    })
  } catch (error) {
    throw new Error(`Failed to send day 5 reminder: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Expire trial and pause features
 */
async function expireTrial(subscriber: Subscriber): Promise<void> {
  const supabase = getServiceClient()

  try {
    // Update subscriber status
    await supabase
      .from('subscribers')
      .update({
        billing_status: 'past_due',
        status: 'paused'
      })
      .eq('id', subscriber.id)

    // Update trial conversion record
    const trialStartedAt = new Date(subscriber.trial_started_at)
    await supabase
      .from('trial_conversions')
      .update({
        trial_ended_at: new Date().toISOString(),
        converted: false
      })
      .eq('subscriber_id', subscriber.id)
      .eq('trial_started_at', trialStartedAt.toISOString())

    // Send expiration email
    const emailContent = trialDay7Expiration({
      name: subscriber.name.split(' ')[0],
      businessName: subscriber.business_name,
      botName: subscriber.bot_name
    })

    await sendEmail({
      to: subscriber.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    })

    // Log the expiration
    await supabase.from('commands_log').insert({
      subscriber_id: subscriber.id,
      skill_triggered: 'trial-expired',
      raw_message: 'Trial expired, features paused until payment',
      success: true
    })
  } catch (error) {
    throw new Error(`Failed to expire trial: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Send trial reminder emails (manual trigger)
 */
export async function sendTrialReminders(): Promise<{ sent: number; errors: string[] }> {
  const supabase = getServiceClient()
  const result = { sent: 0, errors: [] as string[] }

  try {
    // Get subscribers with 2 days left
    const twoDaysFromNow = new Date()
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)
    twoDaysFromNow.setHours(23, 59, 59, 999)

    const startOfDay = new Date(twoDaysFromNow)
    startOfDay.setHours(0, 0, 0, 0)

    const { data: subscribers, error } = await supabase
      .from('subscribers')
      .select('*')
      .eq('billing_status', 'trialing')
      .gte('trial_ends_at', startOfDay.toISOString())
      .lte('trial_ends_at', twoDaysFromNow.toISOString())

    if (error) {
      throw new Error(`Failed to fetch subscribers for reminders: ${error.message}`)
    }

    if (!subscribers || subscribers.length === 0) {
      return result
    }

    for (const subscriber of subscribers as Subscriber[]) {
      try {
        await sendDay5Reminder(subscriber)
        result.sent++
      } catch (error) {
        result.errors.push(`${subscriber.email}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  } catch (error) {
    throw new Error(`Failed to send trial reminders: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Pause expired trials (manual trigger)
 */
export async function pauseExpiredTrials(): Promise<{ paused: number; errors: string[] }> {
  const supabase = getServiceClient()
  const result = { paused: 0, errors: [] as string[] }

  try {
    const now = new Date()

    // Get expired trials
    const { data: expiredSubscribers, error } = await supabase
      .from('subscribers')
      .select('*')
      .eq('billing_status', 'trialing')
      .lte('trial_ends_at', now.toISOString())

    if (error) {
      throw new Error(`Failed to fetch expired trials: ${error.message}`)
    }

    if (!expiredSubscribers || expiredSubscribers.length === 0) {
      return result
    }

    for (const subscriber of expiredSubscribers as Subscriber[]) {
      try {
        await expireTrial(subscriber)
        result.paused++
      } catch (error) {
        result.errors.push(`${subscriber.email}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  } catch (error) {
    throw new Error(`Failed to pause expired trials: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Send trial expired notification to a specific subscriber
 * Standalone helper for manual notifications
 */
export async function sendTrialExpiredNotification(subscriberId: string): Promise<void> {
  const supabase = getServiceClient()

  try {
    // Get subscriber details
    const { data: subscriber, error } = await supabase
      .from('subscribers')
      .select('*')
      .eq('id', subscriberId)
      .single()

    if (error || !subscriber) {
      throw new Error('Subscriber not found')
    }

    const subscriberData = subscriber as unknown as Subscriber

    // Generate and send email
    const emailContent = sendTrialExpired({
      name: subscriberData.name.split(' ')[0],
      businessName: subscriberData.business_name,
      botName: subscriberData.bot_name,
    })

    await sendEmail({
      to: subscriberData.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    })

    // Log the notification
    await supabase.from('commands_log').insert({
      subscriber_id: subscriberId,
      skill_triggered: 'trial-expired-notification',
      raw_message: 'Trial expired notification sent',
      success: true,
    })
  } catch (error) {
    throw new Error(`Failed to send trial expired notification: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
