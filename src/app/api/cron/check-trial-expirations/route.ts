/**
 * Cron Job: Check Trial Expirations
 * Called by Vercel Cron or external scheduler
 * Sends trial reminders and pauses expired trials
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkTrialExpirations } from '@/lib/cron/trial-expiration'

/**
 * GET /api/cron/check-trial-expirations
 *
 * Checks all trialing subscribers:
 * - Day 5: Send reminder email (2 days left)
 * - Day 7+: Pause features and send expiration email
 *
 * Returns: { checked: N, reminded: N, paused: N, errors: [...] }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Run trial expiration checks
    const result = await checkTrialExpirations()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      checked: result.checked,
      reminded: result.reminded,
      expired: result.expired,
      errors: result.errors
    })
  } catch (error) {
    console.error('Trial expiration cron job failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cron/check-trial-expirations
 * Alternative endpoint for POST-based cron schedulers
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return GET(request)
}
