/**
 * Train Agent API Route for Signup V2
 * Scrapes website, generates prompt, and creates VAPI assistant
 */

import { NextRequest, NextResponse } from 'next/server'
import { scrapeWebsite } from '@/lib/scraping/website-scraper'
import { generateSystemPrompt } from '@/lib/ai/prompt-generator'
import { createVapiAssistant } from '@/lib/vapi/client'
import { BusinessDetails, AudioSamples } from '@/types/signup-v2'
import { generateAudioPreviews } from '@/lib/vapi/audio-preview'
import { uploadAudioPreviews } from '@/lib/storage/audio-storage'

const VAPI_API_KEY = process.env.VAPI_API_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://theapexbots.com'

interface TrainAgentRequest {
  business: BusinessDetails
}

interface TrainAgentResponse {
  assistant_id: string
  training_complete: boolean
  audio_samples: AudioSamples
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate VAPI API key
    if (!VAPI_API_KEY) {
      return NextResponse.json(
        { error: 'VAPI API key not configured' },
        { status: 500 }
      )
    }

    // Parse request body
    const body: TrainAgentRequest = await request.json()
    const { business } = body

    // Validate business data
    if (!business || !business.name) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      )
    }

    // Simulate realistic training delay for UX (15-20 seconds total)
    // This gives users confidence that real work is happening
    const startTime = Date.now()

    // Step 1: Scrape website (if website provided)
    let websiteContent
    if (business.website) {
      try {
        websiteContent = await scrapeWebsite(business.website, {
          timeout: 10000,
          maxPages: 5,
        })
      } catch (error) {
        console.error('Website scraping failed:', error)
        // Continue without website content - we can still create a basic agent
        websiteContent = {
          title: business.name,
          description: '',
          faqs: [],
          services: [],
          about: '',
          contact_info: {},
          scraped_at: new Date().toISOString(),
        }
      }
    } else {
      // No website provided - create minimal content
      websiteContent = {
        title: business.name,
        description: '',
        faqs: [],
        services: [],
        about: '',
        contact_info: {},
        scraped_at: new Date().toISOString(),
      }
    }

    // Step 2: Generate system prompt from business data
    const systemPrompt = generateSystemPrompt(business, websiteContent)

    // Step 3: Create VAPI assistant
    const assistantConfig = {
      name: `${business.name} - Jordyn AI Assistant`,
      model: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        temperature: 0.7,
        systemPrompt: systemPrompt,
        maxTokens: 500,
      },
      voice: {
        provider: '11labs',
        voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel - Professional, friendly female voice
      },
      firstMessage: `Hi! This is Jordyn calling from ${business.name}. How can I help you today?`,
      recordingEnabled: true,
      endCallFunctionEnabled: true,
      voicemailDetectionEnabled: true,
      silenceTimeoutSeconds: 30,
      maxDurationSeconds: 600, // 10 minute max call
      backgroundSound: 'off',
      serverUrl: `${APP_URL}/api/webhooks/vapi`,
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
      },
    }

    const assistant = await createVapiAssistant(assistantConfig)

    // Step 4: Generate audio previews with ElevenLabs
    console.log('Generating audio previews...')
    const audioBuffers = await generateAudioPreviews(business)

    // Step 5: Upload audio files to Supabase Storage
    console.log('Uploading audio previews to storage...')
    const audioUrls = await uploadAudioPreviews(audioBuffers, assistant.id)

    // Calculate elapsed time and add delay if needed
    // We want the total process to feel like it takes 15-20 seconds
    const elapsedTime = Date.now() - startTime
    const minProcessingTime = 15000 // 15 seconds minimum
    const remainingTime = Math.max(0, minProcessingTime - elapsedTime)

    if (remainingTime > 0) {
      // Add artificial delay to make the process feel more substantial
      await new Promise((resolve) => setTimeout(resolve, remainingTime))
    }

    // Return success response with audio samples
    const audioSamples: AudioSamples = {
      greeting: audioUrls.greeting,
      message: audioUrls.message,
      faq: audioUrls.faq,
    }

    const response: TrainAgentResponse = {
      assistant_id: assistant.id,
      training_complete: true,
      audio_samples: audioSamples,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Train agent error:', error)

    // Return user-friendly error message
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to train agent'

    return NextResponse.json(
      {
        error: errorMessage,
        training_complete: false,
      },
      { status: 500 }
    )
  }
}
