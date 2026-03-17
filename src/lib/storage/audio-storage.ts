/**
 * Audio Storage Helpers
 * Upload and manage audio files in Supabase Storage
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Storage bucket name for audio previews
const AUDIO_BUCKET = 'audio-previews'

/**
 * Create Supabase client with service role for storage operations
 * Service role is needed to bypass RLS for uploads
 */
function getStorageClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Generate unique filename for audio file
 */
function generateAudioFilename(prefix: string, assistantId: string): string {
  const timestamp = Date.now()
  return `${assistantId}/${prefix}-${timestamp}.mp3`
}

/**
 * Upload audio buffer to Supabase Storage
 * Returns public URL to the uploaded file
 */
export async function uploadAudio(
  audioBuffer: Buffer,
  filename: string
): Promise<string> {
  const supabase = getStorageClient()

  try {
    // Upload file to storage
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(filename, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
        upsert: true, // Allow overwriting if file exists
      })

    if (error) {
      console.error('Supabase storage upload error:', error)
      throw new Error(`Storage upload failed: ${error.message}`)
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(filename)

    if (!urlData?.publicUrl) {
      throw new Error('Failed to generate public URL for uploaded audio')
    }

    return urlData.publicUrl
  } catch (error) {
    console.error('Audio upload failed:', error)
    throw new Error(
      `Failed to upload audio: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Upload multiple audio files for a signup session
 * Returns object with URLs for each audio type
 */
export async function uploadAudioPreviews(
  audioBuffers: {
    greeting: Buffer
    message: Buffer
    faq: Buffer
  },
  assistantId: string
): Promise<{
  greeting: string
  message: string
  faq: string
}> {
  try {
    // Generate filenames
    const greetingFilename = generateAudioFilename('greeting', assistantId)
    const messageFilename = generateAudioFilename('message', assistantId)
    const faqFilename = generateAudioFilename('faq', assistantId)

    // Upload all files in parallel
    const [greetingUrl, messageUrl, faqUrl] = await Promise.all([
      uploadAudio(audioBuffers.greeting, greetingFilename),
      uploadAudio(audioBuffers.message, messageFilename),
      uploadAudio(audioBuffers.faq, faqFilename),
    ])

    return {
      greeting: greetingUrl,
      message: messageUrl,
      faq: faqUrl,
    }
  } catch (error) {
    console.error('Audio preview upload failed:', error)
    throw new Error(
      `Failed to upload audio previews: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Delete audio files for a specific assistant
 * Used for cleanup when signup session expires or is abandoned
 */
export async function deleteAudioPreviews(assistantId: string): Promise<void> {
  const supabase = getStorageClient()

  try {
    // List all files in the assistant's folder
    const { data: files, error: listError } = await supabase.storage
      .from(AUDIO_BUCKET)
      .list(assistantId)

    if (listError) {
      console.error('Failed to list audio files:', listError)
      return
    }

    if (!files || files.length === 0) {
      return
    }

    // Delete all files
    const filePaths = files.map((file) => `${assistantId}/${file.name}`)
    const { error: deleteError } = await supabase.storage
      .from(AUDIO_BUCKET)
      .remove(filePaths)

    if (deleteError) {
      console.error('Failed to delete audio files:', deleteError)
      throw new Error(`Failed to delete audio files: ${deleteError.message}`)
    }

    console.log(`Deleted ${files.length} audio files for assistant ${assistantId}`)
  } catch (error) {
    console.error('Audio cleanup failed:', error)
    // Don't throw - cleanup is best-effort
  }
}

/**
 * Ensure the audio-previews bucket exists
 * Should be called during setup/initialization
 */
export async function ensureAudioBucketExists(): Promise<void> {
  const supabase = getStorageClient()

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error('Failed to list buckets:', listError)
      return
    }

    const bucketExists = buckets?.some((bucket) => bucket.name === AUDIO_BUCKET)

    if (!bucketExists) {
      // Create bucket if it doesn't exist
      const { error: createError } = await supabase.storage.createBucket(AUDIO_BUCKET, {
        public: true,
        fileSizeLimit: 5242880, // 5MB limit per file
        allowedMimeTypes: ['audio/mpeg', 'audio/mp3'],
      })

      if (createError) {
        console.error('Failed to create audio bucket:', createError)
        throw new Error(`Failed to create storage bucket: ${createError.message}`)
      }

      console.log(`Created ${AUDIO_BUCKET} storage bucket`)
    }
  } catch (error) {
    console.error('Bucket setup failed:', error)
    // Don't throw - might already exist
  }
}
