/**
 * Phone Number Provisioning API
 */

import { NextRequest, NextResponse } from 'next/server'
import { provisionPhoneNumber } from '@/lib/phone-numbers/provision'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { subscriberId, phoneNumber, areaCode, businessPhone } = body

    if (!subscriberId) {
      return NextResponse.json(
        { error: 'subscriberId is required' },
        { status: 400 }
      )
    }

    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('*')
      .eq('id', subscriberId)
      .single()

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    // Auto-assignment mode: only subscriberId and optional businessPhone needed
    // Manual mode (legacy): subscriberId, phoneNumber, and areaCode required
    const result = await provisionPhoneNumber(
      subscriberId,
      businessPhone,
      phoneNumber,
      areaCode
    )

    return NextResponse.json({
      success: true,
      phoneNumber: result.phoneNumber,
      vapiAssistantId: result.vapiAssistantId,
      autoAssigned: !phoneNumber
    })
  } catch (error: unknown) {
    console.error('Provisioning error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    )
  }
}
