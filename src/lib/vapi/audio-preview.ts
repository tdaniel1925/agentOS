/**
 * VAPI Audio Preview Generation
 * Generates audio samples using ElevenLabs TTS for preview purposes
 */

import type { BusinessDetails, AudioSamples } from '@/types/signup-v2'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'

// Default voice ID for professional business agent (Rachel - warm, professional female voice)
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'

interface ElevenLabsVoiceSettings {
  stability: number
  similarity_boost: number
  style?: number
  use_speaker_boost?: boolean
}

const DEFAULT_VOICE_SETTINGS: ElevenLabsVoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true,
}

/**
 * Generate greeting message based on business details
 */
function generateGreetingText(business: BusinessDetails): string {
  const businessName = business.name
  return `Hi, this is Jordyn calling from ${businessName}. How can I help you today?`
}

/**
 * Generate message taking example
 */
function generateMessageText(business: BusinessDetails): string {
  const businessName = business.name
  return `I'd be happy to take a message and have someone from ${businessName} call you back. What's the best number to reach you?`
}

/**
 * Generate FAQ response based on business type
 * This is a simple example - can be enhanced with industry-specific responses
 */
function generateFaqText(business: BusinessDetails): string {
  const businessName = business.name

  // Extract potential hours from business details
  if (business.hours && typeof business.hours === 'object' && Object.keys(business.hours).length > 0) {
    return `Our business hours vary by day. Let me check when we're open. Is there a specific day you'd like to visit ${businessName}?`
  }

  // Fallback FAQ response
  return `Thanks for your question about ${businessName}. Let me connect you with someone who can give you the most accurate information about that.`
}

/**
 * Generate audio using ElevenLabs TTS API
 * Returns audio buffer
 */
async function generateAudioWithElevenLabs(
  text: string,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<Buffer> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not configured')
  }

  const response = await fetch(
    `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: DEFAULT_VOICE_SETTINGS,
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ElevenLabs TTS failed: ${response.status} - ${errorText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Generate all audio previews for a business
 * Returns audio buffers for greeting, message, and FAQ
 */
export async function generateAudioPreviews(
  business: BusinessDetails
): Promise<{
  greeting: Buffer
  message: Buffer
  faq: Buffer
}> {
  try {
    // Generate text for each sample
    const greetingText = generateGreetingText(business)
    const messageText = generateMessageText(business)
    const faqText = generateFaqText(business)

    // Generate audio in parallel for faster processing
    const [greetingAudio, messageAudio, faqAudio] = await Promise.all([
      generateAudioWithElevenLabs(greetingText),
      generateAudioWithElevenLabs(messageText),
      generateAudioWithElevenLabs(faqText),
    ])

    return {
      greeting: greetingAudio,
      message: messageAudio,
      faq: faqAudio,
    }
  } catch (error) {
    console.error('Audio preview generation failed:', error)
    throw new Error(
      `Failed to generate audio previews: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate single audio preview
 * Useful for testing or custom messages
 */
export async function generateSingleAudioPreview(
  text: string,
  voiceId?: string
): Promise<Buffer> {
  return generateAudioWithElevenLabs(text, voiceId)
}
