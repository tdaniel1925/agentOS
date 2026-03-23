/**
 * Supabase Client (Browser)
 * Use this in client components and pages
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials:', {
      url: supabaseUrl ? 'Present' : 'MISSING',
      key: supabaseAnonKey ? 'Present' : 'MISSING',
      env: process.env
    })
    throw new Error('Missing Supabase environment variables. Please check your .env.local file and Vercel environment variables.')
  }

  console.log('🔑 Creating Supabase client')

  // Use default Supabase client - it manages cookies automatically with correct names
  const client = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )

  console.log('✅ Supabase browser client created')
  return client
}
