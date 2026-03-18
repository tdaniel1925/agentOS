/**
 * Supabase Client (Browser)
 * Use this in client components and pages
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  // TEMPORARY: Hardcoded values for debugging
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xxxtbzypheuiniuqynas.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHRienlwaGV1aW5pdXF5bmFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0Njk0NzEsImV4cCI6MjA4OTA0NTQ3MX0.FQ2DV4JbA63YHV8gWX_AcTWa5R7gjFFT5DY6SyYHbf0'

  console.log('🔑 Creating Supabase client with:', {
    url: supabaseUrl,
    keyPreview: supabaseAnonKey.slice(0, 20) + '...' + supabaseAnonKey.slice(-20),
    keyLength: supabaseAnonKey.length
  })

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
}
