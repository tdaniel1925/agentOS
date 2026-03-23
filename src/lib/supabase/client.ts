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

  // Use localStorage instead of cookies temporarily for debugging
  const client = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        storage: {
          getItem: (key: string) => {
            if (typeof window === 'undefined') return null
            try {
              const value = window.localStorage.getItem(key)
              console.log('🔑 LocalStorage get:', key, value ? 'Found' : 'Not found')
              return value
            } catch (e) {
              console.error('🔑 LocalStorage get error:', e)
              return null
            }
          },
          setItem: (key: string, value: string) => {
            if (typeof window === 'undefined') return
            try {
              window.localStorage.setItem(key, value)
              console.log('🔑 LocalStorage set:', key, '✅')
            } catch (e) {
              console.error('🔑 LocalStorage set error:', e)
            }
          },
          removeItem: (key: string) => {
            if (typeof window === 'undefined') return
            try {
              window.localStorage.removeItem(key)
              console.log('🔑 LocalStorage remove:', key)
            } catch (e) {
              console.error('🔑 LocalStorage remove error:', e)
            }
          }
        },
        storageKey: 'supabase-auth-token',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  )

  console.log('✅ Supabase client created')
  return client
}
