/**
 * Apex Affinity Commission Engine
 * Calculates tiered commissions for rep waterfall
 */

import { createServiceClient } from '../supabase/server'
import type { Database } from '../supabase/types'

type Rep = Database['public']['Tables']['reps']['Row']
type Subscriber = Database['public']['Tables']['subscribers']['Row']

/**
 * Commission tiers (percentage of MRR)
 * Tier 1 (Direct rep): 20%
 * Tier 2 (Upline): 10%
 * Tier 3 (Upline's upline): 5%
 */
const COMMISSION_TIERS = {
  1: 0.20, // 20%
  2: 0.10, // 10%
  3: 0.05, // 5%
}

interface CommissionBreakdown {
  rep_id: string
  rep_name: string
  tier: number
  amount: number
}

/**
 * Calculate commission waterfall for a subscriber event
 */
export async function calculateCommission(params: {
  subscriberId: string
  oldMrr: number
  newMrr: number
  eventType: 'signup' | 'upgrade' | 'downgrade' | 'cancellation'
  stripeEventId: string
}): Promise<CommissionBreakdown[]> {
  const supabase = createServiceClient()
  const { subscriberId, oldMrr, newMrr, eventType, stripeEventId } = params

  // Load subscriber and rep chain
  const queryResult: any = await (supabase as any)
    .from('subscribers')
    .select('*, reps(*)')
    .eq('id', subscriberId)
    .single()

  const subscriber = queryResult.data

  if (!subscriber || !subscriber.rep_id) {
    return [] // No rep assigned, no commission
  }

  // Build rep waterfall chain
  const repChain = await buildRepChain(subscriber.rep_id)

  // Calculate commission for each tier
  const mrrDelta = newMrr - oldMrr
  const breakdown: CommissionBreakdown[] = []

  for (let i = 0; i < repChain.length && i < 3; i++) {
    const rep = repChain[i]
    const tier = i + 1
    const commissionPct = COMMISSION_TIERS[tier as keyof typeof COMMISSION_TIERS]
    const amount = mrrDelta * commissionPct

    breakdown.push({
      rep_id: rep.id,
      rep_name: rep.name,
      tier,
      amount,
    })

    // Insert commission record
    await (supabase as any).from('apex_commissions').insert({
      rep_id: rep.id,
      subscriber_id: subscriberId,
      event_type: eventType,
      old_mrr: oldMrr,
      new_mrr: newMrr,
      mrr_delta: mrrDelta,
      rep_commission: amount,
      waterfall_breakdown: breakdown,
      stripe_event_id: stripeEventId,
    })

    // Update rep totals
    await (supabase as any)
      .from('reps')
      .update({
        total_mrr: rep.total_mrr + mrrDelta,
        total_commission: rep.total_commission + amount,
        last_commission_at: new Date().toISOString(),
      })
      .eq('id', rep.id)
  }

  return breakdown
}

/**
 * Build rep upline chain
 * Returns [direct_rep, upline, upline's_upline, ...]
 */
async function buildRepChain(repId: string): Promise<Rep[]> {
  const supabase = createServiceClient()
  const chain: Rep[] = []

  let currentRepId: string | null = repId

  while (currentRepId && chain.length < 3) {
    const queryResult: any = await (supabase as any)
      .from('reps')
      .select('*')
      .eq('id', currentRepId)
      .single()

    const rep = queryResult.data

    if (!rep) break

    chain.push(rep)
    currentRepId = rep.upline_rep_id
  }

  return chain
}

/**
 * Update subscriber count for rep
 */
export async function updateRepSubscriberCount(
  repId: string,
  delta: number
): Promise<void> {
  const supabase = createServiceClient()

  const queryResult: any = await (supabase as any)
    .from('reps')
    .select('total_subscribers')
    .eq('id', repId)
    .single()

  const rep = queryResult.data

  if (!rep) return

  await (supabase as any)
    .from('reps')
    .update({
      total_subscribers: rep.total_subscribers + delta,
    })
    .eq('id', repId)
}
