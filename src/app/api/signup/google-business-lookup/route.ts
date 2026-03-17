/**
 * API Route: Google Business Lookup
 * POST /api/signup/google-business-lookup
 *
 * Searches for businesses by name using Google Places Autocomplete
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchBusinesses } from '@/lib/google/places'
import { BusinessPrediction } from '@/types/signup-v2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface LookupRequestBody {
  query: string
}

interface LookupResponse {
  success: boolean
  predictions: BusinessPrediction[]
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<LookupResponse>> {
  try {
    // Parse request body
    const body: LookupRequestBody = await request.json()

    // Validate input
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          predictions: [],
          error: 'Query parameter is required and must be a string',
        },
        { status: 400 }
      )
    }

    const query = body.query.trim()

    if (query.length === 0) {
      return NextResponse.json(
        {
          success: false,
          predictions: [],
          error: 'Query cannot be empty',
        },
        { status: 400 }
      )
    }

    if (query.length < 2) {
      return NextResponse.json(
        {
          success: false,
          predictions: [],
          error: 'Query must be at least 2 characters',
        },
        { status: 400 }
      )
    }

    // Search for businesses
    const predictions = await searchBusinesses(query)

    return NextResponse.json(
      {
        success: true,
        predictions,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in google-business-lookup:', error)

    return NextResponse.json(
      {
        success: false,
        predictions: [],
        error: error instanceof Error ? error.message : 'Failed to search businesses',
      },
      { status: 500 }
    )
  }
}
