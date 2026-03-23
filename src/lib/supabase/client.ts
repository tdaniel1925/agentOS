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

  // Let Supabase handle cookies automatically - don't override
  const client = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        flowType: 'pkce',
        storage: {
          getItem: (key: string) => {
            if (typeof window === 'undefined') return null
            const value = document.cookie
              .split('; ')
              .find(row => row.startsWith(`${key}=`))
              ?.split('=')[1]
            console.log('🔑 Storage get:', key, value ? 'Found' : 'Not found')
            return value || null
          },
          setItem: (key: string, value: string) => {
            if (typeof window === 'undefined') return

            // Set cookie with proper attributes for cross-page persistence
            const cookieString = [
              `${key}=${value}`,
              'path=/',
              'max-age=31536000', // 1 year
              'SameSite=Lax',
              window.location.protocol === 'https:' ? 'Secure' : ''
            ].filter(Boolean).join('; ')

            document.cookie = cookieString
            console.log('🔑 Storage set:', key, '✅')
          },
          removeItem: (key: string) => {
            if (typeof window === 'undefined') return
            document.cookie = `${key}=; path=/; max-age=0`
            console.log('🔑 Storage remove:', key)
          }
        }
      }
    }
  )

  console.log('✅ Supabase client created')
  return client
}
