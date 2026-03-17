/**
 * API Route: Generate Audio Previews
 * POST /api/signup/generate-audio-previews
 *
 * Generates audio samples for a business using ElevenLabs TTS
 * and uploads them to Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server'
import type { BusinessDetails, AudioSamples } from '@/types/signup-v2'
import { generateAudioPreviews } from '@/lib/vapi/audio-preview'
import { uploadAudioPreviews } from '@/lib/storage/audio-storage'

interface GenerateAudioRequest {
  business: BusinessDetails
  assistant_id: string
}

/**
 * POST handler for audio preview generation
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body: GenerateAudioRequest = await request.json()

    // Validate required fields
    if (!body.business) {
      return NextResponse.json(
        { error: 'Business details are required' },
        { status: 400 }
      )
    }

    if (!body.assistant_id) {
      return NextResponse.json(
        { error: 'Assistant ID is required' },
        { status: 400 }
      )
    }

    // Validate business has required fields
    if (!body.business.name) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      )
    }

    console.log(`Generating audio previews for business: ${body.business.name}`)

    // Generate audio buffers using ElevenLabs
    const audioBuffers = await generateAudioPreviews(body.business)

    console.log('Audio generation complete. Uploading to storage...')

    // Upload to Supabase Storage
    const audioUrls = await uploadAudioPreviews(audioBuffers, body.assistant_id)

    console.log('Audio previews uploaded successfully')

    // Return audio sample URLs
    const response: AudioSamples = {
      greeting: audioUrls.greeting,
      message: audioUrls.message,
      faq: audioUrls.faq,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Audio preview generation failed:', error)

    // Determine error type and return appropriate response
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('ELEVENLABS_API_KEY')) {
        return NextResponse.json(
          { error: 'Audio service is not configured. Please contact support.' },
          { status: 503 }
        )
      }

      if (error.message.includes('ElevenLabs TTS failed')) {
        return NextResponse.json(
          { error: 'Failed to generate audio samples. Please try again.' },
          { status: 500 }
        )
      }

      if (error.message.includes('Storage upload failed')) {
        return NextResponse.json(
          { error: 'Failed to save audio files. Please try again.' },
          { status: 500 }
        )
      }

      // Generic error with message
      return NextResponse.json(
        { error: `Audio generation failed: ${error.message}` },
        { status: 500 }
      )
    }

    // Unknown error
    return NextResponse.json(
      { error: 'An unexpected error occurred while generating audio previews' },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
}
