/**
 * Shared Types for Signup V2 (Rosie-Style Flow)
 * All agents reference these interfaces
 */

export interface BusinessDetails {
  name: string
  phone: string | null
  website: string | null
  address: string
  hours: object | null
  rating: number | null
  review_count: number | null
  place_id: string
  formatted_address: string
  latitude: number
  longitude: number
}

export interface BusinessPrediction {
  place_id: string
  name: string
  address: string
}

export interface AudioSamples {
  greeting: string  // URL to audio file
  message: string   // URL to audio file
  faq: string       // URL to audio file
}

export interface TrainingProgress {
  step: number          // 1-4
  message: string       // Display message
  complete: boolean     // Is this step done?
  percentage: number    // 0-100
}

export interface WebsiteContent {
  title: string
  description: string
  faqs: Array<{ question: string; answer: string }>
  services: string[]
  about: string
  contact_info: object
  scraped_at: string
}

export interface SignupSession {
  session_id: string
  business_details: BusinessDetails
  website_content: WebsiteContent | null
  assistant_id: string | null
  audio_samples: AudioSamples | null
  status: 'lookup' | 'training' | 'preview' | 'claiming' | 'complete'
  created_at: string
}
