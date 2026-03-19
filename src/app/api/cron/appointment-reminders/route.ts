/**
 * Appointment Reminders Cron Job
 * Runs every 5 minutes to check and send appointment reminders
 *
 * Setup in vercel.json:
 * Add this cron job with schedule: "every 5 minutes"
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendAppointmentReminders } from '@/lib/calendar/reminders'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds max

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret (Vercel sets this header)
    // Skip auth in test/dev mode for easier testing
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const isTestMode = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development'

    if (cronSecret && !isTestMode && authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron] Invalid authorization')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Cron] Starting appointment reminders check...')
    const startTime = Date.now()

    const result = await sendAppointmentReminders()

    const duration = Date.now() - startTime
    console.log(`[Cron] Completed in ${duration}ms`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration,
      ...result
    })

  } catch (error) {
    console.error('[Cron] Error:', error)
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

// Allow POST as well (for manual triggering)
export async function POST(req: NextRequest) {
  return GET(req)
}
