import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { checkEmail } from '@/lib/skills/email-check'

export async function POST(req: NextRequest) {
  try {
    const { subscriberId } = await req.json()

    if (!subscriberId) {
      return NextResponse.json(
        { error: 'subscriberId required' },
        { status: 400 }
      )
    }

    // Get subscriber
    const supabase = createServiceClient()
    const { data: subscriber, error } = await (supabase as any)
      .from('subscribers')
      .select('*')
      .eq('id', subscriberId)
      .single()

    if (error || !subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    // Trigger email check
    await checkEmail({ subscriber })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email check API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
