import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type SubscriberUsageUpdate = Database['public']['Tables']['subscriber_usage']['Update']

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()
    const { subscriberId, spendingLimit } = body as { subscriberId: string; spendingLimit: number }

    if (!subscriberId || !spendingLimit) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (spendingLimit < 97) {
      return NextResponse.json(
        { error: 'Spending limit cannot be less than $97' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Update current billing period
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('subscriber_usage')
      // @ts-ignore - Supabase generated types have issues with update operations
      .update({
        spending_limit: spendingLimit
      })
      .eq('subscriber_id', subscriberId)
      .lte('billing_period_start', now)
      .gte('billing_period_end', now)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update limits error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
