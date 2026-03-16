/**
 * API Route: Send Email Draft
 * POST /api/email/send
 * Sends an email draft via Microsoft Graph API
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendDraftEmail } from '@/lib/skills/email-send'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { draftId, subscriberId } = body

    // Validate inputs
    if (!draftId || !subscriberId) {
      return NextResponse.json(
        { success: false, message: 'Missing draftId or subscriberId' },
        { status: 400 }
      )
    }

    console.log('[API] Sending draft:', draftId, 'for subscriber:', subscriberId)

    // Send the draft
    const result = await sendDraftEmail({
      draftId,
      subscriberId,
    })

    if (!result.success) {
      console.error('[API] Send failed:', result.message)
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }

    console.log('[API] Send successful')
    return NextResponse.json(
      { success: true, message: result.message },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Send error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
