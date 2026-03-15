/**
 * Upgrade Handler Skill
 * Handles subscriber requests to add a new skill
 *
 * Flow:
 * 1. Check if already active
 * 2. Quote the upgrade
 * 3. Get YES confirmation
 * 4. Charge Stripe
 * 5. Activate skill
 * 6. Fire webhook to Apex
 * 7. Update subscriber MRR
 * 8. Confirm to subscriber
 */

import { createServiceClient } from '@/lib/supabase/server'
import { getStripeServer } from '@/lib/stripe/client'
import { fireWebhook } from '@/lib/billing/webhook'
import { sendSMS } from '@/lib/twilio/client'

/**
 * Skill pricing and metadata
 */
export const SKILL_PRICES: Record<string, { price: number; name: string; stripePriceEnvVar: string }> = {
  'social-media': {
    price: 49,
    name: 'Social Media',
    stripePriceEnvVar: 'STRIPE_PRICE_SOCIAL_MEDIA_SKILL'
  },
  'lead-generation': {
    price: 49,
    name: 'Lead Generation',
    stripePriceEnvVar: 'STRIPE_PRICE_LEAD_GENERATION'
  },
  'campaigns': {
    price: 49,
    name: 'Nurture Campaigns',
    stripePriceEnvVar: 'STRIPE_PRICE_NURTURE_CAMPAIGNS'
  },
  'quote-followup': {
    price: 29,
    name: 'Quote Follow-Up',
    stripePriceEnvVar: 'STRIPE_PRICE_QUOTE_FOLLOW_UP'
  },
  'renewal-alerts': {
    price: 29,
    name: 'Renewal Alerts',
    stripePriceEnvVar: 'STRIPE_PRICE_RENEWAL_ALERTS'
  },
  'review-requests': {
    price: 19,
    name: 'Review Requests',
    stripePriceEnvVar: 'STRIPE_PRICE_REVIEW_REQUESTS'
  },
  'referral-campaigns': {
    price: 29,
    name: 'Referral Campaigns',
    stripePriceEnvVar: 'STRIPE_PRICE_REFERRAL_CAMPAIGNS'
  },
  'outbound-calling': {
    price: 49,
    name: 'Outbound Calling',
    stripePriceEnvVar: 'STRIPE_PRICE_OUTBOUND_CALLING'
  },
  'analytics': {
    price: 19,
    name: 'Analytics',
    stripePriceEnvVar: 'STRIPE_PRICE_ANALYTICS_DASHBOARD'
  },
  'team-addon': {
    price: 99,
    name: 'Team Add-On',
    stripePriceEnvVar: 'STRIPE_PRICE_TEAM_ADD_ON'
  }
}

/**
 * Get skill example commands for confirmation messages
 */
function getSkillExample(skillName: string): string {
  const examples: Record<string, string> = {
    'social-media': 'create a post about winter safety tips',
    'lead-generation': 'find me 20 commercial property owners in Houston',
    'campaigns': 'create a campaign for new homebuyers',
    'quote-followup': 'remind me about the Smith quote next week',
    'renewal-alerts': 'track renewals for my P&C clients',
    'review-requests': 'ask my recent clients for reviews',
    'referral-campaigns': 'start a referral program',
    'outbound-calling': 'call my leads about the new coverage options',
    'analytics': 'show me my top performing campaigns',
    'team-addon': 'add my assistant to the account'
  }
  return examples[skillName] || 'ask me what I can do'
}

/**
 * Check if subscriber already has this skill active
 */
export async function checkIfSkillActive(
  subscriberId: string,
  skillName: string
): Promise<boolean> {
  const supabase = createServiceClient()

  const { data: feature } = await supabase
    .from('feature_flags')
    .select('enabled')
    .eq('subscriber_id', subscriberId)
    .eq('feature_name', skillName)
    .single()

  return feature?.enabled === true
}

/**
 * Quote the upgrade to the subscriber
 * Returns the quote message
 */
export async function quoteUpgrade(
  skillName: string,
  currentMRR: number
): Promise<string> {
  const skill = SKILL_PRICES[skillName]
  if (!skill) {
    return `I don't recognize that skill. Available skills: ${Object.keys(SKILL_PRICES).join(', ')}`
  }

  const benefits: Record<string, string[]> = {
    'social-media': [
      'Professional posts for Facebook, Instagram, LinkedIn',
      'AI-generated content tailored to your brand',
      'Scheduled posting and engagement tracking'
    ],
    'lead-generation': [
      'AI-powered prospect research',
      'Targeted contact list building',
      'Lead quality scoring and CSV exports'
    ],
    'campaigns': [
      'Multi-email nurture sequences',
      'Personalized outreach at scale',
      'Campaign performance tracking'
    ],
    'quote-followup': [
      'Automated quote reminders',
      'Follow-up sequence management',
      'Never miss a quote expiration'
    ],
    'renewal-alerts': [
      'Automated renewal notifications',
      'Client retention tracking',
      'Proactive renewal outreach'
    ],
    'review-requests': [
      'Automated review campaigns',
      'Multi-platform review collection',
      'Reputation management automation'
    ],
    'referral-campaigns': [
      'Automated referral tracking',
      'Incentive management',
      'Word-of-mouth growth automation'
    ],
    'outbound-calling': [
      'AI-powered phone calls',
      'Appointment setting automation',
      'Call summaries and transcripts'
    ],
    'analytics': [
      'Advanced performance dashboards',
      'Campaign ROI tracking',
      'Actionable insights and reports'
    ],
    'team-addon': [
      'Multi-user access',
      'Team collaboration features',
      'Permission management'
    ]
  }

  const skillBenefits = benefits[skillName] || ['Enhanced capabilities', 'Advanced features', 'Expanded functionality']
  const newTotal = currentMRR + skill.price

  return `${skill.name} adds:
• ${skillBenefits[0]}
• ${skillBenefits[1]}
• ${skillBenefits[2]}

Cost: +$${skill.price}/month
Your new total: $${newTotal}/month

Reply YES to add it or SKIP to do later.`
}

/**
 * Process the upgrade
 * Charges Stripe, activates skill, fires webhook to Apex
 */
export async function processUpgrade(
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
        message: "I couldn't process your upgrade right now. The issue has been logged.\n\nTry again in a few minutes, or contact support if this continues."
      }
    }

    // ── Step 2: Charge Stripe ────────────────────────
    const idempotencyKey = `upgrade_${subscriber.id}_${skillName}_${Date.now()}`

    let invoice
    try {
      // Add the skill price to the existing subscription
      const subscription = await stripe.subscriptions.update(
        subscriber.stripe_subscription_id,
        {
          items: [{ price: stripePriceId }],
          proration_behavior: 'always_invoice'
        },
        { idempotencyKey }
      )

      // Get the invoice from the subscription
      invoice = subscription.latest_invoice
      if (typeof invoice === 'string') {
        // Fetch the full invoice object
        invoice = await stripe.invoices.retrieve(invoice)
      }
    } catch (stripeError: any) {
      console.error('Stripe charge failed:', stripeError)

      // Handle specific Stripe errors
      if (stripeError.code === 'card_declined') {
        return {
          success: false,
          message: "Your card was declined. Please update your payment method:\n\napp.hireyourbot.com/billing\n\nOnce updated, text me back and I'll add " + skill.name + "."
        }
      }

      return {
        success: false,
        message: "Payment didn't go through — " + stripeError.message + "\n\nUpdate your card here: app.hireyourbot.com/billing"
      }
    }

    // ── Step 3: Activate skill in Supabase ───────────
    const { error: flagError } = await supabase
      .from('feature_flags')
      .upsert({
        subscriber_id: subscriber.id,
        feature_name: skillName,
        enabled: true,
        enabled_at: new Date().toISOString(),
        price_add_on: skill.price,
        skill_name: skillName
      })

    if (flagError) {
      console.error('Error activating skill:', flagError)
      // Continue anyway — skill was charged
    }

    // ── Step 4: Fire webhook to Apex ─────────────────
    const mrr_before = subscriber.current_mrr || 0
    const mrr_after = mrr_before + skill.price

    await fireWebhook('subscriber.upgraded', {
      subscriber_id: subscriber.id,
      subscriber_name: subscriber.business_name,
      subscriber_email: subscriber.email,
      rep_code: subscriber.rep_code || 'UNKNOWN',
      skill_changed: skillName,
      mrr_before,
      mrr_after,
      mrr_delta: skill.price,
      total_mrr: mrr_after,
      stripe_subscription_id: subscriber.stripe_subscription_id,
      stripe_invoice_id: invoice.id
    })

    // ── Step 5: Update subscriber MRR ────────────────
    await supabase
      .from('subscribers')
      .update({ current_mrr: mrr_after })
      .eq('id', subscriber.id)

    // ── Step 6: Return success ───────────────────────
    const example = getSkillExample(skillName)
    return {
      success: true,
      message: `Done! I just learned ${skill.name}.\n\nTry it: '${example}'`
    }
  } catch (error: any) {
    console.error('Upgrade processing error:', error)
    return {
      success: false,
      message: "I ran into an issue processing your upgrade. The error has been logged.\n\nPlease try again in a few minutes."
    }
  }
}

/**
 * Main upgrade handler entry point
 * Called by the executor when subscriber requests an upgrade
 */
export async function handleUpgradeRequest(
  subscriber: any,
  skillName: string,
  confirmed: boolean = false
): Promise<string> {
  // Step 1: Check if already active
  const isActive = await checkIfSkillActive(subscriber.id, skillName)
  if (isActive) {
    const example = getSkillExample(skillName)
    return `You already have ${SKILL_PRICES[skillName]?.name || skillName} active!\n\nTry: '${example}'`
  }

  // Step 2: If not confirmed, send quote
  if (!confirmed) {
    return await quoteUpgrade(skillName, subscriber.current_mrr || 0)
  }

  // Step 3: Process the upgrade
  const result = await processUpgrade(subscriber, skillName)

  return result.message
}
