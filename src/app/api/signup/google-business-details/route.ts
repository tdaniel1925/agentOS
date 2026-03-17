/**
 * API Route: Google Business Details
 * POST /api/signup/google-business-details
 *
 * Fetches detailed business information from Google Places API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBusinessDetails } from '@/lib/google/places'
import { BusinessDetails } from '@/types/signup-v2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface DetailsRequestBody {
  place_id: string
}

interface DetailsResponse {
  success: boolean
  business?: BusinessDetails
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<DetailsResponse>> {
  try {
    // Parse request body
    const body: DetailsRequestBody = await request.json()

    // Validate input
    if (!body.place_id || typeof body.place_id !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'place_id parameter is required and must be a string',
        },
        { status: 400 }
      )
    }

    const placeId = body.place_id.trim()

    if (placeId.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'place_id cannot be empty',
        },
        { status: 400 }
      )
    }

    // Fetch business details
    const business = await getBusinessDetails(placeId)

    return NextResponse.json(
      {
        success: true,
        business,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in google-business-details:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch business details',
      },
      { status: 500 }
    )
  }
}
