/**
 * Setup Storage Bucket API
 * Creates and configures the audio-previews bucket
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

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      return NextResponse.json(
        { error: `Failed to list buckets: ${listError.message}` },
        { status: 500 }
      )
    }

    const bucketExists = buckets?.some((bucket) => bucket.name === 'audio-previews')

    if (bucketExists) {
      return NextResponse.json({
        message: 'Bucket already exists',
        bucket: 'audio-previews',
        status: 'exists'
      })
    }

    // Create bucket
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('audio-previews', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['audio/mpeg', 'audio/mp3'],
    })

    if (createError) {
      return NextResponse.json(
        { error: `Failed to create bucket: ${createError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Bucket created successfully',
      bucket: 'audio-previews',
      status: 'created',
      config: {
        public: true,
        fileSizeLimit: '5MB',
        allowedMimeTypes: ['audio/mpeg', 'audio/mp3']
      }
    })

  } catch (error) {
    console.error('Storage setup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const audioBucket = buckets?.find(b => b.name === 'audio-previews')

    return NextResponse.json({
      buckets: buckets?.map(b => ({ name: b.name, public: b.public })),
      audioBucket: audioBucket || null,
      status: audioBucket ? 'exists' : 'missing'
    })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
