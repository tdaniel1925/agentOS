/**
 * Downgrade Handler Skill
 * Handles subscriber requests to remove a skill
 *
 * Flow:
 * 1. Confirm what will be removed
 * 2. On YES:
 *    - Remove from Stripe
 *    - Deactivate in Supabase
 *    - Clean deactivation (pause active tasks)
 *    - Fire webhook to Apex
 *    - Update subscriber MRR
 *    - Confirm to subscriber
 */

import { createServiceClient } from '@/lib/supabase/server'
import { getStripeServer } from '@/lib/stripe/client'
import { fireWebhook } from '@/lib/billing/webhook'
import { SKILL_PRICES } from './upgrade-handler'

/**
 * Get impact message for skill removal
 */
function getSkillImpact(skillName: string): string[] {
  const impacts: Record<string, string[]> = {
    'social-media': [
      'No more social media posts will be created',
      'Scheduled posts will pause',
      'Your existing posts stay live'
    ],
    'lead-generation': [
      'No more lead research',
      'Existing contacts stay in your list',
      'You keep all your data'
    ],
    'campaigns': [
      'Active campaigns will pause',
      'No more campaign emails will send',
      'Your campaign data is saved'
    ],
    'quote-followup': [
      'Quote reminders will stop',
      'Existing quotes remain tracked',
      'You keep all quote history'
    ],
    'renewal-alerts': [
      'Renewal reminders will stop',
      'Your renewal data is saved',
      'You keep all client records'
    ],
    'review-requests': [
      'Review campaigns will stop',
      'Existing reviews stay visible',
      'Your review history is saved'
    ],
    'referral-campaigns': [
      'Referral tracking will pause',
      'Existing referrals are saved',
      'You keep all referral data'
    ],
    'outbound-calling': [
      'Pending calls will be cancelled',
      'No new calls will be placed',
      'Call history is saved'
    ],
    'analytics': [
      'Advanced dashboards will be hidden',
      'Historical data is preserved',
      'You keep access to basic stats'
    ],
    'team-addon': [
      'Team member access will be removed',
      'Only you will have account access',
      'Team activity history is saved'
    ]
  }
  return impacts[skillName] || [
    'This feature will be deactivated',
    'Your data will be preserved',
    'You can re-add this anytime'
  ]
}

/**
 * Get count of active items that will be paused
 */
async function getActiveItemsCount(
  subscriberId: string,
  skillName: string
): Promise<{ count: number; type: string } | null> {
  const supabase = createServiceClient()

  if (skillName === 'social-media') {
    const { count } = await supabase
      .from('scheduled_posts')
      .select('*', { count: 'exact', head: true })
      .eq('subscriber_id', subscriberId)
      .eq('status', 'scheduled')

    return count && count > 0 ? { count, type: 'scheduled posts' } : null
  }

  if (skillName === 'campaigns') {
    const { count } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('subscriber_id', subscriberId)
      .eq('status', 'active')

    return count && count > 0 ? { count, type: 'active campaigns' } : null
  }

  return null
}

/**
 * Confirm removal with subscriber
 * Returns the confirmation message
 */
export async function confirmDowngrade(
  skillName: string,
  currentMRR: number,
  subscriberId: string
): Promise<string> {
  const skill = SKILL_PRICES[skillName]
  if (!skill) {
    return `I don't recognize that skill. Available skills: ${Object.keys(SKILL_PRICES).join(', ')}`
  }

  const impacts = getSkillImpact(skillName)
  const newTotal = currentMRR - skill.price

  // Check for active items
  const activeItems = await getActiveItemsCount(subscriberId, skillName)
  const activeItemsNote = activeItems
    ? `\n• Your ${activeItems.count} ${activeItems.type} will pause`
    : ''

  return `Removing ${skill.name} saves you $${skill.price}/mo.

What stops:
• ${impacts[0]}
• ${impacts[1]}
• ${impacts[2]}${activeItemsNote}

Your bill drops to $${newTotal}/mo next cycle.

Reply YES to remove or KEEP to keep it.`
}

/**
 * Perform skill-specific cleanup
 */
async function cleanupSkillData(
  subscriberId: string,
  skillName: string
): Promise<void> {
  const supabase = createServiceClient()

  switch (skillName) {
    case 'social-media':
      // Pause all scheduled posts
      await supabase
        .from('scheduled_posts')
        .update({ status: 'paused' })
        .eq('subscriber_id', subscriberId)
        .eq('status', 'scheduled')
      break

    case 'campaigns':
      // Pause all active campaigns
      await supabase
        .from('campaigns')
        .update({ status: 'paused' })
        .eq('subscriber_id', subscriberId)
        .eq('status', 'active')
      break

    case 'outbound-calling':
      // Cancel pending outbound calls
      // Note: outbound_call_queue table may not exist yet
      // This is future-proofing for when that feature is built
      try {
        await supabase
          .from('outbound_call_queue')
          .delete()
          .eq('subscriber_id', subscriberId)
          .eq('status', 'pending')
      } catch (error) {
        // Table might not exist yet - that's ok
        console.log('outbound_call_queue table not found - skipping cleanup')
      }
      break

    // Other skills don't require specific cleanup
    default:
      break
  }
}

/**
 * Process the downgrade
 * Removes from Stripe, deactivates skill, fires webhook to Apex
 */
export async function processDowngrade(
  subscriber: any,
  skillName: string
): Promise<{ success: boolean; message: string }> {
  const skill = SKILL_PRICES[skillName]
  if (!skill) {
    return {
      success: false,
      message: `Unknown skill: ${skillName}`
    }
  }

  const supabase = createServiceClient()
  const stripe = getStripeServer()

  try {
    // ── Step 1: Get Stripe price ID ──────────────────
    const stripePriceId = process.env[skill.stripePriceEnvVar]
    if (!stripePriceId) {
      console.error(`Missing env var: ${skill.stripePriceEnvVar}`)
      return {
        success: false,
        message: "I couldn't process your downgrade right now. The issue has been logged.\n\nTry again in a few minutes, or contact support if this continues."
      }
    }

    // ── Step 2: Remove from Stripe ───────────────────
    const idempotencyKey = `downgrade_${subscriber.id}_${skillName}_${Date.now()}`

    let invoice
    try {
      // Get the subscription
      const subscription = await stripe.subscriptions.retrieve(
        subscriber.stripe_subscription_id
      )

      // Find the subscription item for this skill
      const itemToRemove = subscription.items.data.find(
        item => item.price.id === stripePriceId
      )

      if (!itemToRemove) {
        return {
          success: false,
          message: `You don't have ${skill.name} active. Check your active skills with 'what can you do?'`
        }
      }

      // Remove the item from the subscription
      await stripe.subscriptionItems.del(
        itemToRemove.id,
        { proration_behavior: 'always_invoice' },
        { idempotencyKey }
      )

      // Get the latest invoice
      const latestInvoice = subscription.latest_invoice
      if (typeof latestInvoice === 'string') {
        invoice = await stripe.invoices.retrieve(latestInvoice)
      } else {
        invoice = latestInvoice
      }
    } catch (stripeError: any) {
      console.error('Stripe removal failed:', stripeError)
      return {
        success: false,
        message: "I couldn't process your downgrade right now — " + stripeError.message + "\n\nPlease try again in a few minutes."
      }
    }

    // ── Step 3: Deactivate in Supabase ───────────────
    const { error: flagError } = await supabase
      .from('feature_flags')
      .update({ enabled: false })
      .eq('subscriber_id', subscriber.id)
      .eq('feature_name', skillName)

    if (flagError) {
      console.error('Error deactivating skill:', flagError)
      // Continue anyway — Stripe already updated
    }

    // ── Step 4: Clean deactivation ───────────────────
    await cleanupSkillData(subscriber.id, skillName)

    // ── Step 5: Fire webhook to Apex ─────────────────
    const mrr_before = subscriber.current_mrr || 0
    const mrr_after = mrr_before - skill.price

    await fireWebhook('subscriber.downgraded', {
      subscriber_id: subscriber.id,
      subscriber_name: subscriber.business_name,
      subscriber_email: subscriber.email,
      rep_code: subscriber.rep_code || 'UNKNOWN',
      skill_changed: skillName,
      mrr_before,
      mrr_after,
      mrr_delta: -skill.price,
      total_mrr: mrr_after,
      stripe_subscription_id: subscriber.stripe_subscription_id,
      stripe_invoice_id: invoice?.id || 'unknown'
    })

    // ── Step 6: Update subscriber MRR ────────────────
    await supabase
      .from('subscribers')
      .update({ current_mrr: mrr_after })
      .eq('id', subscriber.id)

    // ── Step 7: Return success ───────────────────────
    return {
      success: true,
      message: `${skill.name} removed. Your data is saved — re-add anytime by texting 'add ${skillName}' and I'll be back in under a minute.`
    }
  } catch (error: any) {
    console.error('Downgrade processing error:', error)
    return {
      success: false,
      message: "I ran into an issue processing your downgrade. The error has been logged.\n\nPlease try again in a few minutes."
    }
  }
}

/**
 * Main downgrade handler entry point
 * Called by the executor when subscriber requests a downgrade
 */
export async function handleDowngradeRequest(
  subscriber: any,
  skillName: string,
  confirmed: boolean = false
): Promise<string> {
  // Step 1: If not confirmed, send confirmation message
  if (!confirmed) {
    return await confirmDowngrade(
      skillName,
      subscriber.current_mrr || 0,
      subscriber.id
    )
  }

  // Step 2: Process the downgrade
  const result = await processDowngrade(subscriber, skillName)

  return result.message
}
