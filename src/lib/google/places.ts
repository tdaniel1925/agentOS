/**
 * Google Places API Client
 * Handles business lookup and details fetching
 */

import { BusinessDetails, BusinessPrediction } from '@/types/signup-v2'

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

if (!GOOGLE_PLACES_API_KEY) {
  throw new Error('GOOGLE_PLACES_API_KEY is not set in environment variables')
}

const PLACES_API_BASE = 'https://places.googleapis.com/v1'

interface GooglePlacesPrediction {
  place: string
  displayName: {
    text: string
  }
  formattedAddress: string
}

interface GooglePlaceDetails {
  id: string
  displayName: {
    text: string
  }
  formattedAddress: string
  location: {
    latitude: number
    longitude: number
  }
  internationalPhoneNumber?: string
  nationalPhoneNumber?: string
  websiteUri?: string
  regularOpeningHours?: {
    openNow?: boolean
    periods?: Array<{
      open: { day: number; hour: number; minute: number }
      close: { day: number; hour: number; minute: number }
    }>
    weekdayDescriptions?: string[]
  }
  rating?: number
  userRatingCount?: number
}

/**
 * Search for businesses by name/query
 * Uses Google Places API (New) Autocomplete
 */
export async function searchBusinesses(query: string): Promise<BusinessPrediction[]> {
  if (!query || query.trim().length === 0) {
    return []
  }

  try {
    const response = await fetch(`${PLACES_API_BASE}/places:autocomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      },
      body: JSON.stringify({
        input: query,
        includedPrimaryTypes: ['establishment'],
        languageCode: 'en',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Google Places Autocomplete error:', error)
      throw new Error(`Google Places API error: ${response.status}`)
    }

    const data = await response.json()
    const suggestions = data.suggestions || []

    // Map Google's format to our BusinessPrediction interface
    const predictions: BusinessPrediction[] = suggestions
      .filter((s: { placePrediction?: GooglePlacesPrediction }) => s.placePrediction)
      .map((s: { placePrediction: GooglePlacesPrediction }) => ({
        place_id: s.placePrediction.place.split('/').pop() || '',
        name: s.placePrediction.displayName.text,
        address: s.placePrediction.formattedAddress,
      }))

    return predictions
  } catch (error) {
    console.error('Error searching businesses:', error)
    throw new Error('Failed to search businesses')
  }
}

/**
 * Get detailed business information by place ID
 * Uses Google Places API (New) Place Details
 */
export async function getBusinessDetails(placeId: string): Promise<BusinessDetails> {
  if (!placeId || placeId.trim().length === 0) {
    throw new Error('Place ID is required')
  }

  try {
    const response = await fetch(
      `${PLACES_API_BASE}/places/${placeId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': [
            'id',
            'displayName',
            'formattedAddress',
            'location',
            'internationalPhoneNumber',
            'nationalPhoneNumber',
            'websiteUri',
            'regularOpeningHours',
            'rating',
            'userRatingCount',
          ].join(','),
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Google Places Details error:', error)
      throw new Error(`Google Places API error: ${response.status}`)
    }

    const place: GooglePlaceDetails = await response.json()

    // Map Google's format to our BusinessDetails interface
    const businessDetails: BusinessDetails = {
      place_id: placeId,
      name: place.displayName.text,
      formatted_address: place.formattedAddress,
      address: place.formattedAddress,
      latitude: place.location.latitude,
      longitude: place.location.longitude,
      phone: place.internationalPhoneNumber || place.nationalPhoneNumber || null,
      website: place.websiteUri || null,
      hours: place.regularOpeningHours || null,
      rating: place.rating || null,
      review_count: place.userRatingCount || null,
    }

    return businessDetails
  } catch (error) {
    console.error('Error fetching business details:', error)
    throw new Error('Failed to fetch business details')
  }
}

/**
 * Validate if a place ID exists and is accessible
 */
export async function validatePlaceId(placeId: string): Promise<boolean> {
  try {
    await getBusinessDetails(placeId)
    return true
  } catch {
    return false
  }
}
