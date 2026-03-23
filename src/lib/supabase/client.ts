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

  console.log('🔑 Creating Supabase client with:', {
    url: supabaseUrl,
    keyPrefix: supabaseAnonKey.slice(0, 20),
    keyLength: supabaseAnonKey.length,
    keyType: supabaseAnonKey.startsWith('sb_publishable_') ? 'NEW_PUBLISHABLE_KEY' : 'LEGACY_JWT_KEY'
  })

  // Configure to use cookies that server can read
  const client = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          const value = document.cookie.split('; ').find(row => row.startsWith(`${name}=`))?.split('=')[1]
          console.log('🍪 Browser: Get cookie', name, value ? '✅ Found' : '❌ Not found')
          return value
        },
        set(name: string, value: string, options: any) {
          let cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`
          if (window.location.protocol === 'https:') {
            cookie += '; Secure'
          }
          document.cookie = cookie
          console.log('🍪 Browser: Set cookie', name, '✅')
        },
        remove(name: string, options: any) {
          document.cookie = `${name}=; path=/; max-age=0`
          console.log('🍪 Browser: Remove cookie', name, '✅')
        }
      }
    }
  )

  console.log('✅ Supabase browser client created with cookie storage')
  return client
}
