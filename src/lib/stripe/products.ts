/**
 * Stripe Product Price IDs
 * Maps product names to their Stripe price IDs
 */

export const STRIPE_PRICES = {
  // Base Plan
  AGENTOS_BASE: process.env.STRIPE_PRICE_AGENTOS_BASE!,

  // Skills
  SOCIAL_MEDIA_SKILL: process.env.STRIPE_PRICE_SOCIAL_MEDIA_SKILL!,
  LEAD_GENERATION: process.env.STRIPE_PRICE_LEAD_GENERATION!,
  NURTURE_CAMPAIGNS: process.env.STRIPE_PRICE_NURTURE_CAMPAIGNS!,
  QUOTE_FOLLOW_UP: process.env.STRIPE_PRICE_QUOTE_FOLLOW_UP!,
  RENEWAL_ALERTS: process.env.STRIPE_PRICE_RENEWAL_ALERTS!,
  REVIEW_REQUESTS: process.env.STRIPE_PRICE_REVIEW_REQUESTS!,
  REFERRAL_CAMPAIGNS: process.env.STRIPE_PRICE_REFERRAL_CAMPAIGNS!,
  OUTBOUND_CALLING: process.env.STRIPE_PRICE_OUTBOUND_CALLING!,

  // Add-ons
  ANALYTICS_DASHBOARD: process.env.STRIPE_PRICE_ANALYTICS_DASHBOARD!,
  TEAM_ADD_ON: process.env.STRIPE_PRICE_TEAM_ADD_ON!,
} as const

/**
 * Product metadata for display
 */
export const PRODUCT_INFO = {
  AGENTOS_BASE: {
    name: 'AgentOS Base',
    description: 'Complete AI digital employee platform with core features',
    price: 97,
    interval: 'month',
  },
  SOCIAL_MEDIA_SKILL: {
    name: 'Social Media Skill',
    description: 'Automated social media posting and engagement',
    price: 49,
    interval: 'month',
  },
  LEAD_GENERATION: {
    name: 'Lead Generation',
    description: 'Automated lead capture and qualification',
    price: 49,
    interval: 'month',
  },
  NURTURE_CAMPAIGNS: {
    name: 'Nurture Campaigns',
    description: 'Automated email and SMS nurture sequences',
    price: 49,
    interval: 'month',
  },
  QUOTE_FOLLOW_UP: {
    name: 'Quote Follow-Up',
    description: 'Automated quote tracking and follow-up reminders',
    price: 29,
    interval: 'month',
  },
  RENEWAL_ALERTS: {
    name: 'Renewal Alerts',
    description: 'Automated renewal reminders and tracking',
    price: 29,
    interval: 'month',
  },
  REVIEW_REQUESTS: {
    name: 'Review Requests',
    description: 'Automated review request campaigns',
    price: 19,
    interval: 'month',
  },
  REFERRAL_CAMPAIGNS: {
    name: 'Referral Campaigns',
    description: 'Automated referral tracking and rewards',
    price: 29,
    interval: 'month',
  },
  OUTBOUND_CALLING: {
    name: 'Outbound Calling',
    description: 'AI-powered outbound calling and appointment setting',
    price: 49,
    interval: 'month',
  },
  ANALYTICS_DASHBOARD: {
    name: 'Analytics Dashboard',
    description: 'Advanced analytics and reporting dashboard',
    price: 19,
    interval: 'month',
  },
  TEAM_ADD_ON: {
    name: 'Team Add-On',
    description: 'Multi-user access and team collaboration features',
    price: 99,
    interval: 'month',
  },
} as const

/**
 * Map feature names to price IDs
 */
export function getPriceIdForFeature(featureName: string): string | null {
  const mapping: Record<string, string> = {
    'social-media': STRIPE_PRICES.SOCIAL_MEDIA_SKILL,
    'lead-generation': STRIPE_PRICES.LEAD_GENERATION,
    'nurture-campaigns': STRIPE_PRICES.NURTURE_CAMPAIGNS,
    'quote-followup': STRIPE_PRICES.QUOTE_FOLLOW_UP,
    'renewal-alerts': STRIPE_PRICES.RENEWAL_ALERTS,
    'review-requests': STRIPE_PRICES.REVIEW_REQUESTS,
    'referral-campaigns': STRIPE_PRICES.REFERRAL_CAMPAIGNS,
    'outbound-calling': STRIPE_PRICES.OUTBOUND_CALLING,
    'analytics-dashboard': STRIPE_PRICES.ANALYTICS_DASHBOARD,
    'team-addon': STRIPE_PRICES.TEAM_ADD_ON,
  }

  return mapping[featureName] || null
}
