/**
 * Update Storage Bucket to Public
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Update bucket to be public
    const { data, error } = await supabase.storage.updateBucket('audio-previews', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav'],
    })

    if (error) {
      console.error('Failed to update bucket:', error)
      return NextResponse.json(
        { error: `Failed to update bucket: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Bucket updated to public successfully',
      bucket: 'audio-previews',
      config: {
        public: true,
        fileSizeLimit: '5MB',
        allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav']
      }
    })

  } catch (error) {
    console.error('Storage update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
