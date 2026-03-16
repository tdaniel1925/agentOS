/**
 * Phone Number Search API
 *
 * GET /api/phone-numbers/search?areaCode=415&limit=10
 *
 * Searches available Twilio phone numbers by area code
 * Returns list of available numbers with locality info
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchAvailableNumbers, getAreaCodeFromZip } from '@/lib/phone-numbers/provision'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const areaCodeParam = searchParams.get('areaCode')
    const zipCode = searchParams.get('zipCode')
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const subscriberId = searchParams.get('subscriberId')

    // Optional: verify subscriber if ID provided
    if (subscriberId) {
      const { data: subscriber, error: subError } = await supabase
        .from('subscribers')
        .select('id, stripe_subscription_status')
        .eq('id', subscriberId)
        .single()

      if (subError || !subscriber) {
        return NextResponse.json(
          { error: 'Subscriber not found' },
          { status: 404 }
        )
      }

      // Check if subscriber already has a phone number
      const { data: existingNumber } = await supabase
        .from('subscriber_phone_numbers')
        .select('phone_number, status')
        .eq('subscriber_id', subscriberId)
        .eq('status', 'active')
        .single()

      if (existingNumber) {
        return NextResponse.json(
          {
            error: 'You already have an active phone number',
            existingNumber: existingNumber.phone_number
          },
          { status: 400 }
        )
      }
    }

    // Get area code (from param or derive from zip)
    let areaCode: string
    if (areaCodeParam) {
      areaCode = areaCodeParam
    } else if (zipCode) {
      areaCode = await getAreaCodeFromZip(zipCode)
    } else {
      return NextResponse.json(
        { error: 'Either areaCode or zipCode parameter required' },
        { status: 400 }
      )
    }

    // Search for available numbers
    const availableNumbers = await searchAvailableNumbers(areaCode, limit)

    if (availableNumbers.length === 0) {
      return NextResponse.json(
        {
          error: 'No available numbers found in this area code',
          areaCode,
          suggestion: 'Try a different area code or zip code'
        },
        { status: 404 }
      )
    }

    // Log the search if subscriber ID provided
    if (subscriberId) {
      await supabase
        .from('commands_log')
        .insert({
          subscriber_id: subscriberId,
          channel: 'api',
          raw_message: `Phone number search: ${areaCode}`,
          skill_triggered: 'phone_number_search',
          success: true,
          metadata: {
            area_code: areaCode,
            results_count: availableNumbers.length,
            zip_code: zipCode
          }
        })
    }

    return NextResponse.json({
      success: true,
      areaCode,
      count: availableNumbers.length,
      numbers: availableNumbers
    })

  } catch (error: unknown) {
    console.error('❌ Phone number search error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      {
        error: 'Failed to search for phone numbers',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
