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
    const { subscriberId, phoneNumber, areaCode } = body

    if (!subscriberId || !phoneNumber || !areaCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    const result = await provisionPhoneNumber(subscriberId, phoneNumber, areaCode)

    return NextResponse.json({
      success: true,
      phoneNumber: result.phoneNumber,
      vapiAssistantId: result.vapiAssistantId
    })
  } catch (error: unknown) {
    console.error('Provisioning error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    )
  }
}
