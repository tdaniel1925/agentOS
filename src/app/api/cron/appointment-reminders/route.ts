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
    // Cron auth: Only enforce in production with VERCEL_ENV=production
    const isProduction = process.env.VERCEL_ENV === 'production'
    const cronSecret = process.env.CRON_SECRET

    if (isProduction && cronSecret) {
      const authHeader = req.headers.get('authorization')
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.error('[Cron] Unauthorized access attempt in production')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
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
